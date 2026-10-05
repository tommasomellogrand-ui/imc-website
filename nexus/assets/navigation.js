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
  const header=document.querySelector('body>.profile-banner,body>header.hero,body.clubhouse-page>header,body>.md-banner,body>.club-hero');
  if(header&&!header.classList.contains('nx-masthead')){
   header.classList.add('nx-masthead');
   const top=header.querySelector('.profile-top,.top,.md-top,.club-top');
   if(top){top.classList.add('nx-topbar');const brand=top.querySelector('.nexus-brand,.brand');if(brand){const strap=document.createElement('span');strap.className='nx-brand-caption';strap.textContent='Italian Masters Club';brand.after(strap);}
    const menu=document.createElement('button');menu.type='button';menu.className='nx-menu';menu.setAttribute('aria-label','Apri menu Nexus');menu.innerHTML='<span aria-hidden="true">☰</span>';menu.onclick=()=>{const existing=document.querySelector('#profile-open,#open-more');if(existing){existing.click();return;}let dialog=document.getElementById('nx-site-menu');if(!dialog){dialog=document.createElement('dialog');dialog.id='nx-site-menu';const title=document.createElement('h2');title.textContent='Esplora Nexus';const close=document.createElement('button');close.textContent='Chiudi';close.onclick=()=>dialog.close();dialog.append(title,close);document.querySelectorAll('.global-nav a,.bottom-nav a,.profile-nav a').forEach(a=>dialog.append(a.cloneNode(true)));document.body.append(dialog);}dialog.showModal();};top.append(menu);
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
 scan();
})();
