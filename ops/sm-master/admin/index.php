<?php
declare(strict_types=1);
require __DIR__.'/core.php';
if(session_status()!==PHP_SESSION_ACTIVE)session_start();
if(isset($_GET['token'])){
    try{smm_require_auth();header('Location: ./');exit;}catch(Throwable $e){}
}
try{smm_require_auth();}catch(Throwable $e){http_response_code(403);?><!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>IMC SM Master</title><body style="font-family:system-ui;padding:40px;background:#101114;color:#fff"><h1>Accesso negato</h1></body><?php exit;}
?><!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IMC | SM MASTER DATABASE</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#0d0f12;color:#f5f6f7;margin:0;padding:24px}main{max-width:900px;margin:auto}.card{background:#171a1f;border:1px solid #2c313a;border-radius:18px;padding:20px;margin:16px 0}h1{font-size:26px}h2{font-size:18px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:650px){.row{grid-template-columns:1fr}}button{background:#fff;color:#111;border:0;border-radius:12px;padding:12px 16px;font-weight:700}input,select{width:100%;box-sizing:border-box;background:#0f1115;color:#fff;border:1px solid #353b45;border-radius:10px;padding:12px;margin:6px 0 12px}pre{white-space:pre-wrap;background:#0a0c0f;padding:14px;border-radius:12px;max-height:360px;overflow:auto}.ok{color:#7ef0a8}.bad{color:#ff8585}progress{width:100%;height:20px}</style></head><body><main>
<h1>IMC | SM MASTER DATABASE</h1><p>Importer globale Soccer Manager + SoccerWiki. Nessun dato Game World.</p>
<div class="card"><h2>1. Data snapshot</h2><input id="date" type="date" value="2026-09-03"></div>
<div class="row"><div class="card"><h2>2A. Soccer Manager XML</h2><input id="smfile" type="file" accept=".xml,text/xml"><button onclick="runFile('soccer_manager','smfile')">Carica e importa XML</button><progress id="smp" value="0" max="100"></progress></div>
<div class="card"><h2>2B. SoccerWiki JSON</h2><input id="swfile" type="file" accept=".json,application/json"><button onclick="runFile('soccerwiki','swfile')">Carica e importa JSON</button><progress id="swp" value="0" max="100"></progress></div></div>
<div class="card"><h2>3. Master canoniche</h2><button onclick="rebuild()">Ricostruisci master e verifica conteggi</button></div>
<div class="card"><h2>Log</h2><pre id="log">Pronto.</pre></div>
<script>
const log=(x)=>{document.getElementById('log').textContent+='\n'+(typeof x==='string'?x:JSON.stringify(x,null,2));};
async function api(action,form){form=form||new FormData();form.append('action',action);const r=await fetch('api.php',{method:'POST',body:form});const j=await r.json();if(!j.ok)throw new Error(j.error||'Errore');return j;}
async function runFile(kind,inputId){try{const file=document.getElementById(inputId).files[0];if(!file)throw new Error('Seleziona il file.');const p=document.getElementById(kind==='soccer_manager'?'smp':'swp');p.value=0;let f=new FormData();f.append('kind',kind);f.append('filename',file.name);f.append('size',file.size);let init=await api('upload_init',f);const chunkSize=512*1024;let index=0;for(let off=0;off<file.size;off+=chunkSize){let c=new FormData();c.append('upload_id',init.upload_id);c.append('index',index++);c.append('chunk',file.slice(off,Math.min(off+chunkSize,file.size)),'chunk.bin');await api('upload_chunk',c);p.value=Math.round(Math.min(off+chunkSize,file.size)/file.size*70);}let done=new FormData();done.append('upload_id',init.upload_id);let up=await api('upload_complete',done);log(kind+' upload OK '+up.sha256);p.value=75;let imp=new FormData();imp.append('upload_id',init.upload_id);imp.append('snapshot_date',document.getElementById('date').value);let res=await api('import',imp);p.value=100;log(res);}catch(e){log('ERRORE: '+e.message);}}
async function rebuild(){try{log('Ricostruzione master...');log(await api('rebuild'));}catch(e){log('ERRORE: '+e.message);}}
(async()=>{try{log(await api('status'));}catch(e){log('Status error: '+e.message);}})();
</script></main></body></html>
