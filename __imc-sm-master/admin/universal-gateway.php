<?php
declare(strict_types=1);

/* ================================================================
   IMC | UNIVERSAL GATEWAY · VERSION 1.0
   RAW REPOSITORY ROUTER · MYSQL ARUBA

   Flusso:
   Importer DOM
      -> universal-gateway.php
      -> GWXXX_repository

   V1.0:
   - repository operativo: results
   - action: probe
   - action: insert_many

   Routing DB:
   GOLD   GW002 GW003 GW007 GW008 -> Sql1956795_2
   CUSTOM GW001 GW004 GW005 GW006 GW009 -> Sql1956795_3

   Nessuna logica competition.
   Nessun mapping verso vecchie tabelle.
   Nessun passaggio intermedio.
   ================================================================ */

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && preg_match('~^https://([a-z0-9-]+\.)?soccermanager\.com$~i', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://it.soccermanager.com');
}
header('Vary: Origin');
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Universal-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function out(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    out(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

/*
 * Usa lo stesso core DB già presente sul server IMC.
 * universal-gateway.php deve essere collocato nello stesso ambiente
 * di ingestion.php / core.php.
 */
$core = __DIR__ . '/core.php';
if (!is_file($core)) {
    out(['ok' => false, 'error' => 'core_not_found'], 500);
}
require_once $core;

$EXPECTED_TOKEN = 'IMC_RESULTS_GOLD_2026_V1_9f6d2c4a7b8e1d3f';
$receivedToken = $_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] ?? '';

if (!hash_equals($EXPECTED_TOKEN, (string)$receivedToken)) {
    out(['ok' => false, 'error' => 'unauthorized'], 401);
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody ?: '', true);

if (!is_array($body)) {
    out(['ok' => false, 'error' => 'invalid_json'], 400);
}

function clean_string(mixed $value): string {
    if ($value === null) return '';
    return trim(preg_replace('/\s+/u', ' ', str_replace("\xC2\xA0", ' ', (string)$value)) ?? '');
}

function nullable_string(mixed $value): ?string {
    $v = clean_string($value);
    return $v === '' ? null : $v;
}

function nullable_int(mixed $value): ?int {
    if ($value === null || $value === '') return null;
    if (!is_numeric($value)) return null;
    return (int)$value;
}

function nullable_bool(mixed $value): ?int {
    if ($value === null || $value === '') return null;
    if (is_bool($value)) return $value ? 1 : 0;
    if ($value === 1 || $value === '1' || strtolower((string)$value) === 'true') return 1;
    if ($value === 0 || $value === '0' || strtolower((string)$value) === 'false') return 0;
    return null;
}

function game_world_target(string $gw): string {
    static $gold = ['GW002', 'GW003', 'GW007', 'GW008'];
    static $custom = ['GW001', 'GW004', 'GW005', 'GW006', 'GW009'];

    if (in_array($gw, $gold, true)) return 'gold';
    if (in_array($gw, $custom, true)) return 'custom';

    throw new RuntimeException('unsupported_game_world');
}

function allowed_repository(string $repository): bool {
    /*
     * V1.0: attiviamo solo results.
     * Gli altri repository verranno aggiunti qui senza cambiare il gateway.
     */
    return in_array($repository, ['results'], true);
}

function table_name(string $gw, string $repository): string {
    if (!preg_match('/^GW00[1-9]$/', $gw)) {
        throw new RuntimeException('invalid_game_world');
    }
    if (!preg_match('/^[a-z][a-z0-9_]*$/', $repository)) {
        throw new RuntimeException('invalid_repository');
    }
    if (!allowed_repository($repository)) {
        throw new RuntimeException('repository_not_enabled');
    }
    return $gw . '_' . $repository;
}

function db_for_game_world(string $gw): PDO {
    $target = game_world_target($gw);

    /*
     * Funzione DB già usata dall'infrastruttura Aruba.
     * Deve restituire PDO sul DB relativo a gold/custom.
     */
    $db = smm_storage_db($target);

    if (!$db instanceof PDO) {
        throw new RuntimeException('database_connection_failed');
    }

    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    return $db;
}

function value_from(array $item, string $camel, ?string $snake = null): mixed {
    if (array_key_exists($camel, $item)) return $item[$camel];
    if ($snake !== null && array_key_exists($snake, $item)) return $item[$snake];
    return null;
}

function normalize_results_row(
    string $gw,
    array $item,
    array $context
): array {
    $raw = is_array($item['raw'] ?? null) ? $item['raw'] : [];

    $fixtureId = nullable_int(
        value_from($item, 'fixtureId', 'fixture_id')
    );

    if ($fixtureId === null) {
        throw new RuntimeException('missing_fixture_id');
    }

    $matchDate = nullable_string(
        $context['match_date']
        ?? $context['matchDate']
        ?? $item['match_date']
        ?? null
    );

    $sourceContext = is_array($context['source_context'] ?? null)
        ? $context['source_context']
        : (is_array($context['sourceContext'] ?? null) ? $context['sourceContext'] : []);

    return [
        'game_world_id' => $gw,
        'imc_season' => nullable_int(
            $context['imc_season']
            ?? $context['imcSeason']
            ?? $item['imc_season']
            ?? null
        ),
        'match_date' => $matchDate,
        'fixture_id' => $fixtureId,

        'sm_action' => nullable_string(value_from($item, 'sm_action', 'sm_action')),
        'sm_division' => nullable_string(value_from($item, 'sm_division', 'sm_division')),
        'sm_country' => nullable_string(value_from($item, 'sm_country', 'sm_country')),
        'sm_compid' => nullable_string(value_from($item, 'sm_compid', 'sm_compid')),
        'sm_round_label' => nullable_string(value_from($item, 'sm_round_label', 'sm_round_label')),
        'competition_key' => nullable_string(value_from($item, 'competition_key', 'competition_key')),

        'group' => nullable_string($item['group'] ?? null),
        'group_name' => nullable_string($item['group_name'] ?? null),
        'group_label' => nullable_string($item['group_label'] ?? null),

        'home_team' => nullable_string(value_from($item, 'homeTeam', 'home_team')),
        'away_team' => nullable_string(value_from($item, 'awayTeam', 'away_team')),
        'home_team_id' => nullable_int(value_from($item, 'homeTeamId', 'home_team_id')),
        'away_team_id' => nullable_int(value_from($item, 'awayTeamId', 'away_team_id')),
        'home_entity_type' => nullable_string(value_from($item, 'homeEntityType', 'home_entity_type')),
        'away_entity_type' => nullable_string(value_from($item, 'awayEntityType', 'away_entity_type')),

        'home_manager_sm_id' => nullable_int(value_from($item, 'homeManagerSmId', 'home_manager_sm_id')),
        'away_manager_sm_id' => nullable_int(value_from($item, 'awayManagerSmId', 'away_manager_sm_id')),
        'home_manager_status' => nullable_string(value_from($item, 'homeManagerStatus', 'home_manager_status')),
        'away_manager_status' => nullable_string(value_from($item, 'awayManagerStatus', 'away_manager_status')),

        'home_score' => nullable_int(value_from($item, 'homeScore', 'home_score')),
        'away_score' => nullable_int(value_from($item, 'awayScore', 'away_score')),
        'decided_on_penalties' => nullable_bool(value_from($item, 'decidedOnPenalties', 'decided_on_penalties')),
        'home_penalties' => nullable_int(value_from($item, 'homePenalties', 'home_penalties')),
        'away_penalties' => nullable_int(value_from($item, 'awayPenalties', 'away_penalties')),
        'penalty_winner_team' => nullable_string(value_from($item, 'penaltyWinnerTeam', 'penalty_winner_team')),
        'penalty_text' => nullable_string(value_from($item, 'penaltyText', 'penalty_text')),

        'home_aggregate_score' => nullable_int(value_from($item, 'homeAggregateScore', 'home_aggregate_score')),
        'away_aggregate_score' => nullable_int(value_from($item, 'awayAggregateScore', 'away_aggregate_score')),
        'qualified_team' => nullable_string(value_from($item, 'qualifiedTeam', 'qualified_team')),
        'qualification_method' => nullable_string(value_from($item, 'qualificationMethod', 'qualification_method')),
        'qualification_text' => nullable_string(value_from($item, 'qualificationText', 'qualification_text')),

        'match_label_raw' => nullable_string($raw['matchLabel'] ?? $raw['match_label_raw'] ?? null),
        'result_onclick_raw' => nullable_string($raw['result_onclick_raw'] ?? null),
        'score_text_raw' => nullable_string($raw['score_text_raw'] ?? null),
        'heading_text_raw' => nullable_string($raw['heading_text_raw'] ?? null),
        'decision_text_raw' => nullable_string($raw['decision_text_raw'] ?? null),
        'home_team_onclick_raw' => nullable_string($raw['home_team_onclick_raw'] ?? null),
        'away_team_onclick_raw' => nullable_string($raw['away_team_onclick_raw'] ?? null),
        'home_manager_onclick_raw' => nullable_string($raw['home_manager_onclick_raw'] ?? null),
        'away_manager_onclick_raw' => nullable_string($raw['away_manager_onclick_raw'] ?? null),
        'entity_type_is_national' => nullable_bool($raw['entity_type_is_national'] ?? null),
        'raw_row_html' => $raw['raw_row_html'] ?? null,
        'result_href' => nullable_string($raw['result_href'] ?? null),
        'result_class' => nullable_string($raw['result_class'] ?? null),
        'result_style' => nullable_string($raw['result_style'] ?? null),
        'home_team_href' => nullable_string($raw['home_team_href'] ?? null),
        'away_team_href' => nullable_string($raw['away_team_href'] ?? null),

        'source_url' => nullable_string(
            $context['source_url']
            ?? $context['sourceUrl']
            ?? null
        ),
        'source_title' => nullable_string(
            $context['source_title']
            ?? $context['sourceTitle']
            ?? null
        ),
        'scanner' => nullable_string(
            $sourceContext['scanner'] ?? null
        ),
        'version' => nullable_string(
            $sourceContext['version'] ?? null
        ),
        'source_page' => nullable_string(
            $sourceContext['page'] ?? null
        ),
        'section_page' => nullable_int(
            $sourceContext['sectionPage']
            ?? $sourceContext['section_page']
            ?? null
        ),
    ];
}

function probe_results(PDO $db, string $table, array $fixtureIds): array {
    $ids = [];

    foreach ($fixtureIds as $value) {
        $id = nullable_int($value);
        if ($id !== null) $ids[$id] = true;
    }

    $ids = array_keys($ids);

    if (!$ids) {
        return [];
    }

    if (count($ids) > 500) {
        throw new RuntimeException('too_many_probe_keys');
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $sql = "SELECT fixture_id FROM `{$table}` WHERE fixture_id IN ({$placeholders})";
    $stmt = $db->prepare($sql);
    $stmt->execute($ids);

    return array_map(
        static fn(array $row): int => (int)$row['fixture_id'],
        $stmt->fetchAll()
    );
}

function insert_results_many(
    PDO $db,
    string $table,
    string $gw,
    array $items,
    array $context
): array {
    if (!$items) {
        return [
            'received' => 0,
            'stored' => 0,
            'skipped' => 0,
            'skippedFixtureIds' => [],
        ];
    }

    if (count($items) > 200) {
        throw new RuntimeException('too_many_items');
    }

    $normalized = [];
    foreach ($items as $item) {
        if (!is_array($item)) continue;
        $normalized[] = normalize_results_row($gw, $item, $context);
    }

    $fixtureIds = array_map(
        static fn(array $row): int => (int)$row['fixture_id'],
        $normalized
    );

    $existing = probe_results($db, $table, $fixtureIds);
    $existingSet = array_fill_keys($existing, true);

    $fresh = array_values(array_filter(
        $normalized,
        static fn(array $row): bool => !isset($existingSet[(int)$row['fixture_id']])
    ));

    if (!$fresh) {
        return [
            'received' => count($normalized),
            'stored' => 0,
            'skipped' => count($existing),
            'skippedFixtureIds' => $existing,
        ];
    }

    $columns = array_keys($fresh[0]);
    $columnSql = implode(', ', array_map(
        static fn(string $column): string => "`{$column}`",
        $columns
    ));
    $placeholderSql = implode(', ', array_fill(0, count($columns), '?'));

    $sql = "INSERT INTO `{$table}` ({$columnSql}) VALUES ({$placeholderSql})";
    $stmt = $db->prepare($sql);

    $db->beginTransaction();

    try {
        $stored = 0;

        foreach ($fresh as $row) {
            $stmt->execute(array_values($row));
            $stored++;
        }

        $db->commit();

        return [
            'received' => count($normalized),
            'stored' => $stored,
            'skipped' => count($existing),
            'skippedFixtureIds' => $existing,
        ];
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
}

try {
    $gw = strtoupper(clean_string($body['game_world_id'] ?? ''));
    $repository = strtolower(clean_string($body['repository'] ?? ''));
    $action = strtolower(clean_string($body['action'] ?? ''));

    if (!preg_match('/^GW00[1-9]$/', $gw)) {
        out(['ok' => false, 'error' => 'invalid_game_world'], 400);
    }

    if ($repository === '') {
        out(['ok' => false, 'error' => 'missing_repository'], 400);
    }

    $table = table_name($gw, $repository);
    $db = db_for_game_world($gw);

    if ($action === 'probe') {
        if ($repository !== 'results') {
            out(['ok' => false, 'error' => 'probe_not_implemented_for_repository'], 400);
        }

        $fixtureIds = is_array($body['fixture_ids'] ?? null)
            ? $body['fixture_ids']
            : [];

        $existing = probe_results($db, $table, $fixtureIds);

        out([
            'ok' => true,
            'version' => '1.0',
            'game_world_id' => $gw,
            'repository' => $repository,
            'table' => $table,
            'existing_fixture_ids' => $existing,
        ]);
    }

    if ($action === 'insert_many') {
        if ($repository !== 'results') {
            out(['ok' => false, 'error' => 'insert_not_implemented_for_repository'], 400);
        }

        $items = is_array($body['items'] ?? null)
            ? $body['items']
            : [];

        $context = is_array($body['context'] ?? null)
            ? $body['context']
            : [];

        $result = insert_results_many(
            $db,
            $table,
            $gw,
            $items,
            $context
        );

        out([
            'ok' => true,
            'version' => '1.0',
            'game_world_id' => $gw,
            'repository' => $repository,
            'table' => $table,
            ...$result,
        ]);
    }

    out(['ok' => false, 'error' => 'unknown_action'], 400);

} catch (Throwable $e) {
    out([
        'ok' => false,
        'error' => 'gateway_error',
        'detail' => $e->getMessage(),
    ], 500);
}
