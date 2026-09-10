from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).parent
pages=['index','world','kingdom','competitions','results','schedule','match','standings','manager','player','club','transfers','map','rivalries']
class Check(HTMLParser):
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  for k in ('src','href'):
   if k in d:
    p=d[k].split('?')[0]
    if p and not p.startswith(('#','http','/')): assert (root/p).exists(),p
for page in pages:
 text=(root/(page+'.html')).read_text()
 assert 'data-page="'+page+'"' in text
 Check().feed(text)
assert 'Union Jack' not in (root/'app.js').read_text()
print('Validated',len(pages),'routes and local references')
