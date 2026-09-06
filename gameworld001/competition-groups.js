(() => {
  'use strict';

  const GATEWAY='https://www.italianmastersclub.it/api/imc-gateway/';
  const WORLD='GW001';
  const CONFIG=[
    {group:'DOMESTIC',slug:'domestic',label:'Domestic',desc:'Leagues, National Cup, League Cup',icon:'🏆'},
    {group:'INTERNATIONAL',slug:'international',label:'International',desc:'SMFA Champions, SMFA Shield, Super Cup',icon:'🌐'},
    {group:'NATIONS',slug:'nations',label:'Nations',desc:'World Cup Qualifying, Nations',icon:'⚑'}
  ];

  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
  function currentPath(){return (location.hash.replace(/^#/,'')||'/overview')}
  async function readAll(repository,group){
    const rows=[];let offset=0,total=null;const pageSize=1000;
    while(total===null||offset<total){
      const u=new URL(GATEWAY);u.searchParams.set('game_world_id',WORLD);u.searchParams.set('action','read');u.searchParams.set('repository',repository);u.searchParams.set('limit',String(pageSize));u.searchParams.set('offset',String(offset));u.searchParams.set('filter_competition_group',group);
      if(repository==='results')u.searchParams.set('filter_result_dataset','MATCH_DATA');
      const r=await fetch(u.toString(),{cache:'no-store',headers:{Accept:'application/json'}});const p=await r.json();if(!r.ok||p?.ok!==true)throw new Error(p?.error||`HTTP_${r.status}`);
      const page=Array.isArray(p.data)?p.data:[];if(total===null)total=Number(p.pagination?.total??page.length);rows.push(...page);offset+=page.length;if(!page.length||page.length<pageSize)break;
    }
    return rows;
  }
  function identityKey(row){
    const key=String(row.competition_key||'').trim();if(key)return `k:${key}`;
    const action=String(row.sm_action||'').trim();const division=String(row.sm_division||'').trim();return action?`a:${action}:${division}`:null;
  }
  async function countCompetitions(group){
    const sets=new Set();
    const results=await readAll('results',group);
    const schedule=await readAll('schedule',group).catch(()=>[]);
    const reports=await readAll('match_report',group).catch(()=>[]);
    [...results,...schedule,...reports].forEach(row=>{const k=identityKey(row);if(k)sets.add(k)});
    return sets.size;
  }
  function card(config,count){
    return `<a class="competition-category-card ${config.slug}" href="#/competitions/${config.slug}"><div class="competition-category-icon">${config.icon}</div><div class="competition-category-copy"><h3>${esc(config.label)}</h3><p>${esc(config.desc)}</p></div><div class="competition-category-count"><strong>${count}</strong><span>Competitions</span></div><div class="competition-category-trophy">🏆</div><div class="competition-category-open">›</div></a>`;
  }
  async function enhance(){
    if(currentPath()!=='/competitions')return;
    let tries=0;let host=null;
    while(!host&&tries<20){host=document.querySelector('.competition-discovery');if(!host){await new Promise(r=>setTimeout(r,100));tries++;}}
    if(!host||currentPath()!=='/competitions')return;
    try{
      const counts=await Promise.all(CONFIG.map(c=>countCompetitions(c.group)));
      if(currentPath()!=='/competitions')return;
      host.innerHTML=CONFIG.map((c,i)=>card(c,counts[i])).join('');
    }catch(_){/* lascia la vista standard se il Gateway fallisce */}
  }
  window.addEventListener('hashchange',()=>setTimeout(enhance,0));
  window.addEventListener('popstate',()=>setTimeout(enhance,0));
  setTimeout(enhance,0);
})();
