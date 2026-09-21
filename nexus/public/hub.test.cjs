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
 const c={competitions:[],world:{world_name:'Test World',game_world_id:'GW003',active_clubs:2},seasons:[{imc_season:1,imc_season_start_date:'2026-01-01',imc_season_end_date:'2026-12-31'}],clubs:[{id:1,sm_team_id:10,name:'Club 10'}],nations:[{id:2,sm_team_id:20,name:'Italia'}],managers:[{manager_id:"MNG001",full_name:"Manager Uno",team_id:1,national_team_id:null,team_name:"Club 10",start_date:"2026-01-01",end_date:null},{manager_id:"MNG001",full_name:"Manager Uno",team_id:1,national_team_id:null,team_name:"Club 10",start_date:"2025-01-01",end_date:"2025-12-01"},{manager_id:"MNG002",full_name:"Manager Due",team_id:1,team_name:"Different club",start_date:"2026-01-01"}]};
 const cmp={competition_key:'GW003|ARG|DOMESTIC|league|1',sm_action:'league',sm_country:'ARG',sm_action_group:'DOMESTIC',sm_division:1,results_count:1};
 const location={search:query,pathname:'/nexus/'};
 const context={console,URL,URLSearchParams,AbortController,DOMException,Date,Intl,setTimeout,clearTimeout,location,NexusLogic:L,Option:function(text,value){this.textContent=text;this.value=value},history:{replaceState(){},pushState(){}},document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}},matchMedia:()=>({matches:true}),fetch:async input=>{
   const p=new URL(input,'https://example.test').searchParams;requests.push(Object.fromEntries(p));let data;
   switch(p.get('resource')){
   case 'worlds':data={worlds:[]};break;
   case 'directory':data={core:c};break;
   case 'trophies':data={awards:[1,2].map(season=>({id:'award'+season,season,kind:'cup',awarded_at:'2026-09-01',competition:{...cmp,nexus_view:'National Cup'},winner:{name:'Club 10',core:{club_id:1,name:'Club 10'}},runner_up:{name:'Club 20'},manager:{manager_id:'MNG001',full_name:'Manager Uno'},match:match(20,10,20,2,1)}))};break;
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
   const r=await render('?world=GW003&'+q);assert.ok(!r.status.includes('non disponibili'),q);assert.ok(r.html.length>0,q);assert.ok(r.requests.filter(x=>x.resource!=='worlds').every(x=>x.world==='GW003'),q);assert.equal((r.bottom.match(/world=GW003/g)||[]).length,4);assert.ok(r.bottom.includes('href="/nexus/clubhouse.html"'));assert.ok(r.bottom.includes('<span>Clubhouse</span>'));
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
test('manager uses reports while national team profiles use results',()=>{
 const php=fs.readFileSync(__dirname+'/hub.php','utf8');
 const manager=php.split('function nexus_manager_profile')[1].split('function nexus_team_profile')[0];
 assert.ok(manager.includes('IMC Site Match Report'));assert.ok(!manager.includes('IMC Site Results'));
 const team=php.split('function nexus_team_profile')[1].split('function nexus_competition_reports')[0];
 assert.ok(team.includes("$source=$national?'IMC Site Results':'IMC Site Match Report'"));assert.ok(team.includes('home_sm_club_id=? OR away_sm_club_id=?'));
});

test('all manager tabs and team statistics are routed through report profile endpoints',async()=>{
 for(const tab of ['stats','matches','h2h','trophy']){
 const r=await render('?world=GW003&resource=manager&manager=MNG001&profileTab='+tab+'&opponent=456');
 assert.ok(r.requests.some(q=>q.resource===(tab==='trophy'?'trophies':'manager_profile')));assert.ok(!r.requests.some(q=>q.resource==='results'));assert.ok(r.html.includes('profile-heading'));assert.ok(!r.html.includes('class="view-note"'));if(tab==='stats')assert.ok(r.html.includes('Vittorie'));assert.ok(!r.status.includes('non disponibili'));
 if(tab==='h2h')assert.ok(r.html.includes('Opponent Test'));
 if(tab==='trophy'){assert.ok(r.html.includes('honour-shelf'));assert.ok(r.html.includes('Stagione 1')&&r.html.includes('Stagione 2'));assert.ok(!r.requests.some(q=>q.resource==='competition'));}
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

test('overview rounds count complete matchdays, not fixtures',()=>{
 const played=[];for(let round=1;round<=18;round++)for(let i=0;i<5;i++)played.push(match(round*10+i,i*2+1,i*2+2,1,0,{competition_round:'Turno '+round}));
 assert.deepEqual(L.competitionRounds(played,[],{sm_action:'league',teams_count:10,expected_match:90}),{played:18,total:18});
 assert.equal(L.competitionRounds(played.slice(0,-1),[],{sm_action:'league',teams_count:10,expected_match:90}).played,17);
 assert.equal(L.competitionRounds(played,[],{sm_action:'league'}).total,null);
});
test('overview report totals and rankings deduplicate fixtures and preserve missing values',()=>{
 const r=match(1,1,2,2,1,{team_stats_json:JSON.stringify({home:{total_shots:10,shots_on_target:5},away:{total_shots:8,shots_on_target:3},scorers:[{sm_player_id:7,team_side:'home',player_name:'Player A',minute:12,own_goal:0},{sm_player_id:7,team_side:'home',player_name:'Player A',minute:38,own_goal:0},{sm_player_id:9,team_side:'away',player_name:'Own Goal Player',minute:55,own_goal:1}]}),players_json:[{sm_player_id:7,team_side:'home',player_name:'Player A',assists:1,rating:8,man_of_match:1},{sm_player_id:8,team_side:'away',player_name:'Unused',rating:0}]});
 const r2=match(2,1,2,0,0,{players_json:[{sm_player_id:7,team_side:'home',player_name:'Player A',rating:6}]});
 const s=L.reportSummary([r,r,r2,...[3,4,5].map(id=>({...r2,sm_fixture_id:id}))]);
 assert.equal(s.totals.matches,5);assert.equal(s.totals.goals,3);assert.equal(s.totals.total_shots,18);assert.equal(s.totals.shots_on_target,8);assert.equal(s.totals.corners,null);
 assert.equal(s.leaders.goals[0].goals,2);assert.equal(s.leaders.assists[0].assists,1);assert.equal(s.leaders.mom[0].mom,1);assert.equal(s.leaders.rating.length,1);assert.equal(s.leaders.rating[0].rating,6.4);assert.equal(s.leaders.rating[0].ratingCount,5);
});

test('Top 3 requires five actual appearances and excludes unused substitutes',()=>{
 const rows=Array.from({length:5},(_,i)=>match(i+1,1,2,1,0,{team_stats_json:{scorers:[1,2,3,4].flatMap(id=>Array.from({length:id},(_,n)=>({sm_player_id:id,team_side:'home',player_name:'Player '+id,minute:10+n,own_goal:0})))},players_json:[
 ...[1,2,3,4].map(id=>({sm_player_id:id,team_side:'home',player_name:'Player '+id,starter:1,assists:id,man_of_match:1,rating:6+id/2})),
 ...(i<4?[{sm_player_id:5,team_side:'home',player_name:'Four appearances',starter:1,assists:20,rating:10,man_of_match:1}]:[]),
 {sm_player_id:6,team_side:'away',player_name:'Unused bench',starter:0,rating:0,minutes_played:0}
 ]}));
 const s=L.reportSummary([...rows,rows[0]]);
 for(const metric of ['goals','assists','mom','rating']){assert.equal(s.leaders[metric].length,3);assert.ok(s.leaders[metric].every(p=>p.appearances===5));assert.ok(!s.leaders[metric].some(p=>p.name==='Four appearances'||p.name==='Unused bench'));}
});

test('profile report statistics use only the managed side and average known values',()=>{
 const reports=Array.from({length:5},(_,i)=>match(i+1,i===1?2:1,i===1?1:2,i===1?1:2,i===1?2:1,{competition_group:'DOMESTIC',match_date:'2026-06-01',home_sm_manager_id:i===1?456:123,away_sm_manager_id:i===1?123:456,
 team_stats_json:i===4?{scorers:[{sm_player_id:7,team_side:i===1?'away':'home',player_name:'Own player',minute:20,own_goal:0}]}:{home:{possession:i===1?30:60,shots_on_target:i===1?2:5,corners:3},away:{possession:i===1?70:40,shots_on_target:i===1?8:2,corners:4},scorers:[{sm_player_id:7,team_side:i===1?'away':'home',player_name:'Own player',minute:20,own_goal:0},{sm_player_id:8,team_side:i===1?'home':'away',player_name:'Opponent',minute:30,own_goal:0}]},
 players_json:[{sm_player_id:7,team_side:i===1?'away':'home',player_name:'Own player',starter:1,rating:8},{sm_player_id:8,team_side:i===1?'home':'away',player_name:'Opponent',starter:1,rating:10}]
 }));
 const s=L.profileStats([...reports,reports[0]],123);
 assert.equal(s.basic.p,5);assert.equal(s.basic.w,5);assert.equal(s.totals.shots_on_target,23);assert.equal(s.averages.shots_on_target,5.75);assert.equal(s.averages.possession,62.5);
 assert.equal(s.leaders.goals[0].name,'Own player');assert.equal(s.leaders.goals.length,1);
 const groups=L.headToHeads(reports,123);assert.equal(groups.length,1);assert.equal(groups[0].stats.basic.p,5);
});
test('H2H automatically lists opponents and requests current season without a filter selection',async()=>{
 const r=await render('?world=GW003&resource=manager&manager=MNG001&profileTab=h2h');
 assert.ok(r.html.includes('Opponent Test'));assert.ok(r.html.includes('Possesso medio'));assert.ok(r.requests.some(q=>q.resource==='manager_profile'&&q.season==='1'));
});
test('result-only national statistics do not invent report metrics',()=>{
 const rows=[match(1,10,20,3,1,{home_sm_manager_id:10,away_sm_manager_id:20})];
 const s=L.profileStats(rows,10);assert.equal(s.basic.gf,3);assert.equal(s.averages.possession,null);assert.equal(s.leaders.goals.length,0);
});


test('Trophy Room menu and profile shelves use all seasons independently of filters',async()=>{
 for(const q of ['resource=archive','resource=archive&hall=leaders','resource=archive&competition=GW003%7CARG%7CDOMESTIC%7Cleague%7C1','resource=club&team=1&profileTab=trophy','resource=manager&manager=MNG001&profileTab=trophy']){
  const r=await render('?world=GW003&season=2&'+q);
  const requests=r.requests.filter(x=>x.resource==='trophies');assert.equal(requests.length,1);assert.equal(requests[0].season,undefined);assert.ok(!r.controls.includes('name="season"'));assert.ok(!r.html.includes('Premi Aggiorna'));assert.ok(!r.requests.some(x=>x.resource==='catalog'));
  if(q==='resource=archive'){assert.ok(r.html.includes('S1')&&r.html.includes('S2'));assert.ok(r.html.includes('National Cup'));assert.ok(r.html.includes('Manager Uno'));}
 }
});

test('official honours render without inventing dates, scores or runners-up',()=>{
 const src=fs.readFileSync(__dirname+'/site.js','utf8');
 const fn=src.slice(src.indexOf('function trophyAward('),src.indexOf('function trophyRank('));
 const ctx={esc:String,date:()=>{throw Error('No invented date')},extraScore:()=>{throw Error('No invented match')},competitionIcon:()=>'',trophyTeam:()=> 'Watford',trophyManager:()=> 'Tommaso Mello'};
 vm.createContext(ctx);vm.runInContext(fn,ctx);
 for(const kind of ['league','cup','playoff']){
  const html=ctx.trophyAward({kind,season:1,match:null,awarded_at:null,runner_up:null,points:null});
  assert.match(html,/Watford/);assert.match(html,/Tommaso Mello/);assert.doesNotMatch(html,/null|undefined|Finalista|Finale ↗/);
 }
});
