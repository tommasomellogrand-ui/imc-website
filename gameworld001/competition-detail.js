(() => {
  'use strict';
  const APP=document.getElementById('app');
  const GATEWAY='https://www.italianmastersclub.it/api/imc-gateway/';
  const WORLD='GW001';
  const TABS=[['overview','Overview'],['results','Results'],['table','Table'],['schedule','Schedule'],['stats','Stats'],['trophy','Trophy Room']];
  let requestToken=0;
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function parseCompetitionHash(hash){
    const m=String(hash||'').match(/^#\/competition\/(.+)$/); if(!m)return null;
    try{const p=JSON.parse(decodeURIComponent(m[1]));const group=String(p?.group||'').toUpperCase();const key=String(p?.competition_key||'').trim();if(!group||!key)return null;return{group,competition_key:key,sm_action:String(p.sm_action||'').trim()||null,sm_division:String(p.sm_division||'').trim()||null};}catch(_){return null;}
  }
  const backHash=i=>`#/competitions/${String(i.group||'').toLowerCase()}`;
  function pageMarkup(i,active){return `<div class="section-head competition-detail-head"><div><small>GW001 · ${esc(i.group)}</small><h2>${esc(i.competition_key)}</h2></div><a class="back-btn" href="${backHash(i)}" aria-label="Indietro"></a></div><nav class="competition-detail-tabs" aria-label="Competition detail">${TABS.map(([id,l])=>`<button type="button" class="competition-detail-tab ${id===active?'active':''}" data-cd-tab="${id}">${l}</button>`).join('')}</nav><section class="competition-detail-stage" data-competition-group="${esc(i.group)}" data-competition-key="${esc(i.competition_key)}"><div class="competition-detail-panel" data-panel="${active}"></div></section>`;}
  function render(i,active='overview'){const view=APP?.querySelector('.view');if(!view||!i)return false;const token=++requestToken;view.innerHTML=pageMarkup(i,active);window.scrollTo({top:0,behavior:'instant'});if(active==='overview')loadOverview(i,token);if(active==='results')loadResults(i,token);if(active==='schedule')loadSchedule(i,token);if(active==='stats')loadStats(i,token);if(active==='trophy')loadTrophy(i,token);return true;}
  function openCompetition(hash){const i=parseCompetitionHash(hash);if(!i)return false;history.pushState({gw001Competition:true},'',`${location.pathname}${location.search}${hash}`);return render(i);}

  async function readAll(repository,i,extra={}){
    const rows=[];let offset=0,total=null;const pageSize=250;
    while(total===null||offset<total){const u=new URL(GATEWAY);u.searchParams.set('game_world_id',WORLD);u.searchParams.set('action','read');u.searchParams.set('repository',repository);u.searchParams.set('limit',String(pageSize));u.searchParams.set('offset',String(offset));u.searchParams.set('filter_competition_key',i.competition_key);if(repository==='results')u.searchParams.set('filter_result_dataset','MATCH_DATA');Object.entries(extra).forEach(([k,v])=>u.searchParams.set(k,String(v)));const c=new AbortController();const t=setTimeout(()=>c.abort(),12000);let r;try{r=await fetch(u.toString(),{cache:'no-store',headers:{Accept:'application/json'},signal:c.signal});}finally{clearTimeout(t)}let p;try{p=await r.json()}catch(_){throw new Error(`Gateway response non JSON (${r.status})`)}if(!r.ok||p?.ok!==true)throw new Error(p?.error||`HTTP_${r.status}`);const page=Array.isArray(p.data)?p.data:[];if(total===null)total=Number(p.pagination?.total??page.length);rows.push(...page);offset+=page.length;if(!page.length||page.length<pageSize)break;}return rows;
  }
  const state=(label)=>`<div class="cd-results-state"><span class="spinner"></span><strong>${label}</strong></div>`;
  const errorMarkup=(label,e)=>`<div class="cd-results-state error"><strong>${label}</strong><small>${esc(e?.name==='AbortError'?'GATEWAY TIMEOUT':e?.message||'GATEWAY ERROR')}</small></div>`;
  function dateLabel(v){if(!v)return 'DATA NON DISPONIBILE';const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();}
  function resultRow(r){const href=r.sm_fixture_id?`#/match/${encodeURIComponent(r.sm_fixture_id)}`:'#';return `<a class="cd-matchday-row" href="${href}"><strong class="cd-team home">${esc(r.home_name||'—')}</strong><b class="cd-score">${esc(r.home_score??'—')} - ${esc(r.away_score??'—')}</b><strong class="cd-team away">${esc(r.away_name||'—')}</strong><span class="cd-chevron">›</span></a>`;}
  function scheduleRow(r){const href=r.sm_fixture_id?`#/match/${encodeURIComponent(r.sm_fixture_id)}`:'#';return `<a class="cd-matchday-row" href="${href}"><strong class="cd-team home">${esc(r.home_name||'—')}</strong><b class="cd-score cd-schedule-time">${esc(String(r.match_time||'').trim()||'VS')}</b><strong class="cd-team away">${esc(r.away_name||'—')}</strong><span class="cd-chevron">›</span></a>`;}
  function groupByDate(rows,start=1){const m=new Map();rows.forEach(r=>{const k=String(r.match_date||'');if(!m.has(k))m.set(k,[]);m.get(k).push(r)});return[...m.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,matches],n)=>({date,matches,matchday:start+n}));}
  function matchdayBox(g,mode){const fn=mode==='schedule'?scheduleRow:resultRow;return `<section class="cd-matchday-box"><header class="cd-matchday-head"><strong>MATCHDAY ${g.matchday}</strong><span>${dateLabel(g.date)}</span><b>${g.matches.length} MATCHES</b></header><div class="cd-matchday-matches">${g.matches.map(fn).join('')}</div></section>`;}

  async function loadOverview(i,token){const p=APP?.querySelector('[data-panel="overview"]');if(!p)return;p.innerHTML=state('CARICAMENTO COMPETITION');try{const [results,schedule,reports]=await Promise.all([readAll('results',i),readAll('schedule',i),readAll('match_report',i)]);if(token!==requestToken)return;const teams=new Set();[...results,...schedule].forEach(r=>{if(r.home_name)teams.add(r.home_name);if(r.away_name)teams.add(r.away_name)});const dates=results.map(r=>r.match_date).filter(Boolean).sort();p.innerHTML=`<div class="cd-results-heading"><span>COMPETITION</span><strong>${esc(i.competition_key)}</strong></div><div class="overview-metrics"><div class="metric-card"><strong>${results.length}</strong><span>Results</span></div><div class="metric-card"><strong>${schedule.length}</strong><span>Schedule</span></div><div class="metric-card"><strong>${reports.length}</strong><span>Match Reports</span></div><div class="metric-card"><strong>${teams.size}</strong><span>Teams</span></div></div>${dates.length?`<div class="cd-results-heading"><span>LAST RESULT</span><strong>${dateLabel(dates.at(-1))}</strong></div>`:''}`;}catch(e){p.innerHTML=errorMarkup('COMPETITION TEMPORANEAMENTE NON DISPONIBILE',e)}}
  async function loadResults(i,token){const p=APP?.querySelector('[data-panel="results"]');if(!p)return;p.innerHTML=state('CARICAMENTO RESULTS');try{const rows=await readAll('results',i);if(token!==requestToken)return;if(!rows.length){p.innerHTML='<div class="cd-results-state"><strong>NESSUN RESULT DISPONIBILE</strong></div>';return}const days=groupByDate(rows);p.innerHTML=`<div class="cd-results-heading"><span>RESULTS</span><strong>${rows.length} MATCHES · ${days.length} MATCHDAYS</strong></div><div class="cd-matchdays">${[...days].reverse().map(g=>matchdayBox(g,'results')).join('')}</div>`;}catch(e){p.innerHTML=errorMarkup('RESULTS TEMPORANEAMENTE NON DISPONIBILI',e)}}
  async function loadSchedule(i,token){const p=APP?.querySelector('[data-panel="schedule"]');if(!p)return;p.innerHTML=state('CARICAMENTO SCHEDULE');try{const [res,rows]=await Promise.all([readAll('results',i),readAll('schedule',i)]);if(token!==requestToken)return;if(!rows.length){p.innerHTML='<div class="cd-results-state"><strong>NESSUNA FIXTURE FUTURA DISPONIBILE</strong></div>';return}const start=new Set(res.map(r=>r.match_date).filter(Boolean)).size+1;const days=groupByDate(rows,start);p.innerHTML=`<div class="cd-results-heading"><span>SCHEDULE</span><strong>${rows.length} MATCHES · ${days.length} MATCHDAYS</strong></div><div class="cd-matchdays">${days.map(g=>matchdayBox(g,'schedule')).join('')}</div>`;}catch(e){p.innerHTML=errorMarkup('SCHEDULE TEMPORANEAMENTE NON DISPONIBILE',e)}}
  async function loadStats(i,token){const p=APP?.querySelector('[data-panel="stats"]');if(!p)return;p.innerHTML=state('CALCOLO STATS');try{const rows=await readAll('results',i);if(token!==requestToken)return;let goals=0,home=0,away=0,draws=0;rows.forEach(r=>{const h=Number(r.home_score),a=Number(r.away_score);if(!Number.isFinite(h)||!Number.isFinite(a))return;goals+=h+a;if(h>a)home++;else if(a>h)away++;else draws++});const avg=rows.length?(goals/rows.length).toFixed(2):'—';p.innerHTML=`<div class="cd-results-heading"><span>COMPETITION STATS</span><strong>${rows.length} MATCHES</strong></div><div class="overview-metrics"><div class="metric-card"><strong>${goals}</strong><span>Goals</span></div><div class="metric-card"><strong>${avg}</strong><span>Goals / Match</span></div><div class="metric-card"><strong>${home}</strong><span>Home Wins</span></div><div class="metric-card"><strong>${away}</strong><span>Away Wins</span></div><div class="metric-card"><strong>${draws}</strong><span>Draws</span></div></div>`;}catch(e){p.innerHTML=errorMarkup('STATS TEMPORANEAMENTE NON DISPONIBILI',e)}}
  async function loadTrophy(i,token){const p=APP?.querySelector('[data-panel="trophy"]');if(!p)return;p.innerHTML=state('CARICAMENTO TROPHY ROOM');try{const rows=await readAll('trophy_room',i);if(token!==requestToken)return;if(!rows.length){p.innerHTML='<div class="cd-results-state"><strong>NESSUN TROFEO ASSOCIATO A QUESTA COMPETITION KEY</strong></div>';return}p.innerHTML=`<div class="cd-results-heading"><span>TROPHY ROOM</span><strong>${rows.length}</strong></div><div class="competition-reference-list">${rows.map(r=>`<div class="competition-reference-card"><div class="competition-reference-copy"><strong>${esc(r.club_name||r.team_name||r.winner_name||'Trophy')}</strong><span>${esc(r.imc_season||r.season||'')}</span></div></div>`).join('')}</div>`;}catch(e){p.innerHTML=errorMarkup('TROPHY ROOM NON DISPONIBILE PER COMPETITION KEY',e)}}

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href*="#/competition/"]');
    if(link){
      const href=link.getAttribute('href')||'';
      const n=href.indexOf('#/competition/');
      if(n>=0){
        const hash=href.slice(n);
        const identity=parseCompetitionHash(hash);
        if(identity){
          event.preventDefault();
          event.stopImmediatePropagation();
          history.pushState({gw001Competition:true},'',`${location.pathname}${location.search}${hash}`);
          render(identity);
          return;
        }
      }
    }
    const tab=event.target.closest('[data-cd-tab]');
    if(!tab)return;
    const i=parseCompetitionHash(location.hash);
    if(!i)return;
    event.preventDefault();
    const id=tab.dataset.cdTab;
    if(TABS.some(([x])=>x===id))render(i,id);
  },true);

  const pending=window.__GW001_PENDING_COMPETITION_HASH__;
  if(pending){const i=parseCompetitionHash(pending);window.__GW001_PENDING_COMPETITION_HASH__=null;if(i){history.replaceState({gw001Competition:true},'',`${location.pathname}${location.search}${pending}`);render(i)}}
})();