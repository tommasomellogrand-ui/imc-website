<?php header('Cache-Control: no-store'); ?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111722">
  <title>IMC Ranking · Italian Masters Club</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
  <link rel="stylesheet" href="/nexus/club-house/club-house.css?v=20261104ivory1">
  <link rel="stylesheet" href="./ranking.css?v=3">
  <script defer src="/clubhouse/portraits.js?v=20261106photos"></script>
  <script defer src="/clubhouse/club-house.js?v=one-ranking3"></script>
</head>
<body class="one-ranking" data-section="ranking">
  <header class="one-masthead">
    <div class="one-shell">
      <a class="one-back" href="/imc_campus/">← Campus IMC</a>
      <div class="one-hero">
        <div class="one-heading">
          <img src="/site-assets/images/imc-logo.png" alt="Italian Masters Club" width="45" height="49">
          <h1>IMC <span>Ranking</span></h1>
          <p>Club, nazionali e trofei di tutti i mondi IMC.</p>
        </div>
        <div class="one-scene" aria-hidden="true"></div>
      </div>
    </div>
  </header>
  <main class="one-shell" id="main">
    <a id="back" href="./" hidden>← Tutta la classifica</a>
    <section class="one-tools" aria-label="Filtri classifica">
      <div class="controls">
        <select id="manager-filter" hidden aria-label="Manager"></select>
        <label id="search-label">Manager<input id="search" type="search" list="manager-options" autocomplete="off" placeholder="Cerca per nome o ID"></label>
        <datalist id="manager-options"></datalist>
        <label>Mondo di gioco<select id="world"><option value="">Tutti i mondi</option></select></label>
        <button id="retry" type="button" aria-label="Aggiorna la classifica">↻</button>
      </div>
    </section>
    <div id="directory-heading" class="one-standing-head">
      <h2>Classifica</h2><span id="manager-count"></span>
    </div>
    <div class="one-data">
      <p id="loading" role="status">Caricamento dati…</p>
      <p id="warning" role="status"></p>
      <span id="compact-count" hidden></span>
    </div>
    <nav id="scope-tabs" hidden></nav>
    <nav id="tabs" hidden></nav>
    <div id="content"></div>
    <noscript>Attiva JavaScript per consultare la classifica.</noscript>
  </main>
</body>
</html>
