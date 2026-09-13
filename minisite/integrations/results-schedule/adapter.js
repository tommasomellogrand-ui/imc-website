import { createDataBoundary } from '../../platform/data/client.js';
import { validateModel } from '../../platform/contracts/components.js';
import { sourceState } from '../../platform/data/source-state.js';
export const countries=Object.freeze(['ENG','ESP','GER','ITA']);
export function romeDay(now=new Date()) {
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export const validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'') && !Number.isNaN(Date.parse(s+'T12:00:00Z')) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function competitionLabel(row) {
  if (!row.competition_key) return 'Competizione non disponibile';
  // Display tokens from the canonical key; never regenerate or normalize the key.
  const tokens=row.competition_key.split('|').slice(1).filter(t=>!['DOMESTIC','CUS'].includes(t));
  return tokens.map(t=>({league:'League',playoff:'Playoff',leaguecup:'Trofeo',leagueshield:'Coppa di Lega',charityshield:'Supercoppa',smfacup:'SMFA Coppa',smfashield:'SMFA Trofeo',interqualifier:'Qualificazioni nazionali',supercup:'SMFA Supercoppa'})[t]||(/^\d+$/.test(t)?'D'+t:t)).join(' · ');
}
export function mapFixture(row,gw,resource,today) {
  if (row.game_world_id!==gw || (row.competition_key && !row.competition_key.startsWith(gw+'|'))) throw new Error('cross_world_data');
  if (gw==='GW007'&&!countries.includes(row.sm_country)) throw new Error('invalid_kingdom');
  if(resource==='schedule'&&(!validDay(row.match_date)||row.match_date<today)) throw new Error('invalid_schedule_date');
  const model=validateModel('match',{fixtureId:row.sm_fixture_id??null,competition:{key:row.competition_key??null,label:competitionLabel(row)},context:{gameWorldId:gw,country:row.sm_country??null,division:row.sm_division??null},home:{name:row.home_name??null},away:{name:row.away_name??null},dateTime:{date:row.match_date??null,time:row.match_time??null,timeZone:null},status:resource==='results'?(row.result_status??null):'SCHEDULED',score:resource==='results'?{home:row.home_score??null,away:row.away_score??null}:null,sourceState:sourceState('ready',{provenance:resource==='results'?'IMC Site Results':'IMC Site Schedule'}),actions:[],accessibleLabel:`${row.home_name||'Squadra non disponibile'} – ${row.away_name||'Squadra non disponibile'}`,penalties:{home:row.penalty_home_score??null,away:row.penalty_away_score??null},aggregate:{home:row.aggregate_home_score??null,away:row.aggregate_away_score??null}});
  return {...row,model,site_id:String(row.site_id),sm_fixture_id:row.sm_fixture_id==null?null:String(row.sm_fixture_id),sm_division:row.sm_division==null?null:String(row.sm_division),competition_label:competitionLabel(row)};
}
export async function readFixtures(gw,resource,{signal,fetcher=fetch}={}) {
  if(!['GW001','GW007'].includes(gw)||!['results','schedule'].includes(resource)) throw new Error('unsupported_scope');
  let metadata=null;
  const boundary=createDataBoundary(async ({cursor,signal})=>{
    const response=await fetcher('/minisite/api/results-schedule.php',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal,body:JSON.stringify({game_world_id:gw,resource,limit:1000,offset:cursor??0,...(metadata?{revision:metadata.revision}:{})})});
    if(response.status===409) throw new Error('source_changed');
    if(!response.ok) throw new Error('read_unavailable');
    const data=await response.json();
    if(!data.ok||data.version!==1||data.game_world_id!==gw||data.resource!==resource||data.timezone!=='Europe/Rome'||!validDay(data.today)||!Array.isArray(data.rows)||data.offset!==(cursor??0)) throw new Error('invalid_response');
    if(metadata&&(data.revision!==metadata.revision||data.total!==metadata.total)) throw new Error('source_changed');
    if(data.next_offset!==null&&(!Number.isInteger(data.next_offset)||data.next_offset<=(cursor??0))) throw new Error('invalid_cursor');
    metadata=data;
    return {rows:data.rows.map(r=>mapFixture(r,gw,resource,data.today)),nextCursor:data.next_offset,sourceState:sourceState('ready',{provenance:data.source,asOf:data.read_at})};
  });
  let rows=[],cursor=null;
  do { const result=await boundary.read(resource,{signal,cursor,context:{gameWorldId:gw}});rows.push(...result.rows);cursor=result.nextCursor;} while(cursor!==null);
  if(rows.length!==metadata.total||new Set(rows.map(r=>r.site_id)).size!==rows.length) throw new Error('source_changed');
  const incomplete=metadata.undated_excluded>0||rows.some(r=>!r.competition_key||!r.sm_fixture_id||!r.home_name||!r.away_name||!validDay(r.match_date)||(resource==='results'&&(r.home_score==null||r.away_score==null)));
  return {rows,meta:metadata,sourceState:sourceState(incomplete?'degraded':rows.length?'ready':'empty',{provenance:metadata.source,asOf:metadata.read_at,reason:incomplete?'Dati incompleti nella fonte':null})};
}
export function selectFixtures(rows,{division='all',country='ALL',competition='all',date='all',id=null}={}) {
  return rows.filter(r=>(division==='all'||r.sm_division===division)&&(country==='ALL'||r.sm_country===country)&&(competition==='all'||r.competition_key===competition)&&(date==='all'||r.match_date===date)&&(!id||r.sm_fixture_id===id));
}
