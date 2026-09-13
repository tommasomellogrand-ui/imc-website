import {readSeasons} from './data-client.js';

/** One season read in flight per page, independent of fixture/snapshot availability. */
export function createWorldState({reader=readSeasons,notify=()=>{}}={}) {
  const blank=()=>({game_world_id:'GW001',source:'IMC Game World Season',timezone:'Europe/Rome',today:null,read_at:null,seasons:Object.freeze([]),current_season:null,current_status:null});
  let state=Object.freeze({...blank(),status:'idle'}),pending=null;
  const publish=next=>{state=Object.freeze(next);notify(state);return state;};
  function refreshSeasons(){
    if(pending)return pending;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    pending=Promise.resolve().then(()=>reader({signal:controller.signal})).then(data=>{
      const seasons=Object.freeze(data.seasons.map(s=>Object.freeze({...s})));
      return publish({...data,seasons,current_season:seasons.find(s=>data.current_season?.imc_season===s.imc_season)??null,status:'ready'});
    }).catch(()=>publish({...blank(),status:'error',error:'seasons_unavailable'})).finally(()=>{clearTimeout(timeout);pending=null;});
    publish({...blank(),status:'loading'});
    return pending;
  }
  return Object.freeze({get seasonState(){return state;},refreshSeasons});
}

export const worldState=createWorldState({notify:state=>{
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('imc:gw001:season-change',{detail:state}));
}});
let started=false;
export function startWorldState(){
  if(started)return worldState;
  started=true;
  Object.defineProperty(window,'IMC_GW001',{value:worldState,writable:false,configurable:false});
  worldState.refreshSeasons();
  const refresh=()=>{if(!document.hidden)worldState.refreshSeasons();};
  // Refresh on return and while visible: new database rows need no snapshot rebuild.
  document.addEventListener('visibilitychange',refresh);
  window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});
  setInterval(refresh,60000);
  return worldState;
}
