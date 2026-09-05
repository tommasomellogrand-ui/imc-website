<?php
declare(strict_types=1);

require_once __DIR__.'/core.php';

const SMM_MATCH_REPORT_INGESTION_TOKEN = 'IMC_RESULTS_GOLD_2026_V1_9f6d2c4a7b8e1d3f';

$ingestionDirectRequest=realpath((string)($_SERVER['SCRIPT_FILENAME']??''))===__FILE__;
if($ingestionDirectRequest){
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    $origin=(string)($_SERVER['HTTP_ORIGIN']??'');
    if($origin!==''&&preg_match('~^https://([a-z0-9-]+\\.)*soccermanager\\.com$~i',$origin)){
        header('Access-Control-Allow-Origin: '.$origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Content-Type, X-IMC-Ingestion-Token, X-IMC-Token, Authorization');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    if(($_SERVER['REQUEST_METHOD']??'')==='OPTIONS'){http_response_code(204);exit;}
}

function ingestion_reply(array $data,int $status=200):never{smm_json($data,$status);}
function ingestion_fail(string $message,int $status=422):never{ingestion_reply(['ok'=>false,'error'=>$message],$status);}
function ingestion_world(mixed $value):string{$gw=strtoupper(trim((string)$value));if(!preg_match('/^GW00[1-9]$/',$gw))ingestion_fail('game_world_id invalid.');return $gw;}
function ingestion_storage_key(string $gw):string{return in_array($gw,['GW002','GW003','GW007','GW008'],true)?'gold':'custom';}
function ingestion_assert_storage(mysqli $db,string $gw):void{$expected=ingestion_storage_key($gw)==='gold'?'Sql1956795_2':'Sql1956795_3';$selected=(string)$db->query('SELECT DATABASE() AS db')->fetch_assoc()['db'];if($selected!==$expected)ingestion_fail('Database routing mismatch.',500);}
function ingestion_uint(mixed $value,bool $nullable=true):?int{if($value===null&&$nullable)return null;if(!is_int($value)&&!(is_string($value)&&ctype_digit($value)))ingestion_fail('Unsigned integer invalid.');$n=(int)$value;if($n<1)ingestion_fail('Unsigned integer out of range.');return $n;}
function ingestion_text(mixed $value,int $max,bool $required=false):?string{if($value===null&&!$required)return null;$s=trim((string)$value);if(($required&&$s==='')||mb_strlen($s)>$max)ingestion_fail('Text value invalid.');return $s===''?null:$s;}
function ingestion_current_imc_season(mysqli $unused,string $gw):int{$core=smm_db();$q=$core->prepare('SELECT imc_season FROM imc_game_world_seasons WHERE game_world_id=? ORDER BY (imc_season_end_date IS NULL) DESC,imc_season DESC LIMIT 1');$q->bind_param('s',$gw);$q->execute();$r=$q->get_result()->fetch_assoc();$q->close();if(!$r)ingestion_fail('CORE season unavailable.',409);return (int)$r['imc_season'];}
function ingestion_context(mysqli $db,string $gw,int $imcSeason):array{
    $core=smm_db();$q=$core->prepare('SELECT w.imc_name,w.game_world_type,w.sm_game_world_id,w.soccer_manager_season world_sm_season,s.soccer_manager_season,s.imc_season_start_date,s.imc_season_end_date FROM imc_game_worlds w LEFT JOIN imc_game_world_seasons s ON s.game_world_id=w.game_world_id AND s.imc_season=? WHERE w.game_world_id=? LIMIT 1');$q->bind_param('is',$imcSeason,$gw);$q->execute();$r=$q->get_result()->fetch_assoc();$q->close();if(!$r)ingestion_fail('CORE Game World/season unavailable.',409);
    $smWorld=$r['sm_game_world_id']===null?null:(int)$r['sm_game_world_id'];$smSeason=$r['soccer_manager_season']===null?($r['world_sm_season']===null?null:(int)$r['world_sm_season']):(int)$r['soccer_manager_season'];if($smWorld===null||$smSeason===null)ingestion_fail('CORE Soccer Manager context incomplete.',409);
    $family=ingestion_storage_key($gw)==='gold'?'multi_league':'single_league';
    $g=$db->prepare('INSERT INTO gw_game_worlds(game_world_id,game_world_name,game_world_type,sm_game_world_id,current_soccer_manager_season,created_at,updated_at) VALUES(?,?,?,?,?,NOW(6),NOW(6)) ON DUPLICATE KEY UPDATE game_world_type=VALUES(game_world_type),game_world_name=VALUES(game_world_name),sm_game_world_id=VALUES(sm_game_world_id),current_soccer_manager_season=VALUES(current_soccer_manager_season),updated_at=NOW(6)');$g->execute([$gw,$r['imc_name'],$family,$smWorld,$smSeason]);$g->close();
    $f=$db->prepare('SELECT gw_season_row_id,sm_season_id,soccer_manager_season FROM gw_seasons WHERE game_world_id=? AND imc_season=? ORDER BY gw_season_row_id LIMIT 2');$f->execute([$gw,$imcSeason]);$seasonRows=$f->get_result()->fetch_all(MYSQLI_ASSOC);$f->close();if(count($seasonRows)>1)ingestion_fail('Canonical season is ambiguous.',409);
    if($seasonRows){$seasonData=$seasonRows[0];if((int)$seasonData['soccer_manager_season']!==$smSeason)ingestion_fail('CORE/destination season mismatch.',409);$seasonRow=(int)$seasonData['gw_season_row_id'];$sq=$db->prepare('UPDATE gw_seasons SET end_date=?,start_date=?,sm_game_world_id=COALESCE(sm_game_world_id,?) WHERE gw_season_row_id=?');$sq->execute([$r['imc_season_end_date'],$r['imc_season_start_date'],$smWorld,$seasonRow]);$sq->close();}
    else{$fp=hash('sha256',$gw.'|'.$imcSeason.'|'.$smSeason);$sq=$db->prepare('INSERT INTO gw_seasons(created_at,end_date,game_world_id,imc_season,season_identity_fingerprint,season_label,sm_game_world_id,sm_season_id,soccer_manager_season,start_date) VALUES(NOW(6),?,?,?,?,?,?,NULL,?,?)');$sq->execute([$r['imc_season_end_date'],$gw,$imcSeason,$fp,'IMC Season '.$imcSeason,$smWorld,$smSeason,$r['imc_season_start_date']]);$seasonRow=(int)$db->insert_id;$sq->close();$seasonData=['sm_season_id'=>null];}
    $provenSmSeasonId=$seasonData['sm_season_id']===null?null:(int)$seasonData['sm_season_id'];
    return ['game_world_id'=>$gw,'game_world_type'=>$family,'imc_season'=>$imcSeason,'sm_game_world_id'=>$smWorld,'soccer_manager_season'=>$smSeason,'sm_season_id'=>$provenSmSeasonId,'gw_season_row_id'=>$seasonRow,'start_date'=>$r['imc_season_start_date'],'end_date'=>$r['imc_season_end_date']];
}

function smm_handle_ingestion():never{
    $body=smm_ingestion_payload();
    smm_ingestion_auth($body);
    $type=strtolower(trim((string)($body['type']??'')));
    if(in_array($type,['results','schedule','match_report','player_codex','transfers','manager_scan'],true)){
        if($type==='transfers'&&(string)($body['action']??'')==='worlds'){
            require_once __DIR__.'/ingestion/handlers/transfers.php';
            tr_worlds();
        }
        if($type==='transfers'){
            $gw=ingestion_world($body['game_world_id']??$body['gameWorld']??null);
            $db=smm_storage_db(ingestion_storage_key($gw));
            ingestion_assert_storage($db,$gw);
            require_once __DIR__.'/ingestion/handlers/transfers.php';
            transfers_handle($db,$body,(string)($body['action']??''),$gw);
        }
        if($type==='player_codex'){
            $gw=ingestion_world($body['game_world_id']??null);
            $db=smm_storage_db(ingestion_storage_key($gw));
            ingestion_assert_storage($db,$gw);
            require_once __DIR__.'/ingestion/handlers/player-codex.php';
            player_codex_handle($db,$body,(string)($body['action']??''));
        }
        if($type==='match_report'&&(string)($body['action']??'')==='worlds'){
            require_once __DIR__.'/ingestion/handlers/match-report.php';
            mr_worlds();
        }
        $gw=ingestion_world($body['game_world_id']??null);
        $db=smm_storage_db(ingestion_storage_key($gw));
        ingestion_assert_storage($db,$gw);
        require_once __DIR__.'/ingestion/router.php';
        ingestion_route($db,$body,$type,(string)($body['action']??''));
    }
    smm_handle_legacy_ingestion_payload($body);
}

function smm_handle_legacy_ingestion_payload(array $p):never{
    $a=(string)($p['action']??'');
    if($a==='upsert_imc_managers')smm_upsert_managers($p);
    if($a==='upsert_game_world_settings')smm_upsert_rows($p,$a,'imc_game_worlds',['game_world_id','imc_name','game_world_type','soccer_manager_season','soccer_manager_name','sm_game_world_id','soccer_manager_type','soccer_manager_owner','soccer_manager_creator','club_active','countries'],['game_world_id'],'sssisssssis','smm_world_row');
    if($a==='upsert_game_world_seasons')smm_upsert_rows($p,$a,'imc_game_world_seasons',['game_world_id','imc_season','soccer_manager_season','imc_season_start_date','imc_season_end_date'],['game_world_id','imc_season'],'siiss','smm_season_row');
    if($a==='upsert_gw_manager_assignments')smm_upsert_rows($p,$a,'gw_manager_assignments',['assignment_id','game_world_id','manager_id','team_id','assignment_type','start_date','end_date','season_id','nation_id'],['assignment_id'],'ississsii','smm_assignment_row');
    if($a==='core_status')smm_core_status();
    if($a==='storage_status')smm_storage_status();
    if($a==='install_gold_schema_checkpoint_06')smm_install_gold_schema_checkpoint_06();
    if($a==='gold_schema_status')smm_gold_schema_status();
    throw new InvalidArgumentException('Unknown action.');
}

if($ingestionDirectRequest){
    try{smm_handle_ingestion();}
    catch(Throwable $e){$status=http_response_code();if($status<400)$status=$e instanceof InvalidArgumentException?422:500;smm_json(['ok'=>false,'error'=>$e->getMessage()],$status);}
}

function smm_ingestion_reply(string $action,int $inserted,int $updated,int $skipped,array $errors,array $extra=[],int $status=200):never{
    smm_json(array_merge(['ok'=>$status<300&&!$errors,'action'=>$action,'inserted'=>$inserted,'updated'=>$updated,'skipped'=>$skipped,'errors'=>$errors],$extra),$status);
}
function smm_ingestion_auth(array $payload=[]):void{
    $https=strtolower((string)($_SERVER['HTTPS']??''));$forwarded=strtolower(trim(explode(',',(string)($_SERVER['HTTP_X_FORWARDED_PROTO']??''))[0]));
    if($https!=='on'&&$https!=='1'&&$forwarded!=='https')throw new RuntimeException('HTTPS required.');
    if(session_status()!==PHP_SESSION_ACTIVE)session_start();if(!empty($_SESSION['sm_master_auth']))return;
    $token=trim((string)($_SERVER['HTTP_X_IMC_TOKEN']??''));$header=trim((string)($_SERVER['HTTP_AUTHORIZATION']??''));if(function_exists('getallheaders')){$h=getallheaders();if($token==='')$token=trim((string)($h['X-IMC-Token']??$h['x-imc-token']??''));if($header==='')$header=trim((string)($h['Authorization']??$h['authorization']??''));}
    if($token===''&&preg_match('/^Bearer\s+(.+)$/i',$header,$m))$token=trim($m[1]);
    if($token==='')$token=trim((string)($_SERVER['HTTP_X_IMC_INGESTION_TOKEN']??''));
    if($token==='')$token=trim((string)($payload['token']??''));
    $adminAuthorized=$token!==''&&hash_equals((string)smm_config()['admin_token'],$token);
    $importerType=strtolower(trim((string)($payload['type']??'')));
    $existingImporterAuthorized=$token!==''&&in_array($importerType,['results','schedule','match_report','transfers','manager_scan'],true)&&hash_equals(SMM_MATCH_REPORT_INGESTION_TOKEN,$token);
    $playerCodexAuthorized=$token!==''&&$importerType==='player_codex'&&hash_equals(SMM_MATCH_REPORT_INGESTION_TOKEN,$token);
    if(!$adminAuthorized&&!$existingImporterAuthorized&&!$playerCodexAuthorized){http_response_code(401);throw new RuntimeException('Unauthorized.');}
}
function smm_ingestion_payload():array{
    if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){http_response_code(405);header('Allow: POST');throw new RuntimeException('POST required.');}
    if(strtolower(trim(explode(';',(string)($_SERVER['CONTENT_TYPE']??''))[0]))!=='application/json'){http_response_code(415);throw new RuntimeException('Content-Type application/json required.');}
    if((int)($_SERVER['CONTENT_LENGTH']??0)>4194304){http_response_code(413);throw new RuntimeException('Payload too large.');}
    $raw=file_get_contents('php://input',false,null,0,4194305);if($raw===false||$raw==='')throw new InvalidArgumentException('Empty JSON payload.');if(strlen($raw)>4194304){http_response_code(413);throw new RuntimeException('Payload too large.');}
    $payload=json_decode($raw,true,32,JSON_THROW_ON_ERROR);if(!is_array($payload))throw new InvalidArgumentException('JSON object required.');return $payload;
}
function smm_ingestion_tables(mysqli $db):void{
    $db->query("CREATE TABLE IF NOT EXISTS ingestion_runs(run_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,request_id VARCHAR(80) NOT NULL,action VARCHAR(64) NOT NULL,status ENUM('running','success','failed') NOT NULL,received_count INT UNSIGNED NOT NULL DEFAULT 0,inserted_count INT UNSIGNED NOT NULL DEFAULT 0,updated_count INT UNSIGNED NOT NULL DEFAULT 0,skipped_count INT UNSIGNED NOT NULL DEFAULT 0,error_count INT UNSIGNED NOT NULL DEFAULT 0,started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,finished_at DATETIME NULL,PRIMARY KEY(run_id),UNIQUE KEY uq_ingestion_request(request_id,action),KEY idx_ingestion_action_started(action,started_at))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $db->query("CREATE TABLE IF NOT EXISTS ingestion_errors(error_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,run_id BIGINT UNSIGNED NULL,action VARCHAR(64) NOT NULL,record_key VARCHAR(160) NULL,error_message VARCHAR(1000) NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(error_id),KEY idx_ingestion_error_run(run_id),CONSTRAINT fk_ingestion_error_run FOREIGN KEY(run_id) REFERENCES ingestion_runs(run_id) ON DELETE SET NULL)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $db->query("CREATE TABLE IF NOT EXISTS imc_managers(manager_id VARCHAR(16) NOT NULL,full_name VARCHAR(160) NOT NULL,imc_join_date DATE NULL,sm_manager_id BIGINT UNSIGNED NULL,sm_username VARCHAR(160) NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(manager_id),UNIQUE KEY uq_imc_managers_sm_manager_id(sm_manager_id),KEY idx_imc_managers_name(full_name))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $db->query("CREATE TABLE IF NOT EXISTS imc_game_worlds(game_world_id VARCHAR(16) NOT NULL,imc_name VARCHAR(160) NOT NULL,game_world_type VARCHAR(40) NOT NULL,soccer_manager_season INT UNSIGNED NULL,soccer_manager_name VARCHAR(200) NULL,sm_game_world_id BIGINT UNSIGNED NULL,soccer_manager_type VARCHAR(120) NULL,soccer_manager_owner VARCHAR(160) NULL,soccer_manager_creator VARCHAR(160) NULL,club_active INT UNSIGNED NULL,countries TEXT NULL,PRIMARY KEY(game_world_id),UNIQUE KEY uq_imc_game_worlds_sm_id(sm_game_world_id))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $db->query("CREATE TABLE IF NOT EXISTS imc_game_world_seasons(game_world_id VARCHAR(16) NOT NULL,imc_season INT UNSIGNED NOT NULL,soccer_manager_season INT UNSIGNED NULL,imc_season_start_date DATE NULL,imc_season_end_date DATE NULL,PRIMARY KEY(game_world_id,imc_season))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $db->query("CREATE TABLE IF NOT EXISTS gw_manager_assignments(assignment_id BIGINT UNSIGNED NOT NULL,game_world_id VARCHAR(16) NOT NULL,manager_id VARCHAR(16) NOT NULL,team_id BIGINT UNSIGNED NULL,assignment_type VARCHAR(40) NOT NULL,start_date DATE NOT NULL,end_date DATE NULL,season_id BIGINT UNSIGNED NULL,nation_id BIGINT UNSIGNED NULL,PRIMARY KEY(assignment_id),KEY idx_gw_assignment_world(game_world_id),KEY idx_gw_assignment_manager(manager_id))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}
function smm_manager_row(array $row,int $i):array{
    $unknown=array_diff(array_keys($row),['manager_id','full_name','imc_join_date','sm_manager_id','sm_username']);if($unknown)throw new InvalidArgumentException("records[$i]: unknown field ".reset($unknown));
    $id=trim((string)($row['manager_id']??''));$name=trim((string)($row['full_name']??''));if(!preg_match('/^MNG\d{3,12}$/',$id))throw new InvalidArgumentException("records[$i].manager_id is invalid");if($name===''||mb_strlen($name)>160)throw new InvalidArgumentException("records[$i].full_name is invalid");
    $date=$row['imc_join_date']??null;if($date!==null){$date=trim((string)$date);$d=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$d||$d->format('Y-m-d')!==$date)throw new InvalidArgumentException("records[$i].imc_join_date is invalid");}
    $sm=$row['sm_manager_id']??null;if($sm!==null&&(!is_int($sm)&&!(is_string($sm)&&ctype_digit($sm))))throw new InvalidArgumentException("records[$i].sm_manager_id is invalid");if($sm!==null&&((int)$sm<1||(int)$sm>4294967295))throw new InvalidArgumentException("records[$i].sm_manager_id is out of range");
    $user=$row['sm_username']??null;if($user!==null){$user=trim((string)$user);if($user===''||mb_strlen($user)>160)throw new InvalidArgumentException("records[$i].sm_username is invalid");}return[$id,$name,$date,$sm===null?null:(int)$sm,$user];
}
function smm_upsert_managers(array $payload):never{
    $action='upsert_imc_managers';$request=trim((string)($payload['request_id']??''));if(!preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{7,79}$/',$request))throw new InvalidArgumentException('request_id is invalid.');
    $records=$payload['records']??null;if(!is_array($records)||!array_is_list($records)||count($records)<1||count($records)>1000)throw new InvalidArgumentException('records must be a non-empty JSON array with at most 1000 items.');
    $db=smm_db();smm_ingestion_tables($db);$check=$db->prepare('SELECT run_id,status FROM ingestion_runs WHERE request_id=? AND action=? LIMIT 1');$check->bind_param('ss',$request,$action);$check->execute();$previous=$check->get_result()->fetch_assoc();$check->close();
    if($previous&&$previous['status']==='success')smm_ingestion_reply($action,0,0,count($records),[],['request_id'=>$request,'run_id'=>(int)$previous['run_id'],'idempotent_replay'=>true]);if($previous)throw new RuntimeException('request_id already exists with non-success status.');
    $received=count($records);$start=$db->prepare("INSERT INTO ingestion_runs(request_id,action,status,received_count)VALUES(?,?,'running',?)");$start->bind_param('ssi',$request,$action,$received);$start->execute();$run=(int)$db->insert_id;$start->close();$errors=[];$valid=[];$ids=[];$smIds=[];
    foreach($records as $i=>$row){try{if(!is_array($row))throw new InvalidArgumentException("records[$i] must be an object");$v=smm_manager_row($row,$i);if(isset($ids[$v[0]]))throw new InvalidArgumentException("records[$i].manager_id is duplicated");if($v[3]!==null&&isset($smIds[$v[3]]))throw new InvalidArgumentException("records[$i].sm_manager_id is duplicated");$ids[$v[0]]=1;if($v[3]!==null)$smIds[$v[3]]=1;$valid[]=$v;}catch(Throwable $e){$errors[]=['index'=>$i,'manager_id'=>$row['manager_id']??null,'error'=>$e->getMessage()];}}
    if($errors){smm_fail_ingestion($db,$run,$action,$errors);smm_ingestion_reply($action,0,0,0,$errors,['request_id'=>$request,'run_id'=>$run],422);}
    $inserted=$updated=$skipped=0;
    try{$select=$db->prepare('SELECT full_name,imc_join_date,sm_manager_id,sm_username FROM imc_managers WHERE manager_id=? LIMIT 1');$upsert=$db->prepare('INSERT INTO imc_managers(manager_id,full_name,imc_join_date,sm_manager_id,sm_username)VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name),imc_join_date=VALUES(imc_join_date),sm_manager_id=VALUES(sm_manager_id),sm_username=VALUES(sm_username)');$db->begin_transaction();
        foreach($valid as[$id,$name,$date,$sm,$user]){$select->bind_param('s',$id);$select->execute();$old=$select->get_result()->fetch_assoc();$same=$old&&$old['full_name']===$name&&$old['imc_join_date']===$date&&($old['sm_manager_id']===null?null:(int)$old['sm_manager_id'])===$sm&&$old['sm_username']===$user;if($same){$skipped++;continue;}$upsert->bind_param('sssis',$id,$name,$date,$sm,$user);$upsert->execute();$old?$updated++:$inserted++;}$db->commit();$select->close();$upsert->close();
        $finish=$db->prepare("UPDATE ingestion_runs SET status='success',inserted_count=?,updated_count=?,skipped_count=?,finished_at=NOW() WHERE run_id=?");$finish->bind_param('iiii',$inserted,$updated,$skipped,$run);$finish->execute();$finish->close();$counts=$db->query('SELECT COUNT(*) total,COUNT(DISTINCT manager_id) distinct_ids FROM imc_managers')->fetch_assoc();smm_ingestion_reply($action,$inserted,$updated,$skipped,[],['request_id'=>$request,'run_id'=>$run,'table_count'=>(int)$counts['total'],'distinct_manager_ids'=>(int)$counts['distinct_ids']]);
    }catch(Throwable $e){try{$db->rollback();}catch(Throwable){}$errors=[['error'=>$e->getMessage()]];smm_fail_ingestion($db,$run,$action,$errors);smm_ingestion_reply($action,0,0,0,$errors,['request_id'=>$request,'run_id'=>$run],422);}
}
function smm_date(mixed $v,string $p,bool $nullable=true):?string{if($v===null&&$nullable)return null;$s=trim((string)$v);$d=DateTimeImmutable::createFromFormat('!Y-m-d',$s);if(!$d||$d->format('Y-m-d')!==$s)throw new InvalidArgumentException("$p is invalid");return $s;}
function smm_uint(mixed $v,string $p,bool $nullable=true):?int{if($v===null&&$nullable)return null;if(!is_int($v)&&!(is_string($v)&&ctype_digit($v)))throw new InvalidArgumentException("$p is invalid");$n=(int)$v;if($n<1)throw new InvalidArgumentException("$p is out of range");return $n;}
function smm_text(mixed $v,string $p,int $max,bool $nullable=true):?string{if($v===null&&$nullable)return null;$s=trim((string)$v);if($s===''||mb_strlen($s)>$max)throw new InvalidArgumentException("$p is invalid");return $s;}
function smm_world_row(array $r,int $i):array{$f=['game_world_id','imc_name','game_world_type','soccer_manager_season','soccer_manager_name','sm_game_world_id','soccer_manager_type','soccer_manager_owner','soccer_manager_creator','club_active','countries'];$u=array_diff(array_keys($r),$f);if($u)throw new InvalidArgumentException("records[$i]: unknown field ".reset($u));$id=smm_text($r['game_world_id']??null,"records[$i].game_world_id",16,false);if(!preg_match('/^GW\d{3}$/',$id))throw new InvalidArgumentException("records[$i].game_world_id is invalid");return[$id,smm_text($r['imc_name']??null,"records[$i].imc_name",160,false),smm_text($r['game_world_type']??null,"records[$i].game_world_type",40,false),smm_uint($r['soccer_manager_season']??null,"records[$i].soccer_manager_season"),smm_text($r['soccer_manager_name']??null,"records[$i].soccer_manager_name",200),smm_uint($r['sm_game_world_id']??null,"records[$i].sm_game_world_id"),smm_text($r['soccer_manager_type']??null,"records[$i].soccer_manager_type",120),smm_text($r['soccer_manager_owner']??null,"records[$i].soccer_manager_owner",160),smm_text($r['soccer_manager_creator']??null,"records[$i].soccer_manager_creator",160),smm_uint($r['club_active']??null,"records[$i].club_active"),smm_text($r['countries']??null,"records[$i].countries",4000)];}
function smm_season_row(array $r,int $i):array{$f=['game_world_id','imc_season','soccer_manager_season','imc_season_start_date','imc_season_end_date'];$u=array_diff(array_keys($r),$f);if($u)throw new InvalidArgumentException("records[$i]: unknown field ".reset($u));$id=smm_text($r['game_world_id']??null,"records[$i].game_world_id",16,false);if(!preg_match('/^GW\d{3}$/',$id))throw new InvalidArgumentException("records[$i].game_world_id is invalid");return[$id,smm_uint($r['imc_season']??null,"records[$i].imc_season",false),smm_uint($r['soccer_manager_season']??null,"records[$i].soccer_manager_season"),smm_date($r['imc_season_start_date']??null,"records[$i].imc_season_start_date"),smm_date($r['imc_season_end_date']??null,"records[$i].imc_season_end_date")];}
function smm_assignment_row(array $r,int $i):array{$f=['assignment_id','game_world_id','manager_id','team_id','assignment_type','start_date','end_date','season_id','nation_id'];$u=array_diff(array_keys($r),$f);if($u)throw new InvalidArgumentException("records[$i]: unknown field ".reset($u));$gw=smm_text($r['game_world_id']??null,"records[$i].game_world_id",16,false);$m=smm_text($r['manager_id']??null,"records[$i].manager_id",16,false);if(!preg_match('/^GW\d{3}$/',$gw)||!preg_match('/^MNG\d{3,12}$/',$m))throw new InvalidArgumentException("records[$i] has an invalid identifier");return[smm_uint($r['assignment_id']??null,"records[$i].assignment_id",false),$gw,$m,smm_uint($r['team_id']??null,"records[$i].team_id"),smm_text($r['assignment_type']??null,"records[$i].assignment_type",40,false),smm_date($r['start_date']??null,"records[$i].start_date",false),smm_date($r['end_date']??null,"records[$i].end_date"),smm_uint($r['season_id']??null,"records[$i].season_id"),smm_uint($r['nation_id']??null,"records[$i].nation_id")];}
function smm_same(?array $old,array $columns,array $values):bool{if(!$old)return false;foreach($columns as $i=>$c){$a=$old[$c]??null;$b=$values[$i];if($a!==null&&is_int($b))$a=(int)$a;if($a!==$b)return false;}return true;}
function smm_upsert_rows(array $payload,string $action,string $table,array $columns,array $keys,string $types,callable $validator):never{
    $request=trim((string)($payload['request_id']??''));if(!preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{7,79}$/',$request))throw new InvalidArgumentException('request_id is invalid.');$records=$payload['records']??null;if(!is_array($records)||!array_is_list($records)||count($records)<1||count($records)>1000)throw new InvalidArgumentException('records must be a non-empty JSON array with at most 1000 items.');
    $db=smm_db();smm_ingestion_tables($db);$check=$db->prepare('SELECT run_id,status FROM ingestion_runs WHERE request_id=? AND action=? LIMIT 1');$check->bind_param('ss',$request,$action);$check->execute();$previous=$check->get_result()->fetch_assoc();$check->close();if($previous&&$previous['status']==='success')smm_ingestion_reply($action,0,0,count($records),[],['request_id'=>$request,'run_id'=>(int)$previous['run_id'],'idempotent_replay'=>true]);if($previous)throw new RuntimeException('request_id already exists with non-success status.');
    $n=count($records);$start=$db->prepare("INSERT INTO ingestion_runs(request_id,action,status,received_count)VALUES(?,?,'running',?)");$start->bind_param('ssi',$request,$action,$n);$start->execute();$run=(int)$db->insert_id;$start->close();$valid=[];$seen=[];$errors=[];foreach($records as $i=>$r){try{if(!is_array($r))throw new InvalidArgumentException("records[$i] must be an object");$v=$validator($r,$i);$parts=[];foreach($keys as $k)$parts[]=(string)$v[array_search($k,$columns,true)];$key=implode('|',$parts);if(isset($seen[$key]))throw new InvalidArgumentException("records[$i] duplicates key $key");$seen[$key]=1;$valid[]=$v;}catch(Throwable $e){$errors[]=['index'=>$i,'record_key'=>$r[$keys[0]]??null,'error'=>$e->getMessage()];}}if($errors){smm_fail_ingestion($db,$run,$action,$errors);smm_ingestion_reply($action,0,0,0,$errors,['request_id'=>$request,'run_id'=>$run],422);}
    $where=implode(' AND ',array_map(fn($k)=>"$k=?",$keys));$select=$db->prepare('SELECT '.implode(',',$columns).' FROM '.$table.' WHERE '.$where.' LIMIT 1');$updates=implode(',',array_map(fn($c)=>"$c=VALUES($c)",array_values(array_diff($columns,$keys))));$upsert=$db->prepare('INSERT INTO '.$table.'('.implode(',',$columns).')VALUES('.implode(',',array_fill(0,count($columns),'?')).') ON DUPLICATE KEY UPDATE '.$updates);$inserted=$updated=$skipped=0;
    try{$db->begin_transaction();foreach($valid as $v){$kv=[];$kt='';foreach($keys as $k){$pos=array_search($k,$columns,true);$kv[]=$v[$pos];$kt.=$types[$pos];}$select->bind_param($kt,...$kv);$select->execute();$old=$select->get_result()->fetch_assoc();if(smm_same($old,$columns,$v)){$skipped++;continue;}$upsert->bind_param($types,...$v);$upsert->execute();$old?$updated++:$inserted++;}$db->commit();$select->close();$upsert->close();$finish=$db->prepare("UPDATE ingestion_runs SET status='success',inserted_count=?,updated_count=?,skipped_count=?,finished_at=NOW() WHERE run_id=?");$finish->bind_param('iiii',$inserted,$updated,$skipped,$run);$finish->execute();$finish->close();smm_ingestion_reply($action,$inserted,$updated,$skipped,[],['request_id'=>$request,'run_id'=>$run]);}catch(Throwable $e){try{$db->rollback();}catch(Throwable){}$errors=[['error'=>$e->getMessage()]];smm_fail_ingestion($db,$run,$action,$errors);smm_ingestion_reply($action,0,0,0,$errors,['request_id'=>$request,'run_id'=>$run],422);}
}
function smm_core_status():never{$db=smm_db();smm_ingestion_tables($db);$name=$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];$q=fn(string $sql):array=>$db->query($sql)->fetch_assoc();$tables=['imc_managers'=>$q('SELECT COUNT(*) total,COUNT(DISTINCT manager_id) distinct_ids,COUNT(*)-COUNT(DISTINCT manager_id) duplicates FROM imc_managers'),'imc_game_worlds'=>$q('SELECT COUNT(*) total,COUNT(DISTINCT game_world_id) distinct_ids,COUNT(*)-COUNT(DISTINCT game_world_id) duplicates FROM imc_game_worlds'),'imc_game_world_seasons'=>$q("SELECT COUNT(*) total,COUNT(DISTINCT CONCAT(game_world_id,'|',imc_season)) distinct_ids,COUNT(*)-COUNT(DISTINCT CONCAT(game_world_id,'|',imc_season)) duplicates FROM imc_game_world_seasons"),'gw_manager_assignments'=>$q('SELECT COUNT(*) total,COUNT(DISTINCT assignment_id) distinct_ids,COUNT(*)-COUNT(DISTINCT assignment_id) duplicates FROM gw_manager_assignments')];foreach($tables as &$t)foreach($t as &$v)$v=(int)$v;smm_ingestion_reply('core_status',0,0,0,[],['database'=>$name,'tables'=>$tables]);}
function smm_storage_status():never{$result=[];foreach(['gold','custom'] as $storage){$definition=smm_storage_registry()[$storage];$db=smm_storage_db($storage);$selected=$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];$stmt=$db->prepare('SELECT COUNT(*) total FROM information_schema.tables WHERE table_schema=?');$stmt->bind_param('s',$selected);$stmt->execute();$count=(int)$stmt->get_result()->fetch_assoc()['total'];$stmt->close();$result[$storage]=['ok'=>$selected===$definition['database'],'database'=>$selected,'family'=>$definition['family'],'game_worlds'=>$definition['game_worlds'],'mysql_version'=>$db->server_info,'table_count'=>$count];}smm_ingestion_reply('storage_status',0,0,0,[],['storages'=>$result]);}
function smm_fail_ingestion(mysqli $db,int $run,string $action,array $errors):void{$log=$db->prepare('INSERT INTO ingestion_errors(run_id,action,record_key,error_message)VALUES(?,?,?,?)');foreach($errors as $e){$key=isset($e['manager_id'])?(string)$e['manager_id']:null;$message=(string)$e['error'];$log->bind_param('isss',$run,$action,$key,$message);$log->execute();}$log->close();$n=count($errors);$finish=$db->prepare("UPDATE ingestion_runs SET status='failed',error_count=?,finished_at=NOW() WHERE run_id=?");$finish->bind_param('ii',$n,$run);$finish->execute();$finish->close();}
