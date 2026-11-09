<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
require_once dirname(__DIR__,2).'/nexus/competitions/match-teams.php';
require_once dirname(__DIR__,2).'/nexus/players/media.php';
try {
 $cfg=nexus_config();
 $core=nexus_db($cfg,'core');
 $world=nexus_db($cfg,'custom');
 $tab=$_GET['tab']??'changes';
 if(!in_array($tab,['changes','new'],true))throw new InvalidArgumentException();
 $rome=new DateTimeZone('Europe/Rome');$utc=new DateTimeZone('UTC');
 $days=[];
 foreach(nexus_rows($core,'SELECT DISTINCT imported_at FROM `IMC Daily Updates` WHERE source_tab=? ORDER BY imported_at DESC',[$tab]) as $stamp){
  $days[(new DateTimeImmutable($stamp['imported_at'],$utc))->setTimezone($rome)->format('Y-m-d')]=true;
 }
 $days=array_keys($days);
 $day=($_GET['day']??'')?:($days[0]??null);
 $rows=[];
 $lookup=nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),nexus_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',['GW004']));
 if(in_array($day,$days,true)){
  $start=new DateTimeImmutable($day,$rome);
  $events=nexus_rows($core,'SELECT player_id,full_name,age,position,rating,image_url,nationality,market_value,rating_delta,(SELECT prev.position FROM `IMC Daily Updates` prev WHERE prev.player_id=cur.player_id AND prev.imported_at<cur.imported_at ORDER BY prev.imported_at DESC LIMIT 1) previous_position FROM `IMC Daily Updates` cur WHERE source_tab=? AND imported_at>=? AND imported_at<? ORDER BY imported_at DESC',[$tab,$start->setTimezone($utc)->format('Y-m-d H:i:s'),$start->modify('+1 day')->setTimezone($utc)->format('Y-m-d H:i:s')]);
  foreach(array_chunk($events,300) as $batch){
   $ids=array_column($batch,'player_id');
   $clubs=array_column(nexus_rows($world,'SELECT player_id,current_club,current_sm_club_id FROM IMC006_Player_Codex WHERE player_id IN ('.implode(',',array_fill(0,count($ids),'?')).')',$ids),null,'player_id');
   foreach($batch as $r){
    $id=$r['player_id'];if(isset($rows[$id]))continue;
    $club=$clubs[$id]??[];$name=$club['current_club']??null;
    $entity=$lookup['world'][(int)($club['current_sm_club_id']??0)]??$lookup['name'][nexus_team_name_key((string)$name)]??null;
    $rows[$id]=$r+['current_club'=>$name,'club_logo_url'=>$entity!==null?nexus_player_image_url($lookup['id'][$entity]['image_url']??null):null];
   }
  }
 }
 nexus_out(['ok'=>true,'days'=>$days,'day'=>$day,'rows'=>array_values($rows)]);
}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'daily_unavailable'],500);}
