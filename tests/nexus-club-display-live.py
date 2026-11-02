"""Read-only smoke checks of the common Nexus club display boundary."""
import concurrent.futures
import json
import sys
import urllib.request
from pathlib import Path

BASE = 'https://www.italianmastersclub.it/nexus/'
URLS = {f'clubs_{i:03d}': f'teams/directory.php?world=GW{i:03d}&type=clubs' for i in range(1, 12)}
URLS.update({
    'nations': 'teams/directory.php?world=GW001&type=nations',
    'context': 'core/context.php?world=GW001',
    'genoa': 'teams/detail.php?world=GW001&type=club&id=94078875',
    'matches': 'teams/matches.php?world=GW001&sm_club=94078875',
    'transfers': 'transfers/index.php?world=GW001&sm_club=94078875&limit=5',
    'standings': 'competitions/standings.php?world=GW001&season=2&competition=GW001%7CDOMESTIC%7Cleague%7C1',
    'home': 'home/data.php?world=GW001&season=2',
    'manager': 'managers/index.php?world=GW001&manager=MNG001',
    'h2h': 'h2h/index.php?world=GW001&kind=club&id=94078875',
})

def get(item):
    name, path = item
    request = urllib.request.Request(BASE + path, headers={'User-Agent': 'IMC-Nexus-Alias-Verify/1.0', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=90) as response:
        data = json.load(response)
        assert data.get('ok') is True, (name, data)
        return name, {'data': data, 'version': response.headers.get('X-Nexus-Club-Names')}

mode, filename = sys.argv[1:3]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    responses = dict(pool.map(get, URLS.items()))
if mode == 'capture':
    Path(filename).write_text(json.dumps(responses, ensure_ascii=False))
    print('Captured', len(responses), 'read-only baseline responses')
else:
    before = json.loads(Path(filename).read_text())
    for name, item in responses.items():
        assert item['version'] == 'core-nexus-view-v1', (name, 'display enrichment not active')
    assert responses['nations']['data'] == before['nations']['data'], 'National directory changed'
    for name in [f'clubs_{i:03d}' for i in range(1, 12)]:
        old, new = before[name]['data'], responses[name]['data']
        assert old['count'] == new['count'], name
        assert [(r['entity_id'], r['world_id']) for r in old['rows']] == [(r['entity_id'], r['world_id']) for r in new['rows']], name
    rows = responses['matches']['data']['results']
    seen = 0
    for row in rows:
        for side in ['home', 'away']:
            if str(row.get(side + '_sm_club_id')) == '94078875':
                assert row[side + '_name'] == 'Genoa', row
                seen += 1
    assert seen, 'No Genoa results checked'
    assert responses['genoa']['data']['team']['name'] == 'Genoa'
    # This endpoint has no volatile timestamps: only the two club labels may differ.
    def result_facts(data):
        return {key: [{k: v for k, v in row.items() if k not in ('home_name', 'away_name')} for row in data[key]] for key in ('results', 'schedule')}
    assert result_facts(before['matches']['data']) == result_facts(responses['matches']['data']), 'Match facts changed'
    for name in responses:
        print('PASS', name)
    print('Verified aliases in', seen, 'Genoa result sides; all 11 GW directories; national names, IDs and match facts unchanged')
