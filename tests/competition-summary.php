<?php
declare(strict_types=1);
require dirname(__DIR__).'/roadtohistory/competitions/summary-model.php';
function check(bool $ok,string $message):void { if(!$ok)throw new RuntimeException($message); }
function fixture(string $id,bool $played,string $phase='Semifinali',string $date='2026-11-16',string $round='Andata'):array {
 return ['sm_fixture_id'=>$id,'played'=>$played,'match_date'=>$date,'competition_stage'=>$phase,'competition_round'=>$round,'sm_action'=>'smfacup','home_name'=>'A','away_name'=>'B'];
}
$cup=['sm_action'=>'smfacup','competition_group'=>'INTERNATIONAL','competition_key'=>'GW001|INTERNATIONAL|smfacup'];
$definition=['teams_count'=>16,'expected_match'=>37,'expected_matchdays'=>8];
$empty=imc_competition_summary($cup,$definition,[],[],[]);
check($empty['played']===null&&$empty['percent']===null&&$empty['status']==='In programma','No fixtures: turn count starts at zero');
$p=imc_competition_summary($cup,$definition,[fixture('1',false),fixture('1',true),fixture('2',false,'Semifinali','2026-11-19','Ritorno')],[],[]);
check($p['played']===1&&$p['percent']===3,'Result/Schedule identity must count once');
check($p['last_turn']['label']==='Semifinali · Andata'&&$p['next_turn']['label']==='Semifinali · Ritorno','Legs and dates remain explicit');
check(!$p['complete'],'Partial cup cannot finish from count alone');
$domestic=['sm_action'=>'league','competition_group'=>'DOMESTIC','competition_key'=>'GW001|DOMESTIC|league|1'];
$p=imc_competition_summary($domestic,['teams_count'=>10,'expected_match'=>90,'expected_matchdays'=>18],[fixture('1',true,'','2026-11-16','')],['last_turn'=>['date'=>'2026-11-16','number'=>15]],[]);
check($p['last_turn']['number']===15&&$p['last_turn']['label']==='Giornata 15','Keep matchday resolved by the season calendar');
$p=imc_competition_summary($cup,$definition,[fixture('1',true,'Finale')],['final_played'=>true],[]);
check($p['complete']&&$p['status']==='Conclusa'&&$p['percent']===3,'Final can finish a cup without concealing missing imports');
$worldCup=['sm_action'=>'worldcup','competition_group'=>'NATIONS','competition_key'=>'GW001|NATIONS|worldcup'];
$p=imc_competition_summary($worldCup,['expected_match'=>63,'expected_matchdays'=>7],[],[],[]);
check($p['expected']===63&&$p['played']===null,'National totals must come from CORE');
$r=fixture('1',true,'A','2026-11-16','1');$r['sm_action']='worldcup';
$p=imc_competition_summary($worldCup,['expected_match'=>63],[$r],[],[]);
check($p['last_turn']['label']==='Gironi','A group letter must not become a knockout stage');
$league=['sm_action'=>'imc_custom','competition_group'=>'IMC','competition_key'=>'GW001|IMC|championsleague'];
$p=imc_competition_summary($league,['teams_count'=>12,'expected_match'=>132,'expected_matchdays'=>22],[fixture('1',true,'','2026-11-16','19')],[],[]);
check($p['league_summary']&&$p['played_days']===1&&$p['last_turn']['label']==='Giornata 19','A Result marks the turn played without a full matchday import');
$cwc=['sm_action'=>'imc_custom','competition_group'=>'IMC','competition_key'=>'GW001|IMC|clubworldcup'];
check(!imc_competition_is_league($cwc),'Club World Cup is not a league');
check(!imc_competition_is_league(['sm_action'=>'league','competition_key'=>'GW001|DOMESTIC|playoff|2']),'Playoff is not a league');
$p=imc_competition_summary($cup,[],[fixture('1',true)],[],[]);
check($p['expected']===null&&$p['percent']===null,'Unknown expected totals cannot be guessed');
echo "Competition summary: all checks passed\n";

