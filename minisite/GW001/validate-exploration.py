"""Validate the bounded GW001 exploration package and deployed checksums."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from urllib.request import urlopen, Request
import concurrent.futures
import hashlib
import json
import os
import re
import sys

ROOT = Path(__file__).resolve().parent
FILES = [s for s in (ROOT / 'exploration-manifest.txt').read_text().splitlines() if s]
PAGES = ['index.html', 'competitions.html', 'results.html', 'schedule.html', 'match.html', 'standings.html', 'manager.html', 'player.html', 'club.html', 'archive.html']
assert len(set(FILES)) == len(FILES)
for name in FILES:
    assert not Path(name).is_absolute() and '..' not in Path(name).parts
    assert (ROOT / name).is_file() and (ROOT / name).stat().st_size > 0, name

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'href'):
            url = attrs.get(key, '')
            if not url or url.startswith(('#', 'https:', 'http:')):
                continue
            assert (ROOT / urlsplit(url).path).is_file(), url

for page in PAGES:
    html = (ROOT / page).read_text()
    assert 'RTH_EXP_01' in html and 'data-page=' in html
    Links().feed(html)
for asset in re.findall(r'url\(([^)]+)\)', (ROOT / 'exploration-fonts.css').read_text()):
    assert (ROOT / asset).is_file(), asset
payload = (ROOT / 'exploration-data.js').read_text().removeprefix('window.RTH_DATA = ').strip().removesuffix(';')
data = json.loads(payload)
assert data['results'] and data['schedule']
assert len({r['sm_fixture_id'] for r in data['results']}) == len(data['results'])
print(f'Validated {len(PAGES)} pages, {len(FILES)} deployed files and snapshot data.')

if '--live' in sys.argv:
    base = 'https://www.italianmastersclub.it/minisite/GW001/'
    revision = os.environ.get('GITHUB_SHA', 'RTH_EXP_01')
    def verify(name):
        if name == '.htaccess':
            return
        request = Request(base + name + '?verify=' + revision, headers={'Cache-Control': 'no-cache'})
        with urlopen(request, timeout=45) as response:
            actual = response.read()
            assert response.status == 200, name
        expected = (ROOT / name).read_bytes()
        assert hashlib.sha256(actual).digest() == hashlib.sha256(expected).digest(), 'Live checksum mismatch: ' + name
        print('Live verified:', name)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(verify, FILES))
    print('All live GW001 exploration files match this commit.')
