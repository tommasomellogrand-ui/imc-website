<?php
declare(strict_types=1);

function smm_gw008_s1_foundation_metrics(): array {
    $db=smm_storage_db('gold');
    $counts=[];
    foreach(['gw_game_worlds','gw_seasons','gw_countries','gw_divisions'] as $table){
        $stmt=$db->prepare("SELECT COUNT(*) total FROM `$table` WHERE game_world_id='GW008'");
        $stmt->execute();$counts[$table]=(int)$stmt->get_result()->fetch_assoc()['total'];$stmt->close();
    }
    $identity=(int)$db->query("SELECT COUNT(*) total FROM gw_seasons WHERE game_world_id='GW008' AND imc_season=1 AND soccer_manager_season=48 AND sm_season_id IS NULL AND start_date='2026-03-30' AND end_date='2026-08-29'")->fetch_assoc()['total'];
    return ['ok'=>$counts['gw_game_worlds']===1&&$counts['gw_seasons']===1&&$counts['gw_countries']===12&&$counts['gw_divisions']===19&&$identity===1,'database'=>(string)$db->query('SELECT DATABASE() db')->fetch_assoc()['db'],'counts'=>$counts,'certified_identity_rows'=>$identity];
}

function smm_gw008_s1_foundation_status(): never {
    $m=smm_gw008_s1_foundation_metrics();
    smm_json($m,$m['ok']?200:409);
}

function smm_migrate_gw008_s1_foundation(): never {
    $db=smm_storage_db('gold');
    $countries=[[39,'Americano/a','America'],[40,'Est Europa','Est Europa'],[41,'Europa Centrale','Europa Centrale'],[42,'Francia','Francia'],[43,'Germania','Germania'],[44,'Inghilterra','Inghilterra'],[45,'Italia','Italia'],[46,'Mediterraneo','Mediterraneo'],[47,'Olanda & Belgio','Benelux'],[48,'Scandinavia','Scandinavia'],[49,'Scozia','Scozia'],[50,'Spagna','Spagna']];
    $divisions=[[51,45,1],[52,45,2],[53,44,1],[54,44,2],[55,44,3],[56,44,4],[57,50,1],[58,50,2],[59,49,1],[60,42,1],[61,42,2],[62,43,1],[63,43,2],[64,47,1],[65,40,1],[66,39,1],[67,46,1],[68,41,1],[69,48,1]];
    try{
        $db->begin_transaction();
        $db->query("INSERT INTO gw_game_worlds (game_world_id,active_manager_count,controlled_clubs,controlled_percentage,created_at,creator,current_soccer_manager_season,database_scope,game_world_name,game_world_type,legacy_game_world_code_raw,owner,reference_class,sm_game_world_id,total_clubs,updated_at) VALUES ('GW008',340,340,89.4737,NOW(),'Soccer Manager',48,1,'Campionato Gold 1','multi_league','GW008','Soccer Manager','GOLD',668,380,NOW()) ON DUPLICATE KEY UPDATE active_manager_count=VALUES(active_manager_count),controlled_clubs=VALUES(controlled_clubs),controlled_percentage=VALUES(controlled_percentage),creator=VALUES(creator),current_soccer_manager_season=VALUES(current_soccer_manager_season),game_world_name=VALUES(game_world_name),game_world_type=VALUES(game_world_type),owner=VALUES(owner),reference_class=VALUES(reference_class),sm_game_world_id=VALUES(sm_game_world_id),total_clubs=VALUES(total_clubs),updated_at=NOW()");
        $db->query("INSERT INTO gw_seasons (gw_season_row_id,created_at,end_date,game_world_id,imc_season,season_identity_fingerprint,season_label,sm_game_world_id,sm_season_id,soccer_manager_season,start_date) VALUES (8000000001,NOW(),'2026-08-29','GW008',1,SHA2('GW008|1|48|2026-03-30|2026-08-29',256),'GW008 · IMC Season 1 · Soccer Manager Season 48',668,NULL,48,'2026-03-30') ON DUPLICATE KEY UPDATE end_date=VALUES(end_date),season_label=VALUES(season_label),sm_game_world_id=VALUES(sm_game_world_id),sm_season_id=NULL,soccer_manager_season=VALUES(soccer_manager_season),start_date=VALUES(start_date)");
        $country=$db->prepare("INSERT INTO gw_countries (gw_country_id,capture_id,country_code,country_name,created_at,game_world_id,sm_game_world_id) VALUES (?,NULL,?,?,NOW(),'GW008',668) ON DUPLICATE KEY UPDATE country_code=VALUES(country_code),country_name=VALUES(country_name),sm_game_world_id=VALUES(sm_game_world_id)");
        foreach($countries as[$source,$code,$name]){$id=8001000000+$source;$country->bind_param('iss',$id,$code,$name);$country->execute();}$country->close();
        $division=$db->prepare("INSERT INTO gw_divisions (gw_division_id,created_at,display_order,division_identity_fingerprint,division_label,division_value,game_world_id,gw_country_id,gw_season_row_id,imc_season,sm_game_world_id,sm_season_id,soccer_manager_season) VALUES (?,NOW(),?,SHA2(?,256),?,?, 'GW008',?,8000000001,1,668,NULL,48) ON DUPLICATE KEY UPDATE display_order=VALUES(display_order),division_label=VALUES(division_label),division_value=VALUES(division_value),gw_country_id=VALUES(gw_country_id),gw_season_row_id=VALUES(gw_season_row_id),sm_season_id=NULL");
        foreach($divisions as[$source,$countrySource,$level]){$id=8002000000+$source;$countryId=8001000000+$countrySource;$fingerprint="GW008|$countrySource|$source";$label="Division $level";$division->bind_param('iissii',$id,$level,$fingerprint,$label,$level,$countryId);$division->execute();}$division->close();
        $db->commit();
        $m=smm_gw008_s1_foundation_metrics();
        smm_json($m,$m['ok']?200:500);
    }catch(Throwable $e){try{$db->rollback();}catch(Throwable){}smm_json(['ok'=>false,'database'=>'Sql1956795_2','error'=>$e->getMessage()],500);}
}
