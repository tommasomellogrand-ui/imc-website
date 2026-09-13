import test from 'node:test';
import assert from 'node:assert/strict';
import {readSeasons} from './data-client.js';
import {createWorldState} from './world-state.js';

const row={game_world_id:'GW001',imc_season:1,soccer_manager_season:null,imc_season_start_date:'2026-07-12',imc_season_end_date:'2026-09-20',is_current:true};
const payload={ok:true,version:1,resource:'seasons',game_world_id:'GW001',source:'IMC Game World Season',timezone:'Europe/Rome',today:'2026-09-13',read_at:'2026-09-13T14:00:00+02:00',seasons:[row],current_season:row,current_status:'current'};
test('season transport is a fixed, uncached GW001 read and preserves NULL values',async()=>{
  const data=await readSeasons({fetcher:async(url,options)=>{
    assert.equal(url,'/minisite/GW001/api.php');assert.equal(options.method,'POST');assert.equal(options.cache,'no-store');
    assert.deepEqual(JSON.parse(options.body),{game_world_id:'GW001',resource:'seasons'});
    return {ok:true,json:async()=>structuredClone(payload)};
  }});
  assert.deepEqual(data.current_season,row);
});
test('wrong world, duplicate rows, inconsistent current season and HTTP failure are rejected',async()=>{
  for(const data of [{...payload,game_world_id:'GW007'},{...payload,seasons:[row,row]},{...payload,current_season:null},{...payload,seasons:[{...row,game_world_id:'GW007'}]},{...payload,current_status:'empty'}]){
    await assert.rejects(readSeasons({fetcher:async()=>({ok:true,json:async()=>data})}),/seasons_/);
  }
  await assert.rejects(readSeasons({fetcher:async()=>({ok:false})}),/seasons_unavailable/);
});
test('all consumers share one in-flight request; a subsequent read automatically sees new seasons',async()=>{
  let complete,calls=0;const states=[];
  const store=createWorldState({reader:()=>{calls++;return new Promise(resolve=>{complete=resolve;});},notify:s=>states.push(s.status)});
  const a=store.refreshSeasons(),b=store.refreshSeasons();assert.equal(a,b);await Promise.resolve();assert.equal(calls,1);
  complete(payload);await a;assert.equal(store.seasonState.current_season.imc_season,1);
  assert.ok(Object.isFrozen(store.seasonState));assert.ok(Object.isFrozen(store.seasonState.seasons[0]));
  const next={...row,imc_season:2,imc_season_start_date:'2026-09-21',imc_season_end_date:'2026-12-01'};
  const refresh=store.refreshSeasons();await Promise.resolve();
  assert.equal(store.seasonState.current_season,null);
  complete({...payload,today:'2026-09-21',seasons:[{...row,is_current:false},next],current_season:next});await refresh;
  assert.equal(calls,2);assert.equal(store.seasonState.seasons.length,2);assert.equal(store.seasonState.current_season.imc_season,2);
  assert.deepEqual(states,['loading','ready','loading','ready']);
});
test('failed reads clear the current season and recover without substitute data',async()=>{
  let fail=false;const store=createWorldState({reader:async()=>{if(fail)throw new Error('network');return payload;}});
  await store.refreshSeasons();fail=true;await store.refreshSeasons();
  assert.equal(store.seasonState.status,'error');assert.equal(store.seasonState.current_season,null);assert.deepEqual(store.seasonState.seasons,[]);
  fail=false;await store.refreshSeasons();assert.equal(store.seasonState.status,'ready');
});
