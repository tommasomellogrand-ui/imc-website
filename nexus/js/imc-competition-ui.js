(function(){
"use strict";

const VERSION="1.2.1-final-cards";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const cache=new Map();
const logoCache=new Map();
let currentKey="";
let timer=null;
let rootObserver=null;

let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.__IMC_NEXUS_CLIENT__||(window.supabase?window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY):null);
if(!db)return;

const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const valid=id=>/^GW(?:00[1-9]|010)$/.test(String(id||""));
const tbl=(id,s)=>String(id).toLowerCase()+s;
const img=v=>{v=String(v||"").trim();return v.startsWith("//")?"https:"+v:v;};

function world(){
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=String(guard.currentWorld()||"").toUpperCase();
    if(valid(id))return id;
  }
  const text=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong")?.textContent||"";
  const map={"road to history":"GW001","gold 558":"GW002","gold 557":"GW003","world league":"GW004","hall of famers":"GW005","master league world":"GW006","the four kingdoms":"GW007","gold 1":"GW008","kick off":"GW009","sensible soccer academy":"GW010"};
  return map[norm(text)]||"";
}

function installCss(){
  if(document.getElementById("imcCompetitionUiCss"))return;
  const style=document.createElement("style");
  style.id="imcCompetitionUiCss";
  style.textContent=`
#imcCompetitions .imcc-card{
  min-height:226px!important;
  padding:0!important;
  overflow:hidden!important;
  display:flex!important;
  flex-direction:column!important;
  justify-content:space-between!important;
  align-items:stretch!important;
  background:#fff!important;
  border:1px solid #dce3ec!important;
  border-radius:18px!important;
  box-shadow:0 5px 16px rgba(18,39,73,.045)!important;
  text-align:center!important;
}
#imcCompetitions .imc-ui-comp-main{
  position:relative;
  min-height:180px;
  padding:14px 10px 10px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-end;
  overflow:hidden;
}
#imcCompetitions .imc-ui-comp-main:before,
#imcCompetitions .imc-ui-comp-main:after{
  content:"";
  position:absolute;
  top:35px;
  width:50px;
  height:88px;
  opacity:.10;
  border:3px solid #173766;
  border-top-color:transparent;
  border-bottom-color:transparent;
  border-radius:50%;
  pointer-events:none;
}
#imcCompetitions .imc-ui-comp-main:before{left:19px;transform:rotate(-16deg)}
#imcCompetitions .imc-ui-comp-main:after{right:19px;transform:rotate(16deg)}
#imcCompetitions .imc-ui-comp-art{
  position:relative;
  z-index:1;
  width:112px;
  height:112px;
  display:flex;
  align-items:center;
  justify-content:center;
  margin:0 auto 4px;
}
#imcCompetitions .imc-ui-comp-art img{
  display:block;
  max-width:100%;
  max-height:100%;
  object-fit:contain;
  filter:grayscale(1) saturate(.12) contrast(.90) brightness(1.08);
  opacity:.88;
}
#imcCompetitions .imc-ui-comp-art .imc-ui-comp-fallback{
  display:flex;
  align-items:center;
  justify-content:center;
  width:86px;
  height:86px;
  border:2px solid #d4dce8;
  border-radius:50%;
  color:#7a8799;
  font-size:42px;
  background:linear-gradient(145deg,#fff,#f4f6f9);
}
#imcCompetitions .imc-ui-comp-name{
  position:relative;
  z-index:1;
  display:block;
  width:100%;
  margin-top:2px;
  color:#2f80ed;
  font-family:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:18px;
  line-height:1.05;
  font-weight:800;
  letter-spacing:-.025em;
  text-align:center;
  overflow-wrap:anywhere;
}
#imcCompetitions .imc-ui-comp-footer{
  min-height:39px;
  padding:8px 9px;
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);
  align-items:center;
  gap:6px;
  border-top:1px solid #e7ebf1;
  background:#fff;
  color:#64738a;
  font-family:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:7.5px;
  font-weight:700;
}
#imcCompetitions .imc-ui-comp-meta{
  min-width:0;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:ellipsis;
}
#imcCompetitions .imc-ui-comp-meta b{
  flex:0 0 auto;
  color:#173766;
  font-size:10px;
  line-height:1;
}
#imcCompetitions .imc-ui-comp-meta span{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
#imcCompetitionDetail .imcc-dtabs{grid-template-columns:repeat(4,minmax(0,1fr))!important}
#imcCompetitionDetail .imcc-dtabs .imcc-extra-tab{font-family:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#imcCompetitionDetail .imcc-team.imc-ui-team{display:flex!important;align-items:center;gap:7px;min-width:0}
#imcCompetitionDetail .imcc-team.imc-ui-team.aw{flex-direction:row-reverse;justify-content:flex-start}
#imcCompetitionDetail .imcc-team.imc-ui-team .imc-ui-team-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#imcCompetitionDetail .imc-ui-team-logo{display:flex;align-items:center;justify-content:center;flex:0 0 28px;width:28px;height:28px;border:1px solid #e1e6ed;border-radius:50%;overflow:hidden;background:#fff;color:#6f7d91;font-size:7px;font-weight:800}
#imcCompetitionDetail .imc-ui-team-logo img{width:100%;height:100%;object-fit:contain}
#imcCompetitionDetail .imc-ui-team-logo b{display:none;width:100%;height:100%;align-items:center;justify-content:center}

#imcCompetitionDetail .imcc-round-card.is-results.imc-ui-final-card{
  position:relative;
  isolation:isolate;
  border:2px solid #e3ad2f!important;
  background:linear-gradient(180deg,#fff 0%,#fffdf7 100%)!important;
  box-shadow:0 9px 24px rgba(174,126,22,.16),0 0 0 1px rgba(227,173,47,.06)!important;
}
#imcCompetitionDetail .imcc-round-card.is-results.imc-ui-final-card:before,
#imcCompetitionDetail .imcc-round-card.is-results.imc-ui-final-card:after{
  content:"";
  position:absolute;
  z-index:0;
  pointer-events:none;
}
#imcCompetitionDetail .imcc-round-card.is-results.imc-ui-final-card:before{
  inset:0;
  background:
    radial-gradient(circle at 6% 18%,rgba(227,173,47,.30) 0 2px,transparent 2.6px),
    radial-gradient(circle at 94% 22%,rgba(227,173,47,.24) 0 2px,transparent 2.6px),
    radial-gradient(circle at 10% 82%,rgba(227,173,47,.20) 0 1.5px,transparent 2px),
    radial-gradient(circle at 90% 78%,rgba(227,173,47,.26) 0 1.5px,transparent 2px),
    radial-gradient(circle at 22% 10%,rgba(227,173,47,.15) 0 1px,transparent 1.7px),
    radial-gradient(circle at 78% 88%,rgba(227,173,47,.16) 0 1px,transparent 1.7px);
  opacity:.78;
}
#imcCompetitionDetail .imcc-round-card.is-results.imc-ui-final-card:after{
  right:-34px;
  bottom:-44px;
  width:130px;
  height:130px;
  border:1px solid rgba(227,173,47,.15);
  border-radius:50%;
  box-shadow:0 0 0 18px rgba(227,173,47,.035),0 0 0 38px rgba(227,173,47,.018);
}
#imcCompetitionDetail .imc-ui-final-card .imcc-round-head,
#imcCompetitionDetail .imc-ui-final-card .imcc-games{
  position:relative;
  z-index:1;
}
#imcCompetitionDetail .imc-ui-final-card .imcc-round-head{
  min-height:54px;
  padding-left:101px!important;
  border-bottom:1px solid rgba(227,173,47,.28)!important;
  background:linear-gradient(90deg,rgba(255,251,239,.96),#fff)!important;
}
#imcCompetitionDetail .imc-ui-final-card .imcc-cal{display:none!important}
#imcCompetitionDetail .imc-ui-final-card .imcc-round-title strong{
  color:#0b1833!important;
  font-weight:850!important;
}
#imcCompetitionDetail .imc-ui-final-card .imcc-round-date{
  color:#6b7483!important;
  font-weight:750!important;
}
#imcCompetitionDetail .imc-ui-final-ribbon{
  position:absolute;
  z-index:2;
  top:0;
  bottom:0;
  left:0;
  width:88px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  padding-right:7px;
  clip-path:polygon(0 0,100% 0,83% 100%,0 100%);
  background:linear-gradient(135deg,#102a5d,#173b75);
  color:#f0bd45;
  font-size:8px;
  font-weight:900;
  letter-spacing:.11em;
  text-transform:uppercase;
}
#imcCompetitionDetail .imc-ui-final-ribbon b{
  font-size:13px;
  line-height:1;
}
#imcCompetitionDetail .imc-ui-final-card .imcc-score{
  color:#102a5d!important;
  font-size:17px!important;
  font-weight:900!important;
}
#imcCompetitionDetail .imc-ui-final-card .imcc-pen{
  color:#9b7424!important;
  font-weight:750!important;
}
#imcCompetitionDetail .imc-ui-final-card .imcc-game{
  border-top-color:rgba(227,173,47,.20)!important;
}

@media(max-width:390px){
  #imcCompetitions .imcc-card{min-height:210px!important}
  #imcCompetitions .imc-ui-comp-main{min-height:167px;padding:12px 8px 8px}
  #imcCompetitions .imc-ui-comp-art{width:101px;height:101px}
  #imcCompetitions .imc-ui-comp-name{font-size:16px}
  #imcCompetitions .imc-ui-comp-main:before,#imcCompetitions .imc-ui-comp-main:after{width:44px;height:78px;top:34px}
  #imcCompetitions .imc-ui-comp-main:before{left:13px}
  #imcCompetitions .imc-ui-comp-main:after{right:13px}
  #imcCompetitionDetail .imc-ui-team-logo{width:25px;height:25px;flex-basis:25px}
  #imcCompetitionDetail .imcc-team.imc-ui-team{gap:5px}
  #imcCompetitionDetail .imc-ui-final-card .imcc-round-head{padding-left:91px!important}
  #imcCompetitionDetail .imc-ui-final-ribbon{width:79px;font-size:7px}
  #imcCompetitionDetail .imc-ui-final-ribbon b{font-size:12px}
}
`;
  document.head.appendChild(style);
}

