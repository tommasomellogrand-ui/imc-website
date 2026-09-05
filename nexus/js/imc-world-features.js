(function(){
"use strict";

const V="1.5-build54-transfer-detail";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const OID="imcWorldTransfers54";
const DETAIL_ID="imcTransferDetail54";
const CODEX_BLOCKED_WORLDS=new Set(["GW002","GW003","GW008","GW010"]);
const WORLD_BY_NAME={
  "road to history":"GW001",
  "gold 558":"GW002",
  "gold 557":"GW003",
  "world league":"GW004",
  "hall of famers":"GW005",
  "master league world":"GW006",
  "the four kingdoms":"GW007",
  "gold 1":"GW008",
  "kick off":"GW009",
  "sensible soccer academy":"GW010"
};

if(!window.supabase)return;
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){ }
const db=window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY);
const cache={enabled:null,names:{},transfers:new Map(),images:new Map(),worldInfo:new Map(),clubVisuals:new Map()};
const ui={world:null,name:null,rows:[],q:"",limit:80,teamFilter:"all",seasonFilter:"",seasons:[]};

const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const validWorld=id=>/^GW(?:00[1-9]|010)$/.test(String(id||""));
const tableForWorld=id=>String(id||"").toLowerCase()+"_gw_transfers";
const codexTableForWorld=id=>String(id||"").toLowerCase()+"_player_codex";
const initials=name=>String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0)||"").join("").toUpperCase();
const imageUrl=value=>{const v=String(value||"").trim();return v.startsWith("//")?"https:"+v:v;};
const isFreeAgent=name=>norm(name)==="svincolato";

