(function(){
"use strict";
if(window.__IMC_MATCH_REPORTS_ALL_WORLDS__)return;
window.__IMC_MATCH_REPORTS_ALL_WORLDS__=true;

const VERSION="1.0.0";
const ROOT_ID="imcMatchReportAllWorlds";
const STYLE_ID="imcMatchReportAllWorldsCss";
const reportCache=new Map();
const imageCache=new Map();
let client=null;

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9' ]+/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function img(v){v=clean(v);return v.startsWith("//")?"https:"+v:v;}
function initials(n){return clean(n).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";}
function prefix(world){return String(world||"").toLowerCase();}
function db(){
  if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;
  if(client)return client;
  try{const cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");if(window.supabase&&cfg&&cfg.url&&cfg.key)client=window.supabase.createClient(cfg.url,cfg.key);}catch(_){}
  return client;
}
function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
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
#${ROOT_ID} .imcmr-ratings-cols,#${ROOT_ID} .imcmr-rating-row{display:grid;grid-template-columns:25px minmax(0,1fr) 34px 42px 78px;gap:4px;align-items:center}
#${ROOT_ID} .imcmr-ratings-cols{padding:9px 9px;color:#758197;font-size:5.9px;font-weight:900;text-transform:uppercase;letter-spacing:.045em;border-bottom:1px solid #eef1f5}#${ROOT_ID} .imcmr-ratings-cols span:nth-child(n+3){text-align:center}
#${ROOT_ID} .imcmr-rating-row{min-height:52px;padding:7px 9px;border-top:1px solid #eef1f5;background:#fff}#${ROOT_ID} .imcmr-rating-row:first-child{border-top:0}
#${ROOT_ID} .imcmr-rating-num{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#173766;color:#fff;font-size:8px;font-weight:950}
#${ROOT_ID} .imcmr-rating-player{display:flex;align-items:center;gap:7px;min-width:0}#${ROOT_ID} .imcmr-rating-avatar{display:flex;align-items:flex-end;justify-content:center;flex:0 0 28px;width:28px;height:32px;border-radius:15px 15px 9px 9px;background:#edf2f8;overflow:hidden;border:1px solid #dce4ef}#${ROOT_ID} .imcmr-rating-avatar img{width:100%;height:100%;object-fit:contain;object-position:center bottom}#${ROOT_ID} .imcmr-rating-avatar b{font-size:7px;color:#173766}#${ROOT_ID} .imcmr-rating-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0b1833;font-size:7.4px;font-weight:850}
#${ROOT_ID} .imcmr-rating-min{text-align:center;color:#314765;font-size:8px;font-weight:900}#${ROOT_ID} .imcmr-rating-pill{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:25px;padding:0 6px;border-radius:8px;background:#173766;color:#fff;font-size:8px;font-weight:950;margin:auto}#${ROOT_ID} .imcmr-rating-pill.mid{background:#d4a12a}#${ROOT_ID} .imcmr-rating-pill.low{background:#b13a3a}#${ROOT_ID} .imcmr-rating-pill.empty{background:#edf1f6;color:#8190a3}
#${ROOT_ID} .imcmr-rating-events{display:flex;align-items:center;justify-content:flex-end;gap:4px;min-width:0;white-space:nowrap;color:#596b84;font-size:6.4px;font-weight:850}#${ROOT_ID} .goal{font-size:10px}#${ROOT_ID} .assist{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#173766;color:#fff;font-size:6px}#${ROOT_ID} .yc{width:8px;height:12px;border-radius:1px;background:#f4c631}#${ROOT_ID} .rc{width:8px;height:12px;border-radius:1px;background:#c83d3d}#${ROOT_ID} .in{color:#238b45}#${ROOT_ID} .out{color:#c83d3d}#${ROOT_ID} .cap{display:flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#e8edf4;color:#173766;font-size:6px}#${ROOT_ID} .mvp{color:#c69217;font-size:10px}
#${ROOT_ID} .imcmr-ratings-subhead{height:31px;display:flex;align-items:center;padding:0 12px;border-top:1px solid #dfe5ed;background:#f7f9fc;color:#173766;font-size:7px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
#${ROOT_ID} .imcmr-loading{padding:45px 12px;text-align:center;color:#6f7d91;font-size:10px;font-weight:850}
@media(min-width:520px){#${ROOT_ID} .imcmr-ratings-cols,#${ROOT_ID} .imcmr-rating-row{grid-template-columns:28px minmax(0,1fr) 42px 48px 100px;gap:6px}#${ROOT_ID} .imcmr-rating-row{padding-left:12px;padding-right:12px}.imcmr-rating-avatar{width:32px!important;height:36px!important;flex-basis:32px!important}}
`;
  document.head.appendChild(s);
}
async function loadReport(world,fixtureId){
  const key=`${world}:${fixtureId}`;if(reportCache.has(key))return reportCache.get(key);
  const p=(async()=>{const c=db();if(!c)throw new Error("Client Supabase non disponibile");const r=await c.from(`${prefix(world)}_match_reports`).select("report_id,sm_fixture_id,source_competition_name,stadium_name,attendance,parser_status,source_payload").eq("sm_fixture_id",Number(fixtureId)).eq("parser_status","complete").maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error("Match Report non trovato");return r.data;})();
  reportCache.set(key,p);try{return await p;}catch(e){reportCache.delete(key);throw e;}
}
async function loadImages(players){
  const missing=[...new Set((players||[]).map(p=>p.smPlayerId).filter(Boolean).map(String).filter(id=>!imageCache.has(id)))],c=db();
  for(let i=0;i<missing.length;i+=100){const r=await c.from("player_codex_global").select("player_id,image_url").in("player_id",missing.slice(i,i+100));if(r.error)throw r.error;(r.data||[]).forEach(x=>imageCache.set(String(x.player_id),img(x.image_url)));}
}
function prettyDate(v){if(!v)return"";const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?clean(v):d.toLocaleDateString("it-IT",{day:"2-digit",month:"long",year:"numeric"});}
function logoMarkup(name,url){return url?`<img src="${esc(img(url))}" alt="">`:`<span class="imcmr-logo-fallback">${esc(initials(name))}</span>`;}
function playerVariants(name){
  const n=norm(name),parts=n.split(" ").filter(Boolean),out=new Set([n]);
  if(parts.length>1){out.add(parts.slice(1).join(" "));out.add(parts[parts.length-1]);}
  return [...out].filter(x=>x.length>=3);
}
function scorerEvents(payload){
  const players=(payload.players||[]).filter(p=>Number(p.goals)>0),comments=(payload.commentary||[]).filter(c=>c&&((c.eventType==="goal")||/\b(gol|goal)\b/i.test(clean(c.rawText))));
  const goals=[],used=new Set();
  players.forEach(p=>{
    const variants=playerVariants(p.playerName),matches=comments.filter((c,i)=>!used.has(i)&&variants.some(v=>norm(c.rawText).includes(v)));
    const count=Math.max(0,Number(p.goals)||0);
    for(let j=0;j<count;j++){let minute=null;const idx=comments.indexOf(matches[j]);if(idx>=0){used.add(idx);minute=matches[j].minute;}goals.push({side:p.side,name:p.playerName,minute});}
  });
  return goals;
}
function scorersSideMarkup(goals,side){
  const arr=(goals||[]).filter(g=>g.side===side);if(!arr.length)return"";
  const by=new Map();arr.forEach(g=>{const k=clean(g.name);if(!by.has(k))by.set(k,[]);if(g.minute!=null)by.get(k).push(g.minute);});
  return [...by].map(([name,mins])=>`<span class="imcmr-scorer"><b>${esc(name)}</b>${mins.length?` <em>${mins.map(m=>`${m}'`).join(", ")}</em>`:""}</span>`).join("");
}
function statRow(label,h,a){
  h=Number(h)||0;a=Number(a)||0;const total=h+a,hp=total?Math.round(h/total*100):50,ap=100-hp;
  return `<div class="imcmr-stat"><b>${h}</b><div class="imcmr-stat-mid"><span>${esc(label)}</span><div class="imcmr-bar"><i style="width:${hp}%"></i><em style="width:${ap}%"></em></div></div><b>${a}</b></div>`;
}
function overviewMarkup(p){
  const h=p.teamStats&&p.teamStats.home||{},a=p.teamStats&&p.teamStats.away||{},mvp=(p.players||[]).find(x=>x.isManOfMatch);
  return `<section class="imcmr-card"><h3>Match Stats</h3>${statRow("Possession",h.possession,a.possession)}${statRow("Total Shots",h.totalShots,a.totalShots)}${statRow("Shots On Target",h.shotsOnTarget,a.shotsOnTarget)}${statRow("Corners",h.corners,a.corners)}${statRow("Yellow Cards",h.yellowCards,a.yellowCards)}${statRow("Red Cards",h.redCards,a.redCards)}</section>${mvp?`<section class="imcmr-card"><h3>Man Of The Match</h3><div class="imcmr-mvp"><span class="star">★</span><div><small>Player</small><strong>${esc(mvp.playerName)}</strong></div><span class="imcmr-rating-big">${mvp.rating==null?"-":esc(mvp.rating)}</span></div></section>`:""}`;
}
function subMinute(p,type){
  const explicit=type==="on"?p.subOnMinute:p.subOffMinute;if(explicit!=null)return Number(explicit);
  const raw=clean(p.metadata&&p.metadata.rawHtml);if(!raw)return null;
  const phrase=type==="on"?/Minuto entrato/i:/Minuto uscito/i;if(!phrase.test(raw))return null;
  const nums=[...raw.matchAll(/\((\d{1,3})\)/g)].map(m=>Number(m[1]));return nums.length?nums[0]:null;
}
function minutesPlayed(p){
  if(p.rating==null)return"";
  const on=subMinute(p,"on"),off=subMinute(p,"off"),end=90;
  if(p.isStarter)return String(Math.max(0,Math.min(end,off==null?end:off)));
  if(on!=null)return String(Math.max(0,end-on));
  return "";
}
function ratingClass(v){if(v==null)return"empty";v=Number(v);return v<6?"low":v<7?"mid":"";}
function ratingEvents(p){
  let html="";for(let i=0;i<(Number(p.goals)||0);i++)html+='<span class="goal">⚽</span>';
  for(let i=0;i<(Number(p.assists)||0);i++)html+='<span class="assist">A</span>';
  for(let i=0;i<(Number(p.yellowCards)||0);i++)html+='<span class="yc"></span>';
  for(let i=0;i<(Number(p.redCards)||0);i++)html+='<span class="rc"></span>';
  const on=subMinute(p,"on"),off=subMinute(p,"off");if(on!=null)html+=`<span class="in">↑${on}'</span>`;if(off!=null)html+=`<span class="out">↓${off}'</span>`;if(p.isCaptain)html+='<span class="cap">C</span>';if(p.isManOfMatch)html+='<span class="mvp">★</span>';return html;
}
function playerRow(p){
  const url=imageCache.get(String(p.smPlayerId))||"",rating=p.rating==null?"-":p.rating;
  return `<div class="imcmr-rating-row"><span class="imcmr-rating-num">${esc(p.lineupSlot||"")}</span><span class="imcmr-rating-player"><span class="imcmr-rating-avatar">${url?`<img src="${esc(url)}" alt="">`:`<b>${esc(initials(p.playerName))}</b>`}</span><span class="imcmr-rating-name">${esc(p.playerName)}</span></span><span class="imcmr-rating-min">${esc(minutesPlayed(p))}</span><span class="imcmr-rating-pill ${ratingClass(p.rating)}">${esc(rating)}</span><span class="imcmr-rating-events">${ratingEvents(p)}</span></div>`;
}
function ratingsMarkup(p,side,teamName,logo){
  const list=(p.players||[]).filter(x=>x.side===side).sort((a,b)=>(Number(a.lineupSlot)||99)-(Number(b.lineupSlot)||99)),starters=list.filter(x=>x.isStarter),subs=list.filter(x=>!x.isStarter);
  const teamLogo=logo?`<img src="${esc(img(logo))}" alt="">`:`<span>${esc(initials(teamName))}</span>`;
  return `<div class="imcmr-ratings-wrap"><div class="imcmr-ratings-team"><span class="imcmr-ratings-team-logo">${teamLogo}</span><strong>${esc(teamName)}</strong></div><div class="imcmr-ratings-cols"><span>#</span><span>Player</span><span>MIN</span><span>RAT</span><span>EVENTS</span></div>${starters.map(playerRow).join("")}${subs.length?`<div class="imcmr-ratings-subhead">Substitutes</div>${subs.map(playerRow).join("")}`:""}</div>`;
}
function openShell(){
  installCss();document.getElementById(ROOT_ID)?.remove();const root=document.createElement("section");root.id=ROOT_ID;root.innerHTML='<div class="imcmr-loading">Caricamento Match Report…</div>';document.body.appendChild(root);return root;
}
async function renderReport(world,report,logos,title){
  const root=document.getElementById(ROOT_ID);if(!root)return;const p=report.source_payload||{},match=p.match||{},result=p.result||{},homeName=clean(match.homeTeam||result.homeTeam||"Home"),awayName=clean(match.awayTeam||result.awayTeam||"Away"),hs=result.homeScore!=null?result.homeScore:match.homeScore,as=result.awayScore!=null?result.awayScore:match.awayScore,round=clean(result.sm_round_label||"Match Report"),penalty=result.decidedOnPenalties&&result.homePenalties!=null&&result.awayPenalties!=null?`Rigori ${result.homePenalties} - ${result.awayPenalties}`:"";
  await loadImages(p.players||[]);const goals=scorerEvents(p);
  root.innerHTML=`<header class="imcmr-top"><button data-imcmr-back>‹</button><div class="imcmr-title"><small>${esc(world)}</small><strong>${esc(title||report.source_competition_name||"Match Report")}</strong></div><span></span></header><main class="imcmr-main"><div class="imcmr-round-pill">${esc(round)}</div><section class="imcmr-hero"><div class="imcmr-scoreline"><div class="imcmr-side">${logoMarkup(homeName,logos.home)}<strong>${esc(homeName)}</strong></div><div><div class="imcmr-score">${esc(hs)} - ${esc(as)}</div>${penalty?`<div class="imcmr-penalty">${esc(penalty)}</div>`:""}</div><div class="imcmr-side">${logoMarkup(awayName,logos.away)}<strong>${esc(awayName)}</strong></div></div><div class="imcmr-scorers"><div class="imcmr-scorer-side">${scorersSideMarkup(goals,"home")}</div><div class="imcmr-scorer-side away">${scorersSideMarkup(goals,"away")}</div></div><div class="imcmr-meta">${esc(prettyDate(match.matchDate||""))}<br>${esc(report.stadium_name||match.stadium||"")}${report.attendance!=null?` · ${Number(report.attendance).toLocaleString("it-IT")} spettatori`:""}</div></section><nav class="imcmr-tabs"><button data-imcmr-tab="overview" class="active">Overview</button><button data-imcmr-tab="home-ratings">Home Ratings</button><button data-imcmr-tab="away-ratings">Away Ratings</button></nav><section class="imcmr-panel active" data-imcmr-panel="overview">${overviewMarkup(p)}</section><section class="imcmr-panel" data-imcmr-panel="home-ratings">${ratingsMarkup(p,"home",homeName,logos.home)}</section><section class="imcmr-panel" data-imcmr-panel="away-ratings">${ratingsMarkup(p,"away",awayName,logos.away)}</section></main>`;
  root.querySelector("[data-imcmr-back]")?.addEventListener("click",()=>root.remove());root.querySelectorAll("[data-imcmr-tab]").forEach(btn=>btn.addEventListener("click",()=>{const tab=btn.dataset.imcmrTab;root.querySelectorAll("[data-imcmr-tab]").forEach(x=>x.classList.toggle("active",x===btn));root.querySelectorAll("[data-imcmr-panel]").forEach(x=>x.classList.toggle("active",x.dataset.imcmrPanel===tab));}));
}
async function openFixture(world,fixtureId,logos,title){
  if(!world||fixtureId==null)return;openShell();
  try{await renderReport(world,await loadReport(world,fixtureId),logos||{home:"",away:""},title);}catch(e){const root=document.getElementById(ROOT_ID);if(root)root.innerHTML=`<header class="imcmr-top"><button data-imcmr-back>‹</button><div class="imcmr-title"><small>${esc(world)}</small><strong>${esc(title||"Match Report")}</strong></div><span></span></header><div class="imcmr-loading">${esc(e&&e.message||"Errore Match Report")}</div>`;root?.querySelector("[data-imcmr-back]")?.addEventListener("click",()=>root.remove());}
}
installCss();
window.IMC_MATCH_REPORTS={version:VERSION,openFixture,clearCache:()=>{reportCache.clear();imageCache.clear();}};
})();
