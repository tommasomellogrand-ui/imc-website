/* Shared visual layer: never changes data or statistics. */
(()=>{'use strict';
 const portal=location.pathname.endsWith('/home.html');
 const brand=document.querySelector('#nx-universal-header .nx-universal-brand');
 if(brand)brand.href='/nexus/club-house/home.html';
 const home=document.querySelector('#nx-universal-nav a');
 if(home){home.href='/nexus/club-house/home.html';if(portal){document.querySelectorAll('#nx-universal-nav [aria-current]').forEach(a=>a.removeAttribute('aria-current'));home.setAttribute('aria-current','page');}}
 if(portal){const context=document.getElementById('nx-universal-context');if(context)context.hidden=true;}
})();