function css(){
  if(document.getElementById("imcWorld54Css"))return;
  const s=document.createElement("style");
  s.id="imcWorld54Css";
  s.textContent=`
.nx-bottom.nx-bottom-b6 [data-page="transfers"]{display:none!important}
.nx-world-nav.nx-world-nav-b6{gap:5px!important;padding:6px!important}.nx-world-nav.nx-world-nav-b6 button{min-height:52px!important;padding:6px 4px!important;gap:3px!important;border-radius:12px!important}.nx-world-nav.nx-world-nav-b6 button b{display:flex!important;align-items:center!important;justify-content:center!important;width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;margin:0 auto!important;font-size:14px!important}.nx-world-nav.nx-world-nav-b6 button b svg{width:15px!important;height:15px!important}.nx-world-nav.nx-world-nav-b6 button span{font-size:7px!important;line-height:1!important;white-space:nowrap!important}.nx-bottom.nx-bottom-b6 button{min-width:0!important;padding:6px 2px!important;gap:2px!important}.nx-bottom.nx-bottom-b6 button b{display:flex!important;align-items:center!important;justify-content:center!important;min-height:19px!important;font-size:14px!important}.nx-bottom.nx-bottom-b6 button b svg{width:16px!important;height:16px!important}.nx-bottom.nx-bottom-b6 button span{font-size:6.5px!important;line-height:1!important;white-space:nowrap!important}
#${OID}{position:fixed;inset:0;z-index:2147483100;overflow:auto;background:#fff;color:#101217;font-family:inherit}#${OID} *{box-sizing:border-box}
.t54top{position:sticky;top:0;z-index:10;display:grid;grid-template-columns:42px minmax(0,1fr) 42px;gap:8px;align-items:center;padding:10px 12px;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);border-bottom:1px solid #eceff3}.t54top button{width:40px;height:40px;border:1px solid #e2e5e9;border-radius:12px;background:#fff;color:#20242b;font:inherit;font-size:19px;font-weight:900}.t54title{text-align:center;min-width:0}.t54title small{display:block;color:#16883c;font-size:8px;font-weight:950;letter-spacing:.07em}.t54title strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:950}
.t54main{max-width:720px;margin:auto;padding:14px 14px 34px}
.t54market-hero{position:relative;min-height:112px;margin:0 0 12px;overflow:hidden;border-radius:19px;background:#071a36 url("assets/transfers-hero-world.svg") center/cover no-repeat;box-shadow:0 8px 25px rgba(7,26,54,.15)}.t54market-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,15,32,.88) 0%,rgba(3,15,32,.58) 43%,rgba(3,15,32,.08) 78%)}.t54hero-brand{position:relative;z-index:2;display:flex;align-items:center;gap:11px;min-height:112px;padding:15px 17px;color:#fff}.t54hero-brand img{width:45px;height:45px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(0,0,0,.28))}.t54hero-copy{min-width:0}.t54hero-copy span{display:inline-block;margin-bottom:4px;padding:3px 7px;border:1px solid rgba(87,229,132,.65);border-radius:999px;color:#62e893;font-size:8px;font-weight:1000;letter-spacing:.08em}.t54hero-copy strong{display:block;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:19px;line-height:1.02;font-weight:1000;letter-spacing:-.025em}.t54hero-copy small{display:block;margin-top:4px;color:#c9d7e8;font-size:8px;font-weight:850;letter-spacing:.08em}
.t54search{width:100%;height:46px;padding:0 15px;border:1px solid #e6e8eb;border-radius:14px;background:#f6f7f8;color:#11151b;font:inherit;font-size:15px;font-weight:750;outline:none}.t54search:focus{border-color:#9fd2ae;background:#fff;box-shadow:0 0 0 3px rgba(26,145,66,.08)}
.t54kpis{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:10px 0}.t54kpi{min-height:64px;padding:10px 13px;border:1px solid #e5e7ea;border-radius:15px;background:#fff;box-shadow:0 3px 12px rgba(16,24,40,.025)}.t54kpi small{display:block;color:#858a93;font-size:7px;font-weight:950;letter-spacing:.05em;text-transform:uppercase}.t54kpi strong{display:block;margin-top:5px;color:#15191f;font-size:18px;line-height:1;font-weight:1000}.t54kpi:first-child strong{color:#16883c}
.t54filters{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 10px}.t54filter{display:block;min-width:0;padding:8px 10px;border:1px solid #e1e5e9;border-radius:14px;background:#fff}.t54filter span{display:block;margin-bottom:5px;color:#858a93;font-size:7px;font-weight:1000;letter-spacing:.05em;text-transform:uppercase}.t54filter select{width:100%;min-width:0;height:29px;padding:0 24px 0 0;border:0;background:transparent;color:#161b22;font:inherit;font-size:10px;font-weight:950;outline:none}
.t54last{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;min-height:118px;padding:13px;border:1px solid #dce4df;border-left:3px solid #179343;border-radius:17px;background:linear-gradient(110deg,#f7fbf8 0%,#fff 62%);box-shadow:0 7px 22px rgba(16,24,40,.055);font:inherit;color:inherit;text-align:left;cursor:pointer}.t54last:active,.t54rowbtn:active{transform:scale(.997)}.t54avatar{position:relative;width:60px;height:84px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:13px;background:linear-gradient(150deg,#0d6930,#168f46);color:#fff;font-size:21px;font-weight:1000;letter-spacing:-.04em}.t54avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.t54lastcopy{min-width:0}.t54tag{display:block;color:#16883c;font-size:7.5px;font-weight:1000;letter-spacing:.08em}.t54lastcopy h2{margin:5px 0 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:20px;line-height:1;font-weight:1000;letter-spacing:-.035em}.t54route{display:flex;align-items:center;gap:6px;min-width:0;color:#30363d;font-size:8.5px;font-weight:850}.t54club-inline{display:flex;align-items:center;gap:4px;min-width:0}.t54club-inline em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:normal}.t54route>b{flex:0 0 auto;color:#199545;font-size:16px;line-height:1}.t54clublogo{width:19px;height:19px;flex:0 0 19px;object-fit:contain}.t54amount{text-align:right;white-space:nowrap}.t54amount strong{display:block;color:#b67a00;font-size:22px;line-height:1;font-weight:1000}.t54amount small{display:block;margin-top:5px;color:#91969e;font-size:7px;font-weight:900}.t54lastdate{display:block;margin-top:7px;color:#8a9098;font-size:7.5px;font-weight:850}
.t54section{display:flex;align-items:center;justify-content:space-between;margin:17px 0 8px}.t54section strong{font-size:12px;font-weight:1000;letter-spacing:.01em}.t54section span{color:#8b9098;font-size:8px;font-weight:900}.t54list{border:1px solid #e6e8eb;border-radius:17px;background:#fff;overflow:hidden}.t54row{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;min-height:74px;padding:10px 12px;border:0;border-top:1px solid #eceef0;background:#fff;color:inherit;font:inherit;text-align:left}.t54row:first-child{border-top:0}.t54rowbtn{cursor:pointer}.t54mini{position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%;background:#f0f2f4;color:#4d5662;font-size:11px;font-weight:1000}.t54mini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.t54copy{min-width:0}.t54copy h3{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.05;font-weight:1000}.t54copy p{display:flex;align-items:center;gap:5px;min-width:0;margin:6px 0 0;color:#555d67;font-size:8px;font-weight:800}.t54copy p .t54clublogo{width:16px;height:16px;flex-basis:16px}.t54copy p b{flex:0 0 auto;color:#199545;font-size:14px}.t54side{text-align:right;white-space:nowrap}.t54side strong{display:block;color:#16883c;font-size:15px;line-height:1;font-weight:1000}.t54side time{display:block;margin-top:5px;color:#989da4;font-size:7px;font-weight:850}.t54empty{padding:24px 14px;color:#7d838c;text-align:center;font-size:10px;font-weight:800}.t54more{width:100%;min-height:44px;margin-top:10px;border:1px solid #dfe3e7;border-radius:13px;background:#fff;color:#16883c;font:inherit;font-size:9px;font-weight:1000}.t54more[hidden]{display:none}
#${DETAIL_ID}{position:fixed;inset:0;z-index:2147483200;overflow:auto;background:#f5f7f9;color:#101217}#${DETAIL_ID} *{box-sizing:border-box}.t54detailtop{position:sticky;top:0;z-index:4;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #e7eaee;background:rgba(255,255,255,.97);backdrop-filter:blur(15px)}.t54detailtop button{width:40px;height:40px;border:1px solid #e1e5e9;border-radius:12px;background:#fff;color:#161b22;font:inherit;font-size:19px;font-weight:950}.t54detailtitle{text-align:center}.t54detailtitle small{display:block;color:#16883c;font-size:8px;font-weight:950}.t54detailtitle strong{display:block;margin-top:2px;font-size:13px;font-weight:1000}.t54detailmain{max-width:720px;margin:auto;padding:14px 13px 32px}.t54detailhero{display:grid;grid-template-columns:98px minmax(0,1fr);gap:16px;align-items:center;padding:16px;border-radius:20px;background:linear-gradient(135deg,#071a36,#0b3566 65%,#087444);color:#fff;box-shadow:0 9px 28px rgba(7,26,54,.18)}.t54detailpic{position:relative;width:98px;height:126px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:16px;background:rgba(255,255,255,.12);color:#fff;font-size:27px;font-weight:1000}.t54detailpic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.t54detailhero small{display:block;color:#76eca0;font-size:8px;font-weight:1000;letter-spacing:.08em}.t54detailhero h1{margin:6px 0 9px;font-size:25px;line-height:1;font-weight:1000;letter-spacing:-.04em}.t54detailfee{display:inline-block;padding:7px 10px;border-radius:10px;background:#fff;color:#956600;font-size:19px;line-height:1;font-weight:1000}.t54detaildate{display:block;margin-top:8px;color:#d8e3ef;font-size:9px;font-weight:850}.t54deal{display:grid;grid-template-columns:1fr 42px 1fr;gap:8px;align-items:center;margin:11px 0;padding:15px 10px;border:1px solid #e1e5e9;border-radius:18px;background:#fff}.t54dealclub{text-align:center;min-width:0}.t54deallogo{width:64px;height:64px;display:block;margin:0 auto 8px;object-fit:contain}.t54deallogo-empty{display:flex;align-items:center;justify-content:center;margin:0 auto 8px;border-radius:50%;background:#f0f2f4;color:#8a9098;font-size:20px}.t54dealclub strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:1000}.t54dealarrow{text-align:center;color:#16883c;font-size:28px;font-weight:1000}.t54data{padding:14px;border:1px solid #e1e5e9;border-radius:18px;background:#fff}.t54data h2{margin:0 0 11px;font-size:13px;font-weight:1000}.t54datagrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.t54dataitem{min-width:0;padding:10px;border-radius:12px;background:#f6f8fa}.t54dataitem span{display:block;color:#858b94;font-size:7px;font-weight:1000;letter-spacing:.04em;text-transform:uppercase}.t54dataitem strong{display:block;margin-top:5px;overflow-wrap:anywhere;color:#171b21;font-size:10px;line-height:1.35;font-weight:900}.t54dataitem.wide{grid-column:1/-1}
@media(max-width:520px){.nx-world-nav.nx-world-nav-b6 button span{font-size:6.5px!important}.nx-bottom.nx-bottom-b6 button span{font-size:6px!important}.t54main{padding:12px 11px 28px}.t54market-hero,.t54hero-brand{min-height:102px}.t54hero-brand{padding:13px 14px}.t54hero-brand img{width:40px;height:40px}.t54hero-copy strong{font-size:17px}.t54filters{gap:7px}.t54filter{padding:7px 8px}.t54last{grid-template-columns:56px minmax(0,1fr) auto;gap:9px;min-height:108px;padding:11px}.t54avatar{width:54px;height:76px;font-size:18px}.t54lastcopy h2{font-size:17px}.t54amount strong{font-size:19px}.t54route{font-size:7.5px}.t54clublogo{width:17px;height:17px;flex-basis:17px}.t54row{grid-template-columns:38px minmax(0,1fr) auto;gap:9px;min-height:70px;padding:9px 10px}.t54mini{width:38px;height:38px}.t54copy h3{font-size:11px}.t54copy p{font-size:7.4px}.t54side strong{font-size:14px}.t54detailhero{grid-template-columns:84px minmax(0,1fr);gap:12px;padding:13px}.t54detailpic{width:84px;height:110px}.t54detailhero h1{font-size:21px}.t54detailfee{font-size:17px}.t54deallogo{width:54px;height:54px}.t54datagrid{grid-template-columns:1fr}}
`;
  document.head.appendChild(s);
}

