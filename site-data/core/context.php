<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
try{
  $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');
  $core=imc_site_db($c,'core');
  $world=imc_site_rows($core,'SELECT `IMC GW` game_world_id,`IMC GW Name` game_world_name,`SM Game World ID` sm_game_world_id,`Active Club` active_club,NULL country FROM `IMC Game World Codex Global` WHERE `IMC GW`=? LIMIT 1',[$gw]);
  $seasons=imc_site_rows($core,'SELECT game_world_id,imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season',[$gw]);
  $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
  $current=null;$latestStarted=null;
  foreach($seasons as $season){$start=$season['imc_season_start_date'];$end=$season['imc_season_end_date'];if($start&&$start<=$today){$latestStarted=$season['imc_season'];if(!$end||$end>=$today)$current=$season['imc_season'];}}
  $current=$current??$latestStarted;
  imc_site_out(['current_season'=>$current,'ok'=>true,'world'=>$world[0]??null,'seasons'=>$seasons,'data_target'=>imc_site_target($c,$gw)]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'core_error'],500);}

