<?php
header('Cache-Control: no-store, no-cache, must-revalidate');
if (isset($_GET['book']) || isset($_GET['manager']) || isset($_GET['world']) || isset($_GET['scope'])) {
    $campusPage = 'trophy_room';
    require dirname(__DIR__, 2).'/clubhouse/hub.php';
    exit;
}
?>
<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#28201a"><title>Trophy Room · IMC</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#28201a}
main{height:100vh;height:100dvh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(#251b12a8,#251b12a8),center/cover url(gallery.webp)}
.scene{position:relative;flex:none;width:calc(100vh * 852 / 1846);width:calc(100dvh * 852 / 1846)}
img{display:block;width:100%;height:auto}
.book{position:absolute;left:47%;right:2%;top:62%;bottom:18%}
.book:focus-visible{outline:3px solid ivory}
@media(orientation:portrait){.scene{width:max(100vw,46.16vh);width:max(100vw,46.16dvh)}}
@media(orientation:portrait) and (min-aspect-ratio:3/5){main{align-items:flex-end}}
</style></head><body><main aria-label="Sala dei trofei"><div class="scene">
<img src="/imc_campus/trophy_room/sala.webp" width="852" height="1846" alt="La coppa e il libro d’oro sul leggio della Trophy Room">
<a class="book" href="?book=1" aria-label="Apri l’albo d’oro"></a>
</div></main></body></html>
