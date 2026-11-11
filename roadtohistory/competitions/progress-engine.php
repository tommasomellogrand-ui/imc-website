<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/site-data/core/bootstrap.php';
require_once dirname(__DIR__,2).'/site-data/competitions/result-identity.php';
require_once dirname(__DIR__,2).'/site-data/competitions/standings-engine.php';
function cupPhase(array $r): array {
 $stage=trim((string)$r['competition_stage']);$round=trim((string)$r['competition_round']);
 $text=trim($stage.' '.$round);$leg='';
 if(preg_match('/\b(andata|ritorno|first leg|second leg)\b/i',$text,$m))$leg=in_array(strtolower($m[1]),['andata','first leg'])?'Andata':'Ritorno';
 if(preg_match('/gironi|group stage|fase a gruppi/i',$text)||(!empty($r['competition_group_name'])&&!$text))return ['Gironi',$leg];
 foreach(['Ottavi'=>'/ottav|round of 16/i','Quarti'=>'/quart/i','Semifinale'=>'/semi/i','Finale'=>'/\bfinale*\b/i'] as $label=>$pattern)if(preg_match($pattern,$text))return [$label,$leg];
 $label=preg_replace('/\b(andata|ritorno|first leg|second leg)\b/i','',$round)?:$stage;
 $label=trim($label," -·");return [ctype_digit($label)?'Turno '.$label:$label,$leg];
}
function phaseSequence(array $fixtures):array {
 $order=[];$dates=[];$legs=[];
 foreach($fixtures as $r){[$phase,$leg]=cupPhase($r);if($phase==='')continue;
  if(!isset($dates[$phase]))$order[]=$phase;
  $dates[$phase][substr((string)$r['match_date'],0,10)]=true;
  if($leg)$legs[$phase][$leg]=true;
 }
 return array_map(fn($phase)=>['phase'=>$phase,'days'=>count($dates[$phase]),'legs'=>array_keys($legs[$phase]??[])],$order);
}

