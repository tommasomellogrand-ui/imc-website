<?php
declare(strict_types=1);

function ingestion_route(mysqli $db, array $body, string $type, string $action): never {
    ingestion_fail('legacy_core_removed: ingestion rebuild required after IMC-DB-001-04', 503);
    if ($type === 'results') {
        require_once __DIR__ . '/handlers/results.php';
        results_handle($db, $body, $action);
    }
    if ($type === 'schedule') {
        require_once __DIR__ . '/handlers/schedule.php';
        schedule_handle($db, $body, $action);
    }
    if ($type === 'match_report') {
        require_once __DIR__ . '/handlers/match-report.php';
        match_report_handle($db, $body, $action);
    }
    if ($type === 'manager_scan') {
        require_once __DIR__ . '/handlers/manager-scan.php';
        manager_scan_handle($db, $body, $action);
    }
    ingestion_fail('Unknown or disabled ingestion type.', 404);
}
