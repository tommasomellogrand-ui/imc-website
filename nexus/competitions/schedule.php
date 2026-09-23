<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$key=trim((string)($_GET['competition']??''));
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Schedule');
  $where=['game_world_id=?'];$p=[$gw];
  if($season!==null){$where[]='imc_season=?';$p[]=$season;} if($key!==''){$where[]='competition_key=?';$p[]=$key;}
  $sql='SELECT game_world_id,imc_season,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,match_time,home_sm_team_id,home_name,away_sm_team_id,away_name,home_sm_manager_id,away_sm_manager_id FROM `'.$table.'` WHERE '.implode(' AND ',$where).' ORDER BY match_date ASC,match_time ASC,sm_fixture_id ASC';
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key?:null,'rows'=>nexus_rows($db,$sql,$p)]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_schedule_error'],500);}
