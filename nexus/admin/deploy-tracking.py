"""Patch the currently published HTML, preserving every existing byte otherwise."""
import io,os,ssl,re,json
from pathlib import Path
from ftplib import FTP_TLS,error_perm
root='/www.italianmastersclub.it'
tag=b'<script defer src="/nexus/admin/site-analytics.js?v=20261027"></script>'
skip={'admin','core','api','assets','images','img','fonts','vendor','node_modules','.git','backup','backups','archive','archives','data','tests','preview'}
ctx=ssl.create_default_context();ctx.check_hostname=False
f=FTP_TLS(context=ctx);f.connect('ftp.italianmastersclub.it',21,timeout=60);f.login(os.environ['ARUBA_FTP_USERNAME'],os.environ['ARUBA_FTP_PASSWORD']);f.prot_p()
def read(path):
 out=io.BytesIO();f.retrbinary('RETR '+root+'/'+path,out.write);return out.getvalue()
def put(path,data):
 f.storbinary('STOR '+root+'/'+path,io.BytesIO(data));assert read(path)==data
put('nexus/admin/site-analytics.js',Path('nexus/admin/site-analytics.js').read_bytes())
changed=[];already=[]
def patch(path):
 old=read(path)
 if b'/nexus/admin/site-analytics.js' in old or b'G-9HP6T5ZMLE' in old:already.append(path);return
 m=re.search(br'</head\s*>',old,re.I)
 if not m:return
 new=old[:m.start()]+tag+b'\n'+old[m.start():]
 assert read(path)==old,'Concurrent change: '+path
 put(path,new);changed.append(path)
def walk(path,depth=0):
 if depth>12:raise RuntimeError('Unexpected directory depth')
 for name,info in list(f.mlsd(root+'/'+path)):
  if name.startswith('.') or name.startswith('__'):continue
  child=path+'/'+name
  if info.get('type')=='dir' and name.lower() not in skip:walk(child,depth+1)
  elif info.get('type')=='file' and name.endswith('.html') and not any(s in name.lower() for s in ['preview','backup','test']):patch(child)
patch('index.html')
for name,info in list(f.mlsd(root)):
 if info.get('type')=='dir' and (name in ['nexus','minisite','sensible-soccer-academy'] or re.fullmatch(r'gameworld\d+|gw\d+-[a-z0-9-]+',name)):walk(name)
f.quit();Path('analytics-coverage.json').write_text(json.dumps({'patched':changed,'already_tracked':already},indent=2));print('Patched',len(changed),'Existing',len(already))
