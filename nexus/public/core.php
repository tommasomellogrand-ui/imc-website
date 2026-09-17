<?php
declare(strict_types=1);
function nexus_core_db(array $cfg): PDO {
    return new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$cfg['host'],$cfg['port'],$cfg['core']),$cfg['user'],$cfg['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
}
function nexus_core_rows(PDO $db,string $sql,array $params=[]): array {$s=$db->prepare($sql);$s->execute($params);return $s->fetchAll();}
function nexus_worlds(PDO $db): array {return nexus_core_rows($db,"SELECT `IMC GW` game_world_id,`IMC GW Name` world_name,`SM Game World ID` sm_game_world_id,`Active Club` active_clubs,`Country` country FROM `IMC Game World Codex Global` WHERE `IMC GW` BETWEEN 'GW001' AND 'GW010' ORDER BY `IMC GW`");}
function nexus_core_enrich(PDO $db,string $world,string $resource,array &$rows): array {
    $worlds=nexus_worlds($db);$worldData=null;foreach($worlds as $w)if($w['game_world_id']===$world)$worldData=$w;
    $seasons=nexus_core_rows($db,'SELECT game_world_id,imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season DESC',[$world]);
    $clubs=nexus_core_rows($db,'SELECT m.`SM Club ID` sm_team_id,m.`Club ID` club_id,c.name,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$world]);
    $nations=nexus_core_rows($db,'SELECT m.`SM National Team ID` sm_team_id,m.`National Team ID` national_team_id,c.name,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$world]);
    $clubIndex=[];$nationIndex=[];foreach($clubs as $c)$clubIndex[(string)$c['sm_team_id']]=$c;foreach($nations as $c)$nationIndex[(string)$c['sm_team_id']]=$c;
    $competitions=nexus_core_rows($db,'SELECT id,competition_key,custom_competition,sm_action,sm_action_group,sm_country,sm_division FROM `IMC Competition Codex Global` WHERE game_world_id=?',[$world]);
    $compIndex=[];foreach($competitions as $c)if($c['competition_key'])$compIndex[$c['competition_key']]=$c;
    $countries=[];foreach(nexus_core_rows($db,'SELECT id,name FROM `IMC Country Codex Global`') as $c)$countries[(string)$c['id']]=$c['name'];
    $managerIds=[];$playerIds=[];foreach($rows as $r){foreach(['home_sm_manager_id','away_sm_manager_id'] as $f)if(!empty($r[$f]))$managerIds[(string)$r[$f]]=$r[$f];if(!empty($r['player_id']))$playerIds[(string)$r['player_id']]=$r['player_id'];}
    $managers=[];if($managerIds){$ph=implode(',',array_fill(0,count($managerIds),'?'));foreach(nexus_core_rows($db,"SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` WHERE sm_manager_id IN ($ph)",array_values($managerIds)) as $m)$managers[(string)$m['sm_manager_id']]=$m;}
    $assignments=nexus_core_rows($db,'SELECT manager_id,team_id,national_team_id,assignment_type,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=?',[$world]);
    $players=[];if($playerIds){$ph=implode(',',array_fill(0,count($playerIds),'?'));foreach(nexus_core_rows($db,"SELECT p.id,p.forename,p.surname,p.image_url,d.nationality,d.position,d.rating,d.age,d.updated_at FROM `IMC Player Codex Global` p LEFT JOIN `IMC Player Codex Global Data` d ON d.player_id=p.id WHERE p.id IN ($ph)",array_values($playerIds)) as $p)$players[(string)$p['id']]=$p;}
    foreach($rows as &$r){
        $national=in_array(strtoupper((string)($r['competition_group']??'')),['NATIONS','NATIONAL'],true);
        $index=$national?$nationIndex:$clubIndex;
        foreach(['home','away'] as $side){
            $id=$r[$side.'_sm_team_id']??$r[$side.'_sm_club_id']??null;
            $r[$side.'_core']=$id===null?null:($index[(string)$id]??null);
            $r[$side.'_manager_core']=$managers[(string)($r[$side.'_sm_manager_id']??'')]??null;
            if($r[$side.'_manager_core'])$r[$side.'_manager_name']=$r[$side.'_manager_core']['full_name'];
        }
        foreach(['from','to'] as $side)$r[$side.'_core']=$clubIndex[(string)($r[$side.'_sm_world_club_id']??'')]??null;
        $r['competition_core']=$compIndex[$r['competition_key']??'']??null;
        $r['country_name']=$countries[(string)($r['sm_country']??'')]??null;
        $r['player_core']=$players[(string)($r['player_id']??'')]??null;
        $r['imc_season']=null;$date=$r['match_date']??$r['transfer_date']??null;
        if($date)foreach($seasons as $s)if($s['imc_season_start_date']&&$date>=$s['imc_season_start_date']&&(!$s['imc_season_end_date']||$date<=$s['imc_season_end_date'])){$r['imc_season']=$s['imc_season'];break;}
    }unset($r);
    return ['source'=>'MYSQL_ARUBA_CORE','world'=>$worldData,'seasons'=>$seasons,'assignments'=>$assignments];
}
function nexus_world_directory(PDO $db,string $world): array {
    $empty=[];$context=nexus_core_enrich($db,$world,'results',$empty);
    $context['clubs']=nexus_core_rows($db,'SELECT m.`Club ID` id,COALESCE(c.name,m.`Club Name`) name,c.image_url,m.`SM Club ID` sm_team_id FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=? ORDER BY name',[$world]);
    $context['managers']=nexus_core_rows($db,'SELECT a.manager_id,COALESCE(m.full_name,a.full_name) full_name,a.team_name,a.assignment_type,a.start_date,a.end_date FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=? ORDER BY full_name,a.start_date DESC',[$world]);
    $context['competitions']=nexus_core_rows($db,'SELECT id,competition_key,custom_competition,sm_action,sm_action_group,sm_country,sm_division FROM `IMC Competition Codex Global` WHERE game_world_id=? ORDER BY sm_action_group,sm_country,sm_division,sm_action',[$world]);
    return $context;
}
