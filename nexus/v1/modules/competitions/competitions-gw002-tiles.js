(function(){
"use strict";
if(window.IMC_COMPETITIONS_GW002_TILES)return;
const VERSION="1.2.0";
const NAVY="currentColor",GOLD="currentColor",SILVER="currentColor";
function svgWrap(body){return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`}
function leagueNumber(card){const name=(card.querySelector("h3")?.textContent||"").trim();const m=name.match(/\bDiv\s*(\d+)\b/i);return m?m[1]:"1"}
function icon(kind,card){
  if(kind==="league")return svgWrap(`<text x="32" y="42" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="900" fill="${NAVY}">${leagueNumber(card)}</text><path d="M18 51h28" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>`);
  if(kind==="nationalcup")return svgWrap(`<path d="M23 15h18v8c0 10-4 17-9 20-5-3-9-10-9-20v-8Z" fill="#fff" stroke="${NAVY}" stroke-width="2.5"/><path d="M23 19h-7c0 9 3 14 10 15M41 19h7c0 9-3 14-10 15" fill="none" stroke="${SILVER}" stroke-width="2.7" stroke-linecap="round"/><path d="M29 43h6v6h8v3H21v-3h8Z" fill="${NAVY}"/><path d="M26 17h12" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`);
  if(kind==="leaguecup")return svgWrap(`<path d="M22 15h20v8c0 10-4 17-10 20-6-3-10-10-10-20v-8Z" fill="#fff" stroke="${NAVY}" stroke-width="2.5"/><path d="M22 19h-7c0 9 3 14 10 15M42 19h7c0 9-3 14-10 15" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/><path d="M29 43h6v6h9v3H20v-3h9Z" fill="${NAVY}"/><path d="M27 20h10M29 24h6" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`);
  if(kind==="charityshield")return svgWrap(`<path d="M32 13 46 18v11c0 10-5 17-14 22-9-5-14-12-14-22V18l14-5Z" fill="#fff" stroke="${NAVY}" stroke-width="2.7"/><path d="M32 18 41 21v8c0 7-3 12-9 16-6-4-9-9-9-16v-8l9-3Z" fill="none" stroke="${GOLD}" stroke-width="2"/>`);
  if(kind==="champions")return svgWrap(`<circle cx="32" cy="31" r="18" fill="#fff" stroke="${NAVY}" stroke-width="2.4"/><path d="m32 14 3.2 6.8 7.4-1.1-4.8 5.7 5.1 5.4-7.4-.6L32 37l-3.5-6.8-7.4.6 5.1-5.4-4.8-5.7 7.4 1.1L32 14Z" fill="${NAVY}"/><circle cx="32" cy="31" r="5.5" fill="#fff" stroke="${GOLD}" stroke-width="1.7"/><path d="M19 51h26" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>`);
  if(kind==="smfashield")return svgWrap(`<path d="M32 13 46 18v11c0 10-5 17-14 22-9-5-14-12-14-22V18l14-5Z" fill="#fff" stroke="${NAVY}" stroke-width="2.7"/><path d="m32 20 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L32 20Z" fill="${GOLD}"/>`);
  if(kind==="supercup")return svgWrap(`<path d="M26 14h12l3 7-3 17-6 7-6-7-3-17 3-7Z" fill="#fff" stroke="${NAVY}" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 19h10M32 18v20" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/><path d="M29 45h6v5h8v3H21v-3h8Z" fill="${NAVY}"/>`);
  if(kind==="worldcup")return svgWrap(`<circle cx="32" cy="31" r="18" fill="#fff" stroke="${NAVY}" stroke-width="2.5"/><path d="M14 31h36M32 13c7 7 10 12 10 18s-3 11-10 18M32 13c-7 7-10 12-10 18s3 11 10 18M18 20c8 5 20 5 28 0M18 42c8-5 20-5 28 0" fill="none" stroke="${NAVY}" stroke-width="1.7" opacity=".9"/><path d="M22 50h20" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>`);
  return svgWrap(`<circle cx="30" cy="29" r="16" fill="#fff" stroke="${NAVY}" stroke-width="2.4"/><path d="M14 29h32M30 13c6 7 9 11 9 16s-3 10-9 16M30 13c-6 7-9 11-9 16s3 10 9 16" fill="none" stroke="${NAVY}" stroke-width="1.6"/><circle cx="45" cy="44" r="10" fill="#fff" stroke="${GOLD}" stroke-width="2"/><path d="m40 44 3 3 6-7" fill="none" stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
}
function kindFor(card){
  const label=(card.querySelector(".cp-lab-copy p")?.textContent||"").trim().toUpperCase();
  const name=(card.querySelector("h3")?.textContent||"").trim().toUpperCase();
  if(label.startsWith("LEAGUE ·"))return"league";
  if(label==="NATIONAL CUP")return"nationalcup";
  if(label==="LEAGUE CUP")return"leaguecup";
  if(label==="CHARITY SHIELD")return"charityshield";
  if(label==="SUPER CUP")return"supercup";
  if(label==="WORLD CUP QUALIFIER")return"qualifier";
  if(label==="WORLD CUP")return"worldcup";
  if(label==="INTERNATIONAL"&&name.includes("CHAMPIONS"))return"champions";
  if(label==="INTERNATIONAL"&&name.includes("SHIELD"))return"smfashield";
  return"qualifier";
}
function apply(){
  document.querySelectorAll(".cp-menu.cp-gw002-lab .cp-lab-card").forEach(card=>{
    if(card.dataset.tileIconVersion===VERSION)return;
    const old=card.querySelector(":scope > .cp-menu-emblem, :scope > .cp-menu-art, :scope > .cp-tile-icon");
    if(!old)return;
    const kind=kindFor(card);
    const tile=document.createElement("div");
    tile.className=`cp-tile-icon cp-tile-${kind}`;
    tile.innerHTML=icon(kind,card);
    old.replaceWith(tile);
    card.dataset.tileIconVersion=VERSION;
  });
}
const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("DOMContentLoaded",apply);
apply();
window.IMC_COMPETITIONS_GW002_TILES={version:VERSION,apply};
})();