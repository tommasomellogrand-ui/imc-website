<?php
/** Fixed GW001 Site reads; versioned CORE dossiers and live CORE seasons. */
declare(strict_types=1);
require_once dirname(__DIR__, 2).'/imc-universal-gateway/minisite.php';
require_once __DIR__.'/seasons.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function gw001_snapshot(): array {
    $manifest=json_decode(file_get_contents(__DIR__.'/data/core-manifest.json'),true,32,JSON_THROW_ON_ERROR);
    if (($manifest['game_world_id']??'')!=='GW001' || !preg_match('/^core\.[a-f0-9]{16}\.json$/',$manifest['file']??'')) throw new RuntimeException('snapshot_invalid');
    $bytes=file_get_contents(__DIR__.'/data/'.$manifest['file']);
    if (!hash_equals($manifest['sha256'],hash('sha256',$bytes))) throw new RuntimeException('snapshot_integrity');
    $s=json_decode($bytes,true,64,JSON_THROW_ON_ERROR);
    if (($s['game_world_id']??'')!=='GW001' || ($s['schema_version']??0)!==1) throw new RuntimeException('snapshot_scope');
    foreach ($manifest['counts'] as $name=>$count) if (!isset($s[$name]) || count($s[$name])!==$count) throw new RuntimeException('snapshot_incomplete');
    return $s;
}
function gw001_club_logo(mixed $clubGwId): ?string {
    static $logos=null;
    if ($logos===null) {
        $logos=[];
        try {
            $pdo=imc_minisite_db(imc_minisite_config());
            $rows=imc_minisite_rows($pdo,"SELECT m.`SM Club ID` AS club_gw_id,c.image_url FROM `IMC Game World Club Mapping` m JOIN `IMC Club Codex Global` c ON c.id=m.`Club ID` WHERE m.`Game World`='GW001'");
            foreach ($rows as $row) {
                $url=trim((string)($row['image_url']??''));
                if ($url!=='') $logos[(string)$row['club_gw_id']]=preg_replace('/^http:/i','https:',$url);
            }
        } catch (Throwable $e) {
            $logos=[];
        }
    }
    return $logos[(string)$clubGwId]??null;
}
function gw001_identity(array $s, mixed $id, bool $national): ?array {
    if ($national) {
        foreach ($s['nations_mapping'] as $n) if ((string)$n['SM National Team ID']===(string)$id) return ['kind'=>'nation','game_world_id'=>'GW001','national_team_id'=>(string)$n['National Team ID'],'sm_national_team_id'=>(string)$id,'name'=>$n['National Team Name']];
    } else {
        foreach ($s['teams'] as $t) if ((string)$t['sm_world_club_id']===(string)$id) return ['kind'=>'club',...$t,'name'=>$t['team_name'],'image_url'=>gw001_club_logo($t['sm_club_id'])];
    }
    return null;
}
function gw001_enrich(array $r, array $s): array {
    if (($r['game_world_id']??'')!=='GW001' || !str_starts_with($r['competition_key']??'','GW001|')) throw new RuntimeException('source_scope');
    $national=($r['competition_group']??'')==='NATIONS';
    foreach (['home','away'] as $side) {
        $worldId=$r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??null;
        $identity=gw001_identity($s,$worldId,$national);
        // International opponents outside IMC membership retain the authoritative
        // fixture's world-instance ID and name, without an invented CORE team ID.
        if (!$identity && !$national && !empty($worldId)) $identity=['kind'=>'external_club','game_world_id'=>'GW001','team_id'=>null,'sm_club_id'=>null,'sm_world_club_id'=>(string)$worldId,'name'=>$r[$side.'_name'],'image_url'=>gw001_club_logo($worldId)];
        $r[$side.'_identity']=$identity;
        $r[$side.'_manager_id']=null;
        foreach ($s['managers'] as $m) if ((string)$m['sm_manager_id']===(string)($r[$side.'_sm_manager_id']??'')) $r[$side.'_manager_id']=$m['manager_id'];
        $r[$side.'_historical_assignments']=array_values(array_filter($s['assignments'],static function($a) use($identity,$r,$national) {
            if (!$identity || $identity['kind']==='external_club' || $a['game_world_id']!=='GW001' || !$r['match_date']) return false;
            $same=$national ? $a['assignment_type']==='national_team' && (string)$a['national_team_id']===$identity['national_team_id'] : $a['assignment_type']==='club' && (string)$a['team_id']===$identity['team_id'];
            return $same && $a['start_date']<=$r['match_date'] && (!$a['end_date'] || $a['end_date']>=$r['match_date']);
        }));
    }
    $r['match_report_available']=!$national && !empty($r['match_report_available']);
    return $r;
}
try {
    if (($_SERVER['REQUEST_METHOD']??'')!=='POST') imc_minisite_out(['ok'=>false,'error'=>'method_not_allowed'],405);
    $body=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR);
    if (!is_array($body) || ($body['game_world_id']??'')!=='GW001' || !in_array($body['resource']??'', ['results','schedule','match_report','seasons','competition_activity'],true)) throw new InvalidArgumentException('unsupported_scope');
    if ($body['resource']==='seasons') {
        $pdo=imc_minisite_db(imc_minisite_config());
        $rows=imc_minisite_rows($pdo,'SELECT game_world_id,imc_season,soccer_manager_season,imc_season_start_date,imc_season_end_date FROM `IMC Game World Season` WHERE game_world_id=? ORDER BY imc_season', ['GW001']);
        imc_minisite_out(gw001_season_state($rows,new DateTimeImmutable('now',new DateTimeZone('Europe/Rome'))));
    }
    $s=gw001_snapshot();
    $config=imc_minisite_config();
    $database=$config['db']['custom']??'';
    if (!$database) throw new RuntimeException('site_database_not_configured');
    $pdo=new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$config['db']['host'],$config['db']['port'],$database),$config['db']['user'],$config['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    $resource=$body['resource'];
    $now=new DateTimeImmutable('now',new DateTimeZone('Europe/Rome'));
    $today=$now->format('Y-m-d');
    if ($resource==='competition_activity') {
        // Existence across the whole archive, not only the calendar's future window.
        $fields='game_world_id,competition_key,competition_group,sm_action,sm_division,sm_country';
        $rows=imc_minisite_rows($pdo,"SELECT DISTINCT 'results' AS source,$fields,competition_stage,competition_group_name,competition_round FROM `IMC Site Results` WHERE game_world_id='GW001' UNION ALL SELECT DISTINCT 'schedule' AS source,$fields,competition_stage,NULL AS competition_group_name,competition_round FROM `IMC Site Schedule` WHERE game_world_id='GW001'");
        imc_minisite_out(['ok'=>true,'game_world_id'=>'GW001','resource'=>$resource,'snapshot_version'=>$s['version'],'rows'=>$rows]);
    }
    if ($resource==='match_report') {
        $id=imc_minisite_positive_id($body['sm_fixture_id']??null,'invalid_fixture');
        $pdo->beginTransaction();
        $results=imc_minisite_rows($pdo,"SELECT * FROM `IMC Site Results` WHERE game_world_id='GW001' AND sm_fixture_id=?",[$id]);
        if (count($results)!==1) imc_minisite_out(['ok'=>false,'error'=>'fixture_not_found'],404);
        $r=$results[0];
        $reports=$r['competition_group']==='NATIONS'?[]:imc_minisite_rows($pdo,"SELECT * FROM `IMC Site Match Report` WHERE game_world_id='GW001' AND sm_fixture_id=? AND competition_group IN ('DOMESTIC','INTERNATIONAL')",[$id]);
        if(count($reports)>1) throw new RuntimeException('ambiguous_report');
        $report=$reports[0]??null; $quality=[];
        if ($report) {
            foreach (['competition_key','match_date','home_sm_club_id','away_sm_club_id','home_score','away_score','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score'] as $key) {
                if ($r[$key]!==$report[$key]) imc_minisite_out(['ok'=>false,'error'=>'report_source_conflict'],409);
            }
            foreach (['home','away'] as $side) if ($r[$side.'_sm_manager_id'] && $report[$side.'_sm_manager_id'] && $r[$side.'_sm_manager_id']!==$report[$side.'_sm_manager_id']) $quality[]=$side.'_manager_source_conflict';
            foreach (['players','team_stats','events','tactics','commentary'] as $field) {
                try { $report[$field]=json_decode($report[$field.'_json']??'null',true,64,JSON_THROW_ON_ERROR); }
                catch (JsonException $e) { $report[$field]=null; }
                if (!is_array($report[$field]) || !$report[$field]) $quality[]=$field.'_incomplete';
                unset($report[$field.'_json']);
            }
            $report=gw001_enrich($report,$s);
        }
        $pdo->commit();
        $r['match_report_available']=$report!==null;
        imc_minisite_out(['ok'=>true,'version'=>1,'game_world_id'=>'GW001','resource'=>$resource,'read_at'=>$now->format(DateTimeInterface::ATOM),'snapshot_version'=>$s['version'],'fixture'=>gw001_enrich($r,$s),'report'=>$report,'quality'=>$quality,'report_status'=>$report?($quality?'incomplete':'available'):($r['competition_group']==='NATIONS'?'national_not_loaded':'not_available')]);
    }
    $schedule=$resource==='schedule'; $table=$schedule?'IMC Site Schedule':'IMC Site Results'; $id=$schedule?'site_schedule_id':'site_result_id';
    $pdo->beginTransaction();
    $meta=imc_minisite_rows($pdo,"SELECT COUNT(*) source_total,MAX(synced_at) source_updated_at,COALESCE(SUM(match_date < ?),0) past_count,COALESCE(SUM(match_date IS NULL),0) undated_count FROM `$table` WHERE game_world_id='GW001'",[$today])[0];
    $reportMeta=imc_minisite_rows($pdo,"SELECT COUNT(*) n,MAX(synced_at) updated_at FROM `IMC Site Match Report` WHERE game_world_id='GW001'")[0];
    $total=(int)$meta['source_total']-($schedule?(int)$meta['past_count']+(int)$meta['undated_count']:0);
    $revision=hash('sha256',json_encode([$resource,$today,$meta,$reportMeta,$s['version']]));
    if (isset($body['revision']) && $body['revision']!==$revision) imc_minisite_out(['ok'=>false,'error'=>'source_changed'],409);
    [$limit,$offset]=imc_minisite_page($body,1000,1000);
    $fields="r.*,r.`$id` AS site_id";
    $fields.=$schedule?',0 AS match_report_available':",EXISTS(SELECT 1 FROM `IMC Site Match Report` m WHERE m.game_world_id='GW001' AND m.sm_fixture_id=r.sm_fixture_id AND m.competition_key=r.competition_key AND m.home_sm_club_id=r.home_sm_club_id AND m.away_sm_club_id=r.away_sm_club_id AND m.match_date=r.match_date AND m.home_score=r.home_score AND m.away_score=r.away_score AND m.competition_group IN ('DOMESTIC','INTERNATIONAL')) AS match_report_available";
    $where="r.game_world_id='GW001'"; $params=[];
    if($schedule){$where.=' AND r.match_date >= ?';$params[]=$today;}
    $order=$schedule?"r.match_date ASC,r.match_time ASC,r.`$id` ASC":"r.match_date DESC,r.`$id` DESC";
    $rows=imc_minisite_rows($pdo,"SELECT $fields FROM `$table` r WHERE $where ORDER BY $order LIMIT $limit OFFSET $offset",$params);
    $rows=array_map(static fn($r)=>gw001_enrich($r,$s),$rows);
    $pdo->commit();
    imc_minisite_out(['ok'=>true,'version'=>1,'source'=>$table,'game_world_id'=>'GW001','resource'=>$resource,'timezone'=>'Europe/Rome','today'=>$today,'read_at'=>$now->format(DateTimeInterface::ATOM),'snapshot_version'=>$s['version'],'source_updated_at'=>$meta['source_updated_at'],'source_total'=>(int)$meta['source_total'],'past_excluded'=>$schedule?(int)$meta['past_count']:0,'undated_excluded'=>$schedule?(int)$meta['undated_count']:0,'total'=>$total,'revision'=>$revision,'offset'=>$offset,'rows'=>$rows,'next_offset'=>$offset+count($rows)<$total?$offset+count($rows):null]);
} catch (InvalidArgumentException|JsonException $e) {
    imc_minisite_out(['ok'=>false,'error'=>'invalid_request'],422);
} catch (Throwable $e) {
    imc_minisite_out(['ok'=>false,'error'=>'read_unavailable'],503);
}
