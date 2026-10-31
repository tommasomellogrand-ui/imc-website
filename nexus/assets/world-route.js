(()=>{'use strict';
const match=location.pathname.match(/^\/nexus\/(gw00[1-9]|gw01[01])(?:\/|$)/i),p=new URLSearchParams(location.search),valid=w=>/^GW(?:00[1-9]|01[01])$/.test(w||'');
if(match){const w=match[1].toUpperCase();p.set('world',w);history.replaceState(null,'',location.pathname+'?'+p);try{localStorage.setItem('imc_nexus_world',w)}catch(e){}}
else if(valid(p.get('world'))&&(/^\/nexus\/(?:index.html)?$/.test(location.pathname)||/^\/nexus\/competitions\/(?:index|view|domestic|family|group)?(?:\.html)?$/.test(location.pathname))){const dest='/nexus/'+p.get('world').toLowerCase()+'/'+(location.pathname.includes('/competitions/')?'competitions/':'');location.replace(dest+'?'+p+location.hash);return;}
function links(){document.querySelectorAll('a[href]').forEach(a=>{let u;try{u=new URL(a.href)}catch(e){return}if(u.origin!==location.origin)return;const w=u.searchParams.get('world');if(!valid(w))return;if(/^\/nexus\/(?:index.html)?$/.test(u.pathname))u.pathname='/nexus/'+w.toLowerCase()+'/';else if(/^\/nexus\/competitions\/(?:index.html)?$/.test(u.pathname))u.pathname='/nexus/'+w.toLowerCase()+'/competitions/';else return;if(a.href!==u.href)a.href=u.href;});}
addEventListener('DOMContentLoaded',()=>{links();new MutationObserver(links).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});});
})();
