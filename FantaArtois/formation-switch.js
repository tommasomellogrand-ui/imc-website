const U='https://ugjeexyiowmqgkytukiz.supabase.co/rest/v1/',K='sb_publishable_MBMbggUOaQCVvcWcMBSFNA_cy_TPgkH';
let ps=[],sel={},target=null;
async function boot(){
 const team=+document.body.dataset.team;
 const a=await (await fetch(U+'fanta_rosters?select=role,player_id&team_id=eq.'+team,{headers:{apikey:K}})).json();
 const ids=a.map(x=>x.player_id).join(',');
 const b=await (await fetch(U+'fantacalcio_listone?select=id,nome,squadra&id=in.('+ids+')',{headers:{apikey:K}})).json();
 ps=a.map(x=>({...x,...b.find(y=>y.id===x.player_id)}));
 ['P','D','C','A'].forEach(z=>sel[z]=ps.filter(x=>x.role===z).map(x=>x.id));
 drawRoster();drawField();
}
function drawRoster(){document.querySelector('#roster').innerHTML=['P','D','C','A'].map(z=>'<h3>'+z+'</h3>'+ps.filter(x=>x.role===z).map(x=>'<div class="player"><b>'+x.nome+'</b><span>'+x.squadra+'</span></div>').join('')).join('')}
function drawField(){
 const [d,c,a]=document.querySelector('#module').value.split('-').map(Number), n={P:1,D:d,C:c,A:a};
 const row=(z,k)=>'<div class="line">'+sel[z].slice(0,k).map((id,i)=>{const x=ps.find(p=>p.id===id);return '<button class="slot" data-r="'+z+'" data-i="'+i+'"><b>'+z+'</b>'+x.nome+'</button>'}).join('')+'</div>';
 document.querySelector('#field').innerHTML=row('A',a)+row('C',c)+row('D',d)+row('P',1);
 const used=new Set([...sel.P.slice(0,1),...sel.D.slice(0,d),...sel.C.slice(0,c),...sel.A.slice(0,a)]);
 document.querySelector('#bench').innerHTML=ps.filter(x=>!used.has(x.id)).map(x=>'<span class="benchp">'+x.role+' · '+x.nome+'</span>').join('');
 document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>openPicker(b.dataset.r,+b.dataset.i));
}
function openPicker(r,i){target={r,i};document.querySelector('#pickerTitle').textContent='Scegli '+r+' da inserire';document.querySelector('#choices').innerHTML=sel[r].map((id,j)=>{const x=ps.find(p=>p.id===id);return '<button class="choice" data-j="'+j+'">'+x.nome+' · '+x.squadra+(j===i?' ✓':'')+'</button>'}).join('');document.querySelector('#picker').classList.add('open');document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>swap(+b.dataset.j))}
function swap(j){const {r,i}=target;if(j!==i)[sel[r][i],sel[r][j]]=[sel[r][j],sel[r][i]];document.querySelector('#picker').classList.remove('open');drawField()}
document.querySelector('#module').onchange=drawField;document.querySelector('#tabRoster').onclick=()=>show('roster');document.querySelector('#tabFormation').onclick=()=>show('formation');document.querySelector('#closePicker').onclick=()=>document.querySelector('#picker').classList.remove('open');
function show(x){document.querySelector('#roster').hidden=x!=='roster';document.querySelector('#formation').hidden=x!=='formation'}
boot();