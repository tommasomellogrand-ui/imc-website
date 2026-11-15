<?php
declare(strict_types=1);
$cfg=require __DIR__.'/../__imc_private_gateway/config.php';
$world=getenv('IMC_WC_WORLD')?:'IMC-002';$apply=getenv('IMC_WC_APPLY')==='true';
function wc_live(array $body,array $cfg):array{
 $request=curl_init('https://www.italianmastersclub.it/imc-universal-gateway/');
 curl_setopt_array($request,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($body,JSON_THROW_ON_ERROR),CURLOPT_HTTPHEADER=>['Content-Type: application/json','X-IMC-Universal-Token: '.$cfg['token']],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>60]);
 $raw=curl_exec($request);$status=curl_getinfo($request,CURLINFO_RESPONSE_CODE);curl_close($request);
 $response=json_decode((string)$raw,true);if($status!==200||!($response['ok']??false))throw new RuntimeException('World Cup live check failed: HTTP '.$status.' '.json_encode($response));return $response;
}
$base=['channel'=>'CHATGPT','game_world_id'=>$world,'repository'=>'IMC Schedule'];
$response=wc_live($base+['action'=>'reconcile_worldcup','dry_run'=>!$apply],$cfg);
$result=$response['worldcup']??[];if(!in_array($result['status']??'',['preview','ready','pending_schedules'],true))throw new RuntimeException('World Cup schema unavailable');
$check=null;
if($apply&&($result['registered_fixtures']??0)>0){
 $prefix=str_replace('-','',$world);if(!preg_match('/^IMC\d{3}$/D',$prefix))throw new RuntimeException('Invalid live test world');
 $sample=wc_live($base+['action'=>'query','sql'=>"SELECT m.sm_fixture_id,m.fingerprint,m.home_score,m.away_score,f.imc_season FROM {$prefix}_Match_Reports m JOIN IMC_World_Cup_Fixtures f ON f.world_id='$prefix' AND f.sm_fixture_id=m.sm_fixture_id WHERE f.group_name IS NOT NULL AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL ORDER BY m.imported_at DESC LIMIT 1"],$cfg)['rows'][0]??null;
 if(!$sample)throw new RuntimeException('No matched report available for live verification');
 wc_live(['action'=>'update','channel'=>'CHATGPT','game_world_id'=>$world,'repository'=>'IMC Match Report','where'=>['sm_fixture_id'=>$sample['sm_fixture_id'],'fingerprint'=>$sample['fingerprint']],'set'=>['home_score'=>$sample['home_score']]],$cfg);
 $id=(int)$sample['sm_fixture_id'];$rows=wc_live($base+['action'=>'query','sql'=>"SELECT sm_fixture_id,sm_action,competition_key,imc_season,home_score,away_score FROM {$prefix}_Results WHERE sm_fixture_id=$id"],$cfg)['rows'];
 if(count($rows)!==1||$rows[0]['sm_action']!=='worldcup'||(int)$rows[0]['imc_season']!==(int)$sample['imc_season']||(int)$rows[0]['home_score']!==(int)$sample['home_score']||(int)$rows[0]['away_score']!==(int)$sample['away_score'])throw new RuntimeException('Live report/result verification failed');
 $check=['fixture'=>$id,'result_count'=>1,'score'=>$rows[0]['home_score'].'-'.$rows[0]['away_score'],'season'=>$rows[0]['imc_season']];
}
echo json_encode(['world'=>$world,'applied'=>$apply,'result'=>$result,'single_report_check'=>$check],JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n";
