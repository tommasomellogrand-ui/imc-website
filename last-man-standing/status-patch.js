const losingPicksG1=new Set(['Fiorentina','Napoli']);
const losingPicksG2=new Set(['Fiorentina','Udinese']);

function lmsStatus(p){
  if(losingPicksG1.has(p.g1)) return {out:true,round:'G1',team:p.g1};
  if(losingPicksG2.has(p.g2)) return {out:true,round:'G2',team:p.g2};
  return {out:false};
}

(function updateHome(){
  const stats=document.querySelectorAll('#home .grid .stat');
  const eliminated=people.filter(p=>lmsStatus(p).out).length;
  const alive=people.length-eliminated;
  if(stats.length>=3){
    stats[0].querySelector('b').textContent=people.length;
    stats[0].querySelector('span').textContent='partecipanti importati dal Master File';
    stats[1].querySelector('b').textContent=alive;
    stats[1].querySelector('span').textContent='ancora in gioco dopo G2';
    stats[2].querySelector('b').textContent=eliminated;
    stats[2].querySelector('span').textContent='eliminati dopo una sconfitta';
  }
})();

openPlayer=function(name){
  const p=people.find(x=>x.name===name),s=lmsStatus(p);
  hide();document.getElementById('player').classList.remove('hidden');
  document.getElementById('pname').textContent='Ciao, '+p.name+' 👋';
  const badge=document.querySelector('#player .tag');
  badge.textContent=s.out?'● ELIMINATO':'● IN GIOCO';
  badge.style.background=s.out?'#3a191c':'#173b24';
  badge.style.color=s.out?'#ff8a91':'var(--green)';
  let used=[p.g1,p.g2].filter(Boolean);
  const history=document.getElementById('history');
  history.className='notice'+(s.out?' danger':'');
  history.innerHTML='<b>Il tuo percorso</b><br>G1: '+(p.g1||'—')+' &nbsp; · &nbsp; G2: '+(p.g2||'—')+'<br><small>'+(s.out?('Eliminato in '+s.round+': '+s.team+' ha perso.'):'Già utilizzate: '+(used.join(', ')||'nessuna'))+'</small>';
  document.getElementById('confirm').innerHTML='';
  if(s.out){
    document.getElementById('teams').innerHTML='<div class="notice danger" style="grid-column:1/-1"><b>⛔ NON PUOI EFFETTUARE UNA NUOVA SCELTA</b><br><span class="muted">Questo partecipante è stato eliminato in '+s.round+' dopo la sconfitta di '+s.team+'.</span></div>';
    return;
  }
  document.getElementById('teams').innerHTML=teams.map(t=>'<button class="team '+(used.includes(t)?'used':'')+'" '+(used.includes(t)?'disabled':'')+' onclick="pick(\''+t.replaceAll("'","\\'")+'\')"><b>'+t+'</b><small>'+(used.includes(t)?'🔒 già utilizzata':'Seleziona →')+'</small></button>').join('');
};

showAdmin=function(){
  hide();document.getElementById('admin').classList.remove('hidden');
  const eliminated=people.filter(p=>lmsStatus(p).out).length;
  const alive=people.length-eliminated;
  const a=document.getElementById('with2'),o=document.getElementById('missing2');
  if(a){a.textContent=alive;a.nextElementSibling.textContent='ancora in gioco';}
  if(o){o.textContent=eliminated;o.nextElementSibling.textContent='eliminati';}
  renderTable();
};

renderTable=function(){
  let q=(document.getElementById('q')?.value||'').toLowerCase();
  document.getElementById('tbody').innerHTML=people.filter(p=>p.name.toLowerCase().includes(q)).map(p=>{
    const s=lmsStatus(p);
    return '<tr style="'+(s.out?'opacity:.68;background:#180d0e':'')+'"><td><button class="back" style="color:white;font-weight:800" onclick="openPlayer(\''+p.name.replaceAll("'","\\'")+'\')">'+p.name+'</button></td><td>'+ (p.g1||'—') +'</td><td>'+ (p.g2||'—') +'</td><td><span class="tag" style="'+(s.out?'background:#3a191c;color:#ff8a91':'')+'">'+(s.out?('ELIMINATO · '+s.round):'IN GIOCO')+'</span></td></tr>';
  }).join('');
};
