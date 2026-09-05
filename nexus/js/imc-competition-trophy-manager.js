(function(){
"use strict";
if(window.__IMC_COMPETITION_TROPHY_MANAGER__)return;
window.__IMC_COMPETITION_TROPHY_MANAGER__=true;
const VERSION="1.0.0";
let timer=null;
function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function currentWorld(){const nodes=document.querySelectorAll("#openDrawerWorld strong,.nx-sport-world strong,.nx-world-header strong,.nx-world-header p");for(const n of nodes){const m=clean(n.textContent).match(/GW\d{3}/i);if(m)return m[0].toUpperCase()}return""}
function currentCompetitionKey(){const p=document.querySelector(".imc-comp-detail .imc-comp-detail-head p");const t=clean(p&&p.textContent);if(!t)return"";const parts=t.split(" · ");return clean(parts.slice(1).join(" · "))}
async function apply(){const root=document.querySelector(".imc-comp-detail"),cards=root&&root.querySelectorAll(".imc-comp-trophy-room-card");if(!root||!cards||!cards.length)return;const api=window.IMC_TROPHY_ROOM_ALL_WORLDS,w=currentWorld(),key=currentCompetitionKey();if(!api||!w||!key)return;let data;try{data=await api.load(w,false)}catch(_){return}const rows=data.rows.filter(r=>clean(r.competition_key)===key);cards.forEach(card=>{const copy=card.querySelector(".imc-comp-trophy-room-copy");if(!copy||copy.querySelector("[data-imc-competition-manager]"))return;const winner=clean(copy.querySelector("strong")&&copy.querySelector("strong").textContent),seasonText=clean(copy.querySelector("small")&&copy.querySelector("small").textContent),seasonMatch=seasonText.match(/season\s*(\d+)/i);const match=rows.find(r=>norm(r.winner_name)===norm(winner)&&(!seasonMatch||String(r.season_id)===seasonMatch[1]))||rows.find(r=>norm(r.winner_name)===norm(winner));if(!match||!match.manager)return;const el=document.createElement("span");el.setAttribute("data-imc-competition-manager","1");el.textContent=match.manager.name;el.style.fontWeight="900";el.style.color="#956400";copy.appendChild(el)})}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,40)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest('[data-imc-tab="trophy-room"]'))setTimeout(apply,120)},true);
schedule();
window.IMC_COMPETITION_TROPHY_MANAGER={version:VERSION,refresh:apply};
})();
