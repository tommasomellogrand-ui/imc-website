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

const iconPaths=[
'M2 10H6V6H10V2H14V6H18V10H22V22H14V14H10V22H2Z',
'M4 2H20V6H24V14H20V18H14V20H18V24H6V20H10V18H4V14H0V6H4ZM4 8H2V12H4ZM20 8V12H22V8Z',
'M2 4H22V20H2ZM4 6V18H20V6ZM6 8H10V12H6ZM14 8H18V12H14ZM6 14H18V16H6Z',
'M4 2H8V6H16V2H20V6H24V24H0V6H4ZM2 10V22H22V10ZM4 12H8V16H4ZM10 12H14V16H10ZM16 12H20V16H16Z',
'M2 2H22V18H14V22H18V24H6V22H10V18H2ZM4 4V16H20V4ZM8 6L16 10L8 14Z',
'M2 18H8V24H2ZM10 10H16V24H10ZM18 2H24V24H18Z',
'M8 2H16V4H18V12H16V14H8V12H6V4H8ZM4 16H20V18H22V24H2V18H4Z',
'M6 2H10V6H14V2H18L24 8L20 12L18 10V24H6V10L4 12L0 8Z',
'M0 4H16V0L24 8L16 16V12H0ZM24 20H8V24L0 16L8 8V12H24Z',
'M2 2H22V6H2ZM4 8H20V24H4ZM8 12V16H16V12Z',
'M0 2H6V6H10V10H14V6H18V2H24V8H18V10H14V14H10V18H6V22H0V16H6V14H10V10H6V8H0Z',
'M2 2H10V10H2ZM14 2H22V10H14ZM2 14H10V22H2ZM14 14H22V22H14Z'
];
document.querySelectorAll('#system-nav a').forEach((a,i)=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','sprite-icon');s.setAttribute('aria-hidden','true');const p=document.createElementNS(s.namespaceURI,'path');p.setAttribute('d',iconPaths[i]);p.setAttribute('fill','currentColor');p.setAttribute('fill-rule','evenodd');s.append(p);a.prepend(s)});
