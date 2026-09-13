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
      const clubResults=results.filter(r=>r.competition_group!=='NATIONS');
      assert.ok(clubResults.length>0);
      const activity=await (await page.request.post(base+'api.php',{data:{game_world_id:'GW001',resource:'competition_activity'}})).json();
      const manifest=await (await page.request.get(base+'data/core-manifest.json')).json();
      const snapshot=await (await page.request.get(base+'data/'+manifest.file)).json();
      const members=new Map(snapshot.teams.map(t=>[String(t.sm_world_club_id),t]));
      assert.equal(members.size,40);
      const sides=clubResults.flatMap(r=>['home','away'].map(side=>({fixture:r.sm_fixture_id,worldId:String(r[side+'_sm_club_id']),identity:r[side+'_identity']})));
      const required=sides.filter(s=>members.has(s.worldId));
      const optional=sides.filter(s=>!members.has(s.worldId));
      assert.equal(new Set(required.map(s=>s.worldId)).size,40);
      for(const side of required){
        assert.ok(side.identity?.image_url,'Missing IMC crest: '+side.worldId);
        assert.equal(String(side.identity.sm_club_id),String(members.get(side.worldId).sm_club_id));
        const member=snapshot.membership.find(m=>String(m['SM Club ID'])===String(side.identity.sm_club_id));
        assert.ok(member);
        assert.equal(side.identity.image_url,snapshot.clubs.find(c=>String(c.id)===String(member['Club ID'])).image_url);
      }
      fs.writeFileSync(path.join(dir,`logo-scope-${width}.json`),JSON.stringify({requiredOccurrences:required.length,requiredClubs:40,optionalExternal:optional},null,2));
      async function checkCrests(selector,expectedCount){
        const images=page.locator(selector);
        assert.equal(await images.count(),expectedCount);
        const state=await images.evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{
          img.loading='eager';
          try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('image_timeout')),20000))]);}catch(e){}
          const box=img.getBoundingClientRect();
          return {src:img.src,complete:img.complete,width:img.naturalWidth,visible:getComputedStyle(img).display!=='none'&&box.width>0&&box.height>0};
        })));
        assert.ok(state.every(i=>i.complete&&i.width>0&&i.visible),JSON.stringify(state.filter(i=>!i.complete||!i.width||!i.visible)));
        return state.length;
      }

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
        const expectedResultCrests=expected.results.reduce((n,r)=>n+(r.home_identity?.image_url?1:0)+(r.away_identity?.image_url?1:0),0);
        const loadedResultCrests=await checkCrests('#hub-results [data-club-crest]',expectedResultCrests);
        let extraCrests=0;
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
          if(section==='schedule'||section==='trophy'){
            const teams=section==='schedule'?expected.schedule.flatMap(r=>[r.home_identity,r.away_identity]):expected.winner?[expected.winner.identity,expected.winner.fixture.home_identity,expected.winner.fixture.away_identity]:[];
            extraCrests+=await checkCrests(`#hub-${section} [data-club-crest]`,teams.filter(t=>t?.image_url).length);
          }

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
        evidence.push({width,id:item.id,url:base+item.hrefs[0],sections,results:expected.results.length,schedule:expected.schedule.length,ranking:expected.ranking,winner:expected.winner?.name??null,crestsExpected:expectedResultCrests,crestsLoaded:loadedResultCrests,extraCrestsLoaded:extraCrests,pass:true});
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
