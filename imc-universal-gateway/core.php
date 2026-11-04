<?php
declare(strict_types=1);
const IMC_VERSION='2.4.0'; const IMC_MAX_ROWS=100000;
$GLOBALS['imc_started']=microtime(true);
function imc_out(array $x,int $s=200):never{http_response_code($s);$x['duration_ms']??=(int)round((microtime(true)-$GLOBALS['imc_started'])*1000);echo json_encode($x,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);exit;}

// Table names migrated in Sql1956795_3. Row IDs and normalization remain legacy for now.
function imc_destination_pairs(): array {
    $pairs=[];
    foreach (['GW001'=>'IMC001','GW005'=>'IMC002','GW009'=>'IMC003','GW010'=>'IMC004','GW011'=>'IMC005'] as $old=>$new) {
        foreach (['Results','Schedule','Match_Report','Transfers','Player_Codex','Trophy_Room'] as $suffix) {
            $pairs[$old.'_IMC_'.$suffix]=$new.'_'.($suffix==='Match_Report'?'Match_Reports':$suffix);
        }
    }
    foreach (range(6,10) as $n) foreach (['Results','Schedule','Match_Report','Transfers','Player_Codex','Trophy_Room'] as $suffix) {
        $pairs[sprintf('IMC-%03d_IMC_%s',$n,$suffix)]=sprintf('IMC%03d_%s',$n,$suffix==='Match_Report'?'Match_Reports':$suffix);
    }
    foreach (($GLOBALS['imc_dynamic_worlds'] ?? []) as $old=>$alias) {
        foreach (['Results','Schedule','Match_Report','Transfers','Player_Codex','Trophy_Room'] as $suffix) {
            unset($pairs[$alias.'_IMC_'.$suffix]);
            $pairs[$old.'_IMC_'.$suffix]=str_replace('-','',$alias).'_'.($suffix==='Match_Report'?'Match_Reports':$suffix);
        }
    }
    return $pairs;
}
function imc_physical_table(?string $table): ?string { return $table===null?null:(imc_destination_pairs()[$table]??$table); }
function imc_logical_table(string $table): string { return array_flip(imc_destination_pairs())[$table]??$table; }

