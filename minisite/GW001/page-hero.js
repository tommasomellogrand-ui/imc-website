const pages={
  home:['Road to history','IL PRESENTE DIVENTA STORIA','Ogni partita.<br>Una traccia.','archive.html','Dentro la stagione'],
  competitions:['Competizioni','OGNI TROFEO HA UNA STORIA','Un obiettivo.<br>Molte sfide.','results.html','Esplora i risultati','Divisioni e coppe: i percorsi che danno forma alla stagione.'],
  results:['Risultati','IL CAMPO HA PARLATO','Ogni risultato.<br>Una traccia.','archive.html','Rileggi la stagione','Il risultato è definitivo. La lettura continua, partita dopo partita.'],
  schedule:['Calendario','LA STORIA DEVE ANCORA INIZIARE','Il prossimo atto.<br>La prossima sfida.','competitions.html','Esplora le competizioni','Le partite che aspettano di diventare storia.'],
  match:['Match Center','DENTRO OGNI PARTITA','Il verdetto.<br>I suoi dettagli.','results.html','Scegli una partita','Risultati, protagonisti e cronaca: ogni incontro si legge da vicino.'],
  standings:['Classifiche','OGNI POSIZIONE CONTA','La corsa.<br>Il traguardo.','competitions.html','Esplora le competizioni','Posizione, distanza, forma. La stagione attraverso il confronto.'],
  manager:['Manager','DIETRO OGNI SCELTA','Una direzione.<br>Un percorso.','club.html','Esplora i club','I protagonisti in panchina, gli incarichi e le tappe della loro storia.'],
  player:['Player','LA MISURA DEL TALENTO','Ogni giocatore.<br>La sua firma.','results.html','Apri i Match Report','Identità, caratteristiche e percorso dei giocatori di Road To History.'],
  club:['Club','UN CLUB. MOLTE STORIE.','Una maglia.<br>Un’appartenenza.','manager.html','Incontra i manager','Squadre, incontri e protagonisti: le tracce di ogni club nel mondo GW001.'],
  archive:['Archivio','NULLA VA DIMENTICATO','Il tempo passa.<br>La storia resta.','results.html','Rileggi i risultati','Date, risultati e capitoli da ritrovare. Il presente lascia il campo, il risultato resta.']
};
export function cinema(page){
  const [,eyebrow,title,href,label]=pages[page];
  return `<section class="cinema" data-hero="${page}"><img src="./exploration-assets/stadium.webp" alt="Ricostruzione simbolica di un tunnel verso il campo illuminato" width="1536" height="1024" fetchpriority="high"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><a class="text-link" style="white-space:normal;overflow-wrap:anywhere" href="${href}">${label}<span class="arrow" aria-hidden="true">↗</span></a><span class="image-caption">IMMAGINE SIMBOLICA · RICOSTRUZIONE AI</span></section>`;
}
export function pageHero(page){
  const [title,,,,,description]=pages[page];
  return `<header class="page-hero"><div class="home-title"><div><span class="eyebrow">GW001 · ROAD TO HISTORY</span><h1>${title}</h1></div><p>Live now.<br>Archived forever.</p></div><div class="main-grid">${cinema(page)}<aside class="side-column"><div class="side-title"><span class="eyebrow">${title} · GW001</span></div><p>${description}</p></aside></div></header>`;
}
