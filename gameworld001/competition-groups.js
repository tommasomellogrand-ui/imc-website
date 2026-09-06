(() => {
  'use strict';

  function currentPath(){
    return location.hash.replace(/^#/,'') || '/overview';
  }

  function resetCompetitionsView(){
    if(currentPath() !== '/competitions') return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const host = document.querySelector('.competition-discovery');
      if(host){
        clearInterval(timer);
        host.innerHTML = `
          <section class="competition-category-card domestic" aria-label="GW001 Competitions reset baseline">
            <div class="competition-category-icon">🏆</div>
            <div class="competition-category-copy">
              <h3>Competitions</h3>
              <p>GW001 · Road To History</p>
            </div>
            <div class="competition-category-count">
              <strong>1</strong>
              <span>Starting Point</span>
            </div>
            <div class="competition-category-trophy">🏆</div>
          </section>`;
      } else if(attempts >= 30){
        clearInterval(timer);
      }
    }, 50);
  }

  window.addEventListener('hashchange', () => setTimeout(resetCompetitionsView, 0));
  window.addEventListener('popstate', () => setTimeout(resetCompetitionsView, 0));
  setTimeout(resetCompetitionsView, 0);
})();
