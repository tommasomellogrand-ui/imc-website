/* Shared presentation enhancement. No fetching, routing or data changes. */
(()=>{'use strict';
 const groups={tabs:'.tabs,.stat-tabs,.dr-tabs,.hh-detail-tabs,.mx-tabs,.transfer-tabs,.clubhouse-page #tabs,.md-tabs,.article-tabs,.deep-tabs',scope:'.manager-scope,#scope-tabs,.group-tabs,.trophy-groups,.hh-scope',filter:'.nexus-filter-chips,.selection-tabs,.dr-chips,.division-tabs,.md-divisions'};
 const labels={'OVERVIEW':'Overview','MANAGER':'Manager','ROSTER':'Roster','STATS':'Stats','DATA ROOM':'Data Room','H2H':'H2H','TRANSFERS':'Transfers','TROPHY ROOM':'Trophy Room','CAREER':'Career','TABLE':'Table','RESULTS':'Results','SCHEDULE':'Schedule','IMC ACTIVE':'IMC Active','EXT ACTIVE':'EXT Active','IMC CAREER':'IMC Career'};
 const known=new Map();let pending=false;
 const children=nav=>Array.from(nav.children).filter(e=>e.matches('button,a'));
 const selected=nav=>children(nav).find(e=>e.matches('.active,.on,[aria-pressed="true"],[aria-selected="true"],[aria-current="page"]'));
 function reveal(nav,button){if(!button||nav.clientWidth===0)return;const a=nav.getBoundingClientRect(),b=button.getBoundingClientRect();if(b.left<a.left+6)nav.scrollLeft-=a.left+6-b.left;else if(b.right>a.right-6)nav.scrollLeft+=b.right-a.right+6;}
 function scan(){pending=false;enhanceLayout();for(const [kind,selector] of Object.entries(groups))document.querySelectorAll(selector).forEach(nav=>{
   nav.dataset.nxNav=kind;
   if(!known.has(nav)){known.set(nav,null);nav.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||!e.target.matches('button,a'))return;const items=children(nav).filter(b=>!b.disabled),i=items.indexOf(e.target);if(i<0)return;const index=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;e.preventDefault();items[index].focus({preventScroll:true});reveal(nav,items[index]);});}
   if(kind==='tabs')children(nav).forEach(b=>{const raw=b.textContent.trim();if(labels[raw]&&raw!==labels[raw]&&b.childElementCount===0){if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',raw);b.textContent=labels[raw];}});
   const active=selected(nav);if(known.get(nav)!==active){known.set(nav,active);reveal(nav,active);}
   if(kind==='tabs')enhanceRail(nav);
   if(kind==='scope')enhanceScope(nav);
 });for(const nav of known.keys())if(!nav.isConnected)known.delete(nav);}
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(scan);}};
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed','aria-selected','aria-current','hidden']});
 window.addEventListener('resize',()=>{for(const [nav,active] of known)reveal(nav,active);},{passive:true});
 function enhanceLayout(){
  enhanceCompetitions();
  if(!document.body.classList.contains('nx-linea-oro'))document.body.classList.add('nx-linea-oro');
  const header=document.querySelector('body>.profile-banner,body>header.hero,body.clubhouse-page>header:not(#nx-universal-header),body>.md-banner,body>.club-hero');
  if(header&&!header.classList.contains('nx-masthead')){
   header.classList.add('nx-masthead');
   const top=header.querySelector('.profile-top,.top,.md-top,.club-top');
   if(top){top.classList.add('nx-topbar');const brand=top.querySelector('.nexus-brand,.brand');if(brand){const strap=document.createElement('span');strap.className='nx-brand-caption';strap.textContent='Italian Masters Club';brand.after(strap);}

   }
   let hero=header.querySelector('.profile-hero');if(!hero&&header.classList.contains('hero')&&top){hero=document.createElement('div');hero.className='nx-hero';while(top.nextSibling)hero.append(top.nextSibling);top.parentNode.append(hero);}else if(!hero)hero=header.querySelector('.hero');if(hero)hero.classList.add('nx-hero');
  }
  document.querySelectorAll('.dr').forEach(dr=>{
   const head=dr.querySelector('header');if(head&&!head.querySelector('.nx-dr-subtitle')){const small=head.querySelector('small');if(small){small.className='nx-dr-subtitle';small.textContent='Analisi e rendimento';head.querySelector('h2')?.after(small);}}
   if(dr.querySelector('.nx-report'))return;const nav=dr.querySelector('.dr-tabs'),status=dr.querySelector('.dr-status'),content=dr.querySelector('.dr-content');if(!nav||!status||!content)return;
   const detail=document.createElement('details');detail.className='nx-report';const summary=document.createElement('summary');const label=document.body.dataset.profileFamily==='managers'?'Report manager':document.body.dataset.profileFamily==='nations'?'Report nazionale':'Report squadre';summary.innerHTML='<span class="nx-report-icon" aria-hidden="true"><i></i><i></i><i></i></span><span><strong>'+label+'</strong><small>Approfondimenti, trend e metriche chiave.</small></span><span class="nx-report-arrow" aria-hidden="true">›</span>';detail.append(summary);nav.before(detail);detail.append(nav,status,content);
  });
 }
 function enhanceCompetitions(){
  const name=document.getElementById('selected-name'),choices=document.getElementById('competition-tabs'),tabs=document.getElementById('competition-nav');
  if(!name||!choices||!tabs)return;
  if(!document.body.classList.contains('nx-competition'))document.body.classList.add('nx-competition');
  let card=document.querySelector('.nx-competition-card');
  if(!card){
   const back=document.querySelector('.back-row'),season=document.getElementById('season-select');if(back&&season)back.append(season.parentElement);
   card=document.createElement('section');card.className='nx-competition-card';choices.before(card);
   const hero=document.createElement('div');hero.className='nx-competition-identity';
   const symbol=document.createElement('div');symbol.className='nx-competition-symbol';symbol.setAttribute('aria-hidden','true');symbol.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v6M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/></svg>';
   const tools=document.getElementById('competition-tools'),meta=document.createElement('p');meta.className='nx-competition-meta';tools.append(meta);hero.append(symbol,tools);card.append(hero,choices,tabs.parentElement.classList.contains('nx-rail-frame')?tabs.parentElement:tabs);
  }
  const source=document.getElementById('meta')?.textContent||'',country=document.getElementById('country-filter'),active=country?.querySelector('[aria-pressed="true"]');
  const code=country&&!country.hidden?document.getElementById('country-select')?.value||active?.dataset.value||'':'';
  country?.querySelectorAll('.nexus-filter-chips button[data-value]').forEach(b=>{const c=b.dataset.value;if(!/^[A-Z]{3}$/.test(c))return;if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',b.title||b.textContent.trim());for(const node of b.childNodes)if(node.nodeType===3&&node.textContent!==c)node.textContent=c;});
  let full=name.textContent.replace(/\bDiv\s+(\d+)/i,'Divisione $1');
  if(code){const competition=full.match(/(?:Divisione\s+\d+(?:\s+Playoff)?|Charity Shield|National Cup|League Cup|League Shield)$/i);if(competition)full=code+' · '+competition[0];}
  if(name.textContent!==full)name.textContent=full;
  const line=code?code+' · '+source:source;
  const meta=card.querySelector('.nx-competition-meta');if(meta.textContent!==line)meta.textContent=line;
  if(card.hidden!==tabs.hidden)card.hidden=tabs.hidden;
  for(const b of choices.querySelectorAll('button')){const short=b.textContent.replace(/^Div\s+(\d+)$/,'D$1');if(short!==b.textContent){b.setAttribute('aria-label',b.textContent.replace('Div ','Divisione '));b.textContent=short;}}
 }
 function enhanceScope(nav){
  if(nav.id==='group-tabs'&&document.body.classList.contains('nx-competition'))return;
  if(nav.parentElement.classList.contains('nx-scope-band')){if(nav.parentElement.hidden!==nav.hidden)nav.parentElement.hidden=nav.hidden;return;}
  const title=nav.id==='group-tabs'?'Competizioni':nav.id==='scope-tabs'?'Manager · Club House':nav.classList.contains('manager-scope')?'Manager':nav.classList.contains('trophy-groups')?'Trophy Room':null;if(!title)return;
  const band=document.createElement('div');band.className='nx-scope-band';const heading=document.createElement('strong');heading.className='nx-scope-title';heading.textContent=title;nav.before(band);band.append(heading,nav);band.hidden=nav.hidden;
 }
 function enhanceRail(nav){
  let frame=nav.parentElement;if(!frame.classList.contains('nx-rail-frame')){frame=document.createElement('div');frame.className='nx-rail-frame';nav.before(frame);frame.append(nav);const next=document.createElement('button');next.type='button';next.className='nx-rail-next';next.setAttribute('aria-label','Scorri le sezioni');next.innerHTML='<span aria-hidden="true">›</span>';next.onclick=()=>{const end=nav.scrollLeft+nav.clientWidth>=nav.scrollWidth-8;nav.scrollTo({left:end?0:nav.scrollLeft+nav.clientWidth*.7,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};frame.append(next);const update=()=>{const overflow=nav.scrollWidth>nav.clientWidth+2;if(next.hidden===overflow)next.hidden=!overflow;frame.classList.toggle('nx-has-overflow',overflow);const arrow=next.querySelector('span'),text=nav.scrollLeft+nav.clientWidth>=nav.scrollWidth-8?'‹':'›';if(arrow.textContent!==text)arrow.textContent=text;};nav.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(nav);frame._nxUpdate=update;}
  if(frame.hidden!==nav.hidden)frame.hidden=nav.hidden;frame._nxUpdate();
 }

 function universalShell(){
  if(document.getElementById('nx-universal-header'))return;
  document.body.classList.add('nx-universal');
  const params=new URLSearchParams(location.search),valid=w=>/^GW00[1-9]$|^GW010$/.test(w||'');
  let remembered='';try{remembered=localStorage.getItem('imc_nexus_world')||''}catch(e){}
  let world=valid(params.get('world'))?params.get('world'):valid(remembered)?remembered:'GW001';
  const href=(path,w=world)=>'/nexus/'+path+'?'+new URLSearchParams({world:w});
  const header=document.createElement('header');header.id='nx-universal-header';
  header.innerHTML='<div class="nx-universal-top"><a class="nx-universal-brand" href="/nexus/club-house/"><img src="/site-assets/images/imc-logo.png" alt="IMC"><span>NEXUS</span></a><select id="nx-world-select" aria-label="Game World">'+Array.from({length:10},(_,i)=>{const w='GW'+String(i+1).padStart(3,'0');return '<option value="'+w+'">'+w+'</option>'}).join('')+'</select></div><div class="nx-universal-context" id="nx-universal-context"></div>';
  document.body.prepend(header);const selector=header.querySelector('select');selector.value=world;
  const context=document.getElementById('nx-universal-context');
  const updateContext=()=>{context.textContent=location.pathname.includes('/club-house/')&&!params.get('world')?'Club House · Tutti i Game World':world;fetch(href('core/context.php'),{cache:'no-store'}).then(r=>r.json()).then(d=>{if(!d.ok)return;if(location.pathname.includes('/club-house/')&&!params.get('world'))return;context.textContent=(d.world?.game_world_name||world)+(params.get('season')||d.current_season?' · S'+(params.get('season')||d.current_season):'');}).catch(()=>{});};
  selector.onchange=()=>{try{localStorage.setItem('imc_nexus_world',selector.value)}catch(e){}location.href=href('',selector.value);};
  const icon=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  const icons={home:icon('<path d="M3 10 12 3l9 7v11h-6v-7H9v7H3z"/>'),cup:icon('<path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v7M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/>'),club:icon('<path d="M3 10 12 3l9 7M5 9v12h14V9M10 21v-7h4v7M9 10h6"/>'),manager:icon('<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3z"/>'),more:icon('<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>')};
  const nav=document.createElement('nav');nav.id='nx-universal-nav';nav.setAttribute('aria-label','Navigazione Nexus');
  const page=location.pathname,active=page.includes('/club-house/')?'club':page.includes('/competitions/')?'cup':page.includes('/managers/')?'manager':page==='/nexus/'||page==='/nexus/index.html'?'home':'more';
  nav.innerHTML=[['Home','home',href('')],['Competizioni','cup',href('competitions/')],['Club House','club','/nexus/club-house/'],['Manager','manager',href('managers/page.html')]].map(([name,id,url])=>'<a href="'+url+'" class="'+(id==='club'?'nx-clubhouse-center':'')+'"'+(active===id?' aria-current="page"':'')+'><span class="nx-nav-icon">'+icons[id]+'</span><span>'+name+'</span></a>').join('')+'<button type="button" aria-haspopup="dialog" id="nx-universal-more"><span class="nx-nav-icon">'+icons.more+'</span><span>Altro</span></button>';
  document.body.append(nav);
  const dialog=document.createElement('dialog');dialog.id='nx-universal-dialog';dialog.innerHTML='<div><h2>Esplora Nexus</h2><button type="button" aria-label="Chiudi menu">×</button></div><section></section>';document.body.append(dialog);
  dialog.querySelector('button').onclick=()=>dialog.close();
  document.getElementById('nx-universal-more').onclick=()=>{
   const links=new Map();[['Club',href('teams/page.html')],['Nazionali',href('teams/page.html')+'&type=nations'],['Giocatori',href('players/page.html')],['Trasferimenti',href('transfers/page.html')]].forEach(([name,url])=>links.set(url,name));
   document.querySelectorAll('#more-links a,#profile-more-links a').forEach(a=>{if(a.href&&!a.href.includes('/club-house/'))links.set(a.href,a.textContent.trim());});
   const section=dialog.querySelector('section');section.replaceChildren();for(const [url,name]of links){const a=document.createElement('a');a.href=url;a.textContent=name;section.append(a);}dialog.showModal();
  };
  dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
  updateContext();
 }
 universalShell();

 scan();
})();
