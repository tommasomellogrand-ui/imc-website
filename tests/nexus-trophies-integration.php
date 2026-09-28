<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/core/bootstrap.php';
require dirname(__DIR__).'/nexus/trophies/sync.php';
require __DIR__.'/nexus-trophies.php';
$config=['gold_worlds'=>['GW002','GW003','GW007','GW008'],'custom_worlds'=>['GW001','GW004','GW005','GW006','GW009','GW010'],
    'db'=>['host'=>'127.0.0.1','port'=>3306,'user'=>'root','pass'=>getenv('MYSQL_TEST_PASSWORD'),'core'=>'trophy_test_core','gold'=>'trophy_test_gold','custom'=>'trophy_test_custom']];
$root=new PDO('mysql:host=127.0.0.1;port=3306','root',getenv('MYSQL_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
foreach(['core','gold','custom'] as $target)$root->exec('CREATE DATABASE `'.$config['db'][$target].'`');
$core=nexus_db($config,'core');
$core->exec('CREATE TABLE `IMC Game World Club Mapping` (`Game World` VARCHAR(16),`Club Name` VARCHAR(255),`SM World Club ID` BIGINT)');
$core->exec('CREATE TABLE `IMC Competition Codex Global` (game_world_id VARCHAR(16),competition_key VARCHAR(255),sm_action VARCHAR(64),sm_country VARCHAR(128),sm_division VARCHAR(128),teams_count INT,expected_match INT)');
foreach(['gold','custom'] as $target)nexus_db($config,$target)->exec('CREATE TABLE IMC_Game_World_Season (game_world_id VARCHAR(16),imc_season INT,imc_season_start_date DATE,imc_season_end_date DATE)');
$source='(game_world_id VARCHAR(16),imc_season INT,competition_key VARCHAR(255),sm_action VARCHAR(64),sm_country VARCHAR(128),sm_division VARCHAR(128),competition_group VARCHAR(64),competition_group_name VARCHAR(128),competition_stage VARCHAR(128),competition_round VARCHAR(128),sm_fixture_id BIGINT,home_sm_club_id BIGINT,away_sm_club_id BIGINT,home_name VARCHAR(255),away_name VARCHAR(255),home_score INT,away_score INT,penalty_home_score INT,penalty_away_score INT,aggregate_home_score INT,aggregate_away_score INT,match_date DATE,result_status VARCHAR(64)) ENGINE=InnoDB';
$trophy='(id BIGINT AUTO_INCREMENT PRIMARY KEY,game_world_id VARCHAR(16),imc_season INT NOT NULL,competition_key VARCHAR(255) NOT NULL,competition_group VARCHAR(64),trophy_type VARCHAR(64),sm_country VARCHAR(128),sm_division VARCHAR(128),winner_sm_world_club_id BIGINT,winner_name VARCHAR(255),decided_by VARCHAR(32),deciding_fixture_id BIGINT,won_date DATE,date_source VARCHAR(32),source_repository VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB';
for($i=1;$i<=10;$i++) {
    $gw=sprintf('GW%03d',$i);$db=nexus_db($config,nexus_target($config,$gw));
    $db->prepare("INSERT INTO IMC_Game_World_Season VALUES (?,1,'2000-01-01',NULL)")->execute([$gw]);
    foreach(['Results','Match_Report','Schedule'] as $repo)$db->exec('CREATE TABLE '.$gw.'_IMC_'.$repo.' '.$source);
    $db->exec('CREATE TABLE '.$gw.'_IMC_Trophy_Room '.$trophy);
    $core->prepare('INSERT INTO `IMC Competition Codex Global` VALUES (?,NULL,?,NULL,?,?,?)')->execute([$gw,'league','1',4,12]);
}
foreach(json_decode(file_get_contents(dirname(__DIR__).'/docs/trophy-automation-migrations.json'),true) as $plan) {
    $db=nexus_db($config,$plan['target']);foreach($plan['statements'] as $sql)$db->exec($sql);
}
for($i=1;$i<=10;$i++) {
    $gw=sprintf('GW%03d',$i);$db=nexus_db($config,nexus_target($config,$gw));
    $db->exec("UPDATE IMC_Trophy_Sync_State SET enabled=1 WHERE game_world_id='$gw'");
    foreach($league as $r) {
        $r['game_world_id']=$gw;$r['competition_key']=$gw.'|DOMESTIC|league|1';
        $db->prepare('INSERT INTO '.$gw.'_IMC_Results (`'.implode('`,`',array_keys($r)).'`) VALUES ('.implode(',',array_fill(0,count($r),'?')).')')->execute(array_values($r));
    }
    check((int)$db->query("SELECT revision FROM IMC_Trophy_Sync_State WHERE game_world_id='$gw'")->fetchColumn()===13,$gw.' insert triggers revision');
    $db->exec("UPDATE IMC_Trophy_Sync_State SET touched_at=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE game_world_id='$gw'");
    $preview=trophy_sync($config,$db,$gw,true);check(count($preview['awards'])===1,$gw.' dry run winner');
    check((int)$db->query('SELECT COUNT(*) FROM '.$gw.'_IMC_Trophy_Room')->fetchColumn()===0,$gw.' preview never writes');
    $sync=trophy_sync($config,$db,$gw);check($sync['changes']['inserted']===1,$gw.' sync inserts champion');
    $again=trophy_sync($config,$db,$gw);check($again['state']==='current',$gw.' idempotent clean refresh');
    $db->exec('DELETE FROM '.$gw.'_IMC_Results WHERE sm_fixture_id=1');
    $db->exec("UPDATE IMC_Trophy_Sync_State SET touched_at=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE game_world_id='$gw'");
    $sync=trophy_sync($config,$db,$gw);check($sync['changes']['removed']===1,$gw.' deletion revokes incomplete title');
    check((int)$db->query("SELECT COUNT(*) FROM IMC_Trophy_Sync_Log WHERE game_world_id='$gw'")->fetchColumn()===2,$gw.' changes archived');
    $rev=(int)$db->query("SELECT revision FROM IMC_Trophy_Sync_State WHERE game_world_id='$gw'")->fetchColumn();
    $db->beginTransaction();$db->exec('UPDATE '.$gw.'_IMC_Results SET home_score=9 WHERE sm_fixture_id=2');$db->rollBack();
    check((int)$db->query("SELECT revision FROM IMC_Trophy_Sync_State WHERE game_world_id='$gw'")->fetchColumn()===$rev,$gw.' rolled-back import does not dirty queue');
    // Past awards must survive both missing source data and conflicting automatic winners.
    $db->prepare("UPDATE IMC_Game_World_Season SET imc_season_end_date='2000-01-02' WHERE game_world_id=?")->execute([$gw]);
    $db->prepare("INSERT INTO IMC_Game_World_Season VALUES (?,2,'2000-01-03',NULL)")->execute([$gw]);
    foreach (['league|1'=>'IMC Results','leaguecup'=>'SM Honours'] as $key=>$sourceName) {
        $db->prepare("INSERT INTO ".$gw."_IMC_Trophy_Room (game_world_id,imc_season,competition_key,winner_name,source_repository) VALUES (?,1,?,?,?)")->execute([$gw,$gw.'|DOMESTIC|'.$key,'Historical winner',$sourceName]);
    }
    $history=nexus_rows($db,'SELECT * FROM '.$gw.'_IMC_Trophy_Room WHERE imc_season=1 ORDER BY id');
    foreach($league as $r) {
        $r['game_world_id']=$gw;$r['imc_season']=2;$r['competition_key']=$gw.'|DOMESTIC|league|1';
        $db->prepare('INSERT INTO '.$gw.'_IMC_Results (`'.implode('`,`',array_keys($r)).'`) VALUES ('.implode(',',array_fill(0,count($r),'?')).')')->execute(array_values($r));
    }
    $db->exec("UPDATE IMC_Trophy_Sync_State SET touched_at=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE game_world_id='$gw'");
    $sync=trophy_sync($config,$db,$gw);
    check($sync['changes']===['inserted'=>1,'updated'=>0,'removed'=>0],$gw.' current season still derives awards');
    check(nexus_rows($db,'SELECT * FROM '.$gw.'_IMC_Trophy_Room WHERE imc_season=1 ORDER BY id')===$history,$gw.' all historical fields preserved regardless of source');
    $db->prepare('DELETE FROM IMC_Game_World_Season WHERE game_world_id=?')->execute([$gw]);
    $preview=trophy_sync($config,$db,$gw,true);
    check($preview['state']==='current_season_unavailable',$gw.' missing local mapping never falls back to CORE');

}
echo "Trophy integration tests passed for ten worlds\n";
