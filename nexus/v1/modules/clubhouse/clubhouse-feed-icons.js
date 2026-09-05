(function(){
"use strict";
if(window.IMC_CLUBHOUSE_FEED_ICONS)return;
const VERSION="1.2.0";
const clean=v=>String(v==null?"":v).trim();
const upper=v=>clean(v).toLocaleUpperCase("it-IT");
const emojiChars=/[🔥⚖⚠🎟💔🏆⚔]/gu;
const emojiJoiners=/[\uFE0F\u200D]/gu;
const ICONS={
  trophy:'<path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1.5A3.5 3.5 0 0 0 8.5 11"/><path d="M16 6h3v1.5A3.5 3.5 0 0 1 15.5 11"/><path d="M12 12.5V17"/><path d="M9 20h6"/><path d="M10 17h4"/>',
  qualified:'<path d="M5 16.5 12 9l7 7.5"/><path d="M12 9v10"/><path d="M7 5h10"/>',
  eliminated:'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6M15 9l-6 6"/>',
  derby:'<path d="M4 5.5 9 4l2 3-2 8-5-3V5.5Z"/><path d="m20 5.5-5-1.5-2 3 2 8 5-3V5.5Z"/><path d="m10 11 4 2M14 11l-4 2"/>',
  final:'<path d="m5 9 2 8h10l2-8-4 3-3-6-3 6-4-3Z"/><path d="M7 20h10"/>',
  penalties:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M20 12h-3M12 20v-3M4 12h3"/>',
  "first-leg":'<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M12 8v8M10 10l2-2"/>',
  "second-leg":'<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 2-5 2.5-5 6h5"/>',
  group:'<circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 7h6M7 9v6M17 9v6M9 17h6"/>',
  cumulative:'<rect x="4" y="5" width="10" height="7" rx="1.5"/><rect x="10" y="12" width="10" height="7" rx="1.5"/><path d="M7 15H5.5A1.5 1.5 0 0 1 4 13.5V9M17 9h1.5A1.5 1.5 0 0 1 20 10.5V15"/>',
  "manager-imc":'<path d="m12 3 7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7l7-4Z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 16c.7-2 2-3 3.5-3s2.8 1 3.5 3"/>',
  "external-manager":'<circle cx="10" cy="8" r="3"/><path d="M4.5 18c.8-3.2 2.7-5 5.5-5s4.7 1.8 5.5 5"/><path d="M17 8h3M18.5 6.5V9.5"/>'
};
function iconMarkup(name,cls="ch-nexus-icon"){
  const body=ICONS[name]||ICONS.trophy;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
function stripEmoji(el){
  if(!el)return;
  for(const node of [...el.childNodes]){
    if(node.nodeType!==Node.TEXT_NODE)continue;
    const next=String(node.nodeValue||"").replace(emojiChars,"").replace(emojiJoiners,"").replace(/^\s+/,"");
    if(next!==node.nodeValue)node.nodeValue=next;
  }
}
function prependIcon(el,name,cls){
  if(!el||!name||el.querySelector(":scope > .ch-nexus-icon"))return;
  el.insertAdjacentHTML("afterbegin",iconMarkup(name,cls||"ch-nexus-icon"));
}
function phaseIcon(label){
  const v=upper(label);
  if(v.includes("GIRONE"))return"group";
  if(v.includes("ANDATA"))return"first-leg";
  if(v.includes("RITORNO"))return"second-leg";
  if(v.includes("FINALE"))return"final";
  return"trophy";
}
function statusIcon(card){
  const status=upper(card.querySelector(".ch-feed-status")?.textContent);
  if(status.includes("DERBY"))return"derby";
  if(status.includes("CAMPIONE")||status.includes("FINALISTA"))return"final";
  if(status.includes("QUALIFICATO"))return"qualified";
  if(status.includes("ELIMINATO"))return"eliminated";
  if(status.includes("ANDATA"))return"first-leg";
  if(status.includes("GIRONE"))return"group";
  return"trophy";
}
function headlineIcon(card){
  const headline=upper(card.querySelector(".ch-feed-copy h3")?.textContent);
  if(headline.includes("DERBY IMC"))return"derby";
  if(headline.includes("CAMPIONE")||headline.includes("TROFEO"))return"final";
  if(headline.includes("ELIMINATO")||headline.includes("FUORI DALLA COPPA")||headline.includes("FINALE AMARA"))return"eliminated";
  if(card.querySelector(".ch-feed-pen"))return"penalties";
  return statusIcon(card);
}
function processCard(card){
  if(!card)return;
  card.querySelectorAll(":scope .ch-nexus-icon").forEach(icon=>icon.remove());
  const meta=[...card.querySelectorAll(".ch-feed-copy-meta span")];
  if(meta[0]){stripEmoji(meta[0]);prependIcon(meta[0],"trophy","ch-nexus-icon ch-nexus-icon-meta ch-nexus-icon-gold");}
  if(meta[1])prependIcon(meta[1],phaseIcon(meta[1].textContent),"ch-nexus-icon ch-nexus-icon-meta");
  const headline=card.querySelector(".ch-feed-copy h3");
  if(headline){stripEmoji(headline);prependIcon(headline,headlineIcon(card),"ch-nexus-icon ch-nexus-icon-headline");}
  const status=card.querySelector(".ch-feed-status");
  if(status)prependIcon(status,statusIcon(card),"ch-nexus-icon ch-nexus-icon-status");
  const pen=card.querySelector(".ch-feed-pen");
  if(pen)prependIcon(pen,"penalties","ch-nexus-icon ch-nexus-icon-inline");
  const foot=[...card.querySelectorAll(".ch-feed-copy-foot span")];
  if(foot[1]){
    const text=upper(foot[1].textContent);
    if(text.includes("AVVERSARIO IMC"))prependIcon(foot[1],"manager-imc","ch-nexus-icon ch-nexus-icon-inline");
    else if(text.includes("AVVERSARIO EXTERNAL"))prependIcon(foot[1],"external-manager","ch-nexus-icon ch-nexus-icon-inline");
  }
  card.dataset.nexusIcons=VERSION;
}
function processPanel(panel){
  if(!panel)return;
  const titleBadge=panel.querySelector(".ch-feed-head h2 b");
  if(titleBadge){titleBadge.querySelectorAll(".ch-nexus-icon").forEach(icon=>icon.remove());stripEmoji(titleBadge);prependIcon(titleBadge,"trophy","ch-nexus-icon ch-nexus-icon-title ch-nexus-icon-gold");}
  panel.querySelectorAll(".ch-feed-card").forEach(processCard);
}
function scan(root=document){root.querySelectorAll?.(".ch-feed-panel").forEach(processPanel)}
const observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    for(const node of mutation.addedNodes){
      if(node.nodeType!==Node.ELEMENT_NODE)continue;
      if(node.matches?.(".ch-feed-card"))processCard(node);
      if(node.matches?.(".ch-feed-panel"))processPanel(node);
      node.querySelectorAll?.(".ch-feed-card").forEach(processCard);
      node.querySelectorAll?.(".ch-feed-panel").forEach(processPanel);
    }
  }
});
function rescanBurst(){[0,60,180,500,1200].forEach(ms=>setTimeout(()=>scan(),ms))}
function init(){
  scan();
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",ev=>{const btn=ev.target.closest?.(".clubhouse .ch-bottom-nav button");if(btn&&upper(btn.textContent)==="FEED")rescanBurst();},true);
  window.addEventListener("pageshow",rescanBurst);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.IMC_CLUBHOUSE_FEED_ICONS={version:VERSION,scan,rescan:rescanBurst};
})();