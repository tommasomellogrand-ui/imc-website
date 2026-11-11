<?php
if (isset($_GET['assegnazioni']) || isset($_GET['manager']) || isset($_GET['view'])) {
    $campusPage = 'the_dugout';
    require dirname(__DIR__, 2).'/clubhouse/index.php';
    return;
}
?>
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#20251c">
<title>The Dugout | Italian Masters Club</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; background: #20251c; color: white; font: 600 1rem Inter,system-ui,sans-serif; }
main { position: relative; isolation: isolate; min-height: 100vh; min-height: 100dvh; display: grid; place-items: end center; padding: 1.25rem 1rem max(7vh,calc(env(safe-area-inset-bottom) + 1rem)); }
.scene { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 39%; z-index: -1; }
a { display: inline-flex; gap: .8rem; align-items: center; min-height: 48px; padding: .85rem 1.4rem; color: #fff6df; background: #18291f; border: 1px solid #d0b784; border-radius: .35rem; text-decoration: none; box-shadow: 0 3px 16px #0006; }
a:focus-visible { outline: 3px solid white; outline-offset: 4px; }
.crest { position: absolute; top: max(1rem,env(safe-area-inset-top)); left: max(1rem,env(safe-area-inset-left)); width: clamp(38px,6vw,58px); }
</style>
</head>
<body><main aria-label="Ingresso a The Dugout">
<img class="scene" src="dugout-tattico.webp" alt="La sala tecnica del Campus con la lavagna degli allenatori" fetchpriority="high">
<img class="crest" src="/site-assets/images/imc-logo.png" alt="Italian Masters Club">
<a href="?assegnazioni=1">Vedi le assegnazioni <span aria-hidden="true">→</span></a>
</main></body></html>
