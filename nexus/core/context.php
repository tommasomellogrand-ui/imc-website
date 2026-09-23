<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');
  $core=nexus_db($c,'core');
  $world=nexus_rows($core,'SELECT `IMC GW` game_world_id,`IMC GW Name` game_world_name,`SM Game World ID` sm_game_world_id,`Active Club` active_club,`Country` country FROM `IMC Game World Codex Global` WHERE `IMC GW`=? LIMIT 1',[$gw]);
  $seasons=nexus_rows($core,'SELECT game_world_id,imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season',[$gw]);
  nexus_out(['ok'=>true,'world'=>$world[0]??null,'seasons'=>$seasons,'data_target'=>nexus_target($c,$gw)]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'core_error'],500);}
