window.imcStartDaily=async function(token){
if(window.imcDailyActive)return;window.imcDailyActive=true;
const S={stop:false},panel=document.createElement('aside');panel.style.cssText='position:fixed;bottom:12px;left:8px;right:8px;background:white;color:#182a40;padding:10px;z-index:2147483647;font:13px system-ui';panel.innerHTML='<b>IMC Daily Updates</b><div></div><small></small> <button>Interrompi</button>';document.body.append(panel);
panel.querySelector('button').onclick=()=>S.stop=true;
let count=0,errors=0;function paint(m){panel.querySelector('div').textContent=m+' · Confermati '+count+' · Errori '+errors}function log(m){panel.querySelector('small').textContent=m}
const sl=ms=>new Promise(r=>setTimeout(r,ms)),cl=v=>String(v==null?"":v).replace(/\u00a0/g," ").replace(/\s+/g," ").trim(),nm=v=>cl(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),at=(e,k)=>e?e.getAttribute(k):null,rt=()=>document.getElementById("currentScreenA")||document,tb=()=>rt().querySelector("#squadPageTable");
    const vis=e=>{if(!e||e.closest?.("#workingCopy"))return false;let s=getComputedStyle(e);return s.display!=="none"&&s.visibility!=="hidden"&&e.getClientRects().length>0},ck=()=>{if(S.stop)throw Error("STOP")};
    async function wait(fn,to=16000){let st=Date.now();while(Date.now()-st<to){ck();try{let v=fn();if(v)return v}catch(_){}await sl(120)}return null}
    function dt(v){let s=nm(v).replace(/\./g,""),m=s.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);if(!m)return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:null;let M={gen:1,gennaio:1,feb:2,febbraio:2,mar:3,marzo:3,apr:4,aprile:4,mag:5,maggio:5,giu:6,giugno:6,lug:7,luglio:7,ago:8,agosto:8,set:9,settembre:9,ott:10,ottobre:10,nov:11,novembre:11,dic:12,dicembre:12},mo=M[m[2]];return mo?`${m[3]}-${String(mo).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`:null}
    const ni=v=>{if(!/\d/.test(cl(v)))return null;let n=Number(cl(v).replace(/[^\d-]/g,""));return Number.isFinite(n)?n:null};
    function idcb(e,f){let m=(at(e,"onclick")||"").match(new RegExp(f+"\\s*\\(\\s*['\"]?(\\d+)","i"));return m?+m[1]:null}
    
function click(e){let k="imc"+Date.now()+Math.random().toString(36).slice(2);e.setAttribute("data-imc",k);let s=document.createElement("script");s.textContent=`(()=>{let e=document.querySelector('[data-imc="${k}"]');if(typeof e.onclick==="function")e.onclick.call(e);else{let r=e.getAttribute("onclick")||"";if(r)(new Function(r)).call(e);else e.click()}})()`;document.documentElement.appendChild(s);s.remove();e.removeAttribute("data-imc")}
    
