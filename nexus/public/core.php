<?php
declare(strict_types=1);
/** Resolve display labels exclusively from the CORE Nexus mapping.
 * Legacy country/division tokens are normalized for lookup only.
 * Imported competition keys and fixture data remain untouched.
 */
function nexus_apply_catalog_names(array &$catalog,array $mapping,string $world): void {
    $types=[];
    foreach($mapping as $m)if(($m['game_world_id']??'')===$world)$types[(string)$m['world_type']]=true;
    $single=count($types)===1&&isset($types['SINGLE']);
    $key=static function(string $value) use($single): string {
        $parts=explode('|',$value);
        $at=null;
        foreach($parts as $i=>$part)if(in_array($part,['DOMESTIC','INTERNATIONAL','NATIONS'],true)){$at=$i;break;}
        if($at===null||!isset($parts[$at+1]))return $value;
        $group=$parts[$at];$action=$parts[$at+1];$out=[$parts[0]];
        if(!$single&&$group==='DOMESTIC'&&$at>1)$out[]=$parts[1];
        $out[]=$group;$out[]=$action;
        if(in_array($action,['league','playoff'],true)&&isset($parts[$at+2]))$out[]=$parts[$at+2];
        return implode('|',$out);
    };
    $labels=[];
    foreach($mapping as $m){
        if(($m['game_world_id']??'')!==$world||trim((string)($m['nexus_view']??''))==='')continue;
        $labels[$key((string)$m['competition_key'])][(string)$m['nexus_view']]=true;
    }
    foreach($catalog as &$c){
        $names=array_keys($labels[$key((string)($c['competition_key']??''))]??[]);
        $c['nexus_view']=count($names)===1?$names[0]:null;
        $c['name_mapping_status']=count($names)===1?'matched':(count($names)>1?'ambiguous':'missing');
        $c['custom_competition']=$c['nexus_view']??'Nome competizione non configurato';
    }
    unset($c);
}

