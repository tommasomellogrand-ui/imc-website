<?php
declare(strict_types=1);
require __DIR__.'/../nexus/competitions/match-teams.php';
require __DIR__.'/../nexus/players/media.php';
require __DIR__.'/../nexus/h2h/engine.php';
require __DIR__.'/../nexus/h2h/overview-engine.php';
require __DIR__.'/../nexus/teams/roster-stats.php';
function verify(bool $value,string $message): void {if(!$value)throw new RuntimeException($message);}
$codex=[['id'=>1,'name'=>'England','image_url'=>'/nexus/assets/flags/nations/1.svg'],['id'=>2,'name'=>'France','image_url'=>'/nexus/assets/flags/nations/2.svg']];
$map=[['entity_id'=>1,'world_id'=>101],['entity_id'=>2,'world_id'=>102]];
$ctx=['teams'=>['club'=>nexus_team_lookup($codex,$map),'national_team'=>nexus_team_lookup($codex,$map)],'sm_managers'=>[],'assignments'=>[],'competitions'=>[]];
$r=['sm_fixture_id'=>1,'competition_key'=>'GW001|NATIONS|worldcup','competition_group'=>'NATIONS','imc_season'=>1,'match_date'=>'2026-09-18','home_sm_club_id'=>101,'away_sm_club_id'=>102,'home_name'=>'England','away_name'=>'France','home_score'=>2,'away_score'=>1,'report_fixture'=>1];
$club=$r;$club['sm_fixture_id']=2;$club['competition_key']='GW001|DOMESTIC|league|1';$club['competition_group']='DOMESTIC';
$second=$r;$second['sm_fixture_id']=3;$second['match_date']='2026-09-19';$second['home_sm_club_id']=102;$second['away_sm_club_id']=101;$second['home_name']='France';$second['away_name']='England';$second['home_score']=0;$second['away_score']=0;
$matches=h2h_matches([$r,$club,$second,$r],$ctx,'nation','101','national_team');
verify(count($matches)===2,'Only national games, duplicate fixtures excluded');
$stats=h2h_summary($matches);verify($stats['played']===2&&$stats['won']===1&&$stats['drawn']===1&&$stats['gf']===2,'National home/away results');
verify($matches[0]['opponent']['key']==='team:102','Nation H2H compares teams');
verify(count(h2h_matches([$r,$club],$ctx,'club','101','club'))===1,'Club scope preserved');
verify($matches[0]['home']['image_url']==='/nexus/assets/flags/nations/2.svg','National flag namespace');
$overview=nexus_history_overview($matches,[['imc_season'=>1,'imc_season_start_date'=>'2026-01-01','imc_season_end_date'=>null]],'2026-10-04');
verify($overview['global']['stats']['played']===2&&$overview['global']['club']['played']===0,'National overview isolation');
$old=$r+['players_json'=>json_encode([['team_side'=>'home','sm_player_id'=>11,'player_name'=>'Old']])];
$new=$second+['players_json'=>json_encode([['team_side'=>'away','sm_player_id'=>22,'player_name'=>'Selected','starter'=>1],['team_side'=>'home','sm_player_id'=>33,'player_name'=>'Opponent']])];
$snapshot=nexus_national_roster([$old,$new],101);
verify(array_column($snapshot['rows'],'player_id')===[22]&&$snapshot['fixture']===3,'Latest national selection excludes opponent and former roster');
$stats=nexus_roster_stats($snapshot['rows'],[$old,$new],101);
verify(count($stats['rows'])===1&&$stats['rows'][0]['appearances']===1,'Roster statistics restricted to selection');
verify(nexus_national_roster([],101)['rows']===[],'No invented roster without reports');
echo "PASS: national H2H, overview, flags, latest selection, roster statistics, club isolation\n";


$move=static fn($id,$from,$to,$date,$num,$extra=[])=>array_merge(['player_id'=>$id,'player_name'=>'Player '.$id,'from_sm_world_club_id'=>$from,'to_sm_world_club_id'=>$to,'normalized_transfer_date'=>$date,'imc_transfer_number'=>$num,'status'=>'Com'],$extra);
$moves=[$move(22,101,102,'2026-09-21',1),$move(44,102,101,'2026-09-22',2),$move(55,102,101,'2026-09-23',3,['status'=>'Pending']),$move(66,101,102,'2026-09-24',4,['exchange_players'=>'[{"player_id":77,"player_name":"Exchange"}]'])];
$rows=nexus_club_roster($snapshot['rows'],[$old,$new],$moves,101);$by=array_column($rows,null,'player_id');
verify($by[22]['roster_status']==='departed','Transfer overrides stale squad membership');
verify($by[44]['roster_status']==='active'&&!isset($by[55]),'New arrival without appearances; pending transfer ignored');
verify($by[77]['roster_status']==='active'&&$by[66]['roster_status']==='departed','Exchange direction reversed');
verify(!isset($by[33]),'Opponent never added');
$stats=nexus_roster_stats($rows,[$old,$new],101);$byStats=array_column($stats['rows'],null,'player_id');
verify($byStats[22]['appearances']===1&&$byStats[44]['appearances']===0,'Departed statistics preserved; new arrival starts at zero');
$moves[]=$move(22,102,101,'2026-09-25',5);$by=array_column(nexus_club_roster([],[$old,$new],array_reverse($moves),101),null,'player_id');
verify($by[22]['roster_status']==='active','Latest dated return restores active status regardless of input order');
echo "PASS: club active/departed, retained stats, arrivals, returns, exchanges and pending transfers\n";
