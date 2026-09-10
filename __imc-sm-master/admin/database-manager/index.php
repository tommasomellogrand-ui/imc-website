<?php
declare(strict_types=1);

/*
 * IMC Database Manager v1.0
 * HTTPS control plane for the existing IMC MySQL routing on Aruba.
 * This file contains no credentials and reuses ../core.php + private config.php.
 */

require dirname(__DIR__) . '/core.php';
require __DIR__ . '/schema-diff.php';
require __DIR__ . '/data-audit.php';

const IMC_DBM_VERSION = '1.5.1';
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
    $connectorKeyFile = __DIR__ . '/connector-key.php';
    $connectorKey = is_file($connectorKeyFile) ? (string)(require $connectorKeyFile) : '';
    $validAdmin = $expected !== '' && $token !== '' && hash_equals($expected, $token);
    $validConnector = $connectorKey !== '' && $token !== '' && hash_equals($connectorKey, $token);
    if (!$validAdmin && !$validConnector) {
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

function dbm_validate_write_sql(string $sql, string $database, bool $allowDestructive, bool $dataMigration): array {
    $sql = dbm_strip_sql($sql);
    dbm_assert_single_statement($sql);
    dbm_assert_no_cross_database($sql, $database);
    if (preg_match('/\b(INTO\s+OUTFILE|INTO\s+DUMPFILE|LOAD_FILE|LOAD\s+DATA|GRANT|REVOKE|CREATE\s+USER|ALTER\s+USER|DROP\s+USER|SET\s+PASSWORD|INSTALL\s+PLUGIN|UNINSTALL\s+PLUGIN|SHUTDOWN|KILL)\b/i', $sql)) {
        throw new InvalidArgumentException('Forbidden SQL capability.');
    }
    $kind = dbm_statement_kind($sql);
    $allowed = ['CREATE', 'ALTER', 'INSERT', 'UPDATE', 'DELETE', 'RENAME', 'DROP'];
    if (!in_array($kind, $allowed, true)) throw new InvalidArgumentException("SQL kind $kind is not allowed for migrations.");
    if (in_array($kind, ['INSERT', 'UPDATE', 'DELETE'], true) && !$dataMigration) {
        throw new InvalidArgumentException('INSERT, UPDATE and DELETE require data_migration=true for an explicit data migration or backfill.');
    }
    if ($kind === 'DROP') {
        $dropTrigger = (bool)preg_match('/^\s*DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?`?[A-Za-z_][A-Za-z0-9_]{0,63}`?\s*$/i', $sql);
        $dropTable = preg_match('/^\s*DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?`?([A-Za-z_][A-Za-z0-9_]{0,63})`?\s*$/i', $sql, $dropTableMatch) === 1;
        if (!$dropTrigger && !$dropTable) throw new InvalidArgumentException('Only single DROP TRIGGER or DROP TABLE statements are allowed as DROP migration SQL.');
        if ($dropTable && str_starts_with(strtoupper((string)$dropTableMatch[1]), 'IMC')) throw new InvalidArgumentException('DROP TABLE is forbidden for IMC-prefixed tables.');
    }
    $destructive = (bool)preg_match('/^\s*(DELETE\b|RENAME\b|DROP\s+TRIGGER\b)|\b(DROP\s+(?:COLUMN|INDEX|KEY|FOREIGN\s+KEY|TABLE)|RENAME\s+(?:COLUMN|INDEX|TABLE))\b/i', $sql);
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
    $tableOrder = [];

    $stmt = $db->prepare("SELECT table_name AS table_name, engine AS engine, table_rows AS table_rows, table_collation AS table_collation FROM information_schema.tables WHERE table_schema=? AND table_type='BASE TABLE' ORDER BY table_name");
    $stmt->bind_param('s', $database); $stmt->execute(); $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $table = (string)$row['table_name'];
        $tableOrder[] = $table;
        $tables[$table] = $row + [
            'columns' => [],
            'primary_key' => null,
            'unique_indexes' => [],
            'indexes' => [],
            'foreign_keys' => [],
            'triggers' => [],
        ];
    }
    $stmt->close();

    $column = $db->prepare("SELECT table_name AS table_name, column_name AS column_name, column_type AS column_type, is_nullable AS is_nullable, column_default AS column_default, column_key AS column_key, extra AS extra, character_set_name AS character_set_name, collation_name AS collation_name FROM information_schema.columns WHERE table_schema=? ORDER BY table_name, ordinal_position");
    $column->bind_param('s', $database); $column->execute(); $cr = $column->get_result();
    while ($c = $cr->fetch_assoc()) {
        $table = (string)$c['table_name'];
        unset($c['table_name']);
        if (isset($tables[$table])) $tables[$table]['columns'][] = $c;
    }
    $column->close();

    $index = $db->prepare("SELECT table_name AS table_name, index_name AS index_name, non_unique AS non_unique, seq_in_index AS seq_in_index, column_name AS column_name, sub_part AS sub_part, index_type AS index_type, collation AS collation FROM information_schema.statistics WHERE table_schema=? ORDER BY table_name, index_name, seq_in_index");
    $index->bind_param('s', $database); $index->execute(); $ir = $index->get_result();
    $indexMap = [];
    while ($i = $ir->fetch_assoc()) {
        $table = (string)$i['table_name'];
        $name = (string)$i['index_name'];
        if (!isset($tables[$table])) continue;
        if (!isset($indexMap[$table][$name])) {
            $indexMap[$table][$name] = [
                'index_name' => $name,
                'unique' => ((int)$i['non_unique']) === 0,
                'index_type' => $i['index_type'],
                'columns' => [],
            ];
        }
        $indexMap[$table][$name]['columns'][] = [
            'column_name' => $i['column_name'],
            'seq_in_index' => (int)$i['seq_in_index'],
            'sub_part' => $i['sub_part'] === null ? null : (int)$i['sub_part'],
            'collation' => $i['collation'],
        ];
    }
    $index->close();

    foreach ($indexMap as $table => $byName) {
        foreach ($byName as $name => $definition) {
            $tables[$table]['indexes'][] = $definition;
            if ($name === 'PRIMARY') $tables[$table]['primary_key'] = $definition;
            elseif ($definition['unique']) $tables[$table]['unique_indexes'][] = $definition;
        }
    }

    $fk = $db->prepare("SELECT k.table_name AS table_name, k.constraint_name AS constraint_name, k.column_name AS column_name, k.ordinal_position AS ordinal_position, k.referenced_table_name AS referenced_table_name, k.referenced_column_name AS referenced_column_name, r.update_rule AS update_rule, r.delete_rule AS delete_rule FROM information_schema.key_column_usage k LEFT JOIN information_schema.referential_constraints r ON r.constraint_schema=k.constraint_schema AND r.table_name=k.table_name AND r.constraint_name=k.constraint_name WHERE k.table_schema=? AND k.referenced_table_name IS NOT NULL ORDER BY k.table_name, k.constraint_name, k.ordinal_position");
    $fk->bind_param('s', $database); $fk->execute(); $fr = $fk->get_result();
    $fkMap = [];
    while ($f = $fr->fetch_assoc()) {
        $table = (string)$f['table_name'];
        $name = (string)$f['constraint_name'];
        if (!isset($tables[$table])) continue;
        if (!isset($fkMap[$table][$name])) {
            $fkMap[$table][$name] = [
                'constraint_name' => $name,
                'referenced_table_name' => $f['referenced_table_name'],
                'update_rule' => $f['update_rule'],
                'delete_rule' => $f['delete_rule'],
                'columns' => [],
            ];
        }
        $fkMap[$table][$name]['columns'][] = [
            'column_name' => $f['column_name'],
            'referenced_column_name' => $f['referenced_column_name'],
            'ordinal_position' => (int)$f['ordinal_position'],
        ];
    }
    $fk->close();
    foreach ($fkMap as $table => $byName) $tables[$table]['foreign_keys'] = array_values($byName);

    $trigger = $db->prepare("SELECT event_object_table AS table_name, trigger_name AS trigger_name, event_manipulation AS event_manipulation, action_timing AS action_timing, action_orientation AS action_orientation, action_condition AS action_condition, action_statement AS action_statement, created AS created, sql_mode AS sql_mode, definer AS definer FROM information_schema.triggers WHERE trigger_schema=? ORDER BY event_object_table, trigger_name");
    $trigger->bind_param('s', $database); $trigger->execute(); $tr = $trigger->get_result();
    $triggerCount = 0;
    while ($t = $tr->fetch_assoc()) {
        $table = (string)$t['table_name'];
        unset($t['table_name']);
        if (isset($tables[$table])) {
            $tables[$table]['triggers'][] = $t;
            $triggerCount++;
        }
    }
    $trigger->close();

    if ($includeDdl) {
        foreach ($tableOrder as $table) {
            $escaped = str_replace('`', '``', $table);
            $ddlRow = $db->query("SHOW CREATE TABLE `$escaped`")->fetch_assoc();
            $tables[$table]['ddl'] = $ddlRow['Create Table'] ?? null;
        }
    }

    $tableList = [];
    foreach ($tableOrder as $table) $tableList[] = $tables[$table];

    return [
        'database' => $database,
        'table_count' => count($tableList),
        'column_count' => array_sum(array_map(static fn(array $t): int => count($t['columns']), $tableList)),
        'index_count' => array_sum(array_map(static fn(array $t): int => count($t['indexes']), $tableList)),
        'foreign_key_count' => array_sum(array_map(static fn(array $t): int => count($t['foreign_keys']), $tableList)),
        'trigger_count' => $triggerCount,
        'tables' => $tableList,
    ];
}

