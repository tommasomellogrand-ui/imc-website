<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require dirname(__DIR__).'/players/media.php';
require __DIR__.'/engine.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$kind=(string)($_GET['kind']??'club');$id=trim((string)($_GET['id']??''));
 if(!in_array($kind,['club','manager'],true)||($kind==='club'&&(!ctype_digit($id)||(int)$id<1))||($kind==='manager'&&!preg_match('/^MNG\d+$/',$id)))throw new InvalidArgumentException('invalid_subject');
 $scope=$kind==='manager'?(string)($_GET['scope']??'club'):'club';if(!in_array($scope,['club','national_team'],true))throw new InvalidArgumentException('invalid_scope');
 $opponent=trim((string)($_GET['opponent']??''));$competition=trim((string)($_GET['competition']??''));$venue=(string)($_GET['venue']??'');if(!in_array($venue,['','home','away'],true))throw new InvalidArgumentException('invalid_venue');
 $core=nexus_db($c,'core');$db=nexus_db($c,nexus_target($c,$gw));
 $clubMap=nexus_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]);
 $nationMap=nexus_rows($core,'SELECT `National Team ID` entity_id,`SM World National Club ID` world_id,`SM National Team ID` sm_id FROM `IMC Game World National Team Mapping` WHERE `Game World`=?',[$gw]);
 $ctx=['teams'=>['club'=>nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`'),$clubMap),'national_team'=>nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC National Team Codex Global`'),$nationMap)],'managers'=>[],'sm_managers'=>[],'assignments'=>[],'competitions'=>[]];
 foreach(nexus_rows($core,'SELECT sm_manager_id,manager_name FROM `EXT Manager Codex Global`') as $m){$sm=(int)$m['sm_manager_id'];if($sm>0)$ctx['sm_managers'][$sm]=['key'=>'sm:'.$sm,'name'=>$m['manager_name'],'sm_manager_id'=>$sm,'image_url'=>null];}
 foreach(nexus_rows($core,'SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global`') as $m){$item=['key'=>'imc:'.$m['manager_id'],'manager_id'=>$m['manager_id'],'name'=>$m['full_name'],'sm_manager_id'=>(int)$m['sm_manager_id'],'image_url'=>null];$ctx['managers'][$m['manager_id']]=$item;if($item['sm_manager_id']>0)$ctx['sm_managers'][$item['sm_manager_id']]=$item;}
 $nationAliases=[];foreach($nationMap as $n)foreach(['entity_id','world_id','sm_id'] as $f){if((int)$n[$f]>0)$nationAliases[(int)$n[$f]]=(int)$n['world_id'];}
 $assigned=[];
 foreach(nexus_rows($core,'SELECT manager_id,assignment_type,team_id,national_team_id,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=?',[$gw]) as $a){
  $type=$a['assignment_type'];if(!in_array($type,['club','national_team'],true))continue;
  $team=(int)($type==='club'?$a['team_id']:$a['national_team_id']);if($type==='national_team')$team=$nationAliases[$team]??$team;
  if($team>0){$ctx['assignments'][$type][$team][]=$a;if($a['manager_id']===$id&&$type===$scope)$assigned[]=$team;}
 }
 foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $m)$ctx['competitions'][$m['competition_key']]=$m['nexus_view'];
 if($kind==='manager'){$subject=$ctx['managers'][$id]??null;if(!$subject)throw new InvalidArgumentException('manager_not_found');}
 else{$entity=$ctx['teams']['club']['world'][(int)$id]??null;$club=$ctx['teams']['club']['id'][$entity]??null;if(!$club)throw new InvalidArgumentException('club_not_found');$subject=['key'=>'team:'.$id,'name'=>$club['name'],'image_url'=>nexus_player_image_url($club['image_url']??null)];}
 $rt=nexus_table($gw,'Results');$mt=nexus_table($gw,'Match_Report');$params=[$gw];$conditions=[];
 if($kind==='club'){
  $conditions[]='(r.home_sm_club_id=? OR r.away_sm_club_id=?)';$params[]=(int)$id;$params[]=(int)$id;
  // Exact codex name is only a fallback for rows whose world club ID is missing.
  $conditions[]='((r.home_sm_club_id IS NULL OR r.home_sm_club_id=0) AND r.home_name=?)';$params[]=$subject['name'];
  $conditions[]='((r.away_sm_club_id IS NULL OR r.away_sm_club_id=0) AND r.away_name=?)';$params[]=$subject['name'];
 }else{
  $sm=$subject['sm_manager_id'];if($sm>0){$conditions[]='(r.home_sm_manager_id=? OR r.away_sm_manager_id=? OR mr.home_sm_manager_id=? OR mr.away_sm_manager_id=?)';array_push($params,$sm,$sm,$sm,$sm);}
  $assigned=array_values(array_unique($assigned));if($assigned){$slots=implode(',',array_fill(0,count($assigned),'?'));$conditions[]='(r.home_sm_club_id IN ('.$slots.') OR r.away_sm_club_id IN ('.$slots.'))';array_push($params,...$assigned,...$assigned);}
 }
 $sql='SELECT r.*,mr.sm_fixture_id report_fixture,mr.home_sm_manager_id report_home_sm_manager_id,mr.away_sm_manager_id report_away_sm_manager_id,mr.home_manager_name report_home_manager_name,mr.away_manager_name report_away_manager_name FROM `'.$rt.'` r LEFT JOIN `'.$mt.'` mr ON mr.game_world_id=r.game_world_id AND mr.sm_fixture_id=r.sm_fixture_id WHERE r.game_world_id=? AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL AND ('.($conditions?implode(' OR ',$conditions):'0=1').') ORDER BY r.match_date DESC,r.sm_fixture_id DESC';
 $matches=h2h_matches(nexus_rows($db,$sql,$params),$ctx,$kind,$id,$scope);
 $competitions=[];foreach($matches as $m)$competitions[(string)$m['competition_key']]=$m['competition_name'];
 $matches=array_values(array_filter($matches,static fn($m)=>($competition===''||(string)$m['competition_key']===$competition)&&($venue===''||$m['side']===$venue)));
 $base=['ok'=>true,'world'=>$gw,'kind'=>$kind,'scope'=>$scope,'subject'=>$subject,'generated_at'=>gmdate('c')];
 if($opponent===''){$result=h2h_overview($matches);$result['competitions']=$competitions;nexus_out(array_merge($base,$result));}
 $matches=array_values(array_filter($matches,static fn($m)=>$m['opponent']['key']===$opponent));$reports=[];
 foreach(array_chunk(array_column($matches,'sm_fixture_id'),400) as $ids){foreach(nexus_rows($db,'SELECT sm_fixture_id,team_stats_json,players_json FROM `'.$mt.'` WHERE game_world_id=? AND sm_fixture_id IN ('.implode(',',array_fill(0,count($ids),'?')).')',array_merge([$gw],$ids)) as $r)$reports[(string)$r['sm_fixture_id']]=$r;}
 $comparison=h2h_report_comparison($matches,$reports);
 $ids=array_merge(array_column($comparison['players']['own'],'player_id'),array_column($comparison['players']['opponent'],'player_id'));$identities=nexus_player_identity($core,$ids);
 foreach($comparison['players'] as &$players){foreach($players as &$p){$i=$identities[$p['player_id']]??[];$name=trim((string)($i['full_name']??(($i['forename']??'').' '.($i['surname']??''))));if($name!=='')$p['name']=$name;}unset($p);}unset($players);
 nexus_out(array_merge($base,['opponent'=>$matches[0]['opponent']??null,'summary'=>h2h_summary($matches),'home'=>h2h_summary(array_values(array_filter($matches,static fn($m)=>$m['side']==='home'))),'away'=>h2h_summary(array_values(array_filter($matches,static fn($m)=>$m['side']==='away'))),'matches'=>$matches],$comparison));
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'h2h_error'],500);}
