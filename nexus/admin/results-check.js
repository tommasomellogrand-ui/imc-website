'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={complete:'Completa',pending:'Da giocare',today:'In programma oggi',missing_results:'Risultato mancante',missing_report:'Report mancante',orphan_results:'Results senza Schedule',orphan_report:'Report senza Results',anomaly:'Dati da verificare'};
let csrf='',meta=null,report=null,serial=0,limit=100,period='past',dateLimit=14;
for(let i=1;i<=11;i++){const gw='GW'+String(i).padStart(3,'0');$('world').add(new Option(gw,gw));}
const initial=new URLSearchParams(location.search).get('world');if(/^GW00[1-9]$|^GW01[01]$/.test(initial||''))$('world').value=initial;
async function request(query='',body=null){
 const response=await fetch('api.php'+query,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!response.ok||!data.ok){if(response.status===401){$('workspace').hidden=true;$('login').hidden=false;$('logout').hidden=true;}throw Error(data.error||'Controllo non riuscito.');}return data;
}
function clear(){report=null;$('summary').replaceChildren();$('checks').replaceChildren();$('filters').hidden=true;$('more').hidden=true;$('check-count').textContent='';}
function query(action){return '?'+new URLSearchParams({action,world:$('world').value,season:$('season').value,date:$('date').value});}
function formatDate(day){if(day==='undated')return 'Senza data';return new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Rome'}).format(new Date(day+'T12:00:00+01:00'));}
function competitionName(c){
 const parts=String(c.competition||'').split('|');const action=String(c.action||parts.find(p=>['league','cup','shield','worldcup','smfacup','smfashield','friendly'].includes(p.toLowerCase()))||'').toLowerCase();
 const names={league:'Campionato',cup:'Coppa nazionale',shield:'League Shield',leaguecup:'League Cup',worldcup:'World Cup',smfacup:'SMFA Champions Cup',smfashield:'SMFA Shield',friendly:'Amichevoli',charityshield:'Charity Shield',smfasupercup:'SMFA Super Cup'};
 return (names[action]||parts.filter(p=>!/^GW\d+$/.test(p)&&!['DOMESTIC','INTERNATIONAL','NATIONS','IMC'].includes(p)).join(' · ')||'Competizione non indicata')+(c.division&&action==='league'?' · Divisione '+c.division:'');
}
function family(c){return ['NATIONS','INTERNATIONAL','IMC'].find(f=>String(c.competition).split('|').includes(f))||'DOMESTIC';}
function renderCoverage(){
 $('coverage-note').textContent=meta.imc_only?'GOLD · Schedule e Results completi. Match Report solo per manager IMC con assegnazione valida alla data della partita. Gli attesi sono partite uniche con Results.':'Conteggi della stagione selezionata. Match Report attesi: partite uniche con Results.';
 const groups=meta.competitions||[];
 $('competition-cards').innerHTML=['DOMESTIC','IMC','INTERNATIONAL','NATIONS'].map(f=>{
 const list=groups.filter(c=>family(c)===f).sort((a,b)=>String(a.country).localeCompare(String(b.country))||competitionName(a).localeCompare(competitionName(b),'it',{numeric:true}));
 return list.length?`<h3 class="family-title">${f}</h3><div class="competition-grid">${list.map(c=>`<div class="competition-card"><p class="eyebrow">${esc(c.country||meta.world)}</p><h3>${esc(competitionName(c))}</h3><div class="coverage-numbers"><div><span>Schedule</span><strong>${c.schedule}</strong></div><div><span>Results</span><strong>${c.results}</strong></div><div><span>${meta.imc_only?'MR IMC':'Match Report'}</span><strong>${c.report}</strong></div></div><p class="coverage-status ${c.missing_reports?'attention':'ok'}">${c.expected_report} MR attesi · ${c.missing_reports?c.missing_reports+' mancanti':'nessun mancante'}</p></div>`).join('')}</div>`:'';
 }).join('')||'<p class="muted">Nessuna competizione disponibile.</p>';
}
function periodDates(){return (meta?.dates||[]).filter(d=>period==='past'?(d.date==='undated'||d.date<meta.today||d.results>0||d.report>0):(d.date!=='undated'&&d.date>=meta.today&&d.schedule>0)).sort((a,b)=>a.date==='undated'?1:b.date==='undated'?-1:period==='past'?b.date.localeCompare(a.date):a.date.localeCompare(b.date));}
function renderDates(){
 const dates=periodDates();$('past-tab').setAttribute('aria-pressed',String(period==='past'));$('future-tab').setAttribute('aria-pressed',String(period==='future'));
 $('period-note').textContent=period==='past'?'Date trascorse e giornate con risultati già importati, dalla più recente. Una data trascorsa non conferma da sola che la partita sia stata giocata.':'Da oggi in avanti, dalla data più vicina. Le partite di oggi senza risultato restano in programma.';
 $('date-cards').innerHTML=dates.slice(0,dateLimit).map(d=>`<button class="date-card" type="button" data-date="${esc(d.date)}" aria-pressed="${d.date===$('date').value}"><strong>${esc(formatDate(d.date))}</strong><span>Schedule ${d.schedule} · Results ${d.results}</span><small>${meta.imc_only?'MR IMC':'Match Report'} ${d.report}</small></button>`).join('')||'<p class="muted">Nessuna data in questo periodo.</p>';
 $('more-dates').hidden=dates.length<=dateLimit;
}
async function loadDates(resetSeason=false){const version=++serial;clear();meta=null;$('run').disabled=true;$('date').value='';$('date-cards').replaceChildren();$('competition-cards').replaceChildren();$('message').textContent='Caricamento competizioni e giornate…';if(resetSeason)$('season').value='';
 try{const data=await request(query('check-meta'));if(version!==serial)return;meta=data;const season=$('season').value;$('season').replaceChildren(new Option('Tutte le stagioni',''));data.seasons.forEach(s=>$('season').add(new Option('Stagione '+s,s)));$('season').value=season;
  dateLimit=14;const dates=periodDates();$('date').value=dates[0]?.date||'';
  renderCoverage();renderDates();$('run').disabled=!$('date').value;$('message').textContent=data.dates.length?'Scegli una giornata per controllare le singole partite.':'Nessuna partita presente per questa selezione.';
  if($('date').value)await run();
 }catch(e){if(version===serial)$('message').textContent=e.message;}
}
function fillFilter(id,values,label){$(id).replaceChildren(new Option(label,''));[...new Set(values.filter(Boolean))].sort().forEach(v=>$(id).add(new Option(v,v)));}
async function run(){const version=++serial;clear();$('run').disabled=true;$('message').textContent='Verifica Schedule → Results → Match Report…';
 try{const result=await request(query('results-check'));if(version!==serial)return;report=result;limit=100;$('state').value='all';fillFilter('country',result.rows.map(r=>r.country),'Tutti');fillFilter('competition',result.rows.map(r=>r.competition),'Tutte');$('country-label').hidden=!['GW002','GW003','GW007','GW008'].includes(result.world);$('filters').hidden=false;
 const s=result.summary;$('summary').innerHTML=`<span><strong>${s.fixtures}</strong> partite</span><span>Schedule <strong>${s.schedule}</strong></span><span>Results <strong>${s.results}</strong></span><span>Match Report <strong>${s.report}</strong></span><span>MR attesi <strong>${s.expected_report??0}</strong></span><span>MR mancanti <strong>${s.missing_reports??0}</strong></span>`;
 $('message').textContent='Controllo della giornata completato. I record collegati possono avere date o stagioni diverse.';render();
 }catch(e){if(version===serial)$('message').textContent=e.message;}finally{if(version===serial)$('run').disabled=!$('date').value;}
}
function source(title,rows){return `<div class="source-box"><h3>${title} · ${rows.length}</h3>${rows.length?rows.map(r=>`<div class="source-record"><p>${esc(r.home_name)} — ${esc(r.away_name)}</p><p>Fixture ID: ${esc(r.sm_fixture_id??'—')}</p><p>Data: ${esc(r.match_date||'—')} · Stagione: ${esc(r.imc_season??'—')}</p><p>${esc(r.competition_key||'—')}</p><p>Country: ${esc(r.sm_country||'—')} · Divisione: ${esc(r.sm_division??'—')}</p><p>ID squadre: ${esc(r.home_id??'—')} / ${esc(r.away_id??'—')}</p></div>`).join(''):'<p class="muted">Nessun record collegato</p>'}</div>`;}
function render(){if(!report)return;const state=$('state').value;const rows=report.rows.filter(r=>(state==='all'||(state==='issues'?r.issues.length>0:r.state===state))&&(!$('country').value||r.country===$('country').value)&&(!$('competition').value||r.competition===$('competition').value));
 $('check-count').textContent=`${rows.length} partite corrispondenti · ${Math.min(limit,rows.length)} visualizzate`;
 $('checks').innerHTML=rows.slice(0,limit).map(r=>`<details class="check-row"><summary><div><strong>${esc(r.home||'Squadra non indicata')} — ${esc(r.away||'Squadra non indicata')}</strong><small>Fixture ${esc(r.fixture_id??'ID mancante')} · ${esc(r.competition)} · ${esc(formatDate(r.date||r.schedule[0]?.match_date?.slice(0,10)||r.results[0]?.match_date?.slice(0,10)||'undated'))}</small></div><div class="check-path"><span>Schedule ${r.schedule.length}</span>→<span>Results ${r.results.length}</span>→<span>Report ${r.report.length}</span></div><span class="check-state ${r.state}">${labels[r.state]}${meta?.imc_only&&!r.report_required&&r.results.length?' · MR non richiesto':''}</span></summary>${r.issues.length?`<p class="check-issues">${r.issues.map(esc).join(' · ')}</p>`:''}<div class="source-grid">${source('Schedule',r.schedule)}${source('Results',r.results)}${source('Match Report',r.report)}</div></details>`).join('')||'<p>Nessuna partita per questi filtri.</p>';$('more').hidden=rows.length<=limit;
}
for(const [id,value] of [['past-tab','past'],['future-tab','future']])$(id).addEventListener('click',()=>{if(!meta)return;period=value;dateLimit=14;serial++;clear();$('date').value=periodDates()[0]?.date||'';renderDates();$('run').disabled=!$('date').value;if($('date').value)run();});
$('date-cards').addEventListener('click',e=>{const button=e.target.closest('[data-date]');if(!button)return;$('date').value=button.dataset.date;renderDates();run();});
$('more-dates').addEventListener('click',()=>{dateLimit+=14;renderDates();});
$('world').addEventListener('change',()=>loadDates(true));$('season').addEventListener('change',()=>loadDates());$('reload').addEventListener('click',()=>loadDates());$('date').addEventListener('change',()=>{serial++;clear();$('run').disabled=!$('date').value;$('message').textContent='Seleziona Esegui controllo per verificare questa data.';});$('run').addEventListener('click',run);
for(const id of ['state','country','competition'])$(id).addEventListener('change',()=>{limit=100;render();});$('more').addEventListener('click',()=>{limit+=100;render();});
$('logout').addEventListener('click',async()=>{try{await request('',{action:'logout'});location.reload();}catch(e){$('message').textContent=e.message;}});
(async()=>{const access=new URLSearchParams(location.hash.slice(1)).get('access');if(access)history.replaceState(null,'',location.pathname+location.search);try{const session=access?await request('',{action:'login',access_token:access}):await request('?action=session');csrf=session.csrf;$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;await loadDates();}catch(e){$('message').textContent=e.message;}})();
$('login-form').addEventListener('submit',async e=>{e.preventDefault();$('login-submit').disabled=true;$('message').textContent='Accesso…';try{const result=await request('',{action:'login',username:$('login-username').value,password:$('login-password').value});csrf=result.csrf;$('login-password').value='';$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;$('message').textContent='';await loadDates();}catch(err){$('message').textContent=err.message;}finally{$('login-submit').disabled=false;}});
