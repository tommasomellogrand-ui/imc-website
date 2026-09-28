<?php
declare(strict_types=1);
require_once __DIR__.'/engine.php';

function trophy_sync(array $config,PDO $db,string $gw,bool $preview=false): array {
    $gw=nexus_world($gw);
    $lock='imc_trophies_'.$gw;
    $q=$db->prepare('SELECT GET_LOCK(?,0)');$q->execute([$lock]);
    if ((int)$q->fetchColumn()!==1) return ['state'=>'busy'];
    try {
        $state=nexus_rows($db,'SELECT * FROM IMC_Trophy_Sync_State WHERE game_world_id=?',[$gw])[0]??null;
        if (!$state) throw new RuntimeException('trophy_state_missing');
        $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
        if (!$preview) {
            if (!(int)$state['enabled']) return ['state'=>'disabled'];
            if ($state['revision']===$state['processed_revision'] && $state['engine_version']===TROPHY_ENGINE_VERSION && substr((string)$state['checked_at'],0,10)===$today) return ['state'=>'current','version'=>TROPHY_ENGINE_VERSION];
            if ((int)$db->query("SELECT TIMESTAMPDIFF(SECOND,touched_at,NOW()) FROM IMC_Trophy_Sync_State WHERE game_world_id=".$db->quote($gw))->fetchColumn()<30) return ['state'=>'waiting_for_import'];
        }
        $core=nexus_db($config,'core');
        $definitions=nexus_rows($core,'SELECT game_world_id,competition_key,sm_action,sm_country,sm_division,teams_count,expected_match FROM `IMC Competition Codex Global` WHERE game_world_id=? AND sm_action=?',[$gw,'league']);
        $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $db->beginTransaction();
        $state=nexus_rows($db,'SELECT * FROM IMC_Trophy_Sync_State WHERE game_world_id=?',[$gw])[0];
        $results=nexus_rows($db,'SELECT * FROM `'.$gw.'_IMC_Results` WHERE game_world_id=?',[$gw]);
        // Deliberately exclude the large players/events/commentary JSON columns.
        $reports=nexus_rows($db,'SELECT sm_fixture_id,imc_season,competition_key,home_sm_club_id,away_sm_club_id,home_name,away_name,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score FROM `'.$gw.'_IMC_Match_Report` WHERE game_world_id=?',[$gw]);
        $schedule=nexus_rows($db,'SELECT * FROM `'.$gw.'_IMC_Schedule` WHERE game_world_id=?',[$gw]);
        $derived=trophy_derive($gw,$results,$reports,$schedule,$definitions,$today);
        $table='`'.$gw.'_IMC_Trophy_Room`';
        $before=nexus_rows($db,'SELECT * FROM '.$table.' ORDER BY id');
        if ($preview) {$db->rollBack();return ['state'=>'preview','version'=>TROPHY_ENGINE_VERSION,'existing_count'=>count($before)]+$derived;}
        $wanted=[];foreach($derived['awards'] as $row)$wanted[trophy_group_key($row)]=$row;
        $existing=[];foreach($before as $row)$existing[trophy_group_key($row)]=$row;
        $changes=['inserted'=>0,'updated'=>0,'removed'=>0];
        $remove=$db->prepare('DELETE FROM '.$table.' WHERE id=?');
        foreach ($before as $old) if (!isset($wanted[trophy_group_key($old)])) {$remove->execute([$old['id']]);$changes['removed']++;}
        foreach ($wanted as $key=>$row) {
            $old=$existing[$key]??null;
            if ($old) {
                $changed=false;foreach($row as $field=>$value)if((string)($old[$field]??'')!==(string)($value??'')){$changed=true;break;}
                if (!$changed)continue;
                $sql='UPDATE '.$table.' SET '.implode(',',array_map(fn($f)=>'`'.$f.'`=?',array_keys($row))).' WHERE id=?';
                $db->prepare($sql)->execute([...array_values($row),$old['id']]);$changes['updated']++;
            } else {
                $sql='INSERT INTO '.$table.' (`'.implode('`,`',array_keys($row)).'`) VALUES ('.implode(',',array_fill(0,count($row),'?')).')';
                $db->prepare($sql)->execute(array_values($row));$changes['inserted']++;
            }
        }
        $summary=['state'=>'synced','version'=>TROPHY_ENGINE_VERSION,'awards'=>count($wanted),'changes'=>$changes,'pending'=>$derived['pending'],'unassigned_source_rows'=>$derived['unassigned_source_rows']];
        if (array_sum($changes)>0) $db->prepare('INSERT INTO IMC_Trophy_Sync_Log (game_world_id,engine_version,source_revision,before_json,summary_json) VALUES (?,?,?,?,?)')->execute([$gw,TROPHY_ENGINE_VERSION,$state['revision'],json_encode($before,JSON_UNESCAPED_UNICODE),json_encode($summary,JSON_UNESCAPED_UNICODE)]);
        $db->prepare('UPDATE IMC_Trophy_Sync_State SET processed_revision=?,engine_version=?,checked_at=NOW(),last_summary=? WHERE game_world_id=?')->execute([$state['revision'],TROPHY_ENGINE_VERSION,json_encode($summary,JSON_UNESCAPED_UNICODE),$gw]);
        $db->commit();return $summary;
    } catch (Throwable $e) {
        if ($db->inTransaction())$db->rollBack();
        throw $e;
    } finally {
        $q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute([$lock]);
    }
}
