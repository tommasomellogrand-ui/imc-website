<?php
declare(strict_types=1);

/*
 * IMC Database Manager v1.0
 * HTTPS control plane for the existing IMC MySQL routing on Aruba.
 * This file contains no credentials and reuses ../core.php + private config.php.
 */

require dirname(__DIR__) . '/core.php';

const IMC_DBM_VERSION = '1.0.0';
const IMC_DBM_MAX_BODY = 524288;
const IMC_DBM_MAX_ROWS = 500;
const IMC_DBM_PLAN_TTL = 900;

function dbm_reply(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function dbm_https_auth(): void {
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
    if ($token === '' && preg_match('/^Bearer\s+(.+)$/i', $authorization, $match)) $token = trim($match[1]);
    $expected = (string)(smm_config()['admin_token'] ?? '');
    if ($expected === '' || $token === '' || !hash_equals($expected, $token)) {
        throw new RuntimeException('Unauthorized.', 401);
    }
    $allowed = smm_config()['database_manager']['allowed_ips'] ?? [];
    if (is_array($allowed) && $allowed !== []) {
        $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
        if (!in_array($ip, $allowed, true)) throw new RuntimeException('Source IP not allowed.', 403);
    }
}

function dbm_payload(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') throw new RuntimeException('POST required.', 405);
    $contentType = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($contentType !== 'application/json') throw new RuntimeException('Content-Type application/json required.', 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > IMC_DBM_MAX_BODY) throw new RuntimeException('Payload too large.', 413);
    $raw = file_get_contents('php://input', false, null, 0, IMC_DBM_MAX_BODY + 1);
    if (!is_string($raw) || $raw === '') throw new InvalidArgumentException('Empty JSON payload.');
    if (strlen($raw) > IMC_DBM_MAX_BODY) throw new RuntimeException('Payload too large.', 413);
    $payload = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($payload)) throw new InvalidArgumentException('JSON object required.');
    return $payload;
}

function dbm_storage(string $target): array {
    $registry = smm_storage_registry();
    if (!isset($registry[$target])) throw new InvalidArgumentException('Unknown database target.');
    return [$registry[$target]['database'], smm_storage_db($target)];
}

function dbm_log_dir(): string {
    $configured = smm_config()['database_manager']['log_dir'] ?? null;
    $dir = is_string($configured) && $configured !== '' ? $configured : dirname(__DIR__, 3) . '/__imc_private_sm_master/database-manager';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('Cannot create protected audit directory.');
    $deny = $dir . '/.htaccess';
    if (!is_file($deny)) file_put_contents($deny, "Options -Indexes\nRequire all denied\n", LOCK_EX);
    return $dir;
}

function dbm_audit(array $record): void {
    $record = array_merge(['timestamp' => gmdate('c'), 'remote_ip' => (string)($_SERVER['REMOTE_ADDR'] ?? '')], $record);
    $line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE) . "\n";
    if (file_put_contents(dbm_log_dir() . '/audit.jsonl', $line, FILE_APPEND | LOCK_EX) === false) throw new RuntimeException('Cannot write audit log.');
}

function dbm_canonical(array $value): string {
    $sort = static function (&$item) use (&$sort): void {
        if (!is_array($item)) return;
        foreach ($item as &$child) $sort($child);
        unset($child);
        if (!array_is_list($item)) ksort($item, SORT_STRING);
    };
    $sort($value);
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}

function dbm_secret(): string {
    $configured = smm_config()['database_manager']['signing_key'] ?? null;
    return is_string($configured) && strlen($configured) >= 32 ? $configured : (string)smm_config()['admin_token'];
}

function dbm_strip_sql(string $sql): string {
    $sql = trim($sql);
    $sql = preg_replace('/;\s*$/', '', $sql) ?? $sql;
    if ($sql === '' || strlen($sql) > 131072) throw new InvalidArgumentException('Invalid SQL statement.');
    if (str_contains($sql, "\0")) throw new InvalidArgumentException('NUL byte is not allowed.');
    return $sql;
}

function dbm_statement_kind(string $sql): string {
    if (!preg_match('/^\s*([A-Z]+)/i', $sql, $m)) throw new InvalidArgumentException('Cannot classify SQL statement.');
    return strtoupper($m[1]);
}