function imc_ident(string $x):string{$x=imc_physical_table($x);if(preg_match('/^[A-Za-z_][A-Za-z0-9_]{0,63}$/',$x))return'`'.$x.'`';if(preg_match('/^GW(?:00[1-9]|01[0-5])_IMC_(?:Results|SM_Player_Stats|Schedule|Transfers|Match_Report|Player_Codex)$/',$x))return'`'.$x.'`';if(in_array($x,['IMC Player Codex Global Data','IMC Player Codex Global Rating History','IMC Game World Codex Global','IMC GW'],true))return'`'.$x.'`';throw new InvalidArgumentException('invalid_identifier');}
function imc_cfg():array{$f=dirname(__DIR__).'/__imc_private_gateway/config.php';if(!is_file($f))throw new RuntimeException('gateway_configuration_not_found');return require$f;}
function imc_route(array$b,array$c):array{$g=strtoupper(trim((string)($b['game_world_id']??'')));if(strtolower((string)($b['source']??''))==='core'||$g==='CORE')return['source'=>'core','game_world_id'=>null,'database'=>$c['db']['core'],'family'=>'CORE'];if(!preg_match('/^(?:GW(?:00[1-9]|01[0-5])|IMC-00[6-9]|IMC-010)$/',$g))throw new InvalidArgumentException('invalid_game_world');if(in_array($g,$c['gold_worlds'],true))return['source'=>'game_world','game_world_id'=>$g,'database'=>$c['db']['gold'],'family'=>'MULTI_LEAGUE'];if(preg_match('/^IMC-(?:00[6-9]|010)$/',$g)||isset($GLOBALS['imc_dynamic_worlds'][$g])||in_array($g,$c['custom_worlds'],true))return['source'=>'game_world','game_world_id'=>$g,'database'=>$c['db']['custom'],'family'=>'SINGLE_LEAGUE'];throw new InvalidArgumentException('unsupported_game_world');}
function imc_explicit_import_route(array$b,array$c):array{$g=strtoupper(trim((string)($b['game_world_id']??'')));$repository=trim((string)($b['repository']??''));$database=trim((string)($b['target_database']??''));$table=trim((string)($b['target_table']??''));if(!preg_match('/^(?:GW(?:00[1-9]|01[0-5])|IMC-00[6-9]|IMC-010)$/',$g))throw new InvalidArgumentException('invalid_game_world');$suffixByRepository=['IMC Results'=>'IMC_Results','IMC SM Player Stats'=>'IMC_SM_Player_Stats','IMC Schedule'=>'IMC_Schedule','IMC Match Report'=>'IMC_Match_Report','IMC Transfer'=>'IMC_Transfers','IMC Player Codex'=>'IMC_Player_Codex','IMC_Game_World_Season'=>'IMC_Game_World_Season'];if(!array_key_exists($repository,$suffixByRepository))throw new InvalidArgumentException('explicit_repository_not_allowed');$expectedDatabase=imc_route(['game_world_id'=>$g],$c)['database'];$expectedTable=$repository==='IMC_Game_World_Season'?'IMC_Game_World_Season':$g.'_'.$suffixByRepository[$repository];if($database===''||$database!==$expectedDatabase)throw new InvalidArgumentException('explicit_database_not_allowed');if($table===''||$table!==$expectedTable)throw new InvalidArgumentException('explicit_table_not_allowed');imc_ident($table);return['source'=>'game_world','game_world_id'=>$g,'database'=>$database,'family'=>'EXPLICIT_IMPORT','table'=>$table];}
function imc_db(array$c,string$d):PDO{return new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$c['db']['host'],$c['db']['port'],$d),$c['db']['user'],$c['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);}
function imc_table(array$b,array$r):?string{$t=trim((string)($b['table']??''));if($t!==''){imc_ident($t);return$t;}$q=trim((string)($b['repository']??''));if($q==='')return null;if(in_array($q,['IMC Results','IMC SM Player Stats','IMC Schedule','IMC Transfer','IMC Match Report','IMC Player Codex'],true)){if(!$r['game_world_id'])throw new InvalidArgumentException('invalid_game_world');$map=['IMC Results'=>'IMC_Results','IMC SM Player Stats'=>'IMC_SM_Player_Stats','IMC Schedule'=>'IMC_Schedule','IMC Transfer'=>'IMC_Transfers','IMC Match Report'=>'IMC_Match_Report','IMC Player Codex'=>'IMC_Player_Codex'];$t=$r['game_world_id'].'_'.$map[$q];imc_ident($t);return$t;}imc_ident($q);return$r['game_world_id']?$r['game_world_id'].'_'.$q:$q;}
function imc_exists(PDO$p,string$d,string$t):bool{$t=imc_physical_table($t);$s=$p->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=? AND table_name=?');$s->execute([$d,$t]);return(int)$s->fetchColumn()>0;}
function imc_cols(PDO$p,string$t):array{$a=[];foreach($p->query('SHOW FULL COLUMNS FROM '.imc_ident($t)) as$r)$a[$r['Field']]=$r;return$a;}
function imc_where(array$w,array&$v):string{if(!$w)throw new InvalidArgumentException('where_required');$a=[];foreach($w as$k=>$x){imc_ident((string)$k);if($x===null)$a[]=imc_ident((string)$k).' IS NULL';else{$a[]=imc_ident((string)$k).'=?';$v[]=$x;}}return implode(' AND ',$a);}
function imc_count(PDO$p,string$t,array$w=[]):int{$v=[];$q='SELECT COUNT(*) FROM '.imc_ident($t).($w?' WHERE '.imc_where($w,$v):'');$s=$p->prepare($q);$s->execute($v);return(int)$s->fetchColumn();}
function imc_import_table(string$t):bool{return preg_match('/^GW(?:00[1-9]|01[0-5])_IMC_(?:Results|SM_Player_Stats|Schedule|Transfers|Match_Report|Player_Codex)$/',$t)===1;}
function imc_valid_date(string$v,string$f):bool{$d=DateTimeImmutable::createFromFormat('!'.$f,$v);return$d!==false&&$d->format($f)===$v;}
function imc_validate_import_value(string$k,mixed$v,array$c):void{if($v===null){if(strtoupper((string)($c['Null']??'YES'))==='NO')throw new InvalidArgumentException('null_not_allowed:'.$k);return;}$type=strtolower((string)($c['Type']??''));if(preg_match('/^(tinyint|smallint|mediumint|int|bigint)( unsigned)?$/',$type,$m)){if(!(is_int($v)||(is_string($v)&&preg_match('/^-?[0-9]+$/',$v))))throw new InvalidArgumentException('invalid_type:'.$k);if(isset($m[2])&&$m[2]!==''&&(string)$v!==''&&str_starts_with((string)$v,'-'))throw new InvalidArgumentException('invalid_type:'.$k);return;}if(preg_match('/^(decimal|float|double)/',$type)){if(!(is_int($v)||is_float($v)||(is_string($v)&&is_numeric($v))))throw new InvalidArgumentException('invalid_type:'.$k);return;}if(preg_match('/^(?:var)?char\(([0-9]+)\)/',$type,$m)){if(!is_string($v)&&!is_int($v)&&!is_float($v))throw new InvalidArgumentException('invalid_type:'.$k);if(mb_strlen((string)$v)>(int)$m[1])throw new InvalidArgumentException('value_too_long:'.$k);return;}if($type==='date'){if(!is_string($v)||!imc_valid_date($v,'Y-m-d'))throw new InvalidArgumentException('invalid_format:'.$k);return;}if($type==='time'){if(!is_string($v)||!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/',$v))throw new InvalidArgumentException('invalid_format:'.$k);return;}if(str_starts_with($type,'datetime')||str_starts_with($type,'timestamp')){if(!is_string($v)||!(imc_valid_date($v,'Y-m-d H:i:s')||preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/',$v)))throw new InvalidArgumentException('invalid_format:'.$k);return;}}
function imc_row(PDO$p,string$t,array$r):array{$c=imc_cols($p,$t);foreach($r as$k=>$v){if(!isset($c[$k]))throw new InvalidArgumentException('column_not_found:'.$k);if(imc_import_table($t))imc_validate_import_value((string)$k,$v,$c[$k]);if(str_starts_with(strtolower((string)$c[$k]['Type']),'json')){if(is_array($v))$r[$k]=json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);elseif(is_string($v)&&json_decode($v,true)===null&&strtolower($v)!=='null')throw new InvalidArgumentException('invalid_json');}}if(imc_import_table($t)){foreach($c as$k=>$col){$required=strtoupper((string)($col['Null']??'YES'))==='NO'&&$col['Default']===null&&!str_contains(strtolower((string)($col['Extra']??'')),'auto_increment');if($required&&!array_key_exists($k,$r))throw new InvalidArgumentException('required_field_missing:'.$k);}$gw=substr($t,0,5);if(str_ends_with($t,'_IMC_Results')&&preg_match('/^(IMC[0-9]{3})_Results$/',imc_physical_table($t),$m))$gw=$m[1];if(array_key_exists('game_world_id',$r)&&$r['game_world_id']!==null&&strtoupper(trim((string)$r['game_world_id']))!==$gw)throw new InvalidArgumentException('game_world_mismatch');}return$r;}
function imc_type(string$x):string{$x=strtoupper(trim($x));if(!preg_match('/^(TINYINT|SMALLINT|MEDIUMINT|INT|BIGINT|FLOAT|DOUBLE|DECIMAL\([0-9]+,[0-9]+\)|CHAR\([0-9]+\)|VARCHAR\([0-9]+\)|TEXT|MEDIUMTEXT|LONGTEXT|DATE|DATETIME|TIMESTAMP|TIME|JSON|BOOLEAN)( UNSIGNED)?$/',$x))throw new InvalidArgumentException('invalid_column_type');return$x;}
function imc_peer():array{$f=dirname(__DIR__).'/imc-database-manager/index.php';if(!is_file($f))return['reachable'=>false,'status'=>'unavailable'];$j=json_decode((string)@file_get_contents($f),true);return is_array($j)?['reachable'=>true,'service'=>$j['service']??null,'status'=>$j['status']??null,'version'=>$j['version']??null,'role_version'=>$j['role_version']??null,'current_role'=>$j['current_role']??null,'capabilities'=>$j['capabilities']??[]]:['reachable'=>false,'status'=>'invalid_response'];}
function imc_log(array$r,string$a,?string$t,array$e=[]):void{$f=dirname(__DIR__).'/__imc_private_gateway/universal-gateway-audit.jsonl';@file_put_contents($f,json_encode(array_merge(['timestamp'=>gmdate('c'),'action'=>$a,'source'=>$r['source']??null,'game_world_id'=>$r['game_world_id']??null,'database'=>$r['database']??null,'table'=>$t],$e),JSON_UNESCAPED_SLASHES)."\n",FILE_APPEND|LOCK_EX);}
function imc_actions():array{return['health','probe','resolve_database','resolve_table','show_tables','read','read_one','sample','count','count_nulls','distinct','aggregate','show_columns','describe','schema','indexes','show_create_table','query','create_table','drop_table','rename_table','add_column','drop_column','rename_column','modify_column','add_index','drop_index','add_primary_key','drop_primary_key','insert','insert_many','upsert','upsert_many','update','delete_one','delete','clear_repository','clear_table','clone_table_structure','copy_rows','truncate_table','dry_run','validate','audit_repository','find_duplicates','foreign_keys','add_foreign_key','drop_foreign_key','table_status'];}

