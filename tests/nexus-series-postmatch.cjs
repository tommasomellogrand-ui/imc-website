const assert=require('node:assert/strict');
const d=require('../nexus/series/rth/2026-10-20-postmatch.json');
assert.equal(d.matches.length,8);assert.equal(d.quarterfinals.length,4);
assert.deepEqual([...new Set(d.opening.map(s=>s[0]))].sort(),['Alex Del Piero','Billy Costacurta','Federica Masolin','Paolo Condò']);
assert.equal(d.reporters.length,40);assert.equal(new Set(d.reporters.map(r=>r.name)).size,40);assert.equal(new Set(d.reporters.map(r=>r.club_id)).size,40);
assert.equal(d.reporters.find(r=>r.club_id==='404').name,'Giorgia Cenni');
assert.equal(d.matches.reduce((n,m)=>n+m.home_score+m.away_score,0),27);
assert.equal(d.matches.filter(m=>m.penalty_home_score!=null).length,4);
const winners=[];
for(const m of d.matches){
 assert.equal(m.date,d.match_date);assert(m.intro.includes(m.reporter));
 assert.equal(m.reporter,d.reporters.find(r=>r.club_id===m.teams.home.id).name);
 const winner=m.home_score===m.away_score?(m.penalty_home_score>m.penalty_away_score?'home':'away'):(m.home_score>m.away_score?'home':'away');winners.push(m.teams[winner].name);
 for(const t of Object.values(m.teams)){
  assert(t.questions.length>0&&t.questions.length<=5);assert.equal(t.questions[0].voice,m.reporter);assert.equal(t.questions[0].recipient,t.manager);
  assert(t.next.date>d.match_date);assert(m.closing.includes(t.next.home+'–'+t.next.away));
  for(const q of t.questions){assert(q.question&&q.answer);if(q.from_field)assert.equal(q.voice,m.reporter);if(q.player_id)assert(m.players.some(p=>p.sm_player_id===q.player_id));if(q.voice==='Alex Del Piero'){assert(q.codex_rating>=93);assert(/CO|A\(/.test(q.position));const p=m.players.find(p=>p.sm_player_id===q.player_id);assert(p.goals||p.assists)}}
 }
}
assert.deepEqual(winners.sort(),d.quarterfinals.flatMap(q=>[q.home,q.away]).sort());
assert(d.quarterfinals.every(q=>q.date==='2026-10-27'&&q.time==='20:00'));
console.log('Postmatch: eight results, four verified quarterfinals, 40 reporters and question rules validated');
