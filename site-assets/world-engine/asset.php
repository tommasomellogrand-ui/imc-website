<?php
declare(strict_types=1);
$worlds = require __DIR__.'/worlds.php';
$world=(string)($_GET['world']??'');
$module=(string)($_GET['module']??'');
$modules=['clubs/detail.js','clubs/directory.js','competitions/match.js','competitions/row-summary.js','managers/data-room.js','managers/directory.js','managers/h2h.js','managers/history-overview.js','managers/manager-profile.js','managers/trophy-room.js','nations/detail.js','nations/directory.js','playercodex/directory.js','playercodex/profile.js','transfers/cards.js','transfers/transfers.js','trophyroom/page.js','trophyroom/trophy-room.js','competitions/catalog.js','competitions/context.js','competitions/cup.js','competitions/page.js','competitions/cup-model.js','matchday/index.js'];
header('Content-Type: application/javascript; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
if(!isset($worlds[$world])||!in_array($module,$modules,true)){
 http_response_code(404);echo '/* Unknown world or module. */';exit;
}
$source=file_get_contents(__DIR__.'/templates/'.$module);
if($source===false){http_response_code(503);exit;}
[$id,$name,$players]=$worlds[$world];
$source=strtr($source,['__WORLD_SLUG__'=>$world,'__WORLD_ID__'=>$id,'__WORLD_NAME__'=>$name,'__PLAYER_PATH__'=>$players]);
$etag='"'.hash('sha256',$source).'"';
header('Cache-Control: public, max-age=0, must-revalidate');
header('ETag: '.$etag);
if(trim((string)($_SERVER['HTTP_IF_NONE_MATCH']??''))===$etag){http_response_code(304);exit;}
echo $source;
