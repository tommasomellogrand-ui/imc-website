<?php
declare(strict_types=1);

function imc_wc_target(string $table): ?array {
    $physical=imc_physical_table($table);
    if (preg_match('/^(IMC[0-9]{3})_(Schedule|Results|Match_Reports)$/D',$physical,$m)) return ['world'=>$m[1],'schedule'=>$m[1].'_Schedule','results'=>$m[1].'_Results','reports'=>$m[1].'_Match_Reports'];
    return null;
}

/** An importer-selected edition must not be inferred again from match dates. */
function imc_wc_selected_edition(array $row): bool {
    return (int)($row['imc_season']??0)>0 && (bool)preg_match('/^IMC[0-9]{3}\|S0*'.(int)($row['imc_season']??0).'\|NATIONS\|(?:worldcup|interqualifier)$/D',(string)($row['competition_key']??''));
}

function imc_wc_knockout(array $row): bool {
    return (bool)preg_match('/final|quarti|ottavi|round of|knockout|eliminaz/i',($row['competition_stage']??'').' '.($row['competition_round']??''));
}

function imc_wc_group(array $row): ?string {
    foreach (['competition_group_name','competition_stage','competition_round'] as $field) {
        if (preg_match('/^(?:girone|gruppo|group|pool)\s*([a-z]|\d+)$/i',trim((string)($row[$field]??'')),$m)) return 'Girone '.strtoupper($m[1]);
    }
    return null;
}

/** Only a complete 32-team, 48-fixture K4 schedule can override a Qualifier label. */
function imc_wc_detect(array $rows): array {
    $fixtures=[];$bad=[];
    foreach ($rows as $row) {
        if (imc_wc_selected_edition($row) || imc_wc_knockout($row) || !in_array(strtolower(trim((string)($row['sm_action']??''))),['interqualifier','worldcup','worldcupqualifying'],true)) continue;
        $id=(string)($row['sm_fixture_id']??'');
        if (!ctype_digit($id) || (int)$id<=0 || empty($row['match_date']) || empty($row['home_sm_team_id']) || empty($row['away_sm_team_id'])) continue;
        if (isset($fixtures[$id])) {
            foreach (['match_date','home_sm_team_id','away_sm_team_id'] as $field) if ((string)$fixtures[$id][$field] !== (string)$row[$field]) $bad[$id]=true;
        } else $fixtures[$id]=$row;
    }
    foreach ($bad as $id=>$_) unset($fixtures[$id]);
    $byDate=[];
    foreach ($fixtures as $id=>$row) $byDate[$row['match_date']][$id]=$row;
    ksort($byDate);$dates=array_keys($byDate);$out=[];
    for ($i=0;$i+2<count($dates);$i++) {
        $window=array_slice($dates,$i,3);$batch=[];
        foreach ($window as $day) { if(count($byDate[$day])!==16) continue 2; $batch+=$byDate[$day]; }
        $edges=[];$adj=[];
        foreach ($batch as $id=>$row) {
            $h=(string)$row['home_sm_team_id'];$a=(string)$row['away_sm_team_id'];
            if ($h===$a) continue 2;
            $pair=[$h,$a];sort($pair,SORT_STRING);$key=implode(':',$pair);
            if (isset($edges[$key])) continue 2;
            $edges[$key]=$id;$adj[$h][$a]=true;$adj[$a][$h]=true;
        }
        if (count($adj)!==32) continue;
        $seen=[];$groups=[];
        foreach ($adj as $team=>$opponents) {
            if(isset($seen[$team]))continue;
            $members=array_map('strval',array_merge([$team],array_keys($opponents)));sort($members,SORT_STRING);
            if(count($members)!==4)continue 2;
            foreach($members as $member){$neighbors=array_map('strval',array_keys($adj[$member]??[]));sort($neighbors,SORT_STRING);$expected=array_values(array_diff($members,[$member]));if($neighbors!==$expected)continue 3;$seen[$member]=true;}
            $matches=[];$daily=[];$labels=[];
            foreach($batch as $id=>$row)if(in_array((string)$row['home_sm_team_id'],$members,true)){
                $matches[$id]=$row;$daily[$row['match_date']][]=$row['home_sm_team_id'];$daily[$row['match_date']][]=$row['away_sm_team_id'];
                if(($label=imc_wc_group($row))!==null)$labels[$label]=true;
            }
            if(count($matches)!==6||count($labels)>1)continue 2;
            foreach($daily as $players)if(count($players)!==4||count(array_unique($players))!==4)continue 3;
            $groups[]=['members'=>$members,'fixtures'=>$matches,'name'=>array_key_first($labels)];
        }
        if(count($groups)!==8)continue;
        usort($groups,fn($a,$b)=>(int)min(array_keys($a['fixtures']))<=>(int)min(array_keys($b['fixtures'])));
        $labels=[];foreach($groups as $g)if($g['name']!==null){if(isset($labels[$g['name']]))continue 2;$labels[$g['name']]=true;}
        foreach($groups as $n=>&$g){
            // A numeric group is a calculated identifier, not an invented official letter.
            if($g['name']===null){$number=$n+1;while(isset($labels['Girone '.$number]))$number++;$g['name']='Girone '.$number;$labels[$g['name']]=true;}
        }unset($g);
        $out[]=['start'=>$window[0],'end'=>$window[2],'groups'=>$groups];$i+=2;
    }
    return ['editions'=>$out,'conflicting_fixtures'=>array_keys($bad)];
}

