(function(){
  "use strict";

  var cache=new Map();
  var loading=new Map();
  var scheduleCache=new Map();
  var resultCache=new Map();
  var timer=null;

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
      if(char==="&")return "&amp;";
      if(char==="<")return "&lt;";
      if(char===">")return "&gt;";
      if(char==='"')return "&quot;";
      return "&#39;";
    });
  }

  function formatDate(value){
    var raw=clean(value);
    var match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match?match[3]+"/"+match[2]+"/"+match[1]:raw;
  }

  function worldFromDom(){
    var node=document.querySelector(".nx-competitions-title p, .nx-competition-cover-copy p");
    var match=node&&clean(node.textContent).match(/GW\d{3}/i);
    return match?match[0].toUpperCase():"";
  }

  function tableForWorld(worldId){
    return String(worldId||"").toLowerCase()+"_gw_competitions";
  }

  function categoryForType(value){
    var key=clean(value).toLowerCase();
    if(key==="international")return "international";
    if(key==="nations")return "nations";
    if(key==="friendly")return "friendly";
    return "domestic";
  }

  function splitAliases(value){
    return clean(value).split("|").map(clean).filter(Boolean);
  }

  function internalCandidates(alias){
    var value=clean(alias);
    var out=[value];
    var match=value.match(/^(.*?)\s*League\s+Div\s+(\d+)$/i);
    if(match){
      var nation=clean(match[1]);
      out.push(nation?nation+" · Division "+match[2]:"Division "+match[2]);
    }
    match=value.match(/^(.*?)\s+(National Cup|League Cup|Charity Shield)$/i);
    if(match){
      var prefix=clean(match[1]);
      var base=clean(match[2]);
      out.push(prefix?prefix+" · "+base:base);
    }
    if(/^World Cup Qualifier$/i.test(value))out.push("World Cup Qualifying");
    return out;
  }

  function buildRegistry(rows){
    var aliases=[];
    var byInternal=new Map();
    (rows||[]).forEach(function(row){
      splitAliases(row.IMC_competition_alias).forEach(function(alias){
        var item={
          alias:alias,
          category:categoryForType(row.IMC_competition_type),
          division:clean(row.IMC_league_divisions),
          source:clean(row.sm_competition_name),
          action:clean(row.sm_action)
        };
        aliases.push(item);
        internalCandidates(alias).forEach(function(candidate){
          byInternal.set(norm(candidate),item);
        });
      });
    });
    return {aliases:aliases,byInternal:byInternal};
  }

  function loadRegistry(worldId){
    if(cache.has(worldId))return Promise.resolve(cache.get(worldId));
    if(loading.has(worldId))return loading.get(worldId);
    var client=window.__IMC_BETA_CLIENT__;
    if(!client)return Promise.resolve(null);

    var request=client
      .from(tableForWorld(worldId))
      .select("sm_competition_name,sm_action,IMC_competition_type,IMC_league_divisions,IMC_competition_alias")
      .then(function(result){
        if(result.error)throw result.error;
        var registry=buildRegistry(result.data||[]);
        cache.set(worldId,registry);
        loading.delete(worldId);
        return registry;
      })
      .catch(function(error){
        loading.delete(worldId);
        console.error("Nexus beta competition source",error);
        return null;
      });

    loading.set(worldId,request);
    return request;
  }

  function matchTile(registry,button){
    var id=clean(button.getAttribute("data-comp-id"));
    var item=registry.byInternal.get(norm(id));
    if(item)return item;

    var strong=button.querySelector(".nx-comp-tile-copy strong");
    var small=button.querySelector(".nx-comp-tile-copy small");
    var name=strong?clean(strong.textContent):"";
    var nation=small?clean(small.textContent):"";
    var candidates=[name,nation&&name?nation+" · "+name:""];
    for(var i=0;i<candidates.length;i+=1){
      item=registry.byInternal.get(norm(candidates[i]));
      if(item)return item;
    }
    return null;
  }

  function updateSummary(registry){
    var active=document.querySelector("[data-competition-category].active");
    var category=active?clean(active.getAttribute("data-competition-category")):"domestic";
    var counts={domestic:0,international:0,nations:0};
    registry.aliases.forEach(function(item){
      if(Object.prototype.hasOwnProperty.call(counts,item.category))counts[item.category]+=1;
    });
    var total=counts.domestic+counts.international+counts.nations;
    var summary=document.querySelector(".nx-competition-summary span");
    if(summary){
      var label=category==="international"?"International":(category==="nations"?"Nations":"Domestic");
      summary.innerHTML=label+": <strong>"+(counts[category]||0)+"</strong> · Totale: <strong>"+total+"</strong>";
    }
  }

  function applyIndex(registry){
    var root=document.getElementById("worldCompetitionsContent");
    if(!root)return;
    var buttons=Array.prototype.slice.call(root.querySelectorAll(".nx-comp-tile[data-comp-id]"));
    buttons.forEach(function(button){
      var item=matchTile(registry,button);
      if(!item){
        button.remove();
        return;
      }
      var strong=button.querySelector(".nx-comp-tile-copy strong");
      if(strong)strong.textContent=item.alias;
    });

    root.querySelectorAll(".nx-nation-competition-box").forEach(function(section){
      if(!section.querySelector(".nx-comp-tile[data-comp-id]"))section.remove();
    });

    var grid=root.querySelector(".nx-competition-filtered-grid");
    if(grid&&!root.querySelector(".nx-comp-tile[data-comp-id]")){
      grid.innerHTML='<div class="nx-empty-box"><strong>Nessuna competizione trovata</strong><span>Nessuna competizione presente nel repository del Game World.</span></div>';
    }
    updateSummary(registry);
  }

  function detailCandidates(title){
    var value=clean(title);
    var out=[value];
    var words={one:"1",two:"2",three:"3",four:"4",five:"5"};
    var match=value.match(/^(.*?)\s*Division\s+(One|Two|Three|Four|Five|\d+)$/i);
    if(match){
      var nation=clean(match[1]).replace(/·\s*$/g,"").trim();
      var number=words[String(match[2]).toLowerCase()]||match[2];
      out.push(nation?nation+" · Division "+number:"Division "+number);
    }
    return out;
  }

  function matchDetail(registry,title){
    var candidates=detailCandidates(title);
    for(var i=0;i<candidates.length;i+=1){
      var item=registry.byInternal.get(norm(candidates[i]));
      if(item)return item;
    }
    return null;
  }

  function applyDetail(registry){
    var title=document.querySelector(".nx-competition-cover-copy h1");
    if(!title)return;
    if(!title.dataset.betaSourceName)title.dataset.betaSourceName=clean(title.textContent);
    var item=matchDetail(registry,title.dataset.betaSourceName);
    if(!item){
      var back=document.getElementById("backToCompetitions");
      if(back)back.click();
      return;
    }
    title.textContent=item.alias;
  }

  function divisionNumberFromTitle(value){
    var numeric=clean(value).match(/(?:League\s+Div|Division)\s+(\d+)/i);
    if(numeric)return Number(numeric[1]);
    var word=clean(value).match(/Division\s+(One|Two|Three|Four|Five)/i);
    if(!word)return 0;
    var map={one:1,two:2,three:3,four:4,five:5};
    return map[String(word[1]).toLowerCase()]||0;
  }

  function tabContext(registry,tabName){
    if(worldFromDom()!=="GW005")return null;
    var divisionTab=document.querySelector('[data-div-tab="'+tabName+'"].active, [data-division-tab="'+tabName+'"].active');
    var competitionTab=document.querySelector('[data-comp-tab="'+tabName+'"].active, [data-competition-tab="'+tabName+'"].active');
    var active=divisionTab||competitionTab;
    if(!active)return null;
    var section=active.closest("section");
    if(!section)return null;
    var title=section.querySelector(".nx-competition-cover-copy h1");
    var target=divisionTab?section.querySelector("#divisionContent"):section.querySelector("#competitionContent");
    if(!title||!target)return null;
    var sourceName=clean(title.dataset.betaSourceName||title.textContent);
    var displayName=clean(title.textContent);

    if(divisionTab){
      var division=divisionNumberFromTitle(sourceName)||divisionNumberFromTitle(displayName);
      if(!division)return null;
      return {target:target,action:"league",division:String(division),label:"League Div "+division};
    }

    var item=matchDetail(registry,sourceName)||matchDetail(registry,displayName);
    if(!item||!item.action)return null;
    return {target:target,action:item.action,division:null,label:item.alias||displayName};
  }

  function scheduleMarkup(rows,context){
    if(!rows.length){
      return '<div class="nx-beta-schedule-source"><div class="nx-empty-box"><strong>Nessuna schedule disponibile</strong><span>Nessuna data presente in gw005_schedule per '+esc(context.label)+'.</span></div></div>';
    }
    return '<div class="nx-beta-schedule-source">'+rows.map(function(row){
      var round=clean(row.sm_round_label);
      return '<article class="nx-beta-schedule-row"><div class="nx-unified-matchday-head"><div>'+
        (round?'<small>'+esc(round.toUpperCase())+'</small>':'')+
        '<strong>'+esc(formatDate(row.match_date))+'</strong></div></div></article>';
    }).join("")+'</div>';
  }

  function loadScheduleRows(context){
    var key=context.action+"|"+(context.division||"");
    if(scheduleCache.has(key))return Promise.resolve(scheduleCache.get(key));
    var client=window.__IMC_BETA_CLIENT__;
    if(!client)return Promise.resolve([]);
    var query=client.from("gw005_schedule")
      .select("schedule_id,match_date,sm_action,sm_division,sm_country,sm_compid,sm_round_label")
      .eq("game_world_id","GW005")
      .eq("sm_action",context.action);
    if(context.division!=null)query=query.eq("sm_division",context.division);
    return query.order("match_date",{ascending:true}).then(function(result){
      if(result.error)throw result.error;
      var rows=result.data||[];
      scheduleCache.set(key,rows);
      return rows;
    });
  }

  function applySchedule(registry){
    var context=tabContext(registry,"schedule");
    if(!context)return;
    var key=context.action+"|"+(context.division||"")+"|"+norm(context.label);
    if(context.target.dataset.betaScheduleLoading===key)return;
    if(context.target.dataset.betaScheduleSource===key&&context.target.querySelector(".nx-beta-schedule-source"))return;
    context.target.dataset.betaScheduleLoading=key;
    loadScheduleRows(context).then(function(rows){
      var latest=tabContext(registry,"schedule");
      if(!latest||latest.target!==context.target)return;
      context.target.innerHTML=scheduleMarkup(rows,context);
      context.target.dataset.betaScheduleSource=key;
      delete context.target.dataset.betaScheduleLoading;
    }).catch(function(error){
      context.target.innerHTML='<div class="nx-empty-box"><strong>Errore schedule</strong><span>'+esc(error&&error.message?error.message:"Impossibile leggere gw005_schedule.")+'</span></div>';
      delete context.target.dataset.betaScheduleLoading;
    });
  }

  function resultScore(row){
    var score=esc(row.home_score)+" - "+esc(row.away_score);
    if(row.decided_on_penalties&&row.home_penalties!=null&&row.away_penalties!=null){
      score+='<small class="nx-beta-penalties"> ('+esc(row.home_penalties)+'-'+esc(row.away_penalties)+' rig.)</small>';
    }
    return score;
  }

  function resultMarkup(rows,context){
    if(!rows.length){
      return '<div class="nx-beta-results-source"><div class="nx-empty-box"><strong>Nessun risultato disponibile</strong><span>Nessun risultato presente in gw005_results per '+esc(context.label)+'.</span></div></div>';
    }

    var groups=[];
    var byKey=new Map();
    rows.forEach(function(row){
      var round=clean(row.sm_round_label);
      var key=clean(row.source_page_date)+"|"+round;
      if(!byKey.has(key)){
        var group={date:row.source_page_date,round:round,rows:[]};
        byKey.set(key,group);
        groups.push(group);
      }
      byKey.get(key).rows.push(row);
    });

    return '<div class="nx-beta-results-source">'+groups.map(function(group){
      var round=clean(group.round);
      return '<section class="nx-beta-result-group">'+
        '<div class="nx-unified-matchday-head"><div>'+
          (round?'<small>'+esc(round.toUpperCase())+'</small>':'')+
          '<strong>'+esc(formatDate(group.date))+'</strong></div><span>'+group.rows.length+' partite</span></div>'+
        '<div class="nx-entity-match-list">'+group.rows.map(function(row){
          return '<div class="nx-entity-match nx-beta-result-row"><div class="match-line">'+
            '<span class="nx-beta-team nx-beta-home">'+esc(row.home_name)+'</span>'+
            '<span class="match-score">'+resultScore(row)+'</span>'+
            '<span class="nx-beta-team nx-beta-away">'+esc(row.away_name)+'</span>'+
          '</div></div>';
        }).join("")+'</div></section>';
    }).join("")+'</div>';
  }

  function loadResultRows(context){
    var key=context.action+"|"+(context.division||"");
    if(resultCache.has(key))return Promise.resolve(resultCache.get(key));
    var client=window.__IMC_BETA_CLIENT__;
    if(!client)return Promise.resolve([]);
    var query=client.from("gw005_results")
      .select("raw_match_id,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,home_penalties,away_penalties,decided_on_penalties,sm_action,sm_division,sm_country,sm_compid,sm_round_label")
      .eq("game_world_id","GW005")
      .eq("sm_action",context.action);
    if(context.division!=null)query=query.eq("sm_division",context.division);
    return query.order("source_page_date",{ascending:false}).order("raw_match_id",{ascending:true}).then(function(result){
      if(result.error)throw result.error;
      var rows=result.data||[];
      resultCache.set(key,rows);
      return rows;
    });
  }

  function applyResults(registry){
    var context=tabContext(registry,"results");
    if(!context)return;
    var key=context.action+"|"+(context.division||"")+"|"+norm(context.label);
    if(context.target.dataset.betaResultsGw005Loading===key)return;
    if(context.target.dataset.betaResultsGw005Source===key&&context.target.querySelector(".nx-beta-results-source"))return;
    context.target.dataset.betaResultsGw005Loading=key;
    loadResultRows(context).then(function(rows){
      var latest=tabContext(registry,"results");
      if(!latest||latest.target!==context.target)return;
      context.target.innerHTML=resultMarkup(rows,context);
      context.target.dataset.betaResultsGw005Source=key;
      delete context.target.dataset.betaResultsGw005Loading;
    }).catch(function(error){
      context.target.innerHTML='<div class="nx-empty-box"><strong>Errore risultati</strong><span>'+esc(error&&error.message?error.message:"Impossibile leggere gw005_results.")+'</span></div>';
      delete context.target.dataset.betaResultsGw005Loading;
    });
  }

  function run(){
    var worldId=worldFromDom();
    if(!worldId)return;
    loadRegistry(worldId).then(function(registry){
      if(!registry)return;
      if(document.getElementById("worldCompetitionsContent"))applyIndex(registry);
      applyDetail(registry);
      applyResults(registry);
      applySchedule(registry);
    });
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(run,20);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
