<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'ok' => true,
  'service' => 'IMC Universal Gateway',
  'version' => '1.3.0'
], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
