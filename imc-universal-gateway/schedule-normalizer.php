<?php
declare(strict_types=1);
require_once __DIR__ . '/playoff-normalizer.php';

// Derived IDs never replace source IDs or the original import fingerprint.
function imc_schedule_name(mixed $value): string {
    $s = mb_strtolower(trim(preg_replace('/\s+/u', ' ', str_replace("\u{00a0}", ' ', (string)$value))), 'UTF-8');
    return $s;
}
function imc_schedule_id(mixed $value): bool {
    return ctype_digit((string)$value) && (int)$value > 0;
}
function imc_schedule_resolve(array $row, string $side, array $mapping, array $assignments): array {
    $field = $side . '_sm_team_id';
    if (isset($row[$field]) && $row[$field] !== '') return ['id'=>null,'reason'=>'present'];
    $gw = (string)($row['game_world_id'] ?? '');
    $date = (string)($row['match_date'] ?? '');
    $name = imc_schedule_name($row[$side.'_name'] ?? '');
    if (!$name || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date) || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))) return ['id'=>null,'reason'=>'name_or_date_missing'];
    // National assignments use a different ID namespace; leave them untouched.
    if (in_array(strtoupper((string)($row['competition_group'] ?? '')), ['NATIONS','NATIONAL'], true) || in_array(strtolower((string)($row['sm_action'] ?? '')), ['worldcup','interqualifier'], true)) return ['id'=>null,'reason'=>'national_team_not_resolved'];
    $manager = $row[$side.'_sm_manager_id'] ?? null;
    if (!imc_schedule_id($manager)) $manager = $row['logged_manager_id'] ?? null;
    if (!imc_schedule_id($manager)) return ['id'=>null,'reason'=>'manager_missing'];
    $active = [];
    foreach ($assignments as $a) {
        if (($a['game_world_id'] ?? '') !== $gw || (string)($a['sm_manager_id'] ?? '') !== (string)$manager || ($a['assignment_type'] ?? '') !== 'club' || !empty($a['national_team_id'])) continue;
        if (empty($a['start_date']) || $date < $a['start_date'] || (!empty($a['end_date']) && $date > $a['end_date'])) continue;
        // If a new club assignment started, an older open-ended one is stale.
        $superseded = false;
        if (empty($a['end_date'])) foreach ($assignments as $next) {
            if (($next['game_world_id'] ?? '') === $gw && (string)($next['sm_manager_id'] ?? '') === (string)$manager && ($next['assignment_type'] ?? '') === 'club' && !empty($next['start_date']) && $next['start_date'] > $a['start_date'] && $next['start_date'] <= $date) $superseded = true;
        }
        if ($superseded) continue;
        $matches = [];
        foreach ($mapping as $m) {
            if (($m['game_world_id'] ?? '') !== $gw || !imc_schedule_id($m['world_id'] ?? null)) continue;
            $ids = array_map('strval', [$m['world_id'], $m['club_id'], $m['global_id']]);
            if (!imc_schedule_id($a['team_id'] ?? null) || !in_array((string)$a['team_id'], $ids, true)) continue;
            $matches[(string)$m['world_id']] = $m;
        }
        if (count($matches) !== 1) return ['id'=>null,'reason'=>'assignment_mapping_ambiguous'];
        $active += $matches;
    }
    if (count($active) !== 1) return ['id'=>null,'reason'=>'assignment_missing_or_ambiguous'];
    $m = array_values($active)[0];
    if (!in_array($name, array_map('imc_schedule_name', [$m['mapping_name'], $m['canonical_name']]), true)) return ['id'=>null,'reason'=>'team_name_mismatch'];
    // Name itself must not resolve to multiple world clubs.
    foreach ($mapping as $other) if (($other['game_world_id'] ?? '') === $gw && (string)$other['world_id'] !== (string)$m['world_id'] && in_array($name,array_map('imc_schedule_name',[$other['mapping_name'],$other['canonical_name']]),true)) return ['id'=>null,'reason'=>'team_name_ambiguous'];
    $opponent = $row[($side === 'home' ? 'away' : 'home').'_sm_team_id'] ?? null;
    if ((string)$opponent === (string)$m['world_id']) return ['id'=>null,'reason'=>'opponent_id_conflict'];
    return ['id'=>(int)$m['world_id'],'reason'=>null];
}

