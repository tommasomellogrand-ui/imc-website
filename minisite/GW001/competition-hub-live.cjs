const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const base='https://www.italianmastersclub.it/minisite/GW001/';
  const browser=await chromium.launch({headless:true});
  const evidence=[];
  const dir=path.join(__dirname,'competition-evidence');fs.mkdirSync(dir,{recursive:true});
  try{
    for(const width of [1440,390]){
      const page=await browser.newPage({viewport:{width,height:960}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'competitions.html');
      await page.locator('[data-competition-group]').first().waitFor({timeout:60000});
      const links=await page.locator('[data-competition-id]').evaluateAll(cards=>cards.map(c=>({id:c.dataset.competitionId,label:c.querySelector('h3').textContent,hrefs:[...c.querySelectorAll('a')].map(a=>a.getAttribute('href'))})));
      assert.equal(links.length,11);
      const {readFixtures}=await import('./data-client.js');
      const fetcher=async(_url,init)=>{
        const r=await page.request.post(base+'api.php',{data:JSON.parse(init.body)});
        return {ok:r.ok(),status:r.status(),json:()=>r.json()};
      };
      const results=(await readFixtures('GW001','results',{fetcher})).rows;
      const schedules=(await readFixtures('GW001','schedule',{fetcher})).rows;
      const activity=await (await page.request.post(base+'api.php',{data:{game_world_id:'GW001',resource:'competition_activity'}})).json();
      const manifest=await (await page.request.get(base+'data/core-manifest.json')).json();
      const snapshot=await (await page.request.get(base+'data/'+manifest.file)).json();
      const {competitionHub}=await import('./competition-hub.js');
      for(const item of links){
        assert.deepEqual(item.hrefs,['competition.html?id='+item.id]);
        // Follow the actual card link for every competition, on both viewports.
        await page.goto(base+'competitions.html');
        await page.locator(`[data-competition-id="${item.id}"] a`).click({timeout:60000});
        await page.locator('[data-competition-hub]').waitFor({timeout:60000});
        assert.equal(new URL(page.url()).searchParams.get('id'),item.id);
        assert.equal(await page.locator('main h1').textContent(),item.label);
        const expected=competitionHub(snapshot.competitions,activity.rows,{results,schedule:schedules},item.id);
        const sections=await page.locator('[data-hub-link]').evaluateAll(a=>a.map(n=>n.dataset.hubLink));
        assert.deepEqual(sections,expected.sections.map(([id])=>id));
        // Independent current-format expectations: League, knockout and actual group stages.
        const league=['73','74','75','76'].includes(item.id);
        const groups=['4','5','7'].includes(item.id);
        assert.equal(sections.includes('standings'),league||groups);
        assert.equal(await page.locator('#hub-results [data-fixture-id]').count(),expected.results.length);
        const fixtureIds=await page.locator('#hub-results [data-fixture-id]').evaluateAll(a=>a.map(n=>n.dataset.fixtureId).sort());
        assert.deepEqual(fixtureIds,expected.results.map(r=>String(r.sm_fixture_id)).sort());
        const keys=await page.locator('[data-hub-fixture-key],[data-hub-schedule-key]').evaluateAll(a=>a.map(n=>n.dataset.hubFixtureKey||n.dataset.hubScheduleKey));
        assert.ok(keys.every(k=>expected.keys.includes(k)));
        for(const section of sections){
          await page.locator(`[data-hub-link="${section}"]`).click();
          await page.locator(`[data-hub-panel="${section}"]`).waitFor({state:'visible',timeout:10000});
          assert.equal(await page.locator('[data-hub-panel]:visible').count(),1);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
          if(section==='standings'){
            assert.equal(await page.locator('#hub-standings h2').textContent(),groups?'Classifica Gironi':'Classifica');
            assert.equal(await page.locator('#hub-standings table').count(),0);
          }
          if(section==='schedule')assert.equal(await page.locator('#hub-schedule .fixture-row').count(),expected.schedule.length);
        }
        if(item.id==='1')assert.equal(await page.locator('[data-winner]').getAttribute('data-winner'),'Borussia Dortmund');
        else assert.equal(await page.locator('[data-winner]').count(),0);
        assert.deepEqual(errors,[]);
        if(['74','1','4','327'].includes(item.id)){
          await page.screenshot({path:path.join(dir,`hub-${item.id}-${width}-trophy.png`)});
          const section=groups?'standings':'results';
          await page.locator(`[data-hub-link="${section}"]`).click();
          await page.locator(`[data-hub-panel="${section}"]`).waitFor({state:'visible',timeout:10000});
          await page.screenshot({path:path.join(dir,`hub-${item.id}-${width}.png`)});
        }
        evidence.push({width,id:item.id,url:base+item.hrefs[0],sections,results:expected.results.length,schedule:expected.schedule.length,ranking:expected.ranking,winner:expected.winner?.name??null,pass:true});
      }
      await page.goto(base+'competition.html?id=missing');
      await page.getByRole('heading',{name:'Competizione non disponibile.'}).waitFor({timeout:60000});
      assert.equal(await page.locator('[data-fixture-id]').count(),0);
      await page.close();
    }
    fs.writeFileSync(path.join(dir,'hubs-live.json'),JSON.stringify(evidence,null,2));
    console.log(JSON.stringify({pass:true,hubs:evidence}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
