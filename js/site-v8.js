(function(){
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.site-nav');
  if(toggle&&nav){
    toggle.addEventListener('click',function(){
      const open=nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',String(open));
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded','false');
      });
    });
  }

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.12});
    document.querySelectorAll('.world-card,.competition-card,.nexus-panel,.community-panel').forEach(function(el){observer.observe(el);});
  }

  const SUPABASE_URL='https://toanuzojdkfjgucztpze.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l';

  async function exactCount(table,column){
    const url=SUPABASE_URL+'/rest/v1/'+encodeURIComponent(table)+'?select='+encodeURIComponent(column)+'&limit=1';
    const response=await fetch(url,{
      method:'GET',
      cache:'no-store',
      headers:{
        'apikey':SUPABASE_PUBLISHABLE_KEY,
        'Authorization':'Bearer '+SUPABASE_PUBLISHABLE_KEY,
        'Prefer':'count=exact',
        'Range':'0-0'
      }
    });
    if(!response.ok)throw new Error(table+' HTTP '+response.status);
    const range=response.headers.get('content-range')||'';
    const match=range.match(/\/(\d+)$/);
    if(match)return Number(match[1]);
    const rows=await response.json();
    return Array.isArray(rows)?rows.length:null;
  }

  async function loadLiveCounters(){
    const managerNode=document.getElementById('liveManagerCount');
    const worldNode=document.getElementById('liveWorldCount');
    try{
      const counts=await Promise.all([
        exactCount('imc_managers','manager_id'),
        exactCount('imc_game_worlds','game_world_id')
      ]);
      if(managerNode && Number.isFinite(counts[0]))managerNode.textContent=String(counts[0]);
      if(worldNode && Number.isFinite(counts[1]))worldNode.textContent=String(counts[1]);
    }catch(error){
      console.error('IMC live counters:',error);
      // Server-rendered counters remain visible if the browser-side refresh fails.
    }
  }

  loadLiveCounters();
})();
