(()=>{'use strict';
const cards=document.getElementById('cards'),summary=document.getElementById('summary'),search=document.getElementById('search'),retry=document.getElementById('retry');let managers=[],mode='active',ready=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome'}).format(new Date());
const active=a=>(!a.start_date||a.start_date.slice(0,10)<=today)&&(!a.end_date||a.end_date.slice(0,10)>=today);
const ended=a=>a.end_date&&a.end_date.slice(0,10)<today;
const label=a=>a.assignment_name||a.national_name||a.team_name||'Squadra';
const date=v=>v?new Date(v.slice(0,10)+'T12:00:00Z').toLocaleDateString('it-IT'):'Data non disponibile';
function team(a){const src=String(a.image_url||'').replace(/^http:/,'https:');return '<div class="team">'+(/^(https:\/\/|\/(?!\/))/.test(src)?'<img src="'+esc(src)+'" alt="" loading="lazy">':'')+'<p>'+esc(label(a))+'<small>'+(a.assignment_type==='national_team'?'Nazionale':'Club')+'</small>'+('<small>'+esc(date(a.start_date))+(a.end_date?' – '+esc(date(a.end_date)):'')+'</small><small class="'+(active(a)?'status-active':'status-ended')+'">'+(active(a)?'Active':'Ended')+'</small>')+'</p></div>'}
let division=0, divisions=[];
const filters=document.getElementById('division-filter');
function render(){
 if(ready){
  const choices=mode==='career'?[...new Set(managers.flatMap(m=>m.assignments.filter(ended).map(a=>a.division)).filter(Boolean))].sort((a,b)=>a-b):divisions;
  if(!choices.includes(division))division=0;
  const total=managers.filter(m=>m.assignments.some(mode==='career'?ended:active)).length;
  filters.innerHTML=[0,...choices].map(n=>'<button type="button" data-division="'+n+'" aria-pressed="'+(division===n)+'">'+(n===0?'Tutti ('+total+')':'Divisione '+n)+'</button>').join('');
 }
if(!ready)return;const q=search.value.trim().toLocaleLowerCase('it');const rows=managers.map(m=>({...m,assignments:m.assignments.filter(a=>(mode==='career'?ended(a):active(a))&&(!division||a.division===division))})).filter(m=>m.assignments.length&&[m.full_name,...m.assignments.map(label)].join(' ').toLocaleLowerCase('it').includes(q));summary.textContent=rows.length+' manager · Subbuteo Super League';cards.innerHTML=rows.length?rows.map(m=>{const inner='<small>'+esc(m.manager_id)+'</small><h2>'+esc(m.full_name)+'</h2>'+m.assignments.map(team).join('');return '<a class="manager-card" href="/subbuteosuperleague/managers/profile.html?manager='+encodeURIComponent(m.manager_id)+'">'+inner+'</a>'}).join(''):'<p class="empty">Nessun manager trovato.</p>';cards.querySelectorAll('img').forEach(i=>i.onerror=()=>{i.hidden=true})}
async function load(){ready=false;retry.hidden=true;cards.replaceChildren();summary.textContent='Caricamento dei manager…';try{const response=await fetch('roster.php',{cache:'no-store'}),data=await response.json();if(!response.ok||!data.ok)throw Error();
 const grouped=new Map();for(const a of data.assignments){if(!grouped.has(a.manager_id))grouped.set(a.manager_id,{manager_id:a.manager_id,full_name:a.full_name,assignments:[]});grouped.get(a.manager_id).assignments.push(a)}
 managers=[...grouped.values()];divisions=data.divisions;ready=true;render()}catch(e){summary.textContent='Impossibile caricare l’elenco completo. Riprova.';retry.hidden=false}}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));render()});filters.onclick=e=>{const b=e.target.closest('[data-division]');if(b){division=Number(b.dataset.division);render();filters.querySelector('[aria-pressed=true]')?.focus()}};search.oninput=render;retry.onclick=load;load();
})();

