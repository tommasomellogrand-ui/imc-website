<?php
// Exercise the production endpoint with an isolated fixture file and database stubs.
class CapturedResponse extends Exception {public array $body;function __construct($body){$this->body=$body;}}
function nexus_out($body,$status=200){throw new CapturedResponse($body);}
function nexus_world($v){return $v;}
function nexus_season($v){return (int)$v;}
function nexus_config(){return [];}
function nexus_db($c,$t){return null;}
function nexus_rows($db,$sql,$params){return [];}
$dir=sys_get_temp_dir().'/imc-cups-test-'.bin2hex(random_bytes(6));mkdir($dir);
$data=json_decode(file_get_contents(__DIR__.'/../nexus/competitions/imc-cups.json'),true);
$code=file_get_contents(__DIR__.'/../nexus/competitions/imc-cups.php');
$code=str_replace(["<?php", "declare(strict_types=1);", "require dirname(__DIR__).'/core/bootstrap.php';",'__DIR__'],['','','',var_export($dir,true)],$code);
// nexus_out terminates a real response; let the test capture it outside the endpoint.
$code=str_replace('catch(Throwable $e){','catch(CapturedResponse $e){throw $e;}catch(Throwable $e){',$code);
function runCase($code,$dir,$data,$mode){file_put_contents($dir.'/imc-cups.json',json_encode($data));$_GET=['world'=>'GW001','season'=>'2','competition'=>'GW001_IMC_EUROPA_LEAGUE','mode'=>$mode];try{eval($code);}catch(CapturedResponse $e){return $e->body;}throw new Exception('No response');}
function check($v){if(!$v)throw new Exception('Assertion failed');}
try{
 $s=runCase($code,$dir,$data,'schedule');check($s['ok']&&count($s['rows'])===7);
 $t=runCase($code,$dir,$data,'standings');check($t['ok']&&count($t['rows'])===14&&array_sum(array_column($t['rows'],'played'))===0);
 $data[1]['matches'][0]['homeScore']=0;$data[1]['matches'][0]['awayScore']=0;
 $data[1]['matches'][1]['homeScore']=2;$data[1]['matches'][1]['awayScore']=1;
 $t=runCase($code,$dir,$data,'standings');check(array_sum(array_column($t['rows'],'points'))===5&&array_sum(array_column($t['rows'],'gf'))===3&&array_sum(array_column($t['rows'],'played'))===4);
 $s=runCase($code,$dir,$data,'schedule');check(count($s['rows'])===5);
 $r=runCase($code,$dir,$data,'results');check(count($r['rows'])===2);
 $data[1]['matches'][1]['homeScore']=1;$data[1]['matches'][1]['awayScore']=1;
 $t=runCase($code,$dir,$data,'standings');check(array_sum(array_column($t['rows'],'points'))===4);
 echo "IMC: fixtures, null scores, 0-0, victory and corrections passed.\n";
}finally{unlink($dir.'/imc-cups.json');rmdir($dir);}
