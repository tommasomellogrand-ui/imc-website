<?php
declare(strict_types=1);

function imc_normalizer_repositories(): array {
    return ['results','match_report','sm_player_stats','schedule'];
}

function imc_normalizer_group(mixed $value): ?string {
    $action = strtolower(trim((string)$value));
    return match ($action) {
        'league','leaguecup','leagueshield','charityshield','playoff' => 'DOMESTIC',
        'smfacup','smfashield','supercup' => 'INTERNATIONAL',
        'interqualifier','worldcup' => 'NATIONS',
        default => null,
    };
}

function imc_normalizer_parse_source_key(string $sourceKey, string $gameWorldId): array {
    $parts = array_map('trim', explode('|', $sourceKey));
    if (!$parts || strtoupper((string)($parts[0] ?? '')) !== $gameWorldId) {
        return ['action'=>null,'country'=>null,'division'=>null];
    }
    $known = static fn(string $v): bool => imc_normalizer_group($v) !== null;
    $action = null; $country = null; $division = null;
    if (isset($parts[1]) && $known($parts[1])) {
        $action = strtolower($parts[1]);
        if (count($parts) >= 4) {
            $country = strtoupper($parts[2]) === 'NULL' || $parts[2] === '' ? null : $parts[2];
            $division = strtoupper($parts[3]) === 'NULL' || $parts[3] === '' ? null : $parts[3];
        } elseif (count($parts) >= 3) {
            $division = strtoupper($parts[2]) === 'NULL' || $parts[2] === '' ? null : $parts[2];
        }
    } elseif (isset($parts[2]) && $known($parts[2])) {
        $country = strtoupper($parts[1]) === 'NULL' || $parts[1] === '' ? null : $parts[1];
        $action = strtolower($parts[2]);
        if (isset($parts[3])) $division = strtoupper($parts[3]) === 'NULL' || $parts[3] === '' ? null : $parts[3];
    }
    return ['action'=>$action,'country'=>$country,'division'=>$division];
}

function imc_normalizer_values(string $gameWorldId, array $row): array {
    $action = strtolower(trim((string)($row['sm_action'] ?? '')));
    $country = trim((string)($row['sm_country'] ?? ''));
    $division = trim((string)($row['sm_division'] ?? ''));
    if ($action === '') {
        $parsed = imc_normalizer_parse_source_key(trim((string)($row['source_competition_key'] ?? '')), $gameWorldId);
        $action = (string)($parsed['action'] ?? '');
        $country = (string)($parsed['country'] ?? '');
        $division = (string)($parsed['division'] ?? '');
    }
    $group = imc_normalizer_group($action);
    if ($action === '' || $group === null) return ['competition_group'=>null,'competition_key'=>null];
    $parts = [$gameWorldId];
    if ($country !== '') $parts[] = $country;
    $parts[] = $group;
    $parts[] = $action;
    if ($division !== '') $parts[] = $division;
    return ['competition_group'=>$group,'competition_key'=>implode('|',$parts)];
}

function imc_normalize_repository_pdo(PDO $pdo, string $gameWorldId, string $repository): array {
    $gameWorldId = strtoupper(trim($gameWorldId));
    $repository = strtolower(trim($repository));
    if (!preg_match('/^GW00[1-9]$/', $gameWorldId)) throw new InvalidArgumentException('invalid_game_world');
    if (!in_array($repository, imc_normalizer_repositories(), true)) return ['ok'=>true,'status'=>'not_applicable','normalized'=>0,'unresolved'=>0];
    $table = $gameWorldId . '_' . $repository;
    $isStats = $repository === 'sm_player_stats';
    $select = $isStats
        ? "SELECT id,source_competition_key FROM `{$table}` WHERE source_competition_key IS NOT NULL AND TRIM(source_competition_key)<>''"
        : ($repository === 'results'
            ? "SELECT id,sm_action,sm_country,sm_division,source_competition_key FROM `{$table}` WHERE source_competition_key IS NOT NULL AND TRIM(source_competition_key)<>''"
            : "SELECT game_world_id,sm_fixture_id,sm_action,sm_country,sm_division,source_competition_key FROM `{$table}` WHERE source_competition_key IS NOT NULL AND TRIM(source_competition_key)<>''");
    $rows = $pdo->query($select)->fetchAll(PDO::FETCH_ASSOC);
    $normalized = 0; $unresolved = 0;
    if ($isStats) {
        $update = $pdo->prepare("UPDATE `{$table}` SET competition_key=? WHERE id=?");
        foreach ($rows as $row) {
            $values = imc_normalizer_values($gameWorldId, $row);
            if ($values['competition_key'] === null) { $unresolved++; continue; }
            $update->execute([$values['competition_key'], $row['id']]);
            $normalized += $update->rowCount() > 0 ? 1 : 0;
        }
    } elseif ($repository === 'results') {
        $update = $pdo->prepare("UPDATE `{$table}` SET competition_group=?,competition_key=? WHERE id=?");
        foreach ($rows as $row) {
            $values = imc_normalizer_values($gameWorldId, $row);
            if ($values['competition_key'] === null) { $unresolved++; continue; }
            $update->execute([$values['competition_group'],$values['competition_key'],$row['id']]);
            $normalized += $update->rowCount() > 0 ? 1 : 0;
        }
    } else {
        $update = $pdo->prepare("UPDATE `{$table}` SET competition_group=?,competition_key=? WHERE game_world_id=? AND sm_fixture_id=?");
        foreach ($rows as $row) {
            $values = imc_normalizer_values($gameWorldId, $row);
            if ($values['competition_key'] === null) { $unresolved++; continue; }
            $update->execute([$values['competition_group'],$values['competition_key'],$gameWorldId,$row['sm_fixture_id']]);
            $normalized += $update->rowCount() > 0 ? 1 : 0;
        }
    }
    return ['ok'=>true,'status'=>'completed','table'=>$table,'scanned'=>count($rows),'normalized'=>$normalized,'unresolved'=>$unresolved];
}

