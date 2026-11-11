(() => {
'use strict';
const millionFormat = new Intl.NumberFormat('it-IT', {maximumFractionDigits: 1});
function formatMillions(amount) {
 return millionFormat.format(amount / 1000000) + ' M €';
}
function transferFee(row) {
 const raw = String(row.amount_text ?? '').normalize('NFKC').trim().toLowerCase();
 const value = raw.replace(/^(?:euro|eur|[€£$])\s*|\s*(?:euro|eur|[€£$])$/g, '').trim();
 if (/^(?:gratis|gratuito|free(?: transfer)?|(?:a )?parametro\s*zero|svincolato|scambio|player exchange)$/.test(value)) return 0;
 const match = /^([\d][\d.,'’\s]*)(milioni|milione|mln\.?|millions?|mil|m|mila|mille|thousand|k)?$/.exec(value);
 if (!match) return null;
 const unit = match[2];
 const multiplier = !unit ? 1 : /^(?:k|mila|mille|thousand)$/.test(unit) ? 1000 : 1000000;
 let number = match[1].trim().replace(/['’\s]/g, '');
 if (number.includes('.') && number.includes(',')) {
  if (/^\d{1,3}(?:\.\d{3})+,\d+$/.test(number)) number = number.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(?:,\d{3})+\.\d+$/.test(number)) number = number.replace(/,/g, '');
  else return null;
 } else if (!unit && /^\d{1,3}([.,])\d{3}(?:\1\d{3})*$/.test(number)) {
  number = number.replace(/[.,]/g, '');
 } else {
  if (!/^\d+(?:[.,]\d+)?$/.test(number)) return null;
  number = number.replace(',', '.');
 }
 const amount = Math.round(Number(number) * multiplier);
 return Number.isSafeInteger(amount) ? amount : null;
}

function renderTransferCard(row) {
 const amount = transferFee(row);
 return NexusCards.transfer(amount === null ? row : {...row, amount_text: formatMillions(amount)});
}
window.renderMarketTransferCard = renderTransferCard;
const panel = document.getElementById('club-summary');
const details = document.getElementById('transfer-details');
const buttons = Array.from(document.querySelectorAll('[data-market-tab]'));
function select(index) {
 buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
 panel.hidden = index !== 0;
 details.hidden = index !== 1;
}
buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
select(location.search.length > 1 ? 1 : 0);
let directory;
window.updateClubTransferSummary = async function(rows) {
 try {
  directory ??= fetch('../clubs/directory.php', {cache:'no-store'}).then(async response => {
   const data = await response.json();
   if (!response.ok || !data.ok || !Array.isArray(data.rows)) throw Error();
   return data.rows;
  });
  const clubs = await directory;
  const names = new Map(), ids = new Map();
  const totals = clubs.map(club => {
   const entry = {club, purchases:0, sales:0, spent:0, received:0};
   ids.set(String(club.world_id), entry);
   names.set(club.name.trim().toLowerCase(), entry);
   return entry;
  });
  for (const row of rows) {
   const fee = transferFee(row);
   for (const [side,count,amount] of [['to','purchases','spent'], ['from','sales','received']]) {
    const id = row[side+'_sm_world_club_id'];
    const entry = id && Number(id)>0 ? ids.get(String(id)) : names.get(String(row['club_'+side]||'').trim().toLowerCase());
    if (!entry) continue;
    entry[count]++;
    if (entry[amount] !== null) entry[amount] = fee === null ? null : entry[amount]+fee;
   }
  }
  const table = document.createElement('table');
  const header = table.createTHead().insertRow();
  for (const label of ['Club','N. acquisti','N. cessioni','Valore acquisti','Valore cessioni','Saldo mercato']) {
   const th = document.createElement('th'); th.scope='col'; th.textContent=label; header.append(th);
  }
  const body = table.createTBody();
  const money = amount => amount === null ? 'Da verificare' : formatMillions(amount);
  totals.sort((a,b)=>a.club.name.localeCompare(b.club.name,'it'));
  for (const {club,purchases,sales,spent,received} of totals) {
   const row = body.insertRow(), cell = row.insertCell();
   if (/^https?:\/\//i.test(club.image_url || '')) {
    const img = document.createElement('img'); img.alt=''; img.src=club.image_url.replace(/^http:/i,'https:'); img.onerror=()=>img.hidden=true; cell.append(img);
   }
   cell.append(club.name);
   for (const value of [purchases,sales,money(spent),money(received),money(received === null || spent === null ? null : received-spent)]) row.insertCell().textContent=value;
  }
  panel.replaceChildren(table);
 } catch {
  directory = null;
  panel.textContent='Impossibile caricare il riepilogo dei club.';
 }
};
})();
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
 $('list').innerHTML=filtered.length?'<div class="transfer-grid">'+filtered.slice(0,shown).map(window.renderMarketTransferCard).join('')+'</div>':'<p class="summary-line">Nessun trasferimento disponibile per questi filtri.</p>';
 $('load-more').hidden=shown>=filtered.length;NexusCards.wireImages($('list'));
}
function options(id,values,label,prefix=''){const current=loaded?$(id).value:params.get(id)||'';$(id).innerHTML='<option value="">'+label+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+prefix+esc(v)+'</option>').join('');if(values.includes(current))$(id).value=current;}
async function refresh(){
 if(loading)return;loading=true;$('retry').hidden=true;
 try{const r=await fetch('data.php',{cache:'no-store'}),d=await r.json();if(!r.ok||d.ok!==true||d.game_world_id!=='GW005'||!Array.isArray(d.rows))throw Error('data');
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
