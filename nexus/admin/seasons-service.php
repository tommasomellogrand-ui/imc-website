<?php
declare(strict_types=1);
const NS_CORE='`IMC Game World Season`';
function ns_local_table(array $config,string $gw): string {
    $database=$config['db'][nexus_target($config,$gw)]??'';
    if (!is_string($database)||!preg_match('/^[A-Za-z0-9_]+$/D',$database)) throw new RuntimeException('Archivio stagioni non configurato.',503);
    return '`'.$database.'`.`IMC_Game_World_Season`';
}
function ns_list(PDO $db,string $local,string $gw): array {
    $rows=nexus_rows($db,'SELECT * FROM '.NS_CORE.' WHERE game_world_id=? ORDER BY imc_season',[$gw]);
    $copies=nexus_rows($db,'SELECT * FROM '.$local.' WHERE game_world_id=?',[$gw]);
    foreach ($rows as &$row) {
        $row['version']=na_version($row);
        $row['synced']=false;
        foreach($copies as $copy) if((int)$copy['imc_season']===(int)$row['imc_season']) {
            $row['synced']=$copy['imc_season_start_date']===$row['imc_season_start_date'] && $copy['imc_season_end_date']===$row['imc_season_end_date'];
        }
    }
    unset($row);return $rows;
}
function ns_save(PDO $db,string $local,string $gw,array $input): void {
    $season=filter_var($input['season']??null,FILTER_VALIDATE_INT);
    if(!$season||$season<1||$season>9999) throw new InvalidArgumentException('Numero stagione non valido.');
    $start=na_date($input['start_date']??null);$end=na_date($input['end_date']??null,true);
    if($end!==null&&$end<$start) throw new InvalidArgumentException('La data di fine deve essere uguale o successiva all’inizio.');
    $lock='nexus-seasons-'.$gw;
    if((int)nexus_rows($db,'SELECT GET_LOCK(?,5) acquired',[$lock])[0]['acquired']!==1) throw new RuntimeException('Salvataggio in corso. Riprova.',409);
    try {
        // Both schemas share the same MySQL server and connection: one atomic transaction.
        $db->beginTransaction();
        $rows=nexus_rows($db,'SELECT * FROM '.NS_CORE.' WHERE game_world_id=? ORDER BY imc_season FOR UPDATE',[$gw]);
        $old=null;
        foreach($rows as $r) if((int)$r['imc_season']===$season) $old=$r;
        if(($old&&!hash_equals(na_version($old),(string)($input['version']??'')))||(!$old&&!empty($input['version']))) throw new RuntimeException('La stagione è cambiata. Ricarica i dati prima di salvare.',409);
        foreach($rows as $r) {
            if((int)$r['imc_season']===$season||$r['imc_season_start_date']===null) continue;
            if($start<=($r['imc_season_end_date']??'9999-12-31')&&($end??'9999-12-31')>=$r['imc_season_start_date']) throw new InvalidArgumentException('Le date si sovrappongono alla stagione '.$r['imc_season'].'. La data di fine è inclusa: la stagione successiva deve iniziare dopo.');
        }
        if($old) $db->prepare('UPDATE '.NS_CORE.' SET imc_season_start_date=?,imc_season_end_date=? WHERE game_world_id=? AND imc_season=?')->execute([$start,$end,$gw,$season]);
        else $db->prepare('INSERT INTO '.NS_CORE.' (game_world_id,imc_season,imc_season_start_date,imc_season_end_date) VALUES (?,?,?,?)')->execute([$gw,$season,$start,$end]);
        $db->prepare('INSERT INTO '.$local.' (game_world_id,imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE imc_season_start_date=VALUES(imc_season_start_date),imc_season_end_date=VALUES(imc_season_end_date)')->execute([$gw,$season,$old['soccer_manager_season']??null,$start,$end]);
        $saved=nexus_rows($db,'SELECT imc_season_start_date,imc_season_end_date FROM '.$local.' WHERE game_world_id=? AND imc_season=?',[$gw,$season]);
        if(count($saved)!==1||$saved[0]['imc_season_start_date']!==$start||$saved[0]['imc_season_end_date']!==$end) throw new RuntimeException('Verifica della copia locale non riuscita.');
        $db->commit();
        error_log('Nexus admin seasons '.json_encode(['world'=>$gw,'season'=>$season,'before'=>$old,'start'=>$start,'end'=>$end]));
    } catch(Throwable $e) {
        if($db->inTransaction())$db->rollBack();throw $e;
    } finally {$db->prepare('SELECT RELEASE_LOCK(?)')->execute([$lock]);}
}
