(()=>{'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const world=/^GW00[1-9]$|^GW010$/.test(params.get('world'))?params.get('world'):'GW001';
const fixture=params.get('fixture')||'',tabs=[['overview','MATCH DATA'],['home','HOME'],['away','AWAY']];
let record=null,players=[],events=[],tactics=[],tab='overview',side='home';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const array=v=>{if(typeof v==='string'){try{v=JSON.parse(v)}catch{return []}}return Array.isArray(v)?v:[]};
const num=v=>v===null||v===undefined||String(v).trim()===''?null:Number.isFinite(Number(v))?Number(v):null;
const flag=v=>v===true||v===1||v==='1';
const minute=v=>{const s=String(v??'');if(!/^\d{1,3}(?:\+\d{1,2})?$/.test(s))return null;const n=s.split('+').map(Number).reduce((a,b)=>a+b,0);return n<=150?s:null;};
const time=v=>minute(v)===null?'—':minute(v)+'′';
const imageURL=v=>{if(!v)return null;try{const u=new URL(v,location.href);return u.protocol==='https:'?u.href:null}catch{return null}};
const initials=v=>String(v||'?').split(/\s+/).slice(0,2).map(s=>s[0]).join('');
const name=s=>record[s+'_core']?.name||record[s+'_name']||'Squadra';
const empty=t=>`<div class="empty">${esc(t)}</div>`;
const date=v=>/^\d{4}-\d{2}-\d{2}/.test(v||'')?new Date(v.slice(0,10)+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}):'Data non disponibile';
function href(patch){return '?'+new URLSearchParams({...Object.fromEntries(params),world,fixture,tab,side,...patch})}
function stateURL(){const p=new URLSearchParams(location.search);tab=tabs.some(t=>t[0]===p.get('tab'))?p.get('tab'):'overview';side=p.get('side')==='away'?'away':'home'}
function crest(s){const src=imageURL(record[s+'_core']?.image_url);return src?`<img class="crest" src="${esc(src)}" alt="" width="105" height="105">`:`<span class="crest crest-fallback" aria-hidden="true">${esc(initials(name(s)))}</span>`}
// REPORT_FACTS_START: authoritative player fields; event roles are not reliable.
function goalScorers(teamSide){
 const eligible=players.filter(p=>p.team_side===teamSide&&num(p.goals)>0);
 const assigned=new Map(eligible.map(p=>[String(p.sm_player_id),[]]));
 const seen=new Set();
 for(const e of events){
  const text=String(e.event_text||e.commentary_text||'');
  if(!/\bGOL!+/i.test(text)||/annullat|disallow|no goal|lotteria dei rigori|calcerà il rigore successivo/i.test(text))continue;
  const m=minute(e.minute);if(m===null)continue;
  const ids=[e.primary_sm_player_id,e.secondary_sm_player_id].map(String);
  const candidates=eligible.filter(p=>ids.includes(String(p.sm_player_id)));
  if(candidates.length!==1)continue;
  const p=candidates[0],key=p.sm_player_id+'|'+m;
  if(seen.has(key))continue;seen.add(key);
  assigned.get(String(p.sm_player_id)).push(m);
 }
 return eligible.flatMap(p=>{
  const mins=assigned.get(String(p.sm_player_id));
  // Inconsistent event totals must not invent or misattribute scoring minutes.
  return Array.from({length:num(p.goals)},(_,i)=>({name:p.player_name||'Marcatore',minute:mins.length===num(p.goals)?mins[i]:null}));
 });
}
// REPORT_FACTS_END
function scorersHTML(teamSide){
 const list=goalScorers(teamSide);
 return list.length?list.map(g=>`<span>${esc(g.name)}${g.minute!==null?' '+esc(g.minute)+'′':''}</span>`).join(''):'';
}
function renderHero(){
 const r=record,stage=[r.competition_stage,r.competition_round].filter(Boolean).join(' · ')||'Match report';
 const decisions=[];if(r.penalty_home_score!=null&&r.penalty_away_score!=null)decisions.push(`Rigori ${r.penalty_home_score}–${r.penalty_away_score}`);if(r.aggregate_home_score!=null&&r.aggregate_away_score!=null)decisions.push(`Aggregato ${r.aggregate_home_score}–${r.aggregate_away_score}`);
 $('hero').innerHTML=`<p class="stage"><span>${esc(stage)}</span></p><section class="scoreboard" aria-label="Risultato della partita"><div class="score-grid"><div class="team">${crest('home')}<strong>${esc(name('home'))}</strong><small>${esc(r.home_manager_name||'Allenatore non disponibile')}</small></div><div class="score">${esc(r.home_score??'—')}–${esc(r.away_score??'—')}</div><div class="team">${crest('away')}<strong>${esc(name('away'))}</strong><small>${esc(r.away_manager_name||'Allenatore non disponibile')}</small></div></div><div class="hero-scorers"><div>${scorersHTML('home')}</div><div>${scorersHTML('away')}</div></div><div class="hero-divider" aria-hidden="true"></div><p class="match-info"><strong>${esc(r.competition_core?.nexus_view||r._nexus_view||'Competizione')} · ${r.imc_season?'STAGIONE '+esc(r.imc_season)+' · ':''}${esc(date(r.match_date))}</strong>${esc([r.stadium_name,r.attendance!=null?Number(r.attendance).toLocaleString('it-IT')+' spettatori':''].filter(Boolean).join(' · '))}</p>${decisions.length?`<p class="decision">${esc(decisions.join(' · '))}</p>`:''}</section>`;
 document.title=`${name('home')} ${r.home_score??'—'}–${r.away_score??'—'} ${name('away')} · Nexus`;
}
function rating(p){const n=num(p.rating);return `<span class="rating ${n===null?'none':n<6?'low':n<7?'mid':''}" aria-label="${n===null?'Voto non disponibile':'Voto '+n}">${n===null?'—':n.toFixed(1)}</span>`}
function normName(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function substitutions(){
 const out=[];
 for(const c of array(record.commentary_json)){
  const m=minute(c.minute),txt=String(c.commentary_text||'');if(m===null)continue;
  const patterns=[
   /([^.!]+?)\s+(?:sta|stanno) uscendo dal campo\.\s*(?:Sarà|Saranno) sostituit[oi] da\s+([^.!]+)/gi,
   /([^.!]+?)\s+(?:sta|stanno) uscendo dal campo\.\s*(?:Sarà|Saranno)\s+([^.!]+?)\s+a sostituirl[oi]/gi,
   /([^.!]+?)\s+(?:are|is) leaving the action\.\s*It will be\s+([^.!]+?)\s+to replace (?:them|him)/gi
  ];
  for(const re of patterns)for(const match of txt.matchAll(re)){
   for(const [i,kind] of [[1,'off'],[2,'on']]){
    for(const raw of match[i].split(/\s+(?:e|and)\s+|\s*,\s*/)){
     const n=normName(raw.replace(/^\d+\s*/,''));
     const candidates=players.filter(p=>{const pn=normName(p.player_name);return n&&(pn===n||pn.endsWith(' '+n))});
     if(candidates.length!==1)continue;
     const p=candidates[0];
     out.push({id:String(p.sm_player_id),side:p.team_side,kind,minute:m});
    }
   }
  }
 }
 return out;
}
function subMinute(p,kind){
 const direct=minute(p[kind==='on'?'sub_on_minute':'sub_off_minute']);if(direct!==null)return direct;
 const matches=substitutions().filter(s=>s.id===String(p.sm_player_id)&&s.side===p.team_side&&s.kind===kind);
 const mins=[...new Set(matches.map(s=>s.minute))];return mins.length===1?mins[0]:null;
}
function matchEnd(){const mins=array(record.commentary_json).filter(x=>/fine secondo tempo|fine partita|full.?time|fine.*supplementar/i.test(x.commentary_text||'')).map(x=>minute(x.minute)).filter(x=>x!==null).map(elapsed);return mins.length?Math.max(...mins):null}
function elapsed(m){return String(m).split('+').map(Number).reduce((a,b)=>a+b,0)}
function playerMinutes(p){const on=subMinute(p,'on'),off=subMinute(p,'off'),red=minute(p.red_card_minute),end=matchEnd();const stops=[off,red].filter(x=>x!==null).map(elapsed);const stop=stops.length?Math.min(...stops):end;if(stop===null)return '—';if(flag(p.starter))return Math.max(0,stop)+'′';if(on!==null)return Math.max(0,stop-elapsed(on))+'′';return '—'}
function badges(p){
 const out=[];
 if(num(p.goals)>0)out.push(`<span class="badge" title="Gol">⚽${num(p.goals)>1?num(p.goals):''}</span>`);
 if(num(p.assists)>0)out.push(`<span class="badge" title="Assist">A${num(p.assists)>1?num(p.assists):''}</span>`);
 if(flag(p.captain))out.push('<span class="badge" title="Capitano">C</span>');
 if(flag(p.man_of_match))out.push('<span class="badge gold" title="Migliore in campo">★</span>');
 for(const [field,label,cls] of [['yellow_card','Ammonito',''],['red_card','Espulso','red']]){
  const m=minute(p[field+'_minute']);
  if(flag(p[field]))out.push(`<span class="badge" title="${label}${m===null?' · minuto non disponibile':' al '+m+'′'}"><i class="card-icon ${cls}" aria-hidden="true"></i><span class="sr-only">${label}</span>${m===null?'':esc(m)+'′'}</span>`);
 }
 for(const [kind,cls,icon] of [['on','up','↑'],['off','down','↓']]){const m=subMinute(p,kind);if(m!==null)out.push(`<span class="badge ${cls}" title="${kind==='on'?'Entrato':'Uscito'}">${icon}${esc(m)}′</span>`)}
 return out.join('');
}
function playerRow(p){const src=imageURL(p.image_url||p.player_core?.image_url);return `<div class="player"><span class="slot">${esc(p.squad_slot??'—')}</span><div class="player-name">${src?`<img class="avatar" src="${esc(src)}" alt="" loading="lazy">`:`<span class="avatar" aria-hidden="true">${esc(initials(p.player_name))}</span>`}<strong>${esc(p.player_name||'Giocatore')}</strong></div><span class="minutes">${playerMinutes(p)}</span>${rating(p)}<div class="badges">${badges(p)}</div></div>`}
function switcher(){return `<nav class="switch" aria-label="Squadra">${['home','away'].map(s=>`<a data-view href="${esc(href({side:s}))}" ${side===s?'aria-current="page"':''}>${esc(name(s))}</a>`).join('')}</nav>`}
function playerTable(lineup=false){const list=players.filter(p=>p.team_side===side).sort((a,b)=>(num(a.squad_slot)??999)-(num(b.squad_slot)??999)),starters=list.filter(p=>flag(p.starter)),subs=list.filter(p=>!flag(p.starter));return `<section class="box"><div class="section-head"><h2>${esc(name(side))}</h2></div>${list.length?`<div class="rating-head"><span>#</span><span>GIOCATORE</span><span>MIN</span><span>VOTO</span><span>EVENTI</span></div>${starters.map(playerRow).join('')}${subs.length?'<div class="bench">Panchina e sostituti</div>'+subs.map(playerRow).join(''):''}<p class="note">— indica un dato non disponibile.</p>`:empty('Formazione non disponibile per questa squadra.')}</section>`}
function stats(){const source=record.team_stats_json||{},h=source.home||array(source).find(x=>x.team_side==='home')||{},a=source.away||array(source).find(x=>x.team_side==='away')||{};const fields=[['possession','Possesso palla',true],['total_shots','Tiri totali'],['shots_on_target','Tiri in porta'],['corners','Corner'],['yellow_cards','Gialli'],['red_cards','Rossi']];const rows=fields.filter(([k])=>num(h[k])!==null||num(a[k])!==null);return `<section class="box box-pad"><h2>Statistiche partita</h2><div class="stat-teams"><span>${esc(name('home'))}</span><span>${esc(name('away'))}</span></div>${rows.length?rows.map(([k,label,pct])=>{const x=num(h[k]),y=num(a[k]),valid=x!==null&&y!==null&&x>=0&&y>=0,sum=valid?x+y:0,width=sum?x/sum*100:0;return `<div class="stat"><strong>${x===null?'—':x+(pct?'%':'')}</strong><div><span class="stat-label">${label}</span><div class="bar" aria-hidden="true"><i style="width:${width}%"></i><i style="width:${sum?100-width:0}%"></i></div></div><strong>${y===null?'—':y+(pct?'%':'')}</strong></div>`}).join(''):empty('Statistiche non ancora disponibili.')}</section>`}
function overview(){const scorers=players.filter(p=>num(p.goals)>0||num(p.assists)>0),mvp=players.filter(p=>flag(p.man_of_match));return stats()+scorers.map(p=>`<article class="highlight"><span class="symbol" aria-hidden="true">${num(p.goals)>0?'⚽':'A'}</span><div><strong>${esc(p.player_name)}${num(p.goals)>1?' · '+num(p.goals)+' gol':''}</strong><small>${esc(name(p.team_side))}${num(p.assists)>0?' · '+num(p.assists)+' assist':''}</small></div></article>`).join('')+mvp.map(p=>`<article class="highlight"><span class="symbol" aria-hidden="true">★</span><div><small>MIGLIORE IN CAMPO · ${esc(name(p.team_side))}</small><strong>${esc(p.player_name)}</strong></div>${rating(p)}</article>`).join('')}
const tacticLabels={formation:'Modulo',mentality:'Mentalità',passing_style:'Passaggi',pressing:'Pressing',tempo:'Ritmo',width:'Ampiezza',tackling_style:'Contrasti',defensive_line:'Linea difensiva',attacking_style:'Attacco',wide_play:'Gioco sulle fasce',counter_attack:'Contropiede',tight_marking:'Marcatura stretta',captain_name:'Capitano',penalty_taker_name:'Rigorista',free_kick_taker_name:'Punizioni',corner_taker_name:'Corner'};
function formation(){const snapshots=tactics.filter(t=>t.team_side===side).sort((a,b)=>(num(a.snapshot_minute)??999)-(num(b.snapshot_minute)??999));return playerTable(true)+(snapshots.length?`<section class="box box-pad"><h2>Assetto tattico</h2>${snapshots.map((t,i)=>`<details ${i===0?'open':''}><summary>${minute(t.snapshot_minute)==='0'?'Al calcio d’inizio':minute(t.snapshot_minute)!==null?time(t.snapshot_minute):'Assetto importato'} · ${esc(t.formation||'Modulo non disponibile')}</summary><div class="tactics">${Object.entries(tacticLabels).filter(([k])=>t[k]!=null&&t[k]!=='').map(([k,label])=>`<div class="tactic"><small>${label}</small><strong>${esc(t[k])}</strong></div>`).join('')}</div></details>`).join('')}</section>`:'')}
const eventNames={goal:'Gol',yellow_card:'Ammonizione',red_card:'Espulsione',substitution:'Sostituzione',save:'Parata',kickoff:'Calcio d’inizio',halftime:'Intervallo',fulltime:'Fine partita',penalty:'Rigore',injury:'Infortunio'};
function eventText(e){const raw=String(e.event_text??e.commentary_text??'');const m=minute(e.minute);return m!==null&&raw.startsWith(m)?raw.slice(m.length).replace(/^\s*['′:]?\s*/,''):raw}
function eventTitle(e){if(e.event_type==='goal'&&/annullat|disallow|no goal/i.test(e.event_text||''))return 'Gol annullato';return eventNames[e.event_type]||'Azione'}
function timeline(list){return list.length?list.map(e=>`<article class="event"><time>${time(e.minute)}</time><div><strong>${esc(eventTitle(e))}</strong>${['home','away'].includes(e.team_side)?`<small>${esc(name(e.team_side))}</small>`:''}<p>${esc(eventText(e))}</p></div></article>`).join(''):empty('Nessun evento disponibile.')}
function reportEvents(){
 const out=[];
 for(const p of players){
  for(const [field,type,label] of [['yellow_card','yellow_card','Ammonizione'],['red_card','red_card','Espulsione']])if(flag(p[field]))out.push({minute:p[field+'_minute'],team_side:p.team_side,event_type:type,event_text:label+' · '+p.player_name});
  for(const [kind,label] of [['on','Entrato'],['off','Uscito']]){const m=subMinute(p,kind);if(m!==null)out.push({minute:m,team_side:p.team_side,event_type:'substitution',event_text:label+' · '+p.player_name});}
 }
 for(const side of ['home','away'])for(const g of goalScorers(side))out.push({minute:g.minute,team_side:side,event_type:'goal',event_text:'Gol · '+g.name});
 return out.sort((a,b)=>(minute(a.minute)===null?999:elapsed(a.minute))-(minute(b.minute)===null?999:elapsed(b.minute)));
}
function eventView(){const seen=new Set(),commentary=array(record.commentary_json).filter(c=>{const key=String(c.minute)+'|'+String(c.commentary_text||'').replace(/\s+/g,'');if(seen.has(key))return false;seen.add(key);return true});return `<section class="box"><div class="section-head"><h2>Gol, cartellini e cambi</h2></div>${timeline(reportEvents())}<p class="note">— indica un minuto non disponibile nel report. Assist, capitano e migliore in campo sono indicati nelle formazioni.</p></section>${commentary.length?`<details class="box"><summary>Cronaca completa · ${commentary.length} azioni</summary>${timeline(commentary)}</details>`:''}`}
function render(){stateURL();$('tabs').hidden=false;$('tabs').innerHTML=tabs.map(([key,label])=>`<a data-view href="${esc(href({tab:key}))}" ${tab===key?'aria-current="page"':''}>${label}</a>`).join('');if(tab==='home'||tab==='away'){side=tab;$('panel').innerHTML=formation()}else $('panel').innerHTML=overview()+eventView()}
document.addEventListener('click',e=>{const a=e.target.closest('a[data-view]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();history.pushState(null,'',a.href);render()});
window.addEventListener('popstate',()=>{if(record)render()});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){const fallback=document.createElement('span');fallback.className=e.target.className;fallback.textContent='—';e.target.replaceWith(fallback)}},true);
async function fetchJSON(query){const response=await fetch('public/data.php?'+new URLSearchParams(query),{cache:'no-store',credentials:'omit'});const d=await response.json();if(!response.ok||!d.ok)throw Error('Il report non è momentaneamente disponibile.');return d}
async function boot(){
 $('world').textContent=world;
 const fallback='./?'+new URLSearchParams({world,resource:'match_report'});$('back').href=fallback;
 try{const back=new URL(params.get('return')||fallback,location.href);if(back.origin===location.origin&&/^\/nexus\/(?:index\.html)?$/.test(back.pathname))$('back').href=back.pathname+back.search+back.hash}catch{}
 if(!/^\d+$/.test(fixture)){$('status').textContent='Seleziona una partita dal Match Center.';return}
 try{
 const [data,catalog]=await Promise.all([fetchJSON({world,resource:'match_report',fixture}),fetchJSON({world,resource:'catalog'}).catch(()=>null)]);
 record=data.rows?.[0];if(!record){$('status').textContent='Il report di questa partita non è ancora disponibile.';return}
 players=array(record.players_json);events=array(record.events_json).sort((a,b)=>(num(a.event_sequence)??0)-(num(b.event_sequence)??0));tactics=array(record.tactics_json);
 const comp=catalog?.rows?.find(c=>c.competition_key===record.competition_key);record._nexus_view=record.competition_core?.nexus_view||comp?.nexus_view||record.competition_key||'Competizione';$('competition').textContent=record._nexus_view;
 $('status').hidden=true;renderHero();render();
 }catch(e){$('status').textContent=e.message;$('panel').innerHTML='<button class="retry" type="button">Riprova</button>';$('panel').querySelector('button').onclick=()=>{ $('panel').innerHTML='';boot()};}
}
boot();
})();

