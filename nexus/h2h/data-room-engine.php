<?php
declare(strict_types=1);
// Pure read-only aggregation. Input matches and rows must originate in Match_Report.
function nexus_data_room(array $matches,array $rows): array {
 $reports=[];foreach($rows as $r)$reports[(string)$r['sm_fixture_id']]=$r;
 $summary=h2h_summary($matches);$summary['clean_sheets']=0;$summary['blank_games']=0;
 $best=['wins'=>0,'unbeaten'=>0,'clean_sheets'=>0];$run=$best;
 foreach(array_reverse($matches) as $m){
  $summary['clean_sheets']+=(int)($m['ga']===0);$summary['blank_games']+=(int)($m['gf']===0);
  foreach(['wins'=>$m['outcome']==='V','unbeaten'=>$m['outcome']!=='P','clean_sheets'=>$m['ga']===0] as $k=>$yes){$run[$k]=$yes?$run[$k]+1:0;$best[$k]=max($best[$k],$run[$k]);}
 }
 $comparison=h2h_report_comparison($matches,$reports);
 $eff=['own'=>['goals'=>0,'shots'=>0,'reports'=>0],'opponent'=>['goals'=>0,'shots'=>0,'reports'=>0]];
 $players=[];$playerReports=0;$bins=array_fill_keys(['0–15','16–30','31–45+','46–60','61–75','76–90+','Supplementari'],['gf'=>0,'ga'=>0]);
 $eventsUsed=0;$comebackUsed=0;$comebackWins=0;$lostLeads=0;$recovered=0;$dropped=0;
 foreach($matches as $m){
  $r=$reports[(string)$m['sm_fixture_id']];$own=$m['side'];$other=$own==='home'?'away':'home';$teams=json_decode((string)($r['team_stats_json']??''),true)??[];
  foreach(['own'=>$own,'opponent'=>$other] as $label=>$side){$shots=$teams[$side]['total_shots']??null;if(is_numeric($shots)&&$shots>=0){$eff[$label]['shots']+=(int)$shots;$eff[$label]['goals']+=(int)$r[$side.'_score'];$eff[$label]['reports']++;}}
  $entries=json_decode((string)($r['players_json']??''),true);$roster=[];
  foreach(is_array($entries)?$entries:[] as $p)if(is_array($p)&&($p['team_side']??'')===$own&&(int)($p['sm_player_id']??0)>0)$roster[(int)$p['sm_player_id']]=['player_id'=>(int)$p['sm_player_id'],'full_name'=>$p['player_name']??'Giocatore'];
  if($roster){
   $playerReports++;$stats=nexus_roster_stats(array_values($roster),[$r],(int)$r[$own.'_sm_club_id']);
   foreach($stats['rows'] as $p){$id=$p['player_id'];if(!isset($players[$id]))$players[$id]=['player_id'=>$id,'name'=>$p['full_name'],'appearances'=>0,'starts'=>0,'subs'=>0,'bench'=>0,'minutes'=>0,'minutes_missing'=>0,'goals'=>0,'assists'=>0,'yellow'=>0,'red'=>0,'mom'=>0,'rated_matches'=>0,'rating_sum'=>0,'sub_goals'=>0,'sub_assists'=>0,'own_goals'=>0,'own_goal_reports'=>0];
    $x=&$players[$id];foreach(['appearances','starts','subs','bench','minutes_missing','goals','assists','yellow','red','mom','rated_matches'] as $k)$x[$k]+=$p[$k];$x['minutes']+=$p['minutes']??0;$x['rating_sum']+=($p['average_rating']??0)*$p['rated_matches'];if($p['subs']){$x['sub_goals']+=$p['goals'];$x['sub_assists']+=$p['assists'];}unset($x);
   }
   $seen=[];foreach($entries as $p){$id=(int)($p['sm_player_id']??0);if(($p['team_side']??'')!==$own||!isset($players[$id])||isset($seen[$id]))continue;$seen[$id]=true;if(isset($p['own_goals'])&&is_numeric($p['own_goals'])){$players[$id]['own_goals']+=max(0,(int)$p['own_goals']);$players[$id]['own_goal_reports']++;}}
  }
  // Scorers are authoritative. Never infer goals from commentary or absent timestamps.
  $scorers=$teams['scorers']??null;$events=[];$counts=['home'=>0,'away'=>0];$valid=is_array($scorers)&&array_is_list($scorers);
  if($valid)foreach($scorers as $s){$side=$s['team_side']??'';$raw=trim((string)($s['minute']??''));if(!in_array($side,['home','away'],true)||!preg_match('/^(\d+)(?:\+(\d+))?$/',$raw,$a)){$valid=false;break;}$base=(int)$a[1];$extra=(int)($a[2]??0);if($base>120||$base<0){$valid=false;break;}$counts[$side]++;$bucket=$base<=15?'0–15':($base<=30?'16–30':($base<=45?'31–45+':($base<=60?'46–60':($base<=75?'61–75':($base<=90?'76–90+':'Supplementari')))));$events[]=['side'=>$side,'order'=>$base*1000+$extra,'bucket'=>$bucket];}
  if(!$valid||$counts['home']!==(int)$r['home_score']||$counts['away']!==(int)$r['away_score'])continue;
  $eventsUsed++;foreach($events as $e)$bins[$e['bucket']][$e['side']===$own?'gf':'ga']++;
  if(count(array_unique(array_column($events,'order')))!==count($events))continue;
  $comebackUsed++;usort($events,static fn($a,$b)=>$a['order']<=>$b['order']);$diff=0;$behind=false;$ahead=false;foreach($events as $e){$diff+=$e['side']===$own?1:-1;$behind=$behind||$diff<0;$ahead=$ahead||$diff>0;}
  if($behind){$comebackWins+=(int)($m['outcome']==='V');$recovered+=$m['outcome']==='V'?3:($m['outcome']==='N'?1:0);}
  if($ahead&&$m['outcome']!=='V'){$lostLeads++;$dropped+=$m['outcome']==='N'?2:3;}
 }
 foreach($eff as &$e){$e['conversion']=$e['shots']>0?round(100*$e['goals']/$e['shots'],2):null;$e['shots_per_goal']=$e['goals']>0?round($e['shots']/$e['goals'],2):null;}unset($e);
 foreach($players as &$p){$p['rating']=$p['rated_matches']?round($p['rating_sum']/$p['rated_matches'],2):null;if($p['minutes_missing'])$p['minutes']=null;$eligible=$p['minutes']!==null&&$p['minutes']>=270;$p['goals90']=$eligible?round($p['goals']*90/$p['minutes'],2):null;$p['assists90']=$eligible?round($p['assists']*90/$p['minutes'],2):null;if(!$p['own_goal_reports'])$p['own_goals']=null;unset($p['rating_sum']);}unset($p);
 $players=array_values($players);usort($players,static fn($a,$b)=>[$b['goals'],$b['assists'],$b['appearances']]<=>[$a['goals'],$a['assists'],$a['appearances']]);
 return ['summary'=>$summary,'records'=>$best,'form'=>array_map(static fn($m)=>['date'=>$m['match_date'],'outcome'=>$m['outcome'],'gf'=>$m['gf'],'ga'=>$m['ga']],array_slice($matches,0,10)),'last5'=>h2h_summary(array_slice($matches,0,5)),'last10'=>h2h_summary(array_slice($matches,0,10)),'metrics'=>$comparison['metrics'],'efficiency'=>$eff,'players'=>$players,'player_reports'=>$playerReports,'analysis'=>['reports'=>$eventsUsed,'sequence_reports'=>$comebackUsed,'bins'=>$bins,'comeback_wins'=>$comebackWins,'lost_leads'=>$lostLeads,'points_recovered'=>$recovered,'points_dropped'=>$dropped]];
}
