<?php
declare(strict_types=1);
require __DIR__.'/service.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
try {
    $action=(string)($_GET['action']??'home');
    if(!in_array($action,['home','managers','manager','ranking','trophies','compare','records','matches','player','player-search'],true))throw new InvalidArgumentException('Sezione non valida.');
    $q=[];foreach(['world','manager','opponent','season','competition_key','scope','outcome','team','search','category','player'] as $key){$v=$_GET[$key]??'';if(!is_string($v)||strlen($v)>255)throw new InvalidArgumentException('Filtro non valido.');$q[$key]=trim($v);}
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
    if(in_array($action,['records','player','player-search'],true)){
        require_once __DIR__.'/record-source.php';
        $out['seasons']=array_values(array_unique(array_column($data['matches'],'season')));sort($out['seasons']);
        if($action==='records'){
            $category=$q['category']?:'results';if(!in_array($category,['results','career','reports','players','market'],true))throw new InvalidArgumentException('Categoria record non valida.');
            if(in_array($category,['results','career'],true))$record=nr_result_records($data,$q,$category);
            elseif($category==='market'){$source=nr_market_source($data,$q);$record=nr_market_records($data,$q,$source['sources']);$out['warnings']=array_merge($out['warnings'],$source['warnings']);}
            else{$agg=nr_report_source($data,$q);$record=nr_report_records($data,$q,$agg,$category);$out['warnings']=array_merge($out['warnings'],$agg['warnings']);}
            $out+=['category'=>$category,'record_boards'=>$record['boards'],'record_summary'=>$record['summary'],'analysis'=>$record['analysis'],'record_notes'=>$record['notes']??[]];
        }elseif($action==='player-search'){
            $term=trim($q['search']);$out['player_search']=[];
            if(mb_strlen($term,'UTF-8')>=2){$core=nexus_db(nexus_config(),'core');$like='%'.$term.'%';$rows=nexus_rows($core,"SELECT p.id player_id,COALESCE(NULLIF(d.full_name,''),CONCAT_WS(' ',p.forename,p.surname)) player_name FROM `IMC Player Codex Global` p LEFT JOIN `IMC Player Codex Global Data` d ON d.player_id=p.id WHERE d.full_name LIKE ? OR CONCAT_WS(' ',p.forename,p.surname) LIKE ? OR p.id=? ORDER BY player_name LIMIT 30",[$like,$like,ctype_digit($term)?(int)$term:0]);$out['player_search']=$rows;}
        }else{
            if(!ctype_digit($q['player'])||(int)$q['player']<1)throw new InvalidArgumentException('ID giocatore non valido.');
            $agg=nr_report_source($data,$q);$id=$q['player'];$core=nexus_db(nexus_config(),'core');$identity=nexus_player_identity($core,[(int)$id])[(int)$id]??[];
            $name=trim((string)($identity['full_name']??''))?:trim(($identity['forename']??'').' '.($identity['surname']??''));
            $p=$agg['players'][$id]??['player_id'=>$id,'label'=>$name?:('Giocatore '.$id),'played'=>0,'starts'=>0,'subs'=>0,'minutes'=>0,'known_minutes'=>0,'goals'=>0,'assists'=>0,'mom'=>0,'yellow'=>0,'red'=>0,'rating_sum'=>0,'rated'=>0,'worlds'=>[],'world_stats'=>[],'matches'=>[]];
            if($name!=='')$p['label']=imc_person_display_name($name);$p['image_url']=$identity['image_url']??null;
            usort($p['matches'],fn($a,$b)=>strcmp($b['date'],$a['date']));$p['matches_total']=count($p['matches']);$p['matches']=array_slice($p['matches'],0,50);
            $out['player']=$p;$out['rosters']=array_values(array_filter(nr_player_rosters($data,(int)$id),fn($r)=>$q['world']===''||$r['world']===$q['world']));$out['record_summary']=$agg['coverage'];$out['warnings']=array_merge($out['warnings'],$agg['warnings']);
        }
    }
    echo json_encode(imc_person_display_fields($out),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
}catch(InvalidArgumentException $e){http_response_code(422);echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);}
catch(Throwable $e){error_log('Nexus Almanac: '.$e->getMessage());http_response_code(500);echo json_encode(['ok'=>false,'error'=>'Archivio temporaneamente non disponibile. Riprova tra poco.']);}
