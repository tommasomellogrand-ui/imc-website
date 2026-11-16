<?php
declare(strict_types=1);

// Exercise the actual migration SQL against disposable MySQL, never production.
$migration=json_decode(file_get_contents(__DIR__.'/../database-migrations/20261116_competition_codex_unification.json'),true,512,JSON_THROW_ON_ERROR);
$pdo=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',getenv('MYSQL_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE DATABASE competition_codex_unification_test CHARACTER SET utf8mb4');
$pdo->exec('USE competition_codex_unification_test');
$pdo->exec("CREATE TABLE `IMC Competition Codex Global` (id BIGINT PRIMARY KEY,game_world_id TEXT NOT NULL,competition_key VARCHAR(255) UNIQUE,sm_action TEXT,custom_competition TEXT,sm_action_group TEXT NOT NULL,sm_country TEXT,sm_division INT,teams_count INT,expected_match INT,expected_matchdays INT UNSIGNED,is_sm_action TINYINT NOT NULL DEFAULT 1)");
$pdo->exec('CREATE TABLE `IMC Competition Nexus Mapping` (mapping_id BIGINT)');
$pdo->exec($migration['plans'][0]['statements'][0]);
foreach($migration['codex_rows'] as $row){
    $columns=array_keys($row);
    $pdo->prepare('INSERT INTO `IMC Competition Codex Global` (`'.implode('`,`',$columns).'`) VALUES ('.implode(',',array_fill(0,count($columns),'?')).')')->execute(array_values($row));
}
foreach($migration['plans'][1]['statements'] as $sql)$pdo->exec($sql);
function verify(bool $ok,string $why):void{if(!$ok)throw new RuntimeException($why);}
verify((int)$pdo->query('SELECT COUNT(*) FROM `IMC Competition Codex Global`')->fetchColumn()===120,'Exactly one canonical row per configured competition');
verify((int)$pdo->query('SELECT COUNT(*) FROM `IMC Competition Nexus Mapping`')->fetchColumn()===126,'Canonical keys and six historical aliases resolve');
verify((int)$pdo->query("SELECT COUNT(*) FROM `IMC Competition Codex Global` WHERE competition_key IS NULL OR custom_competition IS NULL OR sm_action IS NULL")->fetchColumn()===0,'All rows have name, key and action');
verify((int)$pdo->query("SELECT COUNT(*) FROM `IMC Competition Codex Global` WHERE game_world_id='GW011' AND competition_group='IMC'")->fetchColumn()===5,'Four independent leagues and Club World Cup');
verify((int)$pdo->query("SELECT COUNT(*) FROM `IMC Competition Codex Global` WHERE game_world_id='GW001' AND competition_key LIKE '%|playoff|%' AND sm_action='playoff'")->fetchColumn()===3,'Playoffs are not domestic leagues');
verify((int)$pdo->query("SELECT COUNT(*) FROM `IMC Competition Codex Global` WHERE sm_action='friendly'")->fetchColumn()===8,'Friendlies in every world');
verify((int)$pdo->query("SELECT COUNT(*) FROM `IMC Competition Codex Global` WHERE game_world_id='GW009' AND (sm_action='leagueshield' OR custom_competition='Kick Off Cup')")->fetchColumn()===0,'Removed excess competitions stay absent');
$pdo->exec("UPDATE `IMC Competition Codex Global` SET custom_competition='Renamed once' WHERE id=1");
$names=$pdo->query("SELECT nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id='GW001' AND sm_action='leaguecup'")->fetchAll(PDO::FETCH_COLUMN);
verify(count($names)===2 && count(array_unique($names))===1 && $names[0]==='Renamed once','One Codex update changes canonical name and historical alias immediately');
try{$pdo->exec("UPDATE `IMC Competition Nexus Mapping` SET IMC_View='Separate state' WHERE mapping_id=1");throw new RuntimeException('Compatibility view accepted an independent write');}catch(PDOException $expected){}
$pdo->exec($migration['plans'][2]['statements'][0]);
verify((int)$pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME LIKE 'IMC Competition%' AND TABLE_TYPE='BASE TABLE'")->fetchColumn()===1,'Only the Codex stores competition data');
echo "PASS: unified Codex, 120 competitions, 8 worlds, historical aliases and one authoritative name.\n";