async function enabled(force){
  if(cache.enabled&&!force)return cache.enabled;
  const [w,e]=await Promise.all([
    db.from("imc_game_worlds").select("game_world_id,name,owner"),
    db.from("imc_player_codex_world_exceptions").select("game_world_id")
  ]);
  if(w.error)throw w.error;
  const ex=new Set(e.error?["GW004","GW007"]:(e.data||[]).map(x=>String(x.game_world_id||"")));
  const set=new Set();
  (w.data||[]).forEach(x=>{
    const id=String(x.game_world_id||"");
    cache.names[id]=x.name||id;
    if(!CODEX_BLOCKED_WORLDS.has(id)&&(x.owner==="Manager"||ex.has(id)))set.add(id);
  });
  cache.enabled=set;
  return set;
}

function world(){
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=guard.currentWorld();
    if(id)return id;
  }
  const header=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong");
  const headerName=norm(header&&header.textContent);
  if(headerName&&WORLD_BY_NAME[headerName])return WORLD_BY_NAME[headerName];
  for(const sel of ["[data-world-id].active","[data-game-world-id].active","[data-world].active","[data-select-world].active"]){
    const e=document.querySelector(sel);
    if(e){
      const v=e.getAttribute("data-world-id")||e.getAttribute("data-game-world-id")||e.getAttribute("data-world")||e.getAttribute("data-select-world")||"";
      if(validWorld(v))return v;
    }
  }
  const n=document.querySelector(".nx-world-nav");
  if(!n)return null;
  let x=n;
  for(let i=0;i<6&&x;i++,x=x.parentElement){
    const m=String(x.textContent||"").match(/\bGW\d{3}\b/);
    if(m&&validWorld(m[0]))return m[0];
  }
  return null;
}

