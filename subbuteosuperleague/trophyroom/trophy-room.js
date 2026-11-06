/* Display-only Trophy Room. Award records and attribution remain unchanged. */
window.NexusTrophies={
 mount(container,rows,gw,competitions=[]){
  const root=document.createElement('section');root.className='trophy-page trophy-embedded';
  root.innerHTML='<input data-trophy="search" type="search" aria-label="Cerca squadra, manager o trofeo" placeholder="Cerca squadra, manager o trofeo…"><p data-trophy="directory-note" class="trophy-note"></p><div data-trophy="directory-list" class="trophy-grid" aria-live="polite"></div>';
  container.replaceChildren(root);
  return this.render(rows,gw,{root,base:'/nexus/',competitions});
 },
 async render(rows,gw,options={}){
 const root=options.root||document,base=options.base||'';
 const nodes=Object.fromEntries(['search','directory-note','directory-list'].map(id=>[id,options.root?root.querySelector('[data-trophy="'+id+'"]'):document.getElementById(id)]));
 const $=id=>nodes[id],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(!options.root)document.body.classList.add('trophy-page');
 const grid=$('directory-list');grid.classList.add('trophy-grid');
 $('search').placeholder='Cerca squadra, manager o trofeo…';
 document.querySelectorAll('.shortcut').forEach(a=>{if(a.textContent==='Trophy Room')a.setAttribute('aria-current','page')});
 const catalog=[...rows,...(options.competitions||[])];
 const filters=document.createElement('div');filters.className='trophy-filters';
 const specs=[['imc_season','Stagione','Tutte le stagioni'],['nexus_view','Competizione','Tutte le competizioni']];
 const selects=specs.map(([key,label,all])=>{const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');select.add(new Option(all,''));[...new Set(rows.map(r=>String(r[key]??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true})).forEach(v=>select.add(new Option(key==='imc_season'?'Stagione '+v:v,v)));wrap.append(select);filters.append(wrap);return [key,select]});
 $('search').after(filters);
 const groups=[['DOMESTIC','Domestic'],['INTERNATIONAL','International'],['NATIONS','Nations'],['IMC','Coppe IMC']];
 const action=r=>String(r.trophy_type||'').toLowerCase();
 const groupOf=r=>['worldcup','interqualifier'].includes(action(r))?'NATIONS':(/(?:^GW011_IMC_|[|]IMC[|])/i.test(String(r.competition_key))?'IMC':String(r.competition_group||'').toUpperCase());
 // Same ordering as competitions/catalog.php and competition-tabs.js.
 const order={league:0,playoff:1,charityshield:2,leaguecup:3,nationalcup:3,leagueshield:4,smfacup:5,smfashield:6,supercup:7,interqualifier:8,worldcup:9};
 const compare=(a,b)=>(order[action(a)]??99)-(order[action(b)]??99)||String(a.sm_country||'').localeCompare(String(b.sm_country||''))||Number(a.sm_division||0)-Number(b.sm_division||0)||String(a.competition_key).localeCompare(String(b.competition_key));
 let activeGroup=groups.find(([id])=>rows.some(r=>groupOf(r)===id))?.[0]||'DOMESTIC';
 const tabs=document.createElement('nav');tabs.className='trophy-groups';tabs.setAttribute('aria-label','Tipologia trofei');
 tabs.innerHTML=groups.map(([id,label])=>'<button type="button" data-group="'+id+'" aria-pressed="false">'+label+'</button>').join('');
 $('search').before(tabs);
 function refreshCompetitions(){
  const select=selects.find(([key])=>key==='nexus_view')[1];
  select.replaceChildren(new Option('Tutte le competizioni',''));
  [...new Set(catalog.filter(r=>groupOf(r)===activeGroup).map(r=>r.nexus_view).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true})).forEach(name=>select.add(new Option(name,name)));
 }
 refreshCompetitions();
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{activeGroup=b.dataset.group;selects.forEach(([,s])=>s.value='');refreshCompetitions();draw()});
 const emblems=new Map();
 const winnerManagers=new Map();
 for(const r of rows){
  const national=groupOf(r)==='NATIONS',src=String(r.winner_logo_url||'').replace(/^http:/,'https:');
  if(/^(https:\/\/|\/(?!\/))/.test(src))emblems.set((national?'nations':'clubs')+':'+r.winner_sm_world_club_id,src);
  if(r.winner_manager_id)winnerManagers.set(r.id,{manager_id:r.winner_manager_id,full_name:r.winner_manager_name});
 }
 const art=type=>{
  const shape=/shield/.test(type)?'<circle cx="60" cy="57" r="35"/><circle cx="60" cy="57" r="27"/><path d="m60 36 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z"/>':/league|playoff/.test(type)?'<path d="M38 26h44l-5 48-17 14-17-14z"/><path d="M44 26v-9h32v9M60 88v15M42 109h36M49 38l11 9 11-9M49 54l11 9 11-9"/>':'<path d="M37 22h46v24c0 23-12 32-23 32S37 69 37 46z"/><path d="M37 30H22v15c0 15 10 22 22 22M83 30h15v15c0 15-10 22-22 22M60 78v23M44 102h32v8H44z"/>';
  return '<svg viewBox="0 0 120 128" class="trophy-art" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 };
 function draw(){
  if(!grid.isConnected)return;
  const q=$('search').value.trim().toLocaleLowerCase('it');
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===activeGroup)));
  const filtered=rows.filter(r=>groupOf(r)===activeGroup&&selects.every(([key,s])=>!s.value||String(r[key]??'')===s.value)&&[r.winner_name,r.nexus_view,r.trophy_type,r.competition_key,r.winner_manager_name].filter(Boolean).join(' ').toLocaleLowerCase('it').includes(q)).sort(compare);
  $('directory-note').textContent=filtered.length+' di '+rows.length+' trofei · Subbuteo Super League';
  const honours=new Map();for(const r of filtered){const key=String(r.competition_key||'').replace(/^(?:GW\d{3}|IMC-?\d{3})[|]/,'')||[r.competition_group,r.sm_country,r.trophy_type,r.sm_division].join('|');if(!honours.has(key))honours.set(key,[]);honours.get(key).push(r)}
  const award=r=>{
   const national=r.competition_group==='NATIONS'||['worldcup','interqualifier'].includes(r.trophy_type);
   const src=emblems.get((national?'nations':'clubs')+':'+r.winner_sm_world_club_id);
   const name=r.winner_name||'Vincitore non disponibile';
   const initials=name.split(/\s+/).slice(0,2).map(s=>s[0]).join('');
   const manager=winnerManagers.get(r.id),teamId=Number(r.winner_sm_world_club_id);
   const teamUrl=teamId>0?(national?'/subbuteosuperleague/nations/detail.html?':'/subbuteosuperleague/clubs/detail.html?')+new URLSearchParams({world:gw,type:national?'nation':'club',id:String(teamId)}):null;
   const managerHtml=manager?'<a href="'+esc('/subbuteosuperleague/managers/profile.html?'+new URLSearchParams({world:gw,manager:manager.manager_id}))+'">'+esc(manager.full_name)+'</a>':'Manager non disponibile';
   const day=String(r.won_date||'').slice(0,10),date=/^\d{4}-\d{2}-\d{2}$/.test(day)?new Date(day+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}):'Data non disponibile';
   const portraitRaw=String(r.winner_manager_photo_url||'').replace(/^http:/,'https:');
   const portraitSrc=/^(https:\/\/|\/(?!\/))/.test(portraitRaw)?portraitRaw:'';
   const portrait='<span class="trophy-portrait" aria-label="Foto manager"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="16" cy="10" r="5"/><path d="M6 29v-4a10 10 0 0 1 20 0v4"/></svg>'+(portraitSrc?'<img src="'+esc(portraitSrc)+'" alt="" loading="lazy">':'')+'</span>';
   return '<li class="trophy-honour"><div class="trophy-season"><strong>Stagione '+esc(r.imc_season||'—')+'</strong><time'+(/^\d{4}-\d{2}-\d{2}$/.test(day)?' datetime="'+esc(day)+'"':'')+'>'+esc(date)+'</time></div>'+(teamUrl?'<a class="trophy-winner" href="'+esc(teamUrl)+'">':'<div class="trophy-winner">')+'<span class="trophy-crest"><span>'+esc(initials)+'</span>'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy">':'')+'</span><strong>'+esc(name)+'</strong>'+(teamUrl?'</a>':'</div>')+'<div class="trophy-manager">'+portrait+'<span>'+managerHtml+'</span></div></li>';
  };
  grid.innerHTML=filtered.length?[...honours.values()].map(history=>{history.sort((a,b)=>Number(b.imc_season)-Number(a.imc_season)||String(b.won_date).localeCompare(String(a.won_date)));const r=history[0];return '<article class="trophy-card"><header class="trophy-title">'+art(action(r))+'<h3 class="trophy-competition">'+esc(r.nexus_view||r.trophy_type||r.competition_key)+'</h3></header><div class="trophy-columns" aria-hidden="true"><span>Stagione</span><span>Squadra</span><span>Manager</span></div><ul class="trophy-honours" aria-label="Albo d’oro">'+history.map(award).join('')+'</ul></article>'}).join(''):'<p class="empty">Nessun trofeo ancora assegnato per la selezione.</p>';
  grid.querySelectorAll('.trophy-crest img,.trophy-portrait img').forEach(img=>{img.addEventListener('error',()=>img.remove());img.addEventListener('load',()=>img.previousElementSibling.hidden=true)});
 }
 selects.forEach(([,s])=>s.addEventListener('change',draw));$('search').oninput=draw;draw();

}};

