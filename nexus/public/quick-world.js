(()=>{'use strict';
const names={GW001:'Road To History',GW002:'Gold 558',GW003:'Gold 557',GW004:'World League',GW005:'Hall Of Famers',GW006:'Master League World',GW007:'The Four Kingdoms',GW008:'Gold 1',GW009:'Kick Off',GW010:'Game World 010'};
function active(){const select=document.getElementById('world'),urlWorld=new URLSearchParams(location.search).get('world');if(select&&names[select.value])return select.value;if(names[urlWorld])return urlWorld;return 'GW001'}
function sync(){const label=document.getElementById('quickWorldCurrent'),select=document.getElementById('world');if(!label||!select)return;const w=active();label.textContent=`${w} · ${names[w]}`.toUpperCase()}
function init(){const select=document.getElementById('world');if(!select)return;sync();select.addEventListener('change',()=>requestAnimationFrame(sync));window.addEventListener('popstate',()=>requestAnimationFrame(sync));const observer=new MutationObserver(()=>requestAnimationFrame(sync));observer.observe(select,{childList:true,subtree:true,attributes:true});setTimeout(sync,0)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
