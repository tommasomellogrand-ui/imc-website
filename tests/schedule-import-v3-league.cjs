const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.IMC_TEST_NODE_MODULES ? process.env.IMC_TEST_NODE_MODULES+'/jsdom' : 'jsdom');
const {webcrypto}=require('node:crypto');
const code=fs.readFileSync('importers/IMC_Schedule_Import_V3.js','utf8');
const until=async f=>{for(let n=0;n<2400;n++){if(f())return;await new Promise(r=>setTimeout(r,5));}throw Error('UI timed out');};
(async()=>{
 for(const scenario of ['all','single','missing','stop','playoff']){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM('<div id="currentScreenA"></div>',{url:'https://it.soccermanager.com',runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
  Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.AbortController=AbortController;
  const divisions=scenario==='single'?[1]:[1,2,3],menu=scenario==='missing'?[1,2]:divisions;
  const current={division:scenario==='single'?1:2,page:1},swaps=[],writes=[],stored=[];
  const names={1:'Immortals',2:'Contenders',3:'Challengers'};
  function render(){
   const division=current.division,page=current.page,playoff=scenario==='playoff' && division===2 && page===2;
   const next=page===1;
   d.getElementById('currentScreenA').innerHTML=
    '<div id="div-selector"><select name="division">'+menu.map(n=>'<option value="sm'+(n-1)+'"'+(n===division?' selected':'')+'>Divisione '+n+'</option>').join('')+'</select></div>'+
    '<div id="goalsTab" action="league" data-division="'+division+'"></div><div id="fixturesContainer"><li id="FixturesnextWeek_click" style="display:'+(next?'block':'none')+'"><a>Avanti</a></li><div id="competitionFixturesContent"><div class="scheduleScreen-Heading">'+(playoff?'Playoff':'Giornata '+page)+' : ven '+(page===1?'20':'27')+' novembre 2026</div><table><tbody>'+
    [1,2].map(n=>'<tr><td><a id="homeTeam" onclick="MENU_clubOverviewDraw(\''+(division*100+n)+'\')">Home '+division+' '+n+'</a><a id="matchResult" onclick="MATCHREPORT_downloadNextFixtureData(\''+(100000+division*1000+page*10+n)+'\',0,0)">20:00</a><a id="awayTeam" onclick="MENU_clubOverviewDraw(\''+(division*100+n+20)+'\')">Away '+division+' '+n+'</a></td></tr>').join('')+'</tbody></table></div></div>';
   const select=d.querySelector('#div-selector select');
   select.onchange=function(){
    const requested=Number(this.selectedOptions[0].textContent.match(/\d+/)[0]);swaps.push(requested);
    // Selected value changes first; the old fixtures remain until the response.
    w.setTimeout(()=>{current.division=requested;current.page=1;render();},80);
   };
   d.querySelector('#FixturesnextWeek_click a').onclick=function(){w.setTimeout(()=>{current.page++;render();},60);};
  }
  render();
  const catalog=[...divisions].reverse().map(n=>({key:'IMC002|DOMESTIC|league|'+n,name:names[n],group:'DOMESTIC',sm_action:'league',sm_division:String(n)}));
  catalog.push({key:'IMC002|DOMESTIC|charityshield',name:'Charity Shield',group:'DOMESTIC',sm_action:'charityshield'});
  w.fetch=async(_,args)=>{
   const b=JSON.parse(args.body);let result;
   if(b.action==='list_imc_worlds')result={ok:true,worlds:[{id:'IMC002',name:'Hall Of Famers'}]};
   else if(b.action==='list_imc_competitions')result={ok:true,competitions:catalog,seasons:[{imc_season:3,imc_season_start_date:'2026-11-17',imc_season_end_date:null}],destination:{database:'Sql1956795_3',table:'IMC002_Schedule'}};
   else if(b.action==='read')result={ok:true,rows:stored,has_more:false};
   else if(b.action==='insert_many'){
    for(const row of b.rows){
     const actual=Math.floor((row.sm_fixture_id-100000)/1000);
     assert.equal(Number(row.sm_division),actual,'Never label old fixtures with the requested next division');
     assert.equal(row.competition_key,'IMC002|S03|DOMESTIC|league|'+actual);
     assert.equal(row.sm_action,'league');assert.equal(row.imc_season,3);assert.ok(!('sm_country' in row));
    }
    writes.push(b);stored.push(...b.rows);result={ok:true,written_rows:b.rows.length};
    if(scenario==='stop')d.getElementById('__imc_v3_stop').click();
   }else throw Error('Unexpected '+b.action);
   return {ok:true,text:async()=>JSON.stringify(result)};
  };
  w.eval(code);
  const click=async id=>{await until(()=>d.getElementById(id));d.getElementById(id).click();};
  await click('__imc_v3_world_0');await click('__imc_v3_type_0');
  const buttons=Array.from(d.querySelectorAll('#__imc_v3_competitions button'));
  assert.deepEqual(buttons.map(e=>e.textContent),['League','Charity Shield']);
  await click(buttons[0].id);
  await until(()=>d.getElementById('__imc_v3_start') || d.getElementById('__imc_v3_badge').textContent==='ERRORE');
  assert.equal(writes.length,0,'Selection and preview must not write');
  if(scenario==='missing'){
   assert.equal(d.getElementById('__imc_v3_badge').textContent,'ERRORE');assert.match(d.getElementById('__imc_v3_error').textContent,/Divisione 3/);
  }else{
   assert.ok(d.getElementById('__imc_v3_start'),d.getElementById('__imc_v3_error')?.textContent);
   assert.equal(d.getElementById('__imc_v3_season').value,'3');
   // Only the season is selectable in our overlay, no division question.
   assert.equal(d.querySelectorAll('#__imc_schedule_v3 select').length,1);
   await click('__imc_v3_start');await until(()=>['COMPLETATO','FERMATO','ERRORE'].includes(d.getElementById('__imc_v3_badge').textContent));
   const state=d.getElementById('__imc_v3_badge').textContent;
   assert.equal(state,scenario==='stop'?'FERMATO':'COMPLETATO',d.getElementById('__imc_v3_log').textContent);
   if(scenario==='stop')assert.equal(writes.length,1,'STOP must prevent later pages and swaps');
   else if(scenario==='single'){assert.equal(stored.length,4);assert.deepEqual(swaps,[]);}
   else{
    assert.equal(stored.length,scenario==='playoff'?10:12);assert.deepEqual(swaps,[3,1]);
    assert.deepEqual([...new Set(stored.map(r=>r.sm_division))],['2','3','1']);
    assert.match(d.getElementById('__imc_v3_context_name').textContent,/Immortals/);
    assert.equal(d.getElementById('__imc_v3_scan').textContent,'Divisione 3 / 3');
    if(scenario==='playoff')assert.ok(!stored.some(r=>r.competition_round==='Playoff'));
   }
   assert.equal(Number(d.getElementById('__imc_v3_saved').textContent),stored.length);
   assert.equal(new Set(stored.map(r=>r.sm_fixture_id)).size,stored.length);
  }
  assert.deepEqual(errors,[]);console.log('PASS League',scenario,'rows',stored.length,'swaps',swaps.join(','));dom.window.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});
