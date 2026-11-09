<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/media.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require dirname(__DIR__).'/teams/roster-stats.php';
require __DIR__.'/stats-engine.php';
try{
 $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$raw=(string)($_GET['player']??'');if(!ctype_digit($raw)||(int)$raw<1)throw new InvalidArgumentException('invalid_player');$id=(int)$raw;
 $db=imc_site_db($c,imc_site_target($c,$gw));$core=imc_site_db($c,'core');
 $players=imc_site_rows($db,'SELECT * FROM `'.imc_site_table($gw,'Player_Codex').'` WHERE player_id=?',[$id]);$player=$players[0]??null;
 if(!$player){
  $global=imc_site_rows($core,'SELECT * FROM `IMC Player Codex Global Data` WHERE player_id=?',[$id]);$identityFallback=imc_site_player_identity($core,[$id])[$id]??[];
  $player=array_merge($identityFallback,$global[0]??[],['player_id'=>$id]);
  if(empty($player['full_name']))$player['full_name']=trim(($player['forename']??'').' '.($player['surname']??''));
  if(empty($player['full_name'])){
   $candidates=imc_site_rows($db,'SELECT players_json FROM `'.imc_site_table($gw,'Match_Report').'` WHERE players_json REGEXP ? ORDER BY match_date DESC',['"sm_player_id"[[:space:]]*:[[:space:]]*"?'.$id.'"?[[:space:]]*[,}]']);
   foreach($candidates as $report){foreach(json_decode((string)$report['players_json'],true)??[] as $entry){if((int)($entry['sm_player_id']??0)===$id){$player['full_name']=$entry['player_name']??('Player '.$id);break 2;}}}
  }
  if(empty($player['full_name'])){$tr=imc_site_rows($db,'SELECT player_name FROM `'.imc_site_table($gw,'Transfers').'` WHERE player_id=? ORDER BY imc_transfer_number DESC LIMIT 1',[$id]);$player['full_name']=$tr[0]['player_name']??null;}
  if(empty($player['full_name']))throw new InvalidArgumentException('player_not_found');
  $player['real_club']=$player['soccerwiki_club_name']??null;$player['salary']=null;$player['current_club']='Club nel GW non disponibile';$player['contract_seasons']=null;
 }
 $identity=imc_site_player_identity($core,[$id])[$id]??[];if(!empty($player['image_url']))$identity['image_url']=$player['image_url'];$player['image_urls']=imc_site_player_images($id,$identity,$player['image_url']??null);
 $lookup=imc_site_team_lookup(imc_site_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),imc_site_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]));
 $logo=static function($world,$name)use($lookup){$entity=$lookup['world'][(int)$world]??$lookup['name'][imc_site_team_name_key((string)$name)]??null;return $entity!==null?imc_site_player_image_url($lookup['id'][$entity]['image_url']??null):null;};
 $player['club_logo_url']=$logo($player['current_sm_club_id']??0,$player['current_club']??'');
 $rating=json_decode((string)($player['rating_history']??'[]'),true)??[];
 if(!$rating)$rating=imc_site_rows($core,'SELECT change_date,old_rating,new_rating FROM `IMC Player Codex Global Rating History` WHERE player_id=? ORDER BY change_date DESC,id DESC',[$id]);
 $competitionNames=[];foreach(imc_site_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $comp)$competitionNames[$comp['competition_key']]=$comp['nexus_view'];
 $errors=[];$matches=[];$invalid=0;
 try{
  $reports=imc_site_rows($db,'SELECT r.*,mr.players_json,mr.commentary_json FROM `'.imc_site_table($gw,'Match_Report').'` mr JOIN `'.imc_site_table($gw,'Results').'` r ON r.sm_fixture_id=mr.sm_fixture_id WHERE mr.players_json REGEXP ? ORDER BY r.match_date DESC,r.sm_fixture_id DESC',['"sm_player_id"[[:space:]]*:[[:space:]]*"?'.$id.'"?[[:space:]]*[,}]']);
  $result=imc_site_player_match_rows($player,$reports);$matches=$result['matches'];$invalid=$result['invalid_reports'];if($matches){$enriched=imc_site_enrich_match_teams($core,$gw,array_map(static function($m){$m['home_sm_club_id']=$m['side']==='home'?$m['club_id']:null;$m['away_sm_club_id']=$m['side']==='away'?$m['club_id']:null;return $m;},$matches));$matches=$enriched;foreach($matches as &$match)$match['competition_name']=$competitionNames[$match['competition_key']]??$match['competition_key'];unset($match);}
 }catch(Throwable $e){$errors['matches']='Statistiche e partite temporaneamente non disponibili.';}
 $transfers=[];try{$transfers=imc_site_rows($db,'SELECT * FROM `'.imc_site_table($gw,'Transfers').'` WHERE player_id=? ORDER BY (normalized_transfer_date IS NULL),normalized_transfer_date DESC,imc_transfer_number DESC',[$id]);foreach($transfers as &$t){$t['from_logo_url']=$logo($t['from_sm_world_club_id']??0,$t['club_from']??'');$t['to_logo_url']=$logo($t['to_sm_world_club_id']??0,$t['club_to']??'');}unset($t);}catch(Throwable $e){$errors['transfers']='Trasferimenti temporaneamente non disponibili.';}
 unset($player['rating_history']);imc_site_out(['ok'=>true,'world'=>$gw,'player'=>$player,'rating_history'=>$rating,'matches'=>$matches,'transfers'=>$transfers,'invalid_reports'=>$invalid,'errors'=>$errors]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'player_profile_error'],500);}
