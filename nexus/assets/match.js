(()=>{'use strict';
const q=new URLSearchParams(location.search),world=q.get('world')||'',fixture=q.get('fixture')||'',esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),$=id=>document.getElementById(id),safe=v=>/^(https:\/\/|\/(?!\/))/i.test(String(v||''))?v:'',date=v=>/^\d{4}-\d{2}-\d{2}/.test(String(v||''))?String(v).slice(0,10).split('-').reverse().join('/'):'Data non disponibile';
let data=null,busy=false,active=['overview','home','away'].includes(q.get('tab'))?q.get('tab'):'overview';
const link=(path,extra={})=>path+'?'+new URLSearchParams({world,...extra}),player=p=>Number(p.sm_player_id)>0?'<a href="'+esc(link('../players/profile.html',{player:p.sm_player_id}))+'">'+esc(p.player_name||'Giocatore '+p.sm_player_id)+'</a>':esc(p.player_name||'Giocatore non identificato');
const val=v=>v===null||v===undefined||v===''?'—':esc(v),card=(title,body)=>'<section class="mx-card"><h2>'+esc(title)+'</h2>'+body+'</section>',empty=s=>'<p class="mx-muted">'+esc(s)+'</p>';
$('home-link').href=link('../');$('match-world').textContent=world;document.querySelectorAll('[data-path]').forEach(a=>a.href=link(a.dataset.path));
function header(){const m=data.match;document.title='Nexus · '+m.home_name+' – '+m.away_name;$('match-meta').textContent=[m.competition_name,'Stagione '+m.imc_season,m.competition_stage,m.competition_group_name,m.competition_round?'Turno '+m.competition_round:null,date(m.match_date)].filter(Boolean).join(' · ');$('match-back').href=link('view.html',{season:m.imc_season,competition:m.competition_key,name:m.competition_name,tab:'results'});
 const team=side=>'<div class="mx-team">'+(safe(m[side+'_logo_url'])?'<img src="'+esc(m[side+'_logo_url'])+'" alt="Logo '+esc(m[side+'_name'])+'">':'')+'<h2>'+esc(m[side+'_name'])+'</h2>'+(m[side+'_imc_manager_name']||m[side+'_manager_name']?'<small>'+esc(m[side+'_imc_manager_name']||m[side+'_manager_name'])+'</small>':'')+'</div>';
 let score='<b>'+val(m.home_score)+' – '+val(m.away_score)+'</b><small>FINALE</small>';for(const [key,label]of [['penalty','Rigori'],['aggregate','Totale A/R']])if(m[key+'_home_score']!=null&&m[key+'_away_score']!=null)score+='<small>'+label+' '+val(m[key+'_home_score'])+' – '+val(m[key+'_away_score'])+'</small>';
 $('match-header').innerHTML=team('home')+'<div class="mx-score">'+score+'</div>'+team('away');$('match-scorers').innerHTML=headerScorers();$('match-header').querySelectorAll('img').forEach(i=>i.onerror=()=>{i.hidden=true});
}

function portrait(p,large=false){
 const images=[...new Set((p.image_urls||[]).map(safe).filter(Boolean))];
 const initials=String(p.player_name||'?').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('');
 return '<span class="mj-portrait'+(large?' mj-portrait-large':'')+'"><span aria-hidden="true">'+esc(initials)+'</span>'+(images.length?'<img src="'+esc(images[0])+'" data-player-images="'+esc(JSON.stringify(images.slice(1)))+'" alt="Foto '+esc(p.player_name||'giocatore')+'" loading="lazy" decoding="async">':'')+'</span>';
}
function wirePortraits(){
 $('match-view').querySelectorAll('img[data-player-images]').forEach(img=>{
  img.onerror=()=>{const rest=JSON.parse(img.dataset.playerImages||'[]');if(rest.length){img.dataset.playerImages=JSON.stringify(rest.slice(1));img.src=rest[0]}else img.remove()};
  if(img.complete&&!img.naturalWidth)img.onerror();
 });
}
const eventIcon=(symbol,count,label,cls='')=>'<span class="mj-event-icon '+cls+'" title="'+esc(label)+'" aria-label="'+esc(label)+'"><span aria-hidden="true">'+symbol+'</span>'+(Number(count)>1?'<b>'+esc(count)+'</b>':'')+'</span>';
function events(p){return [
 Number(p.captain)>0?eventIcon('Ⓒ',1,'Capitano'):'',
 Number(p.goals)>0?eventIcon('⚽',p.goals,p.goals+' gol'):'',
 Number(p.assists)>0?eventIcon('↗⚽',p.assists,p.assists+' assist','mj-assist-icon'):'',
 Number(p.yellow_card)>0?eventIcon('<i class="mj-card-icon yellow"></i>',p.yellow_card,p.yellow_card+' ammonizioni'):'',
 Number(p.red_card)>0?eventIcon('<i class="mj-card-icon red"></i>',p.red_card,p.red_card+' espulsioni'):'',
 Number(p.man_of_match)>0?eventIcon('★',1,'MVP del match','mj-mvp-icon'):''
 ].join('');}
function rating(p){return '<span class="mj-rating">'+val(p.rating)+'</span>'}
const statLabels=[['possession','Possesso palla','%'],['total_shots','Tiri totali',''],['shots_on_target','Tiri in porta',''],['corners','Calci d’angolo',''],['yellow_cards','Ammonizioni',''],['red_cards','Espulsioni','']];
function statRows(labels=statLabels){
 const t=data.team_stats||{},number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 return labels.map(([key,label,suffix])=>{
  const home=number(t.home?.[key]),away=number(t.away?.[key]),total=home!==null&&away!==null?home+away:0;
  const h=total?home/total*100:0,a=total?away/total*100:0;
  return '<div class="mj-stat-block"><div class="mx-stat"><b>'+(home===null?'—':esc(home)+suffix)+'</b><span>'+esc(label)+'</span><b>'+(away===null?'—':esc(away)+suffix)+'</b></div><div class="mj-stat-track" aria-hidden="true"><i style="width:'+h+'%"></i><i style="width:'+a+'%"></i></div></div>';
 }).join('');
}
function scorerIdentity(s){
 const id=Number(s.sm_player_id),eligible=data.players.filter(p=>Number(s.own_goal)?p.team_side!==s.team_side:p.team_side===s.team_side);
 const candidates=id>0?eligible.filter(p=>Number(p.sm_player_id)===id):eligible.filter(p=>String(p.player_name).trim().toLowerCase()===String(s.player_name).trim().toLowerCase());
 return candidates.length===1?{...candidates[0],...s,image_urls:candidates[0].image_urls}:s;
}
function matchScorers(){
 let scorers=Array.isArray(data.team_stats?.scorers)?[...data.team_stats?.scorers]:[];
 if(!scorers.length)for(const p of data.players){
  for(const minute of Array.isArray(p.goal_minutes)?p.goal_minutes:[])scorers.push({...p,minute,own_goal:0});
  for(const minute of Array.isArray(p.own_goal_minutes)?p.own_goal_minutes:[])scorers.push({...p,minute,own_goal:1,team_side:p.team_side==='home'?'away':'home'});
  if(Number(p.goals)>0&&!(p.goal_minutes||[]).length)scorers.push({...p,minute:null,own_goal:0,count:p.goals});
 }
 return scorers;
}
function headerScorers(){
 if(!data.report_available)return '';
 const scorers=matchScorers();
 if(!scorers.length)return '';
 return '<div class="mj-header-goals" aria-label="Marcatori">'+['home','away'].map(side=>'<div>'+scorers.filter(s=>s.team_side===side).map(s=>{const p=scorerIdentity(s);return '<span class="mj-header-scorer">'+player(p)+' <b>'+(p.minute!=null?esc(p.minute)+'′':p.count?esc(p.count)+' gol':'')+'</b>'+(Number(p.own_goal)?' (aut.)':'')+'</span>'}).join('')+'</div>').join('')+'</div>';
}
function overview(){
 const m=data.match;
 const venue='<div class="mx-venue"><span><small>STADIO</small><strong>'+val(m.stadium_name)+'</strong></span><span><small>SPETTATORI</small><strong>'+(m.attendance!=null?Number(m.attendance).toLocaleString('it-IT'):'—')+'</strong></span></div>';
 if(!data.report_available)return venue+card('Match Report',empty('Match Report non ancora disponibile. La pagina si aggiornerà automaticamente dopo il caricamento.'));
 const mvp=data.players.filter(p=>Number(p.man_of_match)>0);
 const award='<section class="mx-mvp" aria-label="MVP">'+(mvp.length?mvp.map(p=>'<div class="mj-mvp-card">'+portrait(p,true)+'<div class="mj-mvp-copy"><span class="mj-award-label">★ MVP DEL MATCH</span><h2>'+player(p)+'</h2><p>'+esc(m[p.team_side+'_name'])+'</p>'+rating(p)+'<div class="mj-mvp-numbers"><span><b>'+val(p.goals)+'</b>Gol</span><span><b>'+val(p.assists)+'</b>Assist</span><span><b>'+val(p.minutes)+'</b>Minuti</span></div></div></div>').join(''):empty('MVP non indicato nel report.'))+'</section>';
 return '<div class="mj-overview">'+award+venue+card('La partita in numeri',statRows())+'</div>';
}
const played=p=>Number(p.starter)>0||p.sub_on_minute!=null||Number(p.rating)>0||Number(p.goals)>0||Number(p.assists)>0||Number(p.man_of_match)>0;
function lineup(side){
 const m=data.match;
 if(!data.report_available)return card(m[side+'_name'],empty('Match Report non ancora disponibile.'));
 const rows=data.players.filter(p=>p.team_side===side).sort((a,b)=>Number(a.squad_slot)-Number(b.squad_slot));
 if(!rows.length)return card(m[side+'_name'],empty('Formazione non disponibile nel report.'));
 const list=entries=>'<div class="mj-roster">'+entries.map(p=>{
  const notes=[p.sub_on_minute!=null?'↗ '+p.sub_on_minute+'′':null,p.sub_off_minute!=null?'↘ '+p.sub_off_minute+'′':null,p.red_card_minute!=null?'🟥 '+p.red_card_minute+'′':null].filter(Boolean);
  return '<div class="mj-player-row">'+portrait(p)+'<div class="mj-player-copy"><b>'+player(p)+'</b><div class="mj-events">'+events(p)+'</div>'+(notes.length?'<small class="mj-sub-note">'+notes.map(esc).join(' · ')+'</small>':'')+'</div><div class="mj-player-minutes"><b>'+val(p.minutes)+(p.minutes!=null?'′':'')+'</b><small>MIN</small></div><div class="mj-player-rating">'+rating(p)+'<small>VOTO</small></div></div>';
 }).join('')+'</div>';
 const heading='<header class="mj-lineup-head">'+(safe(m[side+'_logo_url'])?'<img src="'+esc(m[side+'_logo_url'])+'" alt="">':'')+'<div><h2>'+esc(m[side+'_name'])+'</h2><p>'+esc(m[side+'_imc_manager_name']||m[side+'_manager_name']||'')+'</p></div></header>';
 return heading+[['Titolari',p=>Number(p.starter)>0],['Subentrati',p=>!Number(p.starter)&&played(p)],['Panchina',p=>!played(p)]].map(([title,filter])=>{const entries=rows.filter(filter);return entries.length?card(title+' · '+entries.length,list(entries)):''}).join('')+'<p class="mx-muted mj-legend">Ⓒ Capitano · ↗⚽ Assist · ★ MVP · ↗ Entrata · ↘ Uscita<br>— Dato non disponibile. Minuti ricavati dal Match Report.</p>';
}
function render(){document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===active;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});if(data){$('match-view').innerHTML=active==='overview'?overview():lineup(active);wirePortraits();}}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{active=b.dataset.tab;q.set('tab',active);history.replaceState(null,'','?'+q);render()});
async function refresh(){if(busy||document.hidden)return;busy=true;try{const r=await fetch(link('match.php',{fixture}),{cache:'no-store'}),j=await r.json();if(!r.ok||!j.ok)throw Error(j.error==='match_not_found'?'Risultato non trovato in questo mondo di gioco.':'Impossibile caricare la partita. Riprova tra poco.');const changed=JSON.stringify([j.match,j.players,j.team_stats,j.report_available])!==JSON.stringify(data&&[data.match,data.players,data.team_stats,data.report_available]);data=j;if(changed){header();render()}$('match-status').innerHTML='<span class="mx-report-state '+(j.report_available?'ready':'pending')+'">'+(j.report_available?'● Report disponibile':'◷ Report in attesa')+'</span><details class="mx-refresh-info"><summary aria-label="Informazioni aggiornamento">ⓘ</summary><p>Aggiornamento automatico ogni 60 secondi · Ultimo controllo '+esc(new Date(j.generated_at).toLocaleTimeString('it-IT'))+'</p></details>';}catch(e){$('match-status').textContent=e.message+(data?' Dati precedenti ancora visibili.':'');}finally{busy=false}}
render();refresh();setInterval(refresh,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();

