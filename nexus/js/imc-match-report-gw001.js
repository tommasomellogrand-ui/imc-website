(function(){
"use strict";

if(window.__IMC_MATCH_REPORT_GW001_V3__)return;
window.__IMC_MATCH_REPORT_GW001_V3__=true;

const VERSION="0.3.0-scorers-home-away-ratings";
const WORLD="GW001";
const ROOT_ID="imcMatchReportGW001";
const STYLE_ID="imcMatchReportGW001CssV3";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.__IMC_NEXUS_CLIENT__||(window.supabase?window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY):null);
if(!db)return;

const reportCache=new Map();
const imageCache=new Map();

const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
const norm=v=>clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9' ]+/g," ").replace(/\s+/g," ").trim().toLowerCase();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const img=v=>{v=clean(v);return v.startsWith("//")?"https:"+v:v;};
const initials=name=>clean(name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";

function installCss(){
  const old=document.getElementById(STYLE_ID);if(old)old.remove();
  const s=document.createElement("style");
  s.id=STYLE_ID;
  s.textContent=`
#${ROOT_ID}{position:fixed;inset:0;z-index:2147483450;overflow:auto;-webkit-overflow-scrolling:touch;background:#f7f9fc;color:#0b1833;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#${ROOT_ID} *{box-sizing:border-box}
#${ROOT_ID} .imcmr-top{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;padding:10px 12px;background:rgba(255,255,255,.98);border-bottom:1px solid #e4e8ef}
#${ROOT_ID} .imcmr-top button{width:40px;height:40px;border:1px solid #dce2ea;border-radius:12px;background:#fff;color:#173766;font:800 20px/1 Inter,system-ui}
#${ROOT_ID} .imcmr-title{text-align:center;min-width:0}#${ROOT_ID} .imcmr-title small{display:block;color:#60708a;font-size:8px;font-weight:800;letter-spacing:.08em}#${ROOT_ID} .imcmr-title strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:900}
#${ROOT_ID} .imcmr-main{max-width:760px;margin:auto;padding:12px 12px 40px}
#${ROOT_ID} .imcmr-round-pill{display:flex;align-items:center;justify-content:center;width:max-content;margin:0 auto 9px;padding:5px 10px;border:1px solid #d9a22c;border-radius:999px;background:#fffaf0;color:#956400;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
#${ROOT_ID} .imcmr-hero{padding:16px;border-radius:20px;background:linear-gradient(145deg,#0e2c63,#071b41);color:#fff;box-shadow:0 10px 26px rgba(10,35,78,.16)}
#${ROOT_ID} .imcmr-scoreline{display:grid;grid-template-columns:minmax(0,1fr) 78px minmax(0,1fr);align-items:center;gap:8px}
#${ROOT_ID} .imcmr-side{display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center;min-width:0}#${ROOT_ID} .imcmr-side img{width:58px;height:58px;object-fit:contain}#${ROOT_ID} .imcmr-logo-fallback{display:flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:50%;background:#fff;color:#123469;font-size:16px;font-weight:950}#${ROOT_ID} .imcmr-side strong{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:900}
#${ROOT_ID} .imcmr-score{font-size:30px;font-weight:950;text-align:center;letter-spacing:-.04em}#${ROOT_ID} .imcmr-penalty{text-align:center;margin-top:4px;color:#f2cf78;font-size:8px;font-weight:800}
#${ROOT_ID} .imcmr-scorers{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:13px;padding-top:11px;border-top:1px solid rgba(255,255,255,.16)}
#${ROOT_ID} .imcmr-scorer-side{min-width:0;font-size:8px;line-height:1.65;font-weight:800;color:#eef3fb}#${ROOT_ID} .imcmr-scorer-side.away{text-align:right}#${ROOT_ID} .imcmr-scorer{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#${ROOT_ID} .imcmr-scorer b{color:#fff;font-weight:950}#${ROOT_ID} .imcmr-scorer em{color:#f3cf72;font-style:normal;font-weight:900}
#${ROOT_ID} .imcmr-meta{text-align:center;margin-top:11px;color:#d7e0ef;font-size:8px;font-weight:700;line-height:1.55}
#${ROOT_ID} .imcmr-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:12px 0;padding:4px;border:1px solid #e1e6ed;border-radius:14px;background:#fff}#${ROOT_ID} .imcmr-tabs button{height:40px;border:0;border-radius:10px;background:transparent;color:#657289;font:850 7px/1 Inter,system-ui;text-transform:uppercase}#${ROOT_ID} .imcmr-tabs button.active{background:#102a5d;color:#fff;box-shadow:0 2px 8px rgba(16,42,93,.12)}
#${ROOT_ID} .imcmr-panel{display:none}#${ROOT_ID} .imcmr-panel.active{display:block}
#${ROOT_ID} .imcmr-card{margin-top:10px;padding:13px;border:1px solid #dfe5ed;border-radius:16px;background:#fff;box-shadow:0 4px 15px rgba(18,39,73,.035)}#${ROOT_ID} .imcmr-card h3{margin:0 0 11px;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;color:#58677e}
#${ROOT_ID} .imcmr-stat{display:grid;grid-template-columns:42px 1fr 42px;gap:9px;align-items:center;margin:10px 0}#${ROOT_ID} .imcmr-stat b{font-size:13px}#${ROOT_ID} .imcmr-stat b:last-child{text-align:right}#${ROOT_ID} .imcmr-stat-mid{text-align:center}#${ROOT_ID} .imcmr-stat-mid span{display:block;margin-bottom:4px;color:#7a8799;font-size:7px;font-weight:800}#${ROOT_ID} .imcmr-bar{display:flex;height:4px;border-radius:4px;overflow:hidden;background:#e5eaf1}#${ROOT_ID} .imcmr-bar i{display:block;background:#173b75}#${ROOT_ID} .imcmr-bar em{display:block;background:#c7cfdb}
#${ROOT_ID} .imcmr-mvp{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:9px}#${ROOT_ID} .imcmr-mvp .star{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#102a5d;color:#f2c94c;font-size:19px}#${ROOT_ID} .imcmr-mvp small{display:block;color:#7b8798;font-size:7px;font-weight:850;text-transform:uppercase}#${ROOT_ID} .imcmr-mvp strong{display:block;font-size:13px}#${ROOT_ID} .imcmr-rating-big{padding:6px 9px;border:1px solid #d9a22c;border-radius:9px;color:#9a6800;font-size:13px;font-weight:950}
#${ROOT_ID} .imcmr-ratings-wrap{overflow:hidden;border:1px solid #dfe5ed;border-radius:18px;background:#fff;box-shadow:0 5px 18px rgba(18,39,73,.04)}
#${ROOT_ID} .imcmr-ratings-team{display:flex;align-items:center;gap:10px;padding:12px 13px;border-bottom:1px solid #e7ebf1;background:#fbfcfe}#${ROOT_ID} .imcmr-ratings-team-logo{display:flex;align-items:center;justify-content:center;flex:0 0 42px;width:42px;height:42px}#${ROOT_ID} .imcmr-ratings-team-logo img{max-width:100%;max-height:100%;object-fit:contain}#${ROOT_ID} .imcmr-ratings-team-logo span{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#173766;color:#fff;font-size:10px;font-weight:950}#${ROOT_ID} .imcmr-ratings-team strong{font-size:13px;font-weight:950;color:#102a5d;text-transform:uppercase}
#${ROOT_ID} .imcmr-ratings-cols,#${ROOT_ID} .imcmr-rating-row{display:grid;grid-template-columns:28px minmax(0,1fr) 42px 48px 100px;gap:6px;align-items:center}
#${ROOT_ID} .imcmr-ratings-cols{padding:9px 12px;color:#758197;font-size:6.5px;font-weight:900;text-transform:uppercase;letter-spacing:.045em;border-bottom:1px solid #eef1f5}#${ROOT_ID} .imcmr-ratings-cols span:nth-child(n+3){text-align:center}
#${ROOT_ID} .imcmr-rating-row{min-height:54px;padding:7px 12px;border-top:1px solid #eef1f5;background:#fff}#${ROOT_ID} .imcmr-rating-row:first-child{border-top:0}
#${ROOT_ID} .imcmr-rating-num{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#173766;color:#fff;font-size:8px;font-weight:950}
#${ROOT_ID} .imcmr-rating-player{display:flex;align-items:center;gap:8px;min-width:0}#${ROOT_ID} .imcmr-rating-avatar{display:flex;align-items:flex-end;justify-content:center;flex:0 0 32px;width:32px;height:36px;border-radius:16px 16px 10px 10px;background:#edf2f8;overflow:hidden;border:1px solid #dce4ef}#${ROOT_ID} .imcmr-rating-avatar img{width:100%;height:100%;object-fit:contain;object-position:center bottom}#${ROOT_ID} .imcmr-rating-avatar b{font-size:8px;color:#173766}#${ROOT_ID} .imcmr-rating-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0b1833;font-size:8px;font-weight:850}
#${ROOT_ID} .imcmr-rating-min{text-align:center;color:#314765;font-size:8px;font-weight:900}#${ROOT_ID} .imcmr-rating-pill{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:25px;padding:0 6px;border-radius:8px;background:#173766;color:#fff;font-size:8px;font-weight:950;margin:auto}#${ROOT_ID} .imcmr-rating-pill.mid{background:#d4a12a}#${ROOT_ID} .imcmr-rating-pill.low{background:#b13a3a}#${ROOT_ID} .imcmr-rating-pill.empty{background:#edf1f6;color:#8190a3}
#${ROOT_ID} .imcmr-rating-events{display:flex;align-items:center;justify-content:flex-end;gap:5px;min-width:0;white-space:nowrap;color:#596b84;font-size:7px;font-weight:850}#${ROOT_ID} .imcmr-rating-events .goal{font-size:10px}#${ROOT_ID} .imcmr-rating-events .assist{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#173766;color:#fff;font-size:6px}#${ROOT_ID} .imcmr-rating-events .yc{width:8px;height:12px;border-radius:1px;background:#f4c631}#${ROOT_ID} .imcmr-rating-events .rc{width:8px;height:12px;border-radius:1px;background:#c83d3d}#${ROOT_ID} .imcmr-rating-events .in{color:#238b45}#${ROOT_ID} .imcmr-rating-events .out{color:#c83d3d}#${ROOT_ID} .imcmr-rating-events .cap{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#e8edf4;color:#173766;font-size:6px}#${ROOT_ID} .imcmr-rating-events .mvp{color:#c69217;font-size:10px}
#${ROOT_ID} .imcmr-ratings-subhead{height:31px;display:flex;align-items:center;padding:0 12px;border-top:1px solid #dfe5ed;background:#f7f9fc;color:#173766;font-size:7px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
#${ROOT_ID} .imcmr-loading{padding:45px 12px;text-align:center;color:#6f7d91;font-size:10px;font-weight:850}
@media(max-width:390px){
  #${ROOT_ID} .imcmr-main{padding-left:9px;padding-right:9px}
  #${ROOT_ID} .imcmr-scoreline{grid-template-columns:minmax(0,1fr) 65px minmax(0,1fr)}
  #${ROOT_ID} .imcmr-side img,#${ROOT_ID} .imcmr-logo-fallback{width:50px;height:50px}
  #${ROOT_ID} .imcmr-scorers{gap:10px}#${ROOT_ID} .imcmr-scorer-side{font-size:7px}
  #${ROOT_ID} .imcmr-tabs button{font-size:6.4px}
  #${ROOT_ID} .imcmr-ratings-cols,#${ROOT_ID} .imcmr-rating-row{grid-template-columns:25px minmax(0,1fr) 34px 42px 78px;gap:4px}
  #${ROOT_ID} .imcmr-rating-row{padding-left:9px;padding-right:9px;min-height:52px}
  #${ROOT_ID} .imcmr-rating-avatar{width:28px;height:32px;flex-basis:28px}
  #${ROOT_ID} .imcmr-rating-name{font-size:7.4px}
  #${ROOT_ID} .imcmr-rating-events{gap:4px;font-size:6.4px}
}
`;
  document.head.appendChild(s);
}

async function loadReport(fixtureId){
  const key=String(fixtureId);
  if(reportCache.has(key))return reportCache.get(key);
  const p=(async()=>{
    const r=await db.from("gw001_match_reports").select("report_id,sm_fixture_id,source_competition_name,stadium_name,attendance,parser_status,source_payload").eq("sm_fixture_id",Number(fixtureId)).maybeSingle();
    if(r.error)throw r.error;
    if(!r.data||r.data.parser_status!=="complete")throw new Error("Match Report non trovato");
    return r.data;
  })();
  reportCache.set(key,p);
  try{return await p;}catch(e){reportCache.delete(key);throw e;}
}

async function loadImages(players){
  const missing=[...new Set((players||[]).map(p=>p.smPlayerId).filter(Boolean).map(String).filter(id=>!imageCache.has(id)))];
  for(let i=0;i<missing.length;i+=100){
    const r=await db.from("player_codex_global").select("player_id,image_url").in("player_id",missing.slice(i,i+100));
    if(r.error)throw r.error;
    (r.data||[]).forEach(x=>imageCache.set(String(x.player_id),img(x.image_url)));
  }
}

function prettyDate(v){
  const raw=clean(v);if(!raw)return"";
  const d=new Date(raw.slice(0,10)+"T12:00:00");if(Number.isNaN(d.getTime()))return raw;
  return new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"short",year:"numeric"}).format(d).toUpperCase();
}
function logoMarkup(name,url){return url?`<img src="${esc(url)}" alt="">`:`<span class="imcmr-logo-fallback">${esc(initials(name))}</span>`;}
function teamRatingLogo(name,url){return url?`<img src="${esc(url)}" alt="">`:`<span>${esc(initials(name))}</span>`;}

