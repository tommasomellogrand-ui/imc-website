import {readFixtures,readSnapshot,readReport} from './data-client.js';
import {createViews,esc} from './core-views.js?v=ENG00907-2';
const root=document.getElementById('app'),page=document.body.dataset.page||'home';
const NAV=[['home','Il mondo','index.html'],['competitions','Competizioni','competitions.html'],['results','Risultati','results.html'],['schedule','Calendario','schedule.html'],['match','Match Center','match.html'],['standings','Classifiche','standings.html'],['manager','Manager','manager.html'],['player','Player','player.html'],['club','Club','club.html'],['archive','Archivio','archive.html']];
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${({home:'<path d="M3 10 12 3l9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',results:'<rect x="3" y="5" width="18" height="14"/><path d="M12 5v14M6 10h3v4H6M15 10h3v4h-3"/>',standings:'<path d="M5 21V11h4v10M10 21V4h4v17M15 21v-7h4v7"/>',archive:'<path d="M3 5h18v4H3zM5 9v12h14V9M9 13h6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'})[n]}</svg>`;
const navlinks=NAV.map(([id,n,h],i)=>`<a href="${h}" ${id===page?'aria-current="page"':''}><span>${String(i+1).padStart(2,'0')}</span>${n}</a>`).join('');
root.innerHTML=`<a class="skip" href="#main">Vai al contenuto</a><aside class="rail"><a class="rail-brand" href="index.html">RTH<span class="tricolor" style="display:block;margin-top:8px"></span><small>ROAD TO HISTORY</small></a><span class="eyebrow">COMMAND ARCHIVE</span><nav aria-label="Navigazione principale">${navlinks}</nav><div class="rail-bottom">ITALIAN MASTERS CLUB<br>GW001 · VISUAL EXPLORATION<br><br>LIVE NOW.<br>ARCHIVED FOREVER.</div></aside><div class="shell"><header class="topbar"><a class="brand" href="index.html"><img src="./exploration-assets/imc-logo.png" alt="Italian Masters Club" width="43" height="43"><span><strong>ROAD TO HISTORY</strong><small>ITALIAN MASTERS CLUB · GW001</small></span></a><div class="top-context"><span class="edition">ARCHIVE × COMMAND CENTER</span><button class="menu-button" type="button" data-menu aria-label="Apri menu"><span>Menu</span><i class="menu-lines" aria-hidden="true"></i></button></div></header><div class="exploration-tag"><span>VISUAL DESIGN EXPLORATION · 01</span><span>PARTITE LIVE · DOSSIER IMC</span></div><main class="canvas scan" id="main" tabindex="-1"><p role="status" data-state="loading">Caricamento in corso…</p></main><footer class="footer"><div><span class="tricolor"></span><strong>IMC · ROAD TO HISTORY</strong><br>Live now. Archived forever.</div><div>Partite live · Dossier IMC versionati<br>Immagini AI simboliche dove indicate</div></footer></div><nav class="bottomnav" aria-label="Navigazione mobile">${[['home','Mondo','index.html'],['results','Risultati','results.html'],['standings','Ranking','standings.html'],['archive','Archivio','archive.html']].map(([id,n,h])=>`<a href="${h}" ${id===page?'aria-current="page"':''}>${icon(id)}<span>${n}</span></a>`).join('')}<button data-menu type="button" aria-label="Apri tutte le pagine">${icon('menu')}<span>Esplora</span></button></nav><dialog id="navigation"><div class="dialog-head"><span class="eyebrow">GW001 · ESPLORA IL MONDO</span><button id="close-menu" aria-label="Chiudi menu">×</button></div><nav class="menu-grid" aria-label="Tutte le pagine">${NAV.map(([id,n,h],i)=>`<a href="${h}" ${id===page?'aria-current="page"':''}><small>${String(i+1).padStart(2,'0')}</small>${n}</a>`).join('')}</nav></dialog>`;
const dialog=document.getElementById('navigation');document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));document.getElementById('close-menu').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});

const main=document.getElementById('main');
let active=null;
async function load(){
  active?.abort();const controller=new AbortController();active=controller;
  const timeout=setTimeout(()=>controller.abort(),45000);
  main.innerHTML='<p role="status" data-state="loading">Caricamento in corso…</p>';
  try {
    const id=new URLSearchParams(location.search).get('id');
    const [snapshot,results,schedule,report]=await Promise.all([readSnapshot({signal:controller.signal}),readFixtures('GW001','results',{signal:controller.signal}),readFixtures('GW001','schedule',{signal:controller.signal}),page==='match'&&id?readReport(id,{signal:controller.signal}):null]);
    if(active!==controller)return;
    if([results.meta.snapshot_version,schedule.meta.snapshot_version,...(report?[report.snapshot_version]:[])].some(v=>v!==snapshot.version))throw new Error('snapshot_changed');
    const views=createViews(snapshot,{results:results.rows,schedule:schedule.rows},report);
    main.innerHTML=views[page]?views[page]():'<h1>Pagina non trovata</h1>';
    main.dataset.state='ready';main.dataset.snapshotVersion=snapshot.version;
    document.getElementById('dossier-search')?.addEventListener('input',e=>{const term=e.target.value.trim().toLocaleLowerCase('it');document.querySelectorAll('[data-search]').forEach(el=>{el.hidden=!el.dataset.search.includes(term);});});
  } catch(e){
    if(active!==controller)return;
    const missing=e.message==='fixture_not_found';
    main.dataset.state=missing?'not-found':'error';
    main.innerHTML='<header class="pagehead"><span class="eyebrow">ROAD TO HISTORY · GW001</span><h1>'+(missing?'Partita non trovata.':'Lettura non disponibile.')+'</h1></header><p class="empty">'+(e.message==='report_source_conflict'?'Il report presenta dati discordanti con il risultato.':missing?'Il riferimento richiesto non è presente.':'Riprova per caricare i dati.')+'</p><button id="retry" type="button">Riprova</button><p><a class="text-link" href="results.html">Torna ai risultati ↗</a></p>';
    document.getElementById('retry').addEventListener('click',load);
  } finally{clearTimeout(timeout);}
}
window.addEventListener('pagehide',()=>active?.abort());
window.addEventListener('pageshow',e=>{if(e.persisted)load();});
load();
