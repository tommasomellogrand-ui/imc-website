<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: https://it.soccermanager.com');
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Universal-Token, X-IMC-Channel');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$imcRawInput = (string)file_get_contents('php://input');
$imcPreflight = json_decode($imcRawInput, true);
if (is_array($imcPreflight)) {
    $imcAction = strtolower(trim((string)($imcPreflight['action'] ?? '')));
    $imcChannel = strtoupper(trim((string)($imcPreflight['channel'] ?? ($_SERVER['HTTP_X_IMC_CHANNEL'] ?? ''))));

    /* IMC-ENG-008: ordinary explicit importer traffic enters the business-agnostic path.
       Legacy MINISITE / CHATGPT and non-explicit callers remain temporarily available
       until their separate migrations are completed. */
    $imcRouteMode = strtolower(trim((string)($imcPreflight['route_mode'] ?? '')));
    if ($imcChannel === 'IMPORT' && $imcRouteMode === 'explicit' && in_array($imcAction, ['read', 'insert_many'], true)) {
        require __DIR__.'/ingress.php';
        imc_ingress_run($imcPreflight);
    }

    if ($imcAction === 'minisite_read') {
        if ($imcChannel === 'MINISITE') {
            $imcConfigFile = dirname(__DIR__).'/__imc_private_gateway/config.php';
            if (is_file($imcConfigFile)) {
                $imcConfig = require $imcConfigFile;
                if (is_array($imcConfig) && isset($imcConfig['token'])) {
                    $_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] = (string)$imcConfig['token'];
                }
            }
        }
        require __DIR__.'/minisite.php';
        if ($imcChannel === 'MINISITE') {
            foreach (['sql','table','repository','target_database','target_table','route_mode'] as $imcForbiddenField) {
                if (array_key_exists($imcForbiddenField, $imcPreflight)) {
                    imc_minisite_out(['ok' => false, 'error' => 'forbidden_parameter'], 422);
                }
            }
        }
        try {
            $imcMinisiteResource = strtolower(trim((string)($imcPreflight['resource'] ?? '')));
            if (in_array($imcMinisiteResource, ['results','schedule','match_report','transfers','sm_player_stats'], true)) {
                require __DIR__.'/minisite-site.php';
                imc_minisite_site_read($imcPreflight);
            }
            imc_minisite_read($imcPreflight);
        } catch (InvalidArgumentException $e) {
            imc_minisite_out(['ok' => false, 'error' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            imc_minisite_out(['ok' => false, 'error' => 'gateway_error', 'message' => $e->getMessage()], 500);
        }
    }

    $imcRepository = trim((string)($imcPreflight['repository'] ?? ''));
    if ($imcRepository === 'transfers' && in_array($imcAction, ['read', 'insert_many'], true)) {
        $imcConfigFile = dirname(__DIR__).'/__imc_private_gateway/config.php';
        if (is_file($imcConfigFile)) {
            $imcConfig = require $imcConfigFile;
            if (is_array($imcConfig) && isset($imcConfig['token'])) {
                $_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] = (string)$imcConfig['token'];
            }
        }
    }
}

require __DIR__.'/core.php';
require __DIR__.'/read.php';
require __DIR__.'/write.php';
require __DIR__.'/ddl.php';
imc_run();
