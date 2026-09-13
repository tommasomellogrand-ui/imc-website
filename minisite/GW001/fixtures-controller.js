import { readFixtures, selectFixtures, countries, validDay, romeDay } from './data-client.js';
export const displayDate=s=>validDay(s)?new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z')):'Data non disponibile';
export const extraScores=(r,esc)=>[['Rigori',r.penalty_home_score,r.penalty_away_score],['Aggregato',r.aggregate_home_score,r.aggregate_away_score]].filter(([,h,a])=>h!=null||a!=null).map(([label,h,a])=>`<div class="scorefoot score-foot">${label}: ${esc(h??'—')} – ${esc(a??'—')}</div>`).join('');
/** Package-owned renderers retain their shells and markup; the controller owns data and URL state only. */
export function mountFixtures({gw,resource,render,esc}) {
  let data=null,controller=null,loading=false,generation=0,dataReadClock=0,renderedSignature='';
  const status=document.getElementById('live-state'),count=document.getElementById('result-count');
  const competition=document.getElementById('competition-filter'),day=document.getElementById('date-filter'),country=document.getElementById('filter');
  const controls=[competition,day,country,...document.querySelectorAll('[data-division]')].filter(Boolean);
  const setStatus=(state,text)=>{status.dataset.state=state;status.textContent=text;};
  const query=()=>new URLSearchParams(location.search);
  function options(select,values,allLabel){if(!select)return;select.innerHTML=`<option value="all">${allLabel}</option>`+values.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('');}
  function draw(){
    if(!data)return;
    const q=query(),division=q.get('division')||'all',territory=q.get('k')||'ALL',key=q.get('competition')||'all',date=q.get('date')||'all',id=q.get('id');
    document.querySelectorAll('[data-division]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.division===division)));
    if(country)country.value=countries.includes(territory)?territory:'ALL';
    // Options follow the active division/Kingdom but preserve an incompatible deep link visibly.
    const contextual=selectFixtures(data.rows,{division:gw==='GW001'?division:'all',country:gw==='GW007'?territory:'ALL'});
    const comps=[...new Map(contextual.filter(r=>r.competition_key).map(r=>[r.competition_key,r.competition_label]))].sort((a,b)=>a[1].localeCompare(b[1]));
    if(key!=='all'&&!comps.some(([k])=>k===key))comps.push([key,'Competizione non disponibile']);
    options(competition,comps,'Tutte le competizioni');competition.value=key;
    if(day){const dates=[...new Set(contextual.filter(r=>key==='all'||r.competition_key===key).map(r=>r.match_date).filter(validDay))].sort().reverse();if(date!=='all'&&!dates.includes(date))dates.push(date);options(day,dates.map(d=>[d,displayDate(d)]),'Tutte le date');day.value=date;}
    const invalid=(gw==='GW001'&&!['all','1','2','3','4'].includes(division))||(gw==='GW007'&&!['ALL',...countries].includes(territory))||(key!=='all'&&!data.rows.some(r=>r.competition_key===key))||(date!=='all'&&!validDay(date))||(id&&!data.rows.some(r=>r.sm_fixture_id===id));
    const records=invalid?[]:selectFixtures(data.rows,{division:gw==='GW001'?division:'all',country:gw==='GW007'?territory:'ALL',competition:key,date,id});
    const signature=data.meta.revision+'|'+q.toString();
    if(signature!==renderedSignature){render(records);renderedSignature=signature;}count.textContent=`${records.length} ${resource==='results'?'risultati':'incontri'}`;
    status.dataset.received=String(data.rows.length);status.dataset.shown=String(records.length);status.dataset.sourceTotal=String(data.meta.source_total);status.dataset.pastExcluded=String(data.meta.past_excluded);status.dataset.today=data.meta.today;status.dataset.gameWorld=gw;
    const fetched=new Date(data.meta.read_at).toLocaleString('it-IT',{timeZone:'Europe/Rome'});
    const provenance=`Lettura live · ${fetched} (Europe/Rome).`;
    if(invalid)setStatus('not-found','Il riferimento richiesto non è disponibile. '+provenance);
    else if(data.sourceState.status==='degraded')setStatus('degraded','Dati parzialmente incompleti nella fonte. I valori mancanti sono indicati con —. '+provenance);
    else if(!records.length)setStatus('empty',(resource==='schedule'?'Nessun incontro da oggi per questi filtri. ':'Nessun risultato per questi filtri. ')+provenance);
    else setStatus('ready',provenance);
  }
  function update(changes){const q=query();for(const [k,v] of Object.entries(changes)){if(v===null||v==='all'||v==='ALL')q.delete(k);else q.set(k,v);}history.pushState(null,'',location.pathname+(q.size?'?'+q:''));draw();}
  competition.addEventListener('change',()=>update({competition:competition.value,id:null}));
  day?.addEventListener('change',()=>update({date:day.value,id:null}));
  country?.addEventListener('change',()=>update({k:country.value,competition:null,id:null}));
  document.querySelectorAll('[data-division]').forEach(b=>b.addEventListener('click',()=>update({division:b.dataset.division,competition:null,id:null})));
  window.addEventListener('popstate',draw);
  async function load(){
    controller?.abort();controller=new AbortController();const requestController=controller,current=++generation;loading=true;
    // Keep the last explicit live read while refreshing, except across the server's Rome day boundary.
    if(data&&resource==='schedule'&&romeDay(new Date(Date.parse(data.meta.read_at)+performance.now()-dataReadClock))!==data.meta.today)data=null;
    controls.forEach(c=>c.disabled=!data);
    if(!data){render([]);renderedSignature='';count.textContent='';setStatus('loading','Caricamento in corso…');}
    else setStatus('stale','Aggiornamento in corso · dati dell’ultima lettura ancora visibili.');
    const timeout=setTimeout(()=>requestController.abort(),45000);
    try {const next=await readFixtures(gw,resource,{signal:controller.signal});if(current!==generation)return;data=next;dataReadClock=performance.now();draw();}
    catch(error){if(current!==generation)return;data=null;render([]);renderedSignature='';count.textContent='';for(const k of Object.keys(status.dataset))delete status.dataset[k];setStatus(error.message==='source_changed'?'stale':'error',error.message==='source_changed'?'La fonte è cambiata durante la lettura. Riprova per ottenere dati coerenti.':'Lettura non disponibile. Nessun dato sostitutivo viene mostrato.');const retry=document.createElement('button');retry.type='button';retry.textContent='Riprova';retry.addEventListener('click',load);status.append(' ',retry);}
    finally{clearTimeout(timeout);if(current===generation){loading=false;controls.forEach(c=>c.disabled=false);}}
  }
  window.addEventListener('pagehide',()=>controller?.abort());
  window.addEventListener('pageshow',e=>{if(e.persisted)load();});
  // Refresh after returning to the page and across the Rome date boundary.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!loading)load();});
  const interval=setInterval(()=>{if(!document.hidden&&!loading)load();},60000);
  window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
  load();
}
