<?php
declare(strict_types=1);
require __DIR__.'/../nexus/core/bootstrap.php';
require __DIR__.'/../nexus/admin/assignments-service.php';
require __DIR__.'/../nexus/admin/seasons-service.php';
function check(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
function rejects(callable $fn): void {try{$fn();}catch(Throwable $e){return;}throw new RuntimeException('Expected rejection');}
$pwd=getenv('MYSQL_TEST_PASSWORD');if(!$pwd)throw new RuntimeException('Test password required');
$db=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',$pwd,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
$db->exec('CREATE DATABASE IF NOT EXISTS nexus_seasons_test');$db->exec('CREATE DATABASE IF NOT EXISTS nexus_seasons_local_test');$db->exec('USE nexus_seasons_test');
$local='`nexus_seasons_local_test`.`IMC_Game_World_Season`';
foreach([NS_CORE,$local] as $t){$db->exec('DROP TABLE IF EXISTS '.$t);$db->exec('CREATE TABLE '.$t.' (game_world_id VARCHAR(16),imc_season INT,soccer_manager_season INT NULL,imc_season_start_date DATE NULL,imc_season_end_date DATE NULL,PRIMARY KEY(game_world_id,imc_season)) ENGINE=InnoDB');}
$one=['season'=>1,'start_date'=>'2026-05-25','end_date'=>'2026-10-24'];
ns_save($db,$local,'GW003',$one);
$row=ns_list($db,$local,'GW003')[0];check($row['synced'],'Create not synchronized');
rejects(fn()=>ns_save($db,$local,'GW003',$one));
rejects(fn()=>ns_save($db,$local,'GW003',['season'=>2,'start_date'=>'2026-10-24']));
rejects(fn()=>ns_save($db,$local,'GW003',['season'=>2,'start_date'=>'2026-02-30']));
rejects(fn()=>ns_save($db,$local,'GW003',['season'=>2,'start_date'=>'2026-10-25','end_date'=>'2026-10-24']));
ns_save($db,$local,'GW003',['season'=>2,'start_date'=>'2026-10-25']);
check(count(ns_list($db,$local,'GW003'))===2,'Second season missing');
ns_save($db,$local,'GW008',$one);
$edit=$one+['version'=>$row['version']];$edit['end_date']='2026-10-23';ns_save($db,$local,'GW003',$edit);
check(ns_list($db,$local,'GW008')[0]['imc_season_end_date']==='2026-10-24','Other GW changed');
rejects(fn()=>ns_save($db,$local,'GW003',$edit));
$latest=ns_list($db,$local,'GW003')[0];$edit['version']=$latest['version'];$edit['end_date']='2026-10-22';
$db->exec('CREATE TRIGGER nexus_seasons_local_test.fail_season BEFORE UPDATE ON '.$local." FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Simulated copy failure'");
rejects(fn()=>ns_save($db,$local,'GW003',$edit));
check(ns_list($db,$local,'GW003')[0]['imc_season_end_date']==='2026-10-23','Core did not roll back on copy failure');
$db->exec('DROP TRIGGER nexus_seasons_local_test.fail_season');
echo "PASS: seasons create/update, inclusive dates, overlap rejection, stale writes, GW isolation, cross-schema atomic rollback\n";
