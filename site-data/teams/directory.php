<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$type=strtolower(trim((string)($_GET['type']??'clubs')));$core=imc_site_db($c,'core');
 if($type==='clubs'){$rows=imc_site_rows($core,'SELECT m.`Club ID` entity_id,m.`Club Name` name,m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=? ORDER BY m.`Club Name`',[$gw]);}
 elseif($type==='nations'){$rows=imc_site_rows($core,'SELECT m.`National Team ID` entity_id,m.`National Team Name` name,m.`SM World National Club ID` world_id,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=? ORDER BY m.`National Team Name`',[$gw]);}
 else throw new InvalidArgumentException('invalid_team_type');
 // Current assignments are keyed by Game World + assignment type + world team ID.
 $kind=$type==='clubs'?'club':'national_team';$managers=[];
 $imc=imc_site_rows($core,"SELECT a.manager_id,m.full_name,a.team_id,a.national_team_id FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=? AND a.assignment_type=? AND a.end_date IS NULL AND (a.start_date IS NULL OR a.start_date<=CURRENT_DATE) ORDER BY a.start_date DESC,a.id DESC",[$gw,$kind]);
 foreach($imc as $a){$key=(string)($kind==='club'?$a['team_id']:$a['national_team_id']);if($key!==''&&!isset($managers[$key]))$managers[$key]=['manager_id'=>$a['manager_id'],'full_name'=>$a['full_name'],'is_imc'=>true];}
 foreach($rows as &$row)$row['manager']=$managers[(string)$row['world_id']]??null;unset($row);
 imc_site_out(['ok'=>true,'game_world_id'=>$gw,'type'=>$type,'country_filter'=>false,'count'=>count($rows),'rows'=>$rows]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'teams_directory_error'],500);}

