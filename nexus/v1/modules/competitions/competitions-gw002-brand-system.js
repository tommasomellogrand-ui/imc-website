(function(){
"use strict";
if(window.IMC_COMPETITIONS_GW002_BRAND_SYSTEM)return;
const VERSION="1.0.2";
const clean=v=>String(v==null?"":v).trim().toLowerCase();
const classes=["nx-brand-domestic","nx-brand-international","nx-brand-nations"];
function setBrand(node,type){
  if(!node)return;
  if(type!=="domestic"&&type!=="international"&&type!=="nations")return;
  const desired=`nx-brand-${type}`;
  if(node.classList.contains("nx-brand-system")&&node.classList.contains(desired)&&node.dataset.nxBrand===type)return;
  node.classList.remove(...classes);
  node.classList.add("nx-brand-system",desired);
  node.dataset.nxBrand=type;
}
function menuBrand(menu){
  const world=clean(menu.querySelector(".cp-menu-world span")?.textContent);
  if(world!=="gw002")return;
  const active=menu.querySelector('.cp-type-tabs [data-cp-type].is-active');
  const type=clean(active?.getAttribute("data-cp-type"));
  setBrand(menu,type);
}
function detailBrand(root){
  const head=root.querySelector(".cd-head");
  const world=clean(head?.querySelector("span")?.textContent);
  if(world!=="gw002")return;
  if(head&&head.style.position!=="relative")head.style.position="relative";
  const subtitle=clean(head?.querySelector("small")?.textContent);
  let type="";
  if(subtitle.includes("domestic"))type="domestic";
  else if(subtitle.includes("international"))type="international";
  else if(subtitle.includes("nations"))type="nations";
  setBrand(root,type);
}
function apply(){
  document.querySelectorAll(".cp-menu.cp-gw002-lab").forEach(menuBrand);
  document.querySelectorAll(".cd-v2").forEach(detailBrand);
}
let raf=0;
function queue(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply()})}
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
document.addEventListener("DOMContentLoaded",apply);
document.addEventListener("click",queue,true);
apply();
window.IMC_COMPETITIONS_GW002_BRAND_SYSTEM={version:VERSION,apply};
})();