<?php
declare(strict_types=1);

// Pure derivation: no writes, network access or dependency on the current club roster.
const TROPHY_ENGINE_VERSION = '20261006.1';
function trophy_nexus_view(array $row,array $labels): string {
    $key=(string)$row['competition_key'];
    if (isset($labels[$key])) return (string)$labels[$key];
    // Same fallback names and country/division rules as the competition catalog.
    $parts=explode('|',$key);$groupIndex=null;
    foreach($parts as $i=>$part)if(in_array($part,['DOMESTIC','INTERNATIONAL','NATIONS'],true)){$groupIndex=$i;break;}
    $action=strtolower(trim((string)$row['trophy_type']));
    $country=$groupIndex===2?$parts[1]:null;
    $division=$groupIndex!==null?($parts[$groupIndex+2]??$row['sm_division']??null):($row['sm_division']??null);
    $names=['charityshield'=>'Charity Shield','leaguecup'=>'National Cup','nationalcup'=>'National Cup','leagueshield'=>'League Cup','smfacup'=>'SMFA Champions','smfashield'=>'SMFA Shield','supercup'=>'SMFA Super Cup','interqualifier'=>'World Cup Qualifiers','worldcup'=>'World Cup'];
    $name=in_array($action,['league','playoff'],true)?'Div '.$division.($action==='playoff'?' Playoff':''):($names[$action]??$action);
    return ($country?$country.' ':'').$name;
}
function trophy_name(string $name): string {
    return function_exists('mb_strtolower') ? mb_strtolower(trim($name),'UTF-8') : strtolower(trim($name));
}
function trophy_resolve_ids(array $results,array $reports,array $schedules,array $mapping): array {
    $names=[];
    foreach ($mapping as $row) {
        $id=(int)($row['SM World Club ID']??0);$name=trophy_name((string)($row['Club Name']??''));
        if ($id>0 && $name!=='')$names[$name][$id]=true;
    }
    foreach ([$results,$reports,$schedules] as $list) foreach ($list as $r) {
        if (($r['competition_group']??'')==='NATIONS' || in_array($r['sm_action']??'',['worldcup','interqualifier'],true)) continue;
        foreach (['home','away'] as $side) {
            $id=(int)($r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??0);$name=trophy_name((string)($r[$side.'_name']??''));
            if ($id>0 && $name!=='')$names[$name][$id]=true;
        }
    }
    $resolve=static function(array $list)use($names):array {
        foreach ($list as &$r) {
            if (($r['competition_group']??'')==='NATIONS' || in_array($r['sm_action']??'',['worldcup','interqualifier'],true)) continue;
            foreach (['home','away'] as $side) {
                $field=array_key_exists($side.'_sm_team_id',$r)?$side.'_sm_team_id':$side.'_sm_club_id';
                if ((int)($r[$field]??0)>0)continue;
                $ids=$names[trophy_name((string)($r[$side.'_name']??''))]??[];
                if(count($ids)===1)$r[$field]=(int)array_key_first($ids);
            }
        }unset($r);return $list;
    };
    return [$resolve($results),$resolve($reports),$resolve($schedules)];
}
function trophy_country(mixed $country): string {
    $s = strtoupper(trim((string)$country));
    return ['SPAGNA'=>'SPA','ESP'=>'SPA','INGHILTERRA'=>'ENG','FRANCIA'=>'FRA',
        'GERMANIA'=>'GER','ITALIA'=>'ITA','SCOZIA'=>'SCO','AMERICANO/A'=>'LAT',
        'EST EUROPA'=>'RNU','EUROPA CENTRALE'=>'CEN','MEDITERRANEO'=>'MED',
        'OLANDA & BELGIO'=>'HNB','SCANDINAVIA'=>'SCA','CUS'=>''][$s] ?? $s;
}
function trophy_group_key(array $r): ?string {
    if ((int)($r['imc_season'] ?? 0) < 1 || trim((string)($r['competition_key'] ?? '')) === '') return null;
    return $r['imc_season'].'|'.$r['competition_key'];
}
function trophy_fixture_map(array $rows): array {
    $out=[]; $conflicts=[];
    $fields=['imc_season','competition_key','sm_action','competition_stage','competition_round','match_date',
        'home_sm_club_id','away_sm_club_id','home_name','away_name','home_score','away_score',
        'penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score','result_status'];
    foreach ($rows as $r) {
        $id=(string)($r['sm_fixture_id'] ?? '');
        if ($id==='' || (int)$id<1) continue;
        if (isset($out[$id])) {
            foreach ($fields as $f) if ((string)($out[$id][$f]??'') !== (string)($r[$f]??'')) {
                $conflicts[$id]=true; break;
            }
        } else $out[$id]=$r;
    }
    return [$out,$conflicts];
}
function trophy_final(array $r): bool {
    foreach (['competition_stage','competition_round'] as $f) {
        if (preg_match('/^(?:playoff\s+)?finale?(?:\s*[-:–]\s*(?:andata|ritorno|1st leg|2nd leg|first leg|second leg))?$/iu',trim((string)($r[$f]??'')))) return true;
    }
    return false;
}
function trophy_leg(array $r): int {
    $s=trim(($r['competition_stage']??'').' '.($r['competition_round']??''));
    if (preg_match('/ritorno|second leg|2nd leg/i',$s)) return 2;
    if (preg_match('/andata|first leg|1st leg/i',$s)) return 1;
    return 0;
}
function trophy_score(array $r,string $h,string $a): ?int {
    if (!isset($r[$h],$r[$a]) || !is_numeric($r[$h]) || !is_numeric($r[$a])) return null;
    return (int)$r[$h] <=> (int)$r[$a];
}
function trophy_finished(array $r,string $today): bool {
    $status=strtoupper(trim((string)($r['result_status']??'')));
    return isset($r['home_score'],$r['away_score']) && !empty($r['match_date']) && $r['match_date']<=$today
        && in_array($status,['','COMPLETED','FT','FINISHED','PLAYED'],true);
}
function trophy_record(string $gw,array $r,string $side,string $method): array {
    return ['game_world_id'=>$gw,'imc_season'=>(int)$r['imc_season'],'competition_key'=>$r['competition_key'],
        'competition_group'=>$r['competition_group']??null,'trophy_type'=>$r['sm_action'],
        'sm_country'=>$r['sm_country']??null,'sm_division'=>$r['sm_division']??null,
        'winner_sm_world_club_id'=>(int)($r[$side.'_sm_club_id']??0) ?: null,
        'winner_name'=>$r[$side.'_name'],'decided_by'=>$method,
        'deciding_fixture_id'=>$method==='final'?(int)$r['sm_fixture_id']:null,'won_date'=>$r['match_date'],
        'date_source'=>'result',
        'source_repository'=>'IMC Results'];
}
function trophy_derive(string $gw,array $results,array $reports,array $schedules,array $definitions,string $today,array $mapping=[]): array {
    [$results,$reports,$schedules]=trophy_resolve_ids($results,[],$schedules,$mapping);
    [$fixtures,$conflicts]=trophy_fixture_map($results);
    [$reportMap,$reportConflicts]=trophy_fixture_map($reports);
    $groups=[]; $scheduleGroups=[]; $issues=[]; $invalid=0;
    foreach ($results as $r) {
        $key=trophy_group_key($r);
        if (!$key) {$invalid++; continue;}
        $groups[$key] ??= ['rows'=>[],'invalid'=>false];
        $id=(string)($r['sm_fixture_id']??'');
        if ((int)$id<1 || isset($conflicts[$id])) $groups[$key]['invalid']=true;
        else $groups[$key]['rows'][$id]=$r;
    }
    foreach ($schedules as $r) if ($key=trophy_group_key($r)) $scheduleGroups[$key][]=$r;
    $awards=[];
    foreach ($groups as $key=>$group) {
        $rows=array_values($group['rows']);
        if ($group['invalid'] || !$rows) {$issues[$key]='conflicting_or_missing_fixture_id'; continue;}
        $sample=$rows[0]; $action=strtolower((string)$sample['sm_action']); $schedule=$scheduleGroups[$key]??[];
        if ($action==='league') {
            $reason=null;
            $winner=trophy_league($gw,$rows,$schedule,$definitions,$today,$reason);
            if ($winner) $awards[$key]=$winner; else $issues[$key]=$reason;
            continue;
        }
        if (!in_array($action,['leaguecup','leagueshield','charityshield','smfacup','smfashield','supercup','playoff','worldcup'],true)) continue;
        $finals=array_values(array_filter($rows,'trophy_final'));
        if (!$finals) {$issues[$key]='final_not_available';continue;}
        usort($finals,fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']));
        $last=$finals[count($finals)-1]; $id=(string)$last['sm_fixture_id'];
        if (count($finals)>2 || (count($finals)===2 && (trophy_leg($finals[0])!==1 || trophy_leg($last)!==2))) {
            $issues[$key]='ambiguous_finals';continue;
        }
        if (trophy_leg($last)===1) {$issues[$key]='awaiting_second_leg';continue;}
        // Results are the sole authority for final scores and winners.
        $m=$last; $mismatch=false;
        if (!trophy_finished($m,$today)) {
            $issues[$key]='final_incomplete';continue;
        }
        foreach ($schedule as $s) if (trophy_final($s) && ((string)($s['match_date']??'') > $m['match_date'] || trophy_leg($s)===2 && trophy_leg($m)!==2)) {
            $mismatch=true;
        }
        if ($mismatch) {$issues[$key]='awaiting_scheduled_final';continue;}
        $pen=trophy_score($m,'penalty_home_score','penalty_away_score');
        $agg=trophy_score($m,'aggregate_home_score','aggregate_away_score');
        $twoLeg=count($finals)===2 || trophy_leg($m)===2;
        if ($twoLeg && $agg===null && count($finals)===2) {
            $first=$finals[0];
            if (!trophy_finished($first,$today) || empty($first['home_sm_club_id']) || empty($first['away_sm_club_id'])
                || (string)$first['home_sm_club_id'] !== (string)$m['away_sm_club_id']
                || (string)$first['away_sm_club_id'] !== (string)$m['home_sm_club_id']) {
                $issues[$key]='two_leg_final_incomplete';continue;
            }
            $agg=((int)$m['home_score']+(int)$first['away_score']) <=> ((int)$m['away_score']+(int)$first['home_score']);
        }
        if ($pen!==null && $pen!==0) $decision=$pen;
        elseif ($agg!==null) $decision=$agg;
        elseif ($twoLeg) {$issues[$key]='aggregate_missing';continue;}
        else $decision=trophy_score($m,'home_score','away_score');
        if (!$decision) {$issues[$key]='winner_undetermined';continue;}
        $side=$decision>0?'home':'away';
        if (empty($m[$side.'_name'])) {$issues[$key]='winner_name_missing';continue;}
        $awards[$key]=trophy_record($gw,$m,$side,'final');
    }
    ksort($awards); ksort($issues);
    return ['awards'=>array_values($awards),'pending'=>$issues,'unassigned_source_rows'=>$invalid];
}
function trophy_league(string $gw,array $rows,array $schedule,array $definitions,string $today,?string &$reason): ?array {
    $sample=$rows[0]; $expected=[];
    foreach ($definitions as $d) {
        if (($d['game_world_id']??'')!==$gw || ($d['sm_action']??'')!=='league' || (int)($d['teams_count']??0)<2 || (int)($d['expected_match']??0)<1) continue;
        if (!empty($d['competition_key']) && $d['competition_key']!==$sample['competition_key']) continue;
        if ((string)$d['sm_division']!==(string)$sample['sm_division'] || trophy_country($d['sm_country'])!==trophy_country($sample['sm_country'])) continue;
        $expected[(int)$d['teams_count'].'|'.(int)$d['expected_match']]=[(int)$d['teams_count'],(int)$d['expected_match']];
    }
    $teams=[]; $pairs=[]; $scheduleTeams=[]; $scheduled=[]; $nameIds=[];
    // Recover only an unambiguous ID already present for the same name in this competition.
    foreach (array_merge($rows,$schedule) as $r) foreach (['home','away'] as $side) {
        $name=strtolower(trim((string)($r[$side.'_name']??'')));
        $id=(int)($r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??0);
        if ($name!=='' && $id>0) $nameIds[$name][$id]=true;
    }
    $teamId=static function(array $r,string $side) use ($nameIds): ?int {
        $id=(int)($r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??0);
        if ($id>0) return $id;
        $ids=$nameIds[strtolower(trim((string)($r[$side.'_name']??'')))]??[];
        return count($ids)===1?(int)array_key_first($ids):null;
    };
    foreach ($schedule as $s) {
        $h=$teamId($s,'home');$a=$teamId($s,'away');
        if (!$h || !$a) {$reason='schedule_team_id_missing';return null;}
        $scheduleTeams[$h]=true;$scheduleTeams[$a]=true;
        $id=(string)($s['sm_fixture_id']??'');
        if ((int)$id<1) {$reason='schedule_fixture_id_missing';return null;}
        if (isset($scheduled[$id]) && $scheduled[$id]!==[$h,$a]) {$reason='schedule_fixture_conflict';return null;}
        $scheduled[$id]=[$h,$a];
    }
    $played=[];
    foreach ($rows as $r) {
        if (!trophy_finished($r,$today)) {$reason='league_not_complete';return null;}
        if (!empty($r['competition_group_name']) || preg_match('/group|grupp|giron|playoff/i',(string)($r['competition_stage']??''))) {$reason='league_group_format_requires_rule';return null;}
        $h=$teamId($r,'home');$a=$teamId($r,'away');
        if (!$h || !$a || $h===$a) {$reason='league_team_id_missing';return null;}
        $played[(string)$r['sm_fixture_id']]=[$h,$a];
        $pair=$h.'|'.$a; $pairs[$pair]=($pairs[$pair]??0)+1;
        foreach (['home'=>$h,'away'=>$a] as $side=>$id) $teams[$id]??=['id'=>$id,'name'=>$r[$side.'_name'],'points'=>0,'gd'=>0,'gf'=>0,'played'=>0];
        $hs=(int)$r['home_score'];$as=(int)$r['away_score'];
        $teams[$h]['points']+=$hs>$as?3:($hs===$as?1:0); $teams[$a]['points']+=$as>$hs?3:($hs===$as?1:0);
        $teams[$h]['gd']+=$hs-$as;$teams[$a]['gd']+=$as-$hs;
        $teams[$h]['gf']+=$hs;$teams[$a]['gf']+=$as;$teams[$h]['played']++;$teams[$a]['played']++;
    }
    if (count($expected)>1) {$reason='conflicting_league_definition';return null;}
    if (count($expected)===1) [$n,$matches]=array_values($expected)[0];
    else {
        // Without a Codex definition only a complete round-robin schedule is sufficient evidence.
        $n=count($scheduleTeams);$matches=count($scheduled);$sp=[];
        foreach ($scheduled as [$h,$a]) $sp[$h.'|'.$a]=($sp[$h.'|'.$a]??0)+1;
        if ($n<2 || count($sp)!==$n*($n-1) || count(array_unique(array_values($sp)))!==1) {$reason='league_definition_or_full_schedule_missing';return null;}
    }
    if (count($teams)!==$n || count($rows)!==$matches || $matches%($n*($n-1))!==0) {$reason='league_not_complete';return null;}
    $repeats=(int)($matches/($n*($n-1)));
    if (count($pairs)!==$n*($n-1) || count(array_filter($pairs,fn($v)=>$v!==$repeats))) {$reason='league_pairings_incomplete';return null;}
    foreach ($scheduled as $id=>$pair) if (!isset($played[$id]) || $played[$id]!==$pair) {$reason='scheduled_match_not_completed';return null;}
    $rank=array_values($teams);
    usort($rank,fn($a,$b)=>[$b['points'],$b['gd'],$b['gf']]<=>[$a['points'],$a['gd'],$a['gf']]);
    if ([$rank[0]['points'],$rank[0]['gd'],$rank[0]['gf']]===[$rank[1]['points'],$rank[1]['gd'],$rank[1]['gf']]) {$reason='league_tiebreak_unresolved';return null;}
    $sample['home_sm_club_id']=$rank[0]['id'];$sample['home_name']=$rank[0]['name'];
    $sample['match_date']=max(array_column($rows,'match_date'));
    return trophy_record($gw,$sample,'home','standings');
}

function trophy_manager_at_win(array $trophy,array $assignments,array $nationalManagers=[]): ?string {
    $day=(string)($trophy['won_date']??'');
    if (!preg_match('/^\\d{4}-\\d{2}-\\d{2}$/',$day)) return null;
    $isNation=($trophy['competition_group']??'')==='NATIONS' || strtolower((string)($trophy['trophy_type']??''))==='worldcup';
    $winner=(string)($trophy['winner_sm_world_club_id']??'');
    if ((int)$winner<1) return null;
    $managers=[];
    foreach($assignments as $a) {
        if (($a['game_world_id']??'')!==($trophy['game_world_id']??'')) continue;
        if ($isNation) {
            if (($a['assignment_type']??'')!=='national_team' || (string)($a['national_team_id']??'')!==$winner) continue;
        } else {
            if (($a['assignment_type']??'')!=='club' || (string)($a['team_id']??'')!==$winner) continue;
        }
        $start=(string)($a['start_date']??'');$end=$a['end_date']??null;
        if ($start==='' || $start==='0000-00-00' || $start>$day || ($end!==null && $end<$day)) continue;
        $id=trim((string)($a['manager_id']??''));
        if ($id!=='')$managers[$id]=true;
    }
    return count($managers)===1?(string)array_key_first($managers):null;
}
