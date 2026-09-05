(function(){
"use strict";
if(window.IMC_CLUBHOUSE_NATIONAL_TEAM_FIX)return;
const VERSION="3.1.0";
const mod=window.IMC_CLUBHOUSE;
if(!mod||mod.__nationalTeamFixWrapped){window.IMC_CLUBHOUSE_NATIONAL_TEAM_FIX={version:VERSION};return}
const previousMount=mod.mount;
mod.mount=async function(o){
  if(!o||!o.client||typeof o.client.rpc!=="function")return previousMount.call(mod,o);
  const source=o.client;
  const assignmentsByWorld=new Map();
  const proxy=Object.create(source);
  proxy.rpc=function(fn,args){
    const action=String(args&&args.p_action||"").trim().toLowerCase();
    const gameWorld=String(args&&args.p_args&&args.p_args.gameWorld||"").trim().toUpperCase();
    if(fn!=="imc_nexus_gateway")return source.rpc(fn,args);

    if(action==="club_house"){
      return source.rpc(fn,args).then(r=>{
        if(r&&r.data&&Array.isArray(r.data.assignments)){
          const normalized=r.data.assignments.map(a=>{
            const type=String(a&&a.assignment_type||"").trim().toLowerCase();
            const row=type==="national_team"?{...a,assignment_type:"nation"}:a;
            const gw=String(row&&row.game_world_id||"").trim().toUpperCase();
            if(gw){
              const current=assignmentsByWorld.get(gw)||{};
              if(String(row.assignment_type||"").toLowerCase()==="club"){
                current.club={teamId:row.team_id,worldId:row.sm_world_club_id};
              }
              if(String(row.assignment_type||"").toLowerCase()==="nation"){
                current.nation={nationId:row.nation_id,worldId:row.sm_world_national_club_id};
              }
              assignmentsByWorld.set(gw,current);
            }
            return row;
          });
          r={...r,data:{...r.data,assignments:normalized}};
        }
        return r;
      });
    }

    if((action==="results"||action==="schedule")&&gameWorld){
      const input=args&&args.p_args||{};
      const explicitWorldId=input.clubWorldId!=null||input.nationWorldId!=null;
      const hasTeamNames=Array.isArray(input.teamNames)&&input.teamNames.length>0;
      if(explicitWorldId)return source.rpc(fn,args);
      if(hasTeamNames){
        const assignment=assignmentsByWorld.get(gameWorld)&&assignmentsByWorld.get(gameWorld).club;
        const worldId=assignment&&assignment.worldId;
        if(worldId!=null&&String(worldId).trim()!==""){
          const p={...input,gameWorld,clubWorldId:worldId};
          delete p.teamNames;
          return source.rpc(fn,{...args,p_args:p});
        }
      }
      return source.rpc(fn,args);
    }

    if(action==="team_resolve"&&gameWorld){
      const assignment=assignmentsByWorld.get(gameWorld)&&assignmentsByWorld.get(gameWorld).club;
      const worldId=assignment&&assignment.worldId;
      if(worldId!=null&&String(worldId).trim()!==""){
        return source.rpc("imc_nexus_gateway",{p_action:"gw_teams",p_args:{gameWorld}}).then(r=>{
          if(r&&r.error)return r;
          const rows=Array.isArray(r&&r.data&&r.data.rows)?r.data.rows:[];
          const row=rows.find(x=>String(x&&x.sm_world_club_id||"").trim()===String(worldId).trim())||null;
          if(!row)return r;
          const teamName=String(row.display_name||row.club_name||"").trim();
          const teamNames=[row.display_name,row.club_name].map(v=>String(v||"").trim()).filter((v,i,a)=>v&&a.indexOf(v)===i);
          return {data:{ok:true,action:"team_resolve",gameWorld,teamId:row.team_id||assignment.teamId||null,teamName,clubWorldId:worldId,teamNames},error:null};
        });
      }
    }

    if(action==="nation_resolve"&&gameWorld){
      const assignment=assignmentsByWorld.get(gameWorld)&&assignmentsByWorld.get(gameWorld).nation;
      const worldId=assignment&&assignment.worldId;
      if(worldId!=null&&String(worldId).trim()!==""){
        return source.rpc("imc_nexus_gateway",{p_action:"gw_national_teams",p_args:{gameWorld}}).then(r=>{
          if(r&&r.error)return r;
          const rows=Array.isArray(r&&r.data&&r.data.rows)?r.data.rows:[];
          const row=rows.find(x=>String(x&&x.sm_world_national_club_id||"").trim()===String(worldId).trim())||null;
          if(!row)return r;
          return {data:{ok:true,action:"nation_resolve",gameWorld,nationId:assignment.nationId||null,nationWorldId:worldId,teamName:String(row.nation_name||"").trim(),teamNames:[String(row.nation_name||"").trim()].filter(Boolean)},error:null};
        });
      }
    }

    return source.rpc(fn,args);
  };
  return previousMount.call(mod,{...o,client:proxy});
};
mod.__nationalTeamFixWrapped=true;
window.IMC_CLUBHOUSE_NATIONAL_TEAM_FIX={version:VERSION};
})();