function validMinute(value){const n=Number(value);return Number.isFinite(n)&&n>0&&n<=120?n:null;}
function parseMinute(p,type){
  const raw=String(p?.metadata?.rawHtml||p?.sourceText||"");
  const marker=type==="on"?"subon":"suboff";
  const m=raw.match(new RegExp(marker+"[\\s\\S]*?\\((\\d+)\\)","i"));
  return m?validMinute(m[1]):null;
}
function subOn(p){const direct=validMinute(p&&p.subOnMinute);return direct!=null?direct:parseMinute(p,"on");}
function subOff(p){const direct=validMinute(p&&p.subOffMinute);return direct!=null?direct:parseMinute(p,"off");}
function minutesPlayed(p){
  const on=subOn(p),off=subOff(p);
  if(p.isStarter)return off!=null?Math.max(0,Math.min(90,off)):90;
  if(on!=null){const end=off!=null&&off>on?Math.min(90,off):90;return Math.max(0,end-on);}
  return null;
}
function ratingClass(v){const n=Number(v);return !Number.isFinite(n)||n<=0?"empty":n>=7?"":n>=6?"mid":"low";}
function ratingText(v){const n=Number(v);return Number.isFinite(n)&&n>0?n.toFixed(1):"-";}

function playerMatchKey(p){
  const parts=clean(p.playerName).split(/\s+/).filter(Boolean);
  if(parts.length>1&&parts[0].length<=2)parts.shift();
  return norm(parts.join(" "));
}
function scorerEvents(payload){
  const players=(Array.isArray(payload.players)?payload.players:[]).filter(p=>Number(p.goals||0)>0);
  const remaining=new Map(players.map(p=>[String(p.smPlayerId),Number(p.goals||0)]));
  const out=[];
  const events=(Array.isArray(payload.events)?payload.events:[])
    .filter(e=>e.eventType==="goal"&&String(e?.metadata?.source||"")==="commentary"&&/GOL!!/i.test(String(e.rawText||""))&&!/(FUORIGIOCO|ANNULLATO)/i.test(String(e.rawText||"")))
    .sort((a,b)=>Number(a.minute||0)-Number(b.minute||0));
  events.forEach(e=>{
    const before=norm(String(e.rawText||"").split(/GOL!!/i)[0]);
    let chosen=null,best=-1;
    players.forEach(p=>{
      const id=String(p.smPlayerId),left=remaining.get(id)||0;if(left<=0)return;
      const key=playerMatchKey(p);if(!key)return;
      const idx=before.lastIndexOf(key);
      if(idx>best){best=idx;chosen=p;}
    });
    if(chosen&&best>=0){
      const id=String(chosen.smPlayerId);remaining.set(id,(remaining.get(id)||0)-1);
      out.push({side:chosen.side,name:clean(chosen.playerName),minute:validMinute(e.minute),id:id});
    }
  });
  players.forEach(p=>{
    let left=remaining.get(String(p.smPlayerId))||0;
    while(left>0){out.push({side:p.side,name:clean(p.playerName),minute:null,id:String(p.smPlayerId)});left--;}
  });
  return out;
}
function scorersSideMarkup(events,side){
  const rows=(events||[]).filter(e=>e.side===side);
  if(!rows.length)return '<span class="imcmr-scorer">&nbsp;</span>';
  const grouped=[];
  rows.forEach(e=>{
    let row=grouped.find(x=>x.id===e.id);
    if(!row){row={id:e.id,name:e.name,minutes:[]};grouped.push(row);}
    if(e.minute!=null)row.minutes.push(e.minute);
  });
  return grouped.map(row=>`<span class="imcmr-scorer"><b>${esc(row.name)}</b>${row.minutes.length?` <em>${esc(row.minutes.sort((a,b)=>a-b).map(m=>m+"'").join(", "))}</em>`:""}</span>`).join("");
}

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
function rowMarkup(p){
  const url=imageCache.get(String(p.smPlayerId||""))||"";
  const min=minutesPlayed(p),minText=min==null?"":`${min}'`;
  return `<div class="imcmr-rating-row"><span class="imcmr-rating-num">${esc(p.lineupSlot||"")}</span><span class="imcmr-rating-player"><span class="imcmr-rating-avatar">${url?`<img src="${esc(url)}" alt="" loading="lazy">`:`<b>${esc(initials(p.playerName))}</b>`}</span><span class="imcmr-rating-name">${esc(p.playerName||"-")}</span></span><span class="imcmr-rating-min">${esc(minText)}</span><span class="imcmr-rating-pill ${ratingClass(p.rating)}">${esc(ratingText(p.rating))}</span><span class="imcmr-rating-events">${eventMarkup(p)}</span></div>`;
}
function ratingsMarkup(payload,side,teamName,logoUrl){
  const all=(Array.isArray(payload.players)?payload.players:[]).filter(p=>p.side===side).sort((a,b)=>Number(a.lineupSlot||99)-Number(b.lineupSlot||99));
  const starters=all.filter(p=>p.isStarter),subs=all.filter(p=>!p.isStarter);
  return `<section class="imcmr-ratings-wrap"><header class="imcmr-ratings-team"><span class="imcmr-ratings-team-logo">${teamRatingLogo(teamName,logoUrl)}</span><strong>${esc(teamName)}</strong></header><div class="imcmr-ratings-cols"><span>#</span><span>Giocatore</span><span>Min</span><span>Voto</span><span>Eventi</span></div><div>${starters.map(rowMarkup).join("")}</div><div class="imcmr-ratings-subhead">Sostituti</div><div>${subs.map(rowMarkup).join("")}</div></section>`;
}

