(() => {
  'use strict';
  const GW='GW002';
  const root=document.getElementById('app');
  if(!root) return;

  const state={world:null,clubs:[],clubCodex:new Map(),competitions:[],managers:[],managerCodex:new Map(),results:[],schedule:[],transfers:[],stats:[],reports:[],players:new Map(),loading:true,error:null};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows=x=>Array.isArray(x)?x:Array.isArray(x?.rows)?x.rows:Array.isArray(x?.data)?x.data:[];
  const get=(o,ks,f='')=>{for(const k of ks){if(o&&o[k]!=null&&o[k]!=='')return o[k]}return f};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const norm=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const dateValue=o=>{const v=get(o,['match_date','transfer_date','imported_at','created_at'],'');const n=Date.parse(v);return Number.isFinite(n)?n:0};
  const fmt=d=>d?new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d)):'—';
  const read=(api,res,opt={})=>api.read(res,{game_world_id:GW,...opt});
  const waitApi=ms=>new Promise(resolve=>{const t=Date.now();(function tick(){if(window.IMC_MINISITE_DATA?.read)return resolve(window.IMC_MINISITE_DATA);if(Date.now()-t>ms)return resolve(null);setTimeout(tick,50)})()});
  const initials=n=>String(n||'?').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const worldName=()=>get(state.world,['game_world_name','IMC GW Name'],window.IMC_GAME_WORLD?.name||'Gold 558');

  shell(); boot(); window.addEventListener('hashchange',render);

  async function boot(){
    const api=await waitApi(3500);
    if(!api){state.error='Data service unavailable';state.loading=false;render();return}
    try{
      const [world,clubs,competitions,managers,results,schedule,transfers,stats,reports]=await Promise.all([
        read(api,'game_world_codex'),read(api,'game_world_club_mapping'),read(api,'competition_codex'),read(api,'manager_assignments'),read(api,'results',{limit:1000}),read(api,'schedule',{limit:1000}),read(api,'transfers',{limit:1000}),read(api,'sm_player_stats',{limit:1000}),read(api,'match_report',{limit:1000})
      ]);
      state.world=rows(world)[0]||null; state.clubs=rows(clubs); state.competitions=rows(competitions); state.managers=rows(managers); state.results=rows(results); state.schedule=rows(schedule); state.transfers=rows(transfers); state.stats=rows(stats); state.reports=rows(reports);
      await Promise.all([hydrateClubs(api),hydrateManagers(api),hydratePlayers(api)]);
    }catch(e){console.error(e);state.error=e?.message||'Unable to load data'}
    state.loading=false;render();
  }

  async function hydrateClubs(api){await Promise.all(state.clubs.slice(0,120).map(async c=>{if(!c.club_id)return;try{const x=rows(await read(api,'club_codex',{club_id:c.club_id}))[0];if(x)state.clubCodex.set(String(c.club_id),x)}catch{}}))}
  async function hydrateManagers(api){const ids=[...new Set(state.managers.map(x=>x.manager_id).filter(Boolean))].slice(0,120);await Promise.all(ids.map(async id=>{try{const x=rows(await read(api,'manager_codex',{manager_id:id}))[0];if(x)state.managerCodex.set(String(id),x)}catch{}}))}
  async function hydratePlayers(api){const ids=topStats(40).map(x=>x.sm_player_id||x.player_id).filter(Boolean);await Promise.all(ids.map(async id=>{try{const x=rows(await read(api,'player_codex',{player_id:id}))[0];if(x)state.players.set(String(id),x)}catch{}}))}

  function shell(){root.innerHTML=`<div class="press-shell">
    <header class="paper-head">
      <div class="date-line"><span>ITALIAN MASTERS CLUB</span><b>${new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}</b><span>GW002</span></div>
      <a class="nameplate" href="#home">THE <strong>IMC</strong> SPORTING PRESS</a>
      <div class="edition">GOLD 558 EDITION · LIVE DATA</div>
      <nav class="section-nav">
        <a href="#home">Front Page</a><a href="#competitions">Competitions</a><a href="#clubs">Clubs</a><a href="#managers">Managers</a><a href="#scores">Scores</a><a href="#fixtures">Fixtures</a><a href="#players">Players</a><a href="#transfers">Market</a><a href="#reports">Reports</a>
      </nav>
    </header>
    <main id="paper"></main>
    <button class="section-button" id="sections">☰</button>
    <dialog id="drawer"><form method="dialog"><button class="drawer-close">×</button><h2>Sections</h2>${[['home','Front Page'],['competitions','Competitions'],['clubs','Clubs'],['managers','Managers'],['scores','Scores'],['fixtures','Fixtures'],['players','Players'],['transfers','Market'],['reports','Reports']].map(([r,l])=>`<a href="#${r}" onclick="this.closest('dialog').close()">${l}</a>`).join('')}</form></dialog>
  </div>`;document.getElementById('sections').onclick=()=>document.getElementById('drawer').showModal()}

  function route(){return (location.hash||'#home').slice(1)}
  function render(){
    const paper=document.getElementById('paper');if(!paper)return;
    if(state.loading){paper.innerHTML='<section class="loading-paper"><b>THE IMC SPORTING PRESS</b><span>Composing today’s edition…</span></section>';return}
    if(state.error){paper.innerHTML=`<section class="error-paper"><h1>Edition unavailable</h1><p>${esc(state.error)}</p></section>`;return}
    const r=route();
    if(r.startsWith('competition/')) return paper.innerHTML=competitionDetail(decodeURIComponent(r.split('/').slice(1).join('/')));
    if(r.startsWith('club/')) return paper.innerHTML=clubDetail(decodeURIComponent(r.split('/').slice(1).join('/')));
    if(r.startsWith('manager/')) return paper.innerHTML=managerDetail(decodeURIComponent(r.split('/').slice(1).join('/')));
    const map={home,competitions,clubs,managers,scores,fixtures,players,transfers,reports};
    paper.innerHTML=(map[r]||home)();
  }

  function home(){
    const lead=recentResults(1)[0], next=upcoming(1)[0], star=topStats(1)[0], market=recentTransfers(1)[0];
    const leadImg=star?playerImage(star):'';
    return `<section class="front-page">
      <div class="front-kicker">THE DEFINITIVE DAILY RECORD OF ${esc(worldName())}</div>
      <div class="front-grid">
        <article class="lead-article">
          <div class="lead-label">LEAD STORY</div>
          <h1>${lead?esc(scoreHeadline(lead)):`${esc(worldName())}: THE SEASON IN MOTION`}</h1>
          <p>${lead?`${esc(compLabel(lead))} drives today's front page as the latest result reshapes the Game World narrative.`:`Results, clubs, managers and competitions from GW002, assembled from the live IMC data feed.`}</p>
          ${leadImg?`<figure><img src="${esc(leadImg)}" alt=""><figcaption>${esc(get(star,['player_name','full_name'],'Player'))} · ${esc(get(star,['club_name'],'Club'))}</figcaption></figure>`:''}
          <a class="readmore" href="#scores">Open score desk →</a>
        </article>
        <aside class="front-briefs">
          <article><span>NEXT</span><h3>${next?esc(fixtureText(next)):'No scheduled fixture'}</h3><p>${next?fmt(dateValue(next)):''}</p><a href="#fixtures">Agenda →</a></article>
          <article><span>MARKET</span><h3>${market?esc(get(market,['player_name','name'],'Transfer update')):'Transfer desk'}</h3><p>${market?esc(transferLine(market)):`${state.transfers.length} recorded moves`}</p><a href="#transfers">Market wire →</a></article>
          <article><span>WORLD</span><h3>${state.clubs.length} clubs, ${state.competitions.length} competitions</h3><p>${state.managers.length} manager assignments currently in the archive.</p><a href="#clubs">Club directory →</a></article>
        </aside>
      </div>
      <div class="rule"></div>
      <section class="front-columns">
        <article class="column-block competitions-block"><header><span>COMPETITION DESK</span><a href="#competitions">All competitions</a></header>${groupCards()}</article>
        <article class="column-block club-block"><header><span>CLUB OF THE DAY</span><a href="#clubs">Club index</a></header>${clubSpotlight()}</article>
        <article class="column-block manager-block"><header><span>FROM THE DUGOUT</span><a href="#managers">Manager index</a></header>${managerSpotlight()}</article>
      </section>
      <section class="score-strip"><header>LATEST SCORES</header>${recentResults(6).map(scoreBrief).join('')||'<p>No scores</p>'}</section>
      <section class="photo-rank"><header><span>THE FORM GUIDE</span><a href="#players">Full player desk</a></header><div>${topStats(6).map(playerTile).join('')}</div></section>
    </section>`
  }

  function competitions(){
    const groups=['DOMESTIC','INTERNATIONAL','NATIONS'];
    return sectionPage('COMPETITIONS','The competitions edition','Every competition in GW002, separated by action group and opened as a full dossier.',groups.map(g=>`<section class="comp-section"><div class="section-ribbon">${g}</div><div class="comp-list">${competitionsByGroup(g).map(compCard).join('')||'<p>No competitions in this group.</p>'}</div></section>`).join(''))
  }

  function competitionDetail(key){
    const c=findCompetition(key); if(!c) return notFound('Competition');
    const relatedR=state.results.filter(x=>sameCompetition(c,x));
    const relatedS=state.schedule.filter(x=>sameCompetition(c,x));
    const relatedM=state.reports.filter(x=>sameCompetition(c,x));
    return `<section class="detail-page competition-dossier">
      <a class="backline" href="#competitions">← Competition index</a>
      <header class="dossier-head"><span>${esc(groupName(c))}</span><h1>${esc(compName(c))}</h1><p>${esc(c.sm_country||'Global')}${c.sm_division?` · Division ${esc(c.sm_division)}`:''}</p></header>
      <div class="dossier-numbers"><article><b>${esc(c.teams_count||'—')}</b><span>TEAMS</span></article><article><b>${esc(c.expected_match||'—')}</b><span>EXPECTED</span></article><article><b>${relatedR.length}</b><span>RESULTS</span></article><article><b>${relatedM.length}</b><span>REPORTS</span></article></div>
      <section class="dossier-story"><h2>Competition file</h2><p>Action: <b>${esc(c.sm_action||c.custom_competition||'—')}</b>. Group: <b>${esc(groupName(c))}</b>. ${c.is_sm_action!=null?`SM action flag: <b>${esc(c.is_sm_action)}</b>.`:''}</p></section>
      <div class="three-desk">
        <section><h2>Results</h2>${relatedR.sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,40).map(scoreBrief).join('')||'<p>No results.</p>'}</section>
        <section><h2>Schedule</h2>${relatedS.sort((a,b)=>dateValue(a)-dateValue(b)).slice(0,40).map(fixtureBrief).join('')||'<p>No scheduled matches.</p>'}</section>
        <section><h2>Match reports</h2>${relatedM.sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,40).map(reportBrief).join('')||'<p>No reports.</p>'}</section>
      </div>
    </section>`
  }

  function clubs(){return sectionPage('CLUBS','The club directory',`${state.clubs.length} club pages. Each one opens a complete club file.`,`<div class="club-index">${state.clubs.map(clubIndexCard).join('')}</div>`)}

  function clubDetail(id){
    const c=state.clubs.find(x=>String(x.club_id)===String(id))||state.clubs.find(x=>norm(x.club_name)===norm(id)); if(!c)return notFound('Club');
    const m=managerForClub(c), stats=statsForClub(c), results=resultsForClub(c), fixtures=fixturesForClub(c), transfers=transfersForClub(c), codex=state.clubCodex.get(String(c.club_id));
    return `<section class="detail-page club-file"><a class="backline" href="#clubs">← Club directory</a>
      <header class="club-file-head">${clubLogo(c)}<div><span>CLUB FILE · ${esc(c.club_id||'')}</span><h1>${esc(c.club_name||codex?.name||'Club')}</h1><p>${m?`Managed by ${esc(managerName(m))}`:'No active manager assignment shown'}</p></div></header>
      <div class="club-tabs-news"><article><b>${results.length}</b><span>RESULTS</span></article><article><b>${fixtures.length}</b><span>FIXTURES</span></article><article><b>${stats.length}</b><span>PLAYERS</span></article><article><b>${transfers.length}</b><span>TRANSFERS</span></article></div>
      ${m?`<section class="club-manager-link"><span>THE MANAGER</span><h2>${esc(managerName(m))}</h2><a href="#manager/${encodeURIComponent(m.manager_id||managerName(m))}">Open manager profile →</a></section>`:''}
      <div class="club-columns"><section><h2>Recent results</h2>${results.slice(0,20).map(scoreBrief).join('')||'<p>No results.</p>'}</section><section><h2>Upcoming</h2>${fixtures.slice(0,20).map(fixtureBrief).join('')||'<p>No fixtures.</p>'}</section></div>
      <section class="club-player-desk"><h2>Player desk</h2><div>${stats.slice(0,20).map(playerTile).join('')||'<p>No player stats.</p>'}</div></section>
      <section class="market-wire"><h2>Transfer file</h2>${transfers.slice(0,30).map(transferBrief).join('')||'<p>No transfers.</p>'}</section>
    </section>`
  }

  function managers(){return sectionPage('MANAGERS','From the dugout',`${state.managers.length} assignments in the manager archive.`,`<div class="manager-index">${state.managers.map(managerIndexCard).join('')}</div>`)}

  function managerDetail(id){
    const m=state.managers.find(x=>String(x.manager_id)===String(id))||state.managers.find(x=>norm(managerName(x))===norm(id));if(!m)return notFound('Manager');
    const codex=state.managerCodex.get(String(m.manager_id))||{}, club=clubForManager(m);
    return `<section class="detail-page manager-file"><a class="backline" href="#managers">← Manager index</a>
      <header><div class="manager-monogram">${initials(managerName(m))}</div><div><span>MANAGER PROFILE</span><h1>${esc(managerName(m))}</h1><p>${esc(club?.club_name||m.club_name||'IMC assignment')}</p></div></header>
      <div class="manager-facts">${Object.entries(codex).slice(0,8).map(([k,v])=>v!=null&&v!==''?`<article><span>${esc(k.replaceAll('_',' '))}</span><b>${esc(v)}</b></article>`:'').join('')}</div>
      ${club?`<section class="manager-club"><span>CURRENT CLUB</span><h2>${esc(club.club_name)}</h2><a href="#club/${encodeURIComponent(club.club_id)}">Open club file →</a></section>`:''}
      <section class="assignment-file"><h2>Assignment record</h2><div class="fact-grid">${Object.entries(m).slice(0,14).map(([k,v])=>v!=null&&v!==''?`<div><span>${esc(k.replaceAll('_',' '))}</span><b>${esc(v)}</b></div>`:'').join('')}</div></section>
    </section>`
  }

  function scores(){return sectionPage('SCORES','The score desk',`${state.results.length} recorded results.`,`<div class="score-desk">${recentResults(state.results.length).map(scoreStory).join('')||'<p>No results.</p>'}</div>`)}
  function fixtures(){return sectionPage('FIXTURES','The agenda',`${state.schedule.length} scheduled fixtures.`,`<div class="agenda">${[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b)).map(fixtureStory).join('')||'<p>No fixtures.</p>'}</div>`)}
  function players(){return sectionPage('PLAYERS','The form guide',`${state.stats.length} statistical records.`,`<div class="player-index">${topStats(state.stats.length).map(playerTile).join('')||'<p>No player stats.</p>'}</div>`)}
  function transfers(){return sectionPage('MARKET','Transfer wire',`${state.transfers.length} recorded moves.`,`<div class="market-wire">${recentTransfers(state.transfers.length).map(transferBrief).join('')||'<p>No transfers.</p>'}</div>`)}
  function reports(){return sectionPage('REPORTS','Match report archive',`${state.reports.length} reports.`,`<div class="report-index">${[...state.reports].sort((a,b)=>dateValue(b)-dateValue(a)).map(reportBrief).join('')||'<p>No reports.</p>'}</div>`)}

  function sectionPage(kicker,title,dek,body){return `<section class="section-page"><header><span>${kicker}</span><h1>${title}</h1><p>${dek}</p></header>${body}</section>`}
  function notFound(x){return `<section class="error-paper"><h1>${x} not found</h1><a href="#home">Return to front page</a></section>`}

  function groupCards(){return ['DOMESTIC','INTERNATIONAL','NATIONS'].map(g=>`<a class="group-card" href="#competitions"><span>${g}</span><b>${competitionsByGroup(g).length}</b><small>competitions</small></a>`).join('')}
  function clubSpotlight(){const c=state.clubs[0];if(!c)return'<p>No clubs</p>';return `<a class="spotlight-link" href="#club/${encodeURIComponent(c.club_id)}">${clubLogo(c)}<h2>${esc(c.club_name)}</h2><p>${esc(managerName(managerForClub(c))||'Club profile')}</p><span>Read club file →</span></a>`}
  function managerSpotlight(){const m=state.managers[0];if(!m)return'<p>No managers</p>';return `<a class="spotlight-link manager-spot" href="#manager/${encodeURIComponent(m.manager_id||managerName(m))}"><div class="manager-monogram">${initials(managerName(m))}</div><h2>${esc(managerName(m))}</h2><p>${esc(m.club_name||'IMC manager')}</p><span>Read profile →</span></a>`}
  function compCard(c){return `<a class="comp-card" href="#competition/${encodeURIComponent(compKey(c))}"><span>${esc(groupName(c))}</span><h2>${esc(compName(c))}</h2><p>${esc(c.sm_country||'Global')}${c.sm_division?` · Division ${esc(c.sm_division)}`:''}</p><div><b>${esc(c.teams_count||'—')}</b> teams · <b>${esc(c.expected_match||'—')}</b> expected</div></a>`}
  function clubIndexCard(c){return `<a class="club-index-card" href="#club/${encodeURIComponent(c.club_id)}">${clubLogo(c)}<div><span>CLUB ${esc(c.club_id||'')}</span><h2>${esc(c.club_name)}</h2><p>${esc(managerName(managerForClub(c))||'Open club file')}</p></div></a>`}
  function managerIndexCard(m){return `<a class="manager-index-card" href="#manager/${encodeURIComponent(m.manager_id||managerName(m))}"><div class="manager-monogram">${initials(managerName(m))}</div><div><span>IMC MANAGER</span><h2>${esc(managerName(m))}</h2><p>${esc(m.club_name||'Assignment')}</p></div></a>`}
  function scoreBrief(r){return `<article class="score-brief"><span>${fmt(dateValue(r))} · ${esc(compLabel(r))}</span><b>${esc(matchText(r,true))}</b></article>`}
  function fixtureBrief(r){return `<article class="fixture-brief"><span>${fmt(dateValue(r))} · ${esc(compLabel(r))}</span><b>${esc(fixtureText(r))}</b></article>`}
  function reportBrief(r){return `<article class="report-brief"><span>${fmt(dateValue(r))} · ${esc(compLabel(r))}</span><h3>${esc(matchText(r,true))}</h3><p>${esc(get(r,['result_status','status'],'Match report'))}</p></article>`}
  function scoreStory(r){return `<article class="score-story"><div><span>${esc(compLabel(r))}</span><time>${fmt(dateValue(r))}</time></div><h2>${esc(matchText(r,true))}</h2></article>`}
  function fixtureStory(r){return `<article class="fixture-story"><time>${fmt(dateValue(r))}</time><div><span>${esc(compLabel(r))}</span><h2>${esc(fixtureText(r))}</h2></div></article>`}
  function playerTile(p,i=0){const n=get(p,['player_name','full_name','name'],'Player'),img=playerImage(p);return `<article class="player-tile">${img?`<img src="${esc(img)}" alt="${esc(n)}">`:`<div class="player-fallback">${initials(n)}</div>`}<div><span>${esc(get(p,['club_name'],'Club'))}</span><h3>${esc(n)}</h3><p>${esc(get(p,['avg_rating','rating'],'—'))} AVG · ${num(p.goals)} goals · ${num(p.assists)} assists</p></div></article>`}
  function transferBrief(t){return `<article class="transfer-brief"><time>${fmt(dateValue(t))}</time><div><h3>${esc(get(t,['player_name','name'],'Transfer'))}</h3><p>${esc(transferLine(t))}</p></div></article>`}

  function recentResults(n){return [...state.results].sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,n)}
  function upcoming(n){const all=[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b));const future=all.filter(x=>dateValue(x)>=Date.now());return (future.length?future:all).slice(0,n)}
  function recentTransfers(n){return [...state.transfers].sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,n)}
  function topStats(n){return [...state.stats].sort((a,b)=>num(b.avg_rating)-num(a.avg_rating)||num(b.goals)-num(a.goals)||num(b.appearances)-num(a.appearances)).slice(0,n)}
  function groupName(c){const g=String(c.sm_action_group||'').toUpperCase();if(g.includes('NATION'))return'NATIONS';if(g.includes('INTER'))return'INTERNATIONAL';return'DOMESTIC'}
  function competitionsByGroup(g){return state.competitions.filter(c=>groupName(c)===g)}
  function compName(c){return c.custom_competition||c.sm_action||c.competition_name||'Competition'}
  function compKey(c){return String(c.id||`${c.sm_action||''}|${c.sm_country||''}|${c.sm_division||''}`)}
  function findCompetition(key){return state.competitions.find(c=>compKey(c)===key)||state.competitions.find(c=>norm(compName(c))===norm(key))}
  function sameCompetition(c,row){const rowTokens=[get(row,['competition_key'],'') ,get(row,['competition_group_name'],'') ,get(row,['competition_name'],'') ,get(row,['sm_action'],'')].map(norm).filter(Boolean);const targets=[c.sm_action,c.custom_competition,c.competition_key].map(norm).filter(Boolean);return targets.some(t=>rowTokens.some(r=>r===t||r.includes(t)||t.includes(r)))}
  function compLabel(r){return get(r,['competition_group_name','competition_name','competition_key','sm_action'],'Competition')}
  function scoreHeadline(r){return `${get(r,['home_name','home_team'],'Home')} ${get(r,['home_score'],'–')}–${get(r,['away_score'],'–')} ${get(r,['away_name','away_team'],'Away')}`}
  function matchText(r,score){const h=get(r,['home_name','home_team','home_club_name'],'Home'),a=get(r,['away_name','away_team','away_club_name'],'Away');return score?`${h} ${get(r,['home_score'],'–')}–${get(r,['away_score'],'–')} ${a}`:`${h} vs ${a}`}
  function fixtureText(r){return matchText(r,false)}
  function transferLine(t){return `${get(t,['from_club_name','old_club_name'],'—')} → ${get(t,['to_club_name','new_club_name'],'—')}`}
  function playerImage(p){const id=p.sm_player_id||p.player_id;const x=state.players.get(String(id));return x?.image_url||p.player_image_url||p.image_url||''}
  function clubLogo(c){const x=state.clubCodex.get(String(c.club_id));const u=x?.image_url||c.image_url||'';return u?`<img class="club-crest" src="${esc(u)}" alt="${esc(c.club_name)}">`:`<div class="club-fallback">${initials(c.club_name)}</div>`}
  function managerName(m){if(!m)return'';const x=state.managerCodex.get(String(m.manager_id));return x?.full_name||m.manager_name||m.full_name||`Manager ${m.manager_id||''}`}
  function managerForClub(c){return state.managers.find(m=>String(m.club_id||m.club_gw_id||'')===String(c.club_id||c.club_gw_id||''))||state.managers.find(m=>norm(m.club_name)===norm(c.club_name))}
  function clubForManager(m){return state.clubs.find(c=>String(c.club_id||c.club_gw_id||'')===String(m.club_id||m.club_gw_id||''))||state.clubs.find(c=>norm(c.club_name)===norm(m.club_name))}
  function clubIds(c){return new Set([c.club_id,c.club_gw_id,c.sm_club_id].filter(Boolean).map(String))}
  function rowHasClub(row,c){const ids=clubIds(c);return ['home_sm_club_id','away_sm_club_id','home_sm_team_id','away_sm_team_id','sm_club_id','from_sm_world_club_id','to_sm_world_club_id','home_club_id','away_club_id'].some(k=>ids.has(String(row[k]??'')))||[row.home_name,row.away_name,row.club_name,row.from_club_name,row.to_club_name].some(n=>norm(n)===norm(c.club_name))}
  function resultsForClub(c){return state.results.filter(r=>rowHasClub(r,c)).sort((a,b)=>dateValue(b)-dateValue(a))}
  function fixturesForClub(c){return state.schedule.filter(r=>rowHasClub(r,c)).sort((a,b)=>dateValue(a)-dateValue(b))}
  function statsForClub(c){return state.stats.filter(r=>rowHasClub(r,c)).sort((a,b)=>num(b.avg_rating)-num(a.avg_rating))}
  function transfersForClub(c){return state.transfers.filter(r=>rowHasClub(r,c)).sort((a,b)=>dateValue(b)-dateValue(a))}
})();
