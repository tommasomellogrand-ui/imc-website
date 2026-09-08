(() => {
  'use strict';
  const CFG=window.IMC_GAME_WORLD||{};
  if(String(CFG.gameWorldId||'').toUpperCase()!=='GW004') return;
  const endpoint='/api/imc-data/v1/site-ready.php';
  CFG.publicDataEndpoint=endpoint;
  const nativeFetch=window.fetch.bind(window);
  const clubImages=new Map();
  const transferEnrichment=new Map();

  function remember(payload){
    const rows=Array.isArray(payload?.data)?payload.data:[];
    for(const r of rows){
      const pairs=[[r.home_name,r.home_image_url],[r.away_name,r.away_image_url],[r.club_from,r.from_image_url],[r.club_to,r.to_image_url],[r.club_name,r.club_image_url],[r.current_club,r.club_image_url]];
      for(const [name,img] of pairs) if(name&&img) clubImages.set(String(name).trim(),img);
      if(r.imc_transfer_number) transferEnrichment.set(String(r.imc_transfer_number),r);
    }
    return payload;
  }

  window.fetch=async function(input,init){
    let u;
    try{u=new URL(typeof input==='string'?input:input.url,location.origin);}catch{return nativeFetch(input,init);}
    if(u.pathname==='/api/imc-gateway/' && String(u.searchParams.get('game_world_id')||'').toUpperCase()==='GW004'){
      const repo=u.searchParams.get('repository');
      if(repo){
        const next=new URL(endpoint,location.origin);
        u.searchParams.forEach((v,k)=>next.searchParams.set(k,v));
        const res=await nativeFetch(next.toString(),init);
        res.clone().json().then(remember).catch(()=>{});
        return res;
      }
    }
    return nativeFetch(input,init);
  };

  function mkImg(src,cls,alt=''){
    if(!src)return null;
    const el=document.createElement('img');el.src=src;el.alt=alt;el.className=cls;el.loading='lazy';return el;
  }
  function decorateTransfers(root=document){
    root.querySelectorAll?.('.transfer-row[data-transfer-no]').forEach(row=>{
      if(row.dataset.siteReadyDecorated==='1')return;
      const data=transferEnrichment.get(row.dataset.transferNo);if(!data)return;
      const avatar=row.querySelector('.transfer-avatar');
      if(avatar&&data.player_image_url){const p=mkImg(data.player_image_url,'gw004-player-photo',data.player_full_name||data.player_name||'');if(p){avatar.textContent='';avatar.appendChild(p);}}
      const route=row.querySelector('.transfer-route');
      if(route){const spans=route.querySelectorAll('span');if(spans[0]&&data.from_image_url){const i=mkImg(data.from_image_url,'gw004-club-stem',data.club_from||'');if(i)spans[0].prepend(i);}if(spans[1]&&data.to_image_url){const i=mkImg(data.to_image_url,'gw004-club-stem',data.club_to||'');if(i)spans[1].prepend(i);}}
      row.dataset.siteReadyDecorated='1';
    });
  }
  function decorateCompetitionTeams(root=document){
    root.querySelectorAll?.('.competition-result-team').forEach(el=>{
      if(el.dataset.siteReadyDecorated==='1')return;
      const name=el.textContent.trim();const src=clubImages.get(name);if(!src)return;
      const i=mkImg(src,'gw004-club-stem',name);if(i){if(el.classList.contains('away'))el.append(i);else el.prepend(i);el.dataset.siteReadyDecorated='1';}
    });
  }
  function applyWorldMeta(){
    const hero=document.querySelector('.hero-copy');
    if(!hero||!CFG.worldMeta)return;
    const existing=hero.querySelector('.gw004-world-meta');if(existing)existing.remove();
    const d=document.createElement('div');d.className='gw004-world-meta';
    d.innerHTML=`<span>SM WORLD ${CFG.worldMeta.sm_game_world_id ?? '—'}</span><span>${CFG.worldMeta.active_clubs ?? '—'} ACTIVE CLUBS</span>`;
    hero.appendChild(d);
  }
  function decorate(){applyWorldMeta();decorateTransfers();decorateCompetitionTeams();}

  const style=document.createElement('style');style.textContent=`
    .gw004-world-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.gw004-world-meta span{padding:5px 8px;border:1px solid rgba(255,255,255,.16);border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.08em;color:#d6a149}
    .gw004-club-stem{width:22px;height:22px;object-fit:contain;vertical-align:middle;margin:0 6px}.gw004-player-photo{width:100%;height:100%;object-fit:cover;border-radius:inherit}
    .transfer-route span{display:inline-flex;align-items:center}.competition-result-team{display:flex;align-items:center;gap:4px}.competition-result-team.away{justify-content:flex-end}
  `;document.head.appendChild(style);

  nativeFetch(`${endpoint}?game_world_id=GW004&dataset=world`,{cache:'no-store',headers:{Accept:'application/json'}})
    .then(r=>r.json()).then(p=>{if(!p?.ok||!p.data)return;CFG.worldMeta=p.data;CFG.worldName=p.data.world_name||CFG.worldName;document.title=`GW004 · ${CFG.worldName||CFG.gameWorldId}`;window.dispatchEvent(new HashChangeEvent('hashchange'));decorate();})
    .catch(()=>{});

  new MutationObserver(decorate).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('hashchange',()=>setTimeout(decorate,0));
})();
