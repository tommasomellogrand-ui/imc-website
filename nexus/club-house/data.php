<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/engine.php';
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
 $db=nexus_db($c,nexus_target($c,$gw));$db->exec('SET TRANSACTION READ ONLY');$db->beginTransaction();
 $out=ch_read($db,$gw,$managers,$selected);
 foreach($out['managers'] as &$m)$m['ranking']=imc_rank_start($m['stats'],$gw);unset($m);
 // Display-only club logos: use existing world mappings, never create clubs.
 $out['clubs']=[];
 if($selected!==null)try {
  $clubRows=nexus_rows($core,'SELECT m.`SM World Club ID` world_id,c.image_url logo FROM `IMC Game World Club Mapping` m JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`=?',[$gw]);
  $clubGroups=[];foreach($clubRows as $club)if((int)$club['world_id']>0)$clubGroups[(string)$club['world_id']][]=$club;
  foreach($clubGroups as $id=>$items)if(count($items)===1)$out['clubs'][$id]=['logo'=>$items[0]['logo']];
 }catch(Throwable $e){error_log('Club House display logos '.$gw.': '.$e->getMessage());}
 // Only trophies keep the existing award-date attribution; matches use report IDs exclusively.
 $out['trophy_error']=false;
 try {
  $assignments=nexus_rows($core,"SELECT game_world_id,manager_id,assignment_type,team_id,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=? AND assignment_type='club'",[$gw]);
  foreach(nexus_rows($db,'SELECT * FROM `'.$gw.'_IMC_Trophy_Room` WHERE game_world_id=?',[$gw]) as $t){
   $id=trophy_manager_at_win($t,$assignments);if($id===null||!isset($out['managers'][$id]))continue;$out['managers'][$id]['trophies']++;
   imc_rank_award($out['managers'][$id]['ranking'],$t);
   if($selected===$id)$out['trophies'][]=['world'=>$gw,'season'=>$t['imc_season'],'date'=>$t['won_date'],'competition'=>($t['nexus_view']??'')?:$t['competition_key'],'team'=>$t['winner_name'],'country'=>$t['sm_country']??null];
  }
 }catch(Throwable $e){$out['trophy_error']=true;error_log('Club House trophies '.$gw.': '.$e->getMessage());}
 $db->commit();nexus_out(['ok'=>true,'world'=>$gw,'source'=>'Match Report','scope'=>'club','generated_at'=>gmdate('c')]+$out);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}
catch(Throwable $e){error_log('Club House: '.$e->getMessage());nexus_out(['ok'=>false,'error'=>'Dati Club House temporaneamente non disponibili.'],500);}
