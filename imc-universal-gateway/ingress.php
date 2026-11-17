<?php
declare(strict_types=1);
require_once __DIR__.'/core.php';
/* IMC Universal Gateway · ingress-only path
 * Technical boundary only: envelope, target namespace, transport/persistence.
 * Payload row fields are intentionally opaque to the Gateway.
 */

function imc_ingress_out(array $data, int $status = 200): never {
    if(($GLOBALS['imc_legacy_read']??false)&&isset($data['rows']))$data['rows']=imc_world_compat_rows($data['rows']);else $data=imc_world_payload($data);
    imc_publish_committed_rows($data);
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
    if ($value === 'IMC_Game_World_Season') return '`IMC_Game_World_Season`';
    if (!preg_match('/^(?:GW(?:00[1-9]|01[0-5])|IMC-00[6-9]|IMC-010)_IMC_[A-Za-z0-9_-]{1,80}$/', $value) || !str_starts_with($value, $gw . '_IMC_')) {
        throw new InvalidArgumentException('target_not_allowed');
    }
    return '`' . str_replace('`', '', imc_physical_table($value)) . '`';
}

function imc_ingress_route(array $body, array $cfg): array {
    $gw = strtoupper(trim((string)($body['game_world_id'] ?? '')));
    $database = trim((string)($body['target_database'] ?? ''));
    $table = trim((string)($body['target_table'] ?? ''));
    if (!preg_match('/^(?:GW(?:00[1-9]|01[0-5])|IMC-00[6-9]|IMC-010)$/', $gw)) throw new InvalidArgumentException('invalid_game_world');

    $gold = array_map('strtoupper', (array)($cfg['gold_worlds'] ?? []));
    $custom = array_map('strtoupper', (array)($cfg['custom_worlds'] ?? []));
    if (in_array($gw, $gold, true)) $expected = (string)($cfg['db']['gold'] ?? '');
    elseif (preg_match('/^IMC-(?:00[6-9]|010)$/D',$gw) || isset($GLOBALS['imc_dynamic_worlds'][$gw]) || in_array($gw, $custom, true)) $expected = (string)($cfg['db']['custom'] ?? '');
    else throw new InvalidArgumentException('unsupported_game_world');

    if ($database === '' || !hash_equals($expected, $database)) throw new InvalidArgumentException('target_not_allowed');
    imc_ingress_table_ident($table, $gw);
    $action = strtolower(trim((string)($body['action'] ?? '')));
    if ($table === 'IMC_Game_World_Season' && $action !== 'read') throw new InvalidArgumentException('target_not_allowed');
    return ['game_world_id' => $gw, 'database' => $database, 'table' => $table];
}

