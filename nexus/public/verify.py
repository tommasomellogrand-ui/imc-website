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
for path in ['index.html','public/site.js','public/site.css','public/hub-logic.js']:
    assert get(path)==Path('nexus/'+path).read_bytes(), 'Live file mismatch: '+path
print('PUBLIC_SITE_BYTES_OK')
def check(route):
    world,resource=route
    if resource=='results':
        directory=json.loads(get(f'public/data.php?world={world}&resource=directory'))
        assert directory['ok'] and directory['core']['world']['game_world_id']==world
        assert all(k in directory['core'] for k in ['clubs','managers','competitions'])
    d=json.loads(get(f'public/data.php?world={world}&resource={resource}&limit=1'))
    assert d['ok'] and d['version']=='nexus-public-2' and d['world']==world and d['resource']==resource
    assert d['core']['source']=='MYSQL_ARUBA_CORE' and d['core']['world']['game_world_id']==world
    assert all(r['game_world_id']==world for r in d['rows'])
    if resource=='match_report' and d['rows']:
        report=json.loads(get(f"public/data.php?world={world}&resource=match_report&fixture={d['rows'][0]['sm_fixture_id']}"))
        assert report['ok'] and report['rows'] and 'players_json' in report['rows'][0]
    return world,resource,d['total']
with ThreadPoolExecutor(max_workers=4) as pool:
    for row in pool.map(check,[(f'GW{i:03}',r) for i in range(1,11) for r in ['results','match_report','schedule','transfers']]): print('LIVE_ROUTE_OK',*row)

# New public sections must remain independently usable in every world.
from urllib.parse import urlencode
for i in range(1,11):
    world=f'GW{i:03}'
    for resource in ['catalog','players']:
        d=json.loads(get('public/data.php?'+urlencode(dict(world=world,resource=resource))))
        assert d['ok'] and d['world']==world and isinstance(d['rows'],list)
        if resource=='catalog' and d['rows']:
            key=d['rows'][0]['competition_key']
            hub=json.loads(get('public/data.php?'+urlencode(dict(world=world,resource='competition',competition=key))))
            assert hub['ok'] and all(r['game_world_id']==world and r['competition_key']==key for r in hub['results']+hub['schedule'])
            stats=json.loads(get('public/data.php?'+urlencode(dict(world=world,resource='stats',competition=key))))
            assert stats['ok'] and isinstance(stats['rows'],list)
        print('PUBLIC_HUB_OK',world,resource,len(d['rows']))
global_players=json.loads(get('public/data.php?world=GW001&resource=players&scope=global&rating_min=90'))
assert global_players['ok'] and all(float(r['rating'])>=90 for r in global_players['rows'])
print('GLOBAL_CODEX_FILTER_OK')

transfers=json.loads(get('public/data.php?world=GW002&resource=transfers&limit=1'))
if transfers['clubs']:
    club=next((c for c in transfers['clubs'] if c['name']=='AS Roma'),transfers['clubs'][0])
    filtered=json.loads(get('public/data.php?'+urlencode(dict(world='GW002',resource='transfers',club=club['id'],limit=5))))
    assert filtered['ok'] and filtered['total']>0
    assert all(str(r['from_sm_world_club_id'])==str(club['id']) or str(r['to_sm_world_club_id'])==str(club['id']) or ('name:'+str(r['club_from']))==club['id'] or ('name:'+str(r['club_to']))==club['id'] for r in filtered['rows'])
    print('TRANSFER_TEAM_FILTER_OK',club['name'],filtered['total'])

# Profiles must use report identities and retain the requested world.
for i in range(1,11):
    world=f'GW{i:03}'
    directory=json.loads(get('public/data.php?'+urlencode(dict(world=world,resource='directory'))))['core']
    if directory['managers']:
        manager=directory['managers'][0]['manager_id']
        profile=json.loads(get('public/data.php?'+urlencode(dict(world=world,resource='manager_profile',manager=manager))))
        assert profile['ok'] and profile['source']=='IMC Site Match Report' and profile['world']==world
        mid=str(profile['manager']['sm_manager_id'])
        assert all(r['game_world_id']==world and mid in [str(r['home_sm_manager_id']),str(r['away_sm_manager_id'])] for r in profile['rows'])
    for kind in ['clubs','nations']:
        if directory[kind]:
            profile=json.loads(get('public/data.php?'+urlencode(dict(world=world,resource='team_profile',teamType=kind,team=directory[kind][0]['id']))))
            assert profile['ok'] and profile['source']=='IMC Site Match Report' and profile['world']==world
            tid=str(profile['team']['sm_team_id'])
            assert all(r['game_world_id']==world and tid in [str(r['home_sm_club_id']),str(r['away_sm_club_id'])] for r in profile['rows'])
    print('REPORT_PROFILES_OK',world)
