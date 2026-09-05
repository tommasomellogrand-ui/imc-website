<?php
declare(strict_types=1);
session_start();
$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['timezone']);
$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/auctions.json';
if (!is_dir($dataDir)) { mkdir($dataDir, 0775, true); }

function initialState(array $config): array {
    $now = time(); $deadline = strtotime($config['auction_ends_at']); $out = ['published_at' => $now, 'players' => []];
    foreach ($config['players'] as $id => $p) {
        $out['players'][$id] = ['status'=>'waiting','current'=>null,'first_bid_at'=>null,'ends_at'=>$deadline,'winner'=>null,'bid_count'=>0];
    }
    return $out;
}
function withState(string $file, array $config, ?callable $mutator = null): array {
    $fp = fopen($file, 'c+');
    if (!$fp) { throw new RuntimeException('Archivio offerte non disponibile.'); }
    flock($fp, LOCK_EX); rewind($fp); $raw = stream_get_contents($fp);
    $state = $raw ? json_decode($raw, true) : initialState($config);
    if (!is_array($state)) { $state = initialState($config); }
    if ($mutator) { $state = $mutator($state); ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($state, JSON_PRETTY_PRINT)); fflush($fp); }
    flock($fp, LOCK_UN); fclose($fp); return $state;
}
function normalizeState(array $state, array $config): array {
    $now = time();
    foreach ($state['players'] as $id => &$a) {
        if (in_array($a['status'], ['waiting','active'], true) && $now >= strtotime($config['auction_ends_at'])) $a['status'] = 'closed';
    }
    return $state;
}
function publicState(array $state, array $config): array {
    $state = normalizeState($state, $config); $out = [];
    foreach ($config['players'] as $id => $p) {
        $a = $state['players'][$id];
        $out[$id] = array_merge($p, ['id'=>$id,'status'=>$a['status'],'current'=>$a['current'],'ends_at'=>$a['ends_at'],'bid_count'=>$a['bid_count']]);
    }
    return ['server_time'=>time(),'published_at'=>$state['published_at'],'players'=>$out];
}

