/* IMC public-site analytics: shared consent, one GA4 initialization per page. */
(()=>{'use strict';
if(window.imcAnalyticsLoaded||/\/admin\//.test(location.pathname))return;window.imcAnalyticsLoaded=true;
const id='G-9HP6T5ZMLE',key='imc_analytics_consent';let started=false,panel;
function preference(){try{return localStorage.getItem(key)}catch{return null}}
function start(){if(started)return;started=true;
// Existing homepage tag owns its configuration; never send a duplicate config.
if(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')){window.gtag?.('consent','update',{analytics_storage:'granted'});return;}
window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());const url=new URL(location.origin+location.pathname);const query=new URLSearchParams(location.search);for(const k of ['world','season','section']){const v=query.get(k);if(v&&/^[a-zA-Z0-9_-]{1,40}$/.test(v))url.searchParams.set(k,v);}
let ref='';try{const r=new URL(document.referrer);ref=r.origin+r.pathname}catch{}
gtag('config',id,{page_location:url.href,page_referrer:ref,allow_google_signals:false,allow_ad_personalization_signals:false,game_world:query.get('world')?.match(/^GW\d{3}$/)?.[0]||undefined});
const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(s);}
function choose(value){try{localStorage.setItem(key,value)}catch{}if(value==='granted')start();else window.gtag?.('consent','update',{analytics_storage:'denied'});panel.hidden=true;}
function ready(){
// The main homepage already has its own consent interface.
if(document.getElementById('consent')){if(preference()==='granted')start();return;}
panel=document.createElement('section');panel.setAttribute('aria-label','Preferenze statistiche');panel.style.cssText='position:fixed;bottom:90px;left:12px;right:12px;max-width:580px;margin:auto;padding:18px;background:#fff;color:#11142f;border:1px solid #ccc;border-radius:16px;box-shadow:0 5px 30px #0003;z-index:2147483000;font:15px/1.5 system-ui';
const p=document.createElement('p');p.textContent='Ci aiuti a migliorare IMC? Puoi consentire a Google Analytics di misurare le visite e le pagine consultate.';panel.append(p);
for(const [label,value] of [['Accetta statistiche','granted'],['Rifiuta','denied']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:10px 14px;margin:4px;border:1px solid #b69a48;border-radius:8px;background:white;color:#11142f;font:inherit;cursor:pointer';b.onclick=()=>choose(value);panel.append(b);}
document.body.append(panel);const saved=preference();panel.hidden=['granted','denied'].includes(saved);if(saved==='granted')start();
const settings=document.createElement('button');settings.type='button';settings.textContent='Privacy · statistiche';settings.style.cssText='display:block;margin:20px auto 100px;padding:8px;background:white;color:#45455a;border:1px solid #ccc;border-radius:8px;font:12px system-ui';settings.onclick=()=>{panel.hidden=false;panel.querySelector('button').focus()};document.body.append(settings);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('storage',e=>{if(e.key===key){if(e.newValue==='granted')start();else window.gtag?.('consent','update',{analytics_storage:'denied'});if(panel)panel.hidden=true;}});
})();
