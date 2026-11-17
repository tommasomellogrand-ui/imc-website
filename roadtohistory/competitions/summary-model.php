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
    // A Result is authoritative for its turn. Schedule IDs and the number of
    // imported matches never veto a turn already represented in Results.
    $resultDates=[];
    foreach($unique as $fixture)if(!empty($fixture['played'])){
        $date=substr((string)($fixture['match_date']??''),0,10);
        if(preg_match('/^[1-9]\d{3}-\d{2}-\d{2}$/D',$date))$resultDates[$date]=true;
    }
    $fixtures=array_values(array_filter($unique,static fn($fixture)=>
        !empty($fixture['played']) || !isset($resultDates[substr((string)($fixture['match_date']??''),0,10)])
    ));
    usort($fixtures,static fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']) ?: strcmp((string)($a['sm_fixture_id']??''),(string)($b['sm_fixture_id']??'')));
    $played=0;$latest=null;$next=null;
    foreach ($fixtures as $fixture) {
        if (!empty($fixture['played'])) { $played++;$latest=$fixture; }
        elseif ($next===null) $next=$fixture;

    }
    $expected=(int)($definition['expected_match']??0)?:null;
    $totalDays=(int)($definition['expected_matchdays']??0)?:null;
    $known=count($fixtures)>0;
    $complete=$league || ($row['sm_action']??'')==='interqualifier'
        ? ($known && $expected!==null && $played===$expected)
        : !empty($existing['final_played']);
    if (($row['sm_action']??'')==='worldcup') foreach($fixtures as $fixture) {
        [$phase,$leg]=cupPhase($fixture);
        if (!empty($fixture['played']) && $phase==='Finale' && $leg!=='Andata') $complete=true;
    }
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
    $playedDays=count($resultDates);
    $existing['played_days']=$totalDays!==null?min($totalDays,$playedDays):null;
    $existing['remaining_days']=$totalDays!==null?$totalDays-$existing['played_days']:null;
    $existing['round_percent']=$totalDays!==null?(int)round(100*$existing['played_days']/$totalDays):null;
    if (!$known && $totalDays!==null) $existing['status']='In programma';
    $calendar=imc_competition_calendar($row,$definition,$fixtures);
    foreach (['last_turn','next_turn'] as $slot) {
        $date=$existing[$slot]['date']??null;
        if ($date && isset($calendar[$date])) {
            $resolved=$calendar[$date];
            if ((!$resolved['number'] || !empty($resolved['number_from_results'])) && !empty($existing[$slot]['number'])) {
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
    ksort($pending);
    $existing['calendar_turns']=imc_competition_home_turns($row,$totalDays,$playedDays,$existing['last_turn'],$pending,$today,$complete);
    // Separate Home phase counters without changing the edition turn number.
    foreach (['last_turn','next_turn'] as $slot) {
        if ($existing[$slot]) $existing[$slot]=imc_home_phase_turn($row,$definition,$existing[$slot]);
    }
    $existing['calendar_turns']=array_map(static fn($turn)=>imc_home_phase_turn($row,$definition,$turn),$existing['calendar_turns']);
    return $existing;
}

function imc_home_phase_turn(array $row,array $definition,array $turn): array {
    $action=$row['sm_action']??'';
    $total=(int)($definition['expected_matchdays']??0);
    $groups=null;
    if ($action==='worldcup') $groups=3;
    elseif (in_array($action,['smfacup','smfashield'],true)) {
        $teams=(int)($definition['teams_count']??0);
        if ($teams===16 && $total===8) $groups=3;
        elseif ($teams===32 && $total===13) $groups=6;
    }
    elseif ($action==='interqualifier') $groups=$total?:null;
    if ($groups===null) return $turn;
    $number=$turn['number']??null;
    if (!$number) return $turn;
    $group=$number<=$groups;
    $turn['phase']=$group?'Group Stage':'Knockout Stage';
    $turn['phase_number']=$group?$number:$number-$groups;
    $turn['phase_total']=$group?$groups:($total>$groups?$total-$groups:null);
    $turn['phase_number_label']=($group?'Giornata ':'Turno ').$turn['phase_number'].($turn['phase_total']?' di '.$turn['phase_total']:'');
    return $turn;
}

// Home can show daily IMC and World Cup turns before Schedule imports. These are turn
// summaries only: the fixture calendar used by Matchday stays unchanged.
function imc_competition_home_turns(array $row,?int $total,int $played,?array $last,array $pending,string $today,bool $complete): array {
    $worldCup=($row['sm_action']??'')==='worldcup' && ($row['competition_group']??'')==='NATIONS';
    if ((($row['competition_group']??'')!=='IMC' && !$worldCup) || !$total) return array_values($pending);
    if ($complete) return [];
    $played=max($played,(int)($last['number']??0));
    $remaining=max(0,$total-$played);
    if (!$remaining) return [];
    // An unstarted competition needs its first imported date as an anchor.
    if (!$last && !$pending) return [];
    $zone=new DateTimeZone('Europe/Rome');
    $start=$last ? (new DateTimeImmutable($last['date'],$zone))->modify('+1 day')->format('Y-m-d') : array_key_first($pending);
    $date=new DateTimeImmutable(max($today,$start),$zone);
    $turns=array_slice($pending,0,$remaining,true);
    while (count($turns)<$remaining) {
        $day=$date->format('Y-m-d');
        if (!isset($turns[$day])) $turns[$day]=['date'=>$day,'label'=>null,'projected'=>true];
        $date=$date->modify('+1 day');
    }
    ksort($turns);$league=imc_competition_is_league($row);$number=$played;
    foreach ($turns as &$turn) {
        $turn['number']=++$number;$turn['total']=$total;
        $turn['number_label']=($league?'Giornata ':'Turno ').$number.' di '.$total;
        if ($league) $turn['label']='Giornata '.$number;
        if ($worldCup && $total>4) {
            $knockout=$number-($total-4);
            $turn['label']=$knockout>0 ? [1=>'Ottavi di Finale',2=>'Quarti di Finale',3=>'Semifinali',4=>'Finale'][$knockout] : 'Gironi · Giornata '.$number;
        }
    }
    unset($turn);
    return array_values($turns);
}

// Resolve turns from explicit labels or the played Results sequence.
// A league's future calendar continues from its latest played turn.
function imc_competition_calendar(array $row,array $definition,array $fixtures): array {
    $league=imc_competition_is_league($row);
    $total=(int)($definition['expected_matchdays']??0);
    $days=[];$resultDates=[];
    foreach($fixtures as $r) {
        $turn=imc_competition_turn($r,$league);
        if(!$turn)continue;
        $date=$turn['date'];
        if(!empty($r['played']))$resultDates[$date]=true;
        // Results win over stale Schedule labels for the same turn.
        if(!isset($days[$date]) || !empty($r['played']) || empty($days[$date]['played']))$days[$date]=$r;
    }
    ksort($days);$out=[];$index=0;$leagueNumbers=[];
    if($league && $resultDates){
        $position=0;$lastPlayed=max(array_keys($resultDates));
        foreach($days as $date=>$r)if(isset($resultDates[$date])){
            $position=imc_competition_turn($r,true)['number']??($position+1);
            $leagueNumbers[$date]=$position;
        }
        foreach($days as $date=>$r)if($date>$lastPlayed && !isset($resultDates[$date])){
            $position=imc_competition_turn($r,true)['number']??($position+1);
            $leagueNumbers[$date]=$position;
        }
    }
    foreach($days as $date=>$r) {
        $index++;$turn=imc_competition_turn($r,$league);$n=$turn['number'];$fromResults=false;
        if(!$league && !in_array(cupPhase($r)[0],['Gironi'],true) && ($row['sm_action']??'')!=='interqualifier') $n=null; // Knockout round numbers restart.
        if($n===null && $league && isset($leagueNumbers[$date])){$n=$leagueNumbers[$date];$fromResults=true;}
        // Initial Schedule imports can omit round labels. Before any Results,
        // number the imported league/SMFA dates from the season opening turn.
        if($n===null && (($league && !$resultDates) || in_array($row['sm_action']??'',['smfacup','smfashield'],true))) $n=$index;
        if($total>0 && count($days)===$total){$n=$index;$fromResults=false;}
        if(!$league && $total>0) {
            [$phase,$leg]=cupPhase($r);
            $twoLeg=in_array($row['sm_action']??'',['smfacup','smfashield'],true);
            $offset=['Finale'=>0,'Semifinale'=>$twoLeg?2:1,'Quarti'=>$twoLeg?4:2,'Ottavi'=>$twoLeg?6:3][$phase]??null;
            if($offset!==null) $n=$total-$offset+($twoLeg && $leg==='Ritorno'?1:0);
            if($twoLeg && in_array($phase,['Ottavi','Quarti','Semifinale'],true) && $leg==='') $n=count($days)===$total?$index:null;
        }
        if($n!==null && ($n<1 || ($total>0 && $n>$total))) $n=null;
        $turn['number']=$n;$turn['total']=$total?:null;
        if($fromResults)$turn['number_from_results']=true;
        if($league && $n) $turn['label']='Giornata '.$n;
        $turn['number_label']=$n?($league?'Giornata ':'Turno ').$n.($total?' di '.$total:''):null;
        $out[$date]=$turn;
    }
    return $out;
}


function imc_competition_available(string $world,int $season,string $action): bool {
    return $season!==1 || in_array(strtoupper($world),['GW004','IMC006','IMC-006'],true) || !in_array(strtolower($action),['charityshield','supercup'],true);
}

// The World Cup keeps its edition season while the rest of Home follows the current season.
function imc_home_worldcup_scope(array $current,array $previous): array {
 foreach($previous as $key=>$fixtures){
  if(!empty($current[$key]))continue;
  $cup=array_filter($fixtures,static fn($r)=>strtolower(trim((string)($r['sm_action']??'')))==='worldcup');
  if($cup)$current[$key]=$cup;
 }
 return $current;
}
