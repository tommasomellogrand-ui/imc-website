<?php
declare(strict_types=1);

function schedule_sha(array|string $value): string {
    $text = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $value;
    return hash('sha256', (string)$text);
}

function schedule_date(mixed $value, string $path): string {
    $date = ingestion_text($value, 10, false);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) ingestion_fail($path . ' invalid.');
    return $date;
}

function schedule_time(mixed $value, string $path): ?string {
    if ($value === null || trim((string)$value) === '') return null;
    $time = trim((string)$value);
    if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) ingestion_fail($path . ' invalid.');
    return $time . ':00';
}

function schedule_competitions(mysqli $db, string $gw): array {
    $q = $db->prepare('SELECT gw_competition_row_id,competition_name,competition_type,country_code,division_value,local_competition_id FROM gw_competitions WHERE game_world_id=? ORDER BY gw_competition_row_id');
    $q->bind_param('s', $gw); $q->execute();
    $rows = $q->get_result()->fetch_all(MYSQLI_ASSOC); $q->close();
    return array_map(static fn(array $r): array => [
        'competition_key'=>(string)$r['gw_competition_row_id'],
        'sm_action'=>$r['competition_type'],
        'sm_country'=>$r['country_code'],
        'IMC_league_divisions'=>$r['division_value'],
        'sm_division'=>$r['division_value'],
        'sm_compid'=>$r['local_competition_id'],
        'sm_competition_name'=>$r['competition_name'],
        'sm_round_label'=>null,
    ], $rows);
}

function schedule_setup(mysqli $db, array $body): never {
    $gw = ingestion_world($body['game_world_id'] ?? null);
    $requested = $body['imc_season'] ?? null;
    $imcSeason = $requested === null ? ingestion_current_imc_season($db, $gw) : ingestion_uint($requested, false);
    $ctx = ingestion_context($db, $gw, $imcSeason);
    ingestion_reply(['ok'=>true, 'type'=>'schedule', 'action'=>'setup'] + $ctx + ['competitions'=>schedule_competitions($db, $gw)]);
}

function schedule_page_type(mysqli $db): int {
    $code='SCHEDULE'; $description='Soccer Manager schedule page'; $name='Schedule'; $scope='ACTIVE';
    $q=$db->prepare('INSERT INTO gw_source_page_types(function_description,page_code,page_name,scope_status,url_pattern) VALUES(?,?,?,?,NULL) ON DUPLICATE KEY UPDATE page_type_id=LAST_INSERT_ID(page_type_id)');
    $q->bind_param('ssss',$description,$code,$name,$scope); $q->execute(); $id=(int)$db->insert_id; $q->close();
    if ($id < 1) {
        $s=$db->prepare('SELECT page_type_id FROM gw_source_page_types WHERE page_code=? LIMIT 1');
        $s->bind_param('s',$code); $s->execute(); $row=$s->get_result()->fetch_assoc(); $s->close();
        $id=$row?(int)$row['page_type_id']:0;
    }
    if ($id < 1) ingestion_fail('SCHEDULE page type bootstrap failed.', 500);
    return $id;
}

function schedule_ensure_competition(mysqli $db, array $row, string $gw, array $ctx): int {
    $key = ingestion_uint($row['competition_key'] ?? null);
    if ($key !== null) {
        $q=$db->prepare('SELECT gw_competition_row_id FROM gw_competitions WHERE game_world_id=? AND gw_competition_row_id=? LIMIT 1');
        $q->bind_param('si',$gw,$key); $q->execute(); $found=$q->get_result()->fetch_assoc(); $q->close();
        if ($found) return $key;
    }

    $action = strtolower((string)ingestion_text($row['sm_action'] ?? null, 64, false));
    $allowed = ['league','leaguecup','leagueshield','charityshield','smfacup','smfashield','supercup','interqualifier','worldcup'];
    if (!in_array($action, $allowed, true)) ingestion_fail('SCHEDULE competition action invalid.');
    $countryRaw = ingestion_text($row['sm_country'] ?? null, 255);
    $countryCode = $countryRaw !== null && strlen($countryRaw) <= 8 ? $countryRaw : null;
    $divisionRaw = ingestion_text($row['sm_division'] ?? null, 32);
    $division = null;
    if ($divisionRaw !== null && preg_match('/\d+/', $divisionRaw, $m)) $division = $m[0];
    $compid = ingestion_text($row['sm_compid'] ?? null, 64);
    $round = ingestion_text($row['sm_round_label'] ?? null, 255);
    $phase = $action === 'league' && $round !== null && preg_match('/^playoff\b/i', $round) ? 'playoff' : null;
    $identity = ['game_world_id'=>$gw,'sm_action'=>$action,'sm_country'=>$countryRaw,'sm_division'=>$division,'sm_compid'=>$compid,'phase'=>$phase];
    $fingerprint = schedule_sha($identity);
    $q=$db->prepare('INSERT INTO gw_competitions(competition_identity_fingerprint,competition_type,country_code,created_at,division_value,game_world_id,is_active,local_competition_id,sm_game_world_id) VALUES(?,?,?,NOW(6),?,?,1,?,?) ON DUPLICATE KEY UPDATE gw_competition_row_id=LAST_INSERT_ID(gw_competition_row_id)');
    $q->bind_param('ssssssi',$fingerprint,$action,$countryCode,$division,$gw,$compid,$ctx['sm_game_world_id']);
    $q->execute(); $id=(int)$db->insert_id; $q->close();
    if ($id < 1) {
        $s=$db->prepare('SELECT gw_competition_row_id FROM gw_competitions WHERE game_world_id=? AND competition_identity_fingerprint=? LIMIT 1');
        $s->bind_param('ss',$gw,$fingerprint); $s->execute(); $found=$s->get_result()->fetch_assoc(); $s->close();
        $id=$found?(int)$found['gw_competition_row_id']:0;
    }
    if ($id < 1) ingestion_fail('SCHEDULE competition bootstrap failed.', 500);
    return $id;
}

