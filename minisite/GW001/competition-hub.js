import {activeCompetitions} from './competition-catalog.js';

const token=value=>String(value??'').trim().toLocaleLowerCase('it');
const finals=new Set(['finale','final','playoff finale','playoff final']);
const knockout=new Set([...finals,'semifinale','semi-final','semifinal','playoff semifinale','quarti di finale','quarti di finalee','quarter-final','ottavi di finale','round of 16']);
const groupStages=new Set(['group stage','fase a gironi','gironi']);
const groupName=r=>String(r.competition_group_name||(/^girone\s+\S+/i.test(r.competition_stage||'')?r.competition_stage:'')).trim();
const isGroup=r=>!knockout.has(token(r.competition_stage))&&(!!groupName(r)||groupStages.has(token(r.competition_stage)));

// A final must be explicit, completed and unambiguous. No latest-date or season guesses.
export function finalWinner(results,schedule){
  const candidates=results.filter(r=>finals.has(token(r.competition_stage)));
  if(candidates.length!==1||schedule.some(r=>finals.has(token(r.competition_stage))))return null;
  const r=candidates[0];
  if(r.result_status!=='COMPLETED'||token(r.competition_round)==='andata')return null;
  const number=v=>v!==null&&v!==undefined&&v!==''&&/^\d+$/.test(String(v))?Number(v):null;
  const pair=prefix=>[number(r[prefix+'home_score']),number(r[prefix+'away_score'])];
  let [home,away]=pair('');
  if(home===null||away===null)return null;
  const aggregate=pair('aggregate_'),penalties=pair('penalty_');
  if(aggregate.some(n=>n!==null)){
    if(aggregate.some(n=>n===null))return null;
    [home,away]=aggregate;
  }else if(token(r.competition_round)==='ritorno')return null;
  if(home===away){
    if(penalties.some(n=>n===null)||penalties[0]===penalties[1])return null;
    [home,away]=penalties;
  }else if(penalties.some(n=>n!==null))return null;
  const side=home>away?'home':'away';
  if(!r[side+'_name'])return null;
  return {name:r[side+'_name'],identity:r[side+'_identity']??null,fixture:r};
}

