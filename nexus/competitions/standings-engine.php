<?php
declare(strict_types=1);

function nexus_standings_group(array $row): string {
    $group=trim((string)($row['competition_group_name']??''));
    if($group!=='')return $group;
    $stage=trim((string)($row['competition_stage']??''));
    if(preg_match('/^(?:group\s+(?:stage|phase)|fase\s+a\s+gironi)$/i',$stage))return '';
    return preg_match('/^(?:group|gruppo|girone)\s+[A-Z0-9]+$/i',$stage)?$stage:'';
}

function nexus_standings_tables(array $rows, array $seeds=[]): array {
    $eligible=[];$seen=[];$hasGroups=false;
    foreach($rows as $r){
        if($r['home_score']===null||$r['away_score']===null)continue;
        $stage=trim((string)($r['competition_stage']??''));
        // Knockout matches never contribute to a group table, even if a group label remains on the row.
        if($stage!==''&&!preg_match('/group|grupp|giron|league|campionato/i',$stage))continue;
        $fixture=(string)($r['sm_fixture_id']??'');
        if($fixture!==''&&isset($seen[$fixture]))continue;
        if($fixture!=='')$seen[$fixture]=true;
        $r['_group']=nexus_standings_group($r);$hasGroups=$hasGroups||$r['_group']!=='';$eligible[]=$r;
    }
    $tables=[];$excluded=0;
    foreach($seeds as $seed){
        $name=$seed['group_name'];$tables[$name]=[];$hasGroups=true;
        foreach($seed['teams'] as $team){
            $id=(string)$team['team_id'];
            $tables[$name][$id]=['team_id'=>$id,'team_name'=>$team['team_name'],'played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'gd'=>0,'points'=>0];
        }
    }
    foreach($eligible as $r){
        $group=$r['_group'];
        if($hasGroups&&$group===''){$excluded++;continue;}
        $h=(string)($r['home_sm_club_id']?:$r['home_name']);$a=(string)($r['away_sm_club_id']?:$r['away_name']);
        if($h===''||$a==='')continue;
        if(!isset($tables[$group]))$tables[$group]=[];
        $teams=&$tables[$group];
        foreach([[$h,$r['home_name']],[$a,$r['away_name']]] as [$id,$name])if(!isset($teams[$id]))$teams[$id]=['team_id'=>$id,'team_name'=>$name,'played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'gd'=>0,'points'=>0];
        $hs=(int)$r['home_score'];$as=(int)$r['away_score'];
        $teams[$h]['played']++;$teams[$a]['played']++;$teams[$h]['gf']+=$hs;$teams[$h]['ga']+=$as;$teams[$a]['gf']+=$as;$teams[$a]['ga']+=$hs;
        if($hs>$as){$teams[$h]['won']++;$teams[$h]['points']+=3;$teams[$a]['lost']++;}
        elseif($hs<$as){$teams[$a]['won']++;$teams[$a]['points']+=3;$teams[$h]['lost']++;}
        else{$teams[$h]['drawn']++;$teams[$a]['drawn']++;$teams[$h]['points']++;$teams[$a]['points']++;}
        unset($teams);
    }
    uksort($tables,'strnatcasecmp');$groups=[];$flat=[];
    foreach($tables as $name=>$teams){
        foreach($teams as &$t)$t['gd']=$t['gf']-$t['ga'];unset($t);
        $tableRows=array_values($teams);
        usort($tableRows,fn($x,$y)=>[$y['points'],$y['gd'],$y['gf'],$x['team_name']]<=>[$x['points'],$x['gd'],$x['gf'],$y['team_name']]);
        foreach($tableRows as $i=>&$t){$t['position']=$i+1;$t['group_name']=$name?:null;}unset($t);
        $groups[]=['group_name'=>$name?:null,'rows'=>$tableRows];$flat=array_merge($flat,$tableRows);
    }
    return ['grouped'=>$hasGroups,'groups'=>$groups,'rows'=>$flat,'excluded_unassigned'=>$excluded];
}
