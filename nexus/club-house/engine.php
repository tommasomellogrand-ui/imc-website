<?php
declare(strict_types=1);
function ch_zero(): array {return ['played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'penalty_won'=>0,'penalty_lost'=>0];}
function ch_add(array &$s,int $gf,int $ga,?int $pf=null,?int $pa=null): void {
 $s['played']++;$s['gf']+=$gf;$s['ga']+=$ga;$s[$gf>$ga?'won':($gf<$ga?'lost':'drawn')]++;
 if($pf!==null&&$pa!==null){if($pf>$pa)$s['penalty_won']++;elseif($pf<$pa)$s['penalty_lost']++;}
}
function ch_nation(array $r): bool {return strtoupper((string)($r['competition_group']??''))==='NATIONS'||str_contains(strtoupper((string)($r['competition_key']??'')),'|NATIONS|')||in_array(strtolower((string)($r['sm_action']??'')),['worldcup','interqualifier'],true);}
function ch_identity(array $managers): array {$map=[];foreach($managers as $m)if((int)$m['sm_manager_id']>0)$map[(string)$m['sm_manager_id']][]=$m['manager_id'];return $map;}
function ch_signature(array $r): string {
 $fields=['match_date','imc_season','competition_key','competition_group','sm_action','home_sm_club_id','away_sm_club_id','home_sm_manager_id','away_sm_manager_id','home_score','away_score','penalty_home_score','penalty_away_score'];
 return hash('sha256',json_encode(array_map(fn($k)=>(string)($r[$k]??''),$fields)));
}
function ch_init(array $managers): array {
 $out=['managers'=>[],'matches'=>[],'trophies'=>[],'issues'=>[],'coverage'=>['reports'=>0,'fixtures'=>0,'duplicate_rows'=>0,'excluded_fixtures'=>0]];
 foreach($managers as $m)$out['managers'][$m['manager_id']]=['stats'=>ch_zero(),'trophies'=>0,'excluded'=>0];return $out;
}
function ch_group(array &$out,array $rows,array $map,array $names,string $gw,?string $selected): void {
 if(!$rows)return;$r=$rows[0];$candidates=[];$signatures=[];
 foreach($rows as $row){$signatures[ch_signature($row)]=true;foreach(['home','away'] as $side)foreach($map[(string)($row[$side.'_sm_manager_id']??'')]??[] as $id)$candidates[$id]=true;}
 $out['coverage']['reports']+=count($rows);$out['coverage']['fixtures']++;$out['coverage']['duplicate_rows']+=count($rows)-1;
 $reason=null;
 if(count($signatures)>1)$reason='Match Report duplicati con dati discordanti';
 elseif((int)($r['sm_fixture_id']??0)<1)$reason='Fixture ID mancante';
 elseif(!is_numeric($r['home_score']??null)||!is_numeric($r['away_score']??null)||(int)$r['home_score']<0||(int)$r['away_score']<0)$reason='Punteggio non disponibile';
 elseif(ch_nation($r))return;
 $home=$map[(string)($r['home_sm_manager_id']??'')]??[];$away=$map[(string)($r['away_sm_manager_id']??'')]??[];
 if(count($home)>1||count($away)>1)$reason='ID Soccer Manager associato a più manager IMC';
 if(count($home)===1&&$home===$away)$reason='Stesso manager IMC su entrambe le squadre';
 if($reason){$out['coverage']['excluded_fixtures']++;foreach(array_keys($candidates) as $id){$out['managers'][$id]['excluded']++;if($id===$selected)$out['issues'][]=['world'=>$gw,'fixture_id'=>$r['sm_fixture_id'],'date'=>$r['match_date'],'reason'=>$reason];}return;}
 foreach(['home'=>$home,'away'=>$away] as $side=>$ids){
  if(count($ids)!==1)continue;$id=$ids[0];$other=$side==='home'?'away':'home';$opponentIds=$side==='home'?$away:$home;
  $gf=(int)$r[$side.'_score'];$ga=(int)$r[$other.'_score'];
  $pf=is_numeric($r['penalty_'.$side.'_score']??null)?(int)$r['penalty_'.$side.'_score']:null;$pa=is_numeric($r['penalty_'.$other.'_score']??null)?(int)$r['penalty_'.$other.'_score']:null;
  ch_add($out['managers'][$id]['stats'],$gf,$ga,$pf,$pa);
  if($id!==$selected)continue;$opponent=count($opponentIds)===1?$opponentIds[0]:null;
  $out['matches'][]=['world'=>$gw,'fixture_id'=>(string)$r['sm_fixture_id'],'date'=>$r['match_date'],'season'=>$r['imc_season'],'competition'=>$r['competition_key'],'team_id'=>$r[$side.'_sm_club_id'],'team'=>$r[$side.'_name'],'opponent_team'=>$r[$other.'_name'],'gf'=>$gf,'ga'=>$ga,'outcome'=>$gf>$ga?'V':($gf<$ga?'S':'P'),'penalty_for'=>$pf,'penalty_against'=>$pa,'opponent_id'=>$opponent,'opponent_name'=>$opponent!==null?($names[$opponent]??$opponent):null];
 }
}
function ch_read(PDO $db,string $gw,array $managers,?string $selected): array {
 $map=ch_identity($managers);$names=array_column($managers,'full_name','manager_id');$out=ch_init($managers);
 $sql='SELECT sm_fixture_id,imc_season,match_date,competition_key,competition_group,sm_action,home_sm_club_id,away_sm_club_id,home_name,away_name,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score FROM `'.nexus_table($gw,'Match_Report').'` ORDER BY sm_fixture_id';
 $stmt=$db->query($sql);$group=[];$last=null;
 while($r=$stmt->fetch()){
  if(ch_nation($r))continue;$key=(string)($r['sm_fixture_id']??'');
  if($group&&($key!==$last||(int)$key<1)){ch_group($out,$group,$map,$names,$gw,$selected);$group=[];}
  $last=$key;$group[]=$r;
 }
 ch_group($out,$group,$map,$names,$gw,$selected);$stmt->closeCursor();return $out;
}
