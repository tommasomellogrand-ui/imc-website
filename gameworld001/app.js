const ROOT='/gameworld001/';
const sections={
 'road-chronicle':{title:'THE ROAD CHRONICLE',sub:'Road To History Official Journal',icon:'▤',intro:'Notizie, numeri speciali e storie del mondo.',items:['Ultime notizie','Archivio numeri','Cover stories']},
 competitions:{title:'COMPETITIONS',sub:'League · Cups · Intl',icon:'♜',intro:'Tutte le competizioni del Game World 001.',items:['Platinum Division','Gold Division','Silver Division','Bronze Division','RTH Cup','Champions','Shield']},
 'team-hub':{title:'TEAM HUB',sub:'Club · Nazionali',icon:'◉',intro:'Squadre, rose e percorsi nel mondo.',items:['Club','Nazionali','Schede squadra']},
 managers:{title:'MANAGERS',sub:'IMC · External',icon:'♙',intro:'Tutti i manager presenti in Road To History.',items:['Manager IMC','Manager esterni','Schede manager']},
 codex:{title:'CODEX',sub:'Archivio del GW',icon:'▥',intro:'Giocatori, record e memoria storica del mondo.',items:['Player Codex','Record','Statistiche']},
 transfers:{title:'TRANSFERS',sub:'Mercato del GW',icon:'⇄',intro:'Movimenti di mercato e dettagli delle operazioni.',items:['Ultimi trasferimenti','Acquisti','Cessioni']}
};
function route(){return location.pathname.replace(ROOT,'').split('/').filter(Boolean)[0]||'home'}
function header(){return `<section class="world-head"><p>IMC SEASON <b>SEASON 1</b><time>2026-07-12 → 2026-09-20</time></p><div><span>GW001</span><i></i><strong>Road To History</strong><small>SEASON 1 · INIZIO 2026-07-12 · FINE 2026-09-20</small></div></section>`}
function card(k,w=false){const s=sections[k];return `<a class="hub-card ${w?'wide':''}" href="${ROOT}${k}/"><div><h2>${s.title}</h2><p>${s.sub}</p></div><b>${s.icon}</b></a>`}
function home(){return `${header()}<section class="hub-grid">${card('road-chronicle',true)}${card('competitions')}${card('team-hub')}${card('managers')}${card('codex')}${card('transfers')}</section>`}
function section(k){const s=sections[k];return `<section class="section-page"><a class="back" href="${ROOT}">←</a><p class="eyebrow">GW001 · ROAD TO HISTORY</p><div class="section-title"><span>${s.icon}</span><div><h1>${s.title}</h1><p>${s.sub}</p></div></div><p class="intro">${s.intro}</p><div class="section-links">${s.items.map((x,i)=>`<a href="${ROOT}${k}/${i+1}/"><span>0${i+1}</span><strong>${x}</strong><b>→</b></a>`).join('')}</div><div class="public-note">PUBLIC BETA · STRUTTURA NEXUS</div></section>`}
const key=route();document.querySelector('#app').innerHTML=key==='home'?home():section(sections[key]?key:'codex');document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(key==='home'?'home':key)));
