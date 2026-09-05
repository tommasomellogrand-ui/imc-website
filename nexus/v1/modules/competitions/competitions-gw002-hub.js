(function(){
"use strict";
if(window.IMC_COMPETITIONS_GW002_HUB)return;
const VERSION="2.1.0";
function clean(v){return String(v==null?"":v).trim()}
function icon(kind){
  if(kind==='domestic')return `<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M17 22h38v10c0 16-7 26-19 32C24 58 17 48 17 32V22Z"/><path d="M17 27H9c0 13 4 20 14 22M55 27h8c0 13-4 20-14 22"/><path d="M31 61h10v5H26v-5h5"/></svg>`;
  if(kind==='international')return `<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="22"/><path d="M14 36h44M36 14c8 9 12 15 12 22S44 49 36 58M36 14c-8 9-12 15-12 22s4 13 12 22M20 22c10 6 22 6 32 0M20 50c10-6 22-6 32 0"/></svg>`;
  return `<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M22 12v48M25 16c15-8 22 8 35 0v25c-13 8-20-8-35 0Z"/><path d="M22 12h6"/></svg>`;
}
function scene(kind){
  if(kind==='domestic')return `<svg viewBox="0 0 260 160" aria-hidden="true"><defs><linearGradient id="dSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e9e5"/><stop offset="1" stop-color="#c97662"/></linearGradient><linearGradient id="dCup" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfdff"/><stop offset=".55" stop-color="#aeb9c7"/><stop offset="1" stop-color="#eef2f7"/></linearGradient></defs><path d="M0 90C42 54 91 42 143 46c48 3 88 20 117 48v66H0Z" fill="url(#dSky)" opacity=".72"/><path d="M4 122c36-28 77-41 126-41 51 0 94 14 126 43" fill="none" stroke="#B6533C" stroke-width="8" opacity=".34"/><path d="M12 132c34-22 73-32 118-32 47 0 88 11 120 34" fill="none" stroke="#fff" stroke-width="9" opacity=".75"/><path d="M28 115h194M48 100h154" stroke="#8D4032" stroke-width="2" opacity=".2"/><path d="M119 26h37v18c0 22-7 39-18.5 49C126 83 119 66 119 44Z" fill="url(#dCup)" stroke="#082b63" stroke-width="2.4"/><path d="M119 33h-13c0 20 6 31 21 35M156 33h13c0 20-6 31-21 35" fill="none" stroke="#B6533C" stroke-width="3.5" stroke-linecap="round"/><path d="M134 92h7v12h18v7h-43v-7h18Z" fill="#082b63"/><circle cx="137.5" cy="52" r="8" fill="none" stroke="#B6533C" stroke-width="2"/><path d="M133 52h9M137.5 47v10" stroke="#B6533C" stroke-width="1.5"/></svg>`;
  if(kind==='international')return `<svg viewBox="0 0 260 160" aria-hidden="true"><defs><radialGradient id="iGlow"><stop offset="0" stop-color="#9bcfbe" stop-opacity=".9"/><stop offset="1" stop-color="#176B57" stop-opacity="0"/></radialGradient><linearGradient id="iCup" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9fb4bf"/><stop offset=".7" stop-color="#f9ffff"/><stop offset="1" stop-color="#8197a2"/></linearGradient></defs><circle cx="173" cy="78" r="84" fill="url(#iGlow)"/><g opacity=".3" fill="none" stroke="#176B57" stroke-width="1.4"><circle cx="174" cy="78" r="58"/><path d="M116 78h116M174 20c18 20 28 38 28 58s-10 38-28 58M174 20c-18 20-28 38-28 58s10 38 28 58M128 42c27 16 65 16 92 0M128 114c27-16 65-16 92 0"/></g><g transform="translate(94 11)"><path d="M40 19h56v31c0 37-11 62-28 74C51 112 40 87 40 50Z" fill="url(#iCup)" stroke="#082b63" stroke-width="2.8"/><path d="M40 27H23c0 33 9 48 31 53M96 27h17c0 33-9 48-31 53" fill="none" stroke="#176B57" stroke-width="4.4" stroke-linecap="round"/><path d="M63 122h10v12h21v8H42v-8h21Z" fill="#082b63"/><path d="M54 35c9-5 19-5 28 0" fill="none" stroke="#176B57" stroke-width="2"/><circle cx="68" cy="57" r="12" fill="none" stroke="#176B57" stroke-width="2"/><path d="m68 48 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z" fill="#176B57"/></g><g fill="#fff" opacity=".9"><circle cx="49" cy="33" r="2.6"/><circle cx="72" cy="55" r="1.8"/><circle cx="36" cy="82" r="1.6"/><circle cx="84" cy="24" r="1.3"/></g></svg>`;
  return `<svg viewBox="0 0 260 160" aria-hidden="true"><defs><linearGradient id="nSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="#e7b85d"/></linearGradient></defs><path d="M0 74c46-26 90-36 133-31 48 6 92 28 127 65v52H0Z" fill="url(#nSky)" opacity=".78"/><g stroke="#A76F0C" stroke-width="2"><path d="M67 37v103M104 23v117M143 44v96M181 28v112M215 50v90"/><path d="M70 42c19-11 24 10 47 0v29c-23 11-28-10-47 0Z" fill="#f9f3e3"/><path d="M107 28c19-11 24 10 47 0v29c-23 11-28-10-47 0Z" fill="#D39A28"/><path d="M146 49c19-11 24 10 47 0v29c-23 11-28-10-47 0Z" fill="#082b63"/><path d="M184 33c19-11 24 10 47 0v29c-23 11-28-10-47 0Z" fill="#e3b850"/><path d="M218 55c13-7 17 7 31 0v24c-14 7-18-7-31 0Z" fill="#176B57"/></g><g fill="#D39A28" opacity=".35"><circle cx="43" cy="116" r="4"/><circle cx="57" cy="124" r="3"/><circle cx="194" cy="115" r="4"/><circle cx="206" cy="123" r="3"/></g><path d="M19 146c23-23 48-23 72 0M169 146c25-24 51-24 76 0" fill="none" stroke="#A76F0C" stroke-width="5" opacity=".35"/></svg>`;
}
function pattern(kind){
  if(kind==='domestic')return `<span class="cp-c3-pattern cp-c3-pattern-domestic"></span>`;
  if(kind==='international')return `<span class="cp-c3-pattern cp-c3-pattern-international"></span>`;
  return `<span class="cp-c3-pattern cp-c3-pattern-nations"></span>`;
}
function countFrom(root,selector){return clean(root.querySelector(selector)?.textContent)||'0'}
function card(kind,title,description,count){return `<button type="button" class="cp-c3-card cp-c3-card-${kind}" data-c3-open="${kind}">${pattern(kind)}<span class="cp-c3-icon">${icon(kind)}</span><span class="cp-c3-copy"><h3>${title}</h3><p>${description}</p><span class="cp-c3-count"><b>${count}</b> COMPETITIONS</span></span><span class="cp-c3-scene">${scene(kind)}</span><span class="cp-c3-arrow">›</span></button>`}
function sourceButton(hub,kind){
  if(kind==='domestic')return hub.querySelector(':scope > .cp-domestic[data-cp-open="domestic"]');
  if(kind==='international')return hub.querySelector(':scope > .cp-secondary-grid .cp-international[data-cp-open="international"]');
  if(kind==='nations')return hub.querySelector(':scope > .cp-secondary-grid .cp-nations[data-cp-open="nations"]');
  return null;
}
function apply(){
  document.querySelectorAll('.cp-hub').forEach(hub=>{
    const worldId=clean(hub.querySelector('.cp-world-mark span')?.textContent);
    if(worldId!=='GW002')return;
    if(hub.dataset.gw002BrandCVersion===VERSION&&hub.querySelector('.cp-c3-stack'))return;
    const domestic=countFrom(hub,'.cp-domestic .cp-count strong');
    const international=countFrom(hub,'.cp-international strong');
    const nations=countFrom(hub,'.cp-nations strong');
    let stack=hub.querySelector('.cp-c3-stack');
    if(!stack){stack=document.createElement('section');stack.className='cp-c3-stack';hub.appendChild(stack)}
    stack.innerHTML=[
      card('domestic','DOMESTIC','Leagues, National Cup, League Cup',domestic),
      card('international','INTERNATIONAL','SMFA Champions, SMFA Shield, Super Cup',international),
      card('nations','NATIONS','World Cup, Qualifiers, National Teams',nations)
    ].join('');
    hub.classList.add('cp-gw002-brand-c');
    hub.dataset.gw002BrandCVersion=VERSION;
  });
}
document.addEventListener('click',e=>{
  const card=e.target.closest&&e.target.closest('.cp-c3-card[data-c3-open]');
  if(!card)return;
  const hub=card.closest('.cp-hub');
  if(!hub)return;
  const kind=clean(card.getAttribute('data-c3-open'));
  const source=sourceButton(hub,kind);
  if(!source)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  source.click();
},true);
const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',apply);
apply();
window.IMC_COMPETITIONS_GW002_HUB={version:VERSION,apply};
})();
