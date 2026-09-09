<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const MAX_MESSAGES = 200;
const MAX_NAME = 40;
const MAX_TEXT = 500;
$file = __DIR__ . '/chat-data.json';

function out(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function clean_text(string $value, int $max): string {
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    return mb_substr($value, 0, $max, 'UTF-8');
}
function read_messages(string $file): array {
    if (!is_file($file)) return [];
    $raw = @file_get_contents($file);
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? array_values($data) : [];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    out(['ok' => true, 'messages' => read_messages($file)]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(['ok' => false, 'error' => 'Metodo non consentito'], 405);
}
$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '', true);
if (!is_array($input)) out(['ok' => false, 'error' => 'Payload non valido'], 400);
$name = clean_text((string)($input['name'] ?? ''), MAX_NAME);
$text = clean_text((string)($input['text'] ?? ''), MAX_TEXT);
if ($name === '' || $text === '') out(['ok' => false, 'error' => 'Nome e messaggio sono obbligatori'], 422);

$fh = @fopen($file, 'c+');
if (!$fh) out(['ok' => false, 'error' => 'Archivio chat non scrivibile'], 500);
if (!flock($fh, LOCK_EX)) { fclose($fh); out(['ok' => false, 'error' => 'Chat temporaneamente occupata'], 503); }
rewind($fh);
$existing = stream_get_contents($fh);
$messages = $existing ? json_decode($existing, true) : [];
if (!is_array($messages)) $messages = [];
$messages[] = [
    'id' => bin2hex(random_bytes(8)),
    'name' => $name,
    'text' => $text,
    'time' => date('H:i'),
    'ts' => time()
];
if (count($messages) > MAX_MESSAGES) $messages = array_slice($messages, -MAX_MESSAGES);
rewind($fh); ftruncate($fh, 0);
$written = fwrite($fh, json_encode($messages, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($fh); flock($fh, LOCK_UN); fclose($fh);
if ($written === false) out(['ok' => false, 'error' => 'Messaggio non salvato'], 500);
out(['ok' => true, 'messages' => array_values($messages)]);
