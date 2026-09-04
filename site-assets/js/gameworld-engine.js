(function () {
  'use strict';

  const WORLD_ID = String(document.body.dataset.world || '').toUpperCase();
  const ROOT = document.body.dataset.worldRoot || `/${WORLD_ID.toLowerCase().replace('gw', 'gameworld')}/`;
  if (!/^GW00[1-9]$/.test(WORLD_ID)) throw new Error('Configurazione Game World non valida.');
  const state = { world: null, matches: null, matchesPromise: null, competitions: null, competitionsPromise: null, managers: null, managersPromise: null, clubs: null, clubsPromise: null, nations: null, nationsPromise: null, teamHubTab: 'clubs', competitionTab: 'overview', competitionSubTab: 'table', matchesSubTab: 'results', statsSubTab: 'goals' };
  const MATCH_CACHE_KEY = `imc:${WORLD_ID}:matches:v2`;

  const staticSections = {
    'road-chronicle': { title: 'WORLD CHRONICLE', sub: 'Official Game World Journal', icon: 'journal', intro: 'Il giornale ufficiale del Game World.', status: 'Feed non ancora alimentato dalla Public Read API.' },
    'team-hub': { title: 'TEAM HUB', sub: 'Club · Nazionali', icon: 'teams', intro: 'Squadre, rose e percorsi nel mondo.', status: 'Schede club non ancora disponibili nella Public Read API.' },
    managers: { title: 'MANAGERS', sub: 'IMC · External', icon: 'manager', intro: 'I manager presenti nel Game World.', status: 'Dataset manager non ancora collegato.' },
    codex: { title: 'CODEX', sub: 'Archivio del GW', icon: 'codex', intro: 'Giocatori, record e memoria storica del mondo.', status: 'Player Codex non disponibile per GW001.' },
    transfers: { title: 'TRANSFERS', sub: 'Mercato del GW', icon: 'transfers', intro: 'Movimenti di mercato e dettagli delle operazioni.', status: 'Importazione in corso · Coming soon.' },
    'trophy-room': { title: 'TROPHY ROOM', sub: 'Trofei del GW', icon: 'competitions', intro: 'Albo d’oro e trofei del Game World.', status: 'Dataset Trophy Room non ancora collegato.' },
    'news-feed': { title: 'NEWS FEED', sub: 'News del GW', icon: 'journal', intro: 'Notizie e aggiornamenti del Game World.', status: 'Feed non ancora collegato.' }
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

  function loadCompetitions() {
    if (state.competitions) return Promise.resolve(state.competitions);
    if (!state.competitionsPromise) {
      state.competitionsPromise = IMCDataService.getCompetitions(WORLD_ID, seasonNumber())
        .then(payload => {
          state.competitions = Array.isArray(payload.data) ? payload.data : [];
          return state.competitions;
        })
        .finally(() => { state.competitionsPromise = null; });
    }
    return state.competitionsPromise;
  }

  function loadManagers() {
    if (state.managers) return Promise.resolve(state.managers);
    if (!state.managersPromise) {
      state.managersPromise = IMCDataService.getManagers(WORLD_ID)
        .then(payload => {
          state.managers = Array.isArray(payload.data) ? payload.data : [];
          return state.managers;
        })
        .finally(() => { state.managersPromise = null; });
    }
    return state.managersPromise;
  }

  function loadClubs() {
    if (state.clubs) return Promise.resolve(state.clubs);
    if (!state.clubsPromise) {
      state.clubsPromise = IMCDataService.getClubs(WORLD_ID)
        .then(payload => {
          state.clubs = Array.isArray(payload.data) ? payload.data : [];
          return state.clubs;
        })
        .finally(() => { state.clubsPromise = null; });
    }
    return state.clubsPromise;
  }

  function loadNations() {
    if (state.nations) return Promise.resolve(state.nations);
    if (!state.nationsPromise) {
      state.nationsPromise = IMCDataService.getNations(WORLD_ID)
        .then(payload => {
          state.nations = Array.isArray(payload.data) ? payload.data : [];
          return state.nations;
        })
        .finally(() => { state.nationsPromise = null; });
    }
    return state.nationsPromise;
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

  function logicalCompetitionName(competition) {
    const code = String(competition?.competition_code || '').toUpperCase();
    const canonicalLabels = {
      LEAGUE: competition?.division_value ? `League Division ${competition.division_value}` : 'League',
      NATIONAL_CUP: 'National Cup',
      LEAGUE_CUP: 'League Cup',
      CHARITY_SHIELD: 'Charity Shield',
      SMFA_CHAMPIONS: 'SMFA Champions',
      SMFA_SHIELD: 'SMFA Shield',
      SMFA_SUPER_CUP: 'SMFA Super Cup',
      INTERNATIONAL_QUALIFIER: 'International Qualifier',
      WORLD_CUP: 'World Cup'
    };
    if (canonicalLabels[code]) return canonicalLabels[code];
    const original = competitionName(competition);
    const round = String(competition?.round_label || '').trim();
    if (round && original.toLowerCase().endsWith(round.toLowerCase())) {
      return original.slice(0, -round.length).trim().replace(/[·|—-]+$/, '').trim();
    }
    return original;
  }

  function competitionCategory(competition) {
    const storedGroup = String(competition?.competition_group || '').toLowerCase();
    return ['domestic', 'international', 'nations'].includes(storedGroup) ? storedGroup : 'unclassified';
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
    return `<div class="page-stack">${worldHero()}${metricStrip()}<section class="hub-grid hub-grid-gw002">
      ${hubCard('competitions', 'COMPETITIONS', `${state.world.summary.competition_count} competizioni`, 'competitions', 'hub-competitions', 'MYSQL LIVE')}
      ${hubCard('managers', 'MANAGERS', 'IMC · External', 'manager', 'hub-managers')}
      ${hubCard('team-hub', 'TEAM HUB', 'Club · Nazionali', 'teams', 'hub-team')}
      ${hubCard('trophy-room', 'TROPHY ROOM', 'Trofei del GW', 'competitions', 'hub-trophy')}
      ${hubCard('news-feed', 'NEWS FEED', 'News del GW', 'journal', 'hub-news')}
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
    const competition = match.competition || {};
    const master = competition.competition_master_id || competition.competition_code || 'unclassified';
    const country = competition.country_code || 'GLOBAL';
    const division = competition.division_value || 'ALL';
    return `${master}:${country}:${division}`;
  }

  function competitionGroups() {
    if (!Array.isArray(state.competitions)) return [];
    const matches = Array.isArray(state.matches) ? state.matches : [];
    return state.competitions.map(item => {
      const rows = matches.filter(match => {
        const competition = match.competition || {};
        return Number(competition.competition_master_id) === Number(item.competition_master_id)
          && String(competition.division_value || 'ALL') === String(item.division_value || 'ALL')
          && String(competition.country_code || 'GLOBAL') === String(item.country_code || 'GLOBAL');
      });
      return {
        key: item.competition_key,
        competition: {
          name: item.name,
          type: item.type,
          competition_master_id: item.competition_master_id,
          competition_code: item.competition_code,
          competition_group: item.competition_group,
          division_value: item.division_value,
          country_code: item.country_code,
          hierarchy_path: item.hierarchy_path
        },
        matches: rows,
        total: Number(item.counts?.fixtures || rows.length),
        results: Number(item.counts?.results || 0),
        scheduled: Number(item.counts?.schedule || 0),
        reports: Number(item.counts?.reports || 0)
      };
    });
  }

  function competitionCard(group) {
    const type = competitionType(group.competition);
    const progress = group.total ? Math.round((group.results / group.total) * 100) : 0;
    return `<a class="competition-card" data-competition-type="${esc(type)}" href="${ROOT}competitions/${encodeURIComponent(group.key)}/">
      <div class="competition-mark">${icon('competitions')}</div>
      <div class="competition-copy"><small>${esc(type.toUpperCase())}</small><h2>${esc(competitionName(group.competition))}</h2><span>${esc(group.total ?? group.matches.length)} FIXTURE</span></div>
      <dl><div><dt>RESULTS</dt><dd>${esc(group.results)}</dd></div><div><dt>UPCOMING</dt><dd>${esc(group.scheduled)}</dd></div><div><dt>REPORTS</dt><dd>${esc(group.reports)}</dd></div></dl>
      <div class="competition-progress"><i style="width:${esc(progress)}%"></i></div><b>›</b>
    </a>`;
  }

  function categoryIcon(category) {
    if (category === 'international') return '<circle cx="32" cy="32" r="20"/><path d="M12 32h40M32 12c8 8 11 14 11 20s-3 12-11 20M32 12c-8 8-11 14-11 20s3 12 11 20M17 20c9 6 21 6 30 0M17 44c9-6 21-6 30 0"/>';
    if (category === 'nations') return '<path d="M18 10v45M20 14c12-8 20 5 33-2v25c-13 7-21-6-33 2Z"/><path d="M18 55h18"/>';
    return icon('competitions');
  }

  function competitionHubCard(category, title, description, count) {
    return `<a class="competition-hub-card competition-hub-${category}" href="${ROOT}competitions/${category}/">
      <div class="competition-hub-icon">${categoryIcon(category)}</div>
      <div class="competition-hub-copy"><h2>${esc(title)}</h2><p>${esc(description)}</p><strong>${esc(count)}</strong><span>COMPETITIONS</span></div>
      <div class="competition-hub-art">${categoryIcon(category)}</div><b>›</b>
    </a>`;
  }

  function competitions() {
    const groups = competitionGroups();
    const count = category => groups.filter(group => competitionCategory(group.competition) === category).length;
    return `<section class="section-page competition-hub-page">
      <section class="competition-world-strip"><div><strong>${esc(WORLD_ID)}</strong><span>${esc(worldName()).toUpperCase()}</span></div><div><b>SEASON ${esc(seasonNumber())}</b><small>${esc(formatDate(state.world.season.start_date))} — ${esc(formatDate(state.world.season.end_date))}</small></div></section>
      <div class="competition-hub-list">
        ${competitionHubCard('domestic', 'DOMESTIC', 'Leagues, National Cup, League Cup', count('domestic'))}
        ${competitionHubCard('international', 'INTERNATIONAL', 'SMFA Champions, SMFA Shield, Super Cup', count('international'))}
        ${competitionHubCard('nations', 'NATIONS', 'World Cup, Qualifiers, National Teams', count('nations'))}
      </div>
    </section>`;
  }

  function competitionCategoryPage(category) {
    const labels = { domestic: 'DOMESTIC', international: 'INTERNATIONAL', nations: 'NATIONS' };
    const groups = competitionGroups().filter(group => competitionCategory(group.competition) === category);
    return `<section class="section-page">${pageHead(labels[category], `${groups.length} competizioni · Season ${seasonNumber()}`, 'competitions', `${ROOT}competitions/`)}
      <div class="competition-list competition-category-list">${groups.map(competitionCard).join('') || '<div class="empty-state"><strong>NESSUNA COMPETIZIONE</strong><span>Il database non contiene competizioni per questa categoria.</span></div>'}</div>
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

  function competitionDetailTabs() {
    const tabs = [['overview', 'OVERVIEW'], ['competition', 'COMPETITION'], ['matches', 'MATCHES'], ['stats', 'STATS'], ['history', 'HISTORY']];
    return `<nav class="competition-detail-tabs">${tabs.map(([key, label]) => `<button type="button" data-competition-tab="${key}" class="${state.competitionTab === key ? 'active' : ''}">${label}</button>`).join('')}</nav>`;
  }

  function compactMatches(rows) {
    return rows.length ? `<div class="match-list compact-match-list">${dateGroups(rows).map(([date, matches]) => `<section class="matchday-group"><header><div><small>MATCH DAY</small><h2>${esc(formatDate(date, true))}</h2></div><span>${matches.length} MATCH</span></header><div>${matches.map(matchCard).join('')}</div></section>`).join('')}</div>` : '<div class="empty-state"><strong>NESSUN MATCH</strong><span>Questa vista verrà popolata quando il dataset sarà disponibile.</span></div>';
  }

  function competitionOverview(group) {
    const played = group.results;
    const total = group.matches.length;
    const percentage = total ? Math.round((played / total) * 100) : 0;
    const ordered = [...group.matches].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    const last = [...ordered].reverse().find(match => match.result);
    const next = ordered.find(match => !match.result);
    return `<section class="competition-status"><div><span>COMPETITION STATUS</span><strong>${played}<i>/</i>${total}</strong><small>MATCHES PLAYED</small></div><div class="competition-status-bar"><b style="width:${percentage}%"></b></div><em>${percentage}%</em></section>
      <div class="competition-overview-grid">${last ? `<article><span>LAST MATCH</span>${matchCard(last)}</article>` : ''}${next ? `<article><span>NEXT MATCH</span>${matchCard(next)}</article>` : ''}</div>`;
  }

  function competitionStructure(group) {
    const type = competitionType(group.competition);
    const isLeague = type === 'league';
    const isHybrid = ['smfacup', 'smfashield', 'interqualifier'].includes(type);
    const tabs = isLeague ? [['table', 'TABLE']] : isHybrid ? [['groups', 'GROUP STAGE'], ['knockout', 'KNOCKOUT']] : [['knockout', 'KNOCKOUT']];
    if (!tabs.some(([key]) => key === state.competitionSubTab)) state.competitionSubTab = tabs[0][0];
    const rounds = new Map();
    group.matches.forEach(match => {
      const round = match.competition?.round_label || 'MATCHES';
      if (!rounds.has(round)) rounds.set(round, []);
      rounds.get(round).push(match);
    });
    const body = isLeague ? '<div class="empty-state"><strong>TABLE</strong><span>Struttura pronta. La classifica verrà collegata al relativo dataset.</span></div>' : `<div class="competition-rounds">${[...rounds.entries()].map(([round, rows]) => `<section><h3>${esc(round)}</h3>${compactMatches(rows)}</section>`).join('')}</div>`;
    return `<nav class="competition-subtabs">${tabs.map(([key, label]) => `<button type="button" data-competition-subtab="${key}" class="${state.competitionSubTab === key ? 'active' : ''}">${label}</button>`).join('')}</nav>${body}`;
  }

  function competitionMatches(group) {
    const tabs = [['results', 'RESULTS'], ['schedule', 'SCHEDULE'], ['reports', 'REPORTS']];
    const rows = state.matchesSubTab === 'results' ? group.matches.filter(match => match.result) : state.matchesSubTab === 'schedule' ? group.matches.filter(match => !match.result) : group.matches.filter(match => match.availability?.match_report);
    return `<nav class="competition-subtabs">${tabs.map(([key, label]) => `<button type="button" data-matches-subtab="${key}" class="${state.matchesSubTab === key ? 'active' : ''}">${label}</button>`).join('')}</nav>${compactMatches(rows)}`;
  }

  function competitionStats() {
    const tabs = [['goals', 'GOALS'], ['assists', 'ASSISTS'], ['rating', 'RATING'], ['mom', 'MOM'], ['cards', 'CARDS']];
    return `<nav class="competition-subtabs competition-stat-tabs">${tabs.map(([key, label]) => `<button type="button" data-stats-subtab="${key}" class="${state.statsSubTab === key ? 'active' : ''}">${label}</button>`).join('')}</nav><div class="empty-state"><strong>${esc(state.statsSubTab.toUpperCase())}</strong><span>Tab Nexus replicata. Il dataset statistiche giocatori verrà collegato separatamente.</span></div>`;
  }

  function competitionDetailPage(groupKey) {
    const group = competitionGroups().find(item => item.key === groupKey);
    if (!group) return errorPage('Competizione non trovata.');
    let body = competitionOverview(group);
    if (state.competitionTab === 'competition') body = competitionStructure(group);
    else if (state.competitionTab === 'matches') body = competitionMatches(group);
    else if (state.competitionTab === 'stats') body = competitionStats();
    else if (state.competitionTab === 'history') body = '<div class="empty-state"><strong>HISTORY</strong><span>Albo d’oro e vincitori verranno collegati al dataset storico.</span></div>';
    return `<section class="section-page competition-detail-page">${pageHead(competitionName(group.competition), `${group.matches.length} fixture · Season ${seasonNumber()}`, 'competitions', `${ROOT}competitions/${competitionCategory(group.competition)}/`)}${competitionDetailTabs()}<main class="competition-detail-body">${body}</main></section>`;
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
      back = `${ROOT}competitions/${competitionCategory(rows[0]?.competition)}/`;
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

  function teamInitials(name) {
    return String(name || 'IMC').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
  }

  function teamHubCard(item, type) {
    const isNation = type === 'nations';
    const name = item.name || (isNation ? `Nation ${item.nation_id}` : `Club ${item.club_id}`);
    const globalId = isNation ? item.nation_id : item.club_id;
    const worldId = isNation ? item.nation_gw_id : item.club_gw_id;
    const image = item.image_url
      ? `<img src="${esc(item.image_url)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${esc(teamInitials(name))}</span>`
      : `<span>${esc(teamInitials(name))}</span>`;
    return `<article class="team-hub-card">
      <div class="team-hub-logo">${image}</div>
      <div class="team-hub-copy"><small>${isNation ? 'NATIONAL TEAM' : 'CLUB'}</small><h2>${esc(name)}</h2><p>${esc(WORLD_ID)} · ${isNation ? 'NATION' : 'CLUB'} GW ID ${esc(worldId)}</p></div>
      <div class="team-hub-id"><span>${isNation ? 'NATION ID' : 'CLUB ID'}</span><strong>${esc(globalId)}</strong></div>
    </article>`;
  }

  function teamHubPage() {
    const active = state.teamHubTab;
    const rows = active === 'nations' ? (state.nations || []) : (state.clubs || []);
    const label = active === 'nations' ? 'NAZIONALI' : 'CLUB';
    const content = rows.length
      ? `<div class="team-hub-list">${rows.map(item => teamHubCard(item, active)).join('')}</div>`
      : `<div class="empty-state"><strong>NESSUN ${label}</strong><span>Non risultano associazioni per questo Game World.</span></div>`;
    return `<section class="section-page team-hub-page">${pageHead('TEAM HUB', `${state.clubs?.length || 0} club · ${state.nations?.length || 0} nazionali`, 'teams')}
      <nav class="competition-subtabs team-hub-tabs">
        <button type="button" class="${active === 'clubs' ? 'active' : ''}" data-team-hub-tab="clubs">CLUB <span>${esc(state.clubs?.length || 0)}</span></button>
        <button type="button" class="${active === 'nations' ? 'active' : ''}" data-team-hub-tab="nations">NATIONS <span>${esc(state.nations?.length || 0)}</span></button>
      </nav>
      <section class="team-hub-summary"><small>${esc(WORLD_ID)} · ACTIVE ${esc(label)}</small><strong>${esc(rows.length)}</strong><span>${icon('teams')}</span></section>
      ${content}
    </section>`;
  }

  function managerInitials(name) {
    return String(name || 'IMC').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
  }

  function managerCard(item) {
    const manager = item.manager || {};
    const club = item.club || {};
    const assignment = item.assignment || {};
    return `<article class="manager-card">
      <div class="manager-avatar">${esc(managerInitials(manager.full_name))}</div>
      <div class="manager-copy"><small>${esc(manager.manager_id || 'IMC MANAGER')}</small><h2>${esc(manager.full_name || 'Manager non disponibile')}</h2><p>${esc(club.name || 'Club non disponibile')}</p></div>
      <div class="manager-meta"><span>IMC</span><small>DAL ${esc(formatDate(assignment.start_date))}</small></div>
    </article>`;
  }

  function managersPage() {
    const rows = Array.isArray(state.managers) ? state.managers : [];
    const content = rows.length ? `<div class="manager-list">${rows.map(managerCard).join('')}</div>` : '<div class="empty-state"><strong>NESSUN MANAGER IMC</strong><span>Non risultano assegnazioni club attive per questo Game World.</span></div>';
    return `<section class="section-page managers-page">${pageHead('MANAGERS', `${rows.length} manager IMC assegnati`, 'manager')}
      <nav class="competition-subtabs section-placeholder-tabs"><button type="button" class="active">IMC</button><button type="button" disabled>EXTERNAL</button></nav>
      <section class="manager-summary"><div><small>ACTIVE ASSIGNMENTS</small><strong>${esc(rows.length)}</strong><span>IMC MANAGERS</span></div><span>${icon('manager')}</span></section>
      ${content}
    </section>`;
  }

  function staticSection(key) {
    const section = staticSections[key] || staticSections.codex;
    const tabs = key === 'team-hub' ? ['CLUB', 'NATIONS'] : key === 'managers' ? ['IMC', 'EXTERNAL'] : key === 'transfers' ? ['ALL TRANSFERS', 'ENTRATE', 'USCITE'] : key === 'codex' ? ['PLAYERS', 'TEAMS', 'RECORDS'] : [];
    return `<section class="section-page">${pageHead(section.title, section.sub, section.icon)}${tabs.length ? `<nav class="competition-subtabs section-placeholder-tabs">${tabs.map((tab, index) => `<button type="button" class="${index === 0 ? 'active' : ''}">${tab}</button>`).join('')}</nav>` : ''}<div class="static-intro"><span>${icon(section.icon)}</span><p>${esc(section.intro)}</p></div><div class="empty-state"><strong>${key === 'transfers' ? 'COMING SOON' : 'STRUTTURA PRONTA'}</strong><span>${esc(section.status)}</span></div></section>`;
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
      const teamHubTab = event.target.closest?.('[data-team-hub-tab]');
      if (teamHubTab) {
        state.teamHubTab = teamHubTab.dataset.teamHubTab;
        renderRoute();
        return;
      }
            const competitionTab = event.target.closest?.('[data-competition-tab]');
      if (competitionTab) {
        state.competitionTab = competitionTab.dataset.competitionTab;
        renderRoute();
        return;
      }
      const competitionSubTab = event.target.closest?.('[data-competition-subtab]');
      if (competitionSubTab) {
        state.competitionSubTab = competitionSubTab.dataset.competitionSubtab;
        renderRoute();
        return;
      }
      const matchesSubTab = event.target.closest?.('[data-matches-subtab]');
      if (matchesSubTab) {
        state.matchesSubTab = matchesSubTab.dataset.matchesSubtab;
        renderRoute();
        return;
      }
      const statsSubTab = event.target.closest?.('[data-stats-subtab]');
      if (statsSubTab) {
        state.statsSubTab = statsSubTab.dataset.statsSubtab;
        renderRoute();
        return;
      }
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith(ROOT)) return;
      event.preventDefault();
      close();
      history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
      renderRoute();
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
        return;
      }
      if (route === 'team-hub') {
        app.innerHTML = routeLoading('TEAM HUB', 'Caricamento club e nazionali', 'teams');
        await Promise.all([loadClubs(), loadNations()]);
        app.innerHTML = teamHubPage();
        return;
      }
      if (route === 'managers') {
        app.innerHTML = routeLoading('MANAGERS', 'Caricamento manager IMC', 'manager');
        await loadManagers();
        app.innerHTML = managersPage();
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
      if (route === 'competitions') {
        await loadCompetitions();
        if (parts[1] && !['domestic', 'international', 'nations'].includes(parts[1])) await loadMatches();
      } else {
        await loadMatches();
      }

      if (route === 'competitions' && ['domestic', 'international', 'nations'].includes(parts[1])) app.innerHTML = competitionCategoryPage(parts[1]);
      else if (route === 'competitions' && parts[1]) app.innerHTML = competitionDetailPage(decodeURIComponent(parts[1]));
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
      const worldPayload = await IMCDataService.getWorld(WORLD_ID);
      state.world = worldPayload.data;
      document.title = `${WORLD_ID} · ${state.world.name} | Italian Masters Club`;
      document.querySelectorAll('[data-world-name]').forEach(node => { node.textContent = state.world.name; });
      document.querySelectorAll('[data-world-code]').forEach(node => { node.textContent = WORLD_ID; });
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
