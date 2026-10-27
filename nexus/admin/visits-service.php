<?php
declare(strict_types=1);
function nv_read(string $period, string $view): array {
    $file=dirname(__DIR__,2).'/__imc_private_gateway/analytics.php';
    $cfg=is_file($file)?require $file:[];
    $key=is_array($cfg)?($cfg['windsor_api_key']??''):'';
    if(!$key)return ['ok'=>true,'configured'=>false];
    $days=['today'=>1,'7d'=>7,'30d'=>30,'90d'=>90];
    if(!isset($days[$period])||!in_array($view,['daily','pages'],true))throw new InvalidArgumentException('Filtro visite non valido.');
    $to=new DateTimeImmutable('today',new DateTimeZone('Europe/Rome'));$from=$to->modify('-'.($days[$period]-1).' days');
    $fields=$view==='daily'?'date,sessions,screen_page_views':'page_path,screen_page_views';
    $cache=sys_get_temp_dir().'/imc-visits-'.hash('sha256',__DIR__.$key.$period.$view.$to->format('Y-m-d')).'.json';
    if(is_file($cache)&&filemtime($cache)>time()-900){$saved=json_decode((string)file_get_contents($cache),true);if(is_array($saved))return $saved;}
    $url='https://connectors.windsor.ai/googleanalytics4?'.http_build_query(['api_key'=>$key,'select_accounts'=>'552441766','fields'=>$fields,'date_from'=>$from->format('Y-m-d'),'date_to'=>$to->format('Y-m-d'),'_renderer'=>'json']);
    $h=curl_init($url);curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>45,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_USERAGENT=>'Windsor/1.0']);$raw=curl_exec($h);$status=curl_getinfo($h,CURLINFO_HTTP_CODE);curl_close($h);
    if($raw===false||$status!==200)throw new RuntimeException('Statistiche temporaneamente non disponibili. Verifica il collegamento Windsor.',502);
    $data=json_decode($raw,true);
    if(!is_array($data)||isset($data['error'])||!isset($data['data'])||!is_array($data['data']))throw new RuntimeException('Report non ancora disponibile. Riprova tra poco.',502);
    $rows=[];foreach($data['data'] as $r){if($view==='daily'){$d=(string)($r['date']??'');if(preg_match('/^\d{8}$/',$d))$d=substr($d,0,4).'-'.substr($d,4,2).'-'.substr($d,6,2);if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$d))continue;$rows[]=['date'=>$d,'sessions'=>(int)($r['sessions']??0),'views'=>(int)($r['screen_page_views']??0)];}else{$rows[]=['path'=>(string)($r['page_path']??'/'),'views'=>(int)($r['screen_page_views']??0)];}}
    if($view==='daily')usort($rows,fn($a,$b)=>strcmp($a['date'],$b['date']));else usort($rows,fn($a,$b)=>$b['views']<=>$a['views']);
    $out=['ok'=>true,'configured'=>true,'rows'=>$rows,'from'=>$from->format('Y-m-d'),'to'=>$to->format('Y-m-d'),'fetched_at'=>gmdate('c'),'views'=>array_sum(array_column($rows,'views'))];if($view==='daily')$out['sessions']=array_sum(array_column($rows,'sessions'));
    $old=umask(0077);file_put_contents($cache,json_encode($out),LOCK_EX);umask($old);return $out;
}