function statsMarkup(stats){
  const h=stats?.home||{},a=stats?.away||{};
  const rows=[["Possesso palla",h.possession,a.possession,"%"],["Tiri totali",h.totalShots,a.totalShots,""],["Tiri in porta",h.shotsOnTarget,a.shotsOnTarget,""],["Corner",h.corners,a.corners,""],["Gialli",h.yellowCards,a.yellowCards,""],["Rossi",h.redCards,a.redCards,""]];
  return rows.map(([label,hv,av,sfx])=>{
    const hn=Number(hv||0),an=Number(av||0),sum=Math.max(1,hn+an),hp=label==="Possesso palla"?Math.max(0,Math.min(100,hn)):Math.round(hn/sum*100);
    return `<div class="imcmr-stat"><b>${esc(hv)}${sfx}</b><div class="imcmr-stat-mid"><span>${esc(label)}</span><div class="imcmr-bar"><i style="width:${hp}%"></i><em style="width:${100-hp}%"></em></div></div><b>${esc(av)}${sfx}</b></div>`;
  }).join("");
}
function overviewMarkup(payload){
  const players=Array.isArray(payload.players)?payload.players:[];
  const mvp=players.find(p=>p.isManOfMatch)||null;
  return `<section class="imcmr-card"><h3>Statistiche partita</h3>${statsMarkup(payload.teamStats||{})}</section>${mvp?`<section class="imcmr-card imcmr-mvp"><span class="star">★</span><div><small>MVP</small><strong>${esc(mvp.playerName)}</strong></div><span class="imcmr-rating-big">${esc(ratingText(mvp.rating))}</span></section>`:""}`;
}