function schedule_entity_type(mixed $value, string $path): ?string {
    $type = ingestion_text($value, 16);
    if ($type !== null && !in_array($type, ['club','national'], true)) ingestion_fail($path . ' invalid.');
    return $type;
}

function schedule_ensure_club(mysqli $db, string $gw, mixed $rawId, ?string $type, ?string $name, int $smWorld): ?int {
    if ($type !== 'club') return null;
    $id = ingestion_uint($rawId);
    if ($id === null) return null;
    $q=$db->prepare('SELECT world_club_id FROM gw_world_clubs WHERE game_world_id=? AND world_club_id=? LIMIT 1');
    $q->bind_param('si',$gw,$id); $q->execute(); $found=$q->get_result()->fetch_assoc(); $q->close();
    if ($found) return $id;
    if ($name === null) return null;
    $insert=$db->prepare('INSERT INTO gw_world_clubs(club_name,created_at,game_world_id,sm_game_world_id,world_club_id) VALUES(?,NOW(6),?,?,?) ON DUPLICATE KEY UPDATE club_name=COALESCE(gw_world_clubs.club_name,VALUES(club_name))');
    $insert->bind_param('ssii',$name,$gw,$smWorld,$id); $insert->execute(); $insert->close();
    return $id;
}

function schedule_item(mysqli $db, array $row, int $index, string $gw, array $ctx): array {
    $allowed=['game_world_id','competition_id','competition_key','matchday_number','sm_fixture_id','match_date','match_time','home_team_id','home_entity_type','home_name','away_team_id','away_entity_type','away_name','sm_action','sm_division','sm_country','sm_compid','sm_round_label','raw_row_html','fixture_onclick','fixture_href','fixture_class','fixture_style','fixture_visible','home_onclick','home_href','away_onclick','away_href','home_manager','away_manager'];
    if ($unknown=array_diff(array_keys($row),$allowed)) ingestion_fail("items[$index] unknown field: ".reset($unknown));
    $itemGw=ingestion_world($row['game_world_id']??$gw);
    if ($itemGw !== $gw) ingestion_fail("items[$index].game_world_id mismatch.");
    $fixture=ingestion_uint($row['sm_fixture_id']??null,false);
    $date=schedule_date($row['match_date']??null,"items[$index].match_date");
    $time=schedule_time($row['match_time']??null,"items[$index].match_time");
    $homeName=ingestion_text($row['home_name']??null,255);
    $awayName=ingestion_text($row['away_name']??null,255);
    $homeType=schedule_entity_type($row['home_entity_type']??null,"items[$index].home_entity_type");
    $awayType=schedule_entity_type($row['away_entity_type']??null,"items[$index].away_entity_type");
    $competition=schedule_ensure_competition($db,$row,$gw,$ctx);
    $homeClub=schedule_ensure_club($db,$gw,$row['home_team_id']??null,$homeType,$homeName,$ctx['sm_game_world_id']);
    $awayClub=schedule_ensure_club($db,$gw,$row['away_team_id']??null,$awayType,$awayName,$ctx['sm_game_world_id']);
    $matchday=ingestion_uint($row['matchday_number']??null);
    return [
        'fixture_id'=>$fixture,'date'=>$date,'time'=>$time,'competition_id'=>$competition,
        'home_world_club_id'=>$homeClub,'away_world_club_id'=>$awayClub,'home_name'=>$homeName,'away_name'=>$awayName,
        'round_label'=>ingestion_text($row['sm_round_label']??null,255),'turn'=>$matchday===null?null:(string)$matchday,
        'raw_row_html'=>ingestion_text($row['raw_row_html']??null,1000000),'result_onclick'=>ingestion_text($row['fixture_onclick']??null,100000),
        'raw'=>$row,
    ];
}

