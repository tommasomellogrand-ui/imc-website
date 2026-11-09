<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$season=imc_site_season($_GET['season']??null);$sm=(int)($_GET['sm_club']??0);if($sm<1)throw new InvalidArgumentException('invalid_club');
 $db=imc_site_db($c,imc_site_target($c,$gw));$w='(home_sm_club_id=? OR away_sm_club_id=?)';$p=[$sm,$sm];$w.=" AND COALESCE(competition_group,'')<>'NATIONS' AND COALESCE(competition_key,'') NOT LIKE '%|NATIONS|%'";if($season!==null){$w.=' AND imc_season=?';$p[]=$season;}
 $rows=imc_site_rows($db,'SELECT sm_fixture_id,home_sm_club_id,away_sm_club_id,home_score,away_score FROM `'.imc_site_table($gw,'Results').'` WHERE '.$w.' AND home_score IS NOT NULL AND away_score IS NOT NULL',$p);
 $s=['played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0];$seen=[];
 foreach($rows as $r){$id=(string)$r['sm_fixture_id'];if($id!==''){if(isset($seen[$id]))continue;$seen[$id]=1;}$home=(int)$r['home_sm_club_id']===$sm;$gf=(int)($home?$r['home_score']:$r['away_score']);$ga=(int)($home?$r['away_score']:$r['home_score']);$s['played']++;$s['gf']+=$gf;$s['ga']+=$ga;if($gf>$ga)$s['won']++;elseif($gf<$ga)$s['lost']++;else$s['drawn']++;}
 $s['gd']=$s['gf']-$s['ga'];imc_site_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'stats'=>$s]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'team_stats_error'],500);}
