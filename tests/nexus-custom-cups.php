<?php
require __DIR__.'/../nexus/competitions/custom-cups.php';
require __DIR__.'/../nexus/competitions/standings-engine.php';
function check($value){if(!$value)throw new RuntimeException('Custom cup check failed');}
$cups=nexus_custom_cups('GW010',1);check(count($cups)===2);
check(nexus_custom_cups('GW009',1)===[]);check(nexus_custom_cups('GW010',2)===[]);
$ids=[];
foreach($cups as $cup){
 $empty=nexus_standings_tables([],$cup['groups']);check(count($empty['groups'])===4);check(count($empty['rows'])===12);
 foreach($empty['groups'] as $g){check(count($g['rows'])===3);foreach($g['rows'] as $r){check($r['played']===0&&$r['points']===0);$ids[]=$r['team_id'];}}
 $a=$cup['groups'][0]['teams'][0];$b=$cup['groups'][0]['teams'][1];
 $fixture=['sm_fixture_id'=>'123','competition_stage'=>'Girone A','competition_group_name'=>'Girone A','home_sm_club_id'=>$a['team_id'],'home_name'=>$a['team_name'],'away_sm_club_id'=>$b['team_id'],'away_name'=>$b['team_name'],'home_score'=>2,'away_score'=>1];
 $table=nexus_standings_tables([$fixture,$fixture],$cup['groups']);check(count($table['rows'])===12);check($table['groups'][0]['rows'][0]['points']===3);check($table['groups'][0]['rows'][0]['played']===1);
}
check(count(array_unique($ids))===24);check(nexus_standings_tables([])['groups']===[]);
echo "Custom cups: 24 unique teams, 8 seeded groups, isolation and fixture deduplication OK\n";
