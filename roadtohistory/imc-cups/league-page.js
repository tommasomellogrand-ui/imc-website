window.showLeaguePage=async function({world,base,competition,seasons,season}){
 const root=base.replace(/competitions\/$/,'');
 const oldMain=document.querySelector('main');
 const main=document.createElement('main');main.className='cup-wrap';
 const cover=document.querySelector('.world-entry-static img');
 const back=document.createElement('a');back.className='cup-back';back.href=base+'?'+new URLSearchParams({season,group:competition.competition_group});back.textContent='← Competizioni';
 const heading=document.createElement('h1');heading.textContent=competition.nexus_view;
 main.append(back);
 if(cover){const img=cover.cloneNode();img.className='cup-banner';img.removeAttribute('style');main.append(img);cover.parentElement.closest('.world-entry-static > *')?.remove();}
 main.append(heading);main.insertAdjacentHTML('beforeend',"<div class=\"cup-context\"><label><span class=\"sr-only\">Stagione</span><select id=\"cup-season\"><option>Caricamento…</option></select></label><span id=\"cup-phase\" aria-live=\"polite\"></span></div><nav class=\"cup-tabs\" aria-label=\"Sezioni della competizione\"><button data-main-tab=\"overview\" aria-pressed=\"true\">Overview</button><button data-main-tab=\"matches\" aria-pressed=\"false\">Partite</button><button data-main-tab=\"table\" aria-pressed=\"false\">Classifica</button><button data-main-tab=\"stats\" aria-pressed=\"false\">Statistiche</button></nav><div id=\"cup-view\" aria-live=\"polite\" aria-busy=\"true\"><p class=\"cup-empty\">Caricamento della competizione…</p></div><div class=\"cup-footer\"><span id=\"cup-updated\"></span><button id=\"refresh-cup\">Aggiorna ↻</button></div><dialog id=\"match-dialog\"><button id=\"close-match\" aria-label=\"Chiudi dettaglio\">×</button><div id=\"match-body\"></div></dialog>");
 for(let el=document.querySelector('.world-entry-static')?.nextElementSibling;el&&el!==oldMain;){const next=el.nextElementSibling;el.remove();el=next;}
 oldMain.replaceWith(main);document.title=competition.nexus_view;
 document.body.dataset.competition=competition.competition_key;
 window.leaguePage={isLeague:competition.sm_action==='league'||/\|IMC\|(risingstarsleague|nextgenleague)(\||$)/i.test(competition.competition_key),world,base:root,context:{seasons:seasons.map(imc_season=>({imc_season})),current_season:season}};
 for(const file of ['cup.css','road.css']){const link=document.createElement('link');link.rel='stylesheet';link.href='/roadtohistory/imc-cups/'+file;document.head.append(link);}
 for(const file of ['cup-model.js','cup.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/roadtohistory/imc-cups/'+file+'?v=allcups3';script.onload=resolve;script.onerror=reject;document.head.append(script);});
};