async function all(table,select){
  const out=[];
  for(let from=0;;from+=1000){
    const r=await db.from(table).select(select).range(from,from+999);
    if(r.error)throw r.error;
    const rows=r.data||[];
    out.push(...rows);
    if(rows.length<1000)break;
  }
  return out;
}

async function loadWorld(id){
  if(cache.has(id))return cache.get(id);
  const [competitions,metaResult]=await Promise.all([
    all(tbl(id,"_gw_competitions"),"*"),
    db.from("imc_game_worlds").select("game_world_id,imc_season").eq("game_world_id",id).maybeSingle()
  ]);
  if(metaResult.error)throw metaResult.error;

  const names=new Map();
  const rowsByKey=new Map();
  competitions.forEach(row=>{
    const key=String(row.competition_key||"");
    const view=String(row["Nexus View"]||"").trim();
    if(key){
      rowsByKey.set(key,row);
      if(view)names.set(key,view);
    }
  });

  const data={
    names,
    rowsByKey,
    season:metaResult.data&&metaResult.data.imc_season!=null?metaResult.data.imc_season:null
  };
  cache.set(id,data);
  return data;
}

async function loadLogos(id){
  if(logoCache.has(id))return logoCache.get(id);
  const teams=await all(tbl(id,"_gw_teams"),"sm_world_club_id,sm_club_id,club_name");
  const ids=[...new Set(teams.map(t=>t.sm_club_id).filter(v=>v!=null).map(String))];
  const masters=[];
  for(let i=0;i<ids.length;i+=150){
    const r=await db.from("sm_clubs_master")
      .select("sm_club_id,club_name,alias,nexus_display_name,image_filename,image_url")
      .in("sm_club_id",ids.slice(i,i+150));
    if(r.error)throw r.error;
    masters.push(...(r.data||[]));
  }

  const masterById=new Map(masters.map(row=>[String(row.sm_club_id),row]));
  const logos=new Map();
  teams.forEach(team=>{
    const master=masterById.get(String(team.sm_club_id||""))||{};
    const url=img(master.image_url)||(master.image_filename?"assets/clubs/"+String(master.image_filename).trim():"");
    if(!url)return;
    [team.club_name,master.club_name,master.alias,master.nexus_display_name].filter(Boolean).forEach(name=>logos.set(norm(name),url));
  });
  logoCache.set(id,logos);
  return logos;
}

