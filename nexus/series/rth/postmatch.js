(()=>{'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
 const portrait=(name,role,image)=>{const h=el('div',null,'pm-person'),avatar=el('span',name.split(' ').map(s=>s[0]).slice(0,2).join(''),'pm-avatar');
  if(image){const img=el('img');img.src=image;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();avatar.append(img)}
  const label=el('span');label.append(el('strong',name),el('small',role));h.append(avatar,label);return h;};
 const speech=(name,role,text,image)=>{const s=el('div',null,'pm-speech');s.append(portrait(name,role,image),el('p',text));return s};
 const score=m=>m.home_score+'–'+m.away_score;
 const pens=m=>m.penalty_home_score==null?'':m.penalty_home_score+'–'+m.penalty_away_score+' d.c.r.';
 const pairing=f=>f.home+' – '+f.away;
 function opening(data){const s=el('section',null,'pm-opening');s.id='postmatch-opening';
  s.append(el('p','20 OTTOBRE 2026 · LEAGUE CUP · GW001','eyebrow'),el('h2','La notte della coppa.'),el('p','Otto partite. Quattro serie di rigori. Il quadro dei quarti.','pm-lead'));
  s.append(speech(...data.opening[0]));
  const results=el('div',null,'pm-results');
  for(const m of data.matches){const a=el('a',null,'pm-result');a.href='#postmatch-'+m.id;a.append(el('span',m.teams.home.name+' – '+m.teams.away.name),el('strong',score(m)),el('small',pens(m)||'Finale'));results.append(a)}
  s.append(results);for(const line of data.opening.slice(1,4))s.append(speech(...line));
  s.append(el('h3','Quarti di finale · 27 ottobre, ore 20:00'));const fixtures=el('div',null,'pm-quarterfinals');
  for(const q of data.quarterfinals)fixtures.append(el('div',pairing(q),'pm-pairing'));s.append(fixtures);
  for(const line of data.opening.slice(4))s.append(speech(...line));return s;
 }
 function match(m){const s=el('section',null,'pm-match');s.id='postmatch-'+m.id;s.dataset.reporter=m.reporter;
  s.append(el('p','DOPOPARTITA · 20 OTTOBRE 2026','eyebrow'),el('h3',m.title));
  const scoreboard=el('div',null,'pm-scoreboard');for(const side of ['home','away']){const t=m.teams[side],team=el('div');const img=el('img');img.src=t.crest;img.alt='';img.loading='lazy';team.append(img,el('strong',t.name));if(side==='away'){const scores=el('div',null,'pm-score');scores.append(el('strong',score(m)),el('small',pens(m)||'Finale'));scoreboard.append(scores)}scoreboard.append(team)}s.append(scoreboard);
  s.append(el('p',m.scorers.map(p=>p.player_name+' '+p.minute+'′'+(p.own_goal?' (aut.)':'')).join(' · ')||'Nessun gol nei tempi regolamentari.','pm-scorers'));
  const stats=el('table',null,'pm-stats');const caption=el('caption','Riepilogo statistico · '+m.teams.home.name+' / '+m.teams.away.name);stats.append(caption);
  const body=el('tbody');for(const [key,label] of [['possession','Possesso %'],['total_shots','Tiri'],['shots_on_target','Nello specchio'],['corners','Corner'],['red_cards','Espulsioni']]){const row=el('tr');row.append(el('td',m.stats.home[key]),el('th',label),el('td',m.stats.away[key]));body.append(row)}stats.append(body);s.append(stats);
  if(m.mvp)s.append(el('p','MVP · '+m.mvp.player_name+' · voto match '+m.mvp.rating+'/10','pm-mvp'));
  s.append(speech('Federica Masolin','Studio · Apertura',m.intro));
  const interviews=el('div',null,'pm-interviews');for(const side of ['home','away']){const t=m.teams[side],section=el('section',null,'pm-team');section.dataset.team=t.id;section.append(el('h4',t.name),el('p',t.questions.length+' domande · manager e protagonisti','eyebrow'));
   t.questions.forEach((q,i)=>{const qa=el('div',null,'pm-qa');qa.append(speech(q.voice,(q.from_field?'Dal campo':'Dallo studio')+' · Domanda '+(i+1),q.question),speech(q.recipient,q.role,q.answer,q.image));section.append(qa)});interviews.append(section)}s.append(interviews);
  s.append(speech('Federica Masolin','Studio · Il prossimo appuntamento',m.closing));
  const sources=el('p',null,'pm-sources');for(const [label,url] of [['Match Report',m.sources.report],['Risultati e calendario',m.sources.results]]){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener';sources.append(a)}s.append(sources);return s;
 }
 async function start(){const content=document.getElementById('content');if(!content)return;
  try{const response=await fetch('2026-10-20-postmatch.json?v=1');if(!response.ok)throw Error('Postmatch unavailable');const data=await response.json();
   const decorate=()=>{const cards=[...content.querySelectorAll('.match-card[data-fixture]')];if(!cards.length)return;
    if(!content.querySelector('#postmatch-opening'))content.prepend(opening(data));
    for(const card of cards){const m=data.matches.find(m=>m.id===card.dataset.fixture);if(!m||card.querySelector('.pm-match'))continue;const before=card.querySelector(':scope > h3');card.insertBefore(match(m),before);}
   };new MutationObserver(decorate).observe(content,{childList:true,subtree:true});decorate();
  }catch(err){console.error('Dopopartita:',err);const note=el('p','Il dopopartita non è disponibile in questo momento. Ricarica la pagina per riprovare.','pm-load-error');content.before(note)}
 }
 start();
})();
