<?php
header('Cache-Control: no-store, max-age=0');
if(isset($_GET['area'])){ ?>
<?php
session_name('imc_one_guest');
session_start(['use_strict_mode'=>1,'cookie_path'=>'/imc_campus/one/','cookie_secure'=>true,'cookie_httponly'=>true,'cookie_samesite'=>'Lax']);
$_SESSION['guest'] ??= strtoupper(bin2hex(random_bytes(6)));
$_SESSION['token'] ??= bin2hex(random_bytes(24));
$guest=$_SESSION['guest'];
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
        echo json_encode(['online'=>$online,'rows'=>$rows],JSON_THROW_ON_ERROR);
    }catch(Throwable $e){error_log('ONE guest area: '.$e->getMessage());http_response_code(503);echo '{}';}
    exit;
}
?>
<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#173a34"><title>ONE · Area ospiti</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f5ef;color:#182d29;font:16px Inter,system-ui,sans-serif}header{background:#173a34;color:white;padding:max(22px,env(safe-area-inset-top)) max(6vw,20px) 20px}header a{color:#d2e6dc}h1{font-size:36px;margin:16px 0 6px}main,nav{max-width:720px;margin:auto;padding:18px}details{margin:0 0 16px;padding:12px;background:white}summary{cursor:pointer}nav{position:sticky;bottom:0;display:flex;background:#fff;border-top:1px solid #ccc;padding-bottom:max(12px,env(safe-area-inset-bottom))}button{font:inherit;cursor:pointer;padding:12px;border:0;border-radius:5px}nav button{flex:1;background:white}button[aria-pressed=true],form button{background:#173a34;color:white}textarea{width:100%;padding:12px;font:inherit;margin:7px 0;border:1px solid #a9b8af;border-radius:5px}article{background:white;padding:14px;margin:8px 0}article p{white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:0}small{color:#50675e}body{min-height:100dvh;display:flex;flex-direction:column}main{width:100%;flex:1}nav{width:100%}
</style><header><a href="./">‹ Reception</a><h1>ONE</h1>Accesso ospite · <?=htmlspecialchars($guest)?></header><main>
<details><summary id="count">Online ora</summary><ul id="people"></ul></details>
<h2 id="title">Chat</h2><form id="form"><label for="body">Messaggio pubblico</label><textarea id="body" required maxlength="1000" rows="2"></textarea><button>Invia</button></form><p role="status" id="status"></p><div id="feed"></div></main>
<nav aria-label="Area ONE"><button data-view="chat">Chat</button><button data-view="board">Bacheca</button><button data-view="inbox">Inbox</button></nav>
<script>
const get=id=>document.getElementById(id), headers={'X-One-Token':<?=json_encode($_SESSION['token'])?>};
let view='chat';
const buttons=[...document.querySelectorAll('[data-view]')];
async function refresh(){
 const current=view;
 try{
  const res=await fetch('?area&api='+(current==='inbox'?'online':current),{headers});
  if(!res.ok)throw Error();
  const data=await res.json();
  if(current!==view)return;
  get('count').textContent='Online ora · '+data.online.length;
  get('people').replaceChildren(...data.online.map(name=>{const li=document.createElement('li');li.textContent='Ospite '+name;return li}));
  if(current==='inbox')return;
  get('feed').replaceChildren(...data.rows.map(row=>{
   const item=document.createElement('article'),meta=document.createElement('small'),body=document.createElement('p');
   meta.textContent='Ospite '+row.guest+' · '+new Date(row.ts*1000).toLocaleString('it-IT');body.textContent=row.body;item.append(meta,body);return item;
  }));
  get('status').textContent=data.rows.length?'':current==='chat'?'Scrivi il primo messaggio.':'La bacheca è ancora vuota.';
 }catch{if(current===view)get('status').textContent='Connessione non disponibile. Riprovo tra poco.'}
}
function select(button){
 view=button.dataset.view;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 get('title').textContent=button.textContent;get('form').hidden=view==='inbox';get('feed').replaceChildren();
 get('status').textContent=view==='inbox'?'La casella personale sarà disponibile con il tuo accesso manager.':'';
 get('body').value='';refresh();
}
buttons.forEach(b=>b.onclick=()=>select(b));select(buttons[0]);
get('form').onsubmit=async e=>{
 e.preventDefault();const button=e.target.querySelector('button'),current=view;button.disabled=true;
 try{const res=await fetch('?area&api='+current,{method:'POST',headers,body:new URLSearchParams({body:get('body').value})});
 if(!res.ok)throw Error(res.status===429?'Attendi qualche secondo prima di inviare.':'Invio non riuscito. Riprova.');
 if(current===view)get('body').value='';await refresh();
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
<a class="passport" href="?area" aria-label="Scansiona IMC Passport"></a>
</div></main></body></html>
