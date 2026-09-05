(function(){
"use strict";

const V="1.0.1-build56";
const URL="https://toanuzojdkfjgucztpze.supabase.co";
const KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
const OID="imcTransfers";
const DID="imcTransferDetail";

if(!window.supabase)return;
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const db=window.supabase.createClient(cfg&&cfg.url?cfg.url:URL,cfg&&cfg.key?cfg.key:KEY);

const cache={rows:new Map(),profiles:new Map(),teams:new Map(),logos:new Map()};
const ui={world:"",name:"",rows:[],teams:[],seasons:[],q:"",team:"all",season:"all",limit:80};

const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const valid=id=>/^GW(?:00[1-9]|010)$/.test(String(id||""));
const img=v=>{v=String(v||"").trim();return v.startsWith("//")?"https:"+v:v;};
const chunk=(a,n)=>{const out=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out;};
const transferTable=id=>String(id).toLowerCase()+"_gw_transfers";
const codexTable=id=>String(id).toLowerCase()+"_player_codex";
const teamsTable=id=>String(id).toLowerCase()+"_gw_teams";

function currentWorld(){
  const guard=window.IMC_WORLD_CONTEXT_FIX;
  if(guard&&typeof guard.currentWorld==="function"){
    const id=guard.currentWorld();
    if(valid(id))return id;
  }
  const tagged=document.querySelector("[data-imc-transfers-world]");
  if(tagged&&valid(tagged.getAttribute("data-imc-transfers-world")))return tagged.getAttribute("data-imc-transfers-world");
  const text=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong")?.textContent||"";
  const map={"road to history":"GW001","gold 558":"GW002","gold 557":"GW003","world league":"GW004","hall of famers":"GW005","master league world":"GW006","the four kingdoms":"GW007","gold 1":"GW008","kick off":"GW009","sensible soccer academy":"GW010"};
  return map[norm(text)]||"";
}

function worldName(id){
  const el=document.querySelector("#openDrawerWorld strong,.nx-sport-world strong");
  const text=String(el&&el.textContent||"").trim();
  return text&&!/^GW\d{3}$/i.test(text)?text:id;
}

function css(){
  if(document.getElementById("imcTransfersCss"))return;
  const s=document.createElement("style");
  s.id="imcTransfersCss";
  s.textContent=`
#${OID},#${DID}{position:fixed;inset:0;background:#fff;color:#101217;font-family:inherit;overflow:auto}#${OID}{z-index:2147483300}#${DID}{z-index:2147483400}#${OID} *,#${DID} *{box-sizing:border-box}
.imct-top{position:sticky;top:0;z-index:6;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:8px;padding:10px 12px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid #e9edf0}.imct-top button{width:40px;height:40px;border:1px solid #dfe4e8;border-radius:12px;background:#fff;color:#161b21;font:inherit;font-size:19px;font-weight:950}.imct-title{text-align:center;min-width:0}.imct-title small{display:block;color:#158d43;font-size:8px;font-weight:950}.imct-title strong{display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;font-weight:1000}
.imct-main{max-width:720px;margin:auto;padding:12px 12px 32px}.imct-hero{position:relative;height:160px;border-radius:19px;overflow:hidden;background:#071a36;box-shadow:0 8px 24px rgba(4,20,40,.17)}.imct-hero>img.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.imct-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,16,32,.8),rgba(4,16,32,.38) 60%,rgba(4,16,32,.08))}.imct-brand{position:absolute;z-index:2;top:13px;left:14px;display:flex;align-items:center;gap:8px}.imct-brand img{width:28px;height:28px;object-fit:contain}.imct-brand span{color:#dce7f0;font-size:7px;font-weight:950;letter-spacing:.14em}.imct-world{position:absolute;z-index:2;left:15px;bottom:14px;max-width:72%}.imct-world small{display:block;color:#62df8c;font-size:9px;font-weight:1000;letter-spacing:.1em}.imct-world strong{display:block;margin-top:4px;color:#fff;font-size:22px;line-height:1;font-weight:1000;letter-spacing:-.03em}
.imct-search{width:100%;height:46px;margin-top:11px;padding:0 14px;border:1px solid #e4e8eb;border-radius:13px;background:#f6f7f8;color:#11151b;font:inherit;font-size:15px;font-weight:800;outline:none}.imct-kpis{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0}.imct-kpi{padding:10px 12px;border:1px solid #e4e8eb;border-radius:14px;background:#fff}.imct-kpi small{display:block;color:#888e96;font-size:7px;font-weight:950;text-transform:uppercase}.imct-kpi strong{display:block;margin-top:5px;font-size:17px;font-weight:1000}.imct-kpi:first-child strong{color:#168d43}
.imct-filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 10px}.imct-filter span{display:block;margin:0 0 4px 2px;color:#7f868e;font-size:7px;font-weight:950;text-transform:uppercase}.imct-filter select{width:100%;height:44px;padding:0 9px;border:1px solid #dde3e7;border-radius:12px;background:#fff;color:#1b2027;font:inherit;font-size:9px;font-weight:950}
.imct-last{cursor:pointer;display:grid;grid-template-columns:55px minmax(0,1fr) auto;gap:9px;align-items:center;min-height:108px;padding:10px;border:1px solid #dce4df;border-left:3px solid #188f44;border-radius:16px;background:linear-gradient(110deg,#f7fbf8,#fff 62%);box-shadow:0 6px 20px rgba(16,24,40,.05)}.imct-player{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(145deg,#0e6b35,#168e46);color:#fff;font-weight:1000}.imct-player img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.imct-last .imct-player{width:54px;height:76px;border-radius:12px;font-size:18px}.imct-lastcopy{min-width:0}.imct-tag{display:block;color:#168d43;font-size:7px;font-weight:1000;letter-spacing:.08em}.imct-last h2{margin:4px 0 5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px;line-height:1;font-weight:1000}.imct-fee{text-align:right;white-space:nowrap}.imct-fee strong{display:block;color:#b47700;font-size:19px;font-weight:1000}.imct-fee small{display:block;margin-top:4px;color:#92979e;font-size:7px;font-weight:900}.imct-date{display:block;margin-top:6px;color:#8a9097;font-size:7px;font-weight:850}
.imct-pmeta{display:flex;align-items:center;gap:5px;min-height:18px;margin:0 0 5px;color:#7b828b;font-size:7.5px;font-weight:900}.imct-rating{display:inline-flex;align-items:center;justify-content:center;min-width:27px;height:18px;padding:0 6px;border-radius:999px;color:#fff;font-size:8px;font-weight:1000}.imct-rating.r-red{background:#d63b3b}.imct-rating.r-orange{background:#ef8a17}.imct-rating.r-green{background:#209454}.imct-rating.r-blue{background:#2673d9}.imct-rating.r-purple{background:#7b46c5}.imct-rating.r-neutral{background:#7b828b}
.imct-route{display:flex;align-items:center;gap:5px;min-width:0;color:#525a64;font-size:7.5px;font-weight:850}.imct-route>div{display:flex;align-items:center;gap:4px;min-width:0}.imct-route span.name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.imct-route>b{color:#188f44;font-size:13px}.imct-logo{display:inline-flex;align-items:center;justify-content:center;flex:0 0 19px;width:19px;height:19px;border-radius:50%;overflow:hidden;background:#f0f2f4;color:#75808b;font-size:7px;font-weight:950}.imct-logo img{width:100%;height:100%;object-fit:contain;background:#fff}
.imct-section{display:flex;align-items:center;justify-content:space-between;margin:16px 0 7px}.imct-section strong{font-size:11px;font-weight:1000}.imct-section span{color:#8a9097;font-size:8px;font-weight:900}.imct-list{overflow:hidden;border:1px solid #e5e8eb;border-radius:16px}.imct-row{cursor:pointer;display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:76px;padding:9px;border-top:1px solid #eceef0}.imct-row:first-child{border-top:0}.imct-row .imct-player{width:38px;height:38px;border-radius:50%;background:#eef1f3;color:#505962;font-size:10px}.imct-copy{min-width:0}.imct-copy h3{margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:1000}.imct-side{text-align:right;white-space:nowrap}.imct-side strong{display:block;color:#168d43;font-size:13px;font-weight:1000}.imct-side time{display:block;margin-top:4px;color:#979ca3;font-size:7px;font-weight:850}.imct-empty{padding:22px 12px;color:#7d838b;text-align:center;font-size:10px;font-weight:800}.imct-more{width:100%;height:43px;margin-top:9px;border:1px solid #dce2e6;border-radius:12px;background:#fff;color:#168d43;font:inherit;font-size:9px;font-weight:1000}.imct-more[hidden]{display:none}
.imct-dmain{max-width:720px;margin:auto;padding:12px 12px 30px}.imct-dhero{display:grid;grid-template-columns:94px minmax(0,1fr);gap:12px;align-items:end;padding:14px;border-radius:19px;background:linear-gradient(135deg,#071a36,#0b3b69 64%,#0b6c3d);color:#fff}.imct-dhero .imct-player{width:94px;height:128px;border-radius:14px;font-size:26px}.imct-dhero small{color:#6ce293;font-size:7px;font-weight:950;letter-spacing:.08em}.imct-dhero h1{margin:5px 0 0;font-size:21px;line-height:1;font-weight:1000}.imct-dhero .fee{display:block;margin-top:11px;color:#efc157;font-size:21px;font-weight:1000}.imct-dhero time{display:block;margin-top:5px;color:#dbe6ef;font-size:8px;font-weight:850}.imct-move{display:grid;grid-template-columns:1fr 36px 1fr;gap:7px;align-items:center;margin:11px 0;padding:13px;border:1px solid #e2e7ea;border-radius:17px}.imct-club{text-align:center;min-width:0}.imct-club .imct-logo{width:54px;height:54px;flex-basis:54px;margin:auto}.imct-club strong{display:block;margin-top:7px;overflow:hidden;text-overflow:ellipsis;font-size:10px;font-weight:1000}.imct-arrow{text-align:center;color:#168d43;font-size:25px;font-weight:1000}.imct-fields{display:grid;grid-template-columns:1fr;gap:7px}.imct-field{padding:10px 11px;border:1px solid #e5e8eb;border-radius:12px;background:#fafbfc}.imct-field small{display:block;color:#898f97;font-size:7px;font-weight:950;text-transform:uppercase}.imct-field strong{display:block;margin-top:4px;overflow-wrap:anywhere;font-size:10px;font-weight:900}
@media(min-width:560px){.imct-fields{grid-template-columns:1fr 1fr}.imct-hero{height:176px}.imct-world strong{font-size:25px}}
`;
  document.head.appendChild(s);
}

async function fetchAll(table,select,orderColumn,ascending){
  const out=[];let from=0;
  while(true){
    let q=db.from(table).select(select);
    if(orderColumn)q=q.order(orderColumn,{ascending:ascending!==false});
    const r=await q.range(from,from+999);
    if(r.error)throw r.error;
    const page=r.data||[];out.push(...page);
    if(page.length<1000)break;
    from+=1000;
  }
  return out;
}

async function transfers(id,force){
  if(cache.rows.has(id)&&!force)return cache.rows.get(id);
  const rows=await fetchAll(transferTable(id),"transfer_id,transfer_code,season_transfer_number,imc_season,player_id,player_name,from_sm_world_club_id,club_from,to_sm_world_club_id,club_to,amount_text,transfer_date_text,exchange_players,imported_at","transfer_id",false);
  cache.rows.set(id,rows);return rows;
}

async function teams(id,force){
  if(cache.teams.has(id)&&!force)return cache.teams.get(id);
  const rows=await fetchAll(teamsTable(id),"sm_world_club_id,sm_club_id,club_name","club_name",true);
  cache.teams.set(id,rows);return rows;
}

async function profiles(id,rows,force){
  if(cache.profiles.has(id)&&!force)return cache.profiles.get(id);
  const ids=[...new Set((rows||[]).map(x=>x.player_id).filter(v=>v!=null).map(String))];
  const map=new Map();
  for(const part of chunk(ids,100)){
    const r=await db.from(codexTable(id)).select("player_id,player_name,full_name,age,rating,image_url,history").in("player_id",part);
    if(r.error)throw r.error;
    (r.data||[]).forEach(x=>map.set(String(x.player_id),x));
  }
  cache.profiles.set(id,map);return map;
}

async function logos(id,teamRows,force){
  if(cache.logos.has(id)&&!force)return cache.logos.get(id);
  const masterIds=[...new Set((teamRows||[]).map(x=>x.sm_club_id).filter(v=>v!=null).map(String))];
  const masters=new Map();
  for(const part of chunk(masterIds,100)){
    const r=await db.from("sm_clubs_master").select("sm_club_id,image_url").in("sm_club_id",part);
    if(r.error)throw r.error;
    (r.data||[]).forEach(x=>masters.set(String(x.sm_club_id),img(x.image_url)));
  }
  const map=new Map();
  (teamRows||[]).forEach(t=>map.set(String(t.sm_world_club_id),masters.get(String(t.sm_club_id))||""));
  cache.logos.set(id,map);return map;
}

function titleCaseName(v){
  let s=String(v||"").trim();
  s=s.replace(/^([A-ZÀ-ÖØ-Þ])\.(?=\S)/u,"$1. ");
  return s.toLocaleLowerCase("it-IT").split(/(\s+|-|’|')/u).map(p=>/^(\s+|-|’|')$/u.test(p)?p:(p?p.charAt(0).toLocaleUpperCase("it-IT")+p.slice(1):p)).join("");
}

function parsedPlayer(v){
  let s=String(v||"").trim(),age=null;
  const am=s.match(/Età\s*(\d{1,2})\s*$/i);
  if(am){age=Number(am[1]);s=s.slice(0,am.index).trim();}
  s=s.replace(/\d+(?:[.,]\d+)?\s*[kKmM]\s*$/u,"").trim();
  const pm=s.match(/^(.*?)(?:(?:PT|CD|CC|CO|D|A)(?:\([^)]+\))?(?:,(?:PT|CD|CC|CO|D|A)(?:\([^)]+\))?)*)$/u);
  return{name:titleCaseName(pm&&pm[1]?pm[1]:s),age:Number.isFinite(age)?age:null};
}

