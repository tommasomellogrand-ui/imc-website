<?php
declare(strict_types=1);

function smm_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $path = dirname(__DIR__, 2) . '/__imc_private_sm_master/config.php';
        if (!is_file($path)) {
            throw new RuntimeException('Private configuration not found.');
        }
        $cfg = require $path;
    }
    return $cfg;
}

function smm_db(): mysqli {
    static $db = null;
    if ($db instanceof mysqli) return $db;
    $c = smm_config()['db'];
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = new mysqli($c['host'], $c['user'], $c['password'], $c['database']);
    $db->set_charset('utf8mb4');
    return $db;
}

function smm_require_auth(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (!empty($_SESSION['sm_master_auth'])) return;
    $token = (string)($_REQUEST['token'] ?? '');
    $expected = (string)smm_config()['admin_token'];
    if ($token !== '' && hash_equals($expected, $token)) {
        $_SESSION['sm_master_auth'] = true;
        return;
    }
    http_response_code(403);
    throw new RuntimeException('Unauthorized');
}

function smm_json(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function smm_data_dir(): string {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException('Cannot create data directory.');
    }
    return $dir;
}

function smm_install_schema(): array {
    $schema = dirname(__DIR__) . '/schema.sql';
    if (!is_file($schema)) throw new RuntimeException('Schema file missing.');
    $sql = file_get_contents($schema);
    $db = smm_db();
    $db->multi_query($sql);
    do {
        if ($res = $db->store_result()) $res->free();
    } while ($db->more_results() && $db->next_result());
    $version = $db->server_info;
    $res = $db->query("SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE()");
    $tables = (int)$res->fetch_assoc()['c'];
    return ['version' => $version, 'tables' => $tables];
}

function smm_q(mysqli $db, string $value): string {
    return "'" . $db->real_escape_string($value) . "'";
}

function smm_batch_upsert(mysqli $db, string $table, array $columns, array $rows, array $updateColumns): void {
    if (!$rows) return;
    $parts = [];
    foreach ($rows as $row) {
        $vals = [];
        foreach ($columns as $col) {
            $v = $row[$col] ?? null;
            if ($v === null) $vals[] = 'NULL';
            elseif (is_int($v) || is_float($v)) $vals[] = (string)$v;
            else $vals[] = smm_q($db, (string)$v);
        }
        $parts[] = '(' . implode(',', $vals) . ')';
    }
    $updates = [];
    foreach ($updateColumns as $col) $updates[] = "`$col`=VALUES(`$col`)";
    $sql = "INSERT INTO `$table` (`" . implode('`,`', $columns) . "`) VALUES " . implode(',', $parts) .
        " ON DUPLICATE KEY UPDATE " . implode(',', $updates);
    $db->query($sql);
}

function smm_create_snapshot(string $source, string $date, string $filename, string $path): array {
    $db = smm_db();
    $sha = hash_file('sha256', $path);
    $size = filesize($path);
    $stmt = $db->prepare('SELECT snapshot_id,status FROM source_snapshots WHERE source_code=? AND sha256=? LIMIT 1');
    $stmt->bind_param('ss', $source, $sha);
    $stmt->execute();
    $found = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($found && $found['status'] === 'success') {
        return ['duplicate' => true, 'snapshot_id' => (int)$found['snapshot_id'], 'sha256' => $sha, 'file_size' => $size];
    }
    if ($found) {
        $id = (int)$found['snapshot_id'];
        $stmt = $db->prepare("UPDATE source_snapshots SET snapshot_date=?,source_filename=?,file_size=?,status='running',counts_json=NULL,error_message=NULL WHERE snapshot_id=?");
        $stmt->bind_param('ssii', $date, $filename, $size, $id);
        $stmt->execute(); $stmt->close();
    } else {
        $stmt = $db->prepare("INSERT INTO source_snapshots(source_code,snapshot_date,source_filename,sha256,file_size,status) VALUES(?,?,?,?,?,'running')");
        $stmt->bind_param('ssssi', $source, $date, $filename, $sha, $size);
        $stmt->execute(); $id = (int)$db->insert_id; $stmt->close();
    }
    return ['duplicate' => false, 'snapshot_id' => $id, 'sha256' => $sha, 'file_size' => $size];
}

function smm_finish_snapshot(int $id, array $counts): void {
    $db = smm_db();
    $json = json_encode($counts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $db->prepare("UPDATE source_snapshots SET status='success', imported_at=NOW(), counts_json=?, error_message=NULL WHERE snapshot_id=?");
    $stmt->bind_param('si', $json, $id); $stmt->execute(); $stmt->close();
}

function smm_fail_snapshot(int $id, string $source, string $phase, Throwable $e): void {
    $db = smm_db();
    $msg = mb_substr($e->getMessage(), 0, 4000);
    $stmt = $db->prepare("UPDATE source_snapshots SET status='failed', error_message=? WHERE snapshot_id=?");
    $stmt->bind_param('si', $msg, $id); $stmt->execute(); $stmt->close();
    $stmt = $db->prepare('INSERT INTO import_errors(snapshot_id,source_code,phase,error_message) VALUES(?,?,?,?)');
    $stmt->bind_param('isss', $id, $source, $phase, $msg); $stmt->execute(); $stmt->close();
}

function smm_archive_file(string $path,string $source,string $date,string $sha,string $ext): void {
    $dir=smm_data_dir().'/archive/'.$date; if(!is_dir($dir))mkdir($dir,0700,true);
    $dest=$dir.'/'.$source.'_'.$sha.'.'.$ext;
    if(!is_file($dest)){ if(!rename($path,$dest)){ if(!copy($path,$dest))throw new RuntimeException('Cannot archive source file.'); @unlink($path); } }
}
