<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
try{
  $c=nexus_config(); $gw=nexus_world($_GET['world']??''); $season=nexus_season($_GET['season']??null);
  $key=trim((string)($_GET['competition']??'')); if($season===null) throw new InvalidArgumentException('season_required'); if($key==='') throw new InvalidArgumentException('competition_required');
  $db=nexus_db($c,nexus_target($c,$gw)); $table=nexus_table($gw,'Results');
  $rows=nexus_rows($db,'SELECT sm_fixture_id,competition_stage,home_sm_club_id,home_name,away_sm_club_id,away_name,home_score,away_score,result_status FROM `'.$table.'` WHERE game_world_id=? AND imc_season=? AND competition_key=? AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY match_date,sm_fixture_id',[$gw,$season,$key]);
  $teams=[];$seen=[];
  foreach($rows as $r){
    $fixture=(string)($r['sm_fixture_id']??''); if($fixture!==''&&isset($seen[$fixture])) continue; if($fixture!=='')$seen[$fixture]=true;
    $stage=trim((string)($r['competition_stage']??'')); if($stage!==''&&!preg_match('/group|league/i',$stage)) continue;
    $h=(string)($r['home_sm_club_id']??$r['home_name']);$a=(string)($r['away_sm_club_id']??$r['away_name']); if($h===''||$a==='')continue;
    foreach([[$h,$r['home_name']],[$a,$r['away_name']]] as [$id,$name]) if(!isset($teams[$id]))$teams[$id]=['team_id'=>$id,'team_name'=>$name,'played'=>0,'won'=>0,'drawn'=>0,'lost'=>0,'gf'=>0,'ga'=>0,'gd'=>0,'points'=>0];
    $hs=(int)$r['home_score'];$as=(int)$r['away_score'];$teams[$h]['played']++;$teams[$a]['played']++;$teams[$h]['gf']+=$hs;$teams[$h]['ga']+=$as;$teams[$a]['gf']+=$as;$teams[$a]['ga']+=$hs;
    if($hs>$as){$teams[$h]['won']++;$teams[$h]['points']+=3;$teams[$a]['lost']++;}elseif($hs<$as){$teams[$a]['won']++;$teams[$a]['points']+=3;$teams[$h]['lost']++;}else{$teams[$h]['drawn']++;$teams[$a]['drawn']++;$teams[$h]['points']++;$teams[$a]['points']++;}
  }
  foreach($teams as &$t)$t['gd']=$t['gf']-$t['ga'];unset($t);
  $tableRows=array_values($teams);usort($tableRows,fn($x,$y)=>[$y['points'],$y['gd'],$y['gf'],$x['team_name']]<=>[$x['points'],$x['gd'],$x['gf'],$y['team_name']]);
  foreach($tableRows as $i=>&$t)$t['position']=$i+1;unset($t);
  nexus_out(['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'competition_key'=>$key,'rows'=>$tableRows]);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'competition_standings_error'],500);}
