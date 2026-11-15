<?php
declare(strict_types=1);

function tc_text(mixed $v): string {return trim(preg_replace('/\s+/u',' ',(string)($v??''))??'');}
function tc_norm(mixed $v): string {
    $s=mb_strtolower(tc_text($v),'UTF-8');
    $ascii=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$s);
    return trim(preg_replace('/[^a-z0-9]+/',' ',$ascii===false?$s:strtolower($ascii))??'');
}
function tc_club(mixed $v): string {
    $s=tc_norm($v);return in_array($s,['','nessuno a','nessuno','svincolato','free agent'],true)?'__FREE__':$s;
}
function tc_json(mixed $v): array {
    if(is_array($v))return $v;
    if($v===null||$v==='')return [];
    $a=json_decode((string)$v,true,512,JSON_THROW_ON_ERROR);
    if(!is_array($a))throw new RuntimeException('Cronologia JSON non valida.');
    return $a;
}
function tc_cash(mixed $v): ?int {
    $s=tc_text($v);if($s==='')return 0;
    if(preg_match('/^([0-9]+(?:[.,][0-9]+)?)\s*([kmb])\b/i',$s,$m))return (int)round((float)str_replace(',','.',$m[1])*['k'=>1000,'m'=>1000000,'b'=>1000000000][strtolower($m[2])]);
    if(preg_match('/^[0-9]+(?:[.,][0-9]+)?$/',$s))return (int)round((float)str_replace(',','.',$s));
    return preg_match('/[a-z]/i',$s)?0:null;
}
function tc_names(array $players): array {
    $out=[];foreach($players as $p){$n=tc_norm(is_array($p)?($p['player_name']??''):$p);if($n!=='')$out[]=$n;}sort($out);return $out;
}
function tc_raw_names(array $r): array {
    $names=tc_names(tc_json($r['exchange_players']??null));if($names)return $names;
    if(preg_match('/^[0-9]+(?:[.,][0-9]+)?(?:\s*[kmb])?$/i',tc_text($r['amount_text']??'')))return [];
    $s=preg_replace('/^\s*[0-9]+(?:[.,][0-9]+)?\s*[kmb]\b/i','',tc_text($r['amount_text']??''));
    $s=preg_replace('/^\s*[+,]\s*/','',$s??'');
    return tc_names(array_filter(preg_split('/\s*[+]\s*|\s+e\s+|\s+and\s+/i',$s??'')?:[],fn($v)=>tc_text($v)!==''));
}
function tc_names_match(array $a,array $b): bool {
    if(count($a)!==count($b))return false;
    $used=[];foreach($a as $x){$found=false;$xs=explode(' ',$x);$surname=end($xs);
        foreach($b as $i=>$y){$ys=explode(' ',$y);if(!isset($used[$i])&&($x===$y||$surname===end($ys))){$used[$i]=true;$found=true;break;}}
        if(!$found)return false;
    }return true;
}
function tc_base_match(array $r,array $h): bool {
    return tc_club($r['club_from']??null)===tc_club($h['club_from']??null)&&tc_club($r['club_to']??null)===tc_club($h['club_to']??null)
        &&tc_cash($r['amount_text']??null)===tc_cash($h['amount_text']??null)
        &&tc_names_match(tc_raw_names($r),tc_names(tc_json($h['exchange_players']??null)));
}
function tc_event(array $r): string {
    return implode('|',[(string)($r['player_id']??''),(string)($r['normalized_transfer_date']??''),tc_club($r['club_from']??null),tc_club($r['club_to']??null),(string)tc_cash($r['amount_text']??null),(string)($r['normalized_season']??''),json_encode(tc_names(tc_json($r['normalized_exchange_players']??null)))]);
}
function tc_audit(array $transfers,array $codex): array {
    $players=[];foreach($codex as $p)$players[(string)$p['player_id']]=$p;
    $events=[];$numbers=[];$consumed=[];
    foreach($transfers as $i=>$r){
        $numbers[(string)($r['imc_season']??'').'|'.(string)($r['imc_transfer_number']??'')][]=$i;
        if(($r['normalization_status']??'')==='CERTIFIED'){
            $events[tc_event($r)][]=$i;
            $consumed[(string)$r['player_id'].'|'.(string)($r['normalized_transfer_date']??'').'|'.(string)($r['normalized_season']??'')][]=$i;
        }
    }
    $summary=['total'=>count($transfers),'certified'=>0,'pending'=>0,'confirmed'=>0,'history_unconfirmed'=>0,'small_amount_difference'=>0,'codex_missing'=>0,'duplicates'=>0,'issues'=>0];$rows=[];
    foreach($transfers as $i=>$r){
        $cert=($r['normalization_status']??'')==='CERTIFIED';$summary[$cert?'certified':'pending']++;
        $issues=[];$candidateDates=[];$source=null;$p=$players[(string)$r['player_id']]??null;
        if(!$cert)$issues[]='Non normalizzato';
        if(!$p){$issues[]='Codex assente';$summary['codex_missing']++;}
        else{
            try{$history=tc_json($p['transfer_history']??null);}catch(Throwable $e){$history=[];$issues[]='Cronologia JSON non leggibile';}
            if($cert){
                if(empty($r['normalized_transfer_date'])||$r['normalized_season']===null||$r['normalized_exchange_players']===null)$issues[]='Certificazione incompleta';
                $sameEvent=array_values(array_filter($history,fn($h)=>($h['date']??'')===($r['normalized_transfer_date']??'')&&(string)($h['season']??'')===(string)($r['normalized_season']??'')&&tc_club($h['club_from']??null)===tc_club($r['club_from']??null)&&tc_club($h['club_to']??null)===tc_club($r['club_to']??null)));
                $matching=array_values(array_filter($sameEvent,fn($h)=>tc_base_match($r,$h)&&tc_names(tc_json($h['exchange_players']??null))===tc_names(tc_json($r['normalized_exchange_players']??null))));
                if(count($matching)===1)$summary['confirmed']++;
                else{
                    $small=count($sameEvent)===1&&tc_names_match(tc_raw_names($r),tc_names(tc_json($sameEvent[0]['exchange_players']??null)))
                        &&tc_names(tc_json($sameEvent[0]['exchange_players']??null))===tc_names(tc_json($r['normalized_exchange_players']??null))
                        &&tc_cash($r['amount_text']??null)!==null&&tc_cash($sameEvent[0]['amount_text']??null)!==null
                        &&abs(tc_cash($r['amount_text']??null)-tc_cash($sameEvent[0]['amount_text']??null))>0
                        &&abs(tc_cash($r['amount_text']??null)-tc_cash($sameEvent[0]['amount_text']??null))<=1000;
                    if($small){$summary['small_amount_difference']++;$issues[]='Scarto importo fino a 1k tra lista e cronologia';}
                    else{$summary['history_unconfirmed']++;$issues[]=count($matching)>1?'Cronologia ambigua':($sameEvent?'Importo o scambio diverso dalla cronologia':'Movimento non confermato dalla cronologia');}
                }
                $source=$sameEvent[0]??null;
            }else{
                $candidates=array_values(array_filter($history,fn($h)=>tc_base_match($r,$h)));
                foreach($candidates as $h)$candidateDates[]=($h['date']??'').' · SM S'.($h['season']??'?');
                $free=array_filter($candidates,fn($h)=>empty($consumed[(string)$r['player_id'].'|'.($h['date']??'').'|'.($h['season']??'')]));
                if(!$candidates)$issues[]='Nessuna corrispondenza esatta nella cronologia disponibile';
                elseif(!$free)$issues[]='Possibile duplicato: movimenti compatibili già utilizzati';
                elseif(count($free)===1)$issues[]='Una corrispondenza disponibile da normalizzare';
                else $issues[]='Più corrispondenze disponibili: verificare la data';
            }
        }
        $duplicate=count($numbers[(string)($r['imc_season']??'').'|'.(string)($r['imc_transfer_number']??'')])>1||($cert&&count($events[tc_event($r)])>1);
        if($duplicate){$issues[]='Duplicato di numero o movimento normalizzato';$summary['duplicates']++;}
        if($issues){$summary['issues']++;$rows[]=['number'=>$r['imc_transfer_number']??null,'season'=>$r['imc_season']??null,'player_id'=>$r['player_id'],'player'=>$p['full_name']??$r['player_name']??'','from'=>$r['club_from']??null,'to'=>$r['club_to']??null,'amount'=>$r['amount_text']??null,'date'=>$r['normalized_transfer_date']??null,'status'=>$r['normalization_status']??null,'issues'=>$issues,'candidate_dates'=>$candidateDates,'codex_updated_at'=>$p['imported_at']??null,'source'=>$source];}
    }
    return ['summary'=>$summary,'rows'=>$rows];
}
function tc_read(PDO $db,string $world): array {
    if(!preg_match('/^IMC(?:00[1-9]|010)$/D',$world))throw new InvalidArgumentException('Mondo non valido.');
    $transfers=nexus_rows($db,'SELECT imc_transfer_number,imc_season,player_id,player_name,club_from,club_to,amount_text,exchange_players,normalized_transfer_date,normalized_season,normalized_exchange_players,normalization_status,imported_at FROM `'.$world.'_Transfers` ORDER BY imc_season DESC,imc_transfer_number DESC');
    $codex=nexus_rows($db,'SELECT player_id,full_name,transfer_history,imported_at FROM `'.$world.'_Player_Codex`');
    return tc_audit($transfers,$codex);
}
function tc_overview(PDO $db,array $catalog): array {
    $rows=[];foreach($catalog as $w){$code=$w['code'];if(!preg_match('/^IMC(?:00[1-9]|010)$/D',$code))continue;
        $r=nexus_rows($db,"SELECT COUNT(*) total,COALESCE(SUM(normalization_status='CERTIFIED'),0) certified,COALESCE(SUM(normalization_status IS NULL OR normalization_status<>'CERTIFIED'),0) pending,MAX(imported_at) last_import FROM `".$code."_Transfers`")[0];
        $rows[]=['world'=>$code,'name'=>$w['name']]+$r;
    }return $rows;
}
