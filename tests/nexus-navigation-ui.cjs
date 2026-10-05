const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const css=['profiles','competitions','filter-chips','manager-scope','data-room','h2h','match','trophy-room'].map(n=>read('nexus/assets/'+n+'.css')).join('\n')+'\n'+read('nexus/club-house/club-house.css');
const button=(name,i,attr='aria-pressed')=>`<button class="${i===0?'active':''}" ${attr}="${i===0}">${name}</button>`;
const fixture=(cls,labels,attr)=>`<nav class="${cls}">${labels.map((n,i)=>button(n,i,attr)).join('')}</nav>`;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});try{
 for(const width of [320,390,430,768,1280]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>body{margin:0}main{width:100%;padding:16px;box-sizing:border-box}.tabs button.tab.active{background:#101238!important;color:white!important;box-shadow:inset 0 -4px gold!important}</style><style>${read('nexus/assets/navigation.css')}</style></head><body class="clubhouse-page" data-profile-family="managers"><main>
 ${fixture('manager-scope',['Club','Nations'])}
 <nav class="tabs" id="profile-tabs">${['OVERVIEW','MANAGER','ROSTER','STATS','DATA ROOM','H2H','TRANSFERS','TROPHY ROOM'].map((n,i)=>button(n,i).replace('class="','class="tab ')).join('')}</nav>
 <div class="dr"><div class="dr-filters"><b>Stagione</b>${fixture('dr-chips',['Tutte','S1','S2'])}</div>${fixture('dr-tabs',['Overview','Attacco','Difesa','Giocatori','Match Analysis'])}</div>
 ${fixture('group-tabs',['Domestic','International','World Cup'])}${fixture('selection-tabs',['Campionati','Coppe'])}${fixture('selection-tabs',['Div 1','Div 2','Div 3','Div 4'])}
 ${fixture('tabs detail-tabs',['Overview','Results','Table','Schedule','Stats'])}${fixture('stat-tabs',['Marcatori','Assist','Clean sheet','Cartellini'])}
 ${fixture('hh-detail-tabs',['Overview','Partite','Confronto','Giocatori'],'aria-selected')}${fixture('transfer-tabs',['Attivi','Ceduti'],'aria-selected')}${fixture('mx-tabs',['Overview','Formazioni','Statistiche','Cronaca'])}
 ${fixture('trophy-groups',['Domestic','International','World Cup'])}
 <nav id="scope-tabs">${['Global','Club','Nations'].map((n,i)=>button(n,i)).join('')}</nav><nav id="tabs">${['Panoramica','Carriera','Head to Head','Trophy Room'].map((n,i)=>button(n,i)).join('')}</nav><nav class="tabs" hidden><button>Hidden</button></nav>
 </main></body></html>`);
 await page.addScriptTag({content:read('nexus/assets/navigation.js')});
 await page.waitForFunction(()=>document.querySelector('#profile-tabs').dataset.nxNav==='tabs');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
 for(const nav of await page.locator('[data-nx-nav]:visible').all()){
  const geometry=await nav.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,items:[...el.children].map(b=>{const q=b.getBoundingClientRect(),s=getComputedStyle(b);return {y:q.y,h:q.height,w:q.width,scroll:b.scrollWidth,client:b.clientWidth,shadow:s.boxShadow};})};});
  assert(geometry.width<=width,'rail overflow');assert(geometry.items.every(b=>b.h>=44&&b.shadow==='none'&&b.scroll<=b.client+2),'button sizing '+width);
  assert(geometry.items.every(b=>Math.abs(b.y-geometry.items[0].y)<2),'wrapped rail '+width);
 }
 const paint=await page.locator('#profile-tabs button').first().evaluate(b=>({color:getComputedStyle(b).color,bg:getComputedStyle(b).backgroundColor,line:getComputedStyle(b,'::after').backgroundColor,text:b.textContent}));
 assert.equal(paint.bg,'rgba(0, 0, 0, 0)');assert.equal(paint.color,'rgb(16, 18, 56)');assert.equal(paint.line,'rgb(211, 172, 80)');assert.equal(paint.text,'Overview');
 assert.equal(await page.locator('[hidden].tabs').isVisible(),false);
 // Selection changes must reveal the entire label without moving the page vertically.
 await page.evaluate(()=>{const nav=document.getElementById('profile-tabs');[...nav.children].forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});nav.lastElementChild.classList.add('active');nav.lastElementChild.setAttribute('aria-pressed','true');});
 await page.waitForFunction(()=>{const n=document.getElementById('profile-tabs'),a=n.getBoundingClientRect(),b=n.lastElementChild.getBoundingClientRect();return b.left>=a.left-1&&b.right<=a.right+1});
 await page.locator('#profile-tabs button').last().focus();
 await page.locator('#profile-tabs button').last().press('Home');
 assert.equal(await page.locator('#profile-tabs button').first().evaluate(b=>b===document.activeElement),true);
 // Dynamically mounted Data Room / trophy / H2H controls get the same system.
 await page.evaluate(()=>{const nav=document.createElement('nav');nav.className='nexus-filter-chips';nav.innerHTML='<button aria-pressed="true">Tutte</button><button>S3</button>';document.querySelector('main').append(nav)});
 await page.waitForFunction(()=>document.querySelector('.nexus-filter-chips')?.dataset.nxNav==='filter');
 assert.equal(await page.locator('.nexus-filter-chips button').first().evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(251, 242, 218)');
 assert.deepEqual(errors,[]);console.log('LINEA_ORO_OK width='+width+' rails, active state, no overlap, dynamic filters, keyboard');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
