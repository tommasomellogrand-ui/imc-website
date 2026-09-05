(function(){
"use strict";

const VERSION="1.0.2-build56-gw";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const OID="imcPlayerCodexGw";
const PAGE_SIZE=500;
const STEP=60;

if(!window.supabase)return;
let cfg=null;try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY);
const cache=new Map();
const ui={world:"",name:"",rows:[],q:"",sort:"rating_desc",limit:STEP};

const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const img=v=>{const x=String(v||"").trim();return x.startsWith("//")?"https:"+x:x;};
const valid=id=>/^GW(?:00[1-9]|010)$/.test(String(id||""));
const tableOf=id=>String(id).toLowerCase()+"_player_codex";

function currentWorld(){
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=String(guard.currentWorld()||"");
    if(valid(id))return id;
  }
  const tagged=document.querySelector(".nx-world-nav [data-imc-codex-world]");
  if(tagged&&valid(tagged.getAttribute("data-imc-codex-world")))return tagged.getAttribute("data-imc-codex-world");
  const text=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong")?.textContent||"";
  const map={"road to history":"GW001","gold 558":"GW002","gold 557":"GW003","world league":"GW004","hall of famers":"GW005","master league world":"GW006","the four kingdoms":"GW007","gold 1":"GW008","kick off":"GW009","sensible soccer academy":"GW010"};
  return map[norm(text)]||"";
}

function worldName(id){
  const el=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong");
  const text=String(el&&el.textContent||"").trim();
  if(text&&!/^GW\d{3}$/i.test(text))return text;
  const names={GW001:"Road To History",GW002:"Gold 558",GW003:"Gold 557",GW004:"World League",GW005:"Hall Of Famers",GW006:"Master League World",GW007:"The Four Kingdoms",GW008:"Gold 1",GW009:"Kick Off",GW010:"Sensible Soccer Academy"};
  return names[id]||id;
}

function css(){
  if(document.getElementById("imcPlayerCodexGwCss"))return;
  const s=document.createElement("style");s.id="imcPlayerCodexGwCss";
  s.textContent=`
#${OID}{position:fixed;inset:0;z-index:2147483600;overflow:auto;background:#f3f6fb;color:#0b1833;font-family:inherit;-webkit-overflow-scrolling:touch}#${OID} *{box-sizing:border-box}
.pcg-top{position:sticky;top:0;z-index:5;border-bottom:1px solid #dce3ee;background:rgba(243,246,251,.97);backdrop-filter:blur(16px)}.pcg-topin{max-width:900px;margin:auto;display:grid;grid-template-columns:46px 1fr 46px;gap:9px;align-items:center;padding:10px 12px}.pcg-top button{width:42px;height:42px;border:1px solid #d4deea;border-radius:13px;background:#fff;color:#173766;font:inherit;font-size:20px;font-weight:950}.pcg-title{text-align:center;min-width:0}.pcg-title small{display:block;color:#7d899b;font-size:8px;font-weight:950;letter-spacing:.12em}.pcg-title strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:1000}
.pcg-main{max-width:900px;margin:auto;padding:14px 12px 30px}.pcg-hero{position:relative;overflow:hidden;padding:21px 18px;border-radius:22px;background:linear-gradient(135deg,#061631,#0d3470 62%,#102552);color:#fff;box-shadow:0 12px 30px rgba(7,26,59,.13)}.pcg-hero:after{content:"CODEX";position:absolute;right:-8px;bottom:-17px;color:rgba(255,255,255,.05);font-size:68px;font-weight:1000;letter-spacing:-.06em}.pcg-hero small{display:block;color:#d9ad45;font-size:9px;font-weight:950;letter-spacing:.14em}.pcg-hero h1{margin:6px 0 5px;font-size:27px;line-height:1;font-weight:1000}.pcg-hero p{margin:0;color:#dbe6f7;font-size:10px;font-weight:750}
.pcg-kpis{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0}.pcg-kpi{padding:12px 13px;border:1px solid #dde4ef;border-radius:15px;background:#fff}.pcg-kpi strong{display:block;color:#0d2b5d;font-size:21px;line-height:1;font-weight:1000}.pcg-kpi span{display:block;margin-top:5px;color:#7b879a;font-size:8px;font-weight:900;text-transform:uppercase}
.pcg-tools{display:grid;grid-template-columns:minmax(0,1fr) 145px;gap:8px;margin:10px 0}.pcg-tools input,.pcg-tools select{width:100%;height:46px;border:1px solid #d9e1ec;border-radius:13px;background:#fff;color:#172b50;padding:0 11px;font:inherit;font-weight:850}.pcg-tools input{font-size:16px}.pcg-tools select{font-size:10px}
.pcg-status{padding:12px;color:#75839a;font-size:9px;font-weight:900}.pcg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pcg-card{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:11px;align-items:start;padding:12px;border:1px solid #dde4ee;border-radius:18px;background:#fff;box-shadow:0 5px 16px rgba(15,35,70,.035)}.pcg-photo{width:64px;height:64px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:16px;background:#edf2f7;color:#7c8ca3;font-size:18px;font-weight:1000}.pcg-photo img{width:100%;height:100%;object-fit:cover}.pcg-copy{min-width:0}.pcg-copy small{display:block;color:#8190a6;font-size:7px;font-weight:900}.pcg-copy h3{margin:4px 0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0b1833;font-size:14px;font-weight:1000}.pcg-meta{display:flex;flex-wrap:wrap;gap:4px 7px;color:#66758c;font-size:8px;font-weight:800}.pcg-value{display:block;margin-top:7px;color:#304668;font-size:9px;font-weight:950}.pcg-rating{min-width:46px;padding:8px 7px;border-radius:13px;background:#0d2b5d;color:#fff;text-align:center}.pcg-rating strong{display:block;font-size:17px;line-height:1;font-weight:1000}.pcg-rating span{display:block;margin-top:4px;font-size:6px;font-weight:900}.pcg-more{width:100%;height:46px;margin-top:10px;border:1px solid #cbd7e7;border-radius:14px;background:#fff;color:#27559c;font:inherit;font-size:10px;font-weight:1000}.pcg-more[hidden]{display:none}.pcg-empty{grid-column:1/-1;padding:24px;border:1px dashed #ccd7e6;border-radius:16px;background:#fff;color:#748096;text-align:center;font-size:10px;font-weight:850}
@media(max-width:620px){.pcg-grid{grid-template-columns:1fr}.pcg-tools{grid-template-columns:1fr}.pcg-card{grid-template-columns:58px minmax(0,1fr) auto}.pcg-photo{width:58px;height:58px}.pcg-main{padding-left:10px;padding-right:10px}}
`;
  document.head.appendChild(s);
}

