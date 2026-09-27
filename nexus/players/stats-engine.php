<?php
declare(strict_types=1);
function nexus_player_match_rows(array $player,array $reports): array {
 $out=[];$seen=[];$id=(int)$player['player_id'];$invalid=0;
 foreach($reports as $r){
  $fixture=(string)($r['sm_fixture_id']??'');if($fixture===''||isset($seen[$fixture]))continue;
  $entries=json_decode((string)($r['players_json']??''),true);if(!is_array($entries)||!array_is_list($entries)){$invalid++;continue;}
  $found=[];foreach($entries as $entry)if(is_array($entry)&&(int)($entry['sm_player_id']??0)===$id&&in_array($entry['team_side']??'',['home','away'],true))$found[$entry['team_side']]=$entry;
  if(count($found)!==1)continue;$side=array_key_first($found);$club=(int)($r[$side.'_sm_club_id']??0);if($club<1){$invalid++;continue;}
  if(!is_numeric($r['home_score']??null)||!is_numeric($r['away_score']??null))continue;
  $stats=nexus_roster_stats([$player],[$r],$club)['rows'][0]??null;if(!$stats)continue;$seen[$fixture]=true;
  $m=[];foreach(['sm_fixture_id','match_date','imc_season','competition_key','competition_stage','competition_round','competition_group','competition_group_name','home_name','away_name','home_score','away_score','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score','home_logo_url','away_logo_url'] as $f)$m[$f]=$r[$f]??null;
  $m['side']=$side;$m['club_id']=$club;$m['club_name']=$r[$side.'_name']??'';$m['stats']=array_intersect_key($stats,array_flip(['appearances','starts','subs','bench','minutes','minutes_missing','goals','assists','average_rating','mom','yellow','red','rated_matches']));$m['sub_on_minute']=$found[$side]['sub_on_minute']??null;$m['sub_off_minute']=$found[$side]['sub_off_minute']??null;$out[]=$m;
 }
 usort($out,static fn($a,$b)=>[$b['match_date'],$b['sm_fixture_id']]<=>[$a['match_date'],$a['sm_fixture_id']]);return ['matches'=>$out,'invalid_reports'=>$invalid];
}
