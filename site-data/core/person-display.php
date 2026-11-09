<?php
declare(strict_types=1);
function imc_person_display_name(string $name): string {
 if(!function_exists('mb_strtolower')) return $name;
 return preg_replace_callback("/(^|[\\s'’\\p{Pd}])(\\p{L})/u",
  static fn($m)=>$m[1].mb_strtoupper($m[2],'UTF-8'),mb_strtolower($name,'UTF-8')) ?? $name;
}
function imc_person_display_fields(array $row):array {
 foreach($row as $key=>&$v){
  if(is_array($v)){$v=imc_person_display_fields($v);continue;}
  if(!is_string($v)||$v==='')continue;
  if(in_array($key,['full_name','forename','surname','player_name','manager_name','home_manager_name','away_manager_name','scorer_name','assistant_name','manager_full_name','player_full_name'],true) ||
    (in_array($key,['name','display_name'],true) && (isset($row['sm_player_id'])||isset($row['player_id'])||isset($row['manager_id'])&&!isset($row['team_id'])&&!isset($row['club_id'])))){
    $v=imc_person_display_name($v);
  }
 }
 unset($v);return $row;
}
