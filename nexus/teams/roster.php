<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/players/media.php';
require __DIR__.'/roster-stats.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);
  $raw=(string)($_GET['sm_club']??'');if(!ctype_digit($raw)||(int)$raw<1)throw new InvalidArgumentException('invalid_club');$club=(int)$raw;
  $db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
  $roster=nexus_rows($db,'SELECT player_id,full_name,position,rating,age,nationality,image_url FROM `'.nexus_table($gw,'Player_Codex').'` WHERE current_sm_club_id=? ORDER BY full_name,player_id',[$club]);
  $identities=nexus_player_identity($core,array_column($roster,'player_id'));
  foreach($roster as &$p){
    $identity=$identities[(int)$p['player_id']]??[];
    foreach(['position','rating','age','nationality'] as $field){if($p[$field]===null||$p[$field]==='')$p[$field]=$identity[$field]??null;}
    $p['image_urls']=nexus_player_images((int)$p['player_id'],$identity,$p['image_url']);unset($p['image_url']);
  }unset($p);
  $params=[$gw,$club,$club];$where='game_world_id=? AND (home_sm_club_id=? OR away_sm_club_id=?)';
  if($season!==null){$where.=' AND imc_season=?';$params[]=$season;}
  $reports=nexus_rows($db,'SELECT sm_fixture_id,home_sm_club_id,away_sm_club_id,home_score,away_score,players_json,commentary_json FROM `'.nexus_table($gw,'Match_Report').'` WHERE '.$where.' ORDER BY match_date,sm_fixture_id',$params);
  nexus_out(array_merge(['ok'=>true,'game_world_id'=>$gw,'imc_season'=>$season,'sm_club'=>$club,'generated_at'=>gmdate('c')],nexus_roster_stats($roster,$reports,$club)));
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'club_roster_error'],500);}
