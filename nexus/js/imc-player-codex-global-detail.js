(function(){
"use strict";

const VERSION="1.1.0";
const GLOBAL_TABLE="player_codex_global";
const DID="imcPlayerCodexGlobalDetail";
if(!window.supabase)return;

let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const url=cfg&&cfg.url?cfg.url:"https://toanuzojdkfjgucztpze.supabase.co";
const key=cfg&&cfg.key?cfg.key:"sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const db=window.supabase.createClient(url,key);

const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const img=v=>{const x=String(v||"").trim();return x.startsWith("//")?"https:"+x:x;};
function nameOf(r){return String(r.full_name||r.player_name||("Player "+r.player_id));}
function initials(r){return nameOf(r).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();}
function validWorld(id){return /^GW(?:00[1-9]|010)$/.test(String(id||""));}
function worldTable(id){return String(id||"").toLowerCase()+"_player_codex";}

function currentGw(){
  const title=document.querySelector("#imcPlayerCodexGw .pcg-title small");
  const m=String(title&&title.textContent||"").match(/\bGW\d{3}\b/i);
  if(m&&validWorld(m[0].toUpperCase()))return m[0].toUpperCase();
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=String(guard.currentWorld()||"").toUpperCase();
    if(validWorld(id))return id;
  }
  return "";
}

function css(){
  if(document.getElementById("imcGlobalDetailCss"))return;
  const s=document.createElement("style");
  s.id="imcGlobalDetailCss";
  s.textContent=`
#${DID}{position:fixed;inset:0;z-index:2147483800;overflow:auto;background:#f3f6fb;color:#0b1833;font-family:inherit;-webkit-overflow-scrolling:touch}#${DID} *{box-sizing:border-box}
.pcgd-top{position:sticky;top:0;z-index:3;background:rgba(243,246,251,.97);backdrop-filter:blur(16px);border-bottom:1px solid #dce3ee}.pcgd-topin{max-width:900px;margin:auto;display:grid;grid-template-columns:46px 1fr 46px;gap:9px;align-items:center;padding:10px 12px}.pcgd-top button{width:42px;height:42px;border:1px solid #d4deea;border-radius:13px;background:#fff;color:#173766;font:inherit;font-size:20px;font-weight:950}.pcgd-title{text-align:center;min-width:0}.pcgd-title small{display:block;color:#7d899b;font-size:8px;font-weight:950;letter-spacing:.12em}.pcgd-title strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}
.pcgd-main{max-width:850px;margin:auto;padding:14px 12px 34px}.pcgd-head{display:grid;grid-template-columns:86px minmax(0,1fr) auto;gap:14px;align-items:center;padding:18px;border-radius:22px;background:linear-gradient(135deg,#061631,#0d3470 62%,#102552);color:#fff}.pcgd-photo{width:86px;height:86px;border-radius:20px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#e9eef6;color:#62728a;font-size:24px;font-weight:1000}.pcgd-photo img{width:100%;height:100%;object-fit:cover}.pcgd-copy{min-width:0}.pcgd-copy small{display:block;color:#d9ad45;font-size:8px;font-weight:950;letter-spacing:.1em}.pcgd-copy h1{margin:5px 0 7px;font-size:24px;line-height:1.03}.pcgd-copy p{margin:0;color:#dbe6f7;font-size:10px;font-weight:800}.pcgd-ovr{min-width:62px;padding:11px 8px;border-radius:16px;background:#fff;color:#0d2b5d;text-align:center}.pcgd-ovr strong{display:block;font-size:22px;line-height:1}.pcgd-ovr span{display:block;margin-top:4px;font-size:7px;font-weight:950}
.pcgd-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.pcgd-field{min-width:0;padding:12px 13px;border:1px solid #dde4ef;border-radius:15px;background:#fff}.pcgd-field small{display:block;color:#7f8ca0;font-size:7px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.pcgd-field strong{display:block;margin-top:5px;color:#15294c;font-size:11px;line-height:1.4;overflow-wrap:anywhere}.pcgd-field.is-json{grid-column:1/-1}.pcgd-json{margin:7px 0 0;padding:10px;border-radius:10px;background:#f5f7fb;color:#31425e;font:700 9px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.pcgd-history{grid-column:1/-1;overflow:hidden;border:1px solid #dce4ef;border-radius:20px;background:#fff}.pcgd-history-head{display:flex;align-items:center;gap:11px;padding:15px 16px;border-bottom:1px solid #e6ebf2}.pcgd-history-icon{display:flex;align-items:center;justify-content:center;width:42px;height:42px;flex:0 0 42px;border-radius:13px;background:#102b5b;color:#fff;font-size:19px;font-weight:950}.pcgd-history-copy{min-width:0}.pcgd-history-copy strong{display:block;color:#10264d;font-size:16px;line-height:1.05}.pcgd-history-copy span{display:block;margin-top:4px;color:#7d899c;font-size:8px;font-weight:850}.pcgd-history-cols{display:grid;grid-template-columns:minmax(105px,1fr) minmax(92px,.72fr) 22px minmax(92px,.72fr);gap:8px;align-items:center;padding:10px 14px;background:#f7f9fc;color:#7b879a;font-size:7px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}.pcgd-history-list{display:grid;padding:7px}.pcgd-history-row{display:grid;grid-template-columns:minmax(105px,1fr) minmax(92px,.72fr) 22px minmax(92px,.72fr);gap:8px;align-items:center;min-height:58px;padding:8px 7px;border-top:1px solid #edf0f5}.pcgd-history-row:first-child{border-top:0}.pcgd-date{display:flex;align-items:center;gap:8px;color:#172b50;font-size:10px;font-weight:900}.pcgd-cal{display:flex;align-items:center;justify-content:center;width:29px;height:29px;flex:0 0 29px;border:1px solid #dce4ef;border-radius:9px;background:#fff;color:#173766;font-size:12px}.pcgd-arrow{color:#8996aa;text-align:center;font-size:18px}.pcgd-rating{display:flex;align-items:center;justify-content:center;min-width:58px;height:42px;border-radius:11px;color:#fff;font-size:18px;font-weight:1000;box-shadow:inset 0 -2px 0 rgba(0,0,0,.08)}.pcgd-r-red{background:#c63e49}.pcgd-r-orange{background:#d18a16}.pcgd-r-green{background:#318638}.pcgd-r-blue{background:#365bb7}.pcgd-r-purple{background:#812ac4}.pcgd-history-empty{padding:18px;color:#7c899c;text-align:center;font-size:9px;font-weight:850}
.pcgd-loading{padding:30px;border:1px dashed #ccd7e6;border-radius:18px;background:#fff;text-align:center;color:#75839a;font-size:10px;font-weight:900}.pcgl-card,.pcg-card{cursor:pointer}
@media(max-width:620px){.pcgd-head{grid-template-columns:70px minmax(0,1fr) auto;padding:14px;gap:10px}.pcgd-photo{width:70px;height:70px;border-radius:17px}.pcgd-copy h1{font-size:19px}.pcgd-fields{grid-template-columns:1fr}.pcgd-field.is-json,.pcgd-history{grid-column:1}.pcgd-ovr{min-width:54px}.pcgd-history-cols,.pcgd-history-row{grid-template-columns:minmax(92px,1fr) 64px 18px 64px;gap:5px}.pcgd-history-cols{padding:9px 9px;font-size:6px}.pcgd-history-row{padding:7px 3px;min-height:54px}.pcgd-date{font-size:8px;gap:5px}.pcgd-cal{width:25px;height:25px;flex-basis:25px;font-size:10px}.pcgd-rating{min-width:0;height:38px;font-size:16px}.pcgd-arrow{font-size:15px}}
`;
  document.head.appendChild(s);
}

function ratingClass(value){
  const n=Number(value);
  if(!Number.isFinite(n))return "pcgd-r-red";
  if(n<=69)return "pcgd-r-red";
  if(n<=79)return "pcgd-r-orange";
  if(n<=89)return "pcgd-r-green";
  if(n<=93)return "pcgd-r-blue";
  return "pcgd-r-purple";
}

function ratingRows(history){
  if(Array.isArray(history)){
    return history.map(x=>({date:String(x&&x.data||"").trim(),old:x&&x.old_rating,new:x&&x.new_rating})).filter(x=>x.date&&Number.isFinite(Number(x.old))&&Number.isFinite(Number(x.new)));
  }
  if(history&&typeof history==="object"&&Array.isArray(history.tables)&&Array.isArray(history.tables[0])){
    return history.tables[0].map(row=>{
      if(!Array.isArray(row)||row.length<3)return null;
      const date=String(row[0]&&row[0].text||"").trim();
      const old=String(row[1]&&row[1].text||"").trim();
      const next=String(row[2]&&row[2].text||"").trim();
      if(!date||!/^\d+$/.test(old)||!/^\d+$/.test(next))return null;
      return {date,old:Number(old),new:Number(next)};
    }).filter(Boolean);
  }
  return [];
}

function historyMarkup(history){
  const rows=ratingRows(history);
  return `<section class="pcgd-history"><div class="pcgd-history-head"><span class="pcgd-history-icon">↗</span><div class="pcgd-history-copy"><strong>Cronologia Valutazioni</strong><span>Tutti gli aggiornamenti di rating del giocatore</span></div></div><div class="pcgd-history-cols"><span>Data</span><span>Valutazione vecchia</span><span></span><span>Nuova valutazione</span></div><div class="pcgd-history-list">${rows.length?rows.map(x=>`<div class="pcgd-history-row"><div class="pcgd-date"><span class="pcgd-cal">▣</span><span>${esc(x.date)}</span></div><span class="pcgd-rating ${ratingClass(x.old)}">${esc(x.old)}</span><span class="pcgd-arrow">→</span><span class="pcgd-rating ${ratingClass(x.new)}">${esc(x.new)}</span></div>`).join(""):'<div class="pcgd-history-empty">Nessuna cronologia di valutazione disponibile.</div>'}</div></section>`;
}

function field(k,v){
  if(k==="history")return historyMarkup(v);
  if(v!==null&&typeof v==="object")return `<div class="pcgd-field is-json"><small>${esc(k)}</small><pre class="pcgd-json">${esc(JSON.stringify(v,null,2))}</pre></div>`;
  const shown=v===null||v===undefined||v===""?"—":String(v);
  return `<div class="pcgd-field"><small>${esc(k)}</small><strong>${esc(shown)}</strong></div>`;
}

function markup(r,context){
  const preferred=["id","f","s","i","player_id","player_name","full_name","age","date_of_birth","nationality","position","foot","height_cm","weight_kg","rating","old_rating","market_value","salary","contract_seasons","transfer_ban_date","current_club","soccer_wiki_club","image_url","fields","tables","raw_text","html","statistics","history"];
  const keys=preferred.filter(k=>Object.prototype.hasOwnProperty.call(r,k));
  Object.keys(r).forEach(k=>{if(!keys.includes(k))keys.push(k);});
  const photo=img(r.image_url),name=nameOf(r);
  const label=context&&context!=="GLOBAL"?context+" · PLAYER CODEX":"PLAYER CODEX · FULL RECORD";
  return `<header class="pcgd-top"><div class="pcgd-topin"><button id="pcgdBack" type="button">‹</button><div class="pcgd-title"><small>${esc(label)}</small><strong>${esc(name)}</strong></div><span></span></div></header><main class="pcgd-main"><section class="pcgd-head"><div class="pcgd-photo">${photo?`<img src="${esc(photo)}" alt="${esc(name)}" onerror="this.remove()">`:esc(initials(r))}</div><div class="pcgd-copy"><small>PLAYER ID ${esc(r.player_id)}</small><h1>${esc(name)}</h1><p>${esc(r.nationality||"—")} · ${esc(r.position||"—")}</p></div><div class="pcgd-ovr"><strong>${r.rating!=null?esc(r.rating):"—"}</strong><span>OVR</span></div></section><section class="pcgd-fields">${keys.map(k=>field(k,r[k])).join("")}</section></main>`;
}

async function openDetail(playerId,table,context){
  css();
  document.getElementById(DID)?.remove();
  const d=document.createElement("section");
  d.id=DID;
  d.innerHTML='<main class="pcgd-main"><div class="pcgd-loading">Caricamento scheda completa…</div></main>';
  document.body.appendChild(d);
  try{
    const source=table||GLOBAL_TABLE;
    const r=await db.from(source).select("*").eq("player_id",playerId).limit(1);
    if(r.error)throw r.error;
    const row=(r.data||[])[0];
    if(!row)throw new Error("not found");
    d.innerHTML=markup(row,context||"GLOBAL");
    document.getElementById("pcgdBack").onclick=()=>d.remove();
  }catch(e){
    console.error("IMC Player Detail",e);
    d.innerHTML='<main class="pcgd-main"><div class="pcgd-loading">Impossibile caricare la scheda completa.</div></main>';
  }
}

function playerIdFromCard(card,copySelector){
  const small=card&&card.querySelector(copySelector+" small");
  const m=String(small&&small.textContent||"").match(/PLAYER(?: CODEX)? ID\s+(\d+)|PLAYER ID\s+(\d+)/i);
  return m?(m[1]||m[2]||""):"";
}

document.addEventListener("click",function(e){
  const globalCard=e.target&&e.target.closest&&e.target.closest("#imcPlayerCodexGlobal .pcgl-card");
  if(globalCard){
    const id=playerIdFromCard(globalCard,".pcgl-copy");
    if(!id)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openDetail(id,GLOBAL_TABLE,"GLOBAL");
    return;
  }
  const gwCard=e.target&&e.target.closest&&e.target.closest("#imcPlayerCodexGw .pcg-card");
  if(!gwCard)return;
  const id=playerIdFromCard(gwCard,".pcg-copy");
  const gw=currentGw();
  if(!id||!validWorld(gw))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  openDetail(id,worldTable(gw),gw);
},true);

window.IMC_PLAYER_CODEX_GLOBAL_DETAIL={version:VERSION,openDetail};
})();
