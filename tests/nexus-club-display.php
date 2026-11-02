<?php
declare(strict_types=1);
require dirname(__DIR__).'/nexus/core/club-display.php';
set_error_handler(static function($severity,$message,$file,$line){throw new ErrorException($message,0,$severity,$file,$line);});
function check($ok,string $message): void {if(!$ok)throw new RuntimeException($message);echo "OK $message\n";}
$clubs=[['id'=>108,'name'=>'Genoa CFC','nexus_view'=>' Genoa '],['id'=>224,'name'=>'FC Porto','nexus_view'=>'Porto'],['id'=>1,'name'=>'No alias','nexus_view'=>null],['id'=>2,'name'=>'Blank alias','nexus_view'=>'  '],['id'=>3,'name'=>'Duplicate','nexus_view'=>'One'],['id'=>4,'name'=>'Duplicate','nexus_view'=>'Two'],['id'=>5,'name'=>'England','nexus_view'=>'Must not touch a nation']];
$mapping=[['game_world_id'=>'GW001','world_id'=>100,'entity_id'=>108,'name'=>'Genoa CFC'],['game_world_id'=>'GW002','world_id'=>100,'entity_id'=>224,'name'=>'FC Porto'],['game_world_id'=>'GW001','world_id'=>200,'entity_id'=>1,'name'=>'Original mapping']];
$ix=nexus_club_label_index($clubs,$mapping);
check(nexus_club_label('Old imported label',$ix,'GW001',100)==='Genoa','world ID resolves even an old imported name');
check(nexus_club_label('Old imported label',$ix,'GW002',100)==='Porto','same world ID in different GWs stays scoped');
check(nexus_club_label('Original mapping',$ix,'GW001',200)==='Original mapping','null alias preserves original');
check(nexus_club_label('Blank alias',$ix)==='Blank alias','whitespace alias preserves original');
check(nexus_club_label('Duplicate',$ix)==='Duplicate','ambiguous names remain unchanged');
check(nexus_club_label('Unknown',$ix)==='Unknown','unmapped club remains unchanged');
$payload=['ok'=>true,'world'=>'GW001','results'=>[
 ['sm_fixture_id'=>42,'competition_key'=>'GW001|DOMESTIC|league','home_sm_club_id'=>100,'home_name'=>'Old name','away_sm_club_id'=>200,'away_name'=>'Original mapping','home_score'=>3,'away_score'=>0,'home_manager_name'=>'Genoa CFC'],
 ['sm_fixture_id'=>43,'competition_key'=>'GW001|NATIONS|worldcup','home_sm_club_id'=>100,'home_name'=>'England','away_name'=>'FC Porto','home_score'=>1,'away_score'=>1]
], 'groups'=>[['rows'=>[['team_id'=>100,'team_name'=>'Old name','points'=>12,'position'=>1]]]],
'players'=>[['player_id'=>108,'name'=>'Genoa CFC','current_sm_club_id'=>100,'current_club'=>'Old name','teams'=>[['id'=>100,'name'=>'Old name']],'clubs'=>['Genoa CFC']]],
'assignments'=>[['assignment_type'=>'club','team_id'=>100,'team_name'=>'Old name','assignment_name'=>'Old name','full_name'=>'Genoa CFC'],['assignment_type'=>'national_team','team_id'=>100,'team_name'=>'England','assignment_name'=>'England']],
'rows'=>[['from_sm_world_club_id'=>100,'club_from'=>'Old name','club_to'=>'FC Porto','transfer_fee'=>123]],
'matches'=>[['competition_key'=>'GW001|DOMESTIC|league','home'=>['key'=>'team:100','world_id'=>100,'name'=>'Old name'],'away'=>['key'=>'name:fcporto','name'=>'FC Porto'],'home_manager'=>['key'=>'imc:MNG001','name'=>'Genoa CFC']]],
'preview'=>['standings'=>[['id'=>100,'name'=>'Old name','points'=>12]],'home_form'=>[['opponent'=>'Genoa CFC','gf'=>2,'ga'=>1]]],
'events'=>[['world'=>'GW002','team_id'=>100,'team'=>'Old name','assignment_type'=>'club']],
'commentary'=>'Genoa CFC won','players_json'=>'[{"name":"Genoa CFC"}]'];
$out=nexus_club_labels_payload($payload,$ix);
check($out['results'][0]['home_name']==='Genoa','results use alias');
check($out['results'][0]['away_name']==='Original mapping','results fall back');
check($out['results'][1]===$payload['results'][1],'nation rows stay unchanged in mixed feed');
check($out['groups'][0]['rows'][0]['team_name']==='Genoa','standings use alias');
check($out['players'][0]['name']==='Genoa CFC'&&$out['players'][0]['current_club']==='Genoa','player names preserved, current club renamed');
check($out['players'][0]['teams'][0]['name']==='Genoa'&&$out['players'][0]['clubs']===['Genoa'],'scorer teams and labels use alias');
check($out['assignments'][0]['team_name']==='Genoa'&&$out['assignments'][0]['assignment_name']==='Genoa','assignment labels use alias');
check($out['assignments'][1]===$payload['assignments'][1],'national assignments stay unchanged');
check($out['rows'][0]['club_from']==='Genoa'&&$out['rows'][0]['club_to']==='Porto','both transfer clubs use alias');
check($out['matches'][0]['home']['name']==='Genoa'&&$out['matches'][0]['away']['name']==='Porto','H2H team objects use alias');
check($out['matches'][0]['home_manager']===$payload['matches'][0]['home_manager'],'H2H manager identity remains unchanged');
check($out['preview']['standings'][0]['name']==='Genoa'&&$out['preview']['home_form'][0]['opponent']==='Genoa','matchday table and form use alias');
check($out['events'][0]['team']==='Porto','multi-world timeline resolves per event');
check($out['commentary']===$payload['commentary']&&$out['players_json']===$payload['players_json'],'editorial text and raw reports preserved');
check($out['results'][0]['sm_fixture_id']===42&&$out['results'][0]['home_score']===3&&$out['groups'][0]['rows'][0]['points']===12,'IDs, scores and statistics unchanged');
$directory=nexus_club_labels_payload(['world'=>'GW001','type'=>'clubs','rows'=>[['entity_id'=>108,'world_id'=>100,'name'=>'Original mapping','manager'=>['name'=>'Genoa CFC']]]],$ix);
check($directory['rows'][0]['name']==='Genoa'&&$directory['rows'][0]['manager']['name']==='Genoa CFC','directory renames only club');
$nation=nexus_club_labels_payload(['world'=>'GW001','type'=>'nations','rows'=>[['entity_id'=>108,'world_id'=>100,'name'=>'England']]],$ix);
check($nation['rows'][0]['name']==='England','national directory remains unchanged even with overlapping IDs');
$context=['ok'=>true,'world'=>['game_world_name'=>'World name']];
check(nexus_club_labels_payload($context,$ix)===$context,'world context object remains unchanged without warnings');
$national=nexus_club_labels_payload(['rows'=>[['team_id'=>100,'team_name'=>'England']]],$ix,'GW001',nexus_club_label_scope(['competition'=>'GW001|NATIONS|worldcup'],false));
check($national['rows'][0]['team_name']==='England','request competition scope protects national group tables');
$ix['clubs'][108]='New alias';
check(nexus_club_labels_payload($payload,$ix)['results'][0]['home_name']==='New alias','updated CORE alias is reflected without changing source records');
echo "All club display regression checks passed.\n";