function dbm_assert_single_statement(string $sql): void {
    $withoutStrings = preg_replace("/'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"|`(?:``|[^`])*`/s", '', $sql) ?? $sql;
    if (str_contains($withoutStrings, ';')) throw new InvalidArgumentException('Each array item must contain exactly one SQL statement.');
}

function dbm_assert_no_cross_database(string $sql, string $database): void {
    if (preg_match_all('/`?(Sql\d+_\d+)`?\s*\./i', $sql, $matches)) {
        foreach ($matches[1] as $found) if (strcasecmp($found, $database) !== 0) throw new InvalidArgumentException('Cross-database SQL is forbidden.');
    }
}

function dbm_validate_write_sql(string $sql, string $database, bool $allowDestructive): array {
    $sql = dbm_strip_sql($sql);
    dbm_assert_single_statement($sql);
    dbm_assert_no_cross_database($sql, $database);
    if (preg_match('/\b(INTO\s+OUTFILE|INTO\s+DUMPFILE|LOAD_FILE|LOAD\s+DATA|GRANT|REVOKE|CREATE\s+USER|ALTER\s+USER|DROP\s+USER|SET\s+PASSWORD|INSTALL\s+PLUGIN|UNINSTALL\s+PLUGIN|SHUTDOWN|KILL)\b/i', $sql)) {
        throw new InvalidArgumentException('Forbidden SQL capability.');
    }
    $kind = dbm_statement_kind($sql);
    $allowed = ['CREATE', 'ALTER', 'INSERT', 'UPDATE', 'DELETE', 'RENAME'];
    if (!in_array($kind, $allowed, true)) throw new InvalidArgumentException("SQL kind $kind is not allowed for migrations.");
    $destructive = (bool)preg_match('/^\s*(DELETE\b|RENAME\b)|\b(DROP\s+(?:COLUMN|INDEX|KEY|FOREIGN\s+KEY|TABLE)|RENAME\s+(?:COLUMN|INDEX|TABLE))\b/i', $sql);
    if ($destructive && !$allowDestructive) throw new InvalidArgumentException('Destructive SQL requires allow_destructive=true.');
    if (preg_match('/^\s*(DROP\s+DATABASE|TRUNCATE)\b/i', $sql)) throw new InvalidArgumentException('DROP DATABASE and TRUNCATE are forbidden.');
    return ['sql' => $sql, 'kind' => $kind, 'destructive' => $destructive, 'sha256' => hash('sha256', $sql)];
}

function dbm_validate_read_sql(string $sql, string $database): string {
    $sql = dbm_strip_sql($sql);
    dbm_assert_single_statement($sql);
    dbm_assert_no_cross_database($sql, $database);
    $kind = dbm_statement_kind($sql);
    if (!in_array($kind, ['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN'], true)) throw new InvalidArgumentException('Read-only SQL required.');
    if (preg_match('/\b(INTO\s+OUTFILE|INTO\s+DUMPFILE|FOR\s+UPDATE|LOCK\s+IN\s+SHARE\s+MODE|SLEEP\s*\(|BENCHMARK\s*\(|LOAD_FILE\s*\()/i', $sql)) throw new InvalidArgumentException('Forbidden read expression.');
    return $sql;
}

function dbm_query(mysqli $db, string $sql, int $limit = IMC_DBM_MAX_ROWS): array {
    $started = microtime(true);
    $result = $db->query($sql);
    if ($result === true) return ['affected_rows' => $db->affected_rows, 'insert_id' => $db->insert_id, 'duration_ms' => (int)round((microtime(true) - $started) * 1000)];
    $rows = [];
    while (count($rows) < $limit && ($row = $result->fetch_assoc())) $rows[] = $row;
    $truncated = $result->num_rows > count($rows);
    $total = $result->num_rows;
    $result->free();
    return ['rows' => $rows, 'returned_rows' => count($rows), 'total_rows' => $total, 'truncated' => $truncated, 'duration_ms' => (int)round((microtime(true) - $started) * 1000)];
}

function dbm_schema(mysqli $db, string $database, bool $includeDdl): array {
    $tables = [];
    $stmt = $db->prepare("SELECT table_name,engine,table_rows,table_collation FROM information_schema.tables WHERE table_schema=? AND table_type='BASE TABLE' ORDER BY table_name");
    $stmt->bind_param('s', $database); $stmt->execute(); $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $table = (string)$row['table_name'];
        $entry = $row;
        $entry['columns'] = [];
        $column = $db->prepare("SELECT column_name,column_type,is_nullable,column_default,extra,character_set_name,collation_name FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position");
        $column->bind_param('ss', $database, $table); $column->execute(); $cr = $column->get_result();
        while ($c = $cr->fetch_assoc()) $entry['columns'][] = $c;
        $column->close();
        if ($includeDdl) {
            $escaped = str_replace('`', '``', $table);
            $ddl = $db->query("SHOW CREATE TABLE `$escaped`")->fetch_assoc();
            $entry['ddl'] = $ddl['Create Table'] ?? null;
        }
        $tables[] = $entry;
    }
    $stmt->close();
    return ['database' => $database, 'table_count' => count($tables), 'column_count' => array_sum(array_map(static fn(array $t): int => count($t['columns']), $tables)), 'tables' => $tables];
}

