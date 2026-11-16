<?php
declare(strict_types=1);

function cupPhase(array $r): array {
 $stage=trim((string)($r['competition_stage']??''));$round=trim((string)($r['competition_round']??''));
 $text=trim($stage.' '.$round);$leg='';
 if(preg_match('/\b(andata|ritorno|first leg|second leg)\b/i',$text,$m))$leg=in_array(strtolower($m[1]),['andata','first leg'])?'Andata':'Ritorno';
 if(preg_match('/giron[ei]|group stage|fase a gruppi/i',$text)||(!empty($r['competition_group_name'])&&!$text))return ['Gironi',$leg];
 foreach(['Ottavi'=>'/ottav|round of 16/i','Quarti'=>'/quart/i','Semifinale'=>'/semi/i','Finale'=>'/\bfinale*\b/i'] as $label=>$pattern)if(preg_match($pattern,$text))return [$label,$leg];
 $label=preg_replace('/\b(andata|ritorno|first leg|second leg)\b/i','',$round)?:$stage;
 $label=trim($label," -·");return [ctype_digit($label)?'Turno '.$label:$label,$leg];
}
// A summary is scoped to the selected IMC season. Missing data stays null.
function imc_competition_is_league(array $row): bool {
    $key=(string)($row['competition_key']??'');
    if (str_contains($key,'|playoff|')) return false;
    return ($row['sm_action']??'')==='league' ||
        (bool)preg_match('/\|IMC\|(?:championsleague|europaleague|conferenceleague|risingstarsleague|nextgenleague)(?:\||$)/i',$key);
}

function imc_competition_turn(?array $fixture, bool $league): ?array {
    if (!$fixture) return null;
    $date=substr((string)($fixture['match_date']??''),0,10);
    if (!preg_match('/^[1-9]\d{3}-\d{2}-\d{2}$/D',$date)) return null;
    $raw=trim((string)($fixture['competition_round']??''));
    $number=null;
    if (preg_match('/^(?:(?:giornata|turno|round|matchday)\s*)?(\d+)$/i',$raw,$m)) $number=(int)$m[1];
    if ($league) return ['date'=>$date,'number'=>$number,'label'=>$number?'Giornata '.$number:null];
    [$phase,$leg]=cupPhase($fixture);
    $stage=trim((string)($fixture['competition_stage']??''));
    if (($fixture['sm_action']??'')==='interqualifier' ||
        preg_match('/^(?:girone\s+|group\s+)?[A-Z]$/i',$stage) ||
        !empty($fixture['competition_group_name'])) {
        if (!preg_match('/ottav|quart|semi|finale/i',$phase)) $phase='Gironi';
    }
    $phase=['Ottavi'=>'Ottavi di Finale','Quarti'=>'Quarti di Finale','Semifinale'=>'Semifinali'][$phase]??$phase;
    if ($phase==='Turno' || $phase==='In corso' || $phase==='In programma') $phase='';
    return ['date'=>$date,'number'=>$number,'label'=>$phase!==''?$phase.($leg!==''?' · '.$leg:''):null];
}

