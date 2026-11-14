/* IMC: display names exactly as imported. Keep site revision notifications independent. */
(() => {
 const section = location.pathname.split('/')[1];
 if (!['','index.html','clubhouse','imc_campus','nexus','roadtohistory','halloffamers','kickoff','sensiblesocceracademy','subbuteosuperleague','worldleague','masterleagueworld','scudetto'].includes(section)) return;
 if (document.getElementById('imc-site-changes')) return;
 const script = document.createElement('script');
 script.id = 'imc-site-changes';
 script.src = '/site-assets/js/site-changes.js';
 document.head.append(script);
})();
