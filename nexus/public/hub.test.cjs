const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('./hub-logic.js');
const match=(id,h,a,hs,as,extra={})=>({sm_fixture_id:id,home_sm_club_id:h,away_sm_club_id:a,home_name:'Club '+h,away_name:'Club '+a,home_core:{name:'Club '+h,image_url:'https://example.test/home.png'},away_core:{name:'Club '+a,image_url:'https://example.test/away.png'},home_score:hs,away_score:as,result_status:'COMPLETED',...extra});
test('standings ignore missing scores, pending results and duplicate fixtures',()=>{
 const a=match(1,10,20,2,0),b=match(2,20,10,1,1);
 const table=L.standings([a,a,b,match(3,10,20,null,0),match(4,10,20,0,0,{result_status:'POSTPONED'})]);
 assert.deepEqual(table.map(t=>[t.id,t.p,t.w,t.d,t.l,t.gf,t.ga,t.pts]),[['10',2,1,1,0,3,1,4],['20',2,0,1,1,1,3,1]]);
});
test('group stages stay separate and knockout matches never enter group tables',()=>{
 const rows=[match(1,1,2,1,0,{competition_group_name:'Girone A'}),match(2,3,4,2,0,{competition_group_name:'Girone B'}),match(3,1,3,0,4,{competition_group_name:'Girone A',competition_stage:'Finale'})];
 assert.equal(L.group(rows[2]),'');assert.deepEqual(L.standings(rows.filter(r=>L.group(r)==='Girone A')).map(t=>t.id),['1','2']);
});
test('a trophy needs an unambiguous completed final, and handles penalties',()=>{
 const final=match(1,1,2,1,1,{competition_stage:'Finale',penalty_home_score:3,penalty_away_score:4});
 assert.equal(L.winner([final],[]).name,'Club 2');
 assert.equal(L.winner([final],[{competition_stage:'Finale'}]),null);
 assert.equal(L.winner([final,match(2,3,4,2,0,{competition_stage:'Finale'})],[]),null);
 assert.equal(L.winner([match(3,1,2,0,0,{competition_stage:'Finale'})],[]),null);
 assert.equal(L.winner([match(4,1,2,3,0,{competition_stage:'Finale',competition_round:'Andata'})],[]),null);
});
test('aggregate score takes precedence over the last leg',()=>{
 const final=match(1,1,2,2,0,{competition_stage:'Finale',competition_round:'Ritorno',aggregate_home_score:2,aggregate_away_score:3});
 assert.equal(L.winner([final],[]).name,'Club 2');
});
const fs=require('node:fs'),vm=require('node:vm');
async function render(query){
 const nodes=new Map(),requests=[];
 function node(id){if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',options:[],hidden:false,add(o){this.options.push(o)},setAttribute(){},addEventListener(){},scrollIntoView(){}});return nodes.get(id)}
 const c={world:{world_name:'Test World',game_world_id:'GW003',active_clubs:2},seasons:[{imc_season:1,imc_season_start_date:'2026-01-01',imc_season_end_date:'2026-12-31'}],clubs:[{id:1,sm_team_id:10,name:'Club 10'}],nations:[{id:2,sm_team_id:20,name:'Italia'}],managers:[{manager_id:"MNG001",full_name:"Manager Uno",team_id:1,national_team_id:null,team_name:"Club 10",start_date:"2026-01-01",end_date:null},{manager_id:"MNG001",full_name:"Manager Uno",team_id:1,national_team_id:null,team_name:"Club 10",start_date:"2025-01-01",end_date:"2025-12-01"},{manager_id:"MNG002",full_name:"Manager Due",team_id:1,team_name:"Different club",start_date:"2026-01-01"}]};
 const cmp={competition_key:'GW003|ARG|DOMESTIC|league|1',sm_action:'league',sm_country:'ARG',sm_action_group:'DOMESTIC',sm_division:1,results_count:1};
 const location={search:query,pathname:'/nexus/'};
 const context={console,URL,URLSearchParams,AbortController,DOMException,Date,Intl,setTimeout,clearTimeout,location,NexusLogic:L,Option:function(text,value){this.textContent=text;this.value=value},history:{replaceState(){},pushState(){}},document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}},matchMedia:()=>({matches:true}),fetch:async input=>{
   const p=new URL(input,'https://example.test').searchParams;requests.push(Object.fromEntries(p));let data;
   switch(p.get('resource')){
   case 'worlds':data={worlds:[]};break;
   case 'directory':data={core:c};break;
   case 'catalog':data={rows:[cmp]};break;
   case 'competition':data={competition:cmp,core:c,results:[match(1,10,20,2,1,{match_date:'2026-09-01'})],schedule:[]};break;
   case 'stats':data={rows:[]};break;
   case 'manager_profile':data={manager:{sm_manager_id:123},assignments:c.managers,source:'IMC Site Match Report',rows:[match(20,10,20,2,1,{match_date:'2026-09-01',competition_group:'DOMESTIC',home_sm_manager_id:123,away_sm_manager_id:456,away_manager_name:'Opponent Test',competition_stage:'Finale',imc_season:1,competition_key:cmp.competition_key})]};break;
   case 'competition_reports':data={competition:cmp,reports:[match(20,10,20,2,1,{match_date:'2026-09-01',competition_stage:'Finale',home_sm_manager_id:123,away_sm_manager_id:456})],schedule:[]};break;
   case 'team_profile':data={team:c.clubs[0],source:'IMC Site Match Report',rows:[match(20,10,20,2,1,{match_date:'2026-09-01'})]};break;
   case 'players':data={rows:[{player_id:1,full_name:'Player Test',rating:90,market_value:'1M',current_club:'Club 10',club_core:{name:'Club 10',image_url:'https://example.test/club.png'}}],clubs:[],total:1};break;
   case 'transfers':data={rows:[],total:0};break;
   default:data={rows:[],total:0};
   }return {ok:true,json:async()=>({ok:true,...data})};
 }};context.window=context;
 vm.runInNewContext(fs.readFileSync(__dirname+'/site.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));return {html:node('rows').innerHTML,controls:node('viewControls').innerHTML,status:node('status').textContent,requests,bottom:node('bottomWorldMenu').innerHTML};
}
test('world scoped routing, all competition tabs and section rendering',async()=>{
 for(const q of ['resource=competitions','resource=competitions&group=domestic','resource=club&teamType=nations','resource=player','resource=player&scope=global','resource=transfers',...['overview','competition','matches','stats','trophy'].map(t=>'resource=competitions&competition=GW003%7CARG%7CDOMESTIC%7Cleague%7C1&tab='+t)]){
   const r=await render('?world=GW003&'+q);assert.ok(!r.status.includes('non disponibili'),q);assert.ok(r.html.length>0,q);assert.ok(r.requests.filter(x=>x.resource!=='worlds').every(x=>x.world==='GW003'),q);assert.equal((r.bottom.match(/world=GW003/g)||[]).length,5);
   if(q.includes('teamType=nations'))assert.ok(r.html.includes('Italia'));
   if(q==='resource=player')assert.ok(r.html.includes('Player Test'));
   if(q.includes('tab=competition'))assert.ok(r.html.includes('hub-table'));
 }
});

test('manager grids deduplicate identities and profiles preserve world and assignment links',async()=>{
 const grid=await render('?world=GW003&resource=manager');
 assert.equal((grid.html.match(/class="card team-tile"/g)||[]).length,2);assert.ok(!grid.html.includes('Apri profilo'));assert.ok(grid.html.includes('team-grid'));assert.ok(grid.html.includes('manager=MNG001'));
 const profile=await render('?world=GW003&resource=manager&manager=MNG001');
 assert.ok(profile.html.includes('Carriera nel mondo'));assert.equal((profile.html.match(/career-card/g)||[]).length,2);assert.ok(profile.html.includes('team=1'));assert.ok(profile.html.includes('world=GW003'));
 const club=await render('?world=GW003&resource=club&team=1');assert.ok(club.html.includes('Carriera manager IMC'));assert.ok(club.html.includes('manager=MNG001'));
 const nations=await render('?world=GW003&resource=club&team=2&teamType=nations');assert.ok(nations.html.includes('Italia'));assert.ok(!nations.html.includes('Manager Uno'));
 const missing=await render('?world=GW003&resource=manager&manager=MNG999');assert.ok(missing.html.includes('non presente'));
});

test('inconsistent assignment identifiers do not link to a different club',async()=>{const r=await render('?world=GW003&resource=manager&manager=MNG002');assert.ok(r.html.includes('Different club'));assert.ok(!r.html.includes('team=1'));});
test('manager statistics use report identities, separate nations and deduplicate fixtures',()=>{
 const base={match_date:'2026-01-03',competition_group:'DOMESTIC',home_sm_manager_id:123,away_sm_manager_id:456,home_manager_name:'One',away_manager_name:'Two'};
 const win=match(10,1,2,2,0,base),draw=match(11,2,1,1,1,{...base,home_sm_manager_id:456,away_sm_manager_id:123});
 const national=match(12,1,2,0,3,{...base,competition_group:'NATIONS'});
 const rows=L.managerRows([win,win,draw,national,match(13,1,2,8,0,{...base,home_sm_manager_id:null})],123,[],false);
 assert.equal(rows.length,2);assert.deepEqual(L.managerStats(rows,123),{p:2,w:1,d:1,l:0,gf:3,ga:1,clean:1});
 assert.equal(L.managerRows([win,national],123,[],true).length,1);
 assert.equal(L.managerSide({...win,away_sm_manager_id:123},123),null);
});
test('career days merge overlapping assignments and exclude future dates',()=>{
 assert.equal(L.careerDays([{start_date:'2026-01-01',end_date:'2026-01-05'},{start_date:'2026-01-03',end_date:null},{start_date:'2027-01-01'}],'2026-01-10'),10);
});
test('profile statistics query match reports, never result projections',()=>{
 const php=fs.readFileSync(__dirname+'/hub.php','utf8').split('// Match identities')[1];assert.ok(php.includes('IMC Site Match Report'));assert.ok(!php.includes('IMC Site Results'));
});

test('all manager tabs and team statistics are routed through report profile endpoints',async()=>{
 for(const tab of ['stats','matches','h2h','trophy']){
 const r=await render('?world=GW003&resource=manager&manager=MNG001&profileTab='+tab+'&opponent=456');
 assert.ok(r.requests.some(q=>q.resource==='manager_profile'));assert.ok(!r.requests.some(q=>q.resource==='results'));assert.ok(r.html.includes('match report'));assert.ok(!r.status.includes('non disponibili'));
 if(tab==='h2h')assert.ok(r.html.includes('Opponent Test'));
 if(tab==='trophy'){assert.ok(r.html.includes('VINCITORE'));assert.ok(r.requests.some(q=>q.resource==='competition_reports'));assert.ok(!r.requests.some(q=>q.resource==='competition'));}
 }
 const t=await render('?world=GW003&resource=club&team=1&profileTab=stats');assert.ok(t.requests.some(q=>q.resource==='team_profile'));assert.ok(t.html.includes('Vittorie'));
});

test('team crests render in fixtures, standings and player club summaries',async()=>{
 for(const tab of ['overview','competition','matches']){const r=await render('?world=GW003&resource=competitions&competition=GW003%7CARG%7CDOMESTIC%7Cleague%7C1&tab='+tab);assert.ok(r.html.includes('https://example.test/home.png'));assert.ok(r.html.includes('class="core-crest"'));}
 const p=await render('?world=GW003&resource=player');assert.ok(p.html.includes('https://example.test/club.png'));assert.ok(p.html.includes('team-context'));
});


test('every competition label uses Nexus View exclusively',()=>{
 const source=fs.readFileSync(__dirname+'/site.js','utf8');
 const declaration=source.match(/const compName=[^;]+;/)[0];
 const label=vm.runInNewContext(declaration+'compName');
 assert.equal(label({nexus_view:'National Cup',custom_competition:'Coppa di Lega',sm_action:'leaguecup'}),'National Cup');
 assert.equal(label({custom_competition:'Campionato',sm_action:'league'}),'Nome competizione non configurato');
 assert.equal(label(null),'Nome competizione non configurato');
});
