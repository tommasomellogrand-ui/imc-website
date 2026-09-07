(() => {
  'use strict';

  const clean=v=>String(v??'').trim();
  const upper=v=>clean(v).toUpperCase();
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const worldId=()=>upper(window.IMC_GAME_WORLD?.gameWorldId||'GW001');
  const gateway='/api/imc-gateway/';
  const multiLeagueWorlds=new Set(['GW002','GW003','GW007','GW008']);
  const isMultiLeague=()=>multiLeagueWorlds.has(worldId());
  const tabs=[
    ['goals','Goals',['goals','goal','goals_total','total_goals']],
    ['assists','Assists',['assists','assist','assists_total','total_assists']],
    ['rating','Rating',['rating','avg_rating','average_rating','rating_avg']],
    ['mom','MOM',['mom','motm','man_of_match','man_of_match_count','mom_count']],
    ['yellow','Yellow',['yellow','yellow_cards','yellow_card','cards_yellow']],
    ['red','Red',['red','red_cards','red_card','cards_red']]
  ];
  let activeMetric='goals';
  let lastRoute='';
  const dataCache=new Map();

  const pick=(row,names)=>{for(const n of names){const v=row?.[n];if(v!==undefined&&v!==null&&String(v)!=='')return v;}return '';};
  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0;};
  const route=()=>location.hash.replace(/^#/,'').split('/').filter(Boolean);

  function parseCompetitionRoute(){
    const p=route();
    if(p[0]!=='competitions'||p[p.length-1]!=='stats'||p.length<4)return null;
    const group=upper(p[1]);
    const action=decodeURIComponent(p[2]||'');
    const isLeague=clean(action).toLowerCase()==='league';
    let idx=3,country='',division='';
    if(isMultiLeague()&&p.length>idx+1&&p[idx]!=='stats'){
      country=upper(decodeURIComponent(p[idx]||''));
      idx++;
    }
    if(isLeague&&p[idx]&&p[idx]!=='stats'){
      division=decodeURIComponent(p[idx]||'');
      if(division==='no-division')division='';
    }
    return {group,action,country,division};
  }

  async function readRepo(repo){
    const rows=[];let offset=0;const limit=1000;
    while(true){
      const u=new URL(gateway,location.origin);
      u.searchParams.set('game_world_id',worldId());
      u.searchParams.set('repository',repo);
      u.searchParams.set('limit',String(limit));
      u.searchParams.set('offset',String(offset));
      const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/json'}});
      const p=await r.json().catch(()=>({ok:false,error:'invalid_json'}));
      if(!r.ok||!p?.ok)throw new Error(p?.error||`HTTP ${r.status}`);
      const batch=Array.isArray(p.data)?p.data:[];
      rows.push(...batch);offset+=batch.length;
      const total=Number(p?.pagination?.total||rows.length);
      if(!batch.length||offset>=total||batch.length<limit)break;
    }
    return rows;
  }

  async function competitionKeys(ctx){
    const cacheKey=`keys:${worldId()}:${ctx.group}:${ctx.action}:${ctx.country}:${ctx.division}`;
    if(dataCache.has(cacheKey))return dataCache.get(cacheKey);
    const [results,schedule]=await Promise.all([readRepo('results').catch(()=>[]),readRepo('schedule').catch(()=>[])]);
    const keys=new Set();
    for(const r of [...results,...schedule]){
      if(clean(r.sm_action).toLowerCase()!==clean(ctx.action).toLowerCase())continue;
      if(isMultiLeague()&&upper(r.sm_country)!==upper(ctx.country))continue;
      if(clean(ctx.action).toLowerCase()==='league'&&clean(r.sm_division).toLowerCase()!==clean(ctx.division).toLowerCase())continue;
      const k=clean(r.competition_key);if(k)keys.add(k);
    }
    dataCache.set(cacheKey,keys);
    return keys;
  }

  async function statsRows(ctx){
    const cacheKey=`stats:${worldId()}`;
    let rows=dataCache.get(cacheKey);
    if(!rows){rows=await readRepo('sm_player_stats');dataCache.set(cacheKey,rows);}
    const keys=await competitionKeys(ctx);
    return rows.filter(r=>keys.has(clean(r.competition_key)));
  }

  function ensureStyle(){
    if(document.getElementById('imc-competition-stats-style'))return;
    const s=document.createElement('style');
    s.id='imc-competition-stats-style';
    s.textContent=`
      .competition-stats-live{margin-top:14px}
      .competition-stats-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:6px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(4,14,24,.68)}
      .competition-stats-tab{min-height:48px;border:0;border-radius:13px;background:transparent;color:#8da0b5;font:900 9px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}
      .competition-stats-tab.active{background:linear-gradient(145deg,#d7a24c,#b47a22);color:#06111f;box-shadow:0 10px 26px rgba(214,161,73,.18)}
      .competition-stats-panels{margin-top:12px}
      .competition-stats-panel{display:none}
      .competition-stats-panel.active{display:block}
      .competition-stats-table{border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;background:radial-gradient(circle at 100% 0,rgba(48,111,166,.18),transparent 42%),linear-gradient(155deg,#0c2238,#071725 76%)}
      .competition-stats-head,.competition-stats-row{display:grid;grid-template-columns:32px minmax(0,1fr) 70px;align-items:center;gap:10px}
      .competition-stats-head{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.1);color:#71869a;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .competition-stats-row{min-height:74px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      .competition-stats-row:last-child{border-bottom:0}
      .competition-stats-pos{font-size:14px;font-weight:900;color:#d6a149}
      .competition-stats-person{display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;min-width:0}
      .competition-stats-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06)}
      .competition-stats-avatar.fallback{display:grid;place-items:center;color:#d6a149;font-size:12px;font-weight:900}
      .competition-stats-name{font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .competition-stats-club{margin-top:3px;color:#8295aa;font-size:9px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .competition-stats-apps{margin-top:2px;color:#60758a;font-size:8px;font-weight:700}
      .competition-stats-value{justify-self:end;min-width:58px;padding:10px 7px;border-radius:13px;background:rgba(214,161,73,.14);color:#fff;text-align:center;font-size:15px;font-weight:950}
      .competition-stats-value.yellow{background:#e1aa23;color:#07111d}.competition-stats-value.red{background:#b72f3d}
      .competition-stats-empty{min-height:220px;border:1px solid rgba(255,255,255,.14);border-radius:20px;display:grid;place-items:center;text-align:center;color:#8da0b5;background:linear-gradient(155deg,#0c2238,#071725 76%);padding:20px}
      .competition-stats-loading{min-height:180px;display:grid;place-items:center;color:#8da0b5;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      @media(min-width:760px){.competition-stats-tabs{grid-template-columns:repeat(6,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  function playerName(r){return clean(pick(r,['player_name','name','sm_player_name','player','display_name']))||`Player ${clean(pick(r,['player_id','sm_player_id']))}`;}
  function clubName(r){return clean(pick(r,['club_name','team_name','sm_club_name','club','team']))||'—';}
  function appearances(r){return clean(pick(r,['appearances','apps','matches','played','presences','appearances_total']));}
  function playerImage(r){return clean(pick(r,['player_image_url','image_url','photo_url','player_photo','avatar_url']));}
  function metricValue(r,metric){const def=tabs.find(([k])=>k===metric);return pick(r,def?.[2]||[]);}
  function displayValue(v,metric){if(v===''||v===null||v===undefined)return '0';if(metric==='rating'){const n=num(v);return n?n.toFixed(2):'0.00';}return String(v);}

  function tableHtml(rows,metric){
    const ranked=rows.map(r=>({r,value:num(metricValue(r,metric))}))
      .filter(x=>metric==='rating'?x.value>0:x.value>=0)
      .sort((a,b)=>b.value-a.value||playerName(a.r).localeCompare(playerName(b.r),'it'));
    if(!ranked.length)return `<div class="competition-stats-empty"><div><strong>NESSUNA STATISTICA</strong><br><span>Nessun dato disponibile per questa Competition Key.</span></div></div>`;
    const label=tabs.find(([k])=>k===metric)?.[1]||metric;
    return `<div class="competition-stats-table"><div class="competition-stats-head"><span>Pos</span><span>Player / Club</span><span style="text-align:right">${esc(label)}</span></div>${ranked.map((x,i)=>{
      const r=x.r,name=playerName(r),img=playerImage(r),initials=name.split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
      return `<div class="competition-stats-row"><div class="competition-stats-pos">${i+1}</div><div class="competition-stats-person">${img?`<img class="competition-stats-avatar" src="${esc(img)}" alt="">`:`<div class="competition-stats-avatar fallback">${esc(initials||'P')}</div>`}<div><div class="competition-stats-name">${esc(name)}</div><div class="competition-stats-club">${esc(clubName(r))}</div>${appearances(r)?`<div class="competition-stats-apps">${esc(appearances(r))} presenze</div>`:''}</div></div><div class="competition-stats-value ${metric==='yellow'?'yellow':metric==='red'?'red':''}">${esc(displayValue(metricValue(r,metric),metric))}</div></div>`;
    }).join('')}</div>`;
  }

  function renderTabs(root,rows){
    root.innerHTML=`<div class="competition-stats-tabs">${tabs.map(([k,l])=>`<button type="button" class="competition-stats-tab ${k===activeMetric?'active':''}" data-metric="${k}">${l}</button>`).join('')}</div><div class="competition-stats-panels">${tabs.map(([k])=>`<section class="competition-stats-panel ${k===activeMetric?'active':''}" data-panel="${k}">${tableHtml(rows,k)}</section>`).join('')}</div>`;
    root.querySelectorAll('.competition-stats-tab').forEach(btn=>btn.addEventListener('click',()=>{
      activeMetric=btn.dataset.metric||'goals';
      root.querySelectorAll('.competition-stats-tab').forEach(b=>b.classList.toggle('active',b.dataset.metric===activeMetric));
      root.querySelectorAll('.competition-stats-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===activeMetric));
    }));
  }

  async function paint(){
    const ctx=parseCompetitionRoute();
    if(!ctx)return;
    const host=document.querySelector('.competition-tab-panel, .competition-stats-live');
    if(!host)return;
    ensureStyle();
    host.classList.add('competition-stats-live');
    host.innerHTML=`<div class="competition-stats-tabs">${tabs.map(([k,l])=>`<button type="button" class="competition-stats-tab ${k===activeMetric?'active':''}" data-metric="${k}" disabled>${l}</button>`).join('')}</div><div class="competition-stats-loading">Caricamento stats · MySQL Aruba</div>`;
    try{
      const rows=await statsRows(ctx);
      if(!parseCompetitionRoute())return;
      renderTabs(host,rows);
    }catch(e){
      host.innerHTML=`<div class="competition-stats-empty"><div><strong>STATS NON DISPONIBILI</strong><br><span>${esc(e?.message||'gateway_error')}</span></div></div>`;
    }
  }

  function schedulePaint(){
    const now=location.hash;
    if(now!==lastRoute){activeMetric='goals';lastRoute=now;}
    if(!parseCompetitionRoute())return;
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      const host=document.querySelector('.competition-tab-panel, .competition-stats-live');
      if(host){clearInterval(timer);paint();}
      else if(attempts>30)clearInterval(timer);
    },50);
  }

  window.addEventListener('hashchange',()=>setTimeout(schedulePaint,0));
  window.addEventListener('load',schedulePaint);
  setTimeout(schedulePaint,0);
})();