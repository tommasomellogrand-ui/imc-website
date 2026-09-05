(function(){
"use strict";
if(window.IMC_PLAYER_GLOBAL)return;
const VERSION="1.0.0";
const ID_KEYS=["player_id","sm_player_id","smPlayerId","playerId"];
function playerId(x){
  if(!x||typeof x!=="object"||Array.isArray(x))return null;
  for(const key of ID_KEYS){
    const value=x[key];
    if(value!==null&&value!==undefined&&String(value).trim()!=="")return String(value).trim();
  }
  return null;
}
function collect(node,set){
  if(Array.isArray(node)){node.forEach(x=>collect(x,set));return}
  if(!node||typeof node!=="object")return;
  const id=playerId(node);
  if(id&&/^\d+$/.test(id))set.add(id);
  Object.values(node).forEach(x=>collect(x,set));
}
function apply(node,map){
  if(Array.isArray(node)){node.forEach(x=>apply(x,map));return}
  if(!node||typeof node!=="object")return;
  const id=playerId(node);
  const p=id?map.get(id):null;
  if(p){
    node.player_first_name=p.first_name||"";
    node.player_last_name=p.last_name||"";
    node.player_full_name=p.full_name||"";
    node.player_photo_url=p.photo_url||"";
    if(Object.prototype.hasOwnProperty.call(node,"player_name"))node.player_name=p.full_name||node.player_name;
    if(Object.prototype.hasOwnProperty.call(node,"playerName"))node.playerName=p.full_name||node.playerName;
  }
  Object.values(node).forEach(x=>apply(x,map));
}
async function enrich(client,data){
  if(!client||!data)return data;
  const ids=new Set();
  collect(data,ids);
  if(!ids.size)return data;
  const r=await client.rpc("imc_nexus_gateway",{p_action:"player_global_resolve",p_args:{playerIds:Array.from(ids)}});
  if(r.error)throw r.error;
  const rows=Array.isArray(r.data&&r.data.rows)?r.data.rows:[];
  const map=new Map(rows.map(x=>[String(x.player_id),x]));
  apply(data,map);
  return data;
}
function view(player,className){
  const x=player||{};
  const name=String(x.player_full_name||x.player_name||x.playerName||x.player_id||x.sm_player_id||x.smPlayerId||x.playerId||"");
  const photo=String(x.player_photo_url||"");
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  return `<span class="pg-player${className?" "+esc(className):""}">${photo?`<img class="pg-avatar" src="${esc(photo)}" alt="">`:""}<span class="pg-name">${esc(name)}</span></span>`;
}
window.IMC_PLAYER_GLOBAL={version:VERSION,enrich,view};
})();