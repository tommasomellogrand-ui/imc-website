<?php
declare(strict_types=1);

function results_sha(array|string $value): string {
    $text = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $value;
    return hash('sha256', (string)$text);
}
function results_world_context(mysqli $db, string $gw, int $imcSeason): array { return ingestion_context($db, $gw, $imcSeason); }
function results_current_season(mysqli $db, string $gw): int { return ingestion_current_imc_season($db, $gw); }
function results_competitions(mysqli $db, string $gw): array {
    $q=$db->prepare('SELECT gw_competition_row_id,competition_name,competition_type,country_code,division_value,local_competition_id FROM gw_competitions WHERE game_world_id=? ORDER BY gw_competition_row_id');
    $q->bind_param('s',$gw);$q->execute();$rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);$q->close();
    return array_map(static fn($r)=>[
        'competition_key'=>(string)$r['gw_competition_row_id'],
        'sm_action'=>$r['competition_type'],
        'sm_country'=>$r['country_code'],
        'IMC_league_divisions'=>$r['division_value'],
        'sm_division'=>$r['division_value'],
        'sm_compid'=>$r['local_competition_id'],
        'sm_competition_name'=>$r['competition_name'],
        'sm_round_label'=>null,
    ],$rows);
}
function results_setup(mysqli $db, string $gw, mixed $requestedImcSeason): never {
    $imcSeason = $requestedImcSeason === null ? ingestion_current_imc_season($db, $gw) : ingestion_uint($requestedImcSeason, false);
    $ctx = ingestion_context($db, $gw, $imcSeason);
    $competitions = results_competitions($db, $gw);
    ingestion_reply(['ok'=>true, 'type'=>'results'] + $ctx + ['competitions'=>$competitions]);
}
function results_ensure_competition(mysqli $db,array $r,string $gw,array $ctx): int {
    $action=ingestion_text($r['sm_action']??null,64,false);
    $country=ingestion_text($r['sm_country']??null,8);
    $division=ingestion_text($r['sm_division']??null,32);
    $compid=ingestion_text($r['sm_compid']??null,64);
    $round=ingestion_text($r['sm_round_label']??null,255);
    $identity=['game_world_id'=>$gw,'sm_action'=>$action,'sm_country'=>$country,'sm_division'=>$division,'sm_compid'=>$compid,'sm_round_label'=>$round];
    $fingerprint=results_sha($identity);
    $q=$db->prepare('INSERT INTO gw_competitions(competition_identity_fingerprint,competition_type,country_code,created_at,division_value,game_world_id,is_active,local_competition_id,sm_game_world_id) VALUES(?,?,?,NOW(6),?,?,1,?,?) ON DUPLICATE KEY UPDATE gw_competition_row_id=LAST_INSERT_ID(gw_competition_row_id)');
    $q->bind_param('ssssssi',$fingerprint,$action,$country,$division,$gw,$compid,$ctx['sm_game_world_id']);
    $q->execute();$id=(int)$db->insert_id;$q->close();
    if($id<1){$s=$db->prepare('SELECT gw_competition_row_id FROM gw_competitions WHERE game_world_id=? AND competition_identity_fingerprint=? LIMIT 1');$s->bind_param('ss',$gw,$fingerprint);$s->execute();$row=$s->get_result()->fetch_assoc();$s->close();$id=$row?(int)$row['gw_competition_row_id']:0;}
    if($id<1)ingestion_fail('Competition bootstrap failed.');
    return $id;
}
function results_page_type(mysqli $db): int {
    $code='RESULTS';$description='Soccer Manager results page';$name='Results';$scope='ACTIVE';
    $q=$db->prepare('INSERT INTO gw_source_page_types(function_description,page_code,page_name,scope_status,url_pattern) VALUES(?,?,?,?,NULL) ON DUPLICATE KEY UPDATE page_type_id=LAST_INSERT_ID(page_type_id)');
    $q->bind_param('ssss',$description,$code,$name,$scope);$q->execute();$id=(int)$db->insert_id;$q->close();
    if($id<1){$s=$db->prepare('SELECT page_type_id FROM gw_source_page_types WHERE page_code=? LIMIT 1');$s->bind_param('s',$code);$s->execute();$row=$s->get_result()->fetch_assoc();$s->close();$id=$row?(int)$row['page_type_id']:0;}
    if($id<1)ingestion_fail('RESULTS page type bootstrap failed.');
    return $id;
}
function results_validate_envelope(mysqli $db, array $b): array {
    $gw = ingestion_world($b['game_world_id'] ?? null);
    $imcSeason = ingestion_uint($b['imc_season'] ?? null, false);
    $ctx = ingestion_context($db, $gw, $imcSeason);
    results_page_type($db);
    return $ctx;
}
function results_item(mysqli $db,array $r,int $i,string $gw,array $ctx): array {
    $allowed=['fixtureId','sm_action','sm_division','sm_country','sm_compid','sm_round_label','competition_key','group','group_name','group_label','homeTeam','awayTeam','homeTeamId','awayTeamId','homeEntityType','awayEntityType','homeManagerSmId','awayManagerSmId','homeManagerStatus','awayManagerStatus','homeScore','awayScore','decidedOnPenalties','homePenalties','awayPenalties','penaltyWinnerTeam','penaltyText','homeAggregateScore','awayAggregateScore','qualifiedTeam','qualificationMethod','qualificationText','raw'];
    if ($u=array_diff(array_keys($r),$allowed)) ingestion_fail("items[$i] unknown field: ".reset($u));
    $fixture=ingestion_uint($r['fixtureId']??null,false);$competition=ingestion_uint($r['competition_key']??null);
    if($competition!==null){$cq=$db->prepare('SELECT gw_competition_row_id FROM gw_competitions WHERE game_world_id=? AND gw_competition_row_id=? LIMIT 1');$cq->bind_param('si',$gw,$competition);$cq->execute();$ok=(bool)$cq->get_result()->fetch_assoc();$cq->close();if(!$ok)ingestion_fail("items[$i] competition bridge unresolved.");}
    else if(ingestion_text($r['sm_action']??null,64)!==null){$competition=results_ensure_competition($db,$r,$gw,$ctx);}
    $homeType=ingestion_text($r['homeEntityType']??null,16);$awayType=ingestion_text($r['awayEntityType']??null,16);
    if(($homeType!==null&&!in_array($homeType,['club','national'],true))||($awayType!==null&&!in_array($awayType,['club','national'],true)))ingestion_fail("items[$i] entity type invalid.");
    $resolveClub=static function(mysqli $db,string $gw,mixed $id,?string $type):?int{
        if($type!=='club')return null;$n=ingestion_uint($id);if($n===null)return null;
        $q=$db->prepare('SELECT world_club_id FROM gw_world_clubs WHERE game_world_id=? AND world_club_id=? LIMIT 1');$q->bind_param('si',$gw,$n);$q->execute();$found=$q->get_result()->fetch_assoc();$q->close();return $found?$n:null;
    };
    return ['fixture_id'=>$fixture,'competition_id'=>$competition,'home_world_club_id'=>$resolveClub($db,$gw,$r['homeTeamId']??null,$homeType),'away_world_club_id'=>$resolveClub($db,$gw,$r['awayTeamId']??null,$awayType),'home_entity_type'=>$homeType,'away_entity_type'=>$awayType,'home_name'=>ingestion_text($r['homeTeam']??null,255),'away_name'=>ingestion_text($r['awayTeam']??null,255),'round_label'=>ingestion_text($r['sm_round_label']??null,255),'home_score'=>isset($r['homeScore'])&&$r['homeScore']!==null?(int)$r['homeScore']:null,'away_score'=>isset($r['awayScore'])&&$r['awayScore']!==null?(int)$r['awayScore']:null,'penalty_home'=>isset($r['homePenalties'])&&$r['homePenalties']!==null?(int)$r['homePenalties']:null,'penalty_away'=>isset($r['awayPenalties'])&&$r['awayPenalties']!==null?(int)$r['awayPenalties']:null,'aggregate_home'=>isset($r['homeAggregateScore'])&&$r['homeAggregateScore']!==null?(int)$r['homeAggregateScore']:null,'aggregate_away'=>isset($r['awayAggregateScore'])&&$r['awayAggregateScore']!==null?(int)$r['awayAggregateScore']:null,'raw'=>$r];
}
function results_capture(mysqli $db,array $b,string $gw,array $items): int {
    $pageType=results_page_type($db);$identity=['gw'=>$gw,'season'=>$b['imc_season'],'date'=>$b['matchDate']??null,'url'=>$b['sourceUrl']??null,'page'=>$b['sourceContext']['sectionPage']??null,'items'=>array_column($items,'fixture_id')];
    $finger=results_sha($identity);$fileSha=results_sha(['type'=>'RESULTS','identity'=>$identity]);$json=json_encode(['source'=>'RESULTS_IMPORTER','identity'=>$identity,'sourceContext'=>$b['sourceContext']??null],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $name='results_'.$gw.'_'.($b['matchDate']??'unknown').'_'.substr($finger,0,12).'.json';$status='complete';$empty='';$title=ingestion_text($b['sourceTitle']??null,255);$version=ingestion_text($b['sourceContext']['version']??null,64);$report='RESULTS';$url=ingestion_text($b['sourceUrl']??null,4000);
    $q=$db->prepare('INSERT INTO gw_source_captures(capture_json,capture_status,created_at,full_html,game_world_id,page_title,page_type_id,parser_version,report_type,source_file_name,source_file_sha256,source_identity_fingerprint,source_url) VALUES(?,?,NOW(6),?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=LAST_INSERT_ID(capture_id),page_title=VALUES(page_title),parser_version=VALUES(parser_version),source_url=VALUES(source_url)');
    $q->execute([$json,$status,$empty,$gw,$title,$pageType,$version,$report,$name,$fileSha,$finger,$url]);$id=(int)$db->insert_id;$q->close();return $id;
}
function results_store(mysqli $db,array $b): never {
    $ctx=results_validate_envelope($db,$b);$gw=$ctx['game_world_id'];$rows=$b['items']??null;if(!is_array($rows)||!array_is_list($rows)||!$rows||count($rows)>500)ingestion_fail('items must contain 1..500 records.');
    $items=[];$seen=[];foreach($rows as $i=>$r){if(!is_array($r))ingestion_fail("items[$i] object required.");$v=results_item($db,$r,$i,$gw,$ctx);if(isset($seen[$v['fixture_id']]))ingestion_fail("items[$i] duplicated fixture.");$seen[$v['fixture_id']]=1;$items[]=$v;}
    $date=ingestion_text($b['matchDate']??null,10,false);$d=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$d||$d->format('Y-m-d')!==$date)ingestion_fail('matchDate invalid.');
    $db->begin_transaction();$inserted=0;$updated=0;$unresolvedClubs=0;
    try{$capture=results_capture($db,$b,$gw,$items);
        $payload=json_encode($b,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);$ph=hash('sha256',$payload);$pf=hash('sha256',$gw.'|'.$capture.'|RESULTS_BATCH');$ptype='RESULTS_BATCH';$pkey=$gw.'|'.$date;
        $pq=$db->prepare('INSERT INTO gw_source_payloads(capture_id,created_at,payload_fingerprint,payload_hash,payload_json,payload_key,payload_text,payload_type) VALUES(?,NOW(6),?,?,?,?,?,?) ON DUPLICATE KEY UPDATE payload_json=VALUES(payload_json),payload_hash=VALUES(payload_hash)');$pq->execute([$capture,$pf,$ph,$payload,$pkey,$payload,$ptype]);$pq->close();
        foreach($items as $v){$fixture=$v['fixture_id'];$home=$v['home_world_club_id'];$away=$v['away_world_club_id'];if($v['home_entity_type']==='club'&&$home===null)$unresolvedClubs++;if($v['away_entity_type']==='club'&&$away===null)$unresolvedClubs++;
            $fq=$db->prepare("INSERT INTO gw_fixtures(away_name,away_world_club_id,capture_id,competition_id,created_at,date,fixture_id,game_world_id,gw_season_row_id,home_name,home_world_club_id,imc_season,round_label,sm_game_world_id,sm_season_id,soccer_manager_season,status) VALUES(?,?,?,?,NOW(6),?,?,?,?,?,?,?,?,?,?,?,'played') ON DUPLICATE KEY UPDATE fixture_row_id=LAST_INSERT_ID(fixture_row_id),away_name=VALUES(away_name),away_world_club_id=VALUES(away_world_club_id),capture_id=VALUES(capture_id),competition_id=VALUES(competition_id),date=VALUES(date),gw_season_row_id=VALUES(gw_season_row_id),home_name=VALUES(home_name),home_world_club_id=VALUES(home_world_club_id),imc_season=VALUES(imc_season),round_label=VALUES(round_label),sm_game_world_id=VALUES(sm_game_world_id),sm_season_id=VALUES(sm_season_id),soccer_manager_season=VALUES(soccer_manager_season),status='played'");
            $fq->execute([$v['away_name'],$away,$capture,$v['competition_id'],$date,$fixture,$gw,$ctx['gw_season_row_id'],$v['home_name'],$home,$ctx['imc_season'],$v['round_label'],$ctx['sm_game_world_id'],$ctx['sm_season_id'],$ctx['soccer_manager_season']]);$fq->affected_rows===1?$inserted++:$updated++;$fq->close();
            $winner=($v['home_score']===null||$v['away_score']===null)?'UNKNOWN':($v['home_score']>$v['away_score']?'HOME':($v['home_score']<$v['away_score']?'AWAY':'DRAW'));$rs='played';
            $rq=$db->prepare('INSERT INTO gw_fixture_results(aggregate_away,aggregate_home,away_score,capture_id,created_at,fixture_id,game_world_id,home_score,penalty_away,penalty_home,result_status,sm_game_world_id,winner_side) VALUES(?,?,?,?,NOW(6),?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE aggregate_away=VALUES(aggregate_away),aggregate_home=VALUES(aggregate_home),away_score=VALUES(away_score),home_score=VALUES(home_score),penalty_away=VALUES(penalty_away),penalty_home=VALUES(penalty_home),result_status=VALUES(result_status),sm_game_world_id=VALUES(sm_game_world_id),winner_side=VALUES(winner_side)');
            $rq->execute([$v['aggregate_away'],$v['aggregate_home'],$v['away_score'],$capture,$fixture,$gw,$v['home_score'],$v['penalty_away'],$v['penalty_home'],$rs,$ctx['sm_game_world_id'],$winner]);$rq->close();
        }$db->commit();ingestion_reply(['ok'=>true,'stored'=>count($items),'inserted_fixtures'=>$inserted,'updated_fixtures'=>$updated,'capture_id'=>$capture,'unresolved_club_sides'=>$unresolvedClubs]);
    }catch(Throwable $e){$db->rollback();ingestion_fail('RESULTS transaction failed: '.$e->getMessage(),500);}
}
function results_probe(mysqli $db,array $b): never {$gw=ingestion_world($b['game_world_id']??null);$ids=$b['fixtureIds']??[];if(!is_array($ids))ingestion_fail('fixtureIds invalid.');$out=[];$q=$db->prepare('SELECT fixture_id FROM gw_fixtures WHERE game_world_id=? AND fixture_id=? LIMIT 1');foreach($ids as $id){$n=ingestion_uint($id,false);$q->bind_param('si',$gw,$n);$q->execute();if($q->get_result()->fetch_assoc())$out[]=$n;}$q->close();ingestion_reply(['ok'=>true,'existingFixtureIds'=>$out]);}

