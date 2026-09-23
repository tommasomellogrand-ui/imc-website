(()=>{'use strict';
const $=id=>document.getElementById(id), worlds={GW001:'Road To History',GW002:'Gold 558',GW003:'Gold 557',GW004:'World League',GW005:'Hall Of Famers',GW006:'Master League World',GW007:'The Four Kingdoms',GW008:'Gold 1',GW009:'Kick Off',GW010:'Game World 010'}, sections={home:'Il Mondo',news:'News feed',competitions:'Competizioni',results:'Risultati',schedule:'Calendario',match_report:'Match Center',standings:'Classifiche',manager:'Manager',player:'Player',club:'Club',archive:'Archivio',transfers:'Trasferimenti'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'Data non disponibile';
const number=v=>Number(v).toLocaleString('it-IT');
let state={world:'GW001',resource:'home',offset:0,search:'',from:'',to:''}, controller=null, total=0;
for(const [id,name] of Object.entries(worlds)) $('world').add(new Option(`${id} · ${name}`,id));
function readURL(){const p=new URLSearchParams(location.search);state={...defaults};for(const k of Object.keys(defaults))if(p.has(k))state[k]=p.get(k);if(!worlds[state.world])state.world='GW001';if(!sections[state.resource])state.resource='home';state.offset=Math.max(0,parseInt(state.offset,10)||0);$('world').value=state.world;for(const k of ['search','from','to'])$(k).value=state[k]}
function urlState(){const p=new URLSearchParams(state);return `${location.pathname}?${p}`}
async function fetchData(params,signal){const response=await fetch(`/nexus/api.php?${new URLSearchParams(params)}`,{signal,cache:'no-store',credentials:'omit'});const data=await response.json();if(!response.ok||!data.ok)throw new Error('Dati momentaneamente non disponibili. Riprova tra poco.');return data}
function meta(r){return `<div class="meta"><span>${esc(date(r.match_date||r.transfer_date))}${r.match_time?' · '+esc(r.match_time.slice(0,5)):''}</span><span>${esc([compName(r.competition_core),r.country_name||r.sm_country,r.imc_season?'S'+r.imc_season:'',r.sm_division,r.competition_group_name,r.competition_stage,r.competition_round].filter(Boolean).join(' · '))}</span></div>`}
function extraScore(r){let notes=[];if(r.penalty_home_score!=null&&r.penalty_away_score!=null)notes.push(`Rigori ${r.penalty_home_score}–${r.penalty_away_score}`);if(r.aggregate_home_score!=null&&r.aggregate_away_score!=null)notes.push(`Aggregato ${r.aggregate_home_score}–${r.aggregate_away_score}`);return notes.join(' · ')}
function entity(core,fallback){const name=core?.name||fallback||'—';let img='';try{const u=new URL(String(core?.image_url||'').replace(/^\/\//,'https://'));if(u.protocol==='https:')img=`<img class="core-crest" src="${esc(u.href)}" alt="" loading="lazy">`}catch{}return `<span class="entity">${img}<span>${esc(name)}</span></span>`}
function fixture(r,schedule=false){return `<div class="fixture"><span>${entity(r.home_core,r.home_name)}</span><span class="score">${schedule?'vs':`${esc(r.home_score??'—')} – ${esc(r.away_score??'—')}`}</span><span class="away">${entity(r.away_core,r.away_name)}</span></div>`}
function card(r){if(state.resource==='transfers')return `<article class="card">${meta(r)}<div class="transfer-head"><span>${esc(r.player_core?[r.player_core.forename,r.player_core.surname].filter(Boolean).join(' '):r.player_name||'Giocatore')}</span><span>${esc(r.amount_text||'—')}</span></div><div class="transfer-route">${entity(r.from_core,r.club_from)} <span>→</span> ${entity(r.to_core,r.club_to)}</div>${r.player_core?`<p class="player-core">${esc([r.player_core.position,r.player_core.rating?'Rating attuale '+r.player_core.rating:'',r.player_core.nationality].filter(Boolean).join(' · '))}</p>`:''}${r.exchange_players?`<details><summary>Contropartite</summary>${structured(r.exchange_players)}</details>`:''}</article>`;return `<article class="card">${meta(r)}${fixture(r,state.resource==='schedule')}<div class="card-bottom"><span>${esc(extraScore(r))}</span>${state.resource!=='schedule'?`<a class="report-link" href="${esc(reportURL(r.sm_fixture_id))}">Apri match report →</a>`:''}</div></article>`}
function playerCard(r){const p=r.player_core;return `<article class="card"><h3>${entity(p?{name:[p.forename,p.surname].filter(Boolean).join(' '),image_url:p.image_url}:null,r.player_name)}</h3><p class="player-core">${esc(p?[p.position,p.rating?'Rating attuale '+p.rating:'',p.nationality].filter(Boolean).join(' · '):'')}</p><p class="player-core">Trasferimento del ${esc(date(r.transfer_date))} · ${entity(r.from_core,r.club_from)} → ${entity(r.to_core,r.club_to)}</p></article>`}
$('openWorldMenu').onclick=()=>$('worldNavigation').showModal();$('closeWorldMenu').onclick=()=>$('worldNavigation').close();
const labels={home:'Casa',away:'Ospiti',home_team:'Squadra di casa',away_team:'Squadra ospite',name:'Nome',player_name:'Giocatore',minute:'Minuto',type:'Tipo',text:'Testo',rating:'Voto',position:'Posizione',goals:'Gol',assists:'Assist',possession:'Possesso',shots:'Tiri',shots_on_target:'Tiri in porta',formation:'Modulo',value:'Valore',team:'Squadra'};
function label(k){return labels[k]||k.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase())}
function reportTeamLabel(value,record,teams){const id=record.sm_team_id??record.sm_club_id;const side=['home','away'].find(s=>id!=null&&String(teams[s+'_sm_club_id']??teams[s+'_sm_team_id'])===String(id));return side?entity(teams[side+'_core'],value):esc(value)}
function structured(v,teams=null){if(v==null)return '<p>Non disponibile</p>';if(typeof v!=='object')return esc(v);if(Array.isArray(v))return v.length?v.map(x=>`<div class="detail-item">${structured(x,teams)}</div>`).join(''):'<p>Nessun dato disponibile</p>';return `<dl>${Object.entries(v).map(([k,x])=>`<dt>${teams&&['home','away','home_team','away_team'].includes(k)?entity(teams[k.startsWith('home')?'home_core':'away_core'],teams[k.startsWith('home')?'home_name':'away_name']):esc(label(k))}</dt><dd>${typeof x==='object'?`<div class="nested">${structured(x,teams)}</div>`:teams&&k==='team_side'&&['home','away'].includes(x)?entity(teams[x+'_core'],teams[x+'_name']):teams&&['team_name','club_name'].includes(k)?reportTeamLabel(x,v,teams):esc(x)}</dd>`).join('')}</dl>`}
function reportURL(id){return 'match.html?'+new URLSearchParams({world:state.world,fixture:String(id),return:location.pathname+location.search+'#dataSection'})}


function countryOptions(codes,competitions){
 const names=new Map();
 for(const c of competitions){
  const code=c.sm_country,view=String(c.nexus_view||'').trim();
  if(!code||!view)continue;
  const name=view.replace(/\s+(?:(?:League\s+)?Div(?:ision)?\.?\s+\d+(?:\s+Playoffs?)?|National Cup|League Cup|Charity Shield)$/i,'').trim();
  if(!name||name===view)continue;
  if(!names.has(code))names.set(code,new Set());
  names.get(code).add(name);
 }
 return codes.map(code=>{const labels=[...(names.get(code)||[])];return [code,labels.length===1?labels[0]:'Paese non configurato'];})
 .sort((a,b)=>a[1].localeCompare(b[1],'it'));
}

function worldMenus(){
const name=worlds[state.world];$('worldTitle').textContent=name;$('menuWorld').textContent=state.world+' · '+name;$('mobileWorldTitle').textContent=state.world+' · '+name;
const menuEntries=[];
const links='';
$('worldMenu').innerHTML=links;$('tabs').innerHTML=links;$('mobileWorldMenu').innerHTML=links;
const icons={manager:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-5 4-7 8-7s6.8 2 8 7"/>',club:'<path d="M12 3 4 7v5c0 5 3.2 8 8 9 4.8-1 8-4 8-9V7Z"/><path d="M8 10h8M9 14h6"/>',home:'<path d="M3 10 12 3l9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',competitions:'<path d="M8 4h8v4c0 3-1.8 5-4 5s-4-2-4-5Z"/><path d="M6 5H4v2c0 2 1.3 3 3 3M18 5h2v2c0 2-1.3 3-3 3M12 13v4M8 21h8M9 17h6v4"/>'};
$('bottomWorldMenu').setAttribute('aria-label','Navigazione mobile · '+state.world+' · '+name);
$('bottomWorldMenu').innerHTML=[['manager','Manager'],['club','Club'],['home','Clubhouse'],['competitions','Competition'],['archive','Trophy Room']].map(([id,title])=>`<a href="${id==='home'?'/nexus/clubhouse.html':'?world='+encodeURIComponent(state.world)+'&resource='+id}" ${id==='home'?'':`data-resource="${id}" aria-current="${state.resource===id}"`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${icons[id]||icons.competitions}</svg><span>${title}</span></a>`).join('');
}
const L=window.NexusLogic;
const defaults={world:'GW001',resource:'home',offset:0,search:'',from:'',to:'',season:'',competition:'',group:'',country:'',tab:'overview',match:'results',metric:'goals',teamType:'clubs',club:'',position:'',rating_min:'',rating_max:'',age_min:'',age_max:'',value_min:'',value_max:'',sort:'rating',player:'',scope:'world',team:'',manager:'',profileTab:'career',opponent:'',round:'',hall:'history',newsType:'',transferView:'in'};
const viewCache=new Map();
async function cached(params,signal){const key=JSON.stringify(params),hit=viewCache.get(key);if(hit&&Date.now()-hit.time<60000)return hit.data;const data=await fetchData(params,signal);if(signal?.aborted)throw new DOMException('Aborted','AbortError');viewCache.set(key,{time:Date.now(),data});return data}
const empty=t=>`<div class="empty">${esc(t)}</div>`;
const url=patch=>'?'+new URLSearchParams({...state,...patch});
const go=(patch,title,cls='text-link')=>`<a class="${cls}" data-go href="${esc(url(patch))}">${title}</a>`;
const select=(name,label,choices)=>`<label>${esc(label)}<select name="${name}">${choices.map(([v,t])=>`<option value="${esc(v)}" ${String(state[name])===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
const input=(name,label,type='search')=>`<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(state[name])}" ${type==='number'?'min="0" step="any"':''}></label>`;
const form=html=>`<form class="view-filters" data-view-form>${html}<button type="submit">Applica filtri ↗</button><button type="button" data-clear-view>Azzera filtri</button></form>`;
const tabs=(key,items)=>`<nav class="hub-tabs" aria-label="${key==='tab'?'Sezioni della competizione':'Filtri della sezione'}">${items.map(([v,t])=>go({[key]:v,offset:0,...(key==='group'?{country:''}:key==='scope'?{club:'',player:''}:{})},esc(t),state[key]===v?'active':'')).join('')}</nav>`;
const seasonSelect=c=>select('season','Stagione',c.seasons.length?c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season+' · '+date(s.imc_season_start_date)+' — '+(s.imc_season_end_date?date(s.imc_season_end_date):'in corso')]):[['','Stagione non configurata']]);
const actionOrder=['league','leaguecup','leagueshield','cup','nationalcup','charityshield','smfacup','smfashield','supercup','worldcup','interqualifier','playoff','friendly'];
const compName=c=>c?.nexus_view||'Nome competizione non configurato';
function compGroup(c){const s=String(c.sm_action_group||c.competition_group||'').toUpperCase();return s.includes('INTERNATIONAL')?'international':s.includes('NATION')?'nations':'domestic'}
function competitionIcon(kind){const shapes={domestic:'<path d="M16 10h32v16c0 13-8 20-16 20S16 39 16 26Z"/><path d="M16 15H8v9c0 9 6 13 12 13m28-22h8v9c0 9-6 13-12 13M32 46v10m-12 0h24"/>',international:'<circle cx="32" cy="32" r="24"/><ellipse cx="32" cy="32" rx="11" ry="24"/><path d="M8 32h48M13 18h38M13 46h38"/>',nations:'<path d="M15 57V9m0 3c12-9 22 9 35 0v25c-13 9-23-9-35 0"/>'};return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[kind]||shapes.domestic)+'</svg>'}
const groups=[['domestic','DOMESTIC','Campionati e coppe nazionali per club'],['international','INTERNATIONAL','Competizioni internazionali per club'],['nations','NATIONS','Competizioni delle nazionali']];
function page(rows,count,label){total=count;$('rows').innerHTML=rows||empty('Nessun dato disponibile per questa selezione.');$('page').textContent=count?`${number(state.offset+1)}–${number(Math.min(state.offset+50,count))} di ${number(count)}`:'0';$('previous').disabled=state.offset===0;$('next').disabled=state.offset+50>=count;$('status').textContent=`${number(count)} ${label} · ${state.world}`;document.querySelector('.pagination').hidden=count<=50}
function table(rows){const rank=L.standings(rows);return rank.length?`<div class="hub-table-wrap"><table class="hub-table"><thead><tr>${['#','Squadra','PT','PG','V','N','P','GF','GS','DR'].map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${rank.map((r,i)=>`<tr><td>${i+1}</td><td>${entity(r.core,r.name)}</td><td><strong>${r.pts}</strong></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td></tr>`).join('')}</tbody></table></div>`:empty('Nessun risultato completato per questa classifica.')}
function matchCard(r,schedule=false){return `<article class="card">${meta(r)}${fixture(r,schedule)}${r.home_manager_name||r.away_manager_name?`<div class="fixture-managers"><span>${esc(r.home_manager_name||'Manager non disponibile')}</span><span>${esc(r.away_manager_name||'Manager non disponibile')}</span></div>`:''}${schedule?'':`<div class="card-bottom"><span>${esc(extraScore(r))}</span><a class="report-link" href="${esc(reportURL(r.sm_fixture_id))}">Apri match report →</a></div>`}</article>`}
function compactMatch(r,schedule=false){const content=fixture(r,schedule)+(extraScore(r)?'<small class="compact-decision">'+esc(extraScore(r))+'</small>':'');return schedule?'<div class="compact-match">'+content+'</div>':'<a class="compact-match" href="'+esc(reportURL(r.sm_fixture_id))+'">'+content+'</a>'}
function matchGroups(rows,schedule=false){const buckets=new Map();for(const r of rows){const key=[r.competition_round||r.competition_stage,L.group(r),date(r.match_date)].filter(Boolean).join(' · ');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(r)}return [...buckets].map(([key,list])=>`<section class="hub-match-group"><h3>${esc(key)}</h3>${list.map(r=>compactMatch(r,schedule||!L.completed(r))).join('')}</section>`).join('')||empty('Nessuna partita disponibile.')}
function trophyTeam(a,runner=false){
 const t=runner?a.runner_up:a.winner,id=t?.core?.national_team_id??t?.core?.club_id;
 const core=t?.core?.image_url?.startsWith('/nexus/assets/')?{...t.core,image_url:'https://www.italianmastersclub.it'+t.core.image_url}:t?.core;
 return id!=null?go({resource:'club',team:id,teamType:t.core.national_team_id!=null?'nations':'clubs',manager:'',competition:'',profileTab:'trophy',season:'',offset:0},entity(core,t.name),'honour-team-link'):entity(core,t?.name);
}
function trophyManager(a){return a.manager?.manager_id?go({resource:'manager',manager:a.manager.manager_id,team:'',competition:'',profileTab:'trophy',teamType:compGroup(a.competition)==='nations'?'nations':'clubs',season:'',offset:0},esc(a.manager.full_name),'honour-manager-link'):esc(a.manager?.full_name||'—')}
function trophyAward(a,featured=false){
 const final=a.kind==='cup',extra=a.match?extraScore(a.match):'';
 return `<article class="card honour-edition ${featured?'honour-featured':''}"><div class="honour-edition-top"><span class="honour-season">Stagione ${esc(a.season)}</span><span class="eyebrow">${featured?'ULTIMO VINCITORE':a.kind==='playoff'?'VINCITORE PLAYOFF':final?'VINCITORE':'CAMPIONE'}</span>${a.awarded_at?`<time>${date(a.awarded_at)}</time>`:''}</div><div class="honour-winner"><span class="honour-medal">${competitionIcon('domestic')}</span><div><h3>${trophyTeam(a)}</h3><div class="honour-manager">${trophyManager(a)}</div></div>${a.points!=null?`<strong class="honour-points">${a.points}<small>PT${a.league_complete?'':' · attuali'}</small></strong>`:''}</div>${a.runner_up?`<div class="honour-result"><span>${final?'Finalista':a.league_complete?'Seconda classificata':'Seconda in classifica'}</span>${trophyTeam(a,true)}${final?`<strong>${esc(a.match.home_score)} – ${esc(a.match.away_score)}</strong>`:`<strong>${a.runner_points} PT</strong>`}</div>`:''}${final&&a.match?`<div class="honour-final"><span>${esc(a.match.home_name)} ${esc(a.match.home_score)} – ${esc(a.match.away_score)} ${esc(a.match.away_name)}${extra?' · '+esc(extra):''}</span><a class="report-link" href="${esc(reportURL(a.match.sm_fixture_id))}">Finale ↗</a></div>`:''}</article>`;
}
function trophyRank(awards,kind){
 const ranked=new Map();for(const a of awards){const t=a.winner,identity=kind==='manager'?a.manager?.manager_id:(t.core?.national_team_id!=null?'nation:'+t.core.national_team_id:t.core?.club_id!=null?'club:'+t.core.club_id:t.name?'source:'+(compGroup(a.competition)==='nations'?'nation:':'club:')+t.name:null);if(!identity)continue;if(!ranked.has(identity))ranked.set(identity,{a,count:0});ranked.get(identity).count++;}
 const rows=[...ranked.values()].sort((a,b)=>b.count-a.count||(kind==='manager'?a.a.manager.full_name:a.a.winner.name).localeCompare(kind==='manager'?b.a.manager.full_name:b.a.winner.name,'it'));
 return `<section class="card honour-ranking"><h3>${kind==='manager'?'Manager più titolati':'Squadre più titolate'}</h3>${rows.length?`<ol>${rows.map((r,i)=>`<li><span class="honour-rank">${i+1}</span><div>${kind==='manager'?trophyManager(r.a):trophyTeam(r.a)}</div><strong>${r.count}<small>${r.count===1?'titolo':'titoli'}</small></strong></li>`).join('')}</ol>`:empty('Nessun titolo ancora attribuito.')}</section>`;
}
function trophyShelf(awards){
 const buckets=new Map();for(const a of awards){const key=a.competition.competition_key;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(a);}
 return `<div class="honour-shelf">${[...buckets.values()].map(as=>{const a=as[0];return `<article class="card honour-trophy"><span class="honour-medal">${competitionIcon('domestic')}</span><strong class="honour-title-count">${as.length}<small>${as.length===1?'titolo':'titoli'}</small></strong><h3>${go({resource:'archive',competition:a.competition.competition_key,season:'',manager:'',team:'',group:compGroup(a.competition),hall:'history',offset:0},esc(compName(a.competition)),'honour-team-link')}</h3><div class="honour-season-list">${as.map(x=>`<span>Stagione ${esc(x.season)}</span>`).join('')}</div></article>`}).join('')}</div>`+(awards.length?'':empty('Nessun titolo ancora presente nell’albo d’oro.'));
}
async function trophyView(c,signal){
 const d=await cached({world:state.world,resource:'trophies'},signal),all=d.awards;
 // Trophy Room always represents the whole history, even when entered from a season page.
 if(state.season||state.from||state.to){state.season=state.from=state.to='';history.replaceState(null,'',urlState());}
 $('dataSection').setAttribute('data-trophy-view','true');$('status').textContent='';
 const nav=tabs('group',[['','Tutte'],...groups.map(g=>g.slice(0,2))]);
 const allFiltered=all.filter(a=>!state.group||compGroup(a.competition)===state.group);
 if(state.competition){
  const editions=all.filter(a=>a.competition.competition_key===state.competition),comp=editions[0]?.competition||c.competitions.find(x=>x.competition_key===state.competition);
  $('sectionTitle').textContent=compName(comp);
  $('viewControls').innerHTML=go({resource:'archive',competition:'',season:'',hall:'history'},'← Albo d’oro del mondo')+tabs('hall',[['history','Albo d’oro'],['leaders','Più titolati']]);
  $('rows').innerHTML=`<header class="card honour-intro"><span class="honour-medal">${competitionIcon('domestic')}</span><div><span class="eyebrow">TROPHY ROOM · ${esc(state.world)}</span><h2>${esc(compName(comp))}</h2><p>Tutte le stagioni, una storia.</p></div></header>`;
  if(state.hall==='leaders')$('rows').innerHTML+=trophyRank(editions,'team')+trophyRank(editions,'manager');
  else $('rows').innerHTML+=editions.length?trophyAward(editions[0],true)+(editions.length>1?'<h3>Le edizioni precedenti</h3>'+editions.slice(1).map(a=>trophyAward(a)).join(''):''):empty('Il primo vincitore entrerà qui nell’albo d’oro.');
  return;
 }
 $('sectionTitle').textContent='Trophy Room';
 const countries=[...new Set(allFiltered.map(a=>a.competition.sm_country).filter(x=>x&&!['CUS','WOR'].includes(x)))].sort();
 $('viewControls').innerHTML=nav+tabs('hall',[['history','Albo d’oro'],['leaders','Più titolati']])+form(input('search','Cerca competizione, squadra o manager')+(countries.length?select('country','Paese',[['','Tutti i paesi'],...countryOptions(countries,allFiltered.map(a=>a.competition))]):''));
 const filtered=allFiltered.filter(a=>(!state.country||a.competition.sm_country===state.country)&&[compName(a.competition),a.winner.name,a.manager?.full_name].join(' ').toLocaleLowerCase('it').includes(state.search.toLocaleLowerCase('it')));
 $('rows').innerHTML=`<header class="card honour-intro"><span class="honour-medal">${competitionIcon('domestic')}</span><div><span class="eyebrow">${esc(state.world)} · ${esc(worlds[state.world])}</span><h2>Albo d’oro</h2><p>I vincitori. Tutte le stagioni.</p></div></header>`;
 if(state.hall==='leaders'){$('rows').innerHTML+=trophyRank(filtered,'team')+trophyRank(filtered,'manager');return;}
 const buckets=new Map();for(const a of filtered){const k=a.competition.competition_key;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(a);}
 $('rows').innerHTML+=`<div class="honour-catalog">${[...buckets.values()].map(as=>{const a=as[0],co=a.competition;return `<section class="card honour-competition" data-honour-category="${compGroup(co)}"><div class="honour-competition-head"><span class="honour-medal">${competitionIcon('domestic')}</span><div><span class="eyebrow">${esc([!['CUS','WOR'].includes(co.sm_country)?co.sm_country:null,compGroup(co).toUpperCase()].filter(Boolean).join(' · '))}</span><h3>${go({competition:co.competition_key,season:'',hall:'history'},esc(compName(co)),'honour-team-link')}</h3></div>${go({competition:co.competition_key,season:'',hall:'history'},'<span aria-hidden="true">›</span><span class="sr-only">Apri albo d’oro</span>','round-arrow')}</div><div class="honour-history">${as.map(x=>`<div class="honour-history-row"><span class="honour-season">S${esc(x.season)}</span><div><strong>${trophyTeam(x)}</strong><small>${trophyManager(x)}</small></div><span class="honour-mini-cup">${competitionIcon('domestic')}</span></div>`).join('')}</div></section>`}).join('')}</div>`+(filtered.length?'':empty('Nessun titolo ancora presente per questa selezione.'));
}

async function catalogView(c,signal){
 const d=await cached({world:state.world,resource:'catalog',season:state.season},signal);const all=d.rows;
 $('viewControls').innerHTML=form(seasonSelect(c));
 if(!state.group){$('rows').innerHTML=groups.map(([id,title,description])=>{const count=all.filter(x=>compGroup(x)===id).length;return go({group:id,country:'',competition:'',offset:0},`<span class="category-symbol">${competitionIcon(id)}</span><span class="category-art">${competitionIcon(id)}</span><h3>${title}</h3><p>${description}</p><div class="category-foot"><strong><b>${number(count)}</b> ${count===1?'competizione':'competizioni'}</strong><span class="round-arrow" aria-hidden="true">›</span></div>`,'card competition-group-card category-'+id)}).join('');$('status').textContent=`${all.length} competizioni con risultati o calendario · ${state.world}`;return}
 const subset=all.filter(x=>compGroup(x)===state.group),countries=[...new Set(subset.map(x=>x.sm_country).filter(x=>x&&x!=='CUS'))].sort();
 $('viewControls').innerHTML=go({group:'',country:'',competition:''},'← Tutti i gruppi')+tabs('group',groups.map(g=>g.slice(0,2)))+form(seasonSelect(c)+(countries.length?select('country','Paese',[['','Tutti i paesi'],...countryOptions(countries,all)]):''));
 const filtered=subset.filter(x=>!state.country||x.sm_country===state.country).sort((a,b)=>String(a.sm_country||'').localeCompare(String(b.sm_country||''))||actionOrder.indexOf(a.sm_action)-actionOrder.indexOf(b.sm_action)||Number(a.sm_division)-Number(b.sm_division));
 $('rows').innerHTML=filtered.map(x=>go({competition:x.competition_key,round:'',tab:state.resource==='archive'?'trophy':state.resource==='standings'?'competition':'overview',offset:0},`<div class="competition-card-head"><span class="competition-symbol">${x.sm_action==='league'?esc(x.sm_division||''):competitionIcon(compGroup(x))}</span><div><span class="eyebrow">${esc([x.sm_country,x.sm_action_group].filter(Boolean).join(' · '))}</span><h3>${esc(compName(x))}</h3></div><span class="round-arrow" aria-hidden="true">›</span></div><div class="competition-metrics"><div><small>Risultati</small><strong>${number(x.results_count||0)}</strong></div><div><small>Calendario</small><strong>${number(x.schedule_count||0)}</strong></div><div><small>Prossima data</small><strong>${x.next_date?date(x.next_date):'—'}</strong></div></div>`,'card competition-entry')).join('')||empty('Nessuna competizione con dati per questa selezione.');$('status').textContent=`${filtered.length} competizioni · ${state.world}`;
}


function overviewPlayerVisual(p){
 const image=(src,cls,label)=>{try{const u=new URL(String(src||'').replace(/^\/\//,'https://'));if(u.protocol==='https:')return `<img class="core-crest ${cls}" src="${esc(u.href)}" alt="${esc(label)}" loading="lazy">`}catch{}return ''};
 return `<span class="overview-player-visual"><span class="overview-portrait">${image(p.image_url,'overview-player-photo',p.name)||'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" aria-label="Foto non disponibile"><circle cx="20" cy="13" r="7"/><path d="M6 37c0-10 6-15 14-15s14 5 14 15"/></svg>'}</span><span class="overview-player-divider" aria-hidden="true"></span><span class="overview-club">${image(p.club_core?.image_url,'overview-club-logo',p.club_name)||'<span aria-label="Logo non disponibile">—</span>'}</span></span>`;
}

function playerLeaders(leaders){const names={goals:'Migliori marcatori',assists:'Migliori assist man',mom:'Uomini partita',rating:'Migliore media voto'};return `<div class="overview-leaders">${Object.entries(names).map(([metric,title])=>`<article class="card"><h3>${title}</h3>${leaders[metric].length?`<ol>${leaders[metric].map(p=>`<li>${overviewPlayerVisual(p)}<div class="overview-player-copy"><strong>${esc(p.name)}</strong><small>${esc(p.team)}${metric==='rating'?' · '+p.ratingCount+' voti':''}</small></div><b>${metric==='rating'?p.rating.toFixed(2):p[metric]}</b></li>`).join('')}</ol>`:empty('Nessun dato disponibile.')}</article>`).join('')}</div>`;}
function overviewStats(summary){
 const labels={matches:'Partite totali',goals:'Gol fatti',total_shots:'Tiri totali',shots_on_target:'Tiri in porta',corners:'Corner',yellow_cards:'Ammonizioni',red_cards:'Espulsioni'};
 const names={goals:'Migliori marcatori',assists:'Migliori assist man',mom:'Uomini partita',rating:'Migliore media voto'};
 return '<h3>Statistiche match report</h3>'+(!summary.totals.matches?empty('Statistiche non ancora disponibili.'):`<div class="overview-stat-grid">${Object.entries(labels).map(([key,label])=>`<article class="card overview-stat"><strong>${summary.totals[key]===null?'—':number(summary.totals[key])}</strong><small>${label}</small></article>`).join('')}</div>`)+playerLeaders(summary.leaders);
}

async function competitionView(c,signal){
 if(state.tab==='trophy'){await trophyView(c,signal);return;}
 const d=await cached({world:state.world,resource:'competition',competition:state.competition,season:state.season},signal),comp=d.competition;
 const results=L.unique(d.results),schedule=L.unique(d.schedule),done=results.filter(L.completed),gs=[...new Set([...results,...schedule].map(L.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
 const isLeague=comp.sm_action==='league'&&!gs.length;
 $('dataSection').setAttribute('data-category',compGroup(comp));
 $('sectionTitle').textContent=compName(comp);
 $('viewControls').innerHTML=go({competition:'',tab:'overview',offset:0},'← Elenco competizioni')+form(seasonSelect(c))+(!c.seasons.length?'':'')+tabs('tab',[['overview','Overview'],['competition','Competizione'],['matches','Partite'],['stats','Statistiche'],['trophy','Trophy Room']]);
 $('status').textContent=`${state.world} · ${number(done.length)} risultati completati · Stagione ${state.season||'non definita'}`;
 if(state.tab==='overview'){
   const latest=[...done].sort((a,b)=>String(b.match_date).localeCompare(String(a.match_date)))[0],today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}),next=schedule.find(r=>r.match_date>=today),teams=new Set([...results,...schedule].flatMap(r=>[r.home_name,r.away_name]).filter(Boolean)),expected=Number(comp.expected_match)||0;
   const rounds=L.competitionRounds(results,schedule,comp);
   const reportData=await cached({world:state.world,resource:'competition_reports',competition:state.competition,season:state.season,overview:1},signal);
   const summary=L.reportSummary(reportData.reports||[]);
   $('status').textContent='';
   $('rows').innerHTML=`<div class="overview-summary-grid"><article class="card overview-stat"><strong>${comp.teams_count||teams.size}</strong><small>Squadre</small></article><article class="card overview-stat"><strong>${rounds.played} / ${rounds.total??'—'}</strong><small>Turni giocati / totali</small></article></div>${overviewStats(summary)}${latest?'<h3>Ultima partita</h3>'+matchCard(latest):empty('Nessun risultato importato.')}${next?'<h3>Prossima partita</h3>'+matchCard(next,true):empty('Nessun incontro futuro nel calendario importato.')}${isLeague&&done.length?`<h3>In testa alla classifica</h3><article class="card">${entity(L.standings(done)[0].core,L.standings(done)[0].name)} · ${L.standings(done)[0].pts} punti</article>`:''}`;
 }else if(state.tab==='competition'){
   if(gs.length){$('rows').innerHTML=gs.map(g=>`<section><h3>${esc(g)}</h3>${table(results.filter(r=>L.group(r)===g))}</section>`).join('');const rounds=[...results,...schedule].filter(L.knockout);if(rounds.length)$('rows').innerHTML+='<h3>Fase a eliminazione</h3>'+matchGroups(rounds)}
   else if(isLeague)$('rows').innerHTML=table(results);
   else $('rows').innerHTML=''+matchGroups([...results,...schedule].sort((a,b)=>String(a.match_date).localeCompare(String(b.match_date))));
 }else if(state.tab==='matches'){
   $('viewControls').innerHTML+=tabs('match',[['results','Risultati'],['schedule','Calendario'],['match_report','Report']]);
   const rounds=[...new Set([...results,...schedule].map(r=>r.competition_round||r.competition_stage).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
   if(rounds.length)$('viewControls').innerHTML+=form(select('round','Turno / fase',[['','Tutti i turni'],...rounds.map(r=>[r,r])]));
   if(state.match==='match_report'){const reports=await fetchData({world:state.world,resource:'match_report',competition:state.competition,season:state.season,round:state.round,offset:state.offset},signal);page(matchGroups(reports.rows),reports.total,'match report')}
   else {const rows=(state.match==='schedule'?schedule:[...results].reverse()).filter(r=>!state.round||(r.competition_round||r.competition_stage)===state.round);page(matchGroups(rows.slice(state.offset,state.offset+50),state.match==='schedule'),rows.length,'partite')}
 }else if(state.tab==='stats'){
   $('viewControls').innerHTML+=tabs('metric',[['goals','Gol'],['assists','Assist'],['rating','Rating'],['mom','MOM'],['cards','Cartellini']]);
   const stats=await fetchData({world:state.world,resource:'stats',competition:state.competition,metric:state.metric},signal);
   $('rows').innerHTML=''+(stats.rows.length?`<div class="hub-table-wrap"><table class="hub-table"><thead><tr><th>#</th><th>Giocatore</th><th>Squadra</th><th>${esc({goals:'Gol',assists:'Assist',rating:'Rating',mom:'MOM',cards:'Cartellini'}[state.metric]||'Valore')}</th></tr></thead><tbody>${stats.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.player_name)}</td><td>${entity(r.club_core,r.club_name)}</td><td><strong>${esc(r.metric_value)}</strong></td></tr>`).join('')}</tbody></table></div>`:empty('Questo valore non è presente negli import statistici della competizione.'));

 }
}
async function teamsView(c,signal){
 if(state.team){await teamProfile(c,signal);return}
 $('viewControls').innerHTML=tabs('teamType',[['clubs','Club'],['nations','Nazionali']])+form(input('search','Cerca squadra'));
 const all=state.teamType==='nations'?c.nations:c.clubs;const filtered=all.filter(t=>String(t.name||'').toLocaleLowerCase('it').includes(state.search.toLocaleLowerCase('it')));
 page(`<div class="team-grid">${filtered.slice(state.offset,state.offset+50).map(r=>go({team:r.id,manager:'',offset:0,profileTab:'career'},`${entity(r,r.name)}`,'card team-tile')).join('')}</div>`,filtered.length,state.teamType==='nations'?'nazionali':'club');
}
// Profiles use CORE identifiers and assignments scoped to the selected world.
const managerAvatar='<svg class="manager-avatar" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="32" cy="21" r="12"/><path d="M10 59c0-14 9-22 22-22s22 8 22 22"/></svg>';
const sameId=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
const nationalAssignment=a=>a.national_team_id!=null&&String(a.national_team_id)!=='';
function assignedTeam(c,a){const t=(nationalAssignment(a)?c.nations:c.clubs).find(t=>sameId(t.id,nationalAssignment(a)?a.national_team_id:a.team_id));const norm=v=>String(v||'').trim().toLocaleLowerCase('it');return t&&(!a.team_name||norm(t.name)===norm(a.team_name))?t:null}
function assignmentStatus(a){const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});return a.start_date&&a.start_date>today?'In programma':a.end_date&&a.end_date<today?'Concluso':'In corso'}
function careerCard(c,a,showManager=false){const t=assignedTeam(c,a);const title=showManager?go({resource:'manager',manager:a.manager_id,team:'',teamType:'clubs',search:'',offset:0,profileTab:'career',opponent:''},esc(a.full_name||a.manager_id)):t?go({resource:'club',team:t.id,manager:'',teamType:nationalAssignment(a)?'nations':'clubs',search:'',offset:0,profileTab:'career'},entity(t,t.name)):esc(a.team_name||'Squadra non collegata');return `<article class="card career-card"><span class="eyebrow">${esc(assignmentStatus(a))} · ${nationalAssignment(a)?'Nazionale':'Club'}</span><h3>${title}</h3><p>${esc(date(a.start_date))} — ${a.end_date?esc(date(a.end_date)):'Presente'}</p></article>`}
async function managersView(c,signal){
 if(state.manager){await managerProfile(c,signal);return}
 $('viewControls').innerHTML=form(input('search','Cerca manager o squadra'));
 const grouped=new Map();for(const a of c.managers){if(!a.manager_id)continue;if(!grouped.has(a.manager_id))grouped.set(a.manager_id,[]);grouped.get(a.manager_id).push(a)}
 const rows=[...grouped.values()].filter(as=>as.some(a=>[a.full_name,a.manager_id,a.team_name].join(' ').toLocaleLowerCase('it').includes(state.search.toLocaleLowerCase('it'))));
 page(`<div class="team-grid">${rows.slice(state.offset,state.offset+50).map(as=>{const r=as[0];return go({manager:r.manager_id,team:'',teamType:'clubs',offset:0,profileTab:'career',opponent:''},`${managerAvatar}<span class="entity"><span>${esc(r.full_name||r.manager_id)}</span></span>`,'card team-tile')}).join('')}</div>`,rows.length,'manager');
}

function statTiles(values){return '<div class="overview-stat-grid">'+values.map(([v,label])=>`<article class="card overview-stat"><strong>${v==null?'—':esc(v)}</strong><small>${esc(label)}</small></article>`).join('')+'</div>'}
function detailedProfileStats(rows,id,withReports=true,withPlayers=true){
 const s=L.profileStats(rows,id),b=s.basic,avg=(v)=>v==null?'—':v.toLocaleString('it-IT',{maximumFractionDigits:2}),per=v=>b.p?avg(v/b.p):'—',pct=v=>b.p?Math.round(v/b.p*100)+'%':'—';
 let html=statTiles([[b.p,'Partite'],[b.w,'Vittorie'],[b.d,'Pareggi'],[b.l,'Sconfitte'],[pct(b.w),'Vittorie %'],[b.gf,'Gol fatti'],[b.ga,'Gol subiti'],[per(b.gf),'Gol fatti / partita'],[per(b.ga),'Gol subiti / partita'],[b.gf-b.ga,'Differenza reti'],[b.clean,'Porte inviolate'],[b.p-s.scored,'Senza segnare'],[s.btts,'Entrambe a segno'],[s.over25,'Over 2,5 gol'],[per(s.points),'Punti / partita'],[s.homeGames,'Partite in casa'],[s.homeWins,'Vittorie in casa'],[s.awayGames,'Partite fuori'],[s.awayWins,'Vittorie fuori'],[pct(b.clean),'Porte inviolate %']]);
 if(withReports){
 const t=s.totals,a=s.averages,o=s.opponentAverages;
 html+='<h3>Gioco e disciplina</h3>'+statTiles([[a.possession==null?null:avg(a.possession)+'%','Possesso medio'],[t.total_shots,'Tiri totali'],[avg(a.total_shots),'Tiri / partita'],[t.shots_on_target,'Tiri in porta'],[avg(a.shots_on_target),'In porta / partita'],[t.corners,'Corner'],[avg(a.corners),'Corner / partita'],[t.yellow_cards,'Ammonizioni'],[t.red_cards,'Espulsioni'],[avg(a.yellow_cards),'Gialli / partita'],[avg(o.total_shots),'Tiri subiti / partita'],[avg(o.shots_on_target),'In porta subiti / partita'],[avg(o.corners),'Corner subiti / partita']]);
 if(withPlayers)html+='<h3>Migliori giocatori</h3>'+playerLeaders(s.leaders);
 }
 return html;
}
function h2hSummary(group){
 const s=group.stats,b=s.basic,a=s.averages,fmt=v=>v==null?'—':v.toLocaleString('it-IT',{maximumFractionDigits:2});
 return `<article class="card h2h-card"><h3>${esc(group.name)}</h3>${statTiles([[b.p,'Partite'],[b.w,'Vittorie'],[b.d,'Pareggi'],[b.l,'Sconfitte'],[b.gf+' – '+b.ga,'Gol fatti / subiti']])}<div class="h2h-detail">${statTiles([[s.totals.shots_on_target,'Tiri in porta'],[fmt(a.shots_on_target),'In porta / partita'],[s.totals.corners,'Corner'],[fmt(a.corners),'Corner / partita'],[a.possession==null?'—':fmt(a.possession)+'%','Possesso medio']])}</div></article>`;
}

function managerSummary(rows,id){const s=L.managerStats(rows,id);return `<article class="card"><div class="stat-row">${[[s.p,'Partite'],[s.w,'Vittorie'],[s.d,'Pareggi'],[s.l,'Sconfitte'],[s.gf,'Gol fatti'],[s.ga,'Gol subiti'],[s.clean,'Porte inviolate'],[s.p?Math.round(s.w/s.p*100)+'%':'—','Vittorie %']].map(([v,k])=>`<div><strong>${v}</strong><small>${k}</small></div>`).join('')}</div></article>`}
async function managerProfile(c,signal){
 const assignments=c.managers.filter(a=>sameId(a.manager_id,state.manager));
 $('viewControls').innerHTML=go({manager:'',offset:0,profileTab:'career',opponent:''},'← Tutti i manager');
 if(!assignments.length){$('rows').innerHTML=empty('Manager non presente in questo mondo.');$('status').textContent=state.world;return}
 const manager=assignments[0];$('sectionTitle').textContent=manager.full_name||manager.manager_id;
 const national=state.teamType==='nations',selected=assignments.filter(a=>nationalAssignment(a)===national).sort((a,b)=>String(b.start_date||'').localeCompare(String(a.start_date||'')));
 $('viewControls').innerHTML+=tabs('teamType',[['clubs','Club'],['nations','Nazionali']])+tabs('profileTab',[['career','Carriera'],['stats','Statistiche'],['matches','Partite'],['trophy','Trophy Room'],['h2h','H2H']]);
 const header=`<article class="card profile-heading">${managerAvatar}<div><span class="eyebrow">${esc(manager.manager_id)} · ${esc(state.world)}</span><h3>${esc(manager.full_name||manager.manager_id)}</h3></div></article>`;
 $('status').textContent=state.world+' · Profilo manager';
 if(state.profileTab==='career'){
 const teams=new Set(selected.map(a=>nationalAssignment(a)?a.national_team_id:a.team_id).filter(v=>v!=null));
 const days=L.careerDays(selected,new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}));
 $('rows').innerHTML=header+`<h3>Carriera nel mondo</h3><article class="card"><div class="stat-row"><div><strong>${selected.length}</strong><small>Incarichi registrati</small></div><div><strong>${days}</strong><small>Giorni di attività</small></div><div><strong>${teams.size}</strong><small>${national?'Nazionali':'Club'}</small></div><div><strong>${selected.filter(a=>assignmentStatus(a)==='In corso').length}</strong><small>In corso</small></div></div></article><div class="career-list">${selected.map(a=>careerCard(c,a)).join('')||empty('Nessun incarico registrato per questa selezione.')}</div>`;return}
 if(state.profileTab==='trophy'){const d=await cached({world:state.world,resource:'trophies'},signal);$('rows').innerHTML=header+trophyShelf(d.awards.filter(a=>sameId(a.manager?.manager_id,state.manager)&&(compGroup(a.competition)==='nations')===national));return;}
 if(state.profileTab==='h2h'&&!state.season&&c.seasons.length){const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}),current=c.seasons.find(s=>s.imc_season_start_date<=today&&(!s.imc_season_end_date||s.imc_season_end_date>=today))||[...c.seasons].sort((a,b)=>Number(b.imc_season)-Number(a.imc_season))[0];state.season=String(current.imc_season);history.replaceState(null,'',urlState())}
 $('viewControls').innerHTML+=form(select('season','Stagione',[...(state.profileTab==='h2h'?[]:[['','Tutte le stagioni']]),...c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season])]));
 const d=await cached({world:state.world,resource:'manager_profile',manager:state.manager,season:state.season},signal),id=d.manager.sm_manager_id,rows=L.managerRows(d.rows,id,d.assignments,national);
 const note=``;
 $('rows').innerHTML=header+note;
 if(!id){$('rows').innerHTML+=empty('ID Soccer Manager non disponibile: statistiche e trofei non attribuibili.');return}
 if(state.profileTab==='stats'){
 $('rows').innerHTML+=detailedProfileStats(rows,id);
 const comps=new Map();for(const r of rows){const key=r.competition_key||'';if(!comps.has(key))comps.set(key,[]);comps.get(key).push(r)}
 $('rows').innerHTML+=`<h3>Per competizione</h3><div class="hub-table-wrap"><table class="hub-table manager-competition-table"><thead><tr><th>Competizione</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th></tr></thead><tbody>${[...comps].map(([key,rs])=>{const st=L.managerStats(rs,id),r=rs[0],name=compName(r.competition_core||r);return `<tr><td>${key?go({resource:'competitions',competition:key,manager:'',group:compGroup(r.competition_core||r),tab:'overview',offset:0},esc(name)):esc(name)}</td>${['p','w','d','l','gf','ga'].map(k=>`<td>${st[k]}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;
 }else if(state.profileTab==='matches'){
 page(header+note+matchGroups(rows.slice(state.offset,state.offset+50)),rows.length,'partite attribuite');
 }else if(state.profileTab==='h2h'){

 const groups=L.headToHeads(rows,id);
 $('viewControls').innerHTML+=form(select('opponent','Avversario',[['','Tutti gli avversari'],...groups.map(g=>[g.id,g.name])]));
 const shown=state.opponent?groups.filter(g=>g.id===state.opponent):groups;
 $('rows').innerHTML+=shown.length?shown.map(h2hSummary).join(''):empty('Nessuno scontro diretto disponibile per questa stagione.');
 if(shown.length){const matches=shown.flatMap(g=>g.rows);$('rows').innerHTML+='<h3>Sintesi degli scontri diretti</h3>'+detailedProfileStats(matches,id,true,false);if(state.opponent)$('rows').innerHTML+='<h3>Partite</h3>'+matchGroups(matches);}

 }
}
async function teamProfile(c,signal){
 const national=state.teamType==='nations',team=(national?c.nations:c.clubs).find(t=>sameId(t.id,state.team));
 $('viewControls').innerHTML=go({team:'',offset:0},national?'← Tutte le nazionali':'← Tutti i club');
 if(!team){$('rows').innerHTML=empty('Squadra non presente in questo mondo.');$('status').textContent=state.world;return}
 $('sectionTitle').textContent=team.name;
 $('viewControls').innerHTML+=tabs('profileTab',[['career','Manager'],['teamhub','Team Hub'],['stats','Statistiche'],['matches','Partite'],['transfers','Transfer'],['trophy','Trophy Room']]);
 if(state.profileTab==='transfers'){
  const teamWorldId=team.sm_team_id||team.sm_world_club_id||team.world_team_id;
  const clubFilter=teamWorldId?String(teamWorldId):'name:'+team.name;
  const d=await cached({world:state.world,resource:'transfers',club:clubFilter,limit:5000,offset:0},signal),all=d.rows||[];
  const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b),norm=v=>String(v||'').trim().toLocaleLowerCase('it');
  const incoming=all.filter(r=>teamWorldId?same(r.to_sm_world_club_id,teamWorldId):norm(r.club_to)===norm(team.name));
  const outgoing=all.filter(r=>teamWorldId?same(r.from_sm_world_club_id,teamWorldId):norm(r.club_from)===norm(team.name));
  const playerPhoto=r=>{const p=r.player_core||{};try{const u=new URL(String(p.image_url||'').replace(/^\/\//,'https://'));if(u.protocol==='https:')return `<img class="transfer-player-photo" src="${esc(u.href)}" alt="${esc(r.player_name||'Giocatore')}" loading="lazy">`}catch{}return '<span class="transfer-player-placeholder" aria-hidden="true">⚽</span>'};
  const transferCard=(r,dir)=>`<article class="card club-transfer"><div class="meta"><span>#${esc(r.imc_transfer_number??'—')} · ${esc(date(r.transfer_date))}</span><span>${dir==='in'?'TRANSFER IN':'TRANSFER OUT'}</span></div><div class="transfer-player-row">${playerPhoto(r)}<div><strong>${esc(r.player_core?[r.player_core.forename,r.player_core.surname].filter(Boolean).join(' '):r.player_name||'Giocatore')}</strong><small>${esc(r.amount_text||'—')}</small></div></div><div class="transfer-route"><span>${entity(r.from_core,r.club_from||'—')}</span><b aria-hidden="true">→</b><span>${entity(r.to_core,r.club_to||'—')}</span></div>${Array.isArray(r.exchange_players)&&r.exchange_players.length?`<small>Scambio: ${esc(r.exchange_players.join(', '))}</small>`:''}</article>`;
  const amount=r=>{const raw=String(r.amount_text||'').trim().toUpperCase().replace(/€/g,'').replace(/\s/g,'').replace(',','.');const m=raw.match(/([0-9.]+)([KMB])?/);if(!m)return 0;let v=Number(m[1])||0;if(m[2]==='K')v*=1e3;else if(m[2]==='M')v*=1e6;else if(m[2]==='B')v*=1e9;return v};
  const money=v=>v>=1e9?(v/1e9).toLocaleString('it-IT',{maximumFractionDigits:2})+'B':v>=1e6?(v/1e6).toLocaleString('it-IT',{maximumFractionDigits:2})+'M':v>=1e3?(v/1e3).toLocaleString('it-IT',{maximumFractionDigits:0})+'K':v?number(v):'0';
  const inValue=incoming.reduce((s,r)=>s+amount(r),0),outValue=outgoing.reduce((s,r)=>s+amount(r),0);
  const transferTab=tabs('transferView',[['in','Transfer In'],['out','Transfer Out']]);
  const active=state.transferView==='out'?outgoing:incoming,dir=state.transferView==='out'?'out':'in';
  const transferTotals=`<div class="transfer-kpis"><article><span>TRANSFER IN</span><strong>${incoming.length}</strong><small>Trasferimenti</small><b>${money(inValue)}</b><small>Valore totale</small></article><article><span>TRANSFER OUT</span><strong>${outgoing.length}</strong><small>Trasferimenti</small><b>${money(outValue)}</b><small>Valore totale</small></article></div>`;
  $('rows').innerHTML=`<article class="card profile-heading">${entity(team,team.name)}</article>${transferTotals}${transferTab}<section class="club-transfer-list">${active.length?active.map(r=>transferCard(r,dir)).join(''):empty(dir==='in'?'Nessun trasferimento in entrata.':'Nessun trasferimento in uscita.')}</section>`;
  $('status').textContent=state.world+' · '+all.length+' trasferimenti del club';return;
 }
 if(state.profileTab==='trophy'){const d=await cached({world:state.world,resource:'trophies'},signal);$('rows').innerHTML=`<article class="card profile-heading">${entity(team,team.name)}</article>`+trophyShelf(d.awards.filter(a=>sameId(a.winner.core?.[national?'national_team_id':'club_id'],team.id)&&(compGroup(a.competition)==='nations')===national));return;}
 if(['teamhub','stats','matches'].includes(state.profileTab)){
 $('viewControls').innerHTML+=form(select('season','Stagione',[['','Tutte le stagioni'],...c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season])]));
 const d=await cached({world:state.world,resource:'team_profile',team:state.team,teamType:state.teamType,season:state.season},signal),rows=L.unique(d.rows).filter(L.completed);
 const note='';
 const heading=`<article class="card profile-heading">${entity(team,team.name)}</article>`;
 if(!rows.length){const message=d.mapping_status==='missing'?'ID della squadra nel mondo non ancora presente nel mapping CORE.':d.mapping_status==='ambiguous'?'ID del mondo associato a più squadre: collegamento sospeso per evitare statistiche errate.':'Nessuna partita disponibile per questa squadra e stagione.';$('rows').innerHTML=heading+note+empty(message);$('status').textContent=state.world+' · 0 report collegati';return}
 if(state.profileTab==='matches')page(heading+note+matchGroups(rows.slice(state.offset,state.offset+50)),rows.length,'match report');
 else if(state.profileTab==='teamhub'){
  const roster=L.teamPlayerStats(rows,d.team.sm_team_id),fmt=v=>v==null?'—':Number(v).toLocaleString('it-IT',{maximumFractionDigits:2});
  const totals={players:roster.length,apps:roster.reduce((s,p)=>s+p.appearances,0),minutes:roster.reduce((s,p)=>s+p.minutes,0),goals:roster.reduce((s,p)=>s+p.goals,0),assists:roster.reduce((s,p)=>s+p.assists,0),own:roster.reduce((s,p)=>s+p.own_goals,0)};
  const cards=roster.map(p=>`<article class="card teamhub-player">${overviewPlayerVisual({...p,club_core:team,club_name:team.name})}<div class="teamhub-copy"><h3>${esc(p.name)}</h3><div class="teamhub-primary"><strong>${p.appearances}</strong><small>Pres.</small><strong>${number(p.minutes)}</strong><small>Min.</small><strong>${p.goals}</strong><small>Gol</small><strong>${p.assists}</strong><small>Assist</small></div><div class="teamhub-secondary"><span>${p.starts} titolare</span><span>${p.sub_apps} subentrato</span><span>${p.rating==null?'—':p.rating.toFixed(2)} voto</span><span>${p.yellow} 🟨</span><span>${p.red} 🟥</span><span>${p.mom} MVP</span><span>${p.own_goals} AG</span><span>${p.goal_assists} G+A</span><span>${fmt(p.ga90)} G+A/90</span></div></div></article>`).join('');
  $('rows').innerHTML=heading+note+'<h3>Team Hub</h3>'+statTiles([[totals.players,'Giocatori utilizzati'],[totals.goals,'Gol'],[totals.assists,'Assist'],[totals.own,'Autogol'],[number(totals.minutes),'Minuti complessivi']])+`<div class="teamhub-roster">${cards}</div>`;
  $('status').textContent=state.world+' · '+rows.length+' match report · '+roster.length+' giocatori utilizzati';
 }
 else {const adapted=rows.map(r=>({...r,home_sm_manager_id:r.home_sm_club_id,away_sm_manager_id:r.away_sm_club_id}));$('rows').innerHTML=heading+note+detailedProfileStats(adapted,d.team.sm_team_id,!national);$('status').textContent=state.world+' · '+rows.length+' match report';}return;
 }

 const assignments=c.managers.filter(a=>nationalAssignment(a)===national&&sameId(assignedTeam(c,a)?.id,team.id)).sort((a,b)=>String(b.start_date||'').localeCompare(String(a.start_date||'')));
 $('rows').innerHTML=`<article class="card profile-heading">${entity(team,team.name)}<span class="eyebrow">${esc(state.world)} · ${national?'Nazionale':'Club'}</span></article><h3>Carriera manager IMC</h3><article class="card"><div class="stat-row"><div><strong>${assignments.length}</strong><small>Incarichi registrati</small></div><div><strong>${new Set(assignments.map(a=>a.manager_id)).size}</strong><small>Manager IMC</small></div></div></article><div class="career-list">${assignments.map(a=>careerCard(c,a,true)).join('')||empty('Nessun incarico manager IMC registrato per questa squadra nel mondo selezionato.')}</div>`;
 $('status').textContent=state.world+' · Profilo '+(national?'nazionale':'club');
}
function playerTile(r){return `<article class="card player-tile"><div>${entity({name:r.full_name,image_url:r.image_url},r.full_name)}<p class="eyebrow">PLAYER ID · ${esc(r.player_id)}</p><p>${esc(r.position||'Ruolo non disponibile')} · ${r.age==null?'Età non disponibile':esc(r.age)+' anni'}</p><p><span class="team-context">${entity(r.club_core,r.current_club||'Club non disponibile')}</span> · ${esc(r.nationality||'')}</p></div><div class="player-metrics"><strong>${esc(r.rating??'—')}</strong><small>Rating</small><strong>${esc(r.market_value??'—')}</strong><small>Valore</small>${go({player:r.player_id,offset:0},'Scheda ↗')}</div></article>`}
async function playersView(c,signal){
 const d=await fetchData({...state,resource:'players'},signal);
 if(state.player){$('viewControls').innerHTML=go({player:'',offset:0},'← Catalogo giocatori');const r=d.rows[0];$('rows').innerHTML=r?playerTile(r)+`<article class="card"><h3>Profilo</h3><p>${esc([r.height_cm?r.height_cm+' cm':'',r.weight_kg?r.weight_kg+' kg':'',r.foot?'Piede '+r.foot:''].filter(Boolean).join(' · '))}</p><p>Stipendio: ${esc(r.salary||'—')} · Contratto: ${esc(r.contract_seasons??'—')} stagioni</p><p>Club reale: <span class="team-context">${entity(r.real_club_core,r.real_club||'—')}</span></p></article><section><h3>Storico rating</h3>${r.rating_history?.length?structured(r.rating_history):empty('Storico rating non disponibile.')}</section><section><h3>Storico trasferimenti</h3>${r.transfer_history?.length?structured(r.transfer_history):empty('Storico trasferimenti non disponibile.')}</section>`:empty('Giocatore non presente nel catalogo di questo mondo.');$('status').textContent=state.world;return}
 $('viewControls').innerHTML=tabs('scope',[['world','Nel mondo'],['global','Codex globale']])+(state.scope==='global'?'':'')+form(input('search','Cerca giocatore')+select('sort','Ordina per',[['rating','Rating ↓'],['value','Valore ↓'],['age','Età ↑'],['name','Nome A–Z']])+`<details class="advanced-filters" ${['club','position','rating_min','rating_max','age_min','age_max','value_min','value_max'].some(k=>state[k])?'open':''}><summary>Filtri avanzati</summary><div>`+select('club',state.scope==='global'?'Club reale':'Club nel mondo',[['','Tutti i club'],...d.clubs.map(r=>[r.id,r.name])])+select('position','Posizione',[['','Tutte'],['P','Portiere (P)'],['D','Difensore (D)'],['CD','Mediano (CD)'],['CC','Centrocampista (CC)'],['CO','Trequartista (CO)'],['A','Attaccante (A)']])+['rating','age','value'].map(k=>input(k+'_min',{rating:'Rating minimo',age:'Età minima',value:'Valore minimo (M)'}[k],'number')+input(k+'_max',{rating:'Rating massimo',age:'Età massima',value:'Valore massimo (M)'}[k],'number')).join('')+'</div></details>');
 page(d.rows.map(playerTile).join(''),d.total,'giocatori');if(!d.total)$('rows').innerHTML=empty('Nessun giocatore nel catalogo di questo mondo per i filtri scelti. Il catalogo si popola dagli import giocatori. Puoi consultare il Codex globale dalla scheda sopra.');
}
function transferCard(r,latest=false){const p=r.player_core,confirmed=String(r.normalization_status||'').toUpperCase()==='CERTIFIED',transferDate=r.normalized_transfer_date||r.transfer_date||'',season=r.imc_season||'';return `<article class="card ${latest?'latest-transfer':''}">${latest?'<span class="eyebrow">ULTIMO TRASFERIMENTO DELLA SELEZIONE</span>':''}<div class="meta"><span>${esc(transferDate?date(transferDate):'Data non disponibile')}${season?' · S'+esc(season):''}</span><span>${confirmed?'NEXUS CONFIRMED':'NEXUS -'}</span></div><div class="transfer-head">${entity({name:p?[p.forename,p.surname].filter(Boolean).join(' '):r.player_name,image_url:p?.image_url},r.player_name)}<strong>${esc(r.amount_text||'—')}</strong></div>${p?`<p class="player-core">${esc([p.rating?'Rating attuale '+p.rating:'',p.age?p.age+' anni':'',p.position].filter(Boolean).join(' · '))}</p>`:''}<div class="transfer-route">${entity(r.from_core,r.club_from)}<span>→</span>${entity(r.to_core,r.club_to)}</div>${r.exchange_players?`<details><summary>Contropartite</summary>${structured(r.exchange_players)}</details>`:''}</article>`}
async function transfersView(c,signal){
 const d=await fetchData({...state,resource:'transfers',limit:50},signal);
 $('viewControls').innerHTML=form(select('club','Squadra',[['','Tutte le squadre'],...(d.clubs||[]).map(r=>[r.id,r.name])])+select('season','Stagione',[['','Tutte le stagioni'],...c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season])])+input('search','Cerca giocatore o squadra')+input('from','Dal','date')+input('to','Al','date'));
 page(d.rows.map((r,i)=>transferCard(r,state.offset===0&&i===0)).join(''),d.total,'trasferimenti');$('status').textContent+=d.updated_at?' · Aggiornato al '+date(d.updated_at)+' '+d.updated_at.slice(11,16):'';
}
async function newsView(c,signal){
 const full=state.resource==='news';let awards=[],warning='';
 try{awards=(await cached({world:state.world,resource:'trophies'},signal)).awards||[];}
 catch(e){if(e.name==='AbortError')throw e;warning='Trofei e finali momentaneamente non disponibili. Premi Aggiorna per riprovare.';}
 if(signal.aborted)return;
 const all=window.NexusNews.build(state.world,c,awards);
 const filtered=full&&state.newsType?all.filter(e=>e.type===state.newsType):all;
 const offset=full?state.offset:0,limit=full?50:5;
 if(full)$('viewControls').innerHTML=tabs('newsType',[['','Tutte'],['appointment','Nuovi incarichi'],['departure','Fine incarico'],['trophy','Trofei'],['final','Finali']]);
 const heading=`<div class="nexus-news-heading"><h3>${full?'Tutte le notizie':'News feed'}</h3>${full?go({resource:'home',offset:0,newsType:''},'Il Mondo ←'):go({resource:'news',offset:0,newsType:''},'Tutte le notizie →')}</div>`;
 const content=`<section class="nexus-news" aria-label="Notizie del Game World">${heading}${warning?`<p class="nexus-news-message" role="status">${esc(warning)}</p>`:''}${filtered.slice(offset,offset+limit).map(e=>window.NexusNews.render(e)).join('')||empty('Nessuna notizia disponibile per questa selezione.')}</section>`;
 if(full)page(content,filtered.length,'notizie');
 else{$('rows').innerHTML=content+`<section class="card nexus-news-world-summary"><h3>${esc(c.world?.world_name||state.world)}</h3><div class="stat-row"><div><strong>${number(c.world?.active_clubs||c.clubs.length)}</strong><small>Club del mondo</small></div><div><strong>${number(new Set(c.managers.map(m=>m.manager_id)).size)}</strong><small>Manager IMC con incarichi</small></div><div><strong>${esc(c.seasons[0]?.imc_season||'—')}</strong><small>Stagione IMC più recente</small></div></div></section>`;$('status').textContent=state.world+' · '+all.length+' notizie';}
}
async function directoryView(signal){const d=await cached({world:state.world,resource:'directory'},signal),c=d.core;
 if(c.world?.world_name){worlds[state.world]=c.world.world_name;worldMenus()}
 if(state.resource==='archive'){await trophyView(c,signal);
 }else if(['competitions','standings'].includes(state.resource)){
   if(!state.season&&c.seasons.length){state.season=String(c.seasons[0].imc_season);history.replaceState(null,'',urlState())}
   if(state.competition)await competitionView(c,signal);else await catalogView(c,signal);
 }else if(state.resource==='club')await teamsView(c,signal);
 else if(state.resource==='player')await playersView(c,signal);
 else if(state.resource==='transfers')await transfersView(c,signal);
 else if(state.resource==='manager'){await managersView(c,signal);
 }else await newsView(c,signal);
}
async function load(push=false){
 $('dataSection').setAttribute('data-trophy-view','false');
 $('dataSection').setAttribute('data-competition-view',['competitions','standings','archive'].includes(state.resource)?'true':'false');$('dataSection').setAttribute('data-category',state.group||'domestic');
 if(controller)controller.abort();controller=new AbortController();const active=controller;
 if(push)history.pushState(null,'',urlState());$('world').value=state.world;worldMenus();
 const isDirectory=['home','news','competitions','manager','club','standings','archive','player','transfers'].includes(state.resource);
 $('filters').hidden=isDirectory;document.querySelector('.pagination').hidden=true;$('viewControls').innerHTML='';
 $('worldLabel').textContent=`${state.world} · ${worlds[state.world]}`;$('sectionTitle').textContent=state.resource==='archive'?'Trophy Room':sections[state.resource];
 $('status').textContent='Caricamento…';$('rows').innerHTML='';$('page').textContent='';$('previous').disabled=$('next').disabled=true;
 try{
   if(isDirectory){await directoryView(active.signal);if(((state.resource==='manager'&&state.manager)||(state.resource==='club'&&state.team)||(state.resource==='player'&&state.player)))$('status').textContent='';return}
   const d=await fetchData({...state,limit:50},active.signal);page(d.rows.map(card).join(''),d.total,'partite');
 }catch(e){if(e.name!=='AbortError'){$('status').textContent=e.message;$('rows').innerHTML=empty('Premi Aggiorna per riprovare.')}}
}
$('world').onchange=()=>{state={...defaults,world:$('world').value};load(true)};
document.addEventListener('click',e=>{
 const a=e.target.closest('a[data-go]');if(a){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'',a.href);readURL();load();return}
 const clear=e.target.closest('[data-clear-view]');if(clear){state={...defaults,world:state.world,resource:state.resource,competition:state.competition,group:state.group,tab:state.tab,teamType:state.teamType,season:state.season,scope:state.scope,manager:state.manager,team:state.team,profileTab:state.profileTab};load(true);return}
 const b=e.target.closest('[data-resource]');if(b){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();state={...defaults,world:state.world,resource:b.dataset.resource};if($('worldNavigation').open)$('worldNavigation').close();load(true);$('dataSection').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
});
document.addEventListener('submit',e=>{if(!e.target.matches('[data-view-form]'))return;e.preventDefault();for(const [k,v] of new FormData(e.target))if(k in defaults)state[k]=v;state.offset=0;load(true)});
$('filters').onsubmit=e=>{e.preventDefault();for(const k of ['search','from','to'])state[k]=$(k).value;state.offset=0;load(true)};$('reset').onclick=()=>{for(const k of ['search','from','to'])state[k]=$(k).value='';state.offset=0;load(true)};$('refresh').onclick=()=>{viewCache.clear();load()};$('previous').onclick=()=>{state.offset=Math.max(0,state.offset-50);load(true)};$('next').onclick=()=>{state.offset+=50;load(true)};window.onpopstate=()=>{readURL();load()};document.addEventListener('error',e=>{if(e.target.matches?.('.core-crest'))e.target.hidden=true},true);
async function boot(){try{const d=await fetchData({resource:'worlds'});for(const w of d.worlds||[])if(w.world_name&&worlds[w.game_world_id]){worlds[w.game_world_id]=w.world_name;for(const o of $('world').options)if(o.value===w.game_world_id)o.textContent=`${w.game_world_id} · ${w.world_name}`;}}catch(e){/* Dataset reads surface CORE failures explicitly. */}readURL();load()}boot();
})();




