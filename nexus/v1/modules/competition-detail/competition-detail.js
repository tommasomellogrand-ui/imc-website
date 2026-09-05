(function(){
"use strict";
if(window.IMC_COMPETITION_DETAIL)return;

const VERSION="2.7.0";
let s={
  container:null,client:null,worldId:"",competitionKey:"",name:"",meta:null,
  results:[],schedule:[],stats:[],trophies:[],teams:[],teamManagers:[],
  teamByName:new Map(),teamById:new Map(),managerByWorldId:new Map(),managerBySmId:new Map(),
  nationByName:new Map(),
  tab:"overview",competitionSub:"table",matchesSub:"results",statsSub:"goals",
  activeGroup:"",reports:null
};

const c=v=>String(v==null?"":v).trim();
const e=v=>c(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const n=v=>Number(v||0)||0;
const nk=v=>c(v).toLocaleLowerCase("it-IT").replace(/\s+/g," ");

function rpc(action,args){return s.client.rpc("imc_nexus_gateway",{p_action:action,p_args:args}).then(r=>{if(r.error)throw r.error;return r.data||{}})}
function uniqFixtures(rows){const m=new Map();for(const x of rows||[]){const k=c(x.sm_fixture_id)||c(x.canonical_match_id)||`${c(x.home_name)}|${c(x.away_name)}|${c(x.source_page_date||x.match_date)}`;if(!m.has(k))m.set(k,x)}return [...m.values()]}
function formatDate(v){const q=c(v);if(!q)return"—";const d=new Date(q.length===10?q+"T12:00:00":q);if(isNaN(d))return q;return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}
function metaName(){return c(s.meta&&s.meta["Nexus View"]||s.name||s.competitionKey)}
function type(){return c(s.meta&&s.meta.IMC_competition_type)}
function isNations(){return type().toLowerCase()==="nations"}
function action(){return c(s.meta&&s.meta.sm_action).toLowerCase()}
function format(){const a=action();if(a==="league")return"league";if(a==="interqualifier")return"qualifier";if(a==="worldcup"||a==="smfacup"||(a==="smfashield"&&s.worldId!=="GW008"))return"hybrid";if(a==="smfashield"&&s.worldId==="GW008")return"knockout";if(a==="charityshield"||a==="supercup")return"oneoff";return"knockout"}
function subtitle(){const bits=[type(),c(s.meta&&s.meta["Country Nexus View"]||s.meta&&s.meta.sm_country),c(s.meta&&s.meta.IMC_league_divisions)].filter(Boolean);return bits.join(" · ")}
function allTeams(){const set=new Set();[...s.results,...s.schedule].forEach(x=>{if(c(x.home_name))set.add(c(x.home_name));if(c(x.away_name))set.add(c(x.away_name))});return [...set]}
function standings(rows){const map=new Map();for(const r of uniqFixtures(rows)){const h=c(r.home_name),a=c(r.away_name),hs=Number(r.home_score),as=Number(r.away_score);if(!h||!a||!Number.isFinite(hs)||!Number.isFinite(as))continue;const ensure=(team,logo)=>{if(!map.has(team))map.set(team,{team,logo:c(logo),p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0});else if(!c(map.get(team).logo)&&c(logo))map.get(team).logo=c(logo)};ensure(h,r.home_logo_file);ensure(a,r.away_logo_file);const H=map.get(h),A=map.get(a);H.p++;A.p++;H.gf+=hs;H.ga+=as;A.gf+=as;A.ga+=hs;if(hs>as){H.w++;A.l++;H.pts+=3}else if(hs<as){A.w++;H.l++;A.pts+=3}else{H.d++;A.d++;H.pts++;A.pts++}}for(const x of map.values())x.gd=x.gf-x.ga;return [...map.values()].sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team))}

function groupValue(row){return c(row&&row.group_label)}
function groupNumber(v){const m=c(v).match(/(\d+)/);return m?Number(m[1]):Number.POSITIVE_INFINITY}
function groupCompare(a,b){const na=groupNumber(a),nb=groupNumber(b);if(Number.isFinite(na)&&Number.isFinite(nb)&&na!==nb)return na-nb;return c(a).localeCompare(c(b),undefined,{numeric:true})}
function groupDisplay(v){const q=c(v);let m=q.match(/^group\s+(\d+)$/i);if(m){const num=Number(m[1]);if(num>=1&&num<=26)return `GROUP ${String.fromCharCode(64+num)}`}m=q.match(/^(?:group|girone)\s+([a-z])$/i);if(m)return `GROUP ${m[1].toUpperCase()}`;return q.toUpperCase()}
function groups(){const vals=[...s.results,...s.schedule].map(groupValue).filter(Boolean);return [...new Set(vals)].sort(groupCompare)}
function rowsForGroup(g){return s.results.filter(x=>groupValue(x)===g)}

function teamRecord(name,id){const k=c(id);if(k&&s.teamById.has(k))return s.teamById.get(k);return s.teamByName.get(nk(name))||null}
function logoPath(team){const p=c(team&&team.logo_file);if(!p)return"";return p.startsWith("/")?p:`/nexus/${p.replace(/^\.\//,"")}`}
function nationFlag(name){return c(s.nationByName.get(nk(name)))}
function imcManagerName(m){if(!m)return"";if(!c(m.manager_id)&&!c(m.imc_manager_name))return"";return c(m.imc_manager_name||m.manager_name)}
function managerFor(row,side){const direct=c(row&&row[`${side}_imc_manager_name`]);if(direct)return direct;const sm=c(row&&row[`${side}_manager_sm_id`]);if(sm&&s.managerBySmId.has(sm)){const name=imcManagerName(s.managerBySmId.get(sm));if(name)return name}const team=teamRecord(row&&row[`${side}_name`],row&&row[`${side}_team_id`]);const wid=c(team&&team.sm_world_club_id);if(wid&&s.managerByWorldId.has(wid))return imcManagerName(s.managerByWorldId.get(wid));return""}
function visualForSide(row,side,name,team){const directFlag=c(row&&row[`${side}_flag_file`]),directLogo=c(row&&row[`${side}_logo_file`]);if(directFlag)return directFlag;if(directLogo)return directLogo;if(isNations())return nationFlag(name);return logoPath(team)}
function teamCell(row,side){const name=c(row&&row[`${side}_name`]);const team=teamRecord(name,row&&row[`${side}_team_id`]);const visual=visualForSide(row,side,name,team),manager=managerFor(row,side),imgClass=isNations()?"cd-team-logo cd-team-flag":"cd-team-logo";return `<div class="cd-team-cell">${visual?`<img class="${imgClass}" src="${e(visual)}" alt="${e(name)}">`:""}<div class="cd-team-copy"><b>${e(name||"—")}</b>${manager?`<em>${e(manager)}</em>`:""}</div></div>`}
function standingTeamCell(name,directLogo){const team=teamRecord(name,null),visual=c(directLogo)||(isNations()?nationFlag(name):logoPath(team)),imgClass=isNations()?"cd-standing-flag":"";return `<div class="cd-standing-team">${visual?`<img class="${imgClass}" src="${e(visual)}" alt="${e(name)}">`:""}<b>${e(name||"—")}</b></div>`}
function badge(name){const team=teamRecord(name,null),visual=isNations()?nationFlag(name):logoPath(team);if(visual)return `<img class="cd-feature-logo${isNations()?" cd-feature-flag":""}" src="${e(visual)}" alt="${e(name)}">`;const t=c(name);return `<span class="cd-team-badge">${e((t.match(/[A-Za-zÀ-ÿ0-9]/)||["?"])[0].toUpperCase())}</span>`}
function resultLine(x,showDate=true){return `<div class="cd-match-row">${teamCell(x,"home")}<strong>${e(x.home_score)} - ${e(x.away_score)}</strong>${teamCell(x,"away")}${showDate?`<small>${formatDate(x.source_page_date||x.match_date)}</small>`:""}</div>`}
function scheduleLine(x,showDate=true){const meta=[showDate?formatDate(x.match_date):"",c(x.sm_round_label)].filter(Boolean).join(" · ");return `<div class="cd-match-row">${teamCell(x,"home")}<strong>VS</strong>${teamCell(x,"away")}${meta?`<small>${e(meta)}</small>`:""}</div>`}

function groupMatchKey(row){return `${c(row.match_date||row.source_page_date)}|${nk(row.home_name)}|${nk(row.away_name)}`}
function applyGroupLabels(rows,groupRows){
  const byFixture=new Map(),byId=new Map(),byMatch=new Map();
  for(const g of groupRows||[]){
    const label=c(g.group_label);
    if(!label)continue;
    if(c(g.sm_fixture_id))byFixture.set(c(g.sm_fixture_id),label);
    if(c(g.match_id))byId.set(c(g.match_id),label);
    byMatch.set(groupMatchKey(g),label);
  }
  return (rows||[]).map(x=>{
    if(groupValue(x))return x;
    const bySm=c(x.sm_fixture_id)&&byFixture.get(c(x.sm_fixture_id));
    const byCanonical=c(x.canonical_match_id)&&byId.get(c(x.canonical_match_id));
    const byNames=byMatch.get(groupMatchKey(x));
    const label=c(bySm||byCanonical||byNames);
    return label?{...x,group_label:label}:x;
  });
}
function canonicalScheduleRows(groupRows){
  return (groupRows||[]).filter(g=>{
    const status=c(g.match_status).toLowerCase();
    return status!=="played"&&(g.home_score==null||g.away_score==null);
  }).map(g=>({
    ...g,
    canonical_match_id:g.match_id,
    sm_round_label:c(g.round_name),
    home_team_id:g.home_team_id,
    away_team_id:g.away_team_id
  }));
}

function dateGroupContent(arr,mode){const draw=x=>mode==="schedule"?scheduleLine(x,false):resultLine(x,false);if(!arr.some(x=>groupValue(x)))return `<div class="cd-date-match-list">${arr.map(draw).join("")}</div>`;const buckets=new Map(),loose=[];for(const x of arr){const g=groupValue(x);if(!g){loose.push(x);continue}if(!buckets.has(g))buckets.set(g,[]);buckets.get(g).push(x)}const grouped=[...buckets.entries()].sort((a,b)=>groupCompare(a[0],b[0]));return `<div class="cd-nation-groups">${grouped.map(([g,rows])=>`<section class="cd-nation-group"><div class="cd-nation-group-title"><span>${e(groupDisplay(g))}</span></div><div class="cd-nation-group-matches">${rows.map(draw).join("")}</div></section>`).join("")}${loose.length?`<div class="cd-date-match-list">${loose.map(draw).join("")}</div>`:""}</div>`}
function dateGroups(rows,dateOf,mode){const buckets=new Map();for(const x of rows){const key=c(dateOf(x));if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(x)}const grouped=[...buckets.entries()].sort((a,b)=>mode==="schedule"?a[0].localeCompare(b[0]):b[0].localeCompare(a[0]));return `<div class="cd-date-groups">${grouped.map(([date,arr])=>`<section class="cd-date-group"><header class="cd-date-head"><strong>${e(formatDate(date))}</strong></header>${dateGroupContent(arr,mode)}</section>`).join("")}</div>`}
function table(rows,limit){const a=standings(rows),shown=limit?a.slice(0,limit):a;return a.length?`<div class="cd-table-wrap"><table class="cd-table"><thead><tr><th>#</th><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${shown.map((x,i)=>`<tr><td>${i+1}</td><td>${standingTeamCell(x.team,x.logo)}</td><td>${x.p}</td><td>${x.w}</td><td>${x.d}</td><td>${x.l}</td><td>${x.gd>0?"+":""}${x.gd}</td><td><strong>${x.pts}</strong></td></tr>`).join("")}</tbody></table></div>`:`<div class="cd-empty">Classifica non ancora disponibile.</div>`}
function groupedTables(){const gs=groups().filter(g=>rowsForGroup(g).length);if(!gs.length)return table(s.results);return `<div class="cd-group-tables">${gs.map(g=>`<section class="cd-group-table-block"><div class="cd-nation-group-title"><span>${e(groupDisplay(g))}</span></div>${table(rowsForGroup(g))}</section>`).join("")}</div>`}
function latestResult(){return uniqFixtures(s.results).sort((a,b)=>String(b.source_page_date||"").localeCompare(String(a.source_page_date||"")))[0]||null}
function nextMatch(){return [...s.schedule].filter(x=>c(x.match_date)>=new Date().toISOString().slice(0,10)).sort((a,b)=>c(a.match_date).localeCompare(c(b.match_date)))[0]||[...s.schedule].sort((a,b)=>c(a.match_date).localeCompare(c(b.match_date)))[0]||null}
function topScorer(){return [...s.stats].sort((a,b)=>n(b.goals)-n(a.goals)||n(b.avg_rating)-n(a.avg_rating))[0]||null}
function overview(){const played=uniqFixtures(s.results).length,total=n(s.meta&&s.meta.expected_total_matches)||played+uniqFixtures(s.schedule).length,teams=n(s.meta&&s.meta.IMC_league_teams_count)||allTeams().length,pr=total?Math.min(100,Math.round(played/total*100)):0,last=latestResult(),next=nextMatch(),lead=standings(s.results)[0],scorer=topScorer(),winner=s.trophies[0];return `<div class="cd-overview"><section class="cd-status"><div><span>COMPETITION STATUS</span><strong>${teams||"—"}</strong><small>TEAMS</small></div><div><strong>${played}<i>/</i>${total||"—"}</strong><small>MATCHES PLAYED</small></div><div class="cd-progress"><b style="width:${pr}%"></b></div><em>${pr}%</em></section><div class="cd-two">${last?`<article class="cd-mini"><span>LAST MATCH</span>${resultLine(last)}</article>`:`<article class="cd-mini cd-empty">Nessun risultato importato.</article>`}${next?`<article class="cd-mini"><span>NEXT MATCH</span>${scheduleLine(next)}</article>`:`<article class="cd-mini cd-empty">Nessuna partita futura importata.</article>`}</div>${lead?`<section class="cd-feature"><span>CURRENT LEADER</span><div>${badge(lead.team)}<strong>${e(lead.team)}</strong><b>${lead.pts} PTS</b></div></section>`:""}${scorer?`<section class="cd-feature"><span>TOP GOALSCORER</span><div>${badge(scorer.team_name)}<strong>${e(scorer.player_name)}</strong><b>${n(scorer.goals)} GOALS</b></div></section>`:""}${winner?`<section class="cd-feature"><span>PREVIOUS WINNER</span><div>${badge(winner.winning_team_name||winner.winning_nation_name)}<strong>${e(winner.winning_team_name||winner.winning_nation_name||"—")}</strong><b>${e(winner.season_id||"")}</b></div></section>`:""}</div>`}
function groupSelector(){const gs=groups();if(!gs.length)return"";if(!s.activeGroup||!gs.includes(s.activeGroup))s.activeGroup=gs[0];return `<div class="cd-group-scroll">${gs.map(g=>`<button type="button" data-cd-group="${e(g)}" class="${s.activeGroup===g?"active":""}">${e(groupDisplay(g))}</button>`).join("")}</div>`}
function knockout(){const rows=[...uniqFixtures(s.results).map(x=>({...x,_done:true})),...uniqFixtures(s.schedule).map(x=>({...x,_done:false}))],buckets=new Map();for(const x of rows){const r=c(x.sm_round_label)||"ROUND";if(!buckets.has(r))buckets.set(r,[]);buckets.get(r).push(x)}return buckets.size?`<div class="cd-rounds">${[...buckets.entries()].map(([r,arr])=>`<section><h3>${e(r)}</h3>${arr.slice(0,20).map(x=>x._done?resultLine(x):scheduleLine(x)).join("")}</section>`).join("")}</div>`:`<div class="cd-empty">Tabellone non ancora disponibile dagli import.</div>`}
function competition(){const f=format();if(f==="league")return `<div class="cd-subtabs"><button class="active">TABLE</button></div>${table(s.results)}`;if(f==="qualifier")return `<div class="cd-subtabs"><button class="active">GROUPS</button></div>${groupedTables()}`;if(f==="hybrid"){if(s.competitionSub!=="groups"&&s.competitionSub!=="knockout")s.competitionSub="groups";return `<div class="cd-subtabs"><button data-cd-comp="groups" class="${s.competitionSub==="groups"?"active":""}">GROUP STAGE</button><button data-cd-comp="knockout" class="${s.competitionSub==="knockout"?"active":""}">KNOCKOUT</button></div>${s.competitionSub==="groups"?groupedTables():knockout()}`};return `<div class="cd-subtabs"><button class="active">KNOCKOUT</button></div>${knockout()}`}
async function loadReports(){if(s.reports!==null)return;const ids=[...new Set(uniqFixtures(s.results).map(x=>c(x.sm_fixture_id)).filter(Boolean))].slice(0,120);if(!ids.length){s.reports=[];return}const rr=await Promise.allSettled(ids.map(id=>rpc("match_report",{gameWorld:s.worldId,fixtureId:id})));s.reports=rr.filter(x=>x.status==="fulfilled"&&x.value&&x.value.row).map(x=>x.value.row)}
function resultsList(){const rows=uniqFixtures(s.results).slice(0,100);return rows.length?dateGroups(rows,x=>x.source_page_date||x.match_date,"results"):`<div class="cd-empty">Nessun risultato importato.</div>`}
function scheduleList(){const rows=uniqFixtures(s.schedule).slice(0,160);return rows.length?dateGroups(rows,x=>x.match_date,"schedule"):`<div class="cd-empty">Nessuna schedule importata.</div>`}
function reportList(){if(s.reports===null)return`<div class="cd-empty">Caricamento Match Reports…</div>`;return s.reports.length?`<div class="cd-report-list">${s.reports.map(x=>`<article><strong>${e(x.source_competition_name||"MATCH REPORT")}</strong><span>${e(x.home_manager_name||"—")} · ${e(x.away_manager_name||"—")}</span><small>${e(x.stadium_name||"Stadio —")} · ${e(x.attendance||"—")}</small></article>`).join("")}</div>`:`<div class="cd-empty">Nessun Match Report disponibile per questa competition.</div>`}
function matches(){return `<div class="cd-subtabs"><button data-cd-match="results" class="${s.matchesSub==="results"?"active":""}">RESULTS</button><button data-cd-match="schedule" class="${s.matchesSub==="schedule"?"active":""}">SCHEDULE</button><button data-cd-match="reports" class="${s.matchesSub==="reports"?"active":""}">REPORTS</button></div>${s.matchesSub==="results"?resultsList():s.matchesSub==="schedule"?scheduleList():reportList()}`}
function stats(){const defs={goals:["GOALS",x=>n(x.goals)],assists:["ASSISTS",x=>n(x.assists)],rating:["RATING",x=>n(x.avg_rating)],mom:["MOM",x=>n(x.mom)],cards:["CARDS",x=>n(x.yellow_cards)+n(x.red_cards)]},d=defs[s.statsSub]||defs.goals,rows=[...s.stats].sort((a,b)=>d[1](b)-d[1](a)).slice(0,30);return `<div class="cd-subtabs cd-stat-tabs">${Object.keys(defs).map(k=>`<button data-cd-stat="${k}" class="${s.statsSub===k?"active":""}">${defs[k][0]}</button>`).join("")}</div>${rows.length?`<div class="cd-stat-list">${rows.map((x,i)=>`<div><b>${i+1}</b><strong>${e(x.player_name)}</strong><span>${e(x.team_name||"")}</span><em>${d[1](x)}</em></div>`).join("")}</div>`:`<div class="cd-empty">Statistiche non ancora importate per questa competition.</div>`}`}
function history(){return s.trophies.length?`<div class="cd-history"><div class="cd-history-head"><span>SEASON</span><span>WINNER</span><span>MANAGER</span><span>DATE</span></div>${s.trophies.map(x=>`<div><b>${e(x.season_id||"—")}</b><strong>${e(x.winning_team_name||x.winning_nation_name||"—")}</strong><span>${e(x.winning_manager_name||"—")}</span><small>${formatDate(x.won_on)}</small></div>`).join("")}</div>`:`<div class="cd-empty">Storico vincitori non ancora disponibile.</div>`}
function body(){if(s.tab==="overview")return overview();if(s.tab==="competition")return competition();if(s.tab==="matches")return matches();if(s.tab==="stats")return stats();return history()}
function render(){if(!s.container)return;s.container.innerHTML=`<section class="cd cd-v2" data-competition-detail-version="${VERSION}"><header class="cd-head"><button type="button" data-cd-back aria-label="Torna a Competitions">‹</button><div><span>${e(s.worldId)}</span><h2>${e(metaName())}</h2><small>${e(subtitle())}</small></div><div class="cd-head-icon">♛</div></header><nav class="cd-tabs">${[["overview","OVERVIEW"],["competition","COMPETITION"],["matches","MATCHES"],["stats","STATS"],["history","HISTORY"]].map(([k,l])=>`<button type="button" data-cd-tab="${k}" class="${s.tab===k?"active":""}">${l}</button>`).join("")}</nav><main class="cd-body">${body()}</main></section>`}
function buildTeamMaps(){s.teamByName=new Map();s.teamById=new Map();for(const t of s.teams){if(c(t.team_id))s.teamById.set(c(t.team_id),t);if(c(t.sm_world_club_id))s.teamById.set(c(t.sm_world_club_id),t);for(const name of [t.club_name,t.display_name])if(c(name))s.teamByName.set(nk(name),t)}s.managerByWorldId=new Map();s.managerBySmId=new Map();for(const m of s.teamManagers){if(!imcManagerName(m))continue;if(c(m.sm_world_entity_id))s.managerByWorldId.set(c(m.sm_world_entity_id),m);if(c(m.sm_manager_id))s.managerBySmId.set(c(m.sm_manager_id),m)}}
function buildNationMaps(){s.nationByName=new Map();for(const row of [...s.results,...s.schedule])for(const side of ["home","away"]){const name=c(row&&row[`${side}_name`]),flag=c(row&&row[`${side}_flag_file`]);if(name&&flag)s.nationByName.set(nk(name),flag)}}
async function load(){
  const m=await rpc("gw_competitions",{gameWorld:s.worldId});
  s.meta=(m.rows||[]).find(x=>c(x.competition_key)===s.competitionKey)||null;
  if(isNations()){
    const [nat,ps,tr]=await Promise.all([
      rpc("nation_competition_matches",{gameWorld:s.worldId,competitionKey:s.competitionKey}),
      rpc("competition_player_stats",{gameWorld:s.worldId,competitionKey:s.competitionKey}),
      rpc("trophy_room",{gameWorld:s.worldId,competitionKey:s.competitionKey})
    ]);
    s.results=uniqFixtures(nat.results||[]);
    s.schedule=uniqFixtures(nat.schedule||[]);
    s.stats=ps.rows||[];
    s.trophies=tr.rows||[];
    s.teams=[];
    s.teamManagers=[];
    buildTeamMaps();
    buildNationMaps();
    return;
  }
  const [r,sc,ps,tr,gt,tm,gm]=await Promise.all([
    rpc("results",{gameWorld:s.worldId,competitionKey:s.competitionKey,limit:1000}),
    rpc("schedule",{gameWorld:s.worldId}),
    rpc("competition_player_stats",{gameWorld:s.worldId,competitionKey:s.competitionKey}),
    rpc("trophy_room",{gameWorld:s.worldId,competitionKey:s.competitionKey}),
    rpc("gw_teams",{gameWorld:s.worldId}),
    rpc("team_managers",{gameWorld:s.worldId}),
    rpc("competition_group_matches",{gameWorld:s.worldId,competitionKey:s.competitionKey})
  ]);
  const groupRows=gm.rows||[];
  s.results=applyGroupLabels(uniqFixtures(r.rows||[]),groupRows);
  const importedSchedule=uniqFixtures((sc.rows||[]).filter(x=>c(x.competition_key)===s.competitionKey));
  s.schedule=applyGroupLabels(uniqFixtures([...importedSchedule,...canonicalScheduleRows(groupRows)]),groupRows);
  s.stats=ps.rows||[];
  s.trophies=tr.rows||[];
  s.teams=gt.rows||[];
  s.teamManagers=(tm.rows||[]).filter(x=>c(x.entity_type)==="club");
  buildTeamMaps();
  buildNationMaps();
}
async function mount(o){if(!o||!o.container||!o.client||!o.worldId||!o.competitionKey)throw Error("Competition Detail: parametri mancanti");s={...s,...o,worldId:c(o.worldId),competitionKey:c(o.competitionKey),name:c(o.name),meta:null,results:[],schedule:[],stats:[],trophies:[],teams:[],teamManagers:[],teamByName:new Map(),teamById:new Map(),managerByWorldId:new Map(),managerBySmId:new Map(),nationByName:new Map(),tab:"overview",competitionSub:"table",matchesSub:"results",statsSub:"goals",activeGroup:"",reports:null};s.container.innerHTML='<div class="cd-empty">Caricamento Competition…</div>';await load();render()}
function unmount(){if(s.container)s.container.innerHTML="";s.container=null}
document.addEventListener("click",async ev=>{if(!s.container||!s.container.contains(ev.target))return;const back=ev.target.closest?.("[data-cd-back]");if(back){document.dispatchEvent(new CustomEvent("nexus:navigate",{detail:{target:"game-world-section",worldId:s.worldId,section:"competitions"}}));return}const t=ev.target.closest?.("[data-cd-tab]");if(t){s.tab=c(t.getAttribute("data-cd-tab"));render();return}const g=ev.target.closest?.("[data-cd-group]");if(g){s.activeGroup=c(g.getAttribute("data-cd-group"));render();return}const q=ev.target.closest?.("[data-cd-comp]");if(q){s.competitionSub=c(q.getAttribute("data-cd-comp"));render();return}const m=ev.target.closest?.("[data-cd-match]");if(m){s.matchesSub=c(m.getAttribute("data-cd-match"));if(s.matchesSub==="reports"&&s.reports===null){render();await loadReports()}render();return}const st=ev.target.closest?.("[data-cd-stat]");if(st){s.statsSub=c(st.getAttribute("data-cd-stat"));render()}});
window.IMC_COMPETITION_DETAIL={version:VERSION,mount,unmount};
})();