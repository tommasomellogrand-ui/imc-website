(async()=>{'use strict';
const {gw,esc,get,ready}=NexusUI,$=id=>document.getElementById(id),base='/scudetto/competitions/',params=new URLSearchParams(location.search);
let all=[],season='',cleanup=()=>{},category=params.get('group')||'DOMESTIC',country=params.get('country')||'',current=null,imcOnly=false;
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function route(r){return slug(r.competition_key.replace(gw+'|',''))}
function url(r,tab){return base+(r?'view.html':'')+'?'+new URLSearchParams({season,...(r?{competition:r.competition_key,tab:tab||'overview'}:{}),...(country?{country}:{}),...(imcOnly&&category==='DOMESTIC'?{imc:'1'}:{}),group:category})}
function go(r,tab){location.href=url(r,tab)}
let progress={};
function card(r){
 const p=progress[r.competition_key]||{};
 const league=r.sm_action==='league';
 const kind=league?'Divisione '+r.sm_division:r.sm_action==='playoff'?'Playoff':'Coppa';
 const label=p.label||(r.result_count?'In corso':'In programma');
 const info=Number.isFinite(p.percent)?'<span class="round-progress"><progress aria-label="Avanzamento" max="100" value="'+p.percent+'"></progress>'+p.percent+'%</span>':(p.detail?'<small>'+esc(p.detail)+'</small>':'');
 return '<button class="competition-card" data-key="'+esc(r.competition_key)+'"><span><strong>'+esc(r.nexus_view)+'</strong><small>'+esc(kind)+'</small></span><span><span class="row-stage">'+esc(label)+'</span>'+info+'</span></button>';
}
function seasonBar(){
 const source=$('season-select'),bar=document.createElement('div');bar.className='season-bar';
 const picker=source.cloneNode(true);picker.id='catalog-season';picker.hidden=false;picker.value=season;picker.setAttribute('aria-label','Scegli stagione');
 const move=(step,label,arrow)=>{const btn=document.createElement('button');btn.textContent=arrow;btn.setAttribute('aria-label',label);btn.disabled=!picker.options[picker.selectedIndex+step];btn.onclick=()=>{picker.selectedIndex+=step;picker.onchange()};return btn};
 picker.onchange=()=>{const q=new URLSearchParams(location.search);q.set('season',picker.value);q.set('group',category);location.href=location.pathname+'?'+q};
 const filters=source.closest('.filters');filters.hidden=true;filters.style.display='none';bar.append(move(-1,'Stagione precedente','‹'),picker,move(1,'Stagione successiva','›'));filters.before(bar);
}

const countryFlags={KSA:['Arabia Saudita',79],ARG:['Argentina',46],BEL:['Belgio',27],BRA:['Brasile',47],CZE:['Cechia',5],DEN:['Danimarca',17],ENG:['Inghilterra',1],ESP:['Spagna',8],FRA:['Francia',2],GER:['Germania',3],GRE:['Grecia',9],ITA:['Italia',4],JPN:['Giappone',76],NED:['Paesi Bassi',7],POR:['Portogallo',6],SCO:['Scozia',23],SUI:['Svizzera',16],SWE:['Svezia',10],TUR:['Turchia',14],USA:['Stati Uniti',57],MEX:['Messico',58],RUS:['Russia',15],AUT:['Austria',29],POL:['Polonia',13],UKR:['Ucraina',22],CRO:['Croazia',11],SRB:['Serbia',19],NOR:['Norvegia',20],ROU:['Romania',12],AUS:['Australia',74],CHN:['Cina',75],KOR:['Corea del Sud',77],URU:['Uruguay',53],COL:['Colombia',49],CHI:['Cile',48]};
function catalog(container,modal=false){const flagScroll=container.querySelector('.catalog-country-flags')?.scrollLeft||0;const categories=[['DOMESTIC','Domestic'],['INTERNATIONAL','International'],['NATIONS','Nations'],...(all.some(r=>r.competition_group==='IMC')?[['IMC','IMC']]:[])];let rows=all.filter(r=>r.competition_group===category);const countries=[...new Set(rows.filter(r=>r.world_type==='MULTI').map(r=>r.sm_country).filter(Boolean))].sort();if(country&&!countries.includes(country))country='';if(country)rows=rows.filter(r=>r.sm_country===country);if(imcOnly&&category==='DOMESTIC')rows=rows.filter(r=>r.has_imc_manager);
container.innerHTML='<div class="catalog-categories">'+categories.map(([id,label])=>'<button data-category="'+id+'" aria-pressed="'+(id===category)+'">'+label+'</button>').join('')+'</div>'+(countries.length?'<div class="catalog-country-flags" role="group" aria-label="Filtro paese"><button data-country="" aria-pressed="'+(!country)+'">Tutti i paesi</button>'+countries.map(c=>{const f=countryFlags[c];return '<button data-country="'+esc(c)+'" aria-pressed="'+(country===c)+'" aria-label="'+esc(f?.[0]||c)+'">'+(f?'<img src="/nexus/assets/flags/nations/'+f[1]+'.svg" alt="">':'')+'<span>'+esc(f?.[0]||c)+'</span></button>'}).join('')+'</div>':'')+'' +'<div class="competition-grid">'+(rows.length?rows.map(card).join(''):'<p>Nessuna competizione disponibile per questa categoria e stagione.</p>')+'</div>';
container.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;country='';catalog(container,modal)});container.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{country=b.dataset.country;catalog(container,modal)});const imcButton=container.querySelector('[data-imc]');if(imcButton)imcButton.onclick=()=>{imcOnly=!imcOnly;catalog(container,modal)};const flagRail=container.querySelector('.catalog-country-flags');if(flagRail)flagRail.scrollLeft=flagScroll;container.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>go(all.find(r=>r.competition_key===b.dataset.key),modal?new URLSearchParams(location.search).get('tab'):'overview'))}
try{const c=await ready;season=c.season;if(!season)throw Error('Nessuna stagione disponibile.');const d=await get('catalog.php?'+new URLSearchParams({world:gw,season}));all=d.rows||[];
const requested=params.get('division');current=all.find(r=>r.competition_key===params.get('competition'))||all.find(r=>r.sm_action==='league'&&String(r.sm_division)===requested);
$('back').href='/scudetto/';$('back').textContent='← '+(c.world?.game_world_name||gw);for(const id of ['group-tabs','family-tabs','competition-tabs','country-filter'])$(id).hidden=true;
$('season-select').onchange=()=>{const next=new URLSearchParams(location.search);next.set('season',$('season-select').value);location.href=location.pathname+'?'+next};
if(!current){seasonBar();try{progress=(await get('progress.php?season='+encodeURIComponent(season))).progress||{}}catch{}$('title').textContent='Competizioni';$('competition-nav').hidden=true;$('competition-tools').hidden=true;$('group-filter').hidden=true;if(requested)$('meta').textContent='Competizione non disponibile nella stagione selezionata · Scegli dal catalogo';catalog($('view'));history.replaceState(null,'',base+'?'+new URLSearchParams({season,group:category}));return}
document.body.classList.add('competition-detail');
const rail=document.createElement('nav');rail.className='competition-rail';rail.setAttribute('aria-label','Competizioni');
rail.innerHTML=all.filter(r=>r.competition_group===current.competition_group).map(r=>'<a href="'+esc(url(r))+'"'+(r.competition_key===current.competition_key?' aria-current="page"':'')+'>'+esc(r.nexus_view)+'</a>').join('');
$('back').closest('.back-row').before(rail);
const banner=document.createElement('section');banner.className='competition-banner';banner.setAttribute('aria-label',current.nexus_view);
banner.innerHTML=NexusUI.icon('cup')+'<div><p>Scudetto · '+esc(current.competition_group)+'</p><h1>'+esc(current.nexus_view)+'</h1></div>';
$('back').closest('.back-row').after(banner);
const context=document.createElement('div');context.className='competition-context';banner.after(context);context.append($('season-select').closest('.filters'));
const status=document.createElement('span');status.id='competition-status';status.className='competition-status';status.textContent='Caricamento stato…';context.append(status);
category=current.competition_group;const initial=['overview','results','schedule','standings','stats'].includes(params.get('tab'))?params.get('tab'):'overview';history.replaceState(null,'',url(current,initial));$('title').textContent=current.nexus_view;document.title=current.nexus_view+' · Scudetto';$('group').textContent=category;$('competition-tools').hidden=false;$('selected-name').textContent=current.nexus_view;
const changer=document.createElement('button');changer.className='change-competition';changer.textContent='Cambia competizione';$('back').after(changer);const dialog=document.createElement('dialog');dialog.className='catalog-dialog';dialog.innerHTML='<div class="catalog-dialog-head"><h2>Cambia competizione</h2><button aria-label="Chiudi">×</button></div><div id="switch-catalog"></div>';document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();changer.onclick=()=>{catalog($('switch-catalog'),true);dialog.showModal()};
$('competition-nav').hidden=false;$('competition-nav').innerHTML='<button data-section="overview">Overview</button><button data-section="matches">Partite</button><button data-section="standings">Classifica</button><button data-section="stats">Statistiche</button>';
const sub=document.createElement('nav');sub.className='catalog-match-tabs';sub.innerHTML='<button data-match-tab="results">Risultati</button><button data-match-tab="schedule">Calendario</button>';sub.setAttribute('aria-label','Risultati e calendario');$('view').before(sub);
function mount(tab){cleanup();const section=['results','schedule'].includes(tab)?'matches':tab;sub.hidden=section!=='matches';document.querySelectorAll('[data-section]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.section===section)));sub.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.matchTab===tab)));history.replaceState(null,'',url(current,tab));cleanup=NexusCompetition.mount({season,key:current.competition_key,name:current.nexus_view,action:current.sm_action,tab})||(()=>{})}
document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>mount(b.dataset.section==='matches'?'results':b.dataset.section));sub.querySelectorAll('button').forEach(b=>b.onclick=()=>mount(b.dataset.matchTab));mount(initial);
}catch(e){$('view').innerHTML='<div class="empty">'+esc(e.message)+'</div>'}
})();

