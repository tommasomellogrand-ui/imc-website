(function(){
"use strict";
if(window.IMC_COMPETITIONS_TAP)return;
const VERSION="1.7.3";
const cache=new Map();
const clean=v=>String(v==null?"":v).trim();
function loadGlobalBack(){
  if(!document.querySelector('link[data-nexus-global-back-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='v1/modules/global-back/global-back.css?v=1.0.0';
    link.setAttribute('data-nexus-global-back-css','1');
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-nexus-global-back-js]')){
    const script=document.createElement('script');
    script.src='v1/modules/global-back/global-back.js?v=1.1.1';
    script.async=false;
    script.setAttribute('data-nexus-global-back-js','1');
    document.head.appendChild(script);
  }
}
function loadGW002Visuals(){
  if(!document.querySelector('link[data-gw002-tiles-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='v1/modules/competitions/competitions-gw002-lab.css?v=1.1.0';
    link.setAttribute('data-gw002-tiles-css','1');
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-gw002-tiles-js]')){
    const script=document.createElement('script');
    script.src='v1/modules/competitions/competitions-gw002-tiles.js?v=1.2.0';
    script.async=false;
    script.setAttribute('data-gw002-tiles-js','1');
    document.body.appendChild(script);
  }
  if(!document.querySelector('link[data-gw002-hub-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='v1/modules/competitions/competitions-gw002-hub.css?v=2.1.0';
    link.setAttribute('data-gw002-hub-css','1');
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-gw002-hub-js]')){
    const script=document.createElement('script');
    script.src='v1/modules/competitions/competitions-gw002-hub.js?v=2.1.0';
    script.async=false;
    script.setAttribute('data-gw002-hub-js','1');
    document.body.appendChild(script);
  }
  if(!document.querySelector('link[data-gw002-brand-system-css]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='v1/modules/competitions/competitions-gw002-brand-system.css?v=1.0.0';
    link.setAttribute('data-gw002-brand-system-css','1');
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-gw002-brand-system-js]')){
    const script=document.createElement('script');
    script.src='v1/modules/competitions/competitions-gw002-brand-system.js?v=1.0.2';
    script.async=false;
    script.setAttribute('data-gw002-brand-system-js','1');
    document.body.appendChild(script);
  }
}
function gw002HubReady(){
  const hub=document.querySelector('.cp-hub');
  if(!hub)return false;
  return clean(hub.querySelector('.cp-world-mark span')?.textContent)==='GW002';
}
function maybeLoadGW002Visuals(){if(gw002HubReady())loadGW002Visuals()}
loadGlobalBack();
const visualObserver=new MutationObserver(maybeLoadGW002Visuals);
visualObserver.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',maybeLoadGW002Visuals);
async function getCompetitions(worldId){
  if(cache.has(worldId))return cache.get(worldId);
  const client=window.__IMC_NEXUS_CLIENT__;
  if(!client)throw new Error("Client Nexus non disponibile");
  const r=await client.rpc("imc_nexus_gateway",{p_action:"gw_competitions",p_args:{gameWorld:worldId}});
  if(r.error)throw r.error;
  const rows=(r.data&&r.data.rows)||[];
  cache.set(worldId,rows);
  return rows;
}
function rowName(x){return clean(x&&x["Nexus View"]||x&&x.sm_competition_name||x&&x.competition_key)}
document.addEventListener("click",async e=>{
  const card=e.target.closest&&e.target.closest(".cp-preview-card");
  if(!card)return;
  const menu=card.closest(".cp-menu");
  if(!menu)return;
  const worldId=clean(menu.querySelector(".cp-menu-world span")?.textContent);
  const name=clean(card.querySelector("h3")?.textContent);
  if(!worldId||!name)return;
  try{
    const rows=await getCompetitions(worldId);
    const row=rows.find(x=>rowName(x)===name);
    const key=clean(row&&row.competition_key);
    if(!key)return;
    document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:{target:"competition-detail",worldId,competitionKey:key,name}}));
  }catch(err){console.error("Competition tap error",err)}
});
window.IMC_COMPETITIONS_TAP={version:VERSION};
})();