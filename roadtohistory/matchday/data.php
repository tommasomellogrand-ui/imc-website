<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
require dirname(__DIR__,2).'/nexus/competitions/match-teams.php';
try{
 $gw='GW001';$_GET['world']=$gw;
 $mode=(string)($_GET['mode']??'results');
 if(!in_array($mode,['results','schedule'],true))throw new InvalidArgumentException('invalid_mode');
 $c=nexus_config();$db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
 $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
 $rt='IMC001_Results';$st='IMC001_Schedule';$mt='IMC001_Match_Reports';
 $table=$mode==='results'?$rt:$st;
 $where='1=1';$params=[];
 if($mode==='results'){$where.=' AND t.home_score IS NOT NULL AND t.away_score IS NOT NULL AND DATE(t.match_date)<=?';$params[]=$today;}
 else{
  $where.=' AND DATE(t.match_date)>=? AND NOT EXISTS (SELECT 1 FROM `'.$rt.'` r WHERE r.imc_season=t.imc_season AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL AND ((r.sm_fixture_id IS NOT NULL AND CAST(r.sm_fixture_id AS CHAR)<>\'\' AND CAST(r.sm_fixture_id AS CHAR)<>\'0\' AND r.sm_fixture_id=t.sm_fixture_id) OR (r.competition_key=t.competition_key AND DATE(r.match_date)=DATE(t.match_date) AND r.home_sm_club_id=t.home_sm_team_id AND r.away_sm_club_id=t.away_sm_team_id)))';
  $params[]=$today;
 }
 $order=$mode==='results'?'DESC':'ASC';
 $dates=array_column(nexus_rows($db,'SELECT DISTINCT DATE(t.match_date) match_date FROM `'.$table.'` t WHERE '.$where.' ORDER BY match_date '.$order.' LIMIT 30',$params),'match_date');
 $day=(string)($_GET['date']??($dates[0]??''));
 if($day!==''&&!in_array($day,$dates,true))throw new InvalidArgumentException('invalid_date');
 $rows=$day===''?[]:nexus_rows($db,'SELECT t.* FROM `'.$table.'` t WHERE '.$where.' AND DATE(t.match_date)=? ORDER BY t.competition_key,t.sm_fixture_id',array_merge($params,[$day]));
 $labels=[];foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $r)$labels[$r['competition_key']]=$r['nexus_view'];
 $reports=[];if($mode==='results'&&$rows){
  $ids=array_values(array_filter(array_unique(array_column($rows,'sm_fixture_id'))));
  foreach(array_chunk($ids,500) as $chunk)foreach(nexus_rows($db,'SELECT DISTINCT sm_fixture_id FROM `'.$mt.'` WHERE sm_fixture_id IN ('.implode(',',array_fill(0,count($chunk),'?')).')',$chunk) as $r)$reports[(string)$r['sm_fixture_id']]=true;
 }
 $seen=[];$clean=[];$divisions=[1=>'Platinum',2=>'Gold',3=>'Silver',4=>'Bronze'];
 $names=['leaguecup'=>'National Cup','nationalcup'=>'National Cup','leagueshield'=>'League Cup','charityshield'=>'Charity Shield','smfacup'=>'SMFA Champions','smfashield'=>'SMFA Shield','supercup'=>'SMFA Super Cup','worldcup'=>'World Cup','interqualifier'=>'World Cup Qualifiers','worldcupqualifying'=>'World Cup Qualifiers'];
 foreach($rows as $r){
  $fixture=(string)($r['sm_fixture_id']??'');$key=(string)$r['competition_key'];
  $identity=$key.'|'.(($fixture!==''&&$fixture!=='0')?$fixture:($r['fingerprint']??($r['match_date'].'|'.$r['home_name'].'|'.$r['away_name'])));
  if(isset($seen[$identity]))continue;$seen[$identity]=true;
  $action=strtolower((string)$r['sm_action']);$div=(int)($r['sm_division']??0);
  $label=$labels[$key]??null;
  if(!$label)$label=in_array($action,['league','playoff'],true)?($divisions[$div]??'Divisione '.$div).($action==='playoff'?' · Playoff':''):($names[$action]??ucwords(str_replace('_',' ',preg_replace('/^GW001_IMC_/','',$key))));
  $fields=['sm_fixture_id','competition_key','competition_group','sm_action','sm_division','imc_season','match_date','match_time','home_name','away_name','home_score','away_score','home_sm_club_id','away_sm_club_id','home_sm_team_id','away_sm_team_id','home_sm_manager_id','away_sm_manager_id','aggregate_home_score','aggregate_away_score','penalty_home_score','penalty_away_score','sm_matchday','matchday','round'];
  $r=array_intersect_key($r,array_flip($fields));$r['competition_name']=$label;$r['has_report']=isset($reports[$fixture]);$clean[]=$r;
 }
 $clean=nexus_enrich_match_teams($core,$gw,$clean);
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'mode'=>$mode,'today'=>$today,'date'=>$day?:null,'dates'=>$dates,'rows'=>$clean,'generated_at'=>gmdate('c')]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){error_log('RTH home matchday: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'matchday_unavailable'],500);}
