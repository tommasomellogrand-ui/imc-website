<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/club-house/engine.php';
require_once dirname(__DIR__).'/club-house/ranking.php';
require_once dirname(__DIR__).'/trophies/engine.php';

// Pure, read-only aggregation. A fixture belongs to one world; managers are
// attributed by the identities recorded on Results, never today's club manager.
function na_aliases(array $w): array { return array_unique([$w['id'],$w['code'],$w['legacy']]); }
function na_key(string $key): string { return preg_replace('/^(?:GW\d{3}|IMC-?\d{3})/','',$key); }
function na_fixture_key(array $r): ?string {
    if((int)($r['sm_fixture_id']??0)>0)return 'sm:'.$r['sm_fixture_id'];
    if(empty($r['competition_key'])||empty($r['match_date'])||(int)($r['home_sm_club_id']??0)<1||(int)($r['away_sm_club_id']??0)<1)return null;
    $v=[];foreach(['competition_key','imc_season','match_date','home_sm_club_id','away_sm_club_id','competition_stage','competition_round','competition_group_name'] as $k)$v[]=(string)($r[$k]??'');
    return 'manual:'.substr(hash('sha256',json_encode($v)),0,24);
}
function na_finished(array $r,string $today): bool {
    return !empty($r['match_date'])&&$r['match_date']<=$today&&is_numeric($r['home_score']??null)&&is_numeric($r['away_score']??null)&&(int)$r['home_score']>=0&&(int)$r['away_score']>=0&&in_array(strtoupper(trim((string)($r['result_status']??''))),['','COMPLETED','FT','FINISHED','PLAYED','AWARDED'],true);
}
function na_current(array $a,string $today): bool {
    return !empty($a['start_date'])&&$a['start_date']<=$today&&(empty($a['end_date'])||$a['end_date']>=$today);
}
function na_bundle(array $worlds,array $managers,array $assignments,array $sources,string $today,array $labels=[]): array {
    $out=['worlds'=>$worlds,'managers'=>[],'matches'=>[],'trophies'=>[],'warnings'=>[],'coverage'=>['duplicates'=>0,'conflicts'=>0,'invalid'=>0,'unidentified_sides'=>0,'unattributed_titles'=>0,'conflicting_titles'=>0]];
    $identities=ch_identity($managers);$aliases=[];
    foreach($worlds as $w)foreach(na_aliases($w) as $alias)$aliases[$alias]=$w['id'];
    $jobs=[];
    foreach($assignments as $a){$world=$aliases[$a['game_world_id']]??null;if(!$world)continue;$a['world']=$world;$a['active']=na_current($a,$today);$jobs[$a['manager_id']][]=$a;}
    foreach($managers as $m){$id=$m['manager_id'];$out['managers'][$id]=$m+['stats'=>ch_zero(),'club'=>ch_zero(),'national_team'=>ch_zero(),'trophies'=>0,'ranking'=>['match_points'=>0,'trophy_points'=>0,'total'=>0,'unscored_trophies'=>0],'worlds'=>[],'assignments'=>$jobs[$id]??[]];}
    foreach($worlds as $wi=>$world){
        $wid=$world['id'];$src=$sources[$wid]??[];$out['warnings']=array_merge($out['warnings'],$src['warnings']??[]);
        $groups=[];$wm=[];$wt=[];
        foreach($src['results']??[] as $r){
            if(!in_array($r['game_world_id']??'',na_aliases($world),true))continue;
            $r['competition_key']=na_key((string)($r['competition_key']??''));$key=na_fixture_key($r);
            if($key===null){$out['coverage']['invalid']++;continue;}$groups[$key][]=$r;
        }
        foreach($groups as $key=>$rows){
            $r=$rows[0];$signatures=[];foreach($rows as $row)$signatures[ch_signature($row)]=true;
            $out['coverage']['duplicates']+=count($rows)-1;
            if(count($signatures)>1){$out['coverage']['conflicts']++;continue;}
            if(!na_finished($r,$today)){$out['coverage']['invalid']++;continue;}
            $m=['key'=>$wid.'|'.$key,'world'=>$wid,'game_world_id'=>$world['legacy'],'fixture_id'=>str_starts_with($key,'sm:')?(string)$r['sm_fixture_id']:null,'date'=>$r['match_date'],'season'=>$r['imc_season'],'competition_key'=>$r['competition_key'],'competition'=>$labels[$wid.'|'.$r['competition_key']]??trophy_nexus_view(['competition_key'=>$r['competition_key'],'trophy_type'=>$r['sm_action']??'','sm_division'=>$r['sm_division']??''],[]),'scope'=>ch_nation($r)?'national_team':'club','stage'=>trim(($r['competition_stage']??'').' '.($r['competition_round']??''))];
            foreach(['home','away'] as $side){$ids=ch_resolve($r,$side,$identities)['ids'];$m[$side.'_manager']=count($ids)===1?$ids[0]:null;$m[$side.'_name']=$r[$side.'_name']??'';$m[$side.'_team_id']=$r[$side.'_sm_club_id']??null;$m[$side.'_score']=(int)$r[$side.'_score'];$m['penalty_'.$side]=is_numeric($r['penalty_'.$side.'_score']??null)?(int)$r['penalty_'.$side.'_score']:null;if(!$m[$side.'_manager'])$out['coverage']['unidentified_sides']++;}
            if($m['home_manager']!==null&&$m['home_manager']===$m['away_manager']){$out['coverage']['conflicts']++;continue;}
            $wm[]=$m;
            foreach(['home','away'] as $side){
                $id=$m[$side.'_manager'];if(!$id)continue;$other=$side==='home'?'away':'home';$manager=&$out['managers'][$id];
                if(!isset($manager['worlds'][$wid]))$manager['worlds'][$wid]=['stats'=>ch_zero(),'club'=>ch_zero(),'national_team'=>ch_zero(),'trophies'=>0];
                foreach(['stats',$m['scope']] as $scope){ch_add($manager[$scope],$m[$side.'_score'],$m[$other.'_score'],$m['penalty_'.$side],$m['penalty_'.$other]);ch_add($manager['worlds'][$wid][$scope],$m[$side.'_score'],$m[$other.'_score'],$m['penalty_'.$side],$m['penalty_'.$other]);}unset($manager);
            }
        }
        $trophyGroups=[];
        foreach($src['trophies']??[] as $t){
            $tk=$wid.'|'.($t['imc_season']??'').'|'.na_key($t['competition_key']??'');
            $trophyGroups[$tk][]=$t;
        }
        foreach($trophyGroups as $key=>$items){
            $signatures=[];foreach($items as $item){$values=[];foreach(['winner_sm_world_club_id','won_date','trophy_type','sm_division'] as $field)$values[]=(string)($item[$field]??'');$signatures[json_encode($values)]=true;}
            if(count($signatures)>1){$out['coverage']['conflicting_titles']++;continue;}
            $t=$items[0];
            if(!in_array($t['game_world_id']??'',na_aliases($world),true))continue;
            $t['game_world_id']=$world['legacy'];$t['competition_key']=$world['legacy'].na_key($t['competition_key']);
            if(($t['won_date']??'')>$today)continue;
            $key=$wid.'|'.$t['imc_season'].'|'.na_key($t['competition_key']);
            $worldAssignments=array_filter($assignments,fn($a)=>in_array($a['game_world_id'],na_aliases($world),true));
            foreach($worldAssignments as &$a)$a['game_world_id']=$world['legacy'];unset($a);
            $id=trophy_manager_at_win($t,$worldAssignments);
            if(!isset($out['managers'][$id??''])){$id=null;$out['coverage']['unattributed_titles']++;}
            $bonus=imc_rank_bonus($t);
            $title=['key'=>$key,'world'=>$wid,'game_world_id'=>$world['legacy'],'manager_id'=>$id,'season'=>$t['imc_season'],'date'=>$t['won_date'],'competition_key'=>na_key($t['competition_key']),'competition'=>$labels[$wid.'|'.na_key($t['competition_key'])]??(($t['nexus_view']??'')?:trophy_nexus_view($t,[])),'team'=>$t['winner_name'],'team_id'=>$t['winner_sm_world_club_id']??null,'scope'=>ch_nation(['competition_group'=>$t['competition_group']??'','sm_action'=>$t['trophy_type']??''])?'national_team':'club','points'=>$bonus===null?null:$bonus*imc_rank_weight($world['legacy'])];$wt[]=$title;
            if($id){$manager=&$out['managers'][$id];if(!isset($manager['worlds'][$wid]))$manager['worlds'][$wid]=['stats'=>ch_zero(),'club'=>ch_zero(),'national_team'=>ch_zero(),'trophies'=>0];$manager['worlds'][$wid]['trophies']++;$manager['trophies']++;unset($manager);}
        }
        foreach($out['managers'] as $id=>&$manager){
            if(!isset($manager['worlds'][$wid]))continue;
            $mw=&$manager['worlds'][$wid];$rank=imc_rank_start($mw['club'],$world['legacy'],$mw['national_team']);
            foreach($wt as $t)if($t['manager_id']===$id){if($t['points']===null)$rank['unscored_trophies']++;else $rank['trophy_points']+=$t['points'];}
            $rank['total']=$rank['match_points']+$rank['trophy_points'];unset($rank['awards']);$mw['ranking']=$rank;
            foreach(['match_points','trophy_points','total','unscored_trophies'] as $k)$manager['ranking'][$k]+=$rank[$k];unset($mw);
        }unset($manager);
        $out['worlds'][$wi]['matches']=count($wm);$out['worlds'][$wi]['trophies']=count($wt);$out['worlds'][$wi]['available']=empty($src['warnings']);
        array_push($out['matches'],...$wm);array_push($out['trophies'],...$wt);
    }
    usort($out['matches'],fn($a,$b)=>[$b['date'],$b['key']]<=>[$a['date'],$a['key']]);
    usort($out['trophies'],fn($a,$b)=>[$b['date'],$b['key']]<=>[$a['date'],$a['key']]);
    $ranking=array_values($out['managers']);usort($ranking,fn($a,$b)=>($b['ranking']['total']<=>$a['ranking']['total'])?:strcasecmp($a['full_name'],$b['full_name']));
    $position=0;$last=null;foreach($ranking as $i=>$m){if($last===null||(float)$last!==(float)$m['ranking']['total'])$position=$i+1;$last=$m['ranking']['total'];$out['managers'][$m['manager_id']]['position']=$position;}
    $out['ranking_ids']=array_column($ranking,'manager_id');return $out;
}
function na_filter(array $rows,array $q): array {
    return array_values(array_filter($rows,static function($r)use($q){
        foreach(['world','season','competition_key','scope'] as $key)if(($q[$key]??'')!==''&&(string)($r[$key]??'')!==(string)$q[$key])return false;
        if(($q['manager']??'')!==''){
            $id=$q['manager'];if(($r['manager_id']??null)!==$id&&($r['home_manager']??null)!==$id&&($r['away_manager']??null)!==$id)return false;
            if(($q['outcome']??'')!==''&&isset($r['home_score'])){$side=$r['home_manager']===$id?'home':'away';$other=$side==='home'?'away':'home';$outcome=$r[$side.'_score']>$r[$other.'_score']?'won':($r[$side.'_score']<$r[$other.'_score']?'lost':'drawn');if($outcome!==$q['outcome'])return false;}
        }
        if(($q['opponent']??'')!==''&&($r['home_manager']??null)!==$q['opponent']&&($r['away_manager']??null)!==$q['opponent'])return false;
        if(($q['team']??'')!==''&&(string)($r['home_team_id']??$r['team_id']??'')!==$q['team']&&(string)($r['away_team_id']??'')!==$q['team'])return false;
        if(($q['search']??'')!==''){$hay=implode(' ',array_map(fn($k)=>(string)($r[$k]??''),['competition','team','home_name','away_name','date']));if(stripos($hay,$q['search'])===false)return false;}
        return true;
    }));
}
