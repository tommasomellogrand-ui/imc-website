<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try {
 $gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$key=(string)($_GET['competition']??'');$mode=(string)($_GET['mode']??'schedule');
 $cups=json_decode(file_get_contents(__DIR__.'/imc-cups.json'),true,512,JSON_THROW_ON_ERROR);$cup=null;
 foreach($cups as $item)if($item['world']===$gw&&$item['season']===$season&&$item['key']===$key)$cup=$item;
 if(!$cup)throw new InvalidArgumentException('invalid_imc_competition');
 if(!in_array($mode,['results','schedule','standings'],true))throw new InvalidArgumentException('invalid_mode');
 $c=nexus_config();$core=nexus_db($c,'core');
 $assignments=nexus_rows($core,"SELECT a.manager_id,a.team_id,a.start_date,a.end_date,m.full_name FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=? AND a.assignment_type='club' ORDER BY a.start_date DESC,a.id DESC",[$gw]);
 $manager=function(string $id,string $date)use($assignments){$found=[];foreach($assignments as $a)if((string)$a['team_id']===$id&&(!$a['start_date']||$a['start_date']<=$date)&&(!$a['end_date']||$a['end_date']>=$date))$found[$a['manager_id']]=$a;return count($found)===1?array_values($found)[0]:null;};
 $logos=[];foreach(nexus_rows($core,'SELECT m.`SM World Club ID` world_id,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]) as $t)$logos[(string)$t['world_id']]=$t['image_url'];
 $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');$table=[];
 foreach($cup['teams'] as $t)$table[$t['team_id']]=['team_id'=>$t['team_id'],'team_name'=>$t['team_name'],'manager_name'=>$manager($t['team_id'],$today)['full_name']??null,'points'=>0,'played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'gd'=>0];
 $results=[];$schedule=[];$seen=[];
 foreach($cup['matches'] as $m){
  if(isset($seen[$m['id']]))throw new RuntimeException('duplicate_fixture');$seen[$m['id']]=true;
  $played=is_int($m['homeScore'])&&is_int($m['awayScore'])&&$m['homeScore']>=0&&$m['awayScore']>=0;
  $r=['sm_fixture_id'=>$m['id'],'match_date'=>$m['date'],'match_time'=>$m['time'],'competition_round'=>(string)$m['round'],'competition_stage'=>'','competition_group_name'=>'','sm_action'=>'league','home_score'=>$m['homeScore'],'away_score'=>$m['awayScore'],'competition_key'=>$key];
  foreach(['home','away'] as $side){$id=$m[$side.'_id'];if(!isset($table[$id]))throw new RuntimeException('unknown_team');$a=$manager($id,$m['date']);$r[$side.'_name']=$table[$id]['team_name'];$r[$side.'_sm_club_id']=$id;$r[$side.'_sm_team_id']=$id;$r[$side.'_logo_url']=$logos[$id]??null;$r[$side.'_imc_manager_id']=$a['manager_id']??null;$r[$side.'_imc_manager_name']=$a['full_name']??null;}
  if(!$played){$schedule[]=$r;continue;}$results[]=$r;
  $h=&$table[$m['home_id']];$a=&$table[$m['away_id']];$hs=$m['homeScore'];$as=$m['awayScore'];$h['played']++;$a['played']++;$h['gf']+=$hs;$h['ga']+=$as;$a['gf']+=$as;$a['ga']+=$hs;
  if($hs>$as){$h['won']++;$h['points']+=3;$a['lost']++;}elseif($hs<$as){$a['won']++;$a['points']+=3;$h['lost']++;}else{$h['drawn']++;$a['drawn']++;$h['points']++;$a['points']++;}unset($h,$a);
 }
 foreach($table as &$t)$t['gd']=$t['gf']-$t['ga'];unset($t);$table=array_values($table);
 usort($table,fn($a,$b)=>($b['points']<=>$a['points'])?:($b['gd']<=>$a['gd'])?:($b['gf']<=>$a['gf'])?:strcmp($a['team_name'],$b['team_name']));foreach($table as $i=>&$t)$t['position']=$i+1;unset($t);
 // GW001: preserve legacy history before 2026-10-29; use MySQL Results from 2026-10-29 onward.
 // Preserve legacy fixtures and schedules. Compute standings from merged results.
 if($gw==='GW001' && $season===2 && in_array($mode,['results','standings'],true) &&
    in_array($key,['GW001_IMC_CHAMPIONS_LEAGUE','GW001_IMC_EUROPA_LEAGUE','GW001_IMC_CONFERENCE_LEAGUE'],true)){
  $custom=nexus_db($c,'custom');
  $cutoff='2026-10-29';
  {
   $live=nexus_rows($custom,'SELECT r.sm_fixture_id,r.match_date,r.competition_key,r.competition_stage,r.competition_round,r.competition_group_name,r.sm_action,r.home_name,r.away_name,r.home_sm_club_id,r.away_sm_club_id,r.home_score,r.away_score,r.home_sm_manager_id,r.away_sm_manager_id,m.sm_fixture_id report_fixture_id FROM `GW001_IMC_Results` r LEFT JOIN `GW001_IMC_Match_Report` m ON m.game_world_id=r.game_world_id AND m.sm_fixture_id=r.sm_fixture_id AND m.competition_key=r.competition_key WHERE r.game_world_id=? AND r.competition_key=? AND r.match_date>=? AND r.sm_fixture_id IS NOT NULL ORDER BY r.match_date,r.sm_fixture_id',[$gw,$key,$cutoff]);
   $dedup=[];
   foreach($live as $r){
    $id=(string)$r['sm_fixture_id'];if(isset($dedup[$id]))continue;
    $r['home_sm_team_id']=$r['home_sm_club_id'];$r['away_sm_team_id']=$r['away_sm_club_id'];
    $r['home_logo_url']=$logos[(string)$r['home_sm_club_id']]??null;
    $r['away_logo_url']=$logos[(string)$r['away_sm_club_id']]??null;
    $r['home_imc_manager_id']=null;$r['away_imc_manager_id']=null;
    foreach(['home','away'] as $side){
     $a=$manager((string)$r[$side.'_sm_club_id'],(string)$r['match_date']);
     $r[$side.'_imc_manager_id']=$a['manager_id']??null;
     $r[$side.'_imc_manager_name']=$a['full_name']??null;
    }
    $r['has_match_report']=$r['report_fixture_id']!==null;
    unset($r['report_fixture_id']);$dedup[$id]=$r;
   }
   // Preserve historical static results; replace only matching latest-day fixtures.
   $merged=[];$latestSignatures=[];
   foreach($dedup as $item){
    $signature=(string)$item['match_date'].'|'.mb_strtolower(trim((string)$item['home_name']),'UTF-8').'|'.mb_strtolower(trim((string)$item['away_name']),'UTF-8');
    $latestSignatures[$signature]=true;
   }
   foreach($results as $old){
    $signature=(string)$old['match_date'].'|'.mb_strtolower(trim((string)$old['home_name']),'UTF-8').'|'.mb_strtolower(trim((string)$old['away_name']),'UTF-8');
    if((string)$old['match_date']<$cutoff && !isset($latestSignatures[$signature]))$merged[]=$old;
   }
   foreach($dedup as $item)$merged[]=$item;
   if($mode==='standings'){
    // Recalculate standings without altering historical rows or the database.
    foreach($table as &$t){foreach(['points','played','won','drawn','lost','gf','ga','gd'] as $field)$t[$field]=0;}unset($t);
    foreach($merged as $match){
     $home=(string)($match['home_sm_club_id']??'');$away=(string)($match['away_sm_club_id']??'');
     if(!isset($table[$home],$table[$away]))continue;
     if(!is_numeric($match['home_score']??null)||!is_numeric($match['away_score']??null))continue;
     $hs=(int)$match['home_score'];$as=(int)$match['away_score'];
     $table[$home]['played']++;$table[$away]['played']++;
     $table[$home]['gf']+=$hs;$table[$home]['ga']+=$as;
     $table[$away]['gf']+=$as;$table[$away]['ga']+=$hs;
     if($hs>$as){$table[$home]['won']++;$table[$home]['points']+=3;$table[$away]['lost']++;}
     elseif($hs<$as){$table[$away]['won']++;$table[$away]['points']+=3;$table[$home]['lost']++;}
     else{$table[$home]['drawn']++;$table[$away]['drawn']++;$table[$home]['points']++;$table[$away]['points']++;}
    }
    foreach($table as &$t)$t['gd']=$t['gf']-$t['ga'];unset($t);
    $standings=array_values($table);
    usort($standings,fn($a,$b)=>($b['points']<=>$a['points'])?:($b['gd']<=>$a['gd'])?:($b['gf']<=>$a['gf'])?:strcmp($a['team_name'],$b['team_name']));
    foreach($standings as $i=>&$t)$t['position']=$i+1;unset($t);
    nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key,'rows'=>$standings,'groups'=>count($standings)?[['group_name'=>$cup['name'],'rows'=>$standings]]:[],'source'=>'static_before_cutoff_mysql_from_cutoff','cutoff'=>$cutoff]);
   }
   nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key,'rows'=>$merged,'groups'=>[],'source'=>'static_before_cutoff_mysql_from_cutoff','cutoff'=>$cutoff]);
  }
 }
 $rows=$mode==='standings'?($cup['format']==='league'?$table:[]):($mode==='results'?$results:$schedule);
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key,'rows'=>$rows,'groups'=>$mode==='standings'&&$cup['format']==='league'&&count($table)?[['group_name'=>$cup['name'],'rows'=>$table]]:[]]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'imc_competition_error'],500);}
