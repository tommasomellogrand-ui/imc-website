(function(){
"use strict";
if(window.IMC_CLUBHOUSE_NEXT_MATCH_FIX)return;
const VERSION="3.0.0";
const mod=window.IMC_CLUBHOUSE;
if(!mod){window.IMC_CLUBHOUSE_NEXT_MATCH_FIX={version:VERSION};return}
let state={container:null,client:null,managerId:"",assignments:[],observer:null,lastGw:"",seq:0,percentByGw:new Map()};
const c=v=>String(v==null?"":v).trim();
const nk=v=>c(v).toLocaleLowerCase("it-IT").replace(/\s+/g," ");
function rpc(action,args){return state.client.rpc("imc_nexus_gateway",{p_action:action,p_args:args}).then(r=>{if(r.error)throw r.error;return r.data||{}})}
function formatDate(v){const q=c(v);if(!q)return"—";const d=new Date(q.length===10?q+"T12:00:00":q);if(isNaN(d))return q;return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}
function currentClubAssignment(gw){const rows=state.assignments.filter(a=>c(a.game_world_id)===gw&&c(a.assignment_type).toLowerCase()==="club");if(!rows.length)return null;const today=new Date().toISOString().slice(0,10);const active=rows.filter(a=>(!c(a.start_date)||c(a.start_date)<=today)&&(!c(a.end_date)||c(a.end_date)>=today));const pool=active.length?active:rows;return [...pool].sort((a,b)=>c(b.start_date).localeCompare(c(a.start_date))||Number(b.assignment_id||0)-Number(a.assignment_id||0))[0]||null}
function logoMap(rows){const m=new Map();for(const t of rows||[]){const p=c(t.logo_file);if(!p)continue;const src=p.startsWith("/")?p:`/nexus/${p.replace(/^\.\//,"")}`;for(const name of [t.club_name,t.display_name])if(c(name))m.set(nk(name),src)}return m}
function setImg(img,src,alt){if(!img)return;if(src){img.src=src;img.alt=alt||"";img.hidden=false}else{img.removeAttribute("src");img.alt="";img.hidden=true}}
function paintPercent(value){if(!state.container)return;const el=state.container.querySelector(".ch-season-inner strong");if(!el)return;const text=`${Number(value)||0}%`;if(el.textContent!==text)el.textContent=text}
function paintMatch(kind,row,compName,logos){
  if(!state.container)return;
  const isNext=kind==="next";
  const box=state.container.querySelector(isNext?".ch-mock-next":".ch-mock-last");
  if(!box)return;
  const meta=box.querySelector(".ch-match-meta");
  const fixture=box.querySelector(isNext?".ch-fixture-row":".ch-result-row");
  const foot=box.querySelector(isNext?".ch-match-foot":".ch-result-foot");
  if(meta)meta.textContent=row?compName||c(row.competition_key)||"—":"—";
  if(fixture){
    const sides=fixture.querySelectorAll(":scope > div"),center=fixture.querySelector(":scope > strong"),home=row?c(row.home_name):"—",away=row?c(row.away_name):"—";
    if(sides[0]){setImg(sides[0].querySelector("img"),row?logos.get(nk(home))||"":"",home);const b=sides[0].querySelector("b");if(b)b.textContent=home||"—"}
    if(sides[1]){setImg(sides[1].querySelector("img"),row?logos.get(nk(away))||"":"",away);const b=sides[1].querySelector("b");if(b)b.textContent=away||"—"}
    if(center)center.textContent=row?(isNext?"VS":`${c(row.home_score)} - ${c(row.away_score)}`):"—";
  }
  if(foot){const spans=foot.querySelectorAll("span");if(spans[0])spans[0].textContent=row?formatDate(row.match_date||row.source_page_date):"—";if(spans[1])spans[1].textContent=row?c(row.sm_round_label)||"—":"—"}
}
async function update(gw){
  const a=currentClubAssignment(gw),clubWorldId=c(a&&a.sm_world_club_id);const seq=++state.seq;
  if(!clubWorldId){paintMatch("next",null,"",new Map());paintMatch("last",null,"",new Map());return}
  try{
    const [sc,rr,mf,gt]=await Promise.all([rpc("schedule",{gameWorld:gw,clubWorldId}),rpc("results",{gameWorld:gw,clubWorldId}),rpc("competition_manifest",{gameWorld:gw}),rpc("gw_teams",{gameWorld:gw})]);
    if(seq!==state.seq)return;
    const today=new Date().toISOString().slice(0,10);
    const scheduleRows=Array.isArray(sc.rows)?sc.rows:[];
    const resultRows=Array.isArray(rr.rows)?rr.rows:[];
    const next=[...scheduleRows].filter(x=>c(x.match_date)>=today).sort((a,b)=>c(a.match_date).localeCompare(c(b.match_date))||Number(a.schedule_id||0)-Number(b.schedule_id||0))[0]||null;
    const last=[...resultRows].sort((a,b)=>c(b.source_page_date||b.match_date).localeCompare(c(a.source_page_date||a.match_date))||Number(b.sm_fixture_id||0)-Number(a.sm_fixture_id||0))[0]||null;
    const manifest=Array.isArray(mf.rows)?mf.rows:[];
    const keys=new Set([...scheduleRows,...resultRows].map(x=>c(x.competition_key)).filter(Boolean));
    const league=manifest.find(x=>c(x.smAction).toLowerCase()==="league"&&keys.has(c(x.competition_key)))||null;
    const percent=Number(league&&league.matchesPlayedPercent)||0;
    state.percentByGw.set(gw,percent);
    paintPercent(percent);
    const nextComp=next?manifest.find(x=>c(x.competition_key)===c(next.competition_key)):null;
    const lastComp=last?manifest.find(x=>c(x.competition_key)===c(last.competition_key)):null;
    const logos=logoMap(gt.rows||[]);
    paintMatch("next",next,c(nextComp&&nextComp.nexusView||next&&next.competition_key),logos);
    paintMatch("last",last,c(lastComp&&lastComp.nexusView||last&&last.competition_key),logos);
  }catch(_){if(seq===state.seq){paintMatch("next",null,"",new Map());paintMatch("last",null,"",new Map())}}
}
function watch(){if(state.observer)state.observer.disconnect();if(!state.container)return;const inspect=()=>{const gw=c(state.container.querySelector("[data-ch-world-current]")?.textContent).toUpperCase();if(!/^GW\d{3}$/.test(gw))return;if(gw!==state.lastGw){state.lastGw=gw;update(gw);return}if(state.percentByGw.has(gw))paintPercent(state.percentByGw.get(gw))};state.observer=new MutationObserver(inspect);state.observer.observe(state.container,{childList:true,subtree:true,characterData:true});inspect()}
async function attach(o){state.container=o&&o.container||null;state.client=o&&o.client||null;state.managerId=c(o&&o.managerId);state.assignments=[];state.lastGw="";state.seq=0;state.percentByGw=new Map();if(!state.container||!state.client||!state.managerId)return;try{const ch=await rpc("club_house",{managerId:state.managerId});state.assignments=Array.isArray(ch.assignments)?ch.assignments:[]}catch(_){state.assignments=[]}watch()}
const previousMount=mod.mount,previousUnmount=mod.unmount;
mod.mount=async function(o){const r=await previousMount.call(mod,o);attach(o);return r};
mod.unmount=function(){if(state.observer)state.observer.disconnect();state={container:null,client:null,managerId:"",assignments:[],observer:null,lastGw:"",seq:0,percentByGw:new Map()};return previousUnmount.call(mod)};
window.IMC_CLUBHOUSE_NEXT_MATCH_FIX={version:VERSION,attach};
})();