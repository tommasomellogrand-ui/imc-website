(function(){
"use strict";
if(window.__IMC_ENTITIES_GW008__)return;
window.__IMC_ENTITIES_GW008__=true;

const VERSION="1.0.3";
const WORLD="GW008";
const WORLD_NAME="Gold 1";
const ROOT_FLAG="imc-entities-gw008";
const STYLE_ID="imcEntitiesGw008Css";
let cache={clubs:null,nations:null},observer=null,timer=null;
let view={tab:"clubs",detail:null};

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function pageRoot(){return document.getElementById("pageRoot");}
function db(){return window.__IMC_NEXUS_CLIENT__||null;}
function currentWorld(){const nodes=document.querySelectorAll("#openDrawerWorld strong,.nx-sport-world strong,.nx-world-header strong,.nx-world-header p");for(const node of nodes){const text=clean(node.textContent),m=text.match(/GW\d{3}/i);if(m)return m[0].toUpperCase();if(norm(text)===norm(WORLD_NAME))return WORLD;}return"";}
function navButton(section){return document.querySelector(`.nx-world-nav [data-world-section="${section}"]`);}
function entitiesActive(){const clubs=navButton("clubs"),national=navButton("national");return !!((clubs&&clubs.classList.contains("active"))||(national&&national.classList.contains("active")));}
function isOurPage(){const root=pageRoot();return !!(root&&root.querySelector(`:scope > [data-imc-entities-world="${WORLD}"]`));}
function worldData(row){return row&&row.worlds&&row.worlds[WORLD]?row.worlds[WORLD]:{};}
function isActive(row){return worldData(row).active===true;}
function isManaged(row){return worldData(row).managed===true;}
function todayIso(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
function assignmentActive(a,today){const start=clean(a&&a.start_date),end=clean(a&&a.end_date);return (!start||start<=today)&&(!end||end>=today);}
function imageSrc(item){return clean(item&&item.image)||"";}

function syncNav(){
  const clubs=navButton("clubs"),national=navButton("national");
  if(!clubs&&!national)return;
  const inWorld=currentWorld()===WORLD;
  if(inWorld&&national&&national.classList.contains("active")&&clubs)clubs.classList.add("active");
  if(clubs){
    const span=clubs.querySelector("span");
    if(inWorld){if(span)span.textContent="ENTITIES";clubs.setAttribute("aria-label","Entities");}
    else{if(span&&span.textContent==="ENTITIES")span.textContent="CLUBS";clubs.removeAttribute("aria-label");}
  }
  if(inWorld&&national)national.remove();
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
#pageRoot:has(> .${ROOT_FLAG}){padding-top:0!important}
.${ROOT_FLAG}{padding:0 0 30px;color:#0b1b3f;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.imc-ent8-hero{position:relative;width:100%;aspect-ratio:800/203;margin:4px 0 14px;overflow:hidden;border:1px solid rgba(203,160,54,.72);border-radius:17px;background:linear-gradient(104deg,#041833 0%,#08234b 52%,#061a38 100%);box-shadow:0 8px 20px rgba(15,29,58,.09);color:#fff}.imc-ent8-hero-copy{position:absolute;left:28px;top:50%;transform:translateY(-50%)}.imc-ent8-hero-copy span{display:inline-flex;min-height:17px;align-items:center;padding:0 7px;border:1px solid #d7ad48;border-radius:6px;color:#e9c56d;font-size:7px;font-weight:950;letter-spacing:.08em}.imc-ent8-hero-copy strong{display:block;margin-top:7px;font-size:22px;line-height:1;font-weight:950;letter-spacing:-.03em}.imc-ent8-hero-copy small{display:block;margin-top:6px;color:#e2b855;font-size:8px;font-weight:850}
.imc-ent8-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 0 12px;padding:4px;border:1px solid #dfe5ed;border-radius:14px;background:#f4f7fb}.imc-ent8-tab{min-height:38px;border:0;border-radius:10px;background:transparent;color:#68768a;font:900 9px/1 Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase}.imc-ent8-tab.is-active{background:#fff;color:#0a255d;box-shadow:0 3px 10px rgba(16,38,73,.09)}
.imc-ent8-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:0 0 14px}.imc-ent8-summary div{padding:10px 8px;border:1px solid #dfe5ed;border-radius:13px;background:#fff;text-align:center}.imc-ent8-summary strong{display:block;font-size:17px;font-weight:950;color:#0a255d}.imc-ent8-summary span{display:block;margin-top:3px;font-size:7px;font-weight:900;color:#7b8799;text-transform:uppercase}
.imc-ent8-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.imc-ent8-card{display:grid;grid-template-columns:46px minmax(0,1fr);gap:10px;align-items:center;min-height:72px;padding:10px;border:1px solid #dfe5ed;border-radius:15px;background:#fff;box-shadow:0 7px 16px rgba(22,42,78,.055);cursor:pointer}.imc-ent8-logo{width:46px;height:46px;display:grid;place-items:center;border-radius:13px;background:#f4f7fb;overflow:hidden}.imc-ent8-logo img{max-width:40px;max-height:40px;width:auto;height:auto;object-fit:contain}.imc-ent8-logo.is-nation{border-radius:50%;background:#fff}.imc-ent8-logo.is-nation img{width:42px;height:42px;max-width:42px;max-height:42px}.imc-ent8-card strong{display:block;color:#091c46;font-size:10px;font-weight:950;line-height:1.15}.imc-ent8-card small{display:block;margin-top:4px;color:#7b8799;font-size:6.5px;font-weight:850;line-height:1.25}.imc-ent8-managed{display:inline-flex!important;width:max-content;margin-top:5px!important;padding:3px 6px;border-radius:999px;background:#eaf8ef;color:#16743b!important;font-size:6px!important;font-weight:950!important;text-transform:uppercase}
.imc-ent8-detail-back{display:inline-flex;align-items:center;gap:6px;margin:0 0 10px;padding:0;border:0;background:transparent;color:#245aa5;font:900 9px/1 Inter,system-ui,sans-serif}.imc-ent8-detail{padding:18px;border:1px solid #dfe5ed;border-radius:17px;background:#fff;box-shadow:0 8px 20px rgba(22,42,78,.055)}.imc-ent8-detail-top{display:grid;grid-template-columns:74px minmax(0,1fr);gap:14px;align-items:center}.imc-ent8-detail-logo{width:74px;height:74px;display:grid;place-items:center;border-radius:18px;background:#f4f7fb;overflow:hidden}.imc-ent8-detail-logo img{max-width:64px;max-height:64px;object-fit:contain}.imc-ent8-detail-logo.is-nation{border-radius:50%;background:#fff}.imc-ent8-detail-logo.is-nation img{width:70px;height:70px}.imc-ent8-detail h2{margin:0;color:#091c46;font-size:20px;font-weight:950;letter-spacing:-.03em}.imc-ent8-detail p{margin:5px 0 0;color:#7b8799;font-size:8px;font-weight:850}.imc-ent8-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:16px}.imc-ent8-field{padding:10px;border:1px solid #edf1f5;border-radius:12px;background:#fafbfd}.imc-ent8-field span{display:block;color:#8b96a8;font-size:6px;font-weight:900;text-transform:uppercase}.imc-ent8-field strong{display:block;margin-top:4px;color:#0a255d;font-size:9px;font-weight:950;word-break:break-word}.imc-ent8-loading,.imc-ent8-error{padding:24px 16px;border:1px solid #e1e6ee;border-radius:17px;background:#fff;color:#798498;text-align:center;font-size:10px;font-weight:850}.imc-ent8-error{color:#9d3030}
@media(max-width:430px){.imc-ent8-list{grid-template-columns:1fr}.imc-ent8-hero-copy{left:22px}}
`;document.head.appendChild(s);
}

async function allRows(table,select){const c=db();if(!c)throw new Error("Client Supabase non disponibile");const out=[];let from=0;while(true){const r=await c.from(table).select(select||"*").range(from,from+999);if(r.error)throw r.error;const page=r.data||[];out.push(...page);if(page.length<1000)break;from+=1000;}return out;}

async function loadData(tab,force){
  const key=tab==="nations"?"nations":"clubs";
  if(cache[key]&&!force)return cache[key];
  const p=(async()=>{
    if(key==="clubs"){
      const [clubCodex,clubMaster]=await Promise.all([
        allRows("club_codex_global","id,n,i,worlds"),
        allRows("sm_clubs_master","sm_club_id,club_name,nexus_display_name,image_url,short_name")
      ]);
      const clubMasterMap=new Map(clubMaster.map(r=>[String(r.sm_club_id),r]));
      const clubs=clubCodex.filter(isActive).map(r=>{const master=clubMasterMap.get(String(r.id))||null,w=worldData(r);return {type:"club",id:r.id,name:clean(master&&master.nexus_display_name)||clean(r.n)||clean(master&&master.club_name)||`Club ${r.id}`,image:clean(master&&master.image_url),managed:isManaged(r),worldId:w.sm_world_club_id==null?"":w.sm_world_club_id,shortName:clean(master&&master.short_name),raw:r};}).sort((a,b)=>a.name.localeCompare(b.name,"it"));
      return {clubs,nations:[]};
    }
    const [nationCodex,nationGw,assignments]=await Promise.all([
      allRows("national_team_codex_global","id,n,i,worlds"),
      allRows("gw008_gw_national_teams","sm_world_national_club_id,nation_name"),
      allRows("gw_manager_assignments","game_world_id,nation_id,assignment_type,start_date,end_date")
    ]);
    const today=todayIso();
    const managedNationIds=new Set(assignments.filter(a=>clean(a.game_world_id).toUpperCase()===WORLD&&clean(a.assignment_type)==="national_team"&&a.nation_id!=null&&assignmentActive(a,today)).map(a=>String(a.nation_id)));
    const nationGwMap=new Map(nationGw.map(r=>[norm(r.nation_name),r]));
    const nations=nationCodex.filter(isActive).map(r=>{const gw=nationGwMap.get(norm(r.n))||null;return {type:"nation",id:r.id,name:clean(r.n)||`Nazionale ${r.id}`,image:clean(r.i),managed:managedNationIds.has(String(r.id)),worldId:gw&&gw.sm_world_national_club_id!=null?gw.sm_world_national_club_id:"",raw:r};}).sort((a,b)=>a.name.localeCompare(b.name,"it"));
    return {clubs:[],nations};
  })();
  cache[key]=p;
  try{return await p;}catch(e){cache[key]=null;throw e;}
}

function hero(){return `<div class="imc-ent8-hero"><div class="imc-ent8-hero-copy"><span>GW008</span><strong>ENTITIES</strong><small>Gold 1</small></div></div>`;}
function tabs(){return `<div class="imc-ent8-tabs" role="tablist"><button class="imc-ent8-tab ${view.tab==="clubs"?"is-active":""}" data-ent-tab="clubs">Clubs</button><button class="imc-ent8-tab ${view.tab==="nations"?"is-active":""}" data-ent-tab="nations">Nazionali</button></div>`;}
function logo(item,detail){const src=imageSrc(item),cls=item.type==="nation"?" is-nation":"",box=detail?"imc-ent8-detail-logo":"imc-ent8-logo";return `<span class="${box}${cls}">${src?`<img src="${esc(src)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}</span>`;}
function entityMeta(item){return item.type==="club"?`ID ${item.id} · World Club ID ${item.worldId||"-"}`:`ID ${item.id} · World National ID ${item.worldId||"-"}`;}
function card(item){return `<article class="imc-ent8-card" data-ent-open="${esc(item.type)}" data-ent-id="${esc(item.id)}">${logo(item,false)}<div><strong>${esc(item.name)}</strong><small>${esc(entityMeta(item))}</small>${item.managed?`<span class="imc-ent8-managed">Gestita IMC</span>`:""}</div></article>`;}
function renderList(data){
  const root=pageRoot();if(!root)return;
  const items=view.tab==="nations"?data.nations:data.clubs;
  const managed=items.filter(x=>x.managed).length;
  root.innerHTML=`<section class="${ROOT_FLAG}" data-imc-entities-world="${WORLD}">${hero()}${tabs()}<div class="imc-ent8-summary"><div><strong>${items.length}</strong><span>${view.tab==="nations"?"Nazionali":"Club"}</span></div><div><strong>${managed}</strong><span>Gestiti IMC</span></div></div><div class="imc-ent8-list">${items.map(card).join("")}</div></section>`;
}
function renderDetail(data,item){
  const root=pageRoot();if(!root)return;
  const typeLabel=item.type==="club"?"Club":"Nazionale";
  const worldLabel=item.type==="club"?"sm_world_club_id":"sm_world_national_club_id";
  root.innerHTML=`<section class="${ROOT_FLAG}" data-imc-entities-world="${WORLD}">${hero()}${tabs()}<button class="imc-ent8-detail-back" data-ent-back>‹ Torna alla lista</button><article class="imc-ent8-detail"><div class="imc-ent8-detail-top">${logo(item,true)}<div><h2>${esc(item.name)}</h2><p>${esc(typeLabel)} · GW008 · Gold 1</p>${item.managed?`<span class="imc-ent8-managed">Gestita IMC</span>`:""}</div></div><div class="imc-ent8-fields"><div class="imc-ent8-field"><span>ID globale</span><strong>${esc(item.id)}</strong></div><div class="imc-ent8-field"><span>${esc(worldLabel)}</span><strong>${esc(item.worldId||"-")}</strong></div></div></article></section>`;
}
function renderLoading(){installStyles();const root=pageRoot();if(root)root.innerHTML=`<section class="${ROOT_FLAG}" data-imc-entities-world="${WORLD}">${hero()}${tabs()}<div class="imc-ent8-loading">Caricamento entities…</div></section>`;}
function renderError(e){const root=pageRoot();if(root)root.innerHTML=`<section class="${ROOT_FLAG}" data-imc-entities-world="${WORLD}">${hero()}${tabs()}<div class="imc-ent8-error">${esc(e&&e.message||"Caricamento non riuscito")}</div></section>`;}
async function renderCurrent(force){
  if(currentWorld()!==WORLD||!entitiesActive())return;
  if(!isOurPage())renderLoading();
  try{const data=await loadData(view.tab,!!force);if(view.detail){const list=view.detail.type==="nation"?data.nations:data.clubs;const item=list.find(x=>String(x.id)===String(view.detail.id));if(item){renderDetail(data,item);return;}view.detail=null;}renderList(data);}catch(e){renderError(e);}
}
function renderIfNeeded(){syncNav();if(currentWorld()!==WORLD||!entitiesActive())return;if(isOurPage())return;view.detail=null;renderCurrent(false);}
function schedule(){clearTimeout(timer);timer=setTimeout(renderIfNeeded,55);}

function start(){
  installStyles();syncNav();
  document.addEventListener("click",function(e){
    const t=e.target&&e.target.closest?e.target.closest('[data-world-section="clubs"],[data-world-section="national"],[data-ent-tab],[data-ent-open],[data-ent-back]'):null;
    if(!t)return;
    if(t.matches('[data-world-section="clubs"]')){if(currentWorld()===WORLD){view.tab="clubs";view.detail=null;setTimeout(()=>renderCurrent(false),0);}return;}
    if(t.matches('[data-world-section="national"]')){if(currentWorld()===WORLD){view.tab="nations";view.detail=null;setTimeout(()=>renderCurrent(false),0);}return;}
    if(currentWorld()!==WORLD||!entitiesActive())return;
    if(t.hasAttribute("data-ent-tab")){e.preventDefault();e.stopPropagation();view.tab=t.getAttribute("data-ent-tab")==="nations"?"nations":"clubs";view.detail=null;renderCurrent(false);return;}
    if(t.hasAttribute("data-ent-open")){e.preventDefault();e.stopPropagation();view.detail={type:t.getAttribute("data-ent-open")==="nation"?"nation":"club",id:t.getAttribute("data-ent-id")};renderCurrent(false);return;}
    if(t.hasAttribute("data-ent-back")){e.preventDefault();e.stopPropagation();view.detail=null;renderCurrent(false);}
  },true);
  observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});schedule();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_ENTITIES_GW008={version:VERSION,refresh:()=>{cache={clubs:null,nations:null};renderCurrent(true);},load:()=>loadData(view.tab,false),openTab:(tab)=>{view.tab=tab==="nations"?"nations":"clubs";view.detail=null;renderCurrent(false);},clearCache:()=>{cache={clubs:null,nations:null};}};
})();
