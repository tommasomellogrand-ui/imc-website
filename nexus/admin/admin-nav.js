'use strict';
(() => {
 const menu=document.querySelector('.admin-nav');
 if(menu&&!menu.querySelector('a[href^="transfers-check.html"]')){const link=document.createElement('a');link.href='transfers-check.html';link.textContent='Transfer Check';if(location.pathname.endsWith('/transfers-check.html'))link.setAttribute('aria-current','page');menu.appendChild(link);}
 const world=document.getElementById('world');
 function update(){document.querySelectorAll('.admin-nav a').forEach(a=>{const url=new URL(a.href);url.searchParams.set('world',world.value);a.href=url.pathname+url.search;});}
 if(world){world.addEventListener('change',update);update();}
})();

