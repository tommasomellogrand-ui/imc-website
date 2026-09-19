<?php
declare(strict_types=1);
require __DIR__ . '/../imc-universal-gateway/playoff-normalizer.php';
function check(bool $ok, string $name): void { if (!$ok) throw new RuntimeException($name); }
$s = [
 ['game_world_id'=>'GW007','imc_season'=>'1','imc_season_start_date'=>'2026-01-01','imc_season_end_date'=>'2026-06-30'],
 ['game_world_id'=>'GW007','imc_season'=>'2','imc_season_start_date'=>'2026-07-01','imc_season_end_date'=>null],
 ['game_world_id'=>'GW007','imc_season'=>'3','imc_season_start_date'=>'2027-01-01','imc_season_end_date'=>null]
];
$r = ['game_world_id'=>'GW007','sm_action'=>'league','sm_country'=>'ENG','sm_division'=>'2','home_sm_club_id'=>'11','away_sm_club_id'=>'22','match_date'=>'2026-08-10'];
$playoff = array_merge($r, ['sm_action'=>'league','sm_division'=>'4','competition_stage'=>'Play-off Finale']);
check(imc_playoff_marker($playoff), 'stage marker');
check(!imc_playoff_marker($r), 'league stays league');
check(imc_playoff_marker(['competition_key'=>'GW007|ENG|DOMESTIC|playoff|2']), 'key marker');
check(!imc_playoff_marker(['competition_key'=>'GW007|ENG|DOMESTIC|league|2']), 'key negative');
check(imc_playoff_season('GW007','2026-06-30',$s)==='1','end inclusive');
check(imc_playoff_season('GW007','2026-07-01',$s)==='2','start inclusive');
check(imc_playoff_season('GW007','2027-01-01',$s)==='3','open end closes at next CORE start');
check(imc_playoff_season('GW001','2026-08-01',$s)===null,'GW isolation');
$overlap=$s; $overlap[0]['imc_season_end_date']='2026-07-15';
check(imc_playoff_season('GW007','2026-07-10',$overlap)===null,'overlap unresolved');
$history=[$r,array_merge($r,['match_date'=>'2026-02-01','sm_division'=>'3']),array_merge($r,['sm_country'=>'ITA','sm_division'=>'4'])];
$index=imc_playoff_index('GW007',true,$history,$s);
$v=imc_playoff_values('GW007',true,$playoff,$s,$index);
check($v['competition_key']==='GW007|ENG|DOMESTIC|playoff|2','season and country isolation');
check($v['sm_action']==='playoff','action normalization');
$history[]=array_merge($r,['sm_division'=>'3']);
$v=imc_playoff_values('GW007',true,$playoff,$s,imc_playoff_index('GW007',true,$history,$s));
check($v['competition_key']===null && $v['sm_division']===null,'conflict clears guessed division');
$v=imc_playoff_values('GW007',true,$playoff,$s,[]);
check($v['reason']==='league_division_missing_or_conflicting','out of order pending');
$v=imc_playoff_values('GW007',true,$playoff,$s,$index);
check($v['reason']===null,'later league resolves pending');
$v=imc_playoff_values('GW007',true,array_merge($playoff,['away_sm_club_id'=>'99']),$s,$index);
check($v['competition_key']===null,'both teams required');
$singleSeasons=array_map(fn($x)=>array_merge($x,['game_world_id'=>'GW001']),$s);
$single=array_merge($r,['game_world_id'=>'GW001']);
$v=imc_playoff_values('GW001',false,$single,$singleSeasons,imc_playoff_index('GW001',false,[$single],$singleSeasons));
check($v['competition_key']==='GW001|DOMESTIC|playoff|2' && $v['sm_country']===null,'single key');
echo "Playoff normalization: all assertions passed\n";
