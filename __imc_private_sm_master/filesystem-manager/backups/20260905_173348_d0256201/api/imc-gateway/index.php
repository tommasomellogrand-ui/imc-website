<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedOrigins = [
  'https://it.soccermanager.com',
  'https://www.italianmastersclub.it',
  'https://italianmastersclub.it',
];

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
  header('Access-Control-Allow-Origin: '.$origin);
  header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Content-Type, X-IMC-Universal-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function out(array $x, int $s = 200): never {
  http_response_code($s);
  echo json_encode($x, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function valid_gw(string $gw): bool {
  return (bool)preg_match('/^GW00[1-9]$/', $gw);
}

function valid_identifier(string $value): bool {
  return (bool)preg_match('/^[A-Za-z0-9_]+$/', $value);
}

function public_gateway_version(): string {
  return '1.4.0';
}

/**
 * Restituisce tutte le tabelle realmente presenti nel database del Game World.
 * Sono visibili SOLO le tabelle con prefisso esatto GW00X_.
 */
function discover_world_tables(PDO $pdo, string $gw): array {
  $prefix = $gw.'_';

  $stmt = $pdo->prepare(
    'SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME LIKE ?
      ORDER BY TABLE_NAME ASC'
  );
  $stmt->execute([$prefix.'%']);

  $tables = [];
  foreach ($stmt->fetchAll() as $row) {
    $table = (string)($row['TABLE_NAME'] ?? '');
    if ($table === '' || !str_starts_with($table, $prefix)) continue;

    $repository = substr($table, strlen($prefix));
    if ($repository === '' || !valid_identifier($repository)) continue;

    $tables[$repository] = $table;
  }

  return $tables;
}

function resolve_public_table(PDO $pdo, string $gw, string $repo): string {
  if ($repo === '' || !valid_identifier($repo)) {
    out(['ok'=>false,'error'=>'invalid_repository'],422);
  }

  $tables = discover_world_tables($pdo, $gw);

  if (!isset($tables[$repo])) {
    out([
      'ok'=>false,
      'error'=>'repository_not_found',
      'game_world_id'=>$gw,
      'repository'=>$repo,
    ],404);
  }

  return $tables[$repo];
}

$cfg = require __DIR__.'/config.php';
require_once __DIR__.'/database.php';

$method = (string)($_SERVER['REQUEST_METHOD'] ?? '');

/* ================================================================
   PUBLIC READ · UNIVERSAL MINISITE ACCESS
   ---------------------------------------------------------------
   Il GET pubblico NON usa più la whitelist dei repository.

   Il Gateway:
   - riceve il Game World;
   - seleziona il database corretto;
   - vede tutte le tabelle reali con prefisso GW00X_;
   - consente lettura, discovery e schema;
   - NON consente mai di uscire dal namespace del Game World.

   DISCOVERY:
   GET /api/imc-gateway/?game_world_id=GW001&action=repositories

   SCHEMA:
   GET /api/imc-gateway/?game_world_id=GW001&action=schema&repository=results

   READ:
   GET /api/imc-gateway/?game_world_id=GW001&repository=results
       &limit=500&offset=0
       &filter_sm_division=1
       &order_by=id&order_dir=DESC
   ================================================================ */
if ($method === 'GET') {
  $gw = strtoupper(trim((string)($_GET['game_world_id'] ?? '')));
  $action = strtolower(trim((string)($_GET['action'] ?? 'read')));
  $repo = strtolower(trim((string)($_GET['repository'] ?? '')));

  if (!valid_gw($gw)) {
    out(['ok'=>false,'error'=>'invalid_game_world'],422);
  }

  try {
    $pdo = imc_db($cfg, $gw);
  } catch (Throwable $e) {
    out(['ok'=>false,'error'=>'database_connection_failed'],500);
  }

  try {
    if ($action === 'repositories' || $action === 'discover') {
      $tables = discover_world_tables($pdo, $gw);
      $repositories = [];

      foreach ($tables as $repository => $table) {
        $repositories[] = [
          'repository'=>$repository,
          'table'=>$table,
        ];
      }

      out([
        'ok'=>true,
        'action'=>'repositories',
        'service'=>'IMC Universal Gateway',
        'version'=>public_gateway_version(),
        'game_world_id'=>$gw,
        'repositories'=>$repositories,
        'count'=>count($repositories),
      ]);
    }

    if ($action === 'schema') {
      $table = resolve_public_table($pdo, $gw, $repo);

      $stmt = $pdo->query("DESCRIBE `{$table}`");
      $columns = $stmt->fetchAll();

      out([
        'ok'=>true,
        'action'=>'schema',
        'service'=>'IMC Universal Gateway',
        'version'=>public_gateway_version(),
        'game_world_id'=>$gw,
        'repository'=>$repo,
        'table'=>$table,
        'columns'=>$columns,
      ]);
    }

    if ($action !== '' && $action !== 'read' && $action !== 'public_read') {
      out(['ok'=>false,'error'=>'unknown_public_action'],422);
    }

    $table = resolve_public_table($pdo, $gw, $repo);

    $columns = [];
    $schemaStmt = $pdo->query("DESCRIBE `{$table}`");
    foreach ($schemaStmt->fetchAll() as $column) {
      $name = (string)($column['Field'] ?? '');
      if ($name !== '') $columns[$name] = true;
    }

    $where = [];
    $values = [];

    foreach ($_GET as $key => $value) {
      if (!str_starts_with((string)$key, 'filter_')) continue;

      $column = substr((string)$key, 7);

      if (!valid_identifier($column) || !isset($columns[$column])) {
        out([
          'ok'=>false,
          'error'=>'invalid_filter',
          'column'=>$column,
        ],422);
      }

      if (is_array($value)) {
        out([
          'ok'=>false,
          'error'=>'invalid_filter_value',
          'column'=>$column,
        ],422);
      }

      if ((string)$value === '__NULL__') {
        $where[] = "`{$column}` IS NULL";
      } elseif ((string)$value === '__NOT_NULL__') {
        $where[] = "`{$column}` IS NOT NULL";
      } else {
        $where[] = "`{$column}` = ?";
        $values[] = (string)$value;
      }
    }

    $limit = max(1, min(1000, (int)($_GET['limit'] ?? 500)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $whereSql = $where ? ' WHERE '.implode(' AND ', $where) : '';

    $orderBy = trim((string)($_GET['order_by'] ?? ''));
    $orderDir = strtoupper(trim((string)($_GET['order_dir'] ?? 'ASC')));
    $orderSql = '';

    if ($orderBy !== '') {
      if (!valid_identifier($orderBy) || !isset($columns[$orderBy])) {
        out(['ok'=>false,'error'=>'invalid_order_by'],422);
      }

      if (!in_array($orderDir, ['ASC','DESC'], true)) {
        $orderDir = 'ASC';
      }

      $orderSql = " ORDER BY `{$orderBy}` {$orderDir}";
    }

    $countStmt = $pdo->prepare(
      "SELECT COUNT(*) AS c FROM `{$table}`{$whereSql}"
    );
    $countStmt->execute($values);
    $total = (int)($countStmt->fetch()['c'] ?? 0);

    $stmt = $pdo->prepare(
      "SELECT * FROM `{$table}`{$whereSql}{$orderSql} LIMIT {$limit} OFFSET {$offset}"
    );
    $stmt->execute($values);
    $rows = $stmt->fetchAll();

    out([
      'ok'=>true,
      'action'=>'public_read',
      'service'=>'IMC Universal Gateway',
      'version'=>public_gateway_version(),
      'game_world_id'=>$gw,
      'repository'=>$repo,
      'table'=>$table,
      'data'=>$rows,
      'pagination'=>[
        'total'=>$total,
        'limit'=>$limit,
        'offset'=>$offset,
        'returned'=>count($rows),
      ],
    ]);
  } catch (Throwable $e) {
    out([
      'ok'=>false,
      'error'=>'gateway_read_error',
    ],500);
  }
}

/* ================================================================
   PRIVILEGED POST · IMPORT / ADMIN
   ---------------------------------------------------------------
   INVARIATO:
   - token obbligatorio;
   - whitelist repository ancora attiva;
   - import e amministrazione non vengono aperti al pubblico.
   ================================================================ */
if ($method !== 'POST') {
  out(['ok'=>false,'error'=>'method_not_allowed'],405);
}

if (($cfg['token'] ?? '') === '') {
  out(['ok'=>false,'error'=>'gateway_token_not_configured'],500);
}

$token = (string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] ?? '');

if (!hash_equals((string)$cfg['token'], $token)) {
  out(['ok'=>false,'error'=>'unauthorized'],401);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);

if (!is_array($body)) {
  out(['ok'=>false,'error'=>'invalid_json'],400);
}

$action = (string)($body['action'] ?? '');
$gw = strtoupper(trim((string)($body['game_world_id'] ?? '')));
$repo = strtolower(trim((string)($body['repository'] ?? '')));

if ($action === 'health') {
  out([
    'ok'=>true,
    'service'=>'IMC Universal Gateway',
    'version'=>public_gateway_version(),
    'repositories'=>$cfg['repositories'],
    'worlds'=>array_merge($cfg['gold_worlds'],$cfg['custom_worlds'])
  ]);
}

if (!valid_gw($gw)) {
  out(['ok'=>false,'error'=>'invalid_game_world'],422);
}

if ($action === 'probe') {
  try {
    $pdo=imc_db($cfg,$gw);
    $stmt=$pdo->query('SELECT 1 AS ok');
    $row=$stmt->fetch();

    out([
      'ok'=>true,
      'action'=>'probe',
      'service'=>'IMC Universal Gateway',
      'version'=>public_gateway_version(),
      'game_world_id'=>$gw,
      'database_connection'=>(int)($row['ok'] ?? 0)===1 ? 'ok' : 'failed'
    ]);
  } catch(Throwable $e) {
    out([
      'ok'=>false,
      'action'=>'probe',
      'game_world_id'=>$gw,
      'error'=>$e->getMessage()
    ],500);
  }
}

if (!in_array($repo,$cfg['repositories'],true)) {
  out(['ok'=>false,'error'=>'repository_not_enabled'],422);
}

$table=$gw.'_'.$repo;

try {
  $pdo=imc_db($cfg,$gw);
} catch(Throwable $e) {
  out(['ok'=>false,'error'=>'database_connection_failed'],500);
}

try {
  if ($action==='read') {
    $limit=max(1,min(1000,(int)($body['limit'] ?? 100)));
    $stmt=$pdo->query("SELECT * FROM `{$table}` LIMIT {$limit}");
    out(['ok'=>true,'action'=>'read','table'=>$table,'rows'=>$stmt->fetchAll()]);
  }

  if ($action==='query') {
    $sql=trim((string)($body['sql'] ?? ''));

    if (!preg_match('/^(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i',$sql)) {
      out(['ok'=>false,'error'=>'read_only_query_required'],422);
    }

    $stmt=$pdo->query($sql);
    out(['ok'=>true,'action'=>'query','rows'=>$stmt->fetchAll()]);
  }

  if ($action==='insert_many') {
    $rows=$body['rows'] ?? $body['items'] ?? null;

    if (!is_array($rows) || !$rows) {
      out(['ok'=>false,'error'=>'rows_required'],422);
    }

    $count=0;
    $pdo->beginTransaction();

    foreach($rows as $row){
      if(!is_array($row)||!$row) continue;

      $cols=array_keys($row);

      foreach($cols as $c){
        if(!valid_identifier((string)$c)) {
          throw new RuntimeException('invalid_column');
        }
      }

      $names='`'.implode('`,`',$cols).'`';
      $ph=implode(',',array_fill(0,count($cols),'?'));
      $st=$pdo->prepare("INSERT INTO `{$table}` ({$names}) VALUES ({$ph})");
      $st->execute(array_values($row));
      $count++;
    }

    $pdo->commit();

    out([
      'ok'=>true,
      'action'=>'insert_many',
      'table'=>$table,
      'inserted'=>$count
    ]);
  }

  if ($action==='delete') {
    $where=$body['where'] ?? null;

    if(!is_array($where)||!$where) {
      out(['ok'=>false,'error'=>'where_required'],422);
    }

    $parts=[];
    $vals=[];

    foreach($where as $c=>$v){
      if(!valid_identifier((string)$c)) {
        out(['ok'=>false,'error'=>'invalid_column'],422);
      }

      $parts[]="`{$c}` = ?";
      $vals[]=$v;
    }

    $st=$pdo->prepare(
      "DELETE FROM `{$table}` WHERE ".implode(' AND ',$parts)
    );
    $st->execute($vals);

    out([
      'ok'=>true,
      'action'=>'delete',
      'table'=>$table,
      'deleted'=>$st->rowCount()
    ]);
  }

  if ($action==='execute_sql') {
    $sql=trim((string)($body['sql'] ?? ''));

    if($sql==='') {
      out(['ok'=>false,'error'=>'sql_required'],422);
    }

    $affected=$pdo->exec($sql);

    out([
      'ok'=>true,
      'action'=>'execute_sql',
      'affected_rows'=>$affected
    ]);
  }

  out(['ok'=>false,'error'=>'unknown_action'],422);

} catch(Throwable $e){
  if(isset($pdo)&&$pdo->inTransaction()) {
    $pdo->rollBack();
  }

  out([
    'ok'=>false,
    'error'=>'gateway_error',
    'message'=>$e->getMessage()
  ],500);
}
