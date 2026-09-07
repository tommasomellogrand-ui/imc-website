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
    $imcRepository = trim((string)($imcPreflight['repository'] ?? ''));
    $imcAction = strtolower(trim((string)($imcPreflight['action'] ?? '')));
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
