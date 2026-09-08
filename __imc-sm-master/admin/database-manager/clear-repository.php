<?php
declare(strict_types=1);

require dirname(__DIR__) . '/core.php';

function clear_reply(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function clear_auth(): void {
    $https = strtolower((string)($_SERVER['HTTPS'] ?? ''));
    $forwarded = strtolower(trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
    if ($https !== 'on' && $https !== '1' && $forwarded !== 'https') {
        throw new RuntimeException('HTTPS required.', 400);
    }

    $token = trim((string)($_SERVER['HTTP_X_IMC_TOKEN'] ?? ''));
    $authorization = trim((string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if ($token === '') $token = trim((string)($headers['X-IMC-Token'] ?? $headers['x-imc-token'] ?? ''));
        if ($authorization === '') $authorization = trim((string)($headers['Authorization'] ?? $headers['authorization'] ?? ''));
    }
    if ($token === '' && preg_match('/^Bearer\s+(.+)$/i', $authorization, $match)) {
        $token = trim($match[1]);
    }

    $expected = (string)(smm_config()['admin_token'] ?? '');
    $connectorKeyFile = __DIR__ . '/connector-key.php';
    $connectorKey = is_file($connectorKeyFile) ? (string)(require $connectorKeyFile) : '';
    $validAdmin = $expected !== '' && $token !== '' && hash_equals($expected, $token);
    $validConnector = $connectorKey !== '' && $token !== '' && hash_equals($connectorKey, $token);
    if (!$validAdmin && !$validConnector) {
        throw new RuntimeException('Unauthorized.', 401);
    }
}

function clear_payload(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        throw new RuntimeException('POST required.', 405);
    }
    $contentType = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($contentType !== 'application/json') {
        throw new RuntimeException('Content-Type application/json required.', 415);
    }
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || $raw === '') {
        throw new InvalidArgumentException('Empty JSON payload.');
    }
    $payload = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    if (!is_array($payload)) {
        throw new InvalidArgumentException('JSON object required.');
    }
    return $payload;
}

function clear_route(string $gameWorldId): string {
    $custom = ['GW001', 'GW004', 'GW005', 'GW006', 'GW009'];
    $gold = ['GW002', 'GW003', 'GW007', 'GW008'];
    if (in_array($gameWorldId, $custom, true)) return 'custom';
    if (in_array($gameWorldId, $gold, true)) return 'gold';
    throw new InvalidArgumentException('Unsupported game_world_id.');
}

function clear_allowed_repositories(): array {
    return [
        'results',
        'schedule',
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
        'transfers',
    ];
}

try {
    clear_auth();
    $payload = clear_payload();

    if (($payload['action'] ?? '') !== 'clear_repository') {
        throw new InvalidArgumentException('Unknown action.');
    }

    $gameWorldId = strtoupper(trim((string)($payload['game_world_id'] ?? '')));
    $repository = strtolower(trim((string)($payload['repository'] ?? '')));

    if (!preg_match('/^GW00[1-9]$/', $gameWorldId)) {
        throw new InvalidArgumentException('Invalid game_world_id.');
    }
    if (!in_array($repository, clear_allowed_repositories(), true)) {
        throw new InvalidArgumentException('Repository not enabled.');
    }

    $target = clear_route($gameWorldId);
    $registry = smm_storage_registry();
    if (!isset($registry[$target])) {
        throw new RuntimeException('Database target unavailable.', 500);
    }

    $database = (string)$registry[$target]['database'];
    $db = smm_storage_db($target);
    $table = $gameWorldId . '_' . $repository;

    $exists = $db->prepare('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema=? AND table_name=? AND table_type=\'BASE TABLE\'');
    $exists->bind_param('ss', $database, $table);
    $exists->execute();
    $row = $exists->get_result()->fetch_assoc();
    $exists->close();
    if ((int)($row['n'] ?? 0) !== 1) {
        throw new RuntimeException('Repository table not found.', 404);
    }

    $quoted = '`' . str_replace('`', '``', $table) . '`';
    $beforeResult = $db->query("SELECT COUNT(*) AS n FROM $quoted");
    $before = (int)($beforeResult->fetch_assoc()['n'] ?? 0);
    $beforeResult->free();

    $db->query("DELETE FROM $quoted");
    $affected = $db->affected_rows;

    $afterResult = $db->query("SELECT COUNT(*) AS n FROM $quoted");
    $after = (int)($afterResult->fetch_assoc()['n'] ?? 0);
    $afterResult->free();

    clear_reply([
        'ok' => true,
        'action' => 'clear_repository',
        'game_world_id' => $gameWorldId,
        'repository' => $repository,
        'target' => $target,
        'database' => $database,
        'table' => $table,
        'before_rows' => $before,
        'affected_rows' => $affected,
        'after_rows' => $after,
    ]);
} catch (Throwable $e) {
    $status = $e->getCode();
    if (!is_int($status) || $status < 400 || $status > 599) {
        $status = $e instanceof InvalidArgumentException ? 422 : 500;
    }
    clear_reply(['ok' => false, 'error' => $e->getMessage()], $status);
}

// Deploy marker: Schedule competition_key migration
