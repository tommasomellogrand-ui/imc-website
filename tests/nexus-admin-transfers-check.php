<?php
declare(strict_types=1);
$path=__DIR__.'/../nexus/admin/transfers-check-service.php';require is_file($path)?$path:__DIR__.'/transfers-check-service.php';
function tc_assert(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$h=['date'=>'2026-11-14','season'=>43,'club_from'=>'Club A','club_to'=>'Club B','amount_text'=>'1.3M','exchange_players'=>[]];
$r=['imc_transfer_number'=>1,'imc_season'=>2,'player_id'=>10,'player_name'=>'PLAYER','club_from'=>'Club A','club_to'=>'Club B','amount_text'=>'1.3M','exchange_players'=>'[]','normalized_transfer_date'=>'2026-11-14','normalized_season'=>43,'normalized_exchange_players'=>'[]','normalization_status'=>'CERTIFIED'];
$c=['player_id'=>10,'full_name'=>'Test Player','imported_at'=>'2026-11-15 08:00:00','transfer_history'=>json_encode([$h])];
$a=tc_audit([$r],[$c]);tc_assert($a['summary']['confirmed']===1&&$a['summary']['issues']===0,'Exact history must match, without confusing SM and IMC seasons');
$a=tc_audit([$r],[]);tc_assert($a['summary']['codex_missing']===1,'Missing Codex must be reported');
$bad=$r;$bad['amount_text']='1.2M';$a=tc_audit([$bad],[$c]);tc_assert($a['summary']['history_unconfirmed']===1,'Different amount must not be silently accepted');
$small=$r;$small['amount_text']='1301k';$a=tc_audit([$small],[$c]);tc_assert($a['summary']['small_amount_difference']===1&&$a['summary']['history_unconfirmed']===0,'Small display differences must be separated');
$pending=$r;$pending['normalization_status']=null;$pending['normalized_transfer_date']=null;$pending['normalized_season']=null;$pending['normalized_exchange_players']=null;
$a=tc_audit([$pending],[$c]);tc_assert($a['summary']['pending']===1&&in_array('Una corrispondenza disponibile da normalizzare',$a['rows'][0]['issues'],true),'Available history must be reported');
$pending['imc_transfer_number']=2;$a=tc_audit([$r,$pending],[$c]);tc_assert(in_array('Possibile duplicato: movimenti compatibili già utilizzati',$a['rows'][0]['issues'],true),'A consumed source event must not be reused');
$duplicate=$r;$duplicate['imc_transfer_number']=3;$a=tc_audit([$r,$duplicate],[$c]);tc_assert($a['summary']['duplicates']===2,'Repeated normalized event must be reported');
$old=$r;$old['imc_season']=1;$old['normalized_transfer_date']='2026-07-01';$history=$h;$history['date']='2026-07-01';$c['transfer_history']=json_encode([$h,$history]);$a=tc_audit([$r,$old],[$c]);tc_assert($a['summary']['duplicates']===0,'Same number in different IMC seasons is valid');
$exchange=$r;$exchange['amount_text']='A.TCHOUAMENI';$exchange['normalized_exchange_players']='[{"player_name":"Aurélien TCHOUAMENI"}]';$history=$h;$history['amount_text']=null;$history['exchange_players']=[['player_name'=>'Aurélien TCHOUAMENI']];$c['transfer_history']=json_encode([$history]);$a=tc_audit([$exchange],[$c]);tc_assert($a['summary']['confirmed']===1,'Pure exchanges and abbreviated names must match');
$source=file_get_contents(is_file($path)?$path:__DIR__.'/transfers-check-service.php');tc_assert(!preg_match('/\b(INSERT|UPDATE|DELETE|ALTER|TRUNCATE|DROP)\s/i',$source),'Audit service must be read only');
echo "PASS: source history, exact values, display differences, missing Codex, pending, used events, duplicate scope, exchanges, read-only.\n";
