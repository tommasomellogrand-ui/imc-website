(function(){
"use strict";
if(window.IMC_CLUBHOUSE_WORLDS_DIRECTORY)return;
const VERSION="2.1.0";
const WORLDS=[["GW001","Road To History"],["GW002","Gold 558"],["GW003","Gold 557"],["GW004","World League"],["GW005","Hall Of Famers"],["GW006","Master League World"],["GW007","The Four Kingdoms"],["GW008","Gold 1"],["GW009","Kick Off"]];
let loading=false,loaded=false,selectedWorld="",touchStartX=null,scheduled=false;
const managersByWorld=new Map();
const clean=v=>String(v==null?"":v).trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const worldIndex=id=>WORLDS.findIndex(([worldId])=>worldId===id);

function shell(){
  const panel=document.querySelector(".clubhouse [data-ch-feed-panel]");
  if(!panel)return null;
  let section=panel.querySelector("[data-ch-worlds-directory]");
  if(section)return section;
  section=document.createElement("section");
  section.className="ch-worlds-directory";
  section.setAttribute("data-ch-worlds-directory","");
  section.setAttribute("data-version",VERSION);
  section.innerHTML=`<div data-worlds-overview><header class="ch-worlds-directory-head"><span>IMC COMMUNITY</span><h2>OUR GAME WORLDS</h2><p>I 9 mondi di gioco della community IMC.</p></header><div class="ch-worlds-overview-grid">${WORLDS.map(([id,name])=>`<button type="button" class="ch-world-overview-tile" data-world-open="${id}"><small>${id}</small><strong>${esc(name)}</strong><span data-world-count="${id}">—</span></button>`).join("")}</div></div><div class="ch-world-view" data-world-view hidden><nav class="ch-world-view-nav"><button type="button" data-world-prev aria-label="Game World precedente">‹</button><button type="button" data-world-all>ALL WORLDS</button><button type="button" data-world-next aria-label="Game World successivo">›</button></nav><header class="ch-world-view-hero" data-world-swipe><small data-world-view-id>GW001</small><h2 data-world-view-name>Road To History</h2><span data-world-view-count>—</span></header><section class="ch-world-view-managers"><div class="ch-world-view-managers-head"><span>IMC MANAGERS</span><b data-world-view-manager-count>—</b></div><div data-world-view-manager-list><div class="ch-world-directory-loading">Caricamento manager…</div></div></section></div>`;
  const head=panel.querySelector(".ch-feed-head");
  if(head)head.insertAdjacentElement("beforebegin",section);else panel.prepend(section);
  return section;
}

function activeManagers(rows){
  const managers=[];
  for(const row of Array.isArray(rows)?rows:[]){
    const teams=[...new Set((Array.isArray(row.assignments)?row.assignments:[])
      .filter(a=>clean(a.assignment_type).toLowerCase()==="club"&&a.is_active===true&&clean(a.team_name))
      .map(a=>clean(a.team_name)))];
    if(!teams.length)continue;
    managers.push({id:clean(row.manager_id),name:clean(row.full_name||row.manager_id),teams});
  }
  return managers.sort((a,b)=>a.name.localeCompare(b.name,"it",{sensitivity:"base"}));
}

function countLabel(count){return `${count} MANAGER IMC`}
function updateCounts(section){
  for(const [id] of WORLDS){
    const node=section.querySelector(`[data-world-count="${id}"]`),data=managersByWorld.get(id);
    if(node)node.textContent=data&&data.error?"—":data?countLabel(data.managers.length):"—";
  }
}

function managerRows(data){
  if(!data||data.error)return '<div class="ch-world-directory-empty">Dati non disponibili.</div>';
  if(!data.managers.length)return '<div class="ch-world-directory-empty">Nessun manager IMC attualmente assegnato.</div>';
  return `<div class="ch-world-manager-list">${data.managers.map(manager=>`<div class="ch-world-manager-row"><span><strong>${esc(manager.name)}</strong><small>${esc(manager.id)}</small></span><b>${esc(manager.teams.join(" · "))}</b></div>`).join("")}</div>`;
}

function feedWorld(card){return clean(card.getAttribute("data-game-world")).toUpperCase()}
function applyFeedView(){
  const root=document.querySelector(".clubhouse"),list=root&&root.querySelector("[data-ch-feed-list]");
  if(!root||!list)return;
  const cards=[...list.querySelectorAll(".ch-feed-card[data-fixture-id]")];
  let visible=0;
  for(const card of cards){
    const show=selectedWorld?feedWorld(card)===selectedWorld:visible<10;
    card.hidden=!show;
    if(show)visible++;
  }
  let empty=list.querySelector("[data-world-view-empty]");
  if(selectedWorld&&cards.length&&visible===0){
    if(!empty){empty=document.createElement("div");empty.className="ch-feed-empty";empty.setAttribute("data-world-view-empty","");list.prepend(empty)}
    empty.textContent=`Nessuna news disponibile per ${selectedWorld}.`;empty.hidden=false;
  }else if(empty)empty.hidden=true;
  const title=root.querySelector(".ch-feed-head h2"),subtitle=root.querySelector(".ch-feed-head small");
  if(title)title.innerHTML=selectedWorld?`FEED <b>${esc(selectedWorld)}</b>`:"LAST TEN NEWS <b>FROM THE FEED</b>";
  if(subtitle)subtitle.textContent=selectedWorld?`Tutte le notizie di ${selectedWorld}`:"Le 10 notizie più recenti da tutti i Game World IMC";
}

function showOverview(){
  selectedWorld="";
  const section=shell();if(!section)return;
  section.querySelector("[data-worlds-overview]").hidden=false;
  section.querySelector("[data-world-view]").hidden=true;
  applyFeedView();
  section.scrollIntoView({behavior:"smooth",block:"start"});
}

function showWorld(id,scroll=true){
  if(worldIndex(id)<0)return;
  selectedWorld=id;
  const section=shell(),world=WORLDS[worldIndex(id)],data=managersByWorld.get(id);
  if(!section)return;
  section.querySelector("[data-worlds-overview]").hidden=true;
  section.querySelector("[data-world-view]").hidden=false;
  section.querySelector("[data-world-view-id]").textContent=world[0];
  section.querySelector("[data-world-view-name]").textContent=world[1];
  section.querySelector("[data-world-view-count]").textContent=data&&!data.error?countLabel(data.managers.length):"—";
  section.querySelector("[data-world-view-manager-count]").textContent=data&&!data.error?String(data.managers.length):"—";
  section.querySelector("[data-world-view-manager-list]").innerHTML=managerRows(data);
  applyFeedView();
  if(scroll)section.scrollIntoView({behavior:"smooth",block:"start"});
}

function move(step){
  if(!selectedWorld)return;
  const index=worldIndex(selectedWorld),next=(index+step+WORLDS.length)%WORLDS.length;
  showWorld(WORLDS[next][0],false);
}

async function load(){
  if(loading||loaded)return;
  const root=document.querySelector(".clubhouse.ch-clubhouse-feed-view"),section=shell(),client=window.__IMC_NEXUS_CLIENT__;
  if(!root||!section||!client)return;
  loading=true;
  try{
    const results=await Promise.allSettled(WORLDS.map(([id])=>client.rpc("imc_nexus_gateway",{p_action:"managers",p_args:{gameWorld:id}})));
    results.forEach((result,index)=>{
      const id=WORLDS[index][0];
      if(result.status!=="fulfilled"||result.value.error){managersByWorld.set(id,{error:true,managers:[]});return}
      managersByWorld.set(id,{error:false,managers:activeManagers(result.value.data&&result.value.data.rows)});
    });
    loaded=true;updateCounts(section);if(selectedWorld)showWorld(selectedWorld,false);
  }finally{loading=false}
}

function ensure(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;shell();load();applyFeedView()});
}
document.addEventListener("click",event=>{
  const open=event.target.closest&&event.target.closest("[data-world-open]");
  if(open){showWorld(clean(open.getAttribute("data-world-open")).toUpperCase());return}
  if(event.target.closest&&event.target.closest("[data-world-all]")){showOverview();return}
  if(event.target.closest&&event.target.closest("[data-world-prev]")){move(-1);return}
  if(event.target.closest&&event.target.closest("[data-world-next]")){move(1)}
});
document.addEventListener("touchstart",event=>{if(event.target.closest&&event.target.closest("[data-world-swipe]"))touchStartX=event.changedTouches[0].clientX},{passive:true});
document.addEventListener("touchend",event=>{if(touchStartX==null||!(event.target.closest&&event.target.closest("[data-world-swipe]")))return;const delta=event.changedTouches[0].clientX-touchStartX;touchStartX=null;if(Math.abs(delta)>45)move(delta<0?1:-1)},{passive:true});
new MutationObserver(ensure).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
window.IMC_CLUBHOUSE_WORLDS_DIRECTORY={version:VERSION,load,showOverview,showWorld};
})();
