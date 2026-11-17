<?php
declare(strict_types=1);
require_once __DIR__.'/../imc-universal-gateway/ingress.php';
function mrcheck(bool $ok,string $why):void {if(!$ok)throw new RuntimeException($why);}
$p=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',getenv('MYSQL_TEST_PASSWORD')?:'imc-normalizer-ci-only',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$p->exec('CREATE DATABASE mr_v3_test');$p->exec('USE mr_v3_test');
$snapshot=json_decode(file_get_contents(__DIR__.'/fixtures/match-report-before-v3.json'),true,512,JSON_THROW_ON_ERROR);
function mrinsert(PDO $p,string $table,array $row):void{$cols=implode(',',array_map(fn($s)=>'`'.$s.'`',array_keys($row)));$p->prepare('INSERT INTO `'.$table.'` ('.$cols.') VALUES ('.implode(',',array_fill(0,count($row),'?')).')')->execute(array_map('imc_ingress_scalar',array_values($row)));}
for($n=1;$n<=8;$n++){
 $w=sprintf('IMC%03d',$n);
 foreach(['Match_Reports','Results','Schedule'] as $repo){$base='IMC001_'.$repo;$cols=array_filter($snapshot['columns'],fn($c)=>$c['TABLE_NAME']===$base);$ddl=implode(',',array_map(fn($c)=>'`'.$c['COLUMN_NAME'].'` '.$c['COLUMN_TYPE'].' NULL',$cols));$p->exec("CREATE TABLE {$w}_{$repo} ($ddl)");}
}
$p->exec('ALTER TABLE IMC005_Results ADD youth_audit JSON');
$p->exec('CREATE TABLE IMC005_Player_Codex (player_id BIGINT,full_name VARCHAR(255),date_of_birth DATE)');
// Install the unchanged identity/ghost rules against the audited schemas.
foreach($snapshot['triggers'] as $t)if(str_starts_with($t['TRIGGER_NAME'],'imc_identity_')||str_starts_with($t['TRIGGER_NAME'],'imc005_unmanaged_ghost'))$p->exec('CREATE TRIGGER `'.$t['TRIGGER_NAME'].'` '.$t['ACTION_TIMING'].' '.$t['EVENT_MANIPULATION'].' ON `'.$t['EVENT_OBJECT_TABLE'].'` FOR EACH ROW '.$t['ACTION_STATEMENT']);
$sides=preg_replace('/CREATE ALGORITHM=UNDEFINED DEFINER=`[^`]+`@`[^`]+`/','CREATE ALGORITHM=UNDEFINED',$snapshot['youth_sides']);
$oldView=preg_replace('/CREATE ALGORITHM=UNDEFINED DEFINER=`[^`]+`@`[^`]+`/','CREATE ALGORITHM=UNDEFINED',$snapshot['youth_view']);
$p->exec($oldView);$p->exec($sides);
foreach($snapshot['triggers'] as $t)if(str_starts_with($t['TRIGGER_NAME'],'imc005_youth_report_'))$p->exec('CREATE TRIGGER `'.$t['TRIGGER_NAME'].'` '.$t['ACTION_TIMING'].' '.$t['EVENT_MANIPULATION'].' ON `'.$t['EVENT_OBJECT_TABLE'].'` FOR EACH ROW '.$t['ACTION_STATEMENT']);
// Apply the exact production plans to a database with the old views/triggers.
foreach(glob(__DIR__.'/../database-migrations/match-report-v3-20261117/IMC*.json') as $file){
 $plan=json_decode(file_get_contents($file),true,512,JSON_THROW_ON_ERROR);
 foreach($plan['statements'] as $sql){$p->exec($sql);}
}
for($n=1;$n<=8;$n++){
 $w=sprintf('IMC%03d',$n);$key=$w.'|S02|DOMESTIC|league|1';
 $r=['game_world_id'=>$w,'sm_fixture_id'=>101,'competition_key'=>$key,'imc_season'=>2,'sm_action'=>'league','competition_group'=>'DOMESTIC','sm_division'=>'1','competition_group_name'=>'Girone A','competition_stage'=>'League Stage','competition_round'=>'Giornata 1','match_date'=>'2026-11-17','home_sm_club_id'=>11,'away_sm_club_id'=>22,'home_name'=>'Home','away_name'=>'Away','home_score'=>0,'away_score'=>3,'home_sm_manager_id'=>99,'away_sm_manager_id'=>88,'penalty_home_score'=>5,'penalty_away_score'=>4];
 mrinsert($p,$w.'_Results',$r);
 mrinsert($p,$w.'_Match_Reports',['game_world_id'=>$w,'sm_fixture_id'=>101,'home_score'=>2,'away_score'=>1]);
 $saved=$p->query("SELECT * FROM {$w}_Match_Reports WHERE sm_fixture_id=101")->fetch(PDO::FETCH_ASSOC);
 mrcheck($saved['competition_key']===$key&&$saved['competition_group_name']==='Girone A'&&$saved['competition_round']==='Giornata 1'&&(int)$saved['penalty_home_score']===5,'All context fields including group/round/shootout must fill '.$w);
 mrcheck((int)$saved['home_score']===2&&(int)$saved['away_score']===1,'Actual MR score must survive '.$w);
 $result=$p->query("SELECT * FROM {$w}_Results WHERE sm_fixture_id=101")->fetch(PDO::FETCH_ASSOC);
 mrcheck((int)$result['home_sm_manager_id']===99&&(int)$result['away_sm_manager_id']===88,'Unknown MR managers must preserve Results '.$w);
 $p->exec("UPDATE {$w}_Match_Reports SET home_sm_manager_id=123 WHERE sm_fixture_id=101");
 mrcheck((int)$p->query("SELECT home_sm_manager_id FROM {$w}_Results WHERE sm_fixture_id=101")->fetchColumn()===123,'Manager update propagates '.$w);
 $p->exec("UPDATE {$w}_Match_Reports SET home_sm_manager_id=NULL WHERE sm_fixture_id=101");
 mrcheck((int)$p->query("SELECT home_sm_manager_id FROM {$w}_Results WHERE sm_fixture_id=101")->fetchColumn()===123,'NULL manager update preserves known manager '.$w);
 try{mrinsert($p,$w.'_Match_Reports',['game_world_id'=>$w,'sm_fixture_id'=>101]);throw new RuntimeException('Duplicate accepted');}catch(PDOException $e){mrcheck($e->getCode()==='23000','Unique constraint expected');}
 $s=$r;$s['sm_fixture_id']=102;foreach(['home_score','away_score','penalty_home_score','penalty_away_score','home_sm_manager_id','away_sm_manager_id'] as $k)unset($s[$k]);$s['home_sm_team_id']=$s['home_sm_club_id'];$s['away_sm_team_id']=$s['away_sm_club_id'];unset($s['home_sm_club_id'],$s['away_sm_club_id']);mrinsert($p,$w.'_Schedule',$s);
 mrinsert($p,$w.'_Match_Reports',['game_world_id'=>$w,'sm_fixture_id'=>102]);$saved=$p->query("SELECT * FROM {$w}_Match_Reports WHERE sm_fixture_id=102")->fetch(PDO::FETCH_ASSOC);
 mrcheck($saved['competition_key']===$key&&(int)$saved['home_sm_club_id']===11&&$saved['home_score']===null,'Schedule fallback must supply identity without guessing score '.$w);
 $p->exec("UPDATE {$w}_Match_Reports SET competition_round=NULL WHERE sm_fixture_id=102");mrcheck($p->query("SELECT competition_round FROM {$w}_Match_Reports WHERE sm_fixture_id=102")->fetchColumn()==='Giornata 1','Update fallback '.$w);
 // Ambiguous source rows cannot fill absent identity.
 $r['sm_fixture_id']=103;mrinsert($p,$w.'_Results',$r);$r['competition_key']=$w.'|S01|DOMESTIC|league|1';mrinsert($p,$w.'_Results',$r);mrinsert($p,$w.'_Match_Reports',['game_world_id'=>$w,'sm_fixture_id'=>103]);mrcheck($p->query("SELECT competition_key FROM {$w}_Match_Reports WHERE sm_fixture_id=103")->fetchColumn()===null,'Ambiguous Results must not guess '.$w);
}
// Seasoned youth keys, actual player birthdays, automatic 3-0 and metadata update guard.
$players=[];
for($i=1;$i<=22;$i++){$side=$i<=11?'home':'away';$players[]=['team_side'=>$side,'squad_slot'=>($i-1)%11+1,'starter'=>1,'sm_player_id'=>$i,'player_name'=>'Player '.$i,'rating'=>7];$p->exec("INSERT INTO IMC005_Player_Codex VALUES ($i,'Player $i','".($i===12?'2000-01-01':'2005-01-01')."')");}
$y=['game_world_id'=>'IMC005','sm_fixture_id'=>201,'competition_key'=>'IMC005|S02|IMC|risingstarsleague|premier','imc_season'=>2,'sm_action'=>'imc','competition_group'=>'IMC','home_name'=>'Home','away_name'=>'Away','home_score'=>2,'away_score'=>4,'home_sm_club_id'=>11,'away_sm_club_id'=>22];mrinsert($p,'IMC005_Results',$y);mrinsert($p,'IMC005_Match_Reports',$y+['players_json'=>$players]);
$r=$p->query('SELECT * FROM IMC005_Results WHERE sm_fixture_id=201')->fetch(PDO::FETCH_ASSOC);mrcheck((int)$r['home_score']===3&&(int)$r['away_score']===0,'Youth irregular away team gets 0-3');mrcheck((int)$p->query('SELECT home_score FROM IMC005_Match_Reports WHERE sm_fixture_id=201')->fetchColumn()===2,'MR retains played score');
$p->exec('UPDATE IMC005_Results SET home_score=7 WHERE sm_fixture_id=201');$p->exec("UPDATE IMC005_Match_Reports SET stadium_name='Metadata change' WHERE sm_fixture_id=201");mrcheck((int)$p->query('SELECT home_score FROM IMC005_Results WHERE sm_fixture_id=201')->fetchColumn()===7,'Metadata update cannot replay awarded scores');
$ghost=$y;$ghost['sm_fixture_id']=202;$ghost['home_name']='Forfar Athletic';$ghost['home_sm_manager_id']=99;mrinsert($p,'IMC005_Results',$ghost);mrinsert($p,'IMC005_Match_Reports',$ghost+['home_manager_name'=>'Ghost']);mrcheck($p->query('SELECT home_sm_manager_id FROM IMC005_Results WHERE sm_fixture_id=202')->fetchColumn()===null,'Ghost remains unmanaged');
// New canonical ordinary MR path bypasses unrelated World Cup reconciliation.
$ordinary=['game_world_id'=>'IMC001','sm_fixture_id'=>500,'imc_season'=>2,'competition_key'=>'IMC001|S02|IMC|championsleague','sm_action'=>'imc','home_score'=>2,'away_score'=>1];
mrcheck(imc_ingress_canonical_report_batch('GW001_IMC_Match_Report',[$ordinary]),'Canonical MR path recognized');
mrcheck(!imc_ingress_canonical_report_batch('GW001_IMC_Match_Report',[['game_world_id'=>'GW001','sm_fixture_id'=>501]]),'Legacy ad hoc importer retains its path');
mrcheck(!imc_ingress_canonical_report_batch('GW001_IMC_Match_Report',[array_replace($ordinary,['sm_action'=>'worldcup'])]),'World Cup retains dedicated path');
$out=imc_ingress_insert_many($p,'GW001_IMC_Match_Report','GW001',[$ordinary],true);mrcheck($out['written_rows']===1&&!isset($out['normalization']),'Ordinary MR does not run World Cup normalization');
echo "PASS MySQL 8: eight-world context BI/BU, unique fixtures, preserved played scores, safe manager propagation, Schedule fallback, youth sanctions and ghost rules; dedicated World Cup path unchanged.\n";

