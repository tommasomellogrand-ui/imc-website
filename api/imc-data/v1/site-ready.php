<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3).'/__imc-sm-master/admin/core.php';

const IMC_BETA_WORLD = 'GW004';
const IMC_BETA_DB = 'Sql1956795_3';
const IMC_CORE_DB = 'Sql1956795_1';
const IMC_DEFAULT_LIMIT = 500;
const IMC_MAX_LIMIT = 1000;

function out(array $payload, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=20, stale-while-revalidate=40');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fail(string $message, int $status = 400, string $code = 'BAD_REQUEST'): never {
    out(['ok'=>false,'error'=>$message,'code'=>$code,'generated_at'=>gmdate('c')], $status);
}

function db(string $name): mysqli {
    static $pool = [];
    if (isset($pool[$name])) return $pool[$name];
    if (!in_array($name, [IMC_BETA_DB, IMC_CORE_DB], true)) fail('Database route not allowed.', 500, 'DB_ROUTE');
    $cfg = smm_config()['db'];
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $cx = new mysqli((string)$cfg['host'], (string)$cfg['user'], (string)$cfg['password'], $name);
    $cx->set_charset('utf8mb4');
    return $pool[$name] = $cx;
}

function all(mysqli $cx, string $sql, array $params = []): array {
    $st = $cx->prepare($sql);
    $st->execute($params);
    $rows = $st->get_result()->fetch_all(MYSQLI_ASSOC);
    $st->close();
    return $rows;
}

function one(mysqli $cx, string $sql, array $params = []): ?array {
    $rows = all($cx, $sql, $params);
    return $rows[0] ?? null;
}

function positive_int(mixed $value, int $fallback, int $max): int {
    if ($value === null || $value === '') return $fallback;
    if (!is_numeric($value) || (int)$value < 0) fail('Invalid numeric parameter.', 422, 'INVALID_NUMBER');
    return min((int)$value, $max);
}

function allowed_world(): string {
    $world = strtoupper(trim((string)($_GET['game_world_id'] ?? IMC_BETA_WORLD)));
    if ($world !== IMC_BETA_WORLD) fail('This beta endpoint is available only for GW004.', 404, 'WORLD_NOT_AVAILABLE');
    return $world;
}

function image_url(mixed $value): ?string {
    $s = trim((string)($value ?? ''));
    return $s === '' ? null : preg_replace('/^http:/i', 'https:', $s);
}

function ids_from(array $rows, array $fields): array {
    $ids = [];
    foreach ($rows as $row) foreach ($fields as $field) {
        $id = (int)($row[$field] ?? 0);
        if ($id > 0) $ids[$id] = $id;
    }
    return array_values($ids);
}

function club_index(string $world, array $ids): array {
    if (!$ids) return [];
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $rows = all(db(IMC_CORE_DB),
        "SELECT m.club_gw_id,m.club_id,c.name,c.image_url FROM clubs_game_world_id m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.club_id WHERE m.game_world_id=? AND m.club_gw_id IN ($ph)",
        array_merge([$world], $ids)
    );
    $idx = [];
    foreach ($rows as $r) $idx[(string)$r['club_gw_id']] = [
        'club_id'=>(int)$r['club_id'], 'name'=>$r['name'] ?? null, 'image_url'=>image_url($r['image_url'] ?? null)
    ];
    return $idx;
}

function manager_index(array $ids): array {
    if (!$ids) return [];
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $rows = all(db(IMC_CORE_DB), "SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` WHERE sm_manager_id IN ($ph)", $ids);
    $idx = [];
    foreach ($rows as $r) $idx[(string)$r['sm_manager_id']] = ['manager_id'=>$r['manager_id'],'full_name'=>$r['full_name']];
    return $idx;
}

function player_index(array $ids): array {
    if (!$ids) return [];
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $rows = all(db(IMC_CORE_DB), "SELECT id,forename,surname,image_url FROM `IMC Player Codex Global` WHERE id IN ($ph)", $ids);
    $idx = [];
    foreach ($rows as $r) $idx[(string)$r['id']] = [
        'player_id'=>(int)$r['id'], 'forename'=>$r['forename'], 'surname'=>$r['surname'],
        'full_name'=>trim((string)$r['forename'].' '.(string)$r['surname']), 'image_url'=>image_url($r['image_url'] ?? null)
    ];
    return $idx;
}

