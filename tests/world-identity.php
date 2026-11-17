<?php
declare(strict_types=1);
require_once __DIR__.'/../site-data/core/world-identity.php';
function identity_check(bool $ok,string $why):void {if(!$ok)throw new RuntimeException($why);}
foreach(IMC_WORLD_ALIASES as $old=>$new){
 identity_check(imc_world_id($old)===$new,'Old route resolves');
 identity_check(imc_world_id(substr_replace($new,'-',3,0))===$new,'Hyphen alias resolves');
 identity_check(imc_world_route($new)===$old,'Old code compatibility edge');
 identity_check(imc_world_value($old.'|NATIONS|worldcup')===$new.'|NATIONS|worldcup','Key prefix resolves');
}
$sql=imc_world_sql("SELECT game_world_id FROM `IMC005_Schedule` WHERE game_world_id=? AND competition_key=?");
identity_check(str_contains($sql,"game_world_id='GW011'"),'Dual reads retain aliases before migration');
identity_check(str_contains($sql,"THEN 'IMC005'"),'Dual reads resolve canonical identity');
identity_check(imc_world_value(93399639)===93399639,'Club IDs are untouched');
identity_check(imc_world_payload(['GW011|DOMESTIC|league|1'=>['game_world_id'=>'GW011']])===['IMC005|DOMESTIC|league|1'=>['game_world_id'=>'IMC005']],'Payload keys and values are canonical');
identity_check(imc_competition_definition_key('IMC001|S02|DOMESTIC|league|1')==='IMC001|DOMESTIC|league|1','Edition resolves to its CORE definition');
identity_check(imc_competition_definition_key('IMC004|S01|IMC|COPA_LIBERTADORES')==='IMC004_COPA_LIBERTADORES','Historical IMC definition retains its identity');
identity_check(imc_world_compat_rows([['competition_key'=>'IMC001|S02|DOMESTIC|league|1','imc_season'=>2]])===[['competition_key'=>'GW001|DOMESTIC|league|1','imc_season'=>2]],'Legacy UI resolves edition without changing its season');
echo "PASS: canonical world IDs, legacy input aliases, key prefixes and unchanged club IDs.\n";
if(!getenv('MYSQL_TEST_PASSWORD'))exit;
$db=new IMCWorldPDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',getenv('MYSQL_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('CREATE DATABASE identity_test');$db->exec('USE identity_test');
$db->exec('CREATE TABLE worlds(game_world_id VARCHAR(16),competition_key VARCHAR(255),value INT)');
// Seed old stored data without the statement adapter to test transition reads.
$db->exec("INSERT INTO worlds VALUES ('GW011','GW011|DOMESTIC|league|1',9)");
foreach(['GW011','IMC-005','IMC005'] as $input){$q=$db->prepare('SELECT value FROM worlds WHERE game_world_id=? AND competition_key=?');$q->execute([$input,$input.'|DOMESTIC|league|1']);identity_check((int)$q->fetchColumn()===9,'Read old stored rows through every alias');}
identity_check((int)$db->query('SELECT COUNT(*) FROM worlds a JOIN worlds b ON a.game_world_id=b.game_world_id')->fetchColumn()===1,'Joins normalize both sides before migration');
$db->exec("UPDATE worlds SET game_world_id='IMC005',competition_key='IMC005|DOMESTIC|league|1'");
foreach(['GW011','IMC-005','IMC005'] as $input){$q=$db->prepare('SELECT value FROM worlds WHERE game_world_id=? AND competition_key=?');$q->execute([$input,$input.'|DOMESTIC|league|1']);identity_check((int)$q->fetchColumn()===9,'Read canonical stored rows through every alias');}
$q=$db->prepare('INSERT INTO worlds VALUES (?,?,?)');$q->execute(['GW001','GW001|DOMESTIC|league|1',4]);
identity_check($db->query('SELECT game_world_id FROM worlds WHERE value=4')->fetchColumn()==='IMC001','New writes store only the canonical ID');
$db->exec('ALTER TABLE worlds ADD imc_season INT');
$q=$db->prepare('INSERT INTO worlds VALUES (?,?,?,?)');
$q->execute(['IMC001','IMC001|S01|DOMESTIC|league|1',101,1]);
$q->execute(['IMC001','IMC001|S02|DOMESTIC|league|1',102,2]);
identity_check($db->query('SELECT competition_key FROM worlds WHERE value=102')->fetchColumn()==='IMC001|S02|DOMESTIC|league|1','Writes preserve edition keys');
foreach(['GW001|DOMESTIC|league|1','IMC001|DOMESTIC|league|1','IMC001|S02|DOMESTIC|league|1'] as $key){
 $q=$db->prepare('SELECT value FROM worlds WHERE competition_key=? AND imc_season=?');$q->execute([$key,2]);
 identity_check($q->fetchAll(PDO::FETCH_COLUMN)===[102],'Results edition remains readable through existing season-filtered links');
}
$q=$db->prepare('SELECT value FROM worlds WHERE competition_key=?');$q->execute(['IMC001|S02|DOMESTIC|league|1']);
identity_check($q->fetchAll(PDO::FETCH_COLUMN)===[102],'Full edition key alone cannot select another season');
identity_check((int)$db->query("SELECT value FROM worlds WHERE competition_key='IMC001|S01|DOMESTIC|league|1'")->fetchColumn()===101,'Full literal edition key is exact');
identity_check((int)$db->query("SELECT value FROM worlds WHERE competition_key='GW001|DOMESTIC|league|1' AND imc_season=1")->fetchColumn()===101,'Literal CORE key resolves stored edition');
$db->exec("CREATE TABLE definitions (competition_key VARCHAR(255))");
$db->exec("INSERT INTO definitions VALUES ('IMC001|DOMESTIC|league|1')");
identity_check((int)$db->query('SELECT COUNT(*) FROM worlds r JOIN definitions d ON r.competition_key=d.competition_key WHERE r.imc_season IN (1,2)')->fetchColumn()===2,'CORE joins recognize both stored editions');
echo "PASS: MySQL dual reads before/after migration and canonical writes.\n";
