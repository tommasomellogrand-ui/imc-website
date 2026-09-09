<?php
declare(strict_types=1);

function imc_minisite_out(array $body, int $status = 200): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function imc_minisite_config(): array {
    $file = dirname(__DIR__).'/__imc_private_gateway/config.php';
    if (!is_file($file)) throw new RuntimeException('gateway_configuration_not_found');
    $config = require $file;
    if (!is_array($config)) throw new RuntimeException('gateway_configuration_not_found');
    return $config;
}

function imc_minisite_db(array $config): PDO {
    $db = $config['db']['core'] ?? null;
    if (!$db) throw new RuntimeException('core_database_not_configured');
    return new PDO(
        sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config['db']['host'],
            $config['db']['port'],
            $db
        ),
        $config['db']['user'],
        $config['db']['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
}

function imc_minisite_gw(array $body): string {
    $gw = strtoupper(trim((string)($body['game_world_id'] ?? '')));
    if (!preg_match('/^GW\d{3}$/', $gw)) throw new InvalidArgumentException('invalid_game_world');
    return $gw;
}

function imc_minisite_positive_id(mixed $value, string $error): int {
    if (!(is_int($value) || (is_string($value) && preg_match('/^[0-9]+$/', $value)))) {
        throw new InvalidArgumentException($error);
    }
    $id = (int)$value;
    if ($id <= 0) throw new InvalidArgumentException($error);
    return $id;
}

function imc_minisite_page(array $body, int $defaultLimit = 100, int $maxLimit = 500): array {
    $limit = isset($body['limit']) ? (int)$body['limit'] : $defaultLimit;
    $offset = isset($body['offset']) ? (int)$body['offset'] : 0;
    if ($limit < 1) $limit = $defaultLimit;
    if ($offset < 0) $offset = 0;
    return [min($limit, $maxLimit), $offset];
}

function imc_minisite_search(array $body): string {
    $search = trim((string)($body['search'] ?? ''));
    if (mb_strlen($search) > 100) throw new InvalidArgumentException('invalid_payload');
    return $search;
}

function imc_minisite_rows(PDO $pdo, string $sql, array $params = []): array {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function imc_minisite_read(array $body): never {
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
    $allowed = [
        'game_world_codex',
        'game_world_club_mapping',
        'competition_codex',
        'country_codex',
        'national_team_codex',
        'club_codex',
        'manager_codex',
        'manager_assignments',
        'player_codex',
        'player_data',
        'rating_history',
    ];
    if (!in_array($resource, $allowed, true)) {
        imc_minisite_out(['ok' => false, 'error' => 'invalid_resource'], 422);
    }

    $pdo = imc_minisite_db($config);
    $rows = [];
    $meta = [];

    switch ($resource) {
        case 'game_world_codex': {
            $gw = imc_minisite_gw($body);
            $rows = imc_minisite_rows(
                $pdo,
                'SELECT `IMC GW` AS game_world_id, `IMC GW Name` AS game_world_name, `SM Game World ID` AS sm_game_world_id, `Active Club` AS active_club, `Country` AS country FROM `IMC Game World Codex Global` WHERE `IMC GW`=? LIMIT 1',
                [$gw]
            );
            break;
        }

        case 'game_world_club_mapping': {
            $gw = imc_minisite_gw($body);
            $rows = imc_minisite_rows(
                $pdo,
                'SELECT `Game World` AS game_world_id, `Club ID` AS club_id, `Club Name` AS club_name, `SM Club ID` AS sm_club_id FROM `IMC Game World Club Mapping` WHERE `Game World`=? ORDER BY `Club Name`',
                [$gw]
            );
            break;
        }

        case 'competition_codex': {
            $gw = imc_minisite_gw($body);
            $rows = imc_minisite_rows(
                $pdo,
                'SELECT id, game_world_id, sm_action, custom_competition, sm_action_group, sm_country, sm_division, teams_count, expected_match, is_sm_action FROM `IMC Competition Codex Global` WHERE game_world_id=? ORDER BY sm_action_group, sm_country, sm_division, sm_action, custom_competition',
                [$gw]
            );
            break;
        }

        case 'country_codex':
            $rows = imc_minisite_rows($pdo, 'SELECT id, name FROM `IMC Country Codex Global` ORDER BY name');
            break;

        case 'national_team_codex':
            $rows = imc_minisite_rows($pdo, 'SELECT id, name, image_file, image_url FROM `IMC National Team Codex Global` ORDER BY name');
            break;

        case 'club_codex': {
            if (isset($body['club_id']) && $body['club_id'] !== '') {
                $clubId = imc_minisite_positive_id($body['club_id'], 'invalid_club_id');
                $rows = imc_minisite_rows($pdo, 'SELECT id, name, image_file, image_url FROM `IMC Club Codex Global` WHERE id=? LIMIT 1', [$clubId]);
                break;
            }
            [$limit, $offset] = imc_minisite_page($body, 100, 500);
            $search = imc_minisite_search($body);
            $sql = 'SELECT id, name, image_file, image_url FROM `IMC Club Codex Global`';
            $params = [];
            if ($search !== '') {
                $sql .= ' WHERE name LIKE ?';
                $params[] = '%'.$search.'%';
            }
            $sql .= ' ORDER BY name, id LIMIT '.$limit.' OFFSET '.$offset;
            $rows = imc_minisite_rows($pdo, $sql, $params);
            $meta = ['limit' => $limit, 'offset' => $offset];
            break;
        }

        case 'manager_codex': {
            $managerId = trim((string)($body['manager_id'] ?? ''));
            if ($managerId !== '') {
                if (mb_strlen($managerId) > 64) throw new InvalidArgumentException('invalid_manager_id');
                $rows = imc_minisite_rows($pdo, 'SELECT manager_id, full_name, imc_join_date, sm_manager_id FROM `IMC Manager Codex Global` WHERE manager_id=? LIMIT 1', [$managerId]);
                break;
            }
            [$limit, $offset] = imc_minisite_page($body, 100, 200);
            $search = imc_minisite_search($body);
            $sql = 'SELECT manager_id, full_name, imc_join_date, sm_manager_id FROM `IMC Manager Codex Global`';
            $params = [];
            if ($search !== '') {
                $sql .= ' WHERE full_name LIKE ?';
                $params[] = '%'.$search.'%';
            }
            $sql .= ' ORDER BY full_name, manager_id LIMIT '.$limit.' OFFSET '.$offset;
            $rows = imc_minisite_rows($pdo, $sql, $params);
            $meta = ['limit' => $limit, 'offset' => $offset];
            break;
        }

        case 'manager_assignments': {
            $gw = imc_minisite_gw($body);
            $rows = imc_minisite_rows(
                $pdo,
                'SELECT id, game_world_id, manager_id, full_name, club_id, assignment_type, start_date, end_date, national_team_id FROM `IMC Manager Assignment Global` WHERE game_world_id=? ORDER BY start_date DESC, id DESC',
                [$gw]
            );
            break;
        }

        case 'player_codex': {
            if (isset($body['player_id']) && $body['player_id'] !== '') {
                $playerId = imc_minisite_positive_id($body['player_id'], 'invalid_player_id');
                $rows = imc_minisite_rows($pdo, 'SELECT id, forename, surname, image_file, image_url FROM `IMC Player Codex Global` WHERE id=? LIMIT 1', [$playerId]);
                break;
            }
            [$limit, $offset] = imc_minisite_page($body, 50, 200);
            $search = imc_minisite_search($body);
            $sql = 'SELECT id, forename, surname, image_file, image_url FROM `IMC Player Codex Global`';
            $params = [];
            if ($search !== '') {
                $sql .= " WHERE CONCAT_WS(' ', forename, surname) LIKE ?";
                $params[] = '%'.$search.'%';
            }
            $sql .= ' ORDER BY surname, forename, id LIMIT '.$limit.' OFFSET '.$offset;
            $rows = imc_minisite_rows($pdo, $sql, $params);
            $meta = ['limit' => $limit, 'offset' => $offset];
            break;
        }

        case 'player_data': {
            if (isset($body['player_id']) && $body['player_id'] !== '') {
                $playerId = imc_minisite_positive_id($body['player_id'], 'invalid_player_id');
                $rows = imc_minisite_rows(
                    $pdo,
                    'SELECT player_id, full_name, nationality, position, rating, market_value, age, date_of_birth, height_cm, weight_kg, foot, soccerwiki_club_name, soccerwiki_club_id, wage, updated_at FROM `IMC Player Codex Global Data` WHERE player_id=? LIMIT 1',
                    [$playerId]
                );
                break;
            }
            [$limit, $offset] = imc_minisite_page($body, 100, 500);
            $rows = imc_minisite_rows(
                $pdo,
                'SELECT player_id, full_name, nationality, position, rating, market_value, age, date_of_birth, height_cm, weight_kg, foot, soccerwiki_club_name, soccerwiki_club_id, wage, updated_at FROM `IMC Player Codex Global Data` ORDER BY updated_at DESC, player_id LIMIT '.$limit.' OFFSET '.$offset
            );
            $meta = ['limit' => $limit, 'offset' => $offset];
            break;
        }

        case 'rating_history': {
            $playerId = imc_minisite_positive_id($body['player_id'] ?? null, 'invalid_player_id');
            [$limit, $offset] = imc_minisite_page($body, 100, 500);
            $rows = imc_minisite_rows(
                $pdo,
                'SELECT id, player_id, change_date, old_rating, new_rating, imported_at FROM `IMC Player Codex Global Rating History` WHERE player_id=? ORDER BY change_date DESC, id DESC LIMIT '.$limit.' OFFSET '.$offset,
                [$playerId]
            );
            $meta = ['limit' => $limit, 'offset' => $offset];
            break;
        }
    }

    imc_minisite_out([
        'ok' => true,
        'action' => 'minisite_read',
        'channel' => 'MINISITE',
        'source' => 'core',
        'database' => (string)$config['db']['core'],
        'resource' => $resource,
        'rows' => $rows,
        'returned_rows' => count($rows),
        ...$meta,
        'duration_ms' => (int)round((microtime(true) - $started) * 1000),
    ]);
}
