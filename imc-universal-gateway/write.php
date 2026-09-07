<?php
declare(strict_types=1);

function imc_transfer_table(string $t):bool{return preg_match('/^GW(?:00[1-9]|01[0-9]|02[0-5])_IMC Transfers$/',$t)===1;}
function imc_match_report_table(string $t):bool{return preg_match('/^GW(?:00[1-9]|01[0-9]|02[0-5])_IMC Match Report$/',$t)===1;}

function imc_validate_transfer_row(PDO $p,string $t,array $r):array{
    $expected=['game_world_id','imc_transfer_number','player_id','player_name','club_from','from_sm_world_club_id','club_to','to_sm_world_club_id','transfer_date','amount_text','exchange_players','imported_at'];
    $keys=array_keys($r); sort($keys); $sortedExpected=$expected; sort($sortedExpected);
    if($keys!==$sortedExpected)throw new InvalidArgumentException('invalid_payload:transfer_structure_mismatch');
    $gw=substr($t,0,5);
    if(strtoupper(trim((string)$r['game_world_id']))!==$gw)throw new InvalidArgumentException('game_world_mismatch');
    $cols=imc_cols($p,$t);
    foreach($expected as$k){if(!isset($cols[$k]))throw new InvalidArgumentException('column_not_found:'.$k);imc_validate_import_value($k,$r[$k],$cols[$k]);}
    return imc_row($p,$t,$r);
}

function imc_validate_match_report_row(PDO $p,string $t,array $r):array{
    $expected=['game_world_id','sm_fixture_id','competition_key','sm_action','sm_country','sm_division','competition_group','competition_stage','competition_round','match_date','home_sm_club_id','home_name','away_sm_club_id','away_name','home_sm_manager_id','home_manager_name','away_sm_manager_id','away_manager_name','home_score','away_score','penalty_home_score','penalty_away_score','aggregate_home_score','aggregate_away_score','stadium_name','attendance','team_stats_json','players_json','events_json','tactics_json','commentary_json','fingerprint','imported_at'];
    $keys=array_keys($r); sort($keys); $sortedExpected=$expected; sort($sortedExpected);
    if($keys!==$sortedExpected)throw new InvalidArgumentException('invalid_payload:match_report_structure_mismatch');
    $gw=substr($t,0,5);
    if(strtoupper(trim((string)$r['game_world_id']))!==$gw)throw new InvalidArgumentException('game_world_mismatch');
    $cols=imc_cols($p,$t);
    foreach($expected as$k){if(!isset($cols[$k]))throw new InvalidArgumentException('column_not_found:'.$k);imc_validate_import_value($k,$r[$k],$cols[$k]);}
    return imc_row($p,$t,$r);
}

function imc_insert(PDO$p,string$t,array$r,bool$up=false):int{
    if(imc_transfer_table($t))$r=imc_validate_transfer_row($p,$t,$r);
    elseif(imc_match_report_table($t))$r=imc_validate_match_report_row($p,$t,$r);
    else $r=imc_row($p,$t,$r);
    if(!$r)throw new InvalidArgumentException('required_field_missing');
    $c=array_keys($r);
    $q='INSERT INTO '.imc_ident($t).' ('.implode(',',array_map('imc_ident',$c)).') VALUES ('.implode(',',array_fill(0,count($c),'?')).')';
    if($up)$q.=' ON DUPLICATE KEY UPDATE '.implode(',',array_map(fn($x)=>imc_ident($x).'=VALUES('.imc_ident($x).')',$c));
    $s=$p->prepare($q); $s->execute(array_values($r)); return$s->rowCount();
}

function imc_write_action(string$a,array$b,array$r,?string$t,PDO$p,array$B):bool{if(!$t)return false;
if(in_array($a,['insert','upsert'],true)){$n=imc_insert($p,$t,$b['row']??[],$a==='upsert');imc_log($r,$a,$t,['affected_rows'=>$n]);imc_out($B+['inserted_rows'=>$n,'last_insert_id'=>$p->lastInsertId()]);}
if(in_array($a,['insert_many','upsert_many'],true)){$rows=$b['rows']??[];if(!is_array($rows)||!$rows)throw new InvalidArgumentException('required_field_missing');$atomic=($b['atomic']??true)!==false;$n=0;if($atomic)$p->beginTransaction();try{foreach($rows as$row)$n+=imc_insert($p,$t,$row,$a==='upsert_many');if($atomic)$p->commit();}catch(Throwable$e){if($p->inTransaction())$p->rollBack();throw$e;}imc_log($r,$a,$t,['affected_rows'=>$n]);imc_out($B+['received'=>count($rows),'inserted'=>$n,'failed'=>0,'rolled_back'=>false,'errors'=>[]]);}
if($a==='update'){$set=imc_row($p,$t,$b['set']??[]);if(!$set)throw new InvalidArgumentException('required_field_missing');$v=[];$q=[];foreach($set as$k=>$x){$q[]=imc_ident($k).'=?';$v[]=$x;}$w=$b['where']??[];$before=imc_count($p,$t,$w);$sql='UPDATE '.imc_ident($t).' SET '.implode(',',$q).' WHERE '.imc_where($w,$v);$s=$p->prepare($sql);$s->execute($v);imc_log($r,$a,$t,['affected_rows'=>$s->rowCount()]);imc_out($B+['matched_rows'=>$before,'updated_rows'=>$s->rowCount()]);}
if(in_array($a,['delete','delete_one'],true)){$w=$b['where']??[];$before=imc_count($p,$t,$w);if($a==='delete_one'&&$before>1)throw new RuntimeException('multiple_rows_matched');if($a==='delete_one'&&$before===0)imc_out($B+['before_count'=>0,'deleted_rows'=>0,'after_count'=>0,'status'=>'not_found']);$v=[];$s=$p->prepare('DELETE FROM '.imc_ident($t).' WHERE '.imc_where($w,$v));$s->execute($v);$after=imc_count($p,$t,$w);imc_log($r,$a,$t,['before_count'=>$before,'after_count'=>$after,'affected_rows'=>$s->rowCount()]);imc_out($B+['before_count'=>$before,'deleted_rows'=>$s->rowCount(),'after_count'=>$after]);}
if(in_array($a,['clear_repository','clear_table','truncate_table'],true)){$before=imc_count($p,$t);$deleted=0;try{if($a==='truncate_table'){$p->exec('TRUNCATE TABLE '.imc_ident($t));$deleted=$before;}else{$deleted=$p->exec('DELETE FROM '.imc_ident($t));}}catch(Throwable$e){throw$e;}$after=imc_count($p,$t);imc_log($r,$a,$t,['before_count'=>$before,'after_count'=>$after,'affected_rows'=>$deleted]);imc_out($B+['before_count'=>$before,'deleted_rows'=>$deleted,'after_count'=>$after]);}
if($a==='copy_rows'){$src=(string)($b['source_table']??'');$dst=(string)($b['destination_table']??'');imc_ident($src);imc_ident($dst);$cc=$b['columns']??[];$sel=$cc?implode(',',array_map(fn($x)=>imc_ident((string)$x),$cc)):'*';$v=[];$q='INSERT INTO '.imc_ident($dst).($cc?' ('.$sel.')':'').' SELECT '.$sel.' FROM '.imc_ident($src);if(!empty($b['filters']))$q.=' WHERE '.imc_where($b['filters'],$v);$s=$p->prepare($q);$s->execute($v);imc_out($B+['source_table'=>$src,'destination_table'=>$dst,'copied_rows'=>$s->rowCount()]);}return false;}
