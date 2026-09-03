<?php
declare(strict_types=1);

const SMM_GOLD_SCHEMA_DATABASE = 'Sql1956795_2';
const SMM_GOLD_SCHEMA_SHA256 = '5749bf4ec7be35f00c247210b966e67a265737c252d6cf11f0292b7ae6991785';

function smm_gold_schema_path(): string {
    return dirname(__DIR__) . '/GOLD_DATABASE_FINAL_DDL_CHECKPOINT_06(1).sql';
}

function smm_gold_schema_source(): string {
    $path = smm_gold_schema_path();
    if (!is_file($path)) throw new RuntimeException('Certified GOLD DDL file not found.');
    $hash = hash_file('sha256', $path);
    if (!is_string($hash) || !hash_equals(SMM_GOLD_SCHEMA_SHA256, $hash)) {
        throw new RuntimeException('Certified GOLD DDL SHA-256 mismatch.');
    }
    $ddl = file_get_contents($path);
    if (!is_string($ddl) || $ddl === '') throw new RuntimeException('Certified GOLD DDL is empty.');
    return $ddl;
}

function smm_gold_table_count(mysqli $db): int {
    $stmt = $db->prepare("SELECT COUNT(*) total FROM information_schema.tables WHERE table_schema=? AND table_type='BASE TABLE'");
    $name = SMM_GOLD_SCHEMA_DATABASE;
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();
    return $count;
}

function smm_gold_preflight(): array {
    $db = smm_storage_db('gold');
    $selected = (string)$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];
    $tables = smm_gold_table_count($db);
    return [
        'ok' => $selected === SMM_GOLD_SCHEMA_DATABASE && $tables === 0,
        'database' => $selected,
        'mysql_version' => $db->server_info,
        'table_count' => $tables,
    ];
}

function smm_gold_expected_columns(string $ddl): array {
    $expected = [];
    if (!preg_match_all('/CREATE\s+TABLE\s+\x60([^\x60]+)\x60\s*\((.*?)\)\s*ENGINE\s*=\s*InnoDB/si', $ddl, $tables, PREG_SET_ORDER)) {
        throw new RuntimeException('No CREATE TABLE definitions found in certified GOLD DDL.');
    }
    foreach ($tables as $table) {
        foreach (preg_split('/\R/', $table[2]) as $line) {
            if (!preg_match('/^\s*\x60([^\x60]+)\x60\s+([A-Z]+(?:\([^)]*\))?(?:\s+UNSIGNED)?)(.*)$/i', $line, $column)) continue;
            $key = $table[1] . '.' . $column[1];
            $expected[$key] = [
                'type' => strtoupper(preg_replace('/\s+/', ' ', trim($column[2]))),
                'nullable' => preg_match('/\bNOT\s+NULL\b/i', $column[3]) ? 'NO' : 'YES',
            ];
        }
    }
    return $expected;
}

function smm_gold_namespace_check(mysqli $db, string $where, string $valid): array {
    $sql = "SELECT COUNT(*) total,SUM(CASE WHEN $valid THEN 0 ELSE 1 END) invalid FROM information_schema.columns WHERE table_schema='" . SMM_GOLD_SCHEMA_DATABASE . "' AND ($where)";
    $row = $db->query($sql)->fetch_assoc();
    return ['total' => (int)$row['total'], 'invalid' => (int)($row['invalid'] ?? 0), 'ok' => (int)($row['invalid'] ?? 0) === 0 && (int)$row['total'] > 0];
}

