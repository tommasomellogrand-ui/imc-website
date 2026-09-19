(function(root){'use strict';
const text=v=>String(v??'').trim(), token=v=>text(v).toLowerCase();
const score=v=>v!==null&&v!==undefined&&text(v)!==''&&/^\d+$/.test(text(v))?Number(v):null;
const completed=r=>(!r.result_status||token(r.result_status)==='completed')&&score(r.home_score)!==null&&score(r.away_score)!==null;
function unique(rows){const map=new Map();for(const r of rows){const key=text(r.sm_fixture_id)||[r.match_date,r.home_name,r.away_name].join('|');map.set(key,r)}return [...map.values()]}
const knockout=r=>/^(?:finale?|semi.?finale?|quarti|quarter|ottavi|round of|playoff)/i.test(text(r.competition_stage)||text(r.competition_round));
const group=r=>knockout(r)?'':text(r.competition_group_name)||(/^(group|girone)\s+\w+/i.test(text(r.competition_stage))?text(r.competition_stage):'');
function standings(rows){const map=new Map();function team(r,s){const name=r[s+'_name'];if(!name)return null;const id=text(r[s+'_sm_team_id']??r[s+'_sm_club_id'])||'name:'+name;let row=map.get(id);if(!row){row={id,name,core:r[s+'_core'],p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0};map.set(id,row)}return row}for(const r of unique(rows)){if(!completed(r))continue;const h=team(r,'home'),a=team(r,'away');if(!h||!a)continue;const hs=score(r.home_score),as=score(r.away_score);h.p++;a.p++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;if(hs>as){h.w++;a.l++;h.pts+=3}else if(as>hs){a.w++;h.l++;a.pts+=3}else{h.d++;a.d++;h.pts++;a.pts++}}const all=[...map.values()];all.forEach(t=>t.gd=t.gf-t.ga);return all.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name,'it'))}
function winner(results,schedule){const finals=unique(results).filter(r=>/^(finale?|playoff finale?)$/i.test(text(r.competition_stage))||/^(finale?|playoff finale?)$/i.test(text(r.competition_round)));if(finals.length!==1||schedule.some(r=>/^(finale?|playoff finale?)$/i.test(text(r.competition_stage))||/^(finale?|playoff finale?)$/i.test(text(r.competition_round))))return null;const r=finals[0];if(!completed(r)||/andata|1st leg/i.test(text(r.competition_round)))return null;let h=score(r.home_score),a=score(r.away_score);const ah=score(r.aggregate_home_score),aa=score(r.aggregate_away_score);if(ah!==null||aa!==null){if(ah===null||aa===null)return null;h=ah;a=aa}else if(/ritorno|2nd leg/i.test(text(r.competition_round)))return null;if(h===a){h=score(r.penalty_home_score);a=score(r.penalty_away_score);if(h===null||a===null||h===a)return null}const side=h>a?'home':'away';return {name:r[side+'_name'],core:r[side+'_core'],side,match:r}}

function managerSide(r,id){if(!text(id))return null;const h=text(r.home_sm_manager_id)===text(id),a=text(r.away_sm_manager_id)===text(id);return h===a?null:h?'home':'away'}
function managerRows(rows,id,assignments,national=false){return unique(rows).filter(r=>{
 const type=token(r.competition_group).replace(/ competition$/, '');const isNational=['nations','national'].includes(type);
 if(!['nations','national','domestic','international'].includes(type)||isNational!==national||!managerSide(r,id)||!completed(r)||!r.match_date)return false;
 return true;
})}
function managerStats(rows,id){const stats={p:0,w:0,d:0,l:0,gf:0,ga:0,clean:0};for(const r of unique(rows)){const side=managerSide(r,id);if(!side||!completed(r))continue;const other=side==='home'?'away':'home',gf=score(r[side+'_score']),ga=score(r[other+'_score']);stats.p++;stats.gf+=gf;stats.ga+=ga;if(gf>ga)stats.w++;else if(gf<ga)stats.l++;else stats.d++;if(ga===0)stats.clean++}return stats}
function careerDays(assignments,today){const ranges=assignments.filter(a=>a.start_date&&a.start_date<=today).map(a=>[Date.parse(a.start_date+'T00:00:00Z'),Date.parse((a.end_date&&a.end_date<today?a.end_date:today)+'T00:00:00Z')]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>=a).sort((a,b)=>a[0]-b[0]);let total=0,end=-Infinity;for(const [a,b] of ranges){const start=Math.max(a,end+86400000);if(b>=start)total+=(b-start)/86400000+1;end=Math.max(end,b)}return total}

