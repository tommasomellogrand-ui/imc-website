<?php
declare(strict_types=1);
require __DIR__.'/../nexus/club-house/engine.php';
function check($v,$message){if(!$v)throw new RuntimeException($message);}
$managers=[['manager_id'=>'M1','full_name'=>'Uno','sm_manager_id'=>10],['manager_id'=>'M2','full_name'=>'Due','sm_manager_id'=>20]];
$base=['game_world_id'=>'GW001','sm_fixture_id'=>1,'match_date'=>'2026-10-01','imc_season'=>1,'competition_key'=>'GW001|DOMESTIC|league|1','competition_group'=>'DOMESTIC','sm_action'=>'league','home_sm_club_id'=>100,'away_sm_club_id'=>200,'home_name'=>'A','away_name'=>'B','home_sm_manager_id'=>10,'away_sm_manager_id'=>20,'home_score'=>2,'away_score'=>1,'penalty_home_score'=>null,'penalty_away_score'=>null];
$n=array_replace($base,['sm_fixture_id'=>2,'competition_group'=>'NATIONS','competition_key'=>'GW001|NATIONS|worldcup','sm_action'=>'worldcup','home_sm_manager_id'=>20,'away_sm_manager_id'=>10,'home_score'=>0,'away_score'=>0]);
$rows=[$base,$base,$n,array_replace($base,['game_world_id'=>'GW002']),array_replace($base,['sm_fixture_id'=>3,'home_sm_manager_id'=>null]),array_replace($base,['sm_fixture_id'=>4,'home_score'=>null])];
$all=ch_results_rows($rows,'GW001',$managers,'M1','global');
check($all['managers']['M1']['stats']['played']===2,'Count unique valid results only');
check($all['managers']['M1']['stats']['won']===1&&$all['managers']['M1']['stats']['drawn']===1,'Results scores');
check($all['managers']['M1']['stats']['matched_by_id']===2,'ID attribution');
check(count($all['matches'])===2&&$all['matches'][1]['source']==='Results','Career detail source');
check($all['managers']['M2']['stats']['played']===3,'Other side remains valid when manager missing');
check(ch_results_rows($rows,'GW001',$managers,'M1','club')['managers']['M1']['stats']['played']===1,'Club filter');
check(ch_results_rows($rows,'GW001',$managers,'M1','national_team')['managers']['M1']['stats']['played']===1,'Nations filter');
$conflict=ch_results_rows([$base,array_replace($base,['home_sm_manager_id'=>20])],'GW001',$managers,'M1');
check($conflict['managers']['M1']['stats']['played']===0,'Conflicting duplicates excluded');
check($all['coverage']['source']==='Results'&&$all['coverage']['duplicate_rows']===1,'Coverage');
echo "PASS: Career Results, club/nations, IDs, missing IDs, duplicate/conflict and GW isolation\n";
