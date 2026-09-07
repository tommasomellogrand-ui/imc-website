<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$privateConfig = dirname(__DIR__) . '/__imc_private_gateway/config.php';
$connected = is_file($privateConfig);

$destinations = [
    'GW001' => ['database' => 'Sql1956795_3', 'game_world_type' => 'SINGLE_LEAGUE', 'schedule' => 'GW001_schedule', 'results' => 'GW001_results', 'match_report' => 'GW001_match_report', 'player_codex' => 'GW001_player_codex', 'transfers' => 'GW001_transfers', 'sm_players_stats' => 'GW001_sm_players_stats'],
    'GW002' => ['database' => 'Sql1956795_2', 'game_world_type' => 'MULTI_LEAGUE', 'schedule' => 'GW002_schedule', 'results' => 'GW002_results', 'match_report' => 'GW002_match_report', 'player_codex' => 'GW002_player_codex', 'transfers' => 'GW002_transfers', 'sm_players_stats' => 'GW002_sm_players_stats'],
    'GW003' => ['database' => 'Sql1956795_2', 'game_world_type' => 'MULTI_LEAGUE', 'schedule' => 'GW003_schedule', 'results' => 'GW003_results', 'match_report' => 'GW003_match_report', 'player_codex' => 'GW003_player_codex', 'transfers' => 'GW003_transfers', 'sm_players_stats' => 'GW003_sm_players_stats'],
    'GW004' => ['database' => 'Sql1956795_3', 'game_world_type' => 'SINGLE_LEAGUE', 'schedule' => 'GW004_schedule', 'results' => 'GW004_results', 'match_report' => 'GW004_match_report', 'player_codex' => 'GW004_player_codex', 'transfers' => 'GW004_transfers', 'sm_players_stats' => 'GW004_sm_players_stats'],
    'GW005' => ['database' => 'Sql1956795_3', 'game_world_type' => 'SINGLE_LEAGUE', 'schedule' => 'GW005_schedule', 'results' => 'GW005_results', 'match_report' => 'GW005_match_report', 'player_codex' => 'GW005_player_codex', 'transfers' => 'GW005_transfers', 'sm_players_stats' => 'GW005_sm_players_stats'],
    'GW006' => ['database' => 'Sql1956795_3', 'game_world_type' => 'SINGLE_LEAGUE', 'schedule' => 'GW006_schedule', 'results' => 'GW006_results', 'match_report' => 'GW006_match_report', 'player_codex' => 'GW006_player_codex', 'transfers' => 'GW006_transfers', 'sm_players_stats' => 'GW006_sm_players_stats'],
    'GW007' => ['database' => 'Sql1956795_2', 'game_world_type' => 'MULTI_LEAGUE', 'schedule' => 'GW007_schedule', 'results' => 'GW007_results', 'match_report' => 'GW007_match_report', 'player_codex' => 'GW007_player_codex', 'transfers' => 'GW007_transfers', 'sm_players_stats' => 'GW007_sm_players_stats'],
    'GW008' => ['database' => 'Sql1956795_2', 'game_world_type' => 'MULTI_LEAGUE', 'schedule' => 'GW008_schedule', 'results' => 'GW008_results', 'match_report' => 'GW008_match_report', 'player_codex' => 'GW008_player_codex', 'transfers' => 'GW008_transfers', 'sm_players_stats' => 'GW008_sm_players_stats'],
    'GW009' => ['database' => 'Sql1956795_3', 'game_world_type' => 'SINGLE_LEAGUE', 'schedule' => 'GW009_schedule', 'results' => 'GW009_results', 'match_report' => 'GW009_match_report', 'player_codex' => 'GW009_player_codex', 'transfers' => 'GW009_transfers', 'sm_players_stats' => 'GW009_sm_players_stats'],
];

http_response_code($connected ? 200 : 503);

echo json_encode([
    'ok' => $connected,
    'service' => 'IMC Universal Gateway',
    'status' => $connected ? 'connected' : 'not_connected'
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
