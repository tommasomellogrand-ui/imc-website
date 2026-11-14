const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('imc_nexus_world','GW008'));
await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='entry.test')return route.abort();
if(u.pathname==='/nexus/'||u.pathname==='/nexus/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync('nexus/index.html')});
if(/^\/nexus\/gw\d{3}\/$/.test(u.pathname))return route.fulfill({contentType:'text/html',body:fs.readFileSync('nexus/world-legacy.html','utf8').replace('<head>','<head><base href="/nexus/">')});
if(u.pathname.endsWith('.php'))return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,world:{game_world_name:'Test GW'},current_season:null,rows:[]})});
if(u.pathname.startsWith('/nexus/assets/')){const file=u.pathname.slice(1);if(!fs.existsSync(file))return route.abort();const ext=path.extname(file);return route.fulfill({contentType:ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.webp'?'image/webp':'application/octet-stream',body:fs.readFileSync(file)});}
if(u.pathname.endsWith('.js'))return route.fulfill({contentType:'text/javascript',body:'window.NexusCards={wireImages:()=>{}};'});
return route.abort();});
for(const entry of ['/nexus/','/nexus/index.html']){
 await page.goto('https://entry.test'+entry);await page.waitForSelector('#imc-nexus-header');
 assert.equal(new URL(page.url()).pathname,entry,'Global entry ignores saved GW');
 assert.equal(await page.locator('.nx-tile').count(),7);
 assert.equal(await page.locator('.nx-world-link').count(),8);
 assert.equal(await page.locator('.nx-trophies').getAttribute('href'),'/nexus/club-house/?view=trophies');
 assert.equal(await page.locator('.nx-h2h').getAttribute('href'),'/nexus/club-house/?view=h2h');
}
for(let i=1;i<=11;i++){const gw='GW'+String(i).padStart(3,'0');await page.goto('https://entry.test/nexus/?world='+gw);await page.waitForFunction(()=>document.querySelector('#title')?.textContent==='Test GW');assert.equal(new URL(page.url()).pathname,'/nexus/'+gw.toLowerCase()+'/');assert.equal(new URL(page.url()).searchParams.get('world'),gw);assert.equal(await page.locator('#world').inputValue(),gw);assert.equal(await page.locator('#shortcuts a').filter({hasText:'Club House'}).count(),1);}
await page.goto('https://entry.test/nexus/?world=GW002&section=trophies');await page.waitForFunction(()=>document.querySelector('#directory-title')?.textContent==='Trophy Room');assert.equal(new URL(page.url()).searchParams.get('section'),'trophies');assert.deepEqual(errors,[]);
console.log('PASS: global Nexus archive, seven section links, eight worlds, explicit GW001-GW011 and legacy trophy links preserved');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

