(() => {
  'use strict';

  const APP = document.getElementById('app');
  const GATEWAY = 'https://www.italianmastersclub.it/api/imc-gateway/';
  const WORLD = 'GW001';
  let tableToken = 0;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function parseCompetitionHash(hash) {
    const match = String(hash || '').match(/^#\/competition\/(.+)$/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        group: String(parsed.group || '').toUpperCase(),
        competition_key: String(parsed.competition_key || '').trim() || null,
        sm_action: String(parsed.sm_action || '').trim() || null,
        sm_division: String(parsed.sm_division || '').trim() || null
      };
    } catch (_) {
      return null;
    }
  }

  function resultFilters(identity) {
    const filters = {
      competition_group: identity.group,
      result_dataset: 'MATCH_DATA'
    };
    if (identity.competition_key) filters.competition_key = identity.competition_key;
    else {
      if (identity.sm_action) filters.sm_action = identity.sm_action;
      if (identity.sm_division) filters.sm_division = identity.sm_division;
    }
    return filters;
  }

  async function readAllResults(identity) {
    const rows = [];
    const pageSize = 250;
    let offset = 0;
    let total = null;

    while (total === null || offset < total) {
      const url = new URL(GATEWAY);
      url.searchParams.set('game_world_id', WORLD);
      url.searchParams.set('action', 'read');
      url.searchParams.set('repository', 'results');
      url.searchParams.set('limit', String(pageSize));
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('order_by', 'match_date');
      url.searchParams.set('order_dir', 'ASC');
      Object.entries(resultFilters(identity)).forEach(([key, value]) => {
        url.searchParams.set(`filter_${key}`, String(value));
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(url.toString(), {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      let payload;
      try {
        payload = await response.json();
      } catch (_) {
        throw new Error(`Gateway response non JSON (${response.status})`);
      }
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || `HTTP_${response.status}`);
      }

      const pageRows = Array.isArray(payload.data) ? payload.data : [];
      if (total === null) total = Number(payload.pagination?.total ?? pageRows.length);
      rows.push(...pageRows);
      offset += pageRows.length;
      if (!pageRows.length || pageRows.length < pageSize) break;
    }
    return rows;
  }

  function validScore(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function buildStandings(rows) {
    const teams = new Map();

    function getTeam(name) {
      const key = String(name || '').trim();
      if (!key) return null;
      if (!teams.has(key)) {
        teams.set(key, { name: key, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
      }
      return teams.get(key);
    }

    rows.forEach(row => {
      const homeScore = validScore(row.home_score);
      const awayScore = validScore(row.away_score);
      if (homeScore === null || awayScore === null) return;

      const home = getTeam(row.home_name);
      const away = getTeam(row.away_name);
      if (!home || !away) return;

      home.p += 1;
      away.p += 1;
      home.gf += homeScore;
      home.ga += awayScore;
      away.gf += awayScore;
      away.ga += homeScore;

      if (homeScore > awayScore) {
        home.w += 1; home.pts += 3; away.l += 1;
      } else if (homeScore < awayScore) {
        away.w += 1; away.pts += 3; home.l += 1;
      } else {
        home.d += 1; away.d += 1; home.pts += 1; away.pts += 1;
      }
    });

    const table = [...teams.values()];
    table.forEach(team => { team.gd = team.gf - team.ga; });
    table.sort((a, b) =>
      b.pts - a.pts ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
    );
    return table;
  }

  function tableMarkup(table) {
    return `
      <div class="cd-table-heading">
        <span>TABLE</span>
        <strong>${table.length} TEAMS</strong>
      </div>
      <div class="cd-table-wrap">
        <table class="cd-standings-table">
          <thead>
            <tr>
              <th>#</th><th>TEAM</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>PTS</th>
            </tr>
          </thead>
          <tbody>
            ${table.map((team, index) => `
              <tr>
                <td class="cd-pos">${index + 1}</td>
                <td class="cd-club">${esc(team.name)}</td>
                <td>${team.p}</td>
                <td>${team.w}</td>
                <td>${team.d}</td>
                <td>${team.l}</td>
                <td>${team.gf}</td>
                <td>${team.ga}</td>
                <td>${team.gd > 0 ? '+' : ''}${team.gd}</td>
                <td class="cd-pts">${team.pts}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  async function loadTable() {
    const identity = parseCompetitionHash(location.hash);
    const panel = APP?.querySelector('.competition-detail-panel[data-panel="table"]');
    if (!identity || !panel) return;

    const token = ++tableToken;
    panel.innerHTML = '<div class="cd-results-state"><span class="spinner"></span><strong>CALCOLO TABLE</strong></div>';

    try {
      const rows = await readAllResults(identity);
      if (token !== tableToken) return;
      const currentPanel = APP?.querySelector('.competition-detail-panel[data-panel="table"]');
      if (!currentPanel) return;
      const table = buildStandings(rows);
      currentPanel.innerHTML = table.length
        ? tableMarkup(table)
        : '<div class="cd-results-state"><strong>CLASSIFICA NON DISPONIBILE</strong></div>';
    } catch (error) {
      if (token !== tableToken) return;
      const currentPanel = APP?.querySelector('.competition-detail-panel[data-panel="table"]');
      if (!currentPanel) return;
      const message = error?.name === 'AbortError' ? 'GATEWAY TIMEOUT' : (error?.message || 'GATEWAY ERROR');
      currentPanel.innerHTML = `<div class="cd-results-state error"><strong>TABLE TEMPORANEAMENTE NON DISPONIBILE</strong><small>${esc(message)}</small></div>`;
    }
  }

  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-cd-tab="table"]');
    if (!tab) return;
    setTimeout(loadTable, 0);
  }, true);
})();
