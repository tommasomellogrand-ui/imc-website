<?php
declare(strict_types=1);
require __DIR__.'/../imc-universal-gateway/core.php';
require __DIR__.'/../imc-universal-gateway/ingress.php';
require __DIR__.'/../imc-universal-gateway/write.php';
function check(bool $ok): void { if (!$ok) throw new RuntimeException('routing assertion failed'); }
function rejects(callable $fn): void { try { $fn(); } catch (InvalidArgumentException $e) { return; } throw new RuntimeException('invalid route accepted'); }
// Synthetic configurations test both families; these are not production assignments.
$repos=['IMC Results'=>'IMC Results','IMC Schedule'=>'IMC Schedule','IMC Match Report'=>'IMC Match Report','IMC Transfer'=>'IMC Transfers','IMC Player Codex'=>'IMC Player Codex','IMC SM Player Stats'=>'IMC SM Player Stats'];
foreach (['gold','custom'] as $family) {
  $cfg=['db'=>['core'=>'core','gold'=>'gold','custom'=>'custom'],'gold_worlds'=>[],'custom_worlds'=>[]];
  for ($n=1;$n<=15;$n++) $cfg[$family.'_worlds'][]=sprintf('GW%03d',$n);
  foreach ($cfg[$family.'_worlds'] as $gw) {
    check(imc_route(['game_world_id'=>$gw],$cfg)['database']===$family);
    foreach ($repos as $repo=>$suffix) {
      $body=['game_world_id'=>$gw,'repository'=>$repo,'target_database'=>$family,'target_table'=>$gw.'_'.$suffix];
      check(imc_explicit_import_route($body,$cfg)['database']===$family);
      check(imc_ingress_route($body,$cfg)['database']===$family);
      check(imc_ident($body['target_table'])==='\x60'.$body['target_table'].'\x60');
      $bad=$body; $bad['target_database']=$family==='gold'?'custom':'gold';
      rejects(fn()=>imc_explicit_import_route($bad,$cfg));
      rejects(fn()=>imc_ingress_route($bad,$cfg));
      $bad=$body; $bad['target_table']=($gw==='GW001'?'GW002':'GW001').'_'.$suffix;
      rejects(fn()=>imc_explicit_import_route($bad,$cfg));
      rejects(fn()=>imc_ingress_route($bad,$cfg));
    }
    check(imc_transfer_table($gw.'_IMC Transfers'));
  }
  foreach (['GW000','GW016','GW025','GW15','GW015x'] as $gw) {
    $body=['game_world_id'=>$gw,'repository'=>'IMC Transfer','target_database'=>$family,'target_table'=>$gw.'_IMC Transfers'];
    rejects(fn()=>imc_route($body,$cfg));
    rejects(fn()=>imc_explicit_import_route($body,$cfg));
    rejects(fn()=>imc_ingress_route($body,$cfg));
  }
}
$cfg['gold_worlds']=[]; $cfg['custom_worlds']=[];
rejects(fn()=>imc_route(['game_world_id'=>'GW015'],$cfg));
echo "PASS: GW001-GW015, six repositories, both families; wrong targets and unsupported worlds rejected.\n";
