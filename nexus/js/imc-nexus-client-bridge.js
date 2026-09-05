(function(){
"use strict";
if(window.__IMC_NEXUS_CLIENT__||!window.supabase)return;
let cfg=null;
try{cfg=JSON.parse(localStorage.getItem("imc_nexus_config")||"null");}catch(_){}
const url=cfg&&cfg.url?cfg.url:"https://toanuzojdkfjgucztpze.supabase.co";
const key=cfg&&cfg.key?cfg.key:"sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
window.__IMC_NEXUS_CLIENT__=window.supabase.createClient(url,key);
})();
