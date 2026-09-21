<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
$imcAllowedOrigins = ['https://it.soccermanager.com','https://www.italianmastersclub.it','https://italianmastersclub.it'];
$imcOrigin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if (in_array($imcOrigin, $imcAllowedOrigins, true)) {
    header('Access-Control-Allow-Origin: '.$imcOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Universal-Token, X-IMC-Channel');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$imcRawInput = (string)file_get_contents('php://input');
$imcPreflight = json_decode($imcRawInput, true);
if (is_array($imcPreflight)) {
    $imcAction = strtolower(trim((string)($imcPreflight['action'] ?? '')));
    $imcChannel = strtoupper(trim((string)($imcPreflight['channel'] ?? ($_SERVER['HTTP_X_IMC_CHANNEL'] ?? ''))));

    if ($imcAction === 'normalize_transfers' && $imcChannel === 'CHATGPT') {
        require __DIR__.'/transfer-normalizer.php';
        imc_transfer_normalizer_run($imcPreflight);
    }

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

    if ($imcAction === 'nexus_trophy_room' && $imcChannel === 'NEXUS') {
        $imcConfigFile = dirname(__DIR__).'/__imc_private_gateway/config.php';
        if (is_file($imcConfigFile)) {
            $imcConfig = require $imcConfigFile;
            if (is_array($imcConfig) && isset($imcConfig['token'])) {
                $_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN'] = (string)$imcConfig['token'];
            }
        }
        $imcGw = strtoupper(trim((string)($imcPreflight['game_world_id'] ?? '')));
        if (!preg_match('/^GW(?:00[1-9]|01[0-5])$/', $imcGw)) {
            http_response_code(422);
            echo json_encode(['ok'=>false,'error'=>'invalid_game_world']);
            exit;
        }
        $imcPreflight = [
            'action' => 'read',
            'channel' => 'CHATGPT',
            'source' => 'core',
            'repository' => 'IMC Trophy Room',
            'where' => ['game_world_id' => $imcGw],
            'limit' => 1000
        ];
        $GLOBALS['IMC_NEXUS_PREFLIGHT'] = $imcPreflight;
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

if (isset($GLOBALS['IMC_NEXUS_PREFLIGHT'])) {
    $imcRawInput = json_encode($GLOBALS['IMC_NEXUS_PREFLIGHT'], JSON_UNESCAPED_SLASHES);
}
require __DIR__.'/core.php';
require __DIR__.'/read.php';
require __DIR__.'/write.php';
require __DIR__.'/ddl.php';
imc_run();
