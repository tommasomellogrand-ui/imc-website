<?php
declare(strict_types=1);

$private = dirname(__DIR__, 2) . '/__imc_private_gateway/config.php';

if (!is_file($private)) {
    throw new RuntimeException('Private Gateway configuration not found.');
}

$cfg = require $private;

$cfg['repositories'] = array_values(array_unique(array_merge(
    $cfg['repositories'] ?? [],
    [
        'match_report',
        'match_report_team_stats',
        'match_report_players',
        'match_report_events',
        'match_report_tactics',
        'match_report_commentary',
        'player_codex',
        'player_codex_roster',
        'player_codex_stats',
        'player_codex_rating_history',
        'player_codex_transfer_history',
        'player_codex_injury_history',
        'player_codex_snapshots',
        'sm_player_stats',
    ]
)));

return $cfg;
