<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

echo json_encode([
    'ok' => true,
    'service' => 'IMC Database Manager',
    'status' => 'empty'
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
