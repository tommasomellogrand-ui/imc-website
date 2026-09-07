<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

echo json_encode([
    'ok' => true,
    'service' => 'IMC Database Manager',
    'status' => 'active',
    'version' => '1.0.0',
    'role_version' => 1,
    'current_role' => 'normalization',
    'capabilities' => [
        'normalization'
    ],
    'peer' => [
        'service' => 'IMC Universal Gateway',
        'path' => '/imc-universal-gateway/'
    ]
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
