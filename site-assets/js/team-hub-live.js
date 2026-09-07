(() => {
  'use strict';

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const clean=v=>String(v??'').trim();
  const worldId=()=>String(window.IMC_GAME_WORLD?.gameWorldId||'GW001').toUpperCase();
  const isTeamHub=()=>location.hash.replace(/^#/,'').split('/').filter(Boolean)[0]==='team-hub';
  const endpoint='/api/imc-gateway/team-hub.php';
  let activeTab='clubs';
  const cache={clubs:null,nations:null};

  function ensureStyle(){
    if(document.getElementById('imc-team-hub-live-style')) return;
    const s=document.createElement('style');
    s.id='imc-team-hub-live-style';
    s.textContent=`
      .team-hub-live{padding:2px 0 34px}.team-hub-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 18px;padding:5px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(4,14,24,.68)}.team-hub-tab{height:48px;border:0;border-radius:12px;background:transparent;color:#8799ad;font:900 12px Inter,system-ui,sans-serif;letter-spacing:.16em}.team-hub-tab.active{background:linear-gradient(145deg,#d7a24c,#b47a22);color:#06111f;box-shadow:0 10px 26px rgba(214,161,73,.2)}.team-hub-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 2px 14px}.team-hub-meta strong{font-size:17px;letter-spacing:.04em}.team-hub-meta span{color:#8294a8;font-size:10px;letter-spacing:.13em;font-weight:900}.team-hub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.team-hub-card{position:relative;min-width:0;aspect-ratio:.83/1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:12px 8px 10px;border:1px solid rgba(255,255,255,.14);border-radius:17px;background:radial-gradient(circle at 50% 0,rgba(43,111,170,.15),transparent 42%),linear-gradient(155deg,#0c2238,#071725 76%);box-shadow:0 14px 30px rgba(0,0,0,.18);overflow:hidden}.team-hub-logo{width:64px;height:64px;display:grid;place-items:center;margin:1px auto 9px;border-radius:15px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);overflow:hidden;color:#b8c6d5;font-size:18px;font-weight:900}.team-hub-logo img{width:100%;height:100%;object-fit:contain;padding:5px}.team-hub-logo-fallback{display:none}.team-hub-logo.failed img{display:none}.team-hub-logo.failed .team-hub-logo-fallback{display:block}.team-hub-id{max-width:100%;margin-top:auto;color:#d6a149;font-size:9px;font-weight:900;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.team-hub-name{width:100%;margin-top:4px;color:#f4f6f8;font-size:11px;line-height:1.15;font-weight:900;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.team-hub-short{margin-top:3px;color:#71859a;font-size:8px;font-weight:800;letter-spacing:.1em}.team-hub-loading,.team-hub-empty,.team-hub-error{min-height:270px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:linear-gradient(145deg,rgba(12,30,48,.96),rgba(5,15,26,.96));display:grid;place-items:center;align-content:center;gap:10px;text-align:center;color:#90a1b4}.team-hub-loading i{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.14);border-top-color:#d6a149;animation:teamHubSpin .8s linear infinite}.team-hub-loading strong,.team-hub-error strong{color:#fff;letter-spacing:.12em}.team-hub-error strong{font-size:24px}@keyframes teamHubSpin{to{transform:rotate(360deg)}}
      @media(min-width:760px){.team-hub-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.team-hub-card{padding:15px 10px 12px}.team-hub-logo{width:74px;height:74px}.team-hub-name{font-size:12px}}
      @media(max-width:390px){.team-hub-grid{gap:8px}.team-hub-card{padding:10px 6px 9px;border-radius:15px}.team-hub-logo{width:56px;height:56px}.team-hub-name{font-size:10px}.team-hub-id{font-size:8px}}
    `;
    document.head.appendChild(s);
  }

  const sectionHead=()=>`<div class="section-head"><div><small>${esc(worldId())}</small><h2>Team Hub</h2></div><a class="back-btn" href="#/overview" aria-label="Indietro">←</a></div>`;

  async function load(dataset){
    if(cache[dataset]) return cache[dataset];
    const u=new URL(endpoint,location.origin);
    u.searchParams.set('game_world_id',worldId());
    u.searchParams.set('dataset',dataset);
    const r=await fetch(u.toString(),{cache:'no-store',headers:{Accept:'application/json'}});
    const p=await r.json().catch(()=>({ok:false,error:'invalid_json'}));
    if(!r.ok||!p?.ok) throw new Error(p?.error||`HTTP ${r.status}`);
    cache[dataset]=Array.isArray(p.data)?p.data:[];
    return cache[dataset];
  }

  function initials(name){
    return clean(name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'IM';
  }

  function card(row,dataset){
    const name=clean(row.name)||'—';
    const img=clean(row.image_url);
    const id=dataset==='clubs'?clean(row.club_gw_id):clean(row.nation_gw_id);
    const short=clean(row.short_name)||(dataset==='nations'?clean(row.national_team_id):'');
    const hasImage=/^(?:https?:\/\/|\/)/i.test(img);
    return `<article class="team-hub-card">
      <div class="team-hub-logo">${hasImage?`<img src="${esc(img)}" alt="${esc(name)}" loading="lazy" onerror="this.parentElement.classList.add('failed')"><span class="team-hub-logo-fallback">${esc(initials(name))}</span>`:esc(initials(name))}</div>
      <div class="team-hub-id">ID ${esc(id||'—')}</div>
      <div class="team-hub-name">${esc(name)}</div>
      ${short?`<div class="team-hub-short">${esc(short)}</div>`:''}
    </article>`;
  }

  async function paint(dataset){
    if(!isTeamHub()) return;
    activeTab=dataset;
    ensureStyle();
    const view=document.querySelector('main.view');
    if(!view) return;
    view.innerHTML=`${sectionHead()}<section class="team-hub-live"><div class="team-hub-tabs"><button class="team-hub-tab ${dataset==='clubs'?'active':''}" data-tab="clubs" type="button">CLUB</button><button class="team-hub-tab ${dataset==='nations'?'active':''}" data-tab="nations" type="button">NATIONS</button></div><div class="team-hub-loading"><i></i><strong>CARICAMENTO ${dataset==='clubs'?'CLUB':'NATIONS'}</strong><span>CORE · MySQL Aruba</span></div></section>`;
    view.querySelectorAll('.team-hub-tab').forEach(btn=>btn.onclick=()=>paint(btn.dataset.tab));
    try{
      const rows=await load(dataset);
      if(!isTeamHub()||activeTab!==dataset) return;
      view.innerHTML=`${sectionHead()}<section class="team-hub-live"><div class="team-hub-tabs"><button class="team-hub-tab ${dataset==='clubs'?'active':''}" data-tab="clubs" type="button">CLUB</button><button class="team-hub-tab ${dataset==='nations'?'active':''}" data-tab="nations" type="button">NATIONS</button></div><div class="team-hub-meta"><strong>${dataset==='clubs'?'ACTIVE CLUBS':'NATIONS'}</strong><span>${rows.length.toLocaleString('it-IT')} ${dataset==='clubs'?'CLUB':'NAZIONI'}</span></div>${rows.length?`<div class="team-hub-grid">${rows.map(r=>card(r,dataset)).join('')}</div>`:'<div class="team-hub-empty"><strong>Nessun dato disponibile</strong></div>'}</section>`;
      view.querySelectorAll('.team-hub-tab').forEach(btn=>btn.onclick=()=>paint(btn.dataset.tab));
    }catch(e){
      if(!isTeamHub()) return;
      view.innerHTML=`${sectionHead()}<section class="team-hub-live"><div class="team-hub-tabs"><button class="team-hub-tab ${dataset==='clubs'?'active':''}" data-tab="clubs" type="button">CLUB</button><button class="team-hub-tab ${dataset==='nations'?'active':''}" data-tab="nations" type="button">NATIONS</button></div><div class="team-hub-error"><strong>TEAM HUB NON DISPONIBILE</strong><span>${esc(e?.message||'gateway_error')}</span></div></section>`;
      view.querySelectorAll('.team-hub-tab').forEach(btn=>btn.onclick=()=>paint(btn.dataset.tab));
    }
  }

  function render(){if(isTeamHub()) setTimeout(()=>paint(activeTab),0);}
  window.addEventListener('hashchange',render);
  setTimeout(render,0);
})();
