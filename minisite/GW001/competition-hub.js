import {activeCompetitions} from './competition-catalog.js';

const token=value=>String(value??'').trim().toLocaleLowerCase('it');
const finals=new Set(['finale','final','playoff finale','playoff final']);
const knockout=new Set([...finals,'semifinale','semi-final','semifinal','playoff semifinale','quarti di finale','quarti di finalee','quarter-final','ottavi di finale','round of 16']);
const groupStages=new Set(['group stage','fase a gironi','gironi']);
const groupName=r=>String(r.competition_group_name||(/^girone\s+\S+/i.test(r.competition_stage||'')?r.competition_stage:'')).trim();
const isGroup=r=>!knockout.has(token(r.competition_stage))&&(!!groupName(r)||groupStages.has(token(r.competition_stage)));
const scoreNumber=v=>v!==null&&v!==undefined&&v!==''&&/^-?\d+$/.test(String(v))?Number(v):null;

export function standingsFromResults(results){
  const table=new Map();
  const side=(r,prefix)=>({id:r[prefix+'_sm_team_id']??r[prefix+'_sm_club_id']??r[prefix+'_name'],name:r[prefix+'_name'],identity:r[prefix+'_identity']??null});
  const get=t=>{
    const key=String(t.id??t.name??'').trim();
    if(!key)return null;
    if(!table.has(key))table.set(key,{key,name:t.name||key,identity:t.identity,pg:0,v:0,n:0,p:0,gf:0,gs:0,dr:0,pt:0});
    const row=table.get(key);if(!row.identity&&t.identity)row.identity=t.identity;if(t.name)row.name=t.name;return row;
  };
  results.forEach(r=>{
    if(r.result_status&&r.result_status!=='COMPLETED')return;
    const hg=scoreNumber(r.home_score),ag=scoreNumber(r.away_score);if(hg===null||ag===null)return;
    const h=get(side(r,'home')),a=get(side(r,'away'));if(!h||!a)return;
    h.pg++;a.pg++;h.gf+=hg;h.gs+=ag;a.gf+=ag;a.gs+=hg;
    if(hg>ag){h.v++;a.p++;h.pt+=3;}else if(ag>hg){a.v++;h.p++;a.pt+=3;}else{h.n++;a.n++;h.pt++;a.pt++;}
  });
  const rows=[...table.values()];rows.forEach(r=>r.dr=r.gf-r.gs);
  return rows.sort((a,b)=>b.pt-a.pt||b.dr-a.dr||b.gf-a.gf||a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
}

export function finalWinner(results,schedule){
  const candidates=results.filter(r=>finals.has(token(r.competition_stage)));
  if(candidates.length!==1||schedule.some(r=>finals.has(token(r.competition_stage))))return null;
  const r=candidates[0];
  if(r.result_status!=='COMPLETED'||token(r.competition_round)==='andata')return null;
  const number=v=>v!==null&&v!==undefined&&v!==''&&/^\d+$/.test(String(v))?Number(v):null;
  const pair=prefix=>[number(r[prefix+'home_score']),number(r[prefix+'away_score'])];
  let [home,away]=pair('');if(home===null||away===null)return null;
  const aggregate=pair('aggregate_'),penalties=pair('penalty_');
  if(aggregate.some(n=>n!==null)){if(aggregate.some(n=>n===null))return null;[home,away]=aggregate;}else if(token(r.competition_round)==='ritorno')return null;
  if(home===away){if(penalties.some(n=>n===null)||penalties[0]===penalties[1])return null;[home,away]=penalties;}else if(penalties.some(n=>n!==null))return null;
  const side=home>away?'home':'away';if(!r[side+'_name'])return null;
  return {name:r[side+'_name'],identity:r[side+'_identity']??null,fixture:r};
}

export function competitionHub(catalogue,activity,data,id){
  const entry=activeCompetitions(catalogue,activity).flatMap(g=>g.entries).find(e=>String(e.competition.id)===String(id));if(!entry)return null;
  const keys=new Set([...entry.results,...entry.schedule]);
  const scoped=rows=>rows.filter(r=>r.game_world_id==='GW001'&&r.competition_group===entry.group&&keys.has(r.competition_key));
  const results=scoped(data.results),schedule=scoped(data.schedule),structure=[...scoped(activity),...results,...schedule];
  const groupRows=structure.filter(isGroup),groups=[...new Set(groupRows.map(groupName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
  const c=entry.competition;
  const league=!groupRows.length&&!structure.some(r=>knockout.has(token(r.competition_stage)))&&((c.sm_action==='league'&&String(c.is_sm_action)==='1'&&c.sm_division!=null)||structure.some(r=>['league','campionato'].includes(token(r.competition_stage))));
  const ranking=groupRows.length?'groups':league?'league':null;
  const sections=league?[['results','Risultati'],['standings','Classifica'],['schedule','Calendario / Schedule']]:[['results','Risultati'],['schedule','Calendario / Schedule'],...(ranking==='groups'?[['standings','Classifica Gironi']]:[])];
  if(c.sm_action!=='friendly')sections.push(['trophy','Trophy Room']);
  return {...entry,keys:[...keys],results,schedule,ranking,groups,sections,groupResults:results.filter(isGroup),winner:league?null:finalWinner(results,schedule)};
}

export function createHubTeam({esc,teamLink}){
  return (t,n,compact=false)=>{const size=compact?[32,36]:[38,42];const image=t?.image_url?.startsWith('https://')?`<img data-club-crest="${esc(t.sm_world_club_id)}" src="${esc(t.image_url)}" alt="" width="${size[0]}" height="${size[1]}" loading="lazy" style="display:inline-block;width:${size[0]}px;height:${size[1]}px;object-fit:contain;flex-shrink:0;vertical-align:middle${compact?';margin-right:8px':''}">`:'';return image+teamLink(t,n);};
}

export function renderCompetitionHub(h,{esc,link,head,empty,source,score,schedule,teamLink,date,team=createHubTeam({esc,teamLink})}){
  if(!h)return head('COMPETITION HUB · GW001','Competizione non disponibile.')+empty('Il riferimento richiesto non è presente tra le competizioni attive.')+link('competitions.html','Torna alle competizioni');
  const phase=r=>[r.competition_group_name,r.competition_stage,r.competition_round].filter(Boolean).join(' · ');
  const table=rows=>{const s=standingsFromResults(rows);if(!s.length)return empty('Nessun risultato completato disponibile per calcolare la classifica.');return `<div style="overflow-x:auto"><table class="standings-table" style="width:100%;border-collapse:collapse;min-width:720px"><thead><tr><th>#</th><th style="text-align:left">Club</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>PT</th></tr></thead><tbody>${s.map((r,i)=>`<tr><td>${i+1}</td><td style="text-align:left">${team(r.identity,r.name,true)}</td><td>${r.pg}</td><td>${r.v}</td><td>${r.n}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gs}</td><td>${r.dr>0?'+':''}${r.dr}</td><td><strong>${r.pt}</strong></td></tr>`).join('')}</tbody></table></div>`;};
  const ranking=h.ranking==='groups'?'<p>Classifiche calcolate esclusivamente dai risultati completati della fase a gironi.</p>'+h.groups.map(g=>`<h3 style="margin:24px 0 12px">${esc(g)}</h3>${table(h.groupResults.filter(r=>groupName(r)===g))}`).join('')+(h.groups.length?'':empty('Nessun girone disponibile.')):table(h.results);
  const trophy=h.winner?`<article class="record" data-winner="${esc(h.winner.name)}"><span class="eyebrow">VINCITORE · FINALE</span><h3 class="serif" style="font-size:2rem;margin:18px 0">${team(h.winner.identity,h.winner.name,true)}</h3><p>Finale del ${date(h.winner.fixture.match_date)}</p>${score(h.winner.fixture)}</article>`:empty(h.ranking==='league'?'Vincitore non ancora determinabile dai risultati disponibili.':'Vincitore non ancora determinabile dai dati conclusivi disponibili.');
  const hubSchedule=rows=>rows.length?rows.map(r=>`<article class="fixture-row"><div><small>${date(r.match_date)} · ${esc(phase(r)||h.label)}</small><strong>${team(r.home_identity,r.home_name,true)}<br>vs ${team(r.away_identity,r.away_name,true)}</strong></div><span class="fixture-time">${esc(r.match_time?.slice(0,5)||'—')}</span></article>`).join(''):empty('Nessun incontro da oggi · Europe/Rome.');
  const contents={results:`<p class="source">${h.results.length} risultati · tutte le fasi della competizione.</p><div class="match-list">${h.results.map(r=>`<div data-hub-fixture-key="${esc(r.competition_key)}">${phase(r)?`<p class="source">${esc(phase(r))}</p>`:''}${score(r)}</div>`).join('')||empty('Nessun risultato disponibile per questa competizione.')}</div>`,schedule:`<p class="source">Incontri da oggi · Europe/Rome · tutte le fasi della competizione.</p>${hubSchedule(h.schedule)}`,standings:ranking,trophy};
  return link('competitions.html','← Tutte le competizioni')+head('GW001 · '+h.group+' · COMPETITION HUB',esc(h.label))+source()+`<div data-competition-hub="${esc(h.competition.id)}"><nav class="match-tabs" style="flex-wrap:wrap" aria-label="Sezioni competizione">${h.sections.map(([id,label])=>`<a href="#hub-${id}" data-hub-link="${id}">${esc(label)}</a>`).join('')}</nav>${h.sections.map(([id,label])=>`<section id="hub-${id}" data-hub-panel="${id}" aria-labelledby="hub-title-${id}" style="scroll-margin-top:95px"${id==='results'?'':' hidden'}><div class="section-head"><h2 id="hub-title-${id}">${esc(label)}</h2></div>${contents[id]}</section>`).join('')}</div>`;
}

export function mountCompetitionHub(){const hub=document.querySelector('[data-competition-hub]');if(!hub)return;const panels=[...hub.querySelectorAll('[data-hub-panel]')],links=[...hub.querySelectorAll('[data-hub-link]')];function show(){const requested=location.hash.replace('#hub-','');const selected=panels.some(p=>p.dataset.hubPanel===requested)?requested:'results';panels.forEach(p=>{p.hidden=p.dataset.hubPanel!==selected;});links.forEach(a=>{if(a.dataset.hubLink===selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}show();window.addEventListener('hashchange',show);}
