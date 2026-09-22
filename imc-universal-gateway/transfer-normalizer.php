<?php
declare(strict_types=1);

function imc_tn_out(array $d,int $s=200):never{http_response_code($s);echo json_encode($d,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function imc_tn_cfg():array{$f=dirname(__DIR__).'/__imc_private_gateway/config.php';if(!is_file($f))throw new RuntimeException('gateway_configuration_not_found');$c=require $f;if(!is_array($c)||!isset($c['db'],$c['token']))throw new RuntimeException('gateway_configuration_invalid');return $c;}
function imc_tn_text(mixed $v):string{return trim(preg_replace('/\\s+/u',' ',(string)($v??''))??'');}
function imc_tn_key(int $p,mixed $f,mixed $t,mixed $a):string{return implode('|',[(string)$p,mb_strtolower(imc_tn_text($f),'UTF-8'),mb_strtolower(imc_tn_text($t),'UTF-8'),mb_strtolower(str_replace(' ','',imc_tn_text($a)),'UTF-8')]);}
function imc_transfer_normalizer_run(array $b):never{
 try{
  $c=imc_tn_cfg();$token=(string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN']??'');if($token===''||!hash_equals((string)$c['token'],$token))throw new InvalidArgumentException('unauthorized');
  $gw=strtoupper(trim((string)($b['game_world_id']??'')));if(!preg_match('/^GW(?:00[1-9]|010)$/',$gw))throw new InvalidArgumentException('invalid_game_world');
  $gold=array_map('strtoupper',(array)($c['gold_worlds']??[]));$custom=array_map('strtoupper',(array)($c['custom_worlds']??[]));
  if(in_array($gw,$gold,true))$db=(string)$c['db']['gold'];elseif(in_array($gw,$custom,true))$db=(string)$c['db']['custom'];else throw new InvalidArgumentException('unsupported_game_world');
  $pdo=new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$c['db']['host'],$c['db']['port'],$db),$c['db']['user'],$c['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
  $tick=chr(96);$tt=$gw.'_IMC_Transfers';$ct=$gw.'_IMC_Player_Codex';$qt=$tick.$tt.$tick;$qc=$tick.$ct.$tick;
  $raw=$pdo->query("SELECT imc_transfer_number,player_id,player_name,club_from,club_to,amount_text,transfer_date,season,status,exchange_players FROM ".$qt." ORDER BY imc_transfer_number")->fetchAll();
  $codex=$pdo->query("SELECT player_id,transfer_history FROM ".$qc)->fetchAll();
  $rg=[];foreach($raw as $r){$pid=(int)($r['player_id']??0);if($pid<=0)continue;$k=imc_tn_key($pid,$r['club_from']??null,$r['club_to']??null,$r['amount_text']??null);$rg[$k][]=$r;}
  $hg=[];$bad=0;foreach($codex as $p){$pid=(int)($p['player_id']??0);$h=json_decode((string)($p['transfer_history']??'[]'),true);if(!is_array($h)){$bad++;continue;}foreach($h as $e){if(!is_array($e))continue;$k=imc_tn_key($pid,$e['club_from']??null,$e['club_to']??null,$e['amount_text']??null);$hg[$k][]=$e;}}
  $cert=[];$dup=0;$multi=0;$none=0;foreach($rg as $k=>$rr){$hh=$hg[$k]??[];if(count($rr)===1&&count($hh)===1){$cert[]=['raw'=>$rr[0],'history'=>$hh[0]];continue;}if(count($rr)>1)$dup+=count($rr);if(count($hh)>1)$multi+=count($rr);if(count($hh)===0)$none+=count($rr);}
  $already=0;$would=0;foreach($cert as $x){$r=$x['raw'];$h=$x['history'];$same=strtoupper((string)($r['status']??''))==='CERTIFIED'&&(string)($r['transfer_date']??'')===(string)($h['date']??'')&&(string)($r['season']??'')===(string)($h['season']??'');if($same)$already++;else$would++;}
  $apply=($b['apply']??false)===true;$updated=0;
  if($apply&&$would>0){$pdo->beginTransaction();try{$st=$pdo->prepare("UPDATE ".$qt." SET transfer_date=?,season=?,exchange_players=?,status='CERTIFIED' WHERE imc_transfer_number=? AND player_id=?");foreach($cert as $x){$r=$x['raw'];$h=$x['history'];$same=strtoupper((string)($r['status']??''))==='CERTIFIED'&&(string)($r['transfer_date']??'')===(string)($h['date']??'')&&(string)($r['season']??'')===(string)($h['season']??'');if($same)continue;$st->execute([$h['date']??null,$h['season']??null,json_encode($h['exchange_players']??[],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),$r['imc_transfer_number'],$r['player_id']]);$updated+=$st->rowCount();}$pdo->commit();}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}}
  imc_tn_out(['ok'=>true,'action'=>'normalize_transfers','stage'=>'strict_1_to_1','apply'=>$apply,'game_world_id'=>$gw,'database'=>$db,'raw_rows'=>count($raw),'codex_rows'=>count($codex),'strict_certifiable'=>count($cert),'already_certified'=>$already,'would_update'=>$would,'updated'=>$updated,'raw_rows_in_duplicate_groups'=>$dup,'raw_rows_with_multiple_history_matches'=>$multi,'raw_rows_without_strict_history_match'=>$none,'invalid_transfer_history_rows'=>$bad]);
 }catch(Throwable $e){imc_tn_out(['ok'=>false,'action'=>'normalize_transfers','error'=>$e->getMessage()],$e instanceof InvalidArgumentException?422:500);}
}
