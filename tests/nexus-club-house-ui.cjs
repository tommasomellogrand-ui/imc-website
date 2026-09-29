const { chromium } = require(process.env.NEXUS_PLAYWRIGHT_PATH || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const people=[{manager_id:'MNG001',full_name:'Manager Uno',sm_manager_id:100},{manager_id:'MNG002',full_name:'Manager Due',sm_manager_id:200},{manager_id:'MNG003',full_name:'Senza ID',sm_manager_id:null}];
const zero={played:0,won:0,drawn:0,lost:0,gf:0,ga:0,penalty_won:0,penalty_lost:0,matched_by_id:0,matched_by_name:0};
function bundle(world){
 const active=['GW001','GW002'].includes(world),stats=active?{...zero,played:2,won:1,drawn:1,gf:3,ga:1,matched_by_id:2,matched_by_name:0}:zero;
 return {ok:true,world,managers:Object.fromEntries(people.map(m=>[m.manager_id,{stats:m.manager_id==='MNG001'?stats:zero,trophies:active?1:0,excluded:0}])),issues:[],matches:active?[{world,fixture_id:'10',date:'2026-09-01',season:1,team_id:20,team:'Club Uno',opponent_team:'Club Due',gf:2,ga:0,outcome:'V',penalty_for:null,penalty_against:null,opponent_id:'MNG002',opponent_name:'Manager Due'},{world,fixture_id:'11',date:'2026-09-02',season:1,team_id:20,team:'Club Uno',opponent_team:'Esterno',gf:1,ga:1,outcome:'P',penalty_for:null,penalty_against:null,opponent_id:null,opponent_name:null}]:[],trophies:active?[{world,season:1,date:'2026-09-03',competition:'Coppa Test',team:'Club Uno'}]:[]};
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];let fail=false;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='club.test'||u.pathname.startsWith('/site-assets/'))return route.abort();if(u.pathname.endsWith('data.php')){const w=u.searchParams.get('world');return route.fulfill({status:fail&&w==='GW010'?503:200,contentType:'application/json',body:JSON.stringify(w?bundle(w):{ok:true,managers:people,worlds:[]})});}const name=u.pathname.endsWith('/')?'index.html':path.basename(u.pathname);return route.fulfill({contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join('nexus/club-house',name))});});
  await page.goto('https://club.test/');await page.waitForFunction(()=>document.querySelector('#loading').textContent.startsWith('10/10'));
  assert.equal(await page.locator('.manager-card').count(),3);assert.equal(await page.locator('#tabs').isVisible(),false);
  await page.locator('#open-worlds').click();assert.equal(await page.locator('#world-links a').count(),10);assert.equal(await page.locator('#world-links a').first().getAttribute('href'),'../?world=GW001');await page.getByRole('button',{name:'Chiudi Game World'}).click();
  console.log('SCREENSHOT_DIRECTORY='+ (await page.screenshot()).toString('base64'));
  await page.locator('#search').fill('Uno');assert.equal(await page.locator('.manager-card').count(),1);await page.locator('.manager-card').click();
  await page.waitForFunction(()=>document.querySelector('#loading').textContent.startsWith('10/10'));
  assert.equal(await page.locator('.kpi strong').first().textContent(),'4');assert.equal(await page.locator('.match').count(),4);
  assert.match(await page.locator('#content').textContent(),/4 partite tramite ID Soccer Manager/);
  console.log('SCREENSHOT_PROFILE='+ (await page.screenshot()).toString('base64'));
  await page.getByRole('button',{name:'Carriera',exact:true}).click();assert.equal(await page.locator('#content section').count(),2);
  await page.getByRole('button',{name:'Head to Head',exact:true}).click();assert.equal(await page.locator('.rival').count(),1);assert.match(await page.locator('.rival summary').textContent(),/2 partite/);await page.locator('.rival summary').click();assert.equal(await page.locator('.rival .match').count(),2);
  await page.getByRole('button',{name:'Trophy Room',exact:true}).click();assert.equal(await page.locator('.trophy').count(),2);
  await page.locator('#world').selectOption('GW001');assert.equal(await page.locator('.trophy').count(),1);
  await page.getByRole('button',{name:'Panoramica',exact:true}).click();assert.equal(await page.locator('.kpi strong').first().textContent(),'2');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await page.locator('#world').selectOption('');fail=true;await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#loading').textContent.startsWith('9/10'));assert.match(await page.locator('#warning').textContent(),/GW010/);
  await page.setViewportSize({width:1440,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desktop overflow');assert.deepEqual(errors,[]);
  console.log('PASS: directory, all four tabs, global H2H, unknown opponents, GW filter, partial failures, mobile/desktop');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
