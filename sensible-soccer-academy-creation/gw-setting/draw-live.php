<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const MAX_BODY = 65536;
const MAX_TEXT = 500;
$stateFile = __DIR__ . '/draw-live-state.json';

function out(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_text(mixed $value, int $max = MAX_TEXT): string {
    $text = trim((string)$value);
    if (function_exists('mb_substr')) return mb_substr($text, 0, $max, 'UTF-8');
    return substr($text, 0, $max);
}

function current_state(string $file): array {
    if (!is_file($file)) return ['status' => 'idle', 'sequence' => 0, 'updated_at' => null];
    $raw = @file_get_contents($file);
    if ($raw === false || $raw === '') return ['status' => 'idle', 'sequence' => 0, 'updated_at' => null];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : ['status' => 'idle', 'sequence' => 0, 'updated_at' => null];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    out(['ok' => true, 'state' => current_state($stateFile)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(['ok' => false, 'error' => 'Metodo non consentito'], 405);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > MAX_BODY) out(['ok' => false, 'error' => 'Payload non valido'], 400);
$input = json_decode($raw, true);
if (!is_array($input)) out(['ok' => false, 'error' => 'Payload JSON non valido'], 400);
if (clean_text($input['source'] ?? '', 20) !== 'host') out(['ok' => false, 'error' => 'Source non valida'], 403);

$allowedStatus = ['idle', 'live', 'completed'];
$status = clean_text($input['status'] ?? 'idle', 20);
if (!in_array($status, $allowedStatus, true)) $status = 'idle';

$active = is_array($input['active'] ?? null) ? $input['active'] : [];
$state = [
    'status' => $status,
    'session_id' => clean_text($input['session_id'] ?? '', 80),
    'sequence' => max(0, (int)($input['sequence'] ?? 0)),
    'count' => clean_text($input['count'] ?? '', 60),
    'manager' => clean_text($input['manager'] ?? ''),
    'region' => in_array(($input['region'] ?? ''), ['SA', 'EU'], true) ? $input['region'] : '',
    'club' => clean_text($input['club'] ?? ''),
    'crest' => clean_text($input['crest'] ?? '', 1000),
    'division' => clean_text($input['division'] ?? '', 80),
    'scene_status' => clean_text($input['scene_status'] ?? ''),
    'chain' => clean_text($input['chain'] ?? ''),
    'pause' => clean_text($input['pause'] ?? ''),
    'scene_show' => !empty($input['scene_show']),
    'scanning' => !empty($input['scanning']),
    'locked' => !empty($input['locked']),
    'final_show' => !empty($input['final_show']),
    'active' => [
        'manager' => !empty($active['manager']),
        'club' => !empty($active['club']),
        'division' => !empty($active['division']),
    ],
    'updated_at' => gmdate('c'),
    'updated_ts' => time(),
];

$fh = @fopen($stateFile, 'c+');
if (!$fh) out(['ok' => false, 'error' => 'Stato live non scrivibile'], 500);
if (!flock($fh, LOCK_EX)) { fclose($fh); out(['ok' => false, 'error' => 'Stato live occupato'], 503); }
rewind($fh);
ftruncate($fh, 0);
$written = fwrite($fh, json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);
if ($written === false) out(['ok' => false, 'error' => 'Stato live non salvato'], 500);
out(['ok' => true, 'state' => $state]);
