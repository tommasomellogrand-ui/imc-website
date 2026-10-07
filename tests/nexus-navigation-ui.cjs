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
 <div class="dr"><header><small>ANALISI E RENDIMENTO</small><h2>Data Room</h2><p>Solo Match Report</p></header><div class="dr-filters"><div><b>Stagione</b>${fixture('dr-chips',['Tutte','S1','S2'])}</div><div><b>Competizione</b>${fixture('dr-chips',['Tutte','Div 4','National Cup'])}</div></div>${fixture('dr-tabs',['Overview','Attacco','Difesa','Giocatori','Match Analysis'])}<p class="dr-status">Report disponibili</p><div class="dr-content">Statistiche</div></div>
 ${fixture('group-tabs',['Domestic','International','World Cup'])}${fixture('selection-tabs',['Campionati','Coppe'])}${fixture('selection-tabs',['Div 1','Div 2','Div 3','Div 4'])}
 ${fixture('tabs detail-tabs',['Overview','Results','Table','Schedule','Stats'])}${fixture('stat-tabs',['Marcatori','Assist','Clean sheet','Cartellini'])}
 ${fixture('hh-detail-tabs',['Overview','Partite','Confronto','Giocatori'],'aria-selected')}${fixture('transfer-tabs',['Attivi','Ceduti'],'aria-selected')}${fixture('mx-tabs',['Overview','Formazioni','Statistiche','Cronaca'])}
 ${fixture('trophy-groups',['Domestic','International','World Cup'])}
 ${fixture('md-tabs',['Pre Match','Live','Post Match'])}${fixture('article-tabs',['Overview','Interviste','Analisi'])}${fixture('deep-tabs',['Contesto','Forma','Confronto'])}${fixture('division-tabs',['Platinum','Gold','Silver','Bronze'])}
 <nav id="scope-tabs">${['Global','Club','Nations'].map((n,i)=>button(n,i)).join('')}</nav><nav id="tabs">${['Panoramica','Carriera','Head to Head','Trophy Room'].map((n,i)=>button(n,i)).join('')}</nav><nav class="tabs" hidden><button>Hidden</button></nav>
 </main></body></html>`);
 await page.evaluate(()=>{const h=document.createElement('header');h.className='profile-banner';h.innerHTML='<div class="profile-wrap"><div class="profile-top"><a class="nexus-brand">NEXUS</a><select><option>GW001</option></select></div><section class="profile-hero"><div id="image"></div><div><small>CLUB</small><h1>Hertha Berlino</h1><p>GW001</p></div></section></div>';document.body.prepend(h);});
 await page.addScriptTag({content:read('nexus/assets/navigation.js')});
 await page.waitForFunction(()=>document.querySelector('#profile-tabs').dataset.nxNav==='tabs');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
 assert.equal(await page.locator('.nx-topbar').evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(16, 18, 56)');
 assert.equal(await page.locator('.nx-hero').evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(245, 246, 250)');
 assert.equal(await page.locator('.nx-menu').count(),0);
 assert.equal(await page.locator('#nx-universal-nav>a,#nx-universal-nav>button').count(),5);
 assert.equal(await page.locator('#nx-universal-nav>a').nth(2).textContent(),'Club House');
 assert.equal(await page.locator('#nx-universal-nav>a').nth(2).getAttribute('href'),'/nexus/club-house/');
 assert.equal(await page.locator('#nx-universal-header img').getAttribute('alt'),'IMC');
 await page.locator('#nx-universal-more').click();assert(await page.locator('#nx-universal-dialog').isVisible());await page.locator('#nx-universal-dialog button').click();
 assert.equal(await page.locator('.dr-tabs').isVisible(),false);await page.locator('.nx-report summary').click();assert(await page.locator('.dr-tabs').isVisible());
 const filters=await page.locator('.dr-filters>div').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));assert(Math.abs(filters[0]-filters[1])<2,'filters must remain side by side');
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
 assert.equal(await page.locator('.nexus-filter-chips button').first().evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(248, 237, 207)');
 // Competition layout uses existing controls without replacing their event handlers.
 await page.evaluate(()=>{const m=document.querySelector('main');m.innerHTML='<div class="back-row"><a>Nexus</a></div><div id="meta">Gold 558 · Stagione 1</div><div class="filters"><div class="filter"><select id="season-select"><option>1</option></select></div><div id="country-filter"><select id="country-select" hidden><option value="ENG">ENG</option></select><div class="nexus-filter-chips"><button data-value="ENG" aria-pressed="true" title="Inghilterra"><img alt="" />Inghilterra</button></div></div></div><nav id="group-tabs" class="group-tabs"><button aria-pressed="true">Domestic</button><button>International</button><button>World Cup</button></nav><nav id="family-tabs" class="selection-tabs"><button aria-pressed="true">Campionati</button><button>Coppe</button></nav><nav id="competition-tabs" class="selection-tabs">'+[1,2,3,4,5].map(i=>'<button data-competition="'+i+'" aria-pressed="'+(i===1)+'">Div '+i+'</button>').join('')+'</nav><div id="competition-tools"><h2 id="selected-name">England Div 1</h2></div><nav id="competition-nav" class="tabs"><button>Overview</button><button>Results</button><button>Table</button><button>Schedule</button><button>Stats</button></nav>';document.querySelector('[data-competition="2"]').onclick=()=>document.getElementById('selected-name').textContent='England Div 2';});
 await page.waitForSelector('.nx-competition-card');await page.waitForFunction(()=>document.getElementById('selected-name').textContent==='ENG · Divisione 1');
 assert.equal(await page.locator('#competition-tabs button').first().textContent(),'D1');
 assert.equal(await page.locator('.back-row #season-select').count(),1);
 assert.equal(await page.locator('#country-filter button').textContent(),'ENG');
 const familyWidths=await page.locator('#family-tabs button').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().width));assert(Math.abs(familyWidths[0]-familyWidths[1])<2,'equal family columns');
 assert(await page.locator('#family-tabs').evaluate(el=>Math.abs(el.clientWidth-el.parentElement.clientWidth+parseFloat(getComputedStyle(el.parentElement).paddingLeft)+parseFloat(getComputedStyle(el.parentElement).paddingRight))<4),'full width family');
 assert.equal(await page.locator('.nx-competition-meta').textContent(),'ENG · Gold 558 · Stagione 1');
 await page.locator('[data-competition="2"]').click();await page.waitForFunction(()=>document.getElementById('selected-name').textContent==='ENG · Divisione 2');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'competition overflow '+width);
 assert.deepEqual(errors,[]);console.log('LINEA_ORO_OK width='+width+' competition card, Gold, controls, rails, keyboard');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
