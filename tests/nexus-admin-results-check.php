<?php
declare(strict_types=1);
require __DIR__.'/../nexus/core/bootstrap.php';
require __DIR__.'/../nexus/admin/assignments-service.php';
require __DIR__.'/../nexus/admin/results-check-service.php';
function ok(bool $yes,string $why): void {if(!$yes)throw new RuntimeException($why);}
function fixture(int $id,string $date='2026-09-01'): array {return ['sm_fixture_id'=>$id,'match_date'=>$date,'imc_season'=>1,'competition_key'=>'GW001|DOMESTIC|league|1','sm_country'=>null,'sm_division'=>1,'home_id'=>10,'away_id'=>20,'home_name'=>'Home','away_name'=>'Away'];}
$s=[fixture(1),fixture(2),fixture(3),fixture(4),fixture(7),fixture(8),fixture(9),fixture(10)];
$r=[fixture(1),fixture(3),fixture(4,'2026-09-02'),fixture(5),fixture(7),fixture(7),fixture(8),fixture(9)];
$m=[fixture(1),fixture(4),fixture(6),fixture(7),fixture(8),fixture(9)];
$r[6]['imc_season']=2;$r[7]['home_id']=30;
$s[7]['sm_fixture_id']=null;
$out=rc_build(['schedule'=>$s,'results'=>$r,'report'=>$m],'2026-09-01',1,'2026-09-29');
$by=[];foreach($out['rows'] as $row)$by[$row['fixture_id']??'missing']=$row;
ok($by[1]['state']==='complete','Complete chain');
ok($by[2]['state']==='missing_results','Missing result');
ok($by[3]['state']==='missing_report','Missing report');
ok(in_array('Data discordante',$by[4]['issues'],true),'Date mismatch must match');
ok($by[5]['state']==='orphan_results','Result orphan');
ok($by[6]['state']==='orphan_report','Report orphan');
ok(count($by[7]['results'])===2&&$by[7]['state']==='anomaly','Duplicates preserved');
ok(in_array('Stagione discordante',$by[8]['issues'],true),'Cross-season match');
ok(in_array('Squadra casa discordante',$by[9]['issues'],true),'Team mismatch');
ok($by['missing']['state']==='anomaly','Null fixture');
ok(rc_build(['schedule'=>[fixture(11,'2026-10-01')],'results'=>[],'report'=>[]],'2026-10-01',null,'2026-09-29')['rows'][0]['state']==='pending','Future not missing');
ok(rc_build(['schedule'=>[fixture(11,'2026-09-29')],'results'=>[],'report'=>[]],'2026-09-29',null,'2026-09-29')['rows'][0]['state']==='today','Today not missing');
ok(rc_build(['schedule'=>[fixture(11)],'results'=>[],'report'=>[]],'2026-09-02',null,'2026-09-29')['summary']['fixtures']===0,'Date filter');
$pwd=getenv('MYSQL_TEST_PASSWORD');if(!$pwd)throw new RuntimeException('Test password required');
$db=new PDO('mysql:host=127.0.0.1;port=3306;dbname=nexus_admin_test;charset=utf8mb4','root',$pwd,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
foreach(rc_sources() as $source=>$repo){$table=nexus_table('GW001',$repo);$db->exec('DROP TABLE IF EXISTS `'.$table.'`');$club=$source==='schedule'?'team':'club';$db->exec('CREATE TABLE `'.$table.'` (sm_fixture_id BIGINT NULL, imc_season INT,match_date DATE,competition_key VARCHAR(255),sm_action VARCHAR(32),sm_country VARCHAR(64),sm_division INT, home_sm_'.$club.'_id BIGINT,away_sm_'.$club.'_id BIGINT,home_name VARCHAR(255),away_name VARCHAR(255)) ENGINE=InnoDB');}
$db->exec("INSERT INTO GW001_IMC_Schedule VALUES (100,1,'2026-09-01','key','league',NULL,1,10,20,'Home','Away'),(NULL,1,NULL,'key','league',NULL,1,10,20,'Home','Away')");
$db->exec("INSERT INTO GW001_IMC_Results VALUES (100,2,'2026-09-02','key','league',NULL,1,10,20,'Home','Away'),(101,1,'2026-09-01','key','league',NULL,1,10,20,'Home','Away')");
$db->exec("INSERT INTO GW001_IMC_Match_Report VALUES (100,1,'2026-09-01','key','league',NULL,1,10,20,'Home','Away'),(102,1,'2026-09-01','key','league',NULL,1,10,20,'Home','Away')");
$db->exec('SET TRANSACTION READ ONLY');$db->beginTransaction();
$meta=rc_metadata($db,'GW001',1);ok($meta['seasons']===[2,1],'All seasons available');
$out=rc_check($db,'GW001','2026-09-01',1,'2026-09-29');ok(count($out['rows'])===3,'Fixture union includes orphans');
$by=[];foreach($out['rows'] as $row)$by[$row['fixture_id']]=$row;
ok(count($by[100]['results'])===1&&count($by[100]['issues'])===2,'Database cross-date/season matching');
ok(rc_check($db,'GW001','undated',1,'2026-09-29')['summary']['fixtures']===1,'Undated rows');
ok(rc_check($db,'GW001','2026-09-10',1,'2026-09-29')['summary']['fixtures']===0,'Empty date');
$db->commit();
echo "PASS: Schedule -> Results -> Report, dates, seasons, duplicates, orphans, null IDs, today/future, read-only SQL\n";
