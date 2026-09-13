<?php
/** IMC-ENG-009-06. Public, fixed-scope, read-only Site projection. */
declare(strict_types=1);
require_once dirname(__DIR__, 2).'/imc-universal-gateway/minisite.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') imc_minisite_out(['ok'=>false,'error'=>'method_not_allowed'],405);
    $body=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR);
    if (!is_array($body)) throw new InvalidArgumentException('invalid_payload');
    $gw=imc_minisite_gw($body);
    $resource=$body['resource'] ?? '';
    if (!in_array($gw,['GW001','GW007'],true) || !in_array($resource,['results','schedule'],true)) throw new InvalidArgumentException('unsupported_scope');
    $config=imc_minisite_config();
    $family=$gw==='GW001'?'custom':'gold';
    $database=$config['db'][$family] ?? '';
    if (!$database) throw new RuntimeException('site_database_not_configured');
    $pdo=new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$config['db']['host'],$config['db']['port'],$database),$config['db']['user'],$config['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    $now=new DateTimeImmutable('now',new DateTimeZone('Europe/Rome'));
    $today=$now->format('Y-m-d');
    $schedule=$resource==='schedule';
    $table=$schedule?'IMC Site Schedule':'IMC Site Results';
    $id=$schedule?'site_schedule_id':'site_result_id';
    $where='game_world_id=?';
    // Four Kingdoms is a fixed approved context, never expanded from source rows.
    if ($gw==='GW007') $where.=" AND sm_country IN ('ENG','ESP','GER','ITA')";
    $pdo->beginTransaction();
    $meta=imc_minisite_rows($pdo,"SELECT COUNT(*) source_total, MAX(synced_at) source_updated_at, COALESCE(SUM(match_date < ?),0) past_count, COALESCE(SUM(match_date IS NULL),0) undated_count FROM `$table` WHERE $where",[$today,$gw])[0];
    $total=(int)$meta['source_total']-($schedule?(int)$meta['past_count']+(int)$meta['undated_count']:0);
    $revision=hash('sha256',json_encode([$gw,$resource,$today,$meta]));
    if (isset($body['revision']) && $body['revision']!==$revision) imc_minisite_out(['ok'=>false,'error'=>'source_changed'],409);
    [$limit,$offset]=imc_minisite_page($body,1000,1000);
    $fields="`$id` AS site_id, game_world_id, competition_key, sm_fixture_id, match_date, home_name, away_name, sm_action, sm_country, sm_division, competition_group, competition_stage, competition_round, synced_at";
    $fields.=$schedule?', match_time':', home_score, away_score, result_status, penalty_home_score, penalty_away_score, aggregate_home_score, aggregate_away_score';
    $params=[$gw];
    if ($schedule) { $where.=' AND match_date >= ?'; $params[]=$today; }
    $order=$schedule?"match_date ASC, match_time ASC, `$id` ASC":"match_date DESC, `$id` DESC";
    $rows=imc_minisite_rows($pdo,"SELECT $fields FROM `$table` WHERE $where ORDER BY $order LIMIT $limit OFFSET $offset",$params);
    $pdo->commit();
    imc_minisite_out(['ok'=>true,'version'=>1,'source'=>$table,'game_world_id'=>$gw,'resource'=>$resource,'timezone'=>'Europe/Rome','today'=>$today,'read_at'=>$now->format(DateTimeInterface::ATOM),'source_updated_at'=>$meta['source_updated_at'],'source_total'=>(int)$meta['source_total'],'past_excluded'=>$schedule?(int)$meta['past_count']:0,'undated_excluded'=>$schedule?(int)$meta['undated_count']:0,'total'=>$total,'revision'=>$revision,'offset'=>$offset,'rows'=>$rows,'next_offset'=>$offset+count($rows)<$total?$offset+count($rows):null]);
} catch (InvalidArgumentException|JsonException $e) {
    imc_minisite_out(['ok'=>false,'error'=>'invalid_request'],422);
} catch (Throwable $e) {
    // Never expose database credentials, SQL or server paths.
    imc_minisite_out(['ok'=>false,'error'=>'read_unavailable'],503);
}
