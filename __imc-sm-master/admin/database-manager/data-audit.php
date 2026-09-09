<?php
declare(strict_types=1);

/*
 * IMC Database Manager - read-only Data Consistency & Anomaly Audit Engine.
 * Uses only authoritative MySQL metadata and SELECT queries. Never mutates data/schema.
 */

function dbm_audit_quote_ident(string $name): string {
    if ($name === '' || strlen($name) > 64) throw new InvalidArgumentException('Invalid identifier.');
    return '`' . str_replace('`', '``', $name) . '`';
}

function dbm_audit_table_map(array $schema): array {
    $out = [];
    foreach (($schema['tables'] ?? []) as $table) {
        if (!is_array($table)) continue;
        $name = (string)($table['table_name'] ?? '');
        if ($name !== '') $out[$name] = $table;
    }
    return $out;
}

function dbm_audit_column_map(array $table): array {
    $out = [];
    foreach (($table['columns'] ?? []) as $column) {
        if (!is_array($column)) continue;
        $name = (string)($column['column_name'] ?? '');
        if ($name !== '') $out[$name] = $column;
    }
    return $out;
}

function dbm_audit_select_tables(array $payload, array $schema): array {
    $map = dbm_audit_table_map($schema);
    $selected = [];
    if (isset($payload['table']) && trim((string)$payload['table']) !== '') {
        $selected[] = trim((string)$payload['table']);
    } elseif (isset($payload['tables']) && is_array($payload['tables']) && $payload['tables'] !== []) {
        foreach ($payload['tables'] as $name) if (is_string($name) && trim($name) !== '') $selected[] = trim($name);
    } elseif (isset($payload['gw']) && preg_match('/^GW\d{3}$/i', trim((string)$payload['gw']))) {
        $prefix = strtoupper(trim((string)$payload['gw'])) . '_';
        foreach (array_keys($map) as $name) if (str_starts_with(strtoupper($name), $prefix)) $selected[] = $name;
    } elseif (isset($payload['repository']) && trim((string)$payload['repository']) !== '') {
        $needle = '_IMC ' . trim((string)$payload['repository']);
        foreach (array_keys($map) as $name) if (stripos($name, $needle) !== false) $selected[] = $name;
    } else {
        $selected = array_keys($map);
    }
    $selected = array_values(array_unique($selected));
    foreach ($selected as $name) if (!isset($map[$name])) throw new InvalidArgumentException("Unknown table in selected target: $name");
    sort($selected, SORT_STRING);
    return $selected;
}

function dbm_audit_key_columns(array $table): array {
    $pk = $table['primary_key'] ?? null;
    if (is_array($pk) && is_array($pk['columns'] ?? null) && $pk['columns'] !== []) {
        return array_values(array_filter(array_map(static fn($c) => is_array($c) ? (string)($c['column_name'] ?? '') : '', $pk['columns'])));
    }
    foreach (($table['unique_indexes'] ?? []) as $index) {
        if (!is_array($index) || !is_array($index['columns'] ?? null)) continue;
        $cols = array_values(array_filter(array_map(static fn($c) => is_array($c) ? (string)($c['column_name'] ?? '') : '', $index['columns'])));
        if ($cols !== []) return $cols;
    }
    $columns = dbm_audit_column_map($table);
    foreach (['id','sm_fixture_id','fingerprint'] as $candidate) if (isset($columns[$candidate])) return [$candidate];
    return array_slice(array_keys($columns), 0, 1);
}

function dbm_audit_row_identity_sql(array $table, string $alias = ''): string {
    $cols = dbm_audit_key_columns($table);
    if ($cols === []) return "'(no-key)'";
    $prefix = $alias === '' ? '' : dbm_audit_quote_ident($alias) . '.';
    $parts = [];
    foreach ($cols as $col) $parts[] = "COALESCE(CAST({$prefix}" . dbm_audit_quote_ident($col) . " AS CHAR),'NULL')";
    return 'CONCAT_WS(\'|\',' . implode(',', $parts) . ')';
}

function dbm_audit_query_rows(mysqli $db, string $sql, int $limit): array {
    $result = $db->query($sql);
    $rows = [];
    while (count($rows) < $limit && ($row = $result->fetch_assoc())) $rows[] = $row;
    $result->free();
    return $rows;
}

function dbm_audit_count(mysqli $db, string $sql): int {
    $row = $db->query($sql)->fetch_assoc();
    return (int)($row['c'] ?? 0);
}

function dbm_audit_finding(array &$findings, string $database, string $table, string $rowKey, string $field, mixed $value, string $reason, string $severity, string $evidence): void {
    $findings[] = [
        'database'=>$database,
        'table'=>$table,
        'row_key'=>$rowKey,
        'field_or_relation'=>$field,
        'current_value'=>$value,
        'reason'=>$reason,
        'severity'=>$severity,
        'evidence'=>$evidence,
    ];
}