function imc_normalize_repository_mysqli(mysqli $db, string $gameWorldId, string $repository): array {
    $gameWorldId = strtoupper(trim($gameWorldId));
    $repository = strtolower(trim($repository));
    if (!preg_match('/^GW00[1-9]$/', $gameWorldId)) throw new InvalidArgumentException('invalid_game_world');
    if (!in_array($repository, imc_normalizer_repositories(), true)) throw new InvalidArgumentException('repository_not_enabled_for_normalizer');
    $table = $gameWorldId . '_' . $repository;
    $isStats = $repository === 'sm_player_stats';
    $sql = $isStats
        ? "SELECT id,source_competition_key FROM `{$table}` WHERE source_competition_key IS NOT NULL AND TRIM(source_competition_key)<>''"
        : ($repository === 'results'
            ? "SELECT id,sm_action,sm_country,sm_division,source_competition_key FROM `{$table}` WHERE source_competition_key IS NOT NULL AND TRIM(source_competition_key)<>''"
            : "SELECT game_world_id,sm_fixture_id,sm_action,sm_country,sm_division,source_competition_key FROM `{$table}` WHERE source_competition_key IS NOT NULL AND TRIM(source_competition_key)<>''");
    $result = $db->query($sql); $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    $result->free(); $normalized = 0; $unresolved = 0;
    foreach ($rows as $row) {
        $values = imc_normalizer_values($gameWorldId, $row);
        if ($values['competition_key'] === null) { $unresolved++; continue; }
        if ($isStats) {
            $st = $db->prepare("UPDATE `{$table}` SET competition_key=? WHERE id=?");
            $id = (int)$row['id']; $key = $values['competition_key']; $st->bind_param('si',$key,$id);
        } elseif ($repository === 'results') {
            $st = $db->prepare("UPDATE `{$table}` SET competition_group=?,competition_key=? WHERE id=?");
            $id = (int)$row['id']; $group = $values['competition_group']; $key = $values['competition_key']; $st->bind_param('ssi',$group,$key,$id);
        } else {
            $st = $db->prepare("UPDATE `{$table}` SET competition_group=?,competition_key=? WHERE game_world_id=? AND sm_fixture_id=?");
            $group = $values['competition_group']; $key = $values['competition_key']; $fixture = (int)$row['sm_fixture_id']; $st->bind_param('sssi',$group,$key,$gameWorldId,$fixture);
        }
        $st->execute(); if ($st->affected_rows > 0) $normalized++; $st->close();
    }
    return ['ok'=>true,'status'=>'completed','table'=>$table,'scanned'=>count($rows),'normalized'=>$normalized,'unresolved'=>$unresolved];
}

if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    header('Content-Type: application/json; charset=utf-8');
    try {
        require dirname(__DIR__) . '/core.php';
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') throw new RuntimeException('POST required.', 405);
        $token = trim((string)($_SERVER['HTTP_X_IMC_TOKEN'] ?? ''));
        $authorization = trim((string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
        if ($token === '' && preg_match('/^Bearer\s+(.+)$/i', $authorization, $m)) $token = trim($m[1]);
        $expected = (string)(smm_config()['admin_token'] ?? '');
        $connectorKeyFile = __DIR__ . '/connector-key.php';
        $connectorKey = is_file($connectorKeyFile) ? (string)(require $connectorKeyFile) : '';
        if (!(($expected !== '' && hash_equals($expected,$token)) || ($connectorKey !== '' && hash_equals($connectorKey,$token)))) throw new RuntimeException('Unauthorized.',401);
        $payload = json_decode(file_get_contents('php://input') ?: '', true, 32, JSON_THROW_ON_ERROR);
        $gw = strtoupper(trim((string)($payload['game_world_id'] ?? ''))); $repo = strtolower(trim((string)($payload['repository'] ?? '')));
        $target = in_array($gw,['GW002','GW003','GW007','GW008'],true) ? 'gold' : (in_array($gw,['GW001','GW004','GW005','GW006','GW009'],true) ? 'custom' : '');
        if ($target === '') throw new InvalidArgumentException('invalid_game_world');
        $data = imc_normalize_repository_mysqli(smm_storage_db($target),$gw,$repo);
        echo json_encode(['action'=>'normalize_repository']+$data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        $status = $e->getCode(); if (!is_int($status) || $status < 400 || $status > 599) $status = 500; http_response_code($status);
        echo json_encode(['ok'=>false,'error'=>$e->getMessage()],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    }
    exit;
}
