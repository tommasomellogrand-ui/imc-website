<?php
declare(strict_types=1);

function imc_site_custom_cups(string $gw, int $season): array {
    if ($gw !== 'GW010' || $season !== 1) return [];
    $config = imc_site_config();
    $core = imc_site_db($config, 'core');
    $db = imc_site_db($config, imc_site_target($config, $gw));
    $cups = imc_site_rows($core, "SELECT game_world_id,world_type,sm_country,sm_division,competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=? AND competition_key IN (?,?)", [$gw,'GW010_COPA_LIBERTADORES','GW010_COPPA_DEI_CAMPIONI']);
    $table = imc_site_table($gw, 'Results');
    foreach ($cups as &$cup) {
        $cup['imc_season'] = $season;
        $cup['sm_action'] = strtolower(substr($cup['competition_key'], strlen($gw)+1));
        $teams = [];
        $games = imc_site_rows($db, "SELECT competition_group,competition_group_name,home_sm_club_id,home_name,away_sm_club_id,away_name FROM `$table` WHERE competition_key=? AND imc_season=? ORDER BY match_date,sm_fixture_id", [$cup['competition_key'],$season]);
        foreach ($games as $game) {
            $cup['competition_group'] = $game['competition_group'];
            $group = $game['competition_group_name'];
            if (!$group) continue;
            foreach (['home','away'] as $side) {
                $id = $game[$side.'_sm_club_id'];
                if ($id) $teams[$group][$id] = ['team_id'=>$id,'team_name'=>$game[$side.'_name']];
            }
        }
        $cup['groups'] = [];
        ksort($teams);
        foreach ($teams as $group=>$members) $cup['groups'][] = ['group_name'=>$group,'teams'=>array_values($members)];
    }
    return $cups;
}

function imc_site_custom_cup(string $gw,int $season,string $key): ?array {
    foreach(imc_site_custom_cups($gw,$season) as $cup)if($cup['competition_key']===$key)return $cup;
    return null;
}
