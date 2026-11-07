(()=> {
 const {esc}=NexusUI;
 function symbol(league){
  const shape=league?'<path d="M4 21h16M5 17v-5h4v5m1 0V4h4v13m1 0V8h4v9"/>':'<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 5 4m9-6h4v2a4 4 0 0 1-5 4m-4 2v5m-4 3h8"/>';
  return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 }
 function render(r,p={},award={},detail=false){
  const league=r.sm_action==='league',items=[];
  function field(label,values){if(values.length)items.push('<span class="cr-field"><small>'+esc(label)+'</small>'+values.map(v=>'<b>'+v+'</b>').join('')+'</span>')}
  if(p.finalists)field('Finalisti',p.finalists.map(esc));
  if(award.winner_name){
   const logo=award.winner_logo_url;
   const img=logo&&/^https:\/\//.test(logo)?'<img width="24" height="24" src="'+esc(logo)+'" alt="">':'';
   field('Vincitore',[img+esc(award.winner_name)+(award.winner_manager_name?'<em>'+esc(award.winner_manager_name)+'</em>':'')]);
  }else if(p.complete)field('Stato',['Competizione completa']);
  if(league)field(p.complete?'Classifica finale':'Prime in classifica',(p.ranking||[]).map((t,i)=>esc((i+1)+'ª  '+t.name+' · '+t.points+' pt')));
  else if(!p.complete&&!award.winner_name)field('Turno',[[p.label,p.detail,p.position].filter(Boolean).map(esc).join(' · ')].filter(Boolean));
  if(p.next_date&&!p.complete&&!award.winner_name){
   const games=p.upcoming||[], shown=detail?games:games.slice(0,2);
   const lines=shown.map(g=>esc(g.join(' – ')));
   if(games.length>shown.length)lines.push('<em>Altre '+(games.length-shown.length)+' partite</em>');
   field('Prossimo turno · '+p.next_date.split('-').reverse().join('/'),lines);
  }
  if(!league&&p.format?.length&&!award.winner_name&&!p.complete)field('Formula',[p.format.map(f=>esc(f.phase==='Gironi'?'Gironi ('+f.days+' giornate)':f.phase)).join(' · ')]);
  if(!items.length)field('Stato',[esc(p.label||'In programma')]);
  const kind=league?'Divisione '+r.sm_division:r.sm_action==='playoff'?'Playoff':'Coppa';
  const content='<span class="cr-identity">'+symbol(league)+'<strong>'+esc(r.nexus_view)+'</strong><small>'+esc(kind)+'</small></span><span class="cr-data">'+items.join('')+'</span>';
  return detail?'<section class="cr-row" aria-label="Situazione competizione">'+content+'</section>':'<button class="competition-card cr-row" data-key="'+esc(r.competition_key)+'">'+content+'</button>';
 }
 window.IMCCompetitionRow={render,symbol};
})();