const {chromium}=require(process.env.IMC_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{fs.mkdirSync('/tmp/ivory-shots',{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [label,path] of [['home','/'],['rth','/roadtohistory/'],['cup','/roadtohistory/rth-champions-league/'],['competitions','/roadtohistory/competitions/'],['clubhouse','/clubhouse/'],['players','/roadtohistory/players/'],['editorial','/roadtohistory/alltoplayfor/']]){
await page.goto('http://127.0.0.1:8765'+path,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(5000);
await page.screenshot({path:'/tmp/ivory-shots/'+label+'.png',fullPage:false});
const styles=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,color:getComputedStyle(document.body).color,overflow:document.documentElement.scrollWidth>innerWidth+1}));
console.log(label,styles);assert.equal(styles.bg,'rgb(247, 244, 237)');assert.equal(styles.color,'rgb(20, 43, 69)');assert.equal(styles.overflow,false,label+' horizontal overflow');
if(label==='competitions'){
 await page.locator('.competition-card').first().waitFor({timeout:30000});await page.locator('.competition-card').first().click();await page.locator('.competition-summary').waitFor({timeout:40000});
 await page.screenshot({path:'/tmp/ivory-shots/detail.png',fullPage:true});
 assert.equal(await page.locator('[data-section]').count(),4);assert.equal(await page.locator('.competition-summary strong').count(),3);
 console.log('Overview',await page.locator('.competition-summary').innerText());
 for(const tab of ['matches','standings','stats']){await page.locator('[data-section="'+tab+'"]').click();await page.waitForTimeout(2500);const text=await page.locator('#view').innerText();assert(!/competition_.*error|Errore|not defined/.test(text),text);console.log(tab,text.slice(0,100));}
 await page.setViewportSize({width:1440,height:1000});await page.locator('[data-section="overview"]').click();await page.waitForTimeout(2000);await page.screenshot({path:'/tmp/ivory-shots/detail-desktop.png',fullPage:true});await page.setViewportSize({width:393,height:852});
}
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS ivory theme and competition navigation');})();
