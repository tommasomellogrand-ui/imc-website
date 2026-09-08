<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$store = __DIR__ . '/room-state.json';
$now = time();
$ttl = 30;

function clean_name($v) {
    $v = trim((string)$v);
    $v = preg_replace('/\s+/', ' ', $v);
    return mb_substr($v, 0, 24);
}
function clean_message($v) {
    $v = trim((string)$v);
    $v = preg_replace('/\s+/', ' ', $v);
    return mb_substr($v, 0, 140);
}
function default_state() {
    return [
        'event' => 'waiting',
        'updated_at' => gmdate('c'),
        'presence' => [],
        'messages' => []
    ];
}
function load_locked($fp) {
    rewind($fp);
    $raw = stream_get_contents($fp);
    if (!$raw) return default_state();
    $data = json_decode($raw, true);
    return is_array($data) ? $data : default_state();
}
function save_locked($fp, $state) {
    $state['updated_at'] = gmdate('c');
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($state, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));
    fflush($fp);
}
function prune_presence(&$state, $now, $ttl) {
    if (!isset($state['presence']) || !is_array($state['presence'])) $state['presence'] = [];
    foreach ($state['presence'] as $sid => $p) {
        if (!isset($p['last_seen']) || ($now - (int)$p['last_seen']) > $ttl) unset($state['presence'][$sid]);
    }
}
function public_state($state) {
    $people = array_values(array_map(function($p){ return ['name'=>$p['name'] ?? 'Guest']; }, $state['presence'] ?? []));
    usort($people, function($a,$b){ return strcasecmp($a['name'],$b['name']); });
    return [
        'ok' => true,
        'event' => $state['event'] ?? 'waiting',
        'updated_at' => $state['updated_at'] ?? null,
        'online_count' => count($people),
        'people' => $people,
        'messages' => array_slice(array_values($state['messages'] ?? []), -100)
    ];
}

$fp = @fopen($store, 'c+');
if (!$fp) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'store_unavailable']); exit; }
if (!flock($fp, LOCK_EX)) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'lock_failed']); fclose($fp); exit; }

$state = load_locked($fp);
prune_presence($state, $now, $ttl);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = $_POST;
    $action = $input['action'] ?? '';
    $sid = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($input['sid'] ?? ''));
    if (strlen($sid) < 8 || strlen($sid) > 80) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_session']); flock($fp,LOCK_UN); fclose($fp); exit; }

    if ($action === 'join' || $action === 'heartbeat') {
        $name = clean_name($input['name'] ?? ($state['presence'][$sid]['name'] ?? ''));
        if ($name === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'name_required']); flock($fp,LOCK_UN); fclose($fp); exit; }
        $state['presence'][$sid] = ['name'=>$name,'last_seen'=>$now];
    } elseif ($action === 'chat') {
        $name = clean_name($input['name'] ?? ($state['presence'][$sid]['name'] ?? ''));
        $text = clean_message($input['message'] ?? '');
        if ($name === '' || $text === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_message']); flock($fp,LOCK_UN); fclose($fp); exit; }
        $state['presence'][$sid] = ['name'=>$name,'last_seen'=>$now];
        if (!isset($state['messages']) || !is_array($state['messages'])) $state['messages'] = [];
        $state['messages'][] = ['id'=>bin2hex(random_bytes(6)),'name'=>$name,'message'=>$text,'time'=>gmdate('c')];
        if (count($state['messages']) > 100) $state['messages'] = array_slice($state['messages'], -100);
    } elseif ($action === 'leave') {
        unset($state['presence'][$sid]);
    } else {
        http_response_code(400); echo json_encode(['ok'=>false,'error'=>'unknown_action']); flock($fp,LOCK_UN); fclose($fp); exit;
    }
}

save_locked($fp, $state);
$response = public_state($state);
flock($fp, LOCK_UN);
fclose($fp);
echo json_encode($response, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
