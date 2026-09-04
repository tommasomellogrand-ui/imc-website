<?php
declare(strict_types=1);

require __DIR__ . '/core.php';

/**
 * IMC | competition_group canonical migration
 *
 * Adds a STORED generated column to gw_competitions in both local storage
 * families. The value is derived only from the exact Soccer Manager
 * competition_name taxonomy approved by the IMC cabina di regia.
 *
 * Mapping:
 *   DOMESTIC      League, League Cup, League Shield, Charity Shield, Playoff
 *   INTERNATIONAL SMFA Champions, SMFA Shield, SMFA Super Cup
 *   NATIONS       World Cup Qualifying, World Cup
 *
 * Any other / missing competition_name remains NULL until explicitly
 * classified by a future approved migration.
 */

function imc_competition_group_expression(): string {
    return "CASE TRIM(`competition_name`)\n"
        . "    WHEN 'League' THEN 'DOMESTIC'\n"
        . "    WHEN 'League Cup' THEN 'DOMESTIC'\n"
        . "    WHEN 'League Shield' THEN 'DOMESTIC'\n"
        . "    WHEN 'Charity Shield' THEN 'DOMESTIC'\n"
        . "    WHEN 'Playoff' THEN 'DOMESTIC'\n"
        . "    WHEN 'SMFA Champions' THEN 'INTERNATIONAL'\n"
        . "    WHEN 'SMFA Shield' THEN 'INTERNATIONAL'\n"
        . "    WHEN 'SMFA Super Cup' THEN 'INTERNATIONAL'\n"
        . "    WHEN 'World Cup Qualifying' THEN 'NATIONS'\n"
        . "    WHEN 'World Cup' THEN 'NATIONS'\n"
        . "    ELSE NULL\n"
        . "END";
}

function imc_competition_group_column_exists(mysqli $db, string $database): bool {
    $stmt = $db->prepare(
        "SELECT COUNT(*) AS total\n"
        . "FROM information_schema.columns\n"
        . "WHERE table_schema=? AND table_name='gw_competitions' AND column_name='competition_group'"
    );
    $stmt->bind_param('s', $database);
    $stmt->execute();
    $exists = (int)$stmt->get_result()->fetch_assoc()['total'] > 0;
    $stmt->close();
    return $exists;
}

function imc_competition_group_apply_to_storage(string $storage): array {
    $registry = smm_storage_registry();
    if (!isset($registry[$storage])) {
        throw new InvalidArgumentException('Unknown storage family.');
    }

    $database = (string)$registry[$storage]['database'];
    if (!in_array($database, ['Sql1956795_2', 'Sql1956795_3'], true)) {
        throw new RuntimeException('competition_group migration is allowed only on local Game World databases.');
    }

    $db = smm_storage_db($storage);
    $selected = (string)$db->query('SELECT DATABASE() AS db')->fetch_assoc()['db'];
    if ($selected !== $database) {
        throw new RuntimeException('Database routing mismatch for ' . $storage . '.');
    }

    $created = false;
    if (!imc_competition_group_column_exists($db, $database)) {
        $expression = imc_competition_group_expression();
        $sql = "ALTER TABLE `gw_competitions`\n"
            . "ADD COLUMN `competition_group` VARCHAR(16)\n"
            . "GENERATED ALWAYS AS (" . $expression . ") STORED\n"
            . "AFTER `competition_name`";
        $db->query($sql);
        $created = true;
    }

    $metaStmt = $db->prepare(
        "SELECT data_type,column_type,is_nullable,extra,generation_expression\n"
        . "FROM information_schema.columns\n"
        . "WHERE table_schema=? AND table_name='gw_competitions' AND column_name='competition_group'\n"
        . "LIMIT 1"
    );
    $metaStmt->bind_param('s', $database);
    $metaStmt->execute();
    $column = $metaStmt->get_result()->fetch_assoc();
    $metaStmt->close();

    $groups = [];
    $res = $db->query(
        "SELECT COALESCE(`competition_group`,'UNCLASSIFIED') AS competition_group,COUNT(*) AS total\n"
        . "FROM `gw_competitions`\n"
        . "GROUP BY COALESCE(`competition_group`,'UNCLASSIFIED')\n"
        . "ORDER BY competition_group"
    );
    while ($row = $res->fetch_assoc()) {
        $groups[(string)$row['competition_group']] = (int)$row['total'];
    }
    $res->free();

    $unclassified = [];
    $res = $db->query(
        "SELECT `competition_name`,COUNT(*) AS total\n"
        . "FROM `gw_competitions`\n"
        . "WHERE `competition_group` IS NULL\n"
        . "GROUP BY `competition_name`\n"
        . "ORDER BY `competition_name`"
    );
    while ($row = $res->fetch_assoc()) {
        $unclassified[] = [
            'competition_name' => $row['competition_name'],
            'total' => (int)$row['total'],
        ];
    }
    $res->free();

    return [
        'storage' => $storage,
        'database' => $database,
        'column_created' => $created,
        'column' => $column,
        'group_counts' => $groups,
        'unclassified_names' => $unclassified,
    ];
}

try {
    smm_require_auth();

    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    $action = (string)($_REQUEST['action'] ?? 'status');
    if (!in_array($action, ['apply', 'status'], true)) {
        throw new InvalidArgumentException('Invalid action. Use apply or status.');
    }

    if ($action === 'apply' && $method !== 'POST') {
        throw new InvalidArgumentException('apply requires POST.');
    }

    $results = [];
    foreach (['gold', 'custom'] as $storage) {
        if ($action === 'apply') {
            $results[] = imc_competition_group_apply_to_storage($storage);
            continue;
        }

        $registry = smm_storage_registry();
        $database = (string)$registry[$storage]['database'];
        $db = smm_storage_db($storage);
        $exists = imc_competition_group_column_exists($db, $database);
        $entry = [
            'storage' => $storage,
            'database' => $database,
            'column_exists' => $exists,
        ];
        if ($exists) {
            $groups = [];
            $res = $db->query(
                "SELECT COALESCE(`competition_group`,'UNCLASSIFIED') AS competition_group,COUNT(*) AS total\n"
                . "FROM `gw_competitions` GROUP BY COALESCE(`competition_group`,'UNCLASSIFIED') ORDER BY competition_group"
            );
            while ($row = $res->fetch_assoc()) {
                $groups[(string)$row['competition_group']] = (int)$row['total'];
            }
            $res->free();
            $entry['group_counts'] = $groups;
        }
        $results[] = $entry;
    }

    smm_json([
        'ok' => true,
        'action' => $action,
        'mapping' => [
            'DOMESTIC' => ['League', 'League Cup', 'League Shield', 'Charity Shield', 'Playoff'],
            'INTERNATIONAL' => ['SMFA Champions', 'SMFA Shield', 'SMFA Super Cup'],
            'NATIONS' => ['World Cup Qualifying', 'World Cup'],
        ],
        'results' => $results,
    ]);
} catch (Throwable $e) {
    $status = http_response_code();
    if ($status < 400) {
        $status = $e instanceof InvalidArgumentException ? 422 : 500;
    }
    smm_json([
        'ok' => false,
        'error' => $e->getMessage(),
    ], $status);
}
