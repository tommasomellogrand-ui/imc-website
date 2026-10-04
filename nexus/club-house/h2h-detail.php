<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/engine.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require dirname(__DIR__).'/players/media.php';
require dirname(__DIR__).'/h2h/engine.php';
try {
 $scope=(string)($_GET['scope']??'club');if(!in_array($scope,['global','club','national_team'],true))throw new InvalidArgumentException('invalid_scope');
 $c=nexus_config();$core=nexus_db($c,'core');$id=(string)($_GET['manager']??'');$opponent=(string)($_GET['opponent']??'');
 $managers=nexus_rows($core,'SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` ORDER BY full_name');
 $ctx=['managers'=>[],'sm_managers'=>[],'assignments'=>[],'competitions'=>[],'teams'=>[]];
 foreach($managers as $m){$v=['key'=>'imc:'.$m['manager_id'],'manager_id'=>$m['manager_id'],'name'=>$m['full_name'],'image_url'=>null,'sm_manager_id'=>(int)$m['sm_manager_id']];$ctx['managers'][$m['manager_id']]=$v;if($v['sm_manager_id']>0)$ctx['sm_managers'][$v['sm_manager_id']]=$v;}
 if(!isset($ctx['managers'][$id],$ctx['managers'][$opponent])||$id===$opponent)throw new InvalidArgumentException('invalid_managers');
 $worlds=array_values(array_unique(array_filter(explode(',',(string)($_GET['worlds']??'')))));if(!$worlds||count($worlds)>10)throw new InvalidArgumentException('invalid_worlds');
 foreach($worlds as $gw)nexus_world($gw);
 $codex=nexus_rows($core,'SELECT id,name,image_url FROM `IMC Club Codex Global`');$matches=[];$reports=[];
 foreach($worlds as $gw){
  $db=nexus_db($c,nexus_target($c,$gw));
  // Use exactly the same accepted, ID-resolved report fixtures as the Club House cards.
  $bundle=ch_read($db,$gw,$managers,$id,$scope);
  $ids=array_column(array_filter($bundle['matches'],static fn($m)=>$m['opponent_id']===$opponent),'fixture_id');
  $map=nexus_rows($core,'SELECT `Club ID` entity_id,`SM World Club ID` world_id FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]);
  $ctx['teams']['club']=nexus_team_lookup($codex,$map);
  $nationMap=nexus_rows($core,'SELECT `National Team ID` entity_id,`SM World National Club ID` world_id,`SM National Team ID` sm_id FROM `IMC Game World National Team Mapping` WHERE `Game World`=?',[$gw]);
  $ctx['teams']['national_team']=nexus_team_lookup(nexus_rows($core,'SELECT id,name,image_url FROM `IMC National Team Codex Global`'),$nationMap);$ctx['competitions']=[];
  foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $row)$ctx['competitions'][$row['competition_key']]=$row['nexus_view'];
  foreach(array_chunk($ids,300) as $batch){
   $rows=nexus_rows($db,'SELECT * FROM `'.nexus_table($gw,'Match_Report').'` WHERE game_world_id=? AND sm_fixture_id IN ('.implode(',',array_fill(0,count($batch),'?')).')',array_merge([$gw],$batch));
   foreach($rows as &$r){$r['report_fixture']=$r['sm_fixture_id'];$reports[$gw.':'.$r['sm_fixture_id']]=$r;}unset($r);
   foreach(array_merge($scope!=='national_team'?h2h_matches($rows,$ctx,'manager',$id,'club'):[],$scope!=='club'?h2h_matches($rows,$ctx,'manager',$id,'national_team'):[]) as $m){$m['world']=$gw;$m['report_key']=$gw.':'.$m['sm_fixture_id'];$matches[]=$m;}
  }
 }
 usort($matches,static fn($a,$b)=>[$b['match_date'],$b['world'],$b['sm_fixture_id']]<=>[$a['match_date'],$a['world'],$a['sm_fixture_id']]);
 $comparison=h2h_report_comparison($matches,$reports);
 $identities=nexus_player_identity($core,array_merge(array_column($comparison['players']['own'],'player_id'),array_column($comparison['players']['opponent'],'player_id')));
 foreach($comparison['players'] as &$players){foreach($players as &$p){$i=$identities[$p['player_id']]??[];$name=trim((string)($i['full_name']??(($i['forename']??'').' '.($i['surname']??''))));if($name!=='')$p['name']=$name;}unset($p);}unset($players);
 nexus_out(['ok'=>true,'source'=>'Match Report','world'=>$worlds[0],'worlds'=>$worlds,'subject'=>$ctx['managers'][$id],'opponent'=>$ctx['managers'][$opponent],'summary'=>h2h_summary($matches),'home'=>h2h_summary(array_values(array_filter($matches,static fn($m)=>$m['side']==='home'))),'away'=>h2h_summary(array_values(array_filter($matches,static fn($m)=>$m['side']==='away'))),'matches'=>$matches]+$comparison);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){error_log('Club House H2H: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'h2h_detail_unavailable'],500);}
