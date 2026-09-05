(function(){
"use strict";
if(window.IMC_ROAD_CHRONICLE_ARTICLE_IMAGES)return;
const VERSION="1.4.0";
const HERO="data:image/jpeg;base64,"+(window.__RC_HERO_PARTS__||[]).join("");
const FINAL="data:image/jpeg;base64,"+(window.__RC_FINAL_PARTS__||[]).join("");
function installStyle(){if(document.getElementById("rc-article-image-style"))return;const s=document.createElement("style");s.id="rc-article-image-style";s.textContent='.rc-story-image[data-rc-image-loaded="1"]{background:#000!important;border:0!important}.rc-story-image[data-rc-image-loaded="1"]::before,.rc-story-image[data-rc-image-loaded="1"]::after{display:none!important}.rc-story-image[data-rc-image-loaded="1"]>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}';document.head.appendChild(s);}
function put(label,src,alt){if(!src||src.endsWith(','))return;for(const slot of document.querySelectorAll(".rc-story-image")){const strong=slot.querySelector("strong");if(!strong||strong.textContent.trim()!==label||slot.dataset.rcImageLoaded==="1")continue;slot.dataset.rcImageLoaded="1";slot.innerHTML=`<img src="${src}" alt="${alt}">`;}}
function hydrate(){installStyle();put("BORUSSIA DORTMUND CAMPIONE · HERO COVER",HERO,"Borussia Dortmund festeggia la conquista della Road To History Cup");put("FINALE · RAPHINHA / FESTA CON LA COPPA",FINAL,"Borussia Dortmund 1-0 Bologna, finale della Road To History Cup");}
const observer=new MutationObserver(hydrate);observer.observe(document.documentElement,{childList:true,subtree:true});hydrate();
window.IMC_ROAD_CHRONICLE_ARTICLE_IMAGES={version:VERSION,refresh:hydrate};
})();