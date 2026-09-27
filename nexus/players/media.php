<?php
declare(strict_types=1);

function nexus_player_image_url(?string $value): ?string {
  $value=trim((string)$value);
  if(str_starts_with($value,'//'))$value='https:'.$value;
  $value=preg_replace('~^http://~i','https://',$value);
  return preg_match('~^(https://|/(?!/))~i',$value)?$value:null;
}

function nexus_player_images(int $id,array $global=[],?string $worldImage=null): array {
  $images=[];
  foreach([$global['image_url']??null,$worldImage] as $url){if($url=nexus_player_image_url($url))$images[]=$url;}
  $file=(string)($global['image_file']??'');
  if(preg_match('/^\d+\.(?:png|jpg|jpeg|webp)$/i',$file)&&$id===(int)$file)$images[]='https://cdn.soccerwiki.org/images/player/'.$file;
  if($id>0){$images[]='https://cdn.soccerwiki.org/images/player/'.$id.'.jpg';$images[]='https://cdn.soccerwiki.org/images/player/'.$id.'.png';}
  return array_values(array_unique($images));
}

function nexus_player_identity(PDO $core,array $ids): array {
  $ids=array_values(array_unique(array_filter(array_map('intval',$ids),static fn($id)=>$id>0)));$out=[];
  foreach(array_chunk($ids,400) as $batch){
    $sql='SELECT p.id,p.forename,p.surname,p.image_file,p.image_url,d.full_name,d.position,d.rating,d.age,d.nationality FROM `IMC Player Codex Global` p LEFT JOIN `IMC Player Codex Global Data` d ON d.player_id=p.id WHERE p.id IN ('.implode(',',array_fill(0,count($batch),'?')).')';
    foreach(nexus_rows($core,$sql,$batch) as $p)$out[(int)$p['id']]=$p;
  }
  return $out;
}
