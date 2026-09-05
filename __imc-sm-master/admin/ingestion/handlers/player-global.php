<?php
declare(strict_types=1);

function pg_json(mixed $value): string {
    return json_encode($value, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE|JSON_THROW_ON_ERROR);
}
function pg_text(mixed $value,int $max,bool $required=false): ?string {
    $s=trim((string)($value??''));
    if(($required&&$s==='')||mb_strlen($s)>$max) ingestion_fail('Player Global text field invalid.');
    return $s===''?null:$s;
}
function pg_uint(mixed $value,bool $nullable=true): ?int {
    if(($value===null||$value==='')&&$nullable)return null;
    if(!is_int($value)&&!(is_string($value)&&ctype_digit($value)))ingestion_fail('Player Global unsigned integer invalid.');
    $n=(int)$value;if($n<1||$n>4294967295)ingestion_fail('Player Global unsigned integer out of range.');return $n;
}
function pg_sint(mixed $value,bool $nullable=true): ?int {
    if(($value===null||$value==='')&&$nullable)return null;
    if(!is_int($value)&&!(is_string($value)&&preg_match('/^-?\d+$/',$value)))ingestion_fail('Player Global integer invalid.');
    return (int)$value;
}
function pg_date(mixed $value,bool $nullable=true): ?string {
    $s=trim((string)($value??''));if($s===''&&$nullable)return null;
    $d=DateTimeImmutable::createFromFormat('!Y-m-d',$s);
    if(!$d||$d->format('Y-m-d')!==$s)ingestion_fail('Player Global date invalid.');
    return $s;
}
function pg_datetime(mixed $value): string {
    try{$d=new DateTimeImmutable((string)$value);}catch(Throwable){ingestion_fail('Player Global captured_at invalid.');}
    return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.u');
}
function pg_money(mixed $value): ?int {
    if(is_int($value))return $value>=0?$value:null;
    $s=mb_strtolower(trim((string)($value??'')));
    if($s==='')return null;
    $s=preg_replace('/\s+/u','',$s);
    $s=preg_replace('/[^0-9,\.kmb-]/u','',$s);
    if(preg_match('/^(-?[0-9]+(?:[\.,][0-9]+)?)([kmb])?$/i',$s,$m)){
        $n=(float)str_replace(',','.',$m[1]);
        $factor=match(strtolower($m[2]??'')){'k'=>1000,'m'=>1000000,'b'=>1000000000,default=>1};
        $out=(int)round($n*$factor);return $out>=0?$out:null;
    }
    return null;
}
function pg_name_parts(string $fullName): array {
    $parts=preg_split('/\s+/u',trim($fullName))?:[];
    if(count($parts)<2)return [$fullName,''];
    $surnameAt=null;
    foreach($parts as $i=>$part){
        if($i===0)continue;
        $letters=preg_replace('/[^\p{L}]/u','',$part);
        if($letters!==''&&$letters===mb_strtoupper($letters,'UTF-8')){$surnameAt=$i;break;}
    }
    if($surnameAt===null)$surnameAt=count($parts)-1;
    return [implode(' ',array_slice($parts,0,$surnameAt)),implode(' ',array_slice($parts,$surnameAt))];
}
function pg_image_parts(?string $url): array {
    if($url===null)return ['',''];
    $absolute=str_starts_with($url,'//')?'https:'.$url:$url;
    $path=(string)(parse_url($absolute,PHP_URL_PATH)??'');
    $file=basename($path);$base=$file!==''?substr($absolute,0,max(0,strlen($absolute)-strlen($file))):$absolute;
    return [mb_substr($file,0,255),mb_substr($base,0,500)];
}
function pg_run_snapshot(mysqli $db,string $runUuid,string $observedDate): int {
    $sha=hash('sha256','PLAYER_GLOBAL|'.$runUuid);
    $filename='player-global-'.$runUuid.'.json';
    $q=$db->prepare("INSERT IGNORE INTO source_snapshots(source_code,snapshot_date,source_filename,sha256,file_size,imported_at,status,counts_json,error_message) VALUES('SM_PLAYER_GLOBAL',?,?,?,0,NULL,'running',JSON_OBJECT('processed',0),NULL)");
    $q->execute([$observedDate,$filename,$sha]);$q->close();
    $q=$db->prepare("SELECT snapshot_id FROM source_snapshots WHERE source_code='SM_PLAYER_GLOBAL' AND sha256=? LIMIT 1");
    $q->execute([$sha]);$row=$q->get_result()->fetch_assoc();$q->close();
    if(!$row)ingestion_fail('Player Global source snapshot unavailable.',500);
    return (int)$row['snapshot_id'];
}
function pg_store(mysqli $db,array $body): never {
    $runUuid=pg_text($body['run_uuid']??null,64,true);
    if(!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i',(string)$runUuid))ingestion_fail('run_uuid invalid.');
    $playerId=pg_uint($body['player_id']??null,false);
    $sourceType=strtolower((string)pg_text($body['source_type']??null,16,true));
    if(!in_array($sourceType,['changes','new'],true))ingestion_fail('source_type invalid.');
    $changeType=strtolower((string)($body['change_type']??''));
    if($changeType!==''&&!in_array($changeType,['rateup','ratedown','playerchange'],true))ingestion_fail('change_type invalid.');
    $observedDate=pg_date($body['observed_date']??null,false);
    $effectiveDate=pg_date($body['effective_change_date']??null,true);
    $capturedAt=pg_datetime($body['captured_at']??null);
    $ratingChange=pg_sint($body['rating_change']??null,true);
    $profile=$body['profile']??null;$history=$body['rating_history']??[];
    if(!is_array($profile)||array_is_list($profile))ingestion_fail('profile object required.');
    if(!is_array($history)||!array_is_list($history)||count($history)>500)ingestion_fail('rating_history invalid.');
    $fullName=pg_text($profile['full_name']??null,255,true);$shortName=pg_text($profile['short_name']??null,255,false);
    [$forename,$surname]=pg_name_parts((string)$fullName);
    $imageUrl=pg_text($profile['image_url']??null,700,false);
    if($imageUrl!==null&&preg_match('~(?:no-player-picture|spacer\\.gif)~i',$imageUrl))$imageUrl=null;
    [$imageFile,$imageBase]=pg_image_parts($imageUrl);
    $age=pg_uint($profile['age']??null,true);$dob=pg_date($profile['date_of_birth']??null,true);
    $height=pg_uint($profile['height_cm']??null,true);$weight=pg_uint($profile['weight_kg']??null,true);
    $rating=pg_uint($profile['rating']??null,true);$oldRating=pg_uint($profile['old_rating']??null,true);
    $marketLabel=pg_text($profile['market_value_label']??null,64,false);$market=pg_money($profile['market_value']??$marketLabel);
    $wageLabel=pg_text($profile['wage_label']??null,64,false);$wage=pg_money($profile['wage']??$wageLabel);
    $contract=pg_uint($profile['contract_seasons']??null,true);
    $nationality=pg_text($profile['nationality']??null,100,false);$nationCode=strtoupper((string)($profile['nationality_code']??''));
    if($nationCode!==''&&!preg_match('/^[A-Z]{2,8}$/',$nationCode))$nationCode='';
    $position=pg_text($profile['position']??null,255,false);$foot=pg_text($profile['foot']??null,32,false);
    $wikiClub=pg_text($profile['soccerwiki_club_name']??null,255,false);$wikiClubId=pg_uint($profile['soccerwiki_club_id']??null,true);
    $historyJson=pg_json($history);$payloadJson=pg_json($body);
    $snapshotId=pg_run_snapshot($db,(string)$runUuid,(string)$observedDate);
    try{
        $db->begin_transaction();
        $q=$db->prepare("INSERT INTO players(player_id,forename,surname,image_url,canonical_source,present_in_sm,present_in_soccerwiki,source_conflict,first_seen_date,last_seen_date,is_active) VALUES(?,?,?,?,'SM',1,0,0,?,?,1) ON DUPLICATE KEY UPDATE forename=IF(players.canonical_source='SM' OR players.forename='',VALUES(forename),players.forename),surname=IF(players.canonical_source='SM' OR players.surname='',VALUES(surname),players.surname),image_url=IF(VALUES(image_url)<>'',VALUES(image_url),players.image_url),present_in_sm=1,last_seen_date=GREATEST(players.last_seen_date,VALUES(last_seen_date)),is_active=1");
        $q->execute([$playerId,$forename,$surname,$imageUrl??'',$observedDate,$observedDate]);$q->close();
        $q=$db->prepare("INSERT INTO sm_players_source(player_id,forename,surname,image_file,image_base_url,first_seen_date,last_seen_date,first_snapshot_id,last_snapshot_id,active_latest) VALUES(?,?,?,?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE forename=VALUES(forename),surname=VALUES(surname),image_file=IF(VALUES(image_file)<>'',VALUES(image_file),sm_players_source.image_file),image_base_url=IF(VALUES(image_base_url)<>'',VALUES(image_base_url),sm_players_source.image_base_url),last_seen_date=GREATEST(sm_players_source.last_seen_date,VALUES(last_seen_date)),last_snapshot_id=VALUES(last_snapshot_id),active_latest=1");
        $q->execute([$playerId,$forename,$surname,$imageFile,$imageBase,$observedDate,$observedDate,$snapshotId,$snapshotId]);$q->close();
        $q=$db->prepare("INSERT INTO player_codex_global(player_id,short_name,player_name,age,date_of_birth,date_of_birth_raw,nation_name,nation_code,positions,preferred_foot,height,weight,rating,previous_rating,value,value_label,wage,wage_label,contract,real_soccerwiki_club,soccerwiki_club_id,image_src,rating_history_json,first_observed_date,first_seen_as_new_date,last_change_date,last_observed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(6),NOW(6)) ON DUPLICATE KEY UPDATE short_name=VALUES(short_name),player_name=VALUES(player_name),age=VALUES(age),date_of_birth=VALUES(date_of_birth),date_of_birth_raw=VALUES(date_of_birth_raw),nation_name=VALUES(nation_name),nation_code=VALUES(nation_code),positions=VALUES(positions),preferred_foot=VALUES(preferred_foot),height=VALUES(height),weight=VALUES(weight),rating=VALUES(rating),previous_rating=VALUES(previous_rating),value=VALUES(value),value_label=VALUES(value_label),wage=VALUES(wage),wage_label=VALUES(wage_label),contract=VALUES(contract),real_soccerwiki_club=VALUES(real_soccerwiki_club),soccerwiki_club_id=VALUES(soccerwiki_club_id),image_src=VALUES(image_src),rating_history_json=VALUES(rating_history_json),first_seen_as_new_date=COALESCE(player_codex_global.first_seen_as_new_date,VALUES(first_seen_as_new_date)),last_change_date=CASE WHEN VALUES(last_change_date) IS NULL THEN player_codex_global.last_change_date WHEN player_codex_global.last_change_date IS NULL THEN VALUES(last_change_date) ELSE GREATEST(player_codex_global.last_change_date,VALUES(last_change_date)) END,last_observed_at=VALUES(last_observed_at),updated_at=NOW(6)");
        $q->execute([$playerId,$shortName,$fullName,$age,$dob,pg_text($profile['date_of_birth_raw']??null,64,false),$nationality,$nationCode?:null,$position,$foot,$height,$weight,$rating,$oldRating,$market,$marketLabel,$wage,$wageLabel,$contract,$wikiClub,$wikiClubId,$imageUrl,$historyJson,$observedDate,$sourceType==='new'?$observedDate:null,$sourceType==='changes'?$effectiveDate:null,$capturedAt]);$q->close();
        $q=$db->prepare("INSERT INTO player_codex_observations(source_snapshot_id,player_id,source_type,change_type,observed_date,effective_change_date,rating_change,payload_json,created_at) VALUES(?,?,?,?,?,?,?,?,NOW(6)) ON DUPLICATE KEY UPDATE source_type=VALUES(source_type),change_type=VALUES(change_type),observed_date=VALUES(observed_date),effective_change_date=VALUES(effective_change_date),rating_change=VALUES(rating_change),payload_json=VALUES(payload_json)");
        $q->execute([$snapshotId,$playerId,$sourceType,$changeType?:null,$observedDate,$effectiveDate,$ratingChange,$payloadJson]);$q->close();
        $q=$db->prepare("INSERT INTO player_codex_player_snapshots(source_snapshot_id,player_id,snapshot_date,source_type,change_type,positions,age,rating,previous_rating,value,rating_change_date,rating_change,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,NOW(6)) ON DUPLICATE KEY UPDATE source_snapshot_id=VALUES(source_snapshot_id),source_type=VALUES(source_type),change_type=VALUES(change_type),positions=VALUES(positions),age=VALUES(age),rating=VALUES(rating),previous_rating=VALUES(previous_rating),value=VALUES(value),rating_change_date=VALUES(rating_change_date),rating_change=VALUES(rating_change)");
        $q->execute([$snapshotId,$playerId,$observedDate,$sourceType,$changeType?:null,$position,$age,$rating,$oldRating,$market,$effectiveDate,$ratingChange??0]);$q->close();
        $hq=$db->prepare("INSERT INTO player_codex_rating_history(player_id,change_date,date_label,old_rating,new_rating,created_at) VALUES(?,?,?,?,?,NOW(6)) ON DUPLICATE KEY UPDATE date_label=VALUES(date_label)");
        $savedHistory=0;
        foreach($history as $row){
            if(!is_array($row))continue;
            $hd=pg_date($row['change_date']??null,true);$old=pg_uint($row['old_rating']??null,true);$new=pg_uint($row['new_rating']??null,true);
            if($hd===null||$old===null||$new===null)continue;
            $hq->execute([$playerId,$hd,pg_text($row['date_raw']??null,64,false),$old,$new]);$savedHistory++;
        }
        $hq->close();
        $q=$db->prepare("UPDATE source_snapshots SET counts_json=JSON_SET(COALESCE(counts_json,JSON_OBJECT()),'$.processed',COALESCE(JSON_EXTRACT(counts_json,'$.processed'),0)+1) WHERE snapshot_id=?");$q->execute([$snapshotId]);$q->close();
        $db->commit();
        ingestion_reply(['ok'=>true,'action'=>'store_player','database'=>'Sql1956795_1','player_id'=>$playerId,'source_snapshot_id'=>$snapshotId,'observed_date'=>$observedDate,'effective_change_date'=>$effectiveDate,'history_rows'=>$savedHistory,'persisted'=>true]);
    }catch(Throwable $e){try{$db->rollback();}catch(Throwable){}throw $e;}
}
function pg_finish(mysqli $db,array $body): never {
    $runUuid=pg_text($body['run_uuid']??null,64,true);if(!preg_match('/^[a-f0-9-]{36}$/i',(string)$runUuid))ingestion_fail('run_uuid invalid.');
    $stats=$body['stats']??[];if(!is_array($stats))$stats=[];$errors=max(0,(int)($stats['errors']??0));$requested=strtolower(trim((string)($stats['status']??'complete')));$status=$requested==='complete'&&$errors===0?'success':($requested==='stopped'?'stopped':'partial');$sha=hash('sha256','PLAYER_GLOBAL|'.$runUuid);
    $q=$db->prepare("UPDATE source_snapshots SET imported_at=NOW(),status=?,counts_json=? WHERE source_code='SM_PLAYER_GLOBAL' AND sha256=?");$q->execute([$status,pg_json($stats),$sha]);$affected=$q->affected_rows;$q->close();
    if($affected<1)ingestion_fail('Player Global run not found.',404);
    ingestion_reply(['ok'=>true,'action'=>'finish_run','database'=>'Sql1956795_1','run_uuid'=>$runUuid,'status'=>$status,'stats'=>$stats]);
}
function player_global_handle(mysqli $db,array $body,string $action): never {
    if($action==='store_player')pg_store($db,$body);
    if($action==='finish_run')pg_finish($db,$body);
    if($action==='health')ingestion_reply(['ok'=>true,'type'=>'player_global','database'=>(string)$db->query('SELECT DATABASE()')->fetch_row()[0],'version'=>'1.0.0']);
    ingestion_fail('Unknown player_global action.',404);
}
