(function(){
"use strict";
if(window.IMC_ROAD_CHRONICLE_ISSUES)return;
const VERSION="2.0.1";
let host=null;
let homeHtml="";
function patchHomeLabels(){
  document.querySelectorAll('.rc-cover-entry').forEach(btn=>{
    const em=btn.querySelector('.rc-copy em');
    const h2=btn.querySelector('.rc-copy h2');
    if(em&&em.textContent!=='THE ROAD CHRONICLE')em.textContent='THE ROAD CHRONICLE';
    if(h2&&h2.textContent.trim()!=='Issues')h2.textContent='Issues';
  });
}
function issuesHtml(){return `<section class="rc-page rc-issues-page" aria-label="The Road Chronicle Issues">
  <button type="button" class="rc-back rc-issues-back" data-rc-issues-back>← THE ROAD CHRONICLE</button>
  <div class="rc-masthead"><div class="rc-kicker"><span></span><b>GW001 / ROAD TO HISTORY</b><span></span></div><h1><small>THE ROAD</small>CHRONICLE</h1><div class="rc-divider"><i></i><strong>▤</strong><i></i></div><p>ROAD TO HISTORY OFFICIAL JOURNAL</p></div>
  <header class="rc-issues-head">
    <em>THE ROAD CHRONICLE</em>
    <h2>ISSUES</h2>
    <p>Tutte le pubblicazioni ufficiali del Road To History Journal.</p>
  </header>
  <section class="rc-issues-list">
    <article class="rc-issue-card" data-rc-issue="issue-001">
      <div class="rc-issue-number"><small>ISSUE</small><strong>1</strong></div>
      <div class="rc-issue-copy">
        <span>SPECIAL EDITION</span>
        <h3>LA PRIMA È GIALLONERA</h3>
        <p>01.09.2026 · 4 PAGINE</p>
      </div>
    </article>
  </section>
</section>`;}
function openIssues(ev,cover){
  host=cover.closest('.rc-page')?.parentElement||null;
  if(!host)return;
  homeHtml=host.innerHTML;
  host.innerHTML=issuesHtml();
  ev.preventDefault();
  ev.stopImmediatePropagation();
  window.scrollTo({top:0,behavior:'auto'});
}
function restoreHome(){
  if(!host||!homeHtml)return;
  host.innerHTML=homeHtml;
  patchHomeLabels();
  window.scrollTo({top:0,behavior:'auto'});
}
document.addEventListener('click',ev=>{
  const back=ev.target.closest&&ev.target.closest('[data-rc-issues-back]');
  if(back){ev.preventDefault();ev.stopImmediatePropagation();restoreHome();return;}
  const cover=ev.target.closest&&ev.target.closest("[data-rc-open='cover']");
  if(cover){openIssues(ev,cover);}
},true);
const observer=new MutationObserver(()=>patchHomeLabels());
function start(){patchHomeLabels();observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.IMC_ROAD_CHRONICLE_ISSUES={version:VERSION};
})();