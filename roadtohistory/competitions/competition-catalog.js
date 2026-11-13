(async()=>{'use strict';
const {gw,esc,get,ready}=NexusUI,$=id=>document.getElementById(id),base='/roadtohistory/competitions/',params=new URLSearchParams(location.search);
let all=[],season='',cleanup=()=>{},category=params.get('group')||'DOMESTIC',country=params.get('country')||'',current=null,imcOnly=false;
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function route(r){if(gw==='GW001'&&r.sm_action==='league')return ['','platinum','gold','silver','bronze'][Number(r.sm_division)]||slug(r.competition_key);return slug(r.competition_key.replace(gw+'|',''))}
function url(r,tab){return base+(r?'view.html':'')+'?'+new URLSearchParams({season,...(r?{competition:r.competition_key,tab:tab||'overview'}:{}),...(country?{country}:{}),...(imcOnly&&category==='DOMESTIC'?{imc:'1'}:{}),group:category})}
function go(r,tab){location.href=url(r,tab)}
let progress={},awards={};
function card(r){return IMCCompetitionRow.render(r,progress[r.competition_key],awards[r.competition_key])}
function domesticRows(rows){
 const leagues=rows.filter(r=>r.sm_action==='league'),cups=rows.filter(r=>r.sm_action!=='league');
 const stats=leagues.map(r=>progress[r.competition_key]||{}),known=stats.length&&stats.every(p=>p.total_days>0);
 let pct=known?Math.round(100*stats.reduce((v,p)=>v+p.played_days,0)/stats.reduce((v,p)=>v+p.total_days,0)):null;
 const commonRound=known && stats.every(p=>p.played_days===stats[0].played_days && p.total_days===stats[0].total_days);
 const caption=commonRound?stats[0].played_days+' giornate su '+stats[0].total_days:'Avanzamento campionati';
 const links=leagues.map(r=>{
  const p=progress[r.competition_key]||{}, award=awards[r.competition_key]||{};
  const finished=Boolean(award.winner_name||p.complete);
  const name=award.winner_name||p.leader;
  const logo=award.winner_logo_url||p.logos?.[name];
  const label=/^Div (\d+)$/.test(r.nexus_view)?'Divisione '+r.sm_division:r.nexus_view;
  const points=!finished && p.points!=null?'<small class="league-points">'+esc(p.points)+' pt</small>':'';
  const info=name?'<small>'+(finished?'Vincitore':'Prima in classifica')+'</small><span class="league-side">'+(logo?'<img width="24" height="24" src="'+esc(logo)+'" alt="">':'')+'<strong>'+esc(name)+'</strong>'+points+'</span>':'<small>In attesa dei risultati</small>';
  return '<button class="gw-cup league-card" data-key="'+esc(r.competition_key)+'"><span class="gw-name">'+IMCCompetitionRow.symbol(true)+'<b>'+esc(label)+'</b></span><span class="gw-state">'+info+'</span></button>';
 }).join('');
 const gauge=IMCCompetitionRow.gauge(pct,caption);
 function turnLine(slot,title){
  const dates=stats.map(p=>p[slot]).filter(t=>t?.date).sort((a,b)=>a.date.localeCompare(b.date));
  const t=slot==='last_turn'?dates[dates.length-1]:dates[0];
  const value=t?[(t.number?'Giornata '+t.number:''),t.date.split('-').reverse().join('/')].filter(Boolean).join(' · '):'—';
  return '<div><small>'+title+'</small><strong>'+esc(value)+'</strong></div>';
 }
 const turns='<div class="league-turns">'+turnLine('last_turn','Ultima giornata giocata')+turnLine('next_turn','Prossima giornata')+'</div>';
 return (leagues.length?'<h3 class="cups-title">Leagues</h3><div class="league-overview">'+gauge+turns+'</div>'+links+'':'')+(cups.length?'<h3 class="cups-title">Cups</h3>'+cups.map(card).join(''):'');
}
function seasonBar(){
 const source=$('season-select'),bar=document.createElement('div');bar.className='season-bar';
 const picker=source.cloneNode(true);picker.id='catalog-season';picker.hidden=false;picker.value=season;picker.setAttribute('aria-label','Scegli stagione');
 const move=(step,label,arrow)=>{const btn=document.createElement('button');btn.textContent=arrow;btn.setAttribute('aria-label',label);btn.disabled=!picker.options[picker.selectedIndex+step];btn.onclick=()=>{picker.selectedIndex+=step;picker.onchange()};return btn};
 picker.onchange=()=>{const q=new URLSearchParams(location.search);q.set('season',picker.value);q.set('group',category);location.href=location.pathname+'?'+q};
 const filters=source.closest('.filters');filters.hidden=true;filters.style.display='none';bar.append(move(-1,'Stagione precedente','‹'),picker,move(1,'Stagione successiva','›'));filters.before(bar);
}

const countryFlags={KSA:['Arabia Saudita',79],ARG:['Argentina',46],BEL:['Belgio',27],BRA:['Brasile',47],CZE:['Cechia',5],DEN:['Danimarca',17],ENG:['Inghilterra',1],ESP:['Spagna',8],FRA:['Francia',2],GER:['Germania',3],GRE:['Grecia',9],ITA:['Italia',4],JPN:['Giappone',76],NED:['Paesi Bassi',7],POR:['Portogallo',6],SCO:['Scozia',23],SUI:['Svizzera',16],SWE:['Svezia',10],TUR:['Turchia',14],USA:['Stati Uniti',57],MEX:['Messico',58],RUS:['Russia',15],AUT:['Austria',29],POL:['Polonia',13],UKR:['Ucraina',22],CRO:['Croazia',11],SRB:['Serbia',19],NOR:['Norvegia',20],ROU:['Romania',12],AUS:['Australia',74],CHN:['Cina',75],KOR:['Corea del Sud',77],URU:['Uruguay',53],COL:['Colombia',49],CHI:['Cile',48]};
function catalog(container,modal=false){const flagScroll=container.querySelector('.catalog-country-flags')?.scrollLeft||0;const categories=[['DOMESTIC','Domestic'],['INTERNATIONAL','International'],['IMC','IMC'],['NATIONS','Nations']];let rows=all.filter(r=>r.competition_group===category);const countries=[...new Set(rows.filter(r=>r.world_type==='MULTI').map(r=>r.sm_country).filter(Boolean))].sort();if(country&&!countries.includes(country))country='';if(country)rows=rows.filter(r=>r.sm_country===country);if(imcOnly&&category==='DOMESTIC')rows=rows.filter(r=>r.has_imc_manager);
container.innerHTML='<div class="catalog-categories">'+categories.map(([id,label])=>'<button data-category="'+id+'" aria-pressed="'+(id===category)+'">'+label+'</button>').join('')+'</div>'+(countries.length?'<div class="catalog-country-flags" role="group" aria-label="Filtro paese"><button data-country="" aria-pressed="'+(!country)+'">Tutti i paesi</button>'+countries.map(c=>{const f=countryFlags[c];return '<button data-country="'+esc(c)+'" aria-pressed="'+(country===c)+'" aria-label="'+esc(f?.[0]||c)+'">'+(f?'<img src="/nexus/assets/flags/nations/'+f[1]+'.svg" alt="">':'')+'<span>'+esc(f?.[0]||c)+'</span></button>'}).join('')+'</div>':'')+'' +'<div class="competition-grid">'+(rows.length?(category==='DOMESTIC'?domesticRows(rows):rows.map(card).join('')):'<p>Nessuna competizione disponibile per questa categoria e stagione.</p>')+'</div>';
container.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;country='';catalog(container,modal)});container.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{country=b.dataset.country;catalog(container,modal)});const imcButton=container.querySelector('[data-imc]');if(imcButton)imcButton.onclick=()=>{imcOnly=!imcOnly;catalog(container,modal)};const flagRail=container.querySelector('.catalog-country-flags');if(flagRail)flagRail.scrollLeft=flagScroll;container.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>go(all.find(r=>r.competition_key===b.dataset.key),modal?new URLSearchParams(location.search).get('tab'):'overview'))}
try{const d=await get('progress.php?'+new URLSearchParams(params.has('season')?{season:params.get('season')}:{}));season=String(d.season);const picker=$('season-select');picker.replaceChildren(...d.seasons.map(n=>new Option('Stagione '+n,n)));picker.value=season;picker.disabled=false;const c={season};progress=d.progress;awards=d.awards;all=d.rows||[];
all=all.map(r=>r.sm_action==='league'?{...r,nexus_view:['','Platinum','Gold','Silver','Bronze'][Number(r.sm_division)]||r.nexus_view}:r);
const requested=params.get('division')?['','platinum','gold','silver','bronze'][Number(params.get('division'))]:null;current=all.find(r=>r.competition_key===params.get('competition'))||all.find(r=>route(r)===requested);
$('back').href='/roadtohistory/';$('back').textContent='← '+(c.world?.game_world_name||gw);for(const id of ['group-tabs','family-tabs','competition-tabs','country-filter'])$(id).hidden=true;
$('season-select').onchange=()=>{const next=new URLSearchParams(location.search);next.set('season',$('season-select').value);location.href=location.pathname+'?'+next};
if(!current){seasonBar();$('title').textContent='Competizioni';$('competition-nav').hidden=true;$('competition-tools').hidden=true;$('group-filter').hidden=true;if(requested)$('meta').textContent='Competizione non disponibile nella stagione selezionata · Scegli dal catalogo';catalog($('view'));history.replaceState(null,'',base+'?'+new URLSearchParams({season,group:category}));return}
 const dedicated={championsleague:'rth-champions-league',europaleague:'rth-europa-league',conferenceleague:'rth-conference-league',clubworldcup:'rth-club-world-cup'};
 const target=gw==='GW001'&&current.competition_group==='IMC'&&dedicated[current.competition_key.split('|').pop()];
 if(target){const query=new URLSearchParams({season,tab:params.get('tab')||'overview'});location.replace('/roadtohistory/'+target+'/?'+query);return;}
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/roadtohistory/imc-cups/league-page.js?v=actualtabs1';script.onload=resolve;script.onerror=reject;document.head.append(script);});
 await showLeaguePage({world:gw,base,competition:current,seasons:d.seasons,season});return;
}catch(e){$('view').innerHTML='<div class="empty">'+esc(e.message)+'</div>'}
})();
