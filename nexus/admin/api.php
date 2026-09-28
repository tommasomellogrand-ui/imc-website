<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/assignments-service.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
ini_set('session.use_strict_mode','1');
session_name('nexus_admin');
session_set_cookie_params(['lifetime'=>0,'path'=>'/nexus/admin/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
session_start();
try {
    $method=$_SERVER['REQUEST_METHOD']??'GET';
    if (!in_array($method,['GET','POST'],true)) nexus_out(['ok'=>false,'error'=>'Metodo non consentito.'],405);
    $input=[];
    if ($method==='POST') {
        if (($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site') nexus_out(['ok'=>false,'error'=>'Richiesta non consentita.'],403);
        if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE']??''),'application/json')) nexus_out(['ok'=>false,'error'=>'Formato non valido.'],415);
        $input=json_decode(file_get_contents('php://input',false,null,0,16384),true,16,JSON_THROW_ON_ERROR);
        if (!is_array($input)) throw new InvalidArgumentException('Richiesta non valida.');
    }
    $action=$method==='POST'?($input['action']??'save'):($_GET['action']??'list');
    if ($action==='login' && $method==='POST') {
        // Reuse the existing private administrator credential, never the public import token.
        if (isset($input['access_token'])) {
            $provided=$input['access_token'];
            $expected=require __DIR__.'/access-link.php';
            $valid=is_string($provided) && strlen($provided)>=40 && hash_equals($expected,hash('sha256',$provided));
        } else {
        $file=dirname(__DIR__,2).'/__imc_private_sm_master/config.php';
        if (!is_file($file)) throw new RuntimeException('Configurazione admin non disponibile.',503);
        $cfg=require $file;$expected=(string)($cfg['admin_token']??'');
        $provided=$input['key']??'';
        $valid=$expected!=='' && is_string($provided) && hash_equals($expected,$provided);
        }
        if (!$valid) {
            usleep(350000);nexus_out(['ok'=>false,'error'=>'Chiave amministratore non valida.'],401);
        }
        session_regenerate_id(true);
        $_SESSION=['authenticated_at'=>time(),'csrf'=>bin2hex(random_bytes(32))];
        nexus_out(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    if (empty($_SESSION['authenticated_at']) || time()-(int)$_SESSION['authenticated_at']>7200) {
        $_SESSION=[];nexus_out(['ok'=>false,'error'=>'Accedi come amministratore.'],401);
    }
    if ($method==='POST' && !hash_equals((string)($_SESSION['csrf']??''),(string)($_SERVER['HTTP_X_CSRF_TOKEN']??''))) nexus_out(['ok'=>false,'error'=>'Sessione non valida. Ricarica la pagina.'],403);
    if ($action==='logout' && $method==='POST') {$_SESSION=[];session_destroy();nexus_out(['ok'=>true]);}
    if ($action==='session' && $method==='GET') nexus_out(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
    if ($method==='POST' && !in_array($action,['save','close','replace'],true)) throw new InvalidArgumentException('Operazione non valida.');
    $gw=nexus_world($method==='GET'?($_GET['world']??''):($input['world']??''));
    $db=nexus_db(nexus_config(),'core');
    if ($method==='GET' && $action==='list') {
        $rows=nexus_rows($db,'SELECT * FROM '.NA_TABLE.' WHERE game_world_id=? ORDER BY full_name,start_date DESC,id DESC',[$gw]);
        foreach ($rows as &$row) $row['version']=na_version($row);
        unset($row);
        nexus_out(['ok'=>true,'rows'=>$rows,'teams'=>na_options($db,$gw),'managers'=>nexus_rows($db,'SELECT manager_id,full_name FROM `IMC Manager Codex Global` ORDER BY full_name'),'today'=>(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d')]);
    }
    if ($method==='POST') nexus_out(['ok'=>true,'row'=>na_save($db,$gw,$input)]);
    throw new InvalidArgumentException('Operazione non valida.');
} catch (InvalidArgumentException|JsonException $e) {nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}
catch (Throwable $e) {error_log('Nexus admin: '.$e->getMessage());$code=in_array($e->getCode(),[409,503],true)?$e->getCode():500;nexus_out(['ok'=>false,'error'=>$code===500?'Impossibile completare l’operazione. Nessuna modifica confermata.':$e->getMessage()],$code);}
