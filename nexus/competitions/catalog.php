<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$core=nexus_db($c,'core');
  $rows=nexus_rows($core,'SELECT game_world_id,world_type,sm_country,competition_group,sm_action,sm_division,competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=? ORDER BY competition_group,sm_country,sm_action,sm_division,nexus_view',[$gw]);
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_catalog_error'],500);}