function results_audit_rows(mysqli $db,string $sql,array $params=[]): array {
    $q=$db->prepare($sql);$q->execute($params);$rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);$q->close();return $rows;
}
function results_audit(mysqli $db,array $b): never {
    $gw=ingestion_world($b['game_world_id']??null);
    $database=(string)$db->query('SELECT DATABASE() AS db')->fetch_assoc()['db'];
    $expected=in_array($gw,['GW002','GW003','GW007','GW008'],true)?'Sql1956795_2':'Sql1956795_3';
    if($database!==$expected)ingestion_fail('Audit routing mismatch.',500);
    $tables=['gw_game_worlds','gw_seasons','gw_competitions','gw_source_page_types','gw_source_captures','gw_source_payloads','gw_fixtures','gw_fixture_results'];
    $existing=[];
    foreach(results_audit_rows($db,"SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME IN ('gw_game_worlds','gw_seasons','gw_competitions','gw_source_page_types','gw_source_captures','gw_source_payloads','gw_fixtures','gw_fixture_results')",[$database]) as $r)$existing[$r['TABLE_NAME']]=true;
    $counts=[];$columns=[];
    foreach($tables as $table){
        if(!isset($existing[$table]))continue;
        if($table==='gw_source_page_types'){$countSql="SELECT COUNT(*) c FROM gw_source_page_types WHERE page_code='RESULTS'";$params=[];}
        else if($table==='gw_source_payloads'){$countSql="SELECT COUNT(*) c FROM gw_source_payloads p JOIN gw_source_captures c ON c.capture_id=p.capture_id WHERE c.game_world_id=? AND p.payload_type='RESULTS_BATCH'";$params=[$gw];}
        else{$tableColumns=results_audit_rows($db,'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[$database,$table]);$hasGw=false;foreach($tableColumns as $tc)if($tc['COLUMN_NAME']==='game_world_id')$hasGw=true;$countSql='SELECT COUNT(*) c FROM `'.$table.'`'.($hasGw?' WHERE game_world_id=?':'');$params=$hasGw?[$gw]:[];}
        $count=(int)results_audit_rows($db,$countSql,$params)[0]['c'];$counts[$table]=$count;
        if($count===0)continue;
        $meta=results_audit_rows($db,'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',[$database,$table]);
        $scope='';$scopeParams=[];
        if($table==='gw_source_page_types'){$scope=" WHERE page_code='RESULTS'";}
        else if($table==='gw_source_payloads'){$scope=" JOIN gw_source_captures c ON c.capture_id=p.capture_id WHERE c.game_world_id=? AND p.payload_type='RESULTS_BATCH'";$scopeParams=[$gw];}
        else{$hasGw=false;foreach($meta as $m)if($m['COLUMN_NAME']==='game_world_id')$hasGw=true;if($hasGw){$scope=' WHERE game_world_id=?';$scopeParams=[$gw];}}
        $select=[];$columnPrefix=$table==='gw_source_payloads'?'p.':'';foreach($meta as $m){$c=str_replace('`','``',$m['COLUMN_NAME']);$select[]="SUM({$columnPrefix}`$c` IS NOT NULL) AS `{$c}__set`";$select[]="SUM({$columnPrefix}`$c` IS NULL) AS `{$c}__null`";}
        $from=$table==='gw_source_payloads'?'gw_source_payloads p':'`'.$table.'`';
        $stat=results_audit_rows($db,'SELECT '.implode(',',$select).' FROM '.$from.$scope,$scopeParams)[0];$columns[$table]=[];
        foreach($meta as $m){$c=$m['COLUMN_NAME'];$columns[$table][$c]=['set'=>(int)$stat[$c.'__set'],'null'=>(int)$stat[$c.'__null']];}
    }
    $keys=results_audit_rows($db,"SELECT tc.TABLE_NAME,tc.CONSTRAINT_NAME,tc.CONSTRAINT_TYPE,GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) columns_list,kcu.REFERENCED_TABLE_NAME,GROUP_CONCAT(kcu.REFERENCED_COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) referenced_columns FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND kcu.TABLE_NAME=tc.TABLE_NAME AND kcu.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.CONSTRAINT_SCHEMA=? AND tc.TABLE_NAME IN ('gw_game_worlds','gw_seasons','gw_competitions','gw_source_page_types','gw_source_captures','gw_source_payloads','gw_fixtures','gw_fixture_results') GROUP BY tc.TABLE_NAME,tc.CONSTRAINT_NAME,tc.CONSTRAINT_TYPE,kcu.REFERENCED_TABLE_NAME ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_TYPE,tc.CONSTRAINT_NAME",[$database]);
    $duplicates=[];
    if(isset($existing['gw_fixtures']))$duplicates['gw_fixtures']=results_audit_rows($db,'SELECT fixture_id,COUNT(*) copies FROM gw_fixtures WHERE game_world_id=? GROUP BY fixture_id HAVING COUNT(*)>1',[$gw]);
    if(isset($existing['gw_fixture_results']))$duplicates['gw_fixture_results']=results_audit_rows($db,'SELECT fixture_id,COUNT(*) copies FROM gw_fixture_results WHERE game_world_id=? GROUP BY fixture_id HAVING COUNT(*)>1',[$gw]);
    if(isset($existing['gw_competitions']))$duplicates['gw_competitions']=results_audit_rows($db,'SELECT competition_identity_fingerprint,COUNT(*) copies FROM gw_competitions WHERE game_world_id=? GROUP BY competition_identity_fingerprint HAVING COUNT(*)>1',[$gw]);
    $fkUnresolved=[];
    if(isset($existing['gw_fixtures'])){$fkUnresolved=results_audit_rows($db,'SELECT SUM(f.gw_season_row_id IS NOT NULL AND s.gw_season_row_id IS NULL) season_fk_unresolved,SUM(f.competition_id IS NOT NULL AND c.gw_competition_row_id IS NULL) competition_fk_unresolved,SUM(f.home_world_club_id IS NOT NULL AND hc.world_club_id IS NULL) home_club_fk_unresolved,SUM(f.away_world_club_id IS NOT NULL AND ac.world_club_id IS NULL) away_club_fk_unresolved FROM gw_fixtures f LEFT JOIN gw_seasons s ON s.gw_season_row_id=f.gw_season_row_id LEFT JOIN gw_competitions c ON c.gw_competition_row_id=f.competition_id LEFT JOIN gw_world_clubs hc ON hc.game_world_id=f.game_world_id AND hc.world_club_id=f.home_world_club_id LEFT JOIN gw_world_clubs ac ON ac.game_world_id=f.game_world_id AND ac.world_club_id=f.away_world_club_id WHERE f.game_world_id=?',[$gw]);}
    $seasons=isset($existing['gw_seasons'])?results_audit_rows($db,'SELECT * FROM gw_seasons WHERE game_world_id=? ORDER BY imc_season,gw_season_row_id',[$gw]):[];
    $competitions=isset($existing['gw_competitions'])?results_audit_rows($db,'SELECT * FROM gw_competitions WHERE game_world_id=? ORDER BY gw_competition_row_id',[$gw]):[];
    $separation=isset($existing['gw_fixtures'])?results_audit_rows($db,"SELECT SUM(home_world_club_id IS NOT NULL) home_club_resolved,SUM(home_world_club_id IS NULL) home_unresolved_or_national,SUM(away_world_club_id IS NOT NULL) away_club_resolved,SUM(away_world_club_id IS NULL) away_unresolved_or_national FROM gw_fixtures WHERE game_world_id=?",[$gw]):[];
    $payload=isset($existing['gw_source_payloads'])?results_audit_rows($db,"SELECT COUNT(*) batches,COALESCE(SUM(JSON_LENGTH(p.payload_json,'$.items')),0) received_items FROM gw_source_payloads p JOIN gw_source_captures c ON c.capture_id=p.capture_id WHERE c.game_world_id=? AND p.payload_type='RESULTS_BATCH'",[$gw]):[];
    $persisted=isset($existing['gw_fixtures'])?results_audit_rows($db,'SELECT COUNT(*) fixtures,COUNT(DISTINCT fixture_id) distinct_fixtures FROM gw_fixtures WHERE game_world_id=?',[$gw]):[];
    $resultPersisted=isset($existing['gw_fixture_results'])?results_audit_rows($db,'SELECT COUNT(*) results,COUNT(DISTINCT fixture_id) distinct_result_fixtures FROM gw_fixture_results WHERE game_world_id=?',[$gw]):[];
    $issues=[];
    $idChecks=isset($existing['gw_fixtures'])?results_audit_rows($db,'SELECT SUM(f.fixture_id<1) invalid_fixture_ids,SUM(f.gw_season_row_id IS NOT NULL AND s.gw_season_row_id IS NULL) invented_or_orphan_season_ids,SUM(f.competition_id IS NOT NULL AND c.gw_competition_row_id IS NULL) invented_or_orphan_competition_ids,SUM(f.home_world_club_id IS NOT NULL AND hc.world_club_id IS NULL) invented_or_orphan_home_club_ids,SUM(f.away_world_club_id IS NOT NULL AND ac.world_club_id IS NULL) invented_or_orphan_away_club_ids FROM gw_fixtures f LEFT JOIN gw_seasons s ON s.gw_season_row_id=f.gw_season_row_id LEFT JOIN gw_competitions c ON c.gw_competition_row_id=f.competition_id LEFT JOIN gw_world_clubs hc ON hc.game_world_id=f.game_world_id AND hc.world_club_id=f.home_world_club_id LEFT JOIN gw_world_clubs ac ON ac.game_world_id=f.game_world_id AND ac.world_club_id=f.away_world_club_id WHERE f.game_world_id=?',[$gw]):[];
    ingestion_reply(['ok'=>true,'type'=>'results','action'=>'audit_results','read_only'=>true,'database'=>$database,'game_world_id'=>$gw,'routing_correct'=>true,'table_counts'=>$counts,'column_population'=>$columns,'gw_seasons'=>$seasons,'gw_competitions'=>$competitions,'keys'=>$keys,'duplicates'=>$duplicates,'fk_unresolved'=>$fkUnresolved[0]??null,'id_checks'=>$idChecks[0]??null,'club_national_separation'=>$separation[0]??null,'gateway_received'=>$payload[0]??null,'persisted_fixtures'=>$persisted[0]??null,'persisted_results'=>$resultPersisted[0]??null,'recorded_issues'=>$issues,'limitations'=>['rejected_http_requests_not_persisted_by_gateway'=>true,'results_rejections_not_recorded_in_a_queryable_results_log'=>true,'entity_type_is_retained_in_payload_json_but_not_a_dedicated_fixture_column'=>true]]);
}


function results_handle(mysqli $db, array $body, string $action): never {
    if ($action === 'setup') results_setup($db, ingestion_world($body['game_world_id'] ?? null), $body['imc_season'] ?? null);
    if ($action === 'probe_results') results_probe($db, $body);
    if ($action === 'audit_results') results_audit($db, $body);
    if ($action === 'validate_results') {
        $ctx = results_validate_envelope($db, $body);
        ingestion_reply(['ok'=>true, 'type'=>'results', 'validation'=>'PASS', 'context'=>$ctx]);
    }
    if ($action === 'store_results') results_store($db, $body);
    ingestion_fail('Unknown RESULTS action.', 404);
}
