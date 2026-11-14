<?php
declare(strict_types=1);
require_once __DIR__.'/engine.php';
require_once dirname(__DIR__).'/teams/roster-stats.php';

function nr_board(string $id,string $title,array $rows,string $unit='',string $note='',bool $ascending=false): array {
    $rows=array_values(array_filter($rows,fn($r)=>isset($r['value'])&&is_numeric($r['value'])));
    usort($rows,fn($a,$b)=>(($ascending?1:-1)*($a['value']<=>$b['value']))?:strcmp($a['label'],$b['label']));
    $rank=0;$last=null;foreach($rows as $i=>&$r){if($last===null||(float)$last!==(float)$r['value'])$rank=$i+1;$last=$r['value'];$r['position']=$rank;}unset($r);
    return compact('id','title','unit','note')+['rows'=>array_slice($rows,0,10),'eligible'=>count($rows)];
}
function nr_person(array $data,string $id,float|int $value,string $detail=''): array {
    return ['label'=>function_exists('imc_person_display_name')?imc_person_display_name($data['managers'][$id]['full_name']??$id):($data['managers'][$id]['full_name']??$id),'manager_id'=>$id,'value'=>$value,'detail'=>$detail,'href'=>'/nexus/managers/?manager='.rawurlencode($id)];
}
function nr_event(array $m,float|int $value,?string $side=null): array {
    $id=$side?$m[$side.'_manager']:null;
    return ['label'=>$m['home_name'].' '.$m['home_score'].'–'.$m['away_score'].' '.$m['away_name'],'value'=>$value,'manager_id'=>$id,'world'=>$m['world'],'date'=>$m['date'],'detail'=>$m['competition'].' · '.$m['world'].' · S'.$m['season'].' · '.$m['date'],'href'=>$m['fixture_id']?'/nexus/competitions/match.html?'.http_build_query(['world'=>$m['game_world_id'],'fixture'=>$m['fixture_id']]):'/nexus/almanacco/?'.http_build_query(['world'=>$m['world'],'season'=>$m['season']])];
}
function nr_result_records(array $data,array $q,string $category='results'): array {
    $matches=na_filter($data['matches'],$q);$titles=na_filter($data['trophies'],$q);$stats=[];$days=[];$seasonStats=[];$events=['margin'=>[],'goals'=>[],'away'=>[],'home'=>[],'total'=>[],'draw'=>[]];
    foreach($data['managers'] as $id=>$m)$stats[$id]=ch_zero()+['clean'=>0,'home_wins'=>0,'away_wins'=>0,'teams'=>[],'worlds'=>[],'trophies'=>0,'title_worlds'=>[]];
    foreach($matches as $m){
        $total=$m['home_score']+$m['away_score'];$margin=abs($m['home_score']-$m['away_score']);
        if($total>0)$events['total'][]=nr_event($m,$total);if($margin===0&&$total>0)$events['draw'][]=nr_event($m,$total);
        foreach(['home','away'] as $side){$id=$m[$side.'_manager'];if(!$id||(($q['manager']??'')!==''&&$q['manager']!==$id))continue;$other=$side==='home'?'away':'home';$s=&$stats[$id];$gf=$m[$side.'_score'];$ga=$m[$other.'_score'];ch_add($s,$gf,$ga);$s['clean']+=(int)($ga===0);$s[$side.'_wins']+=(int)($gf>$ga);$s['teams'][$m['world'].'|'.$m['scope'].'|'.$m[$side.'_team_id']]=true;$s['worlds'][$m['world']]=true;$days[$id][$m['date']][]=[$gf,$ga];
            $sk=$id.'|'.$m['world'].'|'.$m['season'];$seasonStats[$sk]??=['id'=>$id,'world'=>$m['world'],'season'=>$m['season'],'won'=>0,'gf'=>0,'played'=>0];$seasonStats[$sk]['won']+=(int)($gf>$ga);$seasonStats[$sk]['gf']+=$gf;$seasonStats[$sk]['played']++;
            if($gf>$ga){$events['margin'][]=nr_event($m,$gf-$ga,$side);$events[$side][]=nr_event($m,$gf-$ga,$side);}if($gf>0)$events['goals'][]=nr_event($m,$gf,$side);unset($s);
        }
    }
    foreach($titles as $t)if($t['manager_id']&&isset($stats[$t['manager_id']])){$stats[$t['manager_id']]['trophies']++;$stats[$t['manager_id']]['title_worlds'][$t['world']]=true;}
    $boards=[];
    if($category==='results'){
        foreach(['margin'=>['Vittoria con più scarto','gol di scarto'],'goals'=>['Più gol segnati in una partita','gol'],'home'=>['Vittoria in casa più larga','gol di scarto'],'away'=>['Vittoria in trasferta più larga','gol di scarto'],'total'=>['Partita con più gol complessivi','gol'],'draw'=>['Pareggio con più gol','gol']] as $key=>[$title,$unit])$boards[]=nr_board($key,$title,$events[$key],$unit,'Risultato nei tempi di gioco; i rigori sono esclusi.');
    }
    $metrics=$category==='career'?['played'=>'Più partite giocate','won'=>'Più vittorie','gf'=>'Più gol segnati','gd'=>'Migliore differenza reti','clean'=>'Più porte inviolate','trophies'=>'Più titoli conquistati','worlds'=>'Più mondi disputati','teams'=>'Più squadre utilizzate in carriera','title_worlds'=>'Campione in più mondi','home_wins'=>'Più vittorie in casa','away_wins'=>'Più vittorie in trasferta','win_rate'=>'Migliore percentuale di vittorie','gf_avg'=>'Migliore media gol']:['unbeaten'=>'Serie di giorni di gara imbattuti','winning'=>'Serie di giorni di gara tutti vinti','clean_days'=>'Serie di giorni senza subire gol'];
    foreach($metrics as $metric=>$title){$rows=[];foreach($stats as $id=>$s){
        $value=$s[$metric]??0;$sample='';if(in_array($metric,['worlds','teams','title_worlds'],true))$value=count($value);if($metric==='gd')$value=$s['gf']-$s['ga'];
        if(in_array($metric,['win_rate','gf_avg'],true)){if($s['played']<20)continue;$value=$metric==='win_rate'?100*$s['won']/$s['played']:$s['gf']/$s['played'];$sample=$s['played'].' partite';}
        if(in_array($metric,['unbeaten','winning','clean_days'],true)){$current=0;$value=0;$schedule=$days[$id]??[];ksort($schedule);foreach($schedule as $games){$good=true;foreach($games as [$gf,$ga])if(($metric==='unbeaten'&&$gf<$ga)||($metric==='winning'&&$gf<=$ga)||($metric==='clean_days'&&$ga>0))$good=false;$current=$good?$current+1:0;$value=max($value,$current);}}
        if($value>0)$rows[]=nr_person($data,$id,$value,$sample);
    }$note=in_array($metric,['win_rate','gf_avg'],true)?'Almeno 20 partite nei filtri selezionati.':(in_array($metric,['unbeaten','winning','clean_days'],true)?'Giorni con gare, ordinati per data. Tutte le gare dello stesso giorno devono soddisfare il criterio.':'Dati disponibili nell’archivio, con i filtri selezionati.');$boards[]=nr_board($metric,$title,$rows,$metric==='win_rate'?'%':($metric==='gf_avg'?'gol/gara':''),$note);}
    if($category==='career')foreach(['won'=>'Più vittorie in una stagione di un mondo','gf'=>'Più gol in una stagione di un mondo'] as $metric=>$title){$rows=[];foreach($seasonStats as $s)if($s[$metric]>0)$rows[]=nr_person($data,$s['id'],$s[$metric],$s['world'].' · Stagione '.$s['season'].' · '.$s['played'].' partite');$boards[]=nr_board('season_'.$metric,$title,$rows);}
    return ['boards'=>$boards,'summary'=>['Partite'=>count($matches),'Titoli'=>count($titles)],'analysis'=>null];
}
function nr_cash(string $text,bool $exchange=false): ?int {
    $raw=trim(mb_strtolower($text,'UTF-8'));$cash=[];
    foreach(preg_split('/\s*\+\s*/u',$raw) as $part){$part=trim(preg_replace('/^(?:euro|eur|[€£$])\s*|\s*(?:euro|eur|[€£$])$/u','',$part));
        if(preg_match('/^(gratis|gratuito|free(?: transfer)?|(?:a )?parametro\s*zero|svincolato|scambio|player exchange)$/u',$part)){$cash[]=0;continue;}
        if(!preg_match('/^([0-9][0-9.,\s\x{2019}\x{0027}]*)(milioni|milione|mln\.?|millions?|mil|m|mila|mille|thousand|k)?$/u',$part,$m))continue;
        $n=preg_replace('/[\s\x{2019}\x{0027}]/u','',trim($m[1]));$unit=$m[2]??'';
        if(str_contains($n,'.')&&str_contains($n,',')){if(preg_match('/^\d{1,3}(?:\.\d{3})+,\d+$/',$n))$n=str_replace(',','.',str_replace('.','',$n));elseif(preg_match('/^\d{1,3}(?:,\d{3})+\.\d+$/',$n))$n=str_replace(',','',$n);else return null;}
        elseif($unit===''&&preg_match('/^\d{1,3}([.,])\d{3}(?:\1\d{3})*$/',$n))$n=str_replace(['.',','],'',$n);
        elseif(preg_match('/^\d+(?:[.,]\d+)?$/',$n))$n=str_replace(',','.',$n);else return null;
        $multiplier=$unit===''?1:(in_array($unit,['k','mila','mille','thousand'],true)?1000:1000000);$cash[]=(int)round((float)$n*$multiplier);
    }
    if(count($cash)===1)return $cash[0];if(!$cash&&$exchange&&!preg_match('/[0-9€£$]/u',$raw))return 0;return null;
}
function nr_trade_manager(array $data,string $world,mixed $team,string $day): ?string {
    if((int)$team<1||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$day))return null;$ids=[];
    foreach($data['managers'] as $id=>$m)foreach($m['assignments'] as $a)if($a['world']===$world&&$a['assignment_type']==='club'&&(string)$a['team_id']===(string)$team&&!empty($a['start_date'])&&$a['start_date']<=$day&&(empty($a['end_date'])||$a['end_date']>=$day))$ids[$id]=true;
    return count($ids)===1?(string)array_key_first($ids):null;
}
function nr_market_records(array $data,array $q,array $sources): array {
    $stats=[];$buys=[];$sales=[];$seen=[];$conflicts=[];$groups=[];$coverage=['Movimenti'=>0,'Senza data'=>0,'Importi non leggibili'=>0,'Duplicati discordanti'=>0];
    // Import row numbers restart between seasons. Event coordinates identify a
    // movement across imports without merging unrelated players or seasons.
    foreach($sources as $world=>$rows)foreach($rows as $r){$day=$r['normalized_transfer_date']??$r['transfer_date']??'';$season=$r['imc_season']??$r['normalized_season']??$r['season']??null;$parts=[$r['player_id']??('row:'.($r['imc_transfer_number']??'')),$day,$season,$r['from_sm_world_club_id']??($r['club_from']??''),$r['to_sm_world_club_id']??($r['club_to']??'')];$key=$world.'|'.hash('sha256',json_encode($parts));$groups[$key][]=[$world,$r];}
    foreach($groups as $key=>$items){$sign=[];foreach($items as [$world,$r]){$exchange=json_decode((string)($r['normalized_exchange_players']??'[]'),true);if(!is_array($exchange)||!$exchange)$exchange=json_decode((string)($r['exchange_players']??'[]'),true);$hasExchange=is_array($exchange)&&count($exchange)>0;$cash=nr_cash((string)($r['amount_text']??''),$hasExchange);$sign[json_encode([$cash,$hasExchange,$cash===null?trim((string)($r['amount_text']??'')):null])]=true;}if(count($sign)>1){$coverage['Duplicati discordanti']++;continue;}[$world,$r]=$items[0];$day=(string)($r['normalized_transfer_date']??$r['transfer_date']??'');$season=$r['imc_season']??$r['normalized_season']??$r['season']??null;
        if(($q['world']??'')!==''&&$world!==$q['world'])continue;if(($q['season']??'')!==''&&(string)$season!==$q['season'])continue;$coverage['Movimenti']++;
        if($day===''||$day==='0000-00-00'){$coverage['Senza data']++;continue;}if($day>date('Y-m-d'))continue;
        $exchange=json_decode((string)($r['normalized_exchange_players']??'[]'),true);if(!is_array($exchange)||!$exchange)$exchange=json_decode((string)($r['exchange_players']??'[]'),true);$hasExchange=is_array($exchange)&&count($exchange)>0;$fee=nr_cash((string)($r['amount_text']??''),$hasExchange);if($fee===null)$coverage['Importi non leggibili']++;
        foreach(['to'=>['purchases','spent'],'from'=>['sales','received']] as $side=>[$count,$money]){$id=nr_trade_manager($data,$world,$r[$side.'_sm_world_club_id']??null,$day);if(!$id||(($q['manager']??'')!==''&&$q['manager']!==$id))continue;$stats[$id]??=['purchases'=>0,'sales'=>0,'spent'=>0,'received'=>0,'swaps'=>0,'unknown'=>0];$stats[$id][$count]++;if($hasExchange)$stats[$id]['swaps']++;if($fee===null)$stats[$id]['unknown']++;else $stats[$id][$money]+=$fee;
            if($fee!==null&&$fee>0){$event=nr_person($data,$id,$fee,($r['player_name']??'').' · '.($r['club_from']??'').' → '.($r['club_to']??'').' · '.$world.' · '.$day.($hasExchange?' · + scambio':''));$event['href']='/nexus/transfers/page.html?'.http_build_query(['world'=>current(array_filter($data['worlds'],fn($w)=>$w['id']===$world))['legacy'],'sm_club'=>$r[$side.'_sm_world_club_id']]);if($side==='to')$buys[]=$event;else $sales[]=$event;}
        }
    }
    $boards=[];foreach(['purchases'=>'Più acquisti conclusi','sales'=>'Più cessioni concluse','spent'=>'Più spesa in contanti','received'=>'Più incassi in contanti','balance'=>'Miglior saldo di cassa','swaps'=>'Più operazioni con scambi'] as $key=>$title){$rows=[];foreach($stats as $id=>$s){if(in_array($key,['spent','received','balance'],true)&&$s['unknown']>0)continue;$value=$key==='balance'?$s['received']-$s['spent']:$s[$key];if($value>0)$rows[]=nr_person($data,$id,$value,$s['purchases'].' acquisti · '.$s['sales'].' cessioni');}$boards[]=nr_board($key,$title,$rows,in_array($key,['spent','received','balance'],true)?'SM_CASH':'','Attribuzione al manager in carica alla data del movimento. La componente giocatori degli scambi non viene trasformata in denaro. Totali monetari esclusi se contengono importi illeggibili.');}
    $boards[]=nr_board('highest_buy','Acquisto con più contanti',$buys,'SM_CASH','Solo componente monetaria; gli scambi rimangono indicati a parte.');$boards[]=nr_board('highest_sale','Cessione con più contanti',$sales,'SM_CASH');
    return ['boards'=>$boards,'summary'=>$coverage,'analysis'=>null,'notes'=>['Lo storico disponibile contiene trasferimenti. Non è presente un archivio separato delle offerte ricevute, rifiutate o ritirate: questi record non vengono dedotti dai trasferimenti.']];
}
function nr_usage(array $p,?int $duration): array {
    $count=fn($v)=>is_numeric($v)?max(0,(int)$v):0;$starter=$count($p['starter']??0)>0;$on=nexus_roster_minute($p['sub_on_minute']??null);$rating=is_numeric($p['rating']??null)&&(float)$p['rating']>0&&(float)$p['rating']<=10?(float)$p['rating']:null;
    $goals=max($count($p['goals']??0),is_array($p['goal_minutes']??null)?count($p['goal_minutes']):0);$assists=$count($p['assists']??0);$mom=(int)($count($p['man_of_match']??0)>0);$played=$starter||$on!==null||$rating!==null||$goals>0||$assists>0||$mom>0;$minutes=null;
    if($played){$from=$starter?0:$on;$to=nexus_roster_minute($p['sub_off_minute']??null);$red=nexus_roster_minute($p['red_card_minute']??null);if($red!==null)$to=$to===null?$red:min($to,$red);$to=$to??$duration;if($duration!==null&&$to!==null)$to=min($duration,$to);if($from!==null&&$to!==null&&$from<=$to)$minutes=$to-$from;}
    return compact('played','starter','minutes','rating','goals','assists','mom')+['yellow'=>$count($p['yellow_card']??0),'red'=>$count($p['red_card']??0)];
}
function nr_report_start(): array {return ['managers'=>[],'players'=>[],'events'=>[],'coverage'=>['Report'=>0,'Report discordanti'=>0,'Lati squadra'=>0,'Presenze giocatori'=>0,'Presenze senza minuti'=>0]];}
function nr_report_add(array &$agg,array $r,array $m,array $q): void {
    if(!na_filter([$m],$q))return;$agg['coverage']['Report']++;$teams=json_decode((string)($r['team_stats_json']??'{}'),true);$players=json_decode((string)($r['players_json']??'[]'),true);$duration=is_numeric($r['duration']??null)?(int)$r['duration']:null;
    if(is_numeric($r['attendance']??null)&&(int)$r['attendance']>0)$agg['events']['attendance'][]=nr_event($m,(int)$r['attendance']);
    foreach(['home','away'] as $side){$id=$m[$side.'_manager'];if((($q['manager']??'')!==''&&$q['manager']!==$id))continue;$id=$id??('team:'.$m['world'].'|'.$m[$side.'_team_id']);$agg['coverage']['Lati squadra']++;$other=$side==='home'?'away':'home';
        $agg['managers'][$id]??=['reports'=>0,'players'=>[],'appearances'=>0,'known_minutes'=>0,'minutes_sum'=>0,'rating_sum'=>0,'rated'=>0,'subs'=>0,'fields'=>[]];$a=&$agg['managers'][$id];$a['reports']++;
        foreach(['possession','total_shots','shots_on_target','corners','yellow_cards','red_cards'] as $field){$value=$teams[$side][$field]??null;if(!is_numeric($value)||(float)$value<0||($field==='possession'&&(float)$value>100))continue;$value=(float)$value;$a['fields'][$field]??=['sum'=>0,'n'=>0];$a['fields'][$field]['sum']+=$value;$a['fields'][$field]['n']++;$event=nr_event($m,$value,$side);$event['label']=$m[$side.'_name'].' · '.$event['label'];$agg['events'][$field][]=$event;}
        $against=$teams[$other]['total_shots']??null;if(is_numeric($against)&&(float)$against>=0){$a['fields']['shots_against']??=['sum'=>0,'n'=>0];$a['fields']['shots_against']['sum']+=(float)$against;$a['fields']['shots_against']['n']++;}
        $seen=[];$used=0;foreach(is_array($players)?$players:[] as $p){if(($p['team_side']??'')!==$side||(int)($p['sm_player_id']??0)<1)continue;$pid=(string)$p['sm_player_id'];if(($q['player']??'')!==''&&$q['player']!==$pid)continue;if(isset($seen[$pid]))continue;$seen[$pid]=true;$u=nr_usage($p,$duration);if(!$u['played'])continue;$used++;$agg['coverage']['Presenze giocatori']++;$a['players'][$pid]=true;$a['appearances']++;$a['subs']+=(int)!$u['starter'];
            if($u['minutes']!==null){$a['known_minutes']++;$a['minutes_sum']+=$u['minutes'];}else $agg['coverage']['Presenze senza minuti']++;
            if($u['rating']!==null){$a['rating_sum']+=$u['rating'];$a['rated']++;}
            $agg['players'][$pid]??=['label'=>$p['player_name']??('Giocatore '.$pid),'player_id'=>$pid,'world'=>$m['world'],'legacy'=>$m['game_world_id'],'played'=>0,'starts'=>0,'subs'=>0,'minutes'=>0,'known_minutes'=>0,'goals'=>0,'assists'=>0,'mom'=>0,'yellow'=>0,'red'=>0,'rating_sum'=>0,'rated'=>0,'worlds'=>[],'world_stats'=>[],'matches'=>[]];$pl=&$agg['players'][$pid];$pl['world_stats'][$m['world']]??=['world'=>$m['world'],'played'=>0,'goals'=>0,'assists'=>0,'minutes'=>0,'known_minutes'=>0,'rating_sum'=>0,'rated'=>0,'teams'=>[]];$ws=&$pl['world_stats'][$m['world']];$ws['played']++;$ws['goals']+=$u['goals'];$ws['assists']+=$u['assists'];$ws['teams'][$m[$side.'_team_id']]=$m[$side.'_name'];if($u['minutes']!==null){$ws['minutes']+=$u['minutes'];$ws['known_minutes']++;}if($u['rating']!==null){$ws['rating_sum']+=$u['rating'];$ws['rated']++;}unset($ws);if(($q['player']??'')!==''){$pl['matches'][]=nr_event($m,$u['goals'],$side)+['minutes'=>$u['minutes'],'rating'=>$u['rating'],'assists'=>$u['assists']];} $pl['played']++;$pl['starts']+=(int)$u['starter'];$pl['subs']+=(int)!$u['starter'];$pl['worlds'][$m['world']]=true;foreach(['goals','assists','mom','yellow','red'] as $f)$pl[$f]+=$u[$f];if($u['minutes']!==null){$pl['minutes']+=$u['minutes'];$pl['known_minutes']++;}if($u['rating']!==null){$pl['rating_sum']+=$u['rating'];$pl['rated']++;}unset($pl);
        }
        if($used>0){$a['fields']['used']??=['sum'=>0,'n'=>0];$a['fields']['used']['sum']+=$used;$a['fields']['used']['n']++;$usedEvent=nr_event($m,$used,$side);$usedEvent['label']=$m[$side.'_name'].' · '.$usedEvent['label'];$agg['events']['used'][]=$usedEvent;}unset($a);
    }
    // Keep bounded event leaderboards while streaming the report archive.
    foreach($agg['events'] as &$events)if(count($events)>40){usort($events,fn($a,$b)=>$b['value']<=>$a['value']);$events=array_slice($events,0,20);}unset($events);
}
function nr_report_records(array $data,array $q,array $agg,string $category): array {
    $boards=[];$analysis=null;
    if($category==='reports'){
        foreach(['possession'=>['Possesso più alto in una gara','%'],'total_shots'=>['Più tiri in una gara','tiri'],'shots_on_target'=>['Più tiri in porta in una gara','tiri'],'corners'=>['Più corner in una gara','corner'],'used'=>['Più giocatori schierati in una gara','giocatori'],'attendance'=>['Gara con più spettatori','spettatori']] as $f=>[$title,$unit])$boards[]=nr_board('peak_'.$f,$title,$agg['events'][$f]??[],$unit,'Solo Match Report disponibili, senza valori mancanti trasformati in zero.');
        foreach(['possession'=>'Miglior possesso medio','total_shots'=>'Più tiri per partita','shots_on_target'=>'Più tiri in porta per partita','corners'=>'Più corner per partita','shots_against'=>'Meno tiri subiti per partita','used'=>'Più giocatori schierati per partita','unique_players'=>'Più giocatori diversi utilizzati','avg_minutes'=>'Minuti medi per presenza','rating'=>'Migliore media voto della squadra','yellow_cards'=>'Più ammonizioni per partita','red_cards'=>'Più espulsioni per partita'] as $f=>$title){$rows=[];foreach($agg['managers'] as $id=>$a){if(!isset($data['managers'][$id]))continue;$value=null;$sample=$a['reports'].' report';if($f==='unique_players')$value=count($a['players']);elseif($f==='avg_minutes'&&$a['known_minutes']>=20){$value=$a['minutes_sum']/$a['known_minutes'];$sample=$a['known_minutes'].' presenze con minuti su '.$a['appearances'];}elseif($f==='rating'&&$a['rated']>=20){$value=$a['rating_sum']/$a['rated'];$sample=$a['rated'].' voti';}elseif(($a['fields'][$f]['n']??0)>=5){$value=$a['fields'][$f]['sum']/$a['fields'][$f]['n'];$sample=$a['fields'][$f]['n'].' report con il dato';}if($value!==null)$rows[]=nr_person($data,$id,$value,$sample);}$boards[]=nr_board('avg_'.$f,$title,$rows,$f==='possession'?'%':($f==='avg_minutes'?'min':''),'Medie squadra: almeno 5 report con il dato; voti e minuti: almeno 20 presenze valide. I giocatori rimasti in panchina sono esclusi.',$f==='shots_against');}
        if(($q['manager']??'')!==''&&isset($agg['managers'][$q['manager']])){$a=$agg['managers'][$q['manager']];$analysis=['reports'=>$a['reports'],'unique_players'=>count($a['players']),'appearances'=>$a['appearances'],'known_minutes'=>$a['known_minutes'],'avg_minutes'=>$a['known_minutes']?$a['minutes_sum']/$a['known_minutes']:null,'avg_rating'=>$a['rated']?$a['rating_sum']/$a['rated']:null,'fields'=>[]];foreach($a['fields'] as $f=>$values)$analysis['fields'][$f]=['value'=>$values['sum']/$values['n'],'sample'=>$values['n']];}
    }else{
        foreach(['played'=>'Più presenze','starts'=>'Più presenze da titolare','subs'=>'Più ingressi dalla panchina','goals'=>'Più gol segnati','assists'=>'Più assist','mom'=>'Più premi uomo partita','yellow'=>'Più ammonizioni','red'=>'Più espulsioni','minutes'=>'Più minuti documentati','avg_minutes'=>'Più minuti medi per presenza','rating'=>'Migliore media voto','goals90'=>'Più gol ogni 90 minuti'] as $f=>$title){$rows=[];foreach($agg['players'] as $p){$value=$p[$f]??null;$detail=$p['played'].' presenze · '.count($p['worlds']).' mondi';if($f==='minutes')$detail=$p['known_minutes'].' presenze con minuti su '.$p['played'];if($f==='avg_minutes'){$value=$p['known_minutes']>=10?$p['minutes']/$p['known_minutes']:null;$detail=$p['known_minutes'].' presenze con minuti';}if($f==='rating'){$value=$p['rated']>=10?$p['rating_sum']/$p['rated']:null;$detail=$p['rated'].' voti';}if($f==='goals90'){$value=$p['minutes']>=900&&$p['known_minutes']===$p['played']?90*$p['goals']/$p['minutes']:null;$detail=$p['minutes'].' minuti completi';}if($value!==null&&$value>0)$rows[]=['label'=>$p['label'],'value'=>$value,'detail'=>$detail,'player_id'=>$p['player_id'],'href'=>'/nexus/record/giocatore/?'.http_build_query(['player'=>$p['player_id']])];}$boards[]=nr_board('player_'.$f,$title,$rows,in_array($f,['minutes','avg_minutes'],true)?'min':'','Stesso ID giocatore aggregato tra i mondi. Minuti solo con estremi documentati; media voto e minuti medi: almeno 10 presenze valide; gol/90: almeno 900 minuti e copertura completa.');}
    }
    return ['boards'=>$boards,'summary'=>$agg['coverage'],'analysis'=>$analysis];
}
