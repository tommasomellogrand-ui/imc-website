<?php
declare(strict_types=1);

function nexus_out(array $body,int $status=200): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');
  header('Expires: 0');
  echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
  exit;
}
function nexus_config(): array {
  $file=dirname(__DIR__,2).'/__imc_private_gateway/config.php';
  if(!is_file($file)) throw new RuntimeException('configuration_not_found');
  $c=require $file;
  if(!is_array($c)||!isset($c['db'])) throw new RuntimeException('configuration_invalid');
  return $c;
}
function nexus_world(?string $value): string {
  $gw=strtoupper(trim((string)$value));
  if(!preg_match('/^GW00[1-9]$|^GW010$/',$gw)) throw new InvalidArgumentException('invalid_game_world');
  return $gw;
}
function nexus_target(array $c,string $gw): string {
  if(in_array($gw,$c['gold_worlds']??[],true)) return 'gold';
  if(in_array($gw,$c['custom_worlds']??[],true)) return 'custom';
  throw new InvalidArgumentException('unsupported_game_world');
}
function nexus_db(array $c,string $target): PDO {
  $name=$c['db'][$target]??null;
  if(!$name) throw new RuntimeException('database_not_configured');
  return new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$c['db']['host'],$c['db']['port'],$name),$c['db']['user'],$c['db']['pass'],[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES=>false
  ]);
}
function nexus_rows(PDO $db,string $sql,array $params=[]): array {
  $s=$db->prepare($sql);$s->execute($params);return $s->fetchAll();
}
function nexus_season(mixed $value): ?int {
  if($value===null||$value==='') return null;
  if(!is_numeric($value)||(int)$value<1) throw new InvalidArgumentException('invalid_season');
  return (int)$value;
}
function nexus_table(string $gw,string $repository): string {
  $allowed=['Results','Schedule','Match_Report','Transfers','Player_Codex'];
  if(!in_array($repository,$allowed,true)) throw new InvalidArgumentException('invalid_repository');
  return $gw.'_IMC_'.$repository;
}
