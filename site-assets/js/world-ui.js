/* Dedicated worlds: Nexus navigation, with routes scoped to the current world. */
(()=>{'use strict';
const worlds={roadtohistory:['Road To History','players'],halloffamers:['Hall Of Famers','playercodex'],kickoff:['Kick Off','playercodex'],sensiblesocceracademy:['Sensible Soccer Academy','playercodex'],subbuteosuperleague:['Subbuteo Super League','playercodex'],worldleague:['World League','playercodex'],masterleagueworld:['Master League World','playercodex'],scudetto:['Scudetto','playercodex']};
const slug=location.pathname.split('/')[1],world=worlds[slug];if(!world)return;
const base='/'+slug+'/',page=location.pathname,home=page===base||page===base+'index.html'||page===base+'index.php';
document.body.classList.add('imc-world-ui');
  const icon=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  const icons={home:icon('<path d="M3 10 12 3l9 7v11h-6v-7H9v7H3z"/>'),cup:icon('<path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v7M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/>'),club:icon('<path d="M3 10 12 3l9 7M5 9v12h14V9M10 21v-7h4v7M9 10h6"/>'),manager:icon('<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3z"/>'),more:icon('<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>')};


icons.shield=icon('<path d="m12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6z"/>');icons.transfer=icon('<path d="M4 7h16m-5-5 5 5-5 5M20 17H4m5-5-5 5 5 5"/>');icons.book=icon('<path d="M12 4v17M12 4C8 1 4 2 2 3v17c4-2 7-2 10 1 3-3 6-3 10-1V3c-2-1-6-2-10 1Z"/>');icons.star=icon('<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>');icons.tv=icon('<rect x="3" y="5" width="18" height="15" rx="1"/><path d="m10 9 5 3-5 3zM8 2l4 3 4-3"/>');
icons.calendar=icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3"/>');
icons.flag=icon('<path d="M5 21V3c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>');
const links=[['Competizioni','cup',base+'competitions/'],['Manager','manager',base+'managers/'],['Club','shield',base+'clubs/'],['Nations','flag',base+'nations/'],['Transfers','transfer',base+'transfers/'],['Player Codex','book',base+world[1]+'/'],['Trophy Room','star',base+'trophyroom/'],['Club House','club','/clubhouse/']];
if(slug==='roadtohistory')links.push(['All To Play For','tv',base+'alltoplayfor/']);
if(slug==='subbuteosuperleague')links.push(['Rising Stars League','star',base+'risingstarsleague/']);
if(home){
 const banner=document.querySelector('main>.hero, .stadium-hero');
 if(banner){
  const primary=[['Matchday','calendar','#matchday'],...links.slice(0,7)];
  const grid=document.createElement('nav');
  grid.className='nx-world-shortcuts compact-world-menu';
  grid.setAttribute('aria-label','Sezioni '+world[0]);
  grid.innerHTML=primary.map(([label,id,url])=>'<a href="'+url+'">'+icons[id]+'<span>'+label+'</span></a>').join('');
  banner.after(grid);
  document.querySelector('.stadium-controls')?.remove();
  const old=document.querySelector('.world-sections');
  if(old)old.closest('section').hidden=true;
  if(slug==='roadtohistory'){
   const feature=document.createElement('a');
   feature.className='top-magazine';feature.href=base+'alltoplayfor/';
   feature.innerHTML=icons.tv+'<span>All To Play For</span><span aria-hidden="true">↗</span>';
   banner.after(feature);
  }
 }
}
if(!document.getElementById('nx-universal-nav')){
 const nav=document.createElement('nav');nav.id='nx-universal-nav';nav.setAttribute('aria-label','Navigazione '+world[0]);
 const active=home?'home':page.includes('/competitions/')?'cup':page.includes('/managers/')?'manager':'more';
 nav.innerHTML=[['Home','home',base],['Competizioni','cup',base+'competitions/'],['Club House','club','/clubhouse/'],['Manager','manager',base+'managers/']].map(([label,id,url])=>'<a href="'+url+'"'+(id==='club'?' class="nx-clubhouse-center"':'')+(active===id?' aria-current="page"':'')+'><span class="nx-nav-icon">'+icons[id]+'</span><span>'+label+'</span></a>').join('')+'<button id="nx-universal-more" type="button" aria-haspopup="dialog" aria-controls="nx-universal-dialog" aria-expanded="false"><span class="nx-nav-icon">'+icons.more+'</span><span>Altro</span></button>';
 const dialog=document.createElement('dialog');dialog.id='nx-universal-dialog';dialog.setAttribute('aria-labelledby','nx-world-dialog-title');dialog.innerHTML='<div><h2 id="nx-world-dialog-title">'+world[0]+'</h2><button type="button" aria-label="Chiudi menu">×</button></div><section>'+links.map(([label,id,url])=>'<a href="'+url+'">'+label+'</a>').join('')+'</section>';
 if(slug==='roadtohistory')for(const [path,label]of [['rth-champions-league','Champions League'],['rth-europa-league','Europa League'],['rth-conference-league','Conference League'],['rth-club-world-cup','Club World Cup']]){const a=document.createElement('a');a.href=base+path+'/';a.textContent=label;dialog.querySelector('section').append(a);}
 document.body.append(nav,dialog);const more=nav.querySelector('button');more.onclick=()=>{dialog.showModal();more.setAttribute('aria-expanded','true')};dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{more.setAttribute('aria-expanded','false');more.focus()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
}
})();

(async function showManagerPortraits() {
  const cards = document.querySelector('#cards');
  if (!cards || !/\/managers\/(?:index\.html)?$/.test(location.pathname)) return;
  document.body.classList.add('manager-album');
  const heading = document.querySelector('.page-heading h1');
  const count = document.createElement('span');
  const summary = document.querySelector('#summary');
  heading.append(' ', count);
  const updateCount = () => {
    const match = summary.textContent.match(/^([0-9]+) manager/);
    count.textContent = match ? match[1] : '';
    summary.hidden = Boolean(match);
  };
  new MutationObserver(updateCount).observe(summary, {childList:true, subtree:true, characterData:true});
  updateCount();
  document.querySelector('[data-mode="active"]').textContent = 'Attivi';
  document.querySelector('#search').placeholder = 'Cerca manager o squadra';
  const response = await fetch('/clubhouse/data.php', {cache:'no-store'});
  if (!response.ok) return;
  const directory = await response.json();
  const portraits = new Map((directory.managers || []).map(manager => [
    manager.manager_id, manager.face_image_url || manager.bust_image_url
  ]));
  function addPortrait(card) {
    const id = new URL(card.href).searchParams.get('manager');
    const src = portraits.get(id);
    if (!src || card.querySelector('.imc-manager-portrait')) return;
    const url = new URL(src, location.origin);
    if (url.protocol !== 'https:') return;
    const photo = document.createElement('img');
    photo.className = 'imc-manager-portrait';
    photo.alt = '';
    photo.loading = 'lazy';
    photo.width = 76;
    photo.height = 76;
    photo.addEventListener('error', () => photo.remove(), {once:true});
    photo.src = url.href;
    card.prepend(photo);
  }
  function refresh() { cards.querySelectorAll('a.manager-card').forEach(addPortrait); }
  new MutationObserver(refresh).observe(cards, {childList:true});
  refresh();
})().catch(() => {});
