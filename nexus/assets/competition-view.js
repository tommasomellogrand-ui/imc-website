window.NexusCompetition={mount(selected){
const {gw,esc,url}=NexusUI,view=document.getElementById('view');
const {season,key,name}=selected;let disposed=false;
const q='?world='+encodeURIComponent(gw)+'&season='+encodeURIComponent(season)+'&competition='+encodeURIComponent(key);
async function api(file,extra=''){const r=await fetch(file+q+extra,{cache:'no-store'}),j=await r.json();if(!r.ok||j.ok===false)throw Error(j.error||'Errore');return j}

let teamDirectory;
const teamById=new Map(),teamByName=new Map();
const teamNameKey=v=>String(v||'').trim().toLocaleLowerCase();
async function loadTeamDirectory(){
 if(!teamDirectory)teamDirectory=fetch('../teams/directory.php?'+new URLSearchParams({world:gw,type:key.includes('|NATIONS|')?'nations':'clubs'}),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('directory');return r.json()}).then(j=>{
  for(const t of j.rows||[]){if(t.world_id)teamById.set(String(t.world_id),t);const n=teamNameKey(t.name);if(n)teamByName.set(n,teamByName.has(n)?null:t)}
 }).catch(()=>{teamDirectory=null});
 return teamDirectory;
}
const safeImage=v=>{let s=String(v||'').replace(/^http:/i,'https:');if(s.startsWith('//'))s='https:'+s;return /^(https:\/\/|\/(?!\/))/i.test(s)?s:''};
function teamBadge(name,id){
 const t=teamById.get(String(id))||teamByName.get(teamNameKey(name)),src=safeImage(t?.image_url);
 return '<span class="ranking-team">'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy" decoding="async" width="30" height="30" onerror="this.hidden=true">':'')+'<span>'+esc(name||'—')+'</span></span>';
}
function uniqueTeams(r){
 const source=r.teams||r.clubs?.map(name=>({name}))||[],seen=new Set();
 return source.filter(t=>{
  const resolved=teamById.get(String(t.id))||teamByName.get(teamNameKey(t.name));
  const id=resolved?.world_id||t.id,token=id&&String(id)!=='0'?'id:'+id:'name:'+teamNameKey(t.name);
  if(seen.has(token))return false;seen.add(token);return true;
 });
}
function playerPortrait(r){
 const images=[...new Set((r.image_urls||[]).map(safeImage).filter(Boolean))];
 const initials=String(r.player_name||'?').split(/\s+/).filter(Boolean).map(n=>n[0]).slice(0,2).join('');
 return '<span class="ranking-photo"><span aria-hidden="true">'+esc(initials)+'</span>'+(images.length?'<img src="'+esc(images[0])+'" data-ranking-images="'+esc(JSON.stringify(images.slice(1)))+'" alt="Foto '+esc(r.player_name)+'" loading="lazy" decoding="async" width="44" height="44">':'')+'</span>';
}
function wireRankingImages(){
 view.querySelectorAll('img[data-ranking-images]').forEach(img=>{
  const next=()=>{const rest=JSON.parse(img.dataset.rankingImages||'[]');if(rest.length){img.dataset.rankingImages=JSON.stringify(rest.slice(1));img.src=rest[0]}else img.remove()};
  img.onerror=next;if(img.complete&&!img.naturalWidth)next();
 });
}
function rankingHead(title,subtitle){return '<header class="ranking-head"><h3>'+esc(title)+'</h3><p>'+esc(subtitle)+'</p></header>'}

let matchRequest,activeTab,selectedGroup='',showEpoch=0;
const groupSelect=document.getElementById('group-select'),groupFilter=document.getElementById('group-filter');
groupSelect.innerHTML='<option value="">Tutti i gruppi</option>';
groupSelect.onchange=()=>{selectedGroup=groupSelect.value;show(activeTab)};
function visibleRounds(rounds){return rounds.map(r=>({...r,rows:r.rows.filter(x=>!selectedGroup||groupName(x)===selectedGroup)})).filter(r=>r.rows.length)}
const statTypes=[['goals','Gol'],['assists','Assist'],['rating','Media voto'],['man_of_match','Uomo partita'],['yellow_card','Ammonizioni'],['red_card','Espulsioni']];
let statsData,statsMetric='goals',statsTimer,statsEpoch=0,statsLoading=false;
function renderStats(){
 const j=statsData,metric=statsMetric,label=statTypes.find(x=>x[0]===metric)[1];
 const rows=(j.rows||[]).filter(r=>metric==='rating'?r.rated_matches>0:r[metric]>0).sort((a,b)=>b[metric]-a[metric]||b.played-a.played||a.player_name.localeCompare(b.player_name)||a.sm_player_id-b.sm_player_id);
 const updated=new Date(j.generated_at).toLocaleTimeString('it-IT');
 view.innerHTML='<section class="section ranking-section"><h2>Statistiche giocatori</h2><div class="stat-tabs" aria-label="Statistiche giocatori">'+statTypes.map(([id,text])=>'<button type="button" class="stat-tab'+(id===metric?' active':'')+'" data-stat="'+id+'" aria-pressed="'+(id===metric)+'">'+text+'</button>').join('')+'</div><div class="ranking-card">'+rankingHead(label,'Stagione '+season+' · '+j.reports+' Match Report')+(rows.length?'<div class="ranking-scroll"><table class="stand player-ranking"><caption class="sr-only">'+esc(label)+' · '+esc(name)+' · Stagione '+esc(season)+'</caption><thead><tr><th scope="col">#</th><th scope="col">Giocatore</th><th scope="col"><abbr title="Partite giocate">PG</abbr></th>'+(metric==='rating'?'<th scope="col">Voti</th>':'')+'<th scope="col">'+esc(label)+'</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td class="ranking-position">'+(i+1)+'</td><th scope="row"><div class="ranking-player"><a class="ranking-player-link" href="../players/profile.html?'+esc(new URLSearchParams({world:gw,player:r.sm_player_id}))+'">'+playerPortrait(r)+'<b>'+esc(r.player_name||'ID '+r.sm_player_id)+'</b></a><div class="ranking-clubs">'+uniqueTeams(r).map(t=>teamBadge(t.name,t.id)).join('')+'</div></div></th><td>'+esc(r.played)+'</td>'+(metric==='rating'?'<td>'+esc(r.rated_matches)+'</td>':'')+'<td><span class="ranking-value">'+esc(metric==='rating'?Number(r.rating).toFixed(2):r[metric])+'</span></td></tr>').join('')+'</tbody></table></div>':'<div class="loading">'+(j.reports?'Nessun dato disponibile per '+esc(label)+'.':'Nessun Match Report disponibile per questa competizione e stagione.')+'</div>')+'</div><p class="ranking-note" id="stats-status" role="status">Aggiornamento ogni 60 secondi · Ultimo controllo '+esc(updated)+'</p>'+((j.invalid_reports||j.unidentified_players)?'<p class="ranking-note">Dati incompleti: '+j.invalid_reports+' report non utilizzabili e '+j.unidentified_players+' voci senza ID giocatore escluse.</p>':'')+'</section>';
 wireRankingImages();
 view.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>{statsMetric=b.dataset.stat;renderStats();view.querySelector('[data-stat="'+statsMetric+'"]').focus()});
}
async function refreshStats(epoch){
 if(disposed||activeTab!=='stats'||epoch!==statsEpoch||statsLoading)return;
 if(document.hidden){statsTimer=setTimeout(()=>refreshStats(epoch),60000);return;}
 statsLoading=true;
 try{const [j]=await Promise.all([api('match-report.php','&mode=stats'),loadTeamDirectory()]);if(disposed||activeTab!=='stats'||epoch!==statsEpoch)return;statsData=j;
 const focus=view.querySelector('[data-stat]:focus')?.dataset.stat;renderStats();if(focus)view.querySelector('[data-stat="'+focus+'"]').focus();
 }catch(e){if(disposed||activeTab!=='stats'||epoch!==statsEpoch)return;const status=document.getElementById('stats-status');if(status)status.textContent='Aggiornamento non riuscito: dati precedenti visibili. Nuovo tentativo automatico.';else view.innerHTML='<div class="loading">Statistiche non disponibili. Nuovo tentativo automatico tra 60 secondi.</div>';
 }finally{if(!disposed&&epoch===statsEpoch){statsLoading=false;statsTimer=setTimeout(()=>refreshStats(epoch),60000)}}
}
function statsVisibility(){if(!disposed&&!document.hidden&&activeTab==='stats'){clearTimeout(statsTimer);refreshStats(statsEpoch)}}document.addEventListener('visibilitychange',statsVisibility);
const clean=v=>String(v??'').trim();
const dateLabel=value=>{const d=clean(value).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(d)?new Date(d+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'Data non disponibile'};
function fixtureKey(r){return clean(r.sm_fixture_id)||[r.match_date,r.home_sm_club_id||r.home_sm_team_id||r.home_name,r.away_sm_club_id||r.away_sm_team_id||r.away_name].join('|')}
function distinct(rows){const seen=new Set;return rows.filter(r=>{const id=fixtureKey(r);if(seen.has(id))return false;seen.add(id);return true})}
function groupName(r){const explicit=clean(r.competition_group_name);if(explicit)return explicit;const stage=clean(r.competition_stage);return /^(?:group|gruppo|girone)\s+[A-Z0-9]+$/i.test(stage)?stage:''}
function roundMeta(r){const stage=clean(r.competition_stage),group=groupName(r),phase=stage===group?'':stage,round=clean(r.competition_round),day=clean(r.match_date).slice(0,10);return {phase,round,day,group,id:JSON.stringify([phase,round||day])}}
function makeRounds(rows,allRows,descending){
 const all=new Map;for(const r of allRows){const m=roundMeta(r);if(!all.has(m.id))all.set(m.id,{...m,first:m.day,last:m.day,action:r.sm_action,hasGroups:!!m.group});const x=all.get(m.id);if(m.day){x.first=!x.first||m.day<x.first?m.day:x.first;x.last=m.day>x.last?m.day:x.last}x.hasGroups||=!!m.group;}
 const numbers=new Map;[...all.values()].sort((a,b)=>a.first.localeCompare(b.first)||a.id.localeCompare(b.id)).forEach(x=>{const category=x.phase||'regular';const n=(numbers.get(category)||0)+1;numbers.set(category,n);x.number=n;const numeric=x.round.match(/^(?:(?:giornata|turno|round|matchday)\s*)?(\d+)$/i);const prefix=x.action==='league'?'Giornata':'Turno';x.label=x.phase?x.phase+(x.round?' · '+x.round:(!/final|ottav|quart|sparegg/i.test(x.phase)?' · '+prefix+' '+n:'')):(numeric?prefix+' '+numeric[1]:x.round||prefix+' '+n);x.inferred=!x.round&&!/final|ottav|quart|sparegg/i.test(x.phase);});
 const buckets=new Map;for(const r of rows){const id=roundMeta(r).id;if(!buckets.has(id))buckets.set(id,{...all.get(id),rows:[]});buckets.get(id).rows.push(r)}
 return [...buckets.values()].sort((a,b)=>(descending?b.last.localeCompare(a.last):a.first.localeCompare(b.first))||a.number-b.number);
}
async function loadMatches(){if(!matchRequest)matchRequest=Promise.all([api('results.php'),api('schedule.php')]).then(([r,s])=>{if(disposed)throw Error('cancelled');const results=distinct((r.rows||[]).filter(x=>x.home_score!=null&&x.away_score!=null)),played=new Set(results.map(fixtureKey)),schedule=distinct(s.rows||[]).filter(x=>!played.has(fixtureKey(x))),all=[...results,...schedule];const names=[...new Set(all.map(groupName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));groupSelect.innerHTML='<option value="">Tutti i gruppi</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');if(!names.includes(selectedGroup))selectedGroup='';groupSelect.value=selectedGroup;groupFilter.hidden=!names.length||!['overview','results','schedule'].includes(activeTab);return {results:makeRounds(results,all,true),schedule:makeRounds(schedule,all,false)}}).catch(e=>{matchRequest=null;throw e});return matchRequest}
/* Competition diary: result facts only; report enrichment is optional and scoped. */
async function feedReports(){
 try{
  const response=await fetch('match-report.php'+q+'&mode=feed',{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('reports');
  const data=await response.json();if(data.ok===false||!Array.isArray(data.rows))throw Error('reports');
  return {rows:new Map(data.rows.map(r=>[String(r.sm_fixture_id),r])),available:true};
 }catch(e){return {rows:new Map(),available:false}}
}
function feedIsIMC(r,side){return !!r[side+'_imc_manager_id']&&!!r[side+'_imc_manager_name']}
function feedTeam(r,side){
 const logo=safeImage(r[side+'_logo_url']);
 return '<div class="feed-team">'+(logo?'<img src="'+esc(logo)+'" width="34" height="38" loading="lazy" alt="" onerror="this.hidden=true">':'')+'<div><b>'+esc(r[side+'_name']||'—')+'</b>'+(feedIsIMC(r,side)?'<small>'+esc(r[side+'_imc_manager_name'])+' <span class="feed-imc">IMC</span></small>':'')+'</div></div>';
}
function feedContext(r,roundLabel=''){
 const stage=clean(r.competition_stage),round=clean(r.competition_round),phase=(stage+' '+round).toLowerCase();
 const league=r.sm_action==='league',group=groupName(r);
 // Leg numbers must be explicit: a round number alone never means first/second leg.
 const leg=/\b(?:ritorno|second leg|2nd leg|leg 2)\b/.test(phase)?2:/\b(?:andata|first leg|1st leg|leg 1)\b/.test(phase)?1:0;
 const final=/^(?:final|finale)(?:\s*[-·:]?\s*(?:andata|ritorno|first leg|second leg|1st leg|2nd leg))?$/i.test(stage)||/^(?:final|finale)$/i.test(round);
 const knockout=!league&&!group&&(/\b(?:final|finale|semifinal|semifinale|semifinali|quarti|ottavi|quarter|quarterfinal|quarterfinals|round of|knockout|eliminazione|spareggio|playoff)\b/i.test(phase)||final);
 const single=/\b(?:gara secca|partita secca|single leg|one leg|turno unico)\b/i.test(phase);
 const type=r.sm_action==='friendly'?'Amichevole':r.sm_action==='interqualifier'?'Qualificazioni':'Coppa';
 const label=league?['Campionato',roundLabel].filter(Boolean).join(' · '):[group||stage||type,leg===1?'Andata':leg===2?'Ritorno':(!stage?roundLabel:'')].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
 return {league,group,leg,final,knockout,single,label};
}
function feedChoice(r,scenario,options){
 // Stable editorial rotation: refreshing never changes the headline.
 let hash=2166136261;
 for(const c of [gw,season,key,r.sm_fixture_id,r.match_date,scenario].join('|'))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 return options[hash%options.length];
}
function feedStory(r,context=feedContext(r)){
 const h=Number(r.home_score),a=Number(r.away_score),both=feedIsIMC(r,'home')&&feedIsIMC(r,'away');
 const side=both?(h>=a?'home':'away'):(feedIsIMC(r,'home')?'home':'away'),otherSide=side==='home'?'away':'home';
 const own=side==='home'?h:a,other=side==='home'?a:h,manager=r[side+'_imc_manager_name'],team=r[side+'_name'],opponent=r[otherSide+'_name'],away=side==='away';
 const pick=(id,options)=>({scenario:id,title:feedChoice(r,id,options)});
 const valid=v=>v!==null&&v!==undefined&&/^\d+$/.test(String(v));
 const ah=r.aggregate_home_score,aa=r.aggregate_away_score,ph=r.penalty_home_score,pa=r.penalty_away_score;
 const aggregate=valid(ah)&&valid(aa),penalties=valid(ph)&&valid(pa)&&Number(ph)!==Number(pa)&&(aggregate?Number(ah)===Number(aa):h===a);
 const decided=context.knockout&&context.leg!==1&&(penalties||(context.leg===2&&aggregate&&Number(ah)!==Number(aa))||((context.final||context.single)&&!context.leg&&!aggregate&&h!==a));
 let story;
 if(decided){
  const winningSide=penalties?(Number(ph)>Number(pa)?'home':'away'):aggregate?(Number(ah)>Number(aa)?'home':'away'):(h>a?'home':'away');
  const win=winningSide===side,winner=r[winningSide+'_name'];
  if(context.final)story=pick(win?'final-won':'final-lost',win?[manager+' alza il trofeo: festa '+team,team+', la finale è tua!']:[manager+', il sogno si ferma in finale','Finale amara per '+team]);
  else if(penalties)story=pick(win?'penalties-won':'penalties-lost',win?[manager+' passa ai rigori',team+', qualificazione dal dischetto']:[manager+', i rigori dicono no',team+' esce ai rigori']);
  else if(win&&own<other)story=pick('aggregate-loss-through',['Sconfitta indolore: '+manager+' passa',team+', il totale vale la qualificazione']);
  else if(!win&&own>other)story=pick('aggregate-win-out',['A '+manager+' non basta vincere',team+', vittoria senza qualificazione']);
  else story=pick(win?'aggregate-through':'aggregate-out',win?[manager+' stacca il pass',team+(aggregate?' avanti: decide il totale':' conquista la qualificazione')]:[manager+' saluta la coppa',team+', il cammino si interrompe']);
  story.text=team+' '+(own>other?'vince':own===other?'pareggia':'perde')+' '+own+'–'+other+' '+(away?'in trasferta':'in casa')+'. '+(penalties?'Rigori: '+ph+'–'+pa+'. ':aggregate?'Totale delle due sfide: '+ah+'–'+aa+'. ':'')+winner+(context.final?' conquista il trofeo.':' passa il turno.');
  return story;
 }
 if(context.leg===1)story=pick(own>other?'first-leg-win':own<other?'first-leg-loss':'first-leg-draw',own>other?[manager+' firma il primo atto',team+', vantaggio nell’andata']:own<other?[manager+', servirà un altro ritorno',team+', andata in salita']:['Tutto aperto tra '+team+' e '+opponent,'Nessun vincitore nel primo atto']);
 else if(context.leg===2)story=pick('return-undecided',['Ritorno: '+team+' chiude sul '+own+'–'+other,manager+', il risultato del ritorno']);
 else if(both)story=pick(own===other?'imc-draw':away?'imc-away':'imc-home',own===other?['Il confronto IMC finisce in parità','Equilibrio nel duello IMC']:away?[manager+' fa suo il duello IMC in trasferta','Colpo esterno di '+manager+' nel confronto IMC']:[manager+' si prende il confronto IMC','Il duello IMC premia '+manager]);
 else if(own===other)story=pick(own===0?'goalless':own>=2?'scoring-draw':away?'away-draw':'home-draw',own===0?['Reti inviolate tra '+team+' e '+opponent,manager+', stavolta finisce senza gol']:own>=2?['Gol e parità: '+team+' chiude sul '+own+'–'+other,'Botta e risposta nel punteggio: '+team+' pareggia']:away?[manager+' torna con un pareggio','Parità in trasferta per '+team]:[manager+', pareggio davanti al proprio pubblico',team+' divide la posta']);
 else if(own>other)story=pick(own-other>=3?(away?'away-big':'home-big'):other===0?(away?'away-clean':'home-clean'):away?'away-win':'home-win',own-other>=3?[team+' a valanga: '+own+'–'+other,manager+' firma una vittoria larga']:other===0?(away?[manager+' espugna il campo di '+opponent,'Colpo esterno e porta inviolata per '+team]:[manager+' vince e tiene la porta chiusa',team+', successo senza subire gol']):away?[manager+' espugna il campo di '+opponent,team+' passa in trasferta','Colpo esterno di '+manager]:[manager+' fa valere il fattore campo',team+', vittoria davanti al proprio pubblico']);
 else story=pick(away?'away-loss':'home-loss',away?[manager+', trasferta amara sul campo di '+opponent,team+' torna senza la vittoria']:[opponent+' passa sul campo di '+team,manager+', il fattore campo non basta']);
 story.text=team+(own>other?' supera ':own===other?' pareggia con ':' perde contro ')+opponent+' per '+own+'–'+other+' '+(away?'in trasferta':'in casa')+'.';
 if(both)story.text+=' Confronto tra '+r.home_imc_manager_name+' e '+r.away_imc_manager_name+'.';
 if(context.leg===1)story.text+=' La qualificazione si deciderà al ritorno.';
 else if(context.leg===2)story.text+=' Il risultato della partita, da solo, non conferma la qualificazione.';
 else if(context.league)story.text+=own>other?' Tre punti per '+manager+'.':own===other?' Un punto per parte.':' Nessun punto per '+manager+'.';
 return story;
}
function feedCard(r,reports,featured=false,roundLabel=''){
 const imc=feedIsIMC(r,'home')||feedIsIMC(r,'away'),context=feedContext(r,roundLabel),story=imc?feedStory(r,context):null;
 const report=reports.rows.get(String(r.sm_fixture_id));
 // Never combine a report's player facts with a conflicting Results score.
 const consistent=report&&report.home_score!=null&&report.away_score!=null&&Number(report.home_score)===Number(r.home_score)&&Number(report.away_score)===Number(r.away_score);
 const facts=consistent?(report.players||[]):[],scorers=facts.filter(p=>p.goals>0).map(p=>p.name+' ('+p.goals+')'),mvps=facts.filter(p=>p.mvp).map(p=>p.name);
 return '<article class="feed-card'+(featured?' feed-featured':'')+(imc?' feed-editorial':'')+'">'+
 '<div class="feed-card-meta"><span>'+esc(context.label)+'</span>'+(featured?'<span class="feed-kicker">IN EVIDENZA · IMC</span>':'')+'</div>'+
 (story?'<h4>'+esc(story.title)+'</h4>':'')+
 '<div class="feed-scoreline">'+feedTeam(r,'home')+'<div class="score">'+matchScore(r)+'</div>'+feedTeam(r,'away')+'</div>'+
 (story?'<p class="feed-comment">'+esc(story.text)+'</p>':'')+
 (imc&&(scorers.length||mvps.length)?'<p class="feed-facts">'+(scorers.length?'Marcatori: '+esc(scorers.join(', '))+'. ':'')+(mvps.length?'MVP: '+esc(mvps.join(', '))+'.':'')+'</p>':'')+
 (report?'<a class="feed-report" href="match.html?'+esc(new URLSearchParams({world:gw,fixture:r.sm_fixture_id}))+'">Match Report →</a>':'')+'</article>';
}
function newsFeed(rounds,reports){
 if(!rounds.length)return '<section class="section competition-feed"><h2>Diario della competizione</h2><div class="empty">Nessun risultato disponibile. Il diario si popolerà con le prime partite.</div></section>';
 return '<section class="section competition-feed"><div class="feed-heading"><span class="feed-kicker">COMPETITION NEWS</span><h2>Diario della competizione</h2><p>Risultati e protagonisti IMC · Stagione '+esc(season)+'</p></div>'+
 (!reports.available?'<p class="ranking-note">Match Report temporaneamente non disponibili: sono mostrati i risultati senza dettagli aggiuntivi.</p>':'')+
 rounds.map((round,index)=>{
  const rows=[...round.rows].sort((a,b)=>String(b.match_date).localeCompare(String(a.match_date))||String(a.sm_fixture_id).localeCompare(String(b.sm_fixture_id),undefined,{numeric:true}));
  const featured=index===0?rows.find(r=>feedIsIMC(r,'home')||feedIsIMC(r,'away')):null;
  const dates=[...new Set(rows.map(r=>clean(r.match_date).slice(0,10)))].sort();
  const label=dateLabel(dates[0])+(dates.length>1?' – '+dateLabel(dates.at(-1)):'');
  return '<details class="feed-round" data-round="'+esc('news:'+round.id)+'"'+(!index?' open':'')+'><summary><span class="feed-kicker">'+(!index?'ULTIMO TURNO':'ARCHIVIO')+'</span><h3>'+esc(round.label)+'</h3><span>'+esc(label)+'</span></summary><div class="feed-items">'+
  (featured?feedCard(featured,reports,true,round.label):'')+rows.filter(r=>r!==featured).map(r=>feedCard(r,reports,false,round.label)).join('')+
  '</div></details>';
 }).join('')+'<p class="ranking-note">Commenti automatici basati sui Results. Marcatori e MVP provengono esclusivamente dai Match Report disponibili.</p></section>';
}
function matchTeam(r,side){const logo=String(r[side+'_logo_url']||''),manager=r[side+'_imc_manager_name'],name=r[side+'_name'];return '<div class="match-team '+(side==='away'?'away':'home')+'">'+(/^(https:\/\/|\/(?!\/))/i.test(logo)?'<img class="team-logo" src="'+esc(logo)+'" alt="Logo '+esc(name)+'" width="36" height="36" loading="lazy" decoding="async" onerror="this.hidden=true">':'')+'<div class="team-label"><b>'+esc(name)+'</b>'+(manager?'<small class="team-manager">'+esc(manager)+'</small>':'')+'</div></div>'}
function matchScore(r){const valid=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&/^\d+$/.test(String(v));let text=esc(r.home_score)+' - '+esc(r.away_score);for(const [prefix,label] of [['aggregate','Totale A/R'],['penalty','Rigori']]){const h=r[prefix+'_home_score'],a=r[prefix+'_away_score'];if(valid(h)&&valid(a))text+='<small style="display:block;font-size:10px;font-weight:600;line-height:1.4;margin-top:4px;text-align:center">'+label+' '+esc(h)+' - '+esc(a)+'</small>'}return text}
function matches(rows,score=true){return rows.map(r=>'<div class="match">'+matchTeam(r,'home')+'<span class="score">'+(score?matchScore(r)+'<small>FINALE</small>':'VS<small>IN PROGRAMMA</small>')+'</span>'+matchTeam(r,'away')+(score?'<a class="open-match-report" href="match.html?'+esc(new URLSearchParams({world:gw,fixture:r.sm_fixture_id}))+'">Match Report</a>':'')+'</div>').join('')}
function roundsHtml(rounds,score){if(!rounds.length)return '<div class="card loading">'+(score?'Nessun risultato disponibile.':'Nessuna partita in calendario.')+'</div>';return rounds.map((round,index)=>{const groups=new Map;for(const r of round.rows){const name=groupName(r);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r)}const hasGroups=[...groups.keys()].some(Boolean),dates=[...new Set(round.rows.map(r=>clean(r.match_date).slice(0,10)))].sort(),dateRange=dates.length?dateLabel(dates[0])+(dates.length>1?' – '+dateLabel(dates.at(-1)):''):'Data non disponibile';return '<details class="round-box" data-round="'+esc((score?'r:':'s:')+round.id)+'"'+(!index?' open':'')+'><summary class="round-head">'+(!index?'<span class="round-kicker">'+(score?'ULTIMO TURNO':'PROSSIMO TURNO')+'</span>':'')+'<h3>'+esc(round.label)+'</h3><span>'+esc(dateRange)+'</span></summary>'+[...groups.entries()].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([name,rows])=>'<div class="round-group">'+(hasGroups?'<h4>'+esc(name||'Girone non indicato')+'</h4>':'')+matches(rows,score)+'</div>').join('')+'</details>'}).join('')}
async function show(tab,background=false){if(disposed)return;const epoch=++showEpoch;const opened=background?new Set([...view.querySelectorAll('details[open]')].map(x=>x.dataset.round)):null;clearTimeout(statsTimer);statsEpoch++;statsLoading=false;activeTab=tab;groupFilter.hidden=!['overview','results','schedule'].includes(tab)||groupSelect.options.length<2;if(!background)view.innerHTML='<div class="loading">Caricamento dati…</div>';try{if(['overview','results','schedule'].includes(tab)){const raw=await loadMatches(),j={results:visibleRounds(raw.results),schedule:visibleRounds(raw.schedule)};if(disposed||activeTab!==tab||epoch!==showEpoch)return;const group=key.split('|').find(x=>['DOMESTIC','INTERNATIONAL','NATIONS'].includes(x));if(tab==='overview'){const reports=await feedReports();if(disposed||activeTab!==tab||epoch!==showEpoch)return;const next=j.schedule[0];view.innerHTML=newsFeed(j.results,reports)+'<section class="section"><h2>Prossime partite</h2>'+roundsHtml(next?[next]:[],false)+'</section>'}else view.innerHTML='<section class="section"><h2>'+ (tab==='results'?'Risultati':'Calendario')+'</h2>'+roundsHtml(j[tab],tab==='results')+'</section>';return}
if(tab==='standings'){const [j]=await Promise.all([api('standings.php'),loadTeamDirectory()]);if(disposed||activeTab!==tab||epoch!==showEpoch)return;
const groups=j.groups||[{group_name:null,rows:j.rows||[]}];
view.innerHTML='<section class="section ranking-section"><h2>Table</h2>'+(j.excluded_unassigned?'<p class="ranking-note">'+esc(j.excluded_unassigned)+' partite senza girone identificato non incluse.</p>':'')+(groups.length?groups.map(g=>'<section class="ranking-card standings-card">'+rankingHead(g.group_name||name,'Stagione '+season)+'<div class="ranking-scroll" tabindex="0" role="region" aria-label="Classifica '+esc(g.group_name||name)+'"><table class="stand team-ranking"><caption class="sr-only">Classifica '+esc(g.group_name||name)+'</caption><thead><tr><th scope="col">#</th><th scope="col">Squadra</th><th scope="col"><abbr title="Punti">PT</abbr></th><th scope="col"><abbr title="Partite giocate">PG</abbr></th><th scope="col"><abbr title="Vittorie">V</abbr></th><th scope="col"><abbr title="Pareggi">N</abbr></th><th scope="col"><abbr title="Sconfitte">P</abbr></th><th scope="col"><abbr title="Gol fatti">GF</abbr></th><th scope="col"><abbr title="Gol subiti">GS</abbr></th><th scope="col"><abbr title="Differenza reti">DR</abbr></th></tr></thead><tbody>'+g.rows.map(r=>'<tr><td class="ranking-position">'+esc(r.position)+'</td><th scope="row">'+teamBadge(r.team_name,r.team_id)+'</th><td><span class="ranking-value">'+esc(r.points)+'</span></td><td>'+esc(r.played)+'</td><td>'+esc(r.won)+'</td><td>'+esc(r.drawn)+'</td><td>'+esc(r.lost)+'</td><td>'+esc(r.gf)+'</td><td>'+esc(r.ga)+'</td><td>'+esc(r.gd)+'</td></tr>').join('')+'</tbody></table></div></section>').join(''):'<div class="empty">Nessuna classifica disponibile per questa competizione.</div>')+'<p class="ranking-note">'+(j.grouped?'Classifiche calcolate dai risultati di ciascun girone.':'Classifica calcolata dai risultati della competizione.')+'</p></section>';
}
if(tab==='stats')await refreshStats(statsEpoch)}catch(e){if(disposed||activeTab!==tab||epoch!==showEpoch)return;view.innerHTML='<div class="loading">'+esc(e.message)+'</div>'}finally{if(!disposed&&opened&&epoch===showEpoch)view.querySelectorAll('details').forEach(d=>d.open=opened.has(d.dataset.round))}}
function selectTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});const next=new URLSearchParams(location.search);next.set('tab',tab);history.replaceState(null,'','?'+next);show(tab)}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>selectTab(b.dataset.tab));
selectTab(selected.tab||'overview');
function refreshVisible(){if(disposed||document.hidden||activeTab==='stats')return;matchRequest=null;show(activeTab,true)}
const matchTimer=setInterval(refreshVisible,60000);document.addEventListener('visibilitychange',refreshVisible);

return ()=>{disposed=true;clearTimeout(statsTimer);clearInterval(matchTimer);document.removeEventListener('visibilitychange',statsVisibility);document.removeEventListener('visibilitychange',refreshVisible)};
}};


