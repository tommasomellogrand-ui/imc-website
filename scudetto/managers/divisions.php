<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
try {
    $db=nexus_db(nexus_config(),'custom');
    $rows=nexus_rows($db,"SELECT DISTINCT home_sm_team_id,away_sm_team_id,sm_division FROM IMC008_Schedule WHERE sm_action='league' AND sm_division IN (1,2) AND imc_season=(SELECT MAX(imc_season) FROM IMC008_Schedule WHERE sm_action='league')");
    $clubs=[];
    foreach($rows as $row) foreach(['home_sm_team_id','away_sm_team_id'] as $key) if($row[$key]) $clubs[$row[$key]]=(int)$row['sm_division'];
    nexus_out(['ok'=>true,'divisions'=>$clubs]);
} catch(Throwable $e) {nexus_out(['ok'=>false,'error'=>'divisioni_non_disponibili'],503);}
