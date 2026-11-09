<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require __DIR__.'/media.php';
try{
 $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$db=imc_site_db($c,imc_site_target($c,$gw));$table=imc_site_table($gw,'Player_Codex');$id=(int)($_GET['player']??0);
 $sql='SELECT * FROM `'.$table.'`'.($id>0?' WHERE player_id=?':'');$rows=imc_site_rows($db,$sql,$id>0?[$id]:[]);if($rows){$core=imc_site_db($c,'core');$lookup=imc_site_team_lookup(imc_site_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),imc_site_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]));foreach($rows as &$r){$club=$lookup['world'][(int)($r['current_sm_club_id']??0)]??$lookup['name'][imc_site_team_name_key((string)($r['current_club']??''))]??null;$r['club_logo_url']=$club!==null?imc_site_player_image_url($lookup['id'][$club]['image_url']??null):null;}unset($r);}
 imc_site_out(['ok'=>true,'game_world_id'=>$gw,'rows'=>$rows]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'player_world_error'],500);}
