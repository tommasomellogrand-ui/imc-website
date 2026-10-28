export const KEY='GW001|DOMESTIC|league|1';
export function people(matches,awards,kind,names={}){
 const map=new Map();
 const row=(id,name)=>{if(!map.has(id))map.set(id,{id,name,played:0,won:0,gf:0,titles:0,seasons:new Set(),teams:new Set(),history:[]});return map.get(id);};
 for(const m of matches)for(const side of ['home','away']){
  const id=kind==='manager'?m[side+'_manager']:m[side+'_id'];if(!id)continue;
  const r=row(id,kind==='manager'?names[id]:m[side+'_name']);r.played++;r.won+=Number(m[side+'_score']>m[(side==='home'?'away':'home')+'_score']);r.gf+=m[side+'_score'];r.seasons.add(m.season);r.teams.add(m[side+'_name']);
  let h=r.history.find(x=>x.season===m.season&&x.team===m[side+'_name']);if(!h){h={season:m.season,team:m[side+'_name'],played:0,won:0};r.history.push(h);}h.played++;h.won+=Number(m[side+'_score']>m[(side==='home'?'away':'home')+'_score']);
 }
 for(const a of awards){const id=kind==='manager'?a.manager:a.winner_id;if(id)row(id,kind==='manager'?names[id]:a.winner).titles++;}
 return [...map.values()].sort((a,b)=>b.titles-a.titles||b.played-a.played||a.name.localeCompare(b.name,'it'));
}
export function players(stints,identities){
 const map=new Map();for(const s of stints){
  if(!map.has(s.player_id))map.set(s.player_id,{...identities[s.player_id],played:0,goals:0,assists:0,mom:0,minutes:0,missing:false,ratingSum:0,rated:0,history:[],seasons:new Set(),teams:new Set()});
  const p=map.get(s.player_id);p.played+=s.appearances;p.goals+=s.goals;p.assists+=s.assists;p.mom+=s.mom;p.minutes+=s.minutes??0;p.missing||=s.minutes===null;p.ratingSum+=(s.average_rating??0)*s.rated_matches;p.rated+=s.rated_matches;p.history.push(s);p.seasons.add(s.season);p.teams.add(s.club_name);
 }return [...map.values()].map(p=>({...p,minutes:p.missing?null:p.minutes,average:p.rated?Math.round(100*p.ratingSum/p.rated)/100:null})).sort((a,b)=>b.played-a.played||b.goals-a.goals||a.name.localeCompare(b.name,'it'));
}
