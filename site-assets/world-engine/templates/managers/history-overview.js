(() => {
 'use strict';

 const states = new WeakMap();
 const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[character]
 );
 const formatDate = value => {
  const day = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day.split('-').reverse().join('/') : '';
 };

 function stop(root) {
  states.get(root)?.abort();
  states.delete(root);
 }

 function metrics(stats) {
  const items = [
   ['Partite', stats.played], ['Vittorie', stats.won], ['Pareggi', stats.drawn],
   ['Sconfitte', stats.lost], ['Gol fatti', stats.gf], ['Gol subiti', stats.ga],
   ['Differenza reti', stats.gd], ['Vittorie %', (stats.win_pct ?? 0) + '%']
  ];
  return '<div class="kpis history-kpis">' + items.map(([label, value]) =>
   '<div class="kpi"><b>' + escape(value) + '</b><span>' + label + '</span></div>'
  ).join('') + '</div>';
 }

 function matchRow(match) {
  const meta = [
   formatDate(match.match_date), match.competition_name, match.competition_stage,
   match.competition_round, match.competition_group_name
  ].filter(Boolean);
  const detail = [];
  if (match.penalty_home_score != null && match.penalty_away_score != null) {
   detail.push('Rigori ' + match.penalty_home_score + '–' + match.penalty_away_score);
  }
  if (match.aggregate_home_score != null && match.aggregate_away_score != null) {
   detail.push('Aggregato ' + match.aggregate_home_score + '–' + match.aggregate_away_score);
  }
  return '<article class="history-match">' +
   '<p class="history-match-meta">' + escape([...new Set(meta)].join(' · ')) + '</p>' +
   '<div class="history-match-score"><span>' + escape(match.home.name) + '</span><strong>' +
   escape(match.home_score) + '–' + escape(match.away_score) + '</strong><span>' +
   escape(match.away.name) + '</span></div>' +
   (detail.length ? '<p class="muted">' + escape(detail.join(' · ')) + '</p>' : '') +
   '</article>';
 }

 function render(root, data, scope) {
  const relevant = (data.matches || []).filter(match => !scope || match.scope === scope);
  const seasons = (data.seasons || []).filter(season => !scope || season[scope].played);
  if (!relevant.length) {
   root.innerHTML = '<p class="card empty">Nessun risultato disponibile.</p>';
   return;
  }

  root.innerHTML = '<div class="history-block">' +
   '<div class="history-heading"><h2>Riepilogo</h2><label>Stagione ' +
   '<select data-history-season><option value="">Tutte</option>' +
   seasons.map(item => '<option value="' + escape(item.season) + '">Stagione ' +
    escape(item.season) + '</option>').join('') + '</select></label></div>' +
   '<div data-history-stats></div></div>' +
   '<section class="history-block history-matches"><h2 data-history-title></h2>' +
   '<div data-history-matches></div><button type="button" data-history-more>Mostra altre partite</button></section>';

  const select = root.querySelector('[data-history-season]');
  const statsView = root.querySelector('[data-history-stats]');
  const title = root.querySelector('[data-history-title]');
  const list = root.querySelector('[data-history-matches]');
  const more = root.querySelector('[data-history-more]');
  let matches = relevant;
  let shown = 0;

  function append() {
   const next = matches.slice(shown, shown + 25);
   list.insertAdjacentHTML('beforeend', next.map(matchRow).join(''));
   shown += next.length;
   more.hidden = shown >= matches.length;
  }

  function update() {
   const season = seasons.find(item => String(item.season) === select.value);
   const block = season || data.global;
   const stats = block[scope || 'stats'];
   matches = season ? relevant.filter(match => Number(match.imc_season) === season.season) : relevant;
   statsView.innerHTML = metrics(stats);
   title.textContent = 'Partite · ' + matches.length;
   list.replaceChildren();
   shown = 0;
   append();
  }

  select.addEventListener('change', update);
  more.addEventListener('click', append);
  update();
 }

 async function mount(root, {world, kind, id, scope}) {
  stop(root);
  const controller = new AbortController();
  states.set(root, controller);
  root.innerHTML = '<p class="card empty" role="status">Caricamento risultati…</p>';
  try {
   const query = new URLSearchParams({world, kind, id, mode:'overview'});
   const response = await fetch('/site-data/h2h/index.php?' + query, {
    cache:'no-store', signal:controller.signal
   });
   const data = await response.json();
   if (!response.ok || !data.ok || data.source !== 'Results') throw Error('Risultati temporaneamente non disponibili.');
   if (!controller.signal.aborted) render(root, data, scope);
  } catch (error) {
   if (controller.signal.aborted) return;
   root.innerHTML = '<div class="card empty">Risultati temporaneamente non disponibili. ' +
    '<button type="button" class="history-retry">Riprova</button></div>';
   root.querySelector('.history-retry').addEventListener('click', () => mount(root, {world, kind, id, scope}));
  }
 }

 window.NexusHistory = {mount, stop};
})();
