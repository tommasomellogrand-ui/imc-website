<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$sm=(int)($_GET['sm_club']??0);if($sm<1)throw new InvalidArgumentException('invalid_club');
 $db=nexus_db($c,nexus_target($c,$gw));$where='game_world_id=? AND (home_sm_club_id=? OR away_sm_club_id=?)';$p=[$gw,$sm,$sm];if($season!==null){$where.=' AND imc_season=?';$p[]=$season;}
 $r=nexus_rows($db,'SELECT * FROM `'.nexus_table($gw,'Results').'` WHERE '.$where.' ORDER BY match_date DESC,sm_fixture_id DESC',$p);
 $sw='game_world_id=? AND (home_sm_team_id=? OR away_sm_team_id=?)';$sp=[$gw,$sm,$sm];if($season!==null){$sw.=' AND imc_season=?';$sp[]=$season;}
 $s=nexus_rows($db,'SELECT * FROM `'.nexus_table($gw,'Schedule').'` WHERE '.$sw.' ORDER BY match_date ASC,match_time ASC,sm_fixture_id ASC',$sp);
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'results'=>$r,'schedule'=>$s]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'team_matches_error'],500);}