function dbm_plan(array $payload): array {
    $target = trim((string)($payload['target'] ?? ''));
    [$database] = dbm_storage($target);
    $migrationId = trim((string)($payload['migration_id'] ?? ''));
    if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/', $migrationId)) throw new InvalidArgumentException('Invalid migration_id.');
    $statements = $payload['statements'] ?? null;
    if (!is_array($statements) || $statements === [] || count($statements) > 50) throw new InvalidArgumentException('statements must contain 1 to 50 items.');
    $allowDestructive = ($payload['allow_destructive'] ?? false) === true;
    $validated = [];
    foreach ($statements as $sql) {
        if (!is_string($sql)) throw new InvalidArgumentException('Every statement must be a string.');
        $validated[] = dbm_validate_write_sql($sql, $database, $allowDestructive);
    }
    $plan = ['target' => $target, 'database' => $database, 'migration_id' => $migrationId, 'allow_destructive' => $allowDestructive, 'statements' => array_column($validated, 'sql')];
    $hash = hash('sha256', dbm_canonical($plan));
    $expires = time() + IMC_DBM_PLAN_TTL;
    $signature = hash_hmac('sha256', $hash . '|' . $expires, dbm_secret());
    return ['plan' => $plan, 'analysis' => $validated, 'plan_sha256' => $hash, 'expires_at' => gmdate('c', $expires), 'confirmation_token' => $expires . '.' . $signature];
}

function dbm_verify_plan(array $payload): array {
    $built = dbm_plan($payload);
    $provided = trim((string)($payload['confirmation_token'] ?? ''));
    if (!preg_match('/^(\d+)\.([a-f0-9]{64})$/', $provided, $m)) throw new InvalidArgumentException('Invalid confirmation_token.');
    $expires = (int)$m[1];
    if ($expires < time() || $expires > time() + IMC_DBM_PLAN_TTL + 60) throw new RuntimeException('Confirmation token expired or invalid.', 409);
    $expected = hash_hmac('sha256', $built['plan_sha256'] . '|' . $expires, dbm_secret());
    if (!hash_equals($expected, $m[2])) throw new RuntimeException('Plan changed after confirmation.', 409);
    return $built;
}

