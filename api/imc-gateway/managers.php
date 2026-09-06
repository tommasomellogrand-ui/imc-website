<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
$allowed=['https://www.italianmastersclub.it','https://italianmastersclub.it'];
if($origin!==''&&in_array($origin,$allowed,true)){header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if(($_SERVER['REQUEST_METHOD']??'')==='OPTIONS'){http_response_code(204);exit;}

function out(array $p,int $s=200):never{http_response_code($s);echo json_encode($p,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function core_db(array $cfg):PDO{
  $dsn=sprintf('mysql:host=%s;port=%d;dbname=Sql1956795_1;charset=utf8mb4',$cfg['db']['host'],$cfg['db']['port']);
  return new PDO($dsn,$cfg['db']['user'],$cfg['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
}
function img(?string $u):?string{$u=trim((string)$u);if($u==='')return null;return str_starts_with($u,'http://')?'https://'.substr($u,7):$u;}

if(($_SERVER['REQUEST_METHOD']??'')!=='GET')out(['ok'=>false,'error'=>'method_not_allowed'],405);
$gw=strtoupper(trim((string)($_GET['game_world_id']??'')));
$type=strtolower(trim((string)($_GET['type']??'club')));
if(!preg_match('/^GW00[1-9]$/',$gw))out(['ok'=>false,'error'=>'invalid_game_world'],422);
if(!in_array($type,['club','national_team'],true))out(['ok'=>false,'error'=>'invalid_type'],422);
$cfg=require __DIR__.'/config.php';

try{
  $db=core_db($cfg);
  if($type==='club'){
    $sql="SELECT a.assignment_id,a.game_world_id,a.manager_id,m.full_name,m.sm_username,a.team_id,a.start_date,a.end_date,a.season_id,c.name AS team_name,c.short_name,c.image_url FROM gw_manager_assignments a INNER JOIN imc_managers m ON m.manager_id=a.manager_id LEFT JOIN clubs c ON c.club_id=a.team_id WHERE a.game_world_id=? AND a.assignment_type='club' ORDER BY (a.end_date IS NULL) DESC,m.full_name ASC,a.start_date DESC";
    $st=$db->prepare($sql);$st->execute([$gw]);$rows=$st->fetchAll();
    foreach($rows as &$r){$r['image_url']=img($r['image_url']??null);}unset($r);
    out(['ok'=>true,'game_world_id'=>$gw,'type'=>'club','count'=>count($rows),'data'=>$rows]);
  }

  $map=$db->prepare("SELECT nation_id,nation_gw_id FROM nations_game_world_id WHERE game_world_id=? ORDER BY nation_id ASC");
  $map->execute([$gw]);$mapping=$map->fetchAll();
  $master=$db->query("SELECT national_team_id,name,short_name,image_url FROM national_teams WHERE is_active=1 ORDER BY name ASC LIMIT 80")->fetchAll();
  $nationById=[];$n=min(count($mapping),count($master));
  for($i=0;$i<$n;$i++){$nationById[(string)$mapping[$i]['nation_id']]=['nation_gw_id'=>$mapping[$i]['nation_gw_id']]+$master[$i];}
  $st=$db->prepare("SELECT a.assignment_id,a.game_world_id,a.manager_id,m.full_name,m.sm_username,a.nation_id,a.start_date,a.end_date,a.season_id FROM gw_manager_assignments a INNER JOIN imc_managers m ON m.manager_id=a.manager_id WHERE a.game_world_id=? AND a.assignment_type='national_team' ORDER BY (a.end_date IS NULL) DESC,m.full_name ASC,a.start_date DESC");
  $st->execute([$gw]);$rows=$st->fetchAll();
  foreach($rows as &$r){$nat=$nationById[(string)($r['nation_id']??'')]??null;$r['nation_gw_id']=$nat['nation_gw_id']??null;$r['national_team_id']=$nat['national_team_id']??null;$r['team_name']=$nat['name']??null;$r['short_name']=$nat['short_name']??null;$r['image_url']=img($nat['image_url']??null);}unset($r);
  out(['ok'=>true,'game_world_id'=>$gw,'type'=>'national_team','count'=>count($rows),'data'=>$rows]);
}catch(Throwable $e){out(['ok'=>false,'error'=>'managers_read_error'],500);}
