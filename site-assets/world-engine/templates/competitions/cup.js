(()=>{'use strict';
const $=id=>document.getElementById(id),key=document.body.dataset.competition,params=new URLSearchParams(location.search),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const settings=window.leaguePage;
const world=settings?.world||'GW001',base=settings?.base||'/roadtohistory/';
const league=settings?settings.isLeague:!key.endsWith('|clubworldcup');
let season='',tab=params.get('tab')||'overview',mode='results',metric='goals',statsMode='teams',data,epoch=0;
const safe=v=>/^(https:\/\/|\/(?!\/))/.test(v||'')?v:'',date=v=>v?new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}):'Data da definire';
const badge=(name,logo)=>'<span class="club">'+(safe(logo)?'<img src="'+esc(logo)+'" alt="" loading="lazy">':'')+'<span>'+esc(name)+'</span></span>';
const empty=text=>'<p class="cup-empty">'+esc(text)+'</p>';
async function api(file,extra={}){const r=await fetch(base+'competitions/'+file+'?'+new URLSearchParams({world,season,competition:key,...extra}),{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw Error(file);return j}
const identity=r=>[String(r.match_date).slice(0,10),r.home_sm_club_id||r.home_sm_team_id||r.home_name,r.away_sm_club_id||r.away_sm_team_id||r.away_name].join('|');
const roundKey=r=>!league?JSON.stringify([r.competition_stage||'',r.competition_round||r.match_date]):r.competition_round?'round:'+r.competition_round:'date:'+String(r.match_date).slice(0,10);
const roundLabel=r=>(r.competition_stage?String(r.competition_stage)+' · ':'')+(r.competition_round?(/^\d+$/.test(r.competition_round)?(league?'Giornata ':'Turno '):'')+r.competition_round:date(r.match_date));
function match(r,played){
 const team=side=>{
  const name=r[side+'_name']||'',logo=safe(r[side+'_logo_url']),manager=r[side+'_imc_manager_name'];
  return '<div class="fixture-side '+side+'"><span class="fixture-crest">'+(logo?'<img alt="" loading="lazy" src="'+esc(logo)+'">':'')+'</span><span class="fixture-names"><strong>'+esc(name)+'</strong>'+(manager?'<small>'+esc(manager)+'</small>':'')+'</span></div>';
 };
 const middle=played?'<button class="fixture-center" data-match="'+data.results.indexOf(r)+'" aria-label="'+esc(r.home_name+' '+r.home_score+' – '+r.away_score+' '+r.away_name)+'">'+esc(r.home_score)+' – '+esc(r.away_score)+'</button>':'<span class="fixture-center">'+esc(r.match_time?.slice(0,5)||'VS')+'</span>';
 return '<article class="fixture-line">'+team('home')+middle+team('away')+'</article>';
}
function matches(rows,played){
 if(!rows.length)return empty(played?'Nessun risultato disponibile.':'Nessuna partita in calendario.');
 const dates=[...new Set(rows.map(r=>date(r.match_date)))];
 return '<div class="result-round"><header class="result-round-head" style="'+phaseBox+'"><h3 style="margin:0;text-align:center">'+esc(phaseTitle(rows[0]))+'</h3><span>'+esc(dates.join(' · '))+'</span></header><div>'+rows.map(r=>match(r,played)).join('')+'</div></div>';
}
const pureKO=/(?:^|[|_])(?:nationalcup|leaguecup|leagueshield|charityshield|supercup|smfasupercup|playoff|clubworldcup)(?:[|_]|$)/i.test(key);
function groupOf(r){
 if(pureKO||/final|quarti|ottavi|round of|knockout|eliminaz|play.?off/i.test([r.competition_stage,r.competition_round].join(' ')))return '';
 for(const [i,v] of [r.competition_group_name,r.competition_stage,r.competition_round].entries()){
  const m=String(v||'').trim().match(/^(?:(?:girone|gruppo|group|pool)\s*)?([a-z]|\d+)$/i);
  if(m&&(i===0||/^(?:girone|gruppo|group|pool)/i.test(String(v))))return 'Girone '+m[1].toUpperCase();
 }
 return String(r.competition_group_name||'').trim();
}
const phaseBox='display:grid;justify-items:center;text-align:center;gap:3px;padding:9px 12px;border:1px solid #d8d3c5;border-radius:4px;background:#f7f6f2;color:#201f1c';
function phaseTitle(r){
 const group=groupOf(r),stage=String(r.competition_stage||'').trim(),round=String(r.competition_round||'').trim();
 const parts=[group,stage,round].filter(Boolean).filter(v=>!(group&&/^(?:group|girone|gruppo|pool)\s*(?:stage|phase|[a-z]|\d+)$/i.test(v)&&v!==group));
 const label=[...new Set(parts)].map(v=>/^\d+$/.test(v)?(league||group?'Giornata ':'Turno ')+v:v).join(' · ');
 return (label||'Partite').replace(/finalee\b/gi,'finale');
}
function groupedMatches(rows,played){
 const blocks=new Map();
 for(const r of rows){
  const day=String(r.match_date||'').slice(0,10),group=groupOf(r),id=JSON.stringify([played?day:'',group,roundKey(r)]);
  if(!blocks.has(id))blocks.set(id,{day,group,rows:[]});blocks.get(id).rows.push(r);
 }
 const byGroup=(a,b)=>a&&b?a.localeCompare(b,'it',{numeric:true}):Number(!a)-Number(!b);
 return [...blocks.values()].sort((a,b)=>played?(b.day.localeCompare(a.day)||byGroup(a.group,b.group)):(byGroup(a.group,b.group)||a.day.localeCompare(b.day))).map(block=>'<section>'+matches(block.rows,played)+'</section>').join('');
}
function table(compact=false){if(data.tableError)return empty('Classifica temporaneamente non disponibile.');if(!data.groups.length)return empty('Classifica non ancora disponibile.');return data.groups.filter(g=>league||g.group_name).slice().sort((a,b)=>String(a.group_name||'').localeCompare(String(b.group_name||''),'it',{numeric:true})).map(g=>'<section class="cup-card">'+(g.group_name?'<h3 style="'+phaseBox+'">'+esc(g.group_name)+'</h3>':'')+'<div class="table-scroll"><table class="cup-standings"><caption class="sr-only">Classifica '+esc(document.title)+'</caption><thead><tr><th>#</th><th>Club</th><th>PG</th>'+(!compact?'<th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th>':'')+'<th>DR</th><th>Pt</th></tr></thead><tbody>'+g.rows.map(t=>{const logo=data.teams.get(String(t.team_id))?.logo;return '<tr><td>'+t.position+'</td><th scope="row">'+badge(t.team_name,logo)+'</th><td>'+t.played+'</td>'+(!compact?[t.won,t.drawn,t.lost,t.gf,t.ga].map(v=>'<td>'+v+'</td>').join(''):'')+'<td>'+t.gd+'</td><td class="points">'+t.points+'</td></tr>'}).join('')+'</tbody></table></div></section>').join('')+'<p class="cup-note">Classifica calcolata dai risultati disponibili: 3 punti per vittoria, 1 per pareggio. Ordinamento: punti, differenza reti, gol fatti. Zone di qualificazione non ancora configurate.</p>'}
async function extra(kind){
 const current=data;if(!current)return;
 if(!current.extra[kind])current.extra[kind]=(async()=>{
  try{const result=await api(kind==='table'?'standings.php':'match-report.php',kind==='table'?{}:{mode:kind==='stats'?'stats':'feed'});if(current!==data)return;
   if(kind==='table')current.groups=result.groups||[];
   if(kind==='stats')current.stats=result;
   if(kind==='reports')current.reports=result.rows||[];
  }catch{if(current===data)current[kind==='table'?'tableError':kind==='stats'?'statsError':'reportError']=true;}
 })();
 await current.extra[kind];
}
async function render(){if(!data)return;
 const current=data,requestedTab=tab;
 if(tab==='table'||tab==='stats')await extra(tab);
 if(data!==current||tab!==requestedTab)return;
 const hasTable=!pureKO&&(league||data.groups.some(g=>g.group_name)||[...data.results,...data.calendar].some(r=>groupOf(r)));
 const tableTab=document.querySelector('[data-main-tab="table"]');if(tableTab){tableTab.hidden=!hasTable;tableTab.style.display=hasTable?'':'none'}
 if(!hasTable&&tab==='table')tab='matches';document.querySelectorAll('[data-main-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mainTab===tab)));const p=new URLSearchParams(settings?location.search:'');p.set('season',season);p.set('tab',tab);history.replaceState(null,'','?'+p);const results=data.results,schedule=data.schedule;let html='';
 if(tab==='overview'){
 const latest=results[0];
 html='<h2>Last Round</h2>'+(groupedMatches(latest?results.filter(r=>roundKey(r)===roundKey(latest)):[],true)||empty('Nessun risultato disponibile.'));
 }else if(tab==='matches'){
 html='<h2>Schedule</h2>'+(groupedMatches(schedule,false)||empty('Nessuna partita in calendario.'));
 }else if(tab==='table'){html='<h2>Classifica</h2>'+table();
 }else{
 html='<div class="cup-pills">'+['teams','players'].map(v=>'<button data-stats="'+v+'" aria-pressed="'+(v===statsMode)+'">'+(v==='teams'?'Squadre':'Giocatori')+'</button>').join('')+'</div>';
 if(statsMode==='teams'){const teams=new Map();results.forEach(r=>['home','away'].forEach(side=>{const name=r[side+'_name'],id=String(r[side+'_sm_club_id']||name),opp=side==='home'?'away':'home';if(!teams.has(id))teams.set(id,{name,logo:r[side+'_logo_url'],pg:0,gf:0,ga:0,w:0});const t=teams.get(id);t.pg++;t.gf+=Number(r[side+'_score']);t.ga+=Number(r[opp+'_score']);if(Number(r[side+'_score'])>Number(r[opp+'_score']))t.w++}));html+='<h2>Rendimento delle squadre</h2>'+([...teams.values()].length?'<div class="team-stats">'+[...teams.values()].sort((a,b)=>b.gf-a.gf||a.name.localeCompare(b.name)).map(t=>'<article class="cup-card">'+badge(t.name,t.logo)+'<div class="mini-stats"><span><b>'+t.pg+'</b>PG</span><span><b>'+t.w+'</b>Vittorie</span><span><b>'+t.gf+'</b>Gol fatti</span><span><b>'+t.ga+'</b>Gol subiti</span></div></article>').join('')+'</div>':empty('Statistiche disponibili dopo le prime partite.'));}
 else if(data.statsError)html+=empty('Statistiche giocatori temporaneamente non disponibili.');
 else if(!data.stats.reports)html+=empty('Nessun Match Report disponibile per questa competizione e stagione.');
 else{const metrics={goals:'Gol',assists:'Assist',yellow_card:'Ammonizioni',red_card:'Espulsioni',man_of_match:'MVP'},rows=(data.stats.rows||[]).filter(r=>Number(r[metric])>0).sort((a,b)=>Number(b[metric])-Number(a[metric]));html+='<p class="cup-note">Statistiche ricavate da '+data.stats.reports+' Match Report disponibili; la copertura può essere parziale.</p><label>Statistica <select id="metric">'+Object.entries(metrics).map(([k,v])=>'<option value="'+k+'"'+(k===metric?' selected':'')+'>'+v+'</option>').join('')+'</select></label>'+(rows.length?'<div class="cup-card table-scroll"><table><thead><tr><th>#</th><th>Giocatore</th><th>PG</th><th>'+metrics[metric]+'</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><th><a href="'+base+'players/profile.html?world='+encodeURIComponent(world)+'&player='+encodeURIComponent(r.sm_player_id)+'">'+esc(r.player_name)+'</a></th><td>'+r.played+'</td><td class="points">'+r[metric]+'</td></tr>').join('')+'</tbody></table></div>':empty('Nessun dato disponibile per questa statistica.'));}
 }
 $('cup-view').innerHTML=html;wire();
}
function wire(){document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{tab=b.dataset.open;render()});document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});document.querySelectorAll('[data-stats]').forEach(b=>b.onclick=()=>{statsMode=b.dataset.stats;render()});if($('metric'))$('metric').onchange=e=>{metric=e.target.value;render()};document.querySelectorAll('[data-match]').forEach(b=>b.onclick=async()=>{const current=data;await extra('reports');if(data!==current)return;const r=data.results[Number(b.dataset.match)];if(!r)return;const report=r.sm_fixture_id!=null&&data.reports.find(x=>x.sm_fixture_id!=null&&String(x.sm_fixture_id)===String(r.sm_fixture_id));$('match-body').innerHTML='<h2>'+esc(r.home_name)+' – '+esc(r.away_name)+'</h2><p>'+esc(roundLabel(r))+'</p><p class="detail-score">'+r.home_score+' – '+r.away_score+'</p><p>'+date(r.match_date)+'</p>'+(report?'<a class="report-link" href="'+base+'competitions/match.html?world='+encodeURIComponent(world)+'&fixture='+encodeURIComponent(r.sm_fixture_id)+'">Apri Match Report →</a>':empty(data.reportError?'Verifica Match Report temporaneamente non disponibile.':'Match Report non disponibile.'));$('match-dialog').showModal()});document.querySelectorAll('#cup-view img').forEach(img=>img.onerror=()=>img.hidden=true)}
async function load(){const request=++epoch;data=null;$('cup-view').innerHTML=empty('Caricamento della competizione…');$('cup-view').setAttribute('aria-busy','true');try{
 const [r,s]=await Promise.allSettled([api('results.php'),api('schedule.php')]);if(request!==epoch)return;if(r.status!=='fulfilled'||s.status!=='fulfilled')throw Error('matches');
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(new Date());
 const model=CupModel.build(r.value.rows,s.value.rows,today,league),{results,schedule}=model;
 data={...model,groups:[],tableError:false,stats:{},statsError:false,reports:[],reportError:false,extra:{}};
 $('cup-phase').textContent=results.length?(results[0].competition_stage||'Competizione in corso')+(results[0].competition_round?(league?' · Giornata ':' · Turno ')+results[0].competition_round:''):schedule.length?'In programma':key.endsWith('|clubworldcup')?'Non ancora iniziata':'Nessuna partita disponibile';render();$('cup-updated').textContent='Aggiornato alle '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'});
 }catch(e){if(request===epoch)$('cup-view').innerHTML=empty('Dati temporaneamente non disponibili. Riprova con Aggiorna.')}finally{if(request===epoch)$('cup-view').setAttribute('aria-busy','false')}}
 document.querySelectorAll('[data-main-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.mainTab;render()});$('refresh-cup').onclick=load;$('close-match').onclick=()=>$('match-dialog').close();
 (async()=>{try{let c=settings?.context;
 if(!c){const r=await fetch('/roadtohistory/imc-cups/context.php?world=GW001',{cache:'no-store'});c=await r.json();if(!r.ok||!c.ok)throw Error();}const seasons=c.seasons||[];season=seasons.some(s=>String(s.imc_season)===params.get('season'))?params.get('season'):String(c.current_season||'');$('cup-season').innerHTML=seasons.map(s=>'<option value="'+s.imc_season+'">Stagione '+s.imc_season+'</option>').join('');$('cup-season').value=season;$('cup-season').onchange=e=>{season=e.target.value;load()};if(tab==='standings')tab='table';if(tab==='results')tab='overview';if(tab==='schedule')tab='matches';if(!['overview','matches','table','stats'].includes(tab))tab='overview';await load()}catch(e){$('cup-view').innerHTML=empty('Impossibile caricare la stagione. Ricarica la pagina.')}})();
})();
