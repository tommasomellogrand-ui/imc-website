<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$core=nexus_db($c,'core');$id=trim((string)($_GET['manager']??''));$gw=isset($_GET['world'])?nexus_world($_GET['world']):null;
 if(isset($_GET['external'])){
  $sql='SELECT a.sm_manager_id,m.manager_name,a.game_world_id,a.assignment_type,a.sm_world_team_id,a.team_name FROM `EXT Manager Assignment Global` a JOIN `EXT Manager Codex Global` m ON m.sm_manager_id=a.sm_manager_id WHERE a.game_world_id=? ORDER BY m.manager_name,a.assignment_type,a.team_name';
  $rows=nexus_rows($core,$sql,[$gw??'GW001']);
  try {
   $logos=[];
   foreach(nexus_rows($core,'SELECT m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw??'GW001']) as $m){$logos['club'][(string)$m['world_id']]=$m['image_url'];}
   foreach(nexus_rows($core,'SELECT m.`SM World National Club ID` world_id,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$gw??'GW001']) as $m){$logos['national_team'][(string)$m['world_id']]=$m['image_url'];}
   foreach($rows as &$a){$a['image_url']=$logos[$a['assignment_type']][(string)$a['sm_world_team_id']]??null;}unset($a);
  }catch(Throwable $e){/* Optional logos must not hide external managers. */}
  nexus_out(['ok'=>true,'rows'=>$rows]);
 }
 if($id!==''){
  $rows=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` WHERE manager_id=? LIMIT 1',[$id]);
  $sql='SELECT a.*, COALESCE(a.team_name,n.`National Team Name`) AS assignment_name, n.`National Team Name` AS national_name FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Game World National Team Mapping` n ON n.`Game World`=a.game_world_id AND (n.`National Team ID`=a.national_team_id OR n.`SM National Team ID`=a.national_team_id OR n.`SM World National Club ID`=a.national_team_id) WHERE a.manager_id=?'.($gw?' AND a.game_world_id=?':'').' ORDER BY a.start_date DESC,a.id DESC';
  $assign=nexus_rows($core,$sql,$gw?[$id,$gw]:[$id]);
  // Optional display enrichment: identifiers remain the authoritative world mappings.
  try {
   $maps=[];
   foreach(array_unique(array_column($assign,'game_world_id')) as $world){
    $maps[$world]['club']=nexus_rows($core,'SELECT m.`SM World Club ID` world_id,m.`Club ID` entity_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$world]);
    $maps[$world]['national_team']=nexus_rows($core,'SELECT m.`SM World National Club ID` world_id,m.`National Team ID` entity_id,m.`SM National Team ID` sm_id,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$world]);
   }
   foreach($assign as &$a){$type=$a['assignment_type'];$team=(string)($type==='club'?$a['team_id']:$a['national_team_id']);$found=[];
    foreach($maps[$a['game_world_id']][$type]??[] as $m){$ids=$type==='club'?[$m['world_id']]:[$m['world_id'],$m['entity_id'],$m['sm_id']];if((int)$team>0&&in_array($team,array_map('strval',$ids),true))$found[(string)$m['world_id']]=$m;}
    if(count($found)===1){$m=array_values($found)[0];$a['world_team_id']=$m['world_id'];$a['image_url']=$m['image_url'];}
   }unset($a);
  }catch(Throwable $e){/* A missing optional logo must not hide a manager. */}
nexus_out(['ok'=>true,'manager'=>$rows[0]??null,'assignments'=>$assign]);
 }
 $rows=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` ORDER BY full_name');nexus_out(['ok'=>true,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'manager_error'],500);}
