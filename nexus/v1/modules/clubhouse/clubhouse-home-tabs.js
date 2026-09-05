(function(){
"use strict";
if(window.IMC_CLUBHOUSE_HOME_TABS)return;
const VERSION="1.3.0";
const mod=window.IMC_CLUBHOUSE;
if(!mod){window.IMC_CLUBHOUSE_HOME_TABS={version:VERSION};return}
let state={container:null,client:null,managerId:"",seq:0,season:null,availableSeasons:[]};
const c=v=>String(v==null?"":v).trim();
const e=v=>c(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
function rpc(action,args){return state.client.rpc("imc_nexus_gateway",{p_action:action,p_args:args}).then(r=>{if(r.error)throw r.error;return r.data||{}})}
function ensureTabs(){
  if(!state.container)return null;
  const canvas=state.container.querySelector(".ch-clubhouse-canvas");
  if(!canvas)return null;
  let box=canvas.querySelector("[data-ch-home-tabs]");
  if(box)return box;
  const preview=canvas.querySelector("[data-ch-next3]");
  const next10=canvas.querySelector("[data-ch-next10]");
  box=document.createElement("section");
  box.className="ch-home-tabs";
  box.setAttribute("data-ch-home-tabs","");
  box.innerHTML='<div class="ch-home-tabbar" role="tablist" aria-label="Nexus Home data"><button type="button" role="tab" aria-selected="true" data-ch-home-tab="overview">OVERVIEW</button><button type="button" role="tab" aria-selected="false" data-ch-home-tab="competitions">COMPETITIONS</button><button type="button" role="tab" aria-selected="false" data-ch-home-tab="h2h">H2H</button><button type="button" role="tab" aria-selected="false" data-ch-home-tab="performance">PERFORMANCE</button><button type="button" role="tab" aria-selected="false" data-ch-home-tab="schedule">SCHEDULE</button></div><div class="ch-home-tab-panel" role="tabpanel" data-ch-home-panel="overview"><div class="ch-home-season-tabs" data-ch-home-seasons></div><div class="ch-home-overview-grid" data-ch-home-overview><div class="ch-home-overview-state">Caricamento Overview…</div></div></div><div class="ch-home-tab-panel" role="tabpanel" data-ch-home-panel="competitions" hidden><div class="ch-home-season-tabs" data-ch-home-seasons></div><div class="ch-home-competitions-grid" data-ch-home-competitions><div class="ch-home-overview-state">Caricamento Competitions…</div></div></div><div class="ch-home-tab-panel" role="tabpanel" data-ch-home-panel="h2h" hidden><div class="ch-home-season-tabs" data-ch-home-seasons></div><div class="ch-home-h2h-list" data-ch-home-h2h><div class="ch-home-overview-state">Caricamento H2H…</div></div></div><div class="ch-home-tab-panel" role="tabpanel" data-ch-home-panel="performance" hidden><div class="ch-home-season-tabs" data-ch-home-seasons></div><div class="ch-home-performance-grid" data-ch-home-performance><div class="ch-home-overview-state">Caricamento Performance…</div></div></div><div class="ch-home-tab-panel" role="tabpanel" data-ch-home-panel="schedule" hidden><div data-ch-home-schedule-host></div></div>';
  if(preview)preview.insertAdjacentElement("afterend",box);
  else canvas.appendChild(box);
  const scheduleHost=box.querySelector("[data-ch-home-schedule-host]");
  if(next10&&scheduleHost)scheduleHost.appendChild(next10);
  return box;
}
function seasonButtons(){
  const box=ensureTabs(),hosts=box&&box.querySelectorAll("[data-ch-home-seasons]");
  if(!hosts||!hosts.length)return;
  const seasons=[...new Set(state.availableSeasons.map(Number).filter(x=>Number.isInteger(x)&&x>0))].sort((a,b)=>a-b);
  const html='<button type="button" data-ch-home-season=""'+(state.season==null?' class="is-active"':'')+'>ALL SEASONS</button>'+seasons.map(season=>'<button type="button" data-ch-home-season="'+season+'"'+(state.season===season?' class="is-active"':'')+'>SEASON '+season+'</button>').join("");
  hosts.forEach(host=>{host.innerHTML=html});
}
function metric(label,value,key){return '<article data-overview-metric="'+key+'"><span>'+label+'</span><strong>'+e(value)+'</strong></article>'}
function paintOverview(payload){
  const box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-overview]");
  if(!host)return;
  state.availableSeasons=Array.isArray(payload.availableSeasons)?payload.availableSeasons:[];
  seasonButtons();
  const totals=payload.totals||{};
  host.innerHTML=[
    metric("PARTITE",totals.played??0,"played"),
    metric("VITTORIE",totals.wins??0,"wins"),
    metric("PAREGGI",totals.draws??0,"draws"),
    metric("SCONFITTE",totals.losses??0,"losses"),
    metric("GOL FATTI",totals.goalsFor??0,"goalsFor"),
    metric("GOL SUBITI",totals.goalsAgainst??0,"goalsAgainst")
  ].join("");
}
async function loadOverview(){
  const seq=++state.seq,box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-overview]");
  if(!host||!state.client||!state.managerId)return;
  host.innerHTML='<div class="ch-home-overview-state">Caricamento Overview…</div>';
  try{
    const args={managerId:state.managerId};
    if(state.season!=null)args.season=state.season;
    const payload=await rpc("manager_home_overview",args);
    if(seq!==state.seq)return;
    paintOverview(payload);
  }catch(err){
    if(seq!==state.seq)return;
    host.innerHTML='<div class="ch-home-overview-state">'+e(err.message||"Overview non disponibile")+'</div>';
  }
}
function competitionCard(row){
  const stats=[
    ["PG",row.played??0],["V",row.wins??0],["N",row.draws??0],
    ["S",row.losses??0],["GF",row.goalsFor??0],["GS",row.goalsAgainst??0]
  ].map(item=>'<div><span>'+item[0]+'</span><strong>'+e(item[1])+'</strong></div>').join("");
  return '<article class="ch-home-competition-card"><header><span>'+e(row.gameWorld)+'</span><strong>'+e(row.competitionName||row.competitionKey)+'</strong></header><div class="ch-home-competition-stats">'+stats+'</div></article>';
}
function paintCompetitions(payload){
  const box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-competitions]");
  if(!host)return;
  state.availableSeasons=Array.isArray(payload.availableSeasons)?payload.availableSeasons:[];
  seasonButtons();
  const rows=Array.isArray(payload.rows)?payload.rows:[];
  host.innerHTML=rows.length?rows.map(competitionCard).join(""):'<div class="ch-home-overview-state">Nessuna competizione disponibile.</div>';
}
async function loadCompetitions(){
  const seq=++state.seq,box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-competitions]");
  if(!host||!state.client||!state.managerId)return;
  host.innerHTML='<div class="ch-home-overview-state">Caricamento Competitions…</div>';
  try{
    const args={managerId:state.managerId};
    if(state.season!=null)args.season=state.season;
    const payload=await rpc("manager_home_competitions",args);
    if(seq!==state.seq)return;
    paintCompetitions(payload);
  }catch(err){
    if(seq!==state.seq)return;
    host.innerHTML='<div class="ch-home-overview-state">'+e(err.message||"Competitions non disponibile")+'</div>';
  }
}
function h2hStats(row,className){
  const values=[
    ["PG",row.played??0],["V",row.wins??0],["N",row.draws??0],
    ["S",row.losses??0],["GF",row.goalsFor??0],["GS",row.goalsAgainst??0]
  ].map(item=>'<div><span>'+item[0]+'</span><strong>'+e(item[1])+'</strong></div>').join("");
  return '<div class="'+className+'">'+values+'</div>';
}
function h2hCompetition(row){
  return '<section class="ch-home-h2h-competition"><header><span>'+e(row.gameWorld)+'</span><strong>'+e(row.competitionName||row.competitionKey)+'</strong></header>'+h2hStats(row,"ch-home-h2h-competition-stats")+'</section>';
}
function h2hCard(row){
  const competitions=Array.isArray(row.competitions)?row.competitions:[];
  return '<article class="ch-home-h2h-card"><header class="ch-home-h2h-manager"><div><span>HEAD TO HEAD</span><strong>'+e(row.opponentName||row.opponentManagerId)+'</strong></div><b>'+e(row.opponentManagerId)+'</b></header>'+h2hStats(row,"ch-home-h2h-overall")+'<div class="ch-home-h2h-competitions">'+competitions.map(h2hCompetition).join("")+'</div></article>';
}
function paintH2H(payload){
  const box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-h2h]");
  if(!host)return;
  state.availableSeasons=Array.isArray(payload.availableSeasons)?payload.availableSeasons:[];
  seasonButtons();
  const rows=Array.isArray(payload.rows)?payload.rows:[];
  host.innerHTML=rows.length?rows.map(h2hCard).join(""):'<div class="ch-home-overview-state">Nessun H2H certificato disponibile.</div>';
}
async function loadH2H(){
  const seq=++state.seq,box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-h2h]");
  if(!host||!state.client||!state.managerId)return;
  host.innerHTML='<div class="ch-home-overview-state">Caricamento H2H…</div>';
  try{
    const args={managerId:state.managerId};
    if(state.season!=null)args.season=state.season;
    const payload=await rpc("manager_home_h2h",args);
    if(seq!==state.seq)return;
    paintH2H(payload);
  }catch(err){
    if(seq!==state.seq)return;
    host.innerHTML='<div class="ch-home-overview-state">'+e(err.message||"H2H non disponibile")+'</div>';
  }
}
function performanceValue(value,suffix){
  const number=Number(value);
  if(!Number.isFinite(number))return "—";
  const text=number.toLocaleString("it-IT",{minimumFractionDigits:0,maximumFractionDigits:2});
  return text+(suffix||"");
}
function performanceCard(label,mode,forValue,againstValue,suffix){
  return '<article class="ch-home-performance-card"><header><span>'+e(label)+'</span><b>'+e(mode)+'</b></header><div><section><small>TU</small><strong>'+e(performanceValue(forValue,suffix))+'</strong></section><i>VS</i><section><small>AVV</small><strong>'+e(performanceValue(againstValue,suffix))+'</strong></section></div></article>';
}
function paintPerformance(payload){
  const box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-performance]");
  if(!host)return;
  state.availableSeasons=Array.isArray(payload.availableSeasons)?payload.availableSeasons:[];
  seasonButtons();
  const averages=payload.averages||{},totals=payload.totals||{};
  host.innerHTML=[
    performanceCard("POSSESSO","MEDIA",averages.possessionFor,averages.possessionAgainst,"%"),
    performanceCard("TIRI","MEDIA",averages.shotsFor,averages.shotsAgainst,""),
    performanceCard("TIRI IN PORTA","MEDIA",averages.shotsOnTargetFor,averages.shotsOnTargetAgainst,""),
    performanceCard("CORNER","MEDIA",averages.cornersFor,averages.cornersAgainst,""),
    performanceCard("GIALLI","TOTALI",totals.yellowCardsFor,totals.yellowCardsAgainst,""),
    performanceCard("ROSSI","TOTALI",totals.redCardsFor,totals.redCardsAgainst,"")
  ].join("");
}
async function loadPerformance(){
  const seq=++state.seq,box=ensureTabs(),host=box&&box.querySelector("[data-ch-home-performance]");
  if(!host||!state.client||!state.managerId)return;
  host.innerHTML='<div class="ch-home-overview-state">Caricamento Performance…</div>';
  try{
    const args={managerId:state.managerId};
    if(state.season!=null)args.season=state.season;
    const payload=await rpc("manager_home_performance",args);
    if(seq!==state.seq)return;
    paintPerformance(payload);
  }catch(err){
    if(seq!==state.seq)return;
    host.innerHTML='<div class="ch-home-overview-state">'+e(err.message||"Performance non disponibile")+'</div>';
  }
}
function activeTab(){
  const box=ensureTabs(),selected=box&&box.querySelector('[data-ch-home-tab][aria-selected="true"]');
  return c(selected&&selected.getAttribute("data-ch-home-tab"))||"overview";
}
function selectTab(name){
  const box=ensureTabs();
  if(!box)return;
  box.querySelectorAll("[data-ch-home-tab]").forEach(button=>{
    const active=button.getAttribute("data-ch-home-tab")===name;
    button.setAttribute("aria-selected",String(active));
  });
  box.querySelectorAll("[data-ch-home-panel]").forEach(panel=>{
    panel.hidden=panel.getAttribute("data-ch-home-panel")!==name;
  });
  if(name==="competitions")loadCompetitions();
  else if(name==="h2h")loadH2H();
  else if(name==="performance")loadPerformance();
  else if(name==="overview")loadOverview();
}
function attach(o){
  state={container:o&&o.container||null,client:o&&o.client||null,managerId:c(o&&o.managerId),seq:0,season:null,availableSeasons:[]};
  if(!state.container||!state.client||!state.managerId)return;
  ensureTabs();
  selectTab("overview");
}
const previousMount=mod.mount,previousUnmount=mod.unmount;
mod.mount=async function(o){const result=await previousMount.call(mod,o);attach(o);return result};
mod.unmount=function(){state.seq++;state={container:null,client:null,managerId:"",seq:state.seq,season:null,availableSeasons:[]};return previousUnmount.call(mod)};
document.addEventListener("click",event=>{
  const tab=event.target.closest&&event.target.closest("[data-ch-home-tab]");
  if(tab&&state.container&&state.container.contains(tab)){selectTab(c(tab.getAttribute("data-ch-home-tab")));return}
  const seasonButton=event.target.closest&&event.target.closest("[data-ch-home-season]");
  if(seasonButton&&state.container&&state.container.contains(seasonButton)){
    const value=c(seasonButton.getAttribute("data-ch-home-season"));
    state.season=value?Number(value):null;
    seasonButtons();
    const tabName=activeTab();
    if(tabName==="competitions")loadCompetitions();
    else if(tabName==="h2h")loadH2H();
    else if(tabName==="performance")loadPerformance();
    else loadOverview();
  }
});
window.IMC_CLUBHOUSE_HOME_TABS={version:VERSION,attach};
})();