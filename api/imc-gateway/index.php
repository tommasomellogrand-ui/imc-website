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
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function out(array $x, int $s = 200): never {
  http_response_code($s);
  echo json_encode($x, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function valid_gw(string $gw): bool { return (bool)preg_match('/^GW00[1-9]$/', $gw); }
function valid_identifier(string $value): bool { return (bool)preg_match('/^[A-Za-z0-9_]+$/', $value); }
function public_gateway_version(): string { return '1.7.0'; }
function public_core_tables(): array { return ['gw_manager_assignments','imc_managers']; }

function competition_group_from_sm_action(mixed $value): ?string {
  $action = strtolower(trim((string)$value));
  return match ($action) {
    'league','leaguecup','leagueshield','charityshield','playoff' => 'DOMESTIC',
    'smfacup','smfashield','supercup' => 'INTERNATIONAL',
    'interqualifier','worldcup' => 'NATIONS',
    default => null,
  };
}

function certified_competition_key(string $gw, array $row, ?string $group): string {
  $country = trim((string)($row['sm_country'] ?? ''));
  $action = strtolower(trim((string)($row['sm_action'] ?? '')));
  $division = trim((string)($row['sm_division'] ?? ''));
  if ($action === '') throw new RuntimeException('sm_action_required');
  if ($group === null) {
    $provided = trim((string)($row['competition_key'] ?? ''));
    if ($provided === '') throw new RuntimeException('competition_key_required');
    return $provided;
  }
  $parts = [$gw];
  if ($country !== '') $parts[] = $country;
  $parts[] = $group;
  $parts[] = $action;
  if ($division !== '') $parts[] = $division;
  return implode('|', $parts);
}

function discover_world_tables(PDO $pdo, string $gw): array {
  $prefix = $gw.'_';
  $stmt = $pdo->prepare('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE ? ORDER BY TABLE_NAME ASC');
  $stmt->execute([$prefix.'%']);
  $tables = [];
  foreach ($stmt->fetchAll() as $row) {
    $table = (string)($row['TABLE_NAME'] ?? '');
    if ($table === '' || !str_starts_with($table, $prefix)) continue;
    $repo = substr($table, strlen($prefix));
    if ($repo !== '' && valid_identifier($repo)) $tables[$repo] = $table;
  }
  return $tables;
}

function resolve_world_table(PDO $pdo, string $gw, string $repo): string {
  if ($repo === '' || !valid_identifier($repo)) throw new RuntimeException('invalid_repository');
  $tables = discover_world_tables($pdo, $gw);
  if (!isset($tables[$repo])) throw new RuntimeException('repository_not_found');
  return $tables[$repo];
}

function table_schema(PDO $pdo, string $table): array {
  $stmt = $pdo->query("DESCRIBE `{$table}`");
  $schema = [];
  foreach ($stmt->fetchAll() as $col) {
    $name = (string)($col['Field'] ?? '');
    if ($name === '') continue;
    $type = strtolower((string)($col['Type'] ?? ''));
    $extra = strtolower((string)($col['Extra'] ?? ''));
    $schema[$name] = [
      'type'=>$type,
      'null'=>strtoupper((string)($col['Null'] ?? 'YES')) === 'YES',
      'key'=>(string)($col['Key'] ?? ''),
      'default'=>$col['Default'] ?? null,
      'extra'=>$extra,
      'json'=>str_starts_with($type, 'json'),
      'generated'=>str_contains($extra,'auto_increment') || str_contains($extra,'generated'),
    ];
  }
  return $schema;
}

function table_indexes(PDO $pdo, string $table): array {
  $stmt = $pdo->query("SHOW INDEX FROM `{$table}`");
  $grouped = [];
  foreach ($stmt->fetchAll() as $r) {
    $name = (string)($r['Key_name'] ?? '');
    if ($name === '') continue;
    if (!isset($grouped[$name])) $grouped[$name] = ['unique'=>((int)($r['Non_unique'] ?? 1) === 0),'columns'=>[]];
    $grouped[$name]['columns'][(int)($r['Seq_in_index'] ?? 1)] = (string)($r['Column_name'] ?? '');
  }
  foreach ($grouped as &$idx) { ksort($idx['columns']); $idx['columns'] = array_values($idx['columns']); }
  unset($idx);
  return $grouped;
}

function encode_json_columns(array $row, array $schema): array {
  foreach ($schema as $field=>$meta) {
    if (!$meta['json'] || !array_key_exists($field,$row) || $row[$field] === null) continue;
    if (is_array($row[$field]) || is_object($row[$field])) {
      $encoded = json_encode($row[$field], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if ($encoded === false) throw new RuntimeException('invalid_json_'.$field);
      $row[$field] = $encoded;
    } elseif (is_string($row[$field])) {
      json_decode($row[$field], true);
      if (json_last_error() !== JSON_ERROR_NONE) throw new RuntimeException('invalid_json_'.$field);
    } else {
      throw new RuntimeException('invalid_json_'.$field);
    }
  }
  return $row;
}

function validate_row_against_schema(array $row, array $schema): array {
  foreach ($row as $field=>$value) {
    if (!valid_identifier((string)$field) || !isset($schema[$field])) throw new RuntimeException('field_not_allowed:'.$field);
    if ($schema[$field]['generated']) throw new RuntimeException('generated_field_not_allowed:'.$field);
    if ($value === null && !$schema[$field]['null'] && $schema[$field]['default'] === null) throw new RuntimeException('required_field_null:'.$field);
  }
  foreach ($schema as $field=>$meta) {
    if ($meta['generated']) continue;
    if (!$meta['null'] && $meta['default'] === null && !array_key_exists($field,$row)) throw new RuntimeException('required_field_missing:'.$field);
  }
  return encode_json_columns($row,$schema);
}

function inherit_results_identity(PDO $pdo, string $gw, array $row, bool $fullIdentity): array {
  $fixtureId = (int)($row['sm_fixture_id'] ?? 0);
  if ($fixtureId <= 0) throw new RuntimeException('sm_fixture_id_required');
  $resultsTable = $gw.'_results';
  $stmt = $pdo->prepare("SELECT competition_key, sm_action, sm_country, sm_division, competition_group, competition_stage, competition_round FROM `{$resultsTable}` WHERE sm_fixture_id = ? LIMIT 1");
  $stmt->execute([$fixtureId]);
  $identity = $stmt->fetch();
  if (!$identity) throw new RuntimeException('results_fixture_not_found');
  $row['game_world_id'] = $gw;
  $row['competition_key'] = $identity['competition_key'] ?? null;
  if (trim((string)$row['competition_key']) === '') throw new RuntimeException('competition_key_missing_in_results');
  if ($fullIdentity) {
    foreach (['sm_action','sm_country','sm_division','competition_group','competition_stage','competition_round'] as $field) $row[$field] = $identity[$field] ?? null;
  }
  return $row;
}

function normalize_insert_row(PDO $pdo, string $gw, string $repo, array $row, array $schema): array {
  if (isset($schema['game_world_id'])) {
    if (array_key_exists('game_world_id',$row) && trim((string)$row['game_world_id']) !== '' && strtoupper(trim((string)$row['game_world_id'])) !== $gw) {
      throw new RuntimeException('game_world_id_mismatch');
    }
    $row['game_world_id'] = $gw;
  }

  if ($repo === 'results' || $repo === 'schedule') {
    $group = competition_group_from_sm_action($row['sm_action'] ?? null);
    $row['competition_group'] = $group;
    $row['competition_key'] = certified_competition_key($gw,$row,$group);
  } elseif ($repo === 'match_report') {
    $row = inherit_results_identity($pdo,$gw,$row,true);
  } elseif ($repo === 'match_report_team_stats' || $repo === 'match_report_players') {
    $row = inherit_results_identity($pdo,$gw,$row,false);
  } elseif ($repo === 'sm_player_stats') {
    $key = trim((string)($row['competition_key'] ?? ''));
    if ($key === '') throw new RuntimeException('competition_key_required');
    if (!str_starts_with($key,$gw.'|')) throw new RuntimeException('competition_key_game_world_mismatch');
  }

  return validate_row_against_schema($row,$schema);
}

function read_public_table(PDO $pdo, string $table, string $gw, string $repo, string $source): never {
  $schema = table_schema($pdo,$table);
  $where=[]; $values=[];
  foreach ($_GET as $key=>$value) {
    if (!str_starts_with((string)$key,'filter_')) continue;
    $column=substr((string)$key,7);
    if (!valid_identifier($column) || !isset($schema[$column])) out(['ok'=>false,'error'=>'invalid_filter','column'=>$column],422);
    if (is_array($value)) out(['ok'=>false,'error'=>'invalid_filter_value','column'=>$column],422);
    if ((string)$value === '__NULL__') $where[]="`{$column}` IS NULL";
    elseif ((string)$value === '__NOT_NULL__') $where[]="`{$column}` IS NOT NULL";
    else { $where[]="`{$column}` = ?"; $values[]=(string)$value; }
  }
  $limit=max(1,min(1000,(int)($_GET['limit'] ?? 500))); $offset=max(0,(int)($_GET['offset'] ?? 0));
  $whereSql=$where?' WHERE '.implode(' AND ',$where):'';
  $orderBy=trim((string)($_GET['order_by'] ?? '')); $orderDir=strtoupper(trim((string)($_GET['order_dir'] ?? 'ASC'))); $orderSql='';
  if ($orderBy !== '') {
    if (!valid_identifier($orderBy) || !isset($schema[$orderBy])) out(['ok'=>false,'error'=>'invalid_order_by'],422);
    if (!in_array($orderDir,['ASC','DESC'],true)) $orderDir='ASC';
    $orderSql=" ORDER BY `{$orderBy}` {$orderDir}";
  }
  $countStmt=$pdo->prepare("SELECT COUNT(*) AS c FROM `{$table}`{$whereSql}"); $countStmt->execute($values); $total=(int)($countStmt->fetch()['c'] ?? 0);
  $stmt=$pdo->prepare("SELECT * FROM `{$table}`{$whereSql}{$orderSql} LIMIT {$limit} OFFSET {$offset}"); $stmt->execute($values); $rows=$stmt->fetchAll();
  out(['ok'=>true,'action'=>'public_read','service'=>'IMC Universal Gateway','version'=>public_gateway_version(),'source'=>$source,'game_world_id'=>$gw,'repository'=>$repo,'table'=>$table,'data'=>$rows,'pagination'=>['total'=>$total,'limit'=>$limit,'offset'=>$offset,'returned'=>count($rows)]]);
}

$cfg = require __DIR__.'/config.php';
require_once __DIR__.'/database.php';
$method=(string)($_SERVER['REQUEST_METHOD'] ?? '');

if ($method === 'GET') {
  $gw=strtoupper(trim((string)($_GET['game_world_id'] ?? ''))); $action=strtolower(trim((string)($_GET['action'] ?? 'read'))); $repo=strtolower(trim((string)($_GET['repository'] ?? ''))); $source=strtolower(trim((string)($_GET['source'] ?? 'world')));
  if (!valid_gw($gw)) out(['ok'=>false,'error'=>'invalid_game_world'],422);
  if ($source === 'core') {
    if (!in_array($repo,public_core_tables(),true)) out(['ok'=>false,'error'=>'core_repository_not_enabled'],422);
    try { $pdo=imc_core_db($cfg); read_public_table($pdo,$repo,$gw,$repo,'core'); } catch(Throwable $e) { out(['ok'=>false,'error'=>'gateway_read_error'],500); }
  }
  if ($source !== '' && $source !== 'world') out(['ok'=>false,'error'=>'invalid_source'],422);
  try { $pdo=imc_db($cfg,$gw); } catch(Throwable $e) { out(['ok'=>false,'error'=>'database_connection_failed'],500); }
  try {
    if ($action === 'repositories' || $action === 'discover') {
      $tables=discover_world_tables($pdo,$gw); $repositories=[];
      foreach($tables as $repository=>$table) $repositories[]=['repository'=>$repository,'table'=>$table];
      out(['ok'=>true,'action'=>'repositories','service'=>'IMC Universal Gateway','version'=>public_gateway_version(),'game_world_id'=>$gw,'repositories'=>$repositories,'count'=>count($repositories)]);
    }
    if ($action === 'schema') {
      $table=resolve_world_table($pdo,$gw,$repo);
      out(['ok'=>true,'action'=>'schema','service'=>'IMC Universal Gateway','version'=>public_gateway_version(),'game_world_id'=>$gw,'repository'=>$repo,'table'=>$table,'columns'=>table_schema($pdo,$table),'indexes'=>table_indexes($pdo,$table)]);
    }
    if ($action !== '' && $action !== 'read' && $action !== 'public_read') out(['ok'=>false,'error'=>'unknown_public_action'],422);
    $table=resolve_world_table($pdo,$gw,$repo); read_public_table($pdo,$table,$gw,$repo,'world');
  } catch(Throwable $e) { out(['ok'=>false,'error'=>$e->getMessage()],$e->getMessage()==='repository_not_found'?404:500); }
}

if ($method !== 'POST') out(['ok'=>false,'error'=>'method_not_allowed'],405);
if (($cfg['token'] ?? '') === '') out(['ok'=>false,'error'=>'gateway_token_not_configured'],500);
$token=(string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] ?? '');
if (!hash_equals((string)$cfg['token'],$token)) out(['ok'=>false,'error'=>'unauthorized'],401);
$body=json_decode(file_get_contents('php://input') ?: '',true); if (!is_array($body)) out(['ok'=>false,'error'=>'invalid_json'],400);
$action=(string)($body['action'] ?? ''); $gw=strtoupper(trim((string)($body['game_world_id'] ?? ''))); $repo=strtolower(trim((string)($body['repository'] ?? '')));
if ($action === 'health') out(['ok'=>true,'service'=>'IMC Universal Gateway','version'=>public_gateway_version(),'repositories'=>$cfg['repositories'],'worlds'=>array_merge($cfg['gold_worlds'],$cfg['custom_worlds'])]);
if (!valid_gw($gw)) out(['ok'=>false,'error'=>'invalid_game_world'],422);
if ($action === 'probe') {
  try { $pdo=imc_db($cfg,$gw); $row=$pdo->query('SELECT DATABASE() AS db, 1 AS ok')->fetch(); out(['ok'=>true,'action'=>'probe','service'=>'IMC Universal Gateway','version'=>public_gateway_version(),'game_world_id'=>$gw,'database'=>$row['db'] ?? null,'database_connection'=>(int)($row['ok'] ?? 0)===1?'ok':'failed']); }
  catch(Throwable $e) { out(['ok'=>false,'action'=>'probe','game_world_id'=>$gw,'error'=>$e->getMessage()],500); }
}
if (!in_array($repo,$cfg['repositories'],true)) out(['ok'=>false,'error'=>'repository_not_enabled'],422);
try { $pdo=imc_db($cfg,$gw); $table=resolve_world_table($pdo,$gw,$repo); } catch(Throwable $e) { out(['ok'=>false,'error'=>$e->getMessage()],$e->getMessage()==='repository_not_found'?404:500); }

try {
  if ($action === 'read') {
    $limit=max(1,min(1000,(int)($body['limit'] ?? 100))); $stmt=$pdo->query("SELECT * FROM `{$table}` LIMIT {$limit}");
    out(['ok'=>true,'action'=>'read','table'=>$table,'rows'=>$stmt->fetchAll()]);
  }
  if ($action === 'schema') out(['ok'=>true,'action'=>'schema','table'=>$table,'columns'=>table_schema($pdo,$table),'indexes'=>table_indexes($pdo,$table)]);
  if ($action === 'query') {
    $sql=trim((string)($body['sql'] ?? '')); if (!preg_match('/^(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i',$sql)) out(['ok'=>false,'error'=>'read_only_query_required'],422);
    $stmt=$pdo->query($sql); out(['ok'=>true,'action'=>'query','rows'=>$stmt->fetchAll()]);
  }
  if ($action === 'insert_many') {
    $rows=$body['rows'] ?? $body['items'] ?? null; if (!is_array($rows) || !$rows) out(['ok'=>false,'error'=>'rows_required'],422);
    $schema=table_schema($pdo,$table);
    if (count($schema) === 1 && isset($schema['__placeholder'])) out(['ok'=>false,'error'=>'repository_placeholder_read_only'],422);
    $count=0; $pdo->beginTransaction();
    foreach($rows as $row) {
      if (!is_array($row) || !$row) throw new RuntimeException('invalid_row');
      $row=normalize_insert_row($pdo,$gw,$repo,$row,$schema);
      $cols=array_keys($row); $names='`'.implode('`,`',$cols).'`'; $ph=implode(',',array_fill(0,count($cols),'?'));
      $st=$pdo->prepare("INSERT INTO `{$table}` ({$names}) VALUES ({$ph})"); $st->execute(array_values($row)); $count++;
    }
    $pdo->commit(); out(['ok'=>true,'action'=>'insert_many','table'=>$table,'inserted'=>$count]);
  }
  if ($action === 'delete') {
    $where=$body['where'] ?? null; if (!is_array($where)||!$where) out(['ok'=>false,'error'=>'where_required'],422);
    $schema=table_schema($pdo,$table); $parts=[]; $vals=[];
    foreach($where as $c=>$v) { if(!valid_identifier((string)$c)||!isset($schema[$c])) out(['ok'=>false,'error'=>'field_not_allowed','field'=>$c],422); $parts[]="`{$c}` = ?"; $vals[]=$v; }
    $st=$pdo->prepare("DELETE FROM `{$table}` WHERE ".implode(' AND ',$parts)); $st->execute($vals); out(['ok'=>true,'action'=>'delete','table'=>$table,'deleted'=>$st->rowCount()]);
  }
  if ($action === 'execute_sql') {
    $sql=trim((string)($body['sql'] ?? '')); if($sql==='') out(['ok'=>false,'error'=>'sql_required'],422); $affected=$pdo->exec($sql); out(['ok'=>true,'action'=>'execute_sql','affected_rows'=>$affected]);
  }
  out(['ok'=>false,'error'=>'unknown_action'],422);
} catch(Throwable $e) {
  if(isset($pdo)&&$pdo->inTransaction()) $pdo->rollBack();
  out(['ok'=>false,'error'=>'gateway_error','message'=>$e->getMessage()],500);
}
