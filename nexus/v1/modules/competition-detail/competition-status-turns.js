(function(){
"use strict";
if(window.IMC_COMPETITION_STATUS_TURNS)return;

const VERSION="2.1.0";
let observer=null,host=null,status=null,meta=null,isLeague=false,totalTurns=0,matchdayByLabel=new Map();

const c=v=>String(v==null?"":v).trim();
function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
function fmtDate(v){
  const q=c(v);
  if(!q)return"";
  const d=new Date(q.length===10?q+"T12:00:00":q);
  if(isNaN(d))return q.toUpperCase();
  return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
}
function rpc(client,action,args){
  return client.rpc("imc_nexus_gateway",{p_action:action,p_args:args}).then(r=>{
    if(r.error)throw r.error;
    return r.data||{};
  });
}
function distinctDates(rows,pick){
  return [...new Set((rows||[]).map(x=>c(pick(x))).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function buildMatchdayMap(results,schedule){
  matchdayByLabel=new Map();
  if(!isLeague||!totalTurns)return;

  const resultDates=distinctDates(results,x=>x.source_page_date||x.match_date);
  const playedSet=new Set(resultDates);
  const scheduleDates=distinctDates(schedule,x=>x.match_date).filter(d=>!playedSet.has(d));

  resultDates.forEach((d,i)=>matchdayByLabel.set(fmtDate(d),i+1));
  scheduleDates.forEach((d,i)=>matchdayByLabel.set(fmtDate(d),resultDates.length+i+1));
}
function applyMatchdayHeaders(root){
  if(!root||!isLeague||!totalTurns||!matchdayByLabel.size)return;
  root.querySelectorAll(".cd-date-head strong").forEach(strong=>{
    const head=strong.closest(".cd-date-head");
    if(!head)return;
    let base=c(strong.dataset.baseDate);
    if(!base){
      base=c(strong.textContent).split(" | MATCH ")[0].trim();
      strong.dataset.baseDate=base;
    }
    const turn=matchdayByLabel.get(base);
    if(!turn)return;
    const wanted=`${base} | MATCH ${turn}/${totalTurns}`;
    if(strong.textContent!==wanted)strong.textContent=wanted;
    head.classList.add("cd-league-matchday-head");
  });
}
function applyStatus(root){
  if(!root||!status)return;
  const box=root.querySelector(".cd-status");
  if(!box||box.dataset.turnsApplied==="1")return;
  const metric=[...box.querySelectorAll(":scope > div")].find(x=>x.querySelector("small")&&x.querySelector("small").textContent.trim()==="MATCHES PLAYED");
  const teamsBox=[...box.querySelectorAll(":scope > div")].find(x=>x.querySelector("small")&&x.querySelector("small").textContent.trim()==="TEAMS");
  if(!metric||!teamsBox)return;
  const strong=metric.querySelector("strong"),teamsStrong=teamsBox.querySelector("strong");
  if(!strong||!teamsStrong)return;

  const played=n(status.counts&&status.counts.results),total=n(status.expectedTotalMatches),teams=n(status.teamsCount),percent=n(status.matchesPlayedPercent);
  const matchesPerTurn=teams>1?teams/2:0;
  if(!matchesPerTurn||!total||total%matchesPerTurn!==0)return;

  const playedTurns=Math.floor(played/matchesPerTurn),calculatedTurns=total/matchesPerTurn;
  teamsStrong.textContent=teams||"—";
  strong.innerHTML=`${playedTurns}<i>/</i>${calculatedTurns}`;
  metric.querySelector("small").textContent="TURNI PLAYED";
  const pct=document.createElement("div");
  pct.className="cd-status-percent";
  pct.innerHTML=`<strong>${percent}%</strong><small>MATCHES PLAYED %</small>`;
  const progress=box.querySelector(".cd-progress");
  if(progress){const bar=progress.querySelector("b");if(bar)bar.style.width=`${percent}%`}
  box.insertBefore(pct,progress||null);
  const old=box.querySelector(":scope > em");if(old)old.remove();
  box.dataset.turnsApplied="1";
}
function apply(root){
  applyStatus(root);
  applyMatchdayHeaders(root);
}
function attach(container){
  if(observer)observer.disconnect();
  host=container||null;
  if(!host)return;
  apply(host);
  observer=new MutationObserver(()=>apply(host));
  observer.observe(host,{childList:true,subtree:true});
}
async function loadStatus(o){
  status=null;meta=null;isLeague=false;totalTurns=0;matchdayByLabel=new Map();
  if(!o||!o.client||!o.worldId||!o.competitionKey)return;

  const [manifest,competitions]=await Promise.all([
    rpc(o.client,"competition_manifest",{gameWorld:o.worldId}),
    rpc(o.client,"gw_competitions",{gameWorld:o.worldId})
  ]);
  const manifestRows=Array.isArray(manifest&&manifest.rows)?manifest.rows:[];
  const competitionRows=Array.isArray(competitions&&competitions.rows)?competitions.rows:[];
  status=manifestRows.find(x=>c(x&&x.competition_key)===c(o.competitionKey))||null;
  meta=competitionRows.find(x=>c(x&&x.competition_key)===c(o.competitionKey))||null;
  isLeague=c(meta&&meta.sm_action).toLowerCase()==="league";

  if(status){
    const total=n(status.expectedTotalMatches),teams=n(status.teamsCount),matchesPerTurn=teams>1?teams/2:0;
    if(matchesPerTurn&&total&&total%matchesPerTurn===0)totalTurns=total/matchesPerTurn;
  }

  if(isLeague&&totalTurns){
    const [results,schedule]=await Promise.all([
      rpc(o.client,"results",{gameWorld:o.worldId,competitionKey:o.competitionKey,limit:1000}),
      rpc(o.client,"schedule",{gameWorld:o.worldId})
    ]);
    const resultRows=Array.isArray(results&&results.rows)?results.rows:[];
    const scheduleRows=(Array.isArray(schedule&&schedule.rows)?schedule.rows:[]).filter(x=>c(x&&x.competition_key)===c(o.competitionKey));
    buildMatchdayMap(resultRows,scheduleRows);
  }
}
const bind=()=>{
  const mod=window.IMC_COMPETITION_DETAIL;
  if(!mod||mod.__turnsWrapped)return;
  const originalMount=mod.mount,originalUnmount=mod.unmount;
  mod.mount=async function(o){
    const r=await originalMount.call(mod,o);
    await loadStatus(o);
    attach(o&&o.container);
    return r;
  };
  mod.unmount=function(){
    if(observer)observer.disconnect();
    observer=null;host=null;status=null;meta=null;isLeague=false;totalTurns=0;matchdayByLabel=new Map();
    return originalUnmount.call(mod);
  };
  mod.__turnsWrapped=true;
};
bind();
window.IMC_COMPETITION_STATUS_TURNS={version:VERSION,apply,attach};
})();