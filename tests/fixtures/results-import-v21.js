/* ================================================================
   IMC | RESULTS IMPORT V2.1 · SENZA BACKFILL · CORE DINAMICO
   Manager ID esclusi: assegnazione demandata ai trigger del database.
   REPOSITORY: IMC Results
   Girone per fixture; custom D1–D5; playoff e nazionali; solo MySQL3.
   Solo pagina corrente per divisione. Nessun click su Precedenti.
   ================================================================ */

(function(){
"use strict";

/* CONFIG */
const GATEWAY_URL="https://www.italianmastersclub.it/imc-universal-gateway/";
const RESULTS="IMC Results";
const DATABASE="Sql1956795_3";
let WORLDS=[];
const S={
 gw:null,legacyGw:null,worldName:null,shortcutReleased:false,stop:false,importedAt:null,phase:"PRONTO",
 scanned:0,fresh:0,skip:0,saved:0,errors:0,done:0,sections:0,
 existingIds:new Set(),existingFingerprints:new Set(),seasons:[]
};

/* HELPERS */
const clean=v=>String(v==null?"":v).replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
const norm=v=>clean(v).toLocaleLowerCase("it-IT").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const attr=(e,n)=>{try{return e?e.getAttribute(n):null}catch(_){return null}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function visible(e){
 try{
  if(!e||e.closest&&e.closest("#workingCopy"))return false;
  const s=getComputedStyle(e);const r=e.getBoundingClientRect();
  return s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity)!==0&&r.width>0&&r.height>0;
 }catch(_){return false;}
}
async function waitFor(fn,ms=15000){
 const t=Date.now();
 while(Date.now()-t<ms){
  if(S.stop)throw Error("Importazione interrotta");
  try{const x=fn();if(x)return x;}catch(_){}
  await sleep(150);
 }
 return null;
}
function stamp(){
 const d=new Date();const z=n=>String(n).padStart(2,"0");
 return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())+" "+z(d.getHours())+":"+z(d.getMinutes())+":"+z(d.getSeconds());
}
function hash(a){
 const s=a.map(clean).join("|");let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
 const x=(h>>>0).toString(16).padStart(8,"0");return(x+x+x+x+x+x+x+x).slice(0,64);
}
function destination(){
 if(!/^IMC(?:00[1-9]|010)$/.test(S.gw||""))throw Error("Mondo IMC non valido");
 return{database:DATABASE,table:S.gw+"_Results"};
}
async function loadWorlds(){
 const controller=new AbortController();
 const deadline=setTimeout(()=>controller.abort(),15000);
 let reply;
 try{
  reply=await gateway({action:"list_imc_worlds"},controller.signal);
 }catch(error){
  if(controller.signal.aborted)throw Error("Il registro mondi non ha risposto entro 15 secondi.");
  throw error;
 }finally{clearTimeout(deadline);}
 if(!Array.isArray(reply.worlds))throw Error("Registro mondi non disponibile");
 const seen=new Set(),legacyIds=new Set();
 WORLDS=reply.worlds.filter(w=>/^IMC-(?:00[1-9]|010)$/.test(w.id)).map(w=>{
  const id=w.id.replace("-",""),name=clean(w.name),legacy=clean(w.legacy);
  if(!name||!legacy||seen.has(id)||legacyIds.has(legacy))throw Error("Registro mondi incompleto o duplicato: "+id);
  seen.add(id);legacyIds.add(legacy);return{id,name,legacy};
 }).sort((a,b)=>a.id.localeCompare(b.id));
 if(!WORLDS.length)throw Error("Nessun mondo IMC configurato nel CORE");
}

/* UI */
function buildUI(){
 const old=document.getElementById("__imc_results_clean");if(old)old.remove();
 const root=document.createElement("div");root.id="__imc_results_clean";
 root.style.cssText=["position:fixed","inset:0","z-index:2147483647","background:rgba(15,23,42,.25)","backdrop-filter:blur(5px)","-webkit-backdrop-filter:blur(5px)","padding:8px","box-sizing:border-box","font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif","color:#172033"].join(";");
 root.innerHTML=`
 <div style="width:100%;max-width:430px;height:100%;margin:0 auto;background:#fff;border-radius:26px;border:1px solid #e5e7ef;box-shadow:0 24px 70px rgba(15,23,42,.20);overflow:auto">
  <div style="position:sticky;top:0;z-index:3;padding:13px;background:rgba(255,255,255,.96);border-bottom:1px solid #eef1f5;backdrop-filter:blur(12px)">
   <div style="font-size:8px;letter-spacing:1.7px;font-weight:950;color:#7357df">ITALIAN MASTERS CLUB</div>
   <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
    <strong style="font-size:20px;letter-spacing:-.4px">Results V2.1 · Senza backfill</strong>
    <span id="badge" style="font-size:9px;font-weight:950;padding:7px 10px;border-radius:999px;background:#f1edff;color:#6847dc">PRONTO</span>
   </div>
  </div>
  <div id="body" style="padding:10px"></div>
 </div>`;
 document.body.appendChild(root);
}
function worldUI(){
 const body=document.querySelector("#__imc_results_clean #body");body.innerHTML='';
 const title=document.createElement("div");title.textContent="SELEZIONA MONDO IMC";
 title.style.cssText="font-size:13px;font-weight:950;margin-bottom:10px";body.appendChild(title);
 const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px";
 for(const world of WORLDS){
  const b=document.createElement("button");b.className="gw";b.dataset.g=world.id;
  b.style.cssText="min-height:64px;padding:10px 6px;border:1px solid #dedfed;border-radius:13px;background:#fff;color:#4e4191";
  const code=document.createElement("strong");code.textContent=world.id;code.style.display="block";
  const name=document.createElement("span");name.textContent=world.name;name.style.cssText="display:block;font-size:11px;margin-top:5px";
  b.append(code,name);grid.appendChild(b);
 }
 body.appendChild(grid);
}
function chooseGW(){return new Promise(resolve=>{document.querySelectorAll("#__imc_results_clean .gw").forEach(b=>{b.onclick=()=>resolve(WORLDS.find(w=>w.id===b.dataset.g));});});}
function progressUI(){
 document.querySelector("#__imc_results_clean #body").innerHTML=`
 <div style="display:flex;flex-direction:column;gap:8px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
   ${infoCard("GAME WORLD","gw","#7357df")}
   ${infoCard("FASE","phase","#7357df")}
   ${infoCard("COMPETIZIONE","country","#3b82c4")}
   ${infoCard("DIVISION","division","#5f63d8")}
   ${infoCard("AZIONE","action","#8356cb")}
   ${infoCard("DATA / TURNO","date","#b36b2c")}
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">
   ${counterCard("SCANSIONATI","scanned","#475569")}
   ${counterCard("NUOVI","fresh","#16845b")}
   ${counterCard("SKIP","skip","#b96f17")}
   ${counterCard("SALVATI","saved","#4f55d7")}
  </div>
  <div style="background:#f3fbf6;border:1px solid #d8ecdf;border-radius:16px;padding:10px 12px">
   <div style="font-size:7px;letter-spacing:1.2px;font-weight:950;color:#4d8d61">DESTINAZIONE MYSQL</div>
   <div id="dest" style="margin-top:5px;font-size:10px;font-weight:900;color:#315d3e;overflow-wrap:anywhere">-</div>
  </div>
  <div style="background:#fff;border:1px solid #e7eaf0;border-radius:16px;padding:10px">
   <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:8px;letter-spacing:1.2px;font-weight:950;color:#7357df">LOG LIVE</div>
    <div id="errors" style="font-size:7px;font-weight:950;color:#bf4444">ERRORI 0</div>
   </div>
   <div id="log" style="height:240px;overflow:auto;margin-top:8px;background:#f7f8fa;border-radius:12px;padding:7px;font:8.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace"></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
   <button id="stop" style="height:46px;border:1px solid #efc7c7;border-radius:14px;background:#fff2f2;color:#b74444;font-size:11px;font-weight:950">STOP</button>
   <button id="close" style="display:none;height:46px;border:1px solid #dfe2e8;border-radius:14px;background:#fff;color:#303443;font-size:11px;font-weight:950">CHIUDI</button>
  </div>
 </div>`;
 document.getElementById("stop").onclick=()=>{S.stop=true;setPhase("ARRESTO");setBadge("ARRESTO...");log("STOP richiesto","error");};
 document.getElementById("close").onclick=()=>{document.getElementById("__imc_results_clean")?.remove();};
 updateUI();
}
function infoCard(label,id,color){return`<div style="background:#fff;border:1px solid #e7eaf0;border-radius:15px;padding:9px 10px;min-width:0"><div style="font-size:6.8px;letter-spacing:1px;font-weight:950;color:${color}">${label}</div><div id="${id}" style="margin-top:5px;font-size:11px;font-weight:950;overflow-wrap:anywhere">-</div></div>`;}
function counterCard(label,id,color){return`<div style="background:#fff;border:1px solid #e7eaf0;border-radius:15px;padding:9px 5px;text-align:center"><div style="font-size:6.5px;letter-spacing:.8px;font-weight:950;color:${color}">${label}</div><div id="${id}" style="margin-top:5px;font-size:20px;font-weight:950">0</div></div>`;}
function setBadge(x){const e=document.querySelector("#__imc_results_clean #badge");if(e)e.textContent=x;}
function setPhase(x){S.phase=x;updateUI();}
function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value;}
function log(text,type="info"){
 const e=document.getElementById("log");if(!e)return;const row=document.createElement("div");
 let color="#394052";let bg="transparent";
 if(type==="new"){color="#16784f";bg="#edf9f3";}else if(type==="skip"){color="#ad6815";bg="#fff6e8";}else if(type==="error"){color="#b54040";bg="#fff0f0";}
 row.style.cssText="padding:4px 6px;margin:2px 0;border-radius:8px;font-weight:850;color:"+color+";background:"+bg;
 row.textContent="• "+clean(text);e.appendChild(row);e.scrollTop=e.scrollHeight;
}
function updateUI(){
 if(!S.gw)return;let c={};try{c=context()}catch(_){}const d=dateInfo();const dest=destination();
 setText("gw",S.gw+" · "+S.worldName);setText("phase",S.phase);setText("country",c.competition_group||"—");setText("division",c.sm_division||"—");setText("action",c.sm_action||"—");
 setText("date",[d.match_date,d.competition_stage,d.competition_round].filter(Boolean).join(" · ")||"—");
 setText("scanned",String(S.scanned));setText("fresh",String(S.fresh));setText("skip",String(S.skip));setText("saved",String(S.saved));
 setText("dest",(dest.database||"Routing Gateway")+" · "+dest.table);setText("errors","ERRORI "+S.errors);
}
function finish(status){setBadge(status);setPhase(status);const stop=document.getElementById("stop");const close=document.getElementById("close");if(stop)stop.style.display="none";if(close)close.style.display="block";}