async function loadRows(id,force){
  if(cache.has(id)&&!force)return cache.get(id);
  const out=[];let from=0;const table=tableOf(id);
  while(true){
    const r=await db.from(table).select("player_id,player_name,full_name,age,nationality,position,foot,rating,market_value,image_url,date_of_birth,height_cm,weight_kg").order("player_id",{ascending:true}).range(from,from+PAGE_SIZE-1);
    if(r.error)throw r.error;
    const page=r.data||[];out.push(...page);
    if(page.length<PAGE_SIZE)break;
    from+=PAGE_SIZE;
  }
  cache.set(id,out);return out;
}

function initials(row){const name=String(row.full_name||row.player_name||"?");return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();}
function nameOf(row){return String(row.full_name||row.player_name||("Player "+row.player_id));}
function currentRows(){
  const q=norm(ui.q);let rows=ui.rows.slice();
  if(q)rows=rows.filter(x=>norm([nameOf(x),x.player_id,x.nationality,x.position,x.foot].join(" ")).includes(q));
  rows.sort((a,b)=>{
    if(ui.sort==="name_asc")return nameOf(a).localeCompare(nameOf(b),"it");
    if(ui.sort==="age_asc")return Number(a.age??999)-Number(b.age??999)||nameOf(a).localeCompare(nameOf(b),"it");
    return Number(b.rating??-1)-Number(a.rating??-1)||nameOf(a).localeCompare(nameOf(b),"it");
  });
  return rows;
}
function card(row){
  const photo=img(row.image_url),name=nameOf(row);
  return `<article class="pcg-card"><div class="pcg-photo">${photo?`<img src="${esc(photo)}" alt="${esc(name)}" loading="lazy" onerror="this.remove()">`:esc(initials(row))}</div><div class="pcg-copy"><small>PLAYER ID ${esc(row.player_id)}</small><h3>${esc(name)}</h3><div class="pcg-meta"><span>${esc(row.nationality||"—")}</span><span>${esc(row.position||"—")}</span><span>${row.age!=null?esc(row.age)+" anni":"—"}</span>${row.foot?`<span>${esc(row.foot)}</span>`:""}</div><span class="pcg-value">${esc(row.market_value||"—")}</span></div><div class="pcg-rating"><strong>${row.rating!=null?esc(row.rating):"—"}</strong><span>OVR</span></div></article>`;
}
function render(){
  const grid=document.getElementById("pcgGrid"),status=document.getElementById("pcgStatus"),more=document.getElementById("pcgMore");if(!grid)return;
  const rows=currentRows(),visible=rows.slice(0,ui.limit);
  grid.innerHTML=visible.map(card).join("")||'<div class="pcg-empty">Nessun giocatore trovato.</div>';
  if(status)status.textContent=rows.length.toLocaleString("it-IT")+" giocatori";
  if(more){more.hidden=visible.length>=rows.length;more.textContent="CARICA ALTRI · "+Math.min(STEP,rows.length-visible.length);}
}
async function hydrate(force){
  const grid=document.getElementById("pcgGrid"),status=document.getElementById("pcgStatus");
  if(grid)grid.innerHTML='<div class="pcg-empty">Caricamento Player Codex…</div>';
  try{
    ui.rows=await loadRows(ui.world,force);ui.q="";ui.sort="rating_desc";ui.limit=STEP;
    const count=document.getElementById("pcgCount");if(count)count.textContent=ui.rows.length.toLocaleString("it-IT");
    render();
  }catch(e){console.error("IMC Player Codex",ui.world,e);if(status)status.textContent="Errore Codex";if(grid)grid.innerHTML=`<div class="pcg-empty">Impossibile caricare ${esc(tableOf(ui.world))}.</div>`;}
}
function open(id){
  id=valid(id)?id:currentWorld();if(!valid(id))return;
  syncMenus();
  ui.world=id;ui.name=worldName(id);
  css();document.getElementById(OID)?.remove();
  const o=document.createElement("section");o.id=OID;
  o.innerHTML=`<header class="pcg-top"><div class="pcg-topin"><button id="pcgBack" type="button">‹</button><div class="pcg-title"><small>${esc(id)} · ${esc(ui.name).toUpperCase()}</small><strong>Player Codex</strong></div><button id="pcgRefresh" type="button">↻</button></div></header><main class="pcg-main"><section class="pcg-hero"><small>IMC · PLAYER DATABASE</small><h1>Player Codex</h1><p>Dati esclusivamente da ${esc(tableOf(id))}.</p></section><section class="pcg-kpis"><div class="pcg-kpi"><strong id="pcgCount">…</strong><span>Giocatori</span></div></section><section class="pcg-tools"><input id="pcgSearch" type="search" placeholder="Cerca giocatore, ID, ruolo…" autocomplete="off"><select id="pcgSort"><option value="rating_desc">Rating ↓</option><option value="name_asc">Nome A–Z</option><option value="age_asc">Età ↑</option></select></section><div id="pcgStatus" class="pcg-status">Caricamento…</div><section id="pcgGrid" class="pcg-grid"></section><button id="pcgMore" class="pcg-more" type="button" hidden>CARICA ALTRI</button></main>`;
  document.body.appendChild(o);document.body.style.overflow="hidden";
  document.getElementById("pcgBack").onclick=()=>{o.remove();document.body.style.overflow="";};
  document.getElementById("pcgRefresh").onclick=()=>hydrate(true);
  document.getElementById("pcgSearch").oninput=e=>{ui.q=e.target.value||"";ui.limit=STEP;render();};
  document.getElementById("pcgSort").onchange=e=>{ui.sort=e.target.value||"rating_desc";ui.limit=STEP;render();};
  document.getElementById("pcgMore").onclick=()=>{ui.limit+=STEP;render();};
  hydrate(false);
}