export function competitionHub(catalogue,activity,data,id){
  const entry=activeCompetitions(catalogue,activity).flatMap(g=>g.entries).find(e=>String(e.competition.id)===String(id));
  if(!entry)return null;
  const keys=new Set([...entry.results,...entry.schedule]);
  const scoped=rows=>rows.filter(r=>r.game_world_id==='GW001'&&r.competition_group===entry.group&&keys.has(r.competition_key));
  const results=scoped(data.results),schedule=scoped(data.schedule);
  const structure=[...scoped(activity),...results,...schedule];
  const groupRows=structure.filter(isGroup);
  const groups=[...new Set(groupRows.map(groupName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
  const c=entry.competition;
  // The catalog's official SM action distinguishes a League from custom Playoffs.
  const league=!groupRows.length&&!structure.some(r=>knockout.has(token(r.competition_stage)))&&
    ((c.sm_action==='league'&&String(c.is_sm_action)==='1'&&c.sm_division!=null)||structure.some(r=>['league','campionato'].includes(token(r.competition_stage))));
  const ranking=groupRows.length?'groups':league?'league':null;
  const sections=league?[['results','Risultati'],['standings','Classifica'],['schedule','Calendario / Schedule']]:
    [['results','Risultati'],['schedule','Calendario / Schedule'],...(ranking==='groups'?[['standings','Classifica Gironi']]:[])];
  if(c.sm_action!=='friendly')sections.push(['trophy','Trophy Room']);
  return {...entry,keys:[...keys],results,schedule,ranking,groups,sections,
    groupResults:results.filter(isGroup),winner:league?null:finalWinner(results,schedule)};
}

export function renderCompetitionHub(h,{esc,link,head,empty,source,score,schedule,teamLink,date}){
  if(!h)return head('COMPETITION HUB · GW001','Competizione non disponibile.')+empty('Il riferimento richiesto non è presente tra le competizioni attive.')+link('competitions.html','Torna alle competizioni');
  const phase=r=>[r.competition_group_name,r.competition_stage,r.competition_round].filter(Boolean).join(' · ');
  const crest=t=>t?.image_url?.startsWith('https://')?`<img src="${esc(t.image_url)}" alt="" width="32" height="36" loading="lazy" style="width:32px;height:36px;object-fit:contain;vertical-align:middle;margin-right:8px">`:'';
  const team=(t,n)=>`${crest(t)}${teamLink(t,n)}`;
  const resultScore=r=>{
    const parts=score(r).split('<div class="team">');
    if(parts.length!==3)return score(r);
    return parts[0]+'<div class="team">'+crest(r.home_identity)+parts[1]+'<div class="team">'+crest(r.away_identity)+parts[2];
  };
  const ranking=h.ranking==='groups'?
    '<p>La classifica riguarda esclusivamente la fase a gironi.</p>'+h.groups.map(g=>`<h3 style="margin:24px 0 12px">${esc(g)}</h3>`+empty('Classifica ufficiale del girone non disponibile nelle fonti collegate.')).join('')+(h.groups.length?'':empty('Identificativi e classifiche ufficiali dei gironi non disponibili.')):
    empty('Classifica ufficiale della divisione non disponibile nelle fonti collegate.');
  const trophy=h.winner?`<article class="record" data-winner="${esc(h.winner.name)}"><span class="eyebrow">VINCITORE · FINALE</span><h3 class="serif" style="font-size:2rem;margin:18px 0">${team(h.winner.identity,h.winner.name)}</h3><p>Finale del ${date(h.winner.fixture.match_date)}</p>${resultScore(h.winner.fixture)}</article>`:
    empty(h.ranking==='league'?'Vincitore non determinabile: classifica finale ufficiale non disponibile.':'Vincitore non ancora determinabile dai dati conclusivi disponibili.');
  const hubSchedule=rows=>rows.length?rows.map(r=>`<article class="fixture-row"><div><small>${date(r.match_date)} · ${esc(phase(r)||h.label)}</small><strong>${team(r.home_identity,r.home_name)}<br>vs ${team(r.away_identity,r.away_name)}</strong></div><span class="fixture-time">${esc(r.match_time?.slice(0,5)||'—')}</span></article>`).join(''):empty('Nessun incontro da oggi · Europe/Rome.');
  const contents={results:`<p class="source">${h.results.length} risultati · tutte le fasi della competizione.</p><div class="match-list">${h.results.map(r=>`<div data-hub-fixture-key="${esc(r.competition_key)}">${phase(r)?`<p class="source">${esc(phase(r))}</p>`:''}${resultScore(r)}</div>`).join('')||empty('Nessun risultato disponibile per questa competizione.')}</div>`,
    schedule:`<p class="source">Incontri da oggi · Europe/Rome · tutte le fasi della competizione.</p>${hubSchedule(h.schedule)}`,standings:ranking,trophy};
  return link('competitions.html','← Tutte le competizioni')+head('GW001 · '+h.group+' · COMPETITION HUB',esc(h.label))+source()+
    `<div data-competition-hub="${esc(h.competition.id)}"><nav class="match-tabs" style="flex-wrap:wrap" aria-label="Sezioni competizione">${h.sections.map(([id,label])=>`<a href="#hub-${id}" data-hub-link="${id}">${esc(label)}</a>`).join('')}</nav>${h.sections.map(([id,label])=>`<section id="hub-${id}" data-hub-panel="${id}" aria-labelledby="hub-title-${id}" style="scroll-margin-top:95px"${id==='results'?'':' hidden'}><div class="section-head"><h2 id="hub-title-${id}">${esc(label)}</h2></div>${contents[id]}</section>`).join('')}</div>`;
}

export function mountCompetitionHub(){
  const hub=document.querySelector('[data-competition-hub]');
  if(!hub)return;
  const panels=[...hub.querySelectorAll('[data-hub-panel]')],links=[...hub.querySelectorAll('[data-hub-link]')];
  function show(){
    const requested=location.hash.replace('#hub-','');
    const selected=panels.some(p=>p.dataset.hubPanel===requested)?requested:'results';
    panels.forEach(p=>{p.hidden=p.dataset.hubPanel!==selected;});
    links.forEach(a=>{if(a.dataset.hubLink===selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  show();window.addEventListener('hashchange',show);
}
