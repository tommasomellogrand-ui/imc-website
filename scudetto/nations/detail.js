const p=new URLSearchParams(location.search),gw='IMC-008',type='nation',id=p.get('id')||'',tabs=document.getElementById('tabs'),view=document.getElementById('view');localStorage.setItem('imc_nexus_world',gw);document.getElementById('gw').textContent=gw;document.body.dataset.profileFamily=type==='nation'?'nations':'teams';document.getElementById('back').textContent=type==='nation'?'← Nations':'← Clubs';document.getElementById('back').href='/scudetto/nations/';const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));let season='',D,C={},statsRequest,matchesRequest,transfersRequest,activeTab,transferDirection='in';const names=type==='club'?['OVERVIEW','MANAGER','ROSTER','STATS','DATA ROOM','H2H','TRANSFERS','TROPHY ROOM']:['OVERVIEW','MANAGER','ROSTER','STATS','DATA ROOM','H2H','TROPHY ROOM'];function matchRows(a){if(!a?.length)return '<div class="card empty">Nessuna partita nella stagione selezionata.</div>';return '<div class="card rows">'+(a||[]).slice(0,10).map(r=>'<div class="row"><b>'+esc(r.home_name)+'</b><span class="score">'+matchScore(r)+'</span><b class="away">'+esc(r.away_name)+'</b></div>').join('')+'</div>'}
function matchScore(r){const valid=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&/^\d+$/.test(String(v));let text=esc(r.home_score)+' - '+esc(r.away_score);for(const [prefix,label] of [['aggregate','Totale A/R'],['penalty','Rigori']]){const h=r[prefix+'_home_score'],a=r[prefix+'_away_score'];if(valid(h)&&valid(a))text+='<small style="display:block;font-size:10px;font-weight:600;line-height:1.4;margin-top:4px;text-align:center">'+label+' '+esc(h)+' - '+esc(a)+'</small>'}return text}
function show(n){if(!['MANAGER','TROPHY ROOM','OVERVIEW','STATS','TRANSFERS','ROSTER','DATA ROOM','H2H'].includes(n)||(type==='nation'&&n==='TRANSFERS')){view.innerHTML='<div class="card empty">Sezione non ancora collegata.</div>';return}if(n==='OVERVIEW'){const s=C?.summary||{};view.innerHTML='<div class="kpis">'+[['PARTITE',s.played],['VITTORIE',s.won],['PAREGGI',s.drawn],['SCONFITTE',s.lost],['GF',s.gf],['GS',s.ga],['DIFF.',s.gd],['WIN %',(s.win_pct??0)+'%']].map(x=>'<div class="kpi"><b>'+esc(x[1]??0)+'</b><span>'+x[0]+'</span></div>').join('')+'</div><h3 class="section-title">ULTIME PARTITE</h3>'+matchRows(C?.matches)}
else if(n==='MANAGER')view.innerHTML=D.manager?'<div class="card manager"><a href="/scudetto/managers/profile.html?manager='+encodeURIComponent(D.manager.manager_id)+'"><b>'+esc(D.manager.full_name)+'</b></a><span>'+esc(D.manager.manager_id)+' · dal '+esc(D.manager.start_date||'—')+(D.manager.end_date?' al '+esc(D.manager.end_date):'')+'</span></div>':'<div class="card empty">Nessun manager assegnato.</div>';
else if(n==='ROSTER')showRoster();
else if(n==='DATA ROOM')NexusDataRoom.mount(view,{world:gw,kind:type==='nation'?'nation':'club',id:String(D.team.world_id),scope:type==='nation'?'national_team':'club'});
else if(n==='STATS')showClubStats();
else if(n==='H2H'){document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+' · Tutto lo storico';NexusH2H.mount(view,{world:gw,kind:type==='nation'?'nation':'club',id:String(D.team.world_id),name:D.team.name})}
else if(n==='TRANSFERS')showTransfers();
else if(n==='TROPHY ROOM')showClubTrophies();
else view.innerHTML='<div class="card empty">Sezione non ancora collegata.</div>'}

