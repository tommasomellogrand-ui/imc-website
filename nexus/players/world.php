<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Player_Codex');$id=(int)($_GET['player']??0);
 $sql='SELECT * FROM `'.$table.'`'.($id>0?' WHERE player_id=?':'').' LIMIT 1000';$rows=nexus_rows($db,$sql,$id>0?[$id]:[]);nexus_out(['ok'=>true,'game_world_id'=>$gw,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'player_world_error'],500);}
