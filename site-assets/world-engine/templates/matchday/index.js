(()=>{
'use strict';
const root=document.getElementById('matchday'),panel=document.getElementById('match-content'),status=document.getElementById('match-status'),tabs=[...root.querySelectorAll('[role=tab]')];
let mode='results',version=0,controller,loading=false;
const categoryNames={DOMESTIC:'Domestic',INTERNATIONAL:'International',IMC:'IMC',NATIONS:'Nations'};
const boxStyle=document.createElement('style');boxStyle.textContent=`
 #matchday .md-group{border:1px solid #dce0e6;border-top:3px solid var(--world-accent,#b69b5d);border-radius:12px;background:#fff;margin:0 0 18px;overflow:hidden;box-shadow:0 3px 12px #192b4308;color:#192b43}
 #matchday .md-group-heading{display:grid;gap:10px;padding:16px;border:0;border-bottom:1px solid #edf0f3;background:#edf4fa;color:#2d587c}
 #matchday .md-group[data-group=INTERNATIONAL] .md-group-heading{background:#f2edfa;color:#65478d}#matchday .md-group[data-group=IMC] .md-group-heading{background:#fbf4e3;color:#956b19}#matchday .md-group[data-group=NATIONS] .md-group-heading{background:#eaf5ee;color:#24644d}
 #matchday .md-category-label{font:650 10px/1.2 Inter,sans-serif}
 #matchday .md-group-heading h3{font:750 17px/1.3 Inter,sans-serif;margin:0}
 #matchday .md-group-heading>span{text-align:left;font:600 13px/1.4 Inter,sans-serif}
 #matchday .md-group-heading small{display:block;color:#5b697c;font:400 12px/1.4 Inter,sans-serif;margin-top:7px}
 #matchday .md-group-heading progress{display:block;width:100%;height:7px;margin-top:9px;accent-color:var(--world-accent,#b69b5d);border:0;border-radius:9px;overflow:hidden;background:#e7eaf0}
 #matchday .md-group-heading progress::-webkit-progress-bar{background:#e7eaf0}#matchday .md-group-heading progress::-webkit-progress-value{background:var(--world-accent,#b69b5d)}
 #matchday .md-games{padding:0 12px}#matchday .md-game{padding:14px 0}#matchday .md-game:last-child{border-bottom:0}
`;document.head.append(boxStyle);

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayLabel=v=>new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(v+'T12:00:00'));
const image=v=>/^(https:\/\/|\/(?!\/))/i.test(String(v||''))?'<img src="'+esc(v)+'" alt="" loading="lazy" width="30" height="30">':'';
function team(r,s){
 const national=r.competition_group==='NATIONS'||String(r.competition_key).includes('|NATIONS|'),id=r[s+'_sm_club_id']||r[s+'_sm_team_id'];
 const name='<span>'+esc(r[s+'_name']||'—')+'</span>',badge=image(r[s+'_logo_url'])+name;
 const link=id?'<a class="md-team-name" href="/__WORLD_SLUG__/'+(national?'nations':'clubs')+'/detail.html?id='+encodeURIComponent(id)+'">'+badge+'</a>':'<span class="md-team-name">'+badge+'</span>';
 const manager=r[s+'_imc_manager_id']?'<a class="md-manager" href="/__WORLD_SLUG__/managers/profile.html?manager='+encodeURIComponent(r[s+'_imc_manager_id'])+'">'+esc(r[s+'_imc_manager_name'])+'</a>':'';
 return '<div class="md-team '+s+'">'+link+manager+'</div>';
}
function competitionUrl(r){
 const cups='__WORLD_SLUG__'==='roadtohistory'?{'IMC001|IMC|championsleague':'rth-champions-league','IMC001|IMC|europaleague':'rth-europa-league','IMC001|IMC|conferenceleague':'rth-conference-league','IMC001|IMC|clubworldcup':'rth-club-world-cup'}:{};
 if(cups[r.competition_key])return '/__WORLD_SLUG__/'+cups[r.competition_key]+'/';
 return '/__WORLD_SLUG__/competitions/view.html?'+new URLSearchParams({world:'__WORLD_ID__',season:r.imc_season,competition:r.competition_key,group:r.competition_group||'DOMESTIC',tab:mode});
}
let dates=[],current='',defaultDate='',initial=true;
const prev=document.getElementById('md-prev'),next=document.getElementById('md-next');
function roundLabel(r){
 if(r.turn){const t=r.turn;return [...new Set([t.number_label,t.label].filter(v=>v&&!(v===t.label&&t.number_label?.startsWith(v+' di '))))].join(' · ');}
 if(r.round)return String(r.round);
 const n=r.sm_matchday||r.matchday;
 return n?'Giornata '+n:'';
}
function render(d){
 dates=[...d.dates].sort();current=d.date||'';defaultDate=d.dates[0]||'';
 const index=dates.indexOf(current);
 const tools=root.querySelector('.md-tools');
 tools.hidden=!current;
 const day=tools.querySelector('time');day.textContent=current?dayLabel(current):'';day.dateTime=current;
 prev.hidden=next.hidden=dates.length<2;prev.disabled=index<1;next.disabled=index>=dates.length-1;
 status.hidden=true;
 if(!d.rows.length){panel.innerHTML='<p class="md-empty">'+(mode==='results'?'Nessun risultato disponibile.':'Nessuna partita in programma.')+'</p>';return}
 const groups=new Map;
 for(const r of d.rows){const k=r.competition_key+'|'+r.imc_season+'|'+roundLabel(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
 panel.innerHTML=[...groups.values()].map(rows=>{
  const first=rows[0];
  return '<section class="md-group" data-group="'+esc(first.competition_group)+'"><div class="md-group-heading"><span class="md-category-label">'+esc(categoryNames[first.competition_group]||'')+'</span><h3><a href="'+esc(competitionUrl(first))+'">'+esc(first.competition_name)+'</a></h3><span>'+esc(roundLabel(first))+(first.turn_progress?.total_days?' <small>'+esc(first.turn_progress.played_days)+' di '+esc(first.turn_progress.total_days)+' turni giocati · '+esc(first.turn_progress.remaining_days)+' da giocare</small><progress aria-label="Turni giocati" max="'+esc(first.turn_progress.total_days)+'" value="'+esc(first.turn_progress.played_days)+'"></progress>':'')+'</span></div><div class="md-games">'+rows.map(r=>{
   const played=mode==='results';let score=played?esc(r.home_score)+' – '+esc(r.away_score):esc(String(r.match_time||'').slice(0,5)||'—');
   if(played)for(const [p,label] of [['penalty','Rigori'],['aggregate','Totale']])if(r[p+'_home_score']!=null&&r[p+'_away_score']!=null)score+='<small>'+label+' '+esc(r[p+'_home_score'])+' – '+esc(r[p+'_away_score'])+'</small>';
   const report=played&&r.has_report?'<a class="md-report" aria-label="Match report: '+esc(r.home_name)+' – '+esc(r.away_name)+'" href="/__WORLD_SLUG__/competitions/match.html?fixture='+encodeURIComponent(r.sm_fixture_id)+'"></a>':'';
   return '<article class="md-game">'+team(r,'home')+'<div class="md-score">'+score+'</div>'+team(r,'away')+report+'</article>';
  }).join('')+'</div></section>';
 }).join('');
 panel.querySelectorAll('img').forEach(i=>i.onerror=()=>{i.hidden=true});
}
async function load(selected='',background=false){
 const token=++version;if(controller)controller.abort();controller=new AbortController;loading=true;
 panel.setAttribute('aria-busy','true');if(!background){panel.innerHTML='<p class="md-empty">Caricamento partite…</p>';status.textContent='Caricamento…';status.hidden=false;root.querySelector('.md-tools').hidden=true}
 try{
  const q=new URLSearchParams({mode});if(selected)q.set('date',selected);
  const response=await fetch('/__WORLD_SLUG__/matchday/data.php?'+q,{cache:'no-store',signal:controller.signal});
  const d=await response.json();if(!response.ok||!d.ok)throw Error();
  if(token===version){if(initial&&!d.dates.length&&mode==='results'){initial=false;activate(tabs[1]);return}initial=false;render(d)}
 }catch(e){
  if(token!==version||e.name==='AbortError')return;
  status.textContent='Aggiornamento non riuscito.';
  if(!background)panel.innerHTML='<p class="md-empty">Impossibile caricare le partite. <button type="button" class="md-retry">Riprova</button></p>';
  const retry=panel.querySelector('.md-retry');if(retry)retry.onclick=()=>load(selected);
 }finally{if(token===version){loading=false;panel.setAttribute('aria-busy','false')}}
}
function activate(tab){
 mode=tab.id==='schedule-tab'?'schedule':'results';
 tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1});
 panel.setAttribute('aria-labelledby',tab.id);initial=false;load();
}
tabs.forEach((tab,i)=>{tab.onclick=()=>activate(tab);tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=tabs[e.key==='Home'?0:e.key==='End'?1:1-i];activate(next);next.focus()}}});
prev.onclick=()=>load(dates[dates.indexOf(current)-1]);next.onclick=()=>load(dates[dates.indexOf(current)+1]);


load();
})();