let trophyRequestVersion=0;
async function showClubTrophies(){
 const version=++trophyRequestVersion;
 document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+' · Trophy Room · Tutte le stagioni';
 view.innerHTML='<div class="card empty" aria-live="polite">Caricamento trofei…</div>';
 try{
  if(!D.team?.world_id)throw Error('Squadra non disponibile.');
  const j=await readClub('/site-data/trophies/index.php',false);
  if(activeTab!=='TROPHY ROOM'||version!==trophyRequestVersion)return;
  const rows=j.rows||[];
  await NexusTrophies.mount(view,rows,gw);
 }catch(e){if(activeTab==='TROPHY ROOM'&&version===trophyRequestVersion)view.innerHTML='<div class="card empty">'+esc(e.message)+'</div>';}
}

let clubStatsSeason='',clubStatSeasons=[],clubStatsVersion=0;
function statsPeriodLabel(){return clubStatsSeason?'Stagione '+clubStatsSeason:'Globali · Tutte le stagioni'}
async function showClubStats(){
 const version=++clubStatsVersion,selected=clubStatsSeason;
 document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+' · '+statsPeriodLabel();
 view.innerHTML='<div class="card" style="margin-bottom:14px"><label for="club-stats-season" style="font-weight:700">Statistiche </label><select id="club-stats-season" style="font:inherit;padding:10px;border:1px solid var(--l);border-radius:10px;background:#fff;color:var(--b)"><option value=""'+(!selected?' selected':'')+'>Globali · Tutte le stagioni</option>'+clubStatSeasons.map(s=>'<option value="'+s+'"'+(String(s)===selected?' selected':'')+'>Stagione '+s+'</option>').join('')+'</select></div><div id="club-stats-values" aria-live="polite"><div class="card empty">Caricamento statistiche…</div></div>';
 document.getElementById('club-stats-season').onchange=e=>{clubStatsSeason=e.target.value;showClubStats();document.getElementById('club-stats-season').focus()};
 try{
  if(!D.team?.world_id)throw Error('Squadra non disponibile.');
  const j=await readClub('stats.php',!!selected,selected);
  if(activeTab!=='STATS'||version!==clubStatsVersion)return;
  const s=j.stats,win=s.played?Math.round(s.won/s.played*1000)/10:0;
  document.getElementById('club-stats-values').innerHTML='<div class="kpis">'+[['PARTITE',s.played],['VITTORIE',s.won],['PAREGGI',s.drawn],['SCONFITTE',s.lost],['GF',s.gf],['GS',s.ga],['DIFF.',s.gd],['WIN %',win+'%']].map(x=>'<div class="kpi"><b>'+esc(x[1]??0)+'</b><span>'+x[0]+'</span></div>').join('')+'</div><p class="muted">'+esc(statsPeriodLabel())+' · Calcolate dai risultati disponibili.</p>'+(!s.played?'<div class="card empty">Nessuna partita disputata nel periodo selezionato.</div>':'');
 }catch(e){if(activeTab==='STATS'&&version===clubStatsVersion)document.getElementById('club-stats-values').innerHTML='<div class="card empty">'+esc(e.message)+'</div>'}
}
async function readClub(file,withSeason=true,selectedSeason=season){
 const q=new URLSearchParams({world:gw,[type==='nation'&&file==='/site-data/trophies/index.php'?'sm_nation':'sm_club']:String(D.team.world_id)});if(type==='nation')q.set('type','nation');if(withSeason&&selectedSeason)q.set('season',selectedSeason);
 const r=await fetch(file+'?'+q,{cache:'no-store'}),j=await r.json();if(!r.ok||j.ok===false)throw Error('Impossibile caricare i dati. Riprova.');return j;
}
function loadStats(){
 if(!statsRequest)statsRequest=readClub('stats.php').then(j=>{const s=j.stats;C.summary={...s,win_pct:s.played?Math.round(s.won/s.played*1000)/10:0};}).catch(e=>{statsRequest=null;throw e});return statsRequest;
}
function loadMatches(){
 if(!matchesRequest)matchesRequest=readClub('matches.php').then(j=>{const seen=new Set;C.matches=(j.results||[]).filter(r=>{if(r.home_score==null||r.away_score==null)return false;const fixture=String(r.sm_fixture_id??'');if(fixture&&seen.has(fixture))return false;if(fixture)seen.add(fixture);return true});}).catch(e=>{matchesRequest=null;throw e});return matchesRequest;
}
function loadTransfers(){
 if(!transfersRequest)transfersRequest=readClub('/site-data/transfers/index.php',false).then(j=>{C.transfers=j.rows||[];}).catch(e=>{transfersRequest=null;throw e});return transfersRequest;
}
function showTransfers(){
 const club=String(D.team.world_id),all=C.transfers||[],incoming=all.filter(x=>String(x.to_sm_world_club_id)===club),outgoing=all.filter(x=>String(x.from_sm_world_club_id)===club),rows=transferDirection==='in'?incoming:outgoing;
 view.innerHTML='<p class="muted">Trasferimenti · Tutte le stagioni</p><div class="transfer-tabs" role="tablist" aria-label="Direzione trasferimenti">'+[['in','In',incoming.length],['out','Out',outgoing.length]].map(([direction,label,count])=>'<button type="button" role="tab" id="transfer-'+direction+'" aria-controls="transfer-list" aria-selected="'+(transferDirection===direction)+'" data-direction="'+direction+'">'+label+' ('+count+')</button>').join('')+'</div><div class="transfer-list" id="transfer-list" role="tabpanel" aria-labelledby="transfer-'+transferDirection+'">'+(rows.length?rows.map(NexusCards.transfer).join(''):'<div class="card empty">Nessun trasferimento in '+(transferDirection==='in'?'entrata':'uscita')+'.</div>')+'</div>';
 NexusCards.wireImages(view);
 view.querySelectorAll('[data-direction]').forEach(button=>button.onclick=()=>{transferDirection=button.dataset.direction;showTransfers();view.querySelector('#transfer-'+transferDirection).focus();});
}
let rosterFilter='active',rosterData=null,rosterSeason='',rosterVersion=0,rosterLoading=false;
function rosterMarketValue(value){
 if(value==null||String(value).trim()==='')return null;
 let text=String(value).trim().replace(/[€£$\s]/g,'').toUpperCase();
 const compact=text.match(/^(\d+(?:[.,]\d+)?)\s*([KMB])$/);
 if(compact)return Math.round(Number(compact[1].replace(',','.'))*({K:1e3,M:1e6,B:1e9}[compact[2]]));
 if(/^\d{1,3}(?:[.,]\d{3})+$/.test(text))text=text.replace(/[.,]/g,'');
 else if(/^\d+,\d{1,2}$/.test(text))text=text.replace(',','.');
 if(!/^\d+(?:\.\d+)?$/.test(text))return null;
 const number=Number(text);return Number.isFinite(number)?number:null;
}
function rosterSummary(rows){
 const active=rows.filter(x=>x.roster_status==='active');
 const values=active.map(x=>rosterMarketValue(x.market_value)),known=values.filter(x=>x!==null);
 const total=known.reduce((sum,value)=>sum+value,0);
 const label=known.length||!active.length?new Intl.NumberFormat('it-IT',{maximumFractionDigits:0}).format(total):'—';
 return '<section class="card" aria-label="Riepilogo rosa attiva" style="margin-bottom:16px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div><span class="muted">Giocatori attivi</span><strong style="display:block;font-size:26px">'+active.length+'</strong></div><div><span class="muted">Valore totale</span><strong style="display:block;font-size:clamp(18px,5vw,26px);overflow-wrap:anywhere">'+label+'</strong></div></div>'+(known.length<active.length?'<p class="muted" style="margin-bottom:0">Valore disponibile per '+known.length+' su '+active.length+' giocatori.</p>':'')+'</section>';
}
function rosterCard(x){
 const stat=(label,title,value)=>'<div class="nc-stat" title="'+title+'"><b>'+esc(value??'—')+'</b><span>'+label+'</span></div>';
 const status=type==='club'?'<span class="roster-status '+esc(x.roster_status||'unknown')+'">'+({active:'Attivo',departed:'Ceduto',unknown:'Da verificare'}[x.roster_status]||'Da verificare')+'</span>':'';
 return '<a class="nc-card" style="color:inherit;text-decoration:none" href="'+esc(('/scudetto/playercodex/profile.html?player='+encodeURIComponent(x.player_id)))+'" data-player-id="'+esc(x.player_id)+'">'+NexusCards.photo(x.image_urls,x.full_name)+'<div class="nc-data"><div class="nc-name">'+'<span>'+esc(x.full_name)+'</span>'+status+'</div><div class="nc-meta">'+esc(x.position||'—')+' · '+esc(x.age??'—')+' anni · '+esc(x.nationality||'—')+' · Rating '+esc(x.rating??'—')+'</div><div class="nc-stat-row">'+[['Pres.','Presenze',x.appearances],['Tit.','Titolare',x.starts],['Sub.','Subentrato',x.subs],['Panc.','Panchina senza ingresso',x.bench],['Min.','Minuti giocati',x.minutes]].map(a=>stat(...a)).join('')+'</div><div class="nc-stat-row second">'+[['Gol','Gol',x.goals],['Assist','Assist',x.assists],['Media','Media voto',x.average_rating==null?null:Number(x.average_rating).toFixed(2)],['MVP','Uomo partita',x.mom],['Gialli','Ammonizioni',x.yellow],['Rossi','Espulsioni',x.red]].map(a=>stat(...a)).join('')+'</div></div></a>';
}
async function showRoster(background=false){
 const version=++rosterVersion,selected=rosterSeason;rosterLoading=true;
 const period=selected?'Stagione '+selected:'Globali · Tutte le stagioni';
 document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+' · '+period;
 if(!background){
  view.innerHTML='<div class="card nc-toolbar"><label for="roster-season">Statistiche</label><select id="roster-season"><option value="">Globali · Tutte le stagioni</option>'+clubStatSeasons.map(s=>'<option value="'+s+'"'+(String(s)===selected?' selected':'')+'>Stagione '+s+'</option>').join('')+'</select></div><div id="roster-values" aria-live="polite"><div class="card empty">Caricamento rosa…</div></div>';
  document.getElementById('roster-season').onchange=e=>{rosterSeason=e.target.value;showRoster();document.getElementById('roster-season').focus()};
 }
 try{
  const j=rosterData&&rosterData.season===selected&&background==='filter'?rosterData.data:await readClub('roster.php',!!selected,selected);rosterData={season:selected,data:j};
  if(activeTab!=='ROSTER'||version!==rosterVersion)return;
  let html=(type==='club'?rosterSummary(j.rows):'')+'<p class="nc-roster-note">'+(type==='nation'?'Giocatori presenti nei Match Report del periodo selezionato':'Rosa e storico · Stato aggiornato dai trasferimenti')+' · '+esc(period)+' · Statistiche dai '+esc(j.reports)+' Match Report disponibili per '+(type==='nation'?'questa nazionale':'questo club')+'.<br>Pres. = Tit. + Sub. · Panc. = non entrato · MVP = uomo partita.</p>';
  if(type==='club')html+='<div class="transfer-tabs" role="tablist" aria-label="Stato rosa">'+[['active','Attivi'],['departed','Ceduti']].map(([v,label])=>'<button type="button" role="tab" data-roster-state="'+v+'" aria-pressed="'+(rosterFilter===v)+'" aria-selected="'+(rosterFilter===v)+'">'+label+' ('+j.rows.filter(x=>(x.roster_status||'unknown')===v).length+')</button>').join('')+'</div>';
  const visibleRows=type==='club'?j.rows.filter(x=>(x.roster_status||'unknown')===rosterFilter):j.rows;
  const groups=['Portieri','Difensori','Centrocampisti','Attaccanti'];
  if(j.rows.some(x=>!groups.includes(x.role_group)))groups.push('Ruolo non disponibile');
  for(const group of groups){const rows=visibleRows.filter(x=>x.role_group===group);html+='<h3 class="role-title">'+esc(group)+' ('+rows.length+')</h3><div class="roster-grid">'+(rows.length?rows.map(rosterCard).join(''):'<p class="muted">Nessun giocatore.</p>')+'</div>'}
  if(type==='club'&&j.rows.some(x=>x.roster_status==='unknown'))html+='<p class="nc-roster-note">'+j.rows.filter(x=>x.roster_status==='unknown').length+' giocatori storici con stato non verificabile dai dati disponibili.</p>';
  if(j.rows.some(x=>x.minutes_missing))html+='<p class="nc-roster-note">— nei minuti: dati di ingresso, uscita o fine partita incompleti nei report.</p>';
  if(j.invalid_reports)html+='<p class="nc-roster-note">'+esc(j.invalid_reports)+' report con dati giocatori non leggibili.</p>';
  document.getElementById('roster-values').innerHTML=j.rows.length||type==='club'?html:'<div class="card empty">'+(type==='nation'?'Nessuna convocazione disponibile nei Match Report.':'Nessun giocatore associato a questo club nel Player Codex.')+'</div>';
  view.querySelectorAll('[data-roster-state]').forEach(b=>b.onclick=()=>{rosterFilter=b.dataset.rosterState;showRoster('filter')});
  NexusCards.wireImages(view);
 }catch(e){if(activeTab==='ROSTER'&&version===rosterVersion)document.getElementById('roster-values').innerHTML='<div class="card empty">'+esc(e.message)+'</div>'}
 finally{if(version===rosterVersion)rosterLoading=false}
}


