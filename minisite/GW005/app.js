(() => {
  const GW='GW005';
  const root=document.getElementById('app');
  if(!root) return;
  const state={world:null,clubs:[],clubCodex:new Map(),competitions:[],managers:[],nationals:[],results:[],schedule:[],transfers:[],stats:[],reports:[],loading:true,error:null};
  const routes=['home','scores','calendar','competitions','clubs','managers','transfers','players','reports'];
  window.addEventListener('hashchange',render);
  boot();

  async function boot(){
    shell();
    const api=await waitApi(2500);
    if(!api){state.loading=false;state.error='Data service unavailable';render();return;}
    try{
      const [world,clubs,competitions,managers,nationals,results,schedule,transfers,stats,reports]=await Promise.all([
        read(api,'game_world_codex'),read(api,'game_world_club_mapping'),read(api,'competition_codex'),read(api,'manager_assignments'),read(api,'national_team_codex',{limit:200}),read(api,'results',{limit:1000}),read(api,'schedule',{limit:1000}),read(api,'transfers',{limit:1000}),read(api,'sm_player_stats',{limit:1000}),read(api,'match_report',{limit:1000})
      ]);
      state.world=rows(world)[0]||{}; state.clubs=rows(clubs); state.competitions=rows(competitions); state.managers=rows(managers); state.nationals=rows(nationals); state.results=rows(results); state.schedule=rows(schedule); state.transfers=rows(transfers); state.stats=rows(stats); state.reports=rows(reports);
      await Promise.all(state.clubs.map(async c=>{if(!c.club_id)return;try{const x=rows(await read(api,'club_codex',{club_id:c.club_id}))[0];if(x)state.clubCodex.set(String(c.club_id),x);}catch{}}));
    }catch(e){state.error=e?.message||'Unable to load data';}finally{state.loading=false;render();}
  }

  function shell(){
    root.innerHTML=`<div class="game-shell">
      <header class="game-topbar">
        <a class="game-brand" href="#home"><span class="brand-cube">IMC</span><span><b>HALL OF FAMERS</b><small>GW005</small></span></a>
        <div class="status-pill"><i></i> LIVE</div>
      </header>
      <main id="view"></main>
      <nav class="game-dock">
        ${[['home','⌂','HOME'],['scores','◉','SCORES'],['clubs','⬡','CLUBS'],['players','★','PLAYERS'],['managers','◎','MNG']].map(([r,i,l])=>`<a href="#${r}" data-dock="${r}"><span>${i}</span><b>${l}</b></a>`).join('')}
      </nav>
    </div>`;
  }

  function route(){const r=(location.hash||'#home').slice(1).split('?')[0];return routes.includes(r)?r:'home';}
  function render(){
    const v=document.getElementById('view'); if(!v)return;
    const r=route(); document.querySelectorAll('[data-dock]').forEach(a=>a.classList.toggle('active',a.dataset.dock===r));
    if(state.loading){v.innerHTML='<section class="boot-screen"><div class="boot-logo">HOF</div><strong>LOADING GAME WORLD</strong><span>SYNCING LIVE DATA</span></section>';return;}
    const map={home:home,scores:()=>listPage('RESULTS','MATCH ARCHIVE',state.results,scoreCard),calendar:()=>listPage('FIXTURES','SEASON SCHEDULE',state.schedule,fixtureCard),competitions:competitions,clubs:clubs,managers:managers,transfers:()=>listPage('TRANSFERS','MARKET FEED',state.transfers,transferCard),players:players,reports:()=>listPage('MATCH REPORTS','MATCHROOM',state.reports,reportCard)};
    v.innerHTML=map[r](); window.scrollTo({top:0,behavior:'instant'});
  }

  function home(){
    const w=state.world||{}; const latest=latestResult(); const next=nextFixture(); const heroClubs=state.clubs.slice(0,7); const top=topStats(3); const active=activeManagers().length;
    return `<section class="stadium-hero">
      <div class="stadium-grid"></div>
      <div class="club-cloud">${heroClubs.map((c,i)=>`<div class="cloud-logo l${i}">${clubLogo(c)}</div>`).join('')}</div>
      <div class="hero-copy"><span class="season-tag">ITALIAN MASTERS CLUB · ${esc(w.game_world_id||GW)}</span><h1>${esc(w.game_world_name||'Hall Of Famers')}</h1><p>SM WORLD ${esc(w.sm_game_world_id||'468194')} · ${state.clubs.length} CLUBS · ${active} ACTIVE MANAGERS</p></div>
      <a class="continue-btn" href="#scores"><span>CONTINUE</span><b>ENTER MATCH CENTRE</b><i>›</i></a>
    </section>

    <section class="match-centre">
      <div class="mc-label"><span>LIVE HUB</span><b>SEASON CENTRE</b></div>
      <div class="versus-stage">${matchStage(latest,next)}</div>
      <div class="quick-grid">
        ${quick('#calendar','NEXT','FIXTURES',state.schedule.length,'◷')}
        ${quick('#competitions','WORLD','COMPETITIONS',state.competitions.length,'◇')}
        ${quick('#transfers','MARKET','TRANSFERS',state.transfers.length,'↔')}
        ${quick('#reports','MEDIA','REPORTS',state.reports.length,'▣')}
      </div>
    </section>

    <section class="feature-strip">
      <a class="feature-card clubs-feature" href="#clubs"><div><span>CLUB UNIVERSE</span><strong>${state.clubs.length}</strong><p>Explore every club in GW005</p></div><div class="logo-river">${state.clubs.slice(0,6).map(clubLogo).join('')}</div></a>
      <a class="feature-card managers-feature" href="#managers"><div><span>MANAGER NETWORK</span><strong>${active}</strong><p>Assignments, clubs and national teams</p></div><div class="manager-orbs">${activeManagers().slice(0,5).map(m=>`<i>${initials(m.full_name||m.manager_id||'IMC')}</i>`).join('')}</div></a>
    </section>

    <section class="elite-zone"><div class="zone-title"><span>ELITE FORM</span><a href="#players">ALL PLAYERS ›</a></div><div class="podium">${top.map((p,i)=>playerPodium(p,i)).join('')||'<div class="empty">No player stats</div>'}</div></section>`;
  }

  function matchStage(latest,next){
    if(latest){const h=get(latest,['home_name','home_team'],'Home'),a=get(latest,['away_name','away_team'],'Away'),hs=get(latest,['home_score','home_goals'],'-'),as=get(latest,['away_score','away_goals'],'-');return `<div class="stage-meta">LAST RESULT · ${esc(compLabel(latest))}</div><div class="stage-teams"><div>${teamVisual(h)}<b>${esc(h)}</b></div><strong>${esc(hs)}<small>:</small>${esc(as)}</strong><div>${teamVisual(a)}<b>${esc(a)}</b></div></div><a href="#scores">MATCH CENTRE ›</a>`;}
    if(next){const h=get(next,['home_name','home_team'],'Home'),a=get(next,['away_name','away_team'],'Away');return `<div class="stage-meta">NEXT FIXTURE · ${esc(fmtDate(dateValue(next)))}</div><div class="stage-teams"><div>${teamVisual(h)}<b>${esc(h)}</b></div><strong class="vs">VS</strong><div>${teamVisual(a)}<b>${esc(a)}</b></div></div><a href="#calendar">FULL FIXTURES ›</a>`;}
    return '<div class="empty">No match data</div>';
  }

  function quick(href,kicker,label,value,icon){return `<a class="quick-tile" href="${href}"><span>${kicker}</span><i>${icon}</i><strong>${value}</strong><b>${label}</b></a>`;}
  function clubLogo(c){const x=state.clubCodex.get(String(c.club_id));return x?.image_url?`<img src="${esc(x.image_url)}" alt="${esc(c.club_name||'Club')}" loading="lazy">`:`<span class="fallback-logo">${initials(c.club_name||'CL')}</span>`;}
  function teamVisual(name){const c=state.clubs.find(x=>String(x.club_name).toLowerCase()===String(name).toLowerCase());return c?clubLogo(c):`<span class="fallback-logo">${initials(name)}</span>`;}
  function playerPodium(p,i){const name=get(p,['player_name','full_name','name'],'Player');const club=get(p,['club_name','team_name'],'');const goals=num(p,['goals'],0);const rating=get(p,['avg_rating','rating'],'-');return `<a class="podium-card rank-${i+1}" href="#players"><span>#${i+1}</span><div class="player-silhouette">${initials(name)}</div><strong>${esc(name)}</strong><small>${esc(club)}</small><div><b>${goals}</b><em>G</em><b>${esc(rating)}</b><em>RAT</em></div></a>`;}

  function listPage(title,sub,arr,renderer){const sorted=[...arr].sort((a,b)=>dateValue(b)-dateValue(a));return pageHead(title,sub,`${arr.length}`)+`<section class="stack-list">${sorted.map(renderer).join('')||'<div class="empty">No data</div>'}</section>`;}
  function competitions(){const groups=groupBy(state.competitions,x=>x.sm_action_group||'OTHER');return pageHead('COMPETITIONS','WORLD STRUCTURE',state.competitions.length)+`<section class="competition-board">${Object.entries(groups).map(([g,items])=>`<article><header><span>${esc(g)}</span><b>${items.length}</b></header>${items.map(x=>`<div><strong>${esc(x.custom_competition||x.sm_action||'Competition')}</strong><small>${esc([x.sm_country,x.sm_division&&`Division ${x.sm_division}`].filter(Boolean).join(' · '))}</small></div>`).join('')}</article>`).join('')}</section>`;}
  function clubs(){return pageHead('CLUBS','THE CLUB UNIVERSE',state.clubs.length)+`<section class="club-wall">${state.clubs.map(c=>`<article>${clubLogo(c)}<div><strong>${esc(c.club_name)}</strong><small>SM ${esc(c.sm_club_id||'')}</small></div><span>›</span></article>`).join('')}</section>`;}
  function managers(){return pageHead('MANAGERS','ASSIGNMENT NETWORK',state.managers.length)+`<section class="manager-grid">${state.managers.map(m=>`<article><div class="avatar-big">${initials(m.full_name||m.manager_id||'IMC')}</div><div><span>${esc(m.assignment_type||'MANAGER')}</span><strong>${esc(m.full_name||m.manager_id||'Manager')}</strong><p>${esc(clubName(m.club_id)||nationalName(m.national_team_id)||'IMC')}</p></div></article>`).join('')}</section>`;}
  function players(){const s=topStats(Math.max(state.stats.length,1000));return pageHead('PLAYERS','PERFORMANCE DATABASE',s.length)+`<section class="player-board">${s.map((p,i)=>`<article><b>#${i+1}</b><div><strong>${esc(get(p,['player_name','full_name'],'Player'))}</strong><small>${esc(get(p,['club_name'],'Unknown club'))}</small></div><span>${esc(get(p,['avg_rating','rating'],'-'))}</span><em>${num(p,['goals'],0)} G</em></article>`).join('')}</section>`;}

  function pageHead(title,sub,count){return `<section class="page-hero"><a href="#home">‹ HOME</a><span>${sub}</span><h1>${title}</h1><b>${count}</b></section>`;}
  function scoreCard(r){return `<article class="data-card"><span>${esc(compLabel(r))} · ${fmtDate(dateValue(r))}</span><div><strong>${esc(get(r,['home_name'],'Home'))}</strong><b>${esc(get(r,['home_score'],'-'))}:${esc(get(r,['away_score'],'-'))}</b><strong>${esc(get(r,['away_name'],'Away'))}</strong></div></article>`;}
  function fixtureCard(r){return `<article class="data-card"><span>${fmtDate(dateValue(r))} · ${esc(compLabel(r))}</span><div><strong>${esc(get(r,['home_name'],'Home'))}</strong><b>VS</b><strong>${esc(get(r,['away_name'],'Away'))}</strong></div></article>`;}
  function transferCard(t){return `<article class="data-card"><span>${esc(get(t,['transfer_date'],'TRANSFER'))}</span><div><strong>${esc(get(t,['player_name','full_name'],'Player'))}</strong><b>↔</b><strong>${esc(get(t,['to_club_name','club_name'],'Club'))}</strong></div></article>`;}
  function reportCard(r){return `<article class="data-card"><span>${fmtDate(dateValue(r))}</span><div><strong>${esc(matchText(r,false))}</strong><b>REPORT</b><strong>${esc(get(r,['competition_group_name','competition_key'],'MATCH'))}</strong></div></article>`;}

  function latestResult(){return [...state.results].sort((a,b)=>dateValue(b)-dateValue(a))[0]||null;}
  function nextFixture(){const n=Date.now(),f=state.schedule.filter(x=>dateValue(x)>=n).sort((a,b)=>dateValue(a)-dateValue(b));return f[0]||state.schedule[0]||null;}
  function activeManagers(){return state.managers.filter(m=>!m.end_date);}
  function topStats(n){return [...state.stats].sort((a,b)=>num(b,['goals'],0)-num(a,['goals'],0)||num(b,['avg_rating','rating'],0)-num(a,['avg_rating','rating'],0)).slice(0,n);}
  function clubName(id){return state.clubs.find(c=>String(c.club_id)===String(id))?.club_name||'';}
  function nationalName(id){return state.nationals.find(n=>String(n.id)===String(id))?.name||'';}
  function matchText(r,score){const h=get(r,['home_name'],'Home'),a=get(r,['away_name'],'Away');return score?`${h} ${get(r,['home_score'],'-')}:${get(r,['away_score'],'-')} ${a}`:`${h} vs ${a}`;}
  function compLabel(r){return get(r,['competition_group_name','competition_key','sm_action'],'MATCH');}
  function dateValue(r){const raw=get(r,['match_date','transfer_date','date','played_at','scheduled_at'],'');const t=Date.parse(raw);return Number.isFinite(t)?t:0;}
  function fmtDate(t){if(!t)return '';return new Date(t).toLocaleDateString('it-IT',{day:'2-digit',month:'short'}).toUpperCase();}
  function groupBy(arr,fn){return arr.reduce((o,x)=>{const k=fn(x);(o[k]||(o[k]=[])).push(x);return o;},{});}
  function get(o,keys,f=''){for(const k of keys)if(o&&o[k]!=null&&o[k]!=='')return o[k];return f;}
  function num(o,keys,f=0){const v=Number(get(o,keys,f));return Number.isFinite(v)?v:f;}
  function initials(v){return String(v||'IMC').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
  function rows(v){return Array.isArray(v)?v:Array.isArray(v?.rows)?v.rows:Array.isArray(v?.data)?v.data:[];}
  async function read(api,res,params={}){return api.read(res,params);}
  function waitApi(ms){return new Promise(resolve=>{const s=Date.now();(function t(){if(window.IMC_MINISITE_DATA?.read)return resolve(window.IMC_MINISITE_DATA);if(Date.now()-s>=ms)return resolve(null);setTimeout(t,80)})();});}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
})();