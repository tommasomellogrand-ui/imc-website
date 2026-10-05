/* Shared presentation enhancement. No fetching, routing or data changes. */
(()=>{'use strict';
 const groups={tabs:'.tabs,.stat-tabs,.dr-tabs,.hh-detail-tabs,.mx-tabs,.transfer-tabs,.clubhouse-page #tabs,.md-tabs,.article-tabs,.deep-tabs',scope:'.manager-scope,#scope-tabs,.group-tabs,.trophy-groups,.hh-scope',filter:'.nexus-filter-chips,.selection-tabs,.dr-chips,.division-tabs,.md-divisions'};
 const labels={'OVERVIEW':'Overview','MANAGER':'Manager','ROSTER':'Roster','STATS':'Stats','DATA ROOM':'Data Room','H2H':'H2H','TRANSFERS':'Transfers','TROPHY ROOM':'Trophy Room','CAREER':'Career','TABLE':'Table','RESULTS':'Results','SCHEDULE':'Schedule','IMC ACTIVE':'IMC Active','EXT ACTIVE':'EXT Active','IMC CAREER':'IMC Career'};
 const known=new Map();let pending=false;
 const children=nav=>Array.from(nav.children).filter(e=>e.matches('button,a'));
 const selected=nav=>children(nav).find(e=>e.matches('.active,.on,[aria-pressed="true"],[aria-selected="true"],[aria-current="page"]'));
 function reveal(nav,button){if(!button||nav.clientWidth===0)return;const a=nav.getBoundingClientRect(),b=button.getBoundingClientRect();if(b.left<a.left+6)nav.scrollLeft-=a.left+6-b.left;else if(b.right>a.right-6)nav.scrollLeft+=b.right-a.right+6;}
 function scan(){pending=false;for(const [kind,selector] of Object.entries(groups))document.querySelectorAll(selector).forEach(nav=>{
   nav.dataset.nxNav=kind;
   if(!known.has(nav)){known.set(nav,null);nav.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||!e.target.matches('button,a'))return;const items=children(nav).filter(b=>!b.disabled),i=items.indexOf(e.target);if(i<0)return;const index=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;e.preventDefault();items[index].focus({preventScroll:true});reveal(nav,items[index]);});}
   if(kind==='tabs')children(nav).forEach(b=>{const raw=b.textContent.trim();if(labels[raw]&&raw!==labels[raw]&&b.childElementCount===0){if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',raw);b.textContent=labels[raw];}});
   const active=selected(nav);if(known.get(nav)!==active){known.set(nav,active);reveal(nav,active);}
 });for(const nav of known.keys())if(!nav.isConnected)known.delete(nav);}
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(scan);}};
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed','aria-selected','aria-current','hidden']});
 window.addEventListener('resize',()=>{for(const [nav,active] of known)reveal(nav,active);},{passive:true});
 scan();
})();
