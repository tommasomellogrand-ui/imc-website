<?php
header('Cache-Control: no-store');
if (array_intersect(['career','manager','scope','world','view'],array_keys($_GET))) {
    $campusPage = 'club_house';
    require dirname(__DIR__, 2).'/clubhouse/hub.php';
    exit;
}
?>
<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2f281c"><title>Club House · IMC Campus</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#2f281c}
main{height:100vh;height:100dvh;display:grid;place-items:center;overflow:hidden;background:linear-gradient(#2e231bcc,#2e231bcc),url(ingresso.webp) center/cover}
.scene{height:100%;aspect-ratio:850/1850;position:relative}
.scene img{display:block;width:100%;height:100%}
.folder{position:absolute;left:0;right:0;top:58%;bottom:6%}
.folder:focus-visible{outline:3px solid #ffe2a1;outline-offset:-5px}
@media(orientation:portrait){.scene{height:auto;width:max(100vw,45.946dvh);align-self:end;}}
</style></head><body><main aria-label="Ingresso della Club House"><div class="scene">
<img src="ingresso.webp" width="850" height="1850" fetchpriority="high" alt="Salotto della Club House con la cartella verde Carriere dei manager sul tavolino">
<a class="folder" href="?career=1" aria-label="Apri Carriere dei manager"></a>
</div></main></body></html>