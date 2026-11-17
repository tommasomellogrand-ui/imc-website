/*
   OWN GOAL PATCH V1.5
   - Scorers DOM resta fonte autoritativa per marcatore/minuto.
   - "(autorete)" viene salvato come scorers[].own_goal = 1.
   - players_json.goal_minutes contiene SOLO gol normali.
   - players_json.own_goals e own_goal_minutes conservano gli autogol.
   - Nessuna deduzione dal commentary.
*/

/* ================================================================
   IMC | MATCH REPORT IMPORT · V2.0 SENZA BACKFILL · RESULTS CANONICAL · GOAL MINUTES DAL DOM
   IMC UNIVERSAL GATEWAY · ONE ROW PER FIXTURE · Mondi IMC dal CORE · divisioni 1–5
   READ / WRITE: IMC Match Report · IMPORT / explicit
   Results usato solo per navigazione/fixture; contesto canonico valorizzato dai trigger MySQL.
   1 record per fixture: dati propri Match Report + team_stats_json, players_json,
   events_json, tactics_json, commentary_json.
   IDEMPOTENZA: game_world_id + sm_fixture_id · LOCAL SKIP
   Division -> Results -> Match Report -> Results
   Solo giornata mostrata in ogni divisione; nessun click su Precedenti.
   Minuti sostituzioni/cartellini: numero associato alla specifica icona DOM.
   ================================================================ */

