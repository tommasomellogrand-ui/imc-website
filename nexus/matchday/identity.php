<?php
declare(strict_types=1);

// Resolve only missing world-club IDs. Never overwrite an ID or guess an
// ambiguous name; national teams have a separate identity space.
function md_is_club(array $r): bool {
 return strpos((string)($r['competition_key']??''),'|NATIONS|')===false
  && !in_array($r['sm_action']??'', ['worldcup','worldcupqualifying'],true);
}
function md_identity_index(array $mapped,array $rows): array {
 $names=[];
 foreach($mapped as $m){$id=(int)($m['world_id']??0);$key=nexus_team_name_key((string)($m['name']??''));if($id>0&&$key!=='')$names[$key][$id]=true;}
 foreach($rows as $r){if(!md_is_club($r))continue;foreach(['home','away'] as $s){$id=(int)($r[$s.'_sm_club_id']??$r[$s.'_sm_team_id']??0);$key=nexus_team_name_key((string)($r[$s.'_name']??''));if($id>0&&$key!=='')$names[$key][$id]=true;}}
 $index=[];foreach($names as $key=>$ids)if(count($ids)===1)$index[$key]=(int)array_key_first($ids);
 return $index;
}
function md_resolve_identities(array $rows,array $index): array {
 foreach($rows as &$r){if(!md_is_club($r))continue;foreach(['home','away'] as $s){
  $id=(int)($r[$s.'_sm_club_id']??$r[$s.'_sm_team_id']??0);if($id>0)continue;
  $key=nexus_team_name_key((string)($r[$s.'_name']??''));if(isset($index[$key]))$r[$s.'_sm_club_id']=$index[$key];
 }}unset($r);return $rows;
}
function md_report_identities(array $reports,array $results): array {
 $fixtures=[];foreach($results as $r)$fixtures[(string)$r['sm_fixture_id']]=$r;
 foreach($reports as &$r){$f=$fixtures[(string)$r['sm_fixture_id']]??null;if(!$f)continue;
  foreach(['home','away'] as $s)if((int)($r[$s.'_sm_club_id']??0)<1&&(int)($f[$s.'_sm_club_id']??0)>0)$r[$s.'_sm_club_id']=(int)$f[$s.'_sm_club_id'];
 }unset($r);return $reports;
}