function openCodex(id){
  if(CODEX_BLOCKED_WORLDS.has(id))return;
  const a=window.IMC_PLAYER_CODEX_BUILD53||window.IMC_PLAYER_CODEX_BUILD52;
  if(a&&typeof a.openWorld==="function")a.openWorld(id);
}

async function menus(){
  const id=world();
  const top=document.querySelector(".nx-world-nav");
  const bot=document.querySelector(".nx-bottom.nx-bottom-b6");
  if(!id||(!top&&!bot))return;
  let set=new Set();
  try{set=await enabled(false);}catch(_){ }
  const codexOn=!CODEX_BLOCKED_WORLDS.has(id)&&set.has(id);
  if(top){
    let b=top.querySelector("[data-imc-codex-world]");
    const native=top.querySelector('[data-world-section="player-codex"]');
    if(codexOn&&!native&&!b){b=document.createElement("button");b.type="button";b.dataset.imcCodexWorld=id;b.innerHTML='<b>▣</b><span>PLAYER CODEX</span>';top.insertBefore(b,top.firstChild);}
    if(b){b.dataset.imcCodexWorld=id;b.onclick=e=>{e.preventDefault();e.stopPropagation();openCodex(id);};}
    if(!codexOn&&b)b.remove();
  }
  if(bot){
    bot.querySelectorAll('[data-page="transfers"]').forEach(x=>x.remove());
    let b=bot.querySelector("[data-imc-transfers-world]");
    if(validWorld(id)){
      if(!b){b=document.createElement("button");b.type="button";b.innerHTML='<b>⇄</b><span>TRANSFERS</span>';const stats=bot.querySelector('[data-page="stats"]');const h2h=bot.querySelector('[data-page="h2h"]');if(stats)stats.insertAdjacentElement("afterend",b);else if(h2h)h2h.insertAdjacentElement("beforebegin",b);else bot.appendChild(b);}
      b.dataset.imcTransfersWorld=id;b.onclick=e=>{e.preventDefault();e.stopPropagation();openTransfers(id);};
    }else if(b)b.remove();
    bot.style.setProperty("grid-template-columns","repeat("+bot.querySelectorAll(":scope > button").length+",minmax(0,1fr))","important");
  }
}

