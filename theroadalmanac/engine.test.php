<?php
require __DIR__.'/engine.php';
function check($actual,$expected){if($actual!==$expected)throw new RuntimeException('Historical manager assertion failed');}
$m=['MNG1'=>['sm_manager_id'=>11],'MNG2'=>['sm_manager_id'=>22]];
$a=[['game_world_id'=>'GW001','manager_id'=>'MNG1','assignment_type'=>'club','team_id'=>1,'national_team_id'=>null,'start_date'=>'2026-01-01','end_date'=>'2026-06-30'],['game_world_id'=>'GW001','manager_id'=>'MNG2','assignment_type'=>'club','team_id'=>1,'national_team_id'=>null,'start_date'=>'2026-07-01','end_date'=>null]];
$r=['home_sm_club_id'=>1,'match_date'=>'2026-04-01'];
check(rth_manager($r,'home',$a,$m),'MNG1');
$r['match_date']='2026-08-01';check(rth_manager($r,'home',$a,$m),'MNG2');
$r['home_sm_manager_id']=11;check(rth_manager($r,'home',$a,$m),null);
unset($r['home_sm_manager_id']);$a[0]['end_date']=null;check(rth_manager($r,'home',$a,$m),null);
$a[0]['end_date']='2026-06-30';$a[1]['start_date']=null;check(rth_manager($r,'home',$a,$m),null);
check(rth_scope(['competition_key'=>'GW001|NATIONS|worldcup']),'nation');
echo "Historical assignment boundaries, conflicts and missing dates verified.\n";
