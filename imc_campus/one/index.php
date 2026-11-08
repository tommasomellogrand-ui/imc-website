<?php
header('Cache-Control: no-store, max-age=0');
if(isset($_GET['area']) || isset($_GET['access'])){
session_name('imc_one_guest');
session_start(['use_strict_mode'=>1,'cookie_path'=>'/imc_campus/one/','cookie_secure'=>true,'cookie_httponly'=>true,'cookie_samesite'=>'Lax']);
$_SESSION['guest'] ??= strtoupper(bin2hex(random_bytes(6)));
$_SESSION['token'] ??= bin2hex(random_bytes(24));
require_once dirname(__DIR__,2).'/nexus/core/bootstrap.php';
require_once __DIR__.'/manager-access.php';
if(isset($_GET['access'])){ ?>
<?php
header('Referrer-Policy: no-referrer');
$activate=$_GET['access']==='activate';
$error='';
if($_SERVER['REQUEST_METHOD']==='POST'){
    if(!hash_equals($_SESSION['token'],(string)($_POST['csrf']??''))){http_response_code(403);exit('Sessione scaduta. Riapri la pagina.');}
    if($_GET['access']==='logout'){$_SESSION=[];session_destroy();header('Location: ./',true,303);exit;}
    try{
        $password=(string)($_POST['password']??'');
        if($activate && ($password!==($_POST['confirm']??'') || strlen($password)<12 || strlen($password)>72)){
            $error='Scegli una password di almeno 12 caratteri (massimo 72 byte) e ripetila uguale.';
        }elseif(one_authenticate(nexus_db(nexus_config(),'core'),strtoupper(trim((string)($_POST['manager']??''))),$password,$activate?(string)($_POST['invite']??''):null)){
            header('Location: ?area',true,303);exit;
        }else{$error=$activate?'Invito scaduto, già usato o non valido.':'Accesso non riuscito. Verifica le credenziali o riprova più tardi.';}
    }catch(Throwable $e){http_response_code(503);$error='Servizio temporaneamente non disponibile.';}
}
?><!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ONE · IMC Passport</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:linear-gradient(#221a17a8,#201817d9),url(reception.webp) center/cover;color:#29241e;font:16px Inter,system-ui}main{width:min(90%,390px);padding:26px;background:#f5efdf;border-top:3px solid #b19057}label,input{display:block;width:100%}label{margin:16px 0}input,button{font:inherit;padding:12px;border:1px solid #a79779;border-radius:4px}button{background:#392f25;color:white;width:100%}a{color:#514637;display:inline-block;margin-top:18px}h1{font-size:25px}</style>
<main><small>ONE · IMC Passport</small><h1><?=$activate?'Scegli la tua password':'Accesso manager'?></h1><form method="post">
<input type="hidden" name="csrf" value="<?=htmlspecialchars($_SESSION['token'])?>">
<label>Manager ID<input name="manager" required autocomplete="username" <?=$activate?'value="MNG001" readonly':'placeholder="MNG001"'?>></label>
<label>Password<input name="password" required type="password" autocomplete="<?=$activate?'new-password':'current-password'?>" <?=$activate?'minlength="12"':''?>></label>
<?php if($activate):?><label>Ripeti password<input type="password" name="confirm" required autocomplete="new-password"></label><small>Almeno 12 caratteri.</small><input name="invite" type="hidden" id="invite"><script>let key=location.hash.slice(1);if(key){sessionStorage.setItem('one-invite',key);history.replaceState(null,'',location.pathname+location.search)}document.getElementById('invite').value=sessionStorage.getItem('one-invite')||'';</script><?php endif;?>
<p role="status"><?=htmlspecialchars($error)?></p><button><?=$activate?'Salva ed entra in ONE':'Entra in ONE'?></button></form><a href="?area">Continua come ospite</a></main></html>
<?php exit; }
$guest=$_SESSION['guest'];
$identity='';
if(isset($_SESSION['manager'])){
    $id=$_SESSION['manager'];
    $db=nexus_db(nexus_config(),'core');
    $q=$db->prepare('SELECT auth_version FROM `IMC ONE Accounts` WHERE manager_id=?');
    $q->execute([$id]);
    $ver=$q->fetchColumn();
    $identity=one_manager($db,$id);
    if(!$identity || $ver===false || (int)$ver!==$_SESSION['version']){
        $_SESSION=[];session_destroy();
        if(isset($_GET['api'])){http_response_code(401);exit('{}');}
        header('Location: ?access=login');exit;
    }
    $guest=$id;
}
if(isset($_GET['api'])){
    header('Content-Type: application/json; charset=utf-8');
    try {
        require_once dirname(__DIR__,2).'/nexus/core/bootstrap.php';
        $db=nexus_db(nexus_config(),'core');
        $table='`IMC ONE Guest Activity`';
        $post=$_SERVER['REQUEST_METHOD']==='POST';
        if(!hash_equals($_SESSION['token'],$_SERVER['HTTP_X_ONE_TOKEN']??'')){http_response_code(403);exit('{}');}
        $channel=$_GET['api'];
        if(!in_array($channel,['chat','board','online'],true)){http_response_code(400);exit('{}');}
        if($post){
            $body=trim((string)($_POST['body']??''));
            if($channel==='online'||$body===''||mb_strlen($body)>1000){http_response_code(422);exit('{}');}
            if(time()-($_SESSION['posted']??0)<3){http_response_code(429);exit('{}');}
            $db->prepare("INSERT INTO $table (guest,channel,body) VALUES (?,?,?)")->execute([$guest,$channel,$body]);
            $_SESSION['posted']=time();
        }
        if(time()-($_SESSION['seen']??0)>=20){
            $db->prepare("INSERT INTO $table (guest,channel,presence_key) VALUES (?,'online',?) ON DUPLICATE KEY UPDATE seen=CURRENT_TIMESTAMP")->execute([$guest,$guest]);
            $_SESSION['seen']=time();
        }
        $online=$db->query("SELECT guest FROM $table WHERE channel='online' AND seen>=CURRENT_TIMESTAMP - INTERVAL 65 SECOND ORDER BY guest")->fetchAll(PDO::FETCH_COLUMN);
        $rows=[];
        if($channel!=='online'){
            $read=$db->prepare("SELECT guest,body,UNIX_TIMESTAMP(seen) AS ts FROM $table WHERE channel=? ORDER BY id DESC LIMIT 100");
            $read->execute([$channel]);
            $rows=$read->fetchAll();
        }
        $latest=$channel==='board' ? ($rows[0]['body']??'') : $db->query("SELECT LEFT(body,90) FROM $table WHERE channel='board' ORDER BY id DESC LIMIT 1")->fetchColumn();
        $names=[];
        $profile=$db->query("SELECT a.manager_id,(SELECT m.full_name FROM `IMC Manager Assignment Global` m WHERE m.manager_id=a.manager_id ORDER BY m.start_date DESC LIMIT 1) name FROM `IMC ONE Accounts` a WHERE a.activated_at IS NOT NULL");
        $names=$profile->fetchAll(PDO::FETCH_KEY_PAIR);
        echo json_encode(['names'=>(object)$names,'latest'=>(string)$latest,'online'=>$online,'rows'=>$rows],JSON_THROW_ON_ERROR);
    }catch(Throwable $e){error_log('ONE guest area: '.$e->getMessage());http_response_code(503);echo '{}';}
    exit;
}
?>
<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#173a34"><title>ONE · Area ospiti</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#261e19;color:#33291e;font:16px Inter,system-ui,sans-serif}
.room{height:100vh;height:100dvh;display:grid;place-items:center;overflow:hidden}.scene{position:relative;width:min(100vw,51.37dvh);aspect-ratio:899/1750;container-type:inline-size}.scene img{display:block;width:100%;height:100%}
@media(max-width:700px) and (orientation:portrait){.scene{width:100vw;height:100dvh}.scene img{object-fit:fill}}
.spot{position:absolute;background:transparent;border:0;cursor:pointer;min-height:26px}.spot:focus-visible{outline:3px solid white}
.back{left:0;top:39%;width:13%;height:9%}.board{left:13%;top:36%;width:22%;height:15%}.chat{left:43%;top:56%;width:27%;height:3.5%}.online{left:46%;top:59.2%;width:22%;height:2.2%;min-height:0;background:#29272a;color:white;font:500 2.4cqw Inter,system-ui;transform:skew(-7deg)}.online:before{content:'● ';color:#44df64}.inbox{left:65%;top:67%;width:32%;height:11%}
dialog{width:min(100%,620px);max-width:100%;max-height:84dvh;margin:auto auto 0;border:0;border-radius:18px 18px 0 0;background:#f7f4ed;color:inherit;padding:20px 20px max(20px,env(safe-area-inset-bottom));overflow:auto}dialog::backdrop{background:#21190f70}dialog[open]{animation:rise .2s ease-out}@keyframes rise{from{transform:translateY(20%)}}@media(prefers-reduced-motion:reduce){dialog[open]{animation:none}}
.bar{display:flex;align-items:center;justify-content:space-between}.bar h2{margin:0}.bar button,form button{border:0;padding:12px;border-radius:6px;cursor:pointer;font:inherit}.bar button{background:#e8e1d4}form button{background:#44392e;color:white}textarea{display:block;width:100%;margin:8px 0;padding:12px;font:inherit}article{background:white;padding:12px;margin:8px 0}article p{white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:0}small{color:#625545}details{margin:16px 0}

#preview{position:absolute;left:13%;right:10%;top:35%;height:49%;padding:8% 3%;overflow:hidden;background:linear-gradient(115deg,#d7bc98,#e3cba9);color:#2c2016;font:600 2.25cqw/1.18 Inter,system-ui;overflow-wrap:anywhere;transform:rotate(-2deg)}
dialog.wall{inset:0;margin:0;width:100%;height:100dvh;max-width:none;max-height:none;border:7px ridge #aa8756;border-radius:0;padding:0;background:linear-gradient(115deg,#39302a,#221e1b 70%,#302722);color:#fff5e1}
.wall[open]{display:flex;flex-direction:column}.wall .bar{padding:max(18px,env(safe-area-inset-top)) 18px 16px;border-bottom:1px solid #94734c}.wall .bar button{order:-1;color:#34291e}.wall .bar h2{font:600 1.5rem Georgia,serif}.wall #feed{overflow:auto;flex:1;padding:0 20px 20px}.wall article,.wall #form{position:relative;margin:18px auto;padding:33px 20px 18px;max-width:550px;background:linear-gradient(114deg,#f9f1dd,#e8dabe);box-shadow:1px 5px 12px #0006;color:#33291e}.wall article:before,.wall article:after{content:'';position:absolute;top:10px;width:8px;height:8px;border-radius:50%;background:radial-gradient(at 30% 25%,#ffdfa0,#94703e 65%);box-shadow:1px 2px 3px #5e452e}.wall article:before{left:12px}.wall article:after{right:12px}.wall article p{margin:0 0 14px;line-height:1.5}.wall #status{margin:8px 20px}.wall footer{padding:12px 16px max(12px,env(safe-area-inset-bottom));text-align:center}.wall footer button{background:#ebd7ae;border:0;border-radius:4px;color:#34291e;padding:14px 24px;font:600 1rem Inter,system-ui}.wall #form{width:min(90%,550px);padding:18px}.wall textarea{background:transparent;color:inherit;border:1px solid #ab9877}.wall [hidden]{display:none}
</style><?php if($identity):?><form method="post" action="?access=logout" style="position:fixed;z-index:2;top:8px;right:8px"><input type="hidden" name="csrf" value="<?=htmlspecialchars($_SESSION['token'])?>"><button><?=htmlspecialchars($identity)?> · Esci</button></form><script>sessionStorage.removeItem('one-invite')</script><?php endif;?><main class="room"><div class="scene"><img src="lounge-one.webp" width="899" height="1750" alt="Salotto ONE sul lago con lo stemma IMC all’ingresso">
<a class="spot back" href="./" aria-label="Torna alla reception"></a>
<button class="spot board" data-view="board" aria-label="Bacheca"><span id="preview" hidden></span></button>
<button class="spot chat" data-view="chat" aria-label="Chat"></button>
<button class="spot online" data-view="online" aria-label="Ospiti online" id="live">… online</button>
<button class="spot inbox" data-view="inbox" aria-label="Inbox"></button></div></main>
<dialog id="panel" aria-labelledby="title"><div class="bar"><h2 id="title"></h2><button id="close">Torna alla sala</button></div>
<details id="presence"><summary id="count">Online ora</summary><ul id="people"></ul></details>
<form id="form"><label for="body">Messaggio pubblico</label><textarea id="body" required maxlength="1000" rows="2"></textarea><button>Invia</button></form><p role="status" id="status"></p><div id="feed"></div><footer id="actions" hidden><button id="write">+ Scrivi un avviso</button></footer></dialog>
<script>
const get=id=>document.getElementById(id), headers={'X-One-Token':<?=json_encode($_SESSION['token'])?>};
let view='online';
const buttons=[...document.querySelectorAll('[data-view]')];
async function refresh(){
 const current=view;
 try{
  const res=await fetch('?area&api='+(current==='inbox'?'online':current),{headers});
  if(res.status===401){location.replace('?access=login');return}if(!res.ok)throw Error();
  const data=await res.json();
  if(current!==view)return;
  const preview=get('preview');preview.textContent=(data.latest||'').trim().split(/\r?\n/)[0].slice(0,55);preview.hidden=!preview.textContent;
  get('live').textContent=data.online.length+' online';
  get('count').textContent='Online ora · '+data.online.length;
  get('people').replaceChildren(...data.online.map(name=>{const li=document.createElement('li');li.textContent=data.names?.[name]||'Ospite '+name;return li}));
  if(current==='inbox'||current==='online')return;
  get('feed').replaceChildren(...data.rows.map(row=>{
   const item=document.createElement('article'),meta=document.createElement('small'),body=document.createElement('p');
   meta.textContent=(data.names?.[row.guest]||'Ospite '+row.guest)+' · '+new Date(row.ts*1000).toLocaleString('it-IT');body.textContent=row.body;if(current==='board')item.append(body,meta);else item.append(meta,body);return item;
  }));
  get('status').textContent=data.rows.length?'':current==='chat'?'Scrivi il primo messaggio.':'La bacheca è ancora vuota.';
 }catch{if(current===view)get('status').textContent='Connessione non disponibile. Riprovo tra poco.'}
}
function select(button){
 view=button.dataset.view;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 get('panel').showModal();get('presence').open=view==='online';get('title').textContent=button.getAttribute('aria-label');get('form').hidden=['online','inbox'].includes(view);get('feed').replaceChildren();
 get('status').textContent=view==='inbox'?'La casella personale sarà disponibile con il tuo accesso manager.':'';
 const board=view==='board';
 get('panel').classList.toggle('wall',board);get('actions').hidden=!board;get('presence').hidden=board;
 get('close').textContent=board?'‹ Sala':'Torna alla sala';
 get('form').querySelector('label').textContent=board?'Il tuo avviso':'Messaggio pubblico';
 get('form').querySelector('button').textContent=board?'Affiggi':'Invia';
 if(board){get('title').textContent='Bacheca ONE';get('form').hidden=true;}
 get('body').value='';refresh();
}
get('write').onclick=()=>{get('form').hidden=false;get('actions').hidden=true;get('body').focus()};
buttons.forEach(b=>b.onclick=()=>select(b));get('close').onclick=()=>get('panel').close();get('panel').onclose=()=>{view='online';refresh()};refresh();
get('form').onsubmit=async e=>{
 e.preventDefault();const button=e.target.querySelector('button'),current=view;button.disabled=true;
 try{const res=await fetch('?area&api='+current,{method:'POST',headers,body:new URLSearchParams({body:get('body').value})});
 if(!res.ok)throw Error(res.status===429?'Attendi qualche secondo prima di inviare.':'Invio non riuscito. Riprova.');
 if(current===view){get('body').value='';if(view==='board'){get('form').hidden=true;get('actions').hidden=false;get('feed').scrollTop=0;get('write').focus()}}await refresh();
 }catch(err){get('status').textContent=err.message}finally{button.disabled=false}
};
setInterval(()=>{if(!document.hidden)refresh()},10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
</script></html>
<?php exit; }
?>
<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#292726"><title>ONE · Reception IMC</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#292726}
main{height:100vh;height:100dvh;display:grid;place-items:center}
.scene{position:relative;width:min(100vw,46.15vh);width:min(100vw,46.15dvh)}
img{width:100%;height:auto;display:block}
a{position:absolute;display:block;min-height:44px}
.back{left:1%;top:0;width:26%}
.passport{left:24%;top:44%;width:56%;height:14%}
a:focus-visible{outline:3px solid ivory;outline-offset:-3px;border-radius:8px}
@media (max-width:767px), (pointer:coarse) and (max-height:600px){
  main{display:flex;align-items:flex-start;justify-content:center;width:100%;height:100vh;height:100dvh;overflow-x:hidden;overflow-y:auto}
  .scene{flex:none;width:max(100%,calc(100vh * 852 / 1846));width:max(100%,calc(100dvh * 852 / 1846))}
}
</style></head><body><main aria-label="Reception di ONE"><div class="scene">
<img src="/imc_campus/one/reception.webp" width="852" height="1846" alt="Reception di ONE sul lago">
<a class="back" href="/imc_campus/" aria-label="Torna al Campus"></a>
<a class="passport" href="?access=login" aria-label="Scansiona IMC Passport"></a>
</div></main></body></html>
