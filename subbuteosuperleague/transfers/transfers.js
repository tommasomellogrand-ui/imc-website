(()=>{'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rows=[],shown=60,loading=false,loaded=false;
$('search').value=params.get('q')||'';
function remember(){const p=new URLSearchParams();for(const [id,key] of [['search','q'],['club','club'],['season','season']])if($(id).value)p.set(key,$(id).value);history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));}
function render(){
 const q=$('search').value.trim().toLocaleLowerCase('it'),club=$('club').value,season=$('season').value;
 const filtered=rows.filter(r=>(!q||[r.player_name,r.club_from,r.club_to,r.player_id].some(v=>String(v??'').toLocaleLowerCase('it').includes(q)))&&(!club||r.club_from===club||r.club_to===club)&&(!season||String(r.imc_season??r.normalized_season??r.season)===season));
 $('count').textContent=filtered.length+' trasferimenti';
 $('list').innerHTML=filtered.length?'<div class="transfer-grid">'+filtered.slice(0,shown).map(NexusCards.transfer).join('')+'</div>':'<p class="summary-line">Nessun trasferimento disponibile per questi filtri.</p>';
 $('load-more').hidden=shown>=filtered.length;NexusCards.wireImages($('list'));
}
function options(id,values,label,prefix=''){const current=loaded?$(id).value:params.get(id)||'';$(id).innerHTML='<option value="">'+label+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+prefix+esc(v)+'</option>').join('');if(values.includes(current))$(id).value=current;}
async function refresh(){
 if(loading)return;loading=true;$('retry').hidden=true;
 try{const r=await fetch('data.php',{cache:'no-store'}),d=await r.json();if(!r.ok||d.ok!==true||d.game_world_id!=='GW011'||!Array.isArray(d.rows))throw Error('data');
 rows=d.rows;window.updateClubTransferSummary(rows);
 options('club',[...new Set(rows.flatMap(r=>[r.club_from,r.club_to]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it')),'Tutti i club');
 options('season',[...new Set(rows.map(r=>String(r.imc_season??r.normalized_season??r.season??'')).filter(Boolean))].sort((a,b)=>Number(b)-Number(a)),'Tutte le stagioni','Stagione ');
 loaded=true;render();$('updated').textContent='Ultimo aggiornamento: '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'});
 }catch(e){$('retry').hidden=false;if(!loaded){document.getElementById('club-summary').textContent='Trasferimenti non disponibili.';$('count').textContent='Dati non disponibili';$('list').innerHTML='<p class="summary-line">Impossibile caricare i trasferimenti. Riprova tra poco.</p>';}else $('updated').textContent='Aggiornamento non riuscito: restano visibili i dati precedenti.';}
 finally{loading=false;}
}
for(const id of ['search','club','season'])$(id).addEventListener(id==='search'?'input':'change',()=>{shown=60;remember();render();});
$('load-more').onclick=()=>{shown+=60;render();};$('retry').onclick=refresh;
refresh();setInterval(()=>{if(!document.hidden)refresh();},60000);
})();