function imc_competition_summary(array $row,array $definition,array $fixtures,array $existing,array $award): array {
    $league=imc_competition_is_league($row);
    $unique=[];
    foreach ($fixtures as $fixture) {
        $id=trim((string)($fixture['sm_fixture_id']??''));
        $token=$id!==''?$id:json_encode([$fixture['match_date']??null,$fixture['h']??$fixture['home_name']??null,$fixture['a']??$fixture['away_name']??null]);
        // Results take precedence over the matching Schedule row.
        if (!isset($unique[$token]) || !empty($fixture['played'])) $unique[$token]=$fixture;
    }
    $fixtures=array_values($unique);
    usort($fixtures,static fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']) ?: strcmp((string)($a['sm_fixture_id']??''),(string)($b['sm_fixture_id']??'')));
    $played=0;$latest=null;$next=null;$rounds=[];$turns=[];
    foreach ($fixtures as $fixture) {
        if (!empty($fixture['played'])) { $played++;$latest=$fixture; }
        elseif ($next===null) $next=$fixture;
        $day=substr((string)$fixture['match_date'],0,10);
        if (preg_match('/^[1-9]\d{3}-\d{2}-\d{2}$/D',$day)) {
            $turns[$day]['sample']=$fixture;
            $turns[$day]['played']=($turns[$day]['played']??0)+(!empty($fixture['played'])?1:0);
            $turns[$day]['pending']=($turns[$day]['pending']??0)+(empty($fixture['played'])?1:0);
        }
        $round=trim((string)($fixture['competition_round']??''))?:$day;
        if (!empty($fixture['played'])) $rounds[$round]=($rounds[$round]??0)+1;
    }
    $expected=(int)($definition['expected_match']??0)?:null;
    $totalDays=(int)($definition['expected_matchdays']??0)?:null;
    $teams=(int)($definition['teams_count']??0)?:null;
    $known=count($fixtures)>0;
    $complete=$league || ($row['sm_action']??'')==='interqualifier'
        ? ($known && $expected!==null && $played===$expected)
        : !empty($existing['final_played']);
    if (!empty($award['winner_name'])) $complete=true;
    $existing['league_summary']=$league && ($row['competition_group']??'')==='IMC';
    $existing['expected']=$expected;
    $existing['played']=$known?$played:null;
    $existing['percent']=$known && $expected!==null ? min(100,(int)round(100*$played/$expected)):null;
    $existing['complete']=$complete;
    $existing['position']=null;
    $existing['format']=[];
    $existing['status']=$complete?'Conclusa':($played>0?'In corso':($known?'In programma':null));
    foreach (['last_turn'=>$latest,'next_turn'=>$next] as $slot=>$fixture) {
        $turn=imc_competition_turn($fixture,$league);
        // Preserve a matchday already resolved from a complete season calendar.
        $previous=$existing[$slot]??null;
        if ($league && $turn && !$turn['number'] && ($previous['date']??null)===$turn['date'] && !empty($previous['number'])) {
            $turn['number']=(int)$previous['number'];
            $turn['label']='Giornata '.$turn['number'];
        }
        $existing[$slot]=$turn;
    }
    $existing['next_date']=$existing['next_turn']['date']??null;
    $existing['total_days']=$totalDays;
    $playedDays=0;
    foreach ($turns as $turn) {
        if ($turn['pending']>0 || $turn['played']===0) continue;
        $required=null;
        [$phase]=cupPhase($turn['sample']);
        if ($league && $teams!==null && $teams>1) $required=(int)floor($teams/2);
        elseif (($row['sm_action']??'')==='interqualifier' && $expected && $totalDays) $required=(int)($expected/$totalDays);
        elseif (in_array($phase,['Ottavi','Quarti','Semifinale','Finale'],true)) $required=['Ottavi'=>8,'Quarti'=>4,'Semifinale'=>2,'Finale'=>1][$phase];
        elseif (in_array($row['sm_action']??'',['smfacup','smfashield','worldcup'],true) && $teams && ($phase==='' || $phase==='Gironi')) $required=(int)($teams/2);
        if ($required===null || $turn['played']>=$required) $playedDays++;
    }
    $existing['played_days']=$totalDays!==null?min($totalDays,$playedDays):null;
    $existing['remaining_days']=$totalDays!==null?$totalDays-$existing['played_days']:null;
    $existing['round_percent']=$totalDays!==null?(int)round(100*$existing['played_days']/$totalDays):null;
    if (!$known && $totalDays!==null) $existing['status']='In programma';
    $calendar=imc_competition_calendar($row,$definition,$fixtures);
    foreach (['last_turn','next_turn'] as $slot) {
        $date=$existing[$slot]['date']??null;
        if ($date && isset($calendar[$date])) {
            $resolved=$calendar[$date];
            if (!$resolved['number'] && !empty($existing[$slot]['number'])) {
                $resolved['number']=$existing[$slot]['number'];
                $resolved['label']=$existing[$slot]['label'];
                $resolved['number_label']=($league?'Giornata ':'Turno ').$resolved['number'].($totalDays?' di '.$totalDays:'');
            }
            $existing[$slot]=array_replace($existing[$slot],$resolved);
        }
    }
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    $pending=[];
    foreach($fixtures as $fixture)if(empty($fixture['played'])){
        $date=substr((string)($fixture['match_date']??''),0,10);
        if($date>=$today && isset($calendar[$date]))$pending[$date]=$calendar[$date];
    }
    ksort($pending);$existing['calendar_turns']=array_values($pending);
    return $existing;
}

// Resolve a fixture's place only from an explicit matchday, a complete calendar,
// or a named knockout phase anchored to the configured final turn.
function imc_competition_calendar(array $row,array $definition,array $fixtures): array {
    $league=imc_competition_is_league($row);
    $total=(int)($definition['expected_matchdays']??0);
    $days=[];
    foreach($fixtures as $r) {
        $turn=imc_competition_turn($r,$league);
        if($turn) $days[$turn['date']]=$r;
    }
    ksort($days);$out=[];$index=0;
    foreach($days as $date=>$r) {
        $index++;$turn=imc_competition_turn($r,$league);$n=$turn['number'];
        if(!$league && !in_array(cupPhase($r)[0],['Gironi'],true) && ($row['sm_action']??'')!=='interqualifier') $n=null; // Knockout round numbers restart.
        if($total>0 && count($days)===$total) $n=$index;
        if(!$league && $total>0) {
            [$phase,$leg]=cupPhase($r);
            $twoLeg=in_array($row['sm_action']??'',['smfacup','smfashield'],true);
            $offset=['Finale'=>0,'Semifinale'=>$twoLeg?2:1,'Quarti'=>$twoLeg?4:2,'Ottavi'=>$twoLeg?6:3][$phase]??null;
            if($offset!==null) $n=$total-$offset+($twoLeg && $leg==='Ritorno'?1:0);
            if($twoLeg && $phase!=='Finale' && $leg==='') $n=count($days)===$total?$index:null;
        }
        if($n!==null && ($n<1 || ($total>0 && $n>$total))) $n=null;
        $turn['number']=$n;$turn['total']=$total?:null;
        if($league && $n) $turn['label']='Giornata '.$n;
        $turn['number_label']=$n?($league?'Giornata ':'Turno ').$n.($total?' di '.$total:''):null;
        $out[$date]=$turn;
    }
    return $out;
}


function imc_competition_available(string $world,int $season,string $action): bool {
    return $season!==1 || in_array(strtoupper($world),['GW004','IMC006','IMC-006'],true) || !in_array(strtolower($action),['charityshield','supercup'],true);
}
