'use strict';
const el=id=>document.getElementById(id);
let csrf='',invite='';
function signedOut(){
 csrf='';invite='';el('pilot').hidden=true;el('logout').hidden=true;el('copy').hidden=true;el('result').replaceChildren();el('login').hidden=false;el('status').textContent='Accedi come amministratore per gestire gli inviti.';
}
async function request(action){
 const options=action?{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({action})}:{};
 const res=await fetch(action?'api.php':'api.php?action=session',{cache:'no-store',...options});
 if(res.status===401){signedOut();throw Error('Sessione scaduta.');}
 const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Operazione non riuscita.');
 return data;
}
async function start(){
 try{csrf=(await request()).csrf;el('login').hidden=true;el('logout').hidden=false;el('pilot').hidden=false;el('status').textContent='Prova di accesso ONE';}
 catch(e){if(el('login').hidden)el('status').textContent=e.message;}
}
el('issue').onclick=async function(){
 this.disabled=true;el('copy').hidden=true;el('result').replaceChildren();
 try{invite=(await request('one-invite')).invite;const a=document.createElement('a');a.href=invite;a.textContent='Apri il link personale';el('result').append(a);el('copy').hidden=false;}
 catch(e){el('result').textContent=e.message;}finally{this.disabled=false;}
};
el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(invite);el('status').textContent='Link copiato.';}catch{el('status').textContent='Tieni premuto il link personale per copiarlo.';}};
el('logout').onclick=async()=>{try{await request('logout');signedOut();}catch(e){el('status').textContent=e.message;}};
start();
