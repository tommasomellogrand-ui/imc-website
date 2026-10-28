export function aggregate(matches, awards, kind, names={}) {
  const rows=new Map();
  const get=(id,name)=>{if(!rows.has(id))rows.set(id,{id,name,seasons:new Set(),teams:new Set(),played:0,won:0,drawn:0,lost:0,gf:0,ga:0,titles:0});return rows.get(id);};
  for(const m of matches)for(const side of ['home','away']){
    const id=kind==='manager'?m[side+'_manager']:m[side+'_id'];if(!id)continue;
    const r=get(id,kind==='manager'?(names[id]||id):m[side+'_name']);
    const gf=m[side+'_score'],ga=m[(side==='home'?'away':'home')+'_score'];
    r.seasons.add(m.season);r.teams.add(m[side+'_name']);r.played++;r.gf+=gf;r.ga+=ga;
    if(gf>ga)r.won++;else if(gf<ga)r.lost++;else r.drawn++;
  }
  for(const a of awards){const id=kind==='manager'?a.manager:a.winner_id;if(!id)continue;get(id,kind==='manager'?(names[id]||id):a.winner).titles++;}
  return [...rows.values()].sort((a,b)=>b.played-a.played||b.won-a.won||a.name.localeCompare(b.name,'it'));
}
export function leaders(rows,key){const n=Math.max(0,...rows.map(r=>r[key]));return n>0?{value:n,rows:rows.filter(r=>r[key]===n)}:null;}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s+'T12:00:00').toLocaleDateString('it-IT'):'Data non disponibile';
const empty=s=>`<p class="empty">${escape(s)}</p>`;
const nexusLink=c=>'/nexus/competitions/?'+new URLSearchParams({world:'GW001',season:c.season,competition:c.key,name:c.name,tab:c.action==='league'?'standings':'results',...(c.custom?{group:'IMC',family:'imc-cups'}:{})});
if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);let data=null;let renderId=0;
  const filters=()=>({scope:$('scope').value,season:$('season').value,key:$('competition').value});
  const matching=(r,f)=>r.scope===f.scope&&(!f.season||String(r.season)===f.season)&&(!f.key||r.key===f.key);
  function options(){
    const f=filters();const comps=new Map();
    for(const c of data.competitions)if(c.scope===f.scope&&(!f.season||String(c.season)===f.season))comps.set(c.key,c.name);
    $('competition').innerHTML='<option value="">Tutte le competizioni</option>'+[...comps].sort((a,b)=>a[1].localeCompare(b[1],'it')).map(([k,n])=>`<option value="${escape(k)}">${escape(n)}</option>`).join('');
    if(comps.has(f.key))$('competition').value=f.key;
  }
  function crest(a){const t=data.teams[a.scope+':'+a.winner_id];const src=t?.image_url;return src&&/^(https:\/\/|\/(?!\/))/.test(src)?`<img class="crest" src="${escape(src)}" alt="" loading="lazy">`:`<span class="crest-fallback" aria-hidden="true">${escape(a.winner.slice(0,1))}</span>`;}
  function table(rows,kind,scope){
    if(!rows.length)return empty(kind==='manager'?'Nessuna presenza attribuibile con certezza a un manager IMC per questi filtri.':'Nessun risultato disponibile per questi filtri.');
    const heading=kind==='manager'?'Manager':scope==='nation'?'Nazionale':'Club';
    return `<div class="table-wrap" role="region" aria-label="Statistiche ${heading}" tabindex="0"><table><caption>Ordine: presenze, poi vittorie. GF = gol fatti · GS = gol subiti. Tutte le righe disponibili.</caption><thead><tr><th>${heading}</th><th>Stagioni</th>${kind==='manager'?'<th>Squadre</th>':''}<th>Presenze</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>Titoli</th></tr></thead><tbody>${rows.map(r=>{
      const href=kind==='manager'?'/nexus/managers/profile.html?'+new URLSearchParams({world:'GW001',manager:r.id}):/^\d+$/.test(r.id)&&data.teams[scope+':'+r.id]?'/nexus/teams/detail.html?'+new URLSearchParams({world:'GW001',type:scope==='nation'?'nation':'club',id:r.id}):null;
      return `<tr><td class="team">${href?`<a href="${escape(href)}">${escape(r.name)} ↗</a>`:escape(r.name)}</td><td>${r.seasons.size||'—'}</td>${kind==='manager'?`<td title="${escape([...r.teams].join(', '))}">${r.teams.size||'—'}</td>`:''}<td>${r.played||'—'}</td><td>${r.played?r.won:'—'}</td><td>${r.played?r.drawn:'—'}</td><td>${r.played?r.lost:'—'}</td><td>${r.played?r.gf:'—'}</td><td>${r.played?r.ga:'—'}</td><td>${r.titles}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  async function standings(target,c,id){
    target.innerHTML='<p class="source">Caricamento classifica Nexus…</p>';
    try{
      const url=c.custom?'/nexus/competitions/imc-cups.php?':'/nexus/competitions/standings.php?';
      const response=await fetch(url+new URLSearchParams({world:'GW001',season:c.season,competition:c.key,...(c.custom?{mode:'standings'}:{})}));const d=await response.json();
      if(!response.ok||!d.ok)throw Error();if(id!==renderId)return;
      if(!d.rows?.length){target.innerHTML=empty('Classifica non disponibile per questa competizione.');return;}
      const groups=d.groups?.length?d.groups:[{rows:d.rows}];
      target.innerHTML=groups.map(g=>`<div class="table-wrap" role="region" aria-label="Classifica ${escape(c.name)}" tabindex="0"><table><caption>${escape(g.group_name||c.name)} · Classifica dai risultati disponibili in Nexus</caption><thead><tr><th>Squadra</th><th>Pos.</th><th>G</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>Pt</th></tr></thead><tbody>${g.rows.map(r=>`<tr><td>${escape(r.team_name)}</td><td>${r.position}</td><td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td><td>${r.points}</td></tr>`).join('')}</tbody></table></div>`).join('');
    }catch{target.innerHTML=empty('Classifica temporaneamente non disponibile. Chiudi e riapri per riprovare.');target.dataset.failed='1';}
  }
  const pages={panoramica:'Panoramica',stagioni:'Stagioni',albo:'Albo d’oro',partite:'Partite',statistiche:'Statistiche',scontri:'Scontri diretti'};
const metrics=[['possession','Possesso %'],['total_shots','Tiri'],['shots_on_target','Tiri in porta'],['corners','Angoli'],['yellow_cards','Ammonizioni'],['red_cards','Espulsioni']];
const numeric=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
function pageHref(page){const q=new URLSearchParams(location.search);q.set('page',page);return '?'+q;}
function reportTable(ms,first=null){
 return '<div class="table-wrap"><table><caption>Medie per partita · N indica i report con il dato disponibile. — = dato assente.</caption><thead><tr><th>Dato</th><th>'+(first?'Primo':'Casa')+'</th><th>'+(first?'Secondo':'Trasferta')+'</th><th>N</th></tr></thead><tbody>'+metrics.map(([k,l])=>{let a=0,b=0,n=0;for(const m of ms){const side=first?first(m):'home',other=side==='home'?'away':'home',x=numeric(m.team_stats?.[side]?.[k]),y=numeric(m.team_stats?.[other]?.[k]);if(x===null||y===null)continue;a+=x;b+=y;n++;}return `<tr><td>${l}</td><td>${n?(a/n).toFixed(1):'—'}</td><td>${n?(b/n).toFixed(1):'—'}</td><td>${n}</td></tr>`;}).join('')+'</tbody></table></div>';
}
function matchList(ms){return ms.length?`<div class="match-grid">${ms.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=>`<article class="match-card"><small>${date(m.date)} · Stagione ${m.season} · ${escape(data.competitions.find(c=>c.key===m.key)?.name||'')}</small><h3>${escape(m.home_name)} <strong>${m.home_score}–${m.away_score}</strong> ${escape(m.away_name)}</h3><p>${escape(data.managers[m.home_manager]||'Manager non attribuibile')} / ${escape(data.managers[m.away_manager]||'Manager non attribuibile')}</p>${/^\d+$/.test(m.id)?`<a href="/nexus/competitions/match.html?world=GW001&fixture=${encodeURIComponent(m.id)}">Apri partita: statistiche, formazioni e voti ↗</a>`:'<p>Report non disponibile per questa partita custom.</p>'}${m.team_stats?`<details><summary>Numeri della partita</summary>${reportTable([m])}</details>`:''}</article>`).join('')}</div>`:empty('Nessuna partita disponibile per questa selezione.');}
function renderPages(matches){
 const q=new URLSearchParams(location.search),page=pages[q.get('page')]?q.get('page'):'panoramica';
 $('pages').innerHTML=Object.entries(pages).map(([k,v])=>`<a href="${escape(pageHref(k))}" ${page===k?'aria-current="page"':''}>${v}</a>`).join('');
 $('page-cards').innerHTML=Object.entries(pages).filter(([k])=>k!=='panoramica').map(([k,v])=>`<a class="award" href="${escape(pageHref(k))}"><h3>${v} →</h3></a>`).join('');
 for(const id of [...Object.keys(pages),'club','manager','record'])$(id).hidden=id!==page&&!(page==='statistiche'&&['club','manager','record'].includes(id));
 $('numbers').hidden=page!=='panoramica';document.querySelector('.legacy-section').hidden=page!=='panoramica';
 $('match-list').innerHTML=page==='partite'?matchList(matches):'';
 $('report-stats').innerHTML=page==='statistiche'?`<p>${matches.filter(m=>m.team_stats).length} report disponibili su ${matches.length} partite selezionate.</p>`+reportTable(matches):'';
 if(page==='scontri')setupH2H(matches);
}
function setupH2H(matches){
 const kind=$('h-kind').value,field=kind==='manager'?'_manager':'_id',names=new Map();
 for(const m of matches)for(const side of ['home','away']){const id=m[side+field];if(id)names.set(String(id),kind==='manager'?data.managers[id]:m[side+'_name']);}
 for(const id of ['h-a','h-b']){const previous=$(id).value;$(id).innerHTML='<option value="">Seleziona…</option>'+[...names].sort((a,b)=>a[1].localeCompare(b[1],'it')).map(([v,n])=>`<option value="${escape(v)}">${escape(n)}</option>`).join('');if(names.has(previous))$(id).value=previous;}
 const draw=()=>{const a=$('h-a').value,b=$('h-b').value,v=$('h-venue').value;if(!a||!b||a===b){$('h-results').innerHTML=empty('Scegli due protagonisti diversi. I manager sono quelli attribuiti alla data della partita.');return;}
 const side=m=>String(m['home'+field])===a?'home':'away';
 const ms=matches.filter(m=>((String(m['home'+field])===a&&String(m['away'+field])===b)||(String(m['away'+field])===a&&String(m['home'+field])===b))&&(!v||side(m)===v));
 let win=0,draws=0,gf=0,ga=0;for(const m of ms){const x=m[side(m)+'_score'],y=m[(side(m)==='home'?'away':'home')+'_score'];gf+=x;ga+=y;win+=x>y;draws+=x===y;}
 $('h-results').innerHTML=`<h3>${escape(names.get(a))} / ${escape(names.get(b))}</h3><p>${ms.length} incontri · ${win} vittorie del primo · ${draws} pareggi · ${ms.length-win-draws} vittorie del secondo · Gol ${gf}–${ga}</p><p>Bilancio sul punteggio della partita, prima dei rigori.</p>`+reportTable(ms,side)+matchList(ms);
 };
 $('h-kind').onchange=()=>setupH2H(matches);for(const id of ['h-a','h-b','h-venue'])$(id).onchange=draw;draw();
}

  function render(){
    const id=++renderId;const f=filters();const matches=data.matches.filter(r=>matching(r,f)),awards=data.awards.filter(r=>matching(r,f));
    const comps=data.competitions.filter(r=>matching(r,f));
    const clubs=aggregate(matches,awards,'club'),managers=aggregate(matches,awards,'manager',data.managers);
    const unknown=matches.reduce((n,m)=>n+Number(!m.home_manager)+Number(!m.away_manager),0);
    const params=new URLSearchParams(location.search);for(const [k,v] of [['scope',f.scope],['season',f.season],['competition',f.key]]){if(v)params.set(k,v);else params.delete(k);}history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
    $('numbers').innerHTML=[[new Set(comps.map(c=>c.season)).size,'Stagioni in archivio'],[matches.length,'Partite archiviate'],[clubs.length,f.scope==='nation'?'Nazionali':'Club'],[awards.length,'Titoli registrati']].map(([n,s])=>`<div><strong>${n}</strong><span>${s}</span></div>`).join('');
    $('awards').innerHTML=awards.length?awards.map(a=>`<article class="award"><span class="season">STAGIONE ${a.season}</span><p class="competition">${escape(a.name)}</p>${crest(a)}<h3>${escape(a.winner)}</h3><p class="manager">${escape(a.manager?data.managers[a.manager]:'Manager storico non disponibile')}</p><time>${date(a.date)}</time></article>`).join(''):empty('Nessun vincitore registrato in Nexus per questa selezione. Un’assenza non equivale a un titolo non assegnato.');
    $('club-title').textContent=f.scope==='nation'?'Nazionali':'Club';$('club-table').innerHTML=table(clubs,'club',f.scope);$('manager-table').innerHTML=table(managers,'manager',f.scope);
    $('manager-note').textContent=`Solo manager IMC con incarico valido alla data della partita e senza conflitti con il manager registrato. ${unknown} presenze di squadra non attribuibili sono escluse da questa tabella. I titoli provengono dalla Trophy Room.`;
    const seasons=data.seasons.filter(s=>(!f.season||String(s.imc_season)===f.season)&&comps.some(c=>c.season===Number(s.imc_season))).slice().reverse();
    $('seasons').innerHTML=seasons.length?seasons.map(s=>{
      const cs=comps.filter(c=>c.season===Number(s.imc_season));const end=s.imc_season_end_date;const finished=end&&end<new Date().toLocaleDateString('sv-SE');
      return `<article class="season-block"><div class="season-head"><h3>Stagione ${s.imc_season}</h3><span class="badge">${finished?'Conclusa':s.imc_season_start_date&&s.imc_season_start_date>new Date().toLocaleDateString('sv-SE')?'In programma':'In corso'}</span></div><p class="season-dates">${date(s.imc_season_start_date)} → ${end?date(end):'Data di chiusura non registrata'}</p>${cs.map(c=>`<details data-key="${escape(c.key)}" data-season="${c.season}"><summary>${escape(c.name)}</summary><a class="detail-link" href="${escape(nexusLink(c))}">Risultati e competizione in Nexus ↗</a>${c.action==='league'?'<div class="standings"></div>':'<p class="source">Consulta partite e risultati nell’archivio Nexus.</p>'}</details>`).join('')}</article>`;
    }).join(''):empty('Nessuna stagione disponibile per questa selezione.');
    for(const detail of $('seasons').querySelectorAll('details'))detail.addEventListener('toggle',()=>{const target=detail.querySelector('.standings');if(!detail.open||!target||(target.dataset.loaded&&!target.dataset.failed))return;target.dataset.loaded='1';delete target.dataset.failed;const c=comps.find(c=>c.key===detail.dataset.key&&String(c.season)===detail.dataset.season);standings(target,c,id);});
    const recordCards=[];
    const metric=(title,rows,key)=>{const l=leaders(rows,key);if(l)recordCards.push(`<article class="record"><h3>${title}</h3><strong>${l.value}</strong><ul>${l.rows.map(r=>`<li>${escape(r.name)}</li>`).join('')}</ul></article>`);};
    metric('Più presenze · squadre',clubs,'played');metric('Più vittorie · squadre',clubs,'won');metric('Più gol segnati · squadre',clubs,'gf');metric('Più titoli registrati',clubs,'titles');metric('Più presenze · manager',managers,'played');
    if(matches.length){for(const [title,calc] of [['Partita con più gol',m=>m.home_score+m.away_score],['Vittoria più ampia',m=>Math.abs(m.home_score-m.away_score)]]){
      const max=Math.max(...matches.map(calc));if(max===0&&title==='Vittoria più ampia')continue;
      recordCards.push(`<article class="record"><h3>${title}</h3><strong>${max} gol</strong><ul>${matches.filter(m=>calc(m)===max).map(m=>`<li>${escape(m.home_name)} <b>${m.home_score}–${m.away_score}</b> ${escape(m.away_name)}<br>${date(m.date)} · Stagione ${m.season}</li>`).join('')}</ul></article>`);
    }}
    $('records').innerHTML=recordCards.join('')||empty('Risultati insufficienti per calcolare i record.');
    renderPages(matches);
    $('status').textContent='Fonte: Nexus GW001 · Dati letti il '+new Date(data.generated_at).toLocaleString('it-IT',{timeZone:'Europe/Rome'})+' · Statistiche limitate ai risultati archiviati, inclusi gli avversari internazionali.';
  }
  async function load(){
    $('retry').hidden=true;$('status').classList.remove('error');$('status').textContent='Caricamento dell’archivio Nexus GW001…';
    try{const r=await fetch('/theroadalmanac/data.php',{cache:'no-store'});data=await r.json();if(!r.ok||!data.ok||data.world!=='GW001')throw Error();
      $('season').innerHTML='<option value="">Tutte le stagioni</option>'+data.seasons.map(s=>`<option value="${s.imc_season}">Stagione ${s.imc_season}</option>`).join('');
      const p=new URLSearchParams(location.search);$('scope').value=p.get('scope')==='nation'?'nation':'club';if(data.seasons.some(s=>String(s.imc_season)===p.get('season')))$('season').value=p.get('season');options();if([...$('competition').options].some(o=>o.value===p.get('competition')))$('competition').value=p.get('competition');
      $('content').hidden=false;render();
    }catch{$('content').hidden=true;$('status').textContent='L’archivio Nexus è temporaneamente non disponibile. Nessun dato è stato sostituito con valori di esempio.';$('status').classList.add('error');$('retry').hidden=false;}
  }
  for(const name of ['scope','season'])$(name).addEventListener('change',()=>{if(data){options();render();}});
  $('competition').addEventListener('change',()=>{if(data)render();});
  $('reset').addEventListener('click',()=>{if(!data)return;$('scope').value='club';$('season').value='';$('competition').value='';options();render();});
  $('retry').addEventListener('click',load);
  for(const b of document.querySelectorAll('[data-division]'))b.addEventListener('click',()=>{if(!data)return;$('scope').value='club';$('season').value='';options();$('competition').value='GW001|DOMESTIC|league|'+b.dataset.division;render();$('albo').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  load();
}
