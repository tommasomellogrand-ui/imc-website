<?php
declare(strict_types=1);
function md_minute($v): ?int {return preg_match('/^(\d+)(?:\+(\d+))?$/',trim((string)$v),$m)?(int)$m[1]+(int)($m[2]??0):null;}
function md_played(array $r): bool {return isset($r['home_score'],$r['away_score'])&&is_numeric($r['home_score'])&&is_numeric($r['away_score']);}
function md_unique(array $rows): array {$seen=[];foreach($rows as $r){$id=(string)($r['sm_fixture_id']??'');if($id!==''&&!isset($seen[$id]))$seen[$id]=$r;}return array_values($seen);}
function md_team(array $r,string $s): int {return (int)($r[$s.'_sm_club_id']??$r[$s.'_sm_team_id']??0);}
function md_form(array $rows,int $club,?string $venue=null): array {
 $out=[];foreach($rows as $r){$side=md_team($r,'home')===$club?'home':(md_team($r,'away')===$club?'away':null);if(!$side||($venue&&$venue!==$side))continue;$opp=$side==='home'?'away':'home';$gf=(int)$r[$side.'_score'];$ga=(int)$r[$opp.'_score'];$out[]=['date'=>$r['match_date'],'opponent'=>$r[$opp.'_name'],'gf'=>$gf,'ga'=>$ga,'outcome'=>$gf>$ga?'V':($gf<$ga?'P':'N')];if(count($out)===5)break;}return $out;
}
function md_h2h(array $rows,int $home,int $away): array {
 $s=['played'=>0,'home_wins'=>0,'draws'=>0,'away_wins'=>0,'home_goals'=>0,'away_goals'=>0,'last'=>null];
 foreach($rows as $r){$h=md_team($r,'home');$a=md_team($r,'away');if(!(($h===$home&&$a===$away)||($h===$away&&$a===$home)))continue;$gf=(int)$r[$h===$home?'home_score':'away_score'];$ga=(int)$r[$h===$home?'away_score':'home_score'];$s['played']++;$s[$gf>$ga?'home_wins':($gf<$ga?'away_wins':'draws')]++;$s['home_goals']+=$gf;$s['away_goals']+=$ga;if(!$s['last'])$s['last']=['date'=>$r['match_date'],'home'=>$r['home_name'],'away'=>$r['away_name'],'score'=>$r['home_score'].' – '.$r['away_score']];}return $s;
}
function md_standings(array $fixtures,array $past,string $key): array {
 $clubs=[];foreach($fixtures as $r)foreach(['home','away'] as $side){$id=md_team($r,$side);if($id<1)continue;$clubs[$id]=['id'=>$id,'name'=>$r[$side.'_name'],'played'=>0,'points'=>0,'gf'=>0,'ga'=>0,'position'=>null];}
 foreach($past as $r){if($r['competition_key']!==$key)continue;$h=md_team($r,'home');$a=md_team($r,'away');if(!isset($clubs[$h],$clubs[$a]))continue;$hg=(int)$r['home_score'];$ag=(int)$r['away_score'];foreach([[$h,$hg,$ag],[$a,$ag,$hg]] as [$id,$gf,$ga]){$clubs[$id]['played']++;$clubs[$id]['gf']+=$gf;$clubs[$id]['ga']+=$ga;$clubs[$id]['points']+=$gf>$ga?3:($gf===$ga?1:0);}}
 $rows=array_values($clubs);usort($rows,fn($a,$b)=>($b['points']<=>$a['points'])?:(($b['gf']-$b['ga'])<=>($a['gf']-$a['ga']))?:($b['gf']<=>$a['gf'])?:strcmp($a['name'],$b['name']));$hasGames=array_sum(array_column($rows,'played'))>0;foreach($rows as $i=>&$r)if($hasGames)$r['position']=$i+1;unset($r);return $rows;
}
function md_goals(array $fixture,?array $report): array {
 if(!$report)return ['ready'=>false,'reason'=>'Match Report non ancora caricato','goals'=>[]];
 if(!md_played($fixture))return ['ready'=>false,'reason'=>'Risultato non ancora caricato','goals'=>[]];
 $players=json_decode((string)($report['players_json']??''),true);$stats=json_decode((string)($report['team_stats_json']??''),true);$events=json_decode((string)($report['events_json']??''),true);$players=is_array($players)?$players:[];$events=is_array($events)?$events:[];
 $scorers=is_array($stats['scorers']??null)?$stats['scorers']:[];
 if(!$scorers)foreach($players as $p){foreach($p['goal_minutes']??[] as $min)$scorers[]=['minute'=>$min,'team_side'=>$p['team_side'],'player_name'=>$p['player_name'],'sm_player_id'=>$p['sm_player_id'],'own_goal'=>0];foreach($p['own_goal_minutes']??[] as $min)$scorers[]=['minute'=>$min,'team_side'=>$p['team_side']==='home'?'away':'home','player_name'=>$p['player_name'],'sm_player_id'=>$p['sm_player_id'],'own_goal'=>1];}
 $goals=[];$count=['home'=>0,'away'=>0];$valid=true;$names=[];$sides=[];foreach($players as $p){$names[(int)($p['sm_player_id']??0)]=$p['player_name']??'';$sides[(int)($p['sm_player_id']??0)]=$p['team_side']??'';}
 foreach($scorers as $s){$side=$s['team_side']??'';$min=md_minute($s['minute']??null);if(!isset($count[$side])||$min===null||$min>130){$valid=false;continue;}$count[$side]++;$assist=null;$penalty=false;$id=(int)($s['sm_player_id']??0);$own=(bool)($s['own_goal']??false);
  foreach($events as $e){if(md_minute($e['minute']??null)!==$min||!in_array($e['event_type']??'',['goal','penalty_goal','own_goal'],true))continue;$p=(int)($e['primary_sm_player_id']??0);$q=(int)($e['secondary_sm_player_id']??0);if($id!==$p&&$id!==$q)continue;$penalty=preg_match('/rigore|penalty/iu',(string)($e['event_text']??''))===1;if(!$own&&!$penalty){$other=$id===$p?$q:$p;if($other&&$other!==$id&&($sides[$other]??'')===$side)$assist=$names[$other]??null;}break;}
  $goals[]=['minute'=>$min,'label'=>(string)$s['minute'],'side'=>$side,'name'=>(string)($s['player_name']??'Marcatore non indicato'),'player_id'=>$id,'assist'=>$assist,'penalty'=>$penalty,'own_goal'=>$own];
 }
 usort($goals,fn($a,$b)=>$a['minute']<=>$b['minute']);$ready=$valid&&$count['home']===(int)$fixture['home_score']&&$count['away']===(int)$fixture['away_score'];return ['ready'=>$ready,'reason'=>$ready?null:'Eventi gol incompleti rispetto al risultato: replay in attesa di dati completi','goals'=>$goals];
}
function md_players(array $reports): array {
 $clubs=[];$seen=[];foreach($reports as $r){$f=(string)$r['sm_fixture_id'];if(isset($seen[$f]))continue;$seen[$f]=true;$entries=json_decode((string)($r['players_json']??''),true);if(!is_array($entries))continue;$ids=[];foreach($entries as $p){$side=$p['team_side']??'';$id=(int)($p['sm_player_id']??0);if(!$id||isset($ids[$id])||!in_array($side,['home','away'],true))continue;$ids[$id]=true;$club=md_team($r,$side);$rating=is_numeric($p['rating']??null)&&(float)$p['rating']>0?(float)$p['rating']:null;$goals=max((int)($p['goals']??0),count($p['goal_minutes']??[]));$assists=(int)($p['assists']??0);if(empty($p['starter'])&&($p['sub_on_minute']??null)===null&&$rating===null&&!$goals&&!$assists)continue;
 $clubs[$club][$id]??=['id'=>$id,'name'=>$p['player_name']??'','played'=>0,'goals'=>0,'assists'=>0,'rating_sum'=>0,'ratings'=>0];$x=&$clubs[$club][$id];$x['played']++;$x['goals']+=$goals;$x['assists']+=$assists;if($rating!==null){$x['rating_sum']+=$rating;$x['ratings']++;}unset($x);}}
 foreach($clubs as &$rows){$rows=array_values($rows);foreach($rows as &$r){$r['rating']=$r['ratings']?round($r['rating_sum']/$r['ratings'],2):null;unset($r['rating_sum']);}unset($r);usort($rows,fn($a,$b)=>($b['goals']<=>$a['goals'])?:($b['assists']<=>$a['assists'])?:(($b['rating']??0)<=>($a['rating']??0)));}unset($rows);return $clubs;
}

