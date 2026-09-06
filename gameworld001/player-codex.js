(() => {
  'use strict';

  const APP = document.getElementById('app');
  const API = 'https://www.italianmastersclub.it/api/imc-gateway/';
  const GW = 'GW001';
  let renderSeq = 0;
  let playersCache = null;
  let rosterCache = null;

  const DETAIL_REPOS = [
    'player_codex',
    'player_codex_roster',
    'player_codex_stats',
    'player_codex_rating_history',
    'player_codex_transfer_history',
    'player_codex_injury_history',
    'player_codex_snapshots'
  ];

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const currentPath = () => location.hash.replace(/^#/, '') || '/overview';
  const ownsPath = () => currentPath() === '/codex' || currentPath() === '/codex/players' || /^\/player\/[^/]+$/.test(currentPath());

  async function request(repository, options = {}) {
    const url = new URL(API);
    url.searchParams.set('game_world_id', GW);
    url.searchParams.set('repository', repository);
    url.searchParams.set('action', 'read');
    url.searchParams.set('limit', String(options.limit ?? 1000));
    url.searchParams.set('offset', String(options.offset ?? 0));
    if (options.orderBy) url.searchParams.set('order_by', options.orderBy);
    if (options.orderDir) url.searchParams.set('order_dir', options.orderDir);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    let payload;
    try {
      payload = await response.json();
    } catch (_) {
      throw new Error(`Gateway response non JSON (${response.status})`);
    }

    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error(payload?.error || `HTTP_${response.status}`);
    }

    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      total: Number(payload.pagination?.total ?? 0)
    };
  }

  async function readAll(repository, options = {}) {
    const pageSize = 1000;
    const rows = [];
    let offset = 0;
    let total = null;

    while (total === null || offset < total) {
      const page = await request(repository, {
        ...options,
        limit: pageSize,
        offset
      });
      if (total === null) total = page.total;
      rows.push(...page.data);
      if (!page.data.length || page.data.length < pageSize) break;
      offset += page.data.length;
    }

    return rows;
  }

  function canonicalPlayerId(row) {
    if (!row || typeof row !== 'object') return null;
    const preferred = [
      row.sm_player_id,
      row.player_id,
      row.player_codex_id,
      row.sm_id,
      row.id
    ];
    for (const value of preferred) {
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
    }
    for (const [key, value] of Object.entries(row)) {
      if (!/player.*id|id.*player/i.test(key)) continue;
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
    }
    return null;
  }

  function playerIdCandidates(row) {
    const out = new Set();
    if (!row || typeof row !== 'object') return out;
    for (const [key, value] of Object.entries(row)) {
      if (!/(^|_)player(_|.*_)id$|sm_player_id|player_codex_id/i.test(key)) continue;
      if (value !== undefined && value !== null && String(value).trim() !== '') out.add(String(value));
    }
    const canonical = canonicalPlayerId(row);
    if (canonical) out.add(canonical);
    return out;
  }

  function rowMatchesPlayer(row, ids) {
    if (!row || !ids || !ids.size) return false;
    const canonical = canonicalPlayerId(row);
    if (canonical && ids.has(String(canonical))) return true;
    for (const [key, value] of Object.entries(row)) {
      if (!/(^|_)player(_|.*_)id$|sm_player_id|player_codex_id/i.test(key)) continue;
      if (value !== undefined && value !== null && ids.has(String(value))) return true;
    }
    return false;
  }

  function shell(content) {
    APP.innerHTML = `
      <header class="topbar">
        <div class="brand-mark">IMC</div>
        <a class="brand" href="#/overview">
          <h1>ROAD TO HISTORY</h1>
          <div class="brand-sub">GAME WORLD</div>
        </a>
        <a class="menu-btn" href="#/overview" aria-label="Overview">
          <div class="hamb"><span></span><span></span><span></span></div>
        </a>
      </header>
      <main class="view pc-view">${content}</main>
      <footer>ITALIAN MASTERS CLUB · THE WORLD IS OUR PLAYGROUND</footer>`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function head(title, back = '/overview') {
    return `<div class="section-head">
      <div><small>GW001 · PLAYER CODEX</small><h2>${esc(title)}</h2></div>
      <a class="back-btn" href="#${back}" aria-label="Indietro"></a>
    </div>`;
  }

  function loading() {
    return `<div class="data-state"><span class="spinner"></span><strong>Caricamento Player Codex</strong></div>`;
  }

  function errorState(message, detail = '') {
    return `<div class="data-state error-state"><strong>${esc(message)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
  }

  function playerName(row) {
    return row?.full_name || row?.player_name || row?.name || `Player ${canonicalPlayerId(row) || ''}`;
  }

  function playerImage(row) {
    return row?.image_url || row?.photo_url || row?.player_image_url || '';
  }

  function playerRating(row) {
    return row?.rating ?? row?.overall_rating ?? row?.current_rating ?? '';
  }

  function playerPosition(row) {
    return row?.position || row?.position_text || row?.player_position || '';
  }

  function playerValue(row) {
    return row?.market_value || row?.value || row?.player_value || '';
  }

  function playerAge(row) {
    return row?.age ?? '';
  }

  function rosterMapFrom(rows) {
    const map = new Map();
    for (const row of rows || []) {
      const id = canonicalPlayerId(row);
      if (id) map.set(String(id), row);
    }
    return map;
  }

  function playerClub(row, rosterMap) {
    const id = canonicalPlayerId(row);
    const roster = id ? rosterMap.get(String(id)) : null;
    return roster?.club_name || roster?.current_club || row?.current_club || row?.club_name || '';
  }

  function playerCard(row, rosterMap) {
    const id = canonicalPlayerId(row);
    if (!id) return '';
    const name = playerName(row);
    const image = playerImage(row);
    const club = playerClub(row, rosterMap);
    return `<a class="pc-player-card" href="#/player/${encodeURIComponent(id)}">
      <div class="pc-photo">${image ? `<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span>${esc(name.charAt(0))}</span>`}</div>
      <div class="pc-main">
        <small>PLAYER CODEX ID · ${esc(id)}</small>
        <strong>${esc(name)}</strong>
        <span>${esc(playerPosition(row) || '—')}</span>
        <em>ACTIVE IN RTH</em>
      </div>
      <div class="pc-side">
        <b>${esc(playerRating(row) || '—')}</b><span>RATING</span>
        <strong>${esc(playerValue(row) || '—')}</strong><span>VALORE</span>
      </div>
      <div class="pc-club">${esc(club || 'Club non disponibile')}</div>
    </a>`;
  }

  async function renderList() {
    const seq = ++renderSeq;
    shell(`${head('Player Codex')}${loading()}`);

    try {
      const [players, roster] = await Promise.all([
        playersCache ? Promise.resolve(playersCache) : readAll('player_codex'),
        rosterCache ? Promise.resolve(rosterCache) : readAll('player_codex_roster')
      ]);

      if (seq !== renderSeq || !currentPath().startsWith('/codex')) return;
      playersCache = players;
      rosterCache = roster;

      const rosterMap = rosterMapFrom(roster);
      const clubs = [...new Set(players.map(row => playerClub(row, rosterMap)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      const positions = [...new Set(players.map(playerPosition).filter(Boolean))].sort((a, b) => a.localeCompare(b));

      shell(`${head('Player Codex')}
        <section class="pc-toolbar">
          <input id="pc-search" class="pc-search" type="search" placeholder="Cerca giocatore..." autocomplete="off">
          <div class="pc-toolbar-row">
            <button id="pc-filter-toggle" class="pc-filter-toggle">☷ Filtri <span id="pc-filter-count">0</span></button>
            <select id="pc-sort">
              <option value="rating_desc">Rating ↓</option>
              <option value="rating_asc">Rating ↑</option>
              <option value="name_asc">Nome A-Z</option>
              <option value="value_desc">Valore ↓</option>
            </select>
          </div>
        </section>
        <section id="pc-filters" class="pc-filters" hidden>
          <div class="pc-filter-head"><div><small>FILTRI PLAYER CODEX</small><strong>Ricerca avanzata</strong></div><button id="pc-close">Chiudi ↑</button></div>
          <div class="pc-filter-grid">
            <label>Club RTH attuale<select id="f-club"><option value="">Qualsiasi</option>${clubs.map(v => `<option>${esc(v)}</option>`).join('')}</select></label>
            <label>Posizione<select id="f-pos"><option value="">Qualsiasi</option>${positions.map(v => `<option>${esc(v)}</option>`).join('')}</select></label>
            <label>Rating compreso tra<div><input id="f-rmin" type="number" placeholder="Min"><span>e</span><input id="f-rmax" type="number" placeholder="Max"></div></label>
            <label>Età compresa tra<div><input id="f-amin" type="number" placeholder="Min"><span>e</span><input id="f-amax" type="number" placeholder="Max"></div></label>
            <label class="wide">Valore compreso tra<div><input id="f-vmin" type="number" placeholder="Min"><span>e</span><input id="f-vmax" type="number" placeholder="Max"></div></label>
          </div>
          <div class="pc-filter-actions"><button id="pc-reset">Reset</button><button id="pc-apply">Applica filtri</button></div>
        </section>
        <div class="pc-count"><strong id="pc-total">${players.length}</strong><span>giocatori</span></div>
        <div id="pc-list" class="pc-list"></div>`);

      const els = {
        search: document.getElementById('pc-search'),
        list: document.getElementById('pc-list'),
        total: document.getElementById('pc-total'),
        filters: document.getElementById('pc-filters'),
        count: document.getElementById('pc-filter-count'),
        club: document.getElementById('f-club'),
        pos: document.getElementById('f-pos'),
        rmin: document.getElementById('f-rmin'),
        rmax: document.getElementById('f-rmax'),
        amin: document.getElementById('f-amin'),
        amax: document.getElementById('f-amax'),
        vmin: document.getElementById('f-vmin'),
        vmax: document.getElementById('f-vmax'),
        sort: document.getElementById('pc-sort')
      };

      let applied = {};
      const numericValue = row => Number(String(playerValue(row) || '').replace(/[^0-9.]/g, '')) || 0;
      const draw = () => {
        let rows = players.filter(row => playerName(row).toLowerCase().includes(els.search.value.trim().toLowerCase()));
        rows = rows
          .filter(row => !applied.club || playerClub(row, rosterMap) === applied.club)
          .filter(row => !applied.pos || playerPosition(row) === applied.pos)
          .filter(row => applied.rmin == null || Number(playerRating(row)) >= applied.rmin)
          .filter(row => applied.rmax == null || Number(playerRating(row)) <= applied.rmax)
          .filter(row => applied.amin == null || Number(playerAge(row)) >= applied.amin)
          .filter(row => applied.amax == null || Number(playerAge(row)) <= applied.amax)
          .filter(row => applied.vmin == null || numericValue(row) >= applied.vmin)
          .filter(row => applied.vmax == null || numericValue(row) <= applied.vmax);

        const sort = els.sort.value;
        rows.sort((a, b) => {
          if (sort === 'name_asc') return playerName(a).localeCompare(playerName(b));
          if (sort === 'rating_asc') return Number(playerRating(a) || 0) - Number(playerRating(b) || 0);
          if (sort === 'value_desc') return numericValue(b) - numericValue(a);
          return Number(playerRating(b) || 0) - Number(playerRating(a) || 0);
        });

        els.total.textContent = String(rows.length);
        els.list.innerHTML = rows.map(row => playerCard(row, rosterMap)).join('') || `<div class="data-state"><strong>Nessun giocatore trovato</strong></div>`;
      };

      document.getElementById('pc-filter-toggle').onclick = () => { els.filters.hidden = false; };
      document.getElementById('pc-close').onclick = () => { els.filters.hidden = true; };
      document.getElementById('pc-reset').onclick = () => {
        [els.club, els.pos, els.rmin, els.rmax, els.amin, els.amax, els.vmin, els.vmax].forEach(input => { input.value = ''; });
        applied = {};
        els.count.textContent = '0';
        draw();
      };
      document.getElementById('pc-apply').onclick = () => {
        const numberOrNull = input => input.value === '' ? null : Number(input.value);
        applied = {
          club: els.club.value,
          pos: els.pos.value,
          rmin: numberOrNull(els.rmin),
          rmax: numberOrNull(els.rmax),
          amin: numberOrNull(els.amin),
          amax: numberOrNull(els.amax),
          vmin: numberOrNull(els.vmin),
          vmax: numberOrNull(els.vmax)
        };
        els.count.textContent = String(Object.values(applied).filter(v => v !== '' && v !== null).length);
        els.filters.hidden = true;
        draw();
      };
      els.search.oninput = draw;
      els.sort.onchange = draw;
      draw();
    } catch (error) {
      if (seq === renderSeq) shell(`${head('Player Codex')}${errorState('Dati non disponibili', error.message)}`);
    }
  }

  function prettyKey(key) {
    return String(key).replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  function fieldGrid(row) {
    return `<div class="pc-all-fields">${Object.entries(row || {}).map(([key, value]) => `
      <div class="pc-field"><span>${esc(prettyKey(key))}</span><strong>${value === null || value === '' ? '—' : esc(typeof value === 'object' ? JSON.stringify(value) : value)}</strong></div>
    `).join('')}</div>`;
  }

  function repoSection(name, rows) {
    if (!rows?.length) return '';
    return `<section class="pc-repo"><h3>${esc(name.replaceAll('_', ' '))}</h3>${rows.map((row, index) => `<article><small>RECORD ${index + 1}</small>${fieldGrid(row)}</article>`).join('')}</section>`;
  }

  async function loadDetailData(routeId) {
    const playerRows = playersCache || await readAll('player_codex');
    playersCache = playerRows;

    let player = playerRows.find(row => canonicalPlayerId(row) === String(routeId));
    if (!player) {
      player = playerRows.find(row => [...playerIdCandidates(row)].includes(String(routeId)));
    }
    if (!player) return null;

    const ids = playerIdCandidates(player);
    ids.add(String(routeId));

    const data = { player_codex: [player] };
    const otherRepos = DETAIL_REPOS.filter(repo => repo !== 'player_codex');
    const results = await Promise.all(otherRepos.map(async repository => {
      try {
        const rows = repository === 'player_codex_roster' && rosterCache ? rosterCache : await readAll(repository);
        if (repository === 'player_codex_roster') rosterCache = rows;
        return [repository, rows.filter(row => rowMatchesPlayer(row, ids))];
      } catch (_) {
        return [repository, []];
      }
    }));

    Object.assign(data, Object.fromEntries(results));
    return data;
  }

  async function renderDetail(routeId) {
    const seq = ++renderSeq;
    shell(`${head('Player Detail', '/codex/players')}${loading()}`);

    try {
      const data = await loadDetailData(routeId);
      if (seq !== renderSeq || !currentPath().startsWith('/player/')) return;

      if (!data?.player_codex?.length) {
        shell(`${head('Player Detail', '/codex/players')}${errorState('Giocatore non disponibile', `ID ricevuto: ${routeId}`)}`);
        return;
      }

      const player = data.player_codex[0];
      const actualId = canonicalPlayerId(player) || routeId;
      const name = playerName(player);
      const image = playerImage(player);
      const roster = data.player_codex_roster?.[0];

      shell(`${head('Player Detail', '/codex/players')}
        <section class="pc-profile-hero">
          <div class="pc-profile-photo">${image ? `<img src="${esc(image)}" alt="">` : `<span>${esc(name.charAt(0))}</span>`}</div>
          <div>
            <small>PLAYER CODEX ID · ${esc(actualId)}</small>
            <h3>${esc(name)}</h3>
            <p>${esc(playerPosition(player) || '—')}</p>
            <div class="pc-profile-rating">${esc(playerRating(player) || '—')} <span>RATING</span></div>
            <em>ACTIVE IN RTH</em>
          </div>
        </section>
        ${roster ? `<section class="pc-club-strip"><strong>${esc(roster.club_name || roster.current_club || 'Club RTH')}</strong><span>Roster attuale</span></section>` : ''}
        ${DETAIL_REPOS.map(repository => repoSection(repository, data[repository] || [])).join('')}`);
    } catch (error) {
      if (seq === renderSeq) shell(`${head('Player Detail', '/codex/players')}${errorState('Dati non disponibili', error.message)}`);
    }
  }

  function route() {
    const path = currentPath();
    if (path === '/codex' || path === '/codex/players') return renderList();
    const match = path.match(/^\/player\/([^/]+)$/);
    if (match) return renderDetail(decodeURIComponent(match[1]));
  }

  function exclusiveRoute(event) {
    if (!ownsPath()) return;
    if (event) event.stopImmediatePropagation();
    route();
  }

  window.addEventListener('hashchange', exclusiveRoute, true);
  window.addEventListener('popstate', exclusiveRoute, true);

  if (ownsPath()) route();
})();
