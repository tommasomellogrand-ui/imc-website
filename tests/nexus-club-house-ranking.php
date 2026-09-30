<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/club-house/ranking.php';
function check($got,$want):void {if($got!==$want && !(is_numeric($got)&&is_numeric($want)&&(float)$got===(float)$want))throw new RuntimeException(json_encode([$got,$want]));}
foreach(['GW001'=>3,'GW002'=>2,'GW003'=>2,'GW004'=>1,'GW005'=>1,'GW006'=>1,'GW007'=>1,'GW008'=>3,'GW009'=>1,'GW010'=>1] as $gw=>$weight){
 check(imc_rank_weight($gw),$weight);
 foreach([[1,1,0,1.5],[1,0,0,1],[1,0,1,0.5],[6,3,1,7],[4,0,4,2]] as [$played,$won,$lost,$points]){
  $drawn=$played-$won-$lost;$r=imc_rank_start(compact('played','won','drawn','lost'),$gw);check($r['total'],$points*$weight);check($r['match_points'],$points*$weight);
 }
 $r=imc_rank_start(['played'=>6,'won'=>3,'drawn'=>2,'lost'=>1],$gw);
 foreach(['smfacup'=>100,'smfashield'=>75,'leaguecup'=>50,'leagueshield'=>50,'supercup'=>75,'charityshield'=>75,'playoff'=>10] as $type=>$points){
  check(imc_rank_bonus(['trophy_type'=>$type]),$points);
  imc_rank_award($r,['trophy_type'=>$type]);
 }
 check($r['trophy_base'],435);check($r['total'],442*$weight);check(count($r['awards']),7);
}
foreach([1=>100,2=>25,3=>25,4=>25,5=>25] as $d=>$points)check(imc_rank_bonus(['trophy_type'=>'league','sm_division'=>$d]),$points);
check(imc_rank_bonus(['trophy_type'=>'worldcup']),125);check(imc_rank_bonus(['trophy_type'=>'World Cup','competition_group'=>'NATIONS']),125);
foreach([['trophy_type'=>'league'],['trophy_type'=>'unknown'],['trophy_type'=>'smfacup','competition_group'=>'NATIONS']] as $t)check(imc_rank_bonus($t),null);
$r=imc_rank_start(['played'=>0,'won'=>0,'drawn'=>0,'lost'=>0],'GW008');imc_rank_award($r,['trophy_type'=>'unknown']);check($r['total'],0);check($r['unscored_trophies'],1);
echo "PASS: IMC Ranking match scores, ten GW weights, trophy bonuses including World Cup 125, lower divisions and unknown types\n";
