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
        read(api,'game_world_codex'),read(api,'game_world_club_mapping'),read(api,'competition_codex'),read(api,'manager_assignments'),read(api,'results',{limit:1000}),read(api,'schedule',{limit:1000}),read(api,'transfers',{limit:1000}),read(api,'sm_player_stats',{limit:1000}),read(api,'match_report',{limit:1000})
      ]);
      state.world=rows(world)[0]||null; state.clubs=rows(clubs); state.competitions=rows(competitions); state.managers=rows(managers); state.results=rows(results); state.schedule=rows(schedule); state.transfers=rows(transfers); state.stats=rows(stats); state.reports=rows(reports);
      await Promise.all([hydrateClubs(api),hydrateManagers(api),hydratePlayers(api)]);
    }catch(e){console.error(e);state.error=e?.message||'Unable to load data';}
    state.loading=false; render();
  }

  async function hydrateClubs(api){await Promise.all(state.clubs.map(async c=>{if(!c.club_id)return;try{const r=rows(await read(api,'club_codex',{club_id:c.club_id}))[0];if(r)state.clubCodex.set(String(c.club_id),r);}catch{}}));}
  async function hydrateManagers(api){const ids=[...new Set(state.managers.map(x=>x.manager_id).filter(Boolean))].slice(0,40);await Promise.all(ids.map(async id=>{try{const r=rows(await read(api,'manager_codex',{manager_id:id}))[0];if(r)state.managerCodex.set(String(id),r);}catch{}}));}
  async function hydratePlayers(api){const ids=topStats(12).map(x=>x.sm_player_id||x.player_id).filter(Boolean);await Promise.all(ids.map(async id=>{try{const r=rows(await read(api,'player_codex',{player_id:id}))[0];if(r)state.playerCodex.set(String(id),r);}catch{}}));}

  function shell(){
    root.innerHTML=`<div class="studio-shell">
      <aside class="rail">
        <a href="#home" class="rail-logo">IMC<span>001</span></a>
        ${[['home','H','Home'],['scores','R','Results'],['fixtures','F','Fixtures'],['clubs','C','Clubs'],['managers','M','Managers'],['players','P','Players'],['transfers','T','Transfers'],['competitions','X','Competitions'],['reports','A','Reports']].map(([r,i,l])=>`<a href="#${r}" data-nav="${r}" title="${l}"><b>${i}</b><small>${l}</small></a>`).join('')}
      </aside>
      <main id="stage"></main>
      <div class="signal"><span>LIVE</span><div id="ticker">ROAD TO HISTORY · IMC SPORT NETWORK</div></div>
    </div>`;
    render();
  }

  function route(){const r=(location.hash||'#home').slice(1).split('?')[0];return routes.includes(r)?r:'home';}
  function render(){
    const stage=document.getElementById('stage'); if(!stage)return; const r=route();
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===r));
    if(state.loading){stage.innerHTML='<section class="loading"><div></div><strong>IMC SPORT NETWORK</strong><span>Opening the live feed…</span></section>';return;}
    document.getElementById('ticker').textContent=tickerText();
    const map={home:homeView,scores:scoresView,fixtures:fixturesView,clubs:clubsView,managers:managersView,players:playersView,transfers:transfersView,competitions:competitionsView,reports:reportsView};
    stage.innerHTML=map[r]();
  }

  function homeView(){
    const w=state.world||{}; const lead=topStats(1)[0]; const latest=latestResults(1)[0]; const next=nextFixtures(1)[0]; const img=lead?playerImage(lead):'';
    return `<section class="broadcast-home">
      <div class="masthead"><span>IMC SPORT NETWORK · ${GW}</span><b>${esc(w.game_world_name||'Road To History')}</b><em>${state.clubs.length} CLUBS · ${state.results.length} RESULTS · ${state.competitions.length} COMPETITIONS</em></div>

      <article class="lead-story ${img?'with-photo':''}" style="${img?`--lead:url('${attr(img)}')`:''}">
        <div class="lead-gradient"></div>
        <div class="lead-copy"><span>TONIGHT ON IMC</span><h1>${esc(w.game_world_name||'ROAD TO HISTORY')}</h1><p>${lead?`${esc(get(lead,['player_name','full_name','name'],'Top performer'))} guida il power ranking del Game World.`:'La stagione, i manager, i club e tutte le storie di GW001 in diretta.'}</p><div><a href="#scores">MATCH CENTRE</a><a href="#players">POWER RANKING</a></div></div>
        <div class="lead-stat"><small>GW001</small><strong>${esc(state.results.length)}</strong><span>RESULTS</span></div>
      </article>

      <section class="floating-strip">
        ${latest?`<a href="#scores" class="float-card score-card"><span>FINAL</span><strong>${esc(matchText(latest,true))}</strong><small>${esc(compLabel(latest))}</small></a>`:''}
        ${next?`<a href="#fixtures" class="float-card next-card"><span>NEXT</span><strong>${esc(matchText(next,false))}</strong><small>${fmtDate(dateValue(next))}</small></a>`:''}
        <a href="#transfers" class="float-card market-card"><span>MARKET</span><strong>${state.transfers.length} moves tracked</strong><small>Transfer desk</small></a>
      </section>

      <section class="studio-grid">
        <article class="studio-tile tile-rank"><header><span>POWER 5</span><a href="#players">OPEN</a></header><div>${topStats(5).map((p,i)=>powerRow(p,i)).join('')||empty('No player stats')}</div></article>
        <article class="studio-tile tile-clubs"><header><span>CLUB WALL</span><a href="#clubs">ALL</a></header><div class="club-mosaic">${state.clubs.slice(0,16).map(clubLogoTile).join('')}</div></article>
        <article class="studio-tile tile-managers"><header><span>MANAGER CAM</span><a href="#managers">ALL</a></header><div class="manager-cam">${activeManagers().slice(0,4).map(managerCam).join('')||empty('No managers')}</div></article>
        <article class="studio-tile tile-competitions"><header><span>COMPETITION MAP</span><a href="#competitions">EXPLORE</a></header><div class="comp-map">${competitionMap()}</div></article>
      </section>
    </section>`;
  }

  function scoresView(){return newsroom('RESULTS','Match Centre',`${state.results.length} recorded matches`,`<div class="score-wall">${latestResults(state.results.length).map(scorePanel).join('')||empty('No results')}</div>`);}
  function fixturesView(){return newsroom('FIXTURES','What comes next',`${state.schedule.length} scheduled fixtures`,`<div class="fixture-timeline">${[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b)).map(fixturePanel).join('')||empty('No fixtures')}</div>`);}
  function clubsView(){return newsroom('CLUBS','The World of GW001',`${state.clubs.length} active clubs`,`<div class="club-gallery">${state.clubs.map(clubPoster).join('')}</div>`);}
  function managersView(){return newsroom('MANAGERS','Inside the dugout',`${state.managers.length} assignments`,`<div class="manager-gallery">${state.managers.map(managerPoster).join('')}</div>`);}
  function playersView(){return newsroom('PLAYERS','Power ranking',`${state.stats.length} stat rows`,`<div class="player-wall">${topStats(state.stats.length).map((p,i)=>playerPoster(p,i)).join('')||empty('No player stats')}</div>`);}
  function transfersView(){return newsroom('TRANSFERS','Transfer desk',`${state.transfers.length} moves`,`<div class="newswire">${state.transfers.map(transferStory).join('')||empty('No transfers')}</div>`);}
  function competitionsView(){return newsroom('COMPETITIONS','Competition architecture',`${state.competitions.length} entries`,`<div class="competition-wall">${state.competitions.map(compPoster).join('')}</div>`);}
  function reportsView(){return newsroom('REPORTS','Matchroom archive',`${state.reports.length} reports`,`<div class="newswire">${state.reports.map(reportStory).join('')||empty('No reports')}</div>`);}

  function newsroom(kicker,title,meta,body){return `<section class="newsroom"><div class="newsroom-head"><span>${kicker}</span><h1>${title}</h1><p>${meta}</p></div>${body}</section>`;}
  function powerRow(p,i){const n=get(p,['player_name','full_name','name'],'Player'),img=playerImage(p);return `<a href="#players" class="power-row"><b>${i+1}</b>${img?`<img src="${attr(img)}" alt="${esc(n)}">`:`<i>${initials(n)}</i>`}<div><strong>${esc(n)}</strong><span>${esc(get(p,['club_name'],'Club'))}</span></div><em>${esc(get(p,['avg_rating','rating'],'–'))}</em></a>`;}
  function clubLogoTile(c){const x=state.clubCodex.get(String(c.club_id));return `<a href="#clubs">${logo(x?.image_url,c.club_name)}<span>${esc(c.club_name)}</span></a>`;}
  function managerCam(m){const x=state.managerCodex.get(String(m.manager_id));const n=x?.full_name||m.manager_name||`Manager ${m.manager_id||''}`;return `<a href="#managers"><div>${initials(n)}</div><strong>${esc(n)}</strong><span>${esc(m.club_name||'IMC')}</span></a>`;}
  function competitionMap(){const g=groupBy(state.competitions,x=>x.sm_action_group||'OTHER');return Object.entries(g).map(([k,v])=>`<a href="#competitions"><strong>${v.length}</strong><span>${esc(k)}</span></a>`).join('');}
  function scorePanel(r){return `<article class="score-panel"><span>${esc(compLabel(r))} · ${fmtDate(dateValue(r))}</span><div><strong>${esc(get(r,['home_name','home_team'],'Home'))}</strong><b>${esc(get(r,['home_score'],'–'))} : ${esc(get(r,['away_score'],'–'))}</b><strong>${esc(get(r,['away_name','away_team'],'Away'))}</strong></div></article>`;}
  function fixturePanel(r){return `<article class="fixture-panel"><time>${fmtDate(dateValue(r))}</time><div><span>${esc(compLabel(r))}</span><strong>${esc(matchText(r,false))}</strong></div><b>›</b></article>`;}
  function clubPoster(c){const x=state.clubCodex.get(String(c.club_id));return `<article class="club-poster">${logo(x?.image_url,c.club_name)}<div><span>CLUB ${esc(c.club_id||'')}</span><h3>${esc(c.club_name)}</h3><p>${esc((state.managers.find(m=>String(m.club_id||'')===String(c.club_id||''))||{}).manager_name||'IMC Club')}</p></div></article>`;}
  function managerPoster(m){const x=state.managerCodex.get(String(m.manager_id));const n=x?.full_name||m.manager_name||`Manager ${m.manager_id||''}`;return `<article class="manager-poster"><div>${initials(n)}</div><section><span>IMC MANAGER</span><h3>${esc(n)}</h3><p>${esc(m.club_name||'Club assignment')}</p></section></article>`;}
  function playerPoster(p,i){const n=get(p,['player_name','full_name','name'],'Player'),img=playerImage(p);return `<article class="player-poster">${img?`<img src="${attr(img)}" alt="${esc(n)}">`:`<div class="player-photo-fallback">${initials(n)}</div>`}<span>#${i+1}</span><section><h3>${esc(n)}</h3><p>${esc(get(p,['club_name'],'Club'))}</p><b>${esc(get(p,['avg_rating','rating'],'–'))} AVG · ${num(p.goals)} G</b></section></article>`;}
  function transferStory(t){return `<article class="wire-story"><span>${fmtDate(dateValue(t))}</span><div><h3>${esc(transferText(t))}</h3><p>${esc(get(t,['from_club_name','old_club_name'],'Market'))} → ${esc(get(t,['to_club_name','new_club_name'],'Update'))}</p></div></article>`;}
  function compPoster(c){return `<article class="comp-poster"><span>${esc(c.sm_action_group||'COMPETITION')}</span><h3>${esc(c.custom_competition||c.sm_action||'Competition')}</h3><p>${esc(c.sm_country||'Global')}${c.sm_division?` · Division ${esc(c.sm_division)}`:''}</p><b>${esc(c.teams_count||'–')} teams</b></article>`;}
  function reportStory(r){return `<article class="wire-story"><span>${fmtDate(dateValue(r))}</span><div><h3>${esc(matchText(r,true))}</h3><p>${esc(compLabel(r))}</p></div></article>`;}

  function tickerText(){const r=latestResults(1)[0],n=nextFixtures(1)[0],t=state.transfers[0];return [r&&`FINAL ${matchText(r,true)}`,n&&`NEXT ${matchText(n,false)}`,t&&`MARKET ${transferText(t)}`].filter(Boolean).join('   •   ')||'ROAD TO HISTORY · LIVE';}
  function latestResults(n){return [...state.results].sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,n);}
  function nextFixtures(n){const now=Date.now(),f=state.schedule.filter(x=>!Number.isFinite(dateValue(x))||dateValue(x)>=now).sort((a,b)=>dateValue(a)-dateValue(b));return (f.length?f:[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b))).slice(0,n);}
  function topStats(n){return [...state.stats].sort((a,b)=>num(b.avg_rating)-num(a.avg_rating)||num(b.goals)-num(a.goals)||num(b.appearances)-num(a.appearances)).slice(0,n);}
  function activeManagers(){return state.managers.filter(m=>!m.end_date);}
  function playerImage(p){const id=p.sm_player_id||p.player_id;const x=state.playerCodex.get(String(id));return x?.image_url||p.image_url||'';}
  function matchText(r,score){const h=get(r,['home_name','home_team','home_club_name'],'Home'),a=get(r,['away_name','away_team','away_club_name'],'Away');return score?`${h} ${get(r,['home_score'],'–')}–${get(r,['away_score'],'–')} ${a}`:`${h} vs ${a}`;}
  function transferText(t){const p=get(t,['player_name','name'],'Transfer'),to=get(t,['to_club_name','new_club_name'],'');return to?`${p} → ${to}`:p;}
  function compLabel(r){return get(r,['competition_group_name','competition_name','competition_key','sm_action'],'Competition');}
  function rows(x){return Array.isArray(x)?x:Array.isArray(x?.rows)?x.rows:Array.isArray(x?.data)?x.data:[];}
  function read(api,res,opt={}){return api.read(res,{game_world_id:GW,...opt});}
  function waitApi(ms){return new Promise(resolve=>{const s=Date.now();(function f(){if(window.IMC_MINISITE_DATA?.read)return resolve(window.IMC_MINISITE_DATA);if(Date.now()-s>=ms)return resolve(null);setTimeout(f,50);})();});}
  function groupBy(a,fn){return a.reduce((o,x)=>{const k=fn(x);(o[k]||(o[k]=[])).push(x);return o;},{});}
  function get(o,keys,f=''){for(const k of keys)if(o&&o[k]!=null&&o[k]!=='')return o[k];return f;}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function dateValue(o){const v=get(o,['match_date','date','fixture_date','transfer_date','created_at','imported_at'],'');const n=Date.parse(v);return Number.isFinite(n)?n:NaN;}
  function fmtDate(v){if(!Number.isFinite(v))return '—';return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short'}).format(new Date(v));}
  function initials(s){return String(s||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
  function logo(url,name){return url?`<img class="club-logo" src="${attr(url)}" alt="${esc(name)}" loading="lazy">`:`<i class="club-logo fallback">${initials(name)}</i>`;}
  function empty(t){return `<div class="empty">${esc(t)}</div>`;}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function attr(v){return esc(v).replace(/`/g,'&#96;');}
})();