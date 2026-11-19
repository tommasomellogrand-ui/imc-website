<?php
declare(strict_types=1);

function ch_career_name(?string $name): string {
    $name = trim((string)$name);
    return mb_strtolower(preg_replace('/\s+/u', ' ', $name) ?? $name, 'UTF-8');
}

function ch_career_results(array $rows, string $gw, array $managers, ?string $selected, string $scope, array $assignments, array $clubs, array $nations): array {
    $out = ch_init($managers);
    $out['coverage'] = ['source'=>'Results', 'manager_source'=>'Assignments', 'results'=>0, 'fixtures'=>0, 'duplicate_rows'=>0, 'excluded_fixtures'=>0, 'ambiguous_sides'=>0];
    $world = imc_world_id($gw);
    $names = array_column($managers, 'full_name', 'manager_id');
    $aliases = ch_nation_aliases($nations);
    $nationEntities = array_column($nations, 'world_id', 'entity_id');
    $teamNames = [];
    $remember = static function(string $kind, ?string $name, int $team) use (&$teamNames): void {
        $key = ch_career_name($name);
        if ($team > 0 && $key !== '') $teamNames[$kind][$key][$team] = true;
    };
    foreach ($clubs as $club) {
        foreach (['name','nexus_view'] as $field) $remember('club', $club[$field] ?? null, (int)$club['world_id']);
    }
    foreach ($nations as $nation) $remember('national_team', $nation['name'] ?? null, (int)$nation['world_id']);

    $tenures = [];
    foreach ($assignments as $assignment) {
        if (imc_world_id((string)$assignment['game_world_id']) !== $world) continue;
        $kind = $assignment['assignment_type'];
        $national = $assignment['national_team_id'] ?? null;
        $team = $kind === 'club' ? (int)$assignment['team_id'] : (int)($nationEntities[$national ?? ''] ?? ch_nation_team($national, $aliases));
        $start = ch_assignment_day($assignment['start_date'] ?? null);
        $rawEnd = trim((string)($assignment['end_date'] ?? ''));
        $end = ch_assignment_day($rawEnd);
        if ($team < 1 || !$start || ($rawEnd !== '' && (!$end || $end < $start))) continue;
        $remember($kind, $assignment['team_name'] ?? null, $team);
        $tenures[$kind][$team][] = ['id'=>$assignment['id'], 'manager'=>$assignment['manager_id'], 'start'=>$start, 'end'=>$end];
    }

    $byFixture = [];
    foreach ($rows as $row) {
        if (imc_world_id((string)$row['game_world_id']) !== $world) continue;
        $kind = ch_nation($row) ? 'national_team' : 'club';
        foreach (['home','away'] as $side) {
            $id = (int)($row[$side.'_sm_club_id'] ?? 0);
            $team = $kind === 'club' ? $id : (int)ch_nation_team($id, $aliases);
            $remember($kind, $row[$side.'_name'] ?? null, $team);
            $row['_'.$side.'_team'] = $team;
            unset($row[$side.'_sm_manager_id']); // Assignments are the authority for both sides.
        }
        if ($scope !== 'global' && $scope !== $kind) continue;
        if (!(int)($row['sm_fixture_id'] ?? 0) && str_starts_with((string)($row['competition_key'] ?? ''), $world.'_')) {
            $legacy = $row;
            $legacy['game_world_id'] = imc_world_route($world);
            $legacy['competition_key'] = $legacy['game_world_id'].substr($row['competition_key'], strlen($world));
            $row['sm_fixture_id'] = ch_result_identity($legacy)['sm_fixture_id'] ?? null;
        } else {
            $row = ch_result_identity($row);
        }
        $row['_kind'] = $kind;
        $byFixture[(string)($row['sm_fixture_id'] ?? '')][] = $row;
    }

    foreach ($byFixture as $fixture => $items) {
        $out['coverage']['results'] += count($items);
        $out['coverage']['fixtures']++;
        $out['coverage']['duplicate_rows'] += count($items)-1;
        $signatures = [];
        foreach ($items as &$item) {
            foreach (['home','away'] as $side) {
                $key = ch_career_name($item[$side.'_name'] ?? null);
                $ids = $teamNames[$item['_kind']][$key] ?? [];
                if (!(int)($item[$side.'_sm_club_id'] ?? 0) && count($ids) === 1) $item['_'.$side.'_team'] = (int)array_key_first($ids);
                $item[$side.'_sm_club_id'] = $item['_'.$side.'_team'];
            }
            $signatures[ch_signature($item)] = true;
        }
        unset($item);
        $row = $items[0];
        $kind = $row['_kind'];
        $day = ch_assignment_day($row['match_date'] ?? null);
        $home = $row['home_score'] ?? null;
        $away = $row['away_score'] ?? null;
        if (count($signatures) !== 1 || (int)$fixture === 0 || !$day || !is_numeric($home) || !is_numeric($away) || $home < 0 || $away < 0) {
            $out['coverage']['excluded_fixtures']++;
            continue;
        }

        $resolved = [];
        foreach (['home','away'] as $side) {
            $active = [];
            foreach ($tenures[$kind][$row['_'.$side.'_team']] ?? [] as $tenure) {
                if ($tenure['start'] > $day || ($tenure['end'] !== null && $tenure['end'] < $day)) continue;
                $id = $tenure['manager'];
                if (!isset($active[$id]) || [$tenure['start'], $tenure['id']] > [$active[$id]['start'], $active[$id]['id']]) $active[$id] = $tenure;
            }
            if (count($active) > 1) {
                $out['coverage']['ambiguous_sides']++;
                foreach ($active as $id => $tenure) if (isset($out['managers'][$id])) {
                    $out['managers'][$id]['excluded']++;
                    if ($id === $selected) $out['issues'][] = ['world'=>$gw, 'fixture_id'=>(string)$fixture, 'date'=>$day, 'reason'=>'Assegnazioni a manager diversi sovrapposte alla data della partita'];
                }
            }
            $resolved[$side] = count($active) === 1 ? reset($active) : null;
        }
        if ($resolved['home'] && $resolved['home']['manager'] === ($resolved['away']['manager'] ?? null)) {
            $out['coverage']['excluded_fixtures']++;
            if ($selected === $resolved['home']['manager']) $out['issues'][] = ['world'=>$gw, 'fixture_id'=>(string)$fixture, 'date'=>$day, 'reason'=>'Lo stesso manager risulta assegnato a entrambe le squadre'];
            continue;
        }
        foreach (['home'=>'away','away'=>'home'] as $side => $other) {
            $tenure = $resolved[$side];
            $id = $tenure['manager'] ?? null;
            if ($id === null || !isset($out['managers'][$id])) continue;
            $opponent = $resolved[$other]['manager'] ?? null;
            $gf = (int)$row[$side.'_score'];
            $ga = (int)$row[$other.'_score'];
            $pf = is_numeric($row['penalty_'.$side.'_score'] ?? null) ? (int)$row['penalty_'.$side.'_score'] : null;
            $pa = is_numeric($row['penalty_'.$other.'_score'] ?? null) ? (int)$row['penalty_'.$other.'_score'] : null;
            $stats = &$out['managers'][$id]['stats'];
            ch_add($stats, $gf, $ga, $pf, $pa);
            $stats['matched_by_assignment'] = ($stats['matched_by_assignment'] ?? 0)+1;
            unset($stats);
            if ($id !== $selected) continue;
            $out['matches'][] = [
                'world'=>$gw, 'fixture_id'=>(string)$fixture, 'date'=>$day, 'season'=>$row['imc_season'] ?? null,
                'competition'=>$row['competition_key'] ?? null, 'scope'=>$kind, 'source'=>'Results',
                'assignment_id'=>$tenure['id'], 'team_id'=>$row['_'.$side.'_team'], 'team'=>$row[$side.'_name'] ?? '',
                'opponent_team'=>$row[$other.'_name'] ?? '', 'opponent_id'=>$opponent, 'opponent_name'=>$opponent!==null?($names[$opponent] ?? null):null,
                'gf'=>$gf, 'ga'=>$ga, 'outcome'=>$gf>$ga?'V':($gf<$ga?'S':'P'), 'penalty_for'=>$pf, 'penalty_against'=>$pa,
                'identity_source'=>'assignment_dates', 'opponent_identity_source'=>$opponent!==null?'assignment_dates':null
            ];
        }
    }
    return $out;
}
