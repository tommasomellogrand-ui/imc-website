(function(){
"use strict";
if(window.__IMC_COMPETITION_FILTERS_FINAL__)return;
window.__IMC_COMPETITION_FILTERS_FINAL__=true;

const VERSION="3.2.0";
const MULTI_LEAGUE_WORLDS=new Set(["GW002","GW003","GW007","GW008"]);
const registryCache=new Map();
const state=new Map();
let timer=null;

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function page(){return document.querySelector('.imc-competitions-all-worlds[data-imc-competitions-world]:not(.imc-comp-detail)');}
function worldOf(el){return clean(el&&el.getAttribute("data-imc-competitions-world")).toUpperCase();}
function isMultiLeague(world){return MULTI_LEAGUE_WORLDS.has(world);}

function installCss(){
  if(document.getElementById("imcCompetitionFiltersFinalCss"))return;
  const s=document.createElement("style");
  s.id="imcCompetitionFiltersFinalCss";
  s.textContent=`
.imc-comp-filter-stack-final{display:grid;gap:8px;margin:0 0 20px}
.imc-comp-country-filters-final{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.imc-comp-country-filters-final::-webkit-scrollbar{display:none}
.imc-comp-country-filters-final .imc-comp-filter{flex:0 0 auto;min-width:max-content;padding-left:12px!important;padding-right:12px!important}
.imc-comp-type-filters-final{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.imc-comp-section[data-imc-section="friendly"]{display:none!important}
`;
  document.head.appendChild(s);
}

async function registry(world){
  if(registryCache.has(world))return registryCache.get(world);
  const c=window.__IMC_NEXUS_CLIENT__;
  if(!c)throw new Error("Client Nexus non disponibile");
  const p=c.from(world.toLowerCase()+"_gw_competitions").select("*").then(r=>{
    if(r.error)throw r.error;
    return r.data||[];
  });
  registryCache.set(world,p);
  try{return await p;}catch(e){registryCache.delete(world);throw e;}
}

function typeOf(row){
  const explicit=norm(row&&row.IMC_competition_type);
  const action=norm(row&&row.sm_action);
  if(explicit.includes("friendly")||action==="friendly")return null;
  if(explicit.includes("nation")||action==="nations"||action==="nation")return"nations";
  if(explicit.includes("international"))return"international-cups";
  if(explicit.includes("domestic"))return action==="league"?"domestic-leagues":"domestic-cups";
  if(action==="league")return"domestic-leagues";
  if(action)return"domestic-cups";
  return null;
}
function countryOf(row){return clean(row&&row["Country Nexus View"]);}
function currentState(world){
  if(!state.has(world))state.set(world,{type:"domestic-leagues",country:"all"});
  return state.get(world);
}
function button(parent,label,attr,value,active,click){
  const b=document.createElement("button");
  b.type="button";
  b.className="imc-comp-filter"+(active?" is-active":"");
  b.textContent=label;
  b.setAttribute(attr,value);
  b.addEventListener("click",click);
  parent.appendChild(b);
}
function setCardVisible(card,show){
  if(show)card.style.removeProperty("display");
  else card.style.setProperty("display","none","important");
}
function apply(el,world,rowByKey){
  const st=currentState(world),multi=isMultiLeague(world);
  el.querySelectorAll("[data-imc-final-country]").forEach(b=>b.classList.toggle("is-active",b.getAttribute("data-imc-final-country")===st.country));
  el.querySelectorAll("[data-imc-final-type]").forEach(b=>b.classList.toggle("is-active",b.getAttribute("data-imc-final-type")===st.type));
  el.querySelectorAll('.imc-comp-section[data-imc-section]').forEach(section=>{
    let visible=0;
    section.querySelectorAll('.imc-comp-card[data-imc-key]').forEach(card=>{
      const row=rowByKey.get(clean(card.getAttribute("data-imc-key")));
      const type=typeOf(row),country=countryOf(row);
      let show=!!row&&!!type&&type===st.type;
      if(show&&multi&&st.country!=="all"&&(type==="domestic-leagues"||type==="domestic-cups"))show=country===st.country;
      setCardVisible(card,show);
      card.dataset.imcRegistryType=type||"";
      card.dataset.imcRegistryCountry=country;
      if(show)visible++;
    });
    section.hidden=visible===0;
    const count=section.querySelector(".imc-comp-section-head > span");
    if(count)count.textContent=String(visible);
  });
}

async function enhance(){
  installCss();
  const el=page();
  if(!el)return;
  const world=worldOf(el);
  if(!world)return;
  const rows=await registry(world);
  if(!el.isConnected||page()!==el)return;
  const rowByKey=new Map(rows.map(r=>[clean(r&&r.competition_key),r]));
  const keys=new Set(Array.from(el.querySelectorAll('.imc-comp-card[data-imc-key]')).map(c=>clean(c.getAttribute("data-imc-key"))));
  const present=rows.filter(r=>keys.has(clean(r&&r.competition_key)));
  const st=currentState(world);

  el.querySelectorAll(':scope > .imc-comp-filters,:scope > .imc-comp-filter-stack,:scope > .imc-comp-filter-stack-final').forEach(n=>n.remove());
  const stack=document.createElement("div");
  stack.className="imc-comp-filter-stack-final";
  const hero=el.querySelector(':scope > .imc-comp-hero');
  hero?hero.insertAdjacentElement("afterend",stack):el.prepend(stack);

  if(isMultiLeague(world)){
    const countries=[];const seen=new Set();
    present.forEach(r=>{
      const t=typeOf(r),c=countryOf(r);
      if((t==="domestic-leagues"||t==="domestic-cups")&&c&&!seen.has(c)){seen.add(c);countries.push(c);}
    });
    if(st.country!=="all"&&!countries.includes(st.country))st.country="all";
    const countryRow=document.createElement("div");
    countryRow.className="imc-comp-country-filters-final";
    button(countryRow,"All Countries","data-imc-final-country","all",st.country==="all",()=>{st.country="all";apply(el,world,rowByKey);});
    countries.forEach(c=>button(countryRow,c,"data-imc-final-country",c,st.country===c,()=>{st.country=c;if(st.type==="international-cups"||st.type==="nations")st.type="domestic-leagues";apply(el,world,rowByKey);}));
    stack.appendChild(countryRow);
  }else st.country="all";

  const types=document.createElement("div");
  types.className="imc-comp-type-filters-final";
  [["domestic-leagues","Domestic Leagues"],["domestic-cups","Domestic Cups"],["international-cups","International Cups"],["nations","Nations"]].forEach(([key,label])=>{
    button(types,label,"data-imc-final-type",key,st.type===key,()=>{st.type=key;if(key==="international-cups"||key==="nations")st.country="all";apply(el,world,rowByKey);});
  });
  stack.appendChild(types);
  apply(el,world,rowByKey);
}

function schedule(){clearTimeout(timer);timer=setTimeout(()=>enhance().catch(e=>console.warn("IMC final competition filters:",e&&e.message||e)),80);}
function start(){installCss();new MutationObserver(mutations=>{
  const relevant=mutations.some(m=>Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.('.imc-competitions-all-worlds,.imc-comp-filters,.imc-comp-card,.imc-comp-section')||n.querySelector?.('.imc-competitions-all-worlds,.imc-comp-filters,.imc-comp-card,.imc-comp-section'))));
  if(relevant)schedule();
}).observe(document.documentElement,{childList:true,subtree:true});schedule();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_COMPETITION_FILTERS_FINAL={version:VERSION,refresh:enhance};
})();
