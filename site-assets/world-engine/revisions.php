<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/site-data/core/bootstrap.php';
$configurations=require __DIR__.'/worlds.php';
$worlds=array_map(static fn(array $config):string=>$config[0],$configurations);
try{
 $slug=(string)($_GET['world']??'');if(!isset($worlds[$slug]))throw new InvalidArgumentException('invalid_world');
 $world=$worlds[$slug];$partition=explode('_',imc_site_table($world,'Results'))[0];
 $config=imc_site_config();$db=imc_site_db($config,imc_site_target($config,$world));$core=imc_site_db($config,'core');
 $revisions=[];
 foreach(imc_site_rows($db,'SELECT repository,revision FROM IMC_Site_Revisions WHERE world_id=?',[$partition]) as $row)$revisions['world:'.$row['repository']]=(string)$row['revision'];
 foreach(imc_site_rows($core,"SELECT repository,revision FROM IMC_Site_Revisions WHERE world_id='core'") as $row)$revisions['core:'.$row['repository']]=(string)$row['revision'];
 imc_site_out(['ok'=>true,'world'=>$slug,'revisions'=>$revisions]);
}catch(InvalidArgumentException $e){imc_site_out(['ok'=>false,'error'=>'invalid_world'],422);}
catch(Throwable $e){error_log('World revisions: '.$e->getMessage());imc_site_out(['ok'=>false,'error'=>'revisions_unavailable'],503);}
