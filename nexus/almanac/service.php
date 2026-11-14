<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/core/bootstrap.php';
require_once __DIR__.'/engine.php';
function na_catalog(PDO $core): array {
    $rows=nexus_rows($core,'SELECT `IMC GW` legacy,IMC_WORLD_ID id,`IMC GW Name` name FROM `IMC Game World Codex Global` WHERE IMC_WORLD_ID IS NOT NULL ORDER BY IMC_WORLD_ID');
    $out=[];foreach($rows as $r){$r['code']=str_replace('-','',$r['id']);if(!preg_match('/^IMC\d{3}$/D',$r['code']))continue;$slug=strtolower(preg_replace('/[^a-zA-Z0-9]/','',$r['name']));$r['site_url']='/'.$slug.'/';$r['weight']=imc_rank_weight($r['legacy']);$out[]=$r;}return $out;
}
function na_read(): array {
    $c=nexus_config();$core=nexus_db($c,'core');$worlds=na_catalog($core);
    $managers=nexus_rows($core,'SELECT manager_id,full_name,sm_manager_id,imc_join_date,face_image_url,bust_image_url FROM `IMC Manager Codex Global` ORDER BY full_name');
    $assignments=nexus_rows($core,'SELECT a.*,COALESCE(a.team_name,n.`National Team Name`) assignment_name FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Game World National Team Mapping` n ON n.`Game World`=a.game_world_id AND n.`SM World National Club ID`=a.national_team_id ORDER BY a.start_date DESC,a.id DESC');
    $labels=[];$aliases=[];foreach($worlds as $w)foreach(na_aliases($w) as $a)$aliases[$a]=$w['id'];
    foreach(nexus_rows($core,'SELECT game_world_id,competition_key,nexus_view FROM `IMC Competition Nexus Mapping`') as $r)if(isset($aliases[$r['game_world_id']]))$labels[$aliases[$r['game_world_id']].'|'.na_key($r['competition_key'])]=$r['nexus_view'];
    $clubs=nexus_rows($core,'SELECT id,name,nexus_view FROM `IMC Club Codex Global`');
    $mapping=nexus_rows($core,'SELECT `Game World` game_world_id,`Club ID` entity_id,`SM World Club ID` world_id,`Club Name` name FROM `IMC Game World Club Mapping`');
    $display=nexus_club_label_index($clubs,$mapping);
    foreach($assignments as &$a)if($a['assignment_type']==='club')$a['assignment_name']=nexus_club_label((string)$a['team_name'],$display,$a['game_world_id'],$a['team_id']);unset($a);
    $dbs=[];$tables=[];
    foreach(['custom','gold'] as $target){
        if(empty($c['db'][$target]))continue;
        try{$dbs[$target]=nexus_db($c,$target);foreach(nexus_rows($dbs[$target],'SHOW TABLES') as $r){$table=(string)array_values($r)[0];if(preg_match('/^IMC\d{3}_(Results|Trophy_Room)$/D',$table)&&!isset($tables[$table]))$tables[$table]=$target;}}
        catch(Throwable $e){error_log('Nexus Almanac discovery '.$target.': '.$e->getMessage());}
    }
    $sources=[];
    foreach($worlds as $w){$src=['results'=>[],'trophies'=>[],'warnings'=>[]];
        foreach(['results'=>'Results','trophies'=>'Trophy_Room'] as $key=>$suffix){$table=$w['code'].'_'.$suffix;
            if(!isset($tables[$table])){$src['warnings'][]=$w['id'].': archivio '.($key==='results'?'risultati':'titoli').' non disponibile.';continue;}
            try{$src[$key]=nexus_rows($dbs[$tables[$table]],'SELECT * FROM `'.$table.'`');foreach($src[$key] as &$r){foreach(['home','away'] as $side)if(isset($r[$side.'_name'])&&!ch_nation($r))$r[$side.'_name']=nexus_club_label($r[$side.'_name'],$display,$w['legacy'],$r[$side.'_sm_club_id']??null);if(isset($r['winner_name'])&&strtoupper((string)($r['competition_group']??''))!=='NATIONS')$r['winner_name']=nexus_club_label($r['winner_name'],$display,$w['legacy'],$r['winner_sm_world_club_id']??null);}unset($r);}
            catch(Throwable $e){$src['warnings'][]=$w['id'].': lettura '.($key==='results'?'risultati':'titoli').' temporaneamente non disponibile.';error_log('Nexus Almanac '.$table.': '.$e->getMessage());}
        }$sources[$w['id']]=$src;
    }
    return na_bundle($worlds,$managers,$assignments,$sources,(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d'),$labels);
}
function na_page(array $rows,int $page,int $size=30): array {return ['rows'=>array_slice($rows,($page-1)*$size,$size),'total'=>count($rows),'page'=>$page,'pages'=>max(1,(int)ceil(count($rows)/$size))];}
function na_manager_public(array $m): array {unset($m['sm_manager_id']);return $m;}
