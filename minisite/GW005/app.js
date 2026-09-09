(() => {
  const GW='GW005';
  const cfg=window.IMC_GAME_WORLD||{};
  const path=window.location.pathname.replace(/\/+$/,'');
  const isHome=/\/minisite\/GW005$/i.test(path)||/\/minisite\/GW005\/index\.html$/i.test(path);
  if(!isHome) return;

  const root=document.getElementById('app');
  if(!root) return;

  const modules=[
    ['competitions','COMPETITIONS','3 DIVISIONS','◈'],
    ['results','RESULTS','LIVE','●'],
    ['calendar','CALENDAR','LIVE','⌁'],
    ['team-hub','TEAM HUB','24 CLUBS','◆'],
    ['managers','MANAGERS','IMC','◎'],
    ['trophy-room','TROPHY ROOM','HISTORY','♛'],
    ['codex','CODEX','PLAYERS','◇'],
    ['transfers','TRANSFERS','LIVE','↔']
  ];

  const html=`
    <div class="hof-shell">
      <header class="hof-hero">
        <div class="hof-kicker">ITALIAN MASTERS CLUB · ${GW}</div>
        <div class="hof-hero__row">
          <div>
            <h1>${escapeHtml(cfg.name||'Hall Of Famers')}</h1>
            <p>Game World ID ${escapeHtml(cfg.smGameWorldId||'468194')}</p>
          </div>
          <div class="hof-monogram" aria-hidden="true">HOF</div>
        </div>
        <div class="hof-stats" aria-label="Game World summary">
          <div><strong>${cfg.activeClubs||24}</strong><span>CLUBS</span></div>
          <div><strong>${cfg.divisions||3}</strong><span>DIVISIONS</span></div>
          <div><strong>${cfg.teamsPerDivision||8}</strong><span>TEAMS / DIV</span></div>
          <div><strong>${cfg.expectedMatchesPerDivision||56}</strong><span>MATCHES / DIV</span></div>
        </div>
      </header>

      <section class="hof-pulse" aria-label="Live overview">
        <a class="hof-pulse__item" href="./results/">
          <span class="hof-pulse__eyebrow">LATEST RESULT</span>
          <strong id="hof-latest-result">Loading…</strong>
        </a>
        <a class="hof-pulse__item" href="./calendar/">
          <span class="hof-pulse__eyebrow">NEXT FIXTURE</span>
          <strong id="hof-next-fixture">Loading…</strong>
        </a>
      </section>

      <nav class="hof-grid" aria-label="Hall Of Famers sections">
        ${modules.map(([slug,label,badge,icon])=>`
          <a class="hof-card hof-card--${slug}" href="./${slug}/">
            <div class="hof-card__top"><span class="hof-card__icon">${icon}</span><span class="hof-card__badge" data-badge="${slug}">${badge}</span></div>
            <div class="hof-card__bottom"><span>${label}</span><b>›</b></div>
          </a>`).join('')}
      </nav>
    </div>`;

  root.innerHTML=html;
  document.title=`${cfg.name||'Hall Of Famers'} · ${GW}`;

  hydrate();

  async function hydrate(){
    const api=await waitForDataApi(1800);
    if(!api) {
      setText('hof-latest-result','Results');
      setText('hof-next-fixture','Calendar');
      return;
    }

    const [results,schedule,transfers,stats]=await Promise.all([
      safeRead(api,'results'),safeRead(api,'schedule'),safeRead(api,'transfers'),safeRead(api,'sm_player_stats')
    ]);

    const r=worldRows(results);
    const s=worldRows(schedule);
    const t=worldRows(transfers);
    const ps=worldRows(stats);

    const latest=pickLatest(r);
    const next=pickNext(s);
    setText('hof-latest-result',latest?formatMatch(latest,true):'No result yet');
    setText('hof-next-fixture',next?formatMatch(next,false):'No fixture yet');

    setBadge('results',r.length?String(r.length):'LIVE');
    setBadge('calendar',s.length?String(s.length):'LIVE');
    setBadge('transfers',t.length?String(t.length):'LIVE');
    if(ps.length) setBadge('codex',`${ps.length} STATS`);
  }

  function waitForDataApi(ms){
    return new Promise(resolve=>{
      const start=Date.now();
      const tick=()=>{
        const api=window.IMC_MINISITE_DATA;
        if(api&&typeof api.read==='function') return resolve(api);
        if(Date.now()-start>=ms) return resolve(null);
        setTimeout(tick,90);
      };
      tick();
    });
  }

  async function safeRead(api,name){
    try{return await api.read(name);}catch(e){return null;}
  }

  function rowsOf(value){
    if(Array.isArray(value)) return value;
    if(!value||typeof value!=='object') return [];
    for(const key of ['rows','data','items']) if(Array.isArray(value[key])) return value[key];
    if(value.result){
      if(Array.isArray(value.result)) return value.result;
      if(Array.isArray(value.result.rows)) return value.result.rows;
      if(Array.isArray(value.result.data)) return value.result.data;
    }
    return [];
  }

  function worldRows(value){
    const rows=rowsOf(value);
    const filtered=rows.filter(row=>{
      const v=row?.game_world_id??row?.gameWorldId??row?.game_world??row?.['Game World']??row?.['IMC GW'];
      return v==null||String(v).toUpperCase()===GW;
    });
    return filtered.length?filtered:rows;
  }

  function dateValue(row){
    const raw=row?.match_date??row?.date??row?.kickoff??row?.kick_off??row?.fixture_date??row?.played_at??row?.scheduled_at;
    if(!raw) return NaN;
    const t=Date.parse(raw);
    return Number.isFinite(t)?t:NaN;
  }

  function pickLatest(rows){
    return [...rows].filter(x=>Number.isFinite(dateValue(x))).sort((a,b)=>dateValue(b)-dateValue(a))[0]||rows[0]||null;
  }

  function pickNext(rows){
    const now=Date.now();
    const future=[...rows].filter(x=>Number.isFinite(dateValue(x))&&dateValue(x)>=now).sort((a,b)=>dateValue(a)-dateValue(b));
    return future[0]||[...rows].filter(x=>Number.isFinite(dateValue(x))).sort((a,b)=>dateValue(a)-dateValue(b))[0]||rows[0]||null;
  }

  function formatMatch(row,withScore){
    const home=row?.home_name??row?.home_team??row?.home??row?.home_club_name??'Home';
    const away=row?.away_name??row?.away_team??row?.away??row?.away_club_name??'Away';
    if(withScore){
      const hs=row?.home_score??row?.score_home??row?.home_goals;
      const as=row?.away_score??row?.score_away??row?.away_goals;
      if(hs!=null&&as!=null) return `${home} ${hs}–${as} ${away}`;
    }
    const t=dateValue(row);
    if(Number.isFinite(t)){
      const d=new Date(t).toLocaleDateString('it-IT',{day:'2-digit',month:'short'});
      return `${home} vs ${away} · ${d}`;
    }
    return `${home} vs ${away}`;
  }

  function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text;}
  function setBadge(slug,text){const el=document.querySelector(`[data-badge="${slug}"]`);if(el)el.textContent=text;}
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
})();