// Repair existing reports only; known values and JSON remain byte-equivalent.
$repairOld=['game_world_id'=>'IMC001','sm_fixture_id'=>601,'competition_key'=>'IMC001|S02|IMC|europaleague','imc_season'=>2,'sm_action'=>'imc','home_score'=>0,'away_score'=>2,'players_json'=>[['sm_player_id'=>10,'rating'=>7]],'team_stats_json'=>['home'=>['possession'=>52],'away'=>['possession'=>48]],'fingerprint'=>'old-hash'];
mrinsert($p,'IMC001_Match_Reports',$repairOld);
$prior=$p->query('SELECT * FROM IMC001_Match_Reports WHERE sm_fixture_id=601')->fetch(PDO::FETCH_ASSOC);
$incoming=array_replace($repairOld,['home_score'=>5,'home_sm_club_id'=>11,'away_sm_club_id'=>22,'players_json'=>[['sm_player_id'=>10,'rating'=>9]],'fingerprint'=>'new-hash']);
$total=(int)$p->query('SELECT COUNT(*) FROM IMC001_Match_Reports')->fetchColumn();
// Exercise the same request normalization as the live HTTP ingress, not just
// the persistence function with an already canonical row.
$body=imc_normalize_world_request(['action'=>'repair_report','repository'=>'IMC Match Report','game_world_id'=>'IMC001','target_table'=>'IMC001_Match_Reports','row'=>$incoming],['custom_worlds'=>['GW001'],'gold_worlds'=>[]],'IMPORT',[['imc_id'=>'IMC-001','legacy_id'=>'GW001']]);
mrcheck($body['row']['game_world_id']==='GW001','Ingress compatibility edge must be covered by repair test');
$out=imc_ingress_repair_report($p,$body['target_table'],$body['game_world_id'],$body['row']);
$after=$p->query('SELECT * FROM IMC001_Match_Reports WHERE sm_fixture_id=601')->fetch(PDO::FETCH_ASSOC);
mrcheck($out['updated_rows']===1&&$out['inserted_rows']===0&&(int)$p->query('SELECT COUNT(*) FROM IMC001_Match_Reports')->fetchColumn()===$total,'Repair never inserts duplicate rows');
mrcheck((int)$after['home_sm_club_id']===11&&(int)$after['away_sm_club_id']===22,'Repair fills missing team IDs');
foreach(['home_score','away_score','players_json','team_stats_json','fingerprint'] as $field)mrcheck($after[$field]===$prior[$field],'Repair preserves existing '.$field);
try{imc_ingress_repair_report($p,'GW001_IMC_Match_Report','GW001',array_replace($incoming,['competition_key'=>'IMC001|S02|IMC|championsleague']));throw new RuntimeException('Identity conflict accepted');}catch(RuntimeException $e){mrcheck($e->getMessage()==='report_identity_conflict','Conflicting repair blocked');}
try{imc_ingress_repair_report($p,'GW001_IMC_Match_Report','GW001',array_replace($incoming,['sm_fixture_id'=>9999]));throw new RuntimeException('Missing row accepted');}catch(RuntimeException $e){mrcheck($e->getMessage()==='report_missing_or_duplicated','Repair cannot create a missing row');}
echo "PASS MR repair: missing fields only, no duplicates, preserved technical JSON/played scores, identity conflicts rejected.\n";
