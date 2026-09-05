<?php
declare(strict_types=1);

function pc_json(mixed $v): string {
    $json=json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
    if($json===false) ingestion_fail('Player Codex JSON encoding failed.',422);
    return $json;
}
function pc_hash(mixed $v): string { return hash('sha256',pc_json($v)); }
function pc_nullable_uint(mixed $v): ?int {
    if($v===null||$v==='') return null;
    if(!is_int($v)&&!(is_string($v)&&ctype_digit($v))) ingestion_fail('Player Codex unsigned integer invalid.');
    $n=(int)$v; return $n>0?$n:null;
}
function pc_nullable_number(mixed $v): int|float|null {
    if($v===null||$v==='') return null;
    if(!is_int($v)&&!is_float($v)&&!(is_string($v)&&is_numeric($v))) return null;
    return 0+$v;
}
function pc_bool(mixed $v): ?int {
    if($v===null) return null;
    if($v===true||$v===1||$v==='1'||$v==='true') return 1;
    if($v===false||$v===0||$v==='0'||$v==='false') return 0;
    return null;
}
function pc_text(mixed $v,int $max): ?string {
    if($v===null) return null;
    $s=trim((string)$v); return $s===''?null:mb_substr($s,0,$max);
}
function pc_iso_datetime(mixed $v): string {
    try{$d=new DateTimeImmutable((string)$v);}catch(Throwable){ingestion_fail('capturedAt invalid.');}
    return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.u');
}
function pc_date(mixed $v): ?string {
    $s=trim((string)($v??'')); if($s==='') return null;
    foreach(['!Y-m-d','!d/m/Y','!d-m-Y'] as $f){$d=DateTimeImmutable::createFromFormat($f,$s);if($d)return $d->format('Y-m-d');}
    return null;
}
function pc_epoch_date(mixed $v): ?string {
    $n=pc_nullable_uint($v); if($n===null)return null;
    try{return (new DateTimeImmutable('@'.$n))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d');}catch(Throwable){return null;}
}
function pc_scalar_int(mixed $v): ?int {
    if(is_int($v))return $v;
    $s=trim((string)($v??'')); return preg_match('/^-?\d+$/',$s)?(int)$s:null;
}
function pc_context(mysqli $db,string $gw,array $body): array {
    $imc=isset($body['imc_season'])?ingestion_uint($body['imc_season'],false):ingestion_current_imc_season($db,$gw);
    return ingestion_context($db,$gw,$imc);
}
function pc_resolve_club(mysqli $db,array $body,string $gw): never {
    $worldId=pc_nullable_uint($body['world_club_id']??$body['sm_world_club_id']??null);
    $baseId=pc_nullable_uint($body['sm_club_id']??$body['smClubId']??null);
    if($worldId!==null){
        $q=$db->prepare('SELECT world_club_id,club_id,club_name FROM gw_world_clubs WHERE game_world_id=? AND world_club_id=? LIMIT 2');
        $q->execute([$gw,$worldId]);
    }elseif($baseId!==null){
        $q=$db->prepare('SELECT world_club_id,club_id,club_name FROM gw_world_clubs WHERE game_world_id=? AND club_id=? LIMIT 2');
        $q->execute([$gw,$baseId]);
    }else ingestion_fail('Native club identifier required.',422);
    $rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);$q->close();
    if(!$rows&&$baseId!==null){
        $exactName=pc_text($body['club_name']??$body['clubName']??null,255);
        if($exactName!==null){
            $q=$db->prepare('SELECT world_club_id,club_id,club_name FROM gw_world_clubs WHERE game_world_id=? AND BINARY club_name=BINARY ? LIMIT 2');
            $q->execute([$gw,$exactName]);$rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);$q->close();
        }
    }
    if(count($rows)!==1) ingestion_fail(count($rows)?'World club mapping is ambiguous.':'World club mapping unavailable.',409);
    ingestion_reply(['ok'=>true,'action'=>'resolve_club','game_world_id'=>$gw,'world_club_id'=>(int)$rows[0]['world_club_id'],'smWorldClubId'=>(int)$rows[0]['world_club_id'],'smClubId'=>$rows[0]['club_id']===null?null:(int)$rows[0]['club_id'],'clubName'=>$rows[0]['club_name']]);
}
function pc_store(mysqli $db,array $body,string $gw): never {
    $record=$body['record']??$body['payload']??null;
    if(!is_array($record)) ingestion_fail('Player Codex record object required.');
    $playerId=pc_nullable_uint($record['playerId']??$record['player_id']??null);
    if($playerId===null) ingestion_fail('player_id required.');
    $club=$record['club']??[];$profile=$record['profile']??[];$roster=$record['roster']??[];$membership=$record['rosterMembership']??[];$stats=$record['statistics']['roster']??[];
    $worldClubId=pc_nullable_uint($club['smWorldClubId']??$membership['sm_world_club_id']??$body['world_club_id']??null);
    if($worldClubId===null) ingestion_fail('world_club_id required.',409);
    $ctx=pc_context($db,$gw,$body);$smWorld=$ctx['sm_game_world_id'];$captured=pc_iso_datetime($record['capturedAt']??$body['captured_at']??'');

    $cq=$db->prepare('SELECT world_club_id,club_id,master_club_id FROM gw_world_clubs WHERE game_world_id=? AND world_club_id=? LIMIT 1');
    $cq->execute([$gw,$worldClubId]);$clubRow=$cq->get_result()->fetch_assoc();$cq->close();
    if(!$clubRow) ingestion_fail('Canonical world_club_id unavailable.',409);

    $core=smm_db();$mq=$core->prepare('SELECT player_id FROM players WHERE player_id=? LIMIT 1');$mq->execute([$playerId]);$master=$mq->get_result()->fetch_assoc();$mq->close();
    $masterId=$master?(int)$master['player_id']:null;

    $stable=$record;unset($stable['capturedAt']);if(isset($stable['rosterMembership'])&&is_array($stable['rosterMembership']))unset($stable['rosterMembership']['captured_at']);
    $payloadHash=pc_hash($stable);$sourceIdentity=hash('sha256','PLAYER_CODEX|'.$gw.'|'.$playerId.'|'.$worldClubId.'|'.$payloadHash);
    $sourceFile='PLAYER_CODEX_'.$gw.'_'.$playerId.'_'.$payloadHash.'.json';
    $fullHtml=pc_text($profile['html']??$record['html']??'',16777215)??'';
    $captureJson=pc_json(['type'=>'player_codex','game_world_id'=>$gw,'player_id'=>$playerId,'world_club_id'=>$worldClubId,'captured_at'=>$captured]);
    $payloadJson=pc_json($record);
    $createdNew=0;$reused=0;

    try{
        $db->begin_transaction();
        $find=$db->prepare('SELECT capture_id FROM gw_source_captures WHERE source_identity_fingerprint=? LIMIT 1');$find->execute([$sourceIdentity]);$old=$find->get_result()->fetch_assoc();$find->close();
        if($old){$captureId=(int)$old['capture_id'];$reused=1;}
        else{
            $db->query("INSERT IGNORE INTO gw_source_page_types(function_description,page_code,page_name,scope_status,url_pattern) VALUES('Soccer Manager player profile DOM captured by Player Codex','P14','Player Profile','CERTIFIED',NULL)");
            $page=$db->query("SELECT page_type_id FROM gw_source_page_types WHERE page_code='P14' LIMIT 1")->fetch_assoc();
            if(!$page) ingestion_fail('P14 source page type unavailable.',409);
            $ins=$db->prepare("INSERT INTO gw_source_captures(capture_json,capture_status,content_type,created_at,full_html,game_world_id,generated_at,hostname,language,origin,page_title,page_type_id,parser_version,pathname,ready_state,report_type,report_version,sm_game_world_id,source_file_name,source_file_sha256,source_identity_fingerprint,source_url,user_agent) VALUES(?,'COMPLETE','application/json',NOW(6),?,?,?,?,'it',?,?,?,?,?,'complete','PLAYER_CODEX',?,?,?,?,?,?,?)");
            $url=pc_text($body['source_url']??null,65535);$host=$url?parse_url($url,PHP_URL_HOST):null;$origin=$url&&preg_match('~^(https?://[^/]+)~i',$url,$m)?$m[1]:null;$path=$url?parse_url($url,PHP_URL_PATH):null;
            $ins->execute([$captureJson,$fullHtml,$gw,$captured,$host,$origin,pc_text($body['page_title']??null,255),(int)$page['page_type_id'],pc_text($record['version']??null,64),$path,pc_text($record['version']??null,32),$smWorld,$sourceFile,$payloadHash,$sourceIdentity,$url,pc_text($body['user_agent']??null,255)]);
            $captureId=(int)$db->insert_id;$ins->close();$createdNew=1;
            $pf=hash('sha256','PLAYER_CODEX|'.$playerId.'|'.$payloadHash);$pi=$db->prepare("INSERT INTO gw_source_payloads(capture_id,created_at,payload_fingerprint,payload_hash,payload_json,payload_key,payload_type) VALUES(?,NOW(6),?,?,?,?, 'PLAYER_CODEX')");
            $pi->execute([$captureId,$pf,$payloadHash,$payloadJson,$gw.'|'.$playerId]);$pi->close();
        }

        $existing=$db->prepare('SELECT gw_player_row_id FROM gw_players WHERE game_world_id=? AND player_id=? LIMIT 1');$existing->execute([$gw,$playerId]);$wasLocal=(bool)$existing->get_result()->fetch_assoc();$existing->close();
        $gp=$db->prepare('INSERT INTO gw_players(created_at,first_seen_capture_id,game_world_id,last_seen_capture_id,master_player_id,player_id,sm_game_world_id) VALUES(NOW(6),?,?,?,?,?,?) ON DUPLICATE KEY UPDATE last_seen_capture_id=VALUES(last_seen_capture_id),master_player_id=COALESCE(gw_players.master_player_id,VALUES(master_player_id)),sm_game_world_id=COALESCE(gw_players.sm_game_world_id,VALUES(sm_game_world_id))');
        $gp->execute([$captureId,$gw,$captureId,$masterId,$playerId,$smWorld]);$gp->close();

        $matchStatus=$masterId===null?'UNMATCHED':'MATCHED';$matchFp=hash('sha256','PLAYER|'.$gw.'|'.$playerId);$evidence=pc_json(['method'=>'EXACT_PLAYER_ID','player_id'=>$playerId]);
        $mi=$db->prepare("INSERT INTO gw_identity_matches(confidence,created_at,entity_type,evidence_json,game_world_id,identity_match_fingerprint,local_id,master_id,master_table,match_status,matched_at,matching_version,notes,sm_game_world_id,source_capture_id) VALUES('HIGH',NOW(6),'PLAYER',?,?,?,?,?,'players',?,NOW(6),'PLAYER_CODEX_EXACT_ID_V1',NULL,?,?) ON DUPLICATE KEY UPDATE evidence_json=VALUES(evidence_json),master_id=VALUES(master_id),match_status=VALUES(match_status),matched_at=VALUES(matched_at),source_capture_id=VALUES(source_capture_id)");
        $mi->execute([$evidence,$gw,$matchFp,(string)$playerId,$masterId===null?null:(string)$masterId,$matchStatus,$smWorld,$captureId]);$mi->close();

        $short=pc_text($record['playerName']??null,255);$name=pc_text($profile['fullName']??null,255);$dob=pc_date($profile['dateOfBirth']??null);
        $pr=$db->prepare('INSERT INTO gw_player_profile_snapshots(age,capture_id,created_at,date_of_birth,game_world_id,height,image_src,nation_code,observed_at,player_id,player_name,positions,preferred_foot,real_soccerwiki_club,short_name,sm_game_world_id,weight) VALUES(?,?,NOW(6),?,?,?,?,?,?, ?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE age=VALUES(age),date_of_birth=VALUES(date_of_birth),height=VALUES(height),image_src=VALUES(image_src),nation_code=VALUES(nation_code),observed_at=VALUES(observed_at),player_name=VALUES(player_name),positions=VALUES(positions),preferred_foot=VALUES(preferred_foot),real_soccerwiki_club=VALUES(real_soccerwiki_club),short_name=VALUES(short_name),weight=VALUES(weight)');
        $pr->execute([pc_nullable_uint($profile['age']??null),$captureId,$dob,$gw,pc_nullable_number($profile['heightCm']??null),pc_text($profile['imageUrl']??null,65535),pc_text($profile['nationality']??null,64),$captured,$playerId,$name,pc_text($profile['position']??null,255),pc_text($profile['foot']??null,64),pc_text($profile['soccerWikiClub']??null,255),$short,$smWorld,pc_nullable_number($profile['weightKg']??null)]);$pr->close();

        $fitness=pc_nullable_number($record['conditionRaw']??$roster['conditionRaw']??null);$morale=pc_nullable_number($record['moraleRaw']??$roster['moraleRaw']??null);
        $st=$db->prepare('INSERT INTO gw_player_state_snapshots(capture_id,contract,created_at,fitness,game_world_id,gw_season_row_id,imc_season,loan_status,morale,observed_at,player_id,previous_rating,rating,rating_delta,sm_game_world_id,sm_season_id,soccer_manager_season,squad_status,transfer_ban,transfer_ban_date,value,wage,world_club_id) VALUES(?,?,NOW(6),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE contract=VALUES(contract),fitness=VALUES(fitness),loan_status=VALUES(loan_status),morale=VALUES(morale),observed_at=VALUES(observed_at),previous_rating=VALUES(previous_rating),rating=VALUES(rating),rating_delta=VALUES(rating_delta),squad_status=VALUES(squad_status),transfer_ban=VALUES(transfer_ban),transfer_ban_date=VALUES(transfer_ban_date),value=VALUES(value),wage=VALUES(wage),world_club_id=VALUES(world_club_id)');
        $st->execute([$captureId,pc_text($profile['contractSeasons']??null,255),$fitness,$gw,$ctx['gw_season_row_id'],$ctx['imc_season'],pc_bool($roster['isLoaned']??null)===1?'LOANED':(pc_bool($roster['isLoaned']??null)===0?'NOT_LOANED':null),$morale,$captured,$playerId,pc_scalar_int($profile['oldRating']??null),pc_scalar_int($profile['rating']??null),pc_scalar_int($roster['ratingChange']??null),$smWorld,$ctx['sm_season_id'],$ctx['soccer_manager_season'],pc_text($roster['squadStatus']??null,64),pc_bool($roster['isTransferBanned']??null),pc_epoch_date($roster['transferBanRaw']??null),pc_nullable_number($roster['marketValueRaw']??null),pc_nullable_number($roster['salaryRaw']??null),$worldClubId]);$st->close();

        $squadFp=hash('sha256',$gw.'|'.$ctx['imc_season'].'|CLUB|'.$worldClubId.'|PLAYER_CODEX_CURRENT');
        $sq=$db->prepare("INSERT INTO gw_squads(capture_id,created_at,game_world_id,gw_season_row_id,imc_season,observed_at,owner_type,sm_game_world_id,sm_season_id,soccer_manager_season,squad_identity_fingerprint,world_club_id) VALUES(?,NOW(6),?,?,?,?,'CLUB',?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=VALUES(capture_id),observed_at=VALUES(observed_at)");
        $sq->execute([$captureId,$gw,$ctx['gw_season_row_id'],$ctx['imc_season'],$captured,$smWorld,$ctx['sm_season_id'],$ctx['soccer_manager_season'],$squadFp,$worldClubId]);$squadId=(int)($db->insert_id?:0);$sq->close();
        if($squadId===0){$q=$db->prepare('SELECT squad_snapshot_id FROM gw_squads WHERE squad_identity_fingerprint=?');$q->execute([$squadFp]);$squadId=(int)$q->get_result()->fetch_assoc()['squad_snapshot_id'];$q->close();}
        $section=pc_bool($roster['isYouth']??null)===1?'YOUTH':(pc_bool($roster['isYouth']??null)===0?'SENIOR':null);
        $member=$db->prepare('INSERT INTO gw_squad_members(created_at,game_world_id,player_id,raw_row_html,row_order,sm_game_world_id,squad_section,squad_snapshot_id) VALUES(NOW(6),?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE raw_row_html=VALUES(raw_row_html),row_order=VALUES(row_order),squad_section=VALUES(squad_section)');
        $member->execute([$gw,$playerId,$roster['rowHtml']??null,pc_nullable_uint($record['rowOrder']??null),$smWorld,$section,$squadId]);$member->close();

        $statFp=hash('sha256',$gw.'|'.$ctx['imc_season'].'|'.$playerId.'|ROSTER_AGGREGATE');
        $si=$db->prepare("INSERT INTO gw_player_stat_snapshots(appearances,assists,average_performance,capture_id,created_at,game_world_id,goals,gw_season_row_id,imc_season,international_appearances,international_assists,international_average,international_goals,international_mom,international_red,international_yellow,man_of_match,player_id,player_stat_identity_fingerprint,red_cards,scope_type,sm_game_world_id,sm_season_id,soccer_manager_season,yellow_cards) VALUES(?,?,?,?,NOW(6),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE appearances=VALUES(appearances),assists=VALUES(assists),average_performance=VALUES(average_performance),capture_id=VALUES(capture_id),goals=VALUES(goals),international_appearances=VALUES(international_appearances),international_assists=VALUES(international_assists),international_average=VALUES(international_average),international_goals=VALUES(international_goals),international_mom=VALUES(international_mom),international_red=VALUES(international_red),international_yellow=VALUES(international_yellow),man_of_match=VALUES(man_of_match),red_cards=VALUES(red_cards),yellow_cards=VALUES(yellow_cards)");
        $si->execute([pc_scalar_int($stats['appearances']??null),pc_scalar_int($stats['assists']??null),pc_nullable_number($stats['averagePerformance']??null),$captureId,$gw,pc_scalar_int($stats['goals']??null),$ctx['gw_season_row_id'],$ctx['imc_season'],pc_scalar_int($stats['internationalAppearances']??null),pc_scalar_int($stats['internationalAssists']??null),pc_nullable_number($stats['internationalAveragePerformance']??null),pc_scalar_int($stats['internationalGoals']??null),pc_scalar_int($stats['internationalManOfMatch']??null),pc_scalar_int($stats['internationalRedCards']??null),pc_scalar_int($stats['internationalYellowCards']??null),pc_scalar_int($stats['manOfMatch']??null),$playerId,$statFp,pc_scalar_int($stats['redCards']??null),'ROSTER_AGGREGATE',$smWorld,$ctx['sm_season_id'],$ctx['soccer_manager_season'],pc_scalar_int($stats['yellowCards']??null)]);$si->close();
        $db->commit();
        ingestion_reply(['ok'=>true,'action'=>'store_player','game_world_id'=>$gw,'player_id'=>$playerId,'capture_id'=>$captureId,'capture_new'=>$createdNew===1,'capture_reused'=>$reused===1,'master_player_id'=>$masterId,'master_match_status'=>$matchStatus,'local_player_new'=>!$wasLocal,'local_player_reused'=>$wasLocal,'world_club_id'=>$worldClubId,'squad_snapshot_id'=>$squadId,'persisted'=>true]);
    }catch(Throwable $e){try{$db->rollback();}catch(Throwable){}throw $e;}
}
function pc_count(mysqli $db,string $sql,array $args=[]): int {$q=$db->prepare($sql);$q->execute($args);$n=(int)$q->get_result()->fetch_row()[0];$q->close();return $n;}
function pc_audit(mysqli $db,string $gw): never {
    $tables=['gw_source_captures','gw_source_payloads','gw_players','gw_player_profile_snapshots','gw_player_state_snapshots','gw_squads','gw_squad_members','gw_player_stat_snapshots','gw_identity_matches'];
    $exists=[];foreach($tables as $t){$q=$db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?');$q->execute([$t]);$exists[$t]=(bool)$q->get_result()->fetch_row()[0];$q->close();}
    foreach($exists as $t=>$yes)if(!$yes)ingestion_fail('Audit table missing: '.$t,409);
    $captureWhere="game_world_id=? AND report_type='PLAYER_CODEX'";
    $captures=pc_count($db,"SELECT COUNT(*) FROM gw_source_captures WHERE $captureWhere",[$gw]);
    $payloads=pc_count($db,"SELECT COUNT(*) FROM gw_source_payloads p JOIN gw_source_captures c ON c.capture_id=p.capture_id WHERE c.game_world_id=? AND c.report_type='PLAYER_CODEX'",[$gw]);
    $received=pc_count($db,"SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(p.payload_json,'$.playerId'))) FROM gw_source_payloads p JOIN gw_source_captures c ON c.capture_id=p.capture_id WHERE c.game_world_id=? AND c.report_type='PLAYER_CODEX'",[$gw]);
    $players=pc_count($db,'SELECT COUNT(*) FROM gw_players WHERE game_world_id=?',[$gw]);
    $matched=pc_count($db,"SELECT COUNT(*) FROM gw_identity_matches WHERE game_world_id=? AND entity_type='PLAYER' AND match_status='MATCHED'",[$gw]);
    $unresolved=pc_count($db,"SELECT COUNT(*) FROM gw_identity_matches WHERE game_world_id=? AND entity_type='PLAYER' AND match_status<>'MATCHED'",[$gw]);
    $duplicates=['gw_players'=>pc_count($db,'SELECT COUNT(*) FROM (SELECT player_id FROM gw_players WHERE game_world_id=? GROUP BY player_id HAVING COUNT(*)>1) d',[$gw]),'squad_members'=>pc_count($db,'SELECT COUNT(*) FROM (SELECT squad_snapshot_id,player_id FROM gw_squad_members WHERE game_world_id=? GROUP BY squad_snapshot_id,player_id HAVING COUNT(*)>1) d',[$gw])];
    $artificial=pc_count($db,'SELECT COUNT(*) FROM gw_players WHERE game_world_id=? AND (player_id=0 OR player_id BETWEEN 800000000 AND 999999999)',[$gw]);
    $nulls=['master_player_id'=>pc_count($db,'SELECT COUNT(*) FROM gw_players WHERE game_world_id=? AND master_player_id IS NULL',[$gw]),'world_club_id_state'=>pc_count($db,'SELECT COUNT(*) FROM gw_player_state_snapshots WHERE game_world_id=? AND world_club_id IS NULL',[$gw]),'season_state'=>pc_count($db,'SELECT COUNT(*) FROM gw_player_state_snapshots WHERE game_world_id=? AND gw_season_row_id IS NULL',[$gw])];
    $counts=['captures'=>$captures,'payloads'=>$payloads,'players_received_distinct'=>$received,'players_persisted'=>$players,'master_matched'=>$matched,'master_unresolved'=>$unresolved,'world_relations'=>pc_count($db,'SELECT COUNT(*) FROM gw_players WHERE game_world_id=?',[$gw]),'world_club_relations'=>pc_count($db,'SELECT COUNT(*) FROM gw_player_state_snapshots WHERE game_world_id=? AND world_club_id IS NOT NULL',[$gw]),'rosters'=>pc_count($db,'SELECT COUNT(*) FROM gw_squads WHERE game_world_id=?',[$gw]),'roster_members'=>pc_count($db,'SELECT COUNT(*) FROM gw_squad_members WHERE game_world_id=?',[$gw]),'profiles'=>pc_count($db,'SELECT COUNT(*) FROM gw_player_profile_snapshots WHERE game_world_id=?',[$gw]),'states'=>pc_count($db,'SELECT COUNT(*) FROM gw_player_state_snapshots WHERE game_world_id=?',[$gw]),'statistics'=>pc_count($db,'SELECT COUNT(*) FROM gw_player_stat_snapshots WHERE game_world_id=?',[$gw])];
    ingestion_reply(['ok'=>true,'read_only'=>true,'action'=>'audit_player_codex','game_world_id'=>$gw,'database'=>(string)$db->query('SELECT DATABASE()')->fetch_row()[0],'counts'=>$counts,'received_minus_persisted'=>$received-$players,'null_unresolved'=>$nulls,'duplicates'=>$duplicates,'artificial_ids'=>$artificial,'pk_unique_fk'=>['duplicate_logical_keys'=>array_sum($duplicates),'orphan_captures'=>pc_count($db,"SELECT COUNT(*) FROM gw_players p LEFT JOIN gw_source_captures c ON c.capture_id=p.last_seen_capture_id WHERE p.game_world_id=? AND c.capture_id IS NULL",[$gw]),'orphan_squad_members'=>pc_count($db,'SELECT COUNT(*) FROM gw_squad_members m LEFT JOIN gw_squads s ON s.squad_snapshot_id=m.squad_snapshot_id WHERE m.game_world_id=? AND s.squad_snapshot_id IS NULL',[$gw])],'record_rejections_persisted'=>0,'errors_persisted'=>0,'note'=>'Rejected requests are returned synchronously and are not persisted by this read-only audit.']);
}
function player_codex_handle(mysqli $db,array $body,string $action): never {
    $gw=ingestion_world($body['game_world_id']??null);
    if($action==='resolve_club')pc_resolve_club($db,$body,$gw);
    if($action==='store_player')pc_store($db,$body,$gw);
    if($action==='audit_player_codex')pc_audit($db,$gw);
    ingestion_fail('Unknown player_codex action.',404);
}