function imc_schedule_reconcile(PDO $pdo, string $gw): array {
    if (!preg_match('/^GW(?:00[1-9]|010)$/D',$gw)) throw new InvalidArgumentException('invalid_game_world');
    $read=$pdo->prepare("SELECT * FROM `{$gw}_IMC_Schedule` WHERE game_world_id=? AND (home_sm_team_id IS NULL OR away_sm_team_id IS NULL)");
    $read->execute([$gw]); $rows=$read->fetchAll(PDO::FETCH_ASSOC);
    $report=['version'=>'1.0','checked'=>count($rows),'updated_ids'=>0,'site_updated_ids'=>0,'unresolved'=>0,'pending'=>[]];
    if (!$rows) return $report;
    $cfg=require dirname(__DIR__).'/__imc_private_gateway/config.php';
    $core=new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$cfg['db']['host'],$cfg['db']['port'],$cfg['db']['core']),$cfg['db']['user'],$cfg['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    $q=$core->prepare('SELECT m.`Game World` game_world_id,m.`Club ID` club_id,m.`SM Club ID` global_id,m.`SM World Club ID` world_id,m.`Club Name` mapping_name,c.name canonical_name FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?');
    $q->execute([$gw]); $mapping=$q->fetchAll();
    $q=$core->prepare('SELECT a.game_world_id,a.team_id,a.assignment_type,a.national_team_id,a.start_date,a.end_date,m.sm_manager_id FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=?');
    $q->execute([$gw]); $assignments=$q->fetchAll();
    $q=$pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='IMC_Site_Schedule'");
    $site=(bool)$q->fetchColumn();
    foreach ($rows as $row) foreach (['home','away'] as $side) {
        $value=imc_schedule_resolve($row,$side,$mapping,$assignments);
        if ($value['reason']==='present') continue;
        if ($value['id']===null) {
            $report['unresolved']++;
            if (count($report['pending'])<25) $report['pending'][]=['sm_fixture_id'=>$row['sm_fixture_id'],'side'=>$side,'reason'=>$value['reason']];
            continue;
        }
        $field=$side.'_sm_team_id'; $name=$side.'_name';
        $q=$pdo->prepare("UPDATE `{$gw}_IMC_Schedule` SET `{$field}`=? WHERE game_world_id=? AND sm_fixture_id=? AND `{$field}` IS NULL AND `{$name}` <=> ? AND match_date <=> ? AND logged_manager_id <=> ?");
        $args=[$value['id'],$gw,$row['sm_fixture_id'],$row[$name],$row['match_date'],$row['logged_manager_id']];
        $q->execute($args); $changed=$q->rowCount(); $report['updated_ids']+=$changed;
        if ($changed && $site) {
            $q=$pdo->prepare("UPDATE `IMC_Site_Schedule` SET `{$field}`=? WHERE game_world_id=? AND sm_fixture_id=? AND `{$field}` IS NULL AND `{$name}` <=> ? AND match_date <=> ? AND logged_manager_id <=> ?");
            $q->execute($args); $report['site_updated_ids']+=$q->rowCount();
        }
        $row[$field]=$value['id'];
    }
    return $report;
}

/** Runs after persistence and before commit, on both import routes. */
function imc_schedule_import(PDO $pdo,string $table,bool $atomic,callable $write): array {
    if (!preg_match('/^GW(?:00[1-9]|010)_IMC_Schedule$/D',$table)) return imc_playoff_import($pdo,$table,$atomic,$write);
    $gw=substr($table,0,5);$lock='imc_schedule_'.$gw;
    $q=$pdo->prepare('SELECT GET_LOCK(?,15)');$q->execute([$lock]);
    if ((int)$q->fetchColumn()!==1) throw new RuntimeException('schedule_normalization_busy_retry');
    try {
        // Schedule import and its derived IDs are one atomic operation.
        $pdo->beginTransaction();$written=$write();
        $normalization=imc_schedule_reconcile($pdo,$gw);$pdo->commit();
        error_log('IMC_SCHEDULE_NORMALIZATION '.json_encode(['game_world_id'=>$gw]+$normalization));
        return ['written'=>$written,'normalization'=>$normalization];
    } catch (Throwable $e) {if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    finally {$q=$pdo->prepare('SELECT RELEASE_LOCK(?)');$q->execute([$lock]);}
}
