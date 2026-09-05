(function(){
"use strict";
if(window.IMC_TEAM_ROSTER)return;
const VERSION="3.1.0";
let s={container:null};
const c=v=>String(v==null?"":v).trim();
const e=v=>c(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
function stat(label,value){return `<div class="tr-stat"><span>${e(label)}</span><strong>${e(value==null||value===""?"—":value)}</strong></div>`}
function render(rows){
  if(!rows.length){s.container.innerHTML="<div class='nx-empty'>Nessun giocatore disponibile nei Match Report della squadra.</div>";return}
  const groups=new Map();
  for(const row of rows){
    const key=c(row&&row.competition_key);
    if(!key)continue;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  }
  if(!groups.size){s.container.innerHTML="<div class='nx-empty'>Nessun giocatore disponibile nei Match Report della squadra.</div>";return}
  s.container.innerHTML=`<div class="tr-roster">${Array.from(groups.entries()).map(([competitionKey,players])=>`<section class="tr-competition"><h3>${e(competitionKey)}</h3><div class="tr-players">${players.map(p=>`<article class="tr-player"><div class="tr-player-head">${window.IMC_PLAYER_GLOBAL.view(p,"tr-player-identity")}</div><div class="tr-player-stats">${stat("PRESENZE TITOLARE",p.starter_appearances)}${stat("PRESENZE SUBENTRATO",p.substitute_appearances)}${stat("PRESENZE IN PANCHINA",p.bench_appearances)}${stat("MINUTI GIOCATI",p.minutes_played)}${stat("MEDIA VOTO",p.avg_rating)}${stat("ASSIST",p.assists)}${stat("GOL",p.goals)}${stat("MIGLIORE IN CAMPO",p.mom)}${stat("AMMONIZIONI",p.yellow_cards)}${stat("ESPULSIONI",p.red_cards)}</div></article>`).join("")}</div></section>`).join("")}</div>`;
}
async function mount(o){
  if(!o||!o.container||!o.client||!o.worldId||!o.clubWorldId)throw Error("Team Roster: parametri mancanti");
  if(!window.IMC_PLAYER_GLOBAL)throw Error("Player Global non disponibile");
  s.container=o.container;
  s.container.innerHTML="<div class='nx-loading'>Caricamento Team Roster dai Match Report...</div>";
  const r=await o.client.rpc("imc_nexus_gateway",{p_action:"team_roster",p_args:{gameWorld:o.worldId,clubWorldId:o.clubWorldId}});
  if(r.error)throw r.error;
  const rows=Array.isArray(r.data&&r.data.rows)?r.data.rows:[];
  await window.IMC_PLAYER_GLOBAL.enrich(o.client,rows);
  render(rows);
}
function unmount(){if(s.container)s.container.innerHTML="";s.container=null}
window.IMC_TEAM_ROSTER={version:VERSION,mount,unmount};
})();