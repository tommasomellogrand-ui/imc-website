"""Deploy only the explicit GW001 manifest, verify FTPS bytes; HTML last.
Rollback: python3 minisite/GW001/deploy.py --rollback cfd84107cb9d6e20cb93d36fef5b6bd4c5c19343
Restores the 11 pre-existing entry/controller files. New unreferenced files may remain.
"""
import argparse, io, json, os, pathlib, ssl, subprocess
from ftplib import FTP_TLS,error_perm

ROOT=pathlib.Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--rollback');args=p.parse_args()
files=json.loads((ROOT/'deploy-files.json').read_text())
payload=[]
for name in files:
    assert '..' not in name and not name.startswith('/')
    if args.rollback:
        if name not in ['live-fixtures.js','index.html','results.html','schedule.html','match.html','club.html','manager.html','player.html','competitions.html','standings.html','archive.html']:continue
        data=subprocess.check_output(['git','show',args.rollback+':minisite/GW001/'+name])
    else:data=(ROOT/name).read_bytes()
    payload.append((name,data))
ctx=ssl.create_default_context();ctx.check_hostname=False
ftp=FTP_TLS(context=ctx);ftp.connect('ftp.italianmastersclub.it',21,timeout=60)
ftp.login(os.environ['ARUBA_FTP_USERNAME'],os.environ['ARUBA_FTP_PASSWORD']);ftp.prot_p();ftp.set_pasv(True)
for name,data in payload:
    ftp.cwd('/')
    for part in ('www.italianmastersclub.it/minisite/GW001/'+str(pathlib.Path(name).parent)).split('/'):
        if part=='.':continue
        try:ftp.cwd(part)
        except error_perm:ftp.mkd(part);ftp.cwd(part)
    basename=pathlib.Path(name).name
    ftp.storbinary('STOR '+basename,io.BytesIO(data))
    check=io.BytesIO();ftp.retrbinary('RETR '+basename,check.write)
    assert check.getvalue()==data,name
    print('FTPS verified GW001:',name,len(data),flush=True)
ftp.quit()
