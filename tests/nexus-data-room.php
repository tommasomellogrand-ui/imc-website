<?php
declare(strict_types=1);
require __DIR__.'/../nexus/h2h/engine.php';
require __DIR__.'/../nexus/teams/roster-stats.php';
require __DIR__.'/../nexus/h2h/data-room-engine.php';
function check($yes,$message){if(!$yes)throw new RuntimeException($message);}
function fixture($id,$gf,$ga,$scorers,$shots=10,$minutes=true){
 $m=['sm_fixture_id'=>(string)$id,'side'=>'home','gf'=>$gf,'ga'=>$ga,'outcome'=>$gf>$ga?'V':($gf<$ga?'P':'N'),'has_report'=>true,'penalty_home_score'=>null,'penalty_away_score'=>null,'match_date'=>'2026-10-0'.$id];
 $r=['sm_fixture_id'=>(string)$id,'home_sm_club_id'=>10,'away_sm_club_id'=>20,'home_score'=>$gf,'away_score'=>$ga,'team_stats_json'=>json_encode(['home'=>['total_shots'=>$shots],'away'=>['total_shots'=>8],'scorers'=>$scorers]),'players_json'=>json_encode([['sm_player_id'=>1,'player_name'=>'Test','team_side'=>'home','starter'=>1,'goals'=>1,'rating'=>7,'own_goals'=>0]]),'commentary_json'=>$minutes?'[{"minute":"90","commentary_text":"Full time"}]':'[]'];return [$m,$r];
}
[$a,$ar]=fixture(1,2,1,[['team_side'=>'away','minute'=>5],['team_side'=>'home','minute'=>'45+2'],['team_side'=>'home','minute'=>85]]);
[$b,$br]=fixture(2,0,0,[],30);
[$c,$cr]=fixture(3,1,0,[['team_side'=>'home','minute'=>12]],10);
[$e,$er]=fixture(4,1,1,[['team_side'=>'home','minute'=>10],['team_side'=>'away','minute'=>10]],null,false);
$d=nexus_data_room([$e,$c,$b,$a],[$ar,$br,$cr,$er]);
check($d['summary']['played']===4,'report count');check($d['summary']['clean_sheets']===2,'clean sheets');check($d['records']['unbeaten']===4,'record');
check($d['efficiency']['own']['conversion']===6.0,'ratio must use paired goals/shots totals');
check($d['analysis']['reports']===4&&$d['analysis']['sequence_reports']===3,'ambiguous order excluded only from comeback');
check($d['analysis']['comeback_wins']===1,'comeback');check($d['analysis']['bins']['31–45+']['gf']===1,'first half stoppage');
check($d['players'][0]['minutes']===null&&$d['players'][0]['goals90']===null,'missing minutes must not yield per90');
$d=nexus_data_room([$c,$b,$a],[$ar,$br,$cr]);check($d['players'][0]['minutes']===270&&$d['players'][0]['goals90']===1.0,'per90 complete threshold');
$ar['team_stats_json']='{}';$d=nexus_data_room([$a],[$ar]);check($d['analysis']['reports']===0,'missing events excluded');check($d['efficiency']['own']['conversion']===null,'missing shots not zero');
$d=nexus_data_room([],[]);check($d['summary']['played']===0&&$d['players']===[],'empty');
echo "Data Room report-only aggregation tests passed\n";
