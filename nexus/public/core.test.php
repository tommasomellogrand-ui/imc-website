<?php
declare(strict_types=1);
require_once __DIR__.'/core.php';
function check(bool $condition,string $message): void { if(!$condition)throw new RuntimeException($message); }
$teams=[['sm_team_id'=>94079171,'sm_global_team_id'=>404,'club_id'=>404],['sm_team_id'=>null,'sm_global_team_id'=>306,'club_id'=>306]];
$index=nexus_team_index($teams);
check(isset($index['94079171']),'World ID must resolve');
check(!isset($index['404']),'Global ID must not identify a report team');
check(!isset($index['306']),'Missing world ID must not fall back to global ID');
check(!isset($index['']),'Null ID must not be indexed');
$duplicate=[...$teams,['sm_team_id'=>94079171,'club_id'=>999],['sm_team_id'=>94079171,'club_id'=>888]];
check(!isset(nexus_team_index($duplicate)['94079171']),'Ambiguous world IDs must never resolve');
$nation=nexus_team_index([['sm_team_id'=>94079171,'national_team_id'=>1]]);
check($nation['94079171']['national_team_id']===1&&$index['94079171']['club_id']===404,'Club and national indexes must stay separate');
echo "WORLD_TEAM_ID_TESTS_OK\n";
$rows=[['sm_fixture_id'=>1,'home_sm_club_id'=>null,'away_sm_club_id'=>20],['sm_fixture_id'=>2,'home_sm_club_id'=>null]];
nexus_apply_logo_hints($rows,[['sm_fixture_id'=>1,'home_sm_club_id'=>10,'away_sm_club_id'=>99],['sm_fixture_id'=>2,'home_sm_club_id'=>30],['sm_fixture_id'=>2,'home_sm_club_id'=>31]]);
check($rows[0]['home_logo_team_id']===10,'Missing logo identity must come from the same fixture report');
check($rows[0]['home_sm_club_id']===null&&$rows[0]['away_sm_club_id']===20,'Original source IDs must remain unchanged');
check(!isset($rows[0]['away_logo_team_id']),'An existing source ID must not be overridden');
check(!isset($rows[1]['home_logo_team_id']),'Conflicting reports must not guess a logo');
echo "REPORT_LOGO_HINT_TESTS_OK\n";

$nations=[['id'=>1,'name'=>'England','sm_team_id'=>646508,'sm_global_team_id'=>1001]];
$assignments=[
 ['national_team_id'=>646508,'manager_id'=>'MNG001','start_date'=>'2026-07-01','team_id'=>99],
 ['national_team_id'=>1],['national_team_id'=>1001],
 ['national_team_id'=>null,'team_id'=>404],['national_team_id'=>999]
];
$original=$assignments;
nexus_normalize_national_assignments($assignments,$nations);
foreach([0] as $i)check($assignments[$i]['national_team_id']===1&&$assignments[$i]['team_name']==='England'&&$assignments[$i]['team_id']===null,'Only the mapped world national ID resolves to the Codex');
check($assignments[0]['source_national_team_id']===646508&&$assignments[0]['manager_id']==='MNG001'&&$assignments[0]['start_date']==='2026-07-01','Preserve source ID, manager and assignment dates');
check($assignments[1]===$original[1]&&$assignments[2]===$original[2],'Internal and global IDs must not resolve as world IDs');
check($assignments[3]===$original[3]&&$assignments[4]===$original[4],'Club and unknown assignments must remain unchanged');
$ambiguous=[['national_team_id'=>646508]];
nexus_normalize_national_assignments($ambiguous,[...$nations,['id'=>2,'name'=>'Other','sm_team_id'=>646508]]);
check($ambiguous===[['national_team_id'=>646508]],'Conflicting national mappings must not be guessed');
echo "NATIONAL_ASSIGNMENT_TESTS_OK\n";

$collision=[['national_team_id'=>73]];
nexus_normalize_national_assignments($collision,[['id'=>73,'name'=>'Guinea','sm_team_id'=>91],['id'=>30,'name'=>'Latvia','sm_team_id'=>73]]);
check($collision[0]['national_team_id']===30&&$collision[0]['team_name']==='Latvia','GW008 world ID must win over an unrelated internal ID');
