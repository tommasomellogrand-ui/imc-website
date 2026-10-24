'use strict';
(() => {
 const $=id=>document.getElementById(id);let csrf='',rows=[],busy=false;
 const worlds=Array.from({length:11},(_,i)=>'GW'+String(i+1).padStart(3,'0'));
 for(const gw of worlds)$('world').add(new Option(gw,gw));
 const requested=new URLSearchParams(location.search).get('world');if(worlds.includes(requested))$('world').value=requested;
 function authenticated(value){$('login').hidden=value;$('workspace').hidden=!value;$('logout').hidden=!value;}
 function lock(value){busy=value;$('world').disabled=value;$('reload').disabled=value;$('add').disabled=value;$('logout').disabled=value;document.querySelectorAll('#seasons input,#seasons button').forEach(e=>e.disabled=value);}
 async function api(action,body){const url='api.php?action='+encodeURIComponent(action)+'&world='+encodeURIComponent($('world').value);const response=await fetch(url,{credentials:'same-origin',cache:'no-store',method:body?'POST':'GET',headers:body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:body?JSON.stringify({action,world:$('world').value,...body}):undefined});const data=await response.json();if(!response.ok||!data.ok){if(response.status===401)authenticated(false);throw Error(data.error||'Operazione non riuscita.');}return data;}
 function card(row,isNew=false){
  const article=document.createElement('article');article.className='season-card';
  const form=document.createElement('form');article.append(form);
  const title=document.createElement('h2');title.textContent=isNew?'Nuova IMC Season':'IMC Season '+row.imc_season;form.append(title);
  if(!isNew){const badge=document.createElement('span');badge.className='badge'+(row.synced?'':' closed');badge.textContent=row.synced?'Core e copia locale allineati':'Copia locale da allineare al salvataggio';form.append(badge);}
  const fields=document.createElement('div');fields.className='dates';form.append(fields);
  function field(text,type,value,required){const label=document.createElement('label');label.textContent=text;const input=document.createElement('input');input.type=type;input.value=value||'';input.required=required;label.append(input);fields.append(label);return input;}
  const season=isNew?field('Numero stagione','number',row.imc_season,true):null;if(season){season.min='1';season.max='9999';season.step='1';}
  const start=field('Data inizio','date',row.imc_season_start_date,true),end=field('Data fine · facoltativa','date',row.imc_season_end_date,false);
  const error=document.createElement('p');error.className='season-error';error.setAttribute('role','alert');form.append(error);
  const actions=document.createElement('div');actions.className='actions';form.append(actions);const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Salva date';actions.append(save);
  if(isNew){const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Annulla';cancel.onclick=()=>{article.remove();$('add').disabled=false;};actions.append(cancel);}
  form.onsubmit=async event=>{event.preventDefault();if(busy)return;error.textContent='';if(end.value&&end.value<start.value){error.textContent='La fine non può precedere l’inizio.';return;}
   const payload={season:season?Number(season.value):Number(row.imc_season),start_date:start.value,end_date:end.value||null,version:row.version||''};lock(true);$('message').textContent='Salvataggio…';
   try{const data=await api('season-save',payload);rows=data.rows;render();$('message').textContent='IMC Season '+payload.season+' di '+data.world+': date salvate nel Core e nella copia locale.';}catch(e){error.textContent=e.message;$('message').textContent='Salvataggio non completato.';}finally{lock(false);}
  };
  return article;
 }
 function render(){$('seasons').replaceChildren(...rows.map(r=>card(r)));if(!rows.length){const p=document.createElement('p');p.textContent='Nessuna stagione configurata. Aggiungi la prima stagione.';$('seasons').append(p);}}
 async function load(){if(busy)return;lock(true);$('seasons').replaceChildren();$('message').textContent='Caricamento stagioni…';try{rows=(await api('seasons')).rows;render();$('message').textContent='';}catch(e){$('message').textContent=e.message;}finally{lock(false);}}
 $('world').onchange=load;$('reload').onclick=load;
 $('add').onclick=()=>{if(busy||document.querySelector('[data-new-season]'))return;const el=card({imc_season:Math.max(0,...rows.map(r=>Number(r.imc_season)))+1},true);el.dataset.newSeason='true';$('seasons').append(el);el.querySelector('input').focus();};
 $('login-form').onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;try{const d=await api('login',{username:$('login-username').value,password:$('login-password').value});csrf=d.csrf;$('login-password').value='';authenticated(true);await load();}catch(error){$('message').textContent=error.message;}finally{button.disabled=false;}};
 $('logout').onclick=async()=>{try{await api('logout',{});authenticated(false);csrf='';$('seasons').replaceChildren();}catch(e){$('message').textContent=e.message;}};
 api('session').then(d=>{csrf=d.csrf;authenticated(true);return load();}).catch(()=>authenticated(false));
})();
