(function(){
"use strict";
if(window.__IMC_COMPETITION_PREMIUM_LIST_ALL_WORLDS__)return;
window.__IMC_COMPETITION_PREMIUM_LIST_ALL_WORLDS__=true;

const VERSION="1.0.0";
const STYLE_ID="imcCompetitionPremiumListAllWorldsCss";
const VALID_WORLDS=new Set(["GW001","GW002","GW003","GW004","GW005","GW006","GW007","GW008","GW009","GW010"]);
let client=null,observer=null,timer=null;
const summaryCache=new Map(),logoCache=new Map();

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function db(){
  if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;
  if(client)return client;
  try{const cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");if(window.supabase&&cfg&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key);}catch(_){}
  return client;
}
function prefix(world){return String(world||"").toLowerCase();}
function root(){return document.querySelector('.imc-competitions-all-worlds[data-imc-competitions-world]');}
function rootWorld(el){const w=clean(el&&el.getAttribute("data-imc-competitions-world")).toUpperCase();return VALID_WORLDS.has(w)?w:"";}
function isList(el){return !!(el&&!el.classList.contains("imc-comp-detail")&&el.querySelector(".imc-comp-grid"));}

function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.imc-competitions-all-worlds:not(.imc-comp-detail){font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;padding-bottom:30px!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero{border-color:rgba(149,217,38,.72)!important;background:radial-gradient(circle at 82% 18%,rgba(141,213,33,.17),transparent 25%),linear-gradient(105deg,#05090b 0%,#0b1215 48%,#101a17 100%)!important;box-shadow:0 12px 28px rgba(2,8,8,.22),inset 0 0 0 1px rgba(255,255,255,.02)!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero:before{height:72%!important;bottom:-32%!important;background:radial-gradient(ellipse at 50% 100%,rgba(145,219,32,.18),transparent 66%)!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero-copy span{border-color:#91d923!important;color:#a9ef37!important;background:rgba(145,217,35,.07)!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero-copy small{color:#a9ef37!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-trophy{color:#a9ef37!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-filters{gap:6px!important;margin-bottom:20px!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-filter{min-height:40px!important;border-color:#cfd8d3!important;background:#f8faf9!important;color:#19231f!important;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;font-size:9px!important;font-weight:900!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-filter.is-active{border-color:#91d923!important;background:#101815!important;color:#a9ef37!important;box-shadow:0 7px 16px rgba(64,104,19,.16)!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-sections{gap:24px!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head{border-bottom-color:#dfe6e2!important;margin-bottom:11px!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head b{background:#101815!important;color:#a9ef37!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head strong{font-size:16px!important;color:#0b1712!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head span{font-size:10px!important;color:#607068!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-grid{grid-template-columns:1fr!important;gap:11px!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card{display:grid!important;grid-template-columns:78px minmax(0,1fr)!important;gap:0!important;align-items:stretch!important;min-height:154px!important;padding:0!important;overflow:hidden!important;border:1px solid #28352f!important;border-radius:18px!important;background:linear-gradient(105deg,#0b1012 0%,#11191b 55%,#121b17 100%)!important;color:#fff!important;text-align:left!important;box-shadow:0 10px 24px rgba(8,17,14,.16),inset 0 1px 0 rgba(255,255,255,.035)!important;position:relative!important}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card:before{content:"";position:absolute;inset:auto -12% -52% 24%;height:100%;background:radial-gradient(ellipse,rgba(145,217,35,.10),transparent 62%);pointer-events:none}
.imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card:active{transform:scale(.992)!important}
.imc-premium-visual{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;border-right:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,#1a2223,#0b1012);color:#a9ef37}
.imc-premium-visual:before{content:"";position:absolute;inset:0;background:linear-gradient(145deg,rgba(145,217,35,.18),transparent 48%);opacity:.75}
.imc-premium-visual.league{background:linear-gradient(155deg,#17241d,#07100c)}
.imc-premium-visual.international{background:linear-gradient(155deg,#101d2c,#071019)}
.imc-premium-visual.nations{background:linear-gradient(155deg,#2a2110,#100c05)}
.imc-premium-visual.friendly{background:linear-gradient(155deg,#262626,#0c0c0c)}
.imc-premium-badge{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:52px;height:64px;border:1px solid rgba(169,239,55,.58);border-radius:11px 11px 18px 18px;background:linear-gradient(180deg,rgba(16,27,22,.95),rgba(7,12,10,.95));box-shadow:0 8px 18px rgba(0,0,0,.28),inset 0 0 0 2px rgba(255,255,255,.025);color:#d9ff90;font-size:27px;line-height:1;font-weight:950;letter-spacing:-.05em}
.imc-premium-badge svg{width:34px;height:34px}
.imc-premium-main{position:relative;z-index:1;display:flex;flex-direction:column;min-width:0;padding:11px 10px 10px 11px}
.imc-premium-titleline{display:grid;grid-template-columns:minmax(0,1fr) 22px;gap:5px;align-items:center}
.imc-premium-titleline strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:14px;line-height:1.05;font-weight:950;text-transform:uppercase;letter-spacing:-.015em}
.imc-premium-chevron{display:flex;align-items:center;justify-content:center;color:#a9ef37;font-size:22px;font-weight:700}
.imc-premium-meta{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#b5c0bb;font-size:9px;line-height:1.15;font-weight:800;text-transform:uppercase}
.imc-premium-meta b{color:#a9ef37;font-weight:950}
.imc-premium-topfacts{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}
.imc-premium-bottomfacts{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.9fr);gap:6px;margin-top:6px}
.imc-premium-fact{min-width:0;min-height:38px;padding:6px 7px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.035)}
.imc-premium-fact-label{display:block;color:#83aa6d;font-size:6.8px;line-height:1;font-weight:950;letter-spacing:.06em;text-transform:uppercase}
.imc-premium-fact-value{display:flex;align-items:center;gap:5px;min-width:0;margin-top:5px;color:#fff;font-size:9.5px;line-height:1.05;font-weight:900}
.imc-premium-status-dot{flex:0 0 8px;width:8px;height:8px;border-radius:50%;background:#91d923;box-shadow:0 0 10px rgba(145,217,35,.58)}
.imc-premium-status-dot.pending{background:#d8a731;box-shadow:0 0 8px rgba(216,167,49,.35)}
.imc-premium-status-dot.done{background:#7a8a83;box-shadow:none}
.imc-premium-status-dot.empty{background:#5a625e;box-shadow:none}
.imc-premium-round strong{color:#a9ef37;font-size:12px;font-weight:950}
.imc-premium-match{display:grid;grid-template-columns:24px minmax(0,1fr) 15px minmax(0,1fr) 24px;gap:3px;align-items:center;min-width:0}
.imc-premium-mini-logo{display:flex;align-items:center;justify-content:center;width:24px;height:24px;overflow:hidden;border-radius:7px;background:#f5f7f6;color:#17211d;font-size:6px;font-weight:950}
.imc-premium-mini-logo img{max-width:100%;max-height:100%;object-fit:contain}
.imc-premium-team{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px;font-weight:900;color:#f7faf8}
.imc-premium-vs{text-align:center;color:#a9ef37;font-size:7px;font-weight:950}
.imc-premium-date{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8d9a94;font-size:7.5px;font-weight:800}
.imc-premium-champion{display:grid;grid-template-columns:25px minmax(0,1fr);gap:5px;align-items:center;min-width:0}
.imc-premium-champion strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:8.5px;line-height:1.05;font-weight:950}
.imc-premium-champion small{display:block;margin-top:3px;color:#8f9b95;font-size:7px;line-height:1;font-weight:800}
.imc-premium-empty{color:#87938d;font-size:9px;font-weight:850}
@media(min-width:600px){
  .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card{grid-template-columns:105px minmax(0,1fr)!important;min-height:174px!important}
  .imc-premium-badge{width:66px;height:78px;font-size:34px}.imc-premium-badge svg{width:42px;height:42px}
  .imc-premium-main{padding:14px 14px 12px}.imc-premium-titleline strong{font-size:17px}.imc-premium-meta{font-size:10px}
  .imc-premium-fact{min-height:42px;padding:7px 9px}.imc-premium-fact-label{font-size:7.5px}.imc-premium-fact-value{font-size:10.5px}.imc-premium-round strong{font-size:14px}
  .imc-premium-team{font-size:9px}.imc-premium-date{font-size:8.5px}.imc-premium-champion strong{font-size:9.5px}
}
`;document.head.appendChild(s);
}

async function allRows(table,select,filterCol,filterVal,orders){
  const c=db();if(!c)throw new Error("Client Supabase non disponibile");
  const out=[];let from=0;
  while(true){
    let q=c.from(table).select(select||"*");
    if(filterCol)q=q.eq(filterCol,filterVal);
    (orders||[]).forEach(o=>{q=q.order(o.column,{ascending:o.ascending!==false});});
    q=q.range(from,from+999);
    const r=await q;if(r.error)throw r.error;
    const page=r.data||[];out.push(...page);
    if(page.length<1000)break;
    from+=1000;
  }
  return out;
}
function fixtureKey(r,dateField){return r&&r.sm_fixture_id!=null?`id:${r.sm_fixture_id}`:`x:${norm(r&&r.home_name)}|${norm(r&&r.away_name)}|${clean(r&&r[dateField])}`;}
function groupByKey(rows){const m=new Map();(rows||[]).forEach(r=>{const k=clean(r.competition_key);if(!k)return;if(!m.has(k))m.set(k,[]);m.get(k).push(r);});return m;}
function divisionNumber(row){const text=`${clean(row&&row["Nexus View"])} ${clean(row&&row.competition_key)}`;const m=text.match(/(?:DIV(?:ISION)?[-\s]?|D)(\d+)\b/i)||text.match(/(?:DIV(?:ISION)?\s*)(\d+)\b/i);return m?Number(m[1]):null;}
function categoryKey(row){const t=norm(row&&row.IMC_competition_type);if(t==="international")return"international";if(t==="nations")return"nations";if(t==="friendly")return"friendly";return norm(row&&row.sm_action)==="league"?"league":"domestic";}
function categoryLabel(row){const k=categoryKey(row);return k==="international"?"International":k==="nations"?"Nations":k==="friendly"?"Friendly":norm(row&&row.sm_action)==="league"?"League":"Domestic";}
function registryLabel(row){return clean(row&&row["Nexus View"])||clean(row&&row.sm_competition_name)||clean(row&&row.competition_key)||"Competition";}
function icon(kind){const base='viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';if(kind==="international")return `<svg ${base}><circle cx="20" cy="20" r="14"/><path d="M6 20h28M20 6c5 5 7 9 7 14s-2 9-7 14M20 6c-5 5-7 9-7 14s2 9 7 14"/></svg>`;if(kind==="nations")return `<svg ${base}><path d="M10 35V6M11 8h18l-4 6 4 6H11"/></svg>`;if(kind==="friendly")return `<svg ${base}><circle cx="20" cy="20" r="14"/><path d="m13 20 5 5 10-11"/></svg>`;return `<svg ${base}><path d="M14 5h12v8c0 7-2 12-6 12s-6-5-6-12V5Z"/><path d="M14 9H8c0 6 2 9 7 10M26 9h6c0 6-2 9-7 10M20 25v6M14 35h12"/></svg>`;}
function prettyDate(v){if(!v)return"";const d=new Date(`${v}T12:00:00`);if(Number.isNaN(d.getTime()))return clean(v);return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short"});}

async function loadLogoMap(world){
  if(logoCache.has(world))return logoCache.get(world);
  const p=(async()=>{
    const c=db(),teams=await allRows(`${prefix(world)}_gw_teams`,"sm_club_id,club_name"),ids=[...new Set(teams.map(x=>x.sm_club_id).filter(v=>v!=null))],byId=new Map();
    for(let i=0;i<ids.length;i+=250){const r=await c.from("sm_clubs_master").select("sm_club_id,image_url").in("sm_club_id",ids.slice(i,i+250));if(r.error)throw r.error;(r.data||[]).forEach(x=>byId.set(String(x.sm_club_id),clean(x.image_url)));}
    const map=new Map();teams.forEach(t=>{const u=byId.get(String(t.sm_club_id));if(u)map.set(norm(t.club_name),u);});return map;
  })();
  logoCache.set(world,p);try{return await p;}catch(e){logoCache.delete(world);throw e;}
}

async function loadSummary(world){
  if(summaryCache.has(world))return summaryCache.get(world);
  const p=(async()=>{
    const [registry,results,schedule,honours,logos]=await Promise.all([
      allRows(`${prefix(world)}_gw_competitions`,"*"),
      allRows(`${prefix(world)}_results`,"competition_key,sm_fixture_id,source_page_date,home_name,away_name,sm_round_label"),
      allRows(`${prefix(world)}_schedule`,"schedule_id,competition_key,match_date,matchday_number,sm_round_label,sm_fixture_id,home_name,away_name",null,null,[{column:"match_date",ascending:true},{column:"schedule_id",ascending:true}]),
      allRows("gw_season_honours","game_world_id,season_id,competition_name,competition_type,winner_team_name","game_world_id",world,[{column:"season_id",ascending:false}]),
      loadLogoMap(world)
    ]);
    return {registry,registryByKey:new Map(registry.map(r=>[clean(r.competition_key),r])),resultsByKey:groupByKey(results),scheduleByKey:groupByKey(schedule),honours,logos};
  })();
  summaryCache.set(world,p);try{return await p;}catch(e){summaryCache.delete(world);throw e;}
}

function exactChampion(row,honours){
  const names=new Set([norm(registryLabel(row)),norm(row&&row.sm_competition_name)].filter(Boolean));
  const div=divisionNumber(row);if(norm(row&&row.sm_action)==="league"&&div)names.add(`division ${div}`);
  const matches=(honours||[]).filter(h=>names.has(norm(h.competition_name))&&clean(h.winner_team_name));
  if(!matches.length)return null;
  return matches.sort((a,b)=>Number(b.season_id||0)-Number(a.season_id||0))[0];
}
function summaryFor(row,data){
  const key=clean(row.competition_key),results=data.resultsByKey.get(key)||[],schedule=data.scheduleByKey.get(key)||[],played=new Set(results.map(r=>fixtureKey(r,"source_page_date"))),remaining=schedule.filter(r=>!played.has(fixtureKey(r,"match_date")));
  remaining.sort((a,b)=>clean(a.match_date).localeCompare(clean(b.match_date))||Number(a.schedule_id||0)-Number(b.schedule_id||0));
  const next=remaining[0]||null;
  let status="SENZA DATI",statusClass="empty";
  if(remaining.length&&results.length){status="IN CORSO";statusClass="";}else if(remaining.length&&!results.length){status="DA INIZIARE";statusClass="pending";}else if(!remaining.length&&results.length){status="CONCLUSA";statusClass="done";}
  const league=norm(row.sm_action)==="league";
  let roundMain="—",roundSub="";
  if(league){
    const playedMd=schedule.filter(r=>played.has(fixtureKey(r,"match_date"))).map(r=>Number(r.matchday_number)).filter(Number.isFinite),allMd=schedule.map(r=>Number(r.matchday_number)).filter(Number.isFinite);
    let cur=playedMd.length?Math.max(...playedMd):0,total=allMd.length?Math.max(...allMd):0;
    if(!cur&&results.length)cur=new Set(results.map(r=>clean(r.source_page_date)).filter(Boolean)).size;
    roundMain=total?`${cur} / ${total}`:(cur?String(cur):"—");roundSub=cur?`Giornata ${cur}`:"";
  }else{
    const lastLabel=[...results].reverse().map(r=>clean(r.sm_round_label)).find(Boolean),nextLabel=clean(next&&next.sm_round_label);roundMain=lastLabel||nextLabel||clean(row.sm_round_label)||"—";roundSub=lastLabel&&nextLabel&&norm(lastLabel)!==norm(nextLabel)?nextLabel:"";
  }
  return {results,schedule,remaining,next,status,statusClass,roundMain,roundSub,champion:exactChampion(row,data.honours)};
}
function miniLogo(name,logos){const u=logos&&logos.get(norm(name));return `<span class="imc-premium-mini-logo">${u?`<img src="${esc(u)}" alt="">`:esc(clean(name).slice(0,2).toUpperCase()||"–")}</span>`;}
function visualMarkup(row){const div=divisionNumber(row),kind=categoryKey(row);return `<span class="imc-premium-visual ${esc(kind)}"><span class="imc-premium-badge">${div||icon(kind)}</span></span>`;}
function nextMarkup(next,logos){if(!next)return `<span class="imc-premium-empty">Nessuna</span>`;return `<span style="display:block;min-width:0"><span class="imc-premium-match">${miniLogo(next.home_name,logos)}<span class="imc-premium-team">${esc(next.home_name||"-")}</span><span class="imc-premium-vs">VS</span><span class="imc-premium-team">${esc(next.away_name||"-")}</span>${miniLogo(next.away_name,logos)}</span><small class="imc-premium-date">${esc(prettyDate(next.match_date))}${clean(next.sm_round_label)?` · ${esc(next.sm_round_label)}`:""}</small></span>`;}
function championMarkup(champion,logos){if(!champion)return `<span class="imc-premium-empty">IN ATTESA</span>`;return `<span class="imc-premium-champion">${miniLogo(champion.winner_team_name,logos)}<span><strong>${esc(champion.winner_team_name)}</strong><small>Stagione ${esc(champion.season_id)}</small></span></span>`;}
function cardMarkup(row,info,data){const country=clean(row.sm_country),teams=Number(row.IMC_league_teams_count)||0,meta=[country,categoryLabel(row),teams?`${teams} teams`:""].filter(Boolean).join(" · ");return `${visualMarkup(row)}<span class="imc-premium-main"><span class="imc-premium-titleline"><strong>${esc(registryLabel(row))}</strong><i class="imc-premium-chevron">›</i></span><span class="imc-premium-meta">${esc(meta||clean(row.sm_action)||"Competition")}</span><span class="imc-premium-topfacts"><span class="imc-premium-fact"><small class="imc-premium-fact-label">Stato</small><span class="imc-premium-fact-value"><i class="imc-premium-status-dot ${esc(info.statusClass)}"></i>${esc(info.status)}</span></span><span class="imc-premium-fact imc-premium-round"><small class="imc-premium-fact-label">Giornate / Turno</small><span class="imc-premium-fact-value"><strong>${esc(info.roundMain)}</strong>${info.roundSub?`<span>${esc(info.roundSub)}</span>`:""}</span></span></span><span class="imc-premium-bottomfacts"><span class="imc-premium-fact"><small class="imc-premium-fact-label">Prossima partita</small><span class="imc-premium-fact-value">${nextMarkup(info.next,data.logos)}</span></span><span class="imc-premium-fact"><small class="imc-premium-fact-label">Campione</small><span class="imc-premium-fact-value">${championMarkup(info.champion,data.logos)}</span></span></span></span>`;}

async function enhance(){
  installCss();const el=root();if(!isList(el))return;const world=rootWorld(el);if(!world)return;
  const cards=[...el.querySelectorAll('.imc-comp-card[data-imc-key]')];if(!cards.length)return;
  try{
    const data=await loadSummary(world);
    cards.forEach(card=>{
      const key=clean(card.getAttribute("data-imc-key")),row=data.registryByKey.get(key);if(!row)return;
      const stamp=`${world}:${key}:${data.resultsByKey.get(key)?.length||0}:${data.scheduleByKey.get(key)?.length||0}`;
      if(card.getAttribute("data-imc-premium-stamp")===stamp)return;
      card.classList.add("imc-premium-card");
      card.innerHTML=cardMarkup(row,summaryFor(row,data),data);
      card.setAttribute("data-imc-premium-stamp",stamp);
    });
  }catch(e){console.warn("IMC Premium Competition list:",e&&e.message||e);}
}
function scheduleEnhance(){clearTimeout(timer);timer=setTimeout(enhance,55);}
function start(){installCss();observer=new MutationObserver(scheduleEnhance);observer.observe(document.documentElement,{childList:true,subtree:true});scheduleEnhance();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_COMPETITION_PREMIUM_LIST_ALL_WORLDS={version:VERSION,refresh:enhance,clearCache:()=>{summaryCache.clear();logoCache.clear();}};
})();
