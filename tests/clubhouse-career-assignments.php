<?php
declare(strict_types=1);
require __DIR__.'/../nexus/club-house/engine.php';
require __DIR__.'/../nexus/club-house/national-results.php';
require __DIR__.'/../clubhouse/career-results.php';
function career_check(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException($message);
}
$managers = [
    ['manager_id'=>'MNG029','full_name'=>'Al Zubeidi','sm_manager_id'=>4455966],
    ['manager_id'=>'MNG002','full_name'=>'Previous manager','sm_manager_id'=>999],
];
$base = ['id'=>1,'game_world_id'=>'IMC001','manager_id'=>'MNG029','assignment_type'=>'club',
    'team_id'=>94078884,'team_name'=>'Palermo','start_date'=>'2026-06-30','end_date'=>null];
$assignments = [$base, array_replace($base,['id'=>2,'manager_id'=>'MNG002','start_date'=>'2026-05-01','end_date'=>'2026-06-29']),
    array_replace($base,['id'=>3,'assignment_type'=>'national_team','team_name'=>'Italia','national_team_id'=>77])];
$cup = ['game_world_id'=>'IMC001','sm_fixture_id'=>402585,'match_date'=>'2026-10-29','home_name'=>'Palermo FC',
    'away_name'=>'Roma','home_sm_club_id'=>null,'home_sm_manager_id'=>999,'home_score'=>2,'away_score'=>1,
    'competition_group'=>'IMC','competition_key'=>'IMC001|S02|IMC|europaleague'];
$league = array_replace($cup,['sm_fixture_id'=>368861394,'home_sm_club_id'=>94078884]);
$old = array_replace($league,['sm_fixture_id'=>12,'match_date'=>'2026-06-29','home_sm_manager_id'=>4455966]);
$national = array_replace($league,['sm_fixture_id'=>13,'competition_group'=>'NATIONS','home_sm_club_id'=>17,'home_name'=>'Italia']);
$otherWorld = array_replace($league,['sm_fixture_id'=>14,'game_world_id'=>'IMC006']);
$rows = [$cup,$league,$old,$national,$otherWorld,array_replace($cup,['home_sm_manager_id'=>4455966])];
$nations = [['entity_id'=>77,'world_id'=>700,'sm_id'=>17,'name'=>'Italia']];
$result = ch_career_results($rows,'GW001',$managers,'MNG029','global',$assignments,[],$nations);
career_check($result['managers']['MNG029']['stats']['played']===3,'Three matches belong to active assignments even with different identifiers in Results');
career_check($result['managers']['MNG002']['stats']['played']===1,'Earlier result goes to the manager at that date');
career_check(array_column($result['matches'],'assignment_id')===[1,1,3],'Cup with missing team ID joins Palermo, and national ID matches its mapping');
career_check($result['coverage']['duplicate_rows']===1,'Different stored manager IDs do not make a duplicate conflict');
$overlap = array_replace($base,['id'=>4,'manager_id'=>'MNG002','start_date'=>'2026-10-29']);
$checked = ch_career_results([$league],'GW001',$managers,'MNG029','club',[$base,$overlap],[],[]);
career_check($checked['matches']===[] && count($checked['issues'])===1,'Conflicting assignments are reported without selecting a manager arbitrarily');
echo "PASS: Club House career assignment dates, Palermo cup, changes of manager, nationals and overlaps\n";
