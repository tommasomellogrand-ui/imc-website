
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
       "National Cup": {db:"National Cup",trophy:"assets/trophies/national-cup.png",type:"knockout",category:"domestic",tabs:["results","schedule"]},
      "League Cup": {db:"League Cup",trophy:"assets/trophies/league-cup.png",type:"knockout",category:"domestic",tabs:["results","schedule"]},
      "Charity Shield": {db:"Charity Shield",trophy:"assets/trophies/charity-shield.png",type:"single_match",category:"domestic",tabs:["results","schedule"]},
      "IMC Champions": {calendar:"smfaChampionsGroups",db:"IMC Champions",trophy:"assets/trophies/imc-champions.png",type:"group_and_knockout",category:"international",tabs:["results","schedule"]},
      "IMC Shield": {calendar:"smfaShieldGroups",db:"IMC Shield",trophy:"assets/trophies/imc-shield.png",type:"group_and_knockout",category:"international",tabs:["results","schedule"]},
      "IMC Super Cup": {db:"IMC Super Cup",trophy:"assets/trophies/imc-super-cup.png",type:"single_match",category:"international",tabs:["results","schedule"]},
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
    clubProfileView: "profile",
    selectedPlayer: null,
    playerCodexFilter: "all",
    playerCodexSearch: "",
    playerCodexAdvancedOpen: false,
    playerCodexSort: "rating_desc",
    playerCodexClub: "all",
    playerCodexPosition: "all",
    playerCodexRatingMin: "",
    playerCodexRatingMax: "",
    playerCodexAgeMin: "",
    playerCodexAgeMax: "",
    playerCodexValueMin: "",
    playerCodexValueMax: "",
    playerCodexReturn: null,
    transferDirectionFilter: "all",
    transferSearch: "",
    transferClubFilter: "all",
    selectedNation: null,
    selectedManager: null,
    managerProfileTab: "stats",
    entityProfileTab: "stats",
    divisionTab: "results",
    divisionStandingSeason: "current",
    competitionTab: "results",
    worldSection: "competitions",
    entityImcFilter: false,
    competitionImcFilter: false,
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
    adminAnalyticsSummary: null,
    adminAnalyticsLoading: false,
    adminAnalyticsError: "",
    trophyRoomSeasonId: null,
    trophyRoomData: null,
    trophyRoomView: "review",
    autoFinalHonoursV12: [],
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
    globalClubsById: {},
    globalClubsByAliasKey: {},
    globalClubAliasesById: {},
    globalClubByWorldTeam: {},
    globalClubByUniqueTeamId: {},
    gw004: (window.IMC_DATA && window.IMC_DATA.gw004) || {}
  };


  // Build 8 · Client-side routing. One physical index.html, shareable logical URLs.
  const NEXUS_ROUTE_BASE = "/nexus";
  const NEXUS_BUILD = "53";
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
    state.clubProfileView="profile";
    state.selectedPlayer=null;
    state.playerCodexReturn=null;
    state.transferDirectionFilter="all";
    state.transferSearch="";
    state.transferClubFilter="all";
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
        "archive-season":"archive-season",
        "analytics":"analytics"
      };
      return NEXUS_ROUTE_BASE+"/admin"+(adminMap[state.adminPage]?"/"+adminMap[state.adminPage]:"");
    }

    if(state.selectedWorld){
      const base=NEXUS_ROUTE_BASE+"/gw/"+routeEncode(state.selectedWorld);
      if(state.page==="schedule")return base+"/schedule";
      if(state.page==="transfers" && state.selectedWorld==="GW001")return base+"/transfers";
      if(state.page==="h2h")return base+"/h2h";
      if(state.page==="profile")return base+"/profile";
      if(state.page==="worlds"){
        if(state.worldSection==="player-codex" && state.selectedWorld==="GW001"){
          if(state.selectedPlayer)return base+"/player-codex/player/"+routeEncode(state.selectedPlayer.id)+"/"+routeNameSlug(state.selectedPlayer.name);
          return base+"/player-codex";
        }
        if(state.worldSection==="clubs"){
          if(state.selectedClub){
            const clubBase=base+"/club/"+routeEncode(state.selectedClub.id)+"/"+routeNameSlug(state.selectedClub.name);
            return state.clubProfileView==="roster"?clubBase+"/team-roster":clubBase;
          }
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
    if(state.page==="transfers")return NEXUS_ROUTE_BASE+"/gw/"+routeEncode(PLAYER_CODEX_WORLD_ID_B44)+"/transfers";
    if(state.page==="h2h")return NEXUS_ROUTE_BASE+"/club-house/h2h";
    if(state.page==="profile")return NEXUS_ROUTE_BASE+"/club-house/profile";
    if(state.page==="trophies")return NEXUS_ROUTE_BASE+"/club-house/trophy-room";
    if(state.page==="worlds")return NEXUS_ROUTE_BASE+"/game-worlds";
    return NEXUS_ROUTE_BASE+"/club-house";
  }

  function syncRouteFromState(){
    // BUILD 8: routing URL disattivato.
    // Tutta Nexus vive sempre su /nexus/index.html.
    return;
  }

  function applyRouteFromLocation(){
    // BUILD 8: nessuna route profonda. Manteniamo lo stato SPA corrente.
    return false;
  }
  const WORLD_NAME_OVERRIDES={GW010:"Sensible Soccer Academy"};

function getWorldMeta(worldId){
    const found=state.worlds.find(function(world){ return world.id === worldId; }) || null;
    if(found&&WORLD_NAME_OVERRIDES[worldId])return Object.assign({},found,{name:WORLD_NAME_OVERRIDES[worldId]});
    return found;
  }

  function worldTypeLabel(type){
    if(type === "single_league") return "Single League";
    if(type === "multi_league") return "Multi League";
    return "Tipo non configurato";
  }

  function selectedWorldName(){
    const meta = getWorldMeta(state.selectedWorld);
    return meta ? meta.name : (WORLD_NAME_OVERRIDES[state.selectedWorld] || (state.selectedWorld === "GW004" ? "World League" : "Game World"));
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
      const worldId=String(row.game_world_id||"");
      const displayName=worldId==="GW010" ? "Sensible Soccer Academy" : row.name;
      return {id:worldId,name:displayName,type:row.game_world_type || "unknown"};
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
      // BUILD 45 · Global Nexus club naming source.
      // Load the complete SM master + GW participation map in deterministic pages.
      async function loadAllGlobalClubRows(table,select,orders){
        const rows=[];
        const pageSize=1000;
        let offset=0;

        while(true){
          let query=state.client.from(table).select(select);
          (orders||[]).forEach(function(order){
            query=query.order(order.column,{ascending:order.ascending!==false});
          });
          const result=await query.range(offset,offset+pageSize-1);
          if(result.error)throw result.error;
          const page=result.data||[];
          rows.push.apply(rows,page);
          if(page.length<pageSize)break;
          offset+=pageSize;
        }
        return rows;
      }

      const loaded=await Promise.all([
        loadAllGlobalClubRows(
          "sm_clubs_master",
          "sm_club_id,club_name,alias,image_filename,image_url",
          [{column:"sm_club_id",ascending:true}]
        ),
        loadAllGlobalClubRows(
          "gw_teams",
          "team_id,game_world_id,sm_club_id,team_name,display_name",
          [{column:"game_world_id",ascending:true},{column:"team_id",ascending:true}]
        )
      ]);

      const masterRows=loaded[0];
      const participationRows=loaded[1];
      const clubsById={};
      const byAliasKey={};
      const aliasesById={};
      const clubByWorldTeam={};
      const clubByUniqueTeamId={};
      const conflictingTeamIds=new Set();

      (masterRows||[]).forEach(function(row){
        const canonicalName=String(row.club_name||"").trim();
        const nexusAlias=String(row.alias||"").trim();
        const club={
          club_id:row.sm_club_id,
          sm_club_id:row.sm_club_id,
          club_key:canonicalName,
          canonical_name:canonicalName,
          // Fixed Nexus rule: Alias first, master Soccer Manager club name as fallback.
          display_name:nexusAlias||canonicalName,
          alias:nexusAlias,
          logo_file:String(row.image_filename||"").trim(),
          image_url:String(row.image_url||"").trim()
        };

        clubsById[String(row.sm_club_id)]=club;
        aliasesById[String(row.sm_club_id)]=[];
        [canonicalName,nexusAlias].filter(Boolean).forEach(function(value){
          byAliasKey[normalizeParticipantKey(value)]=club;
        });
      });

      (participationRows||[]).forEach(function(team){
        const club=clubsById[String(team.sm_club_id||"")];
        if(!club)return;

        const worldId=String(team.game_world_id||"");
        const teamId=String(team.team_id||"");
        if(worldId&&teamId){
          if(!clubByWorldTeam[worldId])clubByWorldTeam[worldId]={};
          clubByWorldTeam[worldId][teamId]=club;
        }

        // team_id alone is accepted only if it is globally unambiguous.
        if(teamId&&!conflictingTeamIds.has(teamId)){
          const existing=clubByUniqueTeamId[teamId];
          if(existing&&String(existing.sm_club_id)!==String(club.sm_club_id)){
            delete clubByUniqueTeamId[teamId];
            conflictingTeamIds.add(teamId);
          }else if(!existing){
            clubByUniqueTeamId[teamId]=club;
          }
        }

        [team.team_name,team.display_name].filter(Boolean).forEach(function(value){
          const key=normalizeParticipantKey(value);
          if(key)byAliasKey[key]=club;
          if(value&&!aliasesById[String(club.club_id)].includes(value)){
            aliasesById[String(club.club_id)].push(value);
          }
        });
      });

      state.globalClubsById=clubsById;
      state.globalClubsByAliasKey=byAliasKey;
      state.globalClubAliasesById=aliasesById;
      state.globalClubByWorldTeam=clubByWorldTeam;
      state.globalClubByUniqueTeamId=clubByUniqueTeamId;
    }catch(error){
      console.warn("SM Club Registry non disponibile:",error&&error.message?error.message:error);
      state.globalClubsById={};
      state.globalClubsByAliasKey={};
      state.globalClubAliasesById={};
      state.globalClubByWorldTeam={};
      state.globalClubByUniqueTeamId={};
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

    const resolvedWorld=String(worldId||team.game_world_id||state.selectedWorld||"");
    const resolvedTeam=String(team.team_id||"");

    // Primary key inside a Game World: game_world_id + team_id.
    const worldMap=resolvedWorld&&state.globalClubByWorldTeam
      ? state.globalClubByWorldTeam[resolvedWorld]
      : null;
    const byWorldTeam=worldMap&&resolvedTeam?worldMap[resolvedTeam]:null;
    if(byWorldTeam)return byWorldTeam;

    // Permanent global club identity when exposed by the query.
    const bySmClubId=state.globalClubsById&&state.globalClubsById[String(team.sm_club_id||"")];
    if(bySmClubId)return bySmClubId;

    const byUniqueTeamId=state.globalClubByUniqueTeamId&&resolvedTeam
      ? state.globalClubByUniqueTeamId[resolvedTeam]
      : null;
    if(byUniqueTeamId)return byUniqueTeamId;

    // Legacy strings are matching fallbacks only, never the preferred display source.
    const candidates=[
      teamAliasFor(team.team_id,resolvedWorld),
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
      addParticipantMapEntry(map,club.display_name,teamData);
    }

    globalClubAliasNamesForName(club.display_name).forEach(function(alias){
      addParticipantMapEntry(map,alias,teamData);
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

  function nexusVisitorId(){
    const key="imc_nexus_visitor_id";
    let value="";
    try{value=localStorage.getItem(key)||"";}catch(_){value="";}
    if(value&&value.length>=8)return value;
    if(window.crypto&&typeof window.crypto.randomUUID==="function"){
      value=window.crypto.randomUUID();
    }else{
      value="nx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
    }
    try{localStorage.setItem(key,value);}catch(_){/* localStorage non disponibile */}
    return value;
  }

  async function registerNexusAccess(){
    if(!state.client||!state.user)return;
    const sessionKey="imc_nexus_access_registered";
    try{
      if(sessionStorage.getItem(sessionKey)==="1")return;
    }catch(_){/* sessionStorage non disponibile: registriamo comunque */}

    const visitorId=nexusVisitorId();
    if(!visitorId)return;

    try{
      const result=await state.client
        .from("nexus_visits")
        .insert({
          visitor_id:visitorId,
          page_key:"nexus_access",
          game_world_id:null
        });
      if(!result.error){
        try{sessionStorage.setItem(sessionKey,"1");}catch(_){/* noop */}
      }
    }catch(_){
      // Analytics non deve mai bloccare l'accesso a Nexus.
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
      await registerNexusAccess();
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
      await registerNexusAccess();
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

  
  const SOCCER_MANAGER_WORLD_IDS = {
    GW001:"468172",
    GW002:"467635",
    GW003:"467488",
    GW004:"29871",
    GW005:"468194",
    GW006:"468156",
    GW007:"467744",
    GW008:"668",
    GW009:"468332"
  };

  function soccerManagerWorldId(worldId){
    return SOCCER_MANAGER_WORLD_IDS[String(worldId||"")]||"—";
  }

  function nexusNavIcon(name){
    const common='viewBox="0 0 24 24" aria-hidden="true"';
    const icons={
      codex:`<svg ${common}><path d="M5 4.5h5.2c1.1 0 1.8.3 1.8 1.2v14c0-.9-.7-1.3-1.8-1.3H5V4.5Z"/><path d="M19 4.5h-5.2c-1.1 0-1.8.3-1.8 1.2v14c0-.9.7-1.3 1.8-1.3H19V4.5Z"/><path d="M7.5 8h2M14.5 8h2M7.5 11h2M14.5 11h2"/></svg>`,
      clubs:`<svg ${common}><path d="M12 2.7 20 5.8v5.7c0 5-3.3 8.1-8 9.8-4.7-1.7-8-4.8-8-9.8V5.8L12 2.7Z"/><circle cx="12" cy="11" r="3.2"/><path d="m9.3 9.2-2.2-.8M14.7 9.2l2.2-.8M10 13.5l-1.3 1.9M14 13.5l1.3 1.9"/></svg>`,
      national:`<svg ${common}><path d="M5 21V3"/><path d="M5 4h11l-2 3 2 3H5"/></svg>`,
      managers:`<svg ${common}><circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 20c.7-4.1 3-6.2 6.5-6.2s5.8 2.1 6.5 6.2"/><path d="M9 3.8h6"/></svg>`,
      competitions:`<svg ${common}><path d="M8 4h8v4.5c0 3-1.7 5.2-4 6.2-2.3-1-4-3.2-4-6.2V4Z"/><path d="M8 6H4.5c0 3.3 1.6 5 4.1 5.3M16 6h3.5c0 3.3-1.6 5-4.1 5.3M12 14.7V18M8.5 21h7M10 18h4"/></svg>`,
      schedule:`<svg ${common}><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7 3v5M17 3v5M3.5 9.5h17"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></svg>`,
      stats:`<svg ${common}><path d="M4 20V11h3v9M10.5 20V7h3v13M17 20V3h3v17"/><path d="M2.5 20.5h19"/></svg>`,
      transfers:`<svg ${common}><path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/></svg>`,
      home:`<svg ${common}><path d="m3.5 11 8.5-7 8.5 7"/><path d="M5.5 10v10h13V10M9.5 20v-6h5v6"/></svg>`,
      h2h:`<svg ${common}><path d="m4 4 6.7 6.7M13.3 13.3 20 20M7 3l2 1-5 5-1-2 4-4ZM17 21l-2-1 5-5 1 2-4 4Z"/><path d="m20 4-6.7 6.7M10.7 13.3 4 20M17 3l-2 1 5 5 1-2-4-4ZM7 21l2-1-5-5-1 2 4 4Z"/></svg>`,
      trophy:`<svg ${common}><path d="M8 4h8v4.5c0 3-1.7 5.2-4 6.2-2.3-1-4-3.2-4-6.2V4Z"/><path d="M8 6H4.5c0 3.3 1.6 5 4.1 5.3M16 6h3.5c0 3.3-1.6 5-4.1 5.3M12 14.7V18M8.5 21h7M10 18h4"/><path d="m12 6 .7 1.4 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2L12 6Z"/></svg>`,
      person:`<svg ${common}><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4.4 3-6.5 6.5-6.5s5.8 2.1 6.5 6.5"/></svg>`,
      globe:`<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21"/></svg>`
    };
    return icons[name]||"";
  }

function goClubHouseHomeB44(){
    state.adminMode=false;
    state.adminPage="home";
    state.page="home";
    state.selectedWorld=null;
    state.worldSection="competitions";
    state.selectedDivision=null;
    state.selectedCompetition=null;
    state.selectedClub=null;
    state.clubProfileView="profile";
    state.selectedPlayer=null;
    state.playerCodexReturn=null;
    state.selectedNation=null;
    state.selectedManager=null;
    state.divisionTab="results";
    state.competitionTab="results";
    renderShell();
  }

function renderShell(fromRoute){
    syncRouteFromState(Boolean(fromRoute));
    document.title = "IMC Nexus · Build " + NEXUS_BUILD;
    app.innerHTML = `
      <div class="nx-shell nx-shell-b6">
        <div class="nx-overlay" id="nxOverlay" hidden></div>

        <aside class="nx-drawer" id="nxDrawer" aria-hidden="true">
          <div class="nx-drawer-head">
            <button class="nx-round-btn" id="closeDrawer">×</button>
            <strong>IMC NEXUS</strong>
            <span class="nx-drawer-spacer"></span>
          </div>

          <div class="nx-profile-switch">
            <div class="nx-manager-box">
              <span class="nx-mini-person">${nexusNavIcon("person")}</span>
              <div>
                <strong>${esc(state.user.full_name)}</strong>
                <span>IMC ID: ${esc(state.user.manager_id)}</span>
              </div>
            </div>

            <div class="nx-world-box">
              <span>${nexusNavIcon("globe")}</span>
              <div><strong>${state.selectedWorld ? selectedWorldName() : "Club House"}</strong></div>
            </div>
          </div>

          <div class="nx-world-list">
            <button class="nx-world-item" data-drawer-world="">
              <span>⌂</span><strong>Club House</strong><small>GLOBALE</small>
            </button>
            ${state.worlds.map(function(world){
              return `<button class="nx-world-item" data-drawer-world="${esc(world.id)}">
                <span>${esc(world.id)}</span>
                <strong>${esc(world.name)}<small class="nx-world-sm-id">SM ID ${esc(soccerManagerWorldId(world.id))}</small></strong>
              </button>`;
            }).join("")}
          </div>
        </aside>

        <header class="nx-sport-header">
          <div class="nx-sport-brand">
            <button class="nx-sport-logo-panel" id="openDrawer" aria-label="Apri Game Worlds">
              <img src="assets/imc-logo.png" alt="IMC">
            </button>
            <div class="nx-sport-title">
              <strong>IMC Nexus</strong>
              <small>${state.adminMode ? "ADMIN CONSOLE" : NEXUS_BUILD_LABEL}</small>
            </div>
          </div>

          <div class="nx-sport-actions">
            <button class="nx-sport-action nx-sport-home" id="openClubHouseHome" aria-label="Home">${nexusNavIcon("home")}</button>
            ${isAdminUser() ? `<button class="nx-sport-action nx-sport-admin" id="openAdminConsole" aria-label="Admin Console">🛠</button>` : ""}
            <button class="nx-sport-action nx-sport-logout" id="logoutButton" aria-label="Esci">↗</button>
          </div>
        </header>

        ${!state.adminMode ? `<section class="nx-sport-context">
          <div class="nx-sport-manager">
            <span class="nx-sport-person">${nexusNavIcon("person")}</span>
            <div class="nx-sport-manager-copy">
              <strong>${esc(state.user.full_name)}</strong>
              <span>IMC ID: ${esc(state.user.manager_id)}</span>
            </div>
            ${isAdminUser() ? '<em class="nx-sport-admin-badge">ADMIN</em>' : ''}
          </div>

          <button class="nx-sport-world" id="openDrawerWorld">
            <span class="nx-sport-globe">${nexusNavIcon("globe")}</span>
            <strong>${state.selectedWorld ? selectedWorldName() : "Club House"}</strong>
            <span class="nx-sport-chevron">⌄</span>
          </button>
        </section>` : ""}

        ${!state.adminMode && Boolean(state.selectedWorld) ? `
          <nav class="nx-world-nav nx-world-nav-b6 ${state.selectedWorld==="GW001"?"nx-world-nav-gw001-b44":""}">
            ${state.selectedWorld==="GW001"?`<button data-world-section="player-codex" class="${state.worldSection==="player-codex" ? "active" : ""}">
              <b>${nexusNavIcon("codex")}</b><span>PLAYER CODEX</span>
            </button>`:""}
            <button data-world-section="clubs" class="${state.worldSection==="clubs" ? "active" : ""}">
              <b>${nexusNavIcon("clubs")}</b><span>CLUBS</span>
            </button>
            <button data-world-section="national" class="${state.worldSection==="national" ? "active" : ""}">
              <b>${nexusNavIcon("national")}</b><span>NAZIONALI</span>
            </button>
            <button data-world-section="managers" class="${state.worldSection==="managers" ? "active" : ""}">
              <b>${nexusNavIcon("managers")}</b><span>MANAGERS</span>
            </button>
            <button data-world-section="competitions" class="${state.worldSection==="competitions" ? "active" : ""}">
              <b>${nexusNavIcon("competitions")}</b><span>COMPETITIONS</span>
            </button>
          </nav>
        ` : ""}

        <main id="pageRoot" class="nx-main"></main>

        ${!state.adminMode ? `<nav class="nx-bottom nx-bottom-b6" style="grid-template-columns:repeat(${state.selectedWorld===PLAYER_CODEX_WORLD_ID_B44?5:4},minmax(0,1fr)) !important">
          <button data-page="schedule" class="${state.page==="schedule"?"active":""}"><b>${nexusNavIcon("schedule")}</b><span>SCHEDULE</span></button>
          <button data-page="stats" class="${state.page==="stats"?"active":""}"><b>${nexusNavIcon("stats")}</b><span>STATS</span></button>
          ${state.selectedWorld===PLAYER_CODEX_WORLD_ID_B44?`<button data-page="transfers" class="${state.page==="transfers"?"active":""}"><b>${nexusNavIcon("transfers")}</b><span>TRANSFERS</span></button>`:""}
          <button data-page="h2h" class="${state.page==="h2h"?"active":""}"><b>${nexusNavIcon("h2h")}</b><span>H2H</span></button>
          <button data-page="trophies" class="${state.worldSection==="trophy-room"||state.page==="trophies"?"active":""}"><b>${nexusNavIcon("trophy")}</b><span>TROPHY ROOM</span></button>
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



    const directHomeButton = document.getElementById("openClubHouseHome");
    if(directHomeButton){
      directHomeButton.addEventListener("click",goClubHouseHomeB44);
    }

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
          state.selectedPlayer = null;
          state.playerCodexReturn = null;
          state.clubProfileView = "profile";
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
        state.clubProfileView = "profile";
        state.selectedPlayer = null;
        state.playerCodexReturn = null;
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
        }else if(nextPage === "transfers"){
          if(state.selectedWorld !== PLAYER_CODEX_WORLD_ID_B44)return;
          state.page = "transfers";
          state.selectedWorld = PLAYER_CODEX_WORLD_ID_B44;
          state.worldSection = "competitions";
          state.selectedDivision = null;
          state.selectedCompetition = null;
          state.selectedClub = null;
          state.clubProfileView = "profile";
          state.selectedPlayer = null;
          state.playerCodexReturn = null;
          state.selectedNation = null;
          state.selectedManager = null;
        }else if(nextPage === "home"){
          state.page = "home";
          state.selectedWorld = null;
          state.worldSection = "competitions";
          state.selectedDivision = null;
          state.selectedCompetition = null;
          state.selectedClub = null;
          state.clubProfileView = "profile";
          state.selectedPlayer = null;
          state.playerCodexReturn = null;
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

  function statsPage(){
    setTimeout(loadCareerStatsPage,0);
    const worldId=state.selectedWorld||null;
    return `<section class="nx-card nx-stats-page nx-manager-stats-v10">
      <div class="nx-page-title">
        <div>
          <small>${worldId?esc(worldId)+" · "+esc(selectedWorldName()):"CLUB HOUSE · CAREER"}</small>
          <h1>Stats</h1>
          <p>${worldId?"Performance del manager in questo Game World.":"Carriera IMC completa attraverso tutti i Game World."}</p>
        </div>
      </div>
      <div class="nx-global-filter-note">Manager: <strong>${esc(state.user.full_name)}</strong></div>
      <div id="careerStatsContent"><div class="nx-loading">Calcolo statistiche…</div></div>
    </section>`;
  }

  async function fetchManagerCareerData(managerId,worldId){
    let aq=state.client.from("gw_manager_assignments").select(`assignment_id,game_world_id,manager_id,team_id,nation_id,assignment_type,start_date,end_date,gw_teams(team_id,game_world_id,sm_club_id,team_name,display_name),imc_national_teams(nation_name)`).eq("manager_id",managerId).order("start_date",{ascending:true});
    if(worldId)aq=aq.eq("game_world_id",worldId);
    const ar=await aq;if(ar.error)throw ar.error;
    const assignments=ar.data||[];
    const select=`match_id,game_world_id,season_id,competition_id,match_date,match_status,home_score,away_score,home_team_id,away_team_id,home_nation_id,away_nation_id,competition:gw_competitions!gw_matches_competition_id_fkey(competition_id,competition_name),home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)`;
    async function side(a,column,value){
      let q=state.client.from("gw_matches").select(select).eq("game_world_id",a.game_world_id).eq(column,value);
      if(a.start_date)q=q.gte("match_date",a.start_date);if(a.end_date)q=q.lte("match_date",a.end_date);
      const r=await q;if(r.error)throw r.error;return r.data||[];
    }
    const req=[];assignments.forEach(function(a){
      if(a.team_id){req.push(side(a,"home_team_id",a.team_id),side(a,"away_team_id",a.team_id));}
      if(a.nation_id){req.push(side(a,"home_nation_id",a.nation_id),side(a,"away_nation_id",a.nation_id));}
    });
    const batches=req.length?await Promise.all(req):[];const byId=new Map();
    batches.flat().forEach(function(m){if(!byId.has(String(m.match_id)))byId.set(String(m.match_id),m);});
    let sq=state.client.from("gw_seasons").select("season_id,game_world_id,season_number,season_status,start_date,end_date");if(worldId)sq=sq.eq("game_world_id",worldId);
    const sr=await sq;if(sr.error)throw sr.error;

    const teamIds=Array.from(new Set(assignments.filter(function(a){return !!a.team_id;}).map(function(a){return a.team_id;})));
    let historicalStandings=[];
    if(teamIds.length){
      let hq=state.client.from("gw_season_final_standings")
        .select("standing_id,game_world_id,season_id,competition_id,division_name,final_position,team_id,team_name,played,won,drawn,lost,goals_for,goals_against,goal_difference,points,manager_id,manager_name,official_date")
        .in("team_id",teamIds);
      if(worldId)hq=hq.eq("game_world_id",worldId);
      const hr=await hq;if(hr.error)throw hr.error;historicalStandings=hr.data||[];
    }
    return {assignments:assignments,matches:Array.from(byId.values()),seasons:sr.data||[],historicalStandings:historicalStandings};
  }

  function managerPerspectiveForMatch(assignments,match){
    for(const a of assignments){
      if(a.game_world_id!==match.game_world_id)continue;
      if(a.start_date&&match.match_date<a.start_date)continue;if(a.end_date&&match.match_date>a.end_date)continue;
      if(a.team_id){if(String(match.home_team_id)===String(a.team_id))return {side:"home",assignment:a,type:"club"};if(String(match.away_team_id)===String(a.team_id))return {side:"away",assignment:a,type:"club"};}
      if(a.nation_id){if(String(match.home_nation_id)===String(a.nation_id))return {side:"home",assignment:a,type:"nation"};if(String(match.away_nation_id)===String(a.nation_id))return {side:"away",assignment:a,type:"nation"};}
    }
    return null;
  }

  function statsForCareerMatches(assignments,matches){return StatisticsEngine.summarize(matches,function(m){return managerPerspectiveForMatch(assignments,m);});}
  function ppm(stats){return stats.played?(stats.points/stats.played).toFixed(2):"0.00";}

  // BUILD 13 · Historical Season 1 stats fallback.
  // Real match-by-match always wins. Historical standings are used only for past
  // club seasons with no played matches in gw_matches. The midpoint rule applies
  // only to managers; clubs always receive the full historical season.
  const HISTORICAL_SEASON_WINDOWS_V13={
    "GW004|1":{start:"2026-01-30",end:"2026-06-24"}
  };

  function statsFromStandingV13(row){
    const st=StatisticsEngine.empty();
    st.played=Number(row&&row.played||0);st.won=Number(row&&row.won||0);st.drawn=Number(row&&row.drawn||0);st.lost=Number(row&&row.lost||0);
    st.gf=Number(row&&row.goals_for||0);st.ga=Number(row&&row.goals_against||0);st.gd=Number(row&&row.goal_difference);if(!Number.isFinite(st.gd))st.gd=st.gf-st.ga;
    st.points=Number(row&&row.points);if(!Number.isFinite(st.points))st.points=st.won*3+st.drawn;
    st.winRate=st.played?Math.round((st.won/st.played)*1000)/10:0;return st;
  }

  function mergeStatsV13(){
    const out=StatisticsEngine.empty();
    Array.from(arguments).filter(Boolean).forEach(function(st){out.played+=Number(st.played||0);out.won+=Number(st.won||0);out.drawn+=Number(st.drawn||0);out.lost+=Number(st.lost||0);out.gf+=Number(st.gf||0);out.ga+=Number(st.ga||0);out.points+=Number(st.points||0);});
    out.gd=out.gf-out.ga;out.winRate=out.played?Math.round((out.won/out.played)*1000)/10:0;return out;
  }

  function dateAddDaysV13(value,days){const d=new Date(String(value)+"T00:00:00Z");if(Number.isNaN(d.getTime()))return null;d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
  function seasonWindowV13(season){
    if(!season)return null;let start=season.start_date||null,end=season.end_date||null;
    const fallback=HISTORICAL_SEASON_WINDOWS_V13[String(season.game_world_id)+"|"+String(season.season_number)];
    if(!start&&fallback)start=fallback.start;if(!end&&fallback)end=fallback.end;if(!start||!end)return null;
    const a=new Date(start+"T00:00:00Z"),b=new Date(end+"T00:00:00Z");if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<a)return null;
    const diff=Math.round((b-a)/86400000),half=Math.ceil(diff/2);return {start:start,end:end,midpoint:dateAddDaysV13(start,half)};
  }

  function historicalManagerRowsV13(data){
    const assignments=data.assignments||[],matches=(data.matches||[]).filter(StatisticsEngine.isPlayed),seasons=data.seasons||[],rows=data.historicalStandings||[];
    const seasonMap=new Map(seasons.map(function(se){return [String(se.game_world_id)+"|"+String(se.season_id),se];}));const out=[],seen=new Set();
    rows.forEach(function(row){
      const season=seasonMap.get(String(row.game_world_id)+"|"+String(row.season_id));if(!season||String(season.season_status)!=="past")return;
      const hasReal=matches.some(function(m){return String(m.game_world_id)===String(row.game_world_id)&&String(m.season_id)===String(row.season_id)&&(String(m.home_team_id)===String(row.team_id)||String(m.away_team_id)===String(row.team_id));});if(hasReal)return;
      const certified=assignments.find(function(a){return row.manager_id&&String(a.manager_id)===String(row.manager_id)&&String(a.game_world_id)===String(row.game_world_id)&&a.team_id&&String(a.team_id)===String(row.team_id);});
      const win=seasonWindowV13(season);
      const assignment=certified||(win?assignments.filter(function(a){return String(a.game_world_id)===String(row.game_world_id)&&a.team_id&&String(a.team_id)===String(row.team_id)&&(!a.end_date||a.end_date>=win.start)&&a.start_date&&a.start_date<=win.midpoint;}).sort(function(a,b){return String(a.start_date).localeCompare(String(b.start_date));})[0]:null);
      if(!assignment)return;const key=[row.game_world_id,row.season_id,row.team_id].join("|");if(seen.has(key))return;seen.add(key);out.push({row:row,season:season,assignment:assignment,stats:statsFromStandingV13(row)});
    });return out;
  }
  function statSummaryGrid(s){return `<div class="nx-stat-grid nx-stats-kpi-grid">${statCard("G",s.played)}${statCard("V",s.won)}${statCard("N",s.drawn)}${statCard("P",s.lost)}${statCard("GF",s.gf)}${statCard("GS",s.ga)}${statCard("DR",formatSigned(s.gd))}${statCard("Win",s.winRate+"%")} ${statCard("PPM",ppm(s))}</div>`;}
  function assignmentLabelV10(a){return a.team_id?(a.gw_teams&&teamDisplayName(a.gw_teams,a.game_world_id)||"Club"):(a.imc_national_teams&&a.imc_national_teams.nation_name||"Nazionale");}
  function breakdownRowsV10(rows){if(!rows.length)return `<div class="nx-empty-box"><strong>Nessun dato disponibile</strong></div>`;return `<div class="nx-stats-breakdown">${rows.map(function(r){return `<article class="nx-stats-breakdown-row"><div><strong>${esc(r.title)}</strong><span>${esc(r.meta||"")}</span></div><div class="nx-stat-line"><span>G ${r.stats.played}</span><span>V ${r.stats.won}</span><span>N ${r.stats.drawn}</span><span>P ${r.stats.lost}</span><span>GF ${r.stats.gf}</span><span>GS ${r.stats.ga}</span><strong>Win ${r.stats.winRate}%</strong></div></article>`;}).join("")}</div>`;}

  function careerRecordsV10(assignments,matches){
    const rows=[];(matches||[]).filter(StatisticsEngine.isPlayed).forEach(function(m){const p=managerPerspectiveForMatch(assignments,m);if(!p)return;const home=p.side==="home";const gf=Number(home?m.home_score:m.away_score),ga=Number(home?m.away_score:m.home_score);rows.push({m:m,gf:gf,ga:ga,diff:gf-ga});});
    if(!rows.length)return `<div class="nx-empty-box"><strong>Nessun record disponibile</strong></div>`;
    const wins=rows.filter(x=>x.diff>0).sort((a,b)=>b.diff-a.diff||b.gf-a.gf),losses=rows.filter(x=>x.diff<0).sort((a,b)=>a.diff-b.diff||b.ga-a.ga),maxGF=rows.slice().sort((a,b)=>b.gf-a.gf)[0],maxGA=rows.slice().sort((a,b)=>b.ga-a.ga)[0];
    function score(x){return x?x.gf+" - "+x.ga:"—";}
    return `<div class="nx-record-grid">${recordCard("Vittoria più larga",score(wins[0]))}${recordCard("Sconfitta più larga",score(losses[0]))}${recordCard("Più gol segnati",maxGF.gf)}${recordCard("Più gol subiti",maxGA.ga)}</div>`;
  }

  function renderCareerStatsV10(data,worldId){
    const assignments=data.assignments||[],matches=(data.matches||[]).filter(StatisticsEngine.isPlayed),seasons=data.seasons||[];
    const historic=historicalManagerRowsV13(data);
    const realTotal=statsForCareerMatches(assignments,matches),historicTotal=historic.reduce(function(acc,h){return mergeStatsV13(acc,h.stats);},StatisticsEngine.empty()),total=mergeStatsV13(realTotal,historicTotal);

    const clubRows=assignments.filter(a=>a.team_id).map(function(a){
      const ms=matches.filter(m=>managerPerspectiveForMatch([a],m));const hs=historic.filter(function(h){return String(h.assignment.assignment_id)===String(a.assignment_id);}).reduce(function(acc,h){return mergeStatsV13(acc,h.stats);},StatisticsEngine.empty());
      return {title:assignmentLabelV10(a),meta:(worldId?"":a.game_world_id+" · ")+(a.start_date?formatDate(a.start_date):"?")+" → "+(a.end_date?formatDate(a.end_date):"oggi"),stats:mergeStatsV13(statsForCareerMatches([a],ms),hs)};
    });
    const nationRows=assignments.filter(a=>a.nation_id).map(function(a){const ms=matches.filter(m=>managerPerspectiveForMatch([a],m));return {title:assignmentLabelV10(a),meta:(worldId?"":a.game_world_id+" · ")+(a.start_date?formatDate(a.start_date):"?")+" → "+(a.end_date?formatDate(a.end_date):"oggi"),stats:statsForCareerMatches([a],ms)};});

    const compStats=new Map();matches.forEach(function(m){const n=m.competition&&m.competition.competition_name?competitionVisualLabel(getCompetitionDisplayName(m.competition.competition_name)):"Competizione";const one=statsForCareerMatches(assignments,[m]);compStats.set(n,mergeStatsV13(compStats.get(n),one));});
    historic.forEach(function(h){const n=competitionVisualLabel(getCompetitionDisplayName(h.row.division_name||"League"));compStats.set(n,mergeStatsV13(compStats.get(n),h.stats));});
    const compRows=Array.from(compStats.entries()).map(function(e){return {title:e[0],meta:"",stats:e[1]};}).sort((a,b)=>b.stats.played-a.stats.played||a.title.localeCompare(b.title,"it"));

    const seasonMap=new Map(seasons.map(s=>[String(s.game_world_id)+"|"+String(s.season_id),s]));const seasonStats=new Map();
    matches.forEach(function(m){const k=m.game_world_id+"|"+(m.season_id||"none");seasonStats.set(k,mergeStatsV13(seasonStats.get(k),statsForCareerMatches(assignments,[m])));});
    historic.forEach(function(h){const k=h.row.game_world_id+"|"+h.row.season_id;seasonStats.set(k,mergeStatsV13(seasonStats.get(k),h.stats));});
    const seasonRows=Array.from(seasonStats.entries()).map(function(e){const parts=e[0].split("|"),season=seasonMap.get(e[0]);return {title:(worldId?"":parts[0]+" · ")+(season?"Season "+season.season_number:"Season n/d"),meta:season&&season.season_status==="past"?"Storico":"",stats:e[1]};}).sort((a,b)=>b.title.localeCompare(a.title,"it",{numeric:true}));

    let worldBlock="";if(!worldId){const worldStats=new Map();matches.forEach(function(m){worldStats.set(m.game_world_id,mergeStatsV13(worldStats.get(m.game_world_id),statsForCareerMatches(assignments.filter(a=>a.game_world_id===m.game_world_id),[m])));});historic.forEach(function(h){worldStats.set(h.row.game_world_id,mergeStatsV13(worldStats.get(h.row.game_world_id),h.stats));});const wr=Array.from(worldStats.entries()).map(function(e){return {title:e[0]+" · "+((getWorldMeta(e[0])||{}).name||e[0]),meta:"",stats:e[1]};}).sort((a,b)=>b.title.localeCompare(a.title,"it",{numeric:true}));worldBlock=`<div class="nx-profile-section"><h2>Game World Breakdown</h2>${breakdownRowsV10(wr)}</div>`;}
    const historicalNote=historic.length?`<div class="nx-global-filter-note">Season storiche senza match-by-match: applicata la regola IMC della metà stagione.</div>`:"";
    return `<div class="nx-profile-section nx-stats-overview"><h2>${worldId?"Game World Overview":"Career Overview"}</h2>${statSummaryGrid(total)}${historicalNote}</div><div class="nx-profile-section"><h2>Club Career</h2>${breakdownRowsV10(clubRows)}</div><div class="nx-profile-section"><h2>National Team Career</h2>${breakdownRowsV10(nationRows)}</div>${worldBlock}<div class="nx-profile-section"><h2>Competition Breakdown</h2>${breakdownRowsV10(compRows)}</div><div class="nx-profile-section"><h2>Season Breakdown</h2>${breakdownRowsV10(seasonRows)}</div><div class="nx-profile-section"><h2>${worldId?"Game World Records":"Career Records"}</h2>${careerRecordsV10(assignments,matches)}</div>`;
  }

  async function loadCareerStatsPage(){const target=document.getElementById("careerStatsContent");if(!target||!state.client||!state.user)return;try{const d=await fetchManagerCareerData(state.user.manager_id,state.selectedWorld||null);target.innerHTML=renderCareerStatsV10(d,state.selectedWorld||null);}catch(e){target.innerHTML=`<div class="nx-empty-box"><strong>Errore Stats</strong><span>${esc(e.message||"Impossibile calcolare le statistiche.")}</span></div>`;}}

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
      }else if(state.adminPage === "analytics"){
        root.innerHTML = adminAnalyticsPage();
        bindAdminAnalytics();
      }else{
        root.innerHTML = adminConsolePage();
        bindAdminConsole();
      }
      return;
    }

    if(state.selectedWorld && state.page === "worlds"){
      if(state.worldSection === "player-codex" && state.selectedWorld === "GW001"){
        if(state.selectedPlayer){
          root.innerHTML = playerCodexPlayerPageB44();
          bindPlayerCodexPlayerPageB44();
        }else{
          root.innerHTML = playerCodexArchivePageB44();
          bindPlayerCodexArchivePageB44();
        }
      }else if(state.worldSection === "competitions"){
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
          if(state.selectedWorld==="GW001" && state.clubProfileView==="roster"){
            root.innerHTML = teamRosterPageB44();
            bindTeamRosterPageB44();
          }else{
            root.innerHTML = entityProfilePage("club");
            bindEntityProfile("club");
          }
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
        root.innerHTML = personalTrophyRoomPage();
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
    }else if(state.page === "stats"){
      root.innerHTML = statsPage();
    }else if(state.page === "transfers"){
      root.innerHTML = transfersPageB44();
      bindTransfersPageB44();
    }else if(state.page === "schedule"){
      root.innerHTML = globalSchedulePage();
      bindGlobalSchedulePage();
    }else if(state.page === "h2h"){
      root.innerHTML = globalH2HPage();
      bindGlobalH2HPage();
    }else if(state.page === "trophies"){
      root.innerHTML = personalTrophyRoomPage();
    }else{
      root.innerHTML = nxClubHouse();
    }
  }





  function finalHonourKeyV12(row){
    return [row.game_world_id||"",row.season_id||"",normalizeText(row.competition_name||"")].join("|");
  }

  function mergeHonourRowsV12(rows,autoRows){
    const out=[];
    const seen=new Set();
    (rows||[]).concat(autoRows||[]).forEach(function(row){
      const key=finalHonourKeyV12(row);
      if(seen.has(key))return;
      seen.add(key);
      out.push(row);
    });
    return out;
  }

  function assignmentManagerNameV12(assignment){
    const rel=assignment&&assignment.imc_managers;
    if(Array.isArray(rel))return rel[0]&&rel[0].full_name?rel[0].full_name:null;
    return rel&&rel.full_name?rel.full_name:null;
  }

  function finalWinnerV12(match,teamMap,nationMap){
    const homeScore=Number(match.home_score),awayScore=Number(match.away_score);
    let side=null;
    if(Number.isFinite(homeScore)&&Number.isFinite(awayScore)&&homeScore!==awayScore){
      side=homeScore>awayScore?"home":"away";
    }else if(match.penalty_winner_team_id){
      const teamId=String(match.penalty_winner_team_id);
      const team=teamMap.get(teamId);
      return team?{kind:"club",id:team.team_id,name:teamDisplayName(team)}:null;
    }else if(match.penalty_winner_nation_id){
      const nation=nationMap.get(String(match.penalty_winner_nation_id));
      return nation?{kind:"nation",id:nation.nation_id,name:nation.nation_name}:null;
    }else if(match.home_penalties!=null&&match.away_penalties!=null&&Number(match.home_penalties)!==Number(match.away_penalties)){
      side=Number(match.home_penalties)>Number(match.away_penalties)?"home":"away";
    }
    if(!side)return null;
    const teamId=side==="home"?match.home_team_id:match.away_team_id;
    const nationId=side==="home"?match.home_nation_id:match.away_nation_id;
    if(teamId){
      const team=teamMap.get(String(teamId));
      return team?{kind:"club",id:team.team_id,name:teamDisplayName(team)}:null;
    }
    if(nationId){
      const nation=nationMap.get(String(nationId));
      return nation?{kind:"nation",id:nation.nation_id,name:nation.nation_name}:null;
    }
    return null;
  }

  function managerForFinalWinnerV12(worldId,winner,matchDate,assignments){
    const candidates=(assignments||[]).filter(function(a){
      if(String(a.game_world_id)!==String(worldId))return false;
      if(a.start_date&&matchDate<a.start_date)return false;
      if(a.end_date&&matchDate>a.end_date)return false;
      if(winner.kind==="club")return a.assignment_type==="club"&&String(a.team_id)===String(winner.id);
      return a.assignment_type==="national_team"&&String(a.nation_id)===String(winner.id);
    }).sort(function(a,b){return String(b.start_date||"").localeCompare(String(a.start_date||""))||Number(b.assignment_id||0)-Number(a.assignment_id||0);});
    const a=candidates[0];
    return a?{id:a.manager_id||null,name:assignmentManagerNameV12(a)||null}:{id:null,name:null};
  }

  async function ensureSeason2FinalHonoursV12(worldId){
    if(!state.client)return [];
    try{
      let sq=state.client.from("gw_seasons").select("season_id,game_world_id,season_number").eq("season_number",2);
      if(worldId)sq=sq.eq("game_world_id",worldId);
      const sr=await sq;if(sr.error)throw sr.error;
      const seasons=sr.data||[];
      if(!seasons.length)return [];
      const seasonIds=seasons.map(function(s){return s.season_id;});
      const seasonWorld=new Map(seasons.map(function(s){return [String(s.season_id),s.game_world_id];}));

      const mr=await state.client.from("gw_matches").select("match_id,game_world_id,season_id,competition_id,match_date,round_name,stage_name,match_status,home_score,away_score,home_penalties,away_penalties,home_team_id,away_team_id,home_nation_id,away_nation_id,decided_on_penalties,penalty_winner_team_id,penalty_winner_nation_id").in("season_id",seasonIds).eq("match_status","played");
      if(mr.error)throw mr.error;
      const finals=(mr.data||[]).filter(function(m){return isFinalRoundLabel(m.round_name)||isFinalRoundLabel(m.stage_name);});
      if(!finals.length)return [];

      const competitionIds=Array.from(new Set(finals.map(function(m){return m.competition_id;}).filter(Boolean)));
      const teamIds=Array.from(new Set(finals.flatMap(function(m){return [m.home_team_id,m.away_team_id,m.penalty_winner_team_id];}).filter(Boolean)));
      const nationIds=Array.from(new Set(finals.flatMap(function(m){return [m.home_nation_id,m.away_nation_id,m.penalty_winner_nation_id];}).filter(Boolean)));
      const worldIds=Array.from(new Set(seasons.map(function(s){return s.game_world_id;})));

      const promises=[
        competitionIds.length?state.client.from("gw_competitions").select("competition_id,competition_name,competition_type").in("competition_id",competitionIds):Promise.resolve({data:[],error:null}),
        teamIds.length?state.client.from("gw_teams").select("team_id,game_world_id,sm_club_id,team_name,display_name").in("team_id",teamIds):Promise.resolve({data:[],error:null}),
        nationIds.length?state.client.from("imc_national_teams").select("nation_id,nation_name").in("nation_id",nationIds):Promise.resolve({data:[],error:null}),
        state.client.from("gw_manager_assignments").select("assignment_id,game_world_id,manager_id,team_id,nation_id,assignment_type,start_date,end_date,imc_managers(full_name)").in("game_world_id",worldIds),
        state.client.from("gw_season_honours").select("honour_id,game_world_id,season_id,competition_name,competition_type,winner_team_id,winner_team_name,awarded_on,winner_manager_id,winner_manager_name").in("season_id",seasonIds)
      ];
      const res=await Promise.all(promises);
      res.forEach(function(r){if(r.error)throw r.error;});
      const competitionMap=new Map((res[0].data||[]).map(function(c){return [String(c.competition_id),c];}));
      const teamMap=new Map((res[1].data||[]).map(function(t){return [String(t.team_id),t];}));
      const nationMap=new Map((res[2].data||[]).map(function(n){return [String(n.nation_id),n];}));
      const assignments=res[3].data||[];
      const existing=res[4].data||[];
      const existingKeys=new Set(existing.map(finalHonourKeyV12));

      const latestFinals=new Map();
      finals.forEach(function(m){
        const key=[m.game_world_id,m.season_id,m.competition_id].join("|");
        const prev=latestFinals.get(key);
        if(!prev||String(m.match_date||"").localeCompare(String(prev.match_date||""))>0||Number(m.match_id)>Number(prev.match_id))latestFinals.set(key,m);
      });

      const inferred=[];
      latestFinals.forEach(function(match){
        const comp=competitionMap.get(String(match.competition_id));
        if(!comp||comp.competition_type==="league"||comp.competition_type==="world_cup_qualifying")return;
        const winner=finalWinnerV12(match,teamMap,nationMap);if(!winner)return;
        const manager=managerForFinalWinnerV12(match.game_world_id||seasonWorld.get(String(match.season_id)),winner,match.match_date,assignments);
        inferred.push({
          game_world_id:match.game_world_id||seasonWorld.get(String(match.season_id)),
          season_id:match.season_id,
          competition_name:comp.competition_name,
          competition_type:comp.competition_type,
          winner_team_id:winner.kind==="club"?winner.id:null,
          winner_team_name:winner.name,
          awarded_on:match.match_date,
          winner_manager_id:manager.id,
          winner_manager_name:manager.name,
          _auto_final_v12:true,
          _source_match_id:match.match_id
        });
      });

      const missing=inferred.filter(function(h){return !existingKeys.has(finalHonourKeyV12(h));});
      if(missing.length){
        const payload=missing.map(function(h){return {
          game_world_id:h.game_world_id,season_id:h.season_id,competition_name:h.competition_name,competition_type:h.competition_type,
          winner_team_id:h.winner_team_id,winner_team_name:h.winner_team_name,awarded_on:h.awarded_on,
          winner_manager_id:h.winner_manager_id,winner_manager_name:h.winner_manager_name
        };});
        const ir=await state.client.from("gw_season_honours").insert(payload).select("honour_id,game_world_id,season_id,competition_name,competition_type,winner_team_id,winner_team_name,awarded_on,winner_manager_id,winner_manager_name");
        if(ir.error)console.warn("Build 13 · honours finali non persistiti, uso fallback locale:",ir.error);
        else (ir.data||[]).forEach(function(row){existingKeys.add(finalHonourKeyV12(row));});
      }

      const cacheOther=(state.autoFinalHonoursV12||[]).filter(function(h){return worldId&&String(h.game_world_id)!==String(worldId);});
      state.autoFinalHonoursV12=mergeHonourRowsV12(cacheOther,inferred);
      return inferred;
    }catch(error){
      console.warn("Build 13 · assegnazione automatica finali ignorata:",error);
      return [];
    }
  }

  function personalTrophyRoomPage(){
    setTimeout(loadPersonalTrophyRoom,0);const worldId=state.selectedWorld||null;
    return `<section class="nx-card nx-personal-trophy-room"><div class="nx-page-title"><div><small>${worldId?esc(worldId)+" · "+esc(selectedWorldName()):"CLUB HOUSE · CAREER"}</small><h1>🏆 Trophy Room</h1><p>${worldId?"Trofei vinti dal manager in questo Game World.":"Palmarès completo del manager in tutti i Game World."}</p></div></div><div class="nx-global-filter-note">Manager: <strong>${esc(state.user.full_name)}</strong></div><div id="personalTrophyContent"><div class="nx-loading">Apertura bacheca…</div></div></section>`;
  }
  async function loadPersonalTrophyRoom(){
    await ensureSeason2FinalHonoursV12(state.selectedWorld||null);
    const target=document.getElementById("personalTrophyContent");if(!target||!state.client||!state.user)return;
    try{let q=state.client.from("gw_season_honours").select("honour_id,game_world_id,season_id,competition_name,competition_type,winner_team_id,winner_team_name,awarded_on,winner_manager_id,winner_manager_name").eq("winner_manager_id",state.user.manager_id).order("awarded_on",{ascending:false});if(state.selectedWorld)q=q.eq("game_world_id",state.selectedWorld);const hr=await q;if(hr.error)throw hr.error;const auto=(state.autoFinalHonoursV12||[]).filter(function(h){return String(h.winner_manager_id||"")===String(state.user.manager_id)&&(!state.selectedWorld||String(h.game_world_id)===String(state.selectedWorld));});const honours=mergeHonourRowsV12(hr.data||[],auto);
      let sq=state.client.from("gw_seasons").select("season_id,game_world_id,season_number,season_code");if(state.selectedWorld)sq=sq.eq("game_world_id",state.selectedWorld);const sr=await sq;if(sr.error)throw sr.error;target.innerHTML=renderPersonalTrophiesV10(honours,sr.data||[],state.selectedWorld||null);
    }catch(e){target.innerHTML=`<div class="nx-empty-box"><strong>Errore Trophy Room</strong><span>${esc(e.message||"Impossibile leggere i trofei.")}</span></div>`;}
  }
  function renderPersonalTrophiesV10(honours,seasons,worldId){
    if(!honours.length)return `<div class="nx-empty-box"><strong>Nessun trofeo registrato</strong><span>${worldId?"Non risultano honours attribuiti al manager in questo Game World.":"Non risultano honours attribuiti al manager."}</span></div>`;
    const seasonMap=new Map(seasons.map(s=>[String(s.season_id),s]));const groups=new Map();honours.forEach(function(h){const season=seasonMap.get(String(h.season_id));const key=(worldId?"":h.game_world_id+"|")+(season?season.season_number:"?");if(!groups.has(key))groups.set(key,{world:h.game_world_id,season:season?season.season_number:"?",rows:[]});groups.get(key).rows.push(h);});
    const sorted=Array.from(groups.values()).sort(function(a,b){if(!worldId&&a.world!==b.world)return String(a.world).localeCompare(String(b.world),"it",{numeric:true});return Number(b.season)-Number(a.season);});
    return `<div class="nx-trophy-career-summary"><div><small>TROFEI TOTALI</small><strong>${honours.length}</strong></div><span>${worldId?"In questo Game World":"Carriera IMC"}</span></div><div class="nx-personal-trophy-groups">${sorted.map(function(g){return `<section class="nx-personal-trophy-group"><div class="nx-personal-trophy-group-head"><div>${!worldId?`<small>${esc(g.world)} · ${esc(((getWorldMeta(g.world)||{}).name)||g.world)}</small>`:""}<h2>Season ${esc(g.season)}</h2></div><span>${g.rows.length} ${g.rows.length===1?"trofeo":"trofei"}</span></div><div class="nx-personal-trophy-grid">${g.rows.map(function(h){return `<article class="nx-personal-trophy-card">${trophyRoomImageMarkup(h.competition_name,h.competition_type,false)}<div><small>${esc(h.competition_type||"TROFEO")}</small><strong>${esc(h.competition_name)}</strong><span>${esc(h.winner_team_name||"Nazionale")}</span><time>${h.awarded_on?formatDate(h.awarded_on):"Data non disponibile"}</time></div></article>`;}).join("")}</div></section>`;}).join("")}</div>`;
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
    await ensureSeason2FinalHonoursV12(state.selectedWorld||null);
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
          .select("team_id,game_world_id,sm_club_id,team_name,display_name")
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
      const honours=mergeHonourRowsV12(results[4]||[],(state.autoFinalHonoursV12||[]).filter(function(h){return String(h.game_world_id)===String(worldId);}));
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
    if(normalizedRaw==="kick off cup")return "assets/trophies/kick-off-cup.webp";
    if(normalizedRaw==="charity shield")return "assets/trophies/charity-shield.png";

    // Record DB legacy con prefisso nazione.
    if(/·\s*league shield$/.test(normalizedRaw))return "assets/trophies/league-cup.png";
    if(/·\s*league cup$/.test(normalizedRaw))return "assets/trophies/league-cup.png";
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
      "imc champions":"assets/trophies/imc-champions-v27.png",
      "imc shield":"assets/trophies/imc-shield.png",
      "imc super cup":"assets/trophies/imc-super-cup.png",
      "smfa champions":"assets/trophies/imc-champions-v27.png",
      "smfa shield":"assets/trophies/imc-shield.png",
      "smfa super cup":"assets/trophies/imc-super-cup.png",
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
      return Number(b.season.season_number)-Number(a.season.season_number);
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

      // Build 8: server-side entity lookup. We no longer download the whole Game World
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
              : "Career H2H · tutti i Game World"}</p>
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
        .select("assignment_id,manager_id,game_world_id,team_id,nation_id,start_date,end_date,gw_teams(team_id,game_world_id,sm_club_id,team_name,display_name),imc_national_teams(nation_name)");
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
          const result=await state.client.rpc("nexus_admin_reset_manager_password",{
            p_manager_id:manager.manager_id
          });

          if(result.error){
            throw new Error(result.error.message||"Reset password non riuscito.");
          }

          const resetRow=Array.isArray(result.data)?result.data[0]:result.data;
          if(!resetRow||!resetRow.temporary_password){
            throw new Error("La RPC non ha restituito la password temporanea.");
          }

          const account=registryAccountFor(manager.manager_id);
          if(account)account.must_change_password=true;

          renderRegistryCredentials([{
            manager_id:resetRow.manager_id||manager.manager_id,
            full_name:manager.full_name,
            temporary_password:resetRow.temporary_password
          }],"Password reimpostata");
          status.className="status success";
          status.textContent="Password temporanea ripristinata a "+resetRow.temporary_password+" per "+manager.manager_id+".";
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
    {competition_id:"COMP_INT_001",competition_name:"IMC Champions",competition_category:"international"},
    {competition_id:"COMP_INT_002",competition_name:"IMC Shield",competition_category:"international"},
    {competition_id:"COMP_INT_003",competition_name:"IMC Super Cup",competition_category:"international"},
    {competition_id:"COMP_NAT_001",competition_name:"World Cup Qualifying",competition_category:"nations"},
    {competition_id:"COMP_NAT_002",competition_name:"World Cup",competition_category:"nations"}
  ];

  function canonicalDomesticCupDisplayName(value){
    const raw=String(value||"").trim();
    // Compatibilità visuale con Game World non ancora migrati.
    if(/^League Shield$/i.test(raw))return "League Cup";
    if(/·\s*League Shield$/i.test(raw))return raw.replace(/League Shield$/i,"League Cup");
    return raw;
  }

  function competitionDbNameFromVisual(value){
    // Nel nuovo modello Nexus il nome visuale è anche il nome canonico nel DB.
    return String(value||"").trim();
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
        state.client.from("gw_teams").select("team_id,sm_club_id,game_world_id,team_name,display_name").order("display_name",{ascending:true,nullsFirst:false}),
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

  function usesCanonicalGwStructure(worldId){
    return String(worldId||"").toUpperCase()==="GW004";
  }

  // BUILD 36 · GW008 Area pilot.
  // area_sm = nome Soccer Manager (solo import/matching)
  // area_id = identità stabile
  // area_alias = nome visibile in Nexus
  function usesAreaPilot(worldId){
    return String(worldId||"").toUpperCase()==="GW008";
  }

  function areaRegistryMaps(rows){
    const byId=new Map();
    const bySm=new Map();
    (rows||[]).forEach(function(row){
      if(row.area_id==null)return;
      const data={
        area_id:Number(row.area_id),
        area_sm:String(row.area_sm||"").trim(),
        area_alias:String(row.area_alias||row.country_name||"").trim(),
        country_id:row.country_id==null?null:Number(row.country_id)
      };
      byId.set(String(data.area_id),data);
      if(data.area_sm)bySm.set(normalizeParticipantKey(data.area_sm),data);
    });
    return {by_id:byId,by_sm:bySm};
  }

  async function loadAdminGameWorldSetup(){
    const worldId=state.adminGwSetupWorldId;
    const body=document.getElementById("gwSetupBody");
    if(!worldId||!body) return;
    body.innerHTML='<div class="nx-empty-state">Caricamento configurazione…</div>';
    setGwSetupStatus("","");
    try{
      const canonicalStructure=usesCanonicalGwStructure(worldId);
      const results=await Promise.all([
        state.client.from("gw_seasons").select("season_id,game_world_id,season_number,season_status,start_date,end_date").eq("game_world_id",worldId).order("season_number",{ascending:true}),
        state.client.from("gw_world_settings").select("game_world_id,active_season_id").eq("game_world_id",worldId).maybeSingle(),
        state.client.from("gw_setup_nations").select("nation_setup_id,game_world_id,nation_name,sort_order").eq("game_world_id",worldId).order("sort_order",{ascending:true}),
        canonicalStructure
          ? Promise.resolve({data:[],error:null})
          : state.client.from("gw_league_setups").select("league_setup_id,game_world_id,nation_setup_id,division_count,teams_per_division,league_cup,league_shield,playoff,charity_shield").eq("game_world_id",worldId),
        canonicalStructure
          ? Promise.resolve({data:[],error:null})
          : state.client.from("gw_division_setups").select("division_setup_id,game_world_id,nation_setup_id,division_number,team_count").eq("game_world_id",worldId).order("division_number",{ascending:true}),
        state.client.from("gw_setup_team_divisions").select("setup_team_id,game_world_id,season_id,nation_setup_id,division_number,division_id,team_id,gw_teams(team_id,game_world_id,sm_club_id,team_name,display_name)").eq("game_world_id",worldId).order("division_number",{ascending:true}),
        state.client.from("imc_managers").select("manager_id,full_name").order("full_name",{ascending:true}),
        state.client.from("gw_manager_assignments").select("assignment_id,game_world_id,manager_id,team_id,nation_id,assignment_type,start_date,end_date,season_id").eq("game_world_id",worldId),
        state.client.from("imc_national_teams").select("nation_id,nation_name").order("nation_name",{ascending:true}),
        state.client.from("gw_competition_settings").select("setting_id,game_world_id,season_id,competition_id,nation_setup_id,start_date").eq("game_world_id",worldId),
        canonicalStructure
          ? state.client.from("gw_divisions").select("division_id,game_world_id,division_code,division_name,division_level,teams_count").eq("game_world_id",worldId).order("division_level",{ascending:true})
          : Promise.resolve({data:[],error:null}),
        canonicalStructure
          ? state.client.from("gw_competitions").select("competition_id,competition_name,competition_type,canonical_competition_id,division_id,country_id").eq("game_world_id",worldId)
          : Promise.resolve({data:[],error:null})
      ]);
      results.forEach(function(result){if(result.error) throw result.error;});
      state.adminGwSetupSeasons=results[0].data||[];
      state.adminGwSetupWorldSettings=results[1].data||null;
      state.adminGwSetupNations=results[2].data||[];
      state.adminGwSetupTeams=results[5].data||[];
      state.adminGwSetupManagers=results[6].data||[];
      state.adminGwSetupAssignments=results[7].data||[];
      state.adminGwSetupNationalTeams=results[8].data||[];
      state.adminGwSetupCompetitionSettings=results[9].data||[];

      if(canonicalStructure){
        const canonicalDivisions=(results[10].data||[]).slice().sort(function(a,b){return Number(a.division_level)-Number(b.division_level);});
        const canonicalCompetitions=results[11].data||[];
        const hasCanonical=function(id){return canonicalCompetitions.some(function(row){return row.canonical_competition_id===id;});};
        state.adminGwSetupDivisions=canonicalDivisions.map(function(row){
          return {
            division_setup_id:null,
            game_world_id:worldId,
            nation_setup_id:null,
            division_number:Number(row.division_level),
            team_count:Number(row.teams_count),
            division_id:Number(row.division_id),
            canonical:true
          };
        });
        state.adminGwSetupLeagues=[{
          league_setup_id:null,
          game_world_id:worldId,
          nation_setup_id:null,
          division_count:canonicalDivisions.length,
          teams_per_division:canonicalDivisions.length?Number(canonicalDivisions[0].teams_count):20,
          league_cup:hasCanonical("COMP_DOM_002"),
          league_shield:hasCanonical("COMP_DOM_003"),
          playoff:hasCanonical("COMP_DOM_005"),
          charity_shield:hasCanonical("COMP_DOM_004"),
          canonical:true
        }];
      }else{
        state.adminGwSetupLeagues=results[3].data||[];
        state.adminGwSetupDivisions=results[4].data||[];
      }

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
    {id:"COMP_INT_001",name:"IMC Champions",group:"international",defaultEnabled:true,fromSeason:1},
    {id:"COMP_INT_002",name:"IMC Shield",group:"international",defaultEnabled:true,fromSeason:1},
    {id:"COMP_INT_003",name:"IMC Super Cup",group:"international",defaultEnabled:false,fromSeason:2},
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
        const divisionId=div&&div.division_id?Number(div.division_id):null;
        const imported=(state.adminGwSetupTeams||[]).filter(function(row){
          if(String(row.nation_setup_id||"")!==String(cfg.nationId||"")||Number(row.season_id)!==Number(season.season_id))return false;
          if(usesCanonicalGwStructure(state.adminGwSetupWorldId)&&divisionId)return Number(row.division_id)===divisionId;
          return Number(row.division_number)===n;
        });
        cards+=`<article class="nx-team-import-card" data-nation-id="${cfg.nationId||""}" data-division-number="${n}" data-division-id="${divisionId||""}" data-expected="${expected}">
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
    {id:"COMP_DOM_002",name:"National Cup",category:"domestic",required:false},
    {id:"COMP_DOM_003",name:"League Cup",category:"domestic",required:false},
    {id:"COMP_DOM_004",name:"Charity Shield",category:"domestic",required:false,fromSeason:2},
    {id:"COMP_DOM_005",name:"Playoff",category:"domestic",required:false},
    {id:"COMP_INT_001",name:"IMC Champions",category:"international",required:true},
    {id:"COMP_INT_002",name:"IMC Shield",category:"international",required:true},
    {id:"COMP_INT_003",name:"IMC Super Cup",category:"international",required:false,fromSeason:2},
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

  function canonicalCompetitionIdForLabel(value){
    const raw=String(value||"").trim();
    if(/^Division\s+[1-5]$/i.test(raw))return "COMP_DOM_001";
    if(/^Division\s+[2-5]\s+Playoff$/i.test(raw)||/^Playoff$/i.test(raw))return "COMP_DOM_005";
    const key=normalizeParticipantKey(raw);
    const map={
      "league":"COMP_DOM_001",
      "national cup":"COMP_DOM_002",
      "league cup":"COMP_DOM_003",
      "league shield":"COMP_DOM_003",
      "charity shield":"COMP_DOM_004",
      "imc champions":"COMP_INT_001",
      "smfa champions":"COMP_INT_001",
      "imc shield":"COMP_INT_002",
      "smfa shield":"COMP_INT_002",
      "imc super cup":"COMP_INT_003",
      "smfa super cup":"COMP_INT_003",
      "world cup qualifying":"COMP_NAT_001",
      "world cup":"COMP_NAT_002"
    };
    return map[key]||null;
  }

  function divisionNumberFromCompetitionLabel(value){
    const match=String(value||"").trim().match(/^Division\s+([1-5])(?:\s+Playoff)?$/i);
    return match?Number(match[1]):null;
  }

  async function resolveWorldCompetitionRows(worldId,label){
    const dbName=getCompetitionDbName(label);
    if(!usesCanonicalGwStructure(worldId)){
      return state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,competition_type,country_id,division_id,canonical_competition_id")
        .eq("game_world_id",worldId)
        .eq("competition_name",dbName)
        .limit(2);
    }

    const canonicalId=canonicalCompetitionIdForLabel(label);
    if(!canonicalId){
      return state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,competition_type,country_id,division_id,canonical_competition_id")
        .eq("game_world_id",worldId)
        .eq("competition_name",dbName)
        .limit(2);
    }

    let query=state.client
      .from("gw_competitions")
      .select("competition_id,competition_name,competition_type,country_id,division_id,canonical_competition_id")
      .eq("game_world_id",worldId)
      .eq("canonical_competition_id",canonicalId);

    const divisionNumber=divisionNumberFromCompetitionLabel(label);
    if(divisionNumber&&(canonicalId==="COMP_DOM_001"||canonicalId==="COMP_DOM_005")){
      const divisionResult=await state.client
        .from("gw_divisions")
        .select("division_id")
        .eq("game_world_id",worldId)
        .eq("division_level",divisionNumber)
        .maybeSingle();
      if(divisionResult.error)throw divisionResult.error;
      if(!divisionResult.data)return {data:[],error:null};
      query=query.eq("division_id",divisionResult.data.division_id);
    }else{
      query=query.is("country_id",null);
    }

    return query.limit(2);
  }

  function smfaGroupMatchdaysForWorld(worldId){
    const formats={GW001:3,GW004:6,GW005:3,GW008:6,GW009:3};
    return formats[String(worldId||"").toUpperCase()]||null;
  }

  // BUILD 39 · Pilot dedicato: GW008 IMC Shield è una competizione interamente
  // knockout. Nessuna data viene trattata come Group Stage.
  function isGw008ShieldKnockoutOnly(worldId,competitionName){
    return String(worldId||"").toUpperCase()==="GW008" &&
      String(competitionName||"").trim()==="IMC Shield";
  }

  async function ensureLeagueCountries(worldId,setupNations){
    const existingResult=await state.client
      .from("gw_league_countries")
      .select("country_id,game_world_id,country_name,area_id,area_sm,area_alias")
      .eq("game_world_id",worldId);

    if(existingResult.error)throw existingResult.error;

    let countries=existingResult.data||[];
    const existingByName=new Map();
    const areaPilot=usesAreaPilot(worldId);

    countries.forEach(function(country){
      const sourceName=areaPilot?(country.area_sm||""):country.country_name;
      if(sourceName){
        existingByName.set(normalizeParticipantKey(sourceName),country);
      }
    });

    const missing=(setupNations||[]).filter(function(nation){
      return !existingByName.has(normalizeParticipantKey(nation.nation_name));
    });

    // GW008 è il pilota Area: il Registry deve essere esplicito.
    // Non trasformiamo mai automaticamente un nome Soccer Manager in una nuova Area.
    if(areaPilot&&missing.length){
      throw new Error("GW008: Area Registry incompleto per: "+missing.map(function(n){return n.nation_name;}).join(", ")+". Import/setup bloccato per evitare duplicati.");
    }

    if(!areaPilot&&missing.length){
      const inserted=await state.client
        .from("gw_league_countries")
        .insert(missing.map(function(nation){
          return {game_world_id:worldId,country_name:nation.nation_name};
        }))
        .select("country_id,game_world_id,country_name,area_id,area_sm,area_alias");

      if(inserted.error)throw inserted.error;
      countries=countries.concat(inserted.data||[]);
      (inserted.data||[]).forEach(function(country){
        existingByName.set(normalizeParticipantKey(country.country_name),country);
      });
    }

    const countryIdByNationSetupId=new Map();

    (setupNations||[]).forEach(function(nation){
      const country=existingByName.get(normalizeParticipantKey(nation.nation_name));
      if(country){
        countryIdByNationSetupId.set(
          String(nation.nation_setup_id),
          Number(areaPilot?(country.area_id||country.country_id):country.country_id)
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
      .select("competition_id,country_id,division_id,competition_name,competition_type,competition_category,canonical_competition_id")
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
        canonical_competition_id:"COMP_DOM_001",
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
        ["National Cup",Boolean(leagueSetup&&leagueSetup.league_cup),"domestic_cup","COMP_DOM_002"],
        ["League Cup",Boolean(leagueSetup&&leagueSetup.league_shield),"domestic_cup","COMP_DOM_003"],
        ["Charity Shield",Boolean(leagueSetup&&leagueSetup.charity_shield),"domestic_super_cup","COMP_DOM_004"],
        ["Playoff",Boolean(leagueSetup&&leagueSetup.playoff),"promotion_playoff","COMP_DOM_005"]
      ];
      configs.forEach(function(cfg){
        if(!cfg[1])return;

        if(cfg[3]==="COMP_DOM_005"&&usesCanonicalGwStructure(worldId)&&!isMulti){
          setupDivisions.filter(function(setup){return Number(setup.division_number)>=2;}).forEach(function(setup){
            const code=worldId+"_DIV_"+String(setup.division_number).padStart(2,"0");
            const division=divisionBySetupKey.get(code);
            if(!division)return;
            wanted.push({
              game_world_id:worldId,
              country_id:null,
              division_id:division.division_id,
              competition_name:"Division "+setup.division_number+" Playoff",
              competition_type:"promotion_playoff",
              canonical_competition_id:"COMP_DOM_005",
              has_group_stage:false,
              knockout_legs:1,
              final_legs:1,
              competition_category:"domestic"
            });
          });
          return;
        }

        wanted.push({
          game_world_id:worldId,
          country_id:isMulti
            ? (countryIdByNationSetupId.get(String(nationId))||null)
            : null,
          division_id:null,
          competition_name:prefix+cfg[0],
          competition_type:cfg[2],
          canonical_competition_id:cfg[3],
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
      ["COMP_INT_001","IMC Champions","smfa_champions","international"],
      ["COMP_INT_002","IMC Shield","smfa_shield","international"],
      ["COMP_INT_003","IMC Super Cup","smfa_super_cup","international"],
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
        canonical_competition_id:cfg[0],
        has_group_stage:cfg[2]==="smfa_champions"||cfg[2]==="smfa_shield"||cfg[2]==="world_cup_qualifying"||cfg[2]==="world_cup",
        knockout_legs:cfg[2]==="smfa_super_cup"?1:null,
        final_legs:1,
        competition_category:cfg[3]
      });
    });

    function competitionStructureKey(row){
      if(usesCanonicalGwStructure(worldId)&&row.canonical_competition_id){
        return [String(row.country_id||""),String(row.division_id||""),String(row.canonical_competition_id)].join("|");
      }
      return [String(row.country_id||""),String(row.division_id||""),String(row.competition_name||"").trim().toLowerCase(),row.competition_type].join("|");
    }

    const existingKey=new Set(competitions.map(competitionStructureKey));
    const missingCompetitions=wanted.filter(function(row){
      const key=competitionStructureKey(row);
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
    const canonicalStructure=usesCanonicalGwStructure(state.adminGwSetupWorldId);
    if(world&&world.type==="multi_league"&&!cards.length){setGwSetupStatus("Un Multi League deve avere almeno una nazione.","error");return;}
    const configs=cards.map(readDomesticCard);
    const globalConfig=readGlobalCompetitionConfig();
    setGwSetupStatus("Salvataggio e inizializzazione del Game World…","");
    try{
      const seasonId=await ensureActiveSetupSeason();
      let result;

      if(canonicalStructure){
        const cfg=configs[0];
        const canonicalDivisions=(state.adminGwSetupDivisions||[]).slice().sort(function(a,b){return Number(a.division_number)-Number(b.division_number);});
        if(!cfg||Number(cfg.divisionCount)!==canonicalDivisions.length){
          throw new Error("GW004 beta: il numero delle divisioni canoniche non può essere modificato da questo pannello.");
        }
        for(const div of cfg.divisions){
          const canonical=canonicalDivisions.find(function(row){return Number(row.division_number)===Number(div.division_number);});
          if(!canonical||!canonical.division_id)throw new Error("Division "+div.division_number+": division_id canonico non disponibile.");
          result=await state.client.from("gw_divisions").update({teams_count:Number(div.team_count)}).eq("game_world_id",state.adminGwSetupWorldId).eq("division_id",canonical.division_id);
          if(result.error)throw result.error;
        }
      }else{
        result=await state.client.from("gw_division_setups").delete().eq("game_world_id",state.adminGwSetupWorldId);if(result.error)throw result.error;
        result=await state.client.from("gw_league_setups").delete().eq("game_world_id",state.adminGwSetupWorldId);if(result.error)throw result.error;
        for(const cfg of configs){
          result=await state.client.from("gw_league_setups").insert({game_world_id:state.adminGwSetupWorldId,nation_setup_id:cfg.nationId,division_count:cfg.divisionCount,teams_per_division:cfg.teamsPerDivision,league_cup:cfg.leagueCup,league_shield:cfg.leagueShield,playoff:cfg.playoff,charity_shield:cfg.charityShield});if(result.error)throw result.error;
          result=await state.client.from("gw_division_setups").insert(cfg.divisions.map(function(div){return {game_world_id:state.adminGwSetupWorldId,nation_setup_id:cfg.nationId,division_number:div.division_number,team_count:div.team_count};}));if(result.error)throw result.error;
        }
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
      setGwSetupStatus(canonicalStructure?"GW004 sincronizzato sul modello canonico: divisioni, competizioni e stagione aggiornate.":"Build Game World completata: divisioni e competizioni sincronizzate automaticamente.","success");
    }catch(error){
      setGwSetupStatus(error&&error.message?error.message:"Salvataggio non riuscito.","error");
    }
  }

  function normalizeSetupTeamName(value){
    const source=String(value||"").replace(/^[\s*•·▪◦‣⁃–—-]+/,"").replace(/^\s*\d+\.\s*/,"");
    let name=formatTeamDisplayName(source);
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
    const expected=Number(card.getAttribute("data-expected")),divisionNumber=Number(card.getAttribute("data-division-number")),divisionId=Number(card.getAttribute("data-division-id")||0)||null,nationRaw=card.getAttribute("data-nation-id"),nationId=nationRaw?Number(nationRaw):null,names=previewDivisionTeamImport(card),season=activeSetupSeason();
    const canonicalStructure=usesCanonicalGwStructure(state.adminGwSetupWorldId);
    if(!season){setGwSetupStatus("Salva prima una stagione attiva.","error");return;}
    if(canonicalStructure&&!divisionId){setGwSetupStatus(`Division ${divisionNumber}: division_id canonico non disponibile.`,"error");return;}
    if(names.length!==expected){setGwSetupStatus(`Division ${divisionNumber}: servono esattamente ${expected} squadre.`,"error");return;}
    setGwSetupStatus(`Salvataggio Division ${divisionNumber}…`,"");
    try{
      const existingResult=await state.client.from("gw_teams").select("team_id,game_world_id,sm_club_id,team_name,display_name").eq("game_world_id",state.adminGwSetupWorldId);if(existingResult.error)throw existingResult.error;
      const map=new Map();
      (existingResult.data||[]).forEach(function(team){
        addParticipantMapEntry(map,team.team_name,team);
        if(team.display_name)addParticipantMapEntry(map,team.display_name,team);
      });
      const missing=names.filter(function(name){return !resolveImportedParticipant(map,name,name);}).map(function(name){return {game_world_id:state.adminGwSetupWorldId,country_id:null,team_type:"club",team_name:name,display_name:name};});
      if(missing.length){const inserted=await state.client.from("gw_teams").insert(missing).select("team_id,team_name,display_name");if(inserted.error)throw inserted.error;(inserted.data||[]).forEach(function(team){addParticipantMapEntry(map,team.team_name,team);});}
      let deleteQuery=state.client.from("gw_setup_team_divisions").delete().eq("game_world_id",state.adminGwSetupWorldId).eq("season_id",season.season_id);
      deleteQuery=canonicalStructure?deleteQuery.eq("division_id",divisionId):deleteQuery.eq("division_number",divisionNumber);
      deleteQuery=nationId?deleteQuery.eq("nation_setup_id",nationId):deleteQuery.is("nation_setup_id",null);
      let result=await deleteQuery;if(result.error)throw result.error;
      const rows=names.map(function(name){
        const matchedTeam=resolveImportedParticipant(map,name,name);
        const row={game_world_id:state.adminGwSetupWorldId,season_id:season.season_id,nation_setup_id:nationId,division_number:divisionNumber,team_id:matchedTeam.team_id};
        if(canonicalStructure)row.division_id=divisionId;
        return row;
      });
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
        .from("gw_season_honours")
        .select("honour_id,competition_name,competition_type,winner_team_id,winner_manager_id")
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


  function adminAnalyticsPage(){
    const summary=state.adminAnalyticsSummary||{};
    const loading=state.adminAnalyticsLoading;
    const error=state.adminAnalyticsError;
    const value=function(key){
      if(loading&&!state.adminAnalyticsSummary)return "…";
      const n=Number(summary[key]||0);
      return Number.isFinite(n)?n.toLocaleString("it-IT"):"0";
    };

    return `
      <section class="nx-admin-shell nx-analytics-shell">
        <div class="nx-admin-head compact">
          <button class="nx-back-link" id="backAdminAnalytics">‹ Admin Console</button>
          <small>PRIVATE ANALYTICS</small>
          <h1>Nexus Analytics</h1>
          <p>Accessi registrati in forma anonima. Un accesso per sessione browser, senza dati personali.</p>
        </div>

        <div class="nx-stat-grid nx-analytics-grid">
          ${statCard("Visite totali",value("total_visits"))}
          ${statCard("Visitatori unici",value("unique_visitors"))}
          ${statCard("Visite oggi",value("visits_today"))}
          ${statCard("Unici oggi",value("unique_visitors_today"))}
        </div>

        <div class="nx-analytics-actions">
          <button class="nx-primary-action" id="refreshAdminAnalytics" type="button" ${loading?"disabled":""}>${loading?"Aggiornamento…":"↻ Aggiorna dati"}</button>
          ${error?`<div class="status error">${esc(error)}</div>`:`<div class="nx-analytics-note">I refresh nella stessa sessione non vengono conteggiati come nuovi accessi.</div>`}
        </div>
      </section>`;
  }

  async function loadAdminAnalytics(){
    if(!state.client||!isAdminUser())return;
    state.adminAnalyticsLoading=true;
    state.adminAnalyticsError="";
    if(state.adminMode&&state.adminPage==="analytics")renderShell();
    try{
      const result=await state.client.rpc("get_nexus_analytics_summary");
      if(result.error)throw result.error;
      const row=Array.isArray(result.data)?(result.data[0]||{}):(result.data||{});
      state.adminAnalyticsSummary={
        total_visits:Number(row.total_visits||0),
        unique_visitors:Number(row.unique_visitors||0),
        visits_today:Number(row.visits_today||0),
        unique_visitors_today:Number(row.unique_visitors_today||0)
      };
    }catch(error){
      state.adminAnalyticsError=error&&error.message?error.message:"Analytics non disponibili.";
    }finally{
      state.adminAnalyticsLoading=false;
      if(state.adminMode&&state.adminPage==="analytics")renderShell();
    }
  }

  function bindAdminAnalytics(){
    const back=document.getElementById("backAdminAnalytics");
    if(back)back.addEventListener("click",function(){state.adminPage="home";renderShell();});
    const refresh=document.getElementById("refreshAdminAnalytics");
    if(refresh)refresh.addEventListener("click",loadAdminAnalytics);
    if(!state.adminAnalyticsSummary&&!state.adminAnalyticsLoading&&!state.adminAnalyticsError){
      setTimeout(loadAdminAnalytics,0);
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
          <button class="nx-admin-card primary-card" data-admin-page="analytics"><b>◉</b><strong>Analytics</strong><span>Accessi, visitatori unici e attività di oggi</span></button>
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

  function importCompetitionBaseName(row){
    const raw=String((row&&row.competition_name)||"").trim();
    if(!raw)return "";
    const marker=" · ";
    return raw.includes(marker)?raw.split(marker).slice(1).join(marker).trim():raw;
  }

  function importCompetitionSortKey(row){
    const type=String((row&&row.competition_type)||"");
    const name=importCompetitionBaseName(row);
    const typeOrder={
      domestic_cup:10,
      promotion_playoff:20,
      domestic_super_cup:30,
      smfa_champions:40,
      smfa_shield:50,
      smfa_super_cup:60,
      world_cup_qualifying:70,
      world_cup:80
    };
    let detail=0;
    const playoff=name.match(/^Division\s+(\d+)\s+Playoff$/i);
    if(playoff)detail=Number(playoff[1])||0;
    else if(/^National Cup$/i.test(name))detail=1;
    else if(/^League Cup$/i.test(name))detail=2;
    else if(/^Charity Shield$/i.test(name))detail=3;
    return (typeOrder[type]||999)*100+detail;
  }

  async function configuredCompetitionOptions(worldId){
    const result=await state.client
      .from("gw_competitions")
      .select("competition_id,competition_name,competition_type,competition_category,country_id,division_id")
      .eq("game_world_id",worldId)
      .order("competition_id",{ascending:true});

    if(result.error)throw result.error;

    const rows=result.data||[];
    const leagueRows=rows.filter(function(row){return row.competition_type==="league";});
    const groups={domestic:[],international:[],nations:[]};
    const seen=new Set();

    rows
      .filter(function(row){return row.competition_type!=="league";})
      .sort(function(a,b){return importCompetitionSortKey(a)-importCompetitionSortKey(b);})
      .forEach(function(row){
        const name=importCompetitionBaseName(row);
        if(!name)return;
        const category=row.competition_category==="international"
          ? "international"
          : (row.competition_category==="national_teams"||row.competition_category==="nations" ? "nations" : "domestic");
        const key=category+"|"+name.toLowerCase();
        if(seen.has(key))return;
        seen.add(key);
        groups[category].push({value:name,label:name});
      });

    const labels={domestic:"Domestic Cups",international:"International",nations:"Nations"};
    let html="";
    if(leagueRows.length){
      html+='<option value="league">League · Tutte le Divisioni</option>';
    }

    ["domestic","international","nations"].forEach(function(category){
      const items=groups[category]||[];
      if(!items.length)return;
      html+='<optgroup label="'+labels[category]+'">';
      items.forEach(function(item){
        html+='<option value="'+esc(item.value)+'">'+esc(item.label)+'</option>';
      });
      html+='</optgroup>';
    });

    return html||'<option value="" disabled>Nessuna competizione configurata</option>';
  }


  // BUILD 42 · Admin Import Center · Matchday Control deterministico e verificabile.
  // Il registry ufficiale è gw_season_matchdays; gw_matches contiene solo ciò
  // che è stato realmente importato. Il pannello mostra solo i buchi operativi.
  function matchdayControlShell(){
    return `
      <section class="nx-md-control" id="matchdayControl">
        <div class="nx-md-control-head">
          <div>
            <small>IMPORT AUDIT</small>
            <h2>Matchday Control</h2>
            <p>Matchday ufficiali senza import completo. Tocca una riga per preparare subito l'Import Center.</p>
          </div>
          <button class="nx-md-refresh" id="refreshMatchdayControl" type="button">↻ AGGIORNA</button>
        </div>
        <div class="nx-md-kpis" id="matchdayControlKpis">
          <div><strong>…</strong><span>Results mancanti</span></div>
          <div><strong>…</strong><span>Schedule mancanti</span></div>
          <div><strong>…</strong><span>Parziali</span></div>
          <div><strong>…</strong><span>Completi</span></div>
        </div>
        <div class="nx-md-view-toggle" id="matchdayControlViewToggle" role="group" aria-label="Vista Matchday Control">
          <button type="button" class="is-active" data-md-view="division">PER DIVISIONE</button>
          <button type="button" data-md-view="matchday">PER MATCHDAY</button>
        </div>
        <div class="nx-md-filters">
          <select id="matchdayControlType">
            <option value="all">Tutti i problemi</option>
            <option value="results">Results</option>
            <option value="schedule">Schedule</option>
            <option value="partial">Solo parziali</option>
          </select>
          <select id="matchdayControlWorld"><option value="all">Tutti i Game World</option></select>
        </div>
        <div class="nx-md-control-status" id="matchdayControlStatus">Caricamento controllo Matchday…</div>
        <div class="nx-md-control-list" id="matchdayControlList"></div>
      </section>`;
  }

  async function fetchPagedRows(buildQuery,keyField){
    const out=[];
    const seen=keyField?new Set():null;
    const pageSize=1000;
    for(let from=0;;from+=pageSize){
      const result=await buildQuery(from,from+pageSize-1);
      if(result.error)throw result.error;
      const rows=result.data||[];
      rows.forEach(function(row){
        if(!seen){out.push(row);return;}
        const key=row&&row[keyField]!=null?String(row[keyField]):null;
        if(key===null||seen.has(key))return;
        seen.add(key);
        out.push(row);
      });
      if(rows.length<pageSize)break;
    }
    return out;
  }

  function matchdayControlIsFriendly(row){
    if(!row)return false;
    const raw=[row.matchday_type,row.label].filter(Boolean).join(" ").toLowerCase();
    const normalized=raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[_\-.]+/g," ")
      .replace(/\s+/g," ")
      .trim();
    return /\b(?:friendly|friendlies|amichevole|amichevoli)\b/.test(normalized) ||
      /\bpre\s*season\b/.test(normalized) ||
      /\bpost\s*season\b/.test(normalized) ||
      /\bpre\s*stagion/.test(normalized) ||
      /\bpost\s*stagion/.test(normalized);
  }

  function matchdayControlPlayed(row){
    return row && (
      row.match_status==="played" ||
      (row.home_score!==null && row.home_score!==undefined && row.away_score!==null && row.away_score!==undefined)
    );
  }

  function matchdayControlImportMode(competition){
    if(!competition)return "league";
    if(competition.competition_type==="league")return "league";
    return importCompetitionBaseName(competition)||String(competition.competition_name||"");
  }

  function matchdayControlSort(a,b){
    const order={missing:0,partial:1,unknown:2,complete:3};
    if(order[a.state]!==order[b.state])return order[a.state]-order[b.state];
    if(a.bucket!==b.bucket)return a.bucket==="results"?-1:1;
    if(a.bucket==="results")return String(b.date).localeCompare(String(a.date));
    return String(a.date).localeCompare(String(b.date));
  }

  async function loadMatchdayControl(){
    const root=document.getElementById("matchdayControl");
    const status=document.getElementById("matchdayControlStatus");
    const list=document.getElementById("matchdayControlList");
    const kpis=document.getElementById("matchdayControlKpis");
    const worldFilter=document.getElementById("matchdayControlWorld");
    if(!root||!status||!list||!state.client)return;

    // Ogni refresh invalida eventuali caricamenti precedenti ancora in volo.
    // Una risposta vecchia non può più sovrascrivere un audit più recente.
    state.adminMatchdayControlLoadSeq=(Number(state.adminMatchdayControlLoadSeq)||0)+1;
    const loadSeq=state.adminMatchdayControlLoadSeq;

    root.classList.add("is-loading");
    status.className="nx-md-control-status";
    status.textContent="Controllo di tutti i Game World in corso…";
    list.innerHTML="";

    try{
      const seasonsResult=await state.client
        .from("gw_seasons")
        .select("game_world_id,season_id,season_number,season_status")
        .eq("season_status","current")
        .order("game_world_id",{ascending:true});
      if(seasonsResult.error)throw seasonsResult.error;
      const seasons=seasonsResult.data||[];

      const payloads=await Promise.all(seasons.map(async function(season){
        const worldId=String(season.game_world_id||"");
        const seasonId=season.season_id;
        const results=await Promise.all([
          fetchPagedRows(function(from,to){
            return state.client.from("gw_season_matchdays")
              .select("matchday_id,game_world_id,season_id,division_id,competition_id,matchday_number,matchday_type,match_date,label,expected_matches")
              .eq("game_world_id",worldId).eq("season_id",seasonId)
              .order("match_date",{ascending:true})
              .order("matchday_id",{ascending:true})
              .range(from,to);
          },"matchday_id"),
          fetchPagedRows(function(from,to){
            return state.client.from("gw_matches")
              .select("match_id,game_world_id,season_id,competition_id,match_date,match_status,home_score,away_score")
              .eq("game_world_id",worldId).eq("season_id",seasonId)
              .order("match_date",{ascending:true})
              .order("match_id",{ascending:true})
              .range(from,to);
          },"match_id"),
          state.client.from("gw_competitions")
            .select("competition_id,competition_name,competition_type,division_id,area_id,country_id")
            .eq("game_world_id",worldId),
          state.client.from("gw_divisions")
            .select("division_id,division_name,teams_count")
            .eq("game_world_id",worldId)
        ]);
        results.slice(2).forEach(function(result){if(result.error)throw result.error;});
        return {
          season:season,
          matchdays:results[0],
          matches:results[1],
          competitions:results[2].data||[],
          divisions:results[3].data||[]
        };
      }));

      if(loadSeq!==state.adminMatchdayControlLoadSeq)return;

      const today=nexusLocalIsoDate();
      const rows=[];
      let complete=0,missingResults=0,missingSchedule=0,partials=0;

      payloads.forEach(function(payload){
        const season=payload.season;
        const worldId=String(season.game_world_id||"");
        const compById=new Map((payload.competitions||[]).map(function(c){return [String(c.competition_id),c];}));
        const leagueByDivision=new Map();
        (payload.competitions||[]).forEach(function(c){
          if(c.competition_type==="league"&&c.division_id!=null&&!leagueByDivision.has(String(c.division_id))){
            leagueByDivision.set(String(c.division_id),c);
          }
        });
        const divisionById=new Map((payload.divisions||[]).map(function(d){return [String(d.division_id),d];}));
        const matchesByKey=new Map();
        const matchIdsByKey=new Map();
        (payload.matches||[]).forEach(function(m){
          const key=String(m.competition_id||"")+"|"+String(m.match_date||"");
          if(!matchesByKey.has(key)){matchesByKey.set(key,[]);matchIdsByKey.set(key,new Set());}
          const matchId=m&&m.match_id!=null?String(m.match_id):null;
          if(matchId!==null&&matchIdsByKey.get(key).has(matchId))return;
          if(matchId!==null)matchIdsByKey.get(key).add(matchId);
          matchesByKey.get(key).push(m);
        });

        (payload.matchdays||[]).forEach(function(md){
          // BUILD 42 · Matchday Control: le amichevoli pre/post-season non sono mai conteggiate.
          if(matchdayControlIsFriendly(md))return;
          const competition=md.competition_id!=null
            ? compById.get(String(md.competition_id))
            : leagueByDivision.get(String(md.division_id));
          if(!competition)return;
          const competitionId=competition.competition_id;
          const date=String(md.match_date||"");
          if(!date)return;
          const matchRows=matchesByKey.get(String(competitionId)+"|"+date)||[];
          const played=matchRows.filter(matchdayControlPlayed).length;
          const scheduled=matchRows.length;
          const bucket=date<today?"results":(date>today?"schedule":(played>0?"results":"schedule"));
          const loaded=bucket==="results"?played:scheduled;
          const division=md.division_id!=null?divisionById.get(String(md.division_id)):null;
          let expected=Number(md.expected_matches||0);
          if(!expected&&competition.competition_type==="league"&&division&&Number(division.teams_count)>1){
            expected=Math.floor(Number(division.teams_count)/2);
          }
          let rowState="unknown";
          if(loaded===0)rowState="missing";
          else if(expected>0&&loaded<expected)rowState="partial";
          else if(expected>0&&loaded>=expected)rowState="complete";
          else rowState="unknown";

          if(rowState==="complete"){complete+=1;return;}
          if(rowState==="partial")partials+=1;
          else if(rowState==="missing"&&bucket==="results")missingResults+=1;
          else if(rowState==="missing"&&bucket==="schedule")missingSchedule+=1;

          const matchNumber=Number(md.matchday_number||0);
          const roundLabel=matchNumber?"Match "+matchNumber:(String(md.label||"").trim()||"Matchday");
          const worldMeta=getWorldMeta(worldId);
          rows.push({
            worldId:worldId,
            worldName:worldMeta&&worldMeta.name?worldMeta.name:worldId,
            seasonNumber:season.season_number,
            competitionId:competitionId,
            competitionName:String(competition.competition_name||"Competizione"),
            importMode:matchdayControlImportMode(competition),
            date:date,
            roundLabel:roundLabel,
            loaded:loaded,
            expected:expected,
            bucket:bucket,
            state:rowState
          });
        });
      });

      if(loadSeq!==state.adminMatchdayControlLoadSeq)return;
      state.adminMatchdayControl={rows:rows.sort(matchdayControlSort),summary:{missingResults:missingResults,missingSchedule:missingSchedule,partials:partials,complete:complete}};

      if(kpis){
        kpis.innerHTML=`
          <div class="is-danger"><strong>${esc(missingResults)}</strong><span>Results mancanti</span></div>
          <div class="is-info"><strong>${esc(missingSchedule)}</strong><span>Schedule mancanti</span></div>
          <div class="is-warning"><strong>${esc(partials)}</strong><span>Parziali</span></div>
          <div class="is-ok"><strong>${esc(complete)}</strong><span>Completi</span></div>`;
      }

      if(worldFilter){
        const selected=worldFilter.value||"all";
        const worlds=Array.from(new Set(rows.map(function(r){return r.worldId;}))).sort(function(a,b){return a.localeCompare(b,"it",{numeric:true});});
        worldFilter.innerHTML='<option value="all">Tutti i Game World</option>'+worlds.map(function(id){
          const meta=getWorldMeta(id);return '<option value="'+esc(id)+'">'+esc(id)+' · '+esc(meta&&meta.name?meta.name:id)+'</option>';
        }).join("");
        if(worlds.includes(selected))worldFilter.value=selected;
      }

      status.textContent=rows.length
        ? rows.length+" Matchday richiedono attenzione. I completi sono nascosti."
        : "Nessun buco rilevato nelle stagioni correnti.";
      renderMatchdayControlRows();
    }catch(error){
      if(loadSeq!==state.adminMatchdayControlLoadSeq)return;
      state.adminMatchdayControl={rows:[],summary:null};
      status.className="nx-md-control-status is-error";
      status.textContent=error&&error.message?error.message:"Impossibile caricare Matchday Control.";
      list.innerHTML="";
    }finally{
      if(loadSeq===state.adminMatchdayControlLoadSeq)root.classList.remove("is-loading");
    }
  }

  function matchdayControlFilteredRows(){
    const typeFilter=document.getElementById("matchdayControlType");
    const worldFilter=document.getElementById("matchdayControlWorld");
    const data=state.adminMatchdayControl&&state.adminMatchdayControl.rows?state.adminMatchdayControl.rows:[];
    const type=typeFilter?typeFilter.value:"all";
    const world=worldFilter?worldFilter.value:"all";
    return data.filter(function(row){
      if(world!=="all"&&row.worldId!==world)return false;
      if(type==="results"&&row.bucket!=="results")return false;
      if(type==="schedule"&&row.bucket!=="schedule")return false;
      if(type==="partial"&&row.state!=="partial")return false;
      return true;
    });
  }

  function matchdayControlRowHtml(row,dataIndex,compact){
    const denom=row.expected>0?row.expected:"?";
    const stateLabel=row.state==="partial"?"IMPORT PARZIALE":(row.bucket==="results"?"RISULTATI MANCANTI":"SCHEDULE MANCANTE");
    const context=compact
      ? '<small>'+esc(row.roundLabel)+' · '+esc(formatDate(row.date))+'</small><strong>'+esc(row.loaded)+' / '+esc(denom)+'</strong>'
      : '<small>'+esc(row.worldId)+' · SEASON '+esc(row.seasonNumber)+'</small><strong>'+esc(row.competitionName)+'</strong><span>'+esc(row.roundLabel)+' · '+esc(formatDate(row.date))+'</span>';
    return `<button type="button" class="nx-md-row ${compact?'is-compact ':''}${row.bucket} ${row.state}" data-md-index="${esc(dataIndex)}">
      <div class="nx-md-row-main">${context}${compact?'<span>'+esc(stateLabel)+'</span>':''}</div>
      ${compact?'':`<div class="nx-md-row-count"><strong>${esc(row.loaded)} / ${esc(denom)}</strong><span>${esc(stateLabel)}</span></div>`}
      <b class="nx-md-row-arrow">›</b>
    </button>`;
  }

  function matchdayControlDivisionGroups(rows){
    const groups=new Map();
    rows.forEach(function(row){
      const key=[row.worldId,row.seasonNumber,row.competitionId].join("|");
      if(!groups.has(key)){
        groups.set(key,{
          key:key,
          worldId:row.worldId,
          worldName:row.worldName,
          seasonNumber:row.seasonNumber,
          competitionId:row.competitionId,
          competitionName:row.competitionName,
          rows:[],
          results:0,
          schedule:0,
          partial:0
        });
      }
      const group=groups.get(key);
      group.rows.push(row);
      if(row.state==="partial")group.partial+=1;
      else if(row.bucket==="results")group.results+=1;
      else group.schedule+=1;
    });
    return Array.from(groups.values()).sort(function(a,b){
      const w=String(a.worldId).localeCompare(String(b.worldId),"it",{numeric:true});
      if(w!==0)return w;
      return String(a.competitionName).localeCompare(String(b.competitionName),"it",{numeric:true});
    });
  }

  function renderMatchdayControlRows(){
    const list=document.getElementById("matchdayControlList");
    if(!list)return;
    const rows=matchdayControlFilteredRows();
    if(!rows.length){
      list.innerHTML='<div class="nx-md-empty"><strong>Nessun Matchday da verificare</strong><span>I filtri selezionati non mostrano buchi.</span></div>';
      return;
    }

    const view=state.adminMatchdayControlView||"division";
    const allData=state.adminMatchdayControl&&state.adminMatchdayControl.rows?state.adminMatchdayControl.rows:[];
    if(view==="matchday"){
      list.innerHTML=rows.map(function(row){
        return matchdayControlRowHtml(row,allData.indexOf(row),false);
      }).join("");
      return;
    }

    if(!state.adminMatchdayControlExpandedGroups)state.adminMatchdayControlExpandedGroups=new Set();
    const expanded=state.adminMatchdayControlExpandedGroups;
    const groups=matchdayControlDivisionGroups(rows);
    list.innerHTML=groups.map(function(group){
      const isOpen=expanded.has(group.key);
      const problemCount=group.rows.length;
      const chips=[];
      if(group.results)chips.push('<span class="is-results">'+esc(group.results)+' Results</span>');
      if(group.schedule)chips.push('<span class="is-schedule">'+esc(group.schedule)+' Schedule</span>');
      if(group.partial)chips.push('<span class="is-partial">'+esc(group.partial)+' Parziali</span>');
      const children=isOpen?'<div class="nx-md-group-rows">'+group.rows.map(function(row){
        return matchdayControlRowHtml(row,allData.indexOf(row),true);
      }).join("")+'</div>':'';
      return `<div class="nx-md-group ${isOpen?'is-open':''}">
        <button type="button" class="nx-md-group-head" data-md-group-key="${esc(group.key)}" aria-expanded="${isOpen?'true':'false'}">
          <div class="nx-md-group-main">
            <small>${esc(group.worldId)} · SEASON ${esc(group.seasonNumber)}</small>
            <strong>${esc(group.competitionName)}</strong>
            <span>${esc(problemCount)} Matchday ${problemCount===1?'da verificare':'da verificare'}</span>
          </div>
          <div class="nx-md-group-meta">${chips.join("")}<b>${isOpen?'⌃':'⌄'}</b></div>
        </button>
        ${children}
      </div>`;
    }).join("");
  }

  async function openImportFromMatchdayControl(row){
    if(!row)return;
    const worldSelect=document.getElementById("importWorld");
    const competitionSelect=document.getElementById("importMode");
    const target=document.getElementById("importTargetHint");
    if(!worldSelect||!competitionSelect)return;

    worldSelect.value=row.worldId;
    worldSelect.dispatchEvent(new Event("change",{bubbles:true}));

    const hasImportOption=function(){
      return Array.from(competitionSelect.options||[]).some(function(opt){return opt.value===row.importMode;});
    };
    const started=Date.now();
    while((competitionSelect.disabled||!hasImportOption())&&Date.now()-started<5000){
      await new Promise(function(resolve){setTimeout(resolve,80);});
    }
    const option=Array.from(competitionSelect.options).find(function(opt){return opt.value===row.importMode;});
    if(option){
      competitionSelect.value=row.importMode;
      competitionSelect.dispatchEvent(new Event("change",{bubbles:true}));
    }
    if(target){
      target.hidden=false;
      target.innerHTML='<strong>IMPORT TARGET</strong><span>'+esc(row.worldId)+' · '+esc(row.competitionName)+' · '+esc(row.roundLabel)+' · '+esc(formatDate(row.date))+'</span>';
    }
    const textarea=document.getElementById("importText");
    if(textarea){
      textarea.scrollIntoView({behavior:"smooth",block:"center"});
      setTimeout(function(){textarea.focus();},350);
    }
  }

  function bindMatchdayControl(){
    const root=document.getElementById("matchdayControl");
    if(!root)return;
    const refresh=document.getElementById("refreshMatchdayControl");
    const type=document.getElementById("matchdayControlType");
    const world=document.getElementById("matchdayControlWorld");
    const viewToggle=document.getElementById("matchdayControlViewToggle");
    if(!state.adminMatchdayControlView)state.adminMatchdayControlView="division";
    if(refresh)refresh.addEventListener("click",loadMatchdayControl);
    if(type)type.addEventListener("change",renderMatchdayControlRows);
    if(world)world.addEventListener("change",renderMatchdayControlRows);
    if(viewToggle)viewToggle.addEventListener("click",function(event){
      const button=event.target.closest("[data-md-view]");
      if(!button)return;
      state.adminMatchdayControlView=button.dataset.mdView==="matchday"?"matchday":"division";
      Array.from(viewToggle.querySelectorAll("[data-md-view]")).forEach(function(btn){
        btn.classList.toggle("is-active",btn.dataset.mdView===state.adminMatchdayControlView);
      });
      renderMatchdayControlRows();
    });
    root.addEventListener("click",function(event){
      const groupButton=event.target.closest("[data-md-group-key]");
      if(groupButton){
        const key=groupButton.dataset.mdGroupKey;
        if(!state.adminMatchdayControlExpandedGroups)state.adminMatchdayControlExpandedGroups=new Set();
        if(state.adminMatchdayControlExpandedGroups.has(key))state.adminMatchdayControlExpandedGroups.delete(key);
        else state.adminMatchdayControlExpandedGroups.add(key);
        renderMatchdayControlRows();
        return;
      }
      const button=event.target.closest("[data-md-index]");
      if(!button)return;
      const idx=Number(button.dataset.mdIndex);
      const row=state.adminMatchdayControl&&state.adminMatchdayControl.rows?state.adminMatchdayControl.rows[idx]:null;
      openImportFromMatchdayControl(row);
    });
    loadMatchdayControl();
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
    bindMatchdayControl();
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
          gw_teams(team_id,game_world_id,sm_club_id,team_name,display_name),
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
    'cagliari': 'cagliari.png',
    'cagliari calcio': 'cagliari.png',
    'club america': 'club-america.png',
    'como': 'como-1907.png',
    'como 1907': 'como-1907.png',
    'cremonese': 'cremonese.png',
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
    'hellas verona': 'hellas-verona.png',
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
    'us cremonese': 'cremonese.png',
    'velez sarsfield': 'velez-sarsfield.png',
    'verona': 'hellas-verona.png',
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

    // BUILD 8: the clean global display name is always first.
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

    // BUILD 8 · GW009 remains the ONLY dedicated visual exception.
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

  // BUILD 8 · inline image onerror handlers execute in window scope.
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
            IMC Managers
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
        state.clubProfileView="profile";
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
        // Build 83:
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
            state.entityProfileTab="stats";
            state.clubProfileView="profile";
            state.selectedClub={id:id,name:name};
          }else{
            state.entityProfileTab="stats";
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

  function profileTabsV11(active,items,extraClass){
    return `<div class="nx-profile-tabs-v11 ${esc(extraClass||"")}">${items.map(function(item){return `<button type="button" data-profile-tab="${esc(item.id)}" class="${active===item.id?"active":""}"><span>${item.icon}</span>${esc(item.label)}</button>`;}).join("")}</div>`;
  }

  function bindProfileTabsV11(container,stateKey){
    if(!container)return;
    container.querySelectorAll("[data-profile-tab]").forEach(function(button){
      button.addEventListener("click",function(){
        const tab=button.getAttribute("data-profile-tab")||"stats";
        state[stateKey]=tab;
        container.querySelectorAll("[data-profile-tab]").forEach(function(btn){btn.classList.toggle("active",btn===button);});
        container.querySelectorAll("[data-profile-panel]").forEach(function(panel){panel.hidden=panel.getAttribute("data-profile-panel")!==tab;});
      });
    });
  }

  function entityProfilePage(type){
    const entity = type === "club" ? state.selectedClub : state.selectedNation;
    const icon = type === "club" ? "◈" : "⚑";
    const profileVisual = entity
      ? entityVisual(type,entity.name)
      : `<span class="nx-entity-profile-fallback">${icon}</span>`;

    setTimeout(function(){ loadEntityProfile(type); },0);

    return `
      <section class="nx-card nx-profile-v11">
        <button class="nx-back-link" id="backToEntityList">
          ‹ Torna a ${type === "club" ? "Clubs" : "Nazionali"}
        </button>

        <div class="nx-entity-profile-head">
          <div class="nx-entity-profile-icon">${profileVisual}</div>
          <div>
            <small>${type === "club" ? "CLUB PROFILE" : "NATIONAL TEAM PROFILE"}</small>
            <h1>${esc(entity ? entity.name : "")}</h1>
            <p>${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</p>
          </div>
        </div>

        <div id="entityProfileContent">
          <div class="nx-loading">Apertura profilo…</div>
        </div>
      </section>
    `;
  }

  function bindEntityProfile(type){
    const back = document.getElementById("backToEntityList");
    if(back){
      back.addEventListener("click",function(){
        if(type === "club"){
          state.selectedClub = null;
          state.clubProfileView="profile";
        }else state.selectedNation = null;
        state.entityProfileTab="stats";
        renderShell();
      });
    }
  }

  async function loadEntityProfile(type){
    await ensureSeason2FinalHonoursV12(state.selectedWorld||null);
    const target = document.getElementById("entityProfileContent");
    const entity = type === "club" ? state.selectedClub : state.selectedNation;
    const worldId=state.selectedWorld || "GW004";

    if(!target || !entity || !state.client) return;

    try{
      const matchSelect=`
          match_id,game_world_id,season_id,competition_id,match_date,match_status,match_time,round_name,stage_name,group_name,
          home_score,away_score,home_penalties,away_penalties,home_team_id,away_team_id,home_nation_id,away_nation_id,
          competition:gw_competitions!gw_matches_competition_id_fkey(competition_id,competition_name),
          home_team:gw_teams!gw_matches_home_team_id_fkey(team_id,team_name,display_name),
          away_team:gw_teams!gw_matches_away_team_id_fkey(team_id,team_name,display_name),
          home_nation:imc_national_teams!gw_matches_home_nation_id_fkey(nation_name),
          away_nation:imc_national_teams!gw_matches_away_nation_id_fkey(nation_name)`;

      let matchQuery=state.client.from("gw_matches").select(matchSelect).eq("game_world_id",worldId).order("match_date",{ascending:false});
      if(type === "club")matchQuery=matchQuery.or(`home_team_id.eq.${entity.id},away_team_id.eq.${entity.id}`);
      const matchesResult=await matchQuery;if(matchesResult.error)throw matchesResult.error;
      let matches=matchesResult.data||[];
      if(type === "nation"){
        matches=matches.filter(function(match){
          const idMatch=String(match.home_nation_id)===String(entity.id)||String(match.away_nation_id)===String(entity.id);
          const homeName=match.home_nation&&match.home_nation.nation_name?match.home_nation.nation_name:"";
          const awayName=match.away_nation&&match.away_nation.nation_name?match.away_nation.nation_name:"";
          return idMatch||normalizeEntityName(homeName)===normalizeEntityName(entity.name)||normalizeEntityName(awayName)===normalizeEntityName(entity.name);
        });
      }

      let aq=state.client.from("gw_manager_assignments")
        .select("assignment_id,manager_id,team_id,nation_id,assignment_type,start_date,end_date,season_id,imc_managers(full_name)")
        .eq("game_world_id",worldId)
        .order("start_date",{ascending:true});
      aq=type==="club"?aq.eq("team_id",entity.id):aq.eq("nation_id",entity.id);
      const assignmentsResult=await aq;if(assignmentsResult.error)throw assignmentsResult.error;

      const honoursResult=await state.client.from("gw_season_honours")
        .select("honour_id,game_world_id,season_id,competition_name,competition_type,winner_team_id,winner_team_name,awarded_on,winner_manager_id,winner_manager_name")
        .eq("game_world_id",worldId)
        .order("awarded_on",{ascending:false});
      if(honoursResult.error)throw honoursResult.error;
      const allHonours=mergeHonourRowsV12(honoursResult.data||[],(state.autoFinalHonoursV12||[]).filter(function(h){return String(h.game_world_id)===String(worldId);}));
      const honours=allHonours.filter(function(h){
        if(type==="club")return String(h.winner_team_id||"")===String(entity.id)||normalizeEntityName(h.winner_team_name)===normalizeEntityName(entity.name);
        return normalizeEntityName(h.winner_team_name)===normalizeEntityName(entity.name);
      });

      const seasonsResult=await state.client.from("gw_seasons").select("season_id,game_world_id,season_number,season_code,season_status,start_date,end_date").eq("game_world_id",worldId);
      if(seasonsResult.error)throw seasonsResult.error;

      let historicalStandings=[];
      if(type==="club"){
        const hs=await state.client.from("gw_season_final_standings").select("standing_id,game_world_id,season_id,competition_id,division_name,final_position,team_id,team_name,played,won,drawn,lost,goals_for,goals_against,goal_difference,points,official_date").eq("game_world_id",worldId).eq("team_id",entity.id);
        if(hs.error)throw hs.error;historicalStandings=hs.data||[];
      }
      target.innerHTML=renderEntityProfileV11(type,entity,matches,assignmentsResult.data||[],honours,seasonsResult.data||[],historicalStandings);
      bindProfileTabsV11(target,"entityProfileTab");

      if(type==="club" && worldId==="GW001"){
        const rosterTab=target.querySelector('[data-profile-tab="roster"]');
        if(rosterTab){
          rosterTab.addEventListener("click",function(){
            state.entityProfileTab="stats";
            state.clubProfileView="roster";
            renderShell();
          });
        }
      }

      target.querySelectorAll("[data-profile-manager-id]").forEach(function(managerLink){
        managerLink.addEventListener("click",function(){
          state.selectedClub=null;state.selectedNation=null;state.selectedDivision=null;state.selectedCompetition=null;
          state.worldSection="managers";state.managerProfileTab="stats";
          state.selectedManager={id:managerLink.getAttribute("data-profile-manager-id"),name:managerLink.getAttribute("data-profile-manager-name")};
          renderShell();
        });
      });
    }catch(error){
      target.innerHTML=`<div class="nx-empty-box"><strong>Errore profilo</strong><span>${esc(error.message||"Impossibile leggere il database.")}</span></div>`;
    }
  }

  function entityPerspectiveV11(type,entityId,match,entityName){
    if(type==="club"){
      if(String(match.home_team_id)===String(entityId))return {side:"home"};
      if(String(match.away_team_id)===String(entityId))return {side:"away"};
      return null;
    }
    const hn=match.home_nation&&match.home_nation.nation_name?match.home_nation.nation_name:"";
    const an=match.away_nation&&match.away_nation.nation_name?match.away_nation.nation_name:"";
    if(String(match.home_nation_id)===String(entityId)||normalizeEntityName(hn)===normalizeEntityName(entityName))return {side:"home"};
    if(String(match.away_nation_id)===String(entityId)||normalizeEntityName(an)===normalizeEntityName(entityName))return {side:"away"};
    return null;
  }

  function entityStatsV11(type,entity,matches){
    return StatisticsEngine.summarize(matches,function(m){return entityPerspectiveV11(type,entity.id,m,entity.name);});
  }

  function renderEntityStatsV11(type,entity,matches,seasons,historicalStandings){
    const played=removeResultsScheduleDuplicates(matches).filter(StatisticsEngine.isPlayed);
    const seasonMap=new Map((seasons||[]).map(function(se){return [String(se.season_id),se];}));
    const historical=(type==="club"?(historicalStandings||[]):[]).filter(function(row){const season=seasonMap.get(String(row.season_id));if(!season||String(season.season_status)!=="past")return false;return !played.some(function(m){return String(m.season_id)===String(row.season_id);});});
    const historicalTotal=historical.reduce(function(acc,row){return mergeStatsV13(acc,statsFromStandingV13(row));},StatisticsEngine.empty());
    const total=mergeStatsV13(entityStatsV11(type,entity,played),historicalTotal);

    const compStats=new Map();played.forEach(function(m){const n=m.competition&&m.competition.competition_name?competitionVisualLabel(getCompetitionDisplayName(m.competition.competition_name)):"Competizione";compStats.set(n,mergeStatsV13(compStats.get(n),entityStatsV11(type,entity,[m])));});
    historical.forEach(function(row){const n=competitionVisualLabel(getCompetitionDisplayName(row.division_name||"League"));compStats.set(n,mergeStatsV13(compStats.get(n),statsFromStandingV13(row)));});
    const compRows=Array.from(compStats.entries()).map(function(e){return {title:e[0],meta:"",stats:e[1]};}).sort(function(a,b){return b.stats.played-a.stats.played||a.title.localeCompare(b.title,"it");});

    const seasonStats=new Map();played.forEach(function(m){const k=String(m.season_id||"none");seasonStats.set(k,mergeStatsV13(seasonStats.get(k),entityStatsV11(type,entity,[m])));});historical.forEach(function(row){const k=String(row.season_id);seasonStats.set(k,mergeStatsV13(seasonStats.get(k),statsFromStandingV13(row)));});
    const seasonRows=Array.from(seasonStats.entries()).map(function(e){const season=seasonMap.get(e[0]);return {title:season?"Season "+season.season_number:"Season n/d",meta:season&&season.season_status==="past"?"Storico":"",stats:e[1]};}).sort(function(a,b){return b.title.localeCompare(a.title,"it",{numeric:true});});

    const rows=[];played.forEach(function(m){const p=entityPerspectiveV11(type,entity.id,m,entity.name);if(!p)return;const home=p.side==="home";const gf=Number(home?m.home_score:m.away_score),ga=Number(home?m.away_score:m.home_score);rows.push({gf:gf,ga:ga,diff:gf-ga});});
    const wins=rows.filter(r=>r.diff>0).sort((a,b)=>b.diff-a.diff||b.gf-a.gf),losses=rows.filter(r=>r.diff<0).sort((a,b)=>a.diff-b.diff||b.ga-a.ga),maxGF=rows.slice().sort((a,b)=>b.gf-a.gf)[0],maxGA=rows.slice().sort((a,b)=>b.ga-a.ga)[0];
    const records=rows.length?`<div class="nx-record-grid">${recordCard("Vittoria più larga",wins[0]?wins[0].gf+" - "+wins[0].ga:"—")}${recordCard("Sconfitta più larga",losses[0]?losses[0].gf+" - "+losses[0].ga:"—")}${recordCard("Più gol segnati",maxGF.gf)}${recordCard("Più gol subiti",maxGA.ga)}</div>`:`<div class="nx-empty-box"><strong>Nessun record disponibile</strong></div>`;
    const note=type==="club"&&historical.length?`<div class="nx-global-filter-note">Le Season storiche del club usano i dati completi della classifica finale.</div>`:(type==="nation"&&(seasons||[]).some(function(se){return String(se.season_status)==="past";})?`<div class="nx-global-filter-note">Le statistiche storiche delle nazionali vengono mostrate solo quando esiste il match-by-match.</div>`:"");
    return `<div class="nx-profile-section nx-stats-overview"><h2>Game World Overview</h2>${statSummaryGrid(total)}${note}</div><div class="nx-profile-section"><h2>Competition Breakdown</h2>${breakdownRowsV10(compRows)}</div><div class="nx-profile-section"><h2>Season Breakdown</h2>${breakdownRowsV10(seasonRows)}</div><div class="nx-profile-section"><h2>Records</h2>${records}</div>`;
  }

  function renderEntityTrophiesV11(honours,seasons){
    if(!honours.length)return `<div class="nx-empty-box"><strong>Nessun trofeo registrato</strong><span>Non risultano honours per questa entità nel Game World.</span></div>`;
    const seasonMap=new Map((seasons||[]).map(function(s){return [String(s.season_id),s];}));
    const groups=new Map();honours.forEach(function(h){const season=seasonMap.get(String(h.season_id));const key=season?String(season.season_number):"?";if(!groups.has(key))groups.set(key,{season:season?season.season_number:"?",rows:[]});groups.get(key).rows.push(h);});
    const sorted=Array.from(groups.values()).sort(function(a,b){return Number(b.season)-Number(a.season);});
    return `<div class="nx-trophy-career-summary"><div><small>TROFEI TOTALI</small><strong>${honours.length}</strong></div><span>${esc(state.selectedWorld||"")}</span></div><div class="nx-personal-trophy-groups">${sorted.map(function(g){return `<section class="nx-personal-trophy-group"><div class="nx-personal-trophy-group-head"><div><h2>Season ${esc(g.season)}</h2></div><span>${g.rows.length} ${g.rows.length===1?"trofeo":"trofei"}</span></div><div class="nx-personal-trophy-grid">${g.rows.map(function(h){return `<article class="nx-personal-trophy-card">${trophyRoomImageMarkup(h.competition_name,h.competition_type,false)}<div><small>${esc(h.competition_type||"TROFEO")}</small><strong>${esc(h.competition_name)}</strong><span>${esc(h.winner_team_name||"")}</span><time>${h.awarded_on?formatDate(h.awarded_on):"Data non disponibile"}</time></div></article>`;}).join("")}</div></section>`;}).join("")}</div>`;
  }

  function careerDaysV33(startDate,endDate){
    if(!startDate)return null;
    const end=endDate||localTodayDateKey();
    const startObj=new Date(String(startDate)+"T00:00:00Z");
    const endObj=new Date(String(end)+"T00:00:00Z");
    if(Number.isNaN(startObj.getTime())||Number.isNaN(endObj.getTime())||endObj<startObj)return null;
    return Math.floor((endObj-startObj)/86400000)+1;
  }

  function careerDaysLabelV33(days){
    return days===null?"Durata n/d":new Intl.NumberFormat("it-IT").format(days)+" "+(days===1?"giorno":"giorni");
  }

  function careerKpiV33(label,value){
    return `<div class="nx-career-kpi-v33"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
  }

  function careerMediaV34(a,mode){
    if(mode==="club"||mode==="nation"){
      return `<span class="nx-career-media-v34 is-manager" aria-hidden="true"></span>`;
    }
    const isNation=mode==="managerNation"||(!a.team_id&&!!a.nation_id);
    const name=isNation
      ?(a.imc_national_teams&&a.imc_national_teams.nation_name?a.imc_national_teams.nation_name:"Nazionale")
      :(a.gw_teams&&teamDisplayName(a.gw_teams)?teamDisplayName(a.gw_teams):"Club");
    const url=isNation?nationFlagUrl(name):clubLogoUrl(name,state.selectedWorld);
    const fallbackData=!isNation?clubLogoFallbackData(name,state.selectedWorld):"";
    if(!url)return `<span class="nx-career-media-v34 is-fallback">${isNation?"⚑":"◈"}</span>`;
    return `<span class="nx-career-media-v34 is-logo"><img src="${esc(url)}" alt="${esc(name)}" loading="lazy" ${!isNation?`data-logo-fallbacks="${esc(fallbackData)}"`:""} onerror="${!isNation?"if(!advanceClubLogoCandidate(this)){this.style.display='none';this.parentElement.classList.add('is-fallback');this.parentElement.textContent='◈';}":"this.style.display='none';this.parentElement.classList.add('is-fallback');this.parentElement.textContent='⚑';"}"></span>`;
  }

  function careerSummaryItemV34(symbol,label,value){
    return `<span>${esc(symbol)} <b>${esc(value)}</b> ${esc(label)}</span>`;
  }

  function careerModeSummaryV35(rows,mode){
    if(!rows.length)return "";
    const totalDays=rows.reduce(function(sum,a){return sum+(careerDaysV33(a.start_date,a.end_date)||0);},0);
    const ids=new Set(rows.map(function(a){return String(mode==="club"?a.team_id:a.nation_id);}).filter(Boolean));
    const entityLabel=mode==="club"?"club":(ids.size===1?"nazionale":"nazionali");
    const assignmentLabel=rows.length===1?"incarico":"incarichi";
    const dayLabel=totalDays===1?"giorno":"giorni";
    return `<div class="nx-career-summary-v34 nx-career-summary-mode-v35">${careerSummaryItemV34("▣",assignmentLabel,rows.length)}${careerSummaryItemV34("◷",dayLabel,new Intl.NumberFormat("it-IT").format(totalDays))}${careerSummaryItemV34(mode==="club"?"♜":"⚑",entityLabel,ids.size)}</div>`;
  }

  function careerEmptyStateV35(mode){
    const isNation=mode==="nation";
    return `<div class="nx-career-empty-v35"><span aria-hidden="true">${isNation?"⚑":"◈"}</span><div><strong>${isNation?"Nessuna nazionale allenata":"Nessun club allenato"}</strong><small>${isNation?"Non risultano incarichi come CT in questo Game World.":"Non risultano incarichi di club in questo Game World."}</small></div></div>`;
  }

  function careerHorizontalTrackV33(rows,mode){
    if(!rows.length)return "";
    const ordered=rows.slice().sort(function(a,b){return String(b.start_date||"").localeCompare(String(a.start_date||""))||Number(b.assignment_id||0)-Number(a.assignment_id||0);});
    return `<div class="nx-career-rail-v34" role="region" aria-label="Game World Career"><div class="nx-career-track-v34">${ordered.map(function(a,index){
      const current=!a.end_date;
      const days=careerDaysV33(a.start_date,a.end_date);
      const effectiveMode=mode==="manager"?(a.team_id?"managerClub":"managerNation"):mode;
      let title="Assegnazione",role="Incarico";
      if(effectiveMode==="managerClub"){
        title=a.gw_teams&&teamDisplayName(a.gw_teams)?teamDisplayName(a.gw_teams):"Club";
        role="Club Manager";
      }else if(effectiveMode==="managerNation"){
        title=a.imc_national_teams&&a.imc_national_teams.nation_name?a.imc_national_teams.nation_name:"Nazionale";
        role="CT Nazionale";
      }else{
        title=a.imc_managers&&a.imc_managers.full_name?a.imc_managers.full_name:a.manager_id||"Manager IMC";
        role=effectiveMode==="nation"?"CT Nazionale":"Club Manager";
      }
      const titleMarkup=(effectiveMode==="club"||effectiveMode==="nation")
        ?`<button type="button" class="nx-career-link-v34" data-profile-manager-id="${esc(a.manager_id)}" data-profile-manager-name="${esc(title)}">${esc(title)}</button>`
        :`<strong class="nx-career-title-v34">${esc(title)}</strong>`;
      const entityType=effectiveMode==="managerClub"?"club":(effectiveMode==="managerNation"?"nation":"");
      const entityId=entityType==="club"?a.team_id:(entityType==="nation"?a.nation_id:"");
      const entityAttrs=entityType&&entityId?` data-career-entity-type="${entityType}" data-career-entity-id="${esc(entityId)}" data-career-entity-name="${esc(title)}"`:"";
      return `${index?`<span class="nx-career-connector-v34 ${ordered[index-1]&&!ordered[index-1].end_date?"is-after-current":""}" aria-hidden="true"></span>`:""}<article class="nx-career-card-v34 ${current?"is-current":""} ${entityAttrs?"is-clickable":""}"${entityAttrs}>${careerMediaV34(a,effectiveMode)}<div class="nx-career-copy-v34"><span class="nx-career-date-v34">${a.start_date?formatDate(a.start_date):"?"} – ${a.end_date?formatDate(a.end_date):"Presente"}</span>${titleMarkup}<span class="nx-career-role-v34">${esc(role)}</span><div class="nx-career-foot-v34"><span class="nx-career-days-v34">${esc(careerDaysLabelV33(days))}</span>${current?`<b class="nx-career-badge-v34">Attuale</b>`:""}</div></div></article>`;
    }).join("")}</div></div>`;
  }

  function renderManagerCareerBoxV33(assignments){
    const rows=assignments||[];
    const clubs=rows.filter(function(a){return !!a.team_id;});
    const nations=rows.filter(function(a){return !!a.nation_id;});
    const defaultMode=clubs.length?"club":(nations.length?"nation":"club");
    const clubContent=clubs.length?`${careerModeSummaryV35(clubs,"club")}${careerHorizontalTrackV33(clubs,"managerClub")}`:careerEmptyStateV35("club");
    const nationContent=nations.length?`${careerModeSummaryV35(nations,"nation")}${careerHorizontalTrackV33(nations,"managerNation")}`:careerEmptyStateV35("nation");
    return `<section class="nx-career-box-v34 nx-manager-career-v34"><div class="nx-career-head-v34"><div><small>MANAGER CAREER</small><h2>Game World Career</h2></div><span data-career-scroll-v35="club" ${defaultMode!=="club"||clubs.length<=1?"hidden":""}>Scorri →</span><span data-career-scroll-v35="nation" ${defaultMode!=="nation"||nations.length<=1?"hidden":""}>Scorri →</span></div><div class="nx-career-switch-v34" role="tablist" aria-label="Tipo carriera"><button type="button" data-career-mode-v34="club" class="${defaultMode==="club"?"is-active":""}">CLUB</button><button type="button" data-career-mode-v34="nation" class="${defaultMode==="nation"?"is-active":""}">NAZIONALE</button></div><div class="nx-career-panel-v34" data-career-panel-v34="club" ${defaultMode!=="club"?"hidden":""}>${clubContent}</div><div class="nx-career-panel-v34" data-career-panel-v34="nation" ${defaultMode!=="nation"?"hidden":""}>${nationContent}</div></section>`;
  }

  function bindManagerCareerSwitcherV34(root){
    if(!root)return;
    root.querySelectorAll("[data-career-mode-v34]").forEach(function(button){
      button.addEventListener("click",function(){
        const mode=button.getAttribute("data-career-mode-v34");
        const box=button.closest(".nx-manager-career-v34");
        if(!box)return;
        box.querySelectorAll("[data-career-mode-v34]").forEach(function(b){b.classList.toggle("is-active",b===button);});
        box.querySelectorAll("[data-career-panel-v34]").forEach(function(panel){panel.hidden=panel.getAttribute("data-career-panel-v34")!==mode;});
        box.querySelectorAll("[data-career-scroll-v35]").forEach(function(label){label.hidden=label.getAttribute("data-career-scroll-v35")!==mode;});
        const activePanel=box.querySelector(`[data-career-panel-v34="${mode}"]`);
        const cards=activePanel?activePanel.querySelectorAll(".nx-career-card-v34").length:0;
        const activeScroll=box.querySelector(`[data-career-scroll-v35="${mode}"]`);
        if(activeScroll)activeScroll.hidden=cards<=1;
      });
    });
  }

  function bindManagerCareerEntityLinksV35(root){
    if(!root)return;
    root.querySelectorAll("[data-career-entity-type][data-career-entity-id]").forEach(function(card){
      card.addEventListener("click",function(){
        const type=card.getAttribute("data-career-entity-type");
        const id=card.getAttribute("data-career-entity-id");
        const name=card.getAttribute("data-career-entity-name")||"";
        if(!type||!id)return;
        state.selectedManager=null;
        state.selectedCompetition=null;
        state.selectedDivision=null;
        state.entityProfileTab="stats";
        if(type==="club"){
          state.worldSection="clubs";
          state.selectedNation=null;
          state.clubProfileView="profile";
          state.selectedClub={id:id,name:name};
        }else{
          state.worldSection="national";
          state.selectedClub=null;
          state.selectedNation={id:id,name:name};
        }
        renderShell();
      });
    });
  }

  function renderEntityManagerCareerBoxV35(type,assignments){
    const rows=assignments||[];
    const isNation=type==="nation";
    const totalDays=rows.reduce(function(sum,a){return sum+(careerDaysV33(a.start_date,a.end_date)||0);},0);
    const managers=new Set(rows.map(function(a){return String(a.manager_id||"");}).filter(Boolean));
    const scroll=rows.length>1?`<span>Scorri →</span>`:"";
    const summary=rows.length?`<div class="nx-career-summary-v34">${careerSummaryItemV34("▣",rows.length===1?"incarico":"incarichi",rows.length)}${careerSummaryItemV34("◷",totalDays===1?"giorno":"giorni",new Intl.NumberFormat("it-IT").format(totalDays))}${careerSummaryItemV34("♙",isNation?"CT IMC":"manager IMC",managers.size)}</div>`:"";
    const content=rows.length?careerHorizontalTrackV33(rows,isNation?"nation":"club"):`<div class="nx-career-empty-v35 is-entity"><span aria-hidden="true">♙</span><div><strong>${isNation?"Nessun CT IMC registrato":"Nessun manager IMC registrato"}</strong><small>${isNation?"Questa nazionale non risulta ancora allenata da un CT IMC in questo Game World.":"Questo club non risulta ancora allenato da un manager IMC in questo Game World."}</small></div></div>`;
    return `<section class="nx-career-box-v34 nx-entity-career-v35"><div class="nx-career-head-v34"><div><small>${isNation?"IMC CT CAREER":"IMC MANAGER CAREER"}</small><h2>Game World Career</h2></div>${scroll}</div>${summary}${content}</section>`;
  }

  function renderEntityHistoryV11(type,assignments){
    if(!assignments.length)return `<div class="nx-empty-box"><strong>Nessun incarico IMC registrato</strong><span>Non risultano manager associati a questa entità nel Game World.</span></div>`;
    if(type==="club")return careerHorizontalTrackV33(assignments,"club");
    return `<div class="nx-career-timeline">${assignments.slice().sort(function(a,b){return String(b.start_date||"").localeCompare(String(a.start_date||""));}).map(function(a){const name=a.imc_managers&&a.imc_managers.full_name?a.imc_managers.full_name:a.manager_id;return `<div class="nx-timeline-item"><span class="nx-timeline-dot"></span><div><small>CT</small><button type="button" class="nx-inline-manager-link" data-profile-manager-id="${esc(a.manager_id)}" data-profile-manager-name="${esc(name)}">${esc(name)}</button><span>${a.start_date?formatDate(a.start_date):"?"} → ${a.end_date?formatDate(a.end_date):"oggi"}</span></div></div>`;}).join("")}</div>`;
  }

  function renderEntityH2HV11(type,entity,matches){
    const map=new Map();
    removeResultsScheduleDuplicates(matches).filter(StatisticsEngine.isPlayed).forEach(function(m){
      const p=entityPerspectiveV11(type,entity.id,m,entity.name);if(!p)return;const home=p.side==="home";
      const oppId=type==="club"?(home?m.away_team_id:m.home_team_id):(home?m.away_nation_id:m.home_nation_id);
      const oppName=type==="club"?(home?(m.away_team&&teamDisplayName(m.away_team)||"Club"):(m.home_team&&teamDisplayName(m.home_team)||"Club")):(home?(m.away_nation&&m.away_nation.nation_name||"Nazionale"):(m.home_nation&&m.home_nation.nation_name||"Nazionale"));
      const key=String(oppId||normalizeEntityName(oppName));if(!key)return;
      if(!map.has(key))map.set(key,{id:oppId,name:oppName,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,matches:[]});const r=map.get(key);
      const gf=Number(home?m.home_score:m.away_score),ga=Number(home?m.away_score:m.home_score);r.played++;r.gf+=gf;r.ga+=ga;r.matches.push(m);if(gf>ga)r.won++;else if(gf<ga)r.lost++;else r.drawn++;
    });
    const rivals=Array.from(map.values()).map(function(r){r.gd=r.gf-r.ga;r.winRate=r.played?Math.round((r.won/r.played)*1000)/10:0;return r;}).sort(function(a,b){return b.played-a.played||b.won-a.won||a.name.localeCompare(b.name,"it");});
    if(!rivals.length)return `<div class="nx-empty-box"><strong>Nessun H2H disponibile</strong><span>Servono partite giocate nel Game World.</span></div>`;
    return `<div class="nx-stat-grid nx-h2h-summary-grid">${statCard("Avversari",rivals.length)}${statCard("Partite",rivals.reduce((s,r)=>s+r.played,0))}</div><div class="nx-h2h-list">${rivals.map(function(r){return `<details class="nx-h2h-details"><summary class="nx-h2h-row"><div><strong>${esc(r.name)}</strong><span>${r.played} partite · Win ${r.winRate}%</span></div><div class="nx-stat-line"><span>V ${r.won}</span><span>N ${r.drawn}</span><span>P ${r.lost}</span><span>GF ${r.gf}</span><span>GS ${r.ga}</span><strong>DR ${formatSigned(r.gd)}</strong></div></summary><div class="nx-h2h-match-history">${r.matches.slice().sort(function(a,b){return String(b.match_date).localeCompare(String(a.match_date));}).map(function(m){const p=entityPerspectiveV11(type,entity.id,m,entity.name),home=p&&p.side==="home";const gf=home?m.home_score:m.away_score,ga=home?m.away_score:m.home_score,comp=m.competition&&m.competition.competition_name?getCompetitionDisplayName(m.competition.competition_name):"Competizione";return `<div class="nx-h2h-match"><span>${formatDate(m.match_date)} · ${esc(comp)}</span><strong>${esc(gf)} - ${esc(ga)}</strong></div>`;}).join("")}</div></details>`;}).join("")}</div>`;
  }

  function renderEntityProfileV11(type,entity,matches,assignments,honours,seasons,historicalStandings){
    const hasRoster=type==="club" && state.selectedWorld==="GW001";
    const tabs=hasRoster
      ? [{id:"roster",label:"Team Roster",icon:"♟"},{id:"stats",label:"Stats",icon:"▥"},{id:"trophies",label:"Trophy Room",icon:"♛"},{id:"h2h",label:"H2H",icon:"⚔"}]
      : [{id:"stats",label:"Stats",icon:"▥"},{id:"trophies",label:"Trophy Room",icon:"♛"},{id:"h2h",label:"H2H",icon:"⚔"}];
    const requested=state.entityProfileTab||"stats";
    const active=tabs.some(function(tab){return tab.id===requested;})?requested:"stats";
    state.entityProfileTab=active;
    const careerBox=renderEntityManagerCareerBoxV35(type,assignments);
    const rosterPanel=hasRoster?`<div data-profile-panel="roster" ${active!=="roster"?"hidden":""}></div>`:"";
    return `${careerBox}${profileTabsV11(active,tabs,hasRoster?"nx-profile-tabs-club-b44":"")}<div class="nx-profile-panels-v11">${rosterPanel}<div data-profile-panel="stats" ${active!=="stats"?"hidden":""}>${renderEntityStatsV11(type,entity,matches,seasons,historicalStandings)}</div><div data-profile-panel="trophies" ${active!=="trophies"?"hidden":""}>${renderEntityTrophiesV11(honours,seasons)}</div><div data-profile-panel="h2h" ${active!=="h2h"?"hidden":""}>${renderEntityH2HV11(type,entity,matches)}</div></div>`;
  }


  /* ============================================================
     BUILD 46 · PLAYER CODEX / TRANSFERS · GW001 ROAD TO HISTORY
     ============================================================ */

  const PLAYER_CODEX_WORLD_ID_B44="GW001";
  const PLAYER_CODEX_SEASON_ID_B44=4;
  const PLAYER_CODEX_PAGE_SIZE_B44=1000;
  const PLAYER_CODEX_IN_CHUNK_B44=150;

  function playerCodexFullNameB44(player,id){
    const full=[player&&player.first_name,player&&player.last_name].filter(Boolean).join(" ").trim();
    return full||("Player #"+String(id||""));
  }

  function playerCodexImageUrlB44(player){
    if(!player)return "";
    return player.image_url||player.image_action_url||player.image_peak_url||player.image_youth_url||"";
  }

  function playerCodexInitialsB44(name){
    const parts=String(name||"").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0,2).map(function(part){return part.charAt(0).toUpperCase();}).join("")||"PC";
  }

  function playerCodexImageB44(player,name,variant){
    const url=playerCodexImageUrlB44(player);
    const cls=variant?" "+variant:"";
    if(!url)return `<span class="nx-player-photo-fallback-b44${cls}">${esc(playerCodexInitialsB44(name))}</span>`;
    return `<span class="nx-player-photo-b44${cls}"><img src="${esc(url)}" alt="${esc(name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"><span class="nx-player-photo-fallback-b44">${esc(playerCodexInitialsB44(name))}</span></span>`;
  }

  function formatPlayerMoneyB44(value){
    if(value===null||value===undefined||value==="")return "—";
    const number=Number(value);
    if(!Number.isFinite(number))return String(value);
    const abs=Math.abs(number);
    let scaled=number,suffix="";
    if(abs>=1000000000){scaled=number/1000000000;suffix="B";}
    else if(abs>=1000000){scaled=number/1000000;suffix="M";}
    else if(abs>=1000){scaled=number/1000;suffix="K";}
    const digits=suffix?(Math.abs(scaled)>=100?0:1):(Number.isInteger(number)?0:2);
    return "€"+scaled.toFixed(digits).replace(/\.0+$/g,"").replace(/(\.[0-9]*?)0+$/g,"$1")+suffix;
  }

  function formatPlayerNumberB44(value,digits){
    const number=Number(value);
    if(value===null||value===undefined||value===""||!Number.isFinite(number))return "—";
    return number.toFixed(digits||0).replace(/\.0$/g,"");
  }

  function formatContractYearsB44(value){
    if(value===null||value===undefined||value==="")return "—";
    const number=Number(value);
    if(!Number.isFinite(number))return String(value);
    return String(number)+(number===1?" anno":" anni");
  }

  async function fetchPlayerCodexTransfersB44(filters){
    if(!state.client)return [];
    const opts=filters||{};
    const rows=[];
    let from=0;
    while(true){
      let query=state.client
        .from("player_codex_transfers")
        .select("transfer_id,player_codex_player_id,rth_team_id,transfer_date,direction,position,rating,transfer_value,counterpart_club_name,counterpart_sm_club_id,created_at")
        .order("transfer_date",{ascending:true})
        .order("transfer_id",{ascending:true})
        .range(from,from+PLAYER_CODEX_PAGE_SIZE_B44-1);
      if(opts.teamId!==undefined&&opts.teamId!==null)query=query.eq("rth_team_id",opts.teamId);
      if(opts.playerId!==undefined&&opts.playerId!==null)query=query.eq("player_codex_player_id",opts.playerId);
      const result=await query;
      if(result.error)throw result.error;
      const page=result.data||[];
      rows.push.apply(rows,page);
      if(page.length<PLAYER_CODEX_PAGE_SIZE_B44)break;
      from+=PLAYER_CODEX_PAGE_SIZE_B44;
    }
    return rows;
  }

  async function fetchPlayerMastersB44(ids){
    const values=Array.from(new Set((ids||[]).filter(function(id){return id!==null&&id!==undefined&&id!=="";})));
    const map=new Map();
    for(let i=0;i<values.length;i+=PLAYER_CODEX_IN_CHUNK_B44){
      const chunk=values.slice(i,i+PLAYER_CODEX_IN_CHUNK_B44);
      const result=await state.client
        .from("sm_players_master")
        .select("player_codex_player_id,first_name,last_name,image_filename,image_url,image_action_url,image_peak_url,image_youth_url")
        .in("player_codex_player_id",chunk);
      if(result.error)throw result.error;
      (result.data||[]).forEach(function(row){map.set(String(row.player_codex_player_id),row);});
    }
    return map;
  }

  async function fetchLatestPlayerSnapshotsB44(ids){
    const values=Array.from(new Set((ids||[]).filter(function(id){return id!==null&&id!==undefined&&id!=="";})));
    const map=new Map();
    for(let i=0;i<values.length;i+=PLAYER_CODEX_IN_CHUNK_B44){
      const chunk=values.slice(i,i+PLAYER_CODEX_IN_CHUNK_B44);
      let from=0;
      while(true){
        const result=await state.client
          .from("player_codex_player_snapshots")
          .select("snapshot_id,player_codex_player_id,snapshot_date,position,age,rating,market_value,rating_change_date,rating_change,created_at")
          .in("player_codex_player_id",chunk)
          .order("snapshot_date",{ascending:false})
          .order("snapshot_id",{ascending:false})
          .range(from,from+PLAYER_CODEX_PAGE_SIZE_B44-1);
        if(result.error)throw result.error;
        const page=result.data||[];
        page.forEach(function(row){
          const key=String(row.player_codex_player_id);
          if(!map.has(key))map.set(key,row);
        });
        if(page.length<PLAYER_CODEX_PAGE_SIZE_B44)break;
        from+=PLAYER_CODEX_PAGE_SIZE_B44;
      }
    }
    return map;
  }

  async function fetchLatestRosterSnapshotsB44(ids,teamId){
    const values=Array.from(new Set((ids||[]).filter(function(id){return id!==null&&id!==undefined&&id!=="";})));
    const map=new Map();
    for(let i=0;i<values.length;i+=PLAYER_CODEX_IN_CHUNK_B44){
      const chunk=values.slice(i,i+PLAYER_CODEX_IN_CHUNK_B44);
      let from=0;
      while(true){
        let query=state.client
          .from("player_codex_roster_snapshots")
          .select("roster_snapshot_id,player_codex_player_id,season_id,rth_team_id,snapshot_date,no_transfer_until,contract_years,salary,created_at")
          .eq("season_id",PLAYER_CODEX_SEASON_ID_B44)
          .eq("rth_team_id",teamId)
          .in("player_codex_player_id",chunk)
          .order("snapshot_date",{ascending:false})
          .order("roster_snapshot_id",{ascending:false})
          .range(from,from+PLAYER_CODEX_PAGE_SIZE_B44-1);
        const result=await query;
        if(result.error)throw result.error;
        const page=result.data||[];
        page.forEach(function(row){
          const key=String(row.player_codex_player_id);
          if(!map.has(key))map.set(key,row);
        });
        if(page.length<PLAYER_CODEX_PAGE_SIZE_B44)break;
        from+=PLAYER_CODEX_PAGE_SIZE_B44;
      }
    }
    return map;
  }

  async function fetchGwTeamsB44(ids){
    const values=Array.from(new Set((ids||[]).filter(function(id){return id!==null&&id!==undefined&&id!=="";})));
    const map=new Map();
    for(let i=0;i<values.length;i+=PLAYER_CODEX_IN_CHUNK_B44){
      const chunk=values.slice(i,i+PLAYER_CODEX_IN_CHUNK_B44);
      const result=await state.client
        .from("gw_teams")
        .select("team_id,sm_club_id,game_world_id,team_name,display_name,team_type")
        .eq("game_world_id",PLAYER_CODEX_WORLD_ID_B44)
        .in("team_id",chunk);
      if(result.error)throw result.error;
      (result.data||[]).forEach(function(row){map.set(String(row.team_id),row);});
    }
    return map;
  }

  function buildPlayerRthStateB44(transfers){
    const players=new Map();
    (transfers||[]).forEach(function(row){
      const playerKey=String(row.player_codex_player_id);
      const teamKey=String(row.rth_team_id);
      if(!players.has(playerKey))players.set(playerKey,{id:row.player_codex_player_id,teams:new Map(),events:[],lastEvent:null});
      const player=players.get(playerKey);
      if(!player.teams.has(teamKey))player.teams.set(teamKey,{teamId:row.rth_team_id,balance:0,lastEvent:null});
      const team=player.teams.get(teamKey);
      if(String(row.direction).toUpperCase()==="IN")team.balance+=1;
      else if(String(row.direction).toUpperCase()==="OUT")team.balance-=1;
      team.lastEvent=row;
      player.events.push(row);
      player.lastEvent=row;
    });
    players.forEach(function(player){
      const activeTeams=Array.from(player.teams.values()).filter(function(team){return team.balance===1;});
      activeTeams.sort(function(a,b){
        return String((b.lastEvent&&b.lastEvent.transfer_date)||"").localeCompare(String((a.lastEvent&&a.lastEvent.transfer_date)||""));
      });
      player.activeTeam=activeTeams.length?activeTeams[0]:null;
      player.active=Boolean(player.activeTeam);
      player.lastTeamId=player.lastEvent?player.lastEvent.rth_team_id:null;
    });
    return players;
  }

  function teamActivePlayerIdsB44(transfers){
    const balances=new Map();
    (transfers||[]).forEach(function(row){
      const key=String(row.player_codex_player_id);
      const value=balances.get(key)||{id:row.player_codex_player_id,balance:0};
      if(String(row.direction).toUpperCase()==="IN")value.balance+=1;
      else if(String(row.direction).toUpperCase()==="OUT")value.balance-=1;
      balances.set(key,value);
    });
    return Array.from(balances.values()).filter(function(row){return row.balance===1;}).map(function(row){return row.id;});
  }

  function teamNameFromMapB44(teamId,teams){
    const team=teams&&teams.get(String(teamId));
    if(team)return teamDisplayName(team,PLAYER_CODEX_WORLD_ID_B44)||("Team #"+teamId);
    if(state.selectedClub&&String(state.selectedClub.id)===String(teamId))return state.selectedClub.name;
    return "Team #"+String(teamId||"");
  }

  function playerCodexArchivePageB44(){
    setTimeout(function(){loadPlayerCodexArchiveB44();},0);
    return `<style>
      .nx-codex-tools-b51{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
      .nx-codex-tool-b51,.nx-codex-sort-b51{min-height:48px;border:1px solid #d9e1ed;border-radius:15px;background:#fff;color:#18325d;font:inherit;font-size:12px;font-weight:900;box-sizing:border-box}
      .nx-codex-tool-b51{display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.nx-codex-tool-b51.is-open{border-color:#6e99e8;background:#eef4ff;color:#245bb5}.nx-codex-tool-b51 b{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 5px;border-radius:999px;background:#315fba;color:#fff;font-size:10px;box-sizing:border-box}
      .nx-codex-sort-b51{width:100%;padding:0 12px}
      .nx-codex-advanced-b51{margin-top:10px;border:1px solid #dce4ef;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 8px 22px rgba(15,35,70,.05)}.nx-codex-advanced-b51[hidden]{display:none!important}
      .nx-codex-advanced-head-b51{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;border-bottom:1px solid #e9edf4}.nx-codex-advanced-head-b51 small{display:block;color:#7a879c;font-size:9px;font-weight:950;letter-spacing:.13em}.nx-codex-advanced-head-b51 strong{display:block;margin-top:3px;color:#0d244b;font-size:16px}.nx-codex-close-b51{border:0;background:transparent;color:#315fba;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
      .nx-codex-filter-grid-b51{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px}.nx-codex-filter-field-b51{display:flex;flex-direction:column;gap:6px;min-width:0}.nx-codex-filter-field-b51.is-wide{grid-column:1/-1}.nx-codex-filter-field-b51>span{color:#78859a;font-size:9px;font-weight:900}.nx-codex-filter-field-b51 select,.nx-codex-filter-field-b51 input{width:100%;min-height:42px;padding:0 10px;border:1px solid #dce3ed;border-radius:12px;background:#f8fafd;color:#152b51;font:inherit;font-size:11px;font-weight:800;box-sizing:border-box}.nx-codex-range-b51{display:grid;grid-template-columns:1fr auto 1fr;gap:7px;align-items:center}.nx-codex-range-b51>i{color:#8994a6;font-style:normal;font-size:10px;font-weight:900}
      .nx-codex-filter-actions-b51{display:grid;grid-template-columns:1fr 1.4fr;gap:9px;padding:0 14px 14px}.nx-codex-filter-actions-b51 button{min-height:44px;border-radius:13px;font:inherit;font-size:11px;font-weight:950;cursor:pointer}.nx-codex-reset-b51{border:1px solid #cfd9e7;background:#fff;color:#315fba}.nx-codex-apply-b51{border:0;background:#0d2b5d;color:#fff}
      @media(max-width:520px){.nx-codex-tools-b51{gap:8px}.nx-codex-tool-b51,.nx-codex-sort-b51{min-height:44px;border-radius:13px;font-size:10px}.nx-codex-filter-grid-b51{gap:8px;padding:12px}.nx-codex-filter-field-b51 select,.nx-codex-filter-field-b51 input{min-height:40px;font-size:10px}.nx-codex-filter-actions-b51{padding:0 12px 12px}.nx-codex-advanced-head-b51{padding:12px}.nx-codex-advanced-head-b51 strong{font-size:14px}}
    </style><section class="nx-card nx-player-codex-page-b44">
      <div class="nx-codex-hero-b44">
        <div><small>IMC · PLAYER DATABASE</small><h1>Player Codex</h1><p>GW001 · Road To History</p></div>
        <span class="nx-codex-mark-b44">${nexusNavIcon("codex")}</span>
      </div>
      <div class="nx-codex-controls-b44">
        <div class="nx-codex-filter-b44" role="group" aria-label="Filtro Player Codex">
<button type="button" data-codex-filter="all" class="${state.playerCodexFilter==="all"?"is-active":""}">ALL <b id="codexCountAll">—</b></button>
<button type="button" data-codex-filter="active" class="${state.playerCodexFilter==="active"?"is-active":""}">ACTIVE IN RTH <b id="codexCountActive">—</b></button>
<button type="button" data-codex-filter="former" class="${state.playerCodexFilter==="former"?"is-active":""}">FORMER RTH <b id="codexCountFormer">—</b></button>
        </div>
        <label class="nx-codex-search-b44"><span>⌕</span><input id="playerCodexSearch" type="search" value="${esc(state.playerCodexSearch)}" placeholder="Cerca giocatore…" autocomplete="off"></label>
        <div class="nx-codex-tools-b51">
<button type="button" id="playerCodexAdvancedToggleB51" class="nx-codex-tool-b51 ${state.playerCodexAdvancedOpen?"is-open":""}">☷ Filtri <b id="playerCodexAdvancedCountB51">0</b></button>
<select id="playerCodexSortB51" class="nx-codex-sort-b51" aria-label="Ordina Player Codex">
  <option value="rating_desc" ${state.playerCodexSort==="rating_desc"?"selected":""}>Rating ↓</option>
  <option value="rating_asc" ${state.playerCodexSort==="rating_asc"?"selected":""}>Rating ↑</option>
  <option value="value_desc" ${state.playerCodexSort==="value_desc"?"selected":""}>Valore ↓</option>
  <option value="value_asc" ${state.playerCodexSort==="value_asc"?"selected":""}>Valore ↑</option>
  <option value="age_asc" ${state.playerCodexSort==="age_asc"?"selected":""}>Età ↑</option>
  <option value="age_desc" ${state.playerCodexSort==="age_desc"?"selected":""}>Età ↓</option>
  <option value="name_asc" ${state.playerCodexSort==="name_asc"?"selected":""}>Nome A–Z</option>
</select>
        </div>
        <div id="playerCodexAdvancedPanelB51" class="nx-codex-advanced-b51" ${state.playerCodexAdvancedOpen?"":"hidden"}>
<div class="nx-codex-advanced-head-b51"><div><small>FILTRI PLAYER CODEX</small><strong>Ricerca avanzata</strong></div><button type="button" id="playerCodexAdvancedCloseB51" class="nx-codex-close-b51">Chiudi ↑</button></div>
<div class="nx-codex-filter-grid-b51">
  <label class="nx-codex-filter-field-b51"><span>Club RTH attuale</span><select id="playerCodexClubB51"><option value="all">Qualsiasi</option></select></label>
  <label class="nx-codex-filter-field-b51"><span>Posizione</span><select id="playerCodexPositionB51"><option value="all">Qualsiasi</option><option value="PT">PT</option><option value="D">D</option><option value="CD">CD</option><option value="CC">CC</option><option value="CO">CO</option><option value="A">A</option></select></label>
  <label class="nx-codex-filter-field-b51"><span>Rating compreso tra</span><span class="nx-codex-range-b51"><input id="playerCodexRatingMinB51" type="number" min="40" max="99" placeholder="Min" value="${esc(state.playerCodexRatingMin)}"><i>e</i><input id="playerCodexRatingMaxB51" type="number" min="40" max="99" placeholder="Max" value="${esc(state.playerCodexRatingMax)}"></span></label>
  <label class="nx-codex-filter-field-b51"><span>Età compresa tra</span><span class="nx-codex-range-b51"><input id="playerCodexAgeMinB51" type="number" min="15" max="60" placeholder="Min" value="${esc(state.playerCodexAgeMin)}"><i>e</i><input id="playerCodexAgeMaxB51" type="number" min="15" max="60" placeholder="Max" value="${esc(state.playerCodexAgeMax)}"></span></label>
  <label class="nx-codex-filter-field-b51 is-wide"><span>Valore (€M) compreso tra</span><span class="nx-codex-range-b51"><input id="playerCodexValueMinB51" type="number" min="0" step="0.1" placeholder="Min" value="${esc(state.playerCodexValueMin)}"><i>e</i><input id="playerCodexValueMaxB51" type="number" min="0" step="0.1" placeholder="Max" value="${esc(state.playerCodexValueMax)}"></span></label>
</div>
<div class="nx-codex-filter-actions-b51"><button type="button" id="playerCodexResetB51" class="nx-codex-reset-b51">Reset</button><button type="button" id="playerCodexApplyB51" class="nx-codex-apply-b51">Applica filtri</button></div>
        </div>
      </div>
      <div id="playerCodexArchiveContent"><div class="nx-loading">Caricamento Player Codex…</div></div>
    </section>`;
  }

  function bindPlayerCodexArchivePageB44(){
    document.querySelectorAll("[data-codex-filter]").forEach(function(button){
      button.addEventListener("click",function(){
        state.playerCodexFilter=button.getAttribute("data-codex-filter")||"all";
        document.querySelectorAll("[data-codex-filter]").forEach(function(item){item.classList.toggle("is-active",item===button);});
        applyPlayerCodexFiltersB44();
      });
    });
    const search=document.getElementById("playerCodexSearch");
    if(search)search.addEventListener("input",function(){state.playerCodexSearch=search.value||"";applyPlayerCodexFiltersB44();});
    const toggle=document.getElementById("playerCodexAdvancedToggleB51"),panel=document.getElementById("playerCodexAdvancedPanelB51"),close=document.getElementById("playerCodexAdvancedCloseB51");
    function setOpen(open){state.playerCodexAdvancedOpen=!!open;if(panel)panel.hidden=!open;if(toggle)toggle.classList.toggle("is-open",!!open);}
    if(toggle)toggle.addEventListener("click",function(){setOpen(!state.playerCodexAdvancedOpen);});
    if(close)close.addEventListener("click",function(){setOpen(false);});
    const sort=document.getElementById("playerCodexSortB51");
    if(sort)sort.addEventListener("change",function(){state.playerCodexSort=sort.value||"rating_desc";applyPlayerCodexFiltersB44();});
    const bindings=[
      ["playerCodexClubB51","playerCodexClub"],["playerCodexPositionB51","playerCodexPosition"],
      ["playerCodexRatingMinB51","playerCodexRatingMin"],["playerCodexRatingMaxB51","playerCodexRatingMax"],
      ["playerCodexAgeMinB51","playerCodexAgeMin"],["playerCodexAgeMaxB51","playerCodexAgeMax"],
      ["playerCodexValueMinB51","playerCodexValueMin"],["playerCodexValueMaxB51","playerCodexValueMax"]
    ];
    bindings.forEach(function(pair){const el=document.getElementById(pair[0]);if(el){el.value=state[pair[1]]||"";el.addEventListener(el.tagName==="SELECT"?"change":"input",function(){state[pair[1]]=el.value||"";applyPlayerCodexFiltersB44();});}});
    const reset=document.getElementById("playerCodexResetB51");
    if(reset)reset.addEventListener("click",function(){
      state.playerCodexClub="all";state.playerCodexPosition="all";state.playerCodexRatingMin="";state.playerCodexRatingMax="";state.playerCodexAgeMin="";state.playerCodexAgeMax="";state.playerCodexValueMin="";state.playerCodexValueMax="";
      bindings.forEach(function(pair){const el=document.getElementById(pair[0]);if(el)el.value=(pair[1]==="playerCodexClub"||pair[1]==="playerCodexPosition")?"all":"";});applyPlayerCodexFiltersB44();
    });
    const apply=document.getElementById("playerCodexApplyB51");if(apply)apply.addEventListener("click",function(){applyPlayerCodexFiltersB44();setOpen(false);});
  }

  function populatePlayerCodexAdvancedOptionsB51(){
    const select=document.getElementById("playerCodexClubB51");if(!select)return;
    const current=state.playerCodexClub||"all",clubs=new Set();
    document.querySelectorAll(".nx-player-card-b44[data-codex-club]").forEach(function(card){const club=String(card.getAttribute("data-codex-club")||"").trim();if(club)clubs.add(club);});
    select.innerHTML='<option value="all">Qualsiasi</option>'+Array.from(clubs).sort(function(a,b){return a.localeCompare(b,"it");}).map(function(club){return '<option value="'+esc(club)+'">'+esc(club)+'</option>';}).join("");
    select.value=Array.from(select.options).some(function(o){return o.value===current;})?current:"all";state.playerCodexClub=select.value;
    const position=document.getElementById("playerCodexPositionB51");if(position)position.value=state.playerCodexPosition||"all";
  }

  function applyPlayerCodexFiltersB44(){
    const filter=state.playerCodexFilter||"all",query=String(state.playerCodexSearch||"").trim().toLowerCase();
    const club=state.playerCodexClub||"all",position=state.playerCodexPosition||"all";
    const ratingMin=state.playerCodexRatingMin===""?null:Number(state.playerCodexRatingMin),ratingMax=state.playerCodexRatingMax===""?null:Number(state.playerCodexRatingMax);
    const ageMin=state.playerCodexAgeMin===""?null:Number(state.playerCodexAgeMin),ageMax=state.playerCodexAgeMax===""?null:Number(state.playerCodexAgeMax);
    const valueMin=state.playerCodexValueMin===""?null:Number(state.playerCodexValueMin)*1000000,valueMax=state.playerCodexValueMax===""?null:Number(state.playerCodexValueMax)*1000000;
    let visible=0;
    const cards=Array.from(document.querySelectorAll(".nx-player-card-b44[data-codex-status]"));
    cards.forEach(function(card){
      const status=card.getAttribute("data-codex-status"),haystack=String(card.getAttribute("data-codex-search")||"").toLowerCase();
      const cardClub=card.getAttribute("data-codex-club")||"",cardPos=card.getAttribute("data-codex-position")||"";
      const rating=Number(card.getAttribute("data-codex-rating")),age=Number(card.getAttribute("data-codex-age")),value=Number(card.getAttribute("data-codex-value"));
      const parts=cardPos.split(",").map(function(x){return x.trim();});
      const posOk=position==="all"||parts.some(function(part){return part===position||part.indexOf(position+"(")===0;});
      const show=(filter==="all"||filter===status)&&(!query||haystack.includes(query))&&(club==="all"||cardClub===club)&&posOk
        &&(ratingMin===null||rating>=ratingMin)&&(ratingMax===null||rating<=ratingMax)
        &&(ageMin===null||age>=ageMin)&&(ageMax===null||age<=ageMax)
        &&(valueMin===null||value>=valueMin)&&(valueMax===null||value<=valueMax);
      card.hidden=!show;if(show)visible+=1;
    });
    const grid=document.querySelector(".nx-player-grid-b44"),sort=state.playerCodexSort||"rating_desc";
    function num(card,key){const n=Number(card.getAttribute(key));return Number.isFinite(n)?n:null;}
    function name(card){return String(card.getAttribute("data-codex-name")||"");}
    cards.sort(function(a,b){
      let av,bv;if(sort.indexOf("rating_")===0){av=num(a,"data-codex-rating");bv=num(b,"data-codex-rating");}
      else if(sort.indexOf("value_")===0){av=num(a,"data-codex-value");bv=num(b,"data-codex-value");}
      else if(sort.indexOf("age_")===0){av=num(a,"data-codex-age");bv=num(b,"data-codex-age");}
      else return name(a).localeCompare(name(b),"it");
      if(av===null&&bv!==null)return 1;if(bv===null&&av!==null)return -1;if(av!==bv)return sort.endsWith("desc")?bv-av:av-bv;return name(a).localeCompare(name(b),"it");
    });
    if(grid)cards.forEach(function(card){grid.appendChild(card);});
    const active=[club!=="all",position!=="all",state.playerCodexRatingMin!=="",state.playerCodexRatingMax!=="",state.playerCodexAgeMin!=="",state.playerCodexAgeMax!=="",state.playerCodexValueMin!=="",state.playerCodexValueMax!==""].filter(Boolean).length;
    const count=document.getElementById("playerCodexAdvancedCountB51");if(count)count.textContent=String(active);
    const empty=document.getElementById("playerCodexFilteredEmpty");if(empty)empty.hidden=visible!==0;
  }

  async function loadPlayerCodexArchiveB44(){
    const target=document.getElementById("playerCodexArchiveContent");
    if(!target||!state.client)return;
    try{
      const transfers=await fetchPlayerCodexTransfersB44();
      const playerState=buildPlayerRthStateB44(transfers);
      const ids=Array.from(playerState.values()).map(function(row){return row.id;});
      if(!ids.length){
        target.innerHTML=`<div class="nx-empty-box"><strong>Player Codex vuoto</strong><span>Nessun trasferimento RTH è ancora disponibile.</span></div>`;
        return;
      }
      const teamIds=[];
      playerState.forEach(function(row){row.teams.forEach(function(team){teamIds.push(team.teamId);});});
      const results=await Promise.all([fetchPlayerMastersB44(ids),fetchLatestPlayerSnapshotsB44(ids),fetchGwTeamsB44(teamIds)]);
      const masters=results[0],snapshots=results[1],teams=results[2];
      const rows=Array.from(playerState.values()).map(function(rth){
        const id=String(rth.id),player=masters.get(id)||null,snapshot=snapshots.get(id)||null;
        const name=playerCodexFullNameB44(player,rth.id);
        return {id:rth.id,name:name,player:player,snapshot:snapshot,rth:rth,currentClub:rth.activeTeam?teamNameFromMapB44(rth.activeTeam.teamId,teams):""};
      }).sort(function(a,b){
        const ra=Number(a.snapshot&&a.snapshot.rating),rb=Number(b.snapshot&&b.snapshot.rating);
        if(Number.isFinite(ra)&&Number.isFinite(rb)&&ra!==rb)return rb-ra;
        const va=Number(a.snapshot&&a.snapshot.market_value),vb=Number(b.snapshot&&b.snapshot.market_value);
        if(Number.isFinite(va)&&Number.isFinite(vb)&&va!==vb)return vb-va;
        return a.name.localeCompare(b.name,"it");
      });
      const active=rows.filter(function(row){return row.rth.active;}).length;
      const former=rows.length-active;
      const allCount=document.getElementById("codexCountAll"),activeCount=document.getElementById("codexCountActive"),formerCount=document.getElementById("codexCountFormer");
      if(allCount)allCount.textContent=rows.length;if(activeCount)activeCount.textContent=active;if(formerCount)formerCount.textContent=former;
      target.innerHTML=`<div class="nx-player-grid-b44">${rows.map(function(row){
        const snap=row.snapshot||{};
        const status=row.rth.active?"active":"former";
        const statusLabel=row.rth.active?"ACTIVE IN RTH":"FORMER RTH";
        return `<article class="nx-player-card-b44" data-codex-status="${status}" data-codex-name="${esc(row.name)}" data-codex-club="${esc(row.currentClub||"")}" data-codex-position="${esc(snap.position||"")}" data-codex-rating="${esc(snap.rating==null?"":snap.rating)}" data-codex-age="${esc(snap.age==null?"":snap.age)}" data-codex-value="${esc(snap.market_value==null?"":snap.market_value)}" data-codex-search="${esc((row.name+" "+row.id+" "+row.currentClub+" "+(snap.position||"")).toLowerCase())}">
          <button type="button" class="nx-player-card-hit-b44" data-codex-player-id="${esc(row.id)}" data-codex-player-name="${esc(row.name)}">
            ${playerCodexImageB44(row.player,row.name,"is-card")}
            <span class="nx-player-card-copy-b44"><small>PLAYER CODEX ID · ${esc(row.id)}</small><strong>${esc(row.name)}</strong><em>${esc(snap.position||"Posizione n/d")}</em></span>
            <span class="nx-player-card-data-b44"><b>${esc(formatPlayerNumberB44(snap.rating,0))}<small>RATING</small></b><b>${esc(formatPlayerMoneyB44(snap.market_value))}<small>VALORE</small></b></span>
            <span class="nx-player-status-b44 ${status}">${statusLabel}</span>
            <span class="nx-player-club-b44">${row.rth.active?esc(row.currentClub):"Ultimo status: fuori da RTH"}</span>
          </button>
        </article>`;
      }).join("")}</div><div id="playerCodexFilteredEmpty" class="nx-empty-box" hidden><strong>Nessun giocatore trovato</strong><span>Modifica ricerca o filtro.</span></div>`;
      target.querySelectorAll("[data-codex-player-id]").forEach(function(button){
        button.addEventListener("click",function(){
          state.selectedPlayer={id:button.getAttribute("data-codex-player-id"),name:button.getAttribute("data-codex-player-name")||"Player"};
          state.playerCodexReturn={kind:"archive"};
          renderShell();
        });
      });
      populatePlayerCodexAdvancedOptionsB51();
      applyPlayerCodexFiltersB44();
    }catch(error){
      target.innerHTML=`<div class="nx-empty-box"><strong>Errore Player Codex</strong><span>${esc(error.message||"Impossibile leggere il database.")}</span></div>`;
    }
  }

  function teamRosterPageB44(){
    const club=state.selectedClub;
    const visual=club?entityVisual("club",club.name):"";
    setTimeout(function(){loadTeamRosterB44();},0);
    return `<section class="nx-card nx-team-roster-page-b44">
      <button class="nx-back-link" id="backToClubProfileB44">‹ Club Profile</button>
      <div class="nx-roster-hero-b44">
        <div class="nx-roster-club-logo-b44">${visual}</div>
        <div><small>TEAM ROSTER</small><h1>${esc(club?club.name:"")}</h1><p>GW001 · Road To History</p><span class="nx-roster-updated-b44" id="teamRosterUpdatedB44">Aggiornamento dati…</span></div>
      </div>
      <div id="teamRosterContentB44"><div class="nx-loading">Ricostruzione rosa attiva…</div></div>
    </section>`;
  }

  function bindTeamRosterPageB44(){
    const back=document.getElementById("backToClubProfileB44");
    if(back)back.addEventListener("click",function(){state.clubProfileView="profile";state.entityProfileTab="stats";renderShell();});
  }

  function numericValuesB44(rows,getter){
    return (rows||[]).map(getter).filter(function(value){return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));}).map(Number);
  }

  function averageB44(values){
    return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;
  }

  function completeSumB44(rows,getter){
    if(!rows.length)return null;
    const values=numericValuesB44(rows,getter);
    return values.length===rows.length?values.reduce(function(sum,value){return sum+value;},0):null;
  }

  async function loadTeamRosterB44(){
    const target=document.getElementById("teamRosterContentB44");
    const club=state.selectedClub;
    if(!target||!club||!state.client)return;
    try{
      const transfers=await fetchPlayerCodexTransfersB44({teamId:club.id});
      const activeIds=teamActivePlayerIdsB44(transfers);
      if(!activeIds.length){
        target.innerHTML=`<div class="nx-empty-box"><strong>Nessun giocatore attivo</strong><span>La cronologia IN/OUT non restituisce una rosa attiva per questo club.</span></div>`;
        return;
      }
      const results=await Promise.all([fetchPlayerMastersB44(activeIds),fetchLatestPlayerSnapshotsB44(activeIds),fetchLatestRosterSnapshotsB44(activeIds,club.id)]);
      const masters=results[0],snapshots=results[1],rosters=results[2];
      const rows=activeIds.map(function(playerId){
        const id=String(playerId),player=masters.get(id)||null,snapshot=snapshots.get(id)||null,roster=rosters.get(id)||null;
        return {id:playerId,name:playerCodexFullNameB44(player,playerId),player:player,snapshot:snapshot,roster:roster};
      }).sort(function(a,b){
        const ra=Number(a.snapshot&&a.snapshot.rating),rb=Number(b.snapshot&&b.snapshot.rating);
        if(Number.isFinite(rb)&&Number.isFinite(ra)&&rb!==ra)return rb-ra;
        return a.name.localeCompare(b.name,"it");
      });
      const ratings=numericValuesB44(rows,function(row){return row.snapshot&&row.snapshot.rating;});
      const ages=numericValuesB44(rows,function(row){return row.snapshot&&row.snapshot.age;});
      const totalValue=completeSumB44(rows,function(row){return row.snapshot&&row.snapshot.market_value;});
      const totalSalary=completeSumB44(rows,function(row){return row.roster&&row.roster.salary;});
      const rosterUpdateDates=[];
      rows.forEach(function(row){
        if(row.snapshot&&row.snapshot.snapshot_date)rosterUpdateDates.push(row.snapshot.snapshot_date);
        if(row.roster&&row.roster.snapshot_date)rosterUpdateDates.push(row.roster.snapshot_date);
      });
      rosterUpdateDates.sort(function(a,b){return String(b).localeCompare(String(a));});
      const rosterUpdated=document.getElementById("teamRosterUpdatedB44");
      if(rosterUpdated)rosterUpdated.textContent=rosterUpdateDates.length?"Aggiornato al "+formatDate(rosterUpdateDates[0]):"Aggiornamento n/d";
      target.innerHTML=`<div class="nx-roster-kpis-b44">
        ${statCard("Giocatori attivi",rows.length)}
        ${statCard("Rating medio",ratings.length?formatPlayerNumberB44(averageB44(ratings),1):"—")}
        ${statCard("Età media",ages.length?formatPlayerNumberB44(averageB44(ages),1):"—")}
        ${statCard("Valore rosa",formatPlayerMoneyB44(totalValue))}
        ${statCard("Monte stipendi",formatPlayerMoneyB44(totalSalary))}
      </div>
      <div class="nx-roster-list-b44">${rows.map(function(row){
        const snap=row.snapshot||{},roster=row.roster||{};
        return `<button type="button" class="nx-roster-player-b44" data-roster-player-id="${esc(row.id)}" data-roster-player-name="${esc(row.name)}">
          ${playerCodexImageB44(row.player,row.name,"is-roster")}
          <span class="nx-roster-player-main-b44"><small>PLAYER CODEX ID · ${esc(row.id)}</small><strong>${esc(row.name)}</strong><em>${esc(snap.position||"Posizione n/d")}</em></span>
          <span class="nx-roster-player-rating-b44"><strong>${esc(formatPlayerNumberB44(snap.rating,0))}</strong><small>RATING</small></span>
          <span class="nx-roster-player-meta-b44">
            <b>ETÀ <span>${esc(formatPlayerNumberB44(snap.age,0))}</span></b>
            <b>VALORE <span>${esc(formatPlayerMoneyB44(snap.market_value))}</span></b>
            <b>CONTRATTO <span>${esc(formatContractYearsB44(roster.contract_years))}</span></b>
            <b>STIPENDIO <span>${esc(formatPlayerMoneyB44(roster.salary))}</span></b>
            ${roster.no_transfer_until?`<b class="is-nt">NT <span>${esc(formatDate(roster.no_transfer_until))}</span></b>`:""}
          </span>
          <span class="nx-roster-player-arrow-b44">›</span>
        </button>`;
      }).join("")}</div>`;
      target.querySelectorAll("[data-roster-player-id]").forEach(function(button){
        button.addEventListener("click",function(){
          state.playerCodexReturn={kind:"roster",club:{id:club.id,name:club.name}};
          state.selectedPlayer={id:button.getAttribute("data-roster-player-id"),name:button.getAttribute("data-roster-player-name")||"Player"};
          state.selectedClub=null;
          state.clubProfileView="profile";
          state.worldSection="player-codex";
          renderShell();
        });
      });
    }catch(error){
      target.innerHTML=`<div class="nx-empty-box"><strong>Errore Team Roster</strong><span>${esc(error.message||"Impossibile ricostruire la rosa.")}</span></div>`;
    }
  }

  function transfersPageB44(){
    setTimeout(function(){loadTransfersPageB44();},0);
    return `<section class="nx-card nx-transfers-page-b44">
      <div class="nx-transfers-hero-b44">
        <div><small>IMC · TRANSFER REGISTER</small><h1>Transfers</h1><p>GW001 · Road To History</p><span id="transfersUpdatedB44">Aggiornamento dati…</span></div>
        <span class="nx-transfers-mark-b44">${nexusNavIcon("transfers")}</span>
      </div>
      <div class="nx-transfers-controls-b44">
        <div class="nx-transfer-filter-b44" role="group" aria-label="Filtro direzione trasferimenti">
          <button type="button" data-transfer-direction="all" class="${state.transferDirectionFilter==="all"?"is-active":""}">ALL <b id="transferCountAllB44">—</b></button>
          <button type="button" data-transfer-direction="in" class="${state.transferDirectionFilter==="in"?"is-active":""}">IN <b id="transferCountInB44">—</b></button>
          <button type="button" data-transfer-direction="out" class="${state.transferDirectionFilter==="out"?"is-active":""}">OUT <b id="transferCountOutB44">—</b></button>
        </div>
        <label class="nx-transfer-search-b44"><span>⌕</span><input id="transferSearchB44" type="search" value="${esc(state.transferSearch)}" placeholder="Cerca giocatore o club…" autocomplete="off"></label>
        <label class="nx-transfer-club-filter-b44"><span>CLUB RTH</span><select id="transferClubFilterB44"><option value="all">Tutti i club</option></select></label>
      </div>
      <div id="transfersContentB44"><div class="nx-loading">Caricamento trasferimenti RTH…</div></div>
    </section>`;
  }

  function bindTransfersPageB44(){
    document.querySelectorAll("[data-transfer-direction]").forEach(function(button){
      button.addEventListener("click",function(){
        state.transferDirectionFilter=button.getAttribute("data-transfer-direction")||"all";
        document.querySelectorAll("[data-transfer-direction]").forEach(function(item){item.classList.toggle("is-active",item===button);});
        applyTransfersFiltersB44();
      });
    });
    const search=document.getElementById("transferSearchB44");
    if(search)search.addEventListener("input",function(){state.transferSearch=search.value||"";applyTransfersFiltersB44();});
    const club=document.getElementById("transferClubFilterB44");
    if(club)club.addEventListener("change",function(){state.transferClubFilter=club.value||"all";applyTransfersFiltersB44();});
  }

  function applyTransfersFiltersB44(){
    const direction=String(state.transferDirectionFilter||"all").toLowerCase();
    const query=String(state.transferSearch||"").trim().toLowerCase();
    const club=String(state.transferClubFilter||"all");
    let visible=0;
    document.querySelectorAll("[data-transfer-row-b44]").forEach(function(row){
      const rowDirection=String(row.getAttribute("data-transfer-direction-value")||"").toLowerCase();
      const rowClub=String(row.getAttribute("data-transfer-club-value")||"");
      const haystack=String(row.getAttribute("data-transfer-search-value")||"").toLowerCase();
      const show=(direction==="all"||direction===rowDirection)&&(club==="all"||club===rowClub)&&(!query||haystack.includes(query));
      row.hidden=!show;
      if(show)visible+=1;
    });
    const empty=document.getElementById("transfersFilteredEmptyB44");
    if(empty)empty.hidden=visible!==0;
  }

  async function loadTransfersPageB44(){
    const target=document.getElementById("transfersContentB44");
    if(!target||!state.client)return;
    try{
      const transfers=await fetchPlayerCodexTransfersB44();
      if(!transfers.length){
        const updated=document.getElementById("transfersUpdatedB44");
        if(updated)updated.textContent="Nessun aggiornamento disponibile";
        target.innerHTML=`<div class="nx-empty-box"><strong>Nessun trasferimento RTH</strong><span>Il registro trasferimenti è ancora vuoto.</span></div>`;
        return;
      }
      const sorted=transfers.slice().sort(function(a,b){
        const dateCompare=String(b.transfer_date||"").localeCompare(String(a.transfer_date||""));
        if(dateCompare)return dateCompare;
        return String(b.transfer_id||"").localeCompare(String(a.transfer_id||""),undefined,{numeric:true});
      });
      const playerIds=Array.from(new Set(sorted.map(function(row){return row.player_codex_player_id;}).filter(function(id){return id!==null&&id!==undefined;})));
      const teamIds=Array.from(new Set(sorted.map(function(row){return row.rth_team_id;}).filter(function(id){return id!==null&&id!==undefined;})));
      const results=await Promise.all([fetchPlayerMastersB44(playerIds),fetchGwTeamsB44(teamIds)]);
      const masters=results[0],teams=results[1];
      const updated=document.getElementById("transfersUpdatedB44");
      if(updated)updated.textContent=sorted[0].transfer_date?"Aggiornato al "+formatDate(sorted[0].transfer_date):"Aggiornamento n/d";
      const countAll=document.getElementById("transferCountAllB44"),countIn=document.getElementById("transferCountInB44"),countOut=document.getElementById("transferCountOutB44");
      if(countAll)countAll.textContent=sorted.length;
      if(countIn)countIn.textContent=sorted.filter(function(row){return String(row.direction).toUpperCase()==="IN";}).length;
      if(countOut)countOut.textContent=sorted.filter(function(row){return String(row.direction).toUpperCase()==="OUT";}).length;

      const clubSelect=document.getElementById("transferClubFilterB44");
      if(clubSelect){
        const clubs=teamIds.map(function(id){return {id:id,name:teamNameFromMapB44(id,teams)};}).sort(function(a,b){return a.name.localeCompare(b.name,"it");});
        clubSelect.innerHTML=`<option value="all">Tutti i club</option>`+clubs.map(function(club){return `<option value="${esc(club.id)}" ${String(state.transferClubFilter)===String(club.id)?"selected":""}>${esc(club.name)}</option>`;}).join("");
        if(state.transferClubFilter!=="all"&&!clubs.some(function(club){return String(club.id)===String(state.transferClubFilter);}))state.transferClubFilter="all";
        clubSelect.value=state.transferClubFilter||"all";
      }

      target.innerHTML=`<div class="nx-transfer-list-b44">${sorted.map(function(row){
        const player=masters.get(String(row.player_codex_player_id))||null;
        const name=playerCodexFullNameB44(player,row.player_codex_player_id);
        const rthClub=teamNameFromMapB44(row.rth_team_id,teams);
        const counterpart=row.counterpart_club_name?formatClubName(row.counterpart_club_name):"Controparte n/d";
        const isIn=String(row.direction).toUpperCase()==="IN";
        const route=isIn?counterpart+" → "+rthClub:rthClub+" → "+counterpart;
        const searchValue=(name+" "+row.player_codex_player_id+" "+rthClub+" "+counterpart+" "+(row.position||"")).toLowerCase();
        return `<article class="nx-transfer-row-b44 ${isIn?"is-in":"is-out"}" data-transfer-row-b44 data-transfer-direction-value="${isIn?"in":"out"}" data-transfer-club-value="${esc(row.rth_team_id)}" data-transfer-search-value="${esc(searchValue)}">
          <div class="nx-transfer-row-head-b44"><time>${esc(formatDate(row.transfer_date))}</time><span>${isIn?"IN":"OUT"}</span></div>
          <div class="nx-transfer-row-body-b44">
            <button type="button" class="nx-transfer-player-link-b44" data-transfer-player-id="${esc(row.player_codex_player_id)}" data-transfer-player-name="${esc(name)}">
              ${playerCodexImageB44(player,name,"is-transfer")}
              <b><small>PLAYER CODEX ID · ${esc(row.player_codex_player_id)}</small><strong>${esc(name)}</strong><em>${esc(row.position||"Posizione n/d")}</em></b><i>›</i>
            </button>
            <div class="nx-transfer-route-b44"><strong>${esc(route)}</strong><button type="button" data-transfer-rth-club-id="${esc(row.rth_team_id)}" data-transfer-rth-club-name="${esc(rthClub)}">${esc(rthClub)} ›</button></div>
            <div class="nx-transfer-meta-b44"><b>${esc(formatPlayerMoneyB44(row.transfer_value))}<small>VALORE</small></b><b>${esc(formatPlayerNumberB44(row.rating,0))}<small>RATING</small></b></div>
          </div>
        </article>`;
      }).join("")}</div><div id="transfersFilteredEmptyB44" class="nx-empty-box" hidden><strong>Nessun trasferimento trovato</strong><span>Modifica ricerca o filtri.</span></div>`;

      target.querySelectorAll("[data-transfer-player-id]").forEach(function(button){
        button.addEventListener("click",function(){
          state.selectedWorld=PLAYER_CODEX_WORLD_ID_B44;
          state.page="worlds";
          state.worldSection="player-codex";
          state.selectedClub=null;
          state.clubProfileView="profile";
          state.selectedPlayer={id:button.getAttribute("data-transfer-player-id"),name:button.getAttribute("data-transfer-player-name")||"Player"};
          state.playerCodexReturn={kind:"transfers"};
          renderShell();
        });
      });
      target.querySelectorAll("[data-transfer-rth-club-id]").forEach(function(button){
        button.addEventListener("click",function(){
          state.selectedWorld=PLAYER_CODEX_WORLD_ID_B44;
          state.page="worlds";
          state.worldSection="clubs";
          state.selectedPlayer=null;
          state.playerCodexReturn=null;
          state.clubProfileView="profile";
          state.entityProfileTab="stats";
          state.selectedClub={id:button.getAttribute("data-transfer-rth-club-id"),name:button.getAttribute("data-transfer-rth-club-name")||"Club"};
          renderShell();
        });
      });
      applyTransfersFiltersB44();
    }catch(error){
      target.innerHTML=`<div class="nx-empty-box"><strong>Errore Transfers</strong><span>${esc(error.message||"Impossibile leggere il registro trasferimenti.")}</span></div>`;
    }
  }

  function playerCodexPlayerPageB44(){
    const player=state.selectedPlayer;
    setTimeout(function(){loadPlayerCodexPlayerB44();},0);
    return `<section class="nx-card nx-player-detail-page-b44">
      <button class="nx-back-link" id="backFromPlayerCodexB44">‹ ${state.playerCodexReturn&&state.playerCodexReturn.kind==="roster"?"Team Roster":state.playerCodexReturn&&state.playerCodexReturn.kind==="transfers"?"Transfers":"Player Codex"}</button>
      <div id="playerCodexPlayerContentB44">
        <div class="nx-player-detail-loading-b44"><strong>${esc(player?player.name:"Player")}</strong><div class="nx-loading">Caricamento scheda giocatore…</div></div>
      </div>
    </section>`;
  }

  function bindPlayerCodexPlayerPageB44(){
    const back=document.getElementById("backFromPlayerCodexB44");
    if(back)back.addEventListener("click",function(){
      const context=state.playerCodexReturn;
      state.selectedPlayer=null;
      if(context&&context.kind==="roster"&&context.club){
        state.worldSection="clubs";
        state.selectedClub={id:context.club.id,name:context.club.name};
        state.clubProfileView="roster";
      }else if(context&&context.kind==="transfers"){
        state.page="transfers";
        state.selectedWorld=PLAYER_CODEX_WORLD_ID_B44;
        state.worldSection="competitions";
        state.selectedClub=null;
      }else{
        state.worldSection="player-codex";
        state.selectedClub=null;
      }
      state.playerCodexReturn=null;
      renderShell();
    });
  }

  async function fetchLatestSinglePlayerSnapshotB44(playerId){
    const result=await state.client
      .from("player_codex_player_snapshots")
      .select("snapshot_id,player_codex_player_id,snapshot_date,position,age,rating,market_value,rating_change_date,rating_change,created_at")
      .eq("player_codex_player_id",playerId)
      .order("snapshot_date",{ascending:false})
      .order("snapshot_id",{ascending:false})
      .limit(1);
    if(result.error)throw result.error;
    return (result.data||[])[0]||null;
  }

  async function fetchLatestSingleRosterSnapshotB44(playerId,teamId){
    const result=await state.client
      .from("player_codex_roster_snapshots")
      .select("roster_snapshot_id,player_codex_player_id,season_id,rth_team_id,snapshot_date,no_transfer_until,contract_years,salary,created_at")
      .eq("player_codex_player_id",playerId)
      .eq("season_id",PLAYER_CODEX_SEASON_ID_B44)
      .eq("rth_team_id",teamId)
      .order("snapshot_date",{ascending:false})
      .order("roster_snapshot_id",{ascending:false})
      .limit(1);
    if(result.error)throw result.error;
    return (result.data||[])[0]||null;
  }

  function playerRatingChangeB44(snapshot){
    if(!snapshot||snapshot.rating_change===null||snapshot.rating_change===undefined||snapshot.rating_change==="")return "—";
    const change=Number(snapshot.rating_change);
    if(!Number.isFinite(change))return String(snapshot.rating_change);
    return (change>0?"+":"")+String(change);
  }

  async function loadPlayerCodexPlayerB44(){
    const target=document.getElementById("playerCodexPlayerContentB44");
    const selected=state.selectedPlayer;
    if(!target||!selected||!state.client)return;
    try{
      const playerId=selected.id;
      const transfers=await fetchPlayerCodexTransfersB44({playerId:playerId});
      const ids=[playerId];
      const baseResults=await Promise.all([fetchPlayerMastersB44(ids),fetchLatestSinglePlayerSnapshotB44(playerId)]);
      const player=baseResults[0].get(String(playerId))||null;
      const snapshot=baseResults[1];
      const name=playerCodexFullNameB44(player,playerId);
      const rthState=buildPlayerRthStateB44(transfers).get(String(playerId))||{active:false,activeTeam:null,lastTeamId:null};
      const teamIds=Array.from(new Set(transfers.map(function(row){return row.rth_team_id;}).filter(function(id){return id!==null&&id!==undefined;})));
      const teams=await fetchGwTeamsB44(teamIds);
      const currentTeamId=rthState.activeTeam?rthState.activeTeam.teamId:null;
      const lastTeamId=rthState.lastTeamId||null;
      const currentTeamName=currentTeamId?teamNameFromMapB44(currentTeamId,teams):"";
      const lastTeamName=lastTeamId?teamNameFromMapB44(lastTeamId,teams):"";
      const roster=currentTeamId?await fetchLatestSingleRosterSnapshotB44(playerId,currentTeamId):null;

      let previousRating="—";
      if(snapshot&&snapshot.rating!==null&&snapshot.rating!==undefined&&snapshot.rating_change!==null&&snapshot.rating_change!==undefined&&Number.isFinite(Number(snapshot.rating))&&Number.isFinite(Number(snapshot.rating_change))){
        previousRating=String(Number(snapshot.rating)-Number(snapshot.rating_change));
      }
      const statusClass=rthState.active?"active":"former";
      const statusLabel=rthState.active?"ACTIVE IN RTH":"FORMER RTH PLAYER";
      target.innerHTML=`
        <div class="nx-player-detail-hero-b44">
          ${playerCodexImageB44(player,name,"is-detail")}
          <div class="nx-player-detail-title-b44"><small>PLAYER CODEX ID · ${esc(playerId)}</small><h1>${esc(name)}</h1><p>${esc((snapshot&&snapshot.position)||"Posizione n/d")}</p><span class="nx-player-status-b44 ${statusClass}">${statusLabel}</span></div>
          <div class="nx-player-detail-kpis-b44"><b>${esc(formatPlayerNumberB44(snapshot&&snapshot.age,0))}<small>ETÀ</small></b><b>${esc(formatPlayerNumberB44(snapshot&&snapshot.rating,0))}<small>RATING</small></b><b>${esc(formatPlayerMoneyB44(snapshot&&snapshot.market_value))}<small>VALORE</small></b></div>
        </div>

        <section class="nx-player-section-b44"><div class="nx-player-section-head-b44"><small>PLAYER PROFILE</small><h2>Profilo giocatore</h2></div>
          <div class="nx-player-data-grid-b44">
            <div><span>Posizione</span><strong>${esc((snapshot&&snapshot.position)||"—")}</strong></div>
            <div><span>Età</span><strong>${esc(formatPlayerNumberB44(snapshot&&snapshot.age,0))}</strong></div>
            <div><span>Rating corrente</span><strong>${esc(formatPlayerNumberB44(snapshot&&snapshot.rating,0))}</strong></div>
            <div><span>Rating precedente</span><strong>${esc(previousRating)}</strong></div>
            <div><span>Variazione rating</span><strong>${esc(playerRatingChangeB44(snapshot))}</strong></div>
            <div><span>Ultima variazione</span><strong>${esc(snapshot&&snapshot.rating_change_date?formatDate(snapshot.rating_change_date):"—")}</strong></div>
            <div><span>Valore corrente</span><strong>${esc(formatPlayerMoneyB44(snapshot&&snapshot.market_value))}</strong></div>
          </div>
        </section>

        <section class="nx-player-section-b44"><div class="nx-player-section-head-b44"><small>CURRENT RTH STATUS</small><h2>${rthState.active?"Status attuale":"Former RTH Player"}</h2></div>
          ${rthState.active?`<div class="nx-current-rth-b44">
            <button type="button" class="nx-current-club-link-b44" data-player-current-club-id="${esc(currentTeamId)}" data-player-current-club-name="${esc(currentTeamName)}"><span>${entityVisual("club",currentTeamName)}</span><b><small>CLUB RTH ATTUALE</small>${esc(currentTeamName)}</b><em>›</em></button>
            <div class="nx-player-data-grid-b44">
              <div><span>Contratto</span><strong>${esc(formatContractYearsB44(roster&&roster.contract_years))}</strong></div>
              <div><span>Stipendio</span><strong>${esc(formatPlayerMoneyB44(roster&&roster.salary))}</strong></div>
              <div><span>No Transfer Until</span><strong>${esc(roster&&roster.no_transfer_until?formatDate(roster.no_transfer_until):"—")}</strong></div>
              <div><span>Stagione</span><strong>GW001-S01</strong></div>
            </div>
          </div>`:`<div class="nx-former-rth-b44"><strong>FORMER RTH PLAYER</strong><span>Ultimo club RTH</span>${lastTeamId?`<button type="button" data-player-current-club-id="${esc(lastTeamId)}" data-player-current-club-name="${esc(lastTeamName)}">${esc(lastTeamName)} ›</button>`:`<b>—</b>`}</div>`}
        </section>

        <section class="nx-player-section-b44"><div class="nx-player-section-head-b44"><small>RTH CAREER TIMELINE</small><h2>Cronologia trasferimenti</h2></div>
          ${transfers.length?`<div class="nx-player-timeline-b44">${transfers.slice().sort(function(a,b){
            const dateCompare=String(b.transfer_date||"").localeCompare(String(a.transfer_date||""));
            if(dateCompare)return dateCompare;
            return String(b.transfer_id||"").localeCompare(String(a.transfer_id||""),undefined,{numeric:true});
          }).map(function(row){
            const rthClub=teamNameFromMapB44(row.rth_team_id,teams);
            const counterpart=row.counterpart_club_name?formatClubName(row.counterpart_club_name):"Controparte n/d";
            const isIn=String(row.direction).toUpperCase()==="IN";
            const route=isIn?counterpart+" → "+rthClub:rthClub+" → "+counterpart;
            return `<article class="nx-player-transfer-b44 ${isIn?"is-in":"is-out"}"><time>${esc(formatDate(row.transfer_date))}</time><span>${isIn?"IN":"OUT"}</span><div><strong>${esc(route)}</strong><small>${esc(formatPlayerMoneyB44(row.transfer_value))} · Rating ${esc(formatPlayerNumberB44(row.rating,0))}</small></div></article>`;
          }).join("")}</div>`:`<div class="nx-empty-box"><strong>Nessun evento RTH</strong><span>La cronologia trasferimenti non contiene eventi per questo giocatore.</span></div>`}
        </section>`;

      target.querySelectorAll("[data-player-current-club-id]").forEach(function(button){
        button.addEventListener("click",function(){
          state.selectedPlayer=null;
          state.playerCodexReturn=null;
          state.worldSection="clubs";
          state.clubProfileView="profile";
          state.entityProfileTab="stats";
          state.selectedClub={id:button.getAttribute("data-player-current-club-id"),name:button.getAttribute("data-player-current-club-name")||"Club"};
          renderShell();
        });
      });
    }catch(error){
      target.innerHTML=`<div class="nx-empty-box"><strong>Errore scheda Player Codex</strong><span>${esc(error.message||"Impossibile leggere il giocatore.")}</span></div>`;
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

  // BUILD 8 · Results always take precedence over Schedule.
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
    return `<section class="nx-card">
      <div class="nx-page-title nx-manager-page-title">
        <div>
          <h1>Managers</h1>
          <p id="managerRegistrySubtitle">Manager IMC attivi in ${esc(state.selectedWorld || "GW004")} · ${esc(selectedWorldName())}</p>
        </div>
      </div>

      <div id="managerFilterButtons" class="nx-manager-filter-grid"></div>

      <div id="managerRegistryContent" class="nx-entity-grid">
        <div class="nx-loading">Caricamento manager…</div>
      </div>
    </section>`;
  }

  function bindManagerRegistry(){
    const filters=document.getElementById("managerFilterButtons");
    if(!filters)return;

    filters.addEventListener("click",function(event){
      const button=event.target.closest("[data-manager-filter]");
      if(!button)return;

      const value=button.getAttribute("data-manager-filter")||"all";

      filters.querySelectorAll("[data-manager-filter]").forEach(function(btn){
        btn.classList.toggle("active",btn===button);
      });

      document.querySelectorAll(".nx-manager-row").forEach(function(row){
        const filterValue=row.getAttribute("data-filter-value")||"";
        row.hidden=!(value==="all"||filterValue===value);
      });
    });
  }

  async function loadManagerRegistry(){
    const target=document.getElementById("managerRegistryContent");
    if(!target||!state.client)return;

    try{
      const worldId=state.selectedWorld || "GW004";
      const isMulti=selectedWorldIsMultiLeague();

      const seasonResult=await state.client
        .from("gw_seasons")
        .select("season_id")
        .eq("game_world_id",worldId)
        .eq("season_status","current")
        .maybeSingle();
      if(seasonResult.error)throw seasonResult.error;
      const activeSeasonId=seasonResult.data&&seasonResult.data.season_id?seasonResult.data.season_id:null;

      const requests=[
        state.client
          .from("gw_manager_assignments")
          .select(`assignment_id,manager_id,team_id,nation_id,start_date,end_date,gw_teams(team_id,game_world_id,sm_club_id,team_name,display_name),imc_national_teams(nation_name),imc_managers(full_name)`)
          .eq("game_world_id",worldId)
          .order("start_date",{ascending:false}),
        state.client
          .from("gw_setup_team_divisions")
          .select("team_id,nation_setup_id,division_number,season_id")
          .eq("game_world_id",worldId),
        state.client
          .from("gw_setup_nations")
          .select("nation_setup_id,nation_name")
          .eq("game_world_id",worldId),
        state.client
          .from("gw_league_countries")
          .select("country_id,country_name,area_id,area_sm,area_alias")
          .eq("game_world_id",worldId)
      ];

      const loaded=await Promise.all(requests);
      loaded.forEach(function(result){if(result.error)throw result.error;});

      const assignments=loaded[0].data||[];
      let teamDivisions=loaded[1].data||[];
      const nations=loaded[2].data||[];
      const areaRows=loaded[3].data||[];
      const areaMaps=areaRegistryMaps(areaRows);

      if(activeSeasonId){
        const currentRows=teamDivisions.filter(function(row){
          return String(row.season_id||"")===String(activeSeasonId);
        });
        if(currentRows.length)teamDivisions=currentRows;
      }

      const teamDivisionMap=new Map();
      teamDivisions.forEach(function(row){
        if(row.team_id!=null&&!teamDivisionMap.has(String(row.team_id))){
          teamDivisionMap.set(String(row.team_id),row);
        }
      });

      const nationMap=new Map(nations.map(function(row){
        if(usesAreaPilot(worldId)){
          const area=areaMaps.by_sm.get(normalizeParticipantKey(row.nation_name));
          return [String(row.nation_setup_id),area&&area.area_alias?area.area_alias:row.nation_name];
        }
        return [String(row.nation_setup_id),row.nation_name];
      }));

      const grouped={};
      assignments.forEach(function(row){
        if(row.end_date)return; // solo incarichi attivi

        const id=row.manager_id;
        if(!grouped[id]){
          grouped[id]={
            manager_id:id,
            full_name:row.imc_managers&&row.imc_managers.full_name
              ? row.imc_managers.full_name
              : "Manager non disponibile",
            club:null,
            nation:null,
            filter_value:"",
            filter_label:""
          };
        }

        if(row.gw_teams&&teamDisplayName(row.gw_teams)&&!grouped[id].club){
          const teamName=teamDisplayName(row.gw_teams);
          grouped[id].club={name:teamName,start_date:row.start_date};

          const setup=teamDivisionMap.get(String(row.team_id));
          if(setup){
            if(isMulti){
              const nationName=nationMap.get(String(setup.nation_setup_id))||"";
              grouped[id].filter_value=normalizeText(nationName).toLowerCase();
              grouped[id].filter_label=nationName;
            }else{
              grouped[id].filter_value="division-"+String(setup.division_number);
              grouped[id].filter_label="Division "+String(setup.division_number);
            }
          }
        }

        if(row.imc_national_teams&&row.imc_national_teams.nation_name&&!grouped[id].nation){
          grouped[id].nation={
            name:row.imc_national_teams.nation_name,
            start_date:row.start_date
          };
        }
      });

      const managers=Object.values(grouped)
        .filter(function(m){return Boolean(m.club||m.nation);})
        .sort(function(a,b){return a.full_name.localeCompare(b.full_name);});

      const subtitle=document.getElementById("managerRegistrySubtitle");
      if(subtitle){
        subtitle.textContent=managers.length+" Manager IMC attivi in "+worldId+" · "+selectedWorldName();
      }

      const menu=document.getElementById("managerFilterButtons");
      if(menu){
        const optionMap=new Map();
        managers.forEach(function(m){
          if(m.filter_value&&m.filter_label&&!optionMap.has(m.filter_value)){
            optionMap.set(m.filter_value,m.filter_label);
          }
        });

        const options=Array.from(optionMap.entries()).sort(function(a,b){
          if(!isMulti){
            const na=Number(String(a[0]).replace("division-",""))||99;
            const nb=Number(String(b[0]).replace("division-",""))||99;
            return na-nb;
          }
          return a[1].localeCompare(b[1]);
        });

        menu.innerHTML=
          `<button type="button" class="active" data-manager-filter="all">Tutti</button>`+
          options.map(function(entry){
            return `<button type="button" data-manager-filter="${esc(entry[0])}">${esc(entry[1])}</button>`;
          }).join("");
      }

      if(!managers.length){
        target.innerHTML=`<div class="nx-empty-box"><strong>Nessun manager disponibile</strong><span>Non risultano manager IMC con incarichi attivi nel Game World selezionato.</span></div>`;
        return;
      }

      target.innerHTML=managers.map(function(m){
        const sub=[m.club?m.club.name:null,m.nation?m.nation.name:null].filter(Boolean).join(" · ")||"Nessuna assegnazione attiva";
        return `<button class="nx-manager-row nx-entity-tile"
          data-manager-id="${esc(m.manager_id)}"
          data-manager-name="${esc(m.full_name)}"
          data-filter-value="${esc(m.filter_value||"")}"
          data-search="${esc((m.full_name+" "+m.manager_id+" "+sub+" "+(m.filter_label||"")).toLowerCase())}">
          <span class="nx-entity-tile-icon nx-manager-tile-icon">●</span>
          <strong>${esc(m.full_name)}</strong>
          <small>${esc(m.manager_id)}</small>
          <small class="nx-manager-tile-sub">${esc(sub)}</small>
        </button>`;
      }).join("");

      target.querySelectorAll("[data-manager-id]").forEach(function(button){
        button.addEventListener("click",function(){
          state.managerProfileTab="stats";
          state.selectedManager={
            id:button.getAttribute("data-manager-id"),
            name:button.getAttribute("data-manager-name")
          };
          renderShell();
        });
      });

    }catch(error){
      target.innerHTML=`<div class="nx-empty-box"><strong>Errore caricamento manager</strong><span>${esc(error.message||"Impossibile leggere le assegnazioni.")}</span></div>`;
    }
  }

  function managerProfilePage(){
    const m=state.selectedManager;
    setTimeout(loadManagerProfile,0);
    return `<section class="nx-card nx-profile-v11"><button class="nx-back-link" id="backToManagerRegistry">‹ Torna a Managers</button><div class="nx-manager-profile-head"><div class="nx-manager-photo">●</div><div><small>MANAGER PROFILE</small><h1>${esc(m?m.name:"")}</h1><p>${esc(m?m.id:"")} · ${esc(state.selectedWorld||"")} · ${esc(selectedWorldName())}</p></div></div><div id="managerProfileContent"><div class="nx-loading">Apertura profilo manager…</div></div></section>`;
  }
  function bindManagerProfile(){const b=document.getElementById("backToManagerRegistry");if(b)b.addEventListener("click",function(){state.selectedManager=null;state.managerProfileTab="stats";renderShell();});}

  async function loadManagerProfile(){
    await ensureSeason2FinalHonoursV12(state.selectedWorld||null);
    const target=document.getElementById("managerProfileContent"),m=state.selectedManager;if(!target||!m||!state.client)return;
    try{
      const worldId=state.selectedWorld||"GW004";
      const data=await fetchManagerCareerData(m.id,worldId);
      const allAssign=await state.client.from("gw_manager_assignments").select("manager_id,team_id,nation_id,start_date,end_date,imc_managers(full_name)").eq("game_world_id",worldId);if(allAssign.error)throw allAssign.error;
      const hr=await state.client.from("gw_season_honours").select("honour_id,game_world_id,season_id,competition_name,competition_type,winner_team_id,winner_team_name,awarded_on,winner_manager_id,winner_manager_name").eq("game_world_id",worldId).eq("winner_manager_id",m.id).order("awarded_on",{ascending:false});if(hr.error)throw hr.error;
      const auto=(state.autoFinalHonoursV12||[]).filter(function(h){return String(h.game_world_id)===String(worldId)&&String(h.winner_manager_id||"")===String(m.id);});
      target.innerHTML=renderManagerProfileV11(m,data,allAssign.data||[],mergeHonourRowsV12(hr.data||[],auto));
      bindProfileTabsV11(target,"managerProfileTab");
      bindManagerCareerSwitcherV34(target);
      bindManagerCareerEntityLinksV35(target);
    }catch(error){target.innerHTML=`<div class="nx-empty-box"><strong>Errore profilo manager</strong><span>${esc(error.message||"Impossibile calcolare il profilo.")}</span></div>`;}
  }

  function renderManagerProfileV11(manager,data,allAssignments,honours){
    const assignments=data.assignments||[],matches=data.matches||[],seasons=data.seasons||[];
    const tabs=[{id:"stats",label:"Stats",icon:"▥"},{id:"trophies",label:"Trophy Room",icon:"♛"},{id:"h2h",label:"H2H",icon:"⚔"}];
    const requested=state.managerProfileTab||"stats";
    const active=tabs.some(function(tab){return tab.id===requested;})?requested:"stats";
    state.managerProfileTab=active;
    return `${renderManagerCareerBoxV33(assignments)}${profileTabsV11(active,tabs)}<div class="nx-profile-panels-v11"><div data-profile-panel="stats" ${active!=="stats"?"hidden":""}>${renderCareerStatsV10(data,state.selectedWorld||null)}</div><div data-profile-panel="trophies" ${active!=="trophies"?"hidden":""}>${renderPersonalTrophiesV10(honours,seasons,state.selectedWorld||null)}</div><div data-profile-panel="h2h" ${active!=="h2h"?"hidden":""}><div class="nx-profile-section"><h2>H2H · Manager</h2>${renderManagerH2H(manager.id,allAssignments,matches)}</div></div></div>`;
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
  function renderCareerTimeline(assignments){return careerHorizontalTrackV33(assignments||[],"manager");}
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
    const imcManagersOnly=category==="domestic"&&isMulti&&Boolean(state.competitionImcFilter);

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
    if(imcManagersOnly){
      filtered=filtered.filter(function(item){return Boolean(item.hasImcManager);});
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

      ${category==="domestic"&&isMulti?`<div class="nx-competition-filter-panel">
        <button type="button" id="competitionImcFilter" class="nx-imc-filter${imcManagersOnly?" is-active":""}" aria-pressed="${imcManagersOnly?"true":"false"}">IMC Managers</button>
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
              <div class="nx-comp-tile-copy"><strong>${esc(row.name)}</strong></div>
            </button>`;
          }).join("")}</div>
        </section>`;
      }).join("")}</div>`:`<div class="nx-competition-grid nx-competition-filtered-grid">${filtered.map(function(row){
        return `<button class="nx-comp-tile" data-comp-type="${row.type}" data-comp-id="${esc(row.id)}">
          <div class="nx-trophy-icon">${trophyRoomImageMarkup(row.name,row.competitionType,true)}</div>
          <div class="nx-comp-tile-copy">${row.nation?`<small>${esc(row.nation)}</small>`:""}<strong>${esc(row.name)}</strong></div>
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
      const canonicalWorld=usesCanonicalGwStructure(state.selectedWorld);
      const results=await Promise.all([
        canonicalWorld
          ? Promise.resolve({data:[],error:null})
          : state.client.from("gw_division_setups").select("nation_setup_id,division_number").eq("game_world_id",state.selectedWorld).order("division_number",{ascending:true}),
        state.client.from("gw_setup_nations").select("nation_setup_id,nation_name,sort_order").eq("game_world_id",state.selectedWorld).order("sort_order",{ascending:true}),
        state.client.from("gw_competition_settings").select("competition_id,nation_setup_id,start_date").eq("game_world_id",state.selectedWorld).eq("season_id",season.season_id),
        state.client.from("gw_competitions").select("competition_id,competition_code,competition_name,competition_type,competition_category,country_id,division_id").eq("game_world_id",state.selectedWorld).eq("competition_type","promotion_playoff"),
        state.client.from("gw_divisions").select("division_id,division_code,division_level,country_id,area_id").eq("game_world_id",state.selectedWorld),
        state.client.from("gw_league_countries").select("country_id,country_name,area_id,area_sm,area_alias").eq("game_world_id",state.selectedWorld),
        state.selectedWorld==="GW009"
          ? state.client.from("gw_competitions").select("competition_id,competition_code,competition_name,competition_type,competition_category").eq("game_world_id","GW009").eq("competition_code","GW009-KICK-OFF-CUP").maybeSingle()
          : Promise.resolve({data:null,error:null})
      ]);
      results.forEach(function(r){if(r.error)throw r.error;});
      let divisions=results[0].data||[];
      const nations=results[1].data||[], settings=results[2].data||[], playoffCompetitions=results[3].data||[];
      const realDivisions=results[4].data||[], leagueCountries=results[5].data||[];

      if(usesCanonicalGwStructure(state.selectedWorld)&&!divisions.length){
        divisions=realDivisions.map(function(row){
          return {
            nation_setup_id:null,
            division_number:Number(row.division_level),
            division_id:Number(row.division_id),
            canonical:true
          };
        }).sort(function(a,b){return a.division_number-b.division_number;});
      }

      // Build 9: la label mostrata nelle Competitions dei Multi League deve
      // arrivare dal registry canonico gw_league_countries, non dal vecchio
      // nation_name del setup (che può contenere alias Soccer Manager legacy).
      const canonicalCountryNameById=new Map(leagueCountries.map(function(country){
        return [String(country.country_id),String(country.country_name||"").trim()];
      }));
      const countryIdByNationSetupId=new Map();
      realDivisions.forEach(function(realDivision){
        const match=String(realDivision.division_code||"").match(/_N(\d+)_DIV_(\d+)$/);
        if(match&&realDivision.country_id!=null){
          countryIdByNationSetupId.set(String(Number(match[1])),String(realDivision.country_id));
        }
      });
      const canonicalNationNameBySetupId=new Map();
      const worldAreaMaps=areaRegistryMaps(leagueCountries);
      nations.forEach(function(nation){
        const setupId=String(nation.nation_setup_id);
        if(usesAreaPilot(state.selectedWorld)){
          const area=worldAreaMaps.by_sm.get(normalizeParticipantKey(nation.nation_name));
          canonicalNationNameBySetupId.set(
            setupId,
            area&&area.area_alias?area.area_alias:String(nation.nation_name||"").trim()
          );
          return;
        }
        const countryId=countryIdByNationSetupId.get(setupId);
        canonicalNationNameBySetupId.set(
          setupId,
          (countryId&&canonicalCountryNameById.get(countryId)) || String(nation.nation_name||"").trim()
        );
      });

      // Build 8: nei Multi League le competizioni domestiche visibili sono
      // esclusivamente quelle delle nazioni in cui gioca almeno un manager IMC.
      let activeImcNationNames=null;
      if(selectedWorldIsMultiLeague()){
        // Build 8: la nazione del club nei Multi League deriva dal setup
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
                .map(function(n){return normalizeParticipantKey(canonicalNationNameBySetupId.get(String(n.nation_setup_id))||n.nation_name);})
            );
          }
        }
      }

      const nationMap=new Map(nations.map(function(n){
        const setupId=String(n.nation_setup_id);
        return [setupId,canonicalNationNameBySetupId.get(setupId)||n.nation_name];
      }));
      const nationOrder=new Map(nations.map(function(n,index){
        const setupId=String(n.nation_setup_id);
        const canonicalName=canonicalNationNameBySetupId.get(setupId)||n.nation_name;
        return [String(canonicalName),Number(n.sort_order||index)];
      }));
      const tiles=[];

      divisions.forEach(function(div){
        const nationName=div.nation_setup_id?(nationMap.get(String(div.nation_setup_id))||""):"";
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
        // I Playoff non sono una singola competizione: le istanze reali
        // (Division 2 Playoff, Division 3 Playoff, ...) arrivano da gw_competitions.
        if(!item||item.id==="COMP_DOM_001"||item.id==="COMP_DOM_005")return;
        const nationName=row.nation_setup_id?(nationMap.get(String(row.nation_setup_id))||""):"";
        const displayName=item.name;
        const databaseBaseName=item.dbName||displayName;
        const databaseName=nationName?nationName+" · "+databaseBaseName:databaseBaseName;
        const category=item.category==="national_teams"?"nations":item.category;
        tiles.push({
          type:"competition",
          competitionType:item.id,
          category:category,
          nation:item.category==="domestic"?nationName:"",
          id:databaseName,
          name:displayName,
          date:row.start_date||"",
          sortOrder:(nationOrder.get(nationName)||0)*100+50+GW_STANDARD_COMPETITIONS.indexOf(item)
        });
      });

      const kickOffCompetition=results[6]&&results[6].data?results[6].data:null;
      if(kickOffCompetition){
        const leagueCupIndex=GW_STANDARD_COMPETITIONS.findIndex(function(item){
          return String(item.name||"").toLowerCase()==="league cup";
        });
        tiles.push({
          type:"competition",
          competitionType:kickOffCompetition.competition_type||"domestic_cup",
          category:"domestic",
          nation:"",
          id:kickOffCompetition.competition_name,
          name:"Kick Off Cup",
          date:"",
          sortOrder:50+(leagueCupIndex>=0?leagueCupIndex+0.5:2.5)
        });
      }

      playoffCompetitions.forEach(function(row){
        const rawName=String(row.competition_name||"").trim();
        const match=rawName.match(/(?:^|·\s*)Division\s+(\d+)\s+Playoff$/i);
        if(!match)return;
        const divisionNumber=Number(match[1]);
        if(!divisionNumber||divisionNumber<2||divisionNumber>5)return;

        let nationName="";
        // Build 9: per i Playoff preferiamo sempre il country_id canonico.
        // Il prefisso del competition_name può contenere ancora una label legacy.
        if(row.country_id!=null)nationName=canonicalCountryNameById.get(String(row.country_id))||"";
        if(!nationName){
          const separatorIndex=rawName.indexOf("·");
          if(separatorIndex>=0)nationName=rawName.slice(0,separatorIndex).trim();
        }

        const displayName="Division "+divisionNumber+" Playoff";
        tiles.push({
          type:"competition",
          competitionType:"promotion_playoff",
          category:"domestic",
          nation:nationName,
          id:rawName,
          name:displayName,
          date:"",
          // Subito dopo la Division corrispondente: D2, PO D2, D3, PO D3...
          sortOrder:(nationOrder.get(nationName)||0)*100+divisionNumber+0.5
        });
      });

      tiles.forEach(function(tile){
        tile.hasImcManager=Boolean(activeImcNationNames && tile.category==="domestic" && tile.nation && activeImcNationNames.has(normalizeParticipantKey(tile.nation)));
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

      const imcToggle=event.target.closest("#competitionImcFilter");
      if(imcToggle){
        state.competitionImcFilter=!state.competitionImcFilter;
        renderWorldCompetitions();
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
      if(type === "division"){state.selectedDivision=id;state.selectedCompetition=null;state.divisionTab="results";state.divisionStandingSeason="current";}
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

  function competitionThemeConfig(name){
    const normalized=String(name||"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/\s+/g," ")
      .trim();

    if(/division\s*(1|one)\b/.test(normalized)) return {main:"#163B8C",soft:"#EAF1FF"};
    if(/division\s*(2|two)\b/.test(normalized) && !/playoff/.test(normalized)) return {main:"#B68A2E",soft:"#FFF6DF"};
    if(/division\s*(3|three)\b/.test(normalized) && !/playoff/.test(normalized)) return {main:"#8A96A8",soft:"#F1F4F8"};
    if(/division\s*(4|four)\b/.test(normalized) && !/playoff/.test(normalized)) return {main:"#A56A43",soft:"#F8EEE7"};
    if(/division\s*(5|five)\b/.test(normalized) && !/playoff/.test(normalized)) return {main:"#424242",soft:"#ECEFF1"};
    if(/playoff/.test(normalized)) return {main:"#D96C1F",soft:"#FFF0E4"};
    if(/national cup/.test(normalized)) return {main:"#C89B2D",soft:"#FFF5D9"};
    if(/league cup|league shield/.test(normalized)) return {main:"#1E8A5B",soft:"#E7F7EF"};
    if(/kick off cup/.test(normalized)) return {main:"#C89B2D",soft:"#FFF5D9"};
    if(/charity shield/.test(normalized)) return {main:"#7A8AA0",soft:"#EEF2F6"};
    if(/imc champions|smfa champions/.test(normalized)) return {main:"#0F2E78",soft:"#E8EEFF"};
    if(/imc shield|smfa shield/.test(normalized)) return {main:"#5B4EA1",soft:"#F0EDFF"};
    if(/imc super cup|smfa super cup/.test(normalized)) return {main:"#3F4C5F",soft:"#EEF1F5"};
    if(/world cup qualifying/.test(normalized)) return {main:"#007C91",soft:"#E6F7FA"};
    if(/^world cup$/.test(normalized) || / world cup$/.test(normalized)) return {main:"#008E5A",soft:"#E6F8F0"};
    return {main:"#163B8C",soft:"#EAF1FF"};
  }

  function competitionThemeInlineStyle(name){
    const theme=competitionThemeConfig(name);
    return `style="--nx-cover-main:${theme.main};--nx-cover-soft:${theme.soft}"`;
  }

  function competitionActiveViewLabel(tab){
    const labels={results:"RESULTS",standings:"STANDINGS",schedule:"SCHEDULE",trophy:"TROPHY ROOM"};
    return labels[String(tab||"results")]||"RESULTS";
  }

  function currentCompetitionSeasonLabel(){
    const season=state.worldCompetitionsSeason;
    const number=season&&season.season_number!==undefined&&season.season_number!==null
      ? season.season_number
      : null;
    return number?"Season "+number:"Season";
  }

  function competitionCoverMarkup(name,tab,type){
    const theme=competitionThemeConfig(name);
    const label=canonicalDomesticCupDisplayName(name);
    const worldId=state.selectedWorld||"GW004";
    const worldName=selectedWorldName()||"Game World";
    return `<div class="nx-competition-cover" style="--nx-cover-main:${theme.main};--nx-cover-soft:${theme.soft}">
      <div class="nx-competition-cover-art">
        ${trophyRoomImageMarkup(name,type||resolveCompetitionType(name),false)}
      </div>
      <div class="nx-competition-cover-copy">
        <small>${esc(competitionActiveViewLabel(tab))}</small>
        <h1>${esc(label)}</h1>
        <p>${esc(worldId)} · ${esc(worldName)} · ${esc(currentCompetitionSeasonLabel())}</p>
      </div>
    </div>`;
  }

  function divisionCompetitionView(){
    return `
      <section class="nx-card nx-competition-detail-card" ${competitionThemeInlineStyle(state.selectedDivision)}>
        <button class="nx-back-link nx-competition-back" id="backToCompetitions"><span aria-hidden="true">‹</span> Torna a Competitions</button>

        ${competitionCoverMarkup(state.selectedDivision,state.divisionTab,"league")}

        <div class="nx-detail-tabs">
          <button data-div-tab="results" class="${state.divisionTab==="results" ? "active" : ""}">☷<span>RESULTS</span></button>
          <button data-div-tab="standings" class="${state.divisionTab==="standings" ? "active" : ""}">▥<span>STANDINGS</span></button>
          <button data-div-tab="schedule" class="${state.divisionTab==="schedule" ? "active" : ""}">▣<span>SCHEDULE</span></button>
          <button data-div-tab="trophy" class="${state.divisionTab==="trophy" ? "active" : ""}">♛<span>TROPHY ROOM</span></button>
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
          state.clubProfileView = "profile";
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
    if(raw==="IMC Champions")return "IMC Champions";
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
    const manager=side==="home"?match.home_manager:match.away_manager;
    const logo=compactParticipantLogo(type,entityName,match.game_world_id||state.selectedWorld);

    return `
      <span class="nx-compact-team nx-compact-${side}">
        <span class="nx-compact-team-main">
          ${side==="home"
            ? `<button class="nx-compact-team-code" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(entityId)}" data-match-entity-name="${esc(entityName)}">${esc(entityName)}</button>${logo}`
            : `${logo}<button class="nx-compact-team-code" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(entityId)}" data-match-entity-name="${esc(entityName)}">${esc(entityName)}</button>`}
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

  function competitionSupportsStandings(name){
    if(normalizeText(name).toLowerCase()==="kick off cup")return true;
    const type=resolveCompetitionType(name);
    return type==="smfa_champions" ||
      type==="smfa_shield" ||
      type==="world_cup" ||
      type==="world_cup_qualifying";
   }

  function nxCompetitionPage(){
    const supportsStandings=competitionSupportsStandings(state.selectedCompetition);
    if(state.competitionTab==="standings"&&!supportsStandings){
      state.competitionTab="results";
    }

    return `
      <section class="nx-card nx-competition-detail-card" ${competitionThemeInlineStyle(state.selectedCompetition)}>
        <button class="nx-back-link nx-competition-back" id="backToCompetitions"><span aria-hidden="true">‹</span> Torna a Competitions</button>

        ${competitionCoverMarkup(state.selectedCompetition,state.competitionTab,resolveCompetitionType(state.selectedCompetition))}

        <div class="nx-detail-tabs ${supportsStandings?"":"nx-detail-tabs-three"}">
          <button data-comp-tab="results" class="${state.competitionTab==="results" ? "active" : ""}">☷<span>RESULTS</span></button>
          ${supportsStandings
            ? `<button data-comp-tab="standings" class="${state.competitionTab==="standings" ? "active" : ""}">▥<span>STANDINGS</span></button>`
            : ""}
          <button data-comp-tab="schedule" class="${state.competitionTab==="schedule" ? "active" : ""}">▣<span>SCHEDULE</span></button>
          <button data-comp-tab="trophy" class="${state.competitionTab==="trophy" ? "active" : ""}">♛<span>TROPHY ROOM</span></button>
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
      <section class="section" ${competitionThemeInlineStyle(state.selectedDivision)}>
        <button class="back-link" id="backDomestic">‹ Competitions</button>
        ${competitionCoverMarkup(state.selectedDivision,state.divisionTab,"league")}
        <div class="world-tabs">
          <button class="world-tab ${state.divisionTab==="results" ? "active" : ""}" data-division-tab="results">RESULTS</button>
          <button class="world-tab ${state.divisionTab==="standings" ? "active" : ""}" data-division-tab="standings">STANDINGS</button>
          <button class="world-tab ${state.divisionTab==="schedule" ? "active" : ""}" data-division-tab="schedule">SCHEDULE</button>
        </div>
        <div id="divisionContent"><div class="card"><div class="row-sub">Caricamento dati…</div></div></div>
      </section>
    `;
  }

  async function loadPastWorldSeasons(worldId){
    const result=await state.client
      .from("gw_seasons")
      .select("season_id,season_number,season_status")
      .eq("game_world_id",worldId)
      .eq("season_status","past")
      .order("season_number",{ascending:false});

    if(result.error)throw result.error;
    return result.data||[];
  }

  function historicalSeasonButtons(pastSeasons,selectedValue){
    if(!pastSeasons||!pastSeasons.length)return "";

    return `
      <div class="nx-history-season-bar" role="group" aria-label="Seleziona stagione classifica">
        <button
          type="button"
          data-standing-season="current"
          class="${selectedValue==="current"?"active":""}">
          CURRENT SEASON
        </button>
        ${pastSeasons.map(function(season){
          const value=String(season.season_id);
          return `<button
            type="button"
            data-standing-season="${esc(value)}"
            class="${String(selectedValue)===value?"active":""}">
            SEASON ${esc(season.season_number)}
          </button>`;
        }).join("")}
      </div>`;
  }

  function renderHistoricalStanding(rows,season){
    if(!rows||!rows.length){
      return `<div class="nx-empty-box"><strong>Final Standing non disponibile</strong><span>Nessuna classifica archiviata per Season ${esc(season&&season.season_number||"")}.</span></div>`;
    }

    const officialDate=rows.find(function(row){return row.official_date;});
    const ordered=rows.slice().sort(function(a,b){
      return Number(a.final_position||0)-Number(b.final_position||0);
    });
    const leader=ordered[0]||null;
    const bestGd=ordered.slice().sort(function(a,b){return Number(b.goal_difference||0)-Number(a.goal_difference||0);})[0]||null;
    const mostWins=ordered.slice().sort(function(a,b){return Number(b.won||0)-Number(a.won||0);})[0]||null;
    const worldId=state.selectedWorld||"GW004";

    return `
      <section class="nx-premium-standings">
        <div class="nx-premium-standing-head">
          <div>
            <small>FINAL STANDINGS · SEASON ${esc(season.season_number)}</small>
            <strong>${esc(competitionVisualLabel(state.selectedDivision||"Division"))}</strong>
            ${officialDate&&officialDate.official_date?`<span>Official · ${esc(formatDate(officialDate.official_date))}</span>`:""}
          </div>
          <div class="nx-standing-summary-grid">
            ${leader?`<div class="nx-standing-summary-card"><small>🏆 CAMPIONE</small><strong>${esc(globalClubDisplayName(leader.team_name))}</strong><span>${esc(leader.points)} PT</span></div>`:""}
            ${bestGd?`<div class="nx-standing-summary-card"><small>🎯 MIGLIOR DR</small><strong>${Number(bestGd.goal_difference||0)>0?"+":""}${esc(bestGd.goal_difference)}</strong><span>${esc(globalClubDisplayName(bestGd.team_name))}</span></div>`:""}
            ${mostWins?`<div class="nx-standing-summary-card"><small>🏆 PIÙ VITTORIE</small><strong>${esc(mostWins.won)}</strong><span>${esc(globalClubDisplayName(mostWins.team_name))}</span></div>`:""}
          </div>
        </div>

        <div class="nx-premium-standing-scroll">
          <table class="nx-premium-standing-table">
            <thead><tr><th>#</th><th>CLUB</th><th>G</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>PT</th></tr></thead>
            <tbody>
              ${ordered.map(function(row){
                const clubName=globalClubDisplayName(row.team_name);
                return `<tr class="${Number(row.final_position)===1?"is-leader":""}">
                  <td class="nx-standing-rank">${esc(row.final_position)}</td>
                  <td class="nx-standing-club-cell">
                    ${leagueClubLogo(clubName,worldId)}
                    <div><strong>${esc(clubName)}</strong>${row.manager_name?`<small>${esc(row.manager_name)}</small>`:""}</div>
                  </td>
                  <td>${esc(row.played)}</td><td>${esc(row.won)}</td><td>${esc(row.drawn)}</td><td>${esc(row.lost)}</td>
                  <td>${esc(row.goals_for)}</td><td>${esc(row.goals_against)}</td>
                  <td>${Number(row.goal_difference||0)>0?"+":""}${esc(row.goal_difference)}</td>
                  <td class="nx-standing-points">${esc(row.points)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function bindHistoricalStandingButtons(pastSeasons){
    const root=document.getElementById("divisionContent");
    if(!root)return;

    root.querySelectorAll("[data-standing-season]").forEach(function(button){
      button.addEventListener("click",function(){
        const value=button.getAttribute("data-standing-season")||"current";
        if(String(state.divisionStandingSeason)===String(value))return;
        state.divisionStandingSeason=value;
        loadDivisionData();
      });
    });
  }

  function renderCompetitionTrophyRoom(rows,seasons){
    const seasonMap=new Map();
    (seasons||[]).forEach(function(season){
      seasonMap.set(String(season.season_id),season);
    });

    const ordered=(rows||[]).slice().sort(function(a,b){
      const sa=seasonMap.get(String(a.season_id));
      const sb=seasonMap.get(String(b.season_id));
      return Number(sb&&sb.season_number||0)-Number(sa&&sa.season_number||0);
    });

    if(!ordered.length){
      return `<div class="nx-empty-box"><strong>Albo d'oro non disponibile</strong><span>Nessun vincitore storico ancora registrato per questa competizione.</span></div>`;
    }

    return `
      <div class="nx-trophy-history">
        <div class="nx-history-standing-head nx-trophy-history-head">
          <div>
            <small>TROPHY ROOM</small>
            <strong>Albo d'oro</strong>
          </div>
        </div>

        <div class="nx-honours-list">
          ${ordered.map(function(row){
            const season=seasonMap.get(String(row.season_id));
            const seasonNumber=season?season.season_number:"";
            const isNation=String(row.competition_type||"")==="world_cup";
            const logo=isNation
              ? standardMatchLogo("nation",row.winner_team_name,state.selectedWorld)
              : standardMatchLogo("club",row.winner_team_name,state.selectedWorld);

            return `
              <article class="nx-honour-card">
                <div class="nx-honour-season">
                  <span>SEASON ${esc(seasonNumber)}</span>
                  ${row.awarded_on?`<small>Official · ${esc(formatDate(row.awarded_on))}</small>`:""}
                </div>
                <div class="nx-honour-winner">
                  ${logo}
                  <div>
                    <small>CHAMPION</small>
                    <strong>${esc(isNation?row.winner_team_name:globalClubDisplayName(row.winner_team_name))}</strong>
                    ${row.winner_manager_name
                      ? `<span>${esc(row.winner_manager_name)}</span>`
                      : ""}
                  </div>
                </div>
              </article>`;
          }).join("")}
        </div>
      </div>`;
  }

  async function loadTrophyRoomForCompetition(competitionName){
    await ensureSeason2FinalHonoursV12(state.selectedWorld||null);
    const worldId=state.selectedWorld||"GW004";
    const results=await Promise.all([
      state.client
        .from("gw_season_honours")
        .select("season_id,competition_name,competition_type,winner_team_id,winner_team_name,awarded_on,winner_manager_id,winner_manager_name")
        .eq("game_world_id",worldId)
        .eq("competition_name",competitionName),
      state.client
        .from("gw_seasons")
        .select("season_id,season_number,season_status")
        .eq("game_world_id",worldId)
        .order("season_number",{ascending:false})
    ]);

    if(results[0].error)throw results[0].error;
    if(results[1].error)throw results[1].error;

    const auto=(state.autoFinalHonoursV12||[]).filter(function(h){return String(h.game_world_id)===String(worldId)&&String(h.competition_name)===String(competitionName);});
    return renderCompetitionTrophyRoom(mergeHonourRowsV12(results[0].data||[],auto),results[1].data||[]);
  }

  async function loadDivisionData(){
    if(!state.selectedDivision) return;

    const target=document.getElementById("divisionContent");
    if(!target||!state.client)return;

    try{
      const worldId=state.selectedWorld||"GW004";

      const compResult=await resolveWorldCompetitionRows(worldId,state.selectedDivision);

      if(compResult.error)throw compResult.error;

      const competitionRows=compResult.data||[];
      if(!competitionRows.length){
        throw new Error("Competizione non trovata: "+state.selectedDivision);
      }
      if(competitionRows.length>1){
        throw new Error("Competizione duplicata nel database: "+state.selectedDivision);
      }

      const selectedDivisionCompetition=competitionRows[0];

      if(state.divisionTab==="trophy"){
        target.innerHTML=await loadTrophyRoomForCompetition(state.selectedDivision);
        return;
      }

      if(state.divisionTab==="standings"){
        const pastSeasons=await loadPastWorldSeasons(worldId);
        const selected=String(state.divisionStandingSeason||"current");
        const seasonBar=historicalSeasonButtons(pastSeasons,selected);

        if(selected!=="current"){
          const season=pastSeasons.find(function(item){
            return String(item.season_id)===selected;
          });

          if(!season){
            state.divisionStandingSeason="current";
          }else{
            const historyResult=await state.client
              .from("gw_season_final_standings")
              .select("season_id,competition_id,division_name,final_position,team_id,team_name,played,won,drawn,lost,goals_for,goals_against,goal_difference,points,manager_id,manager_name,official_date")
              .eq("game_world_id",worldId)
              .eq("season_id",season.season_id)
              .eq("competition_id",selectedDivisionCompetition.competition_id)
              .order("final_position",{ascending:true});

            if(historyResult.error)throw historyResult.error;

            target.innerHTML=seasonBar+renderHistoricalStanding(historyResult.data||[],season);
            bindHistoricalStandingButtons(pastSeasons);
            return;
          }
        }

        const results=await Promise.all([
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
            .eq("game_world_id",worldId),
          state.client
            .from("gw_divisions")
            .select("division_id,promotion_total,promotion_direct,promotion_playoff,relegation_total")
            .eq("game_world_id",worldId)
            .eq("division_id",selectedDivisionCompetition.division_id)
            .maybeSingle()
        ]);

        if(results[0].error)throw results[0].error;
        if(results[1].error)throw results[1].error;
        if(results[2].error)throw results[2].error;

        const matches=attachMatchManagers(results[0].data||[],results[1].data||[],worldId);
        target.innerHTML=seasonBar+renderStandings(matches,results[2].data||null);
        bindHistoricalStandingButtons(pastSeasons);
        return;
      }

      const results=await Promise.all([
        state.client
          .from("gw_matches")
          .select(`
            match_id,
            season_id,
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
          .eq("game_world_id",worldId)
      ]);

      if(results[0].error)throw results[0].error;
      if(results[1].error)throw results[1].error;

      const matches=attachMatchManagers(results[0].data||[],results[1].data||[],worldId);

      // Build 32 · Global matchday registry. The official calendar skeleton comes
      // from gw_season_matchdays; gw_matches remains populated only by real imports.
      // If a division has no registry yet, Nexus falls back to the legacy renderer.
      const seasonResult=await state.client
        .from("gw_seasons")
        .select("season_id")
        .eq("game_world_id",worldId)
        .eq("season_status","current")
        .maybeSingle();

      if(seasonResult.error)throw seasonResult.error;

      let registry=[];
      const currentSeasonId=seasonResult.data&&seasonResult.data.season_id!=null
        ? seasonResult.data.season_id
        : null;

      if(currentSeasonId!=null&&selectedDivisionCompetition.division_id!=null){
        const registryResult=await state.client
          .from("gw_season_matchdays")
          .select("matchday_id,season_id,division_id,competition_id,matchday_number,matchday_type,match_date,label,expected_matches")
          .eq("game_world_id",worldId)
          .eq("season_id",currentSeasonId)
          .eq("division_id",selectedDivisionCompetition.division_id)
          .eq("matchday_type","league")
          .order("match_date",{ascending:true});

        if(registryResult.error)throw registryResult.error;
        registry=registryResult.data||[];
      }

      if(registry.length){
        // Keep legacy rows with NULL season_id visible, but exclude explicitly historical seasons.
        const registryMatches=matches.filter(function(match){
          return match.season_id==null||String(match.season_id)===String(currentSeasonId);
        });
        target.innerHTML=state.divisionTab==="results"
          ? renderMatchdayRegistryResults(registryMatches,registry)
          : renderMatchdayRegistrySchedule(registryMatches,registry);
        return;
      }

      if(state.divisionTab==="results"){
        target.innerHTML=renderResults(matches);
      }else{
        target.innerHTML=renderSchedule(matches);
      }
    }catch(error){
      target.innerHTML=`<div class="card"><div class="status error">${esc(error.message||"Errore caricamento dati.")}</div></div>`;
    }
  }

  function leagueClubLogo(name,worldId){
    const url=clubLogoUrl(name,worldId);
    const fallbackData=clubLogoFallbackData(name,worldId);
    if(!url)return `<span class="nx-league-club-logo is-fallback">◈</span>`;
    return `<span class="nx-league-club-logo"><img src="${esc(url)}" data-logo-fallbacks="${esc(fallbackData)}" alt="${esc(name)}" loading="lazy" onerror="if(!advanceClubLogoCandidate(this)){this.style.display='none';this.parentElement.classList.add('is-fallback');this.parentElement.textContent='◈';}"></span>`;
  }

  function singleLegKnockoutCompetitionName(name,type){
    const n=String(name||"").trim();
    const t=String(type||"").trim();
    return ["National Cup","League Cup","Charity Shield"].includes(n) || t==="domestic_cup" || t==="domestic_super_cup";
  }

  function cupClubLogo(match,side){
    const isNation=Boolean(match.home_nation_id||match.away_nation_id);
    const name=participantName(match,side);
    if(isNation){
      const code=name&&name.length?String(name).trim().slice(0,2).toUpperCase():"◈";
      return `<span class="nx-cup-club-logo is-fallback">${esc(code)}</span>`;
    }
    const url=clubLogoUrl(name,match.game_world_id||state.selectedWorld);
    const fallbackData=clubLogoFallbackData(name,match.game_world_id||state.selectedWorld);
    if(!url)return `<span class="nx-cup-club-logo is-fallback">◈</span>`;
    return `<span class="nx-cup-club-logo"><img src="${esc(url)}" data-logo-fallbacks="${esc(fallbackData)}" alt="${esc(name)}" loading="lazy" onerror="if(!advanceClubLogoCandidate(this)){this.style.display='none';this.parentElement.classList.add('is-fallback');this.parentElement.textContent='◈';}"></span>`;
  }

  function cupResultParticipant(match,side){
    const isNation=Boolean(match.home_nation_id||match.away_nation_id);
    const type=isNation?"nation":"club";
    const id=side==="home" ? (isNation?match.home_nation_id:match.home_team_id) : (isNation?match.away_nation_id:match.away_team_id);
    const name=participantName(match,side);
    const manager=side==="home"?match.home_manager:match.away_manager;
    return `<div class="nx-cup-result-team ${side}">
      ${side==="home"?cupClubLogo(match,side):""}
      <div class="nx-cup-result-copy">
        <button class="nx-cup-team-link" data-match-entity-type="${esc(type)}" data-match-entity-id="${esc(id)}" data-match-entity-name="${esc(name)}">${esc(name)}</button>
        ${manager?`<button class="nx-cup-manager-link" data-match-manager-id="${esc(manager.manager_id)}" data-match-manager-name="${esc(manager.full_name)}">${esc(manager.full_name)}</button>`:'<span class="nx-cup-manager-empty">&nbsp;</span>'}
      </div>
      ${side==="away"?cupClubLogo(match,side):""}
    </div>`;
  }

  function balancedScoreMarkup(match,status,className){
    const cls=className||"nx-cup-score-pill";
    if(status!=="played")return `<div class="${cls}"><strong class="is-vs">VS</strong></div>`;
    const hasPens=match.home_penalties!==null&&match.home_penalties!==undefined&&match.away_penalties!==null&&match.away_penalties!==undefined;
    return `<div class="${cls}"><strong>${esc(match.home_score)} - ${esc(match.away_score)}</strong>${hasPens?`<small class="nx-penalty-score">(${esc(match.home_penalties)} - ${esc(match.away_penalties)}) RIG.</small>`:""}</div>`;
  }

  function cupSingleLegScoreMarkup(match,status){
    return balancedScoreMarkup(match,status,"nx-cup-score-pill");
  }

  function leagueScheduleParticipant(match,side){
    const name=participantName(match,side);
    const id=side==="home"?match.home_team_id:match.away_team_id;
    const manager=side==="home"?match.home_manager:match.away_manager;
    return `<div class="nx-league-result-team ${side}">
      ${side==="home"?leagueClubLogo(name,match.game_world_id||state.selectedWorld):""}
      <div class="nx-league-result-copy">
        <button class="nx-league-team-link" data-match-entity-type="club" data-match-entity-id="${esc(id)}" data-match-entity-name="${esc(name)}">${esc(name)}</button>
        ${manager?`<button class="nx-league-manager-link" data-match-manager-id="${esc(manager.manager_id)}" data-match-manager-name="${esc(manager.full_name)}">${esc(manager.full_name)}</button>`:'<span class="nx-league-manager-empty">&nbsp;</span>'}
      </div>
      ${side==="away"?leagueClubLogo(name,match.game_world_id||state.selectedWorld):""}
    </div>`;
  }

  function renderDedicatedFinal(day,status,allMatches){
    const groups=Object.keys(day.groups||{});
    const matches=groups.reduce(function(list,groupName){return list.concat(day.groups[groupName]||[]);},[]);
    if(!matches.length)return "";
    const match=matches[0];
    const competition=String(state.selectedCompetition||"Competition");
    const theme=competitionThemeConfig(competition);
    const score=status==="played"?`${esc(match.home_score)} - ${esc(match.away_score)}`:"VS";
    const hasPens=status==="played"&&match.home_penalties!==null&&match.home_penalties!==undefined&&match.away_penalties!==null&&match.away_penalties!==undefined;
    const homeName=participantName(match,"home"),awayName=participantName(match,"away");
    const homeManager=match.home_manager,awayManager=match.away_manager;
    return `<section class="nx-dedicated-final" style="--nx-final-main:${theme.main};--nx-final-soft:${theme.soft}">
      <div class="nx-dedicated-final-head"><span>${esc(compactCompetitionName(competition).toUpperCase())}</span><strong>FINAL</strong><time>${esc(formatDate(day.match_date))}</time></div>
      <div class="nx-final-badge">PARTITA UNICA</div>
      <div class="nx-final-match">
        <div class="nx-final-team home">
          ${cupClubLogo(match,"home")}
          <strong>${esc(homeName)}</strong>
          ${homeManager?`<small>${esc(homeManager.full_name)}</small>`:""}
        </div>
        <div class="nx-final-center">
          <div class="nx-final-score">${score}</div>
          ${hasPens?`<div class="nx-final-pens">(${esc(match.home_penalties)} - ${esc(match.away_penalties)}) RIG.</div>`:""}
          <div class="nx-final-trophy">${trophyRoomImageMarkup(competition,resolveCompetitionType(competition),false)}</div>
        </div>
        <div class="nx-final-team away">
          ${cupClubLogo(match,"away")}
          <strong>${esc(awayName)}</strong>
          ${awayManager?`<small>${esc(awayManager.full_name)}</small>`:""}
        </div>
      </div>
    </section>`;
  }

  function competitionMatchHeaderParts(roundName,competitionName){
    const round=String(roundName||"").trim();
    const competition=String(compactCompetitionName(competitionName||"Competition")||"Competition").trim();
    let match;
    match=round.match(/^Group Stage\s*·\s*Match\s*(\d+)/i);
    if(match)return {left:"GROUP STAGE",center:"MATCH "+match[1]};
    match=round.match(/^Knockout Stage\s*·\s*Round\s*(\d+)\s*·\s*Leg\s*([12])/i);
    if(match)return {left:"KNOCKOUT STAGE",center:"ROUND "+match[1]+" · LEG "+match[2]};
    if(/^Final$/i.test(round))return {left:competition.toUpperCase(),center:"FINAL"};
    if(/quarter[- ]?final/i.test(round))return {left:competition.toUpperCase(),center:"QUARTER-FINALS"};
    if(/semi[- ]?final/i.test(round))return {left:competition.toUpperCase(),center:"SEMI-FINALS"};
    match=round.match(/^Round\s*(.*)$/i);
    if(match)return {left:competition.toUpperCase(),center:("ROUND"+(match[1]?" "+match[1]:"")).toUpperCase()};
    return {left:competition.toUpperCase(),center:(round||"MATCH").toUpperCase()};
  }

  function competitionMatchHeaderMarkup(roundName,date,competitionName){
    const parts=competitionMatchHeaderParts(roundName,competitionName);
    return `<div class="nx-unified-matchday-head"><small>${esc(parts.left)}</small><strong>${esc(parts.center)}</strong><time>${esc(formatDate(date))}</time></div>`;
  }

  function renderSingleLegKnockoutCompetition(matchdays,status){
    return Object.values(matchdays)
      .sort(function(a,b){
        const dateA=String(a.match_date||"");
        const dateB=String(b.match_date||"");
        const dateDiff=status==="played"?dateB.localeCompare(dateA):dateA.localeCompare(dateB);
        if(dateDiff!==0)return dateDiff;
        const dayA=matchdayNumber(a.round_name);
        const dayB=matchdayNumber(b.round_name);
        const dayDiff=status==="played"?dayB-dayA:dayA-dayB;
        if(dayDiff!==0)return dayDiff;
        return String(a.round_name).localeCompare(String(b.round_name));
      })
      .map(function(day){
        if(isFinalRoundLabel(day.round_name))return renderDedicatedFinal(day,status,[]);
        const groups=Object.keys(day.groups);
        const roundMatches=groups.reduce(function(list,groupName){return list.concat(day.groups[groupName]||[]);},[]);
        return `<section class="nx-cup-round-card">
          ${competitionMatchHeaderMarkup(day.round_name||"Round",day.match_date,state.selectedCompetition||"Competition")}
          <div class="nx-cup-round-list nx-balanced-match-list">
            ${roundMatches.map(function(match){
              return `<div class="nx-cup-result-row nx-balanced-match-row">
                ${cupResultParticipant(match,"home")}
                ${cupSingleLegScoreMarkup(match,status)}
                ${cupResultParticipant(match,"away")}
              </div>`;
            }).join("")}
          </div>
        </section>`;
      }).join("");
  }

  function leagueStandingRows(matches){
    return StatisticsEngine.standings(matches,function(match){
      return {home:participantName(match,"home"),away:participantName(match,"away")};
    });
  }

  function leaguePositionMap(matches){
    const map=new Map();
    leagueStandingRows(matches).forEach(function(row,index){map.set(normalizeParticipantKey(row.team),index+1);});
    return map;
  }

  function leagueTeamMeta(matches){
    const map=new Map();
    (matches||[]).slice().sort(function(a,b){
      return String(a.match_date||"").localeCompare(String(b.match_date||"")) || Number(a.match_id||0)-Number(b.match_id||0);
    }).forEach(function(match){
      [["home",match.home_team_id,match.home_manager],["away",match.away_team_id,match.away_manager]].forEach(function(item){
        const side=item[0],id=item[1],manager=item[2],name=participantName(match,side),key=normalizeParticipantKey(name);
        map.set(key,{id:id,name:name,manager:manager||null,date:match.match_date||""});
      });
    });
    return map;
  }

  function leagueFormForTeam(matches,teamName){
    const key=normalizeParticipantKey(teamName);
    return (matches||[]).filter(StatisticsEngine.isPlayed).filter(function(match){
      return normalizeParticipantKey(participantName(match,"home"))===key || normalizeParticipantKey(participantName(match,"away"))===key;
    }).sort(function(a,b){
      return String(b.match_date||"").localeCompare(String(a.match_date||"")) || Number(b.match_id||0)-Number(a.match_id||0);
    }).slice(0,5).map(function(match){
      const home=normalizeParticipantKey(participantName(match,"home"))===key;
      const gf=Number(home?match.home_score:match.away_score),ga=Number(home?match.away_score:match.home_score);
      return gf>ga?"W":gf<ga?"L":"D";
    });
  }

  function leaguePositionImpact(currentMap,previousMap,teamName){
    const key=normalizeParticipantKey(teamName),position=currentMap.get(key)||null,previous=previousMap.get(key)||null;
    if(!position)return "";
    if(!previous)return `<span class="nx-league-rank-chip"><strong>${position}°</strong><em>—</em></span>`;
    const delta=previous-position;
    if(delta>0)return `<span class="nx-league-rank-chip is-up"><strong>${position}°</strong><em>▲ ${delta}</em></span>`;
    if(delta<0)return `<span class="nx-league-rank-chip is-down"><strong>${position}°</strong><em>▼ ${Math.abs(delta)}</em></span>`;
    return `<span class="nx-league-rank-chip"><strong>${position}°</strong><em>—</em></span>`;
  }

  function leagueThemeConfig(name){
    const normalized=String(name||"").toLowerCase().replace(/\s+/g," ").trim();
    if(/division\s*(1|one)\b/.test(normalized))return {accent:"#163B8C",accentSoft:"rgba(22,59,140,.24)"};
    if(/division\s*(2|two)\b/.test(normalized))return {accent:"#B68A2E",accentSoft:"rgba(182,138,46,.24)"};
    if(/division\s*(3|three)\b/.test(normalized))return {accent:"#8A96A8",accentSoft:"rgba(138,150,168,.26)"};
    if(/division\s*(4|four)\b/.test(normalized))return {accent:"#A56A43",accentSoft:"rgba(165,106,67,.24)"};
    if(/division\s*(5|five)\b/.test(normalized))return {accent:"#424242",accentSoft:"rgba(66,66,66,.22)"};
    return {accent:"#163B8C",accentSoft:"rgba(22,59,140,.20)"};
  }

  function leagueResultsThemeStyle(){
    const theme=leagueThemeConfig(state.selectedDivision||"");
    return `style="--nx-league-accent:${theme.accent};--nx-league-accent-soft:${theme.accentSoft}"`;
  }

  function renderLeagueResultsCover(){
    const label=String(state.selectedDivision||"Division").trim()||"Division";
    const worldId=state.selectedWorld||"GW004";
    const worldName=selectedWorldName()||"Game World";
    return `<section class="nx-league-cover" ${leagueResultsThemeStyle()}>
      <div class="nx-league-cover-inner">
        <div class="nx-league-cover-art">${trophyRoomImageMarkup(label,"league",false)}</div>
        <div class="nx-league-cover-copy">
          <em>Results</em>
          <strong>${esc(label)}</strong>
          <span>${esc(worldId)} · ${esc(worldName)} · Domestic</span>
        </div>
      </div>
    </section>`;
  }

  function leagueResultParticipant(match,side,currentMap,previousMap){
    const name=participantName(match,side),id=side==="home"?match.home_team_id:match.away_team_id,manager=side==="home"?match.home_manager:match.away_manager;
    return `<div class="nx-league-result-team ${side}">
      ${side==="home"?leagueClubLogo(name,match.game_world_id||state.selectedWorld):""}
      <div class="nx-league-result-copy">
        <button class="nx-league-team-link" data-match-entity-type="club" data-match-entity-id="${esc(id)}" data-match-entity-name="${esc(name)}">${esc(name)}</button>
        ${manager?`<button class="nx-league-manager-link" data-match-manager-id="${esc(manager.manager_id)}" data-match-manager-name="${esc(manager.full_name)}">${esc(manager.full_name)}</button>`:"<span class=\"nx-league-manager-empty\">&nbsp;</span>"}
        ${leaguePositionImpact(currentMap,previousMap,name)}
      </div>
      ${side==="away"?leagueClubLogo(name,match.game_world_id||state.selectedWorld):""}
    </div>`;
  }

  function leagueMatchdaySnapshot(matches){
    const rows=(matches||[]).filter(StatisticsEngine.isPlayed);
    const totalGoals=rows.reduce(function(sum,m){return sum+Number(m.home_score||0)+Number(m.away_score||0);},0);
    const homeWins=rows.filter(function(m){return Number(m.home_score)>Number(m.away_score);}).length;
    const awayWins=rows.filter(function(m){return Number(m.away_score)>Number(m.home_score);}).length;
    const draws=rows.filter(function(m){return Number(m.home_score)===Number(m.away_score);}).length;
    let biggest=null,biggestMargin=-1;
    rows.forEach(function(m){
      const margin=Math.abs(Number(m.home_score)-Number(m.away_score));
      if(margin>biggestMargin){biggestMargin=margin;biggest=m;}
    });
    return {totalGoals:totalGoals,homeWins:homeWins,awayWins:awayWins,draws:draws,biggest:biggest,biggestMargin:biggestMargin};
  }

  // Build 32 · Global registry rendering for every league division with official matchdays.
  // Matchdays come from gw_season_matchdays; fixtures/results still come only from gw_matches.
  function nexusLocalIsoDate(){
    const now=new Date();
    const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,10);
  }

  function matchdayRegistryBucket(matchday,matches,today){
    const date=String(matchday&&matchday.match_date||"");
    if(date<today)return "results";
    if(date>today)return "schedule";
    const rows=(matches||[]).filter(function(match){return String(match.match_date||"")===date;});
    return rows.some(StatisticsEngine.isPlayed)?"results":"schedule";
  }

  function matchdayRegistryRoundLabel(matchday){
    const number=Number(matchday&&matchday.matchday_number||0);
    if(number)return "Match "+number;
    const label=String(matchday&&matchday.label||"").trim();
    return label||"Match";
  }

  function matchdayRegistryEmptyMarkup(kind){
    const isResults=kind==="results";
    return `<div class="nx-matchday-registry-empty ${isResults?"is-results":"is-schedule"}">
      <strong>${isResults?"RISULTATI NON ANCORA IMPORTATI":"PARTITE NON ANCORA IMPORTATE"}</strong>
      <span>${isResults?"Il Matchday è nel calendario ufficiale, ma non risultano ancora punteggi caricati.":"Il Matchday è nel calendario ufficiale, ma le fixture non sono ancora state importate."}</span>
    </div>`;
  }

  function matchdayRegistryProgressMarkup(kind,loaded,expected){
    const total=Math.max(0,Number(expected||0));
    if(!total||loaded>=total)return "";
    return `<div class="nx-matchday-registry-progress"><strong>${esc(loaded)} / ${esc(total)}</strong><span>${kind==="results"?"RISULTATI IMPORTATI":"PARTITE IMPORTATE"}</span></div>`;
  }

  function renderMatchdayRegistryResults(matches,registry){
    const today=nexusLocalIsoDate();
    const allPlayed=(matches||[]).filter(StatisticsEngine.isPlayed);
    const days=(registry||[]).filter(function(day){return matchdayRegistryBucket(day,matches,today)==="results";});
    if(!days.length)return `<div class="card"><div class="row-sub">Nessun Matchday precedente disponibile.</div></div>`;

    const cards=days.slice().sort(function(a,b){return String(b.match_date||"").localeCompare(String(a.match_date||""));}).map(function(day){
      const date=String(day.match_date||"");
      const playedForDate=allPlayed.filter(function(match){return String(match.match_date||"")===date;});
      const currentMatches=allPlayed.filter(function(match){return !match.match_date||String(match.match_date)<=date;});
      const previousMatches=allPlayed.filter(function(match){return match.match_date&&String(match.match_date)<date;});
      const currentMap=leaguePositionMap(currentMatches);
      const previousMap=leaguePositionMap(previousMatches);
      const snapshot=leagueMatchdaySnapshot(playedForDate);
      const biggest=snapshot.biggest;

      return `<section class="nx-league-matchday-card nx-matchday-registry-card" ${leagueResultsThemeStyle()}>
        ${competitionMatchHeaderMarkup(matchdayRegistryRoundLabel(day),date,state.selectedDivision||"Division")}
        ${playedForDate.length?`<div class="nx-league-results-list">
          ${playedForDate.map(function(match){return `<div class="nx-league-result-row">
            ${leagueResultParticipant(match,"home",currentMap,previousMap)}
            ${balancedScoreMarkup(match,"played","nx-league-score-pill")}
            ${leagueResultParticipant(match,"away",currentMap,previousMap)}
          </div>`;}).join("")}
        </div>
        <div class="nx-matchday-snapshot">
          <strong>MATCHDAY SNAPSHOT</strong>
          <div class="nx-matchday-snapshot-grid">
            <div><b>⚽ ${snapshot.totalGoals}</b><span>GOL TOTALI</span></div>
            <div><b>⌂ ${snapshot.homeWins}</b><span>VITTORIE CASA</span></div>
            <div><b>✈ ${snapshot.awayWins}</b><span>VITTORIE TRASFERTA</span></div>
            <div><b>＝ ${snapshot.draws}</b><span>PAREGGI</span></div>
          </div>
        </div>
        ${biggest&&snapshot.biggestMargin>0?`<div class="nx-biggest-win"><span>★ BIGGEST WIN</span><strong>${Number(biggest.home_score)>Number(biggest.away_score)?`${esc(participantName(biggest,"home"))} ${esc(biggest.home_score)} - ${esc(biggest.away_score)} ${esc(participantName(biggest,"away"))}`:`${esc(participantName(biggest,"away"))} ${esc(biggest.away_score)} - ${esc(biggest.home_score)} ${esc(participantName(biggest,"home"))}`}</strong></div>`:""}`:matchdayRegistryEmptyMarkup("results")}
        ${matchdayRegistryProgressMarkup("results",playedForDate.length,day.expected_matches)}
      </section>`;
    }).join("");

    return `<div class="nx-league-results-shell"><div class="nx-league-matchday-stack nx-matchday-registry-stack" ${leagueResultsThemeStyle()}>${cards}</div></div>`;
  }

  function renderMatchdayRegistrySchedule(matches,registry){
    const today=nexusLocalIsoDate();
    const cleanMatches=removeResultsScheduleDuplicates(matches||[]);
    const days=(registry||[]).filter(function(day){return matchdayRegistryBucket(day,matches,today)==="schedule";});
    if(!days.length)return `<div class="card"><div class="row-sub">Nessun Matchday futuro disponibile.</div></div>`;

    const cards=days.slice().sort(function(a,b){return String(a.match_date||"").localeCompare(String(b.match_date||""));}).map(function(day){
      const date=String(day.match_date||"");
      const scheduledForDate=cleanMatches.filter(function(match){
        return String(match.match_date||"")===date&&!StatisticsEngine.isPlayed(match);
      });

      return `<section class="nx-league-matchday-card nx-matchday-registry-card" ${leagueResultsThemeStyle()}>
        ${competitionMatchHeaderMarkup(matchdayRegistryRoundLabel(day),date,state.selectedDivision||"Division")}
        ${scheduledForDate.length?`<div class="nx-league-results-list nx-balanced-match-list">
          ${scheduledForDate.map(function(match){return `<div class="nx-league-result-row nx-balanced-match-row">
            ${leagueScheduleParticipant(match,"home")}
            ${balancedScoreMarkup(match,"scheduled","nx-league-score-pill")}
            ${leagueScheduleParticipant(match,"away")}
          </div>`;}).join("")}
        </div>`:matchdayRegistryEmptyMarkup("schedule")}
        ${matchdayRegistryProgressMarkup("schedule",scheduledForDate.length,day.expected_matches)}
      </section>`;
    }).join("");

    return `<div class="nx-league-matchday-stack nx-matchday-registry-stack" ${leagueResultsThemeStyle()}>${cards}</div>`;
  }

  function renderResults(matches){
    const played=matches.filter(StatisticsEngine.isPlayed);
    if(!played.length)return `<div class="card"><div class="row-sub">Nessun risultato disponibile.</div></div>`;

    const dates=Array.from(new Set(matches.map(function(match){return match.match_date;}).filter(Boolean))).sort();
    const matchdayByDate=new Map();
    dates.forEach(function(date,index){matchdayByDate.set(date,index+1);});

    const grouped={};
    played.forEach(function(match){
      const key=match.match_date||"Senza data";
      (grouped[key]||(grouped[key]=[])).push(match);
    });

    const cards=Object.keys(grouped).sort(function(a,b){return b.localeCompare(a);}).map(function(date){
      const sample=grouped[date][0];
      const officialMatchday=officialLeagueMatchday(state.selectedWorld||"GW004",date,null);
      const roundNumber=officialMatchday||(matchdayByDate.get(date)||"");
      const roundLabel=officialMatchday?"Match "+officialMatchday:(sample&&sample.round_name?sample.round_name:"Match "+roundNumber);
      const currentMatches=played.filter(function(m){return !m.match_date||m.match_date<=date;});
      const previousMatches=played.filter(function(m){return m.match_date&&m.match_date<date;});
      const currentMap=leaguePositionMap(currentMatches);
      const previousMap=leaguePositionMap(previousMatches);
      const snapshot=leagueMatchdaySnapshot(grouped[date]);
      const biggest=snapshot.biggest;

      return `<section class="nx-league-matchday-card" ${leagueResultsThemeStyle()}>
        ${competitionMatchHeaderMarkup(roundLabel,date,state.selectedDivision||"Division")}
        <div class="nx-league-results-list">
          ${grouped[date].map(function(match){
            return `<div class="nx-league-result-row">
              ${leagueResultParticipant(match,"home",currentMap,previousMap)}
              ${balancedScoreMarkup(match,"played","nx-league-score-pill")}
              ${leagueResultParticipant(match,"away",currentMap,previousMap)}
            </div>`;
          }).join("")}
        </div>
        <div class="nx-matchday-snapshot">
          <strong>MATCHDAY SNAPSHOT</strong>
          <div class="nx-matchday-snapshot-grid">
            <div><b>⚽ ${snapshot.totalGoals}</b><span>GOL TOTALI</span></div>
            <div><b>⌂ ${snapshot.homeWins}</b><span>VITTORIE CASA</span></div>
            <div><b>✈ ${snapshot.awayWins}</b><span>VITTORIE TRASFERTA</span></div>
            <div><b>＝ ${snapshot.draws}</b><span>PAREGGI</span></div>
          </div>
        </div>
        ${biggest&&snapshot.biggestMargin>0?`<div class="nx-biggest-win"><span>★ BIGGEST WIN</span><strong>${Number(biggest.home_score)>Number(biggest.away_score)?`${esc(participantName(biggest,"home"))} ${esc(biggest.home_score)} - ${esc(biggest.away_score)} ${esc(participantName(biggest,"away"))}`:`${esc(participantName(biggest,"away"))} ${esc(biggest.away_score)} - ${esc(biggest.home_score)} ${esc(participantName(biggest,"home"))}`}</strong></div>`:""}
      </section>`;
    }).join("");

    return `<div class="nx-league-results-shell"><div class="nx-league-matchday-stack" ${leagueResultsThemeStyle()}>${cards}</div></div>`;
  }

  function renderSchedule(matches){
    const cleanMatches=removeResultsScheduleDuplicates(matches);
    const scheduled=cleanMatches.filter(function(match){return !StatisticsEngine.isPlayed(match);});
    if(!scheduled.length)return `<div class="card"><div class="row-sub">Nessuna partita programmata disponibile.</div></div>`;

    const dates=Array.from(new Set(cleanMatches.map(function(match){return match.match_date;}).filter(Boolean))).sort();
    const matchdayByDate=new Map();
    dates.forEach(function(date,index){matchdayByDate.set(date,index+1);});
    const grouped={};
    scheduled.forEach(function(match){const key=match.match_date||"Senza data";(grouped[key]||(grouped[key]=[])).push(match);});

    const cards=Object.keys(grouped).sort(function(a,b){return a.localeCompare(b);}).map(function(date){
      const sample=grouped[date][0];
      const officialMatchday=officialLeagueMatchday(state.selectedWorld||"GW004",date,null);
      const roundLabel=officialMatchday?"Match "+officialMatchday:(sample&&sample.round_name?sample.round_name:"Match "+(matchdayByDate.get(date)||""));
      return `<section class="nx-league-matchday-card" ${leagueResultsThemeStyle()}>
        ${competitionMatchHeaderMarkup(roundLabel,date,state.selectedDivision||"Division")}
        <div class="nx-league-results-list nx-balanced-match-list">
          ${grouped[date].map(function(match){return `<div class="nx-league-result-row nx-balanced-match-row">
            ${leagueScheduleParticipant(match,"home")}
            ${balancedScoreMarkup(match,"scheduled","nx-league-score-pill")}
            ${leagueScheduleParticipant(match,"away")}
          </div>`;}).join("")}
        </div>
      </section>`;
    }).join("");
    return `<div class="nx-league-matchday-stack" ${leagueResultsThemeStyle()}>${cards}</div>`;
  }

  function renderStandings(matches,divisionRules){
    const played=matches.filter(StatisticsEngine.isPlayed);
    const rows=leagueStandingRows(played);
    if(!rows.length)return `<div class="card"><div class="row-sub">Classifica non disponibile: nessun risultato giocato.</div></div>`;

    const meta=leagueTeamMeta(matches),worldId=state.selectedWorld||"GW004";
    const playedDates=Array.from(new Set(played.map(function(m){return m.match_date;}).filter(Boolean)));
    const allDates=Array.from(new Set(matches.map(function(m){return m.match_date;}).filter(Boolean)));
    const leader=rows[0]||null;
    const bestGd=rows.slice().sort(function(a,b){return b.gd-a.gd;})[0]||null;
    const mostWins=rows.slice().sort(function(a,b){return b.won-a.won;})[0]||null;
    const direct=Math.max(0,Number(divisionRules&&divisionRules.promotion_direct||0));
    const playoff=Math.max(0,Number(divisionRules&&divisionRules.promotion_playoff||0));
    const relegation=Math.max(0,Number(divisionRules&&divisionRules.relegation_total||0));

    function zoneClass(index){
      if(index===0)return "is-leader";
      if(direct&&index<direct)return "is-promotion";
      if(playoff&&index<direct+playoff)return "is-playoff";
      if(relegation&&index>=rows.length-relegation)return "is-relegation";
      return "";
    }

    return `<section class="nx-premium-standings">
      <div class="nx-premium-standing-head">
        <div>
          <small>${esc(String(state.selectedDivision||"Division").toUpperCase())} · STANDINGS</small>
          <strong>${playedDates.length} / ${Math.max(playedDates.length,allDates.length)} GIORNATE GIOCATE</strong>
        </div>
        <div class="nx-standing-summary-grid">
          ${leader?`<div class="nx-standing-summary-card"><small>🏆 LEADER</small><strong>${esc(leader.team)}</strong><span>${leader.points} PT</span></div>`:""}
          ${bestGd?`<div class="nx-standing-summary-card"><small>🎯 MIGLIOR DR</small><strong>${bestGd.gd>0?"+":""}${bestGd.gd}</strong><span>${esc(bestGd.team)}</span></div>`:""}
          ${mostWins?`<div class="nx-standing-summary-card"><small>🏆 PIÙ VITTORIE</small><strong>${mostWins.won}</strong><span>${esc(mostWins.team)}</span></div>`:""}
        </div>
      </div>

      <div class="nx-premium-standing-scroll">
        <table class="nx-premium-standing-table nx-live-standing-table">
          <thead><tr><th>#</th><th>CLUB</th><th>G</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>PT</th><th>FORMA</th></tr></thead>
          <tbody>${rows.map(function(row,index){
            const key=normalizeParticipantKey(row.team),teamMeta=meta.get(key)||{},form=leagueFormForTeam(played,row.team);
            return `<tr class="${zoneClass(index)}">
              <td class="nx-standing-rank">${index+1}</td>
              <td class="nx-standing-club-cell">
                ${leagueClubLogo(row.team,worldId)}
                <div>
                  ${teamMeta.id?`<button class="nx-standing-team-link" data-match-entity-type="club" data-match-entity-id="${esc(teamMeta.id)}" data-match-entity-name="${esc(row.team)}">${esc(row.team)}</button>`:`<strong>${esc(row.team)}</strong>`}
                  ${teamMeta.manager?`<button class="nx-standing-manager-link" data-match-manager-id="${esc(teamMeta.manager.manager_id)}" data-match-manager-name="${esc(teamMeta.manager.full_name)}">${esc(teamMeta.manager.full_name)}</button>`:""}
                </div>
              </td>
              <td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td><td>${row.gf}</td><td>${row.ga}</td>
              <td>${row.gd>0?"+":""}${row.gd}</td><td class="nx-standing-points">${row.points}</td>
              <td><span class="nx-form-dots">${form.map(function(value){return `<i class="is-${value.toLowerCase()}" title="${value}"></i>`;}).join("")}</span></td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>`;
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
    const supportsStandings=competitionSupportsStandings(state.selectedCompetition);
    return `
      <section class="section" ${competitionThemeInlineStyle(state.selectedCompetition)}>
        <button class="back-link" id="backCompetitions">‹ Competitions</button>
        ${competitionCoverMarkup(state.selectedCompetition,state.competitionTab,resolveCompetitionType(state.selectedCompetition))}
        <div class="world-tabs">
          <button class="world-tab ${state.competitionTab==="results" ? "active" : ""}" data-competition-tab="results">RESULTS</button>
          ${supportsStandings?`<button class="world-tab ${state.competitionTab==="standings" ? "active" : ""}" data-competition-tab="standings">STANDINGS</button>`:""}
          <button class="world-tab ${state.competitionTab==="schedule" ? "active" : ""}" data-competition-tab="schedule">SCHEDULE</button>
        </div>
        <div id="competitionContent"><div class="card"><div class="row-sub">Caricamento dati…</div></div></div>
      </section>
    `;
  }

  async function loadCompetitionData(){
    if(!state.selectedCompetition)return;

    const target=document.getElementById("competitionContent");
    if(!target||!state.client)return;

    try{
      const worldId=state.selectedWorld||"GW004";

      if(state.competitionTab==="trophy"){
        target.innerHTML=await loadTrophyRoomForCompetition(state.selectedCompetition);
        return;
      }

      const competitionResult=await resolveWorldCompetitionRows(worldId,state.selectedCompetition);

      if(competitionResult.error)throw competitionResult.error;

      const competitionRows=competitionResult.data||[];
      if(!competitionRows.length){
        throw new Error("Competizione non trovata nel database: "+state.selectedCompetition);
      }
      if(competitionRows.length>1){
        throw new Error("Competizione duplicata nel database: "+state.selectedCompetition);
      }

      const selectedCompetitionRow=competitionRows[0];

      const results=await Promise.all([
        state.client
          .from("gw_matches")
          .select(`
            match_id,
            season_id,
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
            decided_on_penalties,
            penalty_winner_team_id,
            penalty_winner_nation_id,
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
          .eq("game_world_id",worldId)
      ]);

      const matchesResult=results[0];
      const assignmentsResult=results[1];
      if(matchesResult.error)throw matchesResult.error;
      if(assignmentsResult.error)throw assignmentsResult.error;

      const matches=attachMatchManagers(matchesResult.data||[],assignmentsResult.data||[],worldId);

      if(state.competitionTab==="results"){
        target.innerHTML=renderCompetitionMatches(matches,"played");
       }else if(state.competitionTab==="standings"&&competitionSupportsStandings(state.selectedCompetition)){
        target.innerHTML=renderCompetitionGroupStandings(matches);
      }else{
        target.innerHTML=renderCompetitionMatches(matches,"scheduled");
      }
    }catch(error){
      target.innerHTML=`<div class="card"><div class="status error">${esc(error.message||"Errore caricamento competizione.")}</div></div>`;
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

  function knockoutRoundLegMeta(value){
    const match=String(value||"").match(/Knockout Stage\s*·\s*Round\s+(\d+)\s*·\s*Leg\s+([12])/i);
    return match ? {round:Number(match[1]),leg:Number(match[2])} : null;
  }

  function matchParticipantIdentity(match,side){
    const teamId=side==="home"?match.home_team_id:match.away_team_id;
    const nationId=side==="home"?match.home_nation_id:match.away_nation_id;
    if(teamId!==null&&teamId!==undefined)return "T:"+String(teamId);
    if(nationId!==null&&nationId!==undefined)return "N:"+String(nationId);
    return "NAME:"+normalizeParticipantKey(participantName(match,side));
  }

  function sameMatchParticipants(a,b){
    const aIds=[matchParticipantIdentity(a,"home"),matchParticipantIdentity(a,"away")].sort();
    const bIds=[matchParticipantIdentity(b,"home"),matchParticipantIdentity(b,"away")].sort();
    return aIds[0]===bIds[0]&&aIds[1]===bIds[1];
  }

  function scoreForParticipant(match,participantId){
    if(matchParticipantIdentity(match,"home")===participantId)return Number(match.home_score);
    if(matchParticipantIdentity(match,"away")===participantId)return Number(match.away_score);
    return null;
  }

  function awayGoalsForParticipant(match,participantId){
    if(matchParticipantIdentity(match,"away")!==participantId)return 0;
    return match.away_score===null||match.away_score===undefined?0:Number(match.away_score);
  }

  function knockoutAggregateInfo(match,allMatches){
    const meta=knockoutRoundLegMeta(match._display_round_name||match.round_name);
    if(!meta||meta.leg!==2||!isCompetitionPlayed(match))return null;

    const leg1=(allMatches||[]).find(function(candidate){
      const candidateMeta=knockoutRoundLegMeta(candidate._display_round_name||candidate.round_name);
      return candidate!==match &&
        candidateMeta &&
        candidateMeta.round===meta.round &&
        candidateMeta.leg===1 &&
        isCompetitionPlayed(candidate) &&
        sameMatchParticipants(candidate,match);
    });

    if(!leg1)return null;
    if(leg1.home_score===null||leg1.away_score===null||match.home_score===null||match.away_score===null)return null;

    const homeId=matchParticipantIdentity(match,"home");
    const awayId=matchParticipantIdentity(match,"away");
    const homeTotal=Number(match.home_score)+Number(scoreForParticipant(leg1,homeId));
    const awayTotal=Number(match.away_score)+Number(scoreForParticipant(leg1,awayId));
    const homeName=participantName(match,"home");
    const awayName=participantName(match,"away");

    if(homeTotal>awayTotal){
      return {winner:homeName,winner_score:homeTotal,loser:awayName,loser_score:awayTotal};
    }
    if(awayTotal>homeTotal){
      return {winner:awayName,winner_score:awayTotal,loser:homeName,loser_score:homeTotal};
    }

    // Solo GW008 IMC Shield applica ancora la regola dei gol in trasferta.
    if(isGw008ShieldKnockoutOnly(state.selectedWorld,state.selectedCompetition)){
      const homeAwayGoals=awayGoalsForParticipant(leg1,homeId)+awayGoalsForParticipant(match,homeId);
      const awayAwayGoals=awayGoalsForParticipant(leg1,awayId)+awayGoalsForParticipant(match,awayId);
      if(homeAwayGoals!==awayAwayGoals){
        const winnerIsHome=homeAwayGoals>awayAwayGoals;
        return {
          winner:winnerIsHome?homeName:awayName,
          winner_score:homeTotal,
          loser:winnerIsHome?awayName:homeName,
          loser_score:awayTotal,
          aggregate_tied:true,
          decision:"away_goals",
          home_name:homeName,
          away_name:awayName,
          home_away_goals:homeAwayGoals,
          away_away_goals:awayAwayGoals
        };
      }
    }

    let penaltyWinner="";
    if(match.penalty_winner_team_id!==null&&match.penalty_winner_team_id!==undefined){
      const winnerId="T:"+String(match.penalty_winner_team_id);
      penaltyWinner=winnerId===homeId?homeName:(winnerId===awayId?awayName:"");
    }else if(match.penalty_winner_nation_id!==null&&match.penalty_winner_nation_id!==undefined){
      const winnerId="N:"+String(match.penalty_winner_nation_id);
      penaltyWinner=winnerId===homeId?homeName:(winnerId===awayId?awayName:"");
    }

    return {
      winner:penaltyWinner,
      winner_score:homeTotal,
      loser:"",
      loser_score:awayTotal,
      tied:true,
      decision:penaltyWinner?"penalties":"unresolved",
      home_name:homeName,
      away_name:awayName
    };
  }

  function renderKnockoutAggregate(match,allMatches){
    const info=knockoutAggregateInfo(match,allMatches);
    if(!info)return "";

    if(info.decision==="away_goals"){
      return `<div class="nx-knockout-aggregate"><strong>${esc(info.winner)} qualificata</strong> · Aggregato ${esc(info.winner_score+" - "+info.loser_score)} · Gol in trasferta</div>`;
    }

    if(info.tied){
      return `<div class="nx-knockout-aggregate"><strong>Aggregato ${esc(info.winner_score+" - "+info.loser_score)}</strong>${info.winner?` · ${esc(info.winner)} vince ai rigori`:""}</div>`;
    }

    return `<div class="nx-knockout-aggregate"><strong>${esc(info.winner)} vince</strong> · Aggregato ${esc(info.winner_score+" - "+info.loser_score)} contro ${esc(info.loser)}</div>`;
  }

  function renderCompetitionMatches(matches,status){
    const cleanMatches = removeResultsScheduleDuplicates(matches);
    const selectedCompetition=String(state.selectedCompetition||"").trim();
    const gw008ShieldKnockoutOnly=isGw008ShieldKnockoutOnly(state.selectedWorld,selectedCompetition);
    const configuredSmfaGroupMatchdays=(selectedCompetition==="IMC Champions"||selectedCompetition==="IMC Shield") && !gw008ShieldKnockoutOnly
      ? smfaGroupMatchdaysForWorld(state.selectedWorld)
      : null;
    const isSingleLegKnockout=singleLegKnockoutCompetitionName(selectedCompetition, state.selectedCompetitionMeta&&state.selectedCompetitionMeta.competition_type);

    const allCompetitionDates=Array.from(new Set(
      cleanMatches.map(function(match){return match.match_date||"";}).filter(Boolean)
    )).sort();
    const positionByDate=new Map();
    allCompetitionDates.forEach(function(date,index){positionByDate.set(date,index+1);});

    const explicitFinalDates=new Set(
      cleanMatches.filter(function(match){
        return isFinalRoundLabel(match.round_name)||isFinalRoundLabel(match.stage_name);
      }).map(function(match){return String(match.match_date||"");})
    );
    const shieldKnockoutDates=gw008ShieldKnockoutOnly
      ? allCompetitionDates.filter(function(date){return !explicitFinalDates.has(String(date));})
      : [];
    const shieldKnockoutPosition=new Map();
    shieldKnockoutDates.forEach(function(date,index){shieldKnockoutPosition.set(String(date),index+1);});

    const displayMatches=cleanMatches.map(function(match){
      const date=String(match.match_date||"");
      let displayRound=String(match.round_name||"").trim();
      let displayGroup=match.group_name||null;
      let displayIsGroup=Boolean(match.group_name)||String(match.stage_name||"").toLowerCase()==="group stage";

      if(gw008ShieldKnockoutOnly){
        if(explicitFinalDates.has(date)){
          displayRound="Final";
          displayGroup=null;
          displayIsGroup=false;
        }else{
          const position=shieldKnockoutPosition.get(date)||1;
          const round=Math.floor((position-1)/2)+1;
          const leg=((position-1)%2)+1;
          displayRound="Knockout Stage · Round "+round+" · Leg "+leg;
          displayGroup=null;
          displayIsGroup=false;
        }
      }else if(configuredSmfaGroupMatchdays){
        const position=positionByDate.get(date)||1;
        if(position<=configuredSmfaGroupMatchdays){
          displayRound="Group Stage · Match "+position;
          displayIsGroup=true;
        }else if(explicitFinalDates.has(date)){
          displayRound="Final";
          displayGroup=null;
          displayIsGroup=false;
        }else{
          const knockoutIndex=position-configuredSmfaGroupMatchdays;
          const round=Math.floor((knockoutIndex-1)/2)+1;
          const leg=((knockoutIndex-1)%2)+1;
          displayRound="Knockout Stage · Round "+round+" · Leg "+leg;
          displayGroup=null;
          displayIsGroup=false;
        }
      }

      return Object.assign({},match,{
        _display_round_name:displayRound,
        _display_group_name:displayGroup,
        _display_is_group_stage:displayIsGroup
      });
    });

    const filtered = displayMatches.filter(function(match){
      return status === "played"
        ? isCompetitionPlayed(match)
        : !isCompetitionPlayed(match);
    });

    if(!filtered.length){
      return `<div class="card"><div class="row-sub">Nessuna partita disponibile.</div></div>`;
    }

    const groupStageDates = Array.from(new Set(
      displayMatches
        .filter(function(match){return match._display_is_group_stage;})
        .map(function(match){return match.match_date || "";})
        .filter(Boolean)
    )).sort();

    const groupStageMatchday = new Map();
    groupStageDates.forEach(function(date,index){groupStageMatchday.set(date,index+1);});

    const matchdays = {};

    filtered.forEach(function(match){
      const isGroupStage=Boolean(match._display_is_group_stage);
      const date=match.match_date||"";
      let matchday=String(match._display_round_name||match.round_name||"").trim();
      if(!matchday){
        matchday=isGroupStage
          ? "Group Stage · Match "+(groupStageMatchday.get(date)||1)
          : "Round";
      }

      const key=matchday+"|"+date;
      if(!matchdays[key]){
        matchdays[key]={
          round_name:matchday,
          match_date:date,
          is_group_stage:isGroupStage,
          groups:{}
        };
      }

      const group=isGroupStage?(match._display_group_name||"Partite"):"Partite";
      if(!matchdays[key].groups[group])matchdays[key].groups[group]=[];
      matchdays[key].groups[group].push(match);
    });

    if(isSingleLegKnockout){
      return renderSingleLegKnockoutCompetition(matchdays,status);
    }

    return Object.values(matchdays)
      .sort(function(a,b){
        const dateA=String(a.match_date||"");
        const dateB=String(b.match_date||"");
        const dateDiff=status==="played"?dateB.localeCompare(dateA):dateA.localeCompare(dateB);
        if(dateDiff!==0)return dateDiff;
        const dayA=matchdayNumber(a.round_name);
        const dayB=matchdayNumber(b.round_name);
        const dayDiff=status==="played"?dayB-dayA:dayA-dayB;
        if(dayDiff!==0)return dayDiff;
        return String(a.round_name).localeCompare(String(b.round_name));
      })
      .map(function(day){
        const groups=Object.keys(day.groups).sort(function(a,b){
          const groupA=String(a||"").replace(/^GIRONE\s+/i,"").trim();
          const groupB=String(b||"").replace(/^GIRONE\s+/i,"").trim();
          const numericA=/^\d+$/.test(groupA)?Number(groupA):null;
          const numericB=/^\d+$/.test(groupB)?Number(groupB):null;
          if(numericA!==null&&numericB!==null)return numericA-numericB;
          if(numericA!==null)return -1;
          if(numericB!==null)return 1;
          return groupA.localeCompare(groupB,"it",{numeric:true,sensitivity:"base"});
        });

        if(isFinalRoundLabel(day.round_name)){
          return renderDedicatedFinal(day,status,displayMatches);
        }

        if(day.is_group_stage){
          return `
            <section class="nx-matchday-block nx-compact-group-stage">
              ${competitionMatchHeaderMarkup(day.round_name||"Group Stage",day.match_date,state.selectedCompetition||"Competition")}
              <div class="nx-compact-groups-card nx-balanced-groups-card">
                ${groups.map(function(groupName){
                  return `
                    <div class="nx-compact-group">
                      <h3>${esc(compactGroupLabel(groupName))}</h3>
                      <div class="nx-compact-group-matches nx-balanced-match-list">
                        ${day.groups[groupName].map(function(match){
                          return `
                            <div class="nx-cup-result-row nx-balanced-match-row">
                              ${cupResultParticipant(match,"home")}
                              ${balancedScoreMarkup(match,status,"nx-cup-score-pill")}
                              ${cupResultParticipant(match,"away")}
                            </div>`;
                        }).join("")}
                      </div>
                    </div>`;
                }).join("")}
              </div>
            </section>`;
        }

        const knockoutMatches=groups.reduce(function(list,groupName){
          return list.concat(day.groups[groupName]);
        },[]);

        return `
          <section class="nx-matchday-block nx-knockout-stage-block">
            ${competitionMatchHeaderMarkup(day.round_name||"Knockout Stage",day.match_date,state.selectedCompetition||"Competition")}
            <div class="nx-matchday-groups nx-knockout-stage-body">
              <div class="nx-knockout-match-list">
                ${knockoutMatches.map(function(match){
                  return `<div class="nx-knockout-match-card nx-balanced-knockout-card">
                    <div class="nx-cup-result-row nx-balanced-match-row">
                      ${cupResultParticipant(match,"home")}
                      ${balancedScoreMarkup(match,status,"nx-cup-score-pill")}
                      ${cupResultParticipant(match,"away")}
                    </div>
                    ${status==="played"?renderKnockoutAggregate(match,displayMatches):""}
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
          Naming automatico Nexus: League = Match X; coppe domestiche = Round X / Final;
          SMFA = Group Stage · Match X oppure Knockout Stage · Round X · Leg 1/2; Super Cup e Charity Shield = Final.
        </div>

        ${isGlobalAdmin ? matchdayControlShell() : ""}

        <div class="card" id="importFormCard">
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
            <select id="importMode" disabled>
              <option value="">Caricamento competizioni…</option>
            </select>
            <div class="field-help" id="competitionHelp">Caricamento competizioni…</div>
          </div>

          <div class="nx-import-target-hint" id="importTargetHint" hidden></div>

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

          <div class="nx-import-rejected-panel" id="importRejectedPanel" hidden>
            <div class="nx-import-rejected-head">
              <div>
                <small>CONTROLLO PARSER</small>
                <strong id="importRejectedTitle">Righe non riconosciute</strong>
              </div>
              <button class="nx-import-rejected-clear" id="clearRejectedLinesButton" type="button">ELIMINA TUTTE</button>
            </div>
            <div class="nx-import-rejected-list" id="importRejectedList"></div>
          </div>
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

    // BUILD 8 · one global club name across every Game World.
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


  // BUILD 25 · Global Soccer Manager participant matching rule.
  // Soccer Manager can prefix club names with "number + dot", e.g. "1. FC Köln".
  // The prefix is ignored ONLY for identity matching; display names remain untouched.
  function participantMatchingKeys(value){
    const raw=String(value||"").normalize("NFC").trim();
    if(!raw)return [];

    const keys=[];
    function push(candidate){
      const key=normalizeParticipantKey(candidate);
      if(key&&!keys.includes(key))keys.push(key);
    }

    push(raw);

    const withoutNumericDotPrefix=raw.replace(/^\s*\d+\.\s*/,"").trim();
    if(withoutNumericDotPrefix&&withoutNumericDotPrefix!==raw){
      push(withoutNumericDotPrefix);
    }

    return keys;
  }

  function addParticipantMapEntry(map,value,data){
    participantMatchingKeys(value).forEach(function(key){
      if(!map.has(key))map.set(key,data);
    });
  }

  function resolveImportedParticipant(map,formattedValue,rawValue){
    const candidates=[];
    [rawValue,formattedValue].forEach(function(value){
      participantMatchingKeys(value).forEach(function(key){
        if(!candidates.includes(key))candidates.push(key);
      });
    });

    for(const key of candidates){
      if(map.has(key))return map.get(key);
    }
    return null;
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
    return ["IMC Champions","IMC Shield","IMC Super Cup"]
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
    const match = normalizeText(line).match(/^(?:GIRONE|GROUP)\s+([A-Z]|\d+)$/i);
    return match ? "Group " + match[1].toUpperCase() : null;
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

  function parseAggregateLine(line){
    const clean = normalizeText(line);
    const match = clean.match(/^La squadra (.+?) vince con il punteggio aggregato di (\d+)\s*[-–]\s*(\d+)\.?$/i);
    if(!match) return null;
    return {
      winner_name: formatTeamDisplayName(match[1].trim()),
      winner_score: Number(match[2]),
      loser_score: Number(match[3]),
      decision: "aggregate"
    };
  }

  // Soccer Manager legacy rule used by GW008 IMC Shield. The line belongs to
  // the immediately preceding Leg 2 match and is metadata, not a new fixture.
  function parseGw008ShieldAwayGoalsLine(line){
    const clean=normalizeText(line);
    let match=clean.match(/^Partita terminata con il punteggio aggregato di (\d+)\s*[-–]\s*(\d+)\.\s*La squadra (.+?) avanza in virtù dei gol segnati in trasferta\.?$/i);
    if(match){
      return {
        winner_name: formatTeamDisplayName(match[3].trim()),
        winner_score: Number(match[1]),
        loser_score: Number(match[2]),
        decision: "away_goals"
      };
    }

    match=clean.match(/^La squadra (.+?) avanza in virtù dei gol segnati in trasferta\.?$/i);
    if(!match)return null;
    return {
      winner_name: formatTeamDisplayName(match[1].trim()),
      winner_score: null,
      loser_score: null,
      decision: "away_goals"
    };
  }

  function isIgnoredInformationalLine(line){
    const clean = normalizeText(line).toLowerCase();
    return clean.startsWith("le seguenti squadre sono uscite dal prossimo turno del torneo");
  }

  function isCompetitionSourceHeader(line,competition){
    const clean=normalizeText(line).toUpperCase();
    if(competition==="IMC Champions")return clean==="SMFA CHAMPIONS CUP"||clean==="SMFA CHAMPIONS";
    if(competition==="IMC Shield")return clean==="SMFA SHIELD CUP"||clean==="SMFA SHIELD";
    return false;
  }

  function competitionParserMode(competition){
    if(competition === "league") return "league";
    if(["National Cup","League Cup"].includes(competition) || /^Division [2-5] Playoff$/i.test(competition)) return "knockout";
    if(["Charity Shield","IMC Super Cup"].includes(competition)) return "single";
    if(["World Cup Qualifying"].includes(competition)) return "groups";
    if(["IMC Champions","IMC Shield","World Cup"].includes(competition)) return "auto";
    return "auto";
  }

  function isNationalCompetition(competition){
    return competition === "World Cup Qualifying" || competition === "World Cup";
  }

  function rejectedLineReason(line,middle,away,currentDate){
    if(!currentDate)return "Manca una data valida prima di questa riga.";
    if(parseScore(line))return "Risultato isolato: Nexus non ha trovato una partita completa attorno a questa riga.";
    if(parseTime(line))return "Orario isolato: Nexus non ha trovato una partita completa attorno a questa riga.";
    if(parseAggregateLine(line))return "Aggregato isolato: Nexus non ha trovato la partita di ritorno a cui collegarlo.";
    if(!middle||!away)return "Riga incompleta: mancano risultato/orario e/o avversario.";
    if(!parseScore(middle)&&!parseTime(middle))return "Dopo questa riga Nexus si aspettava un risultato oppure un orario.";
    return "Formato non riconosciuto dal parser per la competizione selezionata.";
  }

  function rejectedEntryText(entry){
    return typeof entry === "string" ? entry : String((entry&&entry.line)||"");
  }

  function rejectedEntryReason(entry){
    return typeof entry === "string" ? "Formato non riconosciuto dal parser." : String((entry&&entry.reason)||"Formato non riconosciuto dal parser.");
  }

  function parseCompetitionImport(text, competition, worldId){
    const sourceLines = String(text || "").split(/\r?\n/);
    const lineItems = sourceLines.map(function(rawLine,sourceIndex){
      return {
        line:normalizeText(rawLine),
        source_index:sourceIndex,
        line_number:sourceIndex+1
      };
    }).filter(function(item){return !!item.line;});
    const lines = lineItems.map(function(item){return item.line;});
    const matches = [];
    const rejected = [];
    const dates = [];
    const gw008ShieldKnockoutOnly=isGw008ShieldKnockoutOnly(worldId,competition);

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

      if(isCompetitionSourceHeader(line,competition)){
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
        if(round){
          currentRound = round;
          currentGroup = null;
        }
        index += 1;
        continue;
      }

      const group = parseGroup(line);
      if(group){
        if(gw008ShieldKnockoutOnly){
          // Lo Shield GW008 non ha gironi: eventuali header GROUP/GIRONE legacy
          // vengono ignorati e non cambiano lo stage della competizione.
          currentGroup=null;
        }else{
          currentGroup = group;
          currentRound = "Group Stage";
        }
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
            raw_home: line,
            raw_away: lines[index + 2],
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
            penalty_winner_name: null,
            aggregate_winner_name: null,
            aggregate_winner_score: null,
            aggregate_loser_score: null,
            aggregate_decision: null
          };

          let consumed = 3;
          while(index + consumed < lines.length){
            const extraLine = lines[index + consumed];
            const possiblePenalty = parsePenaltyLine(extraLine);
            const possibleAwayGoals = gw008ShieldKnockoutOnly ? parseGw008ShieldAwayGoalsLine(extraLine) : null;
            const possibleAggregate = possibleAwayGoals || parseAggregateLine(extraLine);

            if(possiblePenalty && !match.decided_on_penalties){
              match.decided_on_penalties = true;
              match.penalty_winner_name = possiblePenalty.winner_name;

              if(possiblePenalty.winner_name.toLowerCase() === home.toLowerCase()){
                match.home_penalties = possiblePenalty.first_penalties;
                match.away_penalties = possiblePenalty.second_penalties;
              }else{
                match.home_penalties = possiblePenalty.second_penalties;
                match.away_penalties = possiblePenalty.first_penalties;
              }
              consumed += 1;
              continue;
            }

            if(possibleAggregate && !match.aggregate_winner_name){
              match.aggregate_winner_name = possibleAggregate.winner_name;
              match.aggregate_winner_score = possibleAggregate.winner_score;
              match.aggregate_loser_score = possibleAggregate.loser_score;
              match.aggregate_decision = possibleAggregate.decision || "aggregate";
              consumed += 1;
              continue;
            }

            break;
          }

          index += consumed;
          matches.push(match);
          continue;
        }
      }

      const rejectedItem=lineItems[index]||{source_index:index,line_number:index+1,line:line};
      rejected.push({
        line:line,
        line_number:rejectedItem.line_number,
        source_index:rejectedItem.source_index,
        reason:rejectedLineReason(line,middle,away,currentDate)
      });
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

    // BUILD 37 · GW008 Area pilot: la stagione marcata current è la fonte
    // autoritativa per l'Import Center. Evita che cache/config legacy mostrino
    // una stagione storica mentre il DB ha già la stagione corrente corretta.
    if(resolvedWorldId==="GW008"){
      const currentResult = await state.client
        .from("gw_seasons")
        .select("season_id,season_number,season_status")
        .eq("game_world_id",resolvedWorldId)
        .eq("season_status","current")
        .order("season_number",{ascending:false})
        .limit(1);

      if(currentResult.error) throw currentResult.error;
      if(currentResult.data && currentResult.data.length){
        return currentResult.data[0];
      }
    }

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
    const canonicalStructure=usesCanonicalGwStructure(resolvedWorldId);

    const setupResults = await Promise.all([
      state.client
        .from("gw_setup_team_divisions")
        .select(`
          team_id,
          division_number,
          division_id,
          nation_setup_id,
          gw_teams!inner(team_id,team_name,display_name,area_id)
        `)
        .eq("game_world_id",resolvedWorldId)
        .eq("season_id",seasonId),

      canonicalStructure
        ? Promise.resolve({data:[],error:null})
        : state.client
          .from("gw_division_setups")
          .select("division_setup_id,nation_setup_id,division_number,team_count")
          .eq("game_world_id",resolvedWorldId)
          .order("division_number",{ascending:true}),

      state.client
        .from("gw_divisions")
        .select("division_id,division_code,division_name,division_level,teams_count,meetings_per_pair,country_id,area_id")
        .eq("game_world_id",resolvedWorldId),

      state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,division_id,competition_type,canonical_competition_id,country_id,area_id")
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
        .select("country_id,game_world_id,country_name,area_id,area_sm,area_alias")
        .eq("game_world_id",resolvedWorldId)
    ]);

    setupResults.forEach(function(result){
      if(result.error) throw result.error;
    });

    const teams = setupResults[0].data || [];
    let setupDivisions = setupResults[1].data || [];
    let realDivisions = setupResults[2].data || [];
    let competitions = setupResults[3].data || [];
    const areaPilot=usesAreaPilot(resolvedWorldId);

    // Nel pilota GW008 la fonte stagionale è gw_setup_team_divisions,
    // mentre area_id è stabile su Team/Division/Competition.
    if(areaPilot){
      const byKey=new Map();
      teams.forEach(function(row){
        const key=String(row.nation_setup_id||"")+"|"+String(Number(row.division_number));
        if(!byKey.has(key)){
          byKey.set(key,{
            division_setup_id:null,
            nation_setup_id:row.nation_setup_id,
            division_number:Number(row.division_number),
            division_id:row.division_id==null?null:Number(row.division_id),
            team_count:0,
            canonical:true
          });
        }
        byKey.get(key).team_count+=1;
      });
      setupDivisions=Array.from(byKey.values()).sort(function(a,b){
        return String(a.nation_setup_id).localeCompare(String(b.nation_setup_id))||a.division_number-b.division_number;
      });
      competitions=competitions.filter(function(row){
        return row.canonical_competition_id==="COMP_DOM_001" && row.area_id!=null;
      });
      const canonicalLeagueKeys=new Set();
      competitions.forEach(function(row){
        const key=String(row.area_id)+"|"+String(row.division_id);
        if(canonicalLeagueKeys.has(key)){
          throw new Error("GW008: League canonica duplicata per area_id "+row.area_id+" / division_id "+row.division_id+". Import bloccato.");
        }
        canonicalLeagueKeys.add(key);
      });
    }

    if(canonicalStructure&&!setupDivisions.length){
      setupDivisions=realDivisions.map(function(row){
        return {
          division_setup_id:null,
          nation_setup_id:null,
          division_number:Number(row.division_level),
          team_count:Number(row.teams_count),
          division_id:Number(row.division_id),
          canonical:true
        };
      }).sort(function(a,b){return a.division_number-b.division_number;});
    }
    const existingMatches = setupResults[4].data || [];
    const teamAliases = setupResults[5].data || [];
    const setupNations = setupResults[6].data || [];
    const leagueCountries = setupResults[7].data || [];
    const nationNameById = new Map();
    const countryIdByNationSetupId = new Map();
    const areaIdByNationSetupId = new Map();
    const areaAliasByNationSetupId = new Map();
    const countryByName = new Map();
    const leagueAreaMaps=areaRegistryMaps(leagueCountries);

    leagueCountries.forEach(function(country){
      countryByName.set(normalizeParticipantKey(country.country_name),country);
    });

    setupNations.forEach(function(nation){
      const setupId=String(nation.nation_setup_id);
      nationNameById.set(setupId,String(nation.nation_name||"").trim());
      if(areaPilot){
        const area=leagueAreaMaps.by_sm.get(normalizeParticipantKey(nation.nation_name));
        if(!area){
          throw new Error("GW008: area_sm non configurata per "+nation.nation_name+".");
        }
        areaIdByNationSetupId.set(setupId,Number(area.area_id));
        areaAliasByNationSetupId.set(setupId,area.area_alias||nation.nation_name);
        countryIdByNationSetupId.set(setupId,Number(area.country_id||area.area_id));
        return;
      }
      const country=countryByName.get(normalizeParticipantKey(nation.nation_name));
      if(country){
        countryIdByNationSetupId.set(setupId,Number(country.country_id));
      }
    });

    function uniqueLeagueName(nationId,divisionNumber){
      if(nationId){
        const nationName = areaPilot
          ? (areaAliasByNationSetupId.get(String(nationId)) || nationNameById.get(String(nationId)))
          : nationNameById.get(String(nationId));
        return (nationName || ("Nazione " + nationId)) + " · Division " + divisionNumber;
      }
      return "Division " + divisionNumber;
    }

    const missingRealDivisions = setupDivisions.filter(function(setupDivision){
      if(areaPilot&&setupDivision.division_id!=null){
        return !realDivisions.some(function(realDivision){
          return String(realDivision.division_id)===String(setupDivision.division_id) &&
            String(realDivision.area_id||"")===String(areaIdByNationSetupId.get(String(setupDivision.nation_setup_id))||"");
        });
      }
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
        area_id:nationId
          ? (areaIdByNationSetupId.get(String(nationId))||null)
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

    if(areaPilot&&missingRealDivisions.length){
      throw new Error("GW008: struttura Division/Area incompleta. Import bloccato per evitare ricostruzioni legacy.");
    }

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

    // Build 83:
    // usa lo stesso vincolo univoco del database
    // (game_world_id, competition_name).
    // Se una League esiste già, aggiorna division_id e country_id
    // invece di tentare un nuovo INSERT.
    const leagueCompetitionPayload = setupDivisions.map(function(setupDivision){
      const setupKey =
        String(setupDivision.nation_setup_id || "") +
        "|" +
        String(Number(setupDivision.division_number));

      const realDivision = setupDivision.division_id!=null
        ? realDivisions.find(function(row){return String(row.division_id)===String(setupDivision.division_id);})
        : realDivisionBySetupKey.get(setupKey);
      if(!realDivision) return null;

      return {
        game_world_id: resolvedWorldId,
        country_id: setupDivision.nation_setup_id
          ? (countryIdByNationSetupId.get(String(setupDivision.nation_setup_id)) || null)
          : null,
        area_id: setupDivision.nation_setup_id
          ? (areaIdByNationSetupId.get(String(setupDivision.nation_setup_id)) || null)
          : null,
        competition_name: uniqueLeagueName(
          setupDivision.nation_setup_id,
          Number(setupDivision.division_number)
        ),
        competition_type: "league",
        division_id: realDivision.division_id,
        canonical_competition_id: "COMP_DOM_001",
        competition_category: "domestic"
      };
    }).filter(Boolean);

    if(areaPilot){
      const missingCanonicalLeague=leagueCompetitionPayload.filter(function(payload){
        return !competitions.some(function(row){
          return String(row.division_id)===String(payload.division_id) &&
            String(row.area_id||"")===String(payload.area_id||"") &&
            row.canonical_competition_id==="COMP_DOM_001";
        });
      });
      if(missingCanonicalLeague.length){
        throw new Error("GW008: League/Area canonica incompleta. Import bloccato: nessuna competizione verrà creata automaticamente.");
      }
    }else if(canonicalStructure){
      const missingCanonicalLeague=leagueCompetitionPayload.filter(function(payload){
        return !competitions.some(function(row){
          return String(row.division_id)===String(payload.division_id) && row.canonical_competition_id==="COMP_DOM_001";
        });
      });
      if(missingCanonicalLeague.length){
        throw new Error("GW004: struttura League canonica incompleta. Import bloccato per evitare ricostruzioni legacy.");
      }
    }else if(leagueCompetitionPayload.length){
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

      // Build 31 · GW008 import fix.
      // gw_setup_team_divisions can already contain the canonical division_id even though
      // the legacy gw_division_setups query above does not expose that column. In that case
      // the old lookup discarded the club from team_map (River Plate / Feyenoord case).
      // For GW008 the canonical division_id is authoritative; the legacy setup row is only
      // required as fallback when division_id is still null.
      const setupDivision = setupDivisionByKey.get(setupKey) || (
        row.division_id && resolvedWorldId !== "GW008"
          ? setupDivisions.find(function(item){return String(item.division_id)===String(row.division_id);})
          : null
      );
      const realDivision = row.division_id
        ? realDivisions.find(function(item){return String(item.division_id)===String(row.division_id);})
        : realDivisionBySetupKey.get(String(row.nation_setup_id||"")+"|"+String(Number(row.division_number)));

      if(!realDivision) return;
      if(!setupDivision && !(resolvedWorldId === "GW008" && row.division_id)) return;

      const teamData={
        team_id:row.team_id,
        team_name:teamDisplayName(row.gw_teams,resolvedWorldId),
        official_team_name:row.gw_teams.team_name,
        division_id:realDivision.division_id,
        division_name:realDivision.division_name,
        area_id:row.gw_teams&&row.gw_teams.area_id!=null?Number(row.gw_teams.area_id):(realDivision.area_id==null?null:Number(realDivision.area_id))
      };
      addParticipantMapEntry(teamMap,row.gw_teams.team_name,teamData);
      if(row.gw_teams.display_name){
        addParticipantMapEntry(teamMap,row.gw_teams.display_name,teamData);
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
        addParticipantMapEntry(teamMap,alias.alias_name,teamData);
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
      "national cup":"domestic_cup",
      "league cup":"domestic_cup",
      "league shield":"domestic_cup",
      "charity shield":"domestic_super_cup",
      "imc champions":"smfa_champions",
      "imc shield":"smfa_shield",
      "imc super cup":"smfa_super_cup",
      "smfa champions":"smfa_champions",
      "smfa shield":"smfa_shield",
      "smfa super cup":"smfa_super_cup",
      "world cup qualifying":"world_cup_qualifying",
      "world cup":"world_cup"
    };

    if(/^division\s+[2-5]\s+playoff$/i.test(name))return "promotion_playoff";
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
    const areaPilot=usesAreaPilot(resolvedWorldId);

    let competitionResult=null;
    const competitionByCountry = new Map();
    const canonicalSingle=usesCanonicalGwStructure(resolvedWorldId)&&!isMultiLeague;

    if(canonicalSingle){
      const canonicalResult=await resolveWorldCompetitionRows(resolvedWorldId,competitionName);
      if(canonicalResult.error)throw canonicalResult.error;
      const rows=canonicalResult.data||[];
      if(!rows.length)throw new Error(competitionName+" non è configurata per "+resolvedWorldId+". Import bloccato.");
      if(rows.length>1)throw new Error("Competizione canonica ambigua per "+competitionName+" in "+resolvedWorldId+".");
      competitionResult={data:rows[0],error:null};
    }else if(domesticClubCompetition){
      if(isMultiLeague){
        let domesticQuery=state.client
          .from("gw_competitions")
          .select("competition_id,competition_name,competition_type,country_id,area_id,canonical_competition_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("competition_type",competitionType);

        if(areaPilot){
          const canonicalId=canonicalCompetitionIdForLabel(competitionName);
          if(!canonicalId)throw new Error("GW008: mapping canonico mancante per "+competitionName+".");
          domesticQuery=domesticQuery.eq("canonical_competition_id",canonicalId).not("area_id","is",null);
        }else{
          domesticQuery=domesticQuery.not("country_id","is",null);
        }

        const domesticResult=await domesticQuery.order("competition_id",{ascending:true});
        if(domesticResult.error)throw domesticResult.error;

        const requestedDbName=String(competitionName||"").trim();
        (domesticResult.data||[]).forEach(function(row){
          if(areaPilot){
            const areaKey=String(row.area_id);
            if(competitionByCountry.has(areaKey)){
              throw new Error("GW008: competizione canonica duplicata per area_id "+areaKey+" · "+competitionName+". Import bloccato.");
            }
            competitionByCountry.set(areaKey,row);
            return;
          }
          const rowName=String(row.competition_name||"").trim();
          const exactName=rowName===requestedDbName || rowName.endsWith(" · "+requestedDbName);
          if(exactName){
            competitionByCountry.set(String(row.country_id),row);
          }
        });

        if(!competitionByCountry.size){
          throw new Error("Nessuna competizione domestica configurata per "+competitionName+".");
        }
      }else{
        competitionResult=await state.client
          .from("gw_competitions")
          .select("competition_id,competition_name,competition_type,country_id,canonical_competition_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("competition_name",competitionName)
          .is("country_id",null)
          .maybeSingle();

        if(competitionResult.error)throw competitionResult.error;

        if(!competitionResult.data){
          throw new Error(competitionName+" non è configurata per "+resolvedWorldId+". Import bloccato.");
        }
      }
    }else{
      competitionResult = await state.client
        .from("gw_competitions")
        .select("competition_id,competition_name,competition_type,country_id,canonical_competition_id")
        .eq("game_world_id",resolvedWorldId)
        .eq("competition_name",competitionName)
        .maybeSingle();

      if(competitionResult.error) throw competitionResult.error;

      if(!competitionResult.data){
        throw new Error(competitionName+" non è configurata per "+resolvedWorldId+". Import bloccato.");
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
          .select("team_id,game_world_id,sm_club_id,team_name,display_name,country_id,area_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("team_type","club"),

        state.client
          .from("gw_team_aliases")
          .select("team_id,alias_name")
          .eq("game_world_id",resolvedWorldId),

        state.client
          .from("gw_setup_team_divisions")
          .select("team_id,nation_setup_id,division_id")
          .eq("game_world_id",resolvedWorldId)
          .eq("season_id",seasonId),

        state.client
          .from("gw_setup_nations")
          .select("nation_setup_id,nation_name")
          .eq("game_world_id",resolvedWorldId),

        state.client
          .from("gw_league_countries")
          .select("country_id,country_name,area_id,area_sm,area_alias")
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
      const competitionAreaMaps=areaRegistryMaps(leagueCountries);

      setupNations.forEach(function(nation){
        nationNameBySetupId.set(String(nation.nation_setup_id),nation.nation_name);
      });

      leagueCountries.forEach(function(country){
        countryIdByName.set(normalizeParticipantKey(country.country_name),country.country_id);
      });

      if(!areaPilot){
        teamDivisions.forEach(function(row){
          const nationName=nationNameBySetupId.get(String(row.nation_setup_id));
          const countryId=nationName
            ? countryIdByName.get(normalizeParticipantKey(nationName))
            : null;
          if(countryId){
            countryIdByTeamId.set(String(row.team_id),countryId);
          }
        });
      }

      teams.forEach(function(team){
        const teamData={
          team_id:team.team_id,
          name:teamDisplayName(team,resolvedWorldId),
          official_name:team.team_name,
          country_id:team.country_id || countryIdByTeamId.get(String(team.team_id)) || null,
          area_id:areaPilot?(team.area_id==null?null:Number(team.area_id)):null
        };

        teamById.set(String(team.team_id),teamData);
        addParticipantMapEntry(map,team.team_name,teamData);

        if(team.display_name){
          addParticipantMapEntry(map,team.display_name,teamData);
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
          addParticipantMapEntry(map,alias.alias_name,teamData);
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
      area_pilot:areaPilot,
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
          match.round_name="Match "+matchday;
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
      const home=resolveImportedParticipant(context.team_map,match.home,match.raw_home);
      const away=resolveImportedParticipant(context.team_map,match.away,match.raw_away);

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

    const importedParticipants=[];
    (parsed.matches||[]).forEach(function(match){
      importedParticipants.push({name:match.home,raw:match.raw_home});
      importedParticipants.push({name:match.away,raw:match.raw_away});
    });

    const missingMap=new Map();
    importedParticipants.forEach(function(item){
      if(resolveImportedParticipant(context.participant_map,item.name,item.raw))return;
      const name=formatTeamDisplayName(item.name);
      const key=normalizeParticipantKey(name);
      if(name&&key&&!missingMap.has(key))missingMap.set(key,name);
    });
    const missing=Array.from(missingMap.values());

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
      context.participant_addParticipantMapEntry(map,team.team_name,teamData);
      if(team.display_name){
        context.participant_addParticipantMapEntry(map,team.display_name,teamData);
      }
    });
  }

  async function ensureOpenSmfaParticipants(parsed,context,competitionName){
    if(!isOpenSmfaCompetition(competitionName) || context.national) return;

    const importedParticipants=[];
    (parsed.matches||[]).forEach(function(match){
      importedParticipants.push({name:match.home,raw:match.raw_home});
      importedParticipants.push({name:match.away,raw:match.raw_away});
    });

    const missingMap=new Map();
    importedParticipants.forEach(function(item){
      if(resolveImportedParticipant(context.participant_map,item.name,item.raw))return;
      const name=formatTeamDisplayName(item.name);
      const key=normalizeParticipantKey(name);
      if(name&&key&&!missingMap.has(key))missingMap.set(key,name);
    });
    const missing=Array.from(missingMap.values());

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
      context.participant_addParticipantMapEntry(map,team.team_name,teamData);
      if(team.display_name){
        context.participant_addParticipantMapEntry(map,team.display_name,teamData);
      }
    });
  }


  function canonicalImportedGroupName(value){
    const match=String(value||"").trim().match(/^(?:GIRONE|GROUP)\s+([A-Z]|\d+)$/i);
    return match ? "Group "+match[1].toUpperCase() : (value||null);
  }

  function isFinalRoundLabel(value){
    return /^(?:final|finale)$/i.test(String(value||"").trim());
  }

  function explicitRoundNumber(value){
    const text=String(value||"").trim();
    const match=text.match(/^(?:round|turno)\s+(\d+)$/i);
    return match ? Number(match[1]) : null;
  }

  function knockoutRoundState(rows){
    let maxRound=0;
    let lastLeg=0;

    (rows||[]).forEach(function(row){
      const text=String(row.round_name||"");
      const match=text.match(/Knockout Stage\s*·\s*Round\s+(\d+)\s*·\s*Leg\s+([12])/i);
      if(!match)return;
      const round=Number(match[1]);
      const leg=Number(match[2]);
      if(round>maxRound){
        maxRound=round;
        lastLeg=leg;
      }else if(round===maxRound){
        lastLeg=Math.max(lastLeg,leg);
      }
    });

    return {round:maxRound,leg:lastLeg};
  }

  async function normalizeCompetitionImportNaming(valid,context,competition){
    if(!valid||!valid.length)return;

    /* League naming is resolved earlier against the official calendar. */
    if(competition==="league"){
      valid.forEach(function(match){
        if(match.matchday)match.round_name="Match "+match.matchday;
      });
      return;
    }

    const ids=Array.from(new Set(valid.map(function(match){
      return match.competition_id;
    }).filter(Boolean)));

    let existing=[];
    if(ids.length){
      const existingResult=await state.client
        .from("gw_matches")
        .select("competition_id,match_date,stage_name,group_name,round_name")
        .eq("game_world_id",context.world_id)
        .eq("season_id",context.season_id)
        .in("competition_id",ids);

      if(existingResult.error)throw existingResult.error;
      existing=existingResult.data||[];
    }

    const byCompetition=new Map();
    valid.forEach(function(match){
      const key=String(match.competition_id);
      if(!byCompetition.has(key))byCompetition.set(key,[]);
      byCompetition.get(key).push(match);
    });

    byCompetition.forEach(function(imported,competitionId){
      const oldRows=existing.filter(function(row){
        return String(row.competition_id)===String(competitionId);
      });

      const type=String(context.competition_type||"");
      const isDomesticCup=type==="domestic_cup";
      const isSingleFinal=type==="domestic_super_cup" || type==="smfa_super_cup";
      const isGroupOnly=type==="world_cup_qualifying";
      const isSmfa=type==="smfa_champions" || type==="smfa_shield";

      if(isSingleFinal){
        imported.forEach(function(match){
          match.stage_name="Final";
          match.group_name=null;
          match.round_name="Final";
        });
        return;
      }

      if(isDomesticCup){
        const existingRoundNumbers=oldRows.map(function(row){
          const m=String(row.round_name||"").match(/^Round\s+(\d+)$/i);
          return m?Number(m[1]):0;
        });
        let nextRound=Math.max(0,...existingRoundNumbers)+1;

        const existingByDate=new Map();
        oldRows.forEach(function(row){
          const label=String(row.round_name||"").trim();
          if(/^Round\s+\d+$/i.test(label)||/^Final$/i.test(label)){
            existingByDate.set(String(row.match_date||""),label);
          }
        });

        const dates=Array.from(new Set(imported.map(function(m){return m.match_date;}))).sort();
        dates.forEach(function(date){
          const dateRows=imported.filter(function(m){return m.match_date===date;});
          const sample=dateRows[0]||{};
          const existingLabel=existingByDate.get(date);

          if(existingLabel){
            dateRows.forEach(function(match){
              match.stage_name=existingLabel;
              match.group_name=null;
              match.round_name=existingLabel;
            });
            return;
          }

          if(isFinalRoundLabel(sample.round_name)||isFinalRoundLabel(sample.stage_name)){
            dateRows.forEach(function(match){
              match.stage_name="Final";
              match.group_name=null;
              match.round_name="Final";
            });
            return;
          }

          const explicit=explicitRoundNumber(sample.round_name)||explicitRoundNumber(sample.stage_name);
          const round=explicit||nextRound;
          dateRows.forEach(function(match){
            match.stage_name="Round "+round;
            match.group_name=null;
            match.round_name="Round "+round;
          });
          nextRound=Math.max(nextRound,round+1);
        });
        return;
      }

      if(isGroupOnly){
        const allDates=Array.from(new Set(
          oldRows.map(function(row){return row.match_date;})
            .concat(imported.map(function(match){return match.match_date;}))
            .filter(Boolean)
        )).sort();
        const numberByDate=new Map();
        allDates.forEach(function(date,index){numberByDate.set(date,index+1);});

        imported.forEach(function(match){
          const number=numberByDate.get(match.match_date)||1;
          match.stage_name="Group Stage";
          match.group_name=canonicalImportedGroupName(match.group_name);
          match.round_name="Group Stage · Match "+number;
        });
        return;
      }

      if(isSmfa){
        // BUILD 39 · GW008 IMC Shield: tutta la competizione è Knockout Stage.
        // Le date sono accoppiate Leg 1 / Leg 2; la Final resta a partita unica.
        if(isGw008ShieldKnockoutOnly(context.world_id,competition)){
          const oldFinalDates=new Set(oldRows.filter(function(row){
            return isFinalRoundLabel(row.round_name)||isFinalRoundLabel(row.stage_name);
          }).map(function(row){return String(row.match_date||"");}));
          const importedFinalDates=new Set(imported.filter(function(match){
            return isFinalRoundLabel(match.round_name)||isFinalRoundLabel(match.stage_name);
          }).map(function(match){return String(match.match_date||"");}));

          const allDates=Array.from(new Set(
            oldRows.map(function(row){return row.match_date;})
              .concat(imported.map(function(match){return match.match_date;}))
              .filter(Boolean)
          )).sort();
          const finalDates=new Set(Array.from(oldFinalDates).concat(Array.from(importedFinalDates)));
          const knockoutDates=allDates.filter(function(date){return !finalDates.has(String(date));});
          const knockoutPosition=new Map();
          knockoutDates.forEach(function(date,index){knockoutPosition.set(String(date),index+1);});

          const importedDates=Array.from(new Set(imported.map(function(match){return match.match_date;}))).filter(Boolean).sort();
          importedDates.forEach(function(date){
            const dateRows=imported.filter(function(match){return match.match_date===date;});
            const sample=dateRows[0]||{};
            if(finalDates.has(String(date))||isFinalRoundLabel(sample.round_name)||isFinalRoundLabel(sample.stage_name)){
              dateRows.forEach(function(match){
                match.stage_name="Final";
                match.group_name=null;
                match.round_name="Final";
              });
              return;
            }

            const position=knockoutPosition.get(String(date))||1;
            const round=Math.floor((position-1)/2)+1;
            const leg=((position-1)%2)+1;
            dateRows.forEach(function(match){
              match.stage_name="Knockout Stage";
              match.group_name=null;
              match.round_name="Knockout Stage · Round "+round+" · Leg "+leg;
            });
          });
          return;
        }

        const configuredGroupMatchdays=smfaGroupMatchdaysForWorld(context.world_id);

        if(configuredGroupMatchdays){
          const allDates=Array.from(new Set(
            oldRows.map(function(row){return row.match_date;})
              .concat(imported.map(function(match){return match.match_date;}))
              .filter(Boolean)
          )).sort();
          const positionByDate=new Map();
          allDates.forEach(function(date,index){positionByDate.set(date,index+1);});

          const existingFinalDates=new Set(oldRows.filter(function(row){
            return isFinalRoundLabel(row.round_name)||isFinalRoundLabel(row.stage_name);
          }).map(function(row){return String(row.match_date||"");}));

          const importedDates=Array.from(new Set(imported.map(function(match){return match.match_date;}))).filter(Boolean).sort();
          importedDates.forEach(function(date){
            const dateRows=imported.filter(function(match){return match.match_date===date;});
            const sample=dateRows[0]||{};
            const position=positionByDate.get(date)||1;

            if(position<=configuredGroupMatchdays){
              dateRows.forEach(function(match){
                match.stage_name="Group Stage";
                match.group_name=canonicalImportedGroupName(match.group_name);
                match.round_name="Group Stage · Match "+position;
              });
              return;
            }

            if(existingFinalDates.has(String(date))||isFinalRoundLabel(sample.round_name)||isFinalRoundLabel(sample.stage_name)){
              dateRows.forEach(function(match){
                match.stage_name="Final";
                match.group_name=null;
                match.round_name="Final";
              });
              return;
            }

            const knockoutIndex=position-configuredGroupMatchdays;
            const round=Math.floor((knockoutIndex-1)/2)+1;
            const leg=((knockoutIndex-1)%2)+1;
            dateRows.forEach(function(match){
              match.stage_name="Knockout Stage";
              match.group_name=null;
              match.round_name="Knockout Stage · Round "+round+" · Leg "+leg;
            });
          });
          return;
        }

        // Compatibilità con Game World non ancora configurati nel formato canonico.
        const groupImported=imported.filter(function(match){return Boolean(match.group_name);});
        const existingGroupDates=oldRows.filter(function(row){
          return String(row.stage_name||"").toLowerCase()==="group stage";
        }).map(function(row){return row.match_date;});
        const groupDates=Array.from(new Set(existingGroupDates.concat(groupImported.map(function(match){return match.match_date;})))).filter(Boolean).sort();
        const numberByDate=new Map();
        groupDates.forEach(function(date,index){numberByDate.set(date,index+1);});
        groupImported.forEach(function(match){
          match.stage_name="Group Stage";
          match.group_name=canonicalImportedGroupName(match.group_name);
          match.round_name="Group Stage · Match "+(numberByDate.get(match.match_date)||1);
        });

        const knockoutImported=imported.filter(function(match){return !match.group_name;});
        if(knockoutImported.length){
          const stateInfo=knockoutRoundState(oldRows);
          let currentRound=stateInfo.round||1;
          let nextLeg=stateInfo.round?(stateInfo.leg>=2?1:stateInfo.leg+1):1;
          if(stateInfo.round&&stateInfo.leg>=2)currentRound=stateInfo.round+1;
          const dates=Array.from(new Set(knockoutImported.map(function(match){return match.match_date;}))).filter(Boolean).sort();
          dates.forEach(function(date){
            const dateRows=knockoutImported.filter(function(match){return match.match_date===date;});
            const sample=dateRows[0]||{};
            if(isFinalRoundLabel(sample.round_name)||isFinalRoundLabel(sample.stage_name)){
              dateRows.forEach(function(match){match.stage_name="Final";match.group_name=null;match.round_name="Final";});
              return;
            }
            dateRows.forEach(function(match){
              match.stage_name="Knockout Stage";
              match.group_name=null;
              match.round_name="Knockout Stage · Round "+currentRound+" · Leg "+nextLeg;
            });
            if(nextLeg===1)nextLeg=2;else{currentRound+=1;nextLeg=1;}
          });
        }
      }
    });
  }

  function validateCompetitionMatches(parsed,context){
    const valid=[],errors=[];

    parsed.matches.forEach(function(match,index){
      const home=resolveImportedParticipant(context.participant_map,match.home,match.raw_home);
      const away=resolveImportedParticipant(context.participant_map,match.away,match.raw_away);

      if(!home){errors.push("Partita "+(index+1)+": casa non trovata: "+match.home);return;}
      if(!away){errors.push("Partita "+(index+1)+": trasferta non trovata: "+match.away);return;}

      let selectedCompetition = null;

      if(context.domestic_club_competition&&context.is_multi_league){
        if(context.area_pilot){
          if(!home.area_id){errors.push("Partita "+(index+1)+": Area non associata alla squadra "+home.name+".");return;}
          if(!away.area_id){errors.push("Partita "+(index+1)+": Area non associata alla squadra "+away.name+".");return;}
          if(String(home.area_id)!==String(away.area_id)){
            errors.push("Partita "+(index+1)+": "+home.name+" e "+away.name+" appartengono ad Aree diverse.");
            return;
          }
          selectedCompetition=context.competition_by_country.get(String(home.area_id));
          if(!selectedCompetition){
            errors.push("Partita "+(index+1)+": competizione "+context.competition_name+" non configurata per area_id "+home.area_id+".");
            return;
          }
        }else{
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
            if(match.aggregate_winner_name){
              if(match.aggregate_decision==="away_goals"){
                const aggregate=(match.aggregate_winner_score===null||match.aggregate_winner_score===undefined)
                  ? ""
                  : " · aggregato "+match.aggregate_winner_score+"-"+match.aggregate_loser_score;
                line+=aggregate+" · "+match.aggregate_winner_name+" qualificata per gol in trasferta";
              }else{
                line+=" · aggregato: "+match.aggregate_winner_name+" "+match.aggregate_winner_score+"-"+match.aggregate_loser_score;
              }
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
      parsed.rejected.forEach(function(entry){
        const lineNumber=entry&&entry.line_number ? "Riga "+entry.line_number+": " : "";
        lines.push("- "+lineNumber+rejectedEntryText(entry)+" · "+rejectedEntryReason(entry));
      });
    }

    return lines.join("\n").trim();
  }

  function renderRejectedImportLines(parsed){
    const panel=document.getElementById("importRejectedPanel");
    const list=document.getElementById("importRejectedList");
    const title=document.getElementById("importRejectedTitle");
    if(!panel||!list)return;

    const rejected=(parsed&&parsed.rejected)||[];
    if(!rejected.length){
      panel.hidden=true;
      list.innerHTML="";
      if(title)title.textContent="Righe non riconosciute";
      return;
    }

    if(title)title.textContent=rejected.length+" righe non riconosciute";
    list.innerHTML=rejected.map(function(entry){
      const sourceIndex=entry&&Number.isInteger(entry.source_index)?entry.source_index:-1;
      const lineNumber=entry&&entry.line_number?entry.line_number:"?";
      return '<div class="nx-import-rejected-row">'+
        '<div class="nx-import-rejected-copy">'+
          '<small>RIGA '+esc(lineNumber)+'</small>'+
          '<strong>'+esc(rejectedEntryText(entry))+'</strong>'+
          '<span>'+esc(rejectedEntryReason(entry))+'</span>'+
        '</div>'+
        '<button class="nx-import-rejected-delete" type="button" data-rejected-source-index="'+esc(sourceIndex)+'">ELIMINA</button>'+
      '</div>';
    }).join("");
    panel.hidden=false;
  }

  function removeRejectedImportSourceLines(sourceIndexes){
    const textarea=document.getElementById("importText");
    if(!textarea)return;
    const indexes=new Set((sourceIndexes||[]).map(function(value){return Number(value);}).filter(function(value){return Number.isInteger(value)&&value>=0;}));
    if(!indexes.size)return;

    const rawLines=String(textarea.value||"").split(/\r?\n/);
    textarea.value=rawLines.filter(function(_,index){return !indexes.has(index);}).join("\n")
      .replace(/\n{3,}/g,"\n\n")
      .trim();
  }

  async function rebuildPreviewAfterRejectedRemoval(){
    const previewSection=document.getElementById("previewSection");
    if(previewSection)previewSection.hidden=true;
    await buildImportPreview();
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

    const parsed=parseCompetitionImport(text,competition,worldId);
    renderRejectedImportLines(parsed);

    if(!parsed.matches.length){
      status.className="status error";
      status.textContent=parsed.rejected.length
        ? "Nessuna partita riconosciuta · controlla le righe indicate qui sotto."
        : "Nessuna partita riconosciuta.";
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
        await normalizeCompetitionImportNaming(validation.valid,context,competition);
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
          const winner=resolveImportedParticipant(result.context.participant_map,match.penalty_winner_name,match.penalty_winner_name);
          row.penalty_winner_nation_id=winner ? winner.nation_id : null;
        }else{
          const source=result.context.team_map || result.context.participant_map;
          const winner=resolveImportedParticipant(source,match.penalty_winner_name,match.penalty_winner_name);
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

      // BUILD 8: after every import, collapse any pre-existing duplicate rows.
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
      if(state.adminMode&&state.adminPage==="import"&&document.getElementById("matchdayControl")){loadMatchdayControl();}
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
      if(state.adminMode&&state.adminPage==="import"&&document.getElementById("matchdayControl")){loadMatchdayControl();}
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
    const rejectedPanel = document.getElementById("importRejectedPanel");
    const importText = document.getElementById("importText");

    async function refreshImportConfiguration(){
      const worldId = worldSelect ? worldSelect.value : "GW004";
      const cfg = getWorldConfig(worldId);

      if(seasonDisplay) seasonDisplay.textContent = "Caricamento stagione…";
      if(seasonInput) seasonInput.value = "";
      if(previewButton) previewButton.disabled = true;
      if(importButton) importButton.disabled = true;

      if(competitionSelect){
        competitionSelect.disabled=true;
        competitionSelect.innerHTML='<option value="">Caricamento competizioni…</option>';
      }
      if(competitionHelp)competitionHelp.textContent="Caricamento competizioni…";

      try{
        const optionsHtml=await configuredCompetitionOptions(worldId);
        if(competitionSelect){
          competitionSelect.innerHTML=optionsHtml;
          competitionSelect.disabled=false;
        }
        if(competitionHelp){
          const count=competitionSelect
            ? Array.from(competitionSelect.querySelectorAll("option")).filter(function(option){return !!option.value;}).length
            : 0;
          competitionHelp.textContent=count+" modalità disponibili per "+worldId+" · solo competizioni presenti nel DB";
        }

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

    if(rejectedPanel){
      rejectedPanel.addEventListener("click",function(event){
        const deleteButton=event.target.closest("[data-rejected-source-index]");
        if(deleteButton){
          removeRejectedImportSourceLines([deleteButton.dataset.rejectedSourceIndex]);
          rebuildPreviewAfterRejectedRemoval();
          return;
        }

        const clearButton=event.target.closest("#clearRejectedLinesButton");
        if(clearButton){
          const indexes=Array.from(rejectedPanel.querySelectorAll("[data-rejected-source-index]")).map(function(button){
            return button.dataset.rejectedSourceIndex;
          });
          removeRejectedImportSourceLines(indexes);
          rebuildPreviewAfterRejectedRemoval();
        }
      });
    }

    if(importText){
      importText.addEventListener("input",function(){
        const panel=document.getElementById("importRejectedPanel");
        if(panel)panel.hidden=true;
      });
    }

    previewButton.addEventListener("click",buildImportPreview);
    importButton.addEventListener("click",importCompetitionMatches);
    if(previewDeleteButton)previewDeleteButton.addEventListener("click",previewImportDeletion);
    if(confirmDeleteButton)confirmDeleteButton.addEventListener("click",confirmImportDeletion);
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