/* GATEWAY */
async function gateway(body,signal){
 const response=await fetch(GATEWAY_URL,{signal,method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-IMC-Channel":"IMPORT"},body:JSON.stringify({...body,channel:"IMPORT"})});
 const raw=await response.text();let json=null;try{json=raw?JSON.parse(raw):{};}catch(_){}
 if(!response.ok||!json||json.ok===false){const detail=(json&&(json.message||json.error))||raw||("HTTP "+response.status);throw Error("Gateway "+response.status+" · "+detail);}
 if(body.repository===RESULTS && (body.action==="read"||body.action==="insert_many")){
  const dest=destination();
  if(json.database!==dest.database||json.physical_table!==dest.table||json.table!==dest.table||json.IMC_WORLD_ID?.replace("-","")!==S.gw)
   throw Error("Destinazione Results non corrispondente");
 }
 return json;
}

/* PRELOAD IMC SEASON LOCALE */
async function preloadSeasons(){
 setPhase("LETTURA IMC SEASON");const dest=destination();
 const json=await gateway({action:"read",game_world_id:S.gw,repository:"IMC_Game_World_Season",target_database:dest.database,target_table:"IMC_Game_World_Season",route_mode:"explicit",limit:100,offset:0});
 S.seasons=(Array.isArray(json.rows)?json.rows:[])
  .filter(r=>[S.gw,S.legacyGw].includes(clean(r.game_world_id)))
  .map(r=>({imc_season:Number(r.imc_season),start:clean(r.imc_season_start_date),end:clean(r.imc_season_end_date)||null}))
  .filter(r=>Number.isFinite(r.imc_season)&&r.start);
 if(!S.seasons.length)throw Error("Nessuna IMC Season configurata per "+S.gw);
 log("IMC Season locali caricate · "+S.seasons.length);
}
function imcSeasonForDate(matchDate){
 const d=clean(matchDate);
 if(!d)return null;
 const hit=S.seasons.find(r=>d>=r.start&&(!r.end||d<=r.end));
 if(!hit)throw Error("IMC Season non trovata per "+S.gw+" · "+d);
 return hit.imc_season;
}

/* PRELOAD DUPLICATI */
async function preloadExisting(){
 setPhase("LETTURA DB");const dest=destination();let offset=0;const limit=5000;
 S.existingIds.clear();S.existingFingerprints.clear();
 while(true){
  const json=await gateway({action:"read",game_world_id:S.gw,repository:RESULTS,...(dest.database?{target_database:dest.database,target_table:dest.table,route_mode:"explicit"}:{}),limit,offset});
  const rows=Array.isArray(json.rows)?json.rows:[];
  rows.forEach(r=>{const id=Number(r.sm_fixture_id);if(Number.isFinite(id))S.existingIds.add(id);if(clean(r.fingerprint))S.existingFingerprints.add(clean(r.fingerprint));});
  if(!json.has_more)break;const next=Number(json.next_offset);if(!Number.isFinite(next)||next<=offset)throw Error("Paginazione READ non valida");offset=next;
 }
 log("DB caricato · "+S.existingIds.size+" fixture già presenti");
}
function splitExisting(rows){
 const fresh=[];const skipped=[];
 rows.forEach(r=>{const id=Number(r.sm_fixture_id);const existsById=Number.isFinite(id)&&S.existingIds.has(id);const existsByFingerprint=clean(r.fingerprint)&&(S.existingFingerprints.has(clean(r.fingerprint))||S.existingFingerprints.has(legacyFingerprint(r)));if(existsById||existsByFingerprint)skipped.push(r);else fresh.push(r);});
 return{fresh,skipped};
}
async function insertRows(rows){
 if(!rows.length)return 0;const dest=destination();
 const json=await gateway({action:"insert_many",game_world_id:S.gw,repository:RESULTS,...(dest.database?{target_database:dest.database,target_table:dest.table,route_mode:"explicit"}:{}),rows,atomic:true});
 const written=Number(json.written_rows);if(written!==rows.length||Number(json.skipped_rows||0)!==0||Number(json.failed||0)!==0||json.rolled_back===true||(json.errors&&json.errors.length))throw Error("Salvataggio Results non confermato integralmente");
 rows.forEach(r=>{const id=Number(r.sm_fixture_id);if(Number.isFinite(id))S.existingIds.add(id);if(clean(r.fingerprint))S.existingFingerprints.add(clean(r.fingerprint));});
 S.saved+=written;return written;
}

/* CONTEXT: contesto originale utilizzato dalla navigazione. */
function macro(a){
 a=normalizedAction(a);
 if(["league","leaguecup","leagueshield","charityshield","playoff","friendly"].includes(a))return"DOMESTIC";
 if(["smfacup","smfashield","supercup"].includes(a))return"INTERNATIONAL";
 if(["interqualifier","worldcup"].includes(a))return"NATIONS";
 return null;
}
function divisionSelect(){return [...document.querySelectorAll("select")].find(s=>visible(s)&&[...s.options].some(o=>/^division(?:e)?\s+\d+$/i.test(clean(o.textContent))))||null;}
function countrySelect(){const s=document.querySelector("#country-selector select");return s&&visible(s)?s:null;}
function pagerContext(){
 const root=document.getElementById("leagueResultsContainer")||document;
 const e=root.querySelector("#ResultsprevWeek_click a[action],#ResultsnextWeek_click a[action],#ResultssnextWeek_click a[action]");
 return e?{sm_action:normalizedAction(attr(e,"action")),sm_country:clean(attr(e,"data-country"))||null,sm_division:clean(attr(e,"data-division"))||null}:{};
}
function context(){
 const p=pagerContext();const ds=divisionSelect();const cs=countrySelect();
 let action=p.sm_action||null;let country=p.sm_country||null;let division=p.sm_division||null;
 // Le finali senza paginazione espongono l'azione nell'onchange del menu.
 if(!action){
  for(const select of [cs,ds]){
   const m=(attr(select,"onchange")||"").match(/MENU_competitionDivChange\s*\([\s\S]*?,\s*['"]([a-z]+)['"]\s*\)/i);
   if(m&&macro(m[1])){action=m[1].toLowerCase();break;}
  }
 }

 if(!action){
  const e=[...(document.getElementById("currentScreenA")||document).querySelectorAll("[action],[data-action]")].find(x=>["league","leaguecup","leagueshield","charityshield","smfacup","smfashield","supercup","interqualifier","worldcup","friendly","friendlies"].includes(norm(attr(x,"action")||attr(x,"data-action"))));
  if(e)action=clean(attr(e,"action")||attr(e,"data-action"));
 }
 if(!country&&cs)country=clean(cs.options[cs.selectedIndex]?.textContent)||clean(cs.value)||null;
 if(!division&&ds)division=clean(ds.options[ds.selectedIndex]?.textContent)||clean(ds.value)||null;
 if(normalizedAction(action)==="friendly"){action="friendly";country=null;division=null;}
 const group=macro(action);if(group==="INTERNATIONAL"||group==="NATIONS"){country=null;division=null;}
 const groupName=null; // Il girone viene letto per fixture, in fixtureGroupName().
 return{sm_action:action,sm_country:country,sm_division:division,competition_group:group,competition_group_name:groupName};
}
function competitionKey(c){return[S.gw,c.sm_country,c.competition_group,c.sm_action,c.sm_division].filter(x=>clean(x)).map(clean).join("|");}

/* NORMALIZZAZIONE RECORD: non modifica context(), plan() o navigazione. */
function normalizedAction(value){
 const compact=norm(value).replace(/\s+/g,"");
 const aliases={friendlies:"friendly",playoffs:"playoff",smfasupercup:"supercup",worldcupqualifying:"interqualifier"};
 return aliases[compact]||compact||null;
}
function normalizedDivision(value){
 const m=clean(value).match(/^(?:division(?:e)?\s*)?0*(\d+)$/i);
 return m&&Number(m[1])>0?String(Number(m[1])):null;
}
function fixtureGroupName(button){
 const root=button.closest('[id="competitionResultsContent"]')||button.closest('[id="leagueResultsContainer"]');
 if(!root)return null;
 // Nel DOM ogni blocco contiene la propria intestazione e N_results.
 // Non risalire fino alla radice comune a tutti i gironi.
 for(let node=button.parentElement;node&&node!==root;node=node.parentElement){
  const header=[...node.children].find(e=>e.matches('[id="groupHeader"],.groupHeader,.sectionheading')&&/^(girone|group)\b/i.test(clean(e.textContent)));
  if(header){
   const text=clean(header.textContent);
   const m=text.match(/^(?:girone|group)\s+([a-z]|\d+)$/i);
   return m?"Girone "+(/^\d+$/.test(m[1])?String(Number(m[1])):m[1].toUpperCase()):text;
  }
 }
 return null;
}
function normalizedResultContext(button,raw,date){
 let action=normalizedAction(raw.sm_action);
 const root=button.closest('[id="leagueResultsContainer"]');
 // Usa solo intestazioni dei risultati: niente testo di menu o tab nascosti.
 const headingText=root?[...root.querySelectorAll('.scheduleScreen-Heading')].filter(visible).map(e=>clean(e.textContent)).join(" "):"";
 const phaseText=[date.competition_stage,date.competition_round,headingText].filter(Boolean).join(" ");
 if(action==="league"&&/\bplay[\s-]*offs?\b/i.test(phaseText))action="playoff";
 const group=macro(action);
 if(!group)throw Error("SM action non riconosciuta: "+clean(raw.sm_action));
 const country=null; // Custom: no domestic country partition; national competitions retained.
 let division=null;
 if(action==="league"||action==="playoff"){
  division=normalizedDivision(raw.sm_division);
  if(!division){
   const ds=divisionSelect();
   division=normalizedDivision(ds&&ds.options[ds.selectedIndex]?.textContent)||normalizedDivision(ds&&ds.value);
  }
  if(!division||Number(division)>5)throw Error("Divisione mancante o fuori intervallo 1–5 per "+action);
 }
 return{sm_action:action,sm_country:country,sm_division:division,competition_group:group,competition_group_name:fixtureGroupName(button)};
}

/* RESULT PARSER */
const MONTH={gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,luglio:7,agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12};
function dateInfo(){
 const root=document.getElementById("leagueResultsContainer")||document;
 const h=[...root.querySelectorAll(".scheduleScreen-Heading")].find(visible);
 if(!h)return{match_date:null,competition_stage:null,competition_round:null};
 const text=clean(h.textContent);
 const m=text.toLowerCase().match(/(?:lun|mar|mer|gio|ven|sab|dom)?\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/);
 if(!m)return{match_date:null,competition_stage:null,competition_round:null};
 const date=m[3]+"-"+String(MONTH[m[2]]).padStart(2,"0")+"-"+String(Number(m[1])).padStart(2,"0");
 const prefix=clean(text.slice(0,text.toLowerCase().indexOf(m[0])).replace(/[:·\-]\s*$/, ""));
 let stage=null;let round=null;
 if(prefix){
  const leg=prefix.match(/^(.*?)(?:\s+|[-·])\b(Andata|Ritorno)\b$/i);
  if(leg){stage=clean(leg[1])||null;round=clean(leg[2])||null;}
  else if(/finale|semifinale|quarti|ottavi|sedicesimi|qualificazion|finals|finali/i.test(prefix)){stage=prefix;}
  else{round=prefix;}
 }
 return{match_date:date,competition_stage:stage,competition_round:round};
}
function resultButtons(){
 const root=document.getElementById("leagueResultsContainer")||document;const seen=new Set();
 return[...root.querySelectorAll('[id="matchResult"]')].filter(b=>{
  if(!visible(b))return false;
  const m=(attr(b,"onclick")||"").match(/MATCHREPORT_[A-Za-z0-9_]*\s*\(\s*['"]?(\d+)/i);
  if(!m||seen.has(m[1]))return false;seen.add(m[1]);return true;
 });
}
function fixtureId(button){const m=(attr(button,"onclick")||"").match(/MATCHREPORT_[A-Za-z0-9_]*\s*\(\s*['"]?(\d+)/i);return m?Number(m[1]):null;}
function team(row,side){
 const e=row.querySelector('[id="'+(side==="home"?"homeTeam":"awayTeam")+'"]');
 const name=e?clean(e.textContent)||null:null;
 const m=e&&(attr(e,"onclick")||"").match(/MENU_(?:clubOverviewDraw|association_draw)\s*\(\s*['"]?(\d+)/i);
 if(m)return{name,id:Number(m[1])};
 const unresolved={name,id:null};if(!e||!name)return unresolved;if(context().competition_group==="NATIONS")return unresolved;
 const header=document.getElementById("top-nav-title");const headerName=header&&header.querySelector("p");
 if(!headerName||norm(headerName.textContent)!==norm(name))return unresolved;
 const logo=header.querySelector('img[src*="/images/logos/clubs/"]');
 const logoMatch=(attr(logo,"src")||"").match(/\/images\/logos\/clubs\/(\d+)\./i);
 if(!logoMatch)return unresolved;const catalogId=Number(logoMatch[1]);
 const bridge=document.createElement("span");const script=document.createElement("script");
 bridge.id="__imc_club_key_"+Date.now()+"_"+Math.random().toString(36).slice(2);bridge.hidden=true;
 try{
  document.documentElement.appendChild(bridge);
  script.textContent="(function(){"+"var b=document.getElementById("+JSON.stringify(bridge.id)+");"+"try{"+"var k=window.g_currentClubKey;"+"if(b&&k){b.textContent=JSON.stringify({ClubID:k.ClubID,ClubDataID:k.ClubDataID});}"+"}catch(_){}"+"})();";
  document.documentElement.appendChild(script);
  const key=JSON.parse(bridge.textContent||"null");if(!key)return unresolved;
  const id=Number(key.ClubID);if(Number.isSafeInteger(id)&&id>0&&Number(key.ClubDataID)===catalogId)return{name,id};
  return unresolved;
 }catch(_){return unresolved;}finally{script.remove();bridge.remove();}
}
function decision(row,homeName,awayName){
 const textParts=[];let next=row.nextElementSibling;
 while(next){if(next.querySelector&&next.querySelector('[id="matchResult"]'))break;const t=clean(next.textContent);if(t)textParts.push(t);next=next.nextElementSibling;}
 const text=clean(textParts.join(" "));
 const out={penalty_home_score:null,penalty_away_score:null,aggregate_home_score:null,aggregate_away_score:null};
 let m=text.match(/La squadra\s+(.+?)\s+vince ai rigori con il punteggio di\s+(\d+)\s*[-–]\s*(\d+)/i);
 if(m){const winner=clean(m[1]);const a=Number(m[2]);const b=Number(m[3]);if(norm(winner)===norm(homeName)){out.penalty_home_score=a;out.penalty_away_score=b;}else if(norm(winner)===norm(awayName)){out.penalty_home_score=b;out.penalty_away_score=a;}}
 m=text.match(/La squadra\s+(.+?)\s+vince con il punteggio aggregato di\s+(\d+)\s*[-–]\s*(\d+)/i);
 if(m){const winner=clean(m[1]);const a=Number(m[2]);const b=Number(m[3]);if(norm(winner)===norm(homeName)){out.aggregate_home_score=a;out.aggregate_away_score=b;}else if(norm(winner)===norm(awayName)){out.aggregate_home_score=b;out.aggregate_away_score=a;}}
 return out;
}
function resultFingerprint(result){
return hash([
   result.game_world_id,result.sm_fixture_id,result.competition_key,result.sm_action,result.sm_country,result.sm_division,
   result.competition_group,result.competition_group_name,result.competition_stage,result.competition_round,result.match_date,
   result.home_sm_club_id,result.home_name,result.away_sm_club_id,result.away_name,
   result.home_score,result.away_score,result.penalty_home_score,result.penalty_away_score,result.aggregate_home_score,result.aggregate_away_score,result.result_status
  ]);
}
function legacyFingerprint(result){
 const prefix=S.gw;const key=result.competition_key;
 const oldKey=key&&key.startsWith(prefix+"|")?S.legacyGw+key.slice(prefix.length):key;
 return resultFingerprint({...result,game_world_id:S.legacyGw,competition_key:oldKey});
}
function resultRows(){
 const raw=context();const d=dateInfo();
 return resultButtons().map(button=>{
  const c=normalizedResultContext(button,raw,d);const key=competitionKey(c);
  const row=button.closest("tr")||button.parentElement;
  const home=team(row,"home");const away=team(row,"away");
  const score=clean(button.textContent).match(/(\d+)\s*[-–]\s*(\d+)/);const extra=decision(row,home.name,away.name);
  const result={
   game_world_id:S.gw,sm_fixture_id:fixtureId(button),competition_key:key,
   sm_action:c.sm_action||null,sm_country:c.sm_country||null,sm_division:c.sm_division||null,
   competition_group:c.competition_group||null,competition_group_name:c.competition_group_name||null,
   competition_stage:d.competition_stage,competition_round:d.competition_round,match_date:d.match_date,
    imc_season:imcSeasonForDate(d.match_date),
   home_sm_club_id:home.id,home_name:home.name,away_sm_club_id:away.id,away_name:away.name,
   home_score:score?Number(score[1]):null,away_score:score?Number(score[2]):null,
   penalty_home_score:extra.penalty_home_score,penalty_away_score:extra.penalty_away_score,
   aggregate_home_score:extra.aggregate_home_score,aggregate_away_score:extra.aggregate_away_score,
   result_status:score?"COMPLETED":null,fingerprint:null,imported_at:S.importedAt
  };
  result.fingerprint=resultFingerprint(result);
  return result;
 });
}

/* NAVIGATION */
function clickReal(e){
 if(!e)return;
 const token="imc_click_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 e.setAttribute("data-imc-click-token",token);
 document.documentElement.removeAttribute("data-imc-click-error");
 const script=document.createElement("script");
 script.textContent=
  "(function(){"+
   "var el=document.querySelector('[data-imc-click-token=\\\""+
   token+
   "\\\"]');"+
   "if(!el)return;"+
   "try{"+
    "if(typeof el.onclick==='function'){"+
     "el.onclick.call(el);"+
    "}else{"+
     "var raw=el.getAttribute('onclick')||'';"+
     "if(raw){(new Function(raw)).call(el);}"+
     "else{el.click();}"+
    "}"+
   "}catch(e){"+
    "document.documentElement.setAttribute("+
     "'data-imc-click-error',"+
     "String(e&&e.message||e)"+
    ");"+
   "}"+
  "})();";
 (document.documentElement||document.head||document.body).appendChild(script);
 script.remove();e.removeAttribute("data-imc-click-token");
 const err=document.documentElement.getAttribute("data-imc-click-error");document.documentElement.removeAttribute("data-imc-click-error");
 if(err)throw Error(err);
}
function pageIds(){return resultButtons().map(fixtureId).filter(v=>v!=null);}
function resultsNavigationRoot(){
 const roots=[...document.querySelectorAll('[id="leagueResultsContainer"]')];
 return roots.find(e=>visible(e)&&!e.closest('#workingCopy,#workingCopy2'))||null;
}
function noResultsPage(){
 const root=resultsNavigationRoot();if(!root||resultButtons().length)return false;
 return [...root.querySelectorAll('[id="competitionScreenTrans-no-results"]')].some(e=>{
  if(!clean(e.textContent))return false;
  for(let n=e;n&&n!==root.parentElement;n=n.parentElement){const style=getComputedStyle(n);if(style.display==="none"||style.visibility==="hidden")return false;}
  return true;
 });
}
function plan(kind){
 if(kind==="division"&&norm(context().sm_action)!=="league")return null;
 const select=kind==="country"?countrySelect():divisionSelect();if(!select)return null;
 const options=[...select.options].map((o,i)=>({value:String(o.value||""),text:clean(o.textContent),index:i,disabled:o.disabled})).filter(o=>!o.disabled&&(kind==="division"?/^division(?:e)?\s+[1-5]$/i.test(o.text):o.value&&o.text));
 if(!options.length)return null;let pos=options.findIndex(o=>o.index===select.selectedIndex);if(pos<0)pos=0;
 return options.slice(pos).concat(options.slice(0,pos));
}
async function switchTo(kind,target){
 const select=kind==='country'?countrySelect():divisionSelect();
 if(!select)throw Error('Menu '+kind+' non trovato');
 const idx=[...select.options].findIndex(o=>String(o.value)===String(target.value));if(idx<0)return false;
 const before=pageIds().slice().sort().join('|');
 const oldRoot=resultsNavigationRoot();const oldHTML=oldRoot?oldRoot.innerHTML:null;let contentChanged=false;
 const observer=new MutationObserver(records=>{
  if(records.some(record=>oldRoot&&(record.target===oldRoot||oldRoot.contains(record.target)||[...record.removedNodes].some(n=>n===oldRoot||(n.contains&&n.contains(oldRoot))))))contentChanged=true;
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 try{
  select.selectedIndex=idx;select.value=select.options[idx].value;
  if(typeof select.onchange==='function'){select.onchange.call(select,new Event('change',{bubbles:true}));}
  else{select.dispatchEvent(new Event('change',{bubbles:true}));}
  await sleep(1000);
  const ready=await waitFor(()=>{
   const current=kind==='country'?countrySelect():divisionSelect();if(!current||String(current.value)!==String(target.value))return null;
   const tab=document.getElementById('resultsTableTab');if(tab&&!resultsNavigationRoot())clickReal(tab);
   const root=resultsNavigationRoot();if(!root)return null;
   const now=pageIds().slice().sort().join('|');if(now&&now!==before)return true;
   const refreshed=contentChanged||root!==oldRoot||root.innerHTML!==oldHTML;
   return refreshed&&noResultsPage()?true:null;
  },22000);
  if(!ready)throw Error('Cambio '+kind+': nuovi risultati non caricati');return true;
 }finally{observer.disconnect();}
}

/* PROCESS */
async function processPage(){
 setPhase("LETTURA RESULTS");const rows=resultRows();const split=splitExisting(rows);
 S.scanned+=rows.length;S.fresh+=split.fresh.length;S.skip+=split.skipped.length;updateUI();
 const c=context();const d=dateInfo();
 if(split.skipped.length)log("SKIP "+split.skipped.length+" · "+(c.sm_country||"-")+" · "+(c.sm_division||"-")+" · "+(d.match_date||"-"),"skip");
 if(split.fresh.length){
  setPhase("SALVATAGGIO");const written=await insertRows(split.fresh);
  log("NUOVI "+split.fresh.length+" · SALVATI "+written+" · "+(c.sm_country||"-")+" · "+(c.sm_division||"-")+" · "+(d.match_date||"-"),"new");
 }else if(rows.length){log("Pagina già importata · "+(c.sm_country||"-")+" · "+(c.sm_division||"-")+" · "+(d.match_date||"-"),"skip");}
 updateUI();return pageIds();
}
async function processSection(){
 if(S.stop)throw Error('Importazione interrotta');
 setPhase('PAGINA CORRENTE');
 const ids=pageIds();
 if(!ids.length){
  if(!noResultsPage())throw Error('Pagina risultati non pronta');
  log('SEZIONE SALTATA · nessun risultato');
 }else{
  await processPage();
  log('PAGINA COMPLETATA · senza backfill');
 }
 S.done++;updateUI();
}
async function run(){
 const divisions=plan("division");
 if(divisions){
  for(let i=0;i<divisions.length;i++){
   if(S.stop)throw Error("Importazione interrotta");
   if(i){setPhase("CAMBIO DIVISION");await switchTo("division",divisions[i]);}
   await processSection();
  }
 }else{await processSection();}
}

/* SHORTCUT */
function completeShortcutImmediately(){
 if(S.shortcutReleased)return;
 try{completion(JSON.stringify({ok:true,started:true,importer:"IMC Results"}));}catch(_){}
 S.shortcutReleased=true;
}
async function selectWorld(){
 const panel=document.querySelector("#__imc_results_clean #body");
 while(true){
  setBadge("CARICAMENTO MONDI");
  panel.textContent="Lettura del registro mondi IMC…";
  try{
   await loadWorlds();
  }catch(error){
   setBadge("REGISTRO NON DISPONIBILE");
   panel.textContent="Caricamento mondi interrotto. "+(error.message||String(error));
   const retry=document.createElement("button");
   retry.type="button";retry.textContent="Riprova";retry.style.display="block";
   panel.appendChild(retry);
   await new Promise(resolve=>{retry.onclick=resolve;});
   continue;
  }
  worldUI();setBadge("SCELTA MONDO");
  return chooseGW();
 }
}
/* MAIN */
async function main(){
 try{
  const world=await selectWorld();S.gw=world.id;S.legacyGw=world.legacy;S.worldName=world.name;
  if(!resultButtons().length&&!document.getElementById("resultsTableTab"))throw Error("Apri una pagina RISULTATI valida di Soccer Manager");
  S.importedAt=stamp();progressUI();setBadge("IN CORSO");setPhase("AVVIO");
  const dest=destination();log("START "+S.gw+" · "+(dest.database||"Routing Gateway")+" · "+dest.table);
  await preloadSeasons();await preloadExisting();await run();
  if(S.stop){finish("FERMATO");return;}
  finish("COMPLETATO");log("COMPLETATO · scansionati "+S.scanned+" · nuovi "+S.fresh+" · skip "+S.skip+" · salvati "+S.saved,"new");
 }catch(error){S.errors++;if(!document.getElementById("log")){const e=document.createElement("div");e.textContent=error.message||String(error);document.querySelector("#__imc_results_clean #body")?.replaceChildren(e);}else{updateUI();log(error.message||String(error),"error");}finish(S.stop?"FERMATO":"ERRORE");}
}
buildUI();main();completeShortcutImmediately();
})();
