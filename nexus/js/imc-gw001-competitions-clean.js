(function(){
"use strict";

if(window.__IMC_GW001_COMPETITIONS_CLEAN__)return;
window.__IMC_GW001_COMPETITIONS_CLEAN__=true;

const VERSION="0.4.0-mobile-standings-next-schedule";
const WORLD="GW001";
const STYLE_ID="imcGw001CompetitionsCleanCssV4";
let ownClient=null;
let observer=null;
let renderTimer=null;
let activeView="list";
let activeCompetition=null;
let activeTab="results";
let activeCategory="all";
let overviewCache=null;
let logoMapCache=null;

function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
function norm(value){return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function esc(value){return clean(value).replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];});}
function db(){if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;return ownClient;}
function pageRoot(){return document.getElementById("pageRoot");}
function currentWorld(){
  const nodes=document.querySelectorAll("#openDrawerWorld strong,.nx-sport-world strong,.nx-competitions-title p,.nx-competition-cover-copy p");
  for(const node of nodes){
    const text=clean(node.textContent),match=text.match(/GW\d{3}/i);
    if(match)return match[0].toUpperCase();
    if(norm(text)==="road to history")return WORLD;
  }
  return "";
}
function competitionButton(){return document.querySelector('.nx-world-nav [data-world-section="competitions"]');}
function competitionIsActive(){const button=competitionButton();return !!(button&&button.classList.contains("active"));}
function markCompetitionActive(){
  const nav=document.querySelector(".nx-world-nav");
  if(!nav)return;
  nav.querySelectorAll("[data-world-section]").forEach(function(button){button.classList.toggle("active",button.getAttribute("data-world-section")==="competitions");});
}
function isOurPage(){const root=pageRoot();return !!(root&&root.querySelector('[data-imc-gw001-competitions-clean="1"]'));}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
.imc-clean-competitions{padding:2px 0 24px;color:#0b1b3f;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.imc-clean-head{padding:8px 2px 5px}.imc-clean-head h1{margin:0;color:#071d52;font-size:32px;line-height:1;font-weight:950;letter-spacing:-.045em;text-transform:uppercase}.imc-clean-head p{margin:7px 0 0;color:#67748c;font-size:11px;font-weight:800}
.imc-clean-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:17px 0 20px}.imc-clean-filter{min-width:0;min-height:38px;padding:7px 5px;border:1px solid #dce3ed;border-radius:999px;background:#fff;color:#1a2d55;font:inherit;font-size:8px;font-weight:900;box-shadow:0 4px 10px rgba(20,39,83,.035)}.imc-clean-filter.is-active{border-color:#08245c;background:#08245c;color:#fff;box-shadow:0 6px 14px rgba(8,36,92,.16)}
.imc-clean-sections{display:grid;gap:22px}.imc-clean-section[hidden]{display:none!important}.imc-clean-section-head{display:flex;align-items:center;gap:9px;margin:0 2px 10px;padding-bottom:8px;border-bottom:1px solid #e4e9f1}.imc-clean-section-head b{display:flex;align-items:center;justify-content:center;width:27px;height:27px;border-radius:9px;background:#edf3ff;color:#1556c7;font-size:14px}.imc-clean-section-head strong{color:#0a1c45;font-size:15px;font-weight:950}.imc-clean-section-head span{margin-left:auto;color:#8a95a7;font-size:8px;font-weight:900}
.imc-clean-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.imc-clean-card{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr) 16px;gap:9px;align-items:center;min-width:0;min-height:93px;padding:11px 10px;border:1px solid #dfe5ed;border-radius:17px;background:linear-gradient(180deg,#fff 0%,#fdfefe 100%);color:#0b1b3f;text-align:left;font:inherit;box-shadow:0 8px 17px rgba(22,42,78,.075),inset 0 1px 0 rgba(255,255,255,.95);transition:transform .12s ease,box-shadow .12s ease}.imc-clean-card:active{transform:translateY(2px);box-shadow:0 3px 8px rgba(22,42,78,.07),inset 0 1px 0 rgba(255,255,255,.95)}
.imc-clean-icon{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:14px;background:#f0f5ff;color:#103f91}.imc-clean-icon svg{width:28px;height:28px}.imc-clean-copy{min-width:0}.imc-clean-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#091c46;font-size:10.5px;line-height:1.08;font-weight:950;text-transform:uppercase}.imc-clean-copy small{display:block;margin-top:7px;color:#7b8799;font-size:7px;line-height:1.32;font-weight:800}.imc-clean-arrow{color:#1858d8;font-size:19px;font-weight:700;text-align:center}
.imc-clean-loading,.imc-clean-error{padding:24px 16px;border:1px solid #e1e6ee;border-radius:17px;background:#fff;color:#798498;text-align:center;font-size:10px;font-weight:850}.imc-clean-error{color:#9d3030}
.imc-clean-detail{padding:3px 0 26px}.imc-clean-back{border:0;background:transparent;padding:4px 0;color:#2862cf;font:inherit;font-size:12px;font-weight:900}.imc-clean-detail-head{margin:11px 0 0}.imc-clean-detail-head h1{margin:0;color:#081c49;font-size:28px;line-height:1;font-weight:950;letter-spacing:-.03em}.imc-clean-detail-head p{margin:6px 0 0;color:#7c8799;font-size:9px;font-weight:800}
.imc-clean-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:16px 0 14px;padding:4px;border:1px solid #e0e6ef;border-radius:15px;background:#f7f9fc}.imc-clean-tabs.is-two{grid-template-columns:repeat(2,minmax(0,1fr))}.imc-clean-tabs button{min-height:39px;border:0;border-radius:11px;background:transparent;color:#637089;font:inherit;font-size:8px;font-weight:950}.imc-clean-tabs button.is-active{background:#0a255d;color:#fff;box-shadow:0 4px 11px rgba(10,37,93,.14)}
.imc-clean-content{min-width:0}.imc-matchday-stack{display:grid;gap:12px}.imc-matchday-box{overflow:hidden;border:1px solid #e0e6ef;border-radius:18px;background:#fff;box-shadow:0 7px 18px rgba(20,39,83,.055)}.imc-matchday-head{padding:10px 12px 9px;border-bottom:1px solid #edf1f5;text-align:center;background:#fbfcfe}.imc-matchday-head strong{display:block;color:#0a2155;font-size:10px;font-weight:950;letter-spacing:.04em;text-transform:uppercase}.imc-matchday-head span{display:block;margin-top:3px;color:#79869b;font-size:8px;font-weight:850}.imc-match-list{padding:0 10px}.imc-match-row{display:grid;grid-template-columns:minmax(0,1fr) 56px minmax(0,1fr);gap:7px;align-items:center;min-height:58px;padding:8px 2px;border-top:1px solid #edf1f5}.imc-match-row:first-child{border-top:0}.imc-side{display:flex;align-items:center;gap:7px;min-width:0}.imc-side.home{justify-content:flex-end;text-align:right}.imc-side.away{justify-content:flex-start;text-align:left}.imc-team-logo{display:flex;align-items:center;justify-content:center;flex:0 0 31px;width:31px;height:31px;overflow:hidden;border-radius:9px;background:#f1f4f8;color:#50617e;font-size:8px;font-weight:950}.imc-team-logo img{max-width:100%;max-height:100%;object-fit:contain}.imc-team-name{min-width:0;color:#0b1b3f;font-size:9px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}.imc-score{display:flex;align-items:center;justify-content:center;min-height:34px;border-radius:12px;background:#eef4fc;color:#245aa5;font-size:14px;font-weight:950}.imc-time{display:flex;align-items:center;justify-content:center;min-height:30px;color:#0a2155;font-size:9px;font-weight:950}
.imc-standings-card{overflow:hidden;border:1px solid #e0e6ef;border-radius:17px;background:#fff;box-shadow:0 6px 16px rgba(20,39,83,.045)}.imc-standings-head,.imc-standing-row{display:grid;grid-template-columns:24px minmax(0,1fr) 25px 25px 25px 25px 31px 34px;gap:2px;align-items:center}.imc-standings-head{padding:9px 7px;border-bottom:1px solid #e8edf4;color:#7c8798;font-size:6.4px;font-weight:950;text-align:center;text-transform:uppercase}.imc-standings-head span:nth-child(2){text-align:left}.imc-standing-row{min-height:48px;padding:7px;border-bottom:1px solid #edf1f5;color:#13264d;font-size:7.5px;font-weight:850;text-align:center}.imc-standing-row:last-child{border-bottom:0}.imc-standing-pos{font-size:9px;font-weight:950}.imc-standing-team{display:grid;grid-template-columns:24px minmax(0,1fr);gap:5px;align-items:center;min-width:0;text-align:left}.imc-standing-team .imc-team-logo{width:24px;height:24px;flex-basis:24px;border-radius:7px}.imc-standing-team strong{display:-webkit-box;min-width:0;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#0b1b3f;font-size:7.5px;line-height:1.05;font-weight:950}.imc-standing-pts{display:flex;align-items:center;justify-content:center;min-height:27px;border-radius:9px;background:#0a255d;color:#fff;font-size:9px;font-weight:950}
@media(max-width:390px){.imc-clean-head h1{font-size:29px}.imc-clean-filters{gap:4px}.imc-clean-filter{font-size:7px;padding-left:3px;padding-right:3px}.imc-clean-grid{gap:7px}.imc-clean-card{grid-template-columns:38px minmax(0,1fr) 13px;gap:7px;min-height:84px;padding:9px 8px;border-radius:15px}.imc-clean-icon{width:38px;height:38px;border-radius:12px}.imc-clean-icon svg{width:24px;height:24px}.imc-clean-copy strong{font-size:9px}.imc-clean-copy small{font-size:6.4px}.imc-clean-arrow{font-size:17px}.imc-clean-detail-head h1{font-size:25px}.imc-match-row{grid-template-columns:minmax(0,1fr) 50px minmax(0,1fr);gap:5px}.imc-side{gap:5px}.imc-team-logo{width:27px;height:27px;flex-basis:27px}.imc-team-name{font-size:8px}.imc-score{font-size:13px}.imc-time{font-size:8px}.imc-standings-head,.imc-standing-row{grid-template-columns:21px minmax(0,1fr) 23px 23px 23px 23px 28px 31px;gap:1px;padding-left:5px;padding-right:5px}.imc-standings-head{font-size:5.8px}.imc-standing-row{font-size:7px}.imc-standing-team{grid-template-columns:22px minmax(0,1fr);gap:4px}.imc-standing-team .imc-team-logo{width:22px;height:22px;flex-basis:22px}.imc-standing-team strong{font-size:6.8px}.imc-standing-pts{font-size:8px}}
`;
  document.head.appendChild(style);
}

async function loadRegistry(){
  const client=db();if(!client)throw new Error("Client Supabase non disponibile");
  const result=await client.from("gw001_gw_competitions").select("*");
  if(result.error)throw result.error;
  return result.data||[];
}
async function loadCompetitionKeys(table){
  const client=db();if(!client)throw new Error("Client Supabase non disponibile");
  const rows=[];let from=0;
  while(true){
    const result=await client.from(table).select("competition_key").range(from,from+999);
    if(result.error)throw result.error;
    const page=result.data||[];rows.push.apply(rows,page);
    if(page.length<1000)break;
    from+=1000;
  }
  return rows;
}
function countByKey(rows){const map=new Map();(rows||[]).forEach(function(row){const key=clean(row.competition_key);if(key)map.set(key,(map.get(key)||0)+1);});return map;}
async function loadOverview(){
  if(overviewCache)return overviewCache;
  const values=await Promise.all([loadRegistry(),loadCompetitionKeys("gw001_results"),loadCompetitionKeys("gw001_schedule")]);
  overviewCache={rows:values[0],results:countByKey(values[1]),schedule:countByKey(values[2])};
  return overviewCache;
}

function registryLabel(row){return clean(row&&row["Nexus View"])||clean(row&&row.sm_competition_name)||clean(row&&row.competition_key)||"Competition";}
function categoryKey(row){const key=norm(row&&row.IMC_competition_type);if(key==="international")return"international";if(key==="nations")return"nations";if(key==="friendly")return"friendly";return"domestic";}
function categoryOrder(value){if(value==="domestic")return 1;if(value==="international")return 2;if(value==="nations")return 3;if(value==="friendly")return 4;return 9;}
function competitionRank(row){
  const action=norm(row&&row.sm_action),label=norm(registryLabel(row));
  if(action==="league"){const m=label.match(/(?:div|division)\s*(\d+)/);return m?Number(m[1]):20;}
  if(action==="leaguecup")return 100;if(action==="leagueshield")return 110;if(action==="charityshield")return 120;
  if(action==="smfacup")return 200;if(action==="smfashield")return 210;if(action==="supercup")return 220;
  if(action==="worldcup")return 300;if(action==="interqualifier")return 310;if(action==="friendly")return 400;return 999;
}
function categoryMeta(key){if(key==="international")return{label:"International",icon:"globe"};if(key==="nations")return{label:"Nations",icon:"flag"};if(key==="friendly")return{label:"Friendly",icon:"friendly"};return{label:"Domestic",icon:"home"};}
function iconSvg(type,text){
  const common='viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if(type==="trophy")return '<svg '+common+'><path d="M10 5h12v6c0 5-2.8 8-6 8s-6-3-6-8V5Z"/><path d="M10 8H6c0 4 1.4 6 5 7M22 8h4c0 4-1.4 6-5 7M16 19v5M11 27h10M13 24h6"/></svg>';
  if(type==="globe")return '<svg '+common+'><circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c3 3 4.5 6.7 4.5 11S19 24 16 27M16 5c-3 3-4.5 6.7-4.5 11S13 24 16 27"/></svg>';
  if(type==="flag")return '<svg '+common+'><path d="M8 27V6M9 7h13l-2 4 2 4H9"/></svg>';
  if(type==="friendly")return '<svg '+common+'><path d="M6 12l5-4 5 3 5-3 5 4-7 8-3-2-3 2-7-8Z"/><path d="M11 17l3 3M21 17l-3 3"/></svg>';
  if(type==="home")return '<svg '+common+'><path d="M5 15 16 6l11 9M8 14v12h16V14M13 26v-8h6v8"/></svg>';
  if(type==="shield")return '<svg '+common+'><path d="M16 4 25 7v7c0 6-3.8 10-9 14-5.2-4-9-8-9-14V7l9-3Z"/>'+(text?'<text x="16" y="18" text-anchor="middle" fill="currentColor" stroke="none" font-size="9" font-weight="900">'+esc(text)+'</text>':'')+'</svg>';
  return iconSvg("trophy");
}
function cardIcon(row){const action=norm(row&&row.sm_action),label=registryLabel(row);if(action==="league"){const m=label.match(/(\d+)/);return iconSvg("shield",m?m[1]:"");}if(action==="smfashield"||action==="charityshield")return iconSvg("shield","");if(action==="worldcup"||action==="interqualifier")return iconSvg("globe");if(action==="friendly")return iconSvg("friendly");return iconSvg("trophy");}
function sectionIcon(key){return iconSvg(categoryMeta(key).icon);}
function metricText(row,overview){
  const parts=[];const teams=Number(row&&row.IMC_league_teams_count);if(Number.isFinite(teams)&&teams>0)parts.push(teams+" teams");
  const results=overview.results.get(clean(row.competition_key))||0,schedule=overview.schedule.get(clean(row.competition_key))||0;
  if(results)parts.push(results+" results");if(schedule)parts.push(schedule+" schedule");
  return parts.join(" · ")||clean(row.sm_action)||"Competition";
}

function renderListLoading(){
  installStyles();const root=pageRoot();if(!root)return;
  root.innerHTML='<section class="imc-clean-competitions" data-imc-gw001-competitions-clean="1"><div class="imc-clean-head"><h1>Competitions</h1><p>GW001 · Road To History</p></div><div class="imc-clean-loading">Caricamento dati…</div></section>';
}
function renderList(overview){
  installStyles();const root=pageRoot();if(!root)return;
  const rows=(overview.rows||[]).slice().sort(function(a,b){const ca=categoryKey(a),cb=categoryKey(b);return categoryOrder(ca)-categoryOrder(cb)||competitionRank(a)-competitionRank(b)||registryLabel(a).localeCompare(registryLabel(b),"it",{numeric:true});});
  const categories=["domestic","international","nations","friendly"];
  const filters=[{key:"all",label:"All"},{key:"domestic",label:"Domestic"},{key:"international",label:"International"},{key:"nations",label:"Nations"},{key:"friendly",label:"Friendly"}];
  root.innerHTML='<section class="imc-clean-competitions" data-imc-gw001-competitions-clean="1">'+
    '<div class="imc-clean-head"><h1>Competitions</h1><p>GW001 · Road To History</p></div>'+
    '<div class="imc-clean-filters">'+filters.map(function(item){return '<button type="button" class="imc-clean-filter '+(activeCategory===item.key?'is-active':'')+'" data-clean-category="'+item.key+'">'+item.label+'</button>';}).join("")+'</div>'+
    '<div class="imc-clean-sections">'+categories.map(function(category){
      const items=rows.filter(function(row){return categoryKey(row)===category;});if(!items.length)return'';const meta=categoryMeta(category);
      return '<section class="imc-clean-section" data-clean-section="'+category+'" '+(activeCategory!=="all"&&activeCategory!==category?'hidden':'')+'><div class="imc-clean-section-head"><b>'+sectionIcon(category)+'</b><strong>'+meta.label+'</strong><span>'+items.length+'</span></div><div class="imc-clean-grid">'+items.map(function(row){return '<button type="button" class="imc-clean-card" data-clean-competition-key="'+esc(row.competition_key)+'"><span class="imc-clean-icon">'+cardIcon(row)+'</span><span class="imc-clean-copy"><strong>'+esc(registryLabel(row))+'</strong><small>'+esc(metricText(row,overview))+'</small></span><span class="imc-clean-arrow">›</span></button>';}).join("")+'</div></section>';
    }).join("")+'</div></section>';
  root.querySelectorAll("[data-clean-category]").forEach(function(button){button.addEventListener("click",function(){activeCategory=button.getAttribute("data-clean-category")||"all";renderList(overview);});});
  root.querySelectorAll("[data-clean-competition-key]").forEach(function(button){button.addEventListener("click",function(){const key=button.getAttribute("data-clean-competition-key");const row=rows.find(function(item){return String(item.competition_key)===String(key);});if(row)openCompetition(row);});});
}
async function showList(){
  if(currentWorld()!==WORLD)return;activeView="list";activeCompetition=null;activeTab="results";markCompetitionActive();renderListLoading();
  try{renderList(await loadOverview());}catch(error){const root=pageRoot();if(root)root.innerHTML='<section class="imc-clean-competitions" data-imc-gw001-competitions-clean="1"><div class="imc-clean-error">'+esc(error&&error.message||"Caricamento non riuscito")+'</div></section>';}
}

async function loadResults(key){
  const client=db();const result=await client.from("gw001_results").select("raw_match_id,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,home_penalties,away_penalties,decided_on_penalties,sm_round_label,competition_key").eq("competition_key",key).order("source_page_date",{ascending:true}).order("raw_match_id",{ascending:true}).range(0,999);
  if(result.error)throw result.error;return result.data||[];
}
async function loadSchedule(key){
  const client=db();const result=await client.from("gw001_schedule").select("schedule_id,sm_fixture_id,match_date,matchday_number,home_name,away_name,sm_round_label,competition_key").eq("competition_key",key).order("match_date",{ascending:true}).order("schedule_id",{ascending:true}).range(0,999);
  if(result.error)throw result.error;return result.data||[];
}
async function loadLogoMap(){
  if(logoMapCache)return logoMapCache;
  const client=db();const map=new Map();
  try{
    const teamsResult=await client.from("gw001_gw_teams").select("sm_club_id,club_name").range(0,999);
    if(teamsResult.error)throw teamsResult.error;
    const teams=teamsResult.data||[],ids=[...new Set(teams.map(function(row){return row.sm_club_id;}).filter(function(v){return v!=null;}))];
    const masters=[];
    for(let i=0;i<ids.length;i+=100){const result=await client.from("sm_clubs_master").select("sm_club_id,club_name,alias,image_filename,image_url").in("sm_club_id",ids.slice(i,i+100));if(result.error)throw result.error;masters.push.apply(masters,result.data||[]);}
    const byId=new Map(masters.map(function(row){return [String(row.sm_club_id),row];}));
    teams.forEach(function(team){const master=byId.get(String(team.sm_club_id));if(!master)return;const url=clean(master.image_url);if(!url)return;[team.club_name,master.club_name,master.alias].filter(Boolean).forEach(function(name){map.set(norm(name),url);});});
  }catch(error){console.error("GW001 competition logos",error);}
  logoMapCache=map;return map;
}
function initials(name){return clean(name).split(/\s+/).filter(Boolean).slice(0,2).map(function(part){return part.charAt(0);}).join("").toUpperCase()||"?";}
function teamLogo(name,logos){const url=logos.get(norm(name))||"";return url?'<span class="imc-team-logo"><img src="'+esc(url)+'" alt="" loading="lazy" onerror="this.remove();this.parentNode.textContent=\''+esc(initials(name))+'\'"></span>':'<span class="imc-team-logo">'+esc(initials(name))+'</span>';}
function prettyDate(value){
  const raw=clean(value);if(!raw)return"";const d=new Date(raw.slice(0,10)+"T12:00:00");if(Number.isNaN(d.getTime()))return raw;
  const text=new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"long",year:"numeric"}).format(d);return text.charAt(0).toUpperCase()+text.slice(1);
}
function playedRows(rows){return (rows||[]).filter(function(row){return row.home_score!=null&&row.away_score!=null;});}
function chronologicalDates(rows,dateField){return [...new Set((rows||[]).map(function(row){return clean(row[dateField]);}).filter(Boolean))].sort();}
function groupByDate(rows,dateField){
  const map=new Map();(rows||[]).forEach(function(row){const date=clean(row[dateField]);if(!map.has(date))map.set(date,[]);map.get(date).push(row);});return map;
}
function roundLabel(rows,fallback){const found=(rows||[]).map(function(row){return clean(row.sm_round_label);}).find(Boolean);return found||fallback;}
function scoreMarkup(row){
  if(row.home_score==null||row.away_score==null)return"-";
  let value=esc(row.home_score)+" - "+esc(row.away_score);
  if(row.decided_on_penalties&&row.home_penalties!=null&&row.away_penalties!=null)value+='<small> '+esc(row.home_penalties)+"-"+esc(row.away_penalties)+" r.</small>";
  return value;
}
function matchRowMarkup(row,logos,played){
  return '<div class="imc-match-row"><div class="imc-side home"><span class="imc-team-name">'+esc(row.home_name||"-")+'</span>'+teamLogo(row.home_name,logos)+'</div><div class="'+(played?'imc-score':'imc-time')+'">'+(played?scoreMarkup(row):'VS')+'</div><div class="imc-side away">'+teamLogo(row.away_name,logos)+'<span class="imc-team-name">'+esc(row.away_name||"-")+'</span></div></div>';
}
async function resultsMarkup(rows,isLeague){
  const played=playedRows(rows);if(!played.length)return '<div class="imc-clean-loading">Nessun risultato presente.</div>';
  const logos=await loadLogoMap(),dates=chronologicalDates(played,"source_page_date"),numberByDate=new Map(dates.map(function(date,index){return [date,index+1];})),groups=groupByDate(played,"source_page_date");
  const ordered=dates.slice().reverse();
  return '<div class="imc-matchday-stack">'+ordered.map(function(date){const games=groups.get(date)||[],fallback=isLeague?'MATCH '+numberByDate.get(date):'MATCH '+numberByDate.get(date),label=roundLabel(games,fallback);return '<section class="imc-matchday-box"><header class="imc-matchday-head"><strong>'+esc(label)+'</strong><span>'+esc(prettyDate(date))+'</span></header><div class="imc-match-list">'+games.map(function(row){return matchRowMarkup(row,logos,true);}).join("")+'</div></section>';}).join("")+'</div>';
}
function buildStandings(rows){
  const fixtures=new Map();playedRows(rows).forEach(function(row){const key=row.sm_fixture_id!=null?String(row.sm_fixture_id):[row.source_page_date,row.home_name,row.away_name].join("|");fixtures.set(key,row);});
  const table=new Map();function ensure(name){const key=norm(name);if(!table.has(key))table.set(key,{team_name:clean(name),played:0,won:0,drawn:0,lost:0,gf:0,ga:0,gd:0,points:0});return table.get(key);}
  fixtures.forEach(function(row){const home=ensure(row.home_name),away=ensure(row.away_name),hs=Number(row.home_score),as=Number(row.away_score);home.played++;away.played++;home.gf+=hs;home.ga+=as;away.gf+=as;away.ga+=hs;if(hs>as){home.won++;away.lost++;home.points+=3;}else if(hs<as){away.won++;home.lost++;away.points+=3;}else{home.drawn++;away.drawn++;home.points++;away.points++;}});
  return [...table.values()].map(function(row){row.gd=row.gf-row.ga;return row;}).sort(function(a,b){return b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team_name.localeCompare(b.team_name,"it");});
}
async function standingsMarkup(rows){
  const table=buildStandings(rows);if(!table.length)return '<div class="imc-clean-loading">Classifica non disponibile.</div>';
  const logos=await loadLogoMap();
  return '<div class="imc-standings-card"><div class="imc-standings-head"><span>Pos</span><span>Club</span><span>PG</span><span>V</span><span>N</span><span>P</span><span>DR</span><span>PT</span></div>'+table.map(function(row,index){return '<div class="imc-standing-row"><span class="imc-standing-pos">'+(index+1)+'</span><span class="imc-standing-team">'+teamLogo(row.team_name,logos)+'<strong>'+esc(row.team_name)+'</strong></span><span>'+row.played+'</span><span>'+row.won+'</span><span>'+row.drawn+'</span><span>'+row.lost+'</span><span>'+esc(row.gd>0?'+'+row.gd:row.gd)+'</span><strong class="imc-standing-pts">'+row.points+'</strong></div>';}).join("")+'</div>';
}
async function scheduleMarkup(scheduleRows,resultRows,isLeague){
  const played=playedRows(resultRows),playedFixtures=new Set(played.map(function(row){return row.sm_fixture_id!=null?String(row.sm_fixture_id):"";}).filter(Boolean));
  const remaining=(scheduleRows||[]).filter(function(row){return !(row.sm_fixture_id!=null&&playedFixtures.has(String(row.sm_fixture_id)));});
  if(!remaining.length)return '<div class="imc-clean-loading">Nessuna partita in schedule.</div>';
  const logos=await loadLogoMap(),playedMatchdays=chronologicalDates(played,"source_page_date").length,dates=chronologicalDates(remaining,"match_date"),groups=groupByDate(remaining,"match_date");
  return '<div class="imc-matchday-stack">'+dates.map(function(date,index){const games=groups.get(date)||[];const fallback='MATCH '+(playedMatchdays+index+1);const label=isLeague?fallback:roundLabel(games,fallback);return '<section class="imc-matchday-box"><header class="imc-matchday-head"><strong>'+esc(label)+'</strong><span>'+esc(prettyDate(date))+'</span></header><div class="imc-match-list">'+games.map(function(row){return matchRowMarkup(row,logos,false);}).join("")+'</div></section>';}).join("")+'</div>';
}

function detailShell(row){
  installStyles();const root=pageRoot();if(!root)return null;const isLeague=norm(row.sm_action)==="league";
  root.innerHTML='<section class="imc-clean-detail" data-imc-gw001-competitions-clean="1"><button type="button" class="imc-clean-back" data-clean-back>‹ Competitions</button><div class="imc-clean-detail-head"><h1>'+esc(registryLabel(row))+'</h1><p>'+esc(row.IMC_competition_type||"")+' · '+esc(row.competition_key||"")+'</p></div><div class="imc-clean-tabs '+(isLeague?'':'is-two')+'"><button type="button" data-clean-tab="results" class="'+(activeTab==="results"?'is-active':'')+'">RESULTS</button>'+(isLeague?'<button type="button" data-clean-tab="standings" class="'+(activeTab==="standings"?'is-active':'')+'">STANDINGS</button>':'')+'<button type="button" data-clean-tab="schedule" class="'+(activeTab==="schedule"?'is-active':'')+'">SCHEDULE</button></div><div class="imc-clean-content" data-clean-content><div class="imc-clean-loading">Caricamento dati…</div></div></section>';
  root.querySelector("[data-clean-back]").addEventListener("click",showList);root.querySelectorAll("[data-clean-tab]").forEach(function(button){button.addEventListener("click",function(){openTab(button.getAttribute("data-clean-tab"));});});return root.querySelector("[data-clean-content]");
}
async function openCompetition(row){activeView="detail";activeCompetition=row;activeTab="results";markCompetitionActive();await openTab("results");}
async function openTab(tab){
  if(!activeCompetition)return;activeTab=tab;const content=detailShell(activeCompetition);if(!content)return;const isLeague=norm(activeCompetition.sm_action)==="league";
  try{
    if(tab==="results")content.innerHTML=await resultsMarkup(await loadResults(activeCompetition.competition_key),isLeague);
    else if(tab==="standings")content.innerHTML=await standingsMarkup(await loadResults(activeCompetition.competition_key));
    else if(tab==="schedule"){const values=await Promise.all([loadSchedule(activeCompetition.competition_key),loadResults(activeCompetition.competition_key)]);content.innerHTML=await scheduleMarkup(values[0],values[1],isLeague);}
  }catch(error){content.innerHTML='<div class="imc-clean-error">'+esc(error&&error.message||"Caricamento non riuscito")+'</div>';}
}

function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(function(){if(currentWorld()!==WORLD||!competitionIsActive())return;if(activeView==="detail"&&activeCompetition){if(!isOurPage())openTab(activeTab);}else if(!isOurPage())showList();},35);}
function start(){
  installStyles();
  if(!ownClient&&window.supabase){let cfg=null;try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}const url=cfg&&cfg.url?cfg.url:"https://toanuzojdkfjgucztpze.supabase.co",key=cfg&&cfg.key?cfg.key:"sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";ownClient=window.supabase.createClient(url,key);}
  document.addEventListener("click",function(event){const button=event.target&&event.target.closest?event.target.closest('.nx-world-nav [data-world-section="competitions"]'):null;if(!button||currentWorld()!==WORLD)return;activeView="list";activeCompetition=null;activeTab="results";setTimeout(showList,0);},true);
  const app=document.getElementById("app")||document.documentElement;observer=new MutationObserver(scheduleRender);observer.observe(app,{childList:true,subtree:true});scheduleRender();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_GW001_COMPETITIONS_CLEAN={version:VERSION,showList:showList};
})();