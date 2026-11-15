<?php
declare(strict_types=1);
$p=new PDO('mysql:host=127.0.0.1;port=3306','root','imc-normalizer-ci-only',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$m=json_decode(file_get_contents(__DIR__.'/fixtures/results-imc-migration.json'),true,512,JSON_THROW_ON_ERROR);
$p->exec('CREATE DATABASE Sql1956795_3');$p->exec('CREATE DATABASE Sql1956795_1');$p->exec('USE Sql1956795_3');
$p->exec('CREATE TABLE Sql1956795_1.`IMC Manager Assignment Global` (manager_id INT,game_world_id VARCHAR(16),assignment_type VARCHAR(30),national_team_id BIGINT,team_id BIGINT,start_date DATE,end_date DATE)');
$p->exec('CREATE TABLE Sql1956795_1.`IMC Manager Codex Global` (manager_id INT,sm_manager_id BIGINT)');
$p->exec('CREATE TABLE IMC_Trophy_Sync_State (game_world_id VARCHAR(16) PRIMARY KEY,revision INT,touched_at DATETIME)');
$old=['GW001','GW005','GW009','GW010','GW011'];
$ddl=implode(',',array_map(fn($x)=>'`'.$x['Field'].'` '.$x['Type'].' NULL',$m['columns']));
for($n=1;$n<=10;$n++){
 $table=sprintf('IMC%03d_Results',$n);$p->exec("CREATE TABLE $table ($ddl)");
 if($n<=5){$g=$old[$n-1];$p->exec("CREATE VIEW {$g}_IMC_Results AS SELECT * FROM $table");$p->exec("CREATE TABLE {$g}_IMC_Match_Report (game_world_id VARCHAR(16),sm_fixture_id BIGINT)");}
}
foreach($m['triggers'] as $t)$p->exec('CREATE TRIGGER `'.$t['TRIGGER_NAME'].'` '.$t['ACTION_TIMING'].' '.$t['EVENT_MANIPULATION'].' ON '.$t['EVENT_OBJECT_TABLE'].' FOR EACH ROW '.$t['ACTION_STATEMENT']);
$p->exec("INSERT INTO Sql1956795_1.`IMC Manager Codex Global` VALUES (1,99)");
$p->exec("INSERT INTO Sql1956795_1.`IMC Manager Assignment Global` VALUES (1,'GW001','club',NULL,10,'2020-01-01',NULL),(1,'GW001','national_team',10,NULL,'2020-01-01',NULL)");
$p->exec("INSERT INTO IMC001_Results(game_world_id,competition_key,sm_action,competition_group,sm_division,sm_fixture_id,match_date,imc_season,home_sm_club_id,away_sm_club_id,home_score,away_score,fingerprint) VALUES ('GW001','GW001|DOMESTIC|league|1','league','DOMESTIC','1',101,'2026-01-01',2,10,20,3,1,'unchanged')");
foreach($m['statements'] as $sql)$p->exec($sql);
$p->exec("UPDATE IMC001_Results SET game_world_id='GW001' WHERE sm_fixture_id=101");
function checkStorage(bool $ok):void{if(!$ok)throw new RuntimeException('storage assertion failed');}
$r=$p->query('SELECT * FROM IMC001_Results')->fetch(PDO::FETCH_ASSOC);
checkStorage($r['game_world_id']==='IMC001'&&$r['competition_key']==='IMC001|DOMESTIC|league|1'&&$r['fingerprint']==='unchanged'&&(int)$r['imc_season']===2&&(int)$r['home_sm_manager_id']===99);
$r=$p->query('SELECT * FROM GW001_IMC_Results')->fetch(PDO::FETCH_ASSOC);checkStorage($r['game_world_id']==='GW001'&&$r['competition_key']==='GW001|DOMESTIC|league|1');
foreach(['DOMESTIC'=>'leaguecup','NATIONS'=>'worldcup'] as $group=>$action){
 $p->exec("INSERT INTO IMC001_Results(game_world_id,competition_key,sm_action,competition_group,sm_division,sm_fixture_id,match_date,imc_season,home_sm_club_id,away_sm_club_id) VALUES ('IMC001','IMC001|$group|$action','".$action."','$group','1',102,'2026-01-01',2,10,20)");
}
checkStorage((int)$p->query('SELECT COUNT(*) FROM IMC001_Results WHERE home_sm_manager_id=99 AND game_world_id=\'IMC001\'')->fetchColumn()===3);
$p->exec("UPDATE GW001_IMC_Results SET home_sm_manager_id=88 WHERE game_world_id='GW001' AND sm_fixture_id=101");
checkStorage((int)$p->query('SELECT home_sm_manager_id FROM IMC001_Results WHERE sm_fixture_id=101')->fetchColumn()===88);
$p->exec("INSERT INTO IMC001_Results(game_world_id,competition_key,sm_action,competition_group,sm_division,sm_fixture_id,match_date,imc_season,home_sm_club_id,away_sm_club_id) VALUES ('IMC001','IMC001|DOMESTIC|playoff|2','playoff','DOMESTIC','2',103,'2026-01-02',2,10,20)");
$r=$p->query('SELECT * FROM IMC001_Results WHERE sm_fixture_id=103')->fetch(PDO::FETCH_ASSOC);checkStorage($r['competition_key']==='IMC001|DOMESTIC|playoff|1'&&$r['sm_division']==='1');
$p->exec("INSERT INTO IMC001_Results(game_world_id,competition_key,home_name,away_name,home_score,away_score) VALUES ('IMC001','IMC001_IMC_CHAMPIONS_LEAGUE','Porto','Roma',4,1)");
$r=$p->query("SELECT * FROM IMC001_Results WHERE home_name='Porto'")->fetch(PDO::FETCH_ASSOC);checkStorage((int)$r['home_score']===0&&(int)$r['away_score']===3&&$r['competition_key']==='IMC001_IMC_CHAMPIONS_LEAGUE');
$p->exec("INSERT INTO IMC006_Results(game_world_id,competition_key) VALUES ('IMC-006','IMC-006|NATIONS|worldcup')");
$r=$p->query('SELECT * FROM IMC006_Results')->fetch(PDO::FETCH_ASSOC);checkStorage($r['game_world_id']==='IMC006'&&$r['competition_key']==='IMC006|NATIONS|worldcup');
echo "PASS MySQL: canonical storage, legacy views, club/nation assignments, MR manager update, playoff and guest triggers, reserved worlds.\n";

// RTH cup migration: canonical cup keys, legacy views, guest awards and future writes.
$p->exec('RENAME TABLE GW001_IMC_Match_Report TO IMC001_Match_Reports');
$p->exec('ALTER TABLE IMC001_Match_Reports ADD competition_key VARCHAR(255)');
$p->exec('CREATE VIEW GW001_IMC_Match_Report AS SELECT * FROM IMC001_Match_Reports');
$p->exec('CREATE TABLE IMC001_Schedule (competition_key VARCHAR(255))');
foreach(json_decode(file_get_contents(__DIR__.'/fixtures/rth-cup-key-schema.json'),true,512,JSON_THROW_ON_ERROR) as $sql)$p->exec($sql);
foreach(['GW001_IMC_CHAMPIONS_LEAGUE','IMC001_IMC_CHAMPIONS_LEAGUE','IMC001|IMC|championsleague'] as $cupKey){
 $s=$p->prepare("INSERT INTO IMC001_Results(game_world_id,competition_key,home_name,away_name,home_score,away_score) VALUES ('IMC001',?,'Newcastle','Roma',9,1)");$s->execute([$cupKey]);
}
checkStorage((int)$p->query("SELECT COUNT(*) FROM GW001_IMC_Results WHERE home_name='Newcastle' AND competition_key='IMC001|IMC|championsleague' AND home_score=0 AND away_score=3")->fetchColumn()===3);
$p->exec("INSERT INTO IMC001_Match_Reports VALUES ('GW001',987,'GW001|IMC|europaleague')");
checkStorage($p->query('SELECT competition_key FROM IMC001_Match_Reports WHERE sm_fixture_id=987')->fetchColumn()==='IMC001|IMC|europaleague');
$p->exec("INSERT INTO IMC001_Schedule VALUES ('GW001_IMC_CONFERENCE_LEAGUE')");
checkStorage($p->query('SELECT competition_key FROM IMC001_Schedule')->fetchColumn()==='IMC001|IMC|conferenceleague');
echo "PASS RTH cup keys: old/new writes, legacy view reads, guest awards, Schedule and Match Report.\n";


// Transfer transport accepts schema fields without imposing an importer payload shape.
require_once __DIR__.'/../imc-universal-gateway/core.php';
require_once __DIR__.'/../imc-universal-gateway/write.php';
$p->exec('CREATE TABLE IMC006_Transfers (game_world_id VARCHAR(16),imc_transfer_number INT UNSIGNED,player_id INT UNSIGNED,player_name VARCHAR(255),club_from VARCHAR(255),from_sm_world_club_id BIGINT UNSIGNED,club_to VARCHAR(255),to_sm_world_club_id BIGINT UNSIGNED,transfer_date DATE,amount_text VARCHAR(255),exchange_players JSON,imported_at DATETIME,imc_season INT,player_rating INT UNSIGNED)');
$p->exec('CREATE VIEW GW004_IMC_Transfers AS SELECT * FROM IMC006_Transfers');
$transfer=['game_world_id'=>'GW004','imc_transfer_number'=>1,'player_id'=>156902,'player_name'=>'Test Player','club_from'=>'Club A','from_sm_world_club_id'=>10,'club_to'=>'Club B','to_sm_world_club_id'=>20,'transfer_date'=>'2026-11-15','amount_text'=>'720k','exchange_players'=>'[]','imported_at'=>'2026-11-15 08:00:00','imc_season'=>3,'player_rating'=>70];
checkStorage(imc_insert($p,'GW004_IMC_Transfers',$transfer)===1);
$saved=$p->query('SELECT * FROM IMC006_Transfers WHERE imc_transfer_number=1')->fetch(PDO::FETCH_ASSOC);
checkStorage((int)$saved['imc_season']===3 && (int)$saved['player_rating']===70 && $saved['transfer_date']===$transfer['transfer_date']);
$older=$transfer;$older['imc_transfer_number']=2;$older['transfer_date']='2020-01-01';$older['imc_season']=1;
checkStorage(imc_insert($p,'GW004_IMC_Transfers',$older)===1);
checkStorage($p->query('SELECT transfer_date FROM IMC006_Transfers WHERE imc_transfer_number=2')->fetchColumn()==='2020-01-01');
$invalid=$transfer;$invalid['unknown_transfer_column']=1;
try {imc_insert($p,'GW004_IMC_Transfers',$invalid);throw new RuntimeException('unknown column accepted');}
catch(InvalidArgumentException $e){checkStorage($e->getMessage()==='column_not_found:unknown_transfer_column');}
checkStorage((int)$p->query('SELECT COUNT(*) FROM IMC006_Transfers')->fetchColumn()===2);
echo "PASS Transfer transport: schema fields, imc_season and source dates preserved; unknown database columns rejected.\\n";
