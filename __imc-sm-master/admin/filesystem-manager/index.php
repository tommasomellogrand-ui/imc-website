<?php
declare(strict_types=1);

const IMC_FSM_VERSION = '1.0.0';
const IMC_FSM_MAX_BODY = 12582912;
const IMC_FSM_MAX_FILE = 8388608;
const IMC_FSM_PLAN_TTL = 900;

function fsm_reply(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fsm_key(): string {
    $file = __DIR__ . '/connector-key.php';
    $key = is_file($file) ? (string)(require $file) : '';
    if (strlen($key) < 32) throw new RuntimeException('Connector key is not configured.', 503);
    return $key;
}

function fsm_auth(): void {
    $https = strtolower((string)($_SERVER['HTTPS'] ?? ''));
    $forwarded = strtolower(trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
    if ($https !== 'on' && $https !== '1' && $forwarded !== 'https') throw new RuntimeException('HTTPS required.', 400);
    $token = trim((string)($_SERVER['HTTP_X_IMC_TOKEN'] ?? ''));
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if ($token === '') $token = trim((string)($headers['X-IMC-Token'] ?? $headers['x-imc-token'] ?? ''));
    }
    if ($token === '' || !hash_equals(fsm_key(), $token)) throw new RuntimeException('Unauthorized.', 401);
}

function fsm_payload(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') throw new RuntimeException('POST required.', 405);
    $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($type !== 'application/json') throw new RuntimeException('Content-Type application/json required.', 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > IMC_FSM_MAX_BODY) throw new RuntimeException('Payload too large.', 413);
    $raw = file_get_contents('php://input', false, null, 0, IMC_FSM_MAX_BODY + 1);
    if (!is_string($raw) || $raw === '') throw new InvalidArgumentException('Empty JSON payload.');
    $value = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($value)) throw new InvalidArgumentException('JSON object required.');
    return $value;
}

function fsm_root(): string {
    $root = realpath(dirname(__DIR__, 3));
    if ($root === false || !is_dir($root)) throw new RuntimeException('Document root cannot be resolved.', 500);
    return rtrim(str_replace('\\', '/', $root), '/');
}

function fsm_normalize(string $path, bool $allowRoot = false): string {
    $path = trim(str_replace('\\', '/', $path));
    $path = preg_replace('#/+#', '/', $path) ?? $path;
    $path = trim($path, '/');
    if ($path === '' && $allowRoot) return '';
    if ($path === '' || str_contains($path, "\0")) throw new InvalidArgumentException('Invalid path.');
    $parts = explode('/', $path);
    foreach ($parts as $part) {
        if ($part === '' || $part === '.' || $part === '..') throw new InvalidArgumentException('Invalid path segment.');
    }
    $lower = strtolower($path);
    $blocked = [
        '__imc_private_sm_master',
        '__imc-sm-master/admin/filesystem-manager',
        '.git',
        '.github',
    ];
    foreach ($blocked as $prefix) {
        if ($lower === $prefix || str_starts_with($lower, $prefix . '/')) throw new RuntimeException('Protected path.', 403);
    }
    $base = strtolower(basename($path));
    if (in_array($base, ['.env', 'connector-key.php'], true)) throw new RuntimeException('Protected file.', 403);
    return $path;
}

function fsm_absolute(string $relative, bool $allowRoot = false): string {
    $relative = fsm_normalize($relative, $allowRoot);
    return fsm_root() . ($relative === '' ? '' : '/' . $relative);
}

function fsm_assert_safe_parents(string $relative): void {
    $root = fsm_root();
    $cursor = $root;
    $parts = explode('/', dirname($relative) === '.' ? '' : dirname($relative));
    foreach ($parts as $part) {
        if ($part === '') continue;
        $cursor .= '/' . $part;
        if (is_link($cursor)) throw new RuntimeException('Symbolic-link paths are forbidden.', 403);
        if (file_exists($cursor) && !is_dir($cursor)) throw new RuntimeException('A parent path is not a directory.', 409);
    }
}

function fsm_log_dir(): string {
    $dir = fsm_root() . '/__imc_private_sm_master/filesystem-manager';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('Cannot create protected log directory.');
    $deny = $dir . '/.htaccess';
    if (!is_file($deny)) file_put_contents($deny, "Options -Indexes\nRequire all denied\n", LOCK_EX);
    return $dir;
}

