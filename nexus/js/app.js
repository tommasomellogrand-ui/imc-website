(function(){
  "use strict";

  // Build 60 production runtime.
  const NEXUS_BUILD = "60";
  window.__NEXUS_RUNTIME_BUILD__ = NEXUS_BUILD;

  function syncVisibleBuildLabel(){
    document.querySelectorAll(".nx-sport-title small,.nx-admin-head small").forEach(function(el){
      if(/BUILD\s+(?:56|57|58|59)\b/.test(el.textContent||"")) el.textContent=(el.textContent||"").replace(/BUILD\s+(?:56|57|58|59)\b/g,"BUILD "+NEXUS_BUILD);
    });
  }

  var buildLabelTimer=null;
  new MutationObserver(function(){
    clearTimeout(buildLabelTimer);
    buildLabelTimer=setTimeout(syncVisibleBuildLabel,30);
  }).observe(document.documentElement,{childList:true,subtree:true});
  removeClubHouseManagerHero();

  function writeScript(src){
    document.write('<script src="'+src+'"></'+'script>');
  }

  function appendScript(src,onload,onerror){
    var script=document.createElement("script");
    script.src=src;
    if(onload) script.onload=onload;
    if(onerror) script.onerror=onerror;
    document.head.appendChild(script);
  }

  function isClubHouse(){
    var el=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong");
    var text=String(el&&el.textContent||"").trim().toLowerCase();
    if(text) return text==="club house";
    return !!document.querySelector(".nx-card.nx-clubhouse");
  }

  function removeClubHouseManagerHero(){
    if(!document.getElementById("openImcGlobalCodex")) return;
    var clubhouse=document.querySelector(".nx-card.nx-clubhouse");
    if(!clubhouse) return;
    var hero=clubhouse.querySelector(".nx-hero-card");
    if(hero) hero.remove();
  }

  var clubHouseTimer=null;
  new MutationObserver(function(){
    clearTimeout(clubHouseTimer);
    clubHouseTimer=setTimeout(removeClubHouseManagerHero,80);
  }).observe(document.documentElement,{childList:true,subtree:true});
  removeClubHouseManagerHero();

  document.addEventListener("click",function(event){
    var target=event.target&&event.target.closest?event.target.closest('#openImcGlobalCodex,[data-world-section="player-codex"]'):null;
    if(!target) return;
    if(target.id!=="openImcGlobalCodex"&&!isClubHouse()) return;
    var codex=window.IMC_PLAYER_CODEX_GLOBAL;
    if(!codex||typeof codex.open!=="function") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    codex.open();
  },true);

  function loadFeatureModules(){
    appendScript("js/imc-match-report-all-worlds.js?v=1.0.0");
    appendScript("js/imc-competitions-all-worlds.js?v=1.1.0");
    appendScript("js/imc-competition-iphone-typography-all-worlds.js?v=1.0.0");
    appendScript("js/imc-competition-premium-list-all-worlds.js?v=1.0.0");
    appendScript("js/imc-competition-card-insights-all-worlds.js?v=1.0.0");
    appendScript("js/imc-gw001-competition-manager-labels.js?v=1.1.0");
    appendScript("js/imc-managers-gw008.js?v=1.5.0");
    appendScript("js/imc-team-hub-gw008.js?v=2.2.0");
    appendScript("js/imc-gw008-architecture-all-worlds.js?v=1.0.0");
  }

  function loadAfterCore(){
    syncVisibleBuildLabel();
    appendScript("js/imc-results-scorers.js?v=1.0.0");
    appendScript("js/imc-player-codex-global.js?v=1.0.0");
    appendScript("js/imc-player-codex-global-detail.js?v=1.1.0");
    appendScript("js/imc-community-feed-fix.js?v=1.0.0");
    appendScript("js/imc-gw001-page-standard.js?v=1.0.0");
    appendScript("js/imc-gw001-page-standard-size-fix.js?v=1.0.3");
    appendScript("js/imc-gw001-transfer-inline.js?v=1.0.0");
    appendScript("js/imc-nexus-client-bridge.js?v=1.0.0",function(){
      appendScript("js/imc-trophy-room-all-worlds.js?v=2.1.0",loadFeatureModules);
    });
  }

  function loadCoreAsync(){
    appendScript("js/app-core-59.js?v=59.1-core",loadAfterCore);
  }

  if(document.readyState==="loading"){
    writeScript("js/app-core-59.js?v=59.1-core");
    writeScript("js/imc-results-scorers.js?v=1.0.0");
    writeScript("js/imc-player-codex-global.js?v=1.0.0");
    writeScript("js/imc-player-codex-global-detail.js?v=1.1.0");
    writeScript("js/imc-community-feed-fix.js?v=1.0.0");
    writeScript("js/imc-gw001-page-standard.js?v=1.0.0");
    writeScript("js/imc-gw001-page-standard-size-fix.js?v=1.0.3");
    writeScript("js/imc-gw001-transfer-inline.js?v=1.0.0");
    writeScript("js/imc-nexus-client-bridge.js?v=1.0.0");
    writeScript("js/imc-trophy-room-all-worlds.js?v=2.1.0");
    writeScript("js/imc-match-report-all-worlds.js?v=1.0.0");
    writeScript("js/imc-competitions-all-worlds.js?v=1.1.0");
    writeScript("js/imc-competition-iphone-typography-all-worlds.js?v=1.0.0");
    writeScript("js/imc-competition-premium-list-all-worlds.js?v=1.0.0");
    writeScript("js/imc-competition-card-insights-all-worlds.js?v=1.0.0");
    writeScript("js/imc-gw001-competition-manager-labels.js?v=1.1.0");
    writeScript("js/imc-managers-gw008.js?v=1.5.0");
    writeScript("js/imc-team-hub-gw008.js?v=2.2.0");
    writeScript("js/imc-gw008-architecture-all-worlds.js?v=1.0.0");
    setTimeout(syncVisibleBuildLabel,0);
    return;
  }

  loadCoreAsync();
})();