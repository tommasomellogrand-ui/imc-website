<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$privateConfig = dirname(__DIR__) . '/__imc_private_gateway/config.php';
$connected = is_file($privateConfig);

http_response_code($connected ? 200 : 503);

echo json_encode([
    'ok' => $connected,
    'service' => 'IMC Universal Gateway',
    'status' => $connected ? 'connected' : 'not_connected'
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
