<?php
declare(strict_types=1);
function verify_report_key(bool $ok,string $why):void{if(!$ok)throw new RuntimeException($why);}
$db=new PDO('mysql:host=127.0.0.1;port=3306','root',getenv('MYSQL_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$db->exec('CREATE DATABASE report_edition_keys');$db->exec('USE report_edition_keys');
$registry=json_decode(file_get_contents(__DIR__.'/../database-migrations/20261115_worldcup_automation.json'),true,512,JSON_THROW_ON_ERROR);
foreach($registry['tables'] as $sql)$db->exec($sql);
$columns=json_decode(file_get_contents(__DIR__.'/fixtures/worldcup-columns.json'),true,512,JSON_THROW_ON_ERROR);
foreach(range(1,8) as $number){
    $world=sprintf('IMC%03d',$number);
    foreach(['Results','Match_Reports'] as $repository){
        $ddl=array_map(static fn($c)=>'`'.$c['COLUMN_NAME'].'` '.$c['COLUMN_TYPE'].' NULL',$columns[$repository]);
        $db->exec("CREATE TABLE {$world}_{$repository} (".implode(',',$ddl).')');
    }
    $plan=json_decode(file_get_contents(__DIR__.'/../database-migrations/match-report-keys-20261117/'.$world.'.json'),true,512,JSON_THROW_ON_ERROR);
    foreach($plan['statements'] as $sql)$db->exec($sql);
    $db->exec("INSERT INTO IMC_World_Cup_Editions(world_id,imc_season,edition_start) VALUES ('$world',1,'2026-10-01')");
    $db->exec("INSERT INTO IMC_World_Cup_Fixtures(world_id,sm_fixture_id,imc_season,edition_start,match_date,home_id,away_id,group_name,competition_stage,competition_round) VALUES ('$world',101,1,'2026-10-01','2026-10-01',11,22,'A','Group Stage','Girone A'),('$world',102,1,'2026-10-01','2026-10-01',33,44,'A','Group Stage','Girone A')");
    $db->exec("INSERT INTO {$world}_Match_Reports(game_world_id,sm_fixture_id,competition_key,sm_action,imc_season,match_date,home_sm_club_id,away_sm_club_id,home_score,away_score,players_json,fingerprint) VALUES ('$world',101,'$world|NATIONS|worldcup','worldcup',1,'2026-10-01',11,22,3,1,'[{\"player\":1}]','report-one'),('$world',102,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[{\"player\":2}]','sparse-report')");
    // A key-only operation must never replay report scores over existing Results.
    $db->exec("INSERT INTO {$world}_Results(game_world_id,sm_fixture_id,competition_key,imc_season,home_score,away_score,fingerprint) VALUES ('$world',101,'$world|S01|NATIONS|worldcup',1,7,2,'existing-result')");
    $before=$db->query("SELECT * FROM {$world}_Match_Reports ORDER BY sm_fixture_id")->fetchAll();
    $resultBefore=$db->query("SELECT * FROM {$world}_Results")->fetchAll();
    $db->exec("UPDATE {$world}_Match_Reports SET competition_key='$world|S01|NATIONS|worldcup',imc_season=1");
    $after=$db->query("SELECT * FROM {$world}_Match_Reports ORDER BY sm_fixture_id")->fetchAll();
    foreach($after as $i=>$row){
        verify_report_key($row['competition_key']==="$world|S01|NATIONS|worldcup",$world.' retains edition key');
        unset($before[$i]['competition_key'],$before[$i]['imc_season'],$row['competition_key'],$row['imc_season']);
        verify_report_key($before[$i]===$row,$world.' report payload unchanged, including sparse metadata');
    }
    verify_report_key($resultBefore===$db->query("SELECT * FROM {$world}_Results")->fetchAll(),$world.' Results untouched by metadata migration');
    verify_report_key((int)$db->query('SELECT SUM(report_revision) FROM IMC_World_Cup_Fixtures')->fetchColumn()===0,$world.' metadata update does not replay results');
    // Real report corrections must still update the matching Result and its key.
    $db->exec("UPDATE {$world}_Match_Reports SET home_score=4 WHERE sm_fixture_id=101");
    $corrected=$db->query("SELECT * FROM {$world}_Results WHERE sm_fixture_id=101")->fetch();
    verify_report_key((int)$corrected['home_score']===4&&$corrected['competition_key']==="$world|S01|NATIONS|worldcup",$world.' genuine report correction still propagates with edition identity');
    $db->exec('UPDATE IMC_World_Cup_Fixtures SET report_revision=0');
    echo $world." PASS metadata-only migration, sparse season resolution, real score correction.\n";
}