if (isset($_GET['api'])) {
    header('Content-Type: application/json; charset=utf-8');
    try {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            echo json_encode(['ok'=>true,'data'=>publicState(withState($dataFile,$config),$config)]); exit;
        }
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        if (!hash_equals($_SESSION['csrf'] ?? '', (string)($input['csrf'] ?? ''))) throw new RuntimeException('Sessione scaduta: ricarica la pagina.');
        $id = (string)($input['player'] ?? ''); $name = trim((string)($input['name'] ?? ''));
        $amount = (float)str_replace(',', '.', (string)($input['amount'] ?? '0'));
        if (!isset($config['players'][$id])) throw new RuntimeException('Giocatore non valido.');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 60) throw new RuntimeException('Inserisci il tuo nome o quello della squadra.');
        $state = withState($dataFile, $config, function(array $state) use ($id,$name,$amount,$config) {
            $state = normalizeState($state,$config); $a =& $state['players'][$id]; $p = $config['players'][$id];
            if (!in_array($a['status'], ['waiting','active'], true)) throw new RuntimeException('Questa asta non accetta più offerte.');
            $minimum = $a['current'] === null ? $p['base'] : round($a['current'] + 0.1, 1);
            if ($amount + 0.0001 < $minimum) throw new RuntimeException('Offerta minima: '.number_format($minimum,1,',','.').' ML.');
            $now=time(); if ($a['first_bid_at'] === null) { $a['first_bid_at']=$now; $a['ends_at']=strtotime($config['auction_ends_at']); $a['status']='active'; }
            $finalAmount=min($amount,(float)$p['buy_now']); $a['current']=$finalAmount; $a['bid_count']++;
            if ($amount >= $p['buy_now']) { $a['status']='sold'; $a['winner']=$name; $a['ends_at']=$now; }
            return $state;
        });
        echo json_encode(['ok'=>true,'message'=>$amount >= $config['players'][$id]['buy_now'] ? 'Acquisto immediato completato!' : 'Offerta registrata in modo riservato.','data'=>publicState($state,$config)]); exit;
    } catch (Throwable $e) { http_response_code(422); echo json_encode(['ok'=>false,'message'=>$e->getMessage()]); exit; }
}
$_SESSION['csrf'] = bin2hex(random_bytes(24));
$csrf = $_SESSION['csrf'];
?>
<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuova Asta di Mercato</title>
<style>
:root{--bg:#071019;--panel:#101c27;--panel2:#142534;--line:#294050;--text:#f4f7f8;--muted:#91a5b4;--cyan:#32d5e6;--blue:#176eff;--gold:#ffca5c;--green:#45df9b;--danger:#ff6a73}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,#153a53 0,transparent 34%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh}.wrap{max-width:1180px;margin:auto;padding:28px 20px 60px}header{display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center;margin-bottom:30px}.brand-logo{width:110px;height:110px;object-fit:contain;filter:drop-shadow(0 12px 24px #0008)}.host{display:flex;align-items:center;gap:13px;background:#0e202b;border:1px solid #2f5969;border-radius:18px;padding:9px 12px}.host img{width:68px;height:68px;border-radius:13px;object-fit:cover;object-position:center 18%;background:#fff}.host-name{font-weight:900;font-size:14px}.host-role{font-size:11px;color:var(--cyan);margin-top:3px;text-transform:uppercase;letter-spacing:.08em}.eyebrow{color:var(--cyan);font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.title{font-size:clamp(36px,5vw,64px);line-height:.92;margin:10px 0 0;letter-spacing:-.05em}.title span{color:var(--cyan)}.live{display:inline-block;margin-top:13px;border:1px solid #2f5969;border-radius:999px;padding:8px 12px;background:#0e202b;font-size:12px;white-space:nowrap}.dot{display:inline-block;width:8px;height:8px;background:var(--green);border-radius:50%;box-shadow:0 0 12px var(--green);margin-right:8px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.card{background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:20px;overflow:hidden;position:relative}.card-top{padding:22px 22px 16px;display:flex;justify-content:space-between;align-items:flex-start}.num{font:800 52px/1 Georgia,serif;color:#284252}.name{font-size:25px;font-weight:900;letter-spacing:-.03em;margin:5px 0 2px}.role{color:var(--cyan);font-size:13px;font-weight:800}.status{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;border-radius:99px;padding:7px 10px;background:#213544;color:#bad0dc}.status.active{background:#113b3e;color:#61f1d8}.status.sold{background:#423719;color:var(--gold)}.bio{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);background:#0c1821}.bio-item{padding:11px 9px;text-align:center;border-right:1px solid var(--line)}.bio-item:last-child{border:0}.bio-item b{display:block;font-size:13px}.bio-item span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;margin-top:3px}.wiki{padding:10px 22px;color:#a8bbc7;font-size:12px;border-top:1px solid var(--line)}.rating{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:12px;background:#0b7f27;color:#fff;font-size:22px;font-weight:900;margin-top:9px}.prices{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.price{padding:16px 22px}.price+ .price{border-left:1px solid var(--line)}.label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.value{font-size:23px;font-weight:900;margin-top:4px}.buy .value{color:var(--gold)}.bidbar{padding:18px 22px;display:flex;justify-content:space-between;align-items:center;gap:10px}.current strong{font-size:18px}.clock{text-align:right;color:var(--cyan);font-variant-numeric:tabular-nums;font-weight:800;font-size:14px}.btn{width:100%;border:0;border-radius:0;background:linear-gradient(90deg,var(--blue),#08a6d7);color:white;padding:16px;font-weight:900;font-size:14px;cursor:pointer}.btn:disabled{background:#263844;color:#8295a2;cursor:not-allowed}.rules{margin-top:22px;background:#0d1922;border:1px solid var(--line);border-radius:20px;padding:22px}.rules h2{margin:0 0 14px;font-size:18px}.rulegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.rule{display:flex;gap:11px;color:#bed0da;font-size:13px;line-height:1.5}.icon{color:var(--cyan);font-size:20px}.modal{display:none;position:fixed;inset:0;background:#02070bd9;z-index:10;place-items:center;padding:20px}.modal.open{display:grid}.dialog{width:min(450px,100%);background:#132431;border:1px solid #355063;border-radius:22px;padding:24px;box-shadow:0 30px 80px #000}.dialog-head{display:flex;justify-content:space-between}.dialog h2{margin:0}.close{border:0;background:transparent;color:white;font-size:28px;cursor:pointer}.field{margin-top:18px}.field label{display:block;color:#a9bdc9;font-size:12px;margin-bottom:7px}.field input{width:100%;background:#09151e;border:1px solid #365064;border-radius:11px;color:white;padding:14px;font-size:16px;outline:none}.field input:focus{border-color:var(--cyan)}.submit{margin-top:20px;width:100%;border:0;border-radius:12px;padding:15px;background:var(--cyan);color:#041116;font-weight:900;cursor:pointer}.hint{font-size:12px;color:var(--muted);margin-top:10px}.toast{position:fixed;right:20px;bottom:20px;max-width:360px;background:#14382f;border:1px solid #2c8f71;padding:14px 18px;border-radius:12px;display:none;z-index:20}.toast.error{background:#401e25;border-color:#a63c4a}.toast.show{display:block}@media(max-width:820px){header{grid-template-columns:80px 1fr}.brand-logo{width:80px;height:80px}.host{grid-column:1/-1}.grid{grid-template-columns:1fr}.rulegrid{grid-template-columns:1fr}.title{font-size:42px}.wrap{padding:22px 14px 40px}}
</style></head><body><main class="wrap"><header><img class="brand-logo" src="assets/logo-imc.png" alt="Logo IMC"><div><div class="eyebrow">IMC · Soccer Manager · Mercato</div><h1 class="title">NUOVA ASTA<br><span>SI PARTE!</span></h1><div class="live"><i class="dot"></i> Scadenza 19 agosto · ore 14:40</div></div><div class="host"><img src="assets/alessandro-berardi.jpeg" alt="Alessandro Berardi"><div><div class="label">Asta proposta da</div><div class="host-name">Alessandro Berardi</div><div class="host-role">Manager della Lazio</div></div></div></header><section id="grid" class="grid" aria-live="polite"></section><section class="rules"><h2>Come funziona</h2><div class="rulegrid"><div class="rule"><b class="icon">⚡</b><span>Raggiungi la clausola e acquisti subito il giocatore, senza attendere la fine.</span></div><div class="rule"><b class="icon">🔒</b><span>Il tuo nome resta privato. Gli altri vedono soltanto l’importo raggiunto.</span></div><div class="rule"><b class="icon">⏱</b><span>Tutte le aste terminano mercoledì 19 agosto 2026 alle 14:40, ora italiana.</span></div></div></section></main>
<div class="modal" id="modal"><form class="dialog" id="form"><div class="dialog-head"><div><div class="eyebrow">Offerta riservata</div><h2 id="modalTitle">Fai la tua offerta</h2></div><button class="close" type="button" aria-label="Chiudi">×</button></div><input type="hidden" name="player" id="player"><div class="field"><label for="name">Il tuo nome o squadra</label><input id="name" name="name" maxlength="60" required autocomplete="name" placeholder="Es. FC Tommy"></div><div class="field"><label for="amount">Importo in ML</label><input id="amount" name="amount" inputmode="decimal" required placeholder="0,0"></div><button class="submit" type="submit">CONFERMA OFFERTA</button><div class="hint" id="hint"></div></form></div><div id="toast" class="toast"></div>
<script>
const CSRF=<?=json_encode($csrf)?>; let state=null; const fmt=n=>Number(n).toLocaleString('it-IT',{maximumFractionDigits:1,minimumFractionDigits:Number(n)%1?1:0});
const labels={waiting:'In attesa',active:'Asta attiva',sold:'Venduto',closed:'Conclusa',withdrawn:'Ritirato'};
function clock(end){if(!end)return '48H SENZA OFFERTE';let s=Math.max(0,end-Math.floor(Date.now()/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function render(){const grid=document.querySelector('#grid');grid.innerHTML=Object.values(state.players).map((p,i)=>{const open=['waiting','active'].includes(p.status);return `<article class="card"><div class="card-top"><div><div class="name">${p.flag} ${p.name}</div><div class="role">${p.role}</div><div class="rating">${p.rating}</div></div><div><div class="status ${p.status}">${labels[p.status]}</div><div class="num">0${i+1}</div></div></div><div class="wiki">Soccer Wiki Club: <b>${p.wiki_club}</b> · Valore ${p.value} · Stipendio ${p.wage}</div><div class="bio"><div class="bio-item"><b>${p.age}</b><span>Età</span></div><div class="bio-item"><b>${p.birth}</b><span>Nascita</span></div><div class="bio-item"><b>${p.height} cm · ${p.weight} kg</b><span>Fisico</span></div><div class="bio-item"><b>${p.contract}</b><span>Contratto</span></div></div><div class="prices"><div class="price"><div class="label">Base d’asta</div><div class="value">${fmt(p.base)} ML</div></div><div class="price buy"><div class="label">Acquisto immediato</div><div class="value">${fmt(p.buy_now)} ML</div></div></div><div class="bidbar"><div class="current"><div class="label">Offerta attuale</div><strong>${p.current===null?'Nessuna':fmt(p.current)+' ML'}</strong></div><div class="clock" data-end="${p.ends_at||''}">${open?clock(p.ends_at):labels[p.status].toUpperCase()}</div></div><button class="btn" ${open?'':'disabled'} onclick="openBid('${p.id}')">${open?'FAI UN’OFFERTA':'ASTA CHIUSA'}</button></article>`}).join('')}
async function refresh(){const r=await fetch('?api=1');const j=await r.json();if(j.ok){state=j.data;render()}}
function openBid(id){const p=state.players[id];document.querySelector('#player').value=id;document.querySelector('#modalTitle').textContent='Offerta per '+p.name;const min=p.current===null?p.base:Math.round((p.current+.1)*10)/10;document.querySelector('#amount').value=String(min).replace('.',',');document.querySelector('#hint').textContent=`Minimo ${fmt(min)} ML · Clausola ${fmt(p.buy_now)} ML`;document.querySelector('#modal').classList.add('open');document.querySelector('#name').focus()}
function close(){document.querySelector('#modal').classList.remove('open')}document.querySelector('.close').onclick=close;document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')close()};
function toast(msg,error=false){const t=document.querySelector('#toast');t.textContent=msg;t.className='toast show'+(error?' error':'');setTimeout(()=>t.className='toast',4200)}
document.querySelector('#form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),body=Object.fromEntries(f);body.csrf=CSRF;const b=e.target.querySelector('.submit');b.disabled=true;try{const r=await fetch('?api=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),j=await r.json();if(!j.ok)throw new Error(j.message);state=j.data;render();close();toast(j.message);e.target.reset()}catch(err){toast(err.message,true)}finally{b.disabled=false}};
setInterval(()=>document.querySelectorAll('.clock[data-end]').forEach(x=>{if(x.dataset.end)x.textContent=clock(Number(x.dataset.end))}),1000);refresh();setInterval(refresh,30000);
</script></body></html>
