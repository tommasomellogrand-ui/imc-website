<?php
declare(strict_types=1);

$worlds = require __DIR__ . '/worlds.php';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
if (!is_string($path) || !preg_match('~^/([a-z]+)/(?:managers)/([a-z0-9]+(?:-[a-z0-9]+)*|profile\.html)/?$~D', $path, $route) || !isset($worlds[$route[1]])) {
    http_response_code(404);
    exit;
}
[, $slug, $requested] = $route;
[$world, $worldName] = $worlds[$slug];
$listUrl = '/' . $slug . '/managers/';
$worldUrl = '/' . $slug . '/';
require dirname(__DIR__, 2) . '/site-data/core/bootstrap.php';
require dirname(__DIR__, 2) . '/site-data/managers/profile-slugs.php';

header('Cache-Control: no-store');
$manager = null;
$unavailable = false;
try {
    $core = imc_site_db(imc_site_config(), 'core');
    $index = imc_manager_profile_index($core);
    $legacy = $requested === 'profile.html';
    if ($legacy) {
        $manager = $index[strtoupper((string)($_GET['manager'] ?? ''))] ?? null;
    } else {
        foreach ($index as $person) {
            if ($person['profile_slug'] === $requested) {
                $manager = $person;
                break;
            }
        }
    }
    if ($manager && !imc_site_rows($core, 'SELECT id FROM `IMC Manager Assignment Global` WHERE game_world_id=? AND manager_id=? LIMIT 1', [$world, $manager['manager_id']])) {
        $manager = null;
    }
    if ($legacy && $manager) {
        $query = array_intersect_key($_GET, array_flip(['scope', 'tab']));
        header('Location: ' . $listUrl . $manager['profile_slug'] . '/' . ($query ? '?' . http_build_query($query) : ''), true, 302);
        exit;
    }
} catch (Throwable $e) {
    $manager = null;
    $unavailable = true;
    error_log('Manager profile ' . $world . ': ' . $e->getMessage());
}
if (!$manager) http_response_code($unavailable ? 503 : 404);
$h = static fn(?string $x): string => htmlspecialchars($x ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$name = $manager['full_name'] ?? ($unavailable ? 'Profilo temporaneamente non disponibile' : 'Manager non trovato');
$portrait = null;
if ($manager) {
    foreach (['bust_image_url','face_image_url'] as $field) {
        $candidate = preg_replace('/^http:/i', 'https:', trim((string)($manager[$field] ?? '')));
        if (preg_match('~^(https://|/(?!/))~i', $candidate)) { $portrait = $candidate; break; }
    }
}
$names = preg_split('/\s+/u', trim($name)) ?: [];
$initials = implode('', array_map(static fn(string $n): string => function_exists('mb_substr') ? mb_substr($n, 0, 1) : substr($n, 0, 1), array_slice($names, 0, 2)));
$asset = static fn(string $module): string => '/site-assets/world-engine/asset.php?' . http_build_query(['world' => $slug, 'module' => 'managers/' . $module . '.js', 'v' => 'manager-profile1']);
?>
<!doctype html>
<html lang="it"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= $h($name) ?> · <?= $h($worldName) ?></title>
<?php if ($manager): ?><link rel="canonical" href="https://www.italianmastersclub.it<?= $h($listUrl . $manager['profile_slug'] . '/') ?>"><?php endif; ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
<link rel="stylesheet" href="/nexus/assets/h2h.css">
<link rel="stylesheet" href="/nexus/assets/data-room.css">
<link rel="stylesheet" href="/nexus/assets/trophy-room.css">
<link rel="stylesheet" href="/site-assets/world-engine/manager-profile.css?v=1">
<?php if ($manager) foreach (['h2h','history-overview','data-room','trophy-room','manager-profile'] as $module): ?>
<script defer src="<?= $h($asset($module)) ?>"></script>
<?php endforeach; ?>
</head>
<body class="manager-profile" data-profile-world="<?= $h($slug) ?>">
<header class="mp-bar"><div class="mp-width">
 <a class="mp-brand" href="<?= $h($worldUrl) ?>"><img src="/site-assets/images/imc-logo.png" alt="" width="34" height="34"><?= $h($worldName) ?></a>
 <a class="mp-back" href="<?= $h($listUrl) ?>">← Tutti i manager</a>
</div></header>
<main class="mp-width"<?= $manager ? ' data-manager-id="' . $h((string)$manager['manager_id']) . '"' : '' ?>>
<section class="mp-hero">
 <div class="mp-intro"><p><?= $h($worldName) ?> <span>·</span> Manager</p><h1><?= $h($name) ?></h1></div>
 <?php if ($manager): ?><div class="mp-portrait"><span aria-hidden="true"><?= $h($initials) ?></span>
 <?php if ($portrait): ?><img src="<?= $h($portrait) ?>" alt="<?= $h($name) ?>" fetchpriority="high"><?php endif; ?>
 </div><?php endif; ?>
</section>
<?php if ($manager): ?>
<div id="assign" class="mp-assignments" aria-label="Incarichi attivi"></div>
<div class="mp-controls">
 <nav class="mp-tabs" aria-label="Sezioni del profilo">
  <button type="button" data-tab="overview" aria-pressed="true">Overview</button>
  <button type="button" data-tab="career" aria-pressed="false">Carriera</button>
  <button type="button" data-tab="trophies" aria-pressed="false">Trofei</button>
  <button type="button" data-tab="h2h" aria-pressed="false">H2H</button>
  <button type="button" data-tab="data-room" aria-pressed="false">Data Room</button>
 </nav>
 <nav class="mp-scope" aria-label="Ambito">
  <button type="button" data-manager-scope="club" aria-pressed="true">Club</button>
  <button type="button" data-manager-scope="national_team" aria-pressed="false">Nazionale</button>
 </nav>
</div>
<div id="view" class="mp-content"><p class="card empty" role="status">Caricamento profilo…</p></div>
<?php endif; ?>
</main>
</body></html>
