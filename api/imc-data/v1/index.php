<?php
declare(strict_types=1);

/*
 * IMC Public Read API v1
 * Shared read-only data layer for GW001–GW009.
 *
 * This endpoint is deliberately separate from ingestion and audit handlers.
 * It performs SELECT queries only and never returns RAW captures or HTML.
 */

require_once dirname(__DIR__, 3).'/__imc-sm-master/admin/core.php';

const IMC_DATA_API_BASE = '/api/imc-data/v1';
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

    if (!in_array($database, ['Sql1956795_1', 'Sql1956795_2', 'Sql1956795_3'], true)) {
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


function api_public_asset_url(mixed $value): ?string {
    if ($value === null || trim((string)$value) === '') return null;
    return preg_replace('/^http:/i', 'https:', trim((string)$value));
}

function api_core_club_index(string $world, array $worldClubIds): array {
    $ids = array_values(array_unique(array_filter(array_map(
        static fn(mixed $id): int => (int)$id,
        $worldClubIds
    ), static fn(int $id): bool => $id > 0)));
    if ($ids === []) return [];
    $core = api_database('Sql1956795_1');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $rows = api_all(
        $core,
        "SELECT m.club_gw_id,m.club_id,c.name,c.short_name,c.image_url FROM clubs_game_world_id m JOIN clubs c ON c.club_id=m.club_id WHERE m.game_world_id=? AND m.club_gw_id IN ($placeholders)",
        array_merge([$world], $ids)
    );
    $index = [];
    foreach ($rows as $row) {
        $index[(string)$row['club_gw_id']] = [
            'club_id' => (int)$row['club_id'],
            'name' => $row['name'],
            'short_name' => $row['short_name'],
            'image_url' => '/nexus/assets/clubs/'.(int)$row['club_id'].'.png',
        ];
    }
    return $index;
}

function api_club_name_key(mixed $value): string {
    return mb_strtolower(trim(html_entity_decode((string)$value, ENT_QUOTES | ENT_HTML5, 'UTF-8')), 'UTF-8');
}

function api_core_club_name_index(string $world, array $clubNames): array {
    $names = array_values(array_unique(array_filter(array_map(
        static fn(mixed $name): string => trim(html_entity_decode((string)$name, ENT_QUOTES | ENT_HTML5, 'UTF-8')),
        $clubNames
    ), static fn(string $name): bool => $name !== '')));
    if ($names === []) return [];
    $core = api_database('Sql1956795_1');
    $placeholders = implode(',', array_fill(0, count($names), '?'));
    $rows = api_all(
        $core,
        "SELECT m.club_gw_id,m.club_id,c.name,c.short_name FROM clubs_game_world_id m JOIN clubs c ON c.club_id=m.club_id WHERE m.game_world_id=? AND c.name IN ($placeholders)",
        array_merge([$world], $names)
    );
    $index = [];
    foreach ($rows as $row) {
        $index[api_club_name_key($row['name'])] = [
            'world_club_id' => (int)$row['club_gw_id'],
            'club_id' => (int)$row['club_id'],
            'name' => $row['name'],
            'short_name' => $row['short_name'],
            'image_url' => '/nexus/assets/clubs/'.(int)$row['club_id'].'.png',
        ];
    }
    return $index;
}

function api_enrich_match_clubs(string $world, array $rows): array {
    $ids = [];
    foreach ($rows as $row) {
        $ids[] = $row['home_world_club_id'] ?? null;
        $ids[] = $row['away_world_club_id'] ?? null;
    }
    $index = api_core_club_index($world, $ids);
    $nameIndex = api_core_club_name_index($world, array_merge(
        array_column($rows, 'home_name'),
        array_column($rows, 'away_name')
    ));
    foreach ($rows as &$row) {
        $home = $index[(string)($row['home_world_club_id'] ?? '')]
            ?? $nameIndex[api_club_name_key($row['home_name'] ?? '')]
            ?? null;
        $away = $index[(string)($row['away_world_club_id'] ?? '')]
            ?? $nameIndex[api_club_name_key($row['away_name'] ?? '')]
            ?? null;
        if (($row['home_world_club_id'] ?? null) === null && $home !== null) {
            $row['home_world_club_id'] = $home['world_club_id'] ?? null;
        }
        if (($row['away_world_club_id'] ?? null) === null && $away !== null) {
            $row['away_world_club_id'] = $away['world_club_id'] ?? null;
        }
        $row['home_club_id'] = $home['club_id'] ?? null;
        $row['home_image_url'] = $home['image_url'] ?? null;
        $row['away_club_id'] = $away['club_id'] ?? null;
        $row['away_image_url'] = $away['image_url'] ?? null;
    }
    unset($row);
    return $rows;
}

function api_enrich_transfer_clubs(string $world, array $rows): array {
    $ids = [];
    foreach ($rows as $row) {
        $ids[] = $row['from_world_club_id'] ?? null;
        $ids[] = $row['to_world_club_id'] ?? null;
    }
    $index = api_core_club_index($world, $ids);
    foreach ($rows as &$row) {
        $from = $index[(string)($row['from_world_club_id'] ?? '')] ?? null;
        $to = $index[(string)($row['to_world_club_id'] ?? '')] ?? null;
        $row['from_club_id'] = $from['club_id'] ?? null;
        $row['from_image_url'] = $from['image_url'] ?? null;
        $row['to_club_id'] = $to['club_id'] ?? null;
        $row['to_image_url'] = $to['image_url'] ?? null;
    }
    unset($row);
    return $rows;
}

function api_world_id(mixed $value): string {
    $world = strtoupper(trim((string)$value));
    if (!preg_match('/^GW00[1-9]$/', $world)) {
        api_error('Game World non disponibile.', 404, 'WORLD_NOT_AVAILABLE');
    }
    return $world;
}

function api_world_database(string $world): string {
    return in_array($world, ['GW002', 'GW003', 'GW007', 'GW008'], true) ? 'Sql1956795_2' : 'Sql1956795_3';
}

function api_world_family(string $world): string {
    return in_array($world, ['GW002', 'GW003', 'GW007', 'GW008'], true) ? 'multi_league' : 'single_league';
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
    $db = api_database(api_world_database($world));
    $localSeason = api_one(
        $db,
        'SELECT imc_season,soccer_manager_season,sm_game_world_id,sm_season_id,start_date,end_date FROM gw_seasons WHERE game_world_id=? AND imc_season=? ORDER BY gw_season_row_id DESC LIMIT 1',
        [$world, $season]
    );
    if (!$localSeason) api_error('Stagione non disponibile per il Game World.', 404, 'SEASON_NOT_FOUND');

    $technicalCompetitionCount = api_count(
        $db,
        'SELECT COUNT(DISTINCT competition_id) total FROM gw_fixtures WHERE game_world_id=? AND imc_season=? AND competition_id IS NOT NULL',
        [$world, $season]
    );
    $competitionCount = api_count(
        $db,
        "SELECT COUNT(DISTINCT CONCAT(c.competition_master_id,':',COALESCE(c.division_value,'ALL'))) total FROM gw_fixtures f JOIN gw_competitions c ON c.gw_competition_row_id=f.competition_id WHERE f.game_world_id=? AND f.imc_season=? AND c.competition_master_id IS NOT NULL",
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
            'storage_family' => api_world_family($world),
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
                'technical_competition_row_count' => $technicalCompetitionCount,
            ],
            'datasets' => api_dataset_counts($db, $world, $season),
        ],
        'generated_at' => gmdate('c'),
    ]);
}