function fsm_audit(array $record): void {
    $record = array_merge(['timestamp' => gmdate('c'), 'remote_ip' => (string)($_SERVER['REMOTE_ADDR'] ?? '')], $record);
    $line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    if (file_put_contents(fsm_log_dir() . '/audit.jsonl', $line, FILE_APPEND | LOCK_EX) === false) throw new RuntimeException('Cannot write audit log.');
}

function fsm_canonical(array $value): string {
    $sort = static function (&$item) use (&$sort): void {
        if (!is_array($item)) return;
        foreach ($item as &$child) $sort($child);
        unset($child);
        if (!array_is_list($item)) ksort($item, SORT_STRING);
    };
    $sort($value);
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}

function fsm_plan(array $operation): array {
    $expires = time() + IMC_FSM_PLAN_TTL;
    $hash = hash('sha256', fsm_canonical($operation));
    $signature = hash_hmac('sha256', $hash . '|' . $expires, fsm_key());
    return ['operation' => $operation, 'plan_sha256' => $hash, 'expires_at' => gmdate('c', $expires), 'confirmation_token' => $expires . '.' . $signature];
}

function fsm_verify(array $operation, string $token): void {
    if (!preg_match('/^(\d+)\.([a-f0-9]{64})$/', $token, $m)) throw new InvalidArgumentException('Invalid confirmation token.');
    $expires = (int)$m[1];
    if ($expires < time() || $expires > time() + IMC_FSM_PLAN_TTL + 60) throw new RuntimeException('Confirmation token expired or invalid.', 409);
    $hash = hash('sha256', fsm_canonical($operation));
    $expected = hash_hmac('sha256', $hash . '|' . $expires, fsm_key());
    if (!hash_equals($expected, $m[2])) throw new RuntimeException('Operation changed after confirmation.', 409);
}

function fsm_decode(array $payload): array {
    $encoding = strtolower((string)($payload['encoding'] ?? 'utf8'));
    $content = $payload['content'] ?? null;
    if (!is_string($content)) throw new InvalidArgumentException('String content required.');
    if ($encoding === 'base64') {
        $bytes = base64_decode($content, true);
        if ($bytes === false) throw new InvalidArgumentException('Invalid base64 content.');
    } elseif ($encoding === 'utf8') {
        $bytes = $content;
        if (preg_match('//u', $bytes) !== 1) throw new InvalidArgumentException('Invalid UTF-8 content.');
    } else throw new InvalidArgumentException('Encoding must be utf8 or base64.');
    if (strlen($bytes) > IMC_FSM_MAX_FILE) throw new RuntimeException('File exceeds maximum size.', 413);
    return [$encoding, $bytes];
}

function fsm_expected(array $payload): ?string {
    $value = $payload['expected_sha256'] ?? null;
    if ($value === null || $value === '') return null;
    $value = strtolower(trim((string)$value));
    if (!preg_match('/^[a-f0-9]{64}$/', $value)) throw new InvalidArgumentException('Invalid expected_sha256.');
    return $value;
}

function fsm_write_operation(array $payload): array {
    $relative = fsm_normalize((string)($payload['path'] ?? ''));
    fsm_assert_safe_parents($relative);
    [, $bytes] = fsm_decode($payload);
    $absolute = fsm_absolute($relative);
    if (is_dir($absolute) || is_link($absolute)) throw new RuntimeException('Destination is not a regular file.', 409);
    $exists = is_file($absolute);
    $overwrite = ($payload['overwrite'] ?? false) === true;
    if ($exists && !$overwrite) throw new RuntimeException('File exists and overwrite is false.', 409);
    $expected = fsm_expected($payload);
    $current = $exists ? hash_file('sha256', $absolute) : null;
    if ($exists && $expected === null) throw new RuntimeException('expected_sha256 is required when replacing a file.', 409);
    if ($exists && !hash_equals((string)$current, (string)$expected)) throw new RuntimeException('File changed since it was read.', 409);
    if (!$exists && $expected !== null) throw new RuntimeException('Destination does not exist but expected_sha256 was supplied.', 409);
    return ['kind' => 'write', 'path' => $relative, 'overwrite' => $overwrite, 'expected_sha256' => $expected, 'content_sha256' => hash('sha256', $bytes), 'content_base64' => base64_encode($bytes)];
}

