(function(){
  "use strict";

  var API_URL="https://toanuzojdkfjgucztpze.supabase.co/functions/v1/nexus-beta-match-report";
  var API_KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
  var reports=[];
  var ready=false;
  var timer=null;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}

  function fetchIndex(){
    return fetch(API_URL,{method:"POST",headers:{"content-type":"application/json","apikey":API_KEY},body:JSON.stringify({action:"index"})})
      .then(function(res){return res.json().catch(function(){return {};}).then(function(body){if(!res.ok||!body.ok)throw new Error(body.detail||body.error||("HTTP "+res.status));return body.matches||[];});});
  }

  function teams(row){
    var els=row.querySelectorAll(".nx-league-team-link,.nx-cup-team-link");
    if(els.length<2)return null;
    return {home:clean(els[0].getAttribute("data-match-entity-name")||els[0].textContent),away:clean(els[1].getAttribute("data-match-entity-name")||els[1].textContent)};
  }

  function score(row){
    var el=row.querySelector(".nx-league-score-pill strong,.nx-cup-score-pill strong");
    var m=el&&clean(el.textContent).match(/(\d+)\s*-\s*(\d+)/);
    return m?{home:Number(m[1]),away:Number(m[2])}:null;
  }

  function reportFor(row){
    var t=teams(row),s=score(row);
    if(!t||!s)return null;
    var found=reports.filter(function(r){
      var hn=[r.home_display_name,r.home_team_name].map(norm);
      var an=[r.away_display_name,r.away_team_name].map(norm);
      return hn.indexOf(norm(t.home))!==-1&&an.indexOf(norm(t.away))!==-1&&Number(r.home_score)===s.home&&Number(r.away_score)===s.away;
    });
    return found.length===1?found[0]:null;
  }

  function scorerBox(row){
    var n=row.nextElementSibling;
    for(var i=0;n&&i<3;i++,n=n.nextElementSibling){if(/\bSCORERS\b/i.test(clean(n.textContent)))return n;}
    return null;
  }

  function addButton(row,report){
    if(row.dataset.nxMrButtonDone==="1")return;
    row.dataset.nxMrButtonDone="1";
    row.dataset.nxMrId=String(report.match_id);
    row.classList.add("nx-mr-enabled");
    var b=document.createElement("button");
    b.type="button";
    b.className="nx-mr-result-button";
    b.textContent="MATCH REPORT";
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();row.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));});
    var box=scorerBox(row);
    if(box)box.appendChild(b);else row.insertAdjacentElement("afterend",b);
  }

  function decorate(){
    if(!ready)return;
    document.querySelectorAll(".nx-league-result-row,.nx-cup-result-row").forEach(function(row){
      if(row.dataset.nxMrButtonDone==="1")return;
      var r=reportFor(row);
      if(r)addButton(row,r);
    });
  }

  function injectStyle(){
    if(document.getElementById("nxMrResultButtonStyle"))return;
    var s=document.createElement("style");
    s.id="nxMrResultButtonStyle";
    s.textContent=".nx-mr-result-button{display:block;width:100%;margin:10px 0 0;padding:11px 12px;border:0;border-top:1px solid #e3e8f0;background:transparent;color:#174b9b;font:900 10px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.11em;text-align:center}.nx-mr-result-button:active{opacity:.55}";
    document.head.appendChild(s);
  }

  function init(){
    injectStyle();
    fetchIndex().then(function(rows){reports=rows;ready=true;decorate();}).catch(function(err){console.error("Nexus Match Report button",err);});
    new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(decorate,80);}).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
