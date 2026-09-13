#!/usr/bin/env python3
"""IMC-ENG-009-07: read-only bridge acquisition, validation and atomic local import.

Run --acquire with SUPABASE_ACCESS_TOKEN, or --input with recorded bridge envelopes.
No credentials are written to disk. Only SELECT is sent to Aruba.
"""
import argparse, datetime, hashlib, json, os, pathlib, re, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
PROJECT = 'toanuzojdkfjgucztpze'
GW = 'GW001'

def require(test, message):
    if not test:
        raise ValueError(message)

def bridge(target, sql):
    require(target in ('core', 'custom') and sql.startswith('SELECT '), 'read_only_scope')
    token = os.environ['SUPABASE_ACCESS_TOKEN']
    def pg(query):
        req = urllib.request.Request(f'https://api.supabase.com/v1/projects/{PROJECT}/database/query',
            data=json.dumps({'query': query}).encode(), headers={'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    query = "SELECT private.imc_aruba_request(jsonb_build_object('action','query','target','%s','sql','%s')) AS request_id" % (target, sql.replace("'", "''"))
    request_id = int(pg(query)[0]['request_id'])
    for _ in range(60):
        rows = pg(f'SELECT status_code,content FROM net._http_response WHERE id={request_id}')
        if rows:
            require(rows[0]['status_code'] == 200, 'bridge_http_error')
            result = json.loads(rows[0]['content'])
            require(result.get('ok'), 'bridge_query_error')
            return result
        time.sleep(1)
    raise TimeoutError('bridge_timeout')

def acquire():
    exports, queries = {}, []
    def read(name, target, sql):
        exports[name] = bridge(target, sql)
        queries.append({'name': name, 'target': target, 'sql': sql})
        return exports[name]['result']['rows']
    definitions = {
        'world': "SELECT * FROM `IMC Game World Codex Global` WHERE `IMC GW`='GW001'",
        'membership': "SELECT * FROM `IMC Game World Club Mapping` WHERE `Game World`='GW001'",
        'nations_mapping': "SELECT * FROM `IMC Game World National Team Mapping` WHERE `Game World`='GW001'",
        'clubs': "SELECT c.* FROM `IMC Club Codex Global` c JOIN `IMC Game World Club Mapping` m ON m.`Club ID`=c.id WHERE m.`Game World`='GW001'",
        'nations': "SELECT n.* FROM `IMC National Team Codex Global` n JOIN `IMC Game World National Team Mapping` m ON m.`National Team ID`=n.id WHERE m.`Game World`='GW001'",
        'managers': "SELECT DISTINCT m.* FROM `IMC Manager Codex Global` m JOIN `IMC Manager Assignment Global` a ON a.manager_id=m.manager_id WHERE a.game_world_id='GW001'",
        'assignments': "SELECT * FROM `IMC Manager Assignment Global` WHERE game_world_id='GW001'",
        'competitions': "SELECT * FROM `IMC Competition Codex Global` WHERE game_world_id='GW001'",
        'countries': 'SELECT * FROM `IMC Country Codex Global`',
    }
    for name, sql in definitions.items():
        read(name, 'core', sql)
    read('world_clubs', 'custom', "SELECT * FROM gw_world_clubs WHERE game_world_id='GW001' AND division_value IS NOT NULL")
    ids = json.loads(read('player_ids', 'custom', "SELECT JSON_ARRAYAGG(p.sm_player_id) AS ids FROM (SELECT DISTINCT p.sm_player_id FROM `IMC Site Match Report` m JOIN JSON_TABLE(m.players_json,'$[*]' COLUMNS (sm_player_id BIGINT PATH '$.sm_player_id')) p WHERE m.game_world_id='GW001') p")[0]['ids'])
    for start in range(0, len(ids), 400):
        id_list = ','.join(str(int(i)) for i in ids[start:start+400])
        for name, table, key in [('players','IMC Player Codex Global','id'), ('player_data','IMC Player Codex Global Data','player_id'), ('history','IMC Player Codex Global Rating History','player_id')]:
            sql = f'SELECT * FROM `{table}` WHERE {key} IN ({id_list}) ORDER BY {key}'
            if name != 'history':
                read(f'{name}_{start}', 'core', sql)
            else:
                offset = 0
                while True:
                    rows = read(f'history_{start}page{offset}', 'core', sql+f',id LIMIT 500 OFFSET {offset}')
                    if len(rows) < 500:
                        break
                    offset += 500
    return {'game_world_id': GW, 'acquired_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'queries': queries, 'exports': exports}

def validate(s):
    require(s.get('schema_version') == 1 and s.get('game_world_id') == GW, 'snapshot_scope')
    require(bool(s.get('generated_at')) and bool(s.get('version')), 'snapshot_metadata')
    names = ('world','membership','nations_mapping','clubs','nations','managers','assignments','competitions','countries','players','player_data','history','teams','player_ids')
    for name in names:
        require(isinstance(s.get(name), list), 'missing_collection:'+name)
        require(s['counts'].get(name) == len(s[name]), 'count_mismatch:'+name)
    require(len(s['world']) == 1 and s['world'][0]['IMC GW'] == GW, 'world_scope')
    require(len(s['membership']) == int(s['world'][0]['Active Club']), 'membership_count')
    for name, field in [('membership','Game World'),('nations_mapping','Game World'),('assignments','game_world_id'),('competitions','game_world_id'),('teams','game_world_id')]:
        require(all(r.get(field) == GW for r in s[name]), 'cross_world:'+name)
    def unique(name, key):
        ids = [str(r.get(key, '')) for r in s[name]]
        require(all(i not in ('','None') for i in ids) and len(set(ids)) == len(ids), 'invalid_ids:'+name)
        return set(ids)
    clubs, nations = unique('clubs','id'), unique('nations','id')
    managers, players = unique('managers','manager_id'), unique('players','id')
    teams = unique('teams','team_id')
    unique('teams','sm_world_club_id'); unique('teams','sm_club_id')
    unique('assignments','id'); unique('competitions','id'); unique('history','id'); unique('player_data','player_id')
    require({str(r['Club ID']) for r in s['membership']} == clubs, 'club_reference')
    require({str(r['National Team ID']) for r in s['nations_mapping']} == nations, 'nation_reference')
    require({str(r['sm_club_id']) for r in s['teams']} == {str(r['SM Club ID']) for r in s['membership']}, 'team_membership')
    require(set(map(str,s['player_ids'])) == players, 'player_identity_coverage')
    for a in s['assignments']:
        require(a.get('manager_id') in managers and a.get('start_date'), 'assignment_reference')
        if a['assignment_type'] == 'club':
            require(str(a.get('team_id')) in teams and bool(a.get('team_name')), 'assignment_team')
        else:
            require(str(a.get('national_team_id')) in nations, 'assignment_nation')
    for name in ('player_data','history'):
        require(all(str(r.get('player_id')) in players for r in s[name]), 'player_reference:'+name)
    for c in s['competitions']:
        require(c.get('competition_key') is None or c['competition_key'].startswith(GW+'|'), 'competition_scope')
    require({f'GW001|DOMESTIC|playoff|{d}' for d in (2,3,4)} <= {r.get('competition_key') for r in s['competitions']}, 'playoff_missing')
    require(s['source_counts'] == {n:len(s[n]) for n in names if n != 'teams'}, 'incomplete_snapshot')
    return s

def generate(envelope, crosswalk):
    require(envelope.get('game_world_id') == GW, 'input_scope')
    exports = envelope['exports']
    def rows(name):
        r = exports[name]
        require(r.get('ok') and not r['result']['truncated'], 'incomplete_export:'+name)
        require(r['result']['returned_rows'] == len(r['result']['rows']), 'export_count:'+name)
        return r['result']['rows']
    s = {'schema_version':1, 'game_world_id':GW, 'generated_at':envelope['acquired_at'], 'version':envelope['acquired_at'], 'source':'MySQL Aruba via IMC Nexus', 'bridge_project':PROJECT}
    for name in ('world','membership','nations_mapping','clubs','nations','managers','assignments','competitions','countries'):
        s[name] = rows(name)
    for name in ('players','player_data','history'):
        keys = [k for k in exports if k.startswith(name+'_') and (name != 'history' or 'page' in k or not exports[k]['result']['truncated'])]
        s[name] = [r for k in keys for r in rows(k)]
    s['player_ids'] = json.loads(rows('player_ids')[0]['ids'])
    old = {str(r['team_id']):r for r in crosswalk['assignments'] if r['game_world_id'] == GW and r.get('team_id')}
    live = {str(r['world_club_id']):r for r in rows('world_clubs')}
    s['teams'] = []
    for tid in sorted({str(a['team_id']) for a in s['assignments'] if a['assignment_type']=='club'}, key=int):
        require(tid in old, 'missing_explicit_crosswalk:'+tid)
        r = old[tid]
        current = live.get(str(r['sm_world_club_id']))
        require(current is not None, 'world_instance_missing:'+tid)
        require(current['logo_src'].endswith('/'+str(r['sm_club_id'])+'.png'), 'crosswalk_logo_mismatch:'+tid)
        require(all(a['team_name']==r['team_name'] for a in s['assignments'] if str(a.get('team_id'))==tid), 'crosswalk_name_mismatch:'+tid)
        s['teams'].append({'game_world_id':GW,'team_id':tid,'team_name':r['team_name'],'sm_club_id':str(r['sm_club_id']),'sm_world_club_id':str(r['sm_world_club_id']),'source_name':current['club_name'],'division':current['division_value']})
    s['crosswalk_provenance'] = {'source':'api/imc-data/v1/manager-assignments.json', 'generated_at':crosswalk['generated_at'], 'use':'Identifiers only; assignment facts come exclusively from current CORE. Validated against current CORE team names/membership and custom gw_world_clubs instance/logo IDs.'}
    names = ('world','membership','nations_mapping','clubs','nations','managers','assignments','competitions','countries','players','player_data','history','teams','player_ids')
    s['counts'] = {n:len(s[n]) for n in names}
    s['source_counts'] = {n:len(s[n]) for n in names if n != 'teams'}
    s['limits'] = {'national_reports':'Not loaded; excluded','player_details_missing':len(s['players'])-len(s['player_data']), 'country_relation':'Global reference dictionary; no inferred join from labels','competition_keys_null':sum(c['competition_key'] is None for c in s['competitions'])}
    return validate(s)

def import_snapshot(s, output):
    validate(s)
    output.mkdir(parents=True, exist_ok=True)
    data = (json.dumps(s,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
    digest = hashlib.sha256(data).hexdigest()
    name = 'core.'+digest[:16]+'.json'
    (output/name).write_bytes(data)
    manifest = {'schema_version':1,'game_world_id':GW,'file':name,'sha256':digest,'generated_at':s['generated_at'],'counts':s['counts']}
    temp = output/'core-manifest.tmp'
    temp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temp.replace(output/'core-manifest.json')
    return manifest

if __name__ == '__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--input',type=pathlib.Path)
    p.add_argument('--acquire',action='store_true')
    p.add_argument('--validate',type=pathlib.Path)
    p.add_argument('--output',type=pathlib.Path,default=ROOT/'data')
    args=p.parse_args()
    if args.validate:
        validate(json.loads(args.validate.read_text(encoding='utf-8')))
        print('Snapshot valid')
    else:
        envelope=acquire() if args.acquire else json.loads(args.input.read_text(encoding='utf-8'))
        crosswalk=json.loads((ROOT.parents[1]/'api/imc-data/v1/manager-assignments.json').read_text(encoding='utf-8'))
        print(json.dumps(import_snapshot(generate(envelope,crosswalk),args.output),indent=2))
