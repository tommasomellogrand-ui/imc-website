<?php
declare(strict_types=1);

/*
 * IMC Public Read API v1
 * Phase 1 scope: GW001 · Road To History only.
 *
 * This endpoint is deliberately separate from ingestion and audit handlers.
 * It performs SELECT queries only and never returns RAW captures or HTML.
 */

require_once dirname(__DIR__, 3).'/__imc-sm-master/admin/core.php';

const IMC_DATA_API_BASE = '/api/imc-data/v1';
const IMC_DATA_API_WORLD = 'GW001';
const IMC_DATA_API_DATABASE = 'Sql1956795_3';
const IMC_DATA_API_FAMILY = 'single_league';
const IMC_DATA_API_DEFAULT_LIMIT = 100;
const IMC_DATA_API_MAX_LIMIT = 500;

function api_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=30, stale-while-revalidate=60');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function api_error(string $message, int $status, ?string $code = null): never {
    api_response([
        'ok' => false,
        'error' => [
            'code' => $code ?? ('HTTP_'.$status),
            'message' => $message,
        ],
        'generated_at' => gmdate('c'),
    ], $status);
}

function api_database(string $database): mysqli {
    static $connections = [];
    if (isset($connections[$database]) && $connections[$database] instanceof mysqli) {
        return $connections[$database];
    }

    if (!in_array($database, ['Sql1956795_1', 'Sql1956795_3'], true)) {
        throw new RuntimeException('Database route is not allowed.');
    }

    $config = smm_config()['db'];
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $connection = new mysqli(
        (string)$config['host'],
        (string)$config['user'],
        (string)$config['password'],
        $database
    );
    $connection->set_charset('utf8mb4');
    $connections[$database] = $connection;
    return $connection;
}

function api_world_id(mixed $value): string {
    $world = strtoupper(trim((string)$value));
    if ($world !== IMC_DATA_API_WORLD) {
        api_error('Game World non disponibile in questa versione API.', 404, 'WORLD_NOT_AVAILABLE');
    }
    return $world;
}

function api_season(mixed $value, int $fallback): int {
    if ($value === null || $value === '') return $fallback;
    if ((!is_int($value) && !(is_string($value) && ctype_digit($value))) || (int)$value < 1 || (int)$value > 9999) {
        api_error('Parametro season non valido.', 422, 'INVALID_SEASON');
    }
    return (int)$value;
}

function api_fixture_id(mixed $value): int {
    if ((!is_int($value) && !(is_string($value) && ctype_digit($value))) || (int)$value < 1) {
        api_error('fixture_id non valido.', 422, 'INVALID_FIXTURE_ID');
    }
    return (int)$value;
}

function api_positive_int(mixed $value, int $fallback, int $maximum): int {
    if ($value === null || $value === '') return $fallback;
    if ((!is_int($value) && !(is_string($value) && ctype_digit($value))) || (int)$value < 0) {
        api_error('Parametro numerico non valido.', 422, 'INVALID_NUMERIC_PARAMETER');
    }
    return min((int)$value, $maximum);
}

function api_one(mysqli $db, string $sql, array $params = []): ?array {
    $statement = $db->prepare($sql);
    $statement->execute($params);
    $row = $statement->get_result()->fetch_assoc();
    $statement->close();
    return $row ?: null;
}

function api_all(mysqli $db, string $sql, array $params = []): array {
    $statement = $db->prepare($sql);
    $statement->execute($params);
    $rows = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
    $statement->close();
    return $rows;
}

function api_count(mysqli $db, string $sql, array $params = []): int {
    $row = api_one($db, $sql, $params);
    return (int)($row['total'] ?? 0);
}

function api_nullable_int(mixed $value): ?int {
    return $value === null ? null : (int)$value;
}

function api_nullable_float(mixed $value): ?float {
    return $value === null ? null : (float)$value;
}

function api_bool(mixed $value): bool {
    return (int)$value === 1;
}

function api_decode_json(mixed $value): mixed {
    if ($value === null || $value === '') return null;
    try {
        return json_decode((string)$value, true, 64, JSON_THROW_ON_ERROR);
    } catch (Throwable) {
        return null;
    }
}

