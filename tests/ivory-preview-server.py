from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import urlopen,Request
from urllib.error import HTTPError
import os,re
os.chdir(Path(__file__).resolve().parent.parent)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  path=self.path.split('?')[0]
  if path.endswith('.php') or path=='/clubhouse/':
   try:
    with urlopen(Request('https://www.italianmastersclub.it'+self.path,headers={'User-Agent':'IMC-preview'}),timeout=30) as r:
     b=r.read()
     if path=='/clubhouse/':
      template=Path('clubhouse/index.php').read_text()
      style=re.search(r'<style>([\s\S]*?)</style>',template)[1]
      html=b.decode();html=re.sub(r'<style>[\s\S]*?</style>',lambda m:'<style>'+style+'</style>',html)
      b=html.replace('</head>','<link rel="stylesheet" href="/site-assets/css/imc-ivory.css"></head>').encode()
     self.send_response(r.status);self.send_header('Content-Type',r.headers.get('Content-Type','application/json'));self.end_headers();self.wfile.write(b)
   except HTTPError as e:self.send_response(e.code);self.end_headers();self.wfile.write(e.read())
  else:super().do_GET()
 def log_message(self,*args):pass
ThreadingHTTPServer(('0.0.0.0',8765),Handler).serve_forever()
