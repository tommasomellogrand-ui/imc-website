<?php
declare(strict_types=1);

/*
 * IMC Database Manager - read-only Schema Diff & Structural Audit Engine.
 * Loaded by index.php. It only consumes dbm_schema() snapshots and never
 * executes mutating SQL.
 */

function dbm_diff_normalize_name(string $value): string {
    return preg_replace('/GW\d{3}_/i', 'GWXXX_', $value) ?? $value;
}

function dbm_diff_normalize_sql(?string $sql): ?string {
    if ($sql === null) return null;
    $sql = dbm_diff_normalize_name($sql);
    $sql = preg_replace('/^CREATE\s+TABLE\s+`[^`]+`/i', 'CREATE TABLE `__TABLE__`', $sql) ?? $sql;
    $sql = preg_replace('/\bAUTO_INCREMENT=\d+\b/i', 'AUTO_INCREMENT=__VALUE__', $sql) ?? $sql;
    $sql = preg_replace('/\bCONSTRAINT\s+`[^`]+`\s+/i', 'CONSTRAINT ', $sql) ?? $sql;
    $sql = preg_replace('/\s+/', ' ', trim($sql)) ?? trim($sql);
    return $sql;
}

function dbm_diff_table_map(array $schema): array {
    $out = [];
    foreach (($schema['tables'] ?? []) as $table) {
        if (!is_array($table)) continue;
        $name = (string)($table['table_name'] ?? '');
        if ($name !== '') $out[$name] = $table;
    }
    return $out;
}

function dbm_diff_index_signature(array $index): array {
    $columns = [];
    foreach (($index['columns'] ?? []) as $column) {
        if (!is_array($column)) continue;
        $columns[] = [
            'column_name' => (string)($column['column_name'] ?? ''),
            'sub_part' => $column['sub_part'] ?? null,
            'collation' => $column['collation'] ?? null,
        ];
    }
    return [
        'unique' => ($index['unique'] ?? false) === true,
        'index_type' => strtoupper((string)($index['index_type'] ?? '')),
        'columns' => $columns,
    ];
}

function dbm_diff_fk_signature(array $fk): array {
    $columns = [];
    foreach (($fk['columns'] ?? []) as $column) {
        if (!is_array($column)) continue;
        $columns[] = [
            'column_name' => (string)($column['column_name'] ?? ''),
            'referenced_column_name' => (string)($column['referenced_column_name'] ?? ''),
        ];
    }
    return [
        'referenced_table_name' => dbm_diff_normalize_name((string)($fk['referenced_table_name'] ?? '')),
        'update_rule' => strtoupper((string)($fk['update_rule'] ?? '')),
        'delete_rule' => strtoupper((string)($fk['delete_rule'] ?? '')),
        'columns' => $columns,
    ];
}

function dbm_diff_trigger_signature(array $trigger): array {
    return [
        'event_manipulation' => strtoupper((string)($trigger['event_manipulation'] ?? '')),
        'action_timing' => strtoupper((string)($trigger['action_timing'] ?? '')),
        'action_orientation' => strtoupper((string)($trigger['action_orientation'] ?? '')),
        'action_condition' => $trigger['action_condition'] ?? null,
        'action_statement' => dbm_diff_normalize_sql(isset($trigger['action_statement']) ? (string)$trigger['action_statement'] : null),
    ];
}

function dbm_diff_signature_set(array $items, callable $normalizer): array {
    $out = [];
    foreach ($items as $item) {
        if (!is_array($item)) continue;
        $normalized = $normalizer($item);
        $key = dbm_canonical($normalized);
        $out[$key] = $normalized;
    }
    ksort($out, SORT_STRING);
    return array_values($out);
}

function dbm_diff_add(array &$differences, string $status, string $objectType, string $objectName, mixed $left, mixed $right, string $criticality, ?string $detail = null): void {
    $differences[] = [
        'status' => $status,
        'object_type' => $objectType,
        'object_name' => $objectName,
        'criticality' => $criticality,
        'detail' => $detail,
        'left' => $left,
        'right' => $right,
    ];
}

