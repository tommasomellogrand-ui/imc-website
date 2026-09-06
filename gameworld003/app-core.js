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
  function shell(content){
    APP.innerHTML=`<header class="topbar"><a class="brand-mark" href="/" aria-label="Italian Masters Club"><img src="/site-assets/images/imc-logo.png" alt="IMC"></a><a class="brand" href="#/overview"><h1>ITALIAN MASTERS CLUB</h1><div class="brand-sub">THE WORLD IS OUR PLAYGROUND</div></a><button class="menu-btn" type="button" aria-label="Apri menu" aria-expanded="false"><span></span><span></span><span></span></button></header><aside class="drawer" hidden><div class="drawer-head"><small>${esc(CFG.gameWorldId)}</small><strong>${esc(CFG.worldName)}</strong></div><nav><a href="#/overview">Overview</a>${ROUTES.map(([r,l])=>`<a href="#/${r}">${l}</a>`).join('')}</nav></aside><div class="scrim" hidden></div><main class="view">${content}</main><footer><div><strong>ITALIAN MASTERS CLUB</strong><span>THE WORLD IS OUR PLAYGROUND</span></div><div class="footer-line"></div><div class="footer-values">PASSION · COMPETITION · COMMUNITY · LEGACY</div></footer>`;
    const btn=APP.querySelector('.menu-btn'),drawer=APP.querySelector('.drawer'),scrim=APP.querySelector('.scrim');
    const close=()=>{drawer.hidden=true;scrim.hidden=true;btn.setAttribute('aria-expanded','false');};
    btn.onclick=()=>{const open=drawer.hidden;drawer.hidden=!open;scrim.hidden=!open;btn.setAttribute('aria-expanded',open?'true':'false');};
    scrim.onclick=close;drawer.querySelectorAll('a').forEach(a=>a.onclick=close);
  }
  function overview(){
    const cards=ROUTES.map(([route,label,copy])=>`<a class="home-card ${route}" href="#/${route}"><div class="card-copy"><h3>${label}</h3><p>${copy}</p></div><div class="card-art"></div><span class="card-arrow">›</span></a>`).join('');
    shell(`<section class="hero"><div class="hero-copy"><small>GAME WORLD ${esc(String(CFG.gameWorldId||'GW001').replace('GW',''))}</small><h2>${esc(CFG.worldName)}</h2><p>LEGENDS ARE BUILT OVER TIME</p></div><div class="hero-trophy">🏆</div><div class="hero-rail"><span>PAST</span><span>PRESENT</span><span>FUTURE</span><span>TOGETHER</span><i></i></div></section><section class="overview-grid">${cards}<div class="home-card extra-card" aria-label="Modulo futuro"><div class="mystery">?</div><span class="card-arrow">›</span></div></section>`);
  }
  function moduleView(route){
    const item=ROUTES.find(([r])=>r===route);
    if(!item){overview();return;}
    shell(`<div class="section-head"><div><small>${esc(CFG.gameWorldId)}</small><h2>${esc(item[1])}</h2></div><a class="back-btn" href="#/overview" aria-label="Indietro">←</a></div><section class="module-baseline"><strong>${esc(item[1])}</strong><p>Modulo pronto per essere collegato ai dati ${esc(CFG.gameWorldId)}.</p></section>`);
  }
  function render(){const p=hash().split('/').filter(Boolean);if(!p.length||p[0]==='overview')overview();else moduleView(p[0]);window.scrollTo({top:0,behavior:'instant'});}
  window.addEventListener('hashchange',render);render();
})();