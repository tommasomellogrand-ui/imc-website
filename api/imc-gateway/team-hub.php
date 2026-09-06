<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

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
  if (($cfg['db']['user'] ?? '') === '') {
    throw new RuntimeException('db_credentials_not_configured');
  }
  $dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
    $cfg['db']['host'],
    $cfg['db']['port'],
    $db
  );
  return new PDO(
    $dsn,
    $cfg['db']['user'],
    $cfg['db']['pass'],
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]
  );
}

function team_hub_name_key(string $value): string {
  $value = trim($value);
  if (function_exists('mb_strtolower')) {
    return mb_strtolower($value, 'UTF-8');
  }
  return strtolower($value);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  team_hub_out(['ok'=>false,'error'=>'method_not_allowed'],405);
}

$gw = strtoupper(trim((string)($_GET['game_world_id'] ?? '')));
$dataset = strtolower(trim((string)($_GET['dataset'] ?? '')));

if (!preg_match('/^GW00[1-9]$/', $gw)) {
  team_hub_out(['ok'=>false,'error'=>'invalid_game_world'],422);
}
if (!in_array($dataset, ['clubs','nations'], true)) {
  team_hub_out(['ok'=>false,'error'=>'invalid_dataset'],422);
}

$cfg = require __DIR__.'/config.php';
require_once __DIR__.'/database.php';

try {
  $core = team_hub_core_db($cfg);

  if ($dataset === 'clubs') {
    $stmt = $core->prepare(
      "SELECT
         c.club_id,
         CASE
           WHEN c.name LIKE '1.%' THEN TRIM(SUBSTRING(c.name, 3))
           ELSE c.name
         END AS name,
         c.short_name,
         c.image_url,
         m.club_gw_id
       FROM clubs c
       INNER JOIN clubs_game_world_id m ON m.club_id = c.club_id
       WHERE m.game_world_id = ?
         AND c.is_active = 1
       ORDER BY name ASC"
    );
    $stmt->execute([$gw]);
    $rows = $stmt->fetchAll();

    team_hub_out([
      'ok'=>true,
      'dataset'=>'clubs',
      'game_world_id'=>$gw,
      'source'=>'Sql1956795_1.CORE · clubs + clubs_game_world_id',
      'association'=>'club_gw_id → club_id',
      'count'=>count($rows),
      'image_count'=>count(array_filter($rows, static fn(array $row): bool => trim((string)($row['image_url'] ?? '')) !== '')),
      'data'=>$rows,
    ]);
  }

  $pdo = imc_db($cfg, $gw);
  $table = $gw.'_results';
  $sql = "SELECT name FROM (
            SELECT DISTINCT home_name AS name
              FROM `{$table}`
             WHERE competition_group = 'NATIONS'
               AND home_name IS NOT NULL
               AND TRIM(home_name) <> ''
            UNION
            SELECT DISTINCT away_name AS name
              FROM `{$table}`
             WHERE competition_group = 'NATIONS'
               AND away_name IS NOT NULL
               AND TRIM(away_name) <> ''
          ) x
          ORDER BY name ASC";
  $worldRows = $pdo->query($sql)->fetchAll();

  $masterRows = $core->query(
    "SELECT national_team_id, name, short_name, image_url
       FROM national_teams
      WHERE is_active = 1"
  )->fetchAll();

  $masterByName = [];
  foreach ($masterRows as $master) {
    $masterByName[team_hub_name_key((string)$master['name'])] = $master;
  }

  $aliases = [
    'republic of macedonia' => 'north macedonia',
  ];

  $rows = [];
  foreach ($worldRows as $worldRow) {
    $name = trim((string)($worldRow['name'] ?? ''));
    if ($name === '') continue;

    $key = team_hub_name_key($name);
    $lookupKey = $aliases[$key] ?? $key;
    $master = $masterByName[$lookupKey] ?? null;

    $rows[] = [
      'name' => $name,
      'national_team_id' => $master['national_team_id'] ?? null,
      'short_name' => $master['short_name'] ?? null,
      'image_url' => $master['image_url'] ?? null,
    ];
  }

  team_hub_out([
    'ok'=>true,
    'dataset'=>'nations',
    'game_world_id'=>$gw,
    'source'=>$table.'.competition_group=NATIONS + Sql1956795_1.CORE.national_teams',
    'count'=>count($rows),
    'image_count'=>count(array_filter($rows, static fn(array $row): bool => trim((string)($row['image_url'] ?? '')) !== '')),
    'data'=>$rows,
  ]);
} catch (Throwable $e) {
  team_hub_out([
    'ok'=>false,
    'error'=>'team_hub_read_error',
  ],500);
}
