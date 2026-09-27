<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/media.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require dirname(__DIR__).'/teams/roster-stats.php';
require __DIR__.'/stats-engine.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$raw=(string)($_GET['player']??'');if(!ctype_digit($raw)||(int)$raw<1)throw new InvalidArgumentException('invalid_player');$id=(int)$raw;
 $db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
 $players=nexus_rows($db,'SELECT * FROM `'.nexus_table($gw,'Player_Codex').'` WHERE player_id=?',[$id]);$player=$players[0]??null;if(!$player)throw new InvalidArgumentException('player_not_in_world');
 $identity=nexus_player_identity($core,[$id])[$id]??[];$player['image_urls']=nexus_player_images($id,$identity,$player['image_url']??null);
 $lookup=nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),nexus_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]));
 $logo=static function($world,$name)use($lookup){$entity=$lookup['world'][(int)$world]??$lookup['name'][nexus_team_name_key((string)$name)]??null;return $entity!==null?nexus_player_image_url($lookup['id'][$entity]['image_url']??null):null;};
 $player['club_logo_url']=$logo($player['current_sm_club_id']??0,$player['current_club']??'');
 $rating=nexus_rows($core,'SELECT change_date,old_rating,new_rating FROM `IMC Player Codex Global Rating History` WHERE player_id=? ORDER BY change_date DESC,id DESC',[$id]);if(!$rating)$rating=json_decode((string)($player['rating_history']??'[]'),true)??[];
 $competitionNames=[];foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $comp)$competitionNames[$comp['competition_key']]=$comp['nexus_view'];
 $errors=[];$matches=[];$invalid=0;
 try{
  $reports=nexus_rows($db,'SELECT r.*,mr.players_json,mr.commentary_json FROM `'.nexus_table($gw,'Match_Report').'` mr JOIN `'.nexus_table($gw,'Results').'` r ON r.game_world_id=mr.game_world_id AND r.sm_fixture_id=mr.sm_fixture_id WHERE mr.game_world_id=? AND mr.players_json LIKE ? ORDER BY r.match_date DESC,r.sm_fixture_id DESC',[$gw,'%'.$id.'%']);
  $result=nexus_player_match_rows($player,$reports);$matches=$result['matches'];$invalid=$result['invalid_reports'];if($matches){$enriched=nexus_enrich_match_teams($core,$gw,array_map(static function($m){$m['home_sm_club_id']=$m['side']==='home'?$m['club_id']:null;$m['away_sm_club_id']=$m['side']==='away'?$m['club_id']:null;return $m;},$matches));$matches=$enriched;foreach($matches as &$match)$match['competition_name']=$competitionNames[$match['competition_key']]??$match['competition_key'];unset($match);}
 }catch(Throwable $e){$errors['matches']='Statistiche e partite temporaneamente non disponibili.';}
 $transfers=[];try{$transfers=nexus_rows($db,'SELECT * FROM `'.nexus_table($gw,'Transfers').'` WHERE game_world_id=? AND player_id=? ORDER BY (normalized_transfer_date IS NULL),normalized_transfer_date DESC,imc_transfer_number DESC',[$gw,$id]);foreach($transfers as &$t){$t['from_logo_url']=$logo($t['from_sm_world_club_id']??0,$t['club_from']??'');$t['to_logo_url']=$logo($t['to_sm_world_club_id']??0,$t['club_to']??'');}unset($t);}catch(Throwable $e){$errors['transfers']='Trasferimenti temporaneamente non disponibili.';}
 unset($player['rating_history']);nexus_out(['ok'=>true,'world'=>$gw,'player'=>$player,'rating_history'=>$rating,'matches'=>$matches,'transfers'=>$transfers,'invalid_reports'=>$invalid,'errors'=>$errors]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'player_profile_error'],500);}
