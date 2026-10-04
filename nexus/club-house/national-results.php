<?php
declare(strict_types=1);
// Club House only: national Results attributed by world, national team and tenure dates.
// Result/report manager IDs and names never determine national attribution here.
function ch_assignment_day($value): ?string {
 $s=substr(trim((string)$value),0,10);
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$s))return null;
 return checkdate((int)substr($s,5,2),(int)substr($s,8,2),(int)substr($s,0,4))?$s:null;
}
function ch_nation_aliases(array $mapping): array {
 $groups=[];
 foreach($mapping as $m){$world=(int)($m['world_id']??0);if($world<1)continue;foreach(['world_id','sm_id'] as $f){$key=(int)($m[$f]??0);if($key>0)$groups[$key][$world]=true;}}
 $out=[];foreach($groups as $id=>$matches)$out[$id]=count($matches)===1?(int)array_key_first($matches):null;
 return $out;
}
function ch_nation_team($id,array $aliases): ?int {
 $id=(int)$id;if($id<1)return null;
 return array_key_exists($id,$aliases)?$aliases[$id]:$id;
}
function ch_national_assignment_index(array $assignments,array $aliases,string $gw): array {
 $index=[];
 foreach($assignments as $a){
  if(($a['game_world_id']??'')!==$gw||($a['assignment_type']??'')!=='national_team')continue;
  $team=ch_nation_team($a['national_team_id']??null,$aliases);$start=ch_assignment_day($a['start_date']??null);
  $rawEnd=trim((string)($a['end_date']??''));$end=$rawEnd===''?null:ch_assignment_day($rawEnd);
  if(!$team||!$start||($rawEnd!==''&&!$end)||($end&&$end<$start))continue;
  $id=trim((string)($a['manager_id']??''));if($id==='')continue;
  $index[$team][]=['manager_id'=>$id,'start'=>$start,'end'=>$end];
 }
 return $index;
}
function ch_national_manager(array $index,?int $team,string $day): array {
 $ids=[];foreach($index[$team]??[] as $a)if($a['start']<=$day&&($a['end']===null||$a['end']>=$day))$ids[$a['manager_id']]=true;
 return array_keys($ids);
}
function ch_national_rows(array $rows,string $gw,array $managers,?string $selected,array $assignments,array $mapping): array {
 $out=ch_init($managers);foreach($out['managers'] as &$m)$m['stats']['matched_by_assignment']=0;unset($m);
 $out['accepted_results']=[];$out['national_coverage']=['source'=>'Results','identity_source'=>'assignment_dates','results'=>0,'fixtures'=>0,'duplicates'=>0,'excluded_fixtures'=>0,'unassigned_sides'=>0,'ambiguous_sides'=>0];
 $aliases=ch_nation_aliases($mapping);$index=ch_national_assignment_index($assignments,$aliases,$gw);$names=array_column($managers,'full_name','manager_id');$groups=[];
 foreach($rows as $r){if(($r['game_world_id']??'')!==$gw||!ch_nation($r))continue;$groups[(string)($r['sm_fixture_id']??'')][]=$r;}
 foreach($groups as $items){
  $r=$items[0];$cov=&$out['national_coverage'];$cov['results']+=count($items);$cov['fixtures']++;$cov['duplicates']+=count($items)-1;
  $signatures=[];foreach($items as $item){$values=[];foreach(['match_date','home_sm_club_id','away_sm_club_id','home_score','away_score','penalty_home_score','penalty_away_score'] as $key)$values[]=(string)($item[$key]??'');$signatures[json_encode($values)]=true;}
  $day=ch_assignment_day($r['match_date']??null);$reason=null;
  if(count($signatures)>1)$reason='Results duplicati discordanti';
  elseif((int)($r['sm_fixture_id']??0)<1)$reason='Fixture ID mancante';
  elseif(!$day)$reason='Data partita mancante o non valida';
  elseif(!is_numeric($r['home_score']??null)||!is_numeric($r['away_score']??null)||(int)$r['home_score']<0||(int)$r['away_score']<0)$reason='Punteggio non disponibile';
  $teams=[];$resolved=[];foreach(['home','away'] as $side){$teams[$side]=ch_nation_team($r[$side.'_sm_club_id']??null,$aliases);$resolved[$side]=$day?ch_national_manager($index,$teams[$side],$day):[];}
  if(count($resolved['home'])===1&&$resolved['home']===$resolved['away'])$reason='Stesso manager su entrambe le nazionali';
  if($reason){$cov['excluded_fixtures']++;foreach(array_unique(array_merge(...array_values($resolved))) as $id)if(isset($out['managers'][$id])){$out['managers'][$id]['excluded']++;if($id===$selected)$out['issues'][]=['world'=>$gw,'fixture_id'=>$r['sm_fixture_id']??null,'date'=>$day,'reason'=>$reason];}continue;}
  foreach(['home','away'] as $side){
   $ids=$resolved[$side];if(count($ids)!==1){$cov[count($ids)?'ambiguous_sides':'unassigned_sides']++;foreach($ids as $id)if(isset($out['managers'][$id])){$out['managers'][$id]['excluded']++;if($id===$selected)$out['issues'][]=['world'=>$gw,'fixture_id'=>$r['sm_fixture_id'],'date'=>$day,'reason'=>'Incarichi nazionali sovrapposti alla data della partita'];}}
   $r['_'.$side.'_manager']=count($ids)===1&&isset($out['managers'][$ids[0]])?$ids[0]:null;
   $r[$side.'_sm_club_id']=$teams[$side];
  }
  $out['accepted_results'][]=$r;
  foreach(['home','away'] as $side){
   $id=$r['_'.$side.'_manager'];if($id===null)continue;$other=$side==='home'?'away':'home';$opponent=$r['_'.$other.'_manager'];
   $gf=(int)$r[$side.'_score'];$ga=(int)$r[$other.'_score'];$pf=is_numeric($r['penalty_'.$side.'_score']??null)?(int)$r['penalty_'.$side.'_score']:null;$pa=is_numeric($r['penalty_'.$other.'_score']??null)?(int)$r['penalty_'.$other.'_score']:null;
   ch_add($out['managers'][$id]['stats'],$gf,$ga,$pf,$pa);$out['managers'][$id]['stats']['matched_by_assignment']++;
   if($id===$selected)$out['matches'][]=['world'=>$gw,'fixture_id'=>(string)$r['sm_fixture_id'],'date'=>$day,'season'=>$r['imc_season']??null,'competition'=>$r['competition_key']??null,'scope'=>'national_team','source'=>'Results','team_id'=>$teams[$side],'team'=>$r[$side.'_name']??'','opponent_team'=>$r[$other.'_name']??'','gf'=>$gf,'ga'=>$ga,'outcome'=>$gf>$ga?'V':($gf<$ga?'S':'P'),'penalty_for'=>$pf,'penalty_against'=>$pa,'opponent_id'=>$opponent,'opponent_name'=>$opponent!==null?($names[$opponent]??$opponent):null,'identity_source'=>'assignment_dates','opponent_identity_source'=>$opponent!==null?'assignment_dates':null];
  }
 }
 return $out;
}
function ch_national_read(PDO $db,string $gw,array $managers,?string $selected,array $assignments,array $mapping): array {
 $stmt=$db->prepare('SELECT * FROM `'.nexus_table($gw,'Results').'` WHERE game_world_id=? AND (UPPER(competition_group)=\'NATIONS\' OR UPPER(competition_key) LIKE \'%|NATIONS|%\' OR LOWER(sm_action) IN (\'worldcup\',\'interqualifier\')) ORDER BY sm_fixture_id');
 $stmt->execute([$gw]);$rows=$stmt->fetchAll(PDO::FETCH_ASSOC);$stmt->closeCursor();
 return ch_national_rows($rows,$gw,$managers,$selected,$assignments,$mapping);
}
function ch_scope_merge(array $club,array $nation): array {
 $out=$club;foreach($out['managers'] as $id=>&$m){foreach($nation['managers'][$id]['stats'] as $key=>$v)$m['stats'][$key]=($m['stats'][$key]??0)+$v;$m['excluded']+=$nation['managers'][$id]['excluded'];}unset($m);
 $out['matches']=array_merge($club['matches'],$nation['matches']);$out['issues']=array_merge($club['issues'],$nation['issues']);$out['national_coverage']=$nation['national_coverage'];return $out;
}
