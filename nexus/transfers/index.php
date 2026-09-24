<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Transfers');
 $w=['game_world_id=?'];$p=[$gw];if($season!==null){$w[]='imc_season=?';$p[]=$season;}$rows=nexus_rows($db,'SELECT * FROM `'.$table.'` WHERE '.implode(' AND ',$w).' ORDER BY (normalized_transfer_date IS NULL) ASC, normalized_transfer_date DESC, imc_transfer_number DESC LIMIT 2000',$p);
 $core=nexus_db($c,'core');
 $clubs=nexus_rows($core,'SELECT m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]);$clubImages=[];foreach($clubs as $x){if($x['world_id']!==null)$clubImages[(string)$x['world_id']]=$x['image_url']??null;}
 $players=nexus_rows($core,'SELECT id,image_url FROM `IMC Player Codex Global`');$playerImages=[];foreach($players as $x)$playerImages[(string)$x['id']]=$x['image_url']??null;
 foreach($rows as &$x){$x['player_image_resolved']=$x['player_image']?:($playerImages[(string)($x['player_id']??'')]??null);$x['club_from_image']=$clubImages[(string)($x['from_sm_world_club_id']??'')]??null;$x['club_to_image']=$clubImages[(string)($x['to_sm_world_club_id']??'')]??null;}$x=null;
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'transfers_error'],500);}
