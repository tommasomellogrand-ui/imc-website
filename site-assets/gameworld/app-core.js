(() => {
  const root = document.getElementById('app');
  const config = window.IMC_GAME_WORLD || {};
  if (!root) return;

  const worldName = config.name || config.gameWorldId || 'Game word';
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const current = pathParts.length > 1 ? pathParts[1].toLowerCase() : '';

  const modules = [
    ['competitions', 'COMPETITIONS'],
    ['results', 'RESULTS'],
    ['calendar', 'CALENDAR'],
    ['team-hub', 'TEAM HUB'],
    ['managers', 'MANAGERS'],
    ['trophy-room', 'TROPHY ROOM'],
    ['codex', 'CODEX'],
    ['transfers', 'TRANSFERS']
  ];

  const known = new Map(modules);
  document.title = worldName;

  function renderHome() {
    const shell = document.createElement('div');
    shell.className = 'gw-shell';

    const header = document.createElement('header');
    header.className = 'gw-header';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'gw-eyebrow';
    eyebrow.textContent = 'ITALIAN MASTERS CLUB';
    const title = document.createElement('h1');
    title.textContent = worldName;
    header.append(eyebrow, title);

    const grid = document.createElement('nav');
    grid.className = 'gw-grid';
    grid.setAttribute('aria-label', 'Game World');

    modules.forEach(([slug, label]) => {
      const card = document.createElement('a');
      card.className = `gw-card gw-card--${slug}`;
      card.href = `./${slug}/`;
      const text = document.createElement('span');
      text.className = 'gw-card__label';
      text.textContent = label;
      const arrow = document.createElement('span');
      arrow.className = 'gw-card__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      card.append(text, arrow);
      grid.append(card);
    });

    shell.append(header, grid);
    root.replaceChildren(shell);
  }

  function renderPlaceholder(slug) {
    const shell = document.createElement('div');
    shell.className = 'gw-shell gw-shell--page';
    const back = document.createElement('a');
    back.className = 'gw-back';
    back.href = '../';
    back.textContent = '‹';
    back.setAttribute('aria-label', 'Torna alla home');

    const page = document.createElement('main');
    page.className = 'gw-page';
    const world = document.createElement('span');
    world.className = 'gw-eyebrow';
    world.textContent = worldName;
    const title = document.createElement('h1');
    title.textContent = known.get(slug) || '';
    page.append(world, title);
    shell.append(back, page);
    root.replaceChildren(shell);
  }

  if (!current || !known.has(current)) renderHome();
  else renderPlaceholder(current);
})();
