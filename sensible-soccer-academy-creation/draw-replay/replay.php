<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
$file=__DIR__.'/replay-data.json';
function out(array $p,int $s=200): never {http_response_code($s);echo json_encode($p,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
if($_SERVER['REQUEST_METHOD']==='GET'){
  if(!is_file($file)) out(['ok'=>true,'replay'=>null]);
  $raw=@file_get_contents($file);$data=$raw?json_decode($raw,true):null;
  out(['ok'=>true,'replay'=>is_array($data)?$data:null]);
}
if($_SERVER['REQUEST_METHOD']!=='POST') out(['ok'=>false,'error'=>'Metodo non consentito'],405);
$raw=file_get_contents('php://input');$data=json_decode($raw?:'',true);
if(!is_array($data)||!isset($data['events'])||!is_array($data['events'])) out(['ok'=>false,'error'=>'Replay non valido'],422);
if(count($data['events'])<2||count($data['events'])>5000) out(['ok'=>false,'error'=>'Timeline replay non valida'],422);
$payload=[
 'version'=>(int)($data['version']??1),
 'title'=>(string)($data['title']??'Sensible Soccer Academy · GW010 Draw'),
 'created_at'=>(string)($data['created_at']??gmdate('c')),
 'duration_ms'=>(int)($data['duration_ms']??0),
 'events'=>array_values($data['events']),
 'assignments'=>isset($data['assignments'])&&is_array($data['assignments'])?array_values($data['assignments']):[]
];
$fh=@fopen($file,'c+');if(!$fh)out(['ok'=>false,'error'=>'Archivio replay non scrivibile'],500);
if(!flock($fh,LOCK_EX)){fclose($fh);out(['ok'=>false,'error'=>'Archivio replay occupato'],503);}rewind($fh);ftruncate($fh,0);
$w=fwrite($fh,json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));fflush($fh);flock($fh,LOCK_UN);fclose($fh);
if($w===false)out(['ok'=>false,'error'=>'Replay non salvato'],500);
out(['ok'=>true,'saved'=>true,'events'=>count($payload['events']),'duration_ms'=>$payload['duration_ms']]);
