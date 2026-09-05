(function(){
"use strict";

const VERSION="1.2.0";
const WORLD_BY_NAME={
  "road to history":"GW001",
  "gold 558":"GW002",
  "gold 557":"GW003",
  "world league":"GW004",
  "hall of famers":"GW005",
  "master league world":"GW006",
  "the four kingdoms":"GW007",
  "gold 1":"GW008",
  "kick off":"GW009",
  "sensible soccer academy":"GW010"
};
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const valid=id=>/^GW(?:00[1-9]|010)$/.test(String(id||""));
let observer=null;
let frame=0;

function installResponsiveCss(){
  if(document.getElementById("imcPlayerCodexMenuResponsiveCss"))return;
  const style=document.createElement("style");
  style.id="imcPlayerCodexMenuResponsiveCss";
  style.textContent=`
@media(max-width:620px){
  .nx-world-nav.nx-world-nav-b6{
    display:grid!important;
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
    width:100%!important;
    max-width:100%!important;
    gap:2px!important;
    padding-left:4px!important;
    padding-right:4px!important;
    overflow:visible!important;
  }
  .nx-world-nav.nx-world-nav-b6>button{
    min-width:0!important;
    width:auto!important;
    max-width:none!important;
    padding:8px 2px 7px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:4px!important;
    overflow:hidden!important;
  }
  .nx-world-nav.nx-world-nav-b6>button>b{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    width:22px!important;
    height:22px!important;
    min-width:22px!important;
    font-size:16px!important;
    line-height:1!important;
  }
  .nx-world-nav.nx-world-nav-b6>button>span{
    display:block!important;
    width:100%!important;
    min-width:0!important;
    min-height:16px!important;
    margin:0!important;
    padding:0!important;
    white-space:normal!important;
    overflow-wrap:normal!important;
    word-break:normal!important;
    text-align:center!important;
    font-size:7px!important;
    line-height:1.08!important;
    letter-spacing:0!important;
  }
}
@media(max-width:360px){
  .nx-world-nav.nx-world-nav-b6>button{padding-left:1px!important;padding-right:1px!important;}
  .nx-world-nav.nx-world-nav-b6>button>span{font-size:6.5px!important;}
}
`;
  document.head.appendChild(style);
}

function currentWorld(){
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=String(guard.currentWorld()||"");
    if(valid(id))return id;
  }
  const text=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong")?.textContent||"";
  return WORLD_BY_NAME[norm(text)]||"";
}

function sync(){
  installResponsiveCss();
  const id=currentWorld();
  if(!valid(id))return;

  const bottom=document.querySelector(".nx-bottom.nx-bottom-b6");
  if(bottom){
    bottom.querySelectorAll('[data-world-section="player-codex"],[data-imc-codex-world]').forEach(el=>el.remove());
  }

  const nav=document.querySelector(".nx-world-nav");
  if(!nav)return;

  const matches=[...nav.querySelectorAll('[data-world-section="player-codex"],[data-imc-codex-world]')];
  let button=matches.find(el=>el.getAttribute("data-world-section")==="player-codex")||matches[0]||null;
  matches.forEach(el=>{if(el!==button)el.remove();});

  if(!button){
    button=document.createElement("button");
    button.type="button";
    button.innerHTML='<b>▣</b><span>PLAYER CODEX</span>';
  }

  button.setAttribute("data-world-section","player-codex");
  button.setAttribute("data-imc-codex-world",id);

  if(nav.firstElementChild!==button)nav.insertBefore(button,nav.firstElementChild||null);
}

function queueSync(){
  if(frame)return;
  frame=requestAnimationFrame(function(){
    frame=0;
    sync();
  });
}

function start(){
  installResponsiveCss();
  const root=document.getElementById("app");
  if(!root)return false;
  if(observer)observer.disconnect();
  observer=new MutationObserver(queueSync);
  observer.observe(root,{childList:true,subtree:true});
  sync();
  return true;
}

if(!start()){
  document.addEventListener("DOMContentLoaded",start,{once:true});
}
window.addEventListener("pageshow",sync);

window.IMC_PLAYER_CODEX_MENU={version:VERSION,sync};
})();
