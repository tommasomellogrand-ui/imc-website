<?php
declare(strict_types=1);
$world=strtoupper((string)($_GET['route_world']??''));
if(!preg_match('/^GW(?:00[1-9]|01[01])$/',$world)){http_response_code(404);exit;}
$competition=isset($_GET['route_competitions']);
$html=file_get_contents(__DIR__.($competition?'/competitions/index.html':'/index.html'));
$base=$competition?'/nexus/competitions/':'/nexus/';
$html=preg_replace('/<head>/', '<head><base href="'.$base.'">', $html,1);
header('Content-Type: text/html; charset=utf-8');header('Cache-Control: no-store');
echo $html;
