<?php
declare(strict_types=1);

function nexus_roster_group(string $position): string {
  // Remove lateral qualifiers before matching: Dx/Sx must not classify midfielders as defenders.
  $roles=explode(',',strtoupper(preg_replace('/\([^)]*\)/','',$position)));
  foreach($roles as $role){
    $role=trim($role);
    if(in_array($role,['PT','GK','PORTIERE'],true))return 'Portieri';
    if(in_array($role,['D','DEF','CB','LB','RB','WB'],true))return 'Difensori';
    if(in_array($role,['CD','CC','CO','M','DM','CM','AM','LM','RM','MID'],true))return 'Centrocampisti';
    if(in_array($role,['A','F','FW','ST','CF','W'],true))return 'Attaccanti';
  }
  return 'Ruolo non disponibile';
}

function nexus_roster_minute(mixed $v): ?int {
  if($v===null||$v==='')return null;
  if(!preg_match('/^(\d+)(?:\+(\d+))?$/',trim((string)$v),$m))return null;
  return (int)$m[1]+(int)($m[2]??0);
}

function nexus_roster_stats(array $roster,array $reports,int $club): array {
  $players=[];$seenFixtures=[];$used=0;$invalid=0;
  foreach($roster as $p){
    $id=(int)$p['player_id'];if($id<1)continue;
    $players[$id]=array_merge($p,['appearances'=>0,'starts'=>0,'subs'=>0,'bench'=>0,'minutes'=>0,'minutes_missing'=>0,'goals'=>0,'assists'=>0,'average_rating'=>null,'mom'=>0,'yellow'=>0,'red'=>0,'rating_sum'=>0,'rated_matches'=>0]);
  }
  $count=static fn($v): int=>is_numeric($v)?max(0,(int)$v):0;
  foreach($reports as $report){
    $fixture=(string)($report['sm_fixture_id']??'');if($fixture===''||isset($seenFixtures[$fixture]))continue;
    if((int)$report['home_sm_club_id']===$club)$side='home';elseif((int)$report['away_sm_club_id']===$club)$side='away';else continue;
    if($report['home_score']===null||$report['away_score']===null)continue;
    $entries=json_decode((string)$report['players_json'],true);
    if(!is_array($entries)||!array_is_list($entries)||!$entries){$invalid++;continue;}
    $seenFixtures[$fixture]=true;$used++;$seen=[];
    // Read the end of play from the report; shootout commentary at minute 91 is not playing time.
    $duration=null;
    foreach(json_decode((string)($report['commentary_json']??'[]'),true)??[] as $event){
      $text=(string)($event['commentary_text']??'');$minute=nexus_roster_minute($event['minute']??null);
      if($minute!==null&&preg_match('/fine secondo tempo|fine.*supplementar|full.?time|end of.*(?:second half|extra time)/iu',$text))$duration=max($duration??0,$minute);
    }
    foreach($entries as $p){
      if(!is_array($p)||($p['team_side']??'')!==$side)continue;
      $id=(int)($p['sm_player_id']??0);if(!isset($players[$id])||isset($seen[$id]))continue;$seen[$id]=true;
      $row=&$players[$id];$start=$count($p['starter']??0)>0;$on=nexus_roster_minute($p['sub_on_minute']??null);
      $rating=is_numeric($p['rating']??null)&&(float)$p['rating']>0&&(float)$p['rating']<=10?(float)$p['rating']:null;
      $goals=max($count($p['goals']??0),is_array($p['goal_minutes']??null)?count($p['goal_minutes']):0);
      $assists=$count($p['assists']??0);$mom=(int)($count($p['man_of_match']??0)>0);
      $sub=!$start&&($on!==null||$rating!==null||$goals>0||$assists>0||$mom>0);
      $played=$start||$sub;
      $row['starts']+=(int)$start;$row['subs']+=(int)$sub;$row['appearances']+=(int)$played;
      $row['bench']+=(int)(!$played&&$count($p['substitute']??0)>0);
      $row['goals']+=$goals;$row['assists']+=$assists;$row['mom']+=$mom;$row['yellow']+=$count($p['yellow_card']??0);$row['red']+=$count($p['red_card']??0);
      if($played){
        $from=$start?0:$on;$to=nexus_roster_minute($p['sub_off_minute']??null);$red=nexus_roster_minute($p['red_card_minute']??null);
        if($red!==null)$to=$to===null?$red:min($to,$red);
        if($to===null)$to=$duration;
        if($duration!==null&&$to!==null)$to=min($duration,$to);
        if($from===null||$to===null||$to<$from)$row['minutes_missing']++;else $row['minutes']+=$to-$from;
      }
      if($played&&$rating!==null){$row['rating_sum']+=$rating;$row['rated_matches']++;}
      unset($row);
    }
  }
  foreach($players as &$row){
    $row['average_rating']=$row['rated_matches']?round($row['rating_sum']/$row['rated_matches'],2):null;
    if($row['minutes_missing'])$row['minutes']=null;
    unset($row['rating_sum']);$row['role_group']=nexus_roster_group((string)($row['position']??''));
  }unset($row);
  return ['rows'=>array_values($players),'reports'=>$used,'invalid_reports'=>$invalid];
}