check($empty['played_days']===0&&$empty['remaining_days']===8,'Unstarted cup is 0 of configured total');
foreach ([[16,37,8,3,false],[32,125,13,6,true]] as [$teams,$matches,$days,$groupDays,$hasLast16]) {
 $calendar=[];$day=0;$id=0;
 $phases=array_fill(0,$groupDays,['Gironi',$teams/2]);
 if($hasLast16){$phases[]=['Turno 1',8];$phases[]=['Turno 1',8];}
 foreach([['Quarti',4],['Quarti',4],['Semifinali',2],['Semifinali',2],['Finale',1]] as $phase)$phases[]=$phase;
 foreach($phases as [$phase,$size]){ $day++;for($i=0;$i<$size;$i++)$calendar[]=fixture((string)++$id,true,$phase,'2026-11-'.str_pad((string)$day,2,'0',STR_PAD_LEFT),''); }
 $p=imc_competition_summary($cup,['teams_count'=>$teams,'expected_match'=>$matches,'expected_matchdays'=>$days],$calendar,['final_played'=>true],[]);
 check($p['played_days']===$days&&$p['remaining_days']===0,'Group and knockout legs count as calendar turns');
 array_pop($calendar);
 $p=imc_competition_summary($cup,['teams_count'=>$teams,'expected_match'=>$matches,'expected_matchdays'=>$days],$calendar,[],[]);
 check($p['played_days']===$days-1&&$p['remaining_days']===1,'Unplayed final remains one turn');
}

$calendar=imc_competition_calendar($cup,$definition,[fixture('1',false,'Semifinali','2026-11-16','Andata'),fixture('2',false,'Semifinali','2026-11-20','Ritorno'),fixture('3',false,'Finale','2026-11-24','')]);
check($calendar['2026-11-16']['number_label']==='Turno 6 di 8','Named semifinal first leg anchors to total, not first imported date');
check($calendar['2026-11-20']['number']===7&&$calendar['2026-11-24']['number']===8,'Second leg and final retain separate turns');
$calendar=imc_competition_calendar($domestic,['expected_matchdays'=>18],[fixture('1',false,'','2026-11-16','15')]);
check($calendar['2026-11-16']['number_label']==='Giornata 15 di 18','Explicit domestic matchday survives partial imports');
$calendar=imc_competition_calendar($domestic,['expected_matchdays'=>18],[fixture('1',false,'','2026-11-16','')]);
check($calendar['2026-11-16']['number']===null,'A partial calendar cannot invent a day number');

foreach(['IMC001','IMC002','IMC003','IMC004','IMC005','IMC007','IMC008'] as $world){
 foreach(['charityshield','supercup'] as $action){
  check(!imc_competition_available($world,1,$action),'Super cups are absent in season 1 outside 006');
  check(imc_competition_available($world,2,$action),'Super cups start in season 2');
 }
 check(imc_competition_available($world,1,'leaguecup'),'National cup is unaffected');
}
check(imc_competition_available('IMC006',1,'supercup')&&imc_competition_available('GW004',1,'charityshield'),'006 season 1 exception supports both world identifiers');