function dbm_diff_compare_columns(array $left, array $right, array &$differences): void {
    $leftMap = [];
    $rightMap = [];
    foreach (($left['columns'] ?? []) as $c) if (is_array($c) && isset($c['column_name'])) $leftMap[(string)$c['column_name']] = $c;
    foreach (($right['columns'] ?? []) as $c) if (is_array($c) && isset($c['column_name'])) $rightMap[(string)$c['column_name']] = $c;
    $names = array_values(array_unique(array_merge(array_keys($leftMap), array_keys($rightMap))));
    sort($names, SORT_STRING);
    foreach ($names as $name) {
        if (!isset($rightMap[$name])) {
            dbm_diff_add($differences, 'MISSING', 'column', $name, $leftMap[$name], null, 'HIGH', 'Column exists on left/reference but is missing on right/candidate.');
            continue;
        }
        if (!isset($leftMap[$name])) {
            dbm_diff_add($differences, 'EXTRA', 'column', $name, null, $rightMap[$name], 'MEDIUM', 'Column exists only on right/candidate.');
            continue;
        }
        $fields = [
            'column_type' => 'HIGH',
            'is_nullable' => 'MEDIUM',
            'column_default' => 'MEDIUM',
            'extra' => 'MEDIUM',
            'character_set_name' => 'LOW',
            'collation_name' => 'LOW',
        ];
        foreach ($fields as $field => $criticality) {
            $lv = $leftMap[$name][$field] ?? null;
            $rv = $rightMap[$name][$field] ?? null;
            if ($lv !== $rv) dbm_diff_add($differences, 'DIFFERENT', 'column.' . $field, $name, $lv, $rv, $criticality);
        }
    }
}

function dbm_diff_compare_sets(string $type, array $leftSet, array $rightSet, array &$differences, string $criticality): void {
    $leftCanonical = [];
    $rightCanonical = [];
    foreach ($leftSet as $item) $leftCanonical[dbm_canonical($item)] = $item;
    foreach ($rightSet as $item) $rightCanonical[dbm_canonical($item)] = $item;
    foreach ($leftCanonical as $key => $item) {
        if (!isset($rightCanonical[$key])) dbm_diff_add($differences, 'MISSING', $type, substr(hash('sha256', $key), 0, 12), $item, null, $criticality);
    }
    foreach ($rightCanonical as $key => $item) {
        if (!isset($leftCanonical[$key])) dbm_diff_add($differences, 'EXTRA', $type, substr(hash('sha256', $key), 0, 12), null, $item, $criticality);
    }
}

