<?php
declare(strict_types=1);
require __DIR__.'/../nexus/competitions/match-teams.php';
require __DIR__.'/../nexus/matchday/engine.php';
require __DIR__.'/../nexus/matchday/identity.php';
function check(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
$mapped=[['name'=>'Palermo FC','world_id'=>94078884],['name'=>'Hertha BSC','world_id'=>94079171]];
$r=['sm_fixture_id'=>368861349,'competition_key'=>'GW001|DOMESTIC|league|1','sm_action'=>'league','match_date'=>'2026-09-27','home_name'=>'Torino','away_name'=>'PALERMO FC','home_sm_club_id'=>94078895,'away_sm_club_id'=>null,'home_score'=>2,'away_score'=>1];
$schedule=['sm_fixture_id'=>368861627,'competition_key'=>'GW001|DOMESTIC|league|4','sm_action'=>'league','home_name'=>'AS Roma','away_name'=>'HERTHA BSC','home_sm_club_id'=>94078890,'away_sm_club_id'=>null];
$index=md_identity_index($mapped,[$r,$schedule]);$fixed=md_resolve_identities([$r,$schedule],$index);
check($fixed[0]['away_sm_club_id']===94078884,'Palermo ID recovery');check($fixed[1]['away_sm_club_id']===94079171,'Hertha schedule ID recovery');
$table=md_standings([$fixed[0]],[$fixed[0]],$r['competition_key']);check($table[0]['name']==='Torino'&&$table[0]['points']===3&&$table[0]['played']===1,'Torino result counted');
check(md_form([$fixed[0]],94078884)[0]['outcome']==='P','Palermo form recovered');
$report=['sm_fixture_id'=>368861349,'home_sm_club_id'=>94078895,'away_sm_club_id'=>null,'players_json'=>json_encode([['team_side'=>'away','sm_player_id'=>123,'player_name'=>'Test','starter'=>1,'goals'=>1,'assists'=>0,'rating'=>7]])];
$reports=md_report_identities([$report],$fixed);$players=md_players($reports);check($players[94078884][0]['goals']===1&&$players[94078884][0]['played']===1,'Report players follow resolved fixture identity');
$ambiguous=md_identity_index(array_merge($mapped,[['name'=>'PALERMO FC','world_id'=>999]]),[]);check(!isset($ambiguous['palermofc']),'Ambiguous name not resolved');
$known=$r;$known['away_sm_club_id']=777;check(md_resolve_identities([$known],$index)[0]['away_sm_club_id']===777,'Existing ID preserved');
$national=$r;$national['competition_key']='GW001|NATIONS|worldcup';check(md_resolve_identities([$national],$index)[0]['away_sm_club_id']===null,'National team namespace kept separate');
$unknown=$r;$unknown['away_name']='Unknown';check(md_resolve_identities([$unknown],$index)[0]['away_sm_club_id']===null,'Unknown names not guessed');
$report['sm_fixture_id']=999;check(md_report_identities([$report],$fixed)[0]['away_sm_club_id']===null,'Different fixture never reused');
echo "PASS: identity, standings, form, report players, ambiguity, preserved IDs and fixture isolation\n";
