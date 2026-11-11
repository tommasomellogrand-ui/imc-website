<?php
declare(strict_types=1);

function subbuteo_youth_results(PDO $db, array $rows): array {
    $ids = [];
    foreach ($rows as $row) {
        if (preg_match('/^(GW011|IMC005)\|IMC\|(risingstarsleague|nextgenleague)\|(premier|challenger)$/i', $row['competition_key'] ?? '')) {
            $ids[] = (int)$row['sm_fixture_id'];
        }
    }
    if (!$ids) return $rows;
    $reports = [];
    foreach (array_chunk(array_unique($ids), 250) as $batch) {
        $params = implode(',',array_fill(0,count($batch),'?'));
        $sql = "SELECT r.sm_fixture_id,r.youth_audit,EXISTS(SELECT 1 FROM IMC005_Match_Reports m WHERE m.sm_fixture_id=r.sm_fixture_id) has_report FROM IMC005_Results r WHERE r.sm_fixture_id IN ($params)";
        foreach (imc_site_rows($db,$sql,$batch) as $report) $reports[$report['sm_fixture_id']] = $report;
    }
    foreach ($rows as &$row) {
        $report = $reports[$row['sm_fixture_id']] ?? null;
        if (!$report) continue;
        $audit = json_decode($report['youth_audit'] ?? '',true);
        if (!(int)$report['has_report']) {
            $row['youth_lines'] = ['Match Automatico 0/0 per NULL-NULL'];
            continue;
        }
        if (!$audit) {
            $row['youth_lines'] = ['Verifica formazioni in attesa'];
            continue;
        }
        $teams = [];
        foreach (['home','away'] as $side) {
            $team = $audit[$side];
            $value = $team['status'];
            if ($value === 'Regolare') $value = '0';
            if ($value === 'Irregolare' && !empty($team['players'])) {
                $value = (string)count(explode(', ', $team['players']));
            }
            $row['player_check'][$side] = is_numeric($value) ? $value.' fuori elenco' : $value;
            $teams[] = $row[$side.'_name'].' '.$value;
        }
        $lines = ['Fuori elenco · '.implode(' / ', $teams)];
        if ($audit['note']) $lines[] = $audit['note'];
        if (in_array('Irregolare',[$audit['home']['status'],$audit['away']['status']],true)
            && !in_array('Da verificare',[$audit['home']['status'],$audit['away']['status']],true)) {
            $lines[] = 'Risultato a tavolino';
        }
        $row['youth_lines'] = $lines;
    }
    return $rows;
}
