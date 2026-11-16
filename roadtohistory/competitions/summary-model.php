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
    $played=0;$latest=null;$next=null;$rounds=[];
    foreach ($fixtures as $fixture) {
        if (!empty($fixture['played'])) { $played++;$latest=$fixture; }
        elseif ($next===null) $next=$fixture;
        $round=trim((string)($fixture['competition_round']??''))?:substr((string)$fixture['match_date'],0,10);
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
    $existing['played_days']=null;
    if ($league && $teams!==null && $teams>1 && $known) {
        $perDay=(int)floor($teams/2);
        $existing['played_days']=count(array_filter($rounds,static fn($count)=>$count===$perDay));
    }
    return $existing;
}
