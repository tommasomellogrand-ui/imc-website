(function(){
"use strict";
const VERSION="3.0-build53-world-isolation-scorers";
const BLOCKED_WORLDS=new Set(["GW002","GW003","GW008","GW010"]);
const WORLD_BY_NAME={
  "road to history":"GW001",
  "gold 558":"GW002",
  "gold 557":"GW003",
  "world league":"GW004",
  "hall of famers":"GW005",
  "master league world":"GW006",
  "the four kingdoms":"GW007",
  "gold 1":"GW008",
  "kick off":"GW009",
  "sensible soccer academy":"GW010"
};
const SENTINEL_ATTR="data-imc-codex-blocked-sentinel";
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
function currentWorld(){
  const header=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong");
  const name=norm(header&&header.textContent);
  if(name&&WORLD_BY_NAME[name])return WORLD_BY_NAME[name];
  if(name){
    const drawerItems=[...document.querySelectorAll("[data-drawer-world]")];
    const match=drawerItems.find(el=>norm(el.textContent).includes(name));
    if(match){
      const id=String(match.getAttribute("data-drawer-world")||"");
      if(/^GW\d{3}$/.test(id))return id;
    }
  }
  const root=document.getElementById("pageRoot");
  const text=String(root&&root.textContent||"");
  for(const [worldName,id] of Object.entries(WORLD_BY_NAME)){
    if(norm(text).includes(worldName))return id;
  }
  const m=text.match(/\bGW\d{3}\b/);
  return m?m[0]:null;
}
function ensureBlockedSentinel(nav){
  if(!nav||nav.querySelector("["+SENTINEL_ATTR+"]"))return;
  const sentinel=document.createElement("span");
  sentinel.setAttribute(SENTINEL_ATTR,"1");
  sentinel.setAttribute("data-world-section","player-codex");
  sentinel.hidden=true;
  sentinel.setAttribute("aria-hidden","true");
  sentinel.style.setProperty("display","none","important");
  nav.insertBefore(sentinel,nav.firstChild);
}
function removeInjectedFeatures(){
  document.querySelectorAll("[data-imc-codex-world],[data-imc-transfers-world]").forEach(el=>el.remove());
  document.querySelectorAll('.nx-bottom [data-page="transfers"]').forEach(el=>el.remove());
}
function sync(){
  const id=currentWorld();
  const nav=document.querySelector(".nx-world-nav");
  if(id&&BLOCKED_WORLDS.has(id)){
    ensureBlockedSentinel(nav);
    removeInjectedFeatures();
    if(nav)nav.setAttribute("data-imc-isolated-world",id);
    return;
  }
  document.querySelectorAll("["+SENTINEL_ATTR+"]").forEach(el=>el.remove());
  if(nav)nav.removeAttribute("data-imc-isolated-world");
  document.querySelectorAll("[data-imc-transfers-world]").forEach(el=>{if(id)el.dataset.imcTransfersWorld=id;});
  document.querySelectorAll("[data-imc-codex-world]").forEach(el=>{if(id)el.dataset.imcCodexWorld=id;});
}
document.addEventListener("click",function(event){
  const transfer=event.target&&event.target.closest?event.target.closest("[data-imc-transfers-world]"):null;
  const codex=event.target&&event.target.closest?event.target.closest("[data-imc-codex-world]"):null;
  if(!transfer&&!codex)return;
  const id=currentWorld();
  if(!id||BLOCKED_WORLDS.has(id)){
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if(transfer){
    const api=window.IMC_WORLD_FEATURES_BUILD53;
    if(!api||typeof api.openTransfers!=="function")return;
    event.preventDefault();
    event.stopImmediatePropagation();
    transfer.dataset.imcTransfersWorld=id;
    api.openTransfers(id);
    return;
  }
  const api=window.IMC_PLAYER_CODEX_BUILD53||window.IMC_PLAYER_CODEX_BUILD52;
  if(!api||typeof api.openWorld!=="function")return;
  event.preventDefault();
  event.stopImmediatePropagation();
  codex.dataset.imcCodexWorld=id;
  api.openWorld(id);
},true);
let timer=null;
const observer=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(sync,0);});
observer.observe(document.documentElement,{childList:true,subtree:true});
sync();
window.IMC_WORLD_CONTEXT_FIX={version:VERSION,currentWorld,blockedWorlds:BLOCKED_WORLDS};
})();

