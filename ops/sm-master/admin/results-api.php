<?php
declare(strict_types=1);

require __DIR__ . '/core.php';

const IMC_RESULTS_TOKEN = 'IMC_RESULTS_GOLD_2026_V1_9f6d2c4a7b8e1d3f';
const IMC_RESULTS_WORLDS = ['GW002', 'GW003', 'GW007', 'GW008'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && preg_match('~^https://([a-z0-9-]+\\.)*soccermanager\\.com$~i', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-IMC-Results-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function results_reply(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function results_fail(string $message, int $status = 422, array $extra = []): never {
    results_reply(array_merge(['ok'=>false, 'error'=>$message], $extra), $status);
}
function results_text(mixed $v, int $max = 255, bool $nullable = true): ?string {
    if ($v === null && $nullable) return null;
    $s = trim((string)$v);
    if ($s === '') return $nullable ? null : results_fail('Required text is empty.');
    if (mb_strlen($s) > $max) results_fail('Text value exceeds maximum length.');
    return $s;
}
function results_uint(mixed $v, bool $nullable = true): ?int {
    if ($v === null && $nullable) return null;
    if (!is_int($v) && !(is_string($v) && ctype_digit($v))) results_fail('Unsigned integer expected.');
    $n = (int)$v;
    if ($n < 1) results_fail('Unsigned integer out of range.');
    return $n;
}
function results_world(mixed $v): string {
    $gw = strtoupper(trim((string)$v));
    if (!in_array($gw, IMC_RESULTS_WORLDS, true)) results_fail('Game World not enabled for GOLD RESULTS.');
    return $gw;
}
function results_body(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') results_fail('POST required.', 405);
    $token = trim((string)($_SERVER['HTTP_X_IMC_RESULTS_TOKEN'] ?? ''));
    if ($token === '' || !hash_equals(IMC_RESULTS_TOKEN, $token)) results_fail('Unauthorized.', 401);
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || $raw === '' || strlen($raw) > 524288) results_fail('Invalid payload size.', 413);
    try { $body = json_decode($raw, true, 64, JSON_THROW_ON_ERROR); }
    catch (Throwable) { results_fail('Invalid JSON.'); }
    if (!is_array($body)) results_fail('JSON object required.');
    return $body;
}
function results_sha(array|string $value): string {
    $text = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $value;
    return hash('sha256', (string)$text);
}
function results_db(): mysqli {
    $db = smm_storage_db('gold');
    $name = (string)$db->query('SELECT DATABASE() db')->fetch_assoc()['db'];
    if ($name !== 'Sql1956795_2') results_fail('GOLD database target mismatch.', 500);
    return $db;
}
function results_world_context(mysqli $db, string $gw, int $imcSeason): array {
    $w = $db->prepare('SELECT game_world_id,sm_game_world_id,game_world_type,current_soccer_manager_season FROM gw_game_worlds WHERE game_world_id=? LIMIT 2');
    $w->bind_param('s', $gw); $w->execute(); $worldRows = $w->get_result()->fetch_all(MYSQLI_ASSOC); $w->close();
    if (count($worldRows) !== 1) results_fail('Canonical Game World row is missing or ambiguous.');
    $s = $db->prepare('SELECT gw_season_row_id,imc_season,soccer_manager_season,sm_season_id,sm_game_world_id FROM gw_seasons WHERE game_world_id=? AND imc_season=? LIMIT 2');
    $s->bind_param('si', $gw, $imcSeason); $s->execute(); $seasonRows = $s->get_result()->fetch_all(MYSQLI_ASSOC); $s->close();
    if (count($seasonRows) !== 1) results_fail('Canonical GOLD season row is missing or ambiguous.');
    $world = $worldRows[0]; $season = $seasonRows[0];
    $worldSm = (int)$world['sm_game_world_id'];
    $seasonSmWorld = $season['sm_game_world_id'] === null ? null : (int)$season['sm_game_world_id'];
    if ($worldSm < 1 || ($seasonSmWorld !== null && $seasonSmWorld !== $worldSm)) results_fail('sm_game_world_id validation failed.');
    return [
        'gameWorld'=>$gw,
        'imcSeason'=>(int)$season['imc_season'],
        'gwSeasonRowId'=>(int)$season['gw_season_row_id'],
        'smGameWorldId'=>$worldSm,
        'soccerManagerSeason'=>(int)$season['soccer_manager_season'],
        'smSeasonId'=>$season['sm_season_id'] === null ? null : (int)$season['sm_season_id'],
        'gameWorldType'=>(string)$world['game_world_type'],
    ];
}
function results_current_season(mysqli $db, string $gw): int {
    $q = $db->prepare('SELECT imc_season FROM gw_seasons WHERE game_world_id=? AND imc_season IS NOT NULL ORDER BY imc_season DESC LIMIT 2');
    $q->bind_param('s', $gw); $q->execute(); $rows=$q->get_result()->fetch_all(MYSQLI_ASSOC); $q->close();
    if (!$rows) results_fail('No IMC season available for Game World.');
    return (int)$rows[0]['imc_season'];
}
function results_competitions(mysqli $db, string $gw): array {
    $q=$db->prepare('SELECT gw_competition_row_id,competition_name,competition_type,country_code,division_value,local_competition_id FROM gw_competitions WHERE game_world_id=? ORDER BY gw_competition_row_id');
    $q->bind_param('s',$gw);$q->execute();$rows=$q->get_result()->fetch_all(MYSQLI_ASSOC);$q->close();
    return array_map(static fn($r)=>[
        'competition_key'=>(string)$r['gw_competition_row_id'],
        'sm_action'=>$r['competition_type'],
        'sm_country'=>$r['country_code'],
        'IMC_league_divisions'=>$r['division_value'],
        'sm_division'=>$r['division_value'],
        'sm_compid'=>$r['local_competition_id'],
        'sm_competition_name'=>$r['competition_name'],
        'sm_round_label'=>null,
    ],$rows);
}
function results_setup(mysqli $db, string $gw): never {
    $season = results_current_season($db, $gw);
    $ctx = results_world_context($db, $gw, $season);
    $competitions = results_competitions($db, $gw);
    results_reply(['ok'=>true] + $ctx + ['competitions'=>$competitions]);
}
function results_page_type(mysqli $db): int {
    $q=$db->query("SELECT page_type_id FROM gw_source_page_types WHERE LOWER(CONCAT(page_code,' ',page_name,' ',function_description)) LIKE '%result%' LIMIT 2");
    $rows=$q->fetch_all(MYSQLI_ASSOC);
    if (count($rows)!==1) results_fail('RESULTS page type is missing or ambiguous in GOLD catalog.');
    return (int)$rows[0]['page_type_id'];
}
function results_validate_envelope(mysqli $db, array $b): array {
    $gw=results_world($b['gameWorld']??null);$imc=results_uint($b['seasonNumber']??null,false);
    $ctx=results_world_context($db,$gw,$imc);
    foreach ([['smGameWorldId','smGameWorldId'],['soccerManagerSeason','soccerManagerSeason']] as [$input,$key]) {
        if (results_uint($b[$input]??null,false)!==$ctx[$key]) results_fail($input.' mismatch.');
    }
    $incomingSmSeason=$b['smSeasonId']??null;
    if ($incomingSmSeason!==null) $incomingSmSeason=results_uint($incomingSmSeason,false);
    if ($incomingSmSeason!==$ctx['smSeasonId']) results_fail('smSeasonId mismatch or unproven value.');
    results_page_type($db);
    return $ctx;
}
function results_item(mysqli $db,array $r,int $i,string $gw,array $ctx): array {
    $allowed=['fixtureId','sm_action','sm_division','sm_country','sm_compid','sm_round_label','competition_key','group','group_name','group_label','homeTeam','awayTeam','homeTeamId','awayTeamId','homeEntityType','awayEntityType','homeManagerSmId','awayManagerSmId','homeManagerStatus','awayManagerStatus','homeScore','awayScore','decidedOnPenalties','homePenalties','awayPenalties','penaltyWinnerTeam','penaltyText','homeAggregateScore','awayAggregateScore','qualifiedTeam','qualificationMethod','qualificationText','raw'];
    if ($u=array_diff(array_keys($r),$allowed)) results_fail("items[$i] unknown field: ".reset($u));
    $fixture=results_uint($r['fixtureId']??null,false);$competition=results_uint($r['competition_key']??null,false);
    $cq=$db->prepare('SELECT gw_competition_row_id FROM gw_competitions WHERE game_world_id=? AND gw_competition_row_id=? LIMIT 1');
    $cq->bind_param('si',$gw,$competition);$cq->execute();$ok=(bool)$cq->get_result()->fetch_assoc();$cq->close();if(!$ok)results_fail("items[$i] competition bridge unresolved.");
    $homeType=results_text($r['homeEntityType']??null,16,false);$awayType=results_text($r['awayEntityType']??null,16,false);
    if(!in_array($homeType,['club','national'],true)||!in_array($awayType,['club','national'],true))results_fail("items[$i] entity type invalid.");
    $resolveClub=static function(mysqli $db,string $gw,mixed $id,string $type):?int{
        if($type!=='club')return null;$n=results_uint($id);if($n===null)return null;
        $q=$db->prepare('SELECT world_club_id FROM gw_world_clubs WHERE game_world_id=? AND world_club_id=? LIMIT 1');$q->bind_param('si',$gw,$n);$q->execute();$found=$q->get_result()->fetch_assoc();$q->close();return $found?$n:null;
    };
    return ['fixture_id'=>$fixture,'competition_id'=>$competition,'home_world_club_id'=>$resolveClub($db,$gw,$r['homeTeamId']??null,$homeType),'away_world_club_id'=>$resolveClub($db,$gw,$r['awayTeamId']??null,$awayType),'home_entity_type'=>$homeType,'away_entity_type'=>$awayType,'home_name'=>results_text($r['homeTeam']??null,255),'away_name'=>results_text($r['awayTeam']??null,255),'round_label'=>results_text($r['sm_round_label']??null,255),'home_score'=>isset($r['homeScore'])&&$r['homeScore']!==null?(int)$r['homeScore']:null,'away_score'=>isset($r['awayScore'])&&$r['awayScore']!==null?(int)$r['awayScore']:null,'penalty_home'=>isset($r['homePenalties'])&&$r['homePenalties']!==null?(int)$r['homePenalties']:null,'penalty_away'=>isset($r['awayPenalties'])&&$r['awayPenalties']!==null?(int)$r['awayPenalties']:null,'aggregate_home'=>isset($r['homeAggregateScore'])&&$r['homeAggregateScore']!==null?(int)$r['homeAggregateScore']:null,'aggregate_away'=>isset($r['awayAggregateScore'])&&$r['awayAggregateScore']!==null?(int)$r['awayAggregateScore']:null,'raw'=>$r];
}
function results_capture(mysqli $db,array $b,string $gw,array $items): int {
    $pageType=results_page_type($db);$identity=['gw'=>$gw,'season'=>$b['seasonNumber'],'date'=>$b['matchDate']??null,'url'=>$b['sourceUrl']??null,'page'=>$b['sourceContext']['sectionPage']??null,'items'=>array_column($items,'fixture_id')];
    $finger=results_sha($identity);$fileSha=results_sha(['type'=>'RESULTS','identity'=>$identity]);$json=json_encode(['source'=>'RESULTS_IMPORTER','identity'=>$identity,'sourceContext'=>$b['sourceContext']??null],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $name='results_'.$gw.'_'.($b['matchDate']??'unknown').'_'.substr($finger,0,12).'.json';$status='complete';$empty='';$title=results_text($b['sourceTitle']??null,255);$version=results_text($b['sourceContext']['version']??null,64);$report='RESULTS';$url=results_text($b['sourceUrl']??null,4000);
    $q=$db->prepare('INSERT INTO gw_source_captures(capture_json,capture_status,created_at,full_html,game_world_id,page_title,page_type_id,parser_version,report_type,source_file_name,source_file_sha256,source_identity_fingerprint,source_url) VALUES(?,?,NOW(6),?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE capture_id=LAST_INSERT_ID(capture_id),page_title=VALUES(page_title),parser_version=VALUES(parser_version),source_url=VALUES(source_url)');
    $q->bind_param('sssssissssss',$json,$status,$empty,$gw,$title,$pageType,$version,$report,$name,$fileSha,$finger,$url);$q->execute();$id=(int)$db->insert_id;$q->close();return $id;
}
function results_store(mysqli $db,array $b): never {
    $ctx=results_validate_envelope($db,$b);$gw=$ctx['gameWorld'];$rows=$b['items']??null;if(!is_array($rows)||!array_is_list($rows)||!$rows||count($rows)>500)results_fail('items must contain 1..500 records.');
    $items=[];$seen=[];foreach($rows as $i=>$r){if(!is_array($r))results_fail("items[$i] object required.");$v=results_item($db,$r,$i,$gw,$ctx);if(isset($seen[$v['fixture_id']]))results_fail("items[$i] duplicated fixture.");$seen[$v['fixture_id']]=1;$items[]=$v;}
    $date=results_text($b['matchDate']??null,10,false);$d=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$d||$d->format('Y-m-d')!==$date)results_fail('matchDate invalid.');
    $db->begin_transaction();$inserted=0;$updated=0;$unresolvedClubs=0;
    try{$capture=results_capture($db,$b,$gw,$items);
        $payload=json_encode($b,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);$ph=hash('sha256',$payload);$pf=hash('sha256',$gw.'|'.$capture.'|RESULTS_BATCH');$ptype='RESULTS_BATCH';$pkey=$gw.'|'.$date;
        $pq=$db->prepare('INSERT INTO gw_source_payloads(capture_id,created_at,payload_fingerprint,payload_hash,payload_json,payload_key,payload_text,payload_type) VALUES(?,NOW(6),?,?,?,?,?,?) ON DUPLICATE KEY UPDATE payload_json=VALUES(payload_json),payload_hash=VALUES(payload_hash)');$pq->bind_param('issssss',$capture,$pf,$ph,$payload,$pkey,$payload,$ptype);$pq->execute();$pq->close();
        foreach($items as $v){$fixture=$v['fixture_id'];$home=$v['home_world_club_id'];$away=$v['away_world_club_id'];if($v['home_entity_type']==='club'&&$home===null)$unresolvedClubs++;if($v['away_entity_type']==='club'&&$away===null)$unresolvedClubs++;
            $fq=$db->prepare("INSERT INTO gw_fixtures(away_name,away_world_club_id,capture_id,competition_id,created_at,date,fixture_id,game_world_id,gw_season_row_id,home_name,home_world_club_id,imc_season,round_label,sm_game_world_id,sm_season_id,soccer_manager_season,status) VALUES(?,?,?,?,NOW(6),?,?,?,?,?,?,?,?,?,?,?,'played') ON DUPLICATE KEY UPDATE fixture_row_id=LAST_INSERT_ID(fixture_row_id),away_name=VALUES(away_name),away_world_club_id=VALUES(away_world_club_id),capture_id=VALUES(capture_id),competition_id=VALUES(competition_id),date=VALUES(date),gw_season_row_id=VALUES(gw_season_row_id),home_name=VALUES(home_name),home_world_club_id=VALUES(home_world_club_id),imc_season=VALUES(imc_season),round_label=VALUES(round_label),sm_game_world_id=VALUES(sm_game_world_id),sm_season_id=VALUES(sm_season_id),soccer_manager_season=VALUES(soccer_manager_season),status='played'");
            $fq->bind_param('siiisisisiisiii',$v['away_name'],$away,$capture,$v['competition_id'],$date,$fixture,$gw,$ctx['gwSeasonRowId'],$v['home_name'],$home,$ctx['imcSeason'],$v['round_label'],$ctx['smGameWorldId'],$ctx['smSeasonId'],$ctx['soccerManagerSeason']);$fq->execute();$fq->affected_rows===1?$inserted++:$updated++;$fq->close();
            $winner=($v['home_score']===null||$v['away_score']===null)?'UNKNOWN':($v['home_score']>$v['away_score']?'HOME':($v['home_score']<$v['away_score']?'AWAY':'DRAW'));$rs='played';
            $rq=$db->prepare('INSERT INTO gw_fixture_results(aggregate_away,aggregate_home,away_score,capture_id,created_at,fixture_id,game_world_id,home_score,penalty_away,penalty_home,result_status,sm_game_world_id,winner_side) VALUES(?,?,?,?,NOW(6),?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE aggregate_away=VALUES(aggregate_away),aggregate_home=VALUES(aggregate_home),away_score=VALUES(away_score),home_score=VALUES(home_score),penalty_away=VALUES(penalty_away),penalty_home=VALUES(penalty_home),result_status=VALUES(result_status),sm_game_world_id=VALUES(sm_game_world_id),winner_side=VALUES(winner_side)');
            $rq->bind_param('iiiiisiiiisis',$v['aggregate_away'],$v['aggregate_home'],$v['away_score'],$capture,$fixture,$gw,$v['home_score'],$v['penalty_away'],$v['penalty_home'],$rs,$ctx['smGameWorldId'],$winner);$rq->execute();$rq->close();
        }$db->commit();results_reply(['ok'=>true,'stored'=>count($items),'inserted_fixtures'=>$inserted,'updated_fixtures'=>$updated,'capture_id'=>$capture,'unresolved_club_sides'=>$unresolvedClubs]);
    }catch(Throwable $e){$db->rollback();results_fail('RESULTS transaction failed: '.$e->getMessage(),500);}
}
function results_probe(mysqli $db,array $b): never {$gw=results_world($b['gameWorld']??null);$ids=$b['fixtureIds']??[];if(!is_array($ids))results_fail('fixtureIds invalid.');$out=[];$q=$db->prepare('SELECT fixture_id FROM gw_fixtures WHERE game_world_id=? AND fixture_id=? LIMIT 1');foreach($ids as $id){$n=results_uint($id,false);$q->bind_param('si',$gw,$n);$q->execute();if($q->get_result()->fetch_assoc())$out[]=$n;}$q->close();results_reply(['ok'=>true,'existingFixtureIds'=>$out]);}

try{$body=results_body();$action=trim((string)($body['action']??''));$db=results_db();
    if($action==='setup')results_setup($db,results_world($body['gameWorld']??null));
    if($action==='probe_results')results_probe($db,$body);
    if($action==='validate_results'){results_validate_envelope($db,$body);results_reply(['ok'=>true,'validation'=>'PASS']);}
    if($action==='store_results')results_store($db,$body);
    results_fail('Unknown RESULTS action.',404);
}catch(Throwable $e){results_fail($e->getMessage(),500);}
