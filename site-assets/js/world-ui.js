(() => {
 const section = location.pathname.split('/')[1];
 if (!['','index.html','clubhouse','imc_campus','nexus','roadtohistory','halloffamers','kickoff','sensiblesocceracademy','subbuteosuperleague','worldleague','masterleagueworld','scudetto'].includes(section)) return;
 if (document.getElementById('imc-site-changes')) return;
 const script = document.createElement('script');
 script.id = 'imc-site-changes';
 script.src = '/site-assets/js/site-changes.js?v=push-only1';
 document.head.append(script);
})();
/* Dedicated worlds: Nexus navigation, with routes scoped to the current world. */
(()=>{'use strict';
const worlds={roadtohistory:['Road To History','players'],halloffamers:['Hall Of Famers','playercodex'],kickoff:['Kick Off','playercodex'],sensiblesocceracademy:['Sensible Soccer Academy','playercodex'],subbuteosuperleague:['Subbuteo Super League','playercodex'],worldleague:['World League','playercodex'],masterleagueworld:['Master League World','playercodex'],scudetto:['Scudetto','playercodex']};
const slug=location.pathname.split('/')[1],world=worlds[slug];if(!world)return;
const base='/'+slug+'/',page=location.pathname,home=page===base+'home/'||page===base+'home/index.html'||page===base||page===base+'index.html'||page===base+'index.php';
document.body.classList.add('imc-world-ui');
  const icon=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  const icons={home:icon('<path d="M3 10 12 3l9 7v11h-6v-7H9v7H3z"/>'),cup:icon('<path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v7M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/>'),club:icon('<path d="M3 10 12 3l9 7M5 9v12h14V9M10 21v-7h4v7M9 10h6"/>'),manager:icon('<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3z"/>'),more:icon('<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>')};


icons.shield=icon('<path d="m12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6z"/>');icons.transfer=icon('<path d="M4 7h16m-5-5 5 5-5 5M20 17H4m5-5-5 5 5 5"/>');icons.book=icon('<path d="M12 4v17M12 4C8 1 4 2 2 3v17c4-2 7-2 10 1 3-3 6-3 10-1V3c-2-1-6-2-10 1Z"/>');icons.star=icon('<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>');icons.tv=icon('<rect x="3" y="5" width="18" height="15" rx="1"/><path d="m10 9 5 3-5 3zM8 2l4 3 4-3"/>');
icons.calendar=icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3"/>');
icons.flag=icon('<path d="M5 21V3c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>');
const links=[['Competizioni','cup',base+'competitions/'],['Manager','manager',base+'managers/'],['Club','shield',base+'clubs/'],['Nations','flag',base+'nations/'],['Transfers','transfer',base+'transfers/'],['Player Codex','book',base+world[1]+'/'],['Trophy Room','star',base+'trophyroom/'],['Club House','club','/clubhouse/']];
if(slug==='roadtohistory')links.push(['All To Play For','tv',base+'alltoplayfor/']);
if(slug==='subbuteosuperleague')links.push(['Rising Stars League','star',base+'risingstarsleague/']);
function addWorldMenu(banner){
  const primary=[['Matchday','calendar',base+'matchday/'],...links.slice(0,7)];
  const grid=document.createElement('nav');
  grid.className='nx-world-shortcuts compact-world-menu';
  grid.setAttribute('aria-label','Sezioni '+world[0]);
  grid.innerHTML=primary.map(([label,id,url])=>'<a href="'+url+'">'+icons[id]+'<span>'+label+'</span></a>').join('');
  banner.after(grid);

  if(slug==='roadtohistory'){
   const feature=document.createElement('a');
   feature.className='top-magazine';feature.href=base+'alltoplayfor/';
   feature.innerHTML=icons.tv+'<span>All To Play For</span><span aria-hidden="true">↗</span>';
   banner.after(feature);
  }
}
const bannerSelector='main>.hero, .stadium-hero';
if(home&&!document.querySelector('.world-entry-static')){
 const banner=document.querySelector(bannerSelector);
 if(banner){
  addWorldMenu(banner);
  document.querySelector('.stadium-controls')?.remove();
  const old=document.querySelector('.world-sections');
  if(old)old.closest('section').hidden=true;
 }
}else if(!document.querySelector('.world-entry-static')){
 mountWorldHeader().catch(error=>console.error('World header:',error));
}
async function mountWorldHeader(){
 const response=await fetch(base+'index.html');
 if(!response.ok)throw Error(response.status);
 const layout=new DOMParser().parseFromString(await response.text(),'text/html');
 const banner=layout.querySelector(bannerSelector);
 if(!banner)throw Error('Missing home banner');
 // Isolate the home typography and banner rules from the section's own theme.
 const head=layout.head;
 head.querySelectorAll(':not(style):not(link[rel="stylesheet"]):not(meta[name="viewport"])').forEach(el=>el.remove());
 const target=layout.createElement('base');target.href=new URL(base,location.origin).href;target.target='_top';head.prepend(target);
 const style=layout.createElement('style');
 style.textContent='html, html body.imc-world-ui{margin:0!important;padding:0!important;min-height:0!important;height:auto!important;overflow:hidden}main{display:flow-root}';
 head.append(style);
 const main=layout.createElement('main');main.append(banner);
 layout.body.replaceChildren(main);layout.body.classList.add('imc-world-ui');
 addWorldMenu(banner);
 main.querySelectorAll('a[href^="#"]').forEach(a=>a.href=base+a.getAttribute('href'));
 const frame=document.createElement('iframe');
 frame.title='Banner e sezioni · '+world[0];frame.className='world-entry-block';
 frame.style.cssText='display:block;width:100%;border:0;height:1px;margin:0';
 frame.addEventListener('load',()=>{
  const content=frame.contentDocument?.querySelector('main');if(!content)return;
  const resize=()=>{frame.style.height=Math.ceil(content.getBoundingClientRect().height)+'px'};
  new ResizeObserver(resize).observe(content);resize();
 });
 frame.srcdoc='<!doctype html>'+layout.documentElement.outerHTML;
 const header=document.querySelector('header.top')||document.querySelector('body>header');
 if(header)header.after(frame);else document.body.prepend(frame);
 document.querySelector('.arc-board')?.remove();
}

const entry=document.querySelector('.world-entry-static');
if(entry){
 const card=document.createElement('div');
 card.className='imc-section-plate';
 if(slug==='roadtohistory') card.classList.add('rth-section-plate');
 const heading=document.querySelector('.page-heading h1, main h1:not(.world-entry-static h1), #matchday .section-head h2');
 const directory=page.endsWith('/')||page.endsWith('/index.html');
 const primarySection=page.slice(base.length).split('/')[0];
 const labels={home:'Home',matchday:'Matchday',competitions:'Competizioni',managers:'Manager',clubs:'Club',nations:'Nations',transfers:'Transfers',players:'Player Codex',playercodex:'Player Codex',trophyroom:'Trophy Room'};
 const isDirectory=directory&&page.slice(base.length).replace(/index\.html$/,'').split('/').filter(Boolean).length===1;
 const update=()=>{
  const name=isDirectory&&labels[primarySection]||heading?.childNodes[0]?.textContent?.trim()||document.title.split(/[|·]/)[0];
  card.textContent=name.replace(/\.$/,'').trim();
 };
 update();entry.after(card);
 document.body.classList.add('has-section-plate');
 if(heading){
  heading.classList.add('plate-original-title');
  if(heading.closest('.page-heading')&&isDirectory)heading.closest('.page-heading').classList.add('plate-original-heading');
  new MutationObserver(update).observe(heading,{childList:true,characterData:true,subtree:true});
 }
 if(isDirectory)document.body.classList.add('plate-directory');
}
if(!document.getElementById('nx-universal-nav')){
 const nav=document.createElement('nav');nav.id='nx-universal-nav';nav.setAttribute('aria-label','Navigazione '+world[0]);
 const active=home?'home':page.includes('/competitions/')?'cup':page.includes('/managers/')?'manager':'more';
 nav.innerHTML=[['Home','home',base+'home/'],['Competizioni','cup',base+'competitions/'],['Club House','club','/clubhouse/'],['Manager','manager',base+'managers/']].map(([label,id,url])=>'<a href="'+url+'"'+(id==='club'?' class="nx-clubhouse-center"':'')+(active===id?' aria-current="page"':'')+'><span class="nx-nav-icon">'+icons[id]+'</span><span>'+label+'</span></a>').join('')+'<button id="nx-universal-more" type="button" aria-haspopup="dialog" aria-controls="nx-universal-dialog" aria-expanded="false"><span class="nx-nav-icon">'+icons.more+'</span><span>Altro</span></button>';
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

;(()=>{if(document.querySelector('script[src*="/site-assets/names/display.js"]'))return;const s=document.createElement('script');s.src='/site-assets/names/display.js?v=1';document.head.append(s)})();

// Feed delle home dei mondi. Gli endpoint sono gli stessi delle rispettive sezioni.
(async function worldHomeFeed() {
 const root = document.getElementById('home-content');
 if (!root) return;
 const base = '/' + location.pathname.split('/')[1] + '/';
 const feed = document.createElement('div');
 feed.className = 'wrap imc-home-feed';
 const style=document.createElement('style');style.textContent='.imc-feed-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:20px 0}.imc-feed-tabs button{font:600 14px Inter,sans-serif;padding:14px 3px;background:white;color:#253347;border:1px solid #ccc;border-radius:3px}.imc-feed-tabs button[aria-selected="true"]{background:#253347;color:white;border-bottom:3px solid #b49248}.imc-home-feed section[hidden]{display:none!important}.imc-home-feed section{background:white;padding:12px 16px;border:1px solid #ddd;border-radius:4px;margin-bottom:24px}.imc-home-feed li{display:flex;align-items:center;gap:12px;min-height:80px}.imc-feed-images{display:flex;align-items:center;gap:6px;flex-shrink:0}.imc-feed-images img{width:36px;height:42px;object-fit:contain}.imc-feed-images img.portrait{width:48px;height:58px;object-fit:cover;object-position:top}.imc-feed-copy{min-width:0;overflow-wrap:anywhere}.imc-feed-copy div{font-size:13px;color:#566174;margin-top:6px}.imc-feed-more{font:600 14px Inter,sans-serif;padding:10px 18px;margin-top:12px;background:white;border:1px solid #bbb}';style.textContent+='.imc-home-feed{font-family:Inter,sans-serif!important;font-size:14px!important}.imc-home-feed .imc-upcoming-date{font:600 15px/1.4 Inter,sans-serif!important;padding:12px 14px;background:#f5f5f2;border:1px solid #ddd;margin:0 0 14px}.imc-home-feed .imc-upcoming-competition{display:block!important;min-height:0;border:1px solid #d8d8d4;border-radius:3px;overflow:hidden;margin:0 0 14px;padding:0}.imc-home-feed .imc-upcoming-heading{font:700 15px/1.4 Inter,sans-serif!important;letter-spacing:0!important;text-transform:none!important;margin:0!important;padding:12px 14px;background:#f1f2ef;color:#253347!important;border-bottom:1px solid #ddd}.imc-home-feed .imc-upcoming-match{display:grid;grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr);align-items:center;gap:8px;padding:14px 10px;min-height:110px;border-bottom:1px solid #eee}.imc-home-feed .imc-upcoming-match:last-child{border-bottom:0}.imc-upcoming-team{display:grid;justify-items:center;text-align:center;gap:5px;min-width:0}.imc-home-feed .imc-upcoming-team img{width:32px;height:32px;object-fit:contain}.imc-home-feed .imc-upcoming-team strong{font:600 14px/1.35 Inter,sans-serif!important;overflow-wrap:anywhere}.imc-home-feed .imc-upcoming-team small{font:400 12px/1.4 Inter,sans-serif!important;color:#596477}.imc-home-feed .imc-upcoming-time{font:600 12px/1.4 Inter,sans-serif!important;text-align:center}';document.head.append(style);
 const tabs=document.createElement('div');tabs.className='imc-feed-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Aggiornamenti del mondo');feed.append(tabs);
 root.prepend(feed);
 const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Rome'}).format(new Date());
 const clock = new Intl.DateTimeFormat('it-IT', {timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
 const formatDate = day => day.split('-').reverse().join('/');
 async function read(path) {
   const response = await fetch(base + path, {cache:'no-store'});
   if (!response.ok) throw Error('HTTP ' + response.status);
   const data = await response.json();
   if (!data.ok) throw Error('Dati non disponibili');
   return data;
 }
 async function fixtures() {
   const path = 'matchday/data.php?mode=schedule';
   let data = await read(path);
   const dates = data.dates;
   for (const day of dates) {
     if (day < today) continue;
     if (day !== data.date) data = await read(path + '&date=' + encodeURIComponent(day));
     const rows = data.rows.filter(r => day > today || !r.match_time || r.match_time.slice(0,5) >= clock);
     if (rows.length) return rows.sort((a,b)=>String(a.match_time || '').localeCompare(String(b.match_time || ''))).map(r=>({
       match:r,competition:r.competition_key,competitionName:r.competition_name,images:[r.home_logo_url,r.away_logo_url],day, title:r.home_name + ' – ' + r.away_name,
       detail:[r.match_time && r.match_time.slice(0,5),r.competition_name].filter(Boolean).join(' · ')
     }));
   }
   return [];
 }
 async function awards() {
   const data = await read('trophyroom/data.php');
   return data.rows.filter(r=>r.winner_name && r.won_date && r.won_date <= today).map(r=>({
     images:[r.winner_logo_url],portrait:r.winner_manager_photo_url,day:r.won_date,title:r.winner_name,detail:[r.nexus_view || r.trophy_type,r.winner_manager_name].filter(Boolean).join(' · ')
   }));
 }
 async function changes() {
   const response=await fetch('/site-assets/world-engine/events.php?world='+encodeURIComponent(location.pathname.split('/')[1]),{cache:'no-store'});
   if(!response.ok)throw Error('events');
   const data=await response.json();if(!data.ok)throw Error('events');return data.events;
 }
 async function section(label,source,empty,limit) {
   const box = document.createElement('section');
   const heading = document.createElement('h2');
   heading.textContent = label;
   const index=tabs.children.length;
   const tab=document.createElement('button');tab.type='button';tab.id='imc-feed-tab-'+index;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(index===0));tab.tabIndex=index===0?0:-1;tab.textContent=label;
   box.id='imc-feed-panel-'+index;box.setAttribute('role','tabpanel');box.setAttribute('aria-labelledby',tab.id);tab.setAttribute('aria-controls',box.id);box.hidden=index!==0;
   tab.onclick=()=>{for(const button of tabs.children){const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;document.getElementById(button.getAttribute('aria-controls')).hidden=!active;}};
   tab.onkeydown=e=>{const buttons=Array.from(tabs.children);let next;if(e.key==='ArrowRight')next=(index+1)%buttons.length;if(e.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();buttons[next].click();buttons[next].focus();}};
   tabs.append(tab);feed.append(box);
   const status = document.createElement('p');
   status.textContent = 'Caricamento…';
   box.append(status);
   try {
     let events = await source();
     if (limit) events = events.sort((a,b)=>b.day.localeCompare(a.day)).slice(0,limit);
     if (!events.length) { status.textContent = empty; return; }
     const list = document.createElement('ul');
     list.style.cssText = 'list-style:none;padding:0;margin:0 0 1.5rem';
     for (const event of events) {
       const row = document.createElement('li');
       row.style.cssText = 'padding:.7rem 0;border-bottom:1px solid #ddd';
       const images=document.createElement('span');images.className='imc-feed-images';
       for(const [src,portrait] of [[event.portrait,true],...(event.images||[]).map(src=>[src,false])]){if(!src)continue;let url;try{url=new URL(src,location.origin)}catch{continue}if(url.protocol!=='https:')continue;const img=document.createElement('img');img.src=url.href;img.alt='';img.loading='lazy';if(portrait)img.className='portrait';img.onerror=()=>img.remove();images.append(img);}
       const copy=document.createElement('div');copy.className='imc-feed-copy';row.append(images,copy);
       const title = document.createElement('strong');
       title.textContent = event.title;
       const detail = document.createElement('div');
       detail.textContent = (source===fixtures ? event.detail.split(' · ')[0] : event.detail);
       copy.append(title,detail);
       if(source===fixtures){
         const match=event.match;
         row.replaceChildren();row.className='imc-upcoming-match';row.removeAttribute('style');
         for(const side of ['home','away']){
           const team=document.createElement('div');team.className='imc-upcoming-team';
           const logo=document.createElement('img');logo.alt='';logo.loading='lazy';
           if(match[side+'_logo_url']){logo.src=match[side+'_logo_url'];logo.onerror=()=>logo.remove();team.append(logo);}
           const name=document.createElement('strong');name.textContent=match[side+'_name'];
           const manager=document.createElement('small');manager.textContent=match[side+'_imc_manager_name']||'—';
           team.append(name,manager);row.append(team);
           if(side==='home'){const time=document.createElement('span');time.className='imc-upcoming-time';time.textContent=match.match_time?match.match_time.slice(0,5):'–';row.append(time);}
         }
         let group=Array.from(list.children).find(item=>item.dataset.competition===event.competition);
         if(!group){group=document.createElement('li');group.dataset.competition=event.competition;group.className='imc-upcoming-competition';const title=document.createElement('h3');title.textContent=event.competitionName;title.className='imc-upcoming-heading';const games=document.createElement('ul');games.style.cssText='list-style:none;padding:0;margin:0';group.append(title,games);list.append(group);}
         group.querySelector('ul').append(row);
       }else{
         let group=Array.from(list.children).find(item=>item.dataset.day===event.day);
         if(!group){group=document.createElement('li');group.dataset.day=event.day;group.style.cssText='display:block;min-height:0;padding:0;border:0';const date=document.createElement('div');date.className='imc-upcoming-date';date.textContent=formatDate(event.day);const entries=document.createElement('ul');entries.style.cssText='list-style:none;padding:0;margin:0 0 16px';group.append(date,entries);list.append(group);}
         group.querySelector('ul').append(row);
       }
     }
     let visible=events.length;
     const more=document.createElement('button');more.type='button';more.className='imc-feed-more';more.textContent='Carica altri';
     const paginate=()=>{Array.from(list.children).forEach((row,index)=>{row.hidden=index>=visible;row.style.display=index>=visible?'none':'';});more.hidden=visible>=events.length;};
     more.onclick=()=>{visible+=5;paginate();};paginate();status.replaceWith(list);box.append(more);if(source===fixtures){const date=document.createElement('div');date.className='imc-upcoming-date';date.textContent=formatDate(events[0].day);box.prepend(date);}
   } catch {
     status.textContent = 'Dati temporaneamente non disponibili.';
   }
 }
 await Promise.all([
   section('Prossime partite',fixtures,'Nessuna partita in programma.'),
   section('Trofei',awards,'Nessun trofeo assegnato.',10),
   section('Allenatori',changes,'Nessun cambio registrato.',10)
 ]);
})();
