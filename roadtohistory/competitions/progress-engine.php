<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
function cupPhase(array $r): array {
 $stage=trim((string)$r['competition_stage']);$round=trim((string)$r['competition_round']);
 $text=trim($stage.' '.$round);$leg='';
 if(preg_match('/\b(andata|ritorno|first leg|second leg)\b/i',$text,$m))$leg=in_array(strtolower($m[1]),['andata','first leg'])?'Andata':'Ritorno';
 if(preg_match('/gironi|group stage|fase a gruppi/i',$text)||(!empty($r['competition_group_name'])&&!$text))return ['Gironi',$leg];
 foreach(['Ottavi'=>'/ottav|round of 16/i','Quarti'=>'/quart/i','Semifinale'=>'/semi/i','Finale'=>'/\bfinale*\b/i'] as $label=>$pattern)if(preg_match($pattern,$text))return [$label,$leg];
 $label=preg_replace('/\b(andata|ritorno|first leg|second leg)\b/i','',$round)?:$stage;
 $label=trim($label," -·");return [ctype_digit($label)?'Turno '.$label:$label,$leg];
}
function phaseSequence(array $fixtures):array {
 $order=[];$dates=[];$legs=[];
 foreach($fixtures as $r){[$phase,$leg]=cupPhase($r);if($phase==='')continue;
  if(!isset($dates[$phase]))$order[]=$phase;
  $dates[$phase][substr((string)$r['match_date'],0,10)]=true;
  if($leg)$legs[$phase][$leg]=true;
 }
 return array_map(fn($phase)=>['phase'=>$phase,'days'=>count($dates[$phase]),'legs'=>array_keys($legs[$phase]??[])],$order);
}

try {
 $config=nexus_config();$db=nexus_db($config,nexus_target($config,$gw));$season=nexus_season($_GET['season']??null);
 if(!$season)throw new InvalidArgumentException('invalid_season');
 $groups=[];$history=[];
 foreach(['Schedule'=>'team','Results'=>'club'] as $repository=>$idType){
  $table=nexus_table($gw,$repository);
  $score=$repository==='Results'?' AND home_score IS NOT NULL AND away_score IS NOT NULL':'';
  $groupColumn=$repository==='Results'?'competition_group_name':'NULL AS competition_group_name';
  $sql="SELECT imc_season,competition_key,sm_action,sm_fixture_id,competition_round,competition_stage,{$groupColumn},match_date,home_sm_{$idType}_id h,away_sm_{$idType}_id a,home_name,away_name FROM `$table` WHERE game_world_id=? AND imc_season IN (?,?) $score ORDER BY match_date,sm_fixture_id";
  foreach(nexus_rows($db,$sql,[$gw,$season,max(0,$season-1)]) as $r){
   $r['played']=$repository==='Results';
   $id=$r['sm_fixture_id']?:($r['match_date'].'|'.$r['home_name'].'|'.$r['away_name']);
   if((int)$r['imc_season']===$season)$groups[$r['competition_key']][$id]=$r;
   else $history[$r['competition_key']][$id]=$r;
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
  $isLeague=$fixtures[0]['sm_action']==='league';
  $finished=$isLeague?$pct===100:false;$path=[];$position=null;
  if(!$isLeague){
   $prior=array_values($history[$key]??[]);usort($prior,fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']));
   $single=in_array($fixtures[0]['sm_action'],['charityshield','supercup'],true);
   $priorFinal=false;
   foreach($prior as $past){[$ph,$leg]=cupPhase($past);if($past['played']&&$ph==='Finale'&&$leg!=='Andata')$priorFinal=true;}
   $path=$priorFinal?phaseSequence($prior):[];
   if($priorFinal && $gw==='GW001' && in_array($fixtures[0]['sm_action'],['smfacup','smfashield'],true)){
    $seen=array_column($path,null,'phase');$path=[];
    foreach(['Gironi','Ottavi','Quarti','Semifinale','Finale'] as $ph)$path[]=['phase'=>$ph,'days'=>$ph==='Gironi'?3:($seen[$ph]['days']??0),'legs'=>$seen[$ph]['legs']??[]];
   }
   $r=$next??$latest;[$phase,$leg]=cupPhase($r);
   if($phase==='Gironi' && $path && $path[0]['phase']==='Gironi'){
    $detail=$path[0]['days'].' giornate';
   }elseif($phase!=='')$detail=$leg;
   if($phase!=='')$label=$phase;
   $phases=array_column($path,'phase');$idx=array_search($phase,$phases,true);if($idx!==false)$position='Turno '.($idx+1).' di '.count($path);
   if(!$next && $latest){[$last,$lastLeg]=cupPhase($latest);$finished=($last==='Finale'&&$lastLeg!=='Andata')||$single;}
  }
  $out[$key]=['label'=>$label,'detail'=>$detail,'percent'=>$pct,'played'=>$played,'expected'=>$isLeague&&$complete?$total:null,'complete'=>$finished,'format'=>$path,'position'=>$position];

 }
 nexus_out(['ok'=>true,'progress'=>$out]);
}catch(Throwable $e){error_log('Competition progress: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'progress_unavailable'],503);}