async function openTab(n){
 NexusH2H.stop(view);NexusHistory.stop(view);NexusDataRoom.stop(view);activeTab=n;trophyRequestVersion++;
 tabs.querySelectorAll('.tab').forEach(b=>{const active=b.dataset.n===n;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});clubStatsVersion++;rosterVersion++;rosterLoading=false;
 if(n!=='STATS')document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+(season?' · Season '+season:'');
 if(n==='OVERVIEW'){document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+' · Storico globale e stagioni';NexusHistory.mount(view,{world:gw,kind:type==='nation'?'nation':'club',id:String(D.team.world_id)});return;}
 if(type==='club'&&['TRANSFERS'].includes(n)){
  view.innerHTML='<div class="card empty">Caricamento...</div>';
  try{if(!D.team?.world_id)throw Error('Squadra non disponibile.');await Promise.all(n==='TRANSFERS'?[loadTransfers()]:n==='OVERVIEW'?[loadStats(),loadMatches()]:[loadStats()]);}
  catch(e){if(activeTab===n)view.innerHTML='<div class="card empty">'+esc(e.message)+'</div>';return;}
 }
 if(activeTab===n)show(n);
}
async function init(){const context=await fetch('/site-data/core/context.php?world='+encodeURIComponent(gw),{cache:'no-store'}).then(r=>r.json());season=String(context.current_season??'');clubStatSeasons=[...new Set((context.seasons||[]).map(s=>Number(s.imc_season)).filter(s=>Number.isInteger(s)&&s>0))].sort((a,b)=>b-a);D=await fetch('detail.php?world='+encodeURIComponent(gw)+'&type='+type+'&id='+encodeURIComponent(id),{cache:'no-store'}).then(r=>r.json());if(!D.ok||!D.team){document.getElementById('name').textContent=type==='nation'?'Nazionale non disponibile':'Club non disponibile';view.innerHTML='<div class="card empty">Squadra non presente nel Game World selezionato.</div>';return;}document.getElementById('kind').textContent=type==='nation'?'NATION':'CLUB';document.title='Scudetto · '+(D.team?.name||(type==='nation'?'Nation':'Club'));document.getElementById('name').textContent=D.team?.name||'Team';document.getElementById('meta').textContent='ID '+(D.team?.world_id||'—')+' · '+gw+(season?' · Season '+season:'');document.getElementById('image').innerHTML=D.team?.image_url?'<img src="'+esc(String(D.team.image_url).replace(/^http:/i,'https:'))+'" alt="">':'<div class="crest"></div>';tabs.innerHTML=names.map((n,i)=>'<button class="tab '+(!i?'active':'')+'" data-n="'+n+'">'+n+'</button>').join('');tabs.querySelectorAll('.tab').forEach(b=>b.onclick=async()=>{tabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');openTab(b.dataset.n)});openTab('OVERVIEW')}init().catch(()=>{view.innerHTML='<div class="card empty">Impossibile caricare la nazionale. <button type="button" onclick="location.reload()">Riprova</button></div>'});
