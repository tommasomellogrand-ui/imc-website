<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
 $c=nexus_config();$core=nexus_db($c,'core');$gw=isset($_GET['world'])&&$_GET['world']!==''?nexus_world($_GET['world']):null;$season=nexus_season($_GET['season']??null);
 $w=[];$p=[];if($gw){$w[]='game_world_id=?';$p[]=$gw;}if($season!==null){$w[]='imc_season=?';$p[]=$season;}$sql='SELECT * FROM `IMC Trophy Room`'.($w?' WHERE '.implode(' AND ',$w):'').' ORDER BY game_world_id,imc_season';$rows=nexus_rows($core,$sql,$p);nexus_out(['ok'=>true,'rows'=>$rows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'trophies_error'],500);}
