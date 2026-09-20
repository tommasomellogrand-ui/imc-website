(function(root){'use strict';
const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=v=>/^\d{4}-\d{2}-\d{2}/.test(String(v||''))?String(v).slice(0,10):null;
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
const link=(world,params)=>'index.html?'+new URLSearchParams({world,...params});
function sort(events){return [...events].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.season||0)-Number(a.season||0)||a.id.localeCompare(b.id));}
function build(world,core,awards=[],now=today()){
 const out=new Map(),put=e=>{if(!e.date||e.date<=now)out.set(e.id,{world,...e});};
 const seasonAt=date=>(core.seasons||[]).find(s=>s.imc_season_start_date&&date>=s.imc_season_start_date&&(!s.imc_season_end_date||date<=s.imc_season_end_date))?.imc_season??null;
 // The raw assignments retain world team IDs; never resolve a team by name/global ID.
 for(const a of core.assignments||[]){
  const national=a.national_team_id!=null,tid=national?a.national_team_id:a.team_id;
  const matches=((national?core.nations:core.clubs)||[]).filter(t=>same(t.sm_team_id,tid));
  const team=matches.length===1?matches[0]:null;
  const person=(core.managers||[]).find(m=>same(m.manager_id,a.manager_id));
  if(!team||!person)continue;
  for(const [type,date] of [['appointment',day(a.start_date)],['departure',day(a.end_date)]]){
   if(!date)continue;
   put({id:[world,type,a.manager_id,national?'nation':'club',tid,a.start_date,date].join('|'),type,date,season:seasonAt(date),
    title:type==='appointment'?`${person.full_name} alla guida di ${team.name}`:`Si conclude l’incarico di ${person.full_name} con ${team.name}`,
    teams:[team],people:[{id:a.manager_id,name:person.full_name,role:type==='appointment'?'Nuovo incarico':'Fine incarico'}],
    detail:national?'Nazionale':'Club',href:link(world,{resource:'manager',manager:a.manager_id,teamType:national?'nations':'clubs',profileTab:'career'}),linkLabel:'Vedi incarico'});
  }
 }
 for(const a of awards){
  if(!a.winner)continue;
  const match=a.match,final=['cup','playoff'].includes(a.kind)&&match&&a.runner_up;
  const people=[];
  if(a.manager)people.push({id:a.manager.manager_id,name:a.manager.full_name,role:'Vincitore'});
  if(final){const side=a.side==='home'?'away':a.side==='away'?'home':null;if(side){const m=match[side+'_manager_core'];const name=m?.full_name||match[side+'_manager_name'];if(name)people.push({id:m?.manager_id,name,role:'Finalista'});}}
  const competition=a.competition?.nexus_view||'Competizione non configurata';
  let detail='';
  if(final){detail=`${match.home_name} ${match.home_score} – ${match.away_score} ${match.away_name}`;
   if(match.penalty_home_score!=null&&match.penalty_away_score!=null)detail+=` · Rigori ${match.penalty_home_score}–${match.penalty_away_score}`;
   if(match.aggregate_home_score!=null&&match.aggregate_away_score!=null)detail+=` · Aggregato ${match.aggregate_home_score}–${match.aggregate_away_score}`;
   detail+=` · Finalista: ${a.runner_up.name}`;
  }
  put({id:world+'|award|'+a.id,type:final?'final':'trophy',date:day(a.awarded_at),season:a.season,
   title:`${a.winner.name} conquista ${competition}`,detail,people,
   teams:[a.winner.core,...(final?[a.runner_up.core]:[])].filter(Boolean),
   href:link(world,{resource:'archive',competition:a.competition?.competition_key||'',hall:'history',season:a.season||''}),linkLabel:'Trophy Room',
   matchHref:final&&match.sm_fixture_id?'match.html?'+new URLSearchParams({world,fixture:match.sm_fixture_id}):null});
 }
 return sort([...out.values()]);
}
const labels={appointment:'Nuovo incarico',departure:'Fine incarico',trophy:'Trofeo vinto',final:'Finale · vincitore e finalista'};
function image(team){const src=String(team.image_url||'');if(!/^(?:https:\/\/|\/(?!\/))/.test(src))return '';return `<img src="${esc(src)}" alt="${esc(team.name||'')}" loading="lazy" width="42" height="42">`;}
function render(e,manager=null){
 const mine=e.people.find(p=>same(p.id,manager));
 const date=e.date?`<time datetime="${esc(e.date)}">${esc(e.date.split('-').reverse().join('/'))}</time>`:'<span>Data non disponibile</span>';
 return `<article class="nexus-news-card"><div class="nexus-news-meta"><span>${esc(e.world)}${e.season?' · Stagione '+esc(e.season):''}</span>${date}</div><div class="nexus-news-kind">${esc(mine?.role||labels[e.type])}</div><div class="nexus-news-title">${e.teams.length?`<div class="nexus-news-crests">${e.teams.map(image).join('')}</div>`:''}<h3>${esc(e.title)}</h3></div>${e.people.length?`<p class="nexus-news-people">${e.people.map(p=>`${esc(p.role)}: ${p.id?`<a href="${esc(link(e.world,{resource:'manager',manager:p.id}))}">${esc(p.name)}</a>`:esc(p.name||'Manager non disponibile')}`).join(' · ')}</p>`:''}${e.detail?`<p>${esc(e.detail)}</p>`:''}<div class="nexus-news-links"><a href="${esc(e.href)}">${esc(e.linkLabel)} →</a>${e.matchHref?`<a href="${esc(e.matchHref)}">Match report ↗</a>`:''}</div></article>`;
}
const api={build,sort,render,labels};if(typeof module==='object'&&module.exports)module.exports=api;else root.NexusNews=api;
})(typeof window==='object'?window:globalThis);
