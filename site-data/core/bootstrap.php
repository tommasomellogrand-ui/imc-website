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
  // Sporting tables are partitioned by world. Imports use both the route ID
  // and the IMC partition ID, sometimes within the same season.
  if(preg_match('/\b(IMC00[1-8])_(?:Results|Schedule|Match_Reports)\b/i',$sql,$partition)){
    $world=$partition[1];
    $route=array_search($world,SITE_WORLD_TABLES,true);
    // Public competition links may carry either prefix. Compare both forms
    // using the physical world ID while retaining one bound parameter.
    if($route!==false){
      $sql=preg_replace('/\b((?:[a-z]+\.)?competition_key)\s*=\s*\?/i',
        "REPLACE($1,'$route','$world')=REPLACE(?,'$route','$world')",$sql);
    }
    $sql=preg_replace('/\b((?:[a-z]+\.)?game_world_id)\s*=\s*\?/i', "$1 IN (?, '$world')", $sql);
    // Both sides already refer to the same physical world partition.
    $sql=preg_replace('/\b[a-z]+\.game_world_id\s*=\s*[a-z]+\.game_world_id\b/i','1=1',$sql);
  }
  $s=$db->prepare($sql);$s->execute($params);
  $rows=$s->fetchAll();
  if(isset($route)&&$route!==false){
    foreach($rows as &$row){
      $key=$row['competition_key']??'';
      if(str_starts_with($key,$world.'|')||str_starts_with($key,$world.'_')){
        $row['competition_key']=imc_site_rth_competition_key($route.substr($key,strlen($world)));
      }
    }
    unset($row);
  }
  return $rows;
}
function imc_site_season(mixed $value): ?int {
  if($value===null||$value==='') return null;
  if(!is_numeric($value)||(int)$value<1) throw new InvalidArgumentException('invalid_season');
  return (int)$value;
}
function imc_site_table(string $world,string $repository):string {
 $suffix=['Trophy_Room'=>'Trophy_Room','Schedule'=>'Schedule','Results'=>'Results','Player_Codex'=>'Player_Codex','Transfers'=>'Transfers','Match_Report'=>'Match_Reports'];
 if(!isset($suffix[$repository]))throw new InvalidArgumentException('invalid_repository');
 return SITE_WORLD_TABLES[imc_site_world($world)].'_'.$suffix[$repository];
}

function imc_site_rth_competition_key(string $key): string {
    $slugs=['CHAMPIONS_LEAGUE'=>'championsleague','EUROPA_LEAGUE'=>'europaleague','CONFERENCE_LEAGUE'=>'conferenceleague','CLUB_WORLD_CUP'=>'clubworldcup'];
    foreach($slugs as $old=>$slug) {
        if(in_array($key,['GW001_IMC_'.$old,'IMC001_IMC_'.$old,'IMC-001_IMC_'.$old,'GW001|IMC|'.$slug,'IMC-001|IMC|'.$slug,'IMC001|IMC|'.$slug],true))return 'IMC001|IMC|'.$slug;
    }
    return $key;
}

if(isset($_GET['competition'])&&is_string($_GET['competition']))$_GET['competition']=imc_site_rth_competition_key($_GET['competition']);

function imc_site_codex_position(string $role, ?string $stored): ?string {
  $role = strtoupper(preg_replace('/\s+/', '', $role));
  if ($role === 'PT') return 'Portiere';
  if (preg_match('/^(?:CC(?:\(([A-Z]+)\))?,CO(?:\(([A-Z]+)\))?|CO(?:\(([A-Z]+)\))?,CC(?:\(([A-Z]+)\))?)$/', $role, $parts, PREG_UNMATCHED_AS_NULL)) {
    // A trailing zone applies to both roles when the first role has no zone.
    $coZone = str_starts_with($role, 'CC') ? $parts[2] : ($parts[3] ?? $parts[4]);
    return strpbrk($coZone ?? '', 'DS') !== false ? 'Centrocampista Offensivo' : 'Centrocampista';
  }
  if (preg_match('/(?:^|,)A(?:\(|,|$)/', $role)) return $stored;
  $pending = [];
  $wide = [];
  $centralAndWideDefender = false;
  foreach (explode(',', $role) as $token) {
    if (!preg_match('/^([A-Z]+)(?:\(([A-Z]+)\))?$/', $token, $part)) return $stored;
    if (in_array($part[1], ['DDC','DSC','DDCS','DDSC'], true)) {
      $centralAndWideDefender = true;
      continue;
    }
    $pending[] = $part[1];
    if (!isset($part[2])) continue;
    if (str_contains($part[2], 'C') && strpbrk($part[2], 'DS') !== false && in_array('D', $pending, true)) {
      $centralAndWideDefender = true;
    }
    if (preg_match('/^(?:DX|SX|D|S)+$/', $part[2])) {
      foreach ($pending as $code) $wide[$code] = true;
    }
    $pending = [];
  }
  if ($centralAndWideDefender && isset($wide['CD'])) return 'Terzino';
  // Central defence, either alone or paired only with defensive midfield.
  if (preg_match('/^(?:D(?:\((?:C|D(?:X)?C|S(?:X)?C)\)|(?:D|S)?C)(?:,CD(?:\([A-Z]+\))?)?|D,CD\((?:C|D(?:X)?C|S(?:X)?C)\)|CD(?:\([A-Z]+\))?,D(?:\((?:C|D(?:X)?C|S(?:X)?C)\)|(?:D|S)?C))$/', $role)) return 'Difensore';
  return isset($wide['D'], $wide['CD']) ? 'Terzino' : $stored;
}
