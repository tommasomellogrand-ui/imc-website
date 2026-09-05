(function(){
"use strict";
if(window.IMC_TEAM_HUB)return;
const VERSION="2.0.0";
let state={container:null,client:null,worldId:"",mode:"clubs",clubs:[],nations:[]};
function clean(v){return String(v==null?"":v).trim()}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function rpc(action,args){const r=await state.client.rpc("imc_nexus_gateway",{p_action:action,p_args:args});if(r.error)throw r.error;return r.data||{}}
async function load(){
  const [clubsData,nationsData]=await Promise.all([
    rpc("gw_teams",{gameWorld:state.worldId}),
    rpc("gw_national_teams",{gameWorld:state.worldId})
  ]);
  state.clubs=((clubsData&&clubsData.rows)||[]).slice().sort((a,b)=>clean(a.display_name||a.club_name).localeCompare(clean(b.display_name||b.club_name),"it",{sensitivity:"base"}));
  const nations=((nationsData&&nationsData.rows)||[]).slice().sort((a,b)=>clean(a.nation_name).localeCompare(clean(b.nation_name),"it",{sensitivity:"base"}));
  const resolved=await Promise.allSettled(nations.map(x=>rpc("nation_resolve",{gameWorld:state.worldId,teamName:clean(x.nation_name)})));
  state.nations=nations.map((x,i)=>{
    const rr=resolved[i];
    const nationId=rr&&rr.status==="fulfilled"?rr.value.nationId:null;
    return {...x,nation_id:nationId};
  });
}
function clubCard(x){
  const name=clean(x.display_name||x.club_name);
  const logo=clean(x.logo_file);
  return `<button type="button" class="th-card" data-th-open="club" data-th-team-id="${esc(x.team_id||"")}" data-th-name="${esc(name)}"><span class="th-mark">${logo?`<img src="${esc(logo)}" alt="">`:""}</span><strong>${esc(name)}</strong></button>`;
}
function nationCard(x){
  const name=clean(x.nation_name);
  const nationId=clean(x.nation_id);
  const flag=nationId?`/nexus/assets/flags/nations/${encodeURIComponent(nationId)}.svg`:"";
  return `<button type="button" class="th-card" data-th-open="national" data-th-nation-id="${esc(nationId)}" data-th-name="${esc(name)}"><span class="th-mark th-flag">${flag?`<img src="${esc(flag)}" alt="">`:""}</span><strong>${esc(name)}</strong></button>`;
}
function render(){
  if(!state.container)return;
  const nationsMode=state.mode==="nations";
  const list=nationsMode?state.nations:state.clubs;
  state.container.innerHTML=`<section class="team-hub" data-team-hub-version="${VERSION}"><header class="th-head"><span>${esc(state.worldId)}</span><h2>TEAM HUB</h2></header><div class="th-switch"><button type="button" data-th-mode="clubs" class="${!nationsMode?"active":""}">CLUB</button><button type="button" data-th-mode="nations" class="${nationsMode?"active":""}">NATIONS</button></div><div class="th-grid">${list.length?list.map(nationsMode?nationCard:clubCard).join(""):'<div class="th-empty">Nessuna squadra disponibile.</div>'}</div></section>`;
}
async function mount(opts){
  if(!opts||!opts.container||!opts.client||!opts.worldId)throw new Error("Team Hub: parametri mancanti");
  state={...state,...opts,worldId:clean(opts.worldId),mode:"clubs",clubs:[],nations:[]};
  state.container.innerHTML='<div class="th-empty">Caricamento Team Hub…</div>';
  await load();
  render();
}
function unmount(){if(state.container)state.container.innerHTML="";state.container=null}
document.addEventListener("click",e=>{
  const mode=e.target.closest&&e.target.closest("[data-th-mode]");
  if(mode&&state.container&&state.container.contains(mode)){
    state.mode=clean(mode.getAttribute("data-th-mode"));
    render();
    return;
  }
  const open=e.target.closest&&e.target.closest("[data-th-open]");
  if(open&&state.container&&state.container.contains(open)){
    const teamType=clean(open.getAttribute("data-th-open"));
    const teamName=clean(open.getAttribute("data-th-name"));
    const detail={target:"team-detail",worldId:state.worldId,teamType,teamName};
    if(teamType==="club")detail.teamId=clean(open.getAttribute("data-th-team-id"));
    if(teamType==="national")detail.nationId=clean(open.getAttribute("data-th-nation-id"));
    document.dispatchEvent(new CustomEvent("nexus:navigate",{detail}));
  }
});
window.IMC_TEAM_HUB={version:VERSION,mount,unmount};
})();