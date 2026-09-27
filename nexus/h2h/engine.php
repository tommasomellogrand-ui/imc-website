<?php
declare(strict_types=1);

function h2h_nation(array $r): bool {
 return ($r['competition_group']??'')==='NATIONS'||str_contains((string)($r['competition_key']??''),'|NATIONS|');
}
function h2h_team(array $r,string $side,array $ctx): array {
 $kind=h2h_nation($r)?'national_team':'club';$lookup=$ctx['teams'][$kind];
 $world=(int)($r[$side.'_sm_club_id']??0);$name=(string)($r[$side.'_name']??'');
 $entity=$lookup['world'][$world]??$lookup['name'][nexus_team_name_key($name)]??null;
 $team=$entity!==null?($lookup['id'][$entity]??[]):[];
 if($world<1&&$entity!==null)$world=(int)($lookup['entity_world'][$entity]??0);
 $key=$world>0?'team:'.$world:($entity!==null?'core:'.$entity:'name:'.nexus_team_name_key($name));
 return ['key'=>$key,'world_id'=>$world,'name'=>$name?:($team['name']??'Squadra non identificata'),'image_url'=>nexus_player_image_url($team['image_url']??null)];
}
function h2h_manager(array $r,string $side,array $team,array $ctx): ?array {
 $sm=(int)($r[$side.'_sm_manager_id']??0);
 if($sm<1)$sm=(int)($r['report_'.$side.'_sm_manager_id']??0);
 if($sm>0){
  if(isset($ctx['sm_managers'][$sm]))return $ctx['sm_managers'][$sm];
  $name=trim((string)($r['report_'.$side.'_manager_name']??''));
  return ['key'=>'sm:'.$sm,'name'=>$name?:'Manager SM '.$sm,'sm_manager_id'=>$sm,'image_url'=>null];
 }
 $day=substr((string)($r['match_date']??''),0,10);
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$day))return null;
 $kind=h2h_nation($r)?'national_team':'club';$found=[];
 foreach($ctx['assignments'][$kind][$team['world_id']]??[] as $a){
  // Missing start dates cannot establish a historical tenure. Conflicts remain unattributed.
  if($a['start_date']&&$a['start_date']<=$day&&(!$a['end_date']||$a['end_date']>=$day)){
   $m=$ctx['managers'][$a['manager_id']]??null;if($m)$found[$m['key']]=$m;
  }
 }
 return count($found)===1?array_values($found)[0]:null;
}
function h2h_matches(array $rows,array $ctx,string $kind,string $id,string $scope,bool $imcOpponentsOnly=true): array {
 $out=[];$seen=[];
 foreach($rows as $r){
  $fixture=(string)($r['sm_fixture_id']??'');if($fixture===''||isset($seen[$fixture])||!is_numeric($r['home_score']??null)||!is_numeric($r['away_score']??null))continue;
  if(h2h_nation($r)!==($scope==='national_team'))continue;
  $home=h2h_team($r,'home',$ctx);$away=h2h_team($r,'away',$ctx);
  $hm=h2h_manager($r,'home',$home,$ctx);$am=h2h_manager($r,'away',$away,$ctx);
  // Manager H2H includes only encounters between two identified IMC managers.
  if($imcOpponentsOnly&&$kind==='manager'&&(!str_starts_with($hm['key']??'','imc:')||!str_starts_with($am['key']??'','imc:')))continue;
  if($kind==='club'){$isHome=$home['world_id']===(int)$id;$isAway=$away['world_id']===(int)$id;}
  else{$isHome=($hm['key']??'')==='imc:'.$id;$isAway=($am['key']??'')==='imc:'.$id;}
  if($isHome===$isAway)continue;
  $seen[$fixture]=true;$own=$isHome?'home':'away';$opposite=$isHome?'away':'home';
  $opponent=$kind==='club'?($isHome?$away:$home):($isHome?$am:$hm);
  if(!$opponent){$ot=$isHome?$away:$home;$opponent=['key'=>'unknown:'.$ot['key'],'name'=>'Manager non identificato · '.$ot['name'],'image_url'=>null,'unidentified'=>true];}
  $gf=(int)$r[$own.'_score'];$ga=(int)$r[$opposite.'_score'];
  $match=[];
  foreach(['sm_fixture_id','match_date','imc_season','competition_key','competition_stage','competition_round','competition_group_name','home_score','away_score','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score'] as $f)$match[$f]=$r[$f]??null;
  $match+=['home'=>$home,'away'=>$away,'home_manager'=>$hm,'away_manager'=>$am,'side'=>$own,'gf'=>$gf,'ga'=>$ga,'outcome'=>$gf>$ga?'V':($gf<$ga?'P':'N'),'opponent'=>$opponent,'has_report'=>!empty($r['report_fixture']),'competition_name'=>$ctx['competitions'][(string)($r['competition_key']??'')]??(string)($r['competition_key']??'Competizione')];
  $out[]=$match;
 }
 usort($out,static fn($a,$b)=>[$b['match_date'],$b['sm_fixture_id']]<=>[$a['match_date'],$a['sm_fixture_id']]);
 return $out;
}
function h2h_summary(array $matches): array {
 $s=['played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'reports'=>0,'penalty_won'=>0,'penalty_lost'=>0];$streak=0;$streakType=$matches[0]['outcome']??null;$continuing=true;$biggest=null;
 foreach($matches as $m){
  $s['played']++;$s['gf']+=$m['gf'];$s['ga']+=$m['ga'];$s['reports']+=(int)$m['has_report'];$s[['V'=>'won','N'=>'drawn','P'=>'lost'][$m['outcome']]]++;
  $own=$m['side'];$other=$own==='home'?'away':'home';$p=$m['penalty_'.$own.'_score'];$q=$m['penalty_'.$other.'_score'];
  if(is_numeric($p)&&is_numeric($q)){if((int)$p>(int)$q)$s['penalty_won']++;elseif((int)$p<(int)$q)$s['penalty_lost']++;}
  if($continuing&&$m['outcome']===$streakType)$streak++;else $continuing=false;
  if($m['outcome']==='V'&&($biggest===null||$m['gf']-$m['ga']>$biggest['gf']-$biggest['ga']))$biggest=$m;
 }
 $s['gd']=$s['gf']-$s['ga'];$s['win_pct']=$s['played']?round($s['won']/$s['played']*100,1):0;
 $s['streak']=['outcome'=>$streakType,'count'=>$streak];$s['biggest_win']=$biggest;$s['last_match']=$matches[0]??null;
 return $s;
}
function h2h_overview(array $matches): array {
 $groups=[];$competitions=[];
 foreach($matches as $m){$groups[$m['opponent']['key']][]=$m;$competitions[(string)$m['competition_key']]=$m['competition_name'];}
 $rows=[];foreach($groups as $items)$rows[]=array_merge($items[0]['opponent'],['stats'=>h2h_summary($items)]);
 usort($rows,static fn($a,$b)=>[$b['stats']['played'],$b['stats']['last_match']['match_date'],$b['stats']['last_match']['sm_fixture_id']]<=>[$a['stats']['played'],$a['stats']['last_match']['match_date'],$a['stats']['last_match']['sm_fixture_id']]);
 $summary=h2h_summary($matches);$summary['opponents']=count(array_filter($rows,static fn($r)=>empty($r['unidentified'])));$summary['unidentified_matches']=array_sum(array_map(static fn($r)=>!empty($r['unidentified'])?$r['stats']['played']:0,$rows));
 return ['summary'=>$summary,'opponents'=>$rows,'competitions'=>$competitions];
}
function h2h_report_comparison(array $matches,array $reports): array {
 $fields=['possession','total_shots','shots_on_target','corners','yellow_cards','red_cards'];$metrics=[];
 foreach($fields as $f)$metrics[$f]=['own'=>0,'opponent'=>0,'matches'=>0];
 $accuracy=['own_shots'=>0,'own_target'=>0,'opponent_shots'=>0,'opponent_target'=>0,'matches'=>0];$players=['own'=>[],'opponent'=>[]];$playerReports=0;$teamReports=0;
 $count=static fn($v): int=>is_numeric($v)?max(0,(int)$v):0;
 foreach($matches as $m){
  $r=$reports[(string)$m['sm_fixture_id']]??null;if(!$r)continue;
  $own=$m['side'];$other=$own==='home'?'away':'home';
  $teams=json_decode((string)($r['team_stats_json']??''),true);
  if(is_array($teams)&&isset($teams[$own],$teams[$other])){
   $teamReports++;
   foreach($fields as $f){$a=$teams[$own][$f]??null;$b=$teams[$other][$f]??null;if(is_numeric($a)&&is_numeric($b)&&(float)$a>=0&&(float)$b>=0){$metrics[$f]['own']+=(float)$a;$metrics[$f]['opponent']+=(float)$b;$metrics[$f]['matches']++;}}
   $a=$teams[$own]['total_shots']??null;$b=$teams[$other]['total_shots']??null;$at=$teams[$own]['shots_on_target']??null;$bt=$teams[$other]['shots_on_target']??null;
   if(is_numeric($a)&&is_numeric($b)&&is_numeric($at)&&is_numeric($bt)&&$a>=0&&$b>=0&&$at>=0&&$bt>=0&&$at<=$a&&$bt<=$b){$accuracy['own_shots']+=(float)$a;$accuracy['opponent_shots']+=(float)$b;$accuracy['own_target']+=(float)$at;$accuracy['opponent_target']+=(float)$bt;$accuracy['matches']++;}
  }
  $entries=json_decode((string)($r['players_json']??''),true);if(!is_array($entries)||!array_is_list($entries)||!$entries)continue;$playerReports++;$seen=[];
  foreach($entries as $p){
   if(!is_array($p)||!in_array($p['team_side']??'',['home','away'],true))continue;
   $id=(int)($p['sm_player_id']??0);$side=$p['team_side']===$own?'own':'opponent';if($id<1||isset($seen[$side][$id]))continue;$seen[$side][$id]=true;
   $rating=is_numeric($p['rating']??null)&&(float)$p['rating']>0&&(float)$p['rating']<=10?(float)$p['rating']:null;
   $goals=max($count($p['goals']??0),is_array($p['goal_minutes']??null)?count($p['goal_minutes']):0);$assists=$count($p['assists']??0);$mom=(int)($count($p['man_of_match']??0)>0);
   $played=$count($p['starter']??0)>0||(($p['sub_on_minute']??null)!==null&&$p['sub_on_minute']!=='')||$rating!==null||$goals>0||$assists>0||$mom>0;
   if(!$played)continue;
   if(!isset($players[$side][$id]))$players[$side][$id]=['player_id'=>$id,'name'=>$p['player_name']??('Player '.$id),'appearances'=>0,'goals'=>0,'assists'=>0,'mom'=>0,'rating_sum'=>0,'rated_matches'=>0];
   $x=&$players[$side][$id];$x['appearances']++;$x['goals']+=$goals;$x['assists']+=$assists;$x['mom']+=$mom;if($rating!==null){$x['rating_sum']+=$rating;$x['rated_matches']++;}unset($x);
  }
 }
 foreach($metrics as &$v){$v['own']=$v['matches']?round($v['own']/$v['matches'],2):null;$v['opponent']=$v['matches']?round($v['opponent']/$v['matches'],2):null;}unset($v);
 $metrics['accuracy']=['own'=>$accuracy['own_shots']?round($accuracy['own_target']/$accuracy['own_shots']*100,1):null,'opponent'=>$accuracy['opponent_shots']?round($accuracy['opponent_target']/$accuracy['opponent_shots']*100,1):null,'matches'=>$accuracy['matches']];
 foreach($players as &$list){foreach($list as &$p){$p['rating']=$p['rated_matches']?round($p['rating_sum']/$p['rated_matches'],2):null;unset($p['rating_sum']);}unset($p);$list=array_values($list);usort($list,static fn($a,$b)=>[$b['goals'],$b['assists'],$b['appearances']]<=>[$a['goals'],$a['assists'],$a['appearances']]);}unset($list);
 return ['metrics'=>$metrics,'players'=>$players,'team_reports'=>$teamReports,'player_reports'=>$playerReports];
}
