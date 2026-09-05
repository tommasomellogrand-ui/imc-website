<?php
declare(strict_types=1);

require_once __DIR__.'/core.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const MIGRATION_TOKEN = 'gwids-20260904-6f83c27ea1b94d7f';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !hash_equals(MIGRATION_TOKEN, (string)($_GET['token'] ?? ''))) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Not found']);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$config = smm_config()['db'];
$db = new mysqli((string)$config['host'], (string)$config['user'], (string)$config['password'], 'Sql1956795_1');
$db->set_charset('utf8mb4');

$db->query(
    "CREATE TABLE IF NOT EXISTS clubs_game_world_id (
        club_id INT UNSIGNED NOT NULL,
        game_world_id VARCHAR(5) NOT NULL,
        club_gw_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (club_id, game_world_id),
        UNIQUE KEY uq_clubs_game_world_local (game_world_id, club_gw_id),
        KEY idx_clubs_game_world (game_world_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$db->query(
    "CREATE TABLE IF NOT EXISTS nations_game_world_id (
        nation_id BIGINT UNSIGNED NOT NULL,
        game_world_id VARCHAR(5) NOT NULL,
        nation_gw_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (nation_id, game_world_id),
        UNIQUE KEY uq_nations_game_world_local (game_world_id, nation_gw_id),
        KEY idx_nations_game_world (game_world_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$clubStatement = $db->prepare(
    'INSERT INTO clubs_game_world_id (club_id,game_world_id,club_gw_id) VALUES (?,?,?) '
    .'ON DUPLICATE KEY UPDATE club_gw_id=VALUES(club_gw_id)'
);
$nationStatement = $db->prepare(
    'INSERT INTO nations_game_world_id (nation_id,game_world_id,nation_gw_id) VALUES (?,?,?) '
    .'ON DUPLICATE KEY UPDATE nation_gw_id=VALUES(nation_gw_id)'
);

$expectedClubs = 0;
$expectedNations = 0;
$perWorld = [];

$db->begin_transaction();
try {
    for ($number = 1; $number <= 9; $number++) {
        $world = sprintf('GW%03d', $number);
        $path = __DIR__.'/game-world-id-import-'.$world.'.json';
        $payload = json_decode((string)file_get_contents($path), true, 64, JSON_THROW_ON_ERROR);
        if (($payload['game_world_id'] ?? null) !== $world) {
            throw new RuntimeException('Game World non coerente nel file '.$world);
        }

        $clubs = is_array($payload['clubs'] ?? null) ? $payload['clubs'] : [];
        $nations = is_array($payload['nations'] ?? null) ? $payload['nations'] : [];
        $perWorld[$world] = ['clubs' => count($clubs), 'nations' => count($nations)];
        $expectedClubs += count($clubs);
        $expectedNations += count($nations);

        foreach ($clubs as $row) {
            if (($row['game_world_id'] ?? null) !== $world) throw new RuntimeException('Club con Game World non coerente');
            $clubId = (int)$row['club_id'];
            $clubGwId = (int)$row['club_gw_id'];
            $clubStatement->bind_param('isi', $clubId, $world, $clubGwId);
            $clubStatement->execute();
        }
        foreach ($nations as $row) {
            if (($row['game_world_id'] ?? null) !== $world) throw new RuntimeException('Nazione con Game World non coerente');
            $nationId = (int)$row['nation_id'];
            $nationGwId = (int)$row['nation_gw_id'];
            $nationStatement->bind_param('isi', $nationId, $world, $nationGwId);
            $nationStatement->execute();
        }
    }
    $db->commit();
} catch (Throwable $exception) {
    $db->rollback();
    throw $exception;
}

$clubCount = (int)$db->query('SELECT COUNT(*) total FROM clubs_game_world_id')->fetch_assoc()['total'];
$nationCount = (int)$db->query('SELECT COUNT(*) total FROM nations_game_world_id')->fetch_assoc()['total'];
$alcione = $db->query("SELECT club_id,game_world_id,club_gw_id FROM clubs_game_world_id WHERE club_id=6542 ORDER BY game_world_id")->fetch_all(MYSQLI_ASSOC);

if ($clubCount !== $expectedClubs || $nationCount !== $expectedNations) {
    throw new RuntimeException('Conteggi finali non coerenti con la sorgente');
}

echo json_encode([
    'ok' => true,
    'database' => 'Sql1956795_1',
    'tables' => [
        'clubs_game_world_id' => $clubCount,
        'nations_game_world_id' => $nationCount,
    ],
    'per_world' => $perWorld,
    'alcione' => $alcione,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
