<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/site-data/core/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
try {
 $cfg=imc_site_config();
 $core=imc_site_db($cfg,'core');
 $world=imc_site_db($cfg,'custom');
 $select=[];
 for($i=1;$i<=8;$i++) $select[]=sprintf("SELECT full_name FROM IMC%03d_Player_Codex WHERE full_name IS NOT NULL",$i);
 $names=$world->query(implode(' UNION ALL ',$select))->fetchAll(PDO::FETCH_COLUMN);
 $managers=$core->query('SELECT full_name FROM `IMC Manager Codex Global`')->fetchAll(PDO::FETCH_COLUMN);
 $clubs=$core->query('SELECT name FROM `IMC Club Codex Global` UNION SELECT nexus_view FROM `IMC Club Codex Global` UNION SELECT name FROM `IMC National Team Codex Global`')->fetchAll(PDO::FETCH_COLUMN);
 header('Cache-Control: no-store');
 echo json_encode(['names'=>array_values(array_unique(array_merge($names,$managers))),'clubs'=>array_values(array_filter($clubs))],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
} catch(Throwable $error){http_response_code(503);echo '{"error":"names_unavailable"}';}
