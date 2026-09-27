<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/competitions/match-teams.php';
try {
    $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);
    if($season===null)throw new InvalidArgumentException('season_required');
    $db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
    $rt=nexus_table($gw,'Results');$st=nexus_table($gw,'Schedule');
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    $labels=[];foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $m)$labels[$m['competition_key']]=$m['nexus_view'];
    $out=['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'errors'=>[]];
    foreach(['results','schedule'] as $kind){
        try {
            if($kind==='results')$rows=nexus_rows($db,'SELECT * FROM `'.$rt.'` WHERE game_world_id=? AND imc_season=? AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY match_date DESC,sm_fixture_id DESC LIMIT 6',[$gw,$season]);
            else $rows=nexus_rows($db,'SELECT s.* FROM `'.$st.'` s WHERE s.game_world_id=? AND s.imc_season=? AND s.match_date>=? AND NOT EXISTS (SELECT 1 FROM `'.$rt.'` r WHERE r.sm_fixture_id=s.sm_fixture_id AND r.game_world_id=s.game_world_id AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL) ORDER BY s.match_date ASC,s.match_time ASC,s.sm_fixture_id ASC LIMIT 6',[$gw,$season,$today]);
            $rows=nexus_enrich_match_teams($core,$gw,$rows);
            $names=['charityshield'=>'Charity Shield','leaguecup'=>'National Cup','nationalcup'=>'National Cup','leagueshield'=>'League Cup','smfacup'=>'SMFA Champions','smfashield'=>'SMFA Shield','supercup'=>'SMFA Super Cup','interqualifier'=>'World Cup Qualifiers','worldcup'=>'World Cup'];
            foreach($rows as &$r){
                $action=strtolower(trim((string)$r['sm_action']));
                $parts=explode('|',(string)$r['competition_key']);$country=count($parts)>2&&!in_array($parts[1],['DOMESTIC','INTERNATIONAL','NATIONS'],true)?$parts[1]:null;
                $fallback=in_array($action,['league','playoff'],true)?'Div '.$r['sm_division'].($action==='playoff'?' Playoff':''):($names[$action]??$r['sm_action']);
                $r['nexus_view']=$labels[$r['competition_key']]??(($country?$country.' ':'').$fallback);
            }unset($r);
            $out[$kind]=$rows;
        }catch(Throwable $e){$out[$kind]=[];$out['errors'][$kind]='data_unavailable';}
    }
    nexus_out($out);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'home_error'],500);}
