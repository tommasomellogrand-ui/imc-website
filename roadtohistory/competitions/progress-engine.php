<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
try {
 $config=nexus_config();$db=nexus_db($config,nexus_target($config,$gw));$season=nexus_season($_GET['season']??null);
 if(!$season)throw new InvalidArgumentException('invalid_season');
 $groups=[];
 foreach(['Schedule'=>'team','Results'=>'club'] as $repository=>$idType){
  $table=nexus_table($gw,$repository);
  $score=$repository==='Results'?' AND home_score IS NOT NULL AND away_score IS NOT NULL':'';
  $sql="SELECT competition_key,sm_action,sm_fixture_id,competition_round,competition_stage,match_date,home_sm_{$idType}_id h,away_sm_{$idType}_id a,home_name,away_name FROM `$table` WHERE game_world_id=? AND imc_season=? $score ORDER BY match_date,sm_fixture_id";
  foreach(nexus_rows($db,$sql,[$gw,$season]) as $r){
   $r['played']=$repository==='Results';
   $id=$r['sm_fixture_id']?:($r['match_date'].'|'.$r['home_name'].'|'.$r['away_name']);
   $groups[$r['competition_key']][$id]=$r;
  }
 }
 $out=[];
 foreach($groups as $key=>$fixtures){
  usort($fixtures,fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']));
  $teams=[];$pairs=[];$days=[];$played=0;$latest=null;$next=null;
  foreach($fixtures as $r){
   $h=$r['h']?:$r['home_name'];$a=$r['a']?:$r['away_name'];$teams[$h]=true;$teams[$a]=true;$pairs[$h.'|'.$a]=true;
   $day=substr((string)$r['match_date'],0,10);$days[$day]=($days[$day]??0)+1;
   if($r['played']){$played++;$latest=$r;}elseif($next===null){$next=$r;}
  }
  $total=count($fixtures);$n=count($teams);$pct=null;$label='';$detail='';
  if($fixtures[0]['sm_action']==='league'){
   $complete=$n>=2 && count($pairs)===$n*($n-1) && $total===count($pairs);
   if($complete)$pct=(int)round(100*$played/$total);
   $r=$latest??$next;$round=$r['competition_round']??null;
   if(is_numeric($round))$label='Giornata '.(int)$round.($complete?' di '.(2*($n-1)):'');
   elseif($complete && count($days)===2*($n-1) && max($days)===min($days)){
    $i=array_search(substr((string)$r['match_date'],0,10),array_keys($days),true);$label='Giornata '.($i+1).' di '.count($days);
   }
  }else{
   $r=$next??$latest;$stage=trim((string)($r['competition_stage']??''));$round=trim((string)($r['competition_round']??''));
   $label=$round!==''?(is_numeric($round)?'Turno '.$round:$round):$stage;
   if($stage!==$label && $round!=='')$detail=$stage;
   $label=preg_replace('/finalee\b/iu','finale',$label);
   if(preg_match('/^(.+?)\s*[-·:]?\s+(andata|ritorno)$/iu',$label,$leg)){
    $label=trim($leg[1]);$detail=ucfirst(strtolower($leg[2]));
   }
   if($total===1 && in_array($r['sm_action'],['charityshield','supercup'],true))$pct=$played?100:0;
  }
  if($label==='')$label=$played?'In corso':'In programma';
  $out[$key]=['label'=>$label,'detail'=>$detail,'percent'=>$pct];
 }
 nexus_out(['ok'=>true,'progress'=>$out]);
}catch(Throwable $e){error_log('Competition progress: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'progress_unavailable'],503);}
