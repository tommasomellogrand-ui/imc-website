<?php
declare(strict_types=1);
require __DIR__.'/../nexus/competitions/match-teams.php';
require __DIR__.'/../nexus/h2h/engine.php';
function nexus_player_image_url($v){return $v;}
function check($v,$message){if(!$v)throw new RuntimeException($message);}
$lookup=nexus_team_lookup([['id'=>1,'name'=>'A','image_url'=>null],['id'=>2,'name'=>'B','image_url'=>null]],[['entity_id'=>1,'world_id'=>11],['entity_id'=>2,'world_id'=>22]]);
$a=['key'=>'imc:MNG001','name'=>'A'];$b=['key'=>'imc:MNG002','name'=>'B'];
$ctx=['teams'=>['club'=>$lookup,'national_team'=>$lookup],'sm_managers'=>[1=>$a,2=>$b],'assignments'=>[],'competitions'=>[]];
$r=['sm_fixture_id'=>1,'match_date'=>'2026-10-01','competition_key'=>'GW001|DOMESTIC|league|1','home_sm_club_id'=>11,'away_sm_club_id'=>22,'home_name'=>'A','away_name'=>'B','home_sm_manager_id'=>1,'away_sm_manager_id'=>2,'home_score'=>2,'away_score'=>0,'report_fixture'=>1];
$n=$r;$n['sm_fixture_id']=2;$n['competition_key']='GW001|NATIONS|worldcup';
check(count(h2h_matches([$r,$n],$ctx,'manager','MNG001','club'))===1,'Club scope');
check(count(h2h_matches([$r,$n],$ctx,'manager','MNG001','national_team'))===1,'National scope');
$matches=h2h_matches([$r],$ctx,'manager','MNG001','club');$m=$matches[0];$m['report_key']='GW001:1';$m2=$m;$m2['report_key']='GW002:1';
$reports=['GW001:1'=>['team_stats_json'=>json_encode(['home'=>['possession'=>60,'total_shots'=>10,'shots_on_target'=>5],'away'=>['possession'=>40,'total_shots'=>10,'shots_on_target'=>1]])],'GW002:1'=>['team_stats_json'=>json_encode(['home'=>['possession'=>40,'total_shots'=>30,'shots_on_target'=>3],'away'=>['possession'=>60,'total_shots'=>10,'shots_on_target'=>2]])]];
$c=h2h_report_comparison([$m,$m2],$reports);
check($c['metrics']['possession']['own']===50.0,'Cross-world fixture collision');
check($c['metrics']['accuracy']['own']===20.0,'Accuracy must use raw shot totals');
check($c['team_reports']===2,'Report count');
echo "H2H scopes, cross-world IDs and raw aggregation OK\n";
