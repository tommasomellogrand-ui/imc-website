'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let csrf='',report=null,limit=100,serial=0;
adminWorldSelect();
async function request(action,body=null){
 const response=await fetch('api.php'+(body?'':'?'+new URLSearchParams({action,world:$('world').value})),{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)}:{})});
 const result=await response.json();adminWorldNames(result.world_names);
 if(!response.ok||!result.ok){if(response.status===401){$('workspace').hidden=true;$('login').hidden=false;$('logout').hidden=true;}throw Error(result.error||'Controllo non riuscito.');}return result;
}
async function overview(){
 const r=await request('transfers-overview');
 $('overview').innerHTML=r.worlds.map(w=>`<button class="tc-world" data-world="${esc(w.world)}"><strong>${esc(w.world)} · ${esc(w.name)}</strong><span>${Number(w.total)} trasferimenti</span><span>${Number(w.certified)} certificati · ${Number(w.pending)} da normalizzare</span></button>`).join('');
}
function render(){
 if(!report)return;
 const s=report.summary,counts=[['Trasferimenti',s.total],['Certificati',s.certified],['Non normalizzati',s.pending],['Confermati dal Codex',s.confirmed],['Certificati da verificare',s.history_unconfirmed],['Scarti importo fino a 1k',s.small_amount_difference],['Codex assente',s.codex_missing],['Righe duplicate',s.duplicates],['Righe da verificare',s.issues]];
 $('summary').innerHTML=counts.map(([label,n])=>`<div class="panel"><div class="muted">${esc(label)}</div><div class="tc-number">${n}</div></div>`).join('');
 $('check-count').textContent=`${report.rows.length} righe da verificare${report.rows.length>limit?' · prime '+limit:''}. Una cronologia mancante o non aggiornata non prova che il trasferimento sia errato.`;
 $('issues').innerHTML=report.rows.slice(0,limit).map(r=>`<details class="tc-issue"><summary><strong>${esc(r.player)} · #${esc(r.number)} · IMC Season ${esc(r.season)}</strong><p>${esc(r.from)} → ${esc(r.to)} · ${esc(r.amount)} · ${esc(r.date||'Data non normalizzata')}</p><p class="tc-note">${r.issues.map(esc).join(' · ')}</p></summary><p>Player ID ${esc(r.player_id)} · Stato ${esc(r.status||'Non normalizzato')}</p><p>Ultimo import Codex: ${esc(r.codex_updated_at||'Non disponibile')}</p>${r.candidate_dates.length?`<p>Movimenti compatibili: ${r.candidate_dates.map(esc).join('; ')}</p>`:''}${r.source?`<p>Cronologia: ${esc(r.source.date)} · ${esc(r.source.club_from)} → ${esc(r.source.club_to)} · ${esc(r.source.consideration_raw||r.source.amount_text||'Scambio')}</p>`:''}</details>`).join('')||'<p>Nessuna incongruenza rilevata nei dati disponibili.</p>';
 $('more').hidden=report.rows.length<=limit;
}
async function run(){
 const id=++serial;$('run').disabled=true;$('message').textContent='Controllo trasferimenti e cronologie…';
 try{const r=await request('transfers-check');if(id!==serial)return;report=r;limit=100;render();$('checked').textContent='Controllato il '+new Intl.DateTimeFormat('it-IT',{dateStyle:'short',timeStyle:'medium',timeZone:'Europe/Rome'}).format(new Date(r.checked_at));$('message').textContent='Controllo completato. Nessun dato modificato.';}catch(e){if(id===serial){report=null;$('summary').replaceChildren();$('issues').replaceChildren();$('checked').textContent='';$('message').textContent=e.message;}}finally{if(id===serial)$('run').disabled=false;}
}
async function enter(){ $('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;await overview();if($('world').selectedOptions[0]?.disabled){$('world').value=[...$('world').options].find(o=>!o.disabled)?.value||'IMC001';}await run();}
$('overview').addEventListener('click',e=>{const b=e.target.closest('[data-world]');if(b){$('world').value=b.dataset.world;$('world').dispatchEvent(new Event('change'));}});
$('world').addEventListener('change',()=>run());$('run').addEventListener('click',()=>run());$('reload').addEventListener('click',async()=>{try{await overview();await run();}catch(e){$('message').textContent=e.message;}});$('more').addEventListener('click',()=>{limit+=100;render();});
$('logout').addEventListener('click',async()=>{try{await request('',{action:'logout'});location.reload();}catch(e){$('message').textContent=e.message;}});
$('login-form').addEventListener('submit',async e=>{e.preventDefault();$('login-submit').disabled=true;try{const r=await request('',{action:'login',username:$('login-username').value,password:$('login-password').value});csrf=r.csrf;$('login-password').value='';await enter();}catch(err){$('message').textContent=err.message;}finally{$('login-submit').disabled=false;}});
(async()=>{const access=new URLSearchParams(location.hash.slice(1)).get('access');if(access)history.replaceState(null,'',location.pathname+location.search);try{const r=access?await request('',{action:'login',access_token:access}):await request('session');csrf=r.csrf;await enter();}catch(e){$('message').textContent=e.message;}})();
