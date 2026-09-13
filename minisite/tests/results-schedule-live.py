"""Read-only live verification against the existing independent Gateway Site reader."""
import json,os,time,urllib.request,hashlib
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
BASE='https://www.italianmastersclub.it/'
report={'commit':os.environ.get('GITHUB_SHA'),'checks':[],'data':[]}
def post(path,body):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)
def main():
 for path in json.loads(Path('minisite/tests/results-schedule-files.json').read_text()):
  if path.endswith('.php'):continue
  with urllib.request.urlopen(BASE+path+'?verify='+os.environ.get('GITHUB_SHA','live'),timeout=45) as r:actual=r.read()
  assert actual==Path(path).read_bytes(),path
  report['checks'].append({'file':path,'sha256':hashlib.sha256(actual).hexdigest(),'equal':True})
 for gw in ['GW001','GW007']:
  for resource in ['results','schedule']:
   rows=[];offset=0;revision=None
   while True:
    body={'game_world_id':gw,'resource':resource,'offset':offset}
    if revision:body['revision']=revision
    data=post('minisite/api/results-schedule.php',body);assert data['ok'],data
    revision=data['revision'];rows+=data['rows'];offset=data['next_offset']
    if offset is None:break
   assert data['today']==datetime.now(ZoneInfo('Europe/Rome')).date().isoformat()
   assert len(rows)==data['total']
   assert all(r['game_world_id']==gw and (not r['competition_key'] or r['competition_key'].startswith(gw+'|')) for r in rows)
   # Independently read the unfiltered Site table through the existing Gateway.
   raw=[];offset=0
   while True:
    old=post('imc-universal-gateway/',{'action':'minisite_read','channel':'MINISITE','game_world_id':gw,'resource':resource,'limit':1000,'offset':offset})
    assert old['ok'],old
    raw+=old['rows'];offset+=len(old['rows'])
    if len(old['rows'])<1000:break
   contextual=[r for r in raw if gw=='GW001' or r['sm_country'] in ['ENG','ESP','GER','ITA']]
   expected=[r for r in contextual if resource=='results' or (r['match_date'] and r['match_date']>=data['today'])]
   assert len(contextual)==data['source_total']
   idfield='site_result_id' if resource=='results' else 'site_schedule_id'
   a={str(r['site_id']):r for r in rows};b={str(r[idfield]):r for r in expected};assert a.keys()==b.keys()
   for key,r in a.items():
    for f in ['game_world_id','competition_key','sm_fixture_id','match_date','home_name','away_name']+(['home_score','away_score'] if resource=='results' else ['match_time']):assert r[f]==b[key][f],(gw,resource,key,f)
   playoff=[r for r in rows if r['competition_key'] and '|playoff|' in r['competition_key']]
   if gw=='GW001' and resource=='results':assert len(playoff)==6 and {r['competition_key'] for r in playoff}=={'GW001|DOMESTIC|playoff|4'}
   report['data'].append({'gw':gw,'resource':resource,'today':data['today'],'raw_world_total':len(raw),'context_total':len(contextual),'received':len(rows),'past_excluded':data['past_excluded'],'undated_excluded':data['undated_excluded'],'past_shown':sum(r['match_date']<data['today'] for r in rows if r['match_date']),'today_shown':sum(r['match_date']==data['today'] for r in rows),'future_shown':sum(r['match_date']>data['today'] for r in rows if r['match_date']),'country_counts':{k:sum(r['sm_country']==k for r in rows) for k in ['ENG','ESP','GER','ITA']} if gw=='GW007' else None,'sample':rows[:2],'playoff':playoff,'independent_gateway_comparison':'PASS'})
   print(gw,resource,len(rows),'verified against Site',flush=True)
 report['pass']=True
try:main()
finally:Path('results-schedule-live-evidence.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
