(function(){
  "use strict";

  // Build 59 · GW008 native ownership preserved from Build 58.
  // The Build 56 core remains historical source. These verified replacements
  // are applied before execution, so legacy GW008 renderers never reach the DOM.
  const VERSION="59.1-core";
  const SOURCE="js/app-core-56.js?v=56.0-build59-source";

  function replaceOnce(source,oldValue,newValue,label){
    const first=source.indexOf(oldValue);
    const last=source.lastIndexOf(oldValue);
    if(first<0||first!==last)throw new Error("Build 59 core: "+label+" occurrence mismatch");
    return source.slice(0,first)+newValue+source.slice(first+oldValue.length);
  }

  const xhr=new XMLHttpRequest();
  xhr.open("GET",SOURCE,false);
  xhr.setRequestHeader("Cache-Control","no-cache, no-store");
  xhr.send(null);
  if(xhr.status<200||xhr.status>=300)throw new Error("Build 59 core: source load failed ("+xhr.status+")");

  let source=xhr.responseText;

  source=replaceOnce(
    source,
    'const NEXUS_BUILD = "56";',
    'const NEXUS_BUILD = "59";',
    "build marker"
  );

  source=replaceOnce(
    source,
    '<b>${nexusNavIcon("clubs")}</b><span>CLUBS</span>',
    '<b>${nexusNavIcon("clubs")}</b><span>${state.selectedWorld==="GW008"?"TEAM HUB":"CLUBS"}</span>',
    "GW008 Team Hub label"
  );

  source=replaceOnce(
    source,
    '            <button data-world-section="national" class="${state.worldSection==="national" ? "active" : ""}">\n              <b>${nexusNavIcon("national")}</b><span>NAZIONALI</span>\n            </button>',
    '            ${state.selectedWorld==="GW008"?"":`<button data-world-section="national" class="${state.worldSection==="national" ? "active" : ""}">\n              <b>${nexusNavIcon("national")}</b><span>NAZIONALI</span>\n            </button>`}',
    "GW008 legacy national nav"
  );

  source=replaceOnce(
    source,
    '      }else{\n        if(state.selectedManager){\n          root.innerHTML = managerProfilePage();\n          bindManagerProfile();\n        }else{\n          root.innerHTML = managerRegistryPage();\n          bindManagerRegistry();\n        }\n      }\n      return;',
    '      }else{\n        if(state.selectedWorld === "GW008"){\n          root.innerHTML = "";\n        }else if(state.selectedManager){\n          root.innerHTML = managerProfilePage();\n          bindManagerProfile();\n        }else{\n          root.innerHTML = managerRegistryPage();\n          bindManagerRegistry();\n        }\n      }\n      return;',
    "GW008 legacy manager renderer"
  );

  source=replaceOnce(
    source,
    '<button data-page="stats" class="${state.page==="stats"?"active":""}"><b>${nexusNavIcon("stats")}</b><span>STATS</span></button>',
    '${state.selectedWorld==="GW008"?"":`<button data-page="stats" class="${state.page==="stats"?"active":""}"><b>${nexusNavIcon("stats")}</b><span>STATS</span></button>`}',
    "GW008 legacy stats nav"
  );

  source=replaceOnce(
    source,
    '<button data-page="h2h" class="${state.page==="h2h"?"active":""}"><b>${nexusNavIcon("h2h")}</b><span>H2H</span></button>',
    '${state.selectedWorld==="GW008"?"":`<button data-page="h2h" class="${state.page==="h2h"?"active":""}"><b>${nexusNavIcon("h2h")}</b><span>H2H</span></button>`}',
    "GW008 legacy h2h nav"
  );

  source=replaceOnce(
    source,
    '<button data-page="trophies" class="${state.worldSection==="trophy-room"||state.page==="trophies"?"active":""}"><b>${nexusNavIcon("trophy")}</b><span>TROPHY ROOM</span></button>',
    '${state.selectedWorld==="GW008"?"":`<button data-page="trophies" class="${state.worldSection==="trophy-room"||state.page==="trophies"?"active":""}"><b>${nexusNavIcon("trophy")}</b><span>TROPHY ROOM</span></button>`}',
    "GW008 legacy trophy nav"
  );

  window.__NEXUS_CORE_BUILD__="59";
  window.__NEXUS_CORE_ADAPTER_VERSION__=VERSION;
  (new Function(source+"\n//# sourceURL=app-core-59-runtime.js"))();
})();