<?php header('Cache-Control: no-store'); ?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#121a29">
  <title>Media Center · Italian Masters Club</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="./media-center.css?v=1">
  <script defer src="/clubhouse/portraits.js?v=20261106photos"></script>
  <script defer src="./media-center.js?v=1"></script>
</head>
<body>
  <header class="masthead">
    <div class="shell">
      <nav class="topline" aria-label="Navigazione Campus">
        <a href="/imc_campus/">← IMC Campus</a>
        <a href="/imc_campus/world_center/">Game World</a>
      </nav>
      <div class="masthead-title">
        <img src="/site-assets/images/imc-logo.png" width="54" height="60" alt="">
        <div><p>ITALIAN MASTERS CLUB</p><h1>Media Center</h1></div>
      </div>
    </div>
  </header>

  <main class="shell">
    <div class="feed-tools">
      <div class="filters" role="group" aria-label="Tipo di evento">
        <button type="button" data-kind="" aria-pressed="true">Tutto</button>
        <button type="button" data-kind="trophy" aria-pressed="false">Trofei</button>
        <button type="button" data-kind="assignment" aria-pressed="false">Incarichi</button>
        <button type="button" data-kind="passport" aria-pressed="false">Passport</button>
      </div>
      <div class="feed-options">
        <p id="event-status" role="status">Caricamento eventi…</p>
        <details id="feed-settings">
          <summary>Filtri e dati</summary>
          <div class="settings-panel">
            <label>Game World<select id="world"><option value="">Tutti i mondi</option></select></label>
            <label>Manager<select id="manager"><option value="">Tutti i manager</option></select></label>
            <button id="retry" type="button">Aggiorna eventi</button>
          </div>
        </details>
      </div>
    </div>
    <div id="feed" aria-label="Eventi IMC" aria-busy="true"></div>
    <noscript>Attiva JavaScript per consultare gli eventi.</noscript>
  </main>
</body>
</html>
