<?php
declare(strict_types=1);
require __DIR__.'/../nexus/core/bootstrap.php';
require __DIR__.'/../nexus/club-house/engine.php';
function ck(bool $v,string $m): void {if(!$v)throw new RuntimeException($m);}
$people=[['manager_id'=>'MNG001','full_name'=>'One','sm_manager_id'=>100],['manager_id'=>'MNG002','full_name'=>'Two','sm_manager_id'=>200],['manager_id'=>'MNG003','full_name'=>'No ID','sm_manager_id'=>null]];
$map=ch_identity($people);$names=array_column($people,'full_name','manager_id');
$row=['sm_fixture_id'=>1,'imc_season'=>1,'match_date'=>'2026-09-01','competition_key'=>'GW001|DOMESTIC|league|1','competition_group'=>'DOMESTIC','sm_action'=>'league','home_sm_club_id'=>10,'away_sm_club_id'=>20,'home_name'=>'Home','away_name'=>'Away','home_sm_manager_id'=>100,'away_sm_manager_id'=>200,'home_score'=>2,'away_score'=>1,'penalty_home_score'=>null,'penalty_away_score'=>null];
$out=ch_init($people);ch_group($out,[$row,$row],$map,$names,'GW001','MNG001');
ck($out['managers']['MNG001']['stats']['played']===1,'Deduplicate identical reports');ck($out['managers']['MNG002']['stats']['lost']===1,'Away perspective');ck($out['matches'][0]['opponent_id']==='MNG002','IMC H2H identity');
$unknown=array_replace($row,['sm_fixture_id'=>2,'away_sm_manager_id'=>null,'home_score'=>0,'away_score'=>0]);ch_group($out,[$unknown],$map,$names,'GW001','MNG001');ck($out['managers']['MNG001']['stats']['played']===2&&$out['matches'][1]['opponent_id']===null,'Count IMC even without opponent ID');
$national=array_replace($row,['sm_fixture_id'=>3,'competition_group'=>'NATIONS']);ch_group($out,[$national],$map,$names,'GW001','MNG001');ck($out['managers']['MNG001']['stats']['played']===2,'Exclude nations');
$conflict=array_replace($row,['home_score'=>3]);ch_group($out,[$row,$conflict],$map,$names,'GW001','MNG001');ck($out['managers']['MNG001']['excluded']===1,'Exclude contradictory duplicate');
$other=ch_init($people);ch_group($other,[$row],$map,$names,'GW002','MNG001');ck($other['managers']['MNG001']['stats']['played']===1,'Same fixture in another GW stays separate');
$penalties=array_replace($row,['sm_fixture_id'=>4,'home_score'=>1,'away_score'=>1,'penalty_home_score'=>5,'penalty_away_score'=>4]);ch_group($out,[$penalties],$map,$names,'GW001','MNG001');ck($out['managers']['MNG001']['stats']['drawn']===2&&$out['managers']['MNG001']['stats']['penalty_won']===1,'Shootout separated from draw');
ch_group($out,[array_replace($row,['sm_fixture_id'=>5,'home_score'=>null])],$map,$names,'GW001','MNG001');ck($out['managers']['MNG001']['excluded']===2,'Unscored not counted');
ck($out['managers']['MNG003']['stats']['played']===0,'Missing codex ID not guessed');
$pwd=getenv('MYSQL_TEST_PASSWORD');if(!$pwd)throw new RuntimeException('Test DB required');
$db=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',$pwd,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
$db->exec('CREATE DATABASE IF NOT EXISTS nexus_club_house_test');$db->exec('USE nexus_club_house_test');$db->exec('DROP TABLE IF EXISTS GW001_IMC_Match_Report');
$db->exec('CREATE TABLE GW001_IMC_Match_Report(sm_fixture_id BIGINT,imc_season INT,match_date DATE,competition_key VARCHAR(255),competition_group VARCHAR(32),sm_action VARCHAR(32),home_sm_club_id BIGINT,away_sm_club_id BIGINT,home_name VARCHAR(255),away_name VARCHAR(255),home_sm_manager_id BIGINT,away_sm_manager_id BIGINT,home_score INT,away_score INT,penalty_home_score INT,penalty_away_score INT)');
$insert=$db->prepare('INSERT INTO GW001_IMC_Match_Report VALUES ('.implode(',',array_fill(0,count($row),'?')).')');foreach([$row,$row,$unknown,$national,$penalties] as $r)$insert->execute(array_values($r));
// There is intentionally no Results, Schedule or Assignment table in this test database.
$db->exec('SET TRANSACTION READ ONLY');$db->beginTransaction();$read=ch_read($db,'GW001',$people,'MNG001');$db->commit();ck($read['managers']['MNG001']['stats']['played']===3,'MR-only SQL engine');ck(count($read['matches'])===3,'Details equal stats');ck($read['coverage']['duplicate_rows']===1,'Duplicates reported');
echo "PASS: Match Report only, IMC IDs, one-sided identity, no assignments dependency, club isolation, duplicates, scores, penalties, cross-world identity\n";