function enrich(string $world, string $repo, array $rows): array {
    $clubFields = match ($repo) {
        'results','match_report' => ['home_sm_club_id','away_sm_club_id'],
        'schedule' => ['home_sm_team_id','away_sm_team_id'],
        'transfers' => ['from_sm_world_club_id','to_sm_world_club_id'],
        'sm_player_stats' => ['sm_club_id'],
        'player_codex' => ['current_sm_club_id'],
        default => [],
    };
    $clubs = club_index($world, ids_from($rows, $clubFields));
    $managers = manager_index(ids_from($rows, ['home_sm_manager_id','away_sm_manager_id']));
    $players = player_index(ids_from($rows, ['player_id','sm_player_id']));

    foreach ($rows as &$r) {
        $attachClub = static function(array &$row, string $idField, string $prefix) use ($clubs): void {
            $club = $clubs[(string)($row[$idField] ?? '')] ?? null;
            $row[$prefix.'_club_id'] = $club['club_id'] ?? null;
            $row[$prefix.'_image_url'] = $club['image_url'] ?? null;
        };
        if ($repo === 'results' || $repo === 'match_report') {
            $attachClub($r,'home_sm_club_id','home'); $attachClub($r,'away_sm_club_id','away');
        } elseif ($repo === 'schedule') {
            $attachClub($r,'home_sm_team_id','home'); $attachClub($r,'away_sm_team_id','away');
        } elseif ($repo === 'transfers') {
            $attachClub($r,'from_sm_world_club_id','from'); $attachClub($r,'to_sm_world_club_id','to');
        } elseif ($repo === 'sm_player_stats') {
            $attachClub($r,'sm_club_id','club');
        } elseif ($repo === 'player_codex') {
            $attachClub($r,'current_sm_club_id','club');
        }
        foreach (['home','away'] as $side) {
            $mid = (string)($r[$side.'_sm_manager_id'] ?? '');
            if ($mid !== '' && isset($managers[$mid])) {
                $r[$side.'_manager_id'] = $managers[$mid]['manager_id'];
                $r[$side.'_manager_name'] = $managers[$mid]['full_name'];
            }
        }
        $pid = (string)($r['player_id'] ?? $r['sm_player_id'] ?? '');
        if ($pid !== '' && isset($players[$pid])) {
            $r['player_full_name'] = $players[$pid]['full_name'];
            $r['player_image_url'] = $players[$pid]['image_url'];
        }
    }
    unset($r);
    return $rows;
}

function world_payload(string $world): never {
    $row = one(db(IMC_CORE_DB), "SELECT `IMC GW`,`IMC GW Name`,`SM Game World ID`,`Active Club`,`Country` FROM `IMC Game World Codex Global` WHERE `IMC GW`=? LIMIT 1", [$world]);
    if (!$row) fail('World not found in CORE.', 404, 'WORLD_NOT_FOUND');
    out(['ok'=>true,'data'=>[
        'game_world_id'=>$row['IMC GW'], 'world_name'=>$row['IMC GW Name'],
        'sm_game_world_id'=>(int)$row['SM Game World ID'], 'active_clubs'=>(int)$row['Active Club'],
        'country'=>$row['Country']
    ],'source'=>'MYSQL_CORE.IMC Game World Codex Global','generated_at'=>gmdate('c')]);
}

function competition_codex(string $world): never {
    $rows = all(db(IMC_CORE_DB), "SELECT id,game_world_id,sm_action,custom_competition,sm_action_group,sm_country,sm_division,teams_count,expected_match,is_sm_action FROM `IMC Competition Codex Global` WHERE game_world_id=? ORDER BY sm_action_group,sm_action,sm_division", [$world]);
    out(['ok'=>true,'data'=>$rows,'pagination'=>['total'=>count($rows),'limit'=>count($rows),'offset'=>0,'returned'=>count($rows)],'source'=>'MYSQL_CORE.IMC Competition Codex Global','generated_at'=>gmdate('c')]);
}

