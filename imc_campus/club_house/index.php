<?php header('Cache-Control: no-store'); ?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#18392e">
  <title>Club House · Italian Masters Club</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="/nexus/club-house/club-house.css?v=20261104ivory1">
  <link rel="stylesheet" href="/clubhouse/hub.css?v=career-direct1">
  <link rel="stylesheet" href="./career.css?v=3">
  <script defer src="/clubhouse/portraits.js?v=20261106photos"></script>
  <script defer src="/clubhouse/club-house.js?v=career-awards1"></script>
</head>
<body class="career-room" data-section="career">
  <header class="career-masthead">
    <div class="career-shell">
      <a class="career-campus" href="/imc_campus/">← Campus IMC</a>
      <div class="career-brand">
        <img src="/site-assets/images/imc-logo.png" alt="" width="45" height="49">
        <p>Italian Masters Club</p>
      </div>
      <div class="profile-heading">
        <span id="profile-avatar" class="hero-avatar" hidden></span>
        <div><h1 id="title">Club House</h1><p id="subtitle">Carriere dei manager</p></div>
      </div>
    </div>
  </header>

  <main class="career-shell">
    <a id="back" class="career-back" href="./" hidden>← Tutti i manager</a>
    <section class="career-tools" aria-label="Filtri carriera">
      <div class="controls">
        <select id="manager-filter" hidden aria-label="Manager"></select>
        <label id="search-label">Cerca manager<input id="search" type="search" list="manager-options" autocomplete="off" placeholder="Nome o ID manager"></label>
        <datalist id="manager-options"></datalist>
        <label>Mondo di gioco<select id="world"><option value="">Tutti i mondi</option></select></label>
        <button id="retry" type="button" aria-label="Aggiorna i dati">↻</button>
      </div>
      <nav id="scope-tabs" aria-label="Ambito della carriera" hidden>
        <button type="button" data-scope="global" aria-pressed="true">Tutte le partite</button>
        <button type="button" data-scope="club" aria-pressed="false">Club</button>
        <button type="button" data-scope="national_team" aria-pressed="false">Nazionali</button>
      </nav>
    </section>
    <div id="directory-heading" class="career-directory-heading">
      <h2>Manager IMC</h2><span id="manager-count"></span>
    </div>
    <div class="career-data"><p id="loading" role="status">Caricamento manager…</p><p id="warning" role="status"></p></div>
    <nav id="tabs" hidden></nav>
    <div id="content"></div>
  </main>
</body>
</html>
