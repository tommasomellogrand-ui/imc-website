(() => {
  'use strict';

  const APP = document.getElementById('app');
  const GATEWAY = 'https://www.italianmastersclub.it/api/imc-gateway/';
  const WORLD = 'GW001';
  const LABELS = Object.freeze({
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

  let enhanceToken = 0;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function path() {
    const raw = location.hash.replace(/^#/, '') || '/overview';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  function identityFromRoute() {
    const match = path().match(/^\/competition\/(.+)$/);
    if (!match) return null;
    try {
      const identity = JSON.parse(decodeURIComponent(match[1]));
      if (!identity || typeof identity !== 'object') return null;
      return {
        group: String(identity.group || '').toUpperCase(),
        competition_key: identity.competition_key || null,
        sm_action: identity.sm_action || null,
        sm_division: identity.sm_division || null
      };
    } catch (_) {
      return null;
    }
  }

  function displayName(identity) {
    if (identity.competition_key) return identity.competition_key;
    const action = String(identity.sm_action || '').toLowerCase();
    const base = LABELS[action] || identity.sm_action || 'Competition';
    return action === 'league' && identity.sm_division ? `${base} Div ${identity.sm_division}` : base;
  }

  function baseFilters(identity, includeDataset = false) {
    const filters = { competition_group: identity.group };
    if (includeDataset) filters.result_dataset = 'MATCH_DATA';
    if (identity.competition_key) filters.competition_key = identity.competition_key;
    else {
      if (identity.sm_action) filters.sm_action = identity.sm_action;
      if (identity.sm_division) filters.sm_division = identity.sm_division;
    }
    return filters;
  }

  async function read(repository, filters = {}, options = {}) {
    const data = [];
    const pageSize = Math.min(1000, options.pageSize || 1000);
    let offset = 0;
    let total = null;
    for (let page = 0; page < 12; page += 1) {
      const url = new URL(GATEWAY);
      url.searchParams.set('game_world_id', WORLD);
      url.searchParams.set('action', 'read');
      url.searchParams.set('repository', repository);
      url.searchParams.set('limit', String(pageSize));
      url.searchParams.set('offset', String(offset));
      if (options.orderBy) url.searchParams.set('order_by', options.orderBy);
      if (options.orderDir) url.searchParams.set('order_dir', options.orderDir);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.set(`filter_${key}`, String(value));
        }
      });
      const response = await fetch(url.toString(), { cache: 'no-store', headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error || `HTTP_${response.status}`);
      const rows = Array.isArray(payload.data) ? payload.data : [];
      if (total === null) total = Number(payload.pagination?.total ?? rows.length);
      data.push(...rows);
      offset += rows.length;
      if (!rows.length || offset >= total || rows.length < pageSize) break;
    }
    return data;
  }

  function numeric(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function fixtureTeams(rows) {
    const teams = new Map();
    rows.forEach(row => {
      const pairs = [
        [row.home_sm_club_id || row.home_sm_team_id || row.home_name, row.home_name],
        [row.away_sm_club_id || row.away_sm_team_id || row.away_name, row.away_name]
      ];
      pairs.forEach(([id, name]) => {
        if (!id && !name) return;
        const key = String(id || name);
        if (!teams.has(key)) teams.set(key, { key, name: name || `Team ${key}` });
      });
    });
    return teams;
  }

  function standings(rows) {
    const table = new Map();
    function team(id, name) {
      const key = String(id || name || 'unknown');
      if (!table.has(key)) table.set(key, { key, name: name || `Team ${key}`, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
      return table.get(key);
    }
    rows.forEach(row => {
      const hs = numeric(row.home_score);
      const as = numeric(row.away_score);
      if (hs === null || as === null) return;
      const home = team(row.home_sm_club_id || row.home_sm_team_id, row.home_name);
      const away = team(row.away_sm_club_id || row.away_sm_team_id, row.away_name);
      home.p += 1; away.p += 1; home.gf += hs; home.ga += as; away.gf += as; away.ga += hs;
      if (hs > as) { home.w += 1; away.l += 1; home.pts += 3; }
      else if (hs < as) { away.w += 1; home.l += 1; away.pts += 3; }
      else { home.d += 1; away.d += 1; home.pts += 1; away.pts += 1; }
    });
    return [...table.values()].sort((a,b) => b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || a.name.localeCompare(b.name));
  }

  function playerLeaders(rows) {
    const players = new Map();
    rows.forEach(row => {
      if (!row.sm_player_id) return;
      const key = String(row.sm_player_id);
      if (!players.has(key)) players.set(key, { id:key, name:row.player_name || `Player ${key}`, goals:0, assists:0, apps:0, ratingSum:0, ratingCount:0 });
      const p = players.get(key);
      p.goals += numeric(row.goals) || 0;
      p.assists += numeric(row.assists) || 0;
      p.apps += numeric(row.appearances) || 0;
      const rating = numeric(row.avg_rating);
      if (rating !== null) { p.ratingSum += rating; p.ratingCount += 1; }
    });
    return [...players.values()];
  }

  function dateText(value) {
    if (!value) return '—';
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return esc(value);
    return new Intl.DateTimeFormat('it-IT', { day:'2-digit', month:'short', year:'numeric' }).format(d).toUpperCase();
  }

  function matchBox(row, label, scheduled = false) {
    if (!row) return '';
    const score = scheduled ? 'VS' : `${esc(row.home_score ?? '—')} - ${esc(row.away_score ?? '—')}`;
    const date = row.match_date || '';
    return `<section class="cd-card cd-match-card">
      <small>${esc(label)}</small>
      <div class="cd-match-line">
        <strong>${esc(row.home_name || '—')}</strong>
        <b>${score}</b>
        <strong>${esc(row.away_name || '—')}</strong>
      </div>
      <span>${dateText(date)}</span>
    </section>`;
  }

  function unavailable(text = 'DATI NON ANCORA DISPONIBILI') {
    return `<section class="cd-card cd-empty"><strong>${esc(text)}</strong></section>`;
  }

  function matchList(rows, scheduled = false) {
    if (!rows.length) return unavailable();
    return `<div class="cd-match-list">${rows.map(row => {
      const fixture = row.sm_fixture_id;
      return `<a class="cd-match-row" href="#/match/${encodeURIComponent(fixture)}">
        <span>${dateText(row.match_date)}</span>
        <strong>${esc(row.home_name || '—')}</strong>
        <b>${scheduled ? esc(row.match_time || 'VS') : `${esc(row.home_score ?? '—')} - ${esc(row.away_score ?? '—')}`}</b>
        <strong>${esc(row.away_name || '—')}</strong>
      </a>`;
    }).join('')}</div>`;
  }

  function tabBar(active = 'overview') {
    const tabs = [
      ['overview','Overview'],
      ['competition','Competition'],
      ['matches','Matches'],
      ['stats','Stats'],
      ['trophy','Trophy Room']
    ];
    return `<nav class="competition-detail-tabs" aria-label="Competition detail">
      ${tabs.map(([id,label]) => `<button type="button" class="competition-detail-tab ${id===active?'active':''}" data-cd-tab="${id}">${label}</button>`).join('')}
    </nav>`;
  }

  function statusPanel(teamCount, matchCount, reportCount) {
    return `<section class="cd-status">
      <div><small>COMPETITION STATUS</small><strong>${teamCount}</strong><span>TEAMS</span></div>
      <div><strong>${matchCount}</strong><span>MATCHES PLAYED</span></div>
      ${reportCount ? `<div><strong>${reportCount}</strong><span>MATCH REPORTS</span></div>` : ''}
    </section>`;
  }

  function standingsBlock(rows) {
    if (!rows.length) return unavailable('CLASSIFICA NON DISPONIBILE');
    return `<section class="cd-card"><small>STANDINGS</small><div class="cd-table">
      <div class="cd-tr cd-th"><span>#</span><strong>TEAM</strong><b>P</b><b>GD</b><b>PTS</b></div>
      ${rows.map((r,i) => `<div class="cd-tr"><span>${i+1}</span><strong>${esc(r.name)}</strong><b>${r.p}</b><b>${r.gf-r.ga}</b><b>${r.pts}</b></div>`).join('')}
    </div></section>`;
  }

  function leadersBlock(players) {
    const goals = [...players].sort((a,b) => b.goals-a.goals || b.assists-a.assists)[0];
    const assists = [...players].sort((a,b) => b.assists-a.assists || b.goals-a.goals)[0];
    if (!goals && !assists) return unavailable('STATISTICHE GIOCATORI NON DISPONIBILI');
    return `<div class="cd-stats-grid">
      ${goals ? `<a class="cd-card cd-leader" href="#/player/${encodeURIComponent(goals.id)}"><small>TOP GOALSCORER</small><strong>${esc(goals.name)}</strong><span>${goals.goals} GOALS</span></a>` : ''}
      ${assists ? `<a class="cd-card cd-leader" href="#/player/${encodeURIComponent(assists.id)}"><small>TOP ASSISTS</small><strong>${esc(assists.name)}</strong><span>${assists.assists} ASSISTS</span></a>` : ''}
    </div>`;
  }

  async function enhance() {
    const identity = identityFromRoute();
    if (!identity) return;
    const current = ++enhanceToken;
    const main = APP?.querySelector('.view');
    const head = main?.querySelector('.section-head');
    if (!main || !head) return;
    if (main.dataset.competitionDetailEnhanced === path()) return;

    const existingCompetition = [...main.querySelectorAll('.detail-section')].find(s => s.querySelector('h3')?.textContent.trim() === 'Competition');
    if (!existingCompetition) return;

    main.dataset.competitionDetailEnhanced = path();
    const title = displayName(identity);
    const back = `/competitions/${identity.group.toLowerCase()}`;
    const headCopy = head.cloneNode(true);
    const h2 = headCopy.querySelector('h2');
    const small = headCopy.querySelector('small');
    const backBtn = headCopy.querySelector('.back-btn');
    if (h2) h2.textContent = title;
    if (small) small.textContent = `${WORLD} · ${identity.group}`;
    if (backBtn) backBtn.setAttribute('href', `#${back}`);

    main.innerHTML = `${headCopy.outerHTML}${tabBar()}<div class="competition-detail-stage"><div class="cd-loading"><span></span><strong>CARICAMENTO COMPETIZIONE</strong></div></div>`;

    try {
      const [matches, schedule, reports, allResults] = await Promise.all([
        read('results', baseFilters(identity, true), { orderBy:'match_date', orderDir:'DESC' }),
        read('schedule', baseFilters(identity, false), { orderBy:'match_date', orderDir:'ASC' }),
        read('match_report', baseFilters(identity, false)),
        read('results', baseFilters(identity, false), { orderBy:'match_date', orderDir:'DESC' })
      ]);
      if (current !== enhanceToken || identityFromRoute() === null) return;

      const teams = fixtureTeams(matches);
      const table = standings(matches);
      const players = playerLeaders(allResults.filter(row => row.result_dataset !== 'MATCH_DATA' || row.sm_player_id));
      const lastMatch = matches[0] || null;
      const nextMatch = schedule[0] || null;
      const leader = String(identity.sm_action || '').toLowerCase() === 'league' ? table[0] : null;
      const topScorer = [...players].sort((a,b) => b.goals-a.goals)[0] || null;

      const metaValues = (field) => [...new Set([...matches,...schedule,...reports].map(row => row[field]).filter(v => v !== null && v !== undefined && v !== ''))];
      const overview = `${statusPanel(teams.size, matches.length, reports.length)}
        ${matchBox(lastMatch,'LAST MATCH')}
        ${matchBox(nextMatch,'NEXT MATCH',true)}
        ${leader ? `<section class="cd-card cd-leader"><small>CURRENT LEADER</small><strong>${esc(leader.name)}</strong><span>${leader.pts} PTS</span></section>` : ''}
        ${topScorer ? `<a class="cd-card cd-leader" href="#/player/${encodeURIComponent(topScorer.id)}"><small>TOP GOALSCORER</small><strong>${esc(topScorer.name)}</strong><span>${topScorer.goals} GOALS</span></a>` : ''}`;

      const competition = `<section class="cd-card"><small>COMPETITION</small><div class="cd-facts">
        <div><span>GROUP</span><strong>${esc(identity.group)}</strong></div>
        ${identity.competition_key ? `<div><span>COMPETITION KEY</span><strong>${esc(identity.competition_key)}</strong></div>` : ''}
        ${identity.sm_action ? `<div><span>TYPE</span><strong>${esc(LABELS[String(identity.sm_action).toLowerCase()] || identity.sm_action)}</strong></div>` : ''}
        ${identity.sm_division ? `<div><span>DIVISION</span><strong>${esc(identity.sm_division)}</strong></div>` : ''}
        ${metaValues('sm_country').length ? `<div><span>COUNTRY</span><strong>${esc(metaValues('sm_country').join(' · '))}</strong></div>` : ''}
        ${metaValues('competition_stage').length ? `<div><span>STAGE</span><strong>${esc(metaValues('competition_stage').join(' · '))}</strong></div>` : ''}
        ${metaValues('competition_round').length ? `<div><span>ROUND</span><strong>${esc(metaValues('competition_round').join(' · '))}</strong></div>` : ''}
      </div></section>${String(identity.sm_action || '').toLowerCase()==='league' ? standingsBlock(table) : ''}`;

      const matchesPanel = `<section class="cd-section-label">RESULTS <strong>${matches.length}</strong></section>${matchList(matches,false)}
        <section class="cd-section-label">SCHEDULE <strong>${schedule.length}</strong></section>${matchList(schedule,true)}`;

      const stats = `${leadersBlock(players)}${String(identity.sm_action || '').toLowerCase()==='league' ? standingsBlock(table.slice(0,10)) : ''}`;
      const trophy = unavailable('TROPHY ROOM · DATI NON ANCORA DISPONIBILI');

      const panels = { overview, competition, matches:matchesPanel, stats, trophy };
      const stage = main.querySelector('.competition-detail-stage');
      function show(id) {
        main.querySelectorAll('.competition-detail-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.cdTab === id));
        stage.innerHTML = `<div class="competition-detail-panel" data-panel="${id}">${panels[id]}</div>`;
      }
      main.querySelector('.competition-detail-tabs').addEventListener('click', event => {
        const button = event.target.closest('[data-cd-tab]');
        if (!button) return;
        show(button.dataset.cdTab);
      });
      show('overview');
    } catch (error) {
      const stage = main.querySelector('.competition-detail-stage');
      if (stage) stage.innerHTML = `<section class="cd-card cd-empty"><strong>DATI TEMPORANEAMENTE NON DISPONIBILI</strong><span>${esc(error.message)}</span></section>`;
    }
  }

  const observer = new MutationObserver(() => {
    if (identityFromRoute()) queueMicrotask(enhance);
  });
  if (APP) observer.observe(APP, { childList:true, subtree:true });
  window.addEventListener('hashchange', () => { enhanceToken += 1; queueMicrotask(enhance); });
  queueMicrotask(enhance);
})();