function smm_gold_schema_metrics(): array {
    $ddl = smm_gold_schema_source();
    $db = smm_storage_db('gold');
    $selected = (string)$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];
    if ($selected !== SMM_GOLD_SCHEMA_DATABASE) throw new RuntimeException('GOLD database target mismatch.');

    $scalar = static function (mysqli $db, string $sql): int {
        return (int)$db->query($sql)->fetch_assoc()['total'];
    };
    $schema = SMM_GOLD_SCHEMA_DATABASE;
    $tables = $scalar($db, "SELECT COUNT(*) total FROM information_schema.tables WHERE table_schema='$schema' AND table_type='BASE TABLE'");
    $columns = $scalar($db, "SELECT COUNT(*) total FROM information_schema.columns WHERE table_schema='$schema'");
    $primaryKeys = $scalar($db, "SELECT COUNT(*) total FROM information_schema.table_constraints WHERE constraint_schema='$schema' AND constraint_type='PRIMARY KEY'");
    $uniqueKeys = $scalar($db, "SELECT COUNT(*) total FROM information_schema.table_constraints WHERE constraint_schema='$schema' AND constraint_type='UNIQUE'");
    $foreignKeys = $scalar($db, "SELECT COUNT(*) total FROM information_schema.referential_constraints WHERE constraint_schema='$schema' AND unique_constraint_schema='$schema'");
    $innodb = $scalar($db, "SELECT COUNT(*) total FROM information_schema.tables WHERE table_schema='$schema' AND table_type='BASE TABLE' AND engine='InnoDB'");
    $idempotent = $scalar($db, "SELECT COUNT(DISTINCT table_name) total FROM information_schema.table_constraints WHERE constraint_schema='$schema' AND constraint_type IN ('PRIMARY KEY','UNIQUE')");
    $unsafeUnique = $scalar($db, "SELECT COUNT(*) total FROM (SELECT s.table_name,s.index_name FROM information_schema.statistics s JOIN information_schema.columns c ON c.table_schema=s.table_schema AND c.table_name=s.table_name AND c.column_name=s.column_name WHERE s.table_schema='$schema' AND s.non_unique=0 AND s.index_name<>'PRIMARY' GROUP BY s.table_name,s.index_name HAVING SUM(c.is_nullable='YES')>0) unsafe");

    $totalRows = 0;
    $tableResult = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema='$schema' AND table_type='BASE TABLE' ORDER BY table_name");
    while ($row = $tableResult->fetch_assoc()) {
        $table = (string)$row['table_name'];
        if (!preg_match('/^gw_[a-z0-9_]+$/', $table)) throw new RuntimeException('Unexpected GOLD table name.');
        $totalRows += (int)$db->query("SELECT COUNT(*) total FROM \x60$table\x60")->fetch_assoc()['total'];
    }

    $expected = smm_gold_expected_columns($ddl);
    $actual = [];
    $actualResult = $db->query("SELECT table_name,column_name,column_type,is_nullable FROM information_schema.columns WHERE table_schema='$schema' ORDER BY table_name,ordinal_position");
    while ($row = $actualResult->fetch_assoc()) {
        $actual[$row['table_name'] . '.' . $row['column_name']] = [
            'type' => strtoupper(preg_replace('/\s+/', ' ', trim((string)$row['column_type']))),
            'nullable' => (string)$row['is_nullable'],
        ];
    }
    $mismatches = [];
    foreach ($expected as $key => $definition) {
        if (!isset($actual[$key])) $mismatches[] = ['column' => $key, 'error' => 'missing'];
        elseif ($actual[$key] !== $definition) $mismatches[] = ['column' => $key, 'expected' => $definition, 'actual' => $actual[$key]];
    }
    foreach (array_diff_key($actual, $expected) as $key => $definition) $mismatches[] = ['column' => $key, 'error' => 'unexpected', 'actual' => $definition];

    $namespaces = [
        'game_world_id' => smm_gold_namespace_check($db, "column_name='game_world_id'", "column_type='varchar(16)'"),
        'sm_game_world_id' => smm_gold_namespace_check($db, "column_name='sm_game_world_id'", "column_type='bigint unsigned'"),
        'sm_season_id' => smm_gold_namespace_check($db, "column_name='sm_season_id'", "column_type='bigint unsigned'"),
        'sm_manager_id' => smm_gold_namespace_check($db, "column_name='sm_manager_id' OR column_name IN ('home_sm_manager_id','away_sm_manager_id')", "column_type='bigint unsigned'"),
        'player_references' => smm_gold_namespace_check($db, "column_name IN ('player_id','related_player_id','in_player_id','out_player_id','master_player_id')", "column_type='int unsigned'"),
        'fingerprints_hashes' => smm_gold_namespace_check($db, "column_name LIKE '%fingerprint' OR RIGHT(column_name,5)='_hash'", "column_type='char(64)' AND character_set_name='ascii' AND is_nullable='NO'"),
    ];
    $namespaceOk = !in_array(false, array_column($namespaces, 'ok'), true);
    $typeOk = count($expected) === 806 && count($actual) === 806 && !$mismatches;
    $ok = $tables === 55 && $columns === 806 && $primaryKeys === 55 && $uniqueKeys === 56 &&
        $idempotent === 55 && $foreignKeys === 121 && $unsafeUnique === 0 && $innodb === 55 &&
        $totalRows === 0 && $typeOk && $namespaceOk;

    return [
        'ok' => $ok,
        'database' => $selected,
        'ddl_sha256' => hash_file('sha256', smm_gold_schema_path()),
        'tables' => $tables,
        'columns' => $columns,
        'primary_keys' => $primaryKeys,
        'unique_constraints' => $uniqueKeys,
        'idempotency_tables' => $idempotent,
        'foreign_keys_internal' => $foreignKeys,
        'unsafe_nullable_unique' => $unsafeUnique,
        'innodb_tables' => $innodb,
        'total_rows' => $totalRows,
        'types_nullability' => [
            'ok' => $typeOk,
            'expected_columns' => count($expected),
            'actual_columns' => count($actual),
            'mismatches' => array_slice($mismatches, 0, 20),
        ],
        'namespaces' => $namespaces,
    ];
}

