(() => {
  const GW='GW005';
  const root=document.getElementById('app');
  if(!root) return;

  const state={
    ready:false,
    loading:true,
    error:null,
    world:null,
    clubs:[],
    clubCodex:new Map(),
    competitions:[],
    managers:[],
    nationals:[],
    results:[],
    schedule:[],
    transfers:[],
    stats:[],
    reports:[]
  };

  const routes=['home','scores','calendar','competitions','clubs','managers','transfers','players','reports'];
  document.title='Hall Of Famers · GW005';
  window.addEventListener('hashchange',render);
  boot();

  async function boot(){
    renderShell();
    const api=await waitApi(2500);
    if(!api){state.loading=false;state.error='Data service unavailable';render();return;}
    try{
      const [world,clubs,competitions,managers,nationals,results,schedule,transfers,stats,reports]=await Promise.all([
        read(api,'game_world_codex'),
        read(api,'game_world_club_mapping'),
        read(api,'competition_codex'),
        read(api,'manager_assignments'),
        read(api,'national_team_codex',{limit:200}),
        read(api,'results',{limit:1000}),
        read(api,'schedule',{limit:1000}),
        read(api,'transfers',{limit:1000}),
        read(api,'sm_player_stats',{limit:1000}),
        read(api,'match_report',{limit:1000})
      ]);
      state.world=rows(world)[0]||null;
      state.clubs=rows(clubs);
      state.competitions=rows(competitions);
      state.managers=rows(managers);
      state.nationals=rows(nationals);
      state.results=rows(results);
      state.schedule=rows(schedule);
      state.transfers=rows(transfers);
      state.stats=rows(stats);
      state.reports=rows(reports);
      state.ready=true;
      await hydrateClubCodex(api);
    }catch(err){
      console.error(err);
      state.error=err?.message||'Unable to load data';
    }finally{
      state.loading=false;
      render();
    }
  }

  async function hydrateClubCodex(api){
    const jobs=state.clubs.map(async c=>{
      const id=c.club_id;
      if(!id) return;
      try{
        const data=await read(api,'club_codex',{club_id:id});
        const row=rows(data)[0];
        if(row) state.clubCodex.set(String(id),row);
      }catch{}
    });
    await Promise.all(jobs);
  }

  function renderShell(){
    root.innerHTML=`
      <div class="site-shell">
        <header class="topbar">
          <a class="brand" href="#home"><span class="brand-mark">IMC</span><span>HALL OF FAMERS</span></a>
          <div class="live-chip"><i></i> LIVE DATA</div>
        </header>
        <nav class="section-nav" aria-label="Primary">
          ${[['home','Home'],['scores','Results'],['calendar','Fixtures'],['competitions','Competitions'],['clubs','Clubs'],['managers','Managers'],['transfers','Transfers'],['players','Players'],['reports','Reports']].map(([r,l])=>`<a href="#${r}" data-nav="${r}">${l}</a>`).join('')}
        </nav>
        <main id="view"></main>
        <nav class="dock" aria-label="Quick navigation">
          <a href="#home" data-dock="home"><span>⌂</span><b>Home</b></a>
          <a href="#scores" data-dock="scores"><span>◉</span><b>Scores</b></a>
          <a href="#clubs" data-dock="clubs"><span>◆</span><b>Clubs</b></a>
          <a href="#players" data-dock="players"><span>★</span><b>Players</b></a>
          <a href="#managers" data-dock="managers"><span>◎</span><b>Managers</b></a>
        </nav>
      </div>`;
    render();
  }

  function route(){
    const r=(location.hash||'#home').slice(1).split('?')[0];
    return routes.includes(r)?r:'home';
  }

  function render(){
    const view=document.getElementById('view');
    if(!view) return;
    const r=route();
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===r));
    document.querySelectorAll('[data-dock]').forEach(a=>a.classList.toggle('active',a.dataset.dock===r));
    if(state.loading){view.innerHTML=loadingView();return;}
    const map={home:homeView,scores:scoresView,calendar:calendarView,competitions:competitionsView,clubs:clubsView,managers:managersView,transfers:transfersView,players:playersView,reports:reportsView};
    view.innerHTML=map[r]();
  }

  function loadingView(){
    return `<section class="loading-screen"><div class="loader"></div><strong>Loading Hall Of Famers</strong><span>Syncing live Game World data</span></section>`;
  }

  function homeView(){
    const w=state.world||{};
    const latest=latestResults(5);
    const next=nextFixtures(4);
    const activeClubs=w.active_club||state.clubs.length||24;
    const compCount=state.competitions.length;
    const managerCount=activeManagers().length;
    const resultCount=state.results.length;
    const transferCount=state.transfers.length;
    const topPlayers=topStats(5);
    const divisions=[...new Set(state.competitions.filter(c=>String(c.sm_action||'').toLowerCase()==='league').map(c=>c.sm_division).filter(v=>v!=null))].length;
    return `
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">ITALIAN MASTERS CLUB · ${esc(w.game_world_id||GW)}</div>
          <h1>${esc(w.game_world_name||'Hall Of Famers')}</h1>
          <p class="hero-sub">Game World ${esc(w.sm_game_world_id||'468194')} · ${activeClubs} clubs · ${divisions||3} divisions</p>
        </div>
        <div class="hero-orbit" aria-hidden="true"><span>HOF</span></div>
        <div class="hero-metrics">
          ${metric(activeClubs,'CLUBS')}${metric(compCount,'COMPETITIONS')}${metric(resultCount,'RESULTS')}${metric(transferCount,'TRANSFERS')}
        </div>
      </section>

      <section class="ticker"><span>LIVE</span><div>${tickerText()}</div></section>

      <section class="home-grid">
        <article class="panel scores-panel">
          ${sectionHead('Latest results','#scores','ALL RESULTS')}
          <div class="score-list">${latest.length?latest.map(scoreRow).join(''):empty('No results yet')}</div>
        </article>

        <article class="panel fixtures-panel">
          ${sectionHead('Next fixtures','#calendar','FULL CALENDAR')}
          <div class="fixture-list">${next.length?next.map(fixtureRow).join(''):empty('No upcoming fixtures')}</div>
        </article>

        <article class="panel competition-panel">
          ${sectionHead('Competition desk','#competitions','EXPLORE')}
          <div class="competition-strip">${competitionSummary()}</div>
        </article>

        <article class="panel club-panel">
          ${sectionHead('Club hub','#clubs',`${activeClubs} CLUBS`)}
          <div class="club-preview">${state.clubs.slice(0,8).map(clubTile).join('')}</div>
        </article>

        <article class="panel manager-panel">
          ${sectionHead('Manager room','#managers',`${managerCount} ACTIVE`)}
          <div class="manager-preview">${activeManagers().slice(0,5).map(managerRow).join('')||empty('No assignments')}</div>
        </article>

        <article class="panel transfer-panel">
          ${sectionHead('Transfer wire','#transfers','LIVE FEED')}
          <div class="news-list">${state.transfers.slice(0,5).map(transferRow).join('')||empty('No transfers')}</div>
        </article>

        <article class="panel player-panel">
          ${sectionHead('Top performers','#players','PLAYER STATS')}
          <div class="rank-list">${topPlayers.map((p,i)=>playerRank(p,i)).join('')||empty('No player stats')}</div>
        </article>

        <article class="panel reports-panel">
          ${sectionHead('Matchroom','#reports',`${state.reports.length} REPORTS`)}
          <div class="report-feature">${reportFeature()}</div>
        </article>
      </section>`;
  }

  function scoresView(){
    const all=[...state.results].sort((a,b)=>dateValue(b)-dateValue(a));
    return page('RESULTS','All recorded results',`${all.length} matches`,all.length?`<div class="score-list full">${all.map(scoreRow).join('')}</div>`:empty('No results'));
  }

  function calendarView(){
    const all=[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b));
    return page('FIXTURES','Full schedule',`${all.length} fixtures`,all.length?`<div class="fixture-list full">${all.map(fixtureRow).join('')}</div>`:empty('No fixtures'));
  }

  function competitionsView(){
    const groups=groupBy(state.competitions,c=>c.sm_action_group||'OTHER');
    return page('COMPETITIONS','Competition architecture',`${state.competitions.length} entries`,Object.entries(groups).map(([g,items])=>`
      <section class="content-block"><div class="block-title"><span>${esc(g)}</span><b>${items.length}</b></div><div class="competition-list">${items.map(competitionRow).join('')}</div></section>`).join(''));
  }

  function clubsView(){
    return page('CLUBS','Game World club directory',`${state.clubs.length} clubs`,`<div class="club-directory">${state.clubs.map(clubCard).join('')}</div>`);
  }

  function managersView(){
    const nationalMap=new Map(state.nationals.map(n=>[String(n.id),n]));
    const rows=state.managers.map(m=>{
      const nat=m.national_team_id?nationalMap.get(String(m.national_team_id)):null;
      return {...m,national_name:nat?.name||null,national_image:nat?.image_url||null};
    });
    return page('MANAGERS','Club and national assignments',`${rows.length} assignments`,`<div class="manager-directory">${rows.map(managerCard).join('')}</div>`);
  }

  function transfersView(){
    return page('TRANSFERS','Latest market activity',`${state.transfers.length} moves`,`<div class="news-list full">${state.transfers.map(transferRow).join('')||empty('No transfers')}</div>`);
  }

  function playersView(){
    const sorted=topStats(Math.max(state.stats.length,1000));
    return page('PLAYERS','SM performance leaderboard',`${state.stats.length} stat rows`,`<div class="player-table">${sorted.map((p,i)=>playerTableRow(p,i)).join('')||empty('No player stats')}</div>`);
  }

  function reportsView(){
    const all=[...state.reports].sort((a,b)=>dateValue(b)-dateValue(a));
    return page('MATCH REPORTS','Matchroom archive',`${all.length} reports`,`<div class="report-list">${all.map(reportRow).join('')||empty('No match reports')}</div>`);
  }

  function page(title,sub,meta,content){return `<section class="page-head"><div class="eyebrow">${GW}</div><h1>${title}</h1><p>${sub}</p><span>${meta}</span></section><section class="page-content">${content}</section>`;}
  function metric(v,l){return `<div><strong>${esc(v)}</strong><span>${l}</span></div>`;}
  function sectionHead(title,href,meta){return `<div class="section-head"><h2>${title}</h2><a href="${href}">${meta} <b>›</b></a></div>`;}

  function tickerText(){
    const r=latestResults(1)[0], f=nextFixtures(1)[0], t=state.transfers[0];
    const chunks=[];
    if(r) chunks.push(`Latest: ${matchText(r,true)}`);
    if(f) chunks.push(`Next: ${matchText(f,false)}`);
    if(t) chunks.push(`Market: ${transferText(t)}`);
    return esc(chunks.join('  ·  ')||'Hall Of Famers data feed connected');
  }

  function latestResults(n){return [...state.results].sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,n);}
  function nextFixtures(n){
    const now=Date.now();
    const future=state.schedule.filter(x=>!Number.isFinite(dateValue(x))||dateValue(x)>=now).sort((a,b)=>dateValue(a)-dateValue(b));
    return (future.length?future:[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b))).slice(0,n);
  }

  function scoreRow(r){
    const home=get(r,['home_name','home_team','home_club_name'],'Home');
    const away=get(r,['away_name','away_team','away_club_name'],'Away');
    const hs=get(r,['home_score','score_home','home_goals'],'–');
    const as=get(r,['away_score','score_away','away_goals'],'–');
    return `<div class="score-row"><div class="score-meta"><span>${esc(compLabel(r))}</span><time>${fmtDate(dateValue(r))}</time></div><div class="score-main"><span>${esc(home)}</span><strong>${esc(hs)}<i>:</i>${esc(as)}</strong><span>${esc(away)}</span></div></div>`;
  }

  function fixtureRow(r){
    const home=get(r,['home_name','home_team','home_club_name'],'Home');
    const away=get(r,['away_name','away_team','away_club_name'],'Away');
    const time=get(r,['match_time','time','kickoff_time'],'');
    return `<div class="fixture-row"><div><b>${fmtDate(dateValue(r))}</b><span>${esc(compLabel(r))}</span></div><p><strong>${esc(home)}</strong><em>vs</em><strong>${esc(away)}</strong></p><time>${esc(time||'')}</time></div>`;
  }

  function competitionSummary(){
    const league=state.competitions.filter(c=>String(c.sm_action||'').toLowerCase()==='league');
    const domestic=state.competitions.filter(c=>String(c.sm_action_group||'').toUpperCase()==='DOMESTIC').length;
    const intl=state.competitions.filter(c=>String(c.sm_action_group||'').toUpperCase()==='INTERNATIONAL').length;
    const nations=state.competitions.filter(c=>String(c.sm_action_group||'').toUpperCase()==='NATIONS').length;
    return [
      ['League divisions',[...new Set(league.map(x=>x.sm_division).filter(Boolean))].length],
      ['Domestic',domestic],['International',intl],['Nations',nations]
    ].map(([l,v])=>`<a href="#competitions"><strong>${v}</strong><span>${l}</span></a>`).join('');
  }

  function clubTile(c){
    const x=state.clubCodex.get(String(c.club_id));
    return `<a class="club-tile" href="#clubs">${logo(x?.image_url,c.club_name)}<span>${esc(c.club_name)}</span></a>`;
  }

  function clubCard(c){
    const x=state.clubCodex.get(String(c.club_id));
    const mgr=state.managers.find(m=>String(m.club_id||'')===String(c.club_id||'')&&!m.end_date);
    const recent=state.results.filter(r=>String(get(r,['home_name'],'')).toLowerCase()===String(c.club_name).toLowerCase()||String(get(r,['away_name'],'')).toLowerCase()===String(c.club_name).toLowerCase()).slice(0,1)[0];
    return `<article class="club-card">${logo(x?.image_url,c.club_name)}<div><h3>${esc(c.club_name)}</h3><p>${mgr?esc(mgr.full_name):'Manager not assigned'}</p><span>${recent?esc(matchText(recent,true)):'No recent result'}</span></div><b>${esc(c.sm_club_id||'')}</b></article>`;
  }

  function managerRow(m){return `<div class="manager-row"><span>${initials(m.full_name)}</span><div><strong>${esc(m.full_name||'Manager')}</strong><small>${esc(managerDestination(m))}</small></div><time>${fmtDate(Date.parse(m.start_date||''))}</time></div>`;}
  function managerCard(m){return `<article class="manager-card"><div class="avatar">${initials(m.full_name)}</div><div><h3>${esc(m.full_name||'Manager')}</h3><p>${esc(managerDestination(m))}</p><span>${esc(m.assignment_type||'assignment')}</span></div><time>${fmtDate(Date.parse(m.start_date||''))}</time></article>`;}
  function managerDestination(m){
    if(m.club_id){const c=state.clubs.find(x=>String(x.club_id)===String(m.club_id));if(c)return c.club_name;}
    if(m.national_name)return m.national_name;
    if(m.national_team_id){const n=state.nationals.find(x=>String(x.id)===String(m.national_team_id));if(n)return n.name;}
    return 'IMC';
  }

  function transferRow(t){return `<article class="news-row"><div class="news-date">${fmtDate(transferDate(t))}</div><div><strong>${esc(get(t,['player_name','full_name','name'],'Transfer'))}</strong><p>${esc(transferText(t))}</p></div><span>${esc(transferFee(t))}</span></article>`;}
  function transferText(t){
    const from=get(t,['from_club_name','old_club_name','seller_club_name','from_name'],'');
    const to=get(t,['to_club_name','new_club_name','buyer_club_name','to_name'],'');
    if(from||to)return `${from||'—'} → ${to||'—'}`;
    return get(t,['description','transfer_type','type'],'Transfer');
  }
  function transferFee(t){return get(t,['transfer_fee','fee','amount','value','transfer_value'],'');}
  function transferDate(t){const raw=get(t,['transfer_date','date','created_at'],null);const d=Date.parse(raw||'');return Number.isFinite(d)?d:NaN;}

  function topStats(n){return [...state.stats].sort((a,b)=>Number(get(b,['goals'],0))-Number(get(a,['goals'],0))||Number(get(b,['avg_rating','rating'],0))-Number(get(a,['avg_rating','rating'],0))).slice(0,n);}
  function playerRank(p,i){return `<div class="rank-row"><b>${i+1}</b><div><strong>${esc(get(p,['player_name','full_name','name'],'Player'))}</strong><span>${esc(get(p,['club_name'],'—'))}</span></div><em>${esc(get(p,['goals'],0))} G</em><small>${esc(get(p,['avg_rating','rating'],'—'))}</small></div>`;}
  function playerTableRow(p,i){return `<article class="player-row"><b>${i+1}</b><div><strong>${esc(get(p,['player_name','full_name','name'],'Player'))}</strong><span>${esc(get(p,['club_name'],'—'))} · ${esc(get(p,['appearances'],0))} apps</span></div><div><strong>${esc(get(p,['goals'],0))}</strong><small>GOALS</small></div><div><strong>${esc(get(p,['avg_rating','rating'],'—'))}</strong><small>AVG</small></div></article>`;}

  function reportFeature(){const r=[...state.reports].sort((a,b)=>dateValue(b)-dateValue(a))[0];if(!r)return empty('No match reports');return `<a href="#reports" class="report-hero"><span>MATCH REPORT</span><strong>${esc(matchText(r,false))}</strong><p>${fmtDate(dateValue(r))} · ${esc(compLabel(r))}</p><b>Read archive ›</b></a>`;}
  function reportRow(r){return `<article class="report-row"><div><span>${fmtDate(dateValue(r))}</span><strong>${esc(matchText(r,false))}</strong><small>${esc(compLabel(r))}</small></div><b>›</b></article>`;}

  function competitionRow(c){
    const title=c.custom_competition||actionLabel(c.sm_action,c.sm_division);
    const bits=[c.sm_country,c.sm_division?`Division ${c.sm_division}`:null,c.teams_count?`${c.teams_count} teams`:null,c.expected_match?`${c.expected_match} expected matches`:null].filter(Boolean);
    return `<article class="competition-row"><div><span>${esc(c.sm_action_group||'')}</span><strong>${esc(title)}</strong><p>${esc(bits.join(' · '))}</p></div><b>${c.is_sm_action?'SM':'IMC'}</b></article>`;
  }
  function actionLabel(a,d){const x=String(a||'Competition');const map={league:'League',leaguecup:'League Cup',leagueshield:'League Shield',charityshield:'Charity Shield',playoff:'Playoff',smfacup:'SMFA Cup',smfashield:'SMFA Shield',supercup:'Super Cup',interqualifier:'Inter Qualifier',worldcup:'World Cup',friendly:'Friendly'};return `${map[x.toLowerCase()]||x}${x.toLowerCase()==='league'&&d?` · Division ${d}`:''}`;}

  function activeManagers(){return state.managers.filter(m=>!m.end_date);}
  function compLabel(r){return get(r,['competition_key','competition_group_name','sm_action','competition'],'Competition');}
  function matchText(r,score){
    const h=get(r,['home_name','home_team','home_club_name'],'Home'),a=get(r,['away_name','away_team','away_club_name'],'Away');
    if(score){const hs=get(r,['home_score','score_home','home_goals'],'–'),as=get(r,['away_score','score_away','away_goals'],'–');return `${h} ${hs}-${as} ${a}`;}
    return `${h} vs ${a}`;
  }
  function dateValue(r){const raw=get(r,['match_date','date','kickoff','fixture_date','played_at','scheduled_at'],null);const d=Date.parse(raw||'');return Number.isFinite(d)?d:NaN;}
  function fmtDate(v){if(!Number.isFinite(v))return '—';return new Date(v).toLocaleDateString('it-IT',{day:'2-digit',month:'short'});}
  function groupBy(arr,fn){return arr.reduce((a,x)=>{const k=fn(x);(a[k]||(a[k]=[])).push(x);return a;},{});}
  function get(o,keys,fallback=''){for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=='')return o[k];}return fallback;}
  function rows(v){return Array.isArray(v)?v:Array.isArray(v?.rows)?v.rows:Array.isArray(v?.data)?v.data:[];}
  async function read(api,name,params={}){return api.read(name,params);}
  function waitApi(ms){return new Promise(resolve=>{const s=Date.now();const t=()=>window.IMC_MINISITE_DATA?.read?resolve(window.IMC_MINISITE_DATA):Date.now()-s>ms?resolve(null):setTimeout(t,50);t();});}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function initials(n){return esc(String(n||'IMC').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase());}
  function logo(url,name){return url?`<img class="club-logo" src="${esc(url)}" alt="${esc(name)}" loading="lazy">`:`<span class="club-logo fallback">${initials(name)}</span>`;}
  function empty(t){return `<div class="empty">${esc(t)}</div>`;}
})();
