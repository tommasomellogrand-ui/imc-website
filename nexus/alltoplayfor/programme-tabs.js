(()=>{'use strict';
 const nav=document.querySelector('.jumpnav'),content=document.getElementById('content');
 const datebar=document.querySelector('.datebar'),status=document.getElementById('status');
 const sections=[['coffee-time','Coffee Time','Presentazione di tutte le partite del giorno.'],['daytime','Daytime','Ore 14:00 · Mercato, trattative e approfondimenti dai club.'],['final-whistle','Final Whistle','Risultati, analisi e commenti del post-partita.']];
 nav.replaceChildren();datebar.after(nav);
 const date=document.getElementById('date'),prev=document.getElementById('prev'),next=document.getElementById('next'),today=document.getElementById('today');
 const currentDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 date.max=currentDay;
 const empty=document.createElement('p');empty.className='programme-empty';empty.textContent='Nessuna edizione di Final Whistle pubblicata per questa giornata.';
 function applyDate(update=false){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date.value)||date.value<date.min||date.value>date.max)date.value='2026-10-20';
  const archived=date.value==='2026-10-20';content.hidden=!archived;status.hidden=!archived;empty.hidden=archived;
  document.dispatchEvent(new Event('programme-date-change'));
  date.disabled=false;prev.disabled=date.value<=date.min;next.disabled=date.value>=date.max;today.disabled=date.value===currentDay;
  if(update){const url=new URL(location.href);url.searchParams.set('date',date.value);history.pushState(null,'',url);}
 }
 function step(days){const d=new Date(date.value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);date.value=d.toISOString().slice(0,10);applyDate(true)}
 prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));today.addEventListener('click',()=>{date.value=currentDay;applyDate(true)});date.addEventListener('change',()=>applyDate(true));
 document.addEventListener('postmatch-ready',()=>applyDate());
 const panels=new Map();
 for(const [id,title,description] of sections){
  const button=document.createElement('button');button.type='button';button.id='tab-'+id;button.role='tab';button.textContent=title;button.setAttribute('aria-controls','panel-'+id);nav.append(button);
  const panel=document.createElement('section');panel.id='panel-'+id;panel.role='tabpanel';panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
  if(id==='final-whistle'){content.before(panel);panel.append(status,content,empty)}else{
   panel.className='programme-empty';const note=document.createElement('p');note.className='programme-pending';note.textContent='Nessuna edizione pubblicata. Le notizie appariranno qui, dalla più recente.';panel.append(note);nav.after(panel);
  }
  const banner=document.createElement('img');banner.className='section-banner';banner.src='assets/'+id+'-v1.webp';banner.alt='All To Play For | '+title+' — '+description;banner.width=2048;banner.height=683;banner.decoding='async';panel.prepend(banner);panels.set(id,panel);
  button.addEventListener('click',()=>select(id,true));
 }
 function select(id,update){if(!panels.has(id))id='coffee-time';
  for(const [key,panel] of panels){const active=key===id;panel.hidden=!active;const b=document.getElementById('tab-'+key);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
  if(update){const url=new URL(location.href);url.searchParams.set('section',id);history.pushState(null,'',url);}
 }
 function fromUrl(){const url=new URL(location.href);date.value=url.searchParams.get('date')||'2026-10-20';applyDate();select(url.searchParams.get('section')||(url.hash.startsWith('#postmatch-')||url.searchParams.has('club')?'final-whistle':'coffee-time'),false)}
 nav.addEventListener('keydown',event=>{const buttons=[...nav.querySelectorAll('button')];let index=buttons.indexOf(document.activeElement);if(index<0)return;if(event.key==='ArrowRight')index=(index+1)%3;else if(event.key==='ArrowLeft')index=(index+2)%3;else if(event.key==='Home')index=0;else if(event.key==='End')index=2;else return;event.preventDefault();buttons[index].focus();buttons[index].click()});
 const css=document.createElement('link');css.rel='stylesheet';css.href='coffee.css?v=6';document.head.append(css);const script=document.createElement('script');script.src='coffee.js?v=6';document.body.append(script);
 window.addEventListener('popstate',fromUrl);window.addEventListener('hashchange',fromUrl);fromUrl();
})();
