<?php
declare(strict_types=1);

function imc_minisite_site_read(array $body): never {
    $started = microtime(true);

    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        imc_minisite_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }

    $channel = strtoupper(trim((string)($body['channel'] ?? ($_SERVER['HTTP_X_IMC_CHANNEL'] ?? ''))));
    if ($channel !== 'MINISITE') {
        imc_minisite_out(['ok' => false, 'error' => 'invalid_channel'], 422);
    }

    $config = imc_minisite_config();
    $token = (string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] ?? '');
    if ($token === '' || !hash_equals((string)$config['token'], $token)) {
        imc_minisite_out(['ok' => false, 'error' => 'unauthorized'], 401);
    }

    $resource = strtolower(trim((string)($body['resource'] ?? '')));
    $resources = [
        'results' => ['table' => 'IMC Site Results', 'gw_column' => 'game_world_id', 'order' => '`match_date` DESC, `site_result_id` DESC'],
        'schedule' => ['table' => 'IMC Site Schedule', 'gw_column' => 'game_world_id', 'order' => '`match_date` ASC, `match_time` ASC, `site_schedule_id` ASC'],
        'match_report' => ['table' => 'IMC Site Match Report', 'gw_column' => 'game_world_id', 'order' => '`match_date` DESC, `site_match_report_id` DESC'],
        'transfers' => ['table' => 'IMC Site Transfers', 'gw_column' => 'game_world_id', 'order' => '`transfer_date` DESC, `imc_transfer_number` DESC, `site_transfer_id` DESC'],
        'sm_player_stats' => ['table' => 'IMC Site SM Player Stats', 'gw_column' => 'source_game_world_id', 'order' => '`competition_key` ASC, `site_player_stats_id` ASC'],
    ];
    if (!isset($resources[$resource])) {
        imc_minisite_out(['ok' => false, 'error' => 'invalid_resource'], 422);
    }

    $gw = imc_minisite_gw($body);
    if (in_array($gw, $config['gold_worlds'] ?? [], true)) {
        $database = (string)($config['db']['gold'] ?? '');
        $family = 'MULTI_LEAGUE';
    } elseif (in_array($gw, $config['custom_worlds'] ?? [], true)) {
        $database = (string)($config['db']['custom'] ?? '');
        $family = 'SINGLE_LEAGUE';
    } else {
        throw new InvalidArgumentException('unsupported_game_world');
    }
    if ($database === '') throw new RuntimeException('site_database_not_configured');

    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config['db']['host'],
            $config['db']['port'],
            $database
        ),
        $config['db']['user'],
        $config['db']['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    [$limit, $offset] = imc_minisite_page($body, 200, 1000);
    $definition = $resources[$resource];
    $sql = sprintf(
        'SELECT * FROM `%s` WHERE `%s`=? ORDER BY %s LIMIT %d OFFSET %d',
        $definition['table'],
        $definition['gw_column'],
        $definition['order'],
        $limit,
        $offset
    );
    $rows = imc_minisite_rows($pdo, $sql, [$gw]);

    imc_minisite_out([
        'ok' => true,
        'action' => 'minisite_read',
        'channel' => 'MINISITE',
        'source' => 'site',
        'family' => $family,
        'database' => $database,
        'game_world_id' => $gw,
        'resource' => $resource,
        'rows' => $rows,
        'returned_rows' => count($rows),
        'limit' => $limit,
        'offset' => $offset,
        'duration_ms' => (int)round((microtime(true) - $started) * 1000),
    ]);
}
