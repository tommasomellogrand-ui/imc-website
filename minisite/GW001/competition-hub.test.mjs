import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {competitionHub,finalWinner} from './competition-hub.js';
import {createViews} from './core-views.js';
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('data/core-manifest.json',root)));
const snapshot=JSON.parse(readFileSync(new URL('data/'+manifest.file,root)));
const catalogue=snapshot.competitions;
const row=(key,group,action,division=null,extra={})=>({game_world_id:'GW001',competition_key:key,competition_group:group,sm_action:action,sm_division:division,sm_country:'CUS',...extra});
const league=row('GW001|CUS|DOMESTIC|league|2','DOMESTIC','league','2');
const playoff=row('GW001|DOMESTIC|playoff|2','DOMESTIC','league','2',{competition_stage:'Playoff Semifinale'});
const cup=row('GW001|CUS|DOMESTIC|leaguecup|4','DOMESTIC','leaguecup','4',{competition_stage:'Semifinale'});
const group=row('GW001|INTERNATIONAL|smfacup','INTERNATIONAL','smfacup',null,{competition_group_name:'Girone A'});
const model=(id,results=[],schedule=[])=>competitionHub(catalogue,[...results.map(r=>({...r,source:'results'})),...schedule.map(r=>({...r,source:'schedule'}))],{results,schedule},id);
const sections=h=>h.sections.map(([id])=>id);

test('League and Playoff hubs remain strictly isolated despite the shared action/division',()=>{
  const foreign={...league,game_world_id:'GW007'};
  const data=[league,playoff,cup,foreign];
  const l=model('74',data,[playoff,league]);
  assert.deepEqual(l.results,[league]);assert.deepEqual(l.schedule,[league]);
  assert.deepEqual(sections(l),['results','standings','schedule','trophy']);
  const p=model('327',data,[league,playoff]);
  assert.deepEqual(p.results,[playoff]);assert.deepEqual(p.schedule,[playoff]);
  assert.deepEqual(sections(p),['results','schedule','trophy']);
  assert.equal(p.ranking,null);
});
test('real group metadata enables group standings, retaining subsequent knockout results and fixtures',()=>{
  const knockout={...group,competition_group_name:null,competition_stage:'Semifinale'};
  const final={...knockout,competition_stage:'Finale'};
  const h=model('4',[group,knockout,cup],[final]);
  assert.equal(h.ranking,'groups');assert.deepEqual(h.groups,['Girone A']);
  assert.deepEqual(h.groupResults,[group]);assert.deepEqual(h.results,[group,knockout]);
  assert.deepEqual(h.schedule,[final]);assert.deepEqual(sections(h),['results','schedule','standings','trophy']);
  assert.equal(model('4',[knockout]).ranking,null);
  assert.equal(model('327',[{...playoff,competition_stage:'Group Stage'}]).ranking,'groups');
});
test('schedule-only stage evidence and archived activity identify a group structure without invented groups',()=>{
  const scheduled={...group,competition_group_name:null,competition_stage:'Girone B'};
  assert.deepEqual(model('4',[],[scheduled]).groups,['Girone B']);
  const h=competitionHub(catalogue,[{...scheduled,source:'schedule'}],{results:[],schedule:[]},'4');
  assert.equal(h.ranking,'groups');assert.deepEqual(h.schedule,[]);
  const unnamed=model('4',[],[{...scheduled,competition_stage:'Group Stage'}]);
  assert.deepEqual(unnamed.groups,[]);assert.equal(unnamed.ranking,'groups');
});
test('unknown or inactive references never default to a different competition',()=>{
  for(const id of ['missing','2',null,'GW007|DOMESTIC|league|2'])assert.equal(model(id,[league]),null);
});
const final={...cup,competition_stage:'Finale',sm_fixture_id:'123',result_status:'COMPLETED',home_name:'Home',away_name:'Away',home_score:1,away_score:0};
test('Trophy Room uses only a unique completed final; handles ties, penalties and incomplete outcomes',()=>{
  assert.equal(finalWinner([final],[]).name,'Home');
  assert.equal(finalWinner([{...final,home_score:0,away_score:0,penalty_home_score:3,penalty_away_score:4}],[]).name,'Away');
  for(const r of [{...final,result_status:'SCHEDULED'},{...final,home_score:null},{...final,home_score:0},
    {...final,competition_stage:'Semifinale'},{...final,competition_round:'Andata'},
    {...final,competition_round:'Ritorno'},{...final,aggregate_home_score:2},
    {...final,penalty_home_score:5,penalty_away_score:4}])assert.equal(finalWinner([r],[]),null);
  assert.equal(finalWinner([final,final],[]),null);
  assert.equal(finalWinner([final],[final]),null);
  assert.equal(model('74',[{...league,home_score:9,away_score:0}]).winner,null);
});
test('competition cards link only to their hub and hub views do not invent a standings table',()=>{
  globalThis.location={search:'?id=4'};
  const activity=[league,group,cup].map(r=>({...r,source:'results'}));
  const views=createViews(snapshot,{results:[league,group,cup],schedule:[],competitionActivity:activity});
  const cards=views.competitions().split('data-competition-group=')[1];
  assert.match(cards,/competition\.html\?id=74/);assert.doesNotMatch(cards,/results\.html\?competition=/);
  const html=views.competition();
  assert.match(html,/Classifica Gironi/);assert.match(html,/Girone A/);
  assert.match(html,/Classifica ufficiale del girone non disponibile/);
  assert.doesNotMatch(html,/<table|GW001\|CUS\|DOMESTIC\|league/);
});
