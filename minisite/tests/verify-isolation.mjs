import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const baseline=JSON.parse(readFileSync(new URL('./golden-master/source-baseline.json',import.meta.url)));
for (const [path,expected] of Object.entries(baseline.files)) {
  const bytes=readFileSync(resolve(root,path));
  const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(hash,expected,`Legacy baseline changed: ${path}`);
  if (/\.(js|html|css)$/.test(path)) assert.doesNotMatch(bytes.toString(),/minisite\/platform|\.\.\/platform/,path);
}
// This verifier deliberately imports no platform module: it also runs with platform removed.
console.log(JSON.stringify({result:'PASS',verifiedLegacyFiles:Object.keys(baseline.files).length,platformPresent:existsSync(resolve(root,'minisite/platform'))}));
