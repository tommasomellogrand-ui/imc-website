(() => {
  'use strict';

  const SUPABASE_URL = 'https://toanuzojdkfjgucztpze.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l';

  const menuButton = document.querySelector('.menu-button');
  const menu = document.querySelector('.mobile-menu');
  const menuClose = document.querySelector('.menu-close');
  const backdrop = document.querySelector('.menu-backdrop');

  function setMenu(open) {
    if (!menu || !menuButton || !backdrop) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    backdrop.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }

  menuButton?.addEventListener('click', () => setMenu(true));
  menuClose?.addEventListener('click', () => setMenu(false));
  backdrop?.addEventListener('click', () => setMenu(false));
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

  // Build 1.1: layout statico. Nessun reveal/translate durante lo scroll.
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

  async function fetchExactCount(table, selectColumn) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(selectColumn)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'count=exact',
        Range: '0-0'
      },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`${table}: ${response.status}`);
    const range = response.headers.get('content-range') || '';
    const total = range.includes('/') ? Number(range.split('/').pop()) : NaN;
    if (Number.isFinite(total)) return total;
    const data = await response.json();
    return Array.isArray(data) ? data.length : NaN;
  }


  function formatJoinDate(value) {
    if (!value) return 'Non disponibile';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
  }

  function managerCard(manager, index) {
    const id = manager.manager_id || 'MNG---';
    const name = manager.full_name || 'Manager IMC';
    const joinDate = manager.imc_join_date || '';
    return `
      <article class="manager-card">
        <div>
          <div class="manager-card-top">
            <span class="manager-id">${id}</span>
            <span class="manager-number">${String(index + 1).padStart(2, '0')}</span>
          </div>
          <h3>${name}</h3>
        </div>
        <div class="manager-join">
          <span>Ingresso IMC</span>
          <time datetime="${joinDate}">${formatJoinDate(joinDate)}</time>
        </div>
      </article>`;
  }

  async function loadManagers() {
    const grid = document.getElementById('managerGrid');
    const rosterCount = document.getElementById('managerRosterCount');
    const heroCount = document.getElementById('managerCount');
    if (!grid) return;

    try {
      const url = `${SUPABASE_URL}/rest/v1/imc_managers?select=manager_id,full_name,imc_join_date&order=manager_id.asc`;
      const response = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`imc_managers: ${response.status}`);
      const managers = await response.json();
      if (!Array.isArray(managers)) throw new Error('Formato Manager Registry non valido');

      grid.innerHTML = managers.map(managerCard).join('');
      if (rosterCount) rosterCount.textContent = String(managers.length);
      if (heroCount) heroCount.textContent = String(managers.length);
    } catch (error) {
      console.warn('IMC Website Manager Registry unavailable:', error);
      grid.innerHTML = '<div class="manager-error">Manager Registry temporaneamente non disponibile.</div>';
    }
  }


  async function loadLiveStats() {
    const managerEl = document.getElementById('managerCount');
    const worldEl = document.getElementById('worldCount');
    const statusEl = document.getElementById('liveStatus');

    try {
      const [managers, worlds] = await Promise.all([
        fetchExactCount('imc_managers', 'manager_id'),
        fetchExactCount('imc_game_worlds', 'game_world_id')
      ]);

      if (Number.isFinite(managers) && managerEl) managerEl.textContent = String(managers);
      if (Number.isFinite(worlds) && worldEl) worldEl.textContent = String(worlds);
      if (statusEl) statusEl.textContent = 'Live data · Supabase / IMC Nexus';
    } catch (error) {
      console.warn('IMC Website live counters unavailable:', error);
      if (statusEl) statusEl.textContent = 'IMC Nexus live data temporarily unavailable';
    }
  }

  loadLiveStats();
  loadManagers();
})();
