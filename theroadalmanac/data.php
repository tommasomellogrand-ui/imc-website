<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/core/bootstrap.php';
require dirname(__DIR__).'/nexus/trophies/engine.php';
require __DIR__.'/engine.php';
try {
    $gw='GW001'; $c=nexus_config(); $core=nexus_db($c,'core'); $db=nexus_db($c,nexus_target($c,$gw));
    $seasons=nexus_rows($core,'SELECT imc_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season',[$gw]);
    $mapping=nexus_rows($core,'SELECT `Club Name`,`SM World Club ID` FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]);
    $teams=[];
    foreach(nexus_rows($core,'SELECT m.`SM World Club ID` world_id,m.`Club Name` name,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]) as $t)$teams['club:'.$t['world_id']]=$t;
    foreach(nexus_rows($core,'SELECT m.`SM World National Club ID` world_id,m.`National Team Name` name,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$gw]) as $t)$teams['nation:'.$t['world_id']]=$t;
    $managers=[];
    foreach(nexus_rows($core,'SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global`') as $m)$managers[$m['manager_id']]=$m;
    $assignments=nexus_rows($core,'SELECT game_world_id,manager_id,assignment_type,team_id,national_team_id,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=?',[$gw]);
    $labels=[];
    foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $l)$labels[$l['competition_key']]=$l['nexus_view'];
    $results=nexus_rows($db,'SELECT * FROM `GW001_IMC_Results` WHERE game_world_id=? AND imc_season IS NOT NULL ORDER BY match_date,sm_fixture_id',[$gw]);
    [$results]=trophy_resolve_ids($results,[],[],$mapping);
    $catalog=[]; $matches=[]; $seen=[]; $unknown=0;
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    foreach($results as $r){
        $key=(string)$r['competition_key']; $season=(int)$r['imc_season'];
        if($key===''||$season<1)continue;
        $scope=rth_scope($r); $name=rth_label($r,$labels);
        $catalog[$season.'|'.$key]=['season'=>$season,'key'=>$key,'name'=>$name,'scope'=>$scope,'action'=>$r['sm_action'],'division'=>$r['sm_division'],'custom'=>false];
        $custom=($r['sm_action']??'')==='imc_custom'||str_starts_with($key,'GW001_IMC_');
        $awarded=$custom&&strtoupper(trim((string)($r['result_status']??'')))==='AWARDED'&&isset($r['home_score'],$r['away_score'])&&!empty($r['match_date'])&&$r['match_date']<=$today;
        if(!trophy_finished($r,$today)&&!$awarded)continue;
        $fixture=(string)($r['sm_fixture_id']??'');
        if($custom&&($fixture===''||$fixture==='0'))$fixture='custom:'.hash('sha256',json_encode([$season,$key,$r['match_date'],$r['competition_round']??'',(string)($r['home_sm_club_id']??$r['home_name']),(string)($r['away_sm_club_id']??$r['away_name'])]));
        if($fixture==='' ||isset($seen[$fixture]))continue; $seen[$fixture]=true;
        $m=['id'=>$fixture,'season'=>$season,'key'=>$key,'scope'=>$scope,'awarded'=>$awarded,'date'=>substr((string)$r['match_date'],0,10),'home_score'=>(int)$r['home_score'],'away_score'=>(int)$r['away_score']];
        foreach(['home','away'] as $side){
            $id=(string)($r[$side.'_sm_club_id']??''); $m[$side.'_id']=$id!==''&&$id!=='0'?$id:'name:'.$r[$side.'_name'];
            $m[$side.'_name']=$teams[$scope.':'.$id]['name']??$r[$side.'_name'];
            $manager=rth_manager($r,$side,$assignments,$managers); $m[$side.'_manager']=$manager;
            if($manager===null)$unknown++;
        }
        $matches[]=$m;
    }
    $cups=json_decode(file_get_contents(dirname(__DIR__).'/nexus/competitions/imc-cups.json'),true,512,JSON_THROW_ON_ERROR);
    foreach($cups as $cup){
        if($cup['world']!==$gw)continue;
        $key=$cup['key'];$season=(int)$cup['season'];
        $catalog[$season.'|'.$key]=['season'=>$season,'key'=>$key,'name'=>$cup['name'],'scope'=>'club','action'=>$cup['format']==='league'?'league':'cup','division'=>null,'custom'=>true];
        $cupTeams=array_column($cup['teams'],'team_name','team_id');
        foreach($cup['matches'] as $r){
            if(!is_int($r['homeScore'])||!is_int($r['awayScore'])||$r['homeScore']<0||$r['awayScore']<0||$r['date']>$today)continue;
            $m=['id'=>'imc:'.$r['id'],'season'=>$season,'key'=>$key,'scope'=>'club','date'=>$r['date'],'home_score'=>$r['homeScore'],'away_score'=>$r['awayScore']];
            foreach(['home','away'] as $side){$id=(string)$r[$side.'_id'];$m[$side.'_id']=$id;$m[$side.'_name']=$teams['club:'.$id]['name']??$cupTeams[$id];$m[$side.'_manager']=rth_manager(['game_world_id'=>$gw,'match_date'=>$r['date'],$side.'_sm_club_id'=>$id],$side,$assignments,$managers);if($m[$side.'_manager']===null)$unknown++;}
            $matches[]=$m;
        }
    }
    $reportStats=[];
    foreach(nexus_rows($db,'SELECT sm_fixture_id,team_stats_json FROM `GW001_IMC_Match_Report` WHERE game_world_id=?',[$gw]) as $r){
        $stats=json_decode((string)$r['team_stats_json'],true);
        if(is_array($stats))$reportStats[(string)$r['sm_fixture_id']]=$stats;
    }
    foreach($matches as &$match)$match['team_stats']=$reportStats[$match['id']]??null;
    unset($match);
    // Trophy Room is Nexus's historical authority; do not re-derive or overwrite past winners.
    $awards=[];
    foreach(nexus_rows($db,'SELECT * FROM `GW001_IMC_Trophy_Room` WHERE game_world_id=? ORDER BY imc_season DESC,won_date DESC,id',[$gw]) as $a){
        $scope=rth_scope($a);$id=(string)$a['winner_sm_world_club_id'];
        $manager=trophy_manager_at_win($a,$assignments);
        $key=$a['competition_key'];$season=(int)$a['imc_season'];
        $catalog[$season.'|'.$key]??=['season'=>$season,'key'=>$key,'name'=>rth_label($a,$labels),'scope'=>$scope,'action'=>$a['trophy_type'],'division'=>$a['sm_division'],'custom'=>false];
        $awards[]=['season'=>$season,'key'=>$key,'scope'=>$scope,'name'=>rth_label($a,$labels),'winner_id'=>$id,'winner'=>$teams[$scope.':'.$id]['name']??$a['winner_name'],'manager'=>$manager&&isset($managers[$manager])?$manager:null,'date'=>$a['won_date'],'type'=>$a['trophy_type']];
    }
    $publicManagers=[];
    foreach($matches as $m)foreach(['home','away'] as $side){$id=$m[$side.'_manager'];if($id!==null)$publicManagers[$id]=$managers[$id]['full_name'];}
    foreach($awards as $a)if($a['manager']!==null)$publicManagers[$a['manager']]=$managers[$a['manager']]['full_name'];
    nexus_out(['ok'=>true,'world'=>$gw,'generated_at'=>gmdate('c'),'seasons'=>$seasons,'competitions'=>array_values($catalog),'teams'=>$teams,'managers'=>$publicManagers,'matches'=>$matches,'awards'=>$awards,'unknown_manager_appearances'=>$unknown]);
}catch(Throwable $e){error_log('RTH Almanac: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'almanac_unavailable'],503);}
