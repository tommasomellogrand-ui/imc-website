(function(root){'use strict';
const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=v=>/^\d{4}-\d{2}-\d{2}/.test(String(v||''))?String(v).slice(0,10):null;
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
const link=(world,params)=>'index.html?'+new URLSearchParams({world,...params});
function sort(events){return [...events].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.season||0)-Number(a.season||0)||a.id.localeCompare(b.id));}
const editorialMapping={
 "club": [
  [
   "BREAKING · PANCHINE",
   "{manager}–{team}: comincia una nuova storia."
  ],
  [
   "UFFICIALE",
   "{team}, la nuova guida è {manager}."
  ],
  [
   "HOT NEWS · PANCHINE",
   "{manager} prende il comando: si apre il capitolo {team}."
  ],
  [
   "NUOVA ERA",
   "{team} volta pagina. Tocca a {manager}."
  ],
  [
   "FOCUS · PANCHINE",
   "Una panchina, una nuova sfida: {manager} guida {team}."
  ],
  [
   "BREAKING NEWS",
   "{team} riparte da {manager}."
  ],
  [
   "CI SIAMO",
   "{manager} alla guida di {team}: la storia parte da qui."
  ],
  [
   "LA NUOVA GUIDA",
   "{team}, si apre l’era {manager}."
  ],
  [
   "UFFICIALE · INCARICHI",
   "Il prossimo capitolo di {manager} si chiama {team}."
  ],
  [
   "CAMBIO DI SCENA",
   "Nuovi colori per {manager}: ecco {team}."
  ],
  [
   "SOTTO I RIFLETTORI",
   "{manager} e {team}: una nuova avventura in panchina."
  ],
  [
   "PANCHINE · NEWS",
   "La panchina di {team} ha un nome: {manager}."
  ],
  [
   "NUOVO CAPITOLO",
   "{manager}, destinazione {team}."
  ],
  [
   "PRONTI A PARTIRE",
   "{team}–{manager}: il viaggio comincia."
  ],
  [
   "NEWS ROOM",
   "{team}, adesso la guida è {manager}."
  ]
 ],
 "national": [
  [
   "BREAKING · NAZIONALI",
   "{team} sceglie {manager}. Comincia la missione."
  ],
  [
   "UFFICIALE · CT",
   "{manager} è il nuovo CT: al via il capitolo {team}."
  ],
  [
   "NUOVA ERA · NAZIONALI",
   "{team}, la nuova guida è {manager}."
  ],
  [
   "HOT NEWS · CT",
   "Una nazionale, una nuova sfida: {manager} guida {team}."
  ],
  [
   "LA CHIAMATA",
   "{manager}, destinazione {team}: si apre una nuova storia."
  ],
  [
   "SOTTO I RIFLETTORI",
   "{team} riparte da {manager}."
  ],
  [
   "UFFICIALE",
   "{team}–{manager}: adesso si fa sul serio."
  ],
  [
   "MISSIONE NAZIONALE",
   "{manager} prende il comando di {team}."
  ],
  [
   "BREAKING NEWS",
   "La panchina di {team} è affidata a {manager}."
  ],
  [
   "NUOVO CAPITOLO",
   "{manager} alla guida di {team}: il viaggio comincia."
  ],
  [
   "FOCUS · NAZIONALI",
   "{team}, si apre l’era {manager}."
  ],
  [
   "CAMBIO DI SCENA",
   "Una nuova bandiera per {manager}: ecco {team}."
  ],
  [
   "LA NUOVA GUIDA",
   "{team} volta pagina con {manager}."
  ],
  [
   "CI SIAMO · NAZIONALI",
   "{manager} e {team}: la sfida parte da qui."
  ],
  [
   "NEWS ROOM · CT",
   "Il prossimo capitolo di {team} porta la firma di {manager}."
  ]
 ],
 "departure": [
  [
   "ULTIM’ORA · PANCHINE",
   "Si chiude l’era {manager} con {team}."
  ],
  [
   "FINE INCARICO",
   "{manager}–{team}: cala il sipario su questo capitolo."
  ],
  [
   "PANCHINE · NEWS",
   "{team}, termina l’incarico di {manager}."
  ],
  [
   "CAPITOLO CHIUSO",
   "{manager} saluta la panchina di {team}."
  ],
  [
   "BREAKING · INCARICHI",
   "Si conclude il percorso di {manager} con {team}."
  ],
  [
   "ULTIMA PAGINA",
   "{team} e {manager}: questa storia arriva ai saluti."
  ],
  [
   "NEWS ROOM",
   "{manager}, finisce l’avventura sulla panchina di {team}."
  ],
  [
   "SI VOLTA PAGINA",
   "{team}: si chiude il capitolo {manager}."
  ],
  [
   "FOCUS · PANCHINE",
   "L’incarico di {manager} con {team} è concluso."
  ],
  [
   "FINE CAPITOLO",
   "{manager}–{team}, una pagina passa alla storia."
  ],
  [
   "UFFICIALE · INCARICHI",
   "{team}: {manager} conclude il suo incarico."
  ],
  [
   "LE STRADE SI SEPARANO",
   "{manager} e {team}, fine del percorso insieme."
  ],
  [
   "IL SALUTO",
   "Si chiude l’esperienza di {manager} alla guida di {team}."
  ],
  [
   "PANCHINE · ULTIM’ORA",
   "{team}, l’era {manager} entra nell’archivio."
  ],
  [
   "STORIA DI PANCHINE",
   "Per {manager} si chiude la parentesi {team}."
  ]
 ],
 "league": [
  [
   "CAMPIONI!",
   "{team}, il trono è vostro: conquistata {competition}."
  ],
  [
   "IL VERDETTO",
   "{team} sul gradino più alto: è sua {competition}."
  ],
  [
   "FIRMA DA CAMPIONI",
   "{team} mette il proprio nome su {competition}."
  ],
  [
   "LA CORONA",
   "{competition}: la corona va a {team}."
  ],
  [
   "TITOLO ASSEGNATO",
   "{team} fa festa: conquistata {competition}."
  ],
  [
   "ALBO D’ORO",
   "{competition}, una pagina firmata {team}."
  ],
  [
   "BREAKING · CAMPIONI",
   "{team} conquista il titolo in {competition}."
  ],
  [
   "IN CIMA",
   "{team}, missione titolo compiuta: sua {competition}."
  ],
  [
   "IL TRONO",
   "{competition} ha il suo campione: {team}."
  ],
  [
   "GLORIA DI CAMPIONATO",
   "{team} scrive il proprio nome nell’albo di {competition}."
  ],
  [
   "È FESTA",
   "{team}, il titolo di {competition} è realtà."
  ],
  [
   "DA RICORDARE",
   "{team} si prende la corona di {competition}."
  ],
  [
   "TROPHY ROOM · NEWS",
   "Un titolo in bacheca per {team}: {competition}."
  ],
  [
   "SOTTO I RIFLETTORI",
   "{competition}, la firma vincente è quella di {team}."
  ],
  [
   "PAGINA DI STORIA",
   "{team} sale sul trono di {competition}."
  ]
 ],
 "cup": [
  [
   "LA GLORIA",
   "{team} alza il trofeo: conquistata {competition}."
  ],
  [
   "BREAKING · TROFEI",
   "{competition} è di {team}."
  ],
  [
   "COPPA IN BACHECA",
   "{team}, il sogno diventa trofeo: sua {competition}."
  ],
  [
   "IL VERDETTO",
   "{team} conquista {competition}: è il momento della festa."
  ],
  [
   "FIRMA VINCENTE",
   "{competition}, il nome da incidere è {team}."
  ],
  [
   "È FESTA",
   "{team} mette le mani su {competition}."
  ],
  [
   "ALBO D’ORO",
   "{team} scrive una pagina di {competition}."
  ],
  [
   "LA COPPA È VOSTRA",
   "{team}, missione compiuta in {competition}."
  ],
  [
   "TROPHY ROOM · NEWS",
   "La bacheca di {team} si arricchisce: ecco {competition}."
  ],
  [
   "SOTTO I RIFLETTORI",
   "{team} sul gradino più alto di {competition}."
  ],
  [
   "MOMENTO DI GLORIA",
   "{competition} prende la strada di {team}."
  ],
  [
   "HOT NEWS · TROFEI",
   "{team} conquista {competition} e firma l’albo d’oro."
  ],
  [
   "DA RICORDARE",
   "{team}, una coppa da custodire: {competition}."
  ],
  [
   "IL TRIONFO",
   "{competition}: il trofeo porta il nome di {team}."
  ],
  [
   "PAGINA DI STORIA",
   "{team}, il capitolo {competition} si scrive in oro."
  ]
 ],
 "worldcup": [
  [
   "CAMPIONI DEL MONDO",
   "{team} alza il mondo: conquistata {competition}."
  ],
  [
   "SUL TETTO DEL MONDO",
   "{team}, il sogno mondiale è realtà."
  ],
  [
   "BREAKING · MONDIALE",
   "{team} conquista {competition}: il mondo è suo."
  ],
  [
   "LA CORONA MONDIALE",
   "{team}, una pagina da campioni del mondo."
  ],
  [
   "GLORIA MONDIALE",
   "{competition}: la firma è quella di {team}."
  ],
  [
   "IL MONDO AI VOSTRI PIEDI",
   "{team} si prende la corona mondiale."
  ],
  [
   "È FESTA MONDIALE",
   "{team}, il trofeo più ambito entra in bacheca."
  ],
  [
   "IL VERDETTO MONDIALE",
   "{team} è campione: conquistata {competition}."
  ],
  [
   "STORIA MONDIALE",
   "{team} incide il proprio nome su {competition}."
  ],
  [
   "LA VETTA",
   "{team} raggiunge il tetto del mondo."
  ],
  [
   "TROPHY ROOM · MONDIALE",
   "Una coppa, un mondo: il trionfo di {team}."
  ],
  [
   "MISSIONE COMPIUTA",
   "{team}, il titolo mondiale è vostro."
  ],
  [
   "SOTTO I RIFLETTORI",
   "{competition} incorona {team}."
  ],
  [
   "IL TRIONFO MONDIALE",
   "{team}, questa pagina si scrive in oro."
  ],
  [
   "ALBO D’ORO · MONDIALE",
   "{team} entra nella storia di {competition}."
  ]
 ],
 "penalties": [
  [
   "FINALE AL CARDIOPALMA",
   "Dal dischetto alla gloria: {team} conquista {competition}."
  ],
  [
   "IL VERDETTO DEI RIGORI",
   "{team}, la coppa arriva dal dischetto."
  ],
  [
   "NERVI DAL DISCHETTO",
   "{competition} si decide ai rigori: vince {team}."
  ],
  [
   "BREAKING · FINALE",
   "I rigori incoronano {team} in {competition}."
  ],
  [
   "GLORIA DAL DISCHETTO",
   "{team}, il titolo passa dagli undici metri."
  ],
  [
   "FINALE · RIGORI",
   "{team} conquista {competition} dopo i rigori."
  ],
  [
   "UNDICI METRI DI GLORIA",
   "{competition}: il verdetto premia {team}."
  ],
  [
   "LA COPPA DAL DISCHETTO",
   "{team}, i rigori valgono {competition}."
  ],
  [
   "ULTIMO VERDETTO",
   "{team} vince ai rigori e alza {competition}."
  ],
  [
   "È FESTA · RIGORI",
   "Il dischetto decide: {competition} va a {team}."
  ],
  [
   "FINALE DA RICORDARE",
   "{team}, il trionfo in {competition} arriva ai rigori."
  ],
  [
   "HOT NEWS · FINALE",
   "{competition}, ai rigori la firma è di {team}."
  ],
  [
   "DECIDONO I RIGORI",
   "{team}, la coppa si conquista dagli undici metri."
  ],
  [
   "ALBO D’ORO · RIGORI",
   "{team} passa dal dischetto alla bacheca."
  ],
  [
   "IL MOMENTO DECISIVO",
   "{team} ai rigori: conquistata {competition}."
  ]
 ],
 "runner": [
  [
   "A UN PASSO DAL SOGNO",
   "{runner}, il sogno si ferma in finale."
  ],
  [
   "FINALE · L’ALTRO VOLTO",
   "{runner}, il trofeo di {competition} sfugge all’ultimo atto."
  ],
  [
   "IL VERDETTO",
   "{runner} chiude {competition} da finalista."
  ],
  [
   "A UN PASSO DALLA COPPA",
   "{runner}, l’ultimo atto premia {team}."
  ],
  [
   "SIPARIO SULLA FINALE",
   "{competition}: {runner} arriva in finale, il titolo va a {team}."
  ],
  [
   "IL SOGNO E IL VERDETTO",
   "{runner}, finale raggiunta. La coppa è di {team}."
  ],
  [
   "ULTIMO ATTO",
   "{runner}, il percorso in {competition} si chiude in finale."
  ],
  [
   "FINALE · NEWS",
   "{runner} finalista in {competition}: il titolo sfuma."
  ],
  [
   "A UN PASSO DALLA GLORIA",
   "{runner}, la coppa prende la strada di {team}."
  ],
  [
   "L’ALTRA STORIA",
   "{competition}, {runner} si ferma all’ultimo atto."
  ],
  [
   "FINALE AMARA",
   "{runner}, il traguardo della finale e un titolo sfumato."
  ],
  [
   "IL GIORNO DEL VERDETTO",
   "{runner} chiude da finalista: {team} conquista {competition}."
  ],
  [
   "SOTTO I RIFLETTORI",
   "{runner}, una finale da consegnare alla storia di {competition}."
  ],
  [
   "FINALE · TITOLI DI CODA",
   "{runner}, l’ultimo passo non porta alla coppa."
  ],
  [
   "IL RACCONTO DELLA FINALE",
   "{runner} finalista, {team} campione: il verdetto di {competition}."
  ]
 ]
};
function hash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
function wording(e,manager=null){
 const loser=manager!=null&&e.people.some(p=>same(p.id,manager)&&p.role==='Finalista');
 const key=loser?'runner':e.editorialKey;
 const options=editorialMapping[key];if(!options)return {label:labels[e.type],title:e.title};
 const index=loser?(e.runnerVariant??hash(e.id)%options.length):(e.variant??hash(e.id)%options.length);
 const [label,template]=options[index];
 return {label,title:template.replace(/\{(team|manager|competition|runner)\}/g,(_,k)=>e.words?.[k]||'—')};
}
function rotate(events){
 // Chronological rotation is deterministic, independent of filtering and pagination.
 // No randomness, extra requests or stored copies of the news are needed.
 const counts=new Map();let runners=0;
 for(const e of [...events].reverse()){
  const key=e.editorialKey;if(!editorialMapping[key])continue;
  const n=counts.get(key)||0;e.variant=(hash(e.world+'|'+key)+n)%editorialMapping[key].length;counts.set(key,n+1);
  if(e.people.some(p=>p.role==='Finalista'))e.runnerVariant=(hash(e.world+'|runner')+runners++)%editorialMapping.runner.length;
  e.title=wording(e).title;
 }
 return events;
}
function build(world,core,awards=[],now=today()){
 const out=new Map(),put=e=>{if(!e.date||e.date<=now)out.set(e.id,{world,...e});};
 const seasonAt=date=>(core.seasons||[]).find(s=>s.imc_season_start_date&&date>=s.imc_season_start_date&&(!s.imc_season_end_date||date<=s.imc_season_end_date))?.imc_season??null;
 // The raw assignments retain world team IDs; never resolve a team by name/global ID.
 for(const a of core.assignments||[]){
  const national=a.national_team_id!=null,tid=national?a.national_team_id:a.team_id;
  const matches=((national?core.nations:core.clubs)||[]).filter(t=>same(t.sm_team_id,tid));
  const team=matches.length===1?matches[0]:null;
  const person=(core.managers||[]).find(m=>same(m.manager_id,a.manager_id));
  if(!team||!person)continue;
  for(const [type,date] of [['appointment',day(a.start_date)],['departure',day(a.end_date)]]){
   if(!date)continue;
   put({id:[world,type,a.manager_id,national?'nation':'club',tid,a.start_date,date].join('|'),type,date,season:seasonAt(date),editorialKey:type==='departure'?'departure':national?'national':'club',words:{team:team.name,manager:person.full_name},
    title:type==='appointment'?`${person.full_name} alla guida di ${team.name}`:`Si conclude l’incarico di ${person.full_name} con ${team.name}`,
    teams:[team],people:[{id:a.manager_id,name:person.full_name,role:type==='appointment'?'Nuovo incarico':'Fine incarico'}],
    detail:(type==='appointment'?`${person.full_name} assume la guida di ${team.name}`:`Termina l’incarico di ${person.full_name} con ${team.name}`)+(national?' · Nazionale':' · Club'),href:link(world,{resource:'manager',manager:a.manager_id,teamType:national?'nations':'clubs',profileTab:'career'}),linkLabel:'La storia in panchina'});
  }
 }
 for(const a of awards){
  if(!a.winner)continue;
  const match=a.match,final=['cup','playoff'].includes(a.kind)&&match&&a.runner_up;
  const people=[];
  if(a.manager)people.push({id:a.manager.manager_id,name:a.manager.full_name,role:'Vincitore'});
  if(final){const side=a.side==='home'?'away':a.side==='away'?'home':null;if(side){const m=match[side+'_manager_core'];const name=m?.full_name||match[side+'_manager_name'];if(name)people.push({id:m?.manager_id,name,role:'Finalista'});}}
  const competition=a.competition?.nexus_view||'Competizione non configurata';
  const penalties=final&&match.penalty_home_score!=null&&match.penalty_away_score!=null&&Number(match.penalty_home_score)!==Number(match.penalty_away_score)&&(match.aggregate_home_score!=null&&match.aggregate_away_score!=null?Number(match.aggregate_home_score)===Number(match.aggregate_away_score):Number(match.home_score)===Number(match.away_score));
  let detail=`${a.winner.name} conquista ${competition}.`;
  if(final){detail=`${match.home_name} ${match.home_score} – ${match.away_score} ${match.away_name}`;
   if(match.penalty_home_score!=null&&match.penalty_away_score!=null)detail+=` · Rigori ${match.penalty_home_score}–${match.penalty_away_score}`;
   if(match.aggregate_home_score!=null&&match.aggregate_away_score!=null)detail+=` · Aggregato ${match.aggregate_home_score}–${match.aggregate_away_score}`;
   detail+=` · Finalista: ${a.runner_up.name}`;
  }
  put({id:world+'|award|'+a.id,type:final?'final':'trophy',date:day(a.awarded_at),season:a.season,
   title:`${a.winner.name} conquista ${competition}`,detail,people,
   editorialKey:penalties?'penalties':a.competition?.sm_action==='worldcup'?'worldcup':a.kind==='league'?'league':'cup',
   words:{team:a.winner.name,competition,runner:a.runner_up?.name||'',manager:a.manager?.full_name||''},
   teams:[a.winner.core,...(final?[a.runner_up.core]:[])].filter(Boolean),
   href:link(world,{resource:'archive',competition:a.competition?.competition_key||'',hall:'history',season:a.season||''}),linkLabel:'Trophy Room',
   matchHref:final&&match.sm_fixture_id?'match.html?'+new URLSearchParams({world,fixture:match.sm_fixture_id}):null});
 }
 return rotate(sort([...out.values()]));
}
const labels={appointment:'Nuovo incarico',departure:'Fine incarico',trophy:'Trofeo vinto',final:'Finale · vincitore e finalista'};
function image(team){const src=String(team.image_url||'');if(!/^(?:https:\/\/|\/(?!\/))/.test(src))return '';return `<img src="${esc(src)}" alt="${esc(team.name||'')}" loading="lazy" width="42" height="42">`;}
function render(e,manager=null){
 const copy=wording(e,manager);
 const date=e.date?`<time datetime="${esc(e.date)}">${esc(e.date.split('-').reverse().join('/'))}</time>`:'<span>Data non disponibile</span>';
 return `<article class="nexus-news-card"><div class="nexus-news-meta"><span>${esc(e.world)}${e.season?' · Stagione '+esc(e.season):''}</span>${date}</div><div class="nexus-news-kind">${esc(copy.label)}</div><div class="nexus-news-title">${e.teams.length?`<div class="nexus-news-crests">${e.teams.map(image).join('')}</div>`:''}<h3>${esc(manager!=null&&e.people.some(p=>same(p.id,manager)&&p.role==='Finalista')?copy.title:e.title)}</h3></div>${e.people.length?`<p class="nexus-news-people">${e.people.map(p=>`${esc(p.role)}: ${p.id?`<a href="${esc(link(e.world,{resource:'manager',manager:p.id}))}">${esc(p.name)}</a>`:esc(p.name||'Manager non disponibile')}`).join(' · ')}</p>`:''}${e.detail?`<p>${esc(e.detail)}</p>`:''}<div class="nexus-news-links"><a href="${esc(e.href)}">${esc(e.linkLabel)} →</a>${e.matchHref?`<a href="${esc(e.matchHref)}">Rivivi la finale ↗</a>`:''}</div></article>`;
}
const api={build,sort,render,labels,editorialMapping,wording};if(typeof module==='object'&&module.exports)module.exports=api;else root.NexusNews=api;
})(typeof window==='object'?window:globalThis);

