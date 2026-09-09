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
    $result = $db->query($sql);
    $row = $result->fetch_assoc();
    $result->free();
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

function dbm_audit_semantic_severity(array $rule): string {
    $severity = strtoupper(trim((string)($rule['severity'] ?? 'ERROR')));
    if (!in_array($severity, ['ERROR','WARNING'], true)) throw new InvalidArgumentException('Semantic rule severity must be ERROR or WARNING.');
    return $severity;
}

function dbm_audit_semantic_rule_id(array $rule, int $index): string {
    $id = trim((string)($rule['id'] ?? ''));
    return $id !== '' ? $id : 'semantic_rule_' . ($index + 1);
}

function dbm_audit_semantic_assert_column(array $table, string $column): void {
    if ($column === '' || !isset(dbm_audit_column_map($table)[$column])) throw new InvalidArgumentException("Unknown semantic-rule column: $column");
}

function dbm_audit_semantic_literal(mysqli $db, mixed $value): string {
    if ($value === null) return 'NULL';
    if (is_bool($value)) return $value ? '1' : '0';
    if (is_int($value) || is_float($value)) return (string)$value;
    return "'" . $db->real_escape_string((string)$value) . "'";
}

function dbm_audit_semantic_operand(mysqli $db, array $table, array $operand, string $alias='s'): string {
    if (isset($operand['column'])) {
        $column = trim((string)$operand['column']);
        dbm_audit_semantic_assert_column($table,$column);
        return dbm_audit_quote_ident($alias) . '.' . dbm_audit_quote_ident($column);
    }
    if (array_key_exists('literal',$operand)) return dbm_audit_semantic_literal($db,$operand['literal']);
    $function = trim((string)($operand['function'] ?? ''));
    if ($function === 'age_years_today') {
        $column = trim((string)($operand['column'] ?? ''));
        dbm_audit_semantic_assert_column($table,$column);
        return 'TIMESTAMPDIFF(YEAR,' . dbm_audit_quote_ident($alias) . '.' . dbm_audit_quote_ident($column) . ',CURDATE())';
    }
    if ($function === 'date_only') {
        $column = trim((string)($operand['column'] ?? ''));
        dbm_audit_semantic_assert_column($table,$column);
        return 'DATE(' . dbm_audit_quote_ident($alias) . '.' . dbm_audit_quote_ident($column) . ')';
    }
    throw new InvalidArgumentException('Unsupported semantic operand.');
}

function dbm_audit_semantic_compare_operator(string $operator): string {
    return match (strtolower(trim($operator))) {
        'eq','=' => '=',
        'ne','!=','<>' => '<>',
        'lt','<' => '<',
        'lte','<=' => '<=',
        'gt','>' => '>',
        'gte','>=' => '>=',
        default => throw new InvalidArgumentException('Unsupported semantic comparison operator.'),
    };
}

function dbm_audit_semantic_current_value_expr(array $table, array $rule, string $alias='s'): string {
    $fields = [];
    foreach (($rule['report_columns'] ?? []) as $column) {
        if (!is_string($column)) continue;
        dbm_audit_semantic_assert_column($table,$column);
        $q = dbm_audit_quote_ident($alias) . '.' . dbm_audit_quote_ident($column);
        $fields[] = "'" . str_replace("'","''",$column) . "'";
        $fields[] = $q;
    }
    if ($fields === []) return 'NULL';
    return 'JSON_OBJECT(' . implode(',', $fields) . ')';
}

