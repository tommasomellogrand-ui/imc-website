<?php
declare(strict_types=1);
require __DIR__.'/gateway-worldcup.php';
if(!getenv('IMC_WC_TEST_MYSQL'))exit;
// Existing tests build the disposable schema; add only the new Schedule field.
$p->exec('ALTER TABLE IMC007_Schedule ADD COLUMN competition_group_name VARCHAR(128) NULL');
$new=$schedule[0];$new['game_world_id']='IMC007';$new['sm_fixture_id']=991234567;
$new['competition_key']='IMC007|S01|NATIONS|worldcup';$new['sm_action']='worldcup';$new['imc_season']=1;
$new['competition_group']='NATIONS';$new['competition_group_name']='Girone Z';$new['competition_stage']='Group Stage';
$new['match_date']='2026-11-30';
wc_check(imc_wc_selected_edition($new),'Selected edition key recognized');
wc_check(imc_wc_detect([$new])['editions']===[],'Selected edition must bypass date-based inference');
imc_wc_import($p,'IMC007_Schedule',true,function()use($p,$new){wc_insert($p,'IMC007_Schedule',$new);return 1;},$seasons);
$saved=$p->query('SELECT * FROM IMC007_Schedule WHERE sm_fixture_id=991234567')->fetch();
wc_check($saved['competition_key']===$new['competition_key'] && (int)$saved['imc_season']===1 && $saved['competition_group_name']==='Girone Z','V3 key, origin season and group must survive reconciliation');
echo "PASS Schedule V3: selected World Cup key, season rollover and group survive MySQL reconciliation.\n";
