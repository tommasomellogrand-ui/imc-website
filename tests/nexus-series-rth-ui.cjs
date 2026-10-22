const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});try{for(const width of [390,1280]){
 const p=await b.newPage({viewport:{width,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/nexus/core/context.php?*',r=>r.fulfill({json:{ok:false}}));await p.route('**/nexus/club-house/data.php*',r=>r.fulfill({json:{ok:false}}));
 await p.goto('http://127.0.0.1:8765/nexus/series/?world=GW001');await p.waitForURL('**/alltoplayfor/?world=GW001');await p.getByRole('tab',{name:'Final Whistle',exact:true}).click();await p.locator('.pm-match').last().waitFor();
 assert.equal(await p.locator('.pm-match').count(),8);assert.equal(await p.locator('.pm-result').count(),8);assert.equal(await p.locator('.pm-pairing').count(),4);assert.equal(await p.locator('.pm-team').count(),16);
 assert.equal(await p.locator('#content').evaluate(n=>n.firstElementChild.id),'postmatch-opening');
 assert.equal(await p.locator('.match-stories,.match-teams,.match-card>.badge').count(),0);
 assert(!(await p.locator('#content').innerText()).includes('National Cup'));
 assert.equal(await p.locator('.pm-results .pm-club img').count(),16);assert.equal(await p.locator('.pm-quarterfinals .pm-club img').count(),8);
 assert.equal(await p.locator('.pm-team h4 img').count(),16);
 assert.equal(await p.locator('.pm-scoreboard .pm-goals').count(),8);assert.equal(await p.locator('.pm-mvp>img').count(),8);
 for(const name of Object.keys(require('../nexus/series/rth/portraits.json'))){assert(await p.locator('.pm-person img').evaluateAll((ns,name)=>ns.some(n=>n.alt===name&&n.src.startsWith('https://')),name),name)}
 assert.equal(await p.locator('#postmatch-369216978').getAttribute('data-reporter'),'Giorgia Cenni');
 assert.equal(await p.locator('.series-disclosure').count(),1);assert(await p.locator('#directory').isHidden());assert(await p.locator('#tabs').isHidden());
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert(await p.locator('.pm-team').evaluateAll(ns=>ns.every(n=>n.querySelectorAll('.pm-qa').length<=5)));
 await p.locator('.pm-result').last().click();assert(new URL(p.url()).hash==='#postmatch-369216978');
 assert.deepEqual(errors,[]);
 await p.goto('http://127.0.0.1:8765/nexus/series/rth/?world=GW001&club=404');await p.waitForURL('**/alltoplayfor/?world=GW001&club=404');await p.locator('.pm-match').waitFor();assert.equal(await p.locator('.pm-match').count(),1);assert.equal(await p.locator('.match-stories').count(),0);assert(await p.locator('#tabs').isHidden());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.locator('#content>.back').click();await p.locator('#postmatch-opening').waitFor();assert.equal(await p.locator('.pm-match').count(),8);assert.deepEqual(errors,[]);
 await p.goto('http://127.0.0.1:8765/nexus/alltoplayfor/');assert(await p.getByRole('tabpanel').innerText().then(t=>t.includes('Coffee Time')));await p.getByRole('tab',{name:'Daytime',exact:true}).click();assert(await p.getByRole('tabpanel').innerText().then(t=>t.includes('pre-partita')));await p.getByRole('tab',{name:'Final Whistle',exact:true}).click();await p.locator('.pm-match').last().waitFor();assert.equal(await p.locator('.pm-match').count(),8);assert.equal(await p.locator('#nx-world-select').inputValue(),'GW001');
 await p.goto('http://127.0.0.1:8765/nexus/series/rth/?world=GW001#postmatch-369216978');await p.waitForURL('**/alltoplayfor/?world=GW001#postmatch-369216978');await p.locator('#postmatch-369216978').waitFor();assert.deepEqual(errors,[]);assert(await p.locator('.datebar').isVisible());assert(await p.evaluate(()=>document.querySelector('.datebar').compareDocumentPosition(document.querySelector('.jumpnav')) & Node.DOCUMENT_POSITION_FOLLOWING));await p.locator('#date').fill('2026-10-21');await p.locator('#date').dispatchEvent('change');assert(await p.locator('#content').isHidden());await p.getByRole('tab',{name:'Coffee Time',exact:true}).click();assert.equal(await p.locator('#date').inputValue(),'2026-10-21');await p.reload();assert.equal(await p.locator('#date').inputValue(),'2026-10-21');await p.locator('#prev').click();await p.getByRole('tab',{name:'Final Whistle',exact:true}).click();await p.locator('.pm-match').last().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.close();
 }console.log('GW001 postmatch mobile/desktop: photos, logos, score panels, MVP, club view and no pregame verified')}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
