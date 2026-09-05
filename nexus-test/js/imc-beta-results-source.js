(function(){
  "use strict";

  var timer=null;
  var cache=new Map();

  function clean(value){
    return String(value==null?"":value).replace(/\s+/g," ").trim();
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

  function divisionNumberFromTitle(title){
    var value=clean(title);
    var numeric=value.match(/(?:League\s+Div|Division)\s+(\d+)/i);
    if(numeric)return Number(numeric[1]);
    var word=value.match(/Division\s+(One|Two|Three|Four|Five)/i);
    if(!word)return 0;
    var map={one:1,two:2,three:3,four:4,five:5};
    return map[String(word[1]).toLowerCase()]||0;
  }

  function context(){
    var active=document.querySelector('[data-div-tab="results"].active, [data-division-tab="results"].active');
    if(!active)return null;
    var section=active.closest("section");
    if(!section)return null;
    var target=section.querySelector("#divisionContent");
    var title=section.querySelector(".nx-competition-cover-copy h1");
    var meta=section.querySelector(".nx-competition-cover-copy p");
    if(!target||!title||!meta)return null;
    var worldMatch=clean(meta.textContent).match(/GW\d{3}/i);
    if(!worldMatch)return null;
    var worldId=worldMatch[0].toUpperCase();
    if(worldId!=="GW004")return null;
    var sourceTitle=clean(title.dataset.betaSourceName||title.textContent);
    var divisionNumber=divisionNumberFromTitle(sourceTitle)||divisionNumberFromTitle(title.textContent);
    if(!divisionNumber||divisionNumber<1||divisionNumber>4)return null;
    return {target:target,worldId:worldId,divisionNumber:divisionNumber,displayName:clean(title.textContent)};
  }

  function scoreMarkup(row){
    var score=esc(row.home_score)+" - "+esc(row.away_score);
    if(row.decided_on_penalties&&row.home_penalties!=null&&row.away_penalties!=null){
      score+='<small class="nx-beta-penalties">('+esc(row.home_penalties)+'-'+esc(row.away_penalties)+' rig.)</small>';
    }
    return score;
  }

  function renderRows(rows,matchday){
    if(!rows.length){
      return '<div class="nx-empty-box"><strong>Nessun risultato disponibile</strong><span>Nessuna partita collegata al Match Report per questa divisione.</span></div>';
    }
    var date=rows[0].source_page_date||"";
    var label=matchday&&clean(matchday.label)?clean(matchday.label):(matchday&&matchday.matchday_number?"Match "+matchday.matchday_number:"Matchday");
    return '<section class="nx-beta-results-source">'+
      '<div class="nx-unified-matchday-head"><div><small>'+esc(label.toUpperCase())+'</small><strong>'+esc(formatDate(date))+'</strong></div><span>'+rows.length+' partite</span></div>'+
      '<div class="nx-entity-match-list">'+rows.map(function(row){
        return '<div class="nx-entity-match nx-beta-result-row">'+
          '<div class="match-line">'+
            '<span class="nx-beta-team nx-beta-home">'+esc(row.home_name)+'</span>'+
            '<span class="match-score">'+scoreMarkup(row)+'</span>'+
            '<span class="nx-beta-team nx-beta-away">'+esc(row.away_name)+'</span>'+
          '</div>'+
        '</div>';
      }).join("")+'</div></section>';
  }

  function loadDivision(divisionNumber){
    if(cache.has(divisionNumber))return Promise.resolve(cache.get(divisionNumber));
    var client=window.__IMC_BETA_CLIENT__;
    if(!client)return Promise.resolve(null);
    var sourceCompetition="Divisione "+divisionNumber;

    return client.from("gw004_match_reports")
      .select("sm_fixture_id,source_competition_name")
      .eq("source_competition_name",sourceCompetition)
      .then(function(reportResult){
        if(reportResult.error)throw reportResult.error;
        var reports=reportResult.data||[];
        var fixtureIds=Array.from(new Set(reports.map(function(row){return Number(row.sm_fixture_id);}).filter(Number.isFinite)));
        if(!fixtureIds.length)return {rows:[],matchday:null};

        return client.from("gw004_results")
          .select("raw_match_id,sm_fixture_id,source_page_date,home_name,away_name,home_score,away_score,home_penalties,away_penalties,decided_on_penalties")
          .in("sm_fixture_id",fixtureIds)
          .order("raw_match_id",{ascending:true})
          .then(function(resultResult){
            if(resultResult.error)throw resultResult.error;
            var rows=(resultResult.data||[]).filter(function(row){return fixtureIds.indexOf(Number(row.sm_fixture_id))!==-1;});
            if(!rows.length)return {rows:[],matchday:null};
            var date=rows[0].source_page_date;
            return client.from("gw_divisions")
              .select("division_id,division_level")
              .eq("game_world_id","GW004")
              .eq("division_level",divisionNumber)
              .maybeSingle()
              .then(function(divisionResult){
                if(divisionResult.error)throw divisionResult.error;
                var division=divisionResult.data||null;
                if(!division||!date)return {rows:rows,matchday:null};
                return client.from("gw_season_matchdays")
                  .select("matchday_number,label,match_date,division_id")
                  .eq("game_world_id","GW004")
                  .eq("division_id",division.division_id)
                  .eq("match_date",date)
                  .maybeSingle()
                  .then(function(matchdayResult){
                    if(matchdayResult.error)throw matchdayResult.error;
                    return {rows:rows,matchday:matchdayResult.data||null};
                  });
              });
          });
      })
      .then(function(payload){cache.set(divisionNumber,payload);return payload;})
      .catch(function(error){
        console.error("Nexus beta results source",error);
        return {rows:[],matchday:null,error:error};
      });
  }

  function run(){
    var ctx=context();
    if(!ctx)return;
    var key=ctx.worldId+"|"+ctx.divisionNumber;
    if(ctx.target.dataset.betaResultsSource===key||ctx.target.dataset.betaResultsLoading===key)return;
    ctx.target.dataset.betaResultsLoading=key;

    loadDivision(ctx.divisionNumber).then(function(payload){
      if(!context())return;
      if(payload&&payload.error){
        ctx.target.innerHTML='<div class="nx-empty-box"><strong>Errore risultati</strong><span>'+esc(payload.error.message||"Impossibile leggere i risultati.")+'</span></div>';
      }else{
        ctx.target.innerHTML=renderRows(payload?payload.rows:[],payload?payload.matchday:null);
      }
      ctx.target.dataset.betaResultsSource=key;
      delete ctx.target.dataset.betaResultsLoading;
    });
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(run,30);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
