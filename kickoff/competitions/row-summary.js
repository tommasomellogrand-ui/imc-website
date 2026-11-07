(()=> {
 const {esc}=NexusUI;
 function symbol(league){
  const shape=league?'<path d="M4 21h16M5 17v-5h4v5m1 0V4h4v13m1 0V8h4v9"/>':'<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 5 4m9-6h4v2a4 4 0 0 1-5 4m-4 2v5m-4 3h8"/>';
  return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 }
 const flags=new Map();
 const regions=new Intl.DisplayNames(['en'],{type:'region'});
 for(let a=65;a<=90;a++)for(let b=65;b<=90;b++){
  const code=String.fromCharCode(a,b);const name=regions.of(code);
  if(name&&name!==code)flags.set(name.toLowerCase(),String.fromCodePoint(127397+a,127397+b));
 }
 for(const [name,code] of Object.entries({england:'gbeng',scotland:'gbsct',wales:'gbwls'}))flags.set(name,String.fromCodePoint(0x1f3f4,...Array.from(code,c=>0xe0000+c.charCodeAt(0)),0xe007f));
 flags.set('northern ireland','🇬🇧');
 function render(r,p={},award={},detail=false){
  function team(name){
   const src=p.logos?.[name]||(name===award.winner_name?award.winner_logo_url:'');
   const flag=r.competition_group==='NATIONS'&&flags.get(name.toLowerCase());
   if(flag)return '<span class="cr-team"><span aria-hidden="true">'+flag+'</span><span>'+esc(name)+'</span></span>';
   const initials=name.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join('');
   return '<span class="cr-team"><i>'+esc(initials)+(src?'<img alt="" src="'+esc(src)+'" onerror="this.remove()">':'')+'</i><span>'+esc(name)+'</span></span>';
  }
  const league=r.sm_action==='league',items=[];
  function field(label,values){if(values.length)items.push('<span class="cr-field"><small>'+esc(label)+'</small>'+values.map(v=>'<b>'+v+'</b>').join('')+'</span>')}
  if(p.finalists)field('Finalisti',p.finalists.map(team));
  if(award.winner_name){
   const logo=award.winner_logo_url;
   const img=logo&&/^https:\/\//.test(logo)?'<img width="24" height="24" src="'+esc(logo)+'" alt="">':'';
   field('Vincitore',[team(award.winner_name)+(award.winner_manager_name?'<em>'+esc(award.winner_manager_name)+'</em>':'')]);
  }else if(p.complete)field('Stato',['Competizione completa']);
  if(league)field(p.complete?'Classifica finale':'Prime in classifica',(p.ranking||[]).map((t,i)=>(i+1)+'ª '+team(t.name)+' · '+esc(t.points)+' pt'));
  else if(!p.complete&&!award.winner_name)field('Turno',[[p.label,p.detail,p.position].filter(Boolean).map(esc).join(' · ')].filter(Boolean));
  if(p.next_date&&!p.complete&&!award.winner_name){
   const games=p.upcoming||[], shown=detail?games:games.slice(0,2);
   const lines=shown.map(g=>g.map(team).join(' – '));
   if(games.length>shown.length)lines.push('<em>Altre '+(games.length-shown.length)+' partite</em>');
   field('Prossimo turno · '+p.next_date.split('-').reverse().join('/'),lines);
  }
  if(!league&&p.format?.length&&!award.winner_name&&!p.complete)field('Formula',[p.format.map(f=>esc(f.phase==='Gironi'?'Gironi ('+f.days+' giornate)':f.phase)).join(' · ')]);
  if(!items.length)field('Stato',[esc(p.label||'In programma')]);
  const kind=league?'Divisione '+r.sm_division:r.sm_action==='playoff'?'Playoff':'Coppa';
  if(!detail){
   let body='';
   if(!league&&p.final_played&&p.finalists){
    const names=[...p.finalists].sort((a,b)=>Number(b===award.winner_name)-Number(a===award.winner_name));
    body=names.map(name=>{const won=name===award.winner_name;return '<span class="gw-final '+(won?'won':'')+'"><span>'+team(name)+(won&&award.winner_manager_name?'<em>'+esc(award.winner_manager_name)+'</em>':'')+'</span><small>'+(won?'Vincitore':'Finalista')+'</small></span>'}).join('');
   }else{
    const label=p.label==='Finale'?'Finale da disputare':p.label||'In programma';
    body='<strong>'+esc(label)+'</strong>';
    if(p.position){body+='<small>'+esc(p.position)+'</small>';const n=p.position.match(/(\d+) di (\d+)/);if(n)body+='<span class="gw-stages">'+Array.from({length:Number(n[2])},(_,i)=>'<i class="'+(i<Number(n[1])?'on':'')+'"></i>').join('')+'</span>';}
   }
   return '<button class="gw-cup" data-key="'+esc(r.competition_key)+'"><span class="gw-name">'+symbol(league)+'<b>'+esc(r.nexus_view)+'</b></span><span class="gw-state">'+body+'</span></button>';
  }
  const content='<span class="cr-identity">'+symbol(league)+'<strong>'+esc(r.nexus_view)+'</strong><small>'+esc(kind)+'</small></span><span class="cr-data">'+items.join('')+'</span>';
  return detail?'<section class="cr-row" aria-label="Situazione competizione">'+content+'</section>':'<button class="competition-card cr-row" data-key="'+esc(r.competition_key)+'">'+content+'</button>';
 }
 window.IMCCompetitionRow={render,symbol};
})();