function initials(name){
  return String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";
}

function logoMarkup(name,url){
  const init=initials(name);
  if(!url)return `<span class="imc-ui-team-logo"><b style="display:flex">${esc(init)}</b></span>`;
  return `<span class="imc-ui-team-logo"><img src="${esc(url)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><b>${esc(init)}</b></span>`;
}

function trophyPath(row){
  const name=norm(row&&row["Nexus View"]);
  if(name==="league div 1")return "assets/trophies/division-one.png";
  if(name==="league div 2")return "assets/trophies/division-two.png";
  if(name==="league div 3")return "assets/trophies/division-three.png";
  if(name==="league div 4")return "assets/trophies/division-four.png";
  if(name==="league div 5")return "assets/trophies/division-five.png";
  if(name==="national cup")return "assets/trophies/national-cup.png";
  if(name==="league cup")return "assets/trophies/league-cup.png";
  if(name==="charity shield")return "assets/trophies/charity-shield.png";
  if(name==="smfa champions")return "assets/trophies/imc-champions-v27.png";
  if(name==="smfa shield")return "assets/trophies/imc-shield.png";
  if(name==="smfa super cup")return "assets/trophies/imc-super-cup.png";
  if(name==="world cup qualifier")return "assets/trophies/world-cup-qualifying.png";
  if(name==="world cup")return "assets/trophies/world-cup.png";
  return "";
}

