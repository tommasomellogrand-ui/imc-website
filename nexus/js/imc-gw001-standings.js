(function(){
"use strict";
if(window.__IMC_GW001_STANDINGS_V12__)return;
window.__IMC_GW001_STANDINGS_V12__=true;

const VERSION="1.2.0-nexus-sport-two-line";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const STYLE_ID="imcGw001StandingsV12Css";
let timer=null;
let ownClient=null;
let loading=false;

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function esc(v){return clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function signed(v){const n=Number(v||0);return n>0?"+"+n:String(n);}
function client(){if(window.__IMC_NEXUS_CLIENT__)return window.__IMC_NEXUS_CLIENT__;if(!ownClient&&window.supabase)ownClient=window.supabase.createClient(URL,KEY);return ownClient;}
function initials(name){return clean(name).split(" ").filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";}

function installCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");
  s.id=STYLE_ID;
  s.textContent=`
#divisionContent .nx-gw001-standings-v12{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0b1c4d;background:#fff}
#divisionContent .nx-gw001-standings-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:4px 0 16px;padding:4px 3px 13px;border-bottom:1px solid #e4e9f2}
#divisionContent .nx-gw001-standings-head h2{margin:0;color:#0a1d52;font-size:30px;font-weight:950;line-height:.94;letter-spacing:-.05em;text-transform:uppercase}
#divisionContent .nx-gw001-standings-head p{margin:6px 0 0;color:#4f66e8;font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}
#divisionContent .nx-gw001-matchday-pill{padding:8px 11px;border:1px solid #e3e8f1;border-radius:999px;color:#5b6982;font-size:7px;font-weight:900;text-transform:uppercase}
#divisionContent .nx-gw001-standing-list{display:grid;gap:8px}
#divisionContent .nx-gw001-standing-row{position:relative;overflow:hidden;padding:10px 11px 9px 13px;border:1px solid #e2e8f1;border-radius:17px;background:#fff;box-shadow:0 4px 14px rgba(20,39,83,.045)}
#divisionContent .nx-gw001-standing-row:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#aeb8cc}
#divisionContent .nx-gw001-standing-row.zone-title:before{background:#13b94f}#divisionContent .nx-gw001-standing-row.zone-blue:before{background:#2f7df4}#divisionContent .nx-gw001-standing-row.zone-purple:before{background:#7a35ef}#divisionContent .nx-gw001-standing-row.zone-red:before{background:#f12634}
#divisionContent .nx-gw001-standing-main{display:grid;grid-template-columns:30px 36px minmax(0,1fr) 54px;gap:8px;align-items:center}
#divisionContent .nx-gw001-pos{font-size:15px;font-weight:950;text-align:center;color:#0b1c4d}
#divisionContent .nx-gw001-club-logo{display:flex;align-items:center;justify-content:center;width:36px;height:36px;overflow:hidden}
#divisionContent .nx-gw001-club-logo img{display:block;max-width:100%;max-height:100%;object-fit:contain}
#divisionContent .nx-gw001-club-fallback{display:flex;align-items:center;justify-content:center;width:33px;height:33px;border-radius:50%;background:#eff3f9;color:#183268;font-size:8px;font-weight:950}
#divisionContent .nx-gw001-team-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0a1d52;font-size:11px;font-weight:950;text-transform:uppercase}
#divisionContent .nx-gw001-points{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:39px;border-radius:13px;background:#091c4d;color:#fff;line-height:1}
#divisionContent .nx-gw001-points strong{font-size:16px;font-weight:950}#divisionContent .nx-gw001-points small{margin-top:3px;font-size:6px;font-weight:900;letter-spacing:.07em}
#divisionContent .zone-title .nx-gw001-points{background:#14b94f}#divisionContent .zone-blue .nx-gw001-points{background:#2168ed}#divisionContent .zone-purple .nx-gw001-points{background:#722de7}#divisionContent .zone-red .nx-gw001-points{background:#f12634}
#divisionContent .nx-gw001-standing-stats{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin-top:9px;padding-top:8px;border-top:1px solid #edf1f5}
#divisionContent .nx-gw001-standing-stat{text-align:center;min-width:0}
#divisionContent .nx-gw001-standing-stat small{display:block;color:#8a95a7;font-size:6px;font-weight:900;line-height:1;text-transform:uppercase}
#divisionContent .nx-gw001-standing-stat strong{display:block;margin-top:4px;color:#172a55;font-size:8px;font-weight:950;line-height:1}
#divisionContent .nx-gw001-standings-legend{display:flex;flex-wrap:wrap;gap:10px 15px;margin-top:15px;padding:10px 4px 1px;color:#718097;font-size:6.5px;font-weight:850;text-transform:uppercase}
#divisionContent .nx-gw001-standings-legend span{display:flex;align-items:center;gap:5px}#divisionContent .nx-gw001-standings-legend i{display:block;width:13px;height:4px;border-radius:4px;background:#aeb8cc}#divisionContent .nx-gw001-standings-legend .green{background:#13b94f}#divisionContent .nx-gw001-standings-legend .blue{background:#2f7df4}#divisionContent .nx-gw001-standings-legend .purple{background:#7a35ef}#divisionContent .nx-gw001-standings-legend .red{background:#f12634}
@media(max-width:390px){#divisionContent .nx-gw001-standings-head h2{font-size:27px}#divisionContent .nx-gw001-standing-row{padding:9px 8px 8px 11px}#divisionContent .nx-gw001-standing-main{grid-template-columns:25px 32px minmax(0,1fr) 48px;gap:6px}#divisionContent .nx-gw001-club-logo{width:32px;height:32px}#divisionContent .nx-gw001-team-name{font-size:9px}#divisionContent .nx-gw001-points{min-height:36px}#divisionContent .nx-gw001-points strong{font-size:15px}#divisionContent .nx-gw001-standing-stat strong{font-size:7.4px}}
`;
  document.head.appendChild(s);
}

function world(){
  const nodes=document.querySelectorAll(".nx-competition-cover-copy p,#openDrawerWorld strong,.nx-sport-world strong");
  for(const node of nodes){const t=clean(node.textContent),m=t.match(/GW\d{3}/i);if(m)return m[0].toUpperCase();if(norm(t)==="road to history")return "GW001";}
  return "";
}

function context(){
  if(world()!=="GW001")return null;
  const tab=document.querySelector('[data-div-tab="standings"].active');
  const target=document.getElementById("divisionContent");
  const title=document.querySelector(".nx-competition-cover-copy h1");
  if(!tab||!target||!title)return null;
  const m=clean(title.textContent).match(/Division\s+(\d+)/i);
  if(!m)return null;
  return {target,division:String(Number(m[1])),title:"DIVISION "+Number(m[1])};
}

function zone(pos,total){if(pos===1)return"zone-title";if(pos<=Math.min(4,total))return"zone-blue";if(pos<=Math.min(6,total))return"zone-purple";if(pos>total-2)return"zone-red";return"";}

function build(rows){
  const fix=new Map();
  rows.forEach(r=>{const key=r.sm_fixture_id!=null?String(r.sm_fixture_id):[r.source_page_date,r.home_name,r.away_name].join("|");fix.set(key,r);});
  const table=new Map();
  function ensure(name){const k=norm(name);if(!table.has(k))table.set(k,{team_name:clean(name),played:0,won:0,drawn:0,lost:0,gf:0,ga:0,gd:0,points:0});return table.get(k);}
  for(const r of fix.values()){
    if(r.home_score==null||r.away_score==null||!clean(r.home_name)||!clean(r.away_name))continue;
    const h=ensure(r.home_name),a=ensure(r.away_name),hs=Number(r.home_score),as=Number(r.away_score);
    h.played++;a.played++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;
    if(hs>as){h.won++;a.lost++;h.points+=3;}else if(hs<as){a.won++;h.lost++;a.points+=3;}else{h.drawn++;a.drawn++;h.points++;a.points++;}
  }
  const standings=[...table.values()].map(r=>(r.gd=r.gf-r.ga,r)).sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team_name.localeCompare(b.team_name,"it"));
  return {standings,matchday:standings.reduce((m,r)=>Math.max(m,r.played),0)};
}

async function logos(names){
  const db=client(),map=new Map();
  if(!db||!names.length)return map;
  try{
    const r=await db.from("club_codex_global").select("n,i").in("n",names);
    if(r.error)return map;
    (r.data||[]).forEach(x=>map.set(norm(x.n),clean(x.i)));
  }catch(_){ }
  return map;
}

function logo(name,file){
  if(!file)return '<span class="nx-gw001-club-fallback">'+esc(initials(name))+'</span>';
  return '<img src="assets/clubs/'+esc(file)+'" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span class="nx-gw001-club-fallback" style="display:none">'+esc(initials(name))+'</span>';
}

function stat(label,value){return '<div class="nx-gw001-standing-stat"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>';}

function render(ctx,data,logoMap){
  const rows=data.standings||[];
  if(!rows.length){ctx.target.innerHTML='<div class="nx-empty-box"><strong>Classifica non disponibile</strong><span>Nessun risultato League importato.</span></div>';return;}
  ctx.target.innerHTML='<section class="nx-gw001-standings-v12"><header class="nx-gw001-standings-head"><div><h2>'+esc(ctx.title)+'</h2><p>League Standings</p></div><span class="nx-gw001-matchday-pill">Matchday '+esc(data.matchday)+'</span></header><div class="nx-gw001-standing-list">'+rows.map((r,i)=>'<article class="nx-gw001-standing-row '+zone(i+1,rows.length)+'"><div class="nx-gw001-standing-main"><span class="nx-gw001-pos">'+(i+1)+'</span><span class="nx-gw001-club-logo">'+logo(r.team_name,logoMap.get(norm(r.team_name))||"")+'</span><strong class="nx-gw001-team-name">'+esc(r.team_name)+'</strong><span class="nx-gw001-points"><strong>'+r.points+'</strong><small>PTS</small></span></div><div class="nx-gw001-standing-stats">'+stat("PG",r.played)+stat("V",r.won)+stat("N",r.drawn)+stat("P",r.lost)+stat("GF",r.gf)+stat("GS",r.ga)+stat("DR",signed(r.gd))+'</div></article>').join('')+'</div><footer class="nx-gw001-standings-legend"><span><i class="green"></i>Title zone</span><span><i class="blue"></i>Champions League</span><span><i class="purple"></i>Europa League</span><span><i class="red"></i>Relegation zone</span></footer></section>';
}

async function apply(force){
  const ctx=context();
  if(!ctx||loading)return;
  if(!force&&ctx.target.querySelector('.nx-gw001-standings-v12'))return;
  const db=client();if(!db)return;
  loading=true;
  ctx.target.innerHTML='<div class="nx-loading">Caricamento classifica…</div>';
  try{
    const r=await db.from("gw001_results")
      .select("raw_match_id,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,sm_action,sm_division")
      .eq("sm_action","league")
      .eq("sm_division",ctx.division)
      .order("source_page_date",{ascending:true})
      .order("raw_match_id",{ascending:true})
      .range(0,999);
    if(r.error)throw r.error;
    const latest=context();if(!latest||latest.target!==ctx.target||latest.division!==ctx.division)return;
    const data=build(r.data||[]);
    const lm=await logos(data.standings.map(x=>x.team_name));
    render(ctx,data,lm);
  }catch(e){
    console.error("GW001 standings",e);
    if(ctx.target)ctx.target.innerHTML='<div class="nx-empty-box"><strong>Errore classifica</strong><span>'+esc(e&&e.message?e.message:"Impossibile leggere i risultati GW001.")+'</span></div>';
  }finally{loading=false;}
}

function schedule(force){clearTimeout(timer);timer=setTimeout(()=>apply(!!force),40);}
function start(){installCss();schedule(true);const app=document.getElementById("app")||document.documentElement;new MutationObserver(()=>schedule(false)).observe(app,{childList:true,subtree:true});document.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest('[data-div-tab="standings"]'))schedule(true);},true);window.addEventListener("pageshow",()=>schedule(true));}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.IMC_GW001_STANDINGS={version:VERSION,refresh:()=>apply(true)};
})();
