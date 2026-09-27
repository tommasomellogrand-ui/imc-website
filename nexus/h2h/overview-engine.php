<?php
declare(strict_types=1);
function nexus_history_block(array $matches): array {
 usort($matches,static fn($a,$b)=>[$b['match_date'],$b['sm_fixture_id']]<=>[$a['match_date'],$a['sm_fixture_id']]);
 $clubs=array_values(array_filter($matches,static fn($m)=>!str_contains((string)$m['competition_key'],'|NATIONS|')));
 $nations=array_values(array_filter($matches,static fn($m)=>str_contains((string)$m['competition_key'],'|NATIONS|')));
 return ['stats'=>h2h_summary($matches),'club'=>h2h_summary($clubs),'national_team'=>h2h_summary($nations)];
}
function nexus_history_overview(array $matches,array $seasons,string $today): array {
 $current=null;$latest=null;$numbers=[];
 foreach($seasons as $s){$n=(int)$s['imc_season'];$start=$s['imc_season_start_date'];$end=$s['imc_season_end_date'];if($n>0&&$start&&$start<=$today){$numbers[$n]=true;$latest=$n;if(!$end||$end>=$today)$current=$n;}}
 $current=$current??$latest;$buckets=[];$valid=[];$excluded=0;
 foreach($matches as $m){$n=(int)($m['imc_season']??0);if($n<1){$excluded++;continue;}if($current!==null&&$n>$current)continue;$valid[]=$m;$buckets[$n][]=$m;$numbers[$n]=true;}
 if($current!==null){for($n=1;$n<=$current;$n++)$numbers[$n]=true;}
 $ordered=array_keys($numbers);rsort($ordered,SORT_NUMERIC);$blocks=[];
 foreach($ordered as $n){if($current!==null&&$n>$current)continue;$blocks[]=array_merge(['season'=>$n,'current'=>$n===$current],nexus_history_block($buckets[$n]??[]));}
 return ['current_season'=>$current,'global'=>nexus_history_block($valid),'seasons'=>$blocks,'excluded_unassigned_season'=>$excluded];
}
