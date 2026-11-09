<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
header('Cache-Control: no-store');
$worlds = ['IMC-001' => ['Road To History', '/roadtohistory/'],
'IMC-002' => ['Hall Of Famers', '/halloffamers/'],
'IMC-003' => ['Kick Off', '/kickoff/'],
'IMC-004' => ['Sensible Soccer Academy', '/sensiblesocceracademy/'],
'IMC-005' => ['Subbuteo Super League', '/subbuteosuperleague/'],
'IMC-006' => ['World League', '/worldleague/'],
'IMC-007' => ['Master League World', '/masterleagueworld/'],
'IMC-008' => ['Scudetto', '/scudetto/']];
$today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
$data=[];
try {
 $db=nexus_db(nexus_config(),'core');
 $rows=nexus_rows($db,"SELECT w.`IMC_WORLD_ID` code,w.`Active Club` teams,
 (SELECT COUNT(DISTINCT a.manager_id) FROM `IMC Manager Assignment Global` a WHERE a.game_world_id=w.`IMC GW` AND a.assignment_type='club' AND a.team_id IS NOT NULL AND (a.start_date IS NULL OR a.start_date<='$today') AND (a.end_date IS NULL OR a.end_date>='$today')) managers,
 (SELECT s.imc_season FROM `IMC Game World Season` s WHERE s.game_world_id=w.`IMC GW` AND s.imc_season_start_date<='$today' AND (s.imc_season_end_date IS NULL OR s.imc_season_end_date>='$today') ORDER BY s.imc_season_start_date DESC LIMIT 1) season
 FROM `IMC Game World Codex Global` w WHERE w.IMC_WORLD_ID BETWEEN 'IMC-001' AND 'IMC-008'");
 $data=array_column($rows,null,'code');
} catch(Throwable $e){error_log('World Center: '.$e->getMessage());}
function metric($value){return $value===null?'—':(int)$value;}
?>
<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#29221b"><title>World Center · IMC Campus</title><style>
*{box-sizing:border-box}body{margin:0;background:#29221b;font-family:Inter,system-ui,sans-serif;color:white}main{min-height:100svh;display:flex;align-items:flex-end;justify-content:center;background:linear-gradient(0deg,#2b211977,transparent 40%),url(room.webp) center 43%/cover}
nav{width:min(94%,560px);margin:56svh auto max(2svh,env(safe-area-inset-bottom));padding:8px 12px;background:#241d18dc;border:1px solid #c9a97699;border-radius:8px;backdrop-filter:blur(8px)}h1{text-align:center;font-size:clamp(17px,3vh,23px);margin:0 0 6px}.worlds{display:grid;grid-template-columns:1fr 1fr}.worlds a{display:grid;align-content:center;position:relative;gap:2px;padding:6px 13px 6px 6px;border-top:1px solid #a18a69;color:inherit;text-decoration:none;min-height:48px}.worlds a:nth-child(even){border-left:1px solid #a18a69;padding-left:10px}.worlds a:after{content:'›';position:absolute;right:3px;top:38%;color:#e9cfa0}.worlds small{font-size:10px;color:#ffd68c}.worlds strong{font-size:clamp(13px,3.5vw,17px);line-height:1.08}.worlds span{font-size:clamp(10px,2.7vw,12px)}a:focus-visible{outline:2px solid gold;outline-offset:-2px}
@media(min-aspect-ratio:3/4){body{background:linear-gradient(#231d18da,#231d18da),url(room.webp) center/cover fixed}main{max-width:660px;margin:auto;background-size:100% 100%}}
</style></head><body><main><nav aria-labelledby="world-title"><h1 id="world-title">Mondi di gioco</h1><div class="worlds"><?php foreach($worlds as $code=>[$name,$url]): $w=$data[$code]??[]; ?><a href="<?=$url?>"><small><?=$code?> · Stagione IMC <?=metric($w['season']??null)?></small><strong><?=$name?></strong><span><?=metric($w['managers']??null)?> manager / <?=metric($w['teams']??null)?> active team</span></a><?php endforeach ?></div></nav></main></body></html>