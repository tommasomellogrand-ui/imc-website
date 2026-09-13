<?php
declare(strict_types=1);

/** Dates belong exclusively to IMC Game World Season; fixture dates are unrelated. */
function gw001_season_state(array $rows, DateTimeImmutable $now): array {
    $now=$now->setTimezone(new DateTimeZone('Europe/Rome'));
    $today=$now->format('Y-m-d');
    $seasons=[];
    foreach ($rows as $row) {
        if (($row['game_world_id']??'')!=='GW001') throw new RuntimeException('season_scope');
        foreach (['imc_season_start_date','imc_season_end_date'] as $key) {
            $value=$row[$key];
            if ($value!==null) {
                $date=DateTimeImmutable::createFromFormat('!Y-m-d',$value);
                if (!$date || $date->format('Y-m-d')!==$value) throw new RuntimeException('season_date');
            }
        }
        $start=$row['imc_season_start_date']; $end=$row['imc_season_end_date'];
        if ($start!==null && $end!==null && $start>$end) throw new RuntimeException('season_interval');
        $seasons[]=[
            'game_world_id'=>'GW001',
            'imc_season'=>(int)$row['imc_season'],
            'soccer_manager_season'=>$row['soccer_manager_season']===null?null:(int)$row['soccer_manager_season'],
            'imc_season_start_date'=>$start,
            'imc_season_end_date'=>$end,
            'is_current'=>$start!==null && $end!==null && $start<=$today && $today<=$end,
        ];
    }
    $current=array_values(array_filter($seasons,static fn($s)=>$s['is_current']));
    return [
        'ok'=>true,'version'=>1,'resource'=>'seasons','game_world_id'=>'GW001',
        'source'=>'IMC Game World Season','timezone'=>'Europe/Rome',
        'today'=>$today,'read_at'=>$now->format(DateTimeInterface::ATOM),
        'seasons'=>$seasons,'current_season'=>count($current)===1?$current[0]:null,
        'current_status'=>count($current)>1?'ambiguous':(count($current)===1?'current':($seasons?'no_current':'empty')),
    ];
}
