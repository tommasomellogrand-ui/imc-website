<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require __DIR__.'/engine.php';
try {
    $c = imc_site_config();
    $gw = isset($_GET['world']) && $_GET['world'] !== ''
        ? imc_site_world($_GET['world']) : null;
    $season = imc_site_season($_GET['season'] ?? null);
    $club = null;
    if (array_key_exists('sm_club',$_GET)) {
        $club=filter_var($_GET['sm_club'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
        if ($club===false || $gw===null) throw new InvalidArgumentException('invalid_club_scope');
    }
    $nation=null;
    if (array_key_exists('sm_nation',$_GET)) {
        $nation=filter_var($_GET['sm_nation'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
        if ($nation===false || $gw===null || $club!==null) throw new InvalidArgumentException('invalid_nation_scope');
    }
    $manager=null;$assignments=[];$nationalManagers=[];
    if (array_key_exists('manager',$_GET)) {
        $manager=trim((string)$_GET['manager']);
        if ($manager==='' || strlen($manager)>255 || $gw===null) throw new InvalidArgumentException('invalid_manager_scope');
        $core=imc_site_db($c,'core');
        // Read all club tenures in this world to detect conflicting managers on the award date.
        $assignments=imc_site_rows($core,"SELECT game_world_id,manager_id,assignment_type,team_id,national_team_id,start_date,end_date FROM `IMC Manager Assignment Global` WHERE game_world_id=?",[$gw]);
        $codex=[];foreach(imc_site_rows($core,'SELECT manager_id,sm_manager_id FROM `IMC Manager Codex Global` WHERE sm_manager_id IS NOT NULL') as $m)if((int)$m['sm_manager_id']>0)$codex[(string)$m['sm_manager_id']]=$m['manager_id'];
        $worldDb=imc_site_db($c,imc_site_target($c,$gw));
        foreach(imc_site_rows($worldDb,'SELECT sm_fixture_id,home_sm_manager_id,away_sm_manager_id,home_score,away_score,penalty_home_score,penalty_away_score FROM `'.imc_site_table($gw,'Match_Report').'` WHERE game_world_id=? AND competition_group=?',[$gw,'NATIONS']) as $r){
            $home=(int)($r['home_score']??0);$away=(int)($r['away_score']??0);$ph=$r['penalty_home_score']??null;$pa=$r['penalty_away_score']??null;
            $side=($ph!==null&&$pa!==null&&(int)$ph!==(int)$pa)?((int)$ph>(int)$pa?'home':'away'):($home!==$away?($home>$away?'home':'away'):null);
            if($side===null)continue;$sm=(string)($r[$side.'_sm_manager_id']??'');if(isset($codex[$sm]))$nationalManagers[(string)$r['sm_fixture_id']]=$codex[$sm];
        }
    }
    // Keep the unfiltered endpoint available, using only the individual GW tables.
    $worlds = $gw !== null ? [$gw] : array_keys(SITE_WORLD_TABLES);
    $connections = [];
    $rows = [];
    foreach ($worlds as $world) {
        $target = imc_site_target($c, $world);
        $connections[$target] ??= imc_site_db($c, $target);

        // World identifiers are validated above or generated from the supported range.
        $table = imc_site_table($world,'Trophy_Room');
        $sql = 'SELECT * FROM `'.$table.'` WHERE game_world_id=?';
        $params = [$world];
        if ($season !== null) {
            $sql .= ' AND imc_season=?';
            $params[] = $season;
        }
        if ($club!==null) {
            $sql .= " AND winner_sm_world_club_id=? AND COALESCE(competition_group,'')<>'NATIONS' AND trophy_type NOT IN ('worldcup','interqualifier')";
            $params[]=$club;
        }
        if ($nation!==null) {
            $sql .= " AND winner_sm_world_club_id=? AND (competition_group='NATIONS' OR trophy_type IN ('worldcup','interqualifier'))";
            $params[]=$nation;
        }
        $sql .= ' ORDER BY game_world_id,imc_season,id';
        foreach (imc_site_rows($connections[$target], $sql, $params) as $row) {
            if ($manager!==null) {
                $winnerManager=trophy_manager_at_win($row,$assignments,$nationalManagers);
                if ($winnerManager!==$manager) continue;
                $row['winner_manager_id']=$winnerManager;
            }
            $rows[] = $row;
        }
    }
    imc_site_out(['ok'=>true, 'rows'=>$rows]);
} catch (InvalidArgumentException $e) {
    imc_site_out(['ok'=>false, 'error'=>$e->getMessage()], 422);
} catch (Throwable $e) {
    imc_site_out(['ok'=>false, 'error'=>'trophies_error'], 500);
}

