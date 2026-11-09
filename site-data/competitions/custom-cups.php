<?php
declare(strict_types=1);
// Explicit registration: no fabricated fixtures, scores or dates.
function imc_site_custom_cups(string $gw, int $season): array {
    if($gw!=='GW010'||$season!==1)return [];
    return json_decode(file_get_contents(__DIR__.'/custom-cups.json'),true,512,JSON_THROW_ON_ERROR);
}
function imc_site_custom_cup(string $gw,int $season,string $key): ?array {
    foreach(imc_site_custom_cups($gw,$season) as $cup)if($cup['competition_key']===$key)return $cup;
    return null;
}