function syncMenus(){
  const id=currentWorld();if(!valid(id))return;
  const bottom=document.querySelector(".nx-bottom.nx-bottom-b6");
  if(bottom)bottom.querySelectorAll('[data-world-section="player-codex"],[data-imc-codex-world]').forEach(el=>el.remove());
  const nav=document.querySelector(".nx-world-nav");if(!nav)return;
  let b=nav.querySelector('[data-world-section="player-codex"],[data-imc-codex-world]');
  if(!b){
    b=document.createElement("button");b.type="button";b.innerHTML='<b>▣</b><span>PLAYER CODEX</span>';nav.insertBefore(b,nav.firstChild);
  }
  b.setAttribute("data-world-section","player-codex");
  b.setAttribute("data-imc-codex-world",id);
}

syncMenus();

document.addEventListener("click",function(e){
  const gwSwitch=e.target&&e.target.closest&&e.target.closest("[data-select-world],[data-world-id],[data-game-world-id],[data-world]");
  if(gwSwitch)setTimeout(syncMenus,120);

  const b=e.target&&e.target.closest&&e.target.closest('.nx-world-nav [data-world-section="player-codex"],.nx-world-nav [data-imc-codex-world]');
  if(!b)return;
  const id=b.getAttribute("data-imc-codex-world")||currentWorld();if(!valid(id))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open(id);
},true);

window.IMC_PLAYER_CODEX_GW={version:VERSION,open,refresh:id=>{if(valid(id))ui.world=id;return hydrate(true);},syncMenus};
})();
