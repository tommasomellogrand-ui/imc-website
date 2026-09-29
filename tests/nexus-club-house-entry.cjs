const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('imc_nexus_world','GW008'));
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='entry.test')return route.abort();
if(u.pathname==='/nexus/'||u.pathname==='/nexus/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync('nexus/index.html')});
if(u.pathname==='/nexus/club-house/')return route.fulfill({contentType:'text/html',body:'<h1>Club House</h1>'});
if(u.pathname==='/nexus/assets/home.js')return route.fulfill({contentType:'text/javascript',body:fs.readFileSync('nexus/assets/home.js')});
if(u.pathname.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:'window.NexusCards={wireImages:()=>{}};'});
if(u.pathname.endsWith('.php'))return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,world:{game_world_name:'Test GW'},current_season:null,rows:[]})});
return route.abort();});
await page.goto('https://entry.test/nexus/');await page.waitForURL('**/nexus/club-house/');assert.match(page.url(),/club-house\/$/);
await page.goto('https://entry.test/nexus/index.html');await page.waitForURL('**/nexus/club-house/');
for(let i=1;i<=10;i++){const gw='GW'+String(i).padStart(3,'0');await page.goto('https://entry.test/nexus/?world='+gw);await page.waitForFunction(()=>document.querySelector('#title').textContent==='Test GW');assert.equal(new URL(page.url()).searchParams.get('world'),gw);assert.equal(await page.locator('#world').inputValue(),gw);assert.equal(await page.locator('#shortcuts a').filter({hasText:'Club House'}).count(),1);}
await page.goto('https://entry.test/nexus/?world=GW002&section=trophies');await page.waitForFunction(()=>document.querySelector('#directory-title').textContent==='Trophy Room');assert.equal(new URL(page.url()).searchParams.get('section'),'trophies');assert.deepEqual(errors,[]);
console.log('PASS: default entry ignores saved GW; explicit GW001-GW010 and legacy trophy links preserved');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
