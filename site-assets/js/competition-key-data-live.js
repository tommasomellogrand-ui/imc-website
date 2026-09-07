(() => {
  'use strict';

  const clean=v=>String(v??'').trim();
  const upper=v=>clean(v).toUpperCase();
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const worldId=()=>upper(window.IMC_GAME_WORLD?.gameWorldId||'GW001');
  const gateway='/api/imc-gateway/';
  const multi=new Set(['GW002','GW003','GW007','GW008']);
  const metrics=[['goals','Goals','goals'],['assists','Assists','assists'],['rating','Rating','avg_rating'],['mom','MOM','mom'],['yellow','Yellow','yellow_cards'],['red','Red','red_cards']];
  let activeMetric='goals';
  let renderToken=0;

  const parts=()=>location.hash.replace(/^#/,'').split('/').filter(Boolean);
  function context(){
    const p=parts();
    if(p[0]!=='competitions'||p.length<4)return null;
    const group=upper(decodeURIComponent(p[1]||''));
    const action=clean(decodeURIComponent(p[2]||'')).toLowerCase();
    let i=3,country='',division='';
    const isLeague=action==='league';
    const tabs=new Set(['overview','results','table','schedule','stats','trophy-room']);
    if(multi.has(worldId())&&p[i]&&!tabs.has(clean(p[i]).toLowerCase())){country=upper(decodeURIComponent(p[i]));i++;}
    if(isLeague&&p[i]&&!tabs.has(clean(p[i]).toLowerCase())){division=decodeURIComponent(p[i]);if(division==='no-division')division='';i++;}
    const tab=clean(p[i]||'overview').toLowerCase();
    if(!['results','schedule','stats'].includes(tab))return null;
    const keyParts=[worldId()];
    if(country)keyParts.push(country);
    keyParts.push(group,action);
    if(division)keyParts.push(division);
    return {group,action,country,division,tab,competitionKey:keyParts.join('|')};
  }

  async function read(repo,key){
    const rows=[];let offset=0;const limit=1000;
    while(true){
      const u=new URL(gateway,location.origin);
      u.searchParams.set('game_world_id',worldId());
      u.searchParams.set('repository',repo);
      u.searchParams.set('filter_competition_key',key);
      u.searchParams.set('limit',String(limit));
      u.searchParams.set('offset',String(offset));
      const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/json'}});
      const j=await r.json().catch(()=>({ok:false,error:'invalid_json'}));
      if(!r.ok||!j?.ok)throw new Error(j?.error||`HTTP ${r.status}`);
      const batch=Array.isArray(j.data)?j.data:[];rows.push(...batch);offset+=batch.length;
      const total=Number(j?.pagination?.total||rows.length);
      if(!batch.length||offset>=total||batch.length<limit)break;
    }
    return rows;
  }

  const pick=(r,names)=>{for(const n of names){const v=r?.[n];if(v!==undefined&&v!==null&&String(v)!=='')return v;}return '';};
  const rowDate=r=>clean(pick(r,['match_date','fixture_date','date','sm_date','played_at','kickoff_date']));
  const rowTime=r=>clean(pick(r,['match_time','fixture_time','time','kickoff_time','sm_time']));
  const rowDay=r=>clean(pick(r,['sm_matchday','matchday','match_day','round','sm_round','turn','match_number']));
  const home=r=>clean(pick(r,['home_name','home_team_name','home_club_name','home_team','home']))||'Home';
  const away=r=>clean(pick(r,['away_name','away_team_name','away_club_name','away_team','away']))||'Away';
  const score=r=>{const h=pick(r,['home_score','home_goals','score_home','home_result']),a=pick(r,['away_score','away_goals','score_away','away_result']);return h!==''&&a!==''?`${h} - ${a}`:clean(pick(r,['score','result','final_score','result_score']))||'—';};
  const dateLabel=v=>{if(!v)return 'MATCH';const d=new Date(v);return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();};

  function matchesHtml(rows,isSchedule,key){
    if(!rows.length)return `<div class="competition-empty"><strong>${isSchedule?'NESSUNA SCHEDULE':'NESSUN RISULTATO'}</strong><span>Nessun record con Competition Key ${esc(key)}.</span></div>`;
    rows.sort((a,b)=>new Date(rowDate(a)||0)-new Date(rowDate(b)||0)||Number(rowDay(a)||0)-Number(rowDay(b)||0));
    const buckets=new Map();
    for(const r of rows){const k=`${rowDate(r)}|${rowDay(r)}`;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(r);}
    return `<div class="competition-results">${[...buckets.entries()].map(([k,rs])=>{const [date,day]=k.split('|');return `<section class="competition-results-block"><div class="competition-results-head">${esc([dateLabel(date),day?`MATCH ${day}`:''].filter(Boolean).join(' · '))}</div>${rs.map(r=>`<div class="competition-result-row"><div class="competition-result-team">${esc(home(r))}</div><div class="competition-result-score">${esc(isSchedule?(rowTime(r)||'VS'):score(r))}</div><div class="competition-result-team away">${esc(away(r))}</div></div>`).join('')}</section>`;}).join('')}</div>`;
  }

  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0;};
  function statsTable(rows,metric){
    const def=metrics.find(x=>x[0]===metric),field=def[2],label=def[1];
    const ranked=rows.map(r=>({r,value:num(r[field])})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value||clean(a.r.player_name).localeCompare(clean(b.r.player_name),'it'));
    if(!ranked.length)return `<div class="competition-stats-empty"><div><strong>NESSUNA STATISTICA</strong><br><span>Nessun valore ${esc(label)} maggiore di zero per questa Competition Key.</span></div></div>`;
    return `<div class="competition-stats-table"><div class="competition-stats-head"><span>Pos</span><span>Player / Club</span><span style="text-align:right">${esc(label)}</span></div>${ranked.map((x,i)=>{const r=x.r,name=clean(r.player_name)||`Player ${clean(r.sm_player_id)}`,initials=name.split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase(),val=metric==='rating'?x.value.toFixed(2):String(x.value);return `<div class="competition-stats-row"><div class="competition-stats-pos">${i+1}</div><div class="competition-stats-person"><div class="competition-stats-avatar fallback">${esc(initials||'P')}</div><div><div class="competition-stats-name">${esc(name)}</div><div class="competition-stats-club">${esc(clean(r.club_name)||'—')}</div>${r.appearances!==null&&r.appearances!==undefined?`<div class="competition-stats-apps">${esc(r.appearances)} presenze</div>`:''}</div></div><div class="competition-stats-value ${metric==='yellow'?'yellow':metric==='red'?'red':''}">${esc(val)}</div></div>`;}).join('')}</div>`;
  }

  function statsHtml(rows){return `<div class="competition-stats-live"><div class="competition-stats-tabs">${metrics.map(([k,l])=>`<button type="button" class="competition-stats-tab ${k===activeMetric?'active':''}" data-key-metric="${k}">${l}</button>`).join('')}</div><div class="competition-stats-panels">${metrics.map(([k])=>`<section class="competition-stats-panel ${k===activeMetric?'active':''}" data-key-panel="${k}">${statsTable(rows,k)}</section>`).join('')}</div></div>`;}
  function bindStats(host){host.querySelectorAll('[data-key-metric]').forEach(b=>b.addEventListener('click',()=>{activeMetric=b.dataset.keyMetric||'goals';host.querySelectorAll('[data-key-metric]').forEach(x=>x.classList.toggle('active',x.dataset.keyMetric===activeMetric));host.querySelectorAll('[data-key-panel]').forEach(x=>x.classList.toggle('active',x.dataset.keyPanel===activeMetric));}));}

  async function render(){
    const ctx=context();if(!ctx)return;const token=++renderToken;
    await new Promise(r=>setTimeout(r,180));if(token!==renderToken)return;
    let host=document.querySelector('.competition-tab-panel, .competition-stats-live');if(!host)return;
    try{
      if(ctx.tab==='results'||ctx.tab==='schedule'){
        const rows=await read(ctx.tab==='results'?'results':'schedule',ctx.competitionKey);if(token!==renderToken)return;
        host=document.querySelector('.competition-tab-panel, .competition-stats-live');if(!host)return;
        host.classList.remove('competition-stats-live');host.innerHTML=matchesHtml(rows,ctx.tab==='schedule',ctx.competitionKey);
      }else{
        const rows=await read('sm_player_stats',ctx.competitionKey);if(token!==renderToken)return;
        host=document.querySelector('.competition-tab-panel, .competition-stats-live');if(!host)return;
        host.innerHTML=statsHtml(rows);bindStats(host);
      }
    }catch(e){if(token!==renderToken)return;host=document.querySelector('.competition-tab-panel, .competition-stats-live');if(host)host.innerHTML=`<div class="competition-empty"><strong>DATI NON DISPONIBILI</strong><span>${esc(e?.message||'gateway_error')}</span></div>`;}
  }

  window.addEventListener('hashchange',render);
  window.addEventListener('load',render);
  setTimeout(render,0);
})();