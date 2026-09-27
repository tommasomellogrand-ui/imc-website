<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Transfers');
 $club=null;if(isset($_GET['sm_club'])){$value=(string)$_GET['sm_club'];if(!ctype_digit($value)||(int)$value<1)throw new InvalidArgumentException('invalid_club');$club=(int)$value;}
 $w=['game_world_id=?'];$p=[$gw];if($season!==null){$w[]='imc_season=?';$p[]=$season;}if($club!==null){$w[]='(from_sm_world_club_id=? OR to_sm_world_club_id=?)';$p[]=$club;$p[]=$club;}$rows=nexus_rows($db,'SELECT * FROM `'.$table.'` WHERE '.implode(' AND ',$w).' ORDER BY (normalized_transfer_date IS NULL) ASC, normalized_transfer_date DESC, imc_transfer_number DESC'.($club===null?' LIMIT 2000':''),$p);
 nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'transfers_error'],500);}
