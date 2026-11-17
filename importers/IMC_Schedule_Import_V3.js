/* IMC | SCHEDULE IMPORT V3.4
 * CORE → mondo → tipo → competizione singola → stagione precaricata.
 * Da eseguire nella pagina Soccer Manager della competizione da importare.
 * Importa solo la selezione, dalla pagina aperta in avanti. Nessun campo sm_country.
 */
(function () {
    'use strict';
    var VERSION = 'IMC-SCHEDULE-V3.4';
    var GATEWAY = 'https://www.italianmastersclub.it/imc-universal-gateway/';
    var old = document.getElementById('__imc_schedule_v3');
    if (old) return;
    var S = {world:null, catalog:[], seasons:[], destination:null, competition:null,
        season:null, running:false, stopped:false, pages:0, read:0, saved:0, skipped:0,
        existing:new Map(), selectedKey:null, loggedManager:null, errors:0, localSkip:0, sent:0, phase:null, finalMessage:null,
        lastBatch:{sent:0,written:0,skipped:0}, leaguePlan:[], leagueIndex:0};
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
    async function wait(test,timeout,message) {
        var start=Date.now();
        while(Date.now()-start<(timeout || 18000)) { checkStop(); var out=test(); if(out)return out; await sleep(150); }
        throw new Error(message || 'La pagina Schedule non risponde: importazione interrotta');
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
    function divisionNumber(value) {
        var m=clean(value).match(/^(?:division(?:e)?\s*)?0*(\d+)$/i);return m ? positive(m[1]) : null;
    }
    function divisionSelect() {
        var preferred=q('#div-selector select',screen());if(preferred)return preferred;
        return qa('select',screen()).find(function(el){return shown(el) && Array.from(el.options).some(function(o){return /^division(?:e)?\s*\d+$/i.test(text(o));});}) || null;
    }
    function currentDivision() {
        var sel=divisionSelect(),opt=sel && sel.options[sel.selectedIndex];
        var selected=divisionNumber(text(opt));if(selected)return selected;
        var link=qa('#goalsTab[data-division], #avgRatingTab[data-division], #FixturesnextWeek_click a[data-division], #FixturesprevWeek_click a[data-division]',screen()).find(function(el){return positive(attr(el,'data-division'));});
        return positive(attr(link,'data-division')) || positive(sel && sel.value);
    }
    function leagueOption(select,competition) {
        return select && Array.from(select.options).find(function(o){return !o.disabled && (divisionNumber(text(o)) || divisionNumber(o.value))===positive(competition.sm_division);});
    }
    function validateLeaguePlan() {
        if(!S.leaguePlan.length)return;
        var seen=new Set(),sel=divisionSelect();
        S.leaguePlan.forEach(function(c){
            var division=positive(c.sm_division);
            if(!division || seen.has(division))throw new Error('Divisioni League mancanti o duplicate nel CORE');seen.add(division);
            if((sel && !leagueOption(sel,c)) || (!sel && (S.leaguePlan.length>1 || currentDivision()!==division)))throw new Error('Divisione '+division+' del CORE non disponibile nel menu League di SM. Apri il calendario League.');
        });
    }
    async function changeLeagueDivision(competition) {
        checkStop();var target=positive(competition.sm_division);
        if(currentDivision()!==target) {
            var select=divisionSelect(),option=leagueOption(select,competition);
            if(!option)throw new Error('Divisione '+target+' non disponibile nel menu League di SM');
            setPhase('Cambio Divisione '+target);log('SWAP · Divisione '+target+' · '+competition.name);
            var before=pageKey(),oldSelect=select,oldScreen=screen(),oldTables=q('#leagueTableContainer',screen());
            var oldTablesHTML=oldTables ? oldTables.innerHTML : null,oldFixtureIds=buttons().map(fixtureId).join(',');
            select.selectedIndex=option.index;select.value=option.value;
            if(typeof select.onchange==='function')select.onchange.call(select,new Event('change',{bubbles:true}));
            else select.dispatchEvent(new Event('change',{bubbles:true}));
            // SM returns to Tables after a division change. Wait for that screen,
            // then open Partite BEFORE waiting for its Schedule content.
            await wait(function(){
                var tables=q('#leagueTableContainer',screen());
                return currentDivision()===target && (divisionSelect()!==oldSelect || screen()!==oldScreen || tables!==oldTables || (tables && tables.innerHTML!==oldTablesHTML) || pageKey()!==before);
            },22000,'Divisione '+target+': schermata League non aggiornata dopo il cambio');
            log('NAV · Divisione '+target+' caricata · apro Partite');
            await openFixtures('Divisione '+target+': tab Partite non aperta');
            // Do not label leftover fixtures from the previous division as the new one.
            await wait(function(){return currentDivision()===target && (buttons().length ? buttons().map(fixtureId).join(',')!==oldFixtureIds : noFixtures());},22000,'Divisione '+target+': nuovo calendario non caricato');
            await sleep(650);
        }
        S.competition=competition;S.selectedKey=competitionKey(competition,S.season);guardSource();update();
        log('LEAGUE · Divisione '+target+' · '+competition.name+' · '+S.selectedKey);
    }
    async function chooseCompetition(competition,allLeague) {
        S.leaguePlan=[];S.leagueIndex=0;
        if(allLeague) {
            var plan=S.catalog.filter(function(c){return c.group==='DOMESTIC' && action(c.sm_action)==='league';}).sort(function(a,b){return Number(a.sm_division)-Number(b.sm_division);});
            var index=plan.findIndex(function(c){return positive(c.sm_division)===currentDivision();});
            S.leaguePlan=index>=0 ? plan.slice(index).concat(plan.slice(0,index)) : plan;
            validateLeaguePlan();competition=S.leaguePlan[0];
        }
        S.competition=competition;S.season=selectedSeason();
        if(allLeague)await changeLeagueDivision(competition);
        await preview();
    }
    function guardSource() {
        var found=sourceAction(),wanted=action(S.competition.sm_action);
        // Single-match cups can expose no action at all. The CORE selection
        // supplies the stored action; a missing page action is not an error.
        if(!wanted)throw new Error('SM action mancante nella competizione CORE selezionata');
        if(found && S.competition.group!=='IMC' && found!==wanted && !(wanted==='worldcup' && found==='interqualifier') && !(wanted==='playoff' && found==='league' && /play[\s-]*off/i.test(round() || ''))) {
            throw new Error('Pagina SM: '+found+'. Hai scelto '+S.competition.name+'. Apri il calendario corretto e rilancia.');
        }
        if(wanted==='league' && /play[\s-]*off/i.test(round() || ''))throw new Error('Raggiunti i playoff: seleziona la competizione Playoff dal CORE.');
        if((wanted==='league' || wanted==='playoff') && currentDivision()!==positive(S.competition.sm_division))throw new Error('Apri su SM la divisione della competizione selezionata: '+S.competition.name);
        return found;
    }
    async function fingerprint(row) {
        if(!window.crypto || !window.crypto.subtle)throw new Error('SHA-256 non disponibile: apri Soccer Manager in HTTPS');
        var keys=Object.keys(row).filter(function(k){return k!=='fingerprint';}).sort();
        var digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(keys.map(function(k){return [k,row[k]];}))));
        return Array.from(new Uint8Array(digest),function(b){return b.toString(16).padStart(2,'0');}).join('');
    }
    async function readRows() {
        setPhase('Lettura fixture');
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
        setPhase('Leggo Schedule esistenti');log('READ · '+S.destination.database+' · '+S.destination.table);
        var offset=0;
        for(var page=0;page<1000;page++) {
            checkStop();var r=await gateway(destination({action:'read',limit:10000,offset:offset}));
            for(var row of rowsOf(r)) {
                var id=positive(row.sm_fixture_id);if(!id)continue;
                if(!S.existing.has(String(id)))S.existing.set(String(id),[]);
                S.existing.get(String(id)).push(row);
            }
            log('READ · '+rowsOf(r).length+' righe · '+S.existing.size+' fixture già presenti');update();
            if(!r.has_more){log('Controllo doppioni pronto · '+S.existing.size+' fixture');return;}
            var next=Number(r.next_offset);if(!Number.isSafeInteger(next) || next<=offset)throw new Error('Paginazione gateway non valida');offset=next;
        }
        throw new Error('Limite di lettura Schedule raggiunto');
    }
    async function store(rows) {
        setPhase('Controllo fixture già presenti');
        var fresh=[],localSkipped=0;
        for(var row of rows) {
            var found=S.existing.get(String(row.sm_fixture_id));
            if(found) {
                var same=found.some(function(old){return clean(old.competition_key).replace(/\|S\d+\|/,'|')===baseKey(S.competition) && Number(old.imc_season)===S.season;});
                if(!same)throw new Error('Fixture '+row.sm_fixture_id+' già presente con un’altra competizione o stagione. Nessuna sovrascrittura eseguita.');
                S.skipped++;S.localSkip++;localSkipped++;log('SKIP · fixture '+row.sm_fixture_id+' già importata');continue;
            }
            fresh.push(row);
        }
        if(!fresh.length){S.lastBatch={sent:0,written:0,skipped:localSkipped};update();return;}
        for(var i=0;i<fresh.length;i+=100) {
            checkStop();var batch=fresh.slice(i,i+100);
            S.lastBatch={sent:batch.length,written:0,skipped:i===0?localSkipped:0};S.sent+=batch.length;
            setPhase('Salvataggio Schedule');log('WRITE · invio '+batch.length+' fixture · '+S.destination.table);
            var r=await gateway(destination({action:'insert_many',atomic:true,rows:batch}));
            var n=[r.written_rows,r.stored,r.inserted,r.affected_rows].find(function(v){return v!==null && v!==undefined;});
            if(Number(n)!==batch.length)throw new Error('Salvataggio non confermato integralmente: controlla le Schedule prima di riprovare');
            // Verify persisted identity, including effects of database triggers.
            setPhase('Verifica salvataggio');
            var check=await gateway(destination({action:'read',where:{match_date:batch[0].match_date},limit:10000}));
            for(var saved of batch) {
                if(!rowsOf(check).some(function(x){return x.competition_key===saved.competition_key && Number(x.imc_season)===saved.imc_season && x.sm_action===saved.sm_action && (x.competition_group_name || null)===saved.competition_group_name;}))throw new Error('Fixture '+saved.sm_fixture_id+': identità salvata diversa dalla selezione. Importazione fermata.');
                S.existing.set(String(saved.sm_fixture_id),[saved]);S.saved++;S.lastBatch.written++;
            }
            log('WRITE · '+S.lastBatch.written+' fixture salvate e verificate · '+S.lastBatch.skipped+' skip');update();
        }
    }
    async function click(el) {
        if(!el)throw new Error('Controllo Schedule assente');
        el.click();await sleep(250);
    }
    async function openFixtures(message) {
        setPhase('Apro calendario');
        var tab=q('#fixturesTableTab',screen());
        if(tab && (!content() || !shown(q('#fixturesContainer',screen())))) {
            if(typeof window.showLeagueTabContents==='function')window.showLeagueTabContents('fixturesContainer','fixturesTableTab');
            else await click(tab);
        }
        await wait(function(){return content() && shown(q('#fixturesContainer',screen())) && (buttons().length || noFixtures());},18000,message);
    }
    function nextControl() {
        var p=q('#FixturesnextWeek_click',screen());
        if(!shown(p))return null;
        return p.matches('a') ? p : q('a',p) || p;
    }
    async function nextPage(locked) {
        var next=nextControl();if(!next)return false;
        setPhase('Avanti');log('NAV · apro la pagina successiva');
        var before=pageKey();await click(next);
        setPhase('Attendo calendario');
        await wait(function(){return pageKey()!==before && content();},22000);
        await sleep(650);
        if(sourceAction()!==locked)return false;
        return true;
    }
    function noFixtures() {
        var el=q('#competitionScreenTrans-no-fixtures',q('#fixturesContainer',screen()) || screen());
        return shown(el) || /non ci sono incontri disponibili/i.test(text(content()));
    }
    function setText(id,value) {var el=q('#'+id);if(el)el.textContent=String(value == null ? '-' : value);}
    function setPhase(value) {S.phase=value;update();}
    function update() {
        var batch=S.lastBatch || {sent:0,written:0,skipped:0};
        setText('__imc_v3_stats',S.pages+' pagine · '+S.read+' lette · '+S.saved+' salvate · '+S.skipped+' già presenti');
        setText('__imc_v3_current',S.finalMessage || heading() || 'Preparazione');
        setText('__imc_v3_current_sub',buttons().length+' fixture · '+(S.competition ? S.competition.sm_action : '-')+(S.competition && S.competition.sm_division ? ' · Divisione '+S.competition.sm_division : ''));
        setText('__imc_v3_phase',S.phase || 'Preparazione');
        setText('__imc_v3_fixtures',S.read);setText('__imc_v3_saved',S.saved);setText('__imc_v3_skip',S.skipped);setText('__imc_v3_errors',S.errors);
        setText('__imc_v3_local_skip',S.localSkip);setText('__imc_v3_pages_meta',S.pages+' pagine');
        setText('__imc_v3_scan',S.leaguePlan.length ? 'Divisione '+(S.leagueIndex+1)+' / '+S.leaguePlan.length : '1 competizione');
        setText('__imc_v3_context_name',S.competition ? S.competition.name : '-');
        setText('__imc_v3_context_meta',S.competition ? S.competition.group+' · IMC Season '+S.season+(S.leaguePlan.length ? ' · Divisione '+S.competition.sm_division : '') : '-');
        setText('__imc_v3_context_key',S.selectedKey);
        setText('__imc_v3_batch_state',batch.sent ? batch.written+' verificate / '+batch.sent+' inviate · '+batch.skipped+' skip' : batch.skipped ? batch.skipped+' già presenti' : 'Nessun invio ancora');
        setText('__imc_v3_dest_main',S.destination ? S.destination.table : '-');
        setText('__imc_v3_dest_written',batch.written);
        setText('__imc_v3_dest_meta',S.destination ? S.destination.database+' · ultimo invio '+batch.sent+' · verificate '+batch.written+' · skip '+batch.skipped : '-');
    }
    function log(message) {
        var el=q('#__imc_v3_log');if(el){var line=document.createElement('div');line.style.marginBottom='5px';line.textContent=new Date().toLocaleTimeString('it-IT')+' · '+message;el.appendChild(line);el.scrollTop=el.scrollHeight;}
    }
    function badge(message) {
        var el=q('#__imc_v3_badge');el.textContent=message;
        var style=message==='COMPLETATO'?['#eaf8ee','#358c50']:message==='ERRORE'?['#fff1dc','#a96700']:message==='FERMATO' || message==='ARRESTO…'?['#fff1ef','#b7463e']:['#eee8ff','#6548c8'];
        el.style.background=style[0];el.style.color=style[1];
    }
    function body(html) {q('#__imc_v3_body').innerHTML=html;}
    function on(id,fn) {q('#'+id).onclick=async function(){try{await fn();}catch(e){fail(e);}};}
    function button(label,id) {return '<button class="imc-v3-button" id="'+id+'">'+esc(label)+'</button>';}
    function statBox(label,id) {
        return '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:14px;padding:9px 3px;text-align:center;min-width:0"><div style="font-size:8px;letter-spacing:.6px;font-weight:900;color:#969bad">'+label+'</div><div id="'+id+'" style="font-size:22px;font-weight:900;margin-top:5px">0</div></div>';
    }
    function renderProgressUI() {
        body('<div style="display:flex;flex-direction:column;gap:8px;width:100%;min-width:0">'+
            '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px">'+
                '<div style="min-width:0;background:linear-gradient(145deg,#fff,#f5f2ff);border:1px solid #e4def8;border-radius:17px;padding:11px 12px">'+
                    '<div style="font-size:8px;letter-spacing:1.2px;font-weight:900;color:#8f88a7">GAME WORLD</div><div style="font-size:22px;font-weight:900;margin-top:5px">'+esc(S.world.id)+'</div><div style="font-size:11px;font-weight:700;color:#777d8f;margin-top:5px;overflow-wrap:anywhere">'+esc(S.world.name)+'</div>'+
                '</div>'+
                '<div style="min-width:0;background:linear-gradient(145deg,#fff,#eef7ff);border:1px solid #dbeaf5;border-radius:17px;padding:11px 12px">'+
                    '<div style="font-size:8px;letter-spacing:1.2px;font-weight:900;color:#8693a0">FASE</div><div id="__imc_v3_phase" aria-live="polite" style="font-size:14px;font-weight:900;margin-top:6px;overflow-wrap:anywhere">Preparazione</div><div id="__imc_v3_batch_state" style="font-size:9px;font-weight:700;color:#697887;margin-top:6px"></div>'+
                '</div>'+
            '</div>'+
            '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:11px 12px;min-width:0">'+
                '<div style="font-size:8px;letter-spacing:1.2px;font-weight:900;color:#969bad">CONTESTO</div><div id="__imc_v3_context_name" style="font-size:16px;font-weight:900;margin-top:5px;overflow-wrap:anywhere">'+esc(S.competition.name)+'</div><div id="__imc_v3_context_meta" style="font-size:10px;font-weight:700;color:#777d8f;margin-top:5px">'+esc(S.competition.group)+' · IMC Season '+esc(S.season)+'</div><div id="__imc_v3_context_key" style="font-size:10px;color:#777d8f;margin-top:5px;overflow-wrap:anywhere">'+esc(S.selectedKey)+'</div>'+
            '</div>'+
            '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px">'+statBox('FIXTURE','__imc_v3_fixtures')+statBox('SALVATE','__imc_v3_saved')+statBox('SKIP','__imc_v3_skip')+statBox('ERRORI','__imc_v3_errors')+'</div>'+
            '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px">'+
                '<div style="background:linear-gradient(145deg,#fffaf7,#fff3ed);border:1px solid #f1ded4;border-radius:15px;padding:10px 12px;min-width:0"><div style="font-size:8px;letter-spacing:1px;font-weight:900;color:#a57966">SKIP LOCALI</div><div id="__imc_v3_local_skip" style="font-size:23px;font-weight:900;color:#8b5c49;margin-top:5px">0</div><div style="font-size:9px;font-weight:700;color:#9b7868;margin-top:4px">fixture già importate</div></div>'+
                '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:15px;padding:10px 12px;min-width:0"><div style="font-size:8px;letter-spacing:1px;font-weight:900;color:#969bad">SCANSIONE</div><div id="__imc_v3_scan" style="font-size:13px;font-weight:900;margin-top:5px">1 competizione</div><div id="__imc_v3_pages_meta" style="font-size:10px;font-weight:700;color:#777d8f;margin-top:5px">0 pagine</div></div>'+
            '</div>'+
            '<div style="background:linear-gradient(145deg,#f8fff9,#eef8f0);border:1px solid #d7eadb;border-radius:17px;padding:11px 12px;min-width:0">'+
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><div style="font-size:8px;letter-spacing:1.2px;font-weight:900;color:#5b8b66">SCHEDULE DESTINATION</div><div id="__imc_v3_dest_main" style="font-size:12px;font-weight:900;color:#2f5137;margin-top:5px;overflow-wrap:anywhere"></div></div><div id="__imc_v3_dest_written" style="font-size:24px;font-weight:900;color:#2f5137">0</div></div><div id="__imc_v3_dest_meta" style="font-size:9px;font-weight:700;color:#58745e;margin-top:6px;overflow-wrap:anywhere"></div>'+
            '</div>'+
            '<div style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:11px 12px;min-width:0"><div style="font-size:8px;letter-spacing:1.2px;font-weight:900;color:#969bad">PAGINA CORRENTE</div><div id="__imc_v3_current" style="font-size:14px;font-weight:900;margin-top:5px;overflow-wrap:anywhere">PREPARAZIONE</div><div id="__imc_v3_current_sub" style="font-size:10px;font-weight:700;color:#777d8f;margin-top:5px"></div></div>'+
            '<div id="__imc_v3_stats" style="font-size:10px;color:#777d8f;text-align:center" aria-live="polite"></div>'+
            '<details open style="background:#fff;border:1px solid #e3e5ec;border-radius:17px;padding:10px 12px;min-width:0"><summary style="cursor:pointer;font-size:9px;letter-spacing:1.2px;font-weight:900;color:#7153d8">LOG LIVE</summary><div id="__imc_v3_log" style="height:145px;overflow:auto;-webkit-overflow-scrolling:touch;background:#f4f4f8;border-radius:12px;padding:8px;margin-top:9px;font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere"></div></details>'+
            '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;padding-bottom:max(2px,env(safe-area-inset-bottom))"><button class="imc-v3-button" id="__imc_v3_stop" style="background:#fff1ef;color:#b7463e;border-color:#efc8c4">STOP</button>'+button('CHIUDI','__imc_v3_close')+'</div>'+
        '</div>');
        update();
    }
    function requestStop() {S.stopped=true;badge('ARRESTO…');setPhase('STOP richiesto');log('STOP richiesto · attendo la conclusione dell’operazione in corso');var stop=q('#__imc_v3_stop');if(stop){stop.textContent='ARRESTO…';stop.disabled=true;}}
    function fail(e) {
        S.running=false;if(!S.stopped)S.errors++;S.finalMessage=clean(e.message || e);badge(S.stopped?'FERMATO':'ERRORE');setPhase(S.stopped?'Importazione fermata':'Importazione interrotta');log(S.finalMessage);
        var error=q('#__imc_v3_error');if(error)error.textContent=S.finalMessage;var close=q('#__imc_v3_close');if(close)close.style.display='block';var stop=q('#__imc_v3_stop');if(stop)stop.disabled=true;
    }
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
        var leagueAdded=false,choices=[];
        S.catalog.filter(function(c){return c.group===group;}).forEach(function(c){
            var league=group==='DOMESTIC' && action(c.sm_action)==='league';
            if(league && leagueAdded)return;if(league)leagueAdded=true;
            choices.push({competition:c,league:league,label:league?'League':c.name});
        });
        choices.forEach(function(choice,i){q('#__imc_v3_competitions').insertAdjacentHTML('beforeend',button(choice.label,'__imc_v3_comp_'+i));on('__imc_v3_comp_'+i,function(){return chooseCompetition(choice.competition,choice.league);});});
        on('__imc_v3_back',showTypes);
    }
    async function preview() {
        S.selectedKey=competitionKey(S.competition,S.season);await openFixtures();
        var rows=await readRows();badge('ANTEPRIMA');
        var options=S.seasons.map(function(s){return '<option value="'+Number(s.imc_season)+'"'+(Number(s.imc_season)===S.season?' selected':'')+'>S'+String(s.imc_season).padStart(2,'0')+' · dal '+esc(s.imc_season_start_date)+'</option>';}).join('');
        var example=rows[0],label=S.leaguePlan.length ? 'League' : S.competition.name;
        var scope=S.leaguePlan.length ? '<p>Scorrimento automatico di '+S.leaguePlan.length+' divisioni:</p>'+S.leaguePlan.map(function(c){return '<div style="font-size:12px;margin:5px 0">Divisione '+esc(c.sm_division)+' · '+esc(c.name)+'</div>';}).join('')+'<p>Ogni divisione userà la propria competition key.</p>' : '<p>Importa questa competizione dalla pagina aperta in avanti.</p>';
        body('<h3>'+esc(S.world.id+' · '+S.world.name)+'</h3><p><strong>'+esc(label)+'</strong> · '+esc(S.competition.group)+'</p><label>IMC Season dell’edizione<select id="__imc_v3_season">'+options+'</select></label><p style="overflow-wrap:anywhere" id="__imc_v3_key">'+esc(S.selectedKey)+'</p><p>'+rows.length+' partite nella pagina aperta</p>'+(example?'<p>'+esc(example.home_name+' – '+example.away_name)+'<br>'+esc(example.match_date+' · '+(example.match_time || ''))+'<br>'+esc(example.competition_group_name || '')+'</p>':'')+scope+button('AVVIA IMPORTAZIONE','__imc_v3_start')+button('Indietro','__imc_v3_back')+'<p id="__imc_v3_error"></p>');
        q('#__imc_v3_season').onchange=function(){S.season=Number(this.value);S.selectedKey=competitionKey(S.competition,S.season);q('#__imc_v3_key').textContent=S.selectedKey;};
        on('__imc_v3_start',run);on('__imc_v3_back',function(){showCompetitions(S.competition.group);});
    }
    async function scanCurrentCompetition() {
        var locked=guardSource(),visited=new Set();
        for(var page=0;page<500;page++) {
            checkStop();
            if(sourceAction()!==locked)return;
            if(S.leaguePlan.length && /play[\s-]*off/i.test(round() || '')){log('LEAGUE · raggiunti i playoff, passo alla divisione successiva');return;}
            var key=pageKey();if(visited.has(key))throw new Error('Pagina Schedule ripetuta: scansione fermata');visited.add(key);guardSource();
            var rows=await readRows();if(!rows.length && !noFixtures())throw new Error('Pagina senza fixture riconoscibili');
            S.pages++;S.read+=rows.length;update();log('READ · '+heading()+' · '+rows.length+' fixture');await store(rows);update();
            if(!await nextPage(locked))return;
        }
        throw new Error('Limite pagine raggiunto: verifica il punto di arresto');
    }
    async function run() {
        if(S.running)return;S.running=true;S.stopped=false;S.pages=0;S.read=0;S.saved=0;S.skipped=0;S.errors=0;S.localSkip=0;S.sent=0;S.finalMessage=null;S.lastBatch={sent:0,written:0,skipped:0};S.existing=new Map();S.leagueIndex=0;
        S.selectedKey=competitionKey(S.competition,S.season);badge('IN CORSO');
        renderProgressUI();setPhase('Preparo Schedule');log('START · '+S.world.id+' · '+(S.leaguePlan.length?'League':S.competition.name)+' · IMC Season '+S.season);
        q('#__imc_v3_close').style.display='none';on('__imc_v3_close',function(){q('#__imc_schedule_v3').remove();});
        q('#__imc_v3_stop').onclick=requestStop;update();
        await openFixtures();validateLeaguePlan();await loadExisting();
        if(S.leaguePlan.length) {
            for(var i=0;i<S.leaguePlan.length;i++) {
                checkStop();S.leagueIndex=i;await changeLeagueDivision(S.leaguePlan[i]);await scanCurrentCompetition();
            }
        } else await scanCurrentCompetition();
        checkStop();S.running=false;badge('COMPLETATO');setPhase('Importazione completata');log('FINE · '+S.saved+' salvate · '+S.skipped+' già presenti · '+S.errors+' errori');q('#__imc_v3_stop').style.display='none';q('#__imc_v3_close').style.display='block';
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
    overlay.innerHTML='<style>#__imc_schedule_v3 *{box-sizing:border-box}#__imc_schedule_v3 .imc-v3-button{display:block;width:100%;min-height:48px;padding:12px;margin:7px 0;border:1px solid #dedced;border-radius:13px;background:#fff;color:#473c83;font:700 13px Inter,-apple-system,sans-serif;cursor:pointer}#__imc_schedule_v3 .imc-v3-button:disabled{opacity:.4;cursor:default}#__imc_schedule_v3 .imc-v3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#__imc_schedule_v3 select{display:block;width:100%;padding:12px;margin:8px 0;border:1px solid #dedced;border-radius:12px;background:white}#__imc_v3_error{color:#b7463e;overflow-wrap:anywhere}</style><div style="width:min(100%,420px);height:100%;margin:auto;background:#f8f8fd;border:1px solid #e3e4ec;border-radius:22px;box-shadow:0 14px 44px rgba(20,24,40,.32);overflow:hidden;display:flex;flex-direction:column"><div style="background:white;padding:15px;border-bottom:1px solid #e5e6ee"><div style="font-size:10px;letter-spacing:2px;font-weight:900;color:#7153d8">IMC · SCHEDULE IMPORT</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><strong style="font-size:20px">SCHEDULE V3.4</strong><span id="__imc_v3_badge" style="font-size:9px;background:#eee8ff;color:#6548c8;padding:8px;border-radius:99px">PRONTO</span><button id="__imc_v3_dismiss" aria-label="Chiudi" style="border:0;background:none;font-size:20px">×</button></div></div><div id="__imc_v3_body" style="padding:14px;overflow:auto;flex:1"></div></div>';
    document.body.appendChild(overlay);
    q('#__imc_v3_dismiss').onclick=function(){if(S.running)requestStop();else overlay.remove();};
    S.loggedManager=positive(q('#scid') && (q('#scid').value || text(q('#scid')))) || positive(window.CUSTOMERID);
    boot().catch(fail);
    // Release iPhone Shortcuts; the overlay reports the actual import outcome.
    try {if(typeof completion==='function')completion(JSON.stringify({ok:true,started:true,version:VERSION}));}catch(_){}
})();
