(()=>{'use strict';
const $=id=>document.getElementById(id), worlds={GW001:'Road To History',GW002:'Gold 558',GW003:'Gold 557',GW004:'World League',GW005:'Hall Of Famers',GW006:'Master League World',GW007:'The Four Kingdoms',GW008:'Gold 1',GW009:'Kick Off',GW010:'Game World 010'}, sections={home:'Il Mondo',competitions:'Competizioni',results:'Risultati',schedule:'Calendario',match_report:'Match Center',standings:'Classifiche',manager:'Manager',player:'Player',club:'Club',archive:'Archivio',transfers:'Trasferimenti'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'Data non disponibile';
const number=v=>Number(v).toLocaleString('it-IT');
let state={world:'GW001',resource:'home',offset:0,search:'',from:'',to:''}, controller=null, total=0;
for(const [id,name] of Object.entries(worlds)) $('world').add(new Option(`${id} · ${name}`,id));
function readURL(){const p=new URLSearchParams(location.search);state={...defaults};for(const k of Object.keys(defaults))if(p.has(k))state[k]=p.get(k);if(!worlds[state.world])state.world='GW001';if(!sections[state.resource])state.resource='home';state.offset=Math.max(0,parseInt(state.offset,10)||0);$('world').value=state.world;for(const k of ['search','from','to'])$(k).value=state[k]}
function urlState(){const p=new URLSearchParams(state);return `${location.pathname}?${p}`}
async function fetchData(params,signal){const response=await fetch(`public/data.php?${new URLSearchParams(params)}`,{signal,cache:'no-store',credentials:'omit'});const data=await response.json();if(!response.ok||!data.ok)throw new Error('Dati momentaneamente non disponibili. Riprova tra poco.');return data}
function meta(r){return `<div class="meta"><span>${esc(date(r.match_date||r.transfer_date))}${r.match_time?' · '+esc(r.match_time.slice(0,5)):''}</span><span>${esc([compName(r.competition_core),r.country_name||r.sm_country,r.imc_season?'S'+r.imc_season:'',r.sm_division,r.competition_group_name,r.competition_stage,r.competition_round].filter(Boolean).join(' · '))}</span></div>`}
function extraScore(r){let notes=[];if(r.penalty_home_score!=null&&r.penalty_away_score!=null)notes.push(`Rigori ${r.penalty_home_score}–${r.penalty_away_score}`);if(r.aggregate_home_score!=null&&r.aggregate_away_score!=null)notes.push(`Aggregato ${r.aggregate_home_score}–${r.aggregate_away_score}`);return notes.join(' · ')}
function entity(core,fallback){const name=core?.name||fallback||'—';let img='';try{const u=new URL(String(core?.image_url||'').replace(/^\/\//,'https://'));if(u.protocol==='https:')img=`<img class="core-crest" src="${esc(u.href)}" alt="" loading="lazy">`}catch{}return `<span class="entity">${img}<span>${esc(name)}</span></span>`}
function fixture(r,schedule=false){return `<div class="fixture"><span>${entity(r.home_core,r.home_name)}</span><span class="score">${schedule?'vs':`${esc(r.home_score??'—')} – ${esc(r.away_score??'—')}`}</span><span class="away">${entity(r.away_core,r.away_name)}</span></div>`}
function card(r){if(state.resource==='transfers')return `<article class="card">${meta(r)}<div class="transfer-head"><span>${esc(r.player_core?[r.player_core.forename,r.player_core.surname].filter(Boolean).join(' '):r.player_name||'Giocatore')}</span><span>${esc(r.amount_text||'—')}</span></div><div class="transfer-route">${entity(r.from_core,r.club_from)} <span>→</span> ${entity(r.to_core,r.club_to)}</div>${r.player_core?`<p class="player-core">${esc([r.player_core.position,r.player_core.rating?'Rating attuale '+r.player_core.rating:'',r.player_core.nationality].filter(Boolean).join(' · '))}</p>`:''}${r.exchange_players?`<details><summary>Contropartite</summary>${structured(r.exchange_players)}</details>`:''}</article>`;return `<article class="card">${meta(r)}${fixture(r,state.resource==='schedule')}<div class="card-bottom"><span>${esc(extraScore(r))}</span>${state.resource!=='schedule'?`<a class="report-link" href="${esc(reportURL(r.sm_fixture_id))}">Apri match report →</a>`:''}</div></article>`}
function playerCard(r){const p=r.player_core;return `<article class="card"><h3>${entity(p?{name:[p.forename,p.surname].filter(Boolean).join(' '),image_url:p.image_url}:null,r.player_name)}</h3><p class="player-core">${esc(p?[p.position,p.rating?'Rating attuale '+p.rating:'',p.nationality].filter(Boolean).join(' · '):'')}</p><p class="player-core">Trasferimento del ${esc(date(r.transfer_date))} · ${entity(r.from_core,r.club_from)} → ${entity(r.to_core,r.club_to)}</p></article>`}
$('openWorldMenu').onclick=()=>$('worldNavigation').showModal();$('closeWorldMenu').onclick=()=>$('worldNavigation').close();
const labels={home:'Casa',away:'Ospiti',home_team:'Squadra di casa',away_team:'Squadra ospite',name:'Nome',player_name:'Giocatore',minute:'Minuto',type:'Tipo',text:'Testo',rating:'Voto',position:'Posizione',goals:'Gol',assists:'Assist',possession:'Possesso',shots:'Tiri',shots_on_target:'Tiri in porta',formation:'Modulo',value:'Valore',team:'Squadra',commentary:'Cronaca'};
function label(k){return labels[k]||k.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase())}
function reportTeamLabel(value,record,teams){const id=record.sm_team_id??record.sm_club_id;const side=['home','away'].find(s=>id!=null&&String(teams[s+'_sm_club_id']??teams[s+'_sm_team_id'])===String(id));return side?entity(teams[side+'_core'],value):esc(value)}
function structured(v,teams=null){if(v==null)return '<p>Non disponibile</p>';if(typeof v!=='object')return esc(v);if(Array.isArray(v))return v.length?v.map(x=>`<div class="detail-item">${structured(x,teams)}</div>`).join(''):'<p>Nessun dato disponibile</p>';return `<dl>${Object.entries(v).map(([k,x])=>`<dt>${teams&&['home','away','home_team','away_team'].includes(k)?entity(teams[k.startsWith('home')?'home_core':'away_core'],teams[k.startsWith('home')?'home_name':'away_name']):esc(label(k))}</dt><dd>${typeof x==='object'?`<div class="nested">${structured(x,teams)}</div>`:teams&&k==='team_side'&&['home','away'].includes(x)?entity(teams[x+'_core'],teams[x+'_name']):teams&&['team_name','club_name'].includes(k)?reportTeamLabel(x,v,teams):esc(x)}</dd>`).join('')}</dl>`}
function reportURL(id){return 'match.html?'+new URLSearchParams({world:state.world,fixture:String(id),return:location.pathname+location.search+'#dataSection'})}

function worldMenus(){
const name=worlds[state.world];$('worldTitle').textContent=name;$('menuWorld').textContent=state.world+' · '+name;$('mobileWorldTitle').textContent=state.world+' · '+name;
const menuEntries=[['01','home'],['02','competitions'],['07','manager'],['08','player'],['09','club'],['11','transfers']];
const links=menuEntries.map(([n,id])=>`<a href="?world=${encodeURIComponent(state.world)}&resource=${id}" data-resource="${id}" ${state.resource===id?'aria-current="true"':''}><span>${n}</span>${esc(sections[id])}</a>`).join('');
$('worldMenu').innerHTML=links;$('tabs').innerHTML=links;$('mobileWorldMenu').innerHTML=links;
const icons={manager:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-5 4-7 8-7s6.8 2 8 7"/>',club:'<path d="M12 3 4 7v5c0 5 3.2 8 8 9 4.8-1 8-4 8-9V7Z"/><path d="M8 10h8M9 14h6"/>',home:'<path d="M3 10 12 3l9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',competitions:'<path d="M8 4h8v4c0 3-1.8 5-4 5s-4-2-4-5Z"/><path d="M6 5H4v2c0 2 1.3 3 3 3M18 5h2v2c0 2-1.3 3-3 3M12 13v4M8 21h8M9 17h6v4"/>'};
$('bottomWorldMenu').setAttribute('aria-label','Navigazione mobile · '+state.world+' · '+name);
$('bottomWorldMenu').innerHTML=[['manager','Manager'],['club','Club'],['home','Home'],['competitions','Competition'],['archive','Trophy Room']].map(([id,title])=>`<a href="?world=${encodeURIComponent(state.world)}&resource=${id}" data-resource="${id}" aria-current="${state.resource===id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${icons[id]||icons.competitions}</svg><span>${title}</span></a>`).join('');
}
const L=window.NexusLogic;
const defaults={world:'GW001',resource:'home',offset:0,search:'',from:'',to:'',season:'',competition:'',group:'',country:'',tab:'overview',match:'results',metric:'goals',teamType:'clubs',club:'',position:'',rating_min:'',rating_max:'',age_min:'',age_max:'',value_min:'',value_max:'',sort:'rating',player:'',scope:'world',team:'',manager:'',profileTab:'career',opponent:'',round:''};
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
async function catalogView(c,signal){
 const d=await cached({world:state.world,resource:'catalog',season:state.season},signal);const all=d.rows;
 $('viewControls').innerHTML=form(seasonSelect(c));
 if(!state.group){$('rows').innerHTML=groups.map(([id,title,description])=>{const count=all.filter(x=>compGroup(x)===id).length;return go({group:id,country:'',competition:'',offset:0},`<span class="category-symbol">${competitionIcon(id)}</span><span class="category-art">${competitionIcon(id)}</span><h3>${title}</h3><p>${description}</p><div class="category-foot"><strong><b>${number(count)}</b> ${count===1?'competizione':'competizioni'}</strong><span class="round-arrow" aria-hidden="true">›</span></div>`,'card competition-group-card category-'+id)}).join('');$('status').textContent=`${all.length} competizioni con risultati o calendario · ${state.world}`;return}
 const subset=all.filter(x=>compGroup(x)===state.group),countries=[...new Set(subset.map(x=>x.sm_country).filter(x=>x&&x!=='CUS'))].sort();
 $('viewControls').innerHTML=go({group:'',country:'',competition:''},'← Tutti i gruppi')+tabs('group',groups.map(g=>g.slice(0,2)))+form(seasonSelect(c)+(countries.length?select('country','Paese',[['','Tutti i paesi'],...countries.map(x=>[x,x])]):''));
 const filtered=subset.filter(x=>!state.country||x.sm_country===state.country).sort((a,b)=>String(a.sm_country||'').localeCompare(String(b.sm_country||''))||actionOrder.indexOf(a.sm_action)-actionOrder.indexOf(b.sm_action)||Number(a.sm_division)-Number(b.sm_division));
 $('rows').innerHTML=filtered.map(x=>go({competition:x.competition_key,round:'',tab:state.resource==='archive'?'trophy':state.resource==='standings'?'competition':'overview',offset:0},`<div class="competition-card-head"><span class="competition-symbol">${x.sm_action==='league'?esc(x.sm_division||''):competitionIcon(compGroup(x))}</span><div><span class="eyebrow">${esc([x.sm_country,x.sm_action_group].filter(Boolean).join(' · '))}</span><h3>${esc(compName(x))}</h3></div><span class="round-arrow" aria-hidden="true">›</span></div><div class="competition-metrics"><div><small>Risultati</small><strong>${number(x.results_count||0)}</strong></div><div><small>Calendario</small><strong>${number(x.schedule_count||0)}</strong></div><div><small>Prossima data</small><strong>${x.next_date?date(x.next_date):'—'}</strong></div></div>`,'card competition-entry')).join('')||empty('Nessuna competizione con dati per questa selezione.');$('status').textContent=`${filtered.length} competizioni · ${state.world}`;
}
async function competitionView(c,signal){
 const d=await cached({world:state.world,resource:'competition',competition:state.competition,season:state.season},signal),comp=d.competition;
 const results=L.unique(d.results),schedule=L.unique(d.schedule),done=results.filter(L.completed),gs=[...new Set([...results,...schedule].map(L.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
 const isLeague=comp.sm_action==='league'&&!gs.length;
 $('dataSection').setAttribute('data-category',compGroup(comp));
 $('sectionTitle').textContent=compName(comp);
 $('viewControls').innerHTML=go({competition:'',tab:'overview',offset:0},'← Elenco competizioni')+form(seasonSelect(c))+(!c.seasons.length?'':'')+tabs('tab',[['overview','Panoramica'],['competition','Competizione'],['matches','Partite'],['stats','Statistiche'],['trophy','Trophy Room']]);
 $('status').textContent=`${state.world} · ${number(done.length)} risultati completati · Stagione ${state.season||'non definita'}`;
 if(state.tab==='overview'){
   const latest=[...done].sort((a,b)=>String(b.match_date).localeCompare(String(a.match_date)))[0],today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}),next=schedule.find(r=>r.match_date>=today),teams=new Set([...results,...schedule].flatMap(r=>[r.home_name,r.away_name]).filter(Boolean)),expected=Number(comp.expected_match)||0;
   $('rows').innerHTML=`<article class="card"><div class="stat-row"><div><strong>${comp.teams_count||teams.size}</strong><small>Squadre ${comp.teams_count?'previste':'nei dati'}</small></div><div><strong>${done.length}${expected?' / '+expected:''}</strong><small>Partite completate${expected?' / previste':''}</small></div>${expected?`<div><strong>${Math.round(done.length/expected*100)}%</strong><small>Risultati disponibili</small></div>`:''}</div></article>${latest?'<h3>Ultima partita</h3>'+matchCard(latest):empty('Nessun risultato importato.')}${next?'<h3>Prossima partita</h3>'+matchCard(next,true):empty('Nessun incontro futuro nel calendario importato.')}${isLeague&&done.length?`<h3>In testa alla classifica</h3><article class="card">${entity(L.standings(done)[0].core,L.standings(done)[0].name)} · ${L.standings(done)[0].pts} punti</article>`:''}`;
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
 }else{
   const oneOff=['charityshield','supercup'].includes(comp.sm_action)&&done.length===1&&schedule.length===0;
   const winner=L.winner(oneOff?[{...done[0],competition_stage:'Finale'}]:results,schedule);
   $('rows').innerHTML=winner?`<article class="card trophy-card"><span class="eyebrow">VINCITORE · STAGIONE ${esc(state.season)}</span><h3>${entity(winner.core,winner.name)}</h3><p>Finale del ${date(winner.match.match_date)}</p>${matchCard(winner.match)}</article>`:empty('Vincitore non ancora determinabile con certezza dai dati conclusivi disponibili.');
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
 $('viewControls').innerHTML+=form(select('season','Stagione',[['','Tutte le stagioni'],...c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season])]));
 const d=await cached({world:state.world,resource:'manager_profile',manager:state.manager,season:state.season},signal),id=d.manager.sm_manager_id,rows=L.managerRows(d.rows,id,d.assignments,national);
 const note=``;
 $('rows').innerHTML=header+note;
 if(!id){$('rows').innerHTML+=empty('ID Soccer Manager non disponibile: statistiche e trofei non attribuibili.');return}
 if(state.profileTab==='stats'){
 $('rows').innerHTML+=managerSummary(rows,id);
 const comps=new Map();for(const r of rows){const key=r.competition_key||'';if(!comps.has(key))comps.set(key,[]);comps.get(key).push(r)}
 $('rows').innerHTML+=`<h3>Per competizione</h3><div class="hub-table-wrap"><table class="hub-table manager-competition-table"><thead><tr><th>Competizione</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th></tr></thead><tbody>${[...comps].map(([key,rs])=>{const st=L.managerStats(rs,id),r=rs[0],name=compName(r.competition_core||r);return `<tr><td>${key?go({resource:'competitions',competition:key,manager:'',group:compGroup(r.competition_core||r),tab:'overview',offset:0},esc(name)):esc(name)}</td>${['p','w','d','l','gf','ga'].map(k=>`<td>${st[k]}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;
 }else if(state.profileTab==='matches'){
 page(header+note+matchGroups(rows.slice(state.offset,state.offset+50)),rows.length,'partite attribuite');
 }else if(state.profileTab==='h2h'){
 const opponents=new Map();for(const r of rows){const side=L.managerSide(r,id)==='home'?'away':'home',oid=r[side+'_sm_manager_id'];if(!oid)continue;const m=r[side+'_manager_core'];opponents.set(String(oid),r[side+'_manager_name']||m?.full_name||'Manager SM '+oid)}
 $('viewControls').innerHTML+=form(select('opponent','Avversario',[['','Scegli un manager'],...[...opponents].sort((a,b)=>a[1].localeCompare(b[1],'it'))]));
 const h2h=state.opponent?rows.filter(r=>String(r[(L.managerSide(r,id)==='home'?'away':'home')+'_sm_manager_id'])===state.opponent):[];
 if(state.opponent)page(header+note+`<h3>Contro ${esc(opponents.get(state.opponent)||'manager non presente nella selezione')}</h3>`+managerSummary(h2h,id)+matchGroups(h2h.slice(state.offset,state.offset+50)),h2h.length,'scontri diretti');
 else $('rows').innerHTML+=empty(opponents.size?'Seleziona un avversario per confrontare risultati e statistiche.':'Nessuna partita con entrambi gli ID manager disponibili.');
 }else if(state.profileTab==='trophy'){
 const candidates=new Map();for(const r of rows){if(!r.competition_key||!r.imc_season)continue;if(/^(finale?|playoff finale?)$/i.test(r.competition_stage||'')||/^(finale?|playoff finale?)$/i.test(r.competition_round||'')||['charityshield','supercup'].includes(r.sm_action))candidates.set(r.competition_key+'|'+r.imc_season,r)}
 const trophies=[];for(const r of candidates.values()){
 const hub=await cached({world:state.world,resource:'competition_reports',competition:r.competition_key,season:r.imc_season},signal);
 const done=L.unique(hub.reports).filter(L.completed),oneOff=['charityshield','supercup'].includes(hub.competition.sm_action)&&done.length===1&&hub.schedule.length===0;
 const w=L.winner(oneOff?[{...done[0],competition_stage:'Finale'}]:hub.reports,hub.schedule);
 const report=w&&rows.find(x=>sameId(x.sm_fixture_id,w.match.sm_fixture_id));
 if(w&&report&&L.managerSide(report,id)===w.side)trophies.push(`<article class="card trophy-card"><span class="eyebrow">VINCITORE · STAGIONE ${esc(r.imc_season)}</span><h3>${go({resource:'competitions',competition:r.competition_key,season:r.imc_season,manager:'',tab:'trophy',offset:0},esc(compName(hub.competition)))}</h3>${entity(w.core,w.name)}<p>${date(w.match.match_date)}</p>${matchCard(w.match)}</article>`);
 }
 $('rows').innerHTML+=``+(trophies.join('')||empty('Nessun trofeo attribuibile con certezza nei dati disponibili.'));
 }
}
async function teamProfile(c,signal){
 const national=state.teamType==='nations',team=(national?c.nations:c.clubs).find(t=>sameId(t.id,state.team));
 $('viewControls').innerHTML=go({team:'',offset:0},national?'← Tutte le nazionali':'← Tutti i club');
 if(!team){$('rows').innerHTML=empty('Squadra non presente in questo mondo.');$('status').textContent=state.world;return}
 $('sectionTitle').textContent=team.name;
 $('viewControls').innerHTML+=tabs('profileTab',[['career','Manager'],['stats','Statistiche'],['matches','Partite']]);
 if(['stats','matches'].includes(state.profileTab)){
 $('viewControls').innerHTML+=form(select('season','Stagione',[['','Tutte le stagioni'],...c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season])]));
 const d=await cached({world:state.world,resource:'team_profile',team:state.team,teamType:state.teamType,season:state.season},signal),rows=L.unique(d.rows).filter(L.completed);
 const note='';
 const heading=`<article class="card profile-heading">${entity(team,team.name)}</article>`;
 if(!rows.length){const message=d.mapping_status==='missing'?'ID della squadra nel mondo non ancora presente nel mapping CORE.':d.mapping_status==='ambiguous'?'ID del mondo associato a più squadre: collegamento sospeso per evitare statistiche errate.':'Nessun match report completato disponibile per questa squadra e stagione.';$('rows').innerHTML=heading+note+empty(message);$('status').textContent=state.world+' · 0 report collegati';return}
 if(state.profileTab==='matches')page(heading+note+matchGroups(rows.slice(state.offset,state.offset+50)),rows.length,'match report');
 else {const adapted=rows.map(r=>({...r,home_sm_manager_id:r.home_sm_club_id,away_sm_manager_id:r.away_sm_club_id}));$('rows').innerHTML=heading+note+managerSummary(adapted,d.team.sm_team_id);$('status').textContent=state.world+' · '+rows.length+' match report';}return;
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
function transferCard(r,latest=false){const p=r.player_core;return `<article class="card ${latest?'latest-transfer':''}">${latest?'<span class="eyebrow">ULTIMO TRASFERIMENTO DELLA SELEZIONE</span>':''}${meta(r)}<div class="transfer-head">${entity({name:p?[p.forename,p.surname].filter(Boolean).join(' '):r.player_name,image_url:p?.image_url},r.player_name)}<strong>${esc(r.amount_text||'—')}</strong></div>${p?`<p class="player-core">${esc([p.rating?'Rating attuale '+p.rating:'',p.age?p.age+' anni':'',p.position].filter(Boolean).join(' · '))}</p>`:''}<div class="transfer-route">${entity(r.from_core,r.club_from)}<span>→</span>${entity(r.to_core,r.club_to)}</div>${r.exchange_players?`<details><summary>Contropartite</summary>${structured(r.exchange_players)}</details>`:''}</article>`}
async function transfersView(c,signal){
 const d=await fetchData({...state,resource:'transfers',limit:50},signal);
 $('viewControls').innerHTML=form(select('club','Squadra',[['','Tutte le squadre'],...(d.clubs||[]).map(r=>[r.id,r.name])])+select('season','Stagione',[['','Tutte le stagioni'],...c.seasons.map(s=>[s.imc_season,'Stagione '+s.imc_season])])+input('search','Cerca giocatore o squadra')+input('from','Dal','date')+input('to','Al','date'));
 page(d.rows.map((r,i)=>transferCard(r,state.offset===0&&i===0)).join(''),d.total,'trasferimenti');$('status').textContent+=d.updated_at?' · Aggiornato al '+date(d.updated_at)+' '+d.updated_at.slice(11,16):'';
}
async function directoryView(signal){const d=await cached({world:state.world,resource:'directory'},signal),c=d.core;
 if(c.world?.world_name){worlds[state.world]=c.world.world_name;worldMenus()}
 if(['competitions','archive','standings'].includes(state.resource)){
   if(!state.season&&c.seasons.length){state.season=String(c.seasons[0].imc_season);history.replaceState(null,'',urlState())}
   if(state.competition)await competitionView(c,signal);else await catalogView(c,signal);
 }else if(state.resource==='club')await teamsView(c,signal);
 else if(state.resource==='player')await playersView(c,signal);
 else if(state.resource==='transfers')await transfersView(c,signal);
 else if(state.resource==='manager'){await managersView(c,signal);
 }else{$('rows').innerHTML=`<section class="card"><h3>${esc(c.world?.world_name||state.world)}</h3><div class="stat-row"><div><strong>${number(c.world?.active_clubs||c.clubs.length)}</strong><small>Club del mondo</small></div><div><strong>${number(new Set(c.managers.map(m=>m.manager_id)).size)}</strong><small>Manager IMC con incarichi</small></div><div><strong>${esc(c.seasons[0]?.imc_season||'—')}</strong><small>Stagione IMC più recente</small></div></div><p>Scegli una sezione dal menu di ${esc(state.world)}.</p></section>`;$('status').textContent=state.world+' · '+worlds[state.world]}
}
async function load(push=false){
 $('dataSection').setAttribute('data-competition-view',['competitions','standings','archive'].includes(state.resource)?'true':'false');$('dataSection').setAttribute('data-category',state.group||'domestic');
 if(controller)controller.abort();controller=new AbortController();const active=controller;
 if(push)history.pushState(null,'',urlState());$('world').value=state.world;worldMenus();
 const isDirectory=['home','competitions','manager','club','standings','archive','player','transfers'].includes(state.resource);
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

