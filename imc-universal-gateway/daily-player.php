<?php
declare(strict_types=1);
require __DIR__.'/core.php';
header('Content-Type: application/json');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Daily');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD']==='OPTIONS') {http_response_code(204);exit;}
function daily_reply(array $body,int $code=200): never {
 http_response_code($code);echo json_encode($body);exit;
}
if ($_SERVER['REQUEST_METHOD']!=='POST') daily_reply(['ok'=>false,'error'=>'POST richiesto'],405);
if (!hash_equals('a834288c7fe996cdd9b162829571c5a3f98312f11919689ec0d5eec5dc06e295',hash('sha256',$_SERVER['HTTP_X_IMC_DAILY']??''))) daily_reply(['ok'=>false,'error'=>'Accesso negato'],403);
function normalize_json($v){
 if(is_array($v)){if(!array_is_list($v))ksort($v);foreach($v as &$item)$item=normalize_json($item);}
 return $v;
}
try {
 $b=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR);
 $cfg=imc_cfg();$db=imc_db($cfg,$cfg['db']['core']);
 $fields=explode(' ','player_id full_name nationality position rating market_value age date_of_birth height_cm weight_kg foot current_club current_sm_club_id real_club salary contract_seasons image_url rating_history transfer_history imported_at');
 $table='`IMC Daily Updates`';
 if(($b['check']??false)===true){$db->query('SELECT '.implode(',',$fields).' FROM '.$table.' LIMIT 0');daily_reply(['ok'=>true,'fields'=>count($fields)]);}
 $row=$b['row']??[];
 if(!is_array($row)||array_diff($fields,array_keys($row))||array_diff(array_keys($row),$fields)||empty($row['full_name'])||empty($row['position'])||intval($row['player_id'])<1||intval($row['rating'])<1)daily_reply(['ok'=>false,'error'=>'Profilo incompleto'],422);
 foreach(['rating_history','transfer_history'] as $f){$v=json_decode($row[$f],true,32,JSON_THROW_ON_ERROR);if(!is_array($v)||!array_is_list($v))daily_reply(['ok'=>false,'error'=>'Cronologia non valida'],422);}
 $lock=$db->prepare('SELECT GET_LOCK(?,10)');$lock->execute(['imc_daily_'.intval($row['player_id'])]);if((int)$lock->fetchColumn()!==1)daily_reply(['ok'=>false,'error'=>'Giocatore occupato'],409);
 $db->beginTransaction();
 $q=$db->prepare('SELECT * FROM '.$table.' WHERE player_id=? ORDER BY imported_at DESC LIMIT 1');$q->execute([$row['player_id']]);$old=$q->fetch(PDO::FETCH_ASSOC);
 $same=(bool)$old;
 foreach($fields as $f){if(!$same||$f==='imported_at')continue;$a=$old[$f];$v=$row[$f];
 if(in_array($f,['rating_history','transfer_history'],true)){$same=normalize_json(json_decode($a??'[]',true))===normalize_json(json_decode($v,true));}
 else $same=$a===null||$v===null?$a===$v:(string)$a===(string)$v;}
 if(!$same){$q=$db->prepare('INSERT INTO '.$table.' ('.implode(',',$fields).') VALUES ('.implode(',',array_fill(0,count($fields),'?')).')');$q->execute(array_map(fn($f)=>$row[$f],$fields));}
 $db->commit();daily_reply(['ok'=>true,'state'=>$same?'Invariato':'Salvato','player_id'=>(int)$row['player_id']]);
}catch(Throwable $e){if(isset($db)&&$db->inTransaction())$db->rollBack();error_log('IMC Daily: '.$e->getMessage());daily_reply(['ok'=>false,'error'=>'Scrittura o verifica Daily Updates fallita'],500);}