async function getTransfers(id,force){
  if(cache.transfers.has(id)&&!force)return cache.transfers.get(id);
  const rows=[];let from=0;
  while(true){const r=await db.from(tableForWorld(id)).select("transfer_id,player_id,player_name,from_sm_world_club_id,club_from,to_sm_world_club_id,club_to,amount_text,transfer_date_text,imported_at").order("transfer_id",{ascending:false}).range(from,from+999);if(r.error)throw r.error;const page=r.data||[];rows.push(...page);if(page.length<1000)break;from+=1000;}
  cache.transfers.set(id,rows);return rows;
}

async function getPlayerImages(id,force){
  if(cache.images.has(id)&&!force)return cache.images.get(id);
  const map=new Map();let from=0;
  while(true){const r=await db.from(codexTableForWorld(id)).select("player_id,image_url").order("player_id",{ascending:true}).range(from,from+999);if(r.error)throw r.error;const page=r.data||[];page.forEach(x=>{const playerId=String(x.player_id==null?"":x.player_id);if(playerId&&x.image_url)map.set(playerId,imageUrl(x.image_url));});if(page.length<1000)break;from+=1000;}
  cache.images.set(id,map);return map;
}

async function getWorldInfo(id,force){
  if(cache.worldInfo.has(id)&&!force)return cache.worldInfo.get(id);
  const r=await db.from("imc_game_worlds").select("game_world_id,imc_name,name,imc_season").eq("game_world_id",id);
  if(r.error)throw r.error;
  const rows=r.data||[];
  const seasons=[...new Set(rows.map(x=>x.imc_season).filter(x=>x!==null&&x!==undefined&&x!=="").map(Number))].sort((a,b)=>a-b);
  const named=rows.find(x=>String(x.imc_name||x.name||"").trim())||rows[0]||{};
  const info={name:String(named.imc_name||named.name||cache.names[id]||id),seasons};
  cache.worldInfo.set(id,info);cache.names[id]=info.name;return info;
}

async function getClubVisuals(id,transfers,force){
  if(cache.clubVisuals.has(id)&&!force)return cache.clubVisuals.get(id);
  const worldClubIds=[...new Set((transfers||[]).flatMap(x=>[x.from_sm_world_club_id,x.to_sm_world_club_id]).filter(x=>x!==null&&x!==undefined&&x!=="").map(String))];
  const teamRows=[];
  for(let i=0;i<worldClubIds.length;i+=150){const chunk=worldClubIds.slice(i,i+150);const r=await db.from("gw_teams").select("sm_world_club_id,sm_club_id,team_name,display_name").eq("game_world_id",id).in("sm_world_club_id",chunk);if(r.error)throw r.error;teamRows.push(...(r.data||[]));}
  const smClubIds=[...new Set(teamRows.map(x=>x.sm_club_id).filter(x=>x!==null&&x!==undefined&&x!=="").map(String))];
  const masters=[];
  for(let i=0;i<smClubIds.length;i+=150){const chunk=smClubIds.slice(i,i+150);const r=await db.from("sm_clubs_master").select("sm_club_id,club_name,alias,image_filename,image_url").in("sm_club_id",chunk);if(r.error)throw r.error;masters.push(...(r.data||[]));}
  const masterMap=new Map();masters.forEach(x=>masterMap.set(String(x.sm_club_id),x));
  const map=new Map();teamRows.forEach(team=>{const master=masterMap.get(String(team.sm_club_id))||{};let logo=imageUrl(master.image_url);if(!logo&&master.image_filename)logo="assets/clubs/"+String(master.image_filename).replace(/^\/+/,"");map.set(String(team.sm_world_club_id),{logo_url:logo,name:String(team.display_name||team.team_name||master.alias||master.club_name||"")});});
  cache.clubVisuals.set(id,map);return map;
}

