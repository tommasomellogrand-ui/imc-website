<?php
$code = strtolower(trim((string)($_GET['c'] ?? '')));
if (!preg_match('/^[1-9a][0-9a-z]{4,9}$/', $code)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Not found';
    exit;
}

$host = strtolower((string)($_SERVER['HTTP_HOST'] ?? 'www.italianmastersclub.it'));
if (!in_array($host, ['www.italianmastersclub.it', 'italianmastersclub.it'], true)) {
    $host = 'www.italianmastersclub.it';
}

$version = trim((string)($_GET['v'] ?? ''));
if ($version !== '' && !preg_match('/^[0-9A-Za-z_-]{1,12}$/', $version)) {
    $version = '';
}

$endpoint = 'https://toanuzojdkfjgucztpze.supabase.co/functions/v1/nexus-feed-share'
    . '?code=' . rawurlencode($code)
    . '&host=' . rawurlencode($host);

$html = false;
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
        'ignore_errors' => true,
        'header' => "User-Agent: IMC-Nexus-Share/1.0\r\nAccept: text/html,*/*\r\n",
    ],
]);
$html = @file_get_contents($endpoint, false, $context);

if (($html === false || stripos($html, '<!doctype html>') === false) && function_exists('curl_init')) {
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'IMC-Nexus-Share/1.0',
        CURLOPT_HTTPHEADER => ['Accept: text/html,*/*'],
    ]);
    $curlHtml = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($status === 200 && is_string($curlHtml)) {
        $html = $curlHtml;
    }
}

if (!is_string($html) || stripos($html, '<!doctype html>') === false) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Not found';
    exit;
}

if ($version !== '') {
    $baseUrl = 'https://' . $host . '/nexus/s/' . $code;
    $versionedUrl = $baseUrl . '?v=' . rawurlencode($version);
    $html = str_replace($baseUrl, $versionedUrl, $html);
}

if (preg_match('/<meta property="og:image" content="([^"]+)">/i', $html, $imageMatch)) {
    $imageUrl = $imageMatch[1];
    $telegramImageMeta = '<meta property="og:image:secure_url" content="' . $imageUrl . '">'
        . '<meta property="og:image:type" content="image/webp">'
        . '<meta property="og:image:width" content="1536">'
        . '<meta property="og:image:height" content="1024">';
    $html = str_replace($imageMatch[0], $imageMatch[0] . $telegramImageMeta, $html);
}

if (preg_match('/<meta property="og:description" content="([^"]*)">/i', $html, $descriptionMatch)) {
    $html = str_replace($descriptionMatch[0], $descriptionMatch[0] . '<meta name="description" content="' . $descriptionMatch[1] . '">', $html);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
header('X-Robots-Tag: noindex, nofollow');
echo $html;
