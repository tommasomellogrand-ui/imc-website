<?php
declare(strict_types=1);
require __DIR__.'/core.php';
require __DIR__.'/import-sm.php';
require __DIR__.'/import-sw.php';
require __DIR__.'/canonical.php';
require __DIR__.'/imc-managers.php';
set_time_limit(0);
ini_set('memory_limit','256M');
try {
    smm_require_auth();
    $action=(string)($_REQUEST['action']??'status');
    if($action==='install'){smm_json(['ok'=>true,'install'=>smm_install_schema(),'counts'=>smm_counts()]);}
    if($action==='status'){smm_json(['ok'=>true,'db_version'=>smm_db()->server_info,'counts'=>smm_counts()]);}
    if($action==='seed_imc_managers'){smm_json(['ok'=>true,'imc_managers'=>smm_seed_imc_managers()]);}
    if($action==='upload_init'){
        $kind=(string)($_POST['kind']??''); if(!in_array($kind,['soccer_manager','soccerwiki'],true))throw new RuntimeException('Invalid source kind.');
        $id=bin2hex(random_bytes(16)); $dir=smm_data_dir().'/.incoming';if(!is_dir($dir))mkdir($dir,0700,true);
        file_put_contents("$dir/$id.meta.json",json_encode(['kind'=>$kind,'filename'=>(string)($_POST['filename']??'source'),'next'=>0,'size'=>(int)($_POST['size']??0)]));
        smm_json(['ok'=>true,'upload_id'=>$id]);
    }
    if($action==='upload_chunk'){
        $id=preg_replace('/[^a-f0-9]/','',(string)($_POST['upload_id']??''));$index=(int)($_POST['index']??-1);$dir=smm_data_dir().'/.incoming';$metaPath="$dir/$id.meta.json";
        if(!is_file($metaPath))throw new RuntimeException('Upload not found.');$meta=json_decode(file_get_contents($metaPath),true,512,JSON_THROW_ON_ERROR);if($index!==(int)$meta['next'])throw new RuntimeException('Unexpected chunk index.');
        if(!isset($_FILES['chunk'])||$_FILES['chunk']['error']!==UPLOAD_ERR_OK)throw new RuntimeException('Chunk upload failed.');$bytes=file_get_contents($_FILES['chunk']['tmp_name']);file_put_contents("$dir/$id.part",$bytes,FILE_APPEND|LOCK_EX);$meta['next']++;file_put_contents($metaPath,json_encode($meta));smm_json(['ok'=>true,'next'=>$meta['next']]);
    }
    if($action==='upload_complete'){
        $id=preg_replace('/[^a-f0-9]/','',(string)($_POST['upload_id']??''));$dir=smm_data_dir().'/.incoming';$metaPath="$dir/$id.meta.json";$part="$dir/$id.part";if(!is_file($metaPath)||!is_file($part))throw new RuntimeException('Upload not found.');$meta=json_decode(file_get_contents($metaPath),true,512,JSON_THROW_ON_ERROR);$actual=filesize($part);if((int)$meta['size']>0&&$actual!==(int)$meta['size'])throw new RuntimeException("File size mismatch: $actual / {$meta['size']}");$ext=$meta['kind']==='soccer_manager'?'xml':'json';$final=smm_data_dir()."/upload_$id.$ext";rename($part,$final);$meta['path']=$final;$meta['sha256']=hash_file('sha256',$final);file_put_contents($metaPath,json_encode($meta));smm_json(['ok'=>true,'upload_id'=>$id,'sha256'=>$meta['sha256'],'bytes'=>$actual]);
    }
    if($action==='import'){
        $id=preg_replace('/[^a-f0-9]/','',(string)($_POST['upload_id']??''));$date=(string)($_POST['snapshot_date']??'');if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date))throw new RuntimeException('Invalid snapshot date.');$metaPath=smm_data_dir()."/.incoming/$id.meta.json";if(!is_file($metaPath))throw new RuntimeException('Upload metadata not found.');$meta=json_decode(file_get_contents($metaPath),true,512,JSON_THROW_ON_ERROR);$path=(string)($meta['path']??'');if(!is_file($path))throw new RuntimeException('Uploaded source file not found.');
        $result=$meta['kind']==='soccer_manager'?smm_import_sm_xml($path,$date,$meta['filename']):smm_import_sw_json($path,$date,$meta['filename']);@unlink($metaPath);smm_json(['ok'=>true,'result'=>$result]);
    }
    if($action==='rebuild'){smm_json(['ok'=>true,'counts'=>smm_rebuild_canonical()]);}
    throw new RuntimeException('Unknown action.');
} catch(Throwable $e){smm_json(['ok'=>false,'error'=>$e->getMessage()],500);}