async function openP(id,name){
          for(let a=1;a<=3;a++){
    ck();
    paint(`APERTURA PLAYER · TENTATIVO ${a}/3`);
    log(`APRO ${name} · player_id ${id} · tentativo ${a}/3`);
    window.PLAYER_downloadPlayer(id);

    let stableSig="",stableAt=0,last="scheda non caricata";
    let ok=await wait(()=>{
      const info=rt().querySelector("#playerInfo");
      const heading=rt().querySelector("#playerNameh1");
      const pic=rt().querySelector("#playerPicture");
      if(!info||!heading||!vis(info)||!vis(heading)){
        last="DOM player assente";
        return null;
      }

      // If Soccer Manager exposes player_id in the picture URL, use it as confirmation.
      // If it does NOT expose it, do not reject an otherwise loaded/stable player page.
      const src=at(pic,"src")||"";
      const m=src.match(/\/player\/(\d+)\.(?:png|jpg|jpeg|webp)(?:\?|$)/i);
      if(m && Number(m[1])!==Number(id)){
        last=`player_id letto ${m[1]} invece di ${id}`;
        return null;
      }

      const sig=[cl(heading.textContent),cl(rt().querySelector("#playerRating")?.textContent),src].join("|");
      if(sig!==stableSig){
        stableSig=sig;
        stableAt=Date.now();
        last="DOM in stabilizzazione";
        return null;
      }
      return Date.now()-stableAt>=650?info:null;
    },12000);

    if(ok && tx("playerNameh1") && Number(tx("playerRating"))>0 && tx("playerPosition")){
      log(`APERTURA OK · ${name} · tentativo ${a}/3`);
      return;
    }
    log(`RETRY APERTURA · ${name} · ${a}/3 fallito · ${last}`);
    if(a<3)await sl(650);
          }
          throw Error(`Scheda player non caricata dopo 3 tentativi · ${id}`);
        }
        const tx=id=>cl(rt().querySelector("#"+id)?.textContent)||null;
    function foot(){if(vis(rt().querySelector("#playerpopup-foot-both")))return"Ambidestro";if(vis(rt().querySelector("#playerpopup-foot-right")))return"Destra";if(vis(rt().querySelector("#playerpopup-foot-left")))return"Sinistra";return null}
    function prof(id){let f=rt().querySelector("#playerFlag .flag-player-profile[title]"),c=rt().querySelector("#playerClub"),im=rt().querySelector("#playerPicture");return{player_id:id,full_name:tx("playerNameh1"),nationality:cl(at(f,"title"))||null,position:tx("playerPosition"),rating:ni(tx("playerRating")),market_value:tx("playerValue"),age:ni(tx("playerAge")),date_of_birth:dt(tx("playerDob")),height_cm:ni(tx("playerHeight")),weight_kg:ni(tx("playerWeight")),foot:foot(),current_club:tx("playerClub"),current_sm_club_id:idcb(c,"MENU_clubOverviewDraw"),real_club:tx("playerRealClub"),salary:tx("WagesRaw"),contract_seasons:ni(tx("playerContract")),image_url:at(im,"src")||null}}
    function ratings(){let o=[];for(let r of rt().querySelectorAll("#ratingHistory tbody tr")){if(!vis(r)||r.getAttribute("data-name")==="ratingHelper")continue;let c=[...r.querySelectorAll("td")],d=dt(r.querySelector('[name="date"]')?.textContent||c[0]?.textContent),a=ni(r.querySelector('[name="oldrating"]')?.textContent||c[1]?.textContent),b=ni(r.querySelector('[name="newrating"]')?.textContent||c[2]?.textContent);if(d&&a!==null&&b!==null)o.push({change_date:d,old_rating:a,new_rating:b})}return o}
    function cons(v){let s=cl(v).replace(/^Costo\s*/i,""),m=s.match(/^([0-9]+(?:[.,][0-9]+)?\s*[kmb])\b/i),cash=m?cl(m[1]).replace(/\s+/g,""):null,rest=(m?s.slice(m[0].length):s).replace(/^\s*(?:e|\+|,)+\s*/i,""),players=rest?rest.split(/\s+(?:e|\+)\s+/i).map(cl).filter(Boolean).map(player_name=>({player_name})):[];return{cash,players,raw:cl(v)}}
    function transfers(){
      let out=[],seen=new Set();
      const history=rt().querySelector("#PlayerHistory")||rt();
      const dates=[...history.querySelectorAll('[name="date"]')];

      for(const dateEl of dates){
        let box=dateEl;
        for(let i=0;i<7 && box;i++,box=box.parentElement){
          if(box.querySelector?.('[name="clubfrom"]') && box.querySelector?.('[name="clubto"]')) break;
        }
        if(!box) continue;

        const fromEl=box.querySelector('[name="clubfrom"]');
        const toEl=box.querySelector('[name="clubto"]');
        if(!fromEl||!toEl) continue;

        const seasonEl=box.querySelector('[name="season"]');
        const recvEl=box.querySelector('[name="clubfromreceived"]');
        const date=dt(dateEl.textContent);
        const from=cl(fromEl.textContent);
        const to=cl(toEl.textContent);
        const recv=cl(recvEl?.textContent);
        if(!date||(!from&&!to)) continue;

        const c=cons(recv);
        const k=[date,nm(from),nm(to),nm(c.raw)].join("|");
        if(seen.has(k)) continue;
        seen.add(k);

        out.push({
          season:ni(seasonEl?.textContent),
          date,
          club_from:from||null,
          club_to:to||null,
          amount_text:c.cash,
          exchange_players:c.players,
          consideration_raw:c.raw
        });
      }
      return out;
    }
    async function hist(){
      const tab=rt().querySelector('#PlayerTabsMenu [data-target="PlayerHistory"]');
      if(!tab)throw Error("CRONOLOGIA non trovata");
      const signature=()=>{
        const h=rt().querySelector("#PlayerHistory");
        if(!h||!vis(h))return null;
        return JSON.stringify({text:cl(h.textContent),rating:ratings(),transfers:transfers()});
      };
      for(let a=1;a<=3;a++){
        ck();
        paint(`CRONOLOGIA · TENTATIVO ${a}/3`);
        log(`CRONOLOGIA · tentativo ${a}/3`);
        click(tab);
        const visible=await wait(()=>{const h=rt().querySelector("#PlayerHistory");return h&&vis(h)?h:null},12000);
        if(!visible){log(`CRONOLOGIA · ${a}/3 non visibile`);continue}
        let last=null,stableAt=0,lastR=-1,lastT=-1;
        const ok=await wait(()=>{
          const sg=signature();
          if(!sg){last=null;stableAt=0;return null}
          const rr=ratings(),tt=transfers();
          if(sg!==last){last=sg;stableAt=Date.now();lastR=rr.length;lastT=tt.length;return null}
          if(Date.now()-stableAt<2500)return null;
          const sg2=signature(),rr2=ratings(),tt2=transfers();
          if(sg2!==sg||rr2.length!==lastR||tt2.length!==lastT){
            last=sg2;stableAt=Date.now();lastR=rr2.length;lastT=tt2.length;return null
          }
          return {rating:rr2,transfers:tt2};
        },20000);
        if(ok){
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          const final=signature(),rr=ratings(),tt=transfers();
          if(final===last&&rr.length===ok.rating.length&&tt.length===ok.transfers.length){
            log(`CRONOLOGIA COMPLETA · transfer ${tt.length} · rating ${rr.length}`);
            return {rating:rr,transfers:tt}
          }
        }
        log(`CRONOLOGIA · ${a}/3 non stabile/completa · retry`);
      }
      throw Error("CRONOLOGIA non stabilizzata/completa dopo 3 tentativi · CODEX NON SALVATO");
    }

