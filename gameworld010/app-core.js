(() => {
  'use strict';

  const app = document.getElementById('app');
  const cfg = window.IMC_GAME_WORLD || {};
  const worldId = String(cfg.gameWorldId || 'GW010').toUpperCase();
  const worldName = String(cfg.worldName || 'Sensible Soccer Academy');

  const sections = [
    ['competitions', 'Competitions', 'Leagues, cups and tournament structure'],
    ['managers', 'Managers', 'Community, clubs and identities'],
    ['team-hub', 'Team Hub', 'Teams, squads and club pages'],
    ['trophy-room', 'Trophy Room', 'Titles, achievements and history'],
    ['news-feed', 'News Feed', 'News, announcements and updates'],
    ['codex', 'Codex', 'Players, statistics and records'],
    ['transfers', 'Transfers', 'Market activity and completed deals']
  ];

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const route = () => (location.hash.replace(/^#\/?/, '') || 'overview').split('/')[0];

  function header() {
    return `
      <header class="site-header">
        <a class="identity" href="#/overview" aria-label="GW010 overview">
          <span class="gw-badge">${esc(worldId)}</span>
          <span class="identity-copy">
            <strong>${esc(worldName)}</strong>
            <small>ITALIAN MASTERS CLUB</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Apri menu" aria-expanded="false">☰</button>
      </header>
      <nav class="site-nav" aria-label="Navigazione GW010">
        <a href="#/overview">Overview</a>
        ${sections.map(([slug, label]) => `<a href="#/${slug}">${esc(label)}</a>`).join('')}
      </nav>`;
  }

  function footer() {
    return `
      <footer class="site-footer">
        <strong>ITALIAN MASTERS CLUB</strong>
        <span>PASSION · COMPETITION · COMMUNITY · LEGACY</span>
      </footer>`;
  }

  function bindMenu() {
    const button = app.querySelector('.menu-toggle');
    const nav = app.querySelector('.site-nav');
    if (!button || !nav) return;
    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }));
  }

  function shell(content) {
    app.innerHTML = `${header()}<main class="page">${content}</main>${footer()}`;
    bindMenu();
  }

  function overview() {
    shell(`
      <section class="hero">
        <div>
          <span class="eyebrow">GAME WORLD 010</span>
          <h1>${esc(worldName)}</h1>
          <p>Il minisito ufficiale del Game World GW010.</p>
        </div>
        <div class="hero-mark" aria-hidden="true">10</div>
      </section>
      <section class="section-intro">
        <span class="eyebrow">ACADEMY HUB</span>
        <h2>Tutto il mondo GW010, in un solo posto.</h2>
        <p>Accedi alle sezioni del Game World. I moduli dati possono essere collegati progressivamente senza impedire l'apertura della pagina principale.</p>
      </section>
      <section class="card-grid">
        ${sections.map(([slug, label, copy], index) => `
          <a class="nav-card" href="#/${slug}">
            <span class="card-index">${String(index + 1).padStart(2, '0')}</span>
            <h3>${esc(label)}</h3>
            <p>${esc(copy)}</p>
            <span class="arrow">→</span>
          </a>`).join('')}
      </section>`);
  }

  function sectionPage(slug) {
    const item = sections.find(([key]) => key === slug);
    if (!item) {
      overview();
      return;
    }
    const [, label, copy] = item;
    shell(`
      <section class="inner-hero">
        <a class="back-link" href="#/overview">← Overview</a>
        <span class="eyebrow">${esc(worldId)}</span>
        <h1>${esc(label)}</h1>
        <p>${esc(copy)}.</p>
      </section>
      <section class="module-card">
        <span class="status-dot"></span>
        <div>
          <strong>Modulo GW010 pronto</strong>
          <p>La shell del minisito è attiva. Il collegamento dati specifico di questa sezione può essere innestato senza bloccare il caricamento generale del sito.</p>
        </div>
      </section>`);
  }

  function render() {
    try {
      const current = route();
      if (current === 'overview') overview();
      else sectionPage(current);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      console.error('GW010 render error', error);
      app.innerHTML = `<main class="fatal"><strong>GW010</strong><h1>Sensible Soccer Academy</h1><p>Errore di rendering del minisito.</p></main>`;
    }
  }

  window.addEventListener('hashchange', render);
  render();
})();
