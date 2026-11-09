<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
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
 if(in_array($day,$days,true)){
  $start=new DateTimeImmutable($day,$rome);
  $events=nexus_rows($core,'SELECT player_id,full_name,age,position,rating,image_url,nationality,market_value,rating_delta FROM `IMC Daily Updates` WHERE source_tab=? AND imported_at>=? AND imported_at<? ORDER BY imported_at DESC',[$tab,$start->setTimezone($utc)->format('Y-m-d H:i:s'),$start->modify('+1 day')->setTimezone($utc)->format('Y-m-d H:i:s')]);
  foreach(array_chunk($events,300) as $batch){
   $ids=array_column($batch,'player_id');
   $clubs=array_column(nexus_rows($world,'SELECT player_id,current_club FROM IMC001_Player_Codex WHERE player_id IN ('.implode(',',array_fill(0,count($ids),'?')).')',$ids),'current_club','player_id');
   foreach($batch as $r)if(!isset($rows[$r['player_id']]))$rows[$r['player_id']]=$r+['current_club'=>$clubs[$r['player_id']]??null];
  }
 }
 nexus_out(['ok'=>true,'days'=>$days,'day'=>$day,'rows'=>array_values($rows)]);
}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'daily_unavailable'],500);}
