<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$key=trim((string)($_GET['competition']??''));
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Results');
  $where=['game_world_id=?'];$p=[$gw];
  if($season!==null){$where[]='imc_season=?';$p[]=$season;} if($key!==''){$where[]='competition_key=?';$p[]=$key;}
  $sql='SELECT game_world_id,imc_season,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_sm_club_id,home_name,away_sm_club_id,away_name,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score,result_status FROM `'.$table.'` WHERE '.implode(' AND ',$where).' ORDER BY match_date DESC,sm_fixture_id DESC';
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key?:null,'rows'=>nexus_rows($db,$sql,$p)]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_results_error'],500);}
