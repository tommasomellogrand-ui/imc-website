(() => {
  'use strict';

  const APP = document.getElementById('app');
  const API = 'https://www.italianmastersclub.it/api/imc-gateway/';
  const GW = 'GW001';
  let renderSeq = 0;
  let playersCache = null;
  let rosterCache = null;

  const repos = [
    'player_codex',
    'player_codex_roster',
    'player_codex_stats',
    'player_codex_rating_history',
    'player_codex_transfer_history',
    'player_codex_injury_history',
    'player_codex_snapshots'
  ];

  const e = v => String(v ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const path = () => (location.hash.replace(/^#/,'') || '/overview');

  async function request(repository, options = {}) {
    const url = new URL(API);
    url.searchParams.set('game_world_id', GW);
    url.searchParams.set('repository', repository);
    url.searchParams.set('action', 'read');
    url.searchParams.set('limit', String(options.limit ?? 1000));
    url.searchParams.set('offset', String(options.offset ?? 0));
    if (options.orderBy) url.searchParams.set('order_by', options.orderBy);
    if (options.orderDir) url.searchParams.set('order_dir', options.orderDir);
    Object.entries(options.filters || {}).forEach(([k,v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(`filter_${k}`, String(v));
    });
    const res = await fetch(url, { headers:{Accept:'application/json'}, cache:'no-store' });
    const json = await res.json();
    if (!res.ok || !json || json.ok !== true) throw new Error(json?.error || `HTTP_${res.status}`);
    return { data:Array.isArray(json.data)?json.data:[], total:Number(json.pagination?.total ?? 0) };
  }

  async function readAll(repository, options = {}) {
    const pageSize = 1000;
    const out = [];
    let offset = 0;
    let total = null;
    while (total === null || offset < total) {
      const page = await request(repository, {...options, limit:pageSize, offset});
      if (total === null) total = page.total;
      out.push(...page.data);
      if (!page.data.length) break;
      offset += page.data.length;
      if (page.data.length < pageSize) break;
    }
    return out;
  }

  function shell(content) {
    APP.innerHTML = `
      <header class="topbar">
        <div class="brand-mark">IMC</div>
        <a class="brand" href="#/overview"><h1>ROAD TO HISTORY</h1><div class="brand-sub">GAME WORLD</div></a>
        <a class="menu-btn" href="#/overview" aria-label="Overview"><div class="hamb"><span></span><span></span><span></span></div></a>
      </header>
      <main class="view pc-view">${content}</main>
      <footer>ITALIAN MASTERS CLUB · THE WORLD IS OUR PLAYGROUND</footer>`;
    window.scrollTo({top:0,behavior:'instant'});
  }

  function head(title, back='/overview') {
    return `<div class="section-head"><div><small>GW001 · PLAYER CODEX</small><h2>${e(title)}</h2></div><a class="back-btn" href="#${back}" aria-label="Indietro"></a></div>`;
  }

  function loading() {
    return `<div class="data-state"><span class="spinner"></span><strong>Caricamento Player Codex</strong></div>`;
  }

  function playerName(p){ return p.full_name || p.player_name || p.name || `Player ${p.sm_player_id || ''}`; }
  function playerClub(p, rosterMap){
    const r = rosterMap.get(String(p.sm_player_id));
    return r?.club_name || r?.current_club || p.current_club || p.club_name || '';
  }
  function imageOf(p){ return p.image_url || p.photo_url || p.player_image_url || ''; }
  function valueOf(p){ return p.market_value || p.value || p.player_value || ''; }
  function ratingOf(p){ return p.rating ?? p.overall_rating ?? ''; }
  function ageOf(p){ return p.age ?? ''; }
  function positionOf(p){ return p.position || p.position_text || ''; }

  function playerCard(p, rosterMap){
    const id = p.sm_player_id;
    const name = playerName(p);
    const img = imageOf(p);
    const club = playerClub(p, rosterMap);
    return `<a class="pc-player-card" href="#/player/${encodeURIComponent(id)}">
      <div class="pc-photo">${img ? `<img src="${e(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span>${e(name.charAt(0))}</span>`}</div>
      <div class="pc-main"><small>PLAYER CODEX ID · ${e(id)}</small><strong>${e(name)}</strong><span>${e(positionOf(p) || '—')}</span><em>ACTIVE IN RTH</em></div>
      <div class="pc-side"><b>${e(ratingOf(p) || '—')}</b><span>RATING</span><strong>${e(valueOf(p) || '—')}</strong><span>VALORE</span></div>
      <div class="pc-club">${e(club || 'Club non disponibile')}</div>
    </a>`;
  }

  async function renderList(){
    const seq = ++renderSeq;
    shell(`${head('Player Codex')}${loading()}`);
    try {
      const [players, roster] = await Promise.all([
        playersCache ? Promise.resolve(playersCache) : readAll('player_codex',{orderBy:'rating',orderDir:'DESC'}),
        rosterCache ? Promise.resolve(rosterCache) : readAll('player_codex_roster')
      ]);
      if (seq !== renderSeq || !path().startsWith('/codex')) return;
      playersCache = players; rosterCache = roster;
      const rosterMap = new Map(roster.filter(x=>x.sm_player_id).map(x=>[String(x.sm_player_id),x]));
      const clubs = [...new Set(players.map(p=>playerClub(p,rosterMap)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const positions = [...new Set(players.map(positionOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      shell(`${head('Player Codex')}
        <section class="pc-toolbar">
          <input id="pc-search" class="pc-search" type="search" placeholder="Cerca giocatore..." autocomplete="off">
          <div class="pc-toolbar-row"><button id="pc-filter-toggle" class="pc-filter-toggle">☷ Filtri <span id="pc-filter-count">0</span></button><select id="pc-sort"><option value="rating_desc">Rating ↓</option><option value="rating_asc">Rating ↑</option><option value="name_asc">Nome A-Z</option><option value="value_desc">Valore ↓</option></select></div>
        </section>
        <section id="pc-filters" class="pc-filters" hidden>
          <div class="pc-filter-head"><div><small>FILTRI PLAYER CODEX</small><strong>Ricerca avanzata</strong></div><button id="pc-close">Chiudi ↑</button></div>
          <div class="pc-filter-grid">
            <label>Club RTH attuale<select id="f-club"><option value="">Qualsiasi</option>${clubs.map(v=>`<option>${e(v)}</option>`).join('')}</select></label>
            <label>Posizione<select id="f-pos"><option value="">Qualsiasi</option>${positions.map(v=>`<option>${e(v)}</option>`).join('')}</select></label>
            <label>Rating compreso tra<div><input id="f-rmin" type="number" placeholder="Min"><span>e</span><input id="f-rmax" type="number" placeholder="Max"></div></label>
            <label>Età compresa tra<div><input id="f-amin" type="number" placeholder="Min"><span>e</span><input id="f-amax" type="number" placeholder="Max"></div></label>
            <label class="wide">Valore compreso tra<div><input id="f-vmin" type="number" placeholder="Min"><span>e</span><input id="f-vmax" type="number" placeholder="Max"></div></label>
          </div>
          <div class="pc-filter-actions"><button id="pc-reset">Reset</button><button id="pc-apply">Applica filtri</button></div>
        </section>
        <div class="pc-count"><strong id="pc-total">${players.length}</strong><span>giocatori</span></div>
        <div id="pc-list" class="pc-list"></div>`);

      const els = {
        search:document.getElementById('pc-search'), list:document.getElementById('pc-list'), total:document.getElementById('pc-total'),
        filters:document.getElementById('pc-filters'), count:document.getElementById('pc-filter-count'), club:document.getElementById('f-club'), pos:document.getElementById('f-pos'),
        rmin:document.getElementById('f-rmin'), rmax:document.getElementById('f-rmax'), amin:document.getElementById('f-amin'), amax:document.getElementById('f-amax'),
        vmin:document.getElementById('f-vmin'), vmax:document.getElementById('f-vmax'), sort:document.getElementById('pc-sort')
      };
      let applied = {};
      const numericValue = p => { const raw=String(valueOf(p)||'').replace(/[^0-9.]/g,''); return Number(raw)||0; };
      const draw = () => {
        let rows = players.filter(p => playerName(p).toLowerCase().includes(els.search.value.trim().toLowerCase()));
        rows = rows.filter(p => !applied.club || playerClub(p,rosterMap)===applied.club)
          .filter(p => !applied.pos || positionOf(p)===applied.pos)
          .filter(p => applied.rmin==null || Number(ratingOf(p))>=applied.rmin)
          .filter(p => applied.rmax==null || Number(ratingOf(p))<=applied.rmax)
          .filter(p => applied.amin==null || Number(ageOf(p))>=applied.amin)
          .filter(p => applied.amax==null || Number(ageOf(p))<=applied.amax)
          .filter(p => applied.vmin==null || numericValue(p)>=applied.vmin)
          .filter(p => applied.vmax==null || numericValue(p)<=applied.vmax);
        const s=els.sort.value;
        rows.sort((a,b)=> s==='name_asc' ? playerName(a).localeCompare(playerName(b)) : s==='rating_asc' ? Number(ratingOf(a)||0)-Number(ratingOf(b)||0) : s==='value_desc' ? numericValue(b)-numericValue(a) : Number(ratingOf(b)||0)-Number(ratingOf(a)||0));
        els.total.textContent=rows.length;
        els.list.innerHTML=rows.map(p=>playerCard(p,rosterMap)).join('') || `<div class="data-state"><strong>Nessun giocatore trovato</strong></div>`;
      };
      document.getElementById('pc-filter-toggle').onclick=()=>els.filters.hidden=false;
      document.getElementById('pc-close').onclick=()=>els.filters.hidden=true;
      document.getElementById('pc-reset').onclick=()=>{ [els.club,els.pos,els.rmin,els.rmax,els.amin,els.amax,els.vmin,els.vmax].forEach(x=>x.value=''); applied={}; els.count.textContent='0'; draw(); };
      document.getElementById('pc-apply').onclick=()=>{ const n=id=>id.value===''?null:Number(id.value); applied={club:els.club.value,pos:els.pos.value,rmin:n(els.rmin),rmax:n(els.rmax),amin:n(els.amin),amax:n(els.amax),vmin:n(els.vmin),vmax:n(els.vmax)}; els.count.textContent=Object.values(applied).filter(v=>v!==''&&v!==null).length; els.filters.hidden=true; draw(); };
      els.search.oninput=draw; els.sort.onchange=draw; draw();
    } catch(err){ if(seq===renderSeq) shell(`${head('Player Codex')}<div class="data-state error-state"><strong>Dati non disponibili</strong><small>${e(err.message)}</small></div>`); }
  }

  function prettyKey(k){ return String(k).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()); }
  function fieldGrid(row){
    return `<div class="pc-all-fields">${Object.entries(row||{}).map(([k,v])=>`<div class="pc-field"><span>${e(prettyKey(k))}</span><strong>${v===null||v===''?'—':e(typeof v==='object'?JSON.stringify(v):v)}</strong></div>`).join('')}</div>`;
  }
  function repoSection(name, rows){
    if(!rows.length) return '';
    return `<section class="pc-repo"><h3>${e(name.replaceAll('_',' '))}</h3>${rows.map((r,i)=>`<article><small>RECORD ${i+1}</small>${fieldGrid(r)}</article>`).join('')}</section>`;
  }

  async function renderDetail(id){
    const seq=++renderSeq;
    shell(`${head('Player Detail','/codex/players')}${loading()}`);
    try{
      const results = await Promise.all(repos.map(async repo=>{
        try { return [repo,(await request(repo,{limit:1000,filters:{sm_player_id:id}})).data]; }
        catch { return [repo,[]]; }
      }));
      if(seq!==renderSeq || !path().startsWith('/player/')) return;
      const data=Object.fromEntries(results);
      const p=data.player_codex?.[0];
      if(!p){ shell(`${head('Player Detail','/codex/players')}<div class="data-state"><strong>Giocatore non disponibile</strong></div>`); return; }
      const name=playerName(p), img=imageOf(p), roster=data.player_codex_roster?.[0];
      shell(`${head('Player Detail','/codex/players')}
        <section class="pc-profile-hero">
          <div class="pc-profile-photo">${img?`<img src="${e(img)}" alt="">`:`<span>${e(name.charAt(0))}</span>`}</div>
          <div><small>PLAYER CODEX ID · ${e(id)}</small><h3>${e(name)}</h3><p>${e(positionOf(p)||'—')}</p><div class="pc-profile-rating">${e(ratingOf(p)||'—')} <span>RATING</span></div><em>ACTIVE IN RTH</em></div>
        </section>
        ${roster?`<section class="pc-club-strip"><strong>${e(roster.club_name||roster.current_club||'Club RTH')}</strong><span>Roster attuale</span></section>`:''}
        ${repos.map(r=>repoSection(r,data[r]||[])).join('')}`);
    }catch(err){ if(seq===renderSeq) shell(`${head('Player Detail','/codex/players')}<div class="data-state error-state"><strong>Dati non disponibili</strong><small>${e(err.message)}</small></div>`); }
  }

  function route(){
    const p=path();
    if(p==='/codex' || p==='/codex/players') setTimeout(renderList,0);
    else if(/^\/player\/[^/]+$/.test(p)) setTimeout(()=>renderDetail(decodeURIComponent(p.split('/')[2])),0);
  }
  window.addEventListener('hashchange',route);
  window.addEventListener('popstate',route);
  route();
})();
