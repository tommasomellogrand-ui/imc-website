<?php
declare(strict_types=1);

/** Keep each World Cup edition in the season in which its first match is played. */
function imc_worldcup_reconcile(PDO $db, string $table): array {
    $physical=imc_physical_table($table);
    if (!preg_match('/^(IMC[0-9]{3})_(?:Results|Schedule|Match_Reports)$/D',$physical,$m)
        && !preg_match('/^(GW[0-9]{3})_IMC_(?:Results|Schedule|Match_Report)$/D',$physical,$m)) return [];
    $prefix=$m[1];
    $compact=str_starts_with($prefix,'IMC');
    $tables=$compact?[$prefix.'_Results',$prefix.'_Schedule',$prefix.'_Match_Reports']:[$prefix.'_IMC_Results',$prefix.'_IMC_Schedule',$prefix.'_IMC_Match_Report'];
    $rows=[];$available=[];
    foreach ($tables as $name) {
        $exists=$db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?');
        $exists->execute([$name]);
        if (!(int)$exists->fetchColumn()) continue;
        $available[]=$name;
        foreach ($db->query('SELECT sm_fixture_id,fingerprint,game_world_id,imc_season,match_date,competition_stage,competition_round FROM '.imc_ident($name)." WHERE LOWER(TRIM(sm_action))='worldcup' AND match_date IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $row['table']=$name;$rows[]=$row;
        }
    }
    if (!$rows) return [];
    require_once dirname(__DIR__).'/nexus/core/bootstrap.php';
    $gw=['IMC001'=>'GW001','IMC002'=>'GW005','IMC003'=>'GW009','IMC004'=>'GW010','IMC005'=>'GW011','IMC006'=>'GW004','IMC007'=>'GW006'][$prefix]??($compact?substr_replace($prefix,'-',3,0):$prefix);
    $core=nexus_db(nexus_config(),'core');
    $stmt=$core->prepare('SELECT imc_season,imc_season_start_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season_start_date');
    $stmt->execute([$gw]);$seasons=$stmt->fetchAll(PDO::FETCH_ASSOC);
    $finalDates=[];
    foreach ($rows as $row) foreach (['competition_stage','competition_round'] as $field) {
        if (preg_match('/^finale?$/iu',trim((string)($row[$field]??'')))) $finalDates[$row['match_date']]=true;
    }
    $finalDates=array_keys($finalDates);sort($finalDates);
    $editions=[];
    foreach ($rows as $row) {
        $edition='open';
        foreach ($finalDates as $finalDate) if ($row['match_date']<=$finalDate) {$edition=$finalDate;break;}
        $editions[$edition][]=$row;
    }
    $changed=0;
    foreach ($editions as $editionRows) {
        $start=min(array_column($editionRows,'match_date'));$season=null;
        foreach ($seasons as $candidate) if ($candidate['imc_season_start_date'] && $candidate['imc_season_start_date']<=$start) $season=(int)$candidate['imc_season'];
        if ($season===null) continue;
        foreach ($editionRows as $row) {
            if ((int)$row['imc_season']===$season) continue;
            $update=$db->prepare('UPDATE '.imc_ident($row['table'])." SET imc_season=? WHERE sm_fixture_id <=> ? AND fingerprint <=> ? AND LOWER(TRIM(sm_action))='worldcup'");
            $update->execute([$season,$row['sm_fixture_id'],$row['fingerprint']]);$changed+=$update->rowCount();
        }
    }
    return ['worldcup_season_updated'=>$changed];
}
