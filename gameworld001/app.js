(() => {
  'use strict';

  const APP = document.getElementById('app');
  const GAME_WORLD_ID = 'GW001';
  const WORLD_NAME = 'ROAD TO HISTORY';
  const GATEWAY_URL = 'https://www.italianmastersclub.it/api/imc-gateway/';

  const NAV = [
    ['/overview','Overview'],
    ['/competitions','Competitions'],
    ['/calendar','Calendar'],
    ['/results','Results'],
    ['/team-hub','Team Hub'],
    ['/managers','Managers'],
    ['/codex','Codex'],
    ['/transfers','Transfers'],
    ['/trophy-room','Trophy Room'],
    ['/news-feed','News Feed'],
    ['/world-chronicle','World Chronicle']
  ];

  const state = {
    renderToken: 0,
    discovery: null,
    discoveryError: null,
    repositories: new Map(),
    status: new Map(),
    cache: new Map()
  };

  const gateway = {
    async request(params = {}) {
      const url = new URL(GATEWAY_URL);
      url.searchParams.set('game_world_id', GAME_WORLD_ID);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        throw new Error(`Gateway response non JSON (${response.status})`);
      }

      if (!response.ok || !payload || payload.ok !== true) {
        const code = payload?.error || `HTTP_${response.status}`;
        throw new Error(code);
      }
      return payload;
    },

    async discover(force = false) {
      if (state.discovery && !force) return state.discovery;
      try {
        const payload = await this.request({ action: 'repositories' });
        const repos = Array.isArray(payload.repositories) ? payload.repositories : [];
        state.discovery = payload;
        state.discoveryError = null;
        state.repositories = new Map(repos.map(item => [item.repository, item]));
        repos.forEach(item => {
          if (!state.status.has(item.repository)) {
            state.status.set(item.repository, { state: 'available', total: null, error: null });
          }
        });
        return payload;
      } catch (error) {
        state.discoveryError = error;
        state.discovery = null;
        state.repositories = new Map();
        throw error;
      }
    },

    has(repository) {
      return state.repositories.has(repository);
    },

    cacheKey(repository, options = {}) {
      return JSON.stringify([repository, options]);
    },

    async read(repository, options = {}) {
      if (!state.discovery && !state.discoveryError) {
        await this.discover();
      }
      if (!this.has(repository)) {
        state.status.set(repository, { state: 'unavailable', total: null, error: null });
        return { state: 'unavailable', data: [], total: 0, repository };
      }

      const key = this.cacheKey(repository, options);
      if (options.cache !== false && state.cache.has(key)) return state.cache.get(key);

      const params = {
        repository,
        action: 'read',
        limit: options.limit ?? 100,
        offset: options.offset ?? 0,
        order_by: options.orderBy,
        order_dir: options.orderDir
      };
      Object.entries(options.filters || {}).forEach(([column, value]) => {
        params[`filter_${column}`] = value;
      });

      try {
        const payload = await this.request(params);
        const rows = Array.isArray(payload.data) ? payload.data : [];
        const total = Number(payload.pagination?.total ?? rows.length ?? 0);
        const result = {
          state: total > 0 ? 'populated' : 'empty',
          data: rows,
          total,
          returned: Number(payload.pagination?.returned ?? rows.length),
          repository,
          payload
        };
        state.status.set(repository, { state: result.state, total, error: null });
        if (options.cache !== false) state.cache.set(key, result);
        return result;
      } catch (error) {
        const result = { state: 'error', data: [], total: null, repository, error };
        state.status.set(repository, { state: 'error', total: null, error: error.message });
        return result;
      }
    },

    async total(repository, filters = {}) {
      return this.read(repository, { limit: 1, filters });
    },

    async readAll(repository, options = {}) {
      const pageSize = Math.max(1, Math.min(1000, Number(options.pageSize || 1000)));
      const maxRows = Math.max(pageSize, Number(options.maxRows || 10000));
      let offset = 0;
      let total = null;
      const data = [];

      while (data.length < maxRows) {
        const page = await this.read(repository, {
          ...options,
          limit: pageSize,
          offset,
          cache: false
        });

        if (page.state === 'error' || page.state === 'unavailable') {
          return {
            state: page.state,
            data,
            total: page.total,
            returned: data.length,
            repository,
            error: page.error
          };
        }

        if (total === null) total = Number(page.total || 0);
        data.push(...(page.data || []));

        const returned = Number(page.returned || page.data?.length || 0);
        offset += returned;

        if (!returned || offset >= total || returned < pageSize) break;
      }

      return {
        state: data.length ? 'populated' : 'empty',
        data: data.slice(0, maxRows),
        total: total ?? data.length,
        returned: Math.min(data.length, maxRows),
        repository
      };
    }
  };

  function e(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? new Intl.NumberFormat('it-IT').format(n) : '—';
  }

  function valueOrDash(value) {
    return value === null || value === undefined || value === '' ? '—' : e(value);
  }

  function routeUrl(path) {
    return `#${path}`;
  }

  function currentPath() {
    const raw = location.hash.replace(/^#/, '') || '/overview';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  function splitPath() {
    return currentPath().split('/').filter(Boolean);
  }

  function isActive(current, base) {
    if (base === '/overview') return current === '/' || current === '/overview';
    return current === base || current.startsWith(`${base}/`);
  }

  function shell(content, activePath = currentPath()) {
    APP.innerHTML = `
      <header class="topbar">
        <div class="brand-mark">IMC</div>
        <a class="brand" href="${routeUrl('/overview')}">
          <h1>${WORLD_NAME}</h1>
          <div class="brand-sub">GAME WORLD</div>
        </a>
        <a class="menu-btn" href="${routeUrl('/overview')}" aria-label="Overview">
          <div class="hamb"><span></span><span></span><span></span></div>
        </a>
      </header>

      <nav class="global-nav" aria-label="Navigazione principale">
        ${NAV.map(([path,label]) => `
          <a class="nav-pill ${isActive(activePath,path) ? 'active' : ''}" href="${routeUrl(path)}">${label}</a>
        `).join('')}
      </nav>

      <main class="view">${content}</main>
      <footer>ITALIAN MASTERS CLUB · THE WORLD IS OUR PLAYGROUND</footer>
    `;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function sectionHead(eyebrow, title, back = '/overview') {
    return `
      <div class="section-head">
        <div><small>${e(eyebrow)}</small><h2>${e(title)}</h2></div>
        <a class="back-btn" href="${routeUrl(back)}" aria-label="Indietro"></a>
      </div>`;
  }

  function loading(title = 'Caricamento dati') {
    return `<div class="data-state loading-state"><span class="spinner"></span><strong>${e(title)}</strong><small>Universal Gateway · ${GAME_WORLD_ID}</small></div>`;
  }

  function unavailable(message = 'DATI NON ANCORA DISPONIBILI', detail = '') {
    return `<div class="data-state empty-state"><strong>${e(message)}</strong>${detail ? `<small>${e(detail)}</small>` : ''}</div>`;
  }

  function gatewayError(error) {
    return `<div class="data-state error-state"><strong>DATI TEMPORANEAMENTE NON DISPONIBILI</strong><small>${e(error?.message || 'Errore di lettura dal Universal Gateway')}</small></div>`;
  }

  function renderLoadingView(title, back = '/overview') {
    shell(`${sectionHead(GAME_WORLD_ID, title, back)}${loading()}`);
  }

  function metric(label, value, note = '') {
    return `<div class="metric-card"><strong>${e(value)}</strong><span>${e(label)}</span>${note ? `<small>${e(note)}</small>` : ''}</div>`;
  }

  function matchCard(row, source = 'results') {
    const id = row.sm_fixture_id;
    if (!id) return '';
    const score = source === 'results' || row.home_score !== undefined
      ? `<div class="match-score"><strong>${valueOrDash(row.home_score)}</strong><span>–</span><strong>${valueOrDash(row.away_score)}</strong></div>`
      : `<div class="match-time">${valueOrDash(row.match_time)}</div>`;
    return `
      <a class="match-card" href="${routeUrl(`/match/${encodeURIComponent(id)}`)}">
        <div class="match-meta"><span>${valueOrDash(row.match_date)}</span><span>${valueOrDash(row.competition_key || row.competition_group)}</span></div>
        <div class="match-main">
          <span class="team-name">${valueOrDash(row.home_name)}</span>
          ${score}
          <span class="team-name right">${valueOrDash(row.away_name)}</span>
        </div>
      </a>`;
  }

  function playerCard(player, roster = null, stats = null) {
    const id = player.sm_player_id;
    if (!id) return '';
    const name = player.full_name || player.player_name || `Player ${id}`;
    const image = player.image_url
      ? `<img src="${e(player.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : `<div class="avatar-fallback">${e(name).charAt(0)}</div>`;
    return `
      <a class="player-card" href="${routeUrl(`/player/${encodeURIComponent(id)}`)}">
        <div class="player-image">${image}</div>
        <div class="player-copy">
          <small>${valueOrDash(player.position)} · ${valueOrDash(player.nationality)}</small>
          <strong>${e(name)}</strong>
          <span>${valueOrDash(roster?.club_name || player.current_club)}</span>
        </div>
        <div class="rating-badge">${valueOrDash(player.rating)}</div>
        ${stats ? `<div class="mini-stats"><span>${number(stats.appearances)} APP</span><span>${number(stats.goals)} G</span><span>${number(stats.assists)} A</span></div>` : ''}
      </a>`;
  }

  async function renderOverview(token) {
    shell(`
      <section class="world-card">
        <div class="world-id"><strong>${GAME_WORLD_ID}</strong><span>GAME WORLD</span></div>
        <div class="world-name">${WORLD_NAME}</div>
        <div class="season-box"><strong>IMC DATA</strong><span>Universal Gateway</span></div>
      </section>
      ${loading('Lettura stato Game World')}
    `, '/overview');

    try {
      await gateway.discover();
      const [results, schedule, players, reports] = await Promise.all([
        gateway.total('results', { result_dataset: 'MATCH_DATA' }),
        gateway.total('schedule'),
        gateway.total('player_codex'),
        gateway.total('match_report')
      ]);
      if (token !== state.renderToken) return;

      const content = `
        <section class="world-card">
          <div class="world-id"><strong>${GAME_WORLD_ID}</strong><span>GAME WORLD</span></div>
          <div class="world-name">${WORLD_NAME}</div>
          <div class="season-box"><strong>LIVE DATA</strong><span>${number(state.repositories.size)} repository</span></div>
        </section>

        <section class="overview-metrics">
          ${metric('Risultati match', results.state === 'error' ? '—' : number(results.total), 'MATCH_DATA')}
          ${metric('Fixture future', schedule.state === 'error' ? '—' : number(schedule.total))}
          ${metric('Player Codex', players.state === 'error' ? '—' : number(players.total))}
          ${metric('Match report', reports.state === 'error' ? '—' : number(reports.total))}
        </section>

        <section class="overview-grid">
          <a class="home-card competitions-card" href="${routeUrl('/competitions')}"><h3>Competitions</h3><p>Dati reali da match e fixture</p><div class="icon">🏆</div></a>
          <a class="home-card managers-card" href="${routeUrl('/managers')}"><h3>Managers</h3><p>ID reali disponibili</p><div class="icon">◯</div></a>
          <a class="home-card teamhub-card" href="${routeUrl('/team-hub')}"><h3>Team Hub</h3><p>Club e roster reali</p><div class="icon">⬡</div></a>
          <a class="home-card trophy-card" href="${routeUrl('/trophy-room')}"><h3>Trophy Room</h3><p>${state.status.get('trophy_room')?.state === 'empty' ? 'Dati non disponibili' : 'Trofei del GW'}</p><div class="icon">🏆</div></a>
          <a class="home-card news-card" href="${routeUrl('/news-feed')}"><h3>News Feed</h3><p>Repository Gateway</p><div class="icon">▤</div></a>
          <a class="home-card codex-card" href="${routeUrl('/codex/players')}"><h3>Codex</h3><p>${players.state === 'populated' ? `${number(players.total)} giocatori` : 'Players'}</p><div class="icon">▥</div></a>
          <a class="home-card transfers-card" href="${routeUrl('/transfers')}"><h3>Transfers</h3><p>Mercato del GW</p><div class="icon">⇄</div></a>
          <a class="home-card calendar-card" href="${routeUrl('/calendar')}"><h3>Calendar</h3><p>${schedule.state === 'populated' ? `${number(schedule.total)} fixture` : 'Calendario'}</p><div class="icon">▦</div></a>
          <a class="home-card results-card" href="${routeUrl('/results')}"><h3>Results</h3><p>${results.state === 'populated' ? `${number(results.total)} match` : 'Risultati'}</p><div class="icon">✓</div></a>
          <a class="home-card chronicle-card" href="${routeUrl('/world-chronicle')}"><h3>World Chronicle</h3><p>Sorgente non ancora certificata</p><div class="icon">⌁</div></a>
        </section>`;
      shell(content, '/overview');
    } catch (error) {
      if (token !== state.renderToken) return;
      shell(`${sectionHead(GAME_WORLD_ID, 'Overview', '/overview')}${gatewayError(error)}`, '/overview');
    }
  }

  async function renderCalendar(token) {
    renderLoadingView('Calendar');
    const result = await gateway.read('schedule', { limit: 500, orderBy: 'match_date', orderDir: 'ASC' });
    if (token !== state.renderToken) return;
    const body = result.state === 'error' ? gatewayError(result.error)
      : result.state === 'empty' ? unavailable('DATI NON ANCORA DISPONIBILI', 'Il repository schedule è presente ma non contiene fixture.')
      : `<div class="match-list">${result.data.map(row => matchCard(row, 'schedule')).join('')}</div>`;
    shell(`${sectionHead(GAME_WORLD_ID, 'Calendar', '/overview')}<div class="view-summary"><strong>${number(result.total)}</strong><span>fixture disponibili</span></div>${body}`, '/calendar');
  }

  async function renderResults(token) {
    renderLoadingView('Results');
    const result = await gateway.read('results', {
      limit: 500,
      orderBy: 'match_date',
      orderDir: 'DESC',
      filters: { result_dataset: 'MATCH_DATA' }
    });
    if (token !== state.renderToken) return;
    const body = result.state === 'error' ? gatewayError(result.error)
      : result.state === 'empty' ? unavailable('DATI NON ANCORA DISPONIBILI', 'Nessun record MATCH_DATA disponibile.')
      : `<div class="match-list">${result.data.map(row => matchCard(row, 'results')).join('')}</div>`;
    shell(`${sectionHead(GAME_WORLD_ID, 'Results', '/overview')}<div class="view-summary"><strong>${number(result.total)}</strong><span>match MATCH_DATA</span></div>${body}`, '/results');
  }

  async function composeMatch(fixtureId) {
    const filters = { sm_fixture_id: fixtureId };
    const specs = [
      ['schedule', { limit: 5, filters }],
      ['results', { limit: 50, filters }],
      ['match_report', { limit: 5, filters }],
      ['match_report_commentary', { limit: 500, filters, orderBy: 'event_sequence', orderDir: 'ASC' }],
      ['match_report_events', { limit: 300, filters, orderBy: 'event_sequence', orderDir: 'ASC' }],
      ['match_report_players', { limit: 100, filters }],
      ['match_report_tactics', { limit: 50, filters }],
      ['match_report_team_stats', { limit: 5, filters }]
    ];
    const entries = await Promise.all(specs.map(async ([repo, opts]) => [repo, await gateway.read(repo, { ...opts, cache: false })]));
    return Object.fromEntries(entries);
  }

  function firstReal(rows, predicate = null) {
    if (!Array.isArray(rows)) return null;
    return predicate ? rows.find(predicate) || null : rows[0] || null;
  }

  function matchHero(data, fixtureId) {
    const report = firstReal(data.match_report?.data);
    const schedule = firstReal(data.schedule?.data);
    const result = firstReal(data.results?.data, row => row.result_dataset === 'MATCH_DATA') || firstReal(data.results?.data);
    const base = report || result || schedule;
    if (!base) return unavailable('MATCH NON DISPONIBILE', `Nessun dataset trovato per sm_fixture_id ${fixtureId}.`);
    const home = base.home_name || schedule?.home_name || result?.home_name || '—';
    const away = base.away_name || schedule?.away_name || result?.away_name || '—';
    const homeScore = report?.home_score ?? result?.home_score;
    const awayScore = report?.away_score ?? result?.away_score;
    const hasScore = homeScore !== undefined && homeScore !== null && awayScore !== undefined && awayScore !== null;
    return `
      <section class="match-detail-hero">
        <small>${valueOrDash(base.competition_key || base.competition_group)} · ${valueOrDash(base.match_date || schedule?.match_date)}</small>
        <div class="match-detail-score">
          <strong>${e(home)}</strong>
          <div>${hasScore ? `<b>${e(homeScore)} – ${e(awayScore)}</b>` : `<span>${valueOrDash(schedule?.match_time)}</span>`}</div>
          <strong>${e(away)}</strong>
        </div>
        <div class="match-detail-meta">
          ${report?.stadium_name ? `<span>${e(report.stadium_name)}</span>` : ''}
          ${report?.attendance ? `<span>${number(report.attendance)} spettatori</span>` : ''}
          <span>Fixture ${e(fixtureId)}</span>
        </div>
      </section>`;
  }

  function renderMatchSections(data) {
    const sections = [];
    const stats = firstReal(data.match_report_team_stats?.data);
    if (stats) {
      sections.push(`
        <section class="detail-section"><h3>Team Stats</h3>
          <div class="stats-table">
            ${statRow('Possesso', stats.home_possession, stats.away_possession, '%')}
            ${statRow('Tiri', stats.home_total_shots, stats.away_total_shots)}
            ${statRow('In porta', stats.home_shots_on_target, stats.away_shots_on_target)}
            ${statRow('Corner', stats.home_corners, stats.away_corners)}
            ${statRow('Gialli', stats.home_yellow_cards, stats.away_yellow_cards)}
            ${statRow('Rossi', stats.home_red_cards, stats.away_red_cards)}
          </div>
        </section>`);
    }

    const events = data.match_report_events?.data || [];
    if (events.length) {
      sections.push(`<section class="detail-section"><h3>Events</h3><div class="timeline">${events.map(ev => `
        <div class="timeline-row"><b>${valueOrDash(ev.minute)}</b><span>${valueOrDash(ev.event_type)}</span><p>${valueOrDash(ev.event_text || ev.primary_player_name)}</p></div>`).join('')}</div></section>`);
    }

    const commentary = data.match_report_commentary?.data || [];
    if (commentary.length) {
      sections.push(`<section class="detail-section"><h3>Commentary</h3><div class="timeline commentary">${commentary.map(ev => `
        <div class="timeline-row"><b>${valueOrDash(ev.minute)}</b><p>${valueOrDash(ev.commentary_text)}</p></div>`).join('')}</div></section>`);
    }

    const players = data.match_report_players?.data || [];
    if (players.length) {
      sections.push(`<section class="detail-section"><h3>Players</h3><div class="player-match-grid">${players.map(p => `
        <a class="match-player" href="${p.sm_player_id ? routeUrl(`/player/${encodeURIComponent(p.sm_player_id)}`) : '#'}">
          <strong>${valueOrDash(p.player_name)}</strong><span>${valueOrDash(p.team_side)} · ${valueOrDash(p.squad_slot)}</span>
          <b>${valueOrDash(p.rating)}</b>
        </a>`).join('')}</div></section>`);
    }

    const tactics = data.match_report_tactics?.data || [];
    if (tactics.length) {
      sections.push(`<section class="detail-section"><h3>Tactics</h3><div class="tactics-grid">${tactics.map(t => `
        <div class="tactic-card"><small>${valueOrDash(t.team_side)} · ${valueOrDash(t.snapshot_minute)}</small><strong>${valueOrDash(t.formation)}</strong><span>${valueOrDash(t.mentality)} · ${valueOrDash(t.passing_style)}</span></div>`).join('')}</div></section>`);
    }

    return sections.join('') || unavailable('DATI DI DETTAGLIO NON ANCORA DISPONIBILI');
  }

  function statRow(label, home, away, suffix = '') {
    return `<div class="stat-row"><strong>${valueOrDash(home)}${home !== null && home !== undefined && home !== '' ? suffix : ''}</strong><span>${e(label)}</span><strong>${valueOrDash(away)}${away !== null && away !== undefined && away !== '' ? suffix : ''}</strong></div>`;
  }

  async function renderMatchDetail(token, fixtureId) {
    renderLoadingView('Match Detail', '/results');
    const data = await composeMatch(fixtureId);
    if (token !== state.renderToken) return;
    const anyError = Object.values(data).every(item => item.state === 'error');
    const body = anyError ? gatewayError(new Error('Impossibile leggere i dataset del match')) : `${matchHero(data, fixtureId)}${renderMatchSections(data)}`;
    shell(`${sectionHead(`Fixture ${fixtureId}`, 'Match Detail', '/results')}${body}`, '/results');
  }

  async function renderCodexPlayers(token) {
    renderLoadingView('Codex · Players', '/overview');
    const [players, roster, stats] = await Promise.all([
      gateway.read('player_codex', { limit: 200, orderBy: 'player_name', orderDir: 'ASC' }),
      gateway.read('player_codex_roster', { limit: 200 }),
      gateway.read('player_codex_stats', { limit: 200 })
    ]);
    if (token !== state.renderToken) return;
    if (players.state === 'error') {
      shell(`${sectionHead('GW001 · Codex', 'Players', '/overview')}${gatewayError(players.error)}`, '/codex');
      return;
    }
    if (players.state === 'empty') {
      shell(`${sectionHead('GW001 · Codex', 'Players', '/overview')}${unavailable()}`, '/codex');
      return;
    }
    const rosterMap = new Map((roster.data || []).filter(r => r.sm_player_id).map(r => [String(r.sm_player_id), r]));
    const statsMap = new Map((stats.data || []).filter(r => r.sm_player_id).map(r => [String(r.sm_player_id), r]));
    const cards = players.data.map(p => playerCard(p, rosterMap.get(String(p.sm_player_id)), statsMap.get(String(p.sm_player_id)))).join('');
    const content = `${sectionHead('GW001 · Codex', 'Players', '/overview')}${codexTabs('players')}<div class="view-summary"><strong>${number(players.total)}</strong><span>giocatori reali</span></div><div class="player-grid">${cards}</div>`;
    shell(content, '/codex');
  }

  function codexTabs(active) {
    return `<div class="tabs three"><a class="tab ${active==='players'?'active':''}" href="${routeUrl('/codex/players')}">Players</a><a class="tab ${active==='teams'?'active':''}" href="${routeUrl('/codex/teams')}">Teams</a><a class="tab ${active==='records'?'active':''}" href="${routeUrl('/codex/records')}">Records</a></div>`;
  }

  async function composePlayer(playerId) {
    const filters = { sm_player_id: playerId };
    const specs = [
      ['player_codex', { limit: 5, filters }],
      ['player_codex_roster', { limit: 20, filters }],
      ['player_codex_stats', { limit: 10, filters }],
      ['player_codex_rating_history', { limit: 300, filters, orderBy: 'event_sequence', orderDir: 'ASC' }],
      ['player_codex_injury_history', { limit: 300, filters, orderBy: 'event_sequence', orderDir: 'ASC' }],
      ['player_codex_transfer_history', { limit: 300, filters, orderBy: 'event_sequence', orderDir: 'ASC' }],
      ['player_codex_snapshots', { limit: 50, filters }],
      ['match_report_players', { limit: 300, filters }]
    ];
    const entries = await Promise.all(specs.map(async ([repo, opts]) => [repo, await gateway.read(repo, { ...opts, cache: false })]));
    const [eventsPrimary, eventsSecondary] = await Promise.all([
      gateway.read('match_report_events', { limit: 300, filters: { primary_sm_player_id: playerId }, cache: false }),
      gateway.read('match_report_events', { limit: 300, filters: { secondary_sm_player_id: playerId }, cache: false })
    ]);
    const out = Object.fromEntries(entries);
    out.match_report_events = {
      state: eventsPrimary.state === 'error' && eventsSecondary.state === 'error' ? 'error' : 'populated',
      data: [...(eventsPrimary.data || []), ...(eventsSecondary.data || [])]
    };
    return out;
  }

  async function renderPlayerDetail(token, playerId) {
    renderLoadingView('Player Detail', '/codex/players');
    const data = await composePlayer(playerId);
    if (token !== state.renderToken) return;
    const player = firstReal(data.player_codex?.data);
    if (!player) {
      const error = data.player_codex?.state === 'error' ? gatewayError(data.player_codex.error) : unavailable('GIOCATORE NON DISPONIBILE', `Nessun player_codex per sm_player_id ${playerId}.`);
      shell(`${sectionHead('GW001 · Codex', 'Player Detail', '/codex/players')}${error}`, '/codex');
      return;
    }
    const roster = firstReal(data.player_codex_roster?.data);
    const stats = firstReal(data.player_codex_stats?.data);
    const name = player.full_name || player.player_name || `Player ${playerId}`;
    const image = player.image_url ? `<img src="${e(player.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '';
    const profile = `
      <section class="player-detail-hero">
        <div class="player-detail-image">${image || `<div class="avatar-fallback large">${e(name).charAt(0)}</div>`}</div>
        <div><small>SM PLAYER ID ${e(playerId)}</small><h3>${e(name)}</h3><p>${valueOrDash(player.position)} · ${valueOrDash(player.nationality)}</p><strong>${valueOrDash(player.rating)}</strong></div>
      </section>
      <section class="fact-grid">
        ${fact('Club', roster?.club_name || player.current_club)}${fact('Età', player.age)}${fact('Piede', player.foot)}${fact('Valore', player.market_value)}${fact('Ingaggio', player.salary)}${fact('Contratto', player.contract_seasons)}
      </section>`;

    const sections = [];
    if (stats) sections.push(`<section class="detail-section"><h3>Stats</h3><div class="record-grid">${metric('Presenze', number(stats.appearances))}${metric('Gol', number(stats.goals))}${metric('Assist', number(stats.assists))}${metric('Media', valueOrDash(stats.average_performance))}</div></section>`);
    const ratings = data.player_codex_rating_history?.data || [];
    if (ratings.length) sections.push(`<section class="detail-section"><h3>Rating History</h3><div class="history-list">${ratings.map(r => `<div><span>${valueOrDash(r.rating_date)}</span><strong>${valueOrDash(r.old_rating)} → ${valueOrDash(r.new_rating)}</strong></div>`).join('')}</div></section>`);
    const injuries = data.player_codex_injury_history?.data || [];
    if (injuries.length) sections.push(`<section class="detail-section"><h3>Injury History</h3><div class="history-list">${injuries.map(r => `<div><span>#${valueOrDash(r.event_sequence)}</span><strong>${valueOrDash(r.history_text)}</strong></div>`).join('')}</div></section>`);
    const transfers = data.player_codex_transfer_history?.data || [];
    if (transfers.length) sections.push(`<section class="detail-section"><h3>Transfer History</h3><div class="history-list">${transfers.map(r => `<div><span>#${valueOrDash(r.event_sequence)}</span><strong>${valueOrDash(r.history_text)}</strong></div>`).join('')}</div></section>`);
    const matchRows = data.match_report_players?.data || [];
    if (matchRows.length) sections.push(`<section class="detail-section"><h3>Match Reports</h3><div class="history-list">${matchRows.slice(0,30).map(r => `<a href="${routeUrl(`/match/${encodeURIComponent(r.sm_fixture_id)}`)}"><span>Fixture ${valueOrDash(r.sm_fixture_id)}</span><strong>${valueOrDash(r.rating)} · ${number(r.goals)} G · ${number(r.assists)} A</strong></a>`).join('')}</div></section>`);

    shell(`${sectionHead('GW001 · Codex', 'Player Detail', '/codex/players')}${profile}${sections.join('')}`, '/codex');
  }

  function fact(label, val) {
    return `<div class="fact"><span>${e(label)}</span><strong>${valueOrDash(val)}</strong></div>`;
  }

  async function renderRecords(token) {
    renderLoadingView('Codex · Records', '/codex/players');
    const [stats, matchPlayers, teamStats] = await Promise.all([
      gateway.read('player_codex_stats', { limit: 200 }),
      gateway.read('match_report_players', { limit: 25, orderBy: 'goals', orderDir: 'DESC', cache: false }),
      gateway.read('match_report_team_stats', { limit: 300, cache: false })
    ]);
    if (token !== state.renderToken) return;
    if (stats.state === 'error') {
      shell(`${sectionHead('GW001 · Codex', 'Records', '/codex/players')}${codexTabs('records')}${gatewayError(stats.error)}`, '/codex');
      return;
    }
    const leaders = [...(stats.data || [])].sort((a,b) => Number(b.goals||0)-Number(a.goals||0)).slice(0,10);
    const content = `${sectionHead('GW001 · Codex', 'Records', '/codex/players')}${codexTabs('records')}
      <section class="detail-section"><h3>Player Leaders</h3><div class="leader-list">${leaders.map((r,i) => `<div><b>${i+1}</b><span>SM ${valueOrDash(r.sm_player_id)}</span><strong>${number(r.goals)} gol · ${number(r.assists)} assist</strong></div>`).join('')}</div></section>
      ${matchPlayers.data?.length ? `<section class="detail-section"><h3>Match Report · Top Goals</h3><div class="leader-list">${matchPlayers.data.slice(0,10).map((r,i) => `<a href="${r.sm_player_id ? routeUrl(`/player/${encodeURIComponent(r.sm_player_id)}`) : '#'}"><b>${i+1}</b><span>${valueOrDash(r.player_name)}</span><strong>${number(r.goals)} gol</strong></a>`).join('')}</div></section>` : ''}
      <div class="view-summary"><strong>${number(teamStats.total || 0)}</strong><span>team stat report disponibili</span></div>`;
    shell(content, '/codex');
  }

  function competitionGroupConfig() {
    return [
      { value: 'DOMESTIC', label: 'Domestic', slug: 'domestic', icon: '🏆' },
      { value: 'INTERNATIONAL', label: 'International', slug: 'international', icon: '🏆' },
      { value: 'NATIONS', label: 'Nations', slug: 'nations', icon: '⚑' }
    ];
  }

  function cleanCompetitionValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function competitionRouteToken(identity) {
    return encodeURIComponent(JSON.stringify(identity));
  }

  function parseCompetitionRouteToken(token) {
    try {
      const parsed = JSON.parse(decodeURIComponent(token));
      if (!parsed || typeof parsed !== 'object') return null;

      const group = cleanCompetitionValue(parsed.group).toUpperCase();
      if (!['DOMESTIC', 'INTERNATIONAL', 'NATIONS'].includes(group)) return null;

      const competitionKey = cleanCompetitionValue(parsed.competition_key);
      const smAction = cleanCompetitionValue(parsed.sm_action);
      const smDivision = cleanCompetitionValue(parsed.sm_division);

      if (!competitionKey && !smAction) return null;

      return {
        group,
        competition_key: competitionKey || null,
        sm_action: smAction || null,
        sm_division: smDivision || null
      };
    } catch (_) {
      return null;
    }
  }

  function competitionIdentityId(identity) {
    if (identity.competition_key) {
      return `key:${identity.group}:${identity.competition_key}`;
    }
    return `fields:${identity.group}:${identity.sm_action || ''}:${identity.sm_division || ''}`;
  }

  function competitionIdentityFromRow(row, splitByDivision) {
    const group = cleanCompetitionValue(row.competition_group).toUpperCase();
    if (!['DOMESTIC', 'INTERNATIONAL', 'NATIONS'].includes(group)) return null;

    const competitionKey = cleanCompetitionValue(row.competition_key);
    if (competitionKey) {
      return {
        group,
        competition_key: competitionKey,
        sm_action: cleanCompetitionValue(row.sm_action) || null,
        sm_division: cleanCompetitionValue(row.sm_division) || null
      };
    }

    const smAction = cleanCompetitionValue(row.sm_action);
    if (!smAction) return null;

    const division = splitByDivision.get(`${group}:${smAction}`) === true
      ? cleanCompetitionValue(row.sm_division)
      : '';

    return {
      group,
      competition_key: null,
      sm_action: smAction,
      sm_division: division || null
    };
  }

  function buildCompetitionIndex(group, datasets) {
    const rows = [
      ...(datasets.results || []),
      ...(datasets.schedule || []),
      ...(datasets.reports || [])
    ].filter(row => cleanCompetitionValue(row.competition_group).toUpperCase() === group);

    const divisionsByAction = new Map();
    for (const row of rows) {
      if (cleanCompetitionValue(row.competition_key)) continue;
      const action = cleanCompetitionValue(row.sm_action);
      const division = cleanCompetitionValue(row.sm_division);
      if (!action || !division) continue;

      const key = `${group}:${action}`;
      if (!divisionsByAction.has(key)) divisionsByAction.set(key, new Set());
      divisionsByAction.get(key).add(division);
    }

    const splitByDivision = new Map();
    divisionsByAction.forEach((set, key) => splitByDivision.set(key, set.size > 1));

    const competitions = new Map();

    function ingest(sourceName, sourceRows) {
      for (const row of sourceRows || []) {
        if (cleanCompetitionValue(row.competition_group).toUpperCase() !== group) continue;

        const identity = competitionIdentityFromRow(row, splitByDivision);
        if (!identity) continue;

        const id = competitionIdentityId(identity);
        if (!competitions.has(id)) {
          competitions.set(id, {
            id,
            identity,
            competition_key: identity.competition_key,
            competition_group: group,
            sm_action: identity.sm_action,
            sm_division: identity.sm_division,
            countries: new Set(),
            stages: new Set(),
            rounds: new Set(),
            latest_result_date: null,
            next_schedule_date: null,
            counts: { results: 0, schedule: 0, reports: 0 }
          });
        }

        const item = competitions.get(id);
        item.counts[sourceName] += 1;

        const country = cleanCompetitionValue(row.sm_country);
        const stage = cleanCompetitionValue(row.competition_stage);
        const round = cleanCompetitionValue(row.competition_round);

        if (country) item.countries.add(country);
        if (stage) item.stages.add(stage);
        if (round) item.rounds.add(round);

        const matchDate = cleanCompetitionValue(row.match_date);
        if (matchDate && sourceName === 'results') {
          if (!item.latest_result_date || matchDate > item.latest_result_date) item.latest_result_date = matchDate;
        }
        if (matchDate && sourceName === 'schedule') {
          if (!item.next_schedule_date || matchDate < item.next_schedule_date) item.next_schedule_date = matchDate;
        }
      }
    }

    ingest('results', datasets.results);
    ingest('schedule', datasets.schedule);
    ingest('reports', datasets.reports);

    return [...competitions.values()].sort((a, b) => {
      const actionA = a.competition_key || a.sm_action || '';
      const actionB = b.competition_key || b.sm_action || '';
      const byAction = actionA.localeCompare(actionB);
      if (byAction) return byAction;

      const da = Number(a.sm_division);
      const db = Number(b.sm_division);
      if (Number.isFinite(da) && Number.isFinite(db)) return da - db;
      return String(a.sm_division || '').localeCompare(String(b.sm_division || ''));
    });
  }

  const COMPETITION_LABELS = Object.freeze({
    league: 'League',
    leaguecup: 'League Cup',
    leagueshield: 'League Shield',
    charityshield: 'Charity Shield',
    playoff: 'Playoff',
    smfacup: 'SMFA Champions',
    smfashield: 'SMFA Shield',
    smfasupercup: 'SMFA Super Cup',
    interqualifier: 'World Cup Qualifier',
    worldcup: 'World Cup'
  });

  function competitionDisplayName(item) {
    if (item.competition_key) return item.competition_key;
    const action = cleanCompetitionValue(item.sm_action).toLowerCase();
    const base = COMPETITION_LABELS[action] || item.sm_action || 'Competition';
    if (action === 'league' && item.sm_division) return `${base} Div ${item.sm_division}`;
    return base;
  }

  function competitionTypeLabel(item) {
    const action = cleanCompetitionValue(item.sm_action).toLowerCase();
    return (COMPETITION_LABELS[action] || item.sm_action || item.competition_group || '').toUpperCase();
  }

  function competitionIcon(item) {
    const action = cleanCompetitionValue(item.sm_action).toLowerCase();
    if (item.competition_group === 'NATIONS') {
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16"/><path d="M8 24h32M24 8c6 6 8 11 8 16s-2 10-8 16M24 8c-6 6-8 11-8 16s2 10 8 16"/></svg>`;
    }
    if (action === 'league') {
      return `<span class="competition-rank-icon">${e(item.sm_division || '1')}</span>`;
    }
    if (action.includes('shield')) {
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11L24 5Z"/><path d="m24 14 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/></svg>`;
    }
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 7h16v7c0 9-4 16-8 16s-8-7-8-16V7Z"/><path d="M16 11H9v4c0 7 4 11 10 12M32 11h7v4c0 7-4 11-10 12M24 30v7M17 40h14"/></svg>`;
  }

  function formatCompetitionDate(value) {
    if (!value) return '—';
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return e(value);
    const months = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];
    return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]}`;
  }

  function competitionStageText(item) {
    const rounds = [...item.rounds].filter(Boolean);
    if (rounds.length) return rounds[rounds.length - 1];
    const stages = [...item.stages].filter(Boolean);
    if (stages.length) return stages[stages.length - 1];
    if (item.sm_division) return `Division ${item.sm_division}`;
    return '—';
  }

  function competitionTabs(activeSlug) {
    return `<nav class="competition-tabs" aria-label="Competition groups">
      ${competitionGroupConfig().map(config => `
        <a class="competition-tab ${config.slug === activeSlug ? 'active' : ''} ${config.slug}" href="${routeUrl(`/competitions/${config.slug}`)}">
          ${e(config.label)}
        </a>`).join('')}
    </nav>`;
  }

  function competitionItem(item) {
    const resultsCount = Number(item.counts.results || 0);
    const scheduleCount = Number(item.counts.schedule || 0);
    const stageText = competitionStageText(item);
    const nextDate = formatCompetitionDate(item.next_schedule_date);
    const name = competitionDisplayName(item);

    return `
      <a class="competition-reference-card ${String(item.competition_group || '').toLowerCase()}" href="${routeUrl(`/competition/${competitionRouteToken(item.identity)}`)}">
        <div class="competition-reference-top">
          <div class="competition-reference-icon">${competitionIcon(item)}</div>
          <div class="competition-reference-copy">
            <strong>${e(name)}</strong>
            <span>${e(competitionTypeLabel(item))}</span>
            <em>${e(stageText)}</em>
          </div>
          <div class="competition-reference-arrow">›</div>
        </div>
        <div class="competition-reference-stats">
          <div><span>RESULTS</span><strong>${number(resultsCount)}</strong></div>
          <div><span>ROUND</span><strong>${e(stageText)}</strong></div>
          <div><span>NEXT</span><strong>${scheduleCount ? nextDate : '—'}</strong></div>
        </div>
      </a>`;
  }

  async function readCompetitionGroupData(group) {
    const [results, schedule, reports] = await Promise.all([
      gateway.readAll('results', {
        filters: {
          competition_group: group,
          result_dataset: 'MATCH_DATA'
        },
        orderBy: 'match_date',
        orderDir: 'DESC',
        pageSize: 1000,
        maxRows: 10000
      }),
      gateway.readAll('schedule', {
        filters: { competition_group: group },
        orderBy: 'match_date',
        orderDir: 'ASC',
        pageSize: 1000,
        maxRows: 5000
      }),
      gateway.readAll('match_report', {
        filters: { competition_group: group },
        pageSize: 1000,
        maxRows: 5000
      })
    ]);

    return { results, schedule, reports };
  }

  function competitionDataError(data) {
    const sources = [data.results, data.schedule, data.reports];
    return sources.every(item => item.state === 'error')
      ? (data.results.error || data.schedule.error || data.reports.error)
      : null;
  }

  async function renderCompetitions(token, category = null) {
    renderLoadingView(category ? `Competitions · ${category}` : 'Competitions');

    if (!category) {
      const configs = competitionGroupConfig();

      const summaries = await Promise.all(configs.map(async config => {
        const [results, schedule, reports] = await Promise.all([
          gateway.total('results', {
            competition_group: config.value,
            result_dataset: 'MATCH_DATA'
          }),
          gateway.total('schedule', { competition_group: config.value }),
          gateway.total('match_report', { competition_group: config.value })
        ]);

        return { config, results, schedule, reports };
      }));

      if (token !== state.renderToken) return;

      const sections = summaries.map(({ config, results, schedule, reports }) => {
        const hardError = [results, schedule, reports].every(item => item.state === 'error');

        if (hardError) {
          return `
            <section class="competition-group-panel ${config.slug}">
              <div class="competition-group-head">
                <div><small>${e(config.value)}</small><h3>${e(config.label)}</h3></div>
                <div class="competition-group-icon">${config.icon}</div>
              </div>
              ${gatewayError(results.error || schedule.error || reports.error)}
            </section>`;
        }

        const available = [];
        if (results.total) available.push(`${number(results.total)} results`);
        if (schedule.total) available.push(`${number(schedule.total)} schedule`);
        if (reports.total) available.push(`${number(reports.total)} report`);

        const content = available.length
          ? `<div class="competition-items">
               <div class="competition-item">
                 <div>
                   <strong>Dati reali disponibili</strong>
                   <div class="competition-item-meta">${available.map(value => `<span>${e(value)}</span>`).join('')}</div>
                 </div>
               </div>
             </div>`
          : unavailable('DATI NON ANCORA DISPONIBILI');

        return `
          <section class="competition-group-panel ${config.slug}">
            <div class="competition-group-head">
              <div>
                <small>${e(config.value)}</small>
                <h3>${e(config.label)}</h3>
              </div>
              <div class="competition-group-icon">${config.icon}</div>
            </div>
            ${content}
            <a class="competition-group-open" href="${routeUrl(`/competitions/${config.slug}`)}">
              Apri ${e(config.label)}
            </a>
          </section>`;
      }).join('');

      shell(
        `${sectionHead(GAME_WORLD_ID,'Competitions','/overview')}
         <section class="competition-discovery">${sections}</section>`,
        '/competitions'
      );
      return;
    }

    const config = competitionGroupConfig().find(item => item.slug === category);
    if (!config) {
      shell(
        `${sectionHead('GW001 · Competitions','Competitions','/competitions')}
         ${unavailable('SEZIONE NON DISPONIBILE')}`,
        '/competitions'
      );
      return;
    }

    const data = await readCompetitionGroupData(config.value);
    if (token !== state.renderToken) return;

    const hardError = competitionDataError(data);
    if (hardError) {
      shell(
        `${sectionHead('GW001 · Competitions',config.label,'/competitions')}
         ${gatewayError(hardError)}`,
        '/competitions'
      );
      return;
    }

    const competitions = buildCompetitionIndex(config.value, {
      results: data.results.data || [],
      schedule: data.schedule.data || [],
      reports: data.reports.data || []
    });

    const body = competitions.length
      ? `<div class="competition-reference-list">${competitions.map(competitionItem).join('')}</div>`
      : unavailable(
          'DATI NON ANCORA DISPONIBILI',
          `Nessuna competizione reale identificabile nei record con competition_group=${config.value}.`
        );

    shell(
      `${sectionHead('GW001 · Competitions','Competitions','/competitions')}
       ${competitionTabs(config.slug)}
       <div class="competition-reference-heading">
         <h3>${e(config.label)}</h3>
         <strong>${number(competitions.length)}</strong>
       </div>
       ${body}`,
      '/competitions'
    );
  }

  function competitionDetailFilters(identity, repository) {
    const filters = { competition_group: identity.group };

    if (repository === 'results') {
      filters.result_dataset = 'MATCH_DATA';
    }

    if (identity.competition_key) {
      filters.competition_key = identity.competition_key;
    } else {
      filters.sm_action = identity.sm_action;
      if (identity.sm_division) filters.sm_division = identity.sm_division;
    }

    return filters;
  }

  async function renderCompetitionDetail(token, routeToken) {
    const identity = parseCompetitionRouteToken(routeToken);

    if (!identity) {
      shell(
        `${sectionHead('GW001 · Competition','Competition Detail','/competitions')}
         ${unavailable('COMPETITION NON DISPONIBILE','Identificativo della competizione non valido.')}`,
        '/competitions'
      );
      return;
    }

    renderLoadingView('Competition Detail', `/competitions/${identity.group.toLowerCase()}`);

    const [results, schedule, reports] = await Promise.all([
      gateway.readAll('results', {
        filters: competitionDetailFilters(identity, 'results'),
        orderBy: 'match_date',
        orderDir: 'DESC',
        pageSize: 1000,
        maxRows: 10000
      }),
      gateway.readAll('schedule', {
        filters: competitionDetailFilters(identity, 'schedule'),
        orderBy: 'match_date',
        orderDir: 'ASC',
        pageSize: 1000,
        maxRows: 5000
      }),
      gateway.readAll('match_report', {
        filters: competitionDetailFilters(identity, 'match_report'),
        pageSize: 1000,
        maxRows: 5000
      })
    ]);

    if (token !== state.renderToken) return;

    const hardError = [results, schedule, reports].every(item => item.state === 'error');
    if (hardError) {
      shell(
        `${sectionHead('GW001 · Competition','Competition Detail',`/competitions/${identity.group.toLowerCase()}`)}
         ${gatewayError(results.error || schedule.error || reports.error)}`,
        '/competitions'
      );
      return;
    }

    const allEvidence = [
      ...(results.data || []),
      ...(schedule.data || []),
      ...(reports.data || [])
    ];

    if (!allEvidence.length) {
      shell(
        `${sectionHead('GW001 · Competition','Competition Detail',`/competitions/${identity.group.toLowerCase()}`)}
         ${unavailable('COMPETITION NON DISPONIBILE','Nessun record reale trovato per la competizione selezionata.')}`,
        '/competitions'
      );
      return;
    }

    const title = identity.competition_key || identity.sm_action || 'Competition Detail';

    const values = (field) => [...new Set(
      allEvidence.map(row => cleanCompetitionValue(row[field])).filter(Boolean)
    )];

    const facts = [
      ['Group', identity.group],
      ['Competition Key', identity.competition_key],
      ['sm_action', identity.sm_action],
      ['sm_division', identity.sm_division],
      ['Country', values('sm_country').join(' · ')],
      ['Stage', values('competition_stage').join(' · ')],
      ['Round', values('competition_round').join(' · ')]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');

    const identitySection = `
      <section class="detail-section">
        <h3>Competition</h3>
        <div class="fact-grid">
          ${facts.map(([label,value]) => fact(label,value)).join('')}
        </div>
      </section>`;

    const resultsSection = results.data?.length
      ? `<section class="detail-section">
           <h3>Results</h3>
           <div class="view-summary">
             <strong>${number(results.data.length)}</strong>
             <span>risultati reali</span>
           </div>
           <div class="match-list">
             ${results.data.map(row => matchCard(row,'results')).join('')}
           </div>
         </section>`
      : '';

    const scheduleSection = schedule.data?.length
      ? `<section class="detail-section">
           <h3>Schedule</h3>
           <div class="view-summary">
             <strong>${number(schedule.data.length)}</strong>
             <span>fixture reali</span>
           </div>
           <div class="match-list">
             ${schedule.data.map(row => matchCard(row,'schedule')).join('')}
           </div>
         </section>`
      : '';

    const reportSection = reports.data?.length
      ? `<section class="detail-section">
           <h3>Match Reports</h3>
           <div class="view-summary">
             <strong>${number(reports.data.length)}</strong>
             <span>report collegati</span>
           </div>
           <div class="match-list">
             ${reports.data.map(row => matchCard(row,'results')).join('')}
           </div>
         </section>`
      : '';

    shell(
      `${sectionHead('GW001 · Competition',title,`/competitions/${identity.group.toLowerCase()}`)}
       ${identitySection}
       ${resultsSection}
       ${scheduleSection}
       ${reportSection}`,
      '/competitions'
    );
  }

  async function renderTeamHub(token, tab = 'clubs') {
    renderLoadingView('Team Hub');
    if (tab === 'nations') {
      const nations = await gateway.read('nations', { limit: 200 });
      if (token !== state.renderToken) return;
      shell(`${sectionHead(GAME_WORLD_ID,'Team Hub','/overview')}${teamTabs('nations')}${nations.state === 'error' ? gatewayError(nations.error) : unavailable('DATI NON ANCORA DISPONIBILI','Il repository nations non contiene record reali utilizzabili.')}`, '/team-hub');
      return;
    }

    const roster = await gateway.read('player_codex_roster', { limit: 500 });
    if (token !== state.renderToken) return;
    if (roster.state === 'error') {
      shell(`${sectionHead(GAME_WORLD_ID,'Team Hub','/overview')}${teamTabs('clubs')}${gatewayError(roster.error)}`, '/team-hub');
      return;
    }
    const clubs = new Map();
    for (const row of roster.data) {
      const sm = row.sm_club_id ? `sm:${row.sm_club_id}` : null;
      const world = row.world_club_id ? `world:${row.world_club_id}` : null;
      const key = world || sm;
      if (!key) continue;
      if (!clubs.has(key)) clubs.set(key, { key, name: row.club_name, sm_club_id: row.sm_club_id, world_club_id: row.world_club_id, players: 0 });
      clubs.get(key).players += 1;
    }
    const body = clubs.size ? `<div class="club-grid">${[...clubs.values()].map(c => `<a class="club-card" href="${routeUrl(`/club/${encodeURIComponent(c.key)}`)}"><small>${c.world_club_id ? `WORLD ${e(c.world_club_id)}` : `SM ${e(c.sm_club_id)}`}</small><strong>${valueOrDash(c.name)}</strong><span>${number(c.players)} players nel roster</span></a>`).join('')}</div>` : unavailable();
    shell(`${sectionHead(GAME_WORLD_ID,'Team Hub','/overview')}${teamTabs('clubs')}${body}`, '/team-hub');
  }

  function teamTabs(active) {
    return `<div class="tabs two"><a class="tab ${active==='clubs'?'active':''}" href="${routeUrl('/team-hub/clubs')}">Clubs</a><a class="tab ${active==='nations'?'active':''}" href="${routeUrl('/team-hub/nations')}">Nations</a></div>`;
  }

  async function renderClubDetail(token, key) {
    const [namespace, id] = decodeURIComponent(key).split(':');
    renderLoadingView('Club Detail', '/team-hub/clubs');
    const rosterFilter = namespace === 'world' ? { world_club_id: id } : { sm_club_id: id };
    const roster = await gateway.read('player_codex_roster', { limit: 200, filters: rosterFilter, cache: false });
    if (token !== state.renderToken) return;
    const first = firstReal(roster.data);
    const body = roster.data.length ? `<section class="detail-section"><h3>${valueOrDash(first?.club_name)}</h3><div class="player-grid compact">${roster.data.map(r => `<a class="player-card compact" href="${routeUrl(`/player/${encodeURIComponent(r.sm_player_id)}`)}"><div class="player-copy"><strong>SM ${e(r.sm_player_id)}</strong><span>${valueOrDash(r.squad_status)}</span></div></a>`).join('')}</div></section>` : unavailable('CLUB NON DISPONIBILE');
    shell(`${sectionHead('GW001 · Team Hub','Club Detail','/team-hub/clubs')}${body}`, '/team-hub');
  }

  async function renderManagers(token, tab = 'imc') {
    renderLoadingView('Managers');
    const tabs = `<div class="tabs two"><a class="tab ${tab==='imc'?'active':''}" href="${routeUrl('/managers/imc')}">IMC</a><a class="tab ${tab==='external'?'active':''}" href="${routeUrl('/managers/external')}">External</a></div>`;

    if (tab === 'external') {
      if (token !== state.renderToken) return;
      shell(`${sectionHead(GAME_WORLD_ID,'Managers','/overview')}${tabs}${unavailable('DATI NON ANCORA DISPONIBILI','La tab External non è stata modificata.')}`, '/managers');
      return;
    }

    const managers = [{"manager_id":"MNG029","full_name":"Al Zubeidi","sm_manager_id":"4455966","team_id":"86","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG011","full_name":"Alessandro Berardi","sm_manager_id":"7639079","team_id":"149","nation_id":"68","start_date":"2026-06-30"},{"manager_id":"MNG038","full_name":"Armando De Giulio","sm_manager_id":"3493065","team_id":"132","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG039","full_name":"Attilio Bonnici","sm_manager_id":"7923128","team_id":"137","nation_id":"7","start_date":"2026-06-30"},{"manager_id":"MNG026","full_name":"Clemente Liggi","sm_manager_id":"6496793","team_id":"83","nation_id":"16","start_date":"2026-06-30"},{"manager_id":"MNG027","full_name":"Danilo FC 1908","sm_manager_id":"7279515","team_id":"129","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG019","full_name":"Davide Rapisarda","sm_manager_id":"5537229","team_id":"133","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG036","full_name":"Emanuele Delli Calici","sm_manager_id":"20605515","team_id":"146","nation_id":"22","start_date":"2026-08-25"},{"manager_id":"MNG028","full_name":"Fabio Ferrini","sm_manager_id":"2909837","team_id":"122","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG012","full_name":"Federico Bonzi","sm_manager_id":"22321164","team_id":"88","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG043","full_name":"Francesco Rossi","sm_manager_id":"3619783","team_id":"130","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG008","full_name":"Giorgio Grugni","sm_manager_id":"3702536","team_id":"111","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG013","full_name":"Giovanni Cabrioli","sm_manager_id":"8006256","team_id":"126","nation_id":"27","start_date":"2026-06-30"},{"manager_id":"MNG014","full_name":"Giovanni Iodice","sm_manager_id":"1052349","team_id":"101","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG034","full_name":"Igor Zanotto","sm_manager_id":"19303946","team_id":"145","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG030","full_name":"Lauro Crasti","sm_manager_id":"20338205","team_id":"89","nation_id":"14","start_date":"2026-06-30"},{"manager_id":"MNG031","full_name":"Lorenzo Errico","sm_manager_id":"2254039","team_id":"128","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG009","full_name":"Luca Nudo","sm_manager_id":"3750517","team_id":"127","nation_id":"11","start_date":"2026-06-30"},{"manager_id":"MNG004","full_name":"Luciano Catalano","sm_manager_id":"1494690","team_id":"139","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG037","full_name":"Marco Catalozzo","sm_manager_id":"20395773","team_id":"144","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG015","full_name":"Marco Fioretti","sm_manager_id":"1796567","team_id":"85","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG040","full_name":"Mathieu Pioche","sm_manager_id":"3122610","team_id":"138","nation_id":"64","start_date":"2026-06-30"},{"manager_id":"MNG035","full_name":"Matteo Giovi","sm_manager_id":"9887891","team_id":"81","nation_id":"69","start_date":"2026-06-30"},{"manager_id":"MNG003","full_name":"Matteo Sartori","sm_manager_id":"20670677","team_id":"84","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG010","full_name":"Mattia Bertonati","sm_manager_id":"10762592","team_id":"121","nation_id":"49","start_date":"2026-06-30"},{"manager_id":"MNG002","full_name":"Max Palace","sm_manager_id":"5249538","team_id":"136","nation_id":"20","start_date":"2026-06-30"},{"manager_id":"MNG023","full_name":"Max Zanoni","sm_manager_id":"5143835","team_id":"134","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG042","full_name":"Nick Keyen","sm_manager_id":"2614539","team_id":"87","nation_id":"17","start_date":"2026-06-30"},{"manager_id":"MNG025","full_name":"Nicolae Sasarman","sm_manager_id":"2982514","team_id":"123","nation_id":"46","start_date":"2026-06-30"},{"manager_id":"MNG022","full_name":"Oleksandr Medvid","sm_manager_id":"1284739","team_id":"142","nation_id":"8","start_date":"2026-06-30"},{"manager_id":"MNG006","full_name":"Pep Buitre","sm_manager_id":"20881721","team_id":"148","nation_id":"2","start_date":"2026-06-30"},{"manager_id":"MNG017","full_name":"Ringhio Gattuso","sm_manager_id":"1411779","team_id":"124","nation_id":"57","start_date":"2026-06-30"},{"manager_id":"MNG041","full_name":"Rosario Giamundo","sm_manager_id":"1993750","team_id":"131","nation_id":null,"start_date":"2026-06-30"},{"manager_id":"MNG016","full_name":"Saverio Cordiano","sm_manager_id":"3166489","team_id":"82","nation_id":"4","start_date":"2026-06-30"},{"manager_id":"MNG033","full_name":"Simone Campanella","sm_manager_id":"1794994","team_id":"143","nation_id":"53","start_date":"2026-06-30"},{"manager_id":"MNG005","full_name":"Sir Simone","sm_manager_id":"7235173","team_id":"135","nation_id":"6","start_date":"2026-06-30"},{"manager_id":"MNG001","full_name":"Tommaso Mello","sm_manager_id":"13051324","team_id":"150","nation_id":"1","start_date":"2026-06-30"},{"manager_id":"MNG021","full_name":"Tommaso Prisco","sm_manager_id":"23150225","team_id":"90","nation_id":"19","start_date":"2026-06-30"},{"manager_id":"MNG032","full_name":"Vardan Minasyan","sm_manager_id":"8100894","team_id":"125","nation_id":"3","start_date":"2026-06-30"},{"manager_id":"MNG007","full_name":"Vincenzo Martorano","sm_manager_id":"4774576","team_id":"91","nation_id":"47","start_date":"2026-06-30"}];
    if (token !== state.renderToken) return;

    const body = `<div class="view-summary"><strong>${number(managers.length)}</strong><span>manager IMC attivi</span></div>
      <div class="club-grid">${managers.map(manager => `
        <a class="club-card" href="${routeUrl(`/manager/${encodeURIComponent(manager.manager_id)}`)}">
          <small>${e(manager.manager_id)} · SM ${e(manager.sm_manager_id)}</small>
          <strong>${e(manager.full_name)}</strong>
          <span>Club ID ${e(manager.team_id)} · dal ${e(manager.start_date)}</span>
          ${manager.nation_id ? `<span>National Team ID ${e(manager.nation_id)} · dal ${e(manager.start_date)}</span>` : ''}
        </a>`).join('')}</div>`;

    shell(`${sectionHead(GAME_WORLD_ID,'Managers','/overview')}${tabs}${body}`, '/managers');
  }

  async function renderCodexTeams(token) {
    renderLoadingView('Codex · Teams');
    const roster = await gateway.read('player_codex_roster', { limit: 500 });
    if (token !== state.renderToken) return;
    const groups = new Map();
    for (const row of roster.data) {
      const key = row.world_club_id ? `world:${row.world_club_id}` : row.sm_club_id ? `sm:${row.sm_club_id}` : null;
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, { key, name: row.club_name, count: 0 });
      groups.get(key).count++;
    }
    const body = groups.size ? `<div class="club-grid">${[...groups.values()].map(c => `<a class="club-card" href="${routeUrl(`/club/${encodeURIComponent(c.key)}`)}"><strong>${valueOrDash(c.name)}</strong><span>${number(c.count)} players</span></a>`).join('')}</div>` : unavailable();
    shell(`${sectionHead('GW001 · Codex','Teams','/codex/players')}${codexTabs('teams')}${body}`, '/codex');
  }

  async function renderTransfers(token) {
    renderLoadingView('Transfers');
    const result = await gateway.read('transfers', { limit: 200, orderBy: 'imc_transfer_number', orderDir: 'DESC' });
    if (token !== state.renderToken) return;
    let body;
    if (result.state === 'error') body = gatewayError(result.error);
    else if (result.state === 'empty') body = unavailable('DATI NON ANCORA DISPONIBILI','Il repository transfers esiste ma oggi contiene 0 record.');
    else body = `<div class="transfer-list">${result.data.map(r => `<a class="transfer-card" href="${routeUrl(`/transfer/${encodeURIComponent(r.imc_transfer_number)}`)}"><strong>${valueOrDash(r.player_name)}</strong><span>${valueOrDash(r.club_from)} → ${valueOrDash(r.club_to)}</span><b>${valueOrDash(r.amount_text)}</b></a>`).join('')}</div>`;
    shell(`${sectionHead(GAME_WORLD_ID,'Transfers','/overview')}${body}`, '/transfers');
  }

  async function renderTransferDetail(token, transferNumber) {
    renderLoadingView('Transfer Detail', '/transfers');
    const result = await gateway.read('transfers', { limit: 10, filters: { imc_transfer_number: transferNumber }, cache: false });
    if (token !== state.renderToken) return;
    const row = firstReal(result.data);
    const body = row ? `<section class="detail-section"><h3>${valueOrDash(row.player_name)}</h3><div class="fact-grid">${fact('Da',row.club_from)}${fact('A',row.club_to)}${fact('Importo',row.amount_text)}${fact('Player ID',row.player_id)}</div></section>` : unavailable('TRANSFER NON DISPONIBILE');
    shell(`${sectionHead('GW001 · Transfers','Transfer Detail','/transfers')}${body}`, '/transfers');
  }

  async function renderRepositoryEmptyView(token, repository, title) {
    renderLoadingView(title);
    const result = await gateway.read(repository, { limit: 100 });
    if (token !== state.renderToken) return;
    const body = result.state === 'error' ? gatewayError(result.error)
      : result.state === 'empty' ? unavailable('DATI NON ANCORA DISPONIBILI', `Il repository ${repository} è presente ma non contiene record reali.`)
      : `<div class="data-state"><strong>${number(result.total)} record disponibili</strong></div>`;
    shell(`${sectionHead(GAME_WORLD_ID,title,'/overview')}${body}`, `/${repository.replaceAll('_','-')}`);
  }

  function renderWorldChronicle() {
    shell(`${sectionHead(GAME_WORLD_ID,'World Chronicle','/overview')}${unavailable('DATI NON ANCORA DISPONIBILI','Non esiste ancora un repository certificato per World Chronicle.')}`, '/world-chronicle');
  }

  async function renderRoute() {
    const token = ++state.renderToken;
    const parts = splitPath();
    const path = currentPath();

    if (!state.discovery && !state.discoveryError) {
      shell(loading('Discovery Universal Gateway'), path);
      try { await gateway.discover(); } catch (error) {
        if (token !== state.renderToken) return;
        shell(gatewayError(error), path);
        return;
      }
      if (token !== state.renderToken) return;
    }

    if (parts.length === 0 || parts[0] === 'overview') return renderOverview(token);
    if (parts[0] === 'calendar') return renderCalendar(token);
    if (parts[0] === 'results') return renderResults(token);
    if (parts[0] === 'match' && parts[1]) return renderMatchDetail(token, decodeURIComponent(parts[1]));

    if (parts[0] === 'competitions' && !parts[1]) return renderCompetitions(token);
    if (parts[0] === 'competitions' && ['domestic','international','nations'].includes(parts[1])) return renderCompetitions(token, parts[1]);
    if (parts[0] === 'competition' && parts[1]) return renderCompetitionDetail(token, parts.slice(1).join('/'));

    if (parts[0] === 'team-hub') return renderTeamHub(token, parts[1] === 'nations' ? 'nations' : 'clubs');
    if (parts[0] === 'club' && parts[1]) return renderClubDetail(token, decodeURIComponent(parts.slice(1).join('/')));
    if (parts[0] === 'nation' && parts[1]) return renderRepositoryEmptyView(token, 'nations', 'Nation Detail');

    if (parts[0] === 'managers') return renderManagers(token, parts[1] === 'external' ? 'external' : 'imc');
    if (parts[0] === 'manager' && parts[1]) return renderManagers(token, 'imc');

    if (parts[0] === 'codex' && (!parts[1] || parts[1] === 'players')) return renderCodexPlayers(token);
    if (parts[0] === 'codex' && parts[1] === 'teams') return renderCodexTeams(token);
    if (parts[0] === 'codex' && parts[1] === 'records') return renderRecords(token);
    if (parts[0] === 'player' && parts[1]) return renderPlayerDetail(token, decodeURIComponent(parts[1]));

    if (parts[0] === 'transfers' && !parts[1]) return renderTransfers(token);
    if (parts[0] === 'transfer' && parts[1]) return renderTransferDetail(token, decodeURIComponent(parts[1]));

    if (parts[0] === 'trophy-room') return renderRepositoryEmptyView(token, 'trophy_room', 'Trophy Room');
    if (parts[0] === 'news-feed') return renderRepositoryEmptyView(token, 'news_feed', 'News Feed');
    if (parts[0] === 'news' && parts[1]) return renderRepositoryEmptyView(token, 'news_feed', 'News Detail');
    if (parts[0] === 'world-chronicle') return renderWorldChronicle();

    shell(`${sectionHead(GAME_WORLD_ID,'Not Found','/overview')}${unavailable('VISTA NON DISPONIBILE')}`, '/overview');
  }

  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('popstate', renderRoute);
  renderRoute();
})();
