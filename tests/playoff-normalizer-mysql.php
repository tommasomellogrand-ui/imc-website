<?php
declare(strict_types=1);
// Dedicated CI MySQL only. No production configuration is read or overwritten.
$password = getenv('IMC_TEST_MYSQL_PASSWORD');
if (!$password) throw new RuntimeException('CI MySQL password required');
$db = new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4','root',$password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$db->exec('CREATE DATABASE imc_normalizer_test_core');
$db->exec('CREATE DATABASE imc_normalizer_test_world');
$tmp=sys_get_temp_dir().'/imc-playoff-'.bin2hex(random_bytes(8));
mkdir($tmp.'/imc-universal-gateway',0700,true);
mkdir($tmp.'/__imc_private_gateway',0700,true);
copy(__DIR__.'/../imc-universal-gateway/playoff-normalizer.php',$tmp.'/imc-universal-gateway/playoff-normalizer.php');
$cfg=['db'=>['host'=>'127.0.0.1','port'=>3306,'core'=>'imc_normalizer_test_core','user'=>'root','pass'=>$password]];
file_put_contents($tmp.'/__imc_private_gateway/config.php','<?php return '.var_export($cfg,true).';');
require $tmp.'/imc-universal-gateway/playoff-normalizer.php';
function verify(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);}
try {
    $db->exec('USE imc_normalizer_test_core');
    $db->exec('CREATE TABLE `IMC Game World Season` (game_world_id VARCHAR(16),imc_season INT,imc_season_start_date DATE,imc_season_end_date DATE)');
    $db->exec("INSERT INTO `IMC Game World Season` VALUES ('GW001',1,'2026-07-12','2026-09-20')");
    $db->exec('USE imc_normalizer_test_world');
    foreach(['Results','Match Report'] as $repo) $db->exec("CREATE TABLE `GW001_IMC_{$repo}` (game_world_id VARCHAR(16),sm_fixture_id BIGINT,sm_action VARCHAR(64),sm_country VARCHAR(128),sm_division VARCHAR(128),competition_group VARCHAR(64),competition_key VARCHAR(255),competition_stage VARCHAR(128),competition_round VARCHAR(128),match_date DATE,home_sm_club_id BIGINT,away_sm_club_id BIGINT,home_score INT,fingerprint CHAR(64)) ENGINE=InnoDB");
    $insert=function(string $repo,int $id,string $action,string $stage,string $date,string $division)use($db):int{
        $s=$db->prepare("INSERT INTO `GW001_IMC_{$repo}` (game_world_id,sm_fixture_id,sm_action,sm_division,competition_group,competition_key,competition_stage,match_date,home_sm_club_id,away_sm_club_id,home_score,fingerprint) VALUES ('GW001',?,?,?,'DOMESTIC','GW001|DOMESTIC|league|4',?,?,11,22,3,'original-import-fingerprint')");
        $s->execute([$id,$action,$division,$stage,$date]);return $s->rowCount();
    };
    $first=imc_playoff_import($db,'GW001_IMC_Results',true,function()use($insert){return $insert('Results',100,'playoff','Playoff Finale','2026-09-14','4')+$insert('Match Report',100,'league','Playoff Finale','2026-09-14','4');});
    verify($first['normalization']['unresolved']===2,'out-of-order pending');
    verify($db->query('SELECT competition_key FROM `GW001_IMC_Results`')->fetchColumn()===null,'guessed key cleared');
    $next=imc_playoff_import($db,'GW001_IMC_Results',true,fn()=>$insert('Results',99,'league','Giornata 18','2026-09-10','2'));
    verify($next['normalization']['unresolved']===0 && $next['normalization']['updated']===2,'late league reconciles both repositories');
    foreach(['Results','Match Report'] as $repo){
        $r=$db->query("SELECT * FROM `GW001_IMC_{$repo}` WHERE sm_fixture_id=100")->fetch();
        verify($r['competition_key']==='GW001|DOMESTIC|playoff|2' && $r['sm_action']==='playoff','canonical output');
        verify((int)$r['home_score']===3 && $r['fingerprint']==='original-import-fingerprint','source values preserved');
    }
    $again=imc_playoff_import($db,'GW001_IMC_Results',true,fn()=>0);
    verify($again['normalization']['updated']===0,'idempotent');
    try {imc_playoff_import($db,'GW001_IMC_Results',true,function()use($insert){$insert('Results',101,'league','','2026-09-10','2');throw new RuntimeException('test rollback');});}catch(RuntimeException $e){verify($e->getMessage()==='test rollback','expected error');}
    verify((int)$db->query('SELECT COUNT(*) FROM `GW001_IMC_Results` WHERE sm_fixture_id=101')->fetchColumn()===0,'failed batch rollback');
    verify((int)$db->query("SELECT IS_FREE_LOCK('imc_playoff_GW001')")->fetchColumn()===1,'lock released on failure');
    $db->exec('DROP TABLE imc_normalizer_test_core.`IMC Game World Season`');
    try {imc_playoff_import($db,'GW001_IMC_Results',true,fn()=>$insert('Results',102,'league','','2026-09-10','2'));throw new RuntimeException('missing CORE accepted');}catch(PDOException $e){}
    verify((int)$db->query('SELECT COUNT(*) FROM `GW001_IMC_Results` WHERE sm_fixture_id=102')->fetchColumn()===0,'CORE failure rolls back import');
    echo "MySQL integration: all assertions passed\n";
} finally {
    $db->exec('DROP DATABASE imc_normalizer_test_world');
    $db->exec('DROP DATABASE imc_normalizer_test_core');
    unlink($tmp.'/__imc_private_gateway/config.php');
    unlink($tmp.'/imc-universal-gateway/playoff-normalizer.php');
    rmdir($tmp.'/__imc_private_gateway');rmdir($tmp.'/imc-universal-gateway');rmdir($tmp);
}