function filteredByTeam(){if(ui.teamFilter==="all")return ui.rows.slice();return ui.rows.filter(x=>x.club_from===ui.teamFilter||x.club_to===ui.teamFilter);}
function listRows(){const q=norm(ui.q);let rows=filteredByTeam().slice(1);if(q)rows=rows.filter(x=>norm([x.player_name,x.player_id,x.club_from,x.club_to,x.amount_text,x.transfer_date_text].join(" ")).includes(q));return rows;}
function formatImported(value){if(!value)return "—";const d=new Date(value);if(Number.isNaN(d.getTime()))return "—";return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}).replace(".","").toUpperCase();}
function playerMedia(x,className){const src=imageUrl(x&&x.image_url);return `<div class="${className}">${esc(initials(x&&x.player_name))}${src?`<img src="${esc(src)}" alt="${esc((x&&x.player_name)||"")}" loading="lazy" onerror="this.remove()">`:""}</div>`;}
function clubLogo(name,url,className){if(!url||isFreeAgent(name))return "";return `<img class="${className||"t54clublogo"}" src="${esc(imageUrl(url))}" alt="${esc(name||"Club")}" loading="lazy" onerror="this.remove()">`;}
function clubInline(name,url){return `<span class="t54club-inline">${clubLogo(name,url,"t54clublogo")}<em>${esc(name||"—")}</em></span>`;}
function lastTransferMarkup(x){if(!x)return '<div class="t54empty">Nessun trasferimento disponibile.</div>';return `<button type="button" class="t54last" data-transfer-id="${esc(x.transfer_id)}">${playerMedia(x,"t54avatar")}<div class="t54lastcopy"><span class="t54tag">LAST TRANSFER</span><h2>${esc(x.player_name||("Player "+x.player_id))}</h2><div class="t54route">${clubInline(x.club_from,x.from_logo_url)}<b>››</b>${clubInline(x.club_to,x.to_logo_url)}</div><time class="t54lastdate">${esc(x.transfer_date_text||"")}</time></div><div class="t54amount"><strong>${esc(x.amount_text||"—")}</strong><small>FEE</small></div></button>`;}
function rowMarkup(x){return `<button type="button" class="t54row t54rowbtn" data-transfer-id="${esc(x.transfer_id)}">${playerMedia(x,"t54mini")}<div class="t54copy"><h3>${esc(x.player_name||("Player "+x.player_id))}</h3><p>${clubInline(x.club_from,x.from_logo_url)}<b>››</b>${clubInline(x.club_to,x.to_logo_url)}</p></div><div class="t54side"><strong>${esc(x.amount_text||"—")}</strong><time>${esc(x.transfer_date_text||"")}</time></div></button>`;}
function detailClub(name,url){const logo=url&&!isFreeAgent(name)?`<img class="t54deallogo" src="${esc(imageUrl(url))}" alt="${esc(name||"Club")}" onerror="this.outerHTML='<span class=&quot;t54deallogo t54deallogo-empty&quot;>•</span>'">`:`<span class="t54deallogo t54deallogo-empty">•</span>`;return `<div class="t54dealclub">${logo}<strong>${esc(name||"—")}</strong></div>`;}
function dataItem(label,value,wide){return `<div class="t54dataitem${wide?" wide":""}"><span>${esc(label)}</span><strong>${esc(value===null||value===undefined||value===""?"—":value)}</strong></div>`;}

