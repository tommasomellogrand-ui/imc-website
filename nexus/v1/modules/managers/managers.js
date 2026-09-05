(function(){
"use strict";
if(window.IMC_MANAGERS)return;
const VERSION="2.0.0";
let state={container:null,client:null,worldId:"",mode:"imc",imc:[],external:[]};
function clean(v){return String(v==null?"":v).trim()}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function rpc(action,args){const r=await state.client.rpc("imc_nexus_gateway",{p_action:action,p_args:args});if(r.error)throw r.error;return r.data||{}}
async function load(){
  const [imcData,externalData]=await Promise.all([
    rpc("managers",{gameWorld:state.worldId}),
    rpc("team_managers",{gameWorld:state.worldId})
  ]);
  state.imc=((imcData&&imcData.rows)||[]).slice().sort((a,b)=>clean(a.full_name).localeCompare(clean(b.full_name),"it",{sensitivity:"base"}));
  const seen=new Set();
  state.external=[];
  for(const x of ((externalData&&externalData.rows)||[])){
    if(clean(x.manager_id)||!clean(x.manager_name))continue;
    const sm=clean(x.sm_manager_id);
    const key=sm?"sm:"+sm:"name:"+clean(x.manager_name).toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    state.external.push({name:clean(x.manager_name),sm_manager_id:sm});
  }
  state.external.sort((a,b)=>a.name.localeCompare(b.name,"it",{sensitivity:"base"}));
}
function imcCard(x){const name=clean(x.full_name||x.manager_id);return `<button type="button" class="mgr-card mgr-card-imc" data-mgr-id="${esc(x.manager_id)}" data-mgr-sm="${esc(x.sm_manager_id||"")}" data-mgr-name="${esc(name)}"><strong>${esc(name)}</strong><small>${esc(x.manager_id)}</small></button>`}
function externalCard(x){return `<div class="mgr-card mgr-card-external"><strong>${esc(x.name)}</strong><small>${x.sm_manager_id?esc(x.sm_manager_id):"—"}</small></div>`}
function render(){
  if(!state.container)return;
  const list=state.mode==="external"?state.external:state.imc;
  state.container.innerHTML=`<section class="mgr-module" data-managers-version="${VERSION}"><header class="mgr-head"><span>${esc(state.worldId)}</span><h2>Managers</h2></header><div class="mgr-switch"><button type="button" data-mgr-mode="imc" class="${state.mode==="imc"?"active":""}">IMC</button><button type="button" data-mgr-mode="external" class="${state.mode==="external"?"active":""}">EXTERNAL</button></div><div class="mgr-grid">${list.length?list.map(state.mode==="external"?externalCard:imcCard).join(""):'<div class="mgr-empty">Nessun manager disponibile.</div>'}</div></section>`;
}
async function mount(opts){if(!opts||!opts.container||!opts.client||!opts.worldId)throw new Error("Managers: parametri mancanti");state={...state,...opts,worldId:clean(opts.worldId),mode:"imc",imc:[],external:[]};state.container.innerHTML='<div class="mgr-empty">Caricamento Managers…</div>';await load();render()}
function unmount(){if(state.container)state.container.innerHTML="";state.container=null}
document.addEventListener("click",e=>{
  const mode=e.target.closest&&e.target.closest("[data-mgr-mode]");
  if(mode&&state.container&&state.container.contains(mode)){state.mode=clean(mode.getAttribute("data-mgr-mode"));render();return}
  const b=e.target.closest&&e.target.closest("[data-mgr-id]");
  if(b&&state.container&&state.container.contains(b))document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:{target:"manager-detail",worldId:state.worldId,managerId:clean(b.getAttribute("data-mgr-id")),smManagerId:clean(b.getAttribute("data-mgr-sm")),name:clean(b.getAttribute("data-mgr-name"))}}));
});
window.IMC_MANAGERS={version:VERSION,mount,unmount};
})();