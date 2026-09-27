(()=>{
 'use strict';
 const instances=new WeakMap();
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const date=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'Data non disponibile';
 const number=v=>v==null?'—':Number(v).toLocaleString('it-IT',{maximumFractionDigits:2});
 const image=x=>{const src=String(x?.image_url||'');return /^(https:\/\/|\/(?!\/))/i.test(src)?'<img src="'+esc(src)+'" alt="">':'<span class="hh-initials" aria-hidden="true">'+esc(String(x?.name||'?').split(/\s+/).map(v=>v[0]).slice(0,2).join(''))+'</span>'};
 const kpis=s=>'<div class="hh-kpis">'+[['Incontri',s.played],['Vittorie',s.won],['Pareggi',s.drawn],['Sconfitte',s.lost],['Gol fatti',s.gf],['Gol subiti',s.ga],['Differenza',s.gd],['Vittorie %',s.win_pct]].map(([label,v])=>'<div><b>'+number(v)+'</b><span>'+label+'</span></div>').join('')+'</div>';
 function score(m){let s=esc(m.home_score)+' – '+esc(m.away_score);for(const [prefix,label] of [['aggregate','Totale A/R'],['penalty','Rigori']])if(m[prefix+'_home_score']!=null&&m[prefix+'_away_score']!=null)s+='<small>'+label+' '+esc(m[prefix+'_home_score'])+' – '+esc(m[prefix+'_away_score'])+'</small>';return s;}
 function match(m){
  const team=side=>'<div class="hh-team">'+image(m[side])+'<div><b>'+esc(m[side].name)+'</b><small>'+esc(m[side+'_manager']?.name||'Manager non identificato')+'</small></div></div>';
  const round=[m.competition_stage,m.competition_round!=null?'Turno '+m.competition_round:null,m.competition_group_name].filter(Boolean).join(' · ');
  return '<article class="hh-match"><div class="hh-match-meta">'+esc(date(m.match_date))+' · Stagione '+esc(m.imc_season??'—')+' · '+esc(m.competition_name)+(round?' · '+esc(round):'')+'</div><div class="hh-match-teams">'+team('home')+'<div class="hh-score">'+score(m)+'</div>'+team('away')+'</div></article>';
 }
 function playerTable(rows,world){return rows.length?'<div class="hh-table-wrap"><table class="hh-table"><thead><tr>'+['Giocatore','Pres.','Gol','Assist','Media','MVP'].map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(p=>'<tr><th scope="row"><a style="color:inherit;text-decoration:underline;text-underline-offset:3px" href="../players/profile.html?'+esc(new URLSearchParams({world,player:p.player_id}))+'">'+esc(p.name)+'</a></th><td>'+p.appearances+'</td><td>'+p.goals+'</td><td>'+p.assists+'</td><td title="'+p.rated_matches+' partite con voto">'+number(p.rating)+'</td><td>'+p.mom+'</td></tr>').join('')+'</tbody></table></div>':'<p class="hh-note">Nessuna presenza disponibile nei report.</p>';}
 function detailContent(d,tab){
  if(tab==='matches')return d.matches.length?d.matches.map(match).join(''):'<p class="hh-note">Nessuna partita.</p>';
  if(tab==='comparison'){
   const labels={possession:'Possesso medio %',total_shots:'Tiri per partita',shots_on_target:'Tiri in porta per partita',accuracy:'Precisione al tiro %',corners:'Corner per partita',yellow_cards:'Gialli per partita',red_cards:'Rossi per partita'};
   return '<p class="hh-note">Statistiche di squadra disponibili in '+d.team_reports+' Match Report su '+d.summary.played+' incontri. Ogni riga confronta solo report con entrambi i valori disponibili.</p><div class="hh-table-wrap"><table class="hh-table"><thead><tr><th>Dato</th><th>'+esc(d.subject.name)+'</th><th>'+esc(d.opponent?.name||'Avversario')+'</th><th>Report</th></tr></thead><tbody>'+Object.entries(labels).map(([key,label])=>{const m=d.metrics[key];return '<tr><th scope="row">'+label+'</th><td>'+number(m.own)+'</td><td>'+number(m.opponent)+'</td><td>'+m.matches+'</td></tr>'}).join('')+'</tbody></table></div>';
  }
  if(tab==='players')return '<p class="hh-note">Presenze negli scontri diretti dai '+d.player_reports+' Match Report con dati giocatori. Media calcolata solo sui voti disponibili. MVP = uomo partita.</p><h4>'+esc(d.subject.name)+'</h4>'+playerTable(d.players.own,d.world)+'<h4>'+esc(d.opponent?.name||'Avversario')+'</h4>'+playerTable(d.players.opponent,d.world);
  const s=d.summary,streak={V:'vittorie',N:'pareggi',P:'sconfitte'};
  return kpis(s)+'<p class="hh-note">Match Report disponibili: '+s.reports+' su '+s.played+' incontri. Vittorie e pareggi si riferiscono al punteggio di gioco; i rigori sono separati.</p><div class="hh-facts"><div><b>Striscia attuale</b><span>'+s.streak.count+' '+esc(streak[s.streak.outcome]||'incontri')+'</span></div><div><b>Serie di rigori</b><span>'+s.penalty_won+' vinte · '+s.penalty_lost+' perse</span></div></div><div class="hh-table-wrap"><table class="hh-table"><thead><tr><th>Campo</th><th>Incontri</th><th>V</th><th>N</th><th>P</th><th>GF–GS</th></tr></thead><tbody>'+[['Casa',d.home],['Trasferta',d.away]].map(([name,v])=>'<tr><th>'+name+'</th><td>'+v.played+'</td><td>'+v.won+'</td><td>'+v.drawn+'</td><td>'+v.lost+'</td><td>'+v.gf+'–'+v.ga+'</td></tr>').join('')+'</tbody></table></div>'+(s.last_match?'<h4>Ultima sfida</h4>'+match(s.last_match):'')+(s.biggest_win?'<h4>Vittoria più larga</h4>'+match(s.biggest_win):'');
 }
 function stop(root){const old=instances.get(root);if(old){old.stopped=true;clearInterval(old.timer);document.removeEventListener('visibilitychange',old.onVisible);instances.delete(root);}}
 function mount(root,options){
  stop(root);const state={...options,scope:'club',competition:'',venue:'',search:'',version:0,stopped:false,loading:false,rows:[]};instances.set(root,state);
  root.innerHTML='<section class="hh"><p class="hh-note">'+esc(options.world)+' · Tutto lo storico · Bilancio dalla prospettiva di '+esc(options.name||'questa pagina')+'</p>'+(options.kind==='manager'?'<div class="hh-scope" role="tablist" aria-label="Tipo di incarico"><button role="tab" aria-selected="true" data-scope="club">Club</button><button role="tab" aria-selected="false" data-scope="national_team">Nazionali</button></div>':'')+'<div class="hh-summary" aria-live="polite"></div><div class="hh-tools"><label>Avversario<input class="hh-search" type="search" placeholder="Cerca avversario…"></label><label>Competizione<select class="hh-competition"><option value="">Tutte le competizioni</option></select></label><label>Campo<select class="hh-venue"><option value="">Casa e trasferta</option><option value="home">Casa</option><option value="away">Trasferta</option></select></label></div><div class="hh-list"></div></section>';
  const summary=root.querySelector('.hh-summary'),list=root.querySelector('.hh-list'),competition=root.querySelector('.hh-competition');
  async function request(opponent){const q=new URLSearchParams({world:state.world,kind:state.kind,id:state.id,scope:state.scope});if(state.competition)q.set('competition',state.competition);if(state.venue)q.set('venue',state.venue);if(opponent)q.set('opponent',opponent);const r=await fetch('../h2h/index.php?'+q,{cache:'no-store'}),j=await r.json();if(!r.ok||!j.ok)throw Error('Impossibile caricare gli H2H. Riprova.');return j;}
  function renderList(){
   const open=new Map([...list.querySelectorAll('details[open]')].map(el=>[el.dataset.key,el.dataset.tab||'overview']));
   const needle=state.search.toLocaleLowerCase('it');const rows=state.rows.filter(x=>x.name.toLocaleLowerCase('it').includes(needle));
   list.innerHTML=rows.length?rows.map(o=>{const s=o.stats;return '<details class="hh-opponent" data-key="'+esc(o.key)+'"><summary><div class="hh-avatar">'+image(o)+'</div><div class="hh-opponent-info"><b>'+esc(o.name)+'</b><span>'+s.played+' incontri · '+s.won+' V · '+s.drawn+' N · '+s.lost+' P · Gol '+s.gf+'–'+s.ga+'</span><small>Ultima sfida: '+esc(date(s.last_match?.match_date))+'</small></div><span class="hh-expand" aria-hidden="true">⌄</span></summary><div class="hh-detail"></div></details>'}).join(''):'<div class="hh-empty">Nessun avversario trovato.</div>';
   list.querySelectorAll('details').forEach(el=>{
    el.dataset.tab=open.get(el.dataset.key)||'overview';let detailVersion=0;
    el.addEventListener('toggle',async()=>{
     const call=++detailVersion;if(!el.open)return;const v=state.version,body=el.querySelector('.hh-detail');body.innerHTML='<p class="hh-note">Caricamento confronto…</p>';
     try{const d=await request(el.dataset.key);if(state.stopped||v!==state.version||call!==detailVersion||!root.contains(el)||!el.open)return;
      body.innerHTML='<div class="hh-detail-tabs" role="tablist" aria-label="Dettaglio confronto">'+[['overview','Overview'],['matches','Partite'],['comparison','Confronto'],['players','Giocatori']].map(([key,label])=>'<button role="tab" data-detail-tab="'+key+'">'+label+'</button>').join('')+'</div><div class="hh-detail-view"></div>';
      const render=()=>{body.querySelectorAll('[data-detail-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.detailTab===el.dataset.tab)));body.querySelector('.hh-detail-view').innerHTML=detailContent(d,el.dataset.tab)};
      body.querySelectorAll('[data-detail-tab]').forEach(b=>b.onclick=()=>{el.dataset.tab=b.dataset.detailTab;render()});render();
     }catch(e){if(!state.stopped&&v===state.version&&call===detailVersion&&root.contains(el))body.innerHTML='<p class="hh-note">'+esc(e.message)+'</p>';}
    });if(open.has(el.dataset.key))el.open=true;
   });
  }
  async function load(background=false){
   const version=++state.version;state.loading=true;if(!background){summary.innerHTML='<p class="hh-note">Caricamento H2H…</p>';list.innerHTML='';}
   try{const j=await request();if(state.stopped||version!==state.version)return;state.rows=j.opponents;
    summary.innerHTML='<h3>'+j.summary.opponents+' avversari affrontati</h3>'+kpis(j.summary)+'<p class="hh-note">'+j.summary.reports+' Match Report su '+j.summary.played+' incontri.'+(j.summary.unidentified_matches?' '+j.summary.unidentified_matches+' incontri con manager avversario non identificato.':'')+' Ordine: numero di incontri, poi sfida più recente.</p>';
    competition.innerHTML='<option value="">Tutte le competizioni</option>'+Object.entries(j.competitions).sort((a,b)=>a[1].localeCompare(b[1],'it')).map(([key,name])=>'<option value="'+esc(key)+'"'+(state.competition===key?' selected':'')+'>'+esc(name)+'</option>').join('');renderList();
   }catch(e){if(!state.stopped&&version===state.version){summary.innerHTML='<p class="hh-note">'+esc(e.message)+'</p>';}}
   finally{if(version===state.version)state.loading=false;}
  }
  root.querySelector('.hh-search').oninput=e=>{state.search=e.target.value;renderList()};
  competition.onchange=e=>{state.competition=e.target.value;load()};root.querySelector('.hh-venue').onchange=e=>{state.venue=e.target.value;load()};
  root.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{state.scope=b.dataset.scope;state.competition='';root.querySelectorAll('[data-scope]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));load()});
  state.onVisible=()=>{if(!document.hidden&&!state.loading&&!state.stopped)load(true)};document.addEventListener('visibilitychange',state.onVisible);
  state.timer=setInterval(()=>{if(!document.hidden&&!state.loading&&!state.stopped&&document.activeElement!==root.querySelector('.hh-search'))load(true)},60000);load();
 }
 window.NexusH2H={mount,stop};
})();
