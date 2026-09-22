<?php
declare(strict_types=1);

/* Application normalization. CORE is the only season authority.
 * Fingerprints remain the original import fingerprints, not a hash of derived fields.
 */
function imc_playoff_target(string $table): bool {
    return preg_match('/^GW(?:00[1-9]|010)_IMC (Results|Match Report)$/D', $table) === 1;
}

function imc_playoff_marker(array $row): bool {
    if (strtolower(trim((string)($row['sm_action'] ?? ''))) === 'playoff') return true;
    if (preg_match('/(?:^|\|)playoff(?:\||$)/i', (string)($row['competition_key'] ?? ''))) return true;
    return preg_match('/\bplay[\s-]*offs?\b/i', ($row['competition_stage'] ?? '') . ' ' . ($row['competition_round'] ?? '')) === 1;
}

function imc_playoff_season(string $gw, ?string $date, array $seasons): ?string {
    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) return null;
    $matches = [];
    foreach ($seasons as $s) {
        if (($s['game_world_id'] ?? '') !== $gw) continue;
        $start = $s['imc_season_start_date'] ?? null;
        $end = $s['imc_season_end_date'] ?? null;
        if (!$start || $date < $start || ($end && $date > $end)) continue;
        // An open season stops at the next CORE start, never at a local copy.
        if (!$end) {
            foreach ($seasons as $next) {
                $nextStart = $next['imc_season_start_date'] ?? null;
                if (($next['game_world_id'] ?? '') === $gw && $nextStart && $nextStart > $start && $date >= $nextStart) continue 2;
            }
        }
        $matches[] = (string)$s['imc_season'];
    }
    return count($matches) === 1 ? $matches[0] : null;
}

function imc_playoff_country(array $row, bool $multi): ?string {
    if (!$multi) return '';
    $country = strtoupper(trim((string)($row['sm_country'] ?? '')));
    return preg_match('/^[A-Z]{3}$/D', $country) && !in_array($country, ['CUS','WOR'], true) ? $country : null;
}

function imc_playoff_index(string $gw, bool $multi, array $results, array $seasons): array {
    $index = [];
    foreach ($results as $row) {
        if (($row['game_world_id'] ?? '') !== $gw || strtolower(trim((string)($row['sm_action'] ?? ''))) !== 'league' || imc_playoff_marker($row)) continue;
        $season = imc_playoff_season($gw, $row['match_date'] ?? null, $seasons);
        $country = imc_playoff_country($row, $multi);
        $division = trim((string)($row['sm_division'] ?? ''));
        if ($season === null || $country === null || !preg_match('/^[1-9][0-9]*$/D', $division)) continue;
        foreach (['home_sm_club_id','away_sm_club_id'] as $side) {
            $id = (string)($row[$side] ?? '');
            if (!ctype_digit($id) || (int)$id <= 0) continue;
            $index[$season][$country][$id][$division] = true;
        }
    }
    return $index;
}

function imc_playoff_values(string $gw, bool $multi, array $row, array $seasons, array $index): array {
    $season = imc_playoff_season($gw, $row['match_date'] ?? null, $seasons);
    $country = imc_playoff_country($row, $multi);
    $division = null;
    $reason = $season === null ? 'season_missing_or_ambiguous' : ($country === null ? 'country_missing_or_invalid' : null);
    if ($reason === null) {
        $home = array_keys($index[$season][$country][(string)($row['home_sm_club_id'] ?? '')] ?? []);
        $away = array_keys($index[$season][$country][(string)($row['away_sm_club_id'] ?? '')] ?? []);
        if (count($home) === 1 && count($away) === 1 && (string)$home[0] === (string)$away[0]) $division = (string)$home[0];
        else $reason = 'league_division_missing_or_conflicting';
    }
    $parts = [$gw];
    if ($multi && $country !== null) $parts[] = $country;
    return ['sm_action'=>'playoff','competition_group'=>'DOMESTIC',
        'sm_country'=>$multi ? ($country ?? ($row['sm_country'] ?? null)) : null,
        'sm_division'=>$division,
        'competition_key'=>$division === null ? null : implode('|', array_merge($parts, ['DOMESTIC','playoff',$division])),
        'reason'=>$reason];
}

