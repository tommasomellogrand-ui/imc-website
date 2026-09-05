(function(){
  "use strict";

  function injectStyles(){
    if(document.getElementById("nxMatchReportBetaUiStyles"))return;
    var style=document.createElement("style");
    style.id="nxMatchReportBetaUiStyles";
    style.textContent=`
      .nx-mr-overlay{
        background:#f6f7fa!important;
        color:#111a2d!important;
      }
      .nx-mr-shell{
        background:#f6f7fa;
      }
      .nx-mr-top{
        grid-template-columns:42px minmax(0,1fr) 42px!important;
        padding:calc(9px + env(safe-area-inset-top)) 14px 9px!important;
        background:rgba(255,255,255,.97)!important;
        border-bottom:1px solid #e8ebf0!important;
        box-shadow:0 1px 0 rgba(13,30,62,.02);
      }
      .nx-mr-back{
        width:38px!important;
        height:38px!important;
        background:#fff!important;
        border:1px solid #e2e6ec!important;
        color:#0c2450!important;
        box-shadow:0 2px 8px rgba(20,38,70,.05);
      }
      .nx-mr-top-copy small{
        color:#163664!important;
        font-size:9px!important;
        letter-spacing:.16em!important;
      }
      .nx-mr-top-copy strong{
        color:#111a2d!important;
        font-size:14px!important;
        font-weight:900!important;
      }
      .nx-mr-body{
        width:min(760px,100%)!important;
        padding:12px 12px 28px!important;
      }

      .nx-mr-hero{
        position:relative;
        padding:18px 15px 17px!important;
        border:1px solid #e0e4ea!important;
        border-radius:22px!important;
        background:#fff!important;
        color:#111a2d!important;
        box-shadow:0 7px 22px rgba(20,38,70,.045)!important;
      }
      .nx-mr-meta{
        color:#707b8e!important;
        font-size:9px!important;
        font-weight:850!important;
        letter-spacing:.055em!important;
        text-transform:uppercase;
      }
      .nx-mr-score-grid{
        gap:10px!important;
        margin-top:16px!important;
      }
      .nx-mr-team strong{
        color:#111a2d!important;
        font-size:15px!important;
        font-weight:950!important;
      }
      .nx-mr-team small{
        color:#7a8495!important;
        margin-top:5px!important;
        font-size:8px!important;
        font-weight:800!important;
      }
      .nx-mr-score{
        position:relative;
        padding-bottom:20px;
        color:#071c43!important;
        font-size:43px!important;
        font-weight:950!important;
        letter-spacing:-.06em!important;
      }
      .nx-mr-score:after{
        content:"FINALE";
        position:absolute;
        left:50%;
        bottom:1px;
        transform:translateX(-50%);
        color:#747e8f;
        font-size:8px;
        font-weight:900;
        letter-spacing:.12em;
      }
      .nx-mr-pen{
        color:#a37a13!important;
        margin-top:7px!important;
      }
      .nx-mr-scorers{
        margin-top:13px!important;
        padding-top:12px!important;
        border-top:1px solid #edf0f4!important;
      }
      .nx-mr-scorers div{
        color:#566176!important;
        font-size:9px!important;
        font-weight:700;
      }

      .nx-mr-tabs{
        top:56px!important;
        gap:0!important;
        margin:10px -12px 0!important;
        padding:0 12px!important;
        background:rgba(255,255,255,.97)!important;
        border-top:1px solid #eceff3;
        border-bottom:1px solid #e5e9ef;
      }
      .nx-mr-tab{
        flex:1 0 auto!important;
        min-width:84px;
        padding:13px 10px 11px!important;
        border:0!important;
        border-bottom:2px solid transparent!important;
        border-radius:0!important;
        background:transparent!important;
        color:#747f91!important;
        font-size:9px!important;
        font-weight:900!important;
        letter-spacing:.02em!important;
      }
      .nx-mr-tab.is-active{
        border-bottom-color:#215ec5!important;
        background:transparent!important;
        color:#174da5!important;
      }
      .nx-mr-tab[data-mr-tab="info"]{
        display:none!important;
      }

      .nx-mr-panel.is-active{
        display:block!important;
      }
      .nx-mr-panel[data-mr-panel="overview"].is-active{
        display:grid!important;
        grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);
        gap:10px;
        align-items:start;
      }
      .nx-mr-panel[data-mr-panel="overview"]>.nx-mr-section{
        margin-top:10px!important;
      }
      .nx-mr-panel[data-mr-panel="overview"]>.nx-mr-section:nth-of-type(3),
      .nx-mr-panel[data-mr-panel="overview"]>.nx-mr-section.nx-mr-info-moved{
        grid-column:1/-1;
      }

      .nx-mr-section{
        margin-top:10px!important;
        padding:14px!important;
        border:1px solid #e1e5eb!important;
        border-radius:17px!important;
        background:#fff!important;
        box-shadow:0 5px 18px rgba(18,36,69,.035)!important;
      }
      .nx-mr-section-head small{
        color:#6c56d9!important;
        font-size:7px!important;
        letter-spacing:.13em!important;
      }
      .nx-mr-section-head h2{
        margin-top:4px!important;
        color:#111a2d!important;
        font-size:16px!important;
      }
      .nx-mr-section-head p{
        color:#7b8494!important;
        font-size:9px!important;
      }
      .nx-mr-story{
        margin-top:10px!important;
        color:#4e596c!important;
        font-size:10px!important;
        line-height:1.5!important;
      }

      .nx-mr-mvp{
        display:block!important;
        margin-top:11px!important;
        padding:12px!important;
        border:1px solid #ead8a6!important;
        border-radius:14px!important;
        background:#fffbf0!important;
      }
      .nx-mr-mvp small{
        color:#9c7416!important;
        font-size:7px!important;
      }
      .nx-mr-mvp strong{
        margin-top:5px!important;
        color:#111a2d!important;
        font-size:13px!important;
        line-height:1.15;
      }
      .nx-mr-mvp b{
        display:block;
        margin-top:7px;
        color:#0a2551!important;
        font-size:25px!important;
        line-height:1;
      }

      .nx-mr-stats{
        gap:8px!important;
        margin-top:12px!important;
      }
      .nx-mr-stat-row{
        grid-template-columns:31px minmax(0,1fr) 31px!important;
        gap:6px!important;
      }
      .nx-mr-stat-row b{
        color:#13213a;
        font-size:11px!important;
      }
      .nx-mr-stat-center span{
        color:#6f798b!important;
        font-size:7px!important;
        letter-spacing:.03em!important;
      }
      .nx-mr-bar{
        height:4px!important;
        margin-top:4px!important;
        background:#e4e8ee!important;
      }
      .nx-mr-bar i:first-child{background:#205fcb!important}
      .nx-mr-bar i:last-child{background:#b9c1cc!important}

      .nx-mr-timeline{
        gap:0!important;
        margin-top:10px!important;
      }
      .nx-mr-event{
        position:relative;
        grid-template-columns:38px 1fr!important;
        gap:9px!important;
        padding:10px 0!important;
        border-bottom:1px solid #edf0f4!important;
      }
      .nx-mr-minute{
        color:#154ea8!important;
        font-size:10px!important;
      }
      .nx-mr-event-copy strong{
        color:#172237;
        font-size:11px!important;
      }
      .nx-mr-event-copy span{
        color:#7b8494!important;
        font-size:8px!important;
      }

      .nx-mr-lineup-title strong,
      .nx-mr-tactic-title strong{
        color:#111a2d!important;
        font-size:14px!important;
      }
      .nx-mr-lineup-title span{
        color:#1b57b4!important;
      }
      .nx-mr-subhead{
        color:#778194!important;
        font-size:7px!important;
      }
      .nx-mr-player-list{
        gap:6px!important;
      }
      .nx-mr-player{
        padding:9px 9px!important;
        border:1px solid #edf0f4;
        background:#fafbfc!important;
      }
      .nx-mr-player-copy strong{
        color:#172237;
        font-size:10px!important;
      }
      .nx-mr-player-copy span{
        color:#7d8798!important;
        font-size:7px!important;
      }
      .nx-mr-rating{
        background:#154b9f!important;
        font-size:10px!important;
      }

      .nx-mr-formation{
        color:#174fa8!important;
        font-size:17px!important;
      }
      .nx-mr-tactic-grid{
        gap:7px!important;
      }
      .nx-mr-tactic-grid div{
        padding:9px!important;
        border:1px solid #edf0f4;
        background:#fafbfc!important;
      }
      .nx-mr-tactic-grid small{
        color:#838c9b!important;
        font-size:6px!important;
      }
      .nx-mr-tactic-grid strong{
        color:#18243a;
        font-size:9px!important;
      }

      .nx-mr-commentary{
        gap:0!important;
        margin-top:9px!important;
      }
      .nx-mr-comment{
        position:relative;
        grid-template-columns:38px 1fr!important;
        gap:8px!important;
        padding:11px 0 11px 10px!important;
        border-bottom:1px solid #edf0f4!important;
      }
      .nx-mr-comment:before{
        content:"";
        position:absolute;
        left:0;
        top:11px;
        bottom:11px;
        width:2px;
        border-radius:99px;
        background:#2765cf;
      }
      .nx-mr-comment b{
        color:#174fa8!important;
        font-size:9px!important;
      }
      .nx-mr-comment p{
        color:#344054!important;
        font-size:10px!important;
        line-height:1.5!important;
      }

      .nx-mr-info{
        gap:7px!important;
      }
      .nx-mr-info div{
        padding:10px!important;
        border:1px solid #edf0f4;
        background:#fafbfc!important;
      }
      .nx-mr-info small{
        color:#858e9d!important;
        font-size:6px!important;
      }
      .nx-mr-info strong{
        color:#172237;
        font-size:9px!important;
      }

      @media(max-width:430px){
        .nx-mr-body{padding:10px 10px 24px!important}
        .nx-mr-hero{padding:16px 12px 15px!important;border-radius:19px!important}
        .nx-mr-score{font-size:38px!important}
        .nx-mr-team strong{font-size:13px!important}
        .nx-mr-team small{font-size:7px!important}
        .nx-mr-tabs{margin-left:-10px!important;margin-right:-10px!important;padding-left:6px!important;padding-right:6px!important}
        .nx-mr-tab{min-width:77px;padding-left:7px!important;padding-right:7px!important;font-size:8px!important}
        .nx-mr-panel[data-mr-panel="overview"].is-active{grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr)!important;gap:8px!important}
        .nx-mr-section{padding:12px!important;border-radius:15px!important}
        .nx-mr-section-head h2{font-size:14px!important}
        .nx-mr-story{font-size:9px!important}
        .nx-mr-mvp strong{font-size:11px!important}
        .nx-mr-mvp b{font-size:22px!important}
        .nx-mr-stat-row{grid-template-columns:27px minmax(0,1fr) 27px!important;gap:4px!important}
        .nx-mr-stat-row b{font-size:9px!important}
        .nx-mr-info{grid-template-columns:1fr 1fr!important}
      }
    `;
    document.head.appendChild(style);
  }

  function polishModal(root){
    if(!root||root.dataset.nxMrUiPolished==="1")return;
    var report=root.querySelector("[data-mr-panel='overview']");
    if(!report)return;
    root.dataset.nxMrUiPolished="1";

    var labels={
      overview:"Panoramica",
      lineups:"Formazioni",
      tactics:"Tattiche",
      commentary:"Cronaca"
    };
    root.querySelectorAll("[data-mr-tab]").forEach(function(button){
      var key=button.getAttribute("data-mr-tab");
      if(labels[key])button.textContent=labels[key];
    });

    var sections=report.querySelectorAll(":scope > .nx-mr-section");
    if(sections[0])sections[0].classList.add("nx-mr-overview-story");
    if(sections[1])sections[1].classList.add("nx-mr-overview-stats");
    if(sections[2])sections[2].classList.add("nx-mr-overview-events");

    var infoPanel=root.querySelector("[data-mr-panel='info']");
    if(infoPanel){
      var infoSection=infoPanel.querySelector(".nx-mr-section");
      if(infoSection){
        infoSection.classList.add("nx-mr-info-moved");
        report.appendChild(infoSection);
      }
      infoPanel.style.display="none";
    }
  }

  function scan(){
    document.querySelectorAll(".nx-mr-overlay").forEach(polishModal);
  }

  function init(){
    injectStyles();
    scan();
    var observer=new MutationObserver(function(){scan();});
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
