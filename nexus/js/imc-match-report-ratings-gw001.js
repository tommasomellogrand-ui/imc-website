(function(){
"use strict";

const VERSION="0.1.1-ratings-minute-fix";
const ROOT_ID="imcMatchReportGW001";
const STYLE_ID="imcMatchReportGW001RatingsCss";
const COMPETITION_KEY="GW001-LEAGUECUP";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.__IMC_NEXUS_CLIENT__||(window.supabase?window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY):null);
if(!db)return;

let timer=null;
let resultsPromise=null;
const reportCache=new Map();
const imageCache=new Map();

const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
const norm=v=>clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const img=v=>{v=clean(v);return v.startsWith("//")?"https:"+v:v;};

function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");
  s.id=STYLE_ID;
  s.textContent=`
#${ROOT_ID} .imcmr-ratings-wrap{border:1px solid #dfe5ed;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 5px 18px rgba(18,39,73,.04)}
#${ROOT_ID} .imcmr-ratings-head{padding:12px 12px 9px;border-bottom:1px solid #e8edf3}
#${ROOT_ID} .imcmr-ratings-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
#${ROOT_ID} .imcmr-ratings-title strong{font-size:11px;font-weight:900;color:#173766;text-transform:uppercase;letter-spacing:.055em}
#${ROOT_ID} .imcmr-ratings-switch{display:grid;grid-template-columns:1fr 1fr;width:170px;max-width:52%;border:1px solid #dce4ef;border-radius:10px;overflow:hidden;background:#fff}
#${ROOT_ID} .imcmr-ratings-switch button{height:31px;border:0;background:#fff;color:#63718a;font:800 7px/1 Inter,system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 6px}
#${ROOT_ID} .imcmr-ratings-switch button.active{background:#173766;color:#fff}
#${ROOT_ID} .imcmr-ratings-cols{display:grid;grid-template-columns:28px minmax(0,1fr) 42px 47px 92px;gap:6px;align-items:center;color:#758197;font-size:6.5px;font-weight:850;text-transform:uppercase;letter-spacing:.045em}
#${ROOT_ID} .imcmr-ratings-cols span:nth-child(n+3){text-align:center}
#${ROOT_ID} .imcmr-rating-row{display:grid;grid-template-columns:28px minmax(0,1fr) 42px 47px 92px;gap:6px;align-items:center;height:52px;padding:0 12px;border-top:1px solid #eef1f5;background:#fff}
#${ROOT_ID} .imcmr-rating-row:first-child{border-top:0}
#${ROOT_ID} .imcmr-rating-num{display:flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:50%;background:#173766;color:#fff;font-size:8px;font-weight:900}
#${ROOT_ID} .imcmr-rating-player{display:flex;align-items:center;gap:7px;min-width:0}
#${ROOT_ID} .imcmr-rating-avatar{display:flex;align-items:flex-end;justify-content:center;flex:0 0 30px;width:30px;height:34px;border-radius:16px 16px 10px 10px;background:#edf2f8;overflow:hidden;border:1px solid #dce4ef}
#${ROOT_ID} .imcmr-rating-avatar img{width:100%;height:100%;object-fit:contain;object-position:center bottom}
#${ROOT_ID} .imcmr-rating-avatar b{font-size:8px;color:#173766}
#${ROOT_ID} .imcmr-rating-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0b1833;font-size:8px;font-weight:800}
#${ROOT_ID} .imcmr-rating-min{text-align:center;color:#314765;font-size:8px;font-weight:850}
#${ROOT_ID} .imcmr-rating-pill{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:25px;padding:0 6px;border-radius:8px;background:#173766;color:#fff;font-size:8px;font-weight:900;margin:auto}
#${ROOT_ID} .imcmr-rating-pill.mid{background:#d4a12a}#${ROOT_ID} .imcmr-rating-pill.low{background:#b13a3a}#${ROOT_ID} .imcmr-rating-pill.empty{background:#edf1f6;color:#8190a3}
#${ROOT_ID} .imcmr-rating-events{display:flex;align-items:center;justify-content:flex-end;gap:5px;min-width:0;white-space:nowrap;color:#596b84;font-size:7px;font-weight:800}
#${ROOT_ID} .imcmr-rating-events .goal{font-size:10px}.imcmr-rating-events .assist{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#173766;color:#fff;font-size:6px}.imcmr-rating-events .yc{width:8px;height:12px;border-radius:1px;background:#f4c631}.imcmr-rating-events .rc{width:8px;height:12px;border-radius:1px;background:#c83d3d}.imcmr-rating-events .in{color:#238b45}.imcmr-rating-events .out{color:#c83d3d}.imcmr-rating-events .cap{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#e8edf4;color:#173766;font-size:6px}.imcmr-rating-events .mvp{color:#c69217;font-size:10px}
#${ROOT_ID} .imcmr-ratings-subhead{height:31px;display:flex;align-items:center;padding:0 12px;border-top:1px solid #dfe5ed;background:#f7f9fc;color:#173766;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
#${ROOT_ID} .imcmr-ratings-empty{padding:25px 12px;text-align:center;color:#7b8798;font-size:9px;font-weight:750}
@media(max-width:390px){#${ROOT_ID} .imcmr-ratings-cols,#${ROOT_ID} .imcmr-rating-row{grid-template-columns:25px minmax(0,1fr) 36px 42px 78px;gap:4px}#${ROOT_ID} .imcmr-rating-row{padding-left:9px;padding-right:9px;height:50px}#${ROOT_ID} .imcmr-rating-avatar{width:27px;height:31px;flex-basis:27px}#${ROOT_ID} .imcmr-rating-name{font-size:7.5px}#${ROOT_ID} .imcmr-rating-events{gap:4px;font-size:6.5px}}
`;
  document.head.appendChild(s);
}

