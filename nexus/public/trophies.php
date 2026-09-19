<?php
declare(strict_types=1);
// Historical, read-only honours. No season filter is applied to this resource.
function nexus_trophy_score($v): ?int {return $v!==null&&preg_match('/^\d+$/D',(string)$v)?(int)$v:null;}
function nexus_trophy_done(array $r): bool {return (empty($r['result_status'])||strtoupper($r['result_status'])==='COMPLETED')&&nexus_trophy_score($r['home_score']??null)!==null&&nexus_trophy_score($r['away_score']??null)!==null;}
function nexus_trophy_team(array $r,string $side): string {
    $id=$r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??null;
    return $id!==null?'id:'.$id:'name:'.trim((string)($r[$side.'_name']??''));
}
function nexus_trophy_final(array $r): bool {
    foreach(['competition_stage','competition_round'] as $f)if(preg_match('/^(?:finale?)(?:\s*[-·:]?\s*(?:andata|ritorno|1st leg|2nd leg))?$/i',trim((string)($r[$f]??''))))return true;
    return false;
}
function nexus_trophy_cup(array $results,array $schedule,string $action): ?array {
    if(!in_array($action,['leaguecup','leagueshield','cup','nationalcup','charityshield','smfacup','smfashield','supercup','worldcup'],true))return null;
    $finals=array_values(array_filter($results,'nexus_trophy_final'));
    if(!$finals&&in_array($action,['charityshield','supercup'],true)&&count($results)===1&&!$schedule)$finals=$results;
    if(!$finals||count($finals)>2||array_filter($schedule,'nexus_trophy_final'))return null;
    foreach($finals as $r)if(!nexus_trophy_done($r))return null;
    usort($finals,fn($a,$b)=>strcmp($a['match_date'],$b['match_date']));$r=end($finals);
    $leg=implode(' ',[$r['competition_stage']??'',$r['competition_round']??'']);
    if(preg_match('/andata|1st leg/i',$leg))return null;
    $h=nexus_trophy_score($r['home_score']);$a=nexus_trophy_score($r['away_score']);
    $ah=nexus_trophy_score($r['aggregate_home_score']??null);$aa=nexus_trophy_score($r['aggregate_away_score']??null);
    if(count($finals)===2){$pairs=[];foreach($finals as $f){$p=[nexus_trophy_team($f,'home'),nexus_trophy_team($f,'away')];sort($p);$pairs[]=implode('|',$p);}if($pairs[0]!==$pairs[1]||!preg_match('/ritorno|2nd leg/i',$leg))return null;}
    if($ah!==null||$aa!==null){if($ah===null||$aa===null)return null;$h=$ah;$a=$aa;}
    elseif(count($finals)===2||preg_match('/ritorno|2nd leg/i',$leg))return null;
    if($h===$a){$h=nexus_trophy_score($r['penalty_home_score']??null);$a=nexus_trophy_score($r['penalty_away_score']??null);if($h===null||$a===null||$h===$a)return null;}
    return ['kind'=>'cup','side'=>$h>$a?'home':'away','match'=>$r,'awarded_at'=>$r['match_date'],'points'=>null,'runner_points'=>null];
}
function nexus_trophy_league(array $results,array $schedule,array $comp): ?array {
    // Older imports have no world team IDs. Use source names only to total the
    // table, never to infer a Codex identity or attach a logo/manager by name.
    $all=array_merge($results,$schedule);$missing=false;$idsByName=[];$namesById=[];
    foreach($all as $r)foreach(['home','away'] as $side){$id=$r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??null;$name=trim((string)($r[$side.'_name']??''));if($name==='')return null;if($id===null)$missing=true;else{$idsByName[$name][(string)$id]=true;$namesById[(string)$id][$name]=true;}}
    if($missing){foreach(array_merge(array_values($idsByName),array_values($namesById)) as $keys)if(count($keys)>1)return null;foreach($results as &$r)foreach(['home','away'] as $side)$r['_trophy_'.$side]='name:'.trim($r[$side.'_name']);unset($r);foreach($schedule as &$r)foreach(['home','away'] as $side)$r['_trophy_'.$side]='name:'.trim($r[$side.'_name']);unset($r);}
    $n=(int)($comp['teams_count']??0);$expected=(int)($comp['expected_match']??0);
    if($n<2||$expected<1){
        // A closed season can prove its complete home-and-away round robin even
        // when the legacy competition catalog lacks expected_match/teams_count.
        if(empty($comp['_season_end'])||$comp['_season_end']>=date('Y-m-d')||$schedule)return null;
        $teams=[];$directed=[];foreach($results as $r){if(!nexus_trophy_done($r))return null;$h=nexus_trophy_team($r,'home');$a=nexus_trophy_team($r,'away');if($h===$a)return null;$teams[$h]=true;$teams[$a]=true;$k=$h.'|'.$a;if(isset($directed[$k]))return null;$directed[$k]=true;}
        $derived=count($teams);if($derived<4||($n>0&&$n!==$derived)||count($results)!==$derived*($derived-1))return null;
        $n=$derived;$expected=$n*($n-1);
    }
    // Accept only a complete, balanced fixture plan from actual results + remaining schedule.
    $all=array_merge($results,$schedule);if(count($all)!==$expected)return null;
    $per=2*$expected/$n;if($per!=floor($per)||$per<1)return null;
    $teams=[];$pairs=[];
    foreach($all as $r){if(!empty($r['competition_group_name']))return null;$h=nexus_trophy_team($r,'home');$a=nexus_trophy_team($r,'away');if($h==='name:'||$a==='name:'||$h===$a)return null;
        foreach([$h,$a] as $id)if(!isset($teams[$id]))$teams[$id]=['id'=>$id,'p'=>0,'pts'=>0,'plan'=>0];
        $teams[$h]['plan']++;$teams[$a]['plan']++;$pair=[$h,$a];sort($pair);$pk=implode('|',$pair);$pairs[$pk]=($pairs[$pk]??0)+1;
    }
    if(count($teams)!==$n||count($pairs)!=$n*($n-1)/2||count(array_unique(array_values($pairs)))!==1)return null;
    foreach($teams as $t)if($t['plan']!== (int)$per)return null;
    $done=array_values(array_filter($results,'nexus_trophy_done'));usort($done,fn($a,$b)=>strcmp($a['match_date'],$b['match_date']));
    $byDate=[];foreach($done as $r)$byDate[$r['match_date']][]=$r;
    $award=null;
    foreach($byDate as $date=>$rows){foreach($rows as $r){$h=nexus_trophy_team($r,'home');$a=nexus_trophy_team($r,'away');$hs=(int)$r['home_score'];$as=(int)$r['away_score'];$teams[$h]['p']++;$teams[$a]['p']++;$teams[$h]['pts']+=$hs>$as?3:($hs===$as?1:0);$teams[$a]['pts']+=$as>$hs?3:($hs===$as?1:0);}
        $rank=array_values($teams);usort($rank,fn($a,$b)=>$b['pts']<=>$a['pts']);$leader=$rank[0];$secure=true;
        foreach(array_slice($rank,1) as $t)if($leader['pts']<=$t['pts']+3*($per-$t['p']))$secure=false;
        if($secure&&!$award){$match=null;$side=null;foreach($done as $r){if($r['match_date']>$date)break;foreach(['home','away'] as $s)if(nexus_trophy_team($r,$s)===$leader['id']){$match=$r;$side=$s;}}if($match)$award=['kind'=>'league','side'=>$side,'match'=>$match,'awarded_at'=>$date,'winner_key'=>$leader['id']];}
    }
    if(!$award)return null;
    $rank=array_values($teams);usort($rank,fn($a,$b)=>$b['pts']<=>$a['pts']);$runner=$rank[1];$runnerMatch=null;$runnerSide=null;
    foreach($done as $r)foreach(['home','away'] as $s)if(nexus_trophy_team($r,$s)===$runner['id']){$runnerMatch=$r;$runnerSide=$s;}
    $award['points']=$rank[0]['pts'];$award['runner_points']=$runner['pts'];$award['league_complete']=count($done)===$expected;$award['runner_match']=$runnerMatch;$award['runner_side']=$runnerSide;return $award;
}
function nexus_trophy_editions(array $results,array $schedule,array $catalog,array $seasons): array {
    $catalogByKey=[];foreach($catalog as $c)$catalogByKey[$c['competition_key']]=$c;
    $buckets=[];$played=[];foreach($results as $r)if(nexus_trophy_done($r))$played[(string)$r['sm_fixture_id']]=true;
    foreach(['results'=>$results,'schedule'=>$schedule] as $kind=>$rows)foreach($rows as $r){
        if($kind==='schedule'&&isset($played[(string)$r['sm_fixture_id']]))continue;
        $key=$r['competition_key']??'';$date=$r['match_date']??'';if(!$date||!isset($catalogByKey[$key]))continue;
        $matches=array_values(array_filter($seasons,fn($s)=>!empty($s['imc_season_start_date'])&&$date>=$s['imc_season_start_date']&&(empty($s['imc_season_end_date'])||$date<=$s['imc_season_end_date'])));if(count($matches)!==1)continue;
        $season=$matches[0]['imc_season'];$bucket=$key.'::'.$season;$buckets[$bucket]['competition']=$catalogByKey[$key];$buckets[$bucket]['season']=$season;$buckets[$bucket]['competition']['_season_end']=$matches[0]['imc_season_end_date']??null;$buckets[$bucket][$kind][(string)$r['sm_fixture_id']]=$r;
    }
    $awards=[];foreach($buckets as $b){$rs=array_values($b['results']??[]);$ss=array_values($b['schedule']??[]);$c=$b['competition'];$a=$c['sm_action']==='league'?nexus_trophy_league($rs,$ss,$c):nexus_trophy_cup($rs,$ss,$c['sm_action']);if(!$a)continue;unset($c['_season_end']);$a['competition']=$c;$a['season']=$b['season'];$a['id']=$c['competition_key'].'::'.$b['season'];$awards[]=$a;}
    usort($awards,fn($a,$b)=>strcmp($b['awarded_at'],$a['awarded_at'])?:strcmp($a['id'],$b['id']));return $awards;
}
// An explicit historical source overrides inference only for its own edition.
function nexus_trophy_overlay(array $inferred,array $official): array {
    $indexed=[];foreach($inferred as $a)$indexed[$a['id']]=$a;
    foreach($official as $a)$indexed[$a['id']]=$a;
    $out=array_values($indexed);
    usort($out,fn($a,$b)=>((int)$b['season']<=>(int)$a['season'])?:strcmp($b['awarded_at']??'', $a['awarded_at']??'')?:strcmp($a['id'],$b['id']));
    return $out;
}
function nexus_trophy_official(PDO $core,string $world,array $seasons): array {
    if($world!=='GW008')return [];
    $source=json_decode(file_get_contents(__DIR__.'/honours-GW008-S1.json'),true,512,JSON_THROW_ON_ERROR);
    $valid=false;foreach($seasons as $s)if((int)$s['imc_season']===(int)$source['season']&&(int)$s['soccer_manager_season']===(int)$source['soccer_manager_season'])$valid=true;
    if(!$valid||$source['world']!==$world)throw new RuntimeException('Historical honours season mismatch');
    $identities=[];$seen=[];
    foreach($source['honours'] as $r){
        $key=$r['competition_key'];if(strpos($key,$world.'|')!==0||isset($seen[$key]))throw new RuntimeException('Invalid historical honour key');$seen[$key]=true;
        // Identity enrichment only; these are not fabricated match records.
        $identities[]=['competition_key'=>$key,'sm_action'=>$r['sm_action'],'sm_country'=>$r['sm_country'],'sm_division'=>$r['sm_division'],'competition_group'=>$r['competition_group'],'home_sm_club_id'=>$r['winner_sm_club_id'],'home_sm_manager_id'=>$r['manager_sm_id']];
    }
    nexus_core_enrich($core,$world,'results',$identities);$out=[];
    foreach($source['honours'] as $i=>$r){$identity=$identities[$i];$competition=$identity['competition_core'];
        if(!$competition)throw new RuntimeException('Missing historical competition mapping');
        $out[]=['id'=>$r['competition_key'].'::'.$source['season'],'kind'=>$r['sm_action']==='league'?'league':($r['sm_action']==='playoff'?'playoff':'cup'),'season'=>$source['season'],'competition'=>$competition,'source'=>'soccer_manager_honours','source_sm_season'=>$source['soccer_manager_season'],'match'=>null,'awarded_at'=>null,'points'=>null,'runner_points'=>null,'runner_up'=>null,'winner'=>['name'=>$r['winner_name'],'core'=>$identity['home_core']??null],'manager'=>['manager_id'=>$identity['home_manager_core']['manager_id']??null,'sm_manager_id'=>$r['manager_sm_id'],'full_name'=>$r['manager_name']]];
    }
    return $out;
}
function nexus_trophies(PDO $db,PDO $core,string $world): array {
    $catalog=nexus_catalog($db,$core,$world,null);
    $seasons=nexus_core_rows($core,'SELECT imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season DESC',[$world]);
    $common='game_world_id,sm_fixture_id,competition_key,sm_action,competition_group,competition_stage,competition_round,match_date,home_name,away_name,home_sm_manager_id,away_sm_manager_id';
    $results=nexus_core_rows($db,"SELECT $common,competition_group_name,home_sm_club_id,away_sm_club_id,home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score,result_status FROM `IMC Site Results` WHERE game_world_id=? ORDER BY site_result_id",[$world]);
    $schedule=nexus_core_rows($db,"SELECT $common,home_sm_team_id,away_sm_team_id FROM `IMC Site Schedule` WHERE game_world_id=? ORDER BY site_schedule_id",[$world]);
    // Reconcile missing team IDs only through the same fixture's report.
    nexus_report_logo_ids($db,$world,$results);foreach($results as &$r)foreach(['home','away'] as $side)if(empty($r[$side.'_sm_club_id'])&&!empty($r[$side.'_logo_team_id']))$r[$side.'_sm_club_id']=$r[$side.'_logo_team_id'];unset($r);
    $awards=nexus_trophy_editions($results,$schedule,$catalog,$seasons);
    $matches=[];foreach($awards as $a){$matches[]=$a['match'];if(!empty($a['runner_match']))$matches[]=$a['runner_match'];}
    if($matches){$ids=array_values(array_unique(array_column($matches,'sm_fixture_id')));$ph=implode(',',array_fill(0,count($ids),'?'));
        $reports=nexus_core_rows($db,"SELECT sm_fixture_id,home_sm_manager_id,away_sm_manager_id,home_manager_name,away_manager_name FROM `IMC Site Match Report` WHERE game_world_id=? AND sm_fixture_id IN ($ph)",array_merge([$world],$ids));$byId=[];foreach($reports as $r)$byId[(string)$r['sm_fixture_id']][]=$r;
        foreach($matches as &$m){$rs=$byId[(string)$m['sm_fixture_id']]??[];if(count($rs)===1)foreach(['home','away'] as $s)foreach(['sm_manager_id','manager_name'] as $f)if(empty($m[$s.'_'.$f]))$m[$s.'_'.$f]=$rs[0][$s.'_'.$f];}unset($m);
        nexus_core_enrich($core,$world,'results',$matches);
    }
    $directory=nexus_world_directory($core,$world);$index=0;
    foreach($awards as &$a){$m=$matches[$index++];$s=$a['side'];$other=$s==='home'?'away':'home';$a['match']=$m;$a['winner']=['name'=>$m[$s.'_core']['name']??$m[$s.'_name'],'core'=>$m[$s.'_core']??null];
        $runner=$a['kind']==='league'&&!empty($a['runner_match'])?$matches[$index++]:$m;$rs=$a['kind']==='league'?$a['runner_side']:$other;
        $a['runner_up']=['name'=>$runner[$rs.'_core']['name']??$runner[$rs.'_name'],'core'=>$runner[$rs.'_core']??null];
        $a['manager']=null;
        // A report identifies the winner's manager only on the actual title date.
        if($m['match_date']===$a['awarded_at']&&(!empty($m[$s.'_manager_core'])||!empty($m[$s.'_manager_name'])))$a['manager']=$m[$s.'_manager_core']??['full_name'=>$m[$s.'_manager_name'],'manager_id'=>null];
        if(!$a['manager']&&($m['match_date']!==$a['awarded_at']||empty($m[$s.'_sm_manager_id']))){$team=$a['winner']['core'];$national=isset($team['national_team_id']);$tid=$team[$national?'national_team_id':'club_id']??null;$choices=[];
            if($tid!==null)foreach($directory['managers'] as $assignment){$isNational=$assignment['national_team_id']!==null;if($national!==$isNational|| (string)($assignment[$national?'national_team_id':'team_id']??'')!==(string)$tid)continue;if(!empty($assignment['start_date'])&&$assignment['start_date']<=$a['awarded_at']&&(empty($assignment['end_date'])||$assignment['end_date']>=$a['awarded_at']))$choices[$assignment['manager_id']]=['manager_id'=>$assignment['manager_id'],'full_name'=>$assignment['full_name']];}
            if(count($choices)===1)$a['manager']=array_values($choices)[0];
        }
        unset($a['runner_match'],$a['runner_side'],$a['winner_key'],$a['match']['_trophy_home'],$a['match']['_trophy_away']);
    }unset($a);
    $awards=nexus_trophy_overlay($awards,nexus_trophy_official($core,$world,$seasons));
    return ['ok'=>true,'world'=>$world,'scope'=>'all_seasons','awards'=>$awards,'seasons'=>$seasons];
}

