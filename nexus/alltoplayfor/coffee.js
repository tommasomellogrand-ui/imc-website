(()=>{'use strict';
 const panel=document.getElementById('panel-coffee-time');if(!panel)return;
 const root=document.createElement('div');root.className='coffee-edition';panel.append(root);
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 let data;const date=document.getElementById('date');
 function speech(index,text){const a=node('article',null,'coffee-speech');a.append(node('strong',data.cast[index][0]),node('small',data.cast[index][1]),node('p',text));return a}
 function render(){const active=date.value==='2026-10-22';root.hidden=!active;panel.querySelector('.programme-pending').hidden=active;if(!active||!data)return;root.replaceChildren();root.append(node('p','22 OTTOBRE 2026 · CAMPIONATO · GIORNATA 8','eyebrow'),node('h2',data.title));
 data.opening.forEach((s,i)=>root.append(speech(i,s)));
 root.append(node('p','Gli incontri originariamente indicati alle 20:00 sono fissati alle 22:00 per questa giornata.','coffee-time-note'));
 const links=node('nav',null,'coffee-divisions');links.setAttribute('aria-label','Divisioni');for(const [i,d] of data.divisions.entries()){const a=node('a',d.name);a.href='#coffee-div-'+(i+1);links.append(a)}root.append(links);
 for(const [i,d] of data.divisions.entries()){const section=node('section',null,'coffee-division');section.id='coffee-div-'+(i+1);section.append(node('h2',d.name));d.intro.forEach((s,j)=>section.append(speech(j,s)));
 for(const f of d.fixtures){const card=node('article',null,'coffee-fixture');card.dataset.fixture=f.id;card.append(node('p',(f.time||'Orario da confermare')+' · '+d.name,'eyebrow'));const teams=node('div',null,'coffee-teams');for(const side of ['home','away']){const team=node('div');const img=node('img');img.src=f[side+'_logo'];img.alt='';img.loading='lazy';team.append(img,node('strong',f[side]),node('small',f[side+'_manager']||'Allenatore non disponibile'));teams.append(team)}card.append(teams,node('h3',f.title));const standings=node('p',null,'coffee-standing');standings.textContent=f.home+': '+f.home_table.position+'° · '+f.home_table.points+' punti / '+f.away+': '+f.away_table.position+'° · '+f.away_table.points+' punti';card.append(standings,node('p',f.text));card.append(node('p',f.reporters.length?f.reporters.map(r=>r.name+' · '+r.club).join(' | '):'Redazione All To Play For','coffee-byline'));const a=node('a','Calendario Nexus');a.href=f.source;a.target='_blank';a.rel='noopener';card.append(a);section.append(card)}root.append(section)}root.append(speech(0,data.closing));
 }
 document.addEventListener('programme-date-change',render);
 fetch('2026-10-22-coffee.json?v=1').then(r=>{if(!r.ok)throw Error('Edizione non disponibile');return r.json()}).then(d=>{data=d;render()}).catch(()=>{root.textContent='Impossibile caricare Coffee Time. Ricarica la pagina.'});render();
})();