// CORE is the sole authority for public IMC identifiers. Physical GW keys stay unchanged.
function imc_world_catalog(array $cfg): array {
    $pdo = imc_db($cfg, $cfg['db']['core']);
    return $pdo->query('SELECT `IMC GW` AS legacy_id, `IMC_WORLD_ID` AS imc_id, `IMC GW Name` AS name FROM `IMC Game World Codex Global` WHERE `IMC_WORLD_ID` IS NOT NULL')->fetchAll();
}
function imc_normalize_world_request(array $body, array $cfg, string $channel, ?array $catalog = null): array {
    $world = strtoupper(trim((string)($body['game_world_id'] ?? '')));
    if (preg_match('/^IMC(00[1-9]|010)$/D',$world,$m)) $world='IMC-'.$m[1];
    if ($world === '' || $world === 'CORE' || strtolower((string)($body['source'] ?? '')) === 'core') return $body;
    $isResults = ($body['repository']??'')==='IMC Results' || preg_match('/^(?:GW[0-9]{3}_IMC_Results|IMC[0-9]{3}_Results)$/D',(string)($body['target_table']??$body['table']??''));
    $isAlias = str_starts_with($world, 'IMC-');
    if (!$isAlias && $channel !== 'IMPORT' && !$isResults) return $body;
    if (!preg_match('/^(?:IMC-[0-9]{3}|GW[0-9]{3})$/D', $world)) throw new InvalidArgumentException('invalid_game_world');
    $catalog ??= imc_world_catalog($cfg);
    $GLOBALS['imc_dynamic_worlds']=[];
    foreach ($catalog as $entry) {
        if (preg_match('/^IMC-(?:00[6-9]|010)$/D',(string)$entry['imc_id']) &&
            preg_match('/^(?:GW(?:00[1-9]|01[0-5])|IMC-(?:00[6-9]|010))$/D',(string)$entry['legacy_id']) &&
            !in_array($entry['legacy_id'],$cfg['gold_worlds']??[],true)) {
            $GLOBALS['imc_dynamic_worlds'][$entry['legacy_id']]=$entry['imc_id'];
        }
    }
    $legacy = null; $alias = null;
    foreach ($catalog as $entry) {
        if ($world === $entry['imc_id'] || $world === $entry['legacy_id']) {
            if ($legacy !== null) throw new InvalidArgumentException('invalid_game_world:ambiguous_mapping');
            $legacy = $entry['legacy_id']; $alias = $entry['imc_id'];
        }
    }
    if ($legacy === null && preg_match('/^IMC-(?:00[6-9]|010)$/D',$world)) {
        if (!in_array(strtolower((string)($body['action']??'')), ['read','read_one','count','resolve_table','resolve_database','show_columns','describe','schema','indexes','probe'],true)) throw new InvalidArgumentException('unsupported_game_world:unassigned');
        $legacy=$world; $alias=$world;
    }
    if ($legacy === null || (!preg_match('/^IMC-(?:00[6-9]|010)$/D',$legacy) && !in_array($legacy, $cfg['custom_worlds'] ?? [], true) && !isset($GLOBALS['imc_dynamic_worlds'][$legacy]))) throw new InvalidArgumentException('unsupported_game_world');
    $body['game_world_id'] = $legacy;
    $body['IMC_WORLD_ID'] = $alias;
    foreach (['target_table', 'table'] as $key) {
        if (!isset($body[$key])) continue;
        $value = imc_logical_table((string)$body[$key]);
        if (str_starts_with($value, $alias.'_')) $value = $legacy.substr($value, strlen($alias));
        if (preg_match('/^(?:IMC-[0-9]{3}|GW[0-9]{3})_/', $value) && !str_starts_with($value, $legacy.'_')) throw new InvalidArgumentException('game_world_mismatch');
        $body[$key] = $value;
    }
    $compact=str_replace('-','',$alias);
    $normalize = static function(array $row) use ($legacy, $alias, $compact, $isResults): array {
        if (array_key_exists('game_world_id', $row)) {
            $value = strtoupper(trim((string)$row['game_world_id']));
            if ($value !== $legacy && $value !== $alias && $value !== $compact) throw new InvalidArgumentException('game_world_mismatch');
            $row['game_world_id'] = $isResults ? $compact : $legacy;
        }
        if ($isResults && isset($row['competition_key'])) {
            $key=(string)$row['competition_key'];
            foreach ([$legacy,$alias] as $prefix) {
                if (str_starts_with($key,$prefix.'|') || str_starts_with($key,$prefix.'_')) {
                    $key=$compact.substr($key,strlen($prefix)); break;
                }
            }
            $row['competition_key']=$key;
        }
        return $row;
    };
    foreach (['where', 'row', 'data', 'set'] as $key) {
        if (isset($body[$key]) && is_array($body[$key])) $body[$key] = $normalize($body[$key]);
    }
    foreach (['rows', 'items'] as $key) {
        if (!isset($body[$key]) || !is_array($body[$key])) continue;
        foreach ($body[$key] as $i => $row) {
            if (!is_array($row)) throw new InvalidArgumentException('invalid_payload:invalid_row');
            $body[$key][$i] = $normalize($row);
        }
    }
    return $body;
}