function validMinute(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0&&n<=120?n:null;
}
function parseMinute(p,type){
  const raw=String(p?.metadata?.rawHtml||p?.sourceText||"");
  const marker=type==="on"?"subon":"suboff";
  const m=raw.match(new RegExp(marker+"[\\s\\S]*?\\((\\d+)\\)","i"));
  return m?validMinute(m[1]):null;
}
function subOn(p){
  const direct=validMinute(p&&p.subOnMinute);
  return direct!=null?direct:parseMinute(p,"on");
}
function subOff(p){
  const direct=validMinute(p&&p.subOffMinute);
  return direct!=null?direct:parseMinute(p,"off");
}
function minutesPlayed(p){
  const on=subOn(p),off=subOff(p);
  if(p.isStarter)return off!=null?Math.max(0,Math.min(90,off)):90;
  if(on!=null){const end=off!=null&&off>on?Math.min(90,off):90;return Math.max(0,end-on);}
  return 0;
}

function ratingClass(v){
  const n=Number(v);
  return !Number.isFinite(n)||n<=0?"empty":n>=7?"":n>=6?"mid":"low";
}
function ratingText(v){
  const n=Number(v);
  return Number.isFinite(n)&&n>0?n.toFixed(1):"—";
}
function initials(name){return clean(name).split(" ").filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";}

function eventMarkup(p){
  const bits=[];
  const goals=Number(p.goals||0),assists=Number(p.assists||0),yc=Number(p.yellowCards||0),rc=Number(p.redCards||0),on=subOn(p),off=subOff(p);
  if(goals>0)bits.push(`<span class="goal">⚽${goals>1?"×"+goals:""}</span>`);
  if(assists>0)bits.push(`<span class="assist">A${assists>1?assists:""}</span>`);
  if(yc>0)bits.push(`<span class="yc" title="Giallo"></span>`);
  if(rc>0)bits.push(`<span class="rc" title="Rosso"></span>`);
  if(!p.isStarter&&on!=null)bits.push(`<span class="in">↑${esc(on)}'</span>`);
  if(p.isStarter&&off!=null)bits.push(`<span class="out">↓${esc(off)}'</span>`);
  if(p.isCaptain)bits.push(`<span class="cap">C</span>`);
  if(p.isManOfMatch)bits.push(`<span class="mvp">★</span>`);
  return bits.join("");
}

async function loadResults(){
  if(resultsPromise)return resultsPromise;
  resultsPromise=(async()=>{const r=await db.from("gw001_results").select("sm_fixture_id,home_name,away_name,home_score,away_score,competition_key,season_number").eq("competition_key",COMPETITION_KEY).eq("season_number",1);if(r.error)throw r.error;return r.data||[];})().catch(e=>{resultsPromise=null;throw e;});
  return resultsPromise;
}

function currentHero(root){
  const sides=root.querySelectorAll(".imcmr-hero .imcmr-side strong");
  const score=clean(root.querySelector(".imcmr-score")?.textContent||"").match(/(\d+)\s*-\s*(\d+)/);
  return {home:norm(sides[0]?.textContent||""),away:norm(sides[1]?.textContent||""),hs:score?Number(score[1]):null,as:score?Number(score[2]):null};
}

async function currentFixture(root){
  const hero=currentHero(root),rows=await loadResults();
  const row=rows.find(r=>norm(r.home_name)===hero.home&&norm(r.away_name)===hero.away&&Number(r.home_score)===hero.hs&&Number(r.away_score)===hero.as);
  return row?String(row.sm_fixture_id):"";
}

async function loadReport(fixture){
  if(reportCache.has(fixture))return reportCache.get(fixture);
  const p=(async()=>{const r=await db.from("gw001_match_reports").select("sm_fixture_id,source_payload,parser_status").eq("sm_fixture_id",Number(fixture)).maybeSingle();if(r.error)throw r.error;return r.data||null;})();
  reportCache.set(fixture,p);return p;
}

async function loadImages(players){
  const missing=[...new Set(players.map(p=>p.smPlayerId).filter(Boolean).map(String).filter(id=>!imageCache.has(id)))];
  for(let i=0;i<missing.length;i+=100){const r=await db.from("player_codex_global").select("player_id,image_url").in("player_id",missing.slice(i,i+100));if(r.error)throw r.error;(r.data||[]).forEach(x=>imageCache.set(String(x.player_id),img(x.image_url)));}
}

function rowMarkup(p){
  const url=imageCache.get(String(p.smPlayerId||""))||"";
  const min=minutesPlayed(p);
  const minText=min>0?`${min}'`:"—";
  return `<div class="imcmr-rating-row"><span class="imcmr-rating-num">${esc(p.lineupSlot||"")}</span><span class="imcmr-rating-player"><span class="imcmr-rating-avatar">${url?`<img src="${esc(url)}" alt="" loading="lazy">`:`<b>${esc(initials(p.playerName))}</b>`}</span><span class="imcmr-rating-name">${esc(p.playerName||"-")}</span></span><span class="imcmr-rating-min">${esc(minText)}</span><span class="imcmr-rating-pill ${ratingClass(p.rating)}">${esc(ratingText(p.rating))}</span><span class="imcmr-rating-events">${eventMarkup(p)}</span></div>`;
}

function sectionMarkup(players,side){
  const all=players.filter(p=>p.side===side).sort((a,b)=>Number(a.lineupSlot||99)-Number(b.lineupSlot||99));
  const starters=all.filter(p=>p.isStarter),subs=all.filter(p=>!p.isStarter);
  return `${starters.map(rowMarkup).join("")}<div class="imcmr-ratings-subhead">Sostituti</div>${subs.length?subs.map(rowMarkup).join(""):'<div class="imcmr-ratings-empty">Nessun sostituto disponibile</div>'}`;
}

function render(panel,payload,homeName,awayName){
  const players=Array.isArray(payload.players)?payload.players:[];
  panel.innerHTML=`<section class="imcmr-ratings-wrap"><header class="imcmr-ratings-head"><div class="imcmr-ratings-title"><strong>Ratings & Events</strong><div class="imcmr-ratings-switch"><button data-rteam="home" class="active">${esc(homeName)}</button><button data-rteam="away">${esc(awayName)}</button></div></div><div class="imcmr-ratings-cols"><span>#</span><span>Giocatore</span><span>Min</span><span>Voto</span><span>Eventi</span></div></header><div data-rbody="home">${sectionMarkup(players,"home")}</div><div data-rbody="away" hidden>${sectionMarkup(players,"away")}</div></section>`;
  panel.querySelectorAll("[data-rteam]").forEach(btn=>btn.addEventListener("click",()=>{const side=btn.dataset.rteam;panel.querySelectorAll("[data-rteam]").forEach(x=>x.classList.toggle("active",x===btn));panel.querySelectorAll("[data-rbody]").forEach(x=>x.hidden=x.dataset.rbody!==side);}));
}

async function apply(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  const panel=root.querySelector('[data-imcmr-panel="ratings"]');if(!panel)return;
  installCss();
  try{
    const fixture=await currentFixture(root);if(!fixture)return;
    if(panel.dataset.compactRatingsFixture===fixture)return;
    const report=await loadReport(fixture);if(!report||report.parser_status!=="complete")return;
    const payload=report.source_payload||{},players=Array.isArray(payload.players)?payload.players:[];
    await loadImages(players);
    const match=payload.match||{},result=payload.result||{};
    render(panel,payload,clean(match.homeTeam||result.homeTeam||"Casa"),clean(match.awayTeam||result.awayTeam||"Ospite"));
    panel.dataset.compactRatingsFixture=fixture;
  }catch(e){console.error("IMC GW001 compact ratings",e);}
}

function schedule(){clearTimeout(timer);timer=setTimeout(apply,40);}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest('[data-imcmr-tab="ratings"]'))schedule();},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
window.IMC_MATCH_REPORT_GW001_RATINGS={version:VERSION,refresh:apply};
})();