(function(){
  "use strict";

  const VERSION="1.0.1";

  function cleanLegacyDuplicatePanels(){
    document.querySelectorAll('[data-imc-native-scorer-panel="1"]').forEach(function(el){
      el.remove();
    });
    document.querySelectorAll('[data-imc-native-scorers="1"]').forEach(function(el){
      el.removeAttribute("data-imc-native-scorers");
    });
    window.IMC_RESULTS_SCORERS_STATUS={version:VERSION,loaded:true,rows:0,decorated:0,error:null};
  }

  cleanLegacyDuplicatePanels();

  let timer=null;
  const observer=new MutationObserver(function(){
    clearTimeout(timer);
    timer=setTimeout(cleanLegacyDuplicatePanels,40);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.IMC_RESULTS_SCORERS={
    version:VERSION,
    refresh:function(){
      cleanLegacyDuplicatePanels();
      return Promise.resolve();
    }
  };
})();
