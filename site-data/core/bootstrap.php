<?php
declare(strict_types=1);

require_once __DIR__.'/club-display.php';
require_once __DIR__.'/person-display.php';

function imc_site_out(array $body,int $status=200): never {
  if($status===200&&($body['ok']??false)===true){
    try{$body=imc_site_club_display($body,$_GET);header('X-IMC-Club-Names: core-nexus-view-v1');}
    catch(Throwable $e){error_log('Nexus club display: '.$e->getMessage());}
  }
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');
  header('Expires: 0');
  echo json_encode(imc_person_display_fields($body),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
  exit;
}
function imc_site_config(): array {
  $file=dirname(__DIR__,2).'/__imc_private_gateway/config.php';
  if(!is_file($file)) throw new RuntimeException('configuration_not_found');
  $c=require $file;
  if(!is_array($c)||!isset($c['db'])) throw new RuntimeException('configuration_invalid');
  return $c;
}
const SITE_WORLD_TABLES = ['GW001'=>'IMC001','GW005'=>'IMC002','GW009'=>'IMC003','GW010'=>'IMC004','GW011'=>'IMC005','GW004'=>'IMC006','GW006'=>'IMC007','IMC-008'=>'IMC008'];
function imc_site_world(?string $value):string {
 if(!isset(SITE_WORLD_TABLES[$value??'']))throw new InvalidArgumentException('invalid_world');
 return $value;
}
function imc_site_target(array $config,string $world):string { imc_site_world($world);return 'custom'; }
function imc_site_db(array $c,string $target): PDO {
  $name=$c['db'][$target]??null;
  if(!$name) throw new RuntimeException('database_not_configured');
  return new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$c['db']['host'],$c['db']['port'],$name),$c['db']['user'],$c['db']['pass'],[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES=>false
  ]);
}
function imc_site_rows(PDO $db,string $sql,array $params=[]): array {
  $s=$db->prepare($sql);$s->execute($params);return $s->fetchAll();
}
function imc_site_season(mixed $value): ?int {
  if($value===null||$value==='') return null;
  if(!is_numeric($value)||(int)$value<1) throw new InvalidArgumentException('invalid_season');
  return (int)$value;
}
function imc_site_table(string $world,string $repository):string {
 $suffix=['Results'=>'Results','Player_Codex'=>'Player_Codex','Transfers'=>'Transfers','Match_Report'=>'Match_Reports'];
 if(!isset($suffix[$repository]))throw new InvalidArgumentException('invalid_repository');
 return SITE_WORLD_TABLES[imc_site_world($world)].'_'.$suffix[$repository];
}
