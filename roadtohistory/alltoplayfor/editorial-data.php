<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$allowed=['programmes-catalog.json','portraits.json','2026-10-20-postmatch.json','2026-10-22-coffee.json','2026-10-23-coffee-editorial.json','rth-24/flash-news.json'];
$file=$_GET['file']??'';
if(!in_array($file,$allowed,true)){http_response_code(404);echo '{"ok":false}';exit;}
$source=dirname(__DIR__,2).'/nexus/alltoplayfor/'.$file;
if(!is_readable($source)){http_response_code(503);echo '{"ok":false}';exit;}
echo str_replace('/nexus/alltoplayfor/','/roadtohistory/alltoplayfor/',file_get_contents($source));
