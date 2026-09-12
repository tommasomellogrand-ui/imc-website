"""Read-only byte comparison. No DB/API queries or deployment."""
import base64, concurrent.futures, hashlib, json, sys, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[2]
baseline=json.loads((Path(__file__).parent/'golden-master/source-baseline.json').read_text())
paths=['minisite/GW001/'+n for n in (root/'minisite/GW001/exploration-manifest.txt').read_text().splitlines() if n.strip() and not n.startswith('.')]
paths += [p for p in baseline['files'] if p.startswith('minisite/GW007/') and Path(p).suffix in ('.html','.css','.js','.ttf','.webp')]
decoded={p.with_suffix('.webp').relative_to(root).as_posix():base64.b64decode(p.read_text()) for p in (root/'minisite/GW007/assets').glob('*.b64')}
paths += list(decoded)
def check(path):
    expected=decoded[path] if path in decoded else (root/path).read_bytes()
    url='https://www.italianmastersclub.it/'+path+'?phase1='+baseline['baselineCommit']
    try:
        with urllib.request.urlopen(url,timeout=45) as response:
            actual=response.read();status=response.status
        return {'path':path,'status':status,'equal':actual==expected,'sha256':hashlib.sha256(actual).hexdigest()}
    except Exception as exc:
        return {'path':path,'equal':False,'error':str(exc)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results=list(pool.map(check,sorted(set(paths))))
report={'baselineCommit':baseline['baselineCommit'],'checks':results,'pass':all(r['equal'] for r in results)}
if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':report['pass'],'files':len(results),'failures':[r for r in results if not r['equal']]},indent=2))
sys.exit(0 if report['pass'] else 1)
