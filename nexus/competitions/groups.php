<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);$key=trim((string)($_GET['competition']??''));
  if($season===null)throw new InvalidArgumentException('season_required');if($key==='')throw new InvalidArgumentException('competition_required');
  $db=nexus_db($c,nexus_target($c,$gw));$table=nexus_table($gw,'Results');
  $rows=nexus_rows($db,'SELECT sm_fixture_id,competition_stage,competition_round,home_sm_club_id,home_name,away_sm_club_id,away_name,home_score,away_score FROM `'.$table.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY match_date,sm_fixture_id',[$gw,$season,$key]);
  $groups=[];$seen=[];
  foreach($rows as $r){
    $stage=trim((string)($r['competition_stage']??'')); if($stage===''||!preg_match('/group/i',$stage))continue;
    $fixture=(string)($r['sm_fixture_id']??'');if($fixture!==''&&isset($seen[$fixture]))continue;if($fixture!=='')$seen[$fixture]=1;
    if(!isset($groups[$stage]))$groups[$stage]=[];
    $h=(string)($r['home_sm_club_id']??$r['home_name']);$a=(string)($r['away_sm_club_id']??$r['away_name']);
    foreach([[$h,$r['home_name']],[$a,$r['away_name']]] as [$id,$name])if(!isset($groups[$stage][$id]))$groups[$stage][$id]=['team_id'=>$id,'team_name'=>$name,'played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'gd'=>0,'points'=>0];
    $hs=(int)$r['home_score'];$as=(int)$r['away_score'];$groups[$stage][$h]['played']++;$groups[$stage][$a]['played']++;$groups[$stage][$h]['gf']+=$hs;$groups[$stage][$h]['ga']+=$as;$groups[$stage][$a]['gf']+=$as;$groups[$stage][$a]['ga']+=$hs;
    if($hs>$as){$groups[$stage][$h]['won']++;$groups[$stage][$h]['points']+=3;$groups[$stage][$a]['lost']++;}elseif($hs<$as){$groups[$stage][$a]['won']++;$groups[$stage][$a]['points']+=3;$groups[$stage][$h]['lost']++;}else{$groups[$stage][$h]['drawn']++;$groups[$stage][$a]['drawn']++;$groups[$stage][$h]['points']++;$groups[$stage][$a]['points']++;}
  }
  $out=[];foreach($groups as $name=>$teams){foreach($teams as &$t)$t['gd']=$t['gf']-$t['ga'];unset($t);$list=array_values($teams);usort($list,fn($x,$y)=>[$y['points'],$y['gd'],$y['gf'],$x['team_name']]<=>[$x['points'],$x['gd'],$x['gf'],$y['team_name']]);foreach($list as $i=>&$t)$t['position']=$i+1;unset($t);$out[]=['group'=>$name,'rows'=>$list];}
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key,'groups'=>$out]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_groups_error'],500);}
