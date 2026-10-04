(()=>{'use strict';
const selector='#season-select,#country-select,#group-select,#roster-season,#club-stats-season';
const countries={ARG:['Argentina',46],BEL:['Belgio',27],BRA:['Brasile',47],CZE:['Cechia',5],DEN:['Danimarca',17],ENG:['Inghilterra',1],ESP:['Spagna',8],FRA:['Francia',2],GER:['Germania',3],GRE:['Grecia',9],ITA:['Italia',4],JPN:['Giappone',76],NED:['Paesi Bassi',7],POR:['Portogallo',6],SCO:['Scozia',23],SUI:['Svizzera',16],SWE:['Svezia',10],TUR:['Turchia',14],USA:['Stati Uniti',57],MEX:['Messico',58],RUS:['Russia',15],AUT:['Austria',29],POL:['Polonia',13],UKR:['Ucraina',22],CRO:['Croazia',11],SRB:['Serbia',19],NOR:['Norvegia',20],ROU:['Romania',12],AUS:['Australia',74],CHN:['Cina',75],KOR:['Corea del Sud',77],URU:['Uruguay',53],COL:['Colombia',49],CHI:['Cile',48]};
const controls=new WeakMap();
function enhance(select){
 let state=controls.get(select);
 if(!state){
  const rail=document.createElement('div');rail.className='nexus-filter-chips';rail.setAttribute('role','group');
  const isCountry=select.id==='country-select',isGroup=select.id==='group-select';
  rail.setAttribute('aria-label',isCountry?'Paese':isGroup?'Gruppo':'Stagione');
  select.after(rail);select.hidden=true;select.parentElement.classList.add('nexus-chip-container');
  select.parentElement.querySelectorAll('label[for="'+select.id+'"]').forEach(label=>label.hidden=true);
  state={rail,signature:'',isCountry,isGroup};controls.set(select,state);
  rail.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;select.value=button.dataset.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();const fresh=document.getElementById(select.id);controls.get(fresh)?.rail.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});});
  rail.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const buttons=[...rail.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(event.key==='ArrowRight'?1:-1)));buttons[next]?.focus();});
 }
 const options=[...select.options],signature=JSON.stringify([select.value,select.disabled,options.map(o=>[o.value,o.text,o.disabled])]);
 if(signature===state.signature)return;state.signature=signature;
 const fragment=document.createDocumentFragment();
 for(const option of options){
  const button=document.createElement('button');button.type='button';button.dataset.value=option.value;button.disabled=select.disabled||option.disabled;button.setAttribute('aria-pressed',String(option.value===select.value));
  const country=state.isCountry?countries[option.value]:null;
  if(country){const flag=document.createElement('img');flag.src='/nexus/assets/flags/nations/'+country[1]+'.svg';flag.alt='';flag.width=23;flag.height=17;button.append(flag);}
  const label=country?country[0]:!state.isCountry&&!state.isGroup?(option.value?'S'+option.value:'Tutte'):option.text;
  button.append(document.createTextNode(label));button.title=country?country[0]:option.text;
  if(!state.isCountry&&!state.isGroup)button.setAttribute('aria-label',option.value?'Stagione '+option.value:'Tutte le stagioni');
  fragment.append(button);
 }
 state.rail.replaceChildren(fragment);
 const active=state.rail.querySelector('[aria-pressed="true"]');if(active)state.rail.scrollLeft=Math.max(0,active.offsetLeft-state.rail.offsetLeft-16);
}
function sync(){document.querySelectorAll(selector).forEach(enhance)}
sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected']});
})();