function formatLabel(row){
  const action=String(row&&row.sm_action||"").trim().toLowerCase();
  if(action==="league")return "League";
  if(action==="friendly")return "Friendly";
  if(action==="charityshield"||action==="supercup")return "One-off";
  if(action==="interqualifier")return "Qualifier";
  if(action==="worldcup")return "Tournament";
  return "Knockout";
}

function trophyMarkup(row){
  const path=trophyPath(row);
  if(!path)return `<span class="imc-ui-comp-fallback">♛</span>`;
  return `<img src="${esc(path)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="imc-ui-comp-fallback" style="display:none">♛</span>`;
}

function decorateIndex(data){
  document.querySelectorAll("#imcCompetitions [data-key]").forEach(card=>{
    const key=String(card.getAttribute("data-key")||"");
    const row=data.rowsByKey.get(key);
    if(!row)return;
    const name=data.names.get(key)||String(row.sm_competition_name||key);
    const season=data.season==null?"Season":"Season "+data.season;
    card.innerHTML=`<span class="imc-ui-comp-main"><span class="imc-ui-comp-art">${trophyMarkup(row)}</span><strong class="imc-ui-comp-name">${esc(name)}</strong></span><span class="imc-ui-comp-footer"><span class="imc-ui-comp-meta"><b>▣</b><span>${esc(season)}</span></span><span class="imc-ui-comp-meta"><b>♜</b><span>${esc(formatLabel(row))}</span></span></span>`;
  });
}

function applyCompetitionNames(data){
  document.querySelectorAll("#imcCompetitions [data-key]").forEach(card=>{
    const key=String(card.getAttribute("data-key")||"");
    const name=data.names.get(key);
    const title=card.querySelector(".imc-ui-comp-name")||card.querySelector("strong");
    if(name&&title)title.textContent=name;
  });

  if(currentKey){
    const name=data.names.get(currentKey);
    if(name){
      const top=document.querySelector("#imcCompetitionDetail .imcc-title strong");
      const hero=document.querySelector("#imcCompetitionDetail .imcc-hero h1");
      if(top)top.textContent=name;
      if(hero)hero.textContent=name;
    }
  }
}