function dbm_diff_compare_table(array $left, array $right): array {
    $differences = [];
    dbm_diff_compare_columns($left, $right, $differences);

    $leftPk = isset($left['primary_key']) && is_array($left['primary_key']) ? dbm_diff_index_signature($left['primary_key']) : null;
    $rightPk = isset($right['primary_key']) && is_array($right['primary_key']) ? dbm_diff_index_signature($right['primary_key']) : null;
    if ($leftPk !== $rightPk) dbm_diff_add($differences, 'DIFFERENT', 'primary_key', 'PRIMARY', $leftPk, $rightPk, 'HIGH');

    $leftUnique = dbm_diff_signature_set((array)($left['unique_indexes'] ?? []), 'dbm_diff_index_signature');
    $rightUnique = dbm_diff_signature_set((array)($right['unique_indexes'] ?? []), 'dbm_diff_index_signature');
    dbm_diff_compare_sets('unique_index', $leftUnique, $rightUnique, $differences, 'HIGH');

    $leftIndexes = array_filter((array)($left['indexes'] ?? []), static fn($i): bool => is_array($i) && (($i['index_name'] ?? '') !== 'PRIMARY') && (($i['unique'] ?? false) !== true));
    $rightIndexes = array_filter((array)($right['indexes'] ?? []), static fn($i): bool => is_array($i) && (($i['index_name'] ?? '') !== 'PRIMARY') && (($i['unique'] ?? false) !== true));
    dbm_diff_compare_sets('index', dbm_diff_signature_set($leftIndexes, 'dbm_diff_index_signature'), dbm_diff_signature_set($rightIndexes, 'dbm_diff_index_signature'), $differences, 'MEDIUM');

    dbm_diff_compare_sets('foreign_key', dbm_diff_signature_set((array)($left['foreign_keys'] ?? []), 'dbm_diff_fk_signature'), dbm_diff_signature_set((array)($right['foreign_keys'] ?? []), 'dbm_diff_fk_signature'), $differences, 'HIGH');
    dbm_diff_compare_sets('trigger', dbm_diff_signature_set((array)($left['triggers'] ?? []), 'dbm_diff_trigger_signature'), dbm_diff_signature_set((array)($right['triggers'] ?? []), 'dbm_diff_trigger_signature'), $differences, 'HIGH');

    $leftDdl = dbm_diff_normalize_sql(isset($left['ddl']) ? (string)$left['ddl'] : null);
    $rightDdl = dbm_diff_normalize_sql(isset($right['ddl']) ? (string)$right['ddl'] : null);
    if ($leftDdl !== null && $rightDdl !== null && $leftDdl !== $rightDdl) {
        dbm_diff_add($differences, 'DIFFERENT', 'ddl', 'normalized_ddl', $leftDdl, $rightDdl, 'LOW', 'Normalized DDL differs after removing table identity, GW prefix differences, constraint names and AUTO_INCREMENT counters.');
    }

    $maxCriticality = 'NONE';
    foreach ($differences as $diff) {
        if (($diff['criticality'] ?? '') === 'HIGH') { $maxCriticality = 'HIGH'; break; }
        if (($diff['criticality'] ?? '') === 'MEDIUM') $maxCriticality = 'MEDIUM';
        elseif (($diff['criticality'] ?? '') === 'LOW' && $maxCriticality === 'NONE') $maxCriticality = 'LOW';
    }
    return [
        'status' => $differences === [] ? 'IDENTICAL' : 'DIFFERENT',
        'difference_count' => count($differences),
        'max_criticality' => $maxCriticality,
        'differences' => $differences,
    ];
}

function dbm_diff_load_side(string $target, ?string $table): array {
    [$database, $db] = dbm_storage($target);
    $schema = dbm_schema($db, $database, true);
    if ($table === null || $table === '') return ['target'=>$target, 'database'=>$database, 'table'=>null, 'structure'=>$schema];
    $map = dbm_diff_table_map($schema);
    if (!isset($map[$table])) return ['target'=>$target, 'database'=>$database, 'table'=>$table, 'structure'=>null];
    return ['target'=>$target, 'database'=>$database, 'table'=>$table, 'structure'=>$map[$table]];
}

