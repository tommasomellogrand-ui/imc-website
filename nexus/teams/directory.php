<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$type=strtolower(trim((string)($_GET['type']??'clubs')));$core=nexus_db($c,'core');
 if($type==='clubs'){$rows=nexus_rows($core,'SELECT `Club Name` name,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=? ORDER BY `Club Name`',[$gw]);}
 elseif($type==='nations'){$rows=nexus_rows($core,'SELECT `National Team Name` name,`SM World National Club ID` world_id FROM `IMC Game World National Team Mapping` WHERE `Game World`=? ORDER BY `National Team Name`',[$gw]);}
 else throw new InvalidArgumentException('invalid_team_type');
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'type'=>$type,'count'=>count($rows),'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'teams_directory_error'],500);}