function md_manager_h2h(array $rows,int $home,int $away): array {
 $out=['available'=>$home>0&&$away>0&&$home!==$away,'played'=>0,'home_wins'=>0,'draws'=>0,'away_wins'=>0,'last'=>null,'incomplete'=>false];
 if(!$out['available'])return $out;
 foreach($rows as $r){
  $h=(int)($r['home_sm_manager_id']??0);$a=(int)($r['away_sm_manager_id']??0);
  if($h<1||$a<1){$out['incomplete']=true;continue;}
  if(!(($h===$home&&$a===$away)||($h===$away&&$a===$home)))continue;
  $gf=(int)$r[$h===$home?'home_score':'away_score'];$ga=(int)$r[$h===$home?'away_score':'home_score'];
  $out['played']++;$out[$gf>$ga?'home_wins':($gf<$ga?'away_wins':'draws')]++;
  if(!$out['last'])$out['last']=['date'=>$r['match_date'],'home'=>$r['home_name'],'away'=>$r['away_name'],'score'=>$r['home_score'].' – '.$r['away_score']];
 }
 return $out;
}

function md_team_performance(array $reports,int $club): array {
 $rows=[];foreach($reports as $r){$stats=json_decode((string)($r['team_stats_json']??''),true);if(!is_array($stats))continue;$side=md_team($r,'home')===$club?'home':(md_team($r,'away')===$club?'away':null);if(!$side||!is_array($stats[$side]??null))continue;$s=$stats[$side];$opp=$side==='home'?'away':'home';$rows[]=['date'=>$r['match_date'],'opponent'=>$r[$opp.'_name'],'gf'=>(int)$r[$side.'_score'],'ga'=>(int)$r[$opp.'_score'],'possession'=>(float)($s['possession']??0),'shots'=>(int)($s['total_shots']??0),'on_target'=>(int)($s['shots_on_target']??0),'corners'=>(int)($s['corners']??0)];}
 $n=count($rows);$avg=function($key)use($rows,$n){return $n?round(array_sum(array_column($rows,$key))/$n,1):null;};return ['played'=>$n,'possession'=>$avg('possession'),'shots'=>$avg('shots'),'on_target'=>$avg('on_target'),'corners'=>$avg('corners'),'gf'=>$avg('gf'),'ga'=>$avg('ga'),'last'=>$rows[0]??null];
}
