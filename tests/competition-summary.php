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
check($empty['played']===null&&$empty['percent']===null&&$empty['status']===null,'No fixtures must stay blank');
$p=imc_competition_summary($cup,$definition,[fixture('1',false),fixture('1',true),fixture('2',false,'Semifinali','2026-11-19','Ritorno')],[],[]);
check($p['played']===1&&$p['percent']===3,'Result/Schedule identity must count once');
check($p['last_turn']['label']==='Semifinali · Andata'&&$p['next_turn']['label']==='Semifinali · Ritorno','Legs and dates remain explicit');
check(!$p['complete'],'Partial cup cannot finish from count alone');
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
