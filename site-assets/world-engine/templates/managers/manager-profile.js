(() => {
 'use strict';
 const root = document.querySelector('[data-manager-id]');
 if (!root) return;
 const id = root.dataset.managerId;
 const world = '__WORLD_ID__';
 const base = '/__WORLD_SLUG__';
 const view = document.getElementById('view');
 const parameters = new URLSearchParams(location.search);
 const tabs = ['overview', 'career', 'trophies', 'h2h', 'data-room'];
 const scopeButtons = [...root.querySelectorAll('[data-manager-scope]')];
 const tabButtons = [...root.querySelectorAll('[data-tab]')];
 const label = item => item.assignment_name || item.club_name || item.national_name || item.team_name || 'Squadra';
 const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[c]);
 const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : '';
 const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Rome'}).format(new Date());
 let assignments = [];
 let profile;
 let version = 0;
 let scope = parameters.get('scope') === 'national_team' ? 'national_team' : 'club';
 let tab = tabs.includes(parameters.get('tab')) ? parameters.get('tab') : 'overview';

 function teamLink(item, markup) {
  if (!item.world_team_id) return '<div class="mp-team">' + markup + '</div>';
  const club = item.assignment_type === 'club';
  const href = base + (club ? '/clubs/' : '/nations/') + 'detail.html?' + new URLSearchParams({world, id:item.world_team_id, type:club?'club':'nation'});
  return '<a class="mp-team" href="' + esc(href) + '">' + markup + '</a>';
 }

 function crest(item) {
  const url = String(item.image_url || '').replace(/^http:/i, 'https:');
  return /^(https:\/\/|\/(?!\/))/.test(url)
   ? '<img class="mp-crest" src="' + esc(url) + '" alt="" width="42" height="42">'
   : '<span class="mp-crest mp-crest-placeholder" aria-hidden="true">' + esc(label(item).slice(0,2)) + '</span>';
 }

 function activeRoles() {
  const active = assignments.filter(a => (!a.start_date || a.start_date <= today) && (!a.end_date || a.end_date >= today));
  const markup = active.map(a => teamLink(a, crest(a) + '<span><small>' +
   (a.assignment_type === 'club' ? 'Club attivo' : 'Nazionale attiva') + '</small><strong>' + esc(label(a)) + '</strong></span>'));
  document.getElementById('assign').innerHTML = markup.length ? markup.join('') : '<p>Nessun incarico attivo</p>';
 }

 function show(next) {
  tab = next;
  const request = ++version;
  NexusH2H.stop(view);
  NexusHistory.stop(view);
  NexusDataRoom.stop(view);
  tabButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
  scopeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.managerScope === scope)));
  const q = new URLSearchParams();
  if (tab !== 'overview') q.set('tab', tab);
  if (scope !== 'club') q.set('scope', scope);
  const query = q.toString();
  history.replaceState(null, '', location.pathname + (query ? '?' + query : ''));
  const options = {world, kind:'manager', id, scope};

  if (tab === 'overview') { NexusHistory.mount(view, options); return; }
  if (tab === 'h2h') { NexusH2H.mount(view, {...options, name:profile.full_name, lockScope:true}); return; }
  if (tab === 'data-room') { NexusDataRoom.mount(view, options); return; }
  if (tab === 'career') {
   const items = assignments.filter(a => a.assignment_type === scope);
   view.innerHTML = '<section class="mp-panel"><h2>Carriera</h2>' +
    (items.length ? items.map(a => teamLink(a, crest(a) + '<span><strong>' + esc(label(a)) +
     '</strong><small>' + esc(date(a.start_date) || 'Data non disponibile') + ' – ' +
     esc(date(a.end_date) || 'In corso') + '</small></span>')).join('')
     : '<p>Nessun incarico in questo ambito.</p>') + '</section>';
   return;
  }

  view.innerHTML = '<p class="card empty" role="status">Caricamento trofei…</p>';
  fetch('/site-data/trophies/index.php?' + new URLSearchParams({world, manager:id}), {cache:'no-store'})
   .then(async response => {
    const data = await response.json();
    if (!response.ok || !data.ok) throw Error('Trofei non disponibili.');
    if (request !== version) return;
    const rows = (data.rows || []).filter(trophy => {
     const national = trophy.competition_group === 'NATIONS' || ['worldcup','interqualifier'].includes(trophy.trophy_type);
     return national === (scope === 'national_team');
    });
    await NexusTrophies.mount(view, rows, world);
   }).catch(error => {
    if (request === version) view.innerHTML = '<p class="card empty">' + esc(error.message) + '</p>';
   });
 }

 async function init() {
  try {
   const response = await fetch(base + '/managers/api.php?' + new URLSearchParams({world, manager:id}), {cache:'no-store'});
   const data = await response.json();
   if (!response.ok || !data.ok || !data.manager) throw Error('Profilo temporaneamente non disponibile.');
   profile = data.manager;
   assignments = data.assignments || [];
   if (!parameters.has('scope') && !assignments.some(a => a.assignment_type === 'club') &&
    assignments.some(a => a.assignment_type === 'national_team')) scope = 'national_team';
   activeRoles();
   scopeButtons.forEach(button => button.addEventListener('click', () => { scope = button.dataset.managerScope; show(tab); }));
   tabButtons.forEach(button => button.addEventListener('click', () => show(button.dataset.tab)));
   show(tab);
  } catch (error) {
   view.innerHTML = '<div class="card empty">' + esc(error.message) + ' <button type="button">Riprova</button></div>';
   view.querySelector('button').addEventListener('click', init, {once:true});
  }
 }
 const portrait = document.querySelector('.mp-portrait img');
 if (portrait) {
  portrait.addEventListener('error', () => { portrait.hidden = true; });
  if (portrait.complete && !portrait.naturalWidth) portrait.hidden = true;
 }
 init();
})();