(function () {
    "use strict";

    var VERSION = "IMC-MATCH-REPORT-V3.6-CORE-SCHEDULE";
    var SCANNER = "IMC_MATCH_REPORT_IMPORT_V1";

    var GATEWAY_URL =
        "https://www.italianmastersclub.it/imc-universal-gateway/";

var MATCH_REPORT_REPOSITORY =
        "IMC Match Report";

    var WORLDS = [];
    function explicitMatchReportDestination(){
        if(!/^IMC(?:00[1-9]|010)$/.test(STATE.gameWorld||""))throw new Error("Mondo IMC non valido");
        return {database:"Sql1956795_3",table:STATE.gameWorld+"_Match_Reports"};
    }
    async function loadWorlds(){
        var reply=await gateway({action:"list_imc_worlds"});
        if(!Array.isArray(reply.worlds))throw new Error("Registro mondi non disponibile");
        var seen=new Set();
        WORLDS=reply.worlds.filter(w=>/^IMC-(?:00[1-9]|010)$/.test(w.id)).map(w=>{
            var id=w.id.replace("-","");
            if(!clean(w.name)||!clean(w.legacy)||seen.has(id))throw new Error("Registro mondi incompleto o duplicato");
            seen.add(id);return {id:id,name:clean(w.name),legacy:clean(w.legacy)};
        }).sort((a,b)=>a.id.localeCompare(b.id));
        if(!WORLDS.length)throw new Error("Nessun mondo IMC configurato nel CORE");
    }

    /* CORE / Results / Schedule: contesto prima di aprire il report. */
    const S={gw:null,legacyGw:null,catalog:[],seasons:[],competition:null,season:null,leagueMode:false,worldcupEditions:[],results:new Map(),schedule:new Map()};
    function baseKey(value){
        var key=clean(value).replace(/^IMC-(\d{3})(?=[|_])/,'IMC$1');
        if(S.legacyGw&&key.startsWith(S.legacyGw+'|'))key=S.gw+key.slice(S.legacyGw.length);
        if(key.startsWith(S.gw+'_'))key=S.gw+'|IMC|'+key.slice(S.gw.length+1);
        key=key.replace(/^(IMC\d{3})\|S\d+\|/,'$1|');
        if(!key.startsWith(S.gw+'|'))throw new Error('Chiave non appartenente al mondo scelto');
        return key;
    }
    function competitionKey(c,season=S.season){
        if(!Number.isSafeInteger(Number(season))||Number(season)<1)throw new Error('IMC Season non valida');
        return S.gw+'|S'+String(Number(season)).padStart(2,'0')+baseKey(c.key).slice(S.gw.length);
    }
    function reportDivisionPlan(){
        var plan=selectPlan('division');if(plan)return plan;
        var sel=divisionSelect();return sel?Array.from(sel.options).filter(o=>!o.disabled&&isDivisionText(o.textContent)).map(o=>({value:o.value,text:o.textContent,index:o.index})):null;
    }
    async function readIdentityRows(repository,table,visit){
        var offset=0;
        for(var page=0;page<1000;page++){
            if(STATE.stopped)throw new Error('Importazione interrotta');
            var reply=await gateway({action:'read',game_world_id:S.gw,repository,route_mode:'explicit',target_database:'Sql1956795_3',target_table:table,limit:5000,offset});
            if(reply.database!=='Sql1956795_3'||(reply.physical_table||reply.table)!==table)throw new Error('Destinazione '+repository+' non corrispondente');
            gatewayRows(reply).forEach(visit);
            if(!reply.has_more)return;
            var next=Number(reply.next_offset);if(!Number.isSafeInteger(next)||next<=offset)throw new Error('Paginazione non valida');offset=next;
        }
        throw new Error('Troppe pagine '+repository);
    }
    async function prepareReportImport(){
        S.gw=STATE.gameWorld;S.legacyGw=STATE.legacyWorld;
        setPhase('Leggo competizioni dal CORE');
        var catalog=await gateway({action:'list_imc_competitions',game_world_id:S.gw,scope:'all',include_seasons:true,include_clubs:true});
        S.catalog=(catalog.competitions||[]).map(c=>({...c,group:clean(c.group).toUpperCase(),sm_action:normalizedAction(c.sm_action),sm_division:normalizedDivision(c.sm_division)}));
        S.seasons=(catalog.seasons||[]).map(s=>({imc_season:Number(s.imc_season),start:clean(s.imc_season_start_date),end:clean(s.imc_season_end_date)||null})).filter(s=>Number.isSafeInteger(s.imc_season)&&s.imc_season>0&&s.start).sort((a,b)=>a.start.localeCompare(b.start));
        if(!S.catalog.length||!S.seasons.length)throw new Error('Competizioni o stagioni CORE mancanti');
        var seen=new Set();S.catalog.forEach(c=>{var k=baseKey(c.key);if(seen.has(k)||!c.name||!c.sm_action||!['DOMESTIC','INTERNATIONAL','IMC','NATIONS'].includes(c.group))throw new Error('Catalogo CORE incoerente');seen.add(k);});
        S.clubs=Array.isArray(catalog.clubs)?catalog.clubs:[];
        S.worldcupEditions=Array.isArray(catalog.worldcup_editions)?catalog.worldcup_editions:[];
        await chooseCatalog();renderProgressUI();
        S.results.clear();S.schedule.clear();
        function index(map,row){var id=Number(row.sm_fixture_id);if(!Number.isSafeInteger(id)||id<1)return;var list=map.get(id)||[];list.push(row);map.set(id,list);}
        setPhase('Leggo Results e Schedule');
        await readIdentityRows('IMC Results',S.gw+'_Results',row=>index(S.results,row));
        await readIdentityRows('IMC Schedule',S.gw+'_Schedule',row=>index(S.schedule,row));
        log('CORE · '+S.competition.name+' · S'+String(S.season).padStart(2,'0')+' · identità fixture caricate','ok');
    }
    function sourceIdentity(rows,id){
        var chosen=null,signature=null;
        (rows||[]).forEach(row=>{
            var season=Number(row.imc_season);if(!Number.isSafeInteger(season)||season<1||!row.competition_key)throw new Error('Identità incompleta per fixture '+id);
            var key=competitionKey({key:row.competition_key},season),keySeason=clean(row.competition_key).match(/\|S(\d+)\|/);
            if(keySeason&&Number(keySeason[1])!==season)throw new Error('Stagione e chiave discordanti per fixture '+id);
            var sign=JSON.stringify([key,season,row.match_date,row.home_sm_club_id||row.home_sm_team_id,row.away_sm_club_id||row.away_sm_team_id]);
            if(signature&&signature!==sign)throw new Error('Fixture '+id+': record sorgente discordanti');
            chosen={...row,competition_key:key,imc_season:season};signature=sign;
        });
        return chosen;
    }
    function worldCupKnockout(row){
        if(!row||normalizedAction(row.sm_action)!=='worldcup'||row.competition_group!=='NATIONS'||clean(row.competition_group_name))return false;
        return [row.competition_stage,row.competition_round].some(value=>/^(?:(?:ottavi|quarti|sedicesimi|semifinal[ei]?|finalee?|final|semi.?finals?|quarter.?finals?)(?:\b|$)|round of (?:16|32)\b|knock[ -]?out\b|eliminazione diretta\b)/i.test(clean(value)));
    }
    function sameReportKey(key,identity){
        if(key===identity.competition_key)return true;
        if(identity.sm_action!=='worldcup'||identity.competition_group!=='NATIONS')return false;
        var base=S.gw+'|NATIONS|worldcup';
        var edition=competitionKey({key:base},identity.imc_season);
        return (key===base||key===edition)&&(identity.competition_key===base||identity.competition_key===edition);
    }
    function reportIdentity(id){
        id=Number(id);if(!Number.isSafeInteger(id)||id<1)throw new Error('Fixture ID non valido');
        var c=S.competition,raw=context(),date=resultsDateInfo();
        if(S.leagueMode){
            var division=normalizedDivision(raw.sm_division);
            c=S.catalog.find(x=>x.group==='DOMESTIC'&&x.sm_action==='league'&&x.sm_division===division);
            if(!c)throw new Error('Divisione non configurata nel CORE');
        }
        var result=sourceIdentity(S.results.get(id),id),schedule=sourceIdentity(S.schedule.get(id),id);
        if(result&&schedule&&(result.competition_key!==schedule.competition_key||result.imc_season!==schedule.imc_season))throw new Error('Fixture '+id+': Results e Schedule assegnati a competizioni o stagioni diverse');
        if(result&&schedule){
            for(var side of ['home','away']){var ri=Number(result[side+'_sm_club_id']),si=Number(schedule[side+'_sm_team_id']);if(ri>0&&si>0&&ri!==si)throw new Error('Fixture '+id+': squadre discordanti tra Results e Schedule');}
            if(result.match_date&&schedule.match_date&&result.match_date!==schedule.match_date)throw new Error('Fixture '+id+': date discordanti tra Results e Schedule');
        }
        var source=result||schedule;
        if(source&&baseKey(source.competition_key)!==baseKey(c.key))throw new Error('Fixture '+id+': hai scelto '+c.name+' ma risulta '+source.competition_key);
        if(c.sm_action==='worldcup'&&!worldCupKnockout(result)){
            if(!result)throw new Error('World Cup: importa prima il risultato ufficiale della fixture '+id);
            throw new Error('World Cup: usa l’importer della partita singola per i gironi');
        }
        var found=normalizedAction(raw.sm_action);
        if(found&&c.group!=='IMC'&&found!==c.sm_action&&!(c.sm_action==='worldcup'&&found==='interqualifier')&&!(c.sm_action==='playoff'&&found==='league'&&/play[\s-]*off/i.test([date.competition_stage,date.competition_round].join(' '))))throw new Error('Pagina SM incompatibile con '+c.name);
        var season=source?source.imc_season:S.season;
        if(source&&(normalizedAction(source.sm_action)!==c.sm_action||source.competition_group!==c.group))throw new Error('Metadati della fixture discordanti dalla competizione CORE');
        var out={competition_key:source?source.competition_key:competitionKey(c,season),imc_season:season,sm_action:source?.sm_action||c.sm_action,sm_division:normalizedDivision(source?.sm_division)||c.sm_division,competition_group:source?.competition_group||c.group};
        ['competition_stage','competition_round','competition_group_name','match_date','home_name','away_name','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score'].forEach(k=>{out[k]=result?.[k]??schedule?.[k]??(k==='match_date'?date.match_date:k==='competition_stage'?date.competition_stage:k==='competition_round'?date.competition_round:null);});
        out.home_sm_club_id=result?.home_sm_club_id??schedule?.home_sm_team_id??null;out.away_sm_club_id=result?.away_sm_club_id??schedule?.away_sm_team_id??null;
        if(!out.competition_group_name){var button=resultButton(String(id));out.competition_group_name=button?fixtureGroupName(button):null;}
        if(!out.match_date)throw new Error('Data partita assente per fixture '+id);
        if(/knockout|ottavi|quarti|semifinal|sedicesimi|\bfinale?\b/i.test([out.competition_stage,out.competition_round].join(' ')))out.competition_group_name=null;
        if(c.sm_action==='worldcup')out.competition_key=baseKey(out.competition_key);
        out.hasResult=Boolean(result);
        return out;
    }
function fixtureGroupName(button){
 const root=button.closest('[id="competitionResultsContent"]')||button.closest('[id="leagueResultsContainer"]');
 if(!root)return null;
 const container=button.closest('[id$="_results"]');
 if(container){
  const header=[...root.querySelectorAll('[id="groupHeader"],.groupHeader')].find(h=>{
   const m=(attr(h,'onclick')||'').match(/toggleVisibility\s*\(\s*['"]([^'"]+)['"]/);return m&&m[1]===container.id;
  });
  if(header){const m=clean(header.textContent).match(/^(?:girone|gruppo|group)\s+([a-z]{1,2}|[1-9]\d*)$/i);return m?'Girone '+m[1].toUpperCase():null;}
 }
 // Nel DOM ogni blocco contiene la propria intestazione e N_results.
 // Non risalire fino alla radice comune a tutti i gironi.
 for(let node=button.parentElement;node&&node!==root;node=node.parentElement){
  const header=[...node.children].find(e=>e.matches('[id="groupHeader"],.groupHeader,.sectionheading')&&/^(girone|group)\b/i.test(clean(e.textContent)));
  if(header){
   const text=clean(header.textContent);
   const m=text.match(/^(?:girone|gruppo|group)\s+([a-z]{1,2}|[1-9]\d*)$/i);
   return m?"Girone "+(/^\d+$/.test(m[1])?String(Number(m[1])):m[1].toUpperCase()):null;
  }
 }
 return null;
}
    function reportTeamId(team,identity,side){
        var known=Number(identity[side+'_sm_club_id']),read=Number(team.id);
        if(known>0&&read>0&&known!==read)throw new Error('Squadra '+side+' del report diversa dalla fixture');
        return read>0?read:known>0?known:null;
    }
    function reportScore(id){
        var raw=textById(id);if(!/^\d+$/.test(clean(raw)))throw new Error('Punteggio Match Report non leggibile');
        return Number(raw);
    }
    function reportMinute(raw){
        var m=clean(raw).match(/^(\d{1,3})(?:\s*\+\s*(\d{1,2}))?['’]?$/);return m?Number(m[1])+Number(m[2]||0):null;
    }
    function jsonValue(value){if(typeof value==='string'){try{return JSON.parse(value);}catch(_){return null;}}return value;}
    function reportSideComplete(row,stats,side){
        if(Number(row[side+'_sm_club_id'])>0)return true;
        if(row.competition_group!=='IMC')return false;
        return stats?.[side]?.guest===true || row[side+'_manager_name']==='GUEST';
    }
    function completeReport(row){
        var players=jsonValue(row.players_json),stats=jsonValue(row.team_stats_json);
        return !!(row.competition_key&&Number(row.imc_season)>0&&row.sm_action&&row.competition_group&&row.match_date&&reportSideComplete(row,stats,'home')&&reportSideComplete(row,stats,'away')&&row.home_name&&row.away_name&&row.home_score!==null&&row.home_score!==undefined&&row.away_score!==null&&row.away_score!==undefined&&Array.isArray(players)&&players.length&&stats&&stats.home&&stats.away);
    }
    function stableJson(value){
        if(Array.isArray(value))return value.map(stableJson);
        if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stableJson(value[k])]));
        return value;
    }
    function mergeMissing(current,incoming){
        if(current==null||current==='')return incoming;
        if(Array.isArray(current))return current.length?current:incoming;
        if(current&&incoming&&typeof current==='object'&&typeof incoming==='object'&&!Array.isArray(incoming)){
            var out={...current};Object.keys(incoming).forEach(k=>{out[k]=mergeMissing(current[k],incoming[k]);});return out;
        }
        return current;
    }
    async function repairExistingReport(row){
        var dest=explicitMatchReportDestination();
        var envelope={game_world_id:STATE.gameWorld,repository:MATCH_REPORT_REPOSITORY,route_mode:'explicit',target_database:dest.database,target_table:dest.table};
        var read=await gateway({...envelope,action:'read',where:{sm_fixture_id:row.sm_fixture_id},limit:2,offset:0});
        if(read.database!==dest.database||(read.physical_table||read.table)!==dest.table||read.has_more||read.rows?.length!==1)throw new Error('Report da completare assente o duplicato');
        var old=read.rows[0];
        if((clean(old.competition_key)&&!sameReportKey(old.competition_key,row))||(Number(old.imc_season)>0&&Number(old.imc_season)!==Number(row.imc_season)))throw new Error('Report esistente di competizione o stagione diversa');
        var expected={...old};
        Object.keys(row).forEach(k=>{expected[k]=k.endsWith('_json')?mergeMissing(jsonValue(old[k]),row[k]):mergeMissing(old[k],row[k]);});
        expected.imc_season=Number(expected.imc_season);
        if(!completeReport(expected))throw new Error('Non tutti i dati mancanti sono recuperabili dal report');
        setPhase('Completo report già presente');
        var reply=await gateway({...envelope,action:'repair_report',row});
        if(reply.database!==dest.database||(reply.physical_table||reply.table)!==dest.table||Number(reply.matched_rows)!==1||Number(reply.updated_rows)!==1)throw new Error('Completamento Match Report non confermato');
        await verifyStoredReport(expected);
        STATE.existingMeta.set(String(Number(row.sm_fixture_id)),{key:expected.competition_key,season:expected.imc_season,complete:true});
        STATE.reportsUpdated++;STATE.rowsUpdated++;
        STATE.lastBatch={sent:1,written:1,updated:1,skipped:0,database:dest.database,table:dest.table,trace_id:reply.trace_id||null};
        log('Fixture '+row.sm_fixture_id+' · UPDATED · report completato senza duplicarlo','ok');updateUI();return 1;
    }
    async function verifyStoredReport(row){
        var dest=explicitMatchReportDestination();
        var reply=await gateway({action:'read',game_world_id:STATE.gameWorld,repository:MATCH_REPORT_REPOSITORY,route_mode:'explicit',target_database:dest.database,target_table:dest.table,where:{sm_fixture_id:row.sm_fixture_id},limit:10,offset:0});
        var saved=gatewayRows(reply);
        if(reply.database!==dest.database||(reply.physical_table||reply.table)!==dest.table||reply.has_more||saved.length!==1)throw new Error('Salvataggio da verificare: fixture assente o duplicata');
        saved=saved[0];
        if(!completeReport(saved)||!sameReportKey(saved.competition_key,row)||Number(saved.imc_season)!==row.imc_season||saved.sm_action!==row.sm_action||saved.fingerprint!==row.fingerprint)throw new Error('Identità o contenuto salvati non corrispondenti: verifica il database prima di riprovare');
        ['competition_group','sm_division','competition_group_name','competition_stage','competition_round','match_date','home_sm_club_id','away_sm_club_id','home_score','away_score','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score'].forEach(k=>{if(clean(saved[k])!==clean(row[k]))throw new Error('Verifica '+k+' fallita dopo il salvataggio');});
        ['players_json','team_stats_json','events_json','tactics_json','commentary_json'].forEach(k=>{if(JSON.stringify(stableJson(jsonValue(saved[k])))!==JSON.stringify(stableJson(jsonValue(row[k]))))throw new Error('Verifica '+k+' fallita dopo il salvataggio');});
    }

function normalizedAction(value){
 const compact=norm(value).replace(/\s+/g,"");
 const aliases={friendlies:"friendly",playoffs:"playoff",smfasupercup:"supercup",worldcupqualifying:"interqualifier"};
 return aliases[compact]||compact||null;
}
function normalizedDivision(value){
 const m=clean(value).match(/^(?:division(?:e)?\s*)?0*(\d+)$/i);
 return m&&Number(m[1])>0?String(Number(m[1])):null;
}

function macro(a){
 a=normalizedAction(a);
 if(["league","leaguecup","leagueshield","charityshield","playoff","friendly"].includes(a))return"DOMESTIC";
 if(["smfacup","smfashield","supercup"].includes(a))return"INTERNATIONAL";
 if(["interqualifier","worldcup"].includes(a))return"NATIONS";
 return null;
}
function unusedDivisionSelect(){return [...document.querySelectorAll("select")].find(s=>visible(s)&&[...s.options].some(o=>/^division(?:e)?\s+\d+$/i.test(clean(o.textContent))))||null;}
function unusedCountrySelect(){const s=document.querySelector("#country-selector select");return s&&visible(s)?s:null;}
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

const MONTH={gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,luglio:7,agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12};
function resultsDateInfo(){
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

async function catalogChoice(title,choices){
 const panel=document.querySelector('#__imc_body');panel.replaceChildren();
 const h=document.createElement('div');h.textContent=title;h.style.cssText='font-size:13px;font-weight:950;margin-bottom:10px';panel.appendChild(h);
 return new Promise(resolve=>choices.forEach(c=>{
  const b=document.createElement('button');b.type='button';b.textContent=c.label;b.disabled=!!c.disabled;
  b.style.cssText='display:block;width:100%;min-height:64px;margin-bottom:7px;padding:10px 6px;border:1px solid #dedfed;border-radius:13px;background:#fff;color:#4e4191;font-weight:900';
  b.onclick=()=>resolve(c.value);panel.appendChild(b);
 }));
}
async function chooseCatalog(){
 while(true){
  setBadge('TIPO COMPETIZIONE');
  const group=await catalogChoice('TIPO COMPETIZIONE',['DOMESTIC','INTERNATIONAL','IMC','NATIONS'].map(g=>({label:g,value:g,disabled:!S.catalog.some(c=>c.group===g)})));
  const choices=[];let leagueAdded=false;
  for(const c of S.catalog.filter(c=>c.group===group)){
   const league=group==='DOMESTIC'&&c.sm_action==='league';
   if(league&&leagueAdded)continue;if(league)leagueAdded=true;
   choices.push({label:league?'League':c.name,value:{competition:c,league}});
  }
  choices.push({label:'Indietro',value:null});setBadge('COMPETIZIONE');
  const selected=await catalogChoice('SCEGLI LA COMPETIZIONE',choices);if(!selected)continue;
  S.competition=selected.competition;S.leagueMode=selected.league;
  const date=resultsDateInfo().match_date||new Date().toISOString().slice(0,10);
  const candidates=S.seasons.filter(s=>s.start<=date);S.season=(candidates.at(-1)||S.seasons[0]).imc_season;
  if(S.competition.sm_action==='worldcup'){
   const edition=S.worldcupEditions.filter(e=>!e.final_date&&e.edition_start<=date).sort((a,b)=>b.edition_start.localeCompare(a.edition_start))[0];
   if(edition&&S.seasons.some(s=>s.imc_season===Number(edition.imc_season)))S.season=Number(edition.imc_season);
  }
  setBadge('IMC SEASON');
  const panel=document.querySelector('#__imc_body');panel.replaceChildren();
  const summary=document.createElement('p');summary.textContent=(S.leagueMode?'League':S.competition.name)+' · '+group;panel.appendChild(summary);
  const label=document.createElement('label');label.textContent='IMC Season dell’edizione';
  const select=document.createElement('select');select.id='__imc_mr_season';select.style.cssText='display:block;width:100%;margin:10px 0;padding:10px';
  for(const s of S.seasons){const o=document.createElement('option');o.value=s.imc_season;o.textContent='S'+String(s.imc_season).padStart(2,'0')+' · dal '+s.start;select.appendChild(o);}
  select.value=String(S.season);select.onchange=()=>{S.season=Number(select.value);};label.appendChild(select);panel.appendChild(label);
  const note=document.createElement('p');note.textContent='Le fixture presenti nella Schedule manterranno la chiave e la stagione già registrate.';panel.appendChild(note);
  const start=document.createElement('button');start.id='__imc_mr_start';start.textContent='AVVIA IMPORTAZIONE';start.style.cssText='width:100%;min-height:46px;border:1px solid #dedfed;border-radius:13px;background:#fff;color:#4e4191;font-weight:900';panel.appendChild(start);
  await new Promise(resolve=>{start.onclick=resolve;});
  if(S.leagueMode){
   const divisionPlan=reportDivisionPlan();
   if(!divisionPlan)throw Error('Apri la pagina League con il menu divisioni');
   for(const option of divisionPlan){if(!S.catalog.some(c=>c.group==='DOMESTIC'&&c.sm_action==='league'&&c.sm_division===normalizedDivision(option.text)))throw Error('Divisione '+option.text+' assente nel CORE');}
  }
  return;
 }
}

    var STATE = {
        running: false,
        stopped: false,
        completionSent: false,
        manualCharityShield: false,

        gameWorld: null,
        worldName: null,
        legacyWorld: null,
        importedAt: null,
        loggedManagerId: null,

        currentCountry: null,
        currentDivision: null,
        currentFixture: null,

        fixturesSeen: 0,
        reportsOpened: 0,
        reportsSkipped: 0,
        reportsSaved: 0,
        reportsUpdated: 0,
        rowsUpdated: 0,
        rowsSaved: 0,
        errors: 0,

        existingReports: new Set(),
        localSkipReports: 0,

        lastBatch: {
            sent: 0,
            written: 0,
            skipped: 0,
            database: null,
            table: null,
            trace_id: null
        },

        logRows: []
    };

    function q(selector) {
        return document.querySelector(selector);
    }

    function qa(selector) {
        return Array.prototype.slice.call(
            document.querySelectorAll(selector)
        );
    }

    function clean(value) {
        return String(value == null ? "" : value)
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function norm(value) {
        return clean(value)
            .toLocaleLowerCase("it-IT")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function attr(el, name) {
        try {
            return el ? el.getAttribute(name) : null;
        } catch (_) {
            return null;
        }
    }

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function visible(el) {
        try {
            if (!el || el.nodeType !== 1) return false;
            if (el.closest && el.closest("#workingCopy")) return false;

            var style = window.getComputedStyle(el);
            var rect = el.getBoundingClientRect();

            return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Number(style.opacity) !== 0 &&
                rect.width > 0 &&
                rect.height > 0
            );
        } catch (_) {
            return false;
        }
    }

    async function waitFor(test, timeout, interval) {
        timeout = timeout || 18000;
        interval = interval || 150;

        var started = Date.now();

        while (Date.now() - started < timeout) {
            if (STATE.stopped) {
                throw new Error("Importazione interrotta");
            }

            try {
                var result = test();
                if (result) return result;
            } catch (_) {}

            await sleep(interval);
        }

        return null;
    }

    function intValue(value) {
        var raw = clean(value).replace(/[^\d-]/g, "");
        if (!raw) return null;

        var number = Number(raw);
        return Number.isFinite(number) ? number : null;
    }

    function numberValue(value) {
        var raw = clean(value).replace(",", ".");
        if (!raw) return null;

        var number = Number(raw);
        return Number.isFinite(number) ? number : null;
    }

    function nowMysql() {
        var d = new Date();

        function pad(n) {
            return String(n).padStart(2, "0");
        }

        return (
            d.getFullYear() + "-" +
            pad(d.getMonth() + 1) + "-" +
            pad(d.getDate()) + " " +
            pad(d.getHours()) + ":" +
            pad(d.getMinutes()) + ":" +
            pad(d.getSeconds())
        );
    }

    async function sha256(value) {
        var text = String(value == null ? "" : value);

        if (
            window.crypto &&
            window.crypto.subtle &&
            window.TextEncoder
        ) {
            var bytes = new TextEncoder().encode(text);
            var digest = await window.crypto.subtle.digest(
                "SHA-256",
                bytes
            );

            return Array.prototype
                .map.call(
                    new Uint8Array(digest),
                    function (b) {
                        return b.toString(16).padStart(2, "0");
                    }
                )
                .join("");
        }

        var h1 = 2166136261 >>> 0;
        var h2 = 2246822519 >>> 0;

        for (var i = 0; i < text.length; i++) {
            h1 ^= text.charCodeAt(i);
            h1 = Math.imul(h1, 16777619) >>> 0;

            h2 ^= text.charCodeAt(i);
            h2 = Math.imul(h2, 3266489917) >>> 0;
        }

        var a = h1.toString(16).padStart(8, "0");
        var b = h2.toString(16).padStart(8, "0");

        return (
            a + b + b + a +
            a + b + b + a
        ).slice(0, 64);
    }

    async function fingerprint(row, parts) {
        row.fingerprint = await sha256(
            (parts || [])
                .map(function (value) {
                    return value == null ? "" : String(value);
                })
                .join("|")
        );

        return row;
    }

    function readLoggedManagerId() {
        var scid = q("#scid");

        if (scid) {
            var direct = intValue(
                scid.value ||
                scid.textContent ||
                scid.innerText
            );

            if (direct !== null) {
                return direct;
            }
        }

        try {
            if (typeof window.CUSTOMERID !== "undefined") {
                var customerId = Number(window.CUSTOMERID);

                if (Number.isFinite(customerId)) {
                    return customerId;
                }
            }
        } catch (_) {}

        return null;
    }

    /* ============================================================
       UI
       ============================================================ */

    function removeUI() {
        var old = q("#__imc_match_report_v1");
        if (old) old.remove();
    }

    function log(message, type) {
        type = type || "info";

        STATE.logRows.push({
            at: new Date().toISOString(),
            type: type,
            message: clean(message)
        });

        var root = q("#__imc_log");

        if (!root) return;

        var icon =
            type === "ok" ? "✅" :
            type === "error" ? "❌" :
            type === "warn" ? "⚠️" :
            type === "skip" ? "↪️" :
            "•";

        var row = document.createElement("div");
        row.style.marginBottom = "3px";
        row.textContent = icon + " " + message;

        root.appendChild(row);
        root.scrollTop = root.scrollHeight;

        setText(
            "#__imc_last",
            message
        );
    }

    function buildUI() {
        removeUI();

        var overlay = document.createElement("div");
        overlay.id = "__imc_match_report_v1";

        overlay.style.cssText =
            "position:fixed;inset:0;z-index:2147483647;" +
            "background:rgba(18,22,34,.30);" +
            "backdrop-filter:blur(2px);" +
            "-webkit-backdrop-filter:blur(2px);" +
            "font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
            "color:#171b2a;box-sizing:border-box;" +
            "padding:max(6px,env(safe-area-inset-top)) 6px max(6px,env(safe-area-inset-bottom));overflow:hidden;";

        overlay.innerHTML =
            '<div style="width:min(100%,420px);max-width:100%;height:100%;margin:0 auto;background:#f8f8fd;border:1px solid #e3e4ec;border-radius:22px;box-shadow:0 14px 44px rgba(20,24,40,.32);overflow:hidden;display:flex;flex-direction:column;">' +
                '<div style="background:#fff;padding:13px 15px 12px;border-bottom:1px solid #e5e6ee;flex:0 0 auto;">' +
                    '<div style="font-size:9px;letter-spacing:2.3px;font-weight:950;color:#7153d8;margin-bottom:4px;">IMC · MATCH REPORT IMPORT</div>' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;gap:7px;">' +
                        '<div style="font-size:18px;line-height:1;font-weight:900;letter-spacing:-.4px;">MATCH REPORT V3.6 · SENZA BACKFILL</div>' +
                        '<div id="__imc_badge" style="background:#eee8ff;color:#6548c8;padding:8px 11px;border-radius:999px;font-weight:950;font-size:9px;white-space:nowrap;">PRONTO</div>' +
                    '</div>' +
                '</div>' +
                '<div style="flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:9px;">' +
                    '<div id="__imc_body"></div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    function renderWorldSelection(){
        var root=q("#__imc_body");
        root.innerHTML='<div style="font-size:18px;font-weight:900;margin:12px 0">SELEZIONA MONDO IMC</div><div id="__imc_worlds" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px"></div>';
        WORLDS.forEach(function(world){
            var button=document.createElement("button");
            button.style.cssText="min-height:70px;padding:12px 7px;border:1px solid #dedced;border-radius:13px;background:#fff;color:#473c83;font-weight:900";
            button.innerHTML='<strong>'+esc(world.id)+'</strong><span style="display:block;font-size:11px;margin-top:6px">'+esc(world.name)+'</span>';
            button.onclick=function(){
                if(STATE.running)return;
                STATE.gameWorld=world.id;STATE.worldName=world.name;STATE.legacyWorld=world.legacy;
                renderProgressUI();setTimeout(function(){main().catch(fatal);},0);
            };
            q("#__imc_worlds").appendChild(button);
        });
    }
    async function boot(){
        try{setBadge("CARICAMENTO MONDI");await loadWorlds();renderWorldSelection();setBadge("SCELTA MONDO");}
        catch(error){q("#__imc_body").textContent=error.message||String(error);setBadge("ERRORE");}
    }
    function statBox(label, id) {
        return '<div style="background:#fff;border:1px solid #e2e3eb;border-radius:13px;padding:8px 5px;min-width:0;">' +
            '<div style="font-size:6.8px;letter-spacing:.9px;font-weight:950;color:#959aad;">' + label + '</div>' +
            '<div id="' + id + '" style="font-size:20px;line-height:1.05;font-weight:950;margin-top:4px;">0</div></div>';
    }

    function renderProgressUI() {
        var root =
            q("#__imc_body");

        root.innerHTML =
            '<div style="display:flex;flex-direction:column;gap:7px;width:100%;max-width:100%;overflow:hidden;">' +

                '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;">' +
                    '<div style="min-width:0;background:linear-gradient(145deg,#ffffff,#f5f2ff);border:1px solid #e4def8;border-radius:17px;padding:11px 12px;">' +
                        '<div style="font-size:7px;letter-spacing:1.2px;font-weight:900;color:#8f88a7;">GAME WORLD</div>' +
                        '<div style="font-size:22px;font-weight:900;margin-top:5px;">' +
                            esc(STATE.gameWorld+" · "+STATE.worldName) +
                        '</div>' +
                        '<div id="__imc_route" style="font-size:8px;font-weight:700;color:#777d8f;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">-</div>' +
                    '</div>' +

                    '<div style="min-width:0;background:linear-gradient(145deg,#ffffff,#eef7ff);border:1px solid #dbeaf5;border-radius:17px;padding:11px 12px;">' +
                        '<div style="font-size:7px;letter-spacing:1.2px;font-weight:900;color:#8693a0;">FASE</div>' +
                        '<div id="__imc_phase" style="font-size:13px;font-weight:900;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">-</div>' +
                        '<div id="__imc_batch_state" style="font-size:8px;font-weight:700;color:#697887;margin-top:5px;">batch -</div>' +
                    '</div>' +
                '</div>' +

                '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:10px 12px;min-width:0;">' +
                    '<div style="font-size:7px;letter-spacing:1.2px;font-weight:900;color:#969bad;">PARTITA CORRENTE</div>' +
                    '<div id="__imc_current" style="font-size:14px;font-weight:900;margin-top:5px;line-height:1.25;overflow-wrap:anywhere;">PREPARAZIONE</div>' +
                    '<div id="__imc_current_sub" style="font-size:8.5px;font-weight:700;color:#7153d8;margin-top:5px;overflow-wrap:anywhere;">-</div>' +
                '</div>' +

                '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:10px 12px;min-width:0;">' +
                    '<div style="font-size:7px;letter-spacing:1.2px;font-weight:900;color:#969bad;">NAZIONE / DIVISIONE</div>' +
                    '<div id="__imc_scope" style="font-size:14px;font-weight:900;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">- / -</div>' +
                    '<div id="__imc_context_meta" style="font-size:8.5px;font-weight:700;color:#777d8f;margin-top:5px;overflow-wrap:anywhere;">-</div>' +
                '</div>' +

                '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;">' +
                    '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:14px;padding:8px 3px;text-align:center;min-width:0;"><div style="font-size:6px;font-weight:900;color:#969bad;">VISTE</div><div id="__imc_seen" style="font-size:18px;font-weight:900;margin-top:5px;">0</div></div>' +
                    '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:14px;padding:8px 3px;text-align:center;min-width:0;"><div style="font-size:8px;font-weight:900;color:#358c50;">SALVATI</div><div id="__imc_saved" style="font-size:22px;font-weight:900;margin-top:5px;">0</div></div>' +
                    '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:14px;padding:8px 3px;text-align:center;min-width:0;"><div style="font-size:8px;font-weight:900;color:#7153d8;">UPDATED</div><div id="__imc_updated" style="font-size:22px;font-weight:900;margin-top:5px;">0</div></div>' +
                    '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:14px;padding:8px 3px;text-align:center;min-width:0;"><div style="font-size:8px;font-weight:900;color:#a96700;">SALTATI</div><div id="__imc_skip" style="font-size:22px;font-weight:900;margin-top:5px;">0</div></div>' +
                    '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:14px;padding:8px 3px;text-align:center;min-width:0;"><div style="font-size:6px;font-weight:900;color:#969bad;">ERRORI</div><div id="__imc_errors" style="font-size:18px;font-weight:900;margin-top:5px;">0</div></div>' +
                '</div>' +

                '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;">' +
                    '<div style="background:linear-gradient(145deg,#fffaf7,#fff3ed);border:1px solid #f1ded4;border-radius:15px;padding:9px 10px;min-width:0;">' +
                        '<div style="font-size:6.5px;letter-spacing:1px;font-weight:900;color:#a57966;">SKIP LOCALI</div>' +
                        '<div id="__imc_local_skip" style="font-size:21px;font-weight:900;color:#8b5c49;margin-top:5px;">0</div>' +
                        '<div style="font-size:7.5px;font-weight:700;color:#9b7868;margin-top:3px;">fixture già importate</div>' +
                    '</div>' +

                    '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:15px;padding:9px 10px;min-width:0;">' +
                        '<div style="font-size:6.5px;letter-spacing:1px;font-weight:900;color:#969bad;">REPORT</div>' +
                        '<div id="__imc_report_meta" style="font-size:12px;font-weight:900;margin-top:5px;">0 aperti</div>' +
                        '<div id="__imc_rows_meta" style="font-size:8px;font-weight:700;color:#777d8f;margin-top:4px;">0 righe</div>' +
                        '<div id="__imc_filter_stats" style="font-size:10px;font-weight:700;margin-top:6px;line-height:1.4;">Saltati: 0</div>' +
                        '<div id="__imc_core_status" style="font-size:10px;margin-top:6px;line-height:1.4;">Mondi IMC dal CORE</div>' +
                    '</div>' +
                '</div>' +

                '<div style="background:linear-gradient(145deg,#f8fff9,#eef8f0);border:1px solid #d7eadb;border-radius:17px;padding:10px 12px;min-width:0;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
                        '<div style="min-width:0;">' +
                            '<div style="font-size:7px;letter-spacing:1.2px;font-weight:900;color:#5b8b66;">MATCH REPORT DESTINATION</div>' +
                            '<div id="__imc_dest_main" style="font-size:11px;font-weight:900;color:#2f5137;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">-</div>' +
                        '</div>' +
                        '<div id="__imc_dest_written" style="font-size:22px;font-weight:900;color:#2f5137;flex:0 0 auto;">0</div>' +
                    '</div>' +
                    '<div id="__imc_dest_meta" style="font-size:8px;font-weight:700;color:#58745e;margin-top:5px;overflow-wrap:anywhere;">NON ANCORA DISPONIBILE</div>' +
                '</div>' +

                '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:10px 12px;min-width:0;">' +
                    '<div style="font-size:7px;letter-spacing:1.2px;font-weight:900;color:#969bad;">ULTIMA AZIONE</div>' +
                    '<div id="__imc_last" style="font-size:9.5px;font-weight:800;margin-top:5px;line-height:1.35;overflow-wrap:anywhere;">-</div>' +
                '</div>' +

                '<details style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:9px 10px;min-width:0;">' +
                    '<summary style="cursor:pointer;list-style:none;font-size:8px;letter-spacing:1.4px;font-weight:900;color:#7153d8;">LOG LIVE</summary>' +
                    '<div id="__imc_log" style="height:165px;overflow:auto;-webkit-overflow-scrolling:touch;background:#f4f4f8;border-radius:12px;padding:8px;margin-top:8px;font:8px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere;"></div>' +
                '</details>' +

                '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;padding-bottom:max(2px,env(safe-area-inset-bottom));">' +
                    '<button id="__imc_stop" style="width:100%;height:46px;border:1px solid #efc8c4;border-radius:14px;background:#fff1ef;color:#b7463e;font-size:11px;font-weight:900;-webkit-appearance:none;">STOP</button>' +
                    '<button id="__imc_close" style="display:none;width:100%;height:46px;border:1px solid #dedfe8;border-radius:14px;background:#fff;color:#303443;font-size:11px;font-weight:900;-webkit-appearance:none;">CHIUDI</button>' +
                '</div>' +

            '</div>';

        q("#__imc_stop").onclick =
            function () {
                STATE.stopped = true;
                setBadge(
                    "ARRESTO…",
                    "#fff1dc",
                    "#a96700"
                );
                setPhase(
                    "STOP richiesto"
                );
            };

        q("#__imc_close").onclick =
            removeUI;

        updateUI();
    }

    function setText(selector, value) {
        var el = q(selector);
        if (el) el.textContent = String(value);
    }

    function setBadge(text, background, color) {
        var el = q("#__imc_badge");

        if (!el) return;

        el.textContent = text;

        if (background) el.style.background = background;
        if (color) el.style.color = color;
    }

    function setCurrent(title, subtitle) {
        setText("#__imc_current", title || "-");
        setText("#__imc_current_sub", subtitle || "-");
    }

    function setPhase(value) {
        setText("#__imc_phase", value || "-");
    }

    function updateUI() {
        setText("#__imc_filter_stats", "Già presenti: " + STATE.localSkipReports);
        setText("#__imc_core_status", 'CORE · '+(S.competition?.name||'competizione da scegliere')+' · S'+String(S.season||'-').padStart(2,'0'));
        setText(
            "#__imc_scope",
            (STATE.currentCountry || "-") +
            " / " +
            (STATE.currentDivision || "-")
        );

        setText(
            "#__imc_seen",
            STATE.fixturesSeen
        );

        setText("#__imc_updated",STATE.reportsUpdated);
        setText(
            "#__imc_saved",
            STATE.reportsSaved
        );

        setText(
            "#__imc_skip",
            STATE.reportsSkipped
        );

        setText(
            "#__imc_errors",
            STATE.errors
        );

        setText(
            "#__imc_local_skip",
            STATE.localSkipReports
        );

        setText(
            "#__imc_report_meta",
            STATE.reportsOpened +
            " aperti"
        );

        setText(
            "#__imc_rows_meta",
            STATE.rowsSaved + " nuove · " + STATE.rowsUpdated + " updated"
        );

        setText(
            "#__imc_context_meta",
            [
                "fixture " +
                    (
                        STATE.currentFixture ||
                        "-"
                    ),

                "GW " +
                    (
                        STATE.gameWorld ||
                        "-"
                    )
            ].join(" · ")
        );

        try {
            var explicit =
                explicitMatchReportDestination();

            setText(
                "#__imc_route",
                explicit.database +
                " · " +
                explicit.table
            );
        } catch (_) {
            setText(
                "#__imc_route",
                "routing non configurato"
            );
        }

        var batch =
            STATE.lastBatch || {};

        setText(
            "#__imc_batch_state",
            batch.sent
                ? (
                    batch.written +
                    (batch.updated ? " updated · " : " written · ") +
                    batch.skipped +
                    " skip"
                  )
                : "batch -"
        );

        setText(
            "#__imc_dest_main",
            batch.table || "-"
        );

        setText(
            "#__imc_dest_written",
            batch.written || 0
        );

        setText(
            "#__imc_dest_meta",
            batch.database &&
            batch.table
                ? (
                    "db " +
                    batch.database +
                    " · sent " +
                    batch.sent +
                    (batch.updated ? " · updated " : " · written ") +
                    batch.written +
                    " · skip " +
                    batch.skipped +
                    " · trace " +
                    (
                        batch.trace_id ||
                        "-"
                    )
                  )
                : "NON ANCORA DISPONIBILE"
        );
    }

    function completeShortcutImmediately() {
        if (STATE.completionSent) return;

        STATE.completionSent = true;

        try {
            completion(
                JSON.stringify({
                    ok: true,
                    started: true,
                    scanner: SCANNER,
                    version: VERSION
                })
            );
        } catch (_) {}
    }

    function finish(status, message) {
        STATE.running = false;

        if (status === "ok") {
            setBadge("COMPLETATO", "#eaf8ee", "#358c50");
        } else if (status === "stopped") {
            setBadge("FERMATO", "#fff1ef", "#b7463e");
        } else {
            setBadge("ERRORE", "#fff1dc", "#a96700");
        }

        setCurrent(
            message || status,
            ""
        );

        setPhase(
            STATE.reportsSaved +
            " salvati · " + STATE.reportsUpdated + " updated · " +
            STATE.reportsSkipped +
            " saltati · " +
            STATE.errors +
            " errori"
        );

        var stop = q("#__imc_stop");
        if (stop) stop.style.display = "none";

        var close = q("#__imc_close");
        if (close) close.style.display = "block";
    }

    function fatal(error) {
        var message = clean(
            error && error.message
                ? error.message
                : String(error)
        );

        STATE.errors++;

        log(message, "error");
        updateUI();

        if (STATE.stopped) {
            finish(
                "stopped",
                "Importazione fermata"
            );
        } else {
            finish(
                "error",
                message
            );
        }
    }

    /* ============================================================
       IMC UNIVERSAL GATEWAY
       ============================================================ */

    async function gateway(body) {
        var response = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-IMC-Channel": "IMPORT"
            },
            body: JSON.stringify(Object.assign({}, body, {channel: "IMPORT"}))
        });
        var raw = await response.text();
        var json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch (_) {}
        if (!response.ok || !json || json.ok !== true) {
            throw new Error("Gateway " + response.status + " · " +
                ((json && (json.detail || json.sql_error || json.message || json.error)) || raw || "Risposta non valida"));
        }
        return json;
    }

    function gatewayRows(json) {
        if (
            Array.isArray(
                json &&
                json.rows
            )
        ) return json.rows;

        if (
            Array.isArray(
                json &&
                json.data
            )
        ) return json.data;

        if (
            Array.isArray(
                json &&
                json.items
            )
        ) return json.items;

        if (
            json &&
            json.result &&
            Array.isArray(
                json.result.rows
            )
        ) return json.result.rows;

        if (
            json &&
            json.result &&
            Array.isArray(
                json.result.data
            )
        ) return json.result.data;

        return [];
    }


    async function loadContext() {
        setPhase("Leggo Match Report esistenti");
        var dest = explicitMatchReportDestination();
        var offset = 0;
        var limit = 100;
        STATE.existingReports = new Set();
        STATE.existingMeta = new Map();
        while (true) {
            if (STATE.stopped) throw new Error("Importazione interrotta");
            var reply = await gateway({
                action: "read", game_world_id: STATE.gameWorld,
                repository: MATCH_REPORT_REPOSITORY,
                channel: "IMPORT", route_mode: "explicit",
                target_database: dest.database, target_table: dest.table,
                limit: limit, offset: offset
            });
            if(reply.database!==dest.database||(reply.physical_table||reply.table)!==dest.table)throw new Error("Destinazione READ Match Report non corrispondente");
            if (!Array.isArray(reply.rows)) throw new Error("READ Match Report: rows non dichiarato");
            reply.rows.forEach(function (row) {
                var id = Number(row && row.sm_fixture_id);
                if (Number.isSafeInteger(id) && id > 0){
                    STATE.existingReports.add(String(id));
                    STATE.existingMeta.set(String(id),{key:row.competition_key,season:row.imc_season,complete:completeReport(row)});
                }
            });
            if (!reply.has_more) break;
            var next = Number(reply.next_offset);
            if (!Number.isSafeInteger(next) || next <= offset) throw new Error("Paginazione READ non valida");
            offset = next;
        }
        log("LOCAL SKIP READY · Match Report esistenti " + STATE.existingReports.size, "ok");
        updateUI();
    }

    async function insertReport(row) {
        if(STATE.stopped)throw new Error("Importazione interrotta");
        var key =
            String(
                Number(
                    row.sm_fixture_id
                )
            );

        if(STATE.existingReports.has(key))return repairExistingReport(row);

        var explicit =
            explicitMatchReportDestination();

        var traceId =
            "IMC-MATCHREPORT-" +
            STATE.gameWorld +
            "-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8);

        var reply =
            await gateway({
                action:
                    "insert_many",

                game_world_id:
                    STATE.gameWorld,

                repository:
                    MATCH_REPORT_REPOSITORY,

                target_database:
                    explicit.database,

                target_table:
                    explicit.table,

                route_mode:
                    "explicit",

                trace_id:
                    traceId,

                atomic: true,

                rows:
                    [row]
            });

        if(reply.database!==explicit.database||(reply.physical_table||reply.table)!==explicit.table)throw new Error('Destinazione Match Report diversa da quella richiesta');
        var written = reply.written_rows;
        if (written === null || written === undefined || written === "" ||
            !Number.isInteger(Number(written)) || Number(written) < 0 || Number(written) > 1) {
            throw new Error("written_rows non valido o non dichiarato dal Gateway");
        }
        written = Number(written);
        var skipped = Number(reply.skipped_rows || 0);

        if(written!==1||Number(reply.skipped_rows||0)!==0||Number(reply.failed||0)!==0||reply.rolled_back===true||(reply.errors&&reply.errors.length))throw new Error('Salvataggio Match Report non confermato integralmente');
        await verifyStoredReport(row);
        if (written > 0) {
            STATE.existingReports.add(
                key
            );
        }

        STATE.reportsSaved++;STATE.rowsSaved+=written;
        STATE.lastBatch = {
            sent: 1,
            updated: 0,
            written: written,
            skipped: skipped,
            database: explicit.database,
            table: explicit.table,
            trace_id: traceId
        };

        log(
            "WRITE · " +
            explicit.database +
            " · " +
            explicit.table +
            " · written " +
            written +
            " · skip " +
            skipped,
            "ok"
        );

        updateUI();

        return written;
    }

    /* ============================================================
       NAVIGATION
       ============================================================ */

    function buttons() {
        var seen = {};

        return qa('a[id="matchResult"]')
            .filter(function (button) {
                if (!visible(button)) return false;

                var match =
                    (attr(button, "onclick") || "")
                        .match(
                            /MATCHREPORT_downloadScoreCentre\s*\(\s*['"]?(\d+)/i
                        );

                if (!match || seen[match[1]]) {
                    return false;
                }

                seen[match[1]] = true;
                return true;
            });
    }

    function fixtureIdFromButton(button) {
        var match =
            (attr(button, "onclick") || "")
                .match(
                    /MATCHREPORT_downloadScoreCentre\s*\(\s*['"]?(\d+)/i
                );

        return match
            ? match[1]
            : null;
    }

    function currentFixtureIds() {
        return buttons()
            .map(fixtureIdFromButton)
            .filter(Boolean);
    }

    function fixtureKey(values) {
        return (values || [])
            .map(String)
            .sort()
            .join("|");
    }

    function resultButton(fixtureId) {
        return buttons()
            .find(function (button) {
                return (
                    fixtureIdFromButton(button) ===
                    String(fixtureId)
                );
            }) || null;
    }

    async function realClick(element) {
        if (!element) {
            throw new Error(
                "Elemento navigazione assente"
            );
        }

        var id =
            "imc_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2);

        element.dataset.imcNav = id;

        var script =
            document.createElement(
                "script"
            );

        script.textContent =
            "(()=>{" +
                "let e=document.querySelector('[data-imc-nav=\"" +
                id +
                "\"]');" +
                "if(!e)return;" +
                "let r=e.getAttribute('onclick')||'';" +
                "if(typeof e.onclick==='function')e.onclick.call(e);" +
                "else if(r)(new Function(r)).call(e);" +
                "else e.click();" +
            "})()";

        (
            document.documentElement ||
            document.body
        ).appendChild(script);

        script.remove();

        delete element.dataset.imcNav;

        await sleep(250);
    }

    function firstVisibleById(id) {
        return qa(
            '[id="' + id + '"]'
        ).find(visible) || null;
    }

    function isMatchReport() {
        return !!(
            firstVisibleById(
                "MatchReportHometeamscore"
            ) &&
            q(
                "#matchReportScreen-lineups-tab"
            )
        );
    }

    function ownGate(fixtureId) {
        return qa(
            '[id="LastFixtureViewMatch"]'
        ).find(function (element) {
            if (!visible(element)) {
                return false;
            }

            var match =
                (attr(element, "onclick") || "")
                    .match(
                        /MATCHREPORT_downloadScoreCentre\s*\(\s*['"]?(\d+)/i
                    );

            return (
                match &&
                match[1] ===
                String(fixtureId)
            );
        }) || null;
    }

    function scoreCentreGate() {
        return firstVisibleById(
            "matchCommentaryMatchReportButton"
        );
    }

    async function openReport(fixtureId) {
        for (
            var attempt = 1;
            attempt <= 3;
            attempt++
        ) {
            var button =
                resultButton(fixtureId);

            if (!button) {
                throw new Error(
                    "matchResult assente"
                );
            }

            await realClick(button);

            var state =
                await waitFor(
                    function () {
                        return (
                            isMatchReport()
                                ? "report"
                                : ownGate(fixtureId)
                                    ? "own"
                                    : scoreCentreGate()
                                        ? "score"
                                        : null
                        );
                    }
                );

            if (!state) {
                await sleep(400);
                continue;
            }

            if (state === "report") {
                return;
            }

            if (state === "own") {
                await realClick(
                    ownGate(fixtureId)
                );

                state =
                    await waitFor(
                        function () {
                            return (
                                isMatchReport()
                                    ? "report"
                                    : scoreCentreGate()
                                        ? "score"
                                        : null
                            );
                        }
                    );

                if (state === "report") {
                    return;
                }

                if (!state) {
                    throw new Error(
                        "Score Centre non aperto"
                    );
                }
            }

            if (state === "score") {
                await realClick(
                    scoreCentreGate()
                );

                if (
                    !await waitFor(
                        isMatchReport
                    )
                ) {
                    throw new Error(
                        "Match Report non aperto"
                    );
                }

                return;
            }
        }

        throw new Error(
            "Apertura Match Report fallita dopo 3 tentativi"
        );
    }





    function resultsPageState() {
        var root = qa('[id="leagueResultsContainer"]').find(visible);
        if (!root) return null;
        if (qa('#drawMainContent_pageloading').some(visible)) return null;
        var headings = Array.from(root.querySelectorAll('.scheduleScreen-Heading')).filter(visible).map(function(e) { return clean(e.textContent); });
        var pagers = Array.from(root.querySelectorAll('.pager a')).filter(visible).map(function(e) {
            return [e.parentElement.id, attr(e,'action'), attr(e,'data-country'), attr(e,'data-division'), attr(e,'d'), attr(e,'m'), attr(e,'y')].join('|');
        });
        return JSON.stringify([fixtureKey(currentFixtureIds()), headings, pagers]);
    }

    async function waitResultsReady(test, timeout) {
        var last = null, since = 0;
        return waitFor(function () {
            var state = resultsPageState();
            if (!state || (test && !test(state))) { last = null; since = 0; return null; }
            if (state !== last) { last = state; since = Date.now(); return null; }
            return Date.now() - since >= 650 ? state : null;
        }, timeout || 18000, 150);
    }

    async function backToResults(originalFixtureIds) {
        var expected = fixtureKey(originalFixtureIds);
        function restored() { return !!resultsPageState() && fixtureKey(currentFixtureIds()) === expected; }
        if (restored()) return;
        // Multiple back steps cover Score Centre / own-team intermediate screens.
        for (var step = 0; step < 4; step++) {
            if (STATE.stopped) throw new Error("Importazione interrotta");
            var back = await waitFor(function () { return firstVisibleById("back-button"); }, 4000, 120);
            if (!back) break;
            await realClick(back);
            if (await waitResultsReady(restored, 6000)) return;
        }
        throw new Error("Ritorno Results fallito");
    }

    function countrySelect() {
        var select =
            q("#country-selector select");

        return (
            select &&
            visible(select)
        )
            ? select
            : null;
    }

    function divisionSelect() {
        var select =
            q(
                '#div-selector select[name="division"],#div-selector select'
            );

        return (
            select &&
            visible(select)
        )
            ? select
            : null;
    }

    function isDivisionText(text) {
        return /^division(?:e)?\s+[1-5]$/
            .test(
                norm(text)
            );
    }

    function selectPlan(kind) {
        var select =
            kind === "country"
                ? countrySelect()
                : divisionSelect();

        if (!select) {
            return null;
        }

        var values =
            Array.prototype
                .slice.call(
                    select.options || []
                )
                .map(function (
                    option,
                    index
                ) {
                    return {
                        value:
                            String(
                                option.value
                            ),
                        text:
                            clean(
                                option.textContent
                            ),
                        index: index,
                        selectHTML: select.outerHTML
                    };
                })
                .filter(function (option) {
                    return (
                        kind === "division"
                            ? isDivisionText(
                                option.text
                            )
                            : option.value &&
                              option.text
                    );
                });

        if (values.length < 2) {
            return null;
        }

        var position =
            values.findIndex(
                function (option) {
                    return (
                        option.index ===
                        select.selectedIndex
                    );
                }
            );

        if (position < 0) {
            position = 0;
        }

        return values
            .slice(position)
            .concat(
                values.slice(
                    0,
                    position
                )
            );
    }

    async function changeCompetition(kind, target) {
        for (var attempt = 1; attempt <= 3; attempt++) {
            if (STATE.stopped) throw new Error("Importazione interrotta");
            var select = kind === "country" ? countrySelect() : divisionSelect();
            var temporary = false;
            if (!select && target.selectHTML) {
                var holder = document.createElement("div");
                holder.innerHTML = target.selectHTML;
                select = holder.firstElementChild;
                select.removeAttribute("id");
                select.style.display = "none";
                document.body.appendChild(select);
                temporary = true;
            }
            if (!select) throw new Error("Menu " + kind + " assente");
            select.value = target.value;
            try {
                if (temporary) {
                    select.setAttribute("onclick", attr(select, "onchange") || "");
                    await realClick(select);
                } else if (typeof select.onchange === "function") {
                    select.onchange.call(select, new Event("change", {bubbles: true}));
                } else {
                    select.dispatchEvent(new Event("change", {bubbles: true}));
                }
            } finally { if (temporary) select.remove(); }
            await sleep(1200);
            var tab = q("#resultsTableTab");
            if (tab) {
                if (typeof window.showLeagueTabContents === "function") window.showLeagueTabContents("leagueResultsContainer", "resultsTableTab");
                else await realClick(tab);
            }
            if (await waitResultsReady(function () {
                var live = kind === "country" ? countrySelect() : divisionSelect();
                return live && String(live.value) === String(target.value);
            }, 18000)) return;
            log("Cambio " + kind + " · caricamento fallito " + attempt + "/3", "warn");
        }
        throw new Error("Cambio " + kind + " fallito dopo tre caricamenti");
    }

    /* ============================================================
       MATCH REPORT HELPERS
       Results resta solo come pagina di navigazione/fixture.
       Nessun contesto canonico viene ricostruito dal DOM Results.
       ============================================================ */

    function teamIdFromResultAnchor(anchor) {
        if (!anchor) return null;

        var match =
            (attr(anchor, "onclick") || "")
                .match(
                    /(?:MENU_clubOverviewDraw|MENU_association_draw)\s*\(\s*['"]?(\d+)/i
                );

        return match
            ? Number(match[1])
            : null;
    }

    function managerIdFromOnclick(onclick) {
        var match =
            String(onclick || "")
                .match(
                    /PROFILE_viewFriendsProfileNew\s*\(\s*(\d+)/i
                );

        return match
            ? Number(match[1])
            : null;
    }

    /* ============================================================
       MATCH REPORT PARSING
       ============================================================ */

    function textById(id) {
        var list =
            qa(
                '[id="' +
                id +
                '"]'
            );

        var element =
            list.find(
                function (candidate) {
                    return !(
                        candidate.closest &&
                        candidate.closest(
                            "#workingCopy"
                        )
                    );
                }
            ) ||
            list[0] ||
            null;

        return element
            ? clean(
                element.textContent ||
                element.innerText ||
                ""
              )
            : null;
    }

    function playerIdFromElement(element) {
        if (!element) {
            return null;
        }

        var anchor =
            element.matches &&
            element.matches("a")
                ? element
                : element.querySelector(
                    'a[onclick*="PLAYER_downloadPlayer"]'
                );

        if (!anchor) {
            return null;
        }

        var match =
            (attr(
                anchor,
                "onclick"
            ) || "")
                .match(
                    /PLAYER_downloadPlayer\s*\(\s*(\d+)/i
                );

        return match
            ? Number(match[1])
            : null;
    }

    function imcConnectionTeamMeta(side){
        var root=document.getElementById('currentScreenA')||document;
        var heading=root.querySelector('[id="'+(side==='home'?'MatchReportTeam1':'MatchReportTeam2')+'"]');
        var anchor=heading&&heading.querySelector('a');
        var identity=STATE.currentIdentity;
        var fixtureName=clean(identity[side+'_name']);
        var name=clean(anchor?.textContent||heading?.textContent)||fixtureName;
        var known=Number(identity[side+'_sm_club_id']);
        function clubIds(label){
            var clubs=(S.clubs||[]).filter(club=>[club.mapping_name,club.canonical_name]
                .some(alias=>label&&norm(alias)===norm(label)));
            return new Set(clubs.map(club=>Number(club.world_id)).filter(id=>Number.isSafeInteger(id)&&id>0));
        }
        // La riga Results è già selezionata per mondo e fixture. I nomi servono
        // solo ad arricchire il report; MENU_connectGWDraw contiene un ID connessione.
        if(identity.hasResult){
            var candidates=clubIds(fixtureName||name);
            var id=known>0?known:candidates.size===1?[...candidates][0]:null;
            var sameClub=norm(name)===norm(fixtureName)||Boolean(id&&clubIds(name).has(id));
            return {id,name:sameClub?name:fixtureName||name,guest:id===null};
        }
        if(!name)throw new Error('IMC: nome squadra '+side+' assente nel report');
        var ids=clubIds(name);
        if(ids.size>1)throw new Error('IMC: squadra '+name+' ambigua nel CORE');
        var reportId=ids.size===1?[...ids][0]:known>0?known:null;
        if(known>0&&reportId!==known)throw new Error('IMC: squadra '+name+' diversa dalla fixture');
        var expectedIds=clubIds(fixtureName);
        if(fixtureName&&norm(fixtureName)!==norm(name)&&!(expectedIds.size===1&&expectedIds.has(reportId)))
            throw new Error('IMC: nome squadra '+name+' diverso dalla fixture '+fixtureName);
        return {id:reportId,name,guest:reportId===null};
    }
    function reportTeamMeta(side) {
        if(STATE.currentIdentity?.competition_group==='IMC')return imcConnectionTeamMeta(side);
        var scoreId =
            side === "home"
                ? "MatchReportHometeamscore"
                : "MatchReportAwayteamscore";

        var scoreElement =
            firstVisibleById(
                scoreId
            );

        var root =
            scoreElement
                ? scoreElement.closest(
                    "tr"
                  ) ||
                  scoreElement.parentElement
                : document;

        var links =
            Array.prototype
                .slice.call(
                    root.querySelectorAll(
                        'a[onclick*="MENU_clubOverviewDraw"],a[onclick*="MENU_association_draw"]'
                    )
                );

        var anchor =
            side === "home"
                ? links[0] || null
                : links[
                    links.length - 1
                  ] || null;

        if (!anchor) {
            var all =
                qa(
                    'a[onclick*="MENU_clubOverviewDraw"],a[onclick*="MENU_association_draw"]'
                )
                .filter(function (el) {
                    return !(
                        el.closest &&
                        el.closest(
                            "#workingCopy"
                        )
                    );
                });

            anchor =
                side === "home"
                    ? all[0] || null
                    : all[1] || null;
        }

        return {
            id:
                teamIdFromResultAnchor(
                    anchor
                ),

            name:
                anchor
                    ? clean(
                        anchor.textContent
                      ) || null
                    : null
        };
    }

    function reportManagerMeta(side) {
        var id =
            side === "home"
                ? "MatchReportHomeTeamManagerName"
                : "MatchReportAwayTeamManagerName";

        var root =
            q(
                "#" + id
            );

        if (!root) {
            return {
                id: null,
                name: null
            };
        }

        var anchor =
            root.querySelector(
                'a[data-cid],a[onclick*="PROFILE_viewFriendsProfileNew"]'
            );

        var managerId =
            intValue(
                attr(
                    root,
                    "data-profileid"
                )
            );

        if (
            managerId === null &&
            anchor
        ) {
            managerId =
                intValue(
                    attr(
                        anchor,
                        "data-cid"
                    )
                );
        }

        if (
            managerId === null &&
            anchor
        ) {
            managerId =
                managerIdFromOnclick(
                    attr(
                        anchor,
                        "onclick"
                    )
                );
        }

        var name =
            clean(
                (anchor &&
                    attr(
                        anchor,
                        "title"
                    )) ||
                (anchor &&
                    attr(
                        anchor,
                        "alt"
                    )) ||
                (anchor &&
                    anchor.textContent) ||
                root.textContent ||
                ""
            ) || null;

        return {
            id: managerId,
            name: name
        };
    }

    function semanticMarkers(cell) {
        if (!cell) return [];

        function markerType(element) {
            var id = String(element.id || "").toLowerCase();
            var title = String(attr(element, "title") || "").toLowerCase();
            var cls = String(attr(element, "class") || "").toLowerCase();
            if (id === "yellow" || title.indexOf("cartellino giallo") !== -1) return "yellow";
            if (id === "red" || title.indexOf("cartellino rosso") !== -1) return "red";
            if (id === "player-on-arrow" || /(?:^|\s)spritev_subon(?:\s|$)/.test(cls) ||
                cls.indexOf("arrow-up") !== -1 || title.indexOf("minuto entrato per sostituzione") !== -1) return "sub_on";
            if (id === "player-off-arrow" || /(?:^|\s)spritev_suboff(?:\s|$)/.test(cls) ||
                cls.indexOf("arrow-down") !== -1 || title.indexOf("minuto uscito per sostituzione") !== -1) return "sub_off";
            if (id === "mom" || title.indexOf("migliore in campo") !== -1) return "mom";
            return null;
        }

        function minuteValue(match) {
            return match ? Number(match[1]) + Number(match[2] || 0) : null;
        }

        // Un solo marcatore per icona: abbr e img figlia rappresentano lo stesso evento.
        var roots = [];
        Array.prototype.forEach.call(cell.querySelectorAll("[id],[title],i,img,[class]"), function (element) {
            var type = markerType(element);
            if (!type) return;
            var root = element;
            var parent = element.parentElement;
            while (parent && parent !== cell) {
                if (markerType(parent) === type || parent.tagName.toLowerCase() === "abbr") root = parent;
                parent = parent.parentElement;
            }
            if (!roots.some(function (item) { return item.element === root && item.type === type; })) {
                roots.push({element: root, type: type});
            }
        });

        function adjacentMinute(root, before) {
            var node = root;
            // Si attraversano solo testo/spazi adiacenti, mai un'altra icona o il nome.
            while (node && node !== cell) {
                var sibling = before ? node.previousSibling : node.nextSibling;
                var text = "";
                while (sibling && (sibling.nodeType === 3 || sibling.nodeType === 8)) {
                    if (sibling.nodeType === 3) text = before ? sibling.textContent + text : text + sibling.textContent;
                    sibling = before ? sibling.previousSibling : sibling.nextSibling;
                }
                if (clean(text)) {
                    var match = before
                        ? text.match(/\((\d{1,3})(?:\s*\+\s*(\d{1,2}))?\)\s*$/)
                        : text.match(/^\s*\((\d{1,3})(?:\s*\+\s*(\d{1,2}))?\)/);
                    return minuteValue(match);
                }
                if (sibling) return null;
                node = node.parentElement;
            }
            return null;
        }

        var away = /-aplayer$/.test(cell.id || "");
        var home = /-hplayer$/.test(cell.id || "");
        return roots.map(function (item) {
            var minute = null;
            if (item.type !== "mom") {
                // Alcuni layout racchiudono il numero nell'abbr.
                var inside = clean(item.element.textContent).match(/^\((\d{1,3})(?:\s*\+\s*(\d{1,2}))?\)$/);
                minute = minuteValue(inside);
                if (minute === null) {
                    // Layout Soccer Manager: casa -> numero dopo; trasferta -> numero prima.
                    if (home || away) minute = adjacentMinute(item.element, away);
                    else {
                        var before = adjacentMinute(item.element, true);
                        var after = adjacentMinute(item.element, false);
                        if (before === null) minute = after;
                        else if (after === null || before === after) minute = before;
                    }
                }
            }
            return {type: item.type, minute: minute};
        });
    }

    function parsePlayersTable(
        tableId,
        side,
        starter
    ) {
        var table =
            q(
                "#" + tableId
            );

        if (!table) {
            return [];
        }

        var prefix =
            side === "home"
                ? "h"
                : "a";

        var output = [];
        var seen = {};

        Array.prototype
            .slice.call(
                table.querySelectorAll(
                    '[id$="' +
                    prefix +
                    'player"]'
                )
            )
            .forEach(
                function (cell) {
                    var slotMatch =
                        String(
                            cell.id || ""
                        )
                        .match(
                            /matchReportLineupsRow-(\d+)-[ha]player/
                        );

                    if (!slotMatch) {
                        return;
                    }

                    var slot =
                        Number(
                            slotMatch[1]
                        );

                    var anchor =
                        cell.querySelector(
                            'a[onclick*="PLAYER_downloadPlayer"]'
                        );

                    if (!anchor) {
                        return;
                    }

                    var playerId =
                        playerIdFromElement(
                            anchor
                        );

                    if (
                        playerId === null ||
                        seen[playerId]
                    ) {
                        return;
                    }

                    seen[playerId] = true;

                    function field(suffix) {
                        var element =
                            table.querySelector(
                                '[id="matchReportLineupsRow-' +
                                slot +
                                "-" +
                                prefix +
                                suffix +
                                '"]'
                            );

                        return element
                            ? clean(
                                element.textContent
                              )
                            : "";
                    }

                    var markers =
                        semanticMarkers(
                            cell
                        );

                    function minuteOf(type) {
                        var marker =
                            markers.find(
                                function (item) {
                                    return (
                                        item.type ===
                                        type
                                    );
                                }
                            );

                        return marker
                            ? marker.minute
                            : null;
                    }

                    output.push({
                        team_side: side,

                        sm_player_id:
                            playerId,

                        player_name:
                            clean(
                                anchor.textContent
                            ),

                        squad_slot:
                            slot,

                        starter:
                            starter
                                ? 1
                                : 0,

                        substitute:
                            starter
                                ? 0
                                : 1,

                        captain:
                            cell.querySelector(
                                'abbr[title="Capitano"]'
                            )
                                ? 1
                                : 0,

                        man_of_match:
                            cell.querySelector(
                                'abbr[id="mom"],abbr[title*="Migliore in campo"]'
                            )
                                ? 1
                                : 0,

                        goals:
                            intValue(
                                field(
                                    "goals"
                                )
                            ) || 0,

                        assists:
                            intValue(
                                field(
                                    "assists"
                                )
                            ) || 0,

                        rating:
                            numberValue(
                                field(
                                    "rating"
                                )
                            ),

                        yellow_card:
                            markers.some(
                                function (item) {
                                    return (
                                        item.type ===
                                        "yellow"
                                    );
                                }
                            )
                                ? 1
                                : 0,

                        red_card:
                            markers.some(
                                function (item) {
                                    return (
                                        item.type ===
                                        "red"
                                    );
                                }
                            )
                                ? 1
                                : 0,

                        yellow_card_minute:
                            minuteOf(
                                "yellow"
                            ),

                        red_card_minute:
                            minuteOf(
                                "red"
                            ),

                        sub_on_minute:
                            minuteOf(
                                "sub_on"
                            ),

                        sub_off_minute:
                            minuteOf(
                                "sub_off"
                            )
                    });
                }
            );

        return output;
    }

    /*
     * Marcatori/minuti: fonte diretta dal DOM Match Report.
     * Nessuna deduzione dal commentary.
     * Supporta doppiette/triplette: un record per ogni minuto esposto.
     */
    function parseScorersSide(side) {
        var root = q(
            side === "home"
                ? "#MatchReportHometeam-Scorers"
                : "#MatchReportAwayteam-Scorers"
        );

        if (!root) return [];

        var anchors = Array.prototype.slice.call(
            root.querySelectorAll('a[onclick*="PLAYER_downloadPlayer"]')
        );

        var output = [];

        anchors.forEach(function (anchor) {
            var playerId = playerIdFromElement(anchor);
            if (playerId === null) return;

            var node = anchor.nextSibling;
            var text = "";

            /*
             * Tutto ciò che segue l'anchor appartiene a quel marcatore
             * fino all'anchor del marcatore successivo.
             * Manteniamo il testo DOM originale del blocco scorer per
             * riconoscere anche "(autorete)" senza usare commentary.
             */
            while (node) {
                if (
                    node.nodeType === 1 &&
                    node.matches &&
                    node.matches('a[onclick*="PLAYER_downloadPlayer"]')
                ) {
                    break;
                }

                text += " " + (node.textContent || "");
                node = node.nextSibling;
            }

            var source = clean(text);

            /*
             * Un segmento = una marcatura esposta dal DOM.
             * Esempi:
             *   "12, 21, 38"
             *   "6 (autorete)"
             *   "29 (rig)"
             *
             * own_goal viene letto SOLO dalla dicitura "(autorete)"
             * associata a quella specifica marcatura.
             */
            var segments = source
                .split(",")
                .map(clean)
                .filter(Boolean);

            var found = 0;

            segments.forEach(function (segment) {
                var match = segment.match(
                    /(?:^|[^\d])(\d{1,3})(?:\s*\+\s*(\d{1,2}))?/
                );

                if (!match) return;

                var minute =
                    Number(match[1]) +
                    Number(match[2] || 0);

                if (!Number.isFinite(minute)) return;

                output.push({
                    team_side: side,
                    sm_player_id: playerId,
                    player_name: clean(anchor.textContent),
                    minute: minute,
                    own_goal: /\(\s*autorete\s*\)/i.test(segment) ? 1 : 0
                });

                found++;
            });

            /*
             * Marcatore presente ma minuto non leggibile:
             * conserviamo NULL e l'eventuale flag autorete,
             * senza dedurre o inventare nulla.
             */
            if (found === 0) {
                output.push({
                    team_side: side,
                    sm_player_id: playerId,
                    player_name: clean(anchor.textContent),
                    minute: null,
                    own_goal: /\(\s*autorete\s*\)/i.test(source) ? 1 : 0
                });
            }
        });

        return output;
    }

    function parseScorers() {
        return []
            .concat(parseScorersSide("home"))
            .concat(parseScorersSide("away"));
    }

    function applyGoalMinutes(players, scorers) {
        var normalByPlayer = {};
        var ownByPlayer = {};
        var ownCountByPlayer = {};

        (scorers || []).forEach(function (scorer) {
            var key = String(scorer.sm_player_id);
            var target = scorer.own_goal ? ownByPlayer : normalByPlayer;
            if(scorer.own_goal)ownCountByPlayer[key]=(ownCountByPlayer[key]||0)+1;

            if (!target[key]) {
                target[key] = [];
            }

            if (scorer.minute !== null) {
                target[key].push(scorer.minute);
            }
        });

        (players || []).forEach(function (player) {
            var normalMinutes =
                normalByPlayer[String(player.sm_player_id)] || [];

            var ownMinutes =
                ownByPlayer[String(player.sm_player_id)] || [];

            player.goal_minutes =
                normalMinutes.slice().sort(function (a, b) {
                    return a - b;
                });

            player.own_goals = ownCountByPlayer[String(player.sm_player_id)] || 0;

            player.own_goal_minutes =
                ownMinutes.slice().sort(function (a, b) {
                    return a - b;
                });
        });

        return players;
    }

    function parsePlayers() {
        return []
            .concat(
                parsePlayersTable(
                    "matchReportLineupsTeam1Table",
                    "home",
                    true
                )
            )
            .concat(
                parsePlayersTable(
                    "matchReportLineupsTeam1SubsTable",
                    "home",
                    false
                )
            )
            .concat(
                parsePlayersTable(
                    "matchReportLineupsTeam2Table",
                    "away",
                    true
                )
            )
            .concat(
                parsePlayersTable(
                    "matchReportLineupsTeam2SubsTable",
                    "away",
                    false
                )
            );
    }

    function parseTeamStats() {
        return {
            home: {
                possession:
                    intValue(
                        textById(
                            "MatchReportHomepossession"
                        )
                    ),

                total_shots:
                    intValue(
                        textById(
                            "MatchReportHometotalshots"
                        )
                    ),

                shots_on_target:
                    intValue(
                        textById(
                            "MatchReportHomeontarget"
                        )
                    ),

                corners:
                    intValue(
                        textById(
                            "MatchReportHomecorners"
                        )
                    ),

                yellow_cards:
                    intValue(
                        textById(
                            "MatchReportHomeyellowcards"
                        )
                    ),

                red_cards:
                    intValue(
                        textById(
                            "MatchReportHomeredcards"
                        )
                    )
            },

            away: {
                possession:
                    intValue(
                        textById(
                            "MatchReportAwaypossession"
                        )
                    ),

                total_shots:
                    intValue(
                        textById(
                            "MatchReportAwaytotalshots"
                        )
                    ),

                shots_on_target:
                    intValue(
                        textById(
                            "MatchReportAwayontarget"
                        )
                    ),

                corners:
                    intValue(
                        textById(
                            "MatchReportAwaycorners"
                        )
                    ),

                yellow_cards:
                    intValue(
                        textById(
                            "MatchReportAwayyellowcards"
                        )
                    ),

                red_cards:
                    intValue(
                        textById(
                            "MatchReportAwayredcards"
                        )
                    )
            }
        };
    }

    function commentaryType(row) {
        var text =
            norm(
                row.textContent ||
                ""
            );

        var semantic =
            Array.prototype
                .slice.call(
                    row.querySelectorAll(
                        "[title],[class]"
                    )
                )
                .map(
                    function (element) {
                        return norm(
                            (attr(
                                element,
                                "title"
                            ) || "") +
                            " " +
                            (
                                typeof element.className ===
                                "string"
                                    ? element.className
                                    : ""
                            )
                        );
                    }
                )
                .join(" ");

        if (
            semantic.indexOf(
                "cartellino rosso"
            ) !== -1 ||
            text.indexOf(
                "espuls"
            ) !== -1
        ) {
            return "red_card";
        }

        if (
            semantic.indexOf(
                "cartellino giallo"
            ) !== -1 ||
            text.indexOf(
                "ammonit"
            ) !== -1
        ) {
            return "yellow_card";
        }

        if (
            semantic.indexOf(
                "sport soccer"
            ) !== -1 ||
            text.indexOf(
                "segna"
            ) !== -1 ||
            text.indexOf(
                " rete "
            ) !== -1
        ) {
            return "goal";
        }

        if (
            text.indexOf(
                "sostit"
            ) !== -1
        ) {
            return "substitution";
        }

        if (
            text.indexOf(
                "fuorigioco"
            ) !== -1
        ) {
            return "offside";
        }

        if (
            text.indexOf(
                "fallo"
            ) !== -1
        ) {
            return "foul";
        }

        if (
            text.indexOf(
                "para"
            ) !== -1 ||
            text.indexOf(
                "parata"
            ) !== -1
        ) {
            return "save";
        }

        if (
            text.indexOf(
                "tira"
            ) !== -1 ||
            text.indexOf(
                "tiro"
            ) !== -1
        ) {
            return "shot";
        }

        if (
            text.indexOf(
                "calcio di inizio"
            ) !== -1
        ) {
            return "kickoff";
        }

        if (
            text.indexOf(
                "fine primo tempo"
            ) !== -1 ||
            text.indexOf(
                "intervallo"
            ) !== -1
        ) {
            return "halftime";
        }

        if (
            text.indexOf(
                "fine partita"
            ) !== -1 ||
            text.indexOf(
                "partita terminata"
            ) !== -1
        ) {
            return "fulltime";
        }

        return null;
    }

    function parseCommentary() {
        var root =
            q(
                "#matchReportScreen-commentary-tab"
            );

        if (!root) {
            return [];
        }

        var output = [];

        Array.prototype
            .slice.call(
                root.querySelectorAll(
                    "tr"
                )
            )
            .forEach(
                function (row) {
                    var minuteElement =
                        row.querySelector(
                            '[id="matchReportScreen-commtable-helperRow-min"]'
                        );

                    if (!minuteElement) {
                        return;
                    }

                    var text =
                        clean(
                            row.textContent
                        );

                    if (!text) {
                        return;
                    }

                    var players =
                        Array.prototype
                            .slice.call(
                                row.querySelectorAll(
                                    'a[onclick*="PLAYER_downloadPlayer"]'
                                )
                            )
                            .map(
                                function (anchor) {
                                    return {
                                        id:
                                            playerIdFromElement(
                                                anchor
                                            ),

                                        name:
                                            clean(
                                                anchor.textContent
                                            )
                                    };
                                }
                            )
                            .filter(
                                function (player) {
                                    return (
                                        player.id !==
                                        null
                                    );
                                }
                            );

                    output.push({
                        minute:
                            reportMinute(minuteElement.textContent),

                        commentary_text:
                            text,

                        players:
                            players,

                        event_type:
                            commentaryType(
                                row
                            )
                    });
                }
            );

        return output;
    }

    function buildEvents(
        commentary,
        players
    ) {
        var sideByPlayer = {};

        players.forEach(
            function (player) {
                sideByPlayer[
                    String(
                        player.sm_player_id
                    )
                ] =
                    player.team_side;
            }
        );

        var events = [];
        var seen = {};

        commentary.forEach(
            function (item) {
                if (!item.event_type) {
                    return;
                }

                var primary =
                    item.players[0] ||
                    null;

                var secondary =
                    item.players[1] ||
                    null;

                var side =
                    primary
                        ? sideByPlayer[
                            String(
                                primary.id
                            )
                          ] || null
                        : null;

                var eventKey = [
                    item.minute,
                    item.event_type,
                    primary
                        ? primary.id
                        : "",
                    secondary
                        ? secondary.id
                        : "",
                    side || ""
                ].join("|");

                if (seen[eventKey]) {
                    return;
                }

                seen[eventKey] = true;

                events.push({
                    minute:
                        item.minute,

                    event_type:
                        item.event_type,

                    team_side:
                        side,

                    primary_sm_player_id:
                        primary
                            ? primary.id
                            : null,

                    primary_player_name:
                        primary
                            ? primary.name
                            : null,

                    secondary_sm_player_id:
                        secondary
                            ? secondary.id
                            : null,

                    secondary_player_name:
                        secondary
                            ? secondary.name
                            : null,

                    event_text:
                        item.commentary_text
                });
            }
        );

        events.sort(
            function (a, b) {
                var ma =
                    a.minute == null
                        ? 999
                        : a.minute;

                var mb =
                    b.minute == null
                        ? 999
                        : b.minute;

                return ma - mb;
            }
        );

        events.forEach(
            function (event, index) {
                event.event_sequence =
                    index + 1;
            }
        );

        return events;
    }

    var TACTIC_FIELDS = {
        width:
            "MatchReportWidth",

        mentality:
            "MatchReportMentality",

        fluidity:
            "MatchReportFluidity",

        creativity:
            "MatchReportCreativity",

        tempo:
            "MatchReportTempo",

        counter_attack:
            "MatchReportCounterAttack",

        forwards_instruction:
            "MatchReportForwards",

        wide_play:
            "MatchReportPenaltyWidePlay",

        passing_style:
            "MatchReportPassing",

        attacking_style:
            "MatchReportAttacking",

        use_playmaker:
            "MatchReportUsePlaymaker",

        use_target_man:
            "MatchReportUseTargetMan",

        tackling_style:
            "MatchReportTackling",

        defensive_line:
            "MatchReportMenBehindBackLine",

        sweeper_keeper:
            "MatchReportMenBehindSweeperKeeper",

        men_behind_ball:
            "MatchReportMenBehindBall",

        tight_marking:
            "MatchReportTightMarking",

        pressing:
            "MatchReportPressing",

        captain_name:
            "MatchReportCaptain",

        penalty_taker_name:
            "MatchReportPenaltyTaker",

        free_kick_taker_name:
            "MatchReportTightFreeKicks",

        corner_taker_name:
            "MatchReportCornerTaker",

        playmaker_name:
            "MatchReportPlaymaker",

        target_man_name:
            "MatchReportTargetMan"
    };

    function tacticContainer(
        side,
        minute
    ) {
        var sideName =
            side === "home"
                ? "Home"
                : "Away";

        var exact =
            q(
                "#matchReportTactics" +
                sideName +
                "Min" +
                minute
            );

        if (
            exact &&
            exact.querySelector(
                '[id="matchReportTacticsFormation"]'
            )
        ) {
            return exact;
        }

        var candidates =
            qa(
                '[id^="matchReportTactics' +
                sideName +
                "Min" +
                minute +
                '"]'
            )
            .filter(
                function (element) {
                    return (
                        !/_tab$/i.test(
                            element.id ||
                            ""
                        ) &&
                        !!element.querySelector(
                            '[id="matchReportTacticsFormation"]'
                        )
                    );
                }
            );

        return candidates[0] || null;
    }

    function parseTactics() {
        var output = [];

        ["home", "away"]
            .forEach(
                function (side) {
                    [0, 45, 60, 75]
                        .forEach(
                            function (minute) {
                                var root =
                                    tacticContainer(
                                        side,
                                        minute
                                    );

                                if (!root) {
                                    return;
                                }

                                var row = {
                                    team_side:
                                        side,

                                    snapshot_minute:
                                        minute,

                                    formation:
                                        null
                                };

                                var formation =
                                    root.querySelector(
                                        '[id="matchReportTacticsFormation"]'
                                    );

                                row.formation =
                                    formation
                                        ? clean(
                                            formation.textContent
                                          ) || null
                                        : null;

                                Object.keys(
                                    TACTIC_FIELDS
                                )
                                .forEach(
                                    function (field) {
                                        var element =
                                            root.querySelector(
                                                '[id="' +
                                                TACTIC_FIELDS[
                                                    field
                                                ] +
                                                '"]'
                                            );

                                        row[field] =
                                            element
                                                ? clean(
                                                    element.textContent
                                                  ) || null
                                                : null;
                                    }
                                );

                                output.push(
                                    row
                                );
                            }
                        );
                }
            );

        return output;
    }

    async function buildReportRow(fixtureId) {
        var identity = STATE.currentIdentity;
        if(!identity)throw new Error('Identità fixture non verificata');
        var home = reportTeamMeta("home");
        var away = reportTeamMeta("away");
        if(home.id&&home.id===away.id&&identity.home_sm_club_id&&identity.away_sm_club_id&&identity.home_sm_club_id!==identity.away_sm_club_id){
            home={id:identity.home_sm_club_id,name:identity.home_name};away={id:identity.away_sm_club_id,name:identity.away_name};
        }
        home.id=reportTeamId(home,identity,'home');away.id=reportTeamId(away,identity,'away');
        home.name=home.name||identity.home_name;away.name=away.name||identity.away_name;
        var homeManager = reportManagerMeta("home");
        var awayManager = reportManagerMeta("away");
        if(home.guest)homeManager={id:null,name:'GUEST'};
        if(away.guest)awayManager={id:null,name:'GUEST'};

        var parsedPlayers = parsePlayers();
        var parsedScorers = parseScorers();
        applyGoalMinutes(parsedPlayers, parsedScorers);

        var commentaryParsed = parseCommentary();
        var events = buildEvents(commentaryParsed, parsedPlayers);
        var parsedTactics = parseTactics();
        var parsedTeamStats = parseTeamStats();

        var teamStatsJson = {
            home: {
                sm_team_id: home.id,
                ...(home.guest ? {guest:true} : {}),
                team_name: home.name,
                possession: parsedTeamStats.home.possession,
                total_shots: parsedTeamStats.home.total_shots,
                shots_on_target: parsedTeamStats.home.shots_on_target,
                corners: parsedTeamStats.home.corners,
                yellow_cards: parsedTeamStats.home.yellow_cards,
                red_cards: parsedTeamStats.home.red_cards
            },
            away: {
                sm_team_id: away.id,
                ...(away.guest ? {guest:true} : {}),
                team_name: away.name,
                possession: parsedTeamStats.away.possession,
                total_shots: parsedTeamStats.away.total_shots,
                shots_on_target: parsedTeamStats.away.shots_on_target,
                corners: parsedTeamStats.away.corners,
                yellow_cards: parsedTeamStats.away.yellow_cards,
                red_cards: parsedTeamStats.away.red_cards
            },
            scorers: parsedScorers
        };

        var commentaryJson = commentaryParsed.map(function (item, index) {
            return {
                event_sequence: index + 1,
                minute: item.minute,
                commentary_text: item.commentary_text,
                player_ids: (item.players || []).map(function (player) {
                    return player.id;
                })
            };
        });

        // Identità verificata prima dell’apertura; dati tecnici letti dal report.
        var main = {
            game_world_id: STATE.gameWorld,
            sm_fixture_id: Number(fixtureId),
            competition_key:identity.competition_key,imc_season:identity.imc_season,
            sm_action:identity.sm_action,sm_division:identity.sm_division,competition_group:identity.competition_group,
            competition_group_name:identity.competition_group_name,competition_stage:identity.competition_stage,competition_round:identity.competition_round,match_date:identity.match_date,
            home_sm_club_id:reportTeamId(home,identity,'home'),home_name:home.name||identity.home_name,
            away_sm_club_id:reportTeamId(away,identity,'away'),away_name:away.name||identity.away_name,
            home_score:reportScore('MatchReportHometeamscore'),away_score:reportScore('MatchReportAwayteamscore'),
            penalty_home_score:identity.penalty_home_score,penalty_away_score:identity.penalty_away_score,
            aggregate_home_score:identity.aggregate_home_score,aggregate_away_score:identity.aggregate_away_score,

            home_sm_manager_id: homeManager.id,
            home_manager_name: homeManager.name,
            away_sm_manager_id: awayManager.id,
            away_manager_name: awayManager.name,

            stadium_name: textById("MatchReportStadiumName"),
            attendance: intValue(textById("MatchReportAttendance")),

            team_stats_json: teamStatsJson,
            players_json: parsedPlayers,
            events_json: events,
            tactics_json: parsedTactics,
            commentary_json: commentaryJson,

            fingerprint: null,
            imported_at: STATE.importedAt
        };

        if(!completeReport(main))throw new Error('Report incompleto: dati partita o formazioni non disponibili');
        await fingerprint(main, [
            main.competition_key,main.imc_season,main.home_score,main.away_score,
            main.game_world_id,
            main.sm_fixture_id,
            main.home_manager_name,
            main.away_manager_name,
            main.stadium_name,
            main.attendance,
            JSON.stringify(main.team_stats_json),
            JSON.stringify(main.players_json),
            JSON.stringify(main.events_json),
            JSON.stringify(main.tactics_json),
            JSON.stringify(main.commentary_json)
        ]);

        return main;
    }

    /* ============================================================
       IMPORT ORCHESTRATION
       ============================================================ */

    async function processCurrentResultsPage() {
        var original =
            currentFixtureIds();

        if (!original.length) {
            return;
        }

        STATE.fixturesSeen +=
            original.length;

        updateUI();

        for (
            var index = 0;
            index < original.length;
            index++
        ) {
            if (STATE.stopped) {
                throw new Error(
                    "Importazione interrotta"
                );
            }

            var fixtureId =
                original[index];

            STATE.currentFixture =
                fixtureId;

            var button =
                resultButton(
                    fixtureId
                );

            if (!button) {
                STATE.errors++;

                log(
                    "Fixture " +
                    fixtureId +
                    " · matchResult scomparso",
                    "error"
                );

                updateUI();
                continue;
            }

            var label = "Fixture " + fixtureId;

            setCurrent(
                label,
                "Fixture " +
                fixtureId +
                " · " +
                (index + 1) +
                "/" +
                original.length
            );

            try {
                if(S.competition.sm_action==='worldcup'){
                    const source=sourceIdentity(S.results.get(Number(fixtureId)),fixtureId);
                    if(source&&normalizedAction(source.sm_action)==='worldcup'&&!worldCupKnockout(source)){
                        STATE.reportsSkipped++;
                        log(label+' · gironi World Cup: usa l’importer della partita singola','skip');updateUI();continue;
                    }
                }
                STATE.currentIdentity=reportIdentity(fixtureId);
                var existing=STATE.existingMeta.get(String(Number(fixtureId)));
                if(existing&&((clean(existing.key)&&!sameReportKey(existing.key,STATE.currentIdentity))||(Number(existing.season)>0&&Number(existing.season)!==STATE.currentIdentity.imc_season)))throw new Error('Report esistente assegnato a una competizione o stagione diversa');
            } catch(error) {
                STATE.errors++;log(label+' · '+clean(error.message),'error');updateUI();continue;
            }
            if(STATE.existingReports.has(String(Number(fixtureId)))&&existing?.complete) {

                STATE.reportsSkipped++;
                STATE.localSkipReports++;

                log(
                    label +
                    " · già importato · LOCAL SKIP",
                    "skip"
                );

                updateUI();
                continue;
            }

            var opened =
                false;

            try {
                STATE.currentIdentity=reportIdentity(fixtureId);
                setPhase(
                    "Apro Match Report"
                );

                await openReport(
                    fixtureId
                );

                opened = true;
                STATE.reportsOpened++;

                updateUI();

                setPhase(
                    "Estraggo report completo"
                );

                await sleep(350);

                var reportRow =
                    await buildReportRow(
                        fixtureId
                    );

                setPhase(
                    "Salvo 1 record completo"
                );

                var storedRows =
                    await insertReport(
                        reportRow
                    );

                if (storedRows > 0) {

                    STATE.existingReports.add(
                        String(
                            Number(
                                fixtureId
                            )
                        )
                    );

                    log(
                        label +
                        (STATE.lastBatch.updated ? " · UPDATED · 1 riga esistente" : " · SALVATO · 1 nuova riga"),
                        "ok"
                    );
                } else {
                    STATE.reportsSkipped++;

                    log(
                        label +
                        " · SKIP GATEWAY",
                        "skip"
                    );
                }


            } catch (error) {
                STATE.errors++;

                log(
                    label +
                    " · " +
                    clean(
                        error &&
                        error.message
                            ? error.message
                            : String(error)
                    ),
                    "error"
                );
            }

            if (STATE.stopped) throw new Error("Importazione interrotta");

            if (opened || !resultsPageState() || fixtureKey(currentFixtureIds()) !== fixtureKey(original)) {
                setPhase(
                    "Torno ai Results"
                );

                await backToResults(
                    original
                );

                await sleep(250);
            }

            updateUI();
        }
    }

    async function runCurrentMatchday(){
        if(STATE.stopped)throw new Error("Importazione interrotta");
        try{
            if(!await waitResultsReady(null,18000))throw new Error("Pagina Results non disponibile");
            await processCurrentResultsPage();
        }catch(error){
            if(STATE.stopped)throw error;
            STATE.errors++;log(clean(error.message)+" · SKIP divisione", "warn");updateUI();
        }
    }

    async function runDivisions() {
        var divisionPlan =
            selectPlan(
                "division"
            );

        if (!divisionPlan) {
            STATE.currentDivision =
                null;

            updateUI();

            await runCurrentMatchday();
            return;
        }

        for (
            var index = 0;
            index < divisionPlan.length;
            index++
        ) {
            if (STATE.stopped) {
                throw new Error(
                    "Importazione interrotta"
                );
            }

            var target =
                divisionPlan[index];

            if (index > 0) {
                var freshPlan =
                    selectPlan(
                        "division"
                    ) || [];

                var freshTarget =
                    freshPlan.find(
                        function (item) {
                            return (
                                String(
                                    item.value
                                ) ===
                                String(
                                    target.value
                                )
                            );
                        }
                    ) || target;

                setPhase(
                    "Cambio Divisione"
                );

                try { await changeCompetition("division", freshTarget); }
                catch (error) {
                    if (STATE.stopped) throw error;
                    STATE.errors++; log(error.message + " · SKIP " + target.text, "warn"); updateUI(); continue;
                }
            }

            STATE.currentDivision =
                target.text;

            updateUI();

            log(
                "DIVISIONE · " +
                target.text,
                "ok"
            );

            await runCurrentMatchday();
        }
    }

    async function runNavigation(){
        STATE.currentCountry=null;
        await runDivisions();
    }

    async function main() {
        if (STATE.running) {
            return;
        }

        explicitMatchReportDestination();
        STATE.running = true;

        STATE.importedAt =
            nowMysql();

        STATE.loggedManagerId =
            readLoggedManagerId();

        setBadge(
            "IN CORSO",
            "#eee8ff",
            "#6548c8"
        );

        setPhase(
            "Preparo contesto"
        );

        if (!resultsPageState()) {
            throw new Error(
                "Apri la pagina Results di Soccer Manager prima di avviare Match Report V3.6"
            );
        }

        await prepareReportImport();
        await loadContext();

        log(
            "START · " +
            STATE.gameWorld +
            " · IMC Universal Gateway · logged_manager_id " +
            (
                STATE.loggedManagerId ==
                null
                    ? "NULL"
                    : STATE.loggedManagerId
            ),
            "ok"
        );

        if(S.leagueMode)await runNavigation();else await runCurrentMatchday();

        if (STATE.stopped) {
            finish(
                "stopped",
                "Importazione fermata"
            );

            return;
        }

        finish(
            STATE.errors ? "error" : "ok",
            STATE.errors ? "Importazione conclusa con errori: verifica il log" : "Match Report V3.6 completato"
        );
    }

    buildUI();
    boot();

    /*
     * Rilascia subito Comandi Rapidi iPhone.
     * Lo scanner continua poi dentro Safari.
     */
    completeShortcutImmediately();

})();
