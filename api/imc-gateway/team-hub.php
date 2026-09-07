<?php
declare(strict_types=1);

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
  header('Content-Type: application/json; charset=utf-8');
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

function team_hub_proxy_url(string $kind, int $id): string {
  return '/api/imc-gateway/team-hub.php?asset='.rawurlencode($kind).'&id='.$id;
}

function team_hub_fetch_image(string $url): array {
  $url = trim($url);
  if ($url === '' || !preg_match('#^https?://#i',$url)) throw new RuntimeException('invalid_image_url');

  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch,[
      CURLOPT_RETURNTRANSFER=>true,
      CURLOPT_FOLLOWLOCATION=>true,
      CURLOPT_MAXREDIRS=>4,
      CURLOPT_CONNECTTIMEOUT=>6,
      CURLOPT_TIMEOUT=>12,
      CURLOPT_USERAGENT=>'IMC-Team-Hub/1.0',
      CURLOPT_HEADER=>false,
      CURLOPT_SSL_VERIFYPEER=>true,
      CURLOPT_SSL_VERIFYHOST=>2,
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
    $type = (string)curl_getinfo($ch,CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    if (!is_string($body) || $body === '' || $status < 200 || $status >= 300) throw new RuntimeException($error !== '' ? $error : 'image_fetch_failed');
    if (!str_starts_with(strtolower($type),'image/')) $type = 'image/png';
    return [$body,$type];
  }

  $ctx = stream_context_create(['http'=>[
    'timeout'=>12,
    'follow_location'=>1,
    'max_redirects'=>4,
    'header'=>"User-Agent: IMC-Team-Hub/1.0\r\n",
  ]]);
  $body = @file_get_contents($url,false,$ctx);
  if (!is_string($body) || $body === '') throw new RuntimeException('image_fetch_failed');
  return [$body,'image/png'];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') team_hub_out(['ok'=>false,'error'=>'method_not_allowed'],405);

$cfg = require __DIR__.'/config.php';

try {
  $core = team_hub_core_db($cfg);
  $asset = strtolower(trim((string)($_GET['asset'] ?? '')));

  if ($asset !== '') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0 || !in_array($asset,['club','nation'],true)) team_hub_out(['ok'=>false,'error'=>'invalid_asset'],422);

    if ($asset === 'club') {
      $stmt = $core->prepare('SELECT image_url FROM clubs WHERE club_id=? LIMIT 1');
    } else {
      $stmt = $core->prepare('SELECT image_url FROM national_teams WHERE national_team_id=? LIMIT 1');
    }
    $stmt->execute([$id]);
    $url = trim((string)($stmt->fetchColumn() ?: ''));
    if ($url === '') team_hub_out(['ok'=>false,'error'=>'image_not_found'],404);

    [$bytes,$contentType] = team_hub_fetch_image($url);
    header('Content-Type: '.$contentType);
    header('Cache-Control: public, max-age=86400');
    header('X-Content-Type-Options: nosniff');
    echo $bytes;
    exit;
  }

  $gw = strtoupper(trim((string)($_GET['game_world_id'] ?? '')));
  $dataset = strtolower(trim((string)($_GET['dataset'] ?? '')));
  if (!preg_match('/^GW00[1-9]$/',$gw)) team_hub_out(['ok'=>false,'error'=>'invalid_game_world'],422);
  if (!in_array($dataset,['clubs','nations'],true)) team_hub_out(['ok'=>false,'error'=>'invalid_dataset'],422);

  if ($dataset === 'clubs') {
    $stmt = $core->prepare("SELECT m.club_id,m.club_gw_id,CASE WHEN c.name LIKE '1.%' THEN TRIM(SUBSTRING(c.name,3)) ELSE c.name END AS name,c.short_name,c.image_url FROM clubs_game_world_id m INNER JOIN clubs c ON c.club_id=m.club_id WHERE m.game_world_id=? ORDER BY name ASC");
    $stmt->execute([$gw]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
      $row['image_url'] = team_hub_proxy_url('club',(int)$row['club_id']);
    }
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
  $master = $core->query("SELECT national_team_id,name,short_name,image_url FROM national_teams WHERE is_active=1 ORDER BY name ASC LIMIT 80")->fetchAll();
  $rows=[];
  $count=min(count($mapping),count($master));
  for($i=0;$i<$count;$i++) {
    $nationalTeamId=(int)$master[$i]['national_team_id'];
    $rows[]=[
      'nation_id'=>$mapping[$i]['nation_id'],
      'nation_gw_id'=>$mapping[$i]['nation_gw_id'],
      'national_team_id'=>$nationalTeamId,
      'name'=>$master[$i]['name'],
      'short_name'=>$master[$i]['short_name'],
      'image_url'=>team_hub_proxy_url('nation',$nationalTeamId),
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
