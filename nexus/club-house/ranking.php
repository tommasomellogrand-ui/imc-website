<?php
declare(strict_types=1);
// IMC Ranking v3: read-only scoring; never changes reports or trophy attribution.
function imc_rank_weight(string $gw): int {
 return in_array($gw,['GW001','GW008'],true)?3:(in_array($gw,['GW002','GW003'],true)?2:1);
}
function imc_rank_bonus(array $t): ?int {
 $type=strtolower(trim((string)($t['trophy_type']??'')));
 if(strtoupper((string)($t['competition_group']??''))==='NATIONS'||in_array($type,['worldcup','interqualifier'],true))return null;
 $fixed=['smfacup'=>100,'smfashield'=>50,'leaguecup'=>25,'nationalcup'=>25,'leagueshield'=>25,'supercup'=>25,'charityshield'=>25,'playoff'=>10];
 if(isset($fixed[$type]))return $fixed[$type];
 if($type==='league'){
  $division=trim((string)($t['sm_division']??''));
  if(!preg_match('/^[1-9][0-9]*$/',$division))return null;
  return (int)$division===1?75:15;
 }
 return null; // Unknown competitions are flagged, never silently assigned a bonus.
}
function imc_rank_start(array $s,string $gw): array {
 $base=(int)$s['won']-(int)$s['lost'];$weight=imc_rank_weight($gw);
 return ['version'=>3,'weight'=>$weight,'match_base'=>$base,'trophy_base'=>0,'match_points'=>$base*$weight,'trophy_points'=>0,'total'=>$base*$weight,'unscored_trophies'=>0,'awards'=>[]];
}
function imc_rank_award(array &$rank,array $t): void {
 $bonus=imc_rank_bonus($t);
 if($bonus===null)$rank['unscored_trophies']++;
 else {$rank['trophy_base']+=$bonus;$rank['trophy_points']+=$bonus*$rank['weight'];$rank['total']=$rank['match_points']+$rank['trophy_points'];}
 $rank['awards'][]=['competition'=>($t['nexus_view']??'')?:($t['competition_key']??$t['trophy_type']??''),'season'=>$t['imc_season']??null,'date'=>$t['won_date']??null,'team'=>$t['winner_name']??'','base'=>$bonus,'points'=>$bonus===null?null:$bonus*$rank['weight']];
}
