const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});try{for(const width of [390,1280]){
const p=await b.newPage({viewport:{width,height:844}}),errors=[];let popups=0;p.on('popup',()=>popups++);p.on('pageerror',e=>errors.push(e.message));
await p.route('**/nexus/core/context.php?*',r=>r.fulfill({json:{ok:false}}));await p.route('**/nexus/club-house/data.php*',r=>r.fulfill({json:{ok:false}}));
await p.goto('http://127.0.0.1:8765/nexus/series/?world=GW001');await p.waitForURL('**/rth/?world=GW001');await p.locator('.match-card').first().waitFor();assert.equal(await p.locator('[data-world-tab=field]').getAttribute('aria-selected'),'true');await p.evaluate(()=>window.__tabTest=true);
assert(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0,3).every(v=>Number(v)>=240)));
await p.locator('[data-world-tab=field]').click();const ids=await p.locator('.match-card').evaluateAll(ns=>ns.map(n=>n.dataset.fixture));assert.equal(ids.length,8);assert.equal(new Set(ids).size,8);assert.equal(await p.locator('.match-stories section').count(),16);assert(await p.locator('.match-stories').first().isVisible());
assert.equal(await p.locator('#content .cast-panel').count(),0);assert.equal(await p.locator('.series-disclosure').count(),1);assert.equal(await p.locator('.match-card .note').count(),0);assert.equal(await p.locator('.hero h1 br').count(),0);assert(await p.locator('.hero h1').evaluate(n=>n.scrollWidth<=n.clientWidth+1));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await p.locator('[data-world-tab=rest]').click();assert.equal(await p.locator('#content .card').count(),24);
assert.deepEqual(await p.locator('.jumpnav [data-world-tab]').evaluateAll(ns=>ns.map(n=>n.dataset.worldTab)),['field','rest']);
await p.locator('#content .clubtop button').first().click();assert.equal(await p.locator('#content .card').count(),1);
await p.locator('[data-tab=cast]').click();assert.equal(await p.locator('#content .card').count(),10);
await p.locator('[data-tab=episodes]').click();await p.locator('#content .card > button').click();assert((await p.locator('#scenes article').count())>=5);await p.locator('#close').click();
assert(await p.evaluate(()=>window.__tabTest));assert.equal(popups,0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
await p.goto('http://127.0.0.1:8765/nexus/?world=GW001');await p.locator('[data-rth-entry]').waitFor();assert(await p.locator('[data-rth-entry]').evaluate(n=>n.previousElementSibling.href.includes('/club-house')));await p.close();
}console.log('GW001: same-page tabs, reader, club voices and home shortcut verified on mobile/desktop')}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
