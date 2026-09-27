<?php
declare(strict_types=1);

function nexus_team_name_key(string $name): string {
  $name=html_entity_decode(trim($name),ENT_QUOTES|ENT_HTML5,'UTF-8');
  $name=strtr($name,['À'=>'a','Á'=>'a','Â'=>'a','Ã'=>'a','Ä'=>'a','Å'=>'a','à'=>'a','á'=>'a','â'=>'a','ã'=>'a','ä'=>'a','å'=>'a','È'=>'e','É'=>'e','Ê'=>'e','Ë'=>'e','è'=>'e','é'=>'e','ê'=>'e','ë'=>'e','Ì'=>'i','Í'=>'i','Î'=>'i','Ï'=>'i','ì'=>'i','í'=>'i','î'=>'i','ï'=>'i','Ò'=>'o','Ó'=>'o','Ô'=>'o','Õ'=>'o','Ö'=>'o','ò'=>'o','ó'=>'o','ô'=>'o','õ'=>'o','ö'=>'o','Ù'=>'u','Ú'=>'u','Û'=>'u','Ü'=>'u','ù'=>'u','ú'=>'u','û'=>'u','ü'=>'u','Ç'=>'c','ç'=>'c','Ñ'=>'n','ñ'=>'n']);
  $name=function_exists('mb_strtolower')?mb_strtolower($name,'UTF-8'):strtolower($name);
  return preg_replace('/[^\p{L}\p{N}]+/u','',$name)??'';
}

function nexus_team_lookup(array $codex,array $mapping): array {
  $lookup=['id'=>[],'name'=>[],'world'=>[],'entity_world'=>[]];
  foreach($codex as $club){
    $id=(int)$club['id'];$lookup['id'][$id]=$club;
    $name=nexus_team_name_key((string)$club['name']);
    if($name!==''){
      // Never guess between two clubs with the same normalized name.
      if(array_key_exists($name,$lookup['name'])&&$lookup['name'][$name]!==$id)$lookup['name'][$name]=null;
      else $lookup['name'][$name]=$id;
    }
  }
  foreach($mapping as $m){
    $world=(int)$m['world_id'];$id=(int)$m['entity_id'];
    if($world>0){$lookup['world'][$world]=$id;$lookup['entity_world'][$id]=$world;}
  }
  return $lookup;
}

function nexus_match_team_details(array $row,string $side,array $teams,array $managers,array $assignments): array {
  $nation=($row['competition_group']??'')==='NATIONS'||strpos((string)($row['competition_key']??''),'|NATIONS|')!==false;
  $kind=$nation?'national_team':'club';$lookup=$teams[$kind];
  $world=(int)($row[$side.'_sm_club_id']??$row[$side.'_sm_team_id']??0);
  $id=$lookup['world'][$world]??null;
  if($id===null)$id=$lookup['name'][nexus_team_name_key((string)($row[$side.'_name']??''))]??null;
  $club=$id!==null?($lookup['id'][$id]??null):null;
  $logo=(string)($club['image_url']??'');
  if(!preg_match('~^(?:https://|/(?!/))~i',$logo))$logo='';
  $sm=(int)($row[$side.'_sm_manager_id']??0);
  $manager=$sm>0?($managers[$sm]??null):null;
  // A recorded external manager must not be replaced by a current IMC assignment.
  if($sm<1){
    if($world<1&&$id!==null)$world=(int)($lookup['entity_world'][$id]??0);
    $day=substr((string)($row['match_date']??''),0,10);
    if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$day))$day=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    foreach($assignments[$kind][$world]??[] as $a){
      if(($a['start_date']===null||$a['start_date']<=$day)&&($a['end_date']===null||$a['end_date']>=$day)){$manager=$a;break;}
    }
  }
  return ['logo_url'=>$logo?:null,'imc_manager_id'=>$manager['manager_id']??null,'imc_manager_name'=>$manager['full_name']??null];
}

function nexus_enrich_match_teams(PDO $core,string $gw,array $rows): array {
  if(!$rows)return [];
  $clubMapping=nexus_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]);
  $nationalMapping=nexus_rows($core,'SELECT `National Team ID` entity_id,`SM World National Club ID` world_id FROM `IMC Game World National Team Mapping` WHERE `Game World`=?',[$gw]);
  $teams=[
    'club'=>nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),$clubMapping),
    'national_team'=>nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC National Team Codex Global`'),$nationalMapping)
  ];
  $managers=[];
  foreach(nexus_rows($core,'SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global`') as $m){if((int)$m['sm_manager_id']>0)$managers[(int)$m['sm_manager_id']]=$m;}
  $assignments=[];
  $sql='SELECT a.assignment_type,a.team_id,a.national_team_id,a.start_date,a.end_date,m.manager_id,m.full_name FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=? ORDER BY a.start_date DESC,a.id DESC';
  foreach(nexus_rows($core,$sql,[$gw]) as $a){$kind=$a['assignment_type'];$world=(int)($kind==='national_team'?$a['national_team_id']:$a['team_id']);if($world>0)$assignments[$kind][$world][]=$a;}
  foreach($rows as &$row){foreach(['home','away'] as $side){foreach(nexus_match_team_details($row,$side,$teams,$managers,$assignments) as $field=>$value)$row[$side.'_'.$field]=$value;}}unset($row);
  return $rows;
}
