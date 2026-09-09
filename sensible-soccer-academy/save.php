<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method_not_allowed']); exit; }
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 200000) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_payload']); exit; }
$data = json_decode($raw, true);
if (!is_array($data) || ($data['gameWorld'] ?? '') !== 'GW010' || !isset($data['assignments']) || !is_array($data['assignments']) || count($data['assignments']) !== 24) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_draw']); exit;
}
$seenManagers=[]; $seenTeams=[]; $normalized=[];
foreach ($data['assignments'] as $i=>$a) {
  if (!is_array($a) || !isset($a['manager'],$a['team'],$a['region'])) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_assignment']); exit; }
  $m=trim((string)$a['manager']); $t=trim((string)$a['team']); $r=(string)$a['region'];
  if ($m==='' || $t==='' || !in_array($r,['SA','EU'],true) || isset($seenManagers[$m]) || isset($seenTeams[$t])) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'duplicate_or_invalid']); exit; }
  $seenManagers[$m]=true; $seenTeams[$t]=true;
  $normalized[]=['seq'=>$i+1,'manager'=>$m,'team'=>$t,'region'=>$r,'time'=>$a['time']??($a['timestamp']??null)];
}
$data['assignments']=$normalized;
$data['savedAt']=gmdate('c');
$data['drawId']='GW010-'.gmdate('Ymd-His');
$json=json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT);
if ($json===false) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'encode_failed']); exit; }

function atomic_write(string $dst,string $json): bool {
  $tmp=$dst.'.tmp';
  if (@file_put_contents($tmp,$json,LOCK_EX)===false) return false;
  if (@rename($tmp,$dst)) return true;
  @unlink($tmp);
  return false;
}

$rootDst=__DIR__.'/replay-data.json';
$liveDst=__DIR__.'/live/replay-data.json';
$rootOk=atomic_write($rootDst,$json);
$liveOk=atomic_write($liveDst,$json);
if (!$rootOk && !$liveOk) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'write_failed']); exit; }

echo json_encode([
  'ok'=>true,
  'draw_id'=>$data['drawId'],
  'replay_url'=>'/sensible-soccer-academy/replay/',
  'saved_root'=>$rootOk,
  'saved_live'=>$liveOk
], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
