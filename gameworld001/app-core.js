(() => {
  'use strict';
  const APP=document.getElementById('app');
  const CFG=window.IMC_GAME_WORLD||{};
  const ROUTES=[['competitions','Competitions','🏆'],['managers','Managers','◎'],['team-hub','Team Hub','⬡'],['trophy-room','Trophy Room','♛'],['news-feed','News Feed','▤'],['codex','Codex','▥'],['transfers','Transfers','⇄']];
  const root=()=>`/${String(CFG.gameWorldId||'GW001').toLowerCase().replace('gw','gameworld')}/`;
  const hash=()=>location.hash.replace(/^#/,'')||'/overview';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function shell(content){
    APP.innerHTML=`<header class="topbar"><a class="brand-mark" href="/" aria-label="Italian Masters Club">IMC</a><a class="brand" href="#/overview"><h1>${esc(CFG.worldName)}</h1><div class="brand-sub">GAME WORLD</div></a><button class="menu-btn" type="button" aria-label="Apri menu" aria-expanded="false"><span></span><span></span><span></span></button></header><aside class="drawer" hidden><div class="drawer-head"><small>${esc(CFG.gameWorldId)}</small><strong>${esc(CFG.worldName)}</strong></div><nav><a href="#/overview">Overview</a>${ROUTES.map(([r,l])=>`<a href="#/${r}">${l}</a>`).join('')}</nav></aside><div class="scrim" hidden></div><main class="view">${content}</main><footer>ITALIAN MASTERS CLUB · THE WORLD IS OUR PLAYGROUND</footer>`;
    const btn=APP.querySelector('.menu-btn'),drawer=APP.querySelector('.drawer'),scrim=APP.querySelector('.scrim');
    const close=()=>{drawer.hidden=true;scrim.hidden=true;btn.setAttribute('aria-expanded','false');};
    btn.onclick=()=>{const open=drawer.hidden;drawer.hidden=!open;scrim.hidden=!open;btn.setAttribute('aria-expanded',open?'true':'false');};
    scrim.onclick=close;drawer.querySelectorAll('a').forEach(a=>a.onclick=close);
  }
  function overview(){
    const cards=ROUTES.map(([route,label,icon],i)=>`<a class="home-card ${route}${i===0?' tall':''}" href="#/${route}"><div><h3>${label}</h3><p>${label==='Competitions'?'Competition data':label==='Managers'?'Game World managers':label==='Team Hub'?'Clubs and rosters':label==='Trophy Room'?'Game World honours':label==='News Feed'?'World news':label==='Codex'?'Player Codex':'Market activity'}</p></div><span>${icon}</span></a>`).join('');
    shell(`<section class="world-card"><div class="world-id"><strong>${esc(CFG.gameWorldId)}</strong><span>GAME WORLD</span></div><div class="world-name">${esc(CFG.worldName)}</div></section><section class="overview-grid">${cards}<div class="home-card extra-card" aria-label="Modulo futuro"></div></section>`);
  }
  function moduleView(route){
    const item=ROUTES.find(([r])=>r===route);
    if(!item){overview();return;}
    shell(`<div class="section-head"><div><small>${esc(CFG.gameWorldId)}</small><h2>${esc(item[1])}</h2></div><a class="back-btn" href="#/overview" aria-label="Indietro">←</a></div><section class="module-baseline"><strong>${esc(item[1])}</strong><p>Modulo pronto per essere collegato al repository ${esc(CFG.gameWorldId)}.</p></section>`);
  }
  function render(){const p=hash().split('/').filter(Boolean);if(!p.length||p[0]==='overview')overview();else moduleView(p[0]);window.scrollTo({top:0,behavior:'instant'});}
  window.addEventListener('hashchange',render);render();
})();