try {
 $prefix=['GW001'=>'IMC001','GW005'=>'IMC002','GW009'=>'IMC003','GW010'=>'IMC004','GW011'=>'IMC005','GW004'=>'IMC006','GW006'=>'IMC007','IMC-008'=>'IMC008'][$gw];
 $db=imc_site_db(imc_site_config(),'custom');
 $seasons=array_column(imc_site_rows($db,"SELECT imc_season FROM `{$prefix}_Results` UNION SELECT imc_season FROM `{$prefix}_Schedule` ORDER BY imc_season"),'imc_season');
 $season=imc_site_season($_GET['season']??null)?:(int)max($seasons?:[1]);
 $uiKey=static fn($key)=>preg_replace('/^[^|]+(?=\|)/',$gw,(string)$key);
 $rows=[];$awards=[];
 $imcResults=[];
 $groups=[];$history=[];
 foreach(['Schedule'=>'team','Results'=>'club'] as $repository=>$idType){
  $table=$prefix.'_'.$repository;
  $score=$repository==='Results'?' AND home_score IS NOT NULL AND away_score IS NOT NULL':'';
  $groupColumn=$repository==='Results'?'competition_group_name':'NULL AS competition_group_name';
  $scores=$repository==='Results'?'home_score,away_score,aggregate_home_score,aggregate_away_score,penalty_home_score,penalty_away_score':'NULL home_score,NULL away_score';
  $sql="SELECT {$scores}, imc_season,competition_key,sm_action,sm_division,sm_country,competition_group,sm_fixture_id,competition_round,competition_stage,{$groupColumn},match_date,home_sm_{$idType}_id h,away_sm_{$idType}_id a,home_name,away_name FROM `$table` WHERE imc_season IN (?,?) $score ORDER BY match_date,sm_fixture_id";
  foreach(imc_site_rows($db,$sql,[$season,max(0,$season-1)]) as $r){
   $r['competition_key']=$uiKey($r['competition_key']);
   $r['played']=$repository==='Results';
   $id=$r['sm_fixture_id']?:($r['match_date'].'|'.$r['home_name'].'|'.$r['away_name']);
   if($gw==='GW001' && $r['competition_group']==='IMC'){
    if($r['played'] && (int)$r['imc_season']===$season){
     $imcResults[$r['competition_key']][]=$r+['home_sm_club_id'=>$r['h'],'away_sm_club_id'=>$r['a']];
    }
    $id=serialize([$r['match_date'],mb_strtolower(trim($r['home_name']),'UTF-8'),mb_strtolower(trim($r['away_name']),'UTF-8')]);
   }
   if((int)$r['imc_season']===$season)$groups[$r['competition_key']][$id]=$r;
   else $history[$r['competition_key']][$id]=$r;
  }
 }
 $clubLogos=[];
 foreach(imc_site_rows($db,"SELECT sm_world_club_id,sm_club_id FROM IMC_Game_World_Club_Mapping WHERE game_world_id IN (?,?)",[$gw,$prefix]) as $club){
  if((int)$club['sm_club_id']>0)$clubLogos[$club['sm_world_club_id']]='https://cdn.soccerwiki.org/images/logos/clubs/'.(int)$club['sm_club_id'].'.png';
 }
 $nameLogos=[];
 foreach(imc_site_rows($db,"SELECT LOWER(TRIM(club_name)) name,MIN(sm_club_id) club_id FROM IMC_Game_World_Club_Mapping WHERE sm_club_id>0 GROUP BY LOWER(TRIM(club_name)) HAVING COUNT(DISTINCT sm_club_id)=1") as $club)$nameLogos[$club['name']]='https://cdn.soccerwiki.org/images/logos/clubs/'.$club['club_id'].'.png';
 $crestAssets=json_decode(file_get_contents(__DIR__.'/crest-assets.json'),true);
 $out=[];$finalAwards=[];
 foreach($groups as $key=>$fixtures){
  usort($fixtures,fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']));
  $playedRounds=[];$scheduledRounds=[];
  $teams=[];$pairs=[];$days=[];$played=0;$latest=null;$next=null;
  foreach($fixtures as $r){
   $h=$r['h']?:$r['home_name'];$a=$r['a']?:$r['away_name'];$teams[$h]=true;$teams[$a]=true;$pairs[$h.'|'.$a]=true;
   $day=substr((string)$r['match_date'],0,10);$days[$day]=($days[$day]??0)+1;
   $roundKey=trim((string)$r['competition_round'])?:$day;
   if($r['played'])$playedRounds[$roundKey]=true;else $scheduledRounds[$roundKey]=true;
   if($r['played']){$played++;$latest=$r;}elseif($next===null){$next=$r;}
  }
  $total=count($fixtures);$n=count($teams);$pct=null;$label='';$detail='';
  if($fixtures[0]['sm_action']==='league'){
   $complete=$n>=2 && count($pairs)===$n*($n-1) && $total===count($pairs);
   if($complete)$pct=(int)round(100*$played/$total);
   $r=$latest??$next;$round=$r['competition_round']??null;
   if(is_numeric($round))$label='Giornata '.(int)$round.($complete?' di '.(2*($n-1)):'');
   elseif($complete && count($days)===2*($n-1) && max($days)===min($days)){
    $i=array_search(substr((string)$r['match_date'],0,10),array_keys($days),true);$label='Giornata '.($i+1).' di '.count($days);
   }
  }else{
   $r=$next??$latest;$stage=trim((string)($r['competition_stage']??''));$round=trim((string)($r['competition_round']??''));
   $label=$round!==''?(is_numeric($round)?'Turno '.$round:$round):$stage;
   if($stage!==$label && $round!=='')$detail=$stage;
   $label=preg_replace('/finalee\b/iu','finale',$label);
   if(preg_match('/^(.+?)\s*[-·:]?\s+(andata|ritorno)$/iu',$label,$leg)){
    $label=trim($leg[1]);$detail=ucfirst(strtolower($leg[2]));
   }
   if($total===1 && in_array($r['sm_action'],['charityshield','supercup'],true))$pct=$played?100:0;
  }
  if($label==='')$label=$played?'In corso':'In programma';
  $isLeague=$fixtures[0]['sm_action']==='league';
  $finished=$isLeague?$pct===100:false;$path=[];$position=null;
  if(!$isLeague){
   $prior=array_values($history[$key]??[]);usort($prior,fn($a,$b)=>strcmp((string)$a['match_date'],(string)$b['match_date']));
   $single=in_array($fixtures[0]['sm_action'],['charityshield','supercup'],true);
   $priorFinal=false;
   foreach($prior as $past){[$ph,$leg]=cupPhase($past);if($past['played']&&$ph==='Finale'&&$leg!=='Andata')$priorFinal=true;}
   $path=$priorFinal?phaseSequence($prior):[];
   if($priorFinal && $gw==='GW001' && in_array($fixtures[0]['sm_action'],['smfacup','smfashield'],true)){
    $seen=array_column($path,null,'phase');$path=[];
    foreach(['Gironi','Ottavi','Quarti','Semifinale','Finale'] as $ph)$path[]=['phase'=>$ph,'days'=>$ph==='Gironi'?3:($seen[$ph]['days']??0),'legs'=>$seen[$ph]['legs']??[]];
   }
   $r=$next??$latest;[$phase,$leg]=cupPhase($r);
   if($phase==='Gironi' && $path && $path[0]['phase']==='Gironi'){
    $detail=$path[0]['days'].' giornate';
   }elseif($phase!=='')$detail=$leg;
   if($phase!=='')$label=$phase;
   $phases=array_column($path,'phase');$idx=array_search($phase,$phases,true);if($idx!==false)$position='Turno '.($idx+1).' di '.count($path);
   if(!$next && $latest){[$last,$lastLeg]=cupPhase($latest);$finished=($last==='Finale'&&$lastLeg!=='Andata')||$single;}
  }
  $table=[];$final=null;
  foreach($fixtures as $match){
   if(!$isLeague){
    if(cupPhase($match)[0]==='Finale'||$single)$final=$match;
    continue;
   }
   if(!$match['played'])continue;
   foreach([['home','away'],['away','home']] as [$side,$opponent]){
    $name=$match[$side.'_name'];$gf=(int)$match[$side.'_score'];$ga=(int)$match[$opponent.'_score'];
    $entry=$table[$name]??[0,0,0];
    $table[$name]=[$entry[0]+($gf>$ga?3:($gf===$ga?1:0)),$entry[1]+$gf-$ga,$entry[2]+$gf];
   }
  }
  arsort($table);$leader=array_key_first($table);
  $pair=static fn($match)=>$match?[$match['home_name'],$match['away_name']]:null;
  $row=$fixtures[0];$action=$row['sm_action'];$division=$row['sm_division'];
  $names=['league'=>'Div '.$division,'playoff'=>'Playoff','smfacup'=>'SMFA Champions','smfashield'=>'SMFA Shield','supercup'=>'SMFA Super Cup','interqualifier'=>'World Cup Qualifiers','worldcup'=>'World Cup','charityshield'=>'Charity Shield','leaguecup'=>'National Cup','nationalcup'=>'National Cup','leagueshield'=>'League Cup'];
  $rows[]=['competition_key'=>$key,'sm_action'=>$action,'sm_division'=>$division,'competition_group'=>$row['competition_group'],'sm_country'=>$row['sm_country'],'nexus_view'=>$names[$action]??$action,'result_count'=>$played,'schedule_count'=>$total-$played];
  $ranking=[];
  foreach(array_slice($table,0,2,true) as $name=>$stats)$ranking[]=['name'=>$name,'points'=>$stats[0]];
  $upcoming=[];
  if($next)foreach($fixtures as $match){
   if(!$match['played'] && substr((string)$match['match_date'],0,10)===substr((string)$next['match_date'],0,10))$upcoming[]=$pair($match);
  }
  $logos=[];
  foreach($fixtures as $match){
   foreach(['h'=>'home_name','a'=>'away_name'] as $id=>$name){$kind=$row['competition_group']==='NATIONS'?'nations':'clubs';$logo=$crestAssets[$gw.'|'.$kind.'|'.$match[$id]]??($kind==='clubs'?($clubLogos[$match[$id]]??$nameLogos[strtolower(trim((string)$match[$name]))]??null):null);if($logo)$logos[$match[$name]]=$logo;}
  }
  if(!$isLeague && $finished && $final && $final['played']){
   foreach([['penalty_home_score','penalty_away_score'],['aggregate_home_score','aggregate_away_score'],['home_score','away_score']] as [$h,$a]){
    if($final[$h]===null || $final[$a]===null || (int)$final[$h]===(int)$final[$a])continue;
    if($h==='home_score' && cupPhase($final)[1]==='Ritorno')break;
    $home=(int)$final[$h]>(int)$final[$a];
    $finalAwards[$key]=['winner_name'=>$final[$home?'home_name':'away_name'],'team'=>$final[$home?'h':'a'],'day'=>$final['match_date'],'kind'=>$row['competition_group']==='NATIONS'?'national_team':'club'];
    break;
   }
  }
  $out[$key]=['final_played'=>!$isLeague && $final && $final['played'] && cupPhase($final)[1]!=='Andata' && $finished,'logos'=>$logos,'ranking'=>$ranking,'upcoming'=>$upcoming,'leader'=>$leader,'points'=>$leader!==null?$table[$leader][0]:null,'finalists'=>$pair($final),'next_match'=>$pair($next),'next_date'=>$next?substr($next['match_date'],0,10):null,'label'=>$label,'detail'=>$detail,'percent'=>$pct,'played'=>$played,'expected'=>$isLeague&&$complete?$total:null,'complete'=>$finished,'format'=>$path,'position'=>$position];
  if($isLeague){
   $out[$key]['played_days']=count(array_diff_key($playedRounds,$scheduledRounds));
   $out[$key]['total_days']=$complete?2*($n-1):null;
   foreach(['last_turn'=>$latest,'next_turn'=>$next] as $slot=>$fixture){
    if(!$fixture)continue;
    $day=substr((string)$fixture['match_date'],0,10);
    $number=$fixture['competition_round'];
    if(!is_numeric($number) && $complete && count($days)===2*($n-1) && max($days)===min($days)){
     $number=array_search($day,array_keys($days),true)+1;
    }
    $out[$key][$slot]=['date'=>$day,'number'=>is_numeric($number)?(int)$number:null];
   }
  }

 }
 $awards=imc_site_rows($db,"SELECT t.winner_sm_world_club_id team,t.won_date day,t.competition_group,t.competition_key,t.winner_name,t.nexus_view,cm.sm_club_id logo_id,CASE WHEN BINARY t.winner_name=BINARY m.home_name THEN m.home_manager_name WHEN BINARY t.winner_name=BINARY m.away_name THEN m.away_manager_name END winner_manager_name FROM {$prefix}_Trophy_Room t LEFT JOIN {$prefix}_Match_Reports m ON m.sm_fixture_id=BINARY t.deciding_fixture_id AND m.imc_season=t.imc_season AND BINARY m.competition_key=BINARY t.competition_key LEFT JOIN IMC_Game_World_Club_Mapping cm ON cm.game_world_id=? AND cm.sm_world_club_id=BINARY t.winner_sm_world_club_id AND t.competition_group<>'NATIONS' WHERE t.imc_season=?",[$gw,$season]);
 $byKey=[];foreach($awards as $award){if((int)$award['logo_id']>0)$award['winner_logo_url']='https://cdn.soccerwiki.org/images/logos/clubs/'.(int)$award['logo_id'].'.png';$byKey[$uiKey($award['competition_key'])]=$award;}
 $byKey+=$finalAwards;
 $core=imc_site_db(imc_site_config(),'core');
 $managers=imc_site_rows($core,'SELECT a.assignment_type,a.team_id,a.national_team_id,a.start_date,a.end_date,m.manager_id,m.full_name,m.face_image_url FROM `IMC Manager Assignment Global` a JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=?',[$gw]);
 foreach($byKey as &$award){
  $kind=$award['kind']??(($award['competition_group']??'')==='NATIONS'?'national_team':'club');
  $matches=[];
  foreach($managers as $m){
   if(empty($award['team']) || empty($award['day']) || $m['assignment_type']!==$kind || (string)$m[$kind==='club'?'team_id':'national_team_id']!==(string)$award['team'])continue;
   if(!$m['start_date'] || $m['start_date']>$award['day'] || ($m['end_date'] && $m['end_date']<$award['day']))continue;
   $matches[$m['manager_id']]=$m;
  }
  if(count($matches)===1){$m=reset($matches);$award['winner_manager_name']=$m['full_name'];$award['winner_manager_photo_url']=$m['face_image_url'];}
 }
 unset($award);
 foreach($rows as &$row)if(!empty($byKey[$row['competition_key']]['nexus_view']))$row['nexus_view']=$byKey[$row['competition_key']]['nexus_view'];unset($row);
 if(in_array($gw,['GW001','GW010'],true)){
  $definitions=imc_site_rows($core,"SELECT competition_key,custom_competition,expected_match,expected_matchdays FROM `IMC Competition Codex Global` WHERE game_world_id=? AND sm_action_group='IMC'",[$gw]);
  $indexes=array_flip(array_column($rows,'competition_key'));
  foreach($definitions as $definition){
   $key=$uiKey($definition['competition_key']);
   $name=$definition['custom_competition'];
   if($definition['expected_matchdays']>0 && $definition['expected_match']>0){
    $results=imc_site_result_identity($gw,$imcResults[$key]??[]);
    $table=imc_site_standings_tables($results)['rows'];
    $played=(int)(array_sum(array_column($table,'played'))/2);
    $expected=(int)$definition['expected_match'];
    $out[$key]['league_summary']=true;
    $out[$key]['expected']=$expected;
    $out[$key]['played']=$played;
    $expectedDays=(int)$definition['expected_matchdays'];
    $perDay=(int)($expected/$expectedDays);
    $byDay=array_count_values(array_column($results,'match_date'));
    $playedDays=count(array_filter($byDay,static fn($count)=>$count>=$perDay));
    $out[$key]['played_days']=$playedDays;
    $out[$key]['total_days']=$expectedDays;
    $out[$key]['percent']=(int)round(100*$playedDays/$expectedDays);
    $out[$key]['complete']=$played===$expected;
    $out[$key]['ranking']=array_map(static fn($t)=>['name'=>$t['team_name'],'points'=>$t['points']],array_slice($table,0,2));
   }
   if(isset($indexes[$key])){
    $rows[$indexes[$key]]['nexus_view']=$name;
    $rows[$indexes[$key]]['competition_group']='IMC';
   }else{
    $rows[]=['competition_key'=>$key,'sm_action'=>'imc_custom','sm_division'=>null,'competition_group'=>'IMC','sm_country'=>null,'nexus_view'=>$name,'result_count'=>0,'schedule_count'=>0];
   }
  }
 }
 $clubs=imc_site_rows($core,'SELECT id,name,nexus_view FROM `IMC Club Codex Global`');
 $mapping=imc_site_rows($core,'SELECT `Game World` game_world_id,`Club ID` entity_id,`SM World Club ID` world_id,`Club Name` name FROM `IMC Game World Club Mapping` WHERE `Game World`=?',[$gw]);
 $index=imc_site_club_label_index($clubs,$mapping);
 $label=static fn(string $name)=>imc_site_club_label($name,$index,$gw);
 foreach($rows as $competition){
  if($competition['competition_group']==='NATIONS')continue;
  $key=$competition['competition_key'];
  if(isset($byKey[$key]['winner_name']))$byKey[$key]['winner_name']=imc_site_club_label($byKey[$key]['winner_name'],$index,$gw,$byKey[$key]['team']??null);
  if(!isset($out[$key]))continue;
  $summary=&$out[$key];
  if(isset($summary['leader']))$summary['leader']=$label($summary['leader']);
  foreach($summary['ranking']??[] as $i=>$team)$summary['ranking'][$i]['name']=$label($team['name']);
  foreach(['finalists','next_match'] as $field)if(isset($summary[$field]))$summary[$field]=array_map($label,$summary[$field]);
  foreach($summary['upcoming']??[] as $i=>$match)$summary['upcoming'][$i]=array_map($label,$match);
  $displayLogos=[];
  foreach($summary['logos']??[] as $name=>$logo)$displayLogos[$label((string)$name)]=$logo;
  $summary['logos']=$displayLogos;
  unset($summary);
 }
 usort($rows,fn($a,$b)=>[(int)$a['sm_division'],$a['nexus_view']]<=>[(int)$b['sm_division'],$b['nexus_view']]);
 header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
 echo json_encode(['ok'=>true,'progress'=>$out,'rows'=>$rows,'awards'=>$byKey,'season'=>$season,'seasons'=>$seasons],JSON_INVALID_UTF8_SUBSTITUTE|JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){error_log('Competition progress: '.$e->getMessage());imc_site_out(['ok'=>false,'error'=>'progress_unavailable'],503);}
