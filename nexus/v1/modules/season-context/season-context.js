(function(){
"use strict";
if(window.IMC_SEASON_CONTEXT)return;
const VERSION="1.0.1";
const ACTIONS=new Set(["results","schedule","competition_player_stats","trophy_room","match_report","competition_manifest","nation_competition_matches","competition_group_matches"]);
const selected=new Map();
function clean(v){return String(v==null?"":v).trim()}
function set(worldId,season){const w=clean(worldId).toUpperCase(),n=Number(season);if(w&&Number.isInteger(n)&&n>0)selected.set(w,n)}
function get(worldId){return selected.get(clean(worldId).toUpperCase())||null}
function clear(worldId){if(worldId)selected.delete(clean(worldId).toUpperCase());else selected.clear()}
function attach(client){
  if(!client||client.__imcSeasonContextAttached)return client;
  const original=client.rpc.bind(client);
  client.rpc=function(fn,args,options){
    if(fn==="imc_nexus_gateway"&&args){
      const action=clean(args.p_action).toLowerCase();
      const p=Object.assign({},args.p_args||{});
      if(action==="trophy_room"&&clean(p.competitionKey)){
        args=Object.assign({},args,{p_action:"trophy_room_history",p_args:p});
      }else if(ACTIONS.has(action)){
        const world=clean(p.gameWorld||p.game_world_id).toUpperCase(),season=get(world);
        if(season&&p.season==null&&p.imcSeason==null)p.season=season;
        args=Object.assign({},args,{p_args:p});
      }
    }
    return original(fn,args,options);
  };
  client.__imcSeasonContextAttached=true;
  return client;
}
window.IMC_SEASON_CONTEXT={version:VERSION,attach,set,get,clear};
})();