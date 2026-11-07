<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
try {
    $config=nexus_config();
    $core=nexus_db($config,'core');
    $db=nexus_db($config,nexus_target($config,$gw));
    $assignments=nexus_rows($core,"SELECT a.manager_id,m.full_name,a.team_id,a.assignment_type,a.start_date,a.end_date,
        COALESCE(NULLIF(c.nexus_view,''),c.name,n.name,a.team_name) assignment_name,
        COALESCE(c.image_url,n.image_url) image_url
        FROM `IMC Manager Assignment Global` a
        JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id
        LEFT JOIN `IMC Game World Club Mapping` cm ON a.assignment_type='club' AND cm.`Game World`=a.game_world_id AND cm.`SM World Club ID`=a.team_id
        LEFT JOIN `IMC Club Codex Global` c ON c.id=cm.`Club ID`
        LEFT JOIN `IMC Game World National Team Mapping` nm ON a.assignment_type='national_team' AND nm.`Game World`=a.game_world_id AND nm.`SM World National Club ID`=a.national_team_id
        LEFT JOIN `IMC National Team Codex Global` n ON n.id=nm.`National Team ID`
        WHERE a.game_world_id=? ORDER BY m.full_name,a.start_date DESC,a.id DESC",[$gw]);
    $today=(new DateTimeImmutable('today',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    $current=nexus_rows($core,'SELECT imc_season FROM `IMC Game World Season` WHERE game_world_id=? AND imc_season_start_date<=? ORDER BY imc_season_start_date DESC LIMIT 1',[$gw,$today]);
    $season=(int)($current[0]['imc_season']??0);
    $history=[];$divisions=[];
    foreach(['Results'=>'club','Schedule'=>'team'] as $repo=>$field){
        $table=nexus_table($gw,$repo);
        $fixtures=nexus_rows($db,"SELECT imc_season,sm_division,home_sm_{$field}_id home,away_sm_{$field}_id away,MIN(match_date) first_day,MAX(match_date) last_day FROM `$table` WHERE game_world_id=? AND sm_action='league' AND sm_division>0 GROUP BY imc_season,sm_division,home_sm_{$field}_id,away_sm_{$field}_id",[$gw]);
        foreach($fixtures as $r){
            $s=(int)$r['imc_season'];$d=(int)$r['sm_division'];
            $divisions[$s][$d]=true;
            foreach([$r['home'],$r['away']] as $team)if($team)$history[$team][$s][$d]=true;
        }
    }
    if(!$season && $divisions)$season=max(array_keys($divisions));
    $seasons=nexus_rows($core,'SELECT imc_season,imc_season_start_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season_start_date',[$gw]);
    foreach($assignments as &$a){
        $s=$season;
        if($a['end_date'] && $a['end_date']<$today){
            $s=0;foreach($seasons as $row)if($row['imc_season_start_date'] && $row['imc_season_start_date']<=$a['end_date'])$s=(int)$row['imc_season'];
        }
        $ds=array_keys($history[$a['team_id']][$s]??[]);
        $a['division']=$a['assignment_type']==='club' && count($ds)===1?(int)$ds[0]:null;
    }
    unset($a);
    $numbers=array_keys($divisions[$season]??[]);sort($numbers,SORT_NUMERIC);
    nexus_out(['ok'=>true,'world'=>$gw,'divisions'=>$numbers,'assignments'=>$assignments]);
} catch(Throwable $e){error_log('World roster '.$gw.': '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'manager_directory_unavailable'],503);}
