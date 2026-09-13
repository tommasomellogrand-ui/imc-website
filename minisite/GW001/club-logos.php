<?php
/** GW001 Competition Hub · read-only club crest lookup from CORE. */
declare(strict_types=1);
require_once dirname(__DIR__, 2).'/imc-universal-gateway/minisite.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300, stale-while-revalidate=600');

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        imc_minisite_out(['ok'=>false,'error'=>'method_not_allowed'],405);
    }
    $body=json_decode(file_get_contents('php://input'),true,16,JSON_THROW_ON_ERROR);
    $ids=$body['club_gw_ids'] ?? null;
    if (!is_array($ids) || count($ids)>250) throw new InvalidArgumentException('invalid_ids');
    $clean=[];
    foreach ($ids as $id) {
        $value=trim((string)$id);
        if (!preg_match('/^[0-9]+$/',$value)) throw new InvalidArgumentException('invalid_ids');
        $clean[$value]=$value;
    }
    if (!$clean) imc_minisite_out(['ok'=>true,'game_world_id'=>'GW001','logos'=>[]]);

    $pdo=imc_minisite_db(imc_minisite_config());
    $values=array_values($clean);
    $placeholders=implode(',',array_fill(0,count($values),'?'));
    $rows=imc_minisite_rows(
        $pdo,
        "SELECT m.club_gw_id,c.image_url FROM clubs_game_world_id m JOIN clubs c ON c.club_id=m.club_id WHERE m.game_world_id='GW001' AND m.club_gw_id IN ($placeholders)",
        $values
    );
    $logos=[];
    foreach ($rows as $row) {
        $url=trim((string)($row['image_url'] ?? ''));
        if ($url==='') continue;
        $logos[(string)$row['club_gw_id']]=preg_replace('/^http:/i','https:',$url);
    }
    imc_minisite_out(['ok'=>true,'game_world_id'=>'GW001','logos'=>$logos]);
} catch (InvalidArgumentException|JsonException $e) {
    imc_minisite_out(['ok'=>false,'error'=>'invalid_request'],422);
} catch (Throwable $e) {
    imc_minisite_out(['ok'=>false,'error'=>'read_unavailable'],503);
}
