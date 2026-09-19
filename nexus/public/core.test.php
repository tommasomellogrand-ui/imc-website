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
