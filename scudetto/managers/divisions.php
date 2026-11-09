<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/site-data/core/bootstrap.php';
try {
    $db=imc_site_db(imc_site_config(),'custom');
    $rows=imc_site_rows($db,"SELECT DISTINCT home_sm_team_id,away_sm_team_id,sm_division FROM IMC008_Schedule WHERE sm_action='league' AND sm_division IN (1,2) AND imc_season=(SELECT MAX(imc_season) FROM IMC008_Schedule WHERE sm_action='league')");
    $clubs=[];
    foreach($rows as $row) foreach(['home_sm_team_id','away_sm_team_id'] as $key) if($row[$key]) $clubs[$row[$key]]=(int)$row['sm_division'];
    imc_site_out(['ok'=>true,'divisions'=>$clubs]);
} catch(Throwable $e) {imc_site_out(['ok'=>false,'error'=>'divisioni_non_disponibili'],503);}
