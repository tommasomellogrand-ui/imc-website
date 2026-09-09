(() => {
  const root=document.getElementById('app');
  const cfg=window.IMC_GAME_WORLD||{};
  if(!root)return;
  const m=String(cfg.id||cfg.gameWorldId||location.pathname.match(/gameworld(\d{3})/i)?.[1]||'001').match(/\d{3}/)?.[0]||'001';
  const GW='GW'+m;
  const worlds={GW001:'Road To History',GW002:'Gold 558',GW003:'Gold 557',GW004:'World League',GW005:'Hall Of Famers',GW006:'Masters Of The World',GW007:'The Four Kingdoms',GW008:'Gold 1',GW009:'Kick Off'};
  const world=worlds[GW]||cfg.name||GW;
  const modules=[['competitions','Competitions'],['results','Results'],['calendar','Calendar'],['team-hub','Team Hub'],['managers','Managers'],['trophy-room','Trophy Room'],['codex','Codex'],['transfers','Transfers']];
  const playerIds={GW001:2772,GW002:1131,GW003:4336,GW004:14540,GW005:17566,GW006:17811,GW007:18422,GW008:16053,GW009:31561};
  const clubIds={GW001:[140,163,123,115],GW002:[49,47,44,21],GW003:[391,392,390,404],GW004:[109,110,746,107],GW005:[338,329,330,335],GW006:[270,282,281,284],GW007:[123,21,138,390],GW008:[83,123,258,335],GW009:[861,476,881,859]};
  const p=id=>`https://cdn.soccerwiki.org/images/player/${id}.png`;
  const c=id=>`https://cdn.soccerwiki.org/images/logos/clubs/${id}.png`;
  const img=(src,cls,alt='')=>`<img class="${cls}" src="${src}" alt="${alt}" onerror="this.style.display='none'">`;
  const links=(cls='gw-menu')=>`<nav class="${cls}">${modules.map(([s,l])=>`<a href="./${s}/"><span>${l}</span><b>↗</b></a>`).join('')}</nav>`;
  const badges=()=>`<div class="gw-badges">${clubIds[GW].map(id=>img(c(id),'gw-badge','club')).join('')}</div>`;
  const hero=()=>img(p(playerIds[GW]),'gw-player','player');
  function pageTitle(){document.title=`${GW} · ${world} | Italian Masters Club`;document.body.dataset.gw=GW;}
  function home(){
    const n=Number(m);
    const shells={
      1:()=>`<main class="gw-shell concept-broadcast"><aside class="gw-rail"><div class="gw-mark">IMC</div>${links('gw-menu')}</aside><section class="gw-stage"><div class="gw-kicker">${GW} / LIVE WORLD</div><h1>${world}</h1><div class="gw-visual">${hero()}<div class="gw-overlay"><strong>ROAD TO HISTORY</strong><span>Broadcast cockpit</span></div></div><div class="gw-strip">${badges()}<b>LIVE DATA FEED</b></div></section></main>`,
      2:()=>`<main class="gw-shell concept-magazine"><header><span>${GW}</span><h1>${world}</h1><p>No menu. Scroll, stories, football.</p></header><section class="gw-cover">${hero()}<div><em>ISSUE 002</em><h2>THE WORLD<br>IN MOTION</h2></div></section><section class="gw-editorial">${modules.map(([s,l],i)=>`<a href="./${s}/"><small>0${i+1}</small><h3>${l}</h3><p>Enter the ${l.toLowerCase()} desk.</p></a>`).join('')}</section>${badges()}</main>`,
      3:()=>`<main class="gw-shell concept-glass"><header><div class="gw-brand">IMC / ${GW}</div>${links('gw-topnav')}</header><section class="gw-hero"><div><span>NEON MATCHSPACE</span><h1>${world}</h1><p>Top navigation, glass layers and electric depth.</p></div>${hero()}</section><section class="gw-glassgrid">${modules.slice(0,4).map(([s,l])=>`<a href="./${s}/"><b>${l}</b><span>OPEN</span></a>`).join('')}</section>${badges()}</main>`,
      4:()=>`<main class="gw-shell concept-brutal"><section class="gw-brutalhero"><div class="gw-number">004</div><h1>${world}</h1>${hero()}</section><section class="gw-brutalstats"><div>WORLD</div><div>LEAGUE</div><div>IMC</div></section>${links('gw-bottomnav')}</main>`,
      5:()=>`<main class="gw-shell concept-orbit"><div class="gw-orbit-core">${hero()}<span>${GW}</span><h1>${world}</h1></div><div class="gw-orbits">${modules.map(([s,l],i)=>`<a href="./${s}/" style="--i:${i}">${l}</a>`).join('')}</div>${badges()}<button class="gw-pulse" onclick="document.body.classList.toggle('orbit-open')">OPEN WORLD</button></main>`,
      6:()=>`<main class="gw-shell concept-console"><header><span>IMC CONTROL DECK</span><h1>${world}</h1></header><section class="gw-console-player">${hero()}<div><b>${GW}</b><span>ACTIVE SESSION</span></div></section><section class="gw-buttons">${modules.map(([s,l],i)=>`<a href="./${s}/"><i>${i+1}</i><b>${l}</b><span>PRESS</span></a>`).join('')}</section></main>`,
      7:()=>`<main class="gw-shell concept-hud"><div class="hud-grid"></div><header><span>SYS://IMC/${GW}</span><h1>${world}</h1><b>ONLINE</b></header><section class="hud-main"><div class="hud-scan">${hero()}</div><div class="hud-data">${modules.map(([s,l],i)=>`<a href="./${s}/"><span>0${i+1}</span><b>${l}</b><i>READY</i></a>`).join('')}</div></section>${badges()}</main>`,
      8:()=>`<main class="gw-shell concept-retro"><header><span>IMC COMPUTER SPORTS</span><h1>${GW} ${world}</h1><p>READY.</p></header><section class="retro-screen"><div class="retro-player">${hero()}</div><div class="retro-menu">${modules.map(([s,l],i)=>`<a href="./${s}/">${String(i+1).padStart(2,'0')} &gt; ${l.toUpperCase()}</a>`).join('')}</div></section><footer>© 1991/2026 ITALIAN MASTERS CLUB</footer></main>`,
      9:()=>`<main class="gw-shell concept-cinema"><section class="cinema-hero">${hero()}<div class="cinema-shade"></div><div class="cinema-copy"><span>${GW} / IMC ORIGINAL</span><h1>${world}</h1><p>A football world presented like a film title sequence.</p></div></section><section class="cinema-actions">${modules.map(([s,l])=>`<a href="./${s}/"><span>${l}</span><b>ENTER</b></a>`).join('')}</section>${badges()}</main>`
    };
    root.innerHTML=(shells[n]||shells[1])();
  }
  function subpage(slug){
    const label=modules.find(x=>x[0]===slug)?.[1]||slug;
    root.innerHTML=`<main class="gw-shell gw-subpage"><a class="gw-back" href="../">← ${world}</a><span class="gw-subeyebrow">${GW}</span><h1>${label}</h1><p>Concept preview page. The selected visual system is preserved here.</p><div class="gw-subvisual">${hero()}${badges()}</div></main>`;
  }
  pageTitle();
  const parts=location.pathname.split('/').filter(Boolean);const current=parts.length>1?parts[1].toLowerCase():'';
  if(modules.some(x=>x[0]===current))subpage(current);else home();
})();