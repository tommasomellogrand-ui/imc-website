import json,time,urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
base='https://www.italianmastersclub.it/nexus/'
def get(path):
    for attempt in range(3):
        try:
            req=urllib.request.Request(base+path+('&' if '?' in path else '?')+'verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
            with urllib.request.urlopen(req,timeout=45) as response:
                assert response.status==200 and not response.headers.get('WWW-Authenticate')
                return response.read()
        except Exception:
            if attempt==2: raise
            time.sleep(2)
for path in ['index.html','public/site.js','public/site.css']:
    assert get(path)==Path('nexus/'+path).read_bytes(), 'Live file mismatch: '+path
print('PUBLIC_SITE_BYTES_OK')
def check(route):
    world,resource=route
    d=json.loads(get(f'public/data.php?world={world}&resource={resource}&limit=1'))
    assert d['ok'] and d['version']=='nexus-public-2' and d['world']==world and d['resource']==resource
    assert all(r['game_world_id']==world for r in d['rows'])
    if resource=='match_report' and d['rows']:
        report=json.loads(get(f"public/data.php?world={world}&resource=match_report&fixture={d['rows'][0]['sm_fixture_id']}"))
        assert report['ok'] and report['rows'] and 'players_json' in report['rows'][0]
    return world,resource,d['total']
with ThreadPoolExecutor(max_workers=4) as pool:
    for row in pool.map(check,[(f'GW{i:03}',r) for i in range(1,11) for r in ['results','match_report','schedule','transfers']]): print('LIVE_ROUTE_OK',*row)
