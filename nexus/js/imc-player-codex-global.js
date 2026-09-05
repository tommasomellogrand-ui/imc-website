(function(){
"use strict";

const VERSION="1.0-build56-global";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const TABLE="player_codex_global";
const OID="imcPlayerCodexGlobal";
const PAGE_SIZE=60;

if(!window.supabase)return;
let cfg=null;try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY);
const ui={rows:[],q:"",sort:"rating_desc",page:0,total:0,loading:false};

const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const img=v=>{const x=String(v||"").trim();return x.startsWith("//")?"https:"+x:x;};
const nameOf=row=>String(row.full_name||row.player_name||("Player "+row.player_id));
const initials=row=>nameOf(row).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();

function css(){
  if(document.getElementById("imcPlayerCodexGlobalCss"))return;
  const s=document.createElement("style");s.id="imcPlayerCodexGlobalCss";
  s.textContent=`
#${OID}{position:fixed;inset:0;z-index:2147483700;overflow:auto;background:#f3f6fb;color:#0b1833;font-family:inherit;-webkit-overflow-scrolling:touch}#${OID} *{box-sizing:border-box}.pcgl-top{position:sticky;top:0;z-index:5;border-bottom:1px solid #dce3ee;background:rgba(243,246,251,.97);backdrop-filter:blur(16px)}.pcgl-topin{max-width:1000px;margin:auto;display:grid;grid-template-columns:46px 1fr 46px;gap:9px;align-items:center;padding:10px 12px}.pcgl-top button{width:42px;height:42px;border:1px solid #d4deea;border-radius:13px;background:#fff;color:#173766;font:inherit;font-size:20px;font-weight:950}.pcgl-title{text-align:center;min-width:0}.pcgl-title small{display:block;color:#7d899b;font-size:8px;font-weight:950;letter-spacing:.12em}.pcgl-title strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:1000}.pcgl-main{max-width:1000px;margin:auto;padding:14px 12px 30px}.pcgl-hero{position:relative;overflow:hidden;padding:21px 18px;border-radius:22px;background:linear-gradient(135deg,#061631,#0d3470 62%,#102552);color:#fff;box-shadow:0 12px 30px rgba(7,26,59,.13)}.pcgl-hero:after{content:"GLOBAL";position:absolute;right:-8px;bottom:-17px;color:rgba(255,255,255,.05);font-size:62px;font-weight:1000;letter-spacing:-.06em}.pcgl-hero small{display:block;color:#d9ad45;font-size:9px;font-weight:950;letter-spacing:.14em}.pcgl-hero h1{margin:6px 0 5px;font-size:27px;line-height:1;font-weight:1000}.pcgl-hero p{margin:0;color:#dbe6f7;font-size:10px;font-weight:750}.pcgl-kpis{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0}.pcgl-kpi{padding:12px 13px;border:1px solid #dde4ef;border-radius:15px;background:#fff}.pcgl-kpi strong{display:block;color:#0d2b5d;font-size:21px;line-height:1;font-weight:1000}.pcgl-kpi span{display:block;margin-top:5px;color:#7b879a;font-size:8px;font-weight:900;text-transform:uppercase}.pcgl-tools{display:grid;grid-template-columns:minmax(0,1fr) 145px;gap:8px;margin:10px 0}.pcgl-tools input,.pcgl-tools select{width:100%;height:46px;border:1px solid #d9e1ec;border-radius:13px;background:#fff;color:#172b50;padding:0 11px;font:inherit;font-weight:850}.pcgl-tools input{font-size:16px}.pcgl-tools select{font-size:10px}.pcgl-status{padding:12px;color:#75839a;font-size:9px;font-weight:900}.pcgl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pcgl-card{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:11px;align-items:start;padding:12px;border:1px solid #dde4ee;border-radius:18px;background:#fff;box-shadow:0 5px 16px rgba(15,35,70,.035)}.pcgl-photo{width:64px;height:64px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:16px;background:#edf2f7;color:#7c8ca3;font-size:18px;font-weight:1000}.pcgl-photo img{width:100%;height:100%;object-fit:cover}.pcgl-copy{min-width:0}.pcgl-copy small{display:block;color:#8190a6;font-size:7px;font-weight:900}.pcgl-copy h3{margin:4px 0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0b1833;font-size:14px;font-weight:1000}.pcgl-meta{display:flex;flex-wrap:wrap;gap:4px 7px;color:#66758c;font-size:8px;font-weight:800}.pcgl-value{display:block;margin-top:7px;color:#304668;font-size:9px;font-weight:950}.pcgl-rating{min-width:46px;padding:8px 7px;border-radius:13px;background:#0d2b5d;color:#fff;text-align:center}.pcgl-rating strong{display:block;font-size:17px;line-height:1;font-weight:1000}.pcgl-rating span{display:block;margin-top:4px;font-size:6px;font-weight:900}.pcgl-more{width:100%;height:46px;margin-top:10px;border:1px solid #cbd7e7;border-radius:14px;background:#fff;color:#27559c;font:inherit;font-size:10px;font-weight:1000}.pcgl-more[hidden]{display:none}.pcgl-empty{grid-column:1/-1;padding:24px;border:1px dashed #ccd7e6;border-radius:16px;background:#fff;color:#748096;text-align:center;font-size:10px;font-weight:850}@media(max-width:620px){.pcgl-grid{grid-template-columns:1fr}.pcgl-tools{grid-template-columns:1fr}.pcgl-card{grid-template-columns:58px minmax(0,1fr) auto}.pcgl-photo{width:58px;height:58px}.pcgl-main{padding-left:10px;padding-right:10px}}
`;
  document.head.appendChild(s);
}

function queryBase(){
  let q=db.from(TABLE).select("player_id,player_name,full_name,age,date_of_birth,nationality,position,foot,height_cm,weight_kg,rating,old_rating,market_value,soccer_wiki_club,image_url,history",{count:"exact"});
  const needle=String(ui.q||"").trim();
  if(needle){
    const safe=needle.replace(/[(),]/g," ").trim();
    if(/^\d+$/.test(safe)) q=q.or(`player_id.eq.${safe},full_name.ilike.%${safe}%,player_name.ilike.%${safe}%`);
    else q=q.or(`full_name.ilike.%${safe}%,player_name.ilike.%${safe}%,nationality.ilike.%${safe}%,position.ilike.%${safe}%`);
  }
  if(ui.sort==="name_asc")q=q.order("full_name",{ascending:true,nullsFirst:false}).order("player_id",{ascending:true});
  else if(ui.sort==="age_asc")q=q.order("age",{ascending:true,nullsFirst:false}).order("full_name",{ascending:true,nullsFirst:false});
  else q=q.order("rating",{ascending:false,nullsFirst:false}).order("full_name",{ascending:true,nullsFirst:false});
  return q;
}

async function load(reset){
  if(ui.loading)return;ui.loading=true;
  const status=document.getElementById("pcglStatus"),grid=document.getElementById("pcglGrid");
  if(reset){ui.page=0;ui.rows=[];if(grid)grid.innerHTML='<div class="pcgl-empty">Caricamento Player Codex…</div>';}
  try{
    const from=ui.page*PAGE_SIZE,to=from+PAGE_SIZE-1;
    const r=await queryBase().range(from,to);if(r.error)throw r.error;
    ui.total=Number(r.count||0);ui.rows=reset?(r.data||[]):ui.rows.concat(r.data||[]);ui.page+=1;
    render();
  }catch(e){console.error("IMC Global Player Codex",e);if(status)status.textContent="Errore Codex";if(grid)grid.innerHTML='<div class="pcgl-empty">Impossibile caricare player_codex_global.</div>';}
  finally{ui.loading=false;}
}

function card(row){
  const photo=img(row.image_url),name=nameOf(row);
  return `<article class="pcgl-card"><div class="pcgl-photo">${photo?`<img src="${esc(photo)}" alt="${esc(name)}" loading="lazy" onerror="this.remove()">`:esc(initials(row))}</div><div class="pcgl-copy"><small>PLAYER ID ${esc(row.player_id)}</small><h3>${esc(name)}</h3><div class="pcgl-meta"><span>${esc(row.nationality||"—")}</span><span>${esc(row.position||"—")}</span><span>${row.age!=null?esc(row.age)+" anni":"—"}</span>${row.foot?`<span>${esc(row.foot)}</span>`:""}</div><span class="pcgl-value">${esc(row.market_value||"—")}</span></div><div class="pcgl-rating"><strong>${row.rating!=null?esc(row.rating):"—"}</strong><span>OVR</span></div></article>`;
}

function render(){
  const grid=document.getElementById("pcglGrid"),status=document.getElementById("pcglStatus"),more=document.getElementById("pcglMore"),count=document.getElementById("pcglCount");if(!grid)return;
  grid.innerHTML=ui.rows.map(card).join("")||'<div class="pcgl-empty">Nessun giocatore trovato.</div>';
  if(status)status.textContent=ui.total.toLocaleString("it-IT")+" giocatori";
  if(count)count.textContent=ui.total.toLocaleString("it-IT");
  if(more)more.hidden=ui.rows.length>=ui.total;
}

function open(){
  css();document.getElementById(OID)?.remove();
  ui.rows=[];ui.q="";ui.sort="rating_desc";ui.page=0;ui.total=0;
  const o=document.createElement("section");o.id=OID;
  o.innerHTML=`<header class="pcgl-top"><div class="pcgl-topin"><button id="pcglBack" type="button">‹</button><div class="pcgl-title"><small>CLUB HOUSE · GLOBAL</small><strong>IMC Player Codex</strong></div><button id="pcglRefresh" type="button">↻</button></div></header><main class="pcgl-main"><section class="pcgl-hero"><small>IMC · GLOBAL PLAYER DATABASE</small><h1>IMC Player Codex</h1><p>Dati esclusivamente da player_codex_global.</p></section><section class="pcgl-kpis"><div class="pcgl-kpi"><strong id="pcglCount">…</strong><span>Giocatori</span></div></section><section class="pcgl-tools"><input id="pcglSearch" type="search" placeholder="Cerca giocatore, ID, ruolo…" autocomplete="off"><select id="pcglSort"><option value="rating_desc">Rating ↓</option><option value="name_asc">Nome A–Z</option><option value="age_asc">Età ↑</option></select></section><div id="pcglStatus" class="pcgl-status">Caricamento…</div><section id="pcglGrid" class="pcgl-grid"></section><button id="pcglMore" class="pcgl-more" type="button" hidden>CARICA ALTRI</button></main>`;
  document.body.appendChild(o);document.body.style.overflow="hidden";
  document.getElementById("pcglBack").onclick=()=>{o.remove();document.body.style.overflow="";};
  document.getElementById("pcglRefresh").onclick=()=>load(true);
  let t=null;document.getElementById("pcglSearch").oninput=e=>{ui.q=e.target.value||"";clearTimeout(t);t=setTimeout(()=>load(true),250);};
  document.getElementById("pcglSort").onchange=e=>{ui.sort=e.target.value||"rating_desc";load(true);};
  document.getElementById("pcglMore").onclick=()=>load(false);
  load(true);
}

async function hydrateHome(){
  const result=await db.from(TABLE).select("player_id",{count:"exact",head:true});
  if(result.error)return;
  const player=document.getElementById("imc52PlayerCount");if(player)player.textContent=Number(result.count||0).toLocaleString("it-IT");
  const world=document.getElementById("imc52WorldCount")?.closest(".nx-imc52-stat");if(world)world.remove();
  const manager=document.getElementById("imc52ManagerLinkCount")?.closest(".nx-imc52-stat");if(manager)manager.remove();
}

function syncHome(){if(document.getElementById("openImcGlobalCodex"))hydrateHome();}
let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(syncHome,80);}).observe(document.documentElement,{childList:true,subtree:true});syncHome();

document.addEventListener("click",function(e){
  const b=e.target&&e.target.closest&&e.target.closest("#openImcGlobalCodex");if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();
},true);

window.IMC_PLAYER_CODEX_GLOBAL={version:VERSION,open,refresh:()=>load(true)};
})();
