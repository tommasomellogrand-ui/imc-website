<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/ranking.php';
require dirname(__DIR__).'/trophies/engine.php';
try{
 $c=nexus_config();$core=nexus_db($c,'core');
 $managers=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,sm_manager_id FROM `IMC Manager Codex Global` ORDER BY full_name');
 $byId=[];$bySm=[];foreach($managers as $m){$byId[$m['manager_id']]=$m;if((int)($m['sm_manager_id']??0)>0)$bySm[(string)$m['sm_manager_id']]=$m['manager_id'];}
 $events=[];$scoreEvents=[];
 foreach($managers as $m)if(!empty($m['imc_join_date']))$events[]=['type'=>'passport','date'=>$m['imc_join_date'],'manager_id'=>$m['manager_id'],'manager_name'=>$m['full_name']];
 $assign=nexus_rows($core,'SELECT game_world_id,manager_id,full_name,team_id,team_name,assignment_type,start_date,end_date,national_team_id FROM `IMC Manager Assignment Global` ORDER BY start_date,id');
 foreach($assign as $a){if(!isset($byId[$a['manager_id']]))continue;$base=['manager_id'=>$a['manager_id'],'manager_name'=>$a['full_name'],'world'=>$a['game_world_id'],'team'=>$a['team_name'],'assignment_type'=>$a['assignment_type']];
  if(!empty($a['start_date']))$events[]=$base+['type'=>'assignment_start','date'=>$a['start_date']];
  if(!empty($a['end_date']))$events[]=$base+['type'=>'assignment_end','date'=>$a['end_date']];
 }
 $worlds=array_map(fn($n)=>sprintf('GW%03d',$n),range(1,10));
 foreach($worlds as $gw){
  $db=nexus_db($c,nexus_target($c,$gw));$weight=imc_rank_weight($gw);
  $reports=nexus_rows($db,'SELECT sm_fixture_id,imc_season,competition_group,match_date,home_name,away_name,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score FROM `'.$gw.'_IMC_Match_Report` WHERE game_world_id=?',[$gw]);
  $national=[];
  foreach($reports as $r){
   $day=(string)($r['match_date']??'');if(!preg_match('/^\\d{4}-\\d{2}-\\d{2}$/',$day))continue;
   $hs=(int)$r['home_score'];$as=(int)$r['away_score'];
   foreach(['home','away'] as $side){$sm=(string)($r[$side.'_sm_manager_id']??'');$mid=$bySm[$sm]??null;if(!$mid)continue;$gf=$side==='home'?$hs:$as;$ga=$side==='home'?$as:$hs;$base=1+($gf>$ga?.5:($gf<$ga?-.5:0));$scoreEvents[]=['date'=>$day,'manager_id'=>$mid,'delta'=>$base*$weight,'kind'=>'match'];}
   if(($r['competition_group']??'')==='NATIONS'){$ph=$r['penalty_home_score']??null;$pa=$r['penalty_away_score']??null;$side=($ph!==null&&$pa!==null&&(int)$ph!==(int)$pa)?((int)$ph>(int)$pa?'home':'away'):($hs!==$as?($hs>$as?'home':'away'):null);if($side){$sm=(string)($r[$side.'_sm_manager_id']??'');if(isset($bySm[$sm]))$national[(string)$r['sm_fixture_id']]=$bySm[$sm];}}
  }
  $clubAssign=array_values(array_filter($assign,fn($a)=>$a['game_world_id']===$gw&&$a['assignment_type']==='club'));
  foreach(nexus_rows($db,'SELECT * FROM `'.$gw.'_IMC_Trophy_Room` WHERE game_world_id=?',[$gw]) as $t){
   $mid=trophy_manager_at_win($t,$clubAssign,$national);if(!$mid||!isset($byId[$mid]))continue;$base=imc_rank_bonus($t);if($base===null)continue;$pts=$base*$weight;$day=(string)$t['won_date'];
   $scoreEvents[]=['date'=>$day,'manager_id'=>$mid,'delta'=>$pts,'kind'=>'trophy','fixture'=>(string)($t['deciding_fixture_id']??'')];
   $events[]=['type'=>'trophy','date'=>$day,'manager_id'=>$mid,'manager_name'=>$byId[$mid]['full_name'],'world'=>$gw,'season'=>$t['imc_season'],'competition'=>($t['nexus_view']??'')?:($t['trophy_type']??''),'team'=>$t['winner_name'],'base_points'=>$base,'multiplier'=>$weight,'ranking_points'=>$pts,'fixture'=>(string)($t['deciding_fixture_id']??'')];
  }
 }
 usort($scoreEvents,fn($a,$b)=>[$a['date'],$a['kind']==='trophy'?1:0]<=>[$b['date'],$b['kind']==='trophy'?1:0]);
 $totals=array_fill_keys(array_keys($byId),0.0);$trophyRanks=[];
 foreach($scoreEvents as $s){$totals[$s['manager_id']]+=$s['delta'];if($s['kind']!=='trophy')continue;$vals=$totals;arsort($vals,SORT_NUMERIC);$pos=0;$i=0;$prev=null;foreach($vals as $id=>$v){$i++;if($prev===null||$v!=$prev)$pos=$i;if($id===$s['manager_id'])break;$prev=$v;}$trophyRanks[$s['manager_id'].'|'.$s['date'].'|'.$s['fixture']]=['position'=>$pos,'total'=>$totals[$s['manager_id']]];}
 foreach($events as &$e)if($e['type']==='trophy'){$k=$e['manager_id'].'|'.$e['date'].'|'.$e['fixture'];$e+=($trophyRanks[$k]??['position'=>null,'total'=>null]);}unset($e);
 usort($events,fn($a,$b)=>strcmp($b['date'],$a['date'])?:strcmp($b['type'],$a['type']));
 nexus_out(['ok'=>true,'events'=>$events,'generated_at'=>gmdate('c')]);
}catch(Throwable $e){error_log('IMC Timeline: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'Timeline temporaneamente non disponibile.'],500);}
