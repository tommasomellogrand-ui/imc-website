<?php
declare(strict_types=1);

function manager_scan_json(mixed $value): string {
    return json_encode($value, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE|JSON_THROW_ON_ERROR);
}
function manager_scan_text(mixed $v,int $max,bool $required=false): ?string {
    $s=trim((string)($v??''));
    if(($required&&$s==='')||mb_strlen($s)>$max) ingestion_fail('Manager Scan text field invalid.');
    return $s===''?null:$s;
}
function manager_scan_uint(mixed $v,bool $nullable=true): ?int {
    if(($v===null||$v==='')&&$nullable)return null;
    if(!is_int($v)&&!(is_string($v)&&ctype_digit($v)))ingestion_fail('Manager Scan unsigned integer invalid.');
    $n=(int)$v;if($n<1)ingestion_fail('Manager Scan unsigned integer out of range.');return $n;
}
function manager_scan_uuid(): string {
    $b=random_bytes(16);$b[6]=chr((ord($b[6])&15)|64);$b[8]=chr((ord($b[8])&63)|128);$h=bin2hex($b);
    return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20);
}
function manager_scan_imc_map(): array {
    $core=smm_db();$r=$core->query('SELECT sm_manager_id,full_name FROM imc_managers WHERE sm_manager_id IS NOT NULL');$out=[];
    while($x=$r->fetch_assoc())$out[(int)$x['sm_manager_id']]=(string)$x['full_name'];
    return $out;
}
function manager_scan_previous(mysqli $db,string $gw,string $entityType): array {
    $sql="SELECT a.sm_manager_id,a.assignment_target_key,a.world_club_id,a.world_national_team_id,u.sm_username,
      COALESCE(c.club_name,n.team_name) entity_name
      FROM gw_sm_user_assignments a
      LEFT JOIN gw_sm_users u ON u.sm_manager_id=a.sm_manager_id
      LEFT JOIN gw_world_clubs c ON c.game_world_id=a.game_world_id AND c.world_club_id=a.world_club_id
      LEFT JOIN gw_national_teams n ON n.game_world_id=a.game_world_id AND n.world_national_team_id=a.world_national_team_id
      WHERE a.game_world_id=? AND a.entity_type=? AND a.is_current=1";
    $q=$db->prepare($sql);$q->execute([$gw,$entityType]);$rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);$q->close();$out=[];
    foreach($rows as $r)$out[(int)$r['sm_manager_id']]=$r;return $out;
}
function manager_scan_events(array $before,array $after,array $imc,string $type): array {
    $events=[];$suffix=$type==='CLUB'?'CLUB':'NATIONAL';
    foreach($imc as $id=>$official){$a=$before[$id]??null;$b=$after[$id]??null;if($a&& !$b)$events[]=['event_type'=>'LEFT_'.$suffix,'sm_manager_id'=>$id,'manager_name'=>$official,'previous_entity_name'=>$a['entity_name']??null,'current_entity_name'=>null];
        elseif($a&&$b&&$a['assignment_target_key']!==$b['assignment_target_key'])$events[]=['event_type'=>'CHANGED_'.$suffix,'sm_manager_id'=>$id,'manager_name'=>$official,'previous_entity_name'=>$a['entity_name']??null,'current_entity_name'=>$b['entity_name']??null];
        elseif(!$a&&$b)$events[]=['event_type'=>'NEW_'.$suffix.'_ASSIGNMENT','sm_manager_id'=>$id,'manager_name'=>$official,'previous_entity_name'=>null,'current_entity_name'=>$b['entity_name']??null];}
    return $events;
}
function manager_scan_handle(mysqli $db,array $body,string $action): never {
    if($action!=='store')ingestion_fail('Unknown Manager Scan action.',404);
    $gw=ingestion_world($body['game_world_id']??null);$scan=strtoupper(trim((string)($body['scan_type']??'')));
    if(!in_array($scan,['CLUB','NATIONAL'],true))ingestion_fail('scan_type invalid.');
    if(($body['is_complete']??false)!==true)ingestion_fail('Incomplete Manager Scan cannot be stored.',409);
    $items=$body['items']??null;if(!is_array($items)||!array_is_list($items)||count($items)<1||count($items)>1000)ingestion_fail('Manager Scan items invalid.');
    if($scan==='NATIONAL'&&count($items)!==80)ingestion_fail('National scan must contain exactly 80 entities.',409);
    $entityType=$scan==='CLUB'?'CLUB':'NATIONAL_TEAM';$context=ingestion_context($db,$gw,ingestion_current_imc_season($db,$gw));$imc=manager_scan_imc_map();
    $normalized=[];$seen=[];
    foreach($items as $i=>$x){if(!is_array($x))ingestion_fail("items[$i] invalid.");$entityId=manager_scan_uint($x['sm_world_entity_id']??null,false);if(isset($seen[$entityId]))ingestion_fail("Duplicate entity ID: $entityId");$seen[$entityId]=1;
        $managerId=manager_scan_uint($x['sm_manager_id']??null,true);$managerName=manager_scan_text($x['manager_name']??null,180,false);if(($managerId===null)!==($managerName===null))ingestion_fail("items[$i] manager identity incomplete.");
        $normalized[]=['entity_id'=>$entityId,'entity_name'=>manager_scan_text($x['entity_name']??null,$scan==='CLUB'?255:160,true),'manager_id'=>$managerId,'manager_name'=>$managerName,
          'country_code'=>manager_scan_text($x['country_code']??null,8,false),'division_value'=>manager_scan_text($x['division_value']??null,32,false),'entity_image_src'=>manager_scan_text($x['entity_image_src']??null,65535,false),
          'manager_image_src'=>manager_scan_text($x['manager_image_src']??null,65535,false),'last_online'=>manager_scan_text($x['manager_last_online_label']??null,255,false),'raw'=>$x];}
    $before=manager_scan_previous($db,$gw,$entityType);$runUuid=manager_scan_uuid();$now=gmdate('Y-m-d H:i:s.u');$parser=manager_scan_text($body['parser_version']??'manager-scan-aruba-v4',64,true);
    try{$db->begin_transaction();
        $q=$db->prepare("INSERT INTO gw_import_runs(created_at,finished_at,game_world_id,parser_version,run_status,run_uuid,sm_game_world_id,source_capture_count,started_at,stats_json) VALUES(NOW(6),NULL,?,?,'running',?,?,1,NOW(6),NULL)");$q->execute([$gw,$parser,$runUuid,$context['sm_game_world_id']]);$runId=(int)$db->insert_id;$q->close();
        $captureJson=manager_scan_json(['scan_type'=>$scan,'captured_at'=>$body['captured_at']??null,'count'=>count($normalized)]);$sourceName='manager-scan-'.$gw.'-'.strtolower($scan).'-'.$runUuid.'.json';$sourceHash=hash('sha256',$runUuid.'|'.$captureJson);$identityHash=hash('sha256',$gw.'|'.$scan.'|'.$runUuid);
        $q=$db->prepare("INSERT INTO gw_source_captures(capture_json,capture_status,content_type,created_at,full_html,game_world_id,generated_at,page_type_id,parser_version,report_type,report_version,sm_game_world_id,source_file_name,source_file_sha256,source_identity_fingerprint) VALUES(?,'complete','application/json',NOW(6),?, ?,NOW(6),17,?,'manager_scan','4',?,?,?,?)");
        $minimal='<div data-imc-manager-scan="'.$scan.'" data-count="'.count($normalized).'"></div>';$q->execute([$captureJson,$minimal,$gw,$parser,$context['sm_game_world_id'],$sourceName,$sourceHash,$identityHash]);$captureId=(int)$db->insert_id;$q->close();
        foreach($normalized as $r){if($scan==='CLUB'){$q=$db->prepare("INSERT INTO gw_world_clubs(capture_id,club_country_code,club_division,club_logo_src,club_name,country_code,created_at,current_club_flag,division_value,game_world_id,logo_src,managed_flag,sm_game_world_id,world_club_id) VALUES(?,?,?,?,?,?,NOW(6),1,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=VALUES(capture_id),club_country_code=VALUES(club_country_code),club_division=VALUES(club_division),club_logo_src=VALUES(club_logo_src),club_name=VALUES(club_name),country_code=VALUES(country_code),current_club_flag=1,division_value=VALUES(division_value),logo_src=VALUES(logo_src),managed_flag=1,sm_game_world_id=VALUES(sm_game_world_id)");$q->execute([$captureId,$r['country_code'],$r['division_value'],$r['entity_image_src'],$r['entity_name'],$r['country_code'],$r['division_value'],$gw,$r['entity_image_src'],$context['sm_game_world_id'],$r['entity_id']]);}
            else{$q=$db->prepare("INSERT INTO gw_national_teams(capture_id,created_at,flag_src,game_world_id,sm_game_world_id,team_name,world_national_team_id) VALUES(?,NOW(6),?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=VALUES(capture_id),flag_src=VALUES(flag_src),sm_game_world_id=VALUES(sm_game_world_id),team_name=VALUES(team_name)");$q->execute([$captureId,$r['entity_image_src'],$gw,$context['sm_game_world_id'],$r['entity_name'],$r['entity_id']]);}$q->close();
            if($r['manager_id']===null)continue;$external=isset($imc[$r['manager_id']])?0:1;$q=$db->prepare("INSERT INTO gw_sm_users(capture_id,created_at,image_src,last_online,manager_image_src,manager_unknown_flag,sm_manager_id,sm_username) VALUES(?,NOW(6),?,?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=VALUES(capture_id),image_src=VALUES(image_src),last_online=VALUES(last_online),manager_image_src=VALUES(manager_image_src),manager_unknown_flag=VALUES(manager_unknown_flag),sm_username=VALUES(sm_username)");$q->execute([$captureId,$r['manager_image_src'],$r['last_online'],$r['manager_image_src'],$external,$r['manager_id'],$r['manager_name']]);$q->close();}
        $currentKeys=[];foreach($normalized as $r)if($r['manager_id']!==null)$currentKeys[$r['manager_id']]=$entityType.':'.$r['entity_id'];
        foreach($before as $managerId=>$old)if(!isset($currentKeys[$managerId])||$currentKeys[$managerId]!==$old['assignment_target_key']){$q=$db->prepare('UPDATE gw_sm_user_assignments SET is_current=0,valid_to=NOW(6) WHERE game_world_id=? AND entity_type=? AND sm_manager_id=? AND is_current=1');$q->execute([$gw,$entityType,$managerId]);$q->close();}
        foreach($normalized as $r){if($r['manager_id']===null)continue;$target=$entityType.':'.$r['entity_id'];$exists=$before[$r['manager_id']]??null;if($exists&&$exists['assignment_target_key']===$target)continue;$fp=hash('sha256',$gw.'|'.$entityType.'|'.$r['manager_id'].'|'.$target.'|'.$captureId);
            $q=$db->prepare('INSERT INTO gw_sm_user_assignments(assignment_fingerprint,assignment_target_key,capture_id,created_at,entity_type,game_world_id,gw_season_row_id,imc_season,is_current,sm_game_world_id,sm_manager_id,sm_season_id,soccer_manager_season,valid_from,valid_to,world_club_id,world_national_team_id) VALUES(?,?,?,NOW(6),?,?,?,?,1,?,?,?,?,NOW(6),NULL,?,?)');
            $club=$scan==='CLUB'?$r['entity_id']:null;$national=$scan==='NATIONAL'?$r['entity_id']:null;$q->execute([$fp,$target,$captureId,$entityType,$gw,$context['gw_season_row_id'],$context['imc_season'],$context['sm_game_world_id'],$r['manager_id'],$context['sm_season_id'],$context['soccer_manager_season'],$club,$national]);$q->close();}
        $payload=manager_scan_json(['items'=>$items]);$ph=hash('sha256',$payload);$pf=hash('sha256',$captureId.'|manager-scan-items');$q=$db->prepare("INSERT INTO gw_source_payloads(capture_id,created_at,payload_fingerprint,payload_hash,payload_json,payload_key,payload_type) VALUES(?,NOW(6),?,?,?,?, 'manager_scan_items')");$q->execute([$captureId,$pf,$ph,$payload,'manager-scan-items']);$q->close();
        $after=manager_scan_previous($db,$gw,$entityType);$events=manager_scan_events($before,$after,$imc,$scan);$stats=manager_scan_json(['scan_type'=>$scan,'entities'=>count($normalized),'assigned'=>count($after),'external_managers'=>count(array_filter($after,fn($x)=>!isset($imc[(int)$x['sm_manager_id']])),'events'=>count($events)]);
        $q=$db->prepare("UPDATE gw_import_runs SET finished_at=NOW(6),run_status='success',stats_json=? WHERE import_run_id=?");$q->execute([$stats,$runId]);$q->close();$db->commit();
        ingestion_reply(['ok'=>true,'change_status'=>$events?'CHANGE':'NO_CHANGE','events'=>$events,'run_id'=>$runId,'capture_id'=>$captureId,'received_count'=>count($normalized),'assigned_count'=>count($after),'external_manager_count'=>count(array_filter($after,fn($x)=>!isset($imc[(int)$x['sm_manager_id']]))]);
    }catch(Throwable $e){try{$db->rollback();}catch(Throwable){}throw $e;}
}
