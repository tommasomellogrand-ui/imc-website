'use strict';
(() => {
 const world=document.getElementById('world');
 function update(){document.querySelectorAll('.admin-nav a').forEach(a=>{const url=new URL(a.href);url.searchParams.set('world',world.value);a.href=url.pathname+url.search;});}
 if(world){world.addEventListener('change',update);update();}
})();
