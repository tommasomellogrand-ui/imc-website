(function () {
  'use strict';

  const ROOT = '/gameworld001/';
  const WORLD_ID = 'GW001';
  const state = { world: null, matches: null };

  const staticSections = {
    'road-chronicle': { title: 'THE ROAD CHRONICLE', sub: 'Road To History Official Journal', icon: '▤', intro: 'Il giornale ufficiale di Road To History.', status: 'Feed non ancora alimentato dalla Public Read API.' },
    'team-hub': { title: 'TEAM HUB', sub: 'Club · Nazionali', icon: '◉', intro: 'Squadre, rose e percorsi nel mondo.', status: 'Schede club non ancora disponibili nella Public Read API.' },
    managers: { title: 'MANAGERS', sub: 'IMC · External', icon: '♙', intro: 'I manager presenti in Road To History.', status: 'Dataset manager non ancora collegato.' },
    codex: { title: 'CODEX', sub: 'Archivio del GW', icon: '▥', intro: 'Giocatori, record e memoria storica del mondo.', status: 'Player Codex non disponibile per GW001.' },
    transfers: { title: 'TRANSFERS', sub: 'Mercato del GW', icon: '⇄', intro: 'Movimenti di mercato e dettagli delle operazioni.', status: 'Importazione in corso · Coming soon.' }
  };

  const app = document.querySelector('#app');
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

  function routeParts() {
    return location.pathname.replace(ROOT, '').split('/').filter(Boolean);
  }

  function formatDate(value) {
    if (!value) return 'DATA NON DISPONIBILE';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).toUpperCase();
  }

  function worldName() {
    return state.world?.name || 'Road To History';
  }

  function seasonNumber() {
    return Number(state.world?.season?.imc_season || 1);
  }

  function competitionName(competition) {
    if (competition?.name) return competition.name;
    if (competition?.type && competition?.division_value) return `${competition.type} ${competition.division_value}`;
    return competition?.type || 'Competizione non disponibile';
  }

  function matchHref(match) {
    return `${ROOT}matches/${encodeURIComponent(match.fixture_id)}/`;
  }

  function matchState(match) {
    if (match.result) return 'RISULTATO';
    if (match.availability?.schedule) return 'CALENDARIO';
    return String(match.status || 'MATCH').toUpperCase();
  }

  function scoreMarkup(match) {
    if (!match.result) return '<span class="match-time">—</span>';
    return `<strong class="score">${esc(match.result.home_score)}<i>—</i>${esc(match.result.away_score)}</strong>`;
  }

  function worldHeader() {
    const world = state.world;
    const season = world.season;
    return `<section class="world-head">
      <p>IMC SEASON <b>SEASON ${esc(season.imc_season)}</b><time>${esc(season.start_date)} → ${esc(season.end_date)}</time></p>
      <div><span>${esc(world.game_world_id)}</span><i></i><strong>${esc(world.name)}</strong><small>SEASON ${esc(season.imc_season)} · INIZIO ${esc(season.start_date)} · FINE ${esc(season.end_date)}</small></div>
    </section>`;
  }

  function hubCard(key, title, sub, icon, wide = false, badge = '') {
    return `<a class="hub-card ${wide ? 'wide' : ''}" href="${ROOT}${key}/"><div>${badge ? `<small class="data-badge">${esc(badge)}</small>` : ''}<h2>${esc(title)}</h2><p>${esc(sub)}</p></div><b>${icon}</b></a>`;
  }

  function home() {
    const datasets = state.world.datasets;
    return `${worldHeader()}<section class="hub-grid">
      ${hubCard('road-chronicle', 'THE ROAD CHRONICLE', 'Road To History Official Journal', '▤', true)}
      ${hubCard('competitions', 'COMPETITIONS', `${state.world.summary.competition_count} competizioni`, '♜', false, 'MYSQL LIVE')}
      ${hubCard('calendar', 'CALENDAR', `${datasets.schedule.fixture_count} fixture`, '◷', false, 'SCHEDULE')}
      ${hubCard('results', 'RESULTS', `${datasets.results.fixture_count} risultati`, '≡', false, 'RESULTS')}
      ${hubCard('team-hub', 'TEAM HUB', 'Club · Nazionali', '◉')}
      ${hubCard('managers', 'MANAGERS', 'IMC · External', '♙')}
      ${hubCard('codex', 'CODEX', datasets.player_codex.available ? 'Dataset disponibile' : 'Non disponibile', '▥')}
      ${hubCard('transfers', 'TRANSFERS', 'Importazione in corso', '⇄')}
    </section>`;
  }

  function pageHead(title, sub, icon, back = ROOT) {
    return `<section class="section-page"><a class="back" href="${back}" aria-label="Indietro">←</a><p class="eyebrow">${esc(WORLD_ID)} · ${esc(worldName()).toUpperCase()}</p><div class="section-title"><span>${icon}</span><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div></div>`;
  }

  function dataSummary() {
    const datasets = state.world.datasets;
    return `<div class="data-summary">
      <div><strong>${esc(state.world.summary.fixture_count)}</strong><span>FIXTURE</span></div>
      <div><strong>${esc(datasets.results.fixture_count)}</strong><span>RISULTATI</span></div>
      <div><strong>${esc(datasets.schedule.fixture_count)}</strong><span>CALENDARIO</span></div>
      <div><strong>${esc(datasets.match_reports.fixture_count)}</strong><span>REPORT</span></div>
    </div>`;
  }

  function competitionKey(match) {
    return String(match.competition?.world_competition_row_id ?? `type:${competitionName(match.competition)}`);
  }

  function competitionGroups() {
    const groups = new Map();
    state.matches.forEach(match => {
      const key = competitionKey(match);
      if (!groups.has(key)) groups.set(key, { key, competition: match.competition, matches: [], results: 0, scheduled: 0, reports: 0 });
      const group = groups.get(key);
      group.matches.push(match);
      if (match.result) group.results += 1;
      if (match.availability?.schedule) group.scheduled += 1;
      if (match.availability?.match_report) group.reports += 1;
    });
    return [...groups.values()].sort((a, b) => competitionName(a.competition).localeCompare(competitionName(b.competition), 'it', { numeric: true }));
  }

  function competitions() {
    const cards = competitionGroups().map(group => `<a class="competition-card" href="${ROOT}competitions/${encodeURIComponent(group.key)}/">
      <div><small>${esc(String(group.competition?.type || 'competition').toUpperCase())}</small><h2>${esc(competitionName(group.competition))}</h2></div>
      <dl><div><dt>Match</dt><dd>${group.matches.length}</dd></div><div><dt>Risultati</dt><dd>${group.results}</dd></div><div><dt>Report</dt><dd>${group.reports}</dd></div></dl><b>→</b>
    </a>`).join('');
    return `${pageHead('COMPETITIONS', 'Dati reali · Season 1', '♜')}${dataSummary()}<div class="view-switch"><a href="${ROOT}calendar/">CALENDAR</a><a href="${ROOT}results/">RESULTS</a></div><div class="competition-list">${cards}</div></section>`;
  }

  function matchCard(match) {
    return `<a class="match-card" href="${matchHref(match)}">
      <div class="match-meta"><span>${esc(matchState(match))}</span><time>${esc(formatDate(match.date))}${match.time ? ` · ${esc(match.time)}` : ''}</time></div>
      <div class="match-score"><div><strong>${esc(match.home?.name)}</strong><strong>${esc(match.away?.name)}</strong></div>${scoreMarkup(match)}</div>
      <div class="match-foot"><span>${esc(competitionName(match.competition))}</span><span>${match.availability?.match_report ? 'MATCH REPORT →' : 'DETTAGLIO →'}</span></div>
    </a>`;
  }

  function matchListPage(kind, groupKey = null) {
    let rows = state.matches;
    let title = 'MATCHES';
    let sub = 'Fixture reali · Season 1';
    let icon = '≡';
    let back = ROOT;

    if (groupKey != null) {
      rows = rows.filter(match => competitionKey(match) === groupKey);
      title = competitionName(rows[0]?.competition);
      sub = `${rows.length} fixture · Season ${seasonNumber()}`;
      back = `${ROOT}competitions/`;
    } else if (kind === 'calendar') {
      rows = rows.filter(match => match.availability?.schedule);
      title = 'CALENDAR';
      sub = `${rows.length} fixture SCHEDULE`;
      icon = '◷';
    } else if (kind === 'results') {
      rows = rows.filter(match => match.result);
      title = 'RESULTS';
      sub = `${rows.length} risultati`;
    }

    const content = rows.length ? rows.map(matchCard).join('') : '<div class="empty-state"><strong>NESSUN MATCH DISPONIBILE</strong><span>Il database non contiene fixture per questa vista.</span></div>';
    return `${pageHead(title, sub, icon, back)}<div class="match-list">${content}</div></section>`;
  }

  function staticSection(key) {
    const section = staticSections[key] || staticSections.codex;
    return `${pageHead(section.title, section.sub, section.icon)}<p class="intro">${esc(section.intro)}</p><div class="empty-state"><strong>${key === 'transfers' ? 'COMING SOON' : 'NON ANCORA DISPONIBILE'}</strong><span>${esc(section.status)}</span></div></section>`;
  }

  function statValue(value) {
    return value == null || value === '' ? '—' : esc(value);
  }

  function matchDetailShell(match) {
    return `${pageHead('MATCH DETAIL', competitionName(match.competition), '▤', `${ROOT}results/`)}
      <article class="detail-score"><div class="match-meta"><span>${esc(matchState(match))}</span><time>${esc(formatDate(match.date))}${match.time ? ` · ${esc(match.time)}` : ''}</time></div><div class="detail-teams"><strong>${esc(match.home?.name)}</strong>${scoreMarkup(match)}<strong>${esc(match.away?.name)}</strong></div><small>FIXTURE ID ${esc(match.fixture_id)}</small></article>
      <div id="report"><div class="loading-inline"><span></span>CARICAMENTO MATCH REPORT</div></div></section>`;
  }

  function statsTable(report) {
    const home = report.team_stats?.home || {};
    const away = report.team_stats?.away || {};
    const rows = [['Possesso', 'possession'], ['Tiri', 'shots'], ['Tiri in porta', 'shots_on_target'], ['Corner', 'corners'], ['Falli', 'fouls'], ['Fuorigioco', 'offside']];
    return `<section class="report-block"><h2>STATISTICHE</h2><div class="stats-table">${rows.map(([label, key]) => `<div><strong>${statValue(home[key])}</strong><span>${label}</span><strong>${statValue(away[key])}</strong></div>`).join('')}</div></section>`;
  }

  function lineupSide(side, lineup) {
    const players = lineup?.players || [];
    return `<div class="lineup-side"><header><strong>${esc(side)}</strong><span>${esc(lineup?.formation || '—')}</span></header>${players.map(player => `<div><span>${esc(player.slot_order)}</span><strong>${esc(player.player_name || `Player ${player.player_id}`)}</strong><small>${player.is_substitute ? 'SUB' : statValue(player.rating)}</small></div>`).join('')}</div>`;
  }

  function lineupsBlock(match, report) {
    return `<section class="report-block"><h2>LINEUPS</h2><div class="lineups">${lineupSide(match.home?.name, report.lineups?.home)}${lineupSide(match.away?.name, report.lineups?.away)}</div></section>`;
  }

  function eventsBlock(report) {
    const events = report.events || [];
    return `<section class="report-block"><h2>EVENTI</h2>${events.length ? `<div class="timeline">${events.map(event => `<div><time>${statValue(event.minute)}'</time><strong>${esc(String(event.event_type || 'EVENT').toUpperCase())}</strong><span>${event.player_id ? `PLAYER ${esc(event.player_id)}` : ''}</span></div>`).join('')}</div>` : '<p class="block-empty">Nessun evento disponibile.</p>'}</section>`;
  }

  function commentaryBlock(report) {
    const commentary = report.commentary || [];
    return `<section class="report-block"><h2>COMMENTARY</h2>${commentary.length ? `<div class="commentary">${commentary.map(item => `<p><time>${statValue(item.minute)}'</time><span>${esc(item.text)}</span></p>`).join('')}</div>` : '<p class="block-empty">Cronaca non disponibile.</p>'}</section>`;
  }

  function tacticsBlock(report) {
    const tactics = report.tactics || [];
    return `<section class="report-block"><h2>TATTICHE</h2>${tactics.length ? `<div class="tactics">${tactics.map(item => `<div><span>${esc(item.side)}</span><strong>${esc(item.formation || '—')}</strong><time>DAL ${statValue(item.minute_from)}'</time></div>`).join('')}</div>` : '<p class="block-empty">Tattiche non disponibili.</p>'}</section>`;
  }

  function renderReport(payload) {
    const target = document.querySelector('#report');
    if (!target) return;
    const match = payload.match;
    const report = payload.match_report;
    if (!report?.available) {
      target.innerHTML = '<div class="empty-state"><strong>MATCH REPORT NON DISPONIBILE</strong><span>Per questa fixture sono visualizzati soltanto i dati esistenti.</span></div>';
      return;
    }
    target.innerHTML = `${statsTable(report)}${lineupsBlock(match, report)}${eventsBlock(report)}${commentaryBlock(report)}${tacticsBlock(report)}`;
  }

  function errorPage(message) {
    return `<section class="section-page"><a class="back" href="${ROOT}">←</a><div class="error-state"><strong>DATI NON DISPONIBILI</strong><span>${esc(message)}</span><button type="button" data-retry>RIPROVA</button></div></section>`;
  }

  function setActiveNav(route) {
    const active = route === 'calendar' || route === 'competitions' ? 'competitions' : route === 'results' || route === 'matches' ? 'results' : 'home';
    document.querySelectorAll('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === active));
  }

  async function start() {
    try {
      const worldPayload = await IMCDataService.getWorld(WORLD_ID, 1);
      state.world = worldPayload.data;
      document.title = `${WORLD_ID} · ${state.world.name} | Italian Masters Club`;

      const parts = routeParts();
      const route = parts[0] || 'home';
      setActiveNav(route);

      if (route === 'home') {
        app.innerHTML = home();
        return;
      }
      if (staticSections[route]) {
        app.innerHTML = staticSection(route);
        return;
      }

      if (route === 'matches' && parts[1]) {
        const detailPayload = await IMCDataService.getMatch(WORLD_ID, parts[1]);
        const match = detailPayload.data.match;
        app.innerHTML = matchDetailShell(match);
        renderReport(detailPayload.data);
        return;
      }

      const matchesPayload = await IMCDataService.getAllMatches(WORLD_ID, seasonNumber());
      state.matches = matchesPayload.data;

      if (route === 'competitions' && parts[1]) app.innerHTML = matchListPage('competition', decodeURIComponent(parts[1]));
      else if (route === 'competitions') app.innerHTML = competitions();
      else if (route === 'calendar') app.innerHTML = matchListPage('calendar');
      else if (route === 'results') app.innerHTML = matchListPage('results');
      else app.innerHTML = errorPage('Pagina non trovata.');
    } catch (error) {
      app.innerHTML = errorPage(error instanceof Error ? error.message : 'Errore imprevisto.');
      document.querySelector('[data-retry]')?.addEventListener('click', () => location.reload());
    }
  }

  start();
})();
