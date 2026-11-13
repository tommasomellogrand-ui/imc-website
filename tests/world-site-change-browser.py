"""Exercise the deployed world client without writing any sports data."""
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.page_load_strategy = "eager"
instrument = """
window.testRevisionsRequests = 0;
const nativeFetch = window.fetch;
window.fetch = function(input,...rest) {
    if (String(typeof input==='string'?input:input.url).includes('/world-engine/revisions.php')) window.testRevisionsRequests++;
    return nativeFetch.call(this,input,...rest);
};
const Native = window.WebSocket;
window.WebSocket = class extends Native {
    constructor(...args) {
        super(...args);
        if (!String(args[0]).includes('/realtime/v1/')) return;
        window.testSocket = this;
        this.addEventListener('message', ev => {
            const msg=JSON.parse(ev.data);
            if (msg.event==='system' && msg.payload.status==='ok') window.testJoined=true;
        });
    }
};
"""
inject = """
const [scope, revision] = arguments;
window.testSocket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({
    event:'postgres_changes',payload:{data:{record:{scope, revision}}}
})}));
"""
with webdriver.Chrome(options=options) as browser:
    browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": instrument})
    wait = WebDriverWait(browser, 40)
    for path, scope in [("roadtohistory","IMC001"),("halloffamers","IMC002"),("kickoff","IMC003"),("sensiblesocceracademy","IMC004"),("subbuteosuperleague","IMC005"),("worldleague","IMC006"),("masterleagueworld","IMC007"),("scudetto","IMC008")]:
        browser.get("https://www.italianmastersclub.it/" + path + "/transfers/?q=IMC-check")
        wait.until(lambda d: d.execute_script("return window.testJoined === true"))
        assert browser.execute_script("return window.testRevisionsRequests") == 0, path
        print(path, "joined live change stream without polling tables", flush=True)
        start = browser.execute_script("return performance.timeOrigin")
        revision = 8000000000
        browser.execute_script(inject, "IMC010", revision)
        browser.execute_async_script("setTimeout(arguments[0],800)")
        assert browser.execute_script("return performance.timeOrigin") == start, path
        browser.execute_script(inject, scope, revision)
        wait.until(lambda d: d.execute_script("return performance.timeOrigin") != start)
        assert "q=IMC-check" in browser.current_url, path
        print(path, "refreshed only for the selected world", flush=True)
