<?php
declare(strict_types=1);
require __DIR__.'/../nexus/core/bootstrap.php';
require __DIR__.'/../nexus/admin/assignments-service.php';
function check(bool $value,string $message): void {if(!$value)throw new RuntimeException($message);}
function rejects(callable $fn,string $message): void {try{$fn();}catch(InvalidArgumentException|RuntimeException $e){return;}throw new Exception($message);}
$pwd=getenv('MYSQL_TEST_PASSWORD');if(!$pwd)throw new RuntimeException('Test database password required.');
$db=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',$pwd,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
$db->exec('CREATE DATABASE IF NOT EXISTS nexus_admin_test');$db->exec('USE nexus_admin_test');
foreach(['IMC Manager Assignment Global','IMC Manager Codex Global','IMC Game World Club Mapping','IMC Game World National Team Mapping'] as $table)$db->exec('DROP TABLE IF EXISTS `'.$table.'`');
$db->exec('CREATE TABLE `IMC Manager Assignment Global` (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,game_world_id VARCHAR(16) NOT NULL,manager_id VARCHAR(255) NOT NULL,full_name VARCHAR(255) NOT NULL,team_id BIGINT UNSIGNED NULL,team_name VARCHAR(255) NULL,assignment_type VARCHAR(32) NOT NULL,start_date DATE NOT NULL,end_date DATE NULL,national_team_id BIGINT UNSIGNED NULL) ENGINE=InnoDB');
$db->exec('CREATE TABLE `IMC Manager Codex Global` (manager_id VARCHAR(255),full_name VARCHAR(255))');
$db->exec("INSERT INTO `IMC Manager Codex Global` VALUES ('MNG001','First Manager'),('MNG002','Second Manager'),('MNG003','Third Manager')");
$db->exec('CREATE TABLE `IMC Game World Club Mapping` (`Game World` VARCHAR(16),`SM World Club ID` BIGINT,`Club Name` VARCHAR(255))');
$db->exec("INSERT INTO `IMC Game World Club Mapping` VALUES ('GW004',101,'Club A'),('GW004',102,'Club B'),('GW005',201,'Other world club')");
$db->exec('CREATE TABLE `IMC Game World National Team Mapping` (`Game World` VARCHAR(16),`National Team ID` BIGINT,`National Team Name` VARCHAR(255),`SM National Team ID` BIGINT,`SM World National Club ID` BIGINT)');
$db->exec("INSERT INTO `IMC Game World National Team Mapping` VALUES ('GW004',5,'Spain',50,500)");
$base=['action'=>'save','manager_id'=>'MNG001','assignment_type'=>'club','team'=>101,'start_date'=>'2026-01-01','end_date'=>''];
$a=na_save($db,'GW004',$base);check((int)$a['team_id']===101,'Uses world club ID');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['manager_id'=>'MNG002'])),'Overlapping team accepted');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['team'=>102])),'Overlapping manager accepted');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['team'=>999])),'Missing club accepted');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['team'=>201])),'Cross-world club accepted');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['manager_id'=>'MISSING'])),'Missing manager accepted');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['start_date'=>'2026-02-30'])),'Invalid date accepted');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['id'=>$a['id'],'version'=>'stale'])),'Stale update accepted');
$n=na_save($db,'GW004',array_replace($base,['assignment_type'=>'national_team','team'=>50]));check((int)$n['national_team_id']===500&&$n['team_id']===null,'National aliases resolve to world ID');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['assignment_type'=>'national_team','team'=>5,'manager_id'=>'MNG002'])),'National aliases bypass conflict');
$replace=array_replace($base,['action'=>'replace','id'=>$a['id'],'version'=>na_version($a),'manager_id'=>'MNG002','close_date'=>'2026-08-21','start_date'=>'2026-08-22']);
$b=na_save($db,'GW004',$replace);$old=nexus_rows($db,'SELECT * FROM '.NA_TABLE.' WHERE id=?',[$a['id']])[0];check($old['end_date']==='2026-08-21'&&$b['manager_id']==='MNG002','Atomic succession preserves old manager');
rejects(fn()=>na_save($db,'GW004',array_replace($base,['manager_id'=>'MNG003','start_date'=>'2026-08-21','end_date'=>'2026-08-21'])),'Inclusive boundary accepted');
$other=na_save($db,'GW004',array_replace($base,['manager_id'=>'MNG003','team'=>102]));
$before=nexus_rows($db,'SELECT * FROM '.NA_TABLE.' ORDER BY id');
rejects(fn()=>na_save($db,'GW004',array_replace($replace,['id'=>$b['id'],'version'=>na_version($b),'manager_id'=>'MNG003','close_date'=>'2026-09-01','start_date'=>'2026-09-02'])),'Conflicting successor accepted');
check($before===nexus_rows($db,'SELECT * FROM '.NA_TABLE.' ORDER BY id'),'Failed succession changed data');
rejects(fn()=>na_save($db,'GW005',['action'=>'close','id'=>$b['id'],'version'=>na_version($b),'end_date'=>'2026-09-01']),'Wrong-world mutation accepted');
$closed=na_save($db,'GW004',['action'=>'close','id'=>$b['id'],'version'=>na_version($b),'end_date'=>'2026-09-01']);check($closed['end_date']==='2026-09-01','Close failed');
check((int)$db->query('SELECT COUNT(*) FROM `IMC Game World Club Mapping`')->fetchColumn()===3,'Clubs changed');
// Existing legacy national IDs must conflict with the canonical world ID too.
$db->prepare('UPDATE '.NA_TABLE.' SET national_team_id=5 WHERE id=?')->execute([$n['id']]);
rejects(fn()=>na_save($db,'GW004',array_replace($base,['assignment_type'=>'national_team','team'=>500,'manager_id'=>'MNG002'])),'Legacy ID conflict missed');
echo "PASS: assignments, dates, aliases, overlaps, optimistic locking, atomic succession, rollback, world isolation, no club creation\n";