function dbm_audit_enum_values(string $columnType): ?array {
    if (!preg_match('/^(enum|set)\((.*)\)$/i', $columnType, $m)) return null;
    preg_match_all("/'((?:''|[^'])*)'/", $m[2], $matches);
    return array_map(static fn(string $v): string => str_replace("''", "'", $v), $matches[1] ?? []);
}

function dbm_audit_unique_indexes(mysqli $db, string $database, string $tableName, array $table, array &$findings, array &$checks, int $sampleLimit): void {
    $qt = dbm_audit_quote_ident($tableName);
    $indexes = [];
    if (is_array($table['primary_key'] ?? null)) $indexes[] = $table['primary_key'];
    foreach (($table['unique_indexes'] ?? []) as $idx) if (is_array($idx)) $indexes[] = $idx;
    foreach ($indexes as $index) {
        $cols = [];
        foreach (($index['columns'] ?? []) as $c) if (is_array($c) && ($c['column_name'] ?? '') !== '') $cols[] = (string)$c['column_name'];
        if ($cols === []) continue;
        $qcols = array_map('dbm_audit_quote_ident', $cols);
        $notNull = implode(' AND ', array_map(static fn($c) => "$c IS NOT NULL", $qcols));
        $group = implode(',', $qcols);
        $sql = "SELECT $group,COUNT(*) duplicate_count FROM $qt WHERE $notNull GROUP BY $group HAVING COUNT(*)>1 LIMIT " . (int)$sampleLimit;
        $checks[] = ['table'=>$tableName,'check'=>'unique_duplicates','object'=>(string)($index['index_name'] ?? 'UNIQUE')];
        foreach (dbm_audit_query_rows($db, $sql, $sampleLimit) as $row) {
            dbm_audit_finding($findings,$database,$tableName,json_encode(array_intersect_key($row,array_flip($cols)),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),(string)($index['index_name']??'UNIQUE'),$row,'Duplicate values violate a declared PRIMARY/UNIQUE key.','ERROR','Declared PRIMARY/UNIQUE index; GROUP BY key columns returned COUNT(*) > 1.');
        }
    }
}

function dbm_audit_foreign_keys(mysqli $db, string $database, string $tableName, array $table, array &$findings, array &$checks, int $sampleLimit): void {
    $child = dbm_audit_quote_ident($tableName);
    foreach (($table['foreign_keys'] ?? []) as $fk) {
        if (!is_array($fk)) continue;
        $parentName = (string)($fk['referenced_table_name'] ?? '');
        $pairs = $fk['columns'] ?? [];
        if ($parentName === '' || !is_array($pairs) || $pairs === []) continue;
        $joins=[]; $present=[]; $missing=[];
        foreach ($pairs as $pair) {
            if (!is_array($pair)) continue;
            $cc=(string)($pair['column_name']??''); $pc=(string)($pair['referenced_column_name']??'');
            if ($cc===''||$pc==='') continue;
            $joins[]='c.'.dbm_audit_quote_ident($cc).' = p.'.dbm_audit_quote_ident($pc);
            $present[]='c.'.dbm_audit_quote_ident($cc).' IS NOT NULL';
            $missing[]='p.'.dbm_audit_quote_ident($pc).' IS NULL';
        }
        if ($joins===[]) continue;
        $parent=dbm_audit_quote_ident($parentName);
        $rowKey=dbm_audit_row_identity_sql($table,'c');
        $sql="SELECT $rowKey row_key FROM $child c LEFT JOIN $parent p ON ".implode(' AND ',$joins).' WHERE '.implode(' AND ',$present).' AND '.implode(' AND ',$missing).' LIMIT '.(int)$sampleLimit;
        $name=(string)($fk['constraint_name']??($tableName.'->'.$parentName));
        $checks[]=['table'=>$tableName,'check'=>'foreign_key_orphans','object'=>$name];
        foreach (dbm_audit_query_rows($db,$sql,$sampleLimit) as $row) {
            dbm_audit_finding($findings,$database,$tableName,(string)($row['row_key']??''),$name,null,"Foreign-key row has no matching parent row in $parentName.",'ERROR',"Declared FOREIGN KEY $name; LEFT JOIN found no referenced row.");
        }
    }
}

