<?php
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$file=__DIR__.'/state.json';
function base(){return ['event'=>'waiting','phase'=>'idle','manager'=>null,'slot'=>null,'assignments'=>[],'updated_at'=>gmdate('c')];}
$fp=fopen($file,'c+');if(!$fp){http_response_code(500);echo json_encode(['ok'=>false]);exit;}flock($fp,LOCK_EX);rewind($fp);$raw=stream_get_contents($fp);$s=$raw?json_decode($raw,true):base();if(!is_array($s))$s=base();$s=array_merge(base(),$s);
if($_SERVER['REQUEST_METHOD']==='POST'){$in=json_decode(file_get_contents('php://input'),true)?:[];$a=$in['action']??'';
 if($a==='host_reset'){$s=base();}
 elseif($a==='host_start'){$s=base();$s['event']='live';$s['phase']='manager_spinning';}
 elseif($a==='host_phase'){$s['event']='live';$s['phase']=(string)($in['phase']??'idle');$s['manager']=$in['manager']??$s['manager'];$s['slot']=isset($in['slot'])?(int)$in['slot']:$s['slot'];}
 elseif($a==='host_assignment'){$m=trim((string)($in['manager']??''));$slot=(int)($in['slot']??0);if($m===''||$slot<1||$slot>16){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'invalid_assignment']);flock($fp,LOCK_UN);fclose($fp);exit;}foreach($s['assignments'] as $x){if(($x['manager']??'')===$m||(int)($x['slot']??0)===$slot){http_response_code(409);echo json_encode(['ok'=>false,'error'=>'duplicate_assignment']);flock($fp,LOCK_UN);fclose($fp);exit;}}$s['assignments'][]=['manager'=>$m,'slot'=>$slot,'time'=>gmdate('c')];$s['manager']=$m;$s['slot']=$slot;$s['phase']='assignment';$s['event']=count($s['assignments'])===16?'completed':'live';}
 else{http_response_code(400);echo json_encode(['ok'=>false,'error'=>'unknown_action']);flock($fp,LOCK_UN);fclose($fp);exit;}}
$s['updated_at']=gmdate('c');rewind($fp);ftruncate($fp,0);fwrite($fp,json_encode($s,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));fflush($fp);flock($fp,LOCK_UN);fclose($fp);echo json_encode(array_merge(['ok'=>true],$s),JSON_UNESCAPED_UNICODE);