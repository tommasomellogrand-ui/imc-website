(function(){
"use strict";
if(window.__IMC_GW001_DIVISION_RESULTS_V2__)return;
window.__IMC_GW001_DIVISION_RESULTS_V2__=true;

const VERSION="2.0.0";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
let timer=null;
let ownClient=null;
let loadingKey="";

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function client(){
  if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;
  if(!ownClient&&window.supabase)ownClient=window.supabase.createClient(URL,KEY);
  return ownClient;
}
function world(){
  const nodes=document.querySelectorAll(".nx-competition-cover-copy p,.nx-competitions-title p,#openDrawerWorld strong,.nx-sport-world strong");
  for(const node of nodes){
    const text=clean(node.textContent),m=text.match(/GW\d{3}/i);
    if(m)return m[0].toUpperCase();
    if(norm(text)==="road to history")return "GW001";
  }
  return "";
}
function context(tab){
  if(world()!=="GW001")return null;
  const active=document.querySelector('[data-div-tab="'+tab+'"].active');
  const target=document.getElementById("divisionContent");
  const title=document.querySelector(".nx-competition-cover-copy h1");
  if(!active||!target||!title)return null;
  const m=clean(title.textContent).match(/Division\s+(\d+)/i);
  if(!m)return null;
  return {tab,target,division:String(Number(m[1]))};
}
function formatDate(v){const m=clean(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+"/"+m[2]+"/"+m[1]:clean(v);}
function score(row){return row.home_score==null||row.away_score==null?"-":esc(row.home_score)+" - "+esc(row.away_score);}
function rowMarkup(row,played){return '<div class="nx-entity-match nx-gw001-fixture-row"><div class="match-line"><strong class="nx-gw001-team">'+esc(row.home_name)+'</strong><span class="match-score">'+(played?score(row):'VS')+'</span><strong class="nx-gw001-team">'+esc(row.away_name)+'</strong></div></div>';}
function groupsMarkup(rows,dateField,played){
  if(!rows.length)return '<div class="nx-empty-box"><strong>Nessuna partita disponibile</strong></div>';
  const groups=[],map=new Map();
  rows.forEach(row=>{const date=clean(row[dateField]);if(!map.has(date)){const g={date,rows:[]};map.set(date,g);groups.push(g);}map.get(date).rows.push(row);});
  return '<div class="nx-gw001-fixture-source">'+groups.map(g=>'<section class="nx-gw001-date-group"><div class="nx-schedule-day-head"><div><h2>'+esc(formatDate(g.date))+'</h2></div><span>'+g.rows.length+' partite</span></div><div class="nx-entity-match-list">'+g.rows.map(r=>rowMarkup(r,played)).join('')+'</div></section>').join('')+'</div>';
}
async function loadResults(ctx){
  const db=client();if(!db)return;
  const r=await db.from("gw001_results").select("raw_match_id,season_number,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,sm_action,sm_division").eq("game_world_id","GW001").eq("sm_action","league").eq("sm_division",ctx.division).order("source_page_date",{ascending:false}).order("raw_match_id",{ascending:true});
  if(r.error)throw r.error;
  const rows=r.data||[];
  const seasons=rows.map(x=>Number(x.season_number)).filter(Number.isFinite),season=seasons.length?Math.max(...seasons):null;
  const current=season==null?rows:rows.filter(x=>Number(x.season_number)===season);
  const latest=context("results");if(!latest||latest.target!==ctx.target||latest.division!==ctx.division)return;
  ctx.target.innerHTML=groupsMarkup(current,"source_page_date",true);
}
async function loadSchedule(ctx){
  const db=client();if(!db)return;
  const r=await db.from("gw001_schedule").select("schedule_id,season_id,sm_fixture_id,match_date,home_name,away_name,sm_action,sm_division").eq("game_world_id","GW001").eq("sm_action","league").eq("sm_division",ctx.division).order("match_date",{ascending:true}).order("schedule_id",{ascending:true});
  if(r.error)throw r.error;
  const rows=(r.data||[]).filter(x=>clean(x.match_date)>=new Date().toISOString().slice(0,10));
  const latest=context("schedule");if(!latest||latest.target!==ctx.target||latest.division!==ctx.division)return;
  ctx.target.innerHTML=groupsMarkup(rows,"match_date",false);
}
async function apply(force){
  const ctx=context("results")||context("schedule");
  if(!ctx)return;
  const key=ctx.tab+"|"+ctx.division;
  if(loadingKey===key)return;
  if(!force&&ctx.target.querySelector(".nx-gw001-fixture-source"))return;
  loadingKey=key;
  ctx.target.innerHTML='<div class="nx-loading">Caricamento dati…</div>';
  try{if(ctx.tab==="results")await loadResults(ctx);else await loadSchedule(ctx);}catch(e){console.error("GW001 division data",e);if(ctx.target)ctx.target.innerHTML='<div class="nx-empty-box"><strong>Errore caricamento</strong><span>Impossibile leggere i dati GW001.</span></div>';}finally{loadingKey="";}
}
function schedule(force){clearTimeout(timer);timer=setTimeout(()=>apply(!!force),40);}
function start(){
  schedule(true);
  new MutationObserver(()=>schedule(false)).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest('[data-div-tab="results"],[data-div-tab="schedule"]'))schedule(true);},true);
  window.addEventListener("pageshow",()=>schedule(true));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_GW001_DIVISION_RESULTS={version:VERSION,refresh:()=>apply(true)};
})();