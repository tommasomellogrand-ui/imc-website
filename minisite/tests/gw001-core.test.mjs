import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFixtures,readReport,readSnapshot,validateSnapshot} from '../GW001/data-client.js';
import {createViews} from '../GW001/core-views.js';
const base=new URL('../GW001/data/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('core-manifest.json',base)));
const bytes=readFileSync(new URL(manifest.file,base));
const snapshot=JSON.parse(bytes);
test('verified local import rejects wrong hash, missing collections and cross-world assignments',async()=>{
  const fetcher=async url=>url.includes('manifest')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  assert.equal((await readSnapshot({fetcher})).teams.length,40);
  const wrong=structuredClone(snapshot);wrong.assignments[0].game_world_id='GW007';assert.throws(()=>validateSnapshot(wrong,manifest));
  const incomplete=structuredClone(snapshot);delete incomplete.players;assert.throws(()=>validateSnapshot(incomplete,manifest));
  await assert.rejects(readSnapshot({fetcher:async url=>url.includes('manifest')?{ok:true,json:async()=>({...manifest,sha256:'invalid'})}:fetcher(url)}),/integrity/);
});
test('GW001 transport cannot dispatch a different world and retains source IDs',async()=>{
  await assert.rejects(readFixtures('GW007','results'),/scope/);
  const row={game_world_id:'GW001',sm_fixture_id:'123',site_id:'1',competition_key:'GW001|DOMESTIC|playoff|2',match_date:'2026-09-13',home_name:'Home',away_name:'Away',home_score:'0',away_score:'1',home_sm_club_id:'94078889',home_sm_manager_id:'5053060',home_identity:{team_id:'82',sm_club_id:'122',sm_world_club_id:'94078889'},match_report_available:true};
  const value=await readFixtures('GW001','results',{fetcher:async(url,opts)=>{assert.equal(url,'/minisite/GW001/api.php');assert.equal(JSON.parse(opts.body).game_world_id,'GW001');return {ok:true,json:async()=>({ok:true,version:1,game_world_id:'GW001',resource:'results',timezone:'Europe/Rome',today:'2026-09-13',offset:0,total:1,next_offset:null,rows:[row],read_at:'2026-09-13T12:00:00Z',revision:'1',undated_excluded:0})};}});
  assert.equal(value.rows[0].home_identity.team_id,'82');assert.equal(value.rows[0].home_sm_manager_id,'5053060');
});
test('report rejects not-found, source conflicts, different fixture and fabricated national reports',async()=>{
  for(const [status,message]of [[404,/not_found/],[409,/conflict/],[503,/unavailable/]])await assert.rejects(readReport('123',{fetcher:async()=>({status,ok:false})}),message);
  for(const fixture of [{game_world_id:'GW001',sm_fixture_id:'wrong'}, {game_world_id:'GW001',sm_fixture_id:'123',competition_group:'NATIONS'}])await assert.rejects(readReport('123',{fetcher:async()=>({ok:true,json:async()=>({ok:true,game_world_id:'GW001',fixture,report:{game_world_id:'GW001',sm_fixture_id:'123'}})})}),/scope/);
});
test('real dossier routing, missing IDs and national report absence render explicitly',()=>{
  globalThis.location={search:'?id=MNG048'};
  let views=createViews(snapshot,{results:[],schedule:[]},null);
  assert.match(views.manager(),/Giuseppe Trovato/);assert.match(views.manager(),/Club América/);
  globalThis.location.search='?id=does-not-exist';assert.match(createViews(snapshot,{results:[],schedule:[]},null).player(),/non trovato/);
  globalThis.location.search='?id=123';
  const fixture={game_world_id:'GW001',sm_fixture_id:'123',competition_group:'NATIONS',competition_key:'GW001|NATIONS|interqualifier',match_date:'2026-09-13',home_name:'Home',away_name:'Away',home_score:'1',away_score:'0'};
  views=createViews(snapshot,{results:[],schedule:[]},{fixture,report:null,report_status:'national_not_loaded',quality:[]});
  assert.match(views.match(),/Match Report nazionale non caricato/);assert.doesNotMatch(views.match(),/Evento chiave|evento illustrativo|54%/);
});
test('report strings are escaped and source manager conflict stays visible',()=>{
  globalThis.location={search:'?id=123'};
  const fixture={sm_fixture_id:'123',competition_key:'GW001|DOMESTIC|playoff|2',match_date:'2026-09-13',home_name:'Home',away_name:'Away',home_score:0,away_score:0};
  const report={...fixture,events:[{minute:1,event_text:'<img src=x onerror=alert(1)>'}],players:[],tactics:[],commentary:[]};
  const html=createViews(snapshot,{results:[],schedule:[]},{fixture,report,quality:['home_manager_source_conflict']}).match();
  assert.match(html,/Informazioni manager discordanti/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);
});
test('club dossiers join numeric Site IDs to string snapshot IDs and preserve source-name deep links',()=>{
  const team=snapshot.teams.find(t=>t.team_id==='146');
  const fixture={sm_fixture_id:'123',home_sm_club_id:Number(team.sm_world_club_id),away_sm_club_id:1234,home_name:'CLUB AMÉRICA',away_name:'Away',home_identity:{kind:'club',...team},competition_key:'GW001|CUS|DOMESTIC|league|4',match_date:'2026-09-13',home_score:2,away_score:1};
  for(const query of ['?id=146','?name=CLUB%20AM%C3%89RICA']){
    globalThis.location={search:query};
    const html=createViews(snapshot,{results:[fixture],schedule:[]},null).club();
    assert.match(html,/<strong>1<\/strong><small>Risultati disponibili/);
    assert.match(html,/data-fixture-id="123"/);
  }
});
