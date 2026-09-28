<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/sync.php';
try {
    $c=nexus_config();$gw=nexus_world($_GET['world']??null);
    $db=nexus_db($c,nexus_target($c,$gw));
    // No scores or winners are accepted from the caller: only authoritative database rows.
    $result=trophy_sync($c,$db,$gw,($_GET['preview']??'')==='1');
    nexus_out(['ok'=>true,'world'=>$gw]+$result);
} catch (InvalidArgumentException $e) {
    nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);
} catch (Throwable $e) {
    error_log('IMC trophy sync: '.$e->getMessage());
    nexus_out(['ok'=>false,'error'=>'trophy_sync_error'],500);
}
