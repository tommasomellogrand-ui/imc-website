<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/engine.php';
require __DIR__.'/national-results.php';
require __DIR__.'/ranking.php';
require dirname(__DIR__).'/trophies/engine.php';
try {
 $c=nexus_config();$core=nexus_db($c,'core');
 $managers=nexus_rows($core,'SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` ORDER BY full_name');
 if(empty($_GET['world'])){
  $worlds=nexus_rows($core,'SELECT `IMC GW` id,`IMC GW Name` name FROM `IMC Game World Codex Global` ORDER BY `IMC GW`');
  nexus_out(['ok'=>true,'managers'=>$managers,'worlds'=>array_values(array_filter($worlds,fn($w)=>preg_match('/^GW00[1-9]$|^GW010$/',$w['id']))),'source'=>'Match Report · solo club']);
 }
 $gw=nexus_world($_GET['world']);$selected=trim((string)($_GET['manager']??''));
 if($selected!==''&&!in_array($selected,array_column($managers,'manager_id'),true))throw new InvalidArgumentException('Manager IMC non trovato.');
 $selected=$selected===''?null:$selected;
 $trophyView=($_GET['view']??'')==='trophies';
 $managerNames=array_column($managers,'full_name','manager_id');
 $scope=(string)($_GET['scope']??'club');if(!in_array($scope,['global','club','national_team'],true))throw new InvalidArgumentException('Scope non valido.');
 $db=nexus_db($c,nexus_target($c,$gw));$db->exec('SET TRANSACTION READ ONLY');$db->beginTransaction();
 $assignments=nexus_rows($core,"SELECT game_world_id,manager_id,full_name,assignment_type,team_id,team_name,national_team_id,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=?",[$gw]);
 $nationMapping=nexus_rows($core,'SELECT m.`National Team ID` entity_id,m.`SM World National Club ID` world_id,m.`SM National Team ID` sm_id,c.name,c.image_url logo FROM `IMC Game World National Team Mapping` m JOIN `IMC National Team Codex Global` c ON c.id=m.`National Team ID` WHERE m.`Game World`=?',[$gw]);
 $resultsCareer=($_GET['source']??'')==='results';
 if($resultsCareer){$out=ch_results_read($db,$gw,$managers,$selected,$scope);}else{
 $club=ch_read($db,$gw,$managers,$selected,'club');$out=$club;
 if($scope!=='club'){
  $nation=ch_national_read($db,$gw,$managers,$selected,$assignments,$nationMapping);
  $out=$scope==='national_team'?$nation:ch_scope_merge($club,$nation);unset($out['accepted_results']);
 }
 }
 $out['ranking_error']=false;$out['national_ranking_error']=false;
 $rankingResults=['club'=>['stats'=>[],'coverage'=>null],'national'=>['stats'=>[],'coverage'=>null]];
 try{$rankingResults=imc_rank_results_read($db,$gw,$managers);}catch(Throwable $e){$out['ranking_error']=true;$out['national_ranking_error']=true;error_log('Ranking Results '.$gw.': '.$e->getMessage());}
 $out['ranking_source']='Results';$out['ranking_coverage']=$rankingResults['club']['coverage'];$out['national_ranking_coverage']=$rankingResults['national']['coverage'];
 foreach($out['managers'] as $id=>&$m){$m['ranking_club_stats']=$rankingResults['club']['stats'][$id]??ch_zero();$m['national_stats']=$rankingResults['national']['stats'][$id]??ch_zero();$m['ranking']=imc_rank_start($m['ranking_club_stats'],$gw,$m['national_stats']);}unset($m);
 // Display-only club logos: use existing world mappings, never create clubs.
 $out['clubs']=[];
 if($selected!==null||$trophyView)try {
  $clubRows=nexus_rows($core,'SELECT m.`SM World Club ID` world_id,c.image_url logo FROM `IMC Game World Club Mapping` m JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]);
  $clubGroups=[];foreach($clubRows as $club)if((int)$club['world_id']>0)$clubGroups[(string)$club['world_id']][]=$club;
  foreach($clubGroups as $id=>$items)if(count($items)===1)$out['clubs'][$id]=['logo'=>$items[0]['logo']];
 }catch(Throwable $e){error_log('Club House display logos '.$gw.': '.$e->getMessage());}
 $out['nations']=[];
 if($selected!==null||$trophyView)try {
  foreach($nationMapping as $n){
   foreach(['world_id','sm_id'] as $key)if((int)$n[$key]>0)$out['nations'][(string)$n[$key]]=['logo'=>$n['logo'],'world_id'=>$n['world_id'],'name'=>$n['name']];
  }
 }catch(Throwable $e){error_log('Club House national flags '.$gw.': '.$e->getMessage());}
 // Trophies retain award-date attribution. National matches use tenure dates; club matches use report IDs.
 $out['trophy_error']=false;
 try {
  if($selected!==null)$out['assignments']=array_values(array_filter($assignments,fn($a)=>$a['manager_id']===$selected&&($scope==='global'||$a['assignment_type']===$scope)));
  $codex=[];foreach($managers as $m)if((int)($m['sm_manager_id']??0)>0)$codex[(string)$m['sm_manager_id']]=$m['manager_id'];
  $nationalManagers=[];
  foreach(nexus_rows($db,'SELECT sm_fixture_id,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score FROM `'.$gw.'_IMC_Match_Report` WHERE game_world_id=? AND competition_group=?',[$gw,'NATIONS']) as $r){
   $home=(int)($r['home_score']??0);$away=(int)($r['away_score']??0);$ph=$r['penalty_home_score']??null;$pa=$r['penalty_away_score']??null;
   $side=($ph!==null&&$pa!==null&&(int)$ph!==(int)$pa)?((int)$ph>(int)$pa?'home':'away'):($home!==$away?($home>$away?'home':'away'):null);
   if($side===null)continue;$sm=(string)($r[$side.'_sm_manager_id']??'');if(isset($codex[$sm]))$nationalManagers[(string)$r['sm_fixture_id']]=$codex[$sm];
  }
  foreach(nexus_rows($db,'SELECT * FROM `'.$gw.'_IMC_Trophy_Room` WHERE game_world_id=?',[$gw]) as $t){
   $isNation=($t['competition_group']??'')==='NATIONS'||strtolower((string)($t['trophy_type']??''))==='worldcup';
   if(isset($_GET['scope'])&&$scope!=='global'&&$isNation!==($scope==='national_team'))continue;
   $id=trophy_manager_at_win($t,$assignments,$nationalManagers);if($id===null||!isset($out['managers'][$id]))continue;$out['managers'][$id]['trophies']++;
   imc_rank_award($out['managers'][$id]['ranking'],$t);
   if($selected===$id||($trophyView&&$selected===null))$out['trophies'][]=['trophy_type'=>$t['trophy_type']??null,'division'=>$t['sm_division']??null,'manager_id'=>$id,'manager_name'=>$managerNames[$id]??$id,'world'=>$gw,'season'=>$t['imc_season'],'date'=>$t['won_date'],'competition'=>($t['nexus_view']??'')?:$t['competition_key'],'team'=>$t['winner_name'],'country'=>$t['sm_country']??null,'scope'=>$isNation?'national_team':'club','team_id'=>$t['winner_sm_world_club_id']??null,'fixture_id'=>$t['deciding_fixture_id']??null];
  }
 }catch(Throwable $e){$out['trophy_error']=true;error_log('Club House trophies '.$gw.': '.$e->getMessage());}
 $source=$resultsCareer?'Results':($scope==='club'?'Match Report':($scope==='national_team'?'Results':'Club: Match Report; Nations: Results'));
 $db->commit();nexus_out(['ok'=>true,'world'=>$gw,'source'=>$source,'scope'=>$scope,'generated_at'=>gmdate('c')]+$out);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}
catch(Throwable $e){error_log('Club House: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'Dati Club House temporaneamente non disponibili.'],500);}
