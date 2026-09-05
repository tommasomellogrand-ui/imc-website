(function(){
"use strict";
if(window.__IMC_GW007_COMPETITION_STATS__)return;
window.__IMC_GW007_COMPETITION_STATS__=true;

const VERSION="1.1.0";
const WORLD="GW007";
const TABLE="gw007_competition_player_stats";
const STYLE_ID="imcGw007CompetitionStatsCss";
let client=null,observer=null,timer=null,activeSubtab="goals";
const cache=new Map(),visualCache=new Map();

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function initials(v){const parts=clean(v).replace(/\./g," ").split(/\s+/).filter(Boolean);return (parts.slice(0,2).map(x=>x.charAt(0)).join("")||"PL").toUpperCase();}
function db(){
  if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;
  if(client)return client;
  try{
    const cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");
    if(window.supabase&&cfg&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key);
  }catch(_){}
  return client;
}
function detailRoot(){return document.querySelector(`.imc-competitions-all-worlds.imc-comp-detail[data-imc-competitions-world="${WORLD}"]`);}
function competitionKey(root){
  const p=root&&root.querySelector(".imc-comp-detail-head p");
  const text=clean(p&&p.textContent);
  if(!text)return"";
  const parts=text.split("·").map(clean).filter(Boolean);
  return parts.length?parts[parts.length-1]:"";
}
function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-tabs button{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:9px}
.imc-gw007-stats-wrap{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.imc-gw007-stats-subtabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 14px;padding:5px;border:1px solid #dfe5ee;border-radius:15px;background:#f7f9fc}
.imc-gw007-stats-subtabs button{min-width:0;min-height:40px;padding:7px 4px;border:0;border-radius:11px;background:transparent;color:#5d6a81;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:10px;line-height:1;font-weight:950;letter-spacing:.01em}
.imc-gw007-stats-subtabs button.is-active{background:#0a255d;color:#fff;box-shadow:0 5px 12px rgba(10,37,93,.14)}
.imc-gw007-stats-list{overflow:hidden;border:1px solid #dde4ee;border-radius:18px;background:#fff;box-shadow:0 7px 18px rgba(20,39,83,.055)}
.imc-gw007-stats-head,.imc-gw007-stats-row{display:grid;grid-template-columns:28px 46px minmax(0,1fr) 56px;gap:7px;align-items:center}
.imc-gw007-stats-head{padding:10px 9px;border-bottom:1px solid #e7ecf3;color:#738096;font-size:7.5px;line-height:1;font-weight:950;letter-spacing:.03em;text-transform:uppercase}
.imc-gw007-stats-head span:nth-child(3){text-align:left}.imc-gw007-stats-head span:last-child{text-align:center}
.imc-gw007-stats-row{min-height:68px;padding:9px;border-bottom:1px solid #edf1f5;color:#13264d}
.imc-gw007-stats-row:last-child{border-bottom:0}
.imc-gw007-stats-pos{font-size:13px;font-weight:950;text-align:center;color:#0a255d}
.imc-gw007-player-photo{display:flex;align-items:center;justify-content:center;width:44px;height:44px;overflow:hidden;border:1px solid #e1e7ef;border-radius:50%;background:#eef3f9;color:#5a6980;font-size:10px;font-weight:950}
.imc-gw007-player-photo img{width:100%;height:100%;object-fit:cover;object-position:center top}
.imc-gw007-stats-copy{min-width:0}
.imc-gw007-stats-player{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#081c49;font-size:12px;line-height:1.12;font-weight:950}
.imc-gw007-stats-meta{display:flex;align-items:center;gap:6px;min-width:0;margin-top:6px}
.imc-gw007-club-logo{display:flex;align-items:center;justify-content:center;flex:0 0 25px;width:25px;height:25px;overflow:hidden;border-radius:7px;background:#f1f4f8;color:#657289;font-size:6px;font-weight:950}
.imc-gw007-club-logo img{max-width:100%;max-height:100%;object-fit:contain}
.imc-gw007-team-copy{min-width:0}
.imc-gw007-team-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#4f607a;font-size:9.5px;line-height:1.1;font-weight:900}
.imc-gw007-appearances{display:block;margin-top:2px;color:#929bad;font-size:8.5px;line-height:1;font-weight:800}
.imc-gw007-stats-value{display:flex;align-items:center;justify-content:center;min-height:38px;padding:0 5px;border-radius:11px;background:#0a255d;color:#fff;font-size:14px;line-height:1;font-weight:950;text-align:center}
.imc-gw007-stats-value.yellow{background:#f2c431;color:#4a3900}.imc-gw007-stats-value.red{background:#c83d3d;color:#fff}
@media(min-width:600px){
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-tabs button{font-size:10px}
.imc-gw007-stats-subtabs{grid-template-columns:repeat(6,minmax(0,1fr))}.imc-gw007-stats-subtabs button{font-size:10px;min-height:42px}
.imc-gw007-stats-head,.imc-gw007-stats-row{grid-template-columns:34px 52px minmax(0,1fr) 66px;gap:9px}.imc-gw007-stats-row{min-height:76px;padding:10px 12px}.imc-gw007-player-photo{width:50px;height:50px}.imc-gw007-stats-player{font-size:13px}.imc-gw007-team-name{font-size:10.5px}.imc-gw007-appearances{font-size:9px}.imc-gw007-stats-value{font-size:15px;min-height:42px}}
`;document.head.appendChild(s);
}
async function fetchIn(table,select,column,values){
  const c=db(),out=[];
  const ids=[...new Set((values||[]).filter(v=>v!=null))];
  for(let i=0;i<ids.length;i+=250){
    const r=await c.from(table).select(select).in(column,ids.slice(i,i+250));
    if(r.error)throw r.error;
    out.push(...(r.data||[]));
  }
  return out;
}
async function loadStats(key){
  if(cache.has(key))return cache.get(key);
  const p=(async()=>{
    const c=db();if(!c)throw new Error("Client Supabase non disponibile");
    const rows=[];let from=0;
    while(true){
      const r=await c.from(TABLE).select("sm_player_id,player_name,sm_team_id,team_name,appearances,goals,avg_rating,assists,mom,yellow_cards,red_cards,competition_key").eq("competition_key",key).range(from,from+999);
      if(r.error)throw r.error;
      const page=r.data||[];rows.push(...page);
      if(page.length<1000)break;
      from+=1000;
    }
    return rows;
  })();
  cache.set(key,p);
  try{return await p;}catch(e){cache.delete(key);throw e;}
}
async function loadVisuals(key,rows){
  if(visualCache.has(key))return visualCache.get(key);
  const p=(async()=>{
    const c=db();if(!c)throw new Error("Client Supabase non disponibile");
    const playerIds=[...new Set((rows||[]).map(r=>r.sm_player_id).filter(v=>v!=null))];
    const teamIds=[...new Set((rows||[]).map(r=>r.sm_team_id).filter(v=>v!=null))];
    const [masterPlayers,globalPlayers,worldTeams]=await Promise.all([
      fetchIn("sm_players_master","player_codex_player_id,image_url","player_codex_player_id",playerIds),
      fetchIn("player_codex_global","player_id,image_url","player_id",playerIds),
      fetchIn("gw007_gw_teams","sm_world_club_id,sm_club_id,club_name","sm_world_club_id",teamIds)
    ]);
    const playerPhotos=new Map();
    globalPlayers.forEach(r=>{const u=clean(r.image_url);if(u)playerPhotos.set(String(r.player_id),u);});
    masterPlayers.forEach(r=>{const u=clean(r.image_url);if(u)playerPhotos.set(String(r.player_codex_player_id),u);});
    const clubIds=[...new Set(worldTeams.map(r=>r.sm_club_id).filter(v=>v!=null))];
    const clubs=await fetchIn("sm_clubs_master","sm_club_id,image_url","sm_club_id",clubIds);
    const clubById=new Map();clubs.forEach(r=>{const u=clean(r.image_url);if(u)clubById.set(String(r.sm_club_id),u);});
    const clubLogos=new Map();worldTeams.forEach(r=>{const u=clubById.get(String(r.sm_club_id));if(u)clubLogos.set(String(r.sm_world_club_id),u);});
    return {playerPhotos,clubLogos};
  })();
  visualCache.set(key,p);
  try{return await p;}catch(e){visualCache.delete(key);throw e;}
}
function numeric(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function filteredSorted(rows,kind){
  const copy=(rows||[]).slice();
  if(kind==="goals")return copy.filter(r=>numeric(r.goals)>0).sort((a,b)=>numeric(b.goals)-numeric(a.goals)||numeric(b.appearances)-numeric(a.appearances)||clean(a.player_name).localeCompare(clean(b.player_name),"it"));
  if(kind==="assists")return copy.filter(r=>numeric(r.assists)>0).sort((a,b)=>numeric(b.assists)-numeric(a.assists)||numeric(b.appearances)-numeric(a.appearances)||clean(a.player_name).localeCompare(clean(b.player_name),"it"));
  if(kind==="rating")return copy.filter(r=>r.avg_rating!=null&&clean(r.avg_rating)!=="").sort((a,b)=>numeric(b.avg_rating)-numeric(a.avg_rating)||numeric(b.appearances)-numeric(a.appearances)||clean(a.player_name).localeCompare(clean(b.player_name),"it"));
  if(kind==="mom")return copy.filter(r=>numeric(r.mom)>0).sort((a,b)=>numeric(b.mom)-numeric(a.mom)||numeric(b.appearances)-numeric(a.appearances)||clean(a.player_name).localeCompare(clean(b.player_name),"it"));
  if(kind==="yellow")return copy.filter(r=>numeric(r.yellow_cards)>0).sort((a,b)=>numeric(b.yellow_cards)-numeric(a.yellow_cards)||numeric(b.appearances)-numeric(a.appearances)||clean(a.player_name).localeCompare(clean(b.player_name),"it"));
  return copy.filter(r=>numeric(r.red_cards)>0).sort((a,b)=>numeric(b.red_cards)-numeric(a.red_cards)||numeric(b.appearances)-numeric(a.appearances)||clean(a.player_name).localeCompare(clean(b.player_name),"it"));
}
function playerPhoto(row,visuals){
  const u=visuals&&visuals.playerPhotos.get(String(row.sm_player_id));
  return `<span class="imc-gw007-player-photo">${u?`<img src="${esc(u)}" alt="">`:esc(initials(row.player_name))}</span>`;
}
function clubLogo(row,visuals){
  const u=visuals&&visuals.clubLogos.get(String(row.sm_team_id));
  return `<span class="imc-gw007-club-logo">${u?`<img src="${esc(u)}" alt="">`:esc(initials(row.team_name).slice(0,2))}</span>`;
}
function valueMarkup(row,kind){
  if(kind==="goals")return `<span class="imc-gw007-stats-value">${numeric(row.goals)}</span>`;
  if(kind==="assists")return `<span class="imc-gw007-stats-value">${numeric(row.assists)}</span>`;
  if(kind==="rating")return `<span class="imc-gw007-stats-value">${Number(row.avg_rating).toFixed(2)}</span>`;
  if(kind==="mom")return `<span class="imc-gw007-stats-value">${numeric(row.mom)}</span>`;
  if(kind==="yellow")return `<span class="imc-gw007-stats-value yellow">${numeric(row.yellow_cards)}</span>`;
  return `<span class="imc-gw007-stats-value red">${numeric(row.red_cards)}</span>`;
}
function valueHeader(kind){return kind==="goals"?"GOALS":kind==="assists"?"ASSISTS":kind==="rating"?"RATING":kind==="mom"?"MOM":kind==="yellow"?"YELLOW":"RED";}
function statsMarkup(rows,kind,visuals){
  const list=filteredSorted(rows,kind);
  if(!list.length)return `<div class="imc-comp-loading">Nessun dato disponibile.</div>`;
  return `<div class="imc-gw007-stats-list"><div class="imc-gw007-stats-head"><span>POS</span><span></span><span>PLAYER / CLUB</span><span>${valueHeader(kind)}</span></div>${list.map((r,i)=>`<div class="imc-gw007-stats-row"><span class="imc-gw007-stats-pos">${i+1}</span>${playerPhoto(r,visuals)}<span class="imc-gw007-stats-copy"><strong class="imc-gw007-stats-player">${esc(r.player_name||"-")}</strong><span class="imc-gw007-stats-meta">${clubLogo(r,visuals)}<span class="imc-gw007-team-copy"><strong class="imc-gw007-team-name">${esc(r.team_name||"-")}</strong><small class="imc-gw007-appearances">${numeric(r.appearances)} presenze</small></span></span></span>${valueMarkup(r,kind)}</div>`).join("")}</div>`;
}
async function renderStats(root,key){
  const content=root.querySelector("[data-imc-content]");if(!content)return;
  root.querySelectorAll(".imc-comp-tabs button").forEach(b=>b.classList.toggle("is-active",b.hasAttribute("data-gw007-stats-main")));
  content.innerHTML=`<div class="imc-gw007-stats-wrap"><div class="imc-gw007-stats-subtabs"><button data-gw007-stat="goals" class="${activeSubtab==="goals"?"is-active":""}">GOALS</button><button data-gw007-stat="assists" class="${activeSubtab==="assists"?"is-active":""}">ASSISTS</button><button data-gw007-stat="rating" class="${activeSubtab==="rating"?"is-active":""}">RATING</button><button data-gw007-stat="mom" class="${activeSubtab==="mom"?"is-active":""}">MOM</button><button data-gw007-stat="yellow" class="${activeSubtab==="yellow"?"is-active":""}">YELLOW</button><button data-gw007-stat="red" class="${activeSubtab==="red"?"is-active":""}">RED</button></div><div data-gw007-stats-body><div class="imc-comp-loading">Caricamento statistiche…</div></div></div>`;
  content.querySelectorAll("[data-gw007-stat]").forEach(b=>b.addEventListener("click",()=>{activeSubtab=b.dataset.gw007Stat||"goals";renderStats(root,key);}));
  const body=content.querySelector("[data-gw007-stats-body]");
  try{
    const rows=await loadStats(key),visuals=await loadVisuals(key,rows);
    body.innerHTML=statsMarkup(rows,activeSubtab,visuals);
  }catch(e){body.innerHTML=`<div class="imc-comp-error">${esc(e&&e.message||"Caricamento non riuscito")}</div>`;}
}
function enhance(){
  const root=detailRoot();if(!root)return;
  const tabs=root.querySelector(".imc-comp-tabs"),content=root.querySelector("[data-imc-content]"),key=competitionKey(root);
  if(!tabs||!content||!key)return;
  let stats=tabs.querySelector("[data-gw007-stats-main]");
  if(!stats){
    stats=document.createElement("button");stats.type="button";stats.textContent="STATS";stats.setAttribute("data-gw007-stats-main","1");tabs.appendChild(stats);
    const nativeCount=tabs.querySelectorAll("button:not([data-gw007-stats-main])").length;
    tabs.style.gridTemplateColumns=`repeat(${nativeCount+1},minmax(0,1fr))`;
    stats.addEventListener("click",()=>{activeSubtab="goals";renderStats(root,key);});
  }
}
function schedule(){clearTimeout(timer);timer=setTimeout(enhance,35);}
function start(){installCss();observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});schedule();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_GW007_COMPETITION_STATS={version:VERSION,refresh:enhance,clearCache:()=>{cache.clear();visualCache.clear();}};
})();
