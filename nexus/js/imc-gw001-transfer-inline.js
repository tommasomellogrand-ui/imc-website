(function(){
"use strict";
if(window.__IMC_GW001_TRANSFER_INLINE__)return;
window.__IMC_GW001_TRANSFER_INLINE__=true;

const VERSION="1.0.0";
const TRANSFER_ID="imcWorldTransfers54";
const DETAIL_ID="imcTransferDetail54";
const STYLE_ID="imcGw001TransferInlineCss";
let observer=null;
let savedHost=null;
let savedContent=null;

function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
#pageRoot>#${TRANSFER_ID},#pageRoot>#${DETAIL_ID}{position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;max-width:none!important;min-height:0!important;max-height:none!important;overflow:visible!important;margin:0!important}
#pageRoot>#${TRANSFER_ID}>.t54top{display:none!important}
#pageRoot>#${TRANSFER_ID} .t54main,#pageRoot>#${DETAIL_ID} .t54detailmain{max-width:none!important}
#pageRoot>#${DETAIL_ID}>.t54detailtop{position:relative!important;top:auto!important}
`;
  document.head.appendChild(style);
}

function pageRoot(){return document.getElementById("pageRoot");}
function world(){
  const text=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong")?.textContent||"";
  return String(text).toLowerCase().includes("road to history")?"GW001":"";
}

function snapshot(root){
  if(savedHost===root&&savedContent)return;
  const frag=document.createDocumentFragment();
  while(root.firstChild)frag.appendChild(root.firstChild);
  savedHost=root;
  savedContent=frag;
}

function mountTransfers(){
  if(world()!=="GW001")return;
  const root=pageRoot();
  const transfer=document.getElementById(TRANSFER_ID);
  if(!root||!transfer||transfer.parentElement!==document.body)return;
  installCss();
  snapshot(root);
  root.replaceChildren(transfer);
  document.body.style.overflow="";
  window.scrollTo(0,0);
}

function mountDetail(){
  const root=pageRoot();
  const transfer=document.getElementById(TRANSFER_ID);
  const detail=document.getElementById(DETAIL_ID);
  if(!root||!transfer||!detail||transfer.parentElement!==root||detail.parentElement!==document.body)return;
  transfer.hidden=true;
  root.appendChild(detail);
  document.body.style.overflow="";
  window.scrollTo(0,0);
}

function closeDetail(){
  const detail=document.getElementById(DETAIL_ID);
  const transfer=document.getElementById(TRANSFER_ID);
  if(detail)detail.remove();
  if(transfer)transfer.hidden=false;
  document.body.style.overflow="";
  window.scrollTo(0,0);
}

function scan(){mountTransfers();mountDetail();}

function start(){
  installCss();
  if(observer||!document.body)return;
  observer=new MutationObserver(scan);
  observer.observe(document.body,{childList:true});
  document.addEventListener("click",function(event){
    const button=event.target&&event.target.closest?event.target.closest("#t54detailback"):null;
    if(!button)return;
    const root=pageRoot();
    if(!root||!root.contains(button))return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    closeDetail();
  },true);
  scan();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_GW001_TRANSFER_INLINE={version:VERSION,refresh:scan};
})();