function openTransferDetail(transferId){
  const x=ui.rows.find(row=>String(row.transfer_id)===String(transferId));if(!x)return;
  document.getElementById(DETAIL_ID)?.remove();const d=document.createElement("div");d.id=DETAIL_ID;
  d.innerHTML=`<header class="t54detailtop"><button id="t54detailback" type="button">‹</button><div class="t54detailtitle"><small>${esc(ui.world)}</small><strong>Transfer Detail</strong></div><span></span></header><main class="t54detailmain"><section class="t54detailhero">${playerMedia(x,"t54detailpic")}<div><small>TRANSFER #${esc(x.transfer_id)}</small><h1>${esc(x.player_name||("Player "+x.player_id))}</h1><span class="t54detailfee">${esc(x.amount_text||"—")}</span><time class="t54detaildate">${esc(x.transfer_date_text||"")}</time></div></section><section class="t54deal">${detailClub(x.club_from,x.from_logo_url)}<div class="t54dealarrow">››</div>${detailClub(x.club_to,x.to_logo_url)}</section><section class="t54data"><h2>DATI IMPORTATI</h2><div class="t54datagrid">${dataItem("transfer_id",x.transfer_id)}${dataItem("player_id",x.player_id)}${dataItem("player_name",x.player_name,true)}${dataItem("from_sm_world_club_id",x.from_sm_world_club_id)}${dataItem("club_from",x.club_from)}${dataItem("to_sm_world_club_id",x.to_sm_world_club_id)}${dataItem("club_to",x.club_to)}${dataItem("amount_text",x.amount_text)}${dataItem("transfer_date_text",x.transfer_date_text)}${dataItem("imported_at",x.imported_at,true)}</div></section></main>`;
  document.body.appendChild(d);document.getElementById("t54detailback").onclick=()=>d.remove();
}

function renderTeamOptions(){const select=document.getElementById("t54team");if(!select)return;const names=[...new Set(ui.rows.flatMap(x=>[x.club_from,x.club_to]).filter(x=>x&&!isFreeAgent(x)))].sort((a,b)=>a.localeCompare(b,"it"));select.innerHTML='<option value="all">Tutte le squadre</option>'+names.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join("");select.value=names.includes(ui.teamFilter)?ui.teamFilter:"all";}
function renderSeasonOptions(){const select=document.getElementById("t54season");if(!select)return;if(!ui.seasons.length){select.innerHTML='<option value="">IMC Season n/d</option>';select.disabled=true;ui.seasonFilter="";return;}select.disabled=ui.seasons.length===1;select.innerHTML=ui.seasons.map(n=>`<option value="${esc(n)}">IMC Season ${esc(n)}</option>`).join("");if(!ui.seasonFilter||!ui.seasons.map(String).includes(String(ui.seasonFilter)))ui.seasonFilter=String(ui.seasons[ui.seasons.length-1]);select.value=ui.seasonFilter;}
function render(){const h=document.getElementById("t54list"),status=document.getElementById("t54status"),more=document.getElementById("t54more"),last=document.getElementById("t54last");if(!h)return;const teamRows=filteredByTeam();if(last)last.innerHTML=lastTransferMarkup(teamRows[0]||null);const all=listRows(),visible=all.slice(0,ui.limit);h.innerHTML=visible.map(rowMarkup).join("")||`<div class="t54empty">${ui.rows.length?"Nessun trasferimento corrisponde ai filtri.":"Nessun trasferimento importato per "+esc(ui.world)+"."}</div>`;if(status)status.textContent=teamRows.length.toLocaleString("it-IT")+" movimenti";if(more){more.hidden=visible.length>=all.length;more.textContent="CARICA ALTRI";}}

async function load(force){
  const h=document.getElementById("t54list");if(h)h.innerHTML='<div class="t54empty">Caricamento trasferimenti…</div>';
  try{
    const transfers=await getTransfers(ui.world,force);
    const results=await Promise.all([getPlayerImages(ui.world,force),getWorldInfo(ui.world,force),getClubVisuals(ui.world,transfers,force)]);
    const images=results[0],worldInfo=results[1],clubVisuals=results[2];
    ui.name=worldInfo.name||ui.name||ui.world;ui.seasons=worldInfo.seasons||[];
    ui.rows=transfers.map(x=>{const fromVisual=clubVisuals.get(String(x.from_sm_world_club_id))||{},toVisual=clubVisuals.get(String(x.to_sm_world_club_id))||{};return Object.assign({},x,{image_url:images.get(String(x.player_id))||"",from_logo_url:fromVisual.logo_url||"",to_logo_url:toVisual.logo_url||""});});
    ui.q="";ui.limit=80;if(force)ui.teamFilter="all";
    const total=document.getElementById("t54count"),updated=document.getElementById("t54updated"),heroWorld=document.getElementById("t54heroWorld"),heroName=document.getElementById("t54heroName"),topName=document.getElementById("t54topName");
    if(total)total.textContent=ui.rows.length.toLocaleString("it-IT");if(updated)updated.textContent=ui.rows.length?formatImported(ui.rows[0].imported_at):"—";if(heroWorld)heroWorld.textContent=ui.world;if(heroName)heroName.textContent=ui.name;if(topName)topName.textContent="Transfers · "+ui.name;
    renderTeamOptions();renderSeasonOptions();render();
  }catch(e){if(h)h.innerHTML='<div class="t54empty">Impossibile caricare i trasferimenti.</div>';console.error("IMC repository transfers Build54",e);}
}

