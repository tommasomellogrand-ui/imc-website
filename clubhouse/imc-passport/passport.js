(()=>{
'use strict';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v&&v!=='0000-00-00'?String(v).slice(0,10).split('-').reverse().join('.'):'Data non disponibile';
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.hidden=true},true);
if($('passport-search')){$('passport-search').oninput=e=>{let n=0;document.querySelectorAll('.passport-cover').forEach(c=>{c.hidden=!c.dataset.name.toLocaleLowerCase('it').includes(e.target.value.toLocaleLowerCase('it'));if(!c.hidden)n++;});$('no-managers').hidden=n>0;};return;}
if(!$('passport-data'))return;
const d=JSON.parse($('passport-data').textContent),pages=['identity','worlds','history','honours'];let page=0;
function show(i){page=Math.max(0,Math.min(3,i));pages.forEach((p,n)=>$(p).hidden=n!==page);document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.page===pages[page])));$('page-number').textContent='0'+(page+1)+' / 04';$('previous-page').disabled=page===0;$('next-page').disabled=page===3;}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>show(pages.indexOf(b.dataset.page)));
$('previous-page').onclick=()=>show(page-1);$('next-page').onclick=()=>show(page+1);show(0);
const valid=v=>v&&v!=='0000-00-00',active=a=>(!valid(a.start_date)||a.start_date<=d.today)&&(!valid(a.end_date)||a.end_date>=d.today);
const worldName=id=>d.worlds.find(w=>w.id===id);
const visits=d.worlds.map(w=>({w,items:d.assignments.filter(a=>a.game_world_id===w.id&&(!valid(a.start_date)||a.start_date<=d.today))})).filter(v=>v.items.length);
$('world-stamps').innerHTML=visits.map(({w,items})=>{
const live=items.some(active),starts=items.map(a=>a.start_date).filter(valid).sort(),ends=items.map(a=>a.end_date).filter(valid).sort();
return '<article class="stamp '+(live?'green':'red')+'"><small>'+esc(w.code)+'</small><h3>'+esc(w.name)+'</h3><strong class="stamp-word">'+(live?'ADMITTED':'ABANDONED')+'</strong><span>Ingresso · '+date(starts[0])+'</span>'+(!live?'<span>Uscita · '+date(ends.at(-1))+'</span>':'')+'<p>'+items.filter(a=>live?active(a):true).map(a=>esc(a.team_name)).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')+'</p></article>';
}).join('')||'<p>Nessun ingresso registrato nei otto mondi IMC.</p>';
$('assignment-history').innerHTML=visits.map(({w})=>'<section class="history-world"><h3>'+esc(w.code+' · '+w.name)+'</h3>'+d.assignments.filter(a=>a.game_world_id===w.id).map(a=>'<article class="tenure"><div><strong>'+esc(a.team_name||'Squadra non disponibile')+'</strong><small>'+(a.assignment_type==='national_team'?'Nazionale':'Club')+'</small></div><div><span>'+date(a.start_date)+' — '+(valid(a.end_date)?date(a.end_date):'oggi')+'</span><b class="'+(active(a)?'green-text':'red-text')+'">'+(active(a)?'ACTIVE':valid(a.start_date)&&a.start_date>d.today?'SCHEDULED':'ENDED')+'</b></div></article>').join('')+'</section>').join('')||'<p>Nessun incarico registrato.</p>';
const stats={played:0,won:0,drawn:0,lost:0},trophies=[],failures=[];let next=0;
async function worker(){while(next<d.worlds.length){const w=d.worlds[next++];try{
const r=await fetch('/clubhouse/data.php?'+new URLSearchParams({world:w.id,manager:d.person.manager_id,scope:'global',source:'results',view:'trophies'}),{cache:'no-store'}),b=await r.json();if(!r.ok||!b.ok)throw Error();
const s=b.managers?.[d.person.manager_id]?.stats||{};Object.keys(stats).forEach(k=>stats[k]+=Number(s[k]||0));
trophies.push(...(b.trophies||[]));if(b.trophy_error)failures.push(w.name+' (titoli)');
}catch(e){failures.push(w.name);}}}
Promise.all([worker(),worker()]).then(()=>{
$('passport-stats').innerHTML=[['Mondi',visits.length],['Partite',stats.played],['Vittorie',stats.won],['Titoli',trophies.length]].map(([l,n])=>'<div><strong>'+n+'</strong><span>'+l+'</span></div>').join('');
$('honours-state').textContent=trophies.length+' titoli registrati'+(failures.length?' · Dati parziali':' · Tutte le stagioni');
trophies.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
$('honour-stamps').innerHTML=trophies.map(t=>'<article class="stamp gold"><span class="laurel" aria-hidden="true">✦</span><small>'+esc(worldName(t.world)?.code||t.world)+' · '+esc(worldName(t.world)?.name||'')+'</small><h3>'+esc(t.competition)+'</h3><strong class="stamp-word">CHAMPION</strong><p>'+esc(t.team)+'</p><span>STAGIONE '+esc(t.season)+' · '+date(t.date)+'</span></article>').join('')||'<p>Nessun titolo registrato per i dati disponibili.</p>';
$('passport-warning').textContent=failures.length?'Dati temporaneamente incompleti: '+failures.join(', ')+'. Ricarica la pagina per riprovare.':'Dati aggiornati dal Core e dalla Club House · Sette mondi IMC.';
});
})();