(function(){
"use strict";

const VERSION="0.1.0-formation-map";
const ROOT_ID="imcMatchReportGW001";
let timer=null;

const X={
  1:[50],
  2:[36,64],
  3:[20,50,80],
  4:[12,37,63,88],
  5:[10,30,50,70,90]
};
const Y={
  3:[16,46,74],
  4:[13,33,53,74],
  5:[11,27,43,59,75]
};

const FORMATIONS={
  "4-4-2":[[9,10],[11,8,6,7],[5,4,3,2]],
  "4-3-3":[[11,9,7],[8,6,10],[5,4,3,2]],
  "4-2-3-1":[[9],[11,10,7],[8,6],[5,4,3,2]],
  "3-5-2":[[9,7],[11,8,10,6,2],[5,4,3]],
  "4-3-1-2":[[9,7],[10],[11,8,6],[5,4,3,2]],
  "4-2-4":[[11,9,10,7],[8,6],[5,4,3,2]],
  "4-2-2-2":[[9,10],[11,7],[8,6],[5,4,3,2]],
  "4-1-3-2":[[9,10],[11,8,7],[6],[5,4,3,2]],
  "4-5-1":[[9],[11,8,10,6,7],[5,4,3,2]],
  "3-1-3-3":[[11,9,7],[8,10,6],[2],[5,4,3]],
  "4-3-2-1":[[9],[11,10],[8,6,7],[5,4,3,2]],
  "4-4-1-1":[[9],[10],[11,8,6,7],[5,4,3,2]],
  "5-3-2":[[9,10],[8,6,7],[11,5,4,3,2]],
  "3-4-3":[[11,9,7],[8,10,6,2],[5,4,3]],
  "3-4-1-2":[[9,7],[10],[11,8,6,2],[5,4,3]],
  "3-4-2-1":[[9],[11,10],[8,6,7,2],[5,4,3]],
  "3-2-2-2-1":[[9],[11,10],[8,6],[7,2],[5,4,3]],
  "5-4-1":[[9],[8,10,6,7],[11,5,4,3,2]],
  "5-2-3":[[11,9,10],[8,6],[7,5,4,3,2]],
  "3-3-4":[[11,9,10,7],[8,6,2],[5,4,3]]
};

function normalizeFormation(value){
  return String(value||"")
    .replace(/\s+/g," ")
    .trim()
    .toUpperCase()
    .replace(/\s*[ABC]$/i,"")
    .trim();
}

function buildPositions(rows){
  const out={1:[50,91]};
  const ys=Y[rows.length]||Y[4];
  rows.forEach(function(row,rowIndex){
    const xs=X[row.length]||X[1];
    row.forEach(function(slot,index){
      out[slot]=[xs[index],ys[rowIndex]];
    });
  });
  return out;
}

function apply(){
  const root=document.getElementById(ROOT_ID);
  if(!root)return;
  const panel=root.querySelector('[data-imcmr-panel="lineups"]');
  if(!panel)return;
  const board=panel.querySelector(".imcmr-editorial-board");
  const formationNode=panel.querySelector(".imcmr-editorial-formation");
  if(!board||!formationNode)return;

  const key=normalizeFormation(formationNode.textContent);
  const rows=FORMATIONS[key];
  if(!rows)return;
  const positions=buildPositions(rows);

  board.querySelectorAll(".imcmr-editorial-player").forEach(function(player){
    const slot=Number(player.querySelector(".imcmr-editorial-number")?.textContent||0);
    const pos=positions[slot];
    if(!pos)return;
    player.style.setProperty("--left",pos[0]+"%");
    player.style.setProperty("--top",pos[1]+"%");
  });
  board.dataset.formationMap=key;
}

function schedule(){
  clearTimeout(timer);
  timer=setTimeout(apply,25);
}

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("click",function(event){
  if(event.target&&event.target.closest&&event.target.closest('[data-imcmr-tab="lineups"],[data-editorial-side]'))schedule();
},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
else schedule();
window.addEventListener("pageshow",schedule);

window.IMC_MATCH_REPORT_GW001_FORMATION_MAP={version:VERSION,refresh:apply};
})();