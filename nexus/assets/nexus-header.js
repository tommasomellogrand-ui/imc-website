/* Presentation only. Preserve data, forms, world selectors and routes. */
(()=>{'use strict';
 if(document.getElementById('imc-nexus-header'))return;
 let theme=document.querySelector('meta[name="theme-color"]');if(!theme){theme=document.createElement('meta');theme.name='theme-color';document.head.append(theme)}theme.content='#041322';
 const old=document.querySelector('header.masthead,header.top');
 const h=document.createElement('header');h.id='imc-nexus-header';
 h.innerHTML='<div class="nh-wrap"><a class="nh-brand" href="/nexus/" aria-label="Nexus, archivio Italian Masters Club"><span class="nh-crest-frame"><img class="nh-crest" src="/site-assets/images/imc-logo.png" alt="Logo ufficiale IMC" width="102" height="102"></span><span class="nh-caption">ITALIAN<br>MASTERS<br>CLUB</span><span class="nh-sep" aria-hidden="true"></span><img class="nh-word" src="/nexus/assets/diagonal/nexus-night.webp" alt="Nexus" width="196" height="65"></a><button type="button" class="nh-menu" aria-label="Apri menu" aria-controls="nh-navigation" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><nav id="nh-navigation" class="nh-links" aria-label="Navigazione Nexus"><a href="/nexus/">Home</a><a href="/nexus/worlds/">Worlds</a><a href="/nexus/managers/">Managers</a><a href="/imc_campus/world_center/">World Center</a></nav></div>';
 if(old)old.replaceWith(h);else document.body.prepend(h);
 const path=location.pathname,active=path.includes('/worlds/')?'/nexus/worlds/':path.includes('/managers/')?'/nexus/managers/':/^\/nexus\/(?:index.html)?$/.test(path)?'/nexus/':null;
 if(active)h.querySelector('a[href="'+active+'"]:not(.nh-brand)')?.setAttribute('aria-current','page');
 const button=h.querySelector('.nh-menu'),nav=h.querySelector('.nh-links');
 function close(){nav.classList.remove('open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Apri menu')}
 button.addEventListener('click',()=>{const open=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Chiudi menu':'Apri menu')});
 h.addEventListener('keydown',e=>{if(e.key==='Escape'){close();button.focus()}});
 document.addEventListener('click',e=>{if(!h.contains(e.target))close()});
})();
