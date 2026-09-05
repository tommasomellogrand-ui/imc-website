(function(){
"use strict";

if(window.__IMC_COMPETITION_TROPHY_ROOM_GW008__)return;
window.__IMC_COMPETITION_TROPHY_ROOM_GW008__=true;

const VERSION="1.0.0";
const WORLD="GW008";
const STYLE_ID="imcCompetitionTrophyRoomGw008Css";
let cache=null;
let observer=null;
let timer=null;

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function db(){return window.__IMC_NEXUS_CLIENT__||null;}
function pageRoot(){return document.getElementById("pageRoot");}
function detail(){const root=pageRoot();return root&&root.querySelector(':scope > .imc-competitions-all-worlds.imc-comp-detail[data-imc-competitions-world="GW008"]');}
function competitionKey(){const d=detail();if(!d)return"";const p=d.querySelector(".imc-comp-detail-head p");const text=clean(p&&p.textContent);const i=text.indexOf(" · ");return i>=0?clean(text.slice(i+3)):"";}
function contentBox(){const d=detail();return d&&d.querySelector("[data-imc-content]");}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");
  s.id=STYLE_ID;
  s.textContent=`
    .imc-comp-detail[data-imc-competitions-world="GW008"] .imc-comp-tabs.imc-comp-tabs-with-trophy{grid-template-columns:repeat(4,minmax(0,1fr))}
    .imc-comp-detail[data-imc-competitions-world="GW008"] .imc-comp-tabs.imc-comp-tabs-with-trophy.is-non-league{grid-template-columns:repeat(3,minmax(0,1fr))}
    .imc-comp-trophy-room-list{display:grid;gap:10px}
    .imc-comp-trophy-room-card{display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;align-items:center;padding:14px;border:1px solid #e0e6ef;border-radius:17px;background:#fff;box-shadow:0 6px 16px rgba(20,39,83,.045)}
    .imc-comp-trophy-room-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:#fff8e7;color:#b17b12;font-size:26px}
    .imc-comp-trophy-room-copy{min-width:0}.imc-comp-trophy-room-copy small{display:block;color:#8a95a7;font-size:8px;font-weight:900;text-transform:uppercase}.imc-comp-trophy-room-copy strong{display:block;margin-top:4px;color:#0a2155;font-size:14px;font-weight:950;line-height:1.15}.imc-comp-trophy-room-copy span{display:block;margin-top:5px;color:#7b8799;font-size:9px;font-weight:800}
    .imc-comp-trophy-room-empty{padding:22px 16px;border:1px solid #e0e6ef;border-radius:17px;background:#fff;color:#7b8799;text-align:center;font-size:10px;font-weight:850}
  `;
  document.head.appendChild(s);
}

async function loadRows(){
  if(cache)return cache;
  const c=db();
  if(!c)throw new Error("Client Supabase non disponibile");
  const r=await c.from("gw008_trophy_room").select("season_id,competition_key,winning_team_id,winning_team_name,winning_nation_id,winning_nation_name,group_name,won_on").order("season_id",{ascending:true}).order("group_name",{ascending:true,nullsFirst:true});
  if(r.error)throw r.error;
  cache=r.data||[];
  return cache;
}

function formatDate(v){
  const s=clean(v);if(!s)return"";
  const d=new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime())?s:d.toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});
}

function winnerName(row){return clean(row.winning_team_name)||clean(row.winning_nation_name)||"-";}

async function renderTrophyRoom(key){
  const box=contentBox();if(!box)return;
  box.innerHTML='<div class="imc-comp-loading">Caricamento Trophy Room…</div>';
  try{
    const rows=(await loadRows()).filter(r=>clean(r.competition_key)===clean(key));
    if(!rows.length){box.innerHTML='<div class="imc-comp-trophy-room-empty">Nessun vincitore registrato per questa competition.</div>';return;}
    box.innerHTML=`<div class="imc-comp-trophy-room-list">${rows.map(r=>`<article class="imc-comp-trophy-room-card"><div class="imc-comp-trophy-room-icon">🏆</div><div class="imc-comp-trophy-room-copy"><small>${esc(clean(r.group_name)||`Season ${clean(r.season_id)}`)}</small><strong>${esc(winnerName(r))}</strong>${r.won_on?`<span>Vincitore · ${esc(formatDate(r.won_on))}</span>`:""}</div></article>`).join("")}</div>`;
  }catch(e){box.innerHTML=`<div class="imc-comp-error">${esc(e&&e.message||"Caricamento Trophy Room non riuscito")}</div>`;}
}

function enhance(){
  const d=detail();if(!d)return;
  const tabs=d.querySelector(".imc-comp-tabs");if(!tabs)return;
  const key=competitionKey();if(!key)return;
  if(tabs.querySelector('[data-imc-tab="trophy-room"]'))return;

  const league=!!tabs.querySelector('[data-imc-tab="standings"]');
  tabs.classList.add("imc-comp-tabs-with-trophy");
  if(!league)tabs.classList.add("is-non-league");

  const b=document.createElement("button");
  b.type="button";
  b.setAttribute("data-imc-tab","trophy-room");
  b.textContent="TROPHY ROOM";
  b.addEventListener("click",function(event){
    event.preventDefault();
    event.stopPropagation();
    tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("is-active",x===b));
    renderTrophyRoom(key);
  });
  tabs.appendChild(b);
}

function schedule(){clearTimeout(timer);timer=setTimeout(enhance,0);}
function start(){
  installStyles();
  const root=pageRoot();
  if(!root)return;
  observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_COMPETITION_TROPHY_ROOM_GW008={version:VERSION,refresh:enhance,clearCache:function(){cache=null;}};
})();
