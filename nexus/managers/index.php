<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$core=nexus_db($c,'core');$id=trim((string)($_GET['manager']??''));$gw=isset($_GET['world'])?nexus_world($_GET['world']):null;
 if($id!==''){$rows=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` WHERE manager_id=? LIMIT 1',[$id]);$assign=nexus_rows($core,'SELECT * FROM `IMC Manager Assignment Global` WHERE manager_id=?'.($gw?' AND game_world_id=?':'').' ORDER BY start_date DESC,id DESC',$gw?[$id,$gw]:[$id]);nexus_out(['ok'=>true,'manager'=>$rows[0]??null,'assignments'=>$assign]);}
 $rows=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` ORDER BY full_name');nexus_out(['ok'=>true,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'manager_error'],500);}
