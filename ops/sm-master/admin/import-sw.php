<?php
declare(strict_types=1);

function smm_json_array_objects(string $path, string $key): Generator {
    $fh = fopen($path,'rb'); if (!$fh) throw new RuntimeException('Cannot open JSON.');
    $needle = '"'.$key.'"'; $window=''; $found=false; $inArray=false; $buf=''; $depth=0; $inString=false; $escape=false;
    while (!feof($fh)) {
        $chunk=fread($fh,65536); if ($chunk===false) break;
        $len=strlen($chunk);
        for($i=0;$i<$len;$i++) {
            $ch=$chunk[$i];
            if(!$found){ $window.=$ch; if(strlen($window)>strlen($needle)+16)$window=substr($window,-strlen($needle)-16); if(strpos($window,$needle)!==false)$found=true; continue; }
            if(!$inArray){ if($ch==='['){$inArray=true;} continue; }
            if($depth===0){ if($ch===']'){fclose($fh); return;} if($ch!=='{') continue; $buf='{';$depth=1;$inString=false;$escape=false; continue; }
            $buf.=$ch;
            if($inString){ if($escape){$escape=false;} elseif($ch==='\\'){$escape=true;} elseif($ch==='"'){$inString=false;} continue; }
            if($ch==='"'){$inString=true; continue;} if($ch==='{')$depth++; elseif($ch==='}'){$depth--; if($depth===0){$obj=json_decode($buf,true,512,JSON_THROW_ON_ERROR); yield $obj; $buf='';}}
        }
    }
    fclose($fh); throw new RuntimeException("JSON key $key not found or incomplete.");
}

function smm_json_object_entries(string $path, string $key): Generator {
    $fh=fopen($path,'rb'); if(!$fh) throw new RuntimeException('Cannot open JSON.');
    $needle='"'.$key.'"'; $window=''; $found=false; $inObj=false; $keyBuf=''; $valBuf=''; $state='seek_key'; $inString=false; $escape=false; $depth=0; $currentKey=null;
    while(!feof($fh)){
        $chunk=fread($fh,65536); if($chunk===false)break; $len=strlen($chunk);
        for($i=0;$i<$len;$i++){
            $ch=$chunk[$i];
            if(!$found){$window.=$ch;if(strlen($window)>strlen($needle)+16)$window=substr($window,-strlen($needle)-16);if(strpos($window,$needle)!==false)$found=true;continue;}
            if(!$inObj){if($ch==='{'){$inObj=true;$state='seek_key';}continue;}
            if($state==='seek_key'){if($ch==='}') {fclose($fh);return;} if($ch==='"'){$state='key';$keyBuf='';$escape=false;} continue;}
            if($state==='key'){if($escape){$keyBuf.=$ch;$escape=false;}elseif($ch==='\\'){$escape=true;}elseif($ch==='"'){$currentKey=stripcslashes($keyBuf);$state='seek_colon';}else{$keyBuf.=$ch;}continue;}
            if($state==='seek_colon'){if($ch===':'){$state='seek_value';}continue;}
            if($state==='seek_value'){if(ctype_space($ch))continue;if($ch==='{'){$valBuf='{';$depth=1;$inString=false;$escape=false;$state='value';}else throw new RuntimeException('Unexpected PlayerImages value.');continue;}
            if($state==='value'){$valBuf.=$ch;if($inString){if($escape)$escape=false;elseif($ch==='\\')$escape=true;elseif($ch==='"')$inString=false;continue;}if($ch==='"'){$inString=true;continue;}if($ch==='{')$depth++;elseif($ch==='}'){$depth--;if($depth===0){yield [$currentKey,json_decode($valBuf,true,512,JSON_THROW_ON_ERROR)];$state='after_value';$valBuf='';}}continue;}
            if($state==='after_value'){if($ch===','){$state='seek_key';}elseif($ch==='}') {fclose($fh);return;}continue;}
        }
    }
    fclose($fh); throw new RuntimeException("JSON object key $key not found or incomplete.");
}

