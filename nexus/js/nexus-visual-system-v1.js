(function(){
  "use strict";

  if(window.__NEXUS_VISUAL_SYSTEM_V1__) return;
  window.__NEXUS_VISUAL_SYSTEM_V1__=true;

  function norm(value){return String(value||"").trim().toLowerCase();}
  function categoryForText(text){
    var value=norm(text);
    if(!value)return "domestic";
    if(/world cup|nations|national team|qualifying|uefa nations|coppa del mondo|nazional/i.test(value))return "nations";
    if(/imc champions|imc shield|imc super cup|champions|international|intercontinental|continental|smfa/i.test(value))return "international";
    return "domestic";
  }

  function installOverrideCss(){
    var existing=document.getElementById("nexusVisualSystemRuntimeCss");
    if(existing)return existing;
    var style=document.createElement("style");
    style.id="nexusVisualSystemRuntimeCss";
    style.textContent=`
:root{--nx-deep:#0A1F44;--nx-blue:#1565FF;--nx-gold:#F0AA17;--nx-teal:#0B8FA8}
body,.nx-shell,.imc-competitions-all-worlds{background:linear-gradient(180deg,#fff 0%,#f8fafc 58%,#eef3f8 100%)!important;color:var(--nx-deep)!important}

body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero{border:1px solid rgba(21,101,255,.28)!important;background:linear-gradient(145deg,rgba(255,255,255,.88),rgba(238,245,255,.68))!important;box-shadow:0 18px 44px rgba(10,31,68,.09),inset 0 1px 0 rgba(255,255,255,.98)!important;backdrop-filter:blur(20px) saturate(140%)!important;-webkit-backdrop-filter:blur(20px) saturate(140%)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero:before{background:radial-gradient(circle at 82% 18%,rgba(21,101,255,.14),transparent 38%)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero-copy strong,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero-copy h1{color:var(--nx-deep)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero-copy span,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-hero-copy small,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-trophy{color:var(--nx-blue)!important;border-color:rgba(21,101,255,.30)!important}

body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-filter{border:1px solid rgba(10,31,68,.12)!important;background:rgba(255,255,255,.76)!important;color:var(--nx-deep)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.96),0 6px 18px rgba(10,31,68,.04)!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-filter.is-active{border-color:var(--nx-blue)!important;background:linear-gradient(135deg,#0A1F44,#1565FF)!important;color:#fff!important;box-shadow:0 8px 22px rgba(21,101,255,.22)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head{border-bottom-color:rgba(10,31,68,.10)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head strong{color:var(--nx-deep)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head span{color:#6d7890!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-section-head b{background:var(--nx-deep)!important;color:#fff!important}

body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card{--tone:var(--nx-blue);display:grid!important;border:1px solid color-mix(in srgb,var(--tone) 28%,#dfe7f1)!important;background:linear-gradient(145deg,rgba(255,255,255,.88),rgba(241,246,252,.70))!important;color:var(--nx-deep)!important;box-shadow:0 16px 38px rgba(10,31,68,.08),0 0 0 1px color-mix(in srgb,var(--tone) 7%,transparent),inset 0 1px 0 rgba(255,255,255,.98)!important;backdrop-filter:blur(20px) saturate(140%)!important;-webkit-backdrop-filter:blur(20px) saturate(140%)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card.nx-tone-international{--tone:var(--nx-gold)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card.nx-tone-nations{--tone:var(--nx-teal)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card.nx-tone-domestic{--tone:var(--nx-blue)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-comp-card.imc-premium-card:before{background:radial-gradient(circle at 100% 0%,color-mix(in srgb,var(--tone) 14%,transparent),transparent 40%),linear-gradient(120deg,transparent,rgba(255,255,255,.56),transparent)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-visual{border-right:1px solid color-mix(in srgb,var(--tone) 18%,#dfe7f1)!important;background:linear-gradient(145deg,rgba(255,255,255,.74),color-mix(in srgb,var(--tone) 10%,#f2f6fb))!important;color:var(--tone)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-visual.league,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-visual.international,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-visual.nations,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-visual.friendly{background:linear-gradient(145deg,rgba(255,255,255,.74),color-mix(in srgb,var(--tone) 10%,#f2f6fb))!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-visual:before{background:linear-gradient(145deg,color-mix(in srgb,var(--tone) 13%,transparent),transparent 58%)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-badge{border-color:color-mix(in srgb,var(--tone) 38%,#cfd9e7)!important;background:rgba(255,255,255,.66)!important;color:var(--tone)!important;box-shadow:0 8px 18px rgba(10,31,68,.07),0 0 18px color-mix(in srgb,var(--tone) 10%,transparent),inset 0 1px 0 rgba(255,255,255,.98)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-titleline strong,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-fact-value,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-team,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-champion strong{color:var(--nx-deep)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-chevron,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-meta b,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-fact-label,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-round strong,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-vs{color:var(--tone)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-meta,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-date,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-champion small{color:#738096!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-fact{border-color:color-mix(in srgb,var(--tone) 14%,#e1e7ef)!important;background:rgba(255,255,255,.68)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.96)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-status-dot{background:var(--tone)!important;box-shadow:0 0 10px color-mix(in srgb,var(--tone) 42%,transparent)!important}
body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-status-dot.pending,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-status-dot.done,body .imc-competitions-all-worlds:not(.imc-comp-detail) .imc-premium-status-dot.empty{background:var(--tone)!important;opacity:.58!important;box-shadow:none!important}
`;
    document.head.appendChild(style);
    return style;
  }

  function keepOverrideLast(){
    var style=installOverrideCss();
    if(style&&style.parentNode===document.head&&document.head.lastElementChild!==style){document.head.appendChild(style);}
  }

  function decorate(){
    document.querySelectorAll(".nx-competition-card,.nx-competition-detail-card,.nx-league-cover,.nx-competition-cover,.nx-cup-round-card,.nx-premium-standings,.nx-league-matchday-card,.comp-card,.imc-comp-card.imc-premium-card").forEach(function(node){
      var visual=node.querySelector&&node.querySelector(".imc-premium-visual");
      var category="";
      if(visual&&visual.classList.contains("international"))category="international";
      else if(visual&&visual.classList.contains("nations"))category="nations";
      else category=categoryForText(node.textContent||"");
      node.classList.remove("nx-tone-domestic","nx-tone-international","nx-tone-nations");
      node.classList.add("nx-tone-"+category);
      node.dataset.nxCompetitionTone=category;
      if(visual){visual.style.setProperty("--tone",category==="international"?"var(--nx-gold)":category==="nations"?"var(--nx-teal)":"var(--nx-blue)");}
    });
    keepOverrideLast();
  }

  installOverrideCss();
  var timer=null;
  function scheduleDecorate(){clearTimeout(timer);timer=setTimeout(decorate,60);}
  new MutationObserver(scheduleDecorate).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",decorate);else decorate();
})();