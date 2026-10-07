<?php
declare(strict_types=1);
// Public, read-only directory. No credentials or private assignment fields returned.
require dirname(__DIR__, 2).'/nexus/core/bootstrap.php';
try {
    $db = nexus_db(nexus_config(), 'core');
    $today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    $db->beginTransaction();
    $worlds = nexus_rows($db, 'SELECT `IMC GW` game_world_id, `IMC GW Name` name, `SM Game World ID` sm_game_world_id FROM `IMC Game World Codex Global` ORDER BY `IMC GW`');
    $assignments = nexus_rows($db, 'SELECT DISTINCT a.game_world_id, m.manager_id, m.full_name FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id JOIN `IMC Game World Codex Global` w ON w.`IMC GW`=a.game_world_id WHERE a.start_date<=? AND (a.end_date IS NULL OR a.end_date>=?) ORDER BY m.full_name, a.game_world_id', [$today, $today]);
    $db->commit();
    $managers = []; $counts = [];
    foreach ($assignments as $a) {
        $id = $a['manager_id']; $gw = $a['game_world_id'];
        if (!isset($managers[$id])) $managers[$id] = ['manager_id'=>$id, 'full_name'=>$a['full_name'], 'worlds'=>[]];
        $managers[$id]['worlds'][] = $gw;
        $counts[$gw] = ($counts[$gw] ?? 0) + 1;
    }
    foreach ($worlds as &$world) {
        $world['manager_count'] = $counts[$world['game_world_id']] ?? 0;
        $world['href'] = '/nexus/?world='.rawurlencode($world['game_world_id']);
    }
    unset($world);
    nexus_out(['ok'=>true, 'worlds'=>$worlds, 'managers'=>array_values($managers), 'as_of'=>$today, 'updated_at'=>gmdate('c')]);
} catch (Throwable $e) {
    error_log('IMC homepage directory: '.$e->getMessage());
    nexus_out(['ok'=>false, 'error'=>'Community temporaneamente non disponibile.'], 503);
}
