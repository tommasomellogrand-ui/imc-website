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
 function playerUrl(id,world){if(!/^\d+$/.test(String(id||''))||Number(id)<1)return '';let saved='';try{saved=localStorage.getItem('imc_nexus_world')||''}catch(e){}const gw=world||new URLSearchParams(location.search).get('world')||saved||'GW001';return '/nexus/players/profile.html?'+new URLSearchParams({world:gw,player:String(id)})}
 function transfer(x){
  const date=x.normalized_transfer_date?String(x.normalized_transfer_date).slice(0,10).split('-').reverse().join('/'):'Data da normalizzare';
  const href=playerUrl(x.player_id);return (href?'<a class="nc-card nc-transfer" href="'+esc(href)+'" style="color:inherit;text-decoration:none">':'<article class="nc-card nc-transfer">')+photo(x.player_images||[x.player_image],x.player_name)+'<div class="nc-data"><div class="nc-name">'+esc(x.player_name||'Giocatore')+'</div><div class="nc-meta nc-when">'+esc(date)+' · Stagione '+esc(x.imc_season||x.normalized_season||x.season||'—')+'</div>'+club(x.club_from,x.from_logo_url)+'<div class="nc-arrow">↓</div>'+club(x.club_to,x.to_logo_url)+(x.amount_text?'<div class="nc-amount">'+esc(x.amount_text)+'</div>':'')+'</div>'+(href?'</a>':'</article>');
 }
 window.NexusCards={photo,wireImages,transfer,playerUrl};
})();
