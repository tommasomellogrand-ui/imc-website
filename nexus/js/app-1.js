
(function(){
  "use strict";

  const boot = document.getElementById("boot");
  const app = document.getElementById("app");

  const OFFICIAL_SINGLE_LEAGUE_CALENDARS = {
    GW001: {
      "2026-07-12":1,
      "2026-07-16":2,
      "2026-07-19":3,
      "2026-07-23":4,
      "2026-07-26":5,
      "2026-07-30":6,
      "2026-08-02":7,
      "2026-08-06":8,
      "2026-08-09":9,
      "2026-08-13":10,
      "2026-08-16":11,
      "2026-08-20":12,
      "2026-08-23":13,
      "2026-08-27":14,
      "2026-08-30":15,
      "2026-09-03":16,
      "2026-09-06":17,
      "2026-09-10":18
    }
  };

  const FALLBACK_GW004_CONFIG = {
    id: "GW004",
    name: "World League",
    season: 2,
    calendars: {
      singleLeague: {'2026-06-27':1,'2026-07-01':2,'2026-07-04':3,'2026-07-08':4,'2026-07-11':5,'2026-07-15':6,'2026-07-18':7,'2026-07-22':8,'2026-07-25':9,'2026-07-29':10,'2026-08-01':11,'2026-08-05':12,'2026-08-08':13,'2026-08-12':14,'2026-08-15':15,'2026-08-19':16,'2026-08-22':17,'2026-08-26':18,'2026-08-29':19,'2026-09-02':20,'2026-09-05':21,'2026-09-09':22,'2026-09-12':23,'2026-09-16':24,'2026-09-19':25,'2026-09-23':26,'2026-09-26':27,'2026-09-30':28,'2026-10-03':29,'2026-10-07':30,'2026-10-10':31,'2026-10-14':32,'2026-10-17':33,'2026-10-21':34,'2026-10-24':35,'2026-10-28':36,'2026-10-31':37,'2026-11-04':38},
      smfaChampionsGroups: {'2026-06-30':1,'2026-07-07':2,'2026-07-14':3,'2026-07-21':4,'2026-07-28':5,'2026-08-04':6},
      smfaShieldGroups: {'2026-06-30':1,'2026-07-07':2,'2026-07-14':3,'2026-07-21':4,'2026-07-28':5,'2026-08-04':6},
      worldCupQualifying: {'2026-07-03':1,'2026-07-10':2,'2026-07-24':3,'2026-08-07':4,'2026-08-21':5,'2026-09-04':6,'2026-09-18':7,'2026-10-02':8,'2026-10-16':9,'2026-10-30':10}
    },
    competitions: {
      "Division One": {calendar:"singleLeague",db:"Division 1",trophy:"assets/trophies/division-one.png",type:"league",category:"domestic",tabs:["results","standings","schedule"]},
      "Division Two": {calendar:"singleLeague",db:"Division 2",trophy:"assets/trophies/division-two.png",type:"league",category:"domestic",tabs:["results","standings","schedule"]},
      "Division Three": {calendar:"singleLeague",db:"Division 3",trophy:"assets/trophies/division-three.png",type:"league",category:"domestic",tabs:["results","standings","schedule"]},
      "Division Four": {calendar:"singleLeague",db:"Division 4",trophy:"assets/trophies/division-four.png",type:"league",category:"domestic",tabs:["results","standings","schedule"]},
       "National Cup": {db:"League Cup",trophy:"assets/trophies/national-cup.png",type:"knockout",category:"domestic",tabs:["results","schedule"]},
      "League Cup": {db:"League Shield",trophy:"assets/trophies/league-cup.png",type:"knockout",category:"domestic",tabs:["results","schedule"]},
      "Charity Shield": {db:"Charity Shield",trophy:"assets/trophies/charity-shield.png",type:"single_match",category:"domestic",tabs:["results","schedule"]},
      "SMFA Champions": {calendar:"smfaChampionsGroups",db:"SMFA Champions",trophy:"assets/trophies/smfa-champions.png",type:"group_and_knockout",category:"international",tabs:["results","schedule"]},
      "SMFA Shield": {calendar:"smfaShieldGroups",db:"SMFA Shield",trophy:"assets/trophies/smfa-shield.png",type:"group_and_knockout",category:"international",tabs:["results","schedule"]},
      "SMFA Super Cup": {db:"SMFA Super Cup",trophy:"assets/trophies/smfa-super-cup.png",type:"single_match",category:"international",tabs:["results","schedule"]},
      "World Cup Qualifying": {calendar:"worldCupQualifying",db:"World Cup Qualifying",trophy:"assets/trophies/world-cup-qualifying.png",type:"group_stage",category:"nations",participantType:"national_team",tabs:["results","schedule"]},
      "World Cup": {db:"World Cup",trophy:"assets/trophies/world-cup.png",type:"group_and_knockout",category:"nations",participantType:"national_team",tabs:["results","schedule"]}
    }
  };

  const state = {
    page: "login",
    worldTab: "overview",
    selectedWorld: null,
    selectedDivision: null,
    selectedCompetition: null,
    selectedClub: null,
    selectedNation: null,
    selectedManager: null,
    divisionTab: "results",
    competitionTab: "results",
    worldSection: "competitions",
    entityImcFilter: false,
    competitionFilter: "domestic",
    competitionSearchOpen: false,
    competitionNationOpen: false,
    competitionNationFilter: "all",
    competitionSearch: "",
    adminMode: false,
    adminPage: "home",
    adminRegistryManagers: [],
    adminRegistryMemberships: [],
    adminRegistryAssignments: [],
    adminRegistryAccounts: [],
    adminRegistryEditingId: null,
    adminRegistryCredentials: [],
    adminCompetitions: [],
    adminTrophies: [],
    adminTrophyEditingId: null,
    adminTrophyTeams: [],
    adminTrophyNations: [],
    adminTrophySeasons: [],
    adminGwSetupWorldId: "",
    adminGwSetupSeasons: [],
    adminGwSetupWorldSettings: null,
    adminGwSetupNations: [],
    adminGwSetupLeagues: [],
    adminGwSetupDivisions: [],
    adminGwSetupTeams: [],
    adminGwSetupManagers: [],
    adminGwSetupAssignments: [],
    adminGwSetupNationalTeams: [],
    adminGwSetupCompetitionSettings: [],
    trophyRoomSeasonId: null,
    trophyRoomData: null,
    trophyRoomView: "review",
    globalH2HSeasonId: "all",
    globalH2HCache: null,
    returnContext: null,
    user: null,
    client: null,
    config: null,
    managers: (window.IMC_DATA && window.IMC_DATA.managers) || [],
    worlds: (window.IMC_DATA && window.IMC_DATA.worlds) || [],
    worldCompetitions: [],
    teamAliasesByWorld: {},
    globalClubsByAliasKey: {},
    globalClubAliasesById: {},
    gw004: (window.IMC_DATA && window.IMC_DATA.gw004) || {}
  };


  // Build 1 · Client-side routing. One physical index.html, shareable logical URLs.
  const NEXUS_ROUTE_BASE = "/nexus";
  const NEXUS_BUILD = "1";
  const NEXUS_BUILD_LABEL = "BUILD " + NEXUS_BUILD;
  if(window.location.pathname !== "/nexus/" && window.location.pathname !== "/nexus/index.html"){
    window.history.replaceState(null,"","/nexus/index.html");
  }

  function routeEncode(value){
    return encodeURIComponent(String(value == null ? "" : value));
  }

  function routeDecode(value){
    try{return decodeURIComponent(String(value||""));}catch(_){return String(value||"");}
  }

  function routeNameSlug(value){
    return String(value||"")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "item";
  }

  function routeFallbackName(slug){
    return routeDecode(slug).replace(/-/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});
  }

  function resetRouteSelections(){
    state.adminMode=false;
    state.adminPage="home";
    state.selectedWorld=null;
    state.selectedDivision=null;
    state.selectedCompetition=null;
    state.selectedClub=null;
    state.selectedNation=null;
    state.selectedManager=null;
    state.worldSection="competitions";
    state.divisionTab="results";
    state.competitionTab="results";
    state.trophyRoomView="review";
  }

  function routePathFromState(){
    if(state.adminMode){
      const adminMap={
        "import":"import-center",
        "manager-registry":"manager-registry",
        "competition-registry":"competition-registry",
        "trophy-registry":"trophy-registry",
        "game-world-setup":"game-world-setup",
        "archive-season":"archive-season"
      };
      return NEXUS_ROUTE_BASE+"/admin"+(adminMap[state.adminPage]?"/"+adminMap[state.adminPage]:"");
    }

    if(state.selectedWorld){
      const base=NEXUS_ROUTE_BASE+"/gw/"+routeEncode(state.selectedWorld);
      if(state.page==="schedule")return base+"/schedule";
      if(state.page==="h2h")return base+"/h2h";
      if(state.page==="profile")return base+"/profile";
      if(state.page==="worlds"){
        if(state.worldSection==="clubs"){
          if(state.selectedClub)return base+"/club/"+routeEncode(state.selectedClub.id)+"/"+routeNameSlug(state.selectedClub.name);
          return base+"/clubs";
        }
        if(state.worldSection==="national"){
          if(state.selectedNation)return base+"/national-team/"+routeEncode(state.selectedNation.id)+"/"+routeNameSlug(state.selectedNation.name);
          return base+"/national-teams";
        }
        if(state.worldSection==="managers"){
          if(state.selectedManager)return base+"/manager/"+routeEncode(state.selectedManager.id)+"/"+routeNameSlug(state.selectedManager.name);
          return base+"/managers";
        }
        if(state.worldSection==="trophy-room")return base+"/trophy-room"+(state.trophyRoomView&&state.trophyRoomView!=="review"?"/"+routeEncode(state.trophyRoomView):"");
        if(state.selectedDivision)return base+"/division/"+routeEncode(state.selectedDivision)+"/"+routeEncode(state.divisionTab||"results");
        if(state.selectedCompetition)return base+"/competition/"+routeEncode(competitionVisualLabel(state.selectedCompetition))+"/"+routeEncode(state.competitionTab||"results");
        return base+"/competitions";
      }
      return base;
    }

    if(state.page==="schedule")return NEXUS_ROUTE_BASE+"/club-house/schedule";
    if(state.page==="h2h")return NEXUS_ROUTE_BASE+"/club-house/h2h";
    if(state.page==="profile")return NEXUS_ROUTE_BASE+"/club-house/profile";
    if(state.page==="trophies")return NEXUS_ROUTE_BASE+"/club-house/trophy-room";
    if(state.page==="worlds")return NEXUS_ROUTE_BASE+"/game-worlds";
    return NEXUS_ROUTE_BASE+"/club-house";
  }

  function syncRouteFromState(){
    // BUILD 1: routing URL disattivato.
    // Tutta Nexus vive sempre su /nexus/index.html.
    return;
  }

  function applyRouteFromLocation(){
    // BUILD 1: nessuna route profonda. Manteniamo lo stato SPA corrente.
    return false;
  }
function getWorldMeta(worldId){
    return state.worlds.find(function(world){ return world.id === worldId; }) || null;
  }

  function worldTypeLabel(type){
    if(type === "single_league") return "Single League";
    if(type === "multi_league") return "Multi League";
    return "Tipo non configurato";
  }

  function selectedWorldName(){
    const meta = getWorldMeta(state.selectedWorld);
    return meta ? meta.name : (state.selectedWorld === "GW004" ? "World League" : "Game World");
  }

  function getWorldConfig(worldId){
    if(window.IMC_WORLD_CONFIG && window.IMC_WORLD_CONFIG[worldId]){
      return window.IMC_WORLD_CONFIG[worldId];
    }
    if(worldId === "GW004") return FALLBACK_GW004_CONFIG;
    const meta = getWorldMeta(worldId);
    if(meta && meta.type === "single_league"){
      return Object.assign({},FALLBACK_GW004_CONFIG,{id:worldId,name:meta.name});
    }
    return null;
  }

  async function loadGameWorlds(){
    if(!state.client) return;
    const result = await state.client
      .from("imc_game_worlds")
      .select("game_world_id,name,game_world_type")
      .order("game_world_id",{ascending:true});
    if(result.error) throw result.error;
    state.worlds = (result.data || []).map(function(row){
      return {id:row.game_world_id,name:row.name,type:row.game_world_type || "unknown"};
    });
  }

  async function loadTeamAliasRegistry(){
    if(!state.client)return;

    const result=await state.client
      .from("gw_team_aliases")
      .select("game_world_id,team_id,alias_name")
      .order("game_world_id",{ascending:true})
      .order("team_id",{ascending:true});

    if(result.error)throw result.error;

    const registry={};

    (result.data||[]).forEach(function(row){
      const worldId=String(row.game_world_id||"");
      const teamId=String(row.team_id||"");
      const alias=String(row.alias_name||"").trim();

      if(!worldId||!teamId||!alias)return;
      if(!registry[worldId])registry[worldId]={};
      registry[worldId][teamId]=alias;
    });

    state.teamAliasesByWorld=registry;
  }

  function teamAliasFor(teamId,worldId){
    const resolvedWorld=String(worldId||state.selectedWorld||"");
    const resolvedTeam=String(teamId||"");

    if(!resolvedWorld||!resolvedTeam)return "";

    const worldAliases=state.teamAliasesByWorld&&state.teamAliasesByWorld[resolvedWorld];
    if(!worldAliases)return "";

    return worldAliases[resolvedTeam]||"";
  }

  async function loadGlobalClubRegistry(){
    if(!state.client)return;

    try{
      const results=await Promise.all([
        state.client
          .from("imc_clubs")
          .select("club_id,club_key,display_name,logo_file")
          .order("display_name",{ascending:true}),
        state.client
          .from("imc_club_aliases")
          .select("club_id,alias_name,alias_key")
          .order("alias_name",{ascending:true})
      ]);

      if(results[0].error)throw results[0].error;
      if(results[1].error)throw results[1].error;

      const clubsById={};
      const byAliasKey={};
      const aliasesById={};

      (results[0].data||[]).forEach(function(row){
        const club={
          club_id:row.club_id,
          club_key:String(row.club_key||"").trim(),
          display_name:String(row.display_name||"").trim(),
          logo_file:String(row.logo_file||"").trim()
        };

        clubsById[String(row.club_id)]=club;
        aliasesById[String(row.club_id)]=[];

        [club.club_key,club.display_name].filter(Boolean).forEach(function(value){
          byAliasKey[normalizeParticipantKey(value)]=club;
        });
      });

      (results[1].data||[]).forEach(function(row){
        const club=clubsById[String(row.club_id)];
        if(!club)return;

        const alias=String(row.alias_name||"").trim();
        const aliasKey=String(row.alias_key||"").trim();

        if(alias){
          byAliasKey[normalizeParticipantKey(alias)]=club;
          aliasesById[String(row.club_id)].push(alias);
        }
        if(aliasKey){
          byAliasKey[normalizeParticipantKey(aliasKey)]=club;
        }
      });

      state.globalClubsByAliasKey=byAliasKey;
      state.globalClubAliasesById=aliasesById;
    }catch(error){
      // Migration not installed yet: Nexus remains usable with the legacy fallback.
      console.warn("Global Club Registry non disponibile:",error&&error.message?error.message:error);
      state.globalClubsByAliasKey={};
      state.globalClubAliasesById={};
    }
  }

  function globalClubForName(name){
    const key=normalizeParticipantKey(name);
    if(!key)return null;
    return state.globalClubsByAliasKey&&state.globalClubsByAliasKey[key]
      ? state.globalClubsByAliasKey[key]
      : null;
  }

  function globalClubDisplayName(name){
    const raw=String(name||"").trim();
    if(!raw)return "";

    const club=globalClubForName(raw);
    if(club&&club.display_name){
      return formatClubName(club.display_name);
    }

    return formatClubName(raw);
  }

  function globalClubForTeam(team,worldId){
    if(!team)return null;

    const candidates=[
      teamAliasFor(team.team_id,worldId),
      team.display_name,
      team.team_name,
      team.name
    ].filter(Boolean);

    for(const candidate of candidates){
      const club=globalClubForName(candidate);
      if(club)return club;
    }

    return null;
  }

  function globalClubAliasNamesForName(name){
    const club=globalClubForName(name);
    if(!club)return [];

    const aliases=state.globalClubAliasesById&&state.globalClubAliasesById[String(club.club_id)];
    return Array.isArray(aliases)?aliases.slice():[];
  }

  function addGlobalClubAliasesToParticipantMap(map,teamData,names){
    if(!map||!teamData)return;

    const candidates=(names||[]).filter(Boolean);
    let club=null;

    for(const name of candidates){
      club=globalClubForName(name);
      if(club)break;
    }

    if(!club)return;

    if(club.display_name){
      map.set(normalizeParticipantKey(club.display_name),teamData);
    }

    globalClubAliasNamesForName(club.display_name).forEach(function(alias){
      map.set(normalizeParticipantKey(alias),teamData);
    });
  }

  function getCompetitionConfig(displayName){
    const worldConfig = getWorldConfig(state.selectedWorld || "GW004");
    if(!worldConfig || !worldConfig.competitions) return null;
    return worldConfig.competitions[displayName] || null;
  }

  function getCompetitionDbName(displayName){
    const config = getCompetitionConfig(displayName);
    return config && config.db ? config.db : displayName;
  }

  function getCompetitionTrophy(displayName){
    const config = getCompetitionConfig(displayName);
    return config && config.trophy ? config.trophy : "";
  }

  function getCompetitionConfigByDbName(dbName,worldId){
    const worldConfig = getWorldConfig(worldId || state.selectedWorld || "GW004");
    if(!worldConfig || !worldConfig.competitions) return null;
    const displayName = Object.keys(worldConfig.competitions).find(function(name){
      const item = worldConfig.competitions[name];
      return (item.db || name) === dbName;
    });
    return displayName ? worldConfig.competitions[displayName] : null;
  }

  function getOfficialCalendar(worldId,competition){
    const worldConfig = getWorldConfig(worldId || "GW004");
    if(!worldConfig || !worldConfig.calendars) return null;
    if(competition === "league") return worldConfig.calendars.singleLeague || null;
    const competitionConfig = getCompetitionConfigByDbName(competition,worldId);
    if(!competitionConfig || !competitionConfig.calendar) return null;
    return worldConfig.calendars[competitionConfig.calendar] || null;
  }

  function officialLeagueMatchday(worldId,date,context){
    const fixed=OFFICIAL_SINGLE_LEAGUE_CALENDARS[worldId];
    if(fixed&&fixed[date])return Number(fixed[date]);

    if(worldId==="GW004"){
      const gw004Calendar=FALLBACK_GW004_CONFIG&&
        FALLBACK_GW004_CONFIG.calendars&&
        FALLBACK_GW004_CONFIG.calendars.singleLeague;
      if(gw004Calendar&&gw004Calendar[date]){
        return Number(gw004Calendar[date]);
      }
    }

    if(context&&context.official_matchday_by_date){
      const stored=context.official_matchday_by_date[date];
      if(stored)return Number(stored);
    }

    return null;
  }

  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];
    });
  }

  const DEFAULT_SUPABASE_URL="https://toanuzojdkfjgucztpze.supabase.co";
  const DEFAULT_SUPABASE_PUBLISHABLE_KEY="sb_publishable_DYmVU7yEavK_ddsdNMUjcg_a7HesB-l";

  function readConfig(){
    try { return JSON.parse(localStorage.getItem("imc_nexus_config") || "null"); }
    catch(_) { return null; }
  }

  function saveConfig(url,key){
    localStorage.setItem("imc_nexus_config", JSON.stringify({url:url.trim(), key:key.trim()}));
  }

  function initializeClient(){
    const stored=readConfig();
    state.config={
      url:stored&&stored.url?stored.url:DEFAULT_SUPABASE_URL,
      key:stored&&stored.key?stored.key:DEFAULT_SUPABASE_PUBLISHABLE_KEY
    };
    state.client=null;

    if(window.supabase){
      state.client=window.supabase.createClient(
        state.config.url,
        state.config.key
      );
    }
  }

  function technicalEmail(username){
    return username.trim().toLowerCase() + "@users.imcnexus.local";
  }

  function showApp(){
    boot.hidden = true;
    app.hidden = false;
  }

  async function nexusProfileForUser(userId){
    const nexusResult=await state.client
      .from("nexus_users")
      .select("manager_id,app_role,is_active,must_change_password,password_changed_at,imc_managers(full_name)")
      .eq("user_id",userId)
      .maybeSingle();

    if(!nexusResult.error && nexusResult.data){
      if(nexusResult.data.is_active!==true){
        throw new Error("Account Nexus disattivato.");
      }
      return {
        manager_id:nexusResult.data.manager_id,
        full_name:nexusResult.data.imc_managers&&nexusResult.data.imc_managers.full_name
          ? nexusResult.data.imc_managers.full_name
          : nexusResult.data.manager_id,
        role:nexusResult.data.app_role||"viewer",
        must_change_password:Boolean(nexusResult.data.must_change_password),
        password_changed_at:nexusResult.data.password_changed_at||null,
        demo:false
      };
    }

    const legacyResult=await state.client
      .from("imc_users")
      .select("manager_id,username,role,imc_managers(full_name)")
      .eq("auth_user_id",userId)
      .maybeSingle();

    if(legacyResult.error||!legacyResult.data){
      throw new Error("Profilo Nexus non trovato.");
    }

    return {
      manager_id:legacyResult.data.manager_id,
      full_name:legacyResult.data.imc_managers&&legacyResult.data.imc_managers.full_name
        ? legacyResult.data.imc_managers.full_name
        : legacyResult.data.username,
      role:legacyResult.data.role,
      must_change_password:false,
      demo:false
    };
  }

  async function loadProfileFromSession(){
    if(!state.client) return false;
    const sessionResult=await state.client.auth.getSession();
    if(sessionResult.error||!sessionResult.data.session)return false;

    try{
      state.user=await nexusProfileForUser(sessionResult.data.session.user.id);
      await loadGameWorlds();
      await loadTeamAliasRegistry();
      await loadGlobalClubRegistry();
      if(!applyRouteFromLocation())state.page="home";
      return true;
    }catch(_){
      await state.client.auth.signOut();
      state.user=null;
      return false;
    }
  }

  function render(){
    showApp();
    if(!state.user) renderLogin();
    else if(state.user.must_change_password===true) renderMandatoryPasswordChange();
    else renderShell();
  }

  function renderMandatoryPasswordChange(){
    app.innerHTML=`
      <main class="login-screen nx-password-change-screen">
        <section class="login-brand">
          <img src="assets/imc-logo.png" alt="Logo IMC">
          <h1>IMC Nexus</h1>
          <p>Proteggi il tuo account</p>
        </section>

        <section class="login-card nx-password-change-card">
          <div class="nx-password-change-head">
            <small>PRIMO ACCESSO</small>
            <h2>Crea la tua password</h2>
            <p>${esc(state.user.full_name||state.user.manager_id)}, la password temporanea deve essere sostituita prima di continuare.</p>
          </div>

          <form id="mandatoryPasswordForm">
            <div class="field">
              <label for="newPassword">Nuova password</label>
              <input id="newPassword" type="password" autocomplete="new-password" minlength="6" required>
            </div>
            <div class="field">
              <label for="confirmPassword">Conferma nuova password</label>
              <input id="confirmPassword" type="password" autocomplete="new-password" minlength="6" required>
            </div>
            <button class="primary" type="submit">SALVA NUOVA PASSWORD</button>
            <div class="status" id="mandatoryPasswordStatus"></div>
          </form>

          <button class="secondary" type="button" id="mandatoryPasswordLogout">ESCI</button>
        </section>
      </main>
    `;

    document.getElementById("mandatoryPasswordForm").addEventListener("submit",saveMandatoryPassword);
    document.getElementById("mandatoryPasswordLogout").addEventListener("click",async function(){
      if(state.client)await state.client.auth.signOut();
      state.user=null;
      render();
    });
  }

  async function saveMandatoryPassword(event){
    event.preventDefault();
    const status=document.getElementById("mandatoryPasswordStatus");
    const submit=event.currentTarget.querySelector("button[type=submit]");
    const password=document.getElementById("newPassword").value;
    const confirm=document.getElementById("confirmPassword").value;

    if(password.length<6){
      status.className="status error";
      status.textContent="La password deve contenere almeno 6 caratteri.";
      return;
    }
    if(password!==confirm){
      status.className="status error";
      status.textContent="Le due password non coincidono.";
      return;
    }

    submit.disabled=true;
    status.className="status";
    status.textContent="Aggiornamento password…";

    try{
      const authResult=await state.client.auth.updateUser({password:password});
      if(authResult.error)throw authResult.error;

      const passwordChangedAt=new Date().toISOString();
      const flagResult=await state.client
        .from("nexus_users")
        .update({
          must_change_password:false,
          password_changed_at:passwordChangedAt
        })
        .eq("manager_id",state.user.manager_id);

      if(flagResult.error){
        throw new Error("Password aggiornata, ma Nexus non è riuscito a completare l'attivazione: "+flagResult.error.message);
      }

      state.user.must_change_password=false;
      state.user.password_changed_at=passwordChangedAt;
      status.className="status success";
      status.textContent="Password aggiornata. Accesso in corso…";
      setTimeout(function(){
        render();
      },500);
    }catch(error){
      status.className="status error";
      status.textContent=error&&error.message?error.message:"Aggiornamento password non riuscito.";
      submit.disabled=false;
    }
  }

  function renderLogin(){
    initializeClient();
    app.innerHTML = `
      <main class="login-screen">
        <section class="login-brand">
          <img src="assets/imc-logo.png" alt="Logo IMC">
          <h1>IMC Nexus</h1>
          <p>The World Is Our Playground</p>
        </section>

        <section class="login-card">
          <form id="loginForm">
            <div class="field">
              <label for="username">Manager ID</label>
              <input id="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="MNG001" required>
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input id="password" type="password" autocomplete="current-password" placeholder="Password" required>
            </div>
            <button class="primary" type="submit">ACCEDI</button>
            <div class="status" id="loginStatus"></div>
          </form>
        </section>
      </main>
    `;
    document.getElementById("loginForm").addEventListener("submit", login);
  }

  function renderConfig(){
    const config = readConfig() || {};
    app.innerHTML = `
      <main class="login-screen">
        <section class="login-card" style="margin-top:auto;margin-bottom:auto">
          <h2 style="margin-top:0;color:var(--navy)">Configura Supabase</h2>
          <div class="field"><label for="apiUrl">API URL</label><input id="apiUrl" value="${esc(config.url || "")}"></div>
          <div class="field"><label for="apiKey">Publishable Key</label><textarea id="apiKey" style="min-height:130px">${esc(config.key || "")}</textarea></div>
          <button class="primary" id="saveConfig">SALVA</button>
          <button class="secondary" id="backButton">INDIETRO</button>
          <div class="status" id="configStatus"></div>
        </section>
      </main>
    `;
    document.getElementById("backButton").addEventListener("click", renderLogin);
    document.getElementById("saveConfig").addEventListener("click", function(){
      const url = document.getElementById("apiUrl").value.trim();
      const key = document.getElementById("apiKey").value.trim();
      const status = document.getElementById("configStatus");
      if(!url || !key){
        status.className = "status error";
        status.textContent = "Inserisci entrambi i valori.";
        return;
      }
      saveConfig(url,key);
      initializeClient();
      status.className = "status success";
      status.textContent = "Configurazione salvata.";
      setTimeout(renderLogin, 500);
    });
  }

  async function login(event){
    event.preventDefault();
    const status = document.getElementById("loginStatus");
    const username = document.getElementById("username").value.trim().toUpperCase();
    const password = document.getElementById("password").value;
    if(!state.client){
      status.className = "status error";
      status.textContent = "Configura prima Supabase.";
      return;
    }
    status.className = "status";
    status.textContent = "Accesso in corso…";

    try{
      const authResult = await state.client.auth.signInWithPassword({email:technicalEmail(username),password:password});
      if(authResult.error) throw authResult.error;

      state.user=await nexusProfileForUser(authResult.data.user.id);
      await loadGameWorlds();
      await loadTeamAliasRegistry();
      await loadGlobalClubRegistry();
      if(!applyRouteFromLocation())state.page = "home";
      render();
    }catch(error){
      status.className = "status error";
      status.textContent = error && error.message ? error.message : "Accesso non riuscito.";
    }
  }

  function navButton(page,icon,label){
    return `<button class="nav-btn ${state.page===page ? "active" : ""}" data-page="${page}"><b>${icon}</b>${label}</button>`;
  }

  function isAdminUser(){
    const role = String(state.user && state.user.role ? state.user.role : "")
      .trim()
      .toLowerCase();

    return role === "admin" ||
      (state.user && state.user.manager_id === "MNG001");
  }

  function renderShell(fromRoute){
    syncRouteFromState(Boolean(fromRoute));
    document.title = "IMC Nexus · Build " + NEXUS_BUILD;
    app.innerHTML = `
      <div class="nx-shell">
        <div class="nx-overlay" id="nxOverlay" hidden></div>

        <div class="nx-app-menu" id="nxAppMenu" hidden>
          <button data-app-action="clubhouse">⌂ <span>Club House</span></button>
          <button data-app-action="worlds">◎ <span>Game Worlds</span></button>
          <button data-app-action="profile">♙ <span>Profilo</span></button>
          ${isAdminUser() ? `
            <div class="nx-menu-divider"></div>
            <button data-app-action="admin" class="nx-admin-entry">🛠 <span>Admin Console</span></button>
          ` : ""}
        </div>

        <aside class="nx-drawer" id="nxDrawer" aria-hidden="true">
          <div class="nx-drawer-head">
            <button class="nx-round-btn" id="closeDrawer">×</button>
            <strong>IMC NEXUS</strong>
            <button class="nx-round-btn" id="openAppMenu">•••</button>
          </div>

          <div class="nx-profile-switch">
            <div class="nx-manager-box">
              <img src="assets/imc-logo.png" alt="">
              <div>
                <strong>${esc(state.user.full_name)}</strong>
                <span>IMC ID: ${esc(state.user.manager_id)}</span>
              </div>
            </div>

            <div class="nx-world-box">
              <span>◎</span>
              <div>
                <strong>${state.selectedWorld ? selectedWorldName() : "Club House"}</strong>
              </div>
            </div>
          </div>

          <div class="nx-world-list">
            <button class="nx-world-item" data-drawer-world="">
              <span>⌂</span><strong>Club House</strong><small>GLOBALE</small>
            </button>

            ${state.worlds
              .map(function(world){
                return `<button class="nx-world-item" data-drawer-world="${esc(world.id)}">
                  <span>${esc(world.id)}</span>
                  <strong>${esc(world.name)}</strong>
                </button>`;
              }).join("")}
          </div>
        </aside>

        <header class="nx-top">
          <button class="nx-logo-button" id="openDrawer">
            <img src="assets/imc-logo.png" alt="">
            <div><strong>IMC Nexus</strong><small>${state.adminMode ? "ADMIN CONSOLE" : NEXUS_BUILD_LABEL}</small></div>
          </button>

          <div class="nx-top-actions">
            ${isAdminUser() ? '<button class="nx-round-btn nx-admin-direct" id="openAdminConsole" aria-label="Admin Console">🛠</button>' : ''}
            <button class="nx-round-btn" id="openHeaderMenu">•••</button>
            <button class="nx-round-btn" id="logoutButton">↗</button>
          </div>
        </header>

        ${!state.adminMode ? `<section class="nx-context">
          <div class="nx-context-manager">
            <img src="assets/imc-logo.png" alt="">
            <div>
              <strong>${esc(state.user.full_name)}</strong>
              <span>IMC ID: ${esc(state.user.manager_id)}</span>
              ${isAdminUser() ? '<em class="nx-admin-badge">ADMIN</em>' : ''}
            </div>
          </div>

          <button class="nx-context-world" id="openDrawerWorld">
            <span>◎</span>
            <strong>${state.selectedWorld ? selectedWorldName() : "Club House"}</strong>
            <span>⌄</span>
          </button>
        </section>` : ""}

        ${!state.adminMode && Boolean(state.selectedWorld) ? `
          <nav class="nx-world-nav">
            <button data-world-section="clubs" class="${state.worldSection==="clubs" ? "active" : ""}"><b>◈</b>CLUBS</button>
            <button data-world-section="national" class="${state.worldSection==="national" ? "active" : ""}"><b>⚑</b>NAZIONALI</button>
            <button data-world-section="managers" class="${state.worldSection==="managers" ? "active" : ""}"><b>●</b>MANAGERS</button>
            <button data-world-section="competitions" class="${state.worldSection==="competitions" ? "active" : ""}"><b>♛</b>COMPETITIONS</button>
            <button data-world-section="trophy-room" class="${state.worldSection==="trophy-room" ? "active" : ""}"><b>🏆</b>TROPHY ROOM</button>
          </nav>
        ` : ""}

        <main id="pageRoot" class="nx-main"></main>

        ${!state.adminMode ? `<nav class="nx-bottom">
          <button data-page="schedule"><b>▣</b><span>SCHEDULE</span></button>
          <button data-page="h2h"><b>♧</b><span>H2H</span></button>
          <button data-page="home" class="nx-home-orb"><b>⌂</b></button>
          <button data-page="trophies"><b>♛</b><span>TROPHY ROOM</span></button>
          <button data-page="profile"><b>♙</b><span>PROFILO</span></button>
        </nav>` : ""}
      </div>
    `;

    document.getElementById("logoutButton").addEventListener("click", async function(){
      if(state.client) await state.client.auth.signOut();
      state.user = null;
      state.page = "login";
      render();
    });

    const drawer = document.getElementById("nxDrawer");
    const overlay = document.getElementById("nxOverlay");
    const appMenu = document.getElementById("nxAppMenu");

    function toggleAppMenu(){
      if(appMenu) appMenu.hidden = !appMenu.hidden;
    }

    const openHeaderMenuButton = document.getElementById("openHeaderMenu");
    if(openHeaderMenuButton) openHeaderMenuButton.addEventListener("click",toggleAppMenu);

    const directAdminButton = document.getElementById("openAdminConsole");
    if(directAdminButton){
      directAdminButton.addEventListener("click",function(){
        state.returnContext = {
          page: state.page,
          selectedWorld: state.selectedWorld,
          worldSection: state.worldSection,
          selectedDivision: state.selectedDivision,
          selectedCompetition: state.selectedCompetition
        };
        state.adminMode = true;
        state.adminPage = "home";
        renderShell();
      });
    }
    const drawerMenuButton = document.getElementById("openAppMenu");
    if(drawerMenuButton) drawerMenuButton.addEventListener("click",toggleAppMenu);

    document.querySelectorAll("[data-app-action]").forEach(function(button){
      button.addEventListener("click",function(){
        const action=button.getAttribute("data-app-action");
        appMenu.hidden=true;
        if(action==="admin"){
          state.returnContext={page:state.page,selectedWorld:state.selectedWorld,worldSection:state.worldSection,selectedDivision:state.selectedDivision,selectedCompetition:state.selectedCompetition};
          state.adminMode=true; state.adminPage="home";
        }else{
          state.adminMode=false;
          if(action==="clubhouse"){state.page="home";state.selectedWorld=null;}
          if(action==="worlds"){state.page="worlds";state.selectedWorld=null;state.worldSection="competitions";}
          if(action==="profile"){state.page="profile";}
        }
        renderShell();
      });
    });

    function openDrawer(){
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden","false");
      overlay.hidden = false;
    }

    function closeDrawer(){
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden","true");
      overlay.hidden = true;
    }

    const openDrawerButton = document.getElementById("openDrawer");
    if(openDrawerButton) openDrawerButton.addEventListener("click",openDrawer);

    const openDrawerWorldButton = document.getElementById("openDrawerWorld");
    if(openDrawerWorldButton) openDrawerWorldButton.addEventListener("click",openDrawer);

    const closeDrawerButton = document.getElementById("closeDrawer");
    if(closeDrawerButton) closeDrawerButton.addEventListener("click",closeDrawer);

    if(overlay){
      overlay.addEventListener("click",function(){
        closeDrawer();
        if(appMenu) appMenu.hidden=true;
      });
    }

    document.querySelectorAll("[data-drawer-world]").forEach(function(button){
      button.addEventListener("click",function(){
        const world = button.getAttribute("data-drawer-world");

        if(world){
          state.selectedWorld = world;
          state.page = "worlds";
          state.worldSection = "competitions";
          state.selectedCompetition = null;
          state.selectedDivision = null;
        }else if(!world){
          state.selectedWorld = null;
          state.page = "home";
        }

        closeDrawer();
        renderShell();
      });
    });

    document.querySelectorAll("[data-world-section]").forEach(function(button){
      button.addEventListener("click",function(){
        state.worldSection = button.getAttribute("data-world-section");
        if(state.worldSection==="clubs" || state.worldSection==="national"){
          state.entityImcFilter=false;
        }
        state.selectedCompetition = null;
        state.selectedDivision = null;
        state.selectedClub = null;
        state.selectedNation = null;
        state.selectedManager = null;
        state.trophyRoomSeasonId = null;
        state.trophyRoomData = null;
        state.trophyRoomView = "review";
        state.globalH2HSeasonId = "all";
        state.globalH2HCache = null;
        state.page = "worlds";
        renderShell();
      });
    });

    document.querySelectorAll("[data-page]").forEach(function(button){
      button.addEventListener("click",function(){
        const nextPage = button.getAttribute("data-page");

        if(nextPage === "trophies" && state.selectedWorld){
          state.page = "worlds";
          state.worldSection = "trophy-room";
          state.trophyRoomSeasonId = null;
        }else if(nextPage === "home"){
          state.page = "home";
          state.selectedWorld = null;
          state.worldSection = "competitions";
          state.selectedDivision = null;
          state.selectedCompetition = null;
          state.selectedClub = null;
          state.selectedNation = null;
          state.selectedManager = null;
          state.divisionTab = "results";
          state.competitionTab = "results";
        }else{
          state.page = nextPage;
        }

        renderShell();
      });
    });

    renderPage();
  }

  function renderPage(){
    const root = document.getElementById("pageRoot");

    if(state.adminMode){
      if(state.adminPage === "import"){
        root.innerHTML = adminImportPage();
        bindAdminImport();
      }else if(state.adminPage === "manager-registry"){
        root.innerHTML = adminManagerRegistryPage();
        bindAdminManagerRegistry();
      }else if(state.adminPage === "competition-registry"){
        root.innerHTML = adminCompetitionRegistryPage();
        bindAdminCompetitionRegistry();
      }else if(state.adminPage === "trophy-registry"){
        root.innerHTML = adminTrophyRegistryPage();
        bindAdminTrophyRegistry();
      }else if(state.adminPage === "game-world-setup"){
        root.innerHTML = adminGameWorldSetupPage();
        bindAdminGameWorldSetup();
      }else if(state.adminPage === "archive-season"){
        root.innerHTML = adminArchiveSeasonPage();
        bindAdminArchiveSeason();
      }else{
        root.innerHTML = adminConsolePage();
        bindAdminConsole();
      }
      return;
    }

    if(state.selectedWorld && state.page === "worlds"){
      if(state.worldSection === "competitions"){
        if(state.selectedDivision){
          root.innerHTML = divisionCompetitionView();
          bindDivisionCompetitionView();
        }else if(state.selectedCompetition){
          root.innerHTML = nxCompetitionPage();
          bindNxCompetitionPage();
        }else{
          root.innerHTML = nxCompetitionsIndex();
          bindNxCompetitionsIndex();
        }
      }else if(state.worldSection === "clubs"){
        if(state.selectedClub){
          root.innerHTML = entityProfilePage("club");
          bindEntityProfile("club");
        }else{
          root.innerHTML = entityListPage("club");
          bindEntityList("club");
        }
      }else if(state.worldSection === "national"){
        if(state.selectedNation){
          root.innerHTML = entityProfilePage("nation");
          bindEntityProfile("nation");
        }else{
          root.innerHTML = entityListPage("nation");
          bindEntityList("nation");
        }
      }else if(state.worldSection === "trophy-room"){
        root.innerHTML = trophyRoomPage();
        bindTrophyRoomPage();
      }else{
        if(state.selectedManager){
          root.innerHTML = managerProfilePage();
          bindManagerProfile();
        }else{
          root.innerHTML = managerRegistryPage();
          bindManagerRegistry();
        }
      }
      return;
    }

    if(state.page === "home"){
      root.innerHTML = nxClubHouse();
    }else if(state.page === "worlds"){
      root.innerHTML = worldsPage();
      bindWorldCards();
    }else if(state.page === "profile"){
      root.innerHTML = profilePage();
    }else if(state.page === "schedule"){
      root.innerHTML = globalSchedulePage();
      bindGlobalSchedulePage();
    }else if(state.page === "h2h"){
      root.innerHTML = globalH2HPage();
      bindGlobalH2HPage();
    }else if(state.page === "trophies"){
      root.innerHTML = nxPlaceholder("Trophy Room","Seleziona un Game World per aprire il suo archivio storico.");
    }else{
      root.innerHTML = nxClubHouse();
    }
  }




  function trophyRoomPage(){
    setTimeout(loadTrophyRoom,0);

    return `
      <section class="nx-card nx-trophy-room">
        <div class="nx-page-title">
          <div>
            <small>${esc(state.selectedWorld || "")}</small>
            <h1>🏆 Trophy Room</h1>
            <p>${esc(selectedWorldName())} · Storia, campioni e classifiche finali</p>
          </div>
        </div>

        <div id="trophyRoomContent">
          <div class="nx-loading">Apertura della Trophy Room…</div>
        </div>
      </section>`;
  }

  function bindTrophyRoomPage(){}

  function trophyRoomCompetitionLabel(id,competitionMap){
    const row=competitionMap.get(String(id));
    if(row&&row.competition_name)return row.competition_name;
    return trophyCompetitionName(id)||String(id||"Competizione");
  }

  function trophyRoomWinnerLabel(row,teamMap,nationMap){
    if(row.winner_team_name)return globalClubDisplayName(row.winner_team_name);
    if(row.winning_team_id){
      const team=teamMap.get(String(row.winning_team_id));
      if(team)return teamDisplayName(team);
    }
    if(row.winning_nation_id){
      const nation=nationMap.get(String(row.winning_nation_id));
      if(nation)return nation.nation_name;
    }
    return "Vincitore non registrato";
  }

  async function safeTrophyRoomQuery(factory){
    try{
      const result=await factory();
      if(result.error)throw result.error;
      return result.data||[];
    }catch(error){
      console.warn("Trophy Room query ignorata:",error);
      return [];
    }
  }

  async function loadTrophyRoom(){
    const target=document.getElementById("trophyRoomContent");
    if(!target||!state.selectedWorld)return;

    try{
      const worldId=state.selectedWorld;

      const results=await Promise.all([
        state.client
          .from("gw_seasons")
          .select("season_id,season_number,season_status,start_date,end_date")
          .eq("game_world_id",worldId)
          .order("season_number",{ascending:false}),

        safeTrophyRoomQuery(function(){
          return state.client
            .from("gw_season_archive")
            .select("archive_id,season_id,season_number,matches_count,goals_count,league_competitions_count,trophies_count,archived_at")
            .eq("game_world_id",worldId);
        }),

        safeTrophyRoomQuery(function(){
          return state.client
            .from("gw_season_final_standings")
            .select("season_id,competition_id,division_name,final_position,team_id,team_name,manager_id,manager_name,played,won,drawn,lost,goals_for,goals_against,goal_difference,points")
            .eq("game_world_id",worldId)
            .order("final_position",{ascending:true});
        }),

        safeTrophyRoomQuery(function(){
          return state.client
            .from("imc_trophies")
            .select("trophy_id,competition_id,season_id,winning_team_id,winning_nation_id,winning_manager_id,won_on")
            .eq("game_world_id",worldId);
        }),

        safeTrophyRoomQuery(function(){
          return state.client
            .from("gw_season_honours")
            .select("honour_id,season_id,competition_name,competition_type,winner_team_id,winner_team_name,winner_manager_id,winner_manager_name,awarded_on")
            .eq("game_world_id",worldId);
        }),

        state.client
          .from("gw_competitions")
          .select("competition_id,competition_name,competition_type,competition_category")
          .eq("game_world_id",worldId),

        state.client
          .from("gw_teams")
          .select("team_id,team_name,display_name")
          .eq("game_world_id",worldId),

        safeTrophyRoomQuery(function(){
          return state.client
            .from("national_teams")
            .select("nation_id,nation_name");
        }),

        safeTrophyRoomQuery(function(){
          return state.client
            .from("imc_managers")
            .select("manager_id,full_name");
        })
      ]);

      if(results[0].error)throw results[0].error;
      if(results[5].error)throw results[5].error;
      if(results[6].error)throw results[6].error;

      const seasons=results[0].data||[];
      const archives=results[1]||[];
      const standings=results[2]||[];
      const trophies=results[3]||[];
      const honours=results[4]||[];
      const competitions=results[5].data||[];
      const teams=results[6].data||[];
      const nations=results[7]||[];
      const managers=results[8]||[];

      const archiveMap=new Map(archives.map(function(row){return [String(row.season_id),row];}));
      const competitionMap=new Map(competitions.map(function(row){return [String(row.competition_id),row];}));
      const teamMap=new Map(teams.map(function(row){return [String(row.team_id),row];}));
      const nationMap=new Map(nations.map(function(row){return [String(row.nation_id),row];}));
      const managerMap=new Map(managers.map(function(row){return [String(row.manager_id),row];}));

      const seasonEntries=seasons.map(function(season){
        const seasonStandings=standings.filter(function(row){return String(row.season_id)===String(season.season_id);});
        const registryTrophies=trophies.filter(function(row){return String(row.season_id)===String(season.season_id);}).map(function(row){
          const manager=managerMap.get(String(row.winning_manager_id));
          return {
            competition_name:trophyRoomCompetitionLabel(row.competition_id,competitionMap),
            competition_type:(competitionMap.get(String(row.competition_id))||{}).competition_type||null,
            winner_name:trophyRoomWinnerLabel(row,teamMap,nationMap),
            manager_id:row.winning_manager_id||null,
            manager_name:manager&&manager.full_name?manager.full_name:"Nessun Manager IMC",
            awarded_on:row.won_on||null,
            source:"registry"
          };
        });
        const historicHonours=honours.filter(function(row){return String(row.season_id)===String(season.season_id);}).map(function(row){
          return {
            competition_name:row.competition_name,
            competition_type:row.competition_type||null,
            winner_name:trophyRoomWinnerLabel(row,teamMap,nationMap),
            manager_id:row.winner_manager_id||null,
            manager_name:row.winner_manager_name||"Nessun Manager IMC",
            awarded_on:row.awarded_on||null,
            source:"archive"
          };
        });

        const mergedHonours=[];
        const honourKeys=new Set();
        registryTrophies.concat(historicHonours).forEach(function(row){
          const key=normalizeText(row.competition_name)+"|"+normalizeText(row.winner_name);
          if(honourKeys.has(key))return;
          honourKeys.add(key);
          mergedHonours.push(row);
        });

        return {
          season:season,
          archive:archiveMap.get(String(season.season_id))||null,
          standings:seasonStandings,
          honours:mergedHonours
        };
      });

      state.trophyRoomData={
        entries:seasonEntries,
        competitionMap:competitionMap,
        teamMap:teamMap,
        managerMap:managerMap
      };

      if(!state.trophyRoomSeasonId&&seasonEntries.length){
        const archived=seasonEntries.find(function(entry){
          return entry.season.season_status==="past"&&(entry.standings.length||entry.honours.length||entry.archive);
        });
        state.trophyRoomSeasonId=(archived||seasonEntries[0]).season.season_id;
      }

      renderTrophyRoom();
    }catch(error){
      target.innerHTML=`<div class="nx-empty-box">
        <strong>Impossibile aprire la Trophy Room</strong>
        <span>${esc(error&&error.message?error.message:"Errore durante il caricamento dello storico.")}</span>
      </div>`;
    }
  }

  function trophyRoomSeasonSelector(entries){
    return `<div class="nx-filter-tabs">
      ${entries.map(function(entry){
        const season=entry.season;
        const active=String(state.trophyRoomSeasonId)===String(season.season_id);
        return `<button type="button" data-trophy-season="${esc(season.season_id)}" class="${active?"active":""}">
          Season ${esc(season.season_number)}
          <small>${season.season_status==="current"?"CURRENT":"ARCHIVED"}</small>
        </button>`;
      }).join("")}
    </div>`;
  }


  function trophyRoomImagePath(competitionName){
    const raw=String(competitionName||"").trim();
    const normalizedRaw=normalizeText(raw)
      .replace(/\s*·\s*/g," · ")
      .replace(/\s+/g," ")
      .trim()
      .toLowerCase();

    // Nuovi nomi visuali.
    if(normalizedRaw==="national cup")return "assets/trophies/national-cup.png";
    if(normalizedRaw==="league cup")return "assets/trophies/league-cup.png";
    if(normalizedRaw==="charity shield")return "assets/trophies/charity-shield.png";

    // Record DB legacy con prefisso nazione.
    if(/·\s*league shield$/.test(normalizedRaw))return "assets/trophies/league-cup.png";
    if(/·\s*league cup$/.test(normalizedRaw))return "assets/trophies/national-cup.png";
    if(/·\s*charity shield$/.test(normalizedRaw))return "assets/trophies/charity-shield.png";

    const normalized=normalizedRaw.replace(/\s*·\s*/g," ").trim();
    const exactMap={
      "division 1":"assets/trophies/division-one.png",
      "division one":"assets/trophies/division-one.png",
      "division 2":"assets/trophies/division-two.png",
      "division two":"assets/trophies/division-two.png",
      "division 3":"assets/trophies/division-three.png",
      "division three":"assets/trophies/division-three.png",
      "division 4":"assets/trophies/division-four.png",
      "division four":"assets/trophies/division-four.png",
      "division 5":"assets/trophies/division-five.png",
      "division five":"assets/trophies/division-five.png",
      "smfa champions":"assets/trophies/smfa-champions.png",
      "smfa shield":"assets/trophies/smfa-shield.png",
      "smfa super cup":"assets/trophies/smfa-super-cup.png",
      "world cup qualifying":"assets/trophies/world-cup-qualifying.png",
      "world cup":"assets/trophies/world-cup.png"
    };
    if(exactMap[normalized])return exactMap[normalized];

    const playoff=normalized.match(/^division\s*(1|2|3|4|5)\s+playoff$/);
    if(playoff)return "assets/trophies/playoff.png";

    const division=normalized.match(/division\s*(1|2|3|4|5)$/);
    if(division){
      const files={"1":"division-one.png","2":"division-two.png","3":"division-three.png","4":"division-four.png","5":"division-five.png"};
      return "assets/trophies/"+files[division[1]];
    }

    return "assets/trophies/national-cup.png";
  }
  function trophyRoomImageMarkup(competitionName,competitionType,compact){
    return `<img class="nx-trophy-image${compact?" compact":""}" src="${esc(trophyRoomImagePath(competitionName))}" alt="${esc(competitionName||"Trofeo")}" loading="lazy">`;
  }

  function trophyRoomManagerMarkup(managerName,managerId){
    const label=managerName||"Nessun Manager IMC";
    return `<div class="nx-trophy-manager ${managerId?"is-imc":"is-none"}">
      <span aria-hidden="true">👤</span>
      <span>${esc(label)}</span>
    </div>`;
  }

  function trophyRoomCabinet(entries){
    const totals=new Map();

    entries.forEach(function(entry){
      entry.honours.forEach(function(honour){
        const key=honour.competition_name||"Competizione";
        if(!totals.has(key))totals.set(key,{name:key,type:honour.competition_type||null,count:0,winners:[]});
        const item=totals.get(key);
        item.count+=1;
        item.winners.push({
          season:entry.season.season_number,
          winner:honour.winner_name,
          manager_name:honour.manager_name||"Nessun Manager IMC",
          manager_id:honour.manager_id||null
        });
      });
    });

    const rows=Array.from(totals.values()).sort(function(a,b){
      return a.name.localeCompare(b.name,"it");
    });

    if(!rows.length){
      return `<div class="nx-empty-box">
        <strong>Trophy Cabinet ancora vuoto</strong>
        <span>I vincitori compariranno dopo la registrazione o l’archiviazione delle stagioni.</span>
      </div>`;
    }

    return `<div class="nx-competition-grid">
      ${rows.map(function(row){
        const latest=row.winners.slice().sort(function(a,b){return b.season-a.season;})[0];
        return `<article class="nx-comp-tile nx-trophy-cabinet-card">
          ${trophyRoomImageMarkup(row.name,row.type,false)}
          <strong>${esc(competitionVisualLabel(row.name))}</strong>
          <small>${row.count} edizion${row.count===1?"e":"i"}</small>
          <div class="nx-trophy-latest"><span>Ultimo vincitore</span><b>${esc(latest.winner)}</b></div>
          ${trophyRoomManagerMarkup(latest.manager_name,latest.manager_id)}
        </article>`;
      }).join("")}
    </div>`;
  }

  function trophyRoomStandingsMarkup(rows){
    if(!rows.length){
      return `<div class="nx-empty-box"><strong>Classifiche non archiviate</strong><span>Nessuno snapshot finale disponibile per questa stagione.</span></div>`;
    }

    const groups=new Map();
    rows.forEach(function(row){
      const key=row.division_name||"Divisione";
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(row);
    });

    return Array.from(groups.entries()).map(function(pair){
      const name=pair[0];
      const table=pair[1].slice().sort(function(a,b){return a.final_position-b.final_position;});
      const divisionMatches=Math.round(table.reduce(function(total,row){
        return total+Number(row.played||0);
      },0)/2);
      const divisionGoals=table.reduce(function(total,row){
        return total+Number(row.goals_for||0);
      },0);

      return `<section class="nx-standings-block">
        <div class="nx-standings-heading">
          <h3>${esc(String(name).replace(/\s*·\s*/g," "))}</h3>
          <small>${divisionMatches} partite · ${divisionGoals} gol</small>
        </div>
        <div class="nx-table-wrap">
          <table class="nx-table">
            <thead><tr><th>Pos</th><th>Squadra</th><th>G</th><th class="nx-stat-extra">V</th><th class="nx-stat-extra">N</th><th class="nx-stat-extra">P</th><th class="nx-stat-extra">GF</th><th class="nx-stat-extra">GS</th><th>DR</th><th>Pt</th></tr></thead>
            <tbody>
              ${table.map(function(row){
                return `<tr class="${row.final_position===1?"champion-row":""}">
                  <td>${esc(row.final_position)}</td>
                  <td class="nx-standing-team"><strong>${esc(globalClubDisplayName(row.team_name))}</strong><small>${esc(row.manager_name||"Nessun Manager IMC")}</small></td>
                  <td>${esc(row.played)}</td>
                  <td class="nx-stat-extra">${esc(row.won)}</td>
                  <td class="nx-stat-extra">${esc(row.drawn)}</td>
                  <td class="nx-stat-extra">${esc(row.lost)}</td>
                  <td class="nx-stat-extra">${esc(row.goals_for)}</td>
                  <td class="nx-stat-extra">${esc(row.goals_against)}</td>
                  <td>${esc(row.goal_difference)}</td>
                  <td><strong>${esc(row.points)}</strong></td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>`;
    }).join("");
  }

  function trophyRoomHonoursMarkup(honours){
    if(!honours.length){
      return `<div class="nx-empty-box"><strong>Nessun vincitore registrato</strong><span>I trofei della stagione non sono ancora presenti nello storico.</span></div>`;
    }

    return `<div class="nx-domestic-list">
      ${honours.map(function(row){
        return `<article class="nx-domestic-card nx-trophy-honour-card">
          ${trophyRoomImageMarkup(row.competition_name,row.competition_type,false)}
          <div class="nx-trophy-honour-copy">
            <small>${esc(competitionVisualLabel(row.competition_name))}</small>
            <h3>${esc(globalClubDisplayName(row.winner_name))}</h3>
            ${trophyRoomManagerMarkup(row.manager_name,row.manager_id)}
            ${row.awarded_on?`<time>Assegnato il ${formatDate(row.awarded_on)}</time>`:""}
          </div>
        </article>`;
      }).join("")}
    </div>`;
  }


  function trophyRoomTimelineMarkup(entries){
    if(!entries.length)return "";

    const ordered=entries.slice().sort(function(a,b){
      return Number(a.season.season_number)-Number(b.season.season_number);
    });

    return `<div class="nx-filter-tabs nx-season-timeline">
      ${ordered.map(function(entry,index){
        const season=entry.season;
        const active=String(state.trophyRoomSeasonId)===String(season.season_id);
        const champion=entry.standings.find(function(row){
          return Number(row.final_position)===1 &&
            /division\s*1$/i.test(String(row.division_name||"").replace(/\s*·\s*/g," "));
        }) || entry.standings.find(function(row){return Number(row.final_position)===1;});

        return `<button type="button" data-trophy-season="${esc(season.season_id)}" class="${active?"active":""}">
          <strong>S${esc(season.season_number)}</strong>
          <span>${champion?"🏆 "+esc(globalClubDisplayName(champion.team_name)):(season.season_status==="current"?"● Current":"Archived")}</span>
          ${champion?trophyRoomManagerMarkup(champion.manager_name||"Nessun Manager IMC",champion.manager_id):""}
          <small>${index<ordered.length-1?"→":" "}</small>
        </button>`;
      }).join("")}
    </div>`;
  }


  function trophyRoomStandingsSummary(rows){
    const safeRows=Array.isArray(rows)?rows:[];
    const totalPlayed=safeRows.reduce(function(total,row){
      return total+Number(row.played||0);
    },0);
    const matches=Math.round(totalPlayed/2);
    const goals=safeRows.reduce(function(total,row){
      return total+Number(row.goals_for||0);
    },0);
    const average=matches?Number(goals/matches).toFixed(2):"—";

    return {
      matches:matches,
      goals:goals,
      average:average
    };
  }

  function trophyRoomHonourForDivision(entry,divisionName){
    const target=normalizeText(String(divisionName||"").replace(/\s*·\s*/g," "));
    return (entry.honours||[]).find(function(honour){
      return normalizeText(String(honour.competition_name||"").replace(/\s*·\s*/g," "))===target;
    })||null;
  }


  function trophyRoomSeasonReviewMarkup(entry){
    const archive=entry.archive;
    const champions=entry.standings.filter(function(row){
      return Number(row.final_position)===1;
    }).sort(function(a,b){
      return String(a.division_name).localeCompare(String(b.division_name),"it");
    });

    const bestAttack=entry.standings.slice().sort(function(a,b){
      return Number(b.goals_for)-Number(a.goals_for);
    })[0]||null;

    const bestDefence=entry.standings.slice().sort(function(a,b){
      return Number(a.goals_against)-Number(b.goals_against);
    })[0]||null;

    const bestPoints=entry.standings.slice().sort(function(a,b){
      return Number(b.points)-Number(a.points);
    })[0]||null;

    const standingsSummary=trophyRoomStandingsSummary(entry.standings);
    const matches=standingsSummary.matches;
    const goals=standingsSummary.goals;
    const average=standingsSummary.average;

    return `
      <div class="nx-stat-grid">
        ${statCard("Partite",matches)}
        ${statCard("Gol",goals)}
        ${statCard("Media gol",average)}
        ${statCard("Trofei",entry.honours.length)}
      </div>

      <div class="nx-domestic-list">
        ${champions.length?champions.map(function(row){
          const honour=trophyRoomHonourForDivision(entry,row.division_name);
          return `<article class="nx-domestic-card nx-trophy-honour-card">
            ${trophyRoomImageMarkup(row.division_name,"league",false)}
            <div class="nx-trophy-honour-copy">
              <small>${esc(String(row.division_name).replace(/\s*·\s*/g," "))}</small>
              <h3>${esc(globalClubDisplayName(row.team_name))}</h3>
              ${trophyRoomManagerMarkup(row.manager_name||"Nessun Manager IMC",row.manager_id)}
              ${honour&&honour.awarded_on?`<time>Assegnato il ${formatDate(honour.awarded_on)}</time>`:""}
              <p>${esc(row.points)} punti · DR ${formatSigned(Number(row.goal_difference||0))}</p>
            </div>
          </article>`;
        }).join(""):`<div class="nx-empty-box"><strong>Campioni non disponibili</strong><span>La classifica finale non è ancora archiviata.</span></div>`}
      </div>

      <div class="nx-stat-grid">
        ${statCard("Miglior attacco",bestAttack?globalClubDisplayName(bestAttack.team_name)+" · "+bestAttack.goals_for:"—")}
        ${statCard("Miglior difesa",bestDefence?globalClubDisplayName(bestDefence.team_name)+" · "+bestDefence.goals_against:"—")}
        ${statCard("Record punti",bestPoints?globalClubDisplayName(bestPoints.team_name)+" · "+bestPoints.points:"—")}
      </div>

      <div class="nx-profile-section">
        <h3>Vincitori della stagione</h3>
        ${trophyRoomHonoursMarkup(entry.honours)}
      </div>`;
  }

  function trophyRoomRecordsMarkup(entries){
    const clubMap=new Map();
    const seasonRecords=[];

    entries.forEach(function(entry){
      entry.honours.forEach(function(honour){
        const name=honour.winner_name
          ? globalClubDisplayName(honour.winner_name)
          : "Vincitore";
        if(!clubMap.has(name)){
          clubMap.set(name,{name:name,trophies:0,competitions:new Set()});
        }
        const item=clubMap.get(name);
        item.trophies+=1;
        item.competitions.add(honour.competition_name);
      });

      entry.standings.forEach(function(row){
        seasonRecords.push({
          season:entry.season.season_number,
          team_name:globalClubDisplayName(row.team_name),
          division_name:row.division_name,
          points:Number(row.points||0),
          goals_for:Number(row.goals_for||0),
          goals_against:Number(row.goals_against||0),
          goal_difference:Number(row.goal_difference||0)
        });
      });
    });

    const clubs=Array.from(clubMap.values()).sort(function(a,b){
      if(b.trophies!==a.trophies)return b.trophies-a.trophies;
      return a.name.localeCompare(b.name,"it");
    });

    const bestPoints=seasonRecords.slice().sort(function(a,b){return b.points-a.points;})[0]||null;
    const bestAttack=seasonRecords.slice().sort(function(a,b){return b.goals_for-a.goals_for;})[0]||null;
    const bestDefence=seasonRecords.slice().sort(function(a,b){return a.goals_against-b.goals_against;})[0]||null;
    const bestDifference=seasonRecords.slice().sort(function(a,b){return b.goal_difference-a.goal_difference;})[0]||null;

    return `
      <div class="nx-stat-grid">
        ${statCard("Club con più trofei",clubs[0]?clubs[0].name+" · "+clubs[0].trophies:"—")}
        ${statCard("Record punti",bestPoints?globalClubDisplayName(bestPoints.team_name)+" · "+bestPoints.points:"—")}
        ${statCard("Record gol",bestAttack?globalClubDisplayName(bestAttack.team_name)+" · "+bestAttack.goals_for:"—")}
        ${statCard("Miglior difesa",bestDefence?globalClubDisplayName(bestDefence.team_name)+" · "+bestDefence.goals_against:"—")}
        ${statCard("Miglior DR",bestDifference?globalClubDisplayName(bestDifference.team_name)+" · "+formatSigned(bestDifference.goal_difference):"—")}
      </div>

      <div class="nx-table-wrap">
        <table class="nx-table">
          <thead><tr><th>Pos</th><th>Club</th><th>Trofei</th><th>Competizioni vinte</th></tr></thead>
          <tbody>
            ${clubs.length?clubs.slice(0,20).map(function(row,index){
              return `<tr class="${index===0?"champion-row":""}">
                <td>${index+1}</td>
                <td><strong>${esc(row.name)}</strong></td>
                <td><strong>${row.trophies}</strong></td>
                <td>${esc(Array.from(row.competitions).join(", "))}</td>
              </tr>`;
            }).join(""):`<tr><td colspan="4">Nessun record disponibile.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  function trophyRoomLegendsMarkup(entries){
    const managers=new Map();

    entries.forEach(function(entry){
      entry.honours.forEach(function(honour){
        if(!honour.manager_id||!honour.manager_name)return;
        const key=String(honour.manager_id);
        if(!managers.has(key)){
          managers.set(key,{
            manager_id:honour.manager_id,
            manager_name:honour.manager_name,
            trophies:0,
            seasons:new Set(),
            competitions:new Set()
          });
        }
        const item=managers.get(key);
        item.trophies+=1;
        item.seasons.add(entry.season.season_number);
        item.competitions.add(honour.competition_name);
      });
    });

    const rows=Array.from(managers.values()).sort(function(a,b){
      if(b.trophies!==a.trophies)return b.trophies-a.trophies;
      return a.manager_name.localeCompare(b.manager_name,"it");
    });

    if(!rows.length){
      return `<div class="nx-empty-box">
        <strong>Legends in costruzione</strong>
        <span>I manager compariranno quando i trofei saranno collegati al loro Manager ID.</span>
      </div>`;
    }

    return `<div class="nx-h2h-list">
      ${rows.map(function(row,index){
        return `<div class="nx-h2h-row">
          <div>
            <strong>${index===0?"👑 ":""}${esc(row.manager_name)}</strong>
            <span>${esc(row.manager_id)} · ${row.seasons.size} stagioni vincenti</span>
          </div>
          <div class="nx-stat-line">
            <strong>${row.trophies} trofei</strong>
            <span>${esc(Array.from(row.competitions).join(" · "))}</span>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function trophyRoomSeasonContentMarkup(view,entry,data){
    if(view==="standings")return trophyRoomStandingsMarkup(entry.standings);
    if(view==="honours")return trophyRoomHonoursMarkup(entry.honours);
    if(view==="records")return trophyRoomRecordsMarkup(data.entries);
    if(view==="legends")return trophyRoomLegendsMarkup(data.entries);
    return trophyRoomSeasonReviewMarkup(entry);
  }


  function renderTrophyRoom(){
    const target=document.getElementById("trophyRoomContent");
    const data=state.trophyRoomData;
    if(!target||!data)return;

    const entry=data.entries.find(function(item){
      return String(item.season.season_id)===String(state.trophyRoomSeasonId);
    })||data.entries[0];

    if(!entry){
      target.innerHTML=`<div class="nx-empty-box"><strong>Nessuna stagione disponibile</strong><span>Questo Game World non ha ancora stagioni registrate.</span></div>`;
      return;
    }

    const archive=entry.archive;
    const leaderRows=entry.standings.filter(function(row){return Number(row.final_position)===1;});
    const standingsSummary=trophyRoomStandingsSummary(entry.standings);
    const totalGoals=standingsSummary.goals;
    const matches=standingsSummary.matches;
    const activeView=state.trophyRoomView||"review";

    target.innerHTML=`
      <section class="nx-setup-section">
        <div class="nx-section-heading">
          <div>
            <small>SEASON TIMELINE</small>
            <h2>Storia del Game World</h2>
          </div>
        </div>
        ${trophyRoomTimelineMarkup(data.entries)}
      </section>

      <section class="nx-setup-section">
        <div class="nx-section-heading">
          <div>
            <small>TROPHY CABINET</small>
            <h2>Palmarès storico</h2>
          </div>
        </div>
        ${trophyRoomCabinet(data.entries)}
      </section>

      <section class="nx-setup-section">
        <div class="nx-section-heading">
          <div>
            <small>${entry.season.season_status==="current"?"STAGIONE CORRENTE":"STAGIONE ARCHIVIATA"}</small>
            <h2>Season ${esc(entry.season.season_number)}</h2>
          </div>
        </div>

        <div class="nx-stat-grid">
          ${statCard("Campioni",leaderRows.length)}
          ${statCard("Trofei",entry.honours.length)}
          ${statCard("Partite",matches)}
          ${statCard("Gol",totalGoals)}
        </div>

        <div class="nx-detail-tabs nx-trophy-room-tabs">
          <button type="button" data-trophy-view="review" class="${activeView==="review"?"active":""}">◈<span>SEASON REVIEW</span></button>
          <button type="button" data-trophy-view="honours" class="${activeView==="honours"?"active":""}">♛<span>TROFEI</span></button>
          <button type="button" data-trophy-view="standings" class="${activeView==="standings"?"active":""}">▥<span>CLASSIFICHE</span></button>
          <button type="button" data-trophy-view="records" class="${activeView==="records"?"active":""}">↗<span>RECORDS</span></button>
          <button type="button" data-trophy-view="legends" class="${activeView==="legends"?"active":""}">★<span>LEGENDS</span></button>
        </div>

        <div id="trophyRoomSeasonContent">
          ${trophyRoomSeasonContentMarkup(activeView,entry,data)}
        </div>
      </section>`;

    target.querySelectorAll("[data-trophy-season]").forEach(function(button){
      button.addEventListener("click",function(){
        state.trophyRoomSeasonId=button.getAttribute("data-trophy-season");
        state.trophyRoomView="review";
        renderTrophyRoom();
      });
    });

    target.querySelectorAll("[data-trophy-view]").forEach(function(button){
      button.addEventListener("click",function(){
        state.trophyRoomView=button.getAttribute("data-trophy-view")||"review";
        syncRouteFromState(false);
        renderTrophyRoom();
      });
    });
  }


  function globalSchedulePage(){
    setTimeout(loadGlobalSchedule,0);

    const inWorld=Boolean(state.selectedWorld);
    const worldConfig=inWorld ? getWorldConfig(state.selectedWorld) : null;
    const contextName=inWorld
      ? `${state.selectedWorld} · ${worldConfig && worldConfig.name ? worldConfig.name : "Game World"}`
      : state.user.full_name;

    return `
      <section class="nx-card">
        <div class="nx-page-title">
          <div>
            <h1>Schedule</h1>
            <p>${inWorld
              ? "Le tue prossime partite in questo Game World"
              : "Tutte le prossime partite personali di club e nazionali"}</p>
          </div>
        </div>

        <div class="nx-global-filter-note">
          ${inWorld ? "Game World" : "Manager"}: <strong>${esc(contextName)}</strong>
        </div>

        <div class="nx-schedule-legend" aria-label="Legenda Schedule">
          <span class="nx-schedule-legend-item club"><i></i> Club</span>
          <span class="nx-schedule-legend-item national"><i></i> National Team</span>
        </div>

        <div id="globalScheduleContent">
          <div class="nx-loading">Caricamento prossime partite…</div>
        </div>
      </section>
    `;
  }

  function bindGlobalSchedulePage(){}

  function scheduleMatchType(match){
    const category=match && match.competition && match.competition.competition_category
      ? String(match.competition.competition_category).toLowerCase()
      : "";
    if(category === "nations" || match.home_nation_id || match.away_nation_id) return "national";
    return "club";
  }

  function localTodayDateKey(){
    const now=new Date();
    const year=now.getFullYear();
    const month=String(now.getMonth()+1).padStart(2,"0");
    const day=String(now.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}`;
  }

  async function loadGlobalSchedule(){
    const target = document.getElementById("globalScheduleContent");
    if(!target || !state.client || !state.user) return;

    try{
      const inWorld=Boolean(state.selectedWorld);
      const todayKey=localTodayDateKey();

      let assignmentsQuery = state.client
        .from("gw_manager_assignments")
        .select("game_world_id,manager_id,team_id,nation_id,start_date,end_date,assignment_type")
        .eq("manager_id",state.user.manager_id);

      if(inWorld){
        assignmentsQuery = assignmentsQuery.eq("game_world_id",state.selectedWorld);
      }

      const assignmentsResult = await assignmentsQuery;
      if(assignmentsResult.error) throw assignmentsResult.error;

      const assignments=(assignmentsResult.data || []).filter(function(a){
        // Historical assignments that ended before today cannot contribute future fixtures.
        return !a.end_date || String(a.end_date) >= todayKey;
      });

      if(!assignments.length){
        target.innerHTML = `
          <div class="nx-empty-box">
            <strong>Nessuna assegnazione disponibile</strong>
            <span>${inWorld
              ? "Non risultano club o nazionali associati al manager in questo Game World."
              : "Non risultano club o nazionali associati al manager."}</span>
          </div>`;
        return;
      }

      const matchSelect=`
        match_id,
        game_world_id,
        competition_id,
        match_date,
        match_time,
        match_status,
        home_score,
        away_score,
        round_name,
        stage_name,
        group_name,
        home_team_id,
        away_team_id,
        home_nation_id,
        away_nation_id,
        competition:gw_competitions!gw_matches_competition_id_fkey(
          competition_id,
          competition_name,
          competition_category
        ),
        home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
        away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),
        home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),
        away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)
      `;

      async function fetchAssignmentSide(assignment,column,value){
        if(!value) return [];
        let q=state.client
          .from("gw_matches")
          .select(matchSelect)
          .eq("game_world_id",assignment.game_world_id)
          .eq(column,value)
          .gte("match_date",todayKey)
          .order("match_date",{ascending:true})
          .order("match_time",{ascending:true});

        if(assignment.start_date && String(assignment.start_date) > todayKey){
          q=q.gte("match_date",assignment.start_date);
        }
        if(assignment.end_date){
          q=q.lte("match_date",assignment.end_date);
        }

        const result=await q;
        if(result.error) throw result.error;
        return result.data || [];
      }

      // Build 1: server-side entity lookup. We no longer download the whole Game World
      // and filter it in the browser, avoiding Supabase row limits on large calendars.
      const requests=[];
      assignments.forEach(function(a){
        if(a.team_id){
          requests.push(fetchAssignmentSide(a,"home_team_id",a.team_id));
          requests.push(fetchAssignmentSide(a,"away_team_id",a.team_id));
        }
        if(a.nation_id){
          requests.push(fetchAssignmentSide(a,"home_nation_id",a.nation_id));
          requests.push(fetchAssignmentSide(a,"away_nation_id",a.nation_id));
        }
      });

      const batches=requests.length ? await Promise.all(requests) : [];
      const byId=new Map();
      batches.flat().forEach(function(match){
        const key=match.match_id || [
          match.game_world_id,
          match.competition_id,
          match.match_date,
          match.match_time,
          match.home_team_id || match.home_nation_id || "",
          match.away_team_id || match.away_nation_id || ""
        ].join("|");
        if(!byId.has(key)) byId.set(key,match);
      });

      const sourceMatches=Array.from(byId.values());
      const matches = removeResultsScheduleDuplicates(sourceMatches)
        .filter(StatisticsEngine.isScheduled.bind(StatisticsEngine))
        .filter(function(match){
          return !match.match_date || String(match.match_date) >= todayKey;
        })
        .sort(function(a,b){
          const dateDiff=String(a.match_date||"").localeCompare(String(b.match_date||""));
          if(dateDiff!==0) return dateDiff;
          return String(a.match_time||"").localeCompare(String(b.match_time||""));
        });

      target.innerHTML = renderGlobalSchedule(matches,inWorld ? "world" : "clubhouse");
    }catch(error){
      target.innerHTML = `
        <div class="nx-empty-box">
          <strong>Errore Schedule</strong>
          <span>${esc(error.message || "Impossibile leggere le prossime partite.")}</span>
        </div>`;
    }
  }

  function renderGlobalSchedule(matches,context){
    if(!matches.length){
      return `
        <div class="nx-empty-box">
          <strong>Nessuna partita programmata</strong>
          <span>${context === "world"
            ? "Non risultano prossime partite personali in questo Game World."
            : "Non risultano schedule future per i tuoi club o nazionali."}</span>
        </div>`;
    }

    const grouped = {};

    matches.forEach(function(match){
      const key = match.match_date || "Senza data";
      if(!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });

    return Object.keys(grouped).sort().map(function(date){
      return `
        <div class="nx-schedule-day">
          <div class="nx-schedule-day-head">
            <h2>${date === "Senza data" ? date : formatDate(date)}</h2>
            <span>${grouped[date].length} partite</span>
          </div>

          <div class="nx-entity-match-list nx-schedule-match-list">
            ${grouped[date].map(function(match){
              const competitionName =
                match.competition && match.competition.competition_name
                  ? getCompetitionDisplayName(match.competition.competition_name)
                  : "Competizione";

              const worldMeta = getWorldMeta(match.game_world_id);
              const worldName = worldMeta && worldMeta.name
                ? worldMeta.name
                : match.game_world_id;

              const matchType=scheduleMatchType(match);
              const typeLabel=matchType === "national" ? "NATIONAL TEAM" : "CLUB";
              const contextMeta=context === "clubhouse"
                ? `${esc(worldName)} · `
                : "";

              return `
                <div class="nx-entity-match nx-schedule-fixture ${matchType}">
                  <div class="nx-entity-match-meta">
                    <div class="nx-schedule-competition-line">
                      <strong>${esc(competitionVisualLabel(competitionName))}</strong>
                      <span class="nx-schedule-type-badge ${matchType}">${typeLabel}</span>
                    </div>
                    <span>${contextMeta}${match.match_time ? esc(String(match.match_time).slice(0,5)) : "Orario da definire"}</span>
                  </div>

                  <div class="match-line">
                    ${staticMatchParticipantMarkup(match,"home")}
                    <span class="match-score">VS</span>
                    ${staticMatchParticipantMarkup(match,"away")}
                  </div>
                </div>`;
            }).join("")}
          </div>
        </div>`;
    }).join("");
  }

  function globalH2HPage(){
    const worldId = state.selectedWorld || null;
    const worldConfig = worldId ? getWorldConfig(worldId) : null;

    setTimeout(loadGlobalH2H,0);

    return `
      <section class="nx-card">
        <div class="nx-page-title">
          <div>
            <h1>H2H</h1>
            <p>${worldId
              ? `${esc(worldId)} · ${esc(worldConfig ? worldConfig.name : "Game World")}`
              : "Tutti i Game World disponibili"}</p>
          </div>
        </div>

        <div class="nx-global-filter-note">
          Manager: <strong>${esc(state.user.full_name)}</strong>
        </div>

        <div id="globalH2HFilters"></div>

        <div id="globalH2HContent">
          <div class="nx-loading">Calcolo confronti diretti…</div>
        </div>
      </section>
    `;
  }

  function bindGlobalH2HPage(){}

  async function loadGlobalH2H(){
    const target = document.getElementById("globalH2HContent");
    if(!target || !state.client || !state.user) return;

    try{
      let assignmentsQuery = state.client
        .from("gw_manager_assignments")
        .select(`
          game_world_id,
          manager_id,
          team_id,
          nation_id,
          start_date,
          end_date,
          imc_managers(full_name)
        `);

      let matchesQuery = state.client
        .from("gw_matches")
        .select(`
          match_id,
          game_world_id,
          season_id,
          match_date,
          match_status,
          home_score,
          away_score,
          home_team_id,
          away_team_id,
          home_nation_id,
          away_nation_id,
          competition:gw_competitions!gw_matches_competition_id_fkey(
            competition_name
          ),
          home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
          away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),
          home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),
          away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)
        `)
        .eq("match_status","played")
        .order("match_date",{ascending:false});

      if(state.selectedWorld){
        assignmentsQuery = assignmentsQuery.eq("game_world_id",state.selectedWorld);
        matchesQuery = matchesQuery.eq("game_world_id",state.selectedWorld);
      }

      let seasonsQuery=state.client
        .from("gw_seasons")
        .select("season_id,game_world_id,season_number,season_status")
        .order("season_number",{ascending:false});

      if(state.selectedWorld){
        seasonsQuery=seasonsQuery.eq("game_world_id",state.selectedWorld);
      }

      const results = await Promise.all([assignmentsQuery,matchesQuery,seasonsQuery]);
      const assignmentsResult = results[0];
      const matchesResult = results[1];
      const seasonsResult = results[2];

      if(assignmentsResult.error) throw assignmentsResult.error;
      if(matchesResult.error) throw matchesResult.error;
      if(seasonsResult.error) throw seasonsResult.error;

      state.globalH2HCache={
        managerId:state.user.manager_id,
        assignments:assignmentsResult.data||[],
        matches:matchesResult.data||[],
        seasons:seasonsResult.data||[]
      };

      renderGlobalH2HWithSeasonFilter();
    }catch(error){
      target.innerHTML = `
        <div class="nx-empty-box">
          <strong>Errore H2H</strong>
          <span>${esc(error.message || "Impossibile calcolare i confronti diretti.")}</span>
        </div>`;
    }
  }


  function renderGlobalH2HWithSeasonFilter(){
    const target=document.getElementById("globalH2HContent");
    const filters=document.getElementById("globalH2HFilters");
    const cache=state.globalH2HCache;
    if(!target||!cache)return;

    const seasons=cache.seasons.slice().sort(function(a,b){
      if(a.game_world_id!==b.game_world_id){
        return String(a.game_world_id).localeCompare(String(b.game_world_id));
      }
      return Number(b.season_number)-Number(a.season_number);
    });

    if(filters){
      filters.innerHTML=`<div class="nx-setup-toolbar">
        <label>Stagione
          <select id="globalH2HSeasonFilter">
            <option value="all">All Time</option>
            ${seasons.map(function(season){
              const label=state.selectedWorld
                ? "Season "+season.season_number
                : season.game_world_id+" · Season "+season.season_number;
              return `<option value="${esc(season.season_id)}" ${String(state.globalH2HSeasonId)===String(season.season_id)?"selected":""}>${esc(label)}</option>`;
            }).join("")}
          </select>
        </label>
      </div>`;

      const select=document.getElementById("globalH2HSeasonFilter");
      if(select){
        select.value=String(state.globalH2HSeasonId||"all");
        select.addEventListener("change",function(){
          state.globalH2HSeasonId=select.value||"all";
          renderGlobalH2HWithSeasonFilter();
        });
      }
    }

    const filtered=String(state.globalH2HSeasonId)==="all"
      ? cache.matches
      : cache.matches.filter(function(match){
          return String(match.season_id)===String(state.globalH2HSeasonId);
        });

    target.innerHTML=renderGlobalH2H(
      cache.managerId,
      cache.assignments,
      filtered
    );
  }


  function renderGlobalH2H(managerId,assignments,matches){
    const managerNames = {};

    assignments.forEach(function(a){
      if(a.imc_managers && a.imc_managers.full_name){
        managerNames[a.manager_id] = a.imc_managers.full_name;
      }
    });

    const rivals = {};
    const detailedMatches = {};

    matches.forEach(function(match){
      const type = match.home_nation_id || match.away_nation_id
        ? "nation"
        : "club";

      const homeId = type === "club" ? match.home_team_id : match.home_nation_id;
      const awayId = type === "club" ? match.away_team_id : match.away_nation_id;

      const homeAssignment = findManagerForEntityInWorld(
        assignments,type,homeId,match.game_world_id,match.match_date
      );
      const awayAssignment = findManagerForEntityInWorld(
        assignments,type,awayId,match.game_world_id,match.match_date
      );

      if(!homeAssignment || !awayAssignment) return;

      let isHome = false;
      let rivalId = null;

      if(homeAssignment.manager_id === managerId){
        isHome = true;
        rivalId = awayAssignment.manager_id;
      }else if(awayAssignment.manager_id === managerId){
        isHome = false;
        rivalId = homeAssignment.manager_id;
      }else{
        return;
      }

      if(!rivalId || rivalId === managerId) return;

      if(!rivals[rivalId]){
        rivals[rivalId] = {
          manager_id:rivalId,
          name:managerNames[rivalId] || rivalId,
          played:0,
          won:0,
          drawn:0,
          lost:0,
          gf:0,
          ga:0
        };
        detailedMatches[rivalId] = [];
      }

      const gf = Number(isHome ? match.home_score : match.away_score);
      const ga = Number(isHome ? match.away_score : match.home_score);

      if(!Number.isFinite(gf) || !Number.isFinite(ga)) return;

      const item = rivals[rivalId];
      item.played += 1;
      item.gf += gf;
      item.ga += ga;

      if(gf > ga) item.won += 1;
      else if(gf < ga) item.lost += 1;
      else item.drawn += 1;

      detailedMatches[rivalId].push(match);
    });

    const list = Object.values(rivals).map(function(rival){
      rival.gd = rival.gf - rival.ga;
      return rival;
    }).sort(function(a,b){
      if(b.played !== a.played) return b.played - a.played;
      return a.name.localeCompare(b.name);
    });

    const positive = list.filter(function(r){ return r.won > r.lost; }).length;
    const equal = list.filter(function(r){ return r.won === r.lost; }).length;
    const negative = list.filter(function(r){ return r.won < r.lost; }).length;
    const totalMatches = list.reduce(function(sum,r){ return sum + r.played; },0);

    if(!list.length){
      return `
        <div class="nx-empty-box">
          <strong>Nessun confronto disponibile</strong>
          <span>Servono partite giocate tra manager IMC con incarichi registrati.</span>
        </div>`;
    }

    return `
      <div class="nx-stat-grid nx-h2h-summary-grid">
        ${statCard("Manager",list.length)}
        ${statCard("Partite",totalMatches)}
        ${statCard("Positivi",positive)}
        ${statCard("Pari",equal)}
        ${statCard("Negativi",negative)}
      </div>

      <div class="nx-h2h-list">
        ${list.map(function(rival){
          return `
            <details class="nx-h2h-details">
              <summary class="nx-h2h-row">
                <div>
                  <strong>${esc(rival.name)}</strong>
                  <span>${esc(rival.manager_id)} · ${rival.played} partite</span>
                </div>

                <div class="nx-stat-line">
                  <span>V ${rival.won}</span>
                  <span>N ${rival.drawn}</span>
                  <span>P ${rival.lost}</span>
                  <span>GF ${rival.gf}</span>
                  <span>GS ${rival.ga}</span>
                  <strong>DR ${formatSigned(rival.gd)}</strong>
                </div>
              </summary>

              <div class="nx-h2h-match-history">
                ${detailedMatches[rival.manager_id].map(function(match){
                  const competitionName =
                    match.competition && match.competition.competition_name
                      ? getCompetitionDisplayName(match.competition.competition_name)
                      : "Competizione";

                  return `
                    <div class="nx-entity-match">
                      <div class="nx-entity-match-meta">
                        <strong>${esc(competitionVisualLabel(competitionName))}</strong>
                        <span>${esc(match.game_world_id)}${match.season_id?" · S"+esc((state.globalH2HCache&&state.globalH2HCache.seasons.find(function(s){return String(s.season_id)===String(match.season_id);})||{}).season_number||"?"):""} · ${formatDate(match.match_date)}</span>
                      </div>

                      <div class="match-line">
                        ${staticMatchParticipantMarkup(match,"home")}
                        <span class="match-score">${match.home_score} - ${match.away_score}</span>
                        ${staticMatchParticipantMarkup(match,"away")}
                      </div>
                    </div>`;
                }).join("")}
              </div>
            </details>`;
        }).join("")}
      </div>`;
  }

  function findManagerForEntityInWorld(assignments,type,id,worldId,date){
    return assignments.find(function(a){
      if(a.game_world_id !== worldId) return false;

      const entityId = type === "club" ? a.team_id : a.nation_id;
      if(String(entityId) !== String(id)) return false;

      if(a.start_date && date < a.start_date) return false;
      if(a.end_date && date > a.end_date) return false;

      return true;
    });
  }


  function registryMembershipsFor(managerId){
    return Array.from(new Set((state.adminRegistryAssignments||[]).filter(function(row){return row.manager_id===managerId&&!row.end_date;}).map(function(row){return row.game_world_id;})));
  }
  function registryCareerCounts(managerId){
    const assignments=(state.adminRegistryAssignments||[]).filter(function(row){
      return String(row.manager_id)===String(managerId)&&!row.end_date;
    });

    const worlds=new Set();
    let clubs=0;
    let nations=0;

    assignments.forEach(function(row){
      if(row.game_world_id)worlds.add(row.game_world_id);
      if(row.team_id)clubs+=1;
      if(row.nation_id)nations+=1;
    });

    return {worlds:worlds.size,clubs:clubs,nations:nations};
  }

  function registryCareerCompactMarkup(managerId){
    const counts=registryCareerCounts(managerId);
    if(!counts.worlds&&!counts.clubs&&!counts.nations){
      return '<span class="nx-career-empty">Nessun incarico attivo</span>';
    }

    return `<div class="nx-career-summary">
      <span><strong>${counts.worlds}</strong> Game Worlds</span>
      <span><strong>${counts.clubs}</strong> Club</span>
      <span><strong>${counts.nations}</strong> Nazionali</span>
    </div>`;
  }

  function registryCareerSummary(managerId){
    return (state.adminRegistryAssignments||[]).filter(function(row){return row.manager_id===managerId&&!row.end_date;}).map(function(row){
      const entity=row.gw_teams&&teamDisplayName(row.gw_teams)?teamDisplayName(row.gw_teams):(row.imc_national_teams&&row.imc_national_teams.nation_name?row.imc_national_teams.nation_name:"");
      return row.game_world_id+(entity?" · "+entity:"");
    });
  }

  function adminManagerRegistryPage(){
    return `
      <section class="nx-admin-shell nx-registry-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backAdminRegistry">‹ Admin Console</button>
          <small>GLOBAL MANAGER DATABASE</small>
          <h1>Manager Registry</h1>
          <p>I dati vengono letti e salvati direttamente su Supabase.</p>
        </div>

        <div class="nx-registry-toolbar">
          <input id="registrySearch" type="search" placeholder="Cerca nome o Manager ID">
          <button class="nx-secondary-action nx-registry-refresh" id="refreshManagerRegistry">↻ Aggiorna</button>
          <button class="nx-primary-action" id="newRegistryManager">＋ Nuovo manager</button>
        </div>

        <div id="registryAccountSummary" class="nx-registry-account-summary"></div>
        <div id="registryStatus" class="status" aria-live="polite"></div>
        <div id="registryCredentials"></div>
        <div id="registryEditor"></div>
        <div id="registryList" class="nx-registry-list">
          <div class="nx-empty-state">Caricamento Manager Registry…</div>
        </div>
      </section>`;
  }

  function bindAdminManagerRegistry(){
    document.getElementById("backAdminRegistry").addEventListener("click",function(){
      state.adminPage="home";
      state.adminRegistryEditingId=null;
      renderShell();
    });
    document.getElementById("newRegistryManager").addEventListener("click",function(){
      state.adminRegistryEditingId="";
      renderRegistryEditor(null);
    });
    document.getElementById("registrySearch").addEventListener("input",renderRegistryList);
    document.getElementById("refreshManagerRegistry").addEventListener("click",async function(){
      const button=this;
      button.disabled=true;
      button.textContent="↻ Aggiorno…";
      try{
        await loadAdminManagerRegistry();
      }finally{
        button.disabled=false;
        button.textContent="↻ Aggiorna";
      }
    });
    loadAdminManagerRegistry();
  }

  async function loadAdminManagerRegistry(){
    const status=document.getElementById("registryStatus");
    try{
      const managersResult=await state.client
        .from("imc_managers")
        .select("manager_id,full_name,imc_join_date")
        .order("manager_id",{ascending:true});
      if(managersResult.error) throw managersResult.error;

      const assignmentsResult=await state.client
        .from("gw_manager_assignments")
        .select("assignment_id,manager_id,game_world_id,team_id,nation_id,start_date,end_date,gw_teams(team_id,team_name,display_name),imc_national_teams(nation_name)");
      if(assignmentsResult.error) throw assignmentsResult.error;

      const accountsResult=await state.client
        .from("nexus_users")
        .select("user_id,manager_id,app_role,is_active,must_change_password,password_changed_at,created_at");
      if(accountsResult.error) throw accountsResult.error;

      state.adminRegistryManagers=managersResult.data||[];
      state.adminRegistryAssignments=assignmentsResult.data||[];
      state.adminRegistryAccounts=accountsResult.data||[];
      state.adminRegistryMemberships=[];
      status.textContent="";
      renderRegistryList();
    }catch(error){
      status.className="status error";
      status.textContent=(error && error.message ? error.message : "Impossibile caricare il Manager Registry.") + " Verifica di avere eseguito il file SQL incluso nella patch.";
    }
  }

  function registryAccountFor(managerId){
    return (state.adminRegistryAccounts||[]).find(function(row){
      return String(row.manager_id)===String(managerId);
    })||null;
  }

  function formatRegistryActivationDate(value){
    if(!value)return "";
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return "";
    return new Intl.DateTimeFormat("it-IT",{
      day:"2-digit",
      month:"2-digit",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit"
    }).format(date);
  }

  function registryAccountState(account){
    if(!account){
      return {
        key:"missing",
        label:"Non configurato",
        detail:"Nessun account Nexus"
      };
    }
    if(account.is_active!==true){
      return {
        key:"inactive",
        label:"Disattivato",
        detail:"Account Nexus disattivato"
      };
    }
    if(account.app_role==="admin"){
      return {
        key:"admin",
        label:"Admin",
        detail:"Account amministratore"
      };
    }
    if(account.must_change_password===true){
      return {
        key:"pending",
        label:"In attesa",
        detail:"Primo accesso non completato"
      };
    }
    return {
      key:"active",
      label:"Attivato",
      detail:account.password_changed_at
        ?"Password personale · "+formatRegistryActivationDate(account.password_changed_at)
        :"Password personale impostata"
    };
  }

  function registryAccountBadge(managerId){
    const stateInfo=registryAccountState(registryAccountFor(managerId));
    return '<span class="nx-account-badge '+esc(stateInfo.key)+'">'+esc(stateInfo.label)+'</span>';
  }

  function renderRegistryAccountSummary(){
    const target=document.getElementById("registryAccountSummary");
    if(!target)return;

    const accounts=state.adminRegistryAccounts||[];
    const admins=accounts.filter(function(account){
      return account.app_role==="admin"&&account.is_active===true;
    }).length;
    const activated=accounts.filter(function(account){
      return account.app_role!=="admin"&&
        account.is_active===true&&
        account.must_change_password===false;
    }).length;
    const pending=accounts.filter(function(account){
      return account.app_role!=="admin"&&
        account.is_active===true&&
        account.must_change_password===true;
    }).length;

    target.innerHTML=`
      <div class="nx-registry-summary-pill">
        <strong>${accounts.length}</strong>
        <span>Account</span>
      </div>
      <div class="nx-registry-summary-pill is-active">
        <strong>${activated}</strong>
        <span>Attivati</span>
      </div>
      <div class="nx-registry-summary-pill is-pending">
        <strong>${pending}</strong>
        <span>In attesa</span>
      </div>
      <div class="nx-registry-summary-pill is-admin">
        <strong>${admins}</strong>
        <span>Admin</span>
      </div>`;
  }

  function renderRegistryCredentials(credentials,title){
    const target=document.getElementById("registryCredentials");
    if(!target)return;
    const rows=Array.isArray(credentials)?credentials:[credentials];
    if(!rows.length){target.innerHTML="";return;}
    state.adminRegistryCredentials=rows;
    target.innerHTML=`<section class="nx-credentials-panel">
      <div class="nx-credentials-head">
        <div><small>ACCESSI NEXUS</small><h3>${esc(title||"Credenziali create")}</h3></div>
        <button type="button" class="nx-secondary-action" id="copyRegistryCredentials">Copia tutto</button>
      </div>
      <p>Le password temporanee vengono mostrate ora. Conservale prima di chiudere questa sezione.</p>
      <div class="nx-credentials-list">
        ${rows.map(function(row){
          return `<div class="nx-credential-row">
            <div><strong>${esc(row.manager_id)}</strong><span>${esc(row.full_name||row.manager_name||"")}</span></div>
            <code>${esc(row.temporary_password)}</code>
          </div>`;
        }).join("")}
      </div>
    </section>`;
    const copy=document.getElementById("copyRegistryCredentials");
    if(copy)copy.addEventListener("click",async function(){
      const text=rows.map(function(row){
        return "Manager ID: "+row.manager_id+"\nPassword temporanea: "+row.temporary_password;
      }).join("\n\n");
      try{
        await navigator.clipboard.writeText(text);
        copy.textContent="Copiato";
      }catch(_){
        window.prompt("Copia le credenziali:",text);
      }
    });
  }

  function renderRegistryList(){
    const target=document.getElementById("registryList");
    const search=document.getElementById("registrySearch");
    if(!target)return;
    renderRegistryAccountSummary();
    const query=String(search ? search.value : "").trim().toLowerCase();
    const rows=state.adminRegistryManagers.filter(function(manager){
      return !query || manager.manager_id.toLowerCase().includes(query) || manager.full_name.toLowerCase().includes(query);
    });

    if(!rows.length){
      target.innerHTML='<div class="nx-empty-state">Nessun manager trovato.</div>';
      return;
    }

    target.innerHTML=rows.map(function(manager){
      const worlds=registryCareerSummary(manager.manager_id);
      const date=manager.imc_join_date ? formatDate(manager.imc_join_date) : "Data non indicata";
      return `<button class="nx-registry-row" data-registry-manager="${esc(manager.manager_id)}">
        <div class="nx-registry-main">
          <strong>${esc(manager.full_name)}</strong>
          <span>${esc(manager.manager_id)} · ${esc(date)}</span>
        </div>
        <div class="nx-registry-row-meta">
          ${registryCareerCompactMarkup(manager.manager_id)}
          ${registryAccountBadge(manager.manager_id)}
        </div>
        <b aria-hidden="true">›</b>
      </button>`;
    }).join("");

    target.querySelectorAll("[data-registry-manager]").forEach(function(button){
      button.addEventListener("click",function(){
        const id=button.getAttribute("data-registry-manager");
        const manager=state.adminRegistryManagers.find(function(row){return row.manager_id===id;});
        state.adminRegistryEditingId=id;
        renderRegistryEditor(manager);
      });
    });
  }

  function renderRegistryEditor(manager){
    const target=document.getElementById("registryEditor");
    if(!target) return;
    const isEdit=Boolean(manager);
    target.innerHTML=`
      <form class="nx-registry-editor" id="registryForm">
        <div class="nx-registry-editor-head">
          <div><small>${isEdit ? "MODIFICA MANAGER" : "NUOVO MANAGER"}</small><h2>${isEdit ? esc(manager.full_name) : "Inserisci i dati"}</h2></div>
          <button type="button" class="nx-secondary-action" id="closeRegistryEditor">Chiudi</button>
        </div>
        <label>Manager ID
          <input id="registryManagerId" required maxlength="6" pattern="MNG[0-9]{3}" placeholder="MNG055" value="${isEdit ? esc(manager.manager_id) : ""}" ${isEdit ? "readonly" : ""}>
        </label>
        <label>Nome Manager
          <input id="registryFullName" required maxlength="120" placeholder="Nome Cognome" value="${isEdit ? esc(manager.full_name) : ""}">
        </label>
        <label>Data ingresso IMC
          <input id="registryJoinDate" type="date" required value="${isEdit && manager.imc_join_date ? esc(manager.imc_join_date) : ""}">
        </label>
        ${isEdit?`<div class="nx-registry-readonly-career"><strong>Incarichi attivi</strong><p>${registryCareerSummary(manager.manager_id).length?registryCareerSummary(manager.manager_id).map(esc).join("<br>"):"Nessun incarico attivo. Gli incarichi vengono gestiti nel Game World Setup."}</p></div>
        <div class="nx-manager-account-card">
          <div>
            <small>ACCOUNT NEXUS</small>
            <strong>${esc(registryAccountState(registryAccountFor(manager.manager_id)).label)}</strong>
            <span>${esc(registryAccountState(registryAccountFor(manager.manager_id)).detail)}</span>
          </div>
          ${registryAccountFor(manager.manager_id)&&manager.manager_id!=="MNG001"
            ? `<button type="button" class="nx-secondary-action" id="resetRegistryNexusPassword">Reset password</button>`
            : ""}
        </div>`:""}
        <button class="nx-primary-action nx-save-manager" type="submit">Salva su Supabase</button>
      </form>`;

    document.getElementById("closeRegistryEditor").addEventListener("click",function(){
      state.adminRegistryEditingId=null;
      target.innerHTML="";
    });
    document.getElementById("registryManagerId").addEventListener("input",function(event){
      event.target.value=event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
    });
    document.getElementById("registryForm").addEventListener("submit",saveRegistryManager);
    const resetPasswordButton=document.getElementById("resetRegistryNexusPassword");
    if(resetPasswordButton){
      resetPasswordButton.addEventListener("click",async function(){
        if(!window.confirm("Generare una nuova password temporanea per "+manager.full_name+"?"))return;
        resetPasswordButton.disabled=true;
        const status=document.getElementById("registryStatus");
        status.className="status";
        status.textContent="Reset password per "+manager.manager_id+"…";
        try{
          const result=await state.client.functions.invoke("reset-manager-password",{
            body:{manager_id:manager.manager_id}
          });

          if(result.error){
            let message=result.error.message||"Reset password non riuscito.";
            if(result.error.context&&typeof result.error.context.json==="function"){
              try{
                const details=await result.error.context.json();
                if(details&&details.error)message=details.error;
              }catch(_){}
            }
            throw new Error(message);
          }

          if(!result.data||!result.data.temporary_password){
            throw new Error(result.data&&result.data.error?result.data.error:"La funzione non ha restituito la password temporanea.");
          }

          const account=registryAccountFor(manager.manager_id);
          if(account)account.must_change_password=true;

          renderRegistryCredentials(result.data,"Password reimpostata");
          status.className="status success";
          status.textContent="Nuova password temporanea generata per "+manager.manager_id+".";
          renderRegistryList();
          renderRegistryEditor(manager);
        }catch(error){
          status.className="status error";
          status.textContent=error&&error.message?error.message:"Reset password non riuscito.";
          resetPasswordButton.disabled=false;
        }
      });
    }
    target.scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function saveRegistryManager(event){
    event.preventDefault();
    const status=document.getElementById("registryStatus");
    const submit=event.currentTarget.querySelector("button[type=submit]");
    const managerId=document.getElementById("registryManagerId").value.trim().toUpperCase();
    const fullName=document.getElementById("registryFullName").value.trim();
    const joinDate=document.getElementById("registryJoinDate").value;

    if(!/^MNG\d{3}$/.test(managerId)){
      status.className="status error";
      status.textContent="Il Manager ID deve avere il formato MNG###.";
      return;
    }
    if(!fullName || !joinDate){
      status.className="status error";
      status.textContent="Compila Nome Manager e Data ingresso IMC.";
      return;
    }

    submit.disabled=true;
    submit.textContent="Salvataggio…";
    status.className="status";
    status.textContent="Salvataggio del manager in corso…";

    try{
      if(state.adminRegistryEditingId){
        const updateResult=await state.client
          .from("imc_managers")
          .update({full_name:fullName,imc_join_date:joinDate})
          .eq("manager_id",managerId);
        if(updateResult.error) throw updateResult.error;
      }else{
        const insertResult=await state.client
          .from("imc_managers")
          .insert({manager_id:managerId,full_name:fullName,imc_join_date:joinDate});
        if(insertResult.error)throw insertResult.error;
      }

      status.className="status success";
      status.textContent=state.adminRegistryEditingId
        ?"Manager aggiornato correttamente."
        :"Manager creato correttamente. L'account Nexus va attivato separatamente.";
      state.adminRegistryEditingId=null;
      document.getElementById("registryEditor").innerHTML="";
      await loadAdminManagerRegistry();
    }catch(error){
      status.className="status error";
      status.textContent=error && error.message ? error.message : "Salvataggio non riuscito.";
    }finally{
      submit.disabled=false;
      submit.textContent="Salva su Supabase";
    }
  }


  const STANDARD_COMPETITIONS = [
    {competition_id:"COMP_DOM_001",competition_name:"League",competition_category:"domestic"},
    {competition_id:"COMP_DOM_002",competition_name:"National Cup",competition_category:"domestic"},
    {competition_id:"COMP_DOM_003",competition_name:"League Cup",competition_category:"domestic"},
    {competition_id:"COMP_DOM_004",competition_name:"Charity Shield",competition_category:"domestic"},
    {competition_id:"COMP_DOM_005",competition_name:"Playoff",competition_category:"domestic"},
    {competition_id:"COMP_INT_001",competition_name:"SMFA Champions",competition_category:"international"},
    {competition_id:"COMP_INT_002",competition_name:"SMFA Shield",competition_category:"international"},
    {competition_id:"COMP_INT_003",competition_name:"SMFA Super Cup",competition_category:"international"},
    {competition_id:"COMP_NAT_001",competition_name:"World Cup Qualifying",competition_category:"nations"},
    {competition_id:"COMP_NAT_002",competition_name:"World Cup",competition_category:"nations"}
  ];

  function canonicalDomesticCupDisplayName(value){
    const raw=String(value||"").trim();

    // Stato interno / DB legacy -> nomenclatura visuale nuova.
    if(/^League Shield$/i.test(raw))return "League Cup";
    if(/^League Cup$/i.test(raw))return "National Cup";
    if(/·\s*League Shield$/i.test(raw))return raw.replace(/League Shield$/i,"League Cup");
    if(/·\s*League Cup$/i.test(raw))return raw.replace(/League Cup$/i,"National Cup");

    return raw;
  }

  function competitionDbNameFromVisual(value){
    const raw=String(value||"").trim();

    // Nuova nomenclatura URL/UI -> DB legacy.
    if(/^National Cup$/i.test(raw))return "League Cup";
    if(/^League Cup$/i.test(raw))return "League Shield";
    if(/·\s*National Cup$/i.test(raw))return raw.replace(/National Cup$/i,"League Cup");
    if(/·\s*League Cup$/i.test(raw))return raw.replace(/League Cup$/i,"League Shield");

    // Compatibilità con vecchi URL già condivisi.
    if(/^League Shield$/i.test(raw) || /·\s*League Shield$/i.test(raw))return raw;

    return raw;
  }

  function competitionVisualLabel(value){
    const canonical=canonicalDomesticCupDisplayName(value);
    const raw=String(canonical||"").replace(/\\s*·\\s*/g," ").trim();
    const words={"1":"One","2":"Two","3":"Three","4":"Four","5":"Five"};
    return raw.replace(/Division\\s+([1-5])/gi,function(_,number){
      return "Division "+(words[number]||number);
    });
  }

  function competitionCategoryLabel(category){
    return {domestic:"Domestic",international:"International",nations:"Nations"}[category] || category;
  }

  function adminCompetitionRegistryPage(){
    return `
      <section class="nx-admin-shell nx-registry-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backCompetitionRegistry">‹ Admin Console</button>
          <small>GLOBAL COMPETITION DATABASE</small>
          <h1>Competition Registry</h1>
          <p>Catalogo ufficiale delle competizioni standard condivise da tutti i Game World.</p>
        </div>
        <div id="competitionRegistryStatus" class="status" aria-live="polite"></div>
        <div id="competitionRegistryContent" class="nx-competition-registry">
          <div class="nx-empty-state">Caricamento Competition Registry…</div>
        </div>
      </section>`;
  }

  function bindAdminCompetitionRegistry(){
    document.getElementById("backCompetitionRegistry").addEventListener("click",function(){
      state.adminPage="home";
      renderShell();
    });
    loadAdminCompetitionRegistry();
  }

  async function loadAdminCompetitionRegistry(){
    const status=document.getElementById("competitionRegistryStatus");
    try{
      const result=await state.client
        .from("imc_competitions")
        .select("competition_id,competition_name,competition_category")
        .order("competition_id",{ascending:true});
      if(result.error) throw result.error;
      state.adminCompetitions=result.data || [];
      status.textContent="";
      renderCompetitionRegistry();
    }catch(error){
      status.className="status error";
      status.textContent=error && error.message ? error.message : "Impossibile caricare il Competition Registry.";
    }
  }

  function renderCompetitionRegistry(){
    const target=document.getElementById("competitionRegistryContent");
    if(!target) return;
    const categories=["domestic","international","nations"];
    target.innerHTML=categories.map(function(category){
      const rows=state.adminCompetitions.filter(function(item){return item.competition_category===category;});
      return `<section class="nx-competition-group">
        <div class="nx-competition-group-head"><span>${category==="domestic"?"🏠":category==="international"?"🌍":"🌎"}</span><div><small>STANDARD LEVEL</small><h2>${competitionCategoryLabel(category)}</h2></div></div>
        <div class="nx-registry-list">${rows.map(function(item){
          return `<div class="nx-registry-row nx-static-row"><div><strong>${esc(item.competition_name)}</strong><span>${esc(item.competition_id)}</span></div><small>Standard globale</small><b>✓</b></div>`;
        }).join("")}</div>
      </section>`;
    }).join("");
  }

  function trophyCompetitionName(id){
    const row=state.adminCompetitions.find(function(item){return item.competition_id===id;});
    return row ? row.competition_name : id;
  }

  function trophyWorldName(id){
    const world=getWorldMeta(id);
    return world ? world.name : id;
  }

  function trophySeasonLabel(seasonId){
    const row=state.adminTrophySeasons.find(function(item){return String(item.season_id)===String(seasonId);});
    return row ? "Season "+row.season_number : "Season";
  }

  function trophyWinnerName(row){
    if(row.winning_team_id){
      const team=state.adminTrophyTeams.find(function(item){return String(item.team_id)===String(row.winning_team_id);});
      return team ? teamDisplayName(team) : "Team #"+row.winning_team_id;
    }
    if(row.winning_nation_id){
      const nation=state.adminTrophyNations.find(function(item){return String(item.nation_id)===String(row.winning_nation_id);});
      return nation ? nation.nation_name : "Nation #"+row.winning_nation_id;
    }
    return "Vincitore non indicato";
  }

  function trophyManagerName(managerId){
    const row=state.adminRegistryManagers.find(function(item){return item.manager_id===managerId;});
    return row ? row.full_name : managerId;
  }

  function adminTrophyRegistryPage(){
    return `
      <section class="nx-admin-shell nx-registry-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backTrophyRegistry">‹ Admin Console</button>
          <small>GLOBAL HONOURS DATABASE</small>
          <h1>Trophy Registry</h1>
          <p>Registra il vincitore di ogni competizione per Game World e stagione.</p>
        </div>
        <div class="nx-registry-toolbar">
          <input id="trophySearch" type="search" placeholder="Cerca competizione, mondo, vincitore o manager">
          <button class="nx-primary-action" id="newTrophyRecord">＋ Nuovo trofeo</button>
        </div>
        <div id="trophyRegistryStatus" class="status" aria-live="polite"></div>
        <div id="trophyRegistryEditor"></div>
        <div id="trophyRegistryList" class="nx-registry-list"><div class="nx-empty-state">Caricamento Trophy Registry…</div></div>
      </section>`;
  }

  function bindAdminTrophyRegistry(){
    document.getElementById("backTrophyRegistry").addEventListener("click",function(){state.adminPage="home";state.adminTrophyEditingId=null;renderShell();});
    document.getElementById("newTrophyRecord").addEventListener("click",function(){state.adminTrophyEditingId=null;renderTrophyEditor(null);});
    document.getElementById("trophySearch").addEventListener("input",renderTrophyRegistryList);
    loadAdminTrophyRegistry();
  }

  async function loadAdminTrophyRegistry(){
    const status=document.getElementById("trophyRegistryStatus");
    try{
      const results=await Promise.all([
        state.client.from("imc_competitions").select("competition_id,competition_name,competition_category").order("competition_id",{ascending:true}),
        state.client.from("imc_trophies").select("trophy_id,competition_id,game_world_id,season_id,winning_team_id,winning_nation_id,winning_manager_id,won_on").order("trophy_id",{ascending:false}),
        state.client.from("gw_teams").select("team_id,game_world_id,team_name,display_name").order("display_name",{ascending:true,nullsFirst:false}),
        state.client.from("imc_national_teams").select("nation_id,nation_name").order("nation_name",{ascending:true}),
        state.client.from("gw_seasons").select("season_id,game_world_id,season_number").order("season_number",{ascending:true}),
        state.client.from("imc_managers").select("manager_id,full_name").order("full_name",{ascending:true})
      ]);
      results.forEach(function(result){if(result.error) throw result.error;});
      state.adminCompetitions=results[0].data || [];
      state.adminTrophies=results[1].data || [];
      state.adminTrophyTeams=results[2].data || [];
      state.adminTrophyNations=results[3].data || [];
      state.adminTrophySeasons=results[4].data || [];
      state.adminRegistryManagers=results[5].data || [];
      status.textContent="";
      renderTrophyRegistryList();
    }catch(error){
      status.className="status error";
      status.textContent=error && error.message ? error.message : "Impossibile caricare il Trophy Registry.";
    }
  }

  function renderTrophyRegistryList(){
    const target=document.getElementById("trophyRegistryList");
    const search=document.getElementById("trophySearch");
    if(!target) return;
    const query=String(search ? search.value : "").trim().toLowerCase();
    const rows=state.adminTrophies.filter(function(row){
      const text=[trophyCompetitionName(row.competition_id),row.game_world_id,trophyWorldName(row.game_world_id),trophyWinnerName(row),trophyManagerName(row.winning_manager_id),trophySeasonLabel(row.season_id)].join(" ").toLowerCase();
      return !query || text.includes(query);
    });
    if(!rows.length){target.innerHTML='<div class="nx-empty-state">Nessun trofeo registrato.</div>';return;}
    target.innerHTML=rows.map(function(row){
      return `<button class="nx-registry-row nx-trophy-row" data-trophy-id="${esc(row.trophy_id)}">
        <div><strong>${esc(trophyCompetitionName(row.competition_id))}</strong><span>${esc(row.game_world_id)} · ${esc(trophySeasonLabel(row.season_id))} · ${esc(trophyWinnerName(row))}</span></div>
        <small>${esc(trophyManagerName(row.winning_manager_id))}${row.won_on ? " · "+esc(formatDate(row.won_on)) : ""}</small><b>›</b>
      </button>`;
    }).join("");
    target.querySelectorAll("[data-trophy-id]").forEach(function(button){
      button.addEventListener("click",function(){
        const id=button.getAttribute("data-trophy-id");
        const row=state.adminTrophies.find(function(item){return String(item.trophy_id)===String(id);});
        state.adminTrophyEditingId=id;
        renderTrophyEditor(row);
      });
    });
  }

  function renderTrophyEditor(row){
    const target=document.getElementById("trophyRegistryEditor");
    if(!target) return;
    const isEdit=Boolean(row);
    const worldId=isEdit ? row.game_world_id : (state.worlds[0] ? state.worlds[0].id : "");
    target.innerHTML=`<form class="nx-registry-editor" id="trophyRegistryForm">
      <div class="nx-registry-editor-head"><div><small>${isEdit?"MODIFICA TROFEO":"NUOVO TROFEO"}</small><h2>${isEdit?esc(trophyCompetitionName(row.competition_id)):"Inserisci il vincitore"}</h2></div><button type="button" class="nx-secondary-action" id="closeTrophyEditor">Chiudi</button></div>
      <label>Competizione<select id="trophyCompetition" required>${state.adminCompetitions.map(function(item){return `<option value="${esc(item.competition_id)}" ${isEdit&&item.competition_id===row.competition_id?"selected":""}>${esc(competitionCategoryLabel(item.competition_category))} · ${esc(item.competition_name)}</option>`;}).join("")}</select></label>
      <label>Game World<select id="trophyWorld" required>${state.worlds.map(function(world){return `<option value="${esc(world.id)}" ${world.id===worldId?"selected":""}>${esc(world.id)} · ${esc(world.name)}</option>`;}).join("")}</select></label>
      <label>Stagione<select id="trophySeason" required></select></label>
      <fieldset class="nx-world-memberships nx-winner-type"><legend>Tipo vincitore</legend><div><label><input type="radio" name="trophyWinnerType" value="team" ${!isEdit||row.winning_team_id?"checked":""}><span><strong>Club</strong>Squadra del Game World</span></label><label><input type="radio" name="trophyWinnerType" value="nation" ${isEdit&&row.winning_nation_id?"checked":""}><span><strong>Nazionale</strong>National Team</span></label></div></fieldset>
      <label id="trophyTeamLabel">Squadra vincitrice<select id="trophyTeam"></select></label>
      <label id="trophyNationLabel">Nazionale vincitrice<select id="trophyNation">${state.adminTrophyNations.map(function(item){return `<option value="${esc(item.nation_id)}" ${isEdit&&String(item.nation_id)===String(row.winning_nation_id)?"selected":""}>${esc(item.nation_name)}</option>`;}).join("")}</select></label>
      <label>Manager vincitore<select id="trophyManager" required>${state.adminRegistryManagers.map(function(item){return `<option value="${esc(item.manager_id)}" ${isEdit&&item.manager_id===row.winning_manager_id?"selected":""}>${esc(item.full_name)} · ${esc(item.manager_id)}</option>`;}).join("")}</select></label>
      <label>Data vittoria <span class="nx-optional">(facoltativa)</span><input id="trophyWonOn" type="date" value="${isEdit&&row.won_on?esc(row.won_on):""}"></label>
      <div class="nx-editor-actions"><button class="nx-primary-action" type="submit">Salva su Supabase</button>${isEdit?'<button class="nx-danger-action" type="button" id="deleteTrophyRecord">Elimina trofeo</button>':""}</div>
    </form>`;
    function refreshSelections(){
      const selectedWorld=document.getElementById("trophyWorld").value;
      const season=document.getElementById("trophySeason");
      const seasons=state.adminTrophySeasons.filter(function(item){return item.game_world_id===selectedWorld;});
      season.innerHTML=seasons.map(function(item){return `<option value="${esc(item.season_id)}" ${isEdit&&String(item.season_id)===String(row.season_id)?"selected":""}>Season ${esc(item.season_number)}</option>`;}).join("");
      const team=document.getElementById("trophyTeam");
      const teams=state.adminTrophyTeams.filter(function(item){return item.game_world_id===selectedWorld;});
      team.innerHTML=teams.map(function(item){return `<option value="${esc(item.team_id)}" ${isEdit&&String(item.team_id)===String(row.winning_team_id)?"selected":""}>${esc(teamDisplayName(item))}</option>`;}).join("");
    }
    function refreshWinnerType(){
      const type=document.querySelector('input[name="trophyWinnerType"]:checked').value;
      document.getElementById("trophyTeamLabel").hidden=type!=="team";
      document.getElementById("trophyNationLabel").hidden=type!=="nation";
    }
    refreshSelections();refreshWinnerType();
    document.getElementById("trophyWorld").addEventListener("change",refreshSelections);
    document.querySelectorAll('input[name="trophyWinnerType"]').forEach(function(input){input.addEventListener("change",refreshWinnerType);});
    document.getElementById("closeTrophyEditor").addEventListener("click",function(){target.innerHTML="";state.adminTrophyEditingId=null;});
    document.getElementById("trophyRegistryForm").addEventListener("submit",saveTrophyRecord);
    if(isEdit) document.getElementById("deleteTrophyRecord").addEventListener("click",deleteTrophyRecord);
    target.scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function saveTrophyRecord(event){
    event.preventDefault();
    const status=document.getElementById("trophyRegistryStatus");
    const submit=event.currentTarget.querySelector('button[type="submit"]');
    const winnerType=document.querySelector('input[name="trophyWinnerType"]:checked').value;
    const payload={
      competition_id:document.getElementById("trophyCompetition").value,
      game_world_id:document.getElementById("trophyWorld").value,
      season_id:Number(document.getElementById("trophySeason").value),
      winning_team_id:winnerType==="team" ? Number(document.getElementById("trophyTeam").value) : null,
      winning_nation_id:winnerType==="nation" ? Number(document.getElementById("trophyNation").value) : null,
      winning_manager_id:document.getElementById("trophyManager").value,
      won_on:document.getElementById("trophyWonOn").value || null
    };
    if(!payload.season_id || (winnerType==="team"&&!payload.winning_team_id) || (winnerType==="nation"&&!payload.winning_nation_id)){
      status.className="status error";status.textContent="Completa stagione e vincitore.";return;
    }
    submit.disabled=true;submit.textContent="Salvataggio…";
    try{
      let result;
      if(state.adminTrophyEditingId){result=await state.client.from("imc_trophies").update(payload).eq("trophy_id",state.adminTrophyEditingId);}
      else{result=await state.client.from("imc_trophies").insert(payload);}
      if(result.error) throw result.error;
      status.className="status success";status.textContent="Trofeo salvato correttamente su Supabase.";
      document.getElementById("trophyRegistryEditor").innerHTML="";state.adminTrophyEditingId=null;
      await loadAdminTrophyRegistry();
    }catch(error){status.className="status error";status.textContent=error&&error.message?error.message:"Salvataggio non riuscito.";}
    finally{submit.disabled=false;submit.textContent="Salva su Supabase";}
  }

  async function deleteTrophyRecord(){
    if(!state.adminTrophyEditingId || !window.confirm("Eliminare definitivamente questo trofeo dal Registry?")) return;
    const status=document.getElementById("trophyRegistryStatus");
    try{
      const result=await state.client.from("imc_trophies").delete().eq("trophy_id",state.adminTrophyEditingId);
      if(result.error) throw result.error;
      status.className="status success";status.textContent="Trofeo eliminato.";
      document.getElementById("trophyRegistryEditor").innerHTML="";state.adminTrophyEditingId=null;
      await loadAdminTrophyRegistry();
    }catch(error){status.className="status error";status.textContent=error&&error.message?error.message:"Eliminazione non riuscita.";}
  }


  function adminGameWorldSetupPage(){
    const options=state.worlds.map(function(world){return `<option value="${esc(world.id)}" ${world.id===state.adminGwSetupWorldId?"selected":""}>${esc(world.id)} · ${esc(world.name)}</option>`;}).join("");
    return `
      <section class="nx-admin-shell nx-gw-setup-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backGameWorldSetup">‹ Admin Console</button>
          <small>GAME WORLD DASHBOARD · ${NEXUS_BUILD_LABEL}</small>
          <h1>Game World Setup</h1>
          <p>Gestisci stagione, incarichi, competizioni e configurazione del Game World.</p>
        </div>
        <div class="nx-setup-toolbar">
          <label>Game World<select id="gwSetupWorld"><option value="">Seleziona Game World</option>${options}</select></label>
          <button class="primary" id="loadGwSetup" type="button">Apri configurazione</button>
        </div>
        <div id="gwSetupStatus" class="status"></div>
        <div id="gwSetupBody" class="nx-gw-setup-body"><div class="nx-empty-state">Seleziona un Game World per iniziare.</div></div>
      </section>`;
  }

  function bindAdminGameWorldSetup(){
    document.getElementById("backGameWorldSetup").addEventListener("click",function(){state.adminPage="home";renderShell();});
    const select=document.getElementById("gwSetupWorld");
    document.getElementById("loadGwSetup").addEventListener("click",async function(){
      state.adminGwSetupWorldId=select.value;
      if(!state.adminGwSetupWorldId){setGwSetupStatus("Seleziona un Game World.","error");return;}
      await loadAdminGameWorldSetup();
    });
    if(state.adminGwSetupWorldId) loadAdminGameWorldSetup();
  }

  function setGwSetupStatus(message,type){
    const node=document.getElementById("gwSetupStatus");
    if(!node) return;
    node.className="status"+(type?" "+type:"");
    node.textContent=message||"";
  }

  async function loadAdminGameWorldSetup(){
    const worldId=state.adminGwSetupWorldId;
    const body=document.getElementById("gwSetupBody");
    if(!worldId||!body) return;
    body.innerHTML='<div class="nx-empty-state">Caricamento configurazione…</div>';
    setGwSetupStatus("","");
    try{
      const results=await Promise.all([
        state.client.from("gw_seasons").select("season_id,game_world_id,season_number,season_status,start_date,end_date").eq("game_world_id",worldId).order("season_number",{ascending:true}),
        state.client.from("gw_world_settings").select("game_world_id,active_season_id").eq("game_world_id",worldId).maybeSingle(),
        state.client.from("gw_setup_nations").select("nation_setup_id,game_world_id,nation_name,sort_order").eq("game_world_id",worldId).order("sort_order",{ascending:true}),
        state.client.from("gw_league_setups").select("league_setup_id,game_world_id,nation_setup_id,division_count,teams_per_division,league_cup,league_shield,playoff,charity_shield").eq("game_world_id",worldId),
        state.client.from("gw_division_setups").select("division_setup_id,game_world_id,nation_setup_id,division_number,team_count").eq("game_world_id",worldId).order("division_number",{ascending:true}),
        state.client.from("gw_setup_team_divisions").select("setup_team_id,game_world_id,season_id,nation_setup_id,division_number,team_id,gw_teams(team_id,team_name,display_name)").eq("game_world_id",worldId).order("division_number",{ascending:true}),
        state.client.from("imc_managers").select("manager_id,full_name").order("full_name",{ascending:true}),
        state.client.from("gw_manager_assignments").select("assignment_id,game_world_id,manager_id,team_id,nation_id,assignment_type,start_date,end_date,season_id").eq("game_world_id",worldId),
        state.client.from("imc_national_teams").select("nation_id,nation_name").order("nation_name",{ascending:true}),
        state.client.from("gw_competition_settings").select("setting_id,game_world_id,season_id,competition_id,nation_setup_id,start_date").eq("game_world_id",worldId)
      ]);
      results.forEach(function(result){if(result.error) throw result.error;});
      state.adminGwSetupSeasons=results[0].data||[];
      state.adminGwSetupWorldSettings=results[1].data||null;
      state.adminGwSetupNations=results[2].data||[];
      state.adminGwSetupLeagues=results[3].data||[];
      state.adminGwSetupDivisions=results[4].data||[];
      state.adminGwSetupTeams=results[5].data||[];
      state.adminGwSetupManagers=results[6].data||[];
      state.adminGwSetupAssignments=results[7].data||[];
      state.adminGwSetupNationalTeams=results[8].data||[];
      state.adminGwSetupCompetitionSettings=results[9].data||[];
      renderAdminGameWorldSetupEditor();
    }catch(error){
      body.innerHTML='<div class="nx-empty-state">Configurazione non disponibile.</div>';
      setGwSetupStatus((error&&error.message?error.message:"Errore nel caricamento")+".","error");
    }
  }

  function getSetupLeague(nationId){
    return state.adminGwSetupLeagues.find(function(item){return String(item.nation_setup_id||"")===String(nationId||"");});
  }
  function getSetupDivision(nationId,number){
    return state.adminGwSetupDivisions.find(function(item){return String(item.nation_setup_id||"")===String(nationId||"")&&Number(item.division_number)===Number(number);});
  }
  function setupKey(nationId){return nationId?String(nationId):"single";}
  function boolOption(value,label){return `<option value="true" ${value?"selected":""}>${label}: Sì</option><option value="false" ${!value?"selected":""}>${label}: No</option>`;}
  function numberOptions(min,max,selected){let out="";for(let n=min;n<=max;n++)out+=`<option value="${n}" ${Number(selected)===n?"selected":""}>${n}</option>`;return out;}

  function renderDivisionInputs(nationId,count,commonTeams){
    const key=setupKey(nationId);let html="";
    for(let n=1;n<=Number(count);n++){
      const stored=getSetupDivision(nationId,n);
      const value=stored?stored.team_count:(commonTeams||10);
      html+=`<label>Division ${n} · Squadre<select id="gwDivTeams_${key}_${n}">${numberOptions(10,24,value)}</select></label>`;
    }
    return html;
  }

  function renderDomesticConfig(nationId,title,isSingle){
    const key=setupKey(nationId),league=getSetupLeague(nationId)||{};
    const count=league.division_count||1,common=league.teams_per_division||10;
    return `<article class="nx-domestic-card" data-nation-id="${nationId||""}">
      <div class="nx-domestic-title"><div><small>${isSingle?"SINGLE LEAGUE":"NATION"}</small><h3>${esc(title)}</h3></div>${isSingle?"":'<button class="removeSetupNation" type="button">Rimuovi</button>'}</div>
      <div class="nx-setup-grid">
        <label>Quante divisioni?<select id="gwDivisionCount_${key}">${numberOptions(1,5,count)}</select></label>
        ${isSingle?`<label>Squadre per divisione<select id="gwCommonTeams_${key}">${numberOptions(10,24,common)}</select></label>`:""}
      </div>
      <div class="nx-division-inputs" id="gwDivisionArea_${key}">${renderDivisionInputs(nationId,count,common)}</div>
      <div class="nx-cup-grid">
        <select id="gwLeagueCup_${key}">${boolOption(league.league_cup!==false,"National Cup")}</select>
        <select id="gwLeagueShield_${key}">${boolOption(league.league_shield!==false,"League Cup")}</select>
        <select id="gwPlayoff_${key}">${boolOption(!!league.playoff,"Playoff")}</select>
        <select id="gwCharityShield_${key}">${boolOption(league.charity_shield!==false,"Charity Shield")}</select>
      </div>
    </article>`;
  }

  const GW_GLOBAL_SETUP_COMPETITIONS = [
    {id:"COMP_INT_001",name:"SMFA Champions",group:"international",defaultEnabled:true,fromSeason:1},
    {id:"COMP_INT_002",name:"SMFA Shield",group:"international",defaultEnabled:true,fromSeason:1},
    {id:"COMP_INT_003",name:"SMFA Super Cup",group:"international",defaultEnabled:false,fromSeason:2},
    {id:"COMP_NAT_001",name:"World Cup Qualifying",group:"national_teams",defaultEnabled:true,fromSeason:1},
    {id:"COMP_NAT_002",name:"World Cup",group:"national_teams",defaultEnabled:false,fromSeason:1}
  ];

  function existingGlobalCompetitionSetting(id,seasonId){
    return (state.adminGwSetupCompetitionSettings||[]).find(function(row){
      return row.competition_id===id && Number(row.season_id)===Number(seasonId) && !row.nation_setup_id;
    })||null;
  }

  function renderGlobalCompetitionGroup(group,title,season){
    const seasonNumber=Number(season&&season.season_number||1);
    const items=GW_GLOBAL_SETUP_COMPETITIONS.filter(function(item){return item.group===group;});
    return `<section class="nx-setup-section nx-global-competition-section"><div class="nx-section-heading"><div><small>${group==="international"?"INTERNATIONAL":"NATIONAL TEAMS"}</small><h2>${esc(title)}</h2></div></div><div class="nx-domestic-list">${items.map(function(item){
      const locked=item.fromSeason&&seasonNumber<item.fromSeason;
      const existing=season?existingGlobalCompetitionSetting(item.id,season.season_id):null;
      const enabled=locked?false:Boolean(existing||item.defaultEnabled);
      const date=existing&&existing.start_date?existing.start_date:"";
      return `<article class="nx-domestic-card nx-global-competition-card" data-global-competition-id="${esc(item.id)}"><div class="nx-domestic-title"><div><small>${locked?"DISPONIBILE DALLA SEASON "+item.fromSeason:"COMPETIZIONE"}</small><h3>${esc(item.name)}</h3></div></div><div class="nx-setup-grid"><label>Stato<select class="gwGlobalCompetitionEnabled" ${locked?"disabled":""}>${boolOption(enabled,"Abilitata")}</select></label><label>Data inizio <span class="nx-optional">(facoltativa)</span><input class="gwGlobalCompetitionDate" type="date" value="${esc(date)}" ${locked?"disabled":""}></label></div></article>`;
    }).join("")}</div></section>`;
  }

  function readGlobalCompetitionConfig(){
    return Array.from(document.querySelectorAll('[data-global-competition-id]')).map(function(card){
      return {
        id:card.getAttribute('data-global-competition-id'),
        enabled:card.querySelector('.gwGlobalCompetitionEnabled').value==='true',
        startDate:card.querySelector('.gwGlobalCompetitionDate').value||null
      };
    });
  }

  function activeSetupSeason(){
    const id=state.adminGwSetupWorldSettings&&state.adminGwSetupWorldSettings.active_season_id;
    return state.adminGwSetupSeasons.find(function(item){return String(item.season_id)===String(id);})||null;
  }

  function renderTeamImportBlocks(world){
    const season=activeSetupSeason();
    if(!season) return '<section class="nx-setup-section"><div class="nx-empty-state">Salva prima la stagione e la struttura per attivare l’import squadre.</div></section>';
    const configs=world.type==="multi_league"?state.adminGwSetupNations.map(function(n){return {nationId:n.nation_setup_id,title:n.nation_name};}):[{nationId:null,title:"League"}];
    let cards="";
    configs.forEach(function(cfg){
      const league=getSetupLeague(cfg.nationId);if(!league)return;
      for(let n=1;n<=Number(league.division_count);n++){
        const div=getSetupDivision(cfg.nationId,n),expected=div?Number(div.team_count):0;
        const imported=(state.adminGwSetupTeams||[]).filter(function(row){return String(row.nation_setup_id||"")===String(cfg.nationId||"")&&Number(row.division_number)===n&&Number(row.season_id)===Number(season.season_id);});
        cards+=`<article class="nx-team-import-card" data-nation-id="${cfg.nationId||""}" data-division-number="${n}" data-expected="${expected}">
          <div class="nx-team-import-head"><div><small>${esc(cfg.title)}</small><h3>Division ${n}</h3></div><strong>${imported.length} / ${expected}</strong></div>
          ${imported.length?`<div class="nx-imported-team-list">${imported.map(function(row){return `<span>${esc(row.gw_teams&&teamDisplayName(row.gw_teams)?teamDisplayName(row.gw_teams):"Squadra")}</span>`;}).join("")}</div>`:""}
          <label>Incolla classifica o elenco squadre<textarea class="gwTeamImportText" rows="10" placeholder="Incolla qui la classifica completa. Nexus prenderà solo i nomi delle squadre."></textarea></label>
          <div class="nx-editor-actions"><button class="previewDivisionTeams" type="button">Anteprima nomi</button><button class="primary importDivisionTeams" type="button">Salva squadre</button></div>
          <div class="nx-team-preview"></div>
        </article>`;
      }
    });
    return `<section class="nx-setup-section"><div class="nx-section-heading"><div><small>STEP 4</small><h2>Import squadre</h2></div></div><p>Per ogni divisione incolla direttamente una classifica. Verranno estratti soltanto i nomi delle squadre.</p><div class="nx-team-import-grid">${cards||'<div class="nx-empty-state">Salva la struttura Domestic per generare le divisioni.</div>'}</div></section>`;
  }

  function activeSetupAssignment(managerId,type){
    return (state.adminGwSetupAssignments||[]).find(function(row){return row.manager_id===managerId&&row.assignment_type===type&&!row.end_date;})||null;
  }
  function uniqueSetupTeams(){
    const map=new Map();
    (state.adminGwSetupTeams||[]).forEach(function(row){if(row.team_id&&row.gw_teams&&row.gw_teams.team_name)map.set(String(row.team_id),{team_id:row.team_id,team_name:teamDisplayName(row.gw_teams)});});
    return Array.from(map.values()).sort(function(a,b){return teamDisplayName(a).localeCompare(teamDisplayName(b),"it");});
  }
  function renderManagerWizard(){
    const season=activeSetupSeason(),teams=uniqueSetupTeams();
    if(!season)return '<section class="nx-dashboard-panel"><div class="nx-empty-state">Salva prima la stagione.</div></section>';
    if(!teams.length)return '<section class="nx-dashboard-panel"><div class="nx-empty-state">Importa prima le squadre delle divisioni.</div></section>';

    const managerNameById=new Map((state.adminGwSetupManagers||[]).map(function(manager){
      return [String(manager.manager_id),manager.full_name];
    }));

    const cards=(state.adminGwSetupManagers||[]).map(function(manager){
      const club=activeSetupAssignment(manager.manager_id,"club");
      const nation=activeSetupAssignment(manager.manager_id,"national_team");
      const checked=Boolean(club||nation);
      const history=(state.adminGwSetupAssignments||[])
        .filter(function(row){return String(row.manager_id)===String(manager.manager_id);})
        .sort(function(a,b){return String(b.start_date||"").localeCompare(String(a.start_date||""));});
      const searchText=[manager.full_name,manager.manager_id,manager.sm_username||manager.username||""].filter(Boolean).join(" ").toLowerCase();
      const historyHtml=history.length?history.map(function(row){
        const isClub=row.assignment_type==="club";
        const entity=isClub
          ? (teams.find(function(team){return String(team.team_id)===String(row.team_id);})||{}).team_name
          : ((state.adminGwSetupNationalTeams||[]).find(function(item){return String(item.nation_id)===String(row.nation_id);})||{}).nation_name;

        const entityOptions=isClub
          ? teams.map(function(team){
              return `<option value="${team.team_id}" ${String(row.team_id)===String(team.team_id)?"selected":""}>${esc(teamDisplayName(team))}</option>`;
            }).join("")
          : (state.adminGwSetupNationalTeams||[]).map(function(item){
              return `<option value="${item.nation_id}" ${String(row.nation_id)===String(item.nation_id)?"selected":""}>${esc(item.nation_name)}</option>`;
            }).join("");

        return `
          <div class="nx-assignment-history-row">
            <strong>${esc(entity||"Incarico")}</strong>
            <span>${esc(row.start_date||"—")} → ${esc(row.end_date||"Attivo")}</span>
            <small>${isClub?"Club":"Nazionale"}</small>

            <details class="nx-admin-assignment-correction" data-assignment-id="${esc(row.assignment_id)}" data-assignment-type="${esc(row.assignment_type)}">
              <summary>Correzione ADMIN</summary>
              <div class="nx-admin-correction-grid">
                <label>${isClub?"Club":"Nazionale"}
                  <select class="adminAssignmentEntity">
                    ${entityOptions}
                  </select>
                </label>
                <label>Data inizio
                  <input class="adminAssignmentStart" type="date" value="${esc(row.start_date||"")}">
                </label>
                <label>Data fine
                  <input class="adminAssignmentEnd" type="date" value="${esc(row.end_date||"")}">
                </label>
              </div>
              <div class="nx-admin-correction-actions">
                <button type="button" class="adminUpdateAssignment">Salva correzione</button>
                <button type="button" class="adminDeleteAssignment danger">Elimina incarico errato</button>
              </div>
              <div class="nx-admin-correction-status status"></div>
            </details>
          </div>`;
      }).join(""):'<div class="nx-empty-inline">Nessun incarico precedente.</div>';

      const currentClubName=club
        ? teamDisplayName(teams.find(function(team){return String(team.team_id)===String(club.team_id);})||{})
        : "";
      const currentNationName=nation
        ? ((state.adminGwSetupNationalTeams||[]).find(function(item){return String(item.nation_id)===String(nation.nation_id);})||{}).nation_name
        : "";
      const currentRoles=[currentClubName,currentNationName].filter(Boolean);
      const assignmentPreview=currentRoles.length?currentRoles.join(" · "):"Nessun incarico attivo";

      return `<article class="nx-manager-wizard-card" data-manager-id="${esc(manager.manager_id)}" data-manager-search="${esc(searchText+" "+assignmentPreview.toLowerCase())}">
        <details class="nx-manager-compact-details" ${checked?"":""}>
          <summary>
            <span class="nx-manager-compact-main">
              <strong>${esc(manager.full_name)}</strong>
              <small>${esc(manager.manager_id)}</small>
            </span>
            <span class="nx-manager-compact-assignment ${checked?"":"is-vacant"}">${esc(assignmentPreview)}</span>
          </summary>

          <div class="nx-manager-compact-body">
            <label class="nx-manager-participation"><input type="checkbox" class="gwManagerParticipates" ${checked?"checked":""}><span><strong>Manager presente nel Game World</strong><small>Attiva per assegnare club o nazionale</small></span></label>
            <div class="nx-manager-assignment-fields ${checked?"":"is-disabled"}">
              <div class="nx-assignment-form-block">
                <h4>Incarico club</h4>
                <label>Club<select class="gwManagerClub"><option value="">Nessun club</option>${teams.map(function(team){return `<option value="${team.team_id}" ${club&&String(club.team_id)===String(team.team_id)?"selected":""}>${esc(teamDisplayName(team))}</option>`;}).join("")}</select></label>
                <label>Data inizio<input class="gwManagerClubDate" type="date" value="${club&&club.start_date?esc(club.start_date):""}"></label>
                <label>Data fine <span class="nx-optional">(lascia vuoto se attivo)</span><input class="gwManagerClubEndDate" type="date" value="${club&&club.end_date?esc(club.end_date):""}"></label>
              </div>
              <div class="nx-assignment-form-block">
                <h4>Incarico nazionale</h4>
                <label>Nazionale<select class="gwManagerNation"><option value="">Nessuna nazionale</option>${(state.adminGwSetupNationalTeams||[]).map(function(item){return `<option value="${item.nation_id}" ${nation&&String(nation.nation_id)===String(item.nation_id)?"selected":""}>${esc(item.nation_name)}</option>`;}).join("")}</select></label>
                <label>Data inizio<input class="gwManagerNationDate" type="date" value="${nation&&nation.start_date?esc(nation.start_date):""}"></label>
                <label>Data fine <span class="nx-optional">(lascia vuoto se attivo)</span><input class="gwManagerNationEndDate" type="date" value="${nation&&nation.end_date?esc(nation.end_date):""}"></label>
              </div>
            </div>
            <details class="nx-manager-history"><summary>Storico incarichi (${history.length})</summary>${historyHtml}</details>
          </div>
        </details>
      </article>`;
    }).join("");

    return `<section class="nx-dashboard-panel nx-manager-wizard-section" id="gwManagerPanel">
      <div class="nx-dashboard-panel-head"><div><small>MANAGER</small><h2>Incarichi</h2></div></div>
      <p>Ogni passaggio viene registrato come chiusura di un incarico e apertura di uno nuovo.</p>
      <div class="nx-manager-search"><label for="gwManagerSearch">Cerca manager</label><input id="gwManagerSearch" type="search" placeholder="Nome, cognome, IMC ID o username SM" autocomplete="off"><small id="gwManagerSearchCount">Visualizzati ${state.adminGwSetupManagers.length} di ${state.adminGwSetupManagers.length} manager</small></div>
      <div class="nx-manager-wizard-list">${cards}</div>
      <div class="nx-panel-actions"><button class="primary" id="saveGwManagerAssignments" type="button">Salva incarichi manager</button></div>
      <div id="gwManagerLocalStatus" class="status"></div>
    </section>`;
  }
  function isoDayBefore(value){const d=new Date(value+"T12:00:00");d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);}
  async function closeActiveSetupAssignments(managerId,type,endDate){
    const rows=(state.adminGwSetupAssignments||[]).filter(function(row){return row.manager_id===managerId&&row.assignment_type===type&&!row.end_date;});
    for(const row of rows){const result=await state.client.from("gw_manager_assignments").update({end_date:endDate}).eq("assignment_id",row.assignment_id);if(result.error)throw result.error;}
  }
  async function syncSetupAssignment(managerId,type,entityId,startDate,endDate,seasonId){
    const active=activeSetupAssignment(managerId,type);
    const field=type==="club"?"team_id":"nation_id";

    if(endDate&&startDate&&endDate<startDate){
      throw new Error("La data fine non può precedere la data inizio.");
    }

    if(active){
      if(!entityId){
        if(!endDate)throw new Error("Inserisci la data fine prima di chiudere un incarico attivo.");
        const closeResult=await state.client.from("gw_manager_assignments").update({end_date:endDate}).eq("assignment_id",active.assignment_id);
        if(closeResult.error)throw closeResult.error;
        return;
      }

      if(String(active[field])!==String(entityId)){
        throw new Error("Chiudi prima l’incarico attivo con una data fine, poi salva il nuovo incarico.");
      }

      const updateResult=await state.client.from("gw_manager_assignments")
        .update({start_date:startDate,end_date:endDate||null,season_id:seasonId})
        .eq("assignment_id",active.assignment_id);
      if(updateResult.error)throw updateResult.error;
      return;
    }

    if(!entityId)return;
    if(!startDate)throw new Error("Inserisci la data di inizio per ogni nuovo incarico.");
    const payload={game_world_id:state.adminGwSetupWorldId,manager_id:managerId,team_id:null,nation_id:null,assignment_type:type,start_date:startDate,end_date:endDate||null,season_id:seasonId};
    payload[field]=Number(entityId);
    const result=await state.client.from("gw_manager_assignments").insert(payload);
    if(result.error)throw result.error;
  }

  function setAdminAssignmentStatus(container,message,type){
    const node=container.querySelector(".nx-admin-correction-status");
    if(!node)return;
    node.className="nx-admin-correction-status status"+(type?" "+type:"");
    node.textContent=message||"";
  }

  async function updateAdminAssignment(container){
    const assignmentId=container.getAttribute("data-assignment-id");
    const assignmentType=container.getAttribute("data-assignment-type");
    const entityId=container.querySelector(".adminAssignmentEntity").value;
    const startDate=container.querySelector(".adminAssignmentStart").value;
    const endDate=container.querySelector(".adminAssignmentEnd").value;

    if(!entityId){
      setAdminAssignmentStatus(container,"Seleziona il club o la nazionale.","error");
      return;
    }
    if(!startDate){
      setAdminAssignmentStatus(container,"Inserisci la data di inizio.","error");
      return;
    }
    if(endDate && endDate < startDate){
      setAdminAssignmentStatus(container,"La data fine non può precedere la data inizio.","error");
      return;
    }

    const payload={
      start_date:startDate,
      end_date:endDate||null,
      team_id:assignmentType==="club"?Number(entityId):null,
      nation_id:assignmentType==="national_team"?Number(entityId):null
    };

    setAdminAssignmentStatus(container,"Salvataggio correzione…","");
    try{
      const result=await state.client
        .from("gw_manager_assignments")
        .update(payload)
        .eq("assignment_id",assignmentId);

      if(result.error)throw result.error;

      await loadAdminGameWorldSetup();
      setManagerLocalStatus("Incarico corretto dall’ADMIN.","success");
    }catch(error){
      setAdminAssignmentStatus(
        container,
        error&&error.message?error.message:"Correzione non riuscita.",
        "error"
      );
    }
  }

  async function deleteAdminAssignment(container){
    const assignmentId=container.getAttribute("data-assignment-id");
    const confirmed=window.confirm(
      "Eliminare definitivamente questo incarico errato? L’operazione non crea storico e non può essere annullata."
    );
    if(!confirmed)return;

    setAdminAssignmentStatus(container,"Eliminazione incarico…","");
    try{
      const result=await state.client
        .from("gw_manager_assignments")
        .delete()
        .eq("assignment_id",assignmentId);

      if(result.error)throw result.error;

      await loadAdminGameWorldSetup();
      setManagerLocalStatus("Incarico errato eliminato definitivamente.","success");
    }catch(error){
      setAdminAssignmentStatus(
        container,
        error&&error.message?error.message:"Eliminazione non riuscita.",
        "error"
      );
    }
  }

  function setManagerLocalStatus(message,type){
    const node=document.getElementById("gwManagerLocalStatus");
    if(!node)return;
    node.className="status"+(type?" "+type:"");
    node.textContent=message||"";
    node.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  async function saveGwManagerAssignments(){
    const season=activeSetupSeason();
    if(!season){setManagerLocalStatus("Nessuna stagione attiva.","error");return;}
    const cards=Array.from(document.querySelectorAll(".nx-manager-wizard-card"));
    setManagerLocalStatus("Salvataggio incarichi manager…","");
    try{
      for(const card of cards){
        const managerId=card.getAttribute("data-manager-id");
        const participates=card.querySelector(".gwManagerParticipates").checked;
        const club=participates?card.querySelector(".gwManagerClub").value:"";
        const clubDate=card.querySelector(".gwManagerClubDate").value;
        const clubEnd=card.querySelector(".gwManagerClubEndDate").value;
        const nation=participates?card.querySelector(".gwManagerNation").value:"";
        const nationDate=card.querySelector(".gwManagerNationDate").value;
        const nationEnd=card.querySelector(".gwManagerNationEndDate").value;
        if(participates&&!club&&!nation&&!activeSetupAssignment(managerId,"club")&&!activeSetupAssignment(managerId,"national_team")){
          throw new Error("Ogni manager selezionato deve avere almeno un club o una nazionale.");
        }
        await syncSetupAssignment(managerId,"club",club,clubDate,clubEnd,season.season_id);
        await syncSetupAssignment(managerId,"national_team",nation,nationDate,nationEnd,season.season_id);
      }
      await loadAdminGameWorldSetup();
      setManagerLocalStatus("Incarichi manager salvati correttamente.","success");
    }catch(error){
      setManagerLocalStatus(error&&error.message?error.message:"Salvataggio incarichi non riuscito.","error");
    }
  }

  const GW_STANDARD_COMPETITIONS = [
    {id:"COMP_DOM_001",name:"League",category:"domestic",required:true},
    {id:"COMP_DOM_002",name:"National Cup",dbName:"League Cup",category:"domestic",required:false},
    {id:"COMP_DOM_003",name:"League Cup",dbName:"League Shield",category:"domestic",required:false},
    {id:"COMP_DOM_004",name:"Charity Shield",category:"domestic",required:false,fromSeason:2},
    {id:"COMP_DOM_005",name:"Playoff",category:"domestic",required:false},
    {id:"COMP_INT_001",name:"SMFA Champions",category:"international",required:true},
    {id:"COMP_INT_002",name:"SMFA Shield",category:"international",required:true},
    {id:"COMP_INT_003",name:"SMFA Super Cup",category:"international",required:false,fromSeason:2},
    {id:"COMP_NAT_001",name:"World Cup Qualifying",category:"nations",required:true},
    {id:"COMP_NAT_002",name:"World Cup",category:"nations",required:false}
  ];

  function competitionSettingValue(competitionId,nationId,seasonId){
    const row=(state.adminGwSetupCompetitionSettings||[]).find(function(item){
      return item.competition_id===competitionId && Number(item.season_id)===Number(seasonId) && String(item.nation_setup_id||"")===String(nationId||"");
    });
    return row&&row.start_date?row.start_date:"";
  }

  function renderCompetitionDateRow(item,nationId,season){
    const seasonNumber=Number(season&&season.season_number||1);
    if(item.fromSeason&&seasonNumber<item.fromSeason){
      return `<div class="nx-comp-config-row is-locked"><div><strong>${esc(item.name)}</strong><span>Disponibile dalla Season ${item.fromSeason}</span></div><b>🔒</b></div>`;
    }
    const value=competitionSettingValue(item.id,nationId,season.season_id);
    const key=`${item.id}_${nationId||"global"}`;
    return `<label class="nx-comp-config-row" data-comp-setting="1" data-competition-id="${esc(item.id)}" data-nation-id="${nationId||""}"><div><strong>${esc(item.name)}</strong><span>${item.required?"Data obbligatoria":"Data facoltativa"}</span></div><input id="compDate_${esc(key)}" type="date" value="${esc(value)}" ${item.required?"required":""}></label>`;
  }

  function renderCompetitionConfiguration(world,season){
    if(!season)return `<section class="nx-setup-section"><div class="nx-empty-state">Crea prima la stagione attiva per configurare le competizioni.</div></section>`;
    const domesticItems=GW_STANDARD_COMPETITIONS.filter(function(x){return x.category==="domestic";});
    const international=GW_STANDARD_COMPETITIONS.filter(function(x){return x.category==="international";});
    const nations=GW_STANDARD_COMPETITIONS.filter(function(x){return x.category==="nations";});
    let domestic="";
    if(world.type==="multi_league"){
      domestic=(state.adminGwSetupNations||[]).map(function(n){
        return `<div class="nx-comp-config-group"><h3>${esc(n.nation_name)} · Domestic</h3>${domesticItems.map(function(item){return renderCompetitionDateRow(item,n.nation_setup_id,season);}).join("")}</div>`;
      }).join("")||'<div class="nx-empty-state">Aggiungi prima le nazioni del Multi League.</div>';
    }else{
      domestic=`<div class="nx-comp-config-group"><h3>Domestic</h3>${domesticItems.map(function(item){return renderCompetitionDateRow(item,null,season);}).join("")}</div>`;
    }
    return `<section class="nx-setup-section nx-competition-config"><div class="nx-section-heading"><div><small>STEP COMPETITIONS</small><h2>Competizioni della stagione</h2></div></div><p class="nx-section-note">Le League derivano automaticamente dalle divisioni. Inserisci qui le date di avvio delle competizioni standard.</p><div class="nx-comp-config-columns"><div>${domestic}</div><div><div class="nx-comp-config-group"><h3>International</h3>${international.map(function(item){return renderCompetitionDateRow(item,null,season);}).join("")}</div><div class="nx-comp-config-group"><h3>Nations</h3>${nations.map(function(item){return renderCompetitionDateRow(item,null,season);}).join("")}</div></div></div><button class="primary" id="saveCompetitionSettings" type="button">Salva competizioni</button></section>`;
  }

  function competitionTypeForStandardId(id){
    const map={
      COMP_DOM_001:"league",
      COMP_DOM_002:"domestic_cup",
      COMP_DOM_003:"domestic_cup",
      COMP_DOM_004:"domestic_super_cup",
      COMP_DOM_005:"promotion_playoff",
      COMP_INT_001:"smfa_champions",
      COMP_INT_002:"smfa_shield",
      COMP_INT_003:"smfa_super_cup",
      COMP_NAT_001:"world_cup_qualifying",
      COMP_NAT_002:"world_cup"
    };
    return map[id]||"domestic_cup";
  }

  function standardCompetitionById(id){
    return GW_STANDARD_COMPETITIONS.find(function(item){return item.id===id;})||null;
  }

  async function ensureLeagueCountries(worldId,setupNations){
    const existingResult=await state.client
      .from("gw_league_countries")
      .select("country_id,game_world_id,country_name")
      .eq("game_world_id",worldId);

    if(existingResult.error)throw existingResult.error;

    let countries=existingResult.data||[];
    const existingByName=new Map();

    countries.forEach(function(country){
      existingByName.set(
        normalizeParticipantKey(country.country_name),
        country
      );
    });

    const missing=(setupNations||[])
      .filter(function(nation){
        return !existingByName.has(
          normalizeParticipantKey(nation.nation_name)
        );
      })
      .map(function(nation){
        return {
          game_world_id:worldId,
          country_name:nation.nation_name
        };
      });

    if(missing.length){
      const inserted=await state.client
        .from("gw_league_countries")
        .insert(missing)
        .select("country_id,game_world_id,country_name");

      if(inserted.error)throw inserted.error;

      countries=countries.concat(inserted.data||[]);
      (inserted.data||[]).forEach(function(country){
        existingByName.set(
          normalizeParticipantKey(country.country_name),
          country
        );
      });
    }

    const countryIdByNationSetupId=new Map();

    (setupNations||[]).forEach(function(nation){
      const country=existingByName.get(
        normalizeParticipantKey(nation.nation_name)
      );

      if(country){
        countryIdByNationSetupId.set(
          String(nation.nation_setup_id),
          Number(country.country_id)
        );
      }
    });

    return {
      countries:countries,
      country_id_by_nation_setup_id:countryIdByNationSetupId
    };
  }

  function multiDivisionCode(worldId,nationSetupId,divisionNumber){
    return worldId+"_N"+String(nationSetupId)+"_DIV_"+String(divisionNumber).padStart(2,"0");
  }

  async function rebuildGameWorldCompetitionStructure(season,globalConfig){
    const world=getWorldMeta(state.adminGwSetupWorldId);
    if(!world)throw new Error("Game World non trovato.");

    const worldId=state.adminGwSetupWorldId;
    const isMulti=world.type==="multi_league";
    const setupDivisions=state.adminGwSetupDivisions||[];
    const setupNations=state.adminGwSetupNations||[];
    const leagueSetups=state.adminGwSetupLeagues||[];

    if(!setupDivisions.length)throw new Error("Configura prima le divisioni del Game World.");
    if(isMulti&&!setupNations.length)throw new Error("Configura prima le nazioni del Multi League.");

    const leagueCountries=isMulti
      ? await ensureLeagueCountries(worldId,setupNations)
      : {country_id_by_nation_setup_id:new Map()};

    const countryIdByNationSetupId=leagueCountries.country_id_by_nation_setup_id;

    // Elimina solo la struttura operativa priva di partite. Se ci sono partite,
    // mantiene i record esistenti e completa quelli mancanti.
    const existingMatchesResult=await state.client
      .from("gw_matches")
      .select("competition_id")
      .eq("game_world_id",worldId);
    if(existingMatchesResult.error)throw existingMatchesResult.error;
    const usedCompetitionIds=new Set((existingMatchesResult.data||[]).map(function(row){return String(row.competition_id);}));

    let divisionsResult=await state.client
      .from("gw_divisions")
      .select("division_id,division_code,division_name,division_level,teams_count")
      .eq("game_world_id",worldId);
    if(divisionsResult.error)throw divisionsResult.error;
    let divisions=divisionsResult.data||[];

    const divisionBySetupKey=new Map();
    divisions.forEach(function(row){
      divisionBySetupKey.set(String(row.division_code||""),row);
    });

    const missingDivisions=[];
    setupDivisions.forEach(function(setup){
      const nationId=isMulti?setup.nation_setup_id:null;
      const code=isMulti
        ? multiDivisionCode(worldId,nationId,setup.division_number)
        : worldId+"_DIV_"+String(setup.division_number).padStart(2,"0");
      if(divisionBySetupKey.has(code))return;
      const nation=isMulti?setupNations.find(function(n){return String(n.nation_setup_id)===String(nationId);}):null;
      missingDivisions.push({
        game_world_id:worldId,
        country_id:isMulti
          ? (countryIdByNationSetupId.get(String(nationId))||null)
          : null,
        division_code:code,
        division_name:isMulti
          ? (nation?nation.nation_name+" · Division "+setup.division_number:"Division "+setup.division_number)
          : "Division "+setup.division_number,
        division_level:Number(setup.division_number),
        teams_count:Number(setup.team_count),
        meetings_per_pair:2,
        promotion_total:0,
        promotion_direct:0,
        promotion_playoff:0,
        relegation_total:0
      });
    });

    if(missingDivisions.length){
      const inserted=await state.client
        .from("gw_divisions")
        .insert(missingDivisions)
        .select("division_id,division_code,division_name,division_level,teams_count");
      if(inserted.error)throw inserted.error;
      divisions=divisions.concat(inserted.data||[]);
      (inserted.data||[]).forEach(function(row){divisionBySetupKey.set(String(row.division_code),row);});
    }

    let competitionsResult=await state.client
      .from("gw_competitions")
      .select("competition_id,country_id,division_id,competition_name,competition_type,competition_category")
      .eq("game_world_id",worldId);
    if(competitionsResult.error)throw competitionsResult.error;
    let competitions=competitionsResult.data||[];

    // Elimina esclusivamente record orfani e vuoti non usati da alcuna partita.
    const orphanIds=competitions.filter(function(row){
      return !String(row.competition_name||"").trim() && !usedCompetitionIds.has(String(row.competition_id));
    }).map(function(row){return row.competition_id;});
    if(orphanIds.length){
      const deleted=await state.client.from("gw_competitions").delete().in("competition_id",orphanIds);
      if(deleted.error)throw deleted.error;
      competitions=competitions.filter(function(row){return !orphanIds.includes(row.competition_id);});
    }

    const wanted=[];
    setupDivisions.forEach(function(setup){
      const nationId=isMulti?setup.nation_setup_id:null;
      const code=isMulti
        ? multiDivisionCode(worldId,nationId,setup.division_number)
        : worldId+"_DIV_"+String(setup.division_number).padStart(2,"0");
      const division=divisionBySetupKey.get(code);
      if(!division)return;
      const nation=isMulti?setupNations.find(function(n){return String(n.nation_setup_id)===String(nationId);}):null;
      wanted.push({
        game_world_id:worldId,
        country_id:isMulti
          ? (countryIdByNationSetupId.get(String(nationId))||null)
          : null,
        division_id:division.division_id,
        competition_name:isMulti
          ? (nation?nation.nation_name+" · Division "+setup.division_number:"Division "+setup.division_number)
          : "Division "+setup.division_number,
        competition_type:"league",
        has_group_stage:false,
        knockout_legs:null,
        final_legs:1,
        competition_category:"domestic"
      });
    });

    function addDomesticForNation(nationId,leagueSetup){
      const nation=isMulti?setupNations.find(function(n){return String(n.nation_setup_id)===String(nationId);}):null;
      const prefix=isMulti&&nation?nation.nation_name+" · ":"";
      const configs=[
        ["League Cup",Boolean(leagueSetup&&leagueSetup.league_cup),"domestic_cup"],
        ["League Shield",Boolean(leagueSetup&&leagueSetup.league_shield),"domestic_cup"],
        ["Charity Shield",Boolean(leagueSetup&&leagueSetup.charity_shield),"domestic_super_cup"],
        ["Playoff",Boolean(leagueSetup&&leagueSetup.playoff),"promotion_playoff"]
      ];
      configs.forEach(function(cfg){
        if(!cfg[1])return;
        wanted.push({
          game_world_id:worldId,
          country_id:isMulti
            ? (countryIdByNationSetupId.get(String(nationId))||null)
            : null,
          division_id:null,
          competition_name:prefix+cfg[0],
          competition_type:cfg[2],
          has_group_stage:false,
          knockout_legs:1,
          final_legs:1,
          competition_category:"domestic"
        });
      });
    }

    if(isMulti){
      setupNations.forEach(function(nation){
        const leagueSetup=leagueSetups.find(function(row){return String(row.nation_setup_id)===String(nation.nation_setup_id);});
        addDomesticForNation(nation.nation_setup_id,leagueSetup||{});
      });
    }else{
      addDomesticForNation(null,leagueSetups[0]||{});
    }

    // Competizioni globali abilitate nella configurazione principale.
    const enabledGlobalIds=new Set((globalConfig||[]).filter(function(item){return item.enabled;}).map(function(item){return item.id;}));
    [
      ["COMP_INT_001","SMFA Champions","smfa_champions","international"],
      ["COMP_INT_002","SMFA Shield","smfa_shield","international"],
      ["COMP_INT_003","SMFA Super Cup","smfa_super_cup","international"],
      ["COMP_NAT_001","World Cup Qualifying","world_cup_qualifying","national_teams"],
      ["COMP_NAT_002","World Cup","world_cup","national_teams"]
    ].forEach(function(cfg){
      if(!enabledGlobalIds.has(cfg[0]))return;
      wanted.push({
        game_world_id:worldId,
        country_id:null,
        division_id:null,
        competition_name:cfg[1],
        competition_type:cfg[2],
        has_group_stage:cfg[2]==="smfa_champions"||cfg[2]==="smfa_shield"||cfg[2]==="world_cup_qualifying"||cfg[2]==="world_cup",
        knockout_legs:cfg[2]==="smfa_super_cup"?1:null,
        final_legs:1,
        competition_category:cfg[3]
      });
    });

    const existingKey=new Set(competitions.map(function(row){
      return [String(row.country_id||""),String(row.division_id||""),String(row.competition_name||"").trim().toLowerCase(),row.competition_type].join("|");
    }));
    const missingCompetitions=wanted.filter(function(row){
      const key=[String(row.country_id||""),String(row.division_id||""),String(row.competition_name||"").trim().toLowerCase(),row.competition_type].join("|");
      if(existingKey.has(key))return false;
      existingKey.add(key);
      return true;
    });

    if(missingCompetitions.length){
      const inserted=await state.client.from("gw_competitions").insert(missingCompetitions);
      if(inserted.error)throw inserted.error;
    }
  }

  async function saveCompetitionSettings(){
    const season=activeSetupSeason();
    if(!season){setGwSetupStatus("Crea prima una stagione attiva.","error");return;}
    const rows=Array.from(document.querySelectorAll('[data-comp-setting="1"]'));
    try{
      setGwSetupStatus("Creazione struttura competizioni…","");
      await rebuildGameWorldCompetitionStructure(season);

      const payload=[];
      rows.forEach(function(row){
        const input=row.querySelector('input[type="date"]');
        const competitionId=row.getAttribute("data-competition-id");
        const nationRaw=row.getAttribute("data-nation-id");
        const required=input.hasAttribute("required");
        if(required&&!input.value)throw new Error(`${row.querySelector("strong").textContent}: inserisci la data di inizio.`);
        if(input.value)payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(season.season_id),competition_id:competitionId,nation_setup_id:nationRaw?Number(nationRaw):null,start_date:input.value});
      });

      let result=await state.client.from("gw_competition_settings").delete().eq("game_world_id",state.adminGwSetupWorldId).eq("season_id",season.season_id);
      if(result.error)throw result.error;
      if(payload.length){
        result=await state.client.from("gw_competition_settings").insert(payload);
        if(result.error)throw result.error;
      }
      await loadAdminGameWorldSetup();
      setGwSetupStatus("Struttura e competizioni salvate correttamente su Supabase.","success");
    }catch(error){
      setGwSetupStatus(error&&error.message?error.message:"Salvataggio competizioni non riuscito.","error");
    }
  }

  async function closeCurrentSetupSeason(){
    const season=activeSetupSeason();
    if(!season)return;
    const endInput=document.getElementById("gwDashboardSeasonEnd");
    const endDate=endInput?endInput.value:"";
    const local=document.getElementById("gwSeasonLocalStatus");
    const setLocal=function(message,type){if(local){local.className="status"+(type?" "+type:"");local.textContent=message||"";}};
    if(!endDate){setLocal("Inserisci la data di fine stagione.","error");return;}
    if(season.start_date&&endDate<season.start_date){setLocal("La data finale non può precedere quella iniziale.","error");return;}
    if(!window.confirm("Chiudere Season "+season.season_number+" al "+endDate+"?"))return;
    try{
      let result=await state.client.from("gw_seasons").update({season_status:"past",end_date:endDate}).eq("season_id",season.season_id);
      if(result.error)throw result.error;
      result=await state.client.from("gw_world_settings").update({active_season_id:null,updated_at:new Date().toISOString()}).eq("game_world_id",state.adminGwSetupWorldId);
      if(result.error)throw result.error;
      await loadAdminGameWorldSetup();
    }catch(error){setLocal(error&&error.message?error.message:"Chiusura stagione non riuscita.","error");}
  }

  async function openNextSetupSeason(){
    const highest=state.adminGwSetupSeasons.reduce(function(max,s){return Math.max(max,Number(s.season_number)||0);},0);
    const hasRegisteredSeasons=state.adminGwSetupSeasons.length>0;
    const numberInput=document.getElementById("gwFirstSeasonNumber");
    const seasonNumber=hasRegisteredSeasons
      ? highest+1
      : Number(numberInput?numberInput.value:1);
    const startInput=document.getElementById("gwNextSeasonStart");
    const startDate=startInput?startInput.value:"";
    const local=document.getElementById("gwSeasonLocalStatus");
    const setLocal=function(message,type){if(local){local.className="status"+(type?" "+type:"");local.textContent=message||"";}};
    if(activeSetupSeason()){setLocal("Chiudi prima la stagione attiva.","error");return;}
    if(!seasonNumber||seasonNumber<1){setLocal("Inserisci un numero stagione valido.","error");return;}
    if(!startDate){setLocal("Inserisci la data di inizio della nuova stagione.","error");return;}
    try{
      const duplicate=state.adminGwSetupSeasons.find(function(row){return Number(row.season_number)===seasonNumber;});
      if(duplicate)throw new Error("Season "+seasonNumber+" è già registrata per questo Game World.");
      let result=await state.client.from("gw_seasons").insert({game_world_id:state.adminGwSetupWorldId,season_number:seasonNumber,season_status:"current",start_date:startDate,end_date:null}).select("season_id").single();
      if(result.error)throw result.error;
      const seasonId=result.data.season_id;
      result=await state.client.from("gw_world_settings").upsert({game_world_id:state.adminGwSetupWorldId,active_season_id:Number(seasonId),updated_at:new Date().toISOString()},{onConflict:"game_world_id"});
      if(result.error)throw result.error;
      await loadAdminGameWorldSetup();
    }catch(error){setLocal(error&&error.message?error.message:"Apertura stagione non riuscita.","error");}
  }

  function renderAdminGameWorldSetupEditor(){
    const body=document.getElementById("gwSetupBody");
    const world=getWorldMeta(state.adminGwSetupWorldId)||{id:state.adminGwSetupWorldId,name:"Game World",type:"single_league"};
    const active=activeSetupSeason();
    const highest=state.adminGwSetupSeasons.reduce(function(max,s){return Math.max(max,Number(s.season_number)||0);},0);
    const isMulti=world.type==="multi_league";
    const domestic=isMulti?(state.adminGwSetupNations.length?state.adminGwSetupNations.map(function(n){return renderDomesticConfig(n.nation_setup_id,n.nation_name,false);}).join(""):'<div class="nx-empty-state">Aggiungi la prima nazione del Multi League.</div>'):renderDomesticConfig(null,"League",true);
    const totalTeams=new Set((state.adminGwSetupTeams||[]).map(function(row){return row.team_id;})).size;
    const totalDivisions=(state.adminGwSetupDivisions||[]).length;
    const hasRegisteredSeasons=state.adminGwSetupSeasons.length>0;
    const isBootstrap=!hasRegisteredSeasons&&!active&&totalDivisions===0&&totalTeams===0;

    const seasonPanel=active
      ? `<section class="nx-dashboard-panel nx-season-panel"><div class="nx-dashboard-panel-head"><div><small>SEASON</small><h2>Season ${esc(active.season_number)}</h2><p>${esc(active.start_date||"Data iniziale non impostata")} → In corso</p></div></div><div class="nx-season-actions"><label>Data fine stagione<input id="gwDashboardSeasonEnd" type="date" value="${active.end_date?esc(active.end_date):""}"></label><button class="danger" id="closeSetupSeason" type="button">Chiudi stagione</button></div><div id="gwSeasonLocalStatus" class="status"></div></section>`
      : hasRegisteredSeasons
        ? `<section class="nx-dashboard-panel nx-season-panel"><div class="nx-dashboard-panel-head"><div><small>SEASON</small><h2>Nessuna stagione attiva</h2><p>Ultima stagione registrata: Season ${highest}.</p></div></div><div class="nx-season-actions"><label>Data inizio Season ${highest+1}<input id="gwNextSeasonStart" type="date"></label><button class="primary" id="openNextSetupSeason" type="button">Apri Season ${highest+1}</button></div><div id="gwSeasonLocalStatus" class="status"></div></section>`
        : `<section class="nx-dashboard-panel nx-season-panel"><div class="nx-dashboard-panel-head"><div><small>SEASON</small><h2>Prima stagione del Game World</h2><p>Nessuna stagione è ancora registrata. Scegli il numero reale da cui deve partire Nexus.</p></div></div><div class="nx-season-actions nx-first-season-actions"><label>Numero stagione<input id="gwFirstSeasonNumber" type="number" min="1" max="99" value="1"></label><label>Data inizio<input id="gwNextSeasonStart" type="date"></label><button class="primary" id="openNextSetupSeason" type="button">Apri stagione</button></div><div id="gwSeasonLocalStatus" class="status"></div></section>`;

    const bootstrapPanel=isBootstrap
      ? `<section class="nx-bootstrap-panel"><small>NUOVO GAME WORLD</small><h2>Benvenuto in ${esc(world.id)}</h2><p>Questo Game World non è ancora stato configurato. Inizia dalla struttura, poi inserisci le squadre e apri la prima stagione reale.</p><ol><li>Configura il Game World</li><li>Importa le squadre</li><li>Apri la prima stagione</li><li>Configura gli incarichi manager</li></ol><button type="button" class="primary" id="startGwBootstrap">Inizia configurazione</button></section>`
      : "";

    body.innerHTML=`
      <div class="nx-world-setup-summary"><div><small>GAME WORLD</small><strong>${esc(world.id)} · ${esc(world.name)}</strong></div><div><small>TIPO</small><strong>${esc(worldTypeLabel(world.type))}</strong></div><div><small>STRUTTURA</small><strong>${totalDivisions} divisioni · ${totalTeams} squadre</strong></div></div>
      ${bootstrapPanel}
      ${isBootstrap?"":seasonPanel}
      ${active?renderManagerWizard():""}

      <details class="nx-dashboard-collapsible" id="gwStructureDetails" ${isBootstrap?"open":""}>
        <summary><div><small>GAME WORLD SETUP</small><strong>${esc(worldTypeLabel(world.type))} · ${totalDivisions} divisioni · ${totalTeams} squadre</strong></div><span>Modifica</span></summary>
        <div class="nx-collapsible-content">
          <section class="nx-setup-section">
            <div class="nx-section-heading"><div><small>CONFIGURAZIONE</small><h2>Stagione e struttura</h2></div></div>
            <div class="nx-setup-grid">
              <label>Numero stagione<input id="gwSeasonNumber" type="number" min="1" max="99" value="${active?esc(active.season_number):(hasRegisteredSeasons?highest+1:1)}"></label>
              <label>Data inizio<input id="gwSeasonStart" type="date" value="${active&&active.start_date?esc(active.start_date):""}"></label>
              <label>Data fine <span class="nx-optional">(facoltativa)</span><input id="gwSeasonEnd" type="date" value="${active&&active.end_date?esc(active.end_date):""}"></label>
            </div>
          </section>
          ${isMulti?`<section class="nx-setup-section"><div class="nx-section-heading"><div><small>MULTI LEAGUE</small><h2>Nazioni</h2></div></div><div class="nx-inline-add"><input id="newSetupNation" type="text" placeholder="Scrivi il nome della nazione"><button id="addSetupNation" type="button">+ Aggiungi nazione</button></div></section>`:""}
          <section class="nx-setup-section"><div class="nx-section-heading"><div><small>DOMESTIC</small><h2>Divisioni e coppe</h2></div></div><div id="gwDomesticList" class="nx-domestic-list">${domestic}</div></section>
          ${renderGlobalCompetitionGroup("international","Competizioni internazionali",active)}
          ${renderGlobalCompetitionGroup("national_teams","Competizioni nazionali",active)}
          <div class="nx-panel-actions"><button class="primary" id="saveGameWorldSetup" type="button">Salva e inizializza Game World</button></div>
        </div>
      </details>

      <details class="nx-dashboard-collapsible" id="gwTeamsDetails">
        <summary><div><small>SQUADRE</small><strong>${totalTeams} squadre configurate</strong></div><span>Visualizza / Modifica</span></summary>
        <div class="nx-collapsible-content">${renderTeamImportBlocks(world)}</div>
      </details>

      <section class="nx-admin-reset-panel">
        <div>
          <small>AREA ADMIN</small>
          <h3>Reset Game World</h3>
          <p>Riporta ${esc(world.id)} allo stato iniziale, mantenendo il Game World nel Registry.</p>
        </div>
        <button type="button" class="danger" id="resetCurrentGameWorld">Reset Game World</button>
        <div id="gwResetLocalStatus" class="status"></div>
      </section>`;
    bindGameWorldSetupEditor();
  }

  function bindGameWorldSetupEditor(){
    document.querySelectorAll('[id^="gwDivisionCount_"]').forEach(function(select){select.addEventListener("change",function(){const key=select.id.replace("gwDivisionCount_","");const card=select.closest(".nx-domestic-card");const nationId=card.getAttribute("data-nation-id")||null;const common=document.getElementById(`gwCommonTeams_${key}`);document.getElementById(`gwDivisionArea_${key}`).innerHTML=renderDivisionInputs(nationId,select.value,common?common.value:10);});});
    document.querySelectorAll('[id^="gwCommonTeams_"]').forEach(function(select){select.addEventListener("change",function(){const key=select.id.replace("gwCommonTeams_","");const count=document.getElementById(`gwDivisionCount_${key}`).value;document.getElementById(`gwDivisionArea_${key}`).innerHTML=renderDivisionInputs(null,count,select.value);});});
    const add=document.getElementById("addSetupNation");if(add)add.addEventListener("click",addGameWorldSetupNation);
    document.querySelectorAll(".removeSetupNation").forEach(function(button){button.addEventListener("click",removeGameWorldSetupNation);});
    const saveSetup=document.getElementById("saveGameWorldSetup");if(saveSetup)saveSetup.addEventListener("click",saveAdminGameWorldSetup);
    document.querySelectorAll(".previewDivisionTeams").forEach(function(button){button.addEventListener("click",function(){previewDivisionTeamImport(button.closest(".nx-team-import-card"));});});
    document.querySelectorAll(".importDivisionTeams").forEach(function(button){button.addEventListener("click",function(){saveDivisionTeamImport(button.closest(".nx-team-import-card"));});});
    document.querySelectorAll(".gwManagerParticipates").forEach(function(input){input.addEventListener("change",function(){
      const card=input.closest(".nx-manager-wizard-card");
      card.querySelector(".nx-manager-assignment-fields").classList.toggle("is-disabled",!input.checked);
      if(input.checked){
        const details=card.querySelector(".nx-manager-compact-details");
        if(details)details.open=true;
      }
    });});
    const managerSearch=document.getElementById("gwManagerSearch");
    if(managerSearch){
      const managerCards=Array.from(document.querySelectorAll(".nx-manager-wizard-card"));
      const managerCount=document.getElementById("gwManagerSearchCount");
      const normalize=function(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();};
      const applyManagerFilter=function(){
        const query=normalize(managerSearch.value);
        let visible=0;
        managerCards.forEach(function(card){
          const haystack=normalize(card.getAttribute("data-manager-search")||card.textContent);
          const show=!query||haystack.includes(query);
          card.hidden=!show;
          if(show)visible+=1;
        });
        if(managerCount)managerCount.textContent="Visualizzati "+visible+" di "+managerCards.length+" manager";
      };
      managerSearch.addEventListener("input",applyManagerFilter);
      applyManagerFilter();
    }
    const saveManagers=document.getElementById("saveGwManagerAssignments");if(saveManagers)saveManagers.addEventListener("click",saveGwManagerAssignments);

    document.querySelectorAll(".adminUpdateAssignment").forEach(function(button){
      button.addEventListener("click",function(){
        updateAdminAssignment(button.closest(".nx-admin-assignment-correction"));
      });
    });

    document.querySelectorAll(".adminDeleteAssignment").forEach(function(button){
      button.addEventListener("click",function(){
        deleteAdminAssignment(button.closest(".nx-admin-assignment-correction"));
      });
    });

    const closeSeason=document.getElementById("closeSetupSeason");if(closeSeason)closeSeason.addEventListener("click",closeCurrentSetupSeason);
    const openSeason=document.getElementById("openNextSetupSeason");if(openSeason)openSeason.addEventListener("click",openNextSetupSeason);
    const startBootstrap=document.getElementById("startGwBootstrap");if(startBootstrap)startBootstrap.addEventListener("click",function(){const details=document.getElementById("gwStructureDetails");if(details){details.open=true;details.scrollIntoView({behavior:"smooth",block:"start"});}});
    const resetWorld=document.getElementById("resetCurrentGameWorld");if(resetWorld)resetWorld.addEventListener("click",resetCurrentGameWorld);
  }

  function setGameWorldResetStatus(message,type){
    const node=document.getElementById("gwResetLocalStatus");
    if(!node)return;
    node.className="status"+(type?" "+type:"");
    node.textContent=message||"";
  }

  async function resetCurrentGameWorld(){
    const worldId=state.adminGwSetupWorldId;

    if(!worldId){
      setGameWorldResetStatus("Nessun Game World selezionato.","error");
      return;
    }

    const typed=window.prompt(
      "RESET DEFINITIVO DI "+worldId+"\n\n"+
      "Verranno eliminati stagioni, competizioni, divisioni, squadre, incarichi manager e partite.\n"+
      "Il Game World, i manager IMC, le nazionali globali e i loghi resteranno disponibili.\n\n"+
      "Digita esattamente "+worldId+" per confermare."
    );

    if(typed===null)return;

    if(String(typed).trim().toUpperCase()!==String(worldId).toUpperCase()){
      setGameWorldResetStatus(
        "Reset annullato: il codice inserito non corrisponde a "+worldId+".",
        "error"
      );
      return;
    }

    const finalConfirm=window.confirm(
      "Ultima conferma: eliminare definitivamente tutta la configurazione e i dati di "+worldId+"?"
    );

    if(!finalConfirm)return;

    const button=document.getElementById("resetCurrentGameWorld");
    if(button)button.disabled=true;

    setGameWorldResetStatus("Reset di "+worldId+" in corso…","");

    try{
      const result=await state.client.rpc(
        "admin_reset_game_world",
        {p_game_world_id:worldId}
      );

      if(result.error)throw result.error;

      state.adminGwSetupSeasons=[];
      state.adminGwSetupWorldSettings=null;
      state.adminGwSetupNations=[];
      state.adminGwSetupLeagues=[];
      state.adminGwSetupDivisions=[];
      state.adminGwSetupTeams=[];
      state.adminGwSetupAssignments=[];
      state.adminGwSetupCompetitionSettings=[];

      await loadAdminGameWorldSetup();

      setGwSetupStatus(
        worldId+" è stato riportato allo stato iniziale.",
        "success"
      );
      setGameWorldResetStatus(
        "Reset completato correttamente.",
        "success"
      );
    }catch(error){
      setGameWorldResetStatus(
        error&&error.message
          ? "Reset non completato: "+error.message
          : "Reset non completato.",
        "error"
      );
    }finally{
      if(button)button.disabled=false;
    }
  }

  async function addGameWorldSetupNation(){
    const input=document.getElementById("newSetupNation"),name=(input.value||"").trim();
    if(!name){setGwSetupStatus("Scrivi il nome della nazione.","error");return;}
    try{const result=await state.client.from("gw_setup_nations").insert({game_world_id:state.adminGwSetupWorldId,nation_name:name,sort_order:state.adminGwSetupNations.length+1});if(result.error)throw result.error;await loadAdminGameWorldSetup();setGwSetupStatus("Nazione aggiunta.","success");}catch(error){setGwSetupStatus(error&&error.message?error.message:"Impossibile aggiungere la nazione.","error");}
  }

  async function removeGameWorldSetupNation(event){
    const card=event.currentTarget.closest(".nx-domestic-card"),id=card.getAttribute("data-nation-id");
    if(!id||!window.confirm("Rimuovere questa nazione e la relativa configurazione Domestic?"))return;
    try{const result=await state.client.from("gw_setup_nations").delete().eq("nation_setup_id",id);if(result.error)throw result.error;await loadAdminGameWorldSetup();setGwSetupStatus("Nazione rimossa.","success");}catch(error){setGwSetupStatus(error&&error.message?error.message:"Rimozione non riuscita.","error");}
  }

  function readDomesticCard(card){
    const nationId=card.getAttribute("data-nation-id")||null,key=setupKey(nationId),divisionCount=Number(document.getElementById(`gwDivisionCount_${key}`).value),common=document.getElementById(`gwCommonTeams_${key}`),divisions=[];
    for(let n=1;n<=divisionCount;n++)divisions.push({division_number:n,team_count:Number(document.getElementById(`gwDivTeams_${key}_${n}`).value)});
    return {nationId:nationId?Number(nationId):null,divisionCount:divisionCount,teamsPerDivision:common?Number(common.value):null,leagueCup:document.getElementById(`gwLeagueCup_${key}`).value==="true",leagueShield:document.getElementById(`gwLeagueShield_${key}`).value==="true",playoff:document.getElementById(`gwPlayoff_${key}`).value==="true",charityShield:document.getElementById(`gwCharityShield_${key}`).value==="true",divisions:divisions};
  }

  async function ensureActiveSetupSeason(){
    const number=Number(document.getElementById("gwSeasonNumber").value),startDate=document.getElementById("gwSeasonStart").value||null,endDate=document.getElementById("gwSeasonEnd").value||null;
    if(!number||number<1)throw new Error("Inserisci un numero stagione valido.");
    if(startDate&&endDate&&endDate<startDate)throw new Error("La data finale non può precedere quella iniziale.");
    let existing=state.adminGwSetupSeasons.find(function(s){return Number(s.season_number)===number;});
    let seasonId;
    let result=await state.client.from("gw_seasons").update({season_status:"past"}).eq("game_world_id",state.adminGwSetupWorldId).eq("season_status","current");if(result.error)throw result.error;
    if(existing){result=await state.client.from("gw_seasons").update({season_status:"current",start_date:startDate,end_date:endDate}).eq("season_id",existing.season_id).select("season_id").single();}
    else{result=await state.client.from("gw_seasons").insert({game_world_id:state.adminGwSetupWorldId,season_number:number,season_status:"current",start_date:startDate,end_date:endDate}).select("season_id").single();}
    if(result.error)throw result.error;seasonId=result.data.season_id;
    result=await state.client.from("gw_world_settings").upsert({game_world_id:state.adminGwSetupWorldId,active_season_id:Number(seasonId),updated_at:new Date().toISOString()},{onConflict:"game_world_id"});if(result.error)throw result.error;
    return seasonId;
  }

  async function syncAutomaticCompetitionSettings(seasonId,configs,globalConfig){
    const payload=[];
    const season=state.adminGwSetupSeasons.find(function(row){return Number(row.season_id)===Number(seasonId);});
    const leagueStart=season&&season.start_date?season.start_date:null;

    configs.forEach(function(cfg){
      const nationId=cfg.nationId||null;
      payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(seasonId),competition_id:"COMP_DOM_001",nation_setup_id:nationId,start_date:leagueStart});
      if(cfg.leagueCup)payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(seasonId),competition_id:"COMP_DOM_002",nation_setup_id:nationId,start_date:null});
      if(cfg.leagueShield)payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(seasonId),competition_id:"COMP_DOM_003",nation_setup_id:nationId,start_date:null});
      if(cfg.charityShield)payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(seasonId),competition_id:"COMP_DOM_004",nation_setup_id:nationId,start_date:null});
      if(cfg.playoff)payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(seasonId),competition_id:"COMP_DOM_005",nation_setup_id:nationId,start_date:null});
    });

    (globalConfig||[]).forEach(function(cfg){
      if(!cfg.enabled)return;
      payload.push({game_world_id:state.adminGwSetupWorldId,season_id:Number(seasonId),competition_id:cfg.id,nation_setup_id:null,start_date:cfg.startDate||null});
    });

    let result=await state.client.from("gw_competition_settings").delete().eq("game_world_id",state.adminGwSetupWorldId).eq("season_id",seasonId);
    if(result.error)throw result.error;
    if(payload.length){
      result=await state.client.from("gw_competition_settings").insert(payload);
      if(result.error)throw result.error;
    }
  }

  async function saveAdminGameWorldSetup(){
    const cards=Array.from(document.querySelectorAll(".nx-domestic-card:not(.nx-global-competition-card)"));
    const world=getWorldMeta(state.adminGwSetupWorldId);
    if(world&&world.type==="multi_league"&&!cards.length){setGwSetupStatus("Un Multi League deve avere almeno una nazione.","error");return;}
    const configs=cards.map(readDomesticCard);
    const globalConfig=readGlobalCompetitionConfig();
    setGwSetupStatus("Salvataggio e inizializzazione del Game World…","");
    try{
      const seasonId=await ensureActiveSetupSeason();
      let result=await state.client.from("gw_division_setups").delete().eq("game_world_id",state.adminGwSetupWorldId);if(result.error)throw result.error;
      result=await state.client.from("gw_league_setups").delete().eq("game_world_id",state.adminGwSetupWorldId);if(result.error)throw result.error;
      for(const cfg of configs){
        result=await state.client.from("gw_league_setups").insert({game_world_id:state.adminGwSetupWorldId,nation_setup_id:cfg.nationId,division_count:cfg.divisionCount,teams_per_division:cfg.teamsPerDivision,league_cup:cfg.leagueCup,league_shield:cfg.leagueShield,playoff:cfg.playoff,charity_shield:cfg.charityShield});if(result.error)throw result.error;
        result=await state.client.from("gw_division_setups").insert(cfg.divisions.map(function(div){return {game_world_id:state.adminGwSetupWorldId,nation_setup_id:cfg.nationId,division_number:div.division_number,team_count:div.team_count};}));if(result.error)throw result.error;
      }

      if(world&&world.type==="multi_league"){
        const nationsResult=await state.client.from("gw_setup_nations").select("nation_setup_id,nation_name,sort_order").eq("game_world_id",state.adminGwSetupWorldId).order("sort_order",{ascending:true});
        if(nationsResult.error)throw nationsResult.error;
        await ensureLeagueCountries(state.adminGwSetupWorldId,nationsResult.data||[]);
      }

      await loadAdminGameWorldSetup();
      const season=activeSetupSeason();
      if(!season)throw new Error("Stagione attiva non disponibile dopo il salvataggio.");
      await rebuildGameWorldCompetitionStructure(season,globalConfig);
      await syncAutomaticCompetitionSettings(season.season_id,configs,globalConfig);
      await loadAdminGameWorldSetup();
      setGwSetupStatus("Build Game World completata: divisioni e competizioni sincronizzate automaticamente.","success");
    }catch(error){
      setGwSetupStatus(error&&error.message?error.message:"Salvataggio non riuscito.","error");
    }
  }

  function normalizeSetupTeamName(value){
    let name=formatTeamDisplayName(String(value||"").replace(/^[\s*•·▪◦‣⁃–—-]+/,""));
    const aliases={
      "roma":"AS Roma",
      "lazio":"SS Lazio",
      "hertha berlin":"Hertha BSC",
      "hertha bsc":"Hertha BSC",
      "inter":"Internazionale",
      "internazionale milano":"Internazionale"
    };
    const key=name.toLocaleLowerCase("it-IT");
    return aliases[key]||name;
  }
  function cleanSetupImportLines(text){return String(text||"").replace(/\r/g,"").split("\n").map(function(x){return x.trim();}).filter(Boolean);}
  function isSetupNoise(line){
    const low=line.toLowerCase();
    if(/^(chiudi|close menu|soccer manager home|negozio|impostazioni account|aiuto|comunità|lingua|termini di utilizzo|informativa sulla privacy|esci|name here|tabelle risultati partite classifichegiocatori|normale full forma campionato)$/i.test(line))return true;
    if(/^(pos|squadra|g|v|n|p|pti)$/i.test(line))return true;
    if(/^pos\s+squadra(?:\s+[gvnpp]+|\s+pti|\s+pt|\s+punti)+$/i.test(line.replace(/\s+/g," ").trim()))return true;
    if(/^pos\s+squadra\s+g\s+v\s+(?:n|p)\s+p\s+(?:p|pti)(?:\s+pti)?$/i.test(line.replace(/\s+/g," ").trim()))return true;
    if(low.indexOf("squadre in corsivo")>=0)return true;
    if(/^[0-9]+$/.test(line))return true;
    if(/^[0-9]+(?:\s+[0-9]+){2,}$/.test(line))return true;
    if(line.indexOf("@")>=0)return true;
    return false;
  }
  function parseSetupTeamNames(text,expected){
    const lines=cleanSetupImportLines(text),names=[];
    for(let i=0;i<lines.length;i++){
      if(/^\d{1,2}$/.test(lines[i])){
        const pos=Number(lines[i]);if(pos<1||pos>expected)continue;
        let j=i+1;while(j<lines.length&&isSetupNoise(lines[j]))j++;
        if(j<lines.length&&!/^\d/.test(lines[j])){const cleaned=normalizeSetupTeamName(lines[j]);if(cleaned&&!names.includes(cleaned))names.push(cleaned);}
      }
    }
    if(names.length!==expected){
      const fallback=[];
      lines.forEach(function(line){
        if(isSetupNoise(line)||/^\d/.test(line)||line.length<2)return;
        if(/^(Tommaso Mello|Allenatore Gold|HERTHA BSC)$/i.test(line)&&lines.indexOf(line)<12)return;
        const cleaned=normalizeSetupTeamName(line);if(cleaned&&!fallback.includes(cleaned))fallback.push(cleaned);
      });
      if(fallback.length===expected)return fallback;
    }
    return names;
  }

  function previewDivisionTeamImport(card){
    const expected=Number(card.getAttribute("data-expected")),names=parseSetupTeamNames(card.querySelector(".gwTeamImportText").value,expected),preview=card.querySelector(".nx-team-preview");
    preview.innerHTML=`<strong>${names.length} squadre trovate su ${expected}</strong><div>${names.map(function(name){return `<span>${esc(name)}</span>`;}).join("")}</div>${names.length!==expected?'<small class="nx-warning-text">Il numero non coincide con quello previsto. Controlla il testo incollato.</small>':""}`;
    return names;
  }

  async function saveDivisionTeamImport(card){
    const expected=Number(card.getAttribute("data-expected")),divisionNumber=Number(card.getAttribute("data-division-number")),nationRaw=card.getAttribute("data-nation-id"),nationId=nationRaw?Number(nationRaw):null,names=previewDivisionTeamImport(card),season=activeSetupSeason();
    if(!season){setGwSetupStatus("Salva prima una stagione attiva.","error");return;}
    if(names.length!==expected){setGwSetupStatus(`Division ${divisionNumber}: servono esattamente ${expected} squadre.`,"error");return;}
    setGwSetupStatus(`Salvataggio Division ${divisionNumber}…`,"");
    try{
      const existingResult=await state.client.from("gw_teams").select("team_id,team_name,display_name").eq("game_world_id",state.adminGwSetupWorldId);if(existingResult.error)throw existingResult.error;
      const map=new Map((existingResult.data||[]).map(function(team){return [normalizeParticipantKey(team.team_name),team];}));
      const missing=names.filter(function(name){return !map.has(normalizeParticipantKey(name));}).map(function(name){return {game_world_id:state.adminGwSetupWorldId,country_id:null,team_type:"club",team_name:name,display_name:name};});
      if(missing.length){const inserted=await state.client.from("gw_teams").insert(missing).select("team_id,team_name,display_name");if(inserted.error)throw inserted.error;(inserted.data||[]).forEach(function(team){map.set(normalizeParticipantKey(team.team_name),team);});}
      let deleteQuery=state.client.from("gw_setup_team_divisions").delete().eq("game_world_id",state.adminGwSetupWorldId).eq("season_id",season.season_id).eq("division_number",divisionNumber);
      deleteQuery=nationId?deleteQuery.eq("nation_setup_id",nationId):deleteQuery.is("nation_setup_id",null);
      let result=await deleteQuery;if(result.error)throw result.error;
      const rows=names.map(function(name){return {game_world_id:state.adminGwSetupWorldId,season_id:season.season_id,nation_setup_id:nationId,division_number:divisionNumber,team_id:map.get(normalizeParticipantKey(name)).team_id};});
      result=await state.client.from("gw_setup_team_divisions").insert(rows);if(result.error)throw result.error;
      await loadAdminGameWorldSetup();setGwSetupStatus(`Division ${divisionNumber}: ${names.length} squadre salvate su Supabase.`,"success");
    }catch(error){setGwSetupStatus(error&&error.message?error.message:"Import squadre non riuscito.","error");}
  }


  function adminArchiveSeasonPage(){
    const options=state.worlds.map(function(world){
      return `<option value="${esc(world.id)}">${esc(world.id)} · ${esc(world.name)}</option>`;
    }).join("");

    return `
      <section class="nx-admin-shell nx-archive-season-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backArchiveSeason">‹ Admin Console</button>
          <small>SEASON ARCHIVE · ${NEXUS_BUILD_LABEL}</small>
          <h1>Archive Season</h1>
          <p>Congela la classifica finale, conserva risultati e H2H, chiude la stagione corrente e prepara la successiva.</p>
        </div>

        <div class="nx-setup-toolbar">
          <label>Game World
            <select id="archiveWorld">
              <option value="">Seleziona Game World</option>
              ${options}
            </select>
          </label>
          <button class="primary" id="previewArchiveSeason" type="button">Controlla stagione</button>
        </div>

        <div id="archiveSeasonStatus" class="status"></div>
        <div id="archiveSeasonBody" class="nx-gw-setup-body">
          <div class="nx-empty-state">Seleziona un Game World per verificare la stagione corrente.</div>
        </div>
      </section>`;
  }

  function bindAdminArchiveSeason(){
    document.getElementById("backArchiveSeason").addEventListener("click",function(){
      state.adminPage="home";
      renderShell();
    });

    document.getElementById("previewArchiveSeason").addEventListener("click",loadArchiveSeasonPreview);
  }

  function setArchiveSeasonStatus(message,type){
    const node=document.getElementById("archiveSeasonStatus");
    if(!node)return;
    node.className="status"+(type?" "+type:"");
    node.textContent=message||"";
  }

  function archiveTeamName(team){
    if(!team)return "Squadra";
    return teamDisplayName(team)||team.team_name||"Squadra";
  }

  function calculateArchiveStandings(matches){
    const table=new Map();

    (matches||[]).forEach(function(match){
      if(!StatisticsEngine.isPlayed(match))return;
      if(!match.home_team_id||!match.away_team_id)return;

      const participants=[
        {
          id:match.home_team_id,
          name:archiveTeamName(match.home_team),
          gf:Number(match.home_score),
          ga:Number(match.away_score)
        },
        {
          id:match.away_team_id,
          name:archiveTeamName(match.away_team),
          gf:Number(match.away_score),
          ga:Number(match.home_score)
        }
      ];

      participants.forEach(function(participant,index){
        const key=String(participant.id);
        if(!table.has(key)){
          table.set(key,{
            team_id:participant.id,
            team_name:participant.name,
            played:0,won:0,drawn:0,lost:0,
            goals_for:0,goals_against:0,
            goal_difference:0,points:0
          });
        }

        const row=table.get(key);
        row.played+=1;
        row.goals_for+=participant.gf;
        row.goals_against+=participant.ga;

        if(participant.gf>participant.ga){
          row.won+=1;
          row.points+=3;
        }else if(participant.gf<participant.ga){
          row.lost+=1;
        }else{
          row.drawn+=1;
          row.points+=1;
        }
      });
    });

    return Array.from(table.values()).map(function(row){
      row.goal_difference=row.goals_for-row.goals_against;
      return row;
    }).sort(function(a,b){
      if(b.points!==a.points)return b.points-a.points;
      if(b.goal_difference!==a.goal_difference)return b.goal_difference-a.goal_difference;
      if(b.goals_for!==a.goals_for)return b.goals_for-a.goals_for;
      return String(a.team_name).localeCompare(String(b.team_name),"it");
    });
  }

  async function getArchiveSeasonContext(worldId){
    const seasonResult=await state.client
      .from("gw_seasons")
      .select("season_id,game_world_id,season_number,season_status,start_date,end_date")
      .eq("game_world_id",worldId)
      .eq("season_status","current")
      .order("season_number",{ascending:false})
      .limit(1)
      .maybeSingle();

    if(seasonResult.error)throw seasonResult.error;
    if(!seasonResult.data)throw new Error("Nessuna stagione corrente trovata per "+worldId+".");

    const season=seasonResult.data;

    const results=await Promise.all([
      state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,competition_type,division_id")
        .eq("game_world_id",worldId)
        .eq("competition_type","league")
        .order("competition_id",{ascending:true}),

      state.client
        .from("gw_matches")
        .select(`match_id,competition_id,match_status,home_score,away_score,home_team_id,away_team_id,
          home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
          away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name)`)
        .eq("game_world_id",worldId)
        .eq("season_id",season.season_id),

      state.client
        .from("imc_trophies")
        .select("trophy_id,competition_id,winning_team_id,winning_nation_id,winning_manager_id")
        .eq("game_world_id",worldId)
        .eq("season_id",season.season_id)
    ]);

    results.forEach(function(result){if(result.error)throw result.error;});

    const competitions=results[0].data||[];
    const matches=results[1].data||[];
    const trophies=results[2].data||[];

    const completedMatches=matches.filter(StatisticsEngine.isPlayed);
    const standingsByCompetition=[];

    competitions.forEach(function(competition){
      const competitionMatches=completedMatches.filter(function(match){
        return String(match.competition_id)===String(competition.competition_id);
      });
      const rows=calculateArchiveStandings(competitionMatches);
      standingsByCompetition.push({
        competition:competition,
        matches:competitionMatches,
        rows:rows
      });
    });

    return {
      worldId:worldId,
      season:season,
      competitions:competitions,
      matches:matches,
      completedMatches:completedMatches,
      trophies:trophies,
      standingsByCompetition:standingsByCompetition
    };
  }

  function archiveSeasonPreviewMarkup(context){
    const totalGoals=context.completedMatches.reduce(function(total,match){
      return total+Number(match.home_score||0)+Number(match.away_score||0);
    },0);

    const incomplete=context.standingsByCompetition.filter(function(item){
      return !item.matches.length||!item.rows.length;
    });

    return `
      <section class="nx-setup-section">
        <div class="nx-section-heading">
          <div>
            <small>${esc(context.worldId)}</small>
            <h2>Season ${esc(context.season.season_number)}</h2>
          </div>
        </div>

        <div class="nx-stat-grid">
          ${statCard("Campionati",context.competitions.length)}
          ${statCard("Partite concluse",context.completedMatches.length)}
          ${statCard("Gol",totalGoals)}
          ${statCard("Trofei registrati",context.trophies.length)}
        </div>

        <div class="nx-domestic-list">
          ${context.standingsByCompetition.map(function(item){
            const leader=item.rows[0];
            return `<article class="nx-domestic-card">
              <div class="nx-domestic-title">
                <div>
                  <small>${item.matches.length} PARTITE</small>
                  <h3>${esc(item.competition.competition_name)}</h3>
                </div>
              </div>
              <p>${leader?`Prima classificata: <strong>${esc(globalClubDisplayName(leader.team_name))}</strong> · ${leader.points} pt`:"Classifica non disponibile"}</p>
            </article>`;
          }).join("")}
        </div>

        ${incomplete.length
          ? `<div class="status error">Archivio bloccato: ${incomplete.length} campionati non hanno risultati sufficienti per generare una classifica.</div>`
          : `<div class="status success">Controllo completato. Risultati e H2H resteranno invariati in gw_matches.</div>
             <div class="nx-editor-actions">
               <button class="primary" id="confirmArchiveSeason" type="button">🏁 Archivia Season ${esc(context.season.season_number)}</button>
             </div>`
        }
      </section>`;
  }

  async function loadArchiveSeasonPreview(){
    const worldId=document.getElementById("archiveWorld").value;
    const body=document.getElementById("archiveSeasonBody");

    if(!worldId){
      setArchiveSeasonStatus("Seleziona un Game World.","error");
      return;
    }

    body.innerHTML='<div class="nx-empty-state">Verifica della stagione in corso…</div>';
    setArchiveSeasonStatus("","");

    try{
      const context=await getArchiveSeasonContext(worldId);
      state.archiveSeasonContext=context;
      body.innerHTML=archiveSeasonPreviewMarkup(context);

      const archiveButton=document.getElementById("confirmArchiveSeason");
      if(archiveButton){
        archiveButton.addEventListener("click",archiveCurrentSeason);
      }
    }catch(error){
      body.innerHTML='<div class="nx-empty-state">Impossibile preparare l’archivio.</div>';
      setArchiveSeasonStatus(error&&error.message?error.message:"Controllo non riuscito.","error");
    }
  }

  async function archiveCurrentSeason(){
    const context=state.archiveSeasonContext;
    if(!context)return;

    const confirmed=window.confirm(
      "Archiviare Season "+context.season.season_number+" di "+context.worldId+
      "?\\n\\nLe classifiche saranno congelate. Risultati e H2H resteranno invariati."
    );
    if(!confirmed)return;

    const button=document.getElementById("confirmArchiveSeason");
    if(button){
      button.disabled=true;
      button.textContent="Archiviazione…";
    }

    setArchiveSeasonStatus("Creazione snapshot e nuova stagione…","");

    try{
      const standingRows=[];

      context.standingsByCompetition.forEach(function(item){
        item.rows.forEach(function(row,index){
          standingRows.push({
            game_world_id:context.worldId,
            season_id:context.season.season_id,
            competition_id:item.competition.competition_id,
            division_name:item.competition.competition_name,
            final_position:index+1,
            team_id:row.team_id,
            team_name:row.team_name,
            played:row.played,
            won:row.won,
            drawn:row.drawn,
            lost:row.lost,
            goals_for:row.goals_for,
            goals_against:row.goals_against,
            goal_difference:row.goal_difference,
            points:row.points,
            updated_at:new Date().toISOString()
          });
        });
      });

      if(!standingRows.length){
        throw new Error("Nessuna classifica finale generata.");
      }

      let result=await state.client
        .from("gw_season_final_standings")
        .upsert(standingRows,{
          onConflict:"game_world_id,season_id,competition_id,final_position"
        });

      if(result.error)throw result.error;

      const totalGoals=context.completedMatches.reduce(function(total,match){
        return total+Number(match.home_score||0)+Number(match.away_score||0);
      },0);

      result=await state.client
        .from("gw_season_archive")
        .upsert({
          game_world_id:context.worldId,
          season_id:context.season.season_id,
          season_number:context.season.season_number,
          matches_count:context.completedMatches.length,
          goals_count:totalGoals,
          league_competitions_count:context.competitions.length,
          trophies_count:context.trophies.length,
          archived_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        },{
          onConflict:"game_world_id,season_id"
        });

      if(result.error)throw result.error;

      const today=new Date().toISOString().slice(0,10);

      result=await state.client
        .from("gw_seasons")
        .update({
          season_status:"past",
          end_date:context.season.end_date||today
        })
        .eq("season_id",context.season.season_id);

      if(result.error)throw result.error;

      const nextNumber=Number(context.season.season_number)+1;

      let nextResult=await state.client
        .from("gw_seasons")
        .select("season_id,season_number")
        .eq("game_world_id",context.worldId)
        .eq("season_number",nextNumber)
        .maybeSingle();

      if(nextResult.error)throw nextResult.error;

      let nextSeason=nextResult.data;

      if(!nextSeason){
        nextResult=await state.client
          .from("gw_seasons")
          .insert({
            game_world_id:context.worldId,
            season_number:nextNumber,
            season_status:"current",
            start_date:null,
            end_date:null
          })
          .select("season_id,season_number")
          .single();

        if(nextResult.error)throw nextResult.error;
        nextSeason=nextResult.data;
      }else{
        result=await state.client
          .from("gw_seasons")
          .update({season_status:"current"})
          .eq("season_id",nextSeason.season_id);

        if(result.error)throw result.error;
      }

      result=await state.client
        .from("gw_world_settings")
        .upsert({
          game_world_id:context.worldId,
          active_season_id:nextSeason.season_id
        },{
          onConflict:"game_world_id"
        });

      if(result.error)throw result.error;

      state.archiveSeasonContext=null;
      document.getElementById("archiveSeasonBody").innerHTML=`
        <section class="nx-setup-section">
          <div class="status success">
            Season ${esc(context.season.season_number)} archiviata correttamente.
            Season ${esc(nextSeason.season_number)} creata e impostata come corrente.
            Risultati e H2H non sono stati modificati.
          </div>
        </section>`;
      setArchiveSeasonStatus("Archivio completato.","success");
    }catch(error){
      setArchiveSeasonStatus(
        error&&error.message
          ? error.message
          : "Archiviazione non riuscita.",
        "error"
      );
      if(button){
        button.disabled=false;
        button.textContent="🏁 Archivia Season "+context.season.season_number;
      }
    }
  }


  function adminConsolePage(){
    return `
      <section class="nx-admin-shell">
        <div class="nx-admin-head">
          <button class="nx-back-link" id="exitAdmin">‹ Torna alla modalità Manager</button>
          <small>GLOBAL SYSTEM AREA</small>
          <h1>Admin Console</h1>
          <p>Strumenti amministrativi trasversali a tutti i Game World.</p>
        </div>
        <div class="nx-admin-grid">
          <button class="nx-admin-card primary-card" data-admin-page="import"><b>⇩</b><strong>Import Center</strong><span>Risultati e schedule per ogni Game World</span></button>
          <button class="nx-admin-card" data-admin-page="manager-registry"><b>♙</b><strong>Manager Registry</strong><span>Gestisci manager e partecipazioni ai Game World</span></button>
          <button class="nx-admin-card" data-admin-page="game-world-setup"><b>◎</b><strong>Game World Setup</strong><span>Stagione, squadre, divisioni e manager</span></button>
          <button class="nx-admin-card" data-admin-page="competition-registry"><b>♛</b><strong>Competition Registry</strong><span>Catalogo globale delle competizioni standard</span></button>
          <button class="nx-admin-card" data-admin-page="trophy-registry"><b>🏆</b><strong>Trophy Registry</strong><span>Vincitori per Game World e stagione</span></button>
          <button class="nx-admin-card primary-card" data-admin-page="archive-season"><b>🏁</b><strong>Archive Season</strong><span>Congela classifiche, chiude la stagione e prepara la successiva</span></button>
          <button class="nx-admin-card"><b>⚙</b><strong>System</strong><span>In preparazione</span></button>
        </div>
      </section>`;
  }

  function bindAdminConsole(){
    document.getElementById("exitAdmin").addEventListener("click",exitAdminMode);
    document.querySelectorAll("[data-admin-page]").forEach(function(button){
      button.addEventListener("click",function(){state.adminPage=button.getAttribute("data-admin-page");renderShell();});
    });
  }

  function exitAdminMode(){
    state.adminMode=false;
    if(state.returnContext){
      Object.assign(state,state.returnContext);
      state.returnContext=null;
    }else{state.page="home";state.selectedWorld=null;}
    renderShell();
  }

  function configuredWorldOptions(){
    return state.worlds.map(function(world){
      return `<option value="${esc(world.id)}">${esc(world.id)} · ${esc(world.name)}</option>`;
    }).join("");
  }

  function configuredCompetitionOptions(worldId){
    const cfg = getWorldConfig(worldId);

    const groups = {
      domestic: [
        {value:"League Cup",label:"National Cup"},
        {value:"League Shield",label:"League Cup"},
        {value:"Charity Shield",label:"Charity Shield"}
      ],
      international: [
        {value:"SMFA Champions",label:"SMFA Champions"},
        {value:"SMFA Shield",label:"SMFA Shield"},
        {value:"SMFA Super Cup",label:"SMFA Super Cup"}
      ],
      nations: [
        {value:"World Cup Qualifying",label:"World Cup Qualifying"},
        {value:"World Cup",label:"World Cup"}
      ]
    };

    if(cfg && cfg.competitions){
      Object.keys(cfg.competitions).forEach(function(displayName){
        const item = cfg.competitions[displayName];
        if(item.type === "league") return;

        const category = item.category || "domestic";
        if(!groups[category]) groups[category] = [];

        const value = item.db || displayName;
        const alreadyPresent = groups[category].some(function(row){
          return row.value === value;
        });

        if(!alreadyPresent){
          groups[category].push({value:value,label:displayName});
        }
      });
    }

    const labels = {
      domestic: "Domestic Cups",
      international: "International",
      nations: "Nations"
    };

    let html = '<option value="league">League · Tutte le Divisioni</option>';

    ["domestic","international","nations"].forEach(function(category){
      const items = groups[category] || [];
      if(!items.length) return;

      html += '<optgroup label="' + labels[category] + '">';
      items.forEach(function(item){
        html += '<option value="' + esc(item.value) + '">' + esc(item.label) + '</option>';
      });
      html += '</optgroup>';
    });

    return html;
  }

  function configuredSeasonOptions(worldId){
    const cfg = getWorldConfig(worldId);
    const season = cfg && cfg.season ? cfg.season : 1;
    return '<option value="' + season + '">Season ' + season + '</option>';
  }

  function adminImportPage(){
    return `
      <section class="nx-admin-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backAdmin">‹ Admin Console</button>
          <small>GLOBAL ADMIN TOOL</small>
          <h1>Import Center</h1>
          <p>Seleziona il Game World prima di importare.</p>
        </div>
        ${importPage(true)}
      </section>`;
  }

  function bindAdminImport(){
    document.getElementById("backAdmin").addEventListener("click",function(){state.adminPage="home";renderShell();});
    bindImport();
  }

  function nxClubHouse(){
    setTimeout(loadClubHouseData,0);

    return `
      <section class="nx-card nx-clubhouse">
        <div class="nx-hero-card">
          <small>CLUB HOUSE</small>
          <h1>${esc(state.user.full_name)}</h1>
          <p>Dati personali e Game World collegati al tuo account.</p>
        </div>

        <div id="clubHouseData" class="nx-empty-state">
          Caricamento dati…
        </div>
      </section>
    `;
  }

  function clubHouseAssignmentVisual(type,name,worldId){
    const url=type==="nation"?nationFlagUrl(name):clubLogoUrl(name,worldId);
    const fallbackData=type==="club"?clubLogoFallbackData(name,worldId):"";

    if(!url){
      return `<span class="nx-clubhouse-assignment-logo nx-clubhouse-assignment-logo-fallback">${type==="nation"?"⚑":"◈"}</span>`;
    }

    return `<span class="nx-clubhouse-assignment-logo">
      <img
        src="${esc(url)}"
        data-logo-fallbacks="${esc(fallbackData)}"
        alt="${esc(name)}"
        loading="lazy"
        onerror="${type==="club"
          ? "if(!advanceClubLogoCandidate(this)){this.style.display='none';this.parentElement.classList.add('nx-clubhouse-assignment-logo-fallback');this.parentElement.textContent='◈';}"
          : "this.style.display='none';this.parentElement.classList.add('nx-clubhouse-assignment-logo-fallback');this.parentElement.textContent='⚑';"}"
      >
    </span>`;
  }

  async function loadClubHouseData(){
    const target=document.getElementById("clubHouseData");
    if(!target||!state.client)return;

    try{
      const assignmentsResult=await state.client
        .from("gw_manager_assignments")
        .select(`
          assignment_id,
          game_world_id,
          team_id,
          nation_id,
          assignment_type,
          start_date,
          end_date,
          gw_teams(team_id,team_name,display_name),
          imc_national_teams(nation_name)
        `)
        .eq("manager_id",state.user.manager_id)
        .order("game_world_id",{ascending:true})
        .order("start_date",{ascending:true});

      if(assignmentsResult.error)throw assignmentsResult.error;

      const rows=assignmentsResult.data||[];

      if(!rows.length){
        target.innerHTML=`
          <div class="nx-empty-box">
            <strong>Nessun incarico disponibile</strong>
            <span>Il database non contiene ancora assegnazioni per questo manager.</span>
          </div>`;
        return;
      }

      const byWorld=new Map();

      rows.forEach(function(row){
        const worldId=String(row.game_world_id||"");
        if(!byWorld.has(worldId))byWorld.set(worldId,[]);
        byWorld.get(worldId).push(row);
      });

      const worldIds=Array.from(byWorld.keys()).sort(function(a,b){
        return a.localeCompare(b,"it",{numeric:true,sensitivity:"base"});
      });

      target.innerHTML=`
        <div class="nx-clubhouse-world-list">
          ${worldIds.map(function(worldId){
            const worldMeta=getWorldMeta(worldId);
            const worldName=worldMeta&&worldMeta.name
              ? worldMeta.name
              : ((getWorldConfig(worldId)||{}).name||worldId);

            const assignments=byWorld.get(worldId)||[];

            const ordered=assignments.slice().sort(function(a,b){
              const aType=a.team_id?"club":"nation";
              const bType=b.team_id?"club":"nation";
              if(aType!==bType)return aType==="club"?-1:1;
              return String(a.start_date||"").localeCompare(String(b.start_date||""));
            });

            return `
              <section class="nx-clubhouse-world-card">
                <div class="nx-clubhouse-world-head">
                  <span>${esc(worldId)}</span>
                  <strong>${esc(worldName)}</strong>
                </div>

                <div class="nx-clubhouse-world-assignments">
                  ${ordered.map(function(row){
                    const isClub=Boolean(row.team_id);
                    const type=isClub?"club":"nation";
                    const name=isClub
                      ? (row.gw_teams&&teamDisplayName(row.gw_teams,row.game_world_id)
                          ? teamDisplayName(row.gw_teams,row.game_world_id)
                          : "Club")
                      : (row.imc_national_teams&&row.imc_national_teams.nation_name
                          ? row.imc_national_teams.nation_name
                          : "Nazionale");

                    const dateLabel=row.start_date
                      ? "Dal "+formatDate(row.start_date)
                      : "Data inizio non disponibile";

                    return `
                      <div class="nx-clubhouse-assignment">
                        ${clubHouseAssignmentVisual(type,name,row.game_world_id)}
                        <div class="nx-clubhouse-assignment-copy">
                          <strong>${esc(name)}</strong>
                          <div class="nx-clubhouse-assignment-meta">
                            <span class="nx-clubhouse-role ${isClub?"is-club":"is-nation"}">${isClub?"CLUB":"NAZIONALE"}</span>
                            <span>${esc(dateLabel)}</span>
                          </div>
                        </div>
                      </div>`;
                  }).join("")}
                </div>
              </section>`;
          }).join("")}
        </div>`;
    }catch(error){
      target.innerHTML=`
        <div class="nx-empty-box">
          <strong>Nessun dato disponibile</strong>
          <span>${esc(error.message||"Errore di lettura database.")}</span>
        </div>`;
    }
  }

  function nxPlaceholder(title,subtitle){
    return `
      <section class="nx-card">
        <div class="nx-page-title">
          <div>
            <h1>${esc(title)}</h1>
            <p>${esc(subtitle)}</p>
          </div>
        </div>

        <div class="nx-empty-box">
          <strong>Nessun dato disponibile</strong>
          <span>Questa sezione non è ancora collegata al database.</span>
        </div>
      </section>
    `;
  }



  const NATION_FLAG_CODES = {
  "Albania": "al",
  "Algeria": "dz",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belarus": "by",
  "Belgium": "be",
  "Bolivia": "bo",
  "Bosnia & Herzegovina": "ba",
  "Brazil": "br",
  "Bulgaria": "bg",
  "Cameroon": "cm",
  "Canada": "ca",
  "Chile": "cl",
  "China": "cn",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Cyprus": "cy",
  "Czech Republic": "cz",
  "Denmark": "dk",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "Estonia": "ee",
  "Finland": "fi",
  "France": "fr",
  "Georgia": "ge",
  "Germany": "de",
  "Ghana": "gh",
  "Greece": "gr",
  "Guinea": "gn",
  "Hungary": "hu",
  "Iceland": "is",
  "Iran": "ir",
  "Iraq": "iq",
  "Ireland": "ie",
  "Israel": "il",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Jamaica": "jm",
  "Japan": "jp",
  "Korea Republic": "kr",
  "Latvia": "lv",
  "Lithuania": "lt",
  "Mali": "ml",
  "Malta": "mt",
  "Mexico": "mx",
  "Moldova": "md",
  "Montenegro": "me",
  "Morocco": "ma",
  "Netherlands": "nl",
  "Northern Ireland": "gb-nir",
  "Nigeria": "ng",
  "Norway": "no",
  "Paraguay": "py",
  "Peru": "pe",
  "Poland": "pl",
  "Portugal": "pt",
  "Republic of Macedonia": "mk",
  "Romania": "ro",
  "Russia": "ru",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "Serbia": "rs",
  "Slovakia": "sk",
  "Slovenia": "si",
  "South Africa": "za",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Trinidad & Tobago": "tt",
  "Tunisia": "tn",
  "Turkey": "tr",
  "United States": "us",
  "Ukraine": "ua",
  "Uruguay": "uy",
  "Venezuela": "ve",
  "Wales": "gb-wls"
};

  const CLUB_LOGO_PATHS = {
  "AC Milan": [
    "italy",
    "milan"
  ],
  "ACF Fiorentina": [
    "italy",
    "fiorentina"
  ],
  "AJAX": [
    "netherlands",
    "ajax"
  ],
  "Ajax": [
    "netherlands",
    "ajax"
  ],
  "AS Roma": [
    "italy",
    "roma"
  ],
  "AZ Alkmaar": [
    "netherlands",
    "az-alkmaar"
  ],
  "Arsenal": [
    "england",
    "arsenal"
  ],
  "Aston Villa": [
    "england",
    "aston-villa"
  ],
  "Athletic Club": [
    "spain",
    "athletic-club"
  ],
  "Atlético Madrid": [
    "spain",
    "atletico-madrid"
  ],
  "Barcelona": [
    "spain",
    "barcelona"
  ],
  "Bayer Leverkusen": [
    "germany",
    "bayer-leverkusen"
  ],
  "Bayern München": [
    "germany",
    "bayern-munich"
  ],
  "Beşiktaş JK": [
    "turkey",
    "besiktas"
  ],
  "Boca Juniors": [
    "argentina",
    "boca-juniors"
  ],
  "Borussia Dortmund": [
    "germany",
    "borussia-dortmund"
  ],
  "CR Flamengo": [
    "brazil",
    "flamengo"
  ],
  "CSKA Moskva": [
    "russia",
    "cska-moscow"
  ],
  "Celtic": [
    "scotland",
    "celtic"
  ],
  "Chelsea": [
    "england",
    "chelsea"
  ],
  "Club América": [
    "mexico",
    "club-america"
  ],
  "Cruzeiro EC": [
    "brazil",
    "cruzeiro"
  ],
  "Dynamo Kyiv": [
    "ukraine",
    "dynamo-kyiv"
  ],
  "Dynamo Moskva": [
    "russia",
    "dynamo-moscow"
  ],
  "Estudiantes de LP": [
    "argentina",
    "estudiantes"
  ],
  "Everton": [
    "england",
    "everton"
  ],
  "FC Porto": [
    "portugal",
    "porto"
  ],
  "FC Schalke 04": [
    "germany",
    "schalke-04"
  ],
  "FC Twente": [
    "netherlands",
    "twente"
  ],
  "Fenerbahçe SK": [
    "turkey",
    "fenerbahce"
  ],
  "Feyenoord": [
    "netherlands",
    "feyenoord"
  ],
  "Fulham": [
    "england",
    "fulham"
  ],
  "Galatasaray SK": [
    "turkey",
    "galatasaray"
  ],
  "Genoa CFC": [
    "italy",
    "genoa"
  ],
  "Girondins Bordeaux": [
    "france",
    "bordeaux"
  ],
  "Grêmio": [
    "brazil",
    "gremio"
  ],
  "Guadalajara": [
    "mexico",
    "guadalajara"
  ],
  "Hamburger SV": [
    "germany",
    "hamburg"
  ],
  "Internazionale": [
    "italy",
    "inter"
  ],
  "Juventus": [
    "italy",
    "juventus"
  ],
  "Lille OSC": [
    "france",
    "lille"
  ],
  "Liverpool": [
    "england",
    "liverpool"
  ],
  "Manchester City": [
    "england",
    "manchester-city"
  ],
  "Manchester United": [
    "england",
    "manchester-united"
  ],
  "Olympiacos": [
    "greece",
    "olympiacos"
  ],
  "Olympique Lyonnais": [
    "france",
    "lyon"
  ],
  "Olympique Marseille": [
    "france",
    "marseille"
  ],
  "PAOK": [
    "greece",
    "paok"
  ],
  "PSV": [
    "netherlands",
    "psv-eindhoven"
  ],
  "Palermo FC": [
    "italy",
    "palermo"
  ],
  "Palmeiras": [
    "brazil",
    "palmeiras"
  ],
  "Panathinaikos": [
    "greece",
    "panathinaikos"
  ],
  "Paris Saint-Germain": [
    "france",
    "paris-saint-germain"
  ],
  "RC Deportivo": [
    "spain",
    "deportivo-la-coruna"
  ],
  "RSC Anderlecht": [
    "belgium",
    "anderlecht"
  ],
  "Rangers": [
    "scotland",
    "rangers"
  ],
  "Real Madrid": [
    "spain",
    "real-madrid"
  ],
  "River Plate": [
    "argentina",
    "river-plate"
  ],
  "Rubin Kazan": [
    "russia",
    "rubin-kazan"
  ],
  "SC Internacional": [
    "brazil",
    "internacional"
  ],
  "SK Rapid Wien": [
    "austria",
    "rapid-vienna"
  ],
  "SL Benfica": [
    "portugal",
    "benfica"
  ],
  "SS Lazio": [
    "italy",
    "lazio"
  ],
  "SSC Napoli": [
    "italy",
    "napoli"
  ],
  "Sampdoria": [
    "italy",
    "sampdoria"
  ],
  "Sevilla FC": [
    "spain",
    "sevilla"
  ],
  "Shakhtar Donetsk": [
    "ukraine",
    "shakhtar-donetsk"
  ],
  "Sporting CP": [
    "portugal",
    "sporting-cp"
  ],
  "Standard Liège": [
    "belgium",
    "standard-liege"
  ],
  "São Paulo FC": [
    "brazil",
    "sao-paulo"
  ],
  "TSG 1899 Hoffenheim": [
    "germany",
    "hoffenheim"
  ],
  "Tottenham Hotspur": [
    "england",
    "tottenham"
  ],
  "Toulouse FC": [
    "france",
    "toulouse"
  ],
  "Udinese Calcio": [
    "italy",
    "udinese"
  ],
  "Valencia CF": [
    "spain",
    "valencia"
  ],
  "VfB Stuttgart": [
    "germany",
    "stuttgart"
  ],
  "VfL Wolfsburg": [
    "germany",
    "wolfsburg"
  ],
  "Villarreal CF": [
    "spain",
    "villarreal"
  ],
  "Werder Bremen": [
    "germany",
    "werder-bremen"
  ],
  "West Ham United": [
    "england",
    "west-ham-united"
  ],
  "Zenit Saint Petersburg": [
    "russia",
    "zenit"
  ]
};

  const GLOBAL_CLUB_LOGO_FILES = {
    '1 fc kaiserslautern': 'kaiserslautern.png',
    'academica coimbra': 'academica-coimbra.png',
    'academica de coimbra': 'academica-coimbra.png',
    'aek atene': 'aek-atene.png',
    'aek athens': 'aek-atene.png',
    'as reggina 1914': 'reggina.png',
    'as roma': 'roma.png',
    'atalanta': 'atalanta.png',
    'atalanta bc': 'atalanta.png',
    'atletico madrid': 'atletico-madrid.png',
    'boca juniors': 'boca-juniors.png',
    'bologna': 'bologna.png',
    'bologna fc': 'bologna.png',
    'borussia dortmund': 'borussia-dortmund.png',
    'campobasso': 'campobasso.png',
    'campobasso calcio': 'campobasso.png',
    'celtic': 'celtic.png',
    'club america': 'club-america.png',
    'cr flamengo': 'flamengo.png',
    'dinamo dresda': 'dinamo-dresda.png',
    'dinamo kiev': 'dinamo-kiev.png',
    'dynamo dresden': 'dinamo-dresda.png',
    'dynamo kyiv': 'dinamo-kiev.png',
    'eintracht francoforte': 'eintracht-francoforte.png',
    'eintracht frankfurt': 'eintracht-francoforte.png',
    'fc kaiserslautern': 'kaiserslautern.png',
    'fc schalke 04': 'schalke-04.png',
    'fenerbache': 'fenerbache.png',
    'fenerbahce sk': 'fenerbache.png',
    'feyenoord': 'feyenoord.png',
    'fk partizan': 'partizan-belgrado.png',
    'flamengo': 'flamengo.png',
    'genoa': 'genoa.png',
    'genoa cfc': 'genoa.png',
    'guangzhou': 'guangzhou.png',
    'guangzhou fc': 'guangzhou.png',
    'hertha berlin': 'hertha-berlino.png',
    'hertha berlino': 'hertha-berlino.png',
    'hertha bsc': 'hertha-berlino.png',
    'kaiserslautern': 'kaiserslautern.png',
    'lazio': 'lazio.png',
    'legia varsavia': 'legia-varsavia.png',
    'legia warszawa': 'legia-varsavia.png',
    'monaco 1860': 'monaco-1860.png',
    'napoli': 'napoli.png',
    'olympique marseille': 'olympique-marsiglia.png',
    'olympique marsiglia': 'olympique-marsiglia.png',
    'palermo': 'palermo.png',
    'palermo fc': 'palermo.png',
    'palmeiras': 'palmeiras.png',
    'parma': 'parma.png',
    'parma calcio 1913': 'parma.png',
    'partizan belgrado': 'partizan-belgrado.png',
    'reggina': 'reggina.png',
    'river plate': 'river-plate.png',
    'roma': 'roma.png',
    'sampdoria': 'sampdoria.png',
    'san paolo': 'san-paolo.png',
    'sao paulo fc': 'san-paolo.png',
    'schalke 04': 'schalke-04.png',
    'shakhtar donetsk': 'shakhtar-donetsk.png',
    'ss lazio': 'lazio.png',
    'ssc napoli': 'napoli.png',
    'sunderland': 'sunderland.png',
    'torino': 'torino.png',
    'tottenham': 'tottenham.png',
    'tottenham hotspur': 'tottenham.png',
    'tsv 1860 munchen': 'monaco-1860.png',
    'valencia': 'valencia.png',
    'valencia cf': 'valencia.png'
  };

  const GW009_CLUB_LOGO_FILES = {
    "ac locri 1909":"locri-gw009.png",
    "ac renate":"renate-gw009.png",
    "ac savoia 1908":"savoia-gw009.png",
    "agropoli":"agropoli-gw009.png",
    "alcione milano":"alcione-milano-gw009.png",
    "asd asti":"asti-gw009.png",
    "asd barletta 1922":"barletta-gw009.png",
    "asd giulianova":"giulianova-gw009.png",
    "asd imperia":"imperia-gw009.png",
    "asd manfredonia":"manfredonia-gw009.png",
    "asti":"asti-gw009.png",
    "barletta":"barletta-gw009.png",
    "battipagliese":"battipagliese-gw009.png",
    "battipagliese 1929":"battipagliese-gw009.png",
    "calcio desenzano ssd":"desenzano-gw009.png",
    "casarano":"casarano-gw009.png",
    "citta di gela":"citta-di-gela-gw009.png",
    "desenzano":"desenzano-gw009.png",
    "enna":"enna-gw009.png",
    "enna calcio":"enna-gw009.png",
    "fc lumezzane":"lumezzane-gw009.png",
    "folgore caratese":"folgore-caratese-gw009.png",
    "giugliano":"giugliano-gw009.png",
    "giulianova":"giulianova-gw009.png",
    "imolese":"imolese-gw009.png",
    "imolese calcio 1919":"imolese-gw009.png",
    "imperia":"imperia-gw009.png",
    "ischia isolaverde":"ischia-isolaverde-gw009.png",
    "locri":"locri-gw009.png",
    "lumezzane":"lumezzane-gw009.png",
    "manfredonia":"manfredonia-gw009.png",
    "milazzo":"milazzo-gw009.png",
    "ostia mare":"ostia-mare-gw009.png",
    "ostia mare lido":"ostia-mare-gw009.png",
    "paganese":"paganese-gw009.png",
    "paganese calcio":"paganese-gw009.png",
    "paterno":"paterno-gw009.png",
    "paterno calcio":"paterno-gw009.png",
    "ragusa":"ragusa-gw009.png",
    "renate":"renate-gw009.png",
    "savoia":"savoia-gw009.png",
    "scafatese":"scafatese-gw009.png",
    "scafatese calcio 1922":"scafatese-gw009.png",
    "sef torres":"torres-gw009.png",
    "ss ischia isolaverde":"ischia-isolaverde-gw009.png",
    "ss milazzo":"milazzo-gw009.png",
    "ss turris calcio":"turris-gw009.png",
    "ssd casarano calcio":"casarano-gw009.png",
    "torres":"torres-gw009.png",
    "turris":"turris-gw009.png",
    "union clodiense":"union-clodiense-gw009.png",
    "union clodiense chioggia":"union-clodiense-gw009.png",
    "us agropoli 1921":"agropoli-gw009.png",
    "us folgore caratese":"folgore-caratese-gw009.png",
    "us vibonese":"vibonese-gw009.png",
    "usd ragusa":"ragusa-gw009.png",
    "vibonese":"vibonese-gw009.png"
  };

  function nationFlagUrl(name){
    const code = NATION_FLAG_CODES[name];
    return code ? `https://flagcdn.com/w160/${code}.png` : "";
  }

  function clubNameToLogoFile(name){
    const slug=normalizeParticipantKey(name)
      .replace(/&/g," and ")
      .replace(/\s+/g,"-")
      .replace(/-+/g,"-")
      .replace(/^-|-$/g,"");

    return slug?slug+".png":"";
  }

  function automaticClubLogoFiles(name){
    const globalClub=globalClubForName(name);
    const sources=[];

    function addSource(value){
      const clean=String(value||"").trim();
      if(clean&&!sources.includes(clean))sources.push(clean);
    }

    // BUILD 1: the clean global display name is always first.
    if(globalClub&&globalClub.display_name){
      addSource(globalClub.display_name);

      const aliases=state.globalClubAliasesById&&
        state.globalClubAliasesById[String(globalClub.club_id)];

      (Array.isArray(aliases)?aliases:[]).forEach(addSource);
    }

    // Keep the raw/local name as the final automatic filename candidate.
    addSource(name);

    const files=[];
    sources.forEach(function(source){
      const file=clubNameToLogoFile(source);
      if(file&&!files.includes(file))files.push(file);
    });

    return files;
  }

  function automaticClubLogoFile(name){
    const files=automaticClubLogoFiles(name);
    return files.length?files[0]:"";
  }

  function clubLogoCandidates(name,worldId){
    const key=normalizeParticipantKey(name);
    const resolvedWorld=String(worldId||state.selectedWorld||"").toUpperCase();
    const candidates=[];

    function add(url){
      const value=String(url||"").trim();
      if(value&&!candidates.includes(value))candidates.push(value);
    }

    const automaticFiles=automaticClubLogoFiles(name);

    // BUILD 1 · GW009 remains the ONLY dedicated visual exception.
    if(resolvedWorld==="GW009"){
      const gw009File=GW009_CLUB_LOGO_FILES[key];
      if(gw009File)add(`assets/clubs/${gw009File}`);
    }else{
      // All normal Game Worlds try the global clean name and every global
      // alias as local PNG filenames before any legacy source.
      automaticFiles.forEach(function(file){
        add(`assets/clubs/${file}`);
      });
    }

    // Explicit DB standard filename.
    const globalClub=globalClubForName(name);
    if(globalClub&&globalClub.logo_file){
      add(`assets/clubs/${globalClub.logo_file}`);
    }

    // Existing Nexus local mappings remain compatible.
    const localFile=GLOBAL_CLUB_LOGO_FILES[key];
    if(localFile){
      add(`assets/clubs/${localFile}`);
    }

    // Existing remote mapping is the final image fallback.
    const path=CLUB_LOGO_PATHS[name];
    if(path){
      add(`https://football-logos.cc/logos/${path[0]}/256x256/${path[1]}.png`);
    }

    // GW009 can fall back to standard global/local PNGs only after its
    // dedicated Kick Off asset has been attempted.
    if(resolvedWorld==="GW009"){
      automaticFiles.forEach(function(file){
        add(`assets/clubs/${file}`);
      });
    }

    return candidates;
  }

  function clubLogoUrl(name,worldId){
    const candidates=clubLogoCandidates(name,worldId);
    return candidates.length?candidates[0]:"";
  }

  function clubLogoFallbackData(name,worldId){
    const candidates=clubLogoCandidates(name,worldId).slice(1);
    return encodeURIComponent(JSON.stringify(candidates));
  }

  function advanceClubLogoCandidate(img){
    if(!img)return false;

    let candidates=[];
    try{
      candidates=JSON.parse(
        decodeURIComponent(img.dataset.logoFallbacks||"%5B%5D")
      );
    }catch(error){
      candidates=[];
    }

    if(!Array.isArray(candidates)||!candidates.length)return false;

    const next=candidates.shift();
    img.dataset.logoFallbacks=encodeURIComponent(JSON.stringify(candidates));
    img.src=next;
    return true;
  }

  // BUILD 1 · inline image onerror handlers execute in window scope.
  // Expose only this safe fallback helper globally.
  window.advanceClubLogoCandidate=advanceClubLogoCandidate;

  function entityVisual(type,name){
    const url=type==="club"
      ? clubLogoUrl(name,state.selectedWorld)
      : nationFlagUrl(name);
    const fallback=type==="club"?"◈":"⚑";
    const fallbackData=type==="club"
      ? clubLogoFallbackData(name,state.selectedWorld)
      : "";

    if(!url){
      return `<span class="nx-entity-tile-icon">${fallback}</span>`;
    }

    return `
      <span class="nx-entity-tile-icon nx-entity-image-wrap">
        <img
          class="nx-entity-image"
          src="${esc(url)}"
          data-logo-fallbacks="${esc(fallbackData)}"
          alt="${esc(name)}"
          loading="lazy"
          onerror="${type==="club"
            ? "if(!advanceClubLogoCandidate(this)){this.style.display='none';this.nextElementSibling.style.display='flex';}"
            : "this.style.display='none';this.nextElementSibling.style.display='flex';"}"
        >
        <span class="nx-entity-image-fallback">${fallback}</span>
      </span>`;
  }

  function entityListPage(type){
    const isClub = type === "club";
    const title = isClub ? "Clubs" : "Nazionali";
    const subtitle = isClub
      ? `Club presenti in ${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}`
      : "Nazionali disponibili nel database";

    setTimeout(function(){ loadEntityList(type); },0);

    return `
      <section class="nx-card">
        <div class="nx-page-title">
          <div>
            <h1>${title}</h1>
            <p id="entityListSubtitle">${subtitle}</p>
          </div>
        </div>

        <div class="nx-entity-toolbar">
          <button
            type="button"
            id="entityImcFilter"
            class="nx-imc-filter${state.entityImcFilter ? " is-active" : ""}"
            aria-pressed="${state.entityImcFilter ? "true" : "false"}"
          >
            IMC
          </button>

          <input
            id="entitySearch"
            type="search"
            placeholder="${isClub ? "Cerca club" : "Cerca nazionale"}"
            autocomplete="off"
          >
        </div>

        <div id="entityListContent" class="nx-entity-grid">
          <div class="nx-loading">Caricamento dati…</div>
        </div>
      </section>
    `;
  }

  function bindEntityList(type){
    const input = document.getElementById("entitySearch");
    if(input){
      input.addEventListener("input",applyEntityListFilters);
    }

    const imcButton = document.getElementById("entityImcFilter");
    if(imcButton){
      imcButton.addEventListener("click",function(){
        state.entityImcFilter = !state.entityImcFilter;
        imcButton.classList.toggle("is-active",state.entityImcFilter);
        imcButton.setAttribute("aria-pressed",state.entityImcFilter ? "true" : "false");
        applyEntityListFilters();
      });
    }

    document.addEventListener("click",entityListClickHandler,{once:true});

    function entityListClickHandler(event){
      const button = event.target.closest("[data-entity-id]");
      if(!button) return;

      const id = button.getAttribute("data-entity-id");
      const name = button.getAttribute("data-entity-name");

      if(type === "club"){
        state.selectedClub = {id:id,name:name};
      }else{
        state.selectedNation = {id:id,name:name};
      }

      renderShell();
    }
  }

  async function loadEntityList(type){
    const target=document.getElementById("entityListContent");
    if(!target||!state.client)return;

    try{
      const worldId=state.selectedWorld||"GW004";

      let entityResult;

      if(type==="club"){
        // Build 23:
        // Gli alias del Game World sono il nome visibile ufficiale dei club.
        // Rileggiamo il registry all'apertura della pagina Clubs così eventuali
        // alias appena creati nel DB sono disponibili immediatamente.
        await loadTeamAliasRegistry();
        await loadGlobalClubRegistry();

        // La sezione Clubs mostra SOLO i club allenabili/iscritti alle Divisioni
        // della stagione attiva. I club esterni (SMFA/cups) restano in gw_teams
        // per risultati, schedule e statistiche, ma non compaiono qui.
        const season=await loadActiveSeasonForImport(worldId);

        const trainableResult=await state.client
          .from("gw_setup_team_divisions")
          .select(`
            team_id,
            gw_teams!inner(
              team_id,
              team_name,
              display_name,
              team_type
            )
          `)
          .eq("game_world_id",worldId)
          .eq("season_id",season.season_id);

        if(trainableResult.error)throw trainableResult.error;

        const uniqueTeams=new Map();

        (trainableResult.data||[]).forEach(function(row){
          const team=row.gw_teams;
          if(!team||team.team_type!=="club")return;
          uniqueTeams.set(String(team.team_id),team);
        });

        entityResult={
          data:Array.from(uniqueTeams.values()).sort(function(a,b){
            return teamDisplayName(a,worldId).localeCompare(teamDisplayName(b,worldId),"it");
          }),
          error:null
        };
      }else{
        entityResult=await state.client
          .from("imc_national_teams")
          .select("nation_id,nation_name")
          .order("nation_name",{ascending:true});
      }

      const assignmentResult=await state.client
        .from("gw_manager_assignments")
        .select("assignment_id,manager_id,team_id,nation_id,start_date,end_date,imc_managers(full_name)")
        .eq("game_world_id",worldId)
        .is("end_date",null)
        .order("start_date",{ascending:false});

      if(entityResult.error)throw entityResult.error;
      if(assignmentResult.error)throw assignmentResult.error;

      const rows=entityResult.data||[];
      const assignments=assignmentResult.data||[];
      const managerByEntity=new Map();

      assignments.forEach(function(row){
        const entityId=type==="club"?row.team_id:row.nation_id;
        if(entityId===null||entityId===undefined)return;

        const key=String(entityId);
        if(managerByEntity.has(key))return;

        managerByEntity.set(key,{
          manager_id:row.manager_id,
          full_name:row.imc_managers&&row.imc_managers.full_name
            ? row.imc_managers.full_name
            : row.manager_id,
          start_date:row.start_date
        });
      });

      if(!rows.length){
        target.innerHTML=`
          <div class="nx-empty-box">
            <strong>Nessun dato disponibile</strong>
            <span>${type==="club"
              ? "Nessun club allenabile configurato nella stagione attiva."
              : "Il database non contiene elementi da mostrare."}</span>
          </div>`;
        return;
      }

      target.innerHTML=rows.map(function(row){
        const id=type==="club"?row.team_id:row.nation_id;
        const name=type==="club"
          ? teamDisplayName(row,worldId)
          : row.nation_name;
        const manager=managerByEntity.get(String(id));
        const managerLabel=manager
          ? manager.full_name
          : (type==="club"?"Vacante":"Nessun CT");
        const hasImcManager=Boolean(manager);

        return `
          <button
            class="nx-entity-tile"
            data-entity-id="${esc(id)}"
            data-entity-name="${esc(name)}"
            data-search-name="${esc((name+" "+managerLabel).toLowerCase())}"
            data-has-imc-manager="${hasImcManager?"1":"0"}"
          >
            ${entityVisual(type,name)}
            <strong>${esc(name)}</strong>
            <small class="nx-entity-manager-preview">${esc(managerLabel)}</small>
          </button>`;
      }).join("");

      const subtitle=document.getElementById("entityListSubtitle");
      if(subtitle){
        subtitle.textContent=type==="club"
          ? rows.length+" club allenabili in "+worldId+" · "+selectedWorldName()
          : rows.length+" nazionali disponibili";
      }

      applyEntityListFilters();

      target.querySelectorAll("[data-entity-id]").forEach(function(button){
        button.addEventListener("click",function(){
          const id=button.getAttribute("data-entity-id");
          const name=button.getAttribute("data-entity-name");

          if(type==="club"){
            state.selectedClub={id:id,name:name};
          }else{
            state.selectedNation={id:id,name:name};
          }

          renderShell();
        });
      });
    }catch(error){
      target.innerHTML=`
        <div class="nx-empty-box">
          <strong>Errore di caricamento</strong>
          <span>${esc(error.message||"Impossibile leggere il database.")}</span>
        </div>`;
    }
  }

  function applyEntityListFilters(){
    const input = document.getElementById("entitySearch");
    const query = input ? String(input.value || "").trim().toLowerCase() : "";

    document.querySelectorAll(".nx-entity-tile").forEach(function(row){
      const name = String(row.getAttribute("data-search-name") || "").toLowerCase();
      const hasImcManager = row.getAttribute("data-has-imc-manager") === "1";
      const matchesSearch = !query || name.includes(query);
      const matchesImc = !state.entityImcFilter || hasImcManager;
      row.hidden = !(matchesSearch && matchesImc);
    });
  }

  function filterEntityRows(value){
    const input = document.getElementById("entitySearch");
    if(input && value !== undefined) input.value = value;
    applyEntityListFilters();
  }

  function entityProfilePage(type){
    const entity = type === "club" ? state.selectedClub : state.selectedNation;
    const icon = type === "club" ? "◈" : "⚑";
    const profileVisual = type === "nation" && entity
      ? entityVisual("nation",entity.name)
      : `<span class="nx-entity-profile-fallback">${icon}</span>`;

    setTimeout(function(){ loadEntityProfile(type); },0);

    return `
      <section class="nx-card">
        <button class="nx-back-link" id="backToEntityList">
          ‹ Torna a ${type === "club" ? "Clubs" : "Nazionali"}
        </button>

        <div class="nx-entity-profile-head">
          <div class="nx-entity-profile-icon">${profileVisual}</div>
          <div>
            <h1>${esc(entity ? entity.name : "")}</h1>
            <p>${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</p>
          </div>
        </div>

        <div id="entityProfileContent">
          <div class="nx-loading">Calcolo statistiche…</div>
        </div>
      </section>
    `;
  }

  function bindEntityProfile(type){
    const back = document.getElementById("backToEntityList");
    if(back){
      back.addEventListener("click",function(){
        if(type === "club") state.selectedClub = null;
        else state.selectedNation = null;
        renderShell();
      });
    }
  }

  async function loadEntityProfile(type){
    const target = document.getElementById("entityProfileContent");
    const entity = type === "club" ? state.selectedClub : state.selectedNation;

    if(!target || !entity || !state.client) return;

    try{
      const idColumnHome = type === "club" ? "home_team_id" : "home_nation_id";
      const idColumnAway = type === "club" ? "away_team_id" : "away_nation_id";

      let query = state.client
        .from("gw_matches")
        .select(`
          match_id,
          match_date,
          match_status,
          match_time,
          round_name,
          stage_name,
          group_name,
          home_score,
          away_score,
          home_penalties,
          away_penalties,
          home_team_id,
          away_team_id,
          home_nation_id,
          away_nation_id,
          competition:gw_competitions!gw_matches_competition_id_fkey(
            competition_id,
            competition_name
          ),
          home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
          away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),
          home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),
          away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)
        `)
        .eq("game_world_id",state.selectedWorld || "GW004")
        .order("match_date",{ascending:false});

      if(type === "club"){
        query = query.or(`${idColumnHome}.eq.${entity.id},${idColumnAway}.eq.${entity.id}`);
      }

      const result = await query;
      if(result.error) throw result.error;

      const assignmentQuery = state.client
        .from("gw_manager_assignments")
        .select("assignment_id,manager_id,team_id,nation_id,start_date,end_date,imc_managers(full_name)")
        .eq("game_world_id",state.selectedWorld || "GW004")
        .is("end_date",null)
        .order("start_date",{ascending:false});

      if(type === "club"){
        assignmentQuery.eq("team_id",entity.id);
      }else{
        assignmentQuery.eq("nation_id",entity.id);
      }

      const assignmentResult = await assignmentQuery.limit(1);
      if(assignmentResult.error) throw assignmentResult.error;

      const activeAssignment = assignmentResult.data && assignmentResult.data.length
        ? assignmentResult.data[0]
        : null;

      let matches = result.data || [];

      if(type === "nation"){
        matches = matches.filter(function(match){
          const idMatch =
            String(match.home_nation_id) === String(entity.id) ||
            String(match.away_nation_id) === String(entity.id);

          const homeName = match.home_nation && match.home_nation.nation_name
            ? match.home_nation.nation_name
            : "";
          const awayName = match.away_nation && match.away_nation.nation_name
            ? match.away_nation.nation_name
            : "";

          const nameMatch =
            normalizeEntityName(homeName) === normalizeEntityName(entity.name) ||
            normalizeEntityName(awayName) === normalizeEntityName(entity.name);

          return idMatch || nameMatch;
        });
      }

      target.innerHTML = renderEntityProfile(type,entity,matches,activeAssignment);

      const managerLink = target.querySelector("[data-entity-profile-manager]");
      if(managerLink){
        managerLink.addEventListener("click",function(){
          state.selectedClub = null;
          state.selectedNation = null;
          state.selectedDivision = null;
          state.selectedCompetition = null;
          state.worldSection = "managers";
          state.selectedManager = {
            id:managerLink.getAttribute("data-manager-id"),
            name:managerLink.getAttribute("data-manager-name")
          };
          renderShell();
        });
      }
    }catch(error){
      target.innerHTML = `
        <div class="nx-empty-box">
          <strong>Errore statistiche</strong>
          <span>${esc(error.message || "Impossibile calcolare le statistiche.")}</span>
        </div>`;
    }
  }

  function normalizeEntityName(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"")
      .trim();
  }

  // BUILD 1 · Results always take precedence over Schedule.
  function matchParticipantKey(match,side){
    const teamId=side === "home" ? match.home_team_id : match.away_team_id;
    const nationId=side === "home" ? match.home_nation_id : match.away_nation_id;
    if(teamId) return "T:"+String(teamId);
    if(nationId) return "N:"+String(nationId);

    const team=side === "home" ? match.home_team : match.away_team;
    const nation=side === "home" ? match.home_nation : match.away_nation;
    const fallback=team && (team.team_id || team.display_name || team.team_name)
      ? (team.team_id || team.display_name || team.team_name)
      : (nation && nation.nation_name ? nation.nation_name : "");
    return "X:"+normalizeEntityName(fallback);
  }

  function competitionMatchKey(match){
    const competitionId=match.competition_id ||
      (match.competition && match.competition.competition_id) ||
      (match.competition && match.competition.competition_name) ||
      state.selectedCompetition || "";
    const worldId=match.game_world_id || state.selectedWorld || "";
    const participants=[
      matchParticipantKey(match,"home"),
      matchParticipantKey(match,"away")
    ].sort();

    return [
      worldId,
      competitionId,
      match.match_date || "",
      participants[0],
      participants[1]
    ].join("|");
  }

  function removeResultsScheduleDuplicates(matches){
    const list=Array.isArray(matches) ? matches : [];
    const playedKeys=new Set();
    const scheduledKeys=new Set();

    list.forEach(function(match){
      if(StatisticsEngine.isPlayed(match)) playedKeys.add(competitionMatchKey(match));
    });

    return list.filter(function(match){
      if(StatisticsEngine.isPlayed(match)) return true;
      const key=competitionMatchKey(match);
      if(playedKeys.has(key)) return false;
      if(scheduledKeys.has(key)) return false;
      scheduledKeys.add(key);
      return true;
    });
  }

  const StatisticsEngine = {
    isPlayed:function(match){
      return Boolean(
        match &&
        match.home_score !== null &&
        match.away_score !== null &&
        match.home_score !== "" &&
        match.away_score !== "" &&
        Number.isFinite(Number(match.home_score)) &&
        Number.isFinite(Number(match.away_score))
      );
    },

    isScheduled:function(match){
      return !this.isPlayed(match);
    },

    empty:function(){
      return {
        played:0,
        won:0,
        drawn:0,
        lost:0,
        gf:0,
        ga:0,
        gd:0,
        points:0,
        winRate:0
      };
    },

    summarize:function(matches,perspectiveResolver){
      const stats = this.empty();

      (matches || []).forEach(function(match){
        if(!StatisticsEngine.isPlayed(match)) return;

        const perspective = perspectiveResolver(match);
        if(!perspective || (perspective.side !== "home" && perspective.side !== "away")) return;

        const isHome = perspective.side === "home";
        const gf = Number(isHome ? match.home_score : match.away_score);
        const ga = Number(isHome ? match.away_score : match.home_score);

        stats.played += 1;
        stats.gf += gf;
        stats.ga += ga;

        if(gf > ga){
          stats.won += 1;
          stats.points += 3;
        }else if(gf < ga){
          stats.lost += 1;
        }else{
          stats.drawn += 1;
          stats.points += 1;
        }
      });

      stats.gd = stats.gf - stats.ga;
      stats.winRate = stats.played
        ? Math.round((stats.won / stats.played) * 100)
        : 0;

      return stats;
    },

    standings:function(matches,participantResolver){
      const table = new Map();

      (matches || []).forEach(function(match){
        if(!StatisticsEngine.isPlayed(match)) return;

        const participants = participantResolver(match);
        if(!participants || !participants.home || !participants.away) return;

        const homeName = participants.home;
        const awayName = participants.away;

        if(!table.has(homeName)) table.set(homeName,StatisticsEngine.empty());
        if(!table.has(awayName)) table.set(awayName,StatisticsEngine.empty());

        const home = table.get(homeName);
        const away = table.get(awayName);
        const homeScore = Number(match.home_score);
        const awayScore = Number(match.away_score);

        home.team = homeName;
        away.team = awayName;
        home.played += 1;
        away.played += 1;
        home.gf += homeScore;
        home.ga += awayScore;
        away.gf += awayScore;
        away.ga += homeScore;

        if(homeScore > awayScore){
          home.won += 1;
          away.lost += 1;
          home.points += 3;
        }else if(homeScore < awayScore){
          away.won += 1;
          home.lost += 1;
          away.points += 3;
        }else{
          home.drawn += 1;
          away.drawn += 1;
          home.points += 1;
          away.points += 1;
        }
      });

      return Array.from(table.values()).map(function(row){
        row.gd = row.gf - row.ga;
        row.winRate = row.played
          ? Math.round((row.won / row.played) * 100)
          : 0;
        return row;
      }).sort(function(a,b){
        if(b.points !== a.points) return b.points-a.points;
        if(b.gd !== a.gd) return b.gd-a.gd;
        if(b.gf !== a.gf) return b.gf-a.gf;
        return String(a.team).localeCompare(String(b.team));
      });
    }
  };

  function isPlayedMatch(match){
    return StatisticsEngine.isPlayed(match);
  }

  function isScheduledMatch(match){
    return StatisticsEngine.isScheduled(match);
  }

  function nationInlineVisual(name){
    const url = nationFlagUrl(name);
    if(!url) return "";

    return `<img class="nx-inline-flag" src="${esc(url)}" alt="${esc(name)}" loading="lazy">`;
  }

  function renderEntityProfile(type,entity,matches,activeAssignment){
    const cleanMatches = removeResultsScheduleDuplicates(matches);
    const played = cleanMatches.filter(isPlayedMatch);
    const scheduled = cleanMatches.filter(isScheduledMatch);

    const overall = calculateEntityStats(type,entity.id,played);
    const byCompetition = {};

    played.forEach(function(match){
      const competitionName =
        match.competition && match.competition.competition_name
          ? match.competition.competition_name
          : "Competizione non definita";

      if(!byCompetition[competitionName]) byCompetition[competitionName] = [];
      byCompetition[competitionName].push(match);
    });

    const competitionNames = Object.keys(byCompetition).sort(function(a,b){
      return a.localeCompare(b);
    });

    const roleLabel = type === "club" ? "Manager" : "CT";
    const emptyLabel = type === "club" ? "Vacante" : "Nessun CT";
    const managerName = activeAssignment
      ? (
          activeAssignment.imc_managers && activeAssignment.imc_managers.full_name
            ? activeAssignment.imc_managers.full_name
            : activeAssignment.manager_id
        )
      : emptyLabel;

    const managerMarkup = activeAssignment
      ? `<button
          type="button"
          class="nx-entity-current-manager-link"
          data-entity-profile-manager
          data-manager-id="${esc(activeAssignment.manager_id)}"
          data-manager-name="${esc(managerName)}"
        >
          <span>${esc(roleLabel)}</span>
          <strong>${esc(managerName)}</strong>
          <small>Dal ${activeAssignment.start_date ? esc(formatDate(activeAssignment.start_date)) : "data non disponibile"}</small>
        </button>`
      : `<div class="nx-entity-current-manager is-vacant">
          <span>${esc(roleLabel)}</span>
          <strong>${esc(emptyLabel)}</strong>
        </div>`;

    return `
      <div class="nx-entity-current-manager-wrap">
        ${managerMarkup}
      </div>

      <div class="nx-stat-grid">
        ${statCard("G",overall.played)}
        ${statCard("V",overall.won)}
        ${statCard("N",overall.drawn)}
        ${statCard("P",overall.lost)}
        ${statCard("GF",overall.gf)}
        ${statCard("GS",overall.ga)}
        ${statCard("DR",formatSigned(overall.gd))}
        ${statCard("Vittorie",overall.winRate + "%")}
      </div>

      <div class="nx-profile-section">
        <h2>Statistiche per competizione</h2>

        ${competitionNames.length
          ? competitionNames.map(function(name){
              const stats = calculateEntityStats(type,entity.id,byCompetition[name]);
              const config = getCompetitionConfigByDbName(name,state.selectedWorld || "GW004");
              const trophy = config && config.trophy ? config.trophy : "";

              return `
                <div class="nx-competition-stat">
                  <div class="nx-competition-stat-head">
                    <div class="nx-mini-trophy">
                      ${trophy ? `<img src="${esc(trophy)}" alt="">` : "🏆"}
                    </div>
                    <div>
                      <strong>${esc(getCompetitionDisplayName(name))}</strong>
                      <span>${stats.played} partite giocate</span>
                    </div>
                  </div>

                  <div class="nx-stat-line">
                    <span>G ${stats.played}</span>
                    <span>V ${stats.won}</span>
                    <span>N ${stats.drawn}</span>
                    <span>P ${stats.lost}</span>
                    <span>GF ${stats.gf}</span>
                    <span>GS ${stats.ga}</span>
                    <strong>DR ${formatSigned(stats.gd)}</strong>
                  </div>
                </div>`;
            }).join("")
          : `<div class="nx-empty-box">
              <strong>Nessuna partita giocata</strong>
              <span>Non risultano statistiche disponibili.</span>
            </div>`}
      </div>

      <div class="nx-profile-section">
        <h2>Ultimi risultati</h2>
        ${renderEntityMatches(type,entity.id,played.slice(0,10),"played")}
      </div>

      <div class="nx-profile-section">
        <h2>Schedule</h2>
        ${renderEntityMatches(type,entity.id,scheduled.slice().sort(function(a,b){
          return String(a.match_date).localeCompare(String(b.match_date));
        }).slice(0,10),"scheduled")}
      </div>
    `;
  }

  function getCompetitionDisplayName(dbName){
    const worldConfig = getWorldConfig(state.selectedWorld || "GW004");
    if(!worldConfig || !worldConfig.competitions) return canonicalDomesticCupDisplayName(dbName);

    const displayName = Object.keys(worldConfig.competitions).find(function(name){
      const item = worldConfig.competitions[name];
      return (item.db || name) === dbName;
    });

    return displayName ? displayName : canonicalDomesticCupDisplayName(dbName);
  }

  function calculateEntityStats(type,entityId,matches){
    const selectedEntity = type === "club" ? state.selectedClub : state.selectedNation;

    return StatisticsEngine.summarize(matches,function(match){
      if(type === "club"){
        if(String(match.home_team_id) === String(entityId)) return {side:"home"};
        if(String(match.away_team_id) === String(entityId)) return {side:"away"};
        return null;
      }

      const homeName = match.home_nation && match.home_nation.nation_name
        ? match.home_nation.nation_name
        : "";
      const awayName = match.away_nation && match.away_nation.nation_name
        ? match.away_nation.nation_name
        : "";
      const selectedName = selectedEntity ? selectedEntity.name : "";

      if(
        String(match.home_nation_id) === String(entityId) ||
        normalizeEntityName(homeName) === normalizeEntityName(selectedName)
      ) return {side:"home"};

      if(
        String(match.away_nation_id) === String(entityId) ||
        normalizeEntityName(awayName) === normalizeEntityName(selectedName)
      ) return {side:"away"};

      return null;
    });
  }

  function statCard(label,value){
    return `
      <div class="nx-stat-card">
        <span>${esc(label)}</span>
        <strong>${esc(value)}</strong>
      </div>`;
  }

  function formatSigned(value){
    const number = Number(value || 0);
    return number > 0 ? "+" + number : String(number);
  }

  function renderEntityMatches(type,entityId,matches,status){
    if(!matches.length){
      return `
        <div class="nx-empty-box">
          <strong>Nessuna partita disponibile</strong>
          <span>${status === "played"
            ? "Non risultano risultati."
            : "Non risultano partite programmate."}</span>
        </div>`;
    }

    return `
      <div class="nx-entity-match-list">
        ${matches.map(function(match){
          const home = participantName(match,"home");
          const away = participantName(match,"away");
          const competitionName =
            match.competition && match.competition.competition_name
              ? getCompetitionDisplayName(match.competition.competition_name)
              : "Competizione";

          const center = status === "played"
            ? `${match.home_score} - ${match.away_score}`
            : "VS";

          return `
            <div class="nx-entity-match">
              <div class="nx-entity-match-meta">
                <strong>${esc(competitionVisualLabel(competitionName))}</strong>
                <span>${formatDate(match.match_date)}</span>
              </div>

              <div class="match-line">
                ${staticMatchParticipantMarkup(match,"home")}
                <span class="match-score">${esc(center)}</span>
                ${staticMatchParticipantMarkup(match,"away")}
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }


  function managerRegistryPage(){
    setTimeout(loadManagerRegistry,0);
    return `<section class="nx-card"><div class="nx-page-title"><div><h1>Managers</h1><p>Manager attivi in ${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</p></div></div><div class="nx-entity-search"><input id="managerSearchInput" type="search" placeholder="Cerca manager" autocomplete="off"></div><div id="managerRegistryContent" class="nx-entity-grid"><div class="nx-loading">Caricamento manager…</div></div></section>`;
  }

  function bindManagerRegistry(){
    const input=document.getElementById("managerSearchInput");
    if(input){input.addEventListener("input",function(){const q=String(input.value||"").trim().toLowerCase();document.querySelectorAll(".nx-manager-row").forEach(function(row){const hay=row.getAttribute("data-search")||"";row.hidden=q&&!hay.includes(q);});});}
  }

  async function loadManagerRegistry(){
    const target=document.getElementById("managerRegistryContent"); if(!target||!state.client)return;
    try{
      const result=await state.client.from("gw_manager_assignments").select(`assignment_id,manager_id,team_id,nation_id,start_date,end_date,gw_teams(team_id,team_name,display_name),imc_national_teams(nation_name),imc_managers(full_name)`).eq("game_world_id",state.selectedWorld || "GW004").order("start_date",{ascending:false});
      if(result.error)throw result.error;
      const grouped={};
      (result.data||[]).forEach(function(row){const id=row.manager_id;if(!grouped[id])grouped[id]={manager_id:id,full_name:row.imc_managers&&row.imc_managers.full_name?row.imc_managers.full_name:"Manager non disponibile",club:null,nation:null};if(!row.end_date&&row.gw_teams&&teamDisplayName(row.gw_teams)&&!grouped[id].club)grouped[id].club={name:teamDisplayName(row.gw_teams),start_date:row.start_date};if(!row.end_date&&row.imc_national_teams&&row.imc_national_teams.nation_name&&!grouped[id].nation)grouped[id].nation={name:row.imc_national_teams.nation_name,start_date:row.start_date};});
      const managers=Object.values(grouped).sort(function(a,b){return a.full_name.localeCompare(b.full_name);});
      if(!managers.length){target.innerHTML=`<div class="nx-empty-box"><strong>Nessun manager disponibile</strong><span>Non risultano assegnazioni per il Game World selezionato.</span></div>`;return;}
      target.innerHTML=managers.map(function(m){const sub=[m.club?m.club.name:null,m.nation?m.nation.name:null].filter(Boolean).join(" · ")||"Nessuna assegnazione attiva";return `<button class="nx-manager-row nx-entity-tile" data-manager-id="${esc(m.manager_id)}" data-manager-name="${esc(m.full_name)}" data-search="${esc((m.full_name+" "+m.manager_id+" "+sub).toLowerCase())}"><span class="nx-entity-tile-icon nx-manager-tile-icon">●</span><strong>${esc(m.full_name)}</strong><small>${esc(m.manager_id)}</small><small class="nx-manager-tile-sub">${esc(sub)}</small></button>`;}).join("");
      target.querySelectorAll("[data-manager-id]").forEach(function(button){button.addEventListener("click",function(){state.selectedManager={id:button.getAttribute("data-manager-id"),name:button.getAttribute("data-manager-name")};renderShell();});});
    }catch(error){target.innerHTML=`<div class="nx-empty-box"><strong>Errore caricamento manager</strong><span>${esc(error.message||"Impossibile leggere le assegnazioni.")}</span></div>`;}
  }

  function managerProfilePage(){const m=state.selectedManager;setTimeout(loadManagerProfile,0);return `<section class="nx-card"><button class="nx-back-link" id="backToManagerRegistry">‹ Torna a Managers</button><div class="nx-manager-profile-head"><div class="nx-manager-photo">●</div><div><h1>${esc(m?m.name:"")}</h1><p>${esc(m?m.id:"")}</p></div></div><div id="managerProfileContent"><div class="nx-loading">Calcolo profilo manager…</div></div></section>`;}
  function bindManagerProfile(){const b=document.getElementById("backToManagerRegistry");if(b)b.addEventListener("click",function(){state.selectedManager=null;renderShell();});}

  async function loadManagerProfile(){
    const target=document.getElementById("managerProfileContent"),m=state.selectedManager;if(!target||!m||!state.client)return;
    try{
      const ar=await state.client.from("gw_manager_assignments").select(`assignment_id,manager_id,team_id,nation_id,start_date,end_date,gw_teams(team_id,team_name,display_name),imc_national_teams(nation_name)`).eq("game_world_id",state.selectedWorld || "GW004").eq("manager_id",m.id).order("start_date",{ascending:true});if(ar.error)throw ar.error;
      const mr=await state.client.from("gw_matches").select(`match_id,match_date,match_status,match_time,round_name,stage_name,group_name,home_score,away_score,home_team_id,away_team_id,home_nation_id,away_nation_id,competition:gw_competitions!gw_matches_competition_id_fkey(competition_id,competition_name),home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)`).eq("game_world_id",state.selectedWorld || "GW004").order("match_date",{ascending:false});if(mr.error)throw mr.error;
      const allAssign=await state.client.from("gw_manager_assignments").select("manager_id,team_id,nation_id,start_date,end_date,imc_managers(full_name)").eq("game_world_id",state.selectedWorld || "GW004");if(allAssign.error)throw allAssign.error;
      target.innerHTML=renderManagerProfile(m,ar.data||[],mr.data||[],allAssign.data||[]);
    }catch(error){target.innerHTML=`<div class="nx-empty-box"><strong>Errore profilo manager</strong><span>${esc(error.message||"Impossibile calcolare il profilo.")}</span></div>`;}
  }

  function renderManagerProfile(manager,assignments,allMatches,allAssignments){
    const clubs=assignments.filter(a=>!!a.team_id), nations=assignments.filter(a=>!!a.nation_id);
    const activeClub=clubs.find(a=>!a.end_date)||null, activeNation=nations.find(a=>!a.end_date)||null;
    const clubMatches=collectAssignmentMatches("club",clubs,allMatches), nationMatches=collectAssignmentMatches("nation",nations,allMatches);
    const clubPlayed=clubMatches.filter(StatisticsEngine.isPlayed), nationPlayed=nationMatches.filter(StatisticsEngine.isPlayed);
    const total=mergeStats(calculateManagerStats("club",clubs,clubPlayed),calculateManagerStats("nation",nations,nationPlayed));
    const combined=clubMatches.concat(nationMatches).sort((a,b)=>String(b.match_date).localeCompare(String(a.match_date)));
    return `<div class="nx-assignment-panels">${managerAssignmentCard("Club attuale",activeClub,"club")}${managerAssignmentCard("Nazionale attuale",activeNation,"nation")}</div><div class="nx-profile-section"><h2>Club Career</h2>${renderManagerCareerStats("club",clubs,clubPlayed)}</div><div class="nx-profile-section"><h2>National Team Career</h2>${renderManagerCareerStats("nation",nations,nationPlayed)}</div><div class="nx-profile-section"><h2>Trophy Room</h2><div class="nx-empty-box"><strong>Nessun trofeo registrato</strong><span>La sezione è pronta per lo storico trofei.</span></div></div><div class="nx-profile-section"><h2>H2H Summary</h2>${renderManagerH2H(manager.id,allAssignments,allMatches)}</div><div class="nx-profile-section"><h2>Career Records</h2>${renderManagerRecords(clubs,clubPlayed,nations,nationPlayed)}</div><div class="nx-profile-section"><h2>Career Totals</h2><div class="nx-stat-grid">${statCard("G",total.played)}${statCard("V",total.won)}${statCard("N",total.drawn)}${statCard("P",total.lost)}${statCard("GF",total.gf)}${statCard("GS",total.ga)}${statCard("DR",formatSigned(total.gd))}${statCard("Win",total.winRate+"%")}</div></div><div class="nx-profile-section"><h2>Career Timeline</h2>${renderCareerTimeline(assignments)}</div><div class="nx-profile-section"><h2>Latest Results</h2>${renderManagerMatches(combined.filter(StatisticsEngine.isPlayed).slice(0,10),"played")}</div><div class="nx-profile-section"><h2>Schedule</h2>${renderManagerMatches(removeResultsScheduleDuplicates(combined).filter(StatisticsEngine.isScheduled.bind(StatisticsEngine)).sort((a,b)=>String(a.match_date).localeCompare(String(b.match_date))).slice(0,10),"scheduled")}</div>`;
  }

  function managerAssignmentCard(title,a,type){if(!a)return `<div class="nx-current-assignment"><small>${esc(title)}</small><strong>Nessuna assegnazione</strong></div>`;const name=type==="club"?(a.gw_teams&&teamDisplayName(a.gw_teams)):(a.imc_national_teams&&a.imc_national_teams.nation_name);return `<div class="nx-current-assignment"><small>${esc(title)}</small><strong>${esc(name||"Assegnazione")}</strong><span>Dal ${a.start_date?formatDate(a.start_date):"data non disponibile"}</span></div>`;}

  function assignmentMatchesOne(type,a,m){const id=type==="club"?a.team_id:a.nation_id;const involved=type==="club"?(String(m.home_team_id)===String(id)||String(m.away_team_id)===String(id)):(String(m.home_nation_id)===String(id)||String(m.away_nation_id)===String(id));if(!involved)return false;if(a.start_date&&m.match_date<a.start_date)return false;if(a.end_date&&m.match_date>a.end_date)return false;return true;}
  function collectAssignmentMatches(type,assignments,matches){return matches.filter(m=>assignments.some(a=>assignmentMatchesOne(type,a,m)));}
  function calculateManagerStats(type,assignments,matches){
    return StatisticsEngine.summarize(matches,function(match){
      const assignment = assignments.find(function(item){
        return assignmentMatchesOne(type,item,match);
      });

      if(!assignment) return null;

      if(type === "club"){
        if(String(match.home_team_id) === String(assignment.team_id)) return {side:"home"};
        if(String(match.away_team_id) === String(assignment.team_id)) return {side:"away"};
        return null;
      }

      if(String(match.home_nation_id) === String(assignment.nation_id)) return {side:"home"};
      if(String(match.away_nation_id) === String(assignment.nation_id)) return {side:"away"};
      return null;
    });
  }

  function mergeStats(a,b){const s={played:a.played+b.played,won:a.won+b.won,drawn:a.drawn+b.drawn,lost:a.lost+b.lost,gf:a.gf+b.gf,ga:a.ga+b.ga};s.gd=s.gf-s.ga;s.winRate=s.played?Math.round((s.won/s.played)*100):0;return s;}

  function renderManagerCareerStats(type,assignments,matches){if(!assignments.length)return `<div class="nx-empty-box"><strong>Nessun incarico</strong><span>Non risultano assegnazioni.</span></div>`;return assignments.map(function(a){const name=type==="club"?(a.gw_teams&&teamDisplayName(a.gw_teams)):(a.imc_national_teams&&a.imc_national_teams.nation_name);const relevant=matches.filter(m=>assignmentMatchesOne(type,a,m));const grouped={};relevant.forEach(function(m){const n=m.competition&&m.competition.competition_name?getCompetitionDisplayName(m.competition.competition_name):"Competizione";(grouped[n]||(grouped[n]=[])).push(m);});const comps=Object.keys(grouped).sort().map(function(n){const s=calculateManagerStats(type,[a],grouped[n]);return `<div class="nx-competition-stat"><strong>${esc(n)}</strong><div class="nx-stat-line"><span>G ${s.played}</span><span>V ${s.won}</span><span>N ${s.drawn}</span><span>P ${s.lost}</span><span>GF ${s.gf}</span><span>GS ${s.ga}</span><strong>DR ${formatSigned(s.gd)}</strong></div></div>`;}).join("");return `<div class="nx-manager-career-block"><div class="nx-manager-career-title"><strong>${esc(name||"Assegnazione")}</strong><span>${a.start_date?formatDate(a.start_date):"?"} → ${a.end_date?formatDate(a.end_date):"oggi"}</span></div>${comps||`<div class="nx-empty-box"><strong>Nessuna partita giocata</strong></div>`}</div>`;}).join("");}

  function findManagerForEntity(all,type,id,date){return all.find(function(a){const entityId=type==="club"?a.team_id:a.nation_id;if(String(entityId)!==String(id))return false;if(a.start_date&&date<a.start_date)return false;if(a.end_date&&date>a.end_date)return false;return true;});}
  function renderManagerH2H(managerId,allAssignments,matches){const map={},managerNames={};allAssignments.forEach(function(a){const fullName=a.imc_managers&&a.imc_managers.full_name?String(a.imc_managers.full_name).trim():"";if(fullName)managerNames[a.manager_id]=fullName;});matches.filter(StatisticsEngine.isPlayed).forEach(function(m){const type=(m.home_team_id||m.away_team_id)?"club":"nation";const homeId=type==="club"?m.home_team_id:m.home_nation_id,awayId=type==="club"?m.away_team_id:m.away_nation_id;const hm=findManagerForEntity(allAssignments,type,homeId,m.match_date),am=findManagerForEntity(allAssignments,type,awayId,m.match_date);if(!hm||!am)return;let isHome,rival;if(hm.manager_id===managerId){isHome=true;rival=am.manager_id;}else if(am.manager_id===managerId){isHome=false;rival=hm.manager_id;}else return;if(rival===managerId)return;const r=map[rival]||(map[rival]={played:0,won:0,drawn:0,lost:0,gf:0,ga:0});const gf=Number(isHome?m.home_score:m.away_score),ga=Number(isHome?m.away_score:m.home_score);r.played++;r.gf+=gf;r.ga+=ga;if(gf>ga)r.won++;else if(gf<ga)r.lost++;else r.drawn++;});const rivals=Object.keys(map).map(id=>Object.assign({manager_id:id,manager_name:managerNames[id]||"Manager non disponibile",gd:map[id].gf-map[id].ga},map[id])).sort((a,b)=>b.played-a.played);const pos=rivals.filter(r=>r.won>r.lost).length,eq=rivals.filter(r=>r.won===r.lost).length,neg=rivals.filter(r=>r.won<r.lost).length,total=rivals.reduce((s,r)=>s+r.played,0);return `<div class="nx-stat-grid">${statCard("Rivali",rivals.length)}${statCard("Partite",total)}${statCard("Positivi",pos)}${statCard("Pari",eq)}${statCard("Negativi",neg)}</div><div class="nx-h2h-list">${rivals.length?rivals.map(r=>`<div class="nx-h2h-row"><div><strong>${esc(r.manager_name)}</strong><span>${r.played} partite</span></div><div class="nx-stat-line"><span>V ${r.won}</span><span>N ${r.drawn}</span><span>P ${r.lost}</span><span>GF ${r.gf}</span><span>GS ${r.ga}</span><strong>DR ${formatSigned(r.gd)}</strong></div></div>`).join(""):`<div class="nx-empty-box"><strong>Nessun H2H disponibile</strong><span>Servono partite tra manager con assegnazioni registrate.</span></div>`}</div>`;}

  function renderManagerRecords(clubs,clubPlayed,nations,nationPlayed){const rows=[];function add(type,assignments,matches){matches.forEach(function(m){const a=assignments.find(a=>assignmentMatchesOne(type,a,m));if(!a)return;const isHome=type==="club"?String(m.home_team_id)===String(a.team_id):String(m.home_nation_id)===String(a.nation_id);const gf=Number(isHome?m.home_score:m.away_score),ga=Number(isHome?m.away_score:m.home_score);rows.push({gf:gf,ga:ga,diff:gf-ga});});}add("club",clubs,clubPlayed);add("nation",nations,nationPlayed);if(!rows.length)return `<div class="nx-empty-box"><strong>Nessun record disponibile</strong></div>`;const wins=rows.filter(r=>r.diff>0),losses=rows.filter(r=>r.diff<0),best=wins.length?wins.slice().sort((a,b)=>b.diff-a.diff)[0]:null,worst=losses.length?losses.slice().sort((a,b)=>a.diff-b.diff)[0]:null,maxGF=rows.slice().sort((a,b)=>b.gf-a.gf)[0],maxGA=rows.slice().sort((a,b)=>b.ga-a.ga)[0];return `<div class="nx-record-grid">${recordCard("Vittoria più larga",best?best.gf+"-"+best.ga:"Nessuna vittoria")}${recordCard("Sconfitta più larga",worst?worst.gf+"-"+worst.ga:"Nessuna sconfitta")}${recordCard("Più gol segnati",maxGF.gf)}${recordCard("Più gol subiti",maxGA.ga)}</div>`;}
  function recordCard(label,value){return `<div class="nx-record-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;}
  function renderCareerTimeline(assignments){if(!assignments.length)return `<div class="nx-empty-box"><strong>Nessun incarico registrato</strong></div>`;return `<div class="nx-career-timeline">${assignments.map(function(a){const name=a.gw_teams&&teamDisplayName(a.gw_teams)?teamDisplayName(a.gw_teams):a.imc_national_teams&&a.imc_national_teams.nation_name?a.imc_national_teams.nation_name:"Assegnazione";return `<div class="nx-timeline-item"><span class="nx-timeline-dot"></span><div><small>${a.team_id?"Club":"Nazionale"}</small><strong>${esc(name)}</strong><span>${a.start_date?formatDate(a.start_date):"?"} → ${a.end_date?formatDate(a.end_date):"oggi"}</span></div></div>`;}).join("")}</div>`;}
  function renderManagerMatches(matches,status){if(!matches.length)return `<div class="nx-empty-box"><strong>Nessuna partita disponibile</strong></div>`;return `<div class="nx-entity-match-list">${matches.map(function(m){const home=participantName(m,"home"),away=participantName(m,"away"),comp=m.competition&&m.competition.competition_name?getCompetitionDisplayName(m.competition.competition_name):"Competizione";return `<div class="nx-entity-match"><div class="nx-entity-match-meta"><strong>${esc(comp)}</strong><span>${formatDate(m.match_date)}</span></div><div class="match-line">${staticMatchParticipantMarkup(m,"home")}<span class="match-score">${status==="played"?m.home_score+" - "+m.away_score:"VS"}</span>${staticMatchParticipantMarkup(m,"away")}</div></div>`;}).join("")}</div>`;}
  function nxCompetitionsIndex(){
    setTimeout(loadWorldCompetitions,0);
    return `
      <section class="nx-card nx-competitions-index">
        <div class="nx-page-title nx-competitions-title">
          <div><h1>Competitions</h1><p>${esc(state.selectedWorld)} · ${esc(selectedWorldName())}</p></div>
          <div class="nx-competitions-title-actions">
            <button id="toggleCompetitionSearch" type="button" aria-label="Cerca competizione">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>
            </button>
            <button id="toggleCompetitionNation" type="button" aria-label="Filtra per nazione">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 12h2"></path><path d="M10 12h10"></path><circle cx="8" cy="12" r="2"></circle><path d="M4 17h8"></path><path d="M16 17h4"></path><circle cx="14" cy="17" r="2"></circle></svg>
            </button>
          </div>
        </div>
        <div id="worldCompetitionsContent"><div class="nx-loading">Caricamento competizioni…</div></div>
      </section>`;
  }

  function competitionCategoryLabel(category){
    if(category==="international")return "International";
    if(category==="nations")return "Nations";
    return "Domestic";
  }

  function competitionCategoryIcon(){
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v3c0 3-1.5 5.2-4 6-2.5-.8-4-3-4-6V4Z"></path>
      <path d="M8 6H5v1c0 2.3 1.2 4 3.6 4.5"></path>
      <path d="M16 6h3v1c0 2.3-1.2 4-3.6 4.5"></path>
      <path d="M12 13v4"></path>
      <path d="M9 20h6"></path>
      <path d="M10 17h4v3h-4z"></path>
    </svg>`;
  }

  function selectedWorldIsMultiLeague(){
    const world=getWorldMeta(state.selectedWorld);
    return !!(world&&world.type==="multi_league");
  }

  function renderWorldCompetitions(){
    const target=document.getElementById("worldCompetitionsContent");
    if(!target)return;

    const all=Array.isArray(state.worldCompetitions)?state.worldCompetitions:[];
    const category=state.competitionFilter||"domestic";
    const nationFilter=state.competitionNationFilter||"all";
    const search=normalizeText(state.competitionSearch||"");
    const isMulti=selectedWorldIsMultiLeague();

    const categoryCounts={
      domestic:all.filter(function(x){return x.category==="domestic";}).length,
      international:all.filter(function(x){return x.category==="international";}).length,
      nations:all.filter(function(x){return x.category==="nations";}).length
    };

    const nations=Array.from(new Set(all.filter(function(x){return x.category==="domestic"&&x.nation;}).map(function(x){return x.nation;}))).sort(function(a,b){return a.localeCompare(b,"it");});

    let filtered=all.filter(function(item){return item.category===category;});
    if(category==="domestic"&&isMulti&&nationFilter!=="all"){
      filtered=filtered.filter(function(item){return item.nation===nationFilter;});
    }
    if(search){
      filtered=filtered.filter(function(item){
        return normalizeText([item.name,item.nation,item.id].join(" ")).includes(search);
      });
    }

    filtered.sort(function(a,b){
      const nationCompare=String(a.nation||"").localeCompare(String(b.nation||""),"it");
      if(nationCompare!==0)return nationCompare;
      if(a.sortOrder!==b.sortOrder)return a.sortOrder-b.sortOrder;
      return String(a.name).localeCompare(String(b.name),"it");
    });

    const world=getWorldMeta(state.selectedWorld)||{};
    const formatLabel=worldTypeLabel(world.type);

    target.innerHTML=`
      <div class="nx-competition-category-tabs">
        ${["domestic","international","nations"].map(function(key){
          return `<button type="button" data-competition-category="${key}" class="${category===key?"active":""}">
            <span>${competitionCategoryIcon(key)}</span>
            <strong>${competitionCategoryLabel(key)}</strong>
          </button>`;
        }).join("")}
      </div>

      ${(state.competitionSearchOpen||state.competitionSearch)?`<div class="nx-competition-filter-panel">
        <label class="nx-competition-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>
          <input id="competitionSearchInput" type="search" placeholder="Cerca competizione" value="${esc(state.competitionSearch||"")}">
        </label>
      </div>`:""}

      ${category==="domestic"&&isMulti&&(state.competitionNationOpen||nationFilter!=="all")?`<div class="nx-competition-filter-panel">
        <label class="nx-competition-nation-filter">
          <span>Nazione</span>
          <select id="competitionNationFilter">
            <option value="all">Tutte le nazioni</option>
            ${nations.map(function(nation){return `<option value="${esc(nation)}" ${nationFilter===nation?"selected":""}>${esc(nation)}</option>`;}).join("")}
          </select>
        </label>
      </div>`:""}

      <div class="nx-competition-summary">
        <span>${competitionCategoryLabel(category)}: <strong>${categoryCounts[category]||0}</strong> · Totale: <strong>${all.length}</strong></span>
        <span>Formato: <strong>${esc(formatLabel)}</strong></span>
      </div>

      ${filtered.length?(category==="domestic"&&isMulti?`<div class="nx-nation-competition-stack">${Array.from(new Set(filtered.map(function(row){return row.nation||"Domestic";}))).map(function(nation){
        const rows=filtered.filter(function(row){return (row.nation||"Domestic")===nation;});
        return `<section class="nx-nation-competition-box">
          <div class="nx-nation-competition-head"><span>NAZIONE</span><strong>${esc(nation)}</strong><small>${rows.length} competizion${rows.length===1?"e":"i"}</small></div>
          <div class="nx-competition-grid nx-competition-filtered-grid">${rows.map(function(row){
            return `<button class="nx-comp-tile" data-comp-type="${row.type}" data-comp-id="${esc(row.id)}">
              <div class="nx-trophy-icon">${trophyRoomImageMarkup(row.name,row.competitionType,true)}</div>
              <div class="nx-comp-tile-copy"><strong>${esc(row.name)}</strong>${row.date?`<span>Dal ${formatDate(row.date)}</span>`:""}</div>
            </button>`;
          }).join("")}</div>
        </section>`;
      }).join("")}</div>`:`<div class="nx-competition-grid nx-competition-filtered-grid">${filtered.map(function(row){
        return `<button class="nx-comp-tile" data-comp-type="${row.type}" data-comp-id="${esc(row.id)}">
          <div class="nx-trophy-icon">${trophyRoomImageMarkup(row.name,row.competitionType,true)}</div>
          <div class="nx-comp-tile-copy">${row.nation?`<small>${esc(row.nation)}</small>`:""}<strong>${esc(row.name)}</strong>${row.date?`<span>Dal ${formatDate(row.date)}</span>`:""}</div>
        </button>`;
      }).join("")}</div>`):`<div class="nx-empty-box"><strong>Nessuna competizione trovata</strong><span>Modifica i filtri o completa la configurazione del Game World.</span></div>`}
    `;
  }

  async function loadWorldCompetitions(){
    const target=document.getElementById("worldCompetitionsContent");
    if(!target || !state.client || !state.selectedWorld) return;
    try{
      const seasonResult=await state.client.from("gw_seasons").select("season_id,season_number").eq("game_world_id",state.selectedWorld).eq("season_status","current").maybeSingle();
      if(seasonResult.error)throw seasonResult.error;
      const season=seasonResult.data;
      if(!season){target.innerHTML=`<div class="nx-empty-box"><strong>Nessuna stagione attiva</strong><span>Configura prima il Game World dall’Admin Console.</span></div>`;return;}
      const results=await Promise.all([
        state.client.from("gw_division_setups").select("nation_setup_id,division_number").eq("game_world_id",state.selectedWorld).order("division_number",{ascending:true}),
        state.client.from("gw_setup_nations").select("nation_setup_id,nation_name,sort_order").eq("game_world_id",state.selectedWorld).order("sort_order",{ascending:true}),
        state.client.from("gw_competition_settings").select("competition_id,nation_setup_id,start_date").eq("game_world_id",state.selectedWorld).eq("season_id",season.season_id)
      ]);
      results.forEach(function(r){if(r.error)throw r.error;});
      const divisions=results[0].data||[], nations=results[1].data||[], settings=results[2].data||[];

      // Build 1: nei Multi League le competizioni domestiche visibili sono
      // esclusivamente quelle delle nazioni in cui gioca almeno un manager IMC.
      let activeImcNationNames=null;
      if(selectedWorldIsMultiLeague()){
        // Build 1: la nazione del club nei Multi League deriva dal setup
        // team/divisione, non da gw_teams.country_id (che può essere null).
        const assignmentResult=await state.client
          .from("gw_manager_assignments")
          .select("team_id,start_date,end_date")
          .eq("game_world_id",state.selectedWorld)
          .not("team_id","is",null);
        if(assignmentResult.error)throw assignmentResult.error;

        const today=localTodayDateKey();
        const teamIds=Array.from(new Set((assignmentResult.data||[])
          .filter(function(a){
            return (!a.start_date||a.start_date<=today) && (!a.end_date||a.end_date>=today);
          })
          .map(function(a){return Number(a.team_id);})
          .filter(Boolean)));

        if(teamIds.length){
          const teamDivisionResult=await state.client
            .from("gw_setup_team_divisions")
            .select("team_id,nation_setup_id")
            .eq("game_world_id",state.selectedWorld)
            .eq("season_id",season.season_id)
            .in("team_id",teamIds);
          if(teamDivisionResult.error)throw teamDivisionResult.error;

          const activeNationSetupIds=new Set((teamDivisionResult.data||[])
            .map(function(row){return String(row.nation_setup_id||"");})
            .filter(Boolean));

          // Applichiamo il filtro soltanto quando la relazione è stata
          // risolta davvero. In caso contrario mostriamo tutte le nazioni,
          // evitando una pagina vuota per dati legacy incompleti.
          if(activeNationSetupIds.size){
            activeImcNationNames=new Set(
              nations
                .filter(function(n){return activeNationSetupIds.has(String(n.nation_setup_id));})
                .map(function(n){return normalizeParticipantKey(n.nation_name);})
            );
          }
        }
      }

      const nationMap=new Map(nations.map(function(n){return [String(n.nation_setup_id),n.nation_name];}));
      const nationOrder=new Map(nations.map(function(n,index){return [String(n.nation_name),Number(n.sort_order||index)];}));
      const tiles=[];

      divisions.forEach(function(div){
        const nationName=div.nation_setup_id?(nationMap.get(String(div.nation_setup_id))||""):"";
        if(activeImcNationNames && nationName && !activeImcNationNames.has(normalizeParticipantKey(nationName)))return;
        const databaseName=nationName?nationName+" · Division "+div.division_number:"Division "+div.division_number;
        tiles.push({
          type:"division",
          competitionType:"league",
          category:"domestic",
          nation:nationName,
          id:databaseName,
          name:"Division "+div.division_number,
          date:"",
          sortOrder:(nationOrder.get(nationName)||0)*100+Number(div.division_number)
        });
      });

      settings.forEach(function(row){
        const item=GW_STANDARD_COMPETITIONS.find(function(x){return x.id===row.competition_id;});
        if(!item||item.id==="COMP_DOM_001")return;
        const nationName=row.nation_setup_id?(nationMap.get(String(row.nation_setup_id))||""):"";
        if(item.category==="domestic" && activeImcNationNames && nationName && !activeImcNationNames.has(normalizeParticipantKey(nationName)))return;
        let displayName=item.name;
        if(item.id==="COMP_DOM_005"){
          const divisionNumber=2;
          displayName="Division "+divisionNumber+" Playoff";
        }
        const databaseBaseName=item.dbName||displayName;
        const databaseName=nationName?nationName+" · "+databaseBaseName:databaseBaseName;
        const category=item.category==="national_teams"?"nations":item.category;
        tiles.push({
          type:"competition",
          competitionType:item.id==="COMP_DOM_005"?"promotion_playoff":item.id,
          category:category,
          nation:item.category==="domestic"?nationName:"",
          id:databaseName,
          name:displayName,
          date:row.start_date||"",
          sortOrder:(nationOrder.get(nationName)||0)*100+50+GW_STANDARD_COMPETITIONS.indexOf(item)
        });
      });

      state.worldCompetitions=tiles;
      state.worldCompetitionsSeason=season;
      if(!selectedWorldIsMultiLeague())state.competitionNationFilter="all";
      renderWorldCompetitions();
    }catch(error){target.innerHTML=`<div class="nx-empty-box"><strong>Errore caricamento competizioni</strong><span>${esc(error.message||"Impossibile leggere le competizioni.")}</span></div>`;}
  }

  function bindNxCompetitionsIndex(){
    const root=document.getElementById("pageRoot");
    if(!root) return;

    root.addEventListener("click",function(event){
      const searchToggle=event.target.closest("#toggleCompetitionSearch");
      if(searchToggle){
        state.competitionSearchOpen=!state.competitionSearchOpen;
        renderWorldCompetitions();
        const input=document.getElementById("competitionSearchInput");
        if(input)input.focus();
        return;
      }

      const nationToggle=event.target.closest("#toggleCompetitionNation");
      if(nationToggle){
        if(selectedWorldIsMultiLeague()){
          state.competitionNationOpen=!state.competitionNationOpen;
          renderWorldCompetitions();
        }
        return;
      }

      const categoryButton=event.target.closest("[data-competition-category]");
      if(categoryButton){
        state.competitionFilter=categoryButton.getAttribute("data-competition-category")||"domestic";
        state.competitionNationFilter="all";
        state.competitionNationOpen=false;
        renderWorldCompetitions();
        return;
      }

      const button=event.target.closest("[data-comp-id]");
      if(!button) return;
      const type=button.getAttribute("data-comp-type");
      const id=button.getAttribute("data-comp-id");
      if(type === "division"){state.selectedDivision=id;state.selectedCompetition=null;state.divisionTab="results";}
      else{state.selectedCompetition=id;state.selectedDivision=null;state.competitionTab="results";}
      renderShell();
    });

    root.addEventListener("change",function(event){
      if(event.target&&event.target.id==="competitionNationFilter"){
        state.competitionNationFilter=event.target.value||"all";
        renderWorldCompetitions();
      }
    });

    root.addEventListener("input",function(event){
      if(event.target&&event.target.id==="competitionSearchInput"){
        state.competitionSearch=event.target.value||"";
        renderWorldCompetitions();
        const input=document.getElementById("competitionSearchInput");
        if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length);}
      }
    });
  }

  function divisionCompetitionView(){
    return `
      <section class="nx-card nx-competition-detail-card">
        <button class="nx-back-link" id="backToCompetitions">‹ Torna a Competitions</button>

        <div class="nx-competition-head">
          <div class="nx-trophy-icon large">
            ${trophyRoomImageMarkup(state.selectedDivision,"league",false)}
          </div>
          <div class="nx-competition-head-copy">
            <h1>${esc(competitionVisualLabel(state.selectedDivision))}</h1>
            <p>${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())} · Domestic</p>
          </div>
        </div>

        <div class="nx-detail-tabs">
          <button data-div-tab="results" class="${state.divisionTab==="results" ? "active" : ""}">☷<span>RISULTATI</span></button>
          <button data-div-tab="standings" class="${state.divisionTab==="standings" ? "active" : ""}">▥<span>CLASSIFICA</span></button>
          <button data-div-tab="schedule" class="${state.divisionTab==="schedule" ? "active" : ""}">▣<span>SCHEDULE</span></button>
          <button data-div-tab="trophy">♛<span>TROPHY ROOM</span></button>
        </div>

        <div id="divisionContent" class="nx-detail-content">
          <div class="nx-loading">Caricamento dati…</div>
        </div>
      </section>
    `;
  }

  function bindMatchProfileLinks(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;

    container.addEventListener("click",function(event){
      const teamLink = event.target.closest("[data-match-entity-id]");
      if(teamLink){
        const type = teamLink.getAttribute("data-match-entity-type");
        const id = teamLink.getAttribute("data-match-entity-id");
        const name = teamLink.getAttribute("data-match-entity-name");

        state.selectedDivision = null;
        state.selectedCompetition = null;
        state.selectedManager = null;

        if(type === "nation"){
          state.worldSection = "national";
          state.selectedNation = {id:id,name:name};
          state.selectedClub = null;
        }else{
          state.worldSection = "clubs";
          state.selectedClub = {id:id,name:name};
          state.selectedNation = null;
        }

        renderShell();
        return;
      }

      const managerLink = event.target.closest("[data-match-manager-id]");
      if(managerLink){
        state.selectedDivision = null;
        state.selectedCompetition = null;
        state.selectedClub = null;
        state.selectedNation = null;
        state.worldSection = "managers";
        state.selectedManager = {
          id:managerLink.getAttribute("data-match-manager-id"),
          name:managerLink.getAttribute("data-match-manager-name")
        };
        renderShell();
      }
    });
  }

  function standardMatchLogo(type,name,worldId){
    const url=type==="nation"?nationFlagUrl(name):clubLogoUrl(name,worldId);
    const fallbackData=type==="club"?clubLogoFallbackData(name,worldId):"";

    if(!url){
      return `<span class="nx-standard-match-logo nx-standard-match-logo-fallback">${type==="nation"?"⚑":"◈"}</span>`;
    }

    return `<span class="nx-standard-match-logo">
      <img
        src="${esc(url)}"
        data-logo-fallbacks="${esc(fallbackData)}"
        alt="${esc(name)}"
        loading="lazy"
        onerror="${type==="club"
          ? "if(!advanceClubLogoCandidate(this)){this.style.display='none';this.parentElement.classList.add('nx-standard-match-logo-fallback');this.parentElement.textContent='◈';}"
          : "this.style.display='none';this.parentElement.classList.add('nx-standard-match-logo-fallback');this.parentElement.textContent='⚑';"}"
      >
    </span>`;
  }

  function staticMatchParticipantMarkup(match,side){
    const isNation=Boolean(match.home_nation_id||match.away_nation_id);
    const type=isNation?"nation":"club";
    const entityName=participantName(match,side);
    const alignment=side==="home"?"match-home":"match-away";
    const logo=standardMatchLogo(type,entityName,match.game_world_id||state.selectedWorld);

    return `
      <span class="match-team ${alignment}">
        <span class="nx-standard-match-main">
          ${side==="home"
            ? `<span class="nx-standard-match-name">${esc(entityName)}</span>${logo}`
            : `${logo}<span class="nx-standard-match-name">${esc(entityName)}</span>`}
        </span>
      </span>`;
  }

  function matchParticipantMarkup(match,side){
    const isNation=Boolean(match.home_nation_id||match.away_nation_id);
    const type=isNation?"nation":"club";
    const entityId=side==="home"
      ? (isNation?match.home_nation_id:match.home_team_id)
      : (isNation?match.away_nation_id:match.away_team_id);
    const entityName=participantName(match,side);
    const manager=side==="home"?match.home_manager:match.away_manager;
    const alignment=side==="home"?"match-home":"match-away";
    const logo=standardMatchLogo(type,entityName,match.game_world_id||state.selectedWorld);

    return `
      <span class="match-team ${alignment}">
        <span class="nx-standard-match-main">
          ${side==="home"
            ? `<button class="nx-match-entity-link" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(entityId)}" data-match-entity-name="${esc(entityName)}">${esc(entityName)}</button>${logo}`
            : `${logo}<button class="nx-match-entity-link" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(entityId)}" data-match-entity-name="${esc(entityName)}">${esc(entityName)}</button>`}
        </span>
        ${manager
          ? `<button class="nx-match-manager-link" data-match-manager-id="${esc(manager.manager_id)}" data-match-manager-name="${esc(manager.full_name)}">${esc(manager.full_name)}</button>`
          : ""}
      </span>`;
  }

  const COMPACT_TEAM_CODES={
    "ac milan":"MIL",
    "acf fiorentina":"FIO",
    "ajax":"AJA",
    "arsenal":"ARS",
    "as roma":"ROM",
    "aston villa":"AVL",
    "athletic club":"ATH",
    "atletico madrid":"ATM",
    "barcelona":"BAR",
    "bayer leverkusen":"LEV",
    "bayern munchen":"BAM",
    "besiktas jk":"BES",
    "boca juniors":"BOC",
    "borussia dortmund":"BVB",
    "chelsea":"CHE",
    "club america":"AME",
    "cr flamengo":"FLA",
    "dynamo kyiv":"DYK",
    "dynamo moskva":"DMO",
    "everton":"EVE",
    "fc porto":"POR",
    "fc schalke 04":"SCH",
    "fenerbahce sk":"FEN",
    "feyenoord":"FEY",
    "galatasaray sk":"GAL",
    "internazionale":"INT",
    "juventus":"JUV",
    "lille osc":"LIL",
    "liverpool":"LIV",
    "manchester city":"MCI",
    "manchester united":"MUN",
    "olympiacos":"OLY",
    "olympique lyonnais":"LYO",
    "olympique marseille":"MAR",
    "palmeiras":"PAL",
    "paris saint germain":"PSG",
    "psv":"PSV",
    "real madrid":"REM",
    "river plate":"RIV",
    "sl benfica":"BEN",
    "ssc napoli":"NAP",
    "sporting cp":"SCP",
    "tottenham hotspur":"TOT",
    "valencia cf":"VAL",
    "villarreal cf":"VIL",
    "west ham united":"WHU"
  };

  function compactParticipantCode(name){
    const key=normalizeParticipantKey(name);
    if(COMPACT_TEAM_CODES[key])return COMPACT_TEAM_CODES[key];

    const tokens=String(name||"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^A-Za-z0-9 ]+/g," ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if(!tokens.length)return "—";

    const ignored=new Set(["fc","ac","as","ss","ssc","cf","cr","sk","jk"]);
    const useful=tokens.filter(function(token){
      return !ignored.has(token.toLowerCase());
    });

    if(useful.length>=2){
      return useful.slice(0,3).map(function(token){
        return token.charAt(0).toUpperCase();
      }).join("").slice(0,3);
    }

    return (useful[0]||tokens[0]).slice(0,3).toUpperCase();
  }

  function compactGroupLabel(value){
    return String(value||"")
      .replace(/^GIRONE\s+/i,"GROUP ")
      .replace(/^GROUP\s+/i,"GROUP ");
  }

  function compactCompetitionName(value){
    const raw=String(value||"").trim();
    if(raw==="SMFA Champions")return "SMFA Champions Cup";
    return raw;
  }

  function compactParticipantLogo(type,name,worldId){
    const url=type==="nation"?nationFlagUrl(name):clubLogoUrl(name,worldId);
    const fallbackData=type==="club"?clubLogoFallbackData(name,worldId):"";

    if(!url){
      return `<span class="nx-compact-team-logo nx-compact-team-logo-fallback">${type==="nation"?"⚑":"◈"}</span>`;
    }

    return `<span class="nx-compact-team-logo">
      <img
        src="${esc(url)}"
        data-logo-fallbacks="${esc(fallbackData)}"
        alt="${esc(name)}"
        loading="lazy"
        onerror="${type==="club"
          ? "if(!advanceClubLogoCandidate(this)){this.style.display='none';this.parentElement.classList.add('nx-compact-team-logo-fallback');this.parentElement.textContent='◈';}"
          : "this.style.display='none';this.parentElement.classList.add('nx-compact-team-logo-fallback');this.parentElement.textContent='⚑';"}"
      >
    </span>`;
  }

  function compactMatchParticipantMarkup(match,side){
    const isNation=Boolean(match.home_nation_id||match.away_nation_id);
    const type=isNation?"nation":"club";
    const entityId=side==="home"
      ? (isNation?match.home_nation_id:match.home_team_id)
      : (isNation?match.away_nation_id:match.away_team_id);
    const entityName=participantName(match,side);
    const code=compactParticipantCode(entityName);
    const manager=side==="home"?match.home_manager:match.away_manager;
    const logo=compactParticipantLogo(type,entityName,match.game_world_id||state.selectedWorld);

    return `
      <span class="nx-compact-team nx-compact-${side}">
        <span class="nx-compact-team-main">
          ${side==="home"
            ? `<button class="nx-compact-team-code" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(entityId)}" data-match-entity-name="${esc(entityName)}">${esc(code)}</button>${logo}`
            : `${logo}<button class="nx-compact-team-code" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(entityId)}" data-match-entity-name="${esc(entityName)}">${esc(code)}</button>`}
        </span>
        ${manager
          ? `<button class="nx-compact-manager" data-match-manager-id="${esc(manager.manager_id)}" data-match-manager-name="${esc(manager.full_name)}">${esc(manager.full_name)}</button>`
          : ""}
      </span>`;
  }

  function attachMatchManagers(matches,assignments,worldId){
    return (matches || []).map(function(match){
      const type = match.home_nation_id || match.away_nation_id ? "nation" : "club";
      const homeId = type === "nation" ? match.home_nation_id : match.home_team_id;
      const awayId = type === "nation" ? match.away_nation_id : match.away_team_id;
      const homeAssignment = findManagerForEntityInWorld(assignments,type,homeId,worldId,match.match_date);
      const awayAssignment = findManagerForEntityInWorld(assignments,type,awayId,worldId,match.match_date);

      return Object.assign({},match,{
        home_manager:homeAssignment ? {
          manager_id:homeAssignment.manager_id,
          full_name:homeAssignment.imc_managers && homeAssignment.imc_managers.full_name
            ? homeAssignment.imc_managers.full_name
            : homeAssignment.manager_id
        } : null,
        away_manager:awayAssignment ? {
          manager_id:awayAssignment.manager_id,
          full_name:awayAssignment.imc_managers && awayAssignment.imc_managers.full_name
            ? awayAssignment.imc_managers.full_name
            : awayAssignment.manager_id
        } : null
      });
    });
  }

  function bindDivisionCompetitionView(){
    document.getElementById("backToCompetitions").addEventListener("click",function(){
      state.selectedDivision = null;
      renderShell();
    });

    document.querySelectorAll("[data-div-tab]").forEach(function(button){
      button.addEventListener("click",function(){
        state.divisionTab = button.getAttribute("data-div-tab");
        renderShell();
      });
    });

    bindMatchProfileLinks("divisionContent");
    loadDivisionData();
  }

  function nxCompetitionPage(){
    return `
      <section class="nx-card nx-competition-detail-card">
        <button class="nx-back-link" id="backToCompetitions">‹ Torna a Competitions</button>

        <div class="nx-competition-head">
          <div class="nx-trophy-icon large">
            ${trophyRoomImageMarkup(state.selectedCompetition,resolveCompetitionType(state.selectedCompetition),false)}
          </div>
          <div class="nx-competition-head-copy">
            <h1>${esc(competitionVisualLabel(state.selectedCompetition))}</h1>
            <p>${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</p>
          </div>
        </div>

        <div class="nx-detail-tabs">
          <button data-comp-tab="results" class="${state.competitionTab==="results" ? "active" : ""}">☷<span>RISULTATI</span></button>
          <button data-comp-tab="standings" class="${state.competitionTab==="standings" ? "active" : ""}">▥<span>CLASSIFICHE</span></button>
          <button data-comp-tab="schedule" class="${state.competitionTab==="schedule" ? "active" : ""}">▣<span>SCHEDULE</span></button>
          <button data-comp-tab="trophy">♛<span>TROPHY ROOM</span></button>
        </div>

        <div id="competitionContent" class="nx-detail-content">
          <div class="nx-loading">Caricamento dati…</div>
        </div>
      </section>
    `;
  }

  function bindNxCompetitionPage(){
    document.getElementById("backToCompetitions").addEventListener("click",function(){
      state.selectedCompetition = null;
      renderShell();
    });

    document.querySelectorAll("[data-comp-tab]").forEach(function(button){
      button.addEventListener("click",function(){
        state.competitionTab = button.getAttribute("data-comp-tab");
        renderShell();
      });
    });

    bindMatchProfileLinks("competitionContent");
    loadCompetitionData();
  }

  function homePage(){
    return `
      <section class="page">
        <div class="hero">
          <img src="assets/manager-mng001.jpeg" alt="Manager">
          <div><p>Buongiorno</p><h1>${esc(state.user.full_name)}</h1><p>${esc(state.user.manager_id)} · ${esc(state.user.role)}</p></div>
        </div>
        <div class="grid">
          <div class="stat"><strong>10</strong><span>Game World</span></div>
          <div class="stat"><strong>55</strong><span>Manager IMC</span></div>
          <div class="stat"><strong>80</strong><span>Nazionali</span></div>
          <div class="stat"><strong>GW004</strong><span>World pilota</span></div>
        </div>
        <section class="section">
          <div class="section-title"><h2>I tuoi Game World</h2></div>
          <div class="card list">
            <button class="row" id="homeGw004" style="width:100%;border-left:0;border-right:0;border-top:0;background:transparent;text-align:left">
              <div><div class="row-title">${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</div><div class="row-sub">AJAX · England</div></div>
              <span class="badge">APRI</span>
            </button>
          </div>
        </section>
      </section>
    `;
  }

  function worldsPage(){
    return `<section class="page"><div class="section-title"><h2>Game Worlds</h2></div><div class="card list">${
      state.worlds.map(function(world){
        return `<button class="row world-open" data-world="${esc(world.id)}" style="width:100%;border-left:0;border-right:0;border-top:0;background:transparent;text-align:left">
          <div><div class="row-title">${esc(world.id)} · ${esc(world.name)}</div><div class="row-sub">${world.type === "single_league" ? "Single League" : world.type === "multi_league" ? "Multi League" : "Game World"}</div></div>
          <span class="badge">APRI</span>
        </button>`;
      }).join("")
    }</div></section>`;
  }

  function bindWorldCards(){
    document.querySelectorAll(".world-open").forEach(function(button){
      button.addEventListener("click", function(){
        state.selectedWorld = button.getAttribute("data-world");
        state.worldSection = "competitions";
        state.worldTab = "overview";
        renderShell();
      });
    });
  }

  function worldPage(){
    return `
      <section class="page">
        <button class="back-link" id="backWorlds">‹ Game Worlds</button>
        <div class="world-hero">
          <small>GW004</small>
          <h1>World League</h1>
          <p>Season ${esc(state.gw004.season)} · dal ${esc(state.gw004.start_date)}</p>
          <div class="kpi-line">
            <span class="kpi-pill">4 Divisioni</span>
            <span class="kpi-pill">80 Club</span>
            <span class="kpi-pill">12 Competizioni</span>
          </div>
        </div>
        <div class="world-tabs">
          ${worldTab("overview","Overview")}
          ${worldTab("domestic","Domestic")}
          ${worldTab("international","International")}
          ${worldTab("national","National Teams")}
          ${worldTab("managers","Manager")}
          ${worldTab("import","Import")}
        </div>
        <div id="worldContent">${worldContent()}</div>
      </section>
    `;
  }

  function worldTab(id,label){
    return `<button class="world-tab ${state.worldTab===id ? "active" : ""}" data-world-tab="${id}">${label}</button>`;
  }

  function bindWorldPage(){
    document.getElementById("backWorlds").addEventListener("click", function(){
      state.selectedWorld = null;
      state.selectedDivision = null;
      renderShell();
    });

    document.querySelectorAll("[data-world-tab]").forEach(function(button){
      button.addEventListener("click", function(){
        state.worldTab = button.getAttribute("data-world-tab");
        state.selectedDivision = null;
        state.selectedCompetition = null;
        renderShell();
      });
    });

    document.querySelectorAll(".division-open").forEach(function(button){
      button.addEventListener("click", function(){
        state.selectedDivision = button.getAttribute("data-division");
        state.selectedCompetition = null;
        state.divisionTab = "results";
        renderShell();
      });
    });

    document.querySelectorAll(".competition-open").forEach(function(button){
      button.addEventListener("click", function(){
        state.selectedCompetition = button.getAttribute("data-competition");
        state.selectedDivision = null;
        state.competitionTab = "results";
        renderShell();
      });
    });

    const backDomestic = document.getElementById("backDomestic");
    if(backDomestic){
      backDomestic.addEventListener("click", function(){
        state.selectedDivision = null;
        renderShell();
      });
    }

    document.querySelectorAll("[data-division-tab]").forEach(function(button){
      button.addEventListener("click", function(){
        state.divisionTab = button.getAttribute("data-division-tab");
        renderShell();
      });
    });

    const backCompetitions = document.getElementById("backCompetitions");
    if(backCompetitions){
      backCompetitions.addEventListener("click", function(){
        state.selectedCompetition = null;
        renderShell();
      });
    }

    document.querySelectorAll("[data-competition-tab]").forEach(function(button){
      button.addEventListener("click", function(){
        state.competitionTab = button.getAttribute("data-competition-tab");
        renderShell();
      });
    });

    loadDivisionData();
    loadCompetitionData();
  }

  function cards(items){
    return `<div class="comp-group">${items.map(function(item){
      return `<div class="comp-card"><strong>${esc(item.name)}</strong><span>${esc(item.format || "")}</span></div>`;
    }).join("")}</div>`;
  }

  function worldContent(){
    if(state.worldTab === "overview"){
      return `<section class="section">
        <div class="grid">
          ${state.gw004.divisions.map(function(d){return `<div class="stat"><strong>${esc(d.clubs)}</strong><span>${esc(d.name)}</span></div>`;}).join("")}
        </div>
      </section>`;
    }
    if(state.worldTab === "domestic"){
      if(state.selectedDivision){
        return divisionPage();
      }

      if(state.selectedCompetition){
        return competitionPage();
      }

      return `<section class="section">
        <div class="section-title"><h2>Leagues</h2></div>
        <div class="comp-group">
          ${state.gw004.divisions.map(function(d){
            return `<button class="comp-card division-open" data-division="${esc(d.name)}" style="text-align:left;width:100%">
              <strong>${esc(d.name)}</strong>
              <span>${esc(d.clubs)} club · Risultati, Classifica, Schedule</span>
            </button>`;
          }).join("")}
        </div>

        <div class="section-title" style="margin-top:22px"><h2>Domestic Cups</h2></div>
        <div class="comp-group">
          ${state.gw004.domestic_cups.map(function(item){
            return `<button class="comp-card competition-open" data-competition="${esc(item.name)}" style="text-align:left;width:100%">
              <strong>${esc(item.name)}</strong>
              <span>${esc(item.format)}</span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
    }
    if(state.worldTab === "international"){
      if(state.selectedCompetition){
        return competitionPage();
      }

      return `<section class="section">
        <div class="section-title"><h2>International</h2></div>
        <div class="comp-group">
          ${state.gw004.international.map(function(item){
            return `<button class="comp-card competition-open" data-competition="${esc(item.name)}" style="text-align:left;width:100%">
              <strong>${esc(item.name)}</strong>
              <span>${esc(item.format)}</span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
    }
    if(state.worldTab === "national"){
      if(state.selectedCompetition){
        return competitionPage();
      }

      return `<section class="section">
        <div class="section-title"><h2>National Teams</h2></div>
        <div class="comp-group">
          ${state.gw004.national_teams.map(function(item){
            return `<button class="comp-card competition-open" data-competition="${esc(item.name)}" style="text-align:left;width:100%">
              <strong>${esc(item.name)}</strong>
              <span>${esc(item.format)}</span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
    }
    if(state.worldTab === "managers"){
      return `<section class="section">
        <div class="section-title"><h2>Club</h2></div>${cards(state.gw004.club_assignments.map(function(x){return {name:x.manager,format:x.team};}))}
        <div class="section-title" style="margin-top:22px"><h2>Nazionali</h2></div>${cards(state.gw004.national_assignments.map(function(x){return {name:x.manager,format:x.team};}))}
      </section>`;
    }
    return `<section class="section"><div class="card"><div class="row-title">Import Results</div><div class="row-sub">Apri il modulo Import dal menu inferiore per caricare i risultati di GW004.</div></div></section>`;
  }


  function divisionPage(){
    return `
      <section class="section">
        <button class="back-link" id="backDomestic">‹ Domestic</button>

        <div class="section-title">
          <h2>${esc(state.selectedDivision)}</h2>
        </div>

        <div class="world-tabs">
          <button class="world-tab ${state.divisionTab==="results" ? "active" : ""}" data-division-tab="results">Risultati</button>
          <button class="world-tab ${state.divisionTab==="standings" ? "active" : ""}" data-division-tab="standings">Classifica</button>
          <button class="world-tab ${state.divisionTab==="schedule" ? "active" : ""}" data-division-tab="schedule">Schedule</button>
        </div>

        <div id="divisionContent">
          <div class="card">
            <div class="row-sub">Caricamento dati…</div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadDivisionData(){
    if(!state.selectedDivision) return;

    const target = document.getElementById("divisionContent");
    if(!target || !state.client) return;

    try{
      const compResult = await state.client
        .from("gw_competitions")
        .select("competition_id,competition_name")
        .eq("game_world_id",state.selectedWorld || "GW004")
        .eq("competition_name",getCompetitionDbName(state.selectedDivision))
        .limit(2);

      if(compResult.error) throw compResult.error;

      const competitionRows = compResult.data || [];
      if(!competitionRows.length){
        throw new Error("Competizione non trovata: " + state.selectedDivision);
      }
      if(competitionRows.length > 1){
        throw new Error("Competizione duplicata nel database: " + state.selectedDivision);
      }

      const selectedDivisionCompetition = competitionRows[0];

      const results = await Promise.all([
        state.client
          .from("gw_matches")
          .select(`
            match_id,
            match_date,
            round_name,
            match_status,
            home_score,
            away_score,
            home_team_id,
            away_team_id,
            home_nation_id,
            away_nation_id,
            home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
            away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),
            home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),
            away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)
          `)
          .eq("competition_id",selectedDivisionCompetition.competition_id)
          .order("match_date",{ascending:false}),
        state.client
          .from("gw_manager_assignments")
          .select("game_world_id,manager_id,team_id,nation_id,start_date,end_date,imc_managers(full_name)")
          .eq("game_world_id",state.selectedWorld || "GW004")
      ]);

      const matchesResult = results[0];
      const assignmentsResult = results[1];
      if(matchesResult.error) throw matchesResult.error;
      if(assignmentsResult.error) throw assignmentsResult.error;

      const matches = attachMatchManagers(matchesResult.data || [],assignmentsResult.data || [],state.selectedWorld || "GW004");

      if(state.divisionTab === "results"){
        target.innerHTML = renderResults(matches);
      }else if(state.divisionTab === "standings"){
        target.innerHTML = renderStandings(matches);
      }else{
        target.innerHTML = renderSchedule(matches);
      }
    }catch(error){
      target.innerHTML = `<div class="card"><div class="status error">${esc(error.message || "Errore caricamento dati.")}</div></div>`;
    }
  }

  function renderResults(matches){
    const played = matches.filter(function(match){
      return match.match_status === "played";
    });

    if(!played.length){
      return `<div class="card"><div class="row-sub">Nessun risultato disponibile.</div></div>`;
    }

    const dates = Array.from(new Set(
      matches.map(function(match){ return match.match_date; }).filter(Boolean)
    )).sort();

    const matchdayByDate = new Map();
    dates.forEach(function(date,index){
      matchdayByDate.set(date,index+1);
    });

    const grouped = {};
    played.forEach(function(match){
      const key = match.match_date || "Senza data";
      if(!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });

    return Object.keys(grouped)
      .sort(function(a,b){ return b.localeCompare(a); })
      .map(function(date){
        const sample=grouped[date][0];
        const officialMatchday=officialLeagueMatchday(
          state.selectedWorld||"GW004",
          date,
          null
        );
        const roundLabel=officialMatchday
          ? "Giornata "+officialMatchday
          : (sample&&sample.round_name
              ? sample.round_name
              : ("Giornata "+(matchdayByDate.get(date)||"")));
        return `
          <div class="section">
            <div class="section-title">
              <h2>${esc(roundLabel)} · ${formatDate(date)}</h2>
            </div>
            <div class="card list">
              ${grouped[date].map(function(match){
                return `
                  <div class="match-line">
                    ${matchParticipantMarkup(match,"home")}
                    <span class="match-score">${match.home_score} - ${match.away_score}</span>
                    ${matchParticipantMarkup(match,"away")}
                  </div>`;
              }).join("")}
            </div>
          </div>`;
      }).join("");
  }

  function renderSchedule(matches){
    const cleanMatches = removeResultsScheduleDuplicates(matches);
    const scheduled = cleanMatches.filter(function(match){
      return !StatisticsEngine.isPlayed(match);
    });

    if(!scheduled.length){
      return `<div class="card"><div class="row-sub">Nessuna partita programmata disponibile.</div></div>`;
    }

    const dates = Array.from(new Set(
      cleanMatches.map(function(match){ return match.match_date; }).filter(Boolean)
    )).sort();

    const matchdayByDate = new Map();
    dates.forEach(function(date,index){
      matchdayByDate.set(date,index+1);
    });

    const grouped = {};
    scheduled.forEach(function(match){
      const key = match.match_date || "Senza data";
      if(!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });

    return Object.keys(grouped)
      .sort(function(a,b){ return a.localeCompare(b); })
      .map(function(date){
        const sample=grouped[date][0];
        const officialMatchday=officialLeagueMatchday(
          state.selectedWorld||"GW004",
          date,
          null
        );
        const roundLabel=officialMatchday
          ? "Giornata "+officialMatchday
          : (sample&&sample.round_name
              ? sample.round_name
              : ("Giornata "+(matchdayByDate.get(date)||"")));
        return `
          <div class="section">
            <div class="section-title">
              <h2>${esc(roundLabel)} · ${formatDate(date)}</h2>
            </div>
            <div class="card list">
              ${grouped[date].map(function(match){
                return `
                  <div class="match-line">
                    ${matchParticipantMarkup(match,"home")}
                    <span class="match-score">VS</span>
                    ${matchParticipantMarkup(match,"away")}
                  </div>`;
              }).join("")}
            </div>
          </div>`;
      }).join("");
  }

  function renderStandings(matches){
    const table = new Map();

    matches.filter(function(match){
      return match.match_status === "played";
    }).forEach(function(match){
      const homeName = teamDisplayName(match.home_team);
      const awayName = teamDisplayName(match.away_team);

      if(!table.has(homeName)) table.set(homeName, emptyStanding(homeName));
      if(!table.has(awayName)) table.set(awayName, emptyStanding(awayName));

      const home = table.get(homeName);
      const away = table.get(awayName);

      home.played += 1;
      away.played += 1;

      home.gf += match.home_score;
      home.ga += match.away_score;
      away.gf += match.away_score;
      away.ga += match.home_score;

      if(match.home_score > match.away_score){
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      }else if(match.home_score < match.away_score){
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      }else{
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

    const rows = Array.from(table.values()).map(function(row){
      row.gd = row.gf - row.ga;
      return row;
    }).sort(function(a,b){
      if(b.points !== a.points) return b.points - a.points;
      if(b.gd !== a.gd) return b.gd - a.gd;
      if(b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });

    if(!rows.length){
      return `<div class="card"><div class="row-sub">Classifica non disponibile: nessun risultato giocato.</div></div>`;
    }

    return `
      <div class="card" style="overflow:auto">
        <table style="width:100%;border-collapse:collapse;min-width:620px">
          <thead>
            <tr style="text-align:left;color:var(--muted);font-size:12px">
              <th style="padding:10px 8px">#</th>
              <th style="padding:10px 8px">Squadra</th>
              <th style="padding:10px 8px">G</th>
              <th style="padding:10px 8px">V</th>
              <th style="padding:10px 8px">N</th>
              <th style="padding:10px 8px">P</th>
              <th style="padding:10px 8px">GF</th>
              <th style="padding:10px 8px">GS</th>
              <th style="padding:10px 8px">DR</th>
              <th style="padding:10px 8px">PT</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(function(row,index){
              return `
                <tr style="border-top:1px solid var(--line)">
                  <td style="padding:12px 8px;font-weight:900">${index+1}</td>
                  <td style="padding:12px 8px;font-weight:850">${esc(row.team)}</td>
                  <td style="padding:12px 8px">${row.played}</td>
                  <td style="padding:12px 8px">${row.won}</td>
                  <td style="padding:12px 8px">${row.drawn}</td>
                  <td style="padding:12px 8px">${row.lost}</td>
                  <td style="padding:12px 8px">${row.gf}</td>
                  <td style="padding:12px 8px">${row.ga}</td>
                  <td style="padding:12px 8px">${row.gd}</td>
                  <td style="padding:12px 8px;font-weight:900">${row.points}</td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function emptyStanding(team){
    return {
      team:team,
      played:0,
      won:0,
      drawn:0,
      lost:0,
      gf:0,
      ga:0,
      gd:0,
      points:0
    };
  }

  function formatDate(value){
    if(!value) return "";
    const parts = value.split("-");
    if(parts.length !== 3) return value;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }


  function competitionPage(){
    return `
      <section class="section">
        <button class="back-link" id="backCompetitions">‹ Competizioni</button>

        <div class="section-title">
          <h2>${esc(competitionVisualLabel(state.selectedCompetition))}</h2>
        </div>

        <div class="world-tabs">
          <button class="world-tab ${state.competitionTab==="results" ? "active" : ""}" data-competition-tab="results">Risultati</button>
          <button class="world-tab ${state.competitionTab==="standings" ? "active" : ""}" data-competition-tab="standings">Classifiche</button>
          <button class="world-tab ${state.competitionTab==="schedule" ? "active" : ""}" data-competition-tab="schedule">Schedule</button>
        </div>

        <div id="competitionContent">
          <div class="card"><div class="row-sub">Caricamento dati…</div></div>
        </div>
      </section>
    `;
  }

  async function loadCompetitionData(){
    if(!state.selectedCompetition) return;

    const target = document.getElementById("competitionContent");
    if(!target || !state.client) return;

    try{
      const competitionResult = await state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,country_id")
        .eq("game_world_id",state.selectedWorld || "GW004")
        .eq("competition_name",getCompetitionDbName(state.selectedCompetition))
        .limit(2);

      if(competitionResult.error) throw competitionResult.error;

      const competitionRows = competitionResult.data || [];
      if(!competitionRows.length){
        throw new Error("Competizione non trovata nel database: " + state.selectedCompetition);
      }
      if(competitionRows.length > 1){
        throw new Error("Competizione duplicata nel database: " + state.selectedCompetition);
      }

      const selectedCompetitionRow = competitionRows[0];

      const results = await Promise.all([
        state.client
          .from("gw_matches")
          .select(`
            match_id,
            match_date,
            round_name,
            stage_name,
            group_name,
            match_time,
            match_status,
            home_score,
            away_score,
            home_penalties,
            away_penalties,
            home_team_id,
            away_team_id,
            home_nation_id,
            away_nation_id,
            home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
            away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),
            home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),
            away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)
          `)
          .eq("competition_id",selectedCompetitionRow.competition_id)
          .order("match_date",{ascending:true}),
        state.client
          .from("gw_manager_assignments")
          .select("game_world_id,manager_id,team_id,nation_id,start_date,end_date,imc_managers(full_name)")
          .eq("game_world_id",state.selectedWorld || "GW004")
      ]);

      const matchesResult = results[0];
      const assignmentsResult = results[1];
      if(matchesResult.error) throw matchesResult.error;
      if(assignmentsResult.error) throw assignmentsResult.error;

      const matches = attachMatchManagers(matchesResult.data || [],assignmentsResult.data || [],state.selectedWorld || "GW004");

      if(state.competitionTab === "results"){
        target.innerHTML = renderCompetitionMatches(matches,"played");
      }else if(state.competitionTab === "standings"){
        target.innerHTML = renderCompetitionGroupStandings(matches);
      }else{
        target.innerHTML = renderCompetitionMatches(matches,"scheduled");
      }
    }catch(error){
      target.innerHTML = `<div class="card"><div class="status error">${esc(error.message || "Errore caricamento competizione.")}</div></div>`;
    }
  }

  function participantName(match,side){
    const club = side === "home" ? match.home_team : match.away_team;
    const nation = side === "home" ? match.home_nation : match.away_nation;

    if(club && (club.display_name || club.team_name)){
      return teamDisplayName(club,match.game_world_id||state.selectedWorld);
    }
    if(nation && nation.nation_name) return nation.nation_name;
    return "Sconosciuta";
  }

  function matchdayNumber(value){
    const match = String(value || "").match(/(\d+)/);
    return match ? Number(match[1]) : 9999;
  }

  function groupNumber(value){
    const match = String(value || "").match(/(\d+)/);
    return match ? Number(match[1]) : 9999;
  }

  function isCompetitionPlayed(match){
    return StatisticsEngine.isPlayed(match);
  }

  function renderCompetitionMatches(matches,status){
    const cleanMatches = removeResultsScheduleDuplicates(matches);
    const filtered = cleanMatches.filter(function(match){
      return status === "played"
        ? isCompetitionPlayed(match)
        : !isCompetitionPlayed(match);
    });

    if(!filtered.length){
      return `<div class="card"><div class="row-sub">Nessuna partita disponibile.</div></div>`;
    }

    const isWorldCupQualifying = String(state.selectedCompetition || "").trim().toLowerCase() === "world cup qualifying";

    // Build 23: group-stage numbering is based on the full competition dataset,
    // not only on the currently selected Results/Schedule tab.
    const groupStageDates = Array.from(new Set(
      cleanMatches
        .filter(function(match){return Boolean(match.group_name);})
        .map(function(match){return match.match_date || "";})
        .filter(Boolean)
    )).sort();

    const groupStageMatchday = new Map();
    groupStageDates.forEach(function(date,index){
      groupStageMatchday.set(date,index + 1);
    });

    const matchdays = {};

    filtered.forEach(function(match){
      const isGroupStage = Boolean(match.group_name);
      const date = match.match_date || "";

      const groupStageNumber=groupStageMatchday.get(date)||1;
      const matchday=isGroupStage
        ? (isWorldCupQualifying
            ? "Group Stage Game "+Math.min(groupStageNumber,10)
            : "Group Stage "+groupStageNumber+
              (groupStageNumber===groupStageDates.length?" · Fine girone":""))
        : (match.round_name||"Turno");

      const key = (isGroupStage ? "GROUP_STAGE" : matchday) + "|" + date;

      if(!matchdays[key]){
        matchdays[key] = {
          round_name:matchday,
          match_date:date,
          is_group_stage:isGroupStage,
          groups:{}
        };
      }

      const group = match.group_name || "Partite";
      if(!matchdays[key].groups[group]) matchdays[key].groups[group] = [];
      matchdays[key].groups[group].push(match);
    });

    return Object.values(matchdays)
      .sort(function(a,b){
        // Build 23: date always drives position.
        // Results: newest first. Schedule: next fixture first, then later dates.
        const dateA = String(a.match_date || "");
        const dateB = String(b.match_date || "");
        const dateDiff = status === "played"
          ? dateB.localeCompare(dateA)
          : dateA.localeCompare(dateB);
        if(dateDiff !== 0) return dateDiff;

        const dayA = matchdayNumber(a.round_name);
        const dayB = matchdayNumber(b.round_name);
        const dayDiff = status === "played" ? dayB - dayA : dayA - dayB;
        if(dayDiff !== 0) return dayDiff;

        return String(a.round_name).localeCompare(String(b.round_name));
      })
      .map(function(day){
        const groups = Object.keys(day.groups).sort(function(a,b){
          const groupA = String(a || "").replace(/^GIRONE\s+/i,"").trim();
          const groupB = String(b || "").replace(/^GIRONE\s+/i,"").trim();

          const numericA = /^\d+$/.test(groupA) ? Number(groupA) : null;
          const numericB = /^\d+$/.test(groupB) ? Number(groupB) : null;

          if(numericA !== null && numericB !== null) return numericA - numericB;
          if(numericA !== null) return -1;
          if(numericB !== null) return 1;

          return groupA.localeCompare(groupB,"it",{numeric:true,sensitivity:"base"});
        });

        if(day.is_group_stage){
          return `
            <section class="nx-matchday-block nx-compact-group-stage">
              <div class="nx-compact-matchday-heading">
                <strong>${esc(day.round_name||"Group Stage")}</strong>
                <span>${esc(compactCompetitionName(state.selectedCompetition||"Competizione"))} · ${esc(formatDate(day.match_date))}</span>
              </div>

              <div class="nx-compact-groups-card">
                ${groups.map(function(groupName){
                  return `
                    <div class="nx-compact-group">
                      <h3>${esc(compactGroupLabel(groupName))}</h3>
                      <div class="nx-compact-group-matches">
                        ${day.groups[groupName].map(function(match){
                          let score=status==="played"
                            ? match.home_score+" - "+match.away_score
                            : "VS";

                          if(
                            status==="played" &&
                            match.home_penalties!==null &&
                            match.away_penalties!==null
                          ){
                            score+=" ("+match.home_penalties+"-"+match.away_penalties+")";
                          }

                          return `
                            <div class="nx-compact-match-line">
                              ${compactMatchParticipantMarkup(match,"home")}
                              <span class="nx-compact-score">${esc(score)}</span>
                              ${compactMatchParticipantMarkup(match,"away")}
                            </div>`;
                        }).join("")}
                      </div>
                    </div>`;
                }).join("")}
              </div>
            </section>`;
        }

        return `
          <section class="nx-matchday-block">
            <div class="nx-matchday-heading">
              <div>
                <small>${status === "played" ? "RISULTATI" : "SCHEDULE"}</small>
                <h2>${esc(day.round_name || "Turno")}</h2>
              </div>
              <strong>${esc(formatDate(day.match_date))}</strong>
            </div>

            <div class="nx-matchday-groups">
              <div class="card list">
                ${groups.map(function(groupName){
                  return `
                    <div class="nx-group-block nx-group-block-inline">
                      <h3>${esc(groupName)}</h3>
                      ${day.groups[groupName].map(function(match){
                        if(status === "played"){
                          let score = match.home_score + " - " + match.away_score;

                          if(match.home_penalties !== null && match.away_penalties !== null){
                            score += " (" + match.home_penalties + "-" + match.away_penalties + " rig.)";
                          }

                          return `
                            <div class="match-line">
                              ${matchParticipantMarkup(match,"home")}
                              <span class="match-score">${esc(score)}</span>
                              ${matchParticipantMarkup(match,"away")}
                            </div>`;
                        }

                        return `
                          <div class="match-line">
                            ${matchParticipantMarkup(match,"home")}
                            <span class="match-score">VS</span>
                            ${matchParticipantMarkup(match,"away")}
                          </div>`;
                      }).join("")}
                    </div>`;
                }).join("")}
              </div>
            </div>
          </section>`;
      }).join("");
  }

  function renderCompetitionGroupStandings(matches){
    const played = matches.filter(isCompetitionPlayed);

    if(!played.length){
      return `<div class="card"><div class="row-sub">Classifiche non disponibili: nessun risultato giocato.</div></div>`;
    }

    const groups = {};

    played.forEach(function(match){
      const groupName = match.group_name || "Classifica";
      if(!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(match);
    });

    return Object.keys(groups)
      .sort(function(a,b){
        const numberDiff = groupNumber(a) - groupNumber(b);
        return numberDiff !== 0 ? numberDiff : a.localeCompare(b);
      })
      .map(function(groupName){
        const rows = StatisticsEngine.standings(
          groups[groupName],
          function(match){
            return {
              home:participantName(match,"home"),
              away:participantName(match,"away")
            };
          }
        );

        return `
          <section class="nx-group-standing">
            <h2>${esc(groupName)}</h2>

            <div class="nx-standing-box">
              <div class="nx-standing-table-head">
                <span>#</span>
                <span>Squadra</span>
                <span>G</span>
                <span>V</span>
                <span>N</span>
                <span>P</span>
                <span>GF</span>
                <span>GS</span>
                <span>DR</span>
                <span>PT</span>
              </div>

              <div class="nx-standing-table-body">
                ${rows.map(function(row,index){
                  return `
                    <div class="nx-standing-table-row ${index < 2 ? "qualified" : ""}">
                      <span class="nx-standing-pos">${index+1}</span>
                      <strong class="nx-standing-team">${esc(row.team)}</strong>
                      <span>${row.played}</span>
                      <span>${row.won}</span>
                      <span>${row.drawn}</span>
                      <span>${row.lost}</span>
                      <span>${row.gf}</span>
                      <span>${row.ga}</span>
                      <span>${formatSigned(row.gd)}</span>
                      <strong>${row.points}</strong>
                    </div>`;
                }).join("")}
              </div>
            </div>
          </section>`;
      }).join("");
  }

  function managersPage(){
    return `<section class="page"><div class="section-title"><h2>Manager Registry</h2></div><input class="search" id="managerSearch" placeholder="Cerca nome o ID"><div class="card" id="managerList">${managerRows(state.managers)}</div></section>`;
  }

  function managerRows(rows){
    return rows.map(function(manager){
      return `<div class="manager-row"><div class="avatar">${esc(manager.id.slice(-2))}</div><div><div class="row-title">${esc(manager.name)}</div><div class="row-sub">${esc(manager.id)}</div></div></div>`;
    }).join("");
  }

  function bindManagerSearch(){
    document.getElementById("managerSearch").addEventListener("input", function(event){
      const query = event.target.value.toLowerCase();
      const filtered = state.managers.filter(function(manager){
        return manager.id.toLowerCase().includes(query) || manager.name.toLowerCase().includes(query);
      });
      document.getElementById("managerList").innerHTML = managerRows(filtered);
    });
  }

  function importPage(isGlobalAdmin){
    return `
      <section class="page">
        <div class="section-title"><h2>${isGlobalAdmin ? "Global Import" : "Import Results"}</h2></div>

        <div class="warning">
          Per League e fasi a gironi, il Matchday viene assegnato dal calendario ufficiale del Game World.
          Per le fasi a eliminazione diretta fa fede il turno scritto nell’intestazione importata.
        </div>

        <div class="card">
          <div class="field">
            <label>Game World</label>
            <select id="importWorld">
              ${isGlobalAdmin ? configuredWorldOptions() : '<option value="GW004">${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</option>'}
            </select>
          </div>

          <div class="field">
            <label>Stagione attiva</label>
            <div id="importSeasonDisplay" class="nx-readonly-field">Caricamento stagione…</div>
            <input type="hidden" id="importSeason" value="">
          </div>

          <div class="field">
            <label>Competizione</label>
            <select id="importMode">
              ${configuredCompetitionOptions("GW004")}
            </select>
            <div class="field-help" id="competitionHelp">9 modalità disponibili per GW004</div>
          </div>


          <div class="field">
            <label>Incolla risultati</label>
            <textarea id="importText" placeholder="dom 12 luglio 2026

Borussia Dortmund
2 - 1
Chelsea

AJAX
3 - 0
Club América"></textarea>
          </div>

          <div class="actions">
            <button class="secondary" id="previewButton">ANTEPRIMA</button>
            <button class="primary" id="importButton">IMPORTA</button>
          </div>

          <div class="status" id="importStatus"></div>
        </div>

        <section class="section" id="previewSection" hidden>
          <div class="section-title"><h2>Anteprima importazione</h2></div>
          <div class="preview-box" id="previewBox"></div>
        </section>

        <section class="section nx-import-delete-section">
          <div class="section-title"><h2>Gestione dati importati</h2></div>
          <div class="warning">
            Cancella esclusivamente i dati partita salvati in questa stagione. La configurazione della competizione, le squadre, i manager e le impostazioni del Game World restano intatti.
          </div>
          <div class="card">
            <div class="field">
              <label>Tipo di cancellazione</label>
              <select id="importDeleteMode">
                <option value="day">Singola giornata</option>
                <option value="competition">Intera competizione caricata</option>
              </select>
            </div>
            <div class="field" id="importDeleteDayField">
              <label>Giornata / Data</label>
              <select id="importDeleteDay"><option value="">Caricamento dati…</option></select>
              <div class="field-help" id="importDeleteDayHelp"></div>
            </div>
            <div class="actions">
              <button class="secondary" id="previewDeleteButton" type="button">ANTEPRIMA CANCELLAZIONE</button>
            </div>
            <div class="status" id="importDeleteStatus"></div>
          </div>
        </section>

        <section class="section" id="deletePreviewSection" hidden>
          <div class="section-title"><h2>Dati che verranno eliminati</h2></div>
          <div class="preview-box" id="deletePreviewBox"></div>
          <div class="actions nx-delete-confirm-actions">
            <button class="nx-danger-action" id="confirmDeleteImportButton" type="button">ELIMINA DATI SELEZIONATI</button>
          </div>
        </section>
      </section>`;
  }

  const italianMonths = {
    gennaio:1, febbraio:2, marzo:3, aprile:4, maggio:5, giugno:6,
    luglio:7, agosto:8, settembre:9, ottobre:10, novembre:11, dicembre:12
  };

  function normalizeText(value){
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function formatClubName(value){
    const raw=String(value||"").trim();
    if(!raw)return "";

    return raw
      .toLocaleLowerCase("it-IT")
      .split(/\s+/)
      .filter(Boolean)
      .map(function(word){
        return word.charAt(0).toLocaleUpperCase("it-IT")+word.slice(1);
      })
      .join(" ");
  }

  function teamDisplayName(team,worldId){
    if(!team)return "";

    // BUILD 1 · one global club name across every Game World.
    const globalClub=globalClubForTeam(
      team,
      worldId||team.game_world_id||state.selectedWorld
    );

    if(globalClub&&globalClub.display_name){
      return formatClubName(globalClub.display_name);
    }

    // Legacy per-GW alias remains only as a safe fallback.
    const alias=teamAliasFor(
      team.team_id,
      worldId||team.game_world_id||state.selectedWorld
    );

    if(alias)return formatClubName(alias);

    const raw=team.display_name||team.team_name||team.name||"";
    return formatClubName(raw);
  }

  function normalizeParticipantKey(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLocaleLowerCase("it-IT")
      .replace(/[.'’`´\-_/]+/g," ")
      .replace(/[^a-z0-9\s&]+/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function formatTeamDisplayName(value){
    return String(value || "")
      .normalize("NFC")
      .replace(/[.'’`´\-_/]+/g," ")
      .replace(/\s+/g," ")
      .trim()
      .toLocaleLowerCase("it-IT")
      .replace(/(^|\s)([a-zà-öø-ÿ])/g,function(_,space,letter){
        return space + letter.toLocaleUpperCase("it-IT");
      });
  }

  function isOpenSmfaCompetition(competitionName){
    return ["SMFA Champions","SMFA Shield","SMFA Super Cup"]
      .includes(String(competitionName || "").trim());
  }

  function parseItalianDate(line){
    const clean = normalizeText(line).toLowerCase();

    // Normal date: sab 1 agosto 2026
    let match = clean.match(/^(?:lun|mar|mer|gio|ven|sab|dom)?\.?\s*(\d{1,2})\s+([a-zàèéìòù]+)\s+(\d{4})$/i);

    // Knockout header: Turno 1 : lun 20 luglio 2026
    if(!match){
      match = clean.match(/^.+?:\s*(?:lun|mar|mer|gio|ven|sab|dom)?\.?\s*(\d{1,2})\s+([a-zàèéìòù]+)\s+(\d{4})$/i);
    }

    if(!match) return null;

    const day = Number(match[1]);
    const month = italianMonths[match[2]];
    const year = Number(match[3]);
    if(!month) return null;

    const iso = [
      year,
      String(month).padStart(2,"0"),
      String(day).padStart(2,"0")
    ].join("-");

    return {
      iso: iso,
      label: String(day).padStart(2,"0") + "/" + String(month).padStart(2,"0") + "/" + year
    };
  }

  function parseScore(line){
    const match = normalizeText(line).match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if(!match) return null;
    return {home_score:Number(match[1]), away_score:Number(match[2])};
  }

  function parseTime(line){
    const match = normalizeText(line).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if(!match) return null;
    return String(match[1]).padStart(2,"0") + ":" + match[2];
  }

  function parseGroup(line){
    const match = normalizeText(line).match(/^GIRONE\s+([A-Z]|\d+)$/i);
    return match ? "GIRONE " + match[1].toUpperCase() : null;
  }

  function parseRoundHeader(line){
    const clean = normalizeText(line);
    const match = clean.match(/^(.+?)\s*:\s*(?:lun|mar|mer|gio|ven|sab|dom)?\.?\s*\d{1,2}\s+[a-zàèéìòù]+\s+\d{4}$/i);
    return match ? match[1].trim() : null;
  }

  function parsePenaltyLine(line){
    const clean = normalizeText(line);
    const match = clean.match(/^La squadra (.+?) vince ai rigori con il punteggio di (\d+)\s*-\s*(\d+)\.$/i);
    if(!match) return null;
    return {
      winner_name: match[1].trim(),
      first_penalties: Number(match[2]),
      second_penalties: Number(match[3])
    };
  }

  function isIgnoredInformationalLine(line){
    const clean = normalizeText(line).toLowerCase();
    return clean.startsWith("le seguenti squadre sono uscite dal prossimo turno del torneo");
  }

  function competitionParserMode(competition){
    if(competition === "league") return "league";
    if(["League Cup","League Shield"].includes(competition)) return "knockout";
    if(["Charity Shield","SMFA Super Cup"].includes(competition)) return "single";
    if(["World Cup Qualifying"].includes(competition)) return "groups";
    if(["SMFA Champions","SMFA Shield","World Cup"].includes(competition)) return "auto";
    return "auto";
  }

  function isNationalCompetition(competition){
    return competition === "World Cup Qualifying" || competition === "World Cup";
  }

  function parseCompetitionImport(text, competition){
    const lines = String(text || "").split(/\r?\n/).map(normalizeText).filter(Boolean);
    const matches = [];
    const rejected = [];
    const dates = [];

    let currentDate = null;
    let currentGroup = null;
    let currentRound = null;
    let ignoreRest = false;
    let index = 0;

    while(index < lines.length){
      const line = lines[index];

      if(isIgnoredInformationalLine(line)){
        ignoreRest = true;
        index += 1;
        continue;
      }

      if(ignoreRest){
        index += 1;
        continue;
      }

      const date = parseItalianDate(line);
      const round = parseRoundHeader(line);

      if(date){
        currentDate = date;
        if(!dates.some(function(item){ return item.iso === date.iso; })){
          dates.push(date);
        }
        if(round) currentRound = round;
        index += 1;
        continue;
      }

      const group = parseGroup(line);
      if(group){
        currentGroup = group;
        currentRound = "Group Stage";
        index += 1;
        continue;
      }

      const home = formatTeamDisplayName(line);
      const middle = index + 1 < lines.length ? lines[index + 1] : null;
      const away = index + 2 < lines.length ? formatTeamDisplayName(lines[index + 2]) : null;
      const score = middle ? parseScore(middle) : null;
      const time = middle ? parseTime(middle) : null;

      if(currentDate && home && middle && away && !parseItalianDate(away) && !parseGroup(away)){
        if(score || time){
          const match = {
            match_date: currentDate.iso,
            date_label: currentDate.label,
            home: home,
            away: away,
            home_score: score ? score.home_score : null,
            away_score: score ? score.away_score : null,
            match_time: time,
            match_status: score ? "played" : "scheduled",
            stage_name: currentGroup ? "Group Stage" : (currentRound || null),
            group_name: currentGroup,
            round_name: currentGroup || currentRound || null,
            decided_on_penalties: false,
            home_penalties: null,
            away_penalties: null,
            penalty_winner_name: null
          };

          const possiblePenalty = index + 3 < lines.length ? parsePenaltyLine(lines[index + 3]) : null;

          if(possiblePenalty){
            match.decided_on_penalties = true;
            match.penalty_winner_name = possiblePenalty.winner_name;

            if(possiblePenalty.winner_name.toLowerCase() === home.toLowerCase()){
              match.home_penalties = possiblePenalty.first_penalties;
              match.away_penalties = possiblePenalty.second_penalties;
            }else{
              match.home_penalties = possiblePenalty.second_penalties;
              match.away_penalties = possiblePenalty.first_penalties;
            }

            index += 4;
          }else{
            index += 3;
          }

          matches.push(match);
          continue;
        }
      }

      rejected.push(line);
      index += 1;
    }

    dates.sort(function(a,b){ return a.iso.localeCompare(b.iso); });

    return {
      matches: matches,
      rejected: rejected,
      dates: dates.map(function(date){
        return {date:date.iso,label:date.label};
      })
    };
  }

  async function loadActiveSeasonForImport(worldId){
    const resolvedWorldId = worldId || "GW004";

    const settingsResult = await state.client
      .from("gw_world_settings")
      .select("active_season_id")
      .eq("game_world_id",resolvedWorldId)
      .maybeSingle();

    if(settingsResult.error) throw settingsResult.error;

    if(settingsResult.data && settingsResult.data.active_season_id){
      const seasonResult = await state.client
        .from("gw_seasons")
        .select("season_id,season_number,season_status")
        .eq("game_world_id",resolvedWorldId)
        .eq("season_id",settingsResult.data.active_season_id)
        .maybeSingle();

      if(seasonResult.error) throw seasonResult.error;
      if(seasonResult.data) return seasonResult.data;
    }

    const fallbackResult = await state.client
      .from("gw_seasons")
      .select("season_id,season_number,season_status")
      .eq("game_world_id",resolvedWorldId)
      .eq("season_status","current")
      .maybeSingle();

    if(fallbackResult.error) throw fallbackResult.error;
    if(!fallbackResult.data){
      throw new Error("Nessuna stagione attiva configurata per " + resolvedWorldId + ".");
    }

    return fallbackResult.data;
  }

  async function loadSeason(worldId){
    const season = await loadActiveSeasonForImport(worldId);
    return season.season_id;
  }

  async function loadLeagueContext(worldId){
    const resolvedWorldId = worldId || "GW004";
    const seasonId = await loadSeason(resolvedWorldId);

    const setupResults = await Promise.all([
      state.client
        .from("gw_setup_team_divisions")
        .select(`
          team_id,
          division_number,
          nation_setup_id,
          gw_teams!inner(team_id,team_name,display_name)
        `)
        .eq("game_world_id",resolvedWorldId)
        .eq("season_id",seasonId),

      state.client
        .from("gw_division_setups")
        .select("division_setup_id,nation_setup_id,division_number,team_count")
        .eq("game_world_id",resolvedWorldId)
        .order("division_number",{ascending:true}),

      state.client
        .from("gw_divisions")
        .select("division_id,division_code,division_name,division_level,teams_count,meetings_per_pair")
        .eq("game_world_id",resolvedWorldId),

      state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,division_id,competition_type")
        .eq("game_world_id",resolvedWorldId)
        .eq("competition_type","league"),

      state.client
        .from("gw_matches")
        .select("competition_id,match_date,round_name")
        .eq("game_world_id",resolvedWorldId)
        .eq("season_id",seasonId),

      state.client
        .from("gw_team_aliases")
        .select("team_id,alias_name")
        .eq("game_world_id",resolvedWorldId),

      state.client
        .from("gw_setup_nations")
        .select("nation_setup_id,nation_name,sort_order")
        .eq("game_world_id",resolvedWorldId)
        .order("sort_order",{ascending:true}),

      state.client
        .from("gw_league_countries")
        .select("country_id,game_world_id,country_name")
        .eq("game_world_id",resolvedWorldId)
    ]);

    setupResults.forEach(function(result){
      if(result.error) throw result.error;
    });

    const teams = setupResults[0].data || [];
    const setupDivisions = setupResults[1].data || [];
    let realDivisions = setupResults[2].data || [];
    let competitions = setupResults[3].data || [];
    const existingMatches = setupResults[4].data || [];
    const teamAliases = setupResults[5].data || [];
    const setupNations = setupResults[6].data || [];
    const leagueCountries = setupResults[7].data || [];
    const nationNameById = new Map();
    const countryIdByNationSetupId = new Map();
    const countryByName = new Map();

    leagueCountries.forEach(function(country){
      countryByName.set(
        normalizeParticipantKey(country.country_name),
        country
      );
    });

    setupNations.forEach(function(nation){
      nationNameById.set(String(nation.nation_setup_id),String(nation.nation_name||"").trim());
      const country=countryByName.get(
        normalizeParticipantKey(nation.nation_name)
      );
      if(country){
        countryIdByNationSetupId.set(
          String(nation.nation_setup_id),
          Number(country.country_id)
        );
      }
    });

    function uniqueLeagueName(nationId,divisionNumber){
      if(nationId){
        const nationName = nationNameById.get(String(nationId)) || ("Nazione " + nationId);
        return nationName + " · Division " + divisionNumber;
      }
      return "Division " + divisionNumber;
    }

    const missingRealDivisions = setupDivisions.filter(function(setupDivision){
      const divisionNumber=Number(setupDivision.division_number);
      const nationId=setupDivision.nation_setup_id;
      const expectedCode=nationId
        ? multiDivisionCode(resolvedWorldId,nationId,divisionNumber)
        : resolvedWorldId+"_DIV_"+String(divisionNumber).padStart(2,"0");
      return !realDivisions.some(function(realDivision){
        return realDivision.division_code===expectedCode;
      });
    }).map(function(setupDivision){
      const divisionNumber = Number(setupDivision.division_number);
      const nationId=setupDivision.nation_setup_id;
      return {
        game_world_id:resolvedWorldId,
        country_id:nationId
          ? (countryIdByNationSetupId.get(String(nationId))||null)
          : null,
        division_code:nationId
          ? multiDivisionCode(resolvedWorldId,nationId,divisionNumber)
          : resolvedWorldId + "_DIV_" + String(divisionNumber).padStart(2,"0"),
        division_name:uniqueLeagueName(nationId,divisionNumber),
        division_level:divisionNumber,
        teams_count:Number(setupDivision.team_count),
        meetings_per_pair:2,
        promotion_total:0,
        promotion_direct:0,
        promotion_playoff:0,
        relegation_total:0
      };
    });

    if(missingRealDivisions.length){
      const divisionInsert = await state.client
        .from("gw_divisions")
        .insert(missingRealDivisions)
        .select("division_id,division_code,division_name,division_level,teams_count,meetings_per_pair");

      if(divisionInsert.error) throw divisionInsert.error;
      realDivisions = realDivisions.concat(divisionInsert.data || []);
    }

    const realDivisionBySetupKey = new Map();
    realDivisions.forEach(function(division){
      const code=String(division.division_code||"");
      const multiMatch=code.match(/_N(\d+)_DIV_(\d+)$/);
      const singleMatch=code.match(/_DIV_(\d+)$/);
      if(multiMatch){
        realDivisionBySetupKey.set(String(Number(multiMatch[1]))+"|"+String(Number(multiMatch[2])),division);
      }else if(singleMatch){
        realDivisionBySetupKey.set("|"+String(Number(singleMatch[1])),division);
      }
    });

    // Build 23:
    // usa lo stesso vincolo univoco del database
    // (game_world_id, competition_name).
    // Se una League esiste già, aggiorna division_id e country_id
    // invece di tentare un nuovo INSERT.
    const leagueCompetitionPayload = setupDivisions.map(function(setupDivision){
      const setupKey =
        String(setupDivision.nation_setup_id || "") +
        "|" +
        String(Number(setupDivision.division_number));

      const realDivision = realDivisionBySetupKey.get(setupKey);
      if(!realDivision) return null;

      return {
        game_world_id: resolvedWorldId,
        country_id: setupDivision.nation_setup_id
          ? (countryIdByNationSetupId.get(
              String(setupDivision.nation_setup_id)
            ) || null)
          : null,
        competition_name: uniqueLeagueName(
          setupDivision.nation_setup_id,
          Number(setupDivision.division_number)
        ),
        competition_type: "league",
        division_id: realDivision.division_id,
        competition_category: "domestic"
      };
    }).filter(Boolean);

    if(leagueCompetitionPayload.length){
      const competitionUpsert = await state.client
        .from("gw_competitions")
        .upsert(
          leagueCompetitionPayload,
          { onConflict: "game_world_id,competition_name" }
        )
        .select(
          "competition_id,competition_name,division_id,competition_type,country_id"
        );

      if(competitionUpsert.error) throw competitionUpsert.error;

      const returnedByName = new Map(
        (competitionUpsert.data || []).map(function(row){
          return [
            normalizeParticipantKey(row.competition_name),
            row
          ];
        })
      );

      competitions = competitions
        .filter(function(row){
          return !returnedByName.has(
            normalizeParticipantKey(row.competition_name)
          );
        })
        .concat(competitionUpsert.data || []);
    }

    const setupDivisionByKey = new Map();
    setupDivisions.forEach(function(division){
      const key = String(division.nation_setup_id || "") + "|" + String(division.division_number);
      setupDivisionByKey.set(key,division);
    });

    const teamMap = new Map();
    teams.forEach(function(row){
      const setupKey = String(row.nation_setup_id || "") + "|" + String(row.division_number);
      const setupDivision = setupDivisionByKey.get(setupKey);
      const realDivision = realDivisionBySetupKey.get(String(row.nation_setup_id||"")+"|"+String(Number(row.division_number)));

      if(!setupDivision || !realDivision) return;

      const teamData={
        team_id:row.team_id,
        team_name:teamDisplayName(row.gw_teams,resolvedWorldId),
        official_team_name:row.gw_teams.team_name,
        division_id:realDivision.division_id,
        division_name:realDivision.division_name
      };
      teamMap.set(normalizeParticipantKey(row.gw_teams.team_name),teamData);
      if(row.gw_teams.display_name){
        teamMap.set(normalizeParticipantKey(row.gw_teams.display_name),teamData);
      }

      addGlobalClubAliasesToParticipantMap(
        teamMap,
        teamData,
        [row.gw_teams.team_name,row.gw_teams.display_name,teamData.team_name]
      );
    });

    const leagueTeamById = new Map();
    teamMap.forEach(function(teamData){
      leagueTeamById.set(String(teamData.team_id),teamData);
    });

    teamAliases.forEach(function(alias){
      const teamData = leagueTeamById.get(String(alias.team_id));
      if(teamData && alias.alias_name){
        teamMap.set(normalizeParticipantKey(alias.alias_name),teamData);
      }
    });

    const competitionByDivision = new Map();
    competitions.forEach(function(competition){
      competitionByDivision.set(String(competition.division_id),competition);
    });

    const leagueCompetitionIds=new Set(
      competitions.map(function(row){return String(row.competition_id);})
    );

    const existingLeagueMatches=existingMatches.filter(function(row){
      return leagueCompetitionIds.has(String(row.competition_id));
    });

    const officialMatchdayByDate={};
    existingLeagueMatches.forEach(function(row){
      const number=matchdayNumber(row.round_name);
      if(row.match_date&&number!==9999){
        officialMatchdayByDate[row.match_date]=number;
      }
    });

    return {
      world_id:resolvedWorldId,
      season_id:seasonId,
      team_map:teamMap,
      competition_by_division:competitionByDivision,
      existing_dates:Array.from(new Set(existingLeagueMatches.map(function(row){
        return row.match_date;
      }))).filter(Boolean).sort(),
      official_matchday_by_date:officialMatchdayByDate,
      national:false
    };
  }


  function resolveCompetitionType(competitionName){
    const name=String(competitionName||"").trim().toLowerCase();

    const map={
      "league":"league",
      "promotion playoff":"promotion_playoff",
      "league cup":"domestic_cup",
      "league shield":"domestic_cup",
      "charity shield":"domestic_super_cup",
      "smfa champions":"smfa_champions",
      "smfa shield":"smfa_shield",
      "smfa super cup":"smfa_super_cup",
      "world cup qualifying":"world_cup_qualifying",
      "world cup":"world_cup"
    };

    return map[name] || "domestic_cup";
  }

  async function loadCompetitionContext(competitionName,worldId){
    const resolvedWorldId = worldId || state.selectedWorld || "GW004";
    const seasonId = await loadSeason(resolvedWorldId);
    const national = isNationalCompetition(competitionName);
    const competitionType = resolveCompetitionType(competitionName);
    const domesticClubCompetition=!national&&[
      "domestic_cup",
      "domestic_super_cup",
      "promotion_playoff"
    ].includes(competitionType);
    const worldMeta=getWorldMeta(resolvedWorldId);
    const isMultiLeague=!!(worldMeta&&worldMeta.type==="multi_league");

    let competitionResult=null;
    const competitionByCountry = new Map();

    if(domesticClubCompetition){
      if(isMultiLeague){
        const domesticResult=await state.client
          .from("gw_competitions")
          .select("competition_id,competition_name,competition_type,country_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("competition_type",competitionType)
          .not("country_id","is",null)
          .order("competition_id",{ascending:true});

        if(domesticResult.error)throw domesticResult.error;

        const requestedDbName=String(competitionName||"").trim();
        (domesticResult.data||[]).forEach(function(row){
          const rowName=String(row.competition_name||"").trim();
          const exactName=rowName===requestedDbName || rowName.endsWith(" · "+requestedDbName);
          if(exactName){
            competitionByCountry.set(String(row.country_id),row);
          }
        });

        if(!competitionByCountry.size){
          throw new Error("Nessuna competizione nazionale configurata per "+competitionName+".");
        }
      }else{
        competitionResult=await state.client
          .from("gw_competitions")
          .select("competition_id,competition_name,competition_type,country_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("competition_name",competitionName)
          .is("country_id",null)
          .maybeSingle();

        if(competitionResult.error)throw competitionResult.error;

        if(!competitionResult.data){
          const insertResult=await state.client
            .from("gw_competitions")
            .upsert({
              game_world_id:resolvedWorldId,
              competition_name:competitionName,
              competition_type:competitionType,
              competition_category:"domestic",
              division_id:null,
              country_id:null
            },{onConflict:"game_world_id,competition_name"})
            .select("competition_id,competition_name,competition_type,country_id")
            .single();

          if(insertResult.error)throw insertResult.error;
          competitionResult=insertResult;
        }
      }
    }else{
      competitionResult = await state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,competition_type,country_id")
        .eq("game_world_id",resolvedWorldId)
        .eq("competition_name",competitionName)
        .maybeSingle();

      if(competitionResult.error) throw competitionResult.error;

      if(!competitionResult.data){
        const category = national
          ? "national_teams"
          : (competitionType.indexOf("smfa_") === 0 ? "international" : "domestic");

        const insertResult = await state.client
          .from("gw_competitions")
          .insert({
            game_world_id:resolvedWorldId,
            competition_name:competitionName,
            competition_type:competitionType,
            competition_category:category,
            division_id:null,
            country_id:null
          })
          .select("competition_id,competition_name,competition_type,country_id")
          .single();

        if(insertResult.error) throw insertResult.error;
        competitionResult = insertResult;
      }
    }

    const map = new Map();

    if(national){
      const registryResult = await state.client
        .from("imc_national_teams")
        .select("nation_id,nation_name,continent")
        .order("nation_name",{ascending:true});

      if(registryResult.error) throw registryResult.error;

      (registryResult.data || []).forEach(function(nation){
        map.set(normalizeParticipantKey(nation.nation_name),{
          nation_id:nation.nation_id,
          name:nation.nation_name,
          continent:nation.continent
        });
      });

      if(!map.size){
        throw new Error("Il Registry globale delle nazionali è vuoto.");
      }
    }else{
      const clubResults = await Promise.all([
        state.client
          .from("gw_teams")
          .select("team_id,team_name,display_name,country_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("team_type","club"),

        state.client
          .from("gw_team_aliases")
          .select("team_id,alias_name")
          .eq("game_world_id",resolvedWorldId),

        state.client
          .from("gw_setup_team_divisions")
          .select("team_id,nation_setup_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("season_id",seasonId),

        state.client
          .from("gw_setup_nations")
          .select("nation_setup_id,nation_name")
          .eq("game_world_id",resolvedWorldId),

        state.client
          .from("gw_league_countries")
          .select("country_id,country_name")
          .eq("game_world_id",resolvedWorldId)
      ]);

      clubResults.forEach(function(result){
        if(result.error) throw result.error;
      });

      const teams = clubResults[0].data || [];
      const aliases = clubResults[1].data || [];
      const teamDivisions = clubResults[2].data || [];
      const setupNations = clubResults[3].data || [];
      const leagueCountries = clubResults[4].data || [];
      const teamById = new Map();
      const nationNameBySetupId = new Map();
      const countryIdByName = new Map();
      const countryIdByTeamId = new Map();

      setupNations.forEach(function(nation){
        nationNameBySetupId.set(String(nation.nation_setup_id),nation.nation_name);
      });

      leagueCountries.forEach(function(country){
        countryIdByName.set(normalizeParticipantKey(country.country_name),country.country_id);
      });

      teamDivisions.forEach(function(row){
        const nationName=nationNameBySetupId.get(String(row.nation_setup_id));
        const countryId=nationName
          ? countryIdByName.get(normalizeParticipantKey(nationName))
          : null;
        if(countryId){
          countryIdByTeamId.set(String(row.team_id),countryId);
        }
      });

      teams.forEach(function(team){
        const teamData={
          team_id:team.team_id,
          name:teamDisplayName(team,resolvedWorldId),
          official_name:team.team_name,
          country_id:team.country_id || countryIdByTeamId.get(String(team.team_id)) || null
        };

        teamById.set(String(team.team_id),teamData);
        map.set(normalizeParticipantKey(team.team_name),teamData);

        if(team.display_name){
          map.set(normalizeParticipantKey(team.display_name),teamData);
        }

        addGlobalClubAliasesToParticipantMap(
          map,
          teamData,
          [team.team_name,team.display_name,teamData.name]
        );
      });

      aliases.forEach(function(alias){
        const teamData = teamById.get(String(alias.team_id));
        if(teamData && alias.alias_name){
          map.set(normalizeParticipantKey(alias.alias_name),teamData);
        }
      });
    }

    let existingQuery = state.client
      .from("gw_matches")
      .select("match_date")
      .eq("game_world_id",resolvedWorldId)
      .eq("season_id",seasonId);

    if(domesticClubCompetition&&isMultiLeague){
      const ids=Array.from(competitionByCountry.values()).map(function(row){
        return row.competition_id;
      });
      existingQuery=existingQuery.in("competition_id",ids);
    }else{
      existingQuery=existingQuery.eq("competition_id",competitionResult.data.competition_id);
    }

    const existingResult = await existingQuery;
    if(existingResult.error) throw existingResult.error;

    return {
      world_id:resolvedWorldId,
      season_id:seasonId,
      competition_id:competitionResult ? competitionResult.data.competition_id : null,
      competition_name:competitionResult ? competitionResult.data.competition_name : competitionName,
      competition_type:competitionType,
      competition_by_country:competitionByCountry,
      domestic_club_competition:domesticClubCompetition,
      is_multi_league:isMultiLeague,
      participant_map:map,
      existing_dates:Array.from(new Set((existingResult.data||[]).map(function(x){
        return x.match_date;
      }))).filter(Boolean).sort(),
      national:national
    };
  }

  function applyOfficialMatchdays(parsed,context,competition,worldId){
    if(competition==="league"){
      const fallbackDates=Array.from(new Set(
        (context.existing_dates||[])
          .concat(parsed.matches.map(function(match){return match.match_date;}))
          .filter(Boolean)
      )).sort();

      const fallbackByDate=new Map();
      fallbackDates.forEach(function(date,index){
        fallbackByDate.set(date,index+1);
      });

      parsed.matches.forEach(function(match){
        const official=officialLeagueMatchday(
          worldId,
          match.match_date,
          context
        );
        const matchday=official||fallbackByDate.get(match.match_date)||null;

        match.matchday=matchday;
        if(matchday){
          // Always overwrite a stale/incorrect imported round_name.
          match.round_name="Giornata "+matchday;
        }
        if(!match.stage_name)match.stage_name="Single League";
      });
    }

    parsed.dates=Array.from(new Set(
      parsed.matches.map(function(match){return match.match_date;})
    ))
      .filter(Boolean)
      .sort()
      .map(function(date){
        const sample=parsed.matches.find(function(match){
          return match.match_date===date;
        });
        return {
          date:date,
          label:sample?sample.date_label:formatDate(date),
          matchday:sample&&sample.matchday?sample.matchday:null
        };
      });

    parsed.calendarErrors=[];
  }

  function validateLeagueMatches(parsed,context){
    const valid=[],errors=[];

    parsed.matches.forEach(function(match,index){
      const home=context.team_map.get(normalizeParticipantKey(match.home));
      const away=context.team_map.get(normalizeParticipantKey(match.away));

      if(!home){errors.push("Partita "+(index+1)+": squadra casa non trovata: "+match.home);return;}
      if(!away){errors.push("Partita "+(index+1)+": squadra trasferta non trovata: "+match.away);return;}
      if(home.division_id!==away.division_id){
        errors.push(home.team_name+" e "+away.team_name+" non appartengono alla stessa nazione/divisione.");
        return;
      }

      const competition=context.competition_by_division.get(String(home.division_id));
      if(!competition){errors.push("League non trovata per "+home.division_name);return;}

      valid.push(Object.assign({},match,{
        game_world_id:context.world_id,
        season_id:context.season_id,
        competition_id:competition.competition_id,
        competition_name:competition.competition_name,
        division_name:home.division_name,
        home_team_id:home.team_id,
        away_team_id:away.team_id,
        home_team_name:home.team_name,
        away_team_name:away.team_name,
        national:false
      }));
    });

    return {valid:valid,errors:errors};
  }

  async function ensureSingleLeagueCompetitionParticipants(parsed,context){
    if(
      context.national||
      context.is_multi_league||
      !context.domestic_club_competition
    )return;

    const importedNames=Array.from(new Set(
      (parsed.matches||[]).flatMap(function(match){
        return [match.home,match.away];
      }).map(formatTeamDisplayName).filter(Boolean)
    ));

    const missing=importedNames.filter(function(name){
      return !context.participant_map.has(normalizeParticipantKey(name));
    });

    if(!missing.length)return;

    const inserted=await state.client
      .from("gw_teams")
      .insert(missing.map(function(name){
        return {
          game_world_id:context.world_id,
          country_id:null,
          team_type:"club",
          team_name:formatTeamDisplayName(name),
          display_name:formatTeamDisplayName(name)
        };
      }))
      .select("team_id,team_name,display_name,country_id");

    if(inserted.error)throw inserted.error;

    (inserted.data||[]).forEach(function(team){
      const teamData={
        team_id:team.team_id,
        name:teamDisplayName(team),
        official_name:team.team_name,
        country_id:null
      };
      context.participant_map.set(normalizeParticipantKey(team.team_name),teamData);
      if(team.display_name){
        context.participant_map.set(normalizeParticipantKey(team.display_name),teamData);
      }
    });
  }

  async function ensureOpenSmfaParticipants(parsed,context,competitionName){
    if(!isOpenSmfaCompetition(competitionName) || context.national) return;

    const importedNames = Array.from(new Set(
      (parsed.matches || []).flatMap(function(match){
        return [match.home,match.away];
      }).map(formatTeamDisplayName).filter(Boolean)
    ));

    const missing = importedNames.filter(function(name){
      return !context.participant_map.has(normalizeParticipantKey(name));
    });

    if(!missing.length) return;

    const inserted = await state.client
      .from("gw_teams")
      .insert(missing.map(function(name){
        return {
          game_world_id:context.world_id,
          country_id:null,
          team_type:"club",
          team_name:formatTeamDisplayName(name),
          display_name:formatTeamDisplayName(name)
        };
      }))
      .select("team_id,team_name,display_name");

    if(inserted.error) throw inserted.error;

    (inserted.data || []).forEach(function(team){
      const teamData={
        team_id:team.team_id,
        name:teamDisplayName(team)
      };
      context.participant_map.set(normalizeParticipantKey(team.team_name),teamData);
      if(team.display_name){
        context.participant_map.set(normalizeParticipantKey(team.display_name),teamData);
      }
    });
  }

  function validateCompetitionMatches(parsed,context){
    const valid=[],errors=[];

    parsed.matches.forEach(function(match,index){
      const home=context.participant_map.get(normalizeParticipantKey(match.home));
      const away=context.participant_map.get(normalizeParticipantKey(match.away));

      if(!home){errors.push("Partita "+(index+1)+": casa non trovata: "+match.home);return;}
      if(!away){errors.push("Partita "+(index+1)+": trasferta non trovata: "+match.away);return;}

      let selectedCompetition = null;

      if(context.domestic_club_competition&&context.is_multi_league){
        if(!home.country_id){
          errors.push("Partita "+(index+1)+": nazione non associata alla squadra "+home.name+".");
          return;
        }
        if(!away.country_id){
          errors.push("Partita "+(index+1)+": nazione non associata alla squadra "+away.name+".");
          return;
        }
        if(String(home.country_id)!==String(away.country_id)){
          errors.push("Partita "+(index+1)+": "+home.name+" e "+away.name+" appartengono a nazioni diverse.");
          return;
        }

        selectedCompetition=context.competition_by_country.get(String(home.country_id));
        if(!selectedCompetition){
          errors.push("Partita "+(index+1)+": competizione "+context.competition_name+" non configurata per la nazione di "+home.name+".");
          return;
        }
      }

      const resolvedCompetitionId = selectedCompetition
        ? selectedCompetition.competition_id
        : context.competition_id;
      const resolvedCompetitionName = selectedCompetition
        ? selectedCompetition.competition_name
        : context.competition_name;

      valid.push(Object.assign({},match,{
        game_world_id:context.world_id,
        season_id:context.season_id,
        competition_id:resolvedCompetitionId,
        competition_name:resolvedCompetitionName,
        division_name:match.group_name || match.round_name || resolvedCompetitionName,
        home_team_id:context.national ? null : home.team_id,
        away_team_id:context.national ? null : away.team_id,
        home_nation_id:context.national ? home.nation_id : null,
        away_nation_id:context.national ? away.nation_id : null,
        home_team_name:home.name,
        away_team_name:away.name,
        national:context.national
      }));
    });

    return {valid:valid,errors:errors};
  }

  function formatPreview(parsed,validation){
    const lines=[];

    parsed.dates.forEach(function(date){
      lines.push("DATA "+date.label);
      lines.push("");

      const sections={};

      validation.valid
        .filter(function(match){return match.match_date===date.date;})
        .forEach(function(match){
          const section=match.group_name || match.round_name || match.competition_name;
          if(!sections[section]) sections[section]=[];
          sections[section].push(match);
        });

      Object.keys(sections).forEach(function(section){
        lines.push(section);

        sections[section].forEach(function(match){
          if(match.match_status==="played"){
            let line="✓ "+match.home_team_name+" "+match.home_score+"-"+match.away_score+" "+match.away_team_name;
            if(match.decided_on_penalties){
              line+=" · rigori "+match.home_penalties+"-"+match.away_penalties;
            }
            lines.push(line);
          }else{
            lines.push("○ "+match.home_team_name+" vs "+match.away_team_name+" · "+match.match_time);
          }
        });

        lines.push("");
      });
    });

    lines.push("RIEPILOGO");
    lines.push("- Partite valide: "+validation.valid.length);
    lines.push("- Errori: "+validation.errors.length);
    lines.push("- Righe non riconosciute: "+parsed.rejected.length);

    if(validation.errors.length){
      lines.push("");
      lines.push("ERRORI");
      validation.errors.forEach(function(error){lines.push("- "+error);});
    }

    if(parsed.rejected.length){
      lines.push("");
      lines.push("RIGHE NON RICONOSCIUTE");
      parsed.rejected.forEach(function(line){lines.push("- "+line);});
    }

    return lines.join("\n").trim();
  }

  async function buildImportPreview(){
    const status=document.getElementById("importStatus");
    const previewSection=document.getElementById("previewSection");
    const previewBox=document.getElementById("previewBox");
    const competition=document.getElementById("importMode").value;
    const worldId=document.getElementById("importWorld").value;
    const text=document.getElementById("importText").value;

    status.className="status";
    status.textContent="Analisi in corso…";

    const parsed=parseCompetitionImport(text,competition);

    if(!parsed.matches.length){
      status.className="status error";
      status.textContent="Nessuna partita riconosciuta.";
      previewSection.hidden=true;
      return null;
    }

    try{
      let context,validation;

      if(competition==="league"){
        context=await loadLeagueContext(worldId);
        applyOfficialMatchdays(parsed,context,competition,worldId);
        validation=validateLeagueMatches(parsed,context);
      }else{
        context=await loadCompetitionContext(competition,worldId);
        await ensureSingleLeagueCompetitionParticipants(parsed,context);
        await ensureOpenSmfaParticipants(parsed,context,competition);
        applyOfficialMatchdays(parsed,context,competition,worldId);
        validation=validateCompetitionMatches(parsed,context);
      }

      previewSection.hidden=false;
      previewBox.textContent=formatPreview(parsed,validation);

      if(validation.errors.length || parsed.rejected.length){
        status.className="status error";
        status.textContent=validation.valid.length+" valide · "+validation.errors.length+" errori · "+parsed.rejected.length+" righe non riconosciute";
      }else{
        status.className="status success";
        status.textContent=validation.valid.length+" partite riconosciute.";
      }

      return {parsed:parsed,context:context,validation:validation};
    }catch(error){
      status.className="status error";
      status.textContent=error.message || "Errore database.";
      previewSection.hidden=true;
      return null;
    }
  }

  function matchIdentity(row){
    return [
      row.competition_id,
      row.match_date,
      row.home_team_id || "N" + (row.home_nation_id || ""),
      row.away_team_id || "N" + (row.away_nation_id || "")
    ].join("|");
  }

  async function importCompetitionMatches(){
    const status=document.getElementById("importStatus");
    const result=await buildImportPreview();
    if(!result) return;

    if(result.validation.errors.length || result.parsed.rejected.length){
      status.className="status error";
      status.textContent="Correggi gli errori prima di importare.";
      return;
    }

    const rows=result.validation.valid.map(function(match){
      const row={
        game_world_id:match.game_world_id,
        season_id:match.season_id,
        competition_id:match.competition_id,
        home_team_id:match.home_team_id || null,
        away_team_id:match.away_team_id || null,
        home_nation_id:match.home_nation_id || null,
        away_nation_id:match.away_nation_id || null,
        match_date:match.match_date,
        round_name:match.round_name,
        stage_name:match.stage_name,
        group_name:match.group_name,
        match_time:match.match_time,
        match_status:match.match_status,
        home_score:match.home_score,
        away_score:match.away_score,
        decided_on_penalties:match.decided_on_penalties,
        home_penalties:match.home_penalties,
        away_penalties:match.away_penalties,
        penalty_winner_team_id:null,
        penalty_winner_nation_id:null
      };

      if(match.decided_on_penalties){
        if(match.national){
          const winner=result.context.participant_map.get(normalizeParticipantKey(match.penalty_winner_name));
          row.penalty_winner_nation_id=winner ? winner.nation_id : null;
        }else{
          const source=result.context.team_map || result.context.participant_map;
          const winner=source.get(normalizeParticipantKey(match.penalty_winner_name));
          row.penalty_winner_team_id=winner ? winner.team_id : null;
        }
      }
      return row;
    });

    status.className="status";
    status.textContent="Controllo duplicati…";

    try{
      const competitionIds=Array.from(new Set(rows.map(function(row){return row.competition_id;})));
      const existingResult=await state.client
        .from("gw_matches")
        .select("match_id,competition_id,match_date,home_team_id,away_team_id,home_nation_id,away_nation_id,match_status")
        .eq("game_world_id",result.context.world_id)
        .eq("season_id",result.context.season_id)
        .in("competition_id",competitionIds);

      if(existingResult.error) throw existingResult.error;

      const existingGroups=new Map();
      (existingResult.data || []).forEach(function(row){
        const key=matchIdentity(row);
        if(!existingGroups.has(key)) existingGroups.set(key,[]);
        existingGroups.get(key).push(row);
      });

      const existingMap=new Map();
      existingGroups.forEach(function(group,key){
        existingMap.set(key,group.find(function(row){return row.match_status === "played";}) || group[0]);
      });

      const inserts=[];
      const updates=[];
      let protectedResults=0;
      let removedDuplicates=0;

      rows.forEach(function(row){
        const existing=existingMap.get(matchIdentity(row));

        if(!existing){
          inserts.push(row);
          return;
        }

        if(existing.match_status === "played" && row.match_status === "scheduled"){
          protectedResults += 1;
          return;
        }

        updates.push({
          match_id:existing.match_id,
          payload:row
        });
      });

      if(inserts.length){
        const insertResult=await state.client
          .from("gw_matches")
          .insert(inserts);

        if(insertResult.error) throw insertResult.error;
      }

      if(updates.length){
        const updateResults=await Promise.all(
          updates.map(function(item){
            return state.client
              .from("gw_matches")
              .update(item.payload)
              .eq("match_id",item.match_id);
          })
        );

        const failedUpdate=updateResults.find(function(result){
          return result.error;
        });

        if(failedUpdate) throw failedUpdate.error;
      }

      // BUILD 1: after every import, collapse any pre-existing duplicate rows.
      // A played result always wins over its scheduled copy.
      const importedKeys=new Set(rows.map(matchIdentity));
      const refreshedResult=await state.client
        .from("gw_matches")
        .select("match_id,competition_id,match_date,home_team_id,away_team_id,home_nation_id,away_nation_id,match_status")
        .eq("game_world_id",result.context.world_id)
        .eq("season_id",result.context.season_id)
        .in("competition_id",competitionIds);

      if(refreshedResult.error) throw refreshedResult.error;

      const refreshedGroups=new Map();
      (refreshedResult.data || []).forEach(function(row){
        const key=matchIdentity(row);
        if(!importedKeys.has(key)) return;
        if(!refreshedGroups.has(key)) refreshedGroups.set(key,[]);
        refreshedGroups.get(key).push(row);
      });

      const duplicateIds=[];
      refreshedGroups.forEach(function(group){
        if(group.length < 2) return;
        const keeper=group.find(function(row){return row.match_status === "played";}) || group[0];
        group.forEach(function(row){
          if(String(row.match_id) !== String(keeper.match_id)) duplicateIds.push(row.match_id);
        });
      });

      if(duplicateIds.length){
        const deleteResult=await state.client
          .from("gw_matches")
          .delete()
          .in("match_id",duplicateIds);
        if(deleteResult.error) throw deleteResult.error;
        removedDuplicates=duplicateIds.length;
      }

      status.className="status success";
      status.textContent=inserts.length+" nuove · "+updates.length+" aggiornate · "+protectedResults+" risultati già protetti · "+removedDuplicates+" doppioni rimossi.";
      document.getElementById("importText").value="";
    }catch(error){
      status.className="status error";
      status.textContent=error && error.message ? error.message : "Importazione non riuscita.";
    }
  }

  function importDeletionCompetitionMatchesName(competitionName,selectedMode){
    const name=String(competitionName||"").trim();
    const mode=String(selectedMode||"").trim();
    if(!name||!mode)return false;
    if(mode==="league")return false;
    return name===mode || name.endsWith(" · "+mode);
  }

  async function resolveImportDeletionCompetitionIds(worldId,selectedMode){
    const result=await state.client
      .from("gw_competitions")
      .select("competition_id,competition_name,competition_type,country_id,division_id")
      .eq("game_world_id",worldId);

    if(result.error)throw result.error;

    const competitions=(result.data||[]).filter(function(row){
      if(selectedMode==="league")return row.competition_type==="league";
      return importDeletionCompetitionMatchesName(row.competition_name,selectedMode);
    });

    return competitions;
  }

  async function loadImportDeletionData(){
    const worldSelect=document.getElementById("importWorld");
    const seasonInput=document.getElementById("importSeason");
    const competitionSelect=document.getElementById("importMode");
    if(!worldSelect||!seasonInput||!competitionSelect)return null;

    const worldId=worldSelect.value;
    const seasonId=seasonInput.value;
    const selectedMode=competitionSelect.value;
    if(!worldId||!seasonId||!selectedMode)return null;

    const competitions=await resolveImportDeletionCompetitionIds(worldId,selectedMode);
    const competitionIds=competitions.map(function(row){return row.competition_id;});

    if(!competitionIds.length){
      return {world_id:worldId,season_id:seasonId,selected_mode:selectedMode,competitions:[],rows:[]};
    }

    const matchesResult=await state.client
      .from("gw_matches")
      .select("match_id,competition_id,match_date,match_time,round_name,stage_name,group_name,match_status,home_score,away_score")
      .eq("game_world_id",worldId)
      .eq("season_id",seasonId)
      .in("competition_id",competitionIds)
      .order("match_date",{ascending:true});

    if(matchesResult.error)throw matchesResult.error;

    return {
      world_id:worldId,
      season_id:seasonId,
      selected_mode:selectedMode,
      competitions:competitions,
      rows:matchesResult.data||[]
    };
  }

  function importDeletionDayLabel(date,rows){
    const dayRows=(rows||[]).filter(function(row){return row.match_date===date;});
    const roundNames=Array.from(new Set(dayRows.map(function(row){
      return row.round_name||row.group_name||row.stage_name||"";
    }).filter(Boolean)));
    const suffix=roundNames.length===1?" · "+roundNames[0]:"";
    return formatDate(date)+suffix+" · "+dayRows.length+" partite";
  }

  async function refreshImportDeletionControls(){
    const daySelect=document.getElementById("importDeleteDay");
    const help=document.getElementById("importDeleteDayHelp");
    const status=document.getElementById("importDeleteStatus");
    const previewSection=document.getElementById("deletePreviewSection");
    if(previewSection)previewSection.hidden=true;
    if(!daySelect)return;

    daySelect.innerHTML='<option value="">Caricamento dati…</option>';
    if(help)help.textContent="";

    try{
      const data=await loadImportDeletionData();
      if(!data){
        daySelect.innerHTML='<option value="">Seleziona prima la configurazione</option>';
        return;
      }

      const dates=Array.from(new Set(data.rows.map(function(row){return row.match_date;}).filter(Boolean)))
        .sort(function(a,b){return b.localeCompare(a);});

      if(!dates.length){
        daySelect.innerHTML='<option value="">Nessun dato partita caricato</option>';
        if(help)help.textContent="0 partite presenti per la competizione selezionata.";
      }else{
        daySelect.innerHTML=dates.map(function(date){
          return '<option value="'+esc(date)+'">'+esc(importDeletionDayLabel(date,data.rows))+'</option>';
        }).join("");
        if(help)help.textContent=data.rows.length+" partite caricate · "+dates.length+" date disponibili";
      }
      if(status){status.className="status";status.textContent="";}
    }catch(error){
      daySelect.innerHTML='<option value="">Errore caricamento dati</option>';
      if(status){status.className="status error";status.textContent=error&&error.message?error.message:"Impossibile leggere i dati caricati.";}
    }
  }

  function importDeletionPreviewText(data,mode,selectedDate){
    const rows=mode==="day"
      ? data.rows.filter(function(row){return row.match_date===selectedDate;})
      : data.rows.slice();
    const dates=Array.from(new Set(rows.map(function(row){return row.match_date;}).filter(Boolean))).sort();
    const played=rows.filter(function(row){return row.match_status==="played";}).length;
    const scheduled=rows.filter(function(row){return row.match_status==="scheduled";}).length;
    const lines=[];

    lines.push("GAME WORLD: "+data.world_id);
    lines.push("COMPETIZIONE: "+data.selected_mode);
    lines.push("STAGIONE ID: "+data.season_id);
    lines.push("");
    if(mode==="day")lines.push("CANCELLAZIONE: SINGOLA GIORNATA · "+formatDate(selectedDate));
    else lines.push("CANCELLAZIONE: INTERA COMPETIZIONE CARICATA");
    lines.push("");
    lines.push("Partite da eliminare: "+rows.length);
    lines.push("Results: "+played);
    lines.push("Schedule: "+scheduled);
    lines.push("Date coinvolte: "+dates.length);
    if(dates.length){
      lines.push("");
      lines.push("DATE");
      dates.forEach(function(date){
        lines.push("- "+importDeletionDayLabel(date,rows));
      });
    }
    lines.push("");
    lines.push("La struttura della competizione NON verrà eliminata.");
    return {text:lines.join("\n"),rows:rows};
  }

  async function previewImportDeletion(){
    const status=document.getElementById("importDeleteStatus");
    const modeSelect=document.getElementById("importDeleteMode");
    const daySelect=document.getElementById("importDeleteDay");
    const previewSection=document.getElementById("deletePreviewSection");
    const previewBox=document.getElementById("deletePreviewBox");
    const confirmButton=document.getElementById("confirmDeleteImportButton");
    if(!modeSelect||!previewSection||!previewBox||!confirmButton)return;

    status.className="status";
    status.textContent="Controllo dati…";

    try{
      const data=await loadImportDeletionData();
      if(!data||!data.rows.length)throw new Error("Non risultano dati partita da eliminare per questa competizione.");
      const mode=modeSelect.value;
      const selectedDate=daySelect?daySelect.value:"";
      if(mode==="day"&&!selectedDate)throw new Error("Seleziona la giornata da eliminare.");

      const preview=importDeletionPreviewText(data,mode,selectedDate);
      if(!preview.rows.length)throw new Error("La giornata selezionata non contiene partite.");

      previewBox.textContent=preview.text;
      previewSection.hidden=false;
      confirmButton.dataset.matchIds=preview.rows.map(function(row){return row.match_id;}).join(",");
      confirmButton.dataset.deleteMode=mode;
      confirmButton.dataset.deleteDate=selectedDate||"";
      confirmButton.dataset.deleteCompetition=data.selected_mode;
      status.className="status success";
      status.textContent=preview.rows.length+" record pronti per la cancellazione.";
      previewSection.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(error){
      previewSection.hidden=true;
      status.className="status error";
      status.textContent=error&&error.message?error.message:"Anteprima cancellazione non disponibile.";
    }
  }

  async function deleteImportedMatchIds(ids){
    const chunkSize=200;
    for(let i=0;i<ids.length;i+=chunkSize){
      const chunk=ids.slice(i,i+chunkSize);
      const result=await state.client.from("gw_matches").delete().in("match_id",chunk);
      if(result.error)throw result.error;
    }
  }

  async function confirmImportDeletion(){
    const button=document.getElementById("confirmDeleteImportButton");
    const status=document.getElementById("importDeleteStatus");
    const previewSection=document.getElementById("deletePreviewSection");
    if(!button||!status)return;

    const ids=String(button.dataset.matchIds||"").split(",").map(function(value){return value.trim();}).filter(Boolean);
    const mode=button.dataset.deleteMode||"day";
    const selectedDate=button.dataset.deleteDate||"";
    const competition=button.dataset.deleteCompetition||"competizione";
    if(!ids.length)return;

    const firstMessage=mode==="day"
      ? "Eliminare definitivamente "+ids.length+" partite del "+formatDate(selectedDate)+"?"
      : "Eliminare definitivamente TUTTI i "+ids.length+" dati partita caricati per "+competition+"?";
    if(!window.confirm(firstMessage))return;

    if(mode==="competition"){
      if(!window.confirm("Seconda conferma: l'intera competizione verrà svuotata di Results e Schedule per la stagione attiva. Procedere?"))return;
    }

    button.disabled=true;
    status.className="status";
    status.textContent="Cancellazione su Supabase in corso…";
    try{
      await deleteImportedMatchIds(ids);
      status.className="status success";
      status.textContent=ids.length+" record eliminati correttamente. Ora puoi reimportare i dati.";
      if(previewSection)previewSection.hidden=true;
      button.dataset.matchIds="";
      await refreshImportDeletionControls();
    }catch(error){
      status.className="status error";
      status.textContent=error&&error.message?error.message:"Cancellazione non riuscita.";
    }finally{
      button.disabled=false;
    }
  }

  function bindImport(){
    const worldSelect = document.getElementById("importWorld");
    const seasonInput = document.getElementById("importSeason");
    const seasonDisplay = document.getElementById("importSeasonDisplay");
    const competitionSelect = document.getElementById("importMode");
    const competitionHelp = document.getElementById("competitionHelp");
    const previewButton = document.getElementById("previewButton");
    const importButton = document.getElementById("importButton");
    const status = document.getElementById("importStatus");
    const deleteModeSelect = document.getElementById("importDeleteMode");
    const deleteDayField = document.getElementById("importDeleteDayField");
    const previewDeleteButton = document.getElementById("previewDeleteButton");
    const confirmDeleteButton = document.getElementById("confirmDeleteImportButton");

    async function refreshImportConfiguration(){
      const worldId = worldSelect ? worldSelect.value : "GW004";
      const cfg = getWorldConfig(worldId);

      if(seasonDisplay) seasonDisplay.textContent = "Caricamento stagione…";
      if(seasonInput) seasonInput.value = "";
      if(previewButton) previewButton.disabled = true;
      if(importButton) importButton.disabled = true;

      if(competitionSelect){
        competitionSelect.innerHTML = configuredCompetitionOptions(worldId);
      }

      if(competitionHelp){
        const count = competitionSelect
          ? competitionSelect.querySelectorAll("option").length
          : 0;
        competitionHelp.textContent = count + " modalità disponibili per " + worldId;
      }

      try{
        const season = await loadActiveSeasonForImport(worldId);
        if(seasonInput) seasonInput.value = season.season_id;
        if(seasonDisplay){
          seasonDisplay.innerHTML = "<strong>Season " + esc(season.season_number) + "</strong><span>Selezionata automaticamente</span>";
        }
        if(status){
          status.className = "status";
          status.textContent = "";
        }
        if(previewButton) previewButton.disabled = false;
        if(importButton) importButton.disabled = false;
        await refreshImportDeletionControls();
      }catch(error){
        if(seasonDisplay) seasonDisplay.textContent = "Nessuna stagione attiva";
        if(status){
          status.className = "status error";
          status.textContent = error && error.message ? error.message : "Stagione attiva non disponibile.";
        }
      }
    }

    if(worldSelect){
      worldSelect.addEventListener("change",function(){ refreshImportConfiguration(); });
    }
    if(competitionSelect){
      competitionSelect.addEventListener("change",function(){ refreshImportDeletionControls(); });
    }
    if(deleteModeSelect){
      deleteModeSelect.addEventListener("change",function(){
        if(deleteDayField)deleteDayField.hidden=deleteModeSelect.value!=="day";
        const deletePreview=document.getElementById("deletePreviewSection");
        if(deletePreview)deletePreview.hidden=true;
      });
    }

    refreshImportConfiguration();

    previewButton.addEventListener("click",buildImportPreview);
    importButton.addEventListener("click",importCompetitionMatches);
    if(previewDeleteButton)previewDeleteButton.addEventListener("click",previewImportDeletion);
    if(confirmDeleteButton)confirmDeleteButton.addEventListener("click",confirmImportDeletion);
  }

  function profilePage(){
    return `<section class="page"><div class="hero"><img src="assets/manager-mng001.jpeg"><div><h1>${esc(state.user.full_name)}</h1><p>${esc(state.user.manager_id)}</p><p>${esc(state.user.role)}</p></div></div></section>`;
  }

  document.addEventListener("click", function(event){
    if(event.target && event.target.id === "homeGw004"){
      state.page = "worlds";
      state.selectedWorld = "GW004";
      state.worldTab = "overview";
      renderShell();
    }
  });

  window.addEventListener("error", function(event){
    boot.hidden = true;
    app.hidden = false;
    app.innerHTML = `<main class="fatal"><h1>Errore applicazione</h1><p>${esc(event.message || "Errore sconosciuto")}</p></main>`;
  });

  async function start(){
    initializeClient();
    const restored = await loadProfileFromSession();
    render();
  }

  start();
})();


document.addEventListener("click",function(event){
  if(event.target && event.target.closest && event.target.closest("#openGw004FromHome")){
    state.selectedWorld = "GW004";
    state.page = "worlds";
    state.worldSection = "competitions";
    renderShell();
  }
});
