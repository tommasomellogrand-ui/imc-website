(function(){
  "use strict";

  var API_URL="https://toanuzojdkfjgucztpze.supabase.co/functions/v1/nexus-beta-match-report";
  var API_KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";
  var indexRows=[];
  var indexLoaded=false;
  var indexLoading=false;
  var observer=null;
  var modal=null;
  var previousOverflow="";

  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];});
  }

  function norm(value){
    return String(value||"")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  }

  function api(action,payload){
    return fetch(API_URL,{
      method:"POST",
      headers:{"content-type":"application/json","apikey":API_KEY},
      body:JSON.stringify(Object.assign({action:action},payload||{}))
    }).then(function(res){
      return res.json().catch(function(){return {};}).then(function(body){
        if(!res.ok||!body.ok)throw new Error(body.detail||body.error||("HTTP "+res.status));
        return body;
      });
    });
  }

  function injectStyles(){
    if(document.getElementById("nxMatchReportBetaStyles"))return;
    var style=document.createElement("style");
    style.id="nxMatchReportBetaStyles";
    style.textContent=`
      .nx-mr-enabled{cursor:pointer;position:relative;transition:transform .12s ease,box-shadow .12s ease}
      .nx-mr-enabled:active{transform:scale(.995)}
      .nx-mr-enabled .nx-league-score-pill,.nx-mr-enabled .nx-cup-score-pill{box-shadow:0 0 0 1px rgba(36,91,178,.12),0 4px 12px rgba(25,62,120,.08)}
      .nx-mr-overlay{position:fixed;inset:0;z-index:999999;background:#f4f6fa;color:#101d37;overflow:auto;-webkit-overflow-scrolling:touch}
      .nx-mr-shell{min-height:100%;padding:0 0 calc(32px + env(safe-area-inset-bottom))}
      .nx-mr-top{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:42px minmax(0,1fr) 42px;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:rgba(255,255,255,.96);backdrop-filter:blur(18px);border-bottom:1px solid #e2e7ef}
      .nx-mr-back{width:40px;height:40px;border:0;border-radius:50%;background:#eef2f8;color:#0d2348;font-size:26px;line-height:1;cursor:pointer}
      .nx-mr-top-copy{text-align:center;min-width:0}.nx-mr-top-copy small{display:block;color:#7b8699;font-size:9px;font-weight:950;letter-spacing:.14em}.nx-mr-top-copy strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.nx-mr-top-spacer{width:40px}
      .nx-mr-body{width:min(760px,100%);margin:0 auto;padding:14px}
      .nx-mr-hero{padding:22px 16px 18px;border-radius:24px;background:linear-gradient(145deg,#071a3b,#123c76);color:#fff;box-shadow:0 16px 34px rgba(8,28,66,.18)}
      .nx-mr-meta{text-align:center;color:#d5def0;font-size:10px;font-weight:850;letter-spacing:.05em}.nx-mr-score-grid{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px;margin-top:18px}.nx-mr-team{text-align:center;min-width:0}.nx-mr-team strong{display:block;font-size:17px;line-height:1.08;font-weight:950;overflow-wrap:anywhere}.nx-mr-team small{display:block;margin-top:6px;color:#bdcbe3;font-size:9px;font-weight:750}.nx-mr-score{font-size:38px;line-height:1;font-weight:950;letter-spacing:-.05em;white-space:nowrap}.nx-mr-pen{text-align:center;margin-top:8px;color:#e4bc52;font-size:10px;font-weight:900}
      .nx-mr-scorers{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.15)}.nx-mr-scorers div{font-size:10px;line-height:1.45;color:#e5ebf6}.nx-mr-scorers div:last-child{text-align:right}
      .nx-mr-tabs{position:sticky;top:61px;z-index:4;display:flex;gap:7px;overflow-x:auto;margin:14px -14px 0;padding:10px 14px;background:rgba(244,246,250,.96);backdrop-filter:blur(14px);scrollbar-width:none}.nx-mr-tabs::-webkit-scrollbar{display:none}.nx-mr-tab{flex:0 0 auto;border:1px solid #dbe2ed;border-radius:999px;background:#fff;color:#68758c;padding:9px 13px;font:inherit;font-size:9px;font-weight:950;letter-spacing:.04em;cursor:pointer}.nx-mr-tab.is-active{background:#0d2858;border-color:#0d2858;color:#fff}
      .nx-mr-panel{display:none}.nx-mr-panel.is-active{display:block}.nx-mr-section{margin-top:13px;padding:17px;border:1px solid #e0e5ed;border-radius:20px;background:#fff;box-shadow:0 8px 24px rgba(16,34,70,.035)}.nx-mr-section-head small{display:block;color:#78849a;font-size:8px;font-weight:950;letter-spacing:.12em}.nx-mr-section-head h2{margin:4px 0 0;color:#0d1d3a;font-size:19px;line-height:1.08}.nx-mr-section-head p{margin:7px 0 0;color:#6f7b91;font-size:11px;line-height:1.5}
      .nx-mr-story{margin-top:13px;color:#24334e;font-size:13px;line-height:1.65}
      .nx-mr-mvp{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:13px;border-radius:15px;background:#fff8e5;border:1px solid #f0dda1}.nx-mr-mvp small{display:block;color:#9b7515;font-size:8px;font-weight:950;letter-spacing:.1em}.nx-mr-mvp strong{display:block;margin-top:3px;font-size:15px}.nx-mr-mvp b{font-size:22px;color:#8a6410}
      .nx-mr-stats{display:grid;gap:9px;margin-top:14px}.nx-mr-stat-row{display:grid;grid-template-columns:42px minmax(0,1fr) 42px;gap:9px;align-items:center}.nx-mr-stat-row b{font-size:13px;text-align:center}.nx-mr-stat-center{text-align:center}.nx-mr-stat-center span{display:block;color:#748096;font-size:8px;font-weight:900;letter-spacing:.05em}.nx-mr-bar{display:grid;grid-template-columns:var(--home,50%) var(--away,50%);height:5px;margin-top:5px;border-radius:999px;overflow:hidden;background:#e7ecf3}.nx-mr-bar i:first-child{background:#163d79}.nx-mr-bar i:last-child{background:#c9a33d}
      .nx-mr-timeline{display:grid;gap:9px;margin-top:14px}.nx-mr-event{display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:start;padding:10px 0;border-bottom:1px solid #edf0f5}.nx-mr-event:last-child{border-bottom:0}.nx-mr-minute{color:#1e4f92;font-size:11px;font-weight:950}.nx-mr-event-copy strong{display:block;font-size:12px}.nx-mr-event-copy span{display:block;margin-top:3px;color:#748096;font-size:10px;line-height:1.4}
      .nx-mr-lineup-team+.nx-mr-lineup-team{margin-top:18px;padding-top:18px;border-top:1px solid #e8ecf2}.nx-mr-lineup-title{display:flex;justify-content:space-between;gap:12px;align-items:center}.nx-mr-lineup-title strong{font-size:15px}.nx-mr-lineup-title span{color:#66738a;font-size:10px;font-weight:900}.nx-mr-player-list{display:grid;gap:7px;margin-top:11px}.nx-mr-player{display:grid;grid-template-columns:27px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px 10px;border-radius:13px;background:#f7f9fc}.nx-mr-player-slot{color:#8a95a7;font-size:9px;font-weight:900;text-align:center}.nx-mr-player-copy{min-width:0}.nx-mr-player-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}.nx-mr-player-copy span{display:block;margin-top:2px;color:#748096;font-size:8px}.nx-mr-rating{min-width:29px;padding:6px 7px;border-radius:9px;background:#153b75;color:#fff;text-align:center;font-size:11px;font-weight:950}.nx-mr-subhead{margin:13px 0 7px;color:#758197;font-size:8px;font-weight:950;letter-spacing:.1em}
      .nx-mr-tactic-team+.nx-mr-tactic-team{margin-top:18px;padding-top:18px;border-top:1px solid #e8ecf2}.nx-mr-tactic-title{display:flex;justify-content:space-between;align-items:end;gap:12px}.nx-mr-tactic-title strong{font-size:15px}.nx-mr-formation{color:#173e79;font-size:18px;font-weight:950}.nx-mr-tactic-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.nx-mr-tactic-grid div{padding:10px;border-radius:13px;background:#f7f9fc}.nx-mr-tactic-grid small{display:block;color:#808a9c;font-size:7px;font-weight:950;letter-spacing:.08em}.nx-mr-tactic-grid strong{display:block;margin-top:3px;font-size:10px;line-height:1.3}
      .nx-mr-commentary{display:grid;gap:9px;margin-top:13px}.nx-mr-comment{display:grid;grid-template-columns:38px 1fr;gap:9px;padding:10px 0;border-bottom:1px solid #edf0f5}.nx-mr-comment:last-child{border-bottom:0}.nx-mr-comment b{color:#1c4c91;font-size:10px}.nx-mr-comment p{margin:0;color:#34425a;font-size:11px;line-height:1.5}
      .nx-mr-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}.nx-mr-info div{padding:11px;border-radius:13px;background:#f7f9fc}.nx-mr-info small{display:block;color:#808a9c;font-size:7px;font-weight:950;letter-spacing:.08em}.nx-mr-info strong{display:block;margin-top:4px;font-size:10px;line-height:1.35}
      .nx-mr-loading,.nx-mr-error{margin-top:18px;padding:28px 18px;border-radius:20px;background:#fff;text-align:center;color:#6e7a90;font-size:12px;font-weight:800}.nx-mr-error{color:#a2362d;background:#fff7f6;border:1px solid #efccc7}
      @media(max-width:430px){.nx-mr-body{padding:11px}.nx-mr-hero{border-radius:21px;padding:19px 13px 16px}.nx-mr-score{font-size:32px}.nx-mr-team strong{font-size:14px}.nx-mr-tabs{margin-left:-11px;margin-right:-11px;padding-left:11px;padding-right:11px}.nx-mr-section{padding:14px;border-radius:18px}.nx-mr-section-head h2{font-size:17px}.nx-mr-info{grid-template-columns:1fr}.nx-mr-tactic-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function scoreFromRow(row){
    var el=row.querySelector(".nx-league-score-pill strong,.nx-cup-score-pill strong");
    if(!el)return null;
    var m=String(el.textContent||"").match(/(\d+)\s*-\s*(\d+)/);
    return m?{home:Number(m[1]),away:Number(m[2])}:null;
  }

  function rowTeams(row){
    var buttons=Array.prototype.slice.call(row.querySelectorAll(".nx-match-entity-link"));
    if(buttons.length<2)return null;
    return {home:String(buttons[0].textContent||"").trim(),away:String(buttons[1].textContent||"").trim()};
  }

  function competitionForRow(row){
    var block=row.closest(".nx-league-matchday-card,.nx-cup-round-card,.nx-matchday-block,.nx-knockout-match-card")||row.parentElement;
    var head=block&&block.querySelector(".nx-unified-matchday-head small");
    return head?String(head.textContent||"").trim():"";
  }

  function reportMatchesRow(report,teams,score,competition){
    if(!report||!teams||!score)return false;
    var homeNames=[report.home_display_name,report.home_team_name].map(norm);
    var awayNames=[report.away_display_name,report.away_team_name].map(norm);
    if(homeNames.indexOf(norm(teams.home))<0||awayNames.indexOf(norm(teams.away))<0)return false;
    if(Number(report.home_score)!==score.home||Number(report.away_score)!==score.away)return false;
    if(competition&&norm(report.competition_name)!==norm(competition))return false;
    return true;
  }

  function findReportForRow(row){
    var teams=rowTeams(row),score=scoreFromRow(row),competition=competitionForRow(row);
    if(!teams||!score)return null;
    var exact=indexRows.filter(function(r){return reportMatchesRow(r,teams,score,competition);});
    if(exact.length===1)return exact[0];
    var loose=indexRows.filter(function(r){return reportMatchesRow(r,teams,score,"");});
    return loose.length===1?loose[0]:null;
  }

  function annotateRows(){
    if(!indexLoaded)return;
    var rows=document.querySelectorAll(".nx-league-result-row,.nx-cup-result-row");
    rows.forEach(function(row){
      if(row.dataset.nxMrChecked==="1")return;
      var report=findReportForRow(row);
      row.dataset.nxMrChecked="1";
      if(!report)return;
      row.dataset.nxMrId=String(report.match_id);
      row.classList.add("nx-mr-enabled");
      row.setAttribute("title","Apri Match Report");
    });
  }

  function refreshAnnotations(){
    document.querySelectorAll("[data-nx-mr-checked]").forEach(function(el){delete el.dataset.nxMrChecked;});
    annotateRows();
  }

  function loadIndex(){
    if(indexLoaded||indexLoading)return;
    indexLoading=true;
    api("index").then(function(body){
      indexRows=body.matches||[];
      indexLoaded=true;
      annotateRows();
    }).catch(function(err){
      console.error("Nexus Beta Match Report index",err);
    }).finally(function(){indexLoading=false;});
  }

  function formatDate(value){
    if(!value)return "";
    var d=new Date(String(value)+"T12:00:00");
    if(isNaN(d.getTime()))return String(value);
    return new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"short",year:"numeric"}).format(d);
  }

  function number(value){return Number(value||0);}
  function sideItem(list,side){return (list||[]).find(function(x){return x.side===side;})||{};}
  function cleanComment(text,minute){
    var s=String(text||"").trim();
    if(minute!=null)s=s.replace(new RegExp("^\\s*"+String(minute)+"\\s*"),"");
    return s.trim();
  }
  function minuteLabel(row){
    if(row.minute==null)return "";
    return String(row.minute)+(row.stoppage_minute?"+"+row.stoppage_minute:"")+"’";
  }

  function scorerText(data,side){
    var row=(data.scorerHeaders||[]).find(function(x){return x.side===side;});
    return row&&row.scorer_header?String(row.scorer_header):"";
  }

  function matchStory(data){
    var r=data.report||{},home=sideItem(data.stats,"home"),away=sideItem(data.stats,"away");
    var winner=number(r.home_score)>number(r.away_score)?r.home_display_name:(number(r.away_score)>number(r.home_score)?r.away_display_name:null);
    var parts=[];
    if(winner)parts.push(esc(winner)+" chiude la partita sul "+esc(r.home_score)+"-"+esc(r.away_score)+".");
    else parts.push("La partita termina "+esc(r.home_score)+"-"+esc(r.away_score)+".");
    if(home.total_shots!=null&&away.total_shots!=null)parts.push("Tiri totali "+esc(home.total_shots)+"-"+esc(away.total_shots)+", con "+esc(home.shots_on_target||0)+"-"+esc(away.shots_on_target||0)+" nello specchio.");
    if(home.possession_pct!=null&&away.possession_pct!=null)parts.push("Possesso palla "+esc(home.possession_pct)+"%-"+esc(away.possession_pct)+"%.");
    var red=number(home.red_cards)+number(away.red_cards);
    if(red)parts.push("La gara registra "+red+" espuls"+(red===1?"ione":"ioni")+".");
    return parts.join(" ");
  }

  function keyEvents(data){
    return (data.events||[]).filter(function(e){
      var source=e.metadata&&e.metadata.source;
      return source==="scorer_header"||source==="lineup_marker";
    }).sort(function(a,b){return number(a.minute)-number(b.minute)||number(a.event_index)-number(b.event_index);});
  }

  function eventLabel(e){
    if(e.event_type==="goal")return (e.is_own_goal?"Autogol":"Gol")+(e.is_penalty?" su rigore":"");
    if(e.event_type==="yellow_card")return "Cartellino giallo";
    if(e.event_type==="red_card")return "Cartellino rosso";
    return e.event_type||"Evento";
  }

  function statsMarkup(data){
    var home=sideItem(data.stats,"home"),away=sideItem(data.stats,"away");
    var rows=[
      ["POSSESSO",home.possession_pct,away.possession_pct,"%"],
      ["TIRI",home.total_shots,away.total_shots,""],
      ["IN PORTA",home.shots_on_target,away.shots_on_target,""],
      ["CORNER",home.corners,away.corners,""],
      ["GIALLI",home.yellow_cards,away.yellow_cards,""],
      ["ROSSI",home.red_cards,away.red_cards,""]
    ];
    return rows.map(function(row){
      var a=number(row[1]),b=number(row[2]),total=a+b||1,ha=(a/total*100).toFixed(1),aa=(b/total*100).toFixed(1);
      return `<div class="nx-mr-stat-row"><b>${esc(row[1]==null?"-":row[1])}${row[3]}</b><div class="nx-mr-stat-center"><span>${row[0]}</span><div class="nx-mr-bar" style="--home:${ha}%;--away:${aa}%"><i></i><i></i></div></div><b>${esc(row[2]==null?"-":row[2])}${row[3]}</b></div>`;
    }).join("");
  }

  function timelineMarkup(data){
    var events=keyEvents(data);
    if(!events.length)return `<div class="nx-mr-story">Nessun evento sintetico disponibile.</div>`;
    return `<div class="nx-mr-timeline">${events.map(function(e){return `<div class="nx-mr-event"><div class="nx-mr-minute">${esc(minuteLabel(e))}</div><div class="nx-mr-event-copy"><strong>${esc(eventLabel(e))} · ${esc(e.primary_player_name||"")}</strong><span>${esc(e.side==="home"?(data.report.home_display_name||data.report.home_team_name):(e.side==="away"?(data.report.away_display_name||data.report.away_team_name):""))}</span></div></div>`;}).join("")}</div>`;
  }

  function playerLine(p){
    var annotations=[];
    if(number(p.goals))annot