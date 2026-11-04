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
      check(imc_ident($body['target_table'])===chr(96).imc_physical_table($body['target_table']).chr(96));
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
check(imc_route(['game_world_id'=>'GW011'],$production)['database']==='Sql1956795_3');
foreach ($repos as $repo=>$suffix) {
  $body=['game_world_id'=>'GW011','repository'=>$repo,'target_database'=>'Sql1956795_3','target_table'=>'GW011_'.$suffix];
  check(imc_explicit_import_route($body,$production)['database']==='Sql1956795_3');
  check(imc_ingress_route($body,$production)['database']==='Sql1956795_3');
  $body['target_database']='Sql1956795_2';
  rejects(fn()=>imc_explicit_import_route($body,$production));
  rejects(fn()=>imc_ingress_route($body,$production));
}
foreach (range(12,15) as $n) {
  $gw=sprintf('GW%03d',$n);
  rejects(fn()=>imc_route(['game_world_id'=>$gw],$production));
  rejects(fn()=>imc_explicit_import_route(['game_world_id'=>$gw,'repository'=>'IMC Transfer','target_database'=>'Sql1956795_3','target_table'=>$gw.'_IMC_Transfers'],$production));
  rejects(fn()=>imc_ingress_route(['game_world_id'=>$gw,'target_database'=>'Sql1956795_3','target_table'=>$gw.'_IMC_Transfers'],$production));
}
echo "PASS: production GW010-GW011 Custom; GW012-GW015 pending.\n";

$catalog=[];
foreach (['GW001','GW004','GW005','GW006','GW009','GW010','GW011'] as $i=>$gw) $catalog[]=['legacy_id'=>$gw,'imc_id'=>sprintf('IMC-%03d',$i+1)];
foreach ($catalog as $entry) {
  foreach ([$entry['legacy_id'],$entry['imc_id']] as $input) {
    foreach ($repos as $repo=>$suffix) {
      $body=['game_world_id'=>$input,'repository'=>$repo,'target_database'=>'Sql1956795_3','target_table'=>$input.'_'.$suffix,'where'=>['game_world_id'=>$input],'rows'=>[['game_world_id'=>$input,'fingerprint'=>'original','sm_fixture_id'=>'123']]];
      $normalized=imc_normalize_world_request($body,$production,'IMPORT',$catalog);
      check($normalized['IMC_WORLD_ID']===$entry['imc_id']);
      check($normalized['rows'][0]['game_world_id']===$entry['legacy_id']);
      check($normalized['where']['game_world_id']===$entry['legacy_id']);
      check($normalized['rows'][0]['fingerprint']==='original');
      check($normalized['rows'][0]['sm_fixture_id']==='123');
      check(imc_ingress_route($normalized,$production)['table']===$entry['legacy_id'].'_'.$suffix);
      check(imc_explicit_import_route($normalized,$production)['table']===$entry['legacy_id'].'_'.$suffix);
      check(imc_route($normalized,$production)['database']==='Sql1956795_3');
    }
  }
}
foreach (['GW002','GW003','GW007','GW008','IMC-008','IMC-009','IMC-010','IMC-999','IMC000'] as $input) rejects(fn()=>imc_normalize_world_request(['game_world_id'=>$input],$production,'IMPORT',$catalog));
rejects(fn()=>imc_normalize_world_request(['game_world_id'=>'IMC-002','rows'=>[['game_world_id'=>'IMC-001']]],$production,'IMPORT',$catalog));
rejects(fn()=>imc_normalize_world_request(['game_world_id'=>'IMC-002','target_table'=>'GW001_IMC_Results'],$production,'IMPORT',$catalog));
check(imc_normalize_world_request(['game_world_id'=>'GW002'],$production,'CHATGPT',$catalog)['game_world_id']==='GW002');
echo "PASS: seven CORE aliases, legacy custom imports, payload/filter translation, preserved fingerprints, Gold/reserved/mismatched rejection.\n";

// New physical table destinations, independent from row-key migration.
foreach (imc_destination_pairs() as $logical=>$physical) {
 check(imc_physical_table($logical)===$physical);
 check(imc_logical_table($physical)===$logical);
 check(imc_ident($logical)==='`'.$physical.'`');
}
$active=[['legacy_id'=>'GW001','imc_id'=>'IMC-001'],['legacy_id'=>'GW005','imc_id'=>'IMC-002'],['legacy_id'=>'GW009','imc_id'=>'IMC-003'],['legacy_id'=>'GW010','imc_id'=>'IMC-004'],['legacy_id'=>'GW011','imc_id'=>'IMC-005']];
check(imc_normalize_world_request(['action'=>'read','game_world_id'=>'IMC001'],$production,'IMPORT',$active)['game_world_id']==='GW001');
foreach(range(1,10) as $n) {
 $alias=sprintf('IMC-%03d',$n); $physical=sprintf('IMC%03d_Results',$n);
 $body=imc_normalize_world_request(['action'=>'read','game_world_id'=>$alias,'target_table'=>$physical,'target_database'=>'Sql1956795_3','repository'=>'IMC Results'],$production,'IMPORT',$active);
 $route=imc_explicit_import_route($body,$production);
 check(imc_physical_table($route['table'])===$physical);
 check(imc_ingress_table_ident($route['table'],$body['game_world_id'])==='`'.$physical.'`');
 if($n>5) rejects(fn()=>imc_normalize_world_request(['action'=>'insert_many','game_world_id'=>$alias],$production,'IMPORT',$active));
}
rejects(fn()=>imc_normalize_world_request(['action'=>'read','game_world_id'=>'IMC-002','target_table'=>'IMC001_Results'],$production,'IMPORT',$active));
echo "PASS new physical destinations 001-010, cross-world rejection and unassigned write protection.\n";

$future=array_merge($active,[['legacy_id'=>'GW012','imc_id'=>'IMC-006']]);
$body=imc_normalize_world_request(['action'=>'insert_many','game_world_id'=>'IMC-006','repository'=>'IMC Transfer','target_database'=>'Sql1956795_3','target_table'=>'IMC006_Transfers','rows'=>[['game_world_id'=>'IMC-006']]],$production,'IMPORT',$future);
check($body['rows'][0]['game_world_id']==='GW012');
check(imc_physical_table(imc_ingress_route($body,$production)['table'])==='IMC006_Transfers');
check(imc_physical_table(imc_explicit_import_route($body,$production)['table'])==='IMC006_Transfers');
echo "PASS: future CORE registration enables custom transfer route without configuration edits.\n";
