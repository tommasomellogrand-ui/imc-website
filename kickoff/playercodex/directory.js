(()=>{'use strict';
const $=id=>document.getElementById(id),isPlayers=true,gw='GW009';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),url=(path,extra={})=>path+'?'+new URLSearchParams({world:gw,...extra});
$('role-filter').hidden=!isPlayers;$('sort-filter').hidden=!isPlayers;
const tab=new URLSearchParams(location.search).get('tab');
const daily=tab==='changes'||tab==='new';
const day=$('daily-day');
$('day-label').hidden=!daily;
document.querySelectorAll('.codex-tabs a')[daily?(tab==='new'?2:1):0].setAttribute('aria-current','page');
if(daily)$('list-title').textContent=tab==='new'?'Nuovi giocatori in DB':'Update';
day.onchange=()=>{shown=60;refresh()};
const roles=['Portieri','Difensori','Centrocampisti','Attaccanti','Ruolo non indicato'];
function role(r){const s=String(r.position||'').toUpperCase().trim();if(/^(PT|GK|POR)(\b|\()/.test(s))return roles[0];if(/^(D|DC|DS|DD|DF|DEF)(\b|\()/.test(s))return roles[1];if(/^(C|CC|CD|CS|CO|M|MC|DM|AM|TRQ)(\b|\()/.test(s))return roles[2];if(/^(A|AC|AS|AD|F|FC|ST|ATT)(\b|\()/.test(s))return roles[3];return roles[4]}
const nationality = window.codexNationality;
function card(r){
 const name=r.full_name||'Giocatore', images=[r.image_url];
 if(Number(r.player_id)>0) images.push('https://cdn.soccerwiki.org/images/player/'+Number(r.player_id)+'.png');
 const club=String(r.current_club||'').trim();
 const hasClub=club&&!/^(?:club non assegnato|svincolato|free agent|nessuno(?:\/a)?|—|-)$/i.test(club);
 let logo=String(r.club_logo_url||'').replace(/^http:/i,'https:').replace(/^\/\//,'https://');
 if(!/^(https:\/\/|\/(?!\/))/i.test(logo)) logo='';
 const clubLine=hasClub?'<div class="player-club">'+(logo?'<img data-club-logo src="'+esc(logo)+'" alt="">':'')+'<span>'+esc(club)+'</span></div>':'';
 const update=tab==='changes';
 const delta=Number(r.rating_delta);
 const moved=update&&Number.isFinite(delta)&&delta!==0&&r.rating!=null;
 const newRole=update&&r.position&&(r.previous_position ? r.previous_position!==r.position : r.rating_delta==null);
 const badge=moved?'<strong class="codex-rating-change '+(delta>0?'up':'down')+'">R '+esc(Number(r.rating)-delta)+' → '+esc(r.rating)+'</strong>':'';
 const role=(newRole?'Nuova posizione · ':'')+esc(r.position||'—');
 const metric=(key,value)=>'<span>'+key+' <b>'+esc(value??'—')+'</b></span>';
 const url='profile.html?'+esc(new URLSearchParams({world:gw,player:String(r.player_id)}));
 return '<a class="nc-card" href="'+url+'">'+NexusCards.photo(images,name)+'<div class="nc-data"><div class="player-name-row"><strong class="nc-name">'+esc(name)+'</strong>'+badge+nationality(r.nationality)+'</div><div class="codex-facts"><span>'+role+'</span>'+(moved?'':metric('R',r.rating))+metric('E',r.age)+metric('V',r.market_value)+'</div>'+clubLine+'</div></a>';
}
let rows=[],shown=60,loading=false;
function render(){const q=$('search').value.trim().toLocaleLowerCase('it'),club=$('club').value;let a=rows.filter(r=>(!q||[r.player_name,r.full_name,r.club_from,r.club_to,r.current_club,r.nationality,r.player_id].some(v=>String(v??'').toLocaleLowerCase('it').includes(q)))&&(!club||(isPlayers?r.current_club===club:r.club_from===club||r.club_to===club))&&(!isPlayers||!$('role').value||role(r)===$('role').value));if(isPlayers){a.sort((a,b)=>$('sort').value==='rating'?Number(b.rating)-Number(a.rating)||String(a.full_name).localeCompare(String(b.full_name)):$('sort').value==='age'?Number(a.age??999)-Number(b.age??999):String(a.full_name).localeCompare(String(b.full_name),'it'))}$('count').textContent=a.length+(isPlayers?' giocatori':' trasferimenti');const slice=a.slice(0,shown);$('list').innerHTML=!a.length?'<p class="empty">Nessun risultato per questi filtri.</p>':isPlayers?'<div class="cards-grid">'+slice.map(card).join('')+'</div>':'<div class="cards-grid">'+slice.map(NexusCards.transfer).join('')+'</div>';$('load-more').hidden=shown>=a.length;NexusCards.wireImages($('list'))}
for(const id of ['search','club','role','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>{shown=60;render()});$('load-more').onclick=()=>{shown+=60;render()};
async function get(path){const res=await fetch(path,{cache:'no-store'}),j=await res.json();if(!res.ok||j.ok===false)throw Error('Dati non disponibili');return j}
async function refresh(){if(loading)return;loading=true;try{const j=await get(daily?'daily.php?'+new URLSearchParams({tab,day:day.value}):url('world.php'));rows=j.rows||[];if(daily){day.replaceChildren(...j.days.map(d=>new Option(d.split('-').reverse().join('/'),d)));day.value=j.day||'';}const current=$('club').value,clubs=[...new Set(rows.flatMap(r=>isPlayers?[r.current_club]:[r.club_from,r.club_to]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'));$('club').innerHTML='<option value="">Tutti i club</option>'+clubs.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');if(clubs.includes(current))$('club').value=current;$('note').textContent=daily?'Rilevati nel giorno selezionato':isPlayers?'Tutti i giocatori del mondo di gioco · Dati Player Codex':'Tutti i trasferimenti · Tutte le stagioni · Dal più recente';render();$('updated').textContent='Aggiornamento automatico · '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'})}catch(e){if(!rows.length)$('list').innerHTML='<p class="empty">Dati temporaneamente non disponibili. <button id="retry">Riprova</button></p>';else $('updated').textContent='Aggiornamento non riuscito. Riproveremo automaticamente.';if($('retry'))$('retry').onclick=refresh}finally{loading=false}}
get(url('context.php')).then(c=>{$('meta').textContent=(c.world?.game_world_name||gw)+' · '+(isPlayers?'Player database':'Tutte le stagioni')}).catch(()=>{$('meta').textContent=gw});refresh();setInterval(()=>{if(!document.hidden)refresh()},60000);
})();


