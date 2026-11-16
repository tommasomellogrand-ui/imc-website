(()=> {
 "use strict";
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
  if(!detail){
   const league=p.league_summary||r.sm_action==='league';
   const bits=[];
   if(p.status)bits.push('<span class="cs-status" data-status="'+esc(p.status)+'">'+esc(p.status)+'</span>');
   if(Number.isFinite(p.played_days)&&Number.isFinite(p.total_days)&&p.total_days>0){
    const percent=Math.min(100,Math.round(100*p.played_days/p.total_days));
    bits.push('<span class="cs-progress"><span><strong>'+esc(p.played_days)+' di '+esc(p.total_days)+'</strong> turni giocati <b>'+percent+'%</b></span><progress max="'+esc(p.total_days)+'" value="'+esc(p.played_days)+'" aria-label="Turni giocati"></progress><small>'+esc(p.remaining_days??Math.max(0,p.total_days-p.played_days))+' turni da giocare</small></span>');
   }
   function turn(t,title){
    if(!t?.date)return;
    const value=[t.label,t.date.split('-').reverse().join('/')].filter(Boolean).join(' · ');
    bits.push('<span class="cs-turn"><small>'+title+'</small><strong>'+esc(value)+'</strong></span>');
   }
   turn(p.last_turn,league?'Ultima giornata giocata':'Ultima fase giocata');
   if(!p.complete){
    if(p.next_turn?.date)turn(p.next_turn,league?'Prossima giornata':'Prossimo turno');
    else bits.push('<span class="cs-turn"><small>'+(league?'Prossima giornata':'Prossimo turno')+'</small><strong>Data da definire</strong></span>');
   }
   if(award.winner_name){
    const photo=String(award.winner_manager_photo_url||'');
    const portrait=/^(https?:\/\/|\/(?!\/))/.test(photo)?'<img src="'+esc(photo)+'" alt="" width="30" height="30">':'';
    bits.push('<span class="cs-winner"><small>Vincitore</small><strong>'+team(award.winner_name)+'</strong>'+(award.winner_manager_name?'<span class="cs-manager">'+portrait+esc(award.winner_manager_name)+'</span>':'')+'</span>');
   }else if(league&&p.ranking?.[0]){
    const first=p.ranking[0];
    bits.push('<span class="cs-leader"><small>Prima in classifica</small><strong>'+team(first.name)+' <span>'+esc(first.points)+' pt</span></strong></span>');
   }
   return '<button class="gw-cup gw-summary" data-key="'+esc(r.competition_key)+'"><span class="gw-name">'+symbol(league)+'<b>'+esc(r.nexus_view)+'</b></span><span class="cs-data">'+bits.join('')+'</span></button>';
  }
  const league=p.league_summary||r.sm_action==='league',items=[];
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
   field((league?'Prossima giornata · ':'Prossimo turno · ')+p.next_date.split('-').reverse().join('/'),lines);
  }
  if(!league&&p.format?.length&&!award.winner_name&&!p.complete)field('Formula',[p.format.map(f=>esc(f.phase==='Gironi'?'Gironi ('+f.days+' giornate)':f.phase)).join(' · ')]);
  if(!items.length)field('Stato',[esc(p.label||'In programma')]);
  const kind=league?'Divisione '+r.sm_division:r.sm_action==='playoff'?'Playoff':'Coppa';
  if(!detail){
   let body='';
   if(!league&&award.winner_name){
    const photo=String(award.winner_manager_photo_url||'');
    const portrait=/^(https?:\/\/|\/(?!\/))/.test(photo)?'<img src="'+esc(photo)+'" alt="" width="34" height="34" style="object-fit:cover;border-radius:50%;flex:none">':'';
    body='<span class="gw-final won" style="display:grid;gap:.3rem"><small>Vincitore</small>'+team(award.winner_name)+(award.winner_manager_name?'<span style="display:flex;align-items:center;gap:.4rem">'+portrait+esc(award.winner_manager_name)+'</span>':'')+'</span>';
   }else{
    const label=p.label==='Finale'?'Finale da disputare':p.label||'In programma';
    body='<strong>'+esc(label)+'</strong>';
    if(p.next_date)body+='<small>'+esc(p.next_date.split('-').reverse().join('/'))+'</small>';
    if(p.position){body+='<small>'+esc(p.position)+'</small>';const n=p.position.match(/(\d+) di (\d+)/);if(n)body+='<span class="gw-stages">'+Array.from({length:Number(n[2])},(_,i)=>'<i class="'+(i<Number(n[1])?'on':'')+'"></i>').join('')+'</span>';}
   }
   return '<button class="gw-cup" data-key="'+esc(r.competition_key)+'"><span class="gw-name">'+symbol(league)+'<b>'+esc(r.nexus_view)+'</b></span><span class="gw-state">'+body+'</span></button>';
  }
  const content='<span class="cr-identity">'+symbol(league)+'<strong>'+esc(r.nexus_view)+'</strong><small>'+esc(kind)+'</small></span><span class="cr-data">'+items.join('')+'</span>';
  return detail?'<section class="cr-row" aria-label="Situazione competizione">'+content+'</section>':'<button class="competition-card cr-row" data-key="'+esc(r.competition_key)+'">'+content+'</button>';
 }
 const style=document.createElement('style');style.id='imc-competition-summary-style';style.textContent=`
 #view .gw-summary{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-height:0;height:auto;padding:16px 12px;text-align:left;background:#fff;border:1px solid #e0e3e8;border-radius:10px;margin:8px 0;color:inherit}
 #view .gw-summary .gw-name{display:flex;align-items:center;gap:9px;min-width:0}
 #view .gw-summary .gw-name b{font-size:16px;line-height:1.3;overflow-wrap:anywhere}
 #view .gw-summary .gw-name svg{flex:none;color:var(--world-accent,#a68b50)}
 .gw-summary .cs-data{display:grid;gap:10px;min-width:0}.gw-summary .cs-data:empty{display:none}
 .cs-status{font-size:11px;font-weight:700;color:#536277}.cs-status[data-status="Conclusa"]{color:var(--world-accent,#8b6829)}
 .cs-progress{display:grid;gap:5px}.cs-progress>span{font-size:12px;color:#536277}.cs-progress b{float:right;color:inherit}.cs-progress progress{display:block;width:100%;height:7px;border:0;border-radius:6px;overflow:hidden;accent-color:var(--world-accent,#a68b50);background:#e6e8ed}.cs-progress progress::-webkit-progress-bar{background:#e6e8ed;border-radius:6px}.cs-progress progress::-webkit-progress-value{background:var(--world-accent,#a68b50);border-radius:6px}.cs-progress progress::-moz-progress-bar{background:var(--world-accent,#a68b50);border-radius:6px}
 .cs-turn,.cs-winner,.cs-leader{display:grid;gap:4px;min-width:0}.cs-turn small,.cs-winner small,.cs-leader small{font-size:11px;color:#536277}.cs-turn strong{font-size:13px;line-height:1.4;font-weight:600}.cs-winner>strong,.cs-leader>strong{font-size:14px;line-height:1.35}.cs-winner{border-top:1px solid #e6e8ed;padding-top:9px}.cs-manager{display:flex;gap:7px;align-items:center;font-size:12px}.cs-manager img{object-fit:cover;border-radius:50%}.cs-leader>strong{display:flex;align-items:center;justify-content:space-between;gap:8px}.gw-summary .cr-team{white-space:normal}.gw-summary .cr-team>span{overflow:visible;text-overflow:clip;overflow-wrap:anywhere}.gw-summary .cr-team i{width:24px;height:26px}
 #view .league-card .gw-state:empty{border:0;padding:0}
 `;document.getElementById(style.id)?.remove();document.head.append(style);
 window.IMCCompetitionRow={render,symbol};
})();