function dbm_audit_semantic_run_rule(mysqli $db, string $database, string $tableName, array $table, array $schemaMap, array $rule, int $ruleIndex, array &$findings, array &$checks, int $sampleLimit): void {
    $type = strtolower(trim((string)($rule['type'] ?? '')));
    $ruleId = dbm_audit_semantic_rule_id($rule,$ruleIndex);
    $severity = dbm_audit_semantic_severity($rule);
    $reason = trim((string)($rule['reason'] ?? 'Semantic consistency rule violated.'));
    $evidence = trim((string)($rule['evidence'] ?? 'Explicit deterministic semantic rule supplied to data_audit.'));
    $qt = dbm_audit_quote_ident($tableName);
    $rowKey = dbm_audit_row_identity_sql($table,'s');
    $currentValue = dbm_audit_semantic_current_value_expr($table,$rule,'s');
    $where = '';

    if ($type === 'compare') {
        $left = dbm_audit_semantic_operand($db,$table,is_array($rule['left']??null)?$rule['left']:[],'s');
        $right = dbm_audit_semantic_operand($db,$table,is_array($rule['right']??null)?$rule['right']:[],'s');
        $op = dbm_audit_semantic_compare_operator((string)($rule['operator'] ?? 'eq'));
        $nullPolicy = strtolower(trim((string)($rule['null_policy'] ?? 'skip')));
        if (!in_array($nullPolicy,['skip','compare'],true)) throw new InvalidArgumentException('Unsupported null_policy.');
        $where = ($nullPolicy === 'skip' ? "$left IS NOT NULL AND $right IS NOT NULL AND " : '') . "NOT ($left $op $right)";
    } elseif ($type === 'all_or_none') {
        $columns = array_values(array_filter($rule['columns'] ?? [],'is_string'));
        if (count($columns) < 2) throw new InvalidArgumentException('all_or_none requires at least two columns.');
        $present=[];
        foreach ($columns as $column) { dbm_audit_semantic_assert_column($table,$column); $present[]='s.'.dbm_audit_quote_ident($column).' IS NOT NULL'; }
        $sum = implode(' + ',array_map(static fn($x)=>"($x)",$present));
        $where = "(($sum) > 0 AND ($sum) < " . count($present) . ')';
    } elseif ($type === 'allowed_values') {
        $column=trim((string)($rule['column']??'')); dbm_audit_semantic_assert_column($table,$column);
        $values=$rule['values']??null; if (!is_array($values)||$values===[]) throw new InvalidArgumentException('allowed_values requires non-empty values.');
        $quoted=array_map(static fn($v)=>$v,$values);
        $quoted=array_map(fn($v)=>dbm_audit_semantic_literal($db,$v),$quoted);
        $qc='s.'.dbm_audit_quote_ident($column);
        $where="$qc IS NOT NULL AND $qc NOT IN (".implode(',',$quoted).')';
    } elseif ($type === 'domain_from_table') {
        $column=trim((string)($rule['column']??'')); dbm_audit_semantic_assert_column($table,$column);
        $refTable=trim((string)($rule['reference_table']??'')); $refColumn=trim((string)($rule['reference_column']??''));
        if (!isset($schemaMap[$refTable])) throw new InvalidArgumentException('Unknown reference_table in semantic rule.');
        dbm_audit_semantic_assert_column($schemaMap[$refTable],$refColumn);
        $qc='s.'.dbm_audit_quote_ident($column);
        $where="$qc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ".dbm_audit_quote_ident($refTable).' r WHERE r.'.dbm_audit_quote_ident($refColumn)." = $qc)";
    } elseif ($type === 'temporal_order') {
        $earlier=trim((string)($rule['earlier']??'')); $later=trim((string)($rule['later']??''));
        dbm_audit_semantic_assert_column($table,$earlier); dbm_audit_semantic_assert_column($table,$later);
        $allowEqual=($rule['allow_equal']??true)===true;
        $qe='s.'.dbm_audit_quote_ident($earlier); $ql='s.'.dbm_audit_quote_ident($later);
        $where="$qe IS NOT NULL AND $ql IS NOT NULL AND $qe " . ($allowEqual?'>':'>=') . " $ql";
    } elseif ($type === 'relation_exists' || $type === 'relation_absent') {
        $refTable=trim((string)($rule['reference_table']??'')); if (!isset($schemaMap[$refTable])) throw new InvalidArgumentException('Unknown reference_table in semantic rule.');
        $pairs=$rule['mapping']??null; if (!is_array($pairs)||$pairs===[]) throw new InvalidArgumentException('relation rule requires mapping.');
        $joins=[]; $present=[];
        foreach ($pairs as $pair) {
            if (!is_array($pair)) continue;
            $source=trim((string)($pair['source']??'')); $reference=trim((string)($pair['reference']??''));
            dbm_audit_semantic_assert_column($table,$source); dbm_audit_semantic_assert_column($schemaMap[$refTable],$reference);
            $joins[]='r.'.dbm_audit_quote_ident($reference).' = s.'.dbm_audit_quote_ident($source);
            $present[]='s.'.dbm_audit_quote_ident($source).' IS NOT NULL';
        }
        if ($joins===[]) throw new InvalidArgumentException('relation rule mapping is empty.');
        $exists='EXISTS (SELECT 1 FROM '.dbm_audit_quote_ident($refTable).' r WHERE '.implode(' AND ',$joins).')';
        $where=implode(' AND ',$present).' AND '.($type==='relation_exists'?"NOT $exists":$exists);
    } elseif ($type === 'current_vs_latest') {
        $sourceColumn=trim((string)($rule['current_column']??'')); dbm_audit_semantic_assert_column($table,$sourceColumn);
        $historyTable=trim((string)($rule['history_table']??'')); if (!isset($schemaMap[$historyTable])) throw new InvalidArgumentException('Unknown history_table in semantic rule.');
        $historyValue=trim((string)($rule['history_value_column']??'')); $historyOrder=trim((string)($rule['history_order_column']??''));
        dbm_audit_semantic_assert_column($schemaMap[$historyTable],$historyValue); dbm_audit_semantic_assert_column($schemaMap[$historyTable],$historyOrder);
        $pairs=$rule['mapping']??null; if (!is_array($pairs)||$pairs===[]) throw new InvalidArgumentException('current_vs_latest requires mapping.');
        $joins=[];
        foreach ($pairs as $pair) {
            if (!is_array($pair)) continue;
            $source=trim((string)($pair['source']??'')); $history=trim((string)($pair['history']??''));
            dbm_audit_semantic_assert_column($table,$source); dbm_audit_semantic_assert_column($schemaMap[$historyTable],$history);
            $joins[]='h.'.dbm_audit_quote_ident($history).' = s.'.dbm_audit_quote_ident($source);
        }
        if ($joins===[]) throw new InvalidArgumentException('current_vs_latest mapping is empty.');
        $latest='(SELECT h.'.dbm_audit_quote_ident($historyValue).' FROM '.dbm_audit_quote_ident($historyTable).' h WHERE '.implode(' AND ',$joins).' ORDER BY h.'.dbm_audit_quote_ident($historyOrder).' DESC LIMIT 1)';
        $current='s.'.dbm_audit_quote_ident($sourceColumn);
        $where="$latest IS NOT NULL AND $current IS NOT NULL AND $current <> $latest";
    } else {
        throw new InvalidArgumentException("Unsupported semantic rule type: $type");
    }

    $checks[]=['table'=>$tableName,'check'=>'semantic_'.$type,'object'=>$ruleId];
    $sql="SELECT $rowKey row_key,$currentValue current_value FROM $qt s WHERE $where LIMIT ".(int)$sampleLimit;
    foreach (dbm_audit_query_rows($db,$sql,$sampleLimit) as $row) {
        $value=$row['current_value']??null;
        if (is_string($value) && ($value!=='' && ($value[0]==='{'||$value[0]==='['))) {
            $decoded=json_decode($value,true); if (json_last_error()===JSON_ERROR_NONE) $value=$decoded;
        }
        dbm_audit_finding($findings,$database,$tableName,(string)($row['row_key']??''),$ruleId,$value,$reason,$severity,$evidence);
    }
}

