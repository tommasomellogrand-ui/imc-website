<?php
declare(strict_types=1);
function imc_db(array $cfg, string $gw): PDO {
  $db = in_array($gw, $cfg['gold_worlds'], true) ? $cfg['db']['gold'] : (in_array($gw, $cfg['custom_worlds'], true) ? $cfg['db']['custom'] : '');
  if ($db === '') throw new RuntimeException('unsupported_game_world');
  if ($cfg['db']['user'] === '') throw new RuntimeException('db_credentials_not_configured');
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['db']['host'], $cfg['db']['port'], $db);
  return new PDO($dsn, $cfg['db']['user'], $cfg['db']['pass'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
}
