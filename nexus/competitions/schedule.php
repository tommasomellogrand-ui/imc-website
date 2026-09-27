<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$key=trim((string)($_GET['competition']??''));
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Schedule');
  $where=['game_world_id=?'];$p=[$gw];
  if($season!==null){$where[]='imc_season=?';$p[]=$season;} if($key!==''){$where[]='competition_key=?';$p[]=$key;}
  $sql='SELECT game_world_id,imc_season,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,match_time,home_sm_team_id,home_name,away_sm_team_id,away_name,home_sm_manager_id,away_sm_manager_id FROM `'.$table.'` WHERE '.implode(' AND ',$where).' ORDER BY match_date ASC,match_time ASC,sm_fixture_id ASC';
  $rows=nexus_rows($db,$sql,$p);
  $groupRows=nexus_rows($db,'SELECT imc_season,competition_key,competition_group_name,home_sm_club_id,away_sm_club_id FROM `'.nexus_table($gw,'Results').'` WHERE '.implode(' AND ',$where)." AND competition_group_name IS NOT NULL AND competition_group_name<>''",$p);
  $groups=[];foreach($groupRows as $r)foreach(['home_sm_club_id','away_sm_club_id'] as $field){$team=(string)($r[$field]??'');if($team!=='')$groups[$r['imc_season']][$r['competition_key']][$team][$r['competition_group_name']]=true;}
  foreach($rows as &$r){$r['competition_group_name']=null;$stage=trim((string)($r['competition_stage']??''));if($stage!==''&&!preg_match('/group|grupp|giron|qualific/i',$stage))continue;$home=$groups[$r['imc_season']][$r['competition_key']][(string)$r['home_sm_team_id']]??[];$away=$groups[$r['imc_season']][$r['competition_key']][(string)$r['away_sm_team_id']]??[];if(count($home)===1&&count($away)===1&&array_key_first($home)===array_key_first($away))$r['competition_group_name']=array_key_first($home);}unset($r);
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key?:null,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_schedule_error'],500);}
