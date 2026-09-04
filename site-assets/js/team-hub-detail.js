(function () {
  'use strict';

  const WORLD_ID = String(document.body.dataset.world || '').toUpperCase();
  const ROOT = document.body.dataset.worldRoot || '/';
  const app = document.querySelector('#app');
  if (!app || !window.IMCDataService || !/^GW00[1-9]$/.test(WORLD_ID)) return;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const norm = value => String(value || '').trim().toLocaleLowerCase('it-IT');
  const parts = location.pathname.replace(ROOT, '').split('/').filter(Boolean);
  if (parts[0] !== 'team-hub') return;

  const style = document.createElement('style');
  style.textContent = `
    .team-hub-card{cursor:pointer;position:relative}.team-hub-card:after{content:'›';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:28px;font-weight:800;opacity:.45}.team-hub-card:focus{outline:2px solid currentColor;outline-offset:2px}
    .th-detail{display:grid;gap:16px;padding-bottom:28px}.th-hero{display:grid;grid-template-columns:84px 1fr;gap:18px;align-items:center;padding:22px;border-radius:22px;background:var(--panel,#fff);box-shadow:0 10px 34px rgba(0,0,0,.08)}.th-logo{width:84px;height:84px;border-radius:22px;display:grid;place-items:center;background:#fff;overflow:hidden;border:1px solid rgba(0,0,0,.08);font-weight:900;font-size:24px}.th-logo img{width:100%;height:100%;object-fit:contain}.th-hero small{font-weight:800;letter-spacing:.08em;opacity:.55}.th-hero h1{margin:5px 0 6px;font-size:clamp(26px,6vw,42px);line-height:1}.th-hero p{margin:0;opacity:.65;font-weight:600}.th-back{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:900;margin:4px 0 0}.th-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.th-metric{padding:16px 10px;border-radius:16px;background:var(--panel,#fff);text-align:center;border:1px solid rgba(0,0,0,.06)}.th-metric strong{display:block;font-size:22px}.th-metric span{display:block;font-size:10px;font-weight:900;letter-spacing:.06em;opacity:.55;margin-top:4px}.th-tabs{display:flex;gap:8px;overflow:auto;padding:2px 0 4px;scrollbar-width:none}.th-tabs button{border:0;border-radius:999px;padding:11px 15px;font:inherit;font-size:12px;font-weight:900;white-space:nowrap;background:rgba(0,0,0,.06);color:inherit}.th-tabs button.active{background:currentColor;color:#fff}.th-panel{display:grid;gap:10px}.th-row{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:14px;border-radius:16px;background:var(--panel,#fff);border:1px solid rgba(0,0,0,.06)}.th-row .home{text-align:right}.th-row .away{text-align:left}.th-row strong{font-size:13px}.th-row small{display:block;opacity:.55;font-weight:700;margin-top:3px}.th-score{font-weight:900;font-size:16px;white-space:nowrap}.th-empty{padding:28px 18px;text-align:center;border-radius:18px;background:var(--panel,#fff);opacity:.65;font-weight:800}.th-transfer{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;padding:14px;border-radius:16px;background:var(--panel,#fff);border:1px solid rgba(0,0,0,.06)}.th-transfer .to{text-align:right}.th-transfer b{font-size:13px}.th-transfer span{font-size:11px;opacity:.6}.th-manager{padding:14px 16px;border-radius:16px;background:var(--panel,#fff);border:1px solid rgba(0,0,0,.06)}.th-manager strong{display:block}.th-manager small{opacity:.6}.th-idline{font-size:11px;font-weight:800;opacity:.5;word-break:break-word}
    @media(max-width:640px){.th-metrics{grid-template-columns:repeat(2,1fr)}.th-hero{grid-template-columns:68px 1fr;padding:18px}.th-logo{width:68px;height:68px;border-radius:18px}.th-row{grid-template-columns:1fr auto 1fr;padding:12px 10px}.th-row strong{font-size:12px}}
  `;
  document.head.appendChild(style);

  function initials(name) {
    return String(name || 'IMC').split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase();
  }

  function decorateCards() {
    app.querySelectorAll('.team-hub-card').forEach(card => {
      if (card.dataset.detailBound === '1') return;
      card.dataset.detailBound = '1';
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      const kind = card.dataset.teamType === 'national' ? 'nations' : 'clubs';
      const id = card.dataset.teamId;
      const go = () => { if (id) location.href = `${ROOT}team-hub/${kind}/${encodeURIComponent(id)}/`; };
      card.addEventListener('click', go);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  if (parts.length === 1) {
    const observer = new MutationObserver(decorateCards);
    observer.observe(app, { childList: true, subtree: true });
    decorateCards();
    return;
  }

  const kind = parts[1] === 'nations' ? 'nations' : parts[1] === 'clubs' ? 'clubs' : null;
  const rawId = parts[2] || '';
  if (!kind || !/^\d+$/.test(rawId)) return;
  const teamId = Number(rawId);

  app.innerHTML = '<div class="loading-screen"><span></span><strong>TEAM HUB</strong><small>CARICAMENTO DATI MYSQL</small></div>';

  function teamMatches(team, matches, isNation) {
    const teamName = norm(team.name);
    const centralId = Number(isNation ? team.nation_id : team.club_id);
    const worldId = Number(isNation ? team.nation_gw_id : team.club_gw_id);
    return matches.filter(match => {
      const home = match.home || {};
      const away = match.away || {};
      const byName = norm(home.name) === teamName || norm(away.name) === teamName;
      if (isNation) return byName;
      return Number(home.club_id) === centralId || Number(away.club_id) === centralId || Number(home.world_club_id) === worldId || Number(away.world_club_id) === worldId || byName;
    });
  }

  function teamTransfers(team, rows) {
    const id = Number(team.club_id), wid = Number(team.club_gw_id), name = norm(team.name);
    return rows.filter(row => {
      const from = row.from_club || {}, to = row.to_club || {};
      return Number(from.club_id) === id || Number(to.club_id) === id || Number(from.world_club_id) === wid || Number(to.world_club_id) === wid || norm(from.name) === name || norm(to.name) === name;
    });
  }

  function teamManagers(team, rows, isNation) {
    const id = Number(isNation ? team.nation_id : team.club_id);
    const wid = Number(isNation ? team.nation_gw_id : team.club_gw_id);
    const name = norm(team.name);
    return rows.filter(row => {
      const values = [row.club_id,row.club_gw_id,row.nation_id,row.nation_gw_id,row.team_id,row.team_gw_id,row.sm_club_id,row.sm_team_id,row.world_club_id].map(Number);
      const names = [row.club_name,row.nation_name,row.team_name,row.name_of_team,row.assignment_name].map(norm);
      return values.includes(id) || values.includes(wid) || names.includes(name);
    });
  }

  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(`${v}T12:00:00`);
    return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
  }

  function matchRows(rows) {
    if (!rows.length) return '<div class="th-empty">Nessun dato disponibile in MySQL per questa sezione.</div>';
    return rows.map(m => {
      const score = m.result ? `${esc(m.result.home_score)} – ${esc(m.result.away_score)}` : (m.time ? esc(m.time) : 'VS');
      const comp = m.competition?.name || m.competition?.type || '';
      return `<a class="th-row" href="${ROOT}matches/${encodeURIComponent(m.fixture_id)}/"><div class="home"><strong>${esc(m.home?.name || '')}</strong><small>${esc(comp)}</small></div><div class="th-score">${score}<small>${esc(fmtDate(m.date))}</small></div><div class="away"><strong>${esc(m.away?.name || '')}</strong><small>${esc(m.status || '')}</small></div></a>`;
    }).join('');
  }

  function transferRows(rows) {
    if (!rows.length) return '<div class="th-empty">Nessun trasferimento collegato a questo club nel MySQL.</div>';
    return rows.map(t => `<div class="th-transfer"><div><b>${esc(t.from_club?.name || '—')}</b><span>DA</span></div><div><strong>${esc(t.player_name || t.player?.name || `Player ${t.player_id || ''}`)}</strong><span>${esc(t.cost?.display || t.cost?.value || t.cost || '')}</span></div><div class="to"><b>${esc(t.to_club?.name || '—')}</b><span>A</span></div></div>`).join('');
  }

  function managerRows(rows) {
    if (!rows.length) return '<div class="th-empty">Nessun manager collegato a questa squadra nel dataset disponibile.</div>';
    return rows.map(m => `<div class="th-manager"><strong>${esc(m.manager_name || m.name || m.display_name || m.manager || 'Manager')}</strong><small>${esc(m.manager_id || m.imc_manager_id || m.sm_manager_id || '')}</small></div>`).join('');
  }

  function render(team, matches, transfers, managers, isNation) {
    const results = matches.filter(m => !!m.result);
    const schedule = matches.filter(m => !m.result);
    const reports = matches.filter(m => !!m.match_report || !!m.report || !!m.availability?.match_report || !!m.availability?.report);
    const image = team.image_url ? `<img src="${esc(team.image_url)}" alt="${esc(team.name || '')}" onerror="this.remove()">` : esc(initials(team.name));
    const tabs = [
      ['overview','OVERVIEW'],['matches','MATCHES'],['results','RESULTS'],['schedule','SCHEDULE'],['reports','MATCH REPORT'],
      ...(!isNation ? [['transfers','TRANSFERS']] : []),['managers','MANAGERS']
    ];
    app.innerHTML = `<section class="section-page th-detail"><a class="th-back" href="${ROOT}team-hub/">‹ TEAM HUB</a><section class="th-hero"><div class="th-logo">${image}</div><div><small>${esc(WORLD_ID)} · ${isNation ? 'NATIONAL TEAM' : 'CLUB'}</small><h1>${esc(team.name || '')}</h1><p>${esc(team.short_name || (isNation ? 'Nazionale' : 'Club'))}</p><div class="th-idline">IMC ID ${esc(isNation ? team.nation_id : team.club_id)} · GW ID ${esc(isNation ? team.nation_gw_id : team.club_gw_id)}</div></div></section><section class="th-metrics"><div class="th-metric"><strong>${matches.length}</strong><span>MATCHES</span></div><div class="th-metric"><strong>${results.length}</strong><span>RESULTS</span></div><div class="th-metric"><strong>${schedule.length}</strong><span>SCHEDULE</span></div><div class="th-metric"><strong>${reports.length}</strong><span>REPORTS</span></div></section><nav class="th-tabs">${tabs.map((t,i)=>`<button type="button" data-th-tab="${t[0]}" class="${i===0?'active':''}">${t[1]}</button>`).join('')}</nav><div class="th-panel" data-th-panel></div></section>`;
    const panel = app.querySelector('[data-th-panel]');
    const show = tab => {
      app.querySelectorAll('[data-th-tab]').forEach(b => b.classList.toggle('active', b.dataset.thTab === tab));
      if (tab === 'overview') panel.innerHTML = `<div class="th-manager"><strong>${esc(team.name || '')}</strong><small>${isNation ? 'Nazionale' : 'Club'} presente in ${esc(WORLD_ID)}. Tutti i numeri mostrati derivano dai dataset MySQL esposti dalla Public Read API.</small></div>${managerRows(managers.slice(0,3))}`;
      if (tab === 'matches') panel.innerHTML = matchRows(matches);
      if (tab === 'results') panel.innerHTML = matchRows(results);
      if (tab === 'schedule') panel.innerHTML = matchRows(schedule);
      if (tab === 'reports') panel.innerHTML = matchRows(reports);
      if (tab === 'transfers') panel.innerHTML = transferRows(transfers);
      if (tab === 'managers') panel.innerHTML = managerRows(managers);
    };
    app.querySelectorAll('[data-th-tab]').forEach(b => b.addEventListener('click', () => show(b.dataset.thTab)));
    show('overview');
  }

  (async () => {
    try {
      const worldPayload = await IMCDataService.getWorld(WORLD_ID);
      const season = Number(worldPayload?.data?.season?.imc_season || worldPayload?.season?.imc_season || 1);
      const [teamsRes,matchesRes,transfersRes,managersRes] = await Promise.allSettled([
        kind === 'nations' ? IMCDataService.getNations(WORLD_ID) : IMCDataService.getClubs(WORLD_ID),
        IMCDataService.getAllMatches(WORLD_ID, season),
        kind === 'clubs' ? IMCDataService.getAllTransfers(WORLD_ID) : Promise.resolve({data:[]}),
        IMCDataService.getManagers(WORLD_ID)
      ]);
      const teams = teamsRes.status === 'fulfilled' ? (teamsRes.value.data || []) : [];
      const team = teams.find(t => Number(kind === 'nations' ? t.nation_id : t.club_id) === teamId);
      if (!team) throw new Error('Squadra non trovata nel Team Hub.');
      const allMatches = matchesRes.status === 'fulfilled' ? (matchesRes.value.data || []) : [];
      const allTransfers = transfersRes.status === 'fulfilled' ? (transfersRes.value.data || []) : [];
      const allManagers = managersRes.status === 'fulfilled' ? (managersRes.value.data || []) : [];
      render(team, teamMatches(team, allMatches, kind === 'nations'), kind === 'clubs' ? teamTransfers(team, allTransfers) : [], teamManagers(team, allManagers, kind === 'nations'), kind === 'nations');
    } catch (error) {
      app.innerHTML = `<section class="section-page"><a class="th-back" href="${ROOT}team-hub/">‹ TEAM HUB</a><div class="th-empty"><strong>DATI NON DISPONIBILI</strong><br>${esc(error.message || error)}</div></section>`;
    }
  })();
})();
