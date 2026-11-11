<?php
declare(strict_types=1);
$_GET['world'] = 'GW011';
require __DIR__.'/youth-audit.php';
ob_start(static function (string $output): string {
    $response=json_decode($output,true);
    if (empty($response['ok']) || empty($response['rows'])) return $output;
    $config=imc_site_config();
    $db=imc_site_db($config,imc_site_target($config,'GW011'));
    $response['rows']=subbuteo_youth_results($db,$response['rows']);
    return json_encode($response,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
});
require dirname(__DIR__, 2) . '/site-data/competitions/results.php';

