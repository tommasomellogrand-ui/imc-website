(function(){
"use strict";
if(window.IMC_TRANSFERS)return;
const VERSION="1.3.0";
let s={container:null,client:null,worldId:"",clubWorldId:null,mode:"world",rows:[],incoming:[],outgoing:[],activeRows:[]};
const c=v=>String(v==null?"":v).trim();
const e=v=>c(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
async function load(){const args={gameWorld:s.worldId};if(s.mode==="club")args.clubWorldId=s.clubWorldId;const r=await s.client.rpc("imc_nexus_gateway",{p_action:"transfers",p_args:args});if(r.error)throw r.error;const d=r.data||{};await window.IMC_PLAYER_GLOBAL.enrich(s.client,d);s.rows=Array.isArray(d.rows)?d.rows:[];s.incoming=Array.isArray(d.incoming)?d.incoming:[];s.outgoing=Array.isArray(d.outgoing)?d.outgoing:[]}
function row(x,label,index){return `<button type="button" class="tf-row" data-tf-index="${index}"><small>${e(x.transfer_date_text||"")} ${x.imc_season?"· S"+e(x.imc_season):""}</small><div class="tf-player-line">${window.IMC_PLAYER_GLOBAL.view(x,"tf-player")}</div><p>${e(x.club_from||"-")} → ${e(x.club_to||"-")}</p>${x.amount_text?`<b>${e(x.amount_text)}</b>`:""}${label?`<em>${label}</em>`:""}</button>`}
function renderRows(list,label){s.activeRows=list;return list.map((x,i)=>row(x,label,i)).join("")}
function renderWorld(){s.container.innerHTML=`<section class="tf" data-transfers-version="${VERSION}"><header><h2>Trasferimenti</h2><b>${s.rows.length}</b></header><div class="tf-list">${renderRows(s.rows,"")||'<div class="tf-empty">Nessun trasferimento.</div>'}</div></section>`}
function renderClub(){s.container.innerHTML=`<section class="tf" data-transfers-version="${VERSION}"><header><h2>Trasferimenti</h2><b>${s.incoming.length+s.outgoing.length}</b></header><div class="tf-tabs"><button data-tf-tab="in" class="active">ENTRATE</button><button data-tf-tab="out">USCITE</button></div><div data-tf-body>${renderRows(s.incoming,"ENTRATA")||'<div class="tf-empty">Nessuna entrata.</div>'}</div></section>`}
async function mount(o){if(!o||!o.container||!o.client||!o.worldId)throw Error("Transfers: parametri mancanti");if(!window.IMC_PLAYER_GLOBAL)throw Error("Player Global non disponibile");s={...s,...o,worldId:c(o.worldId),mode:o.clubWorldId?"club":"world",rows:[],incoming:[],outgoing:[],activeRows:[]};s.container.innerHTML='<div class="tf-empty">Caricamento Trasferimenti…</div>';await load();s.mode==="club"?renderClub():renderWorld()}
function unmount(){if(s.container)s.container.innerHTML="";s.container=null;s.activeRows=[]}
document.addEventListener("click",ev=>{
  if(!s.container)return;
  const transfer=ev.target.closest&&ev.target.closest("[data-tf-index]");
  if(transfer&&s.container.contains(transfer)){
    const idx=Number(transfer.getAttribute("data-tf-index"));
    const selected=Number.isInteger(idx)?s.activeRows[idx]:null;
    if(selected){document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:{target:"transfer-detail",worldId:s.worldId,transferId:c(selected.transfer_id),transfer:selected}}))}
    return;
  }
  const b=ev.target.closest&&ev.target.closest("[data-tf-tab]");
  if(!b||!s.container.contains(b))return;
  const tab=c(b.getAttribute("data-tf-tab"));
  s.container.querySelectorAll("[data-tf-tab]").forEach(x=>x.classList.toggle("active",x===b));
  const body=s.container.querySelector("[data-tf-body]");
  const list=tab==="out"?s.outgoing:s.incoming;
  body.innerHTML=renderRows(list,tab==="out"?"USCITA":"ENTRATA")||`<div class="tf-empty">Nessuna ${tab==="out"?"uscita":"entrata"}.</div>`;
});
window.IMC_TRANSFERS={version:VERSION,mount,unmount};
})();