<?php
declare(strict_types=1);

function smm_import_sm_xml(string $path, string $date, string $filename): array {
    if (!class_exists('XMLReader')) throw new RuntimeException('XMLReader extension unavailable on Aruba PHP.');
    $meta = smm_create_snapshot('soccer_manager', $date, $filename, $path);
    if ($meta['duplicate']) return ['duplicate'=>true] + $meta;
    $snapshot = $meta['snapshot_id'];
    $db = smm_db();
    $counts = ['players'=>0,'clubs'=>0];
    $phase = 'sm_xml';
    try {
        $db->begin_transaction();
        $db->query('UPDATE sm_players_source SET active_latest=0');
        $db->query('UPDATE sm_clubs_source SET active_latest=0');
        $xr = new XMLReader();
        if (!$xr->open($path, null, LIBXML_NONET | LIBXML_COMPACT)) throw new RuntimeException('Cannot open XML.');
        $playerBase = ''; $clubBase = ''; $playerBatch = []; $clubBatch = [];
        while ($xr->read()) {
            if ($xr->nodeType !== XMLReader::ELEMENT) continue;
            if ($xr->name === 'PlayerData') { $playerBase = (string)$xr->getAttribute('baseImageUrl'); continue; }
            if ($xr->name === 'ClubData') { $clubBase = (string)$xr->getAttribute('baseImageUrl'); continue; }
            if ($xr->name === 'P') {
                $playerBatch[] = [
                    'player_id'=>(int)$xr->getAttribute('id'), 'forename'=>(string)$xr->getAttribute('f'), 'surname'=>(string)$xr->getAttribute('s'),
                    'image_file'=>(string)$xr->getAttribute('i'), 'image_base_url'=>$playerBase, 'first_seen_date'=>$date, 'last_seen_date'=>$date,
                    'first_snapshot_id'=>$snapshot, 'last_snapshot_id'=>$snapshot, 'active_latest'=>1
                ];
                $counts['players']++;
                if (count($playerBatch)>=500) {
                    smm_batch_upsert($db,'sm_players_source',['player_id','forename','surname','image_file','image_base_url','first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest'],$playerBatch,['forename','surname','image_file','image_base_url','last_seen_date','last_snapshot_id','active_latest']); $playerBatch=[];
                }
            } elseif ($xr->name === 'C') {
                $clubBatch[] = [
                    'club_id'=>(int)$xr->getAttribute('id'), 'name'=>(string)$xr->getAttribute('n'), 'image_file'=>(string)$xr->getAttribute('i'), 'image_base_url'=>$clubBase,
                    'first_seen_date'=>$date, 'last_seen_date'=>$date, 'first_snapshot_id'=>$snapshot, 'last_snapshot_id'=>$snapshot, 'active_latest'=>1
                ];
                $counts['clubs']++;
                if (count($clubBatch)>=500) {
                    smm_batch_upsert($db,'sm_clubs_source',['club_id','name','image_file','image_base_url','first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest'],$clubBatch,['name','image_file','image_base_url','last_seen_date','last_snapshot_id','active_latest']); $clubBatch=[];
                }
            }
        }
        if ($playerBatch) smm_batch_upsert($db,'sm_players_source',['player_id','forename','surname','image_file','image_base_url','first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest'],$playerBatch,['forename','surname','image_file','image_base_url','last_seen_date','last_snapshot_id','active_latest']);
        if ($clubBatch) smm_batch_upsert($db,'sm_clubs_source',['club_id','name','image_file','image_base_url','first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest'],$clubBatch,['name','image_file','image_base_url','last_seen_date','last_snapshot_id','active_latest']);
        $xr->close();
        $db->commit();
        smm_finish_snapshot($snapshot,$counts);
        smm_archive_file($path,'soccer_manager',$date,$meta['sha256'],'xml');
        return ['duplicate'=>false,'snapshot_id'=>$snapshot,'sha256'=>$meta['sha256'],'counts'=>$counts];
    } catch (Throwable $e) {
        try { $db->rollback(); } catch (Throwable $ignore) {}
        smm_fail_snapshot($snapshot,'soccer_manager',$phase,$e);
        throw $e;
    }
}

