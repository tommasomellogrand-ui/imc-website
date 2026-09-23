import io, os, ssl
from ftplib import FTP_TLS, error_perm
from pathlib import Path
ctx=ssl.create_default_context()
ctx.check_hostname=False
ftp=FTP_TLS(context=ctx)
ftp.connect('ftp.italianmastersclub.it',21,timeout=60)
ftp.login(os.environ['ARUBA_FTP_USERNAME'],os.environ['ARUBA_FTP_PASSWORD'])
ftp.prot_p()
ftp.set_pasv(True)
# Only the public Nexus entry point and its dependencies are published.
files=['nexus/match.html','nexus/public/match.css','nexus/public/match.js','nexus/public/trophies.php','nexus/public/honours-GW008-S1.json','nexus/public/hub.php','nexus/public/hub-logic.js','nexus/public/core.php','nexus/public/data.php','nexus/public/site.css','nexus/public/site.js','nexus/assets/imc-logo.png','nexus/.htaccess','nexus/index.html']
files += ['nexus/public/news.js','nexus/public/news.css','nexus/clubhouse.html','nexus/public/clubhouse.css','nexus/public/clubhouse.js']
for name in files:
    p=Path(name)
    ftp.cwd('/')
    for part in ('/www.italianmastersclub.it/'+str(p.parent)).split('/'):
        if not part: continue
        try: ftp.cwd(part)
        except error_perm: ftp.mkd(part); ftp.cwd(part)
    raw=p.read_bytes()
    ftp.storbinary('STOR '+p.name,io.BytesIO(raw))
    check=io.BytesIO();ftp.retrbinary('RETR '+p.name,check.write)
    assert check.getvalue()==raw, 'Upload verification failed: '+name
    print('VERIFIED',name,len(raw))
ftp.quit()




