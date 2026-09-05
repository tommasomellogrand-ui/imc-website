(function(){
"use strict";
if(window.__IMC_GW001_RESULTS_MATCH_REPORTS__)return;
window.__IMC_GW001_RESULTS_MATCH_REPORTS__=true;

const VERSION="1.0.0";
const WORLD="GW001";
const STYLE_ID="imcGw001ResultsMatchReportsCss";
const indexCache=new Map();
let ownClient=null;
let observer=null;
let timer=null;

function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
function db(){if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;return ownClient;}
function currentWorld(){
  const nodes=document.querySelectorAll("#openDrawerWorld strong,.nx-sport-world strong,.nx-competitions-title p,.nx-competition-cover-copy p");
  for(const node of nodes){
    const text=clean(node.textContent),match=text.match(/GW\d{3}/i);
    if(match)return match[0].toUpperCase();
    if(text.toLowerCase()==="road to history")return WORLD;
  }
  return "";
}
function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent='.imc-clean-detail .imc-match-row.imc-mr-ready{cursor:pointer}.imc-clean-detail .imc-match-row.imc-mr-ready:active{background:#f7f9fd}';
  document.head.appendChild(style);
}
function activeDetail(){return document.querySelector('.imc-clean-detail[data-imc-gw001-competitions-clean="1"]');}
function competitionKey(root){
  const text=clean(root&&root.querySelector(".imc-clean-detail-head p")&&root.querySelector(".imc-clean-detail-head p").textContent);
  const match=text.match(/GW001-[A-Z0-9-]+/i);
  return match?match[0].toUpperCase():"";
}
function competitionTitle(root){return clean(root&&root.querySelector(".imc-clean-detail-head h1")&&root.querySelector(".imc-clean-detail-head h1").textContent)||"Match Report";}
function resultsTabActive(root){const tab=root&&root.querySelector('[data-clean-tab="results"]');return !!(tab&&tab.classList.contains("is-active"));}

async function loadIndex(key){
  if(indexCache.has(key))return indexCache.get(key);
  const promise=(async function(){
    const client=db();if(!client)throw new Error("Client Supabase non disponibile");
    const result=await client.from("gw001_results")
      .select("raw_match_id,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score")
      .eq("competition_key",key)
      .order("source_page_date",{ascending:true})
      .order("raw_match_id",{ascending:true})
      .range(0,999);
    if(result.error)throw result.error;
    const rows=(result.data||[]).filter(function(row){return row.home_score!=null&&row.away_score!=null;});
    const ids=[...new Set(rows.map(function(row){return row.sm_fixture_id;}).filter(function(value){return value!=null;}))];
    const available=new Set();
    for(let i=0;i<ids.length;i+=100){
      const reports=await client.from("gw001_match_reports").select("sm_fixture_id,parser_status").in("sm_fixture_id",ids.slice(i,i+100));
      if(reports.error)throw reports.error;
      (reports.data||[]).forEach(function(row){if(row.parser_status==="complete")available.add(String(row.sm_fixture_id));});
    }
    return {rows:rows,available:available};
  })().catch(function(error){indexCache.delete(key);throw error;});
  indexCache.set(key,promise);
  return promise;
}

function groupRows(rows){
  const groups=new Map();
  (rows||[]).forEach(function(row){const date=clean(row.source_page_date);if(!groups.has(date))groups.set(date,[]);groups.get(date).push(row);});
  const dates=[...groups.keys()].sort().reverse();
  return {groups:groups,dates:dates};
}

async function decorate(){
  if(currentWorld()!==WORLD)return;
  const root=activeDetail();if(!root||!resultsTabActive(root))return;
  const key=competitionKey(root);if(!key)return;
  try{
    const index=await loadIndex(key),grouped=groupRows(index.rows),boxes=root.querySelectorAll(".imc-matchday-box");
    boxes.forEach(function(box,boxIndex){
      const date=grouped.dates[boxIndex],games=date?(grouped.groups.get(date)||[]):[],domRows=box.querySelectorAll(".imc-match-row");
      domRows.forEach(function(domRow,rowIndex){
        const resultRow=games[rowIndex];
        domRow.classList.remove("imc-mr-ready");
        domRow.removeAttribute("data-imc-mr-fixture");
        if(!resultRow||resultRow.sm_fixture_id==null||!index.available.has(String(resultRow.sm_fixture_id)))return;
        domRow.dataset.imcMrFixture=String(resultRow.sm_fixture_id);
        domRow.classList.add("imc-mr-ready");
      });
    });
  }catch(error){console.error("GW001 results match reports",error);}
}

function schedule(){clearTimeout(timer);timer=setTimeout(decorate,60);}
function openFromRow(row){
  const api=window.IMC_MATCH_REPORT_GW001;if(!api||typeof api.openFixture!=="function")return;
  const root=activeDetail();if(!root)return;
  const home=row.querySelector(".imc-side.home img"),away=row.querySelector(".imc-side.away img");
  api.openFixture(row.dataset.imcMrFixture,{home:home?home.getAttribute("src")||"":"",away:away?away.getAttribute("src")||"":""},competitionTitle(root));
}

function start(){
  installStyles();
  if(!ownClient&&window.supabase){
    let cfg=null;try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
    const url=cfg&&cfg.url?cfg.url:"https://toanuzojdkfjgucztpze.supabase.co";
    const key=cfg&&cfg.key?cfg.key:"sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
    ownClient=window.supabase.createClient(url,key);
  }
  document.addEventListener("click",function(event){
    const row=event.target&&event.target.closest?event.target.closest('.imc-clean-detail .imc-match-row.imc-mr-ready[data-imc-mr-fixture]'):null;
    if(!row||currentWorld()!==WORLD)return;
    event.preventDefault();event.stopPropagation();openFromRow(row);
  },true);
  const app=document.getElementById("app")||document.documentElement;
  observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  schedule();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_GW001_RESULTS_MATCH_REPORTS={version:VERSION,refresh:decorate,clearCache:function(){indexCache.clear();}};
})();