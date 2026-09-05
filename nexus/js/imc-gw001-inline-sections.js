(function(){
"use strict";

if(window.__IMC_GW001_INLINE_SECTIONS__)return;
window.__IMC_GW001_INLINE_SECTIONS__=true;

const VERSION="1.0.0-inline-sections";
const STYLE_ID="imcGw001InlineSectionsCss";
let raf=0;

function norm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function currentWorld(){
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=String(guard.currentWorld()||"").toUpperCase();
    if(/^GW\d{3}$/.test(id))return id;
  }
  const text=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong")?.textContent||"";
  const map={"road to history":"GW001","gold 558":"GW002","gold 557":"GW003","world league":"GW004","hall of famers":"GW005","master league world":"GW006","the four kingdoms":"GW007","gold 1":"GW008","kick off":"GW009","sensible soccer academy":"GW010"};
  return map[norm(text)]||"";
}

function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
@media(max-width:620px){
  .nx-world-nav.nx-world-nav-gw001-b44{
    grid-template-columns:repeat(6,minmax(0,1fr))!important;
  }
  .nx-world-nav.nx-world-nav-gw001-b44>button>span{font-size:6.5px!important;}
}
#pageRoot>#imcCompetitions,
#pageRoot>#imcCompetitionDetail,
#pageRoot>#imcPlayerCodexGw,
#pageRoot>#imcTransfers,
#pageRoot>#imcTransferDetail{
  position:relative!important;
  inset:auto!important;
  z-index:auto!important;
  width:100%!important;
  min-height:0!important;
  overflow:visible!important;
  -webkit-overflow-scrolling:auto!important;
}
#pageRoot>#imcCompetitions>.imcc-top,
#pageRoot>#imcPlayerCodexGw>.pcg-top,
#pageRoot>#imcTransfers>.imct-top{
  display:none!important;
}
#pageRoot>#imcCompetitionDetail>.imcc-top,
#pageRoot>#imcTransferDetail>.imct-top{
  position:relative!important;
  top:auto!important;
  z-index:2!important;
}
#pageRoot>#imcCompetitions .imcc-main,
#pageRoot>#imcCompetitionDetail .imcc-main,
#pageRoot>#imcPlayerCodexGw .pcg-main,
#pageRoot>#imcTransfers .imct-main,
#pageRoot>#imcTransferDetail .imct-dmain{
  max-width:none!important;
}
.nx-bottom.nx-bottom-b6 [data-page="transfers"]{display:none!important;}
`;
  document.head.appendChild(style);
}

function transferButton(){
  const nav=document.querySelector(".nx-world-nav.nx-world-nav-gw001-b44");
  if(!nav)return null;
  let button=nav.querySelector('[data-imc-transfers-world="GW001"]');
  if(button)return button;
  button=document.createElement("button");
  button.type="button";
  button.setAttribute("data-imc-transfers-world","GW001");
  const source=document.querySelector('.nx-bottom.nx-bottom-b6 [data-page="transfers"]');
  if(source){
    const icon=source.querySelector("b")?.innerHTML||"⇄";
    button.innerHTML='<b>'+icon+'</b><span>TRANSFERS</span>';
  }else{
    button.innerHTML='<b>⇄</b><span>TRANSFERS</span>';
  }
  nav.appendChild(button);
  return button;
}

function normalizeBottom(){
  const bottom=document.querySelector(".nx-bottom.nx-bottom-b6");
  if(!bottom)return;
  const transfer=bottom.querySelector('[data-page="transfers"]');
  if(transfer)transfer.style.display="none";
  bottom.style.setProperty("grid-template-columns","repeat(4,minmax(0,1fr))","important");
}

function setMenuActive(section){
  const nav=document.querySelector(".nx-world-nav.nx-world-nav-gw001-b44");
  if(!nav)return;
  nav.querySelectorAll("button").forEach(function(button){button.classList.remove("active");});
  let selector="";
  if(section==="player-codex")selector='[data-world-section="player-codex"]';
  if(section==="competitions")selector='[data-world-section="competitions"]';
  if(section==="transfers")selector='[data-imc-transfers-world="GW001"]';
  const target=selector?nav.querySelector(selector):null;
  if(target)target.classList.add("active");
}

function movePrimary(id,section){
  const root=document.getElementById(id);
  const page=document.getElementById("pageRoot");
  if(!root||!page)return false;
  if(root.parentNode!==page){
    page.replaceChildren(root);
  }
  root.style.display="";
  document.body.style.overflow="";
  setMenuActive(section);
  return true;
}

function moveDetail(id,baseId,section){
  const detail=document.getElementById(id);
  const page=document.getElementById("pageRoot");
  if(!detail||!page)return false;
  const base=document.getElementById(baseId);
  if(base)base.style.display="none";
  if(detail.parentNode!==page)page.appendChild(detail);
  document.body.style.overflow="";
  setMenuActive(section);
  return true;
}

function restoreBase(baseId,detailId){
  const base=document.getElementById(baseId);
  const detail=document.getElementById(detailId);
  if(base&&!detail)base.style.display="";
}

function sync(){
  raf=0;
  installCss();
  if(currentWorld()!=="GW001")return;
  transferButton();
  normalizeBottom();

  const hasCodex=!!document.getElementById("imcPlayerCodexGw");
  const hasTransfers=!!document.getElementById("imcTransfers");
  const hasCompetitions=!!document.getElementById("imcCompetitions");

  if(hasCodex)movePrimary("imcPlayerCodexGw","player-codex");
  else if(hasTransfers)movePrimary("imcTransfers","transfers");
  else if(hasCompetitions)movePrimary("imcCompetitions","competitions");

  moveDetail("imcCompetitionDetail","imcCompetitions","competitions");
  moveDetail("imcTransferDetail","imcTransfers","transfers");
  restoreBase("imcCompetitions","imcCompetitionDetail");
  restoreBase("imcTransfers","imcTransferDetail");
}

function queue(){
  if(raf)return;
  raf=requestAnimationFrame(sync);
}

function start(){
  installCss();
  sync();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.addEventListener("pageshow",queue);
window.IMC_GW001_INLINE_SECTIONS={version:VERSION,refresh:sync};
})();
