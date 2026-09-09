(() => {
  const GW='GW001';
  const root=document.getElementById('app');
  if(!root) return;

  const state={world:null,clubs:[],clubCodex:new Map(),competitions:[],managers:[],managerCodex:new Map(),results:[],schedule:[],transfers:[],stats:[],reports:[],playerCodex:new Map(),loading:true,error:null};
  const routes=['home','scores','fixtures','clubs','managers','players','transfers','competitions','reports'];

  window.addEventListener('hashchange',render);
  boot();

  async function boot(){
    shell();
    const api=await waitApi(2500);
    if(!api){state.loading=false;state.error='Data service unavailable';render();return;}
    try{
      const [world,clubs,competitions,managers,results,schedule,transfers,stats,reports]=await Promise.all([
        read(api,'game_world_codex'),read(api,'game_world_club_mapping'),read(api,'competition_codex'),read(api,'manager_assignments'),
        read(api,'results',{limit:1000}),read(api,'schedule',{limit:1000}),read(api,'transfers',{limit:1000}),read(api,'sm_player_stats',{limit:1000}),read(api,'match_report',{limit:1000})
      ]);
      state.world=rows(world)[0]||null; state.clubs=rows(clubs); state.competitions=rows(competitions); state.managers=rows(managers);
      state.results=rows(results); state.schedule=rows(schedule); state.transfers=rows(transfers); state.stats=rows(stats); state.reports=rows(reports);
      await Promise.all([hydrateClubs(api),hydrateManagers(api),hydratePlayers(api)]);
    }catch(e){console.error(e);state.error=e?.message||'Unable to load data';}
    state.loading=false; render();
  }

  async function hydrateClubs(api){
    await Promise.all(state.clubs.map(async c=>{const id=c.club_id;if(!id)return;try{const r=rows(await read(api,'club_codex',{club_id:id}))[0];if(r)state.clubCodex.set(String(id),r);}catch{}}));
  }
  async function hydrateManagers(api){
    const ids=[...new Set(state.managers.map(x=>x.manager_id).filter(Boolean))].slice(0,50);
    await Promise.all(ids.map(async id=>{try{const r=rows(await read(api,'manager_codex',{manager_id:id}))[0];if(r)state.managerCodex.set(String(id),r);}catch{}}));
  }
  async function hydratePlayers(api){
    const ids=topStats(10).map(x=>x.sm_player_id||x.player_id).filter(Boolean);
    await Promise.all(ids.map(async id=>{try{const r=rows(await read(api,'player_codex',{player_id:id}))[0];if(r)state.playerCodex.set(String(id),r);}catch{}}));
  }

  function shell(){
    root.innerHTML=`<div class="sky-shell">
      <header class="sky-top"><a href="#home" class="sky-brand"><span>IMC</span><b>SPORT</b></a><div class="sky-world">GW001</div></header>
      <nav class="sky-tabs">${[['home','Home'],['scores','Scores'],['fixtures','Fixtures'],['clubs','Clubs'],['managers','Managers'],['players','Players'],['transfers','Transfers'],['competitions','Competitions'],['reports','Reports']].map(([r,l])=>`<a href="#${r}" data-nav="${r}">${l}</a>`).join('')}</nav>
      <main id="view"></main>
      <nav class="sky-dock">${[['home','⌂','Home'],['scores','●','Scores'],['fixtures','◷','Fixtures'],['players','★','Players'],['clubs','◆','Clubs']].map(([r,i,l])=>`<a href="#${r}" data-dock="${r}"><span>${i}</span><b>${l}</b></a>`).join('')}</nav>
    </div>`;
    render();
  }

  function route(){const r=(location.hash||'#home').slice(1).split('?')[0];return routes.includes(r)?r:'home';}
  function render(){
    const view=document.getElementById('view'); if(!view)return; const r=route();
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===r));
    document.querySelectorAll('[data-dock]').forEach(a=>a.classList.toggle('active',a.dataset.dock===r));
    if(state.loading){view.innerHTML='<section class="sky-loader"><i></i><strong>IMC SPORT</strong><span>Connecting live Game World feed</span></section>';return;}
    const map={home:homeView,scores:scoresView,fixtures:fixturesView,clubs:clubsView,managers:managersView,players:playersView,transfers:transfersView,competitions:competitionsView,reports:reportsView};
    view.innerHTML=map[r]();
  }

  function homeView(){
    const w=state.world||{}; const latest=latestResults(1)[0]; const next=nextFixtures(1)[0]; const top=topStats(5); const lead=top[0]||null;
    const heroImage=lead?playerImage(lead):'';
    return `<section class="breaking"><span>BREAKING</span><div>${esc(breakingText())}</div></section>
      <section class="hero-story ${heroImage?'has-image':''}" style="${heroImage?`--hero:url('${attr(heroImage)}')`:''}">
        <div class="hero-shade"></div><div class="hero-copy"><span class="hero-kicker">ROAD TO HISTORY · LIVE</span>
        <h1>${esc(w.game_world_name||'Road To History')}</h1><p>${heroSummary()}</p>
        <div class="hero-actions"><a href="#scores">MATCH CENTRE</a><a href="#players">PLAYER INDEX</a></div></div>
        <div class="hero-score">${latest?bigScore(latest):next?bigFixture(next):'<b>LIVE DATA</b><span>Feed connected</span>'}</div>
      </section>

      <section class="broadcast-grid">
        <article class="story-card story-card--red"><span>TOP STORY</span><h2>${esc(latest?matchText(latest,true):'The season is live')}</h2><p>${esc(latest?compLabel(latest):'Latest Game World updates')}</p><a href="#scores">Full scores →</a></article>
        <article class="story-card story-card--blue"><span>NEXT UP</span><h2>${esc(next?matchText(next,false):'Fixture desk')}</h2><p>${esc(next?fmtDate(dateValue(next)):'Calendar synced')}</p><a href="#fixtures">Open calendar →</a></article>
      </section>

      <section class="section-block"><div class="section-title"><span>POWER RANKING</span><a href="#players">All players</a></div><div class="player-cards">${top.map((p,i)=>playerFeature(p,i)).join('')||empty('No player stats')}</div></section>
      <section class="section-block"><div class="section-title"><span>CLUB WALL</span><a href="#clubs">${state.clubs.length} clubs</a></div><div class="club-wall">${state.clubs.slice(0,12).map(clubBubble).join('')}</div></section>
      <section class="section-block"><div class="section-title"><span>MANAGER ZONE</span><a href="#managers">All managers</a></div><div class="manager-strip">${activeManagers().slice(0,6).map(managerTile).join('')||empty('No manager assignments')}</div></section>
      <section class="two-col"><article class="mini-panel"><div class="section-title"><span>TRANSFER DESK</span><a href="#transfers">Live</a></div>${state.transfers.slice(0,4).map(transferRow).join('')||empty('No transfers')}</article>
      <article class="mini-panel"><div class="section-title"><span>COMPETITION CENTRE</span><a href="#competitions">Explore</a></div>${competitionPills()}</article></section>`;
  }

  function scoresView(){return page('SCORES','Latest results',`${state.results.length} matches`,latestResults(state.results.length).map(scoreRow).join('')||empty('No results'));}
  function fixturesView(){return page('FIXTURES','Upcoming schedule',`${state.schedule.length} fixtures`,[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b)).map(fixtureRow).join('')||empty('No fixtures'));}
  function clubsView(){return page('CLUBS','Game World club directory',`${state.clubs.length} clubs`,`<div class="club-grid">${state.clubs.map(clubCard).join('')}</div>`);}
  function managersView(){return page('MANAGERS','Manager assignments',`${state.managers.length} assignments`,`<div class="manager-grid">${state.managers.map(managerCard).join('')}</div>`);}
  function playersView(){return page('PLAYERS','Performance rankings',`${state.stats.length} stat rows`,`<div class="rank-table">${topStats(state.stats.length).map((p,i)=>rankRow(p,i)).join('')||empty('No player stats')}</div>`);}
  function transfersView(){return page('TRANSFERS','Market feed',`${state.transfers.length} moves`,`<div class="feed-list">${state.transfers.map(transferRow).join('')||empty('No transfers')}</div>`);}
  function competitionsView(){return page('COMPETITIONS','Game World competition map',`${state.competitions.length} entries`,`<div class="competition-grid">${state.competitions.map(compCard).join('')}</div>`);}
  function reportsView(){return page('MATCH REPORTS','Matchroom archive',`${state.reports.length} reports`,`<div class="feed-list">${state.reports.map(reportRow).join('')||empty('No reports')}</div>`);}

  function page(t,s,m,c){return `<section class="page-hero"><span>IMC SPORT · ${GW}</span><h1>${t}</h1><p>${s}</p><b>${m}</b></section><section class="page-body">${c}</section>`;}
  function breakingText(){const r=latestResults(1)[0],t=state.transfers[0],n=nextFixtures(1)[0];return [r&&`Latest ${matchText(r,true)}`,n&&`Next ${matchText(n,false)}`,t&&transferText(t)].filter(Boolean).join('  •  ')||'Road To History live feed connected';}
  function heroSummary(){const w=state.world||{};return `${w.active_club||state.clubs.length||0} clubs · ${state.competitions.length} competition entries · ${state.results.length} recorded results`;}
  function bigScore(r){const h=get(r,['home_name','home_team','home_club_name'],'Home'),a=get(r,['away_name','away_team','away_club_name'],'Away'),hs=get(r,['home_score','score_home','home_goals'],'–'),as=get(r,['away_score','score_away','away_goals'],'–');return `<span>${esc(compLabel(r))}</span><strong>${esc(hs)} <i>:</i> ${esc(as)}</strong><b>${esc(h)} · ${esc(a)}</b>`;}
  function bigFixture(r){return `<span>NEXT FIXTURE</span><strong>VS</strong><b>${esc(matchText(r,false))}</b>`;}
  function playerFeature(p,i){const id=p.sm_player_id||p.player_id,img=playerImage(p),name=get(p,['player_name','full_name','name'],`Player ${id||''}`),goals=num(p.goals),apps=num(p.appearances),rating=get(p,['avg_rating','rating'],'–');return `<a class="player-feature" href="#players">${img?`<img src="${attr(img)}" alt="${esc(name)}">`:`<div class="player-fallback">${initials(name)}</div>`}<div><span>#${i+1} · FORM</span><h3>${esc(name)}</h3><p>${apps} APP · ${goals} G · ${esc(rating)} AVG</p></div></a>`;}
  function clubBubble(c){const x=state.clubCodex.get(String(c.club_id));return `<a href="#clubs">${logo(x?.image_url,c.club_name)}<span>${esc(c.club_name)}</span></a>`;}
  function managerTile(m){const x=state.managerCodex.get(String(m.manager_id));const name=x?.full_name||m.manager_name||`Manager ${m.manager_id||''}`;return `<a href="#managers"><div>${initials(name)}</div><strong>${esc(name)}</strong><span>${esc(m.club_name||'IMC Manager')}</span></a>`;}
  function transferRow(t){return `<div class="feed-row"><span>${fmtDate(dateValue(t))}</span><div><strong>${esc(transferText(t))}</strong><p>${esc(get(t,['from_club_name','old_club_name'],'Market'))} → ${esc(get(t,['to_club_name','new_club_name'],'Update'))}</p></div></div>`;}
  function competitionPills(){const groups=groupBy(state.competitions,x=>x.sm_action_group||'OTHER');return `<div class="comp-pills">${Object.entries(groups).map(([g,v])=>`<a href="#competitions"><strong>${v.length}</strong><span>${esc(g)}</span></a>`).join('')}</div>`;}
  function scoreRow(r){return `<div class="score-row"><div><span>${esc(compLabel(r))}</span><time>${fmtDate(dateValue(r))}</time></div><p>${esc(get(r,['home_name','home_team'],'Home'))}</p><strong>${esc(get(r,['home_score'],'–'))} : ${esc(get(r,['away_score'],'–'))}</strong><p>${esc(get(r,['away_name','away_team'],'Away'))}</p></div>`;}
  function fixtureRow(r){return `<div class="fixture-row"><div><span>${fmtDate(dateValue(r))}</span><small>${esc(compLabel(r))}</small></div><p>${esc(matchText(r,false))}</p><b>›</b></div>`;}
  function clubCard(c){const x=state.clubCodex.get(String(c.club_id));const m=state.managers.find(a=>String(a.club_id||'')===String(c.club_id||'')&&!a.end_date);return `<article class="club-card">${logo(x?.image_url,c.club_name)}<div><span>CLUB ${esc(c.club_id||'')}</span><h3>${esc(c.club_name)}</h3><p>${esc(m?.manager_name||'Manager data')}</p></div></article>`;}
  function managerCard(m){const x=state.managerCodex.get(String(m.manager_id));const name=x?.full_name||m.manager_name||`Manager ${m.manager_id||''}`;return `<article class="manager-card"><div>${initials(name)}</div><section><span>IMC MANAGER</span><h3>${esc(name)}</h3><p>${esc(m.club_name||'Club assignment')}</p></section></article>`;}
  function rankRow(p,i){const n=get(p,['player_name','full_name','name'],'Player'),id=p.sm_player_id||p.player_id;return `<div class="rank-row"><b>${i+1}</b>${playerImage(p)?`<img src="${attr(playerImage(p))}" alt="${esc(n)}">`:`<i>${initials(n)}</i>`}<div><strong>${esc(n)}</strong><span>${esc(get(p,['club_name'],'Club'))}</span></div><em>${esc(get(p,['avg_rating','rating'],'–'))}</em><small>${num(p.goals)} G</small></div>`;}
  function compCard(c){return `<article class="comp-card"><span>${esc(c.sm_action_group||'COMPETITION')}</span><h3>${esc(c.custom_competition||c.sm_action||'Competition')}</h3><p>${esc(c.sm_country||'Global')} ${c.sm_division?`· Division ${esc(c.sm_division)}`:''}</p><b>${esc(c.teams_count||'–')} teams</b></article>`;}
  function reportRow(r){return `<div class="feed-row"><span>${fmtDate(dateValue(r))}</span><div><strong>${esc(matchText(r,true))}</strong><p>${esc(compLabel(r))}</p></div></div>`;}

  function latestResults(n){return [...state.results].sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,n);}
  function nextFixtures(n){const now=Date.now();const f=state.schedule.filter(x=>!Number.isFinite(dateValue(x))||dateValue(x)>=now).sort((a,b)=>dateValue(a)-dateValue(b));return (f.length?f:[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b))).slice(0,n);}
  function topStats(n){return [...state.stats].sort((a,b)=>num(b.avg_rating)-num(a.avg_rating)||num(b.goals)-num(a.goals)||num(b.appearances)-num(a.appearances)).slice(0,n);}
  function activeManagers(){return state.managers.filter(x=>!x.end_date);}
  function playerImage(p){const id=p.sm_player_id||p.player_id;const x=state.playerCodex.get(String(id));return x?.image_url||p.image_url||'';}
  function matchText(r,score){const h=get(r,['home_name','home_team','home_club_name'],'Home'),a=get(r,['away_name','away_team','away_club_name'],'Away');if(score){const hs=get(r,['home_score'],'–'),as=get(r,['away_score'],'–');return `${h} ${hs}-${as} ${a}`;}return `${h} vs ${a}`;}
  function transferText(t){return get(t,['player_name','full_name','name'],'Transfer update');}
  function compLabel(r){return get(r,['competition_group_name','custom_competition','competition_key','sm_action'],'Competition');}
  function dateValue(r){const raw=get(r,['match_date','date','transfer_date','change_date','played_at','scheduled_at'],null);const t=raw?Date.parse(raw):NaN;return Number.isFinite(t)?t:NaN;}
  function fmtDate(t){return Number.isFinite(t)?new Date(t).toLocaleDateString('it-IT',{day:'2-digit',month:'short'}):'LIVE';}
  function rows(v){if(Array.isArray(v))return v;if(!v||typeof v!=='object')return[];for(const k of ['rows','data','items'])if(Array.isArray(v[k]))return v[k];if(v.result){if(Array.isArray(v.result))return v.result;if(Array.isArray(v.result.rows))return v.result.rows;if(Array.isArray(v.result.data))return v.result.data;}return[];}
  async function read(api,r,p={}){return api.read(r,p);}
  function waitApi(ms){return new Promise(res=>{const s=Date.now();(function t(){const a=window.IMC_MINISITE_DATA;if(a&&typeof a.read==='function')return res(a);if(Date.now()-s>=ms)return res(null);setTimeout(t,80)})();});}
  function get(o,ks,d=''){for(const k of ks)if(o?.[k]!=null&&o[k]!=='')return o[k];return d;}
  function groupBy(a,f){return a.reduce((m,x)=>{const k=f(x);(m[k]||(m[k]=[])).push(x);return m;},{});}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function initials(v){return String(v||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
  function logo(url,name){return url?`<img class="club-logo" src="${attr(url)}" alt="${esc(name)}" loading="lazy">`:`<i class="club-logo fallback">${initials(name)}</i>`;}
  function empty(t){return `<div class="empty">${esc(t)}</div>`;}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function attr(v){return esc(v).replace(/`/g,'&#96;');}
})();
