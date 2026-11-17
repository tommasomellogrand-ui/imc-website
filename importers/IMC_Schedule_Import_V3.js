/* IMC | SCHEDULE IMPORT V3.0
 * CORE → mondo → tipo → competizione singola → stagione precaricata.
 * Da eseguire nella pagina Soccer Manager della competizione da importare.
 * Importa solo la selezione, dalla pagina aperta in avanti. Nessun campo sm_country.
 */
(function () {
    'use strict';
    var VERSION = 'IMC-SCHEDULE-V3.0';
    var GATEWAY = 'https://www.italianmastersclub.it/imc-universal-gateway/';
    var old = document.getElementById('__imc_schedule_v3');
    if (old) return;
    var S = {world:null, catalog:[], seasons:[], destination:null, competition:null,
        season:null, running:false, stopped:false, pages:0, read:0, saved:0, skipped:0,
        existing:new Map(), selectedKey:null, loggedManager:null};
    var MONTHS = {gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,luglio:7,agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12};
    var GROUPS = ['DOMESTIC','INTERNATIONAL','IMC','NATIONS'];
    function clean(v) { return String(v == null ? '' : v).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim(); }
    function esc(v) { return clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function text(el) { return clean(el && el.textContent); }
    function attr(el,key) { return el ? el.getAttribute(key) : null; }
    function q(sel,root) { return (root || document).querySelector(sel); }
    function qa(sel,root) { return Array.from((root || document).querySelectorAll(sel)); }
    function screen() { return q('#currentScreenA') || document; }
    function content() { return q('#fixturesContainer #competitionFixturesContent',screen()); }
    function sleep(ms) { return new Promise(function(resolve){setTimeout(resolve,ms);}); }
    function checkStop() { if(S.stopped) throw new Error('Importazione fermata'); }
    function shown(el) {
        if (!el || el.closest('#workingCopy')) return false;
        for(var e=el;e && e.nodeType===1;e=e.parentElement) {
            var style=getComputedStyle(e);
            if(e.hidden || style.display==='none' || style.visibility==='hidden') return false;
        }
        return true;
    }
    async function wait(test,timeout) {
        var start=Date.now();
        while(Date.now()-start<(timeout || 18000)) { checkStop(); var out=test(); if(out)return out; await sleep(150); }
        throw new Error('La pagina Schedule non risponde: importazione interrotta');
    }
    function positive(v) { var n=Number(v); return Number.isSafeInteger(n) && n>0 ? n : null; }
    function action(v) {
        var a=clean(v).toLowerCase().replace(/[^a-z0-9]/g,'');
        return ({friendlies:'friendly',playoffs:'playoff',smfasupercup:'supercup',worldcupqualifying:'interqualifier'})[a] || a || null;
    }
    function sourceAction() {
        for(var pair of [['interWorldQualiTab','interqualifier'],['interWorldFinalTab','worldcup']]) {
            var tab=q('#'+pair[0],screen());
            if(tab && /(?:topmenu|toptabs)-active/.test(tab.className))return pair[1];
        }
        var links=qa('#goalsTab[action], #avgRatingTab[action], #FixturesnextWeek_click a[action], #FixturesprevWeek_click a[action]',screen());
        var active=links.find(shown) || links.find(function(el){return !el.closest('#workingCopy');});
        if(active)return action(attr(active,'action'));
        var friendly=q('#leagueResultsContainer .pager a[action="friendly"], #leagueResultsContainer .pager a[action="friendlies"]',screen());
        if(friendly)return 'friendly';
        if(/^(amichevoli|friendly)/i.test(heading()))return 'friendly';
        return null;
    }
    function heading() { return text(q('.scheduleScreen-Heading',content() || screen())); }
    function dateFrom(t) {
        var m=clean(t).toLowerCase().match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/);
        if(!m)return null;
        var d=Number(m[1]),mo=MONTHS[m[2]],y=Number(m[3]),check=new Date(Date.UTC(y,mo-1,d));
        if(check.getUTCFullYear()!==y || check.getUTCMonth()!==mo-1 || check.getUTCDate()!==d)return null;
        return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    }
    function round() {
        var h=heading(),m=h.match(/(?:\b(?:lun|mar|mer|gio|ven|sab|dom)\s+)?\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}/i);
        if(m)h=h.slice(0,m.index)+h.slice(m.index+m[0].length);
        return clean(h).replace(/^[\s:·–—-]+|[\s:·–—-]+$/g,'') || null;
    }
    function buttons() {
        return content() ? qa('a[id="matchResult"][onclick*="MATCHREPORT_downloadNextFixtureData"]',content()).filter(function(el){return !el.closest('#workingCopy, #fixturesHelper');}) : [];
    }
    function fixtureId(el) { var m=clean(attr(el,'onclick')).match(/MATCHREPORT_downloadNextFixtureData\s*\(\s*['"]?(\d+)/i); return m ? positive(m[1]) : null; }
    function pageKey() { return [heading(),sourceAction(),buttons().map(fixtureId).join(',')].join('|'); }
    function fixtureGroup(button) {
        var container=button.closest('[id$="_fixtures"]');
        if(!container || !content().contains(container))return null;
        var header=qa('[id="groupHeader"]',content()).find(function(h){
            var m=clean(attr(h,'onclick')).match(/toggleVisibility\s*\(\s*['"]([^'"]+)['"]/);
            return m && m[1]===container.id;
        });
        return text(header) || null;
    }
    function teamId(el) { var m=clean(attr(el,'onclick')).match(/(?:MENU_clubOverviewDraw|MENU_association_draw)\s*\(\s*['"]?(\d+)/i);return m ? positive(m[1]) : null; }
    function managerId(el) {
        var direct=positive(attr(el,'data-cid'));if(direct)return direct;
        var m=clean(attr(el,'onclick')).match(/PROFILE_viewFriendsProfileNew\s*\(\s*['"]?(\d+)/i);
        return m ? positive(m[1]) : null;
    }
    function baseKey(c) {
        var k=clean(c.key).replace(/^(IMC-\d{3})\|/,function(_,w){return w.replace('-','')+'|';});
        if(!k.startsWith(S.world.id+'|'))throw new Error('Chiave CORE incompatibile con il mondo selezionato');
        return k.replace(/^(IMC\d{3})\|S\d+\|/,'$1|');
    }
    function competitionKey(c,season) {
        var key=baseKey(c),n=positive(season);
        if(!n)throw new Error('IMC Season non valida');
        return S.world.id+'|S'+String(n).padStart(2,'0')+key.slice(S.world.id.length);
    }
    function selectedSeason() {
        var date=dateFrom(heading()) || new Date().toISOString().slice(0,10);
        var candidates=S.seasons.filter(function(s){return s.imc_season_start_date<=date;});
        var known=S.worldcupEditions || [];
        if(S.competition && S.competition.sm_action==='worldcup') {
            var open=known.filter(function(e){return !e.final_date && e.edition_start<=date;}).sort(function(a,b){return b.edition_start.localeCompare(a.edition_start);});
            if(open.length && S.seasons.some(function(s){return Number(s.imc_season)===Number(open[0].imc_season);}))return Number(open[0].imc_season);
        }
        return Number((candidates[candidates.length-1] || S.seasons[0] || {}).imc_season) || null;
    }
    function guardSource() {
        var found=sourceAction(),wanted=action(S.competition.sm_action);
        if(!found)throw new Error('Competizione della pagina SM non riconosciuta');
        if(S.competition.group!=='IMC' && found!==wanted && !(wanted==='worldcup' && found==='interqualifier') && !(wanted==='playoff' && found==='league' && /play[\s-]*off/i.test(round() || ''))) {
            throw new Error('Pagina SM: '+found+'. Hai scelto '+S.competition.name+'. Apri il calendario corretto e rilancia.');
        }
        if(wanted==='league' && /play[\s-]*off/i.test(round() || ''))throw new Error('Raggiunti i playoff: seleziona la competizione Playoff dal CORE.');
        if(wanted==='league' || wanted==='playoff') {
            var sel=q('#div-selector select',screen());
            var opt=sel && sel.options[sel.selectedIndex];
            var m=text(opt).match(/(?:divisione?|division)\s*0*(\d+)/i);
            var link=qa('[data-division]',screen()).find(function(e){return shown(e) && positive(attr(e,'data-division'));});
            var actual=m ? positive(m[1]) : positive(attr(link,'data-division'));
            if(!actual)actual=positive(sel && sel.value);
            if(!actual || actual!==positive(S.competition.sm_division))throw new Error('Apri su SM la divisione della competizione selezionata: '+S.competition.name);
        }
        return found;
    }
    async function fingerprint(row) {
        if(!window.crypto || !window.crypto.subtle)throw new Error('SHA-256 non disponibile: apri Soccer Manager in HTTPS');
        var keys=Object.keys(row).filter(function(k){return k!=='fingerprint';}).sort();
        var digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(keys.map(function(k){return [k,row[k]];}))));
        return Array.from(new Uint8Array(digest),function(b){return b.toString(16).padStart(2,'0');}).join('');
    }
    async function readRows() {
        guardSource();var date=dateFrom(heading()),turn=round(),out=[],seen=new Set();
        var fixtureButtons=buttons();
        if(fixtureButtons.length && !date)throw new Error('Data Schedule mancante: nessuna partita inviata');
        for(var b of fixtureButtons) {
            checkStop();var tr=b.closest('tr'),h=q('[id="homeTeam"]',tr),a=q('[id="awayTeam"]',tr),id=fixtureId(b),group=fixtureGroup(b);
            if(!tr || !id || !text(h) || !text(a))throw new Error('Fixture incompleta: nessuna riga della pagina inviata');
            if(seen.has(id))continue;seen.add(id);
            var time=text(b).match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
            var stage=group ? 'Group Stage' : /quarti|ottavi|semifinal|final|knockout|eliminaz/i.test(turn || '') ? 'Knockout Stage' : null;
            if(S.competition.sm_action==='interqualifier')stage='Qualificazioni';
            var row={game_world_id:S.world.id,imc_season:S.season,sm_fixture_id:id,competition_key:S.selectedKey,
                sm_action:action(S.competition.sm_action),sm_division:clean(S.competition.sm_division) || null,
                competition_group:S.competition.group,competition_group_name:group,competition_stage:stage,competition_round:turn,
                match_date:date,match_time:time ? String(Number(time[1])).padStart(2,'0')+':'+time[2] : null,
                home_sm_team_id:teamId(h),home_name:text(h) || null,away_sm_team_id:teamId(a),away_name:text(a) || null,
                home_sm_manager_id:managerId(q('[id="homeManagerImage"]',tr)),away_sm_manager_id:managerId(q('[id="awayManagerImage"]',tr)),
                logged_manager_id:S.loggedManager,fingerprint:null};
            row.fingerprint=await fingerprint(row);out.push(row);
        }
        return out;
    }
    async function gateway(payload) {
        var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},60000),response;
        try {
            response=await fetch(GATEWAY,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','X-IMC-Channel':'IMPORT'},body:JSON.stringify(Object.assign({},payload,{channel:'IMPORT'})),signal:controller.signal});
            var raw=await response.text(),json;try{json=JSON.parse(raw);}catch(_){throw new Error('Risposta gateway non valida: '+raw.slice(0,120));}
            if(!response.ok || json.ok===false)throw new Error(clean(json.detail || json.sql_error || json.error || json.message || 'Errore gateway'));
            return json;
        } catch(e) {if(e.name==='AbortError')throw new Error('Gateway non risponde. Verifica il salvataggio prima di riprovare.');throw e;}
        finally{clearTimeout(timer);}
    }
    function rowsOf(r) {return Array.isArray(r.rows) ? r.rows : r.result && Array.isArray(r.result.rows) ? r.result.rows : [];}
    function destination(extra) {return Object.assign({game_world_id:S.world.id,repository:'IMC Schedule',target_database:S.destination.database,target_table:S.destination.table,route_mode:'explicit'},extra);}
    async function loadExisting() {
        var offset=0;
        for(var page=0;page<1000;page++) {
            checkStop();var r=await gateway(destination({action:'read',limit:10000,offset:offset}));
            for(var row of rowsOf(r)) {
                var id=positive(row.sm_fixture_id);if(!id)continue;
                if(!S.existing.has(String(id)))S.existing.set(String(id),[]);
                S.existing.get(String(id)).push(row);
            }
            if(!r.has_more)return;
            var next=Number(r.next_offset);if(!Number.isSafeInteger(next) || next<=offset)throw new Error('Paginazione gateway non valida');offset=next;
        }
        throw new Error('Limite di lettura Schedule raggiunto');
    }
    async function store(rows) {
        var fresh=[];
        for(var row of rows) {
            var found=S.existing.get(String(row.sm_fixture_id));
            if(found) {
                var same=found.some(function(old){return clean(old.competition_key).replace(/\|S\d+\|/,'|')===baseKey(S.competition) && Number(old.imc_season)===S.season;});
                if(!same)throw new Error('Fixture '+row.sm_fixture_id+' già presente con un’altra competizione o stagione. Nessuna sovrascrittura eseguita.');
                S.skipped++;continue;
            }
            fresh.push(row);
        }
        for(var i=0;i<fresh.length;i+=100) {
            checkStop();var batch=fresh.slice(i,i+100),r=await gateway(destination({action:'insert_many',atomic:true,rows:batch}));
            var n=[r.written_rows,r.stored,r.inserted,r.affected_rows].find(function(v){return v!==null && v!==undefined;});
            if(Number(n)!==batch.length)throw new Error('Salvataggio non confermato integralmente: controlla le Schedule prima di riprovare');
            // Verify persisted identity, including effects of database triggers.
            var check=await gateway(destination({action:'read',where:{match_date:batch[0].match_date},limit:10000}));
            for(var saved of batch) {
                if(!rowsOf(check).some(function(x){return x.competition_key===saved.competition_key && Number(x.imc_season)===saved.imc_season && x.sm_action===saved.sm_action && (x.competition_group_name || null)===saved.competition_group_name;}))throw new Error('Fixture '+saved.sm_fixture_id+': identità salvata diversa dalla selezione. Importazione fermata.');
                S.existing.set(String(saved.sm_fixture_id),[saved]);S.saved++;
            }
            update();
        }
    }
    async function click(el) {
        if(!el)throw new Error('Controllo Schedule assente');
        el.click();await sleep(250);
    }
    async function openFixtures() {
        var tab=q('#fixturesTableTab',screen());
        if(tab && (!content() || !shown(q('#fixturesContainer',screen()))))await click(tab);
        await wait(function(){return content() && shown(q('#fixturesContainer',screen())) && (buttons().length || noFixtures());});
    }
    function nextControl() {
        var p=q('#FixturesnextWeek_click',screen());
        if(!shown(p))return null;
        return p.matches('a') ? p : q('a',p) || p;
    }
    async function nextPage(locked) {
        var next=nextControl();if(!next)return false;
        var before=pageKey();await click(next);
        await wait(function(){return pageKey()!==before && content();},22000);
        await sleep(650);
        if(sourceAction()!==locked)return false;
        return true;
    }
    function noFixtures() {
        var el=q('#competitionScreenTrans-no-fixtures',q('#fixturesContainer',screen()) || screen());
        return shown(el) || /non ci sono incontri disponibili/i.test(text(content()));
    }
    function update() {
        var el=q('#__imc_v3_stats');if(el)el.textContent=S.pages+' pagine · '+S.read+' lette · '+S.saved+' salvate · '+S.skipped+' già presenti';
        var current=q('#__imc_v3_current');if(current)current.textContent=heading() || 'Calendario';
    }
    function log(message) {var el=q('#__imc_v3_log');if(el){var line=document.createElement('div');line.textContent=message;el.appendChild(line);el.scrollTop=el.scrollHeight;}}
    function badge(message) {q('#__imc_v3_badge').textContent=message;}
    function body(html) {q('#__imc_v3_body').innerHTML=html;}
    function on(id,fn) {q('#'+id).onclick=async function(){try{await fn();}catch(e){fail(e);}};}
    function button(label,id) {return '<button class="imc-v3-button" id="'+id+'">'+esc(label)+'</button>';}
    function fail(e) {S.running=false;badge(S.stopped?'FERMATO':'ERRORE');log(clean(e.message || e));var error=q('#__imc_v3_error');if(error)error.textContent=clean(e.message || e);var close=q('#__imc_v3_close');if(close)close.style.display='block';var stop=q('#__imc_v3_stop');if(stop)stop.disabled=true;}
    async function selectWorld(world) {
        S.world=world;badge('CARICAMENTO');body('<p>Leggo competizioni e stagioni dal CORE…</p><p id="__imc_v3_error"></p>');
        var r=await gateway({action:'list_imc_competitions',game_world_id:world.id,scope:'all',include_seasons:true});
        S.catalog=(r.competitions || []).map(function(c){return Object.assign({},c,{group:clean(c.group).toUpperCase()});});
        S.seasons=(r.seasons || []).filter(function(s){return positive(s.imc_season) && s.imc_season_start_date;}).sort(function(a,b){return a.imc_season_start_date.localeCompare(b.imc_season_start_date);});
        S.destination=r.destination;S.worldcupEditions=r.worldcup_editions || [];
        if(!S.catalog.length || !S.seasons.length || !S.destination)throw new Error('Catalogo, stagioni o destinazione CORE incompleti');
        if(!/^Sql\d+_[23]$/.test(S.destination.database) || S.destination.table!==S.world.id+'_Schedule')throw new Error('Destinazione CORE non valida');
        showTypes();
    }
    function showTypes() {
        badge('TIPO COMPETIZIONE');body('<h3>'+esc(S.world.id+' · '+S.world.name)+'</h3><p>Che tipo di competizione importi?</p><div id="__imc_v3_types" class="imc-v3-grid"></div>'+button('Indietro','__imc_v3_back')+'<p id="__imc_v3_error"></p>');
        GROUPS.forEach(function(group,i){var available=S.catalog.some(function(c){return c.group===group;});q('#__imc_v3_types').insertAdjacentHTML('beforeend',button(group,'__imc_v3_type_'+i));q('#__imc_v3_type_'+i).disabled=!available;on('__imc_v3_type_'+i,function(){showCompetitions(group);});});
        on('__imc_v3_back',boot);
    }
    function showCompetitions(group) {
        badge('COMPETIZIONE');body('<h3>'+esc(group)+'</h3><p>Scegli la competizione da importare.</p><div id="__imc_v3_competitions"></div>'+button('Indietro','__imc_v3_back')+'<p id="__imc_v3_error"></p>');
        S.catalog.filter(function(c){return c.group===group;}).forEach(function(c,i){q('#__imc_v3_competitions').insertAdjacentHTML('beforeend',button(c.name,'__imc_v3_comp_'+i));on('__imc_v3_comp_'+i,async function(){S.competition=c;S.season=selectedSeason();await preview();});});
        on('__imc_v3_back',showTypes);
    }
    async function preview() {
        S.selectedKey=competitionKey(S.competition,S.season);await openFixtures();
        var rows=await readRows();badge('ANTEPRIMA');
        var options=S.seasons.map(function(s){return '<option value="'+Number(s.imc_season)+'"'+(Number(s.imc_season)===S.season?' selected':'')+'>S'+String(s.imc_season).padStart(2,'0')+' · dal '+esc(s.imc_season_start_date)+'</option>';}).join('');
        var example=rows[0];
        body('<h3>'+esc(S.world.id+' · '+S.world.name)+'</h3><p><strong>'+esc(S.competition.name)+'</strong> · '+esc(S.competition.group)+'</p><label>IMC Season dell’edizione<select id="__imc_v3_season">'+options+'</select></label><p style="overflow-wrap:anywhere" id="__imc_v3_key">'+esc(S.selectedKey)+'</p><p>'+rows.length+' partite nella pagina aperta</p>'+(example?'<p>'+esc(example.home_name+' – '+example.away_name)+'<br>'+esc(example.match_date+' · '+(example.match_time || ''))+'<br>'+esc(example.competition_group_name || '')+'</p>':'')+'<p>Importa questa competizione dalla pagina aperta in avanti.</p>'+button('AVVIA IMPORTAZIONE','__imc_v3_start')+button('Indietro','__imc_v3_back')+'<p id="__imc_v3_error"></p>');
        q('#__imc_v3_season').onchange=function(){S.season=Number(this.value);S.selectedKey=competitionKey(S.competition,S.season);q('#__imc_v3_key').textContent=S.selectedKey;};
        on('__imc_v3_start',run);on('__imc_v3_back',function(){showCompetitions(S.competition.group);});
    }
    async function run() {
        if(S.running)return;S.running=true;S.stopped=false;S.pages=0;S.read=0;S.saved=0;S.skipped=0;S.existing=new Map();
        S.selectedKey=competitionKey(S.competition,S.season);badge('IN CORSO');
        body('<h3>'+esc(S.competition.name)+'</h3><p style="overflow-wrap:anywhere">'+esc(S.selectedKey)+'</p><p id="__imc_v3_stats"></p><p id="__imc_v3_current"></p><details><summary>LOG LIVE</summary><div id="__imc_v3_log" style="max-height:200px;overflow:auto;font-size:11px"></div></details>'+button('STOP','__imc_v3_stop')+button('CHIUDI','__imc_v3_close'));
        q('#__imc_v3_close').style.display='none';on('__imc_v3_close',function(){q('#__imc_schedule_v3').remove();});
        q('#__imc_v3_stop').onclick=function(){S.stopped=true;badge('ARRESTO…');};update();
        await openFixtures();var locked=guardSource(),visited=new Set();await loadExisting();
        for(var page=0;page<500;page++) {
            checkStop();var key=pageKey();if(visited.has(key))throw new Error('Pagina Schedule ripetuta: scansione fermata');visited.add(key);
            if(sourceAction()!==locked)break;guardSource();
            var rows=await readRows();if(!rows.length && !noFixtures())throw new Error('Pagina senza fixture riconoscibili');
            S.pages++;S.read+=rows.length;await store(rows);update();log(heading()+' · '+rows.length+' fixture');
            if(!await nextPage(locked)){S.running=false;badge('COMPLETATO');q('#__imc_v3_stop').style.display='none';q('#__imc_v3_close').style.display='block';return;}
        }
        if(S.running)throw new Error('Limite pagine raggiunto: verifica il punto di arresto');
    }
    async function boot() {
        badge('CARICAMENTO MONDI');body('<p>Leggo i mondi dal CORE…</p><p id="__imc_v3_error"></p>');
        var r=await gateway({action:'list_imc_worlds',format:'canonical'}),worlds=r.worlds || [];
        if(!worlds.length)throw new Error('Nessun mondo disponibile nel CORE');
        badge('MONDO IMC');body('<h3>SELEZIONA MONDO IMC</h3><div class="imc-v3-grid" id="__imc_v3_worlds"></div><p id="__imc_v3_error"></p>');
        worlds.forEach(function(w,i){if(!/^IMC\d{3}$/.test(w.id))return;q('#__imc_v3_worlds').insertAdjacentHTML('beforeend',button(w.id+' · '+w.name,'__imc_v3_world_'+i));on('__imc_v3_world_'+i,function(){return selectWorld(w);});});
    }
    var overlay=document.createElement('div');overlay.id='__imc_schedule_v3';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(18,22,34,.30);backdrop-filter:blur(2px);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171b2a;padding:6px;box-sizing:border-box';
    overlay.innerHTML='<style>#__imc_schedule_v3 *{box-sizing:border-box}#__imc_schedule_v3 .imc-v3-button{display:block;width:100%;min-height:48px;padding:12px;margin:7px 0;border:1px solid #dedced;border-radius:13px;background:#fff;color:#473c83;font:700 13px Inter,-apple-system,sans-serif;cursor:pointer}#__imc_schedule_v3 .imc-v3-button:disabled{opacity:.4;cursor:default}#__imc_schedule_v3 .imc-v3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#__imc_schedule_v3 select{display:block;width:100%;padding:12px;margin:8px 0;border:1px solid #dedced;border-radius:12px;background:white}#__imc_v3_error{color:#b7463e;overflow-wrap:anywhere}</style><div style="width:min(100%,420px);height:100%;margin:auto;background:#f8f8fd;border:1px solid #e3e4ec;border-radius:22px;box-shadow:0 14px 44px rgba(20,24,40,.32);overflow:hidden;display:flex;flex-direction:column"><div style="background:white;padding:15px;border-bottom:1px solid #e5e6ee"><div style="font-size:10px;letter-spacing:2px;font-weight:900;color:#7153d8">IMC · SCHEDULE IMPORT</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><strong style="font-size:20px">SCHEDULE V3.0</strong><span id="__imc_v3_badge" style="font-size:9px;background:#eee8ff;color:#6548c8;padding:8px;border-radius:99px">PRONTO</span><button id="__imc_v3_dismiss" aria-label="Chiudi" style="border:0;background:none;font-size:20px">×</button></div></div><div id="__imc_v3_body" style="padding:14px;overflow:auto;flex:1"></div></div>';
    document.body.appendChild(overlay);
    q('#__imc_v3_dismiss').onclick=function(){if(S.running){S.stopped=true;badge('ARRESTO…');}else overlay.remove();};
    S.loggedManager=positive(q('#scid') && (q('#scid').value || text(q('#scid')))) || positive(window.CUSTOMERID);
    boot().catch(fail);
    // Release iPhone Shortcuts; the overlay reports the actual import outcome.
    try {if(typeof completion==='function')completion(JSON.stringify({ok:true,started:true,version:VERSION}));}catch(_){}
})();
