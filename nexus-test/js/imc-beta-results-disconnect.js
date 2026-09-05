(function(){
  "use strict";

  if(window.__IMC_BETA_RESULTS_DISCONNECTED__) return;
  if(!window.supabase || typeof window.supabase.createClient !== "function") return;

  window.__IMC_BETA_RESULTS_DISCONNECTED__ = true;

  var originalCreateClient = window.supabase.createClient.bind(window.supabase);
  window.__IMC_BETA_ORIGINAL_CREATE_CLIENT__ = originalCreateClient;

  function emptySelectQuery(){
    var response = {
      data: [],
      error: null,
      count: 0,
      status: 200,
      statusText: "OK"
    };

    var chain = null;
    var methods = new Set([
      "eq","neq","gt","gte","lt","lte","like","ilike","is","in","contains","containedBy",
      "rangeGt","rangeGte","rangeLt","rangeLte","rangeAdjacent","overlaps","textSearch","match","not","or",
      "filter","order","limit","range","abortSignal","rollback","explain","csv","geojson"
    ]);

    chain = new Proxy({}, {
      get:function(_,prop){
        if(prop === "then"){
          return function(resolve,reject){
            return Promise.resolve(response).then(resolve,reject);
          };
        }
        if(prop === "catch"){
          return function(reject){
            return Promise.resolve(response).catch(reject);
          };
        }
        if(prop === "finally"){
          return function(handler){
            return Promise.resolve(response).finally(handler);
          };
        }
        if(prop === "single" || prop === "maybeSingle"){
          return function(){
            return Promise.resolve({data:null,error:null,count:0,status:200,statusText:"OK"});
          };
        }
        if(methods.has(prop)){
          return function(){ return chain; };
        }
        return undefined;
      }
    });

    return chain;
  }

  window.supabase.createClient = function(){
    var client = originalCreateClient.apply(null,arguments);
    var originalFrom = client.from.bind(client);

    client.from = function(table){
      var builder = originalFrom(table);
      if(String(table) !== "gw_matches") return builder;

      return new Proxy(builder,{
        get:function(target,prop,receiver){
          if(prop === "select"){
            return function(){
              return emptySelectQuery();
            };
          }

          var value = Reflect.get(target,prop,receiver);
          if(typeof value === "function") return value.bind(target);
          return value;
        }
      });
    };

    window.__IMC_BETA_CLIENT__ = client;
    return client;
  };
})();