function dbm_audit_semantic_rules(mysqli $db, string $database, array $tables, array $schemaMap, array $rules, array &$findings, array &$checks, int $sampleLimit): void {
    if (count($rules) > 100) throw new InvalidArgumentException('At most 100 semantic rules are allowed per audit.');
    foreach ($rules as $index=>$rule) {
        if (!is_array($rule)) throw new InvalidArgumentException('Each semantic rule must be an object.');
        $scope=trim((string)($rule['table']??''));
        $targets=$scope!==''?[$scope]:$tables;
        foreach ($targets as $tableName) {
            if (!in_array($tableName,$tables,true)) continue;
            if (!isset($schemaMap[$tableName])) throw new InvalidArgumentException('Semantic rule targets unknown table.');
            dbm_audit_semantic_run_rule($db,$database,$tableName,$schemaMap[$tableName],$schemaMap,$rule,(int)$index,$findings,$checks,$sampleLimit);
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
    $semanticRules=$payload['semantic_rules']??[];
    if (!is_array($semanticRules)) throw new InvalidArgumentException('semantic_rules must be an array.');
    if ($semanticRules!==[]) dbm_audit_semantic_rules($db,$database,$tables,$map,$semanticRules,$findings,$checks,$sampleLimit);
    else {
        $notExecutable[]=['check'=>'logical_relationships_without_declared_fk','reason'=>'No explicit semantic relation rule was supplied.'];
        $notExecutable[]=['check'=>'semantic_domains_without_schema_constraint','reason'=>'No explicit semantic domain rule was supplied; rarity/frequency alone is never treated as evidence.'];
    }
    $errors=count(array_filter($findings,static fn($f)=>($f['severity']??'')==='ERROR'));
    $warnings=count(array_filter($findings,static fn($f)=>($f['severity']??'')==='WARNING'));
    return [
        'status'=>($errors===0&&$warnings===0)?'CONSISTENT':($errors>0?'ERROR':'WARNING'),
        'target'=>$target,
        'database'=>$database,
        'tables_analyzed'=>count($tables),
        'rows_analyzed'=>$rowsAnalyzed,
        'semantic_rules_supplied'=>count($semanticRules),
        'error_count'=>$errors,
        'warning_count'=>$warnings,
        'checks_executed'=>$checks,
        'checks_not_executable'=>$notExecutable,
        'findings'=>$findings,
    ];
}
