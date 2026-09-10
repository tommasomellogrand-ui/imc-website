'use strict';
const page=document.body.dataset.page;
document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===page)a.setAttribute('aria-current','page')});
const menu=document.querySelector('.menu-toggle');
menu.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Chiudi':'Menu'});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';menu.focus()}});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>{const selected=x===b;x.classList.toggle('active',selected);x.setAttribute('aria-pressed',String(selected));document.getElementById(x.dataset.tab).hidden=!selected})}));
const filter=document.getElementById('competition-filter');
if(filter)filter.addEventListener('change',()=>document.querySelectorAll('[data-filter]').forEach(x=>x.hidden=filter.value!=='all'&&x.dataset.filter!==filter.value));
const search=document.getElementById('transfer-search');
if(search)search.addEventListener('input',()=>{let found=0;document.querySelectorAll('[data-search]').forEach(x=>{x.hidden=!x.dataset.search.toLocaleLowerCase('it').includes(search.value.trim().toLocaleLowerCase('it'));if(!x.hidden)found++});document.getElementById('no-transfers').hidden=found>0});
const trigger=document.getElementById('motion-trigger');
if(trigger)trigger.addEventListener('click',()=>{const s=document.getElementById('motion-sample');s.classList.remove('activate');requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add('activate')))});
const clubs=['Alcione Milano','Giulianova','Union Clodiense','Locri','Battipagliese','Ischia'];
const slugs=['alcione-milano','giulianova','union-clodiense','locri','battipagliese','ischia-isolaverde'];
if(page==='fixtures')document.querySelectorAll('.matchrow').forEach(a=>a.href+='&state=scheduled');
if(page==='transfers')document.querySelectorAll('.playerlink').forEach((a,i)=>a.href+='?player='+i);
if(page==='player'){
 const i=Number(new URLSearchParams(location.search).get('player'));
 if([1,2].includes(i)){document.querySelector('.playerlayout h2').textContent='PLAYER '+String(9+i).padStart(2,'0');document.querySelector('.playerportrait>strong').textContent=String(9+i);document.querySelector('.clubline').innerHTML='<img class="crest" src="assets/'+slugs[i]+'.png" alt="" width="40" height="40">'+clubs[i]+' · demo';}
}
if(page==='match'){
 const params=new URLSearchParams(location.search),raw=params.get('fixture'),i=Number(raw);
 if(raw!==null&&[0,1,2].includes(i)){
  const scheduled=params.get('state')==='scheduled';
  const plate=document.getElementById('match-score');
  const home=clubs[i],away=clubs[5-i];
  plate.querySelector('.scoreteams').innerHTML='<div><img class="crest" src="assets/'+slugs[i]+'.png" alt=""><strong>'+home+'</strong></div><div class="digits">'+(scheduled?'– : –':['2 : 1','0 : 0','1 : 3'][i])+'</div><div><img class="crest" src="assets/'+slugs[5-i]+'.png" alt=""><strong>'+away+'</strong></div>';
  plate.querySelector('.scoretop').innerHTML='<span>LEAGUE · DEMO</span><span>'+(scheduled?'IN PROGRAMMA':'FINALE')+' · DEMO</span>';
  plate.querySelector('.scorebottom').textContent=scheduled?'18 SETTEMBRE 2026 · 20:45 · DATA DEMO':'RISULTATO DIMOSTRATIVO';
  document.getElementById('match-heading').innerHTML=scheduled?'NEXT<br>WHISTLE.':'THE<br>FINAL WHISTLE.';
  document.getElementById('events').innerHTML='<h2>'+(scheduled?'PRIMA DEL MATCH':'EVENT LOG')+'</h2><p>'+(scheduled?'Incontro dimostrativo in programma. Nessun evento disponibile.':'Dettaglio eventi non disponibile per questo incontro dimostrativo.')+'</p>';
  document.getElementById('stats').innerHTML='<h2>MATCH DATA</h2><p>Statistiche non disponibili per questo incontro dimostrativo.</p>';
 }
}
