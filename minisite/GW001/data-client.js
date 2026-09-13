import {readFixtures as sharedRead} from '../integrations/results-schedule/adapter.js';
export {selectFixtures,countries,validDay,romeDay,competitionLabel} from '../integrations/results-schedule/adapter.js';
export async function readFixtures(gw,resource,{fetcher=fetch,...options}={}) {
  if(gw!=='GW001') throw new Error('unsupported_scope');
  return sharedRead(gw,resource,{...options,fetcher:(_url,init)=>fetcher('/minisite/GW001/api.php',init)});
}
export function validateSnapshot(s,manifest) {
  if(s.schema_version!==1||s.game_world_id!=='GW001'||manifest.game_world_id!=='GW001'||!s.generated_at)throw new Error('snapshot_scope');
  for(const key of ['world','membership','nations_mapping','clubs','nations','teams','managers','assignments','competitions','countries','players','player_data','history','player_ids']) {
    if(!Array.isArray(s[key])||s[key].length!==manifest.counts[key]||s[key].length!==s.counts[key])throw new Error('snapshot_incomplete');
  }
  for(const key of ['teams','assignments','competitions'])if(s[key].some(r=>r.game_world_id!=='GW001'))throw new Error('snapshot_scope');
  if(s.world.length!==1||s.world[0]['IMC GW']!=='GW001'||s.membership.some(r=>r['Game World']!=='GW001')||s.nations_mapping.some(r=>r['Game World']!=='GW001'))throw new Error('snapshot_scope');
  return s;
}
export async function readSnapshot({signal,fetcher=fetch}={}) {
  const response=await fetcher('./data/core-manifest.json',{cache:'no-store',signal});
  if(!response.ok)throw new Error('snapshot_unavailable');
  const manifest=await response.json();
  if(!/^core\.[a-f0-9]{16}\.json$/.test(manifest.file))throw new Error('snapshot_file');
  const data=await fetcher('./data/'+manifest.file,{signal});
  if(!data.ok)throw new Error('snapshot_unavailable');
  const bytes=await data.arrayBuffer();
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==manifest.sha256)throw new Error('snapshot_integrity');
  return validateSnapshot(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),manifest);
}
export async function readReport(id,{signal,fetcher=fetch}={}) {
  if(!/^\d+$/.test(id))throw new Error('fixture_not_found');
  const response=await fetcher('./api.php',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal,body:JSON.stringify({game_world_id:'GW001',resource:'match_report',sm_fixture_id:id})});
  if(response.status===404)throw new Error('fixture_not_found');
  if(response.status===409)throw new Error('report_source_conflict');
  if(!response.ok)throw new Error('report_unavailable');
  const data=await response.json();
  if(!data.ok||data.game_world_id!=='GW001'||String(data.fixture?.sm_fixture_id)!==id||data.fixture.game_world_id!=='GW001'||(data.report&&(data.report.game_world_id!=='GW001'||String(data.report.sm_fixture_id)!==id||data.fixture.competition_group==='NATIONS')))throw new Error('report_scope');
  return data;
}
