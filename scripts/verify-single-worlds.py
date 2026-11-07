import json,urllib.request,concurrent.futures,sys,time
from pathlib import Path
worlds=json.loads(Path('scripts/single-worlds.json').read_text())
if len(sys.argv)>1:worlds=[w for w in worlds if w['slug']==sys.argv[1]]
base='https://www.italianmastersclub.it'
def get(path):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(base+path+('&' if '?' in path else '?')+'verify=worlds-v1',timeout=60) as r:return r.read().decode()
  except Exception:
   if attempt==2:raise
def check(w):
 slug=w['slug'];prefix='/'+slug+'/'
 for section in ['', 'matchday/', 'managers/','clubs/','nations/','competitions/','transfers/','playercodex/','trophyroom/']:
  h=get(prefix+section);assert w['name'].lower() in h.lower(),(slug,section,'identity');assert '/roadtohistory/' not in h,(slug,section,'cross-world link');assert 'Inter' in h
 endpoints=['clubs/directory.php','nations/directory.php','managers/api.php','playercodex/world.php','transfers/data.php','trophyroom/data.php','matchday/data.php','matchday/data.php?mode=schedule']
 for endpoint in endpoints:
  d=json.loads(get(prefix+endpoint));assert d.get('ok') is True,(slug,endpoint,d.get('error'));assert d.get('game_world_id',w['legacy'])==w['legacy'],(slug,endpoint,'wrong world')
  if endpoint=='clubs/directory.php':
   assert d['rows'],(slug,'clubs empty');team=d['rows'][0]['world_id'];detail=json.loads(get(prefix+'clubs/detail.php?id='+str(team)));assert detail.get('ok') and detail.get('team'),(slug,'club detail')
 context=json.loads(get('/nexus/core/context.php?world='+w['legacy']));season=context['current_season'];assert season,(slug,'season')
 catalog=json.loads(get(prefix+'competitions/catalog.php?season='+str(season)));assert catalog.get('ok') and catalog.get('rows'),(slug,'catalog')
 cup=catalog['rows'][0];key=urllib.parse.quote(cup['competition_key'])
 for endpoint in ['results.php','schedule.php','standings.php']:
  d=json.loads(get(prefix+'competitions/'+endpoint+'?season='+str(season)+'&competition='+key));assert d.get('ok'),(slug,endpoint,d.get('error'))
 print('Verified',w['code'],w['name'],flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(check,worlds))
