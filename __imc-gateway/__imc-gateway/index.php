<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://it.soccermanager.com');
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Universal-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function out(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function import_error(
    string $error,
    int $status,
    string $gameWorldId = '',
    string $database = '',
    string $table = '',
    int $receivedRows = 0,
    array $details = []
): never {
    out([
        'ok' => false,
        'game_world_id' => $gameWorldId,
        'database' => $database,
        'table' => $table,
        'received_rows' => $receivedRows,
        'written_rows' => 0,
        'skipped_rows' => $receivedRows,
        'errors' => array_merge([$error], $details),
    ], $status);
}

function mysql_database_for_world(array $cfg, string $gameWorldId): string
{
    if (in_array($gameWorldId, ['GW002', 'GW003', 'GW007', 'GW008'], true)) {
        return (string)($cfg['db']['gold'] ?? '');
    }

    if (in_array($gameWorldId, ['GW001', 'GW004', 'GW005', 'GW006', 'GW009'], true)) {
        return (string)($cfg['db']['custom'] ?? '');
    }

    return '';
}

function repository_spec(string $repository): ?array
{
    if ($repository === 'IMC Results') {
        return [
            'table_suffix' => 'IMC Results',
            'columns' => [
                'game_world_id' => 'varchar(16)',
                'sm_fixture_id' => 'bigint unsigned',
                'competition_key' => 'varchar(255)',
                'sm_action' => 'varchar(64)',
                'sm_country' => 'varchar(128)',
                'sm_division' => 'varchar(128)',
                'competition_group' => 'varchar(64)',
                'competition_group_name' => 'varchar(128)',
                'competition_stage' => 'varchar(128)',
                'competition_round' => 'varchar(128)',
                'match_date' => 'date',
                'home_sm_club_id' => 'bigint unsigned',
                'home_name' => 'varchar(255)',
                'away_sm_club_id' => 'bigint unsigned',
                'away_name' => 'varchar(255)',
                'home_sm_manager_id' => 'bigint unsigned',
                'away_sm_manager_id' => 'bigint unsigned',
                'home_score' => 'int unsigned',
                'away_score' => 'int unsigned',
                'penalty_home_score' => 'int unsigned',
                'penalty_away_score' => 'int unsigned',
                'aggregate_home_score' => 'int unsigned',
                'aggregate_away_score' => 'int unsigned',
                'result_status' => 'varchar(64)',
                'fingerprint' => 'char(64)',
                'imported_at' => 'datetime',
            ],
        ];
    }

    if ($repository === 'IMC SM Player Stats') {
        return [
            'table_suffix' => 'IMC SM Player Stats',
            'columns' => [
                'game_world_id' => 'varchar(16)',
                'competition_key' => 'varchar(255)',
                'sm_player_id' => 'int unsigned',
                'player_name' => 'varchar(255)',
                'sm_club_id' => 'int unsigned',
                'club_name' => 'varchar(255)',
                'appearances' => 'int unsigned',
                'goals' => 'int unsigned',
                'avg_rating' => 'decimal(5,2)',
                'assists' => 'int unsigned',
                'mom' => 'int unsigned',
                'yellow_cards' => 'int unsigned',
                'red_cards' => 'int unsigned',
                'imported_at' => 'datetime',
            ],
        ];
    }

    return null;
}

function normalize_mysql_type(string $type): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', $type) ?? $type));
}

$cfg = require __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    out(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

if (($cfg['token'] ?? '') === '') {
    out(['ok' => false, 'error' => 'gateway_token_not_configured'], 500);
}

$token = (string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] ?? '');
if (!hash_equals((string)$cfg['token'], $token)) {
    out(['ok' => false, 'error' => 'unauthorized'], 401);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
    import_error('invalid_json', 400);
}

$action = $body['action'] ?? 'insert_many';

if ($action === 'health') {
    out([
        'ok' => true,
        'service' => 'IMC Universal Gateway',
        'version' => $cfg['version'] ?? null,
        'repositories' => ['IMC Results', 'IMC SM Player Stats'],
        'worlds' => ['GW001', 'GW002', 'GW003', 'GW004', 'GW005', 'GW006', 'GW007', 'GW008', 'GW009'],
    ]);
}

$gameWorldId = $body['game_world_id'] ?? null;
$repository = $body['repository'] ?? null;
$rows = $body['rows'] ?? null;

if (!is_string($gameWorldId) || $gameWorldId === '') {
    import_error('game_world_id_required', 422);
}

if (!preg_match('/^GW00[1-9]$/', $gameWorldId)) {
    import_error('unsupported_game_world', 422, $gameWorldId);
}

$database = mysql_database_for_world($cfg, $gameWorldId);
if ($database === '') {
    import_error('unsupported_game_world', 422, $gameWorldId);
}

