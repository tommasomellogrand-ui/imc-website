/* Only committed revisions trigger a refresh. Socket heartbeats carry no site data. */
(() => {
    'use strict';
    if (window.imcSiteChanges) return;
    const worlds = {roadtohistory:'IMC001', halloffamers:'IMC002', kickoff:'IMC003',
        sensiblesocceracademy:'IMC004', subbuteosuperleague:'IMC005', worldleague:'IMC006',
        masterleagueworld:'IMC007', scudetto:'IMC008'};
    const section = location.pathname.split('/')[1];
    const world = worlds[section];
    if (!world && !['','index.html','clubhouse','imc_campus','nexus'].includes(section)) return;
    if (/(?:^|\/)(?:admin|one|draft|pick|lottery)(?:\/|$)/i.test(location.pathname)) return;
    window.imcSiteChanges = true;

    if (world) {
        const route = location.pathname.split('/')[2] || 'home';
        const dependencies = {
            home:['Results','Schedule','Trophy_Room'],
            competitions:['Results','Schedule','Match_Reports','Player_Codex','Trophy_Room'],
            matchday:['Results','Schedule','Match_Reports','Player_Codex'],
            transfers:['Transfers','Player_Codex'],
            players:['Player_Codex','Transfers','Match_Reports','Results'],
            playercodex:['Player_Codex','Transfers','Match_Reports','Results'],
            trophyroom:['Trophy_Room']
        };
        const repositories=dependencies[route];
        const relevant = key => key.startsWith('core:') || !repositories || repositories.includes(key.slice(6));
        let baseline, timer, inFlight=false, stopped=false;
        async function check() {
            if(stopped || inFlight)return;
            inFlight=true;
            try{
                const response=await fetch('/site-assets/world-engine/revisions.php?world='+encodeURIComponent(section),{cache:'no-store'});
                if(!response.ok)throw Error('revisions');
                const data=await response.json();
                if(!data.ok || data.world!==section)throw Error('world');
                const current=Object.fromEntries(Object.entries(data.revisions).filter(([key])=>relevant(key)));
                if(baseline){
                    const keys=new Set([...Object.keys(baseline),...Object.keys(current)]);
                    if([...keys].some(key=>(baseline[key]||'0')!==(current[key]||'0'))){
                        stopped=true;
                        location.reload();
                        return;
                    }
                }
                baseline=current;
            }catch{
                // A failed revision check keeps the current page usable and retries.
            }finally{
                inFlight=false;
                clearTimeout(timer);
                if(!stopped)timer=setTimeout(check,document.hidden?60000:10000);
            }
        }
        document.addEventListener('visibilitychange',()=>{if(!document.hidden){clearTimeout(timer);check();}});
        addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer)});
        addEventListener('pageshow',event=>{if(event.persisted){stopped=false;check();}});
        check();
        return;
    }
    const host = 'toanuzojdkfjgucztpze.supabase.co';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYW51em9qZGtmamd1Y3p0cHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MzQyMDYsImV4cCI6MjEwMTIxMDIwNn0.N0FNhtH1nAqnr5_DSPuBc_PkSFfnaWziMomhouYrTyU';
    const topic = 'realtime:imc-site';
    const revisions = new Map();
    let socket, heartbeat, reconnect, refresh, joinTimeout, heartbeatRef;
    let ref = 0, failures = 0, paused = false;
    const interested = scope => !world || scope === 'core' || scope === world;
    const storageKey = scope => 'imc-applied-revision:'+scope;
    function applied(scope) {
        try { return Number(sessionStorage.getItem(storageKey(scope)) || 0); }
        catch { return 0; }
    }
    function receive(row, changedDuringLoad) {
        if (!row || !interested(row.scope)) return;
        const revision = Number(row.revision);
        const previous = revisions.get(row.scope);
        if (!Number.isSafeInteger(revision) || revision <= (previous || 0)) return;
        revisions.set(row.scope, revision);
        if ((previous === undefined && !changedDuringLoad) || revision <= applied(row.scope)) return;
        if (!refresh) refresh = setTimeout(() => {
            for (const [scope, value] of revisions) {
                try { sessionStorage.setItem(storageKey(scope), String(value)); } catch {}
            }
            location.reload();
        }, 500);
    }
    async function catchUp(ws) {
        const filter = world ? '&scope=in.(core,'+world+')' : '';
        const start = performance.now();
        const response = await fetch('https://'+host+'/rest/v1/imc_site_revisions?select=scope,revision,updated_at'+filter,
            {headers:{apikey:apiKey},cache:'no-store'});
        if (!response.ok) throw Error('Revisioni non disponibili');
        const rows = await response.json();
        if (socket !== ws || ws.readyState !== WebSocket.OPEN) return;
        const serverNow = Date.parse(response.headers.get('Date') || '') || Date.now();
        for (const row of rows) receive(row, Date.parse(row.updated_at) >= serverNow-start);
    }
    function connect() {
        if (paused) return;
        const ws = new WebSocket('wss://'+host+'/realtime/v1/websocket?vsn=1.0.0&apikey='+apiKey);
        socket = ws;
        const send = (channel,event,payload) => {
            const id = String(++ref);
            ws.send(JSON.stringify({topic:channel,event,payload,ref:id}));
            return id;
        };
        let joinRef;
        joinTimeout = setTimeout(() => ws.close(), 15000);
        ws.onopen = () => {
            joinRef = send(topic,'phx_join',{config:{broadcast:{ack:false,self:false},presence:{enabled:false},
                postgres_changes:[{event:'*',schema:'public',table:'imc_site_revisions'}]},access_token:apiKey});
            heartbeat = setInterval(() => {
                if (heartbeatRef) { ws.close(); return; }
                heartbeatRef = send('phoenix','heartbeat',{});
            }, 25000);
        };
        ws.onmessage = event => {
            let msg;
            try { msg = JSON.parse(event.data); } catch { return; }
            if (msg.event === 'phx_reply' && msg.ref === heartbeatRef) heartbeatRef = null;
            if (msg.event === 'phx_reply' && msg.ref === joinRef) {
                if (msg.payload.status !== 'ok') { ws.close(); return; }
                clearTimeout(joinTimeout);
                failures = 0;
                catchUp(ws).catch(() => ws.close());
            } else if (msg.event === 'postgres_changes') receive(msg.payload.data.record,true);
            else if (msg.event === 'phx_error' || msg.event === 'phx_close') ws.close();
        };
        ws.onclose = () => {
            if (socket !== ws) return;
            clearTimeout(joinTimeout); clearInterval(heartbeat); heartbeatRef = null;
            if (!paused) reconnect = setTimeout(connect,Math.min(30000,1000*2**Math.min(failures++,5))+Math.random()*300);
        };
    }
    addEventListener('pagehide', () => {
        paused=true; clearTimeout(reconnect); clearTimeout(joinTimeout); clearInterval(heartbeat);
        if (socket) socket.close();
    });
    addEventListener('pageshow', event => { if (event.persisted) { paused=false; connect(); } });
    connect();
})();
