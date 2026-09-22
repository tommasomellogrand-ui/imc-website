<?php
declare(strict_types=1);
$password=getenv('IMC_TEST_MYSQL_PASSWORD');if(!$password)throw new RuntimeException('CI password required');
$db=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',$password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$db->exec('CREATE DATABASE imc_schedule_test_core');$db->exec('CREATE DATABASE imc_schedule_test_world');
$tmp=sys_get_temp_dir().'/imc-schedule-'.bin2hex(random_bytes(8));mkdir($tmp.'/imc-universal-gateway',0700,true);mkdir($tmp.'/__imc_private_gateway',0700,true);
foreach(['schedule-normalizer.php','playoff-normalizer.php','ingress.php','write.php'] as $f)copy(__DIR__.'/../imc-universal-gateway/'.$f,$tmp.'/imc-universal-gateway/'.$f);
$cfg=['db'=>['host'=>'127.0.0.1','port'=>3306,'core'=>'imc_schedule_test_core','user'=>'root','pass'=>$password]];
file_put_contents($tmp.'/__imc_private_gateway/config.php','<?php return '.var_export($cfg,true).';');
require $tmp.'/imc-universal-gateway/ingress.php';
function verify_schedule(bool $ok,string $why):void {if(!$ok)throw new RuntimeException($why);}
try {
 $db->exec('USE imc_schedule_test_core');
 $db->exec('CREATE TABLE `IMC Game World Club Mapping` (`Game World` VARCHAR(16),`Club ID` BIGINT,`SM Club ID` BIGINT,`SM World Club ID` BIGINT,`Club Name` VARCHAR(100))');
 $db->exec('CREATE TABLE `IMC Club Codex Global` (id BIGINT,name VARCHAR(100))');
 $db->exec('CREATE TABLE `IMC Manager Codex Global` (manager_id VARCHAR(30),sm_manager_id BIGINT)');
 $db->exec('CREATE TABLE `IMC Manager Assignment Global` (game_world_id VARCHAR(16),manager_id VARCHAR(30),team_id BIGINT,assignment_type VARCHAR(30),national_team_id BIGINT,start_date DATE,end_date DATE)');
 $db->exec("INSERT INTO `IMC Game World Club Mapping` VALUES ('GW010',306,306,92317315,'São Paulo FC')");
 $db->exec("INSERT INTO `IMC Club Codex Global` VALUES (306,'São Paulo FC')");
 $db->exec("INSERT INTO `IMC Manager Codex Global` VALUES ('MNG001',13051324)");
 $db->exec("INSERT INTO `IMC Manager Assignment Global` VALUES ('GW010','MNG001',306,'club',NULL,'2026-09-13',NULL)");
 $db->exec('USE imc_schedule_test_world');
 $schema='(game_world_id VARCHAR(16),sm_fixture_id BIGINT PRIMARY KEY,match_date DATE,home_name VARCHAR(100),away_name VARCHAR(100),home_sm_team_id BIGINT,away_sm_team_id BIGINT,logged_manager_id BIGINT,fingerprint VARCHAR(100),competition_group VARCHAR(30),sm_action VARCHAR(30)) ENGINE=InnoDB';
 $db->exec('CREATE TABLE `GW010_IMC_Schedule` '.$schema);$db->exec('CREATE TABLE `IMC_Site_Schedule` '.$schema);
 $db->exec('CREATE TRIGGER schedule_test_ai AFTER INSERT ON `GW010_IMC_Schedule` FOR EACH ROW INSERT INTO `IMC_Site_Schedule` VALUES (NEW.game_world_id,NEW.sm_fixture_id,NEW.match_date,NEW.home_name,NEW.away_name,NEW.home_sm_team_id,NEW.away_sm_team_id,NEW.logged_manager_id,NEW.fingerprint,NEW.competition_group,NEW.sm_action)');
 $row=['game_world_id'=>'GW010','sm_fixture_id'=>100,'match_date'=>'2026-09-27','home_name'=>'São Paulo FC','away_name'=>'West Ham United','home_sm_team_id'=>null,'away_sm_team_id'=>92317094,'logged_manager_id'=>13051324,'fingerprint'=>'original','competition_group'=>'DOMESTIC','sm_action'=>'league'];
 $out=imc_ingress_insert_many($db,'GW010_IMC_Schedule','GW010',[$row],true);
 verify_schedule($out['written_rows']===1 && $out['normalization']['updated_ids']===1,'ingress import resolves missing ID');
 foreach(['GW010_IMC_Schedule','IMC_Site_Schedule'] as $table){$r=$db->query("SELECT * FROM `{$table}` WHERE sm_fixture_id=100")->fetch();verify_schedule((int)$r['home_sm_team_id']===92317315 && $r['fingerprint']==='original','source and mirror consistent; fingerprint unchanged');}
 $out=imc_schedule_import($db,'GW010_IMC_Schedule',true,fn()=>0);verify_schedule($out['normalization']['updated_ids']===0,'idempotent');
 $out=imc_ingress_insert_many($db,'GW010_IMC_Schedule','GW010',[array_replace($row,['sm_fixture_id'=>101,'home_sm_team_id'=>55]),array_replace($row,['sm_fixture_id'=>102,'home_name'=>'Unmatched'])],true);
 verify_schedule((int)$db->query('SELECT home_sm_team_id FROM `GW010_IMC_Schedule` WHERE sm_fixture_id=101')->fetchColumn()===55,'existing ID preserved');
 verify_schedule($out['normalization']['unresolved']===1,'ambiguous/unmatched left pending');
 $db->exec('DROP TABLE imc_schedule_test_core.`IMC Manager Assignment Global`');
 try {imc_ingress_insert_many($db,'GW010_IMC_Schedule','GW010',[array_replace($row,['sm_fixture_id'=>103])],true);throw new RuntimeException('expected failure');}catch(PDOException $e){}
 verify_schedule((int)$db->query('SELECT COUNT(*) FROM `GW010_IMC_Schedule` WHERE sm_fixture_id=103')->fetchColumn()===0,'core failure rolls back source');
 verify_schedule((int)$db->query('SELECT COUNT(*) FROM `IMC_Site_Schedule` WHERE sm_fixture_id=103')->fetchColumn()===0,'core failure rolls back mirror');
 verify_schedule((int)$db->query("SELECT IS_FREE_LOCK('imc_schedule_GW010')")->fetchColumn()===1,'lock released on failure');
 echo "Schedule MySQL integration: all assertions passed\n";
} finally {
 $db->exec('DROP DATABASE imc_schedule_test_world');$db->exec('DROP DATABASE imc_schedule_test_core');
 foreach(['schedule-normalizer.php','playoff-normalizer.php','ingress.php','write.php'] as $f)unlink($tmp.'/imc-universal-gateway/'.$f);
 unlink($tmp.'/__imc_private_gateway/config.php');rmdir($tmp.'/__imc_private_gateway');rmdir($tmp.'/imc-universal-gateway');rmdir($tmp);
}