function numberOrNull(v){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null;}
function ratingTone(v){const r=numberOrNull(v);if(r===null)return"neutral";if(r>=94)return"purple";if(r>=90)return"blue";if(r>=80)return"green";if(r>=70)return"orange";if(r>=60)return"red";return"neutral";}
function rx(v){return String(v||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function historyText(p){return String(p&&p.history&&p.history.fields&&p.history.fields.transferHistory&&p.history.fields.transferHistory.text||"");}
function historyTransfer(x,p){
  const text=historyText(p);if(!text||!x.club_from||!x.club_to)return null;
  const re=new RegExp("Stagione\\s*(\\d+)\\s*Data\\s*(\\d{1,2}\\s+[A-Za-zÀ-ÖØ-öø-ÿ]+\\s+\\d{4})\\s*"+rx(x.club_from)+"\\s*"+rx(x.club_to)+"\\s*Costo\\s*([\\s\\S]*?)(?=Stagione\\s*\\d+\\s*Data|$)","gi");
  const found=[];let m;
  while((m=re.exec(text))!==null){found.push({season:Number(m[1]),date:String(m[2]||"").trim(),amount:String(m[3]||"").trim()});if(m.index===re.lastIndex)re.lastIndex++;}
  if(!found.length)return null;
  const amount=norm(x.amount_text);if(amount){const exact=found.find(y=>norm(y.amount)===amount);if(exact)return exact;}
  return found[0];
}

function enrich(x,p){
  const parsed=parsedPlayer(x.player_name),profile=p||{},h=historyTransfer(x,profile),profileName=String(profile.full_name||profile.player_name||"").trim();
  const age=numberOrNull(profile.age),rating=numberOrNull(profile.rating);
  return Object.assign({},x,{
    display_name:profileName?titleCaseName(profileName):parsed.name,
    player_age:age!==null?age:parsed.age,
    player_rating:rating,
    image_url:img(profile.image_url),
    transfer_date_text:String(x.transfer_date_text||"").trim()||(h&&h.date)||"",
    amount_text:String(x.amount_text||"").trim()||(h&&h.amount)||"",
    season_number:numberOrNull(x.imc_season)!==null?numberOrNull(x.imc_season):(h&&h.season)||null
  });
}

function initials(n){return String(n||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();}
function media(x){const src=img(x&&x.image_url),name=(x&&x.display_name)||(x&&x.player_name)||"";return `<div class="imct-player">${esc(initials(name))}${src?`<img src="${esc(src)}" alt="${esc(name)}" loading="lazy" onerror="this.remove()">`:""}</div>`;}
function logo(name,url){const src=img(url);return `<span class="imct-logo">${src?`<img src="${esc(src)}" alt="${esc(name||"")}" loading="lazy" onerror="this.remove()">`:"◈"}</span>`;}
function route(x){return `<div class="imct-route"><div>${logo(x.club_from,x.from_logo)}<span class="name">${esc(x.club_from||"—")}</span></div><b>››</b><div>${logo(x.club_to,x.to_logo)}<span class="name">${esc(x.club_to||"—")}</span></div></div>`;}
function playerMeta(x){const r=numberOrNull(x&&x.player_rating),age=numberOrNull(x&&x.player_age);if(r===null&&age===null)return"";return `<div class="imct-pmeta">${r!==null?`<span class="imct-rating r-${ratingTone(r)}">${esc(r)}</span>`:""}${age!==null?`<span>Età ${esc(age)}</span>`:""}</div>`;}

function filtered(){
  const q=norm(ui.q);
  return ui.rows.filter(x=>(ui.team==="all"||String(x.from_sm_world_club_id??"")===String(ui.team)||String(x.to_sm_world_club_id??"")===String(ui.team))&&(ui.season==="all"||String(x.season_number??"")===String(ui.season))&&(!q||norm([x.display_name,x.player_name,x.player_id,x.club_from,x.club_to,x.amount_text,x.transfer_date_text,x.transfer_code].join(" ")).includes(q)));
}
function lastMarkup(x){if(!x)return'<div class="imct-empty">Nessun trasferimento con i filtri selezionati.</div>';return `<article class="imct-last" data-tid="${esc(x.transfer_id)}">${media(x)}<div class="imct-lastcopy"><span class="imct-tag">LAST TRANSFER</span><h2>${esc(x.display_name||("Player "+x.player_id))}</h2>${playerMeta(x)}${route(x)}<time class="imct-date">${esc(x.transfer_date_text||"")}${x.season_number?` · SEASON ${esc(x.season_number)}`:""}</time></div><div class="imct-fee"><strong>${esc(x.amount_text||"—")}</strong><small>FEE</small></div></article>`;}
function rowMarkup(x){return `<article class="imct-row" data-tid="${esc(x.transfer_id)}">${media(x)}<div class="imct-copy"><h3>${esc(x.display_name||("Player "+x.player_id))}</h3>${playerMeta(x)}${route(x)}</div><div class="imct-side"><strong>${esc(x.amount_text||"—")}</strong><time>${esc(x.transfer_date_text||"")}</time></div></article>`;}
function imported(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString("it-IT",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function field(k,v){return `<div class="imct-field"><small>${esc(k)}</small><strong>${esc(v==null||v===""?"—":v)}</strong></div>`;}

function detail(x){
  if(!x)return;document.getElementById(DID)?.remove();
  const d=document.createElement("section");d.id=DID;
  d.innerHTML=`<header class="imct-top"><button id="imctdback" type="button">‹</button><div class="imct-title"><small>${esc(ui.world)}</small><strong>Transfer Detail</strong></div><span></span></header><main class="imct-dmain"><section class="imct-dhero">${media(x)}<div><small>PLAYER TRANSFER</small><h1>${esc(x.display_name||("Player "+x.player_id))}</h1>${playerMeta(x)}<span class="fee">${esc(x.amount_text||"—")}</span><time>${esc(x.transfer_date_text||"—")}${x.season_number?` · IMC SEASON ${esc(x.season_number)}`:""}</time></div></section><section class="imct-move"><div class="imct-club">${logo(x.club_from,x.from_logo)}<strong>${esc(x.club_from||"—")}</strong></div><div class="imct-arrow">››</div><div class="imct-club">${logo(x.club_to,x.to_logo)}<strong>${esc(x.club_to||"—")}</strong></div></section><h3 style="font-size:11px;margin:15px 0 7px">DATI IMPORTATI</h3><section class="imct-fields">${field("Transfer ID",x.transfer_code)}${field("Player ID",x.player_id)}${field("Player name",x.display_name)}${field("Club from",x.club_from)}${field("From SM World Club ID",x.from_sm_world_club_id)}${field("Club to",x.club_to)}${field("To SM World Club ID",x.to_sm_world_club_id)}${field("Amount",x.amount_text)}${field("Transfer date",x.transfer_date_text)}${field("Imported at",imported(x.imported_at))}</section></main>`;
  document.body.appendChild(d);document.getElementById("imctdback").onclick=()=>d.remove();
}

function bind(){document.querySelectorAll(`#${OID} [data-tid]`).forEach(e=>e.onclick=()=>detail(ui.rows.find(x=>String(x.transfer_id)===String(e.getAttribute("data-tid")))));}
function render(){const list=document.getElementById("imctlist"),last=document.getElementById("imctlast"),status=document.getElementById("imctstatus"),more=document.getElementById("imctmore");if(!list)return;const f=filtered(),hero=f[0]||null,rest=f.slice(hero?1:0),visible=rest.slice(0,ui.limit);if(last)last.innerHTML=lastMarkup(hero);list.innerHTML=visible.map(rowMarkup).join("")||`<div class="imct-empty">${f.length?"Nessun altro trasferimento con i filtri selezionati.":"Nessun trasferimento corrisponde ai filtri selezionati."}</div>`;if(status)status.textContent=f.length.toLocaleString("it-IT")+" movimenti";if(more)more.hidden=visible.length>=rest.length;bind();}
function filters(){
  const t=document.getElementById("imctteam"),s=document.getElementById("imctseason");
  if(t)t.innerHTML='<option value="all">Tutte le squadre</option>'+ui.teams.filter(x=>x.sm_world_club_id!=null).map(x=>`<option value="${esc(x.sm_world_club_id)}">${esc(x.club_name||("Club "+x.sm_world_club_id))}</option>`).join("");
  if(s)s.innerHTML='<option value="all">Tutte le stagioni</option>'+ui.seasons.map(n=>`<option value="${esc(n)}">Season ${esc(n)}</option>`).join("");
}

async function load(id,force){
  const list=document.getElementById("imctlist");if(list)list.innerHTML='<div class="imct-empty">Caricamento trasferimenti…</div>';
  try{
    const rs=await transfers(id,force);
    const [ps,ts]=await Promise.all([profiles(id,rs,force),teams(id,force)]);
    const ls=await logos(id,ts,force);
    ui.name=worldName(id);ui.teams=ts;
    ui.rows=rs.map(x=>{const y=enrich(x,ps.get(String(x.player_id)));return Object.assign({},y,{from_logo:ls.get(String(x.from_sm_world_club_id??""))||"",to_logo:ls.get(String(x.to_sm_world_club_id??""))||""});});
    ui.seasons=[...new Set(ui.rows.map(x=>x.season_number).filter(v=>v!=null).map(Number))].sort((a,b)=>a-b);
    ui.q="";ui.team="all";ui.season="all";ui.limit=80;
    document.getElementById("imctworldname").textContent=ui.name;document.getElementById("imcttitle").textContent="Transfers · "+ui.name;document.getElementById("imctcount").textContent=ui.rows.length.toLocaleString("it-IT");document.getElementById("imctupdated").textContent=ui.rows.length?imported(ui.rows[0].imported_at):"—";
    filters();render();
  }catch(e){console.error("IMC Transfers",e);if(list)list.innerHTML='<div class="imct-empty">Impossibile caricare i trasferimenti.</div>';}
}

async function open(id){
  if(!valid(id))return;css();document.getElementById(DID)?.remove();document.getElementById(OID)?.remove();
  ui.world=id;ui.name=worldName(id);ui.rows=[];ui.teams=[];ui.seasons=[];ui.q="";ui.team="all";ui.season="all";ui.limit=80;
  const o=document.createElement("section");o.id=OID;
  o.innerHTML=`<header class="imct-top"><button id="imctback" type="button">‹</button><div class="imct-title"><small>${esc(id)}</small><strong id="imcttitle">Transfers · ${esc(ui.name)}</strong></div><button id="imctrefresh" type="button">↻</button></header><main class="imct-main"><section class="imct-hero"><img class="bg" src="assets/transfers-hero-market.svg" alt=""><div class="imct-brand"><img src="assets/imc-logo.png" alt="IMC"><span>TRANSFER MARKET</span></div><div class="imct-world"><small>${esc(id)}</small><strong id="imctworldname">${esc(ui.name)}</strong></div></section><input id="imctsearch" class="imct-search" type="search" placeholder="Cerca giocatore o club…" autocomplete="off"><section class="imct-kpis"><div class="imct-kpi"><small>Movimenti</small><strong id="imctcount">…</strong></div><div class="imct-kpi"><small>Ultimo aggiornamento</small><strong id="imctupdated">…</strong></div></section><section class="imct-filters"><label class="imct-filter"><span>Filtra squadre</span><select id="imctteam"><option value="all">Tutte le squadre</option></select></label><label class="imct-filter"><span>Filtra stagione</span><select id="imctseason"><option value="all">Tutte le stagioni</option></select></label></section><div id="imctlast">${lastMarkup(null)}</div><div class="imct-section"><strong>ULTIMI TRASFERIMENTI</strong><span id="imctstatus">Caricamento…</span></div><section id="imctlist" class="imct-list"><div class="imct-empty">Caricamento trasferimenti…</div></section><button id="imctmore" class="imct-more" type="button" hidden>CARICA ALTRI</button></main>`;
  document.body.appendChild(o);document.body.style.overflow="hidden";
  document.getElementById("imctback").onclick=()=>{document.getElementById(DID)?.remove();o.remove();document.body.style.overflow="";};
  document.getElementById("imctrefresh").onclick=()=>load(id,true);
  document.getElementById("imctsearch").oninput=e=>{ui.q=e.target.value||"";ui.limit=80;render();};
  document.getElementById("imctteam").onchange=e=>{ui.team=e.target.value||"all";ui.limit=80;render();};
  document.getElementById("imctseason").onchange=e=>{ui.season=e.target.value||"all";ui.limit=80;render();};
  document.getElementById("imctmore").onclick=()=>{ui.limit+=80;render();};
  load(id,false);
}

function ensureButton(){
  const id=currentWorld();if(!valid(id))return;
  const bot=document.querySelector(".nx-bottom.nx-bottom-b6");if(!bot)return;
  let b=bot.querySelector("[data-imc-transfers-world]");
  if(!b&&!bot.querySelector("[data-page='transfers']")){
    b=document.createElement("button");b.type="button";b.innerHTML='<b>⇄</b><span>TRANSFERS</span>';
    const stats=bot.querySelector("[data-page='stats']"),h2h=bot.querySelector("[data-page='h2h']");
    if(stats)stats.insertAdjacentElement("afterend",b);else if(h2h)h2h.insertAdjacentElement("beforebegin",b);else bot.appendChild(b);
  }
  if(b)b.dataset.imcTransfersWorld=id;
}

let timer=null;
new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(ensureButton,80);}).observe(document.documentElement,{childList:true,subtree:true});
ensureButton();

document.addEventListener("click",e=>{
  const b=e.target&&e.target.closest&&e.target.closest("[data-imc-transfers-world],[data-page='transfers']");if(!b)return;
  const id=b.getAttribute("data-imc-transfers-world")||currentWorld();if(!valid(id))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open(id);
},true);

window.IMC_TRANSFERS={version:V,open,refresh:id=>load(id||ui.world,true)};
})();
