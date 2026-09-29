<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/club-house/ranking.php';
function check($got,$want):void {if($got!==$want)throw new RuntimeException(json_encode([$got,$want]));}
foreach(['GW001'=>3,'GW002'=>2,'GW003'=>2,'GW004'=>1,'GW005'=>1,'GW006'=>1,'GW007'=>1,'GW008'=>3,'GW009'=>1,'GW010'=>1] as $gw=>$weight){
 check(imc_rank_weight($gw),$weight);
 foreach([[1,1,0,1],[1,0,0,0],[1,0,1,-1],[6,3,1,2],[4,0,4,-4]] as [$played,$won,$lost,$points]){
  $r=imc_rank_start(compact('played','won','lost'),$gw);check($r['total'],$points*$weight);
 }
 $r=imc_rank_start(['played'=>6,'won'=>3,'lost'=>1],$gw);
 foreach(['smfacup'=>100,'smfashield'=>50,'leaguecup'=>25,'leagueshield'=>25,'supercup'=>25,'charityshield'=>25,'playoff'=>10] as $type=>$points){
  check(imc_rank_bonus(['trophy_type'=>$type]),$points);
  imc_rank_award($r,['trophy_type'=>$type]);
 }
 check($r['trophy_base'],260);check($r['total'],262*$weight);check(count($r['awards']),7);
}
foreach([1=>75,2=>15,3=>15,4=>15,5=>15] as $d=>$points)check(imc_rank_bonus(['trophy_type'=>'league','sm_division'=>$d]),$points);
foreach([['trophy_type'=>'league'],['trophy_type'=>'unknown'],['trophy_type'=>'worldcup'],['trophy_type'=>'smfacup','competition_group'=>'NATIONS']] as $t)check(imc_rank_bonus($t),null);
$r=imc_rank_start(['played'=>0,'won'=>0,'lost'=>0],'GW008');imc_rank_award($r,['trophy_type'=>'unknown']);check($r['total'],0);check($r['unscored_trophies'],1);
echo "PASS: IMC Ranking match scores, ten GW weights, all trophy bonuses, lower divisions, unknown types and nationals\n";
