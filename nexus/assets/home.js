(()=>{
'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),valid=v=>/^GW00[1-9]$|^GW010$/.test(v||'');
if(!valid(params.get('world'))){location.replace('club-house/'+location.search+location.hash);return;}
let saved='';try{saved=localStorage.getItem('imc_nexus_world')||''}catch(e){}
const gw=valid(params.get('world'))?params.get('world'):valid(saved)?saved:'GW001';
if(params.get('section')==='players'){location.replace('players/page.html?'+new URLSearchParams({world:gw}));return;}
const section=['players','trophies'].includes(params.get('section'))?params.get('section'):'';
try{localStorage.setItem('imc_nexus_world',gw)}catch(e){}
params.set('world',gw);history.replaceState(null,'','?'+params);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>{let s=String(v||'').replace(/^http:/i,'https:');if(s.startsWith('//'))s='https:'+s;return /^(https:\/\/|\/(?!\/))/i.test(s)?s:''};
const url=(path,extra={})=>path+'?'+new URLSearchParams({world:gw,...extra});
const paths={home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',cup:'<path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v6M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/>',manager:'<circle cx="12" cy="7" r="4"/><path d="M3 21v-2a9 7 0 0 1 18 0v2z"/>',club:'<path d="m12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6z"/>',transfer:'<path d="M3 7h17m-5-5 5 5-5 5M21 17H4m5-5-5 5 5 5"/>',book:'<path d="M12 5v16M12 5C9 2 5 2 2 3v16c4-1 7-1 10 2 3-3 6-3 10-2V3c-3-1-7-1-10 2z"/>',star:'<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z"/>',menu:'<path d="M3 5h18M3 12h18M3 19h18"/>'};
const icon=k=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+paths[k]+'</svg>';
const sections=[['Competizioni','cup',url('competitions/')],['Manager','manager',url('managers/page.html')],['Club','club',url('teams/page.html')],['Nations','club',url('teams/page.html',{type:'nations'})],['Transfers','transfer',url('transfers/page.html')],['Player Codex','book',url('players/page.html')],['Trophy Room','star',url('./',{section:'trophies'})],['Club House','manager','club-house/']];
for(let i=1;i<=10;i++){const id='GW'+String(i).padStart(3,'0');$('world').add(new Option(id,id))}$('world').value=gw;$('world').onchange=()=>location.href='./?'+new URLSearchParams({world:$('world').value});
$('shortcuts').innerHTML=sections.map(([name,k,href])=>'<a class="shortcut" href="'+esc(href)+'">'+icon(k)+'<span>'+name+'</span></a>').join('');
document.querySelectorAll('[data-destination]').forEach(a=>a.href=url(a.dataset.destination));
$('bottom-nav').innerHTML=[['Home','home',url('./')],...sections.slice(0,1),sections[2],sections[1]].map(([name,k,href])=>'<a href="'+esc(href)+'"'+(name==='Home'&&!section?' aria-current="page"':'')+'>'+icon(k)+'<span>'+name+'</span></a>').join('')+'<button id="open-more" aria-haspopup="dialog">'+icon('menu')+'<span>Altro</span></button>';
$('more-links').innerHTML=sections.slice(3).concat(gw==='GW001'?[['The Club','cup',url('the-club/')]]:[]).map(([name,k,href])=>'<a href="'+esc(href)+'">'+icon(k)+name+'</a>').join('');$('open-more').onclick=()=>$('more').showModal();$('close-more').onclick=()=>$('more').close();$('more').onclick=e=>{if(e.target===$('more'))$('more').close()};$('back-home').href=url('./');
async function get(path){const r=await fetch(path,{cache:'no-store'});const d=await r.json();if(!r.ok||d.ok===false)throw Error('Dati non disponibili');return d}
const message=(id,text)=>{$(id).innerHTML='<p class="empty">'+esc(text)+'</p>'};
function date(value){const day=String(value||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return 'Data non disponibile';return new Date(day+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Rome'})}
function logo(src){src=safe(src);return src?'<img data-club-logo src="'+esc(src)+'" alt="" loading="lazy">':''}
function team(r,side){return '<div class="team '+(side==='away'?'away':'')+'">'+logo(r[side+'_logo_url'])+'<div class="team-copy"><strong>'+esc(r[side+'_name'])+'</strong>'+(r[side+'_imc_manager_name']?'<small>'+esc(r[side+'_imc_manager_name'])+'</small>':'')+'</div></div>'}
function score(r,kind){let main,details=[];if(kind==='results'){main=esc(r.home_score)+' – '+esc(r.away_score);details.push('FINALE');if(r.penalty_home_score!=null&&r.penalty_away_score!=null)details.push('Rigori '+r.penalty_home_score+'–'+r.penalty_away_score);if(r.aggregate_home_score!=null&&r.aggregate_away_score!=null)details.push('Totale A/R '+r.aggregate_home_score+'–'+r.aggregate_away_score)}else{main='VS';details.push('IN PROGRAMMA')}return '<div class="score"><b>'+main+'</b>'+details.map(d=>'<small>'+esc(d)+'</small>').join('')+'</div>'}
function round(r){let v=String(r.competition_round||r.competition_stage||'').trim();if(/^\d+$/.test(v))v='Giornata '+v;return v}
function renderMatches(rows,kind,season,error){if(error){message(kind,'Dati temporaneamente non disponibili. Riprova tra poco.');return}if(!rows.length){message(kind,kind==='results'?'Nessun risultato disponibile per la stagione in corso.':'Nessuna prossima partita caricata per la stagione in corso.');return}const groups=new Map();for(const r of rows){const key=[r.competition_key,round(r),r.competition_group_name||'',String(r.match_date).slice(0,10)].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)}$(kind).innerHTML=[...groups.values()].map(matches=>{const r=matches[0];const href=url('competitions/view.html',{season,competition:r.competition_key,name:r.nexus_view});return '<article class="match-box"><div class="match-heading"><a href="'+esc(href)+'">'+esc(r.nexus_view)+'<span>'+esc([round(r),r.competition_group_name].filter(Boolean).map(x=>' · '+x).join(''))+'</span></a><time>'+esc(date(r.match_date))+'</time></div>'+matches.map(x=>'<div class="match">'+team(x,'home')+score(x,kind)+team(x,'away')+(kind==='results'?'<a class="open-match-report" style="display:block;grid-column:1 / -1;text-align:center;border-top:1px solid #e1e5ee;padding:12px 8px;color:#101238;font-size:12px;font-weight:700;text-decoration:none" href="'+esc(url('competitions/match.html',{fixture:x.sm_fixture_id}))+'">Open Match Report</a>':'')+'</div>').join('')+'</article>'}).join('');NexusCards.wireImages($(kind))}

let matchdayData=null,matchdayKind='results',matchdaySeason=null;
const clean=v=>String(v??'').trim();
const groupName=r=>clean(r.competition_group_name)||(/^(?:group|gruppo|girone)\s+[A-Z0-9]+$/i.test(clean(r.competition_stage))?clean(r.competition_stage):'');
const feedIsIMC=(r,s)=>!!r[s+'_imc_manager_id']&&!!r[s+'_imc_manager_name'];
function matchdayEditorial(r,preview=false){
 const season=matchdaySeason,key=r.competition_key;
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

 const context=feedContext(r,round(r));
 if(!preview)return feedStory(r,context);
 const both=feedIsIMC(r,'home')&&feedIsIMC(r,'away'),side=feedIsIMC(r,'home')?'home':'away',manager=r[side+'_imc_manager_name'];
 const nation=r.competition_group==='NATIONS'||String(key).includes('|NATIONS|');
 return {title:both?'Confronto IMC: '+r.home_imc_manager_name+' contro '+r.away_imc_manager_name:manager+(side==='home'?' attende ':' fa visita a ')+r[side==='home'?'away_name':'home_name'],
 text:(nation?'Impegno con la nazionale':context.league?'Appuntamento di campionato':r.sm_action==='friendly'?'Amichevole in calendario':'Sfida di coppa')+' · '+(context.label||r.nexus_view)+(context.leg===1?'. Primo atto della doppia sfida.':context.leg===2?'. Ritorno: si decide il confronto.':'.')};
}
function matchdayTeam(r,side){
 return '<div class="team '+(side==='away'?'away':'')+'">'+logo(r[side+'_logo_url'])+'<div class="team-copy"><strong>'+esc(r[side+'_name'])+'</strong>'+(feedIsIMC(r,side)?'<small>'+esc(r[side+'_imc_manager_name'])+' <span class="matchday-imc">IMC</span></small>':'')+'</div></div>';
}
function matchdayGroups(rows,kind){
 const groups=new Map(),seen=new Set();
 for(const r of rows){
  if(!feedIsIMC(r,'home')&&!feedIsIMC(r,'away'))continue;
  const id=String(r.sm_fixture_id||[r.competition_key,r.match_date,r.home_name,r.away_name].join('|'));
  if(seen.has(id))continue;seen.add(id);
  const token=JSON.stringify([r.competition_key,r.matchday_turn]);
  if(!groups.has(token))groups.set(token,{row:r,rows:[],day:clean(r.match_date).slice(0,10)});
  const g=groups.get(token);g.rows.push(r);
  if(kind==='results'&&r.match_date>g.day)g.day=clean(r.match_date).slice(0,10);
 }
 return [...groups.values()].sort((a,b)=>(kind==='results'?b.day.localeCompare(a.day):a.day.localeCompare(b.day))||String(a.row.nexus_view).localeCompare(String(b.row.nexus_view)));
}
function matchdayMarkup(rows,kind){
 return matchdayGroups(rows,kind).map(g=>{
  const r=g.row,href=url('competitions/view.html',{season:matchdaySeason,competition:r.competition_key,tab:kind==='results'?'overview':'schedule'});
  const dates=[...new Set(g.rows.map(x=>clean(x.match_date).slice(0,10)))].sort();
  return '<section class="matchday-competition"><header><div><h3>'+esc(r.nexus_view||r.competition_key)+'</h3><p>'+esc([round(r),date(dates[0])+(dates.length>1?' – '+date(dates.at(-1)):'')].filter(Boolean).join(' · '))+'</p></div><a href="'+esc(href)+'">Vedi competizione →</a></header><div class="matchday-cards">'+g.rows.map(x=>{
   const story=matchdayEditorial(x,kind==='schedule');
   return '<article class="matchday-card">'+(groupName(x)?'<span class="matchday-context">'+esc(groupName(x))+'</span>':'')+'<h4>'+esc(story.title)+'</h4><div class="match">'+matchdayTeam(x,'home')+score(x,kind)+matchdayTeam(x,'away')+'</div><p class="matchday-comment">'+esc(story.text)+'</p>'+(kind==='results'&&x.has_match_report?'<a class="matchday-report" href="'+esc(url('competitions/match.html',{fixture:x.sm_fixture_id}))+'">Match Report →</a>':'')+'</article>';
  }).join('')+'</div></section>';
 }).join('');
}
function renderMatchday(){
 const panel=$('matchday-panel');if(!matchdayData)return;
 const kind=matchdayKind,rows=matchdayData[kind]||[];
 document.querySelectorAll('[data-matchday]').forEach(b=>{const active=b.dataset.matchday===kind;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
 panel.setAttribute('aria-labelledby','matchday-'+kind);
 if(matchdayData.errors?.[kind]){panel.innerHTML='<p class="empty">Dati temporaneamente non disponibili. Nuovo tentativo automatico.</p>';return}
 const current=rows.filter(r=>r.matchday_latest),archive=kind==='results'?rows.filter(r=>!r.matchday_latest):[];
 const opened=panel.querySelector('details')?.open;
 panel.innerHTML=(current.length?matchdayMarkup(current,kind):'<p class="empty">'+(kind==='results'?'Nessuna partita IMC nell’ultimo turno disponibile delle competizioni.':'Nessuna partita IMC nel prossimo turno disponibile delle competizioni.')+'</p>')+
 (archive.length?'<details class="matchday-archive"'+(opened?' open':'')+'><summary>Turni precedenti</summary>'+matchdayMarkup(archive,kind)+'</details>':'')+
 (kind==='results'&&matchdayData.errors?.reports?'<p class="updated">Disponibilità dei Match Report temporaneamente non verificabile.</p>':'');
 NexusCards.wireImages(panel);
}
document.querySelectorAll('[data-matchday]').forEach(b=>{
 b.onclick=()=>{matchdayKind=b.dataset.matchday;renderMatchday()};
 b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const target=e.key==='Home'?'results':e.key==='End'?'schedule':matchdayKind==='results'?'schedule':'results';document.querySelector('[data-matchday="'+target+'"]').click();document.querySelector('[data-matchday="'+target+'"]').focus()};
});

function renderTransfers(rows){if(!rows.length){message('transfers','Nessun trasferimento disponibile.');return}$('transfers').innerHTML=rows.map(r=>'<a class="transfer" href="'+esc(NexusCards.playerUrl(r.player_id,gw))+'">'+NexusCards.photo(r.player_images||[],r.player_name)+'<div class="transfer-data"><h3>'+esc(r.player_name||'Giocatore')+'</h3><div class="transfer-route"><div class="transfer-club">'+logo(r.from_logo_url)+'<span>'+esc(r.club_from||'—')+'</span></div><span aria-label="verso">→</span><div class="transfer-club">'+logo(r.to_logo_url)+'<span>'+esc(r.club_to||'—')+'</span></div></div><p>'+esc(r.normalized_transfer_date?date(r.normalized_transfer_date):'Data da normalizzare')+' · Stagione '+esc(r.imc_season||r.normalized_season||r.season||'—')+(r.amount_text?' · '+esc(r.amount_text):'')+'</p></div></a>').join('');NexusCards.wireImages($('transfers'))}
if(gw==='GW001'&&!section){const block=document.createElement('section');block.className='feed';block.style.marginBottom='24px';block.innerHTML='<div class="section-head"><h2>The Club</h2><a href="'+esc(url('the-club/'))+'">Apri →</a></div><div style="background:#101238;color:white;border-radius:16px;padding:22px"><p style="color:#e4be62;font-size:11px;font-weight:800;margin:0 0 10px">ROAD TO HISTORY · PRE MATCH · LIVE · POST MATCH</p><p style="font-size:14px;line-height:1.6">Il racconto della giornata: presentazione, Live e dopopartita con interviste e MVP.</p><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:15px"><a style="background:white;color:#101238;padding:12px 20px;border-radius:10px;font-weight:800" href="'+esc(url('the-club/',{tab:'preview'}))+'">Pre Match</a><a style="background:#d2a445;color:#101238;padding:12px 20px;border-radius:10px;font-weight:800" href="'+esc(url('the-club/',{tab:'live'}))+'">Live</a><a style="background:white;color:#101238;padding:12px 16px;border-radius:10px;font-weight:800" href="'+esc(url('the-club/',{tab:'club'}))+'">Post Match</a></div></div>';$('home-content').prepend(block);}
let refreshing=false;
async function refresh(){if(refreshing)return;refreshing=true;try{const c=await get(url('core/context.php'));$('title').textContent=c.world?.game_world_name||gw;document.title='Nexus · '+$('title').textContent;const season=c.current_season;$('season').textContent=season?'Stagione '+season+' · Stagione corrente':'Stagione non configurata';if(section)return;await Promise.allSettled([async function(){if(!season){message('matchday-panel','Stagione corrente non configurata.');return}try{const d=await get(url('home/data.php',{season,mode:'matchday'}));matchdaySeason=season;matchdayData=d;renderMatchday()}catch(e){message('results','Risultati temporaneamente non disponibili.');message('schedule','Calendario temporaneamente non disponibile.')}}(),async function(){try{const d=await get(url('transfers/index.php',{limit:3}));renderTransfers(d.rows||[])}catch(e){message('transfers','Trasferimenti temporaneamente non disponibili.')}}()]);$('updated').textContent='Aggiornamento automatico · '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'})}catch(e){$('season').textContent='Dati del mondo temporaneamente non disponibili';if(!section){message('matchday-panel','Impossibile caricare IMC Matchday. Riprova tra poco.');message('transfers','Impossibile caricare i dati. Riprova tra poco.')}}finally{refreshing=false}}
async function directory(){if(!section)return;$('home-content').hidden=true;$('directory').hidden=false;$('directory-title').textContent=section==='players'?'Player Codex':'Trophy Room';message('directory-list','Caricamento…');try{const d=await get(url(section==='players'?'players/world.php':'trophies/index.php'));const rows=d.rows||[];if(section==='trophies'&&window.NexusTrophies){await NexusTrophies.render(rows,gw);return;}$('directory-note').textContent=rows.length+(section==='players'?' giocatori caricati'+(rows.length===1000?' · primi 1.000 record disponibili':''):' trofei registrati');const render=()=>{const q=$('search').value.trim().toLocaleLowerCase('it');const filtered=rows.filter(r=>[r.full_name,r.current_club,r.winner_name,r.nexus_view,r.trophy_type,r.competition_key].filter(Boolean).join(' ').toLocaleLowerCase('it').includes(q));$('directory-list').innerHTML=filtered.length?filtered.map(r=>section==='players'?'<article class="directory-item"><h3>'+esc(r.full_name)+'</h3><p>'+esc(r.current_club||'Svincolato')+'</p><p>'+esc([r.position,r.age!=null?r.age+' anni':null,r.rating!=null?'Rating '+r.rating:null].filter(Boolean).join(' · '))+'</p></article>':'<article class="directory-item"><h3>'+esc(r.winner_name||'Vincitore non disponibile')+'</h3><p>'+esc(r.nexus_view||r.trophy_type||r.competition_key)+'</p><p>'+esc(date(r.won_date))+(r.imc_season?' · Stagione '+esc(r.imc_season):'')+'</p></article>').join(''):'<p class="empty">Nessun dato disponibile.</p>'};$('search').oninput=render;render()}catch(e){message('directory-list','Dati temporaneamente non disponibili.')}}
refresh();directory();if(!section){setInterval(()=>{if(!document.hidden)refresh()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()})}
})();