function fsm_copy_operation(array $payload): array {
    $source = fsm_normalize((string)($payload['source'] ?? ''));
    $destination = fsm_normalize((string)($payload['destination'] ?? ''));
    fsm_assert_safe_parents($destination);
    $sourceAbs = fsm_absolute($source); $destAbs = fsm_absolute($destination);
    if (!is_file($sourceAbs) || is_link($sourceAbs)) throw new RuntimeException('Source file not found.', 404);
    if (filesize($sourceAbs) > IMC_FSM_MAX_FILE) throw new RuntimeException('Source file exceeds maximum size.', 413);
    if (is_dir($destAbs) || is_link($destAbs)) throw new RuntimeException('Destination is not a regular file.', 409);
    $exists = is_file($destAbs); $overwrite = ($payload['overwrite'] ?? false) === true;
    if ($exists && !$overwrite) throw new RuntimeException('Destination exists and overwrite is false.', 409);
    $expected = fsm_expected($payload); $current = $exists ? hash_file('sha256', $destAbs) : null;
    if ($exists && $expected === null) throw new RuntimeException('expected_sha256 is required when replacing a file.', 409);
    if ($exists && !hash_equals((string)$current, (string)$expected)) throw new RuntimeException('Destination changed since it was read.', 409);
    return ['kind' => 'copy', 'source' => $source, 'destination' => $destination, 'overwrite' => $overwrite, 'expected_sha256' => $expected, 'source_sha256' => hash_file('sha256', $sourceAbs)];
}

function fsm_backup(string $relative, string $absolute): ?string {
    if (!is_file($absolute)) return null;
    $stamp = gmdate('Ymd_His') . '_' . bin2hex(random_bytes(4));
    $backup = fsm_log_dir() . '/backups/' . $stamp . '/' . $relative;
    $parent = dirname($backup);
    if (!is_dir($parent) && !mkdir($parent, 0700, true) && !is_dir($parent)) throw new RuntimeException('Cannot create backup directory.');
    if (!copy($absolute, $backup)) throw new RuntimeException('Backup failed.');
    return str_replace(fsm_log_dir() . '/', '', $backup);
}

function fsm_atomic_write(string $relative, string $bytes): array {
    fsm_assert_safe_parents($relative);
    $absolute = fsm_absolute($relative); $parent = dirname($absolute);
    if (!is_dir($parent) && !mkdir($parent, 0755, true) && !is_dir($parent)) throw new RuntimeException('Cannot create destination directory.');
    $backup = fsm_backup($relative, $absolute);
    $temp = $parent . '/.imc-write-' . bin2hex(random_bytes(8)) . '.tmp';
    if (file_put_contents($temp, $bytes, LOCK_EX) === false) throw new RuntimeException('Temporary write failed.');
    chmod($temp, 0644);
    if (!rename($temp, $absolute)) { @unlink($temp); throw new RuntimeException('Atomic replacement failed.'); }
    clearstatcache(true, $absolute);
    $hash = hash_file('sha256', $absolute);
    if (!hash_equals(hash('sha256', $bytes), (string)$hash)) throw new RuntimeException('Post-write verification failed.');
    return ['path' => $relative, 'size' => filesize($absolute), 'sha256' => $hash, 'backup' => $backup];
}

