<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/standings-engine.php';
require __DIR__.'/custom-cups.php';
require __DIR__.'/result-identity.php';
try{
  $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$season=imc_site_season($_GET['season']??null);
  $key=trim((string)($_GET['competition']??''));if($season===null)throw new InvalidArgumentException('season_required');if($key==='')throw new InvalidArgumentException('competition_required');
  $db=imc_site_db($c,imc_site_target($c,$gw));$table=imc_site_table($gw,'Results');
  $rows=imc_site_rows($db,'SELECT competition_key,match_date,sm_fixture_id,competition_stage,competition_group_name,home_sm_club_id,home_name,away_sm_club_id,away_name,home_score,away_score,result_status FROM `'.$table.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY match_date,sm_fixture_id',[$gw,$season,$key]);
  $rows=imc_site_result_identity($gw,$rows);
  imc_site_out(array_merge(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key],imc_site_standings_tables($rows,imc_site_custom_cup($gw,$season,$key)['groups']??[])));
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'competition_standings_error'],500);}