if (!is_string($repository)) {
    import_error('repository_required', 422, $gameWorldId, $database);
}

$spec = repository_spec($repository);
if ($spec === null) {
    import_error('repository_not_authorized', 422, $gameWorldId, $database);
}

$table = $gameWorldId . '_' . $spec['table_suffix'];

if ($action === 'probe') {
    try {
        $pdo = imc_db($cfg, $gameWorldId);
        $stmt = $pdo->query('SELECT 1 AS ok');
        $probe = $stmt->fetch();
        out([
            'ok' => (int)($probe['ok'] ?? 0) === 1,
            'game_world_id' => $gameWorldId,
            'database' => $database,
            'table' => $table,
            'received_rows' => 0,
            'written_rows' => 0,
            'skipped_rows' => 0,
            'errors' => [],
        ]);
    } catch (Throwable $e) {
        import_error('database_connection_failed', 500, $gameWorldId, $database, $table, 0, [$e->getMessage()]);
    }
}

if ($action !== 'insert_many') {
    import_error('unknown_action', 422, $gameWorldId, $database, $table, is_array($rows) ? count($rows) : 0);
}

if (!is_array($rows) || $rows === []) {
    import_error('rows_required', 422, $gameWorldId, $database, $table);
}

$receivedRows = count($rows);
$whitelist = $spec['columns'];
$expectedColumnNames = array_keys($whitelist);

foreach ($rows as $rowIndex => $row) {
    if (!is_array($row) || $row === []) {
        import_error('invalid_row', 422, $gameWorldId, $database, $table, $receivedRows, ['row_index:' . $rowIndex]);
    }

    foreach ($row as $column => $_value) {
        if (!is_string($column) || !array_key_exists($column, $whitelist)) {
            import_error('unknown_field', 422, $gameWorldId, $database, $table, $receivedRows, ['row_index:' . $rowIndex, 'field:' . (string)$column]);
        }
    }

    $rowColumns = array_keys($row);
    $missingColumns = array_values(array_diff($expectedColumnNames, $rowColumns));
    if ($missingColumns !== []) {
        import_error('payload_structure_mismatch', 422, $gameWorldId, $database, $table, $receivedRows, array_map(static fn(string $column): string => 'missing_field:' . $column, $missingColumns));
    }

    if (($row['game_world_id'] ?? null) !== $gameWorldId) {
        import_error('game_world_id_mismatch', 422, $gameWorldId, $database, $table, $receivedRows, ['row_index:' . $rowIndex]);
    }
}

try {
    $pdo = imc_db($cfg, $gameWorldId);
} catch (Throwable $e) {
    import_error('database_connection_failed', 500, $gameWorldId, $database, $table, $receivedRows, [$e->getMessage()]);
}

try {
    $columnStmt = $pdo->query("SHOW COLUMNS FROM `{$table}`");
    $mysqlColumns = [];
    foreach ($columnStmt->fetchAll() as $columnRow) {
        $field = (string)($columnRow['Field'] ?? '');
        if ($field !== '') {
            $mysqlColumns[$field] = normalize_mysql_type((string)($columnRow['Type'] ?? ''));
        }
    }

    foreach ($whitelist as $column => $expectedType) {
        if (!array_key_exists($column, $mysqlColumns)) {
            import_error('mysql_structure_mismatch', 422, $gameWorldId, $database, $table, $receivedRows, ['missing_mysql_column:' . $column]);
        }

        if ($mysqlColumns[$column] !== normalize_mysql_type($expectedType)) {
            import_error('mysql_type_mismatch', 422, $gameWorldId, $database, $table, $receivedRows, [
                'field:' . $column,
                'expected:' . $expectedType,
                'actual:' . $mysqlColumns[$column],
            ]);
        }
    }

    $columnList = '`' . implode('`,`', $expectedColumnNames) . '`';
    $placeholders = implode(',', array_fill(0, count($expectedColumnNames), '?'));
    $insert = $pdo->prepare("INSERT INTO `{$table}` ({$columnList}) VALUES ({$placeholders})");

    $pdo->beginTransaction();
    foreach ($rows as $row) {
        $values = [];
        foreach ($expectedColumnNames as $column) {
            $values[] = $row[$column];
        }
        $insert->execute($values);
    }
    $pdo->commit();

    out([
        'ok' => true,
        'game_world_id' => $gameWorldId,
        'database' => $database,
        'table' => $table,
        'received_rows' => $receivedRows,
        'written_rows' => $receivedRows,
        'skipped_rows' => 0,
        'errors' => [],
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    import_error('gateway_error', 500, $gameWorldId, $database, $table, $receivedRows, [$e->getMessage()]);
}
