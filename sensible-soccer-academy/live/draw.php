<?php
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
$src = __DIR__ . '/../draw/index.html';
$html = @file_get_contents($src);
if ($html === false) { http_response_code(500); echo 'draw_unavailable'; exit; }
$html = str_replace('<head>', '<head><base href="../draw/"><meta name="robots" content="noindex,nofollow">', $html);
$html = str_replace('</body>', '<script src="../live/spectator.js?v=2"></script></body>', $html);
echo $html;
