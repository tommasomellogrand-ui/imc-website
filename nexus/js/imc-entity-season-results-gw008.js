(function(){
"use strict";
if(window.__IMC_ENTITY_SEASON_RESULTS_GW008__)return;
window.__IMC_ENTITY_SEASON_RESULTS_GW008__=true;

const VERSION="1.0.1";
const WORLD="GW008";
const STYLE_ID="imcEntitySeasonResultsGw008Css";
const SELECT="raw_match_id,season_number,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,home_penalties,away_penalties,decided_on_penalties,penalty_winner_name,penalty_text,sm_action,sm_round_label,competition_key";
let timer=null,observer=null;
const cache=new Map();

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function db(){return window.__IMC_NEXUS_CLIENT__||null;}
function root(){return document.querySelector(`#pageRoot > [data-imc-entities-world="${WORLD}"]`);}
function detailArticle(){const r=root();return r?r.querySelector(".imc-ent8-detail"):null;}
function currentDetail(){
  const r=root();if(!r||!detailArticle())return null;
  const tab=r.querySelector('.imc-ent8-tab.is-active[data-ent-tab]');
  const type=tab&&tab.getAttribute("data-ent-tab")==="nations"?"nation":"club";
  const fields=[...r.querySelectorAll(".imc-ent8-field")];
  const idField=fields.find(f=>clean(f.querySelector("span")&&f.querySelector("span").textContent).toLowerCase()==="id globale");
  const id=clean(idField&&idField.querySelector("strong")&&idField.querySelector("strong").textContent);
  return id?{type,id}:null;
}
function formatDate(v){const s=clean(v);if(!s)return"-";const d=new Date(`${s}T12:00:00`);if(Number.isNaN(d.getTime()))return s;return d.toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.imc-ent8-season-results{margin-top:16px}.imc-ent8-season-results>h3{margin:0 0 10px;color:#091c46;font-size:13px;font-weight:950;letter-spacing:-.01em}.imc-ent8-season-note{margin:0 0 12px;color:#7b8799;font-size:7px;font-weight:850}
.imc-ent8-comp-block{margin-top:10px;border:1px solid #dfe5ed;border-radius:14px;background:#fff;overflow:hidden}.imc-ent8-comp-head{padding:10px 11px;border-bottom:1px solid #edf1f5;background:#fafbfd}.imc-ent8-comp-head strong{display:block;color:#0a255d;font-size:9px;font-weight:950;line-height:1.25;word-break:break-word}.imc-ent8-comp-head span{display:block;margin-top:3px;color:#8b96a8;font-size:6px;font-weight:900;text-transform:uppercase}
.imc-ent8-comp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:#edf1f5;border-bottom:1px solid #edf1f5}.imc-ent8-comp-stat{padding:8px 4px;background:#fff;text-align:center}.imc-ent8-comp-stat strong{display:block;color:#0a255d;font-size:10px;font-weight:950}.imc-ent8-comp-stat span{display:block;margin-top:2px;color:#8b96a8;font-size:5.5px;font-weight:900;text-transform:uppercase}
.imc-ent8-match-list{display:grid}.imc-ent8-match{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 10px;border-top:1px solid #edf1f5}.imc-ent8-match:first-child{border-top:0}.imc-ent8-match-date{color:#7b8799;font-size:6.5px;font-weight:900}.imc-ent8-match-main strong{display:block;color:#091c46;font-size:8px;font-weight:950;line-height:1.2}.imc-ent8-match-main span{display:block;margin-top:3px;color:#7b8799;font-size:6px;font-weight:850}.imc-ent8-match-score{min-width:42px;text-align:right;color:#0a255d;font-size:10px;font-weight:950}.imc-ent8-match-score small{display:block;margin-top:2px;color:#7b8799;font-size:5.5px;font-weight:850}.imc-ent8-season-loading,.imc-ent8-season-empty,.imc-ent8-season-error{padding:14px;border:1px solid #dfe5ed;border-radius:14px;background:#fafbfd;color:#7b8799;text-align:center;font-size:8px;font-weight:850}.imc-ent8-season-error{color:#9d3030}
@media(max-width:430px){.imc-ent8-comp-stats{grid-template-columns:repeat(4,minmax(0,1fr))}.imc-ent8-match{grid-template-columns:52px minmax(0,1fr) auto}}
`;document.head.appendChild(s);
}

async function allFiltered(side,name){
  const c=db();if(!c)throw new Error("Client Supabase non disponibile");
  const out=[];let from=0;
  while(true){
    const r=await c.from("gw008_results").select(SELECT).eq(side,name).range(from,from+999);
    if(r.error)throw r.error;
    const rows=r.data||[];out.push(...rows);
    if(rows.length<1000)break;from+=1000;
  }
  return out;
}

async function resolveEntityName(type,id){
  const c=db();if(!c)throw new Error("Client Supabase non disponibile");
  if(type==="nation"){
    const r=await c.from("national_team_codex_global").select("id,n").eq("id",id).limit(1);
    if(r.error)throw r.error;
    const row=(r.data||[])[0];return clean(row&&row.n);
  }
  const r=await c.from("gw008_gw_teams").select("sm_club_id,club_name").eq("sm_club_id",id).limit(1);
  if(r.error)throw r.error;
  const row=(r.data||[])[0];return clean(row&&row.club_name);
}

async function loadEntity(type,id,force){
  const key=`${type}:${id}`;
  if(cache.has(key)&&!force)return cache.get(key);
  const p=(async()=>{
    const name=await resolveEntityName(type,id);
    if(!name)return {name:"",matches:[]};
    const [home,away]=await Promise.all([allFiltered("home_name",name),allFiltered("away_name",name)]);
    const seen=new Set(),matches=[];
    [...home,...away].forEach(m=>{const k=String(m.raw_match_id==null?`${m.source_page_date}|${m.home_name}|${m.away_name}|${m.competition_key}`:m.raw_match_id);if(seen.has(k))return;seen.add(k);matches.push(m);});
    matches.sort((a,b)=>clean(b.source_page_date).localeCompare(clean(a.source_page_date))||(Number(b.raw_match_id||0)-Number(a.raw_match_id||0)));
    return {name,matches};
  })();
  cache.set(key,p);
  try{return await p;}catch(e){cache.delete(key);throw e;}
}

function matchView(m,name){
  const home=norm(m.home_name)===norm(name),own=home?m.home_score:m.away_score,opp=home?m.away_score:m.home_score,opponent=home?m.away_name:m.home_name;
  const ownPen=home?m.home_penalties:m.away_penalties,oppPen=home?m.away_penalties:m.home_penalties;
  return {home,own:Number(own||0),opp:Number(opp||0),opponent:clean(opponent),ownPen,oppPen};
}

function summary(matches,name,key){
  let pg=0,w=0,d=0,l=0,gf=0,ga=0,pts=0;
  matches.forEach(m=>{const x=matchView(m,name);pg++;gf+=x.own;ga+=x.opp;if(x.own>x.opp){w++;pts+=3;}else if(x.own<x.opp){l++;}else{d++;pts+=1;}});
  const showPoints=matches.some(m=>clean(m.sm_action).toLowerCase()==="league")&&!clean(key).toUpperCase().includes("PLAYOFF");
  return {pg,w,d,l,gf,ga,gd:gf-ga,pts,showPoints};
}

function stat(label,value){return `<div class="imc-ent8-comp-stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;}
function resultText(m,name){const x=matchView(m,name);let text=`${x.own} - ${x.opp}`;if(m.decided_on_penalties&&x.ownPen!=null&&x.oppPen!=null)text+=` (${x.ownPen}-${x.oppPen} rig.)`;return text;}
function matchRow(m,name){const x=matchView(m,name),round=clean(m.sm_round_label),where=x.home?"Casa":"Trasferta";return `<div class="imc-ent8-match"><div class="imc-ent8-match-date">${esc(formatDate(m.source_page_date))}</div><div class="imc-ent8-match-main"><strong>${esc(x.opponent)}</strong><span>${esc(where)}${round?` · ${esc(round)}`:""}</span></div><div class="imc-ent8-match-score">${esc(resultText(m,name))}</div></div>`;}

function competitionBlock(key,matches,name){
  const s=summary(matches,name,key),season=[...new Set(matches.map(m=>m.season_number).filter(v=>v!=null))];
  const stats=[stat("PG",s.pg),stat("V",s.w),stat("N",s.d),stat("P",s.l),stat("GF",s.gf),stat("GS",s.ga),stat("DR",s.gd>0?`+${s.gd}`:s.gd)];
  if(s.showPoints)stats.push(stat("PTS",s.pts));
  return `<section class="imc-ent8-comp-block"><div class="imc-ent8-comp-head"><strong>${esc(key)}</strong><span>${season.length===1?`Stagione ${esc(season[0])}`:`${matches.length} partite`}</span></div><div class="imc-ent8-comp-stats">${stats.join("")}</div><div class="imc-ent8-match-list">${matches.map(m=>matchRow(m,name)).join("")}</div></section>`;
}

function renderLoading(){const a=detailArticle();if(!a||a.querySelector("[data-imc-season-results]"))return;const box=document.createElement("section");box.className="imc-ent8-season-results";box.setAttribute("data-imc-season-results","");box.innerHTML=`<h3>RISULTATI STAGIONALI</h3><div class="imc-ent8-season-loading">Caricamento risultati…</div>`;a.appendChild(box);}
function renderData(data){const a=detailArticle();if(!a)return;let box=a.querySelector("[data-imc-season-results]");if(!box){box=document.createElement("section");box.className="imc-ent8-season-results";box.setAttribute("data-imc-season-results","");a.appendChild(box);}if(!data.matches.length){box.innerHTML=`<h3>RISULTATI STAGIONALI</h3><div class="imc-ent8-season-empty">Nessun risultato importato.</div>`;return;}const groups=new Map();data.matches.forEach(m=>{const key=clean(m.competition_key)||"SENZA COMPETITION KEY";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);});const keys=[...groups.keys()].sort((a,b)=>a.localeCompare(b,"it"));box.innerHTML=`<h3>RISULTATI STAGIONALI</h3><p class="imc-ent8-season-note">Divisi per competition_key</p>${keys.map(k=>competitionBlock(k,groups.get(k),data.name)).join("")}`;}
function renderError(e){const a=detailArticle();if(!a)return;let box=a.querySelector("[data-imc-season-results]");if(!box){box=document.createElement("section");box.className="imc-ent8-season-results";box.setAttribute("data-imc-season-results","");a.appendChild(box);}box.innerHTML=`<h3>RISULTATI STAGIONALI</h3><div class="imc-ent8-season-error">${esc(e&&e.message||"Caricamento risultati non riuscito")}</div>`;}

async function apply(force){
  const detail=currentDetail();
  if(!detail||!detailArticle())return;
  installStyles();renderLoading();
  try{renderData(await loadEntity(detail.type,detail.id,!!force));}catch(e){renderError(e);}
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>apply(false),70);}
function start(){
  installStyles();
  observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_ENTITY_SEASON_RESULTS_GW008={version:VERSION,refresh:()=>{const d=currentDetail();if(d)cache.delete(`${d.type}:${d.id}`);apply(true);},clearCache:()=>cache.clear()};
})();