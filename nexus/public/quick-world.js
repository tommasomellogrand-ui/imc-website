(()=>{'use strict';
const names={GW001:'Road To History',GW002:'Gold 558',GW003:'Gold 557',GW004:'World League',GW005:'Hall Of Famers',GW006:'Master League World',GW007:'The Four Kingdoms',GW008:'Gold 1',GW009:'Kick Off',GW010:'Game World 010'};
function current(){const p=new URLSearchParams(location.search),w=p.get('world');return names[w]?w:'GW001'}
function sync(){const select=document.getElementById('quickWorld'),label=document.getElementById('quickWorldCurrent');if(!select||!label)return;const w=current();if(!select.options.length)for(const [id,name] of Object.entries(names))select.add(new Option(`${id} · ${name}`,id));select.value=w;label.textContent=`${w} · ${names[w]}`.toUpperCase()}
function change(e){const w=e.target.value;if(!names[w])return;const p=new URLSearchParams(location.search);p.set('world',w);p.set('offset','0');history.pushState(null,'',`${location.pathname}?${p}`);window.dispatchEvent(new PopStateEvent('popstate'));requestAnimationFrame(sync)}
function init(){const select=document.getElementById('quickWorld');if(!select)return;sync();select.addEventListener('change',change);window.addEventListener('popstate',()=>requestAnimationFrame(sync));document.addEventListener('click',()=>requestAnimationFrame(sync))}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
