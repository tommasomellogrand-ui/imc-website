<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$fixture=(int)($_GET['fixture']??0);
  if($fixture<1) throw new InvalidArgumentException('invalid_fixture');
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Match_Report');
  $sql='SELECT game_world_id,imc_season,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_sm_club_id,home_name,away_sm_club_id,away_name,home_sm_manager_id,home_manager_name,away_sm_manager_id,away_manager_name,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score,stadium_name,attendance,team_stats_json,players_json,events_json,tactics_json FROM `'.$table.'` WHERE game_world_id=? AND sm_fixture_id=? LIMIT 1';
  $rows=nexus_rows($db,$sql,[$gw,$fixture]);nexus_out(['ok'=>true,'game_world_id'=>$gw,'fixture'=>$fixture,'row'=>$rows[0]??null]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_match_report_error'],500);}
