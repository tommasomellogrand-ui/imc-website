'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),manager=params.get('manager')||'';
const section=['career','ranking','timeline','trophies','h2h'].includes(params.get('view'))?params.get('view'):'career';
const rankingView=section==='ranking';
const timelineView=section==='timeline';
document.body.classList.add('clubhouse-page','clubhouse-hub');
let scope=['global','club','national_team'].includes(params.get('scope'))?params.get('scope'):'global';
const sourceLabel=()=>section==='career'?'Results · ID manager':scope==='club'?'Match Report · ID manager':scope==='national_team'?'Results · GW, nazionale e date incarico':'Club: Match Report · Nations: Results e date incarico';
const scopeLabel=()=>scope==='club'?'Club':scope==='national_team'?'Nations':'Global';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=['played','won','drawn','lost','gf','ga','penalty_won','penalty_lost','matched_by_id','matched_by_assignment'];
const zero=()=>Object.fromEntries(fields.map(k=>[k,0]));
const sum=items=>items.reduce((a,s)=>{fields.forEach(k=>a[k]+=Number(s[k]||0));return a;},zero());
const pct=s=>s.played?(100*s.won/s.played).toLocaleString('it-IT',{maximumFractionDigits:1})+'%':'—';
const number=n=>Number(n||0).toLocaleString('it-IT');
let careerSort=['name','played','won','trophies'].includes(params.get('sort'))?params.get('sort'):'name';
let people=[],worldNames={},bundles={},failed=[],tab=section==='h2h'?'h2h':section==='trophies'?'trophies':'overview',limit=25,loading=true,runId=0;
const worlds=Array.from({length:10},(_,i)=>'GW'+String(i+1).padStart(3,'0'));
const selected=()=>worlds.filter(w=>!$('world').value||w===$('world').value);
const available=()=>selected().filter(w=>bundles[w]);
const allMatches=()=>available().flatMap(w=>bundles[w].matches||[]).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.fixture_id).localeCompare(String(a.fixture_id)));
const worldName=w=>worldNames[w]?w+' · '+worldNames[w]:w;
const dateIT=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v).slice(8,10)+'/'+String(v).slice(5,7)+'/'+String(v).slice(0,4):'—';

