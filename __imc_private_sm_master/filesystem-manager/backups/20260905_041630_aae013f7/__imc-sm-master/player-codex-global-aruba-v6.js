(() => {
  function PAGE_WORKER() {
    if (window.__IMC_GLOBAL_NEW_PLAYERS_IMPORT_RUNNING__) return;
    window.__IMC_GLOBAL_NEW_PLAYERS_IMPORT_RUNNING__ = true;

    const ENDPOINT = 'https://www.italianmastersclub.it/__imc-sm-master/admin/ingestion.php';
    const TOKEN = 'IMC_RESULTS_GOLD_2026_V1_9f6d2c4a7b8e1d3f';
    const VERSION = 'player-codex-global-aruba-v6';
    const STOP_SIGNAL = '__IMC_STOP__';
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const clean = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const norm = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const visible = el => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && el.getClientRects().length > 0;
    const uuid = () => typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16); });
    const runUuid = uuid();
    const state = { total:0,done:0,saved:0,errors:0,ratingChanged:0,positionChanged:0,newPlayers:0,historyRows:0,duplicates:0,stopRequested:false,errorList:[] };

    function localDateISO() {
      const d=new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function parseSMDate(value) {
      const s=norm(value).replace(/\./g,'');
      if(!s)return null;
      let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
      m=s.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
      if(!m)return null;
      const months={gen:1,gennaio:1,january:1,jan:1,feb:2,febbraio:2,february:2,mar:3,marzo:3,march:3,apr:4,aprile:4,april:4,mag:5,maggio:5,may:5,giu:6,giugno:6,jun:6,june:6,lug:7,luglio:7,jul:7,july:7,ago:8,agosto:8,aug:8,august:8,set:9,settembre:9,sep:9,september:9,ott:10,ottobre:10,oct:10,october:10,nov:11,novembre:11,november:11,dic:12,dicembre:12,dec:12,december:12};
      const month=months[m[2]];return month?`${m[3]}-${String(month).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`:null;
    }
    function moneyNumber(value) {
      const s=clean(value).toLowerCase().replace(/\s+/g,'').replace(/[^0-9.,kmb-]/g,'');
      const m=s.match(/^(-?[0-9]+(?:[.,][0-9]+)?)([kmb])?$/i);if(!m)return null;
      const factor={k:1e3,m:1e6,b:1e9}[m[2]]||1;const n=Math.round(Number(m[1].replace(',','.'))*factor);return Number.isFinite(n)&&n>=0?n:null;
    }
    function ensureRunning(){if(state.stopRequested)throw new Error(STOP_SIGNAL);}
    async function api(payload){
      const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-IMC-Ingestion-Token':TOKEN},body:JSON.stringify(payload)});
      const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null;}catch{}
      if(!response.ok||!data?.ok)throw new Error(data?.error||raw||`HTTP ${response.status}`);return data;
    }

    document.getElementById('imc-global-new-players-ui')?.remove();
    const ui=document.createElement('div');ui.id='imc-global-new-players-ui';
    ui.innerHTML=`<style>
      #imc-global-new-players-ui{position:fixed;z-index:2147483647;top:max(6px,env(safe-area-inset-top));bottom:max(6px,env(safe-area-inset-bottom));left:6px;right:6px;max-width:430px;margin:auto;overflow:hidden;display:flex;flex-direction:column;background:#f7f7fb;color:#1d2433;border:1px solid #dadcea;border-radius:18px;box-shadow:0 16px 50px rgba(10,15,30,.28);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#imc-global-new-players-ui *{box-sizing:border-box}.head{padding:9px 11px;background:#fff;border-bottom:1px solid #ececf3}.ey{font-size:7px;font-weight:900;letter-spacing:1px;color:#7757d9}.headrow{display:flex;align-items:center;justify-content:space-between;margin-top:3px}.title{font-size:14px;font-weight:950}.live{padding:4px 7px;border-radius:999px;background:#eee9ff;color:#6748ca;font-size:7px;font-weight:900}.body{flex:1;min-height:0;overflow:auto;padding:7px}.card{background:#fff;border:1px solid #ececf3;border-radius:11px;padding:7px 8px;margin-bottom:5px}.player{display:flex;align-items:center;gap:8px}.avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;display:none}.who{font-size:12px;font-weight:950}.pid,.status,.progress{font-size:8px;color:#75798c;font-weight:750}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.metric{background:#fff;border:1px solid #ececf3;border-radius:9px;padding:5px}.ml{font-size:5.5px;color:#9296a7;font-weight:900}.mv{font-size:14px;font-weight:950}.action{font-size:10px;font-weight:950}.track{height:6px;background:#ececf4;border-radius:20px;margin-top:5px;overflow:hidden}.bar{height:100%;width:0;background:linear-gradient(90deg,#7256d6,#9a7cf1)}.progress{display:flex;justify-content:space-between;margin-top:4px}.log{height:92px;overflow:auto;background:#f6f6fa;border-radius:7px;padding:5px;white-space:pre-wrap;font:8px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace}.buttons{display:grid;gap:5px;margin-top:5px}button{border:0;border-radius:9px;padding:9px;font-size:10px;font-weight:950}.stop{background:#fff0f0;color:#b53d3d;border:1px solid #f2c8c8}.close{background:#ececf3;color:#313646}</style>
      <div class="head"><div class="ey">IMC · PLAYER CODEX CORE · ARUBA/MYSQL</div><div class="headrow"><div class="title">VARIAZIONI + NUOVI GIOCATORI</div><div class="live" id="imcLive">IN CORSO</div></div></div>
      <div class="body"><div class="card player"><img class="avatar" id="imcAvatar"><div><div class="who" id="imcWho">AVVIO</div><div class="pid" id="imcPid">PLAYER ID -</div></div></div>
      <div class="grid"><div class="metric"><div class="ml">RATING</div><div class="mv" id="imcRatingChanged">0</div></div><div class="metric"><div class="ml">POSIZIONI</div><div class="mv" id="imcPositionChanged">0</div></div><div class="metric"><div class="ml">NUOVI</div><div class="mv" id="imcNewPlayers">0</div></div><div class="metric"><div class="ml">TOTALI</div><div class="mv" id="imcTotal">0</div></div><div class="metric"><div class="ml">SALVATI</div><div class="mv" id="imcSaved">0</div></div><div class="metric"><div class="ml">ERRORI</div><div class="mv" id="imcErrors">0</div></div></div>
      <div class="card"><div class="action" id="imcAction">LETTURA LISTE</div><div class="status" id="imcStatus">PRONTO</div><div class="track"><div class="bar" id="imcBar"></div></div><div class="progress"><span id="imcProgress">0 / 0</span><span id="imcPercent">0%</span></div></div>
      <div class="card"><div class="log" id="imcLog"></div></div><div class="buttons" id="imcRunningButtons"><button class="stop" id="imcStop">INTERROMPI</button></div><div class="buttons" id="imcFinalButtons" style="display:none"><button class="close" id="imcClose">CHIUDI</button></div></div>`;
    document.documentElement.appendChild(ui);const $=id=>ui.querySelector('#'+id);
    const log=message=>{$('imcLog').textContent+=`[${new Date().toLocaleTimeString('it-IT')}] ${message}\n`;$('imcLog').scrollTop=$('imcLog').scrollHeight;};
    const setAction=(main,sub='')=>{$('imcAction').textContent=main;$('imcStatus').textContent=sub;};
    function paint(){
      $('imcRatingChanged').textContent=state.ratingChanged;$('imcPositionChanged').textContent=state.positionChanged;$('imcNewPlayers').textContent=state.newPlayers;$('imcTotal').textContent=state.total;$('imcSaved').textContent=state.saved;$('imcErrors').textContent=state.errors;$('imcProgress').textContent=`${state.done} / ${state.total}`;
      const pct=state.total?Math.min(100,state.done/state.total*100):0;$('imcBar').style.width=`${pct}%`;$('imcPercent').textContent=`${Math.round(pct)}%`;
    }
    $('imcStop').onclick=()=>{state.stopRequested=true;$('imcStop').disabled=true;$('imcStop').textContent='INTERRUZIONE…';setAction('INTERRUZIONE RICHIESTA','Termino il giocatore corrente');};
    function endUI(mode,message){$('imcLive').textContent=mode==='complete'?'COMPLETATO':mode==='stopped'?'INTERROTTO':'ERRORE';setAction(mode==='complete'?'IMPORT COMPLETATO':mode==='stopped'?'IMPORT INTERROTTO':'IMPORT NON COMPLETATO',message);$('imcRunningButtons').style.display='none';$('imcFinalButtons').style.display='grid';$('imcClose').onclick=()=>{ui.remove();window.__IMC_GLOBAL_NEW_PLAYERS_IMPORT_RUNNING__=false;};}

    const table=()=>document.querySelector('#currentScreenA #rating-table');
    const playerId=row=>{const m=(row?.getAttribute('onclick')||'').match(/PLAYER_downloadPlayer\s*\(\s*['"]?(\d+)/i);return m?Number(m[1]):null;};
    const rowName=(row,id)=>clean(row?.querySelector('[data-id="playerName"]')?.textContent)||`PLAYER ${id}`;
    function currentType(){const t=table();if(!t||!visible(t))return null;const r=[...t.querySelectorAll('tbody tr[onclick*="PLAYER_downloadPlayer"]')].find(visible);if(!r)return null;return r.querySelector('[data-id="change"]')?'changes':'new';}
    function click(el){if(!el)return;try{el.scrollIntoView({block:'center'});}catch{}try{el.click();}catch{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}}
    async function openList(type){
      if(currentType()===type)return;
      const tab=document.querySelector(type==='new'?'#currentScreenA [id="ratingchangestabs-new"]':'#currentScreenA [id="ratingchangestabs-changes"]');if(!tab)throw new Error(`TAB ${type==='new'?'NUOVI GIOCATORI':'VARIAZIONI'} non trovata`);
      setAction(type==='new'?'APRO NUOVI GIOCATORI':'APRO VARIAZIONI','CARICAMENTO LISTA');
      const raw=tab.getAttribute('onclick')||'';if(typeof tab.onclick==='function')tab.onclick.call(tab);else if(raw)(new Function(raw)).call(tab);else click(tab);
      const start=Date.now();while(Date.now()-start<12000){ensureRunning();if(currentType()===type)return;await sleep(100);}throw new Error('Lista giocatori non caricata');
    }
    function scan(type){
      const t=table();if(!t||!visible(t))throw new Error('Tabella giocatori non disponibile');const map=new Map();
      for(const row of t.querySelectorAll('tbody tr[onclick*="PLAYER_downloadPlayer"]')){if(!visible(row))continue;const id=playerId(row);if(!id||map.has(id))continue;const change=row.querySelector('[data-id="change"]');const cls=clean(change?.querySelector('.menu_all_icons')?.className);let changeType=null;if(/\brateup\b/i.test(cls))changeType='rateup';else if(/\bratedown\b/i.test(cls))changeType='ratedown';else if(/\bplayerchange\b/i.test(cls))changeType='playerchange';const n=Number((clean(change?.textContent).match(/\d+/)||[])[0]||0);map.set(id,{playerId:id,playerName:rowName(row,id),sourceType:type,changeType,ratingChange:changeType==='ratedown'?-Math.abs(n):changeType==='rateup'?Math.abs(n):0});}
      return [...map.values()];
    }
    function findRow(id){return [...(table()?.querySelectorAll('tbody tr[onclick*="PLAYER_downloadPlayer"]')||[])].find(r=>playerId(r)===id)||null;}
    function expectedSurname(shortName){const s=clean(shortName);return norm(s.includes('.')?s.slice(s.indexOf('.')+1):s.split(/\s+/).pop());}
    async function openPlayer(row){
      const target=findRow(row.playerId);if(!target)throw new Error('Riga giocatore non trovata');click(target);const start=Date.now(),expected=expectedSurname(row.playerName);let signature='',stable=0;
      while(Date.now()-start<16000){ensureRunning();const root=document.querySelector('#currentScreenA #playerInfo'),name=document.querySelector('#currentScreenA #playerNameh1');if(root&&name&&visible(root)&&visible(name)){const full=clean(name.textContent),sig=[full,clean(document.querySelector('#currentScreenA #playerRating')?.textContent),clean(document.querySelector('#currentScreenA #playerDob')?.textContent),document.querySelector('#currentScreenA #playerPicture')?.getAttribute('src')||''].join('|');const identityOk=!expected||norm(full).includes(expected);if(identityOk&&sig.replace(/\|/g,'')){if(sig!==signature){signature=sig;stable=Date.now();}else if(Date.now()-stable>=700)return;}}await sleep(120);}throw new Error('Scheda giocatore non caricata o identità non verificata');
    }
    async function openPlayerRetry(row,type){let last;for(let i=1;i<=3;i++){try{log(`${row.playerName} · apertura ${i}/3`);await openPlayer(row);return;}catch(e){last=e;if(i<3){try{await backToList(type);}catch{}await sleep(400);}}}throw last;}
    const text=id=>clean(document.querySelector(`#currentScreenA #${id}`)?.textContent)||null;
    function readFoot(){if(visible(document.querySelector('#currentScreenA #playerpopup-foot-both')))return'Ambidestro';if(visible(document.querySelector('#currentScreenA #playerpopup-foot-right')))return'Destra';if(visible(document.querySelector('#currentScreenA #playerpopup-foot-left')))return'Sinistra';return null;}
    function idFromOnclick(el){const m=(el?.getAttribute('onclick')||'').match(/\((\d+)\)/);return m&&Number(m[1])>0?Number(m[1]):null;}
    function readProfile(row){
      const flag=document.querySelector('#currentScreenA #playerFlag .flag-player-profile[title]');const flagClass=clean(flag?.className);const nationMatch=flagClass.match(/\bflag([A-Z]{2,8})\b/);const wiki=document.querySelector('#currentScreenA #wikiClubLink');const wikiMatch=(wiki?.getAttribute('href')||'').match(/[?&]clubid=(\d+)/i);const image=document.querySelector('#currentScreenA #playerPicture')?.getAttribute('src')||null;const dobRaw=text('playerDob');
      return {short_name:row.playerName,full_name:text('playerNameh1'),age:Number(text('playerAge'))||null,date_of_birth:parseSMDate(dobRaw),date_of_birth_raw:dobRaw,nationality:clean(flag?.getAttribute('title'))||null,nationality_code:nationMatch?nationMatch[1]:null,position:text('playerPosition'),foot:readFoot(),height_cm:Number(text('playerHeight'))||null,weight_kg:Number(text('playerWeight'))||null,rating:Number(text('playerRating'))||null,old_rating:Number(text('playerOldRating'))||null,market_value_label:text('playerValue'),market_value:moneyNumber(text('playerValue')),wage_label:text('WagesRaw'),wage:moneyNumber(text('WagesRaw')),contract_seasons:Number(text('playerContract'))||null,soccerwiki_club_name:text('playerRealClub'),soccerwiki_club_id:wikiMatch?Number(wikiMatch[1]):null,image_url:image,observed_world_club_name:text('playerClub'),observed_world_club_id:idFromOnclick(document.querySelector('#currentScreenA #playerClub')),observed_loan_club_name:text('playerLoanClub'),observed_loan_club_id:idFromOnclick(document.querySelector('#currentScreenA #playerLoanClub'))};
    }
    function historyRows(){const out=[];for(const row of document.querySelectorAll('#currentScreenA #ratingHistory tbody tr')){if(!visible(row)||row.getAttribute('data-name')==='ratingHelper')continue;const cells=[...row.querySelectorAll('td')];if(cells.length<3)continue;const raw=clean(cells[0].textContent),old=Number(clean(row.querySelector('[name="oldrating"]')?.textContent||cells[1].textContent)),next=Number(clean(row.querySelector('[name="newrating"]')?.textContent||cells[2].textContent)),date=parseSMDate(raw);if(date&&Number.isFinite(old)&&Number.isFinite(next))out.push({date_raw:raw,change_date:date,old_rating:old,new_rating:next});}return out;}
    async function readHistory(){
      const tab=document.querySelector('#currentScreenA #PlayerTabsMenu [data-target="PlayerHistory"]')||[...document.querySelectorAll('#currentScreenA #PlayerTabsMenu div,#currentScreenA #PlayerTabsMenu a')].find(el=>norm(el.textContent)==='cronologia');if(!tab)return[];click(tab);let sig='',stable=0,start=Date.now();while(Date.now()-start<9000){ensureRunning();const root=document.querySelector('#currentScreenA #PlayerHistory');if(root&&visible(root)){const now=root.innerHTML;if(now!==sig){sig=now;stable=Date.now();}else if(Date.now()-stable>=600)return historyRows();}await sleep(120);}return historyRows();
    }
    function effectiveDate(row,profile,history){if(!['rateup','ratedown'].includes(row.changeType))return null;const exact=history.find(h=>h.new_rating===profile.rating&&h.old_rating===profile.old_rating);return (exact||history[0]||{}).change_date||null;}
    async function save(row,profile,history){return api({type:'player_global',action:'store_player',parser_version:VERSION,run_uuid:runUuid,captured_at:new Date().toISOString(),observed_date:localDateISO(),effective_change_date:effectiveDate(row,profile,history),player_id:row.playerId,source_type:row.sourceType,change_type:row.changeType,rating_change:row.ratingChange,profile,rating_history:history});}
    async function backToList(type){const back=document.querySelector('#currentScreenA #back-button');if(!back||!visible(back))throw new Error('Pulsante indietro non disponibile');click(back);for(let i=0;i<110;i++){await sleep(120);if(currentType()===type)return;}throw new Error('Lista giocatori non ripristinata');}
    async function process(players,type){
      if(!players.length)return;await openList(type);
      for(const row of players){ensureRunning();let opened=false;$('imcWho').textContent=row.playerName;$('imcPid').textContent=`PLAYER ID ${row.playerId}`;$('imcAvatar').style.display='none';
        try{setAction(`APERTURA · ${row.playerName}`,type==='new'?'NUOVO GIOCATORE':'VARIAZIONE');await openPlayerRetry(row,type);opened=true;const profile=readProfile(row);if(!profile.full_name)throw new Error('Nome completo non trovato');$('imcWho').textContent=profile.full_name;if(profile.image_url){$('imcAvatar').src=profile.image_url;$('imcAvatar').style.display='block';}const history=await readHistory();state.historyRows+=history.length;setAction(`SALVATAGGIO · ${profile.full_name}`,'CORE MYSQL');const result=await save(row,profile,history);state.saved++;state.done++;paint();log(`${profile.full_name} · salvato · data modifica ${result.effective_change_date||'n/d'} · history ${result.history_rows}`);
        }catch(e){if(String(e?.message||e)===STOP_SIGNAL)throw e;state.errors++;state.done++;state.errorList.push({player_id:row.playerId,name:row.playerName,error:String(e?.message||e)});paint();log(`ERRORE · ${row.playerName} · ${e?.message||e}`);}if(opened){try{await backToList(type);}catch(e){if(state.done<state.total)throw e;}}await sleep(100);}
    }
    async function finish(status){if(!state.saved)return;await api({type:'player_global',action:'finish_run',run_uuid:runUuid,stats:{status,total:state.total,processed:state.done,saved:state.saved,errors:state.errors,rating_changed:state.ratingChanged,position_changed:state.positionChanged,new_players:state.newPlayers,history_rows:state.historyRows,duplicates_skipped:state.duplicates,error_list:state.errorList}});}

    (async()=>{try{
      setAction('LETTURA VARIAZIONI','ANALISI LISTA');await openList('changes');const changed=scan('changes');
      setAction('LETTURA NUOVI GIOCATORI','ANALISI LISTA');await openList('new');const changedIds=new Set(changed.map(x=>x.playerId));const rawNew=scan('new');const fresh=rawNew.filter(x=>!changedIds.has(x.playerId));state.duplicates=rawNew.length-fresh.length;
      state.ratingChanged=changed.filter(x=>x.changeType==='rateup'||x.changeType==='ratedown').length;state.positionChanged=changed.filter(x=>x.changeType==='playerchange').length;state.newPlayers=fresh.length;state.total=changed.length+fresh.length;paint();log(`Variazioni ${changed.length} · Nuovi ${fresh.length} · Duplicati ${state.duplicates}`);if(!state.total)throw new Error('Nessun giocatore trovato');
      await process(changed,'changes');await process(fresh,'new');await finish('complete');endUI('complete',`${state.saved} SALVATI · ${state.errors} ERRORI · ${state.historyRows} RIGHE HISTORY`);
    }catch(e){const stopped=String(e?.message||e)===STOP_SIGNAL||state.stopRequested;try{await finish(stopped?'stopped':'error');}catch(fin){log(`Chiusura run: ${fin?.message||fin}`);}if(!stopped)state.errors++;paint();log(`${stopped?'INTERRUZIONE':'ERRORE FATALE'} · ${e?.message||e}`);endUI(stopped?'stopped':'error',`${state.saved} SALVATI · ${state.errors} ERRORI`);}})();
  }
  try{const script=document.createElement('script');script.textContent=`(${PAGE_WORKER.toString()})();`;(document.documentElement||document.head).appendChild(script);script.remove();if(typeof completion==='function')completion('IMC Player Codex Global Aruba/MySQL v6 avviato');}
  catch(error){if(typeof completion==='function')completion('Errore avvio IMC Player Codex Global: '+(error?.message||error));}
})();
