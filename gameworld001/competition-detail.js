(() => {
  'use strict';

  const APP = document.getElementById('app');
  const GATEWAY = 'https://www.italianmastersclub.it/api/imc-gateway/';
  const WORLD = 'GW001';
  const TABS = [
    ['overview', 'Overview'],
    ['results', 'Results'],
    ['table', 'Table'],
    ['schedule', 'Schedule'],
    ['stats', 'Stats'],
    ['trophy', 'Trophy Room']
  ];

  const LABELS = Object.freeze({
    league: 'League', leaguecup: 'League Cup', leagueshield: 'League Shield', charityshield: 'Charity Shield', playoff: 'Playoff',
    smfacup: 'SMFA Champions', smfashield: 'SMFA Shield', smfasupercup: 'SMFA Super Cup', interqualifier: 'World Cup Qualifier', worldcup: 'World Cup'
  });

  let requestToken = 0;

  function esc(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

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
      return { group, competition_key: competitionKey || null, sm_action: smAction || null, sm_division: smDivision || null };
    } catch (_) { return null; }
  }

  function titleFor(identity) {
    if (identity.competition_key) return identity.competition_key;
    const action = String(identity.sm_action || '').toLowerCase();
    if (action === 'league' && identity.sm_division) return `Division ${identity.sm_division}`;
    return LABELS[action] || identity.sm_action || 'Competition';
  }

  function backHash(identity) { return `#/competitions/${String(identity.group || '').toLowerCase()}`; }

  function pageMarkup(identity, active = 'overview') {
    return `<div class="section-head competition-detail-head"><div><small>GW001 · ${esc(identity.group)}</small><h2>${esc(titleFor(identity))}</h2></div><a class="back-btn" href="${backHash(identity)}" aria-label="Indietro"></a></div>
      <nav class="competition-detail-tabs" aria-label="Competition detail">${TABS.map(([id,label]) => `<button type="button" class="competition-detail-tab ${id===active?'active':''}" data-cd-tab="${id}">${label}</button>`).join('')}</nav>
      <section class="competition-detail-stage" data-competition-group="${esc(identity.group)}" data-competition-key="${esc(identity.competition_key||'')}" data-sm-action="${esc(identity.sm_action||'')}" data-sm-division="${esc(identity.sm_division||'')}"><div class="competition-detail-panel" data-panel="${active}"></div></section>`;
  }

  function render(identity, active='overview') {
    const view=APP?.querySelector('.view'); if(!view||!identity)return false;
    requestToken+=1; view.innerHTML=pageMarkup(identity,active); window.scrollTo({top:0,behavior:'instant'});
    if(active==='results') loadResults(identity,requestToken); return true;
  }

  function openCompetition(hash) { const identity=parseCompetitionHash(hash); if(!identity)return false; history.pushState({gw001Competition:true},'',`${location.pathname}${location.search}${hash}`); return render(identity,'overview'); }

  function resultFilters(identity) {
    const filters={competition_group:identity.group,result_dataset:'MATCH_DATA'};
    if(identity.competition_key) filters.competition_key=identity.competition_key;
    else { if(identity.sm_action)filters.sm_action=identity.sm_action; if(identity.sm_division)filters.sm_division=identity.sm_division; }
    return filters;
  }

  async function readAllResults(identity) {
    const rows=[]; const pageSize=250; let offset=0,total=null;
    while(total===null||offset<total) {
      const url=new URL(GATEWAY); url.searchParams.set('game_world_id',WORLD); url.searchParams.set('action','read'); url.searchParams.set('repository','results'); url.searchParams.set('limit',String(pageSize)); url.searchParams.set('offset',String(offset)); url.searchParams.set('order_by','match_date'); url.searchParams.set('order_dir','ASC');
      Object.entries(resultFilters(identity)).forEach(([key,value])=>url.searchParams.set(`filter_${key}`,String(value)));
      const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),12000); let response;
      try { response=await fetch(url.toString(),{cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal}); } finally { clearTimeout(timeout); }
      let payload; try { payload=await response.json(); } catch(_){ throw new Error(`Gateway response non JSON (${response.status})`); }
      if(!response.ok||payload?.ok!==true) throw new Error(payload?.error||`HTTP_${response.status}`);
      const pageRows=Array.isArray(payload.data)?payload.data:[]; if(total===null)total=Number(payload.pagination?.total??pageRows.length); rows.push(...pageRows); offset+=pageRows.length; if(!pageRows.length||pageRows.length<pageSize)break;
    }
    return rows;
  }

  function dateLabel(value) {
    if(!value)return 'DATA NON DISPONIBILE'; const d=new Date(`${value}T12:00:00`); if(Number.isNaN(d.getTime()))return esc(value);
    return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
  }

  function matchRow(row) {
    const fixtureId=row.sm_fixture_id; const href=fixtureId?`#/match/${encodeURIComponent(fixtureId)}`:'#';
    return `<a class="cd-matchday-row" href="${href}"><strong class="cd-team home">${esc(row.home_name||'—')}</strong><b class="cd-score">${esc(row.home_score??'—')} - ${esc(row.away_score??'—')}</b><strong class="cd-team away">${esc(row.away_name||'—')}</strong><span class="cd-chevron">›</span></a>`;
  }

  function groupMatchdays(rows) {
    const groups=new Map();
    rows.forEach(row=>{const key=String(row.match_date||''); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(row);});
    return [...groups.entries()].sort(([a],[b])=>String(a).localeCompare(String(b))).map(([date,matches],index)=>({date,matches,matchday:index+1}));
  }

  function matchdayBox(group) {
    return `<section class="cd-matchday-box"><header class="cd-matchday-head"><strong>MATCHDAY ${group.matchday}</strong><span>${dateLabel(group.date)}</span><b>${group.matches.length} MATCHES</b></header><div class="cd-matchday-matches">${group.matches.map(matchRow).join('')}</div></section>`;
  }

  async function loadResults(identity,token) {
    const panel=APP?.querySelector('.competition-detail-panel[data-panel="results"]'); if(!panel)return;
    panel.innerHTML='<div class="cd-results-state"><span class="spinner"></span><strong>CARICAMENTO RESULTS</strong></div>';
    try {
      const rows=await readAllResults(identity); if(token!==requestToken)return; const currentPanel=APP?.querySelector('.competition-detail-panel[data-panel="results"]'); if(!currentPanel)return;
      if(!rows.length){currentPanel.innerHTML='<div class="cd-results-state"><strong>NESSUN RESULT DISPONIBILE</strong></div>';return;}
      const matchdays=groupMatchdays(rows);
      currentPanel.innerHTML=`<div class="cd-results-heading"><span>RESULTS</span><strong>${rows.length} MATCHES · ${matchdays.length} MATCHDAYS</strong></div><div class="cd-matchdays">${matchdays.map(matchdayBox).join('')}</div>`;
    } catch(error) {
      if(token!==requestToken)return; const currentPanel=APP?.querySelector('.competition-detail-panel[data-panel="results"]'); if(!currentPanel)return; const message=error?.name==='AbortError'?'GATEWAY TIMEOUT':(error?.message||'GATEWAY ERROR'); currentPanel.innerHTML=`<div class="cd-results-state error"><strong>RESULTS TEMPORANEAMENTE NON DISPONIBILI</strong><small>${esc(message)}</small></div>`;
    }
  }

  document.addEventListener('click',event=>{
    const competitionLink=event.target.closest('a[href*="#/competition/"]');
    if(competitionLink){const href=competitionLink.getAttribute('href')||'';const hashIndex=href.indexOf('#/competition/');if(hashIndex>=0){event.preventDefault();event.stopImmediatePropagation();openCompetition(href.slice(hashIndex));return;}}
    const tab=event.target.closest('[data-cd-tab]');if(!tab)return;const identity=parseCompetitionHash(location.hash);if(!identity)return;event.preventDefault();const id=tab.dataset.cdTab;if(!TABS.some(([tabId])=>tabId===id))return;render(identity,id);
  },true);

  const pending=window.__GW001_PENDING_COMPETITION_HASH__; if(pending){const identity=parseCompetitionHash(pending);window.__GW001_PENDING_COMPETITION_HASH__=null;if(identity){history.replaceState({gw001Competition:true},'',`${location.pathname}${location.search}${pending}`);render(identity,'overview');}}
})();
