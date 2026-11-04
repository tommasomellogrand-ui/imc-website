(()=>{'use strict';
 const base='/roadtohistory/alltoplayfor/',body=document.body;
 // Retain old shared links while removing the shared date selector from the site.
 if(body.dataset.programme==='home'){
  const u=new URL(location.href),program=u.searchParams.get('section')||(u.hash.startsWith('#postmatch-')?'final-whistle':null);
  if(['coffee-time','daytime','final-whistle','rth-24'].includes(program)){
   fetch('programmes-catalog.json?v=20261023-pages1').then(r=>r.json()).then(c=>{
    const rubric=program==='daytime'&&c.daytime.rubrics[u.searchParams.get('daytime')]?u.searchParams.get('daytime'):null;
    const entry=rubric?c.daytime.rubrics[rubric]:c[program],date=u.searchParams.get('date');
    let target=base+program+'/'+(rubric?rubric+'/':'')+(entry.editions.includes(date)?date+'/':'');
    if(u.searchParams.has('club'))target+='?'+new URLSearchParams({club:u.searchParams.get('club')});
    location.replace(target+u.hash);
   }).catch(()=>{});
  }
 }
 // Hash links in old edition renderers must stay on the current dedicated page.
 document.addEventListener('click',e=>{
  const a=e.target.closest('a');if(!a||!a.getAttribute('href')?.startsWith('#'))return;
  e.preventDefault();const id=a.getAttribute('href').slice(1),target=document.getElementById(id);
  if(target){history.replaceState(null,'',location.pathname+location.search+'#'+id);target.scrollIntoView({behavior:'smooth'})}
 });
})();
