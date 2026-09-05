(function(){
  "use strict";

  if(window.__IMC_MATCHDAY_DISABLED__) return;
  window.__IMC_MATCHDAY_DISABLED__=true;

  function emptyQuery(){
    var response={data:[],error:null,count:0,status:200,statusText:"OK"};
    var chain;
    var methods=new Set([
      "select","insert","upsert","update","delete",
      "eq","neq","gt","gte","lt","lte","like","ilike","is","in","contains","containedBy",
      "rangeGt","rangeGte","rangeLt","rangeLte","rangeAdjacent","overlaps","textSearch","match","not","or",
      "filter","order","limit","range","abortSignal","rollback","explain","csv","geojson"
    ]);

    chain=new Proxy({}, {
      get:function(_,prop){
        if(prop==="then") return function(resolve,reject){return Promise.resolve(response).then(resolve,reject);};
        if(prop==="catch") return function(reject){return Promise.resolve(response).catch(reject);};
        if(prop==="finally") return function(handler){return Promise.resolve(response).finally(handler);};
        if(prop==="single" || prop==="maybeSingle"){
          return function(){return Promise.resolve({data:null,error:null,count:0,status:200,statusText:"OK"});};
        }
        if(methods.has(prop)) return function(){return chain;};
        return undefined;
      }
    });
    return chain;
  }

  function wrapSupabase(){
    if(!window.supabase || typeof window.supabase.createClient!=="function") return false;
    if(window.supabase.createClient.__imcNoMatchdayWrapped) return true;

    var originalCreateClient=window.supabase.createClient.bind(window.supabase);
    function wrappedCreateClient(){
      var client=originalCreateClient.apply(null,arguments);
      if(client && typeof client.from==="function"){
        var originalFrom=client.from.bind(client);
        client.from=function(table){
          if(String(table)==="gw_season_matchdays") return emptyQuery();
          return originalFrom(table);
        };
      }
      return client;
    }

    wrappedCreateClient.__imcNoMatchdayWrapped=true;
    window.supabase.createClient=wrappedCreateClient;
    return true;
  }

  function installStyle(){
    if(document.getElementById("imc-no-matchday-style")) return;
    var style=document.createElement("style");
    style.id="imc-no-matchday-style";
    style.textContent="#matchdayControl,.nx-md-control,.nx-matchday-registry-progress{display:none!important}";
    document.head.appendChild(style);
  }

  function removeMatchdayLabels(root){
    (root||document).querySelectorAll(".nx-unified-matchday-head small").forEach(function(node){
      var text=String(node.textContent||"").replace(/\s+/g," ").trim();
      if(/^(MATCH|MATCHDAY)\s*\d+$/i.test(text)) node.remove();
    });
  }

  installStyle();

  if(!wrapSupabase()){
    var attempts=0;
    var timer=setInterval(function(){
      attempts+=1;
      if(wrapSupabase() || attempts>=100) clearInterval(timer);
    },10);
  }

  function cleanUi(){removeMatchdayLabels(document);}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",cleanUi,{once:true});
  else cleanUi();

  new MutationObserver(cleanUi).observe(document.documentElement,{childList:true,subtree:true});
})();