function dbm_history(int $limit): array {
    $path = dbm_log_dir() . '/audit.jsonl';
    if (!is_file($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $lines = array_slice($lines, -max(1, min($limit, 200)));
    $out = [];
    foreach (array_reverse($lines) as $line) {
        $row = json_decode($line, true);
        if (is_array($row)) $out[] = $row;
    }
    return $out;
}

function dbm_migration_marker(string $target, string $migrationId): string {
    return dbm_log_dir() . '/completed_' . hash('sha256', $target . '|' . $migrationId) . '.json';
}

try {
    dbm_https_auth();
    $payload = dbm_payload();
    $action = trim((string)($payload['action'] ?? 'health'));

    if ($action === 'health') {
        $databases = [];
        foreach (smm_storage_registry() as $target => $definition) {
            try {
                $db = smm_storage_db($target);
                $selected = (string)$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];
                $databases[$target] = ['ok' => hash_equals($definition['database'], $selected), 'database' => $selected, 'mysql_version' => $db->server_info];
            } catch (Throwable $e) {
                $databases[$target] = ['ok' => false, 'database' => $definition['database'], 'error' => $e->getMessage()];
            }
        }
        dbm_reply(['ok' => !in_array(false, array_column($databases, 'ok'), true), 'action' => $action, 'version' => IMC_DBM_VERSION, 'mode' => 'ready', 'databases' => $databases]);
    }

    if ($action === 'schema') {
        $target = trim((string)($payload['target'] ?? ''));
        [$database, $db] = dbm_storage($target);
        $includeDdl = ($payload['include_ddl'] ?? false) === true;
        $schema = dbm_schema($db, $database, $includeDdl);
        dbm_audit(['action' => $action, 'target' => $target, 'database' => $database, 'status' => 'success', 'include_ddl' => $includeDdl]);
        dbm_reply(['ok' => true, 'action' => $action, 'schema' => $schema]);
    }

    if ($action === 'query') {
        $target = trim((string)($payload['target'] ?? ''));
        [$database, $db] = dbm_storage($target);
        $sql = dbm_validate_read_sql((string)($payload['sql'] ?? ''), $database);
        $result = dbm_query($db, $sql, min(max((int)($payload['limit'] ?? IMC_DBM_MAX_ROWS), 1), IMC_DBM_MAX_ROWS));
        dbm_audit(['action' => $action, 'target' => $target, 'database' => $database, 'status' => 'success', 'sql_sha256' => hash('sha256', $sql)]);
        dbm_reply(['ok' => true, 'action' => $action, 'target' => $target, 'database' => $database, 'result' => $result]);
    }

    if ($action === 'plan_migration') {
        $plan = dbm_plan($payload);
        dbm_audit(['action' => $action, 'target' => $plan['plan']['target'], 'database' => $plan['plan']['database'], 'migration_id' => $plan['plan']['migration_id'], 'plan_sha256' => $plan['plan_sha256'], 'status' => 'planned']);
        dbm_reply(['ok' => true, 'action' => $action] + $plan);
    }

    if ($action === 'execute_migration') {
        $verified = dbm_verify_plan($payload);
        $plan = $verified['plan'];
        $marker = dbm_migration_marker($plan['target'], $plan['migration_id']);
        if (is_file($marker)) throw new RuntimeException('Migration already executed successfully.', 409);
        [$database, $db] = dbm_storage($plan['target']);
        $before = dbm_schema($db, $database, false);
        $results = [];
        $started = microtime(true);
        try {
            foreach ($plan['statements'] as $index => $sql) {
                $results[] = ['statement' => $index + 1, 'sha256' => hash('sha256', $sql)] + dbm_query($db, $sql, 1);
            }
            $after = dbm_schema($db, $database, false);
            $record = ['action' => $action, 'target' => $plan['target'], 'database' => $database, 'migration_id' => $plan['migration_id'], 'plan_sha256' => $verified['plan_sha256'], 'status' => 'success', 'statement_count' => count($plan['statements']), 'duration_ms' => (int)round((microtime(true) - $started) * 1000), 'before' => ['tables' => $before['table_count'], 'columns' => $before['column_count']], 'after' => ['tables' => $after['table_count'], 'columns' => $after['column_count']]];
            dbm_audit($record);
            if (file_put_contents($marker, json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) throw new RuntimeException('Migration completed but idempotency marker could not be written.');
            dbm_reply(['ok' => true] + $record + ['results' => $results]);
        } catch (Throwable $e) {
            dbm_audit(['action' => $action, 'target' => $plan['target'], 'database' => $database, 'migration_id' => $plan['migration_id'], 'plan_sha256' => $verified['plan_sha256'], 'status' => 'failed', 'completed_statements' => count($results), 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    if ($action === 'history') dbm_reply(['ok' => true, 'action' => $action, 'history' => dbm_history((int)($payload['limit'] ?? 50))]);
    throw new InvalidArgumentException('Unknown action.');
} catch (Throwable $e) {
    $status = $e->getCode();
    if (!is_int($status) || $status < 400 || $status > 599) $status = $e instanceof InvalidArgumentException ? 422 : 500;
    dbm_reply(['ok' => false, 'version' => IMC_DBM_VERSION, 'error' => $e->getMessage()], $status);
}
