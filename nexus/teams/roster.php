<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/players/media.php';
require __DIR__.'/roster-stats.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);
  $raw=(string)($_GET['sm_club']??'');if(!ctype_digit($raw)||(int)$raw<1)throw new InvalidArgumentException('invalid_club');$club=(int)$raw;
  $national=($_GET['type']??'')==='nation';
  $db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
  $params=[$gw,$club,$club];$where='game_world_id=? AND (home_sm_club_id=? OR away_sm_club_id=?)';
  if($national)$where.=" AND (competition_group='NATIONS' OR competition_key LIKE '%|NATIONS|%')";
  if(!$national)$where.=" AND COALESCE(competition_group,'')<>'NATIONS' AND COALESCE(competition_key,'') NOT LIKE '%|NATIONS|%'";
  $reports=nexus_rows($db,'SELECT sm_fixture_id,imc_season,match_date,home_sm_club_id,away_sm_club_id,home_score,away_score,players_json,commentary_json FROM `'.nexus_table($gw,'Match_Report').'` WHERE '.$where.' ORDER BY match_date,sm_fixture_id',$params);
  $source=['roster_source'=>'player_codex'];
  if($national){
    $snapshot=nexus_national_roster($reports,$club);$roster=$snapshot['rows'];
    $source=['roster_source'=>'latest_match_report','roster_fixture'=>$snapshot['fixture'],'roster_date'=>$snapshot['date']];
    $ids=array_column($roster,'player_id');$worldPlayers=[];
    if($ids)foreach(nexus_rows($db,'SELECT player_id,full_name,position,rating,age,nationality,image_url FROM `'.nexus_table($gw,'Player_Codex').'` WHERE player_id IN ('.implode(',',array_fill(0,count($ids),'?')).')',$ids) as $p)$worldPlayers[(int)$p['player_id']]=$p;
    foreach($roster as &$p){foreach($worldPlayers[$p['player_id']]??[] as $field=>$value)if($value!==null&&$value!=='')$p[$field]=$value;}unset($p);
    if($season!==null)$reports=array_values(array_filter($reports,static fn($r)=>(int)$r['imc_season']===$season));
  }else{
    $roster=nexus_rows($db,'SELECT player_id,full_name,position,rating,age,nationality,image_url FROM `'.nexus_table($gw,'Player_Codex').'` WHERE current_sm_club_id=? ORDER BY full_name,player_id',[$club]);
    $transfers=nexus_rows($db,'SELECT * FROM `'.nexus_table($gw,'Transfers').'` WHERE game_world_id=? AND (from_sm_world_club_id=? OR to_sm_world_club_id=?)',[$gw,$club,$club]);
    $roster=nexus_club_roster($roster,$reports,$transfers,$club);
    $ids=array_column($roster,'player_id');$worldPlayers=[];
    foreach(array_chunk($ids,500) as $chunk)foreach(nexus_rows($db,'SELECT player_id,full_name,position,rating,age,nationality,image_url,current_sm_club_id FROM `'.nexus_table($gw,'Player_Codex').'` WHERE player_id IN ('.implode(',',array_fill(0,count($chunk),'?')).')',$chunk) as $p)$worldPlayers[(int)$p['player_id']]=$p;
    foreach($roster as &$p){foreach($worldPlayers[$p['player_id']]??[] as $field=>$value)if($value!==null&&$value!=='')$p[$field]=$value;}unset($p);
    foreach($roster as &$p){if(!isset($p['status_transfer_number'])&&(int)($p['current_sm_club_id']??0)>0)$p['roster_status']=(int)$p['current_sm_club_id']===$club?'active':'departed';unset($p['current_sm_club_id']);}unset($p);
    $source=['roster_source'=>'match_reports_player_codex_transfers'];
    if($season!==null)$reports=array_values(array_filter($reports,static fn($r)=>(int)$r['imc_season']===$season));
  }
  $identities=nexus_player_identity($core,array_column($roster,'player_id'));
  foreach($roster as &$p){
    $identity=$identities[(int)$p['player_id']]??[];
    foreach(['position','rating','age','nationality'] as $field){if($p[$field]===null||$p[$field]==='')$p[$field]=$identity[$field]??null;}
    if(!empty($identity['full_name']))$p['full_name']=$identity['full_name'];
    $p['image_urls']=nexus_player_images((int)$p['player_id'],$identity,$p['image_url']);unset($p['image_url']);
  }unset($p);
  nexus_out(array_merge(['ok'=>true,'game_world_id'=>$gw,'imc_season'=>$season,'sm_club'=>$club,'generated_at'=>gmdate('c')],$source,nexus_roster_stats($roster,$reports,$club)));
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'club_roster_error'],500);}

