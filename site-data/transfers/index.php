<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/players/media.php';
require dirname(__DIR__).'/competitions/match-teams.php';
try{
 $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$season=imc_site_season($_GET['season']??null);$db=imc_site_db($c,imc_site_target($c,$gw));
 $limit=isset($_GET['limit'])?max(1,min(2000,(int)$_GET['limit'])):null;
 $club=null;if(isset($_GET['sm_club'])){$value=(string)$_GET['sm_club'];if(!ctype_digit($value)||(int)$value<1)throw new InvalidArgumentException('invalid_club');$club=(int)$value;}
 $rows=imc_site_transfers($db,$gw,club:$club,season:$season,limit:$club===null?$limit:null,withPlayer:true);
 if($rows){
  $core=imc_site_db($c,'core');$identities=imc_site_player_identity($core,array_column($rows,'player_id'));
  $lookup=imc_site_team_lookup(imc_site_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),imc_site_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]));
  foreach($rows as &$row){
   $identity = $identities[(int)($row['player_id'] ?? 0)] ?? [];
   $name = trim((string)($identity['full_name'] ?? ''));
   if ($name === '') {
    $name = trim(($identity['forename'] ?? '').' '.($identity['surname'] ?? ''));
   }
   $worldName = trim((string)($row['world_name'] ?? ''));
   if ($worldName !== '') $name = $worldName;
   if ($name !== '') $row['player_name'] = $name;
   $row['codex_age'] = $row['world_age'] ?? $identity['age'] ?? null;
   $row['codex_rating'] = $row['world_rating'] ?? $identity['rating'] ?? null;
   if (!empty($row['world_photo'])) $identity['image_url'] = $row['world_photo'];
   unset($row['world_name'], $row['world_age'], $row['world_rating'], $row['world_photo']);
   $row['player_images']=imc_site_player_images((int)($row['player_id']??0),$identity,$row['player_image']??null);
   foreach(['from','to'] as $side){
    $id=$lookup['world'][(int)($row[$side.'_sm_world_club_id']??0)]??$lookup['name'][imc_site_team_name_key((string)($row['club_'.$side]??''))]??null;
    $row[$side.'_logo_url']=$id!==null?imc_site_player_image_url($lookup['id'][$id]['image_url']??null):null;
   }
  }unset($row);
 }
 imc_site_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'rows'=>$rows]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'transfers_error'],500);}