function imc_wc_season(string $date,array $seasons,?int $fallback=null): ?int {
    $season=null;
    usort($seasons,fn($a,$b)=>strcmp((string)$a['imc_season_start_date'],(string)$b['imc_season_start_date']));
    foreach($seasons as $row)if(!empty($row['imc_season_start_date'])&&$row['imc_season_start_date']<=$date)$season=(int)$row['imc_season'];
    return $season??$fallback;
}

function imc_wc_reconcile(PDO $db,string $table,?array $seasons=null,bool $dryRun=false): array {
    $target=imc_wc_target($table);if($target===null)return [];
    $world=$target['world'];$report=['version'=>'1.1','world'=>$world,'editions'=>0,'registered_fixtures'=>0,'schedule_updated'=>0,'reports_updated'=>0,'results_updated'=>0,'pending'=>[]];
    $exists=$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN ('IMC_World_Cup_Editions','IMC_World_Cup_Fixtures')");
    if((int)$exists->fetchColumn()!==2)return $report+['status'=>'schema_pending'];
    if($seasons===null){
        $cfg=imc_cfg();$catalog=imc_world_catalog($cfg);$aliases=[$world,substr_replace($world,'-',3,0)];
        foreach($catalog as $row)if(str_replace('-','',(string)$row['imc_id'])===$world)$aliases[]=$row['legacy_id'];
        $core=imc_db($cfg,$cfg['db']['core']);$q=$core->prepare('SELECT imc_season,imc_season_start_date FROM `IMC Game World Season` WHERE game_world_id IN ('.implode(',',array_fill(0,count($aliases),'?')).')');$q->execute($aliases);$seasons=$q->fetchAll(PDO::FETCH_ASSOC);
    }
    $rows=$db->query('SELECT * FROM '.imc_ident($target['schedule'])." WHERE competition_group='NATIONS' OR sm_action IN ('worldcup','interqualifier','worldcupqualifying') ORDER BY match_date,sm_fixture_id")->fetchAll(PDO::FETCH_ASSOC);
    $detected=imc_wc_detect($rows);$report['conflicting_fixtures']=$detected['conflicting_fixtures'];
    $report['editions']=count($detected['editions']);
    if($dryRun)return $report+['status'=>'preview','detected'=>array_map(fn($e)=>['start'=>$e['start'],'end'=>$e['end'],'fixtures'=>48,'groups'=>array_column($e['groups'],'name'),'season'=>imc_wc_season($e['start'],$seasons)],$detected['editions'])];
    $editionWrite=$db->prepare('INSERT INTO IMC_World_Cup_Editions(world_id,edition_start,imc_season,group_end) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE group_end=VALUES(group_end)');
    $fixtureWrite=$db->prepare('INSERT INTO IMC_World_Cup_Fixtures(world_id,sm_fixture_id,edition_start,imc_season,match_date,group_name,competition_stage,competition_round,home_id,away_id,home_name,away_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE edition_start=VALUES(edition_start),imc_season=VALUES(imc_season),match_date=VALUES(match_date),group_name=VALUES(group_name),competition_stage=VALUES(competition_stage),competition_round=VALUES(competition_round),home_id=VALUES(home_id),away_id=VALUES(away_id),home_name=VALUES(home_name),away_name=VALUES(away_name)');
    foreach($detected['editions'] as $edition){
        $season=imc_wc_season($edition['start'],$seasons);if(!$season){$report['pending'][]=['start'=>$edition['start'],'reason'=>'season_missing'];continue;}
        $editionWrite->execute([$world,$edition['start'],$season,$edition['end']]);
        $q=$db->prepare('SELECT imc_season FROM IMC_World_Cup_Editions WHERE world_id=? AND edition_start=?');$q->execute([$world,$edition['start']]);$season=(int)$q->fetchColumn();
        foreach($edition['groups'] as $group)foreach($group['fixtures'] as $fixture){
            $fixtureWrite->execute([$world,$fixture['sm_fixture_id'],$edition['start'],$season,$fixture['match_date'],$group['name'],$group['name'],$fixture['competition_round'],$fixture['home_sm_team_id'],$fixture['away_sm_team_id'],$fixture['home_name'],$fixture['away_name']]);
        }
    }
    // Explicit World Cup schedules are usable individually. The 48-match check is
    // required only when overriding a Qualifier label. A partial reference keeps
    // the supplied origin season; its earliest supplied date is provisional.
    $q=$db->prepare('SELECT * FROM IMC_World_Cup_Fixtures WHERE world_id=?');$q->execute([$world]);$known=[];
    foreach($q->fetchAll(PDO::FETCH_ASSOC) as $f)$known[(string)$f['sm_fixture_id']]=$f;
    $explicit=[];$first=[];$members=[];
    foreach($rows as $row){
        $id=(string)($row['sm_fixture_id']??'');$season=(int)($row['imc_season']??0);$group=imc_wc_group($row);
        if(strtolower(trim((string)($row['sm_action']??'')))!=='worldcup'||imc_wc_knockout($row)||!$group||$season<1||!ctype_digit($id)||(int)$id<=0||empty($row['match_date'])||empty($row['home_sm_team_id'])||empty($row['away_sm_team_id'])||in_array($id,array_map('strval',$detected['conflicting_fixtures']),true))continue;
        $explicit[$id]=$row;$first[$season]=min($first[$season]??$row['match_date'],$row['match_date']);
        $members[$season][$group][(string)$row['home_sm_team_id']]=true;$members[$season][$group][(string)$row['away_sm_team_id']]=true;
    }
    $report['explicit_fixtures']=0;
    foreach($explicit as $id=>$row){
        $group=imc_wc_group($row);$sourceSeason=(int)$row['imc_season'];if(count($members[$sourceSeason][$group])>4)continue;
        $season=imc_wc_selected_edition($row)?$sourceSeason:(isset($known[$id])?(int)$known[$id]['imc_season']:$sourceSeason);$start=$known[$id]['edition_start']??$first[$sourceSeason];
        $q=$db->prepare('SELECT edition_start,imc_season FROM IMC_World_Cup_Editions WHERE world_id=? AND imc_season=? ORDER BY edition_start LIMIT 1');$q->execute([$world,$season]);$edition=$q->fetch(PDO::FETCH_ASSOC);
        if($edition)$start=$edition['edition_start'];
        $fixtureWrite->execute([$world,$id,$start,$season,$row['match_date'],$group,$group,$row['competition_round'],$row['home_sm_team_id'],$row['away_sm_team_id'],$row['home_name'],$row['away_name']]);$report['explicit_fixtures']++;
    }
    $q=$db->prepare('SELECT * FROM IMC_World_Cup_Editions WHERE world_id=? ORDER BY edition_start');$q->execute([$world]);$editions=$q->fetchAll(PDO::FETCH_ASSOC);
    $q=$db->prepare('SELECT * FROM IMC_World_Cup_Fixtures WHERE world_id=?');$q->execute([$world]);$registry=$q->fetchAll(PDO::FETCH_ASSOC);$participants=[];
    foreach($registry as $f)if($f['group_name']!==null){$participants[$f['edition_start']][(string)$f['home_id']]=true;$participants[$f['edition_start']][(string)$f['away_id']]=true;}
    foreach($rows as $row){
        if(strtolower((string)$row['sm_action'])!=='worldcup'||!imc_wc_knockout($row)||empty($row['sm_fixture_id'])||empty($row['match_date']))continue;
        $edition=null;foreach($editions as $e)if($e['group_end']<$row['match_date']&&(!$e['final_date']||$row['match_date']<=$e['final_date']))$edition=$e;
        if(!$edition||!isset($participants[$edition['edition_start']][(string)$row['home_sm_team_id']],$participants[$edition['edition_start']][(string)$row['away_sm_team_id']]))continue;
        $fixtureWrite->execute([$world,$row['sm_fixture_id'],$edition['edition_start'],$edition['imc_season'],$row['match_date'],null,$row['competition_stage'],$row['competition_round'],$row['home_sm_team_id'],$row['away_sm_team_id'],$row['home_name'],$row['away_name']]);
        if(preg_match('/^finale?$/i',trim((string)($row['competition_stage']?:$row['competition_round'])))){$q=$db->prepare('UPDATE IMC_World_Cup_Editions SET final_date=? WHERE world_id=? AND edition_start=?');$q->execute([$row['match_date'],$world,$edition['edition_start']]);}
    }
    $q=$db->prepare('SELECT * FROM IMC_World_Cup_Fixtures WHERE world_id=?');$q->execute([$world]);$registry=$q->fetchAll(PDO::FETCH_ASSOC);$report['registered_fixtures']=count($registry);
    $meta=['competition_key','sm_action','competition_group','imc_season','competition_stage','competition_round'];
    foreach($registry as $f){
        $values=[$world.'|NATIONS|worldcup','worldcup','NATIONS',$f['imc_season'],$f['competition_stage'],$f['competition_round']];
        foreach(['schedule','results','reports'] as $repository){
            $fields=$meta;$new=$values;$home=$repository==='schedule'?'home_sm_team_id':'home_sm_club_id';$away=$repository==='schedule'?'away_sm_team_id':'away_sm_club_id';
            if($repository==='results'){$fields[]='competition_group_name';$new[]=$f['group_name'];}
            $set=implode(',',array_map(fn($field)=>imc_ident($field).'=?',$fields));$same=implode(' AND ',array_map(fn($field)=>imc_ident($field).' <=> ?',$fields));
            $q=$db->prepare('UPDATE '.imc_ident($target[$repository]).' SET '.$set.' WHERE sm_fixture_id=? AND (match_date IS NULL OR match_date=?) AND ('.$home.' IS NULL OR '.$home.'=0 OR '.$home.'=?) AND ('.$away.' IS NULL OR '.$away.'=0 OR '.$away.'=?) AND NOT('.$same.')'." AND COALESCE(competition_key,'') NOT REGEXP '^IMC[0-9]{3}[|]S[0-9]+[|]'");
            $q->execute(array_merge($new,[$f['sm_fixture_id'],$f['match_date'],$f['home_id'],$f['away_id']],$new));$report[$repository==='schedule'?'schedule_updated':($repository==='results'?'results_updated':'reports_updated')]+=$q->rowCount();
        }
    }
    // Read the registry first, then update only the report table: its triggers lock the registry row.
    $q=$db->prepare('SELECT m.fingerprint,m.sm_fixture_id,m.match_date,m.home_sm_club_id,m.away_sm_club_id FROM '.imc_ident($target['reports']).' m JOIN IMC_World_Cup_Fixtures f ON f.world_id=? AND (f.sm_fixture_id=m.sm_fixture_id OR ((m.sm_fixture_id IS NULL OR m.sm_fixture_id=0) AND (m.match_date IS NULL OR m.match_date=f.match_date) AND m.home_sm_club_id=f.home_id AND m.away_sm_club_id=f.away_id)) WHERE f.group_name IS NOT NULL AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL AND (m.match_date IS NULL OR m.match_date=f.match_date) AND (m.home_sm_club_id IS NULL OR m.home_sm_club_id=0 OR m.home_sm_club_id=f.home_id) AND (m.away_sm_club_id IS NULL OR m.away_sm_club_id=0 OR m.away_sm_club_id=f.away_id) AND NOT EXISTS (SELECT 1 FROM '.imc_ident($target['results']).' r WHERE r.sm_fixture_id=f.sm_fixture_id) GROUP BY m.fingerprint,m.sm_fixture_id,m.match_date,m.home_sm_club_id,m.away_sm_club_id HAVING COUNT(DISTINCT f.sm_fixture_id)=1');
    $q->execute([$world]);$pending=$q->fetchAll(PDO::FETCH_ASSOC);$report['reports_replayed']=0;
    foreach($pending as $row){$u=$db->prepare('UPDATE '.imc_ident($target['reports']).' SET sm_action=sm_action WHERE fingerprint <=> ? AND sm_fixture_id <=> ? AND match_date <=> ? AND home_sm_club_id <=> ? AND away_sm_club_id <=> ?');$u->execute(array_values($row));$report['reports_replayed']++;}
    $report['status']=$registry?'ready':'pending_schedules';return $report;
}

