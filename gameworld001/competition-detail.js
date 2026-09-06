(() => {
  'use strict';

  const APP = document.getElementById('app');
  const TABS = [
    ['overview', 'Overview'],
    ['results', 'Results'],
    ['table', 'Table'],
    ['schedule', 'Schedule'],
    ['stats', 'Stats'],
    ['trophy', 'Trophy Room']
  ];

  const LABELS = Object.freeze({
    league: 'League',
    leaguecup: 'League Cup',
    leagueshield: 'League Shield',
    charityshield: 'Charity Shield',
    playoff: 'Playoff',
    smfacup: 'SMFA Champions',
    smfashield: 'SMFA Shield',
    smfasupercup: 'SMFA Super Cup',
    interqualifier: 'World Cup Qualifier',
    worldcup: 'World Cup'
  });

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
      const group = String(parsed.group || '').toUpperCase();
      const competitionKey = String(parsed.competition_key || '').trim();
      const smAction = String(parsed.sm_action || '').trim();
      const smDivision = String(parsed.sm_division || '').trim();
      if (!group || (!competitionKey && !smAction)) return null;
      return {
        group,
        competition_key: competitionKey || null,
        sm_action: smAction || null,
        sm_division: smDivision || null
      };
    } catch (_) {
      return null;
    }
  }

  function titleFor(identity) {
    if (identity.competition_key) return identity.competition_key;
    const action = String(identity.sm_action || '').toLowerCase();
    if (action === 'league' && identity.sm_division) return `Division ${identity.sm_division}`;
    return LABELS[action] || identity.sm_action || 'Competition';
  }

  function backHash(identity) {
    return `#/competitions/${String(identity.group || '').toLowerCase()}`;
  }

  function pageMarkup(identity, active = 'overview') {
    return `
      <div class="section-head competition-detail-head">
        <div><small>GW001 · ${esc(identity.group)}</small><h2>${esc(titleFor(identity))}</h2></div>
        <a class="back-btn" href="${backHash(identity)}" aria-label="Indietro"></a>
      </div>
      <nav class="competition-detail-tabs" aria-label="Competition detail">
        ${TABS.map(([id, label]) => `<button type="button" class="competition-detail-tab ${id === active ? 'active' : ''}" data-cd-tab="${id}">${label}</button>`).join('')}
      </nav>
      <section class="competition-detail-stage"
        data-competition-group="${esc(identity.group)}"
        data-competition-key="${esc(identity.competition_key || '')}"
        data-sm-action="${esc(identity.sm_action || '')}"
        data-sm-division="${esc(identity.sm_division || '')}">
        <div class="competition-detail-panel" data-panel="${active}"></div>
      </section>`;
  }

  function render(identity, active = 'overview') {
    const view = APP?.querySelector('.view');
    if (!view || !identity) return false;
    view.innerHTML = pageMarkup(identity, active);
    window.scrollTo({ top: 0, behavior: 'instant' });
    return true;
  }

  function openCompetition(hash) {
    const identity = parseCompetitionHash(hash);
    if (!identity) return false;
    history.pushState({ gw001Competition: true }, '', `${location.pathname}${location.search}${hash}`);
    return render(identity, 'overview');
  }

  document.addEventListener('click', event => {
    const competitionLink = event.target.closest('a[href*="#/competition/"]');
    if (competitionLink) {
      const href = competitionLink.getAttribute('href') || '';
      const hashIndex = href.indexOf('#/competition/');
      if (hashIndex >= 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openCompetition(href.slice(hashIndex));
        return;
      }
    }

    const tab = event.target.closest('[data-cd-tab]');
    if (!tab) return;
    const identity = parseCompetitionHash(location.hash);
    if (!identity) return;
    event.preventDefault();
    const id = tab.dataset.cdTab;
    if (!TABS.some(([tabId]) => tabId === id)) return;
    render(identity, id);
  }, true);

  const pending = window.__GW001_PENDING_COMPETITION_HASH__;
  if (pending) {
    const identity = parseCompetitionHash(pending);
    window.__GW001_PENDING_COMPETITION_HASH__ = null;
    if (identity) {
      history.replaceState({ gw001Competition: true }, '', `${location.pathname}${location.search}${pending}`);
      render(identity, 'overview');
    }
  }
})();
