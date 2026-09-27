<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require __DIR__.'/media.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Player_Codex');$id=(int)($_GET['player']??0);
 $sql='SELECT * FROM `'.$table.'`'.($id>0?' WHERE player_id=?':'');$rows=nexus_rows($db,$sql,$id>0?[$id]:[]);if($rows){$core=nexus_db($c,'core');$lookup=nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),nexus_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]));foreach($rows as &$r){$club=$lookup['world'][(int)($r['current_sm_club_id']??0)]??$lookup['name'][nexus_team_name_key((string)($r['current_club']??''))]??null;$r['club_logo_url']=$club!==null?nexus_player_image_url($lookup['id'][$club]['image_url']??null):null;}unset($r);}
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'player_world_error'],500);}
