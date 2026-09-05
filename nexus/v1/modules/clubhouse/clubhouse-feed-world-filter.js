(function(){
"use strict";
if(window.IMC_CLUBHOUSE_FEED_WORLD_FILTER)return;
const VERSION="1.0.1";
const ALLOWED=new Set(["GW002","GW003","GW007","GW008"]);
let scheduled=false,lastWorld="";
const c=v=>String(v==null?"":v).trim();
function currentWorld(){
 const el=document.querySelector('.clubhouse [data-ch-world-current]');
 const gw=c(el&&el.textContent).toUpperCase();
 return /^GW\d{3}$/.test(gw)?gw:"";
}
function cardWorld(card){
 const el=card.querySelector('.ch-feed-copy-foot span:first-child');
 const gw=c(el&&el.textContent).toUpperCase();
 return /^GW\d{3}$/.test(gw)?gw:"";
}
function apply(){
 scheduled=false;
 const root=document.querySelector('.clubhouse');
 if(!root)return;
 const list=root.querySelector('[data-ch-feed-list]');
 if(!list)return;
 const gw=currentWorld();
 lastWorld=gw;
 const cards=[...list.querySelectorAll('.ch-feed-card[data-fixture-id]')];
 let visible=0;
 for(const card of cards){
   const show=ALLOWED.has(gw)&&cardWorld(card)===gw;
   card.hidden=!show;
   card.setAttribute('data-world-filter-seen','1');
   if(show)visible++;
 }
 let empty=list.querySelector('[data-ch-feed-world-empty]');
 if(cards.length&&visible===0){
   if(!empty){empty=document.createElement('div');empty.className='ch-feed-empty';empty.setAttribute('data-ch-feed-world-empty','');list.prepend(empty)}
   empty.textContent=gw?`Nessuna news di Coppa disponibile per ${gw}.`:'Nessuna news di Coppa disponibile.';
   empty.hidden=false;
 }else if(empty){empty.hidden=true}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
new MutationObserver(()=>{const gw=currentWorld();if(gw!==lastWorld||document.querySelector('.ch-feed-card[data-fixture-id]:not([data-world-filter-seen])'))schedule()}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('click',evt=>{if(evt.target.closest&&evt.target.closest('[data-ch-world-prev],[data-ch-world-next],.clubhouse .ch-bottom-nav button'))setTimeout(schedule,0)});
schedule();
window.IMC_CLUBHOUSE_FEED_WORLD_FILTER={version:VERSION,refresh:schedule,allowed:[...ALLOWED]};
})();