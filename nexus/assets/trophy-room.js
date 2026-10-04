/* Display-only Trophy Room. Award records and attribution remain unchanged. */
window.NexusTrophies={async render(rows,gw){
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.body.classList.add('trophy-page');
 const grid=$('directory-list');grid.classList.add('trophy-grid');
 $('search').placeholder='Cerca squadra o trofeo…';
 document.querySelectorAll('.shortcut').forEach(a=>{if(a.textContent==='Trophy Room')a.setAttribute('aria-current','page')});
 const filters=document.createElement('div');filters.className='trophy-filters';
 const specs=[['imc_season','Stagione','Tutte le stagioni'],['sm_country','Paese','Tutti i paesi'],['nexus_view','Competizione','Tutte le competizioni']];
 const selects=specs.map(([key,label,all])=>{const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');select.add(new Option(all,''));[...new Set(rows.map(r=>String(r[key]??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true})).forEach(v=>select.add(new Option(key==='imc_season'?'Stagione '+v:v,v)));wrap.append(select);filters.append(wrap);return [key,select]});
 $('search').after(filters);
 const emblems=new Map();
 const art=type=>{
  const shape=/shield/.test(type)?'<circle cx="60" cy="57" r="35"/><circle cx="60" cy="57" r="27"/><path d="m60 36 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z"/>':/league|playoff/.test(type)?'<path d="M38 26h44l-5 48-17 14-17-14z"/><path d="M44 26v-9h32v9M60 88v15M42 109h36M49 38l11 9 11-9M49 54l11 9 11-9"/>':'<path d="M37 22h46v24c0 23-12 32-23 32S37 69 37 46z"/><path d="M37 30H22v15c0 15 10 22 22 22M83 30h15v15c0 15-10 22-22 22M60 78v23M44 102h32v8H44z"/>';
  return '<svg viewBox="0 0 120 128" class="trophy-art" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 };
 function draw(){
  const q=$('search').value.trim().toLocaleLowerCase('it');
  const filtered=rows.filter(r=>selects.every(([key,s])=>!s.value||String(r[key]??'')===s.value)&&[r.winner_name,r.nexus_view,r.trophy_type,r.competition_key,r.winner_manager_name].filter(Boolean).join(' ').toLocaleLowerCase('it').includes(q));
  $('directory-note').textContent=filtered.length+' di '+rows.length+' trofei · '+gw;
  grid.innerHTML=filtered.length?filtered.map(r=>{
   const national=r.competition_group==='NATIONS'||['worldcup','interqualifier'].includes(r.trophy_type);
   const src=emblems.get((national?'nations':'clubs')+':'+r.winner_sm_world_club_id);
   const name=r.winner_name||'Vincitore non disponibile';
   const initials=name.split(/\s+/).slice(0,2).map(s=>s[0]).join('');
   const day=String(r.won_date||'').slice(0,10),date=/^\d{4}-\d{2}-\d{2}$/.test(day)?new Date(day+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}):'Data non disponibile';
   return '<article class="trophy-card"><div class="trophy-card-top"><span>'+esc(r.sm_country||(national?'NAZIONALI':'INTERNAZIONALE'))+'</span><span>'+esc(r.imc_season?'S'+r.imc_season:'—')+'</span></div><div class="trophy-stage">'+art(String(r.trophy_type||''))+'</div><h3 class="trophy-competition">'+esc(r.nexus_view||r.trophy_type||r.competition_key)+'</h3><div class="trophy-winner"><span class="trophy-crest"><span>'+esc(initials)+'</span>'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy">':'')+'</span><strong>'+esc(name)+'</strong></div>'+(r.winner_manager_name?'<p class="trophy-manager">'+esc(r.winner_manager_name)+'</p>':'')+'<div class="trophy-date"><time'+(/^\d{4}-\d{2}-\d{2}$/.test(day)?' datetime="'+esc(day)+'"':'')+'>'+esc(date)+'</time><span>Stagione '+esc(r.imc_season||'—')+'</span></div></article>';
  }).join(''):'<p class="empty">Nessun trofeo corrisponde ai filtri.</p>';
  grid.querySelectorAll('.trophy-crest img').forEach(img=>{img.addEventListener('error',()=>img.remove());img.addEventListener('load',()=>img.previousElementSibling.hidden=true)});
 }
 selects.forEach(([,s])=>s.addEventListener('change',draw));$('search').oninput=draw;draw();
 await Promise.all(['clubs','nations'].map(async type=>{try{const response=await fetch('teams/directory.php?'+new URLSearchParams({world:gw,type}),{cache:'no-store'});if(!response.ok)return;const d=await response.json();const grouped=new Map();for(const r of d.rows||[]){const key=type+':'+r.world_id;if(grouped.has(key)){grouped.set(key,null);continue}let src=String(r.image_url||'').replace(/^http:/,'https:');if(src.startsWith('//'))src='https:'+src;grouped.set(key,/^(https:\/\/|\/(?!\/))/.test(src)?src:null)}for(const [key,src] of grouped)if(src)emblems.set(key,src)}catch(e){/* Keep awards readable when optional logos cannot load. */}}));draw();
}};
