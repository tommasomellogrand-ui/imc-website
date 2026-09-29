<?php
declare(strict_types=1);

function rc_sources(): array {return ['schedule'=>'Schedule','results'=>'Results','report'=>'Match_Report'];}
function rc_select(string $source): string {
    $club=$source==='schedule'?'team':'club';
    return 'sm_fixture_id,imc_season,match_date,competition_key,sm_action,sm_country,sm_division,home_sm_'.$club.'_id AS home_id,away_sm_'.$club.'_id AS away_id,home_name,away_name';
}
function rc_fixture(mixed $id): ?string {
    $id=trim((string)$id);
    return preg_match('/^[0-9]+$/D',$id) && ltrim($id,'0')!==''?ltrim($id,'0'):null;
}
function rc_day(mixed $day): string {return substr((string)$day,0,10);}
function rc_compare(array $sets): array {
    $issues=[];$flat=[];
    foreach ($sets as $source=>$rows) {
        if (count($rows)>1) $issues[]='Duplicati in '.['schedule'=>'Schedule','results'=>'Results','report'=>'Match Report'][$source].' ('.count($rows).')';
        foreach ($rows as $row) $flat[]=$row;
    }
    foreach (['match_date'=>'Data','imc_season'=>'Stagione','competition_key'=>'Competizione','sm_country'=>'Country','sm_division'=>'Divisione','home_id'=>'Squadra casa','away_id'=>'Squadra ospite'] as $field=>$label) {
        $values=[];
        foreach ($flat as $row) {
            $v=trim((string)($row[$field]??''));
            if ($field==='match_date') $v=rc_day($v);
            if (in_array($field,['imc_season','sm_division','home_id','away_id'],true) && ctype_digit($v)) $v=(string)(int)$v;
            $values[$v]=true;
        }
        if (count($values)>1) $issues[]=$label.' discordante';
    }
    return $issues;
}
function rc_build(array $sets,string $date,?int $season,string $today): array {
    $groups=[];$anchors=[];$invalid=0;
    foreach ($sets as $source=>$rows) foreach ($rows as $row) {
        $id=rc_fixture($row['sm_fixture_id']??null);
        $key=$id??'missing-'.(++$invalid);
        if (!isset($groups[$key])) $groups[$key]=['fixture_id'=>$id,'schedule'=>[],'results'=>[],'report'=>[]];
        $groups[$key][$source][]=$row;
        $day=rc_day($row['match_date']??'');
        if (($date==='undated'?($day===''||$day==='0000-00-00'):$day===$date) && ($season===null || (int)($row['imc_season']??0)===$season)) $anchors[$key]=true;
    }
    $out=[];$summary=['fixtures'=>0,'schedule'=>0,'results'=>0,'report'=>0,'complete'=>0,'pending'=>0,'today'=>0,'missing_results'=>0,'missing_report'=>0,'orphan_results'=>0,'orphan_report'=>0,'anomaly'=>0];
    foreach ($groups as $key=>$g) {
        if (!isset($anchors[$key])) continue;
        $s=count($g['schedule']);$r=count($g['results']);$m=count($g['report']);
        $anchor=$g['schedule'][0]??$g['results'][0]??$g['report'][0];
        $day=rc_day($anchor['match_date']??'');
        $issues=rc_compare(array_intersect_key($g,rc_sources()));
        if ($g['fixture_id']===null) $issues[]='Fixture ID mancante o non valido';
        if (!$s && $r) $issues[]='Results senza Schedule';
        if (!$r && $m) $issues[]='Match Report senza Results';
        if ($r && !$m) $issues[]='Match Report mancante';
        if ($s && !$r) {
            $state=$day===''||$day==='0000-00-00'?'anomaly':($day>$today?'pending':($day===$today?'today':'missing_results'));
            if ($state==='missing_results') $issues[]='Risultato mancante';
        } elseif (!$r) $state='orphan_report';
        elseif (!$s) $state='orphan_results';
        elseif (!$m) $state='missing_report';
        else $state='complete';
        if (in_array($state,['complete','pending','today'],true) && $issues) $state='anomaly';
        if ($g['fixture_id']===null) $state='anomaly';
        foreach (['schedule','results','report'] as $source) $summary[$source]+=count($g[$source]);
        $summary['fixtures']++;$summary[$state]++;
        $out[]=$g+['date'=>$day,'home'=>$anchor['home_name']??'','away'=>$anchor['away_name']??'','competition'=>$anchor['competition_key']??'','country'=>$anchor['sm_country']??'','state'=>$state,'issues'=>array_values(array_unique($issues))];
    }
    usort($out,fn($a,$b)=>[$a['competition'],$a['home'],$a['fixture_id']]<=>[$b['competition'],$b['home'],$b['fixture_id']]);
    return ['rows'=>$out,'summary'=>$summary];
}
function rc_metadata(PDO $db,string $gw,?int $season): array {
    $seasons=[];$dates=[];
    foreach (rc_sources() as $source=>$repo) {
        $table=nexus_table($gw,$repo);
        foreach (nexus_rows($db,'SELECT DISTINCT imc_season FROM `'.$table.'` WHERE imc_season>0') as $row) $seasons[(int)$row['imc_season']]=true;
        $sql='SELECT DATE(match_date) day,COUNT(*) n FROM `'.$table.'`'.($season!==null?' WHERE imc_season=?':'').' GROUP BY DATE(match_date)';
        foreach (nexus_rows($db,$sql,$season!==null?[$season]:[]) as $row) {
            $day=empty($row['day'])||$row['day']==='0000-00-00'?'undated':$row['day'];
            if (!isset($dates[$day])) $dates[$day]=['date'=>$day,'schedule'=>0,'results'=>0,'report'=>0];
            $dates[$day][$source]=(int)$row['n'];
        }
    }
    $seasons=array_keys($seasons);rsort($seasons);ksort($dates);
    return ['seasons'=>$seasons,'dates'=>array_values($dates)];
}
function rc_check(PDO $db,string $gw,string $date,?int $season,string $today): array {
    if ($date!=='undated') na_date($date);
    $sets=[];$ids=[];$missing=[];
    foreach (rc_sources() as $source=>$repo) {
        $table=nexus_table($gw,$repo);
        $where=$date==='undated'?"(match_date IS NULL OR LEFT(CAST(match_date AS CHAR),10)='0000-00-00')":'match_date>=? AND match_date<DATE_ADD(?, INTERVAL 1 DAY)';
        $params=$date==='undated'?[]:[$date,$date];
        if ($season!==null) {$where.=' AND imc_season=?';$params[]=$season;}
        $rows=nexus_rows($db,'SELECT '.rc_select($source).' FROM `'.$table.'` WHERE '.$where,$params);
        $sets[$source]=[];$missing[$source]=[];
        foreach ($rows as $row) {
            $id=rc_fixture($row['sm_fixture_id']??null);
            if ($id!==null) $ids[$id]=true;else $missing[$source][]=$row;
        }
    }
    // Match across dates and seasons, but never outside the selected Game World.
    foreach (rc_sources() as $source=>$repo) {
        $table=nexus_table($gw,$repo);$sets[$source]=$missing[$source];
        foreach (array_chunk(array_keys($ids),400) as $batch) {
            $rows=nexus_rows($db,'SELECT '.rc_select($source).' FROM `'.$table.'` WHERE sm_fixture_id IN ('.implode(',',array_fill(0,count($batch),'?')).')',$batch);
            $sets[$source]=array_merge($sets[$source],$rows);
        }
    }
    return rc_build($sets,$date,$season,$today);
}
