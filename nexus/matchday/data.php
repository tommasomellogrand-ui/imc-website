<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require __DIR__.'/engine.php';
require __DIR__.'/identity.php';
try{
 $gw=nexus_world($_GET['world']??'GW001');if($gw!=='GW001')throw new InvalidArgumentException('matchday_only_gw001');
 $c=nexus_config();$core=nexus_db($c,'core');$db=nexus_db($c,nexus_target($c,$gw));$today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
 $seasons=nexus_rows($core,'SELECT imc_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season',[$gw]);$current=null;foreach($seasons as $s)if($s['imc_season_start_date']&&$s['imc_season_start_date']<=$today)$current=(int)$s['imc_season'];$season=nexus_season($_GET['season']??null)??$current;if(!$season)throw new InvalidArgumentException('season_not_available');
 $fields='sm_fixture_id,imc_season,competition_key,sm_action,sm_division,match_date,home_name,away_name,home_sm_manager_id,away_sm_manager_id';
 $results=md_unique(nexus_rows($db,'SELECT '.$fields.',home_sm_club_id,away_sm_club_id,home_score,away_score FROM `'.nexus_table($gw,'Results').'` WHERE game_world_id=? ORDER BY match_date DESC,sm_fixture_id DESC',[$gw]));
 $selectedFixture=null;if(isset($_GET['fixture']))foreach($results as $r)if((string)$r['sm_fixture_id']===(string)$_GET['fixture']&&$r['sm_action']==='league'){$selectedFixture=$r;$season=(int)$r['imc_season'];break;}
 $schedule=nexus_rows($db,'SELECT '.$fields.',home_sm_team_id AS home_sm_club_id,away_sm_team_id AS away_sm_club_id FROM `'.nexus_table($gw,'Schedule').'` WHERE game_world_id=? AND imc_season=? AND sm_action=? ORDER BY match_date,sm_fixture_id',[$gw,$season,'league']);
 $mapped=nexus_rows($core,'SELECT c.name,m.`SM World Club ID` world_id FROM `IMC Game World Club Mapping` m INNER JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]);
 $identity=md_identity_index($mapped,array_merge($results,$schedule));
 $results=md_resolve_identities($results,$identity);$schedule=md_resolve_identities($schedule,$identity);
 $leagueResults=array_values(array_filter($results,fn($r)=>(int)$r['imc_season']===$season&&$r['sm_action']==='league'));
 $all=md_unique(array_merge($leagueResults,$schedule));$dates=array_values(array_unique(array_map(fn($r)=>substr((string)$r['match_date'],0,10),$all)));sort($dates);
 $days=[];foreach($dates as $i=>$d)$days[]=['number'=>$i+1,'date'=>$d,'matches'=>count(array_filter($all,fn($r)=>substr((string)$r['match_date'],0,10)===$d))];
 if(!$dates)nexus_out(['ok'=>true,'world'=>$gw,'season'=>$season,'seasons'=>$seasons,'days'=>[],'divisions'=>[],'day'=>null,'generated_at'=>gmdate('c')]);
 $day=isset($_GET['day'])?filter_var($_GET['day'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>count($dates)]]):null;if(isset($_GET['day'])&&!$day)throw new InvalidArgumentException('invalid_matchday');if(!$day){$day=count($dates);foreach($dates as $i=>$date)if($date>=$today){$day=$i+1;break;}}
 if($selectedFixture){$ix=array_search(substr((string)$selectedFixture['match_date'],0,10),$dates,true);if($ix!==false)$day=$ix+1;}
 $date=$dates[$day-1];$fixtures=array_values(array_filter($all,fn($r)=>substr((string)$r['match_date'],0,10)===$date));$fixtures=nexus_enrich_match_teams($core,$gw,$fixtures);
 $past=array_values(array_filter($results,fn($r)=>substr((string)$r['match_date'],0,10)<$date&&md_played($r)));$pastLeague=array_values(array_filter($past,fn($r)=>(int)$r['imc_season']===$season&&$r['sm_action']==='league'));
 $ids=array_column($fixtures,'sm_fixture_id');$in=implode(',',array_fill(0,count($ids),'?'));$reports=nexus_rows($db,'SELECT sm_fixture_id,players_json,team_stats_json,events_json FROM `'.nexus_table($gw,'Match_Report').'` WHERE game_world_id=? AND sm_fixture_id IN ('.$in.')',array_merge([$gw],$ids));$reportMap=[];foreach($reports as $r)$reportMap[(string)$r['sm_fixture_id']]=$r;
 $playerReports=nexus_rows($db,'SELECT m.sm_fixture_id,m.players_json,r.competition_key,m.home_sm_club_id,m.away_sm_club_id FROM `'.nexus_table($gw,'Match_Report').'` m INNER JOIN `'.nexus_table($gw,'Results').'` r ON r.game_world_id=m.game_world_id AND r.sm_fixture_id=m.sm_fixture_id WHERE m.game_world_id=? AND r.imc_season=? AND r.match_date<? AND r.sm_action=\'league\'',[$gw,$season,$date]);$playerReports=md_report_identities($playerReports,$results);$playersByCompetition=[];foreach($playerReports as $pr)$playersByCompetition[$pr['competition_key']][]=$pr;
 $simulation=($_GET['simulation']??'')==='1';
 $codex=nexus_rows($db,'SELECT player_id,full_name,current_sm_club_id,current_club,position,image_url FROM `'.nexus_table($gw,'Player_Codex').'`');$photos=[];$rosters=[];
 $clubNames=[];foreach($fixtures as $f)foreach(['home','away'] as $side)$clubNames[nexus_team_name_key($f[$side.'_name'])]=md_team($f,$side);
 foreach($codex as $p){$pid=(int)$p['player_id'];if(!$pid)continue;$photos[$pid]=$p['image_url']??null;if($simulation){$club=(int)($p['current_sm_club_id']??0);if(!$club)$club=$clubNames[nexus_team_name_key((string)($p['current_club']??''))]??0;if($club)$rosters[$club][]=['id'=>$pid,'name'=>$p['full_name'],'position'=>$p['position'],'image_url'=>$photos[$pid]];}}
 $names=[1=>'Div 1',2=>'Div 2',3=>'Div 3',4=>'Div 4'];$groups=[];foreach($fixtures as $r){$div=(int)$r['sm_division'];$groups[$div][]=$r;}ksort($groups);$divisions=[];$readyTotal=0;
 foreach($groups as $div=>$matches){$key=$matches[0]['competition_key'];$competitionPast=array_values(array_filter($pastLeague,fn($r)=>$r['competition_key']===$key));$players=md_players($playersByCompetition[$key]??[]);$members=array_values(array_filter($all,fn($r)=>$r['competition_key']===$key));$table=md_standings(array_merge($members,$matches),$pastLeague,$key);$byId=[];foreach($table as $t)$byId[$t['id']]=$t;$enriched=[];$ready=0;
  foreach($matches as $r){$h=md_team($r,'home');$a=md_team($r,'away');$live=md_goals($r,$reportMap[(string)$r['sm_fixture_id']]??null);if($live['ready'])$ready++;
   $r['preview']=['home_table'=>$byId[$h]??null,'away_table'=>$byId[$a]??null,'home_form'=>md_form($competitionPast,$h),'away_form'=>md_form($competitionPast,$a),'home_venue'=>md_form($competitionPast,$h,'home'),'away_venue'=>md_form($competitionPast,$a,'away'),'h2h'=>md_h2h($past,$h,$a),'manager_h2h'=>md_manager_h2h($past,(int)($r['home_sm_manager_id']??0),(int)($r['away_sm_manager_id']??0)),'home_players'=>$players[$h]??[],'away_players'=>$players[$a]??[]];foreach($live['goals'] as &$goal)$goal['image_url']=$photos[$goal['player_id']]??null;unset($goal);if($simulation)$r['simulation_roster']=['home'=>$rosters[$h]??[],'away'=>$rosters[$a]??[]];$r['live']=$live;$enriched[]=$r;
  }
  $readyTotal+=$ready;$divisions[]=['id'=>$div,'name'=>$names[$div]??'DIV '.$div,'competition_key'=>$key,'standings'=>$table,'fixtures'=>$enriched,'ready'=>$ready,'complete'=>$ready===count($enriched)];
 }
 nexus_out(['ok'=>true,'world'=>$gw,'season'=>$season,'seasons'=>$seasons,'day'=>$day,'date'=>$date,'days'=>$days,'divisions'=>$divisions,'ready'=>$readyTotal,'total'=>count($fixtures),'league_fixture_ids'=>array_values(array_unique(array_column(array_merge(array_values(array_filter($results,fn($r)=>$r['sm_action']==='league')),$schedule),'sm_fixture_id'))),'generated_at'=>gmdate('c')]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'matchday_data_error'],500);}
