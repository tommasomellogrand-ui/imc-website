<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/match-teams.php';
require dirname(__DIR__).'/teams/roster-stats.php';
try {
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$fixture=filter_var($_GET['fixture']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
 if(!$fixture)throw new InvalidArgumentException('invalid_fixture');
 $db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
 // The world and fixture ID are the complete join key. Never match by team names or dates.
 $rows=nexus_rows($db,'SELECT game_world_id,imc_season,sm_fixture_id,competition_key,competition_stage,competition_round,competition_group_name,match_date,home_sm_club_id,away_sm_club_id,home_name,away_name,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score FROM `'.nexus_table($gw,'Results').'` WHERE game_world_id=? AND sm_fixture_id=? LIMIT 1',[$gw,$fixture]);
 if(!$rows)nexus_out(['ok'=>false,'error'=>'match_not_found'],404);
 $match=$rows[0];
 $reports=nexus_rows($db,'SELECT sm_fixture_id,home_score,away_score,home_sm_club_id,away_sm_club_id,home_manager_name,away_manager_name,stadium_name,attendance,players_json,team_stats_json,commentary_json FROM `'.nexus_table($gw,'Match_Report').'` WHERE game_world_id=? AND sm_fixture_id=? LIMIT 1',[$gw,$fixture]);
 $report=$reports[0]??null;$players=[];$teamStats=[];
 if($report){
  $entries=json_decode((string)$report['players_json'],true);$seen=[];
  if(is_array($entries)&&array_is_list($entries))foreach($entries as $p){if(!is_array($p)||!in_array($p['team_side']??'',['home','away'],true))continue;$id=(int)($p['sm_player_id']??0);$key=$p['team_side'].'|'.$id;if($id>0&&isset($seen[$key]))continue;$seen[$key]=true;$players[]=$p;}
  foreach(['home','away'] as $side){$roster=[];foreach($players as $p)if($p['team_side']===$side)$roster[]=['player_id'=>$p['sm_player_id']??0];$stats=nexus_roster_stats($roster,[$report],(int)$report[$side.'_sm_club_id']);$byId=[];foreach($stats['rows'] as $s)$byId[(int)$s['player_id']]=$s;foreach($players as &$p)if($p['team_side']===$side)$p['minutes']=$byId[(int)($p['sm_player_id']??0)]['minutes']??null;unset($p);}
  $decoded=json_decode((string)$report['team_stats_json'],true);if(is_array($decoded))$teamStats=$decoded;
  foreach(['home_manager_name','away_manager_name','stadium_name','attendance'] as $field)$match[$field]=$report[$field];
 }
 $match=nexus_enrich_match_teams($core,$gw,[$match])[0];
 $names=nexus_rows($core,'SELECT nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=? AND competition_key=? LIMIT 1',[$gw,$match['competition_key']]);
 $match['competition_name']=$names[0]['nexus_view']??$match['competition_key'];
 nexus_out(['ok'=>true,'world'=>$gw,'match'=>$match,'report_available'=>$report!==null,'players'=>$players,'team_stats'=>$teamStats,'generated_at'=>gmdate('c')]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'match_detail_error'],500);}
