(() => {
'use strict';
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
const euros = new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0});
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
  const money = amount => amount === null ? 'Da verificare' : euros.format(amount);
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