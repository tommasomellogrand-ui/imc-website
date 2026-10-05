<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/standings-engine.php';
require __DIR__.'/custom-cups.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);
  $key=trim((string)($_GET['competition']??''));if($season===null)throw new InvalidArgumentException('season_required');if($key==='')throw new InvalidArgumentException('competition_required');
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Results');
  $rows=nexus_rows($db,'SELECT sm_fixture_id,competition_stage,competition_group_name,home_sm_club_id,home_name,away_sm_club_id,away_name,home_score,away_score,result_status FROM `'.$table.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY match_date,sm_fixture_id',[$gw,$season,$key]);
  nexus_out(array_merge(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key],nexus_standings_tables($rows,nexus_custom_cup($gw,$season,$key)['groups']??[])));
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_standings_error'],500);}
