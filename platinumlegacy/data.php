<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/core/bootstrap.php';
require dirname(__DIR__).'/nexus/teams/roster-stats.php';
require dirname(__DIR__).'/nexus/players/media.php';
try{
 $c=nexus_config();$db=nexus_db($c,nexus_target($c,'GW001'));$core=nexus_db($c,'core');
 $key='GW001|DOMESTIC|league|1';
 $reports=nexus_rows($db,'SELECT r.sm_fixture_id,r.imc_season,r.match_date,r.home_sm_club_id,r.away_sm_club_id,r.home_name,r.away_name,r.home_score,r.away_score,m.players_json,m.commentary_json FROM `GW001_IMC_Results` r JOIN `GW001_IMC_Match_Report` m ON m.game_world_id=r.game_world_id AND m.sm_fixture_id=r.sm_fixture_id WHERE r.game_world_id=? AND r.competition_key=? AND r.imc_season IS NOT NULL AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL AND r.match_date<=CURRENT_DATE AND COALESCE(UPPER(r.result_status),\'\') IN (\'\',\'COMPLETED\',\'FT\',\'FINISHED\',\'PLAYED\') ORDER BY r.match_date,r.sm_fixture_id',['GW001',$key]);
 $groups=[];$coverage=[];$ids=[];$seen=[];
 foreach($reports as $r){
  $fixture=(string)$r['sm_fixture_id'];if(isset($seen[$fixture]))continue;$seen[$fixture]=true;
  $players=json_decode((string)$r['players_json'],true);if(!is_array($players)||!array_is_list($players)||!$players)continue;
  $season=(int)$r['imc_season'];$coverage[$season]=($coverage[$season]??0)+1;
  foreach(['home','away'] as $side){
   $club=(int)$r[$side.'_sm_club_id'];if($club<1)continue;$g=$season.':'.$club;
   $groups[$g]??=['season'=>$season,'club_id'=>$club,'club_name'=>$r[$side.'_name'],'reports'=>[],'roster'=>[]];$groups[$g]['reports'][]=$r;
   foreach($players as $p){if(!is_array($p)||($p['team_side']??'')!==$side||(int)($p['sm_player_id']??0)<1)continue;
    $id=(int)$p['sm_player_id'];$ids[$id]=true;$groups[$g]['roster'][$id]=['player_id'=>$id,'full_name'=>$p['player_name']??('Giocatore '.$id)];
   }
  }
 }
 $identity=nexus_player_identity($core,array_keys($ids));$stints=[];$players=[];
 foreach($groups as $g){
  $stats=nexus_roster_stats(array_values($g['roster']),$g['reports'],$g['club_id']);
  foreach($stats['rows'] as $p){if(!$p['appearances'])continue;$id=(int)$p['player_id'];$i=$identity[$id]??[];
   $name=trim((string)($i['full_name']??trim(($i['forename']??'').' '.($i['surname']??''))));
   $players[$id]=['id'=>$id,'name'=>$name?:$p['full_name'],'images'=>nexus_player_images($id,$i),'position'=>$i['position']??null];
   $stint=['player_id'=>$id,'season'=>$g['season'],'club_id'=>(string)$g['club_id'],'club_name'=>$g['club_name']];
   foreach(['appearances','starts','subs','minutes','minutes_missing','goals','assists','average_rating','rated_matches','mom','yellow','red'] as $f)$stint[$f]=$p[$f];
   $stints[]=$stint;
  }
 }
 nexus_out(['ok'=>true,'world'=>'GW001','competition'=>$key,'players'=>$players,'stints'=>$stints,'coverage'=>$coverage,'source'=>'Nexus Match Report','generated_at'=>gmdate('c')]);
}catch(Throwable $e){error_log('Platinum Legacy: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'legacy_players_unavailable'],503);}