(function(){
"use strict";
const VERSION="3.0-gw001-results-scorers";
const TARGET_WORLD="GW001";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const STYLE_ID="imcGw001ResultScorersCssV3";
if(!window.supabase)return;
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){ }
const apiUrl=cfg&&cfg.url?cfg.url:URL;
const apiKey=cfg&&cfg.key?cfg.key:KEY;
const db=window.supabase.createClient(apiUrl,apiKey);
let scorerCachePromise=null;
let scorerMap=new Map();
function addCss(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
.nx-result-scorers{display:flex!important;flex-direction:column!important;gap:2px!important;margin-top:5px!important;max-width:100%!important;color:#68758b!important;font-size:8px!important;line-height:1.2!important;font-weight:800!important;visibility:visible!important;opacity:1!important}
.nx-league-result-team.home .nx-result-scorers{align-items:flex-start!important;text-align:left!important}
.nx-league-result-team.away .nx-result-scorers{align-items:flex-end!important;text-align:right!important}
.nx-result-scorer{display:block!important;max-width:100%!important;white-space:normal!important}
.nx-result-scorer b{color:#263b5d!important;font-size:8px!important;font-weight:950!important}
.nx-result-scorer em{color:var(--nx-league-accent,#163B8C)!important;font-style:normal!important;font-weight:950!important}
@media(max-width:520px){.nx-result-scorers{font-size:7.5px!important;gap:1px!important;margin-top:4px!important}.nx-result-scorer b{font-size:7.5px!important}}
`;
  document.head.appendChild(style);
}
function isoDate(value){
  const text=String(value||"").trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;
  const m=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return "";
  return m[3]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0");
}
function key(date,homeId,awayId,side){return [String(date||""),String(homeId||""),String(awayId||""),String(side||"")].join("|");}
function indexRows(rows){
  const next=new Map();
  (rows||[]).forEach(function(row){
    if(!row||!row.scorer_header)return;
    next.set(key(row.match_date,row.home_team_id,row.away_team_id,row.side),String(row.scorer_header));
  });
  scorerMap=next;
  return scorerMap;
}
async function directRest(){
  const endpoint=apiUrl.replace(/\/$/,"")+"/rest/v1/gw_match_scorer_headers_public?select=match_id,match_date,home_team_id,away_team_id,side,scorer_header&game_world_id=eq."+TARGET_WORLD;
  const response=await fetch(endpoint,{headers:{apikey:apiKey,Authorization:"Bearer "+apiKey,Accept:"application/json"},cache:"no-store"});
  if(!response.ok)throw new Error("REST "+response.status+" "+await response.text());
  return response.json();
}
async function loadScorers(){
  if(scorerCachePromise)return scorerCachePromise;
  scorerCachePromise=(async function(){
    try{
      const result=await db.from("gw_match_scorer_headers_public").select("match_id,match_date,home_team_id,away_team_id,side,scorer_header").eq("game_world_id",TARGET_WORLD);
      if(!result.error&&Array.isArray(result.data))return indexRows(result.data);
      throw result.error||new Error("Supabase query failed");
    }catch(firstError){
      console.warn("IMC scorer Supabase client failed, trying direct REST",firstError);
      const rows=await directRest();
      return indexRows(rows);
    }
  })().catch(function(error){scorerCachePromise=null;console.error("IMC GW001 scorer load failed",error);throw error;});
  return scorerCachePromise;
}
function cleanHeader(raw){
  let text=String(raw||"").replace(/\s+/g," ").trim();
  if(!text)return "";
  const firstNum=text.search(/\d/);
  if(firstNum<0)return text;
  const prefix=text.slice(0,firstNum).trim();
  const rest=text.slice(firstNum).trim();
  const tokens=prefix.split(/\s+/).filter(Boolean);
  if(tokens.length>1&&tokens.length%2===0){
    const half=tokens.length/2,left=tokens.slice(0,half).join(" "),right=tokens.slice(half).join(" ");
    const n=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
    if(n(left)===n(right))text=left+" "+rest;
  }
  return text;
}
function parseHeader(raw){
  const text=cleanHeader(raw);if(!text)return [];
  const re=/([^\d,]+?)\s+(\d{1,3}(?:\s+\((?:rig|autorete)\))?(?:\s*,\s*\d{1,3}(?:\s+\((?:rig|autorete)\))?)*)/giu;
  const out=[];let m;
  while((m=re.exec(text))){
    const name=String(m[1]||"").trim();
    const times=String(m[2]||"").split(",").map(function(item){const t=String(item||"").trim().match(/^(\d{1,3})(?:\s+\((rig|autorete)\))?$/i);return t?{minute:Number(t[1]),kind:String(t[2]||"").toLowerCase()}:null;}).filter(Boolean);
    if(name&&times.length)out.push({name,times});
  }
  return out;
}
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));}
function scorerMarkup(header){
  const parsed=parseHeader(header);if(!parsed.length)return "";
  return `<div class="nx-result-scorers" data-imc-scorers="1">${parsed.map(function(item){const minutes=item.times.map(function(time){return `${time.minute}'${time.kind==="rig"?' <em>(rig.)</em>':time.kind==="autorete"?' <em>(aut.)</em>':''}`;}).join(", ");return `<span class="nx-result-scorer"><b>${esc(item.name)}</b> ${minutes}</span>`;}).join("")}</div>`;
}
function rowInfo(row){
  const card=row&&row.closest(".nx-league-matchday-card");
  const time=card&&card.querySelector(".nx-unified-matchday-head time,.nx-league-matchday-head time");
  const home=row&&row.querySelector('.nx-league-result-team.home [data-match-entity-id]');
  const away=row&&row.querySelector('.nx-league-result-team.away [data-match-entity-id]');
  return {date:isoDate(time&&time.textContent),home,away};
}
function decorateRow(row){
  if(!row||!row.querySelector(".nx-league-score-pill strong:not(.is-vs)"))return false;
  const info=rowInfo(row);if(!info.date||!info.home||!info.away)return false;
  const homeId=info.home.getAttribute("data-match-entity-id")||"",awayId=info.away.getAttribute("data-match-entity-id")||"";
  let inserted=false;
  [["home",info.home],["away",info.away]].forEach(function(pair){
    const side=pair[0],button=pair[1],header=scorerMap.get(key(info.date,homeId,awayId,side));
    if(!header)return;
    const copy=button.closest(".nx-league-result-team")?.querySelector(".nx-league-result-copy");
    if(!copy||copy.querySelector('[data-imc-scorers="1"]'))return;
    const html=scorerMarkup(header);if(!html)return;
    copy.insertAdjacentHTML("beforeend",html);inserted=true;
  });
  return inserted;
}
async function decorate(){
  const rows=[...document.querySelectorAll(".nx-league-result-row")];if(!rows.length)return;
  addCss();
  try{await loadScorers();rows.forEach(decorateRow);}catch(error){console.error("IMC scorer decorate failed",error);}
}
let timer=null;
new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(decorate,80);}).observe(document.documentElement,{childList:true,subtree:true});
[0,300,800,1600,3000].forEach(ms=>setTimeout(decorate,ms));
window.IMC_RESULTS_SCORERS_GW001={version:VERSION,refresh:function(){scorerCachePromise=null;scorerMap=new Map();return decorate();}};
})();