$future=(new DateTimeImmutable('tomorrow',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
$p=imc_competition_summary($cup,$definition,[fixture('future',false,'Semifinali',$future,'Andata'),fixture('past',false,'Quarti','2020-01-01','Andata'),fixture('played',true,'Quarti','2020-01-01','Andata')],[],[]);
check(count($p['calendar_turns'])===1&&$p['calendar_turns'][0]['date']===$future,'Calendar exposes upcoming scheduled dates, never past dates');

// The same Results-only rule applies to every competition family, including
// partial imports, missing schedules and mismatched historical fixture IDs.
foreach(['league','leaguecup','leagueshield','charityshield','playoff','smfacup','smfashield','supercup','interqualifier','worldcup','imc','friendly'] as $action){
 $row=['sm_action'=>$action,'competition_key'=>'IMC001|TEST|'.$action,'competition_group'=>'TEST'];
 $definition=['teams_count'=>32,'expected_match'=>100,'expected_matchdays'=>10];
 $day=(new DateTimeImmutable('tomorrow',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
 $next=(new DateTimeImmutable('+2 days',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
 $fixtures=[fixture('result',true,'Gironi',$day,'1'),fixture('stale-schedule',false,'Gironi',$day,'1'),fixture('future',false,'Gironi',$next,'2')];
 $p=imc_competition_summary($row,$definition,$fixtures,[],[]);
 check($p['played_days']===1&&$p['remaining_days']===9,$action.': Schedule cannot veto a played turn');
 check($p['played']===1&&$p['next_turn']['date']===$next,$action.': past turn is excluded from next turns');
 check(count($p['calendar_turns'])===1&&$p['calendar_turns'][0]['date']===$next,$action.': calendar omits a turn represented in Results');
 $p=imc_competition_summary($row,$definition,[$fixtures[0]],[],[]);
 check($p['played_days']===1,$action.': a Result alone is sufficient');
 $p=imc_competition_summary($row,$definition,[$fixtures[1]],[],[]);
 check($p['played_days']===0,$action.': Schedule alone does not mean played');
 $p=imc_competition_summary($row,$definition,[$fixtures[0],fixture('another-result',true,'Gironi',$day,'1')],[],[]);
 check($p['played_days']===1,$action.': multiple matches of the same turn count once');
}
echo "Results-only turn authority: all competition families passed\n";

foreach([['championsleague',19,22],['europaleague',24,26],['conferenceleague',21,26],['risingstarsleague|premier',7,18]] as [$key,$played,$total]){
 $row=['sm_action'=>'imc','competition_group'=>'IMC','competition_key'=>'IMC001|IMC|'.$key];
 $fixtures=[];$start=new DateTimeImmutable('2026-01-01');
 for($i=1;$i<=$played;$i++)$fixtures[]=fixture('r'.$i,true,'',$start->modify('+'.($i-1).' days')->format('Y-m-d'),'');
 $next=$start->modify('+'.$played.' days')->format('Y-m-d');
 $later=$start->modify('+'.($played+1).' days')->format('Y-m-d');
 $fixtures[]=fixture('next',false,'',$next,'');$fixtures[]=fixture('later',false,'',$later,'');
 $c=imc_competition_calendar($row,['expected_matchdays'=>$total],$fixtures);
 check($c[$next]['number_label']==='Giornata '.($played+1).' di '.$total,$key.': Home continues from Results even with no round labels');
 if($played+2<=$total)check($c[$later]['number']===$played+2,$key.': successive future dates advance once per turn');
}
$c=imc_competition_calendar($domestic,['expected_matchdays'=>18],[fixture('last',true,'','2026-11-15','15'),fixture('next',false,'','2026-11-19','')]);
check($c['2026-11-19']['number_label']==='Giornata 16 di 18','Preserve explicit last Result when only part of the history is loaded');
$c=imc_competition_calendar($domestic,['expected_matchdays'=>18],[fixture('old',false,'','2026-11-01',''),fixture('last',true,'','2026-11-15','15'),fixture('next',false,'','2026-11-19','')]);
check($c['2026-11-19']['number']===16,'Old schedules without Results cannot shift the next turn');
echo "Home calendar numbering: Results sequence passed\n";

// Daily previews belong to Home only; no fixture or Matchday date is created.
$imc=['sm_action'=>'imc','competition_group'=>'IMC','competition_key'=>'IMC001|IMC|championsleague'];
$last=['date'=>'2026-11-15','number'=>19];
$turns=imc_competition_home_turns($imc,22,19,$last,[],'2026-11-16',false);
check(array_column($turns,'date')===['2026-11-16','2026-11-17','2026-11-18'],'Home fills daily turns without any Schedule');
check(array_column($turns,'number')===[20,21,22]&&$turns[2]['number_label']==='Giornata 22 di 22','Daily Home previews stop at expected turns');
$scheduled=['2026-11-16'=>['date'=>'2026-11-16','number'=>20,'label'=>'Giornata 20']];
$turns=imc_competition_home_turns($imc,22,19,$last,$scheduled,'2026-11-16',false);
check(count($turns)===3&&empty($turns[0]['projected'])&&!empty($turns[1]['projected']),'Imported dates replace projections without duplicating turns');
$calendar=imc_competition_calendar($imc,['expected_matchdays'=>22],[fixture('last',true,'','2026-11-15','19')]);
check(array_keys($calendar)===['2026-11-15'],'Shared Matchday calendar contains imported fixtures only');
check(imc_competition_home_turns($imc,22,22,['date'=>'2026-11-18','number'=>22],[],'2026-11-19',false)===[],'No turns beyond the configured expected');
check(imc_competition_home_turns($imc,22,19,$last,$scheduled,'2026-11-16',true)===[],'A completed competition has no previews');
check(imc_competition_home_turns($imc,22,0,null,[],'2026-11-16',false)===[],'Do not invent a start for an unstarted competition');
check(imc_competition_home_turns($domestic,18,15,$last,[],'2026-11-16',false)===[],'Daily projection applies only to IMC competitions');
check(imc_competition_home_turns($imc,null,19,$last,$scheduled,'2026-11-16',false)===array_values($scheduled),'No projection without configured expected turns');
$turns=imc_competition_home_turns($imc,22,19,$last,[],'2026-12-01',false);
check($turns[0]['date']==='2026-12-01'&&$turns[0]['number']===20,'Elapsed days do not count as played without Results');
$turns=imc_competition_home_turns($cwc,4,1,['date'=>'2026-11-15','number'=>1],[],'2026-11-16',false);
check(count($turns)===3&&$turns[0]['number_label']==='Turno 2 di 4'&&$turns[0]['label']===null,'IMC cups project numbered turns without invented phases or teams');
$turns=imc_competition_home_turns($imc,3,0,null,['2026-11-20'=>['date'=>'2026-11-20']],'2026-11-16',false);
check(array_column($turns,'date')===['2026-11-20','2026-11-21','2026-11-22'],'Unstarted competition uses its first actual Schedule as the start');
$today=new DateTimeImmutable('today',new DateTimeZone('Europe/Rome'));
$yesterday=$today->modify('-1 day')->format('Y-m-d');
$tomorrow=$today->modify('+1 day')->format('Y-m-d');
$p=imc_competition_summary($imc,['expected_matchdays'=>22],[fixture('latest',true,'',$yesterday,'19')],[],[]);
check(count($p['calendar_turns'])===3&&$p['calendar_turns'][0]['number']===20&&$p['next_turn']===null,'Summary projects missing Home dates without inventing a next fixture');
$fixtures=[fixture('latest',true,'',$yesterday,'19'),fixture('new-schedule',false,'',$today->format('Y-m-d'),'20')];
$p=imc_competition_summary($imc,['expected_matchdays'=>22],$fixtures,[],[]);
check(count($p['calendar_turns'])===3&&empty($p['calendar_turns'][0]['projected']),'Schedule import replaces the same Home turn');
$fixtures[]=fixture('new-schedule',true,'',$today->format('Y-m-d'),'20');
$p=imc_competition_summary($imc,['expected_matchdays'=>22],$fixtures,[],[]);
check(count($p['calendar_turns'])===2&&$p['calendar_turns'][0]['date']===$tomorrow&&$p['calendar_turns'][0]['number']===21,'Result import advances Home and removes the played turn');
echo "Home daily IMC projections: all checks passed\n";

$wc=['sm_action'=>'worldcup','competition_group'=>'NATIONS','competition_key'=>'IMC004|NATIONS|worldcup'];
$turns=imc_competition_home_turns($wc,7,0,null,['2026-11-16'=>['date'=>'2026-11-16']],'2026-11-16',false);
check(array_column($turns,'label')===['Gironi · Giornata 1','Gironi · Giornata 2','Gironi · Giornata 3','Ottavi di Finale','Quarti di Finale','Semifinali','Finale'],'World Cup has three group days then four knockout days');
check(array_column($turns,'date')===['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22'],'World Cup plays every day from its first group date');
$turns=imc_competition_home_turns($wc,7,3,['date'=>'2026-11-18','number'=>3],[],'2026-11-19',false);
check(count($turns)===4&&$turns[0]['label']==='Ottavi di Finale'&&$turns[3]['label']==='Finale','World Cup continues after groups without knockout Schedule');
check(imc_competition_home_turns($wc,7,0,null,[],'2026-11-16',false)===[],'World Cup must have a known start date');
check(imc_competition_home_turns($wc,7,7,['date'=>'2026-11-22','number'=>7],[],'2026-11-23',true)===[],'No World Cup turns after the final');
$qualifiers=['sm_action'=>'interqualifier','competition_group'=>'NATIONS'];
check(imc_competition_home_turns($qualifiers,10,1,['date'=>'2026-11-15'],[],'2026-11-16',false)===[],'Qualifiers do not use daily World Cup projections');
echo "World Cup daily Home calendar: all checks passed\n";

$oldWorldCup=['competition_key'=>'GW006|NATIONS|worldcup','sm_action'=>'worldcup','imc_season'=>1,'played'=>false,'competition_stage'=>'Quarti di Finale','competition_round'=>'Quarti di Finale','match_date'=>'2026-11-16','sm_fixture_id'=>'wc-quarter','home_name'=>'A','away_name'=>'B'];
$scope=imc_home_worldcup_scope(['league'=>['current']],['worldcup'=>[$oldWorldCup],'old-league'=>[['sm_action'=>'league']],'qualifiers'=>[['sm_action'=>'interqualifier']]]);
check(isset($scope['worldcup'])&&$scope['worldcup'][0]['imc_season']===1,'Home must retain the previous World Cup edition season');
check(!isset($scope['old-league'],$scope['qualifiers'])&&$scope['league']===['current'],'Previous leagues and qualifiers must not carry into Home');
$nextCup=$oldWorldCup;$nextCup['imc_season']=2;
$scope=imc_home_worldcup_scope(['worldcup'=>[$nextCup]],['worldcup'=>[$oldWorldCup]]);
check($scope['worldcup'][0]['imc_season']===2,'A new edition replaces the old edition');
$final=$oldWorldCup;$final['played']=true;$final['competition_stage']='Finale';$final['competition_round']='Finale';$final['home_score']=1;$final['away_score']=0;
$summary=imc_competition_summary(['sm_action'=>'worldcup','competition_group'=>'NATIONS'],[],[$final],[],[]);
check($summary['complete'],'A played World Cup final ends Home visibility');
echo "World Cup season rollover: all checks passed\n";
