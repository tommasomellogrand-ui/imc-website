<?php
declare(strict_types=1);
require __DIR__.'/../imc-universal-gateway/core.php';
require __DIR__.'/../imc-universal-gateway/ingress.php';
require __DIR__.'/../imc-universal-gateway/write.php';
function check(bool $ok): void { if (!$ok) throw new RuntimeException('routing assertion failed'); }
function rejects(callable $fn): void { try { $fn(); } catch (InvalidArgumentException $e) { return; } throw new RuntimeException('invalid route accepted'); }
// Synthetic configurations test both families; these are not production assignments.
$repos=['IMC Results'=>'IMC_Results','IMC Schedule'=>'IMC_Schedule','IMC Match Report'=>'IMC_Match_Report','IMC Transfer'=>'IMC_Transfers','IMC Player Codex'=>'IMC_Player_Codex','IMC SM Player Stats'=>'IMC_SM_Player_Stats'];
foreach (['gold','custom'] as $family) {
  $cfg=['db'=>['core'=>'core','gold'=>'gold','custom'=>'custom'],'gold_worlds'=>[],'custom_worlds'=>[]];
  for ($n=1;$n<=15;$n++) $cfg[$family.'_worlds'][]=sprintf('GW%03d',$n);
  foreach ($cfg[$family.'_worlds'] as $gw) {
    check(imc_route(['game_world_id'=>$gw],$cfg)['database']===$family);
    foreach ($repos as $repo=>$suffix) {
      $body=['game_world_id'=>$gw,'repository'=>$repo,'target_database'=>$family,'target_table'=>$gw.'_'.$suffix];
      check(imc_explicit_import_route($body,$cfg)['database']===$family);
      check(imc_ingress_route($body,$cfg)['database']===$family);
      check(imc_ident($body['target_table'])===chr(96).$body['target_table'].chr(96));
      $bad=$body; $bad['target_database']=$family==='gold'?'custom':'gold';
      rejects(fn()=>imc_explicit_import_route($bad,$cfg));
      rejects(fn()=>imc_ingress_route($bad,$cfg));
      $bad=$body; $bad['target_table']=($gw==='GW001'?'GW002':'GW001').'_'.$suffix;
      rejects(fn()=>imc_explicit_import_route($bad,$cfg));
      rejects(fn()=>imc_ingress_route($bad,$cfg));
    }
    check(imc_transfer_table($gw.'_IMC_Transfers'));
  }
  foreach (['GW000','GW016','GW025','GW15','GW015x'] as $gw) {
    $body=['game_world_id'=>$gw,'repository'=>'IMC Transfer','target_database'=>$family,'target_table'=>$gw.'_IMC_Transfers'];
    rejects(fn()=>imc_route($body,$cfg));
    rejects(fn()=>imc_explicit_import_route($body,$cfg));
    rejects(fn()=>imc_ingress_route($body,$cfg));
  }
}
$cfg['gold_worlds']=[]; $cfg['custom_worlds']=[];
rejects(fn()=>imc_route(['game_world_id'=>'GW015'],$cfg));
echo "PASS: GW001-GW015, six repositories, both families; wrong targets and unsupported worlds rejected.\n";

$production=require __DIR__.'/../__imc_private_gateway/config.php';
check(imc_route(['game_world_id'=>'GW010'],$production)['database']==='Sql1956795_3');
foreach (range(11,15) as $n) {
  $gw=sprintf('GW%03d',$n);
  rejects(fn()=>imc_route(['game_world_id'=>$gw],$production));
  rejects(fn()=>imc_explicit_import_route(['game_world_id'=>$gw,'repository'=>'IMC Transfer','target_database'=>'Sql1956795_3','target_table'=>$gw.'_IMC_Transfers'],$production));
  rejects(fn()=>imc_ingress_route(['game_world_id'=>$gw,'target_database'=>'Sql1956795_3','target_table'=>$gw.'_IMC_Transfers'],$production));
}
echo "PASS: production GW010 Custom; GW011-GW015 pending.\n";