async function openTransfers(id){
  if(!validWorld(id))return;try{await enabled(false);}catch(_){ }
  document.getElementById(OID)?.remove();document.getElementById(DETAIL_ID)?.remove();
  ui.world=id;ui.name=cache.names[id]||id;ui.rows=[];ui.q="";ui.limit=80;ui.teamFilter="all";ui.seasonFilter="";ui.seasons=[];
  const o=document.createElement("div");o.id=OID;
  o.innerHTML=`<header class="t54top"><button id="t54back" type="button">‹</button><div class="t54title"><small>${esc(id)}</small><strong id="t54topName">Transfers · ${esc(ui.name)}</strong></div><button id="t54refresh" type="button">↻</button></header><main class="t54main"><section class="t54market-hero"><div class="t54hero-brand"><img src="assets/imc-logo.png" alt="IMC"><div class="t54hero-copy"><span id="t54heroWorld">${esc(id)}</span><strong id="t54heroName">${esc(ui.name)}</strong><small>GLOBAL TRANSFER MARKET</small></div></div></section><input class="t54search" id="t54search" type="search" placeholder="Cerca giocatore o club…" autocomplete="off"><section class="t54kpis"><div class="t54kpi"><small>Movimenti</small><strong id="t54count">…</strong></div><div class="t54kpi"><small>Ultimo aggiornamento</small><strong id="t54updated">…</strong></div></section><section class="t54filters"><label class="t54filter"><span>Filtra squadre</span><select id="t54team"><option value="all">Tutte le squadre</option></select></label><label class="t54filter"><span>Filtra stagione</span><select id="t54season"><option value="">IMC Season</option></select></label></section><div id="t54last">${lastTransferMarkup(null)}</div><div class="t54section"><strong>ULTIMI TRASFERIMENTI</strong><span id="t54status">Caricamento…</span></div><section class="t54list" id="t54list"><div class="t54empty">Caricamento trasferimenti…</div></section><button class="t54more" id="t54more" type="button" hidden>CARICA ALTRI</button></main>`;
  document.body.appendChild(o);document.body.style.overflow="hidden";
  document.getElementById("t54back").onclick=()=>{document.getElementById(DETAIL_ID)?.remove();o.remove();document.body.style.overflow="";};document.getElementById("t54refresh").onclick=()=>load(true);document.getElementById("t54search").oninput=e=>{ui.q=e.target.value||"";ui.limit=80;render();};document.getElementById("t54team").onchange=e=>{ui.teamFilter=e.target.value||"all";ui.limit=80;render();};document.getElementById("t54season").onchange=e=>{ui.seasonFilter=e.target.value||"";};document.getElementById("t54more").onclick=()=>{ui.limit+=80;render();};
  o.addEventListener("click",e=>{const target=e.target.closest("[data-transfer-id]");if(target&&!target.closest("#"+DETAIL_ID))openTransferDetail(target.getAttribute("data-transfer-id"));});
  load(false);
}

let busy=false,t=null;async function scan(){css();if(busy)return;busy=true;try{await menus();}finally{busy=false;}}new MutationObserver(()=>{clearTimeout(t);t=setTimeout(scan,80);}).observe(document.documentElement,{childList:true,subtree:true});scan();
window.IMC_WORLD_FEATURES_BUILD53={version:V,openTransfers,refresh:()=>{cache.enabled=null;cache.transfers.clear();cache.images.clear();cache.worldInfo.clear();cache.clubVisuals.clear();return scan();}};
window.IMC_WORLD_FEATURES_BUILD54=window.IMC_WORLD_FEATURES_BUILD53;
})();