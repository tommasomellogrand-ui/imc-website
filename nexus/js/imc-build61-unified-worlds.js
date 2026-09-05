(function(){
"use strict";
if(window.__IMC_BUILD61_UNIFIED_WORLDS__)return;
window.__IMC_BUILD61_UNIFIED_WORLDS__=true;

const VERSION="1.0.0";
const WORLDS={
  GW001:"Road To History",
  GW002:"Gold 558",
  GW003:"Gold 557",
  GW004:"World League",
  GW005:"Hall Of Famers",
  GW006:"Master League World",
  GW007:"The Four Kingdoms",
  GW008:"Gold 1",
  GW009:"Kick Off",
  GW010:"Sensible Soccer Academy"
};

function replaceAllLiteral(text,from,to){return text.split(from).join(to)}
function worldize(source,world,name){
  let out=source;
  out=replaceAllLiteral(out,"GW008",world);
  out=replaceAllLiteral(out,"gw008",world.toLowerCase());
  out=replaceAllLiteral(out,"Gw008","Gw"+world.slice(2));
  out=replaceAllLiteral(out,"Gold 1",name);
  return out;
}
function patchTeamHub(source){
  return source.replace(/else if\(s&&s\.textContent==="TEAM HUB"\)\{s\.textContent="CLUBS";c\.removeAttribute\("aria-label"\)\}/g,"");
}
function patchCompetitions(source){
  return source.replace(/world\s*={2,3}\s*["']GW008["']/g,"true");
}
function run(code,label){
  try{(0,eval)(code+"\n//# sourceURL="+label)}catch(e){console.error("[IMC Build61]",label,e)}
}
async function text(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw new Error(path+" HTTP "+r.status);return r.text()}

async function boot(){
  try{
    const stamp=Date.now();
    const [managerTemplate,teamHubTemplate,competitionsTemplate]=await Promise.all([
      text("js/imc-managers-gw008.js?v=1.5.1&b61="+stamp),
      text("js/imc-team-hub-gw008.js?v=2.2.0&b61="+stamp),
      text("js/imc-competitions-all-worlds.js?v=1.1.0&b61="+stamp)
    ]);

    run(patchCompetitions(competitionsTemplate),"imc-competitions-build61-all-worlds.js");

    for(const [world,name] of Object.entries(WORLDS)){
      run(worldize(managerTemplate,world,name),"imc-managers-"+world.toLowerCase()+"-build61.js");
      run(worldize(patchTeamHub(teamHubTemplate),world,name),"imc-team-hub-"+world.toLowerCase()+"-build61.js");
    }

    window.__IMC_BUILD61_UNIFIED_READY__=true;
    document.dispatchEvent(new CustomEvent("imc:build61-unified-ready"));
  }catch(e){
    window.__IMC_BUILD61_UNIFIED_ERROR__=String(e&&e.message||e);
    console.error("[IMC Build61] bootstrap failed",e);
  }
}

boot();
window.IMC_BUILD61_UNIFIED_WORLDS={version:VERSION,worlds:Object.keys(WORLDS)};
})();
