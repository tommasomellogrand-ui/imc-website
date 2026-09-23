<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$sm=(int)($_GET['sm_manager']??0);if($sm<1)throw new InvalidArgumentException('invalid_manager');
 $db=nexus_db($c,nexus_target($c,$gw));$w='game_world_id=? AND (home_sm_manager_id=? OR away_sm_manager_id=?)';$p=[$gw,$sm,$sm];if($season!==null){$w.=' AND imc_season=?';$p[]=$season;}
 $rows=nexus_rows($db,'SELECT sm_fixture_id,home_sm_manager_id,away_sm_manager_id,home_score,away_score FROM `'.nexus_table($gw,'Results').'` WHERE '.$w.' AND home_score IS NOT NULL AND away_score IS NOT NULL',$p);
 $s=['played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0];$seen=[];foreach($rows as $r){$id=(string)$r['sm_fixture_id'];if(isset($seen[$id]))continue;$seen[$id]=1;$home=(int)$r['home_sm_manager_id']===$sm;$gf=(int)($home?$r['home_score']:$r['away_score']);$ga=(int)($home?$r['away_score']:$r['home_score']);$s['played']++;$s['gf']+=$gf;$s['ga']+=$ga;if($gf>$ga)$s['won']++;elseif($gf<$ga)$s['lost']++;else$s['drawn']++;}$s['gd']=$s['gf']-$s['ga'];nexus_out(['ok'=>true,'stats'=>$s]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'manager_stats_error'],500);}
