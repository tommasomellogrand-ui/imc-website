const assert=require('node:assert/strict');
const data=require('../nexus/alltoplayfor/2026-10-22-coffee.json');
const roster=require('../nexus/alltoplayfor/correspondents.json');
assert.equal(roster.items.length,40);
assert.equal(new Set(roster.items.map(a=>a.club_id)).size,40);
assert.equal(new Set(roster.items.map(a=>a.name)).size,40);
assert.equal(roster.items.filter(a=>a.status==='confirmed').length,20);
assert.equal(roster.items.filter(a=>a.status==='trial').length,20);
assert.deepEqual(data.assignments,roster);
for(const f of data.divisions.flatMap(d=>d.fixtures)){
 assert.equal(f.home_reporter.club_id,f.home_table.id);
 assert.equal(f.reporters.length,2);
 if(f.home_reporter.status==='trial'){
  assert.match(f.home_reporter.label,/in prova/);
  assert.match(f.reporter_intro,/Sono ancora in prova/);
  assert.match(f.reporter_intro,/non sono ancora sul pezzo/);
 }
}
assert.equal(roster.items.find(a=>a.club_id===94078890).name,'Paolo Assogna');
assert.equal(roster.items.find(a=>a.club_id===94082591).name,'Valentina Ciarlante');
console.log('40 unique correspondents; 20 confirmed, 20 trial; home voices and explicit trial disclosures verified');