const initials=name=>String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('');
const badges=ws=>'<div class="world-badges">'+ws.map(w=>'<span class="world-badge">'+esc(w)+'</span>').join('')+'</div>';
const cup='<svg class="trophy-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v6M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/></svg>';
function clubLogo(world,id,kind='club'){const src=String(bundles[world]?.[kind==='national_team'?'nations':'clubs']?.[id]?.logo||'');return /^(https:\/\/|\/(?!\/))/i.test(src)?'<img class="club-logo" src="'+esc(src)+'" alt="" loading="lazy">':'<span class="club-placeholder" aria-hidden="true">◇</span>';}
function worldLinks(){ $('world-links').innerHTML=worlds.map(w=>'<a href="../?world='+w+'"><small>'+w+' ↗</small><strong>'+esc(worldNames[w]||w)+'</strong></a>').join('');}
function wireLogos(){document.querySelectorAll('.club-logo').forEach(img=>{img.onerror=()=>img.hidden=true;if(img.complete&&!img.naturalWidth)img.hidden=true;});}
$('open-worlds').onclick=$('nav-worlds').onclick=()=>$('world-dialog').showModal();$('close-worlds').onclick=()=>$('world-dialog').close();$('world-dialog').addEventListener('click',e=>{if(e.target===$('world-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});worldLinks();

async function get(q=''){const r=await fetch('data.php'+q,{cache:'no-store'}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Dati non disponibili');return d;}
function stats(id){return sum(available().map(w=>bundles[w].managers[id]?.stats||zero()));}
function trophies(id){return available().reduce((n,w)=>n+(bundles[w].managers[id]?.trophies||0),0);}
function status(){const ready=available().length,total=selected().length,missing=selected().filter(w=>failed.includes(w));$('loading').textContent=(loading?'Caricamento · ':'')+ready+'/'+total+' GW disponibili';const excluded=manager?available().reduce((n,w)=>n+(bundles[w].managers[manager]?.excluded||0),0):0;const nationalErrors=rankingView?available().filter(w=>(bundles[w].ranking_error||bundles[w].national_ranking_error)):[];const attribution=available().map(w=>({world:w,c:bundles[w].national_coverage})).filter(x=>x.c&&(x.c.ambiguous_sides||x.c.excluded_fixtures));const trophyErrors=available().filter(w=>bundles[w].trophy_error);$('warning').textContent=[attribution.length?'Results nazionali: incarichi ambigui o partite escluse in '+attribution.map(x=>x.world).join(', ')+'.':'',nationalErrors.length?'Results ranking non disponibili per '+nationalErrors.join(', ')+': classifica parziale.':'',missing.length?'Dati parziali: non disponibili '+missing.join(', ')+'. Usa Aggiorna per riprovare.':'',excluded?excluded+' partite escluse dai conteggi per anomalie nei dati. Vedi Panoramica.':'',trophyErrors.length?'Trofei incompleti per '+trophyErrors.join(', ')+'.':''].filter(Boolean).join(' ');}
const timelineMeta={passport:['🛂','IMC PASSPORT'],assignment_start:['●','NUOVO INCARICO'],assignment_end:['●','FINE INCARICO'],trophy:['🏆','TROFEO']};
const timelineDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?new Date(v+'T12:00:00Z').toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric',timeZone:'Europe/Rome'}).replace('.','').toUpperCase():String(v||'');
let timelineKind='',timelineRun=0;
function timelineTeam(e){
 const src=String(e.team_logo||''),nation=e.assignment_type==='national_team';
 const img=/^(https:\/\/|\/(?!\/))/i.test(src)?'<img class="timeline-team-logo'+(nation?' timeline-flag':'')+'" src="'+esc(src)+'" alt="'+(nation?'Bandiera ':'Logo ')+esc(e.team||'')+'" loading="lazy">':'<span class="timeline-team-fallback" aria-hidden="true">'+(nation?'⚑':'◇')+'</span>';
 return '<div class="timeline-team">'+img+'<span><strong>'+esc(e.team||'—')+'</strong><small>'+(nation?'Nazionale':'Club')+'</small></span></div>';
}
function timelineCard(e){
 const meta=timelineMeta[e.type]||['◆','EVENTO'];
 const action=e.type==='passport'?'Entra nella community IMC':e.type==='assignment_start'?'Inizia un nuovo incarico':e.type==='assignment_end'?'Conclude l’incarico':'Conquista '+esc(e.competition||'un trofeo');
 const info=e.type==='trophy'?'<details class="timeline-more"><summary>Dettagli trofeo <strong>+'+number(e.ranking_points)+' pt</strong></summary><p>Stagione '+esc(e.season)+' · '+number(e.base_points)+' × '+number(e.multiplier)+' = '+number(e.ranking_points)+' punti</p></details>':'';
 return '<article class="timeline-card type-'+esc(e.type)+'"><div class="timeline-world"><strong>'+esc(e.world||'IMC')+'</strong><span>'+esc(e.world?(worldNames[e.world]||e.world):'Passport')+'</span></div><div class="timeline-event-content"><span class="timeline-event-label">'+meta[0]+' '+meta[1]+'</span><h3><a href="'+esc(hubURL('timeline',e.manager_id))+'">'+esc(e.manager_name)+'</a></h3><p class="timeline-action">'+action+'</p>'+(e.team?timelineTeam(e):'')+info+'</div></article>';
}
async function timeline(){
 const token=++timelineRun;
 try{
  $('loading').textContent='Caricamento IMC Timeline…';
  const d=await fetch('timeline.php',{cache:'no-store'}).then(r=>r.json());
  if(token!==timelineRun)return;if(!d.ok)throw Error(d.error||'Timeline non disponibile');
  const rows=d.events.filter(e=>(!manager||e.manager_id===manager)&&(!$('world').value||e.world===$('world').value)).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.world||'').localeCompare(String(b.world||'')));
  const draw=()=>{
   const filtered=rows.filter(e=>!timelineKind||(timelineKind==='assignment'?e.type.startsWith('assignment_'):e.type===timelineKind));
   const groups=new Map();filtered.forEach(e=>{if(!groups.has(e.date))groups.set(e.date,[]);groups.get(e.date).push(e);});
   $('loading').textContent=filtered.length+' eventi';$('manager-count').textContent=filtered.length+' eventi';$('compact-count').textContent=filtered.length+' eventi';
   $('content').innerHTML='<div class="timeline-filters" role="group" aria-label="Tipo di evento">'+[['','Tutto'],['trophy','Trofei'],['assignment','Incarichi'],['passport','Passport']].map(([kind,label])=>'<button data-kind="'+kind+'" aria-pressed="'+(timelineKind===kind)+'" class="'+(timelineKind===kind?'active':'')+'">'+label+'</button>').join('')+'</div><div class="timeline-feed">'+([...groups].map(([date,events])=>'<section class="timeline-day"><h2><time datetime="'+esc(date)+'">'+esc(timelineDate(date))+'</time></h2><div class="timeline-day-events">'+events.map(timelineCard).join('')+'</div></section>').join('')||'<p class="notice">Nessun evento per i filtri selezionati.</p>')+'</div>';
   document.querySelectorAll('.timeline-filters button').forEach(b=>b.onclick=()=>{timelineKind=b.dataset.kind;draw();});
   document.querySelectorAll('.timeline-team-logo').forEach(img=>{img.onerror=()=>{img.hidden=true;};if(img.complete&&!img.naturalWidth)img.hidden=true;});
  };
  draw();
 }catch(e){if(token!==timelineRun)return;$('loading').textContent=e.message;$('content').innerHTML='<p class="notice">'+esc(e.message)+'</p>';}
}
function render(){if(timelineView){timeline();return;}status();syncManagerOptions();if(!available().length){$('content').innerHTML='<p class="notice">'+(loading?'Lettura delle partite…':'Nessun GW disponibile. Riprova con Aggiorna.')+'</p>';return;}if(rankingView)return ranking();if(!manager)return directory();if(!people.some(m=>m.manager_id===manager))return;if(section==='career')career();else ({h2h,trophies:trophyRoom}[tab]||career)();wireLogos();}
function rankFor(id){return available().reduce((r,w)=>{const x=bundles[w].managers[id]?.ranking;if(!x){r.incomplete=true;return r;}r.clubs+=x.club_points??x.match_points;r.nations+=x.national_points??0;r.matches+=x.match_points;r.trophies+=x.trophy_points;r.total+=x.total;r.unscored+=x.unscored_trophies;r.incomplete=r.incomplete||bundles[w].ranking_error||bundles[w].national_ranking_error||x.version!==9;return r;},{clubs:0,nations:0,matches:0,trophies:0,total:0,unscored:0,incomplete:false});}
function rankingStats(id){return sum(available().flatMap(w=>[bundles[w].managers[id]?.ranking_club_stats||zero(),bundles[w].managers[id]?.national_stats||zero()]));}
function ranking(){
 const opened=new Set([...document.querySelectorAll('.ranking-row[open]')].map(el=>el.dataset.manager));
 const rows=people.map(m=>({...m,rank:rankFor(m.manager_id),games:rankingStats(m.manager_id)})).filter(m=>!$('world').value||m.games.played>0).sort((a,b)=>b.rank.total-a.rank.total||a.full_name.localeCompare(b.full_name,'it'));
 let previous=null,position=0;rows.forEach((m,i)=>{if(m.rank.total!==previous)position=i+1;m.position=position;previous=m.rank.total;});
 const incomplete=loading||available().length!==selected().length||available().some(w=>bundles[w].trophy_error)||rows.some(m=>m.rank.incomplete||m.rank.unscored);
 const q=$('search').value.toLocaleLowerCase('it').trim(),filtered=rows.filter(m=>(!manager||m.manager_id===manager)&&(m.full_name+' '+m.manager_id).toLocaleLowerCase('it').includes(q));
 $('manager-count').textContent=filtered.length+' manager';$('compact-count').textContent=filtered.length+' manager';
 $('content').innerHTML='<p class="rank-status">'+(incomplete?'Classifica provvisoria: caricamento o dati incompleti.':'Classifica aggiornata sui dati disponibili.')+' Club + Nazionali · Tutte le stagioni · Pari punti, pari posizione.</p>'+rankRules()+
 '<div class="ranking-list">'+filtered.map(m=>'<details class="ranking-row'+(m.position<=3?' ranking-podium':'')+'" data-manager="'+esc(m.manager_id)+'"'+(opened.has(m.manager_id)?' open':'')+'><summary><span class="rank-position">'+m.position+'</span><span class="rank-name"><strong>'+esc(m.full_name)+'</strong><small>'+number(m.games.played)+' partite · '+number(m.games.won)+' V · '+number(m.games.drawn)+' P · '+number(m.games.lost)+' S</small></span><span class="rank-total">'+number(m.rank.total)+'<small>PUNTI</small></span><span class="rank-chevron" aria-hidden="true">⌄</span></summary><div class="rank-detail"><div class="rank-split">'+[['Club',m.rank.clubs],['Nazionali',m.rank.nations],['Trofei',m.rank.trophies]].map(([label,value])=>'<div><small>'+label+'</small><strong>'+number(value)+'<span> pt</span></strong></div>').join('')+'</div><div class="rank-detail-heading"><h3>Punti per Game World</h3><a href="?manager='+encodeURIComponent(m.manager_id)+'">IMC Career ↗</a></div><div class="rank-world-grid">'+rankWorlds(m.manager_id)+'</div>'+(m.rank.unscored?'<p class="notice">'+m.rank.unscored+' trofei senza regola riconosciuta: bonus non assegnato.</p>':'')+'</div></details>').join('')+'</div>'+(filtered.length?'':'<p class="notice">Nessun manager trovato.</p>');
}
function rankWorlds(id){return available().map(w=>{const m=bundles[w].managers[id],r=m?.ranking;if(!r)return '<p class="notice">'+esc(w)+': ranking non disponibile.</p>';const s=m.ranking_club_stats||zero(),n=m.national_stats||zero();
 const line=(label,v,points,source)=>'<tr><th scope="row">'+label+'<small>'+source+'</small></th><td>'+number(v.played)+'</td><td>'+number(v.won)+'</td><td>'+number(v.drawn)+'</td><td>'+number(v.lost)+'</td><td><strong>'+number(points)+'</strong></td></tr>';
 return '<section class="rank-world"><div class="rank-world-head"><div><small>'+esc(w)+' <span>×'+r.weight+'</span></small><h3>'+esc(worldNames[w]||w)+'</h3></div><strong>'+number(r.total)+'<small>punti</small></strong></div><div class="rank-table-wrap"><table class="rank-table"><thead><tr><th>Partite</th><th title="Giocate">G</th><th title="Vinte">V</th><th title="Pareggiate">N</th><th title="Perse">P</th><th>Punti</th></tr></thead><tbody>'+line('Club',s,r.club_points??r.match_points,'Results')+line('Nazionali',n,r.national_points??0,'Results')+'</tbody></table></div><div class="rank-trophy-total"><span>Trofei · '+r.awards.length+'</span><strong>'+number(r.trophy_points)+' pt</strong></div><details class="rank-calculation"><summary>Calcolo e trofei</summary><p>Club: ('+s.played+' × 0,5 + '+s.won+' × 0,5 − '+s.lost+' × 0,5) × '+r.weight+' = '+number(r.club_points??r.match_points)+'</p><p>Nazionali: ('+n.played+' × 0,5 + '+n.won+' × 0,5 − '+n.lost+' × 0,5) × '+r.weight+' = '+number(r.national_points??0)+'</p><p>Trofei: '+number(r.trophy_base)+' × '+r.weight+' = '+number(r.trophy_points)+'</p>'+(r.awards.length?'<ul class="rank-awards">'+r.awards.map(a=>'<li><span>'+esc(a.competition)+' · S'+esc(a.season)+'<small>'+esc(a.team)+' · '+esc(a.date)+'</small></span><strong>'+(a.points===null?'Da verificare':number(a.points)+' pt')+'</strong></li>').join('')+'</ul>':'')+'</details>'+((bundles[w].ranking_error||bundles[w].national_ranking_error)?'<p class="notice">Results ranking non disponibili: totale parziale.</p>':'')+(bundles[w].trophy_error?'<p class="notice">Trofei non disponibili: totale parziale.</p>':'')+'</section>';}).join('');}
function rankRules(){
 const awards=[['World Cup',125],['SMFA Champions Cup · Campionato D1',100],['SMFA Shield · SMFA Super Cup · Charity Shield',75],['League Cup · League Shield',50],['Campionati D2 e inferiori',25],['Playoff',10]];
 return '<details class="panel rank-rules"><summary>Punteggi</summary><h3>Partite</h3><div class="ranking-score-guide"><span><b>0,5</b> Giocata</span><span><b>0,5</b> Vittoria</span><span><b>0</b> Pareggio</span><span><b>−0,5</b> Sconfitta</span></div><h3>Moltiplicatori GW</h3><div class="rank-multipliers"><div><b>×3</b><span>GW001 · GW008</span></div><div><b>×2</b><span>GW002 · GW003</span></div><div><b>×1</b><span>Altri GW</span></div></div><p class="rank-rule-caption">Applicati a partite e trofei.</p><h3>Trofei</h3><div class="rank-bonus-list">'+awards.map(([label,points])=>'<div><span>'+label+'</span><b>'+points+'</b></div>').join('')+'</div><details class="rank-rule-notes"><summary>Note di calcolo</summary><p>Per club e nazionali: giocata +0,5; vittoria +0,5; pareggio +0; sconfitta −0,5. Esito prima dei rigori.</p><p>Partite dai Results, attribuite tramite ID manager e conteggiate una sola volta. Pari punti, pari posizione.</p><p>Trofei attribuiti alla data della vittoria. Nessun punto per promozioni, retrocessioni o trofei non riconosciuti.</p></details></details>';
}
function directoryPeople(){return people.filter(m=>section!=='career'||!$('world').value||stats(m.manager_id).played>0);}
function syncManagerOptions(){
 const rows=directoryPeople();
 $('manager-options').innerHTML='<option value="Tutti i manager"></option>'+rows.map(m=>'<option value="'+esc(m.full_name)+'" label="'+esc(m.manager_id)+'"></option>').join('');
 $('manager-filter').innerHTML='<option value="">Tutti i manager</option>'+rows.map(m=>'<option value="'+esc(m.manager_id)+'">'+esc(m.full_name)+'</option>').join('');
 $('manager-filter').value=manager;
}
function directory(){
 const q=$('search').value.toLocaleLowerCase('it').trim(),rows=directoryPeople().filter(m=>(m.full_name+' '+m.manager_id).toLocaleLowerCase('it').includes(q));
 if(section==='career')rows.sort((a,b)=>{
  if(careerSort==='name')return a.full_name.localeCompare(b.full_name,'it');
  const score=m=>careerSort==='trophies'?trophies(m.manager_id):stats(m.manager_id)[careerSort];
  return score(b)-score(a)||a.full_name.localeCompare(b.full_name,'it');
 });
 const sortBar=section==='career'?'<div class="career-sort" role="group" aria-label="Ordina manager"><div>'+[['name','Nome'],['played','Partite'],['won','Vittorie'],['trophies','Trofei']].map(([key,label])=>'<button type="button" data-career-sort="'+key+'" aria-pressed="'+(careerSort===key)+'">'+label+'</button>').join('')+'</div></div>':'';

 $('manager-count').textContent=rows.length+' manager';$('compact-count').textContent=rows.length+' manager';
 $('content').innerHTML=sortBar+'<div class="manager-grid">'+rows.map(m=>{
  const s=stats(m.manager_id),ws=available().filter(w=>(bundles[w].managers[m.manager_id]?.stats.played||0)>0);
  return `<a class="manager-card" href="${esc(hubURL(section,m.manager_id))}"><div class="identity"><span class="avatar">${esc(initials(m.full_name))}</span><div><h2>${esc(m.full_name)}</h2><small>${esc(m.manager_id)}</small></div></div><div class="mini-stats"><div><strong>${number(s.played)}</strong><small>Partite</small></div><div><strong>${number(s.won)}</strong><small>Vittorie</small></div><div><strong>${number(trophies(m.manager_id))}</strong><small>Trofei</small></div></div><div class="card-foot"><span class="gold">${ws.length} GW</span><span class="open-profile">Profilo →</span></div></a>`;
 }).join('')+'</div>'+(rows.length?'':'<p class="notice">'+(loading?'Caricamento manager con risultati…':'Nessun manager con risultati per i filtri selezionati.')+'</p>');
}
function kpis(s){return '<div class="kpis">'+[['Partite',number(s.played)],['Vittorie',number(s.won)],['Pareggi',number(s.drawn)],['Sconfitte',number(s.lost)],['Vittorie %',pct(s)],['Gol fatti',number(s.gf)],['Gol subiti',number(s.ga)],['Differenza reti',number(s.gf-s.ga)]].map(([label,value])=>`<div class="kpi"><strong>${value}</strong><span>${label}</span></div>`).join('')+'</div>';}
function matchRows(matches){return matches.map(m=>`<div class="match"><div class="match-identity">${clubLogo(m.world,m.team_id,m.scope)}<div class="match-copy"><a href="../competitions/match.html?${new URLSearchParams({world:m.world,fixture:m.fixture_id})}">${esc(m.team)} — ${esc(m.opponent_team)}</a><small>${esc(m.date||'Data non disponibile')} · ${esc(m.world)} · S${esc(m.season??'—')}${m.opponent_id?' · '+esc(m.opponent_name):''}</small></div></div><div class="score">${m.gf}–${m.ga}<span class="result ${m.outcome}">${m.outcome}</span>${m.penalty_for!==null&&m.penalty_against!==null?`<small>Rigori ${m.penalty_for}–${m.penalty_against}</small>`:''}</div></div>`).join('');}
function overview(){const s=stats(manager),matches=allMatches();const issues=available().flatMap(w=>bundles[w].issues||[]);$('content').innerHTML=kpis(s)+`<p class="muted">Identificazione: ${s.matched_by_id} partite tramite ID Soccer Manager${s.matched_by_assignment?' · '+s.matched_by_assignment+' partite nazionali tramite GW, nazionale e date incarico':''}. ${trophies(manager)} trofei · Rigori vinti ${s.penalty_won} / persi ${s.penalty_lost}</p>`+'<div class="section-heading"><h2>Nei Game World</h2></div><div class="world-stats">'+available().filter(w=>(bundles[w].managers[manager]?.stats.played||0)>0).map(w=>{const x=bundles[w].managers[manager].stats;return `<div class="panel"><div class="world-title"><strong>${esc(worldName(w))}</strong><a href="../?world=${w}">Apri GW ↗</a></div><div class="stat-line"><span><strong>${x.played}</strong>partite</span><span><strong>${x.won}</strong>V</span><span><strong>${x.drawn}</strong>P</span><span><strong>${x.lost}</strong>S</span><span>${pct(x)} vittorie</span></div></div>`;}).join('')+'</div>'+`<div class="section-heading"><h2>Partite</h2><small>${matches.length} totali</small></div><div class="panel">${matches.length?matchRows(matches.slice(0,limit)):'Nessuna partita attribuibile a questo manager nelle fonti disponibili.'}</div>`+(matches.length>limit?'<button id="more" class="more">Mostra altre 25 partite</button>':'')+(issues.length?'<details class="panel"><summary>Partite escluse · '+issues.length+'</summary>'+issues.map(i=>`<p class="muted">${esc(i.world)} · ${esc(i.date)} · Fixture ${esc(i.fixture_id)}: ${esc(i.reason)}</p>`).join('')+'</details>':'');if($('more'))$('more').onclick=()=>{limit+=25;overview();};}
function matchStats(rows){return sum(rows.map(m=>({...zero(),played:1,won:m.outcome==='V'?1:0,drawn:m.outcome==='P'?1:0,lost:m.outcome==='S'?1:0,gf:m.gf,ga:m.ga})));}
function careerSummary(s){
 const metric=(label,value,cls='')=>'<div class="summary-metric '+cls+'"><strong>'+esc(value)+'</strong><span>'+label+'</span></div>';
 return '<section class="career-summary" aria-label="Statistiche complessive"><div class="summary-heading"><h2>Statistiche complessive</h2><span>'+esc(scopeLabel())+' · '+esc($('world').value||'Tutti i GW')+'</span></div><div class="summary-primary">'+metric('Partite',number(s.played),'summary-played')+metric('Vittorie',pct(s))+'</div><div class="summary-outcomes">'+metric('Vittorie',number(s.won),'summary-wins')+metric('Pareggi',number(s.drawn),'summary-draws')+metric('Sconfitte',number(s.lost),'summary-losses')+'</div><div class="summary-goals">'+metric('Gol fatti',number(s.gf))+metric('Gol subiti',number(s.ga))+metric('Diff. reti',number(s.gf-s.ga))+'</div><div class="summary-extra"><span><strong>'+number(trophies(manager))+'</strong> trofei</span><span>Rigori: <strong>'+number(s.penalty_won)+'</strong> vinti · <strong>'+number(s.penalty_lost)+'</strong> persi</span></div><details class="summary-source"><summary>Fonte dati</summary><p>'+number(s.matched_by_id)+' partite tramite ID Soccer Manager · Results dei GW selezionati.</p></details></section>';
}

function career(){
 const matches=allMatches(),lists=[];
 const matchesPanel=rows=>{const id=lists.push(rows)-1;return '<details class="career-matches" data-list="'+id+'"><summary>Partite · '+number(rows.length)+'</summary><div class="career-match-list"></div></details>';};
 const detailStats=rows=>{const s=matchStats(rows);return '<div class="stat-line">'+[['partite',s.played],['vittorie',s.won],['pareggi',s.drawn],['sconfitte',s.lost],['gol fatti',s.gf],['gol subiti',s.ga],['diff. reti',s.gf-s.ga],['vittorie',pct(s)]].map(([label,value])=>'<span><strong>'+esc(value)+'</strong>'+label+'</span>').join('')+'</div>';};
 const groups=available().map(w=>{
  const rows=matches.filter(m=>m.world===w);
  const assignments=(bundles[w].assignments||[]).filter(a=>scope==='global'||a.assignment_type===scope).slice().sort((a,b)=>(Number(a.assignment_type==='national_team')-Number(b.assignment_type==='national_team'))||String(a.start_date||'').localeCompare(String(b.start_date||'')));
  const buckets=assignments.map(()=>[]),unassigned=[];
  rows.forEach(m=>{
   const indices=assignments.flatMap((a,i)=>m.scope===a.assignment_type&&String(m.team_id||'')===String(a.assignment_type==='national_team'?(bundles[w]?.nations?.[a.national_team_id]?.world_id||a.national_team_id):(a.team_id||''))&&(!a.start_date||String(m.date).slice(0,10)>=a.start_date)&&(!a.end_date||String(m.date).slice(0,10)<=a.end_date)?[i]:[]);
   if(indices.length===1)buckets[indices[0]].push(m);else unassigned.push(m);
  });
  if(!assignments.length&&!rows.length)return '';
  const cards=assignments.map((a,i)=>{
   const active=!a.end_date,kind=a.assignment_type;
   return `<section class="panel career-card ${active?'career-active':'career-closed'}"><div class="club-heading">${clubLogo(w,kind==='national_team'?a.national_team_id:a.team_id,kind)}<div><h3>${esc(a.team_name||(kind==='national_team'?bundles[w]?.nations?.[a.national_team_id]?.name:'')||(kind==='national_team'?'Nazionale':'Club'))}</h3><span class="muted">${kind==='national_team'?'Nazionale':'Club'}</span></div></div><div class="career-status-row"><p class="career-dates">Dal ${dateIT(a.start_date)} ${active?'a':'al'} ${active?'<strong>ACTIVE</strong>':dateIT(a.end_date)}</p><span class="career-status ${active?'active':'closed'}">${active?'ACTIVE':'ENDED'}</span></div>${detailStats(buckets[i])}${matchesPanel(buckets[i])}</section>`;
  }).join('');
  return '<section class="career-world" data-world="'+w+'"><div class="career-world-heading"><span>'+esc(w)+'</span><h2>'+esc(worldNames[w]||w)+'</h2><small>'+number(rows.length)+' partite</small></div><div class="career-grid">'+cards+'</div>'+(unassigned.length?'<section class="panel career-unassigned"><h3>Altre partite nei Results</h3><p class="muted">Partite del manager senza un incarico corrispondente univoco.</p>'+detailStats(unassigned)+matchesPanel(unassigned)+'</section>':'')+'</section>';
 }).join('');
 const s=stats(manager),issues=available().flatMap(w=>bundles[w].issues||[]);
 $('content').innerHTML=careerSummary(s)+'<div class="section-heading"><div><p class="eyebrow">LA TUA STORIA</p><h2>Carriera · '+scopeLabel()+'</h2></div></div>'+(groups||'<p class="notice">Nessun incarico o partita disponibile.</p>')+(issues.length?'<details class="panel"><summary>Partite escluse · '+issues.length+'</summary>'+issues.map(i=>'<p class="muted">'+esc(i.world)+' · Fixture '+esc(i.fixture_id)+': '+esc(i.reason)+'</p>').join('')+'</details>':'');
 document.querySelectorAll('.career-matches').forEach(el=>{
  let shown=0;const rows=lists[Number(el.dataset.list)],body=el.querySelector('.career-match-list');
  const more=()=>{shown+=25;body.innerHTML=rows.length?matchRows(rows.slice(0,shown)):'<p class="muted">Nessuna partita disponibile per questo incarico.</p>';if(shown<rows.length){const b=document.createElement('button');b.className='more';b.textContent='Mostra altre 25 partite';b.onclick=more;body.append(b);}wireLogos();};
  el.addEventListener('toggle',()=>{if(el.open&&!shown)more();});
 });
}
function h2h(){const matches=allMatches(),groups=new Map();for(const m of matches)if(m.opponent_id){if(!groups.has(m.opponent_id))groups.set(m.opponent_id,[]);groups.get(m.opponent_id).push(m);}const rows=[...groups.values()].sort((a,b)=>b.length-a.length);$('content').innerHTML='<h2>Head to Head globali</h2><p class="muted">Club: ID manager dai Match Report. Nazionali: Results attribuiti tramite GW, nazionale e date incarico. Gli incontri nei GW selezionati sono aggregati.</p>'+`<p class="notice">${rows.reduce((n,r)=>n+r.length,0)} scontri IMC–IMC · ${matches.filter(m=>!m.opponent_id).length} partite con avversario esterno o non identificato, incluse nelle statistiche generali ma non qui.</p>`+(rows.map(items=>{const s=matchStats(items),m=items[0],gws=[...new Set(items.map(x=>x.world))];return `<details class="rival" data-opponent="${esc(m.opponent_id)}" data-worlds="${esc(gws.join(','))}"><summary><div><div class="rival-title"><span class="avatar">${esc(initials(m.opponent_name))}</span><div><strong>${esc(m.opponent_name)}</strong><p class="muted">${s.played} partite · Gol ${s.gf}–${s.ga}</p></div></div><div>${badges(gws)}</div></div><div><div class="h2h-score"><span class="win"><strong>${s.won}</strong><small>VITTORIE</small></span><span><strong>${s.drawn}</strong><small>PAREGGI</small></span><span class="loss"><strong>${s.lost}</strong><small>SCONFITTE</small></span></div><div class="balance" aria-hidden="true"><span class="win" style="flex:${s.won}"></span><span style="flex:${s.drawn}"></span><span class="loss" style="flex:${s.lost}"></span></div></div></summary><div class="rival-matches"><p><a href="?manager=${encodeURIComponent(m.opponent_id)}&scope=${scope}">Apri profilo globale →</a></p><div class="hh hh-global-detail">Apri per caricare il dettaglio completo.</div></div></details>`;}).join('')||'<p class="notice">Nessuno scontro diretto IMC disponibile.</p>');
 $('content').querySelectorAll('.rival[data-opponent]').forEach(el=>el.addEventListener('toggle',async()=>{
  if(!el.open||el.dataset.loaded==='true'||el.dataset.loading==='true')return;
  el.dataset.loading='true';const body=el.querySelector('.hh-global-detail');body.textContent='Caricamento dettaglio partite…';
  try{const r=await fetch('h2h-detail.php?'+new URLSearchParams({manager,opponent:el.dataset.opponent,worlds:el.dataset.worlds,scope}),{cache:'no-store'}),d=await r.json();if(!r.ok||!d.ok)throw Error('Dettaglio non disponibile. Chiudi e riapri per riprovare.');if(!el.isConnected)return;NexusH2H.renderDetail(body,d);el.dataset.loaded='true';}catch(e){if(el.isConnected)body.textContent=e.message;}finally{el.dataset.loading='false';}
 }));
}
function trophyRoom(){const rows=available().flatMap(w=>bundles[w].trophies||[]).sort((a,b)=>String(b.date).localeCompare(String(a.date)));const groups=new Map();for(const t of rows){if(!groups.has(t.world))groups.set(t.world,new Map());const countries=groups.get(t.world),country=t.country||'Internazionali / paese non indicato';if(!countries.has(country))countries.set(country,new Map());const comps=countries.get(country);if(!comps.has(t.competition))comps.set(t.competition,[]);comps.get(t.competition).push(t);} $('content').innerHTML='<div class="section-heading"><div><p class="eyebrow">IL PALMARÈS</p><h2>Trophy Room</h2></div><span class="pill">'+rows.length+' trofei</span></div><p class="muted">Trofei già registrati in Nexus e attribuiti al manager in base all’incarico alla data della vittoria.</p>'+([...groups].map(([w,countries])=>'<section class="trophy-world"><h3>'+esc(worldName(w))+'</h3>'+[...countries].map(([country,comps])=>(['GW002','GW003','GW007','GW008'].includes(w)?'<h4 class="trophy-country">'+esc(country)+'</h4>':'')+[...comps].map(([name,items])=>'<div class="trophy-group"><h4>'+cup+esc(name)+' <span class="pill">'+items.length+'</span></h4>'+items.map(t=>'<article class="panel trophy"><p>'+esc(t.team)+'</p><small>Stagione '+esc(t.season)+' · '+esc(t.date)+'</small></article>').join('')+'</div>').join('')).join('')+'</section>').join('')||'<p class="notice">Nessun trofeo attribuito nei GW disponibili.</p>');}
async function load(){const token=++runId;loading=true;bundles={};failed=[];$('retry').disabled=true;render();let next=0;async function worker(){while(next<worlds.length){const w=worlds[next++];try{const d=await get('?'+new URLSearchParams({world:w,...(manager&&!rankingView?{manager}:{}),...(!rankingView&&!timelineView?{scope}:{}),...(['career','ranking'].includes(section)?{source:'results'}:{})}));if(token!==runId)return;bundles[w]=d;}catch(e){if(token!==runId)return;failed.push(w);}render();}}await Promise.all([worker(),worker()]);if(token!==runId)return;loading=false;$('retry').disabled=false;render();}
$('world').addEventListener('change',()=>{limit=25;const url=new URL(location.href);if($('world').value)url.searchParams.set('world',$('world').value);else url.searchParams.delete('world');history.replaceState(null,'',url);syncHubLinks();render();});$('search').addEventListener('input',render);$('retry').addEventListener('click',()=>start());document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
function updateScope(){
 document.querySelectorAll('#scope-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===scope)));
 document.querySelector('.hero-tags').innerHTML='<span>'+scopeLabel()+'</span><span>GW001–GW010</span>';
 document.querySelector('footer p').textContent=section==='career'?'Fonte partite: Results dei singoli GW. Attribuzione esclusivamente tramite ID manager registrati nei Results; nessuna riattribuzione dalle date degli incarichi. Esito prima dei rigori; rigori separati.':'Fonte partite: '+sourceLabel()+'. Esiti prima dei rigori; rigori separati.';
 document.querySelector('.source-badge').textContent=sourceLabel();
 $('subtitle').textContent=manager?manager+' · Carriera '+scopeLabel():'Tutti i manager IMC · '+scopeLabel();
 $('back').href=hubURL(section,'');
}
if(!rankingView&&!timelineView){
 $('scope-tabs').hidden=false;updateScope();
 document.querySelectorAll('#scope-tabs button').forEach(b=>b.onclick=()=>{
  if(scope===b.dataset.scope)return;scope=b.dataset.scope;limit=25;updateScope();
  const url=new URL(location.href);url.searchParams.set('scope',scope);history.replaceState(null,'',url);syncHubLinks();if(timelineView)timeline();else load();
 });
}
async function start(){try{const meta=await get();people=meta.managers;worldNames=Object.fromEntries(meta.worlds.map(w=>[w.id,w.name]));worldLinks();if($('world').options.length===1)worlds.forEach(w=>$('world').add(new Option(worldName(w),w)));initHub();if(timelineView){await timeline();return;}if(manager){const m=people.find(x=>x.manager_id===manager);if(!m){$('loading').textContent='Manager IMC non trovato.';$('content').replaceChildren();return;}$('directory-heading').hidden=true;$('compact-count').textContent=m.full_name;$('profile-avatar').hidden=false;$('profile-avatar').textContent=initials(m.full_name);$('title').textContent='Club House';document.title='Club House · '+sectionNames[section]+' · '+m.full_name;$('subtitle').textContent=m.full_name+' · '+m.manager_id;$('tabs').hidden=true;$('back').hidden=false;$('search-label').hidden=false;$('search').value=m.full_name;}await load();}catch(e){$('loading').textContent=e.message;$('retry').disabled=false;}}

$('search').addEventListener('change',()=>{const value=$('search').value.trim();if(value==='Tutti i manager'){location.href=hubURL(section,'');return;}const m=directoryPeople().find(m=>m.full_name.toLocaleLowerCase('it')===value.toLocaleLowerCase('it')||m.manager_id===value);if(m&&m.manager_id!==manager)location.href=hubURL(section,m.manager_id);});
const sectionNames={career:'IMC Career',ranking:'IMC Ranking',timeline:'IMC Timeline',trophies:'IMC Trophy Room',h2h:'IMC H2H'};
function hubURL(view,id=manager){
 const q=new URLSearchParams(location.search);q.set('view',view);q.set('scope',scope);
 if(id)q.set('manager',id);else q.delete('manager');
 return '?'+q.toString();
}
function syncHubLinks(){
 document.querySelectorAll('[data-section]').forEach(a=>{a.href=hubURL(a.dataset.section);if(a.dataset.section===section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('back').href=hubURL(section,'');
}
function initHub(){
 $('title').textContent='Club House';document.title='Club House · '+sectionNames[section];
 $('hub-section-title').textContent=sectionNames[section];
 $('directory-heading').querySelector('h2').textContent=section==='career'?'Una carriera, oltre il singolo mondo.':section==='ranking'?'La classifica dei manager IMC':section==='timeline'?'La storia della community':section==='trophies'?'Scegli un manager e scopri il suo palmarès':'Scegli un manager per gli scontri diretti';
 $('directory-heading').querySelector('.eyebrow').textContent=sectionNames[section];
 const currentWorld=new URL(location.href).searchParams.get('world');$('world').value=worlds.includes(currentWorld)?currentWorld:'';
 $('manager-filter').innerHTML='<option value="">Tutti i manager</option>'+people.map(m=>'<option value="'+esc(m.manager_id)+'">'+esc(m.full_name)+'</option>').join('');
 $('manager-filter').value=manager;
 $('manager-options').innerHTML='<option value="Tutti i manager"></option>'+people.map(m=>'<option value="'+esc(m.full_name)+'" label="'+esc(m.manager_id)+'"></option>').join('');
 $('manager-filter').onchange=()=>{location.href=hubURL(section,$('manager-filter').value);};
 $('subtitle').textContent=manager?(people.find(m=>m.manager_id===manager)?.full_name||manager):'Carriere, classifiche e storie dei manager IMC.';
 if(rankingView){document.body.classList.add('ranking-page');document.querySelector('.source-badge').textContent='CLUB E NAZIONALI: RESULTS';$('scope-tabs').hidden=true;}
 if(timelineView){document.querySelector('.hero-tags').innerHTML='<span>Community IMC</span><span>GW001–GW010</span>';$('scope-tabs').hidden=true;document.querySelector('.source-badge').textContent='INCARICHI · PASSPORT · TROFEI';$('retry').disabled=false;}
 syncHubLinks();
}
// Preserve the Club House context when opening a manager from any section.
$('content').addEventListener('click',e=>{
 const sortButton=e.target.closest('[data-career-sort]');if(sortButton){careerSort=sortButton.dataset.careerSort;const url=new URL(location.href);url.searchParams.set('sort',careerSort);history.replaceState(null,'',url);syncHubLinks();render();document.querySelector('[data-career-sort="'+careerSort+'"]')?.focus({preventScroll:true});return;}
 const a=e.target.closest('a[href]');if(!a)return;
 const url=new URL(a.href,location.href);
 if(url.origin===location.origin&&url.pathname===location.pathname&&url.searchParams.has('manager')){
  a.href=hubURL(section==='ranking'?'career':section,url.searchParams.get('manager'));
 }
});

start();