async function api(body){const r=await fetch('https://www.italianmastersclub.it/imc-universal-gateway/daily-player.php',{method:'POST',headers:{'Content-Type':'application/json','X-IMC-Daily':token},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Gateway '+r.status);return d}
function active(type){let t=rt().querySelector('#ratingchangestabs-'+type);return vis(t)&&/(toptabs|topmenu)-active/.test(t.className)}
async function list(type){
 const t=rt().querySelector('#ratingchangestabs-'+type);if(!vis(t))throw Error('Apri Database giocatori');if(!active(type))click(t);
 let prev='',since=0;const found=await wait(()=>{const table=rt().querySelector('#rating-table');if(!active(type)||!vis(table))return null;
 const items=[...table.querySelectorAll('tbody tr[onclick*="PLAYER_downloadPlayer"]')].filter(vis).map(r=>({id:idcb(r,'PLAYER_downloadPlayer'),name:cl(r.querySelector('[data-id="playerName"]')?.textContent)}));
 if(items.some(x=>!x.id||!x.name)||(!items.length&&!/nessun giocatore|nessuna variazione|no players/i.test(table.innerText)))return null;
 const sig=JSON.stringify(items);if(sig!==prev){prev=sig;since=Date.now()}return Date.now()-since>=2500?items:null},30000);
 if(!found)throw Error('Elenco incompleto '+type);return found}
async function back(type){if(!vis(rt().querySelector('#ratingchangestabs'))){window.UTIL_handleLeftMenuIconClick(true);if(!await wait(()=>vis(rt().querySelector('#ratingchangestabs')),12000))throw Error('Ritorno elenco fallito')}if(!active(type))await list(type)}
try{await api({check:true});const saved=new Set();for(const type of ['changes','new']){
 paint(type==='changes'?'Carico variazioni':'Carico nuovi giocatori');const items=await list(type);
 for(const item of items){ck();if(saved.has(item.id))continue;let row;
 try{await openP(item.id,item.name);const p=prof(item.id);const h=await hist();row={...p,rating_history:JSON.stringify(h.rating),transfer_history:JSON.stringify(h.transfers),imported_at:new Date().toISOString().slice(0,19).replace('T',' ')}}
 catch(e){if(S.stop)throw e;errors++;log(item.name+' · '+e.message)}
 if(row){const d=await api({row});saved.add(item.id);count++;log(item.name+' · '+d.state)}
 await back(type);paint('Elaborazione')}}
 paint('Completato')}catch(e){paint('Fermo · '+e.message)}finally{window.imcDailyActive=false;const b=panel.querySelector('button');b.textContent='Chiudi';b.onclick=()=>panel.remove()}
};