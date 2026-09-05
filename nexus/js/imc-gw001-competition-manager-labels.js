(function(){
"use strict";
if(window.__IMC_COMPETITION_MANAGER_LABELS_ALL_WORLDS__)return;
window.__IMC_COMPETITION_MANAGER_LABELS_ALL_WORLDS__=true;

const VERSION="1.1.0";
const STYLE_ID="imcCompetitionManagerLabelsAllWorldsCss";
const VALID_WORLDS=new Set(["GW001","GW002","GW003","GW004","GW005","GW006","GW007","GW008","GW009","GW010"]);
let client=null,observer=null,timer=null;
const mapPromises=new Map();

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function db(){
  if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;
  if(client)return client;
  try{const cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");if(window.supabase&&cfg&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key);}catch(_){}
  return client;
}
function todayLocal(){
  const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function isActive(a,today){return clean(a.start_date)<=today&&(!clean(a.end_date)||clean(a.end_date)>=today);}
async function fetchIn(table,select,column,values){
  const c=db(),out=[],ids=[...new Set((values||[]).filter(v=>v!=null))];
  for(let i=0;i<ids.length;i+=250){const r=await c.from(table).select(select).in(column,ids.slice(i,i+250));if(r.error)throw r.error;out.push(...(r.data||[]));}
  return out;
}
function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.imc-comp-detail[data-imc-competitions-world] .imc-team-copy-manager{display:flex;flex-direction:column;justify-content:center;min-width:0;max-width:100%}
.imc-comp-detail[data-imc-competitions-world] .imc-side.home .imc-team-copy-manager{align-items:flex-end;text-align:right}
.imc-comp-detail[data-imc-competitions-world] .imc-side.away .imc-team-copy-manager{align-items:flex-start;text-align:left}
.imc-comp-detail[data-imc-competitions-world] .imc-manager-name{display:block;max-width:100%;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#748096;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:8.8px;line-height:1.08;font-weight:800;letter-spacing:-.01em}
@media(min-width:600px){.imc-comp-detail[data-imc-competitions-world] .imc-manager-name{font-size:9.5px}}
`;document.head.appendChild(s);
}
async function loadManagerMap(world){
  if(mapPromises.has(world))return mapPromises.get(world);
  const promise=(async()=>{
    const c=db();if(!c)throw new Error("Client Supabase non disponibile");
    const aRes=await c.from("gw_manager_assignments").select("manager_id,team_id,start_date,end_date").eq("game_world_id",world).eq("assignment_type","club");
    if(aRes.error)throw aRes.error;
    const today=todayLocal(),assignments=(aRes.data||[]).filter(a=>isActive(a,today));
    const teamIds=assignments.map(a=>a.team_id),managerIds=assignments.map(a=>a.manager_id);
    const [teams,managers,worldTeams]=await Promise.all([
      fetchIn("gw_teams","team_id,sm_world_club_id,sm_club_id","team_id",teamIds),
      fetchIn("imc_managers","manager_id,full_name","manager_id",managerIds),
      (async()=>{const r=await c.from(`${world.toLowerCase()}_gw_teams`).select("sm_world_club_id,sm_club_id,club_name");if(r.error)throw r.error;return r.data||[];})()
    ]);
    const teamById=new Map(teams.map(t=>[String(t.team_id),t]));
    const managerById=new Map(managers.map(m=>[String(m.manager_id),clean(m.full_name)]));
    const worldByWorldId=new Map(),worldByClubId=new Map();
    worldTeams.forEach(t=>{if(t.sm_world_club_id!=null)worldByWorldId.set(String(t.sm_world_club_id),t);if(t.sm_club_id!=null)worldByClubId.set(String(t.sm_club_id),t);});
    const map=new Map();
    assignments.forEach(a=>{
      const team=teamById.get(String(a.team_id)),manager=managerById.get(String(a.manager_id));if(!team||!manager)return;
      const wt=(team.sm_world_club_id!=null&&worldByWorldId.get(String(team.sm_world_club_id)))||(team.sm_club_id!=null&&worldByClubId.get(String(team.sm_club_id)));
      if(wt&&clean(wt.club_name))map.set(norm(wt.club_name),manager);
    });
    return map;
  })();
  mapPromises.set(world,promise);
  try{return await promise;}catch(e){mapPromises.delete(world);throw e;}
}
function annotateSide(side,map){
  if(!side)return;
  const name=side.querySelector(":scope > .imc-team-name, :scope > .imc-team-copy-manager > .imc-team-name");if(!name)return;
  const manager=map.get(norm(name.textContent));
  const existing=side.querySelector(":scope > .imc-team-copy-manager");
  if(!manager){if(existing){const teamName=existing.querySelector(".imc-team-name");if(teamName)existing.replaceWith(teamName);}return;}
  if(existing){let label=existing.querySelector(".imc-manager-name");if(!label){label=document.createElement("small");label.className="imc-manager-name";existing.appendChild(label);}if(label.textContent!==manager)label.textContent=manager;return;}
  const wrap=document.createElement("span");wrap.className="imc-team-copy-manager";
  name.replaceWith(wrap);wrap.appendChild(name);
  const label=document.createElement("small");label.className="imc-manager-name";label.textContent=manager;wrap.appendChild(label);
}
async function enhance(){
  installCss();
  const root=document.querySelector('.imc-comp-detail[data-imc-competitions-world]');if(!root)return;
  const world=clean(root.getAttribute("data-imc-competitions-world")).toUpperCase();if(!VALID_WORLDS.has(world))return;
  const rows=[...root.querySelectorAll(".imc-match-row")];if(!rows.length)return;
  try{const map=await loadManagerMap(world);rows.forEach(r=>{annotateSide(r.querySelector(".imc-side.home"),map);annotateSide(r.querySelector(".imc-side.away"),map);});}catch(e){console.warn("Competition manager labels:",e&&e.message||e);}
}
function schedule(){clearTimeout(timer);timer=setTimeout(enhance,45);}
function start(){installCss();observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});schedule();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_COMPETITION_MANAGER_LABELS_ALL_WORLDS={version:VERSION,refresh:enhance,clearCache:()=>{mapPromises.clear();}};
})();
