<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedOrigins = [
  'https://www.italianmastersclub.it',
  'https://italianmastersclub.it',
];
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
  header('Access-Control-Allow-Origin: '.$origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function team_hub_out(array $payload, int $status = 200): never {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function team_hub_core_db(array $cfg): PDO {
  $db = 'Sql1956795_1';
  if (($cfg['db']['user'] ?? '') === '') throw new RuntimeException('db_credentials_not_configured');
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$cfg['db']['host'],$cfg['db']['port'],$db);
  return new PDO($dsn,$cfg['db']['user'],$cfg['db']['pass'],[
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
}

function team_hub_https_image(?string $url): ?string {
  $url = trim((string)$url);
  if ($url === '') return null;
  if (str_starts_with($url,'http://')) return 'https://'.substr($url,7);
  return $url;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') team_hub_out(['ok'=>false,'error'=>'method_not_allowed'],405);

$gw = strtoupper(trim((string)($_GET['game_world_id'] ?? '')));
$dataset = strtolower(trim((string)($_GET['dataset'] ?? '')));
if (!preg_match('/^GW00[1-9]$/',$gw)) team_hub_out(['ok'=>false,'error'=>'invalid_game_world'],422);
if (!in_array($dataset,['clubs','nations'],true)) team_hub_out(['ok'=>false,'error'=>'invalid_dataset'],422);

$cfg = require __DIR__.'/config.php';

try {
  $core = team_hub_core_db($cfg);

  if ($dataset === 'clubs') {
    $stmt = $core->prepare("SELECT m.club_id,m.club_gw_id,CASE WHEN c.name LIKE '1.%' THEN TRIM(SUBSTRING(c.name,3)) ELSE c.name END AS name,c.short_name,c.image_url FROM clubs_game_world_id m INNER JOIN clubs c ON c.club_id=m.club_id WHERE m.game_world_id=? ORDER BY name ASC");
    $stmt->execute([$gw]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) $row['image_url'] = team_hub_https_image($row['image_url'] ?? null);
    unset($row);
    team_hub_out([
      'ok'=>true,
      'dataset'=>'clubs',
      'game_world_id'=>$gw,
      'source'=>'Sql1956795_1.clubs_game_world_id + clubs',
      'count'=>count($rows),
      'data'=>$rows,
    ]);
  }

  $mapStmt = $core->prepare("SELECT nation_id,nation_gw_id FROM nations_game_world_id WHERE game_world_id=? ORDER BY nation_id ASC");
  $mapStmt->execute([$gw]);
  $mapping = $mapStmt->fetchAll();

  /*
   * The Game World mapping contains the 80 playable national slots.
   * national_teams is the canonical CORE identity source.  The original
   * source order for the playable set is alphabetical, matching nation_id
   * 1..80 used by nations_game_world_id.
   */
  $master = $core->query("SELECT national_team_id,name,short_name,image_url FROM national_teams WHERE is_active=1 ORDER BY name ASC LIMIT 80")->fetchAll();
  $rows=[];
  $count=min(count($mapping),count($master));
  for($i=0;$i<$count;$i++) {
    $rows[]=[
      'nation_id'=>$mapping[$i]['nation_id'],
      'nation_gw_id'=>$mapping[$i]['nation_gw_id'],
      'national_team_id'=>$master[$i]['national_team_id'],
      'name'=>$master[$i]['name'],
      'short_name'=>$master[$i]['short_name'],
      'image_url'=>team_hub_https_image($master[$i]['image_url'] ?? null),
    ];
  }
  usort($rows,static fn(array $a,array $b): int => strcasecmp((string)$a['name'],(string)$b['name']));
  team_hub_out([
    'ok'=>true,
    'dataset'=>'nations',
    'game_world_id'=>$gw,
    'source'=>'Sql1956795_1.nations_game_world_id + national_teams',
    'count'=>count($rows),
    'data'=>$rows,
  ]);
} catch (Throwable $e) {
  team_hub_out(['ok'=>false,'error'=>'team_hub_read_error'],500);
}