function api_core_context(string $world): array {
    $core = api_database('Sql1956795_1');
    $row = api_one(
        $core,
        'SELECT w.game_world_id,w.imc_name,w.game_world_type,w.sm_game_world_id,'.
        's.imc_season,s.soccer_manager_season,s.imc_season_start_date,s.imc_season_end_date '.
        'FROM imc_game_worlds w '.
        'LEFT JOIN imc_game_world_seasons s ON s.game_world_id=w.game_world_id '.
        'WHERE w.game_world_id=? ORDER BY s.imc_season DESC LIMIT 1',
        [$world]
    );
    if (!$row) api_error('Game World non trovato nel CORE IMC.', 404, 'WORLD_NOT_FOUND');
    return $row;
}

function api_dataset_counts(mysqli $db, string $world, int $season): array {
    $schedule = api_count(
        $db,
        "SELECT COUNT(DISTINCT f.fixture_id) total FROM gw_fixtures f JOIN gw_source_captures c ON c.capture_id=f.capture_id WHERE f.game_world_id=? AND f.imc_season=? AND c.report_type='SCHEDULE'",
        [$world, $season]
    );
    $results = api_count(
        $db,
        'SELECT COUNT(DISTINCT r.fixture_id) total FROM gw_fixture_results r JOIN gw_fixtures f ON f.game_world_id=r.game_world_id AND f.fixture_id=r.fixture_id WHERE r.game_world_id=? AND f.imc_season=?',
        [$world, $season]
    );
    $reports = api_count(
        $db,
        'SELECT COUNT(DISTINCT r.fixture_id) total FROM gw_match_reports r JOIN gw_fixtures f ON f.game_world_id=r.game_world_id AND f.fixture_id=r.fixture_id WHERE r.game_world_id=? AND f.imc_season=?',
        [$world, $season]
    );
    $playerCodexCaptures = api_count(
        $db,
        "SELECT COUNT(*) total FROM gw_source_captures WHERE game_world_id=? AND report_type='PLAYER_CODEX'",
        [$world]
    );
    $playerCodexRosters = api_count(
        $db,
        'SELECT COUNT(*) total FROM gw_squads WHERE game_world_id=?',
        [$world]
    );
    $transfers = api_count(
        $db,
        'SELECT COUNT(*) total FROM gw_transfers WHERE game_world_id=?',
        [$world]
    );

    return [
        'schedule' => ['available' => $schedule > 0, 'fixture_count' => $schedule],
        'results' => ['available' => $results > 0, 'fixture_count' => $results],
        'match_reports' => ['available' => $reports > 0, 'fixture_count' => $reports],
        'player_codex' => [
            'available' => $playerCodexCaptures > 0 && $playerCodexRosters > 0,
            'capture_count' => $playerCodexCaptures,
            'roster_count' => $playerCodexRosters,
        ],
        'transfers' => ['available' => $transfers > 0, 'record_count' => $transfers],
    ];
}