function competitionRounds(results,schedule,comp){
 const all=unique([...schedule,...results]),done=unique(results).filter(completed),n=Number(comp.teams_count)||0;
 const perRound=comp.sm_action==='league'&&n>1?Math.floor(n/2):null;
 const expected=Number(comp.expected_match)||0;
 const total=perRound&&expected&&expected%perRound===0?expected/perRound:null;
 const key=r=>{const t=text(r.competition_round),m=t.match(/^(?:(?:turno|giornata|match|round)\s*)?(\d+)(?:\s*\/\s*\d+)?$/i);return m?'round:'+Number(m[1]):[text(r.competition_stage),t].filter(Boolean).join('|')||r.match_date||null};
 const groups=new Map();for(const r of all){const k=key(r);if(!k)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
 const ids=new Set(done.map(r=>text(r.sm_fixture_id)));
 let played=0;for(const rs of groups.values()){if(rs.every(r=>ids.has(text(r.sm_fixture_id)))&&(!perRound||rs.length>=perRound))played++}
 return {played,total};
}
function reportSummary(reports){
 const rows=unique(reports).filter(completed),fields=['total_shots','shots_on_target','corners','yellow_cards','red_cards'];
 const totals={matches:rows.length,goals:rows.reduce((s,r)=>s+score(r.home_score)+score(r.away_score),0)};
 const number=v=>v==null||text(v)===''?null:Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const json=v=>{if(typeof v==='string'){try{return JSON.parse(v)}catch{return null}}return v};
 const flag=v=>v===true||v===1||v==='1';
 const players=new Map();
 for(const f of fields)totals[f]=null;
 for(const r of rows){
  const stats=json(r.team_stats_json)||{};
  for(const side of ['home','away']){
   const team=Array.isArray(stats)?stats.find(s=>s.team_side===side)||{}:stats[side]||{};
   for(const f of fields){const v=number(team[f]);if(v!==null)totals[f]=(totals[f]??0)+v}
  }
  const seen=new Set(),ps=json(r.players_json);
  for(const p of Array.isArray(ps)?ps:[]){
   if(!['home','away'].includes(p.team_side)||!text(p.player_name))continue;
   const team=r[p.team_side+'_core']?.name||r[p.team_side+'_name']||'';
   const id=text(p.sm_player_id??p.player_id);
   const key=id?'id:'+id:'name:'+team+'|'+text(p.player_name);
   if(seen.has(key))continue;seen.add(key);
   if(!players.has(key))players.set(key,{name:p.player_name,teams:new Set(),goals:0,assists:0,mom:0,ratingSum:0,ratingCount:0});
   const x=players.get(key);x.teams.add(team);x.goals+=number(p.goals)||0;x.assists+=number(p.assists)||0;x.mom+=flag(p.man_of_match)?1:0;
   const rating=number(p.rating);if(rating!==null&&rating>0&&rating<=10){x.ratingSum+=rating;x.ratingCount++}
  }
 }
 const list=[...players.values()].map(p=>({...p,team:[...p.teams].filter(Boolean).join(' / '),rating:p.ratingCount?p.ratingSum/p.ratingCount:null}));
 const leaders={};for(const metric of ['goals','assists','mom','rating'])leaders[metric]=list.filter(p=>p[metric]>0).sort((a,b)=>b[metric]-a[metric]||b.ratingCount-a.ratingCount||a.name.localeCompare(b.name,'it')).slice(0,5);
 return {totals,leaders};
}

const api={competitionRounds,reportSummary,score,completed,unique,group,knockout,standings,winner,managerSide,managerRows,managerStats,careerDays};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NexusLogic=api;
})(globalThis);
