import {KEY,people,players} from './model.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let base,details,playerError=false,kind='club',entries=[],placements=new Map();
const initial=name=>String(name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const safe=url=>/^(https:\/\/|\/(?!\/))/.test(url||'')?url:null;
const portrait=(r,type,mini=false)=>{const src=type==='player'?r.images?.[0]:type==='club'?base.teams['club:'+r.id]?.image_url:null;return safe(src)?`<img class="${mini?'':'portrait'}" src="${esc(src)}" alt="" loading="lazy" ${type==='player'?`data-player-image="${r.id}"`:''}>`:`<span class="portrait initials" aria-hidden="true">${esc(initial(r.name))}</span>`;};
function images(root){for(const img of root.querySelectorAll('img'))img.addEventListener('error',()=>{const id=img.dataset.playerImage;const p=id?details?.players?.[id]:null;const index=Number(img.dataset.fallback||0)+1;if(p?.images?.[index]){img.dataset.fallback=index;img.src=p.images[index];}else{const s=document.createElement('span');s.className='portrait initials';s.textContent=id?initial(p?.name):'◇';s.setAttribute('aria-hidden','true');img.replaceWith(s);} });}
const metrics=(items)=>`<div class="metrics">${items.map(([n,t])=>`<div><strong>${n??'—'}</strong><small>${esc(t)}</small></div>`).join('')}</div>`;
const filtered=()=>{const s=$('season').value;return {matches:base.matches.filter(m=>m.key===KEY&&(!s||String(m.season)===s)),awards:base.awards.filter(a=>a.key===KEY&&(!s||String(a.season)===s)),stints:(details?.stints||[]).filter(p=>!s||String(p.season)===s)};};
function coverage(matches){const season=$('season').value;const n=Object.entries(details?.coverage||{}).filter(([s])=>!season||s===season).reduce((sum,[,v])=>sum+Number(v),0);return `Statistiche giocatori: ${n} Match Report con dati su ${matches.length} risultati Platinum. I valori descrivono soltanto i report disponibili.`;}
function best(id){const s=$('season').value;const ranks=[...placements].filter(([season])=>!s||String(season)===s).map(([,rows])=>rows.find(r=>String(r.team_id)===String(id))?.position).filter(Boolean);return ranks.length?Math.min(...ranks):null;}
function render(){
 const f=filtered();$('player-sort-label').hidden=kind!=='player';
 entries=kind==='player'?players(f.stints,details?.players||{}):people(f.matches,f.awards,kind,base.managers);
 if(kind==='player'){const key=$('player-sort').value;entries.sort((a,b)=>b[key]-a[key]||b.played-a.played||a.name.localeCompare(b.name,'it'));}
 const q=$('search').value.trim().toLocaleLowerCase('it');const visible=entries.filter(r=>(r.name+' '+[...r.teams].join(' ')).toLocaleLowerCase('it').includes(q));
 $('coverage').textContent=kind==='player'?(playerError?'I Match Report giocatori sono temporaneamente non disponibili.':coverage(f.matches)):kind==='manager'?'Incarichi storici verificati alla data di ogni partita. Le iniziali identificano i manager per i quali non è disponibile un ritratto.':'Presenze e traguardi esclusivamente nella Platinum Division. I piazzamenti si riferiscono alle stagioni concluse.';
 $('count').textContent=visible.length+' '+({club:'SQUADRE',manager:'MANAGER',player:'GIOCATORI'}[kind]);
 const max=kind==='player'?Math.max(0,...entries.map(r=>r[$('player-sort').value])):0;
 $('gallery').innerHTML=visible.length?visible.map(r=>{
  const badge=kind==='player'?(max>0&&r[$('player-sort').value]===max?{played:'Più presenze',goals:'Più gol',assists:'Più assist',mom:'Più premi in campo'}[$('player-sort').value]:'Protagonista Platinum'):r.titles?`${r.titles} ${r.titles===1?'titolo Platinum':'titoli Platinum'}`:`${r.seasons.size} ${r.seasons.size===1?'stagione':'stagioni'} in Platinum`;
  return `<button class="person" data-id="${esc(r.id)}" aria-label="Scopri la storia di ${esc(r.name)}"><span class="medal">${esc(badge)}</span>${portrait(r,kind)}<h3>${esc(r.name)}</h3><span class="sub">${esc(kind==='club'?(best(r.id)?'Miglior piazzamento: '+best(r.id)+'°':'La storia nella prima divisione'):[...r.teams].join(' · '))}</span>${metrics(kind==='player'?[[r.played,'Presenze'],[r.goals,'Gol'],[r.assists,'Assist']]:[[r.played,'Presenze'],[r.won,'Vittorie']])}<span class="story-link">SCOPRI IL PERCORSO →</span></button>`;
 }).join(''):`<p class="empty">${kind==='player'&&playerError?'Statistiche giocatori temporaneamente non disponibili.':q?'Nessun protagonista corrisponde alla ricerca.':'Nessun protagonista documentato per questa selezione.'}</p>`;
 images($('gallery'));for(const b of $('gallery').querySelectorAll('[data-id]'))b.addEventListener('click',()=>open(entries.find(r=>String(r.id)===b.dataset.id)));
 $('archive-link').href='/theroadalmanac/?'+new URLSearchParams({competition:KEY,...($('season').value?{season:$('season').value}:{})});
 const params=new URLSearchParams();if($('season').value)params.set('season',$('season').value);if(kind!=='club')params.set('view',kind);history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
}
function open(r){
 const type=kind;let historyRows=r.history.slice().sort((a,b)=>b.season-a.season);
 const awards=filtered().awards.filter(a=>type==='club'?a.winner_id===r.id:a.manager===r.id);
 const href=type==='player'?'/nexus/players/profile.html?'+new URLSearchParams({world:'GW001',player:r.id}):type==='manager'?'/nexus/managers/profile.html?'+new URLSearchParams({world:'GW001',manager:r.id}):'/nexus/teams/detail.html?'+new URLSearchParams({world:'GW001',type:'club',id:r.id});
 $('profile-content').innerHTML=`<div class="profile-head">${portrait(r,type)}<p class="eyebrow">IL PERCORSO IN PLATINUM</p><h2 id="profile-name">${esc(r.name)}</h2>${metrics(type==='player'?[[r.played,'Presenze'],[r.goals,'Gol'],[r.assists,'Assist']]:[[r.played,'Presenze'],[r.won,'Vittorie'],[r.titles,'Titoli']])}</div>${type==='player'?`<p class="profile-note">${r.minutes===null?'Minuti: copertura incompleta':r.minutes+' minuti documentati'} · Voto medio ${r.average??'non disponibile'} su ${r.rated} presenze con voto · ${r.mom} premi di migliore in campo.</p>`:''}<ol class="timeline">${historyRows.map(h=>`<li><strong>Stagione ${h.season}</strong><p>${esc(type==='player'?h.club_name:h.team)}</p><p>${type==='player'?`${h.appearances} presenze · ${h.goals} gol · ${h.assists} assist<br>${h.starts} da titolare · ${h.subs} da subentrato · ${h.yellow} ammonizioni · ${h.red} espulsioni`:`${h.played} presenze · ${h.won} vittorie`}</p>${awards.some(a=>a.season===h.season&&a.winner===(type==='club'?r.name:h.team))?'<p>✦ Campione Platinum</p>':''}</li>`).join('')}</ol><p class="profile-note">${type==='player'?coverage(filtered().matches):'Statistiche limitate ai risultati Platinum disponibili. Le presenze del manager seguono gli incarichi dell’epoca.'}</p><a class="profile-nexus" href="${esc(href)}">Profilo completo in Nexus ↗</a>`;
 images($('profile-content'));$('profile').setAttribute('aria-labelledby','profile-name');$('profile').showModal();
}
function champion(){
 const closed=new Set(base.seasons.filter(s=>s.imc_season_end_date&&s.imc_season_end_date<new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'})).map(s=>Number(s.imc_season)));
 const award=base.awards.filter(a=>a.key===KEY&&closed.has(a.season)).sort((a,b)=>b.season-a.season)[0];
 if(!award){$('champion').innerHTML='<p class="empty">Il prossimo capitolo attende il suo campione. Nessun titolo Platinum di una stagione conclusa è disponibile.</p>';return;}
 const stars=players((details?.stints||[]).filter(p=>p.season===award.season&&String(p.club_id)===award.winner_id),details?.players||{}).sort((a,b)=>b.goals-a.goals||b.played-a.played).slice(0,3);
 $('champion').innerHTML=`<article class="champion"><div class="champion-main">${portrait({id:award.winner_id,name:award.winner},'club')}<div><p class="eyebrow">CAMPIONI IN CARICA · STAGIONE ${award.season}</p><h2>${esc(award.winner)}</h2><p>${esc(award.manager?base.managers[award.manager]:'Manager storico non disponibile')}</p><p>Il titolo dell’ultima stagione conclusa.</p></div></div>${stars.length?`<p class="eyebrow" style="margin-top:24px">TRA I PROTAGONISTI DELLA STAGIONE</p><div class="champion-players">${stars.map(p=>`<div class="mini">${portrait(p,'player',true)}<strong>${esc(p.name)}</strong><span>${p.played} presenze · ${p.goals} gol</span></div>`).join('')}</div>`:''}</article>`;
 images($('champion'));
}
function switchTab(next){kind=next;for(const b of document.querySelectorAll('[data-kind]')){b.setAttribute('aria-selected',String(b.dataset.kind===kind));b.tabIndex=b.dataset.kind===kind?0:-1;}$('gallery').setAttribute('aria-labelledby','tab-'+kind);$('search').value='';render();}
async function get(url){const r=await fetch(url,{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(url);return d;}
async function load(){
 $('retry').hidden=true;try{
  const results=await Promise.allSettled([get('/theroadalmanac/data.php'),get('/platinumlegacy/data.php')]);if(results[0].status!=='fulfilled')throw Error();base=results[0].value;if(base.world!=='GW001')throw Error();details=results[1].status==='fulfilled'?results[1].value:null;playerError=!details;
  const seasonSet=new Set(base.competitions.filter(c=>c.key===KEY).map(c=>c.season));
  $('season').innerHTML='<option value="">Tutta la storia</option>'+[...seasonSet].sort((a,b)=>b-a).map(s=>`<option value="${s}">Stagione ${s}</option>`).join('');
  const q=new URLSearchParams(location.search);if(seasonSet.has(Number(q.get('season'))))$('season').value=q.get('season');kind=['club','manager','player'].includes(q.get('view'))?q.get('view'):'club';
  const closed=base.seasons.filter(s=>s.imc_season_end_date&&s.imc_season_end_date<new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'})&&seasonSet.has(Number(s.imc_season)));
  await Promise.allSettled(closed.map(async s=>{const d=await get('/nexus/competitions/standings.php?'+new URLSearchParams({world:'GW001',season:s.imc_season,competition:KEY}));if(d.rows?.length)placements.set(Number(s.imc_season),d.rows);}));
  $('status').textContent='Nexus GW001 · Storia della Platinum Division · '+(playerError?'Dati giocatori temporaneamente non disponibili.':'Risultati, incarichi storici e Match Report.');
  $('content').hidden=false;champion();switchTab(kind);
 }catch{$('content').hidden=true;$('status').textContent='La storia Platinum è temporaneamente non disponibile. Riprova tra poco.';$('retry').hidden=false;}
}
for(const b of document.querySelectorAll('[data-kind]')){b.addEventListener('click',()=>switchTab(b.dataset.kind));b.addEventListener('keydown',e=>{const keys=['club','manager','player'];let index=keys.indexOf(kind);if(e.key==='ArrowRight')index=(index+1)%3;else if(e.key==='ArrowLeft')index=(index+2)%3;else if(e.key==='Home')index=0;else if(e.key==='End')index=2;else return;e.preventDefault();switchTab(keys[index]);$('tab-'+kind).focus();});}
$('season').addEventListener('change',render);$('search').addEventListener('input',render);$('player-sort').addEventListener('change',render);$('close').addEventListener('click',()=>$('profile').close());$('profile').addEventListener('click',e=>{if(e.target===$('profile')){const r=$('profile').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('profile').close();}});$('retry').addEventListener('click',load);load();