(function(){
  "use strict";

  var cache={};
  var loading={};
  var timer=null;

  function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
  function norm(value){
    return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
      .replace(/\bdivision\s+one\b/g,"division 1")
      .replace(/\bdivision\s+two\b/g,"division 2")
      .replace(/\bdivision\s+three\b/g,"division 3")
      .replace(/\bdivision\s+four\b/g,"division 4")
      .replace(/\bdivision\s+five\b/g,"division 5")
      .replace(/[^a-z0-9]+/g," ").trim();
  }

  function worldIdFromPage(){
    var nodes=document.querySelectorAll(".nx-competitions-title p,.nx-competition-cover-copy p,.nx-page-title p");
    for(var i=0;i<nodes.length;i++){
      var match=clean(nodes[i].textContent).match(/GW\d{3}/i);
      if(match)return match[0].toUpperCase();
    }
    return "";
  }

  function kindInfo(value){
    var n=norm(value);
    var div=n.match(/(?:division|league\s+div)\s*([1-5])/);
    if(div)return {kind:"league",division:Number(div[1])};
    if(/national cup/.test(n))return {kind:"national_cup",division:null};
    if(/league cup|league shield/.test(n))return {kind:"league_cup",division:null};
    if(/charity shield/.test(n))return {kind:"charity_shield",division:null};
    if(/imc champions|smfa champions/.test(n))return {kind:"imc_champions",division:null};
    if(/imc shield|smfa shield/.test(n))return {kind:"imc_shield",division:null};
    if(/imc super cup|smfa super cup/.test(n))return {kind:"imc_super_cup",division:null};
    if(/world cup qualifying|world cup qualifier/.test(n))return {kind:"world_cup_qualifier",division:null};
    if(/world cup/.test(n))return {kind:"world_cup",division:null};
    if(/friendly|amichevol/.test(n))return {kind:"friendly",division:null};
    return {kind:"",division:null};
  }

  function aliasKind(alias,row){
    var info=kindInfo(alias);
    if(info.kind)return info;
    var div=clean(row&&row.IMC_league_divisions).match(/(\d+)/);
    if(div)return {kind:"league",division:Number(div[1])};
    return {kind:"",division:null};
  }

  function buildRegistry(worldId,rows,countries){
    var aliases=[];
    (rows||[]).forEach(function(row){
      clean(row.IMC_competition_alias).split("|").map(clean).filter(Boolean).forEach(function(alias){
        var info=aliasKind(alias,row);
        aliases.push({alias:alias,norm:norm(alias),kind:info.kind,division:info.division,row:row});
      });
    });

    var nationGroups=[];
    (countries||[]).forEach(function(row){
      var values=[row.country_name,row.area_sm,row.area_alias].map(clean).filter(Boolean);
      if(!values.length)return;
      var normalized=[];
      values.forEach(function(value){var n=norm(value);if(n&&normalized.indexOf(n)===-1)normalized.push(n);});
      nationGroups.push(normalized);
    });

    return {worldId:worldId,aliases:aliases,nationGroups:nationGroups};
  }

  function nationVariants(registry,nation){
    var n=norm(nation);
    if(!n)return [];
    for(var i=0;i<registry.nationGroups.length;i++){
      if(registry.nationGroups[i].indexOf(n)!==-1)return registry.nationGroups[i].slice();
    }
    return [n];
  }

  function nationFromCandidate(value){
    var raw=clean(value);
    var parts=raw.split("·");
    if(parts.length>1)return clean(parts[0]);
    var n=raw.match(/^(.+?)\s+(?:League\s+Div\s+[1-5]|National\s+Cup|League\s+Cup|Charity\s+Shield)$/i);
    return n?clean(n[1]):"";
  }

  function resolveAlias(registry,candidate,display,nation){
    if(!registry)return "";
    var original=clean(candidate)||clean(display);
    var current=clean(display)||original;
    var info=kindInfo(original+" "+current);
    var nationName=clean(nation)||nationFromCandidate(original)||nationFromCandidate(current);
    var variants=nationVariants(registry,nationName);
    var originalNorm=norm(original),currentNorm=norm(current);
    var best=null,bestScore=-1;

    registry.aliases.forEach(function(item){
      var score=0;
      if(item.norm===originalNorm||item.norm===currentNorm)score+=1000;
      if(info.kind&&item.kind===info.kind)score+=200;else if(info.kind)return;
      if(info.division!=null){if(item.division===info.division)score+=120;else return;}
      if(variants.length){
        var nationMatch=variants.some(function(v){return item.norm===v||item.norm.indexOf(v+" ")===0||item.norm.indexOf(" "+v+" ")!==-1;});
        if(nationMatch)score+=300;else if(registry.nationGroups.length)return;
      }
      if(score>bestScore){bestScore=score;best=item.alias;}
    });

    return bestScore>0?best:"";
  }

  function loadRegistry(worldId){
    if(cache[worldId])return Promise.resolve(cache[worldId]);
    if(loading[worldId])return loading[worldId];
    var client=window.__IMC_BETA_CLIENT__;
    if(!client)return Promise.reject(new Error("Client beta non disponibile"));
    var table=worldId.toLowerCase()+"_gw_competitions";
    loading[worldId]=Promise.all([
      client.from(table).select("sm_competition_name,IMC_competition_alias,IMC_competition_type,IMC_league_divisions,IMC_league_playoffs"),
      client.from("gw_league_countries").select("country_name,area_sm,area_alias").eq("game_world_id",worldId)
    ]).then(function(results){
      if(results[0].error)throw results[0].error;
      if(results[1].error)throw results[1].error;
      cache[worldId]=buildRegistry(worldId,results[0].data||[],results[1].data||[]);
      delete loading[worldId];
      return cache[worldId];
    }).catch(function(error){delete loading[worldId];throw error;});
    return loading[worldId];
  }

  function originalText(node){
    if(!node)return "";
    if(!node.dataset.nexusAliasOriginal)node.dataset.nexusAliasOriginal=clean(node.textContent);
    return node.dataset.nexusAliasOriginal;
  }

  function applyRegistry(registry){
    document.querySelectorAll(".nx-comp-tile").forEach(function(tile){
      var strong=tile.querySelector(".nx-comp-tile-copy strong");
      if(!strong)return;
      var box=tile.closest(".nx-nation-competition-box");
      var nation=box&&box.querySelector(".nx-nation-competition-head strong")?clean(box.querySelector(".nx-nation-competition-head strong").textContent):"";
      var candidate=clean(tile.getAttribute("data-comp-id"))||originalText(strong);
      var alias=resolveAlias(registry,candidate,originalText(strong),nation);
      if(alias)strong.textContent=alias;
    });

    var cover=document.querySelector(".nx-competition-cover-copy h1");
    if(cover){
      var coverOriginal=originalText(cover);
      var alias=resolveAlias(registry,coverOriginal,coverOriginal,"");
      if(alias)cover.textContent=alias;
    }

    document.querySelectorAll(".nx-unified-matchday-head small").forEach(function(node){
      var text=originalText(node);
      if(/group stage|knockout stage/i.test(text))return;
      var alias=resolveAlias(registry,text,text,"");
      if(alias)node.textContent=alias.toUpperCase();
    });
  }

  function refresh(){
    var worldId=worldIdFromPage();
    if(!worldId)return;
    loadRegistry(worldId).then(applyRegistry).catch(function(error){console.error("Nexus competition aliases",error);});
  }

  function init(){
    refresh();
    new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(refresh,40);}).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
