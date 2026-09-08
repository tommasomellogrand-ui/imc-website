<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method_not_allowed']); exit; }
$raw=file_get_contents('php://input');
if ($raw===false || strlen($raw)>200000) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_payload']); exit; }
$data=json_decode($raw,true);
if (!is_array($data) || ($data['gameWorld']??'')!=='GW010' || !isset($data['assignments']) || !is_array($data['assignments']) || count($data['assignments'])!==18) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_draw']); exit; }
$seenManagers=[];$seenTeams=[];
foreach($data['assignments'] as $a){
  if(!is_array($a)||!isset($a['manager'],$a['team'],$a['region'])){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'invalid_assignment']);exit;}
  $m=(string)$a['manager'];$t=(string)$a['team'];$r=(string)$a['region'];
  if($m===''||$t===''||!in_array($r,['SA','EU'],true)||isset($seenManagers[$m])||isset($seenTeams[$t])){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'duplicate_or_invalid']);exit;}
  $seenManagers[$m]=true;$seenTeams[$t]=true;
}
$data['savedAt']=gmdate('c');
$data['drawId']='GW010-'.gmdate('Ymd-His');
$json=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
$tmp=__DIR__.'/replay-data.json.tmp';$dst=__DIR__.'/replay-data.json';
if(file_put_contents($tmp,$json,LOCK_EX)===false||!rename($tmp,$dst)){http_response_code(500);echo json_encode(['ok'=>false,'error'=>'write_failed']);exit;}
echo json_encode(['ok'=>true,'draw_id'=>$data['drawId'],'replay_url'=>'/sensible-soccer-academy/draw/?replay=1'],JSON_UNESCAPED_UNICODE);
