<?php
declare(strict_types=1);

// Presentation only: called after all joins, identity resolution and aggregation.
// Never rewrite stored names, identifiers, JSON reports or free-form editorial text.
function nexus_club_label_key(string $name): string {
    $name=html_entity_decode(trim($name),ENT_QUOTES|ENT_HTML5,'UTF-8');
    $name=preg_replace('/\s+/u',' ',$name)??$name;
    return function_exists('mb_strtolower')?mb_strtolower($name,'UTF-8'):strtolower($name);
}
function nexus_club_label_index(array $clubs,array $mapping): array {
    $out=['clubs'=>[],'world'=>[],'names'=>[],'world_names'=>[]];
    $add=static function(array &$index,string $name,int $id): void {
        $key=nexus_club_label_key($name);if($key==='')return;
        if(array_key_exists($key,$index)&&$index[$key]!==$id)$index[$key]=null;
        else $index[$key]=$id;
    };
    foreach($clubs as $c){
        $id=(int)$c['id'];$out['clubs'][$id]=trim((string)($c['nexus_view']??''));
        $add($out['names'],(string)$c['name'],$id);
    }
    foreach($mapping as $m){
        $gw=(string)$m['game_world_id'];$world=(int)$m['world_id'];$id=(int)$m['entity_id'];
        $out['world'][$gw]??=[];$out['world_names'][$gw]??=[];
        if($world>0){
            if(array_key_exists($world,$out['world'][$gw])&&$out['world'][$gw][$world]!==$id)$out['world'][$gw][$world]=null;
            else $out['world'][$gw][$world]=$id;
        }
        $add($out['world_names'][$gw],(string)$m['name'],$id);
    }
    return $out;
}
function nexus_club_label(string $original,array $index,string $gw='',mixed $worldId=null,mixed $entityId=null): string {
    $id=(int)$entityId;
    if($id>0&&array_key_exists($id,$index['clubs']))return $index['clubs'][$id]!==''?$index['clubs'][$id]:$original;
    $world=(int)$worldId;
    if($world>0&&array_key_exists($world,$index['world'][$gw]??[])){
        $id=$index['world'][$gw][$world];
        return $id!==null&&($index['clubs'][$id]??'')!==''?$index['clubs'][$id]:$original;
    }
    $key=nexus_club_label_key($original);
    $names=$index['world_names'][$gw]??[];
    $id=array_key_exists($key,$names)?$names[$key]:($index['names'][$key]??null);
    return $id!==null&&($index['clubs'][$id]??'')!==''?$index['clubs'][$id]:$original;
}
function nexus_club_label_scope(array $row,bool $inherited): bool {
    // Explicit row/competition scope takes precedence over a mixed parent payload.
    foreach(['competition_key','competition'] as $key)if(is_string($row[$key]??null)&&str_contains($row[$key],'|'))return str_contains($row[$key],'|NATIONS|');
    foreach(['competition_group','assignment_type','scope','type','kind'] as $key){
        $value=strtolower((string)($row[$key]??''));
        if(in_array($value,['nations','nation','national_team','worldcup','world cup','interqualifier'],true))return true;
        if(in_array($value,['club','clubs','domestic','international'],true))return false;
    }
    if(in_array(strtolower((string)($row['sm_action']??$row['trophy_type']??'')),['worldcup','world cup','interqualifier'],true))return true;
    return $inherited;
}
function nexus_club_labels_payload(array $row,array $index,string $gw='',bool $national=false,string $container=''): array {
    foreach(['game_world_id','world'] as $field)if(is_string($row[$field]??null)&&preg_match('/^GW\d{3}$/',$row[$field])){$gw=$row[$field];break;}
    $national=nexus_club_label_scope($row,$national);
    $label=static function(string $field,mixed $world=null,mixed $entity=null)use(&$row,$index,$gw): void {
        if(isset($row[$field])&&is_string($row[$field]))$row[$field]=nexus_club_label($row[$field],$index,$gw,$world,$entity);
    };
    if(!$national){
        foreach(['home','away'] as $side){
            $label($side.'_name',$row[$side.'_sm_club_id']??$row[$side.'_sm_team_id']??null);
            // Matchday's last encounter stores home/away as labels instead of objects.
            $label($side);
        }
        $teamId=$row['team_id']??$row['world_team_id']??$row['sm_world_team_id']??$row['world_id']??null;
        foreach(['team_name','team','assignment_name'] as $field)$label($field,$teamId);
        $label('opponent_team',$row['opponent_team_id']??null);
        $label('winner_name',$row['winner_sm_world_club_id']??null);
        $label('club_name',isset($row['sm_fixture_id'])?($row['club_id']??null):null,isset($row['sm_fixture_id'])?null:($row['club_id']??null));
        if(isset($row['gf'],$row['ga']))$label('opponent');
        // Only known team objects may expose a generic name; never players/managers.
        $key=(string)($row['key']??'');
        $teamObject=isset($row['world_id'])||isset($row['entity_id'])||str_starts_with($key,'team:')||str_starts_with($key,'core:')||str_starts_with($key,'name:')||in_array($container,['club','teams','standings','home_table','away_table'],true);
        if($teamObject){
            $world=$row['world_id']??(str_starts_with($key,'team:')?substr($key,5):($container==='club'?null:($row['id']??null)));
            $entity=$row['entity_id']??(str_starts_with($key,'core:')?substr($key,5):($container==='club'?($row['id']??null):null));
            $label('name',$world,$entity);
        }
        if(isset($row['clubs'])&&is_array($row['clubs'])&&array_is_list($row['clubs']))foreach($row['clubs'] as &$club)if(is_string($club))$club=nexus_club_label($club,$index,$gw);unset($club);
    }
    // These are always clubs, including players on a national-team roster.
    $label('current_club',$row['current_sm_club_id']??null);
    $label('real_club');$label('soccerwiki_club_name');
    foreach(['from','to'] as $side)$label('club_'.$side,$row[$side.'_sm_world_club_id']??null);
    foreach($row as $field=>&$child){
        if(!is_array($child))continue;
        // Numeric list entries retain the collection's semantic context.
        $next=is_int($field)?$container:(string)$field;
        $child=nexus_club_labels_payload($child,$index,$gw,$national,$next);
    }unset($child);
    return $row;
}
function nexus_club_display(array $body,array $query=[]): array {
    $gw=is_string($query['world']??null)?$query['world']:'';
    $worlds=[];
    if(preg_match('/^GW\d{3}$/',$gw))$worlds[$gw]=true;
    $collect=static function(array $row)use(&$collect,&$worlds): void {
        foreach(['world','game_world_id'] as $field)if(is_string($row[$field]??null)&&preg_match('/^GW\d{3}$/',$row[$field]))$worlds[$row[$field]]=true;
        foreach($row as $value)if(is_array($value))$collect($value);
    };
    $collect($body);
    $core=nexus_db(nexus_config(),'core');
    $clubs=nexus_rows($core,'SELECT id,name,nexus_view FROM `IMC Club Codex Global`');
    $mapping=[];
    if($worlds){
        $slots=implode(',',array_fill(0,count($worlds),'?'));
        $mapping=nexus_rows($core,'SELECT `Game World` game_world_id,`Club ID` entity_id,`SM World Club ID` world_id,`Club Name` name FROM `IMC Game World Club Mapping` WHERE `Game World` IN ('.$slots.')',array_keys($worlds));
    }
    $national=nexus_club_label_scope($query,false);
    return nexus_club_labels_payload($body,nexus_club_label_index($clubs,$mapping),$gw,$national);
}
