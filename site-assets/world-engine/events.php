<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/site-data/core/bootstrap.php';
try{
 $worlds=require __DIR__.'/worlds.php';$slug=(string)($_GET['world']??'');
 if(!isset($worlds[$slug]))throw new InvalidArgumentException('invalid_world');
 $gw=$worlds[$slug][0];$c=imc_site_config();$core=imc_site_db($c,'core');
 $rows=imc_site_rows($core,"SELECT a.manager_id,m.full_name,m.face_image_url,a.start_date,a.end_date,
 COALESCE(NULLIF(c.nexus_view,''),c.name,n.name,a.team_name) assignment_name,
 COALESCE(c.image_url,n.image_url) image_url
 FROM `IMC Manager Assignment Global` a
 JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id
 LEFT JOIN `IMC Game World Club Mapping` cm ON a.assignment_type='club' AND cm.`Game World`=a.game_world_id AND cm.`SM World Club ID`=a.team_id
 LEFT JOIN `IMC Club Codex Global` c ON c.id=cm.`Club ID`
 LEFT JOIN `IMC Game World National Team Mapping` nm ON a.assignment_type='national_team' AND nm.`Game World`=a.game_world_id AND nm.`SM World National Club ID`=a.national_team_id
 LEFT JOIN `IMC National Team Codex Global` n ON n.id=nm.`National Team ID`
 WHERE a.game_world_id=?",[$gw]);
 $today=(new DateTimeImmutable('today',new DateTimeZone('Europe/Rome')))->format('Y-m-d');$events=[];
 foreach($rows as $r)foreach(['start_date'=>'assume la guida di','end_date'=>'lascia'] as $field=>$verb){
  $day=$r[$field];if(!$day||$day==='0000-00-00'||$day>$today||!$r['assignment_name'])continue;
  $events[]=['day'=>$day,'title'=>$r['full_name'].' '.$verb.' '.$r['assignment_name'],'images'=>[$r['image_url']],'portrait'=>$r['face_image_url'],'detail'=>''];
 }
 usort($events,static fn(array $a,array $b):int=>strcmp($b['day'],$a['day']));
 imc_site_out(['ok'=>true,'world'=>$slug,'events'=>array_slice($events,0,10)]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>'invalid_world'],422);}
catch(Throwable $e){error_log('World manager events: '.$e->getMessage());imc_site_out(['ok'=>false,'error'=>'events_unavailable'],503);}
