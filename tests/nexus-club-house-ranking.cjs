const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const people=[{manager_id:'MNG001',full_name:'Manager Uno'},{manager_id:'MNG002',full_name:'Manager Due'},{manager_id:'MNG003',full_name:'Manager Tre'}];
function bundle(world){const weight=['GW001','GW008'].includes(world)?3:['GW002','GW003'].includes(world)?2:1;return {ok:true,world,trophy_error:false,managers:Object.fromEntries(people.map((m,i)=>{const base=i===2?0.5:2.5;return [m.manager_id,{stats:{played:i===2?1:2,won:i===2?0:1,drawn:i===2?0:1,lost:i===2?1:0},ranking:{weight,match_base:base,trophy_base:i===2?0:75,match_points:base*weight,trophy_points:(i===2?0:75)*weight,total:base*weight+(i===2?0:75)*weight,unscored_trophies:0,awards:i===2?[]:[{competition:'Charity Shield',season:1,date:'2026-09-01',team:'Club Uno',base:75,points:75*weight}]}}];}))};}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];let fail=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='rank.test'||u.pathname.startsWith('/site-assets/'))return route.abort();if(u.pathname.endsWith('data.php')){const w=u.searchParams.get('world');return route.fulfill({status:fail&&w==='GW010'?503:200,contentType:'application/json',body:JSON.stringify(w?bundle(w):{ok:true,managers:people,worlds:[]})});}const name=u.pathname.endsWith('/')?'index.html':path.basename(u.pathname);return route.fulfill({contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join('nexus/club-house',name))});});
 await page.goto('https://rank.test/?view=ranking');await page.waitForFunction(()=>document.querySelector('#loading').textContent.startsWith('10/10'));
 assert.equal(await page.locator('#title').textContent(),'IMC Ranking');assert.equal(await page.locator('.ranking-row').count(),3);
 assert.deepEqual(await page.locator('.rank-position').allTextContents(),['1','1','3']);assert.equal((await page.locator('.rank-total').first().textContent()).replace(/\./g,''),'1240PUNTI');
 await page.locator('.ranking-row>summary').first().click();assert.equal(await page.locator('.ranking-row').first().locator('.rank-world').count(),10);
 assert.match(await page.locator('.rank-detail').first().textContent(),/75/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
 console.log('SCREENSHOT_RANKING='+(await page.screenshot()).toString('base64'));
 await page.locator('#search').fill('Tre');assert.equal(await page.locator('.rank-total').first().textContent(),'8PUNTI');assert.deepEqual(await page.locator('.rank-position').allTextContents(),['3']);await page.locator('#search').fill('');
 await page.locator('#world').selectOption('GW008');assert.equal(await page.locator('.rank-total').first().textContent(),'232,5PUNTI');
 await page.locator('#world').selectOption('GW004');assert.equal(await page.locator('.rank-total').first().textContent(),'77,5PUNTI');
 await page.locator('#world').selectOption('');fail=true;await page.locator('#retry').click();await page.waitForFunction(()=>document.querySelector('#loading').textContent.startsWith('9/10'));assert.match(await page.locator('#content').textContent(),/Classifica provvisoria/);
 await page.setViewportSize({width:1440,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desktop overflow');assert.deepEqual(errors,[]);
 console.log('PASS: ranking totals, shared positions, search preserves positions, world filters, breakdown, partial failures, responsive UI');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
