<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$core=nexus_db($c,'core');$id=(int)($_GET['player']??0);
 if($id>0){$a=nexus_rows($core,'SELECT id,forename,surname,image_file,image_url FROM `IMC Player Codex Global` WHERE id=? LIMIT 1',[$id]);$d=nexus_rows($core,'SELECT * FROM `IMC Player Codex Global Data` WHERE player_id=? LIMIT 1',[$id]);$h=nexus_rows($core,'SELECT id,player_id,change_date,old_rating,new_rating,imported_at FROM `IMC Player Codex Global Rating History` WHERE player_id=? ORDER BY change_date DESC,id DESC',[$id]);nexus_out(['ok'=>true,'player'=>$a[0]??null,'data'=>$d[0]??null,'rating_history'=>$h]);}
 $rows=nexus_rows($core,'SELECT id,forename,surname,image_file,image_url FROM `IMC Player Codex Global` ORDER BY surname,forename,id LIMIT 500');nexus_out(['ok'=>true,'rows'=>$rows]);
}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'player_error'],500);}
