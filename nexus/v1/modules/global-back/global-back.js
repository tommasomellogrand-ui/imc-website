(function(){
"use strict";
if(window.IMC_GLOBAL_BACK)return;
const VERSION="1.1.1";
let current={target:"clubhouse"},history=[],backDispatch=false,raf=0;
const clean=v=>String(v==null?"":v).trim();
function route(d){
  const x=d||{},target=clean(x.target);
  if(!target)return null;
  const r={target};
  ["worldId","section","managerId","smManagerId","competitionKey","teamType","teamId","teamName","nationId","transferId","fixtureId","name"].forEach(k=>{if(x[k]!=null&&clean(x[k])!=="")r[k]=x[k]});
  if(Array.isArray(x.teamNames))r.teamNames=[...x.teamNames];
  if(x.transfer!=null)r.transfer=x.transfer;
  return r;
}
function key(r){
  if(!r)return"";
  return [r.target,r.worldId||"",r.section||"",r.managerId||"",r.smManagerId||"",r.competitionKey||"",r.teamType||"",r.teamId||"",r.teamName||"",r.nationId||"",r.transferId||"",r.fixtureId||""].join("|");
}
function same(a,b){return key(a)===key(b)}
function visible(n){if(!n||n.hidden)return false;const s=getComputedStyle(n);return s.display!=="none"&&s.visibility!=="hidden"}
function hasOwnBack(root){
  if(!root)return false;
  const explicit=root.querySelector("[data-cp-back],[data-cd-back],[data-back],[data-gw-back]");
  if(explicit&&visible(explicit))return true;
  return [...root.querySelectorAll("button,a,[role='button']")].some(n=>{
    if(!visible(n)||n.hasAttribute("data-nx-global-back"))return false;
    const attrs=[...n.attributes].map(a=>a.name);
    if(attrs.some(a=>/^data-.*-back$/.test(a)))return true;
    return /(?:torna|back|indietro)/i.test(clean(n.getAttribute("aria-label")));
  });
}
function shell(){return document.querySelector(".gw3-shell")}
function host(){
  const sh=shell();
  if(sh)return{root:sh,content:sh.querySelector(".gw3-content"),shell:true};
  const moduleHost=document.getElementById("moduleHost");
  if(moduleHost&&current&&current.target!=="clubhouse"&&current.target!=="clubhouse-feed")return{root:moduleHost,content:moduleHost,shell:false};
  return null;
}
function makeButton(){
  const b=document.createElement("button");
  b.type="button";
  b.className="nx-global-back";
  b.setAttribute("data-nx-global-back","1");
  b.setAttribute("aria-label","Torna indietro");
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/></svg>';
  return b;
}
function ensureButton(){
  const h=host();
  if(!h)return null;
  let b=h.root.querySelector(":scope > [data-nx-global-back]");
  if(b)return b;
  b=makeButton();
  if(h.shell&&h.content)h.root.insertBefore(b,h.content);
  else h.root.insertBefore(b,h.root.firstChild);
  return b;
}
function sync(){
  raf=0;
  document.querySelectorAll("[data-nx-global-back]").forEach(b=>{const sh=shell();if(current&&["clubhouse","clubhouse-feed"].includes(current.target)){b.remove();return}if(sh&&!sh.contains(b)&&current.target!=="admin")b.remove()});
  const b=ensureButton();
  if(!b)return;
  const h=host();
  const canGoBack=history.length>0&&current&&current.target!=="clubhouse";
  b.hidden=!canGoBack||hasOwnBack(h&&h.content);
}
function queueSync(){if(raf)return;raf=requestAnimationFrame(sync)}
function record(nextRaw){
  const next=route(nextRaw);
  if(!next)return;
  if(backDispatch){backDispatch=false;current=next;queueSync();return}
  if(same(next,current)){queueSync();return}
  const prev=history[history.length-1];
  if(prev&&same(next,prev))history.pop();
  else if(current)history.push(current);
  if(history.length>80)history=history.slice(-80);
  current=next;
  queueSync();
}
document.addEventListener("nexus:navigate",e=>record(e.detail||{}));
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-nx-global-back]");
  if(b){
    const target=history.pop();
    if(!target)return;
    backDispatch=true;
    current=target;
    document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:{...target}}));
    queueSync();
    return;
  }
  if(e.target.closest&&e.target.closest("#adminLauncher")){
    if(current)history.push(current);
    current={target:"admin"};
    queueSync();
  }
});
new MutationObserver(queueSync).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("pageshow",queueSync);
queueSync();
window.IMC_GLOBAL_BACK={version:VERSION,sync:queueSync};
})();