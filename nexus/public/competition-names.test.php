<?php
declare(strict_types=1);
require_once __DIR__.'/core.php';
function label_check(bool $ok,string $why): void {if(!$ok)throw new RuntimeException($why);}
$mapping=[
 ['game_world_id'=>'GW001','world_type'=>'SINGLE','competition_key'=>'GW001|DOMESTIC|league|1','nexus_view'=>'Div 1'],
 ['game_world_id'=>'GW001','world_type'=>'SINGLE','competition_key'=>'GW001|DOMESTIC|leaguecup|4','nexus_view'=>'National Cup'],
 ['game_world_id'=>'GW002','world_type'=>'MULTI','competition_key'=>'GW002|ENG|DOMESTIC|league|1','nexus_view'=>'England Div 1']
];
$rows=[['competition_key'=>'GW001|CUS|DOMESTIC|league|1','custom_competition'=>'OLD'],['competition_key'=>'GW001|DOMESTIC|leaguecup'],['competition_key'=>'GW001|DOMESTIC|league|2']];
$keys=array_column($rows,'competition_key');
nexus_apply_catalog_names($rows,$mapping,'GW001');
label_check($rows[0]['nexus_view']==='Div 1','Single legacy country must resolve CORE label');
label_check($rows[1]['custom_competition']==='National Cup','Cup division must not change label');
label_check($rows[2]['name_mapping_status']==='missing'&&$rows[2]['nexus_view']===null,'Missing names must not be invented');
label_check(array_column($rows,'competition_key')===$keys,'Technical keys must remain unchanged');
$multi=[['competition_key'=>'GW002|ENG|DOMESTIC|league|1'],['competition_key'=>'GW002|ITA|DOMESTIC|league|1']];
nexus_apply_catalog_names($multi,$mapping,'GW002');
label_check($multi[0]['nexus_view']==='England Div 1'&&$multi[1]['nexus_view']===null,'Multi countries must stay separate');
$mapping[]=['game_world_id'=>'GW001','world_type'=>'SINGLE','competition_key'=>'GW001|DOMESTIC|leaguecup|1','nexus_view'=>'Conflicting Cup'];
nexus_apply_catalog_names($rows,$mapping,'GW001');
label_check($rows[1]['name_mapping_status']==='ambiguous','Conflicting labels must not be guessed');
echo "NEXUS_CORE_COMPETITION_NAMES_OK\n";
