(function(){
"use strict";
if(window.IMC_CLUBHOUSE_FEED_EDITORIAL)return;
const VERSION="1.0.0";
const c=v=>String(v==null?"":v).trim();
const e=v=>c(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const upper=v=>c(v).toLocaleUpperCase("it-IT");
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
let running=false,queued=false;

function statsOf(payload){
 const s=payload&&((payload.teamStats)||(payload.team_stats))||{};
 const side=x=>({possession:num(s[x]&&s[x].possession),totalShots:num(s[x]&&s[x].totalShots),shotsOnTarget:num(s[x]&&s[x].shotsOnTarget),corners:num(s[x]&&s[x].corners),yellowCards:num(s[x]&&s[x].yellowCards),redCards:num(s[x]&&s[x].redCards)});
 return{home:side("home"),away:side("away")};
}
function playersOf(payload){return Array.isArray(payload&&payload.players)?payload.players:[]}
function playerId(p){return num(p&&((p.smPlayerId)||(p.sm_player_id)))||null}
function playerScore(p){return(p&&p.isManOfMatch?120:0)+num(p&&p.goals)*30+num(p&&p.assists)*16+num(p&&p.rating)*3+(p&&p.isStarter?2:0)}
function protagonistsOf(payload){return playersOf(payload).filter(p=>playerId(p)).sort((a,b)=>playerScore(b)-playerScore(a)).slice(0,3)}
function profileName(p,profiles){const q=profiles.get(playerId(p));return c(q&&q.full_name)||c(p&&p.playerName)||c(p&&p.player_name)||"Giocatore"}
function managerName(row,side){return c(row&&row[side+"_imc_manager_name"]||row&&row[side+"_manager_name"])}
function teamName(row,side){return c(row&&row[side+"_team"])}
function imcSides(row){const a=[];if(c(row&&row.home_manager_type)==="IMC")a.push("home");if(c(row&&row.away_manager_type)==="IMC")a.push("away");return a}
function winnerSide(row){return c(row&&row.match_winner_side)}
function isSemi(row){return /semifinale/i.test(c(row&&row.sm_round_label))||/semifinale/i.test(c(row&&row.source_competition_name))}
function isFinal(row){return c(row&&row.phase_type)==="final"}
function winnerTeam(row){const w=winnerSide(row);return w==="home"?teamName(row,"home"):w==="away"?teamName(row,"away"):""}
function loserTeam(row){const w=winnerSide(row);return w==="home"?teamName(row,"away"):w==="away"?teamName(row,"home"):""}
function scoreLine(row){return `${c(row.home_score)}-${c(row.away_score)}`}
function ownStats(stats,side){return side==="home"?stats.home:stats.away}
function oppStats(stats,side){return side==="home"?stats.away:stats.home}
function tacticsAtStart(payload,side){const rows=Array.isArray(payload&&payload.tactics)?payload.tactics:[];return rows.find(x=>c(x.side)===side&&num(x.minute)===0)||rows.find(x=>c(x.side)===side)||null}
function scorers(players,side,profiles){return players.filter(p=>c(p.side)===side&&num(p.goals)>0).sort((a,b)=>num(b.goals)-num(a.goals)).map(p=>`${profileName(p,profiles)}${num(p.goals)>1?` (${num(p.goals)})`:""}`)}
function bestPlayer(players,profiles){const p=[...players].sort((a,b)=>playerScore(b)-playerScore(a))[0];return p?{p,name:profileName(p,profiles)}:null}

function narrative(row,payload,profiles){
 const stats=statsOf(payload),players=playersOf(payload),w=winnerSide(row),home=teamName(row,"home"),away=teamName(row,"away"),derby=imcSides(row).length>1;
 let first="";
 if(w==="draw")first=`${home} e ${away} chiudono sul ${scoreLine(row)}.`;
 else if(isSemi(row))first=derby?`${winnerTeam(row)} si prende il derby IMC di semifinale e conquista la finale: ${scoreLine(row)} contro ${loserTeam(row)}.`:`${winnerTeam(row)} conquista la finale superando ${loserTeam(row)} ${scoreLine(row)}.`;
 else if(isFinal(row))first=`${winnerTeam(row)} vince la finale contro ${loserTeam(row)} con il risultato di ${scoreLine(row)}.`;
 else first=`${winnerTeam(row)} supera ${loserTeam(row)} ${scoreLine(row)} e si prende il verdetto della sfida.`;
 if(row.decided_on_penalties)first+=` Ai rigori finisce ${c(row.home_penalties)}-${c(row.away_penalties)}.`;
 const ws=w==="home"?stats.home:w==="away"?stats.away:null,ls=w==="home"?stats.away:w==="away"?stats.home:null;
 const pieces=[];
 if(ws&&ls){
  if(Math.abs(ws.shotsOnTarget-ls.shotsOnTarget)>=3)pieces.push(`${ws.shotsOnTarget} tiri nello specchio contro ${ls.shotsOnTarget}`);
  else pieces.push(`${stats.home.shotsOnTarget}-${stats.away.shotsOnTarget} nei tiri in porta`);
  pieces.push(`possesso ${stats.home.possession}%-${stats.away.possession}%`);
 }
 const goalsHome=scorers(players,"home",profiles),goalsAway=scorers(players,"away",profiles);
 if(goalsHome.length||goalsAway.length){const all=[];if(goalsHome.length)all.push(`${home}: ${goalsHome.join(", ")}`);if(goalsAway.length)all.push(`${away}: ${goalsAway.join(", ")}`);pieces.push(`marcatori ${all.join(" · ")}`)}
 const best=bestPlayer(players,profiles);if(best&&best.p.isManOfMatch)pieces.push(`MVP ${best.name}, voto ${num(best.p.rating)}`);
 const reds=stats.home.redCards+stats.away.redCards;if(reds)pieces.push(`espulsioni ${stats.home.redCards}-${stats.away.redCards}`);
 const second=pieces.length?`I dati del Match Report raccontano ${pieces.join("; ")}.`:"Il Match Report consegna il risultato e il verdetto della partita.";
 return[first,second]
}

function statRows(stats){
 const rows=[
  ["POSSESSO",`${stats.home.possession}%`,`${stats.away.possession}%`],
  ["TIRI",stats.home.totalShots,stats.away.totalShots],
  ["TIRI IN PORTA",stats.home.shotsOnTarget,stats.away.shotsOnTarget],
  ["CORNER",stats.home.corners,stats.away.corners]
 ];
 if(stats.home.redCards||stats.away.redCards)rows.push(["ESPULSIONI",stats.home.redCards,stats.away.redCards]);
 return rows
}
function statsMarkup(row,payload){const stats=statsOf(payload);return `<div class="ch-feed-ed-teamheads"><strong>${e(teamName(row,"home"))}</strong><strong>${e(teamName(row,"away"))}</strong></div><div class="ch-feed-ed-stats">${statRows(stats).map(x=>`<div class="ch-feed-ed-stat"><b>${e(x[1])}</b><span>${e(x[0])}</span><b>${e(x[2])}</b></div>`).join("")}</div>`}
function playerFacts(p){const a=[];if(num(p.goals))a.push(`${num(p.goals)} GOL`);if(num(p.assists))a.push(`${num(p.assists)} ASSIST`);if(c(p.rating))a.push(`VOTO ${e(p.rating)}`);if(p.isManOfMatch)a.push("MVP");return a.join(" · ")||"PROTAGONISTA"}
function playerBlurb(p){if(p.isManOfMatch&&num(p.goals))return"MVP e decisivo nel tabellino.";if(p.isManOfMatch)return"Migliore in campo secondo il Match Report.";if(num(p.goals)>1)return"Firma più di un gol nella sfida.";if(num(p.goals))return"Trova il gol nella partita.";if(num(p.assists)>1)return"Costruisce più di un gol con i suoi assist.";if(num(p.assists))return"Incide con un assist.";return c(p.rating)?`Prestazione da voto ${c(p.rating)}.`:"Tra i giocatori evidenziati dal report."}
function protagonistsMarkup(items,profiles){return `<div class="ch-feed-ed-players">${items.map(p=>{const q=profiles.get(playerId(p))||{},photo=c(q.photo_url),name=profileName(p,profiles);return `<div class="ch-feed-ed-player">${photo?`<img src="${e(photo)}" alt="${e(name)}" loading="lazy">`:""}<div><strong>${e(name)}</strong><span>${playerFacts(p)}</span><small>${e(playerBlurb(p))}</small></div></div>`}).join("")}</div>`}

function mainQuote(row,side,stats){
 const own=ownStats(stats,side),opp=oppStats(stats,side),win=winnerSide(row)===side,draw=winnerSide(row)==="draw";
 if(draw)return `«È stata una partita in equilibrio. Il ${scoreLine(row)} lascia il risultato aperto e i numeri confermano quanto sia stata combattuta.»`;
 if(win&&isSemi(row)){
  if(Math.abs(own.shotsOnTarget-opp.shotsOnTarget)<=1)return `«Una semifinale così si decide sui dettagli. Abbiamo chiuso con ${own.shotsOnTarget} tiri in porta contro ${opp.shotsOnTarget}: non è stato un dominio, ma siamo stati noi a trovare il colpo che vale la finale.»`;
  return `«La finale ce la siamo presa sul campo. ${own.shotsOnTarget} tiri nello specchio contro ${opp.shotsOnTarget} raccontano quanto siamo riusciti a essere concreti quando contava.»`;
 }
 if(!win&&isSemi(row)){
  if(Math.abs(own.shotsOnTarget-opp.shotsOnTarget)<=1)return `«Fa male uscire in semifinale perché la partita era lì: ${own.shotsOnTarget} tiri in porta contro ${opp.shotsOnTarget}. Ci è mancato il gol nel momento decisivo.»`;
  return `«Il risultato ci elimina e i numeri sono chiari: ${own.shotsOnTarget} tiri nello specchio contro ${opp.shotsOnTarget}. Abbiamo concesso troppo per una semifinale.»`;
 }
 if(win)return `«Il risultato premia la nostra concretezza. Abbiamo prodotto ${own.shotsOnTarget} tiri nello specchio e siamo riusciti a trasformare il lavoro della squadra nel verdetto che volevamo.»`;
 return `«La sconfitta pesa. Abbiamo prodotto ${own.shotsOnTarget} tiri nello specchio, ma dall'altra parte ne sono arrivati ${opp.shotsOnTarget}: dobbiamo leggere la partita senza alibi.»`
}
function matchQuote(side,stats){const own=ownStats(stats,side),opp=oppStats(stats,side);if(own.possession>=55)return `«Il ${own.possession}% di possesso ci ha permesso di dare ritmo alla gara, ma il possesso conta davvero solo quando diventa occasioni: abbiamo chiuso con ${own.totalShots} tiri.»`;if(own.possession<=45)return `«Abbiamo avuto il ${own.possession}% di possesso e sapevamo che avremmo dovuto scegliere bene quando accelerare. I ${own.totalShots} tiri prodotti raccontano il volume che siamo riusciti comunque a creare.»`;return `«Il possesso è stato molto equilibrato. La differenza si è giocata soprattutto nella qualità delle conclusioni: ${own.shotsOnTarget} nello specchio per noi, ${opp.shotsOnTarget} per loro.»`}
function tacticQuote(payload,side,won){const t=tacticsAtStart(payload,side);if(!t)return"";const x=t.tactics||{},bits=[];if(c(t.formation))bits.push(c(t.formation));if(c(x.mentality))bits.push(`mentalità ${c(x.mentality).toLocaleLowerCase("it-IT")}`);if(c(x.tempo))bits.push(`ritmo ${c(x.tempo).toLocaleLowerCase("it-IT")}`);if(c(x.pressing))bits.push(`pressing ${c(x.pressing).toLocaleLowerCase("it-IT")}`);if(!bits.length)return"";return `«Siamo partiti con ${bits.join(", ")}. ${won?"Era il piano iniziale e siamo riusciti a sostenerlo fino al verdetto.":"Era il piano iniziale, ma il risultato ci dice che non è bastato."}»`}
function pressMarkup(row,payload){
 const stats=statsOf(payload),sides=imcSides(row);return `<div class="ch-feed-ed-press">${sides.map(side=>{const name=managerName(row,side),team=teamName(row,side),won=winnerSide(row)===side,tq=tacticQuote(payload,side,won);return `<div class="ch-feed-ed-manager"><div class="ch-feed-ed-manager-head"><strong>${e(upper(name))}</strong><span>MANAGER · ${e(upper(team))}</span></div><blockquote>${e(mainQuote(row,side,stats))}</blockquote><div class="ch-feed-ed-answer"><b>SULLA PARTITA</b><p>${e(matchQuote(side,stats))}</p></div>${tq?`<div class="ch-feed-ed-answer"><b>SULLE SCELTE</b><p>${e(tq)}</p></div>`:""}</div>`}).join("")}</div>`
}
function verdict(row){const w=winnerTeam(row),l=loserTeam(row);if(isFinal(row)&&w)return `${upper(w)} CAMPIONE · ${upper(l)} FINALISTA`;if(isSemi(row)&&w)return `${upper(w)} IN FINALE · ${upper(l)} ELIMINATO`;if(c(row.phase_type)==="first_leg")return `${upper(teamName(row,winnerSide(row)==="away"?"away":"home"))} AVANTI NEL PRIMO ATTO · SFIDA ANCORA APERTA`;if(c(row.phase_type)==="group")return `RISULTATO DEL GIRONE: ${upper(teamName(row,"home"))} ${c(row.home_score)}-${c(row.away_score)} ${upper(teamName(row,"away"))}`;if(c(row.phase_type)==="second_leg"&&c(row.qualified_team))return `${upper(row.qualified_team)} QUALIFICATO`;if(w)return `${upper(w)} QUALIFICATO · ${upper(l)} ELIMINATO`;return"VERDETTO NON DEFINITO"}
function sectionTitle(t){return `<div class="ch-feed-ed-title"><span>${e(t)}</span></div>`}
function editorialMarkup(row,payload,items,profiles){const rac=narrative(row,payload,profiles);return `<div class="ch-feed-editorial">${sectionTitle("IL RACCONTO")}<div class="ch-feed-ed-story"><p>${e(rac[0])}</p><p>${e(rac[1])}</p></div>${sectionTitle("I NUMERI")}${statsMarkup(row,payload)}${items.length?sectionTitle("PROTAGONISTI")+protagonistsMarkup(items,profiles):""}${sectionTitle("POST MATCH")}${pressMarkup(row,payload)}${sectionTitle("IL VERDETTO")}<div class="ch-feed-ed-verdict">${e(verdict(row))}</div></div>`}

async function hydrate(){
 if(running)return;
 const cards=[...document.querySelectorAll('.ch-feed-card[data-fixture-id]:not([data-editorial-ready]):not([data-editorial-loading])')];
 if(!cards.length)return;
 const client=window.__IMC_NEXUS_CLIENT__;if(!client)return;
 running=true;cards.forEach(x=>x.setAttribute("data-editorial-loading","1"));
 try{
  const fr=await client.rpc("imc_nexus_gateway",{p_action:"club_house_feed",p_args:{}});if(fr.error)throw fr.error;
  const rows=Array.isArray(fr.data&&fr.data.rows)?fr.data.rows:[],map=new Map(rows.map(r=>[c(r.sm_fixture_id),r]));
  const details=await Promise.all(cards.map(async card=>{const row=map.get(c(card.getAttribute("data-fixture-id")));if(!row)return{card,row:null,payload:null,items:[]};try{const rr=await client.rpc("imc_nexus_gateway",{p_action:"match_report",p_args:{gameWorld:c(row.game_world_id),fixtureId:Number(row.sm_fixture_id)}});if(rr.error)throw rr.error;const report=rr.data&&rr.data.row,payload=report&&report.source_payload||{};return{card,row,payload,items:protagonistsOf(payload)}}catch(_){return{card,row,payload:null,items:[]}}}));
  const ids=[...new Set(details.flatMap(d=>d.items.map(playerId)).filter(Boolean))],profiles=new Map();
  if(ids.length){try{const pr=await client.rpc("imc_nexus_gateway",{p_action:"player_global_resolve",p_args:{playerIds:ids}});if(!pr.error){for(const x of Array.isArray(pr.data&&pr.data.rows)?pr.data.rows:[])profiles.set(num(x.player_id),x)}}catch(_){}}
  for(const d of details){d.card.removeAttribute("data-editorial-loading");if(!d.row||!d.payload){d.card.setAttribute("data-editorial-ready","unavailable");continue}d.card.insertAdjacentHTML("beforeend",editorialMarkup(d.row,d.payload,d.items,profiles));d.card.setAttribute("data-editorial-ready","1")}
 }catch(_){cards.forEach(x=>x.removeAttribute("data-editorial-loading"))}finally{running=false}
}
function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;hydrate()},90)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("click",schedule);
schedule();
window.IMC_CLUBHOUSE_FEED_EDITORIAL={version:VERSION,refresh:schedule};
})();