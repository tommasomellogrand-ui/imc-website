(function(){
"use strict";
if(window.IMC_TRANSFER_DETAIL)return;
const VERSION="1.3.0";
let s={container:null,client:null,worldId:"",transferId:"",row:null};
const c=v=>String(v==null?"":v).trim();
const e=v=>c(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
function value(v){if(v==null||v==="")return "—";if(typeof v==="object"){try{return JSON.stringify(v)}catch(_){return String(v)}}return String(v)}
async function load(){const r=await s.client.rpc("imc_nexus_gateway",{p_action:"transfers",p_args:{gameWorld:s.worldId}});if(r.error)throw r.error;const rows=Array.isArray(r.data&&r.data.rows)?r.data.rows:[];s.row=rows.find(x=>c(x.transfer_id)===s.transferId)||null;if(!s.row)throw Error("Trasferimento non trovato")}
function item(label,v){return `<div class="td-item"><small>${e(label)}</small><strong>${e(value(v))}</strong></div>`}
function exchangeItem(players){const list=Array.isArray(players)?players:[];return `<div class="td-item"><small>GIOCATORI SCAMBIATI</small>${list.length?`<div class="td-exchange-list">${list.map(p=>window.IMC_PLAYER_GLOBAL.view(p,"td-exchange-player")).join("")}</div>`:"<strong>[]</strong>"}</div>`}
function render(){if(!s.container||!s.row)return;const x=s.row;s.container.innerHTML=`<section class="td" data-transfer-detail-version="${VERSION}"><header class="td-head"><span>${e(s.worldId)}</span><div class="td-player-head">${window.IMC_PLAYER_GLOBAL.view(x,"td-player-identity")}</div><small>${e(x.transfer_id||"")}</small></header><section class="td-move"><div><small>DA</small><strong>${e(value(x.club_from))}</strong></div><b>→</b><div><small>A</small><strong>${e(value(x.club_to))}</strong></div></section><section class="td-grid">${item("DATA",x.transfer_date_text)}${item("IMPORTO",x.amount_text)}${item("IMC SEASON",x.imc_season)}${item("TRANSFER ID",x.transfer_id)}${item("PLAYER ID",x.player_id)}${item("SM WORLD CLUB ID · DA",x.from_sm_world_club_id)}${item("SM WORLD CLUB ID · A",x.to_sm_world_club_id)}${exchangeItem(x.exchange_players)}${item("IMPORTATO IL",x.imported_at)}</section></section>`}
async function mount(o){if(!o||!o.container||!o.client||!o.worldId)throw Error("Transfer Detail: parametri mancanti");if(!window.IMC_PLAYER_GLOBAL)throw Error("Player Global non disponibile");s={...s,...o,container:o.container,client:o.client,worldId:c(o.worldId),transferId:c(o.transferId),row:o.transfer&&typeof o.transfer==="object"?o.transfer:null};s.container.innerHTML='<div class="td-empty">Caricamento Transfer Detail…</div>';if(!s.row){if(!s.transferId)throw Error("Transfer Detail: trasferimento mancante");await load()}await window.IMC_PLAYER_GLOBAL.enrich(s.client,s.row);render()}
function unmount(){if(s.container)s.container.innerHTML="";s.container=null;s.row=null}
window.IMC_TRANSFER_DETAIL={version:VERSION,mount,unmount};
})();