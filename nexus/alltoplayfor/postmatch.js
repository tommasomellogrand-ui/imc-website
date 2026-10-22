(()=>{'use strict';
 let portraits={},clubs=[];
 const nice=name=>name.toLocaleLowerCase('it').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('it'));
 const clubLabel=(name,crest)=>{const n=el('span',null,'pm-club');const img=el('img');img.src=crest||clubs.find(c=>c.name===name)?.crest||'';img.alt='';img.loading='lazy';n.append(img,el('span',name));return n};
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
 const portrait=(name,role,image)=>{const h=el('div',null,'pm-person'),avatar=el('span',name.split(' ').map(s=>s[0]).slice(0,2).join(''),'pm-avatar');
  const ref=portraits[name];image=image||ref?.url;
  if(image){const img=el('img');img.src=image;img.alt=name;img.loading='lazy';if(ref?.position)img.style.objectPosition=ref.position;if(ref?.scale)img.style.transform='scale('+ref.scale+')';img.onerror=()=>img.remove();avatar.append(img)}
  const label=el('span');label.append(el('strong',name),el('small',role));h.append(avatar,label);return h;};
 const speech=(name,role,text,image)=>{const s=el('div',null,'pm-speech');s.append(portrait(name,role,image),el('p',text));return s};
 const score=m=>m.home_score+'–'+m.away_score;
 const pens=m=>m.penalty_home_score==null?'':m.penalty_home_score+'–'+m.penalty_away_score+' d.c.r.';
 const pairing=f=>f.home+' – '+f.away;
 function opening(data){const s=el('section',null,'pm-opening');s.id='postmatch-opening';
  s.append(el('p','20 OTTOBRE 2026 · LEAGUE CUP · GW001','eyebrow'),el('h2','La notte della coppa.'),el('p','Otto partite. Quattro serie di rigori. Il quadro dei quarti.','pm-lead'));
  s.append(speech(...data.opening[0]));
  const results=el('div',null,'pm-results');
  for(const m of data.matches){const a=el('a',null,'pm-result');a.href='#postmatch-'+m.id;a.append(clubLabel(m.teams.home.name),el('strong',score(m)),clubLabel(m.teams.away.name));if(pens(m))a.append(el('small',pens(m)));results.append(a)}
  s.append(results);for(const line of data.opening.slice(1,4))s.append(speech(...line));
  s.append(el('h3','Quarti di finale · 27 ottobre, ore 20:00'));const fixtures=el('div',null,'pm-quarterfinals');
  for(const q of data.quarterfinals){const pair=el('div',null,'pm-pairing');pair.append(clubLabel(q.home),el('span','–'),clubLabel(q.away));fixtures.append(pair)}s.append(fixtures);
  for(const line of data.opening.slice(4))s.append(speech(...line));return s;
 }
 function match(m){const s=el('section',null,'pm-match');s.id='postmatch-'+m.id;s.dataset.reporter=m.reporter;
  s.append(el('p','DOPOPARTITA · 20 OTTOBRE 2026','eyebrow'),el('h3',m.title));
  const scoreboard=el('div',null,'pm-scoreboard');for(const side of ['home','away']){const t=m.teams[side],team=el('div');const img=el('img');img.src=t.crest;img.alt='';img.loading='lazy';team.append(img,el('strong',t.name));if(side==='away'){const scores=el('div',null,'pm-score');scores.append(el('strong',score(m)),el('small',pens(m)||'Finale'));scoreboard.append(scores)}scoreboard.append(team)}s.append(scoreboard);
  const scorers=el('div',null,'pm-goals');for(const side of ['home','away']){const list=el('div',null,'pm-goal-side');const grouped=new Map();for(const p of m.scorers.filter(p=>p.team_side===side)){const name=p.own_goal?(p.player_name.startsWith('Autorete')?'Autorete':nice(p.player_name)+' (aut.)'):nice(p.player_name);grouped.set(name,[...(grouped.get(name)||[]),p.minute+'′'])}for(const [name,minutes] of grouped){const row=el('div',null,'pm-goal');row.append(el('strong',name),el('span',minutes.join(', ')));list.append(row)}scorers.append(list)}if(!m.scorers.length)scorers.append(el('p','Nessun gol nei tempi regolamentari'));scoreboard.append(scorers);
  const stats=el('table',null,'pm-stats');const caption=el('caption','Riepilogo statistico · '+m.teams.home.name+' / '+m.teams.away.name);stats.append(caption);
  const body=el('tbody');for(const [key,label] of [['possession','Possesso %'],['total_shots','Tiri'],['shots_on_target','Nello specchio'],['corners','Corner'],['red_cards','Espulsioni']]){const row=el('tr');row.append(el('td',m.stats.home[key]),el('th',label),el('td',m.stats.away[key]));body.append(row)}stats.append(body);s.append(stats);
  if(m.mvp){const p=m.mvp,award=el('aside',null,'pm-mvp');const photo=el('img');photo.src='https://cdn.soccerwiki.org/images/player/'+p.sm_player_id+'.png';photo.alt=nice(p.player_name);photo.loading='lazy';const info=el('div');info.append(el('small','PLAYER OF THE MATCH'),el('strong',nice(p.player_name)),clubLabel(m.teams[p.team_side].name));const rating=el('div',null,'pm-mvp-rating');rating.append(el('strong',p.rating),el('small','VOTO / 10'));award.append(photo,info,rating);s.append(award)}
  s.append(speech('Federica Masolin','Studio · Apertura',m.intro));
  const interviews=el('div',null,'pm-interviews');for(const side of ['home','away']){const t=m.teams[side],section=el('section',null,'pm-team');section.dataset.team=t.id;const title=el('h4');title.append(clubLabel(t.name,t.crest));section.append(title,el('p',t.questions.length+' domande · manager e protagonisti','eyebrow'));
   t.questions.forEach((q,i)=>{const qa=el('div',null,'pm-qa');qa.append(speech(q.voice,(q.from_field?'Dal campo':'Dallo studio')+' · Domanda '+(i+1),q.question),speech(q.recipient,q.role,q.answer,q.image));section.append(qa)});interviews.append(section)}s.append(interviews);
  s.append(speech('Federica Masolin','Studio · Il prossimo appuntamento',m.closing));
  const sources=el('p',null,'pm-sources');for(const [label,url] of [['Match Report',m.sources.report],['Risultati e calendario',m.sources.results]]){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener';sources.append(a)}s.append(sources);return s;
 }
 async function start(){const content=document.getElementById('content');if(!content)return;
  try{const responses=await Promise.all([fetch('2026-10-20-postmatch.json?v=1'),fetch('portraits.json?v=1')]);if(responses.some(r=>!r.ok))throw Error('Postmatch unavailable');const [data,photos]=await Promise.all(responses.map(r=>r.json()));portraits=photos;clubs=data.matches.flatMap(m=>Object.values(m.teams));
   const selected=new URLSearchParams(location.search).get('club');
   const matches=selected?data.matches.filter(m=>Object.values(m.teams).some(t=>t.id===selected)):data.matches;
   content.replaceChildren();if(!selected)content.append(opening(data));
   else{const back=el('a','← Tutti i dopopartita','back');back.href='?world=GW001';content.append(back)}
   const list=el('div',null,'match-list');for(const m of matches){const card=el('article',null,'card match-card');card.dataset.fixture=m.id;card.append(match(m));list.append(card)}content.append(list);
   if(!matches.length)content.append(el('p','Questo club non ha giocato nel turno di coppa del 20 ottobre.'));
   document.getElementById('status').textContent='20 ottobre 2026 · '+matches.length+' dopopartita';
   for(const id of ['tabs','directory','reader'])document.getElementById(id).hidden=true;
   for(const id of ['prev','next','today','date'])document.getElementById(id).disabled=true;
   document.dispatchEvent(new Event('postmatch-ready'));
  }catch(err){console.error('Dopopartita:',err);const note=el('p','Il dopopartita non è disponibile in questo momento. Ricarica la pagina per riprovare.','pm-load-error');content.before(note)}
 }
 start();
})();
