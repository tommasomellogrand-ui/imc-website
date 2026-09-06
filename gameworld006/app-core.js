(() => {
  'use strict';
  const APP=document.getElementById('app');
  const CFG=window.IMC_GAME_WORLD||{};
  const ROUTES=[
    ['competitions','Competitions','Leagues, cups and international tournaments'],
    ['managers','Managers','Our community, our strategies, our stories'],
    ['team-hub','Team Hub','Clubs, squads and identities'],
    ['trophy-room','Trophy Room','Glory, achievements, hall of fame'],
    ['news-feed','News Feed','Latest news, announcements and updates'],
    ['codex','Codex','Players, statistics and history'],
    ['transfers','Transfers','Market, rumours and deals']
  ];
  const hash=()=>location.hash.replace(/^#/,'')||'/overview';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const worldId=()=>String(CFG.gameWorldId||'GW001').toUpperCase();
  const gateway='/api/imc-gateway/';
  function shell(content){
    APP.innerHTML=`<header class="topbar"><a class="brand-mark" href="/" aria-label="Italian Masters Club"><img src="/site-assets/images/imc-logo.png" alt="IMC"></a><a class="brand" href="#/overview"><h1>ITALIAN MASTERS CLUB</h1><div class="brand-sub">THE WORLD IS OUR PLAYGROUND</div></a><button class="menu-btn" type="button" aria-label="Apri menu" aria-expanded="false"><span></span><span></span><span></span></button></header><aside class="drawer" hidden><div class="drawer-head"><small>${esc(worldId())}</small><strong>${esc(CFG.worldName)}</strong></div><nav><a href="#/overview">Overview</a>${ROUTES.map(([r,l])=>`<a href="#/${r}">${l}</a>`).join('')}</nav></aside><div class="scrim" hidden></div><main class="view">${content}</main><footer><div><strong>ITALIAN MASTERS CLUB</strong><span>THE WORLD IS OUR PLAYGROUND</span></div><div class="footer-line"></div><div class="footer-values">PASSION · COMPETITION · COMMUNITY · LEGACY</div></footer>`;
    const btn=APP.querySelector('.menu-btn'),drawer=APP.querySelector('.drawer'),scrim=APP.querySelector('.scrim');
    const close=()=>{drawer.hidden=true;scrim.hidden=true;btn.setAttribute('aria-expanded','false');};
    btn.onclick=()=>{const open=drawer.hidden;drawer.hidden=!open;scrim.hidden=!open;btn.setAttribute('aria-expanded',open?'true':'false');};
    scrim.onclick=close;drawer.querySelectorAll('a').forEach(a=>a.onclick=close);
  }
  function overview(){
    const cards=ROUTES.map(([route,label,copy])=>`<a class="home-card ${route}" href="#/${route}"><div class="card-copy"><h3>${label}</h3><p>${copy}</p></div><div class="card-art"></div><span class="card-arrow">›</span></a>`).join('');
    shell(`<section class="hero"><div class="hero-copy"><small>GAME WORLD ${esc(worldId().replace('GW',''))}</small><h2>${esc(CFG.worldName)}</h2><p>LEGENDS ARE BUILT OVER TIME</p></div><div class="hero-trophy">🏆</div><div class="hero-rail"><span>PAST</span><span>PRESENT</span><span>FUTURE</span><span>TOGETHER</span><i></i></div></section><section class="overview-grid">${cards}<div class="home-card extra-card" aria-label="Modulo futuro"><div class="mystery">?</div><span class="card-arrow">›</span></div></section>`);
  }
  const sectionHead=label=>`<div class="section-head"><div><small>${esc(worldId())}</small><h2>${esc(label)}</h2></div><a class="back-btn" href="#/overview" aria-label="Indietro">←</a></div>`;
  async function getAllTransfers(){
    const rows=[]; let offset=0; const limit=1000;
    while(true){
      const url=new URL(gateway,location.origin);
      url.searchParams.set('game_world_id',worldId());
      url.searchParams.set('repository','transfers');
      url.searchParams.set('limit',String(limit));
      url.searchParams.set('offset',String(offset));
      url.searchParams.set('order_by','imc_transfer_number');
      url.searchParams.set('order_dir','ASC');
      const res=await fetch(url.toString(),{cache:'no-store',headers:{Accept:'application/json'}});
      const payload=await res.json().catch(()=>({ok:false,error:'invalid_json'}));
      if(!res.ok||!payload?.ok) throw new Error(payload?.error||`HTTP ${res.status}`);
      const batch=Array.isArray(payload.data)?payload.data:[];
      rows.push(...batch);
      const total=Number(payload?.pagination?.total||rows.length);
      offset+=batch.length;
      if(!batch.length||offset>=total||batch.length<limit) break;
    }
    return rows;
  }
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
  const clean=v=>String(v??'').trim();
  const fmtUpdate=v=>{
    const s=clean(v); if(!s) return '—';
    const d=new Date(s.replace(' ','T')+'Z');
    if(Number.isNaN(d.getTime())) return s;
    return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'}).format(d);
  };
  const fmtDate=v=>{
    const s=clean(v); if(!s) return '';
    const d=new Date(`${s}T12:00:00`);
    if(Number.isNaN(d.getTime())) return s;
    return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d);
  };
  const initials=name=>clean(name).split(/[\s.]+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'IM';
  function transferCard(r,hero=false){
    const no=num(r.imc_transfer_number);
    const name=clean(r.player_name)||`Player ${clean(r.player_id)||'—'}`;
    const from=clean(r.club_from)||'—'; const to=clean(r.club_to)||'—';
    const amount=clean(r.amount_text)||'—'; const date=fmtDate(r.transfer_date);
    const season=clean(r.imc_season); const exchange=clean(r.exchange_players);
    const exchangeText=exchange&&exchange!=='[]'&&exchange!=='null'?`<div class="transfer-exchange">Scambio: ${esc(exchange)}</div>`:'';
    return `<article class="transfer-row${hero?' transfer-hero':''}" data-transfer-no="${no}">
      <div class="transfer-avatar" aria-hidden="true">${esc(initials(name))}</div>
      <div class="transfer-main">
        <div class="transfer-kicker">${hero?'LAST TRANSFER':`TRANSFER #${no||'—'}`}</div>
        <h3>${esc(name)}</h3>
        <div class="transfer-route"><span>${esc(from)}</span><b>››</b><span>${esc(to)}</span></div>
        <div class="transfer-meta">${date?`<span>${esc(date)}</span>`:''}${season?`<span>SEASON ${esc(season)}</span>`:''}${clean(r.player_id)?`<span>ID ${esc(r.player_id)}</span>`:''}</div>
        ${exchangeText}
      </div>
      <div class="transfer-fee"><strong>${esc(amount)}</strong><span>FEE</span>${!hero&&no?`<small>#${no}</small>`:''}</div>
    </article>`;
  }
  function bindTransferControls(allRows){
    const teamSel=APP.querySelector('#transfer-team-filter');
    const seasonSel=APP.querySelector('#transfer-season-filter');
    const list=APP.querySelector('#transfer-list');
    const latestWrap=APP.querySelector('#transfer-latest');
    const count=APP.querySelector('#transfer-visible-count');
    if(!teamSel||!seasonSel||!list||!latestWrap) return;
    const apply=()=>{
      const team=teamSel.value, season=seasonSel.value;
      const filtered=allRows.filter(r=>{
        const teamOk=!team||clean(r.club_from)===team||clean(r.club_to)===team;
        const seasonOk=!season||clean(r.imc_season)===season;
        return teamOk&&seasonOk;
      }).sort((a,b)=>num(b.imc_transfer_number)-num(a.imc_transfer_number));
      latestWrap.innerHTML=filtered.length?transferCard(filtered[0],true):'<div class="transfer-empty">Nessun trasferimento per i filtri selezionati.</div>';
      list.innerHTML=filtered.length?filtered.map(r=>transferCard(r)).join(''):'<div class="transfer-empty">Nessun trasferimento disponibile.</div>';
      if(count) count.textContent=`${filtered.length.toLocaleString('it-IT')} movimenti`;
    };
    teamSel.onchange=apply; seasonSel.onchange=apply; apply();
  }
  async function transfersView(){
    shell(`${sectionHead('Transfers')}<section class="transfers-page"><div class="transfers-loading"><span></span><strong>CARICAMENTO TRANSFERS ${esc(worldId())}</strong><small>MySQL Aruba</small></div></section>`);
    try{
      const rows=await getAllTransfers();
      if(hash().split('/').filter(Boolean)[0]!=='transfers') return;
      const ordered=[...rows].sort((a,b)=>num(a.imc_transfer_number)-num(b.imc_transfer_number));
      const latest=ordered.at(-1)||null;
      const teams=[...new Set(rows.flatMap(r=>[clean(r.club_from),clean(r.club_to)]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'));
      const seasons=[...new Set(rows.map(r=>clean(r.imc_season)).filter(Boolean))].sort((a,b)=>num(b)-num(a));
      const lastUpdate=[...rows].map(r=>clean(r.imported_at)).filter(Boolean).sort().at(-1)||'';
      const firstNo=ordered[0]?num(ordered[0].imc_transfer_number):0;
      const lastNo=latest?num(latest.imc_transfer_number):0;
      shell(`${sectionHead('Transfers')}<section class="transfers-page">
        <div class="transfer-metrics"><div class="transfer-metric"><span>MOVIMENTI</span><strong>${rows.length.toLocaleString('it-IT')}</strong><small>${firstNo&&lastNo?`#${firstNo} → #${lastNo}`:'Repository transfers'}</small></div><div class="transfer-metric"><span>ULTIMO AGGIORNAMENTO</span><strong>${esc(fmtUpdate(lastUpdate))}</strong><small>${esc(worldId())} · ${esc(CFG.worldName||'')}</small></div></div>
        <div class="transfer-filters"><label><span>FILTRA SQUADRE</span><select id="transfer-team-filter"><option value="">Tutte le squadre</option>${teams.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><label><span>FILTRA STAGIONE</span><select id="transfer-season-filter" ${seasons.length?'':'disabled'}><option value="">${seasons.length?'Tutte le stagioni':'Stagione non valorizzata'}</option>${seasons.map(s=>`<option value="${esc(s)}">Season ${esc(s)}</option>`).join('')}</select></label></div>
        <div id="transfer-latest" class="transfer-latest">${latest?transferCard(latest,true):'<div class="transfer-empty">Nessun trasferimento disponibile.</div>'}</div>
        <div class="transfer-list-head"><h3>ULTIMI TRASFERIMENTI</h3><span id="transfer-visible-count">${rows.length.toLocaleString('it-IT')} movimenti</span></div>
        <div id="transfer-list" class="transfer-list"></div>
      </section>`);
      bindTransferControls(rows);
    }catch(err){
      if(hash().split('/').filter(Boolean)[0]!=='transfers') return;
      shell(`${sectionHead('Transfers')}<section class="module-baseline transfer-error"><strong>DATI TRANSFERS NON DISPONIBILI</strong><p>${esc(err?.message||'gateway_error')}</p></section>`);
    }
  }
  function moduleView(route){
    const item=ROUTES.find(([r])=>r===route);
    if(!item){overview();return;}
    if(route==='transfers'){transfersView();return;}
    shell(`${sectionHead(item[1])}<section class="module-baseline"><strong>${esc(item[1])}</strong><p>Modulo pronto per essere collegato ai dati ${esc(worldId())}.</p></section>`);
  }
  function render(){const p=hash().split('/').filter(Boolean);if(!p.length||p[0]==='overview')overview();else moduleView(p[0]);window.scrollTo({top:0,behavior:'instant'});}
  window.addEventListener('hashchange',render);render();
})();