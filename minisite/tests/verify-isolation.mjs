import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const baseline=JSON.parse(readFileSync(new URL('./golden-master/source-baseline.json',import.meta.url)));
// IMC-ENG-009-07 changes only the listed GW001 HTML entry points plus the previous GW007 pair; the historical baseline stays immutable.
const integrated=new Set(['minisite/GW001/index.html','minisite/GW001/results.html','minisite/GW001/schedule.html','minisite/GW001/match.html','minisite/GW001/club.html','minisite/GW001/manager.html','minisite/GW001/player.html','minisite/GW001/competitions.html','minisite/GW001/standings.html','minisite/GW001/archive.html','minisite/GW007/results.html','minisite/GW007/schedule.html']);
for (const [path,expected] of Object.entries(baseline.files)) {
  if(integrated.has(path)) continue;
  const bytes=readFileSync(resolve(root,path));
  const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(hash,expected,`Legacy baseline changed: ${path}`);
  if (/\.(js|html|css)$/.test(path)) assert.doesNotMatch(bytes.toString(),/minisite\/platform|\.\.\/platform/,path);
}
// This verifier deliberately imports no platform module: it also runs with platform removed.
console.log(JSON.stringify({result:'PASS',verifiedLegacyFiles:Object.keys(baseline.files).length-integrated.size,platformPresent:existsSync(resolve(root,'minisite/platform'))}));