function dbm_audit_domains_dates_fingerprint(mysqli $db, string $database, string $tableName, array $table, array &$findings, array &$checks, int $sampleLimit): void {
    $qt=dbm_audit_quote_ident($tableName); $columns=dbm_audit_column_map($table); $identity=dbm_audit_row_identity_sql($table);
    foreach ($columns as $name=>$column) {
        $type=strtolower((string)($column['column_type']??'')); $qc=dbm_audit_quote_ident($name);
        $allowed=dbm_audit_enum_values($type);
        if ($allowed!==null) {
            $checks[]=['table'=>$tableName,'check'=>'declared_domain','object'=>$name];
            $quoted=array_map(static fn($v)=>"'".str_replace("'","''",$v)."'",$allowed);
            if ($quoted!==[]) {
                $sql="SELECT $identity row_key,$qc current_value FROM $qt WHERE $qc IS NOT NULL AND $qc NOT IN (".implode(',',$quoted).") LIMIT ".(int)$sampleLimit;
                foreach (dbm_audit_query_rows($db,$sql,$sampleLimit) as $row) dbm_audit_finding($findings,$database,$tableName,(string)$row['row_key'],$name,$row['current_value'],"Value is outside the column's declared ENUM/SET domain.",'ERROR','Column type declares allowed values: '.implode(', ',$allowed));
            }
        }
        if (preg_match('/^(date|datetime|timestamp)/',$type)) {
            $checks[]=['table'=>$tableName,'check'=>'zero_date','object'=>$name];
            $sql="SELECT $identity row_key,CAST($qc AS CHAR) current_value FROM $qt WHERE CAST($qc AS CHAR) LIKE '0000-00-00%' LIMIT ".(int)$sampleLimit;
            foreach (dbm_audit_query_rows($db,$sql,$sampleLimit) as $row) dbm_audit_finding($findings,$database,$tableName,(string)$row['row_key'],$name,$row['current_value'],'Zero date/timestamp is not a valid calendar date.','ERROR','DATE/DATETIME/TIMESTAMP column contains 0000-00-00 representation.');
        }
    }
    if (isset($columns['fingerprint'])) {
        $covered=false;
        foreach (($table['unique_indexes']??[]) as $idx) foreach (($idx['columns']??[]) as $c) if (($c['column_name']??null)==='fingerprint') $covered=true;
        if (!$covered) {
            $checks[]=['table'=>$tableName,'check'=>'duplicate_fingerprint','object'=>'fingerprint'];
            $sql="SELECT `fingerprint`,COUNT(*) duplicate_count FROM $qt WHERE `fingerprint` IS NOT NULL AND `fingerprint`<>'' GROUP BY `fingerprint` HAVING COUNT(*)>1 LIMIT ".(int)$sampleLimit;
            foreach (dbm_audit_query_rows($db,$sql,$sampleLimit) as $row) dbm_audit_finding($findings,$database,$tableName,'fingerprint='.$row['fingerprint'],'fingerprint',$row['fingerprint'],'Fingerprint is repeated in multiple rows; this is objectively duplicate content identity but may be intentional if no UNIQUE rule exists.','WARNING','Column named fingerprint has repeated non-empty value and no declared UNIQUE constraint.');
        }
    }
}

function dbm_data_audit(array $payload): array {
    $target=trim((string)($payload['target']??''));
    if ($target==='') throw new InvalidArgumentException('target is required.');
    [$database,$db]=dbm_storage($target);
    $schema=dbm_schema($db,$database,false); $map=dbm_audit_table_map($schema);
    $tables=dbm_audit_select_tables($payload,$schema);
    $sampleLimit=min(max((int)($payload['sample_limit']??20),1),100);
    $findings=[]; $checks=[]; $notExecutable=[]; $rowsAnalyzed=0;
    foreach ($tables as $name) {
        $table=$map[$name]; $qt=dbm_audit_quote_ident($name);
        $rowsAnalyzed += dbm_audit_count($db,"SELECT COUNT(*) c FROM $qt");
        dbm_audit_unique_indexes($db,$database,$name,$table,$findings,$checks,$sampleLimit);
        dbm_audit_foreign_keys($db,$database,$name,$table,$findings,$checks,$sampleLimit);
        dbm_audit_domains_dates_fingerprint($db,$database,$name,$table,$findings,$checks,$sampleLimit);
    }
    $notExecutable[]=['check'=>'logical_relationships_without_declared_fk','reason'=>'Not inferred automatically: a logical relationship must be declared as a foreign key or supplied as an explicit rule in a future dedicated audit request.'];
    $notExecutable[]=['check'=>'semantic_domains_without_schema_constraint','reason'=>'Not inferred from rarity/frequency alone; no anomaly is declared without a structural or explicit rule.'];
    $errors=count(array_filter($findings,static fn($f)=>($f['severity']??'')==='ERROR'));
    $warnings=count(array_filter($findings,static fn($f)=>($f['severity']??'')==='WARNING'));
    return [
        'status'=>($errors===0&&$warnings===0)?'CONSISTENT':($errors>0?'ERROR':'WARNING'),
        'target'=>$target,
        'database'=>$database,
        'tables_analyzed'=>count($tables),
        'rows_analyzed'=>$rowsAnalyzed,
        'error_count'=>$errors,
        'warning_count'=>$warnings,
        'checks_executed'=>$checks,
        'checks_not_executable'=>$notExecutable,
        'findings'=>$findings,
    ];
}
