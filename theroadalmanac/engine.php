<?php
declare(strict_types=1);
function rth_scope(array $r): string {
    return ($r['competition_group']??'')==='NATIONS'||str_contains((string)($r['competition_key']??''),'|NATIONS|')?'nation':'club';
}
function rth_label(array $r,array $labels): string {
    $key=(string)$r['competition_key'];$a=strtolower((string)($r['sm_action']??$r['trophy_type']??''));$d=(int)($r['sm_division']??0);
    $tiers=[1=>'Platinum',2=>'Gold',3=>'Silver',4=>'Bronze'];
    if(isset($tiers[$d])&&in_array($a,['league','playoff'],true))return $tiers[$d].($a==='playoff'?' · Playoff':' Division');
    return (string)($labels[$key]??$r['nexus_view']??$key);
}
function rth_manager(array $r,string $side,array $assignments,array $managers): ?string {
    $day=substr((string)($r['match_date']??''),0,10);
    if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$day))return null;
    $team=(string)($r[$side.'_sm_club_id']??'');if((int)$team<1)return null;
    $kind=rth_scope($r)==='nation'?'national_team':'club';$found=[];
    foreach($assignments as $a){
        if(($a['game_world_id']??'')!=='GW001'||$a['assignment_type']!==$kind)continue;
        if((string)($a[$kind==='club'?'team_id':'national_team_id']??'')!==$team)continue;
        if(!$a['start_date']||$a['start_date']==='0000-00-00'||$a['start_date']>$day||($a['end_date']!==null&&$a['end_date']<$day))continue;
        $found[$a['manager_id']]=true;
    }
    if(count($found)!==1)return null;
    $id=(string)array_key_first($found);if(!isset($managers[$id]))return null;
    $sm=(int)($r[$side.'_sm_manager_id']??0);
    if($sm>0&&$sm!==(int)$managers[$id]['sm_manager_id'])return null;
    return $id;
}
