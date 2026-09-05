(function(){
"use strict";
const VERSION="4.0-build53-world-isolation-scorers";
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
const VERSION="4.0-gw001-results-scorer-panels";
const TARGET_WORLD="GW001";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const STYLE_ID="imcGw001ResultScorerPanelsV4";
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
.nx-league-result-row{position:relative}
.nx-scorers-panel{grid-column:1/-1;margin:0 4px 13px;padding:8px 12px 10px;border:1px solid #e0e6f0;border-radius:15px;background:#fbfcff;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
.nx-scorers-panel-title{display:block;margin:0 0 6px;color:var(--nx-league-accent,#163B8C);font-size:8px;line-height:1;font-weight:950;letter-spacing:.05em;text-align:center;text-transform:uppercase}
.nx-scorers-panel-grid{display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);gap:10px;align-items:center}
.nx-scorers-panel-divider{width:1px;align-self:stretch;background:#e3e8f1}
.nx-scorers-side{min-width:0;color:#1d2c47;font-size:8.5px;line-height:1.35;font-weight:800}
.nx-scorers-side.home{text-align:center}
.nx-scorers-side.away{text-align:center}
.nx-scorers-side b{font-weight:950;color:#11213d}
.nx-scorers-side em{font-style:normal;color:var(--nx-league-accent,#163B8C);font-weight:950}
.nx-scorers-side.is-empty{color:#8d98aa;font-weight:900}
@media(max-width:520px){
  .nx-scorers-panel{margin:0 4px 11px;padding:7px 8px 9px;border-radius:13px}
  .nx-scorers-panel-title{font-size:7px;margin-bottom:5px}
  .nx-scorers-panel-grid{gap:7px}
  .nx-scorers-side{font-size:7.4px;line-height:1.32}
}
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
  (rows||[]).forEach(function(row){if(row&&row.scorer_header)next.set(key(row.match_date,row.home_team_id,row.away_team_id,row.side),String(row.scorer_header));});
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
    const result=await db.from("gw_match_scorer_headers_public").select("match_id,match_date,home_team_id,away_team_id,side,scorer_header").eq("game_world_id",TARGET_WORLD);
    if(!result.error&&Array.isArray(result.data))return indexRows(result.data);
    return indexRows(await directRest());
  })().catch(async function(){
    scorerCachePromise=null;
    return indexRows(await directRest());
  });
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
function sideMarkup(header){
  const parsed=parseHeader(header);
  if(!parsed.length)return '<span class="nx-scorers-side is-empty">—</span>';
  const html=parsed.map(function(item){
    const minutes=item.times.map(function(t){return `${t.minute}'${t.kind==="rig"?' <em>(rig.)</em>':t.kind==="autorete"?' <em>(aut.)</em>':''}`;}).join(", ");
    return `<span><b>${esc(item.name)}</b> ${minutes}</span>`;
  }).join(", ");
  return html;
}
function decorateRow(row){
  if(!row||row.getAttribute("data-imc-scorer-panel")==="1")return false;
  if(!row.querySelector(".nx-league-score-pill strong:not(.is-vs)"))return false;
  const card=row.closest(".nx-league-matchday-card");
  const time=card&&card.querySelector(".nx-unified-matchday-head time,.nx-league-matchday-head time");
  const date=isoDate(time&&time.textContent);
  const home=row.querySelector('.nx-league-result-team.home [data-match-entity-id]');
  const away=row.querySelector('.nx-league-result-team.away [data-match-entity-id]');
  if(!date||!home||!away)return false;
  const homeId=home.getAttribute("data-match-entity-id")||"",awayId=away.getAttribute("data-match-entity-id")||"";
  const homeHeader=scorerMap.get(key(date,homeId,awayId,"home"))||"";
  const awayHeader=scorerMap.get(key(date,homeId,awayId,"away"))||"";
  if(!homeHeader&&!awayHeader)return false;
  const panel=document.createElement("div");
  panel.className="nx-scorers-panel";
  panel.innerHTML=`<span class="nx-scorers-panel-title">SCORERS</span><div class="nx-scorers-panel-grid"><div class="nx-scorers-side home">${sideMarkup(homeHeader)}</div><span class="nx-scorers-panel-divider"></span><div class="nx-scorers-side away">${sideMarkup(awayHeader)}</div></div>`;
  row.insertAdjacentElement("afterend",panel);
  row.setAttribute("data-imc-scorer-panel","1");
  return true;
}
async function decorate(){
  const rows=[...document.querySelectorAll(".nx-league-result-row")];
  if(!rows.length)return;
  addCss();
  try{await loadScorers();rows.forEach(decorateRow);}catch(error){console.error("IMC scorer panel failed",error);}
}
let timer=null;
new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(decorate,80);}).observe(document.documentElement,{childList:true,subtree:true});
[0,250,700,1400,2800].forEach(ms=>setTimeout(decorate,ms));
window.IMC_RESULTS_SCORER_PANELS_GW001={version:VERSION,refresh:function(){scorerCachePromise=null;scorerMap=new Map();document.querySelectorAll('.nx-scorers-panel').forEach(el=>el.remove());document.querySelectorAll('[data-imc-scorer-panel]').forEach(el=>el.removeAttribute('data-imc-scorer-panel'));return decorate();}};
})();
