(function(){
"use strict";
if(window.IMC_NAVIGATION)return;

const VERSION="1.0.2";
const WORLDS=[
  ["GW001","Road To History"],["GW002","Gold 558"],["GW003","Gold 557"],["GW004","World League"],["GW005","Hall Of Famers"],
  ["GW006","Master League World"],["GW007","The Four Kingdoms"],["GW008","Gold 1"],["GW009","Kick Off"]
];
let state={host:null,current:"clubhouse",worldId:null,worldName:null};

function clean(v){return String(v==null?"":v).trim()}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dispatch(target,extra){document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:Object.assign({target},extra||{})}))}

function render(){
  if(!state.host)return;
  const inWorld=state.current==="game-world"&&state.worldId;
  state.host.innerHTML=`<nav class="nx-nav" aria-label="Navigazione Nexus">
    <button type="button" class="nx-nav-brand" data-nav-home><span>NEXUS</span><small>BUILD 1.0</small></button>
    <div class="nx-nav-actions">
      ${inWorld?`<button type="button" class="nx-nav-context" data-nav-world="${esc(state.worldId)}"><span>${esc(state.worldId)}</span><strong>${esc(state.worldName||state.worldId)}</strong></button>`:""}
      <button type="button" class="nx-nav-menu" data-nav-toggle aria-label="Apri menu" aria-expanded="false"><i></i><i></i><i></i></button>
    </div>
  </nav>
  <div class="nx-drawer" data-nav-drawer hidden>
    <button type="button" class="nx-home-link" data-nav-home>CLUB HOUSE</button>
    <div class="nx-drawer-title">GAME WORLDS</div>
    <div class="nx-world-list">${WORLDS.map(([id,name])=>`<button type="button" data-nav-world="${id}" class="${state.worldId===id?"is-current":""}"><span>${id}</span><strong>${esc(name)}</strong></button>`).join("")}</div>
  </div>`;
}

function mount(opts){if(!opts||!opts.host)throw new Error("Navigation: contenitore mancante");state={...state,...opts,host:opts.host};render()}
function setContext(ctx){state={...state,...ctx};render()}
function unmount(){if(state.host)state.host.innerHTML="";state.host=null}

document.addEventListener("click",e=>{
  const home=e.target.closest&&e.target.closest("[data-nav-home]");
  if(home){dispatch("clubhouse");return;}
  const world=e.target.closest&&e.target.closest("[data-nav-world]");
  if(world){dispatch("game-world",{worldId:clean(world.getAttribute("data-nav-world"))});return;}
  const toggle=e.target.closest&&e.target.closest("[data-nav-toggle]");
  if(toggle){const drawer=state.host&&state.host.querySelector("[data-nav-drawer]");if(!drawer)return;drawer.hidden=!drawer.hidden;toggle.setAttribute("aria-expanded",drawer.hidden?"false":"true")}
});

window.IMC_NAVIGATION={version:VERSION,mount,setContext,unmount};
})();