function imc_competition_catalog(array $cfg, array $body): array {
    $catalog=imc_world_catalog($cfg);
    $body=imc_normalize_world_request($body,$cfg,'IMPORT',$catalog);
    $alias=(string)($body['IMC_WORLD_ID']??'');
    $legacy=(string)($body['game_world_id']??'');
    if (!preg_match('/^IMC-(?:00[1-9]|010)$/D',$alias)) throw new InvalidArgumentException('invalid_game_world');
    $compact=str_replace('-','',$alias);
    $pdo=imc_db($cfg,$cfg['db']['core']);
    $stmt=$pdo->prepare("SELECT competition_key,custom_competition FROM `IMC Competition Codex Global` WHERE game_world_id IN (?,?,?) AND UPPER(TRIM(sm_action_group))='IMC'");
    $stmt->execute([$legacy,$alias,$compact]);
    $rows=[];$seen=[];
    foreach($stmt->fetchAll() as $row) {
        $key=trim((string)$row['competition_key']);$name=trim((string)$row['custom_competition']);
        if($key===''||$name==='') throw new InvalidArgumentException('invalid_payload:incomplete_competition');
        $valid=false;
        foreach(array_unique([$legacy,$alias,$compact]) as $prefix) {
            if(str_starts_with($key,$prefix.'_')||str_starts_with($key,$prefix.'|')) {
                $key=$compact.substr($key,strlen($prefix));$valid=true;break;
            }
        }
        if(!$valid||isset($seen[$key])) throw new InvalidArgumentException('invalid_payload:competition_key');
        $seen[$key]=true;$rows[]=['key'=>$key,'name'=>$name,'group'=>'IMC'];
    }
    usort($rows,fn($a,$b)=>strcmp($a['name'],$b['name']));
    return ['ok'=>true,'action'=>'list_imc_competitions','source'=>'core','game_world_id'=>$compact,'competitions'=>$rows];
}

