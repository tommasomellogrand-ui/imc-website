/* Display-only Trophy Room. Award records and attribution remain unchanged. */
window.NexusTrophies={
 mount(container,rows,gw){
  const root=document.createElement('section');root.className='trophy-page trophy-embedded';
  root.innerHTML='<input data-trophy="search" type="search" aria-label="Cerca squadra o trofeo" placeholder="Cerca squadra o trofeo…"><p data-trophy="directory-note" class="trophy-note"></p><div data-trophy="directory-list" class="trophy-grid" aria-live="polite"></div>';
  container.replaceChildren(root);
  return this.render(rows,gw,{root,base:'../'});
 },
 async render(rows,gw,options={}){
 const root=options.root||document,base=options.base||'';
 const nodes=Object.fromEntries(['search','directory-note','directory-list'].map(id=>[id,options.root?root.querySelector('[data-trophy="'+id+'"]'):document.getElementById(id)]));
 const $=id=>nodes[id],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(!options.root)document.body.classList.add('trophy-page');
 const grid=$('directory-list');grid.classList.add('trophy-grid');
 $('search').placeholder='Cerca squadra o trofeo…';
 document.querySelectorAll('.shortcut').forEach(a=>{if(a.textContent==='Trophy Room')a.setAttribute('aria-current','page')});
 const filters=document.createElement('div');filters.className='trophy-filters';
 const specs=[['imc_season','Stagione','Tutte le stagioni'],['sm_country','Paese','Tutti i paesi'],['nexus_view','Competizione','Tutte le competizioni']];
 const selects=specs.map(([key,label,all])=>{const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');select.add(new Option(all,''));[...new Set(rows.map(r=>String(r[key]??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true})).forEach(v=>select.add(new Option(key==='imc_season'?'Stagione '+v:v,v)));wrap.append(select);filters.append(wrap);return [key,select]});
 $('search').after(filters);
 const groups=[['DOMESTIC','Domestic'],['INTERNATIONAL','International'],['NATIONS','World Cup']];
 const action=r=>String(r.trophy_type||'').toLowerCase();
 const groupOf=r=>['worldcup','interqualifier'].includes(action(r))?'NATIONS':String(r.competition_group||'').toUpperCase();
 // Same ordering as competitions/catalog.php and competition-tabs.js.
 const order={league:0,playoff:1,charityshield:2,leaguecup:3,nationalcup:3,leagueshield:4,smfacup:5,smfashield:6,supercup:7,interqualifier:8,worldcup:9};
 const compare=(a,b)=>(order[action(a)]??99)-(order[action(b)]??99)||String(a.sm_country||'').localeCompare(String(b.sm_country||''))||Number(a.sm_division||0)-Number(b.sm_division||0)||String(a.competition_key).localeCompare(String(b.competition_key));
 let activeGroup=groups.find(([id])=>rows.some(r=>groupOf(r)===id))?.[0]||'DOMESTIC';
 const tabs=document.createElement('nav');tabs.className='trophy-groups';tabs.setAttribute('aria-label','Tipologia trofei');
 tabs.innerHTML=groups.map(([id,label])=>'<button type="button" data-group="'+id+'" aria-pressed="false">'+label+'</button>').join('');
 $('search').before(tabs);
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{activeGroup=b.dataset.group;selects.forEach(([,s])=>s.value='');draw()});
 const emblems=new Map();
 const winnerManagers=new Map();
 const art=type=>{
  const shape=/shield/.test(type)?'<circle cx="60" cy="57" r="35"/><circle cx="60" cy="57" r="27"/><path d="m60 36 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z"/>':/league|playoff/.test(type)?'<path d="M38 26h44l-5 48-17 14-17-14z"/><path d="M44 26v-9h32v9M60 88v15M42 109h36M49 38l11 9 11-9M49 54l11 9 11-9"/>':'<path d="M37 22h46v24c0 23-12 32-23 32S37 69 37 46z"/><path d="M37 30H22v15c0 15 10 22 22 22M83 30h15v15c0 15-10 22-22 22M60 78v23M44 102h32v8H44z"/>';
  return '<svg viewBox="0 0 120 128" class="trophy-art" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 };
 function draw(){
  if(!grid.isConnected)return;
  const q=$('search').value.trim().toLocaleLowerCase('it');
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===activeGroup)));
  const filtered=rows.filter(r=>groupOf(r)===activeGroup&&selects.every(([key,s])=>!s.value||String(r[key]??'')===s.value)&&[r.winner_name,r.nexus_view,r.trophy_type,r.competition_key,r.winner_manager_name].filter(Boolean).join(' ').toLocaleLowerCase('it').includes(q)).sort(compare);
  $('directory-note').textContent=filtered.length+' di '+rows.length+' trofei · '+gw;
  const honours=new Map();for(const r of filtered){const key=r.competition_key||[r.competition_group,r.sm_country,r.trophy_type,r.sm_division].join('|');if(!honours.has(key))honours.set(key,[]);honours.get(key).push(r)}
  const award=r=>{
   const national=r.competition_group==='NATIONS'||['worldcup','interqualifier'].includes(r.trophy_type);
   const src=emblems.get((national?'nations':'clubs')+':'+r.winner_sm_world_club_id);
   const name=r.winner_name||'Vincitore non disponibile';
   const initials=name.split(/\s+/).slice(0,2).map(s=>s[0]).join('');
   const manager=winnerManagers.get(r.id),teamId=Number(r.winner_sm_world_club_id);
   const teamUrl=teamId>0?base+'teams/detail.html?'+new URLSearchParams({world:gw,type:national?'nation':'club',id:String(teamId)}):null;
   const managerHtml=manager?'<a href="'+esc(base+'managers/profile.html?'+new URLSearchParams({world:gw,manager:manager.manager_id}))+'">'+esc(manager.full_name)+'</a>':'Manager non disponibile';
   const day=String(r.won_date||'').slice(0,10),date=/^\d{4}-\d{2}-\d{2}$/.test(day)?new Date(day+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}):'Data non disponibile';
   return '<li class="trophy-honour">'+(teamUrl?'<a class="trophy-winner" href="'+esc(teamUrl)+'">':'<div class="trophy-winner">')+'<span class="trophy-crest"><span>'+esc(initials)+'</span>'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy">':'')+'</span><strong>'+esc(name)+'</strong>'+(teamUrl?'</a>':'</div>')+'<p class="trophy-manager">'+managerHtml+'</p><div class="trophy-date"><strong>Stagione '+esc(r.imc_season||'—')+'</strong><time'+(/^\d{4}-\d{2}-\d{2}$/.test(day)?' datetime="'+esc(day)+'"':'')+'>'+esc(date)+'</time></div></li>';
  };
  grid.innerHTML=filtered.length?[...honours.values()].map(history=>{history.sort((a,b)=>Number(b.imc_season)-Number(a.imc_season)||String(b.won_date).localeCompare(String(a.won_date)));const r=history[0];return '<article class="trophy-card"><div class="trophy-stage">'+art(action(r))+'</div><h3 class="trophy-competition">'+esc(r.nexus_view||r.trophy_type||r.competition_key)+'</h3><ul class="trophy-honours" aria-label="Albo d’oro">'+history.map(award).join('')+'</ul></article>'}).join(''):'<p class="empty">Nessun trofeo corrisponde ai filtri.</p>';
  grid.querySelectorAll('.trophy-crest img').forEach(img=>{img.addEventListener('error',()=>img.remove());img.addEventListener('load',()=>img.previousElementSibling.hidden=true)});
 }
 selects.forEach(([,s])=>s.addEventListener('change',draw));$('search').oninput=draw;draw();
 await Promise.all(['clubs','nations'].map(async type=>{try{const response=await fetch(base+'teams/directory.php?'+new URLSearchParams({world:gw,type}),{cache:'no-store'});if(!response.ok)return;const d=await response.json();const grouped=new Map();for(const r of d.rows||[]){const key=type+':'+r.world_id;if(grouped.has(key)){grouped.set(key,null);continue}let src=String(r.image_url||'').replace(/^http:/,'https:');if(src.startsWith('//'))src='https:'+src;grouped.set(key,/^(https:\/\/|\/(?!\/))/.test(src)?src:null)}for(const [key,src] of grouped)if(src)emblems.set(key,src)}catch(e){/* Keep awards readable when optional logos cannot load. */}}));draw();
 // Read existing historical assignments, not the team's current manager.
 try{
  const response=await fetch(base+'managers/index.php',{cache:'no-store'});if(!response.ok)return;
  const managers=(await response.json()).rows||[],assignments=[];let next=0,complete=true;
  await Promise.all(Array.from({length:Math.min(4,managers.length)},async()=>{while(next<managers.length&&grid.isConnected){const manager=managers[next++];try{const res=await fetch(base+'managers/index.php?'+new URLSearchParams({world:gw,manager:manager.manager_id}),{cache:'no-store'});if(!res.ok)throw Error();const data=await res.json();if(data.ok===false)throw Error();for(const a of data.assignments||[])assignments.push({...a,manager})}catch(e){complete=false}}}));
  if(complete)for(const r of rows){const day=String(r.won_date||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!(Number(r.winner_sm_world_club_id)>0))continue;const national=groupOf(r)==='NATIONS',matches=new Map();for(const a of assignments){if(a.game_world_id!==gw||a.assignment_type!==(national?'national_team':'club')||String(national?a.national_team_id:a.team_id)!==String(r.winner_sm_world_club_id))continue;if(!a.start_date||a.start_date==='0000-00-00'||a.start_date>day||(a.end_date!=null&&a.end_date<day))continue;matches.set(a.manager.manager_id,a.manager)}if(matches.size===1)winnerManagers.set(r.id,[...matches.values()][0])}
  draw();
 }catch(e){/* Never invent historical attribution or hide awards when optional details fail. */}
}};
