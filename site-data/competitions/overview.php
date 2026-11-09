<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$season=imc_site_season($_GET['season']??null);$key=trim((string)($_GET['competition']??''));
  if($season===null)throw new InvalidArgumentException('season_required');if($key==='')throw new InvalidArgumentException('competition_required');
  $core=imc_site_db($c,'core');$map=imc_site_rows($core,'SELECT world_type,sm_country,competition_group,sm_action,sm_division,competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=? AND competition_key=? LIMIT 1',[$gw,$key]);
  $db=imc_site_db($c,imc_site_target($c,$gw));$rt=imc_site_table($gw,'Results');$st=imc_site_table($gw,'Schedule');$mt=imc_site_table($gw,'Match_Report');
  $results=imc_site_rows($db,'SELECT sm_fixture_id,competition_stage,competition_round,match_date,home_sm_club_id,home_name,away_sm_club_id,away_name,home_score,away_score,penalty_home_score,penalty_away_score FROM `'.$rt.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? ORDER BY match_date DESC,sm_fixture_id DESC LIMIT 100',[$gw,$season,$key]);
  $schedule=imc_site_rows($db,'SELECT sm_fixture_id,competition_stage,competition_round,match_date,match_time,home_sm_team_id,home_name,away_sm_team_id,away_name FROM `'.$st.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? ORDER BY match_date ASC,match_time ASC,sm_fixture_id ASC LIMIT 100',[$gw,$season,$key]);
  $reports=imc_site_rows($db,'SELECT sm_fixture_id,match_date,stadium_name,attendance,team_stats_json,players_json,events_json,tactics_json FROM `'.$mt.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? ORDER BY match_date DESC,sm_fixture_id DESC LIMIT 100',[$gw,$season,$key]);
  $dedupe=function(array $rows):array{$out=[];$seen=[];foreach($rows as $r){$id=(string)($r['sm_fixture_id']??'');$k=$id!==''?$id:md5(json_encode($r));if(isset($seen[$k]))continue;$seen[$k]=1;$out[]=$r;}return $out;};
  $results=$dedupe($results);$schedule=$dedupe($schedule);$reports=$dedupe($reports);
  $resultIds=array_fill_keys(array_map(fn($r)=>(string)$r['sm_fixture_id'],$results),true);
  $upcoming=array_values(array_filter($schedule,fn($r)=>!isset($resultIds[(string)$r['sm_fixture_id']])));
  imc_site_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key,'competition'=>$map[0]??null,'summary'=>['results'=>count($results),'upcoming'=>count($upcoming),'match_reports'=>count($reports)],'latest_results'=>array_slice($results,0,10),'next_matches'=>array_slice($upcoming,0,10)]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'competition_overview_error'],500);}
