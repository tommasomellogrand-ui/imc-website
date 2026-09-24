<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$core=nexus_db($c,'core');$id=trim((string)($_GET['manager']??''));$gw=isset($_GET['world'])?nexus_world($_GET['world']):null;
 if($id!==''){
  $rows=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` WHERE manager_id=? LIMIT 1',[$id]);
  $sql='SELECT a.*, COALESCE(a.team_name,n.`National Team Name`) AS assignment_name, n.`National Team Name` AS national_name FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Game World National Team Mapping` n ON n.`Game World`=a.game_world_id AND (n.`National Team ID`=a.national_team_id OR n.`SM National Team ID`=a.national_team_id OR n.`SM World National Club ID`=a.national_team_id) WHERE a.manager_id=?'.($gw?' AND a.game_world_id=?':'').' ORDER BY a.start_date DESC,a.id DESC';
  $assign=nexus_rows($core,$sql,$gw?[$id,$gw]:[$id]);nexus_out(['ok'=>true,'manager'=>$rows[0]??null,'assignments'=>$assign]);
 }
 $rows=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` ORDER BY full_name');nexus_out(['ok'=>true,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'manager_error'],500);}
