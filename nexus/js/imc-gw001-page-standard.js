(function(){
"use strict";
if(window.__IMC_GW001_PAGE_STANDARD__)return;
window.__IMC_GW001_PAGE_STANDARD__=true;

const VERSION="1.0.0-gw001-page-standard";
const WORLD="GW001";
const STYLE_ID="imcGw001PageStandardCss";
const HERO_CLASS="imc-gw001-page-hero";
const BODY_CLASS="imc-gw001-standard-body";
let forcedPage="";
let observer=null;
let timer=null;

const TOP_PAGES=new Set(["player-codex","clubs","national","managers","competitions"]);
const BOTTOM_PAGES=new Set(["schedule","stats","transfers","h2h","trophy-room"]);

function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
function norm(value){return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function pageRoot(){return document.getElementById("pageRoot");}
function currentWorld(){
  const nodes=document.querySelectorAll("#openDrawerWorld strong,.nx-sport-world strong,.nx-page-title p,.nx-world-header p");
  for(const node of nodes){
    const text=clean(node.textContent),match=text.match(/GW\d{3}/i);
    if(match)return match[0].toUpperCase();
    if(norm(text)==="road to history")return WORLD;
  }
  return "";
}
function pageMeta(key){
  const map={
    "player-codex":{title:"PLAYER CODEX",kind:"codex"},
    clubs:{title:"CLUBS",kind:"clubs"},
    national:{title:"NATIONAL TEAMS",kind:"national"},
    managers:{title:"MANAGERS",kind:"managers"},
    schedule:{title:"SCHEDULE",kind:"schedule"},
    stats:{title:"STATS",kind:"stats"},
    transfers:{title:"TRANSFERS",kind:"transfers"},
    h2h:{title:"H2H",kind:"h2h"},
    "trophy-room":{title:"TROPHY ROOM",kind:"trophies"}
  };
  return map[key]||null;
}
function iconSvg(kind){
  const a='viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if(kind==="codex")return '<svg '+a+'><circle cx="36" cy="24" r="10"/><path d="M18 57c3-13 10-20 18-20s15 7 18 20"/><path d="M10 13h12M10 19h8M50 13h12M54 19h8"/></svg>';
  if(kind==="clubs")return '<svg '+a+'><path d="M36 8 56 15v16c0 14-8 24-20 33C24 55 16 45 16 31V15l20-7Z"/><path d="M27 29h18M31 22h10M28 38h16"/></svg>';
  if(kind==="national")return '<svg '+a+'><circle cx="36" cy="36" r="25"/><path d="M11 36h50M36 11c7 7 11 15 11 25S43 54 36 61M36 11c-7 7-11 15-11 25s4 18 11 25"/><path d="M49 17v18l12-5-12-5"/></svg>';
  if(kind==="managers")return '<svg '+a+'><circle cx="26" cy="22" r="8"/><path d="M11 50c2-12 7-18 15-18s13 6 15 18"/><path d="M45 18h17v30H45zM49 24h9M49 31h9M49 38h6"/></svg>';
  if(kind==="schedule")return '<svg '+a+'><rect x="12" y="16" width="48" height="44" rx="6"/><path d="M12 29h48M24 10v12M48 10v12M23 39h7M35 39h7M47 39h7M23 50h7M35 50h7"/></svg>';
  if(kind==="stats")return '<svg '+a+'><path d="M14 59h44M20 54V37h10v17M33 54V25h10v29M46 54V14h10v40"/><path d="m17 27 12-9 10 5 17-13"/></svg>';
  if(kind==="transfers")return '<svg '+a+'><circle cx="22" cy="36" r="9"/><circle cx="50" cy="36" r="9"/><path d="M30 25h22l-6-6M42 47H20l6 6"/></svg>';
  if(kind==="h2h")return '<svg '+a+'><path d="M10 18 25 12l11 6v18c0 11-5 19-11 24-6-5-11-13-11-24V18Z"/><path d="M62 18 47 12l-11 6v18c0 11 5 19 11 24 6-5 11-13 11-24V18Z"/><path d="m30 28 12 16M42 28 30 44"/></svg>';
  return '<svg '+a+'><path d="M24 12h24v12c0 11-5 18-12 18s-12-7-12-18V12Z"/><path d="M24 18H14c0 8 3 13 11 15M48 18h10c0 8-3 13-11 15M36 42v10M25 60h22M29 52h14"/></svg>';
}
function heroMarkup(key){
  const meta=pageMeta(key);if(!meta)return"";
  return '<section class="'+HERO_CLASS+'" data-imc-gw001-hero="'+key+'">'+
    '<div class="imc-gw001-hero-art"><span class="imc-gw001-hero-orb">'+iconSvg(meta.kind)+'</span><i></i><i></i><i></i></div>'+
    '<div class="imc-gw001-hero-rule"></div>'+
    '<div class="imc-gw001-hero-copy"><span>GW001</span><strong>'+meta.title+'</strong><small>Road To History</small></div>'+
    '<div class="imc-gw001-hero-lights" aria-hidden="true"><b></b><b></b><b></b></div>'+
  '</section>';
}
function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");style.id=STYLE_ID;
  style.textContent=`
#pageRoot.imc-gw001-page-standard{padding-top:0!important}
#pageRoot.imc-gw001-page-standard>.${BODY_CLASS}{background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0!important;overflow:visible!important;margin:0!important;padding-left:0!important;padding-right:0!important}
#pageRoot.imc-gw001-page-standard>.${BODY_CLASS}>.nx-page-title:first-child,
#pageRoot.imc-gw001-page-standard>.${BODY_CLASS}>.nx-page-title:first-of-type{display:none!important}
.${HERO_CLASS}{position:relative;display:grid;grid-template-columns:minmax(112px,38%) 1px minmax(0,1fr);align-items:center;min-height:118px;margin:2px 0 17px;overflow:hidden;border:1px solid rgba(198,153,48,.72);border-radius:18px;background:linear-gradient(104deg,#041833 0%,#06244c 46%,#0a315f 100%);box-shadow:0 9px 24px rgba(6,24,51,.14);color:#fff}
.imc-gw001-hero-art{position:relative;display:flex;align-items:center;justify-content:center;align-self:stretch;overflow:hidden;background:radial-gradient(circle at 46% 45%,rgba(29,89,149,.42),transparent 46%)}
.imc-gw001-hero-art:before{content:"";position:absolute;left:-15%;right:-15%;bottom:16px;height:24px;border-top:1px solid rgba(255,255,255,.13);border-radius:50%}
.imc-gw001-hero-art:after{content:"";position:absolute;left:-12%;right:-12%;bottom:-7px;height:46px;background:repeating-linear-gradient(90deg,rgba(215,173,68,.10) 0 1px,transparent 1px 18px);transform:perspective(100px) rotateX(64deg);transform-origin:bottom}
.imc-gw001-hero-orb{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;width:70px;height:70px;border:1px solid rgba(222,180,76,.55);border-radius:50%;background:radial-gradient(circle at 35% 30%,#173d6b,#071c3d 69%);color:#e1b650;box-shadow:0 8px 22px rgba(0,0,0,.22),inset 0 0 0 5px rgba(255,255,255,.025)}
.imc-gw001-hero-orb svg{width:45px;height:45px}
.imc-gw001-hero-art i{position:absolute;top:18px;width:22px;height:43px;border-radius:3px 3px 10px 10px;background:linear-gradient(180deg,#f7f2df,#b58b2f);box-shadow:0 4px 10px rgba(0,0,0,.22);opacity:.28}
.imc-gw001-hero-art i:nth-child(2){left:13px;transform:rotate(-5deg)}.imc-gw001-hero-art i:nth-child(3){right:12px;transform:rotate(5deg)}.imc-gw001-hero-art i:nth-child(4){display:none}
.imc-gw001-hero-rule{width:1px;height:74%;background:linear-gradient(180deg,transparent,#d7ad48 20%,#d7ad48 80%,transparent);opacity:.8}
.imc-gw001-hero-copy{position:relative;z-index:2;min-width:0;padding:16px 52px 16px 17px}
.imc-gw001-hero-copy span{display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:0 8px;border:1px solid #d7ad48;border-radius:6px;color:#e8c46e;font-size:8px;font-weight:950;letter-spacing:.08em}
.imc-gw001-hero-copy strong{display:block;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:20px;line-height:1;font-weight:950;letter-spacing:-.035em}
.imc-gw001-hero-copy small{display:block;margin-top:5px;color:#e2b855;font-size:9px;font-weight:850;letter-spacing:.03em}
.imc-gw001-hero-lights{position:absolute;right:-14px;top:0;bottom:0;width:76px;overflow:hidden;opacity:.34}.imc-gw001-hero-lights:before{content:"";position:absolute;right:-28px;bottom:-8px;width:98px;height:57px;border:1px solid rgba(255,255,255,.28);border-radius:50%}.imc-gw001-hero-lights b{position:absolute;right:7px;top:22px;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 9px #fff}.imc-gw001-hero-lights b:nth-child(2){right:22px;top:31px}.imc-gw001-hero-lights b:nth-child(3){right:37px;top:40px}
#pageRoot.imc-gw001-page-standard>#imcWorldTransfers54.${BODY_CLASS}{position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;min-height:0!important;overflow:visible!important;background:transparent!important}
#pageRoot.imc-gw001-page-standard>#imcWorldTransfers54.${BODY_CLASS} .t54main{max-width:none!important;margin:0!important;padding:0 0 28px!important}
#pageRoot.imc-gw001-page-standard>#imcWorldTransfers54.${BODY_CLASS} .t54market-hero{display:none!important}
#pageRoot.imc-gw001-page-standard>#imcPlayerCodexGw.${BODY_CLASS},
#pageRoot.imc-gw001-page-standard>#imcTransfers.${BODY_CLASS}{position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;max-width:none!important;min-height:0!important;overflow:visible!important;background:transparent!important}
@media(max-width:390px){.${HERO_CLASS}{grid-template-columns:105px 1px minmax(0,1fr);min-height:108px;margin-bottom:14px;border-radius:16px}.imc-gw001-hero-orb{width:61px;height:61px}.imc-gw001-hero-orb svg{width:39px;height:39px}.imc-gw001-hero-copy{padding:13px 34px 13px 13px}.imc-gw001-hero-copy strong{font-size:17px}.imc-gw001-hero-copy small{font-size:8px}.imc-gw001-hero-art i{width:18px;height:37px}}
`;
  document.head.appendChild(style);
}
function normalizePageKey(value){
  value=clean(value).toLowerCase();
  if(value==="trophies")return"trophy-room";
  return value;
}
function activeBottomKey(){
  const transfer=document.querySelector('.nx-bottom [data-imc-transfers-world].active');
  if(transfer)return"transfers";
  const button=document.querySelector('.nx-bottom [data-page].active');
  return button?normalizePageKey(button.getAttribute("data-page")):"";
}
function activeTopKey(){
  const custom=document.querySelector('.nx-world-nav [data-imc-codex-world].active');
  if(custom)return"player-codex";
  const button=document.querySelector('.nx-world-nav [data-world-section].active');
  return button?normalizePageKey(button.getAttribute("data-world-section")):"";
}
function inferPage(){
  const root=pageRoot();if(!root)return"";
  if(root.querySelector('[data-imc-gw001-competitions-clean="1"]'))return"competitions";
  if(root.querySelector('#imcWorldTransfers54,#imcTransfers'))return"transfers";
  if(root.querySelector('#imcPlayerCodexGw'))return"player-codex";
  const bottom=activeBottomKey();if(bottom)return bottom;
  const top=activeTopKey();if(top)return top;
  return forcedPage;
}
function isBottom(key){return BOTTOM_PAGES.has(key);}
function syncNav(key){
  if(!key)return;
  const top=document.querySelector('.nx-world-nav');
  const bottom=document.querySelector('.nx-bottom');
  if(isBottom(key)){
    if(top)top.querySelectorAll('button.active').forEach(function(button){button.classList.remove('active');});
    if(bottom){
      bottom.querySelectorAll('button').forEach(function(button){
        const p=button.hasAttribute('data-imc-transfers-world')?'transfers':normalizePageKey(button.getAttribute('data-page'));
        button.classList.toggle('active',p===key);
      });
    }
  }else if(TOP_PAGES.has(key)){
    if(bottom)bottom.querySelectorAll('button.active').forEach(function(button){button.classList.remove('active');});
    if(top){
      top.querySelectorAll('button').forEach(function(button){
        const p=button.hasAttribute('data-imc-codex-world')?'player-codex':normalizePageKey(button.getAttribute('data-world-section'));
        if(p)button.classList.toggle('active',p===key);
      });
    }
  }
}
function decorate(){
  if(currentWorld()!==WORLD){forcedPage="";return;}
  const root=pageRoot();if(!root)return;
  let key=forcedPage||inferPage();
  if(!key)return;
  syncNav(key);
  if(key==="competitions"){
    root.classList.remove("imc-gw001-page-standard");
    root.querySelectorAll('.'+HERO_CLASS).forEach(function(el){el.remove();});
    root.querySelectorAll('.'+BODY_CLASS).forEach(function(el){el.classList.remove(BODY_CLASS);});
    return;
  }
  const meta=pageMeta(key);if(!meta)return;
  installStyles();
  root.classList.add("imc-gw001-page-standard");
  let hero=root.querySelector(':scope > .'+HERO_CLASS);
  if(!hero||hero.getAttribute('data-imc-gw001-hero')!==key){
    if(hero)hero.remove();
    root.insertAdjacentHTML('afterbegin',heroMarkup(key));
    hero=root.querySelector(':scope > .'+HERO_CLASS);
  }
  const body=[...root.children].find(function(el){return !el.classList.contains(HERO_CLASS);});
  root.querySelectorAll(':scope > .'+BODY_CLASS).forEach(function(el){if(el!==body)el.classList.remove(BODY_CLASS);});
  if(body)body.classList.add(BODY_CLASS);
}
function suppressCompetitionNow(){
  if(currentWorld()!==WORLD)return;
  const key=forcedPage||activeBottomKey();
  if(!isBottom(key))return;
  document.querySelectorAll('.nx-world-nav [data-world-section="competitions"].active').forEach(function(button){button.classList.remove('active');});
}
function schedule(){clearTimeout(timer);timer=setTimeout(decorate,18);}
function navClick(event){
  if(currentWorld()!==WORLD)return;
  const target=event.target&&event.target.closest?event.target.closest('.nx-world-nav button,.nx-bottom button'):null;
  if(!target)return;
  if(target.closest('.nx-bottom')){
    forcedPage=target.hasAttribute('data-imc-transfers-world')?'transfers':normalizePageKey(target.getAttribute('data-page'));
    suppressCompetitionNow();
    schedule();
    return;
  }
  if(target.closest('.nx-world-nav')){
    forcedPage=target.hasAttribute('data-imc-codex-world')?'player-codex':normalizePageKey(target.getAttribute('data-world-section'));
    schedule();
  }
}
function start(){
  installStyles();
  document.addEventListener('click',navClick,true);
  if(!observer){
    observer=new MutationObserver(function(){suppressCompetitionNow();schedule();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  decorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.IMC_GW001_PAGE_STANDARD={version:VERSION,refresh:decorate};
})();
