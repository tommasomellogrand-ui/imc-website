const assert=require('node:assert/strict'),fs=require('node:fs');
const d=JSON.parse(fs.readFileSync('nexus/series/catalog.json'));
assert.equal(d.world,'GW011');assert.equal(d.clubs.length,20);assert.equal(d.characters.length,9);
const chars=new Set(d.characters.map(c=>c.id)),clubs=new Set(d.clubs.map(c=>String(c.entity_id))),eps=new Set();
assert.equal(chars.size,9);
for(const c of d.characters){assert(c.name&&c.role&&c.description);assert.equal(c.face.length,2);assert(c.face.every(Number.isFinite));}
for(const e of d.episodes){assert(!eps.has(e.id));eps.add(e.id);assert(Number.isFinite(Date.parse(e.publishedAt)));assert(['published','draft'].includes(e.status));assert(e.clubs.every(id=>clubs.has(id)));assert(e.messages.length>0);for(const m of e.messages){assert(chars.has(m.character));assert(m.text);}}
console.log('GW011 catalog: club associations, character identities and episode order validated.');
