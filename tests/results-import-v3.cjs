const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.IMC_TEST_NODE_MODULES+'/jsdom');
const code=fs.readFileSync('importers/IMC_Results_Import_V3.js','utf8');
const original=fs.readFileSync('tests/fixtures/results-import-v21.js','utf8');
const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
assert.equal(section(code,'/* NAVIGATION */','/* PROCESS */'),section(original,'/* NAVIGATION */','/* PROCESS */'),'SM navigation is byte-identical');
assert.equal(section(code,'function progressUI(){','function infoCard('),section(original,'function progressUI(){','function infoCard('),'Progress popup is byte-identical');
assert.equal(section(code,'function buildUI(){','function worldUI(){').replace('Results V3.3','Results V2.1'),section(original,'function buildUI(){','function worldUI(){'),'Popup layout preserved');
assert.equal(section(code,'async function run(){','/* SHORTCUT */'),section(original,'async function run(){','/* SHORTCUT */'),'Original division loop retained');
const until=async f=>{for(let n=0;n<2000;n++){if(f())return;await new Promise(r=>setTimeout(r,2));}throw Error('UI timeout');};
const fixture=(id,group='')=>`${group?`<div id="groupHeader" onclick="toggleVisibility('g${id}_results')">${group}</div>`:''}<div id="g${id}_results"><table><tr><td><a id="homeTeam" onclick="MENU_clubOverviewDraw(11)">Home</a></td><td><a id="matchResult" onclick="MATCHREPORT_downloadFixtureData(${id})">2 - 1</a></td><td><a id="awayTeam" onclick="MENU_clubOverviewDraw(22)">Away</a></td></tr><tr><td>La squadra Home vince ai rigori con il punteggio di 5-4</td></tr></table></div>`;
async function run(scenario){
 const league=scenario==='league',imc=scenario==='imc',wc=scenario==='worldcup',cup=scenario==='cup',bad=scenario==='conflict',fake=scenario==='fakegroup',grouped=scenario==='groups';
 const action=league?'league':imc?'friendly':wc?'interqualifier':cup||fake||grouped||bad?'smfacup':null;
 const category=imc?'IMC':wc?'NATIONS':cup||fake||grouped||bad?'INTERNATIONAL':'DOMESTIC';
 const storedAction=imc?'imc':wc?'worldcup':league?'league':cup||fake||grouped||bad?'smfacup':'charityshield';
 const comp={key:'IMC001|'+category+'|'+(imc?'championsleague':storedAction)+(league?'|1':''),name:league?'Immortals':imc?'Connessione Champions':storedAction,group:category,sm_action:storedAction,sm_division:league?'1':null};
 const heading=cup?'Semifinale Ritorno · mar 18 novembre 2026':'Turno 1 · mar 18 novembre 2026';
 const dom=new JSDOM(`<div id="currentScreenA">${league?'<div id="div-selector"><select onchange="MENU_competitionDivChange(this.value,\'CUS\',\'league\')"><option value="1">Divisione 1</option><option value="2">Divisione 2</option></select></div>':''}<div id="resultsTableTab"></div><div id="leagueResultsContainer"><div class="scheduleScreen-Heading">${heading}</div>${action?`<div id="ResultsprevWeek_click"><a action="${action}" data-division="1"></a></div>`:''}<div id="competitionResultsContent">${fixture(101,cup||fake?'Group Stage':imc||wc||grouped?'Girone A':'')}${grouped?fixture(102,'Girone B'):''}</div></div></div>`,{url:'https://it.soccermanager.com',runScripts:'dangerously'});
 const w=dom.window,d=w.document;w.HTMLElement.prototype.getBoundingClientRect=()=>({width:100,height:20});
 const getStyle=w.getComputedStyle.bind(w);w.getComputedStyle=e=>{const s=getStyle(e);return {display:s.display,visibility:s.visibility,opacity:s.opacity||'1'};};
 const timeout=w.setTimeout.bind(w);w.setTimeout=(f,ms,...a)=>timeout(f,ms===1000?0:ms,...a);w.completion=()=>{};
 if(league)d.querySelector('select').onchange=function(){const div=this.value;d.querySelector('#ResultsprevWeek_click a').setAttribute('data-division',div);d.querySelector('#competitionResultsContent').innerHTML=fixture(100+Number(div));};
 const writes=[],database=[],requests=[];
 let schedule=[];
 if(league||bad)schedule=[{sm_fixture_id:101,competition_key:bad?'IMC001|S01|DOMESTIC|friendly':'IMC001|S01|DOMESTIC|league|1',imc_season:1,sm_action:bad?'friendly':'league',sm_division:league?'1':null,competition_group:bad?'DOMESTIC':category,match_date:'2026-11-18'}];
 w.fetch=async(_,args)=>{const b=JSON.parse(args.body);requests.push(b);let r={ok:true};
  if(b.action==='list_imc_worlds')r.worlds=[{id:'IMC-001',legacy:'GW001',name:'Road To History'}];
  else if(b.action==='list_imc_competitions')Object.assign(r,{competitions:[comp,...(league?[{...comp,key:'IMC001|DOMESTIC|league|2',name:'Challengers',sm_division:'2'}]:[])],seasons:[{imc_season:1,imc_season_start_date:'2026-01-01',imc_season_end_date:'2026-10-01'},{imc_season:2,imc_season_start_date:'2026-10-02',imc_season_end_date:null}],worldcup_editions:wc?[{imc_season:1,edition_start:'2026-10-01',final_date:null}]:[]});
  else if(b.action==='read'){r.rows=b.repository==='IMC Schedule'?schedule:b.where?database.filter(x=>x.sm_fixture_id===b.where.sm_fixture_id):[];r.has_more=false;}
  else if(b.action==='insert_many'){writes.push(b);database.push(...b.rows);Object.assign(r,{written_rows:b.rows.length,skipped_rows:0});}
  else throw Error('Unexpected request');
  if(b.repository==='IMC Results'||b.repository==='IMC Schedule')Object.assign(r,{database:'Sql1956795_3',physical_table:b.target_table,table:b.target_table,IMC_WORLD_ID:'IMC001'});
  return {ok:true,text:async()=>JSON.stringify(r)};
 };
 w.eval(code);await until(()=>d.querySelector('.gw'));d.querySelector('.gw').click();
 await until(()=>[...d.querySelectorAll('#body button')].some(b=>b.textContent===category));[...d.querySelectorAll('#body button')].find(b=>b.textContent===category).click();
 await until(()=>[...d.querySelectorAll('#body button')].some(b=>b.textContent===(league?'League':comp.name)));
 if(league)assert.equal([...d.querySelectorAll('#body button')].filter(b=>b.textContent==='League').length,1);
 [...d.querySelectorAll('#body button')].find(b=>b.textContent===(league?'League':comp.name)).click();
 await until(()=>d.querySelector('#__imc_results_start'));assert.equal(d.querySelector('#__imc_results_season').value,wc?'1':'2');d.querySelector('#__imc_results_start').click();
 await until(()=>['COMPLETATO','ERRORE'].includes(d.querySelector('#badge').textContent));
 if(bad){assert.equal(writes.length,0);assert.match(d.querySelector('#log').textContent,/altra competizione|altr.a competizione/);}
 else{
  assert.equal(d.querySelector('#badge').textContent,'COMPLETATO',d.querySelector('#log').textContent);
  assert.equal(database.length,league||grouped?2:1);
  for(const r of database){assert.ok(!('sm_country' in r));assert.ok(!('home_sm_manager_id' in r));assert.equal(r.home_score,2);assert.equal(r.penalty_home_score,5);assert.equal(r.competition_group,category);assert.match(r.competition_key,/^IMC001\|S0[12]\|/);}
  if(league){assert.equal(database[0].competition_key,'IMC001|S01|DOMESTIC|league|1');assert.equal(database[1].competition_key,'IMC001|S02|DOMESTIC|league|2');}
  if(imc){assert.equal(database[0].sm_action,'imc');assert.equal(database[0].competition_group_name,'Girone A');}
  if(wc){assert.equal(database[0].imc_season,1);assert.equal(database[0].sm_action,'worldcup');}
  if(cup){assert.equal(database[0].competition_stage,'Knockout Stage');assert.equal(database[0].competition_round,'Semifinale · Ritorno');assert.equal(database[0].competition_group_name,null);}
  if(fake)assert.equal(database[0].competition_group_name,null);
  if(grouped)assert.deepEqual(database.map(x=>x.competition_group_name),['Girone A','Girone B']);
 }
 assert.ok(requests.every(b=>['read','insert_many','list_imc_worlds','list_imc_competitions'].includes(b.action)));
 dom.window.close();console.log(scenario,'PASS');
}
(async()=>{for(const scenario of ['league','imc','worldcup','cup','charity','conflict','fakegroup','groups'])await run(scenario);})().catch(e=>{console.error(e);process.exit(1);});
