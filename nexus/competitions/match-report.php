<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/players/media.php';
// Always derive rankings from the current reports, never from a saved summary.
function competition_player_stats(array $reports): array {
  $players=[];$fixtures=[];$used=0;$invalid=0;$unidentified=0;
  foreach($reports as $report){
    $fixture=(string)$report['sm_fixture_id'];
    if(isset($fixtures[$fixture])) continue;
    $entries=json_decode((string)$report['players_json'],true);
    if(!is_array($entries)||!array_is_list($entries)||!count($entries)){$invalid++;continue;}
    $fixtures[$fixture]=true;$used++;$seen=[];
    foreach($entries as $p){
      if(!is_array($p)) continue;
      $id=(int)($p['sm_player_id']??0);
      if($id<1){$unidentified++;continue;}
      if(isset($seen[$id])) continue;
      $seen[$id]=true;
      $count=static fn($v): int=>is_numeric($v)?max(0,(int)$v):0;
      $minutes=is_array($p['goal_minutes']??null)?count($p['goal_minutes']):0;
      $goals=max($count($p['goals']??0),$minutes);
      $assists=$count($p['assists']??0);$yellow=$count($p['yellow_card']??0);$red=$count($p['red_card']??0);$mom=$count($p['man_of_match']??0)>0?1:0;
      $rating=is_numeric($p['rating']??null)&&(float)$p['rating']>0&&(float)$p['rating']<=10?(float)$p['rating']:null;
      // An unused substitute is not an appearance and never contributes a zero rating.
      $played=$count($p['starter']??0)>0||($p['sub_on_minute']??null)!==null||$rating!==null||$goals>0||$assists>0||$mom>0;
      if(!$played&&!$yellow&&!$red) continue;
      if(!isset($players[$id])) $players[$id]=['sm_player_id'=>$id,'player_name'=>(string)($p['player_name']??''),'clubs'=>[],'played'=>0,'goals'=>0,'assists'=>0,'yellow_card'=>0,'red_card'=>0,'man_of_match'=>0,'rating_sum'=>0,'rated_matches'=>0];
      $row=&$players[$id];
      if(!empty($p['player_name']))$row['player_name']=(string)$p['player_name'];
      $side=$p['team_side']??'';
      if(in_array($side,['home','away'],true)){
        $club=(string)($report[$side.'_name']??'');
        if($club!==''&&!in_array($club,$row['clubs'],true))$row['clubs'][]=$club;
      }
      $row['played']+=(int)$played;$row['goals']+=$goals;$row['assists']+=$assists;$row['yellow_card']+=$yellow;$row['red_card']+=$red;$row['man_of_match']+=$mom;
      if($rating!==null){$row['rating_sum']+=$rating;$row['rated_matches']++;}
      unset($row);
    }
  }
  foreach($players as &$row){$row['rating']=$row['rated_matches']?round($row['rating_sum']/$row['rated_matches'],4):null;unset($row['rating_sum']);}unset($row);
  return ['rows'=>array_values($players),'reports'=>$used,'invalid_reports'=>$invalid,'unidentified_players'=>$unidentified];
}
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$fixture=(int)($_GET['fixture']??0);
  if(($_GET['mode']??'')==='stats'){
    $season=nexus_season($_GET['season']??null);$competition=trim((string)($_GET['competition']??''));
    if($season===null||$competition==='')throw new InvalidArgumentException('season_and_competition_required');
    $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Match_Report');
    $reports=nexus_rows($db,'SELECT sm_fixture_id,home_name,away_name,players_json FROM `'.$table.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? ORDER BY match_date,sm_fixture_id',[$gw,$season,$competition]);
    $stats=competition_player_stats($reports);
    // Batch the existing Codex image lookup; visual enrichment must not hide statistics.
    $identities=[];
    try{$identities=nexus_player_identity(nexus_db($c,'core'),array_column($stats['rows'],'sm_player_id'));}catch(Throwable $e){}
    foreach($stats['rows'] as &$player){
      $id=(int)$player['sm_player_id'];
      $player['image_urls']=nexus_player_images($id,$identities[$id]??[]);
    }unset($player);
    nexus_out(array_merge(['ok'=>true,'game_world_id'=>$gw,'imc_season'=>$season,'competition_key'=>$competition,'generated_at'=>gmdate('c')],$stats));
  }
  if($fixture<1) throw new InvalidArgumentException('invalid_fixture');
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Match_Report');
  $sql='SELECT game_world_id,imc_season,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_sm_club_id,home_name,away_sm_club_id,away_name,home_sm_manager_id,home_manager_name,away_sm_manager_id,away_manager_name,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score,stadium_name,attendance,team_stats_json,players_json,events_json,tactics_json FROM `'.$table.'` WHERE game_world_id=? AND sm_fixture_id=? LIMIT 1';
  $rows=nexus_rows($db,$sql,[$gw,$fixture]);nexus_out(['ok'=>true,'game_world_id'=>$gw,'fixture'=>$fixture,'row'=>$rows[0]??null]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_match_report_error'],500);}
