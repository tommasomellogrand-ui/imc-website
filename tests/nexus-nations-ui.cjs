const {chromium}=require(process.env.NEXUS_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=path.join(root,new URL(req.url,'http://localhost').pathname);try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p))}catch{res.statusCode=404;res.end('Missing')}});
const stats={played:5,won:3,drawn:1,lost:1,gf:9,ga:3,gd:6,win_pct:60,reports:5,opponents:1,penalty_won:0,penalty_lost:0};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try{for(const national of [true,false]){
 const page=await browser.newPage({viewport:{width:390,height:844}}),requests=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*.php*',async route=>{const u=new URL(route.request().url());requests.push(u);let data={ok:true,rows:[]};
 if(u.pathname.endsWith('/context.php'))data={ok:true,current_season:2,seasons:[{imc_season:1},{imc_season:2}]};
 else if(u.pathname.endsWith('/directory.php'))data={ok:true,count:1,rows:[{entity_id:1,world_id:101,name:national?'England':'Test Club',image_url:'/nexus/assets/flags/nations/1.svg'}]};
 else if(u.pathname.endsWith('/detail.php'))data={ok:true,team:{world_id:101,name:national?'England':'Test Club',image_url:'/nexus/assets/flags/nations/1.svg'},manager:{manager_id:'MNG001',full_name:'Tommaso Mello',start_date:'2026-01-01'}};
 else if(u.pathname.endsWith('/h2h/index.php'))data=u.searchParams.get('mode')==='data-room'?{ok:true,summary:{played:0},seasons:[],competitions:{}}:u.searchParams.get('mode')==='overview'?{ok:true,global:{stats},seasons:[{season:1,stats,current:false}]}:{ok:true,summary:stats,opponents:[],competitions:{}};
 else if(u.pathname.endsWith('/stats.php'))data={ok:true,stats};
 else if(u.pathname.endsWith('/roster.php'))data={ok:true,reports:5,roster_date:'2026-09-23',rows:[{player_id:22,full_name:'Selected Player',roster_status:'active',role_group:'Attaccanti',position:'A(C)',image_urls:[],appearances:3,goals:2},...(!national?[{player_id:23,full_name:'Sold Player',roster_status:'departed',role_group:'Attaccanti',image_urls:[],appearances:7,goals:4}]:[])]};
 await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(base+'/nexus/teams/page.html?world=GW001'+(national?'&type=nations':''));
 await page.locator('article.team').waitFor();assert.equal(await page.locator('.hero h1').textContent(),national?'Nations':'Clubs');await page.locator('article.team').click();
 await page.getByText('Storico globale',{exact:true}).waitFor();
 const labels=(await page.locator('#tabs button').allTextContents()).map(label=>label.toUpperCase());assert.deepEqual(labels,national?['OVERVIEW','MANAGER','ROSTER','STATS','DATA ROOM','H2H','TROPHY ROOM']:['OVERVIEW','MANAGER','ROSTER','STATS','DATA ROOM','H2H','TRANSFERS','TROPHY ROOM']);
 await page.getByRole('button',{name:'MANAGER',exact:true}).click();await page.getByText('Tommaso Mello',{exact:true}).waitFor();
 await page.getByRole('button',{name:'ROSTER',exact:true}).click();await page.getByText('Selected Player',{exact:true}).waitFor();if(national)assert((await page.locator('#view').textContent()).includes('Convocati nell’ultimo Match Report'));
 if(!national){assert.equal(await page.locator('[data-roster-state]').count(),2);await page.locator('[data-roster-state=departed]').click();await page.getByText('Sold Player',{exact:true}).waitFor();assert.equal(await page.getByText('Selected Player',{exact:true}).count(),0);await page.locator('[data-roster-state=active]').click();await page.getByText('Selected Player',{exact:true}).waitFor();}
 await page.getByRole('button',{name:'STATS',exact:true}).click();await page.locator('#club-stats-values .kpis').waitFor();
 await page.getByRole('button',{name:'DATA ROOM',exact:true}).click();await page.getByText('Nessun Match Report per questi filtri.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'H2H',exact:true}).click();await page.locator('.hh-summary h3').waitFor();
 await page.getByRole('button',{name:'TROPHY ROOM',exact:true}).click();await page.getByText('Nessun trofeo', {exact:false}).first().waitFor();
 assert(requests.filter(u=>u.pathname.endsWith('/h2h/index.php')).every(u=>u.searchParams.get('kind')===(national?'nation':'club')));
 const trophy=requests.find(u=>u.pathname.endsWith('/trophies/index.php'));assert.equal(trophy.searchParams.get(national?'sm_nation':'sm_club'),'101');
 if(national)assert(!requests.some(u=>u.pathname.includes('/transfers/')));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await page.close();
 }console.log('PASS: Nations and clubs directory, all tabs, scopes, no national transfers, mobile layout');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exit(1)});


