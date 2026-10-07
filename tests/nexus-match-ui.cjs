const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});try{
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let report=true;
const match={home_name:'TSV 1860 München',away_name:'Dynamo Dresden',home_imc_manager_name:'Marco Fioretti',away_imc_manager_name:'Matteo Sartori',home_score:2,away_score:1,home_logo_url:'/crest.svg',away_logo_url:'/crest.svg',competition_name:'Div 1',imc_season:2,match_date:'2026-10-04',stadium_name:'Grünwalder Stadion',attendance:17011,competition_key:'league'};
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.pathname==='/nexus/club-house/data.php')return route.fulfill({json:{ok:true,worlds:[{id:'GW001',name:'Road To History'}]}});if(u.pathname.endsWith('/core/context.php'))return route.fulfill({json:{ok:true,world:{game_world_name:'Test World'},current_season:2}});if(u.hostname!=='match.test')return route.abort();if(u.pathname==='/crest.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54"><rect width="54" height="54" fill="gold"/></svg>'});
if(u.pathname.endsWith('/match.php'))return route.fulfill({json:{ok:true,match,report_available:report,generated_at:new Date().toISOString(),team_stats:{scorers:[{player_name:'TORRES',team_side:'home',minute:43},{player_name:'KOVAČIĆ',team_side:'home',minute:69},{player_name:'MARMOUSH',team_side:'away',minute:55}],home:{},away:{}},players:[{player_name:'F. TORRES',team_side:'home',man_of_match:1,rating:8,starter:1,goal_minutes:[43]}]}});
if(u.pathname.endsWith('/matchday/data.php'))return route.fulfill({json:{league_fixture_ids:['123']}});
const path=u.pathname.slice(1);if(!fs.existsSync(path))return route.abort();return route.fulfill({body:fs.readFileSync(path),contentType:path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html'});});
for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});await page.goto('https://match.test/nexus/competitions/match.html?world=GW001&fixture=123');await page.waitForSelector('.mx-mvp');await page.waitForSelector('.mx-actions [data-club-addon]');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width);
assert.equal(await page.locator('.mx-goals-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2);
assert(await page.locator('.mx-banner').evaluate(el=>el.getBoundingClientRect().height<330),'Header too tall');
assert.equal(await page.locator('.mx-actions a').count(),2);assert.equal(await page.locator('.mx-goals-grid .mx-scorer').count(),3);
assert.match(await page.locator('.mx-mvp').textContent(),/F. TORRES/);assert.match(await page.locator('.mx-venue').textContent(),/17.011/);
await page.locator('[data-tab="home"]').click();assert(await page.locator('.mx-table').count()>0);await page.locator('[data-tab="stats"]').click();assert(await page.locator('.mx-stat').count()>0);
}
report=false;await page.goto('https://match.test/nexus/competitions/match.html?world=GW001&fixture=123');await page.waitForSelector('.mx-report-state.pending');assert.match(await page.locator('#match-view').textContent(),/non ancora disponibile/);assert.deepEqual(errors,[]);console.log('Match header and Overview: mobile, desktop, other tabs and missing report verified.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