function openShell(){
  installCss();
  let root=document.getElementById(ROOT_ID);
  if(!root){root=document.createElement("section");root.id=ROOT_ID;document.body.appendChild(root);}
  root.innerHTML='<div class="imcmr-loading">Caricamento Match Report…</div>';
  return root;
}

async function renderReport(report,logos,title){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  const p=report.source_payload||{},match=p.match||{},result=p.result||{};
  const homeName=clean(match.homeTeam||result.homeTeam||"Casa"),awayName=clean(match.awayTeam||result.awayTeam||"Ospite");
  const hs=result.homeScore!=null?result.homeScore:match.homeScore,as=result.awayScore!=null?result.awayScore:match.awayScore;
  const round=clean(result.sm_round_label||"Match Report");
  const penalty=result.decidedOnPenalties&&result.homePenalties!=null&&result.awayPenalties!=null?`Rigori ${result.homePenalties} - ${result.awayPenalties}`:(result.penaltyText||"");
  const players=Array.isArray(p.players)?p.players:[];await loadImages(players);
  const goals=scorerEvents(p);
  root.innerHTML=`<header class="imcmr-top"><button data-imcmr-back>‹</button><div class="imcmr-title"><small>${WORLD}</small><strong>${esc(title||report.source_competition_name||"Match Report")}</strong></div><span></span></header><main class="imcmr-main"><div class="imcmr-round-pill">${esc(round)}</div><section class="imcmr-hero"><div class="imcmr-scoreline"><div class="imcmr-side">${logoMarkup(homeName,logos.home)}<strong>${esc(homeName)}</strong></div><div><div class="imcmr-score">${esc(hs)} - ${esc(as)}</div>${penalty?`<div class="imcmr-penalty">${esc(penalty)}</div>`:""}</div><div class="imcmr-side">${logoMarkup(awayName,logos.away)}<strong>${esc(awayName)}</strong></div></div><div class="imcmr-scorers"><div class="imcmr-scorer-side home">${scorersSideMarkup(goals,"home")}</div><div class="imcmr-scorer-side away">${scorersSideMarkup(goals,"away")}</div></div><div class="imcmr-meta">${esc(prettyDate(match.matchDate||""))}<br>${esc(report.stadium_name||match.stadium||"")}${report.attendance!=null?` · ${Number(report.attendance).toLocaleString("it-IT")} spettatori`:""}</div></section><nav class="imcmr-tabs"><button data-imcmr-tab="overview" class="active">Overview</button><button data-imcmr-tab="home-ratings">Home Ratings</button><button data-imcmr-tab="away-ratings">Away Ratings</button></nav><section class="imcmr-panel active" data-imcmr-panel="overview">${overviewMarkup(p)}</section><section class="imcmr-panel" data-imcmr-panel="home-ratings">${ratingsMarkup(p,"home",homeName,logos.home)}</section><section class="imcmr-panel" data-imcmr-panel="away-ratings">${ratingsMarkup(p,"away",awayName,logos.away)}</section></main>`;
  root.querySelector("[data-imcmr-back]")?.addEventListener("click",()=>root.remove());
  root.querySelectorAll("[data-imcmr-tab]").forEach(btn=>btn.addEventListener("click",()=>{
    const tab=btn.dataset.imcmrTab;
    root.querySelectorAll("[data-imcmr-tab]").forEach(x=>x.classList.toggle("active",x===btn));
    root.querySelectorAll("[data-imcmr-panel]").forEach(x=>x.classList.toggle("active",x.dataset.imcmrPanel===tab));
  }));
}

async function openFixture(fixtureId,logos,title){
  if(fixtureId==null)return;
  openShell();
  try{const report=await loadReport(fixtureId);await renderReport(report,logos||{home:"",away:""},title);}catch(error){
    const root=document.getElementById(ROOT_ID);
    if(root)root.innerHTML=`<header class="imcmr-top"><button data-imcmr-back>‹</button><div class="imcmr-title"><small>${WORLD}</small><strong>${esc(title||"Match Report")}</strong></div><span></span></header><div class="imcmr-loading">${esc(error&&error.message||"Errore Match Report")}</div>`;
    root?.querySelector("[data-imcmr-back]")?.addEventListener("click",()=>root.remove());
    console.error("IMC GW001 Match Report",error);
  }
}

installCss();
window.IMC_MATCH_REPORT_GW001={version:VERSION,openFixture:openFixture,clearCache:()=>{reportCache.clear();imageCache.clear();}};
})();