function api_world(string $world): never {
    $core = api_core_context($world);
    $season = api_season($_GET['season'] ?? null, (int)($core['imc_season'] ?? 1));
    $db = api_database(IMC_DATA_API_DATABASE);
    $localSeason = api_one(
        $db,
        'SELECT imc_season,soccer_manager_season,sm_game_world_id,sm_season_id,start_date,end_date FROM gw_seasons WHERE game_world_id=? AND imc_season=? ORDER BY gw_season_row_id DESC LIMIT 1',
        [$world, $season]
    );
    if (!$localSeason) api_error('Stagione non disponibile per il Game World.', 404, 'SEASON_NOT_FOUND');

    $competitionCount = api_count(
        $db,
        'SELECT COUNT(DISTINCT competition_id) total FROM gw_fixtures WHERE game_world_id=? AND imc_season=? AND competition_id IS NOT NULL',
        [$world, $season]
    );
    $fixtureCount = api_count(
        $db,
        'SELECT COUNT(DISTINCT fixture_id) total FROM gw_fixtures WHERE game_world_id=? AND imc_season=?',
        [$world, $season]
    );

    api_response([
        'ok' => true,
        'data' => [
            'game_world_id' => $world,
            'name' => $core['imc_name'],
            'storage_family' => IMC_DATA_API_FAMILY,
            'sm_game_world_id' => api_nullable_int($core['sm_game_world_id'] ?? $localSeason['sm_game_world_id']),
            'season' => [
                'imc_season' => $season,
                'soccer_manager_season' => api_nullable_int($core['soccer_manager_season'] ?? $localSeason['soccer_manager_season']),
                'sm_season_id' => api_nullable_int($localSeason['sm_season_id']),
                'start_date' => $core['imc_season_start_date'] ?? $localSeason['start_date'],
                'end_date' => $core['imc_season_end_date'] ?? $localSeason['end_date'],
            ],
            'summary' => [
                'fixture_count' => $fixtureCount,
                'competition_count' => $competitionCount,
            ],
            'datasets' => api_dataset_counts($db, $world, $season),
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function api_match_row(array $row): array {
    return [
        'fixture_id' => (int)$row['fixture_id'],
        'game_world_id' => $row['game_world_id'],
        'imc_season' => api_nullable_int($row['imc_season']),
        'date' => $row['date'],
        'time' => $row['time'],
        'status' => $row['status'],
        'home' => [
            'name' => $row['home_name'],
            'world_club_id' => api_nullable_int($row['home_world_club_id']),
        ],
        'away' => [
            'name' => $row['away_name'],
            'world_club_id' => api_nullable_int($row['away_world_club_id']),
        ],
        'competition' => [
            'world_competition_row_id' => api_nullable_int($row['competition_id']),
            'competition_id' => api_nullable_int($row['source_competition_id']),
            'name' => $row['stored_competition_name'] ?? $row['fixture_competition_name'],
            'type' => $row['competition_type'],
            'competition_master_id' => api_nullable_int($row['competition_master_id']),
            'competition_group' => $row['competition_group'],
            'competition_code' => $row['master_competition_id'],
            'division_value' => $row['division_value'],
            'round_label' => $row['round_label'],
        ],
        'result' => $row['fixture_result_id'] === null ? null : [
            'home_score' => api_nullable_int($row['home_score']),
            'away_score' => api_nullable_int($row['away_score']),
            'aggregate_home' => api_nullable_int($row['aggregate_home']),
            'aggregate_away' => api_nullable_int($row['aggregate_away']),
            'penalty_home' => api_nullable_int($row['penalty_home']),
            'penalty_away' => api_nullable_int($row['penalty_away']),
            'winner_side' => $row['winner_side'],
            'result_status' => $row['result_status'],
        ],
        'availability' => [
            'schedule' => strtoupper((string)$row['fixture_source']) === 'SCHEDULE',
            'result' => $row['fixture_result_id'] !== null,
            'match_report' => api_bool($row['has_match_report']),
        ],
    ];
}

function api_match_select(): string {
    return "SELECT f.fixture_id,f.game_world_id,f.imc_season,f.date,f.time,f.status,f.home_name,f.away_name,".
        "f.home_world_club_id,f.away_world_club_id,f.competition_id,f.competition_name fixture_competition_name,f.round_label,".
        "c.competition_id source_competition_id,c.competition_name stored_competition_name,c.competition_type,c.competition_master_id,c.competition_group,c.master_competition_id,c.division_value,src.report_type fixture_source,".
        "fr.fixture_result_id,fr.home_score,fr.away_score,fr.aggregate_home,fr.aggregate_away,fr.penalty_home,fr.penalty_away,fr.winner_side,fr.result_status,".
        "EXISTS(SELECT 1 FROM gw_match_reports mr WHERE mr.game_world_id=f.game_world_id AND mr.fixture_id=f.fixture_id) has_match_report ".
        "FROM gw_fixtures f ".
        "LEFT JOIN gw_competitions c ON c.gw_competition_row_id=f.competition_id ".
        "LEFT JOIN gw_source_captures src ON src.capture_id=f.capture_id ".
        "LEFT JOIN gw_fixture_results fr ON fr.fixture_result_id=(SELECT MAX(fr2.fixture_result_id) FROM gw_fixture_results fr2 WHERE fr2.game_world_id=f.game_world_id AND fr2.fixture_id=f.fixture_id) ";
}

function api_matches(string $world): never {
    $core = api_core_context($world);
    $season = api_season($_GET['season'] ?? null, (int)($core['imc_season'] ?? 1));
    $limit = api_positive_int($_GET['limit'] ?? null, IMC_DATA_API_DEFAULT_LIMIT, IMC_DATA_API_MAX_LIMIT);
    if ($limit < 1) api_error('limit deve essere maggiore di zero.', 422, 'INVALID_LIMIT');
    $offset = api_positive_int($_GET['offset'] ?? null, 0, 1000000);
    $db = api_database(IMC_DATA_API_DATABASE);

    $total = api_count(
        $db,
        'SELECT COUNT(DISTINCT fixture_id) total FROM gw_fixtures WHERE game_world_id=? AND imc_season=?',
        [$world, $season]
    );
    $sql = api_match_select().
        'WHERE f.game_world_id=? AND f.imc_season=? '.
        'ORDER BY f.date IS NULL,f.date,f.time IS NULL,f.time,f.fixture_id LIMIT ? OFFSET ?';
    $rows = api_all($db, $sql, [$world, $season, $limit, $offset]);

    api_response([
        'ok' => true,
        'data' => array_map('api_match_row', $rows),
        'pagination' => [
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'returned' => count($rows),
        ],
        'context' => [
            'game_world_id' => $world,
            'imc_season' => $season,
            'storage_family' => IMC_DATA_API_FAMILY,
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function api_match_detail(string $world, int $fixtureId): never {
    $db = api_database(IMC_DATA_API_DATABASE);
    $row = api_one(
        $db,
        api_match_select().'WHERE f.game_world_id=? AND f.fixture_id=? LIMIT 1',
        [$world, $fixtureId]
    );
    if (!$row) api_error('Fixture non trovata.', 404, 'FIXTURE_NOT_FOUND');

    $match = api_match_row($row);
    $report = api_one(
        $db,
        'SELECT match_report_id FROM gw_match_reports WHERE game_world_id=? AND fixture_id=? ORDER BY match_report_id DESC LIMIT 1',
        [$world, $fixtureId]
    );

    $matchReport = null;
    if ($report) {
        $reportId = (int)$report['match_report_id'];
        $statsRows = api_all(
            $db,
            'SELECT side,world_team_id,possession,shots,shots_on_target,corners,fouls,offside FROM gw_match_team_stats WHERE game_world_id=? AND match_report_id=? ORDER BY side',
            [$world, $reportId]
        );
        $stats = [];
        foreach ($statsRows as $stat) {
            $side = strtolower((string)$stat['side']);
            $stats[$side] = [
                'world_team_id' => api_nullable_int($stat['world_team_id']),
                'possession' => api_nullable_float($stat['possession']),
                'shots' => api_nullable_int($stat['shots']),
                'shots_on_target' => api_nullable_int($stat['shots_on_target']),
                'corners' => api_nullable_int($stat['corners']),
                'fouls' => api_nullable_int($stat['fouls']),
                'offside' => api_nullable_int($stat['offside']),
            ];
        }

        $lineupRows = api_all(
            $db,
            'SELECT l.match_lineup_id,l.side,l.world_team_id,l.formation,p.player_id,p.position_label,p.rating_raw,p.slot_order,p.is_substitute,'.
            '(SELECT ps.player_name FROM gw_player_profile_snapshots ps WHERE ps.game_world_id=p.game_world_id AND ps.player_id=p.player_id ORDER BY ps.player_profile_snapshot_id DESC LIMIT 1) player_name '.
            'FROM gw_match_lineups l LEFT JOIN gw_match_lineup_players p ON p.match_lineup_id=l.match_lineup_id '.
            'WHERE l.game_world_id=? AND l.match_report_id=? ORDER BY l.side,p.slot_order,p.match_lineup_player_id',
            [$world, $reportId]
        );
        $lineups = [];
        foreach ($lineupRows as $lineup) {
            $side = strtolower((string)$lineup['side']);
            if (!isset($lineups[$side])) {
                $lineups[$side] = [
                    'world_team_id' => api_nullable_int($lineup['world_team_id']),
                    'formation' => $lineup['formation'],
                    'players' => [],
                ];
            }
            if ($lineup['player_id'] !== null) {
                $lineups[$side]['players'][] = [
                    'player_id' => (int)$lineup['player_id'],
                    'player_name' => $lineup['player_name'],
                    'position' => $lineup['position_label'],
                    'rating' => $lineup['rating_raw'],
                    'slot_order' => api_nullable_int($lineup['slot_order']),
                    'is_substitute' => api_bool($lineup['is_substitute']),
                ];
            }
        }

        $eventRows = api_all(
            $db,
            'SELECT event_order,event_type,goal_minute,goal_type,minute_raw,player_id,related_player_id,world_team_id,substitutions FROM gw_match_events WHERE game_world_id=? AND match_report_id=? ORDER BY event_order,match_event_id',
            [$world, $reportId]
        );
        $events = array_map(static fn(array $event): array => [
            'event_order' => (int)$event['event_order'],
            'event_type' => $event['event_type'],
            'minute' => api_nullable_int($event['goal_minute']),
            'minute_raw' => $event['minute_raw'],
            'goal_type' => $event['goal_type'],
            'player_id' => api_nullable_int($event['player_id']),
            'related_player_id' => api_nullable_int($event['related_player_id']),
            'world_team_id' => api_nullable_int($event['world_team_id']),
            'substitution' => api_decode_json($event['substitutions']),
        ], $eventRows);

        $commentaryRows = api_all(
            $db,
            'SELECT event_order,commentary_event_minute,commentary_text FROM gw_match_commentary WHERE game_world_id=? AND match_report_id=? ORDER BY event_order,commentary_event_id',
            [$world, $reportId]
        );
        $commentary = array_map(static fn(array $item): array => [
            'event_order' => (int)$item['event_order'],
            'minute' => api_nullable_int($item['commentary_event_minute']),
            'text' => $item['commentary_text'],
        ], $commentaryRows);

        $tacticRows = api_all(
            $db,
            'SELECT side,minute_from,formation_name,tactics_snapshot FROM gw_match_tactics_snapshots WHERE game_world_id=? AND match_report_id=? ORDER BY minute_from,match_tactics_snapshot_id',
            [$world, $reportId]
        );
        $tactics = array_map(static fn(array $item): array => [
            'side' => $item['side'],
            'minute_from' => api_nullable_int($item['minute_from']),
            'formation' => $item['formation_name'],
            'snapshot' => api_decode_json($item['tactics_snapshot']),
        ], $tacticRows);

        $matchReport = [
            'available' => true,
            'team_stats' => $stats,
            'lineups' => $lineups,
            'events' => $events,
            'commentary' => $commentary,
            'tactics' => $tactics,
        ];
    }

    api_response([
        'ok' => true,
        'data' => [
            'match' => $match,
            'match_report' => $matchReport,
        ],
        'generated_at' => gmdate('c'),
    ]);
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
        header('Allow: GET');
        api_error('Metodo non consentito.', 405, 'METHOD_NOT_ALLOWED');
    }

    $requestPath = rawurldecode((string)(parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?? ''));
    $relativePath = trim(substr($requestPath, strlen(IMC_DATA_API_BASE)), '/');
    $segments = $relativePath === '' ? [] : explode('/', $relativePath);

    if (count($segments) === 2 && $segments[0] === 'worlds') {
        api_world(api_world_id($segments[1]));
    }
    if (count($segments) === 3 && $segments[0] === 'worlds' && $segments[2] === 'matches') {
        api_matches(api_world_id($segments[1]));
    }
    if (count($segments) === 4 && $segments[0] === 'worlds' && $segments[2] === 'matches') {
        api_match_detail(api_world_id($segments[1]), api_fixture_id($segments[3]));
    }

    api_error('Endpoint non trovato.', 404, 'ENDPOINT_NOT_FOUND');
} catch (mysqli_sql_exception $exception) {
    error_log('IMC Public Read API database error: '.$exception->getMessage());
    api_error('Dati temporaneamente non disponibili.', 503, 'DATA_UNAVAILABLE');
} catch (Throwable $exception) {
    error_log('IMC Public Read API error: '.$exception->getMessage());
    api_error('Servizio temporaneamente non disponibile.', 500, 'SERVICE_UNAVAILABLE');
}