function applyTabs(){
  const tabs=document.querySelector("#imcCompetitionDetail .imcc-dtabs");
  if(!tabs)return;
  const schedule=tabs.querySelector('[data-tab="schedule"]');
  if(!tabs.querySelector('[data-imc-extra-tab="table"]')){
    const table=document.createElement("button");
    table.type="button";
    table.className="imcc-extra-tab";
    table.setAttribute("data-imc-extra-tab","table");
    table.textContent="TABLE";
    if(schedule)tabs.insertBefore(table,schedule);else tabs.appendChild(table);
  }
  if(!tabs.querySelector('[data-imc-extra-tab="trophy-room"]')){
    const trophy=document.createElement("button");
    trophy.type="button";
    trophy.className="imcc-extra-tab";
    trophy.setAttribute("data-imc-extra-tab","trophy-room");
    trophy.textContent="TROPHY ROOM";
    tabs.appendChild(trophy);
  }
}

function isFinalLabel(value){
  return /(^|\s)finale$/i.test(String(value||"").trim());
}

function applyFinalCards(){
  document.querySelectorAll("#imcCompetitionDetail .imcc-round-card.is-results").forEach(card=>{
    const title=card.querySelector(".imcc-round-title strong");
    const label=String(title&&title.textContent||"").trim();
    if(!isFinalLabel(label))return;
    card.classList.add("imc-ui-final-card");
    const head=card.querySelector(".imcc-round-head");
    if(head&&!head.querySelector(".imc-ui-final-ribbon")){
      const ribbon=document.createElement("span");
      ribbon.className="imc-ui-final-ribbon";
      ribbon.innerHTML='<b>♛</b><span>FINAL</span>';
      head.appendChild(ribbon);
    }
  });
}

function applyLogos(logos){
  document.querySelectorAll("#imcCompetitionDetail .imcc-game .imcc-team").forEach(team=>{
    if(team.getAttribute("data-imc-logo-ready")==="1")return;
    const name=String(team.textContent||"").trim();
    if(!name)return;
    const url=logos.get(norm(name))||"";
    team.classList.add("imc-ui-team");
    team.setAttribute("data-imc-logo-ready","1");
    team.innerHTML=logoMarkup(name,url)+`<span class="imc-ui-team-name">${esc(name)}</span>`;
  });
}

async function enhance(){
  const id=world();
  if(!valid(id))return;
  installCss();
  try{
    const data=await loadWorld(id);
    if(world()!==id)return;
    decorateIndex(data);
    applyCompetitionNames(data);
    applyTabs();
    applyFinalCards();
    try{
      const logos=await loadLogos(id);
      if(world()===id)applyLogos(logos);
    }catch(error){
      console.error("IMC Competition logos",id,error);
    }
  }catch(error){
    console.error("IMC Competition UI",id,error);
  }
}

function scheduleEnhance(){
  clearTimeout(timer);
  timer=setTimeout(enhance,50);
}

document.addEventListener("click",function(event){
  const card=event.target&&event.target.closest?event.target.closest("#imcCompetitions [data-key]"):null;
  if(card)currentKey=String(card.getAttribute("data-key")||"");

  const back=event.target&&event.target.closest?event.target.closest("#imcCompetitionDetail [data-back]"):null;
  if(back)currentKey="";

  const extra=event.target&&event.target.closest?event.target.closest("#imcCompetitionDetail [data-imc-extra-tab]"):null;
  if(extra){
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const relevant=event.target&&event.target.closest?event.target.closest('.nx-world-nav [data-world-section="competitions"],#imcCompetitions [data-cat],#imcCompetitionDetail [data-tab],#imcCompetitions [data-key]'):null;
  if(relevant)scheduleEnhance();
},true);

document.addEventListener("input",function(event){
  if(event.target&&event.target.id==="imccQ")scheduleEnhance();
},true);

function attach(){
  installCss();
  const root=document.getElementById("pageRoot");
  if(root&&!rootObserver){
    rootObserver=new MutationObserver(scheduleEnhance);
    rootObserver.observe(root,{childList:true});
  }
  scheduleEnhance();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
else attach();
window.addEventListener("pageshow",scheduleEnhance);

window.IMC_COMPETITION_UI={version:VERSION,refresh:enhance,clearCache:()=>{cache.clear();logoCache.clear();}};
})();