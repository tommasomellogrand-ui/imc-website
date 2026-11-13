<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/site-data/core/bootstrap.php';
header('Cache-Control: no-store, max-age=0');
try{
 $gw=imc_site_world((string)($_GET['world']??''));$config=imc_site_config();
 $db=imc_site_db($config,imc_site_target($config,$gw));$core=imc_site_db($config,'core');
 // Display existing awards only. Synchronisation remains with the existing award automation.
 $rows=imc_site_rows($db,'SELECT * FROM `'.imc_site_table($gw,'Trophy_Room').'` WHERE game_world_id=? ORDER BY imc_season DESC,won_date DESC,id',[$gw]);
 $labels=[];foreach(imc_site_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $r)$labels[$r['competition_key']]=$r['nexus_view'];
 $competitions=[];
 foreach($labels as $key=>$label){
  if(!$label)continue;
  $group=null;
  foreach(explode('|',$key) as $part)if(in_array(strtoupper($part),['DOMESTIC','INTERNATIONAL','NATIONS','IMC'],true)){$group=strtoupper($part);break;}
  if(str_starts_with($key,$gw.'_IMC_'))$group='IMC';
  if($group)$competitions[]=['competition_key'=>$key,'nexus_view'=>$label,'competition_group'=>$group];
 }
 $imcKey=static fn(string $key): string => preg_replace('/^(?:GW[0-9]{3}|IMC-?[0-9]{3})/', '', $key);
 $imcCompetitions=[];
 foreach(imc_site_rows($core,"SELECT competition_key,custom_competition FROM `IMC Competition Codex Global` WHERE game_world_id=? AND UPPER(TRIM(sm_action_group))='IMC'",[$gw]) as $competition){
  $imcCompetitions[$imcKey((string)$competition['competition_key'])]=$competition['custom_competition'];
  $competitions[]=['competition_key'=>$competition['competition_key'],'nexus_view'=>$competition['custom_competition'],'competition_group'=>'IMC'];
 }
 $logos=['club'=>[],'national_team'=>[]];
 foreach(imc_site_rows($core,'SELECT m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]) as $r)$logos['club'][(string)$r['world_id']]=$r['image_url'];
 foreach(imc_site_rows($core,'SELECT m.`SM World National Club ID` world_id,c.image_url FROM `IMC Game World National Team Mapping` m JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$gw]) as $r)$logos['national_team'][(string)$r['world_id']]=$r['image_url'];
 $assignments=imc_site_rows($core,'SELECT a.assignment_type,a.team_id,a.national_team_id,a.start_date,a.end_date,m.manager_id,m.full_name,m.face_image_url FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=?',[$gw]);
 foreach($rows as &$r){
  $imcName=$imcCompetitions[$imcKey((string)$r['competition_key'])]??null;
  if($imcName!==null){$r['competition_group']='IMC';$r['nexus_view']=$imcName;}
  $national=($r['competition_group']??'')==='NATIONS'||in_array($r['trophy_type']??'',['worldcup','interqualifier'],true);
  $kind=$national?'national_team':'club';$team=(string)($r['winner_sm_world_club_id']??'');$day=substr((string)($r['won_date']??''),0,10);
  $r['winner_logo_url']=$logos[$kind][$team]??null;$r['winner_manager_id']=null;$r['winner_manager_name']=null;$r['winner_manager_photo_url']=null;
  $r['nexus_view']=$labels[$r['competition_key']]??($r['nexus_view']??$r['trophy_type']);
  $matches=[];
  if(preg_match('/^\d{4}-\d{2}-\d{2}$/',$day)&&$team!==''&&$team!=='0')foreach($assignments as $a){
   if($a['assignment_type']!==$kind||(string)($national?$a['national_team_id']:$a['team_id'])!==$team)continue;
   if(!$a['start_date']||$a['start_date']==='0000-00-00'||$a['start_date']>$day||($a['end_date']!==null&&$a['end_date']<$day))continue;
   $matches[$a['manager_id']]=$a;
  }
  if(count($matches)===1){$m=reset($matches);$r['winner_manager_id']=$m['manager_id'];$r['winner_manager_name']=$m['full_name'];$r['winner_manager_photo_url']=trim((string)($m['face_image_url']??''))?:null;}
 }unset($r);
 imc_site_out(['ok'=>true,'game_world_id'=>$gw,'rows'=>$rows,'competitions'=>$competitions,'generated_at'=>gmdate('c')]);
}catch(Throwable $e){error_log('RTH trophy room: '.$e->getMessage());imc_site_out(['ok'=>false,'error'=>'trophy_room_unavailable'],500);}

