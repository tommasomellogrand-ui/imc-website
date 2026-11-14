<?php
declare(strict_types=1);
require __DIR__.'/service.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
try {
    $action=(string)($_GET['action']??'home');
    if(!in_array($action,['home','managers','manager','ranking','trophies','compare','records','matches'],true))throw new InvalidArgumentException('Sezione non valida.');
    $q=[];foreach(['world','manager','opponent','season','competition_key','scope','outcome','team','search'] as $key){$v=$_GET[$key]??'';if(!is_string($v)||strlen($v)>255)throw new InvalidArgumentException('Filtro non valido.');$q[$key]=trim($v);}
    if($q['scope']==='global')$q['scope']='';if(!in_array($q['scope'],['','club','national_team'],true))throw new InvalidArgumentException('Ambito non valido.');
    $page=max(1,min(100000,(int)($_GET['page']??1)));$data=na_read();
    if($q['world']!==''){
        $found=false;foreach($data['worlds'] as $w)if(in_array($q['world'],na_aliases($w),true)){$q['world']=$w['id'];$found=true;break;}if(!$found)throw new InvalidArgumentException('Mondo non trovato.');
    }
    foreach(['manager','opponent'] as $key)if($q[$key]!==''&&!isset($data['managers'][$q[$key]]))throw new InvalidArgumentException('Manager IMC non trovato.');
    $people=array_values(array_map('na_manager_public',$data['managers']));
    $out=['ok'=>true,'version'=>1,'generated_at'=>gmdate('c'),'worlds'=>$data['worlds'],'people'=>array_map(fn($m)=>array_intersect_key($m,array_flip(['manager_id','full_name','face_image_url'])),$people),'warnings'=>$data['warnings'],'coverage'=>$data['coverage']];
    $rank=[];
    foreach($data['ranking_ids'] as $id){$m=na_manager_public($data['managers'][$id]);if($q['world']!==''){$mw=$m['worlds'][$q['world']]??null;$m['stats']=$mw['stats']??ch_zero();$m['trophies']=$mw['trophies']??0;$m['ranking']=$mw['ranking']??['total'=>0,'match_points'=>0,'trophy_points'=>0,'unscored_trophies'=>0];}$rank[]=$m;}
    usort($rank,fn($a,$b)=>($b['ranking']['total']<=>$a['ranking']['total'])?:strcasecmp($a['full_name'],$b['full_name']));
    $position=0;$last=null;foreach($rank as $i=>&$m){if($last===null||(float)$last!==(float)$m['ranking']['total'])$position=$i+1;$last=$m['ranking']['total'];$m['position']=$position;}unset($m);
    if($action==='home')$out+=['totals'=>['worlds'=>count($data['worlds']),'managers'=>count($people),'matches'=>count($data['matches']),'trophies'=>count($data['trophies'])],'ranking'=>array_slice($rank,0,5),'trophies'=>array_slice($data['trophies'],0,4)];
    if($action==='managers')$out['managers']=$people;
    if($action==='ranking')$out['ranking']=$rank;
    if($action==='manager'){
        if($q['manager']==='')throw new InvalidArgumentException('Scegli un manager.');
        $out['manager']=na_manager_public($data['managers'][$q['manager']]);
        if($q['world']!==''){$mw=$out['manager']['worlds'][$q['world']]??null;$out['manager']['stats']=$mw['stats']??ch_zero();$out['manager']['trophies']=$mw['trophies']??0;}
        $out['matches']=na_page(na_filter($data['matches'],$q),$page,15);$out['trophies']=na_filter($data['trophies'],$q);
    }
    if($action==='trophies')$out['trophies']=na_page(na_filter($data['trophies'],$q),$page);
    if($action==='matches'){
        $out['matches']=na_page(na_filter($data['matches'],$q),$page);
        $facets=[];foreach($data['matches'] as $r){if($q['world']!==''&&$r['world']!==$q['world'])continue;$facets[$r['competition_key']]=$r['competition'];}
        asort($facets);$out['competitions']=$facets;$out['seasons']=array_values(array_unique(array_column($data['matches'],'season')));sort($out['seasons']);
    }
    if($action==='trophies'){
        $facets=[];foreach($data['trophies'] as $r)if($q['world']===''||$r['world']===$q['world'])$facets[$r['competition_key']]=$r['competition'];asort($facets);$out['competitions']=$facets;$out['seasons']=array_values(array_unique(array_column($data['trophies'],'season')));sort($out['seasons']);
    }
    if($action==='compare'){
        if($q['manager']===''||$q['opponent']===''||$q['manager']===$q['opponent'])throw new InvalidArgumentException('Scegli due manager diversi.');
        $out['left']=current(array_filter($rank,fn($m)=>$m['manager_id']===$q['manager']));$out['right']=current(array_filter($rank,fn($m)=>$m['manager_id']===$q['opponent']));
        $all=na_filter($data['matches'],$q);$s=ch_zero();foreach($all as $r){$side=$r['home_manager']===$q['manager']?'home':'away';$other=$side==='home'?'away':'home';ch_add($s,$r[$side.'_score'],$r[$other.'_score'],$r['penalty_'.$side],$r['penalty_'.$other]);}$out['h2h']=$s;$out['matches']=na_page($all,$page);
    }
    if($action==='records'){
        $boards=[];foreach(['played','won','trophies','streak'] as $metric){$rows=[];foreach($rank as $m){$value=$metric==='trophies'?$m['trophies']:($m['stats'][$metric]??0);if($metric==='streak'){$current=0;$value=0;$events=na_filter($data['matches'],['manager'=>$m['manager_id'],'world'=>$q['world']]);$days=[];foreach($events as $r)$days[$r['date']][]=$r;ksort($days);foreach($days as $events){$unbeaten=true;foreach($events as $r){$side=$r['home_manager']===$m['manager_id']?'home':'away';$other=$side==='home'?'away':'home';if($r[$side.'_score']<$r[$other.'_score'])$unbeaten=false;}if($unbeaten)$current++;else $current=0;$value=max($value,$current);}}
            if($value>0)$rows[]=['manager_id'=>$m['manager_id'],'full_name'=>$m['full_name'],'value'=>$value];}usort($rows,fn($a,$b)=>($b['value']<=>$a['value'])?:strcasecmp($a['full_name'],$b['full_name']));$boards[$metric]=$rows;}$out['records']=$boards;
    }
    echo json_encode(imc_person_display_fields($out),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
}catch(InvalidArgumentException $e){http_response_code(422);echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);}
catch(Throwable $e){error_log('Nexus Almanac: '.$e->getMessage());http_response_code(500);echo json_encode(['ok'=>false,'error'=>'Archivio temporaneamente non disponibile. Riprova tra poco.']);}
