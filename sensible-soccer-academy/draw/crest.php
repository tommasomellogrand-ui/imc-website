<?php
// HTTPS-safe proxy for the fixed GW010 club crest allowlist.
$allowed = [
  '376','362','618','1238','613','621','304','306','602','267','278','285',
  '96','1416','471','420','168','85','417','353','180','329','365','218'
];
$id = isset($_GET['id']) ? preg_replace('/\D+/', '', (string)$_GET['id']) : '';
if (!in_array($id, $allowed, true)) {
  http_response_code(404);
  exit;
}
$url = 'http://cdn.cloudfiles.mosso.com/c12351/' . $id . '.png';
$data = false;
$contentType = 'image/png';

if (function_exists('curl_init')) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_USERAGENT => 'IMC-Sensible-Draw/1.0',
  ]);
  $data = curl_exec($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $ct = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
  if (is_string($ct) && stripos($ct, 'image/') === 0) $contentType = $ct;
  curl_close($ch);
  if ($status < 200 || $status >= 300) $data = false;
} else {
  $ctx = stream_context_create(['http' => ['timeout' => 10, 'header' => "User-Agent: IMC-Sensible-Draw/1.0\r\n"]]);
  $data = @file_get_contents($url, false, $ctx);
}

if ($data === false || strlen($data) < 32) {
  http_response_code(502);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'crest_unavailable';
  exit;
}

header('Content-Type: ' . $contentType);
header('Cache-Control: public, max-age=86400, stale-while-revalidate=604800');
header('X-Content-Type-Options: nosniff');
echo $data;
