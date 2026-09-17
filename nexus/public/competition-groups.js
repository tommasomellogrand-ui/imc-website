(()=>{'use strict';
const norm=v=>String(v||'').trim().toUpperCase();
function groupOf(c){const g=norm(c.sm_action_group||c.competition_group_name||c.competition_group);if(g.includes('NATION'))return 'nations';if(g.includes('INTERNATIONAL'))return 'international';return 'domestic'}
function init(){const rows=document.getElementById('rows');if(!rows)return;const original=window.__IMC_COMPETITION_GROUPS_ORIGINAL__;
const observer=new MutationObserver(()=>{const title=document.getElementById('sectionTitle');if(!title||title.textContent.trim()!=='Competizioni'||rows.dataset.grouped==='1')return;const cards=[...rows.querySelectorAll('.card')];if(!cards.length)return;});observer.observe(rows,{childList:true});}
window.IMC_COMPETITION_GROUPS={groupOf};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
