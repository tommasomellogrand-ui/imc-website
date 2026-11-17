const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.IMC_TEST_NODE_MODULES ? process.env.IMC_TEST_NODE_MODULES+'/jsdom' : 'jsdom');
const {webcrypto}=require('node:crypto');
const code=fs.readFileSync('importers/IMC_Schedule_Import_V3.js','utf8');
const until=async f=>{for(let n=0;n<800;n++){if(f())return;await new Promise(r=>setTimeout(r,5));}throw Error('UI timed out');};
const cases=[
 ['smfacup','SMFA Champions Cup','Semifinale Ritorno','Knockout Stage',null],
 ['smfashield','SMFA Shield','Semifinale Ritorno','Knockout Stage',null],
 ['smfacup','Girone A','Semifinale Ritorno','Knockout Stage',null],
 ['smfacup','SMFA Champions Cup','',null,null],
 ['smfacup','Girone A','','Group Stage','Girone A'],
 ['smfashield','Girone 12','Turno 1','Group Stage','Girone 12'],
 ['worldcup','Girone A','Finals','Group Stage','Girone A'],
 ['smfacup','SMFA Champions Cup','Final','Knockout Stage',null],
 ['interqualifier','Girone 1','','Qualificazioni','Girone 1'],
 ['smfacup','SMFA Champions Cup','Quarti di Finale Andata','Knockout Stage',null],
 ['smfashield','SMFA Shield','Ottavi Ritorno','Knockout Stage',null],
 ['smfacup','SMFA Champions Cup','Semifinals - 2nd leg','Knockout Stage',null],
 ['smfacup','SMFA Champions Cup','Round of 16 - 1st leg','Knockout Stage',null]
];
(async()=>{
 for(const [action,label,round,stage,groupName] of cases){
  const group=['worldcup','interqualifier'].includes(action)?'NATIONS':'INTERNATIONAL';
  const html='<div id="currentScreenA" class="current-screen-shown"><div id="goalsTab" action="'+(action==='worldcup'?'interqualifier':action)+'"></div><div id="fixturesContainer"><div id="competitionFixturesContent"><div class="scheduleScreen-Heading">'+(round?round+' : ':'')+'lun 23 novembre 2026</div><div id="groupHeader" onclick="handyFunctions.toggleVisibility(\'0_fixtures\')">'+label+'</div><div id="0_fixtures"><table><tbody>'+[1,2].map(n=>'<tr><td><a id="homeTeam" onclick="MENU_clubOverviewDraw(\''+(10+n)+'\')">Home '+n+'</a><a id="matchResult" onclick="MATCHREPORT_downloadNextFixtureData(\''+(1000+n)+'\',0,0)">20:00</a><a id="awayTeam" onclick="MENU_clubOverviewDraw(\''+(20+n)+'\')">Away '+n+'</a></td></tr>').join('')+'</tbody></table></div></div></div></div>';
  const dom=new JSDOM(html,{url:'https://it.soccermanager.com',runScripts:'outside-only'}),w=dom.window,d=w.document,stored=[];
  Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.AbortController=AbortController;
  w.fetch=async(_,args)=>{
   const b=JSON.parse(args.body);let r;
   if(b.action==='list_imc_worlds')r={ok:true,worlds:[{id:'IMC001',name:'Road To History'}]};
   else if(b.action==='list_imc_competitions')r={ok:true,competitions:[{key:'IMC001|'+group+'|'+action,name:'Competition',group,sm_action:action}],seasons:[{imc_season:2,imc_season_start_date:'2026-09-22',imc_season_end_date:null}],destination:{database:'Sql1956795_3',table:'IMC001_Schedule'}};
   else if(b.action==='read')r={ok:true,rows:stored,has_more:false};
   else if(b.action==='insert_many'){stored.push(...b.rows);r={ok:true,written_rows:b.rows.length};}
   else throw Error('Unexpected '+b.action);
   return {ok:true,text:async()=>JSON.stringify(r)};
  };
  w.eval(code);const click=async id=>{await until(()=>d.getElementById(id));d.getElementById(id).click();};
  await click('__imc_v3_world_0');await click('__imc_v3_type_'+(group==='NATIONS'?3:1));await click('__imc_v3_comp_0');await click('__imc_v3_start');
  await until(()=>['COMPLETATO','ERRORE'].includes(d.getElementById('__imc_v3_badge').textContent));
  assert.equal(d.getElementById('__imc_v3_badge').textContent,'COMPLETATO',d.getElementById('__imc_v3_log').textContent);assert.equal(stored.length,2);
  for(const row of stored){assert.equal(row.competition_stage,stage,action+' / '+round+' / '+label);assert.equal(row.competition_group_name,groupName);assert.equal(row.competition_round,round || null);assert.equal(row.competition_key,'IMC001|S02|'+group+'|'+action);}
  console.log('PASS phase',action,round || '(date only)',label,'=>',stage,groupName);dom.window.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});
