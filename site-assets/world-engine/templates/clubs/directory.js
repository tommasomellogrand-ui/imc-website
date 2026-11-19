(() => {
 'use strict';

 const list = document.getElementById('list');
 const search = document.getElementById('search');
 const summary = document.getElementById('summary');
 const retry = document.getElementById('retry');
 const supportsOverview = ['IMC001', 'IMC003', 'IMC004'].includes('__WORLD_ID__');
 const overview = supportsOverview && new URLSearchParams(location.search).get('view') !== 'clubs';
 const number = new Intl.NumberFormat('it-IT', {maximumFractionDigits:0});
 const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clubHref = (club, section) => '/__WORLD_SLUG__/club/'+section+'/?id='+encodeURIComponent(club.world_id);
 const clubImage = club => {
  const src = String(club.image_url || '').replace(/^http:/,'https:');
  return /^https:\/\//.test(src) ? '<img src="'+esc(src)+'" alt="" loading="lazy">' : '';
 };

 let rows = [];
 let sortBy = 'market_value';
 let sortDirection = 'descending';

 if (supportsOverview) {
  const nav = document.createElement('nav');
  nav.className = 'club-directory-tabs';
  nav.setAttribute('aria-label', 'Viste club');
  nav.innerHTML = '<a href="/__WORLD_SLUG__/clubs/"'+(overview?' aria-current="page"':'')+'>Roster Overview</a>'
   + '<a href="/__WORLD_SLUG__/clubs/?view=clubs"'+(!overview?' aria-current="page"':'')+'>Club</a>';
  document.querySelector('label[for="search"]').before(nav);

  const style = document.createElement('style');
  style.textContent = `
   .club-directory-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
   .club-directory-tabs a{border:1px solid var(--l,#d5dbe4);border-radius:8px;padding:8px 13px;text-decoration:none;color:inherit;font-size:13px;font-weight:700}
   .club-directory-tabs [aria-current]{color:white;background:#283c53;border-color:#283c53}
   .roster-overview{margin:16px 0 24px}
   .roster-overview table{width:100%;border-collapse:collapse;font-size:clamp(12px,2.6vw,14px)}
   .roster-overview th,.roster-overview td{padding:8px clamp(4px,1.3vw,14px);border-bottom:1px solid var(--l,#d5dbe4);text-align:right}
   .roster-overview th:first-child,.roster-overview td:first-child{text-align:left;width:55%}
   .roster-overview td{font-variant-numeric:tabular-nums}
   .roster-overview th button{font:inherit;font-weight:700;color:inherit;text-align:right;background:none;border:0;padding:4px 0;cursor:pointer}
   .roster-overview th[aria-sort=descending] button::after{content:' ↓'}
   .roster-overview th[aria-sort=ascending] button::after{content:' ↑'}
   .roster-overview a{display:flex;align-items:center;gap:8px;min-height:32px;text-decoration:none;color:inherit;font-weight:700;overflow-wrap:anywhere}
   .roster-overview a:hover{text-decoration:underline}
   .roster-overview img{width:28px;height:28px;object-fit:contain;flex-shrink:0}
   .roster-overview .roster-value-coverage{display:block;font-size:11px;color:var(--m,#576574)}
  `;
  document.head.append(style);
  if (overview) list.className = 'roster-overview';
 }

 function clubCards(clubs) {
  return clubs.map(club => {
   const manager = club.manager?.is_imc ? club.manager : null;
   const managerLink = manager ? '<a href="/__WORLD_SLUG__/managers/profile.html?manager='+encodeURIComponent(manager.manager_id)+'">'
    +esc(manager.full_name)+'</a>' : 'Nessun manager IMC assegnato';
   return '<article class="club-card"><a class="club-main" href="'+clubHref(club,'overview')+'">'
    +clubImage(club)+'<h2>'+esc(club.name)+'</h2></a><div class="club-manager">'+managerLink+'</div></article>';
  }).join('');
 }

 function overviewTable(clubs) {
  const direction = sortDirection === 'descending' ? -1 : 1;
  clubs.sort((a,b) => {
   const left = a.roster_summary[sortBy];
   const right = b.roster_summary[sortBy];
   if (left === null && right !== null) return 1;
   if (right === null && left !== null) return -1;
   return direction*(left-right) || a.name.localeCompare(b.name,'it');
  });
  const heading = (key,label) => '<th scope="col"'+(key===sortBy?' aria-sort="'+sortDirection+'"':'')+'>'
   +'<button type="button" data-sort="'+key+'">'+label+'</button></th>';
  const tableRows = clubs.map(club => {
   const {owned_count:count, valued_count:valued, market_value:value} = club.roster_summary;
   const coverage = valued < count ? '<small class="roster-value-coverage">Valore per '+valued+' su '+count+'</small>' : '';
   return '<tr><th scope="row"><a href="'+clubHref(club,'roster')+'">'+clubImage(club)+'<span>'+esc(club.name)+'</span></a></th>'
    +'<td>'+number.format(count)+'</td><td>'+(value===null?'—':number.format(value))+coverage+'</td></tr>';
  }).join('');
  return '<table aria-label="Roster Overview"><thead><tr><th scope="col">Club</th>'
   +heading('owned_count','Giocatori')+heading('market_value','Valore rosa')
   +'</tr></thead><tbody>'+tableRows+'</tbody></table>';
 }

 function render() {
  const query = search.value.trim().toLocaleLowerCase('it');
  const visible = rows.filter(club => [club.name,club.manager?.is_imc?club.manager.full_name:''].join(' ').toLocaleLowerCase('it').includes(query));
  summary.textContent = visible.length+' clubs · __WORLD_NAME__';
  list.innerHTML = visible.length ? (overview?overviewTable(visible):clubCards(visible)) : '<p class="empty">Nessun club trovato.</p>';
  list.querySelectorAll('img').forEach(img => img.onerror = () => img.hidden = true);
 }

 async function load() {
  retry.hidden = true;
  summary.textContent = overview ? 'Caricamento delle rose…' : 'Caricamento dei club…';
  try {
   const response = await fetch('directory.php'+(overview?'?view=roster':''),{cache:'no-store'});
   const data = await response.json();
   if (!response.ok || !data.ok || (overview && data.rows.some(club => !club.roster_summary))) throw Error();
   rows = data.rows || [];
   search.oninput = render;
   render();
  } catch {
   summary.textContent = overview ? 'Impossibile caricare le rose. Riprova.' : 'Impossibile caricare i club. Riprova.';
   retry.hidden = false;
  }
 }

 list.addEventListener('click', event => {
  const key = event.target.closest('[data-sort]')?.dataset.sort;
  if (!key) return;
  sortDirection = key === sortBy && sortDirection === 'descending' ? 'ascending' : 'descending';
  sortBy = key;
  render();
  list.querySelector('[data-sort="'+key+'"]').focus();
 });
 retry.onclick = load;
 load();
})();
