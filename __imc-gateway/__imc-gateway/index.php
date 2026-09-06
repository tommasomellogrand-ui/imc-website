<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://it.soccermanager.com');
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Universal-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
function out(array $x,int $s=200): never { http_response_code($s); echo json_encode($x,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
$cfg = require __DIR__.'/config.php';
require_once __DIR__.'/database.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(['ok'=>false,'error'=>'method_not_allowed'],405);
if (($cfg['token'] ?? '') === '') out(['ok'=>false,'error'=>'gateway_token_not_configured'],500);
$token=(string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] ?? '');
if (!hash_equals((string)$cfg['token'],$token)) out(['ok'=>false,'error'=>'unauthorized'],401);
$body=json_decode(file_get_contents('php://input') ?: '',true);
if (!is_array($body)) out(['ok'=>false,'error'=>'invalid_json'],400);
$action=(string)($body['action'] ?? '');
$gw=strtoupper(trim((string)($body['game_world_id'] ?? '')));
$repo=strtolower(trim((string)($body['repository'] ?? '')));
$enabledRepos=array_values(array_unique(array_map(static fn($r)=>$r==='nations'?'sm_player_stats':$r,$cfg['repositories'] ?? [])));

if ($action==='health') {
  out(['ok'=>true,'service'=>'IMC Universal Gateway','version'=>$cfg['version'],'repositories'=>$enabledRepos,'worlds'=>array_merge($cfg['gold_worlds'],$cfg['custom_worlds'])]);
}
if (!preg_match('/^GW00[1-9]$/',$gw)) out(['ok'=>false,'error'=>'invalid_game_world'],422);
if ($action==='probe') {
  try {
    $pdo=imc_db($cfg,$gw); $stmt=$pdo->query('SELECT 1 AS ok'); $row=$stmt->fetch();
    out(['ok'=>true,'action'=>'probe','service'=>'IMC Universal Gateway','version'=>$cfg['version'],'game_world_id'=>$gw,'database_connection'=>(int)($row['ok'] ?? 0)===1 ? 'ok' : 'failed']);
  } catch(Throwable $e) { out(['ok'=>false,'action'=>'probe','game_world_id'=>$gw,'error'=>$e->getMessage()],500); }
}
if (!in_array($repo,$enabledRepos,true)) out(['ok'=>false,'error'=>'repository_not_enabled'],422);
$table=$gw.'_'.$repo;
try { $pdo=imc_db($cfg,$gw); } catch(Throwable $e) { out(['ok'=>false,'error'=>$e->getMessage()],500); }
try {
  if ($action==='read') {
    $limit=max(1,min(1000,(int)($body['limit'] ?? 100))); $stmt=$pdo->query("SELECT * FROM `{$table}` LIMIT {$limit}");
    out(['ok'=>true,'action'=>'read','table'=>$table,'rows'=>$stmt->fetchAll()]);
  }
  if ($action==='query') {
    $sql=trim((string)($body['sql'] ?? '')); if (!preg_match('/^(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\\b/i',$sql)) out(['ok'=>false,'error'=>'read_only_query_required'],422);
    $stmt=$pdo->query($sql); out(['ok'=>true,'action'=>'query','rows'=>$stmt->fetchAll()]);
  }
  if ($action==='insert_many') {
    $rows=$body['rows'] ?? $body['items'] ?? null; if (!is_array($rows) || !$rows) out(['ok'=>false,'error'=>'rows_required'],422);
    $count=0; $pdo->beginTransaction();
    foreach($rows as $row){ if(!is_array($row)||!$row) continue; $cols=array_keys($row); foreach($cols as $c){ if(!preg_match('/^[A-Za-z0-9_]+$/',$c)) throw new RuntimeException('invalid_column'); }
      $names='`'.implode('`,`',$cols).'`'; $ph=implode(',',array_fill(0,count($cols),'?')); $st=$pdo->prepare("INSERT INTO `{$table}` ({$names}) VALUES ({$ph})"); $st->execute(array_values($row)); $count++; }
    $pdo->commit(); out(['ok'=>true,'action'=>'insert_many','table'=>$table,'inserted'=>$count]);
  }
  if ($action==='delete') {
    $where=$body['where'] ?? null; if(!is_array($where)||!$where) out(['ok'=>false,'error'=>'where_required'],422);
    $parts=[];$vals=[]; foreach($where as $c=>$v){ if(!preg_match('/^[A-Za-z0-9_]+$/',(string)$c)) out(['ok'=>false,'error'=>'invalid_column'],422); $parts[]="`{$c}` = ?"; $vals[]=$v; }
    $st=$pdo->prepare("DELETE FROM `{$table}` WHERE ".implode(' AND ',$parts)); $st->execute($vals); out(['ok'=>true,'action'=>'delete','table'=>$table,'deleted'=>$st->rowCount()]);
  }
  if ($action==='execute_sql') {
    $sql=trim((string)($body['sql'] ?? '')); if($sql==='') out(['ok'=>false,'error'=>'sql_required'],422);
    $affected=$pdo->exec($sql); out(['ok'=>true,'action'=>'execute_sql','affected_rows'=>$affected]);
  }
  out(['ok'=>false,'error'=>'unknown_action'],422);
} catch(Throwable $e){ if(isset($pdo)&&$pdo->inTransaction()) $pdo->rollBack(); out(['ok'=>false,'error'=>'gateway_error','message'=>$e->getMessage()],500); }
