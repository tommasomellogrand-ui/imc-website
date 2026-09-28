<?php
declare(strict_types=1);

const NA_TABLE = '`IMC Manager Assignment Global`';

function na_date(mixed $value, bool $optional=false): ?string {
    if ($optional && ($value===null || $value==='')) return null;
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) throw new InvalidArgumentException('Data non valida.');
    [$y,$m,$d]=array_map('intval',explode('-',$value));
    if ($y<1900 || !checkdate($m,$d,$y)) throw new InvalidArgumentException('Data non valida.');
    return $value;
}
function na_version(array $row): string {
    return hash('sha256',json_encode($row,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}
function na_options(PDO $db,string $gw): array {
    $clubs=nexus_rows($db,'SELECT `SM World Club ID` id,`Club Name` name FROM `IMC Game World Club Mapping` WHERE `Game World`=? AND `SM World Club ID`>0 ORDER BY `Club Name`',[$gw]);
    $nations=nexus_rows($db,'SELECT COALESCE(NULLIF(`SM World National Club ID`,0),`National Team ID`) id,`National Team ID` codex_id,`National Team Name` name,`SM National Team ID` sm_id,`SM World National Club ID` world_id FROM `IMC Game World National Team Mapping` WHERE `Game World`=? ORDER BY `National Team Name`',[$gw]);
    return ['club'=>$clubs,'national_team'=>$nations];
}
function na_team(array $options,string $type,int $id): ?array {
    $matches=[];
    foreach ($options[$type]??[] as $team) {
        $ids=$type==='club'?[$team['id']]:[$team['id'],$team['codex_id'],$team['sm_id'],$team['world_id']];
        if ($id>0 && in_array($id,array_map('intval',$ids),true)) $matches[(string)$team['id']]=$team;
    }
    return count($matches)===1?array_values($matches)[0]:null;
}
function na_team_key(array $options,array $row): string {
    $type=$row['assignment_type'];
    $id=(int)($type==='club'?$row['team_id']:$row['national_team_id']);
    $team=na_team($options,$type,$id);
    return $type.':'.($team['id']??$id);
}
function na_conflicts(array $rows,array $candidate,array $options,int $ignore=0): void {
    foreach ($rows as $row) {
        if ((int)$row['id']===$ignore || $row['assignment_type']!==$candidate['assignment_type']) continue;
        if ($row['start_date']>($candidate['end_date']??'9999-12-31') || ($row['end_date']??'9999-12-31')<$candidate['start_date']) continue;
        if ($row['manager_id']===$candidate['manager_id'] || na_team_key($options,$row)===na_team_key($options,$candidate)) {
            throw new InvalidArgumentException('Date sovrapposte all’incarico #'.$row['id'].' di '.$row['full_name'].'. Chiudi o correggi prima quell’incarico.');
        }
    }
}
function na_save(PDO $db,string $gw,array $input): array {
    $id=filter_var($input['id']??0,FILTER_VALIDATE_INT);
    if ($id===false || $id<0) throw new InvalidArgumentException('Incarico non valido.');
    $action=$input['action']??'save';
    if (!in_array($action,['save','close','replace'],true)) throw new InvalidArgumentException('Operazione non valida.');
    if ($action!=='save' && !$id) throw new InvalidArgumentException('Seleziona un incarico.');
    // Serialize panel writes per world, including insertion into an empty range.
    $lock='nexus-manager-assignments-'.$gw;
    if ((int)nexus_rows($db,'SELECT GET_LOCK(?,5) acquired',[$lock])[0]['acquired']!==1) throw new RuntimeException('Operazione in corso. Riprova.',409);
    try {
        $db->beginTransaction();
        $rows=nexus_rows($db,'SELECT * FROM '.NA_TABLE.' WHERE game_world_id=? ORDER BY id FOR UPDATE',[$gw]);
        $old=null;
        foreach ($rows as $r) if ((int)$r['id']===$id) $old=$r;
        if ($id && (!$old || !hash_equals(na_version($old),(string)($input['version']??'')))) throw new RuntimeException('L’incarico è cambiato. Ricarica i dati prima di salvare.',409);
        $options=na_options($db,$gw);
        if ($action==='close') {
            $end=na_date($input['end_date']??null);
            if ($end<$old['start_date']) throw new InvalidArgumentException('La fine precede l’inizio dell’incarico.');
            $candidate=$old;$candidate['end_date']=$end;
            // Shortening an existing interval must remain possible even with legacy overlaps.
            if ($old['end_date']!==null && $end>$old['end_date']) na_conflicts($rows,$candidate,$options,$id);
            $db->prepare('UPDATE '.NA_TABLE.' SET end_date=? WHERE id=? AND game_world_id=?')->execute([$end,$id,$gw]);
        } else {
            $manager=(string)($input['manager_id']??'');
            $people=nexus_rows($db,'SELECT manager_id,full_name FROM `IMC Manager Codex Global` WHERE manager_id=?',[$manager]);
            if (count($people)!==1) throw new InvalidArgumentException('Seleziona un manager IMC esistente.');
            $type=(string)($input['assignment_type']??'');
            $teamId=filter_var($input['team']??null,FILTER_VALIDATE_INT);
            if (!in_array($type,['club','national_team'],true) || !$teamId) throw new InvalidArgumentException('Seleziona una squadra esistente.');
            $team=na_team($options,$type,(int)$teamId);
            if (!$team) throw new InvalidArgumentException('Squadra assente o ambigua nel mapping del GW. Nessuna squadra verrà creata.');
            $start=na_date($input['start_date']??null);$end=na_date($input['end_date']??null,true);
            if ($end!==null && $end<$start) throw new InvalidArgumentException('La fine precede l’inizio dell’incarico.');
            $candidate=['game_world_id'=>$gw,'manager_id'=>$people[0]['manager_id'],'full_name'=>$people[0]['full_name'],'team_id'=>$type==='club'?(int)$team['id']:null,'team_name'=>$team['name'],'assignment_type'=>$type,'start_date'=>$start,'end_date'=>$end,'national_team_id'=>$type==='national_team'?(int)$team['id']:null];
            if ($action==='replace') {
                if ($type!==$old['assignment_type']) throw new InvalidArgumentException('Il subentro deve mantenere il tipo di incarico.');
                $close=na_date($input['close_date']??null);
                if ($close<$old['start_date'] || $close>=$start || ($old['end_date']!==null && $close>$old['end_date'])) throw new InvalidArgumentException('La chiusura deve precedere il subentro e rientrare nell’incarico precedente.');
                foreach ($rows as &$row) if ((int)$row['id']===$id) $row['end_date']=$close;
                unset($row);
                na_conflicts($rows,$candidate,$options);
                $db->prepare('UPDATE '.NA_TABLE.' SET end_date=? WHERE id=? AND game_world_id=?')->execute([$close,$id,$gw]);
            } else na_conflicts($rows,$candidate,$options,$id);
            $values=array_values($candidate);
            if ($id && $action==='save') {
                $set=implode(',',array_map(fn($k)=>'`'.$k.'`=?',array_keys($candidate)));
                $db->prepare('UPDATE '.NA_TABLE.' SET '.$set.' WHERE id=? AND game_world_id=?')->execute([...$values,$id,$gw]);
            } else {
                $db->prepare('INSERT INTO '.NA_TABLE.' (`'.implode('`,`',array_keys($candidate)).'`) VALUES ('.implode(',',array_fill(0,count($values),'?')).')')->execute($values);
                $id=(int)$db->lastInsertId();
            }
        }
        $saved=nexus_rows($db,'SELECT * FROM '.NA_TABLE.' WHERE id=? AND game_world_id=?',[$id,$gw])[0];
        $db->commit();
        error_log('Nexus admin assignments '.json_encode(['action'=>$action,'world'=>$gw,'before'=>$old,'after'=>$saved],JSON_UNESCAPED_UNICODE));
        return $saved;
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        throw $e;
    } finally { $db->prepare('SELECT RELEASE_LOCK(?)')->execute([$lock]); }
}
