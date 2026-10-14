<?php
declare(strict_types=1);
require dirname(__DIR__).'/core/bootstrap.php';
require dirname(__DIR__).'/competitions/match-teams.php';
require dirname(__DIR__).'/competitions/standings-engine.php';

// Read-only preview context. The same standings engine powers competition tables.
function nexus_matchday_preview(array $fixture,array $results,array &$cache): ?array {
    $key=(string)$fixture['competition_key'];$day=substr((string)$fixture['match_date'],0,10);
    $prior=array_values(array_filter($results,static fn($r)=>(string)$r['competition_key']===$key&&substr((string)$r['match_date'],0,10)<$day));
    if(($fixture['sm_action']??'')==='league'){
        $cacheKey=$key.'|'.$day;
        if(!isset($cache[$cacheKey]))$cache[$cacheKey]=nexus_standings_tables($prior);
        $table=$cache[$cacheKey];if($table['grouped']||count($table['rows'])<2)return null;
        $byId=[];foreach($table['rows'] as $r)$byId[(string)$r['team_id']]=$r;
        $home=$byId[(string)($fixture['home_sm_club_id']??$fixture['home_sm_team_id']??'')]??null;
        $away=$byId[(string)($fixture['away_sm_club_id']??$fixture['away_sm_team_id']??'')]??null;
        if(!$home||!$away)return null;
        return ['type'=>'league','home'=>$home,'away'=>$away,'leader'=>$table['rows'][0],'second'=>$table['rows'][1],'teams'=>count($table['rows'])];
    }
    $phase=trim((string)($fixture['competition_stage']??'').' '.(string)($fixture['competition_round']??''));
    if(!preg_match('/\b(?:ritorno|second leg|2nd leg|leg 2)\b/i',$phase))return null;
    $normalize=static fn($s)=>strtolower(trim(preg_replace('/[\s:·-]+/u',' ',preg_replace('/\b(?:andata|ritorno|first leg|second leg|1st leg|2nd leg|leg [12])\b/i','',$s))));
    $wanted=$normalize($phase);$matches=[];
    $h=(string)($fixture['home_sm_club_id']??$fixture['home_sm_team_id']??'');$a=(string)($fixture['away_sm_club_id']??$fixture['away_sm_team_id']??'');
    if($h===''||$a===''||$h==='0'||$a==='0')return null;
    foreach($prior as $r){
        $p=trim((string)($r['competition_stage']??'').' '.(string)($r['competition_round']??''));
        if(!preg_match('/\b(?:andata|first leg|1st leg|leg 1)\b/i',$p)||$normalize($p)!==$wanted)continue;
        $rh=(string)($r['home_sm_club_id']??'');$ra=(string)($r['away_sm_club_id']??'');
        if(!(($rh===$h&&$ra===$a)||($rh===$a&&$ra===$h)))continue;
        $matches[(string)$r['sm_fixture_id']]=['type'=>'return','home_goals'=>(int)$r[$rh===$h?'home_score':'away_score'],'away_goals'=>(int)$r[$rh===$h?'away_score':'home_score'],'first_leg_fixture'=>$r['sm_fixture_id']];
    }
    return count($matches)===1?array_values($matches)[0]:null;
}
try {
    $c=nexus_config();$gw=nexus_world($_GET['world']??'');$season=nexus_season($_GET['season']??null);
    if($season===null)throw new InvalidArgumentException('season_required');
    $db=nexus_db($c,nexus_target($c,$gw));$core=nexus_db($c,'core');
    $rt=nexus_table($gw,'Results');$st=nexus_table($gw,'Schedule');
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d');
    $labels=[];foreach(nexus_rows($core,'SELECT competition_key,nexus_view FROM `IMC Competition Nexus Mapping` WHERE game_world_id=?',[$gw]) as $m)$labels[$m['competition_key']]=$m['nexus_view'];
    $matchday=($_GET['mode']??'')==='matchday';
    $out=['ok'=>true,'game_world_id'=>$gw,'season'=>$season,'errors'=>[]];
    $allResults=[];$previewCache=[];
    foreach(['results','schedule'] as $kind){
        try {
            if($kind==='results')$rows=nexus_rows($db,'SELECT * FROM `'.$rt.'` WHERE game_world_id=? AND imc_season=? AND home_score IS NOT NULL AND away_score IS NOT NULL ORDER BY match_date DESC,sm_fixture_id DESC '.($matchday?'':'LIMIT 6'),[$gw,$season]);
            else $rows=nexus_rows($db,'SELECT s.* FROM `'.$st.'` s WHERE s.game_world_id=? AND s.imc_season=? AND s.match_date>=? AND NOT EXISTS (SELECT 1 FROM `'.$rt.'` r WHERE r.sm_fixture_id=s.sm_fixture_id AND r.game_world_id=s.game_world_id AND r.home_score IS NOT NULL AND r.away_score IS NOT NULL) ORDER BY s.match_date ASC,s.match_time ASC,s.sm_fixture_id ASC '.($matchday?'':'LIMIT 6'),[$gw,$season,$today]);

            if($kind==='results'&&$matchday)$allResults=$rows;
            $rows=nexus_enrich_match_teams($core,$gw,$rows);
            if($matchday){
                // SQL ordering is newest first for results, nearest first for schedule.
                // One selected fixture per IMC team across ALL competitions, not per cup.
                // Keep every IMC match in the latest/next league round alongside other IMC competitions.
                $leagueTurns=[];$leagueFixtures=[];
                foreach($rows as $r){
                    if(($r['sm_action']??'')!=='league')continue;
                    $competition=(string)$r['competition_key'];
                    $round=trim((string)($r['competition_round']??''));
                    $turn=$round!==''?json_encode([(string)($r['competition_stage']??''),$round]):substr((string)$r['match_date'],0,10);
                    if(!isset($leagueTurns[$competition]))$leagueTurns[$competition]=$turn;
                    if($leagueTurns[$competition]===$turn)$leagueFixtures[(string)$r['sm_fixture_id']]=true;
                }
                $seenTeams=[];$seenFixtures=[];$selected=[];
                foreach($rows as $r){
                    $nation=($r['competition_group']??'')==='NATIONS'||strpos((string)$r['competition_key'],'|NATIONS|')!==false;
                    $chosen=[];
                    foreach(['home','away'] as $side){
                        if(($r['sm_action']??'')==='league')continue;
                        $id=(string)($r[$side.'_sm_club_id']??$r[$side.'_sm_team_id']??'');
                        $identity=($nation?'nation:':'club:').($id!==''&&$id!=='0'?$id:'name:'.nexus_team_name_key((string)$r[$side.'_name']));
                        if(!isset($seenTeams[$identity])){
                            $seenTeams[$identity]=true;
                            if(!empty($r[$side.'_imc_manager_id']))$chosen[]=$side;
                        }
                    }
                    $fixture=(string)($r['sm_fixture_id']??'');
                    $league=isset($leagueFixtures[$fixture]);
                    if(empty($r['home_imc_manager_id'])&&empty($r['away_imc_manager_id']))continue;
                    if((($r['sm_action']??'')==='league'&&!$league)||(!$chosen&&!$league)||isset($seenFixtures[$fixture]))continue;
                    $seenFixtures[$fixture]=true;
                    $r['matchday_league_complete']=$league;
                    $r['matchday_selected_sides']=$chosen;
                    $r['matchday_latest']=true;
                    $r['matchday_turn']=substr((string)$r['match_date'],0,10);
                    $selected[]=$r;
                }
                $rows=$selected;
            }
            $names=['charityshield'=>'Charity Shield','leaguecup'=>'National Cup','nationalcup'=>'National Cup','leagueshield'=>'League Cup','smfacup'=>'SMFA Champions','smfashield'=>'SMFA Shield','supercup'=>'SMFA Super Cup','interqualifier'=>'World Cup Qualifiers','worldcup'=>'World Cup'];
            foreach($rows as &$r){
                $action=strtolower(trim((string)$r['sm_action']));
                $parts=explode('|',(string)$r['competition_key']);$country=count($parts)>2&&!in_array($parts[1],['DOMESTIC','INTERNATIONAL','NATIONS'],true)?$parts[1]:null;
                $fallback=in_array($action,['league','playoff'],true)?'Div '.$r['sm_division'].($action==='playoff'?' Playoff':''):($names[$action]??$r['sm_action']);
                $r['nexus_view']=$labels[$r['competition_key']]??(($country?$country.' ':'').$fallback);
            }unset($r);
            
            if($matchday&&$kind==='results'){
                $reports=[];
                try{foreach(nexus_rows($db,'SELECT sm_fixture_id FROM `'.nexus_table($gw,'Match_Report').'` WHERE game_world_id=? AND imc_season=?',[$gw,$season]) as $report)$reports[(string)$report['sm_fixture_id']]=true;}
                catch(Throwable $e){$out['errors']['reports']='data_unavailable';}
                foreach($rows as &$r)$r['has_match_report']=isset($reports[(string)$r['sm_fixture_id']]);unset($r);
            }
            if($matchday&&$kind==='schedule')foreach($rows as &$r){
                try{$r['preview_context']=nexus_matchday_preview($r,$allResults,$previewCache);}
                catch(Throwable $e){$r['preview_context']=null;}
            }unset($r);
            $out[$kind]=$rows;
        }catch(Throwable $e){$out[$kind]=[];$out['errors'][$kind]='data_unavailable';}
    }
    nexus_out($out);
}catch(InvalidArgumentException $e){nexus_out(['ok'=>false,'error'=>$e->getMessage()],422);}catch(Throwable $e){nexus_out(['ok'=>false,'error'=>'home_error'],500);}

