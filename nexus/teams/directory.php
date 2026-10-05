<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$type=strtolower(trim((string)($_GET['type']??'clubs')));$core=nexus_db($c,'core');
 if($type==='clubs'){$rows=nexus_rows($core,'SELECT m.`Club ID` entity_id,m.`Club Name` name,m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=? ORDER BY m.`Club Name`',[$gw]);}
 elseif($type==='nations'){$rows=nexus_rows($core,'SELECT m.`National Team ID` entity_id,m.`National Team Name` name,m.`SM World National Club ID` world_id,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=? ORDER BY m.`National Team Name`',[$gw]);}
 else throw new InvalidArgumentException('invalid_team_type');
 // Current assignments are keyed by Game World + assignment type + world team ID.
 $kind=$type==='clubs'?'club':'national_team';$managers=[];
 $imc=nexus_rows($core,"SELECT a.manager_id,m.full_name,a.team_id,a.national_team_id FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=? AND a.assignment_type=? AND a.end_date IS NULL AND (a.start_date IS NULL OR a.start_date<=CURRENT_DATE) ORDER BY a.start_date DESC,a.id DESC",[$gw,$kind]);
 foreach($imc as $a){$key=(string)($kind==='club'?$a['team_id']:$a['national_team_id']);if($key!==''&&!isset($managers[$key]))$managers[$key]=['manager_id'=>$a['manager_id'],'full_name'=>$a['full_name'],'is_imc'=>true];}
 $ext=nexus_rows($core,'SELECT a.sm_manager_id,m.manager_name,a.sm_world_team_id FROM `EXT Manager Assignment Global` a JOIN `EXT Manager Codex Global` m ON m.sm_manager_id=a.sm_manager_id WHERE a.game_world_id=? AND a.assignment_type=? ORDER BY a.sm_manager_id',[$gw,$kind]);
 foreach($ext as $a){$key=(string)$a['sm_world_team_id'];if($key!==''&&!isset($managers[$key]))$managers[$key]=['sm_manager_id'=>$a['sm_manager_id'],'full_name'=>$a['manager_name'],'is_imc'=>false];}
 foreach($rows as &$row)$row['manager']=$managers[(string)$row['world_id']]??null;unset($row);
 $countryFilter=$type==='clubs'&&in_array($gw,['GW002','GW003','GW007','GW008'],true);
 if($countryFilter){
  // League membership defines the country filter (including cross-border clubs).
  $db=nexus_db($c,nexus_target($c,$gw));$countries=[];
  foreach(['Results','Schedule'] as $source){$table=nexus_table($gw,$source);
   $members=nexus_rows($db,"SELECT DISTINCT competition_key,home_sm_club_id,away_sm_club_id FROM `".$table."` WHERE game_world_id=? AND sm_action='league'",[$gw]);
   foreach($members as $m){$parts=explode('|',(string)$m['competition_key']);if(count($parts)<4||$parts[2]!=='DOMESTIC'||!preg_match('/^[A-Z]{3}$/',$parts[1]))continue;foreach(['home_sm_club_id','away_sm_club_id'] as $side)$countries[(string)$m[$side]][$parts[1]]=true;}
  }
  foreach($rows as &$row){$codes=array_keys($countries[(string)$row['world_id']]??[]);$row['country_code']=count($codes)===1?$codes[0]:null;}unset($row);
 }
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'type'=>$type,'country_filter'=>$countryFilter,'count'=>count($rows),'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'teams_directory_error'],500);}
