const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const base='https://www.italianmastersclub.it/minisite/GW001/';
  const {activeCompetitions}=await import('./competition-catalog.js');
  const browser=await chromium.launch({headless:true});
  const evidence=[];
  try {
    for(const width of [1440,390]){
      const page=await browser.newPage({viewport:{width,height:960}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(base+'competitions.html',{waitUntil:'domcontentloaded'});
      if(response.status()!==200)throw new Error('Page HTTP status');
      await page.locator('[data-competition-group]').first().waitFor({timeout:60000});
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('[data-hero] img').evaluate(img=>img.decode());
      const activity=await (await page.request.post(base+'api.php',{data:{game_world_id:'GW001',resource:'competition_activity'}})).json();
      const manifest=await (await page.request.get(base+'data/core-manifest.json')).json();
      const snapshot=await (await page.request.get(base+'data/'+manifest.file)).json();
      const expected=activeCompetitions(snapshot.competitions,activity.rows).map(g=>({group:g.group,orders:g.entries.map(e=>e.order),labels:g.entries.map(e=>e.label)}));
      const actual=await page.locator('[data-competition-group]').evaluateAll(groups=>groups.map(g=>({group:g.dataset.competitionGroup,orders:[...g.querySelectorAll('[data-competition-order]')].map(e=>Number(e.dataset.competitionOrder)),labels:[...g.querySelectorAll('article h3')].map(e=>e.textContent)})));
      if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('Visible catalogue mismatch');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      if(overflow||errors.length)throw new Error(JSON.stringify({width,overflow,errors}));
      const hero=await page.locator('[data-hero="competitions"] h2').innerText();
      if(hero!=='Un obiettivo.\nMolte sfide.')throw new Error('Hero changed');
      const dir=path.join(__dirname,'competition-evidence');fs.mkdirSync(dir,{recursive:true});
      await page.screenshot({path:path.join(dir,`competitions-${width}.png`),fullPage:true});
      evidence.push({width,url:page.url(),groups:actual,overflow,errors,hero});
      await page.close();
    }
    fs.writeFileSync(path.join(__dirname,'competition-evidence','live.json'),JSON.stringify(evidence,null,2));
    console.log(JSON.stringify({pass:true,evidence}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
