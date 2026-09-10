<?php
declare(strict_types=1);
/* IMC master website. Public editorial reads only. No gateway or schema mutation. */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=30, stale-while-revalidate=30');
function respond(array $data, int $status=200): never {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE); exit;
}
if (($_SERVER['REQUEST_METHOD']??'GET')!=='GET') respond(['ok'=>false,'error'=>'Metodo non disponibile.'],405);
function rows(PDO $db,string $sql,array $args=[]): array { $s=$db->prepare($sql); $s->execute($args); return $s->fetchAll(); }
function number(string $key,int $default=0,int $max=1000000): int { $s=$_GET[$key]??$default; if(is_array($s)||!ctype_digit((string)$s)) respond(['ok'=>false,'error'=>'Parametro non valido.'],422); return min((int)$s,$max); }
function string_arg(string $key): string { $v=$_GET[$key]??''; if(is_array($v)||strlen((string)$v)>120) respond(['ok'=>false,'error'=>'Parametro non valido.'],422); return trim((string)$v); }
function union_table(string $table,string $id,string $world='game_world_id',bool $dedup=false): string {
  $parts=[];
  foreach(['Sql1956795_2','Sql1956795_3'] as $schema) {
    $t="`$schema`.`$table`";
    $parts[]=$dedup ? "SELECT t.* FROM $t t JOIN (SELECT $world,sm_fixture_id,MAX($id) picked FROM $t WHERE sm_fixture_id IS NOT NULL AND sm_fixture_id>0 GROUP BY $world,sm_fixture_id) k ON k.picked=t.$id" : "SELECT * FROM $t";
  }
  return '('.implode(' UNION ALL ',$parts).')';
}
function safe_image(mixed $s): ?string { if(!is_string($s)||trim($s)==='')return null; $s=preg_replace('/^http:/i','https:',trim($s)); return preg_match('~^https://~i',$s)?$s:null; }
function matches_enrich(PDO $db,array $list): array {
  if(!$list)return [];
  $managerIds=[]; $clubIds=[];
  foreach($list as $r)foreach(['home','away'] as $side){ $mid=$r[$side.'_sm_manager_id']??null; if($mid)$managerIds[(string)$mid]=$mid; $cid=$r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??null; if($cid)$clubIds[(string)$cid]=$cid; }
  $managers=[];$clubs=[];
  if($managerIds){$ph=implode(',',array_fill(0,count($managerIds),'?'));foreach(rows($db,"SELECT manager_id,full_name,sm_manager_id FROM `IMC Manager Codex Global` WHERE sm_manager_id IN ($ph)",array_values($managerIds)) as $r)$managers[(string)$r['sm_manager_id']]=$r;}
  if($clubIds){$ph=implode(',',array_fill(0,count($clubIds),'?'));foreach(rows($db,"SELECT m.game_world_id,m.club_gw_id,c.id,c.name,c.image_url FROM clubs_game_world_id m JOIN `IMC Club Codex Global` c ON c.id=m.club_id WHERE m.club_gw_id IN ($ph)",array_values($clubIds)) as $r)$clubs[$r['game_world_id'].':'.$r['club_gw_id']]=$r;}
  foreach($list as &$r)foreach(['home','away'] as $side){
    $m=$managers[(string)($r[$side.'_sm_manager_id']??'')]??null;
    if($m){$r[$side.'_manager_id']=$m['manager_id'];$r[$side.'_manager_name']=$m['full_name'];}
    $id=$r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??null;
    $c=$clubs[$r['game_world_id'].':'.$id]??null;
    if($c){$r[$side.'_club_id']=$c['id'];$r[$side.'_image_url']=safe_image($c['image_url']);}
  } unset($r);return $list;
}
$stage='configuration';
try {
  $root=dirname(__DIR__,2);
  $cfg=require $root.'/__imc_private_gateway/config.php';
  $stage='connection';
  $db=new PDO(sprintf('mysql:host=%s;port=%d;dbname=Sql1956795_1;charset=utf8mb4',$cfg['db']['host'],$cfg['db']['port']),$cfg['db']['user'],$cfg['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
  $stage='query';
  $results=union_table('IMC Site Results','site_result_id','game_world_id',true);
  $schedule=union_table('IMC Site Schedule','site_schedule_id','game_world_id',true);
  $reports=union_table('IMC Site Match Report','site_match_report_id','game_world_id',true);
  $transfers=union_table('IMC Site Transfers','site_transfer_id');
  $stats=union_table('IMC Site SM Player Stats','site_player_stats_id');
  $valid="r.result_status='COMPLETED' AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL AND r.home_score>=0 AND r.away_score>=0";
  $dataset=string_arg('dataset')?:'pulse'; $world=string_arg('world');
  if($world!==''&&!preg_match('/^GW0(0[1-9]|10)$/',$world))respond(['ok'=>false,'error'=>'Mondo non valido.'],422);
  $offset=number('offset');$limit=max(1,number('limit',30,100));$search=string_arg('q');
  $payload=[];$context=[];
  switch($dataset){
  case 'pulse':
    $worlds=rows($db,'SELECT `IMC GW` game_world_id,`IMC GW Name` name,`SM Game World ID` sm_game_world_id,`Active Club` registered_clubs FROM `IMC Game World Codex Global` ORDER BY `IMC GW`');
    $volume=rows($db,"SELECT r.game_world_id,COUNT(*) matches,SUM(r.home_score+r.away_score) goals,MIN(r.match_date) first_date,MAX(r.match_date) last_date FROM $results r WHERE $valid GROUP BY r.game_world_id");
    $coverage=rows($db,'SELECT * FROM `Sql1956795_2`.`IMC Repository Report` UNION ALL SELECT * FROM `Sql1956795_3`.`IMC Repository Report`');
    $managerCount=rows($db,'SELECT COUNT(*) total FROM `IMC Manager Codex Global`')[0]['total'];
    $recent=rows($db,"SELECT r.* FROM $results r JOIN (SELECT r.game_world_id,MAX(r.match_date) last_date FROM $results r WHERE $valid GROUP BY r.game_world_id) d ON d.game_world_id=r.game_world_id AND d.last_date=r.match_date WHERE $valid ORDER BY r.match_date DESC,r.game_world_id,r.sm_fixture_id DESC");
    $selected=[];foreach($recent as $item){if(!isset($selected[$item['game_world_id']]))$selected[$item['game_world_id']]=$item;}
    $latest=matches_enrich($db,array_values($selected));
    $feature=matches_enrich($db,rows($db,"SELECT r.game_world_id,r.sm_fixture_id,r.home_name,r.away_name,r.home_score,r.away_score,r.match_date,r.sm_action,r.sm_division,r.home_sm_club_id,r.away_sm_club_id,r.home_sm_manager_id,r.away_sm_manager_id,r.stadium_name,r.attendance FROM $reports r ORDER BY r.match_date DESC,r.sm_fixture_id DESC LIMIT 1"));
    $payload=['worlds'=>$worlds,'managers'=>(int)$managerCount,'volume'=>$volume,'coverage'=>$coverage,'latest'=>$latest,'feature'=>$feature[0]??null];
    $context=['definition'=>'Partite concluse distinte per Game World e fixture. Copertura limitata agli archivi importati.','source'=>'IMC Site Results; IMC Repository Report; CORE'];break;
  case 'worlds':
    $payload=rows($db,'SELECT `IMC GW` game_world_id,`IMC GW Name` name,`SM Game World ID` sm_game_world_id,`Active Club` registered_clubs,Country FROM `IMC Game World Codex Global` ORDER BY `IMC GW`');break;
  case 'world':
    $payload['world']=rows($db,'SELECT `IMC GW` game_world_id,`IMC GW Name` name,`SM Game World ID` sm_game_world_id,`Active Club` registered_clubs,Country FROM `IMC Game World Codex Global` WHERE `IMC GW`=?',[$world])[0]??null;
    $payload['seasons']=rows($db,'SELECT * FROM imc_game_world_seasons WHERE game_world_id=? ORDER BY imc_season DESC',[$world]);
    $payload['results']=matches_enrich($db,rows($db,"SELECT r.* FROM $results r WHERE r.game_world_id=? AND $valid ORDER BY r.match_date DESC,r.sm_fixture_id DESC LIMIT 10",[$world]));break;
  case 'results':case 'matches':case 'schedule':case 'today':
    $isSchedule=in_array($dataset,['schedule','today'],true);$table=$isSchedule?$schedule:$results;
    $where=[$isSchedule?'1=1':$valid];$args=[];
    if($world!==''){$where[]='r.game_world_id=?';$args[]=$world;}
    if($search!==''){$where[]='(r.home_name LIKE ? OR r.away_name LIKE ?)';$args[]='%'.$search.'%';$args[]='%'.$search.'%';}
    $date=string_arg('date');if($dataset==='today')$date=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    if($date!==''&&!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date))respond(['ok'=>false,'error'=>'Data non valida.'],422);
    if($date!==''){$where[]='r.match_date=?';$args[]=$date;}
    elseif($isSchedule){$where[]='r.match_date>=?';$args[]=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');}
    $w=implode(' AND ',$where);$direction=$isSchedule?'ASC':'DESC';
    $total=(int)rows($db,"SELECT COUNT(*) total FROM $table r WHERE $w",$args)[0]['total'];
    $timeOrder=$isSchedule?'r.match_time ASC,':'';
    $list=rows($db,"SELECT r.* FROM $table r WHERE $w ORDER BY r.match_date $direction,$timeOrder r.game_world_id,r.sm_fixture_id LIMIT $limit OFFSET $offset",$args);
    if($isSchedule&&$list){foreach($list as &$s){$done=rows($db,"SELECT r.home_score,r.away_score,r.result_status FROM $results r WHERE r.game_world_id=? AND r.sm_fixture_id=? AND $valid",[$s['game_world_id'],$s['sm_fixture_id']]);if($done)$s=array_merge($s,$done[0]);}unset($s);}
    $payload=matches_enrich($db,$list);$context=['total'=>$total,'offset'=>$offset,'limit'=>$limit,'date'=>$date,'time_note'=>'Orari come registrati nella fonte; fuso non specificato.','source'=>$isSchedule?'IMC Site Schedule':'IMC Site Results'];break;
  case 'match':
    $id=number('id',0,PHP_INT_MAX);
    $r=rows($db,"SELECT r.* FROM $results r WHERE r.game_world_id=? AND r.sm_fixture_id=?",[$world,$id])[0]??null;
    $report=rows($db,"SELECT r.* FROM $reports r WHERE r.game_world_id=? AND r.sm_fixture_id=?",[$world,$id])[0]??null;
    if(!$r)$r=$report?:rows($db,"SELECT r.* FROM $schedule r WHERE r.game_world_id=? AND r.sm_fixture_id=?",[$world,$id])[0]??null;
    $payload=['match'=>$r?matches_enrich($db,[$r])[0]:null,'report'=>$report];break;
  case 'managers':case 'manager':
    $id=string_arg('id');$where=$dataset==='manager'?'WHERE manager_id=?':'';
    $payload['managers']=rows($db,"SELECT manager_id,full_name,sm_manager_id,imc_join_date FROM `IMC Manager Codex Global` $where ORDER BY full_name",$where?[$id]:[]);
    if($dataset==='manager'&&$payload['managers']){
      $sm=$payload['managers'][0]['sm_manager_id'];
      $payload['results']=matches_enrich($db,rows($db,"SELECT r.* FROM $results r WHERE $valid AND (r.home_sm_manager_id=? OR r.away_sm_manager_id=?) ORDER BY r.match_date DESC,r.sm_fixture_id DESC LIMIT 30",[$sm,$sm]));
      $payload['summary']=rows($db,"SELECT COUNT(*) matches,COUNT(DISTINCT r.game_world_id) worlds,SUM((r.home_sm_manager_id=? AND r.home_score>r.away_score) OR (r.away_sm_manager_id=? AND r.away_score>r.home_score)) wins FROM $results r WHERE $valid AND (r.home_sm_manager_id=? OR r.away_sm_manager_id=?)",[$sm,$sm,$sm,$sm])[0];
    }break;
  case 'clubs':case 'club':
    $id=number('id',0,PHP_INT_MAX);$where=[];$args=[];
    if($dataset==='club'){$where[]='c.id=?';$args[]=$id;}
    else {$where[]="EXISTS(SELECT 1 FROM clubs_game_world_id m WHERE m.club_id=c.id AND m.game_world_id IN ('GW001','GW002','GW003','GW004','GW005','GW006','GW007','GW008','GW009','GW010'))";}
    if($search!==''){$where[]='c.name LIKE ?';$args[]='%'.$search.'%';}
    $w=implode(' AND ',$where);
    $payload['clubs']=rows($db,"SELECT c.id,c.name,c.image_url FROM `IMC Club Codex Global` c WHERE $w ORDER BY c.name LIMIT $limit OFFSET $offset",$args);
    foreach($payload['clubs'] as &$c)$c['image_url']=safe_image($c['image_url']);unset($c);
    $context['total']=(int)rows($db,"SELECT COUNT(*) total FROM `IMC Club Codex Global` c WHERE $w",$args)[0]['total'];
    if($dataset==='club'){
      $payload['worlds']=rows($db,'SELECT game_world_id,club_gw_id FROM clubs_game_world_id WHERE club_id=? ORDER BY game_world_id',[$id]);
      $payload['results']=matches_enrich($db,rows($db,"SELECT r.* FROM $results r WHERE $valid AND EXISTS(SELECT 1 FROM clubs_game_world_id m WHERE m.club_id=? AND m.game_world_id=r.game_world_id AND (m.club_gw_id=r.home_sm_club_id OR m.club_gw_id=r.away_sm_club_id)) ORDER BY r.match_date DESC LIMIT 30",[$id]));
    }break;
  case 'players':case 'player':
    $id=number('id',0,PHP_INT_MAX);$where=[];$args=[];
    if($dataset==='player'){$where[]='s.sm_player_id=?';$args[]=$id;}
    if($world!==''){$where[]='s.source_game_world_id=?';$args[]=$world;}
    if($search!==''){$where[]='s.player_name LIKE ?';$args[]='%'.$search.'%';}
    $w=$where?implode(' AND ',$where):'1=1';
    $payload['players']=rows($db,"SELECT s.sm_player_id,MAX(s.player_name) player_name,COUNT(DISTINCT s.source_game_world_id) worlds,p.image_url FROM $stats s LEFT JOIN `IMC Player Codex Global` p ON p.id=s.sm_player_id WHERE $w GROUP BY s.sm_player_id,p.image_url ORDER BY player_name LIMIT $limit OFFSET $offset",$args);
    foreach($payload['players'] as &$p)$p['image_url']=safe_image($p['image_url']);unset($p);
    $context['total']=(int)rows($db,"SELECT COUNT(DISTINCT s.sm_player_id) total FROM $stats s WHERE $w",$args)[0]['total'];
    if($dataset==='player'){
      if(!$payload['players']){$payload['players']=rows($db,"SELECT id sm_player_id,TRIM(CONCAT(COALESCE(forename,''),' ',COALESCE(surname,''))) player_name,image_url FROM `IMC Player Codex Global` WHERE id=?",[$id]);foreach($payload['players'] as &$p)$p['image_url']=safe_image($p['image_url']);unset($p);}
      $payload['stats']=rows($db,"SELECT s.source_game_world_id game_world_id,s.competition_key,s.player_name,s.club_name,s.appearances,s.goals,s.assists,s.avg_rating,s.mom,s.imported_at FROM $stats s WHERE s.sm_player_id=? ORDER BY s.source_game_world_id,s.competition_key",[$id]);
    }
    $context['definition']='Player presenti nelle statistiche importate. Snapshot per competizione, non totali di carriera.';break;
  case 'transfers':
    $where=[];$args=[];if($world!==''){$where[]='game_world_id=?';$args[]=$world;}
    if($search!==''){$where[]='(player_name LIKE ? OR club_to LIKE ? OR club_from LIKE ?)';$args=array_merge($args,array_fill(0,3,'%'.$search.'%'));}
    $w=$where?implode(' AND ',$where):'1=1';
    $payload=rows($db,"SELECT game_world_id,player_id,player_name,club_from,club_to,transfer_date,amount_text FROM $transfers t WHERE $w ORDER BY transfer_date DESC,game_world_id,imc_transfer_number DESC LIMIT $limit OFFSET $offset",$args);
    $context['total']=(int)rows($db,"SELECT COUNT(*) total FROM $transfers t WHERE $w",$args)[0]['total'];break;
  case 'rankings':
    $payload=rows($db,"SELECT m.manager_id,m.full_name,COUNT(*) matches,COUNT(DISTINCT x.game_world_id) worlds FROM (SELECT r.game_world_id,r.sm_fixture_id,r.home_sm_manager_id sm_manager_id FROM $results r WHERE $valid UNION SELECT r.game_world_id,r.sm_fixture_id,r.away_sm_manager_id sm_manager_id FROM $results r WHERE $valid) x JOIN `IMC Manager Codex Global` m ON m.sm_manager_id=x.sm_manager_id GROUP BY m.manager_id,m.full_name ORDER BY matches DESC,m.manager_id LIMIT 60");
    $context['definition']='Presenze da manager nei risultati conclusi importati, distinte per GW e fixture. Misura copertura documentata, non merito sportivo.';break;
  case 'records':
    $payload['scope']=rows($db,"SELECT COUNT(*) matches,MIN(match_date) first_date,MAX(match_date) last_date FROM $results r WHERE $valid")[0];
    $payload['goals']=matches_enrich($db,rows($db,"SELECT r.* FROM $results r WHERE $valid AND (r.home_score+r.away_score)=(SELECT MAX(x.home_score+x.away_score) FROM $results x WHERE x.result_status='COMPLETED' AND x.home_score IS NOT NULL AND x.away_score IS NOT NULL) ORDER BY match_date DESC LIMIT 100"));
    $payload['margin']=matches_enrich($db,rows($db,"SELECT r.* FROM $results r WHERE $valid AND ABS(CAST(r.home_score AS SIGNED)-CAST(r.away_score AS SIGNED))=(SELECT MAX(ABS(CAST(x.home_score AS SIGNED)-CAST(x.away_score AS SIGNED))) FROM $results x WHERE x.result_status='COMPLETED' AND x.home_score IS NOT NULL AND x.away_score IS NOT NULL) ORDER BY match_date DESC LIMIT 100"));
    $context['definition']='Massimi nell’archivio disponibile, non record di tutta la storia del gioco. Rigori esclusi dai gol e dallo scarto.';break;
  case 'stories':
    $payload=matches_enrich($db,rows($db,"SELECT r.game_world_id,r.sm_fixture_id,r.home_name,r.away_name,r.home_score,r.away_score,r.match_date,r.sm_action,r.home_sm_club_id,r.away_sm_club_id,r.home_sm_manager_id,r.away_sm_manager_id,r.stadium_name FROM $reports r ORDER BY r.match_date DESC,r.sm_fixture_id DESC LIMIT 12"));break;
  case 'archive':$payload=rows($db,'SELECT * FROM imc_game_world_seasons ORDER BY imc_season_start_date,game_world_id');break;
  case 'competitions':$payload=rows($db,'SELECT game_world_id,sm_action,custom_competition,sm_country,sm_division,teams_count,expected_match FROM `IMC Competition Codex Global` ORDER BY game_world_id,sm_action,sm_country,sm_division');break;
  default:respond(['ok'=>false,'error'=>'Sezione non disponibile.'],404);
  }
  respond(['ok'=>true,'data'=>$payload,'context'=>$context,'source'=>'MySQL Aruba · IMC','generated_at'=>gmdate('c')]);
} catch(Throwable $e){error_log('IMC master read: '.$e->getMessage());respond(['ok'=>false,'error'=>'Dati temporaneamente non disponibili. Riprova tra poco.','stage'=>$stage,'code'=>(string)$e->getCode()],503);}
