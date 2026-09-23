<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$club=(int)($_GET['club']??0);if($club<1)throw new InvalidArgumentException('invalid_club');
 $core=nexus_db($c,'core');
 $map=nexus_rows($core,'SELECT `Game World` game_world_id,`Club ID` club_id,`Club Name` club_name,`SM Club ID` sm_club_id FROM `IMC Game World Club Mapping` WHERE `Game World`=? AND `Club ID`=? LIMIT 1',[$gw,$club]);
 $codex=nexus_rows($core,'SELECT id,name,image_file,image_url FROM `IMC Club Codex Global` WHERE id=? LIMIT 1',[$club]);
 $manager=nexus_rows($core,'SELECT manager_id,full_name,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=? AND club_id=? ORDER BY start_date DESC,id DESC LIMIT 1',[$gw,$club]);
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'club'=>$codex[0]??null,'mapping'=>$map[0]??null,'manager'=>$manager[0]??null]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'team_error'],500);}
