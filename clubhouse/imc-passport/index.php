<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/nexus/core/bootstrap.php';
require dirname(__DIR__).'/scope.php';
header('Cache-Control: no-store, max-age=0');
function pp_e($v):string{return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function pp_slug(string $s):string{$v=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$s);return trim(preg_replace('/[^a-z0-9]+/','-',strtolower($v===false?$s:$v)),'-');}
function pp_image($src):string{$s=trim((string)$src);return preg_match('~^(https?://|/(?!/))~i',$s)?$s:'';}
$person=null;$people=[];$assign=[];$worlds=[];$error=false;
$slug=(string)($_GET['slug']??'');
try{
 $core=nexus_db(nexus_config(),'core');
 $people=nexus_rows($core,'SELECT manager_id,full_name,imc_join_date,face_image_url,bust_image_url FROM `IMC Manager Codex Global` ORDER BY full_name');
 $counts=[];foreach($people as $p){$s=pp_slug($p['full_name']);$counts[$s]=($counts[$s]??0)+1;}
 foreach($people as &$p){$s=pp_slug($p['full_name']);$p['slug']=$s.($counts[$s]>1?'-'.strtolower($p['manager_id']):'');if($p['slug']===$slug)$person=$p;}unset($p);
 if($slug!==''&&!$person)http_response_code(404);
 if($person){
  $worlds=nexus_rows($core,"SELECT `IMC GW` id,`IMC_WORLD_ID` code,`IMC GW Name` name FROM `IMC Game World Codex Global` WHERE `IMC_WORLD_ID` IN ('IMC-001','IMC-002','IMC-003','IMC-004','IMC-005','IMC-006','IMC-007') ORDER BY `IMC_WORLD_ID`");
  $assign=nexus_rows($core,"SELECT a.game_world_id,a.assignment_type,COALESCE(NULLIF(n.name,''),a.team_name) team_name,a.team_id,a.national_team_id,a.start_date,a.end_date FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Game World National Team Mapping` nm ON a.assignment_type='national_team' AND nm.`Game World`=a.game_world_id AND nm.`SM World National Club ID`=a.national_team_id LEFT JOIN `IMC National Team Codex Global` n ON n.id=nm.`National Team ID` WHERE a.manager_id=? ORDER BY a.start_date,a.id",[$person['manager_id']]);
  $assign=array_values(array_filter($assign,fn($a)=>in_array($a['game_world_id'],CLUBHOUSE_WORLDS,true)));
 }
}catch(Throwable $e){error_log('IMC Passport: '.$e->getMessage());http_response_code(503);$error=true;}
$title=$person?$person['full_name'].' · IMC Passport':'IMC Passport';
?>
<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?=pp_e($title)?></title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"><link rel="stylesheet" href="/clubhouse/imc-passport/passport.css?v=1"><script defer src="/clubhouse/imc-passport/passport.js?v=1"></script></head>
<body><header class="top"><a href="/clubhouse/">← Club House</a><a href="/clubhouse/imc-passport/">IMC Passport</a><img src="/site-assets/images/imc-logo.png" alt="IMC"></header><main>
<?php if($error):?><h1>IMC Passport</h1><p>Passaporti temporaneamente non disponibili.</p><a href="">Riprova</a>
<?php elseif($slug!==''&&!$person):?><h1>Passaporto non trovato</h1><a href="/clubhouse/imc-passport/">Tutti i manager</a>
<?php elseif(!$person):?>
<section class="intro"><p class="eyebrow">ITALIAN MASTERS CLUB</p><h1>Ogni manager.<br>Una storia da timbrare.</h1><p>Identità, mondi attraversati e titoli conquistati. Il tuo passaporto IMC.</p></section>
<label class="search-label">Trova un manager<input id="passport-search" type="search" placeholder="Nome, cognome o codice MNG"></label><div class="passport-directory">
<?php foreach($people as $p):$photo=pp_image($p['face_image_url']);?>
<a class="passport-cover" data-name="<?=pp_e($p['full_name'].' '.$p['manager_id'])?>" href="/clubhouse/imc-passport/<?=pp_e($p['slug'])?>/"><span class="cover-top">ITALIAN MASTERS CLUB</span><span class="cover-portrait"><?php if($photo):?><img src="<?=pp_e($photo)?>" alt="" loading="lazy"><?php endif?></span><span class="cover-title">PASSPORT</span><strong><?=pp_e($p['full_name'])?></strong><small><?=pp_e($p['manager_id'])?></small><span class="cover-open">Apri il passaporto ↗</span></a>
<?php endforeach?></div><p id="no-managers" hidden>Nessun manager trovato.</p>
<?php else:?>
<div class="passport-heading"><div><p class="eyebrow">ITALIAN MASTERS CLUB</p><h1><?=pp_e($person['full_name'])?></h1><p>IMC Passport · <?=pp_e($person['manager_id'])?></p></div><a href="/clubhouse/?view=career&amp;manager=<?=pp_e($person['manager_id'])?>">Apri Career ↗</a></div>
<nav class="page-tabs" aria-label="Pagine passaporto"><?php foreach(['identity'=>'Identità','worlds'=>'Mondi','history'=>'Incarichi','honours'=>'Titoli'] as $k=>$v):?><button data-page="<?=pp_e($k)?>" aria-pressed="<?=$k==='identity'?'true':'false'?>"><?=pp_e($v)?></button><?php endforeach?></nav>
<div class="passport-book">
<section class="passport-sheet" id="identity"><div class="sheet-heading"><span>IMC · MANAGER PASSPORT</span><span>01</span></div><div class="identity-layout"><div class="passport-photo"><?php $photo=pp_image($person['bust_image_url']);if($photo):?><img src="<?=pp_e($photo)?>" alt="<?=pp_e($person['full_name'])?>"><?php endif?></div><dl><dt>Nome e cognome / Full name</dt><dd><?=pp_e($person['full_name'])?></dd><dt>Codice / Passport number</dt><dd><?=pp_e($person['manager_id'])?></dd><dt>Ingresso IMC / Member since</dt><dd><?=pp_e($person['imc_join_date']?date('d.m.Y',strtotime($person['imc_join_date'])):'Non disponibile')?></dd><dt>Emesso da / Issued by</dt><dd>Italian Masters Club</dd></dl></div><div class="admission-seal">IMC<br><strong>MEMBER</strong><br><?=pp_e($person['imc_join_date']?:'')?></div><div id="passport-stats" class="passport-stats" aria-live="polite">Caricamento della carriera…</div><p class="souvenir">Passaporto del club · Documento celebrativo</p><div class="machine-lines" aria-hidden="true"><?=pp_e('P<IMC<'.strtoupper(str_replace(' ','<',$person['full_name'])).'<<<<<<<<<<<<<<<<')?><br><?=pp_e($person['manager_id'].'<<<<<<<<ITALIAN<MASTERS<CLUB<<<<')?></div></section>
<section class="passport-sheet" id="worlds" hidden><div class="sheet-heading"><span>VISTI · MONDI DI GIOCO</span><span>02</span></div><h2>I mondi della tua storia</h2><p class="caption">Un timbro per ogni mondo. Le date seguono gli incarichi registrati.</p><div id="world-stamps" class="stamp-grid"></div></section>
<section class="passport-sheet" id="history" hidden><div class="sheet-heading"><span>REGISTRO DEGLI INCARICHI</span><span>03</span></div><h2>Ogni panchina, una tappa.</h2><div id="assignment-history"></div></section>
<section class="passport-sheet" id="honours" hidden><div class="sheet-heading"><span>TITOLI E RICONOSCIMENTI</span><span>04</span></div><h2>Le vittorie restano.</h2><p id="honours-state" class="caption" role="status">Caricamento dei titoli…</p><div id="honour-stamps" class="stamp-grid"></div></section>
</div><div class="page-controls"><button id="previous-page" aria-label="Pagina precedente">←</button><span id="page-number">01 / 04</span><button id="next-page" aria-label="Pagina successiva">→</button></div><p id="passport-warning" role="status"></p>
<script type="application/json" id="passport-data"><?=json_encode(['person'=>$person,'worlds'=>$worlds,'assignments'=>$assign,'today'=>(new DateTimeImmutable('now',new DateTimeZone('Europe/Rome')))->format('Y-m-d')],JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT)?></script>
<?php endif?>
</main><footer>ITALIAN MASTERS CLUB · LA TUA STORIA, MONDO DOPO MONDO.</footer></body></html>