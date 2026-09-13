import json, urllib.request, urllib.error
url = "https://www.italianmastersclub.it/imc-universal-gateway/"
repos = {"IMC Results":"IMC Results", "IMC Schedule":"IMC Schedule", "IMC Match Report":"IMC Match Report", "IMC Transfer":"IMC Transfers", "IMC Player Codex":"IMC Player Codex", "IMC SM Player Stats":"IMC SM Player Stats"}
def request(body):
    req=urllib.request.Request(url,data=json.dumps(body).encode(),headers={"Content-Type":"application/json","Accept":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            return response.status,json.load(response)
    except urllib.error.HTTPError as error:
        return error.code,json.load(error)
for channel in ["IMPORT","CHATGPT"]:
    for repo,suffix in repos.items():
        body=dict(channel=channel,action="read",route_mode="explicit",game_world_id="GW010",repository=repo,target_database="Sql1956795_3",target_table="GW010_"+suffix,limit=1)
        status,data=request(body)
        assert status==200 and data.get("ok") is True, (channel,repo,status,data.get("error"))
        assert data.get("database")=="Sql1956795_3" and data.get("table")=="GW010_"+suffix, (channel,repo,"wrong destination")
        print("PASS",channel,"GW010",repo)
    for gw in ["GW011","GW012","GW013","GW014","GW015","GW016"]:
        body.update(game_world_id=gw,target_table=gw+"_IMC SM Player Stats")
        status,data=request(body)
        assert status==422 and data.get("ok") is False, (channel,gw,status)
        print("PASS",channel,gw,"unassigned or outside range")
    body.update(game_world_id="GW010",target_table="GW010_IMC SM Player Stats",target_database="Sql1956795_2")
    status,data=request(body)
    assert status==422 and data.get("ok") is False, (channel,"wrong database",status)
print("Live read-only routing verification complete.")