// Read-only presentation hints: never modify result/schedule IDs or infer by name.
function nexus_report_logo_ids(PDO $db,string $world,array &$rows): void {
    $ids=[];foreach($rows as $r)if(!empty($r['sm_fixture_id'])&&(empty($r['home_sm_club_id']??$r['home_sm_team_id']??null)||empty($r['away_sm_club_id']??$r['away_sm_team_id']??null)))$ids[(string)$r['sm_fixture_id']]=$r['sm_fixture_id'];
    if(!$ids)return;
    $ph=implode(',',array_fill(0,count($ids),'?'));
    $reports=nexus_core_rows($db,"SELECT sm_fixture_id,home_sm_club_id,away_sm_club_id FROM `IMC Site Match Report` WHERE game_world_id=? AND sm_fixture_id IN ($ph)",array_merge([$world],array_values($ids)));
    nexus_apply_logo_hints($rows,$reports);
}
function nexus_apply_logo_hints(array &$rows,array $reports): void {
    $index=[];foreach($reports as $r)foreach(['home','away'] as $side)if(!empty($r[$side.'_sm_club_id']))$index[(string)$r['sm_fixture_id']][$side][(string)$r[$side.'_sm_club_id']]=$r[$side.'_sm_club_id'];
    foreach($rows as &$r)foreach(['home','away'] as $side){$values=$index[(string)($r['sm_fixture_id']??'')][$side]??[];if(empty($r[$side.'_sm_team_id']??$r[$side.'_sm_club_id']??null)&&count($values)===1)$r[$side.'_logo_team_id']=array_values($values)[0];}unset($r);
}
// Only explicit, unambiguous world IDs may identify imported teams.
function nexus_team_index(array $teams): array {
    $index=[];$seen=[];
    foreach($teams as $team){
        $id=(string)($team['sm_team_id']??'');
        if($id===''||$id==='0')continue;
        if(isset($seen[$id])){unset($index[$id]);continue;}
        $seen[$id]=true;$index[$id]=$team;
    }
    return $index;
}
function nexus_core_db(array $cfg): PDO {return new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$cfg['host'],$cfg['port'],$cfg['core']),$cfg['user'],$cfg['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);}
function nexus_core_rows(PDO $db,string $sql,array $params=[]): array {$s=$db->prepare($sql);$s->execute($params);return $s->fetchAll();}
function nexus_worlds(PDO $db): array {return nexus_core_rows($db,"SELECT `IMC GW` game_world_id,`IMC GW Name` world_name,`SM Game World ID` sm_game_world_id,`Active Club` active_clubs,`Country` country FROM `IMC Game World Codex Global` WHERE `IMC GW` BETWEEN 'GW001' AND 'GW010' ORDER BY `IMC GW`");}
function nexus_core_enrich(PDO $db,string $world,string $resource,array &$rows): array {
$worlds=nexus_worlds($db);$worldData=null;foreach($worlds as $w)if($w['game_world_id']===$world)$worldData=$w;
$seasons=nexus_core_rows($db,'SELECT game_world_id,imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season DESC',[$world]);
$clubs=nexus_core_rows($db,'SELECT m.`SM World Club ID` sm_team_id,m.`SM Club ID` sm_global_team_id,m.`Club ID` club_id,c.name,c.image_url FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$world]);
$nations=nexus_core_rows($db,'SELECT m.`SM World National Club ID` sm_team_id,m.`SM National Team ID` sm_global_team_id,m.`National Team ID` national_team_id,c.name,c.image_url FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$world]);
$clubIndex=nexus_team_index($clubs);$nationIndex=nexus_team_index($nations);
$competitions=nexus_core_rows($db,'SELECT id,competition_key,custom_competition,sm_action,sm_action_group,sm_country,sm_division FROM `IMC Competition Codex Global` WHERE game_world_id=?',[$world]);$compIndex=[];foreach($competitions as $c)if($c['competition_key'])$compIndex[$c['competition_key']]=$c;
// One display-name source for every response, including reports and profiles.
$mapping=nexus_core_rows($db,'SELECT game_world_id,world_type,competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$world]);
$display=[];foreach($rows as $r){$key=(string)($r['competition_key']??'');if($key!==''&&!isset($display[$key]))$display[$key]=$compIndex[$key]??['competition_key'=>$key,'sm_action'=>$r['sm_action']??null,'sm_action_group'=>$r['competition_group']??null,'sm_country'=>$r['sm_country']??null,'sm_division'=>$r['sm_division']??null];}
$display=array_values($display);nexus_apply_catalog_names($display,$mapping,$world);
$compIndex=[];foreach($display as $c)$compIndex[$c['competition_key']]=$c;
$countries=[];foreach(nexus_core_rows($db,'SELECT id,name FROM `IMC Country Codex Global`') as $c)$countries[(string)$c['id']]=$c['name'];
$managerIds=[];$playerIds=[];foreach($rows as $r){foreach(['home_sm_manager_id','away_sm_manager_id'] as $f)if(!empty($r[$f]))$managerIds[(string)$r[$f]]=$r[$f];if(!empty($r['player_id']))$playerIds[(string)$r['player_id']]=$r['player_id'];}
$managers=[];if($managerIds){$ph=implode(',',array_fill(0,count($managerIds),'?'));foreach(nexus_core_rows($db,"SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` WHERE sm_manager_id IN ($ph)",array_values($managerIds)) as $m)$managers[(string)$m['sm_manager_id']]=$m;}
$assignments=nexus_core_rows($db,'SELECT manager_id,team_id,national_team_id,assignment_type,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=?',[$world]);
$players=[];if($playerIds){$ph=implode(',',array_fill(0,count($playerIds),'?'));foreach(nexus_core_rows($db,"SELECT p.id,p.forename,p.surname,p.image_url,d.nationality,d.position,d.rating,d.age,d.market_value,d.updated_at,rc.id real_club_id,rc.name real_club_name,rc.image_url real_club_image FROM `IMC Player Codex Global` p LEFT JOIN `IMC Player Codex Global Data` d ON d.player_id=p.id LEFT JOIN `IMC Club Codex Global` rc ON rc.id=d.soccerwiki_club_id WHERE p.id IN ($ph)",array_values($playerIds)) as $p)$players[(string)$p['id']]=$p;}
foreach($rows as &$r){$national=in_array(strtoupper((string)($r['competition_group']??'')),['NATIONS','NATIONAL'],true);$index=$national?$nationIndex:$clubIndex;foreach(['home','away'] as $side){$id=$r[$side.'_sm_team_id']??$r[$side.'_sm_club_id']??$r[$side.'_logo_team_id']??null;$r[$side.'_core']=$id===null?null:($index[(string)$id]??null);$r[$side.'_manager_core']=$managers[(string)($r[$side.'_sm_manager_id']??'')]??null;if($r[$side.'_manager_core']&&empty($r[$side.'_manager_name']))$r[$side.'_manager_name']=$r[$side.'_manager_core']['full_name'];}foreach(['from','to'] as $side)$r[$side.'_core']=$clubIndex[(string)($r[$side.'_sm_world_club_id']??'')]??null;$r['competition_core']=$compIndex[$r['competition_key']??'']??null;$r['country_name']=$countries[(string)($r['sm_country']??'')]??null;$r['player_core']=$players[(string)($r['player_id']??'')]??null;$r['club_core']=$clubIndex[(string)($r['current_sm_club_id']??$r['sm_club_id']??'')]??null;$p=$r['player_core'];$r['real_club_core']=!empty($p['real_club_id'])?['id'=>$p['real_club_id'],'name'=>$p['real_club_name'],'image_url'=>$p['real_club_image']]:null;$r['imc_season']=null;$date=$r['match_date']??$r['transfer_date']??null;if($date)foreach($seasons as $s)if($s['imc_season_start_date']&&$date>=$s['imc_season_start_date']&&(!$s['imc_season_end_date']||$date<=$s['imc_season_end_date'])){$r['imc_season']=$s['imc_season'];break;}}unset($r);
return ['source'=>'MYSQL_ARUBA_CORE','world'=>$worldData,'seasons'=>$seasons,'assignments'=>$assignments];}

function nexus_normalize_national_assignments(array &$assignments,array $nations): void {
    foreach($assignments as &$a){
        $raw=$a['national_team_id']??null;if($raw===null||$raw==='')continue;
        $matches=[];foreach($nations as $n)foreach(['id','sm_team_id','sm_global_team_id'] as $field){
            if(isset($n[$field])&&(string)$n[$field]===(string)$raw){$matches[(string)$n['id']]=$n;break;}
        }
        if(count($matches)!==1)continue;
        $n=array_values($matches)[0];$a['source_national_team_id']=$raw;$a['national_team_id']=$n['id'];$a['team_id']=null;$a['team_name']=$n['name'];$a['assignment_type']='national_team';
    }unset($a);
}

function nexus_world_directory(PDO $db,string $world): array {
$empty=[];$context=nexus_core_enrich($db,$world,'results',$empty);
$context['clubs']=nexus_core_rows($db,'SELECT m.`Club ID` id,COALESCE(c.name,m.`Club Name`) name,c.image_url,m.`SM World Club ID` sm_team_id,m.`SM Club ID` sm_global_team_id FROM `IMC Game World Club Mapping` m LEFT JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=? ORDER BY name',[$world]);
$context['managers']=nexus_core_rows($db,"SELECT a.manager_id,COALESCE(gcm.`Club ID`,a.team_id) team_id,a.national_team_id,COALESCE(mc.full_name,a.full_name) full_name,COALESCE(cc.name,gcm.`Club Name`,nc.name,a.team_name) team_name,a.assignment_type,a.start_date,a.end_date FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Manager Codex Global` mc ON mc.manager_id=a.manager_id LEFT JOIN `IMC Game World Club Mapping` gcm ON gcm.`Game World`=a.game_world_id AND a.national_team_id IS NULL AND (CAST(gcm.`Club ID` AS CHAR)=CAST(a.team_id AS CHAR) OR CAST(gcm.`SM Club ID` AS CHAR)=CAST(a.team_id AS CHAR) OR LOWER(TRIM(gcm.`Club Name`))=LOWER(TRIM(a.team_name))) LEFT JOIN `IMC Club Codex Global` cc ON cc.id=gcm.`Club ID` LEFT JOIN `IMC Game World National Team Mapping` gnm ON gnm.`Game World`=a.game_world_id AND gnm.`National Team ID`=a.national_team_id LEFT JOIN `IMC National Team Codex Global` nc ON nc.id=gnm.`National Team ID` WHERE a.game_world_id=? ORDER BY full_name,a.start_date DESC",[$world]);
$context['competitions']=nexus_core_rows($db,'SELECT id,competition_key,custom_competition,sm_action,sm_action_group,sm_country,sm_division FROM `IMC Competition Codex Global` WHERE game_world_id=? ORDER BY sm_action_group,sm_country,sm_division,sm_action',[$world]);
$mapping=nexus_core_rows($db,'SELECT game_world_id,world_type,competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$world]);
nexus_apply_catalog_names($context['competitions'],$mapping,$world);
$context['nations']=nexus_core_rows($db,'SELECT m.`National Team ID` id,c.name,c.image_url,m.`SM World National Club ID` sm_team_id,m.`SM National Team ID` sm_global_team_id FROM `IMC Game World National Team Mapping` m LEFT JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=? ORDER BY c.name',[$world]);nexus_normalize_national_assignments($context['managers'],$context['nations']);return $context;}

