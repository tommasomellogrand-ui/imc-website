(function(){
"use strict";
if(window.__IMC_COMPETITION_COUNTRY_TYPE_FILTERS_V2__)return;
window.__IMC_COMPETITION_COUNTRY_TYPE_FILTERS_V2__=true;

const VERSION="2.0.0";
const STYLE_ID="imcCompetitionCountryTypeFiltersCssV2";
const MULTI_LEAGUE_WORLDS=new Set(["GW002","GW003","GW007","GW008"]);
const registryCache=new Map(),countryState=new Map(),typeState=new Map();
let observer=null,timer=null,applying=false;

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function page(){return document.querySelector('.imc-competitions-all-worlds[data-imc-competitions-world]:not(.imc-comp-detail)');}
function worldOf(el){return clean(el&&el.getAttribute("data-imc-competitions-world")).toUpperCase();}
function isMultiLeague(world){return MULTI_LEAGUE_WORLDS.has(world);}

function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");
  s.id=STYLE_ID;
  s.textContent=`
.imc-comp-filter-stack{display:grid;gap:8px;margin:0 0 20px}
.imc-comp-country-filters{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.imc-comp-country-filters::-webkit-scrollbar{display:none}
.imc-comp-country-filters .imc-comp-filter{flex:0 0 auto;min-width:max-content;padding-left:12px!important;padding-right:12px!important}
.imc-comp-type-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.imc-comp-section[data-imc-section="friendly"]{display:none!important}
`;
  document.head.appendChild(s);
}

async function registry(world){
  if(registryCache.has(world))return registryCache.get(world);
  const c=window.__IMC_NEXUS_CLIENT__;
  if(!c)return[];
  const p=c.from(world.toLowerCase()+"_gw_competitions").select("*").then(r=>{
    if(r.error)throw r.error;
    return r.data||[];
  });
  registryCache.set(world,p);
  try{return await p;}catch(e){registryCache.delete(world);throw e;}
}

function competitionType(row){
  const explicit=norm(row&&row.IMC_competition_type);
  if(explicit.includes("international"))return"international";
  if(explicit.includes("nation"))return"nations";
  if(explicit.includes("friendly"))return"friendly";
  if(explicit.includes("domestic"))return"domestic";
  const action=norm(row&&row.sm_action);
  if(action==="friendly")return"friendly";
  if(action==="international")return"international";
  if(action==="nations"||action==="nation")return"nations";
  return"domestic";
}

function competitionCountry(row){
  return clean(row&&row["Country Nexus View"]);
}

function addButton(parent,label,attr,value,active,click){
  const b=document.createElement("button");
  b.type="button";
  b.className="imc-comp-filter"+(active?" is-active":"");
  b.textContent=label;
  b.setAttribute(attr,value);
  b.addEventListener("click",click);
  parent.appendChild(b);
  return b;
}

function cardMeta(card,rowByKey){
  const key=clean(card&&card.getAttribute("data-imc-key"));
  const row=rowByKey.get(key)||null;
  return{key,row,type:competitionType(row),country:competitionCountry(row)};
}

function shouldShow(meta,country,type,multiLeague){
  if(!meta.row)return type==="all"&&country==="all";
  if(meta.type==="friendly")return false;

  if(type!=="all"&&meta.type!==type)return false;

  if(multiLeague&&country!=="all"){
    return meta.country===country;
  }

  return true;
}

function apply(el,world,rowByKey){
  if(applying)return;
  applying=true;
  try{
    const multiLeague=isMultiLeague(world);
    const country=multiLeague?(countryState.get(world)||"all"):"all";
    const type=typeState.get(world)||"all";

    el.querySelectorAll("[data-imc-country-filter]").forEach(b=>{
      b.classList.toggle("is-active",b.getAttribute("data-imc-country-filter")===country);
    });
    el.querySelectorAll("[data-imc-type-filter]").forEach(b=>{
      b.classList.toggle("is-active",b.getAttribute("data-imc-type-filter")===type);
    });

    el.querySelectorAll('.imc-comp-section[data-imc-section]').forEach(section=>{
      let visible=0;
      section.querySelectorAll('.imc-comp-card[data-imc-key]').forEach(card=>{
        const meta=cardMeta(card,rowByKey);
        card.dataset.imcRegistryType=meta.type;
        card.dataset.imcRegistryCountry=meta.country;
        const show=shouldShow(meta,country,type,multiLeague);
        card.style.display=show?"":"none";
        if(show)visible++;
      });
      section.hidden=visible===0;
      const count=section.querySelector(".imc-comp-section-head > span");
      if(count)count.textContent=String(visible);
    });
  }finally{
    applying=false;
  }
}

function representedRows(el,rows){
  const keys=new Set(Array.from(el.querySelectorAll('.imc-comp-card[data-imc-key]')).map(card=>clean(card.getAttribute("data-imc-key"))).filter(Boolean));
  return rows.filter(r=>keys.has(clean(r&&r.competition_key)));
}

async function enhance(){
  installCss();
  const el=page();
  if(!el)return;
  const world=worldOf(el);
  if(!world)return;

  const rows=await registry(world);
  const rowByKey=new Map(rows.map(r=>[clean(r&&r.competition_key),r]));
  const presentRows=representedRows(el,rows);

  el.querySelectorAll(':scope > .imc-comp-filters,:scope > .imc-comp-filter-stack').forEach(x=>x.remove());

  const stack=document.createElement("div");
  stack.className="imc-comp-filter-stack";
  const hero=el.querySelector(':scope > .imc-comp-hero');
  hero?hero.insertAdjacentElement("afterend",stack):el.prepend(stack);

  if(!typeState.has(world))typeState.set(world,"all");

  if(isMultiLeague(world)){
    const countries=[];
    const seen=new Set();
    presentRows.forEach(r=>{
      const c=competitionCountry(r);
      if(c&&!seen.has(c)){seen.add(c);countries.push(c);}
    });

    const currentCountry=countryState.get(world)||"all";
    if(currentCountry!=="all"&&!countries.includes(currentCountry))countryState.set(world,"all");
    if(!countryState.has(world))countryState.set(world,"all");

    if(countries.length){
      const row=document.createElement("div");
      row.className="imc-comp-country-filters";
      addButton(row,"All Countries","data-imc-country-filter","all",countryState.get(world)==="all",()=>{
        countryState.set(world,"all");
        apply(el,world,rowByKey);
      });
      countries.forEach(c=>addButton(row,c,"data-imc-country-filter",c,countryState.get(world)===c,()=>{
        countryState.set(world,c);
        apply(el,world,rowByKey);
      }));
      stack.appendChild(row);
    }
  }else{
    countryState.set(world,"all");
  }

  const types=document.createElement("div");
  types.className="imc-comp-type-filters";
  [["all","All"],["domestic","Domestic"],["international","International"],["nations","Nations"]].forEach(([k,l])=>{
    addButton(types,l,"data-imc-type-filter",k,typeState.get(world)===k,()=>{
      typeState.set(world,k);
      if(isMultiLeague(world)&&(k==="international"||k==="nations"))countryState.set(world,"all");
      apply(el,world,rowByKey);
    });
  });
  stack.appendChild(types);

  apply(el,world,rowByKey);
}

function schedule(){
  if(applying)return;
  clearTimeout(timer);
  timer=setTimeout(()=>enhance().catch(e=>console.warn("IMC Competition filters v2:",e&&e.message||e)),120);
}

function start(){
  installCss();
  observer=new MutationObserver(mutations=>{
    if(applying)return;
    const meaningful=mutations.some(m=>Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(
      n.matches?.('.imc-competitions-all-worlds,.imc-comp-card,.imc-comp-section')||
      n.querySelector?.('.imc-competitions-all-worlds,.imc-comp-card,.imc-comp-section')
    )));
    if(meaningful)schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  schedule();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

window.IMC_COMPETITION_COUNTRY_TYPE_FILTERS={
  version:VERSION,
  refresh:enhance,
  clearCache:()=>{registryCache.clear();countryState.clear();typeState.clear();}
};
})();
