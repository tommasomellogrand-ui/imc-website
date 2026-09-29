'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={complete:'Completa',pending:'Da giocare',today:'In programma oggi',missing_results:'Risultato mancante',missing_report:'Report mancante',orphan_results:'Results senza Schedule',orphan_report:'Report senza Results',anomaly:'Dati da verificare'};
let csrf='',meta=null,report=null,serial=0,limit=100;
for(let i=1;i<=10;i++){const gw='GW'+String(i).padStart(3,'0');$('world').add(new Option(gw,gw));}
const initial=new URLSearchParams(location.search).get('world');if(/^GW00[1-9]$|^GW010$/.test(initial||''))$('world').value=initial;
async function request(query='',body=null){
 const response=await fetch('api.php'+query,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!response.ok||!data.ok){if(response.status===401){$('workspace').hidden=true;$('login').hidden=false;$('logout').hidden=true;}throw Error(data.error||'Controllo non riuscito.');}return data;
}
function clear(){report=null;$('summary').replaceChildren();$('checks').replaceChildren();$('filters').hidden=true;$('more').hidden=true;$('check-count').textContent='';}
function query(action){return '?'+new URLSearchParams({action,world:$('world').value,season:$('season').value,date:$('date').value});}
async function loadDates(resetSeason=false){const version=++serial;clear();meta=null;$('run').disabled=true;$('date').replaceChildren();$('message').textContent='Caricamento delle date…';if(resetSeason)$('season').value='';
 try{const data=await request(query('check-meta'));if(version!==serial)return;meta=data;const season=$('season').value;$('season').replaceChildren(new Option('Tutte le stagioni',''));data.seasons.forEach(s=>$('season').add(new Option('Stagione '+s,s)));$('season').value=season;
  data.dates.forEach(d=>$('date').add(new Option(`${d.date==='undated'?'Senza data':d.date} · ${d.schedule} / ${d.results} / ${d.report}`,d.date)));
  const past=data.dates.filter(d=>d.date!=='undated'&&d.date<=data.today);if(past.length)$('date').value=past[past.length-1].date;
  $('run').disabled=!data.dates.length;$('message').textContent=data.dates.length?'Seleziona una data ed esegui il controllo.':'Nessuna partita presente per questa selezione.';
 }catch(e){if(version===serial)$('message').textContent=e.message;}
}
function fillFilter(id,values,label){$(id).replaceChildren(new Option(label,''));[...new Set(values.filter(Boolean))].sort().forEach(v=>$(id).add(new Option(v,v)));}
async function run(){const version=++serial;clear();$('run').disabled=true;$('message').textContent='Verifica Schedule → Results → Match Report…';
 try{const result=await request(query('results-check'));if(version!==serial)return;report=result;limit=100;$('state').value='all';fillFilter('country',result.rows.map(r=>r.country),'Tutti');fillFilter('competition',result.rows.map(r=>r.competition),'Tutte');$('country-label').hidden=!['GW002','GW003','GW007','GW008'].includes(result.world);$('filters').hidden=false;
 const s=result.summary;$('summary').innerHTML=`<span><strong>${s.fixtures}</strong> partite</span><span>Schedule <strong>${s.schedule}</strong></span><span>Results <strong>${s.results}</strong></span><span>Match Report <strong>${s.report}</strong></span><span>Complete <strong>${s.complete}</strong></span>`;
 $('message').textContent='Controllo completato. I collegamenti includono eventuali record con data o stagione diversa.';render();
 }catch(e){if(version===serial)$('message').textContent=e.message;}finally{if(version===serial)$('run').disabled=!meta?.dates.length;}
}
function source(title,rows){return `<div class="source-box"><h3>${title} · ${rows.length}</h3>${rows.length?rows.map(r=>`<div class="source-record"><p>${esc(r.home_name)} — ${esc(r.away_name)}</p><p>Fixture ID: ${esc(r.sm_fixture_id??'—')}</p><p>Data: ${esc(r.match_date||'—')} · Stagione: ${esc(r.imc_season??'—')}</p><p>${esc(r.competition_key||'—')}</p><p>Country: ${esc(r.sm_country||'—')} · Divisione: ${esc(r.sm_division??'—')}</p><p>ID squadre: ${esc(r.home_id??'—')} / ${esc(r.away_id??'—')}</p></div>`).join(''):'<p class="muted">Nessun record collegato</p>'}</div>`;}
function render(){if(!report)return;const state=$('state').value;const rows=report.rows.filter(r=>(state==='all'||(state==='issues'?r.issues.length>0:r.state===state))&&(!$('country').value||r.country===$('country').value)&&(!$('competition').value||r.competition===$('competition').value));
 $('check-count').textContent=`${rows.length} partite corrispondenti · ${Math.min(limit,rows.length)} visualizzate`;
 $('checks').innerHTML=rows.slice(0,limit).map(r=>`<details class="check-row"><summary><div><strong>${esc(r.home||'Squadra non indicata')} — ${esc(r.away||'Squadra non indicata')}</strong><small>Fixture ${esc(r.fixture_id??'ID mancante')} · ${esc(r.competition)}</small></div><div class="check-path"><span>Schedule ${r.schedule.length}</span>→<span>Results ${r.results.length}</span>→<span>Report ${r.report.length}</span></div><span class="check-state ${r.state}">${labels[r.state]}</span></summary>${r.issues.length?`<p class="check-issues">${r.issues.map(esc).join(' · ')}</p>`:''}<div class="source-grid">${source('Schedule',r.schedule)}${source('Results',r.results)}${source('Match Report',r.report)}</div></details>`).join('')||'<p>Nessuna partita per questi filtri.</p>';$('more').hidden=rows.length<=limit;
}
$('world').addEventListener('change',()=>loadDates(true));$('season').addEventListener('change',()=>loadDates());$('reload').addEventListener('click',()=>loadDates());$('date').addEventListener('change',()=>{serial++;clear();$('run').disabled=!meta?.dates.length;$('message').textContent='Seleziona Esegui controllo per verificare questa data.';});$('run').addEventListener('click',run);
for(const id of ['state','country','competition'])$(id).addEventListener('change',()=>{limit=100;render();});$('more').addEventListener('click',()=>{limit+=100;render();});
$('logout').addEventListener('click',async()=>{try{await request('',{action:'logout'});location.reload();}catch(e){$('message').textContent=e.message;}});
(async()=>{const access=new URLSearchParams(location.hash.slice(1)).get('access');if(access)history.replaceState(null,'',location.pathname+location.search);try{const session=access?await request('',{action:'login',access_token:access}):await request('?action=session');csrf=session.csrf;$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;await loadDates();}catch(e){$('message').textContent=e.message;}})();
$('login-form').addEventListener('submit',async e=>{e.preventDefault();$('login-submit').disabled=true;$('message').textContent='Accesso…';try{const result=await request('',{action:'login',username:$('login-username').value,password:$('login-password').value});csrf=result.csrf;$('login-password').value='';$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;$('message').textContent='';await loadDates();}catch(err){$('message').textContent=err.message;}finally{$('login-submit').disabled=false;}});
