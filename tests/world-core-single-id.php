<?php
declare(strict_types=1);
require_once __DIR__.'/../imc-universal-gateway/core.php';
require_once __DIR__.'/../nexus/almanac/service.php';
function core_id_check(bool $ok,string $why):void {if(!$ok)throw new RuntimeException($why);}
$password=getenv('MYSQL_TEST_PASSWORD');
if(!$password)throw new RuntimeException('Disposable MySQL is required.');
$db=new IMCWorldPDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',$password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$db->exec('CREATE DATABASE core_single_id_test');
$db->exec('USE core_single_id_test');
$db->exec('CREATE TABLE `IMC Game World Codex Global` (`IMC GW` VARCHAR(255) PRIMARY KEY,`IMC GW Name` TEXT NOT NULL,`SM Game World ID` BIGINT NOT NULL,`Clubs` JSON,`Active Club` INT GENERATED ALWAYS AS (JSON_LENGTH(`Clubs`)) STORED,`National Teams` JSON,`National Teams Count` INT GENERATED ALWAYS AS (JSON_LENGTH(`National Teams`)) STORED,`IMC_WORLD_ID` VARCHAR(16),UNIQUE KEY uq_imc_world_id (`IMC_WORLD_ID`))');
$old=json_decode(file_get_contents(__DIR__.'/../database-migrations/world-identity-20261116/core-imc_game_world_codex_global.json'),true,512,JSON_THROW_ON_ERROR);
foreach($old['statements'] as $sql)if(str_starts_with($sql,'CREATE TRIGGER `imc_identity_'))$db->exec($sql);
foreach(range(1,8) as $i){$id=sprintf('IMC%03d',$i);$db->prepare('INSERT INTO `IMC Game World Codex Global` (`IMC GW`,`IMC GW Name`,`SM Game World ID`,`Clubs`,`National Teams`,`IMC_WORLD_ID`) VALUES (?,?,?,?,?,?)')->execute([$id,'World '.$i,468000+$i,'[{"name":"Club","club_id":76}]','[{"name":"Italy","national_team_id":4}]',$id]);}
$projection='`IMC GW`,`IMC GW Name`,`SM Game World ID`,`Clubs`,`Active Club`,`National Teams`,`National Teams Count`';
$before=$db->query('SELECT '.$projection.' FROM `IMC Game World Codex Global` ORDER BY `IMC GW`')->fetchAll();
$plan=json_decode(file_get_contents(__DIR__.'/../database-migrations/20261117_world_codex_single_id.json'),true,512,JSON_THROW_ON_ERROR);
foreach($plan['statements'] as $sql)$db->exec($sql);
core_id_check($db->query("SHOW COLUMNS FROM `IMC Game World Codex Global` LIKE 'IMC_WORLD_ID'")->fetch()===false,'Duplicate column removed');
core_id_check($db->query('SELECT '.$projection.' FROM `IMC Game World Codex Global` ORDER BY `IMC GW`')->fetchAll()===$before,'All eight worlds and every retained field unchanged');
$cfg=['db'=>['host'=>'127.0.0.1','port'=>3306,'core'=>'core_single_id_test','user'=>'root','pass'=>$password]];
$catalog=imc_world_catalog($cfg);
core_id_check(count($catalog)===8,'Importer catalog reads the primary key');
foreach($catalog as $row)core_id_check(imc_world_id($row['legacy_id'])===imc_world_id($row['imc_id']),'Importer aliases retain the same identity');
$almanac=na_catalog($db);
core_id_check(count($almanac)===8,'Almanac includes all eight primary-key worlds');
foreach($almanac as $row)core_id_check($row['id']===$row['code']&&preg_match('/^IMC00[1-8]$/D',$row['code'])===1,'Almanac ID and physical partition agree');
$db->exec("DELETE FROM `IMC Game World Codex Global` WHERE `IMC GW`='IMC001'");
$db->exec("INSERT INTO `IMC Game World Codex Global` (`IMC GW`,`IMC GW Name`,`SM Game World ID`) VALUES ('GW001','Legacy insert',468172)");
core_id_check($db->query("SELECT `IMC GW` FROM `IMC Game World Codex Global` WHERE `SM Game World ID`=468172")->fetchColumn()==='IMC001','Insert trigger canonicalizes the sole key');
$db->exec("UPDATE `IMC Game World Codex Global` SET `IMC GW`='IMC-001' WHERE `IMC GW`='IMC001'");
core_id_check($db->query("SELECT `IMC GW` FROM `IMC Game World Codex Global` WHERE `SM Game World ID`=468172")->fetchColumn()==='IMC001','Update trigger canonicalizes the sole key');
foreach(['clubhouse/index.php','clubhouse/imc-passport/index.php','imc_campus/world_center/index.php','nexus/admin/api.php','nexus/almanac/service.php','site-assets/master/homepage.php','site-data/core/world-identity.php'] as $file){
 core_id_check(!str_contains(file_get_contents(__DIR__.'/../'.$file),'IMC_WORLD_ID'),'No obsolete column dependency: '.$file);
}
echo "PASS: single CORE world key, unchanged data, importer/almanac catalogs and both identity triggers after dropping the duplicate column.\n";
