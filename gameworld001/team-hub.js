(() => {
  'use strict';

  const ENDPOINT = '/api/imc-gateway/team-hub.php';
  const GAME_WORLD_ID = 'GW001';
  const cache = new Map();
  let scheduled = false;

  const e = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const currentTab = () => location.hash.includes('/team-hub/nations') ? 'nations' : 'clubs';
  const inTeamHub = () => location.hash.includes('/team-hub');

  async function load(dataset) {
    if (cache.has(dataset)) return cache.get(dataset);
    const url = new URL(ENDPOINT, location.origin);
    url.searchParams.set('game_world_id', GAME_WORLD_ID);
    url.searchParams.set('dataset', dataset);

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    const payload = await response.json();
    if (!response.ok || payload?.ok !== true) {
      throw new Error(payload?.error || `HTTP_${response.status}`);
    }
    cache.set(dataset, payload);
    return payload;
  }

  function tabsNode() {
    const view = document.querySelector('main.view');
    if (!view) return null;
    return view.querySelector('.tabs.two');
  }

  function clearAfterTabs(view, tabs) {
    let node = tabs.nextSibling;
    while (node) {
      const next = node.nextSibling;
      view.removeChild(node);
      node = next;
    }
  }

  function imageMarkup(row, type) {
    const src = String(row.image_url || '').trim();
    const alt = type === 'club' ? `Logo ${row.name || ''}` : `Bandiera ${row.name || ''}`;
    const fallback = type === 'club' ? '⚽' : '⚑';
    const radius = type === 'club' ? '18px' : '14px';
    const fit = type === 'club' ? 'contain' : 'cover';

    if (!src) {
      return `<div aria-hidden="true" style="width:72px;height:72px;border:1px solid var(--line);border-radius:${radius};background:#f7f9fb;display:grid;place-items:center;font-size:28px;margin-bottom:12px">${fallback}</div>`;
    }

    return `<div style="width:72px;height:72px;border:1px solid var(--line);border-radius:${radius};background:#fff;display:grid;place-items:center;overflow:hidden;margin-bottom:12px">
      <img src="${e(src)}" alt="${e(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:${fit};padding:${type === 'club' ? '7px' : '0'}">
    </div>`;
  }

  function clubCards(rows) {
    return `<div class="view-summary"><strong>${rows.length}</strong><span>club active · CORE Aruba</span></div>
      <div class="club-grid">${rows.map(row => {
        const key = `world:${row.club_gw_id}`;
        return `<a class="club-card" href="#/club/${encodeURIComponent(key)}" style="justify-content:flex-start">
          ${imageMarkup(row, 'club')}
          <small>CORE · WORLD ${e(row.club_gw_id)}</small>
          <strong>${e(row.name)}</strong>
          <span>${e(row.short_name || '')}</span>
        </a>`;
      }).join('')}</div>`;
  }

  function nationCards(rows) {
    return `<div class="view-summary"><strong>${rows.length}</strong><span>national teams · GW001</span></div>
      <div class="club-grid">${rows.map(row => `
        <div class="club-card" style="justify-content:flex-start">
          ${imageMarkup(row, 'nation')}
          <small>${row.national_team_id ? `CORE · ${e(row.national_team_id)}` : 'NATIONAL TEAM'}</small>
          <strong>${e(row.name)}</strong>
          <span>${e(row.short_name || 'GW001 · Nations')}</span>
        </div>`).join('')}</div>`;
  }

  function loading() {
    return `<div class="data-state loading-state"><span class="spinner"></span><strong>Caricamento Team Hub</strong><small>MySQL Aruba</small></div>`;
  }

  function errorView(error) {
    return `<div class="data-state error-state"><strong>DATI TEMPORANEAMENTE NON DISPONIBILI</strong><small>${e(error?.message || 'Team Hub read error')}</small></div>`;
  }

  async function hydrate() {
    if (!inTeamHub()) return;
    const view = document.querySelector('main.view');
    const tabs = tabsNode();
    if (!view || !tabs) return;

    const dataset = currentTab();
    if (view.dataset.teamHubDataset === dataset && view.dataset.teamHubReady === '1') return;

    view.dataset.teamHubDataset = dataset;
    view.dataset.teamHubReady = '0';
    clearAfterTabs(view, tabs);
    tabs.insertAdjacentHTML('afterend', loading());

    try {
      const payload = await load(dataset);
      if (!inTeamHub() || currentTab() !== dataset) return;

      const currentView = document.querySelector('main.view');
      const currentTabs = tabsNode();
      if (!currentView || !currentTabs) return;

      clearAfterTabs(currentView, currentTabs);
      currentTabs.insertAdjacentHTML(
        'afterend',
        dataset === 'clubs' ? clubCards(payload.data || []) : nationCards(payload.data || [])
      );
      currentView.dataset.teamHubDataset = dataset;
      currentView.dataset.teamHubReady = '1';
    } catch (error) {
      const currentView = document.querySelector('main.view');
      const currentTabs = tabsNode();
      if (!currentView || !currentTabs || !inTeamHub()) return;
      clearAfterTabs(currentView, currentTabs);
      currentTabs.insertAdjacentHTML('afterend', errorView(error));
      currentView.dataset.teamHubDataset = dataset;
      currentView.dataset.teamHubReady = '1';
    }
  }

  function scheduleHydrate() {
    if (!inTeamHub() || scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      hydrate();
    }, 0);
  }

  const app = document.getElementById('app');
  if (app) {
    const observer = new MutationObserver(scheduleHydrate);
    observer.observe(app, { childList: true, subtree: true });
  }

  window.addEventListener('hashchange', scheduleHydrate);
  scheduleHydrate();
})();
