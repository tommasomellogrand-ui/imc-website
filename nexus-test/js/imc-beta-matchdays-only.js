(function(){
  "use strict";

  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(char){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];
    });
  }

  function stripResultsFromMatchdays(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll(".nx-league-matchday-card, .nx-cup-round-card").forEach(function(card){
      Array.prototype.slice.call(card.children).forEach(function(child){
        if(!child.classList.contains("nx-unified-matchday-head")){
          child.remove();
        }
      });
    });
  }

  function standingsContext(){
    var active=document.querySelector('[data-div-tab="standings"].active, [data-division-tab="standings"].active');
    if(!active)return null;
    var section=active.closest("section");
    if(!section)return null;
    var target=section.querySelector("#divisionContent");
    var title=section.querySelector(".nx-competition-cover-copy h1");
    var meta=section.querySelector(".nx-competition-cover-copy p");
    if(!target||!title||!meta)return null;
    var worldMatch=String(meta.textContent||"").match(/GW\d{3}/i);
    if(!worldMatch)return null;
    return {
      target:target,
      worldId:worldMatch[0].toUpperCase(),
      divisionName:String(title.textContent||"").trim()
    };
  }

  function zeroStandingsMarkup(rows,divisionName){
    return '<section class="nx-premium-standings">'+
      '<div class="nx-premium-standing-head"><div><small>'+esc(String(divisionName||"Division").toUpperCase())+' · STANDINGS</small><strong>0 / 0 GIORNATE GIOCATE</strong></div></div>'+
      '<div class="nx-premium-standing-scroll"><table class="nx-premium-standing-table nx-live-standing-table">'+
      '<thead><tr><th>#</th><th>CLUB</th><th>G</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>PT</th><th>FORMA</th></tr></thead><tbody>'+
      rows.map(function(row,index){
        return '<tr>'+
          '<td class="nx-standing-rank">'+(index+1)+'</td>'+
          '<td class="nx-standing-club-cell"><span class="nx-league-club-logo is-fallback">◈</span><div><strong>'+esc(row.name)+'</strong></div></td>'+
          '<td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td class="nx-standing-points">0</td><td><span class="nx-form-dots"></span></td>'+
        '</tr>';
      }).join("")+
      '</tbody></table></div></section>';
  }

  async function renderZeroStandings(){
    var context=standingsContext();
    var client=window.__IMC_BETA_CLIENT__;
    if(!context||!client)return;

    var key=context.worldId+"|"+context.divisionName;
    if(context.target.dataset.betaZeroStandings===key||context.target.dataset.betaZeroLoading===key)return;
    context.target.dataset.betaZeroLoading=key;

    try{
      var competitionResult=await client
        .from("gw_competitions")
        .select("competition_id,division_id,competition_name")
        .eq("game_world_id",context.worldId)
        .eq("competition_name",context.divisionName)
        .maybeSingle();
      if(competitionResult.error)throw competitionResult.error;

      var seasonResult=await client
        .from("gw_seasons")
        .select("season_id")
        .eq("game_world_id",context.worldId)
        .eq("season_status","current")
        .maybeSingle();
      if(seasonResult.error)throw seasonResult.error;

      var competition=competitionResult.data||null;
      var season=seasonResult.data||null;
      if(!competition||!season)throw new Error("Configurazione classifica non disponibile.");

      var query=client
        .from("gw_setup_team_divisions")
        .select("team_id,division_id,division_number,gw_teams!inner(team_id,team_name,display_name)")
        .eq("game_world_id",context.worldId)
        .eq("season_id",season.season_id);

      if(competition.division_id!=null){
        query=query.eq("division_id",competition.division_id);
      }else{
        var numberMatch=context.divisionName.match(/Division\s+(\d+)/i);
        if(numberMatch)query=query.eq("division_number",Number(numberMatch[1]));
      }

      var teamsResult=await query;
      if(teamsResult.error)throw teamsResult.error;

      var seen=new Set();
      var rows=[];
      (teamsResult.data||[]).forEach(function(item){
        var team=item.gw_teams;
        if(Array.isArray(team))team=team[0]||null;
        if(!team)return;
        var id=String(team.team_id||item.team_id||"");
        if(seen.has(id))return;
        seen.add(id);
        rows.push({
          id:id,
          name:String(team.display_name||team.team_name||("Team "+id)).trim()
        });
      });

      rows.sort(function(a,b){return a.name.localeCompare(b.name,"it",{sensitivity:"base"});});

      context.target.innerHTML=rows.length
        ? zeroStandingsMarkup(rows,context.divisionName)
        : '<div class="card"><div class="row-sub">Nessuna squadra configurata per questa divisione.</div></div>';
      context.target.dataset.betaZeroStandings=key;
    }catch(error){
      context.target.innerHTML='<div class="card"><div class="row-sub">Classifica a zero non disponibile: '+esc(error&&error.message?error.message:"errore configurazione")+'</div></div>';
    }finally{
      delete context.target.dataset.betaZeroLoading;
    }
  }

  function run(){
    stripResultsFromMatchdays(document);
    renderZeroStandings();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",run,{once:true});
  }else{
    run();
  }

  var timer=null;
  var observer=new MutationObserver(function(){
    clearTimeout(timer);
    timer=setTimeout(run,0);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