function smm_import_sw_json(string $path, string $date, string $filename): array {
    $meta=smm_create_snapshot('soccerwiki',$date,$filename,$path); if($meta['duplicate'])return ['duplicate'=>true]+$meta;
    $snapshot=$meta['snapshot_id']; $db=smm_db(); $phase='soccerwiki_json';
    $defs = [
        'PlayerData'=>['table'=>'sw_players_source','id'=>'player_id','cols'=>['player_id','forename','surname','image_url'],'map'=>fn($r)=>['player_id'=>(int)$r['ID'],'forename'=>(string)$r['Forename'],'surname'=>(string)$r['Surname'],'image_url'=>(string)$r['ImageURL']]],
        'ClubData'=>['table'=>'sw_clubs_source','id'=>'club_id','cols'=>['club_id','name','short_name','image_url'],'map'=>fn($r)=>['club_id'=>(int)$r['ID'],'name'=>(string)$r['Name'],'short_name'=>(string)$r['ShortName'],'image_url'=>(string)$r['ImageURL']]],
        'LeagueData'=>['table'=>'sw_leagues_source','id'=>'league_id','cols'=>['league_id','name','image_url'],'map'=>fn($r)=>['league_id'=>(int)$r['ID'],'name'=>(string)$r['Name'],'image_url'=>(string)$r['ImageURL']]],
        'CupData'=>['table'=>'sw_cups_source','id'=>'cup_id','cols'=>['cup_id','name','image_url'],'map'=>fn($r)=>['cup_id'=>(int)$r['ID'],'name'=>(string)$r['Name'],'image_url'=>(string)$r['ImageURL']]],
        'StadiumData'=>['table'=>'sw_stadiums_source','id'=>'stadium_id','cols'=>['stadium_id','name'],'map'=>fn($r)=>['stadium_id'=>(int)$r['ID'],'name'=>(string)$r['Name']]],
        'ManagerData'=>['table'=>'sw_football_managers_source','id'=>'manager_id','cols'=>['manager_id','forename','surname','image_url'],'map'=>fn($r)=>['manager_id'=>(int)$r['ID'],'forename'=>(string)$r['Forename'],'surname'=>(string)$r['Surname'],'image_url'=>(string)$r['ImageURL']]],
        'InternationalData'=>['table'=>'sw_national_teams_source','id'=>'national_team_id','cols'=>['national_team_id','name','short_name','image_url'],'map'=>fn($r)=>['national_team_id'=>(string)$r['ID'],'name'=>(string)$r['Name'],'short_name'=>(string)$r['ShortName'],'image_url'=>(string)$r['ImageURL']]],
        'InternationalCupData'=>['table'=>'sw_international_cups_source','id'=>'international_cup_id','cols'=>['international_cup_id','name'],'map'=>fn($r)=>['international_cup_id'=>(int)$r['ID'],'name'=>(string)$r['Name']]],
        'AwardData'=>['table'=>'sw_awards_source','id'=>'award_id','cols'=>['award_id','name','image_url'],'map'=>fn($r)=>['award_id'=>(int)$r['ID'],'name'=>(string)$r['Name'],'image_url'=>(string)$r['ImageURL']]],
    ];
    $counts=[];
    try{
        $db->begin_transaction();
        foreach($defs as $jsonKey=>$def){
            $db->query("UPDATE `{$def['table']}` SET active_latest=0"); $rows=[];$n=0;
            foreach(smm_json_array_objects($path,$jsonKey) as $r){
                $row=($def['map'])($r); $row += ['first_seen_date'=>$date,'last_seen_date'=>$date,'first_snapshot_id'=>$snapshot,'last_snapshot_id'=>$snapshot,'active_latest'=>1];
                $rows[]=$row;$n++;
                if(count($rows)>=500){$cols=array_merge($def['cols'],['first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest']);$updates=array_merge(array_diff($def['cols'],[$def['id']]),['last_seen_date','last_snapshot_id','active_latest']);smm_batch_upsert($db,$def['table'],$cols,$rows,$updates);$rows=[];}
            }
            if($rows){$cols=array_merge($def['cols'],['first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest']);$updates=array_merge(array_diff($def['cols'],[$def['id']]),['last_seen_date','last_snapshot_id','active_latest']);smm_batch_upsert($db,$def['table'],$cols,$rows,$updates);} $counts[$jsonKey]=$n;
        }
        $db->query('UPDATE sw_player_images_source SET active_latest=0'); $rows=[];$n=0;
        foreach(smm_json_object_entries($path,'PlayerImages') as [$pid,$r]){
            $rows[]=['player_id'=>(int)$pid,'image_action_url'=>(string)($r['ImageActionURL']??''),'image_action_peak_url'=>(string)($r['ImageActionPeakURL']??''),'image_peak_url'=>(string)($r['ImagePeakURL']??''),'image_youth_url'=>(string)($r['ImageYouthURL']??''),'first_seen_date'=>$date,'last_seen_date'=>$date,'first_snapshot_id'=>$snapshot,'last_snapshot_id'=>$snapshot,'active_latest'=>1];$n++;
            if(count($rows)>=500){smm_batch_upsert($db,'sw_player_images_source',['player_id','image_action_url','image_action_peak_url','image_peak_url','image_youth_url','first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest'],$rows,['image_action_url','image_action_peak_url','image_peak_url','image_youth_url','last_seen_date','last_snapshot_id','active_latest']);$rows=[];}
        }
        if($rows)smm_batch_upsert($db,'sw_player_images_source',['player_id','image_action_url','image_action_peak_url','image_peak_url','image_youth_url','first_seen_date','last_seen_date','first_snapshot_id','last_snapshot_id','active_latest'],$rows,['image_action_url','image_action_peak_url','image_peak_url','image_youth_url','last_seen_date','last_snapshot_id','active_latest']);
        $counts['PlayerImages']=$n; $db->commit(); smm_finish_snapshot($snapshot,$counts); smm_archive_file($path,'soccerwiki',$date,$meta['sha256'],'json');
        return ['duplicate'=>false,'snapshot_id'=>$snapshot,'sha256'=>$meta['sha256'],'counts'=>$counts];
    }catch(Throwable $e){try{$db->rollback();}catch(Throwable $ignore){}smm_fail_snapshot($snapshot,'soccerwiki',$phase,$e);throw $e;}
}
