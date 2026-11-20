<?php
declare(strict_types=1);

function imc_manager_profile_index(PDO $core): array {
    $people = imc_site_rows($core, 'SELECT manager_id, full_name, face_image_url, bust_image_url FROM `IMC Manager Codex Global` ORDER BY CAST(SUBSTRING(manager_id, 4) AS UNSIGNED), manager_id');
    $byId = [];
    $used = [];
    foreach ($people as $person) {
        $id = (string)$person['manager_id'];
        $name = (string)$person['full_name'];
        $latin = function_exists('iconv') ? iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) : $name;
        $base = trim((string)preg_replace('/[^a-z0-9]+/', '-', strtolower($latin ?: $name)), '-') ?: strtolower($id);
        $slug = $base;
        if (isset($used[$slug])) {
            $slug = "$base-" . strtolower($id);
            while (isset($used[$slug])) $slug .= '-' . strtolower($id);
        }
        $used[$slug] = true;
        $byId[$id] = ['profile_slug' => $slug] + $person;
    }
    return $byId;
}
