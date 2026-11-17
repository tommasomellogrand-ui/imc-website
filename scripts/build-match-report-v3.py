"""Build narrowly scoped MR migrations from the audited live definitions.
No row rewrites; World Cup, identity, ghost and revision triggers stay intact.
"""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
before=json.loads((root/'tests/fixtures/match-report-before-v3.json').read_text())
triggers=before['triggers']
for n in range(1,9):
    w=f'IMC{n:03d}';table=w+'_Match_Reports';legacy=f'gw{n:03d}'
    sql=[f'ALTER TABLE `{table}` ADD COLUMN `competition_group_name` VARCHAR(128) NULL AFTER `competition_group`, ADD UNIQUE KEY `imc_report_fixture` (`game_world_id`,`sm_fixture_id`)']
    for name in [t['TRIGGER_NAME'] for t in triggers if t['EVENT_OBJECT_TABLE']==table and re.match(r'imc_(mr_fill_results_|mr_country_|results_manager_from_mr_)',t['TRIGGER_NAME'])]:
        sql.append(f'DROP TRIGGER IF EXISTS `{name}`')
    fields=['competition_key','imc_season','sm_action','sm_division','competition_group','competition_group_name','competition_stage','competition_round','match_date','home_sm_club_id','home_name','away_sm_club_id','away_name','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score','home_score','away_score']
    assigns=[]
    for field in fields:
        sources=[]
        # Scores and shootouts are actual MR values when supplied; legacy fallback
        # uses Results only. Schedule cannot supply a played score.
        for repo in ['Results','Schedule'] if 'score' not in field else ['Results']:
            col=field.replace('_sm_club_id','_sm_team_id') if repo=='Schedule' else field
            sources.append(f'(SELECT IF(COUNT(*)=1,MAX(r.`{col}`),NULL) FROM `{w}_{repo}` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id)')
        blank=f'NEW.`{field}` IS NULL'
        if field not in ['imc_season','match_date'] and not field.endswith('_id') and 'score' not in field:blank+=f" OR TRIM(NEW.`{field}`)=''"
        assigns.append(f'NEW.`{field}`=IF({blank},COALESCE('+','.join(sources+[f'NEW.`{field}`'])+f'),NEW.`{field}`)')
    for event,suffix in [('INSERT','bi'),('UPDATE','bu')]:
        sql.append(f'CREATE TRIGGER `imc_mr_context_{w.lower()}_{suffix}` BEFORE {event} ON `{table}` FOR EACH ROW FOLLOWS `imc_identity_{w.lower()}_match_reports_{suffix}` SET '+', '.join(assigns))
    for event,suffix in [('INSERT','ai'),('UPDATE','au')]:
        values={}
        for side in ['home','away']:
            value=f'IF(NEW.{side}_sm_manager_id>0,NEW.{side}_sm_manager_id,r.{side}_sm_manager_id)'
            if n==5:value=f"IF(LOWER(r.{side}_name) IN ('forfar athletic','metropolitan police'),NULL,{value})"
            values[side]=value
        guard=" AND (NOT(NEW.home_sm_manager_id <=> OLD.home_sm_manager_id) OR NOT(NEW.away_sm_manager_id <=> OLD.away_sm_manager_id))" if event=='UPDATE' else ''
        sql.append(f'CREATE TRIGGER `imc_mr_managers_{w.lower()}_{suffix}` AFTER {event} ON `{table}` FOR EACH ROW UPDATE `{w}_Results` r SET '+', '.join(f'r.{side}_sm_manager_id={v}' for side,v in values.items())+f' WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id AND (NOT(r.home_sm_manager_id <=> {values["home"]}) OR NOT(r.away_sm_manager_id <=> {values["away"]}))'+guard)
    if n==5:
        view=re.sub(r'CREATE ALGORITHM=UNDEFINED DEFINER=`[^`]+`@`[^`]+`','CREATE OR REPLACE ALGORITHM=UNDEFINED',before['youth_view'])
        view=view.replace('`m`.`competition_key` in (',"REGEXP_REPLACE(`m`.`competition_key`,'^IMC005[|]S[0-9]+[|]','IMC005|') in (")
        sql.append(view)
        for t in triggers:
            if t['TRIGGER_NAME'] not in ['imc005_youth_report_ai','imc005_youth_report_au']:continue
            stmt=t['ACTION_STATEMENT'].replace('r.competition_key IN (',"REGEXP_REPLACE(r.competition_key,'^IMC005[|]S[0-9]+[|]','IMC005|') IN (")
            stmt=stmt.replace("r.competition_key=REPLACE(NEW.competition_key,'IMC005|','IMC005|')",'r.competition_key=NEW.competition_key AND r.imc_season=NEW.imc_season')
            if t['EVENT_MANIPULATION']=='UPDATE':stmt+=' AND (NOT(NEW.players_json <=> OLD.players_json) OR NOT(NEW.home_score <=> OLD.home_score) OR NOT(NEW.away_score <=> OLD.away_score))'
            sql.extend([f'DROP TRIGGER `{t["TRIGGER_NAME"]}`',f'CREATE TRIGGER `{t["TRIGGER_NAME"]}` AFTER {t["EVENT_MANIPULATION"]} ON `{table}` FOR EACH ROW '+stmt])
    payload={'target':'custom','migration_id':f'match-report-v3-{w.lower()}-20261117','allow_destructive':True,'statements':sql}
    assert len(sql)<50 and all(';' not in s for s in sql)
    (root/f'database-migrations/match-report-v3-20261117/{w}.json').write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n')