/** A world lock covers the write, classification, backfill and commit on both ingress routes. */
function imc_wc_import(PDO $db,string $table,bool $atomic,callable $write,?array $seasons=null): array {
    $target=imc_wc_target($table);if($target===null)return ['written'=>$write(),'normalization'=>null];
    $q=$db->prepare('SELECT GET_LOCK(?,15)');$lock='imc_worldcup_'.$target['world'];$q->execute([$lock]);if((int)$q->fetchColumn()!==1)throw new RuntimeException('worldcup_busy_retry');
    $own=!$db->inTransaction();
    try{
        if($own)$db->beginTransaction();$written=$write();
        $normalization=str_ends_with(imc_physical_table($table),'_Schedule')?imc_wc_reconcile($db,$table,$seasons):imc_wc_sync_results($db,$target);
        if($own)$db->commit();
        return ['written'=>$written,'normalization'=>['worldcup'=>$normalization]];
    }catch(Throwable $e){if($own&&$db->inTransaction())$db->rollBack();throw $e;}
    finally{$q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute([$lock]);}
}

function imc_wc_sync_results(PDO $db,array $target): array {
    $exists=$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='IMC_World_Cup_Fixtures'");
    if(!(int)$exists->fetchColumn())return ['status'=>'schema_pending'];
    $q=$db->prepare('UPDATE '.imc_ident($target['results'])." r JOIN IMC_World_Cup_Fixtures f ON f.world_id=? AND f.sm_fixture_id=r.sm_fixture_id SET r.competition_key=CONCAT(f.world_id,'|NATIONS|worldcup'),r.sm_action='worldcup',r.competition_group='NATIONS',r.imc_season=f.imc_season,r.competition_stage=f.competition_stage,r.competition_round=f.competition_round,r.competition_group_name=f.group_name WHERE (r.match_date IS NULL OR r.match_date=f.match_date) AND (r.home_sm_club_id IS NULL OR r.home_sm_club_id=f.home_id) AND (r.away_sm_club_id IS NULL OR r.away_sm_club_id=f.away_id) AND NOT(r.competition_key <=> CONCAT(f.world_id,'|NATIONS|worldcup') AND r.sm_action <=> 'worldcup' AND r.competition_group <=> 'NATIONS' AND r.imc_season <=> f.imc_season AND r.competition_stage <=> f.competition_stage AND r.competition_round <=> f.competition_round AND r.competition_group_name <=> f.group_name)");
    $q->execute([$target['world']]);return ['status'=>'ready','results_updated'=>$q->rowCount()];
}

function imc_wc_action(PDO $db,string $table,array $body,array $cfg,array $base): never {
    $token=(string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN']??'');
    if($token===''||!hash_equals((string)$cfg['token'],$token))imc_out(['ok'=>false,'error'=>'unauthorized'],401);
    $target=imc_wc_target($table);
    if(!$target||imc_physical_table($table)!==$target['schedule'])throw new InvalidArgumentException('worldcup_schedule_required');
    if(($body['dry_run']??false)===true)$result=imc_wc_reconcile($db,$table,null,true);
    else $result=imc_wc_import($db,$table,true,fn()=>0)['normalization']['worldcup'];
    $changed=(int)($result['schedule_updated']??0)+(int)($result['results_updated']??0)+(int)($result['reports_updated']??0)+(int)($result['reports_replayed']??0);
    imc_out($base+['worldcup'=>$result,'updated_rows'=>$changed]);
}
