(function(){
  "use strict";

  // Build 57 · Stable native navigation: autonomous pages mount synchronously inside pageRoot.
  const VERSION="1.1.0";
  const TOP_IDS=["imcPlayerCodexGw","imcTransfers","imcCompetitions"];
  const DETAIL_OWNER={
    imcTransferDetail:"imcTransfers",
    imcCompetitionDetail:"imcCompetitions",
    imcPlayerCodexGlobalDetail:"imcPlayerCodexGw"
  };

  let savedHost=null;
  let savedContent=null;
  let activeTop="";
  let observer=null;
  let scanning=false;

  function pageRoot(){ return document.getElementById("pageRoot"); }

  function installCss(){
    if(document.getElementById("imcNativeNavigationCss"))return;
    const style=document.createElement("style");
    style.id="imcNativeNavigationCss";
    style.textContent=`
.nx-world-nav{position:sticky!important;top:0!important;z-index:19!important}
#pageRoot>#imcPlayerCodexGw,
#pageRoot>#imcTransfers,
#pageRoot>#imcCompetitions,
#pageRoot>#imcTransferDetail,
#pageRoot>#imcCompetitionDetail,
#pageRoot>#imcPlayerCodexGlobalDetail{
  position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;
  max-width:none!important;min-height:0!important;max-height:none!important;overflow:visible!important;
}
#pageRoot>[data-imc-native-page="1"],#pageRoot>[data-imc-native-detail="1"]{margin:0!important}
`;
    document.head.appendChild(style);
  }

  function resetSavedIfHostChanged(){
    const root=pageRoot();
    if(savedHost&&root!==savedHost){savedHost=null;savedContent=null;activeTop="";}
  }

  function snapshot(root){
    resetSavedIfHostChanged();
    if(savedContent&&savedHost===root)return;
    const frag=document.createDocumentFragment();
    while(root.firstChild)frag.appendChild(root.firstChild);
    savedHost=root;savedContent=frag;
  }

  function syncActive(id){
    const topButtons=document.querySelectorAll(".nx-world-nav [data-world-section]");
    if(id==="imcPlayerCodexGw"||id==="imcCompetitions"){
      const section=id==="imcPlayerCodexGw"?"player-codex":"competitions";
      topButtons.forEach(button=>button.classList.toggle("active",button.getAttribute("data-world-section")===section));
    }
    if(id==="imcTransfers"){
      document.querySelectorAll(".nx-bottom [data-page]").forEach(button=>button.classList.toggle("active",button.getAttribute("data-page")==="transfers"));
    }
  }

  function mountTop(el){
    const root=pageRoot();
    if(!root||!el)return;
    installCss();resetSavedIfHostChanged();
    if(el.parentElement===root){document.body.style.overflow="";syncActive(el.id);return;}
    if(!savedContent||savedHost!==root)snapshot(root);
    TOP_IDS.forEach(function(id){const current=document.getElementById(id);if(current&&current!==el&&current.parentElement===root)current.remove();});
    root.replaceChildren(el);
    el.setAttribute("data-imc-native-page","1");
    activeTop=el.id;
    document.body.style.overflow="";
    syncActive(el.id);
    window.scrollTo(0,0);
  }

  function ownerForDetail(id){return DETAIL_OWNER[id]||"";}

  function mountDetail(el){
    const root=pageRoot();if(!root||!el)return;
    const ownerId=ownerForDetail(el.id),owner=ownerId?document.getElementById(ownerId):null;
    if(!owner||owner.parentElement!==root)return;
    owner.hidden=true;
    if(el.parentElement!==root)root.appendChild(el);
    el.setAttribute("data-imc-native-detail","1");
    document.body.style.overflow="";window.scrollTo(0,0);
  }

  function closeDetail(detail){
    if(!detail)return;
    const ownerId=ownerForDetail(detail.id),owner=ownerId?document.getElementById(ownerId):null;
    detail.remove();if(owner)owner.hidden=false;
    document.body.style.overflow="";window.scrollTo(0,0);
  }

  function restore(){
    const root=pageRoot();if(!root)return;
    Object.keys(DETAIL_OWNER).forEach(function(id){const detail=document.getElementById(id);if(detail&&detail.parentElement===root)detail.remove();});
    TOP_IDS.forEach(function(id){const top=document.getElementById(id);if(top&&top.parentElement===root)top.remove();});
    root.replaceChildren();
    if(savedContent&&savedHost===root)root.appendChild(savedContent);
    savedHost=null;savedContent=null;activeTop="";
    document.body.style.overflow="";window.scrollTo(0,0);
  }

  function scan(){
    if(scanning)return;
    scanning=true;
    try{
      resetSavedIfHostChanged();
      for(const id of TOP_IDS){const el=document.getElementById(id);if(el&&el.parentElement===document.body){mountTop(el);break;}}
      Object.keys(DETAIL_OWNER).forEach(function(id){const el=document.getElementById(id);if(el&&el.parentElement===document.body)mountDetail(el);});
      const root=pageRoot();
      if(root&&activeTop&&!document.getElementById(activeTop)&&savedContent&&savedHost===root&&root.childElementCount===0)restore();
    }finally{scanning=false;}
  }

  document.addEventListener("click",function(event){
    const target=event.target&&event.target.closest?event.target.closest("button"):null;if(!target)return;
    const root=pageRoot();if(!root||!root.contains(target))return;
    const detail=target.closest("#imcTransferDetail,#imcCompetitionDetail,#imcPlayerCodexGlobalDetail");
    if(detail){
      const isBack=target.id==="imctdback"||target.id==="pcgdBack"||target.hasAttribute("data-back");
      if(isBack){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();closeDetail(detail);}return;
    }
    const top=target.closest("#imcPlayerCodexGw,#imcTransfers,#imcCompetitions");if(!top)return;
    const isBack=target.id==="pcgBack"||target.id==="imctback"||target.hasAttribute("data-close");
    if(isBack){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();restore();}
  },true);

  function attach(){
    installCss();if(observer||!document.body)return;
    observer=new MutationObserver(scan);
    observer.observe(document.body,{childList:true});
    scan();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});else attach();
  window.IMC_NATIVE_NAVIGATION={version:VERSION,refresh:scan,restore:restore};
})();
