<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/trophies/engine.php';
function check(bool $condition,string $message): void {if(!$condition)throw new RuntimeException($message);echo "PASS $message\n";}
function fixture(int $id,int $h,int $a,int $hs=1,int $as=0): array {
    return ['game_world_id'=>'GW001','imc_season'=>1,'competition_key'=>'GW001|DOMESTIC|league|1','sm_action'=>'league','competition_group'=>'DOMESTIC','sm_country'=>null,'sm_division'=>'1','sm_fixture_id'=>$id,'home_sm_club_id'=>$h,'away_sm_club_id'=>$a,'home_name'=>'Team '.$h,'away_name'=>'Team '.$a,'home_score'=>$hs,'away_score'=>$as,'match_date'=>'2026-09-10','result_status'=>'COMPLETED'];
}
$defs=[['game_world_id'=>'GW001','competition_key'=>null,'sm_action'=>'league','sm_country'=>null,'sm_division'=>'1','teams_count'=>4,'expected_match'=>12]];
$league=[];$id=1;
for($h=1;$h<=4;$h++)for($a=1;$a<=4;$a++)if($h!==$a)$league[]=fixture($id++,$h,$a,$h===1?3:0,$a===1?3:0);
$run=fn($r,$m=[],$s=[],$d=null)=>trophy_derive('GW001',$r,$m,$s,$d??$defs,'2026-09-28');
$r=$run($league);check(count($r['awards'])===1 && $r['awards'][0]['winner_name']==='Team 1','complete league champion');
check(count($run(array_slice($league,0,-1))['awards'])===0,'incomplete league has no title');
check(count($run([$league[0],$league[3]])['awards'])===0,'partial subset cannot look like a complete league');
check(count($run([...$league,$league[0]])['awards'])===1,'identical fixture duplicate counted once');
$bad=$league[0];$bad['home_score']=9;
check(count($run([...$league,$bad])['awards'])===0,'conflicting duplicate blocks award');
$bad=$league;$bad[0]['home_sm_club_id']=null;
check(count($run($bad)['awards'])===1,'missing ID resolved only from unique same-competition name');
$tie=array_map(function($r){$r['home_score']=0;$r['away_score']=0;return $r;},$league);
check(count($run($tie)['awards'])===0,'complete tie never decided alphabetically');
$schedule=$league;$schedule[]=fixture(500,1,2);
check(count($run($league,[],$schedule)['awards'])===0,'unplayed schedule blocks league trophy');
check(count($run($league,[],$league,[])['awards'])===1,'full schedule supports worlds missing Codex definition');
check(count($run($league,[],[],[])['awards'])===0,'no definition or full schedule means pending');
$future=$league;$future[0]['match_date']='2099-01-01';
check(count($run($future)['awards'])===0,'future result cannot award a trophy');
$cup=fixture(100,1,2,2,2);$cup['competition_key']='GW001|DOMESTIC|leaguecup';$cup['sm_action']='leaguecup';$cup['competition_stage']='Finale';$cup['sm_division']=null;$cup['penalty_home_score']=4;$cup['penalty_away_score']=5;
check(count($run([$cup])['awards'])===0,'cup needs linked match report');
$r=$run([$cup],[$cup]);check($r['awards'][0]['winner_name']==='Team 2','penalties decide final');
$mr=$cup;$mr['home_score']=3;
check(count($run([$cup],[$mr])['awards'])===0,'report/result score conflict suspended');
$semi=$cup;$semi['competition_stage']='Semifinale';check(count($run([$semi],[$semi])['awards'])===0,'semifinal is not a final');
$quarters=$cup;$quarters['competition_stage']='Quarti di Finalee';check(count($run([$quarters],[$quarters])['awards'])===0,'quarter final is not a final');
$q=$cup;$q['sm_action']='interqualifier';check(count($run([$q],[$q])['awards'])===0,'qualifiers never award trophies');
$first=$cup;$first['competition_round']='Andata';check(count($run([$first],[$first])['awards'])===0,'first leg cannot award a title');
$second=fixture(101,2,1,1,0);$second['competition_key']=$cup['competition_key'];$second['sm_action']='leaguecup';$second['competition_stage']='Finale';$second['competition_round']='Ritorno';$second['aggregate_home_score']=1;$second['aggregate_away_score']=4;
$r=$run([$second],[$second]);check($r['awards'][0]['winner_name']==='Team 1','aggregate takes precedence over second leg score');
unset($second['aggregate_home_score'],$second['aggregate_away_score']);
check(count($run([$second],[$second])['awards'])===0,'second leg without aggregate or first leg stays pending');
$first['home_score']=3;$first['away_score']=0;unset($first['penalty_home_score'],$first['penalty_away_score']);$first['match_date']='2026-09-01';
$r=$run([$first,$second],[$second]);check($r['awards'][0]['winner_name']==='Team 1','two legs summed in correct team orientation');
$second['home_score']=3;check(count($run([$first,$second],[$second])['awards'])===0,'tied aggregate without decider stays pending');
$cup2=$cup;$cup2['imc_season']=2;$cup2['sm_fixture_id']=200;$cup2['penalty_home_score']=5;$cup2['penalty_away_score']=4;
check(count($run([$cup,$cup2],[$cup,$cup2])['awards'])===2,'seasons remain separate');
$same=$run([$cup],[$cup]);check($same===$run([$cup],[$cup]),'repeated evaluation is idempotent');
echo "Trophy engine tests passed\n";