function imc_ingress_db(array $cfg, string $database): PDO {
    return new IMCWorldPDO(
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

// Canonical ordinary reports carry their complete identity. The separate legacy
// World Cup importer keeps its existing normalization path.
function imc_ingress_canonical_report_batch(string $table, array $rows): bool {
    $physical=imc_physical_table($table);
    if (!preg_match('/^(IMC00[1-8])_Match_Reports$/D',$physical,$m)||!$rows) return false;
    foreach ($rows as $row) {
        $season=(int)($row['imc_season']??0);
        if (($row['game_world_id']??'')!==$m[1]||$season<1||empty($row['sm_action'])||$row['sm_action']==='worldcup'
            ||!str_starts_with((string)($row['competition_key']??''),$m[1].'|S'.str_pad((string)$season,2,'0',STR_PAD_LEFT).'|')
            ||str_contains((string)$row['competition_key'],'|NATIONS|worldcup')) return false;
    }
    return true;
}

function imc_ingress_insert_many(PDO $pdo, string $table, string $gw, array $rows, bool $atomic): array {
    if (imc_ingress_canonical_report_batch($table,$rows)) return imc_ingress_insert_rows($pdo,$table,$gw,$rows,$atomic);
    require_once __DIR__.'/worldcup-automation.php';
    if (imc_wc_target($table)!==null) {
        $outcome=imc_wc_import($pdo,$table,true,fn()=>imc_ingress_insert_rows($pdo,$table,$gw,$rows,false));
        return $outcome['written']+['normalization'=>$outcome['normalization']];
    }
    return imc_ingress_insert_rows($pdo,$table,$gw,$rows,$atomic);
}

function imc_ingress_insert_rows(PDO $pdo, string $table, string $gw, array $rows, bool $atomic): array {
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
        if ($atomic && $pdo->inTransaction()) $pdo->rollBack();
        if (!$atomic && $written > 0) imc_publish_committed_rows(['ok'=>true,'written_rows'=>$written,'table'=>$table]);
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

// Complete one existing ordinary report without replacing known values or JSON.
function imc_ingress_merge_missing(mixed $current,mixed $incoming): mixed {
    if ($current===null||$current==='') return $incoming;
    if (is_array($current)) return $current ? $current : $incoming;
    if (is_object($current)&&is_object($incoming)) {
        $out=clone $current;
        foreach(get_object_vars($incoming) as $key=>$value) $out->$key=imc_ingress_merge_missing($current->$key??null,$value);
        return $out;
    }
    return $current;
}
function imc_ingress_worldcup_report_key(array $row,string $world,int $season): bool {
    if ($season<1) return false;
    $key=(string)imc_world_value($row['competition_key']??'');
    return in_array($key,[$world.'|NATIONS|worldcup',$world.'|S'.str_pad((string)$season,2,'0',STR_PAD_LEFT).'|NATIONS|worldcup'],true);
}

function imc_ingress_confirm_worldcup_knockout(PDO $pdo,array $row): void {
    $world=$row['game_world_id'];
    $q=$pdo->prepare("SELECT * FROM `{$world}_Results` WHERE game_world_id=? AND sm_fixture_id=? LIMIT 2");
    $q->execute([$world,$row['sm_fixture_id']]);
    $matches=$q->fetchAll(PDO::FETCH_ASSOC);
    $result=$matches[0]??[];
    $phase='/^(?:(?:ottavi|quarti|sedicesimi|semifinal[ei]?|finalee?|final|semi.?finals?|quarter.?finals?)(?:\b|$)|round of (?:16|32)\b|knock[ -]?out\b|eliminazione diretta\b)/i';
    if (count($matches)!==1 || (int)($result['imc_season']??0)!==(int)$row['imc_season']
        || ($result['sm_action']??'')!=='worldcup' || ($result['competition_group']??'')!=='NATIONS'
        || !imc_ingress_worldcup_report_key($result,$world,(int)$row['imc_season'])
        || trim((string)($result['competition_group_name']??''))!==''
        || !(preg_match($phase,trim((string)($result['competition_stage']??''))) || preg_match($phase,trim((string)($result['competition_round']??'')))))
        throw new InvalidArgumentException('worldcup_knockout_result_required');
    foreach (['match_date','competition_stage','competition_round','home_sm_club_id','away_sm_club_id'] as $field) {
        if (isset($result[$field]) && (string)$result[$field] !== (string)($row[$field]??''))
            throw new RuntimeException('report_identity_conflict');
    }
}

function imc_ingress_repair_report(PDO $pdo,string $table,string $gw,array $row): array {
    // The explicit route uses a legacy world alias; persisted report identity is canonical.
    if(isset($row['game_world_id']))$row['game_world_id']=imc_world_id((string)$row['game_world_id']);
    if(isset($row['competition_key']))$row['competition_key']=imc_world_value($row['competition_key']);
    $world=(string)($row['game_world_id']??'');
    $season=(int)($row['imc_season']??0);
    $worldcup=($row['sm_action']??'')==='worldcup' && ($row['competition_group']??'')==='NATIONS'
        && preg_match('/^IMC00[1-8]$/D',$world) && imc_physical_table($table)===$world.'_Match_Reports'
        && imc_ingress_worldcup_report_key($row,$world,$season) && trim((string)($row['competition_group_name']??''))==='';
    if ((!$worldcup&&!imc_ingress_canonical_report_batch($table,[$row]))||!is_numeric($row['sm_fixture_id']??null)||(int)$row['sm_fixture_id']<1) throw new InvalidArgumentException('invalid_report_repair');
    $allowed=['game_world_id','sm_fixture_id','competition_key','imc_season','sm_action','sm_division','competition_group','competition_group_name','competition_stage','competition_round','match_date','home_sm_club_id','home_name','away_sm_club_id','away_name','home_score','away_score','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score','home_sm_manager_id','home_manager_name','away_sm_manager_id','away_manager_name','stadium_name','attendance','team_stats_json','players_json','events_json','tactics_json','commentary_json','fingerprint','imported_at'];
    if (array_diff(array_keys($row),$allowed)) throw new InvalidArgumentException('invalid_report_field');
    $tableSql=imc_ingress_table_ident($table,$gw);
    $pdo->beginTransaction();
    try {
        if ($worldcup) imc_ingress_confirm_worldcup_knockout($pdo,$row);
        $q=$pdo->prepare("SELECT * FROM $tableSql WHERE game_world_id=? AND sm_fixture_id=? LIMIT 2 FOR UPDATE");
        $q->execute([$row['game_world_id'],$row['sm_fixture_id']]);$matches=$q->fetchAll(PDO::FETCH_ASSOC);
        if(count($matches)!==1)throw new RuntimeException('report_missing_or_duplicated');
        $old=$matches[0];
        if (!$worldcup && (($old['sm_action']??'')==='worldcup'||str_contains((string)($old['competition_key']??''),'|NATIONS|worldcup')))
            throw new InvalidArgumentException('dedicated_worldcup_importer_required');
        $sameKey=$old['competition_key']===$row['competition_key']||($worldcup&&imc_ingress_worldcup_report_key($old,$world,$season));
        if((trim((string)($old['competition_key']??''))!==''&&!$sameKey)||((int)($old['imc_season']??0)>0&&(int)$old['imc_season']!==$season))throw new RuntimeException('report_identity_conflict');
        $patch=[];
        foreach($row as $key=>$value){
            if(in_array($key,['game_world_id','sm_fixture_id'],true))continue;
            if(str_ends_with($key,'_json')){
                $current=json_decode((string)($old[$key]??'null'),false,512,JSON_THROW_ON_ERROR);
                $incoming=json_decode(imc_ingress_scalar($value)??'null',false,512,JSON_THROW_ON_ERROR);
                $merged=imc_ingress_merge_missing($current,$incoming);
                if(json_encode($current)!==json_encode($merged))$patch[$key]=json_encode($merged,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
            } elseif(($old[$key]===null||$old[$key]==='')&&$value!==null&&$value!=='')$patch[$key]=$value;
        }
        $written=0;
        if($patch){
            $set=implode(',',array_map(fn($key)=>imc_ingress_ident($key).'=?',array_keys($patch)));
            $q=$pdo->prepare("UPDATE $tableSql SET $set WHERE game_world_id=? AND sm_fixture_id=?");
            $q->execute([...array_values($patch),$row['game_world_id'],$row['sm_fixture_id']]);$written=$q->rowCount();
            if($written!==1)throw new RuntimeException('report_repair_not_confirmed');
        }
        $pdo->commit();return ['matched_rows'=>1,'updated_rows'=>$written,'written_rows'=>$written,'inserted_rows'=>0,'skipped_rows'=>$written?0:1];
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}

function imc_ingress_run(array $body): never {
    try {
        $channel = strtoupper(trim((string)($body['channel'] ?? ($_SERVER['HTTP_X_IMC_CHANNEL'] ?? ''))));
        $action = strtolower(trim((string)($body['action'] ?? '')));
        if ($channel !== 'IMPORT') throw new InvalidArgumentException('invalid_channel');
        if (!in_array($action, ['read', 'insert_many', 'repair_report'], true)) throw new InvalidArgumentException('action_not_allowed');
        if (strtolower(trim((string)($body['route_mode'] ?? ''))) !== 'explicit') throw new InvalidArgumentException('explicit_route_required');

        $cfg = imc_ingress_cfg();
        $requestedTable=(string)($body['target_table']??'');
        $body = imc_normalize_world_request($body, $cfg, $channel);
        $route = imc_ingress_route($body, $cfg);
        $pdo = imc_ingress_db($cfg, $route['database']);
        $base = ['ok' => true, 'IMC_WORLD_ID' => $body['IMC_WORLD_ID'] ?? null, 'service' => 'IMC Universal Gateway', 'mode' => 'INGRESS_ONLY', 'action' => $action, 'channel' => 'IMPORT', 'game_world_id' => $route['game_world_id'], 'database' => $route['database'], 'table' => (str_starts_with($requestedTable,'GW')?$requestedTable:imc_physical_table($route['table'])), 'physical_table'=>imc_physical_table($route['table']), 'trace_id' => $body['trace_id'] ?? null];

        if ($action === 'read') imc_ingress_out($base + imc_ingress_read($pdo, $route['table'], $route['game_world_id'], $body));
        if ($action==='repair_report') imc_ingress_out($base+imc_ingress_repair_report($pdo,$route['table'],$route['game_world_id'],is_array($body['row']??null)?$body['row']:[]));
        $rows = $body['rows'] ?? $body['items'] ?? null;
        if (!is_array($rows)) throw new InvalidArgumentException('rows_required');
        $written = imc_ingress_insert_many($pdo, $route['table'], $route['game_world_id'], $rows, ($body['atomic'] ?? true) !== false);
        $refresh = imc_after_results_import($pdo, $route['table'], $route['game_world_id'], $rows);
        imc_ingress_out($base + $written + $refresh);
    } catch (Throwable $e) {
        $status = $e instanceof InvalidArgumentException ? 422 : 500;
        imc_ingress_out(['ok' => false, 'mode' => 'INGRESS_ONLY', 'error' => $e->getMessage()], $status);
    }
}


