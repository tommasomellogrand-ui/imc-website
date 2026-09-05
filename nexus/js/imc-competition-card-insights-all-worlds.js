(function(){
"use strict";
if(window.__IMC_COMPETITION_CARD_INSIGHTS_ALL_WORLDS__)return;
window.__IMC_COMPETITION_CARD_INSIGHTS_ALL_WORLDS__=true;

const VERSION="1.0.0";
const STYLE_ID="imcCompetitionCardInsightsAllWorldsCss";
const VALID_WORLDS=new Set(["GW001","GW002","GW003","GW004","GW005","GW006","GW007","GW008","GW009","GW010"]);
let client=null,observer=null,timer=null;
const cache=new Map(),logoCache=new Map();

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function prefix(world){return String(world||"").toLowerCase();}
function db(){if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;if(client)return client;try{const cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");if(window.supabase&&cfg&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key);}catch(_){}return client;}
function page(){return document.querySelector('.imc-competitions-all-worlds[data-imc-competitions-world]:not(.imc-comp-detail)');}
function pageWorld(el){const w=clean(el&&el.getAttribute("data-imc-competitions-world")).toUpperCase();return VALID_WORLDS.has(w)?w:"";}
function fixtureKey(r,dateField){return r&&r.sm_fixture_id!=null?`id:${r.sm_fixture_id}`:`x:${norm(r&&r.home_name)}|${norm(r&&r.away_name)}|${clean(r&&r[dateField])}`;}
function groupByKey(rows){const m=new Map();(rows||[]).forEach(r=>{const k=clean(r.competition_key);if(!k)return;if(!m.has(k))m.set(k,[]);m.get(k).push(r);});return m;}
function prettyDate(v){if(!v)return"—";const d=new Date(`${v}T12:00:00`);if(Number.isNaN(d.getTime()))return clean(v);return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short"}).toUpperCase().replace(".","");}

function installCss(){if(document.getElementById(STYLE_ID))return;const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.imc-premium-last-turn{display:flex;align-items:flex-end;justify-content:space-between;gap:7px;min-width:0;width:100%}
.imc-premium-last-turn strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:10px;font-weight:950;line-height:1}
.imc-premium-last-turn small{flex:0 0 auto;color:#91d923;font-size:8px;font-weight:900;line-height:1}
.imc-insight-list{display:grid;gap:3px;width:100%;min-width:0}
.imc-insight-row{display:grid;grid-template-columns:17px minmax(0,1fr) auto;gap:4px;align-items:center;min-width:0}
.imc-insight-logo{display:flex;align-items:center;justify-content:center;width:17px;height:17px;overflow:hidden;border-radius:5px;background:#f5f7f6;color:#17211d;font-size:5px;font-weight:950}
.imc-insight-logo img{max-width:100%;max-height:100%;object-fit:contain}
.imc-insight-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f7faf8;font-size:6.8px;font-weight:900;line-height:1}
.imc-insight-points{color:#a9ef37;font-size:7px;font-weight:950;line-height:1;white-space:nowrap}
.imc-insight-count{display:flex;align-items:center;min-height:22px;color:#fff;font-size:9px;font-weight:950}
@media(min-width:600px){.imc-premium-last-turn strong{font-size:11px}.imc-premium-last-turn small{font-size:9px}.imc-insight-row{grid-template-columns:20px minmax(0,1fr) auto;gap:5px}.imc-insight-logo{width:20px;height:20px}.imc-insight-name{font-size:7.8px}.imc-insight-points{font-size:8px}}
`;document.head.appendChild(s);}

async function allRows(table,select,orders){const c=db();if(!c)throw new Error("Client Supabase non disponibile");const out=[];let from=0;while(true){let q=c.from(table).select(select||"*");(orders||[]).forEach(o=>{q=q.order(o.column,{ascending:o.ascending!==false});});q=q.range(from,from+999);const r=await q;if(r.error)throw r.error;const p=r.data||[];out.push(...p);if(p.length<1000)break;from+=1000;}return out;}
async function loadLogos(world){if(logoCache.has(world))return logoCache.get(world);const p=(async()=>{const c=db(),teams=await allRows(`${prefix(world)}_gw_teams`,"sm_club_id,club_name"),ids=[...new Set(teams.map(t=>t.sm_club_id).filter(v=>v!=null))],byId=new Map();for(let i=0;i<ids.length;i+=250){const r=await c.from("sm_clubs_master").select("sm_club_id,image_url").in("sm_club_id",ids.slice(i,i+250));if(r.error)throw r.error;(r.data||[]).forEach(x=>byId.set(String(x.sm_club_id),clean(x.image_url)));}const m=new Map();teams.forEach(t=>{const u=byId.get(String(t.sm_club_id));if(u)m.set(norm(t.club_name),u);});return m;})();logoCache.set(world,p);try{return await p;}catch(e){logoCache.delete(world);throw e;}}
async function loadWorld(world){if(cache.has(world))return cache.get(world);const p=(async()=>{const [registry,results,schedule,logos]=await Promise.all([
allRows(`${prefix(world)}_gw_competitions`,"competition_key,sm_action,sm_round_label"),
allRows(`${prefix(world)}_results`,"competition_key,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,sm_round_label,raw_match_id",[{column:"source_page_date",ascending:true}]),
allRows(`${prefix(world)}_schedule`,"schedule_id,competition_key,match_date,matchday_number,sm_round_label,sm_fixture_id,home_name,away_name",[{column:"match_date",ascending:true},{column:"schedule_id",ascending:true}]),
loadLogos(world)
]);return{registryByKey:new Map(registry.map(r=>[clean(r.competition_key),r])),resultsByKey:groupByKey(results),scheduleByKey:groupByKey(schedule),logos};})();cache.set(world,p);try{return await p;}catch(e){cache.delete(world);throw e;}}

function latestDate(rows,field){return (rows||[]).map(r=>clean(r[field])).filter(Boolean).sort().pop()||"";}
function lastTurn(row,results,schedule){if(!results.length)return{main:"—",date:"—"};const league=norm(row&&row.sm_action)==="league";if(league){const resultKeys=new Set(results.map(r=>fixtureKey(r,"source_page_date"))),played=schedule.filter(s=>resultKeys.has(fixtureKey(s,"match_date"))&&Number.isFinite(Number(s.matchday_number)));if(played.length){const md=Math.max(...played.map(s=>Number(s.matchday_number))),ids=new Set(played.filter(s=>Number(s.matchday_number)===md&&s.sm_fixture_id!=null).map(s=>String(s.sm_fixture_id))),date=latestDate(results.filter(r=>r.sm_fixture_id!=null&&ids.has(String(r.sm_fixture_id))),"source_page_date")||latestDate(results,"source_page_date");return{main:`MATCH ${md}`,date:prettyDate(date)};}return{main:"—",date:prettyDate(latestDate(results,"source_page_date"))};}
const date=latestDate(results,"source_page_date"),same=results.filter(r=>clean(r.source_page_date)===date),label=[...same].reverse().map(r=>clean(r.sm_round_label)).find(Boolean)||[...results].reverse().map(r=>clean(r.sm_round_label)).find(Boolean)||clean(row&&row.sm_round_label)||"—";return{main:label,date:prettyDate(date)};}

function standings(results){const m=new Map(),get=n=>{const k=clean(n);if(!m.has(k))m.set(k,{name:k,pg:0,gf:0,ga:0,pts:0});return m.get(k);};(results||[]).filter(r=>r.home_score!=null&&r.away_score!=null).forEach(r=>{const h=get(r.home_name),a=get(r.away_name),hs=Number(r.home_score),as=Number(r.away_score);h.pg++;a.pg++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;if(hs>as)h.pts+=3;else if(hs<as)a.pts+=3;else{h.pts++;a.pts++;}});return[...m.values()].sort((a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.gf-a.gf||a.name.localeCompare(b.name,"it")).slice(0,3);}
function logo(name,logos){const u=logos&&logos.get(norm(name));return `<span class="imc-insight-logo">${u?`<img src="${esc(u)}" alt="">`:esc(clean(name).slice(0,2).toUpperCase()||"–")}</span>`;}
function top3Markup(rows,logos){const top=standings(rows);if(!top.length)return`<span class="imc-premium-empty">IN ATTESA</span>`;return`<span class="imc-insight-list">${top.map((x,i)=>`<span class="imc-insight-row">${logo(x.name,logos)}<span class="imc-insight-name">${i+1}. ${esc(x.name)}</span><span class="imc-insight-points">${x.pts} PT</span></span>`).join("")}</span>`;}
function cupQualified(results,schedule,logos){const played=new Set(results.map(r=>fixtureKey(r,"source_page_date"))),remaining=schedule.filter(s=>!played.has(fixtureKey(s,"match_date"))).sort((a,b)=>clean(a.match_date).localeCompare(clean(b.match_date))||Number(a.schedule_id||0)-Number(b.schedule_id||0));if(!remaining.length)return{label:"QUALIFICATE",html:`<span class="imc-premium-empty">IN ATTESA</span>`};const first=remaining[0],round=clean(first.sm_round_label),group=round?remaining.filter(s=>norm(s.sm_round_label)===norm(round)):remaining.filter(s=>clean(s.match_date)===clean(first.match_date)),names=[...new Set(group.flatMap(s=>[clean(s.home_name),clean(s.away_name)]).filter(Boolean))];let label="QUALIFICATE";const n=norm(round);if(n.includes("semif"))label="SEMIFINALISTE";else if(n.includes("final"))label="FINALISTE";if(!names.length)return{label,html:`<span class="imc-premium-empty">IN ATTESA</span>`};if(names.length>4)return{label,html:`<span class="imc-insight-count">${names.length} ${label}</span>`};return{label,html:`<span class="imc-insight-list">${names.map(name=>`<span class="imc-insight-row">${logo(name,logos)}<span class="imc-insight-name">${esc(name)}</span><span></span></span>`).join("")}</span>`};}

function applyCard(card,row,data){const key=clean(card.getAttribute("data-imc-key")),results=data.resultsByKey.get(key)||[],schedule=data.scheduleByKey.get(key)||[],turn=lastTurn(row,results,schedule),league=norm(row&&row.sm_action)==="league",topFacts=card.querySelectorAll(":scope .imc-premium-topfacts > .imc-premium-fact"),bottomFacts=card.querySelectorAll(":scope .imc-premium-bottomfacts > .imc-premium-fact");if(topFacts.length<2||bottomFacts.length<2)return;const first=topFacts[0],last=bottomFacts[1],firstLabel=first.querySelector(".imc-premium-fact-label"),firstValue=first.querySelector(".imc-premium-fact-value"),lastLabel=last.querySelector(".imc-premium-fact-label"),lastValue=last.querySelector(".imc-premium-fact-value");if(firstLabel)firstLabel.textContent="ULTIMO TURNO";if(firstValue)firstValue.innerHTML=`<span class="imc-premium-last-turn"><strong>${esc(turn.main)}</strong><small>${esc(turn.date)}</small></span>`;if(league){if(lastLabel)lastLabel.textContent="TOP 3";if(lastValue)lastValue.innerHTML=top3Markup(results,data.logos);}else{const q=cupQualified(results,schedule,data.logos);if(lastLabel)lastLabel.textContent=q.label;if(lastValue)lastValue.innerHTML=q.html;}card.setAttribute("data-imc-insights-stamp",`${results.length}:${schedule.length}:${turn.main}:${turn.date}`);}

async function enhance(){installCss();const el=page();if(!el)return;const world=pageWorld(el);if(!world)return;const cards=[...el.querySelectorAll('.imc-comp-card.imc-premium-card[data-imc-key]')];if(!cards.length)return;try{const data=await loadWorld(world);cards.forEach(card=>{const key=clean(card.getAttribute("data-imc-key")),row=data.registryByKey.get(key);if(row)applyCard(card,row,data);});}catch(e){console.warn("IMC Competition card insights:",e&&e.message||e);}}
function scheduleEnhance(){clearTimeout(timer);timer=setTimeout(enhance,70);}
function start(){installCss();observer=new MutationObserver(scheduleEnhance);observer.observe(document.documentElement,{childList:true,subtree:true});scheduleEnhance();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_COMPETITION_CARD_INSIGHTS_ALL_WORLDS={version:VERSION,refresh:enhance,clearCache:()=>{cache.clear();logoCache.clear();}};
})();
