<?php
declare(strict_types=1);

function smm_rebuild_canonical(): array {
    $db=smm_db(); $db->begin_transaction();
    try{
        $db->query('UPDATE players SET is_active=0,present_in_sm=0,present_in_soccerwiki=0');
        $db->query("INSERT IGNORE INTO players(player_id,forename,surname,image_url,canonical_source,present_in_sm,present_in_soccerwiki,source_conflict,first_seen_date,last_seen_date,is_active) SELECT player_id,forename,surname,IF(image_file='', '', CONCAT(image_base_url,image_file)),'soccer_manager',1,0,0,first_seen_date,last_seen_date,active_latest FROM sm_players_source");
        $db->query("INSERT IGNORE INTO players(player_id,forename,surname,image_url,canonical_source,present_in_sm,present_in_soccerwiki,source_conflict,first_seen_date,last_seen_date,is_active) SELECT player_id,forename,surname,image_url,'soccerwiki',0,1,0,first_seen_date,last_seen_date,active_latest FROM sw_players_source");
        $db->query("UPDATE players p LEFT JOIN sm_players_source sm ON sm.player_id=p.player_id LEFT JOIN sw_players_source sw ON sw.player_id=p.player_id SET p.forename=CASE WHEN sm.player_id IS NOT NULL THEN sm.forename ELSE COALESCE(sw.forename,'') END,p.surname=CASE WHEN sm.player_id IS NOT NULL THEN sm.surname ELSE COALESCE(sw.surname,'') END,p.image_url=CASE WHEN sm.player_id IS NOT NULL AND sm.image_file<>'' THEN CONCAT(sm.image_base_url,sm.image_file) ELSE COALESCE(sw.image_url,'') END,p.canonical_source=CASE WHEN sm.player_id IS NOT NULL THEN 'soccer_manager' ELSE 'soccerwiki' END,p.present_in_sm=IF(sm.player_id IS NULL,0,1),p.present_in_soccerwiki=IF(sw.player_id IS NULL,0,1),p.source_conflict=IF(sm.player_id IS NOT NULL AND sw.player_id IS NOT NULL AND (TRIM(sm.forename)<>TRIM(sw.forename) OR TRIM(sm.surname)<>TRIM(sw.surname)),1,0),p.first_seen_date=LEAST(COALESCE(sm.first_seen_date,'9999-12-31'),COALESCE(sw.first_seen_date,'9999-12-31')),p.last_seen_date=GREATEST(COALESCE(sm.last_seen_date,'1000-01-01'),COALESCE(sw.last_seen_date,'1000-01-01')),p.is_active=IF(COALESCE(sm.active_latest,0)=1 OR COALESCE(sw.active_latest,0)=1,1,0)");

        $db->query('UPDATE clubs SET is_active=0,present_in_sm=0,present_in_soccerwiki=0');
        $db->query("INSERT IGNORE INTO clubs(club_id,name,short_name,image_url,canonical_source,present_in_sm,present_in_soccerwiki,source_conflict,first_seen_date,last_seen_date,is_active) SELECT club_id,name,'',IF(image_file='', '', CONCAT(image_base_url,image_file)),'soccer_manager',1,0,0,first_seen_date,last_seen_date,active_latest FROM sm_clubs_source");
        $db->query("INSERT IGNORE INTO clubs(club_id,name,short_name,image_url,canonical_source,present_in_sm,present_in_soccerwiki,source_conflict,first_seen_date,last_seen_date,is_active) SELECT club_id,name,short_name,image_url,'soccerwiki',0,1,0,first_seen_date,last_seen_date,active_latest FROM sw_clubs_source");
        $db->query("UPDATE clubs c LEFT JOIN sm_clubs_source sm ON sm.club_id=c.club_id LEFT JOIN sw_clubs_source sw ON sw.club_id=c.club_id SET c.name=CASE WHEN sm.club_id IS NOT NULL THEN sm.name ELSE COALESCE(sw.name,'') END,c.short_name=COALESCE(sw.short_name,''),c.image_url=CASE WHEN sm.club_id IS NOT NULL AND sm.image_file<>'' THEN CONCAT(sm.image_base_url,sm.image_file) ELSE COALESCE(sw.image_url,'') END,c.canonical_source=CASE WHEN sm.club_id IS NOT NULL THEN 'soccer_manager' ELSE 'soccerwiki' END,c.present_in_sm=IF(sm.club_id IS NULL,0,1),c.present_in_soccerwiki=IF(sw.club_id IS NULL,0,1),c.source_conflict=IF(sm.club_id IS NOT NULL AND sw.club_id IS NOT NULL AND TRIM(sm.name)<>TRIM(sw.name),1,0),c.first_seen_date=LEAST(COALESCE(sm.first_seen_date,'9999-12-31'),COALESCE(sw.first_seen_date,'9999-12-31')),c.last_seen_date=GREATEST(COALESCE(sm.last_seen_date,'1000-01-01'),COALESCE(sw.last_seen_date,'1000-01-01')),c.is_active=IF(COALESCE(sm.active_latest,0)=1 OR COALESCE(sw.active_latest,0)=1,1,0)");

        $copies=[
            ['sw_leagues_source','leagues','league_id',['name','image_url']],['sw_cups_source','cups','cup_id',['name','image_url']],['sw_stadiums_source','stadiums','stadium_id',['name']],['sw_football_managers_source','football_managers','manager_id',['forename','surname','image_url']],['sw_national_teams_source','national_teams','national_team_id',['name','short_name','image_url']],['sw_international_cups_source','international_cups','international_cup_id',['name']],['sw_awards_source','awards','award_id',['name','image_url']],['sw_player_images_source','player_images','player_id',['image_action_url','image_action_peak_url','image_peak_url','image_youth_url']]
        ];
        foreach($copies as [$src,$dst,$id,$fields]){
            $db->query("UPDATE `$dst` SET is_active=0");
            $all=array_merge([$id],$fields,['first_seen_date','last_seen_date','is_active']);
            $sel=array_merge([$id],$fields,['first_seen_date','last_seen_date','active_latest']);
            $updates=[];foreach(array_merge($fields,['last_seen_date']) as $f)$updates[]="`$f`=VALUES(`$f`)";$updates[]='`is_active`=VALUES(`is_active`)';
            $db->query("INSERT INTO `$dst` (`".implode('`,`',$all)."`) SELECT `".implode('`,`',$sel)."` FROM `$src` ON DUPLICATE KEY UPDATE ".implode(',',$updates));
        }
        $db->commit();
        return smm_counts();
    }catch(Throwable $e){$db->rollback();throw $e;}
}

function smm_counts(): array {
    $db=smm_db(); $tables=['sm_players_source','sm_clubs_source','sw_players_source','sw_clubs_source','sw_leagues_source','sw_cups_source','sw_stadiums_source','sw_football_managers_source','sw_national_teams_source','sw_international_cups_source','sw_awards_source','sw_player_images_source','players','clubs','leagues','cups','stadiums','football_managers','national_teams','international_cups','awards','player_images'];
    $out=[]; foreach($tables as $t){$r=$db->query("SELECT COUNT(*) c FROM `$t`");$out[$t]=(int)$r->fetch_assoc()['c'];} return $out;
}

