<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(array $data, int $status=200): never { http_response_code($status); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE); exit; }
try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') respond(['ok'=>false,'error'=>'method_not_allowed'],405);
    $world = (string)($_GET['world'] ?? 'GW001');
    if (!preg_match('/^GW00[1-9]$|^GW010$/D',$world)) respond(['ok'=>false,'error'=>'invalid_world'],422);
    $resources = ['results'=>['IMC Site Results','site_result_id','match_date'],'schedule'=>['IMC Site Schedule','site_schedule_id','match_date'],'match_report'=>['IMC Site Match Report','site_match_report_id','match_date'],'transfers'=>[$world.'_IMC Transfers','imc_transfer_number','transfer_date']];
    $resource=(string)($_GET['resource'] ?? 'results');
    if ($resource==='worlds'||$resource==='directory') {
        require_once __DIR__.'/core.php';
        $config=require dirname(__DIR__,2).'/__imc_private_gateway/config.php';
        if ($resource==='directory') respond(['ok'=>true,'core'=>nexus_world_directory(nexus_core_db($config['db']),$world)]);
        respond(['ok'=>true,'source'=>'MYSQL_ARUBA_CORE','worlds'=>nexus_worlds(nexus_core_db($config['db']))]);
    }
    if (!isset($resources[$resource])&&!in_array($resource,['catalog','competition','players','stats','manager_profile','team_profile','competition_reports','trophies'],true)) respond(['ok'=>false,'error'=>'invalid_resource'],422);

    $config=require dirname(__DIR__,2).'/__imc_private_gateway/config.php';
    $family=in_array($world,['GW002','GW003','GW007','GW008'],true)?'gold':'custom';
    $cfg=$config['db'];
    $pdo=new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$cfg['host'],$cfg['port'],$cfg[$family]),$cfg['user'],$cfg['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    require_once __DIR__.'/core.php';
    require_once __DIR__.'/hub.php';
    $coreDb=nexus_core_db($cfg);
    if($resource==='trophies'){require_once __DIR__.'/trophies.php';respond(nexus_trophies($pdo,$coreDb,$world));}
    if($resource==='catalog')respond(['ok'=>true,'world'=>$world,'rows'=>nexus_catalog($pdo,$coreDb,$world,nexus_season($coreDb,$world,(string)($_GET['season']??'')))]);
    if($resource==='competition')respond(nexus_hub($pdo,$coreDb,$world));
    if($resource==='players')respond(($_GET['scope']??'world')==='global'?nexus_global_players($coreDb,$world):nexus_players($pdo,$coreDb,$world));
    if($resource==='stats')respond(nexus_stats($pdo,$world,$coreDb));
    if($resource==='competition_reports')respond(nexus_competition_reports($pdo,$coreDb,$world));
    if($resource==='manager_profile')respond(nexus_manager_profile($pdo,$coreDb,$world));
    if($resource==='team_profile')respond(nexus_team_profile($pdo,$coreDb,$world));
    // Transfers are read directly from the authoritative per-world RAW repository.
    if($resource==='transfers'){
        $table=$world.'_IMC Transfers';
        $club=(string)($_GET['club']??'');$search=trim((string)($_GET['search']??''));
        if(strlen($search)>200)respond(['ok'=>false,'error'=>'invalid_search'],422);
        $where='game_world_id=?';$params=[$world];
        if($club!==''){
            $byName=str_starts_with($club,'name:');$value=$byName?substr($club,5):$club;
            $where.=$byName?' AND (club_from=? OR club_to=?)':' AND (from_sm_world_club_id=? OR to_sm_world_club_id=?)';
            $params[]=$value;$params[]=$value;
        }
        if($search!==''){$where.=' AND (player_name LIKE ? OR club_from LIKE ? OR club_to LIKE ?)';for($i=0;$i<3;$i++)$params[]='%'.$search.'%';}
        $limit=min(5000,max(1,(int)($_GET['limit']??50)));$offset=max(0,(int)($_GET['offset']??0));
        $stmt=$pdo->prepare("SELECT COUNT(*) total,MAX(imported_at) updated_at FROM `$table` WHERE $where");$stmt->execute($params);$meta=$stmt->fetch();
        $stmt=$pdo->prepare("SELECT imc_transfer_number AS site_id,game_world_id,imc_transfer_number,player_id,player_name,club_from,from_sm_world_club_id,club_to,to_sm_world_club_id,transfer_date,amount_text,exchange_players,imported_at FROM `$table` WHERE $where ORDER BY imc_transfer_number DESC LIMIT $limit OFFSET $offset");$stmt->execute($params);$rows=$stmt->fetchAll();
        foreach($rows as &$row)$row['exchange_players']=$row['exchange_players']===null?null:json_decode($row['exchange_players'],true);unset($row);
        $core=nexus_core_enrich($coreDb,$world,'transfers',$rows);
        respond(['ok'=>true,'clubs'=>[],'core'=>$core,'version'=>'nexus-public-3','world'=>$world,'resource'=>'transfers','source'=>$table,'total'=>(int)$meta['total'],'updated_at'=>$meta['updated_at'],'offset'=>$offset,'limit'=>$limit,'rows'=>$rows]);
    }
    [$table,$id,$date]=$resources[$resource];
    $where='game_world_id=?'; $params=[$world];
    if(in_array($resource,['results','schedule'],true)&&($_GET['team_id']??'')!==''){
        $teamId=(string)$_GET['team_id'];
        if(!ctype_digit($teamId)||strlen($teamId)>20)respond(['ok'=>false,'error'=>'invalid_team_id'],422);
        $home=$resource==='schedule'?'home_sm_team_id':'home_sm_club_id';
        $away=$resource==='schedule'?'away_sm_team_id':'away_sm_club_id';
        $where.=" AND ($home=? OR $away=?";$params[]=$teamId;$params[]=$teamId;
        if($resource==='results'){
            $where.=' OR EXISTS (SELECT 1 FROM `IMC Site Match Report` mr WHERE mr.game_world_id=`IMC Site Results`.game_world_id AND mr.sm_fixture_id=`IMC Site Results`.sm_fixture_id AND (mr.home_sm_club_id=? OR mr.away_sm_club_id=?))';
            $params[]=$teamId;$params[]=$teamId;
        }
        $where.=')';
        if($resource==='schedule')$where.=' AND NOT EXISTS (SELECT 1 FROM `IMC Site Results` played WHERE played.game_world_id=`IMC Site Schedule`.game_world_id AND played.sm_fixture_id=`IMC Site Schedule`.sm_fixture_id AND played.home_score IS NOT NULL AND played.away_score IS NOT NULL)';
    }
    $where.=nexus_date_where("`$date`",nexus_season($coreDb,$world,(string)($_GET['season']??'')),$params);
    if(($_GET['competition']??'')!==''){$where.=' AND competition_key=?';$params[]=(string)$_GET['competition'];}
    if($resource==='transfers'&&($_GET['club']??'')!==''){
        $club=(string)$_GET['club'];$byName=str_starts_with($club,'name:');
        $where.=$byName?' AND (club_from=? OR club_to=?)':' AND (from_sm_world_club_id=? OR to_sm_world_club_id=?)';
        $params[]=$byName?substr($club,5):$club;$params[]=$byName?substr($club,5):$club;
    }

    if($resource!=='transfers'&&($_GET['round']??'')!==''){ $where.=" AND COALESCE(NULLIF(competition_round,''),competition_stage)=?"; $params[]=substr((string)$_GET['round'],0,128); }
    $search=trim((string)($_GET['search'] ?? ''));
    if (strlen($search)>200) respond(['ok'=>false,'error'=>'invalid_search'],422);
    if ($search!=='') {
        $fields=$resource==='transfers'?['player_name','club_from','club_to']:['home_name','away_name','competition_key','sm_action'];
        $where.=' AND ('.implode(' OR ',array_map(fn($f)=>"`$f` LIKE ?",$fields)).')';
        foreach($fields as $f) $params[]='%'.$search.'%';
    }
    foreach(['from'=>'>=','to'=>'<='] as $key=>$op) if (!empty($_GET[$key])) {
        $value=(string)$_GET[$key];
        if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$value)) respond(['ok'=>false,'error'=>'invalid_date'],422);
        $where.=" AND `$date` $op ?"; $params[]=$value;
    }
    $detail=isset($_GET['fixture']);
    if($detail) {
        if($resource!=='match_report'||!ctype_digit((string)$_GET['fixture'])) respond(['ok'=>false,'error'=>'invalid_fixture'],422);
        $where.=' AND sm_fixture_id=?'; $params[]=$_GET['fixture'];
    }
    $limit=min($resource==='transfers'?5000:100,max(1,(int)($_GET['limit']??50))); $offset=max(0,(int)($_GET['offset']??0));
    $common='game_world_id,sm_fixture_id,competition_key,sm_action,sm_country,sm_division,competition_group,competition_stage,competition_round,match_date,home_name,away_name,synced_at';
    $score='home_score,away_score,penalty_home_score,penalty_away_score,aggregate_home_score,aggregate_away_score';
    $fields=match($resource){
        'results'=>"$common,$score,result_status,competition_group_name,home_sm_club_id,away_sm_club_id,home_sm_manager_id,away_sm_manager_id",
        'schedule'=>"$common,match_time,home_sm_team_id,away_sm_team_id,home_sm_manager_id,away_sm_manager_id",
        'match_report'=>"$common,$score,home_sm_club_id,away_sm_club_id,home_sm_manager_id,away_sm_manager_id,home_manager_name,away_manager_name,stadium_name,attendance".($detail?',team_stats_json,players_json,tactics_json':''),
        'transfers'=>'game_world_id,imc_transfer_number,player_id,player_name,club_from,club_to,from_sm_world_club_id,to_sm_world_club_id,transfer_date,amount_text,exchange_players,synced_at'
    };
    $pdo->beginTransaction();
    $stmt=$pdo->prepare("SELECT COUNT(*) total,MAX(synced_at) updated_at FROM `$table` WHERE $where"); $stmt->execute($params); $meta=$stmt->fetch();
    $direction=$resource==='schedule'?'ASC':'DESC';
    $selectId=$resource==='transfers'?"`imc_transfer_number` AS site_id":"`$id` AS site_id";
    $order=$resource==='transfers'?"`imc_transfer_number` DESC":"`$date` $direction,`$id` $direction";
    $stmt=$pdo->prepare("SELECT $selectId,$fields FROM `$table` WHERE $where ORDER BY $order LIMIT $limit OFFSET $offset"); $stmt->execute($params); $rows=$stmt->fetchAll();
    $pdo->commit();
    foreach($rows as &$row)foreach($row as $key=>&$value)if(str_ends_with($key,'_json')||$key==='exchange_players')$value=$value===null?null:json_decode($value,true); unset($row,$value);
    require_once __DIR__.'/core.php';
    if($resource==='match_report'&&$detail)nexus_profile_details($coreDb,$rows);
    if(in_array($resource,['results','schedule'],true))nexus_report_logo_ids($pdo,$world,$rows);
    $core=nexus_core_enrich(nexus_core_db($cfg),$world,$resource,$rows);
    $facets=[];
    if($resource==='transfers'){
        $teams=[];
        foreach(['from'=>'club_from','to'=>'club_to'] as $side=>$nameField){
            foreach(nexus_core_rows($pdo,"SELECT DISTINCT `{$side}_sm_world_club_id` id,`$nameField` name FROM `{$world}_IMC Transfers` WHERE game_world_id=?",[$world]) as $team){
                if(!$team['name'])continue;
                $key=$team['id']===null?'name:'.$team['name']:(string)$team['id'];
                $teams[$key]=['id'=>$key,'name'=>$team['name']];
            }
        }
        $facets=array_values($teams);usort($facets,fn($a,$b)=>strcasecmp($a['name'],$b['name']));
    }
    respond(['ok'=>true,'clubs'=>$facets,'core'=>$core,'version'=>'nexus-public-2','world'=>$world,'resource'=>$resource,'source'=>$table,'total'=>(int)$meta['total'],'updated_at'=>$meta['updated_at'],'offset'=>$offset,'limit'=>$limit,'rows'=>$rows]);
} catch(Throwable $e) { respond(['ok'=>false,'error'=>'read_unavailable'],503); }

