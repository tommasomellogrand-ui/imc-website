(function(){
  "use strict";

  if(window.__IMC_REPOSITORY_RESULTS_SCHEDULE__) return;
  window.__IMC_REPOSITORY_RESULTS_SCHEDULE__=true;

  var metaCache=new Map();
  var scheduleCache=new Map();
  var resultsCache=new Map();
  var timer=null;
  var clientTimer=null;
  var midnightTimer=null;
  var COUNTRY_COLUMN_WORLDS=new Set(["GW002","GW003","GW007","GW008"]);

  function clean(value){
    return String(value==null?"":value).replace(/\s+/g," ").trim();
  }

  function norm(value){
    return clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/[·]/g," ")
      .replace(/[^a-z0-9]+/g," ")
      .trim();
  }

  function esc(value){
    return clean(value).replace(/[&<>"']/g,function(char){
      if(char==="&") return "&amp;";
      if(char==="<") return "&lt;";
      if(char===">") return "&gt;";
      if(char==='"') return "&quot;";
      return "&#39;";
    });
  }

  function localIsoDate(){
    var now=new Date();
    var local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,10);
  }

  function formatDate(value){
    var raw=clean(value);
    var match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match?match[3]+"/"+match[2]+"/"+match[1]:raw;
  }

  function worldFromDom(){
    var nodes=document.querySelectorAll(".nx-competition-cover-copy p, .nx-competitions-title p, .nx-page-title p");
    for(var i=0;i<nodes.length;i+=1){
      var match=clean(nodes[i].textContent).match(/GW\d{3}/i);
      if(match) return match[0].toUpperCase();
    }
    return "";
  }

  function tableName(world,suffix){
    return clean(world).toLowerCase()+"_"+suffix;
  }

  function splitAliases(value){
    return clean(value).split("|").map(clean).filter(Boolean);
  }

  function divisionNumber(value){
    var numeric=clean(value).match(/(?:League\s+Div|Division)\s+(\d+)/i);
    if(numeric) return String(Number(numeric[1]));
    var word=clean(value).match(/Division\s+(One|Two|Three|Four|Five)/i);
    if(!word) return "";
    var map={one:1,two:2,three:3,four:4,five:5};
    return String(map[String(word[1]).toLowerCase()]||"");
  }

  function countryPrefixFromAlias(alias){
    var text=clean(alias);
    var patterns=[
      /\s+League\s+Div\s+\d+$/i,
      /\s+National\s+Cup$/i,
      /\s+League\s+Cup$/i,
      /\s+Charity\s+Shield$/i
    ];
    for(var i=0;i<patterns.length;i+=1){
      if(patterns[i].test(text)) return clean(text.replace(patterns[i],""));
    }
    return "";
  }

  function aliasTokens(value){
    return norm(value).split(" ").filter(Boolean);
  }

  function addCountryAlias(map,name,code){
    var key=norm(name);
    var value=clean(code);
    if(key&&value) map.set(key,value);
  }

  function buildCountryMap(world,registryRows){
    var map=new Map();

    var allCodes=[];
    (registryRows||[]).forEach(function(row){
      var codes=clean(row.countries).split(",").map(clean).filter(Boolean);
      var aliases=splitAliases(row.IMC_competition_alias);
      if(codes.length>1&&codes.length===aliases.length){
        codes.forEach(function(code,index){
          if(allCodes.indexOf(code)<0) allCodes.push(code);
          var prefix=countryPrefixFromAlias(aliases[index]);
          if(prefix) addCountryAlias(map,prefix,code);
        });
      }
    });

    var prefixes=[];
    (registryRows||[]).forEach(function(row){
      splitAliases(row.IMC_competition_alias).forEach(function(alias){
        var prefix=countryPrefixFromAlias(alias);
        if(prefix&&prefixes.indexOf(prefix)<0) prefixes.push(prefix);
      });
    });

    prefixes.forEach(function(prefix){
      if(map.has(norm(prefix))) return;
      var prefixTokens=aliasTokens(prefix);
      var bestCode="";
      var bestScore=0;
      map.forEach(function(code,key){
        var targetTokens=key.split(" ");
        var score=prefixTokens.filter(function(token){return targetTokens.indexOf(token)>=0;}).length;
        if(score>bestScore){bestScore=score;bestCode=code;}
      });
      if(bestScore>0&&bestCode) addCountryAlias(map,prefix,bestCode);
    });

    var mappedCodes=new Set(Array.from(map.values()));
    var unmappedPrefixes=prefixes.filter(function(prefix){return !map.has(norm(prefix));});
    var remainingCodes=allCodes.filter(function(code){return !mappedCodes.has(code);});
    if(unmappedPrefixes.length===1&&remainingCodes.length===1){
      addCountryAlias(map,unmappedPrefixes[0],remainingCodes[0]);
    }

    return map;
  }

  function buildRegistry(rows,countryMap){
    var byName=new Map();
    (rows||[]).forEach(function(row){
      var source=clean(row.sm_competition_name);
      splitAliases(row.IMC_competition_alias).forEach(function(alias){
        var countryName=countryPrefixFromAlias(alias);
        var item={
          alias:alias,
          source:source,
          action:clean(row.sm_action),
          division:divisionNumber(alias)||divisionNumber(source),
          country:countryName&&countryMap?clean(countryMap.get(norm(countryName))):""
        };
        byName.set(norm(alias),item);
      });
      if(source&&!byName.has(norm(source))){
        byName.set(norm(source),{
          alias:splitAliases(row.IMC_competition_alias)[0]||source,
          source:source,
          action:clean(row.sm_action),
          division:divisionNumber(source),
          country:""
        });
      }
    });
    return byName;
  }

  function loadMeta(world){
    if(metaCache.has(world)) return Promise.resolve(metaCache.get(world));
    var client=window.__IMC_NEXUS_CLIENT__;
    if(!client) return Promise.resolve(null);

    var compSelect="sm_competition_name,sm_action,IMC_competition_alias";
    if(COUNTRY_COLUMN_WORLDS.has(world)) compSelect+=",countries";

    return client.from(tableName(world,"gw_competitions")).select(compSelect).then(function(result){
      if(result.error) throw result.error;
      var rows=result.data||[];
      var countryMap=buildCountryMap(world,rows);
      var meta={registry:buildRegistry(rows,countryMap),countryMap:countryMap};
      metaCache.set(world,meta);
      return meta;
    }).catch(function(error){
      console.error("Nexus repository metadata",world,error);
      return null;
    });
  }

  function activeTarget(tabName){
    var divTab=document.querySelector('[data-div-tab="'+tabName+'"].active');
    if(divTab){
      return {kind:"division",target:document.getElementById("divisionContent")};
    }
    var compTab=document.querySelector('[data-comp-tab="'+tabName+'"].active, [data-competition-tab="'+tabName+'"].active');
    if(compTab){
      return {kind:"competition",target:document.getElementById("competitionContent")};
    }
    return null;
  }

  function tabContext(world,meta,tabName){
    var active=activeTarget(tabName);
    if(!active||!active.target||!meta) return null;
    var titleNode=document.querySelector(".nx-competition-cover-copy h1");
    if(!titleNode) return null;
    var title=clean(titleNode.textContent);
    var item=meta.registry.get(norm(title))||null;

    if(active.kind==="division"){
      var division=item&&item.division?item.division:divisionNumber(title);
      if(!division) return null;
      return {
        world:world,
        target:active.target,
        action:item&&item.action?item.action:"league",
        division:division,
        country:item&&item.country?item.country:"",
        label:item&&item.alias?item.alias:title
      };
    }

    if(!item||!item.action) return null;
    return {
      world:world,
      target:active.target,
      action:item.action,
      division:item.division||"",
      country:item.country||"",
      label:item.alias||title
    };
  }

  function cacheKey(context){
    return [context.world,context.action,context.division||"",context.country||""].join("|");
  }

  function applyContextFilters(query,context){
    query=query.eq("game_world_id",context.world).eq("sm_action",context.action);
    if(context.division) query=query.eq("sm_division",context.division);
    if(context.country) query=query.eq("sm_country",context.country);
    return query;
  }

  function loadScheduleRows(context){
    var key=cacheKey(context);
    if(scheduleCache.has(key)) return Promise.resolve(scheduleCache.get(key));
    var client=window.__IMC_NEXUS_CLIENT__;
    if(!client) return Promise.resolve([]);
    var query=client.from(tableName(context.world,"schedule"))
      .select("schedule_id,game_world_id,season_id,sm_fixture_id,match_date,home_team_id,home_name,away_team_id,away_name,sm_action,sm_division,sm_country,sm_compid,sm_round_label");
    query=applyContextFilters(query,context);
    return query.order("match_date",{ascending:true}).order("schedule_id",{ascending:true}).then(function(result){
      if(result.error) throw result.error;
      var rows=(result.data||[]).filter(function(row){
        return row.sm_fixture_id!=null&&clean(row.home_name)&&clean(row.away_name)&&clean(row.match_date);
      });
      scheduleCache.set(key,rows);
      return rows;
    });
  }

  function loadResultRows(context){
    var key=cacheKey(context);
    if(resultsCache.has(key)) return Promise.resolve(resultsCache.get(key));
    var client=window.__IMC_NEXUS_CLIENT__;
    if(!client) return Promise.resolve([]);
    var query=client.from(tableName(context.world,"results"))
      .select("raw_match_id,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,home_penalties,away_penalties,decided_on_penalties,sm_action,sm_division,sm_country,sm_compid,sm_round_label");
    query=applyContextFilters(query,context);
    return query.order("source_page_date",{ascending:false}).order("raw_match_id",{ascending:true}).then(function(result){
      if(result.error) throw result.error;
      var rows=result.data||[];
      resultsCache.set(key,rows);
      return rows;
    });
  }

  function matchScore(row){
    if(row.home_score==null||row.away_score==null) return "-";
    var score=esc(row.home_score)+" - "+esc(row.away_score);
    if(row.decided_on_penalties&&row.home_penalties!=null&&row.away_penalties!=null){
      score+=' <small>('+esc(row.home_penalties)+'-'+esc(row.away_penalties)+' rig.)</small>';
    }
    return score;
  }

  function matchRow(row,played){
    return '<div class="nx-entity-match nx-repository-fixture-row">'+
      '<div class="match-line">'+
        '<strong class="nx-repository-team">'+esc(row.home_name)+'</strong>'+
        '<span class="match-score">'+(played?matchScore(row):'-')+'</span>'+
        '<strong class="nx-repository-team">'+esc(row.away_name)+'</strong>'+
      '</div></div>';
  }

  function groupRows(rows,dateField){
    var groups=[];
    var map=new Map();
    (rows||[]).forEach(function(row){
      var date=clean(row[dateField]);
      var round=clean(row.sm_round_label);
      var key=date+"|"+round;
      if(!map.has(key)){
        var group={date:date,round:round,rows:[]};
        map.set(key,group);
        groups.push(group);
      }
      map.get(key).rows.push(row);
    });
    return groups;
  }

  function groupsMarkup(groups,played){
    if(!groups.length){
      return '<div class="nx-repository-results-schedule"><div class="nx-empty-box"><strong>Nessuna partita disponibile</strong></div></div>';
    }
    return '<div class="nx-repository-results-schedule">'+groups.map(function(group){
      return '<section class="nx-repository-date-group">'+
        '<div class="nx-schedule-day-head"><div>'+
          (group.round?'<small>'+esc(group.round.toUpperCase())+'</small>':'')+
          '<h2>'+esc(formatDate(group.date))+'</h2></div><span>'+group.rows.length+' partite</span></div>'+
        '<div class="nx-entity-match-list">'+group.rows.map(function(row){return matchRow(row,played);}).join("")+'</div>'+
      '</section>';
    }).join("")+'</div>';
  }

  function scheduleMarkup(rows){
    var today=localIsoDate();
    var visible=(rows||[]).filter(function(row){return clean(row.match_date)>=today;});
    visible.sort(function(a,b){
      var dateCompare=clean(a.match_date).localeCompare(clean(b.match_date));
      if(dateCompare) return dateCompare;
      return Number(a.schedule_id||0)-Number(b.schedule_id||0);
    });
    return groupsMarkup(groupRows(visible,"match_date"),false);
  }

  function resultsMarkup(scheduleRows,resultRows){
    var today=localIsoDate();
    var actual=(resultRows||[]).filter(function(row){return clean(row.source_page_date)<today;});
    var resultByFixture=new Map();
    actual.forEach(function(row){
      if(row.sm_fixture_id!=null) resultByFixture.set(String(row.sm_fixture_id),row);
    });

    var placeholders=(scheduleRows||[]).filter(function(row){
      return clean(row.match_date)<today&&!resultByFixture.has(String(row.sm_fixture_id));
    }).map(function(row){
      return {
        raw_match_id:null,
        sm_fixture_id:row.sm_fixture_id,
        source_page_date:row.match_date,
        home_name:row.home_name,
        away_name:row.away_name,
        home_score:null,
        away_score:null,
        home_penalties:null,
        away_penalties:null,
        decided_on_penalties:false,
        sm_round_label:row.sm_round_label
      };
    });

    var combined=actual.concat(placeholders);
    combined.sort(function(a,b){
      var dateCompare=clean(b.source_page_date).localeCompare(clean(a.source_page_date));
      if(dateCompare) return dateCompare;
      return Number(a.raw_match_id||a.sm_fixture_id||0)-Number(b.raw_match_id||b.sm_fixture_id||0);
    });
    return groupsMarkup(groupRows(combined,"source_page_date"),true);
  }

  function renderSchedule(world,meta){
    var context=tabContext(world,meta,"schedule");
    if(!context) return;
    var key=cacheKey(context);
    if(context.target.dataset.repositoryScheduleLoading===key) return;
    if(context.target.dataset.repositoryScheduleSource===key&&context.target.querySelector(".nx-repository-results-schedule")) return;
    context.target.dataset.repositoryScheduleLoading=key;
    loadScheduleRows(context).then(function(rows){
      var latest=tabContext(world,meta,"schedule");
      if(!latest||latest.target!==context.target) return;
      delete context.target.dataset.repositoryScheduleLoading;
      context.target.innerHTML=scheduleMarkup(rows);
      context.target.dataset.repositoryScheduleSource=key;
    }).catch(function(error){
      delete context.target.dataset.repositoryScheduleLoading;
      context.target.innerHTML='<div class="nx-empty-box"><strong>Nessuna partita disponibile</strong></div>';
      console.error("Nexus repository schedule",context.world,error);
    });
  }

  function renderResults(world,meta){
    var context=tabContext(world,meta,"results");
    if(!context) return;
    var key=cacheKey(context);
    if(context.target.dataset.repositoryResultsLoading===key) return;
    if(context.target.dataset.repositoryResultsSource===key&&context.target.querySelector(".nx-repository-results-schedule")) return;
    context.target.dataset.repositoryResultsLoading=key;
    Promise.all([loadScheduleRows(context),loadResultRows(context)]).then(function(values){
      var latest=tabContext(world,meta,"results");
      if(!latest||latest.target!==context.target) return;
      delete context.target.dataset.repositoryResultsLoading;
      context.target.innerHTML=resultsMarkup(values[0]||[],values[1]||[]);
      context.target.dataset.repositoryResultsSource=key;
    }).catch(function(error){
      delete context.target.dataset.repositoryResultsLoading;
      context.target.innerHTML='<div class="nx-empty-box"><strong>Nessuna partita disponibile</strong></div>';
      console.error("Nexus repository results",context.world,error);
    });
  }

  function run(){
    var world=worldFromDom();
    if(!/^GW\d{3}$/.test(world)) return;
    if(!window.__IMC_NEXUS_CLIENT__) return;
    loadMeta(world).then(function(meta){
      if(!meta) return;
      renderResults(world,meta);
      renderSchedule(world,meta);
    });
  }

  function scheduleRun(){
    clearTimeout(timer);
    timer=setTimeout(run,25);
  }

  function scheduleMidnightRefresh(){
    if(midnightTimer) clearTimeout(midnightTimer);
    var now=new Date();
    var next=new Date(now.getTime());
    next.setHours(0,1,0,0);
    if(next<=now) next.setDate(next.getDate()+1);
    midnightTimer=setTimeout(function(){
      document.querySelectorAll("#divisionContent,#competitionContent").forEach(function(target){
        delete target.dataset.repositoryScheduleSource;
        delete target.dataset.repositoryResultsSource;
      });
      scheduleRun();
      scheduleMidnightRefresh();
    },Math.max(1000,next.getTime()-now.getTime()));
  }

  function start(){
    scheduleRun();
    scheduleMidnightRefresh();
    new MutationObserver(scheduleRun).observe(document.documentElement,{childList:true,subtree:true});
    if(!window.__IMC_NEXUS_CLIENT__){
      var attempts=0;
      clientTimer=setInterval(function(){
        attempts+=1;
        if(window.__IMC_NEXUS_CLIENT__){
          clearInterval(clientTimer);
          clientTimer=null;
          scheduleRun();
        }else if(attempts>=200){
          clearInterval(clientTimer);
          clientTimer=null;
        }
      },50);
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
