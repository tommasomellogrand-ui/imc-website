"""Snapshot rejection tests and read-only live acceptance for IMC-ENG-009-07."""
import copy, hashlib, json, os, pathlib, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from snapshot import validate

ROOT=pathlib.Path(__file__).resolve().parent
BASE='https://www.italianmastersclub.it/minisite/GW001/'
manifest=json.loads((ROOT/'data/core-manifest.json').read_text())
snapshot=json.loads((ROOT/'data'/manifest['file']).read_text())

def post(resource, **fields):
    req=urllib.request.Request(BASE+'api.php',data=json.dumps({'game_world_id':'GW001','resource':resource,**fields}).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=60) as response:
        return json.load(response)

def local():
    validate(snapshot)
    assert hashlib.sha256((ROOT/'data'/manifest['file']).read_bytes()).hexdigest()==manifest['sha256']
    mutations=[lambda s:s.update(game_world_id='GW007'),lambda s:s.pop('players'),lambda s:s['assignments'][0].update(game_world_id='GW002'),lambda s:s['teams'][0].update(team_id='999999'),lambda s:s['players'].pop(),lambda s:s['history'][0].update(player_id='99999999'),lambda s:s['competitions'].pop()]
    for mutate in mutations:
        s=copy.deepcopy(snapshot);mutate(s)
        try:validate(s)
        except (ValueError,KeyError):pass
        else:raise AssertionError('Invalid snapshot accepted')
    assert len(snapshot['teams'])==40
    a=[a for a in snapshot['assignments'] if a['manager_id']=='MNG048' and a['assignment_type']=='club']
    assert any(a['team_id']=='146' and a['team_name']=='Club América' and a['start_date']=='2026-08-23' and a['end_date']=='2026-08-24' for a in a)
    for name in ['core-app.js','core-views.js','live-fixtures.js','data-client.js','fixtures-controller.js']:
        text=(ROOT/name).read_text()
        assert 'GW007/api' not in text and 'exploration-data.js' not in text
    print('PASS: snapshot, 7 rejection cases, namespace references, historical Trovato assignment')

def live():
    evidence={'case_id':'IMC-ENG-009-07','commit':os.environ.get('GITHUB_SHA'),'files':[]}
    for name in json.loads((ROOT/'deploy-files.json').read_text()):
        if name.endswith('.php'):continue
        with urllib.request.urlopen(BASE+name+'?verify='+os.environ.get('GITHUB_SHA','local'),timeout=60) as response:content=response.read()
        assert content==(ROOT/name).read_bytes(),name
        evidence['files'].append(name)
    seasons=post('seasons')
    assert seasons['ok'] and seasons['game_world_id']=='GW001' and seasons['source']=='IMC Game World Season'
    assert seasons['timezone']=='Europe/Rome'
    first=next(s for s in seasons['seasons'] if s['imc_season']==1)
    assert first['imc_season_start_date']=='2026-07-12' and first['imc_season_end_date']=='2026-09-20'
    assert first['soccer_manager_season'] is None
    for s in seasons['seasons']:
        assert s['game_world_id']=='GW001'
        assert s['is_current']==bool(s['imc_season_start_date'] and s['imc_season_end_date'] and s['imc_season_start_date']<=seasons['today']<=s['imc_season_end_date'])
    current=[s for s in seasons['seasons'] if s['is_current']]
    assert seasons['current_season']==(current[0] if len(current)==1 else None)
    evidence['season_state']=seasons
    results=post('results');schedule=post('schedule');rows=results['rows']
    assert results['ok'] and len(rows)==results['total'] and results['next_offset'] is None
    assert len({r['sm_fixture_id'] for r in rows})==len(rows)
    assert all(r['game_world_id']=='GW001' and r['competition_key'].startswith('GW001|') for r in rows)
    assert all(r['match_date']>=schedule['today'] for r in schedule['rows'])
    assert schedule['source_total']==schedule['total']+schedule['past_excluded']+schedule['undated_excluded']
    assert all(r['home_identity'] and r['away_identity'] for r in rows)
    clubs=[r for r in rows if r['match_report_available']]
    nations=[r for r in rows if r['competition_group']=='NATIONS']
    assert len(clubs)==477 and len(nations)==320 and len(rows)==797
    assert all(not r['match_report_available'] for r in nations)
    def check(r):
        data=post('match_report',sm_fixture_id=r['sm_fixture_id']);m=data['report']
        assert m and m['game_world_id']=='GW001' and m['sm_fixture_id']==r['sm_fixture_id']
        for k in ['competition_key','home_sm_club_id','away_sm_club_id','home_score','away_score','match_date']:assert m[k]==r[k],(r['sm_fixture_id'],k)
        return {'fixture':r['sm_fixture_id'],'status':data['report_status'],'quality':data['quality']}
    with ThreadPoolExecutor(max_workers=4) as pool:evidence['reports']=list(pool.map(check,clubs))
    national=post('match_report',sm_fixture_id=nations[0]['sm_fixture_id']);assert national['report'] is None and national['report_status']=='national_not_loaded'
    for body,status in [({'resource':'results','game_world_id':'GW007'},422),({'resource':'match_report','sm_fixture_id':'999999999'},404),({'resource':'results','revision':'old'},409)]:
        try:post(**body)
        except urllib.error.HTTPError as e:assert e.code==status,(body,e.code)
        else:raise AssertionError('Invalid request accepted')
    playoffs=[r for r in rows if '|playoff|' in r['competition_key']]
    assert len(playoffs)==6 and {r['competition_key'] for r in playoffs}=={f'GW001|DOMESTIC|playoff|{d}' for d in (2,3,4)}
    special=post('match_report',sm_fixture_id='367418923')
    assert 'home_manager_source_conflict' in special['quality']
    assert special['report']['home_manager_id']=='MNG048'
    assert any(a['manager_id']=='MNG048' and a['team_id']=='146' for a in special['fixture']['home_historical_assignments'])
    evidence.update(results=len(rows),schedule_source=schedule['source_total'],schedule_visible=schedule['total'],schedule_past_excluded=schedule['past_excluded'],club_reports=len(clubs),national_results=len(nations),national_reports=0,playoffs=[r['sm_fixture_id'] for r in playoffs],pass_live=True)
    (ROOT/'live-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in evidence.items() if k not in ('files','reports')}))

if __name__=='__main__':
    local()
    if '--live' in sys.argv:live()
