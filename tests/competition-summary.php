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
check($p['league_summary']&&$p['played_days']===0&&$p['last_turn']['label']==='Giornata 19','Incomplete matchday is not a completed day');
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
$p=imc_competition_summary($cup,$definition,[fixture('future',false,'Semifinali',$future,'Andata'),fixture('past',false,'Quarti','2020-01-01','Andata'),fixture('played',true,'Semifinali',$future,'Andata')],[],[]);
check(count($p['calendar_turns'])===1&&$p['calendar_turns'][0]['date']===$future,'Calendar exposes upcoming scheduled dates, never past dates');
