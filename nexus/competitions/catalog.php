<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$core=nexus_db($c,'core');
  $seasons=nexus_rows($core,'SELECT imc_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season',[$gw]);
  if($season===null){
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');$latest=null;
    foreach($seasons as $s){if($s['imc_season_start_date']&&$s['imc_season_start_date']<=$today){$latest=(int)$s['imc_season'];if(!$s['imc_season_end_date']||$s['imc_season_end_date']>=$today)$season=(int)$s['imc_season'];}}
    $season=$season??$latest;
  }
  if($season===null||!in_array($season,array_map(fn($s)=>(int)$s['imc_season'],$seasons),true))throw new InvalidArgumentException('invalid_world_season');
  $db=nexus_db($c,nexus_target($c,$gw));$rt=nexus_table($gw,'Results');$st=nexus_table($gw,'Schedule');
  $columns='competition_key,sm_action,sm_country,sm_division,competition_group';
  $sql='SELECT competition_key,MAX(sm_action) sm_action,MAX(sm_country) sm_country,MAX(sm_division) sm_division,MAX(competition_group) competition_group,SUM(result_count) result_count,SUM(schedule_count) schedule_count FROM ('
    .'SELECT '.$columns.',1 result_count,0 schedule_count FROM `'.$rt.'` WHERE game_world_id=? AND imc_season=? UNION ALL '
    .'SELECT '.$columns.',0 result_count,1 schedule_count FROM `'.$st.'` WHERE game_world_id=? AND imc_season=?'
    .') matches_by_season GROUP BY competition_key';
  $rows=nexus_rows($db,$sql,[$gw,$season,$gw,$season]);
  $labels=[];foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $m)$labels[(string)$m['competition_key']]=$m['nexus_view'];
  $names=['charityshield'=>'Charity Shield','leaguecup'=>'National Cup','nationalcup'=>'National Cup','leagueshield'=>'League Cup','smfacup'=>'SMFA Champions','smfashield'=>'SMFA Shield','supercup'=>'SMFA Super Cup','interqualifier'=>'World Cup Qualifiers','worldcup'=>'World Cup'];
  $order=['league'=>0,'playoff'=>1,'charityshield'=>2,'leaguecup'=>3,'nationalcup'=>3,'leagueshield'=>4,'smfacup'=>5,'smfashield'=>6,'supercup'=>7,'interqualifier'=>8,'worldcup'=>9];
  foreach($rows as &$r){
    $key=(string)$r['competition_key'];$parts=explode('|',$key);$groupIndex=null;foreach($parts as $i=>$part)if(in_array($part,['DOMESTIC','INTERNATIONAL','NATIONS'],true)){$groupIndex=$i;break;}
    $action=strtolower(trim((string)$r['sm_action']));$group=$groupIndex!==null?$parts[$groupIndex]:strtoupper((string)$r['competition_group']);
    $country=$groupIndex===2?$parts[1]:null;$division=in_array($action,['league','playoff'],true)?($groupIndex!==null?($parts[$groupIndex+2]??$r['sm_division']):$r['sm_division']):null;
    $fallback=in_array($action,['league','playoff'],true)?'Div '.$division.($action==='playoff'?' Playoff':''):($names[$action]??$action);
    $r['game_world_id']=$gw;$r['imc_season']=$season;$r['world_type']=$country?'MULTI':'SINGLE';$r['sm_country']=$country;$r['sm_action']=$action;$r['competition_group']=$group;$r['sm_division']=$division;
    $r['nexus_view']=$labels[$key]??(($country?$country.' ':'').$fallback);$r['result_count']=(int)$r['result_count'];$r['schedule_count']=(int)$r['schedule_count'];
  }unset($r);
  usort($rows,fn($a,$b)=>[($order[$a['sm_action']]??99),$a['sm_country']??'',(int)$a['sm_division'],$a['competition_key']]<=>[($order[$b['sm_action']]??99),$b['sm_country']??'',(int)$b['sm_division'],$b['competition_key']]);
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_catalog_error'],500);}
