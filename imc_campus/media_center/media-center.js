(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const query = new URLSearchParams(location.search);
  const filterButtons = document.querySelectorAll('[data-kind]');
  const types = {
    trophy: 'Trofeo',
    assignment_start: 'Nuovo incarico',
    assignment_end: 'Fine incarico',
    passport: 'IMC Passport'
  };
  const worldAliases = {
    GW001: 'IMC001', GW005: 'IMC002', GW009: 'IMC003', GW010: 'IMC004',
    GW011: 'IMC005', GW004: 'IMC006', GW006: 'IMC007', 'IMC-008': 'IMC008'
  };
  const dateFormat = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome'
  });
  const number = new Intl.NumberFormat('it-IT');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const worldId = id => worldAliases[id] || String(id || '').replace(/^IMC-(?=\d)/, 'IMC');
  let events = [];
  let worldNames = new Map();
  let loaded = false;
  let kind = '';
  query.set('world', worldId(query.get('world')));

  function eventCard(event) {
    const world = worldId(event.world);
    const worldName = worldNames.get(world);
    const managerQuery = new URLSearchParams(query);
    managerQuery.set('manager', event.manager_id);
    const team = event.team ? '<div class="team">' +
      (/^(https:\/\/|\/(?!\/))/i.test(event.team_logo || '')
        ? '<img src="' + esc(event.team_logo) + '" alt="" loading="lazy">'
        : '') +
      '<span><strong>' + esc(event.team) + '</strong><small>' +
      (event.assignment_type === 'national_team' ? 'Nazionale' : 'Club') + '</small></span></div>' : '';
    const actions = {
      passport: 'Entra nella community IMC',
      assignment_start: 'Inizia un nuovo incarico',
      assignment_end: 'Conclude l’incarico',
      trophy: 'Conquista ' + (event.competition || 'un trofeo')
    };
    const details = event.type === 'trophy'
      ? '<details class="trophy-details"><summary>Dettagli trofeo <strong>+' + number.format(event.ranking_points) +
        ' pt</strong></summary><p>Stagione ' + esc(event.season) + ' · ' + number.format(event.base_points) +
        ' × ' + number.format(event.multiplier) + ' = ' + number.format(event.ranking_points) + ' punti</p></details>'
      : '';
    return '<article class="event ' + event.type + '"><div class="event-meta"><span class="event-type">' +
      types[event.type] + '</span>' +
      (world ? '<span class="event-world"><b>' + esc(world) + '</b>' +
        (worldName ? ' ' + esc(worldName) : '') + '</span>' : '') +
      '</div><h3><a class="manager-link" href="?' + esc(managerQuery) + '">' +
      ClubhousePortraits.portrait(event.manager_id) + '<span>' + esc(event.manager_name) +
      '</span></a></h3><p class="event-action">' + esc(actions[event.type]) + '</p>' + team + details + '</article>';
  }

  function render() {
    if (!loaded) return;
    const world = query.get('world');
    const manager = query.get('manager');
    const days = new Map();
    let count = 0;
    for (const event of events) {
      if (world && worldId(event.world) !== world) continue;
      if (manager && event.manager_id !== manager) continue;
      if (kind && (kind === 'assignment' ? !event.type.startsWith('assignment_') : event.type !== kind)) continue;
      if (!days.has(event.date)) days.set(event.date, []);
      days.get(event.date).push(event);
      count++;
    }
    $('event-status').textContent = number.format(count) + (count === 1 ? ' evento' : ' eventi');
    $('feed').innerHTML = [...days].map(([day, entries]) => {
      const label = /^\d{4}-\d{2}-\d{2}$/.test(day) ? dateFormat.format(new Date(day + 'T12:00:00Z')) : day;
      return '<section class="day"><h2><time datetime="' + esc(day) + '">' + esc(label) +
        '</time></h2><div class="day-events">' + entries.map(eventCard).join('') + '</div></section>';
    }).join('') || '<p class="empty">Nessun evento per i filtri selezionati.</p>';
  }

  async function read(path) {
    const response = await fetch('/clubhouse/' + path, {cache: 'no-store'});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Dati non disponibili');
    return data;
  }

  function populate(select, items) {
    const value = query.get(select.id);
    select.length = 1;
    for (const [id, name] of items) select.add(new Option(name, id));
    if (value && !items.has(value)) select.add(new Option(value, value));
    select.value = value || '';
  }

  async function load() {
    $('retry').disabled = true;
    $('feed').setAttribute('aria-busy', 'true');
    $('event-status').textContent = 'Caricamento eventi…';
    try {
      const [timeline, meta] = await Promise.all([read('timeline.php'), read('data.php').catch(() => null)]);
      worldNames = new Map((meta?.worlds || []).map(world => [worldId(world.id), world.name]));
      ClubhousePortraits.setPeople(meta?.managers || []);
      events = timeline.events.filter(event => Object.hasOwn(types, event.type)).sort((a, b) =>
        String(b.date).localeCompare(String(a.date)) || String(a.world || '').localeCompare(String(b.world || '')));
      const worlds = new Map([...worldNames].map(([id, name]) => [id, id + ' · ' + name]));
      const managers = new Map((meta?.managers || []).map(manager => [manager.manager_id, manager.full_name]));
      for (const event of events) {
        if (event.world && !worlds.has(worldId(event.world))) worlds.set(worldId(event.world), worldId(event.world));
        if (event.manager_id && !managers.has(event.manager_id)) managers.set(event.manager_id, event.manager_name);
      }
      populate($('world'), worlds);
      populate($('manager'), new Map([...managers].sort((a, b) => a[1].localeCompare(b[1], 'it'))));
      if (query.get('world') || query.get('manager')) $('feed-settings').open = true;
      loaded = true;
      render();
    } catch {
      $('event-status').textContent = 'Eventi non disponibili.';
      if (!loaded) $('feed').innerHTML = '<p class="empty">Apri «Filtri e dati» e seleziona «Aggiorna eventi» per riprovare.</p>';
    } finally {
      $('retry').disabled = false;
      $('feed').setAttribute('aria-busy', 'false');
    }
  }

  for (const button of filterButtons) button.addEventListener('click', () => {
    kind = button.dataset.kind;
    for (const option of filterButtons) option.setAttribute('aria-pressed', String(option === button));
    render();
  });
  for (const id of ['world', 'manager']) $(id).addEventListener('change', () => {
    if ($(id).value) query.set(id, $(id).value);
    else query.delete(id);
    history.replaceState(null, '', location.pathname + (query.size ? '?' + query : ''));
    render();
  });
  $('retry').addEventListener('click', load);
  $('feed').addEventListener('error', event => {
    if (event.target.matches?.('.team img')) event.target.hidden = true;
  }, true);
  load();
})();
