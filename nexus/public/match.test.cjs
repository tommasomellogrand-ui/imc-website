const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/match.js','utf8');
function test(record){
 const start=source.indexOf('function goalScorers('),end=source.indexOf('function scorersHTML');
 const subStart=source.indexOf('function normName('),subEnd=source.indexOf('function badges(');
 const defs=source.slice(source.indexOf('const num='),source.indexOf('const imageURL='));
 const context={record,players:record.players_json,events:record.events_json||[],array:v=>Array.isArray(v)?v:[],result:null};vm.createContext(context);
 vm.runInContext(defs+source.slice(start,end)+source.slice(subStart,subEnd)+';result={goalScorers,subMinute,playerMinutes};',context);return context.result;
}
const p=(id,name,extra={})=>({sm_player_id:id,player_name:name,team_side:'home',starter:1,...extra});
let r={players_json:[p(1,'Y COUTO',{goals:1}),p(2,'J SANCHO',{assists:1})],events_json:[{minute:50,event_type:'goal',event_text:'COUTO riceve palla da SANCHO. GOL!!',primary_sm_player_id:1,secondary_sm_player_id:2},{minute:91,event_text:'lotteria dei rigori GOL!!',primary_sm_player_id:1}],commentary_json:[]};
assert.equal(test(r).goalScorers('home')[0].name,'Y COUTO');assert.equal(test(r).goalScorers('home')[0].minute,'50');
r.players_json[1].goals=1;assert.equal(test(r).goalScorers('home')[0].minute,null);
r={players_json:[p(1,'F CHIESA'),p(2,'E SHOMURODOV'),p(3,'R NGUMOHA',{starter:0}),p(4,'J PEDRO',{starter:0})],commentary_json:[{minute:60,commentary_text:'60Sostituzioni.CHIESA e SHOMURODOV stanno uscendo dal campo.Saranno sostituiti da NGUMOHA e PEDRO.'},{minute:90,commentary_text:'90 Fine secondo tempo'}]};
assert.equal(test(r).subMinute(r.players_json[2],'on'),'60');assert.equal(test(r).playerMinutes(r.players_json[2]),'30′');
r.players_json.push(p(5,'X PEDRO'));assert.equal(test(r).subMinute(r.players_json[3],'on'),null);
r.players_json[2].sub_on_minute='45+2';assert.equal(test(r).playerMinutes(r.players_json[2]),'43′');
r.commentary_json=[{minute:75,commentary_text:'75Coach.DJIMSITI and KAMARA are leaving the action.It will be MILITÃO and RODRI to replace them.'}];r.players_json=[p(1,'B DJIMSITI'),p(2,'B KAMARA'),p(3,'E MILITÃO',{starter:0}),p(4,'R RODRI',{starter:0})];assert.equal(test(r).subMinute(r.players_json[2],'on'),'75');
console.log('Match report: scoring roles, shootout exclusion, ambiguity, substitutions and stoppage minutes passed');