function dbm_plan(array $payload): array {
    $target = trim((string)($payload['target'] ?? ''));
    [$database] = dbm_storage($target);
    $migrationId = trim((string)($payload['migration_id'] ?? ''));
    if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/', $migrationId)) throw new InvalidArgumentException('Invalid migration_id.');
    $statements = $payload['statements'] ?? null;
    if (!is_array($statements) || $statements === [] || count($statements) > 50) throw new InvalidArgumentException('statements must contain 1 to 50 items.');
    $allowDestructive = ($payload['allow_destructive'] ?? false) === true;
    $dataMigration = ($payload['data_migration'] ?? false) === true;
    $validated = [];
    foreach ($statements as $sql) {
        if (!is_string($sql)) throw new InvalidArgumentException('Every statement must be a string.');
        $validated[] = dbm_validate_write_sql($sql, $database, $allowDestructive, $dataMigration);
    }
    $plan = ['target' => $target, 'database' => $database, 'migration_id' => $migrationId, 'allow_destructive' => $allowDestructive, 'data_migration' => $dataMigration, 'statements' => array_column($validated, 'sql')];
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

function dbm_mcp_result(mixed $id, array $data): never {
    dbm_reply([
        'jsonrpc' => '2.0',
        'id' => $id,
        'result' => [
            'content' => [['type' => 'text', 'text' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]],
            'structuredContent' => $data,
            'isError' => false,
        ],
    ]);
}

function dbm_mcp_tools(): array {
    return [
        ['name'=>'health','description'=>'Read-only connectivity check for the three authorized IMC MySQL databases.','inputSchema'=>['type'=>'object','properties'=>(object)[],'additionalProperties'=>false]],
        ['name'=>'schema','description'=>'Read the authoritative MySQL structure of one authorized database, including tables, columns, keys, indexes, foreign keys, triggers and optional table DDL.','inputSchema'=>['type'=>'object','properties'=>['target'=>['type'=>'string','enum'=>['core','gold','custom']],'include_ddl'=>['type'=>'boolean','default'=>false]],'required'=>['target'],'additionalProperties'=>false]],
        ['name'=>'schema_diff','description'=>'Read-only structural comparison between MySQL schemas/tables or an explicitly supplied reference schema. Reports IDENTICAL, MISSING, EXTRA and DIFFERENT without applying corrections.','inputSchema'=>['type'=>'object','properties'=>['left_target'=>['type'=>'string','enum'=>['core','gold','custom']],'left_table'=>['type'=>'string'],'right_target'=>['type'=>'string','enum'=>['core','gold','custom']],'right_table'=>['type'=>'string'],'reference_schema'=>['type'=>'object']], 'required'=>['left_target'],'additionalProperties'=>false]],
        ['name'=>'data_audit','description'=>'Read-only data consistency and anomaly audit using structural, relational and objectively verifiable rules. Never corrects data.','inputSchema'=>['type'=>'object','properties'=>['target'=>['type'=>'string','enum'=>['core','gold','custom']],'table'=>['type'=>'string'],'tables'=>['type'=>'array','items'=>['type'=>'string']],'gw'=>['type'=>'string','pattern'=>'^GW[0-9]{3}$'],'repository'=>['type'=>'string'],'sample_limit'=>['type'=>'integer','minimum'=>1,'maximum'=>100,'default'=>20]],'required'=>['target'],'additionalProperties'=>false]],
        ['name'=>'read_query','description'=>'Execute one read-only SELECT, SHOW, DESCRIBE or EXPLAIN query.','inputSchema'=>['type'=>'object','properties'=>['target'=>['type'=>'string','enum'=>['core','gold','custom']],'sql'=>['type'=>'string'],'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>500]],'required'=>['target','sql'],'additionalProperties'=>false]],
        ['name'=>'plan_migration','description'=>'Validate a controlled MySQL migration and return a short-lived confirmation token. Does not modify the database. INSERT, UPDATE and DELETE require data_migration=true.','inputSchema'=>['type'=>'object','properties'=>['target'=>['type'=>'string','enum'=>['core','gold','custom']],'migration_id'=>['type'=>'string'],'statements'=>['type'=>'array','minItems'=>1,'maxItems'=>50,'items'=>['type'=>'string']],'allow_destructive'=>['type'=>'boolean','default'=>false],'data_migration'=>['type'=>'boolean','default'=>false]],'required'=>['target','migration_id','statements'],'additionalProperties'=>false]],
        ['name'=>'execute_migration','description'=>'Execute the exact previously planned migration. This modifies MySQL and requires its confirmation token. DML plans must preserve data_migration=true.','inputSchema'=>['type'=>'object','properties'=>['target'=>['type'=>'string','enum'=>['core','gold','custom']],'migration_id'=>['type'=>'string'],'statements'=>['type'=>'array','minItems'=>1,'maxItems'=>50,'items'=>['type'=>'string']],'allow_destructive'=>['type'=>'boolean','default'=>false],'data_migration'=>['type'=>'boolean','default'=>false],'confirmation_token'=>['type'=>'string']],'required'=>['target','migration_id','statements','confirmation_token'],'additionalProperties'=>false]],
        ['name'=>'history','description'=>'Read the protected Database Manager audit history.','inputSchema'=>['type'=>'object','properties'=>['limit'=>['type'=>'integer','minimum'=>1,'maximum'=>200]],'additionalProperties'=>false]],
    ];
}

function dbm_health_data(): array {
    $databases = [];
    foreach (smm_storage_registry() as $target => $definition) {
        try {
            $db = smm_storage_db($target);
            $selected = (string)$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];
            $databases[$target] = ['ok'=>hash_equals($definition['database'],$selected),'database'=>$selected,'mysql_version'=>$db->server_info];
        } catch (Throwable $e) {
            $databases[$target] = ['ok'=>false,'database'=>$definition['database'],'error'=>$e->getMessage()];
        }
    }
    return ['ok'=>!in_array(false,array_column($databases,'ok'),true),'version'=>IMC_DBM_VERSION,'mode'=>'ready','databases'=>$databases];
}

function dbm_execute_plan(array $payload): array {
    $verified = dbm_verify_plan($payload);
    $plan = $verified['plan'];
    $marker = dbm_migration_marker($plan['target'], $plan['migration_id']);
    if (is_file($marker)) throw new RuntimeException('Migration already executed successfully.', 409);
    [$database, $db] = dbm_storage($plan['target']);
    $before = dbm_schema($db, $database, false);
    $results = []; $started = microtime(true);
    try {
        foreach ($plan['statements'] as $index => $sql) $results[] = ['statement'=>$index+1,'sha256'=>hash('sha256',$sql)] + dbm_query($db,$sql,1);
        $after = dbm_schema($db, $database, false);
        $record = ['action'=>'execute_migration','target'=>$plan['target'],'database'=>$database,'migration_id'=>$plan['migration_id'],'data_migration'=>$plan['data_migration'],'plan_sha256'=>$verified['plan_sha256'],'status'=>'success','statement_count'=>count($plan['statements']),'duration_ms'=>(int)round((microtime(true)-$started)*1000),'before'=>['tables'=>$before['table_count'],'columns'=>$before['column_count']],'after'=>['tables'=>$after['table_count'],'columns'=>$after['column_count']]];
        dbm_audit($record);
        if (file_put_contents($marker,json_encode($record,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),LOCK_EX)===false) throw new RuntimeException('Migration completed but idempotency marker could not be written.');
        return ['ok'=>true]+$record+['results'=>$results];
    } catch (Throwable $e) {
        dbm_audit(['action'=>'execute_migration','target'=>$plan['target'],'database'=>$database,'migration_id'=>$plan['migration_id'],'data_migration'=>$plan['data_migration'],'plan_sha256'=>$verified['plan_sha256'],'status'=>'failed','completed_statements'=>count($results),'error'=>$e->getMessage()]);
        throw $e;
    }
}

function dbm_handle_mcp(array $request): never {
    $id = $request['id'] ?? null; $method = (string)($request['method'] ?? '');
    if ($method === 'initialize') dbm_reply(['jsonrpc'=>'2.0','id'=>$id,'result'=>['protocolVersion'=>'2025-06-18','capabilities'=>['tools'=>(object)[]],'serverInfo'=>['name'=>'imc-database-manager','version'=>IMC_DBM_VERSION]]]);
    if ($method === 'notifications/initialized') { http_response_code(202); exit; }
    if ($method === 'ping') dbm_reply(['jsonrpc'=>'2.0','id'=>$id,'result'=>(object)[]]);
    if ($method === 'tools/list') dbm_reply(['jsonrpc'=>'2.0','id'=>$id,'result'=>['tools'=>dbm_mcp_tools()]]);
    if ($method !== 'tools/call') dbm_reply(['jsonrpc'=>'2.0','id'=>$id,'error'=>['code'=>-32601,'message'=>'Method not found']],200);
    $params = is_array($request['params'] ?? null) ? $request['params'] : [];
    $name = (string)($params['name'] ?? ''); $args = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];
    if ($name === 'health') dbm_mcp_result($id, dbm_health_data());
    if ($name === 'schema') { [$database,$db]=dbm_storage((string)($args['target']??'')); $data=dbm_schema($db,$database,($args['include_ddl']??false)===true); dbm_audit(['action'=>'schema','target'=>$args['target'],'database'=>$database,'status'=>'success']); dbm_mcp_result($id,['ok'=>true,'schema'=>$data]); }
    if ($name === 'schema_diff') { $data=dbm_schema_diff($args); dbm_audit(['action'=>'schema_diff','left_target'=>$args['left_target']??null,'left_table'=>$args['left_table']??null,'right_target'=>$args['right_target']??null,'right_table'=>$args['right_table']??null,'status'=>'success','difference_count'=>$data['difference_count']??null]); dbm_mcp_result($id,['ok'=>true,'diff'=>$data]); }
    if ($name === 'data_audit') { $data=dbm_data_audit($args); dbm_audit(['action'=>'data_audit','target'=>$data['target'],'database'=>$data['database'],'status'=>'success','tables_analyzed'=>$data['tables_analyzed'],'rows_analyzed'=>$data['rows_analyzed'],'error_count'=>$data['error_count'],'warning_count'=>$data['warning_count']]); dbm_mcp_result($id,['ok'=>true,'audit'=>$data]); }
    if ($name === 'read_query') { $target=(string)($args['target']??''); [$database,$db]=dbm_storage($target); $sql=dbm_validate_read_sql((string)($args['sql']??''),$database); $result=dbm_query($db,$sql,min(max((int)($args['limit']??500),1),500)); dbm_audit(['action'=>'query','target'=>$target,'database'=>$database,'status'=>'success','sql_sha256'=>hash('sha256',$sql)]); dbm_mcp_result($id,['ok'=>true,'target'=>$target,'database'=>$database,'result'=>$result]); }
    if ($name === 'plan_migration') { $plan=dbm_plan($args); dbm_audit(['action'=>'plan_migration','target'=>$plan['plan']['target'],'database'=>$plan['plan']['database'],'migration_id'=>$plan['plan']['migration_id'],'data_migration'=>$plan['plan']['data_migration'],'plan_sha256'=>$plan['plan_sha256'],'status'=>'planned']); dbm_mcp_result($id,['ok'=>true]+$plan); }
    if ($name === 'execute_migration') dbm_mcp_result($id,dbm_execute_plan($args));
    if ($name === 'history') dbm_mcp_result($id,['ok'=>true,'history'=>dbm_history((int)($args['limit']??50))]);
    dbm_reply(['jsonrpc'=>'2.0','id'=>$id,'error'=>['code'=>-32602,'message'=>'Unknown tool']],200);
}

try {
    dbm_https_auth();
    $payload = dbm_payload();
    if (($payload['jsonrpc'] ?? null) === '2.0') dbm_handle_mcp($payload);
    $action = trim((string)($payload['action'] ?? 'health'));

    if ($action === 'health') {
        dbm_reply(['action'=>$action]+dbm_health_data());
    }

    if ($action === 'schema') {
        $target = trim((string)($payload['target'] ?? ''));
        [$database, $db] = dbm_storage($target);
        $includeDdl = ($payload['include_ddl'] ?? false) === true;
        $schema = dbm_schema($db, $database, $includeDdl);
        dbm_audit(['action' => $action, 'target' => $target, 'database' => $database, 'status' => 'success', 'include_ddl' => $includeDdl]);
        dbm_reply(['ok' => true, 'action' => $action, 'schema' => $schema]);
    }

    if ($action === 'schema_diff') {
        $diff = dbm_schema_diff($payload);
        dbm_audit(['action'=>$action,'left_target'=>$payload['left_target']??null,'left_table'=>$payload['left_table']??null,'right_target'=>$payload['right_target']??null,'right_table'=>$payload['right_table']??null,'status'=>'success','difference_count'=>$diff['difference_count']??null]);
        dbm_reply(['ok'=>true,'action'=>$action,'diff'=>$diff]);
    }

    if ($action === 'data_audit') {
        $audit = dbm_data_audit($payload);
        dbm_audit(['action'=>$action,'target'=>$audit['target'],'database'=>$audit['database'],'status'=>'success','tables_analyzed'=>$audit['tables_analyzed'],'rows_analyzed'=>$audit['rows_analyzed'],'error_count'=>$audit['error_count'],'warning_count'=>$audit['warning_count']]);
        dbm_reply(['ok'=>true,'action'=>$action,'audit'=>$audit]);
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
        dbm_audit(['action' => $action, 'target' => $plan['plan']['target'], 'database' => $plan['plan']['database'], 'migration_id' => $plan['plan']['migration_id'], 'data_migration' => $plan['plan']['data_migration'], 'plan_sha256' => $plan['plan_sha256'], 'status' => 'planned']);
        dbm_reply(['ok' => true, 'action' => $action] + $plan);
    }

    if ($action === 'execute_migration') {
        dbm_reply(dbm_execute_plan($payload));
    }

    if ($action === 'history') dbm_reply(['ok' => true, 'action' => $action, 'history' => dbm_history((int)($payload['limit'] ?? 50))]);
    throw new InvalidArgumentException('Unknown action.');
} catch (Throwable $e) {
    $status = $e->getCode();
    if (!is_int($status) || $status < 400 || $status > 599) $status = $e instanceof InvalidArgumentException ? 422 : 500;
    dbm_reply(['ok' => false, 'version' => IMC_DBM_VERSION, 'error' => $e->getMessage()], $status);
}
