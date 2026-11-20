<?php
declare(strict_types=1);

function imc_site_history_block(array $matches): array {
 $clubs=array_values(array_filter($matches,static fn($match)=>$match['scope']==='club'));
 $nations=array_values(array_filter($matches,static fn($match)=>$match['scope']==='national_team'));
 $stats=h2h_summary($matches);
 $club=h2h_summary($clubs);
 $national=h2h_summary($nations);
 foreach([&$stats,&$club,&$national] as &$summary){
  unset($summary['reports'],$summary['last_match']['has_report'],$summary['biggest_win']['has_report']);
 }
 unset($summary);
 return ['stats'=>$stats,'club'=>$club,'national_team'=>$national];
}

function imc_site_history_overview(array $rows,array $ctx,string $kind,int $subjectId): array {
 $matches=[];$seasons=[];$seen=[];
 $field=$kind==='manager'?'sm_manager_id':'sm_club_id';
 foreach($rows as $row){
  $fixture=(string)($row['sm_fixture_id']??'');
  if($fixture===''||$fixture==='0'||isset($seen[$fixture]))continue;
  $national=h2h_nation($row);
  if($kind!=='manager'&&$national!==($kind==='nation'))continue;
  $side=(int)($row['home_'.$field]??0)===$subjectId?'home':'away';
  if($subjectId<1||(int)($row[$side.'_'.$field]??0)!==$subjectId)continue;
  $seen[$fixture]=true;
  $other=$side==='home'?'away':'home';
  $gf=(int)$row[$side.'_score'];$ga=(int)$row[$other.'_score'];
  $key=(string)($row['competition_key']??'');
  $match=array_intersect_key($row,array_flip([
   'sm_fixture_id','match_date','imc_season','competition_key','competition_stage',
   'competition_round','competition_group_name','home_score','away_score','penalty_home_score',
   'penalty_away_score','aggregate_home_score','aggregate_away_score'
  ]));
  $match+=['home'=>h2h_team($row,'home',$ctx),'away'=>h2h_team($row,'away',$ctx),
   'scope'=>$national?'national_team':'club','side'=>$side,'gf'=>$gf,'ga'=>$ga,
   'outcome'=>$gf>$ga?'V':($gf<$ga?'P':'N'),'has_report'=>false,
   'competition_name'=>$ctx['competitions'][$key]??$key];
  $matches[]=$match;
  $season=(int)($row['imc_season']??0);
  if($season>0)$seasons[$season][]=$match;
 }
 krsort($seasons,SORT_NUMERIC);
 $blocks=[];
 foreach($seasons as $season=>$results)$blocks[]=['season'=>$season]+imc_site_history_block($results);
 return ['global'=>imc_site_history_block($matches),'seasons'=>$blocks,
  'matches'=>array_map(static function($match){unset($match['has_report']);return $match;},$matches)];
}
