<?php
declare(strict_types=1);

function rc_sources(): array {return ['schedule'=>'Schedule','results'=>'Results','report'=>'Match_Report'];}
function rc_select(string $source,?PDO $db=null,?string $gw=null): string {
    $club=$source==='schedule'?'team':'club';
    $round='NULL';
    if ($db && $gw) {
        static $columns=[];$table=nexus_table($gw,rc_sources()[$source]);
        if (!isset($columns[$table])) $columns[$table]=array_column(nexus_rows($db,'SHOW COLUMNS FROM `'.$table.'`'),'Field');
        if (in_array('competition_round',$columns[$table],true)) $round='competition_round';
    }
    return 'sm_fixture_id,imc_season,match_date,competition_key,sm_action,sm_country,sm_division,home_sm_'.$club.'_id AS home_id,away_sm_'.$club.'_id AS away_id,home_name,away_name,'.$round.' AS competition_round';
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
// Null scope means all fixtures; an empty scope means no assigned IMC teams.
function rc_scope(PDO $core,string $gw): array {
    $assignments=nexus_rows($core,'SELECT manager_id,assignment_type,team_id,national_team_id,start_date,end_date FROM '.NA_TABLE.' WHERE game_world_id=?',[$gw]);
    $options=na_options($core,$gw);$scope=[];
    foreach ($assignments as $a) {
        if (empty($a['manager_id'])) continue;
        $type=$a['assignment_type'];$id=(int)($type==='national_team'?$a['national_team_id']:$a['team_id']);
        $team=na_team($options,$type,$id);
        $ids=$type==='national_team'&&$team?array_filter(array_map('intval',[$team['id'],$team['codex_id'],$team['sm_id'],$team['world_id']])):[$id];
        foreach ($ids as $teamId) if ($teamId>0) $scope[$type][$teamId][]=[$a['start_date'],$a['end_date']];
    }
    return $scope;
}
function rc_imc(array $row,?array $scope): bool {
    if ($scope===null) return true;
    $day=rc_day($row['match_date']??'');
    if ($day===''||$day==='0000-00-00') return false;
    $national=str_contains(strtoupper((string)($row['competition_key']??'')),'NATIONS')||strtolower((string)($row['sm_action']??''))==='worldcup';
    $type=$national?'national_team':'club';
    foreach (['home_id','away_id'] as $side) foreach ($scope[$type][(int)($row[$side]??0)]??[] as [$start,$end]) {
        if ($start && $day>=rc_day($start) && (!$end || $day<=rc_day($end))) return true;
    }
    return false;
}
function rc_build(array $sets,string $date,?int $season,string $today,?array $scope=null): array {
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
        $s=count($g['schedule']);$r=count($g['results']);
        $required=false;foreach ($g['results'] as $result) if (rc_imc($result,$scope)) $required=true;
        if ($scope!==null && !$required) $g['report']=array_values(array_filter($g['report'],fn($row)=>rc_imc($row,$scope)));
        $m=count($g['report']);if (!$s&&!$r&&!$m) continue;
        $anchor=$g['schedule'][0]??$g['results'][0]??$g['report'][0];
        $day=rc_day($anchor['match_date']??'');
        $issues=rc_compare(array_intersect_key($g,rc_sources()));
        if ($g['fixture_id']===null) $issues[]='Fixture ID mancante o non valido';
        if (!$s && $r) $issues[]='Results senza Schedule';
        if (!$r && $m) $issues[]='Match Report senza Results';
        if ($required && !$m) $issues[]='Match Report mancante';
        if ($s && !$r) {
            $state=$day===''||$day==='0000-00-00'?'anomaly':($day>$today?'pending':($day===$today?'today':'missing_results'));
            if ($state==='missing_results') $issues[]='Risultato mancante';
        } elseif (!$r) $state='orphan_report';
        elseif (!$s) $state='orphan_results';
        elseif ($required && !$m) $state='missing_report';
        else $state='complete';
        if (in_array($state,['complete','pending','today'],true) && $issues) $state='anomaly';
        if ($g['fixture_id']===null) $state='anomaly';
        foreach (['schedule','results','report'] as $source) $summary[$source]+=count($g[$source]);
        $summary['expected_report']=($summary['expected_report']??0)+(int)$required;
        $summary['missing_reports']=($summary['missing_reports']??0)+(int)($required&&!$m);
        $summary['fixtures']++;$summary[$state]++;
        $out[]=$g+['report_required'=>$required,'date'=>$day,'home'=>$anchor['home_name']??'','away'=>$anchor['away_name']??'','competition'=>$anchor['competition_key']??'','country'=>$anchor['sm_country']??'','state'=>$state,'issues'=>array_values(array_unique($issues))];
    }
    usort($out,fn($a,$b)=>[$a['competition'],$a['home'],$a['fixture_id']]<=>[$b['competition'],$b['home'],$b['fixture_id']]);
    return ['rows'=>$out,'summary'=>$summary];
}
function rc_metadata(PDO $db,string $gw,?int $season,?array $scope=null): array {
    $seasons=[];$dates=[];$competitions=[];$expected=[];$reportIds=[];$invalid=0;$sourceIds=[];$signatures=[];
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    foreach (rc_sources() as $kind=>$repository) {
        $scan=$db->query('SELECT '.rc_select($kind,$db,$gw).' FROM `'.nexus_table($gw,$repository).'` WHERE sm_fixture_id>0');
        while ($record=$scan->fetch()) {
            $id=rc_fixture($record['sm_fixture_id']);$sourceIds[$kind][$id]=($sourceIds[$kind][$id]??0)+1;
            $signature=[];
            foreach (['match_date','imc_season','competition_key','sm_country','sm_division','home_id','away_id'] as $field) {
                $value=trim((string)($record[$field]??''));
                if ($field==='match_date') $value=rc_day($value);
                if (in_array($field,['imc_season','sm_division','home_id','away_id'],true)&&ctype_digit($value)) $value=(string)(int)$value;
                $signature[]=$value;
            }
            $signatures[$id][md5(json_encode($signature))]=true;
        }
    }
    // The existence check deliberately includes reports stored under another date/season.
    $stmt=$db->query('SELECT sm_fixture_id FROM `'.nexus_table($gw,'Match_Report').'` WHERE sm_fixture_id>0');
    while ($row=$stmt->fetch()) $reportIds[rc_fixture($row['sm_fixture_id'])]=true;
    foreach (rc_sources() as $source=>$repo) {
        $table=nexus_table($gw,$repo);
        foreach (nexus_rows($db,'SELECT DISTINCT imc_season FROM `'.$table.'` WHERE imc_season>0') as $row) $seasons[(int)$row['imc_season']]=true;
        $stmt=$db->prepare('SELECT '.rc_select($source,$db,$gw).' FROM `'.$table.'`'.($season!==null?' WHERE imc_season=?':''));
        $stmt->execute($season!==null?[$season]:[]);
        while ($row=$stmt->fetch()) {
            $eligible=rc_imc($row,$scope);
            if ($source==='report'&&!$eligible) continue;
            $day=rc_day($row['match_date']);if (!$day||$day==='0000-00-00') $day='undated';
            $key=json_encode([$row['competition_key'],$row['sm_country'],$row['sm_division']]);
            if (!isset($dates[$day])) $dates[$day]=['date'=>$day,'schedule'=>0,'results'=>0,'report'=>0];
            if (!isset($competitions[$key])) $competitions[$key]=['competition'=>$row['competition_key']??'','country'=>$row['sm_country']??'','division'=>$row['sm_division'],'action'=>$row['sm_action'],'schedule'=>0,'results'=>0,'report'=>0,'expected_report'=>0,'missing_reports'=>0,'issue_days'=>[]];
            $dates[$day][$source]++;$competitions[$key][$source]++;
            $id=rc_fixture($row['sm_fixture_id']);$problems=[];
            if ($id===null) $problems[]='Fixture ID mancante';
            if ($id!==null && count($signatures[$id]??[])>1) $problems[]='Dati discordanti';
            if ($id!==null && ($sourceIds[$source][$id]??0)>1) $problems[]='Duplicati';
            if ($source==='schedule' && $day!=='undated' && $day<$today && ($id===null||!isset($sourceIds['results'][$id]))) $problems[]='Risultato mancante';
            if ($source==='results' && ($id===null||!isset($sourceIds['schedule'][$id]))) $problems[]='Schedule mancante';
            if ($source==='report' && ($id===null||!isset($sourceIds['results'][$id]))) $problems[]='Results mancante';
            if ($source==='results' && $eligible && ($id===null||!isset($reportIds[$id]))) $problems[]='Match Report mancante';
            if ($problems) {
                $round=trim((string)($row['competition_round']??''));
                $issueKey=json_encode([$day,$row['imc_season'],$round]);
                if (!isset($competitions[$key]['issue_days'][$issueKey])) $competitions[$key]['issue_days'][$issueKey]=['date'=>$day,'season'=>$row['imc_season'],'round'=>$round,'issues'=>[],'fixtures'=>[]];
                $bucket=&$competitions[$key]['issue_days'][$issueKey];
                $token=$id??$source.'-invalid-'.(++$invalid);$bucket['fixtures'][$token]=true;
                foreach ($problems as $problem) $bucket['issues'][$problem][$token]=true;
                unset($bucket);
            }
            if ($source==='results'&&$eligible) {
                $id=rc_fixture($row['sm_fixture_id']);$unique=$id??'invalid-'.(++$invalid);
                if (!isset($expected[$key][$unique])) {
                    $expected[$key][$unique]=true;$competitions[$key]['expected_report']++;
                    if ($id===null||!isset($reportIds[$id])) $competitions[$key]['missing_reports']++;
                }
            }
        }
    }
    foreach ($competitions as &$competition) {
        $competition['issue_count']=0;
        foreach ($competition['issue_days'] as &$bucket) {
            $bucket['count']=count($bucket['fixtures']);unset($bucket['fixtures']);
            foreach ($bucket['issues'] as &$ids) $ids=count($ids);unset($ids);
            $competition['issue_count']+=$bucket['count'];
        } unset($bucket);
        $competition['issue_days']=array_values($competition['issue_days']);
        usort($competition['issue_days'],fn($a,$b)=>strcmp($b['date'],$a['date']));
    } unset($competition);
    $seasons=array_keys($seasons);rsort($seasons);ksort($dates);
    return ['seasons'=>$seasons,'dates'=>array_values($dates),'competitions'=>array_values($competitions),'imc_only'=>$scope!==null];
}
function rc_check(PDO $db,string $gw,string $date,?int $season,string $today,?array $scope=null): array {
    if ($date!=='undated') na_date($date);
    $sets=[];$ids=[];$missing=[];
    foreach (rc_sources() as $source=>$repo) {
        $table=nexus_table($gw,$repo);
        $where=$date==='undated'?"(match_date IS NULL OR LEFT(CAST(match_date AS CHAR),10)='0000-00-00')":'match_date>=? AND match_date<DATE_ADD(?, INTERVAL 1 DAY)';
        $params=$date==='undated'?[]:[$date,$date];
        if ($season!==null) {$where.=' AND imc_season=?';$params[]=$season;}
        $rows=nexus_rows($db,'SELECT '.rc_select($source,$db,$gw).' FROM `'.$table.'` WHERE '.$where,$params);
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
            $rows=nexus_rows($db,'SELECT '.rc_select($source,$db,$gw).' FROM `'.$table.'` WHERE sm_fixture_id IN ('.implode(',',array_fill(0,count($batch),'?')).')',$batch);
            $sets[$source]=array_merge($sets[$source],$rows);
        }
    }
    return rc_build($sets,$date,$season,$today,$scope);
}