function imc_playoff_reconcile(PDO $pdo, string $gw): array {
    if (!preg_match('/^GW(?:00[1-9]|010)$/D', $gw)) throw new InvalidArgumentException('invalid_game_world');
    $cfgFile = dirname(__DIR__) . '/__imc_private_gateway/config.php';
    $cfg = require $cfgFile;
    // A separate connection reads the authoritative table directly in CORE.
    $core = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['db']['host'], $cfg['db']['port'], $cfg['db']['core']), $cfg['db']['user'], $cfg['db']['pass'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
    $stmt = $core->prepare('SELECT game_world_id,imc_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=?');
    $stmt->execute([$gw]);
    $seasons = $stmt->fetchAll();
    $multi = in_array($gw, ['GW002','GW003','GW007','GW008'], true);
    $fields = 'game_world_id,sm_fixture_id,sm_action,sm_country,sm_division,competition_group,competition_key,competition_stage,competition_round,match_date,home_sm_club_id,away_sm_club_id';
    $read = $pdo->prepare("SELECT {$fields} FROM `{$gw}_IMC_Results` WHERE game_world_id=?");
    $read->execute([$gw]);
    $results = $read->fetchAll(PDO::FETCH_ASSOC);
    $index = imc_playoff_index($gw, $multi, $results, $seasons);
    $report = ['version'=>'1.0','season_source'=>'CORE.IMC Game World Season','checked'=>0,'updated'=>0,'unresolved'=>0,'pending'=>[]];
    foreach (['Results','Match Report'] as $repository) {
        // Only explicit playoff evidence qualifies a row. Never infer a playoff from a fixture ID alone.
        $rows = $results;
        if ($repository !== 'Results') {
            $exists = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?');
            $exists->execute([$gw . '_IMC_Match_Report']);
            if (!(int)$exists->fetchColumn()) continue;
            $read = $pdo->prepare("SELECT {$fields} FROM `{$gw}_IMC_Match_Report` WHERE game_world_id=? AND (LOWER(TRIM(sm_action))='playoff' OR LOWER(competition_key) LIKE '%|playoff|%' OR LOWER(competition_stage) REGEXP 'play[ -]*off' OR LOWER(competition_round) REGEXP 'play[ -]*off')");
            $read->execute([$gw]);
            $rows = $read->fetchAll(PDO::FETCH_ASSOC);
        }
        $update = $pdo->prepare("UPDATE `{$gw}_IMC_{$repository}` SET sm_action=?,competition_group=?,sm_country=?,sm_division=?,competition_key=? WHERE game_world_id=? AND sm_fixture_id=? AND match_date <=> ? AND home_sm_club_id <=> ? AND away_sm_club_id <=> ? AND sm_action <=> ? AND competition_group <=> ? AND sm_country <=> ? AND sm_division <=> ? AND competition_key <=> ?");
        foreach ($rows as $row) {
            if (!imc_playoff_marker($row)) continue;
            $report['checked']++;
            $values = imc_playoff_values($gw, $multi, $row, $seasons, $index);
            if ($values['reason'] !== null) {
                $report['unresolved']++;
                if (count($report['pending']) < 25) $report['pending'][] = ['repository'=>$repository,'sm_fixture_id'=>$row['sm_fixture_id'],'reason'=>$values['reason']];
            }
            $keys = ['sm_action','competition_group','sm_country','sm_division','competition_key'];
            $new = []; $old = [];
            foreach ($keys as $key) { $new[] = $values[$key]; $old[] = $row[$key]; }
            if ($new === $old) continue;
            $update->execute(array_merge($new, [$gw,$row['sm_fixture_id'],$row['match_date'],$row['home_sm_club_id'],$row['away_sm_club_id']], $old));
            $report['updated'] += $update->rowCount();
        }
    }
    return $report;
}

/** Serialize importer writes per GW; normalize before the existing atomic commit. */
function imc_playoff_import(PDO $pdo, string $table, bool $atomic, callable $write): array {
    $enabled = imc_playoff_target($table);
    $lock = 'imc_playoff_' . substr($table, 0, 5);
    if ($enabled) {
        $stmt = $pdo->prepare('SELECT GET_LOCK(?,15)'); $stmt->execute([$lock]);
        if ((int)$stmt->fetchColumn() !== 1) throw new RuntimeException('normalization_busy_retry');
    }
    try {
        if ($atomic) $pdo->beginTransaction();
        $written = $write();
        $normalization = $enabled ? imc_playoff_reconcile($pdo, substr($table, 0, 5)) : null;
        if ($atomic) $pdo->commit();
        if ($normalization !== null) error_log('IMC_PLAYOFF_NORMALIZATION ' . json_encode(['game_world_id'=>substr($table,0,5)] + $normalization));
        return ['written'=>$written,'normalization'=>$normalization];
    } catch (Throwable $e) {
        if ($atomic && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    } finally {
        if ($enabled) { $stmt = $pdo->prepare('SELECT RELEASE_LOCK(?)'); $stmt->execute([$lock]); }
    }
}
