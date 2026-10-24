const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:393,height:852}});let posted;
 await page.route('https://test.local/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith('api.php')){
   const action=url.searchParams.get('action');let data={ok:true,csrf:'test'};
   if(action==='seasons'||action==='season-save'){
    data={ok:true,world:'GW003',rows:[{imc_season:'1',imc_season_start_date:'2026-05-25',imc_season_end_date:'2026-10-24',version:'v1',synced:true}]};
    if(action==='season-save')posted=route.request().postDataJSON();
   }
   await route.fulfill({json:data});return;
  }
  const name=url.pathname.split('/').pop();await route.fulfill({body:fs.readFileSync('nexus/admin/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://test.local/seasons.html?world=GW003');
 await page.getByText('IMC Season 1',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Salva date'}).click();
 await page.getByText(/date salvate nel Core/).waitFor();
 if(posted.world!=='GW003'||posted.end_date!=='2026-10-24'||posted.version!=='v1')throw Error('Wrong save payload');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.getByRole('button',{name:'Nuova stagione'}).click();
 if(await page.locator('input[type=number]').inputValue()!=='2')throw Error('Next season');
 await page.getByRole('button',{name:'Annulla'}).click();
 await page.getByRole('button',{name:'Esci',exact:true}).click();
 await page.getByRole('heading',{name:'Accesso amministratore'}).waitFor();
 console.log('PASS mobile season display, save, next season, logout');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
