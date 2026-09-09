(()=>{
  const REPLAY_API='../draw-replay/replay.php';
  const state={started:false,startAt:0,events:[],lastSig:'',saved:false,saving:false};
  const $=id=>document.getElementById(id);
  const clean=s=>String(s||'').trim();
  const region=()=>$('sceneManager')?.classList.contains('sa')?'SA':($('sceneManager')?.classList.contains('eu')?'EU':'');
  function snapshot(type='STATE'){
    const manager=clean($('sceneManagerValue')?.textContent);
    const club=clean($('sceneClubValue')?.textContent);
    const division=clean($('sceneDivisionValue')?.textContent);
    const status=clean($('sceneStatus')?.textContent);
    const chain=clean($('sceneChain')?.textContent);
    const crest=$('sceneCrest')?.getAttribute('src')||'';
    const active={manager:$('sceneManager')?.classList.contains('active')||false,club:$('sceneClub')?.classList.contains('active')||false,division:$('sceneDivision')?.classList.contains('active')||false};
    return {type,t:Math.max(0,Date.now()-state.startAt),manager,region:region(),club,crest,division,status,chain,active,scanning:$('draftScene')?.classList.contains('scanning')||false,locked:$('sceneFinal')?.classList.contains('show')||false};
  }
  function capture(type='STATE'){
    if(!state.started||state.saved)return;
    const e=snapshot(type); const sig=JSON.stringify({...e,t:0,type:'STATE'});
    if(sig===state.lastSig&&type==='STATE')return;
    state.lastSig=sig; state.events.push(e);
  }
  function start(){
    if(state.started)return;
    state.started=true; state.startAt=Date.now(); state.events=[]; state.lastSig=''; state.saved=false;
    capture('DRAFT_STARTED');
  }
  function installObserver(){
    const scene=$('draftScene'); if(!scene)return;
    const obs=new MutationObserver(()=>{
      if(scene.classList.contains('show')&&!state.started)start();
      if(state.started)requestAnimationFrame(()=>capture('STATE'));
    });
    obs.observe(scene,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','src']});
    const count=$('count'); if(count)new MutationObserver(()=>{
      if(/24\s*\/\s*24\s*LOCKED/i.test(count.textContent||''))capture('DRAFT_COMPLETED');
    }).observe(count,{subtree:true,childList:true,characterData:true});
  }
  function buildAssignments(){
    return [...document.querySelectorAll('#divisions .divisionBox')].flatMap((box,di)=>[...box.querySelectorAll('.slot')].filter(s=>s.querySelector('b')).map(slot=>({division:di+1,club:clean(slot.querySelector('b')?.textContent),manager:clean((()=>{const c=slot.cloneNode(true);c.querySelector('b')?.remove();return c.textContent;})()),region:slot.classList.contains('sa')?'SA':'EU'})));
  }
  async function saveReplay(button){
    if(state.saving||state.saved)return;
    if(!state.started)start(); capture('REPLAY_SAVED');
    state.saving=true; if(button){button.disabled=true;button.textContent='SALVATAGGIO...';}
    const payload={version:1,title:'Sensible Soccer Academy · GW010 Draw',created_at:new Date().toISOString(),duration_ms:state.events.length?state.events[state.events.length-1].t:0,events:state.events,assignments:buildAssignments()};
    try{
      const r=await fetch(REPLAY_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
      const j=await r.json(); if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));
      state.saved=true; if(button){button.textContent='✓ SORTEGGIO SALVATO';button.style.background='#3d83e6';}
      const actions=button?.parentElement; if(actions&&!actions.querySelector('.replayOpen')){
        const a=document.createElement('a');a.className='finalBtn replayOpen';a.href='../draw-replay/';a.textContent='▶ APRI DRAW REPLAY';a.style.display='inline-block';a.style.marginLeft='10px';a.style.textDecoration='none';actions.appendChild(a);
      }
    }catch(e){if(button){button.disabled=false;button.textContent='RIPROVA · TERMINA SORTEGGIO';}alert('Salvataggio replay non riuscito: '+e.message);}
    finally{state.saving=false;}
  }
  function patchFinalButton(){
    const final=$('finalDraft'); if(!final)return false;
    const btn=final.querySelector('.finalBtn'); if(!btn||btn.dataset.replaySave==='1')return !!btn;
    btn.dataset.replaySave='1';btn.textContent='■ TERMINA SORTEGGIO';
    const replacement=btn.cloneNode(true);btn.replaceWith(replacement);
    replacement.addEventListener('click',()=>saveReplay(replacement));
    return true;
  }
  const mo=new MutationObserver(()=>patchFinalButton());
  const boot=()=>{installObserver();mo.observe(document.body,{childList:true,subtree:true});patchFinalButton();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
