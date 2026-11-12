<?php
declare(strict_types=1);

function imc_changed_scope(string $table): string {
    if (preg_match('/^IMC-?(00[1-9]|010)_/i', $table, $m)) return 'IMC'.$m[1];
    if (preg_match('/^(GW[0-9]{3})[_ ]/i', $table, $m)) {
        $routes = ['GW001'=>'IMC001','GW005'=>'IMC002','GW009'=>'IMC003','GW010'=>'IMC004',
                   'GW011'=>'IMC005','GW004'=>'IMC006','GW006'=>'IMC007'];
        return $routes[strtoupper($m[1])] ?? 'core';
    }
    return 'core';
}

// Schedule delivery after the write has committed. Failure to reach the bridge
// cannot roll back or change the result of a successful MySQL import.
function imc_changed_table(string $table): void {
    if (PHP_SAPI === 'cli' || stripos($table, 'IMC ONE ') === 0) return;
    static $queued = [];
    $scope = imc_changed_scope($table);
    if (isset($queued[$scope])) return;
    $queued[$scope] = true;
    $dir = dirname(__DIR__, 2).'/__imc_private_gateway';
    $file = $dir.'/site-change-'.$scope.'.pending';
    // Atomic rename gives a racing writer its own generation.
    $tmp = tempnam($dir, 'site-signal-');
    if ($tmp !== false && file_put_contents($tmp, bin2hex(random_bytes(12))) !== false) {
        if (!rename($tmp, $file)) @unlink($tmp);
    }
    imc_retry_site_changes();
}

function imc_retry_site_changes(): void {
    static $scheduled = false;
    if ($scheduled || PHP_SAPI === 'cli') return;
    $dir = dirname(__DIR__, 2).'/__imc_private_gateway';
    if (!glob($dir.'/site-change-*.pending*')) return;
    $scheduled = true;
    register_shutdown_function(static function() use ($dir) {
        if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
        $lock = @fopen($dir.'/site-change.lock', 'c');
        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) return;
        try {
            $secret = require dirname(__DIR__, 2).'/__imc-sm-master/admin/database-manager/connector-key.php';
            foreach (glob($dir.'/site-change-*.pending.sending') ?: [] as $orphan) {
                $pending = substr($orphan, 0, -strlen('.sending'));
                if (is_file($pending)) @unlink($orphan);
                else @rename($orphan, $pending);
            }
            foreach (glob($dir.'/site-change-*.pending') ?: [] as $file) {
                if (!preg_match('/site-change-(core|IMC00[1-9]|IMC010)\.pending$/D',$file,$m)) continue;
                $scope = $m[1];
                // Claim one generation. A newer write can create a fresh pending file.
                $active = $file.'.sending';
                if (!rename($file, $active)) continue;
                $sent = false;
                try {
                    $now = time();
                    $body = json_encode(['scope_name'=>$scope, 'signed_at'=>$now, 'signature'=>
                        hash_hmac('sha256', 'site-change-v1|'.$scope.'|'.$now, $secret)], JSON_THROW_ON_ERROR);
                    $request = curl_init('https://toanuzojdkfjgucztpze.supabase.co/rest/v1/rpc/imc_publish_site_change');
                    curl_setopt_array($request, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>$body,
                        CURLOPT_HTTPHEADER=>['Content-Type: application/json','apikey: sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l'],
                        CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT_MS=>2500, CURLOPT_CONNECTTIMEOUT_MS=>1000]);
                    curl_exec($request);
                    $status = curl_getinfo($request,CURLINFO_RESPONSE_CODE);
                    $sent = $status>=200 && $status<300;
                    curl_close($request);
                } finally {
                    if ($sent || is_file($file)) @unlink($active);
                    else @rename($active,$file);
                }
            }
        } catch (Throwable $e) {
            error_log('IMC site change delivery pending');
        } finally {
            flock($lock, LOCK_UN); fclose($lock);
        }
    });
}
