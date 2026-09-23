<?php
declare(strict_types=1);
// Public, read-only views over Site projections and CORE identities.
function nexus_season(PDO $core,string $world,string $selection): ?array {
    if($selection==='')return null;
    $rows=nexus_core_rows($core,'SELECT imc_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? AND imc_season=?',[$world,$selection]);
    if(!$rows)respond(['ok'=>false,'error'=>'invalid_season'],422);
    return $rows[0];
}
function nexus_date_where(string $column,?array $season,array &$params): string {
    $where='';
    if($season){foreach(['imc_season_start_date'=>'>=','imc_season_end_date'=>'<='] as $key=>$op)if($season[$key]){$where.=" AND $column $op ?";$params[]=$season[$key];}}
    return $where;
}
function nexus_match_rows(PDO $db,string $world,string $key,?array $season,string $kind): array {
    $schedule=$kind==='schedule';$table=$schedule?'IMC_Site_Schedule':'IMC_Site_Results';$id=$schedule?'site_schedule_id':'site_result_id';
    $fields=$schedule?'match_time,competition_group_name,home_sm_team_id,away_sm_team_id':'result_status,competition_group_name,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score,home_sm_club_id,away_sm_club_id';
    $params=[$world,$key];$where=nexus_date_where('match_date',$season,$params);
     $rows=nexus_core_rows($db,"SELECT $id site_id,game_world_id,competition_key,sm_fixture_id,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_name,away_name,home_sm_manager_id,away_sm_manager_id,$fields FROM `$table` WHERE game_world_id=? AND competition_key=? $where ORDER BY match_date,`$id`",$params);
    nexus_report_logo_ids($db,$world,$rows);return $rows;
}

