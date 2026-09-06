(() => {
  'use strict';

  const NAV = [
    ['/overview','Overview'],
    ['/competitions','Competitions'],
    ['/calendar','Calendar'],
    ['/results','Results'],
    ['/team-hub','Team Hub'],
    ['/managers','Managers'],
    ['/codex/players','Codex'],
    ['/transfers','Transfers'],
    ['/trophy-room','Trophy Room'],
    ['/news-feed','News Feed'],
    ['/world-chronicle','World Chronicle']
  ];

  function routeUrl(path) {
    return `#${path}`;
  }

  function currentPath() {
    const raw = location.hash.replace(/^#/, '') || '/overview';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  function isActive(path, base) {
    if (base === '/overview') return path === '/' || path === '/overview';
    const root = base === '/codex/players' ? '/codex' : base;
    return path === root || path.startsWith(`${root}/`);
  }

  function ensureDrawer() {
    let drawer = document.getElementById('gw001-drawer');
    if (drawer) return drawer;

    drawer = document.createElement('div');
    drawer.id = 'gw001-drawer';
    drawer.className = 'site-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <button class="site-drawer-backdrop" type="button" aria-label="Chiudi menu"></button>
      <aside class="site-drawer-panel" aria-label="Menu GW001">
        <div class="site-drawer-head">
          <div><small>GW001</small><strong>ROAD TO HISTORY</strong></div>
          <button class="site-drawer-close" type="button" aria-label="Chiudi menu">×</button>
        </div>
        <nav class="site-drawer-nav"></nav>
      </aside>`;
    document.body.appendChild(drawer);

    drawer.querySelector('.site-drawer-backdrop').addEventListener('click', closeDrawer);
    drawer.querySelector('.site-drawer-close').addEventListener('click', closeDrawer);
    drawer.addEventListener('click', event => {
      if (event.target.closest('.site-drawer-link')) closeDrawer();
    });
    return drawer;
  }

  function refreshDrawer() {
    const drawer = ensureDrawer();
    const path = currentPath();
    drawer.querySelector('.site-drawer-nav').innerHTML = NAV.map(([href,label]) => `
      <a class="site-drawer-link ${isActive(path,href) ? 'active' : ''}" href="${routeUrl(href)}">
        <span>${label}</span><b>›</b>
      </a>`).join('');
  }

  function openDrawer() {
    refreshDrawer();
    const drawer = ensureDrawer();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('menu-open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('gw001-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('menu-open');
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.menu-btn');
    if (!button) return;
    event.preventDefault();
    openDrawer();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
  });

  window.addEventListener('hashchange', () => {
    closeDrawer();
    refreshDrawer();
  });
})();
