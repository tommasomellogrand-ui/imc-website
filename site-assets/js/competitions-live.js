(() => {
  'use strict';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const clean=v=>String(v??'').trim();
  const upper=v=>clean(v).toUpperCase();
  const worldId=()=>upper(window.IMC_GAME_WORLD?.gameWorldId||'GW001');
  const gateway='/api/imc-gateway/';
  const groups=['DOMESTIC','INTERNATIONAL','NATIONS'];
  const multiLeagueWorlds=new Set(['GW002','GW003','GW007','GW008']);
  const isMultiLeague=()=>multiLeagueWorlds.has(worldId());
  const meta={DOMESTIC:['DOMESTIC','Domestic competitions'],INTERNATIONAL:['INTERNATIONAL','International competitions'],NATIONS:['NATIONS','National teams']};
  const detailTabs=[['overview','Overview'],['results','Results'],['table','Table'],['schedule','Schedule'],['stats','Stats'],['trophy-room','Trophy Room']];
  const route=()=>location.hash.replace(/^#/,'').split('/').filter(Boolean);
  const isCompetitions=()=>route()[0]==='competitions';
  const selectedGroup=()=>{const g=upper(route()[1]);return groups.includes(g)?g:null;};
  const countrySelection={};
  let cache=null;
  let rawResults=[];

  const pick=(row,names)=>{for(const n of names){const v=row?.[n];if(v!==undefined&&v!==null&&String(v)!=='')return v;}return '';};
  const labelAction=a=>({league:'League',leaguecup:'League Cup',leagueshield:'League Shield',charityshield:'Charity Shield',playoff:'Playoff',smfacup:'SMFA Champions',smfashield:'SMFA Shield',supercup:'SMFA Super Cup',interqualifier:'World Cup Qualifier',worldcup:'World Cup'})[clean(a).toLowerCase()]||clean(a).replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  const iconFor=a=>{const k=clean(a).toLowerCase();if(k==='league')return '1';if(k==='interqualifier'||k==='worldcup')return '◎';if(k==='charityshield'||k==='leagueshield')return '◈';if(['smfacup','smfashield','supercup','leaguecup'].includes(k))return '♜';return '◆';};
  const part=v=>encodeURIComponent(clean(v).toLowerCase());

  function style(){
    if(document.getElementById('imc-competitions-live-style'))return;
    const s=document.createElement('style');s.id='imc-competitions-live-style';s.textContent=`
      .competitions-live{padding:2px 0 34px}.competitions-intro{margin:0 0 16px;color:#8194a8;font-size:11px;line-height:1.5}.competition-groups,.competition-list{display:grid;gap:12px}.competition-group-card,.competition-item,.competition-shell-head,.competition-tab-panel,.competition-results-block{border:1px solid rgba(255,255,255,.14);border-radius:20px;background:radial-gradient(circle at 100% 0,rgba(48,111,166,.18),transparent 42%),linear-gradient(155deg,#0c2238,#071725 76%);box-shadow:0 16px 32px rgba(0,0,0,.18)}.competition-group-card{position:relative;overflow:hidden;min-height:176px;padding:18px;text-decoration:none;color:inherit}.competition-group-kicker{color:#d6a149;font-size:9px;font-weight:900;letter-spacing:.16em}.competition-group-card h3{margin:7px 0 4px;font-size:24px}.competition-group-sub{color:#788ca1;font-size:10px;font-weight:800;letter-spacing:.08em}.competition-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.competition-action,.competition-chip{padding:6px 9px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(255,255,255,.035);color:#9eb0c2;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.competition-group-arrow{position:absolute;right:16px;bottom:16px;width:38px;height:38px;border:1px solid rgba(255,255,255,.13);border-radius:50%;display:grid;place-items:center;color:#d6a149;font-size:24px}.competition-country-wrap{margin:0 0 16px;overflow:hidden}.competition-country-label{display:block;margin:0 2px 8px;color:#7f93a8;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.competition-country-filter{display:flex;gap:8px;overflow-x:auto;padding:0 2px 7px;scrollbar-width:none}.competition-country-filter::-webkit-scrollbar{display:none}.competition-country-btn{flex:0 0 auto;min-width:82px;height:52px;padding:0 18px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.025);color:#93a5b7;font:900 10px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}.competition-country-btn.active{background:linear-gradient(145deg,#d7a24c,#b47a22);color:#06111f}.competition-detail-head{display:flex;justify-content:space-between;align-items:center;margin:0 2px 12px}.competition-detail-head strong{font-size:17px}.competition-detail-head span{color:#d6a149;font-size:10px;font-weight:900}.competition-item{display:grid;grid-template-columns:68px minmax(0,1fr) 42px;gap:12px;align-items:center;padding:16px;text-decoration:none;color:inherit}.competition-icon{width:68px;height:68px;border:1px solid rgba(214,161,73,.35);border-radius:16px;display:grid;place-items:center;color:#d6a149;font-size:30px;font-weight:900}.competition-item h3{margin:0;font-size:20px;line-height:1.05}.competition-item-sub{margin-top:5px;color:#d6a149;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.competition-item-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.competition-open{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.13);display:grid;place-items:center;color:#d6a149;font-size:24px}.competition-shell-head{display:grid;grid-template-columns:52px 1fr 52px;gap:12px;align-items:center;padding:14px;border-color:rgba(214,161,73,.28)}.competition-shell-back,.competition-shell-trophy{width:52px;height:52px;border:1px solid rgba(255,255,255,.14);border-radius:15px;display:grid;place-items:center;color:#d6a149;text-decoration:none;font-size:24px}.competition-shell-copy small{display:block;color:#d6a149;font-size:9px;font-weight:900;letter-spacing:.12em}.competition-shell-copy h3{margin:4px 0 3px;font-size:21px;line-height:1.05}.competition-shell-copy p{margin:0;color:#8fa1b4;font-size:10px;font-weight:700}.competition-detail-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:14px;padding:5px;border:1px solid rgba(255,255,255,.14);border-radius:17px;background:rgba(4,14,24,.68)}.competition-detail-tab{min-height:46px;padding:0 6px;border-radius:12px;display:grid;place-items:center;text-align:center;text-decoration:none;color:#8195aa;font-size:9px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.competition-detail-tab.active{background:linear-gradient(145deg,#d7a24c,#b47a22);color:#06111f}.competition-tab-panel{margin-top:14px;min-height:260px;padding:22px;display:grid;place-items:center;text-align:center}.competition-results{display:grid;gap:12px;margin-top:14px}.competition-results-block{overflow:hidden}.competition-results-head{padding:12px 15px;border-bottom:1px solid rgba(255,255,255,.1);color:#d6a149;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.competition-result-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;padding:14px 15px;border-bottom:1px solid rgba(255,255,255,.08)}.competition-result-row:last-child{border-bottom:0}.competition-result-team{font-size:12px;font-weight:850;line-height:1.2}.competition-result-team.away{text-align:right}.competition-result-score{min-width:58px;text-align:center;font-size:17px;font-weight:950;color:#fff}.competition-result-meta{grid-column:1/-1;margin-top:-5px;color:#72869a;font-size:8px;font-weight:800;text-align:center}.competition-empty,.competitions-loading,.competitions-error{min-height:230px;border:1px solid rgba(255,255,255,.14);border-radius:20px;background:linear-gradient(145deg,rgba(12,30,48,.96),rgba(5,15,26,.96));display:grid;place-items:center;align-content:center;gap:8px;text-align:center;color:#90a1b4;padding:20px}.competitions-loading i{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.14);border-top-color:#d6a149;animation:compSpin .8s linear infinite}@keyframes compSpin{to{transform:rotate(360deg)}}@media(min-width:760px){.competition-groups{grid-template-columns:repeat(3,minmax(0,1fr))}.competition-list{grid-template-columns:repeat(2,minmax(0,1fr))}.competition-detail-tabs{grid-template-columns:repeat(6,minmax(0,1fr))}}
    `;document.head.appendChild(s);
  }
  const head=(label='Competitions',back='#/overview')=>`<div class="section-head"><div><small>${esc(worldId())}</small><h2>${esc(label)}</h2></div><a class="back-btn" href="${back}" aria-label="Indietro">←</a></div>`;

  async function readRepo(repo){
    const rows=[];let offset=0;const limit=1000;
    while(true){const u=new URL(gateway,location.origin);u.searchParams.set('game_world_id',worldId());u.searchParams.set('repository',repo);u.searchParams.set('limit',String(limit));u.searchParams.set('offset',String(offset));const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/json'}});const p=await r.json().catch(()=>({ok:false,error:'invalid_json'}));if(!r.ok||!p?.ok)throw new Error(p?.error||`HTTP ${r.status}`);const batch=Array.isArray(p.data)?p.data:[];rows.push(...batch);offset+=batch.length;const total=Number(p?.pagination?.total||rows.length);if(!batch.length||offset>=total||batch.length<limit)break;}return rows;
  }

  async function load(){
    if(cache)return cache;
    const [results,schedule]=await Promise.all([readRepo('results').catch(()=>[]),readRepo('schedule').catch(()=>[])]);
    rawResults=results;
    const all=[...results.map(r=>({...r,__source:'results'})),...schedule.map(r=>({...r,__source:'schedule'}))];
    const out={DOMESTIC:new Map(),INTERNATIONAL:new Map(),NATIONS:new Map()};
    for(const r of all){
      const g=upper(r.competition_group),a=clean(r.sm_action);if(!out[g]||!a)continue;
      const division=clean(r.sm_division),country=upper(r.sm_country),competitionKey=clean(r.competition_key),isLeague=a.toLowerCase()==='league';
      const countryKey=isMultiLeague()&&country?`|${country}`:'';
      const key=isLeague?`${a.toLowerCase()}${countryKey}|${division||'__NO_DIVISION__'}`:`${a.toLowerCase()}${countryKey}`;
      if(!out[g].has(key))out[g].set(key,{action:a,division:isLeague?division:'',country:isMultiLeague()?country:'',competitionKeys:new Set(),results:0,schedule:0});
      const item=out[g].get(key);if(competitionKey)item.competitionKeys.add(competitionKey);if(r.__source==='results')item.results++;else item.schedule++;
    }
    cache=out;return out;
  }

  function itemBaseHref(item,group){const p=['#/competitions',group.toLowerCase(),part(item.action)];if(isMultiLeague()&&item.country)p.push(part(item.country));if(clean(item.action).toLowerCase()==='league')p.push(part(item.division||'no-division'));return p.join('/');}
  function detailCard(item,group){const total=item.results+item.schedule,isLeague=clean(item.action).toLowerCase()==='league',division=clean(item.division),title=isLeague&&division?`${labelAction(item.action)} · Division ${division}`:labelAction(item.action);return `<a class="competition-item" href="${itemBaseHref(item,group)}/overview"><div class="competition-icon">${esc(iconFor(item.action))}</div><div><h3>${esc(title)}</h3><div class="competition-item-sub">${esc(group)}</div><div class="competition-item-meta"><span class="competition-chip">${esc(item.action)}</span>${item.country?`<span class="competition-chip">${esc(item.country)}</span>`:''}${isLeague&&division?`<span class="competition-chip">DIVISION ${esc(division)}</span>`:''}<span class="competition-chip">${total.toLocaleString('it-IT')} match</span></div></div><span class="competition-open">›</span></a>`;}

  function detailRoute(){
    const p=route();if(p.length<4)return null;const group=upper(p[1]);if(!groups.includes(group))return null;
    const action=decodeURIComponent(p[2]||''),isLeague=clean(action).toLowerCase()==='league';let idx=3,country='',division='',tab='overview';
    if(isMultiLeague()&&p.length>idx+1&&!detailTabs.some(([k])=>k===clean(p[idx]).toLowerCase())){country=upper(decodeURIComponent(p[idx]||''));idx++;}
    if(isLeague){division=decodeURIComponent(p[idx]||'');idx++;}
    tab=clean(p[idx]||'overview').toLowerCase();if(!detailTabs.some(([k])=>k===tab))tab='overview';
    return {group,action,country,division:isLeague&&division!=='no-division'?division:'',tab};
  }
  function findItem(data,d){const values=[...data[d.group].values()];return values.find(x=>clean(x.action).toLowerCase()===clean(d.action).toLowerCase()&&(!isMultiLeague()||upper(x.country)===upper(d.country))&&(clean(d.action).toLowerCase()!=='league'||clean(x.division).toLowerCase()===clean(d.division).toLowerCase()))||null;}

  const rowDate=r=>clean(pick(r,['match_date','fixture_date','date','sm_date','played_at','kickoff_date']));
  const rowDay=r=>clean(pick(r,['sm_matchday','matchday','match_day','round','sm_round','turn','match_number']));
  const homeName=r=>clean(pick(r,['home_name','home_team_name','home_club_name','home_team','home']));
  const awayName=r=>clean(pick(r,['away_name','away_team_name','away_club_name','away_team','away']));
  const homeScore=r=>pick(r,['home_score','home_goals','score_home','home_result']);
  const awayScore=r=>pick(r,['away_score','away_goals','score_away','away_result']);
  const scoreText=r=>{const hs=homeScore(r),as=awayScore(r);if(hs!==''&&as!=='')return `${hs} - ${as}`;return clean(pick(r,['score','result','final_score','result_score']))||'—';};
  function dateLabel(v){if(!v)return 'RISULTATI';const d=new Date(v);if(Number.isNaN(d.getTime()))return v;return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();}
  function resultsPanel(item){
    const keys=new Set([...(item?.competitionKeys||[])].map(clean).filter(Boolean));
    const rows=rawResults.filter(r=>keys.has(clean(r.competition_key)));
    rows.sort((a,b)=>{const da=new Date(rowDate(a)||0).getTime(),db=new Date(rowDate(b)||0).getTime();if(db!==da)return db-da;return Number(rowDay(b)||0)-Number(rowDay(a)||0);});
    if(!rows.length)return `<div class="competition-empty"><strong>NESSUN RISULTATO</strong><span>Nessun record del repository Results collegato alla Competition Key selezionata.</span></div>`;
    const buckets=new Map();for(const r of rows){const key=`${rowDate(r)}|${rowDay(r)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(r);}
    return `<div class="competition-results">${[...buckets.entries()].map(([k,rs])=>{const [date,day]=k.split('|');const title=[dateLabel(date),day?`MATCH ${day}`:''].filter(Boolean).join(' · ');return `<section class="competition-results-block"><div class="competition-results-head">${esc(title)}</div>${rs.map(r=>`<div class="competition-result-row"><div class="competition-result-team">${esc(homeName(r)||'Home')}</div><div class="competition-result-score">${esc(scoreText(r))}</div><div class="competition-result-team away">${esc(awayName(r)||'Away')}</div>${clean(r.competition_key)?`<div class="competition-result-meta">${esc(r.competition_key)}</div>`:''}</div>`).join('')}</section>`;}).join('')}</div>`;
  }

  function detailPage(d,item){
    const isLeague=clean(d.action).toLowerCase()==='league',title=isLeague&&d.division?`${labelAction(d.action)} · Division ${d.division}`:labelAction(d.action),subtitle=[d.group,d.country||null,isLeague&&d.division?`Div ${d.division}`:null].filter(Boolean).join(' · ');
    const base=['#/competitions',d.group.toLowerCase(),part(d.action)];if(isMultiLeague()&&d.country)base.push(part(d.country));if(isLeague)base.push(part(d.division||'no-division'));const baseHref=base.join('/');
    const tabs=detailTabs.map(([k,l])=>`<a class="competition-detail-tab ${k===d.tab?'active':''}" href="${baseHref}/${k}">${l}</a>`).join('');
    const content=d.tab==='results'?resultsPanel(item):`<div class="competition-tab-panel"><div><strong>${esc(detailTabs.find(([k])=>k===d.tab)?.[1]||'Overview')}</strong><p>Sezione pronta per i dati della competizione selezionata.</p></div></div>`;
    return `${head('Competitions',`#/competitions/${d.group.toLowerCase()}`)}<section class="competitions-live"><div class="competition-shell-head"><a class="competition-shell-back" href="#/competitions/${d.group.toLowerCase()}" aria-label="Indietro">←</a><div class="competition-shell-copy"><small>${esc(worldId())}</small><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div><div class="competition-shell-trophy">♜</div></div><nav class="competition-detail-tabs">${tabs}</nav>${content}</section>`;
  }

  function renderCountryFilter(group,actions){if(!isMultiLeague())return {html:'',actions};const countries=[...new Set(actions.map(a=>upper(a.country)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'en'));if(!countries.length)return {html:'',actions};let selected=countrySelection[group];if(!selected||!countries.includes(selected))selected=countries[0];countrySelection[group]=selected;return {html:`<div class="competition-country-wrap"><span class="competition-country-label">Country</span><div class="competition-country-filter" data-country-group="${esc(group)}">${countries.map(c=>`<button type="button" class="competition-country-btn ${c===selected?'active':''}" data-country="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`,actions:actions.filter(a=>upper(a.country)===selected)};}
  function bindCountryFilter(group){document.querySelectorAll(`.competition-country-filter[data-country-group="${group}"] .competition-country-btn`).forEach(btn=>btn.addEventListener('click',()=>{countrySelection[group]=upper(btn.dataset.country);paint();}));}

  async function paint(){
    if(!isCompetitions())return;style();const view=document.querySelector('main.view');if(!view)return;
    view.innerHTML=`${head()}<section class="competitions-live"><div class="competitions-loading"><i></i><strong>CARICAMENTO COMPETITIONS</strong><span>Gateway · MySQL Aruba</span></div></section>`;
    try{
      const data=await load();if(!isCompetitions())return;const d=detailRoute();if(d){view.innerHTML=detailPage(d,findItem(data,d));return;}
      const group=selectedGroup();
      if(group){const all=[...data[group].values()].sort((a,b)=>upper(a.country).localeCompare(upper(b.country),'en')||labelAction(a.action).localeCompare(labelAction(b.action),'it')||clean(a.division).localeCompare(clean(b.division),'it',{numeric:true}));const filtered=renderCountryFilter(group,all),actions=filtered.actions;view.innerHTML=`${head(group,'#/competitions')}<section class="competitions-live">${filtered.html}<div class="competition-detail-head"><strong>${group}</strong><span>${actions.length}</span></div>${actions.length?`<div class="competition-list">${actions.map(a=>detailCard(a,group)).join('')}</div>`:`<div class="competition-empty"><strong>NESSUNA COMPETIZIONE</strong></div>`}</section>`;bindCountryFilter(group);return;}
      const cards=groups.map(g=>{const actions=[...data[g].values()];return `<a class="competition-group-card" href="#/competitions/${g.toLowerCase()}"><div class="competition-group-kicker">${esc(worldId())}</div><h3>${meta[g][0]}</h3><div class="competition-group-sub">${meta[g][1]}</div>${actions.length?`<div class="competition-actions">${[...new Set(actions.map(a=>a.action))].map(a=>`<span class="competition-action">${esc(a)}</span>`).join('')}</div>`:`<div class="competition-empty">Nessuna SM Action disponibile</div>`}<span class="competition-group-arrow">›</span></a>`;}).join('');
      view.innerHTML=`${head()}<section class="competitions-live"><p class="competitions-intro">Competizioni organizzate per macrogruppo e SM Action presenti nei repository del Game World.</p><div class="competition-groups">${cards}</div></section>`;
    }catch(e){view.innerHTML=`${head()}<section class="competitions-live"><div class="competitions-error"><strong>COMPETITIONS NON DISPONIBILI</strong><span>${esc(e?.message||'gateway_error')}</span></div></section>`;}
  }
  function render(){if(isCompetitions())setTimeout(paint,0)}window.addEventListener('hashchange',render);setTimeout(render,0);
})();