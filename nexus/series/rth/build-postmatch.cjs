// Rebuild the dated publication from archived Nexus API responses, never live at render time.
// Usage: node nexus/series/rth/build-postmatch.cjs /path/to/evidence
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=process.argv[2];assert(dir,'An evidence directory is required');
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const base=require('./2026-10-20.json'),editorial=require('./postmatch-editorial.cjs');
const assignments=['Pietro Nicolodi','Antonio Nucera','Gianluigi Bagnulo','Massimiliano Nebuloni','Andrea Paventi','Stefano Borghi','Francesco Cosatti','Federico Zancan','Marco Demicheli','Nicola Roggero','Filippo Benincampi','Dario Massara','Marco Bovicelli','Matteo Barzaghi','Gianluca Di Marzio','Riccardo Gentile','Peppe Di Stefano','Riccardo Re','Ilaria Alesso','Giorgia Cenni','Manuele Baiocchini','Matteo Petrucci','Niccolò Omini','Massimo Ugolini','Paolo Assogna','Bruno Palermo','Luca Cilli','Marco Nosotti','Giovanni Guardalà','Francesco Modugno','Maurizio Compagnoni','Angelo Mangiante','Vanessa Leonardi','Marina Presello','Daniele Barone','Alessandro Sugoni','Valentina Mariani','Paolo Aghemo','Massimo Marianella','Valentina Caruso'];
const clubNames=['1860','Académica','AEK','Atalanta','Atlético','Boca','Bologna','Borussia','Campobasso','Celtic','Club América','Dynamo Dresden','Dynamo Kyiv','Eintracht','Fenerbahçe','Feyenoord','Flamengo','Genoa','Guangzhou','Hertha','Kaiserslautern','Lazio','Legia','Napoli','Olympique','Palermo','Palmeiras','Parma','Partizan','Reggina','River','Roma','Sampdoria','São Paulo','Schalke','Shakhtar','Sunderland','Torino','Tottenham','Valencia'];
const reporters=clubNames.map((name,i)=>{const c=base.clubs.find(c=>c.name.includes(name));assert(c,name);return {club_id:c.id,club:c.name,name:assignments[i]}});
const club=id=>base.clubs.find(c=>c.world_id===Number(id));
const source=id=>'https://www.italianmastersclub.it/nexus/teams/matches.php?world=GW001&sm_club='+id;
const fixture=f=>({id:f.sm_fixture_id,date:f.match_date,time:f.match_time?.slice(0,5),home:club(f.home_sm_team_id)?.name||f.home_name,away:club(f.away_sm_team_id)?.name||f.away_name});
const quarters=new Map();
const matches=Object.entries(editorial.matches).map(([id,ed])=>{
 const mr=read('mr-'+id+'.json').row,stats=JSON.parse(mr.team_stats_json),players=JSON.parse(mr.players_json);
 const h=club(mr.home_sm_club_id),a=club(mr.away_sm_club_id);assert(h&&a);
 const reporter=reporters.find(r=>r.club_id===h.id).name;
 const homeResults=read('club-'+h.id+'.json');const result=homeResults.results.find(r=>String(r.sm_fixture_id)===id);assert(result);
 const m={id,date:mr.match_date,title:ed.title,intro:ed.intro,reporter,stadium:mr.stadium_name,home_score:mr.home_score,away_score:mr.away_score,penalty_home_score:result.penalty_home_score,penalty_away_score:result.penalty_away_score,stats,players,sources:{report:'https://www.italianmastersclub.it/nexus/competitions/match-report.php?world=GW001&fixture='+id,results:source(h.id)},teams:{}};
 for(const [side,c] of [['home',h],['away',a]]){
  const roster=read('roster-'+c.id+'.json').rows,schedule=read('club-'+c.id+'.json').schedule;
  schedule.filter(f=>f.sm_action==='leaguecup'&&f.match_date==='2026-10-27').forEach(f=>quarters.set(f.sm_fixture_id,fixture(f)));
  const next=schedule.filter(f=>f.match_date>mr.match_date).sort((a,b)=>a.match_date.localeCompare(b.match_date))[0];assert(next);
  const questions=ed[side].map(([voice,recipient,question,answer])=>{
   const p=recipient==='manager'?null:roster.find(p=>p.player_id===recipient);assert(recipient==='manager'||p,recipient);
   return {voice:voice==='reporter'?reporter:voice,from_field:voice==='reporter',recipient:p?p.full_name:c.manager.full_name,role:p?'Giocatore · '+c.name:'Manager · '+c.name,player_id:p?.player_id||null,image:p?.image_urls?.[0]||null,codex_rating:p?.rating||null,position:p?.position||null,question,answer};
  });
  m.teams[side]={id:c.id,name:c.name,crest:c.image_url,manager:c.manager.full_name,next:fixture(next),questions};
 }
 m.scorers=stats.scorers.map(s=>({...s,player_name:id==='369216975'&&s.own_goal?'Autorete (attribuzione discordante nel report)':s.player_name}));
 m.mvp=players.find(p=>p.man_of_match);
 m.closing='Ci vediamo alla prossima: il 22 ottobre ci aspettano '+[m.teams.home.next,m.teams.away.next].map(n=>n.home+'–'+n.away).join(' e ')+'. Dallo studio, buona serata!';
 return m;
});
const output={world:'GW001',match_date:'2026-10-20',published_date:'2026-10-21',competition:'League Cup',reporters,opening:editorial.opening,quarterfinals:[...quarters.values()].sort((a,b)=>a.id-b.id),matches};
assert.equal(matches.length,8);assert.equal(quarters.size,4);assert.equal(new Set(reporters.map(r=>r.name)).size,40);
fs.writeFileSync(path.join(__dirname,'2026-10-20-postmatch.json'),JSON.stringify(output,null,2)+'\n');
