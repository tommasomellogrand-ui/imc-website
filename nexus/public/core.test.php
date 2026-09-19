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
