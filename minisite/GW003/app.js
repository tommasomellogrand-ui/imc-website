(() => {
  'use strict';
  const GW='GW003';
  const root=document.getElementById('app');
  if(!root) return;
  const state={world:null,clubs:[],clubCodex:new Map(),competitions:[],managers:[],managerCodex:new Map(),results:[],schedule:[],transfers:[],stats:[],reports:[],players:new Map(),loading:true,error:null};
  const nav=[['dashboard','Dashboard'],['matches','Match Hub'],['squad','Players'],['clubs','Clubs'],['managers','Managers'],['market','Market'],['competitions','Competitions'],['reports','Reports']];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows=x=>Array.isArray(x)?x:Array.isArray(x?.rows)?x.rows:Array.isArray(x?.data)?x.data:[];
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const get=(o,ks,f='')=>{for(const k of ks){if(o&&o[k]!=null&&o[k]!=='') return o[k];}return f;};
  const dateValue=o=>{const v=get(o,['match_date','transfer_date','imported_at','created_at'],'');const n=Date.parse(v);return Number.isFinite(n)?n:0;};
  const fmt=d=>d?new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'2-digit'}).format(new Date(d)):'—';
  const read=(api,res,opt={})=>api.read(res,{game_world_id:GW,...opt});
  const waitApi=ms=>new Promise(resolve=>{const t=Date.now();(function tick(){if(window.IMC_MINISITE_DATA?.read)return resolve(window.IMC_MINISITE_DATA);if(Date.now()-t>ms)return resolve(null);setTimeout(tick,50)})()});
  const clubLogo=(id,name='Club')=>{const c=state.clubCodex.get(String(id));const u=c?.image_url||'';return u?`<img src="${esc(u)}" alt="${esc(name)}">`:`<span class="badge-fallback">${esc(name).slice(0,2).toUpperCase()}</span>`};
  const playerImage=p=>{const id=p?.sm_player_id||p?.player_id;const x=state.players.get(String(id));return x?.image_url||p?.player_image_url||p?.image_url||''};
  const initials=n=>String(n||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const matchText=r=>`${get(r,['home_name','home_team','home_club_name'],'Home')} ${get(r,['home_score'],'–')} : ${get(r,['away_score'],'–')} ${get(r,['away_name','away_team','away_club_name'],'Away')}`;
  const fixtureText=r=>`${get(r,['home_name','home_team','home_club_name'],'Home')} vs ${get(r,['away_name','away_team','away_club_name'],'Away')}`;
  const comp=r=>get(r,['competition_group_name','competition_name','competition_key','sm_action'],'Competition');
  const topStats=n=>[...state.stats].sort((a,b)=>num(b.avg_rating)-num(a.avg_rating)||num(b.goals)-num(a.goals)).slice(0,n);
  const recent=n=>[...state.results].sort((a,b)=>dateValue(b)-dateValue(a)).slice(0,n);
  const upcoming=n=>[...state.schedule].sort((a,b)=>dateValue(a)-dateValue(b)).slice(0,n);

  async function hydrate(){
    const api=await waitApi(3000);
    if(!api){state.error='Data service unavailable';state.loading=false;render();return;}
    try{
      const [world,clubs,competitions,managers,results,schedule,transfers,stats,reports]=await Promise.all([
        read(api,'game_world_codex'),read(api,'game_world_club_mapping'),read(api,'competition_codex'),read(api,'manager_assignments'),read(api,'results',{limit:1000}),read(api,'schedule',{limit:1000}),read(api,'transfers',{limit:1000}),read(api,'sm_player_stats',{limit:1000}),read(api,'match_report',{limit:1000})
      ]);
      state.world=rows(world)[0]||null; state.clubs=rows(clubs); state.competitions=rows(competitions); state.managers=rows(managers); state.results=rows(results); state.schedule=rows(schedule); state.transfers=rows(transfers); state.stats=rows(stats); state.reports=rows(reports);
      await Promise.all([
        Promise.all(state.clubs.slice(0,80).map(async c=>{if(!c.club_id)return;try{const x=rows(await read(api,'club_codex',{club_id:c.club_id}))[0];if(x)state.clubCodex.set(String(c.club_id),x)}catch{}})),
        Promise.all([...new Set(state.managers.map(x=>x.manager_id).filter(Boolean))].slice(0,80).map(async id=>{try{const x=rows(await read(api,'manager_codex',{manager_id:id}))[0];if(x)state.managerCodex.set(String(id),x)}catch{}})),
        Promise.all(topStats(24).map(async p=>{const id=p.sm_player_id||p.player_id;if(!id)return;try{const x=rows(await read(api,'player_codex',{player_id:id}))[0];if(x)state.players.set(String(id),x)}catch{}}))
      ]);
    }catch(e){state.error=e?.message||'Unable to load data'}
    state.loading=false;render();
  }

  function shell(){
    root.innerHTML=`<div class="fm-shell">
      <aside class="fm-sidebar">
        <div class="brand"><span>IMC</span><b>2035</b><small>GW003</small></div>
        <nav>${nav.map(([r,l],i)=>`<a href="#${r}" data-route="${r}"><i>${String(i+1).padStart(2,'0')}</i><span>${l}</span></a>`).join('')}</nav>
        <div class="side-status"><em></em><span>LIVE DATA</span></div>
      </aside>
      <section class="fm-main">
        <header class="topbar"><div><small>ITALIAN MASTERS CLUB</small><strong>${esc(window.IMC_GAME_WORLD?.name||'Gold 557')}</strong></div><button id="commandBtn">⌘</button></header>
        <main id="view"></main>
      </section>
      <nav class="mobile-dock">${nav.slice(0,5).map(([r,l])=>`<a href="#${r}" data-mobile="${r}">${l}</a>`).join('')}</nav>
      <dialog id="command"><form method="dialog"><button class="close">×</button><h3>QUICK COMMAND</h3>${nav.map(([r,l])=>`<a href="#${r}" onclick="this.closest('dialog').close()">${l}</a>`).join('')}</form></dialog>
    </div>`;
    document.getElementById('commandBtn').onclick=()=>document.getElementById('command').showModal();
  }
  const route=()=>{const r=(location.hash||'#dashboard').slice(1);return nav.some(x=>x[0]===r)?r:'dashboard'};
  window.addEventListener('hashchange',render);

  function render(){
    const v=document.getElementById('view');if(!v)return;
    const r=route();document.querySelectorAll('[data-route],[data-mobile]').forEach(a=>a.classList.toggle('active',a.dataset.route===r||a.dataset.mobile===r));
    if(state.loading){v.innerHTML='<section class="boot"><b>IMC 2035</b><span>Synchronising Game World data…</span><div></div></section>';return}
    if(state.error){v.innerHTML=`<section class="error"><h2>DATA LINK OFFLINE</h2><p>${esc(state.error)}</p></section>`;return}
    const views={dashboard, matches, squad, clubs, managers, market, competitions, reports};v.innerHTML=views[r]();
    bindInteractive();
  }

  function dashboard(){
    const w=state.world||{}, lead=topStats(1)[0], last=recent(1)[0], next=upcoming(1)[0];
    return `<section class="dash">
      <div class="dash-head"><div><span>GAME WORLD CONTROL</span><h1>${esc(get(w,['game_world_name','IMC GW Name'],window.IMC_GAME_WORLD?.name||'Gold 557'))}</h1><p>Live operational overview of GW003.</p></div><div class="world-id"><small>SM WORLD</small><b>${esc(get(w,['sm_game_world_id','SM Game World ID'],'—'))}</b></div></div>
      <div class="kpis">
        ${[['CLUBS',state.clubs.length],['RESULTS',state.results.length],['FIXTURES',state.schedule.length],['TRANSFERS',state.transfers.length]].map(([l,v])=>`<article><span>${l}</span><b>${v}</b><i></i></article>`).join('')}
      </div>
      <div class="dash-grid">
        <article class="panel focus"><header><span>PERFORMANCE FOCUS</span><a href="#squad">OPEN PLAYER LAB</a></header>${lead?playerFocus(lead):'<p>No player stats</p>'}</article>
        <article class="panel match"><header><span>LAST MATCH</span><a href="#matches">MATCH HUB</a></header>${last?matchCard(last,true):'<p>No results</p>'}</article>
        <article class="panel next"><header><span>NEXT FIXTURE</span><a href="#matches">CALENDAR</a></header>${next?matchCard(next,false):'<p>No fixtures</p>'}</article>
        <article class="panel trends"><header><span>POWER TABLE</span><a href="#squad">FULL LIST</a></header><div>${topStats(6).map((p,i)=>rankRow(p,i)).join('')}</div></article>
        <article class="panel clubnet"><header><span>CLUB NETWORK</span><a href="#clubs">EXPLORE</a></header><div class="logo-grid">${state.clubs.slice(0,20).map(c=>`<button class="club-chip" data-club="${esc(c.club_id)}">${clubLogo(c.club_id,c.club_name)}<small>${esc(c.club_name)}</small></button>`).join('')}</div></article>
        <article class="panel activity"><header><span>ACTIVITY STREAM</span><a href="#market">MARKET</a></header><div>${state.transfers.slice(0,6).map(t=>`<div class="activity-row"><time>${fmt(dateValue(t))}</time><strong>${esc(get(t,['player_name','name'],'Transfer'))}</strong><span>${esc(get(t,['to_club_name','new_club_name'],'Market update'))}</span></div>`).join('')||'<p>No transfer activity</p>'}</div></article>
      </div>
    </section>`;
  }
  function matches(){return `<section class="module"><div class="module-title"><span>MATCH HUB</span><h1>Results & Fixtures</h1></div><div class="split"><div><h3>RECENT RESULTS</h3>${recent(30).map(r=>matchCard(r,true)).join('')||'<p>No results</p>'}</div><div><h3>UPCOMING</h3>${upcoming(30).map(r=>matchCard(r,false)).join('')||'<p>No fixtures</p>'}</div></div></section>`}
  function squad(){return `<section class="module"><div class="module-title"><span>PLAYER LAB</span><h1>Performance Database</h1></div><div class="player-table">${topStats(100).map((p,i)=>playerRow(p,i)).join('')||'<p>No player stats</p>'}</div></section>`}
  function clubs(){return `<section class="module"><div class="module-title"><span>CLUB INTELLIGENCE</span><h1>World Clubs</h1></div><div class="club-cards">${state.clubs.map(c=>clubCard(c)).join('')}</div></section>`}
  function managers(){return `<section class="module"><div class="module-title"><span>MANAGER NETWORK</span><h1>Assignments</h1></div><div class="manager-list">${state.managers.map(m=>managerCard(m)).join('')||'<p>No assignments</p>'}</div></section>`}
  function market(){return `<section class="module"><div class="module-title"><span>TRANSFER INTELLIGENCE</span><h1>Market Feed</h1></div><div class="market-feed">${state.transfers.map(t=>`<article><time>${fmt(dateValue(t))}</time><div><strong>${esc(get(t,['player_name','name'],'Player'))}</strong><span>${esc(get(t,['from_club_name','old_club_name'],'—'))} → ${esc(get(t,['to_club_name','new_club_name'],'—'))}</span></div><b>${esc(get(t,['transfer_fee','fee'],'LIVE'))}</b></article>`).join('')||'<p>No transfers</p>'}</div></section>`}
  function competitions(){return `<section class="module"><div class="module-title"><span>COMPETITION ENGINE</span><h1>Structure</h1></div><div class="competition-grid">${state.competitions.map(c=>`<article><span>${esc(c.sm_action_group||'COMP')}</span><h3>${esc(c.custom_competition||c.sm_action||'Competition')}</h3><p>${esc(c.sm_country||'Global')}${c.sm_division?` · Division ${esc(c.sm_division)}`:''}</p><div><b>${esc(c.teams_count||'—')}</b><small>teams</small><b>${esc(c.expected_match||'—')}</b><small>expected</small></div></article>`).join('')}</div></section>`}
  function reports(){return `<section class="module"><div class="module-title"><span>MATCH REPORT ARCHIVE</span><h1>Reports</h1></div><div class="report-grid">${state.reports.map(r=>`<article><small>${fmt(dateValue(r))} · ${esc(comp(r))}</small><h3>${esc(matchText(r))}</h3><p>${esc(get(r,['result_status','status'],'Match report'))}</p></article>`).join('')||'<p>No reports</p>'}</div></section>`}

  function playerFocus(p){const n=get(p,['player_name','full_name','name'],'Player'),img=playerImage(p);return `<div class="player-focus">${img?`<img src="${esc(img)}" alt="${esc(n)}">`:`<div class="portrait-fallback">${initials(n)}</div>`}<div><small>${esc(get(p,['club_name'],'Club'))}</small><h2>${esc(n)}</h2><p>${num(p.appearances)} apps · ${num(p.goals)} goals · ${num(p.assists)} assists</p><div class="rating-ring"><b>${esc(get(p,['avg_rating','rating'],'—'))}</b><span>AVG</span></div></div></div>`}
  function matchCard(r,done){return `<article class="match-card"><div><small>${done?'FINAL':'SCHEDULED'} · ${esc(comp(r))}</small><strong>${esc(done?matchText(r):fixtureText(r))}</strong><span>${fmt(dateValue(r))}</span></div><b>${done?`${esc(get(r,['home_score'],'–'))}:${esc(get(r,['away_score'],'–'))}`:'›'}</b></article>`}
  function rankRow(p,i){return `<div class="rank-row"><i>${i+1}</i><div><strong>${esc(get(p,['player_name','full_name'],'Player'))}</strong><span>${esc(get(p,['club_name'],'Club'))}</span></div><b>${esc(get(p,['avg_rating'],'—'))}</b></div>`}
  function playerRow(p,i){const n=get(p,['player_name','full_name'],'Player'),img=playerImage(p);return `<article>${img?`<img src="${esc(img)}" alt="${esc(n)}">`:`<span class="avatar">${initials(n)}</span>`}<i>${i+1}</i><div><strong>${esc(n)}</strong><small>${esc(get(p,['club_name'],'Club'))}</small></div><b>${esc(get(p,['avg_rating'],'—'))}</b><span>${num(p.goals)}G</span><span>${num(p.assists)}A</span></article>`}
  function clubCard(c){const m=state.managers.find(x=>String(x.club_id||'')===String(c.club_id||''));return `<button class="club-card" data-club="${esc(c.club_id)}">${clubLogo(c.club_id,c.club_name)}<div><small>CLUB ${esc(c.club_id||'')}</small><strong>${esc(c.club_name)}</strong><span>${esc(m?.manager_name||'Manager data available')}</span></div><b>OPEN</b></button>`}
  function managerCard(m){const x=state.managerCodex.get(String(m.manager_id)),n=x?.full_name||m.manager_name||`Manager ${m.manager_id||''}`;return `<article><span class="manager-avatar">${initials(n)}</span><div><strong>${esc(n)}</strong><small>${esc(m.club_name||'Club assignment')}</small></div><b>${m.end_date?'PAST':'ACTIVE'}</b></article>`}
  function bindInteractive(){document.querySelectorAll('[data-club]').forEach(b=>b.onclick=()=>{const c=state.clubs.find(x=>String(x.club_id)===String(b.dataset.club));if(!c)return;const m=state.managers.find(x=>String(x.club_id||'')===String(c.club_id||''));const d=document.getElementById('command');d.innerHTML=`<form method="dialog" class="club-modal"><button class="close">×</button>${clubLogo(c.club_id,c.club_name)}<small>GW003 CLUB</small><h2>${esc(c.club_name)}</h2><p>${esc(m?.manager_name||'No active manager in current assignment data')}</p><button>Close</button></form>`;d.showModal()})}

  shell();render();hydrate();
})();