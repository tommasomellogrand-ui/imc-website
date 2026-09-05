(function () {
  'use strict';

  const ROOT = '/gameworld001/';
  const WORLD_ID = 'GW001';
  const state = { world: null, matches: null, matchesPromise: null, competitionFilter: 'all' };
  const MATCH_CACHE_KEY = 'imc:GW001:season1:matches:v1';

  const staticSections = {
    'road-chronicle': { title: 'THE ROAD CHRONICLE', sub: 'Road To History Official Journal', icon: 'journal', intro: 'Il giornale ufficiale di Road To History.', status: 'Feed non ancora alimentato dalla Public Read API.' },
    'team-hub': { title: 'TEAM HUB', sub: 'Club · Nazionali', icon: 'teams', intro: 'Squadre, rose e percorsi nel mondo.', status: 'Schede club non ancora disponibili nella Public Read API.' },
    managers: { title: 'MANAGERS', sub: 'IMC · External', icon: 'manager', intro: 'I manager presenti in Road To History.', status: 'Dataset manager non ancora collegato.' },
    codex: { title: 'CODEX', sub: 'Archivio del GW', icon: 'codex', intro: 'Giocatori, record e memoria storica del mondo.', status: 'Player Codex non disponibile per GW001.' },
    transfers: { title: 'TRANSFERS', sub: 'Mercato del GW', icon: 'transfers', intro: 'Movimenti di mercato e dettagli delle operazioni.', status: 'Importazione in corso · Coming soon.' }
  };

  const app = document.querySelector('#app');
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

  function icon(name) {
    const paths = {
      competitions: '<path d="M17 20h30v8c0 13-6 21-15 26-9-5-15-13-15-26v-8Z"/><path d="M17 25h-7c0 11 4 17 12 19M47 25h7c0 11-4 17-12 19M28 53h8v7H22h20"/>',
      calendar: '<rect x="12" y="15" width="40" height="38" rx="7"/><path d="M21 10v10M43 10v10M12 27h40M21 35h5M32 35h5M43 35h1M21 44h5M32 44h5"/>',
      results: '<rect x="13" y="12" width="38" height="42" rx="7"/><path d="M22 24h20M22 33h20M22 42h13"/><circle cx="19" cy="24" r="1"/>',
      journal: '<path d="M14 14h30a6 6 0 0 1 6 6v34H20a6 6 0 0 1-6-6V14Z"/><path d="M22 14v40M29 24h13M29 32h13M29 40h9"/>',
      teams: '<path d="M32 10 51 18v14c0 12-8 20-19 25-11-5-19-13-19-25V18l19-8Z"/><circle cx="25" cy="30" r="5"/><circle cx="39" cy="30" r="5"/><path d="M18 43c2-5 6-7 12-7M46 43c-2-5-6-7-12-7"/>',
      manager: '<circle cx="32" cy="23" r="10"/><path d="M14 54c2-13 8-19 18-19s16 6 18 19"/>',
      codex: '<path d="M13 16h16c4 0 7 3 7 7v33c0-4-3-7-7-7H13V16ZM51 16H35M51 16v33H35"/><path d="M20 25h9M20 33h9"/>',
      transfers: '<path d="M12 22h36M40 14l8 8-8 8M52 43H16M24 35l-8 8 8 8"/>'
    };
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${paths[name] || paths.results}</svg>`;
  }

  function routeParts() {
    return location.pathname.replace(ROOT, '').split('/').filter(Boolean);
  }

  function readMatchCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(MATCH_CACHE_KEY));
      if (!cached || !Array.isArray(cached.rows) || Date.now() - cached.savedAt > 5 * 60 * 1000) return null;
      return cached.rows;
    } catch (_) {
      return null;
    }
  }

  function writeMatchCache(rows) {
    try {
      sessionStorage.setItem(MATCH_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
    } catch (_) {
      // La cache e solo un'ottimizzazione: i dati restano quelli della Public Read API.
    }
  }

  function loadMatches() {
    if (state.matches) return Promise.resolve(state.matches);
    const cached = readMatchCache();
    if (cached) {
      state.matches = cached;
      return Promise.resolve(cached);
    }
    if (!state.matchesPromise) {
      state.matchesPromise = IMCDataService.getAllMatches(WORLD_ID, seasonNumber())
        .then(payload => {
          state.matches = payload.data;
          writeMatchCache(state.matches);
          return state.matches;
        })
        .finally(() => { state.matchesPromise = null; });
    }
    return state.matchesPromise;
  }

  function formatDate(value, long = false) {
    if (!value) return 'DATA NON DISPONIBILE';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('it-IT', long
      ? { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
      : { day: '2-digit', month: 'short', year: 'numeric' }).format(date).toUpperCase();
  }

  function worldName() {
    return state.world?.name || WORLD_ID;
  }

  function seasonNumber() {
    return Number(state.world?.season?.imc_season || 1);
  }

  function competitionName(competition) {
    if (competition?.name) return competition.name;
    if (competition?.type && competition?.division_value) return `${competition.type} ${competition.division_value}`;
    return competition?.type || 'Competizione non disponibile';
  }

  function competitionType(competition) {
    return String(competition?.type || 'other').toLowerCase();
  }

  function matchHref(match) {
    return `${ROOT}matches/${encodeURIComponent(match.fixture_id)}/`;
  }

  function matchState(match) {
    if (match.result) return 'FINAL';
    if (match.availability?.schedule) return 'UPCOMING';
    return String(match.status || 'MATCH').toUpperCase();
  }

  function scoreMarkup(match, compact = false) {
    if (!match.result) return `<span class="match-vs">${match.time ? esc(match.time) : 'VS'}</span>`;
    return `<strong class="match-score${compact ? ' compact' : ''}"><span>${esc(match.result.home_score)}</span><i>—</i><span>${esc(match.result.away_score)}</span></strong>`;
  }

  function worldHero() {
    const world = state.world;
    const season = world.season;
    return `<section class="world-hero">
      <div class="world-badge"><strong>${esc(world.game_world_id)}</strong><span>GAME WORLD</span></div>
      <div class="world-name"><small>THE IMC EXPERIENCE</small><h1>${esc(world.name)}</h1></div>
      <div class="world-season"><strong>SEASON ${esc(season.imc_season)}</strong><span>${esc(formatDate(season.start_date))}</span><i></i><span>${esc(formatDate(season.end_date))}</span></div>
    </section>`;
  }

  function metricStrip() {
    const datasets = state.world.datasets;
    return `<section class="metric-strip" aria-label="Riepilogo dati">
      <div><strong>${esc(state.world.summary.fixture_count)}</strong><span>FIXTURE</span></div>
      <div><strong>${esc(state.world.summary.competition_count)}</strong><span>COMPETITIONS</span></div>
      <div><strong>${esc(datasets.results.fixture_count)}</strong><span>RESULTS</span></div>
      <div><strong>${esc(datasets.match_reports.fixture_count)}</strong><span>REPORTS</span></div>
    </section>`;
  }

  function hubCard(key, title, sub, iconName, className, badge = '') {
    return `<a class="hub-card ${className}" href="${ROOT}${key}/">
      <div class="hub-copy">${badge ? `<small>${esc(badge)}</small>` : ''}<h2>${esc(title)}</h2><p>${esc(sub)}</p></div>
      <div class="hub-art">${icon(iconName)}</div><span class="hub-arrow">›</span>
    </a>`;
  }

  function home() {
    const datasets = state.world.datasets;
    return `<div class="page-stack">${worldHero()}${metricStrip()}<section class="hub-grid">
      ${hubCard('competitions', 'COMPETITIONS', `${state.world.summary.competition_count} competizioni`, 'competitions', 'hub-competitions', 'MYSQL LIVE')}
      ${hubCard('results', 'RESULTS', `${datasets.results.fixture_count} risultati`, 'results', 'hub-results', 'RESULTS')}
      ${hubCard('calendar', 'CALENDAR', `${datasets.schedule.fixture_count} fixture`, 'calendar', 'hub-calendar', 'SCHEDULE')}
      ${hubCard('road-chronicle', 'THE ROAD CHRONICLE', 'Road To History Official Journal', 'journal', 'hub-chronicle')}
      ${hubCard('team-hub', 'TEAM HUB', 'Club · Nazionali', 'teams', 'hub-team')}
      ${hubCard('managers', 'MANAGERS', 'IMC · External', 'manager', 'hub-managers')}
      ${hubCard('codex', 'CODEX', datasets.player_codex.available ? 'Dataset disponibile' : 'Non disponibile', 'codex', 'hub-codex')}
      ${hubCard('transfers', 'TRANSFERS', 'Coming soon', 'transfers', 'hub-transfers')}
    </section></div>`;
  }

  function pageHead(title, sub, iconName, back = ROOT) {
    return `<header class="page-head">
      <a class="page-back" href="${back}" aria-label="Indietro">‹</a>
      <div><small>${esc(WORLD_ID)} · ${esc(worldName()).toUpperCase()}</small><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
      <span class="page-icon">${icon(iconName)}</span>
    </header>`;
  }

  function viewTabs(active) {
    return `<nav class="view-tabs" aria-label="Viste match">
      <a class="${active === 'competitions' ? 'active' : ''}" href="${ROOT}competitions/">COMPETITIONS</a>
      <a class="${active === 'calendar' ? 'active' : ''}" href="${ROOT}calendar/">CALENDAR</a>
      <a class="${active === 'results' ? 'active' : ''}" href="${ROOT}results/">RESULTS</a>
    </nav>`;
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

  function competitionCard(group) {
    const type = competitionType(group.competition);
    const progress = group.matches.length ? Math.round((group.results / group.matches.length) * 100) : 0;
    return `<a class="competition-card" data-competition-type="${esc(type)}" href="${ROOT}competitions/${encodeURIComponent(group.key)}/">
      <div class="competition-mark">${icon('competitions')}</div>
      <div class="competition-copy"><small>${esc(type.toUpperCase())}</small><h2>${esc(competitionName(group.competition))}</h2><span>${esc(group.matches.length)} FIXTURE</span></div>
      <dl><div><dt>RESULTS</dt><dd>${esc(group.results)}</dd></div><div><dt>UPCOMING</dt><dd>${esc(group.scheduled)}</dd></div><div><dt>REPORTS</dt><dd>${esc(group.reports)}</dd></div></dl>
      <div class="competition-progress"><i style="width:${esc(progress)}%"></i></div><b>›</b>
    </a>`;
  }

  function competitions() {
    const groups = competitionGroups();
    const types = [...new Set(groups.map(group => competitionType(group.competition)))].sort();
    const filters = ['all', ...types].map(type => `<button type="button" data-comp-filter="${esc(type)}" class="${type === state.competitionFilter ? 'active' : ''}">${type === 'all' ? 'TUTTE' : esc(type.toUpperCase())}</button>`).join('');
    return `<section class="section-page">${pageHead('COMPETITIONS', `${groups.length} competizioni reali · Season ${seasonNumber()}`, 'competitions')}${viewTabs('competitions')}
      <section class="competition-hero"><div><small>COMPETITION HUB</small><strong>${esc(groups.length)}</strong><span>ACTIVE COMPETITIONS</span></div><div><b>${esc(state.world.summary.fixture_count)}</b><span>TOTAL FIXTURES</span></div></section>
      <div class="filter-pills">${filters}</div>
      <div class="competition-list">${groups.map(competitionCard).join('')}</div>
    </section>`;
  }

  function matchCard(match) {
    return `<a class="match-card" href="${matchHref(match)}">
      <div class="match-top"><span>${esc(matchState(match))}</span><small>${esc(competitionName(match.competition))}</small>${match.availability?.match_report ? '<b>MATCH REPORT</b>' : ''}</div>
      <div class="match-main">
        <div class="team-cell home"><span>${esc((match.home?.name || '?').slice(0, 1))}</span><strong>${esc(match.home?.name || '—')}</strong></div>
        ${scoreMarkup(match)}
        <div class="team-cell away"><span>${esc((match.away?.name || '?').slice(0, 1))}</span><strong>${esc(match.away?.name || '—')}</strong></div>
      </div>
      <div class="match-bottom"><time>${esc(formatDate(match.date, true))}${match.time ? ` · ${esc(match.time)}` : ''}</time><span>VIEW MATCH ›</span></div>
    </a>`;
  }

  function dateGroups(rows) {
    const groups = new Map();
    rows.forEach(match => {
      const key = match.date || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(match);
    });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  function matchListPage(kind, groupKey = null) {
    let rows = state.matches;
    let title = 'MATCHES';
    let sub = `Fixture reali · Season ${seasonNumber()}`;
    let iconName = 'results';
    let back = ROOT;
    let active = 'results';

    if (groupKey != null) {
      rows = rows.filter(match => competitionKey(match) === groupKey);
      title = competitionName(rows[0]?.competition);
      sub = `${rows.length} fixture · Season ${seasonNumber()}`;
      back = `${ROOT}competitions/`;
      active = 'competitions';
    } else if (kind === 'calendar') {
      rows = rows.filter(match => match.availability?.schedule);
      title = 'CALENDAR';
      sub = `${rows.length} fixture programmate`;
      iconName = 'calendar';
      active = 'calendar';
    } else if (kind === 'results') {
      rows = rows.filter(match => match.result);
      title = 'RESULTS';
      sub = `${rows.length} risultati ufficiali`;
    }

    const groups = dateGroups(rows);
    const content = groups.length ? groups.map(([date, matches]) => `<section class="matchday-group"><header><div><small>MATCH DAY</small><h2>${esc(formatDate(date, true))}</h2></div><span>${esc(matches.length)} MATCH</span></header><div>${matches.map(matchCard).join('')}</div></section>`).join('') : '<div class="empty-state"><strong>NESSUN MATCH DISPONIBILE</strong><span>Il database non contiene fixture per questa vista.</span></div>';
    return `<section class="section-page">${pageHead(title, sub, iconName, back)}${viewTabs(active)}<div class="list-summary"><strong>${esc(rows.length)}</strong><span>${kind === 'calendar' ? 'UPCOMING FIXTURES' : 'MATCHES'}</span></div><div class="match-list">${content}</div></section>`;
  }

  function staticSection(key) {
    const section = staticSections[key] || staticSections.codex;
    return `<section class="section-page">${pageHead(section.title, section.sub, section.icon)}<div class="static-intro"><span>${icon(section.icon)}</span><p>${esc(section.intro)}</p></div><div class="empty-state"><strong>${key === 'transfers' ? 'COMING SOON' : 'NON ANCORA DISPONIBILE'}</strong><span>${esc(section.status)}</span></div></section>`;
  }

  function statValue(value) {
    return value == null || value === '' ? '—' : esc(value);
  }

  function matchDetailShell(match) {
    return `<section class="section-page match-detail-page">${pageHead('MATCH DETAIL', competitionName(match.competition), 'results', `${ROOT}results/`)}
      <article class="detail-score">
        <div class="detail-meta"><span>${esc(matchState(match))}</span><time>${esc(formatDate(match.date, true))}${match.time ? ` · ${esc(match.time)}` : ''}</time></div>
        <div class="detail-teams"><div><span>${esc((match.home?.name || '?').slice(0, 1))}</span><strong>${esc(match.home?.name || '—')}</strong></div>${scoreMarkup(match)}<div><span>${esc((match.away?.name || '?').slice(0, 1))}</span><strong>${esc(match.away?.name || '—')}</strong></div></div>
        <small>FIXTURE ID ${esc(match.fixture_id)}</small>
      </article>
      <nav class="report-tabs"><a href="#statistics">STATS</a><a href="#lineups">LINEUPS</a><a href="#events">EVENTS</a><a href="#commentary">COMMENTARY</a><a href="#tactics">TACTICS</a></nav>
      <div id="report"><div class="loading-inline"><span></span>CARICAMENTO MATCH REPORT</div></div>
    </section>`;
  }

  function statsTable(report) {
    const home = report.team_stats?.home || {};
    const away = report.team_stats?.away || {};
    const rows = [['Possesso', 'possession'], ['Tiri', 'shots'], ['Tiri in porta', 'shots_on_target'], ['Corner', 'corners'], ['Falli', 'fouls'], ['Fuorigioco', 'offside']];
    return `<section class="report-block" id="statistics"><header><small>MATCH DATA</small><h2>STATISTICHE</h2></header><div class="stats-table">${rows.map(([label, key]) => {
      const homeValue = home[key];
      const awayValue = away[key];
      const total = Number(homeValue || 0) + Number(awayValue || 0);
      const homeWidth = total ? Math.round((Number(homeValue || 0) / total) * 100) : 50;
      return `<div><div><strong>${statValue(homeValue)}</strong><span>${esc(label)}</span><strong>${statValue(awayValue)}</strong></div><i><b style="width:${homeWidth}%"></b></i></div>`;
    }).join('')}</div></section>`;
  }

  function lineupSide(side, lineup) {
    const players = lineup?.players || [];
    return `<article class="lineup-side"><header><div><small>STARTING XI</small><strong>${esc(side)}</strong></div><span>${esc(lineup?.formation || '—')}</span></header><div>${players.map(player => `<div class="player-row"><span>${esc(player.slot_order)}</span><strong>${esc(player.player_name || `Player ${player.player_id}`)}</strong><small>${player.is_substitute ? 'SUB' : statValue(player.rating)}</small></div>`).join('')}</div></article>`;
  }

  function lineupsBlock(match, report) {
    return `<section class="report-block" id="lineups"><header><small>TEAM SHEETS</small><h2>LINEUPS</h2></header><div class="lineups">${lineupSide(match.home?.name, report.lineups?.home)}${lineupSide(match.away?.name, report.lineups?.away)}</div></section>`;
  }

  function eventsBlock(report) {
    const events = report.events || [];
    return `<section class="report-block" id="events"><header><small>MATCH TIMELINE</small><h2>EVENTI</h2></header>${events.length ? `<div class="timeline">${events.map(event => `<article><time>${statValue(event.minute)}'</time><i></i><div><strong>${esc(String(event.event_type || 'EVENT').toUpperCase())}</strong><span>${event.player_id ? `PLAYER ${esc(event.player_id)}` : 'MATCH EVENT'}</span></div></article>`).join('')}</div>` : '<p class="block-empty">Nessun evento disponibile.</p>'}</section>`;
  }

  function commentaryBlock(report) {
    const commentary = report.commentary || [];
    return `<section class="report-block" id="commentary"><header><small>LIVE STORY</small><h2>COMMENTARY</h2></header>${commentary.length ? `<div class="commentary">${commentary.map(item => `<article><time>${statValue(item.minute)}'</time><p>${esc(item.text)}</p></article>`).join('')}</div>` : '<p class="block-empty">Cronaca non disponibile.</p>'}</section>`;
  }

  function tacticsBlock(report) {
    const tactics = report.tactics || [];
    return `<section class="report-block" id="tactics"><header><small>TACTICAL FLOW</small><h2>TATTICHE</h2></header>${tactics.length ? `<div class="tactics">${tactics.map(item => `<article><span>${esc(item.side || 'TEAM')}</span><strong>${esc(item.formation || '—')}</strong><time>DAL ${statValue(item.minute_from)}'</time></article>`).join('')}</div>` : '<p class="block-empty">Tattiche non disponibili.</p>'}</section>`;
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
    return `<section class="section-page"><a class="page-back standalone" href="${ROOT}">‹</a><div class="error-state"><strong>DATI NON DISPONIBILI</strong><span>${esc(message)}</span><button type="button" data-retry>RIPROVA</button></div></section>`;
  }

  function routeLoading(title, sub, iconName = 'results') {
    return `<section class="section-page">${pageHead(title, sub, iconName)}<div class="loading-panel"><div class="loading-inline"><span></span>CARICAMENTO DATI MYSQL</div><small>La pagina resta attiva mentre prepariamo i dati.</small></div></section>`;
  }

  function setActiveNav(route) {
    const active = route === 'calendar' ? 'calendar' : route === 'competitions' ? 'competitions' : route === 'results' || route === 'matches' ? 'results' : 'home';
    document.querySelectorAll('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === active));
  }

  function bindChrome() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const drawer = document.querySelector('[data-menu-drawer]');
    const scrim = document.querySelector('[data-menu-scrim]');
    const close = () => {
      drawer.hidden = true;
      scrim.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    toggle.addEventListener('click', () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      scrim.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    scrim.addEventListener('click', close);
    drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith(ROOT)) return;
      event.preventDefault();
      close();
      history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
      renderRoute();
    });

    document.addEventListener('click', event => {
      const filter = event.target.closest?.('[data-comp-filter]');
      if (!filter) return;
      state.competitionFilter = filter.dataset.compFilter;
      document.querySelectorAll('[data-comp-filter]').forEach(button => button.classList.toggle('active', button === filter));
      document.querySelectorAll('[data-competition-type]').forEach(card => {
        card.hidden = state.competitionFilter !== 'all' && card.dataset.competitionType !== state.competitionFilter;
      });
    });
  }

  async function renderRoute() {
    try {
      const parts = routeParts();
      const route = parts[0] || 'home';
      setActiveNav(route);
      window.scrollTo({ top: 0, behavior: 'instant' });

      if (route === 'home') {
        app.innerHTML = home();
        loadMatches().catch(() => {});
        return;
      }
      if (staticSections[route]) {
        app.innerHTML = staticSection(route);
        return;
      }
      if (route === 'matches' && parts[1]) {
        app.innerHTML = routeLoading('MATCH DETAIL', 'Apertura della fixture', 'results');
        const detailPayload = await IMCDataService.getMatch(WORLD_ID, parts[1]);
        const match = detailPayload.data.match;
        app.innerHTML = matchDetailShell(match);
        renderReport(detailPayload.data);
        return;
      }

      const loadingTitles = {
        competitions: ['COMPETITIONS', 'Preparazione delle competizioni', 'competitions'],
        calendar: ['CALENDAR', 'Preparazione del calendario', 'calendar'],
        results: ['RESULTS', 'Preparazione dei risultati', 'results']
      };
      if (loadingTitles[route]) app.innerHTML = routeLoading(...loadingTitles[route]);
      await loadMatches();

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

  async function start() {
    try {
      const worldPayload = await IMCDataService.getWorld(WORLD_ID, 1);
      state.world = worldPayload.data;
      document.title = `${WORLD_ID} · ${state.world.name} | Italian Masters Club`;
      await renderRoute();
    } catch (error) {
      app.innerHTML = errorPage(error instanceof Error ? error.message : 'Errore imprevisto.');
      document.querySelector('[data-retry]')?.addEventListener('click', () => location.reload());
    }
  }

  bindChrome();
  window.addEventListener('popstate', renderRoute);
  start();
})();
