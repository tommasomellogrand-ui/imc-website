import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activeCompetitions} from './competition-catalog.js';
import {readCompetitionActivity} from './data-client.js';
const manifest=JSON.parse(readFileSync(new URL('./data/core-manifest.json',import.meta.url)));
const catalogue=JSON.parse(readFileSync(new URL('./data/'+manifest.file,import.meta.url))).competitions;
const group={'Domestic Competition':'DOMESTIC','International Competition':'INTERNATIONAL','National Team Competition':'NATIONS'};
const fixture=c=>({source:'results',game_world_id:'GW001',competition_key:c.competition_key||`GW001|${group[c.sm_action_group]}|${c.sm_action}|${c.sm_division??''}`,competition_group:group[c.sm_action_group],sm_action:c.sm_action,sm_division:c.sm_division,sm_country:c.sm_country});
const flat=a=>a.flatMap(g=>g.entries);
test('current eleven active competitions are grouped and canonically ordered without changing the catalogue',()=>{
  const before=JSON.stringify(catalogue);
  const absent=new Set(['charityshield','friendly','supercup','worldcup']);
  const rows=catalogue.filter(c=>!absent.has(c.sm_action)).map(fixture);
  const output=activeCompetitions([...catalogue].reverse(),rows.reverse());
  assert.deepEqual(output.map(g=>g.group),['DOMESTIC','INTERNATIONAL','NATIONS']);
  assert.deepEqual(output.map(g=>g.entries.length),[8,2,1]);
  assert.deepEqual(flat(output).map(c=>c.order),[1,2,3,4,5,7,8,9,11,12,14]);
  assert.equal(JSON.stringify(catalogue),before);
});
test('schedule-only competitions, including past schedules, appear in all fifteen fixed positions',()=>{
  const rows=catalogue.map(c=>({...fixture(c),source:'schedule',match_date:'2020-01-01'}));
  const output=flat(activeCompetitions([...catalogue].reverse(),rows));
  assert.deepEqual(output.map(c=>c.order),Array.from({length:15},(_,i)=>i+1));
  assert.equal(output[5].label,'Charity Shield');assert.equal(output[6].label,'Playoff · Divisione 2');
  assert.ok(output.every(c=>c.results.length===0&&c.schedule.length===1));
});
test('playoff action league never activates regular League; group, world, division and country constrain fallback',()=>{
  const playoff=catalogue.find(c=>c.competition_key?.endsWith('playoff|2'));
  assert.deepEqual(flat(activeCompetitions(catalogue,[fixture(playoff)])).map(e=>e.order),[7]);
  const league=catalogue.find(c=>!c.competition_key&&c.sm_action==='league'&&c.sm_division==='1');
  assert.equal(flat(activeCompetitions(catalogue,[{...fixture(league),game_world_id:'GW007'}])).length,0);
  assert.equal(flat(activeCompetitions(catalogue,[{...fixture(league),competition_group:'NATIONS'}])).length,0);
  assert.equal(flat(activeCompetitions([{...league,sm_country:'CUS'}],[{...fixture(league),sm_country:'ITA'}])).length,0);
  assert.equal(flat(activeCompetitions(catalogue,[])).length,0);
  assert.equal(flat(activeCompetitions(catalogue,[fixture(league),{...fixture(league),source:'schedule'}])).length,1);
});
test('activity transport is GW001-only, uncached and includes schedule presence',async()=>{
  const payload={ok:true,game_world_id:'GW001',resource:'competition_activity',rows:[{...fixture(catalogue[0]),source:'schedule'}]};
  const data=await readCompetitionActivity({fetcher:async(url,options)=>{assert.equal(url,'/minisite/GW001/api.php');assert.equal(options.cache,'no-store');assert.deepEqual(JSON.parse(options.body),{game_world_id:'GW001',resource:'competition_activity'});return {ok:true,json:async()=>payload};}});
  assert.equal(data.rows[0].source,'schedule');
  await assert.rejects(readCompetitionActivity({fetcher:async()=>({ok:true,json:async()=>({...payload,game_world_id:'GW007'})})}),/scope/);
});
