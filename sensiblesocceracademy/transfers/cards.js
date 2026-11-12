(()=>{
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const safe=v=>{let s=String(v||'').replace(/^http:/i,'https:');if(s.startsWith('//'))s='https:'+s;return /^(https:\/\/|\/(?!\/))/i.test(s)?s:''};
 function photo(urls,name){
  const candidates=[...new Set((urls||[]).map(safe).filter(Boolean))];
  return '<div class="nc-photo"><span class="nc-photo-empty" aria-label="Foto non disponibile">'+esc(String(name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join(''))+'</span>'+(candidates.length?'<img loading="lazy" src="'+esc(candidates[0])+'" data-player-images="'+esc(JSON.stringify(candidates.slice(1)))+'" alt="'+esc(name)+'">':'')+'</div>';
 }
 function wireImages(root){root.querySelectorAll('img[data-player-images]').forEach(img=>{
  const next=()=>{const urls=JSON.parse(img.dataset.playerImages||'[]');if(urls.length){img.dataset.playerImages=JSON.stringify(urls.slice(1));img.src=urls[0]}else{img.remove()}};
  img.onerror=next;if(img.complete&&!img.naturalWidth)next();
 });root.querySelectorAll('img[data-club-logo]').forEach(img=>{img.onerror=()=>img.hidden=true;if(img.complete&&!img.naturalWidth)img.hidden=true;});}
 function club(name,url){const src=safe(url);return '<div class="nc-club">'+(src?'<img data-club-logo src="'+esc(src)+'" alt="">':'')+'<span>'+esc(name||'—')+'</span></div>';}
 function playerUrl(id,world){if(!/^\d+$/.test(String(id||''))||Number(id)<1)return '';let saved='';try{saved=localStorage.getItem('imc_nexus_world')||''}catch(e){}const gw=world||new URLSearchParams(location.search).get('world')||saved||'GW010';return '/sensiblesocceracademy/playercodex/profile.html?'+new URLSearchParams({world:gw,player:String(id)})}
 function transfer(x){
  const date=x.normalized_transfer_date?String(x.normalized_transfer_date).slice(0,10).split('-').reverse().join('/'):'Data da normalizzare';
  const href=playerUrl(x.player_id,'GW010'); 
  const amount = x.amount_text ? '<span class="nc-amount">'+esc(x.amount_text)+'</span>' : '';
  const heading = '<div class="transfer-heading"><strong class="nc-name">'+esc(x.player_name||'Giocatore')+'</strong>'+amount+'</div>';
  const route = '<div class="transfer-clubs">'+club(x.club_from,x.from_logo_url)+'<span>→</span>'+club(x.club_to,x.to_logo_url)+'</div>';
  const exchange = x.exchange_names?.length ? '<div class="nc-meta">In scambio: '+x.exchange_names.map(esc).join(', ')+'</div>' : '';
  const season = x.imc_season||x.normalized_season||x.season||'—';
  const meta = [x.codex_age ? esc(x.codex_age)+' anni' : 'Età —', 'Rating '+esc(x.codex_rating??'—'), esc(date), 'S'+esc(season)];
  const open = href ? '<a class="nc-card nc-transfer" href="'+esc(href)+'" style="color:inherit;text-decoration:none">' : '<article class="nc-card nc-transfer">';
  return open+photo(x.player_images||[x.player_image],x.player_name)+'<div class="nc-data">'+heading+route+exchange+'<div class="nc-meta">'+meta.join(' · ')+'</div></div>'+(href?'</a>':'</article>');
 }
 window.NexusCards={photo,wireImages,transfer,playerUrl};
})();

