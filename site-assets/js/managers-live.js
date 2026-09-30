(() => {
  'use strict';

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const clean=v=>String(v??'').trim();
  const worldId=()=>String(window.IMC_GAME_WORLD?.gameWorldId||'GW001').toUpperCase();
  const isManagers=()=>location.hash.replace(/^#/,'').split('/').filter(Boolean)[0]==='managers';
  const gateway='/api/imc-gateway/';
  const teamHub='/api/imc-gateway/team-hub.php';
  let active='club';
  let scope='imc_active';
  const cache={assignments:{},managers:null,extAssignments:{},extManagers:null,teams:{}};

  const fmtDate=value=>{
    const s=clean(value);
    if(!s) return '—';
    const d=new Date(`${s}T12:00:00`);
    if(Number.isNaN(d.getTime())) return s;
    return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d);
  };

  const initials=name=>clean(name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'IM';

  function ensureStyle(){
    if(document.getElementById('imc-managers-live-style')) return;
    const s=document.createElement('style');
    s.id='imc-managers-live-style';
    s.textContent=`
      .managers-live{padding:2px 0 34px}.managers-scope-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:0 0 12px;padding:5px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(4,14,24,.68)}.managers-scope-tab{min-height:44px;border:0;border-radius:12px;background:transparent;color:#8799ad;font:900 10px Inter,system-ui,sans-serif;letter-spacing:.08em}.managers-scope-tab.active{background:linear-gradient(145deg,#d7a24c,#b47a22);color:#06111f}.managers-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 18px;padding:5px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(4,14,24,.68)}.managers-tab{height:48px;border:0;border-radius:12px;background:transparent;color:#8799ad;font:900 12px Inter,system-ui,sans-serif;letter-spacing:.14em}.managers-tab.active{background:linear-gradient(145deg,#d7a24c,#b47a22);color:#06111f;box-shadow:0 10px 26px rgba(214,161,73,.2)}.managers-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 2px 14px}.managers-meta strong{font-size:17px}.managers-meta span{color:#8294a8;font-size:10px;letter-spacing:.12em;font-weight:900}.managers-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.manager-card{display:grid;grid-template-columns:54px 1fr;gap:10px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:17px;background:radial-gradient(circle at 100% 0,rgba(43,111,170,.15),transparent 42%),linear-gradient(155deg,#0c2238,#071725 76%);box-shadow:0 14px 30px rgba(0,0,0,.18)}.manager-avatar{width:54px;height:54px;border-radius:14px;display:grid;place-items:center;background:#0d2a46;border:1px solid rgba(255,255,255,.09);color:#dbe8f4;font-weight:900}.manager-main{min-width:0}.manager-main small{display:block;color:#d6a149;font-size:8px;font-weight:900;letter-spacing:.1em}.manager-main h3{margin:4px 0 5px;font-size:13px;line-height:1.1}.manager-team{display:flex;align-items:center;gap:7px;min-width:0}.manager-team img{width:24px;height:24px;object-fit:contain}.manager-team span{font-size:10px;color:#aebdca;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.manager-date{margin-top:6px;color:#71859a;font-size:8px;font-weight:800}.manager-ended{opacity:.55}.managers-loading,.managers-error,.managers-empty{min-height:270px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:linear-gradient(145deg,rgba(12,30,48,.96),rgba(5,15,26,.96));display:grid;place-items:center;align-content:center;gap:10px;text-align:center;color:#90a1b4}.managers-loading i{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.14);border-top-color:#d6a149;animation:mgSpin .8s linear infinite}@keyframes mgSpin{to{transform:rotate(360deg)}}@media(min-width:760px){.managers-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  const head=()=>`<div class="section-head"><div><small>${esc(worldId())}</small><h2>Managers</h2></div><a class="back-btn" href="#/overview" aria-label="Indietro">←</a></div>`;

  async function gatewayRead(repository,filters={}){
    const u=new URL(gateway,location.origin);
    u.searchParams.set('source','core');
    u.searchParams.set('game_world_id',worldId());
    u.searchParams.set('repository',repository);
    u.searchParams.set('limit','1000');
    Object.entries(filters).forEach(([k,v])=>u.searchParams.set(`filter_${k}`,v));
    const r=await fetch(u.toString(),{cache:'no-store',headers:{Accept:'application/json'}});
    const p=await r.json().catch(()=>({ok:false,error:'invalid_json'}));
    if(!r.ok||!p?.ok) throw new Error(p?.error||`HTTP ${r.status}`);
    return Array.isArray(p.data)?p.data:[];
  }

  async function loadManagers(){
    if(cache.managers) return cache.managers;
    const rows=await gatewayRead('imc_managers');
    cache.managers=new Map(rows.map(r=>[clean(r.manager_id),r]));
    return cache.managers;
  }

  async function loadExtManagers(){
    if(cache.extManagers) return cache.extManagers;
    const rows=await gatewayRead('ext_managers');
    cache.extManagers=new Map(rows.map(r=>[clean(r.sm_manager_id),r]));
    return cache.extManagers;
  }

  async function loadExtAssignments(type){
    if(cache.extAssignments[type]) return cache.extAssignments[type];
    cache.extAssignments[type]=await gatewayRead('ext_manager_assignments',{game_world_id:worldId(),assignment_type:type});
    return cache.extAssignments[type];
  }

  async function loadAssignments(type){
    if(cache.assignments[type]) return cache.assignments[type];
    cache.assignments[type]=await gatewayRead('gw_manager_assignments',{game_world_id:worldId(),assignment_type:type});
    return cache.assignments[type];
  }

  async function loadTeams(type){
    if(cache.teams[type]) return cache.teams[type];
    const dataset=type==='club'?'clubs':'nations';
    const u=new URL(teamHub,location.origin);
    u.searchParams.set('game_world_id',worldId());
    u.searchParams.set('dataset',dataset);
    const r=await fetch(u.toString(),{cache:'no-store',headers:{Accept:'application/json'}});
    const p=await r.json().catch(()=>({ok:false,error:'invalid_json'}));
    if(!r.ok||!p?.ok) throw new Error(p?.error||`HTTP ${r.status}`);
    const rows=Array.isArray(p.data)?p.data:[];
    cache.teams[type]=new Map(rows.map(row=>[clean(type==='club'?row.club_id:row.nation_id),row]));
    return cache.teams[type];
  }

  function card(row){
    const name=clean(row.manager?.full_name)||clean(row.manager?.manager_name)||clean(row.manager_id)||`SM #${clean(row.sm_manager_id)}`||'Manager';
    const team=clean(row.team?.name)||'Team non disponibile';
    const image=clean(row.team?.image_url);
    const ended=!!clean(row.end_date);
    return `<article class="manager-card${ended?' manager-ended':''}"><div class="manager-avatar">${esc(initials(name))}</div><div class="manager-main"><small>${esc(row.manager_id||(`SM #${clean(row.sm_manager_id)}`))}</small><h3>${esc(name)}</h3><div class="manager-team">${/^https?:\/\//i.test(image)?`<img src="${esc(image)}" alt="${esc(team)}" loading="lazy">`:''}<span>${esc(team)}</span></div><div class="manager-date">DAL ${esc(fmtDate(row.start_date))}${ended?` · AL ${esc(fmtDate(row.end_date))}`:' · ATTIVO'}</div></div></article>`;
  }

  async function paint(type){
    if(!isManagers()) return;
    active=type;
    ensureStyle();
    const view=document.querySelector('main.view');
    if(!view) return;
    const scopeTabs=`<div class="managers-scope-tabs"><button class="managers-scope-tab ${scope==='imc_active'?'active':''}" data-s="imc_active" type="button">IMC Active</button><button class="managers-scope-tab ${scope==='ext_active'?'active':''}" data-s="ext_active" type="button">EXT Active</button><button class="managers-scope-tab ${scope==='imc_career'?'active':''}" data-s="imc_career" type="button">IMC Career</button></div>`;
    const tabs=`<div class="managers-tabs"><button class="managers-tab ${type==='club'?'active':''}" data-t="club" type="button">CLUB</button><button class="managers-tab ${type==='national_team'?'active':''}" data-t="national_team" type="button">NATIONAL TEAM</button></div>`;
    const bind=()=>{
      view.querySelectorAll('.managers-tab').forEach(b=>b.onclick=()=>paint(b.dataset.t));
      view.querySelectorAll('.managers-scope-tab').forEach(b=>b.onclick=()=>{scope=b.dataset.s;paint(active);});
    };
    view.innerHTML=`${head()}<section class="managers-live">${scopeTabs}${tabs}<div class="managers-loading"><i></i><strong>CARICAMENTO MANAGERS</strong><span>CORE · MySQL Aruba</span></div></section>`;
    bind();

    try{
      const teams=await loadTeams(type);
      let rows=[];
      let label='';
      if(scope==='ext_active'){
        const [assignments,managers]=await Promise.all([loadExtAssignments(type),loadExtManagers()]);
        rows=assignments.map(r=>({...r,manager:managers.get(clean(r.sm_manager_id))||null,manager_id:'',end_date:null,team:teams.get(clean(r.team_id))||null}));
        label='EXT Active';
      }else{
        const [assignments,managers]=await Promise.all([loadAssignments(type),loadManagers()]);
        rows=assignments.map(r=>({...r,manager:managers.get(clean(r.manager_id))||null,team:teams.get(clean(type==='club'?r.team_id:r.nation_id))||null}));
        rows=rows.filter(r=>scope==='imc_active'?!clean(r.end_date):!!clean(r.end_date));
        label=scope==='imc_active'?'IMC Active':'IMC Career';
      }
      if(!isManagers()||active!==type) return;
      rows.sort((a,b)=>clean(a.manager?.full_name||a.manager?.manager_name).localeCompare(clean(b.manager?.full_name||b.manager?.manager_name),'it'));
      view.innerHTML=`${head()}<section class="managers-live">${scopeTabs}${tabs}<div class="managers-meta"><strong>${esc(label)}</strong><span>${rows.length} · ${type==='club'?'CLUB':'NATIONAL TEAM'}</span></div>${rows.length?`<div class="managers-grid">${rows.map(card).join('')}</div>`:`<div class="managers-empty"><strong>Nessun manager disponibile</strong></div>`}</section>`;
      bind();
    }catch(e){
      view.innerHTML=`${head()}<section class="managers-live">${scopeTabs}${tabs}<div class="managers-error"><strong>MANAGERS NON DISPONIBILI</strong><span>${esc(e?.message||'gateway_error')}</span></div></section>`;
      bind();
    }
  }

  function render(){if(isManagers()) setTimeout(()=>paint(active),0);}
  window.addEventListener('hashchange',render);
  setTimeout(render,0);
})();
