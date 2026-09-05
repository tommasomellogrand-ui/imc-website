(function(){
"use strict";

const VERSION="0.5.0-dual-text-lineup";
const ROOT_ID="imcMatchReportGW001";
const STYLE_ID="imcMatchReportGW001StartingXiCss";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
let timer=null;
let reportIndexPromise=null;
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.__IMC_NEXUS_CLIENT__||(window.supabase?window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY):null);
if(!db)return;

const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
const norm=v=>clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const img=v=>{v=clean(v);return v.startsWith("//")?"https:"+v:v;};
const initials=name=>clean(name).split(" ").filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";

function installCss(){
  const old=document.getElementById(STYLE_ID);if(old)old.remove();
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
#${ROOT_ID} [data-imcmr-panel="lineups"]{padding-bottom:10px}
#${ROOT_ID} .imcmr-duo{overflow:hidden;border:1px solid #dde4ed;border-radius:18px;background:#fff;box-shadow:0 7px 22px rgba(18,39,73,.05)}
#${ROOT_ID} .imcmr-duo-teams{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #dfe5ed}
#${ROOT_ID} .imcmr-duo-team{display:flex;align-items:center;gap:9px;min-width:0;min-height:86px;padding:12px 13px}
#${ROOT_ID} .imcmr-duo-team.away{flex-direction:row-reverse;text-align:right;border-left:1px solid #e5eaf1}
#${ROOT_ID} .imcmr-duo-logo{display:flex;flex:0 0 48px;align-items:center;justify-content:center;width:48px;height:48px}
#${ROOT_ID} .imcmr-duo-logo img{display:block;max-width:100%;max-height:100%;object-fit:contain}
#${ROOT_ID} .imcmr-duo-logo-fallback{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#173766;color:#fff;font-size:12px;font-weight:950}
#${ROOT_ID} .imcmr-duo-teamcopy{min-width:0;flex:1}
#${ROOT_ID} .imcmr-duo-teamname{display:block;color:#102a5d;font-size:14px;font-weight:950;line-height:1.03;letter-spacing:-.025em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${ROOT_ID} .imcmr-duo-manager{display:block;margin-top:6px;color:#7a8799;font-size:6.3px;font-weight:850;text-transform:uppercase;letter-spacing:.03em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${ROOT_ID} .imcmr-duo-manager b{color:#1f3557;font-weight:950}
#${ROOT_ID} .imcmr-duo-body{display:grid;grid-template-columns:1fr 1fr}
#${ROOT_ID} .imcmr-duo-side{min-width:0;padding:16px 13px 13px}
#${ROOT_ID} .imcmr-duo-side.away{border-left:1px solid #e5eaf1}
#${ROOT_ID} .imcmr-duo-title{margin:0 0 10px;color:#d7193f;font-size:13px;font-weight:950;line-height:1;text-transform:uppercase;letter-spacing:.025em}
#${ROOT_ID} .imcmr-duo-row{display:grid;grid-template-columns:22px minmax(0,1fr) 16px;gap:6px;align-items:center;min-height:33px;border-top:1px solid #edf0f4}
#${ROOT_ID} .imcmr-duo-row:first-of-type{border-top:0}
#${ROOT_ID} .imcmr-duo-num{color:#d7193f;font-size:9px;font-weight:950;text-align:right}
#${ROOT_ID} .imcmr-duo-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#122744;font-size:8px;font-weight:900;text-transform:uppercase}
#${ROOT_ID} .imcmr-duo-cap{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:5px;background:#d7193f;color:#fff;font-size:6px;font-weight:950}
#${ROOT_ID} .imcmr-duo-subs{margin-top:13px;padding-top:10px;border-top:2px solid #d7193f}
#${ROOT_ID} .imcmr-duo-subtitle{margin-bottom:5px;color:#d7193f;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.035em}
#${ROOT_ID} .imcmr-duo-subrow{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:center;min-height:29px;border-top:1px solid #edf0f4}
#${ROOT_ID} .imcmr-duo-subrow:first-of-type{border-top:0}
#${ROOT_ID} .imcmr-duo-subrow b{color:#d7193f;font-size:7.7px;text-align:right}
#${ROOT_ID} .imcmr-duo-subrow span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#253955;font-size:7px;font-weight:850;text-transform:uppercase}
#${ROOT_ID} .imcmr-duo-footer{display:grid;grid-template-columns:1fr 1fr;align-items:center;min-height:44px;border-top:1px solid #e1e6ed;background:#fbfcfe}
#${ROOT_ID} .imcmr-duo-formation{padding:10px 13px;color:#68778d;font-size:6.4px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}
#${ROOT_ID} .imcmr-duo-formation.away{text-align:right;border-left:1px solid #e5eaf1}
#${ROOT_ID} .imcmr-duo-formation strong{display:block;margin-top:3px;color:#173766;font-size:9px;font-weight:950;letter-spacing:0}
#${ROOT_ID} .imcmr-duo-loading{display:flex;align-items:center;justify-content:center;height:210px;color:#6f7d91;font-size:9px;font-weight:800}
@media(max-width:390px){
  #${ROOT_ID} .imcmr-duo-team{gap:6px;min-height:78px;padding:10px 8px}
  #${ROOT_ID} .imcmr-duo-logo{flex-basis:40px;width:40px;height:40px}
  #${ROOT_ID} .imcmr-duo-teamname{font-size:10.5px}
  #${ROOT_ID} .imcmr-duo-manager{font-size:5.4px;margin-top:4px}
  #${ROOT_ID} .imcmr-duo-side{padding:13px 8px 11px}
  #${ROOT_ID} .imcmr-duo-title{font-size:10px;margin-bottom:7px}
  #${ROOT_ID} .imcmr-duo-row{grid-template-columns:18px minmax(0,1fr) 14px;gap:4px;min-height:29px}
  #${ROOT_ID} .imcmr-duo-num{font-size:7.4px}#${ROOT_ID} .imcmr-duo-name{font-size:6.4px}
  #${ROOT_ID} .imcmr-duo-cap{width:13px;height:13px;font-size:5.5px}
  #${ROOT_ID} .imcmr-duo-subs{margin-top:10px;padding-top:8px}
  #${ROOT_ID} .imcmr-duo-subtitle{font-size:7px}
  #${ROOT_ID} .imcmr-duo-subrow{grid-template-columns:18px minmax(0,1fr);gap:4px;min-height:26px}
  #${ROOT_ID} .imcmr-duo-subrow b{font-size:6.5px}#${ROOT_ID} .imcmr-duo-subrow span{font-size:5.9px}
  #${ROOT_ID} .imcmr-duo-formation{padding:8px;font-size:5.5px}#${ROOT_ID} .imcmr-duo-formation strong{font-size:7.5px}
}
`;
  document.head.appendChild(style);
}

async function loadReports(){
  if(reportIndexPromise)return reportIndexPromise;
  reportIndexPromise=(async()=>{
    const r=await db.from("gw001_match_reports").select("sm_fixture_id,home_manager_name,away_manager_name,source_payload,parser_status").eq("parser_status","complete");
    if(r.error)throw r.error;
    return r.data||[];
  })().catch(error=>{reportIndexPromise=null;throw error;});
  return reportIndexPromise;
}

function currentMatchKey(root){
  const sides=root.querySelectorAll(".imcmr-hero .imcmr-side strong");
  return {home:norm(sides[0]?.textContent||""),away:norm(sides[1]?.textContent||""),score:clean(root.querySelector(".imcmr-score")?.textContent||"").replace(/\s+/g,""),round:norm(root.querySelector(".imcmr-round-pill span:last-child")?.textContent||"")};
}

function reportMatches(report,key){
  const p=report?.source_payload||{},m=p.match||{},r=p.result||{};
  const score=(r.homeScore!=null&&r.awayScore!=null)?String(r.homeScore)+"-"+String(r.awayScore):String(m.homeScore)+"-"+String(m.awayScore);
  return norm(m.homeTeam||r.homeTeam||"")===key.home&&norm(m.awayTeam||r.awayTeam||"")===key.away&&clean(score)===key.score&&norm(r.sm_round_label||"")===key.round;
}

function teamData(report,root,side){
  const payload=report.source_payload||{},match=payload.match||{},result=payload.result||{};
  const players=(Array.isArray(payload.players)?payload.players:[]).filter(p=>p.side===side).sort((a,b)=>Number(a.lineupSlot||99)-Number(b.lineupSlot||99));
  const tactic=(Array.isArray(payload.tactics)?payload.tactics:[]).find(t=>t.side===side&&Number(t.minute)===0)||{};
  const logos=root.querySelectorAll(".imcmr-hero .imcmr-side img");
  return {
    name:side==="home"?clean(match.homeTeam||result.homeTeam||"Casa"):clean(match.awayTeam||result.awayTeam||"Ospite"),
    manager:side==="home"?clean(report.home_manager_name||match.homeManager||""):clean(report.away_manager_name||match.awayManager||""),
    logo:img(logos[side==="home"?0:1]?.getAttribute("src")||""),players,formation:clean(tactic.formation||"")
  };
}

function teamHeader(team,side){
  const logo=team.logo?`<img src="${esc(team.logo)}" alt="" loading="eager">`:`<span class="imcmr-duo-logo-fallback">${esc(initials(team.name))}</span>`;
  const manager=team.manager?`<span class="imcmr-duo-manager">MANAGER: <b>${esc(team.manager)}</b></span>`:"";
  return `<div class="imcmr-duo-team ${side}"><div class="imcmr-duo-logo">${logo}</div><div class="imcmr-duo-teamcopy"><strong class="imcmr-duo-teamname">${esc(team.name)}</strong>${manager}</div></div>`;
}

function starterRows(team){
  const rows=team.players.filter(p=>p.isStarter);
  return rows.map(p=>`<div class="imcmr-duo-row"><span class="imcmr-duo-num">${esc(p.lineupSlot)}</span><span class="imcmr-duo-name">${esc(p.playerName)}</span>${p.isCaptain?'<span class="imcmr-duo-cap">C</span>':'<span></span>'}</div>`).join("")||'<div class="imcmr-duo-subrow"><b>—</b><span>Nessun dato</span></div>';
}

function subRows(team){
  const rows=team.players.filter(p=>!p.isStarter);
  return rows.map(p=>`<div class="imcmr-duo-subrow"><b>${esc(p.lineupSlot)}</b><span>${esc(p.playerName)}</span></div>`).join("")||'<div class="imcmr-duo-subrow"><b>—</b><span>Nessun dato</span></div>';
}

function sideMarkup(team,side){
  return `<div class="imcmr-duo-side ${side}"><h2 class="imcmr-duo-title">Starting XI</h2>${starterRows(team)}<div class="imcmr-duo-subs"><div class="imcmr-duo-subtitle">Substitutes</div>${subRows(team)}</div></div>`;
}

function duoMarkup(report,root){
  const home=teamData(report,root,"home"),away=teamData(report,root,"away");
  return `<section class="imcmr-duo"><div class="imcmr-duo-teams">${teamHeader(home,"home")}${teamHeader(away,"away")}</div><div class="imcmr-duo-body">${sideMarkup(home,"home")}${sideMarkup(away,"away")}</div><div class="imcmr-duo-footer"><div class="imcmr-duo-formation home">Formation<strong>${esc(home.formation||"—")}</strong></div><div class="imcmr-duo-formation away">Formation<strong>${esc(away.formation||"—")}</strong></div></div></section>`;
}

async function apply(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  installCss();
  const tab=root.querySelector('[data-imcmr-tab="lineups"]');if(tab)tab.textContent="STARTING XI";
  const panel=root.querySelector('[data-imcmr-panel="lineups"]');if(!panel)return;
  if(panel.dataset.dualXiVersion===VERSION)return;
  panel.innerHTML='<div class="imcmr-duo-loading">Caricamento Starting XI…</div>';
  try{
    const reports=await loadReports(),key=currentMatchKey(root),report=reports.find(r=>reportMatches(r,key));
    if(!report){panel.innerHTML='<div class="imcmr-duo-loading">Starting XI non disponibile.</div>';return;}
    panel.dataset.dualXiVersion=VERSION;
    panel.innerHTML=duoMarkup(report,root);
  }catch(error){panel.innerHTML='<div class="imcmr-duo-loading">Starting XI non disponibile.</div>';console.error("IMC GW001 dual Starting XI",error);}
}

function schedule(){clearTimeout(timer);timer=setTimeout(apply,30);}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("click",event=>{if(event.target&&event.target.closest&&event.target.closest('[data-imcmr-tab="lineups"]'))schedule();},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
window.addEventListener("pageshow",schedule);
window.IMC_MATCH_REPORT_GW001_LINEUPS={version:VERSION,refresh:apply,clearCache:()=>{reportIndexPromise=null;}};
})();