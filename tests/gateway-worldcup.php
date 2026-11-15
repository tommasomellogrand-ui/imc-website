<?php
declare(strict_types=1);
require __DIR__.'/../imc-universal-gateway/core.php';
require __DIR__.'/../imc-universal-gateway/worldcup-automation.php';
function wc_check(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$schedule=json_decode(file_get_contents(__DIR__.'/fixtures/worldcup-schedule.json'),true,512,JSON_THROW_ON_ERROR);
$m=json_decode(file_get_contents(__DIR__.'/../database-migrations/20261115_worldcup_automation.json'),true,512,JSON_THROW_ON_ERROR);
$seasons=[['imc_season'=>2,'imc_season_start_date'=>'2026-09-15'],['imc_season'=>3,'imc_season_start_date'=>'2026-11-14']];
$wrong=$schedule;foreach($wrong as &$r){$r['sm_action']='interqualifier';$r['competition_key']='IMC002|NATIONS|interqualifier';$r['competition_stage']='Qualificazioni';$r['imc_season']=$r['match_date']<'2026-11-14'?2:3;}unset($r);
wc_check(count(imc_wc_detect($wrong)['editions'])===1,'48 mislabelled schedules must be detected');
wc_check(imc_wc_detect(array_slice($wrong,0,32))['editions']===[],'Incomplete schedule must wait');
$invalid=$wrong;$invalid[0]['away_sm_team_id']=$invalid[0]['home_sm_team_id'];wc_check(imc_wc_detect($invalid)['editions']===[],'Invalid participants must fail');
$qualifiers=[];for($day=0;$day<10;$day++)for($group=0;$group<16;$group++)for($game=0;$game<2;$game++)$qualifiers[]=['sm_action'=>'interqualifier','sm_fixture_id'=>100000+$day*32+$group*2+$game,'match_date'=>sprintf('2026-10-%02d',$day+1),'home_sm_team_id'=>$group*5+(($day+$game*2)%5)+1,'away_sm_team_id'=>$group*5+(($day+$game*2+1)%5)+1];
wc_check(imc_wc_detect($qualifiers)['editions']===[],'Qualifiers with a bye must stay qualifiers');
echo "PASS recognition: complete groups, incomplete import, invalid teams, 10-day qualifiers.\n";
if(!getenv('IMC_WC_TEST_MYSQL'))exit;
$p=new PDO('mysql:host=127.0.0.1;port=3306','root','imc-normalizer-ci-only',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$p->exec('CREATE DATABASE imc_worldcup_test');$p->exec('USE imc_worldcup_test');
foreach($m['tables'] as $sql)$p->exec($sql);
$columns=json_decode(file_get_contents(__DIR__.'/fixtures/worldcup-columns.json'),true,512,JSON_THROW_ON_ERROR);
foreach($m['worlds'] as $world=>$triggers){
 foreach(['Schedule','Results','Match_Reports'] as $repository){$ddl=[];foreach($columns[$repository] as $c)$ddl[]='`'.$c['COLUMN_NAME'].'` '.$c['COLUMN_TYPE'].' NULL';$p->exec("CREATE TABLE {$world}_{$repository} (".implode(',',$ddl).')');}
 foreach($triggers as $sql)$p->exec($sql);
}
function wc_insert(PDO $p,string $table,array $row):void{$fields=array_keys($row);$q=$p->prepare('INSERT INTO '.$table.' (`'.implode('`,`',$fields).'`) VALUES ('.implode(',',array_fill(0,count($fields),'?')).')');$q->execute(array_values($row));}
foreach($wrong as $row)wc_insert($p,'IMC002_Schedule',$row);
$first=$wrong[0];$mr=['game_world_id'=>'GW005','sm_fixture_id'=>$first['sm_fixture_id'],'competition_key'=>'GW005|NATIONS|interqualifier','sm_action'=>'interqualifier','competition_group'=>'NATIONS','competition_stage'=>'Qualificazioni','match_date'=>$first['match_date'],'home_sm_club_id'=>$first['home_sm_team_id'],'away_sm_club_id'=>$first['away_sm_team_id'],'home_name'=>$first['home_name'],'away_name'=>$first['away_name'],'home_score'=>3,'away_score'=>1,'fingerprint'=>hash('sha256','first-report'),'imported_at'=>'2026-11-15 10:00:00'];
wc_insert($p,'IMC002_Match_Reports',$mr);
wc_check((int)$p->query('SELECT COUNT(*) FROM IMC002_Results')->fetchColumn()===0,'Report must wait for schedule recognition');
$r=imc_wc_import($p,'IMC002_Schedule',true,fn()=>0,$seasons);
wc_check($r['normalization']['worldcup']['registered_fixtures']===48,'All 48 fixtures registered');
$result=$p->query('SELECT * FROM IMC002_Results')->fetch();wc_check($result['sm_action']==='worldcup'&&(int)$result['imc_season']===2&&(int)$result['home_score']===3,'Late schedules must backfill result and origin season');
wc_check((int)$p->query("SELECT COUNT(*) FROM IMC002_Schedule WHERE sm_action='worldcup' AND imc_season=2")->fetchColumn()===48,'All schedules retain origin season across rollover');
wc_insert($p,'IMC002_Match_Reports',$mr);wc_check((int)$p->query('SELECT COUNT(*) FROM IMC002_Results')->fetchColumn()===1,'Report reimport must not duplicate Result');
$p->exec('UPDATE IMC002_Match_Reports SET home_score=4');wc_check((int)$p->query('SELECT home_score FROM IMC002_Results')->fetchColumn()===4,'Single report correction updates Result');
$second=$wrong[1];$single=$mr;$single['sm_fixture_id']=$second['sm_fixture_id'];$single['home_sm_club_id']=$second['home_sm_team_id'];$single['away_sm_club_id']=$second['away_sm_team_id'];$single['fingerprint']=hash('sha256','second-report');wc_insert($p,'IMC002_Match_Reports',$single);wc_check((int)$p->query('SELECT COUNT(*) FROM IMC002_Results')->fetchColumn()===2,'Each new single report creates one Result');
$mismatch=$mr;$mismatch['home_sm_club_id']=999;$mismatch['fingerprint']=hash('sha256','mismatch');wc_insert($p,'IMC002_Match_Reports',$mismatch);wc_check((int)$p->query('SELECT home_score FROM IMC002_Results ORDER BY sm_fixture_id LIMIT 1')->fetchColumn()===4,'Conflicting report must not change Result');
// Ordinary knockout Results must keep their score and inherit the edition season from schedules.
$ko=$first;$ko['sm_fixture_id']=9990001;$ko['match_date']='2026-11-16';$ko['sm_action']='worldcup';$ko['imc_season']=3;$ko['competition_stage']='Ottavi di finale';$ko['competition_round']='Ottavi di finale';$ko['fingerprint']=hash('sha256','ko');wc_insert($p,'IMC002_Schedule',$ko);
imc_wc_import($p,'IMC002_Schedule',true,fn()=>0,$seasons);
$koResult=$mr;$koResult['sm_fixture_id']=$ko['sm_fixture_id'];$koResult['match_date']=$ko['match_date'];$koResult['competition_stage']='Ottavi di finale';$koResult['competition_round']='Ottavi di finale';$koResult['sm_action']='worldcup';$koResult['imc_season']=3;unset($koResult['fingerprint']);wc_insert($p,'IMC002_Results',$koResult);imc_wc_sync_results($p,imc_wc_target('IMC002_Results'));
wc_check((int)$p->query('SELECT imc_season FROM IMC002_Results WHERE sm_fixture_id=9990001')->fetchColumn()===2,'Knockout import must use origin season');
$again=imc_wc_import($p,'IMC002_Schedule',true,fn()=>0,$seasons);wc_check($again['normalization']['worldcup']['schedule_updated']===0,'Reconciliation must be idempotent');
// Trigger behavior is identical in all ten worlds, including direct repository inserts.
foreach(array_keys($m['worlds']) as $world){if($world==='IMC002')continue;$f=$p->query("SELECT * FROM IMC_World_Cup_Fixtures WHERE world_id='IMC002' AND group_name IS NOT NULL ORDER BY sm_fixture_id LIMIT 1")->fetch();$f['world_id']=$world;wc_insert($p,'IMC_World_Cup_Fixtures',$f);$r=$mr;$r['game_world_id']=$world;wc_insert($p,$world.'_Match_Reports',$r);wc_check((int)$p->query("SELECT COUNT(*) FROM {$world}_Results WHERE sm_action='worldcup' AND imc_season=2")->fetchColumn()===1,'Missing trigger behavior in '.$world);}
echo "PASS MySQL: late schedules, single reports, reimports, score corrections, mismatches, season rollover, knockouts and all ten worlds.\n";