function fsm_history(int $limit): array {
    $path = fsm_log_dir() . '/audit.jsonl';
    if (!is_file($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $out = [];
    foreach (array_reverse(array_slice($lines, -max(1, min($limit, 200)))) as $line) {
        $row = json_decode($line, true); if (is_array($row)) $out[] = $row;
    }
    return $out;
}

try {
    fsm_auth(); $payload = fsm_payload(); $action = trim((string)($payload['action'] ?? 'health'));
    if ($action === 'health') fsm_reply(['ok' => true, 'version' => IMC_FSM_VERSION, 'mode' => 'ready', 'capabilities' => ['list', 'read', 'plan_write', 'execute_write', 'plan_copy', 'execute_copy', 'history'], 'max_file_bytes' => IMC_FSM_MAX_FILE]);
    if ($action === 'list') {
        $relative = fsm_normalize((string)($payload['path'] ?? ''), true); $absolute = fsm_absolute($relative, true);
        if (!is_dir($absolute) || is_link($absolute)) throw new RuntimeException('Directory not found.', 404);
        $items = [];
        foreach (new DirectoryIterator($absolute) as $item) {
            if ($item->isDot() || $item->isLink()) continue;
            $name = $item->getFilename(); $child = ltrim($relative . '/' . $name, '/');
            try { fsm_normalize($child); } catch (Throwable) { continue; }
            $items[] = ['name' => $name, 'path' => $child, 'type' => $item->isDir() ? 'directory' : 'file', 'size' => $item->isFile() ? $item->getSize() : null, 'modified_at' => gmdate('c', $item->getMTime())];
        }
        usort($items, static fn($a, $b) => [$a['type'] !== 'directory', strtolower($a['name'])] <=> [$b['type'] !== 'directory', strtolower($b['name'])]);
        fsm_audit(['action' => 'list', 'path' => $relative, 'status' => 'success']); fsm_reply(['ok' => true, 'path' => $relative, 'items' => $items]);
    }
    if ($action === 'read') {
        $relative = fsm_normalize((string)($payload['path'] ?? '')); $absolute = fsm_absolute($relative);
        if (!is_file($absolute) || is_link($absolute)) throw new RuntimeException('File not found.', 404);
        $size = filesize($absolute); if ($size > IMC_FSM_MAX_FILE) throw new RuntimeException('File exceeds maximum size.', 413);
        $bytes = file_get_contents($absolute); if ($bytes === false) throw new RuntimeException('Read failed.');
        $utf8 = preg_match('//u', $bytes) === 1;
        fsm_audit(['action' => 'read', 'path' => $relative, 'status' => 'success', 'sha256' => hash('sha256', $bytes)]);
        fsm_reply(['ok' => true, 'path' => $relative, 'size' => $size, 'sha256' => hash('sha256', $bytes), 'encoding' => $utf8 ? 'utf8' : 'base64', 'content' => $utf8 ? $bytes : base64_encode($bytes), 'modified_at' => gmdate('c', filemtime($absolute))]);
    }
    if ($action === 'plan_write') {
        $operation = fsm_write_operation($payload); $plan = fsm_plan($operation);
        $response = $plan; unset($response['operation']['content_base64']);
        fsm_audit(['action' => 'plan_write', 'path' => $operation['path'], 'status' => 'planned', 'plan_sha256' => $plan['plan_sha256']]); fsm_reply(['ok' => true] + $response);
    }
    if ($action === 'execute_write') {
        $operation = fsm_write_operation($payload); fsm_verify($operation, trim((string)($payload['confirmation_token'] ?? '')));
        $result = fsm_atomic_write($operation['path'], base64_decode($operation['content_base64'], true));
        fsm_audit(['action' => 'execute_write', 'status' => 'success'] + $result); fsm_reply(['ok' => true, 'action' => $action] + $result);
    }
    if ($action === 'plan_copy') {
        $operation = fsm_copy_operation($payload); $plan = fsm_plan($operation);
        fsm_audit(['action' => 'plan_copy', 'source' => $operation['source'], 'destination' => $operation['destination'], 'status' => 'planned', 'plan_sha256' => $plan['plan_sha256']]); fsm_reply(['ok' => true] + $plan);
    }
    if ($action === 'execute_copy') {
        $operation = fsm_copy_operation($payload); fsm_verify($operation, trim((string)($payload['confirmation_token'] ?? '')));
        $sourceAbs = fsm_absolute($operation['source']);
        if (!hash_equals($operation['source_sha256'], (string)hash_file('sha256', $sourceAbs))) throw new RuntimeException('Source changed after confirmation.', 409);
        $bytes = file_get_contents($sourceAbs); if ($bytes === false) throw new RuntimeException('Source read failed.');
        $result = fsm_atomic_write($operation['destination'], $bytes);
        fsm_audit(['action' => 'execute_copy', 'source' => $operation['source'], 'status' => 'success'] + $result); fsm_reply(['ok' => true, 'action' => $action, 'source' => $operation['source']] + $result);
    }
    if ($action === 'history') fsm_reply(['ok' => true, 'history' => fsm_history((int)($payload['limit'] ?? 50))]);
    throw new InvalidArgumentException('Unknown action.');
} catch (Throwable $e) {
    $status = $e->getCode(); if (!is_int($status) || $status < 400 || $status > 599) $status = $e instanceof InvalidArgumentException ? 422 : 500;
    fsm_reply(['ok' => false, 'version' => IMC_FSM_VERSION, 'error' => $e->getMessage()], $status);
}
