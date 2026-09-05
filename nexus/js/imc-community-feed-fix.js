(function(){
"use strict";
if(window.__IMC_COMMUNITY_FEED_FIX__)return;
window.__IMC_COMMUNITY_FEED_FIX__=true;

const VERSION="1.0.0-feed-independent";
const DEFAULT_URL="https://toanuzojdkfjgucztpze.supabase.co";
const DEFAULT_KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const PREVIEW=3;
let ownClient=null;
let expanded=false;
let loading=false;
let rowsCache=null;
let timer=null;

function clean(v){return String(v==null?"":v).trim();}
function esc(v){return clean(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
function db(){return window.__IMC_NEXUS_CLIENT__||ownClient;}
function cleanUrl(v){const raw=clean(v);return raw.startsWith("//")?"https:"+raw:raw;}
function logoUrl(file,url){const direct=cleanUrl(url);if(direct)return direct;const name=clean(file);return name?"https://cdn.soccerwiki.org/images/logos/clubs/"+encodeURIComponent(name):"";}
function formatDate(value){
  const raw=clean(value);if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const p=raw.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(p[0],p[1]-1,p[2]))).replace(".","").toUpperCase();
}
function label(type){if(type==="new_manager")return"NUOVO MANAGER";if(type==="manager_change")return"CAMBIO PANCHINA";if(type==="abandonment")return"ABBANDONO";return"NUOVO INCARICO";}
function copy(row){
  const name=esc(row.manager_name||row.manager_id||"Manager");
  const world=row.game_world_id?'<b>'+esc(row.game_world_id)+'</b>'+(row.game_world_name?' · '+esc(row.game_world_name):''):"IMC Community";
  if(row.event_type==="new_manager")return{title:name+" entra nella Community IMC",detail:world};
  if(row.event_type==="manager_change")return{title:name,detail:esc(row.from_team_name||"Club precedente")+' <b>→</b> '+esc(row.to_team_name||"Nuovo club")+' · '+world};
  if(row.event_type==="abandonment")return{title:name+" lascia "+esc(row.from_team_name||"il club"),detail:world};
  return{title:name+" prende il controllo di "+esc(row.to_team_name||"un nuovo club"),detail:world};
}
function logoMarkup(file,url,alt,extra){
  const src=logoUrl(file,url);
  if(!src)return '<span class="nx-imc52-logo '+esc(extra||"")+'">◈</span>';
  return '<span class="nx-imc52-logo '+esc(extra||"")+'"><img src="'+esc(src)+'" alt="'+esc(alt||"Club")+'" onerror="this.style.display=\'none\';this.parentElement.textContent=\'◈\'"></span>';
}
function media(row){
  if(row.event_type==="new_manager")return '<span class="nx-imc52-logo is-imc"><img src="assets/imc-logo.png" alt="IMC"></span>';
  if(row.event_type==="manager_change")return '<span class="nx-imc52-change-media">'+logoMarkup(row.from_logo_file,row.from_logo_url,row.from_team_name)+'<span class="nx-imc52-change-arrow">→</span>'+logoMarkup(row.to_logo_file,row.to_logo_url,row.to_team_name)+'</span>';
  if(row.event_type==="abandonment")return logoMarkup(row.from_logo_file,row.from_logo_url,row.from_team_name);
  return logoMarkup(row.to_logo_file,row.to_logo_url,row.to_team_name);
}
function render(){
  const host=document.getElementById("imcCommunityFeedRows");
  if(!host||!rowsCache)return;
  const visible=rowsCache.slice(0,expanded?18:PREVIEW);
  host.innerHTML=visible.map(function(row){
    const c=copy(row);
    return '<article class="nx-imc52-news"><div class="nx-imc52-news-media">'+media(row)+'</div><div class="nx-imc52-news-copy"><div class="nx-imc52-news-top"><span class="nx-imc52-badge '+esc(row.event_type)+'">'+label(row.event_type)+'</span><time class="nx-imc52-date">'+esc(formatDate(row.event_date))+'</time></div><strong>'+c.title+'</strong><p>'+c.detail+'</p></div></article>';
  }).join("")||'<div class="nx-imc52-feed-loading">Nessun movimento recente.</div>';

  const old=document.getElementById("imcCommunityFeedMore");
  if(old){
    const button=old.dataset.communityFixBound==="1"?old:old.cloneNode(true);
    if(button!==old)old.replaceWith(button);
    button.dataset.communityFixBound="1";
    button.hidden=rowsCache.length<=PREVIEW;
    button.textContent=expanded?"MOSTRA MENO":"VEDI TUTTE →";
    if(!button.dataset.communityFixListener){
      button.dataset.communityFixListener="1";
      button.addEventListener("click",function(){expanded=!expanded;render();});
    }
  }
}
async function load(){
  const host=document.getElementById("imcCommunityFeedRows");
  if(!host||loading)return;
  loading=true;
  try{
    const client=db();if(!client)throw new Error("Client Supabase non disponibile");
    const result=await client.from("vw_imc_community_feed")
      .select("event_key,event_date,event_type,manager_id,manager_name,game_world_id,game_world_name,from_team_id,from_team_name,from_logo_file,from_logo_url,to_team_id,to_team_name,to_logo_file,to_logo_url")
      .order("event_date",{ascending:false})
      .limit(18);
    if(result.error)throw result.error;
    rowsCache=result.data||[];
    render();
  }catch(error){
    host.innerHTML='<div class="nx-imc52-feed-loading">Feed non disponibile: '+esc(error&&error.message||"errore dati")+'</div>';
  }finally{loading=false;}
}
function schedule(){
  clearTimeout(timer);
  timer=setTimeout(function(){
    const host=document.getElementById("imcCommunityFeedRows");
    if(!host)return;
    if(rowsCache)render();else load();
  },40);
}
function start(){
  if(!ownClient&&window.supabase){
    let cfg=null;try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
    ownClient=window.supabase.createClient(cfg&&cfg.url?cfg.url:DEFAULT_URL,cfg&&cfg.key?cfg.key:DEFAULT_KEY);
  }
  const root=document.getElementById("app")||document.documentElement;
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_COMMUNITY_FEED_FIX={version:VERSION,refresh:function(){rowsCache=null;load();}};
})();