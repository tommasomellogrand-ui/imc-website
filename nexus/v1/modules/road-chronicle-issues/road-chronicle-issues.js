(function(){
"use strict";
if(window.IMC_ROAD_CHRONICLE_ISSUES)return;
const VERSION="1.1.0";
let state={container:null,worldId:"GW001",view:"issues"};
const ISSUE_PATH="assets/road-chronicle/GW001/issues/issue-001/";
const ISSUE_PAGES=[
  "the-road-chronicle-issue-001-page-01.webp",
  "the-road-chronicle-issue-001-page-02.webp",
  "the-road-chronicle-issue-001-page-03.webp",
  "the-road-chronicle-issue-001-page-04.webp"
];
function renderIssues(){
  if(!state.container)return;
  state.view="issues";
  state.container.innerHTML=`<section class="rci-page" aria-label="The Road Chronicle Issues">
    <button type="button" class="rci-back" data-rci-back>← GW001</button>
    <header class="rci-head">
      <div class="rci-kicker">GW001 · ROAD TO HISTORY</div>
      <h1>THE ROAD CHRONICLE</h1>
      <p>ROAD TO HISTORY OFFICIAL JOURNAL</p>
    </header>
    <section class="rci-issues">
      <div class="rci-section-title">THE ROAD CHRONICLE · ISSUES</div>
      <article class="rci-issue" data-rci-issue="issue-001" role="button" tabindex="0" aria-label="Apri Issue 1">
        <div class="rci-number"><small>ISSUE</small><strong>1</strong></div>
        <div class="rci-copy">
          <span>SPECIAL EDITION</span>
          <h2>LA PRIMA È GIALLONERA</h2>
          <p>01.09.2026 · 4 PAGINE</p>
        </div>
      </article>
    </section>
  </section>`;
}
function renderIssue(){
  if(!state.container)return;
  state.view="issue-001";
  state.container.innerHTML=`<section class="rci-page rci-reader" aria-label="The Road Chronicle Issue 1">
    <button type="button" class="rci-back" data-rci-issues-back>← ISSUES</button>
    <div class="rci-reader-stack">
      ${ISSUE_PAGES.map((file,index)=>`<img class="rci-reader-page" src="${ISSUE_PATH}${file}" alt="The Road Chronicle Issue 1 · Pagina ${index+1} di 4" loading="${index===0?"eager":"lazy"}">`).join("")}
    </div>
  </section>`;
  state.container.scrollIntoView({block:"start"});
}
function mount(o){
  if(!o||!o.container)throw new Error("Road Chronicle Issues: container mancante");
  state={container:o.container,worldId:String(o.worldId||"GW001"),view:"issues"};
  renderIssues();
}
function unmount(){
  if(state.container)state.container.innerHTML="";
  state={container:null,worldId:"GW001",view:"issues"};
}
document.addEventListener("click",e=>{
  if(!state.container||!state.container.contains(e.target))return;
  if(e.target.closest?.("[data-rci-back]")){
    document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:{target:"game-world-section",worldId:state.worldId,section:"home"}}));
    return;
  }
  if(e.target.closest?.("[data-rci-issues-back]")){
    renderIssues();
    return;
  }
  if(e.target.closest?.('[data-rci-issue="issue-001"]'))renderIssue();
});
document.addEventListener("keydown",e=>{
  if(!state.container||!state.container.contains(e.target))return;
  if((e.key==="Enter"||e.key===" ")&&e.target.closest?.('[data-rci-issue="issue-001"]')){
    e.preventDefault();
    renderIssue();
  }
});
window.IMC_ROAD_CHRONICLE_ISSUES={version:VERSION,mount,unmount};
})();