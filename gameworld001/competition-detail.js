(() => {
  'use strict';

  function isLegacyCompetitionRoute(){
    const hash = String(location.hash || '');
    return /^#\/competition\//.test(hash) || /^#\/competitions\/(domestic|international|nations)(?:\/|$)/.test(hash);
  }

  function returnToBaseline(){
    if(!isLegacyCompetitionRoute()) return;
    location.hash = '#/competitions';
  }

  window.addEventListener('hashchange', returnToBaseline);
  window.addEventListener('popstate', returnToBaseline);
  setTimeout(returnToBaseline, 0);
})();
