const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let fail=false;
 const worlds=Array.from({length:10},(_,i)=>({id:'GW'+String(i+1).padStart(3,'0'),name:i===0?'Road To History':'Gold '+(558+i)}));
 const match={sm_fixture_id:123,competition_key:'GW001|DOMESTIC|league',sm_action:'league',competition_round:'3',competition_group:'DOMESTIC',nexus_view:'Divisione 1',match_date:'2026-10-04',home_name:'Hertha Berlino',away_name:'Celtic',home_score:2,away_score:1,home_imc_manager_id:'MNG001',home_imc_manager_name:'Tommaso Mello',away_imc_manager_id:'MNG002',away_imc_manager_name:'Matteo Sartori'};
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='gloss.test')return route.abort();
  if(u.pathname.endsWith('/club-house/data.php'))return route.fulfill({status:fail?503:200,json:{ok:!fail,worlds,managers:[]}});
  if(u.pathname.endsWith('/core/context.php'))return route.fulfill({json:{ok:true,world:{game_world_name:'Road To History'},current_season:2}});
  if(u.pathname.endsWith('/home/data.php'))return route.fulfill({json:{ok:true,results:[match],schedule:[{...match,sm_fixture_id:124,home_score:null,away_score:null,match_date:'2026-10-08'}],errors:[]}});
  if(u.pathname.endsWith('.php'))return route.fulfill({json:{ok:true,rows:[]}});
  const file=path.join(process.cwd(),u.pathname.endsWith('/')?u.pathname.slice(1)+'index.html':u.pathname.slice(1));
  if(!fs.existsSync(file))return route.abort();const ext=path.extname(file);return route.fulfill({contentType:ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.png'?'image/png':'text/html',body:fs.readFileSync(file)});
 });
 for(const width of [320,390,402,430,768,1440]){
  await page.setViewportSize({width,height:874});await page.goto('https://gloss.test/nexus/club-house/home.html');await page.waitForSelector('.wg-world');assert.equal(await page.locator('.wg-world').count(),10);assert.match(await page.locator('.wg-world').first().textContent(),/Road To History/);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Portal overflow '+width);assert.equal(await page.locator('#nx-universal-nav a').nth(2).getAttribute('href'),'/nexus/club-house/');
  if(width===402)console.log('SCREENSHOT_PORTAL='+(await page.screenshot()).toString('base64'));
  await page.locator('.wg-world').first().click();await page.waitForSelector('.matchday-card');assert.equal(new URL(page.url()).searchParams.get('world'),'GW001');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'World overflow '+width);assert.match(await page.locator('.matchday-card').first().textContent(),/Mello/);
  await page.locator('#matchday-schedule').click();assert.equal(await page.locator('#matchday-schedule').getAttribute('aria-selected'),'true');assert(await page.locator('.matchday-card').count()>0);await page.locator('#matchday-results').click();
  assert.match(await page.locator('.matchday-report').first().getAttribute('href'),/fixture=123/);
  if(width===402){await page.locator('#matchday-title').scrollIntoViewIfNeeded();console.log('SCREENSHOT_WORLD='+(await page.screenshot()).toString('base64'));}
 }
 fail=true;await page.goto('https://gloss.test/nexus/club-house/home.html');await page.getByRole('button',{name:'Riprova',exact:true}).waitFor();fail=false;await page.getByRole('button',{name:'Riprova',exact:true}).click();await page.waitForSelector('.wg-world');assert.equal(await page.locator('.wg-world').count(),10);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.wg-world').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.deepEqual(errors,[]);
 console.log('PASS: White Gloss portal, 10 GW links, Matchday tabs/reports, retry, reduced motion, no overflow at 320/390/402/430/768/1440');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
