import hashlib, http.cookiejar, json, pathlib, subprocess, time, urllib.request, urllib.error
root=pathlib.Path(__file__).resolve().parents[1]
private=root/'__imc_private_sm_master';private.mkdir(exist_ok=True)
config=private/'config.php'
if config.exists(): raise RuntimeError('Refusing to overwrite private configuration')
config.write_text("<?php return ['admin_token'=>'ci-disposable-test-credential'];")
link=root/'nexus/admin/access-link.php'
original=link.read_text()
link.write_text("<?php return '"+hashlib.sha256(b'ci-personal-link-token-that-is-longer-than-forty-characters').hexdigest()+"';")
server=subprocess.Popen(['php','-S','127.0.0.1:8765','-t',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def call(body=None,cookie='',csrf=''):
    headers={'Content-Type':'application/json','Cookie':cookie,'X-CSRF-Token':csrf}
    req=urllib.request.Request('http://127.0.0.1:8765/nexus/admin/api.php?action=session',data=json.dumps(body).encode() if body else None,headers=headers)
    try: response=urllib.request.urlopen(req)
    except urllib.error.HTTPError as e: response=e
    return response.status,json.load(response),response.headers
try:
    for _ in range(30):
        try: status,result,headers=call();break
        except urllib.error.URLError:time.sleep(.1)
    assert status==401
    assert call({'action':'login','key':'wrong'})[0]==401
    status,result,headers=call({'action':'login','key':'ci-disposable-test-credential'})
    assert status==200 and result['csrf']
    cookies=headers.get_all('Set-Cookie');cookie=cookies[-1].split(';')[0]
    assert all(flag.lower() in cookies[-1].lower() for flag in ['secure','httponly','samesite=Strict'])
    token=result['csrf']
    assert call(cookie=cookie)[0]==200
    assert call({'action':'close','world':'GW004','id':1},cookie)[0]==403
    assert call({'action':'logout'},cookie,token)[0]==200
    assert call(cookie=cookie)[0]==401
    assert call({'action':'login','access_token':'invalid'})[0]==401
    assert call({'action':'login','access_token':'ci-personal-link-token-that-is-longer-than-forty-characters'})[0]==200
    print('PASS: anonymous access, invalid login, secure session, CSRF and logout')
finally:
    server.terminate();server.wait();config.unlink();link.write_text(original)
