(()=>{
  const API='./draw-live.php';
  const MODE=(new URLSearchParams(location.search).get('mode')||'host').toLowerCase()==='manager'?'manager':'host';
  const $=id=>document.getElementById(id);
  const clean=s=>String(s||'').trim();
  const scene=$('draftScene');
  if(!scene)return;

  const sessionId=(Date.now().toString(36)+Math.random().toString(36).slice(2));
  let sequence=0,lastSent='',lastReceived=-1,busy=false;

  function hostSnapshot(){
    const final=$('finalDraft');
    const count=clean($('count')?.textContent);
    const sceneShow=scene.classList.contains('show');
    const finalShow=!!final?.classList.contains('show');
    const completed=/24\s*\/\s*24\s*LOCKED/i.test(count)||finalShow;
    const status=completed?'completed':(sceneShow?'live':'idle');
    const region=$('sceneManager')?.classList.contains('sa')?'SA':($('sceneManager')?.classList.contains('eu')?'EU':'');
    return {
      source:'host',status,session_id:sessionId,sequence:sequence+1,count,
      manager:clean($('sceneManagerValue')?.textContent),region,
      club:clean($('sceneClubValue')?.textContent),crest:$('sceneCrest')?.getAttribute('src')||'',
      division:clean($('sceneDivisionValue')?.textContent),scene_status:clean($('sceneStatus')?.textContent),
      chain:clean($('sceneChain')?.textContent),pause:clean($('pauseLine')?.textContent),
      scene_show:sceneShow,scanning:scene.classList.contains('scanning'),locked:$('sceneFinal')?.classList.contains('show')||false,final_show:finalShow,
      active:{manager:$('sceneManager')?.classList.contains('active')||false,club:$('sceneClub')?.classList.contains('active')||false,division:$('sceneDivision')?.classList.contains('active')||false}
    };
  }

  async function postPayload(payload,force=false){
    if(MODE!=='host'||busy)return;
    const sig=JSON.stringify({...payload,sequence:0});
    if(!force&&sig===lastSent)return;
    busy=true;payload.sequence=++sequence;
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
      if(r.ok)lastSent=sig;
    }catch(e){}
    finally{busy=false;}
  }

  async function publish(){
    await postPayload(hostSnapshot(),false);
  }

  function publishHome(){
    const payload={...hostSnapshot(),status:'idle',scene_show:false,scanning:false,locked:false,final_show:false};
    postPayload(payload,true);
  }

  function setText(id,value){const el=$(id);if(el&&clean(el.textContent)!==clean(value))el.textContent=value||'';}
  function setClass(el,name,on){if(el)el.classList.toggle(name,!!on);}

  function applyManagerState(s){
    if(!s||typeof s!=='object')return;
    if(Number(s.sequence||0)<lastReceived)return;
    lastReceived=Number(s.sequence||0);

    const managerZone=$('sceneManager'),clubZone=$('sceneClub'),divisionZone=$('sceneDivision');
    setText('sceneManagerValue',s.manager||'');
    setText('sceneClubValue',s.club||'');
    setText('sceneDivisionValue',s.division||'');
    setText('sceneStatus',s.scene_status||'');
    setText('sceneChain',s.chain||'');
    setText('pauseLine',s.pause||'');
    if(s.count)setText('count',s.count);

    setClass(managerZone,'sa',s.region==='SA');setClass(managerZone,'eu',s.region==='EU');
    setClass(managerZone,'active',s.active?.manager);setClass(clubZone,'active',s.active?.club);setClass(divisionZone,'active',s.active?.division);
    setClass(scene,'scanning',s.scanning);
    setClass($('sceneFinal'),'show',s.locked);

    const crest=$('sceneCrest');
    if(crest&&s.crest&&crest.getAttribute('src')!==s.crest)crest.setAttribute('src',s.crest);

    if(s.status==='live'||s.scene_show){scene.classList.add('show');scene.setAttribute('aria-hidden','false');}
    else if(s.status==='idle'){scene.classList.remove('show');scene.setAttribute('aria-hidden','true');}

    if(s.status==='completed'){
      scene.classList.remove('scanning');
      if(!s.final_show&&s.scene_show===false){scene.classList.remove('show');scene.setAttribute('aria-hidden','true');}
      window.dispatchEvent(new CustomEvent('gw010:live-completed',{detail:s}));
    }
  }

  async function receive(){
    if(MODE!=='manager')return;
    try{
      const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const j=await r.json();if(j.ok)applyManagerState(j.state);
    }catch(e){}
  }

  if(MODE==='host'){
    publish();
    setInterval(publish,300);
    window.addEventListener('gw010:home',publishHome);
    window.addEventListener('beforeunload',()=>{try{navigator.sendBeacon(API,new Blob([JSON.stringify({...hostSnapshot(),status:'idle',scene_show:false,source:'host',sequence:++sequence})],{type:'application/json'}));}catch(e){}});
  }else{
    const draftBtn=$('draftBtn');if(draftBtn)draftBtn.style.display='none';
    receive();setInterval(receive,500);
  }
})();
