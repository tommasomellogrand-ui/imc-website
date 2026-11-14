<?php
declare(strict_types=1);
require_once __DIR__.'/records.php';
require_once dirname(__DIR__).'/players/media.php';
function nr_connections(array $data): array {
    $cfg=nexus_config();$dbs=[];foreach(array_unique(array_values($data['_source_targets']??[])) as $target)$dbs[$target]=nexus_db($cfg,$target);return $dbs;
}
function nr_report_source(array $data,array $q): array {
    $agg=nr_report_start();$dbs=nr_connections($data);$lookup=[];foreach($data['matches'] as $m)if($m['fixture_id'])$lookup[$m['world'].'|'.$m['fixture_id']]=$m;
    $identities=ch_identity(array_values($data['managers']));$today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');$errors=[];
    // SQL extracts only end-of-play markers; full commentary is never sent to the browser.
    $duration="(SELECT MAX(CASE WHEN clock_minute REGEXP '^[0-9]+([+][0-9]+)?$' THEN CAST(SUBSTRING_INDEX(clock_minute,'+',1) AS UNSIGNED)+IF(LOCATE('+',clock_minute)>0,CAST(SUBSTRING_INDEX(clock_minute,'+',-1) AS UNSIGNED),0) ELSE NULL END) FROM JSON_TABLE(COALESCE(r.commentary_json,JSON_ARRAY()), '$[*]' COLUMNS(clock_minute VARCHAR(32) PATH '$.minute' NULL ON ERROR,clock_text VARCHAR(2048) PATH '$.commentary_text' NULL ON ERROR)) clock_rows WHERE LOWER(clock_text) REGEXP 'fine secondo tempo|fine.*supplementar|full.?time|end of.*(second half|extra time)')";
    foreach($data['worlds'] as $w){if(($q['world']??'')!==''&&$q['world']!==$w['id'])continue;$table=$w['code'].'_Match_Reports';$target=$data['_source_targets'][$table]??null;if(!$target){$errors[]=$w['id'].': Match Report non disponibili.';continue;}
        try{$sql='SELECT r.game_world_id,r.sm_fixture_id,r.imc_season,r.competition_key,r.competition_group,r.sm_action,r.match_date,r.home_sm_club_id,r.away_sm_club_id,r.home_name,r.away_name,r.home_sm_manager_id,r.away_sm_manager_id,r.home_score,r.away_score,r.attendance,r.team_stats_json,r.players_json,'.$duration.' duration FROM `'.$table.'` r WHERE r.match_date<=? AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL';$params=[$today];if(($q['season']??'')!==''){$sql.=' AND r.imc_season=?';$params[]=(int)$q['season'];}$sql.=' ORDER BY r.sm_fixture_id';$stmt=$dbs[$target]->prepare($sql);$stmt->execute($params);$group=[];$last=null;
            $consume=static function(array $rows)use(&$agg,$lookup,$w,$identities,$q):void {
                if(!$rows)return;$sign=[];foreach($rows as $r)$sign[hash('sha256',json_encode($r))]=true;if(count($sign)>1){$agg['coverage']['Report discordanti']++;return;}$r=$rows[0];$fixture=(string)($r['sm_fixture_id']??'');if((int)$fixture<1||!in_array($r['game_world_id'],na_aliases($w),true))return;
                $m=$lookup[$w['id'].'|'.$fixture]??null;
                if($m){foreach(['home','away'] as $side)if((int)$m[$side.'_score']!==(int)$r[$side.'_score']||(string)$m[$side.'_team_id']!==(string)$r[$side.'_sm_club_id']){$agg['coverage']['Report discordanti']++;return;}}
                else{$m=['key'=>$w['id'].'|sm:'.$fixture,'world'=>$w['id'],'game_world_id'=>$w['legacy'],'fixture_id'=>$fixture,'date'=>$r['match_date'],'season'=>$r['imc_season'],'competition_key'=>na_key($r['competition_key']??''),'competition'=>$r['competition_key']??'','scope'=>ch_nation($r)?'national_team':'club'];foreach(['home','away'] as $side){$ids=ch_resolve($r,$side,$identities)['ids'];$m[$side.'_manager']=count($ids)===1?$ids[0]:null;$m[$side.'_name']=$r[$side.'_name'];$m[$side.'_score']=(int)$r[$side.'_score'];$m[$side.'_team_id']=$r[$side.'_sm_club_id'];}}
                nr_report_add($agg,$r,$m,$q);
            };
            while($r=$stmt->fetch(PDO::FETCH_ASSOC)){$id=(string)$r['sm_fixture_id'];if($group&&$last!==$id){$consume($group);$group=[];}$last=$id;$group[]=$r;}$consume($group);$stmt->closeCursor();
        }catch(Throwable $e){$errors[]=$w['id'].': statistiche report temporaneamente non disponibili.';error_log('Nexus report records '.$table.': '.$e->getMessage());}
    }
    // Names come from the global player identity, keyed by the same SM player ID.
    try{$core=nexus_db(nexus_config(),'core');$ids=array_keys($agg['players']);$people=nexus_player_identity($core,$ids);foreach($agg['players'] as $id=>&$p){$person=$people[(int)$id]??[];$name=trim((string)($person['full_name']??''))?:trim(($person['forename']??'').' '.($person['surname']??''));if($name!=='')$p['label']=imc_person_display_name($name);}unset($p);}catch(Throwable $e){error_log('Nexus record player labels: '.$e->getMessage());}
    $agg['warnings']=$errors;return $agg;
}
function nr_market_source(array $data,array $q): array {
    $dbs=nr_connections($data);$rows=[];$errors=[];foreach($data['worlds'] as $w){if(($q['world']??'')!==''&&$q['world']!==$w['id'])continue;$table=$w['code'].'_Transfers';$target=$data['_source_targets'][$table]??null;if(!$target){$errors[]=$w['id'].': trasferimenti non disponibili.';continue;}try{$rows[$w['id']]=nexus_rows($dbs[$target],'SELECT * FROM `'.$table.'`');}catch(Throwable $e){$errors[]=$w['id'].': trasferimenti temporaneamente non disponibili.';error_log('Nexus market records '.$table.': '.$e->getMessage());}}
    return ['sources'=>$rows,'warnings'=>$errors];
}
function nr_player_rosters(array $data,int $player): array {
    $dbs=nr_connections($data);$rows=[];foreach($data['worlds'] as $w){$table=$w['code'].'_Player_Codex';$target=$data['_source_targets'][$table]??null;if(!$target)continue;try{$found=nexus_rows($dbs[$target],'SELECT player_id,full_name,current_club,current_sm_club_id,image_url,imported_at FROM `'.$table.'` WHERE player_id=?',[$player]);if($found)$rows[]=['world'=>$w['id'],'rows'=>$found];}catch(Throwable $e){error_log('Nexus player roster '.$table.': '.$e->getMessage());}}return $rows;
}
