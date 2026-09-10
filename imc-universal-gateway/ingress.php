<?php
declare(strict_types=1);

/* IMC Universal Gateway · ingress-only path
 * Technical boundary only: envelope, target namespace, transport/persistence.
 * Payload row fields are intentionally opaque to the Gateway.
 */

function imc_ingress_out(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function imc_ingress_cfg(): array {
    $file = dirname(__DIR__) . '/__imc_private_gateway/config.php';
    if (!is_file($file)) throw new RuntimeException('gateway_configuration_not_found');
    $cfg = require $file;
    if (!is_array($cfg) || !isset($cfg['db'])) throw new RuntimeException('gateway_configuration_invalid');
    return $cfg;
}

function imc_ingress_ident(string $value): string {
    if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]{0,63}$/', $value)) {
        throw new InvalidArgumentException('invalid_identifier');
    }
    return '`' . $value . '`';
}

function imc_ingress_table_ident(string $value, string $gw): string {
    if (!preg_match('/^GW00[1-9]_IMC [A-Za-z0-9 _-]{1,80}$/', $value) || !str_starts_with($value, $gw . '_IMC ')) {
        throw new InvalidArgumentException('target_not_allowed');
    }
    return '`' . str_replace('`', '', $value) . '`';
}

function imc_ingress_route(array $body, array $cfg): array {
    $gw = strtoupper(trim((string)($body['game_world_id'] ?? '')));
    $database = trim((string)($body['target_database'] ?? ''));
    $table = trim((string)($body['target_table'] ?? ''));
    if (!preg_match('/^GW00[1-9]$/', $gw)) throw new InvalidArgumentException('invalid_game_world');

    $gold = array_map('strtoupper', (array)($cfg['gold_worlds'] ?? []));
    $custom = array_map('strtoupper', (array)($cfg['custom_worlds'] ?? []));
    if (in_array($gw, $gold, true)) $expected = (string)($cfg['db']['gold'] ?? '');
    elseif (in_array($gw, $custom, true)) $expected = (string)($cfg['db']['custom'] ?? '');
    else throw new InvalidArgumentException('unsupported_game_world');

    if ($database === '' || !hash_equals($expected, $database)) throw new InvalidArgumentException('target_not_allowed');
    imc_ingress_table_ident($table, $gw);
    return ['game_world_id' => $gw, 'database' => $database, 'table' => $table];
}

function imc_ingress_db(array $cfg, string $database): PDO {
    return new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['db']['host'], $cfg['db']['port'], $database),
        $cfg['db']['user'],
        $cfg['db']['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
}

function imc_ingress_scalar(mixed $value): mixed {
    if (is_array($value) || is_object($value)) {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    }
    if (is_bool($value)) return $value ? 1 : 0;
    return $value;
}

function imc_ingress_where(array $where, array &$values): string {
    if (!$where) return '';
    $parts = [];
    foreach ($where as $key => $value) {
        $column = imc_ingress_ident((string)$key);
        if ($value === null) $parts[] = $column . ' IS NULL';
        else { $parts[] = $column . ' = ?'; $values[] = imc_ingress_scalar($value); }
    }
    return ' WHERE ' . implode(' AND ', $parts);
}

function imc_ingress_insert_many(PDO $pdo, string $table, string $gw, array $rows, bool $atomic): array {
    if (!$rows || count($rows) > 500) throw new InvalidArgumentException('invalid_batch');
    $tableSql = imc_ingress_table_ident($table, $gw);
    $written = 0;
    if ($atomic) $pdo->beginTransaction();
    try {
        foreach ($rows as $row) {
            if (!is_array($row) || !$row) throw new InvalidArgumentException('invalid_row');
            $columns = array_keys($row);
            foreach ($columns as $column) imc_ingress_ident((string)$column);
            $columnSql = implode(',', array_map(fn($c) => imc_ingress_ident((string)$c), $columns));
            $placeholders = implode(',', array_fill(0, count($columns), '?'));
            $stmt = $pdo->prepare("INSERT INTO {$tableSql} ({$columnSql}) VALUES ({$placeholders})");
            $stmt->execute(array_map('imc_ingress_scalar', array_values($row)));
            $written += $stmt->rowCount();
        }
        if ($atomic) $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
    return ['received' => count($rows), 'inserted' => $written, 'written_rows' => $written, 'skipped_rows' => 0, 'failed' => 0, 'rolled_back' => false, 'errors' => []];
}

function imc_ingress_read(PDO $pdo, string $table, string $gw, array $body): array {
    $values = [];
    $tableSql = imc_ingress_table_ident($table, $gw);
    $sql = 'SELECT * FROM ' . $tableSql . imc_ingress_where(is_array($body['where'] ?? null) ? $body['where'] : [], $values);
    if (!empty($body['order_by'])) {
        $direction = strtoupper((string)($body['order'] ?? 'ASC'));
        if (!in_array($direction, ['ASC', 'DESC'], true)) throw new InvalidArgumentException('invalid_order');
        $sql .= ' ORDER BY ' . imc_ingress_ident((string)$body['order_by']) . ' ' . $direction;
    }
    $limit = max(1, min(100000, (int)($body['limit'] ?? 100)));
    $offset = max(0, (int)($body['offset'] ?? 0));
    $sql .= ' LIMIT ' . ($limit + 1) . ' OFFSET ' . $offset;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    $rows = $stmt->fetchAll();
    $hasMore = count($rows) > $limit;
    if ($hasMore) array_pop($rows);
    return ['rows' => $rows, 'row_count' => count($rows), 'returned_rows' => count($rows), 'limit' => $limit, 'offset' => $offset, 'has_more' => $hasMore, 'next_offset' => $hasMore ? $offset + count($rows) : null];
}

function imc_ingress_run(array $body): never {
    try {
        $channel = strtoupper(trim((string)($body['channel'] ?? ($_SERVER['HTTP_X_IMC_CHANNEL'] ?? ''))));
        $action = strtolower(trim((string)($body['action'] ?? '')));
        if ($channel !== 'IMPORT') throw new InvalidArgumentException('invalid_channel');
        if (!in_array($action, ['read', 'insert_many'], true)) throw new InvalidArgumentException('action_not_allowed');
        if (strtolower(trim((string)($body['route_mode'] ?? ''))) !== 'explicit') throw new InvalidArgumentException('explicit_route_required');

        $cfg = imc_ingress_cfg();
        $route = imc_ingress_route($body, $cfg);
        $pdo = imc_ingress_db($cfg, $route['database']);
        $base = ['ok' => true, 'service' => 'IMC Universal Gateway', 'mode' => 'INGRESS_ONLY', 'action' => $action, 'channel' => 'IMPORT', 'game_world_id' => $route['game_world_id'], 'database' => $route['database'], 'table' => $route['table'], 'trace_id' => $body['trace_id'] ?? null];

        if ($action === 'read') imc_ingress_out($base + imc_ingress_read($pdo, $route['table'], $route['game_world_id'], $body));
        $rows = $body['rows'] ?? $body['items'] ?? null;
        if (!is_array($rows)) throw new InvalidArgumentException('rows_required');
        imc_ingress_out($base + imc_ingress_insert_many($pdo, $route['table'], $route['game_world_id'], $rows, ($body['atomic'] ?? true) !== false));
    } catch (Throwable $e) {
        $status = $e instanceof InvalidArgumentException ? 422 : 500;
        imc_ingress_out(['ok' => false, 'mode' => 'INGRESS_ONLY', 'error' => $e->getMessage()], $status);
    }
}
