<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=imc_site_config();$gw=imc_site_world($_GET['world']??'');$season=imc_site_season($_GET['season']??null);$sm=(int)($_GET['sm_club']??0);if($sm<1)throw new InvalidArgumentException('invalid_club');
 $db=imc_site_db($c,imc_site_target($c,$gw));$where='(home_sm_club_id=? OR away_sm_club_id=?)';$p=[$sm,$sm];if(($_GET['type']??'')==='nation')$where.=" AND (competition_group='NATIONS' OR competition_key LIKE '%|NATIONS|%')";else $where.=" AND COALESCE(competition_group,'')<>'NATIONS' AND COALESCE(competition_key,'') NOT LIKE '%|NATIONS|%'";if($season!==null){$where.=' AND imc_season=?';$p[]=$season;}
 $r=imc_site_rows($db,'SELECT * FROM `'.imc_site_table($gw,'Results').'` WHERE '.$where.' ORDER BY match_date DESC,sm_fixture_id DESC',$p);
 $sw='(home_sm_team_id=? OR away_sm_team_id=?)';$sp=[$sm,$sm];if(($_GET['type']??'')==='nation')$sw.=" AND (competition_group='NATIONS' OR competition_key LIKE '%|NATIONS|%')";else $sw.=" AND COALESCE(competition_group,'')<>'NATIONS' AND COALESCE(competition_key,'') NOT LIKE '%|NATIONS|%'";if($season!==null){$sw.=' AND imc_season=?';$sp[]=$season;}
 $s=imc_site_rows($db,'SELECT * FROM `'.imc_site_table($gw,'Schedule').'` WHERE '.$sw.' ORDER BY match_date ASC,match_time ASC,sm_fixture_id ASC',$sp);
 imc_site_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'results'=>$r,'schedule'=>$s]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){imc_site_out(['ok'=>false,'error'=>'team_matches_error'],500);}