function smm_install_gold_schema_checkpoint_06(): never {
    $ddl = smm_gold_schema_source();
    $preflight = smm_gold_preflight();
    if (!$preflight['ok']) {
        smm_ingestion_reply('install_gold_schema_checkpoint_06', 0, 0, 0, [['error' => 'GOLD pre-flight failed.']], ['preflight' => $preflight], 409);
    }
    $db = smm_storage_db('gold');
    $statements = preg_split('/;\s*(?:\R|$)/', $ddl);
    $executed = 0;
    foreach ($statements as $index => $statement) {
        $statement = trim($statement);
        if ($statement === '') continue;
        try {
            $db->query($statement);
            $executed++;
        } catch (Throwable $e) {
            preg_match('/(?:CREATE|ALTER)\s+TABLE\s+\x60([^\x60]+)\x60/i', $statement, $table);
            preg_match('/CONSTRAINT\s+\x60([^\x60]+)\x60/i', $statement, $constraint);
            smm_ingestion_reply('install_gold_schema_checkpoint_06', 0, 0, 0, [[
                'statement_index' => $index + 1,
                'table' => $table[1] ?? null,
                'constraint' => $constraint[1] ?? null,
                'error' => $e->getMessage(),
            ]], ['preflight' => $preflight, 'statements_executed' => $executed], 500);
        }
    }
    $metrics = smm_gold_schema_metrics();
    smm_ingestion_reply('install_gold_schema_checkpoint_06', 0, 0, 0, $metrics['ok'] ? [] : [['error' => 'Post-install validation mismatch.']], ['preflight' => $preflight, 'statements_executed' => $executed, 'validation' => $metrics], $metrics['ok'] ? 200 : 500);
}

function smm_gold_schema_status(): never {
    $metrics = smm_gold_schema_metrics();
    smm_ingestion_reply('gold_schema_status', 0, 0, 0, $metrics['ok'] ? [] : [['error' => 'GOLD schema validation mismatch.']], ['validation' => $metrics], $metrics['ok'] ? 200 : 409);
}