function nexus_catalog(PDO $db,PDO $core,string $world,?array $season): array {
    $catalog=nexus_core_rows($core,'SELECT id,competition_key,custom_competition,sm_action,sm_action_group,sm_country,sm_division,teams_count,expected_match,is_sm_action FROM `IMC Competition Codex Global` WHERE game_world_id=?',[$world]);
    $byKey=[];foreach($catalog as $c)if($c['competition_key'])$byKey[$c['competition_key']]=$c;
    foreach(['results'=>'IMC_Site_Results','schedule'=>'IMC_Site_Schedule'] as $kind=>$table){
        $params=[$world];$where=nexus_date_where('match_date',$season,$params);
        $rows=nexus_core_rows($db,"SELECT competition_key,MAX(sm_action) sm_action,MAX(sm_country) sm_country,MAX(sm_division) sm_division,MAX(competition_group) sm_action_group,COUNT(DISTINCT sm_fixture_id) matches,MAX(synced_at) updated_at,MIN(CASE WHEN match_date>=CURRENT_DATE THEN match_date END) next_date FROM `$table` WHERE game_world_id=? AND competition_key IS NOT NULL $where GROUP BY competition_key",$params);
        foreach($rows as $r){$key=$r['competition_key'];if(!isset($byKey[$key])){
            $matches=array_values(array_filter($catalog,fn($c)=>!$c['competition_key'] && $c['sm_action']===$r['sm_action'] && ($c['sm_division']===null || (string)$c['sm_division']===(string)$r['sm_division']) && ($c['sm_country']===null || $c['sm_country']===$r['sm_country'])));
            $base=count($matches)===1?$matches[0]:['custom_competition'=>null,'id'=>null,'teams_count'=>null,'expected_match'=>null];
            $byKey[$key]=array_merge($base,$r);
        }$byKey[$key][$kind.'_count']=(int)$r['matches'];$byKey[$key]['updated_at']=max($byKey[$key]['updated_at']??'',$r['updated_at']??'');if($kind==='schedule')$byKey[$key]['next_date']=$r['next_date'];}
    }
    $visible=array_values(array_filter($byKey,fn($c)=>($c['results_count']??0)+($c['schedule_count']??0)>0));
    $mapping=nexus_core_rows($core,'SELECT game_world_id,world_type,competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$world]);
    nexus_apply_catalog_names($visible,$mapping,$world);
    return $visible;
}
function nexus_hub(PDO $db,PDO $core,string $world): array {
    $key=(string)($_GET['competition']??'');if($key===''||strlen($key)>255)respond(['ok'=>false,'error'=>'invalid_competition'],422);
    $season=nexus_season($core,$world,(string)($_GET['season']??''));
    $catalog=nexus_catalog($db,$core,$world,null);$competition=null;foreach($catalog as $c)if($c['competition_key']===$key)$competition=$c;
    if(!$competition)respond(['ok'=>false,'error'=>'competition_not_available'],404);
    $results=nexus_match_rows($db,$world,$key,$season,'results');$schedule=nexus_match_rows($db,$world,$key,$season,'schedule');
    $context=nexus_core_enrich($core,$world,'results',$results);nexus_core_enrich($core,$world,'schedule',$schedule);
    // A completed fixture must not also appear as an upcoming match.
    $played=[];foreach($results as $r)if($r['home_score']!==null&&$r['away_score']!==null)$played[(string)$r['sm_fixture_id']]=true;
    $schedule=array_values(array_filter($schedule,fn($r)=>!isset($played[(string)$r['sm_fixture_id']])));
    return ['ok'=>true,'world'=>$world,'competition'=>$competition,'core'=>$context,'results'=>$results,'schedule'=>$schedule];
}
function nexus_players(PDO $db,PDO $core,string $world): array {
    // Authoritative source: per-world MySQL Aruba Player Codex repository.
    $table=$world.'_IMC_Player_Codex';
    $params=[];$where='1=1';
    foreach(['search'=>'full_name','club'=>'current_sm_club_id','position'=>'position','player'=>'player_id'] as $key=>$col)if(($_GET[$key]??'')!==''){
        $input=substr((string)$_GET[$key],0,200);$like=$key==='search';$role=$key==='position';
        $where.=" AND `$col` ".($role?'REGEXP ?':($like?'LIKE ?':'= ?'));
        $params[]=$role?nexus_position_pattern($input):($like?'%'.$input.'%':$input);
    }
    $value="(CASE WHEN TRIM(market_value) REGEXP '^[€£$]?[0-9]+([.,][0-9]+)?[[:space:]]*[MKmk]?$' THEN CAST(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(market_value),'€',''),'£',''),'$',''),'M',''),'K',''),',','.') AS DECIMAL(18,3))*CASE WHEN UPPER(TRIM(market_value)) LIKE '%M' THEN 1000000 WHEN UPPER(TRIM(market_value)) LIKE '%K' THEN 1000 ELSE 1 END ELSE NULL END)";
    foreach(['rating'=>'rating','age'=>'age','value'=>$value] as $prefix=>$column)foreach(['min'=>'>=','max'=>'<='] as $suffix=>$op){
        $input=$_GET[$prefix.'_'.$suffix]??'';
        if($input!==''){if(!is_numeric($input)||(float)$input<0)respond(['ok'=>false,'error'=>'invalid_filter'],422);$where.=" AND $column $op ?";$params[]=(float)$input*($prefix==='value'?1000000:1);}
    }
    $orders=['rating'=>'rating DESC','age'=>'age ASC','value'=>"$value DESC",'name'=>'full_name ASC'];$sort=$orders[$_GET['sort']??'rating']??$orders['rating'];
    $meta=nexus_core_rows($db,"SELECT COUNT(*) total,MAX(imported_at) updated_at FROM `$table` WHERE $where",$params)[0];
    $offset=max(0,(int)($_GET['offset']??0));
    $fields='game_world_id,player_id,full_name,nationality,position,rating,market_value,age,current_club,current_sm_club_id,image_url,imported_at';
    if(!empty($_GET['player']))$fields.=',date_of_birth,height_cm,weight_kg,foot,real_club,salary,contract_seasons,rating_history,transfer_history';
    $rows=nexus_core_rows($db,"SELECT $fields FROM `$table` WHERE $where ORDER BY $sort,player_id LIMIT 50 OFFSET $offset",$params);
    $context=nexus_core_enrich($core,$world,'players',$rows);
    foreach($rows as &$r){
        $r['image_url']=($r['player_core']['image_url']??null)?:$r['image_url'];
        foreach(['rating_history','transfer_history'] as $field)if(isset($r[$field]))$r[$field]=$r[$field]===null?[]:(json_decode($r[$field],true)?:[]);
    }unset($r);
    $clubs=nexus_core_rows($db,"SELECT DISTINCT current_sm_club_id id,current_club name FROM `$table` WHERE current_sm_club_id IS NOT NULL ORDER BY current_club");
    return ['ok'=>true,'world'=>$world,'source'=>$table,'rows'=>$rows,'core'=>$context,'clubs'=>$clubs,'total'=>(int)$meta['total'],'updated_at'=>$meta['updated_at'],'offset'=>$offset];
}
function nexus_stats(PDO $db,string $world,PDO $core): array {
    $key=(string)($_GET['competition']??'');if($key==='')respond(['ok'=>false,'error'=>'invalid_competition'],422);
    $metrics=['goals'=>'s.goals','assists'=>'s.assists','rating'=>'s.avg_rating','mom'=>'s.mom','cards'=>'(COALESCE(s.yellow_cards,0)+COALESCE(s.red_cards,0))'];$metric=(string)($_GET['metric']??'goals');$col=$metrics[$metric]??$metrics['goals'];
    // These imports are competition snapshots, not dated per-match events. Never assign them to a historical season.
    $valid=$metric==='cards'?'(s.yellow_cards IS NOT NULL OR s.red_cards IS NOT NULL)':"$col IS NOT NULL";
    $rows=nexus_core_rows($db,"SELECT s.sm_player_id player_id,s.player_name,s.sm_club_id,s.club_name,s.appearances,s.goals,s.assists,s.avg_rating,s.mom,s.yellow_cards,s.red_cards,s.imported_at,$col metric_value FROM `IMC_Site_SM_Player_Stats` s WHERE s.source_game_world_id=? AND s.competition_key=? AND $valid AND NOT EXISTS (SELECT 1 FROM `IMC_Site_SM_Player_Stats` n WHERE n.source_game_world_id=s.source_game_world_id AND n.competition_key=s.competition_key AND n.sm_player_id=s.sm_player_id AND (COALESCE(n.imported_at,'1000-01-01')>COALESCE(s.imported_at,'1000-01-01') OR (n.imported_at<=>s.imported_at AND n.site_player_stats_id>s.site_player_stats_id))) ORDER BY metric_value DESC,s.player_name LIMIT 100",[$world,$key]);
    nexus_core_enrich($core,$world,'stats',$rows);
    return ['ok'=>true,'world'=>$world,'rows'=>$rows,'metric'=>$metric,'scope'=>'latest_import','total'=>count($rows)];
}
function nexus_global_players(PDO $core,string $world): array {
    $params=[];$where='1=1';
    foreach(['search'=>"COALESCE(d.full_name,CONCAT_WS(' ',p.forename,p.surname))",'position'=>'d.position','club'=>'d.soccerwiki_club_id','player'=>'p.id'] as $key=>$col)if(($_GET[$key]??'')!==''){$like=$key==='search';$role=$key==='position';$where.=" AND $col ".($role?'REGEXP ?':($like?'LIKE ?':'= ?'));$params[]=$role?nexus_position_pattern((string)$_GET[$key]):($like?'%'.substr((string)$_GET[$key],0,200).'%':(string)$_GET[$key]);}
    foreach(['rating'=>'d.rating','age'=>'d.age','value'=>'d.market_value'] as $prefix=>$col)foreach(['min'=>'>=','max'=>'<='] as $suffix=>$op){$input=$_GET[$prefix.'_'.$suffix]??'';if($input!==''){if(!is_numeric($input)||(float)$input<0)respond(['ok'=>false,'error'=>'invalid_filter'],422);$where.=" AND $col $op ?";$params[]=(float)$input*($prefix==='value'?1000000:1);}}
    $from='`IMC Player Codex Global` p LEFT JOIN `IMC Player Codex Global Data` d ON d.player_id=p.id';
    $meta=nexus_core_rows($core,"SELECT COUNT(*) total,MAX(d.updated_at) updated_at FROM $from WHERE $where",$params)[0];
    $orders=['rating'=>'d.rating DESC','age'=>'d.age ASC','value'=>'d.market_value DESC','name'=>'full_name ASC'];$sort=$orders[$_GET['sort']??'rating']??$orders['rating'];$offset=max(0,(int)($_GET['offset']??0));
    $rows=nexus_core_rows($core,"SELECT p.id player_id,COALESCE(d.full_name,CONCAT_WS(' ',p.forename,p.surname)) full_name,p.image_url,d.nationality,d.position,d.rating,d.market_value,d.age,d.soccerwiki_club_id current_global_club_id,d.soccerwiki_club_name current_club,d.soccerwiki_club_name real_club,d.updated_at imported_at,d.height_cm,d.weight_kg,d.foot,d.wage salary FROM $from WHERE $where ORDER BY $sort,p.id LIMIT 50 OFFSET $offset",$params);
    $clubIds=array_values(array_unique(array_filter(array_column($rows,'current_global_club_id'))));$logos=[];
    if($clubIds){$ph=implode(',',array_fill(0,count($clubIds),'?'));foreach(nexus_core_rows($core,"SELECT id,name,image_url FROM `IMC Club Codex Global` WHERE id IN ($ph)",$clubIds) as $club)$logos[(string)$club['id']]=$club;}
    foreach($rows as &$r){$r['club_core']=$logos[(string)($r['current_global_club_id']??'')]??null;$r['real_club_core']=$r['club_core'];if($r['market_value']!==null)$r['market_value']='€'.number_format((float)$r['market_value']/1000000,2,'.','').'M';$r['rating_history']=[];$r['transfer_history']=[];}unset($r);
    if(!empty($_GET['player'])&&$rows)$rows[0]['rating_history']=nexus_core_rows($core,'SELECT change_date,old_rating,new_rating FROM `IMC Player Codex Global Rating History` WHERE player_id=? ORDER BY change_date DESC LIMIT 100',[$_GET['player']]);
    $clubs=nexus_core_rows($core,'SELECT DISTINCT soccerwiki_club_id id,soccerwiki_club_name name FROM `IMC Player Codex Global Data` WHERE soccerwiki_club_id IS NOT NULL ORDER BY soccerwiki_club_name');
    return ['ok'=>true,'world'=>$world,'scope'=>'global','rows'=>$rows,'clubs'=>$clubs,'total'=>(int)$meta['total'],'updated_at'=>$meta['updated_at'],'offset'=>$offset];
}

function nexus_position_pattern(string $role): string {
    $roles=['P'=>'P(T)?','D'=>'D','CD'=>'CD','CC'=>'CC','CO'=>'CO','A'=>'A'];
    if(!isset($roles[$role]))respond(['ok'=>false,'error'=>'invalid_position'],422);
    return '(^|,)[[:space:]]*'.$roles[$role].'([(]|,|$)';
}

// Match identities come from imported SM manager IDs, never inferred from club names.
function nexus_profile_details(PDO $core,array &$rows): void {
    foreach($rows as &$row)foreach(['team_stats_json','players_json'] as $field)if(isset($row[$field])&&is_string($row[$field]))$row[$field]=json_decode($row[$field],true);unset($row);
    {
        $ids=[];foreach($rows as $r)foreach(($r['players_json']??[]) as $p){$id=$p['sm_player_id']??$p['player_id']??null;if($id!==null&&ctype_digit((string)$id)&&(int)$id>0)$ids[(string)$id]=$id;}
        $photos=[];foreach(array_chunk(array_values($ids),500) as $batch){$ph=implode(',',array_fill(0,count($batch),'?'));foreach(nexus_core_rows($core,"SELECT id,image_url FROM `IMC Player Codex Global` WHERE id IN ($ph)",$batch) as $p)$photos[(string)$p['id']]=$p['image_url'];}
        foreach($rows as &$r){if(!is_array($r['players_json']??null))continue;foreach($r['players_json'] as &$p){$id=$p['sm_player_id']??$p['player_id']??null;$p['codex_image_url']=$id!==null?($photos[(string)$id]??null):null;}unset($p);}unset($r);
    }

}

function nexus_manager_profile(PDO $db,PDO $core,string $world): array {
    $id=(string)($_GET['manager']??'');
    if(!preg_match('/^MNG[0-9]{1,10}$/D',$id))respond(['ok'=>false,'error'=>'invalid_manager'],422);
    $assignments=nexus_core_rows($core,'SELECT manager_id,team_id,national_team_id,team_name,assignment_type,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=? AND manager_id=? ORDER BY start_date DESC',[$world,$id]);
    if(!$assignments)respond(['ok'=>false,'error'=>'manager_not_in_world'],404);
    $people=nexus_core_rows($core,'SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` WHERE manager_id=?',[$id]);
    $person=$people[0]??['manager_id'=>$id,'sm_manager_id'=>null];$rows=[];
    if(($_GET['summary']??'')==='1'){
        if(!empty($person['sm_manager_id']))$rows=nexus_core_rows($db,'SELECT sm_fixture_id,match_date,competition_group,home_sm_manager_id,away_sm_manager_id,home_score,away_score FROM `IMC_Site_Match_Report` WHERE game_world_id=? AND (home_sm_manager_id=? OR away_sm_manager_id=?) AND home_score IS NOT NULL AND away_score IS NOT NULL',[$world,$person['sm_manager_id'],$person['sm_manager_id']]);
        return ['ok'=>true,'world'=>$world,'manager'=>$person,'assignments'=>$assignments,'source'=>'IMC_Site_Match_Report','rows'=>$rows];
    }
    if(!empty($person['sm_manager_id'])){
        $params=[$world,$person['sm_manager_id'],$person['sm_manager_id']];
        $dates=nexus_date_where('match_date',nexus_season($core,$world,(string)($_GET['season']??'')),$params);
        $rows=nexus_core_rows($db,"SELECT site_match_report_id site_id,game_world_id,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_name,away_name,home_sm_club_id,away_sm_club_id,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score,home_manager_name,away_manager_name,team_stats_json,players_json FROM `IMC_Site_Match_Report` WHERE game_world_id=? AND (home_sm_manager_id=? OR away_sm_manager_id=?) $dates ORDER BY match_date DESC,site_match_report_id DESC",$params);
        nexus_core_enrich($core,$world,'match_report',$rows);nexus_profile_details($core,$rows);
    }
    return ['ok'=>true,'world'=>$world,'manager'=>$person,'assignments'=>$assignments,'source'=>'IMC_Site_Match_Report','rows'=>$rows];
}

function nexus_team_profile(PDO $db,PDO $core,string $world): array {
    $national=($_GET['teamType']??'clubs')==='nations';$id=(string)($_GET['team']??'');
    if(!ctype_digit($id))respond(['ok'=>false,'error'=>'invalid_team'],422);
    $directory=nexus_world_directory($core,$world);$team=null;
    foreach($directory[$national?'nations':'clubs'] as $t)if((string)$t['id']===$id){$team=$t;break;}
    if(!$team)respond(['ok'=>false,'error'=>'team_not_in_world'],404);
    $rows=[];
    $index=nexus_team_index($directory[$national?'nations':'clubs']);
    $mapping=empty($team['sm_team_id'])?'missing':(isset($index[(string)$team['sm_team_id']])?'verified':'ambiguous');
    if($mapping==='verified'){
        $params=[$world,$team['sm_team_id'],$team['sm_team_id']];
        $dates=nexus_date_where('match_date',nexus_season($core,$world,(string)($_GET['season']??'')),$params);
        $type=$national?"UPPER(competition_group) IN ('NATIONS','NATIONAL')":"UPPER(competition_group) IN ('DOMESTIC','INTERNATIONAL')";
        $source=$national?'IMC_Site_Results':'IMC_Site_Match_Report';$rowId=$national?'site_result_id':'site_match_report_id';
        $detail=$national?'result_status':'home_manager_name,away_manager_name,team_stats_json,players_json';
        $rows=nexus_core_rows($db,"SELECT $rowId site_id,game_world_id,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_name,away_name,home_sm_club_id,away_sm_club_id,home_sm_manager_id,away_sm_manager_id,$detail,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score FROM `$source` WHERE game_world_id=? AND (home_sm_club_id=? OR away_sm_club_id=?) AND $type $dates ORDER BY match_date DESC,$rowId DESC",$params);
        nexus_core_enrich($core,$world,$national?'results':'match_report',$rows);if(!$national)nexus_profile_details($core,$rows);
    }
    return ['ok'=>true,'world'=>$world,'team'=>$team,'mapping_status'=>$mapping,'source'=>$national?'IMC_Site_Results':'IMC_Site_Match_Report','rows'=>$rows];
}

function nexus_competition_reports(PDO $db,PDO $core,string $world): array {
    $key=(string)($_GET['competition']??'');if($key===''||strlen($key)>255)respond(['ok'=>false,'error'=>'invalid_competition'],422);
    $season=nexus_season($core,$world,(string)($_GET['season']??''));$params=[$world,$key];$where=nexus_date_where('match_date',$season,$params);
    $detail=(($_GET['overview']??'')==='1')?',team_stats_json,players_json':'';
    $rows=nexus_core_rows($db,"SELECT site_match_report_id site_id,game_world_id,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_name,away_name,home_sm_club_id,away_sm_club_id,home_sm_manager_id,away_sm_manager_id,home_manager_name,away_manager_name,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score $detail FROM `IMC_Site_Match_Report` WHERE game_world_id=? AND competition_key=? $where ORDER BY match_date,site_match_report_id",$params);
    foreach($rows as &$row)foreach(['team_stats_json','players_json'] as $field)if(isset($row[$field])&&is_string($row[$field]))$row[$field]=json_decode($row[$field],true);unset($row);
    nexus_core_enrich($core,$world,'match_report',$rows);

    if($detail!=='')nexus_profile_details($core,$rows);
    $schedule=nexus_match_rows($db,$world,$key,$season,'schedule');$played=[];foreach($rows as $r)if($r['home_score']!==null&&$r['away_score']!==null)$played[(string)$r['sm_fixture_id']]=true;
    $schedule=array_values(array_filter($schedule,fn($r)=>!isset($played[(string)$r['sm_fixture_id']])));
    $competition=$rows?($rows[0]['competition_core']??$rows[0]):['sm_action'=>'','competition_key'=>$key];
    return ['ok'=>true,'world'=>$world,'source'=>'IMC_Site_Match_Report','competition'=>$competition,'reports'=>$rows,'schedule'=>$schedule];
}

