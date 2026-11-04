(function(root){'use strict';
const nameKey=v=>String(v||'').trim().toLocaleLowerCase('it');
function build(rawResults,rawSchedule,today){
 const names=new Map(),ids=new Map();
 for(const r of [...rawSchedule,...rawResults])for(const side of ['home','away']){const name=r[side+'_name'],n=nameKey(name),id=r[side+'_sm_club_id']||r[side+'_sm_team_id'];if(id){if(!names.has(n))names.set(n,new Set());names.get(n).add(String(id));if(!ids.has(String(id)))ids.set(String(id),name)}}
 const normalize=r=>{r={...r};for(const side of ['home','away']){const n=nameKey(r[side+'_name']),matches=names.get(n),id=r[side+'_sm_club_id']||r[side+'_sm_team_id']||(matches?.size===1?[...matches][0]:null);r[side+'_sm_club_id']=id?String(id):'name:'+n;if(id&&ids.has(String(id)))r[side+'_name']=ids.get(String(id))}return r};
 const identity=r=>[String(r.match_date).slice(0,10),r.home_sm_club_id,r.away_sm_club_id].join('|');
 const scheduled=rawSchedule.map(normalize),lookup=new Map();for(const r of scheduled){const k=identity(r);if(!lookup.has(k))lookup.set(k,[]);lookup.get(k).push(r)}
 const seen=new Set(),results=rawResults.map(normalize).filter(r=>{if(r.home_score==null||r.away_score==null)return false;const k=identity(r)+'|'+r.home_score+'|'+r.away_score;if(seen.has(k))return false;seen.add(k);return true}).map(r=>{const matches=lookup.get(identity(r));if(!r.competition_round&&matches?.length===1)r.competition_round=matches[0].competition_round;return r}).sort((a,b)=>String(b.match_date).localeCompare(String(a.match_date)));
 const played=new Set(results.map(identity)),scheduleSeen=new Set(),schedule=scheduled.filter(r=>{const k=identity(r);if(played.has(k)||scheduleSeen.has(k)||String(r.match_date).slice(0,10)<today)return false;scheduleSeen.add(k);return true}).sort((a,b)=>(String(a.match_date)+String(a.match_time)).localeCompare(String(b.match_date)+String(b.match_time)));
 const teams=new Map(),tables=new Map();
 for(const r of [...scheduled,...results])for(const side of ['home','away']){const id=r[side+'_sm_club_id'];teams.set(id,{name:r[side+'_name'],logo:r[side+'_logo_url']||teams.get(id)?.logo})}
 for(const r of results){if(r.competition_stage&&!/group|grupp|giron|league|campionato/i.test(r.competition_stage))continue;const group=r.competition_group_name||'';if(!tables.has(group))tables.set(group,new Map());const table=tables.get(group);for(const side of ['home','away']){const id=r[side+'_sm_club_id'],other=side==='home'?'away':'home',gf=Number(r[side+'_score']),ga=Number(r[other+'_score']);if(!table.has(id))table.set(id,{team_id:id,team_name:teams.get(id).name,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,gd:0,points:0});const t=table.get(id);t.played++;t.gf+=gf;t.ga+=ga;t.gd=t.gf-t.ga;if(gf>ga){t.won++;t.points+=3}else if(gf===ga){t.drawn++;t.points++}else t.lost++}}
 const groups=[...tables].map(([group_name,table])=>({group_name,rows:[...table.values()].sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team_name.localeCompare(b.team_name)).map((t,i)=>({...t,position:i+1}))}));return {results,schedule,teams,groups};
}
if(typeof module!=='undefined')module.exports={build};else root.CupModel={build};
})(typeof window!=='undefined'?window:this);
