(function(root){'use strict';
const cutoff='2004-10-15';
function value(v){if(v===null||v===undefined||v==='')return null;if(typeof v==='number')return Number.isFinite(v)&&v>=0?v:null;const s=String(v).replace(/[€\s]/g,'').replace(',','.');const m=s.match(/^(\d+(?:\.\d+)?)([kmb])?$/i);return m?Number(m[1])*({k:1e3,m:1e6,b:1e9}[String(m[2]).toLowerCase()]||1):null}
function eligible(d){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d&&d>=cutoff}
function build(teams,codex,rosters){const players=new Map(codex.map(p=>[String(p.player_id),p]));const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;return teams.map((t,i)=>{const seen=new Set();let missing=0;const rows=[];for(const r of rosters[i].rows){if(r.roster_status!=='active'||seen.has(String(r.player_id)))continue;seen.add(String(r.player_id));const p=players.get(String(r.player_id));if(!p||!p.date_of_birth){missing++;continue}if(!eligible(p.date_of_birth))continue;rows.push({...p,value:value(p.market_value),ratingValue:value(p.rating)})}const ratings=rows.map(p=>p.ratingValue).filter(v=>v!==null),values=rows.map(p=>p.value).filter(v=>v!==null);return {...t,players:rows,count:rows.length,rating:mean(ratings),value:mean(values),ratingCount:ratings.length,valueCount:values.length,missing}})}

function purchases(club,transfers){
 const ids=new Set(),target=String(club.world_id);
 const list=v=>{if(Array.isArray(v))return v;try{const a=JSON.parse(v||'[]');return Array.isArray(a)?a:[]}catch(e){return []}};
 for(const t of transfers){
  if(t.game_world_id&&t.game_world_id!=='GW011')continue;
  if(String(t.to_sm_world_club_id)===target&&Number(t.player_id)>0)ids.add(String(t.player_id));
  if(String(t.from_sm_world_club_id)===target)for(const p of [...list(t.exchange_players),...list(t.normalized_exchange_players)])if(Number(p.player_id)>0)ids.add(String(p.player_id));
 }
 const players=club.players.filter(p=>ids.has(String(p.player_id))),ratings=players.map(p=>p.ratingValue).filter(v=>v!==null),values=players.map(p=>p.value).filter(v=>v!==null);const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
 return {...club,players,count:players.length,rating:mean(ratings),value:mean(values),ratingCount:ratings.length,valueCount:values.length,missing:0};
}
const api={cutoff,value,eligible,build,purchases};if(typeof module!=='undefined')module.exports=api;else root.RisingModel=api;
})(typeof window==='undefined'?globalThis:window);
