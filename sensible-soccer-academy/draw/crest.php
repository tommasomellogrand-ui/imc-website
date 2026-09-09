<?php
// HTTPS-safe crest proxy for the fixed GW010 24-club allowlist.
$allowed = [
  '376','362','618','1238','613','621','304','306','602','267','278','285',
  '96','1416','471','420','168','85','417','353','180','329','365','218'
];
$id = isset($_GET['id']) ? preg_replace('/\D+/', '', (string)$_GET['id']) : '';
if (!in_array($id, $allowed, true)) { http_response_code(404); exit; }

// Local overrides already supplied in-chat. These stay first priority.
$overrideNames = [
  '420' => 'Aberdeen',
  '267' => 'Argentinos Juniors',
  '96'  => 'Atalanta',
  '218' => 'Benfica',
];
$overrideFile = __DIR__ . '/../assets/crest-overrides.js';
if (isset($overrideNames[$id]) && is_file($overrideFile)) {
  $raw = @file_get_contents($overrideFile);
  $prefix = 'window.IMC_CREST_OVERRIDES=';
  if (is_string($raw) && strpos($raw, $prefix) === 0) {
    $json = rtrim(substr($raw, strlen($prefix)), ";\r\n \t");
    $map = json_decode($json, true);
    $uri = is_array($map) ? ($map[$overrideNames[$id]] ?? null) : null;
    if (is_string($uri) && preg_match('#^data:image/(?:webp|png|jpeg);base64,(.+)$#s', $uri, $m)) {
      $decoded = base64_decode($m[1], true);
      if ($decoded !== false && strlen($decoded) > 32) {
        $mime = str_starts_with($uri,'data:image/png') ? 'image/png' : (str_starts_with($uri,'data:image/jpeg') ? 'image/jpeg' : 'image/webp');
        header('Content-Type: '.$mime);
        header('Cache-Control: public, max-age=86400, stale-while-revalidate=604800');
        header('X-Content-Type-Options: nosniff');
        echo $decoded;
        exit;
      }
    }
  }
}

// Mapping based on the filenames supplied for the 24 draw clubs.
$footballLogos = [
  '376'  => ['uruguay','penarol'],
  '362'  => ['chile','colo-colo'],
  '618'  => ['colombia','millonarios'],
  '1238' => ['bolivia','bolivar'],
  '613'  => ['paraguay','olimpia'],
  '621'  => ['peru','alianza-lima'],
  '304'  => ['brazil','santos'],
  '306'  => ['brazil','sao-paulo'],
  '602'  => ['brazil','gremio'],
  '267'  => ['argentina','argentinos-juniors'],
  '278'  => ['argentina','newells-old-boys'],
  '285'  => ['argentina','velez-sarsfield'],
  '96'   => ['italy','atalanta'],
  '1416' => ['hungary','ferencvaros'],
  '471'  => ['sweden','ifk-goteborg'],
  '420'  => ['scotland','aberdeen'],
  '168'  => ['spain','sevilla'],
  '85'   => ['england','west-ham-united'],
  '417'  => ['germany','vfb-stuttgart'],
  '353'  => ['belgium','anderlecht'],
  '180'  => ['netherlands','ajax'],
  '329'  => ['france','olympique-lyon'],
  '365'  => ['croatia','dinamo-zagreb'],
  '218'  => ['portugal','benfica'],
];

function fetch_image(string $url): ?array {
  $data=false; $contentType='image/png'; $status=0;
  if (function_exists('curl_init')) {
    $ch=curl_init($url);
    curl_setopt_array($ch,[
      CURLOPT_RETURNTRANSFER=>true,
      CURLOPT_FOLLOWLOCATION=>true,
      CURLOPT_CONNECTTIMEOUT=>5,
      CURLOPT_TIMEOUT=>10,
      CURLOPT_USERAGENT=>'Mozilla/5.0 IMC-Sensible-Draw/1.0',
      CURLOPT_HTTPHEADER=>['Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8']
    ]);
    $data=curl_exec($ch);
    $status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);
    $ct=curl_getinfo($ch,CURLINFO_CONTENT_TYPE);
    if (is_string($ct) && stripos($ct,'image/')===0) $contentType=$ct;
    curl_close($ch);
  } else {
    $ctx=stream_context_create(['http'=>['timeout'=>10,'header'=>"User-Agent: Mozilla/5.0 IMC-Sensible-Draw/1.0\r\nAccept: image/*\r\n"]]);
    $data=@file_get_contents($url,false,$ctx);
    $status=$data===false?0:200;
  }
  if ($status<200 || $status>=300 || !is_string($data) || strlen($data)<32) return null;
  return [$data,$contentType];
}

$urls=[];
if (isset($footballLogos[$id])) {
  [$country,$slug]=$footballLogos[$id];
  $urls[]='https://football-logos.cc/logos/'.$country.'/512x512/'.$slug.'.png';
  $urls[]='https://football-logos.cc/logos/'.$country.'/256x256/'.$slug.'.png';
}
// Last-resort legacy SM source.
$urls[]='http://cdn.cloudfiles.mosso.com/c12351/'.$id.'.png';

foreach ($urls as $url) {
  $img=fetch_image($url);
  if ($img!==null) {
    header('Content-Type: '.$img[1]);
    header('Cache-Control: public, max-age=86400, stale-while-revalidate=604800');
    header('X-Content-Type-Options: nosniff');
    echo $img[0];
    exit;
  }
}

http_response_code(502);
header('Content-Type: text/plain; charset=utf-8');
echo 'crest_unavailable';
