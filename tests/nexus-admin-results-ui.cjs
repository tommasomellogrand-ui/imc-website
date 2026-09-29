const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let post=0,loggedIn=false;
 const record={sm_fixture_id:100,match_date:'2026-09-01',imc_season:1,home_name:'Home <script>',away_name:'Away',competition_key:'GW008|England|DOMESTIC|league|1',sm_country:'England',sm_division:1,home_id:10,away_id:20};
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.route('https://nexus.test/**',async route=>{
  const url=new URL(route.request().url());if(url.pathname.endsWith('api.php')){
   if(route.request().method()==='POST'){post++;const body=route.request().postDataJSON();if(body.action==='login'&&body.username==='admin'&&body.password==='admin'){loggedIn=true;return route.fulfill({json:{ok:true,csrf:'test'}});}}
   const action=url.searchParams.get('action');
   if(action==='session')return route.fulfill({status:loggedIn?200:401,json:loggedIn?{ok:true,csrf:'test'}:{ok:false,error:'Accedi come amministratore.'}});
   if(action==='check-meta')return route.fulfill({json:{ok:true,world:'GW008',today:'2026-09-29',seasons:[1],dates:[{date:'2026-09-01',schedule:1,results:1,report:0}]}});
   if(action==='results-check')return route.fulfill({json:{ok:true,world:'GW008',rows:[{fixture_id:100,home:record.home_name,away:record.away_name,competition:record.competition_key,country:'England',state:'missing_report',issues:['Match Report mancante'],schedule:[record],results:[record],report:[]}],summary:{fixtures:1,schedule:1,results:1,report:0,complete:0}}});
   throw Error('Unexpected API action '+action);
  }
  const file=url.pathname.split('/').pop();return route.fulfill({body:fs.readFileSync(path.join(__dirname,'../nexus/admin',file)),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://nexus.test/results-check.html?world=GW008');await page.locator('#login-username').fill('admin');await page.locator('#login-password').fill('admin');await page.locator('#login-submit').click();await page.locator('#run:not([disabled])').waitFor();await page.locator('#run').click();await page.locator('.check-row').waitFor();
 if(!(await page.locator('.check-state').textContent()).includes('Report mancante'))throw Error('Status missing');
 await page.locator('.check-row summary').click();if(await page.locator('.source-box').count()!==3)throw Error('Source chain missing');
 if(await page.locator('.check-row script').count())throw Error('Unsafe HTML');
 await page.locator('#state').selectOption('complete');if(await page.locator('.check-row').count())throw Error('State filter failed');
 await page.locator('#state').selectOption('all');
 if(!(await page.locator('.admin-nav a').first().getAttribute('href')).includes('world=GW008'))throw Error('World lost in navigation');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor)!=='rgb(255, 255, 255)')throw Error('Not white');
 if(!await page.evaluate(()=>getComputedStyle(document.documentElement).fontFamily.includes('Inter')))throw Error('Not Inter');
 if(post!==1)throw Error('Results Check issued a write request');
 if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:'/tmp/nexus-results-check-mobile.png',fullPage:true});
 await browser.close();console.log('PASS: Results Check mobile, source chain, filters, menu, white/Inter, XSS, read-only requests');
})();

