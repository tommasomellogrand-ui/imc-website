const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.IMC_TEST_NODE_MODULES ? process.env.IMC_TEST_NODE_MODULES+'/jsdom' : 'jsdom');
const {webcrypto}=require('node:crypto');
const code=fs.readFileSync('importers/IMC_Schedule_Import_V3.js','utf8');
const root=process.env.IMC_DOM_DIR || 'tests/fixtures/schedule-dom';
const files=fs.existsSync(root+'/SM_DOM_20261117_104712.json') ? ['SM_DOM_20261117_104712.json','SM_DOM_20261117_104811.json'] : ['clubs.html','nations.html'];
const until=async f=>{for(let n=0;n<1000;n++){if(f())return;await new Promise(r=>setTimeout(r,5));}throw Error('Timed out waiting for UI');};
(async()=>{
 for(const scenario of [0,1,2,3,4,5,6,7,8,9]){
  const file=files[[0,3,4,5,6,7,8,9].includes(scenario) ? 0:1];
  let html=fs.readFileSync(root+'/'+file,'utf8');if(file.endsWith('.json'))html=JSON.parse(html).fullHTML;
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS'))errors.push(e.message);});
  const dom=new JSDOM(html,{url:'https://it.soccermanager.com',runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
  Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.AbortController=AbortController;
  if(file.endsWith('.json')){
    const dir='tests/fixtures/schedule-dom';fs.mkdirSync(dir,{recursive:true});
    const active=d.querySelector('#currentScreenA') || d,copy=active.querySelector('#fixturesContainer').cloneNode(true);
    copy.querySelectorAll('script,#fixturesHelper').forEach(e=>e.remove());
    const sample='<div id="currentScreenA">'+copy.outerHTML+Array.from(active.querySelectorAll('#goalsTab,#interWorldQualiTab,#interWorldFinalTab,#div-selector')).filter(x=>!x.closest('#workingCopy')).map(x=>x.outerHTML).join('')+'</div>';
    fs.writeFileSync(dir+'/'+(file.includes('104712')?'clubs.html':'nations.html'),sample);
  }
  const group=scenario===1?'NATIONS':scenario===2?'IMC':'INTERNATIONAL';
  const comp=group==='INTERNATIONAL'?{key:'IMC001|INTERNATIONAL|smfacup',name:'SMFA Champions',group,sm_action:'smfacup'}:scenario===1?{key:'IMC001|NATIONS|worldcup',name:'World Cup',group,sm_action:'worldcup'}:{key:'IMC001|IMC|risingstarsleague|premier',name:'Rising Stars Premier',group,sm_action:'imc'};
  const writes=[],stored=[];let readCount=0;
  w.fetch=async(_,args)=>{
   const b=JSON.parse(args.body);let r;
   if(b.action==='list_imc_worlds')r={ok:true,worlds:[{id:'IMC001',name:'Mondo di prova'}]};
   else if(b.action==='list_imc_competitions')r={ok:true,competitions:[comp],seasons:[{imc_season:1,imc_season_start_date:'2026-01-01',imc_season_end_date:'2026-10-01'},{imc_season:2,imc_season_start_date:'2026-10-02',imc_season_end_date:null}],destination:{database:'Sql1956795_3',table:'IMC001_Schedule'},worldcup_editions:scenario===1?[{imc_season:1,edition_start:'2026-10-01',final_date:null}]:[]};
   else if(b.action==='read'){
    readCount++;
    if([5,6].includes(scenario) && readCount===1)stored.push({sm_fixture_id:369742379,competition_key:scenario===5?'IMC001|INTERNATIONAL|smfacup':'IMC001|DOMESTIC|friendly',imc_season:2});
    r={ok:true,rows:stored,has_more:false};
   }
   else if(b.action==='insert_many'){
    writes.push(b);stored.push(...b.rows.map(x=>scenario===4?{...x,competition_key:'WRONG'}:x));r={ok:true,written_rows:b.rows.length};
   }else throw Error('Unexpected '+b.action);
   return {ok:true,text:async()=>JSON.stringify(r)};
  };
  w.eval(code);
  const click=async id=>{await until(()=>d.getElementById(id));d.getElementById(id).click();};
  await click('__imc_v3_world_0');await click('__imc_v3_type_'+['DOMESTIC','INTERNATIONAL','IMC','NATIONS'].indexOf(group));await click('__imc_v3_comp_0');
  await until(()=>d.getElementById('__imc_v3_start') || d.getElementById('__imc_v3_badge').textContent==='ERRORE');assert.ok(d.getElementById('__imc_v3_start'),d.getElementById('__imc_v3_error')?.textContent);assert.equal(writes.length,0,'Preview must never write');
  let season=scenario===1?1:2;
  assert.equal(d.getElementById('__imc_v3_season').value,String(season));
  if(scenario===9){const sel=d.getElementById('__imc_v3_season');sel.value='1';sel.onchange();season=1;}
  const key='IMC001|S0'+season+comp.key.slice(6);assert.equal(d.getElementById('__imc_v3_key').textContent,key);
  if(scenario===3)d.querySelectorAll('[id="goalsTab"]').forEach(e=>e.setAttribute('action','leaguecup'));
  if(scenario===7)d.querySelector('#competitionFixturesContent .scheduleScreen-Heading').textContent='Data non disponibile';
  d.querySelectorAll('[id="FixturesnextWeek_click"]').forEach(e=>e.style.display='none');
  if(scenario===8){
   const next=d.querySelector('#FixturesnextWeek_click');next.style.display='block';next.innerHTML='<a>Next</a>';
   next.querySelector('a').onclick=()=>{
    const content=d.querySelector('#competitionFixturesContent');content.querySelector('.scheduleScreen-Heading').textContent='lun 30 novembre 2026';
    content.querySelectorAll('a[id="matchResult"]').forEach(e=>e.setAttribute('onclick',e.getAttribute('onclick').replace(/\d+/,n=>String(Number(n)+100000))));next.style.display='none';
   };
  }
  await click('__imc_v3_start');await until(()=>['COMPLETATO','ERRORE'].includes(d.getElementById('__imc_v3_badge').textContent));
  const state=d.getElementById('__imc_v3_badge').textContent;
  if([3,6,7].includes(scenario)){assert.equal(state,'ERRORE');assert.equal(writes.length,0);}
  else if(scenario===4)assert.equal(state,'ERRORE','Persisted key mutation must stop import');
  else{
   assert.equal(state,'COMPLETATO',d.getElementById('__imc_v3_log').textContent);assert.equal(writes.length,scenario===8?2:1);const rows=writes[0].rows;
   assert.equal(rows.length,scenario===1 || scenario===2?32:scenario===5?15:16);assert.equal(new Set(rows.map(r=>r.competition_group_name)).size,scenario===1 || scenario===2?16:8);
   for(const r of rows){assert.equal(Object.keys(r).length,20);assert.ok(!('sm_country' in r));assert.equal(r.competition_key,key);assert.equal(r.imc_season,season);assert.equal(r.sm_action,comp.sm_action);assert.match(r.fingerprint,/^[a-f0-9]{64}$/);assert.equal(r.competition_round,null);assert.equal(r.home_sm_manager_id,null);}
   assert.equal(rows[0].competition_group_name,scenario===1 || scenario===2?'Girone 1':'Girone A');
   if(scenario!==5)assert.equal(rows[0].sm_fixture_id,scenario===1 || scenario===2?364515148:369742379);
   assert.equal(rows[0].match_date,scenario===1 || scenario===2?'2026-11-20':'2026-11-23');
  }
  assert.deepEqual(errors,[]);console.log('PASS scenario',scenario,comp.name,state);dom.window.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});
