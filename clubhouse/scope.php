<?php
declare(strict_types=1);
const CLUBHOUSE_WORLDS = ['GW001','GW005','GW009','GW010','GW011','GW004','GW006'];
function clubhouse_check_worlds(array $worlds): void {
 foreach($worlds as $world) if(!in_array($world,CLUBHOUSE_WORLDS,true)){
  http_response_code(422);header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok'=>false,'error'=>'Mondo non incluso nei sette IMC.']);exit;
 }
}
