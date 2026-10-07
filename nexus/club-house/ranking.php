<?php
declare(strict_types=1);
// IMC Ranking v9: Results-only match scores and manager IDs; trophy rules unchanged.
function imc_rank_weight(string $gw): int {
 return in_array($gw,['GW001','GW008'],true)?3:(in_array($gw,['GW002','GW003'],true)?2:1);
}
function imc_rank_bonus(array $t): ?int {
 $type=strtolower(trim((string)($t['trophy_type']??'')));
 $compact=preg_replace('/[^a-z0-9]+/','',$type);
 if($compact==='worldcup')return 125;
 if(strtoupper((string)($t['competition_group']??''))==='NATIONS'||$type==='interqualifier')return null;
 $fixed=['smfacup'=>100,'smfashield'=>75,'leaguecup'=>50,'nationalcup'=>50,'leagueshield'=>50,'supercup'=>75,'charityshield'=>75,'playoff'=>10];
 if(isset($fixed[$type]))return $fixed[$type];
 if($type==='league'){
  $division=trim((string)($t['sm_division']??''));
  if(!preg_match('/^[1-9][0-9]*$/',$division))return null;
  return (int)$division===1?100:25;
 }
 return null; // Unknown competitions are flagged, never silently assigned a bonus.
}
function imc_rank_start(array $s,string $gw,?array $national=null): array {
 $national=$national??['played'=>0,'won'=>0,'drawn'=>0,'lost'=>0];
 $base=0.5*(int)$s['played']+0.5*(int)$s['won']-0.5*(int)$s['lost'];$weight=imc_rank_weight($gw);
 $nb=0.5*(int)$national['played']+0.5*(int)$national['won']-0.5*(int)$national['lost'];
 return ['version'=>9,'weight'=>$weight,'club_base'=>$base,'national_base'=>$nb,'club_points'=>$base*$weight,'national_points'=>$nb*$weight,'match_base'=>$base+$nb,'trophy_base'=>0,'match_points'=>($base+$nb)*$weight,'trophy_points'=>0,'total'=>($base+$nb)*$weight,'unscored_trophies'=>0,'awards'=>[]];
}

// Share Career's fixture validation, attribution and statistics.
function imc_rank_result_rows(array $rows,array $managers,bool $national): array {
 $map=ch_identity($managers);$out=ch_init($managers);$names=array_column($managers,'full_name','manager_id');
 $groups=[];$unidentified=0;
 foreach($rows as $r){if(ch_nation($r)!==$national)continue;$groups[(string)($r['sm_fixture_id']??'')][]=$r;}
 foreach($groups as $items){
  $before=$out['coverage']['excluded_fixtures'];
  ch_group($out,$items,$map,$names,'',null,$national?'national_team':'club');
  if($out['coverage']['excluded_fixtures']===$before)foreach(['home','away'] as $side)if(count(ch_resolve($items[0],$side,$map)['ids'])!==1)$unidentified++;
 }
 $stats=[];foreach($out['managers'] as $id=>$m)$stats[$id]=$m['stats'];
 $coverage=$out['coverage'];unset($coverage['reports']);
 $coverage+=['source'=>'Results','manager_source'=>'Results','unidentified_sides'=>$unidentified,'report_manager_sides'=>0,'result_manager_sides'=>array_sum(array_column($stats,'matched_by_id'))];
 return ['stats'=>$stats,'coverage'=>$coverage];
}
function imc_rank_national_rows(array $rows,array $managers): array {
 return imc_rank_result_rows($rows,$managers,true);
}
function imc_rank_results_read(PDO $db,string $gw,array $managers): array {
 $sql='SELECT sm_fixture_id,imc_season,match_date,competition_key,competition_group,sm_action,home_sm_club_id,away_sm_club_id,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score FROM `'.nexus_table($gw,'Results').'` WHERE game_world_id=?';
 $stmt=$db->prepare($sql);$stmt->execute([$gw]);$rows=$stmt->fetchAll(PDO::FETCH_ASSOC);$stmt->closeCursor();
 return ['club'=>imc_rank_result_rows($rows,$managers,false),'national'=>imc_rank_result_rows($rows,$managers,true)];
}
function imc_rank_award(array &$rank,array $t): void {
 $bonus=imc_rank_bonus($t);
 if($bonus===null)$rank['unscored_trophies']++;
 else {$rank['trophy_base']+=$bonus;$rank['trophy_points']+=$bonus*$rank['weight'];$rank['total']=$rank['match_points']+$rank['trophy_points'];}
 $rank['awards'][]=['competition'=>($t['nexus_view']??'')?:($t['competition_key']??$t['trophy_type']??''),'season'=>$t['imc_season']??null,'date'=>$t['won_date']??null,'team'=>$t['winner_name']??'','base'=>$bonus,'points'=>$bonus===null?null:$bonus*$rank['weight']];
}