function dbm_schema_diff(array $payload): array {
    $leftTarget = trim((string)($payload['left_target'] ?? ''));
    $leftTable = isset($payload['left_table']) ? trim((string)$payload['left_table']) : null;
    if ($leftTarget === '') throw new InvalidArgumentException('left_target is required.');
    $left = dbm_diff_load_side($leftTarget, $leftTable);

    $hasReference = isset($payload['reference_schema']) && is_array($payload['reference_schema']);
    $rightTarget = trim((string)($payload['right_target'] ?? ''));
    if ($hasReference && $rightTarget !== '') throw new InvalidArgumentException('Use either right_target or reference_schema, not both.');
    if (!$hasReference && $rightTarget === '') throw new InvalidArgumentException('right_target or reference_schema is required.');

    if ($hasReference) {
        $right = ['target'=>'reference', 'database'=>null, 'table'=>isset($payload['right_table']) ? trim((string)$payload['right_table']) : null, 'structure'=>$payload['reference_schema']];
    } else {
        $rightTable = isset($payload['right_table']) ? trim((string)$payload['right_table']) : null;
        $right = dbm_diff_load_side($rightTarget, $rightTable);
    }

    $leftIsTable = $left['table'] !== null;
    $rightIsTable = $right['table'] !== null;
    if ($leftIsTable !== $rightIsTable && !$hasReference) throw new InvalidArgumentException('Compare table-to-table or database-to-database; both sides must use the same scope.');

    if ($leftIsTable || ($hasReference && isset($right['structure']['columns']))) {
        if ($left['structure'] === null) {
            return ['status'=>'MISSING','objects'=>['left'=>$left,'right'=>$right],'difference_count'=>1,'max_criticality'=>'HIGH','differences'=>[['status'=>'MISSING','object_type'=>'table','object_name'=>(string)$left['table'],'criticality'=>'HIGH','detail'=>'Left/reference table is missing.','left'=>null,'right'=>$right['structure']]]];
        }
        if ($right['structure'] === null) {
            return ['status'=>'MISSING','objects'=>['left'=>$left,'right'=>$right],'difference_count'=>1,'max_criticality'=>'HIGH','differences'=>[['status'=>'MISSING','object_type'=>'table','object_name'=>(string)$right['table'],'criticality'=>'HIGH','detail'=>'Right/candidate table is missing.','left'=>$left['structure'],'right'=>null]]];
        }
        $comparison = dbm_diff_compare_table($left['structure'], $right['structure']);
        return ['objects'=>['left'=>['target'=>$left['target'],'database'=>$left['database'],'table'=>$left['table']], 'right'=>['target'=>$right['target'],'database'=>$right['database'],'table'=>$right['table']]]] + $comparison;
    }

    if (!is_array($left['structure']) || !is_array($right['structure'])) throw new InvalidArgumentException('Invalid database schema structure.');
    $leftTables = dbm_diff_table_map($left['structure']);
    $rightTables = dbm_diff_table_map($right['structure']);
    $names = array_values(array_unique(array_merge(array_keys($leftTables), array_keys($rightTables))));
    sort($names, SORT_STRING);
    $differences = [];
    $tableResults = [];
    foreach ($names as $name) {
        if (!isset($rightTables[$name])) {
            dbm_diff_add($differences, 'MISSING', 'table', $name, ['table_name'=>$name], null, 'HIGH');
            $tableResults[$name] = 'MISSING';
            continue;
        }
        if (!isset($leftTables[$name])) {
            dbm_diff_add($differences, 'EXTRA', 'table', $name, null, ['table_name'=>$name], 'MEDIUM');
            $tableResults[$name] = 'EXTRA';
            continue;
        }
        $result = dbm_diff_compare_table($leftTables[$name], $rightTables[$name]);
        $tableResults[$name] = $result['status'];
        foreach ($result['differences'] as $diff) {
            $diff['object_name'] = $name . ':' . $diff['object_name'];
            $differences[] = $diff;
        }
    }
    $maxCriticality = 'NONE';
    foreach ($differences as $diff) {
        if (($diff['criticality'] ?? '') === 'HIGH') { $maxCriticality = 'HIGH'; break; }
        if (($diff['criticality'] ?? '') === 'MEDIUM') $maxCriticality = 'MEDIUM';
        elseif (($diff['criticality'] ?? '') === 'LOW' && $maxCriticality === 'NONE') $maxCriticality = 'LOW';
    }
    return [
        'status' => $differences === [] ? 'IDENTICAL' : 'DIFFERENT',
        'objects' => ['left'=>['target'=>$left['target'],'database'=>$left['database']], 'right'=>['target'=>$right['target'],'database'=>$right['database']]],
        'difference_count' => count($differences),
        'max_criticality' => $maxCriticality,
        'table_results' => $tableResults,
        'differences' => $differences,
    ];
}