function imc_run():never{try{$c=imc_cfg();if(($_SERVER['REQUEST_METHOD']??'')!=='POST')imc_out(['ok'=>false,'error'=>'method_not_allowed'],405);$b=json_decode(file_get_contents('php://input')?:'',true,64,JSON_THROW_ON_ERROR);if(!is_array($b))throw new InvalidArgumentException('invalid_payload');$a=strtolower(trim((string)($b['action']??'health')));$ch=strtoupper((string)($b['channel']??($_SERVER['HTTP_X_IMC_CHANNEL']??'CHATGPT')));if(!in_array($ch,['IMPORT','CHATGPT'],true))throw new InvalidArgumentException('invalid_channel');$repository=trim((string)($b['repository']??''));$tokenlessImport=in_array($repository,['IMC Results','IMC SM Player Stats','IMC Schedule','IMC_Game_World_Season'],true)||($repository==='IMC Transfer'&&in_array($a,['read','insert_many'],true))||($repository==='IMC Match Report'&&in_array($a,['read','insert_many'],true))||($repository==='IMC Player Codex'&&in_array($a,['read','insert_many'],true));if($a==='list_imc_competitions'&&$ch==='IMPORT')imc_out(imc_competition_catalog($c,$b));if($a==='list_imc_worlds'&&$ch==='IMPORT'){
$rows=[];$seen=[];
foreach(imc_world_catalog($c) as $w){
 if(!preg_match('/^IMC-(?:00[1-9]|010)$/D',(string)$w['imc_id']))continue;
 if(isset($seen[$w['imc_id']]))throw new InvalidArgumentException('invalid_game_world:ambiguous_mapping');
 $seen[$w['imc_id']]=true;
 $rows[]=['id'=>$w['imc_id'],'name'=>$w['name'],'legacy'=>$w['legacy_id']];
}
usort($rows,fn($a,$b)=>strcmp($a['id'],$b['id']));
imc_out(['ok'=>true,'action'=>'list_imc_worlds','source'=>'core','worlds'=>$rows]);
}if(!$tokenlessImport){$tok=(string)($_SERVER['HTTP_X_IMC_UNIVERSAL_TOKEN']??'');if($tok===''||!hash_equals((string)$c['token'],$tok))imc_out(['ok'=>false,'error'=>'unauthorized'],401);}if($a==='health')imc_out(['ok'=>true,'action'=>'health','service'=>'IMC Universal Gateway','version'=>IMC_VERSION,'channels'=>['IMPORT','CHATGPT'],'capability_families'=>['ROUTING','READ','SCHEMA','QUERY','WRITE','DELETE','DDL','TRANSACTIONS','VALIDATION','AUDIT','LOG','RESPONSE'],'actions'=>imc_actions(),'database_manager'=>imc_peer()]);if(!in_array($a,imc_actions(),true))throw new InvalidArgumentException('unknown_action');$requestedTable=(string)($b['target_table']??'');$b=imc_normalize_world_request($b,$c,$ch);$explicit=strtolower(trim((string)($b['route_mode']??'')))==='explicit';if($explicit){if(!in_array($a,['read','insert_many'],true))throw new InvalidArgumentException('explicit_action_not_allowed');$r=imc_explicit_import_route($b,$c);$t=$r['table'];}else{$r=imc_route($b,$c);$t=imc_table($b,$r);}if($a==='resolve_database')imc_out(['ok'=>true,'action'=>$a,'IMC_WORLD_ID'=>$b['IMC_WORLD_ID']??null]+$r);if($a==='resolve_table')imc_out(['ok'=>true,'action'=>$a,'table'=>imc_physical_table($t),'IMC_WORLD_ID'=>$b['IMC_WORLD_ID']??null]+$r);$p=imc_db($c,$r['database']);if($explicit&&!imc_exists($p,$r['database'],$t))throw new InvalidArgumentException('table_not_found');$base=['ok'=>true,'IMC_WORLD_ID'=>$b['IMC_WORLD_ID']??null,'action'=>$a,'channel'=>$ch,'source'=>$r['source'],'game_world_id'=>$r['game_world_id'],'database'=>$r['database'],'repository'=>$b['repository']??null,'table'=>($explicit&&str_starts_with($requestedTable,'GW')?$requestedTable:imc_physical_table($t)),'physical_table'=>imc_physical_table($t),'route_mode'=>$explicit?'explicit':($b['route_mode']??null),'trace_id'=>$b['trace_id']??null];if($a==='probe')imc_out($base+['database_connection'=>(int)$p->query('SELECT 1')->fetchColumn()===1?'ok':'failed']);if(imc_read_action($a,$b,$r,$t,$p,$base))exit;if(imc_write_action($a,$b,$r,$t,$p,$base))exit;if(imc_ddl_action($a,$b,$r,$t,$p,$base))exit;throw new InvalidArgumentException('unknown_action');}catch(Throwable$e){$m=$e->getMessage();$known=['invalid_identifier','invalid_game_world','unsupported_game_world','table_required','table_not_found','column_not_found','column_already_exists','index_not_found','duplicate_entry','foreign_key_constraint','multiple_rows_matched','invalid_payload','required_field_missing','invalid_json','where_required','unknown_action','invalid_column_type','null_not_allowed','invalid_type','invalid_format','value_too_long','game_world_mismatch','explicit_repository_not_allowed','explicit_database_not_allowed','explicit_table_not_allowed','explicit_action_not_allowed'];$err='gateway_error';foreach($known as$k)if(str_starts_with($m,$k)){$err=$k;break;}imc_out(['ok'=>false,'error'=>$err,'message'=>$m],$e instanceof InvalidArgumentException?422:500);}}
