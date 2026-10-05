<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/club-house/ranking.php';
require dirname(__DIR__).'/nexus/club-house/engine.php';
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
$managers=[['manager_id'=>'MNG001','sm_manager_id'=>10],['manager_id'=>'MNG002','sm_manager_id'=>20]];
$row=['sm_fixture_id'=>1,'competition_group'=>'NATIONS','home_sm_manager_id'=>10,'away_sm_manager_id'=>20,'home_score'=>2,'away_score'=>1];
$draw=$row; $draw['sm_fixture_id']=2;$draw['home_score']=1;$draw['penalty_home_score']=3;$draw['penalty_away_score']=4;
$club=$row;$club['sm_fixture_id']=3;$club['competition_group']='DOMESTIC';
$conflict=$row;$conflict['home_score']=3;
$d=imc_rank_national_rows([$row,$row,$draw,$club],$managers);
check($d['stats']['MNG001']['played'],2);check($d['stats']['MNG001']['won'],1);check($d['stats']['MNG001']['drawn'],1);check($d['stats']['MNG002']['lost'],1);check($d['coverage']['duplicate_rows'],1);
check(imc_rank_national_rows([$row,$conflict],$managers)['coverage']['excluded_fixtures'],1);
$missing=$row;$missing['home_sm_manager_id']=null;check(imc_rank_national_rows([$missing],$managers)['stats']['MNG001']['played'],0);
foreach(['GW001','GW002','GW004'] as $gw){$r=imc_rank_start(['played'=>2,'won'=>1,'lost'=>0],$gw,$d['stats']['MNG001']);check($r['national_points'],2.5*imc_rank_weight($gw));check($r['total'],5*imc_rank_weight($gw));check($r['match_points'],$r['club_points']+$r['national_points']);}
echo "PASS: national Results scoring, scope isolation, duplicate/conflict handling, shootout draw and same GW weights\n";
// Club ranking must use Results independently of the Club House report stats.
$c=imc_rank_result_rows([$club,$club,$row],$managers,false);
check($c['stats']['MNG001']['played'],1);check($c['stats']['MNG001']['won'],1);
check($c['coverage']['duplicate_rows'],1);check($c['coverage']['manager_source'],'Results');
check($c['coverage']['report_manager_sides'],0);
$clubConflict=$club;$clubConflict['away_score']=9;
check(imc_rank_result_rows([$club,$clubConflict],$managers,false)['coverage']['excluded_fixtures'],1);
$missing=$club;$missing['home_sm_manager_id']=null;
check(imc_rank_result_rows([$missing],$managers,false)['stats']['MNG001']['played'],0);
$same=$club;$same['away_sm_manager_id']=10;
check(imc_rank_result_rows([$same],$managers,false)['coverage']['excluded_fixtures'],1);
$invalid=$club;$invalid['home_score']=null;
check(imc_rank_result_rows([$invalid],$managers,false)['coverage']['excluded_fixtures'],1);
check(imc_rank_start($c['stats']['MNG001'],'GW001')['version'],8);
$source=file_get_contents(dirname(__DIR__).'/nexus/club-house/ranking.php');
check(str_contains($source,"nexus_table(\$gw,'Match_Report')"),false);
check(str_contains($source,"nexus_table(\$gw,'Results')"),true);
echo "PASS: Results-only club and national IDs, deduplication, conflicts, missing IDs and unchanged scoring\n";