function api_managers(string $world): never {
    $snapshotPath = __DIR__.'/manager-assignments.json';
    $snapshotRaw = is_file($snapshotPath) ? file_get_contents($snapshotPath) : false;
    $snapshot = $snapshotRaw === false ? null : json_decode($snapshotRaw, true);
    if (!is_array($snapshot) || !isset($snapshot['assignments']) || !is_array($snapshot['assignments'])) {
        api_error('Assegnazioni manager temporaneamente non disponibili.', 503, 'MANAGER_ASSIGNMENTS_UNAVAILABLE');
    }

    $worldAssignments = array_values(array_filter(
        $snapshot['assignments'],
        static fn(mixed $row): bool =>
            is_array($row)
            && ($row['game_world_id'] ?? null) === $world
            && ($row['end_date'] ?? null) === null
    ));

    $core = api_database('Sql1956795_1');
    $managerRows = api_all(
        $core,
        'SELECT manager_id,full_name,sm_manager_id,NULL AS sm_username FROM `IMC Manager Codex Global` ORDER BY full_name,manager_id'
    );
    $managerIndex = [];
    foreach ($managerRows as $managerRow) {
        $managerIndex[(string)$managerRow['manager_id']] = $managerRow;
    }

    $grouped = [];
    foreach ($worldAssignments as $assignmentRow) {
        $managerId = (string)($assignmentRow['manager_id'] ?? '');
        if ($managerId === '' || !isset($managerIndex[$managerId])) continue;
        if (!isset($grouped[$managerId])) {
            $managerRow = $managerIndex[$managerId];
            $grouped[$managerId] = [
                'manager' => [
                    'manager_id' => $managerId,
                    'full_name' => $managerRow['full_name'],
                    'sm_manager_id' => api_nullable_int($managerRow['sm_manager_id']),
                    'sm_username' => $managerRow['sm_username'],
                ],
                'club' => null,
                'national_team' => null,
                'assignments' => [],
            ];
        }

        $assignment = [
            'assignment_id' => api_nullable_int($assignmentRow['assignment_id'] ?? null),
            'type' => $assignmentRow['assignment_type'] ?? null,
            'start_date' => $assignmentRow['start_date'] ?? null,
            'end_date' => $assignmentRow['end_date'] ?? null,
            'season_id' => api_nullable_int($assignmentRow['season_id'] ?? null),
            'active' => ($assignmentRow['end_date'] ?? null) === null,
        ];
        $grouped[$managerId]['assignments'][] = $assignment;

        if (($assignmentRow['assignment_type'] ?? null) === 'club') {
            $grouped[$managerId]['club'] = [
                'team_id' => api_nullable_int($assignmentRow['team_id'] ?? null),
                'name' => $assignmentRow['team_name'] ?? null,
                'full_name' => $assignmentRow['team_full_name'] ?? null,
                'sm_club_id' => api_nullable_int($assignmentRow['sm_club_id'] ?? null),
                'sm_world_club_id' => api_nullable_int($assignmentRow['sm_world_club_id'] ?? null),
            ];
            $grouped[$managerId]['assignment'] = $assignment;
        } elseif (($assignmentRow['assignment_type'] ?? null) === 'national_team') {
            $grouped[$managerId]['national_team'] = [
                'nation_id' => api_nullable_int($assignmentRow['nation_id'] ?? null),
                'name' => $assignmentRow['nation_name'] ?? null,
            ];
            if (!isset($grouped[$managerId]['assignment'])) {
                $grouped[$managerId]['assignment'] = $assignment;
            }
        }
    }

    $data = array_values($grouped);
    usort($data, static fn(array $left, array $right): int =>
        strcasecmp((string)$left['manager']['full_name'], (string)$right['manager']['full_name'])
    );

    $local = api_database(api_world_database($world));
    $externalRows = api_all(
        $local,
        "SELECT u.sm_manager_id,u.sm_username,u.image_src,u.last_online,u.manager_image_src,u.manager_reputation,u.manager_unknown_flag,".
        "a.manager_assignment_id,a.entity_type,a.world_club_id,a.imc_season,a.soccer_manager_season,a.sm_season_id,a.valid_from,a.valid_to,a.is_current,".
        "w.world_club_row_id,w.club_id,w.master_club_id,w.club_name,w.club_country_code,w.club_division,w.club_logo_src,w.current_club_flag,w.managed_flag ".
        "FROM gw_sm_user_assignments a ".
        "JOIN (SELECT sm_manager_id,MAX(sm_user_row_id) AS sm_user_row_id FROM gw_sm_users GROUP BY sm_manager_id) latest ON latest.sm_manager_id=a.sm_manager_id ".
        "JOIN gw_sm_users u ON u.sm_user_row_id=latest.sm_user_row_id ".
        "LEFT JOIN gw_world_clubs w ON w.game_world_id=a.game_world_id AND w.world_club_id=a.world_club_id ".
        "WHERE a.game_world_id=? AND a.is_current=1 AND a.entity_type='CLUB' AND u.manager_unknown_flag=1 ORDER BY u.sm_username,u.sm_manager_id",
        [$world]
    );
    $externalData = array_map(static fn(array $row): array => [
        'manager' => [
            'sm_manager_id' => api_nullable_int($row['sm_manager_id']),
            'sm_username' => $row['sm_username'],
            'image_src' => $row['manager_image_src'] ?: $row['image_src'],
            'last_online' => $row['last_online'],
            'reputation' => api_nullable_int($row['manager_reputation']),
            'unknown' => (bool)$row['manager_unknown_flag'],
        ],
        'assignment' => [
            'manager_assignment_id' => api_nullable_int($row['manager_assignment_id']),
            'entity_type' => $row['entity_type'],
            'world_club_id' => api_nullable_int($row['world_club_id']),
            'imc_season' => api_nullable_int($row['imc_season']),
            'soccer_manager_season' => api_nullable_int($row['soccer_manager_season']),
            'sm_season_id' => api_nullable_int($row['sm_season_id']),
            'valid_from' => $row['valid_from'],
            'valid_to' => $row['valid_to'],
            'active' => (bool)$row['is_current'],
        ],
        'club' => $row['world_club_id'] === null ? null : [
            'world_club_row_id' => api_nullable_int($row['world_club_row_id']),
            'world_club_id' => api_nullable_int($row['world_club_id']),
            'club_id' => api_nullable_int($row['club_id']),
            'master_club_id' => api_nullable_int($row['master_club_id']),
            'name' => $row['club_name'],
            'country_code' => $row['club_country_code'],
            'division' => $row['club_division'],
            'logo_src' => $row['club_logo_src'],
            'current' => $row['current_club_flag'] === null ? null : (bool)$row['current_club_flag'],
            'managed' => $row['managed_flag'] === null ? null : (bool)$row['managed_flag'],
        ],
    ], $externalRows);

    api_response([
        'ok' => true,
        'data' => $data,
        'external_data' => $externalData,
        'pagination' => ['total' => count($data), 'limit' => count($data), 'offset' => 0, 'returned' => count($data)],
        'context' => [
            'game_world_id' => $world,
            'active_only' => true,
            'assignment_types' => ['club', 'national_team'],
            'assignment_source' => $snapshot['source'] ?? 'SUPABASE_ASSIGNMENTS_CERTIFIED',
            'manager_identity_source' => 'MYSQL_CORE_IMC',
            'external_manager_source' => 'MYSQL_LOCAL.gw_sm_users+gw_sm_user_assignments+gw_world_clubs',
            'external_total' => count($externalData),
            'snapshot_generated_at' => $snapshot['generated_at'] ?? null,
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function api_clubs(string $world): never {
    $core = api_database('Sql1956795_1');
    $rows = api_all(
        $core,
        "SELECT m.club_id,m.game_world_id,m.club_gw_id,c.name,c.short_name,c.image_url ".
        "FROM clubs_game_world_id m ".
        "JOIN clubs c ON c.club_id=m.club_id ".
        "WHERE m.game_world_id=? ORDER BY c.name,m.club_id",
        [$world]
    );
    $local = api_database(api_world_database($world));
    $localRows = api_all(
        $local,
        'SELECT world_club_row_id,world_club_id,club_id,master_club_id,club_name,club_country_code,club_division,club_balance,club_friends_count,current_club_flag,managed_flag FROM gw_world_clubs WHERE game_world_id=?',
        [$world]
    );
    $localIndex = [];
    foreach ($localRows as $localRow) $localIndex[(string)$localRow['world_club_id']] = $localRow;
    $data = array_map(static function(array $row) use ($localIndex): array {
      $localRow = $localIndex[(string)$row['club_gw_id']] ?? [];
      return [
        'club_id' => (int)$row['club_id'],
        'game_world_id' => $row['game_world_id'],
        'club_gw_id' => (int)$row['club_gw_id'],
        'name' => $row['name'],
        'short_name' => $row['short_name'],
        'image_url' => '/nexus/assets/clubs/'.(int)$row['club_id'].'.png',
        'local' => [
            'world_club_row_id' => api_nullable_int($localRow['world_club_row_id'] ?? null),
            'world_club_id' => api_nullable_int($localRow['world_club_id'] ?? $row['club_gw_id']),
            'master_club_id' => api_nullable_int($localRow['master_club_id'] ?? null),
            'club_name' => $localRow['club_name'] ?? null,
            'country_code' => $localRow['club_country_code'] ?? null,
            'division' => $localRow['club_division'] ?? null,
            'balance' => isset($localRow['club_balance']) ? (float)$localRow['club_balance'] : null,
            'friends_count' => api_nullable_int($localRow['club_friends_count'] ?? null),
            'current' => isset($localRow['current_club_flag']) ? (bool)$localRow['current_club_flag'] : null,
            'managed' => isset($localRow['managed_flag']) ? (bool)$localRow['managed_flag'] : null,
        ],
      ];
    }, $rows);
    api_response([
        'ok' => true,
        'data' => $data,
        'pagination' => ['total' => count($data), 'limit' => count($data), 'offset' => 0, 'returned' => count($data)],
        'context' => ['game_world_id' => $world, 'source' => 'MYSQL_CORE.clubs_game_world_id'],
        'generated_at' => gmdate('c'),
    ]);
}

function api_nations(string $world): never {
    $core = api_database('Sql1956795_1');
    $rows = api_all(
        $core,
        'SELECT nation_id,game_world_id,nation_gw_id FROM nations_game_world_id WHERE game_world_id=? ORDER BY nation_id',
        [$world]
    );

    $identityPath = __DIR__.'/nation-identities.json';
    $identityRaw = is_file($identityPath) ? file_get_contents($identityPath) : false;
    $identityPayload = $identityRaw === false ? null : json_decode($identityRaw, true);
    $identityIndex = [];
    foreach (($identityPayload['nations'] ?? []) as $identity) {
        if (!is_array($identity) || !isset($identity['nation_id'])) continue;
        $identityIndex[(string)$identity['nation_id']] = $identity;
    }

    $data = array_map(static function (array $row) use ($identityIndex): array {
        $nationId = (int)$row['nation_id'];
        $identity = $identityIndex[(string)$nationId] ?? [];
        return [
            'nation_id' => $nationId,
            'game_world_id' => $row['game_world_id'],
            'nation_gw_id' => (int)$row['nation_gw_id'],
            'name' => $identity['name'] ?? null,
            'image_url' => $identity['image_path'] ?? null,
        ];
    }, $rows);

    usort($data, static fn(array $left, array $right): int =>
        strcasecmp((string)($left['name'] ?? ''), (string)($right['name'] ?? ''))
    );
    api_response([
        'ok' => true,
        'data' => $data,
        'pagination' => ['total' => count($data), 'limit' => count($data), 'offset' => 0, 'returned' => count($data)],
        'context' => [
            'game_world_id' => $world,
            'mapping_source' => 'MYSQL_CORE.nations_game_world_id',
            'identity_source' => $identityPayload['source'] ?? 'SUPABASE_IMC_NATIONAL_TEAMS',
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function api_competitions(string $world): never {
    $core = api_core_context($world);
    $season = api_season($_GET['season'] ?? null, (int)($core['imc_season'] ?? 1));
    $group = strtolower(trim((string)($_GET['group'] ?? '')));
    if ($group !== '' && !in_array($group, ['domestic', 'international', 'nations'], true)) {
        api_error('Parametro group non valido.', 422, 'INVALID_COMPETITION_GROUP');
    }

    $db = api_database(api_world_database($world));
    $sql = "SELECT c.competition_master_id,m.competition_code,m.display_name,m.competition_group,m.competition_family,m.hierarchy_path,".
        "c.competition_type,c.division_value,c.country_code,MIN(f.date) start_date,MAX(f.date) end_date,".
        "GROUP_CONCAT(DISTINCT c.gw_competition_row_id ORDER BY c.gw_competition_row_id) local_row_ids,".
        "COUNT(DISTINCT f.fixture_id) fixture_count,".
        "COUNT(DISTINCT fr.fixture_id) result_count,".
        "COUNT(DISTINCT CASE WHEN f.status='scheduled' THEN f.fixture_id END) schedule_count,".
        "COUNT(DISTINCT mr.fixture_id) report_count ".
        "FROM gw_competitions c ".
        "JOIN Sql1956795_1.imc_competition_master m ON m.competition_master_id=c.competition_master_id ".
        "JOIN gw_fixtures f ON f.game_world_id=c.game_world_id AND f.competition_id=c.gw_competition_row_id ".
        "LEFT JOIN gw_fixture_results fr ON fr.game_world_id=f.game_world_id AND fr.fixture_id=f.fixture_id ".
        "LEFT JOIN gw_match_reports mr ON mr.game_world_id=f.game_world_id AND mr.fixture_id=f.fixture_id ".
        "WHERE c.game_world_id=? AND f.imc_season=? ".
        ($group !== '' ? "AND LOWER(m.competition_group)=? " : "").
        "GROUP BY c.competition_master_id,m.competition_code,m.display_name,m.competition_group,m.competition_family,m.hierarchy_path,c.competition_type,c.division_value,c.country_code ".
        "ORDER BY FIELD(m.competition_group,'DOMESTIC','INTERNATIONAL','NATIONS'),c.country_code,m.competition_master_id,c.division_value";

    $params = $group !== '' ? [$world, $season, $group] : [$world, $season];
    $rows = api_all($db, $sql, $params);
    $data = array_map(static function (array $row) use ($season): array {
        $division = api_nullable_int($row['division_value']);
        $masterId = (int)$row['competition_master_id'];
        $countryCode = trim((string)($row['country_code'] ?? '')) ?: null;
        return [
            'competition_key' => $masterId.':'.($countryCode ?? 'GLOBAL').':'.($division ?? 'ALL'),
            'competition_master_id' => $masterId,
            'competition_code' => $row['competition_code'],
            'name' => $row['display_name'].($row['competition_code'] === 'LEAGUE' && $division !== null ? ' Division '.$division : ''),
            'competition_group' => strtolower((string)$row['competition_group']),
            'competition_family' => strtolower((string)$row['competition_family']),
            'type' => $row['competition_type'],
            'division_value' => $division,
            'country_code' => $countryCode,
            'imc_season' => $season,
            'hierarchy_path' => $row['hierarchy_path'],
            'local_competition_row_ids' => array_map('intval', array_filter(explode(',', (string)$row['local_row_ids']))),
            'counts' => [
                'fixtures' => (int)$row['fixture_count'],
                'results' => (int)$row['result_count'],
                'schedule' => (int)$row['schedule_count'],
                'reports' => (int)$row['report_count'],
            ],
            'dates' => ['start' => $row['start_date'], 'end' => $row['end_date']],
            'availability' => [
                'overview' => true,
                'matches' => true,
                'standings' => $row['competition_code'] === 'LEAGUE',
                'structure' => false,
            ],
        ];
    }, $rows);

    api_response([
        'ok' => true,
        'data' => $data,
        'pagination' => ['total' => count($data), 'limit' => count($data), 'offset' => 0, 'returned' => count($data)],
        'context' => ['game_world_id' => $world, 'imc_season' => $season, 'source' => 'COMPETITION_MASTER'],
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
            'club_id' => api_nullable_int($row['home_club_id'] ?? null),
            'image_url' => api_public_asset_url($row['home_image_url'] ?? null),
        ],
        'away' => [
            'name' => $row['away_name'],
            'world_club_id' => api_nullable_int($row['away_world_club_id']),
            'club_id' => api_nullable_int($row['away_club_id'] ?? null),
            'image_url' => api_public_asset_url($row['away_image_url'] ?? null),
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
            'country_code' => $row['country_code'],
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
        "c.competition_id source_competition_id,c.competition_name stored_competition_name,c.competition_type,c.competition_master_id,c.competition_group,c.master_competition_id,c.division_value,c.country_code,src.report_type fixture_source,".
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
    $db = api_database(api_world_database($world));

    $total = api_count(
        $db,
        'SELECT COUNT(DISTINCT fixture_id) total FROM gw_fixtures WHERE game_world_id=? AND imc_season=?',
        [$world, $season]
    );
    $sql = api_match_select().
        'WHERE f.game_world_id=? AND f.imc_season=? '.
        'ORDER BY f.date IS NULL,f.date,f.time IS NULL,f.time,f.fixture_id LIMIT ? OFFSET ?';
    $rows = api_all($db, $sql, [$world, $season, $limit, $offset]);
    $rows = api_enrich_match_clubs($world, $rows);

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
            'storage_family' => api_world_family($world),
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function api_match_detail(string $world, int $fixtureId): never {
    $db = api_database(api_world_database($world));
    $row = api_one(
        $db,
        api_match_select().'WHERE f.game_world_id=? AND f.fixture_id=? LIMIT 1',
        [$world, $fixtureId]
    );
    if (!$row) api_error('Fixture non trovata.', 404, 'FIXTURE_NOT_FOUND');
    $row = api_enrich_match_clubs($world, [$row])[0];

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


function api_transfer_row(array $row): array {
    return [
        'transfer_number' => (int)$row['transfer_row_id'],
        'transfer_row_id' => (int)$row['transfer_row_id'],
        'transfer_id' => $row['transfer_id'],
        'game_world_id' => $row['game_world_id'],
        'sm_game_world_id' => api_nullable_int($row['sm_game_world_id']),
        'imc_season' => api_nullable_int($row['imc_season']),
        'soccer_manager_season' => api_nullable_int($row['soccer_manager_season']),
        'sm_season_id' => api_nullable_int($row['sm_season_id']),
        'record_rank' => api_nullable_int($row['record_rank']),
        'date' => $row['date'],
        'player_id' => api_nullable_int($row['player_id']),
        'from_club' => [
            'world_club_id' => api_nullable_int($row['from_world_club_id']),
            'club_id' => api_nullable_int($row['from_club_id'] ?? null),
            'name' => $row['from_club_name'],
            'image_url' => api_public_asset_url($row['from_image_url'] ?? null),
        ],
        'to_club' => [
            'world_club_id' => api_nullable_int($row['to_world_club_id']),
            'club_id' => api_nullable_int($row['to_club_id'] ?? null),
            'name' => $row['to_club_name'],
            'image_url' => api_public_asset_url($row['to_image_url'] ?? null),
        ],
        'direction' => $row['direction'],
        'cost' => [
            'numeric' => api_nullable_float($row['cost_numeric']),
            'raw' => $row['cost_raw'],
            'currency' => $row['currency'],
        ],
        'player_value_at_event' => api_nullable_float($row['player_value_at_event']),
        'status' => $row['status'],
        'created_at' => $row['created_at'],
    ];
}

function api_transfers(string $world): never {
    $db = api_database(api_world_database($world));
    $limit = api_positive_int($_GET['limit'] ?? null, 100, IMC_DATA_API_MAX_LIMIT);
    $limit = max(1, $limit);
    $offset = api_positive_int($_GET['offset'] ?? null, 0, PHP_INT_MAX);
    $total = api_count($db, 'SELECT COUNT(*) total FROM gw_transfers WHERE game_world_id=?', [$world]);
    $rows = api_all(
        $db,
        'SELECT transfer_row_id,transfer_id,game_world_id,sm_game_world_id,imc_season,soccer_manager_season,sm_season_id,record_rank,date,player_id,from_world_club_id,from_club_name,to_world_club_id,to_club_name,direction,cost_numeric,cost_raw,currency,player_value_at_event,status,created_at FROM gw_transfers WHERE game_world_id=? ORDER BY transfer_row_id DESC LIMIT ? OFFSET ?',
        [$world, $limit, $offset]
    );
    $rows = api_enrich_transfer_clubs($world, $rows);
    api_response([
        'ok' => true,
        'data' => array_map('api_transfer_row', $rows),
        'pagination' => [
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'returned' => count($rows),
            'order' => 'transfer_row_id_desc',
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function api_transfer_detail(string $world, int $transferRowId): never {
    $db = api_database(api_world_database($world));
    $row = api_one(
        $db,
        'SELECT transfer_row_id,transfer_id,game_world_id,sm_game_world_id,imc_season,soccer_manager_season,sm_season_id,record_rank,date,player_id,from_world_club_id,from_club_name,to_world_club_id,to_club_name,direction,cost_numeric,cost_raw,currency,player_value_at_event,status,created_at FROM gw_transfers WHERE game_world_id=? AND transfer_row_id=? LIMIT 1',
        [$world, $transferRowId]
    );
    if (!$row) api_error('Trasferimento non trovato.', 404, 'TRANSFER_NOT_FOUND');
    $row = api_enrich_transfer_clubs($world, [$row])[0];
    api_response([
        'ok' => true,
        'data' => api_transfer_row($row),
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
    if (count($segments) === 3 && $segments[0] === 'worlds' && $segments[2] === 'competitions') {
        api_competitions(api_world_id($segments[1]));
    }
    if (count($segments) === 3 && $segments[0] === 'worlds' && $segments[2] === 'managers') {
        api_managers(api_world_id($segments[1]));
    }
    if (count($segments) === 3 && $segments[0] === 'worlds' && $segments[2] === 'clubs') {
        api_clubs(api_world_id($segments[1]));
    }
    if (count($segments) === 3 && $segments[0] === 'worlds' && $segments[2] === 'nations') {
        api_nations(api_world_id($segments[1]));
    }
    if (count($segments) === 3 && $segments[0] === 'worlds' && $segments[2] === 'transfers') {
        api_transfers(api_world_id($segments[1]));
    }
    if (count($segments) === 4 && $segments[0] === 'worlds' && $segments[2] === 'transfers') {
        api_transfer_detail(api_world_id($segments[1]), api_fixture_id($segments[3]));
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
