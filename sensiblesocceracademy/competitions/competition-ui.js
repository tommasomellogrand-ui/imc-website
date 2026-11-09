(()=>{'use strict';
const p=new URLSearchParams(location.search),gw='GW010';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(path,extra={})=>path+'?'+new URLSearchParams({world:gw,...extra});

const shapes={home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',cup:'<path d="M7 3h10v5a5 5 0 0 1-10 0zM12 13v6M8 21h8M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4"/>',club:'<path d="m12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6z"/>',manager:'<circle cx="12" cy="7" r="4"/><path d="M3 21v-2a9 7 0 0 1 18 0v2z"/>',menu:'<path d="M3 5h18M3 12h18M3 19h18"/>',arrow:'<path d="m9 5 7 7-7 7"/>',ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6zM12 3v4M3 10l4 1m2 6-3 3m9-3 3 3m-1-9 4-1"/>'};
const icon=k=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+shapes[k]+'</svg>';
async function get(path){const r=await fetch(path,{cache:'no-store'}),d=await r.json();if(!r.ok||d.ok===false)throw Error('Dati temporaneamente non disponibili. Riprova tra poco.');return d}
const ready=(async()=>{if(!location.pathname.endsWith('view.html'))return {};const c=await get(url('/site-data/core/context.php')),select=document.getElementById('season-select'),requested=p.get('season');select.innerHTML='';for(const s of c.seasons||[])select.add(new Option('Stagione '+s.imc_season,s.imc_season));const season=(c.seasons||[]).some(s=>String(s.imc_season)===requested)?requested:String(c.current_season||'');select.value=season;select.disabled=!season;select.onchange=()=>{const next=new URLSearchParams(location.search);next.set('world',gw);next.set('season',select.value);location.href=location.pathname+'?'+next};document.getElementById('meta').textContent=(c.world?.game_world_name||gw)+(season?' · Stagione '+season:'');p.set('world',gw);if(season)p.set('season',season);history.replaceState(null,'',location.pathname+'?'+p);return {gw,season,world:c.world}})();
window.NexusUI={p,gw,esc,url,icon,get,ready};
})();



