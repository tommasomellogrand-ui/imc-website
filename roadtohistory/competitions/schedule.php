<?php
declare(strict_types=1);
$_GET['world'] = 'GW001';
$root = dirname(__DIR__, 2);
$competition = $_GET['competition'] ?? '';
if (!in_array($competition, [
    'IMC001|IMC|championsleague',
    'IMC001|IMC|europaleague',
    'IMC001|IMC|conferenceleague',
], true)) {
    require $root . '/nexus/competitions/schedule.php';
    return;
}
require $root . '/nexus/core/bootstrap.php';
require $root . '/nexus/competitions/match-teams.php';
try {
    $config = nexus_config();
    $db = nexus_db($config, nexus_target($config, 'GW001'));
    $season = nexus_season($_GET['season'] ?? null);
    $sql = 'SELECT * FROM IMC001_Schedule WHERE competition_key = ?';
    $params = [$competition];
    if ($season !== null) {
        $sql .= ' AND imc_season = ?';
        $params[] = $season;
    }
    $rows = nexus_rows($db, $sql . ' ORDER BY match_date, match_time, sm_fixture_id', $params);
    $rows = nexus_enrich_match_teams(nexus_db($config, 'core'), 'GW001', $rows);
    nexus_out(['ok' => true, 'game_world_id' => 'GW001', 'season' => $season, 'competition_key' => $competition, 'rows' => $rows]);
} catch (InvalidArgumentException $e) {
    nexus_out(['ok' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log('RTH cup schedule: ' . $e->getMessage());
    nexus_out(['ok' => false, 'error' => 'competition_schedule_error'], 500);
}