function schedule_capture(mysqli $db, array $body, string $gw, array $items): int {
    $pageType=schedule_page_type($db);
    $ids=array_map(static fn(array $i): int=>$i['fixture_id'],$items); sort($ids,SORT_NUMERIC);
    $sourceContext=is_array($body['source_context']??null)?$body['source_context']:[];
    $identity=['type'=>'SCHEDULE','game_world_id'=>$gw,'imc_season'=>$body['imc_season'],'source_url'=>$body['source_url']??null,'heading'=>$sourceContext['heading_raw']??null,'fixtures'=>$ids];
    $fingerprint=schedule_sha($identity); $fileSha=schedule_sha(['capture'=>$identity]);
    $captureJson=json_encode(['source'=>'SCHEDULE_IMPORTER','identity'=>$identity,'source_context'=>$sourceContext],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $fullHtml=(string)($body['full_html']??'');
    if ($fullHtml==='') $fullHtml=implode("\n",array_map(static fn(array $i):string=>(string)($i['raw_row_html']??''),$items));
    $title=ingestion_text($body['source_title']??null,255); $url=ingestion_text($body['source_url']??null,4000);
    $version=ingestion_text($sourceContext['version']??null,64); $status='complete'; $report='SCHEDULE';
    $name='schedule_'.$gw.'_'.substr($fingerprint,0,16).'.json';
    $q=$db->prepare('INSERT INTO gw_source_captures(capture_json,capture_status,created_at,full_html,game_world_id,page_title,page_type_id,parser_version,report_type,source_file_name,source_file_sha256,source_identity_fingerprint,source_url) VALUES(?,?,NOW(6),?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=LAST_INSERT_ID(capture_id),page_title=VALUES(page_title),parser_version=VALUES(parser_version),source_url=VALUES(source_url)');
    $q->execute([$captureJson,$status,$fullHtml,$gw,$title,$pageType,$version,$report,$name,$fileSha,$fingerprint,$url]);
    $id=(int)$db->insert_id; $q->close();
    if ($id<1) ingestion_fail('SCHEDULE capture persistence failed.',500);
    return $id;
}

function schedule_dom_node(mysqli $db, int $capture, int $fixture, string $kind, array $data): void {
    $fingerprint=schedule_sha(['capture_id'=>$capture,'fixture_id'=>$fixture,'kind'=>$kind]);
    $attributes=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $tag='a'; $domId=$kind==='fixture'?'matchResult':($kind==='home'?'homeTeam':'awayTeam');
    $onclick=ingestion_text($data['onclick']??null,100000); $href=ingestion_text($data['href']??null,4000);
    $style=ingestion_text($data['style']??null,100000); $text=ingestion_text($data['text']??null,100000);
    $classes=json_encode(array_values(array_filter(preg_split('/\s+/',trim((string)($data['class_name']??'')))?:[])),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $q=$db->prepare('INSERT INTO gw_source_dom_nodes(attributes_json,capture_id,class_tokens,created_at,dom_id,dom_node_fingerprint,href,onclick,style,tag_name,text_raw) VALUES(?,?,?,NOW(6),?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE attributes_json=VALUES(attributes_json),class_tokens=VALUES(class_tokens),href=VALUES(href),onclick=VALUES(onclick),style=VALUES(style),text_raw=VALUES(text_raw)');
    $q->execute([$attributes,$capture,$classes,$domId,$fingerprint,$href,$onclick,$style,$tag,$text]); $q->close();
}

function schedule_store(mysqli $db, array $body): never {
    $gw=ingestion_world($body['game_world_id']??null);
    $imcSeason=ingestion_uint($body['imc_season']??null,false);
    $ctx=ingestion_context($db,$gw,$imcSeason);
    $rows=$body['items']??null;
    if (!is_array($rows)||!array_is_list($rows)||!$rows||count($rows)>500) ingestion_fail('items must contain 1..500 records.');
    $items=[]; $seen=[];
    foreach($rows as $i=>$row){
        if(!is_array($row)) ingestion_fail("items[$i] object required.");
        $item=schedule_item($db,$row,$i,$gw,$ctx);
        if(isset($seen[$item['fixture_id']])) ingestion_fail("items[$i] duplicated fixture.");
        $seen[$item['fixture_id']]=true; $items[]=$item;
    }
    $db->begin_transaction(); $inserted=0; $updated=0; $nationalSides=0; $unresolvedClubSides=0;
    try {
        $capture=schedule_capture($db,$body,$gw,$items);
        $payload=json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $payloadHash=hash('sha256',$payload); $payloadFingerprint=schedule_sha(['capture_id'=>$capture,'type'=>'SCHEDULE_BATCH']);
        $payloadKey=$gw.'|'.$imcSeason.'|'.substr($payloadFingerprint,0,16); $payloadType='SCHEDULE_BATCH';
        $p=$db->prepare('INSERT INTO gw_source_payloads(capture_id,created_at,payload_fingerprint,payload_hash,payload_json,payload_key,payload_text,payload_type) VALUES(?,NOW(6),?,?,?,?,?,?) ON DUPLICATE KEY UPDATE payload_hash=VALUES(payload_hash),payload_json=VALUES(payload_json),payload_text=VALUES(payload_text)');
        $p->execute([$capture,$payloadFingerprint,$payloadHash,$payload,$payloadKey,$payload,$payloadType]); $p->close();
        foreach($items as $item){
            $raw=$item['raw'];
            foreach(['home','away'] as $side){
                $type=$raw[$side.'_entity_type']??null;
                if($type==='national')$nationalSides++;
                if($type==='club'&&$item[$side.'_world_club_id']===null)$unresolvedClubSides++;
            }
            $status='scheduled';
            $q=$db->prepare('INSERT INTO gw_fixtures(away_name,away_world_club_id,capture_id,competition_id,created_at,date,fixture_id,game_world_id,gw_season_row_id,home_name,home_world_club_id,imc_season,raw_row_html,result_onclick,round_label,sm_game_world_id,sm_season_id,soccer_manager_season,status,time,turn) VALUES(?,?,?,?,NOW(6),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE fixture_row_id=LAST_INSERT_ID(fixture_row_id),away_name=VALUES(away_name),away_world_club_id=VALUES(away_world_club_id),capture_id=VALUES(capture_id),competition_id=VALUES(competition_id),date=VALUES(date),gw_season_row_id=VALUES(gw_season_row_id),home_name=VALUES(home_name),home_world_club_id=VALUES(home_world_club_id),imc_season=VALUES(imc_season),raw_row_html=VALUES(raw_row_html),result_onclick=VALUES(result_onclick),round_label=VALUES(round_label),sm_game_world_id=VALUES(sm_game_world_id),sm_season_id=VALUES(sm_season_id),soccer_manager_season=VALUES(soccer_manager_season),status=IF(status=\'played\',status,VALUES(status)),time=VALUES(time),turn=VALUES(turn)');
            $q->execute([$item['away_name'],$item['away_world_club_id'],$capture,$item['competition_id'],$item['date'],$item['fixture_id'],$gw,$ctx['gw_season_row_id'],$item['home_name'],$item['home_world_club_id'],$ctx['imc_season'],$item['raw_row_html'],$item['result_onclick'],$item['round_label'],$ctx['sm_game_world_id'],$ctx['sm_season_id'],$ctx['soccer_manager_season'],$status,$item['time'],$item['turn']]);
            $q->affected_rows===1?$inserted++:$updated++; $q->close();
            schedule_dom_node($db,$capture,$item['fixture_id'],'fixture',['onclick'=>$raw['fixture_onclick']??null,'href'=>$raw['fixture_href']??null,'class_name'=>$raw['fixture_class']??null,'style'=>$raw['fixture_style']??null,'visible'=>$raw['fixture_visible']??null,'text'=>$raw['match_time']??null]);
            schedule_dom_node($db,$capture,$item['fixture_id'],'home',['onclick'=>$raw['home_onclick']??null,'href'=>$raw['home_href']??null,'entity_type'=>$raw['home_entity_type']??null,'team_id'=>$raw['home_team_id']??null,'text'=>$raw['home_name']??null,'manager'=>$raw['home_manager']??null]);
            schedule_dom_node($db,$capture,$item['fixture_id'],'away',['onclick'=>$raw['away_onclick']??null,'href'=>$raw['away_href']??null,'entity_type'=>$raw['away_entity_type']??null,'team_id'=>$raw['away_team_id']??null,'text'=>$raw['away_name']??null,'manager'=>$raw['away_manager']??null]);
        }
        $db->commit();
        ingestion_reply(['ok'=>true,'type'=>'schedule','action'=>'store_schedule','stored'=>count($items),'inserted_fixtures'=>$inserted,'updated_fixtures'=>$updated,'skipped'=>0,'capture_id'=>$capture,'national_sides_preserved_raw'=>$nationalSides,'unresolved_club_sides'=>$unresolvedClubSides] + $ctx);
    } catch(Throwable $e) {
        $db->rollback(); ingestion_fail('SCHEDULE transaction failed: '.$e->getMessage(),500);
    }
}

function schedule_audit_rows(mysqli $db, string $sql, array $params = []): array {
    $q=$db->prepare($sql);
    $q->execute($params);
    $rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);
    $q->close();
    return $rows;
}

function schedule_audit_is_set(mixed $value): bool {
    return $value !== null && (!is_string($value) || trim($value) !== '');
}

function schedule_audit_column_stats(array $rows, array $columns): array {
    $out=[];
    foreach($columns as $column)$out[$column]=['set'=>0,'null'=>0];
    foreach($rows as $row)foreach($columns as $column){
        if(schedule_audit_is_set($row[$column]??null))$out[$column]['set']++;
        else $out[$column]['null']++;
    }
    return $out;
}

function schedule_audit_by_ids(mysqli $db, string $gw, array $ids, string $select, string $table): array {
    $out=[];
    foreach(array_chunk(array_values($ids),400) as $chunk){
        $marks=implode(',',array_fill(0,count($chunk),'?'));
        $rows=schedule_audit_rows($db,"SELECT $select FROM `$table` WHERE game_world_id=? AND fixture_id IN ($marks)",array_merge([$gw],$chunk));
        foreach($rows as $row)$out[]=$row;
    }
    return $out;
}

function schedule_audit(mysqli $db, array $body): never {
    $gw=ingestion_world($body['game_world_id']??null);
    $imcSeason=isset($body['imc_season'])?ingestion_uint($body['imc_season'],false):ingestion_current_imc_season($db,$gw);
    $database=(string)(schedule_audit_rows($db,'SELECT DATABASE() database_name')[0]['database_name']??'');
    $multi=['GW002','GW003','GW007','GW008'];
    $single=['GW001','GW004','GW005','GW006','GW009'];
    $expectedDatabase=in_array($gw,$multi,true)?'Sql1956795_2':'Sql1956795_3';
    $expectedWorlds=$expectedDatabase==='Sql1956795_2'?$multi:$single;

    $payloadRows=schedule_audit_rows($db,"SELECT p.source_payload_id,p.capture_id,p.created_at payload_created_at,p.payload_json,c.created_at capture_created_at,c.parser_version,c.capture_status FROM gw_source_payloads p JOIN gw_source_captures c ON c.capture_id=p.capture_id WHERE c.game_world_id=? AND c.report_type='SCHEDULE' AND p.payload_type='SCHEDULE_BATCH' ORDER BY c.created_at,p.source_payload_id",[$gw]);
    $payloadFields=['game_world_id','competition_id','competition_key','matchday_number','sm_fixture_id','match_date','match_time','home_team_id','home_entity_type','home_name','away_team_id','away_entity_type','away_name','sm_action','sm_division','sm_country','sm_compid','sm_round_label','raw_row_html','fixture_onclick','fixture_href','fixture_class','fixture_style','fixture_visible','home_onclick','home_href','away_onclick','away_href','home_manager','away_manager','stage','round','group'];
    $payloadStats=[]; foreach($payloadFields as $field)$payloadStats[$field]=['set'=>0,'null'=>0];
    $envelopeFields=['type','action','game_world_id','imc_season','source_url','source_title','source_context','full_html'];
    $envelopeStats=[]; foreach($envelopeFields as $field)$envelopeStats[$field]=['set'=>0,'null'=>0];
    $received=0;$invalidPayloads=0;$invalidFixtureIds=0;$fixtureOccurrences=[];$firstCapture=[];$latestItems=[];$captureIds=[];$payloadIds=[];$actions=[];$countries=[];$divisions=[];
    foreach($payloadRows as $payloadRow){
        try{$decoded=json_decode((string)$payloadRow['payload_json'],true,64,JSON_THROW_ON_ERROR);}catch(Throwable){$invalidPayloads++;continue;}
        if(!is_array($decoded)||(int)($decoded['imc_season']??0)!==$imcSeason)continue;
        $capture=(int)$payloadRow['capture_id'];$captureIds[$capture]=true;$payloadIds[(int)$payloadRow['source_payload_id']]=true;
        foreach($envelopeFields as $field){$bucket=schedule_audit_is_set($decoded[$field]??null)?'set':'null';$envelopeStats[$field][$bucket]++;}
        $items=$decoded['items']??null;
        if(!is_array($items)){ $invalidPayloads++; continue; }
        foreach($items as $item){
            if(!is_array($item)){ $invalidPayloads++; continue; }
            $received++;
            foreach($payloadFields as $field){$bucket=schedule_audit_is_set($item[$field]??null)?'set':'null';$payloadStats[$field][$bucket]++;}
            $id=(int)($item['sm_fixture_id']??0);
            if($id<1){$invalidFixtureIds++;continue;}
            $fixtureOccurrences[$id]=($fixtureOccurrences[$id]??0)+1;
            $created=(string)$payloadRow['capture_created_at'];
            if(!isset($firstCapture[$id])||$created<$firstCapture[$id])$firstCapture[$id]=$created;
            $latestItems[$id]=$item;
            $action=strtolower(trim((string)($item['sm_action']??'')));if($action!=='')$actions[$action]=($actions[$action]??0)+1;
            $country=trim((string)($item['sm_country']??''));if($country!=='')$countries[$country]=($countries[$country]??0)+1;
            $division=trim((string)($item['sm_division']??''));if($division!=='')$divisions[$division]=($divisions[$division]??0)+1;
        }
    }
    ksort($actions);ksort($countries);ksort($divisions);
    $fixtureIds=array_keys($fixtureOccurrences);sort($fixtureIds,SORT_NUMERIC);
    $fixtureSelect='fixture_row_id,fixture_id,capture_id,competition_id,competition_group_id,competition_round_id,competition_stage_id,competition_name,date,time,home_name,away_name,home_world_club_id,away_world_club_id,imc_season,gw_season_row_id,round_label,sm_game_world_id,sm_season_id,soccer_manager_season,status,turn,created_at,(raw_row_html IS NOT NULL AND raw_row_html<>\'\') raw_row_html_set,(result_onclick IS NOT NULL AND result_onclick<>\'\') result_onclick_set,attendance,home_away_flag,next_fixture_countdown,venue_id,venue_name';
    $fixtureRows=$fixtureIds?schedule_audit_by_ids($db,$gw,$fixtureIds,$fixtureSelect,'gw_fixtures'):[];
    $fixtures=[];foreach($fixtureRows as $row)$fixtures[(int)$row['fixture_id']]=$row;
    $fixtureFields=['fixture_id','game_world_id','imc_season','soccer_manager_season','sm_game_world_id','sm_season_id','date','time','home_name','away_name','home_world_club_id','away_world_club_id','competition_id','competition_name','competition_group_id','competition_round_id','competition_stage_id','round_label','status','turn','raw_row_html_set','result_onclick_set','attendance','home_away_flag','next_fixture_countdown','venue_id','venue_name'];
    foreach($fixtureRows as &$fixtureRow)$fixtureRow['game_world_id']=$gw;unset($fixtureRow);
    $fixtureStats=schedule_audit_column_stats($fixtureRows,$fixtureFields);

    $insertedUnique=0;$updatedPreexistingUnique=0;$repeatedUpdateOperations=0;$missingUnique=0;$missingRecords=0;
    foreach($fixtureOccurrences as $id=>$occurrences){
        if(!isset($fixtures[$id])){$missingUnique++;$missingRecords+=$occurrences;continue;}
        $created=(string)$fixtures[$id]['created_at'];
        if($created!==''&&isset($firstCapture[$id])&&$created<$firstCapture[$id]){$updatedPreexistingUnique++;$repeatedUpdateOperations+=$occurrences;}
        else{$insertedUnique++;$repeatedUpdateOperations+=max(0,$occurrences-1);}
    }

    $resultRows=$fixtureIds?schedule_audit_by_ids($db,$gw,$fixtureIds,'fixture_id,capture_id,fixture_result_id','gw_fixture_results'):[];
    $resultFixtures=[];$resultRowsOnScheduleCapture=0;
    $scheduleCaptureLookup=$captureIds;
    foreach($resultRows as $row){$resultFixtures[(int)$row['fixture_id']]=true;if(isset($scheduleCaptureLookup[(int)$row['capture_id']]))$resultRowsOnScheduleCapture++;}
    $enriched=0;$enrichmentFields=['date'=>0,'time'=>0,'home_name'=>0,'away_name'=>0,'home_world_club_id'=>0,'away_world_club_id'=>0,'competition_id'=>0,'round_label'=>0,'turn'=>0,'raw_row_html'=>0,'result_onclick'=>0,'status_played_preserved'=>0];
    foreach($resultFixtures as $id=>$_){if(!isset($fixtures[$id]))continue;$enriched++;$f=$fixtures[$id];foreach(['date','time','home_name','away_name','home_world_club_id','away_world_club_id','competition_id','round_label','turn'] as $field)if(schedule_audit_is_set($f[$field]??null))$enrichmentFields[$field]++;if((int)$f['raw_row_html_set']===1)$enrichmentFields['raw_row_html']++;if((int)$f['result_onclick_set']===1)$enrichmentFields['result_onclick']++;if((string)$f['status']==='played')$enrichmentFields['status_played_preserved']++;}

    $nationalSides=0;$nationalContamination=0;$clubSides=0;$clubUnresolved=0;$clubMismatched=0;$unknownSides=0;
    foreach($latestItems as $id=>$item){if(!isset($fixtures[$id]))continue;$f=$fixtures[$id];foreach(['home','away'] as $side){$type=$item[$side.'_entity_type']??null;$column=$side.'_world_club_id';if($type==='national'){$nationalSides++;if($f[$column]!==null)$nationalContamination++;}elseif($type==='club'){$clubSides++;if($f[$column]===null)$clubUnresolved++;elseif(isset($item[$side.'_team_id'])&&(int)$item[$side.'_team_id']>0&&(int)$f[$column]!== (int)$item[$side.'_team_id'])$clubMismatched++;}else $unknownSides++;}}

    $duplicateFixtures=schedule_audit_rows($db,'SELECT fixture_id,COUNT(*) copies FROM gw_fixtures WHERE game_world_id=? GROUP BY fixture_id HAVING COUNT(*)>1',[$gw]);
    $duplicateCompetitionFingerprints=schedule_audit_rows($db,'SELECT competition_identity_fingerprint,COUNT(*) copies FROM gw_competitions WHERE game_world_id=? GROUP BY competition_identity_fingerprint HAVING COUNT(*)>1',[$gw]);
    $fk=schedule_audit_rows($db,'SELECT SUM(s.gw_season_row_id IS NULL) season_fk_unresolved,SUM(c.gw_competition_row_id IS NULL) competition_fk_unresolved,SUM(f.home_world_club_id IS NOT NULL AND hc.world_club_id IS NULL) home_club_fk_unresolved,SUM(f.away_world_club_id IS NOT NULL AND ac.world_club_id IS NULL) away_club_fk_unresolved,SUM(sc.capture_id IS NULL) capture_fk_unresolved FROM gw_fixtures f LEFT JOIN gw_seasons s ON s.gw_season_row_id=f.gw_season_row_id LEFT JOIN gw_competitions c ON c.gw_competition_row_id=f.competition_id LEFT JOIN gw_world_clubs hc ON hc.game_world_id=f.game_world_id AND hc.world_club_id=f.home_world_club_id LEFT JOIN gw_world_clubs ac ON ac.game_world_id=f.game_world_id AND ac.world_club_id=f.away_world_club_id LEFT JOIN gw_source_captures sc ON sc.capture_id=f.capture_id WHERE f.game_world_id=? AND f.imc_season=?',[$gw,$imcSeason]);
    $seasonConsistency=schedule_audit_rows($db,'SELECT COUNT(*) fixture_rows,SUM(s.gw_season_row_id IS NULL) missing_season,SUM(s.game_world_id<>f.game_world_id OR s.imc_season<>f.imc_season OR s.soccer_manager_season<>f.soccer_manager_season OR NOT(s.sm_game_world_id<=>f.sm_game_world_id) OR NOT(s.sm_season_id<=>f.sm_season_id)) context_mismatches FROM gw_fixtures f LEFT JOIN gw_seasons s ON s.gw_season_row_id=f.gw_season_row_id WHERE f.game_world_id=? AND f.imc_season=?',[$gw,$imcSeason]);
    $seasons=schedule_audit_rows($db,'SELECT * FROM gw_seasons WHERE game_world_id=? ORDER BY imc_season,gw_season_row_id',[$gw]);
    $core=schedule_audit_rows($db,'SELECT w.game_world_id,w.sm_game_world_id,s.imc_season,s.soccer_manager_season,s.imc_season_start_date,s.imc_season_end_date FROM Sql1956795_1.imc_game_worlds w JOIN Sql1956795_1.imc_game_world_seasons s ON s.game_world_id=w.game_world_id WHERE w.game_world_id=? AND s.imc_season=?',[$gw,$imcSeason]);
    $competitionReferences=[];foreach($fixtureRows as $fixtureRow)if($fixtureRow['competition_id']!==null){$competitionId=(int)$fixtureRow['competition_id'];$competitionReferences[$competitionId]=($competitionReferences[$competitionId]??0)+1;}
    $competitions=schedule_audit_rows($db,'SELECT * FROM gw_competitions WHERE game_world_id=? ORDER BY gw_competition_row_id',[$gw]);
    foreach($competitions as &$competition)$competition['schedule_received_fixtures']=$competitionReferences[(int)$competition['gw_competition_row_id']]??0;unset($competition);
    $scheduleStart=$captureIds?min(array_map(static fn(array $r):string=>(string)$r['capture_created_at'],array_filter($payloadRows,static function(array $r)use($captureIds):bool{return isset($captureIds[(int)$r['capture_id']]);}))):null;
    $competitionCreated=0;$competitionReused=0;$scheduleArtificialCompetitionIds=0;
    foreach($competitions as $competition){if((int)$competition['schedule_received_fixtures']<1)continue;if($scheduleStart!==null&&(string)$competition['created_at']>=$scheduleStart){$competitionCreated++;if($competition['competition_id']!==null)$scheduleArtificialCompetitionIds++;}else $competitionReused++;}
    $clubIds=[];foreach($latestItems as $item)foreach(['home','away'] as $side)if(($item[$side.'_entity_type']??null)==='club'&&(int)($item[$side.'_team_id']??0)>0)$clubIds[(int)$item[$side.'_team_id']]=true;
    $clubRows=[];foreach(array_chunk(array_keys($clubIds),400) as $chunk){$marks=implode(',',array_fill(0,count($chunk),'?'));$clubRows=array_merge($clubRows,schedule_audit_rows($db,"SELECT world_club_id,created_at,club_name,master_club_id FROM gw_world_clubs WHERE game_world_id=? AND world_club_id IN ($marks)",array_merge([$gw],$chunk)));}
    $clubsCreated=0;foreach($clubRows as $club)if($scheduleStart!==null&&(string)$club['created_at']>=$scheduleStart)$clubsCreated++;

    $domBuckets=[];$issues=[];
    foreach(array_chunk(array_keys($captureIds),400) as $chunk){
        $marks=implode(',',array_fill(0,count($chunk),'?'));
        $domRows=schedule_audit_rows($db,"SELECT dom_id,attributes_json,onclick,href,text_raw FROM gw_source_dom_nodes WHERE capture_id IN ($marks)",$chunk);
        foreach($domRows as $node){$key=(string)($node['dom_id']??'NULL');if(!isset($domBuckets[$key]))$domBuckets[$key]=['dom_id'=>$node['dom_id'],'rows_count'=>0,'attributes_set'=>0,'onclick_set'=>0,'href_set'=>0,'text_set'=>0];$domBuckets[$key]['rows_count']++;foreach(['attributes','onclick','href','text'] as $field){$source=$field==='attributes'?'attributes_json':($field==='text'?'text_raw':$field);if(schedule_audit_is_set($node[$source]??null))$domBuckets[$key][$field.'_set']++;}}
        $issues=array_merge($issues,schedule_audit_rows($db,"SELECT import_issue_id,issue_code,severity,message,capture_id FROM gw_import_issues WHERE capture_id IN ($marks) ORDER BY import_issue_id",$chunk));
    }
    ksort($domBuckets);$dom=array_values($domBuckets);
    $distribution=schedule_audit_rows($db,"SELECT c.game_world_id,COUNT(DISTINCT c.capture_id) captures,COUNT(DISTINCT p.source_payload_id) payloads,COALESCE(SUM(JSON_LENGTH(p.payload_json,'$.items')),0) received_records FROM gw_source_captures c LEFT JOIN gw_source_payloads p ON p.capture_id=c.capture_id AND p.payload_type='SCHEDULE_BATCH' WHERE c.report_type='SCHEDULE' GROUP BY c.game_world_id ORDER BY c.game_world_id");
    $unexpected=[];foreach($distribution as $row)if(!in_array((string)$row['game_world_id'],$expectedWorlds,true))$unexpected[]=$row;
    $constraints=schedule_audit_rows($db,"SELECT tc.TABLE_NAME,tc.CONSTRAINT_NAME,tc.CONSTRAINT_TYPE,GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) columns_list,kcu.REFERENCED_TABLE_NAME,GROUP_CONCAT(kcu.REFERENCED_COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) referenced_columns FROM information_schema.TABLE_CONSTRAINTS tc LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND kcu.TABLE_NAME=tc.TABLE_NAME AND kcu.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.CONSTRAINT_SCHEMA=? AND tc.TABLE_NAME IN ('gw_game_worlds','gw_seasons','gw_competitions','gw_world_clubs','gw_source_page_types','gw_source_captures','gw_source_payloads','gw_source_dom_nodes','gw_fixtures','gw_fixture_results') GROUP BY tc.TABLE_NAME,tc.CONSTRAINT_NAME,tc.CONSTRAINT_TYPE,kcu.REFERENCED_TABLE_NAME ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_TYPE,tc.CONSTRAINT_NAME",[$database]);
    $constraintSummary=['PRIMARY KEY'=>0,'UNIQUE'=>0,'FOREIGN KEY'=>0];foreach($constraints as $constraint)if(isset($constraintSummary[$constraint['CONSTRAINT_TYPE']]))$constraintSummary[$constraint['CONSTRAINT_TYPE']]++;
    $tableCounts=[
        'gw_source_page_types'=>count(schedule_audit_rows($db,"SELECT page_type_id FROM gw_source_page_types WHERE page_code='SCHEDULE'")),
        'gw_source_captures'=>count($captureIds),'gw_source_payloads'=>count($payloadIds),
        'gw_source_dom_nodes'=>array_sum(array_map(static fn(array $r):int=>(int)$r['rows_count'],$dom)),
        'gw_fixtures'=>count($fixtures),'gw_fixture_results'=>count($resultRows),
        'gw_competitions_referenced'=>count(array_filter($competitions,static fn(array $r):bool=>(int)$r['schedule_received_fixtures']>0)),
        'gw_seasons'=>count(array_filter($seasons,static fn(array $r):bool=>(int)$r['imc_season']===$imcSeason)),
        'gw_world_clubs_referenced'=>count($clubRows),
    ];
    $duplicateReceivedRecords=0;foreach($fixtureOccurrences as $occurrences)$duplicateReceivedRecords+=max(0,$occurrences-1);
    ingestion_reply([
        'ok'=>true,'type'=>'schedule','action'=>'audit_schedule','read_only'=>true,'database'=>$database,'expected_database'=>$expectedDatabase,'routing_correct'=>$database===$expectedDatabase,'game_world_id'=>$gw,'imc_season'=>$imcSeason,
        'gateway_received'=>['persisted_captures'=>count($captureIds),'persisted_payloads'=>count($payloadIds),'received_records'=>$received,'distinct_received_fixtures'=>count($fixtureIds),'duplicate_received_records'=>$duplicateReceivedRecords,'invalid_payloads'=>$invalidPayloads,'invalid_fixture_ids'=>$invalidFixtureIds],
        'persistence'=>['persisted_unique_fixtures'=>count($fixtures),'inserted_unique_fixtures_reconstructed'=>$insertedUnique,'preexisting_updated_unique_fixtures_reconstructed'=>$updatedPreexistingUnique,'repeat_update_operations_reconstructed'=>$repeatedUpdateOperations,'received_records_without_current_fixture'=>$missingRecords,'received_unique_fixtures_without_current_fixture'=>$missingUnique],
        'table_counts'=>$tableCounts,'payload_field_population'=>$payloadStats,'envelope_field_population'=>$envelopeStats,'fixture_column_population'=>$fixtureStats,'competition_context_distribution'=>['sm_action'=>$actions,'sm_country'=>$countries,'sm_division'=>$divisions],'dom_nodes'=>$dom,
        'results_enrichment'=>['fixtures_with_existing_results'=>$enriched,'same_logical_fixture_rows'=>$enriched,'result_rows_linked_to_schedule_capture'=>$resultRowsOnScheduleCapture,'enriched_field_population'=>$enrichmentFields],
        'club_national_separation'=>['national_sides'=>$nationalSides,'national_ids_in_world_club_columns'=>$nationalContamination,'club_sides'=>$clubSides,'unresolved_club_sides'=>$clubUnresolved,'mismatched_club_ids'=>$clubMismatched,'unknown_entity_type_sides'=>$unknownSides],
        'competitions'=>['rows'=>$competitions,'created_during_schedule_window'=>$competitionCreated,'reused_preexisting'=>$competitionReused,'duplicate_fingerprints'=>$duplicateCompetitionFingerprints,'schedule_created_rows_with_external_competition_id'=>$scheduleArtificialCompetitionIds],
        'seasons'=>['target_rows'=>$seasons,'core_context'=>$core,'fixture_context_check'=>$seasonConsistency[0]??null],
        'keys'=>['summary'=>$constraintSummary,'constraints'=>$constraints,'fk_unresolved'=>$fk[0]??null],
        'duplicates'=>['fixture_rows'=>$duplicateFixtures,'received_repetitions'=>$duplicateReceivedRecords],
        'ids'=>['invalid_fixture_ids'=>$invalidFixtureIds,'orphan_fk_ids'=>array_sum(array_map('intval',array_values($fk[0]??[]))),'artificial_ids_generated_by_schedule'=>$scheduleArtificialCompetitionIds],
        'source'=>['schedule_start'=>$scheduleStart,'captures'=>count($captureIds),'payloads'=>count($payloadIds),'dom_nodes'=>$tableCounts['gw_source_dom_nodes']],
        'errors'=>['recorded_import_issues'=>$issues,'recorded_issue_count'=>count($issues)],
        'database_schedule_distribution'=>$distribution,'wrong_database_schedule_rows'=>$unexpected,
        'bootstrap'=>['competition_rows_created'=>$competitionCreated,'competition_rows_reused'=>$competitionReused,'world_club_rows_created_during_schedule_window'=>$clubsCreated,'world_club_rows_referenced'=>count($clubRows)],
        'limitations'=>['http_requests_are_not_logged_separately_from_idempotent_payload_rows'=>true,'rolled_back_or_rejected_requests_are_not_queryable'=>true,'insert_vs_update_counts_are_reconstructed_from_created_at_and_first_persisted_schedule_capture'=>true,'fixture_rows_have_no_updated_at'=>true,'stage_and_group_have_no_dedicated_schedule_fixture_mapping'=>true,'results_field_values_have_no_pre_schedule_snapshot_for_bytewise_comparison'=>true],
    ]);
}

function schedule_handle(mysqli $db, array $body, string $action): never {
    if ($action==='setup') schedule_setup($db,$body);
    if ($action==='store_schedule') schedule_store($db,$body);
    if ($action==='audit_schedule') schedule_audit($db,$body);
    ingestion_fail('Unknown SCHEDULE action.',404);
}
