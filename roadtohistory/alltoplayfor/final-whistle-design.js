(()=>{
 'use strict';
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const short=name=>({'HERTHA BSC':'Hertha','Parma Calcio 1913':'Parma','Palermo FC':'Palermo','1. FC Kaiserslautern':'Kaiserslautern','AS Roma':'Roma','Tottenham Hotspur':'Tottenham','Legia Warszawa':'Legia'}[name]||name);
 const colors={'94079171':'#1262b6','94078885':'#b48c24','94078884':'#c65f8e','94079188':'#19724b','94079172':'#bd2438','94078890':'#942d34','94078847':'#23355a','94079408':'#287449'};
 function jump(target,nav){if(!target)return;const top=target.getBoundingClientRect().top+scrollY-nav.getBoundingClientRect().height-16;window.scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 window.finalWhistleDesign=(root,state)=>{
  const nav=root.querySelector('.fw-tabs');if(!nav)return;
  nav.setAttribute('aria-label','Scegli la partita');
  const intro=root.querySelector(':scope > .fw-speech');if(intro)intro.classList.add('fw-broadcast','fw-opening');
  state.coffee.divisions.forEach((d,i)=>{
   const button=nav.children[i];button.replaceChildren();
   if(d.fixtures.length===1){
    const f=d.fixtures[0],m=state.matches.find(m=>String(m.fixture.id)===String(f.id)),icons=make('span','fw-tab-score');
    for(const side of ['home','away']){const img=make('img');img.src=f[side+'_logo'];img.alt='';icons.append(img);if(side==='home')icons.append(make('b','',m?.row?`${m.row.home_score}–${m.row.away_score}`:'VS'));}
    button.append(icons,make('span','fw-tab-label',short(f.home)+' – '+short(f.away)));
    button.setAttribute('aria-label',`${f.home} contro ${f.away}${m?.row?', '+m.row.home_score+' a '+m.row.away_score:''}`);
   }else button.append(make('b','',d.name),make('span','fw-tab-label',d.fixtures.length+' partite'));
   button.addEventListener('click',()=>{const section=root.querySelector('#fw-division-'+i);jump(section,nav);const left=button.offsetLeft-(nav.clientWidth-button.offsetWidth)/2;nav.scrollTo({left,behavior:'smooth'});});
  });
  for(const m of state.matches){
   const f=m.fixture,card=root.querySelector('#fw-match-'+f.id);if(!card)continue;
   const title=card.querySelector('.fw-story-title'),score=card.querySelector('.fw-scoreboard'),status=card.querySelector('.fw-status'),penalties=card.querySelector('.fw-penalties');
   const hero=make('header','fw-match-hero');hero.append(make('p','fw-kicker','IL VERDETTO DEL CAMPO'));if(title)hero.append(title);hero.append(score);if(penalties)hero.append(penalties);if(status)hero.append(status);card.prepend(hero);
   const nodes=[...card.querySelectorAll(':scope > .fw-speech')];let interview=null,sideIndex=0;const destinations={};let analysis=null;
   for(const node of nodes){
    if(node.classList.contains('fw-reporter')){
     const side=sideIndex++===0?'home':'away';interview=make('section','fw-interview');interview.id='fw-'+f.id+'-'+side;interview.style.setProperty('--club',colors[String(f[side+'_table'].id)]||'#243b5a');
     const head=make('header','fw-interview-head'),logo=make('img');logo.src=f[side+'_logo'];logo.alt='';head.append(logo,make('div','',null));head.lastChild.append(make('p','fw-kicker','DAL CAMPO · '+short(f[side])),make('h3','',f[side+'_manager']));
     card.insertBefore(interview,node);interview.append(head,node);destinations[side]=interview;
    }else if(node.classList.contains('fw-question')||node.classList.contains('fw-answer')){
     if(interview)interview.append(node);
    }else if(node.classList.contains('fw-context')||node.classList.contains('fw-defence')||node.classList.contains('fw-attack')){
     if(!analysis){analysis=make('section','fw-analysis');analysis.id='fw-'+f.id+'-analysis';card.insertBefore(analysis,node);analysis.append(make('p','fw-kicker','IL CONFRONTO IN STUDIO'));destinations.analysis=analysis;}
     analysis.append(node);
    }else{node.classList.add('fw-broadcast');if(!destinations.studio){destinations.studio=node;node.id='fw-'+f.id+'-studio';}interview=null;}
   }
   for(const side of ['home','away']){
    const group=destinations[side];if(!group)continue;
    const answers=[...group.querySelectorAll('.fw-answer > p')];let quote=answers[0]?.textContent?.match(/^.+?[.!?](?:\s|$)/)?.[0]?.trim();
    if(String(f.id)==='369328897'&&side==='home'&&answers.some(p=>p.textContent.startsWith('Sì, vogliamo alzarla.')))quote='Sì, vogliamo alzarla.';
    if(quote){const q=make('blockquote','fw-pullquote',quote);q.append(make('cite','',f[side+'_manager']));group.insertBefore(q,group.querySelector('.fw-question'));}
   }
   const segments=make('nav','fw-segments');segments.setAttribute('aria-label','Dentro la partita');
   for(const [key,label]of [['studio','Studio'],['home',short(f.home)],['away',short(f.away)],['analysis','Analisi']])if(destinations[key]){const b=make('button','',label);b.type='button';b.addEventListener('click',()=>jump(destinations[key],nav));segments.append(b);}
   if(segments.children.length)hero.after(segments);
  }
 };
})();
