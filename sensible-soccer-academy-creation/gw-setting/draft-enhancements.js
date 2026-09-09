(()=>{
  const CLUBS=['Peñarol','Colo-Colo','Millonarios','Bolívar','Olimpia','Alianza Lima','Santos','São Paulo','Grêmio','Argentinos Juniors',"Newell's Old Boys",'Vélez Sarsfield','Atalanta','Ferencváros','IFK Göteborg','Aberdeen','Siviglia','West Ham United','Stoccarda','Anderlecht','Ajax','Olympique Lyonnais','Dinamo Zagreb','Benfica'];
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const map=window.IMC_CREST_OVERRIDES||{};
  const byNorm={}; Object.keys(map).forEach(k=>byNorm[norm(k)]=map[k]);
  const candidates={
    'Siviglia':['Sevilla','Sevilla FC','sevilla'],
    'Stoccarda':['VfB Stuttgart','Stuttgart','vfb-stuttgart'],
    'Ferencváros':['Ferencvaros','Ferencvárosi TC','ferencvaros'],
    'IFK Göteborg':['IFK Goteborg','IFK Göteborg','ifk-goteborg'],
    'São Paulo':['Sao Paulo','São Paulo FC','sao-paulo'],
    'Grêmio':['Gremio','Grêmio FBPA','gremio'],
    'Peñarol':['Penarol','CA Peñarol','penarol'],
    'Bolívar':['Bolivar','Club Bolívar','bolivar'],
    'Vélez Sarsfield':['Velez Sarsfield','Club Atlético Vélez Sarsfield','velez-sarsfield'],
    "Newell's Old Boys":["Newells Old Boys","Newell's Old Boys",'newells-old-boys'],
    'Olympique Lyonnais':['Olympique Lyon','Lyon','olympique-lyon'],
    'West Ham United':['West Ham','West Ham United FC','west-ham-united'],
    'Dinamo Zagreb':['Dinamo Zagreb','GNK Dinamo Zagreb','dinamo-zagreb']
  };
  const resolve=name=>{
    if(map[name]) return map[name];
    if(byNorm[norm(name)]) return byNorm[norm(name)];
    for(const c of (candidates[name]||[])) if(map[c]||byNorm[norm(c)]) return map[c]||byNorm[norm(c)];
    return '';
  };
  CLUBS.forEach(name=>{const v=resolve(name); if(v) map[name]=v;});
  window.IMC_CREST_OVERRIDES=map;

  const css=`
  :root{--imc-gold:#f4c93d;--imc-ink:#06111f;--imc-blue:#3d83e6;--imc-red:#d9483f;--pitch1:#178948;--pitch2:#209b51}
  .sceneBox{background:linear-gradient(180deg,#0a1930,#071629 68%,#04101d);position:relative;overflow:hidden}
  .sceneBox:before,.sceneBox:after{content:'';position:absolute;pointer-events:none;opacity:.22}
  .sceneBox:before{inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.035) 3px 4px)}
  .sceneBox:after{width:220px;height:220px;border:3px solid rgba(244,201,61,.2);border-radius:50%;right:-110px;top:-110px}
  .sceneHead{position:relative;z-index:2;text-shadow:3px 3px #000;box-shadow:inset 0 0 0 2px rgba(255,255,255,.08)}
  .sceneHead:before{content:'⚽';margin-right:10px}.sceneHead:after{content:'⚽';margin-left:10px}
  .sceneStage{box-shadow:inset 0 0 0 4px rgba(0,0,0,.35),0 8px 0 #02070e}
  .zone{overflow:hidden;background:linear-gradient(180deg,#0c213e,#071629);box-shadow:6px 6px #02070e,inset 0 0 0 2px rgba(255,255,255,.05)}
  .zone:before{content:'';position:absolute;inset:6px;border:1px dashed rgba(255,255,255,.12);pointer-events:none}
  .zone.active{box-shadow:6px 6px #02070e,0 0 0 2px var(--imc-gold),0 0 24px rgba(244,201,61,.22)}
  .zoneLabel{position:relative;z-index:2;background:#02070e;padding:4px 8px;display:inline-block;border:1px solid #35557e}
  .zoneValue,.divisionPick,.clubZone img{position:relative;z-index:2}
  .clubZone img,.lock img{background:radial-gradient(circle,#fff 0 55%,#e6e6e6 56% 100%);border:4px solid #f0e6b4;box-shadow:4px 4px #000}
  .sceneStatus{background:#02070e;border:2px solid #35557e;padding:8px;margin-top:12px;text-shadow:2px 2px #000}
  .sceneFinal.show{box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),6px 6px #000;background:linear-gradient(180deg,#071629,#02070e)}
  .pauseLine{letter-spacing:1px}
  .finalDraft{position:fixed;inset:0;z-index:2400;background:linear-gradient(180deg,rgba(2,7,14,.98),rgba(5,21,38,.99));display:none;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;color:#fff;font-family:"Courier New",monospace}
  .finalDraft.show{display:block}.finalWrap{max-width:1200px;margin:0 auto;padding:10px 0 40px}.finalHero{text-align:center;border:5px solid #f0e6b4;box-shadow:0 0 0 5px #000;background:#071629;padding:14px;position:relative;overflow:hidden}
  .finalHero:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(22,137,74,.17) 0 70px,rgba(32,155,81,.12) 70px 140px);pointer-events:none}
  .finalHero img{position:relative;width:min(560px,92%);max-height:190px;object-fit:contain;filter:drop-shadow(5px 5px #000)}
  .finalTitle{position:relative;font-size:clamp(26px,6vw,58px);font-weight:900;color:#f4c93d;text-shadow:4px 4px #000;margin:6px 0}.finalSub{position:relative;font-weight:900;letter-spacing:2px;color:#9eb9db}
  .finalDivisions{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.finalDivision{background:#071629;border:4px solid #f0e6b4;box-shadow:5px 5px #000}.finalDivision h2{text-align:center;margin:0;padding:10px;background:#02070e;color:#f4c93d;border-bottom:3px solid #35557e}.finalDivision .balance{text-align:center;padding:6px;font-size:11px;color:#9eb9db;border-bottom:2px solid #02070e}.finalTeam{display:grid;grid-template-columns:46px 1fr;gap:10px;align-items:center;padding:8px;border-bottom:1px solid #35557e;background:#0b213e}.finalTeam.sa{border-left:5px solid #d9483f}.finalTeam.eu{border-left:5px solid #3d83e6}.finalTeam img{width:42px;height:42px;object-fit:contain;background:#fff;border:2px solid #f0e6b4}.finalTeam b{display:block;font-size:12px}.finalTeam span{display:block;font-size:10px;color:#9eb9db;margin-top:3px}.finalActions{text-align:center;margin-top:16px}.finalBtn{background:#198247;color:#fff;border:4px solid #fff;box-shadow:4px 4px #000;padding:12px 18px;font:900 14px "Courier New",monospace}
  @media(max-width:850px){.finalDivisions{grid-template-columns:1fr}.finalHero img{max-height:145px}.finalDraft{padding:8px}.finalTeam{grid-template-columns:40px 1fr}.finalTeam img{width:36px;height:36px}}
  `;
  const style=document.createElement('style'); style.id='gw010-enhancements'; style.textContent=css; document.head.appendChild(style);

  function patchBrokenCrests(){
    document.querySelectorAll('img').forEach(img=>{
      if(img.id==='sceneCrest'){
        const name=document.getElementById('sceneClubValue')?.textContent?.trim();
        if(name && name!=='WAITING'){const v=resolve(name); if(v && img.src!==v) img.src=v;}
      }
    });
  }
  document.addEventListener('error',e=>{
    const img=e.target; if(!(img instanceof HTMLImageElement)) return;
    const club=img.closest('.club')?.querySelector('.name')?.textContent?.trim() || img.closest('.lock')?.querySelector('.clubname')?.textContent?.trim() || document.getElementById('sceneClubValue')?.textContent?.trim();
    const v=resolve(club); if(v && img.dataset.repaired!=='1'){img.dataset.repaired='1';img.src=v;}
  },true);

  function managerFromSlot(slot){
    const clone=slot.cloneNode(true); const b=clone.querySelector('b'); if(b)b.remove(); return clone.textContent.trim();
  }
  function showFinal(){
    if(document.getElementById('finalDraft')) return;
    const overlay=document.createElement('div'); overlay.id='finalDraft'; overlay.className='finalDraft';
    const divisions=[...document.querySelectorAll('#divisions .divisionBox')];
    const columns=divisions.map((box,i)=>{
      const teams=[...box.querySelectorAll('.slot')].filter(s=>s.querySelector('b')).map(slot=>{
        const club=slot.querySelector('b').textContent.trim(); const manager=managerFromSlot(slot); const region=slot.classList.contains('sa')?'SA':'EU'; const crest=resolve(club);
        return `<div class="finalTeam ${region.toLowerCase()}"><img src="${crest}" alt="${club}"><div><b>${club}</b><span>${manager}</span></div></div>`;
      }).join('');
      return `<section class="finalDivision"><h2>DIVISIONE ${i+1}</h2><div class="balance">4 SUD AMERICA · 4 EUROPA</div>${teams}</section>`;
    }).join('');
    overlay.innerHTML=`<div class="finalWrap"><header class="finalHero"><img src="./sensible-soccer-academy-logo.svg" alt="Sensible Soccer Academy IMC GW010"><div class="finalTitle">DRAFT COMPLETATO</div><div class="finalSub">24 / 24 LOCKED · 3 DIVISIONI CREATE</div></header><main class="finalDivisions">${columns}</main><div class="finalActions"><button class="finalBtn" type="button">RIVEDI TABELLONE</button></div></div>`;
    document.body.appendChild(overlay); document.querySelector('#draftScene')?.classList.remove('show'); overlay.classList.add('show');
    overlay.querySelector('.finalBtn').addEventListener('click',()=>overlay.classList.remove('show'));
  }
  function watchCompletion(){
    const count=document.getElementById('count'); if(!count)return;
    let scheduled=false;
    const check=()=>{if(!scheduled && /24\s*\/\s*24\s*LOCKED/i.test(count.textContent)){scheduled=true;setTimeout(showFinal,3200);}};
    new MutationObserver(()=>{patchBrokenCrests();check();}).observe(count,{childList:true,subtree:true,characterData:true}); check();
    const scene=document.getElementById('draftScene'); if(scene)new MutationObserver(patchBrokenCrests).observe(scene,{childList:true,subtree:true,characterData:true,attributes:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watchCompletion); else watchCompletion();
})();
