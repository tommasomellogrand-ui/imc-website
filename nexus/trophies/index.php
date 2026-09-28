<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/sync.php';
try {
    $c = nexus_config();
    $gw = isset($_GET['world']) && $_GET['world'] !== ''
        ? nexus_world($_GET['world']) : null;
    $season = nexus_season($_GET['season'] ?? null);
    // Keep the unfiltered endpoint available, using only the individual GW tables.
    $worlds = $gw !== null ? [$gw] : array_map(
        static fn(int $n): string => sprintf('GW%03d', $n), range(1, 10)
    );
    $connections = [];
    $rows = [];
    foreach ($worlds as $world) {
        $target = nexus_target($c, $world);
        $connections[$target] ??= nexus_db($c, $target);
        trophy_sync($c, $connections[$target], $world);
        // World identifiers are validated above or generated from the supported range.
        $table = $world.'_IMC_Trophy_Room';
        $sql = 'SELECT * FROM `'.$table.'` WHERE game_world_id=?';
        $params = [$world];
        if ($season !== null) {
            $sql .= ' AND imc_season=?';
            $params[] = $season;
        }
        $sql .= ' ORDER BY game_world_id,imc_season,id';
        foreach (nexus_rows($connections[$target], $sql, $params) as $row) {
            $rows[] = $row;
        }
    }
    nexus_out(['ok'=>true, 'rows'=>$rows]);
} catch (InvalidArgumentException $e) {
    nexus_out(['ok'=>false, 'error'=>$e->getMessage()], 422);
} catch (Throwable $e) {
    nexus_out(['ok'=>false, 'error'=>'trophies_error'], 500);
}

