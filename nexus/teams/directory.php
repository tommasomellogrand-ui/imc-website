<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$type=strtolower(trim((string)($_GET['type']??'clubs')));$core=nexus_db($c,'core');
 if($type==='clubs'){$rows=nexus_rows($core,'SELECT m.`Club ID` entity_id,m.`Club Name` name,m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=? ORDER BY m.`Club Name`',[$gw]);}
 elseif($type==='nations'){$rows=nexus_rows($core,'SELECT m.`National Team ID` entity_id,m.`National Team Name` name,m.`SM World National Club ID` world_id,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=? ORDER BY m.`National Team Name`',[$gw]);}
 else throw new InvalidArgumentException('invalid_team_type');
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'type'=>$type,'count'=>count($rows),'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'teams_directory_error'],500);}