$world = allowed_world();
$dataset = strtolower(trim((string)($_GET['dataset'] ?? '')));
$repoRaw = strtolower(trim((string)($_GET['repository'] ?? '')));
if ($dataset === 'world' || $repoRaw === 'world') world_payload($world);
if ($dataset === 'competition_codex' || in_array($repoRaw, ['competitions','competition_codex'], true)) competition_codex($world);

$aliases = [
    'results'=>'results','schedule'=>'schedule','match_report'=>'match_report','match-report'=>'match_report','matchreport'=>'match_report',
    'transfers'=>'transfers','player_codex'=>'player_codex','player-codex'=>'player_codex','codex'=>'player_codex',
    'sm_player_stats'=>'sm_player_stats','sm-player-stats'=>'sm_player_stats','player_stats'=>'sm_player_stats','stats'=>'sm_player_stats'
];
$repo = $aliases[$repoRaw ?: $dataset] ?? null;
if ($repo === null) fail('Repository not available.', 404, 'REPOSITORY_NOT_AVAILABLE');
$config = [
    'results'=>['table'=>'IMC Site Results','filter'=>'game_world_id','default_order'=>'site_result_id'],
    'schedule'=>['table'=>'IMC Site Schedule','filter'=>'game_world_id','default_order'=>'site_schedule_id'],
    'match_report'=>['table'=>'IMC Site Match Report','filter'=>'game_world_id','default_order'=>'site_match_report_id'],
    'transfers'=>['table'=>'IMC Site Transfers','filter'=>'game_world_id','default_order'=>'imc_transfer_number'],
    'player_codex'=>['table'=>'IMC Site Player Codex','filter'=>'game_world_id','default_order'=>'site_player_codex_id'],
    'sm_player_stats'=>['table'=>'IMC Site SM Player Stats','filter'=>'source_game_world_id','default_order'=>'site_player_stats_id'],
][$repo];

$limit = positive_int($_GET['limit'] ?? null, IMC_DEFAULT_LIMIT, IMC_MAX_LIMIT);
$offset = positive_int($_GET['offset'] ?? null, 0, PHP_INT_MAX);
$allowedOrder = [
    'results'=>['site_result_id','match_date','sm_fixture_id'],
    'schedule'=>['site_schedule_id','match_date','sm_fixture_id'],
    'match_report'=>['site_match_report_id','match_date','sm_fixture_id'],
    'transfers'=>['site_transfer_id','imc_transfer_number','transfer_date','imported_at'],
    'player_codex'=>['site_player_codex_id','player_id','full_name'],
    'sm_player_stats'=>['site_player_stats_id','sm_player_id','goals','appearances','avg_rating'],
][$repo];
$orderBy = (string)($_GET['order_by'] ?? $config['default_order']);
if (!in_array($orderBy, $allowedOrder, true)) $orderBy = $config['default_order'];
$orderDir = strtoupper((string)($_GET['order_dir'] ?? 'ASC')) === 'DESC' ? 'DESC' : 'ASC';

$cx = db(IMC_BETA_DB);
$table = '`'.str_replace('`','``',$config['table']).'`';
$filter = '`'.$config['filter'].'`';
$totalRow = one($cx, "SELECT COUNT(*) total FROM $table WHERE $filter=?", [$world]);
$total = (int)($totalRow['total'] ?? 0);
$rows = all($cx, "SELECT * FROM $table WHERE $filter=? ORDER BY `$orderBy` $orderDir LIMIT ? OFFSET ?", [$world,$limit,$offset]);
$rows = enrich($world, $repo, $rows);

out([
    'ok'=>true,
    'data'=>$rows,
    'pagination'=>['total'=>$total,'limit'=>$limit,'offset'=>$offset,'returned'=>count($rows)],
    'context'=>['game_world_id'=>$world,'repository'=>$repo,'source_table'=>$config['table'],'source'=>'MYSQL_ARUBA_SITE_READY','enrichment'=>'MYSQL_CORE'],
    'generated_at'=>gmdate('c')
]);
