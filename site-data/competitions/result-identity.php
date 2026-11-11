<?php
declare(strict_types=1);

// Some historical RTH cup results identify clubs only by their recorded name.
function imc_site_result_identity(string $world,array $rows): array {
    if ($world !== 'GW001') return $rows;
    $ids=[];$names=[];
    $fold=static fn($name)=>mb_strtolower(trim((string)$name),'UTF-8');
    foreach ($rows as $row) {
        $key=$row['competition_key']??'';
        if (!str_contains($key,'|IMC|')) continue;
        foreach (['home','away'] as $side) {
            $id=$row[$side.'_sm_club_id'];
            $name=$fold($row[$side.'_name']);
            $names[$key][$name]??=trim((string)$row[$side.'_name']);
            if ($id && $name!=='') $ids[$key][$name][(string)$id]=true;
        }
    }
    $out=[];$seen=[];
    foreach ($rows as $row) {
        $key=$row['competition_key']??'';
        if (str_contains($key,'|IMC|')) {
            $fixture=[$key,$row['imc_season']??null,$row['match_date']];
            foreach (['home','away'] as $side) {
                $field=$side.'_sm_club_id';
                $name=$fold($row[$side.'_name']);
                $matches=$ids[$key][$name]??[];
                if (!$row[$field] && count($matches)===1) $row[$field]=(string)array_key_first($matches);
                $fixture[]=$row[$field]?:$name;
                if (!$row[$field] && $name!=='') $row[$side.'_name']=$names[$key][$name];
            }
            $fixture[]=$row['home_score'];$fixture[]=$row['away_score'];
            $token=serialize($fixture);
            if (isset($seen[$token])) continue;
            $seen[$token]=true;
        }
        $out[]=$row;
    }
    return $out;
}
