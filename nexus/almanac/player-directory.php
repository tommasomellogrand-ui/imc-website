<?php
declare(strict_types=1);
// Directory queries are independent of Results and Match Reports. Keep every
// global player identity visible, with missing ratings after known ratings.
function na_player_directory(PDO $core,string $term,int $page,int $size=60): array {
    $from=' FROM `IMC Player Codex Global` p LEFT JOIN `IMC Player Codex Global Data` d ON d.player_id=p.id';
    $where='';$params=[];
    if($term!==''){$where=" WHERE d.full_name LIKE ? OR CONCAT_WS(' ',p.forename,p.surname) LIKE ? OR p.id=?";$like='%'.$term.'%';$params=[$like,$like,ctype_digit($term)?(int)$term:0];}
    $total=(int)nexus_rows($core,'SELECT COUNT(*) total'.$from.$where,$params)[0]['total'];$pages=max(1,(int)ceil($total/$size));$page=max(1,min($page,$pages));$offset=($page-1)*$size;
    $rows=nexus_rows($core,"SELECT p.id player_id,COALESCE(NULLIF(d.full_name,''),CONCAT_WS(' ',p.forename,p.surname)) player_name,p.image_url,d.rating,d.position,d.age".$from.$where.' ORDER BY (d.rating IS NULL),d.rating DESC,player_name,p.id LIMIT '.$size.' OFFSET '.$offset,$params);
    return ['rows'=>$rows,'total'=>$total,'page'=>$page,'pages'=>$pages,'size'=>$size];
}
