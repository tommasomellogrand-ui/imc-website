<?php
declare(strict_types=1);
require_once __DIR__.'/trophies.php';
function trophy_check(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
function trophy_fixture(int $id,int $h,int $a,int $hs,int $as,array $extra=[]): array {return array_merge(['sm_fixture_id'=>$id,'competition_key'=>'cup','home_sm_club_id'=>$h,'away_sm_club_id'=>$a,'home_name'=>'Team '.$h,'away_name'=>'Team '.$a,'home_score'=>$hs,'away_score'=>$as,'result_status'=>'COMPLETED','match_date'=>'2026-05-01','competition_stage'=>'Finale','competition_round'=>null],$extra);}
$f=trophy_fixture(1,1,2,1,1,['penalty_home_score'=>3,'penalty_away_score'=>4]);
trophy_check(nexus_trophy_cup([$f],[],'leaguecup')['side']==='away','Penalty winner');
trophy_check(nexus_trophy_cup([$f],[$f],'leaguecup')===null,'Unplayed final prevents award');
trophy_check(nexus_trophy_cup([$f],[],'interqualifier')===null&&nexus_trophy_cup([$f],[],'playoff')===null,'Qualifiers and promotion playoffs are not trophies');
trophy_check(nexus_trophy_cup([trophy_fixture(2,1,2,1,0,['competition_stage'=>'Semifinale'])],[],'leaguecup')===null,'Semifinal is not a final');
$first=trophy_fixture(3,1,2,2,0,['competition_round'=>'Andata']);$second=trophy_fixture(4,2,1,1,0,['match_date'=>'2026-05-08','competition_round'=>'Ritorno','aggregate_home_score'=>1,'aggregate_away_score'=>2]);
trophy_check(nexus_trophy_cup([$first,$second],[],'smfacup')['side']==='away','Two-legged final uses aggregate');
trophy_check(nexus_trophy_cup([$first],[],'smfacup')===null,'First leg cannot award a trophy');
$seasons=[['imc_season'=>1,'imc_season_start_date'=>'2026-01-01','imc_season_end_date'=>'2026-06-30'],['imc_season'=>2,'imc_season_start_date'=>'2026-07-01','imc_season_end_date'=>'2026-12-31']];
$catalog=[['competition_key'=>'cup','sm_action'=>'leaguecup']];$next=trophy_fixture(5,2,1,2,0,['match_date'=>'2026-10-01']);
$awards=nexus_trophy_editions([$f,$f,$next],[$f],$catalog,$seasons);
trophy_check(count($awards)===2&&$awards[0]['season']===2&&$awards[1]['season']===1,'All seasons remain visible, duplicate fixtures and played schedule ignored');
$rows=[];$id=10;foreach([1,2,3,4] as $h)foreach([1,2,3,4] as $a){if($h===$a)continue;$rows[]=trophy_fixture($id++,$h,$a,$h===1?2:($a===1?0:1),$a===1?2:($h===1?0:1),['competition_key'=>'league','competition_stage'=>null,'match_date'=>'2026-05-'.str_pad((string)($id-10),2,'0',STR_PAD_LEFT)]);}
$comp=['competition_key'=>'league','sm_action'=>'league','teams_count'=>4,'expected_match'=>12];
$a=nexus_trophy_league($rows,[],$comp);trophy_check($a!==null&&$a['winner_key']==='id:1'&&$a['points']===18,'Completed balanced league champion');
trophy_check(nexus_trophy_league(array_slice($rows,0,3),[],$comp)===null,'Partial imports cannot crown leaders');
$draws=array_map(function($r){$r['home_score']=1;$r['away_score']=1;return $r;},$rows);
trophy_check(nexus_trophy_league($draws,[],$comp)===null,'Points tie requires known competition tiebreak rules');
$bad=$rows;$bad[11]=$bad[0];trophy_check(nexus_trophy_league($bad,[],$comp)===null,'Unbalanced fixture coverage cannot crown a champion');
$played=array_slice($rows,0,10);$scheduled=array_slice($rows,10);$a=nexus_trophy_league($played,$scheduled,$comp);trophy_check($a!==null&&!$a['league_complete'],'Mathematically safe champion with complete remaining fixture plan');
echo "TROPHY_HISTORY_TESTS_OK\n";

$legacy=array_map(function($r){$r['home_sm_club_id']=null;$r['away_sm_club_id']=null;return $r;},$rows);
$legacyComp=['teams_count'=>null,'expected_match'=>null,'_season_end'=>'2026-06-30'];
$a=nexus_trophy_league($legacy,[],$legacyComp);trophy_check($a!==null&&$a['winner_key']==='name:Team 1','Closed legacy seasons recognize a complete home-and-away league');
trophy_check(nexus_trophy_league(array_slice($legacy,0,11),[],$legacyComp)===null,'Legacy missing fixture prevents title');
$legacyComp['_season_end']=null;trophy_check(nexus_trophy_league($legacy,[],$legacyComp)===null,'Open seasons need configured expectations');

$official=json_decode(file_get_contents(__DIR__.'/honours-GW008-S1.json'),true,512,JSON_THROW_ON_ERROR);
trophy_check($official['world']==='GW008'&&$official['season']===1&&$official['soccer_manager_season']===48,'Official source is GW008 IMC1 / SM48');
$honours=$official['honours'];trophy_check(count($honours)===65&&count(array_unique(array_column($honours,'competition_key')))===65,'65 unique official honours');
$counts=array_count_values(array_column($honours,'sm_action'));
trophy_check($counts['league']===19&&$counts['playoff']===7&&$counts['leaguecup']===12&&$counts['leagueshield']===12&&$counts['charityshield']===12,'Official honours category coverage');
$watford=array_values(array_filter($honours,fn($h)=>$h['competition_key']==='GW008|ENG|DOMESTIC|league|3'))[0];
trophy_check($watford['winner_sm_club_id']===3109969&&$watford['manager_sm_id']===13051324,'Watford and Tommaso are resolved by source IDs');
$merged=nexus_trophy_overlay([['id'=>'GW008|ENG|DOMESTIC|league|3::1','season'=>1,'winner'=>'old'],['id'=>'GW008|ENG|DOMESTIC|league|3::2','season'=>2,'winner'=>'current']],[['id'=>'GW008|ENG|DOMESTIC|league|3::1','season'=>1,'winner'=>'official']]);
trophy_check(count($merged)===2&&$merged[0]['winner']==='current'&&$merged[1]['winner']==='official','Official edition wins without changing another season');
echo "OFFICIAL_HONOURS_TESTS_OK\n";
